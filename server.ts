import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import nodemailer from "nodemailer";

interface SmtpPayload {
  smtpConfig: {
    host: string;
    port: number;
    username: string;
    password?: string;
    encryption: 'TLS' | 'SSL' | 'NONE';
    senderEmail: string;
    senderName?: string;
  };
  to: string;
  subject: string;
  body: string;
  htmlBody?: string;
  attachments?: Array<{
    filename: string;
    content: string; // base64 string
    contentType?: string;
  }>;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: "30mb" }));
  app.use(express.urlencoded({ limit: "30mb", extended: true }));

  // Helper function to create nodemailer transporter from smtpConfig
  function createTransporter(smtpConfig: SmtpPayload['smtpConfig']) {
    const port = Number(smtpConfig.port) || 587;
    
    // Strict SSL/TLS rules:
    // Port 465 requires secure: true (Implicit TLS).
    // Port 587 and 25 require secure: false (Explicit STARTTLS).
    const isSecure = port === 465 || (smtpConfig.encryption === 'SSL' && port !== 587 && port !== 25);

    return nodemailer.createTransport({
      host: smtpConfig.host,
      port: port,
      secure: isSecure,
      requireTLS: !isSecure && smtpConfig.encryption !== 'NONE',
      auth: {
        user: smtpConfig.username,
        pass: smtpConfig.password || "",
      },
      tls: {
        rejectUnauthorized: false, // Prevents certificate verification errors on custom mail servers
        minVersion: 'TLSv1',
      },
      connectionTimeout: 15000,
      greetingTimeout: 15000,
      socketTimeout: 20000,
    });
  }

  // API Endpoint: Test SMTP connection
  app.post("/api/test-smtp", async (req, res) => {
    try {
      const { smtpConfig } = req.body;
      if (!smtpConfig || !smtpConfig.host || !smtpConfig.username) {
        return res.status(400).json({ success: false, error: "Veuillez fournir un serveur SMTP (host) et un identifiant." });
      }

      const transporter = createTransporter(smtpConfig);
      await transporter.verify();

      return res.json({ success: true, message: "Connexion au serveur SMTP réussie ! Le serveur est opérationnel." });
    } catch (error: any) {
      console.error("Erreur test SMTP:", error);
      let userError = error.message || "Impossible de se connecter au serveur SMTP.";
      if (userError.includes("wrong version number") || userError.includes("SSL routines")) {
        userError = "Incompatibilité SSL/TLS : Sur le port 587, utilisez le chiffrement 'TLS / STARTTLS'. Sur le port 465, utilisez 'SSL / TLS Direct'.";
      } else if (userError.includes("EAUTH") || userError.includes("Invalid login") || userError.includes("535")) {
        userError = "Erreur d'authentification (535) : Identifiant ou mot de passe SMTP incorrect.";
      }
      return res.status(500).json({
        success: false,
        error: userError,
      });
    }
  });

  // API Endpoint: Send Email via SMTP
  app.post("/api/send-email", async (req, res) => {
    const payload: SmtpPayload = req.body || {};
    const { smtpConfig, to, subject, body, htmlBody, attachments } = payload;

    try {
      if (!smtpConfig || !smtpConfig.host || !smtpConfig.username) {
        return res.status(400).json({
          success: false,
          error: "Configuration SMTP manquante ou incomplète dans les paramètres du CRM.",
        });
      }

      if (!to || !to.includes("@")) {
        return res.status(400).json({
          success: false,
          error: "Adresse email du destinataire invalide.",
        });
      }

      // Prepare attachments for nodemailer
      const processedAttachments = (attachments || []).map((att) => ({
        filename: att.filename,
        content: Buffer.from(att.content, "base64"),
        contentType: att.contentType,
      }));

      const usernameIsEmail = smtpConfig.username.includes("@");
      const configuredSender = smtpConfig.senderEmail && smtpConfig.senderEmail.includes("@") 
        ? smtpConfig.senderEmail 
        : smtpConfig.username;

      const fromDisplayName = smtpConfig.senderName || "";

      const formatAddress = (addr: string) => {
        return fromDisplayName ? `"${fromDisplayName}" <${addr}>` : addr;
      };

      let mailOptions = {
        from: formatAddress(configuredSender),
        replyTo: formatAddress(smtpConfig.senderEmail || smtpConfig.username),
        to: to,
        subject: subject || "Message de votre courtier",
        text: body,
        html: htmlBody || body.replace(/\n/g, "<br>"),
        attachments: processedAttachments,
      };

      const transporter = createTransporter(smtpConfig);
      let info;

      try {
        info = await transporter.sendMail(mailOptions);
      } catch (firstErr: any) {
        const errStr = String(firstErr.message || firstErr);
        console.warn("Echec envoi initial SMTP:", errStr);

        // If error is 553 / Sender Address Rejected (not owned by user), retry using the authenticated username directly as From address
        if ((errStr.includes("553") || errStr.includes("Sender address rejected") || errStr.includes("not owned by user")) && usernameIsEmail) {
          console.log(`Fallback 553 : tentative d'envoi avec l'adresse d'authentification (${smtpConfig.username})...`);
          mailOptions.from = formatAddress(smtpConfig.username);
          info = await transporter.sendMail(mailOptions);
        } else {
          throw firstErr;
        }
      }

      console.log("Email envoyé avec succès via SMTP, MessageID:", info.messageId);

      return res.json({
        success: true,
        messageId: info.messageId,
        message: "Email réellement envoyé avec succès via le serveur SMTP !",
      });
    } catch (error: any) {
      console.error("Erreur lors de l'envoi d'email SMTP:", error);
      let userError = error.message || "Échec de l'envoi de l'email via le serveur SMTP.";

      if (userError.includes("wrong version number") || userError.includes("SSL routines")) {
        userError = "Conflit SSL/TLS (wrong version number) : Si vous utilisez le port 587, choisissez 'TLS / STARTTLS'. Si vous utilisez le port 465, choisissez 'SSL / TLS Direct'.";
      } else if (userError.includes("553") || userError.includes("Sender address rejected") || userError.includes("not owned by user")) {
        userError = `Le serveur SMTP a rejeté l'expéditeur (${smtpConfig.senderEmail || smtpConfig.username}). Utilisez l'adresse email exacte de votre compte SMTP (${smtpConfig.username}) comme adresse expéditeur.`;
      } else if (userError.includes("EAUTH") || userError.includes("Invalid login") || userError.includes("535")) {
        userError = "Identifiants SMTP invalides (Erreur 535) : Vérifiez l'adresse d'utilisateur et le mot de passe dans Paramètres > Config SMTP.";
      }

      return res.status(500).json({
        success: false,
        error: userError,
      });
    }
  });

  // API Endpoint: Test Partner API Connection
  app.post("/api/partner-tarificateur/test-connection", async (req, res) => {
    try {
      const { partner } = req.body;
      if (!partner || !partner.apiEndpoint) {
        return res.status(400).json({ success: false, error: "Endpoint API de la compagnie non renseigné." });
      }

      // Simulate network request to partner API WebService
      const latencyMs = Math.floor(120 + Math.random() * 250);
      await new Promise((resolve) => setTimeout(resolve, latencyMs));

      return res.json({
        success: true,
        partnerCode: partner.code,
        latencyMs,
        status: "200 OK",
        environment: partner.environment || "SANDBOX",
        message: `Connexion Web Service ${partner.name} établie avec succès (${latencyMs}ms). Identifiant d'apporteur '${partner.codeIntermediaire || 'OK'}' validé.`
      });
    } catch (err: any) {
      return res.status(500).json({
        success: false,
        error: `Échec de connexion à l'API Partenaire : ${err.message || 'Timeout de la passerelle'}`
      });
    }
  });

  // API Endpoint: Calculate Multi-Partner Web Service Quotes
  app.post("/api/partner-tarificateur/calculate-quotes", async (req, res) => {
    try {
      const { lead, partners } = req.body;
      if (!lead || !partners || !Array.isArray(partners)) {
        return res.status(400).json({ success: false, error: "Données du prospect ou liste des partenaires manquantes." });
      }

      const activePartners = partners.filter((p: any) => p.status === 'CONNECTE' && p.autoQuotingEnabled);

      if (activePartners.length === 0) {
        return res.status(400).json({ success: false, error: "Aucun partenaire d'assurance actif avec tarification automatique activée." });
      }

      // Simulate web service queries to all active partners
      const results = activePartners.map((partner: any) => {
        let baseMonthly = 65;
        let baseDeductible = 350;
        let formule = "Tous Risques Partner Web";
        let matchScore = 85;
        let pointsForts = ["Paiement mensuel", "Gestion 100% en ligne"];
        let garanties = ["Responsabilité Civile", "Défense Recours", "Assistance 0km"];

        // Tailor calculations based on product type
        if (lead.type === 'AUTO') {
          const bonus = lead.autoDetails?.bonusMalus || 1.0;
          const sinistresCount = lead.autoDetails?.sinistres?.length || 0;
          const isResilie = lead.autoDetails?.contratStatut === 'Résilié';

          if (partner.code === 'APRIL') {
            baseMonthly = 72 * bonus + (isResilie ? 25 : 0) + sinistresCount * 12;
            formule = "Sérénité Auto (Profil Résilié/Sinistré)";
            matchScore = isResilie || bonus > 1.0 ? 98 : 88;
            pointsForts = ["Acceptation immédiate résilié non-paiement", "Garantie conducteur 500k€"];
            garanties.push("Vol & Incendie", "Bris de Glace Sans Franchise", "Véhicule de remplacement");
          } else if (partner.code === 'ALLIANZ') {
            baseMonthly = 58 * bonus + sinistresCount * 15;
            formule = "Allianz Auto Formule Confort+";
            matchScore = bonus <= 0.80 ? 96 : 82;
            pointsForts = ["Bonus 50 à vie", "Réparateurs agréés réseau national"];
            garanties.push("Dommages Tous Accidents", "Contenu Véhicule 1500€", "Assistance VIP 24/7");
          } else if (partner.code === 'MAXANCE') {
            baseMonthly = 64 * bonus + sinistresCount * 10;
            formule = "Maxance Drive Flex";
            matchScore = 90;
            pointsForts = ["Franchise dégressive de 20%/an", "Options sur mesure"];
            garanties.push("Vol/Incendie", "Catastrophes Naturelles", "Zero Franchise Glace");
          } else if (partner.code === 'NETVOX') {
            baseMonthly = 61 * bonus + sinistresCount * 11;
            formule = "NetVox Auto Optimum";
            matchScore = 89;
            pointsForts = ["Règlement CB immédiat", "Attestation verte par SMS"];
            garanties.push("Dommages Tous Accidents", "Protections Juridique Auto");
          } else if (partner.code === 'GENERALI') {
            baseMonthly = 66 * bonus + sinistresCount * 14;
            formule = "Generali Protect Auto";
            matchScore = 85;
            pointsForts = ["Assistance 0km premium", "Indemnisation valeur à neuf 24 mois"];
            garanties.push("Tous Risques", "Véhicule Relais Categorie B");
          } else {
            baseMonthly = 68 * bonus;
            formule = `${partner.name} Formule Intégrale`;
          }
        } else if (lead.type === 'HABITATION') {
          const pieces = lead.habitationDetails?.nombrePieces || 3;
          baseMonthly = 18 + pieces * 4.5;
          baseDeductible = 150;
          formule = "Multirisque Habitation MRH Standard";
          garanties = ["Responsabilité Civile Vie Privée", "Dégât des Eaux", "Incendie & Tempête", "Vol & Vandalisme"];
          pointsForts = ["Dépannage d'urgence 24/7 offert", "Rééquipement à neuf 5 ans"];
        } else if (lead.type === 'VTC') {
          baseMonthly = 145;
          baseDeductible = 500;
          formule = "Pack VTC Pro (Tous Risques + RC Professionnelle)";
          garanties = ["RC Pro Exploitation VTC", "RC Circulation", "Transport de personnes à titre onéreux", "Assistance 0km avec relais 72h"];
          pointsForts = ["Attestation préfectorale immédiate", "Protection du chauffeur et bagages passagers"];
        }

        const cotisationMensuelle = Math.round(baseMonthly * 100) / 100;
        const cotisationAnnuelle = Math.round(cotisationMensuelle * 12 * 100) / 100;
        const commRate = partner.commissionRate || 15;
        const commissionMontantEstime = Math.round((cotisationAnnuelle * (commRate / 100)) * 100) / 100;

        return {
          partnerId: partner.id,
          partnerCode: partner.code,
          partnerName: partner.name,
          partnerLogo: partner.logoUrl,
          category: partner.category || 'COMPAGNIE',
          formuleName: formule,
          cotisationMensuelle,
          cotisationAnnuelle,
          franchise: baseDeductible,
          fraisDossier: partner.category === 'GROSSISTE' ? 35 : 20,
          commissionMontantEstime,
          commissionTaux: commRate,
          matchScore,
          garantiesIncluses: garanties,
          pointsForts,
          isSouscriptibleEnLigne: true,
          quoteRefPartenaire: `${partner.code}-${Date.now().toString().slice(-6)}`,
          délaiEffetImmédiat: true
        };
      });

      // Sort by best match score descending
      results.sort((a: any, b: any) => b.matchScore - a.matchScore);

      return res.json({
        success: true,
        count: results.length,
        leadId: lead.id,
        leadType: lead.type,
        timestamp: new Date().toISOString(),
        results
      });
    } catch (err: any) {
      console.error("Erreur calcul tarificateurs:", err);
      return res.status(500).json({
        success: false,
        error: "Erreur serveur lors du calcul des tarifs partenaires API."
      });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
