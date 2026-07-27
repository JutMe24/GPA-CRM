import React, { useState } from 'react';
import { 
  X, 
  Car, 
  Home, 
  Briefcase, 
  Phone, 
  Mail, 
  MapPin, 
  Calendar, 
  Clock, 
  FileText, 
  Send, 
  Printer, 
  Edit3, 
  Trash2, 
  CheckCircle2, 
  AlertTriangle, 
  ShieldCheck, 
  Euro,
  UserCheck,
  MessageSquare,
  Sparkles,
  History,
  Plus,
  ShieldAlert,
  FileCheck,
  Paperclip,
  Upload,
  ExternalLink,
  FileUp,
  AlertCircle,
  Download
} from 'lucide-react';
import { Lead, LeadStatus, EmailTemplate, CabinetInfo, ActivityLogItem, NoteItem, LeadType, SmtpConfig, User as UserType, InsurancePartnerApiConfig, PartnerTarifResult } from '../types/crm';
import { generateProfessionalQuoteText, getGuaranteesList, getQuotePricing, getLeadCivility as civilityHelper } from '../utils/quoteGenerator';
import { PartnerMultiTarificateur } from './PartnerMultiTarificateur';

interface EmailAttachmentItem {
  id: string;
  name: string;
  size: number;
}

interface LeadDetailsViewProps {
  lead: Lead | null;
  onClose: () => void;
  onEditLead: (lead: Lead) => void;
  onDeleteLead: (leadId: string) => void;
  onUpdateStatus: (leadId: string, status: LeadStatus) => void;
  emailTemplates: EmailTemplate[];
  cabinetInfo: CabinetInfo;
  smtpConfig: SmtpConfig;
  onUpdateLead?: (lead: Lead) => void;
  onSaveEmailTemplates?: (tmpls: EmailTemplate[]) => void;
  users?: UserType[];
  currentUser?: UserType;
  partners?: InsurancePartnerApiConfig[];
}

export const LeadDetailsView: React.FC<LeadDetailsViewProps> = ({
  lead,
  onClose,
  onEditLead,
  onDeleteLead,
  onUpdateStatus,
  emailTemplates,
  cabinetInfo,
  smtpConfig,
  onUpdateLead,
  onSaveEmailTemplates,
  users = [],
  currentUser,
  partners = []
}) => {
  if (!lead) return null;

  // Filter selectable users based on permissions and team
  const selectableUsers = React.useMemo(() => {
    if (!users || users.length === 0) return [];
    const active = users.filter(u => u.status === 'ACTIF');
    if (!currentUser) return active;

    if (currentUser.role === 'ADMIN' || currentUser.role === 'DIRECTEUR_PRODUCTION') {
      return active;
    }

    if (currentUser.role === 'RESPONSABLE_EQUIPE' || currentUser.role === 'MANAGER') {
      const userTeam = (currentUser.equipe || '').toLowerCase();
      return active.filter(u =>
        u.id === currentUser.id ||
        (u.equipe && userTeam && u.equipe.toLowerCase() === userTeam)
      );
    }

    if (currentUser.permissions?.canAssignLeads) {
      if (currentUser.equipe) {
        const userTeam = currentUser.equipe.toLowerCase();
        return active.filter(u => u.equipe && u.equipe.toLowerCase() === userTeam);
      }
      return active;
    }

    return active.filter(u => u.id === currentUser.id);
  }, [users, currentUser]);

  const canReassignLead = Boolean(
    currentUser && (
      currentUser.role === 'ADMIN' ||
      currentUser.role === 'DIRECTEUR_PRODUCTION' ||
      currentUser.role === 'RESPONSABLE_EQUIPE' ||
      currentUser.role === 'MANAGER' ||
      currentUser.permissions?.canAssignLeads
    )
  );

  const handleReassignAgent = (newAgentName: string) => {
    if (!newAgentName || !lead || !onUpdateLead) return;
    const matchedUser = users?.find(u => `${u.prenom} ${u.nom}` === newAgentName);
    const newEquipe = matchedUser?.equipe || lead.equipe || currentUser?.equipe || '';

    const timestamp = new Date().toLocaleDateString('fr-FR') + ' à ' + new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

    const newActivity: ActivityLogItem = {
      id: 'act-reassign-' + Date.now(),
      type: 'LEAD_UPDATED',
      title: `Réattribution du lead`,
      description: `Lead réattribué à ${newAgentName}${newEquipe ? ` (Équipe : ${newEquipe})` : ''} par ${currentUser?.prenom || ''} ${currentUser?.nom || 'Admin'}.`,
      author: `${currentUser?.prenom || ''} ${currentUser?.nom || 'Système'}`.trim(),
      date: timestamp
    };

    const updatedLead: Lead = {
      ...lead,
      assignedBroker: newAgentName,
      attribueA: newAgentName,
      equipe: newEquipe,
      historyLogs: [newActivity, ...(lead.historyLogs || [])],
      updatedAt: new Date().toISOString()
    };

    onUpdateLead(updatedLead);
  };

  const [activeDetailTab, setActiveDetailTab] = useState<'details' | 'history'>('details');
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [showDeleteLeadModal, setShowDeleteLeadModal] = useState(false);
  const [showQuotePreview, setShowQuotePreview] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(
    emailTemplates.find(t => t.type === lead.type)?.id || emailTemplates[0]?.id || ''
  );

  // Email subject and body state for custom editing
  const [customEmailSubject, setCustomEmailSubject] = useState<string>('');
  const [customEmailBody, setCustomEmailBody] = useState<string>('');
  const [emailSuccessMsg, setEmailSuccessMsg] = useState(false);
  const [emailSendMethod, setEmailSendMethod] = useState<'MAILTO' | 'DIRECT'>('DIRECT');

  // Direct SMTP status state
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [smtpErrorMsg, setSmtpErrorMsg] = useState<string | null>(null);

  // Pièces jointes (Attachments) state
  const [attachments, setAttachments] = useState<EmailAttachmentItem[]>([]);
  const [attachmentFiles, setAttachmentFiles] = useState<File[]>([]);
  const [includePdfQuote, setIncludePdfQuote] = useState(false);

  // Inline Template Creator state
  const [showNewTemplateForm, setShowNewTemplateForm] = useState(false);
  const [newTmplName, setNewTmplName] = useState('');
  const [newTmplSubject, setNewTmplSubject] = useState('');
  const [newTmplBody, setNewTmplBody] = useState('');
  const [newTmplType, setNewTmplType] = useState<LeadType | 'GENERAL'>(lead.type || 'GENERAL');

  // Quick Note & Relance Schedule state
  const [quickNoteText, setQuickNoteText] = useState('');
  const [quickActionTitle, setQuickActionTitle] = useState(lead.prochaineActionIntitule || 'Relance devis');
  const [quickActionDate, setQuickActionDate] = useState(lead.prochaineActionDate || new Date().toISOString().split('T')[0]);
  const [quickActionHeure, setQuickActionHeure] = useState(lead.prochaineActionHeure || '15:00');
  const [noteSavedMsg, setNoteSavedMsg] = useState(false);

  // Helper for status badge styling
  const getStatusBadge = (status: LeadStatus) => {
    switch (status) {
      case 'NOUVEAU':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'A_CONTACTER':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'DEVIS_ENVOYE':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'RELANCE':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'GAGNE':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'PERDU':
        return 'bg-rose-100 text-rose-800 border-rose-200';
      default:
        return 'bg-slate-100 text-slate-800';
    }
  };

  // Helper to get formula and cotisation
  let formulaName = 'Non définie';
  let cotisationAn = 0;
  let fractionnement = 'Mensuel';
  let fraisDossier = 0;
  let optionsList: string[] = [];

  if (lead.type === 'AUTO' && lead.autoDetails) {
    formulaName = lead.autoDetails.formuleSouhaitee;
    cotisationAn = lead.autoDetails.cotisationMontant;
    fractionnement = lead.autoDetails.fractionnement;
    fraisDossier = lead.autoDetails.fraisDossier;
    optionsList = lead.autoDetails.optionsSupplementaires;
  } else if (lead.type === 'HABITATION' && lead.habitationDetails) {
    formulaName = lead.habitationDetails.formuleSouhaitee;
    cotisationAn = lead.habitationDetails.cotisationMontant;
    fractionnement = lead.habitationDetails.fractionnement;
    fraisDossier = lead.habitationDetails.fraisDossier;
    optionsList = lead.habitationDetails.optionsSupplementaires;
  } else if (lead.type === 'VTC' && lead.vtcDetails) {
    formulaName = lead.vtcDetails.formuleSouhaitee;
    cotisationAn = lead.vtcDetails.cotisationMontant;
    fractionnement = lead.vtcDetails.fractionnement;
    fraisDossier = lead.vtcDetails.fraisDossier;
    optionsList = lead.vtcDetails.optionsSupplementaires;
  }

  const cotisationMois = Math.round(cotisationAn / 12);

  const getLeadCivility = (targetLead?: Lead): string => {
    const l = targetLead || lead;
    const civ = l.civilite || l.autoDetails?.civilite || l.habitationDetails?.civilite || l.vtcDetails?.civilite || '';
    if (civ === 'Mr') return 'Monsieur';
    if (civ === 'Mme') return 'Madame';
    return 'M./Mme';
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(0) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const handleFileAttachmentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const fileList: File[] = Array.from(e.target.files);
    const newItems: EmailAttachmentItem[] = fileList.map((f: File) => ({
      id: 'att-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      name: f.name,
      size: f.size
    }));
    setAttachments(prev => [...prev, ...newItems]);
    setAttachmentFiles(prev => [...prev, ...fileList]);
  };

  const handleRemoveAttachment = (id: string, index: number) => {
    setAttachments(prev => prev.filter(a => a.id !== id));
    setAttachmentFiles(prev => prev.filter((_, i) => i !== index));
  };

  // Initialize custom email content whenever template changes or email modal opens
  const populateEmailContent = (templateId: string) => {
    const tmpl = emailTemplates.find(t => t.id === templateId) || emailTemplates[0];
    if (!tmpl) return;

    const civilityStr = getLeadCivility();

    let subject = tmpl.subject;
    subject = subject.replace(/{civilite}/g, civilityStr);
    subject = subject.replace(/{prenom}/g, lead.prenom);
    subject = subject.replace(/{nom}/g, lead.nom);
    subject = subject.replace(/{referenceDevis}/g, lead.referenceDevis);
    subject = subject.replace(/{nomCabinet}/g, cabinetInfo.nomCabinet);

    let body = tmpl.body;
    body = body.replace(/{civilite}/g, civilityStr);
    body = body.replace(/{prenom}/g, lead.prenom);
    body = body.replace(/{nom}/g, lead.nom);
    body = body.replace(/{referenceDevis}/g, lead.referenceDevis);
    body = body.replace(/{formule}/g, formulaName);
    body = body.replace(/{cotisation}/g, cotisationAn.toString());
    body = body.replace(/{cotisationMois}/g, cotisationMois.toString());
    body = body.replace(/{fractionnement}/g, fractionnement);
    body = body.replace(/{fraisDossier}/g, fraisDossier.toString());
    body = body.replace(/{telephoneCabinet}/g, cabinetInfo.telephone);
    body = body.replace(/{nomCourtier}/g, lead.assignedBroker || cabinetInfo.nomCourtierPrincipal);
    body = body.replace(/{nomCabinet}/g, cabinetInfo.nomCabinet);
    body = body.replace(/{numeroOrias}/g, cabinetInfo.numeroOrias);

    let immat = 'N/A';
    let marqueModele = 'Véhicule';
    if (lead.type === 'AUTO' && lead.autoDetails) {
      immat = lead.autoDetails.immatriculation;
      marqueModele = lead.autoDetails.marqueModele || 'Véhicule';
    } else if (lead.type === 'VTC' && lead.vtcDetails) {
      immat = lead.vtcDetails.immatriculation;
      marqueModele = lead.vtcDetails.marqueModele || 'Véhicule VTC';
    }
    body = body.replace(/{immatriculation}/g, immat);
    body = body.replace(/{marqueModele}/g, marqueModele);

    const formattedOpts = optionsList.map(o => ` • ${o}`).join('\n');
    body = body.replace(/{options}/g, formattedOpts || ' • Aucune option spécifique');

    setCustomEmailSubject(subject);
    setCustomEmailBody(body);
  };

  const handleOpenEmailModal = () => {
    populateEmailContent(selectedTemplateId);
    setAttachments([]);
    setAttachmentFiles([]);
    setIncludePdfQuote(false);
    setShowNewTemplateForm(false);
    setSmtpErrorMsg(null);
    setIsSendingEmail(false);
    setShowEmailModal(true);
  };

  const handleSaveInlineTemplate = () => {
    if (!newTmplName.trim() || !newTmplSubject.trim()) return;
    const created: EmailTemplate = {
      id: 'tmpl-' + Date.now(),
      name: newTmplName.trim(),
      subject: newTmplSubject.trim(),
      type: newTmplType,
      body: newTmplBody || `Bonjour {civilite} {nom},\n\nVoici votre devis d'assurance {referenceDevis}.\n\nCordialement,\n{nomCourtier}\n{nomCabinet}`,
      updatedAt: new Date().toISOString().split('T')[0]
    };

    const updatedList = [...emailTemplates, created];
    if (onSaveEmailTemplates) {
      onSaveEmailTemplates(updatedList);
    }
    setSelectedTemplateId(created.id);
    populateEmailContent(created.id);
    setShowNewTemplateForm(false);
    setNewTmplName('');
    setNewTmplSubject('');
    setNewTmplBody('');
  };

  const handlePrintQuote = () => {
    const printableElement = document.getElementById('printable-quote');
    if (!printableElement) {
      window.print();
      return;
    }

    try {
      const printWin = window.open('', '_blank', 'width=1000,height=900');
      if (printWin) {
        printWin.document.write(`
          <!DOCTYPE html>
          <html lang="fr">
            <head>
              <meta charset="UTF-8">
              <title>Devis Assurances N° ${lead.referenceDevis} - ${lead.nom}</title>
              <script src="https://cdn.tailwindcss.com"></script>
              <style>
                body { margin: 0; padding: 24px; font-family: system-ui, -apple-system, sans-serif; background: #ffffff; color: #0f172a; }
                @media print {
                  body { padding: 0; }
                  .no-print { display: none !important; }
                }
              </style>
            </head>
            <body>
              <div class="max-w-4xl mx-auto space-y-6">
                ${printableElement.innerHTML}
              </div>
              <script>
                window.onload = function() {
                  setTimeout(function() {
                    window.print();
                  }, 400);
                };
              </script>
            </body>
          </html>
        `);
        printWin.document.close();
      } else {
        window.print();
      }
    } catch (err) {
      console.error('Print window error:', err);
      window.print();
    }
  };

  const handleDownloadQuoteHTML = () => {
    const printableElement = document.getElementById('printable-quote');
    if (!printableElement) return;

    const fullHtml = `
      <!DOCTYPE html>
      <html lang="fr">
        <head>
          <meta charset="UTF-8">
          <title>Devis Assurances N° ${lead.referenceDevis} - ${cabinetInfo.nomCabinet}</title>
          <script src="https://cdn.tailwindcss.com"></script>
          <style>
            body { font-family: system-ui, -apple-system, sans-serif; background-color: #f8fafc; padding: 20px; color: #0f172a; }
            .devis-card { max-width: 56rem; margin: 0 auto; background: #ffffff; border-radius: 1rem; border: 1px solid #e2e8f0; padding: 2rem; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1); }
            @media print {
              body { background: white; padding: 0; }
              .devis-card { border: none; shadow: none; padding: 0; }
            }
          </style>
        </head>
        <body>
          <div class="devis-card space-y-6">
            ${printableElement.innerHTML}
          </div>
        </body>
      </html>
    `;

    const blob = new Blob([fullHtml], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Devis_${lead.referenceDevis}_${lead.nom.replace(/\s+/g, '_')}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleDownloadQuoteTxt = () => {
    const txtContent = generateProfessionalQuoteText(lead, cabinetInfo);
    const blob = new Blob([txtContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Devis_${lead.referenceDevis}_${lead.nom.replace(/\s+/g, '_')}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const res = reader.result as string;
        const base64 = res.includes(',') ? res.split(',')[1] : res;
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleSendEmailAction = async (method: 'MAILTO' | 'DIRECT') => {
    setSmtpErrorMsg(null);

    const timestamp = new Date().toLocaleDateString('fr-FR') + ' à ' + new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

    const attachedNames: string[] = [];
    if (includePdfQuote) {
      attachedNames.push(`Devis_Officiel_${lead.referenceDevis}.pdf`);
    }
    attachments.forEach(a => attachedNames.push(a.name));

    const attSummary = attachedNames.length > 0
      ? `\n📎 Pièces jointes (${attachedNames.length}) : ${attachedNames.join(', ')}`
      : '';

    if (method === 'MAILTO') {
      onUpdateStatus(lead.id, 'DEVIS_ENVOYE');
      const methodTitle = `Ouverture Client Mail : ${customEmailSubject}`;

      const newActivity: ActivityLogItem = {
        id: 'act-' + Date.now(),
        type: 'EMAIL_SENT',
        title: methodTitle,
        description: customEmailBody + attSummary,
        author: cabinetInfo.nomCourtierPrincipal || 'Courtier',
        date: timestamp,
        metadata: {
          emailSubject: customEmailSubject,
          emailRecipient: lead.email,
          pdfName: attachedNames.join(', ')
        }
      };

      const newNote: NoteItem = {
        id: 'note-' + Date.now(),
        author: cabinetInfo.nomCourtierPrincipal || 'Courtier',
        date: timestamp,
        content: `[Ouverture Mailto le ${timestamp}] Sujet : ${customEmailSubject}${attSummary}`
      };

      const updatedLead: Lead = {
        ...lead,
        status: 'DEVIS_ENVOYE',
        notes: [newNote, ...(lead.notes || [])],
        historyLogs: [newActivity, ...(lead.historyLogs || [])],
        updatedAt: new Date().toISOString()
      };

      if (onUpdateLead) {
        onUpdateLead(updatedLead);
      }

      const mailtoUrl = `mailto:${lead.email}?subject=${encodeURIComponent(customEmailSubject)}&body=${encodeURIComponent(customEmailBody)}`;
      window.location.href = mailtoUrl;

      setEmailSendMethod('MAILTO');
      setEmailSuccessMsg(true);

      setTimeout(() => {
        setEmailSuccessMsg(false);
        setShowEmailModal(false);
      }, 2800);

      return;
    }

    // DIRECT SMTP METHOD
    if (!smtpConfig || !smtpConfig.host || !smtpConfig.username) {
      setSmtpErrorMsg("⚠️ Votre serveur SMTP n'est pas configuré ! Veuillez renseigner le serveur SMTP, le port et le mot de passe dans les Paramètres du CRM.");
      return;
    }

    setIsSendingEmail(true);

    try {
      const attachmentsToSend: { filename: string; content: string; contentType?: string }[] = [];

      // 1. Include generated Quote PDF if checked
      if (includePdfQuote) {
        const quoteText = generateProfessionalQuoteText(lead, cabinetInfo);
        const quoteBase64 = btoa(unescape(encodeURIComponent(quoteText)));
        attachmentsToSend.push({
          filename: `Devis_Officiel_${lead.referenceDevis}.pdf`,
          content: quoteBase64,
          contentType: 'application/pdf'
        });
      }

      // 2. Include user uploaded files
      for (const file of attachmentFiles) {
        const b64 = await fileToBase64(file);
        attachmentsToSend.push({
          filename: file.name,
          content: b64,
          contentType: file.type || 'application/octet-stream'
        });
      }

      const response = await fetch('/api/send-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          smtpConfig,
          to: lead.email,
          subject: customEmailSubject,
          body: customEmailBody,
          attachments: attachmentsToSend
        })
      });

      const data = await response.json();

      if (!data.success) {
        setIsSendingEmail(false);
        setSmtpErrorMsg(`❌ Échec d'envoi SMTP : ${data.error || 'Erreur inconnue lors de l\'envoi'}`);
        return;
      }

      // Successful Direct SMTP dispatch
      setIsSendingEmail(false);
      onUpdateStatus(lead.id, 'DEVIS_ENVOYE');

      const newActivity: ActivityLogItem = {
        id: 'act-' + Date.now(),
        type: 'EMAIL_SENT',
        title: `Email direct SMTP envoyé : ${customEmailSubject}`,
        description: `Envoyé via ${smtpConfig.host} à <${lead.email}>\n\n${customEmailBody}${attSummary}`,
        author: cabinetInfo.nomCourtierPrincipal || 'Courtier',
        date: timestamp,
        metadata: {
          emailSubject: customEmailSubject,
          emailRecipient: lead.email,
          pdfName: attachedNames.join(', ')
        }
      };

      const newNote: NoteItem = {
        id: 'note-' + Date.now(),
        author: cabinetInfo.nomCourtierPrincipal || 'Courtier',
        date: timestamp,
        content: `[Email SMTP Envoyé le ${timestamp}] Destinataire : ${lead.email} | Sujet : ${customEmailSubject}${attSummary}`
      };

      const updatedLead: Lead = {
        ...lead,
        status: 'DEVIS_ENVOYE',
        notes: [newNote, ...(lead.notes || [])],
        historyLogs: [newActivity, ...(lead.historyLogs || [])],
        updatedAt: new Date().toISOString()
      };

      if (onUpdateLead) {
        onUpdateLead(updatedLead);
      }

      setEmailSendMethod('DIRECT');
      setEmailSuccessMsg(true);

      setTimeout(() => {
        setEmailSuccessMsg(false);
        setShowEmailModal(false);
      }, 3500);

    } catch (err: any) {
      setIsSendingEmail(false);
      setSmtpErrorMsg(`❌ Erreur réseau lors de la communication avec le serveur SMTP : ${err.message || String(err)}`);
    }
  };

  const handleAddQuickNoteAndRelance = () => {
    if (!quickNoteText.trim() && !quickActionTitle) return;

    const timestamp = new Date().toLocaleDateString('fr-FR') + ' à ' + new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

    const newActivities: ActivityLogItem[] = [];

    if (quickNoteText.trim()) {
      newActivities.push({
        id: 'act-note-' + Date.now(),
        type: 'NOTE_ADDED',
        title: 'Note ajoutée au dossier',
        description: quickNoteText.trim(),
        author: cabinetInfo.nomCourtierPrincipal || 'Courtier',
        date: timestamp
      });
    }

    if (quickActionDate) {
      newActivities.push({
        id: 'act-rem-' + Date.now(),
        type: 'REMINDER_SET',
        title: `Rappel programmé : ${quickActionTitle}`,
        description: `Rappel fixé au ${quickActionDate} à ${quickActionHeure}`,
        author: cabinetInfo.nomCourtierPrincipal || 'Courtier',
        date: timestamp
      });
    }

    const createdNoteItem: NoteItem | null = quickNoteText.trim()
      ? {
          id: 'note-' + Date.now(),
          author: cabinetInfo.nomCourtierPrincipal || 'Courtier',
          date: timestamp,
          content: quickNoteText.trim()
        }
      : null;

    const updatedNotes = createdNoteItem
      ? [createdNoteItem, ...(lead.notes || [])]
      : lead.notes;

    const updatedLead: Lead = {
      ...lead,
      notes: updatedNotes,
      prochaineActionIntitule: quickActionTitle,
      prochaineActionDate: quickActionDate,
      prochaineActionHeure: quickActionHeure,
      historyLogs: [...newActivities, ...(lead.historyLogs || [])],
      updatedAt: new Date().toISOString()
    };

    if (onUpdateLead) {
      onUpdateLead(updatedLead);
    }

    setQuickNoteText('');
    setNoteSavedMsg(true);
    setTimeout(() => setNoteSavedMsg(false), 2000);
  };

  // Compile history logs including initial creation if empty
  const historyList: ActivityLogItem[] = lead.historyLogs && lead.historyLogs.length > 0
    ? lead.historyLogs
    : [
        {
          id: 'init-1',
          type: 'LEAD_CREATED',
          title: 'Lead créé dans le CRM',
          description: `Prospect ${lead.prenom} ${lead.nom} enregistré en formule ${formulaName}.`,
          author: lead.assignedBroker || 'Système CRM',
          date: new Date(lead.createdAt).toLocaleDateString('fr-FR') + ' à ' + new Date(lead.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
        }
      ];

  const handleApplyPartnerQuote = (quoteResult: PartnerTarifResult) => {
    if (!onUpdateLead) return;

    let updatedLead: Lead = { ...lead };

    if (lead.type === 'AUTO' && lead.autoDetails) {
      updatedLead = {
        ...lead,
        autoDetails: {
          ...lead.autoDetails,
          formuleSouhaitee: quoteResult.formuleName,
          cotisationMontant: quoteResult.cotisationAnnuelle,
          fraisDossier: quoteResult.fraisDossier
        }
      };
    } else if (lead.type === 'HABITATION' && lead.habitationDetails) {
      updatedLead = {
        ...lead,
        habitationDetails: {
          ...lead.habitationDetails,
          formuleSouhaitee: quoteResult.formuleName,
          cotisationMontant: quoteResult.cotisationAnnuelle,
          fraisDossier: quoteResult.fraisDossier
        }
      };
    } else if (lead.type === 'VTC' && lead.vtcDetails) {
      updatedLead = {
        ...lead,
        vtcDetails: {
          ...lead.vtcDetails,
          formuleSouhaitee: quoteResult.formuleName,
          cotisationMontant: quoteResult.cotisationAnnuelle,
          fraisDossier: quoteResult.fraisDossier
        }
      };
    }

    const newActivity: ActivityLogItem = {
      id: 'act-partner-quote-' + Date.now(),
      type: 'STATUS_CHANGED',
      title: `Tarif Partenaire retenu : ${quoteResult.partnerName}`,
      description: `Offre ${quoteResult.formuleName} appliquée à ${quoteResult.cotisationMensuelle}€/mois (${quoteResult.cotisationAnnuelle}€/an). Réf Partenaire : ${quoteResult.quoteRefPartenaire}`,
      author: cabinetInfo.nomCourtierPrincipal || 'Courtier',
      date: new Date().toLocaleDateString('fr-FR') + ' à ' + new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
    };

    updatedLead.historyLogs = [newActivity, ...(updatedLead.historyLogs || [])];
    onUpdateLead(updatedLead);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[94vh] my-auto">
        
        {/* Top Sticky Bar */}
        <div className="bg-slate-900 text-white p-5 flex flex-wrap items-center justify-between gap-4 border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className={`p-3 rounded-2xl ${
              lead.type === 'AUTO' ? 'bg-blue-600' :
              lead.type === 'HABITATION' ? 'bg-emerald-600' :
              'bg-amber-600'
            } text-white shadow-lg`}>
              {lead.type === 'AUTO' && <Car className="w-6 h-6" />}
              {lead.type === 'HABITATION' && <Home className="w-6 h-6" />}
              {lead.type === 'VTC' && <Briefcase className="w-6 h-6" />}
            </div>

            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-xl font-bold">
                  {lead.prenom} {lead.nom}
                </h3>
                <span className="font-mono text-xs text-slate-400 bg-slate-800 px-2 py-0.5 rounded">
                  {lead.referenceDevis}
                </span>
              </div>
              <p className="text-xs text-slate-300 flex items-center gap-2 mt-0.5">
                <span>{lead.ville} ({lead.codePostal})</span>
                <span>•</span>
                <span>Qualif: 🔥 {lead.qualification}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => onEditLead(lead)}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-lg border border-slate-700 transition flex items-center gap-1.5"
            >
              <Edit3 className="w-3.5 h-3.5 text-blue-400" />
              <span>Éditer</span>
            </button>

            <button
              onClick={handleOpenEmailModal}
              className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg shadow-md flex items-center gap-1.5 transition cursor-pointer"
            >
              <Mail className="w-3.5 h-3.5" />
              <span>Envoyer un email</span>
            </button>

            <button
              onClick={() => setShowQuotePreview(true)}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-lg border border-slate-700 transition flex items-center gap-1.5"
            >
              <Printer className="w-3.5 h-3.5 text-emerald-400" />
              <span>Imprimer Devis</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Status Quick Bar */}
        <div className="bg-slate-100 px-6 py-2.5 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center space-x-2">
            <span className="font-bold text-slate-600 uppercase text-[10px] tracking-wider">Statut Actuel :</span>
            <span className={`px-2.5 py-0.5 rounded-full font-bold border ${getStatusBadge(lead.status)}`}>
              {lead.status.replace('_', ' ')}
            </span>
          </div>

          <div className="flex items-center space-x-1">
            <span className="font-bold text-slate-600 text-[10px] uppercase mr-1">Changer Statut :</span>
            {(['NOUVEAU', 'A_CONTACTER', 'DEVIS_ENVOYE', 'RELANCE', 'GAGNE', 'PERDU'] as LeadStatus[]).map((st) => (
              <button
                key={st}
                onClick={() => onUpdateStatus(lead.id, st)}
                className={`px-2 py-1 rounded text-[10px] font-bold transition ${
                  lead.status === st
                    ? 'bg-slate-900 text-white shadow'
                    : 'bg-white hover:bg-slate-200 text-slate-700 border border-slate-200'
                }`}
              >
                {st.substring(0, 7)}
              </button>
            ))}
          </div>
        </div>

        {/* Agent Attribution & Team Quick Bar */}
        <div className="bg-indigo-900 text-indigo-100 px-6 py-2.5 border-b border-indigo-950 flex flex-wrap items-center justify-between gap-3 text-xs shadow-inner">
          <div className="flex items-center space-x-3">
            <div className="flex items-center gap-1.5 font-bold text-white bg-indigo-800/80 px-2.5 py-1 rounded-md border border-indigo-700/60">
              <UserCheck className="w-3.5 h-3.5 text-indigo-300" />
              <span>Agent Attribué :</span>
            </div>
            <span className="font-extrabold text-white text-sm">
              {lead.attribueA || lead.assignedBroker || 'Non attribué'}
            </span>
            {lead.equipe && (
              <span className="text-[11px] font-semibold text-indigo-200 bg-indigo-800/50 px-2 py-0.5 rounded border border-indigo-700/40">
                Équipe : {lead.equipe}
              </span>
            )}
          </div>

          {canReassignLead && (
            <div className="flex items-center space-x-2">
              <span className="font-bold text-indigo-200 text-[11px] uppercase tracking-wider">
                {currentUser?.role === 'RESPONSABLE_EQUIPE' ? 'Réassigner (mon équipe) :' : 'Réassigner :' }
              </span>
              <select
                value={lead.attribueA || lead.assignedBroker || ''}
                onChange={(e) => handleReassignAgent(e.target.value)}
                className="px-3 py-1 bg-white text-slate-900 font-bold text-xs rounded-lg border border-indigo-300 focus:ring-2 focus:ring-indigo-400 outline-none cursor-pointer shadow-sm"
              >
                <option value="">-- Sélectionner Agent --</option>
                {selectableUsers.map((u) => (
                  <option key={u.id} value={`${u.prenom} ${u.nom}`}>
                    {u.prenom} {u.nom} ({u.role === 'AGENT_COMMERCIAL' ? 'Agent' : u.role === 'RESPONSABLE_EQUIPE' ? 'Resp. Équipe' : u.role}) {u.equipe ? `— ${u.equipe}` : ''}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Content Details */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">

          {/* Key Proposition Summary Banner */}
          <div className="p-5 bg-gradient-to-r from-blue-50 via-indigo-50 to-slate-50 border border-blue-200/80 rounded-2xl grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700">Formule Choisie</span>
              <p className="text-base font-extrabold text-blue-950 mt-0.5">{formulaName}</p>
              <span className="text-xs text-slate-500">{fractionnement}</span>
            </div>

            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">Cotisation Annuelle</span>
              <p className="text-2xl font-black text-emerald-800 mt-0.5">{cotisationAn.toLocaleString('fr-FR')} €</p>
              <span className="text-xs font-semibold text-emerald-700">soit {cotisationMois} € / mois</span>
            </div>

            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600">Frais de Dossier</span>
              <p className="text-lg font-bold text-slate-800 mt-0.5">{fraisDossier} € TTC</p>
              <span className="text-xs text-slate-500">Inclus à la souscription</span>
            </div>
          </div>

          {/* Partner API Web Services Multi-Tarificateur Widget */}
          <PartnerMultiTarificateur
            lead={lead}
            partners={partners}
            onApplyQuoteToLead={handleApplyPartnerQuote}
          />

          {/* Details Section by Product */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            {/* Left Box: Client Contact & Specific Specs */}
            <div className="space-y-4">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider border-b border-slate-200 pb-2 flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-blue-600" />
                  Coordonnées Prospect
                </h4>

                <div className="space-y-2 text-xs">
                  <div className="flex items-center gap-2 text-slate-700">
                    <Phone className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                    <a href={`tel:${lead.telephone}`} className="font-mono font-bold text-blue-700 hover:underline">
                      {lead.telephone}
                    </a>
                  </div>

                  <div className="flex items-center gap-2 text-slate-700">
                    <Mail className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                    <a href={`mailto:${lead.email}`} className="font-semibold text-slate-800 hover:underline">
                      {lead.email}
                    </a>
                  </div>

                  <div className="flex items-center gap-2 text-slate-700">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{lead.ville} ({lead.codePostal})</span>
                  </div>
                </div>
              </div>

              {/* Product Details (AUTO) */}
              {lead.type === 'AUTO' && lead.autoDetails && (
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider border-b border-slate-200 pb-2 flex items-center gap-2">
                    <Car className="w-4 h-4 text-blue-600" />
                    Détails Véhicule & Conducteur
                  </h4>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-slate-400">Civilité & Profil:</span>
                      <p className="font-bold text-slate-900">{lead.autoDetails.civilite || 'M.'} {lead.prenom} {lead.nom}</p>
                    </div>
                    <div>
                      <span className="text-slate-400">Immatriculation:</span>
                      <p className="font-mono font-bold text-slate-900">{lead.autoDetails.immatriculation}</p>
                    </div>
                    <div>
                      <span className="text-slate-400">Modèle Véhicule:</span>
                      <p className="font-semibold text-slate-900">{lead.autoDetails.marqueModele || 'N/A'}</p>
                    </div>
                    <div>
                      <span className="text-slate-400">Propriétaire (Carte Grise):</span>
                      <p className="font-semibold text-slate-800">{lead.autoDetails.proprietaireVehicule || 'Conducteur principal'}</p>
                    </div>
                    <div>
                      <span className="text-slate-400">Situation / Profession:</span>
                      <p className="text-slate-800">{lead.autoDetails.situationFamiliale || 'Célibataire'} • {lead.autoDetails.profession || 'Salarié'}</p>
                    </div>
                    <div>
                      <span className="text-slate-400">Date Naissance / Permis:</span>
                      <p className="text-slate-800">{lead.autoDetails.dateNaissance} (Permis {lead.autoDetails.datePermis})</p>
                    </div>
                    <div>
                      <span className="text-slate-400">CRM Bonus/Malus:</span>
                      <p className="font-bold text-blue-700">{lead.autoDetails.bonusMalus}</p>
                    </div>
                    <div>
                      <span className="text-slate-400">Utilisation:</span>
                      <p className="text-slate-800">{lead.autoDetails.typeUtilisation}</p>
                    </div>

                    {lead.autoDetails.aEuSuspensionPermis && (
                      <div className="col-span-2 p-2 bg-amber-50 rounded-lg border border-amber-200 text-amber-900">
                        ⚠️ <strong>Suspension Permis:</strong> Motif {lead.autoDetails.suspensionMotif || 'Non précisé'} ({lead.autoDetails.suspensionDureeMois || 3} mois) le {lead.autoDetails.suspensionDate || 'N/A'}
                      </div>
                    )}

                    {lead.autoDetails.aEuAnnulationPermis && (
                      <div className="col-span-2 p-2 bg-red-50 rounded-lg border border-red-200 text-red-900">
                        🛑 <strong>Annulation Permis:</strong> Motif {lead.autoDetails.annulationMotif || 'Non précisé'} le {lead.autoDetails.annulationDate || 'N/A'}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Product Details (HABITATION) */}
              {lead.type === 'HABITATION' && lead.habitationDetails && (
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider border-b border-slate-200 pb-2 flex items-center gap-2">
                    <Home className="w-4 h-4 text-emerald-600" />
                    Détails du Logement Assuré
                  </h4>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-slate-400">Type Logement:</span>
                      <p className="font-bold text-slate-900">{lead.habitationDetails.typeLogement}</p>
                    </div>
                    <div>
                      <span className="text-slate-400">Occupant:</span>
                      <p className="font-semibold text-slate-900">{lead.habitationDetails.statutOccupant}</p>
                    </div>
                    <div>
                      <span className="text-slate-400">Surface / Pièces:</span>
                      <p className="text-slate-800">{lead.habitationDetails.surfaceM2} m² ({lead.habitationDetails.nombrePieces} pièces)</p>
                    </div>
                    <div>
                      <span className="text-slate-400">Mobilier Déclaré:</span>
                      <p className="font-bold text-emerald-800">{lead.habitationDetails.valeurMobilier.toLocaleString()} €</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Product Details (VTC) */}
              {lead.type === 'VTC' && lead.vtcDetails && (
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider border-b border-slate-200 pb-2 flex items-center gap-2">
                    <Briefcase className="w-4 h-4 text-amber-600" />
                    Détails Activité VTC & Société
                  </h4>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-slate-400">Carte Pro VTC:</span>
                      <p className="font-mono font-bold text-amber-900">{lead.vtcDetails.numeroCarteVtc}</p>
                    </div>
                    <div>
                      <span className="text-slate-400">Société / SIRET:</span>
                      <p className="font-semibold text-slate-900">{lead.vtcDetails.nomSociete}</p>
                    </div>
                    <div>
                      <span className="text-slate-400">Immatriculation:</span>
                      <p className="font-mono font-bold text-slate-900">{lead.vtcDetails.immatriculation}</p>
                    </div>
                    <div>
                      <span className="text-slate-400">Véhicule VTC:</span>
                      <p className="text-slate-800">{lead.vtcDetails.marqueModele}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Right Box: Options, Prochaine Action & Notes Timeline */}
            <div className="space-y-4">
              {/* Prochaine Action */}
              <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-xl space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-900 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-amber-600" />
                  Rappel & Prochaine Action
                </span>

                <p className="text-xs font-bold text-slate-900">
                  📌 {lead.prochaineActionIntitule || 'Pas d\'action définie'}
                </p>

                {lead.prochaineActionDate && (
                  <p className="text-[11px] font-mono text-amber-800 font-semibold">
                    📅 Date : {lead.prochaineActionDate} {lead.prochaineActionHeure && `à ${lead.prochaineActionHeure}`}
                  </p>
                )}
              </div>

              {/* Options incluses */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Options Incluses dans la proposition
                </h4>

                {optionsList.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">Aucune option supplémentaire.</p>
                ) : (
                  <div className="flex flex-wrap gap-1.5">
                    {optionsList.map((opt, i) => (
                      <span key={i} className="px-2 py-1 bg-white border border-slate-200 text-slate-700 text-[11px] font-semibold rounded-lg shadow-2xs">
                        ✓ {opt}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Historique des Notes */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5 text-blue-600" />
                  Historique des Notes ({lead.notes?.length || 0})
                </h4>

                <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                  {(!lead.notes || lead.notes.length === 0) ? (
                    <p className="text-xs text-slate-400 italic">Aucune note enregistrée.</p>
                  ) : (
                    lead.notes.map((n, idx) => {
                      const isObj = typeof n === 'object' && n !== null;
                      const noteKey = isObj && (n as NoteItem).id ? (n as NoteItem).id : `note-idx-${idx}`;
                      const author = isObj && (n as NoteItem).author ? (n as NoteItem).author : (cabinetInfo.nomCourtierPrincipal || 'Courtier');
                      const date = isObj && (n as NoteItem).date ? (n as NoteItem).date : '';
                      const content = isObj && (n as NoteItem).content ? (n as NoteItem).content : String(n);

                      return (
                        <div key={noteKey} className="p-2.5 bg-white border border-slate-200 rounded-lg text-xs space-y-1">
                          <div className="flex items-center justify-between text-[10px] text-slate-400 font-medium">
                            <span>{author}</span>
                            {date && <span>{date}</span>}
                          </div>
                          <p className="text-slate-800 font-medium">{content}</p>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="bg-slate-50 border-t border-slate-200 px-6 py-4 flex items-center justify-between">
          <button
            onClick={() => setShowDeleteLeadModal(true)}
            className="px-3.5 py-2 bg-red-50 hover:bg-red-100 text-red-700 text-xs font-bold rounded-xl border border-red-200 transition flex items-center gap-1.5 cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Supprimer le Lead</span>
          </button>

          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-xl transition"
          >
            Fermer
          </button>
        </div>
      </div>

      {/* EMAIL MODAL DIALOG */}
      {showEmailModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 overflow-hidden">
          <div className="bg-white w-full max-w-3xl max-h-[92vh] rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col my-auto">
            {/* Header */}
            <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between shrink-0">
              <h3 className="font-bold text-slate-900 text-sm sm:text-base flex items-center gap-2">
                <Send className="w-5 h-5 text-blue-600" />
                Envoi de la Proposition Commerciale par Email
              </h3>
              <button onClick={() => setShowEmailModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer p-1 rounded-lg hover:bg-slate-200 transition">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Body */}
            <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4 text-slate-800">
              {emailSuccessMsg ? (
                <div className="py-8 text-center space-y-3">
                  <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center shadow-xs">
                    <CheckCircle2 className="w-9 h-9" />
                  </div>
                  <h4 className="font-bold text-emerald-950 text-lg">
                    Email Envoyé avec Succès via SMTP !
                  </h4>
                  <p className="text-xs text-slate-600 max-w-md mx-auto leading-relaxed">
                    L'email a été transmis directement à <strong className="font-bold text-slate-800">{lead.email}</strong> via votre serveur SMTP ({smtpConfig.host || 'configuré'}).
                  </p>
                  <div className="inline-block px-3 py-1 bg-emerald-50 border border-emerald-200 rounded-full text-[11px] font-bold text-emerald-800">
                    Statut mis à jour : "Devis Envoyé"
                  </div>
                </div>
              ) : (
                <>
                  {/* Template Selector / Inline Creator */}
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-700">Sélectionner un Modèle d'Email</label>
                      <button
                        type="button"
                        onClick={() => setShowNewTemplateForm(!showNewTemplateForm)}
                        className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>{showNewTemplateForm ? 'Masquer la création' : 'Nouveau Modèle'}</span>
                      </button>
                    </div>

                    {!showNewTemplateForm ? (
                      <select
                        value={selectedTemplateId}
                        onChange={(e) => {
                          setSelectedTemplateId(e.target.value);
                          populateEmailContent(e.target.value);
                        }}
                        className="w-full text-xs p-2.5 rounded-lg border border-slate-300 font-bold text-blue-900 bg-white"
                      >
                        {emailTemplates.map((t) => (
                          <option key={t.id} value={t.id}>
                            [{t.type}] {t.name}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <div className="bg-white p-3.5 rounded-xl border border-blue-200 space-y-3 shadow-xs">
                        <div className="flex items-center justify-between border-b pb-1.5">
                          <span className="text-xs font-bold text-blue-900">Créer un nouveau modèle d'email</span>
                          <span className="text-[10px] text-slate-500">Variables : &#123;civilite&#125;, &#123;nom&#125;, &#123;prenom&#125;, &#123;referenceDevis&#125;</span>
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                          <input
                            type="text"
                            placeholder="Nom du modèle"
                            value={newTmplName}
                            onChange={(e) => setNewTmplName(e.target.value)}
                            className="col-span-2 text-xs p-2 rounded-lg border border-slate-300 font-bold"
                          />
                          <select
                            value={newTmplType}
                            onChange={(e) => setNewTmplType(e.target.value as any)}
                            className="text-xs p-2 rounded-lg border border-slate-300 font-bold"
                          >
                            <option value="GENERAL">GENERAL</option>
                            <option value="AUTO">AUTO</option>
                            <option value="HABITATION">HABITATION</option>
                            <option value="VTC">VTC</option>
                          </select>
                        </div>
                        <input
                          type="text"
                          placeholder="Objet de l'email"
                          value={newTmplSubject}
                          onChange={(e) => setNewTmplSubject(e.target.value)}
                          className="w-full text-xs p-2 rounded-lg border border-slate-300 font-bold"
                        />
                        <textarea
                          rows={3}
                          placeholder="Corps du message..."
                          value={newTmplBody}
                          onChange={(e) => setNewTmplBody(e.target.value)}
                          className="w-full text-xs p-2.5 rounded-lg border border-slate-300 leading-relaxed font-mono"
                        />
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => setShowNewTemplateForm(false)}
                            className="px-3 py-1.5 bg-slate-100 text-slate-700 text-xs font-bold rounded-lg"
                          >
                            Annuler
                          </button>
                          <button
                            type="button"
                            onClick={handleSaveInlineTemplate}
                            className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg shadow-xs"
                          >
                            Enregistrer ce modèle
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Destinataire info */}
                  <div className="p-3 bg-blue-50/50 border border-blue-200 rounded-xl flex items-center justify-between text-xs">
                    <div>
                      <span className="font-bold text-slate-500 block text-[10px] uppercase">Destinataire :</span>
                      <p className="font-bold text-slate-900 text-xs">
                        {getLeadCivility()} {lead.prenom} {lead.nom} &lt;{lead.email}&gt;
                      </p>
                    </div>
                    <span className="px-2 py-0.5 bg-blue-100 text-blue-800 text-[10px] font-bold rounded-md">
                      Civilité : {getLeadCivility()}
                    </span>
                  </div>

                  {/* Objet */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Objet de l'email :</label>
                    <input
                      type="text"
                      value={customEmailSubject}
                      onChange={(e) => setCustomEmailSubject(e.target.value)}
                      className="w-full text-xs p-2.5 rounded-xl border border-slate-300 font-bold text-slate-900 bg-white"
                    />
                  </div>

                  {/* Body */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Corps du message (Éditable) :</label>
                    <textarea
                      rows={5}
                      value={customEmailBody}
                      onChange={(e) => setCustomEmailBody(e.target.value)}
                      className="w-full text-xs p-3 rounded-xl border border-slate-300 font-sans leading-relaxed bg-white focus:ring-2 focus:ring-blue-500"
                    ></textarea>
                  </div>

                  {/* Pièces Jointes (Attachments) Section */}
                  <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                        <Paperclip className="w-4 h-4 text-blue-600" />
                        <span>Pièces jointes au message</span>
                      </label>
                      <label className="cursor-pointer px-2.5 py-1 bg-white border border-slate-300 hover:border-blue-500 text-slate-700 hover:text-blue-600 text-[11px] font-bold rounded-lg shadow-2xs flex items-center gap-1 transition">
                        <Upload className="w-3 h-3" />
                        <span>Joindre un fichier...</span>
                        <input
                          type="file"
                          multiple
                          onChange={handleFileAttachmentChange}
                          className="hidden"
                        />
                      </label>
                    </div>

                    {/* Auto-attached PDF Quote Checkbox (Optionnel) */}
                    <div className="flex items-center gap-2 p-2 bg-white rounded-lg border border-slate-200 text-xs">
                      <input
                        type="checkbox"
                        id="inc-pdf"
                        checked={includePdfQuote}
                        onChange={(e) => setIncludePdfQuote(e.target.checked)}
                        className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer"
                      />
                      <label htmlFor="inc-pdf" className="flex-1 font-bold text-slate-700 flex items-center gap-1.5 cursor-pointer">
                        <FileText className="w-3.5 h-3.5 text-slate-500" />
                        <span>Générer et joindre également le devis PDF récapitulatif ({lead.referenceDevis}.pdf)</span>
                      </label>
                    </div>

                    {/* User Uploaded Attachments List */}
                    {attachments.length > 0 && (
                      <div className="space-y-1.5 pt-1">
                        {attachments.map((att, idx) => (
                          <div key={att.id} className="flex items-center justify-between p-2 bg-white rounded-lg border border-slate-200 text-xs">
                            <div className="flex items-center gap-2 overflow-hidden pr-2">
                              <Paperclip className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                              <span className="font-semibold text-slate-800 truncate">{att.name}</span>
                              <span className="text-[10px] text-slate-400 shrink-0">({formatFileSize(att.size)})</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleRemoveAttachment(att.id, idx)}
                              className="text-slate-400 hover:text-rose-600 cursor-pointer p-0.5"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Error Banner */}
                  {smtpErrorMsg && (
                    <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2 text-xs text-rose-900 font-medium">
                      <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                      <div className="space-y-1">
                        <p className="font-bold">{smtpErrorMsg}</p>
                        <p className="text-[11px] text-rose-700">
                          Vérifiez votre serveur SMTP, le port (ex: 465 SSL, 587 TLS), l'identifiant et le mot de passe dans <strong>Paramètres &gt; Config SMTP</strong>.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Informational Guidance on Email Delivery */}
                  <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl flex items-start gap-2.5 text-[11px] text-blue-950 leading-relaxed">
                    <AlertCircle className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold block mb-0.5">Envoi d'email direct via le CRM :</span>
                      L'email sera transmis directement à <strong className="font-bold text-blue-900">{lead.email}</strong> via votre serveur SMTP ({smtpConfig.host || 'non configuré'}). Vous pouvez joindre librement vos propres fichiers ci-dessus.
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Fixed Footer */}
            <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0 gap-2">
              <button
                onClick={() => setShowEmailModal(false)}
                disabled={isSendingEmail}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold rounded-xl cursor-pointer transition disabled:opacity-50"
              >
                Annuler
              </button>

              {!emailSuccessMsg && (
                <button
                  onClick={() => handleSendEmailAction('DIRECT')}
                  disabled={isSendingEmail}
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl shadow-lg flex items-center gap-2 cursor-pointer transition disabled:opacity-50"
                  title="Envoie directement l'email via le serveur SMTP enregistré dans les paramètres"
                >
                  {isSendingEmail ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Envoi SMTP en cours...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>Envoyer l'email par SMTP</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* PRINT QUOTE MODAL */}
      {showQuotePreview && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-hidden">
          <div className="bg-white w-full max-w-4xl max-h-[94vh] rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
            <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between shrink-0">
              <h3 className="font-bold text-base flex items-center gap-2">
                <Printer className="w-5 h-5 text-emerald-400" />
                Document Devis Officiel - {lead.referenceDevis}
              </h3>
              <button onClick={() => setShowQuotePreview(false)} className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 sm:p-8 overflow-y-auto flex-1 space-y-6 text-slate-900 font-sans" id="printable-quote">
              {/* Entête Cabinet / Devis avec Logo */}
              <div className="flex flex-col sm:flex-row justify-between items-start border-b-2 border-slate-900 pb-6 gap-4">
                <div className="flex items-start gap-4">
                  {cabinetInfo.logoUrl ? (
                    <img
                      src={cabinetInfo.logoUrl}
                      alt={cabinetInfo.nomCabinet}
                      className="h-16 max-w-[220px] object-contain rounded-lg border border-slate-200 p-1 bg-white shadow-sm"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-700 via-blue-800 to-indigo-950 text-white flex items-center justify-center font-black text-2xl shadow-md border border-blue-400/30 shrink-0">
                      {cabinetInfo.nomCabinet ? cabinetInfo.nomCabinet.charAt(0) : 'H'}
                    </div>
                  )}
                  <div>
                    <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                      <h2 className="text-xl font-black text-slate-900 tracking-tight">{cabinetInfo.nomCabinet}</h2>
                      <span className="px-2 py-0.5 bg-blue-100 text-blue-800 text-[10px] font-black uppercase tracking-wider rounded-md border border-blue-200">
                        ORIAS N° {cabinetInfo.numeroOrias}
                      </span>
                    </div>
                    <p className="text-xs font-bold text-blue-700 mb-1">Cabinet de Courtage & Conseils en Assurances</p>
                    <p className="text-[11px] text-slate-600 leading-relaxed">
                      {cabinetInfo.adresse} — {cabinetInfo.codePostal} {cabinetInfo.ville}<br />
                      N° SIRET : {cabinetInfo.siret || '842 194 028 00012'} | Tél : <strong>{cabinetInfo.telephone}</strong> | Email : {cabinetInfo.emailContact || cabinetInfo.nomCourtierPrincipal}
                    </p>
                  </div>
                </div>

                <div className="sm:text-right bg-gradient-to-br from-blue-50 to-slate-50 p-4 rounded-xl border border-blue-200 min-w-[240px] shadow-sm">
                  <span className="inline-block px-2.5 py-0.5 bg-blue-600 text-white text-[10px] font-black uppercase tracking-wider rounded-md mb-1">
                    PROPOSITION COMMERCIALE
                  </span>
                  <h3 className="text-lg font-black text-blue-950">DEVIS N° {lead.referenceDevis}</h3>
                  <p className="text-xs font-semibold text-slate-700">Émis le : {new Date().toLocaleDateString('fr-FR')}</p>
                  <p className="text-xs text-emerald-700 font-bold mt-1">Validité : 30 jours (sous réserve de pièces)</p>
                </div>
              </div>

              {/* Grid Client / Intermédiaire */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                  <h4 className="text-[11px] font-black uppercase text-slate-500 tracking-wider mb-2 flex items-center gap-1.5">
                    <UserCheck className="w-4 h-4 text-blue-600" />
                    PROSPECT SOUSCRIPTEUR
                  </h4>
                  <p className="font-bold text-sm text-slate-900">{getLeadCivility(lead)} {lead.prenom} {lead.nom}</p>
                  <p className="text-slate-700"><strong>Adresse :</strong> {lead.autoDetails?.adresse || lead.habitationDetails?.adresse || lead.vtcDetails?.adresse || lead.ville} ({lead.codePostal})</p>
                  <p className="text-slate-700"><strong>Téléphone :</strong> {lead.telephone}</p>
                  <p className="text-slate-700"><strong>Email :</strong> {lead.email}</p>
                </div>

                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                  <h4 className="text-[11px] font-black uppercase text-slate-500 tracking-wider mb-2 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-blue-600" />
                    CONSEILLER COURTIER DÉDIÉ
                  </h4>
                  <p className="font-bold text-sm text-slate-900">{cabinetInfo.nomCourtierPrincipal || 'Service Client'}</p>
                  <p className="text-slate-700"><strong>Organisme :</strong> {cabinetInfo.nomCabinet}</p>
                  <p className="text-slate-700"><strong>N° Registre ORIAS :</strong> {cabinetInfo.numeroOrias}</p>
                  <p className="text-slate-700"><strong>Statut :</strong> Courtier d'Assurances indépendant (Cat. b)</p>
                </div>
              </div>

              {/* FICHE DE DEVOIR DE CONSEIL (DDA - Art. L. 521-4 du Code des Assurances) */}
              <div className="p-4 bg-amber-50/70 rounded-xl border border-amber-200 text-xs space-y-2">
                <div className="flex items-center gap-2 border-b border-amber-200/80 pb-2">
                  <ShieldAlert className="w-4 h-4 text-amber-700 shrink-0" />
                  <h4 className="font-black uppercase text-amber-950 tracking-wider">
                    FICHE DU DEVOIR DE CONSEIL ET D'INFORMATION (Art. L. 521-4 du Code des Assurances - Directive DDA)
                  </h4>
                </div>
                <p className="text-[11px] text-amber-900 leading-relaxed">
                  Conformément à la réglementation française sur la distribution d'assurances, le présent conseil est personnalisé sur la base des exigences et besoins déclarés par le souscripteur :
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-[11px] pt-1">
                  <div className="bg-white p-2.5 rounded-lg border border-amber-200/60">
                    <p className="font-bold text-amber-900 mb-0.5">1. Exigences & Besoins :</p>
                    <p className="text-slate-700">Recherche d'une formule {getQuotePricing(lead).formula} adaptée au risque {lead.type} avec option de règlement {getQuotePricing(lead).fractionnement.toLowerCase()}.</p>
                  </div>
                  <div className="bg-white p-2.5 rounded-lg border border-amber-200/60">
                    <p className="font-bold text-amber-900 mb-0.5">2. Motivation du Conseil :</p>
                    <p className="text-slate-700">L'offre sélectionnée présente le meilleur rapport garanties/prix selon votre profil CRM, l'usage du bien et vos besoins d'assistance 24/7.</p>
                  </div>
                  <div className="bg-white p-2.5 rounded-lg border border-amber-200/60">
                    <p className="font-bold text-amber-900 mb-0.5">3. Statut & Transparence :</p>
                    <p className="text-slate-700">Courtier indépendant de rang 1 sans obligation d'exclusivité. Rémunération intégrée à la prime globale et/ou frais de courtage indiqués.</p>
                  </div>
                </div>
              </div>

              {/* Fiche Risque & Caractéristiques Détaillées */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-3">
                <h4 className="text-xs font-black uppercase text-slate-800 tracking-wider border-b pb-2 flex items-center gap-2">
                  {lead.type === 'AUTO' && <Car className="w-4 h-4 text-blue-600" />}
                  {lead.type === 'HABITATION' && <Home className="w-4 h-4 text-blue-600" />}
                  {lead.type === 'VTC' && <Briefcase className="w-4 h-4 text-blue-600" />}
                  DÉSIGNATION ET DÉTAILS DU RISQUE ASSURÉ ({lead.type})
                </h4>

                {lead.type === 'AUTO' && lead.autoDetails && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 leading-relaxed">
                    <div className="space-y-1 bg-white p-3 rounded-lg border border-slate-200">
                      <p className="font-bold text-blue-900 border-b pb-1 mb-1">🚘 Caractéristiques Véhicule :</p>
                      <p><strong>Marque & Modèle :</strong> {lead.autoDetails.marqueModele || 'Non précisé'}</p>
                      <p><strong>Immatriculation :</strong> <span className="font-mono font-bold bg-slate-100 px-1.5 py-0.5 rounded">{lead.autoDetails.immatriculation || 'En cours'}</span></p>
                      <p><strong>1ère Mise en Circulation :</strong> {lead.autoDetails.dateMiseEnCirculation || 'N/A'}</p>
                      <p><strong>Usage Déclaré :</strong> {lead.autoDetails.typeUtilisation || 'Trajet travail'}</p>
                      <p><strong>Propriétaire :</strong> {lead.autoDetails.proprietaireVehicule || 'Conducteur principal'}</p>
                    </div>

                    <div className="space-y-1 bg-white p-3 rounded-lg border border-slate-200">
                      <p className="font-bold text-blue-900 border-b pb-1 mb-1">👤 Conducteur & Antécédents CRM :</p>
                      <p><strong>Permis de Conduire :</strong> Permis B du {lead.autoDetails.datePermis || 'N/A'}</p>
                      <p><strong>Bonus / Malus (CRM) :</strong> <span className="font-bold text-emerald-700">{lead.autoDetails.bonusMalus ?? 0.50}</span></p>
                      <p><strong>Mois assurés 36 derniers mois :</strong> {lead.autoDetails.nombreMoisAssure36Mois ?? 36} mois</p>
                      <p><strong>Suspension / Annulation :</strong> {lead.autoDetails.aEuSuspensionPermis ? 'Oui (Suspension)' : lead.autoDetails.aEuAnnulationPermis ? 'Oui (Annulation)' : 'Non'}</p>
                      <p><strong>Sinistres déclarés (36m) :</strong> {lead.autoDetails.sinistres?.length ? `${lead.autoDetails.sinistres.length} sinistre(s)` : 'Aucun sinistre'}</p>
                    </div>
                  </div>
                )}

                {lead.type === 'VTC' && lead.vtcDetails && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 leading-relaxed">
                    <div className="space-y-1 bg-white p-3 rounded-lg border border-slate-200">
                      <p className="font-bold text-blue-900 border-b pb-1 mb-1">🚕 Entreprise VTC & Véhicule :</p>
                      <p><strong>Société :</strong> {lead.vtcDetails.nomSociete || 'Auto-entrepreneur'} (SIRET : {lead.vtcDetails.siret || 'N/A'})</p>
                      <p><strong>Carte Pro VTC N° :</strong> {lead.vtcDetails.numeroCarteVtc || 'N/A'}</p>
                      <p><strong>Véhicule :</strong> {lead.vtcDetails.marqueModele || 'N/A'} ({lead.vtcDetails.immatriculation || 'N/A'})</p>
                      <p><strong>Motorisation :</strong> {lead.vtcDetails.typeMotorisation || 'Hybride'}</p>
                    </div>

                    <div className="space-y-1 bg-white p-3 rounded-lg border border-slate-200">
                      <p className="font-bold text-blue-900 border-b pb-1 mb-1">🛡️ Activité Pro & Antécédents :</p>
                      <p><strong>RC Pro Exploitation :</strong> {lead.vtcDetails.besoinRcProExploitation ? 'INCLUSE' : 'Non souscrite'}</p>
                      <p><strong>Bonus / Malus :</strong> {lead.vtcDetails.bonusMalus ?? 0.50}</p>
                      <p><strong>Dernier Assureur :</strong> {lead.vtcDetails.nomDerniereCompagnie || 'N/A'}</p>
                      <p><strong>Sinistralité :</strong> {lead.vtcDetails.sinistres?.length ? `${lead.vtcDetails.sinistres.length} sinistre(s)` : 'Aucun sinistre'}</p>
                    </div>
                  </div>
                )}

                {lead.type === 'HABITATION' && lead.habitationDetails && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 leading-relaxed">
                    <div className="space-y-1 bg-white p-3 rounded-lg border border-slate-200">
                      <p className="font-bold text-blue-900 border-b pb-1 mb-1">🏡 Caractéristiques du Logement :</p>
                      <p><strong>Type de Bien :</strong> {lead.habitationDetails.typeLogement || 'Maison'} ({lead.habitationDetails.statutOccupant || 'Occupant'})</p>
                      <p><strong>Surface Habitable :</strong> {lead.habitationDetails.surfaceM2 || 0} m² ({lead.habitationDetails.nombrePieces || 0} pièces principales)</p>
                      <p><strong>Adresse du Bien :</strong> {lead.habitationDetails.adresseBien || lead.ville}</p>
                      <p><strong>Équipements :</strong> {lead.habitationDetails.dependances ? 'Dépendances ' : ''}{lead.habitationDetails.piscine ? 'Piscine ' : ''}{!lead.habitationDetails.dependances && !lead.habitationDetails.piscine ? 'Aucun' : ''}</p>
                    </div>

                    <div className="space-y-1 bg-white p-3 rounded-lg border border-slate-200">
                      <p className="font-bold text-blue-900 border-b pb-1 mb-1">💰 Capital Garanti & Antécédents :</p>
                      <p><strong>Valeur Mobilier Garanti :</strong> <span className="font-bold text-emerald-700">{lead.habitationDetails.valeurMobilier || 0} €</span></p>
                      <p><strong>Résidence :</strong> {lead.habitationDetails.residencePrincipale ? 'Principale' : 'Secondaire'}</p>
                      <p><strong>Déjà Assuré :</strong> {lead.habitationDetails.dejaAssure ? 'Oui' : 'Non'}</p>
                      <p><strong>Sinistres antérieurs :</strong> {lead.habitationDetails.sinistres?.length ? `${lead.habitationDetails.sinistres.length} sinistre(s)` : 'Aucun'}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Table Tarification / Cotisation */}
              <div>
                <h4 className="text-xs font-black uppercase text-slate-800 tracking-wider mb-2">
                  💶 DÉTAIL DE LA PROPOSITION TARIFAIRE
                </h4>
                <div className="overflow-hidden rounded-xl border border-slate-200">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-800 text-white font-bold uppercase">
                      <tr>
                        <th className="p-3">Formule d'Assurance Choisie</th>
                        <th className="p-3 text-center">Périodicité</th>
                        <th className="p-3 text-right">Cotisation TTC</th>
                        <th className="p-3 text-right">Frais de Dossier</th>
                        <th className="p-3 text-right bg-blue-900">Premier Règlement</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 bg-white">
                      <tr>
                        <td className="p-3 font-bold text-slate-900">
                          {getQuotePricing(lead).formula}
                          <span className="block text-[10px] text-slate-500 font-normal">Secteur {lead.type}</span>
                        </td>
                        <td className="p-3 text-center font-bold text-blue-800">{getQuotePricing(lead).fractionnement}</td>
                        <td className="p-3 text-right font-bold text-emerald-700 text-sm">{getQuotePricing(lead).cotisation.toFixed(2)} €</td>
                        <td className="p-3 text-right font-semibold text-slate-800">{getQuotePricing(lead).fraisDossier.toFixed(2)} €</td>
                        <td className="p-3 text-right font-black text-blue-950 bg-blue-50/50 text-sm">
                          {(getQuotePricing(lead).cotisation + getQuotePricing(lead).fraisDossier).toFixed(2)} € TTC
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Tableau Détaillé des Garanties & Franchises */}
              <div>
                <h4 className="text-xs font-black uppercase text-slate-800 tracking-wider mb-2">
                  🛡️ TABLEAU DÉTAILLÉ DES GARANTIES & FRANCHISES INCLUSES
                </h4>
                <div className="overflow-hidden rounded-xl border border-slate-200">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 text-slate-800 font-bold uppercase border-b">
                      <tr>
                        <th className="p-2.5">Garantie / Couverture</th>
                        <th className="p-2.5 text-center">Statut</th>
                        <th className="p-2.5">Plafond & Conditions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 bg-white">
                      {getGuaranteesList(lead).map((g, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/50">
                          <td className="p-2.5 font-bold text-slate-900">{g.name}</td>
                          <td className="p-2.5 text-center">
                            <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                              String(g.included).includes('Inclus') 
                                ? 'bg-emerald-100 text-emerald-800' 
                                : String(g.included).includes('option')
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-slate-100 text-slate-500'
                            }`}>
                              {String(g.included)}
                            </span>
                          </td>
                          <td className="p-2.5 text-slate-600 text-[11px]">{g.detail}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* CONDITIONS GÉNÉRALES ET DISPOSITIONS LÉGALES (LOI FRANÇAISE) */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-3">
                <div className="flex items-center gap-2 border-b pb-2">
                  <FileText className="w-4 h-4 text-blue-700 shrink-0" />
                  <h4 className="font-black uppercase text-slate-900 tracking-wider">
                    CONDITIONS GÉNÉRALES ET DISPOSITIONS LÉGALES (Loi & Réglementation Française)
                  </h4>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[11px] leading-relaxed text-slate-700">
                  <div className="p-3 bg-white rounded-lg border border-slate-200 space-y-1">
                    <p className="font-bold text-xs text-blue-900">1. Droit de Rétractation / Renonciation (Art. L. 112-9)</p>
                    <p>Pour les souscriptions à distance ou hors établissement, vous disposez d'un délai légal de <strong>14 jours calendaires révolus</strong> à compter de la conclusion du contrat pour renoncer à votre souscription sans frais ni motif.</p>
                  </div>

                  <div className="p-3 bg-white rounded-lg border border-slate-200 space-y-1">
                    <p className="font-bold text-xs text-blue-900">2. Résiliation Infra-Annuelle (Loi Hamon & Châtel)</p>
                    <p>Contrat souscrit pour une durée d'un an avec reconduction tacite. Après la première année de souscription, vous pouvez résilier <strong>à tout moment sans frais ni pénalités</strong>.</p>
                  </div>

                  <div className="p-3 bg-white rounded-lg border border-slate-200 space-y-1">
                    <p className="font-bold text-xs text-blue-900">3. Obligation de Déclaration du Risque (Art. L. 113-2)</p>
                    <p>Le souscripteur doit répondre exactement aux questions. Toute fausse déclaration intentionnelle entraîne la <strong>nullité du contrat (Art. L. 113-8)</strong> ou l'application de la règle proportionnelle de prime (Art. L. 113-9).</p>
                  </div>

                  <div className="p-3 bg-white rounded-lg border border-slate-200 space-y-1">
                    <p className="font-bold text-xs text-blue-900">4. Protection des Données Personnelles (RGPD / CNIL)</p>
                    <p>Les données sont traitées conformément au RGPD pour la gestion du contrat. Vous disposez d'un droit d'accès, de rectification et d'opposition auprès du cabinet {cabinetInfo.nomCabinet}.</p>
                  </div>

                  <div className="p-3 bg-white rounded-lg border border-slate-200 space-y-1">
                    <p className="font-bold text-xs text-blue-900">5. Réclamations & Médiation de l'Assurance</p>
                    <p>En cas de désaccord, contacter d'abord le cabinet à {cabinetInfo.emailContact || cabinetInfo.telephone}. En cas de litige : <em>La Médiation de l'Assurance, TSA 50110, 75441 Paris Cedex 09 (www.mediation-assurance.org)</em>.</p>
                  </div>

                  <div className="p-3 bg-white rounded-lg border border-slate-200 space-y-1">
                    <p className="font-bold text-xs text-blue-900">6. Organisme de Contrôle (ACPR)</p>
                    <p>Cabinet sous le contrôle de l'<strong>ACPR (Autorité de Contrôle Prudentiel et de Résolution)</strong>, 4 Place de Budapest, 75436 Paris Cedex 09.</p>
                  </div>
                </div>
              </div>

              {/* Pièces à fournir & Engagement */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-[11px]">
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
                  <h5 className="font-bold text-slate-900 border-b pb-1 text-xs">📄 Pièces nécessaires pour la souscription :</h5>
                  <ul className="list-disc list-inside space-y-1 text-slate-700">
                    <li>Permis de conduire recto/verso (ou Carte VTC)</li>
                    <li>Certificat d'immatriculation (Carte Grise)</li>
                    <li>Relevé d'Information Intégral 36 mois</li>
                    <li>Relevé d'Identité Bancaire (RIB) pour prélèvement</li>
                  </ul>
                </div>

                <div className="p-3.5 bg-blue-50/60 rounded-xl border border-blue-200 space-y-2">
                  <h5 className="font-bold text-blue-950 text-xs">✍️ Validation & Bon pour Accord :</h5>
                  <p className="text-slate-600 leading-snug">
                    Je soussigné(e) <strong>{getLeadCivility(lead)} {lead.prenom} {lead.nom}</strong>, confirme l'exactitude des renseignements ci-dessus, reconnaît avoir reçu la fiche de devoir de conseil ainsi que les conditions générales réglementaires, et valide la proposition N° {lead.referenceDevis}.
                  </p>
                  <div className="pt-4 border-t border-blue-200 flex justify-between text-[10px] text-slate-500 font-mono">
                    <span>Fait à : ....................</span>
                    <span>Le : ..../..../202...</span>
                  </div>
                  <div className="h-10 border border-dashed border-blue-300 rounded-lg flex items-center justify-center text-slate-400 text-[10px] italic">
                    Emplacement Signature ("Lu et approuvé - Bon pour accord")
                  </div>
                </div>
              </div>

              {/* Mentions Légales Pied de Page */}
              <div className="text-[10px] text-slate-500 border-t pt-4 leading-relaxed space-y-1">
                <p><strong>Information Légale :</strong> {cabinetInfo.mentionsLegales || `Cabinet d'assurance agréé ORIAS N° ${cabinetInfo.numeroOrias}. Activité sous le contrôle de l'ACPR.`}</p>
                <p className="italic">Document non contractuel établi selon les déclarations du prospect. Sous réserve de validation définitive des pièces justificatives.</p>
              </div>
            </div>

            {/* Footer buttons */}
            <div className="p-4 bg-slate-100 border-t flex flex-wrap justify-between items-center gap-3 shrink-0">
              <span className="text-xs text-slate-500 font-medium">Référence : {lead.referenceDevis}</span>
              <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                <button
                  onClick={() => setShowQuotePreview(false)}
                  className="px-3.5 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold rounded-xl transition cursor-pointer"
                >
                  Fermer
                </button>

                <button
                  onClick={handleDownloadQuoteTxt}
                  className="px-3.5 py-2 bg-slate-700 hover:bg-slate-800 text-white text-xs font-bold rounded-xl shadow flex items-center gap-1.5 cursor-pointer transition"
                  title="Télécharger la version texte du devis"
                >
                  <Download className="w-3.5 h-3.5 text-slate-300" />
                  <span>Texte (.txt)</span>
                </button>

                <button
                  onClick={handleDownloadQuoteHTML}
                  className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow flex items-center gap-1.5 cursor-pointer transition"
                  title="Télécharger le fichier HTML complet avec mise en page"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Télécharger HTML</span>
                </button>

                <button
                  onClick={handlePrintQuote}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow flex items-center gap-2 cursor-pointer transition"
                >
                  <Printer className="w-4 h-4" />
                  <span>Imprimer / PDF</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* DELETE LEAD MODAL */}
      {showDeleteLeadModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 border border-slate-200 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-rose-100 rounded-2xl text-rose-600 shrink-0">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-base text-slate-900">Supprimer le Lead ?</h3>
                <p className="text-xs text-slate-500">Cette action est définitive et irréversible.</p>
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-700 leading-relaxed">
              Voulez-vous supprimer le lead de <strong className="text-slate-900">{lead.prenom} {lead.nom}</strong> ({lead.type}) ? Toutes les données et l'historique associés seront supprimés.
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowDeleteLeadModal(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={() => {
                  onDeleteLead(lead.id);
                  setShowDeleteLeadModal(false);
                  onClose();
                }}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-md shadow-rose-600/20 transition cursor-pointer flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Supprimer le Lead</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
