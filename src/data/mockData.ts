import { Lead, SmtpConfig, EmailTemplate, CabinetInfo, User, getDefaultPermissionsForRole } from '../types/crm';

export const initialUsers: User[] = [
  {
    id: 'user-1',
    nom: 'Dupuis',
    prenom: 'Pierre-Antoine',
    email: 'p.dupuis@horizon-courtage.fr',
    telephone: '01 42 68 90 01',
    password: 'Horizon2026!',
    role: 'ADMIN',
    equipe: 'Direction Générale',
    status: 'ACTIF',
    specialite: 'Direction & Administration',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    permissions: getDefaultPermissionsForRole('ADMIN'),
    createdAt: '2024-01-15',
    lastLoginAt: '2026-07-25 09:12'
  },
  {
    id: 'user-2',
    nom: 'Durand',
    prenom: 'Jean-Marc',
    email: 'jm.durand@horizon-courtage.fr',
    telephone: '01 42 68 90 02',
    password: 'Horizon2026!',
    role: 'DIRECTEUR_PRODUCTION',
    equipe: 'Direction Production',
    status: 'ACTIF',
    specialite: 'Directeur de Production',
    avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80',
    permissions: getDefaultPermissionsForRole('DIRECTEUR_PRODUCTION'),
    createdAt: '2024-02-01',
    lastLoginAt: '2026-07-25 08:45'
  },
  {
    id: 'user-3',
    nom: 'Martin',
    prenom: 'Sophie',
    email: 's.martin@horizon-courtage.fr',
    telephone: '01 42 68 90 03',
    password: 'Horizon2026!',
    role: 'RESPONSABLE_EQUIPE',
    equipe: 'Équipe Auto & Habitation',
    status: 'ACTIF',
    specialite: 'Responsable Équipe Commerciale',
    avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    permissions: getDefaultPermissionsForRole('RESPONSABLE_EQUIPE'),
    createdAt: '2024-03-01',
    lastLoginAt: '2026-07-24 16:45'
  },
  {
    id: 'user-4',
    nom: 'Dubreuil',
    prenom: 'Marc',
    email: 'm.dubreuil@horizon-courtage.fr',
    telephone: '01 42 68 90 04',
    password: 'Horizon2026!',
    role: 'AGENT_COMMERCIAL',
    equipe: 'Équipe Auto & Habitation',
    status: 'ACTIF',
    specialite: 'Agent Commercial Auto & Habitation',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    permissions: getDefaultPermissionsForRole('AGENT_COMMERCIAL'),
    createdAt: '2024-05-10',
    lastLoginAt: '2026-07-25 08:30'
  },
  {
    id: 'user-5',
    nom: 'Bernard',
    prenom: 'Thomas',
    email: 't.bernard@horizon-courtage.fr',
    telephone: '01 42 68 90 05',
    role: 'AGENT_COMMERCIAL',
    equipe: 'Équipe VTC & Pro',
    status: 'ACTIF',
    specialite: 'Agent Commercial VTC & Flottes',
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    permissions: getDefaultPermissionsForRole('AGENT_COMMERCIAL'),
    createdAt: '2024-08-20',
    lastLoginAt: '2026-07-23 11:15'
  },
  {
    id: 'user-6',
    nom: 'Moreau',
    prenom: 'Julie',
    email: 'j.moreau@horizon-courtage.fr',
    telephone: '01 42 68 90 06',
    role: 'GESTIONNAIRE',
    equipe: 'Équipe Auto & Habitation',
    status: 'ACTIF',
    specialite: 'Gestionnaire Contrats & Production',
    avatarUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
    permissions: getDefaultPermissionsForRole('GESTIONNAIRE'),
    createdAt: '2025-01-10',
    lastLoginAt: '2026-07-24 14:20'
  }
];

export const initialCabinetInfo: CabinetInfo = {
  nomCabinet: 'Assurances Horizon Courtage',
  numeroOrias: '18004921',
  siret: '842 194 028 00012',
  adresse: '45 Avenue Victor Hugo',
  codePostal: '75016',
  ville: 'Paris',
  telephone: '01 42 68 90 00',
  emailContact: 'contact@horizon-courtage.fr',
  nomCourtierPrincipal: 'Pierre-Antoine Dupuis',
  logoUrl: 'https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=300&auto=format&fit=crop&q=80',
  mentionsLegales: 'Horizon Courtage S.A.S au capital de 50 000 € - Immatriculé à l\'ORIAS sous le N° 18004921 - Garanties Financières & Responsabilité Civile Professionnelle conformes aux articles L.512-6 et L.512-7 du Code des Assurances.',
  siteWeb: 'www.horizon-courtage.fr',
  customStatuses: [
    { id: 'NOUVEAU', label: 'Nouveau Lead', color: 'blue' },
    { id: 'A_CONTACTER', label: 'À Contacter', color: 'amber' },
    { id: 'DEVIS_ENVOYE', label: 'Devis Envoyé', color: 'purple' },
    { id: 'RELANCE', label: 'Relance à faire', color: 'orange' },
    { id: 'GAGNE', label: 'Souscrit / Gagné', color: 'emerald' },
    { id: 'PERDU', label: 'Perdu / Rejeté', color: 'rose' }
  ],
  customNextActions: [
    'Appel téléphonique',
    'Attente retour client',
    'Aucune action',
    'Relance devis',
    'Relance documents'
  ]
};

export const initialSmtpConfig: SmtpConfig = {
  host: 'mail.horizon-courtage.fr',
  port: 587,
  username: 'devis@horizon-courtage.fr',
  password: '••••••••••••',
  encryption: 'TLS',
  senderEmail: 'devis@horizon-courtage.fr',
  senderName: 'Service Devis - Horizon Courtage',
  active: true
};

export const initialEmailTemplates: EmailTemplate[] = [
  {
    id: 'tmpl-auto-devis',
    name: 'Proposition Tarifaire Auto',
    subject: 'Votre devis assurance Auto N° {referenceDevis} - {nomCabinet}',
    type: 'AUTO',
    body: `Bonjour {prenom} {nom},

Suite à votre demande, nous avons le plaisir de vous transmettre notre meilleure offre pour votre véhicule {marqueModele} (Immatriculation : {immatriculation}).

Résumé de votre offre Auto :
- Formule choisie : {formule}
- Fractionnement : {fractionnement}
- Cotisation : {cotisation} € / an ({cotisationMois} € / mois)
- Frais de dossier : {fraisDossier} €

Options incluses :
{options}

Vous trouverez ci-joint le détail de la proposition de contrat.

Pour valider votre souscription ou poser une question, vous pouvez contacter votre conseiller dédié au {telephoneCabinet} ou répondre directement à cet email.

Bien cordialement,
{nomCourtier}
{nomCabinet} - ORIAS : {numeroOrias}`,
    updatedAt: '2026-07-20'
  },
  {
    id: 'tmpl-hab-devis',
    name: 'Proposition Tarifaire Habitation',
    subject: 'Votre étude assurance Habitation N° {referenceDevis} - {nomCabinet}',
    type: 'HABITATION',
    body: `Bonjour {prenom} {nom},

Nous avons étudié votre besoin en assurance Habitation pour votre logement situé à {ville} ({surface} m² - {nombrePieces} pièces).

Votre tarif privilégié :
- Formule : {formule}
- Cotisation annuelle : {cotisation} €
- Frais de dossier : {fraisDossier} €

Garanties phares :
{options}

Pour toute question ou modification, n'hésitez pas à nous appeler au {telephoneCabinet}.

Cordialement,
{nomCourtier} - {nomCabinet}`,
    updatedAt: '2026-07-18'
  },
  {
    id: 'tmpl-vtc-devis',
    name: 'Proposition Tarifaire VTC & RC Pro',
    subject: 'Devis VTC + RC Pro Exploitation N° {referenceDevis}',
    type: 'VTC',
    body: `Bonjour {prenom} {nom},

Voici votre offre sur-mesure pour votre activité VTC avec le véhicule {marqueModele} (Immat : {immatriculation}).

Offre VTC Globale :
- Pack sélectionné : {formule}
- Inclus : Responsabilité Civile Circulation + RC Pro Exploitation VTC
- Cotisation : {cotisation} € / an
- Franchise : {franchise} €

Options supplémentaires :
{options}

Nous restons à votre entière disposition pour vous accompagner dans la mise en place immédiate de votre attestation de circulation VTC.

Excellente journée,
{nomCourtier}
{nomCabinet}`,
    updatedAt: '2026-07-22'
  },
  {
    id: 'tmpl-relance-devis',
    name: 'Relance Devis en attente',
    subject: 'Avez-vous pu consulter votre offre d\'assurance N° {referenceDevis} ?',
    type: 'GENERAL',
    body: `Bonjour {prenom} {nom},

Je reviens vers vous concernant la proposition d'assurance que nous vous avons envoyée récemment pour le dossier {referenceDevis}.

Avez-vous eu l'occasion d'en prendre connaissance ? Avez-vous besoin d'ajuster certaines garanties ou d'ajouter une option ?

Je suis joignable au {telephoneCabinet} pour faire le point ensemble.

Bien cordialement,
{nomCourtier}`,
    updatedAt: '2026-07-15'
  }
];

export const initialLeads: Lead[] = [
  {
    id: 'lead-001',
    referenceDevis: 'DEV-2026-0104',
    type: 'AUTO',
    status: 'A_CONTACTER',
    qualification: 'CHAUD',
    createdAt: '2026-07-24T09:30:00Z',
    updatedAt: '2026-07-24T10:15:00Z',
    assignedBroker: 'Pierre-Antoine Dupuis',
    nom: 'Benali',
    prenom: 'Samy',
    telephone: '06 12 34 56 78',
    email: 'samy.benali@gmail.com',
    ville: 'Marseille',
    codePostal: '13008',
    prochaineActionIntitule: 'Rappeler pour ajuster la formule Tous Risques',
    prochaineActionDate: '2026-07-24',
    prochaineActionHeure: '16:30',
    notes: [
      {
        id: 'note-1',
        author: 'Pierre-Antoine Dupuis',
        date: '2026-07-24 10:15',
        content: 'Client intéressé par la formule Tous Risques avec Assistance 0km. Cherche à baisser ses frais de dossier.'
      }
    ],
    autoDetails: {
      nom: 'Benali',
      prenom: 'Samy',
      telephone: '06 12 34 56 78',
      email: 'samy.benali@gmail.com',
      adresse: '14 Boulevard Michelet',
      codePostal: '13008',
      ville: 'Marseille',
      dateNaissance: '1988-05-14',
      datePermis: '2008-06-20',
      situationFamiliale: 'Marié',
      profession: 'Cadre commercial',
      immatriculation: 'FK-892-XZ',
      dateMiseEnCirculation: '2021-03-15',
      dateAchat: '2022-01-10',
      typeUtilisation: 'Trajet privé',
      proprietaireVehicule: 'Conducteur principal',
      marqueModele: 'Peugeot 3008 GT Line 1.2 PureTech',
      dejaAssure: true,
      nomDerniereCompagnie: 'AXA Assurances',
      nombreMoisAssure36Mois: 36,
      bonusMalus: 0.50,
      aEuDesSinistres: true,
      sinistres: [
        {
          id: 'sin-1',
          nature: 'Dégât matériel stationnement',
          date: '2024-11-10',
          tauxResponsabilite: '0%',
          montantIndemnise: 850
        }
      ],
      contratStatut: 'Résilié',
      motifResiliation: 'A l\'échéance',
      aEuSuspensionOuAnnulation: false,
      formuleSouhaitee: 'Tous Risques',
      fractionnement: 'Mensuel',
      cotisationMontant: 780,
      fraisDossier: 45,
      optionsSupplementaires: ['Assistance 0km', 'Véhicule de remplacement', 'Protection Juridique']
    }
  },
  {
    id: 'lead-002',
    referenceDevis: 'DEV-2026-0105',
    type: 'VTC',
    status: 'DEVIS_ENVOYE',
    qualification: 'CHAUD',
    createdAt: '2026-07-23T14:20:00Z',
    updatedAt: '2026-07-24T08:00:00Z',
    assignedBroker: 'Sophie Moreau',
    nom: 'Kassimi',
    prenom: 'Youssef',
    telephone: '07 88 45 12 90',
    email: 'youssef.kassimi@vtc-prestige.fr',
    ville: 'Lyon',
    codePostal: '69003',
    prochaineActionIntitule: 'Relancer pour signature de l attestation VTC',
    prochaineActionDate: '2026-07-25',
    prochaineActionHeure: '10:00',
    notes: [
      {
        id: 'note-2',
        author: 'Sophie Moreau',
        date: '2026-07-23 15:45',
        content: 'Devis VTC + RC Pro envoyé par email. Client satisfait du prix, attend validation de son comptable.'
      }
    ],
    vtcDetails: {
      nom: 'Kassimi',
      prenom: 'Youssef',
      telephone: '07 88 45 12 90',
      email: 'youssef.kassimi@vtc-prestige.fr',
      adresse: '88 Avenue Saxe',
      codePostal: '69003',
      ville: 'Lyon',
      dateNaissance: '1992-11-03',
      numeroCarteVtc: 'VTC-69-2019-00481',
      dateObtentionCarteVtc: '2019-04-12',
      datePermis: '2011-09-15',
      nomSociete: 'YK DRIVER SASU',
      siret: '891 234 567 00018',
      formeJuridique: 'SASU',
      chiffreAffairesEstime: 65000,
      immatriculation: 'GK-410-TP',
      marqueModele: 'Tesla Model 3 Long Range 2023',
      anneeVehicule: '2023',
      nombrePlaces: 5,
      typeMotorisation: 'Électrique',
      typeUsage: 'VTC Exclusif',
      dejaAssure: true,
      nomDerniereCompagnie: 'Allianz',
      bonusMalus: 0.60,
      aEuDesSinistres: false,
      sinistres: [],
      besoinRcProExploitation: true,
      formuleSouhaitee: 'Tous Risques VTC + RC Pro',
      fractionnement: 'Mensuel',
      cotisationMontant: 1890,
      fraisDossier: 60,
      franchiseMontant: 600,
      optionsSupplementaires: ['Véhicule de remplacement VTC', 'Perte d\'exploitation', 'Assistance Panne 0km Pan-Europe']
    }
  },
  {
    id: 'lead-003',
    referenceDevis: 'DEV-2026-0106',
    type: 'HABITATION',
    status: 'NOUVEAU',
    qualification: 'TIEDE',
    createdAt: '2026-07-24T11:00:00Z',
    updatedAt: '2026-07-24T11:00:00Z',
    assignedBroker: 'Pierre-Antoine Dupuis',
    nom: 'Lefebvre',
    prenom: 'Claire',
    telephone: '06 99 21 00 34',
    email: 'claire.lefebvre@outlok.fr',
    ville: 'Bordeaux',
    codePostal: '33000',
    prochaineActionIntitule: 'Contacter la cliente pour préciser les m2 et dépendances',
    prochaineActionDate: '2026-07-24',
    prochaineActionHeure: '17:00',
    notes: [],
    habitationDetails: {
      nom: 'Lefebvre',
      prenom: 'Claire',
      telephone: '06 99 21 00 34',
      email: 'claire.lefebvre@outlok.fr',
      adresse: '12 Cours de l\'Intendance',
      codePostal: '33000',
      ville: 'Bordeaux',
      dateNaissance: '1982-08-25',
      typeLogement: 'Maison',
      statutOccupant: 'Propriétaire occupant',
      surfaceM2: 135,
      nombrePieces: 5,
      adresseBien: '12 Cours de l\'Intendance',
      codePostalBien: '33000',
      villeBien: 'Bordeaux',
      residencePrincipale: true,
      dependances: true,
      veranda: true,
      piscine: false,
      valeurMobilier: 45000,
      dejaAssure: true,
      nomDerniereCompagnie: 'GMF',
      nombreMoisAssure: 48,
      aEuDesSinistres: true,
      sinistres: [
        {
          id: 'sin-hab-1',
          nature: 'Dégât des eaux cuisine',
          date: '2023-04-18',
          tauxResponsabilite: '0%',
          montantIndemnise: 1200
        }
      ],
      formuleSouhaitee: 'Formule Confort',
      fractionnement: 'Annuel',
      cotisationMontant: 320,
      fraisDossier: 20,
      optionsSupplementaires: ['Protection Juridique', 'Vol & Vandalisme', 'Jardin & Piscine']
    }
  },
  {
    id: 'lead-004',
    referenceDevis: 'DEV-2026-0107',
    type: 'AUTO',
    status: 'RELANCE',
    qualification: 'CHAUD',
    createdAt: '2026-07-21T16:00:00Z',
    updatedAt: '2026-07-23T11:30:00Z',
    assignedBroker: 'Sophie Moreau',
    nom: 'Rousseau',
    prenom: 'Thomas',
    telephone: '06 55 44 33 22',
    email: 'thomas.rousseau@free.fr',
    ville: 'Nantes',
    codePostal: '44000',
    prochaineActionIntitule: 'Vérifier la réception du relevé d information',
    prochaineActionDate: '2026-07-26',
    prochaineActionHeure: '11:00',
    notes: [
      {
        id: 'note-4',
        author: 'Sophie Moreau',
        date: '2026-07-23 11:30',
        content: 'Relancé par SMS. Thomas doit récupérer son relevé d information auprès de la MAIF.'
      }
    ],
    autoDetails: {
      nom: 'Rousseau',
      prenom: 'Thomas',
      telephone: '06 55 44 33 22',
      email: 'thomas.rousseau@free.fr',
      adresse: '5 Rue Crébillon',
      codePostal: '44000',
      ville: 'Nantes',
      dateNaissance: '1995-02-18',
      datePermis: '2013-05-10',
      situationFamiliale: 'Célibataire',
      profession: 'Développeur Web',
      immatriculation: 'GA-302-LK',
      dateMiseEnCirculation: '2019-09-01',
      dateAchat: '2021-06-15',
      typeUtilisation: 'Trajet travail',
      proprietaireVehicule: 'Conducteur principal',
      marqueModele: 'Renault Clio 5 TCe 90',
      dejaAssure: true,
      nomDerniereCompagnie: 'MAIF',
      nombreMoisAssure36Mois: 36,
      bonusMalus: 0.68,
      aEuDesSinistres: false,
      sinistres: [],
      contratStatut: 'En cours',
      aEuSuspensionOuAnnulation: false,
      formuleSouhaitee: 'Tiers Étendu (Vol/Incendie)',
      fractionnement: 'Mensuel',
      cotisationMontant: 490,
      fraisDossier: 30,
      optionsSupplementaires: ['Assistance 0km', 'Protection Juridique']
    }
  },
  {
    id: 'lead-005',
    referenceDevis: 'DEV-2026-0108',
    type: 'VTC',
    status: 'GAGNE',
    qualification: 'CHAUD',
    createdAt: '2026-07-18T10:00:00Z',
    updatedAt: '2026-07-22T14:10:00Z',
    assignedBroker: 'Pierre-Antoine Dupuis',
    nom: 'Diallo',
    prenom: 'Ibrahima',
    telephone: '07 61 22 88 99',
    email: 'ibrahima.diallo@vtc-express.com',
    ville: 'Toulouse',
    codePostal: '31000',
    prochaineActionIntitule: 'Transmettre la carte verte définitive',
    prochaineActionDate: '2026-07-28',
    prochaineActionHeure: '09:30',
    notes: [
      {
        id: 'note-5',
        author: 'Pierre-Antoine Dupuis',
        date: '2026-07-22 14:10',
        content: 'Contrat signé ! Paiement premier mois effectué par CB. Attestation provisoire émise.'
      }
    ],
    vtcDetails: {
      nom: 'Diallo',
      prenom: 'Ibrahima',
      telephone: '07 61 22 88 99',
      email: 'ibrahima.diallo@vtc-express.com',
      adresse: '44 Rue Alsace Lorraine',
      codePostal: '31000',
      ville: 'Toulouse',
      dateNaissance: '1987-03-30',
      numeroCarteVtc: 'VTC-31-2020-00129',
      dateObtentionCarteVtc: '2020-01-15',
      datePermis: '2007-04-11',
      nomSociete: 'DIALLO DRIVER EURL',
      siret: '839 102 938 00011',
      formeJuridique: 'EURL',
      chiffreAffairesEstime: 52000,
      immatriculation: 'GJ-109-WW',
      marqueModele: 'Mercedes Classe E 220d AMG',
      anneeVehicule: '2022',
      nombrePlaces: 5,
      typeMotorisation: 'Diesel',
      typeUsage: 'VTC Exclusif',
      dejaAssure: true,
      nomDerniereCompagnie: 'Generali',
      bonusMalus: 0.54,
      aEuDesSinistres: false,
      sinistres: [],
      besoinRcProExploitation: true,
      formuleSouhaitee: 'Tous Risques VTC + RC Pro',
      fractionnement: 'Mensuel',
      cotisationMontant: 2150,
      fraisDossier: 50,
      franchiseMontant: 750,
      optionsSupplementaires: ['Véhicule de remplacement VTC', 'Perte d\'exploitation']
    }
  }
];
