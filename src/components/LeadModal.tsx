import React, { useState, useEffect } from 'react';
import { 
  X, 
  User, 
  Car, 
  Home, 
  Briefcase, 
  ShieldAlert, 
  FileCheck, 
  Clock, 
  Plus, 
  Trash2, 
  Sparkles,
  Search,
  CheckCircle,
  Calendar,
  AlertTriangle,
  Building,
  HelpCircle
} from 'lucide-react';
import { 
  Lead, 
  LeadType, 
  LeadStatus, 
  LeadQualification, 
  SinistreItem, 
  AutoDetails, 
  HabitationDetails, 
  VtcDetails,
  CabinetInfo,
  User as UserType
} from '../types/crm';
import { generateQuoteReference } from '../utils/storage';

interface LeadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveLead: (lead: Lead) => void;
  existingLead?: Lead | null;
  cabinetInfo?: CabinetInfo;
  users?: UserType[];
  currentUser?: UserType;
}

const createDefaultAutoForm = (): AutoDetails => ({
  civilite: 'Mr',
  nom: '',
  prenom: '',
  telephone: '',
  email: '',
  adresse: '',
  codePostal: '',
  ville: '',
  dateNaissance: '',
  datePermis: '',
  situationFamiliale: 'Célibataire',
  profession: 'Salarié',
  immatriculation: '',
  dateMiseEnCirculation: '',
  dateAchat: '',
  typeUtilisation: 'Trajet privé',
  proprietaireVehicule: 'Conducteur principal',
  marqueModele: '',
  dejaAssure: false,
  nomDerniereCompagnie: '',
  nombreMoisAssure36Mois: 0,
  bonusMalus: 0.50,
  aEuDesSinistres: false,
  sinistres: [],
  contratStatut: 'En cours',
  motifResiliation: 'A l\'échéance',
  aEuSuspensionPermis: false,
  suspensionDate: '',
  suspensionMotif: 'Alcooolémie',
  suspensionDureeMois: 0,
  aEuAnnulationPermis: false,
  annulationDate: '',
  annulationMotif: 'Solde de points nul',
  formuleSouhaitee: 'Tous Risques',
  fractionnement: 'Mensuel',
  cotisationMontant: 0,
  fraisDossier: 0,
  optionsSupplementaires: []
});

const createDefaultHabitationForm = (): HabitationDetails => ({
  civilite: 'Mr',
  nom: '',
  prenom: '',
  telephone: '',
  email: '',
  adresse: '',
  codePostal: '',
  ville: '',
  dateNaissance: '',
  profession: 'Salarié',
  situationFamiliale: 'Célibataire',
  typeLogement: 'Appartement',
  statutOccupant: 'Locataire',
  surfaceM2: 0,
  nombrePieces: 1,
  adresseBien: '',
  codePostalBien: '',
  villeBien: '',
  residencePrincipale: true,
  dependances: false,
  veranda: false,
  piscine: false,
  valeurMobilier: 0,
  dejaAssure: false,
  nomDerniereCompagnie: '',
  nombreMoisAssure: 0,
  aEuDesSinistres: false,
  sinistres: [],
  formuleSouhaitee: 'Formule Confort',
  fractionnement: 'Mensuel',
  cotisationMontant: 0,
  fraisDossier: 0,
  optionsSupplementaires: []
});

const createDefaultVtcForm = (): VtcDetails => ({
  civilite: 'Mr',
  nom: '',
  prenom: '',
  telephone: '',
  email: '',
  adresse: '',
  codePostal: '',
  ville: '',
  dateNaissance: '',
  numeroCarteVtc: '',
  dateObtentionCarteVtc: '',
  datePermis: '',
  profession: 'Chef d\'entreprise',
  situationFamiliale: 'Célibataire',
  nomSociete: '',
  siret: '',
  formeJuridique: 'SASU',
  chiffreAffairesEstime: 0,
  immatriculation: '',
  marqueModele: '',
  anneeVehicule: '',
  nombrePlaces: 5,
  typeMotorisation: 'Hybride',
  typeUsage: 'VTC Exclusif',
  proprietaireVehicule: 'Propriétaire unique',
  dejaAssure: false,
  nomDerniereCompagnie: '',
  bonusMalus: 0.50,
  aEuDesSinistres: false,
  sinistres: [],
  besoinRcProExploitation: true,
  aEuSuspensionPermis: false,
  suspensionDate: '',
  suspensionMotif: 'Alcooolémie',
  suspensionDureeMois: 0,
  aEuAnnulationPermis: false,
  annulationDate: '',
  annulationMotif: 'Solde de points nul',
  formuleSouhaitee: 'Tous Risques VTC + RC Pro',
  fractionnement: 'Mensuel',
  cotisationMontant: 0,
  fraisDossier: 0,
  franchiseMontant: 0,
  optionsSupplementaires: []
});

export const LeadModal: React.FC<LeadModalProps> = ({
  isOpen,
  onClose,
  onSaveLead,
  existingLead,
  cabinetInfo,
  users = [],
  currentUser
}) => {
  if (!isOpen) return null;

  const isEditing = !!existingLead;

  // Selected Product Type
  const [leadType, setLeadType] = useState<LeadType>(existingLead?.type || 'AUTO');

  // Active Tab Index inside the form wizard
  const [activeTab, setActiveTab] = useState<number>(0);

  // Statuses & Actions options from Cabinet Config or defaults
  const statusesOptions = cabinetInfo?.customStatuses || [
    { id: 'NOUVEAU', label: 'Nouveau Lead' },
    { id: 'A_CONTACTER', label: 'À Contacter' },
    { id: 'DEVIS_ENVOYE', label: 'Devis Envoyé' },
    { id: 'RELANCE', label: 'Relance à faire' },
    { id: 'GAGNE', label: 'Souscrit / Gagné' },
    { id: 'PERDU', label: 'Perdu / Rejeté' }
  ];

  const nextActionsOptions = cabinetInfo?.customNextActions || [
    'Appel téléphonique',
    'Attente retour client',
    'Aucune action',
    'Relance devis',
    'Relance documents'
  ];

  // Common Top-level fields
  const [status, setStatus] = useState<LeadStatus>(existingLead?.status || 'NOUVEAU');
  const [qualification, setQualification] = useState<LeadQualification>(existingLead?.qualification || 'CHAUD');
  const [assignedBroker, setAssignedBroker] = useState<string>(existingLead?.assignedBroker || (currentUser ? `${currentUser.prenom} ${currentUser.nom}` : cabinetInfo?.nomCourtierPrincipal || 'Pierre-Antoine Dupuis'));
  const [equipe, setEquipe] = useState<string>(existingLead?.equipe || currentUser?.equipe || '');
  const [prochaineActionIntitule, setProchaineActionIntitule] = useState<string>(existingLead?.prochaineActionIntitule || 'Appel téléphonique');
  const [prochaineActionDate, setProchaineActionDate] = useState<string>(existingLead?.prochaineActionDate || new Date().toISOString().split('T')[0]);
  const [prochaineActionHeure, setProchaineActionHeure] = useState<string>(existingLead?.prochaineActionHeure || '15:00');
  const [newNoteText, setNewNoteText] = useState<string>('');

  // Filtering selectable agents based on current user role and team
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

  const renderAgentSelect = () => {
    const isAssignmentAllowed = Boolean(
      currentUser?.role === 'ADMIN' ||
      currentUser?.role === 'DIRECTEUR_PRODUCTION' ||
      currentUser?.role === 'RESPONSABLE_EQUIPE' ||
      currentUser?.role === 'MANAGER' ||
      currentUser?.permissions?.canAssignLeads
    );

    return (
      <div>
        <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
          <span>Agent Commercial Attribué *</span>
          {currentUser?.role === 'RESPONSABLE_EQUIPE' && currentUser.equipe && (
            <span className="text-[10px] text-indigo-600 font-semibold">
              (Équipe: {currentUser.equipe})
            </span>
          )}
        </label>
        {selectableUsers.length > 0 ? (
          <select
            value={assignedBroker}
            onChange={(e) => {
              const val = e.target.value;
              setAssignedBroker(val);
              const matched = users?.find(u => `${u.prenom} ${u.nom}` === val);
              if (matched && matched.equipe) {
                setEquipe(matched.equipe);
              }
            }}
            disabled={!isAssignmentAllowed}
            className="w-full text-xs font-bold p-2.5 rounded-lg border border-slate-300 bg-white text-slate-800 focus:ring-2 focus:ring-blue-500 cursor-pointer disabled:bg-slate-100 disabled:cursor-not-allowed"
          >
            {selectableUsers.map((u) => (
              <option key={u.id} value={`${u.prenom} ${u.nom}`}>
                {u.prenom} {u.nom} ({u.role === 'AGENT_COMMERCIAL' ? 'Agent Commercial' : u.role === 'RESPONSABLE_EQUIPE' ? 'Resp. Équipe' : u.role}) {u.equipe ? `— ${u.equipe}` : ''}
              </option>
            ))}
            {assignedBroker && !selectableUsers.some(u => `${u.prenom} ${u.nom}` === assignedBroker) && (
              <option value={assignedBroker}>{assignedBroker}</option>
            )}
          </select>
        ) : (
          <input
            type="text"
            value={assignedBroker}
            onChange={(e) => setAssignedBroker(e.target.value)}
            className="w-full text-xs p-2.5 rounded-lg border border-slate-300 font-bold"
            placeholder="Nom de l'agent"
          />
        )}
        {currentUser?.role === 'RESPONSABLE_EQUIPE' && (
          <p className="text-[10px] text-slate-500 mt-1">
            💡 Vous pouvez assigner ce lead uniquement aux agents de votre équipe ({currentUser.equipe}).
          </p>
        )}
      </div>
    );
  };

  // ------------------------------------
  // AUTO DETAILS STATE
  // ------------------------------------
  const [autoForm, setAutoForm] = useState<AutoDetails>(
    existingLead?.autoDetails || createDefaultAutoForm()
  );

  // ------------------------------------
  // HABITATION DETAILS STATE
  // ------------------------------------
  const [habitationForm, setHabitationForm] = useState<HabitationDetails>(
    existingLead?.habitationDetails || createDefaultHabitationForm()
  );

  // ------------------------------------
  // VTC DETAILS STATE
  // ------------------------------------
  const [vtcForm, setVtcForm] = useState<VtcDetails>(
    existingLead?.vtcDetails || createDefaultVtcForm()
  );

  // Reset or initialize state whenever modal opens or existingLead changes
  useEffect(() => {
    if (isOpen) {
      setActiveTab(0);
      setNewNoteText('');
      if (existingLead) {
        setLeadType(existingLead.type);
        setStatus(existingLead.status || 'NOUVEAU');
        setQualification(existingLead.qualification || 'CHAUD');
        setAssignedBroker(existingLead.assignedBroker || existingLead.attribueA || (currentUser ? `${currentUser.prenom} ${currentUser.nom}` : cabinetInfo?.nomCourtierPrincipal || 'Pierre-Antoine Dupuis'));
        setEquipe(existingLead.equipe || currentUser?.equipe || '');
        setProchaineActionIntitule(existingLead.prochaineActionIntitule || 'Appel téléphonique');
        setProchaineActionDate(existingLead.prochaineActionDate || new Date().toISOString().split('T')[0]);
        setProchaineActionHeure(existingLead.prochaineActionHeure || '15:00');

        setAutoForm(existingLead.autoDetails || createDefaultAutoForm());
        setHabitationForm(existingLead.habitationDetails || createDefaultHabitationForm());
        setVtcForm(existingLead.vtcDetails || createDefaultVtcForm());
      } else {
        // Nouveau Lead: Formulaire 100% vierge
        setLeadType('AUTO');
        setStatus('NOUVEAU');
        setQualification('CHAUD');
        const defaultAgent = currentUser ? `${currentUser.prenom} ${currentUser.nom}` : (cabinetInfo?.nomCourtierPrincipal || 'Pierre-Antoine Dupuis');
        setAssignedBroker(defaultAgent);
        setEquipe(currentUser?.equipe || 'Équipe Auto & Habitation');
        setProchaineActionIntitule('Appel téléphonique');
        setProchaineActionDate(new Date().toISOString().split('T')[0]);
        setProchaineActionHeure('15:00');

        setAutoForm(createDefaultAutoForm());
        setHabitationForm(createDefaultHabitationForm());
        setVtcForm(createDefaultVtcForm());
      }
    }
  }, [isOpen, existingLead, cabinetInfo, currentUser]);

  // SIV License Plate Lookup Handler
  const [isLoadingSiv, setIsLoadingSiv] = useState(false);
  const handleSivLookup = () => {
    setIsLoadingSiv(true);
    setTimeout(() => {
      setIsLoadingSiv(false);
      setAutoForm(prev => ({
        ...prev,
        marqueModele: 'Renault Austral E-Tech Hybrid 200',
        dateMiseEnCirculation: '2023-05-10',
        dateAchat: '2023-06-01'
      }));
    }, 600);
  };

  // Sinistre Handler Helpers
  const addSinistre = (type: 'AUTO' | 'HABITATION' | 'VTC') => {
    const newSin: SinistreItem = {
      id: 'sin-' + Date.now(),
      nature: 'Accident responsable',
      date: new Date().toISOString().split('T')[0],
      tauxResponsabilite: '100%'
    };

    if (type === 'AUTO') {
      setAutoForm(prev => ({ ...prev, sinistres: [...prev.sinistres, newSin] }));
    } else if (type === 'HABITATION') {
      setHabitationForm(prev => ({ ...prev, sinistres: [...prev.sinistres, newSin] }));
    } else {
      setVtcForm(prev => ({ ...prev, sinistres: [...prev.sinistres, newSin] }));
    }
  };

  const removeSinistre = (type: 'AUTO' | 'HABITATION' | 'VTC', id: string) => {
    if (type === 'AUTO') {
      setAutoForm(prev => ({ ...prev, sinistres: prev.sinistres.filter(s => s.id !== id) }));
    } else if (type === 'HABITATION') {
      setHabitationForm(prev => ({ ...prev, sinistres: prev.sinistres.filter(s => s.id !== id) }));
    } else {
      setVtcForm(prev => ({ ...prev, sinistres: prev.sinistres.filter(s => s.id !== id) }));
    }
  };

  // Toggle options for Auto
  const toggleAutoOption = (optionName: string) => {
    setAutoForm(prev => {
      const exists = prev.optionsSupplementaires.includes(optionName);
      return {
        ...prev,
        optionsSupplementaires: exists 
          ? prev.optionsSupplementaires.filter(o => o !== optionName)
          : [...prev.optionsSupplementaires, optionName]
      };
    });
  };

  // Toggle options for Habitation
  const toggleHabitationOption = (optionName: string) => {
    setHabitationForm(prev => {
      const exists = prev.optionsSupplementaires.includes(optionName);
      return {
        ...prev,
        optionsSupplementaires: exists 
          ? prev.optionsSupplementaires.filter(o => o !== optionName)
          : [...prev.optionsSupplementaires, optionName]
      };
    });
  };

  // Toggle options for VTC
  const toggleVtcOption = (optionName: string) => {
    setVtcForm(prev => {
      const exists = prev.optionsSupplementaires.includes(optionName);
      return {
        ...prev,
        optionsSupplementaires: exists 
          ? prev.optionsSupplementaires.filter(o => o !== optionName)
          : [...prev.optionsSupplementaires, optionName]
      };
    });
  };

  // Save submit
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    let civilite: 'Mr' | 'Mme' = 'Mr';
    let nom = '';
    let prenom = '';
    let telephone = '';
    let email = '';
    let ville = '';
    let codePostal = '';

    if (leadType === 'AUTO') {
      civilite = autoForm.civilite || 'Mr';
      nom = autoForm.nom || 'Sans nom';
      prenom = autoForm.prenom || '';
      telephone = autoForm.telephone;
      email = autoForm.email;
      ville = autoForm.ville;
      codePostal = autoForm.codePostal;
    } else if (leadType === 'HABITATION') {
      civilite = habitationForm.civilite || 'Mme';
      nom = habitationForm.nom || 'Sans nom';
      prenom = habitationForm.prenom || '';
      telephone = habitationForm.telephone;
      email = habitationForm.email;
      ville = habitationForm.ville;
      codePostal = habitationForm.codePostal;
    } else {
      civilite = vtcForm.civilite || 'Mr';
      nom = vtcForm.nom || 'Sans nom';
      prenom = vtcForm.prenom || '';
      telephone = vtcForm.telephone;
      email = vtcForm.email;
      ville = vtcForm.ville;
      codePostal = vtcForm.codePostal;
    }

    const existingNotes = existingLead?.notes || [];
    const updatedNotes = [...existingNotes];

    if (newNoteText.trim()) {
      updatedNotes.unshift({
        id: 'note-' + Date.now(),
        author: assignedBroker,
        date: new Date().toISOString().replace('T', ' ').substring(0, 16),
        content: newNoteText.trim()
      });
    }

    const now = new Date().toISOString();
    const matchedUser = users?.find(u => `${u.prenom} ${u.nom}` === assignedBroker);
    const finalEquipe = equipe || matchedUser?.equipe || currentUser?.equipe || 'Équipe Auto & Habitation';

    const savedLead: Lead = {
      id: existingLead?.id || 'lead-' + Date.now(),
      referenceDevis: existingLead?.referenceDevis || generateQuoteReference(leadType),
      type: leadType,
      status,
      qualification,
      createdAt: existingLead?.createdAt || now,
      updatedAt: now,
      assignedBroker,
      attribueA: assignedBroker,
      equipe: finalEquipe,
      civilite,
      nom,
      prenom,
      telephone,
      email,
      ville,
      codePostal,
      autoDetails: leadType === 'AUTO' ? autoForm : undefined,
      habitationDetails: leadType === 'HABITATION' ? habitationForm : undefined,
      vtcDetails: leadType === 'VTC' ? vtcForm : undefined,
      prochaineActionIntitule,
      prochaineActionDate,
      prochaineActionHeure,
      notes: updatedNotes
    };

    onSaveLead(savedLead);
    onClose();
  };

  // Helper for dynamic tab counts
  const autoTabs = ['Conducteur', 'Véhicule', 'Antécédents', 'Proposition', 'Notes & Relance'];
  const habitationTabs = ['Souscripteur', 'Logement', 'Antécédents', 'Proposition', 'Notes & Relance'];
  const vtcTabs = ['Chauffeur', 'Société', 'Véhicule', 'Antécédents', 'Proposition', 'Notes & Relance'];

  const currentTabLabels = leadType === 'AUTO' ? autoTabs : leadType === 'HABITATION' ? habitationTabs : vtcTabs;

  const getCotisationLabel = (fractionnement: string) => {
    switch (fractionnement) {
      case 'Mensuel':
        return 'Cotisation Mensuelle (€ TTC) *';
      case 'Trimestriel':
        return 'Cotisation Trimestrielle (€ TTC) *';
      case 'Semestriel':
        return 'Cotisation Semestrielle (€ TTC) *';
      case 'Annuel':
      default:
        return 'Cotisation Annuelle (€ TTC) *';
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-white w-full max-w-5xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 p-5 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-blue-600/30 border border-blue-400/40 rounded-2xl">
              <Sparkles className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <h3 className="text-lg font-bold">
                {isEditing ? `Modifier le Lead (${existingLead.referenceDevis})` : 'Nouveau Lead - Saisie Devis CRM'}
              </h3>
              <p className="text-xs text-slate-300">Formulaire complet d'enregistrement & qualification courtier</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Product Type Selector Pills */}
        <div className="bg-slate-100 p-3 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold text-slate-600 uppercase tracking-wider mr-1">Branche :</span>
            
            <button
              type="button"
              onClick={() => { setLeadType('AUTO'); setActiveTab(0); }}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
                leadType === 'AUTO' 
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20' 
                  : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-200'
              }`}
            >
              <Car className="w-4 h-4" />
              <span>AUTO</span>
            </button>

            <button
              type="button"
              onClick={() => { setLeadType('HABITATION'); setActiveTab(0); }}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
                leadType === 'HABITATION' 
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20' 
                  : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-200'
              }`}
            >
              <Home className="w-4 h-4" />
              <span>HABITATION</span>
            </button>

            <button
              type="button"
              onClick={() => { setLeadType('VTC'); setActiveTab(0); }}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
                leadType === 'VTC' 
                  ? 'bg-amber-600 text-white shadow-md shadow-amber-600/20' 
                  : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-200'
              }`}
            >
              <Briefcase className="w-4 h-4" />
              <span>VTC</span>
            </button>
          </div>

          {/* Quick Info Badge */}
          <div className="text-[11px] font-semibold text-slate-500 bg-white px-3 py-1.5 rounded-lg border border-slate-200 hidden sm:block">
            {leadType === 'AUTO' && '🚗 Assurance Automobile Particulier & Pro'}
            {leadType === 'HABITATION' && '🏡 Multirisque Habitation MRH & PNO'}
            {leadType === 'VTC' && '🚕 RC Pro & Véhicule Transport de Personnes'}
          </div>
        </div>

        {/* Form Wizard Navigation Tabs */}
        <div className="bg-slate-50 border-b border-slate-200 px-6 pt-3 flex space-x-2 overflow-x-auto shrink-0">
          {currentTabLabels.map((tabLabel, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setActiveTab(idx)}
              className={`px-4 py-2.5 text-xs font-bold rounded-t-xl transition border-b-2 whitespace-nowrap ${
                activeTab === idx
                  ? 'bg-white text-blue-700 border-blue-600 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 border-transparent'
              }`}
            >
              <span className="mr-1 text-slate-400">{idx + 1}.</span> {tabLabel}
            </button>
          ))}
        </div>

        {/* Form Body Container */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">

          {/* ========================================================= */}
          {/* AUTO FORM TABS */}
          {/* ========================================================= */}
          {leadType === 'AUTO' && (
            <>
              {/* TAB 0: CONDUCTEUR */}
              {activeTab === 0 && (
                <div className="space-y-4">
                  <h4 className="text-sm font-bold text-slate-900 border-b border-slate-200 pb-2 flex items-center gap-2">
                    <User className="w-4 h-4 text-blue-600" />
                    Informations Conducteur Principal
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Civilité *</label>
                      <select
                        value={autoForm.civilite || 'Mr'}
                        onChange={(e) => setAutoForm({ ...autoForm, civilite: e.target.value as any })}
                        className="w-full text-xs p-2.5 rounded-lg border border-slate-300 font-bold"
                      >
                        <option value="Mr">Monsieur (M.)</option>
                        <option value="Mme">Madame (Mme)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Nom *</label>
                      <input
                        type="text"
                        required
                        value={autoForm.nom}
                        onChange={(e) => setAutoForm({ ...autoForm, nom: e.target.value })}
                        className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 font-bold"
                        placeholder="ex: Benali"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Prénom *</label>
                      <input
                        type="text"
                        required
                        value={autoForm.prenom}
                        onChange={(e) => setAutoForm({ ...autoForm, prenom: e.target.value })}
                        className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 font-bold"
                        placeholder="ex: Samy"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Téléphone *</label>
                      <input
                        type="tel"
                        required
                        value={autoForm.telephone}
                        onChange={(e) => setAutoForm({ ...autoForm, telephone: e.target.value })}
                        className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500"
                        placeholder="ex: 06 12 34 56 78"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Email *</label>
                      <input
                        type="email"
                        required
                        value={autoForm.email}
                        onChange={(e) => setAutoForm({ ...autoForm, email: e.target.value })}
                        className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500"
                        placeholder="samy@gmail.com"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Date de Naissance *</label>
                      <input
                        type="date"
                        required
                        value={autoForm.dateNaissance}
                        onChange={(e) => setAutoForm({ ...autoForm, dateNaissance: e.target.value })}
                        className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Date d'Obtention Permis B *</label>
                      <input
                        type="date"
                        required
                        value={autoForm.datePermis}
                        onChange={(e) => setAutoForm({ ...autoForm, datePermis: e.target.value })}
                        className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-xs font-bold text-slate-700 mb-1">Adresse Voie & Résidence</label>
                      <input
                        type="text"
                        value={autoForm.adresse}
                        onChange={(e) => setAutoForm({ ...autoForm, adresse: e.target.value })}
                        className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500"
                        placeholder="ex: 14 Boulevard Michelet"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Code Postal & Ville</label>
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="text"
                          value={autoForm.codePostal}
                          onChange={(e) => setAutoForm({ ...autoForm, codePostal: e.target.value })}
                          className="w-full text-xs p-2.5 rounded-lg border border-slate-300"
                          placeholder="13008"
                        />
                        <input
                          type="text"
                          value={autoForm.ville}
                          onChange={(e) => setAutoForm({ ...autoForm, ville: e.target.value })}
                          className="w-full text-xs p-2.5 rounded-lg border border-slate-300"
                          placeholder="Marseille"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Situation Familiale</label>
                      <select
                        value={autoForm.situationFamiliale}
                        onChange={(e) => setAutoForm({ ...autoForm, situationFamiliale: e.target.value })}
                        className="w-full text-xs p-2.5 rounded-lg border border-slate-300 font-medium"
                      >
                        <option value="Célibataire">Célibataire</option>
                        <option value="Marié(e)">Marié(e)</option>
                        <option value="PACSÉ(e)">PACSÉ(e)</option>
                        <option value="Divorcé(e)">Divorcé(e)</option>
                        <option value="Séparé(e)">Séparé(e)</option>
                        <option value="Veuf(ve)">Veuf(ve)</option>
                        <option value="Concubinage">Concubinage</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Profession</label>
                      <select
                        value={autoForm.profession}
                        onChange={(e) => setAutoForm({ ...autoForm, profession: e.target.value })}
                        className="w-full text-xs p-2.5 rounded-lg border border-slate-300 font-medium"
                      >
                        <option value="Salarié">Salarié(e)</option>
                        <option value="Fonctionnaire">Fonctionnaire</option>
                        <option value="Indépendant / TNS">Indépendant / TNS</option>
                        <option value="Commerçant / Artisan">Commerçant / Artisan</option>
                        <option value="Profession Libérale">Profession Libérale</option>
                        <option value="Chef d'entreprise">Chef d'entreprise</option>
                        <option value="Retraité">Retraité(e)</option>
                        <option value="Étudiant">Étudiant(e)</option>
                        <option value="Sans activité">Sans activité / Demandeur d'emploi</option>
                        <option value="Autre">Autre profession</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 1: VEHICULE */}
              {activeTab === 1 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                    <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      <Car className="w-4 h-4 text-blue-600" />
                      Informations du Véhicule Assuré
                    </h4>
                  </div>

                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                    <div className="flex flex-col sm:flex-row items-end gap-3">
                      <div className="flex-1">
                        <label className="block text-xs font-bold text-slate-800 mb-1">Immatriculation (SIV)</label>
                        <input
                          type="text"
                          required
                          value={autoForm.immatriculation}
                          onChange={(e) => setAutoForm({ ...autoForm, immatriculation: e.target.value.toUpperCase() })}
                          className="w-full text-sm font-mono font-bold uppercase tracking-wider p-2.5 rounded-lg border border-slate-300 bg-amber-50/40 text-slate-900"
                          placeholder="FK-892-XZ"
                        />
                      </div>

                      <button
                        type="button"
                        onClick={handleSivLookup}
                        disabled={isLoadingSiv}
                        className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg flex items-center gap-2 transition cursor-pointer"
                      >
                        <Search className="w-3.5 h-3.5 text-amber-400" />
                        <span>{isLoadingSiv ? 'Décodage SIV...' : 'Recherche SIV'}</span>
                      </button>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Marque / Modèle / Version</label>
                      <input
                        type="text"
                        value={autoForm.marqueModele || ''}
                        onChange={(e) => setAutoForm({ ...autoForm, marqueModele: e.target.value })}
                        className="w-full text-xs p-2.5 rounded-lg border border-slate-300"
                        placeholder="ex: Peugeot 3008 GT Line 1.2 PureTech"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Date de 1ère Mise en Circulation</label>
                      <input
                        type="date"
                        value={autoForm.dateMiseEnCirculation}
                        onChange={(e) => setAutoForm({ ...autoForm, dateMiseEnCirculation: e.target.value })}
                        className="w-full text-xs p-2.5 rounded-lg border border-slate-300"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Date d'Achat du Véhicule</label>
                      <input
                        type="date"
                        value={autoForm.dateAchat}
                        onChange={(e) => setAutoForm({ ...autoForm, dateAchat: e.target.value })}
                        className="w-full text-xs p-2.5 rounded-lg border border-slate-300"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Type d'Utilisation du Véhicule</label>
                      <select
                        value={autoForm.typeUtilisation}
                        onChange={(e) => setAutoForm({ ...autoForm, typeUtilisation: e.target.value as any })}
                        className="w-full text-xs p-2.5 rounded-lg border border-slate-300 font-medium"
                      >
                        <option value="Trajet privé">Trajet privé uniquement</option>
                        <option value="Trajet travail">Trajet privé + travail</option>
                        <option value="Tournées / Commercial">Tournées / Déplacements pro</option>
                        <option value="VTC / Taxi">VTC / Transport de personnes</option>
                      </select>
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-xs font-bold text-slate-700 mb-1">Propriétaire du Véhicule (Carte Grise)</label>
                      <select
                        value={autoForm.proprietaireVehicule}
                        onChange={(e) => setAutoForm({ ...autoForm, proprietaireVehicule: e.target.value as any })}
                        className="w-full text-xs p-2.5 rounded-lg border border-slate-300 font-medium"
                      >
                        <option value="Conducteur principal">Conducteur principal</option>
                        <option value="Propriétaire unique">Propriétaire unique</option>
                        <option value="Co-propriétaire">Co-propriétaire</option>
                        <option value="LOA (Location Option d'Achat)">LOA (Location Option d'Achat)</option>
                        <option value="LLD (Location Longue Durée)">LLD (Location Longue Durée)</option>
                        <option value="Société de leasing">Société de leasing</option>
                        <option value="Autre">Autre tiers</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: ANTECEDENTS */}
              {activeTab === 2 && (
                <div className="space-y-5">
                  <h4 className="text-sm font-bold text-slate-900 border-b border-slate-200 pb-2 flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4 text-blue-600" />
                    Antécédents d'Assurance & Historique de Sinistralité
                  </h4>

                  {/* Section Déjà Assuré */}
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-4">
                    <div className="flex items-center space-x-6">
                      <span className="text-xs font-bold text-slate-800">Client déjà assuré auparavant ?</span>
                      <label className="flex items-center space-x-2 text-xs font-medium cursor-pointer">
                        <input
                          type="radio"
                          checked={autoForm.dejaAssure}
                          onChange={() => setAutoForm({ ...autoForm, dejaAssure: true })}
                          className="text-blue-600 focus:ring-blue-500"
                        />
                        <span>Oui</span>
                      </label>
                      <label className="flex items-center space-x-2 text-xs font-medium cursor-pointer">
                        <input
                          type="radio"
                          checked={!autoForm.dejaAssure}
                          onChange={() => setAutoForm({ ...autoForm, dejaAssure: false })}
                          className="text-blue-600 focus:ring-blue-500"
                        />
                        <span>Non (Jamais assuré)</span>
                      </label>
                    </div>

                    {autoForm.dejaAssure && (
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-slate-200">
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">Nom Dernière Compagnie</label>
                          <input
                            type="text"
                            value={autoForm.nomDerniereCompagnie || ''}
                            onChange={(e) => setAutoForm({ ...autoForm, nomDerniereCompagnie: e.target.value })}
                            className="w-full text-xs p-2.5 rounded-lg border border-slate-300"
                            placeholder="ex: AXA, Allianz, MAIF..."
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">Mois Assuré (sur 36 derniers mois)</label>
                          <input
                            type="number"
                            min="0"
                            max="36"
                            value={autoForm.nombreMoisAssure36Mois || 36}
                            onChange={(e) => setAutoForm({ ...autoForm, nombreMoisAssure36Mois: parseInt(e.target.value) || 0 })}
                            className="w-full text-xs p-2.5 rounded-lg border border-slate-300"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">Bonus / Malus CRM (ex: 0.50)</label>
                          <input
                            type="number"
                            step="0.01"
                            min="0.50"
                            max="3.50"
                            value={autoForm.bonusMalus}
                            onChange={(e) => setAutoForm({ ...autoForm, bonusMalus: parseFloat(e.target.value) || 0.50 })}
                            className="w-full text-xs font-bold text-blue-700 p-2.5 rounded-lg border border-slate-300 bg-blue-50/50"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Contrat en cours ou résilié */}
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-800 mb-1">Statut du contrat d'assurance</label>
                        <select
                          value={autoForm.contratStatut}
                          onChange={(e) => setAutoForm({ ...autoForm, contratStatut: e.target.value as any })}
                          className="w-full text-xs p-2.5 rounded-lg border border-slate-300"
                        >
                          <option value="En cours">Contrat en cours</option>
                          <option value="Résilié">Contrat résilié</option>
                          <option value="Aucun">Aucun contrat actif</option>
                        </select>
                      </div>

                      {autoForm.contratStatut === 'Résilié' && (
                        <div>
                          <label className="block text-xs font-bold text-slate-800 mb-1">Motif de Résiliation</label>
                          <select
                            value={autoForm.motifResiliation}
                            onChange={(e) => setAutoForm({ ...autoForm, motifResiliation: e.target.value as any })}
                            className="w-full text-xs p-2.5 rounded-lg border border-slate-300 font-semibold text-amber-900"
                          >
                            <option value="A l'échéance">Résiliation à l'échéance</option>
                            <option value="Non-paiement">Résiliation pour Non-Paiement</option>
                            <option value="Sinistre">Résiliation pour Sinistre</option>
                            <option value="Fausse déclaration">Fausse déclaration</option>
                            <option value="Vente véhicule">Vente du véhicule</option>
                            <option value="Autre">Autre motif</option>
                          </select>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Sinistres avec motifs en liste */}
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <span className="text-xs font-bold text-slate-800">Des sinistres sur les 36 derniers mois ?</span>
                        <input
                          type="checkbox"
                          checked={autoForm.aEuDesSinistres}
                          onChange={(e) => setAutoForm({ ...autoForm, aEuDesSinistres: e.target.checked })}
                          className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                        />
                      </div>

                      {autoForm.aEuDesSinistres && (
                        <button
                          type="button"
                          onClick={() => addSinistre('AUTO')}
                          className="px-3 py-1 bg-blue-600 text-white text-xs font-semibold rounded-lg flex items-center gap-1 hover:bg-blue-500 transition"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Ajouter un sinistre</span>
                        </button>
                      )}
                    </div>

                    {autoForm.aEuDesSinistres && (
                      <div className="space-y-3 pt-2">
                        {autoForm.sinistres.length === 0 ? (
                          <p className="text-xs text-slate-500 italic">Cliquer sur "Ajouter un sinistre" pour sélectionner le motif, la date et la responsabilité.</p>
                        ) : (
                          autoForm.sinistres.map((sin, idx) => (
                            <div key={sin.id} className="p-3 bg-white rounded-lg border border-slate-300 flex flex-col sm:flex-row items-center gap-3">
                              <span className="text-xs font-bold text-slate-500">#{idx + 1}</span>
                              <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-2 w-full">
                                <div>
                                  <label className="block text-[10px] font-bold text-slate-500 mb-0.5">Motif / Nature du Sinistre</label>
                                  <select
                                    value={sin.nature}
                                    onChange={(e) => {
                                      const next = [...autoForm.sinistres];
                                      next[idx].nature = e.target.value;
                                      setAutoForm({ ...autoForm, sinistres: next });
                                    }}
                                    className="w-full text-xs p-2 rounded border border-slate-300 font-medium"
                                  >
                                    <option value="Accident responsable">Accident responsable</option>
                                    <option value="Accident non-responsable">Accident non-responsable</option>
                                    <option value="Accident partiellement responsable">Accident partiellement responsable</option>
                                    <option value="Vol / Tentative de vol">Vol / Tentative de vol</option>
                                    <option value="Incendie / Explosion">Incendie / Explosion</option>
                                    <option value="Bris de glace">Bris de glace</option>
                                    <option value="Vandalisme / Dégradations">Vandalisme / Dégradations</option>
                                    <option value="Dommage en stationnement">Dommage en stationnement</option>
                                    <option value="Événement naturel / Tempête / Grêle">Événement naturel / Tempête / Grêle</option>
                                    <option value="Catastrophe naturelle">Catastrophe naturelle</option>
                                    <option value="Responsabilité civile">Responsabilité civile</option>
                                    <option value="Autre">Autre motif</option>
                                  </select>
                                </div>

                                <div>
                                  <label className="block text-[10px] font-bold text-slate-500 mb-0.5">Date du Sinistre</label>
                                  <input
                                    type="date"
                                    value={sin.date}
                                    onChange={(e) => {
                                      const next = [...autoForm.sinistres];
                                      next[idx].date = e.target.value;
                                      setAutoForm({ ...autoForm, sinistres: next });
                                    }}
                                    className="w-full text-xs p-2 rounded border border-slate-300"
                                  />
                                </div>

                                <div>
                                  <label className="block text-[10px] font-bold text-slate-500 mb-0.5">Taux Responsabilité</label>
                                  <select
                                    value={sin.tauxResponsabilite}
                                    onChange={(e) => {
                                      const next = [...autoForm.sinistres];
                                      next[idx].tauxResponsabilite = e.target.value as any;
                                      setAutoForm({ ...autoForm, sinistres: next });
                                    }}
                                    className="w-full text-xs p-2 rounded border border-slate-300 font-bold text-slate-800"
                                  >
                                    <option value="0%">0% (Non responsable)</option>
                                    <option value="50%">50% (Partagée)</option>
                                    <option value="100%">100% (Totalement responsable)</option>
                                  </select>
                                </div>
                              </div>

                              <button
                                type="button"
                                onClick={() => removeSinistre('AUTO', sin.id)}
                                className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </div>

                  {/* Distinction entre Suspension & Annulation Permis */}
                  <div className="p-4 bg-amber-50/70 rounded-xl border border-amber-200 space-y-4">
                    <div className="flex items-center gap-2 border-b border-amber-200/60 pb-2">
                      <AlertTriangle className="w-4 h-4 text-amber-700" />
                      <span className="text-xs font-bold text-amber-950">Historique Permis : Suspension vs Annulation</span>
                    </div>

                    {/* 1. Suspension */}
                    <div className="space-y-2">
                      <div className="flex items-center space-x-3">
                        <span className="text-xs font-bold text-amber-900">A eu une Suspension de Permis ?</span>
                        <input
                          type="checkbox"
                          checked={autoForm.aEuSuspensionPermis || false}
                          onChange={(e) => setAutoForm({ ...autoForm, aEuSuspensionPermis: e.target.checked })}
                          className="rounded text-amber-600 focus:ring-amber-500 w-4 h-4 cursor-pointer"
                        />
                      </div>

                      {autoForm.aEuSuspensionPermis && (
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 bg-white/80 p-3 rounded-lg border border-amber-200">
                          <div>
                            <label className="block text-[10px] font-bold text-amber-900 mb-1">Date de suspension</label>
                            <input
                              type="date"
                              value={autoForm.suspensionDate || ''}
                              onChange={(e) => setAutoForm({ ...autoForm, suspensionDate: e.target.value })}
                              className="w-full text-xs p-2 rounded border border-amber-300 bg-white"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-amber-900 mb-1">Motif suspension</label>
                            <select
                              value={autoForm.suspensionMotif || 'Alcooolémie'}
                              onChange={(e) => setAutoForm({ ...autoForm, suspensionMotif: e.target.value })}
                              className="w-full text-xs p-2 rounded border border-amber-300 bg-white font-medium"
                            >
                              <option value="Alcooolémie">Alcooolémie</option>
                              <option value="Stupéfiants">Stupéfiants</option>
                              <option value="Grand excès de vitesse">Grand excès de vitesse</option>
                              <option value="Perte de points">Perte de points</option>
                              <option value="Récidive">Récidive infraction</option>
                              <option value="Autre">Autre motif</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-amber-900 mb-1">Durée (en mois)</label>
                            <input
                              type="number"
                              min="1"
                              max="36"
                              value={autoForm.suspensionDureeMois || 3}
                              onChange={(e) => setAutoForm({ ...autoForm, suspensionDureeMois: parseInt(e.target.value) || 0 })}
                              className="w-full text-xs p-2 rounded border border-amber-300 bg-white font-bold"
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* 2. Annulation */}
                    <div className="space-y-2 pt-2 border-t border-amber-200/50">
                      <div className="flex items-center space-x-3">
                        <span className="text-xs font-bold text-red-900">A eu une Annulation de Permis ?</span>
                        <input
                          type="checkbox"
                          checked={autoForm.aEuAnnulationPermis || false}
                          onChange={(e) => setAutoForm({ ...autoForm, aEuAnnulationPermis: e.target.checked })}
                          className="rounded text-red-600 focus:ring-red-500 w-4 h-4 cursor-pointer"
                        />
                      </div>

                      {autoForm.aEuAnnulationPermis && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 bg-red-50/60 p-3 rounded-lg border border-red-200">
                          <div>
                            <label className="block text-[10px] font-bold text-red-900 mb-1">Date d'annulation</label>
                            <input
                              type="date"
                              value={autoForm.annulationDate || ''}
                              onChange={(e) => setAutoForm({ ...autoForm, annulationDate: e.target.value })}
                              className="w-full text-xs p-2 rounded border border-red-300 bg-white"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-red-900 mb-1">Motif annulation</label>
                            <select
                              value={autoForm.annulationMotif || 'Solde de points nul'}
                              onChange={(e) => setAutoForm({ ...autoForm, annulationMotif: e.target.value })}
                              className="w-full text-xs p-2 rounded border border-red-300 bg-white font-medium"
                            >
                              <option value="Solde de points nul">Solde de points nul (0 point)</option>
                              <option value="Incapacité médicale">Incapacité médicale</option>
                              <option value="Décision judiciaire / Correctionnelle">Décision judiciaire / Correctionnelle</option>
                              <option value="Autre">Autre motif</option>
                            </select>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: PROPOSITION */}
              {activeTab === 3 && (
                <div className="space-y-5">
                  <h4 className="text-sm font-bold text-slate-900 border-b border-slate-200 pb-2 flex items-center gap-2">
                    <FileCheck className="w-4 h-4 text-blue-600" />
                    Proposition de Tarif & Options Incluses
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Choix de la Formule *</label>
                      <select
                        value={autoForm.formuleSouhaitee}
                        onChange={(e) => setAutoForm({ ...autoForm, formuleSouhaitee: e.target.value as any })}
                        className="w-full text-xs p-2.5 rounded-lg border border-slate-300 font-bold text-blue-900 bg-blue-50/30"
                      >
                        <option value="Tiers Simple">Tiers Simple (RC + Défense Recours)</option>
                        <option value="Tiers Étendu (Vol/Incendie)">Tiers Étendu (Vol, Incendie, Brise de Glace)</option>
                        <option value="Tous Risques">Tous Risques (Dommages Tous Accidents)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Fractionnement de paiement</label>
                      <select
                        value={autoForm.fractionnement}
                        onChange={(e) => setAutoForm({ ...autoForm, fractionnement: e.target.value as any })}
                        className="w-full text-xs p-2.5 rounded-lg border border-slate-300 font-medium"
                      >
                        <option value="Mensuel">Prélèvement Mensuel</option>
                        <option value="Trimestriel">Trimestriel</option>
                        <option value="Semestriel">Semestriel</option>
                        <option value="Annuel">Paiement Annuel unique</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        {getCotisationLabel(autoForm.fractionnement)}
                      </label>
                      <input
                        type="number"
                        required
                        value={autoForm.cotisationMontant}
                        onChange={(e) => setAutoForm({ ...autoForm, cotisationMontant: parseFloat(e.target.value) || 0 })}
                        className="w-full text-sm font-bold text-emerald-800 p-2.5 rounded-lg border border-emerald-300 bg-emerald-50/50"
                        placeholder="65"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Frais de Dossier Courtage (€ TTC)</label>
                      <input
                        type="number"
                        value={autoForm.fraisDossier}
                        onChange={(e) => setAutoForm({ ...autoForm, fraisDossier: parseFloat(e.target.value) || 0 })}
                        className="w-full text-xs p-2.5 rounded-lg border border-slate-300"
                        placeholder="35"
                      />
                    </div>
                  </div>

                  {/* Options supplémentaires */}
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                    <label className="block text-xs font-bold text-slate-800">Options supplémentaires à souscrire :</label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {[
                        'Assistance 0km',
                        'Véhicule de remplacement',
                        'Protection Juridique Autonome',
                        'Garantie du conducteur renforcée 1M€',
                        'Rachat de franchise',
                        'Valeur à neuf 24 mois'
                      ].map((opt) => (
                        <label
                          key={opt}
                          onClick={() => toggleAutoOption(opt)}
                          className={`p-2.5 rounded-lg border text-xs font-medium flex items-center space-x-2 cursor-pointer transition ${
                            autoForm.optionsSupplementaires.includes(opt)
                              ? 'bg-blue-50 border-blue-400 text-blue-900 font-bold'
                              : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={autoForm.optionsSupplementaires.includes(opt)}
                            onChange={() => {}}
                            className="rounded text-blue-600"
                          />
                          <span>{opt}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 4: NOTES & PROCHAINE ACTION */}
              {activeTab === 4 && (
                <div className="space-y-5">
                  <h4 className="text-sm font-bold text-slate-900 border-b border-slate-200 pb-2 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-blue-600" />
                    Qualification du Lead & Prochaine Action de Relance
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Statut du Dossier</label>
                      <select
                        value={status}
                        onChange={(e) => setStatus(e.target.value as LeadStatus)}
                        className="w-full text-xs font-bold p-2.5 rounded-lg border border-slate-300"
                      >
                        {statusesOptions.map(st => (
                          <option key={st.id} value={st.id}>{st.label}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Niveau de Qualification</label>
                      <select
                        value={qualification}
                        onChange={(e) => setQualification(e.target.value as LeadQualification)}
                        className="w-full text-xs font-bold p-2.5 rounded-lg border border-slate-300"
                      >
                        <option value="CHAUD">🔥 CHAUD (Intérêt élevé)</option>
                        <option value="TIEDE">⚡ TIÈDE (A comparer)</option>
                        <option value="FROID">❄️ FROID (Relancer plus tard)</option>
                        <option value="INJOIGNABLE">📞 INJOIGNABLE</option>
                        <option value="HORS_CIBLE">❌ HORS CIBLE</option>
                      </select>
                    </div>

                    {renderAgentSelect()}
                  </div>

                  {/* Prochaine Action */}
                  <div className="p-4 bg-amber-50/60 rounded-xl border border-amber-200 space-y-3">
                    <label className="block text-xs font-bold text-amber-900 uppercase tracking-wider">
                      Prochaine Action Programmée
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="sm:col-span-1">
                        <label className="block text-[11px] font-medium text-slate-600 mb-1">Type d'action</label>
                        <select
                          value={prochaineActionIntitule}
                          onChange={(e) => setProchaineActionIntitule(e.target.value)}
                          className="w-full text-xs p-2 rounded-lg border border-amber-300 bg-white font-bold text-slate-800"
                        >
                          {nextActionsOptions.map((act, i) => (
                            <option key={i} value={act}>{act}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] font-medium text-slate-600 mb-1">Date</label>
                        <input
                          type="date"
                          value={prochaineActionDate}
                          onChange={(e) => setProchaineActionDate(e.target.value)}
                          className="w-full text-xs p-2 rounded-lg border border-amber-300 bg-white"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-medium text-slate-600 mb-1">Heure de relance</label>
                        <input
                          type="time"
                          value={prochaineActionHeure}
                          onChange={(e) => setProchaineActionHeure(e.target.value)}
                          className="w-full text-xs p-2 rounded-lg border border-amber-300 bg-white font-mono"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Notes libres */}
                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1">Ajouter une note / commentaire</label>
                    <textarea
                      rows={3}
                      value={newNoteText}
                      onChange={(e) => setNewNoteText(e.target.value)}
                      placeholder="Indiquez ici toute information complémentaire, échange téléphonique, demande de geste commercial..."
                      className="w-full text-xs p-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500"
                    ></textarea>
                  </div>
                </div>
              )}
            </>
          )}

          {/* ========================================================= */}
          {/* HABITATION FORM TABS */}
          {/* ========================================================= */}
          {leadType === 'HABITATION' && (
            <>
              {/* TAB 0: SOUSCRIPTEUR */}
              {activeTab === 0 && (
                <div className="space-y-4">
                  <h4 className="text-sm font-bold text-slate-900 border-b border-slate-200 pb-2 flex items-center gap-2">
                    <User className="w-4 h-4 text-emerald-600" />
                    Informations Souscripteur Habitation
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Civilité *</label>
                      <select
                        value={habitationForm.civilite || 'Mme'}
                        onChange={(e) => setHabitationForm({ ...habitationForm, civilite: e.target.value as any })}
                        className="w-full text-xs p-2.5 rounded-lg border border-slate-300 font-bold"
                      >
                        <option value="Mr">Monsieur (M.)</option>
                        <option value="Mme">Madame (Mme)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Nom *</label>
                      <input
                        type="text"
                        required
                        value={habitationForm.nom}
                        onChange={(e) => setHabitationForm({ ...habitationForm, nom: e.target.value })}
                        className="w-full text-xs p-2.5 rounded-lg border border-slate-300 font-bold"
                        placeholder="Lefebvre"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Prénom *</label>
                      <input
                        type="text"
                        required
                        value={habitationForm.prenom}
                        onChange={(e) => setHabitationForm({ ...habitationForm, prenom: e.target.value })}
                        className="w-full text-xs p-2.5 rounded-lg border border-slate-300 font-bold"
                        placeholder="Claire"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Téléphone *</label>
                      <input
                        type="tel"
                        required
                        value={habitationForm.telephone}
                        onChange={(e) => setHabitationForm({ ...habitationForm, telephone: e.target.value })}
                        className="w-full text-xs p-2.5 rounded-lg border border-slate-300"
                        placeholder="06 99 21 00 34"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Email *</label>
                      <input
                        type="email"
                        required
                        value={habitationForm.email}
                        onChange={(e) => setHabitationForm({ ...habitationForm, email: e.target.value })}
                        className="w-full text-xs p-2.5 rounded-lg border border-slate-300"
                        placeholder="claire@outlok.fr"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Date de Naissance</label>
                      <input
                        type="date"
                        value={habitationForm.dateNaissance}
                        onChange={(e) => setHabitationForm({ ...habitationForm, dateNaissance: e.target.value })}
                        className="w-full text-xs p-2.5 rounded-lg border border-slate-300"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Situation Familiale</label>
                      <select
                        value={habitationForm.situationFamiliale || 'Marié(e)'}
                        onChange={(e) => setHabitationForm({ ...habitationForm, situationFamiliale: e.target.value })}
                        className="w-full text-xs p-2.5 rounded-lg border border-slate-300 font-medium"
                      >
                        <option value="Célibataire">Célibataire</option>
                        <option value="Marié(e)">Marié(e)</option>
                        <option value="PACSÉ(e)">PACSÉ(e)</option>
                        <option value="Divorcé(e)">Divorcé(e)</option>
                        <option value="Séparé(e)">Séparé(e)</option>
                        <option value="Veuf(ve)">Veuf(ve)</option>
                        <option value="Concubinage">Concubinage</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Profession</label>
                      <select
                        value={habitationForm.profession || 'Salarié'}
                        onChange={(e) => setHabitationForm({ ...habitationForm, profession: e.target.value })}
                        className="w-full text-xs p-2.5 rounded-lg border border-slate-300 font-medium"
                      >
                        <option value="Salarié">Salarié(e)</option>
                        <option value="Fonctionnaire">Fonctionnaire</option>
                        <option value="Indépendant / TNS">Indépendant / TNS</option>
                        <option value="Commerçant / Artisan">Commerçant / Artisan</option>
                        <option value="Profession Libérale">Profession Libérale</option>
                        <option value="Chef d'entreprise">Chef d'entreprise</option>
                        <option value="Retraité">Retraité(e)</option>
                        <option value="Étudiant">Étudiant(e)</option>
                        <option value="Sans activité">Sans activité / Demandeur d'emploi</option>
                        <option value="Autre">Autre profession</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 1: LOGEMENT */}
              {activeTab === 1 && (
                <div className="space-y-4">
                  <h4 className="text-sm font-bold text-slate-900 border-b border-slate-200 pb-2 flex items-center gap-2">
                    <Home className="w-4 h-4 text-emerald-600" />
                    Caractéristiques du Logement
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Type de Logement</label>
                      <select
                        value={habitationForm.typeLogement}
                        onChange={(e) => setHabitationForm({ ...habitationForm, typeLogement: e.target.value as any })}
                        className="w-full text-xs p-2.5 rounded-lg border border-slate-300 font-bold"
                      >
                        <option value="Appartement">Appartement</option>
                        <option value="Maison">Maison Individuelle</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Statut de l'Occupant</label>
                      <select
                        value={habitationForm.statutOccupant}
                        onChange={(e) => setHabitationForm({ ...habitationForm, statutOccupant: e.target.value as any })}
                        className="w-full text-xs p-2.5 rounded-lg border border-slate-300 font-medium"
                      >
                        <option value="Locataire">Locataire</option>
                        <option value="Propriétaire occupant">Propriétaire occupant</option>
                        <option value="PNO (Propriétaire Non Occupant)">PNO (Propriétaire Non Occupant)</option>
                        <option value="Copropriétaire">Copropriétaire</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Surface Habitable (m²)</label>
                      <input
                        type="number"
                        value={habitationForm.surfaceM2}
                        onChange={(e) => setHabitationForm({ ...habitationForm, surfaceM2: parseInt(e.target.value) || 0 })}
                        className="w-full text-xs p-2.5 rounded-lg border border-slate-300"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Nombre de Pièces Principales</label>
                      <input
                        type="number"
                        value={habitationForm.nombrePieces}
                        onChange={(e) => setHabitationForm({ ...habitationForm, nombrePieces: parseInt(e.target.value) || 1 })}
                        className="w-full text-xs p-2.5 rounded-lg border border-slate-300"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Valeur du Mobilier Déclaré (€)</label>
                      <input
                        type="number"
                        value={habitationForm.valeurMobilier}
                        onChange={(e) => setHabitationForm({ ...habitationForm, valeurMobilier: parseInt(e.target.value) || 0 })}
                        className="w-full text-xs p-2.5 rounded-lg border border-slate-300 font-bold text-emerald-800"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-xs font-bold text-slate-700 mb-1">Adresse du Bien Assuré</label>
                      <input
                        type="text"
                        value={habitationForm.adresseBien}
                        onChange={(e) => setHabitationForm({ ...habitationForm, adresseBien: e.target.value })}
                        className="w-full text-xs p-2.5 rounded-lg border border-slate-300"
                        placeholder="12 Cours de l'Intendance"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Code Postal & Ville du Bien</label>
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="text"
                          value={habitationForm.codePostalBien}
                          onChange={(e) => setHabitationForm({ ...habitationForm, codePostalBien: e.target.value })}
                          className="w-full text-xs p-2.5 rounded-lg border border-slate-300"
                        />
                        <input
                          type="text"
                          value={habitationForm.villeBien}
                          onChange={(e) => setHabitationForm({ ...habitationForm, villeBien: e.target.value })}
                          className="w-full text-xs p-2.5 rounded-lg border border-slate-300"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Particularités / Dépendances */}
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                    <span className="block text-xs font-bold text-slate-800 mb-2">Particularités de la Propriété :</span>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      <label className="flex items-center space-x-2 text-xs font-medium cursor-pointer">
                        <input
                          type="checkbox"
                          checked={habitationForm.residencePrincipale}
                          onChange={(e) => setHabitationForm({ ...habitationForm, residencePrincipale: e.target.checked })}
                          className="rounded text-emerald-600"
                        />
                        <span>Résidence Principale</span>
                      </label>

                      <label className="flex items-center space-x-2 text-xs font-medium cursor-pointer">
                        <input
                          type="checkbox"
                          checked={habitationForm.dependances}
                          onChange={(e) => setHabitationForm({ ...habitationForm, dependances: e.target.checked })}
                          className="rounded text-emerald-600"
                        />
                        <span>Dépendances (Garage/Cave)</span>
                      </label>

                      <label className="flex items-center space-x-2 text-xs font-medium cursor-pointer">
                        <input
                          type="checkbox"
                          checked={habitationForm.veranda}
                          onChange={(e) => setHabitationForm({ ...habitationForm, veranda: e.target.checked })}
                          className="rounded text-emerald-600"
                        />
                        <span>Véranda / Verrière</span>
                      </label>

                      <label className="flex items-center space-x-2 text-xs font-medium cursor-pointer">
                        <input
                          type="checkbox"
                          checked={habitationForm.piscine}
                          onChange={(e) => setHabitationForm({ ...habitationForm, piscine: e.target.checked })}
                          className="rounded text-emerald-600"
                        />
                        <span>Piscine / Jacuzzi Extérieur</span>
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: ANTECEDENTS HABITATION */}
              {activeTab === 2 && (
                <div className="space-y-4">
                  <h4 className="text-sm font-bold text-slate-900 border-b border-slate-200 pb-2 flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4 text-emerald-600" />
                    Antécédents d'Assurance Habitation
                  </h4>

                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Dernière Compagnie Habitation</label>
                      <input
                        type="text"
                        value={habitationForm.nomDerniereCompagnie || ''}
                        onChange={(e) => setHabitationForm({ ...habitationForm, nomDerniereCompagnie: e.target.value })}
                        className="w-full text-xs p-2.5 rounded-lg border border-slate-300"
                        placeholder="GMF"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Nombre de mois assuré</label>
                      <input
                        type="number"
                        value={habitationForm.nombreMoisAssure || 36}
                        onChange={(e) => setHabitationForm({ ...habitationForm, nombreMoisAssure: parseInt(e.target.value) || 0 })}
                        className="w-full text-xs p-2.5 rounded-lg border border-slate-300"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: PROPOSITION HABITATION */}
              {activeTab === 3 && (
                <div className="space-y-4">
                  <h4 className="text-sm font-bold text-slate-900 border-b border-slate-200 pb-2 flex items-center gap-2">
                    <FileCheck className="w-4 h-4 text-emerald-600" />
                    Proposition Tarifaire Habitation
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Formule MRH *</label>
                      <select
                        value={habitationForm.formuleSouhaitee}
                        onChange={(e) => setHabitationForm({ ...habitationForm, formuleSouhaitee: e.target.value as any })}
                        className="w-full text-xs font-bold p-2.5 rounded-lg border border-slate-300 text-emerald-900 bg-emerald-50/30"
                      >
                        <option value="Formule Éco">Formule Éco (Essentielle)</option>
                        <option value="Formule Confort">Formule Confort (Standard)</option>
                        <option value="Formule Premium Tous Risques">Formule Premium Tous Risques</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Fractionnement de paiement</label>
                      <select
                        value={habitationForm.fractionnement}
                        onChange={(e) => setHabitationForm({ ...habitationForm, fractionnement: e.target.value as any })}
                        className="w-full text-xs p-2.5 rounded-lg border border-slate-300 font-medium"
                      >
                        <option value="Mensuel">Prélèvement Mensuel</option>
                        <option value="Trimestriel">Trimestriel</option>
                        <option value="Semestriel">Semestriel</option>
                        <option value="Annuel">Paiement Annuel unique</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        {getCotisationLabel(habitationForm.fractionnement)}
                      </label>
                      <input
                        type="number"
                        required
                        value={habitationForm.cotisationMontant}
                        onChange={(e) => setHabitationForm({ ...habitationForm, cotisationMontant: parseFloat(e.target.value) || 0 })}
                        className="w-full text-sm font-bold text-emerald-800 p-2.5 rounded-lg border border-emerald-300 bg-emerald-50/50"
                        placeholder="24"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Frais de Dossier (€ TTC)</label>
                      <input
                        type="number"
                        value={habitationForm.fraisDossier}
                        onChange={(e) => setHabitationForm({ ...habitationForm, fraisDossier: parseFloat(e.target.value) || 0 })}
                        className="w-full text-xs p-2.5 rounded-lg border border-slate-300"
                        placeholder="20"
                      />
                    </div>
                  </div>

                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                    <label className="block text-xs font-bold text-slate-800">Garanties optionnelles incluses :</label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {[
                        'Protection Juridique',
                        'Vol & Vandalisme',
                        'Jardin & Piscine',
                        'Rééquipement à neuf',
                        'Dommages électriques',
                        'Reconstitution de documents'
                      ].map((opt) => (
                        <label
                          key={opt}
                          onClick={() => toggleHabitationOption(opt)}
                          className={`p-2.5 rounded-lg border text-xs font-medium flex items-center space-x-2 cursor-pointer transition ${
                            habitationForm.optionsSupplementaires.includes(opt)
                              ? 'bg-emerald-50 border-emerald-400 text-emerald-900 font-bold'
                              : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={habitationForm.optionsSupplementaires.includes(opt)}
                            onChange={() => {}}
                            className="rounded text-emerald-600"
                          />
                          <span>{opt}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 4: ACTION & NOTES HABITATION */}
              {activeTab === 4 && (
                <div className="space-y-4">
                  <h4 className="text-sm font-bold text-slate-900 border-b border-slate-200 pb-2 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-emerald-600" />
                    Qualification & Prochaine Action
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Statut du Dossier</label>
                      <select
                        value={status}
                        onChange={(e) => setStatus(e.target.value as LeadStatus)}
                        className="w-full text-xs font-bold p-2.5 rounded-lg border border-slate-300"
                      >
                        {statusesOptions.map(st => (
                          <option key={st.id} value={st.id}>{st.label}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Niveau Qualification</label>
                      <select
                        value={qualification}
                        onChange={(e) => setQualification(e.target.value as LeadQualification)}
                        className="w-full text-xs font-bold p-2.5 rounded-lg border border-slate-300"
                      >
                        <option value="CHAUD">🔥 CHAUD</option>
                        <option value="TIEDE">⚡ TIÈDE</option>
                        <option value="FROID">❄️ FROID</option>
                        <option value="INJOIGNABLE">📞 INJOIGNABLE</option>
                      </select>
                    </div>

                    {renderAgentSelect()}

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Action de Relance</label>
                      <select
                        value={prochaineActionIntitule}
                        onChange={(e) => setProchaineActionIntitule(e.target.value)}
                        className="w-full text-xs p-2.5 rounded-lg border border-slate-300 font-bold"
                      >
                        {nextActionsOptions.map((act, i) => (
                          <option key={i} value={act}>{act}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          {/* ========================================================= */}
          {/* VTC FORM TABS */}
          {/* ========================================================= */}
          {leadType === 'VTC' && (
            <>
              {/* TAB 0: CHAUFFEUR VTC */}
              {activeTab === 0 && (
                <div className="space-y-4">
                  <h4 className="text-sm font-bold text-slate-900 border-b border-slate-200 pb-2 flex items-center gap-2">
                    <User className="w-4 h-4 text-amber-600" />
                    Informations Chauffeur Professionnel VTC
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Civilité *</label>
                      <select
                        value={vtcForm.civilite || 'Mr'}
                        onChange={(e) => setVtcForm({ ...vtcForm, civilite: e.target.value as any })}
                        className="w-full text-xs p-2.5 rounded-lg border border-slate-300 font-bold"
                      >
                        <option value="Mr">Monsieur (M.)</option>
                        <option value="Mme">Madame (Mme)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Nom Chauffeur *</label>
                      <input
                        type="text"
                        required
                        value={vtcForm.nom}
                        onChange={(e) => setVtcForm({ ...vtcForm, nom: e.target.value })}
                        className="w-full text-xs p-2.5 rounded-lg border border-slate-300 font-bold"
                        placeholder="Kassimi"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Prénom *</label>
                      <input
                        type="text"
                        required
                        value={vtcForm.prenom}
                        onChange={(e) => setVtcForm({ ...vtcForm, prenom: e.target.value })}
                        className="w-full text-xs p-2.5 rounded-lg border border-slate-300 font-bold"
                        placeholder="Youssef"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Téléphone *</label>
                      <input
                        type="tel"
                        required
                        value={vtcForm.telephone}
                        onChange={(e) => setVtcForm({ ...vtcForm, telephone: e.target.value })}
                        className="w-full text-xs p-2.5 rounded-lg border border-slate-300"
                        placeholder="07 88 45 12 90"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Numéro Carte Pro VTC *</label>
                      <input
                        type="text"
                        required
                        value={vtcForm.numeroCarteVtc}
                        onChange={(e) => setVtcForm({ ...vtcForm, numeroCarteVtc: e.target.value })}
                        className="w-full text-xs font-mono font-bold p-2.5 rounded-lg border border-amber-300 bg-amber-50/40 text-amber-950"
                        placeholder="VTC-69-2019-00481"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Date Obtention Carte VTC</label>
                      <input
                        type="date"
                        value={vtcForm.dateObtentionCarteVtc}
                        onChange={(e) => setVtcForm({ ...vtcForm, dateObtentionCarteVtc: e.target.value })}
                        className="w-full text-xs p-2.5 rounded-lg border border-slate-300"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Date Permis B</label>
                      <input
                        type="date"
                        value={vtcForm.datePermis}
                        onChange={(e) => setVtcForm({ ...vtcForm, datePermis: e.target.value })}
                        className="w-full text-xs p-2.5 rounded-lg border border-slate-300"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Situation Familiale</label>
                      <select
                        value={vtcForm.situationFamiliale || 'Marié(e)'}
                        onChange={(e) => setVtcForm({ ...vtcForm, situationFamiliale: e.target.value })}
                        className="w-full text-xs p-2.5 rounded-lg border border-slate-300 font-medium"
                      >
                        <option value="Célibataire">Célibataire</option>
                        <option value="Marié(e)">Marié(e)</option>
                        <option value="PACSÉ(e)">PACSÉ(e)</option>
                        <option value="Divorcé(e)">Divorcé(e)</option>
                        <option value="Séparé(e)">Séparé(e)</option>
                        <option value="Veuf(ve)">Veuf(ve)</option>
                        <option value="Concubinage">Concubinage</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Profession</label>
                      <select
                        value={vtcForm.profession || 'Chef d\'entreprise'}
                        onChange={(e) => setVtcForm({ ...vtcForm, profession: e.target.value })}
                        className="w-full text-xs p-2.5 rounded-lg border border-slate-300 font-medium"
                      >
                        <option value="Chef d'entreprise">Chef d'entreprise / Gérant</option>
                        <option value="Indépendant / TNS">Indépendant / TNS</option>
                        <option value="Salarié">Salarié(e)</option>
                        <option value="Commerçant / Artisan">Commerçant / Artisan</option>
                        <option value="Autre">Autre</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 1: SOCIETE */}
              {activeTab === 1 && (
                <div className="space-y-4">
                  <h4 className="text-sm font-bold text-slate-900 border-b border-slate-200 pb-2 flex items-center gap-2">
                    <Building className="w-4 h-4 text-amber-600" />
                    Société & Statut Juridique VTC
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Nom de la Société / Enseigne</label>
                      <input
                        type="text"
                        value={vtcForm.nomSociete}
                        onChange={(e) => setVtcForm({ ...vtcForm, nomSociete: e.target.value })}
                        className="w-full text-xs p-2.5 rounded-lg border border-slate-300"
                        placeholder="YK DRIVER SASU"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">N° SIRET (14 chiffres)</label>
                      <input
                        type="text"
                        value={vtcForm.siret}
                        onChange={(e) => setVtcForm({ ...vtcForm, siret: e.target.value })}
                        className="w-full text-xs font-mono p-2.5 rounded-lg border border-slate-300"
                        placeholder="891 234 567 00018"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Forme Juridique</label>
                      <select
                        value={vtcForm.formeJuridique}
                        onChange={(e) => setVtcForm({ ...vtcForm, formeJuridique: e.target.value as any })}
                        className="w-full text-xs p-2.5 rounded-lg border border-slate-300 font-bold"
                      >
                        <option value="Auto-entrepreneur">Auto-Entrepreneur / EI</option>
                        <option value="SASU">SASU</option>
                        <option value="EURL">EURL</option>
                        <option value="SARL">SARL</option>
                        <option value="SAS">SAS</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: VEHICULE VTC */}
              {activeTab === 2 && (
                <div className="space-y-4">
                  <h4 className="text-sm font-bold text-slate-900 border-b border-slate-200 pb-2 flex items-center gap-2">
                    <Car className="w-4 h-4 text-amber-600" />
                    Véhicule Exploité pour l'activité VTC
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Immatriculation VTC *</label>
                      <input
                        type="text"
                        required
                        value={vtcForm.immatriculation}
                        onChange={(e) => setVtcForm({ ...vtcForm, immatriculation: e.target.value.toUpperCase() })}
                        className="w-full text-xs font-mono font-bold uppercase p-2.5 rounded-lg border border-amber-300 bg-amber-50/50"
                        placeholder="GK-410-TP"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Marque & Modèle VTC</label>
                      <input
                        type="text"
                        value={vtcForm.marqueModele}
                        onChange={(e) => setVtcForm({ ...vtcForm, marqueModele: e.target.value })}
                        className="w-full text-xs p-2.5 rounded-lg border border-slate-300"
                        placeholder="Tesla Model 3 / Mercedes Classe E"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Motorisation</label>
                      <select
                        value={vtcForm.typeMotorisation}
                        onChange={(e) => setVtcForm({ ...vtcForm, typeMotorisation: e.target.value as any })}
                        className="w-full text-xs p-2.5 rounded-lg border border-slate-300 font-medium"
                      >
                        <option value="Électrique">100% Électrique</option>
                        <option value="Hybride">Hybride / Hybride Rechargeable</option>
                        <option value="Diesel">Diesel Euro 6</option>
                        <option value="Essence">Essence</option>
                      </select>
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-xs font-bold text-slate-700 mb-1">Propriétaire du Véhicule VTC</label>
                      <select
                        value={vtcForm.proprietaireVehicule || 'LOA (Location Option d\'Achat)'}
                        onChange={(e) => setVtcForm({ ...vtcForm, proprietaireVehicule: e.target.value as any })}
                        className="w-full text-xs p-2.5 rounded-lg border border-slate-300 font-medium"
                      >
                        <option value="Conducteur principal">Conducteur principal</option>
                        <option value="Propriétaire unique">Propriétaire unique</option>
                        <option value="LOA (Location Option d'Achat)">LOA (Location Option d'Achat)</option>
                        <option value="LLD (Location Longue Durée)">LLD (Location Longue Durée)</option>
                        <option value="Société de leasing">Société de leasing</option>
                        <option value="Autre">Autre tiers</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: ANTECEDENTS VTC */}
              {activeTab === 3 && (
                <div className="space-y-4">
                  <h4 className="text-sm font-bold text-slate-900 border-b border-slate-200 pb-2 flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4 text-amber-600" />
                    Antécédents d'Assurance VTC & Permis
                  </h4>

                  {/* 1. Déjà Assuré & Compagnie */}
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Chauffeur déjà assuré précédemment ?</label>
                        <select
                          value={vtcForm.dejaAssure ? 'Oui' : 'Non'}
                          onChange={(e) => setVtcForm({ ...vtcForm, dejaAssure: e.target.value === 'Oui' })}
                          className="w-full text-xs font-bold p-2.5 rounded-lg border border-slate-300"
                        >
                          <option value="Oui">Oui (Possède un relevé d'information)</option>
                          <option value="Non">Non (Nouveau chauffeur / Jamais assuré)</option>
                        </select>
                      </div>

                      {vtcForm.dejaAssure && (
                        <>
                          <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">Nom Dernière Compagnie VTC/Auto</label>
                            <input
                              type="text"
                              value={vtcForm.nomDerniereCompagnie || ''}
                              onChange={(e) => setVtcForm({ ...vtcForm, nomDerniereCompagnie: e.target.value })}
                              className="w-full text-xs p-2.5 rounded-lg border border-slate-300 font-bold"
                              placeholder="Allianz / AXA / Generali"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">Mois assuré sur 36 derniers mois</label>
                            <input
                              type="number"
                              value={vtcForm.nombreMoisAssure36Mois || 36}
                              onChange={(e) => setVtcForm({ ...vtcForm, nombreMoisAssure36Mois: parseInt(e.target.value) || 0 })}
                              className="w-full text-xs p-2.5 rounded-lg border border-slate-300"
                            />
                          </div>
                        </>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Coefficient Bonus/Malus CRM</label>
                        <input
                          type="number"
                          step="0.01"
                          value={vtcForm.bonusMalus}
                          onChange={(e) => setVtcForm({ ...vtcForm, bonusMalus: parseFloat(e.target.value) || 0.5 })}
                          className="w-full text-xs p-2.5 rounded-lg border border-slate-300 font-bold text-blue-700"
                          placeholder="0.50"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Statut du contrat précédent</label>
                        <select
                          value={vtcForm.contratStatut || 'Résilié'}
                          onChange={(e) => setVtcForm({ ...vtcForm, contratStatut: e.target.value as any })}
                          className="w-full text-xs p-2.5 rounded-lg border border-slate-300 font-bold"
                        >
                          <option value="Résilié">Contrat Résilié</option>
                          <option value="En cours">Contrat En cours</option>
                          <option value="Aucun">Aucun contrat en cours</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Motif de résiliation (si résilié)</label>
                        <select
                          value={vtcForm.motifResiliation || 'A l\'échéance'}
                          onChange={(e) => setVtcForm({ ...vtcForm, motifResiliation: e.target.value as any })}
                          className="w-full text-xs p-2.5 rounded-lg border border-slate-300"
                        >
                          <option value="A l'échéance">Résiliation à l'échéance</option>
                          <option value="Non-paiement">Non-paiement de prime (Litige)</option>
                          <option value="Sinistre">Fréquence / Fiche Sinistre</option>
                          <option value="Fausse déclaration">Fausse déclaration</option>
                          <option value="Vente véhicule">Vente du véhicule</option>
                          <option value="Autre">Autre motif</option>
                        </select>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 pt-2 border-t border-slate-200">
                      <input
                        type="checkbox"
                        checked={vtcForm.besoinRcProExploitation}
                        onChange={(e) => setVtcForm({ ...vtcForm, besoinRcProExploitation: e.target.checked })}
                        className="rounded text-amber-600 w-4 h-4 cursor-pointer"
                      />
                      <span className="text-xs font-bold text-amber-950">
                        Inclure d'office la Garantie RC Pro Exploitation (Responsabilité Civile Professionnelle VTC)
                      </span>
                    </div>
                  </div>

                  {/* 2. Sinistres VTC */}
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-800">Sinistres sur les 36 derniers mois :</label>
                      <button
                        type="button"
                        onClick={() => addSinistre('VTC')}
                        className="px-3 py-1 bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold rounded-lg transition flex items-center gap-1"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Ajouter un Sinistre</span>
                      </button>
                    </div>

                    {vtcForm.sinistres.length === 0 ? (
                      <p className="text-xs text-slate-400 italic">Aucun sinistre déclaré sur les 3 dernières années.</p>
                    ) : (
                      <div className="space-y-2">
                        {vtcForm.sinistres.map((sin, idx) => (
                          <div key={sin.id} className="p-3 bg-white rounded-lg border border-slate-200 grid grid-cols-1 sm:grid-cols-4 gap-2 items-center text-xs">
                            <div>
                              <label className="text-[10px] text-slate-400 font-bold block">Motif / Nature *</label>
                              <select
                                value={sin.nature}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setVtcForm(prev => ({
                                    ...prev,
                                    sinistres: prev.sinistres.map(s => s.id === sin.id ? { ...s, nature: val } : s)
                                  }));
                                }}
                                className="w-full text-xs p-1.5 rounded border border-slate-300 font-bold"
                              >
                                <option value="Accident responsable">Accident Responsable</option>
                                <option value="Accident non responsable">Accident Non Responsable</option>
                                <option value="Accident 50/50">Accident 50% Partagé</option>
                                <option value="Bris de glace">Bris de Glace / Optiques</option>
                                <option value="Vol / Tentative de vol">Vol / Tentative de vol</option>
                                <option value="Incendie / Vandalisme">Incendie / Vandalisme</option>
                                <option value="Dommage stationnement">Dommage en stationnement</option>
                                <option value="Autre sinistre">Autre sinistre</option>
                              </select>
                            </div>

                            <div>
                              <label className="text-[10px] text-slate-400 font-bold block">Date du Sinistre</label>
                              <input
                                type="date"
                                value={sin.date}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setVtcForm(prev => ({
                                    ...prev,
                                    sinistres: prev.sinistres.map(s => s.id === sin.id ? { ...s, date: val } : s)
                                  }));
                                }}
                                className="w-full text-xs p-1.5 rounded border border-slate-300"
                              />
                            </div>

                            <div>
                              <label className="text-[10px] text-slate-400 font-bold block">Taux Responsabilité</label>
                              <select
                                value={sin.tauxResponsabilite}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setVtcForm(prev => ({
                                    ...prev,
                                    sinistres: prev.sinistres.map(s => s.id === sin.id ? { ...s, tauxResponsabilite: val } : s)
                                  }));
                                }}
                                className="w-full text-xs p-1.5 rounded border border-slate-300"
                              >
                                <option value="100%">100% Responsable</option>
                                <option value="50%">50% Partagé</option>
                                <option value="0%">0% Non Responsable</option>
                              </select>
                            </div>

                            <div className="flex items-center justify-between space-x-2 pt-3 sm:pt-0">
                              <div>
                                <label className="text-[10px] text-slate-400 font-bold block">Montant Indemnisé (€)</label>
                                <input
                                  type="number"
                                  value={sin.montantIndemnise || 0}
                                  onChange={(e) => {
                                    const val = parseFloat(e.target.value) || 0;
                                    setVtcForm(prev => ({
                                      ...prev,
                                      sinistres: prev.sinistres.map(s => s.id === sin.id ? { ...s, montantIndemnise: val } : s)
                                    }));
                                  }}
                                  className="w-full text-xs p-1.5 rounded border border-slate-300"
                                />
                              </div>

                              <button
                                type="button"
                                onClick={() => removeSinistre('VTC', sin.id)}
                                className="p-1.5 text-red-600 hover:bg-red-50 rounded transition"
                                title="Supprimer"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* 3. Suspension vs Annulation Permis */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Suspension */}
                    <div className="p-3 bg-amber-50/80 rounded-xl border border-amber-200 space-y-2">
                      <label className="flex items-center space-x-2 text-xs font-bold text-amber-900 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={vtcForm.aEuSuspensionPermis}
                          onChange={(e) => setVtcForm({ ...vtcForm, aEuSuspensionPermis: e.target.checked })}
                          className="rounded text-amber-600 w-4 h-4"
                        />
                        <span>⚠️ Suspension de Permis VTC / B</span>
                      </label>

                      {vtcForm.aEuSuspensionPermis && (
                        <div className="space-y-2 pt-2 text-xs">
                          <div>
                            <label className="block text-[10px] font-bold text-slate-600 mb-1">Motif de la suspension</label>
                            <select
                              value={vtcForm.suspensionMotif || 'Excès de vitesse'}
                              onChange={(e) => setVtcForm({ ...vtcForm, suspensionMotif: e.target.value })}
                              className="w-full text-xs p-1.5 rounded border border-slate-300 font-bold"
                            >
                              <option value="Excès de vitesse">Excès de vitesse (&gt; 40 km/h)</option>
                              <option value="Alcooolémie">Alcooolémie au volant</option>
                              <option value="Stupéfiants">Usage de stupéfiants</option>
                              <option value="Refus d'obtempérer">Refus d'obtempérer</option>
                              <option value="Autre infraction">Autre infraction routière</option>
                            </select>
                          </div>

                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="block text-[10px] font-bold text-slate-600 mb-1">Date suspension</label>
                              <input
                                type="date"
                                value={vtcForm.suspensionDate || ''}
                                onChange={(e) => setVtcForm({ ...vtcForm, suspensionDate: e.target.value })}
                                className="w-full text-xs p-1.5 rounded border border-slate-300"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold text-slate-600 mb-1">Durée (Mois)</label>
                              <input
                                type="number"
                                value={vtcForm.suspensionDureeMois || 3}
                                onChange={(e) => setVtcForm({ ...vtcForm, suspensionDureeMois: parseInt(e.target.value) || 0 })}
                                className="w-full text-xs p-1.5 rounded border border-slate-300"
                              />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Annulation */}
                    <div className="p-3 bg-red-50/80 rounded-xl border border-red-200 space-y-2">
                      <label className="flex items-center space-x-2 text-xs font-bold text-red-900 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={vtcForm.aEuAnnulationPermis}
                          onChange={(e) => setVtcForm({ ...vtcForm, aEuAnnulationPermis: e.target.checked })}
                          className="rounded text-red-600 w-4 h-4"
                        />
                        <span>🛑 Annulation ou Invalidation de Permis</span>
                      </label>

                      {vtcForm.aEuAnnulationPermis && (
                        <div className="space-y-2 pt-2 text-xs">
                          <div>
                            <label className="block text-[10px] font-bold text-slate-600 mb-1">Motif annulation</label>
                            <select
                              value={vtcForm.annulationMotif || 'Solde de points nul'}
                              onChange={(e) => setVtcForm({ ...vtcForm, annulationMotif: e.target.value })}
                              className="w-full text-xs p-1.5 rounded border border-slate-300 font-bold text-red-900"
                            >
                              <option value="Solde de points nul">Solde de points nul (Invalidation 48SI)</option>
                              <option value="Décision judiciaire">Annulation par décision judiciaire</option>
                              <option value="Incapacité médicale">Incapacité médicale</option>
                              <option value="Autre">Autre motif légal</option>
                            </select>
                          </div>

                          <div>
                            <label className="block text-[10px] font-bold text-slate-600 mb-1">Date d'effet annulation</label>
                            <input
                              type="date"
                              value={vtcForm.annulationDate || ''}
                              onChange={(e) => setVtcForm({ ...vtcForm, annulationDate: e.target.value })}
                              className="w-full text-xs p-1.5 rounded border border-slate-300"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 4: PROPOSITION VTC */}
              {activeTab === 4 && (
                <div className="space-y-4">
                  <h4 className="text-sm font-bold text-slate-900 border-b border-slate-200 pb-2 flex items-center gap-2">
                    <FileCheck className="w-4 h-4 text-amber-600" />
                    Offre VTC Globale & Tarification
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Pack Assurance VTC *</label>
                      <select
                        value={vtcForm.formuleSouhaitee}
                        onChange={(e) => setVtcForm({ ...vtcForm, formuleSouhaitee: e.target.value as any })}
                        className="w-full text-xs font-bold p-2.5 rounded-lg border border-slate-300 text-amber-950 bg-amber-50/40"
                      >
                        <option value="Tiers VTC + RC Pro">Tiers VTC + RC Pro Exploitation</option>
                        <option value="Tous Risques VTC + RC Pro">Tous Risques VTC + RC Pro Exploitation</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Fractionnement de paiement</label>
                      <select
                        value={vtcForm.fractionnement}
                        onChange={(e) => setVtcForm({ ...vtcForm, fractionnement: e.target.value as any })}
                        className="w-full text-xs p-2.5 rounded-lg border border-slate-300 font-medium"
                      >
                        <option value="Mensuel">Prélèvement Mensuel</option>
                        <option value="Trimestriel">Trimestriel</option>
                        <option value="Semestriel">Semestriel</option>
                        <option value="Annuel">Paiement Annuel unique</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        {getCotisationLabel(vtcForm.fractionnement)}
                      </label>
                      <input
                        type="number"
                        required
                        value={vtcForm.cotisationMontant}
                        onChange={(e) => setVtcForm({ ...vtcForm, cotisationMontant: parseFloat(e.target.value) || 0 })}
                        className="w-full text-sm font-bold text-amber-900 p-2.5 rounded-lg border border-amber-300 bg-amber-50/50"
                        placeholder="165"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Frais de Dossier Courtier (€ TTC)</label>
                      <input
                        type="number"
                        value={vtcForm.fraisDossier}
                        onChange={(e) => setVtcForm({ ...vtcForm, fraisDossier: parseFloat(e.target.value) || 0 })}
                        className="w-full text-xs p-2.5 rounded-lg border border-slate-300"
                        placeholder="50"
                      />
                    </div>
                  </div>

                  {/* VTC Options Selection */}
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                    <label className="block text-xs font-bold text-slate-800">Garanties & Options VTC Supplémentaires :</label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {[
                        'Véhicule de remplacement VTC',
                        'Perte d\'exploitation',
                        'Protection Juridique Professionnelle VTC',
                        'Assistance Panne 0 km Pan-Europe',
                        'Protection Chauffeur & Passagers',
                        'Garantie Effets Personnels client',
                        'RC Pro Exploitation Étendue'
                      ].map((opt) => (
                        <label
                          key={opt}
                          onClick={() => toggleVtcOption(opt)}
                          className={`p-2.5 rounded-lg border text-xs font-medium flex items-center space-x-2 cursor-pointer transition ${
                            vtcForm.optionsSupplementaires.includes(opt)
                              ? 'bg-amber-50 border-amber-400 text-amber-950 font-bold'
                              : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={vtcForm.optionsSupplementaires.includes(opt)}
                            onChange={() => {}}
                            className="rounded text-amber-600"
                          />
                          <span>{opt}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 5: ACTION VTC */}
              {activeTab === 5 && (
                <div className="space-y-4">
                  <h4 className="text-sm font-bold text-slate-900 border-b border-slate-200 pb-2 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-amber-600" />
                    Qualification & Programmation Rappel VTC
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Statut du Dossier VTC</label>
                      <select
                        value={status}
                        onChange={(e) => setStatus(e.target.value as LeadStatus)}
                        className="w-full text-xs font-bold p-2.5 rounded-lg border border-slate-300"
                      >
                        {statusesOptions.map(st => (
                          <option key={st.id} value={st.id}>{st.label}</option>
                        ))}
                      </select>
                    </div>

                    {renderAgentSelect()}

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Action de Relance Programmé</label>
                      <select
                        value={prochaineActionIntitule}
                        onChange={(e) => setProchaineActionIntitule(e.target.value)}
                        className="w-full text-xs p-2.5 rounded-lg border border-slate-300 font-bold"
                      >
                        {nextActionsOptions.map((act, i) => (
                          <option key={i} value={act}>{act}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Date du Rappel</label>
                      <input
                        type="date"
                        value={prochaineActionDate}
                        onChange={(e) => setProchaineActionDate(e.target.value)}
                        className="w-full text-xs p-2.5 rounded-lg border border-slate-300 font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Heure du Rappel</label>
                      <input
                        type="time"
                        value={prochaineActionHeure}
                        onChange={(e) => setProchaineActionHeure(e.target.value)}
                        className="w-full text-xs p-2.5 rounded-lg border border-slate-300 font-mono"
                      />
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Modal Footer Controls */}
          <div className="pt-6 border-t border-slate-200 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={() => setActiveTab(prev => Math.max(0, prev - 1))}
                disabled={activeTab === 0}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 text-slate-700 text-xs font-bold rounded-xl transition cursor-pointer"
              >
                Précédent
              </button>

              <button
                type="button"
                onClick={() => setActiveTab(prev => Math.min(currentTabLabels.length - 1, prev + 1))}
                disabled={activeTab === currentTabLabels.length - 1}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 text-slate-700 text-xs font-bold rounded-xl transition cursor-pointer"
              >
                Suivant
              </button>
            </div>

            <div className="flex items-center space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-semibold rounded-xl transition cursor-pointer"
              >
                Annuler
              </button>

              <button
                type="submit"
                className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-blue-600/30 transition transform active:scale-95 flex items-center gap-2 cursor-pointer"
              >
                <CheckCircle className="w-4 h-4" />
                <span>{isEditing ? 'Enregistrer les Modifications' : 'Créer et Enregistrer le Lead'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
