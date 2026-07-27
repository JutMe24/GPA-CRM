export type LeadType = 'AUTO' | 'HABITATION' | 'VTC';

export type LeadStatus =
  | 'NOUVEAU'
  | 'A_CONTACTER'
  | 'DEVIS_ENVOYE'
  | 'RELANCE'
  | 'GAGNE'
  | 'PERDU'
  | string;

export type LeadQualification =
  | 'CHAUD'
  | 'TIEDE'
  | 'FROID'
  | 'HORS_CIBLE'
  | 'INJOIGNABLE';

export interface SinistreItem {
  id: string;
  nature: string; // Predefined motif or custom string
  date: string;
  tauxResponsabilite: '0%' | '50%' | '100%';
  montantIndemnise?: number;
}

export interface NoteItem {
  id: string;
  author: string;
  date: string;
  content: string;
}

export interface ActivityLogItem {
  id: string;
  type: 'STATUS_CHANGE' | 'NOTE_ADDED' | 'EMAIL_SENT' | 'QUOTE_GENERATED' | 'REMINDER_SET' | 'LEAD_CREATED' | 'LEAD_UPDATED';
  title: string;
  description: string;
  author: string;
  date: string;
  metadata?: {
    emailSubject?: string;
    emailRecipient?: string;
    oldStatus?: string;
    newStatus?: string;
    pdfName?: string;
  };
}

// Auto specific data
export interface AutoDetails {
  // Conducteur
  civilite?: 'Mr' | 'Mme';
  nom: string;
  prenom: string;
  telephone: string;
  email: string;
  adresse: string;
  codePostal: string;
  ville: string;
  dateNaissance: string;
  datePermis: string;
  situationFamiliale: string; // Célibataire, Marié(e), PACSÉ(e), Divorcé(e), Séparé(e), Veuf(ve), Concubinage
  profession: string; // Salarié, Fonctionnaire, Indépendant / TNS, Commerçant / Artisan, Profession Libérale, Chef d'entreprise, Retraité, Étudiant, Sans activité, Autre

  // Véhicule
  immatriculation: string;
  dateMiseEnCirculation: string;
  dateAchat: string;
  typeUtilisation: 'Trajet privé' | 'Trajet travail' | 'Tournées / Commercial' | 'VTC / Taxi';
  proprietaireVehicule: 'Conducteur principal' | 'Propriétaire unique' | 'Co-propriétaire' | 'LOA (Location Option d\'Achat)' | 'LLD (Location Longue Durée)' | 'Société de leasing' | 'Autre';
  marqueModele?: string;

  // Antécédents
  dejaAssure: boolean;
  nomDerniereCompagnie?: string;
  nombreMoisAssure36Mois?: number;
  bonusMalus: number; // 0.50 to 3.50
  aEuDesSinistres: boolean;
  sinistres: SinistreItem[];
  
  contratStatut: 'En cours' | 'Résilié' | 'Aucun';
  motifResiliation?: 'Non-paiement' | 'Fausse déclaration' | 'Sinistre' | 'A l\'échéance' | 'Vente véhicule' | 'Autre';
  
  // Distinguer Suspension & Annulation
  aEuSuspensionPermis?: boolean;
  suspensionDate?: string;
  suspensionMotif?: string;
  suspensionDureeMois?: number;

  aEuAnnulationPermis?: boolean;
  annulationDate?: string;
  annulationMotif?: string;

  // Retro-compatibility flag
  aEuSuspensionOuAnnulation?: boolean;

  // Proposition
  formuleSouhaitee: 'Tiers Simple' | 'Tiers Étendu (Vol/Incendie)' | 'Tous Risques';
  fractionnement: 'Mensuel' | 'Trimestriel' | 'Semestriel' | 'Annuel';
  cotisationMontant: number; // Montant correspondant au fractionnement choisi
  fraisDossier: number;
  optionsSupplementaires: string[];
}

// Habitation specific data
export interface HabitationDetails {
  // Souscripteur
  civilite?: 'Mr' | 'Mme';
  nom: string;
  prenom: string;
  telephone: string;
  email: string;
  adresse: string;
  codePostal: string;
  ville: string;
  dateNaissance: string;
  profession?: string;
  situationFamiliale?: string;

  // Logement
  typeLogement: 'Maison' | 'Appartement';
  statutOccupant: 'Propriétaire occupant' | 'Locataire' | 'PNO (Propriétaire Non Occupant)' | 'Copropriétaire';
  surfaceM2: number;
  nombrePieces: number;
  adresseBien: string;
  codePostalBien: string;
  villeBien: string;
  etage?: number;
  residencePrincipale: boolean;
  dependances: boolean;
  veranda: boolean;
  piscine: boolean;
  valeurMobilier: number;

  // Antécédents
  dejaAssure: boolean;
  nomDerniereCompagnie?: string;
  nombreMoisAssure?: number;
  aEuDesSinistres: boolean;
  sinistres: SinistreItem[];

  // Proposition
  formuleSouhaitee: 'Formule Éco' | 'Formule Confort' | 'Formule Premium Tous Risques';
  fractionnement: 'Mensuel' | 'Trimestriel' | 'Semestriel' | 'Annuel';
  cotisationMontant: number;
  fraisDossier: number;
  optionsSupplementaires: string[];
}

// VTC specific data
export interface VtcDetails {
  // Chauffeur
  civilite?: 'Mr' | 'Mme';
  nom: string;
  prenom: string;
  telephone: string;
  email: string;
  adresse: string;
  codePostal: string;
  ville: string;
  dateNaissance: string;
  numeroCarteVtc: string;
  dateObtentionCarteVtc: string;
  datePermis: string;
  profession?: string;
  situationFamiliale?: string;

  // Société
  nomSociete: string;
  siret: string;
  formeJuridique: 'Auto-entrepreneur' | 'SASU' | 'EURL' | 'SARL' | 'SAS';
  chiffreAffairesEstime?: number;

  // Véhicule VTC
  immatriculation: string;
  marqueModele: string;
  anneeVehicule: string;
  nombrePlaces: number;
  typeMotorisation: 'Électrique' | 'Hybride' | 'Diesel' | 'Essence';
  typeUsage: 'VTC Exclusif' | 'VTC + Usage Personnel';
  proprietaireVehicule?: 'Conducteur principal' | 'Propriétaire unique' | 'Co-propriétaire' | 'LOA (Location Option d\'Achat)' | 'LLD (Location Longue Durée)' | 'Société de leasing' | 'Autre';

  // Antécédents & RC Pro
  dejaAssure: boolean;
  nomDerniereCompagnie?: string;
  nombreMoisAssure36Mois?: number;
  bonusMalus: number;
  aEuDesSinistres: boolean;
  sinistres: SinistreItem[];
  besoinRcProExploitation: boolean;

  contratStatut?: 'En cours' | 'Résilié' | 'Aucun';
  motifResiliation?: 'Non-paiement' | 'Fausse déclaration' | 'Sinistre' | 'A l\'échéance' | 'Vente véhicule' | 'Autre';

  // Distinguer Suspension & Annulation
  aEuSuspensionPermis?: boolean;
  suspensionDate?: string;
  suspensionMotif?: string;
  suspensionDureeMois?: number;

  aEuAnnulationPermis?: boolean;
  annulationDate?: string;
  annulationMotif?: string;

  // Proposition
  formuleSouhaitee: 'Tiers VTC + RC Pro' | 'Tous Risques VTC + RC Pro';
  fractionnement: 'Mensuel' | 'Trimestriel' | 'Semestriel' | 'Annuel';
  cotisationMontant: number;
  fraisDossier: number;
  franchiseMontant: number;
  optionsSupplementaires: string[];
}

export interface Lead {
  id: string;
  referenceDevis: string;
  type: LeadType;
  status: LeadStatus;
  qualification: LeadQualification;
  createdAt: string;
  updatedAt: string;
  assignedBroker: string;
  attribueA?: string;
  equipe?: string;

  // Lead main contact summary
  civilite?: 'Mr' | 'Mme';
  nom: string;
  prenom: string;
  telephone: string;
  email: string;
  ville: string;
  codePostal: string;

  // Specific product data
  autoDetails?: AutoDetails;
  habitationDetails?: HabitationDetails;
  vtcDetails?: VtcDetails;

  // Next Action & Follow up
  prochaineActionIntitule?: string;
  prochaineActionDate?: string;
  prochaineActionHeure?: string;

  notes: NoteItem[];
  historyLogs?: ActivityLogItem[];
}

export interface SmtpConfig {
  host: string;
  port: number;
  username: string;
  password?: string;
  encryption: 'TLS' | 'SSL' | 'NONE';
  senderEmail: string;
  senderName: string;
  active: boolean;
}

export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  type: LeadType | 'GENERAL';
  body: string;
  updatedAt: string;
}

export interface StatusConfigItem {
  id: string;
  label: string;
  color?: string;
}

// Chat Data Models
export interface ChatAttachment {
  id: string;
  name: string;
  url: string;
  size?: string;
  type: 'image' | 'file';
}

export interface ChatMessage {
  id: string;
  channelId: string;
  senderId: string;
  senderName: string;
  senderRole: UserRole;
  senderAvatar?: string;
  content: string;
  timestamp: string;
  reactions?: Record<string, string[]>; // emoji -> userIds[]
  attachments?: ChatAttachment[];
  isSystemNotice?: boolean;
}

export interface ChatChannel {
  id: string;
  type: 'GROUP' | 'DIRECT';
  name: string;
  description?: string;
  equipe?: string;
  participantIds: string[];
  lastMessage?: string;
  lastMessageTime?: string;
  unreadCount?: number;
}

export type UserRole =
  | 'ADMIN'
  | 'DIRECTEUR_PRODUCTION'
  | 'RESPONSABLE_EQUIPE'
  | 'GESTIONNAIRE'
  | 'AGENT_COMMERCIAL'
  | 'MANAGER'  // Alias / Compatibilité
  | 'COURTIER'; // Alias / Compatibilité

export const isAdminRole = (role?: UserRole): boolean => {
  return role === 'ADMIN' || role === 'DIRECTEUR_PRODUCTION';
};

export const isResponsableRole = (role?: UserRole): boolean => {
  return role === 'RESPONSABLE_EQUIPE' || role === 'MANAGER';
};

export const isAgentRole = (role?: UserRole): boolean => {
  return role === 'AGENT_COMMERCIAL' || role === 'GESTIONNAIRE' || role === 'COURTIER' || !role;
};

export interface UserPermissions {
  canViewAllLeads: boolean;       // Voir tous les leads du cabinet ou uniquement ses propres/équipe leads
  canCreateLeads: boolean;        // Créer de nouveaux leads
  canEditLeads: boolean;          // Modifier les fiches leads
  canDeleteLeads: boolean;        // Supprimer des leads
  canChangeLeadStatus: boolean;   // Modifier le statut et la qualification
  canExportData: boolean;         // Exporter les fichiers Excel/CSV
  canManageUsers: boolean;        // Gérer les utilisateurs et attribuer les droits
  canEditSettings: boolean;       // Modifier les paramètres du cabinet et SMTP
  canAssignLeads: boolean;        // Assigner ou réaffecter les leads aux courtiers
}

export interface User {
  id: string;
  nom: string;
  prenom: string;
  email: string;
  telephone: string;
  password?: string;
  role: UserRole;
  equipe?: string;
  status: 'ACTIF' | 'INACTIF';
  avatarUrl?: string;
  specialite?: string;
  permissions: UserPermissions;
  createdAt: string;
  lastLoginAt?: string;
}

export const getDefaultPermissionsForRole = (role: UserRole): UserPermissions => {
  switch (role) {
    case 'ADMIN':
      return {
        canViewAllLeads: true,
        canCreateLeads: true,
        canEditLeads: true,
        canDeleteLeads: true,
        canChangeLeadStatus: true,
        canExportData: true,
        canManageUsers: true,
        canEditSettings: true,
        canAssignLeads: true
      };
    case 'DIRECTEUR_PRODUCTION':
      return {
        canViewAllLeads: true,
        canCreateLeads: true,
        canEditLeads: true,
        canDeleteLeads: true,
        canChangeLeadStatus: true,
        canExportData: true,
        canManageUsers: true, // Peut gérer les utilisateurs SAUF création de compte ADMIN
        canEditSettings: true,
        canAssignLeads: true
      };
    case 'RESPONSABLE_EQUIPE':
    case 'MANAGER':
      return {
        canViewAllLeads: false, // Uniquement les leads rattachés à son équipe
        canCreateLeads: true,
        canEditLeads: true,
        canDeleteLeads: false, // Ne peut pas supprimer des leads existants
        canChangeLeadStatus: true,
        canExportData: true,
        canManageUsers: false,
        canEditSettings: false, // Aucun droit sur la page paramètres
        canAssignLeads: true
      };
    case 'GESTIONNAIRE':
      return {
        canViewAllLeads: false, // Uniquement les leads rattachés à son équipe
        canCreateLeads: true,
        canEditLeads: true,
        canDeleteLeads: false, // Ne peut pas supprimer des leads existants
        canChangeLeadStatus: true,
        canExportData: true,
        canManageUsers: false,
        canEditSettings: false, // Aucun droit sur la page paramètres
        canAssignLeads: false
      };
    case 'AGENT_COMMERCIAL':
    case 'COURTIER':
    default:
      return {
        canViewAllLeads: false, // Uniquement les leads qui lui sont directement rattachés
        canCreateLeads: true,
        canEditLeads: true,
        canDeleteLeads: false, // Ne peut pas supprimer des leads existants
        canChangeLeadStatus: true,
        canExportData: false,
        canManageUsers: false,
        canEditSettings: false, // Aucun droit sur la page paramètres
        canAssignLeads: false
      };
  }
};

export interface InsurancePartnerApiConfig {
  id: string;
  code: 'ALLIANZ' | 'GENERALI' | 'APRIL' | 'MAXANCE' | 'NETVOX' | 'ZEPHIR' | 'AXA' | string;
  name: string;
  logoUrl: string;
  category: 'COMPAGNIE' | 'GROSSISTE';
  supportedProducts: LeadType[];
  apiEndpoint: string;
  apiKey: string;
  apiSecret?: string;
  codeOriasPartner?: string;
  codeIntermediaire?: string;
  environment: 'SANDBOX' | 'PRODUCTION';
  status: 'CONNECTE' | 'EN_MAINTENANCE' | 'DESACTIVE';
  commissionRate: number; // Percentage e.g. 15 for 15%
  autoQuotingEnabled: boolean;
  lastSyncAt?: string;
}

export interface PartnerTarifResult {
  partnerId: string;
  partnerCode: string;
  partnerName: string;
  partnerLogo: string;
  category: 'COMPAGNIE' | 'GROSSISTE';
  formuleName: string;
  cotisationMensuelle: number;
  cotisationAnnuelle: number;
  franchise: number;
  fraisDossier: number;
  commissionMontantEstime: number;
  commissionTaux: number;
  matchScore: number; // 0 - 100%
  garantiesIncluses: string[];
  pointsForts: string[];
  isSouscriptibleEnLigne: boolean;
  quoteRefPartenaire: string;
  délaiEffetImmédiat: boolean;
}

export interface CabinetInfo {
  nomCabinet: string;
  numeroOrias: string;
  siret: string;
  adresse: string;
  codePostal: string;
  ville: string;
  telephone: string;
  emailContact: string;
  nomCourtierPrincipal: string;
  logoUrl?: string;
  mentionsLegales: string;
  siteWeb: string;

  // Paramètres personnalisés
  customStatuses?: StatusConfigItem[];
  customNextActions?: string[];
}

