import React, { useState } from 'react';
import { 
  Building2, 
  Mail, 
  Sliders, 
  Check, 
  Save, 
  Send, 
  Key, 
  Server, 
  Plus, 
  Trash2, 
  Sparkles, 
  CheckCircle2, 
  ShieldCheck, 
  FileText,
  ListFilter,
  Upload,
  Image as ImageIcon,
  Users as UsersIcon,
  X,
  Plug
} from 'lucide-react';
import { CabinetInfo, SmtpConfig, EmailTemplate, StatusConfigItem, User, InsurancePartnerApiConfig } from '../types/crm';
import { UserManagementView } from './UserManagementView';
import { PartnerApiSettings } from './PartnerApiSettings';

interface SettingsPageProps {
  cabinetInfo: CabinetInfo;
  onSaveCabinetInfo: (info: CabinetInfo) => void;
  smtpConfig: SmtpConfig;
  onSaveSmtpConfig: (config: SmtpConfig) => void;
  emailTemplates: EmailTemplate[];
  onSaveEmailTemplates: (templates: EmailTemplate[]) => void;
  // Partner API Props
  partners: InsurancePartnerApiConfig[];
  onSavePartners: (partners: InsurancePartnerApiConfig[]) => void;
  // User Management Props
  users: User[];
  currentUser: User;
  onSaveUser: (user: User) => void;
  onDeleteUser: (userId: string) => void;
  onSwitchUser?: (user: User) => void;
  teams?: string[];
  onSaveTeams?: (teams: string[]) => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({
  cabinetInfo,
  onSaveCabinetInfo,
  smtpConfig,
  onSaveSmtpConfig,
  emailTemplates,
  onSaveEmailTemplates,
  partners,
  onSavePartners,
  users,
  currentUser,
  onSaveUser,
  onDeleteUser,
  onSwitchUser,
  teams = [],
  onSaveTeams
}) => {
  const [activeTab, setActiveTab] = useState<'cabinet' | 'smtp' | 'templates' | 'workflow' | 'users' | 'partners'>('cabinet');

  // Cabinet Form State
  const [cabinetForm, setCabinetForm] = useState<CabinetInfo>(cabinetInfo);
  const [cabinetSavedMsg, setCabinetSavedMsg] = useState(false);

  // Workflow Config State
  const [statusesList, setStatusesList] = useState<StatusConfigItem[]>(
    cabinetInfo.customStatuses || [
      { id: 'NOUVEAU', label: 'Nouveau Lead' },
      { id: 'A_CONTACTER', label: 'À Contacter' },
      { id: 'DEVIS_ENVOYE', label: 'Devis Envoyé' },
      { id: 'RELANCE', label: 'Relance à faire' },
      { id: 'GAGNE', label: 'Souscrit / Gagné' },
      { id: 'PERDU', label: 'Perdu / Rejeté' }
    ]
  );

  const [nextActionsList, setNextActionsList] = useState<string[]>(
    cabinetInfo.customNextActions || [
      'Appel téléphonique',
      'Attente retour client',
      'Aucune action',
      'Relance devis',
      'Relance documents'
    ]
  );

  const [newStatusLabel, setNewStatusLabel] = useState('');
  const [newActionLabel, setNewActionLabel] = useState('');
  const [workflowSavedMsg, setWorkflowSavedMsg] = useState(false);

  // SMTP Form State
  const [smtpForm, setSmtpForm] = useState<SmtpConfig>(smtpConfig);
  const [smtpSavedMsg, setSmtpSavedMsg] = useState(false);
  const [testingSmtp, setTestingSmtp] = useState(false);
  const [smtpTestResult, setSmtpTestResult] = useState<string | null>(null);

  // Email Templates State
  const [templatesList, setTemplatesList] = useState<EmailTemplate[]>(emailTemplates);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(emailTemplates[0]?.id || '');
  const [templatesSavedMsg, setTemplatesSavedMsg] = useState(false);

  const selectedTemplate = templatesList.find(t => t.id === selectedTemplateId) || templatesList[0];

  const handleSaveCabinet = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveCabinetInfo({
      ...cabinetForm,
      customStatuses: statusesList,
      customNextActions: nextActionsList
    });
    setCabinetSavedMsg(true);
    setTimeout(() => setCabinetSavedMsg(false), 2500);
  };

  const handleSaveWorkflow = () => {
    const updatedCabinet = {
      ...cabinetForm,
      customStatuses: statusesList,
      customNextActions: nextActionsList
    };
    setCabinetForm(updatedCabinet);
    onSaveCabinetInfo(updatedCabinet);
    setWorkflowSavedMsg(true);
    setTimeout(() => setWorkflowSavedMsg(false), 2500);
  };

  const handleAddStatus = () => {
    if (!newStatusLabel.trim()) return;
    const newId = 'STATUT_' + Date.now();
    setStatusesList(prev => [...prev, { id: newId, label: newStatusLabel.trim() }]);
    setNewStatusLabel('');
  };

  const handleRemoveStatus = (id: string) => {
    setStatusesList(prev => prev.filter(s => s.id !== id));
  };

  const handleUpdateStatusLabel = (id: string, newLabel: string) => {
    setStatusesList(prev => prev.map(s => s.id === id ? { ...s, label: newLabel } : s));
  };

  const handleAddNextAction = () => {
    if (!newActionLabel.trim()) return;
    if (nextActionsList.includes(newActionLabel.trim())) return;
    setNextActionsList(prev => [...prev, newActionLabel.trim()]);
    setNewActionLabel('');
  };

  const handleRemoveNextAction = (action: string) => {
    setNextActionsList(prev => prev.filter(a => a !== action));
  };

  const handleSaveSmtp = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveSmtpConfig(smtpForm);
    setSmtpSavedMsg(true);
    setTimeout(() => setSmtpSavedMsg(false), 2500);
  };

  const handleTestSmtpConnection = async () => {
    setTestingSmtp(true);
    setSmtpTestResult(null);

    try {
      const res = await fetch('/api/test-smtp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ smtpConfig: smtpForm }),
      });
      const data = await res.json();
      setTestingSmtp(false);

      if (data.success) {
        setSmtpTestResult('Connexion SMTP réussie ! Serveur actif et prêt pour l\'envoi réel des devis.');
      } else {
        setSmtpTestResult(`❌ Erreur SMTP : ${data.error || 'Impossible de se connecter au serveur SMTP'}`);
      }
    } catch (err: any) {
      setTestingSmtp(false);
      setSmtpTestResult(`❌ Erreur réseau ou serveur : ${err.message || 'Impossible de joindre le serveur CRM'}`);
    }
  };

  const handleAddNewTemplate = () => {
    const newTmpl: EmailTemplate = {
      id: 'tmpl-' + Date.now(),
      name: 'Nouveau Modèle d\'email',
      subject: 'Votre devis d\'assurance N° {referenceDevis}',
      type: 'GENERAL',
      body: `Bonjour {civilite} {nom},\n\nSuite à notre échange, veuillez trouver ci-joint votre proposition d'assurance pour la formule {formule}.\n\nCotisation : {cotisation} €/an.\n\nCordialement,\n{nomCourtier}\n{nomCabinet}`,
      updatedAt: new Date().toISOString().split('T')[0]
    };
    const updated = [...templatesList, newTmpl];
    setTemplatesList(updated);
    setSelectedTemplateId(newTmpl.id);
    onSaveEmailTemplates(updated);
  };

  const handleDeleteTemplate = (id: string) => {
    if (templatesList.length <= 1) return;
    const updated = templatesList.filter(t => t.id !== id);
    setTemplatesList(updated);
    setSelectedTemplateId(updated[0]?.id || '');
    onSaveEmailTemplates(updated);
  };

  const handleUpdateCurrentTemplate = (key: keyof EmailTemplate, value: any) => {
    if (!selectedTemplate) return;
    setTemplatesList(prev => prev.map(t => t.id === selectedTemplate.id ? { ...t, [key]: value, updatedAt: new Date().toISOString().split('T')[0] } : t));
  };

  const handleSaveTemplates = () => {
    onSaveEmailTemplates(templatesList);
    setTemplatesSavedMsg(true);
    setTimeout(() => setTemplatesSavedMsg(false), 2500);
  };

  const insertVariableIntoTemplate = (variable: string) => {
    if (!selectedTemplate) return;
    handleUpdateCurrentTemplate('body', selectedTemplate.body + ' ' + variable);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Paramètres du Cabinet & Outils CRM</h2>
          <p className="text-xs text-slate-500">Configurez votre identité de courtier, vos statuts & actions, serveurs mails SMTP et modèles de devis.</p>
        </div>

        {/* Tab switcher */}
        <div className="bg-slate-100 p-1 rounded-xl border border-slate-200 flex flex-wrap gap-1">
          <button
            onClick={() => setActiveTab('cabinet')}
            className={`px-3 py-2 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
              activeTab === 'cabinet' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>Infos Cabinet</span>
          </button>

          <button
            onClick={() => setActiveTab('workflow')}
            className={`px-3 py-2 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
              activeTab === 'workflow' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ListFilter className="w-4 h-4" />
            <span>Statuts & Actions</span>
          </button>

          <button
            onClick={() => setActiveTab('smtp')}
            className={`px-3 py-2 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
              activeTab === 'smtp' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Server className="w-4 h-4" />
            <span>Config SMTP</span>
          </button>

          <button
            onClick={() => setActiveTab('templates')}
            className={`px-3 py-2 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
              activeTab === 'templates' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Mail className="w-4 h-4" />
            <span>Modèles d'Emails</span>
          </button>

          <button
            onClick={() => setActiveTab('partners')}
            className={`px-3 py-2 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
              activeTab === 'partners' ? 'bg-indigo-600 text-white shadow-md font-bold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Plug className="w-4 h-4" />
            <span>APIs & Tarificateurs Partenaires</span>
          </button>

          {currentUser.permissions.canManageUsers && (
            <button
              onClick={() => setActiveTab('users')}
              className={`px-3 py-2 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                activeTab === 'users' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <UsersIcon className="w-4 h-4" />
              <span>Gestion Utilisateurs & Droits</span>
            </button>
          )}
        </div>
      </div>

      {/* TAB 1: INFOS CABINET */}
      {activeTab === 'cabinet' && (
        <form onSubmit={handleSaveCabinet} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b pb-3">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-blue-600" />
              Informations Officielles du Cabinet de Courtage
            </h3>

            {cabinetSavedMsg && (
              <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-3 py-1 rounded-full flex items-center gap-1">
                <Check className="w-3.5 h-3.5" />
                Informations enregistrées !
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Nom du Cabinet *</label>
              <input
                type="text"
                required
                value={cabinetForm.nomCabinet}
                onChange={(e) => setCabinetForm({ ...cabinetForm, nomCabinet: e.target.value })}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-300 font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">N° Immatriculation ORIAS *</label>
              <input
                type="text"
                required
                value={cabinetForm.numeroOrias}
                onChange={(e) => setCabinetForm({ ...cabinetForm, numeroOrias: e.target.value })}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-300 font-mono font-bold text-blue-900"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">N° SIRET</label>
              <input
                type="text"
                value={cabinetForm.siret}
                onChange={(e) => setCabinetForm({ ...cabinetForm, siret: e.target.value })}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-300 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Nom Courtier Principal *</label>
              <input
                type="text"
                required
                value={cabinetForm.nomCourtierPrincipal}
                onChange={(e) => setCabinetForm({ ...cabinetForm, nomCourtierPrincipal: e.target.value })}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-300"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Téléphone Contact</label>
              <input
                type="text"
                value={cabinetForm.telephone}
                onChange={(e) => setCabinetForm({ ...cabinetForm, telephone: e.target.value })}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-300 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Email Officiel</label>
              <input
                type="email"
                value={cabinetForm.emailContact}
                onChange={(e) => setCabinetForm({ ...cabinetForm, emailContact: e.target.value })}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-300"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">Adresse Voie & Complément</label>
              <input
                type="text"
                value={cabinetForm.adresse}
                onChange={(e) => setCabinetForm({ ...cabinetForm, adresse: e.target.value })}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-300"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Code Postal & Ville</label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  value={cabinetForm.codePostal}
                  onChange={(e) => setCabinetForm({ ...cabinetForm, codePostal: e.target.value })}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300"
                />
                <input
                  type="text"
                  value={cabinetForm.ville}
                  onChange={(e) => setCabinetForm({ ...cabinetForm, ville: e.target.value })}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300"
                />
              </div>
            </div>

            <div className="sm:col-span-3">
              <label className="block text-xs font-bold text-slate-700 mb-1">Mentions Légales & Pied de Devis</label>
              <textarea
                rows={3}
                value={cabinetForm.mentionsLegales}
                onChange={(e) => setCabinetForm({ ...cabinetForm, mentionsLegales: e.target.value })}
                className="w-full text-xs p-3 rounded-xl border border-slate-300 font-sans"
              ></textarea>
            </div>

            {/* Logo Section */}
            <div className="sm:col-span-3 p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5 uppercase tracking-wider">
                    <ImageIcon className="w-4 h-4 text-blue-600" />
                    Logo Officiel du Cabinet
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Ce logo sera affiché en haut de votre CRM, sur les devis imprimables et dans les emails envoyés aux clients.
                  </p>
                </div>

                {cabinetForm.logoUrl && (
                  <button
                    type="button"
                    onClick={() => setCabinetForm({ ...cabinetForm, logoUrl: '' })}
                    className="px-2.5 py-1 bg-red-100 hover:bg-red-200 text-red-700 text-xs font-bold rounded-lg transition flex items-center gap-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Supprimer le logo</span>
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                {/* Upload File Box */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Téléverser une image (PNG / JPG / WebP)</label>
                  <label className="flex items-center justify-center border-2 border-dashed border-slate-300 hover:border-blue-500 bg-white p-4 rounded-xl cursor-pointer transition text-center space-x-2">
                    <Upload className="w-4 h-4 text-blue-600" />
                    <span className="text-xs font-semibold text-slate-700">Parcourir / Choisir un fichier</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          if (file.size > 3 * 1024 * 1024) {
                            alert('Veuillez sélectionner un fichier image inférieur à 3 Mo.');
                            return;
                          }
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            setCabinetForm({ ...cabinetForm, logoUrl: reader.result as string });
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                  </label>
                </div>

                {/* Direct URL Input */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Ou indiquer l'URL directe d'une image</label>
                  <input
                    type="url"
                    value={cabinetForm.logoUrl || ''}
                    onChange={(e) => setCabinetForm({ ...cabinetForm, logoUrl: e.target.value })}
                    placeholder="https://exemple.com/logo-cabinet.png"
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300 font-mono"
                  />
                </div>
              </div>

              {/* Logo Preview */}
              {cabinetForm.logoUrl && (
                <div className="pt-2 flex items-center gap-3">
                  <span className="text-xs font-bold text-slate-600">Aperçu du logo :</span>
                  <div className="p-2 bg-white rounded-xl border border-slate-200 shadow-2xs inline-block">
                    <img
                      src={cabinetForm.logoUrl}
                      alt="Logo Cabinet"
                      className="h-12 max-w-[200px] object-contain"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="pt-4 border-t flex justify-end">
            <button
              type="submit"
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-lg flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              <span>Enregistrer les Informations du Cabinet</span>
            </button>
          </div>
        </form>
      )}

      {/* TAB 2: STATUTS ET PROCHAINES ACTIONS */}
      {activeTab === 'workflow' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-8">
          <div className="flex items-center justify-between border-b pb-3">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <ListFilter className="w-5 h-5 text-blue-600" />
                Personnalisation des Statuts du Dossier & Choix des Prochaine Actions
              </h3>
              <p className="text-xs text-slate-500">Ajoutez ou modifiez les étapes de qualification et les types de relances programmées.</p>
            </div>

            {workflowSavedMsg && (
              <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-3 py-1 rounded-full flex items-center gap-1">
                <Check className="w-3.5 h-3.5" />
                Statuts et Actions sauvegardés !
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left: Custom Dossier Statuses */}
            <div className="space-y-4 bg-slate-50 p-5 rounded-2xl border border-slate-200">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  1. Statuts du Dossier (Pipeline CRM)
                </h4>
                <span className="text-[10px] font-bold text-slate-500">{statusesList.length} statuts</span>
              </div>

              <div className="space-y-2">
                {statusesList.map((st) => (
                  <div key={st.id} className="flex items-center gap-2 bg-white p-2.5 rounded-xl border border-slate-200 shadow-2xs">
                    <input
                      type="text"
                      value={st.label}
                      onChange={(e) => handleUpdateStatusLabel(st.id, e.target.value)}
                      className="flex-1 text-xs font-bold text-slate-800 bg-transparent focus:outline-none focus:ring-1 focus:ring-blue-500 rounded px-1"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveStatus(st.id)}
                      className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition"
                      title="Supprimer ce statut"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Add New Status */}
              <div className="pt-3 border-t border-slate-200 flex gap-2">
                <input
                  type="text"
                  value={newStatusLabel}
                  onChange={(e) => setNewStatusLabel(e.target.value)}
                  placeholder="Nouveau statut (ex: Attente Paiement)..."
                  className="flex-1 text-xs p-2.5 rounded-xl border border-slate-300 bg-white"
                />
                <button
                  type="button"
                  onClick={handleAddStatus}
                  className="px-3 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl flex items-center gap-1 shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Ajouter</span>
                </button>
              </div>
            </div>

            {/* Right: Custom Next Action Choices */}
            <div className="space-y-4 bg-slate-50 p-5 rounded-2xl border border-slate-200">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  2. Choix Prochaine Action Programmée
                </h4>
                <span className="text-[10px] font-bold text-slate-500">{nextActionsList.length} options</span>
              </div>

              <div className="space-y-2">
                {nextActionsList.map((action, idx) => (
                  <div key={idx} className="flex items-center justify-between bg-white p-2.5 rounded-xl border border-slate-200 shadow-2xs">
                    <span className="text-xs font-medium text-slate-800">📌 {action}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveNextAction(action)}
                      className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition"
                      title="Supprimer cette action"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Add New Action */}
              <div className="pt-3 border-t border-slate-200 flex gap-2">
                <input
                  type="text"
                  value={newActionLabel}
                  onChange={(e) => setNewActionLabel(e.target.value)}
                  placeholder="Nouvelle action (ex: Envoi RIB, Visite de risque)..."
                  className="flex-1 text-xs p-2.5 rounded-xl border border-slate-300 bg-white"
                />
                <button
                  type="button"
                  onClick={handleAddNextAction}
                  className="px-3 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl flex items-center gap-1 shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Ajouter</span>
                </button>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t flex justify-end">
            <button
              type="button"
              onClick={handleSaveWorkflow}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-lg flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              <span>Sauvegarder les Statuts & Actions</span>
            </button>
          </div>
        </div>
      )}

      {/* TAB 3: CONFIG SMTP */}
      {activeTab === 'smtp' && (
        <form onSubmit={handleSaveSmtp} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b pb-3">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Server className="w-5 h-5 text-blue-600" />
              Paramétrage Serveur Mails & SMTP
            </h3>

            {smtpSavedMsg && (
              <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-3 py-1 rounded-full flex items-center gap-1">
                <Check className="w-3.5 h-3.5" />
                Configuration SMTP sauvegardée !
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Serveur SMTP (Host) *</label>
              <input
                type="text"
                required
                value={smtpForm.host}
                onChange={(e) => setSmtpForm({ ...smtpForm, host: e.target.value })}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-300 font-mono"
                placeholder="mail.horizon-courtage.fr"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Port SMTP *</label>
              <input
                type="number"
                required
                value={smtpForm.port}
                onChange={(e) => setSmtpForm({ ...smtpForm, port: parseInt(e.target.value) || 587 })}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-300 font-mono"
                placeholder="587"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Chiffrement Sécurité</label>
              <select
                value={smtpForm.encryption}
                onChange={(e) => setSmtpForm({ ...smtpForm, encryption: e.target.value as any })}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-300 font-bold"
              >
                <option value="TLS">STARTTLS / TLS (Port 587)</option>
                <option value="SSL">SSL / TLS Direct (Port 465)</option>
                <option value="NONE">Aucun chiffrement (Port 25)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Identifiant / Email Utilisateur *</label>
              <input
                type="text"
                required
                value={smtpForm.username}
                onChange={(e) => setSmtpForm({ ...smtpForm, username: e.target.value })}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-300"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Mot de Passe SMTP</label>
              <input
                type="password"
                value={smtpForm.password || ''}
                onChange={(e) => setSmtpForm({ ...smtpForm, password: e.target.value })}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-300 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Nom d'expéditeur affiché</label>
              <input
                type="text"
                value={smtpForm.senderName}
                onChange={(e) => setSmtpForm({ ...smtpForm, senderName: e.target.value })}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-300"
                placeholder="Horizon Courtage"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Adresse Email Expéditeur (From)</label>
              <input
                type="email"
                value={smtpForm.senderEmail || smtpForm.username}
                onChange={(e) => setSmtpForm({ ...smtpForm, senderEmail: e.target.value })}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-300 font-mono"
                placeholder="contact.iard@partenaireassurances.com"
              />
              <span className="text-[10px] text-slate-400 block mt-1">
                Doit généralement correspondre à l'identifiant du compte SMTP.
              </span>
            </div>
          </div>

          {smtpTestResult && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-xl text-xs font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{smtpTestResult}</span>
            </div>
          )}

          <div className="pt-4 border-t flex flex-wrap items-center justify-between gap-3">
            <button
              type="button"
              onClick={handleTestSmtpConnection}
              disabled={testingSmtp}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-100 text-xs font-bold rounded-xl border border-slate-700 flex items-center gap-2"
            >
              <Send className="w-3.5 h-3.5 text-amber-400" />
              <span>{testingSmtp ? 'Test en cours...' : 'Tester la Connexion SMTP'}</span>
            </button>

            <button
              type="submit"
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-lg flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              <span>Sauvegarder les Accès SMTP</span>
            </button>
          </div>
        </form>
      )}

      {/* TAB 4: EMAIL TEMPLATES */}
      {activeTab === 'templates' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b pb-3">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-600" />
              Édition des Modèles d'Emails de Devis & Relances
            </h3>

            {templatesSavedMsg && (
              <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-3 py-1 rounded-full flex items-center gap-1">
                <Check className="w-3.5 h-3.5" />
                Modèles mis à jour !
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Left selector */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                  Modèles ({templatesList.length}) :
                </span>
                <button
                  type="button"
                  onClick={handleAddNewTemplate}
                  className="px-2 py-1 bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-bold rounded-lg shadow-xs flex items-center gap-1 transition cursor-pointer"
                >
                  <Plus className="w-3 h-3" />
                  <span>Nouveau</span>
                </button>
              </div>

              <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
                {templatesList.map((tmpl) => (
                  <button
                    key={tmpl.id}
                    onClick={() => setSelectedTemplateId(tmpl.id)}
                    className={`w-full text-left p-3 rounded-xl border text-xs transition ${
                      selectedTemplateId === tmpl.id
                        ? 'bg-blue-50 border-blue-400 font-bold text-blue-900 shadow-xs'
                        : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="px-1.5 py-0.2 rounded text-[9px] bg-slate-200 font-bold uppercase">
                        {tmpl.type}
                      </span>
                    </div>
                    <div className="truncate font-semibold">{tmpl.name}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Right Editor */}
            {selectedTemplate && (
              <div className="lg:col-span-3 space-y-4 bg-slate-50/50 p-4 rounded-2xl border border-slate-200">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 mb-1">Nom du Modèle</label>
                    <input
                      type="text"
                      value={selectedTemplate.name}
                      onChange={(e) => handleUpdateCurrentTemplate('name', e.target.value)}
                      className="w-full text-xs font-bold p-2.5 rounded-xl border border-slate-300 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Catégorie / Produit</label>
                    <select
                      value={selectedTemplate.type}
                      onChange={(e) => handleUpdateCurrentTemplate('type', e.target.value)}
                      className="w-full text-xs font-bold p-2.5 rounded-xl border border-slate-300 bg-white"
                    >
                      <option value="GENERAL">GÉNÉRAL</option>
                      <option value="AUTO">AUTO</option>
                      <option value="HABITATION">HABITATION</option>
                      <option value="VTC">VTC</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Sujet du Message</label>
                  <input
                    type="text"
                    value={selectedTemplate.subject}
                    onChange={(e) => handleUpdateCurrentTemplate('subject', e.target.value)}
                    className="w-full text-xs font-bold p-2.5 rounded-xl border border-slate-300 bg-white"
                  />
                </div>

                {/* Chips helper for variables */}
                <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-2">
                  <span className="text-[11px] font-bold text-slate-600 block">
                    Cliquer pour insérer une variable dynamique :
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      '{civilite}',
                      '{prenom}',
                      '{nom}',
                      '{referenceDevis}',
                      '{formule}',
                      '{cotisation}',
                      '{cotisationMois}',
                      '{fractionnement}',
                      '{immatriculation}',
                      '{marqueModele}',
                      '{options}',
                      '{telephoneCabinet}',
                      '{nomCabinet}'
                    ].map((v) => (
                      <button
                        key={v}
                        type="button"
                        onClick={() => insertVariableIntoTemplate(v)}
                        className="px-2 py-1 bg-slate-50 hover:bg-blue-50 border border-slate-300 hover:border-blue-500 text-slate-800 text-[10px] font-mono font-bold rounded-lg transition cursor-pointer"
                      >
                        + {v}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Corps de l'Email</label>
                  <textarea
                    rows={11}
                    value={selectedTemplate.body}
                    onChange={(e) => handleUpdateCurrentTemplate('body', e.target.value)}
                    className="w-full text-xs font-mono p-4 rounded-xl border border-slate-300 bg-white leading-relaxed focus:ring-2 focus:ring-blue-500"
                  ></textarea>
                </div>

                <div className="pt-2 flex items-center justify-between border-t border-slate-200">
                  {templatesList.length > 1 ? (
                    <button
                      type="button"
                      onClick={() => handleDeleteTemplate(selectedTemplate.id)}
                      className="px-3.5 py-2 text-rose-600 hover:bg-rose-50 border border-rose-200 rounded-xl font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Supprimer le modèle</span>
                    </button>
                  ) : <div />}

                  <button
                    type="button"
                    onClick={handleSaveTemplates}
                    className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-lg flex items-center gap-2 cursor-pointer transition"
                  >
                    <Save className="w-4 h-4" />
                    <span>Sauvegarder les modifications</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 5: GESTION UTILISATEURS ET DROITS */}
      {activeTab === 'users' && (
        <UserManagementView
          users={users}
          currentUser={currentUser}
          onSaveUser={onSaveUser}
          onDeleteUser={onDeleteUser}
          onSwitchUser={onSwitchUser}
          teams={teams}
          onSaveTeams={onSaveTeams}
        />
      )}

      {/* TAB 6: TARIFICATEURS ET APIS PARTENAIRES */}
      {activeTab === 'partners' && (
        <PartnerApiSettings
          partners={partners}
          onSavePartners={onSavePartners}
        />
      )}
    </div>
  );
};
