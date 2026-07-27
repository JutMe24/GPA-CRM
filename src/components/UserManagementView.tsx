import React, { useState } from 'react';
import {
  Users,
  UserPlus,
  Shield,
  ShieldCheck,
  ShieldAlert,
  Search,
  CheckCircle2,
  XCircle,
  Edit2,
  Trash2,
  Key,
  Check,
  X,
  Lock,
  UserCheck,
  Building2,
  Briefcase,
  Mail,
  Phone,
  Eye,
  Download,
  Settings,
  User as UserIcon,
  Sparkles,
  Plus,
  FolderPlus,
  Layers
} from 'lucide-react';
import { User, UserRole, UserPermissions, getDefaultPermissionsForRole } from '../types/crm';

interface UserManagementViewProps {
  users: User[];
  currentUser: User;
  onSaveUser: (user: User) => void;
  onDeleteUser: (userId: string) => void;
  onSwitchUser?: (user: User) => void;
  teams?: string[];
  onSaveTeams?: (teams: string[]) => void;
}

export const UserManagementView: React.FC<UserManagementViewProps> = ({
  users,
  currentUser,
  onSaveUser,
  onDeleteUser,
  onSwitchUser,
  teams = [],
  onSaveTeams
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<string>('TOUS');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('TOUS');

  const defaultTeamsList = [
    'Direction Générale',
    'Direction Production',
    'Équipe Auto & Habitation',
    'Équipe VTC & Pro',
    'Équipe Santé & Prévoyance',
    'Équipe Risques Spéciaux',
    'Équipe Entreprises & Flottes'
  ];

  const [teamsList, setTeamsList] = useState<string[]>(
    teams && teams.length > 0 ? teams : defaultTeamsList
  );

  const [showTeamsModal, setShowTeamsModal] = useState(false);
  const [newTeamInput, setNewTeamInput] = useState('');
  const [editingTeam, setEditingTeam] = useState<{ oldName: string; newName: string } | null>(null);

  const handleAddTeam = (teamName: string) => {
    const trimmed = teamName.trim();
    if (!trimmed) return;
    if (teamsList.some(t => t.toLowerCase() === trimmed.toLowerCase())) {
      showToast('Cette équipe existe déjà');
      return;
    }
    const updated = [...teamsList, trimmed];
    setTeamsList(updated);
    onSaveTeams?.(updated);
    setNewTeamInput('');
    showToast(`Équipe "${trimmed}" créée avec succès`);
  };

  const handleRenameTeam = (oldName: string, newName: string) => {
    const trimmed = newName.trim();
    if (!trimmed || trimmed === oldName) {
      setEditingTeam(null);
      return;
    }
    const updated = teamsList.map(t => t === oldName ? trimmed : t);
    setTeamsList(updated);
    onSaveTeams?.(updated);

    // Update users who have this old team
    users.forEach(u => {
      if (u.equipe === oldName) {
        onSaveUser({ ...u, equipe: trimmed });
      }
    });

    setEditingTeam(null);
    showToast(`Équipe renommée en "${trimmed}"`);
  };

  const handleDeleteTeam = (teamNameToDelete: string) => {
    const usersInTeam = users.filter(u => u.equipe === teamNameToDelete);
    if (usersInTeam.length > 0) {
      showToast(`Impossible de supprimer : ${usersInTeam.length} utilisateur(s) y sont rattaché(s)`);
      return;
    }
    const updated = teamsList.filter(t => t !== teamNameToDelete);
    setTeamsList(updated);
    onSaveTeams?.(updated);
    showToast(`Équipe "${teamNameToDelete}" supprimée`);
  };

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [deletingUser, setDeletingUser] = useState<User | null>(null);

  // Form State for User Edit/Create
  const [nom, setNom] = useState('');
  const [prenom, setPrenom] = useState('');
  const [email, setEmail] = useState('');
  const [telephone, setTelephone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState<UserRole>('AGENT_COMMERCIAL');
  const [equipe, setEquipe] = useState('');
  const [status, setStatus] = useState<'ACTIF' | 'INACTIF'>('ACTIF');
  const [specialite, setSpecialite] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [permissions, setPermissions] = useState<UserPermissions>(getDefaultPermissionsForRole('AGENT_COMMERCIAL'));

  const [notification, setNotification] = useState<string | null>(null);

  const canManage = currentUser.permissions.canManageUsers;
  const isDirecteurProd = currentUser.role === 'DIRECTEUR_PRODUCTION';

  const showToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3500);
  };

  const generateRandomPassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$';
    let res = '';
    for (let i = 0; i < 10; i++) {
      res += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setPassword(res);
  };

  const handleOpenModal = (userToEdit?: User) => {
    if (userToEdit) {
      setEditingUser(userToEdit);
      setNom(userToEdit.nom);
      setPrenom(userToEdit.prenom);
      setEmail(userToEdit.email);
      setTelephone(userToEdit.telephone);
      setPassword(userToEdit.password || 'Horizon2026!');
      setRole(userToEdit.role);
      setEquipe(userToEdit.equipe || teamsList[0] || 'Équipe Auto & Habitation');
      setStatus(userToEdit.status);
      setSpecialite(userToEdit.specialite || '');
      setAvatarUrl(userToEdit.avatarUrl || '');
      setPermissions(userToEdit.permissions || getDefaultPermissionsForRole(userToEdit.role));
    } else {
      setEditingUser(null);
      setNom('');
      setPrenom('');
      setEmail('');
      setTelephone('');
      setPassword('Horizon2026!');
      // Default to AGENT_COMMERCIAL for new accounts
      setRole('AGENT_COMMERCIAL');
      setEquipe(teamsList[0] || 'Équipe Auto & Habitation');
      setStatus('ACTIF');
      setSpecialite('Agent Commercial Auto & Habitation');
      setAvatarUrl('');
      setPermissions(getDefaultPermissionsForRole('AGENT_COMMERCIAL'));
    }
    setIsModalOpen(true);
  };

  const handleRoleChangeInModal = (newRole: UserRole) => {
    // Check constraint: Directeur de Production cannot grant ADMIN role
    if (isDirecteurProd && newRole === 'ADMIN') {
      showToast('Seul un Administrateur peut créer ou attribuer le rôle Administrateur.');
      return;
    }
    setRole(newRole);
    setPermissions(getDefaultPermissionsForRole(newRole));
  };

  const handleApplyPreset = (presetRole: UserRole) => {
    if (isDirecteurProd && presetRole === 'ADMIN') {
      showToast('Seul un Administrateur peut appliquer le modèle Administrateur.');
      return;
    }
    setRole(presetRole);
    setPermissions(getDefaultPermissionsForRole(presetRole));
    showToast(`Modèle de permissions "${presetRole}" appliqué`);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prenom.trim() || !nom.trim() || !email.trim()) {
      showToast('Veuillez remplir au moins le nom, le prénom et l\'adresse e-mail.');
      return;
    }

    if (isDirecteurProd && role === 'ADMIN') {
      showToast('En tant que Directeur de Production, vous ne pouvez pas créer de compte Administrateur.');
      return;
    }

    const newUser: User = {
      id: editingUser ? editingUser.id : `user-${Date.now()}`,
      nom: nom.trim(),
      prenom: prenom.trim(),
      email: email.trim(),
      telephone: telephone.trim(),
      password: password.trim() || 'Horizon2026!',
      role,
      equipe: equipe.trim() || 'Équipe Générale',
      status,
      specialite: specialite.trim(),
      avatarUrl: avatarUrl.trim() || `https://ui-avatars.com/api/?name=${encodeURIComponent(prenom + ' ' + nom)}&background=0284c7&color=fff`,
      permissions,
      createdAt: editingUser ? editingUser.createdAt : new Date().toISOString().split('T')[0],
      lastLoginAt: editingUser ? editingUser.lastLoginAt : 'Jamais'
    };

    onSaveUser(newUser);
    setIsModalOpen(false);
    showToast(editingUser ? `Compte de ${prenom} ${nom} mis à jour avec succès` : `Nouvel utilisateur ${prenom} ${nom} créé`);
  };

  const handleToggleUserStatus = (user: User) => {
    if (!canManage) return;
    const updated: User = {
      ...user,
      status: user.status === 'ACTIF' ? 'INACTIF' : 'ACTIF'
    };
    onSaveUser(updated);
    showToast(`Statut de ${user.prenom} ${user.nom} changé en ${updated.status}`);
  };

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.prenom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (u.specialite && u.specialite.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesRole =
      selectedRoleFilter === 'TOUS' ||
      u.role === selectedRoleFilter ||
      (selectedRoleFilter === 'AGENT_COMMERCIAL' && u.role === 'COURTIER') ||
      (selectedRoleFilter === 'RESPONSABLE_EQUIPE' && u.role === 'MANAGER');
    const matchesStatus = selectedStatusFilter === 'TOUS' || u.status === selectedStatusFilter;

    return matchesSearch && matchesRole && matchesStatus;
  });

  const getRoleBadge = (userRole: UserRole) => {
    switch (userRole) {
      case 'ADMIN':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-purple-100 text-purple-800 border border-purple-200">
            <ShieldCheck className="w-3.5 h-3.5 text-purple-600" />
            Administrateur
          </span>
        );
      case 'DIRECTEUR_PRODUCTION':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-indigo-100 text-indigo-800 border border-indigo-200">
            <Shield className="w-3.5 h-3.5 text-indigo-600" />
            Dir. Production
          </span>
        );
      case 'RESPONSABLE_EQUIPE':
      case 'MANAGER':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-blue-100 text-blue-800 border border-blue-200">
            <Users className="w-3.5 h-3.5 text-blue-600" />
            Resp. Équipe
          </span>
        );
      case 'GESTIONNAIRE':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
            <Building2 className="w-3.5 h-3.5 text-amber-600" />
            Gestionnaire
          </span>
        );
      case 'AGENT_COMMERCIAL':
      case 'COURTIER':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
            <Briefcase className="w-3.5 h-3.5 text-emerald-600" />
            Agent Commercial
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Toast Notification */}
      {notification && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-2xl border border-slate-700 flex items-center gap-3 animate-bounce">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-sm font-medium">{notification}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden border border-slate-800">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-500/10 via-transparent to-transparent pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-semibold border border-indigo-500/30">
              <ShieldCheck className="w-3.5 h-3.5" />
              Sécurité & Contrôle d'Accès (RBAC)
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              Gestion des Utilisateurs & Droits
            </h1>
            <p className="text-sm text-slate-300 max-w-2xl">
              Gérez les comptes des collaborateurs, définissez les rôles (Admin, Manager, Courtier, Gestionnaire) et configurez les permissions d'accès granulaires au CRM.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {canManage && (
              <>
                <button
                  onClick={() => setShowTeamsModal(true)}
                  className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-100 text-xs font-semibold rounded-xl border border-slate-700 transition flex items-center gap-2 cursor-pointer shadow-md"
                >
                  <Layers className="w-4 h-4 text-indigo-400" />
                  <span>Gérer les Équipes ({teamsList.length})</span>
                </button>
                <button
                  onClick={() => handleOpenModal()}
                  className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl shadow-lg transition flex items-center gap-2 cursor-pointer"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Nouvel Utilisateur</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Warning banner if not admin */}
        {!canManage && (
          <div className="mt-4 p-3 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-200 text-xs flex items-center gap-2.5">
            <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0" />
            <span>
              Vous êtes actuellement connecté en tant que <strong>{currentUser.prenom} {currentUser.nom}</strong> ({currentUser.role}). Vos permissions ne vous permettent pas de modifier les utilisateurs. Mode lecture seule.
            </span>
          </div>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-slate-100 text-slate-700">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">Total Utilisateurs</p>
            <p className="text-xl font-extrabold text-slate-900">{users.length}</p>
          </div>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-emerald-100 text-emerald-700">
            <UserCheck className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">Comptes Actifs</p>
            <p className="text-xl font-extrabold text-emerald-600">
              {users.filter((u) => u.status === 'ACTIF').length}
            </p>
          </div>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-purple-100 text-purple-700">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">Administrateurs</p>
            <p className="text-xl font-extrabold text-purple-700">
              {users.filter((u) => u.role === 'ADMIN').length}
            </p>
          </div>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-blue-100 text-blue-700">
            <Briefcase className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">Agents & Responsables</p>
            <p className="text-xl font-extrabold text-blue-700">
              {users.filter((u) => u.role === 'AGENT_COMMERCIAL' || u.role === 'RESPONSABLE_EQUIPE' || u.role === 'COURTIER' || u.role === 'MANAGER').length}
            </p>
          </div>
        </div>
      </div>

      {/* Filter and Search Toolbar */}
      <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-3 sm:space-y-0 sm:flex sm:items-center sm:justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Rechercher par nom, e-mail, spécialité..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Role filter */}
          <select
            value={selectedRoleFilter}
            onChange={(e) => setSelectedRoleFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 outline-none cursor-pointer"
          >
            <option value="TOUS">Tous les rôles</option>
            <option value="ADMIN">Administrateur</option>
            <option value="DIRECTEUR_PRODUCTION">Directeur de Production</option>
            <option value="RESPONSABLE_EQUIPE">Responsable d'Équipe</option>
            <option value="AGENT_COMMERCIAL">Agent Commercial</option>
            <option value="GESTIONNAIRE">Gestionnaire</option>
          </select>

          {/* Status filter */}
          <select
            value={selectedStatusFilter}
            onChange={(e) => setSelectedStatusFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 outline-none"
          >
            <option value="TOUS">Tous les statuts</option>
            <option value="ACTIF">Actifs uniquement</option>
            <option value="INACTIF">Inactifs uniquement</option>
          </select>
        </div>
      </div>

      {/* Users Grid Card List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredUsers.map((u) => {
          const isCurrentSessionUser = u.id === currentUser.id;

          return (
            <div
              key={u.id}
              className={`bg-white rounded-2xl border transition-all duration-200 p-5 shadow-xs hover:shadow-md flex flex-col justify-between relative ${
                isCurrentSessionUser ? 'border-indigo-500 ring-2 ring-indigo-500/20' : 'border-slate-200'
              }`}
            >
              {isCurrentSessionUser && (
                <div className="absolute top-3 right-3 px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-700 text-[10px] font-bold border border-indigo-200">
                  Vous
                </div>
              )}

              <div className="space-y-4">
                {/* User Header */}
                <div className="flex items-start gap-3.5">
                  <img
                    src={
                      u.avatarUrl ||
                      `https://ui-avatars.com/api/?name=${encodeURIComponent(u.prenom + ' ' + u.nom)}&background=0284c7&color=fff`
                    }
                    alt={u.prenom}
                    className="w-12 h-12 rounded-2xl object-cover border border-slate-200 shadow-xs shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm font-bold text-slate-900 truncate flex items-center gap-1.5">
                      {u.prenom} {u.nom}
                    </h3>
                    <p className="text-xs text-slate-500 truncate">{u.specialite || 'Courtier en Assurances'}</p>
                    <div className="mt-2 flex items-center gap-2 flex-wrap">
                      {getRoleBadge(u.role)}
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          u.status === 'ACTIF'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            u.status === 'ACTIF' ? 'bg-emerald-500' : 'bg-rose-500'
                          }`}
                        />
                        {u.status}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Contact Info */}
                <div className="space-y-1.5 pt-2 border-t border-slate-100 text-xs text-slate-600">
                  <div className="flex items-center gap-2 truncate">
                    <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{u.email}</span>
                  </div>
                  <div className="flex items-center gap-2 truncate">
                    <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{u.telephone || 'Non renseigné'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-[11px] font-mono text-slate-500">
                    <Key className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>Mot de passe : <strong className="text-slate-800">{u.password ? '••••••••' : 'Défaut (Horizon2026!)'}</strong></span>
                  </div>
                </div>

                {/* Permissions Summary Pills */}
                <div className="pt-2 border-t border-slate-100 space-y-1.5">
                  <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    Permissions d'accès :
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    <span
                      className={`px-2 py-0.5 rounded-md text-[10px] font-medium border ${
                        u.permissions.canViewAllLeads
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-amber-50 text-amber-700 border-amber-200'
                      }`}
                      title={
                        u.permissions.canViewAllLeads
                          ? 'Accès à tous les leads du cabinet'
                          : 'Restreint aux leads assignés uniquement'
                      }
                    >
                      {u.permissions.canViewAllLeads ? '👁️ Tous les leads' : '🔒 Ses leads uniquement'}
                    </span>

                    {u.permissions.canExportData && (
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-blue-50 text-blue-700 border border-blue-200">
                        📥 Export Excel/CSV
                      </span>
                    )}

                    {u.permissions.canDeleteLeads && (
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-rose-50 text-rose-700 border border-rose-200">
                        🗑️ Suppr. Leads
                      </span>
                    )}

                    {u.permissions.canManageUsers && (
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-purple-50 text-purple-700 border border-purple-200">
                        👥 Gestion Users
                      </span>
                    )}

                    {u.permissions.canEditSettings && (
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-slate-100 text-slate-700 border border-slate-200">
                        ⚙️ Admin Paramètres
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Card Footer Actions */}
              <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <div className="flex items-center gap-1.5 ml-auto">
                  {canManage && (
                    <>
                      <button
                        onClick={() => handleToggleUserStatus(u)}
                        className={`p-1.5 rounded-lg border text-xs font-medium transition cursor-pointer ${
                          u.status === 'ACTIF'
                            ? 'bg-rose-50 border-rose-200 text-rose-600 hover:bg-rose-100'
                            : 'bg-emerald-50 border-emerald-200 text-emerald-600 hover:bg-emerald-100'
                        }`}
                        title={u.status === 'ACTIF' ? 'Désactiver le compte' : 'Activer le compte'}
                      >
                        {u.status === 'ACTIF' ? <XCircle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
                      </button>

                      <button
                        onClick={() => handleOpenModal(u)}
                        className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg shadow-xs transition flex items-center gap-1.5 cursor-pointer"
                      >
                        <Edit2 className="w-3.5 h-3.5 text-indigo-300" />
                        <span>Modifier</span>
                      </button>

                      {users.length > 1 && !isCurrentSessionUser && (
                        <button
                          onClick={() => setDeletingUser(u)}
                          className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 rounded-lg transition cursor-pointer"
                          title="Supprimer définitivement l'utilisateur"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* USER EDIT / CREATE MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full border border-slate-200 shadow-2xl my-8 overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="p-5 bg-gradient-to-r from-slate-900 to-indigo-950 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-500/20 border border-indigo-400/30 rounded-xl">
                  <ShieldCheck className="w-5 h-5 text-indigo-300" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white">
                    {editingUser ? `Éditer l'utilisateur : ${editingUser.prenom} ${editingUser.nom}` : 'Créer un nouvel utilisateur'}
                  </h2>
                  <p className="text-xs text-slate-300">Affectation du rôle et réglage des droits granulaires</p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSave} className="p-6 overflow-y-auto space-y-6 flex-1 text-slate-800">
              {/* Profile Main Info */}
              <div className="space-y-4">
                <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <UserIcon className="w-4 h-4 text-slate-500" />
                  Informations Personnelles & Rôle
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Prénom *</label>
                    <input
                      type="text"
                      required
                      value={prenom}
                      onChange={(e) => setPrenom(e.target.value)}
                      placeholder="Ex: Sophie"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Nom *</label>
                    <input
                      type="text"
                      required
                      value={nom}
                      onChange={(e) => setNom(e.target.value)}
                      placeholder="Ex: Martin"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Email Professionnel *</label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="s.martin@horizon-courtage.fr"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Téléphone</label>
                    <input
                      type="text"
                      value={telephone}
                      onChange={(e) => setTelephone(e.target.value)}
                      placeholder="01 42 68 90 00"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-semibold text-slate-700">Mot de passe d'accès *</label>
                      <button
                        type="button"
                        onClick={generateRandomPassword}
                        className="text-[10px] text-indigo-600 font-bold hover:underline cursor-pointer flex items-center gap-1"
                      >
                        <Sparkles className="w-3 h-3" />
                        <span>Générer</span>
                      </button>
                    </div>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Mot de passe d'accès..."
                        className="w-full pl-3 pr-10 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono focus:ring-2 focus:ring-indigo-500 outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                      >
                        {showPassword ? <Lock className="w-3.5 h-3.5 text-indigo-600" /> : <Key className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Rôle Principal & Droits *</label>
                    <select
                      value={role}
                      onChange={(e) => handleRoleChangeInModal(e.target.value as UserRole)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none"
                    >
                      <option value="AGENT_COMMERCIAL">Agent Commercial (Ses leads rattachés uniquement)</option>
                      <option value="RESPONSABLE_EQUIPE">Responsable d'Équipe (Leads de son équipe)</option>
                      <option value="GESTIONNAIRE">Gestionnaire (Leads de son équipe / Back-office)</option>
                      <option value="DIRECTEUR_PRODUCTION">Directeur de Production (Accès Admin sauf création d'Admin)</option>
                      {!isDirecteurProd && (
                        <option value="ADMIN">Administrateur Cabinet (Accès total & création Admins)</option>
                      )}
                    </select>
                    {isDirecteurProd && (
                      <p className="text-[11px] text-amber-700 mt-1 italic">
                        ℹ️ En tant que Directeur de Production, la création de comptes Administrateur est réservée aux Admins.
                      </p>
                    )}
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-semibold text-slate-700">Équipe Rattachée *</label>
                      <button
                        type="button"
                        onClick={() => setShowTeamsModal(true)}
                        className="text-[11px] text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <FolderPlus className="w-3.5 h-3.5" />
                        <span>Gérer les équipes</span>
                      </button>
                    </div>
                    <select
                      required
                      value={equipe}
                      onChange={(e) => {
                        if (e.target.value === 'NEW_TEAM_OPTION') {
                          const name = window.prompt('Saisissez le nom de la nouvelle équipe (ex: Équipe Prévoyance Pro) :');
                          if (name && name.trim()) {
                            handleAddTeam(name.trim());
                            setEquipe(name.trim());
                          }
                        } else {
                          setEquipe(e.target.value);
                        }
                      }}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none"
                    >
                      {teamsList.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                      <option value="NEW_TEAM_OPTION" className="text-indigo-600 font-bold">
                        ➕ + Créer une nouvelle équipe...
                      </option>
                    </select>
                    <p className="text-[10px] text-slate-500 mt-1">
                      Rattache le commercial, gestionnaire ou responsable à son équipe opérationnelle.
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Statut du Compte</label>
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value as 'ACTIF' | 'INACTIF')}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none"
                    >
                      <option value="ACTIF">Actif (Autorisé à se connecter)</option>
                      <option value="INACTIF">Inactif (Bloqué)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Spécialité / Fonction</label>
                    <input
                      type="text"
                      value={specialite}
                      onChange={(e) => setSpecialite(e.target.value)}
                      placeholder="Ex: Agent Commercial Auto & VTC"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">URL Photo Avatar</label>
                    <input
                      type="url"
                      value={avatarUrl}
                      onChange={(e) => setAvatarUrl(e.target.value)}
                      placeholder="https://..."
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Granular Permissions Section */}
              <div className="space-y-4 pt-4 border-t border-slate-200">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Shield className="w-4 h-4 text-indigo-600" />
                    Permissions Granulaires et Droits d'Accès
                  </h3>

                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[11px] text-slate-500 font-medium">Modèles rapides :</span>
                    {!isDirecteurProd && (
                      <button
                        type="button"
                        onClick={() => handleApplyPreset('ADMIN')}
                        className="px-2 py-1 bg-purple-100 hover:bg-purple-200 text-purple-800 text-[10px] font-bold rounded-lg transition cursor-pointer"
                      >
                        Admin
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleApplyPreset('DIRECTEUR_PRODUCTION')}
                      className="px-2 py-1 bg-indigo-100 hover:bg-indigo-200 text-indigo-800 text-[10px] font-bold rounded-lg transition cursor-pointer"
                    >
                      Dir. Prod
                    </button>
                    <button
                      type="button"
                      onClick={() => handleApplyPreset('RESPONSABLE_EQUIPE')}
                      className="px-2 py-1 bg-blue-100 hover:bg-blue-200 text-blue-800 text-[10px] font-bold rounded-lg transition cursor-pointer"
                    >
                      Resp. Équipe
                    </button>
                    <button
                      type="button"
                      onClick={() => handleApplyPreset('AGENT_COMMERCIAL')}
                      className="px-2 py-1 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 text-[10px] font-bold rounded-lg transition cursor-pointer"
                    >
                      Agent Comm.
                    </button>
                    <button
                      type="button"
                      onClick={() => handleApplyPreset('GESTIONNAIRE')}
                      className="px-2 py-1 bg-amber-100 hover:bg-amber-200 text-amber-800 text-[10px] font-bold rounded-lg transition cursor-pointer"
                    >
                      Gestionnaire
                    </button>
                  </div>
                </div>

                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                  {/* Permission 1: View all leads vs assigned leads */}
                  <label className="flex items-start gap-3 p-2.5 bg-white rounded-xl border border-slate-200 hover:border-indigo-300 transition cursor-pointer">
                    <input
                      type="checkbox"
                      checked={permissions.canViewAllLeads}
                      onChange={(e) =>
                        setPermissions({ ...permissions, canViewAllLeads: e.target.checked })
                      }
                      className="mt-0.5 w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                    />
                    <div>
                      <p className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                        <Eye className="w-3.5 h-3.5 text-indigo-600" />
                        Voir la totalité des leads du cabinet
                      </p>
                      <p className="text-[11px] text-slate-500">
                        Si désactivé, l'utilisateur ne verra dans le CRM que les leads qui lui sont spécifiquement assignés.
                      </p>
                    </div>
                  </label>

                  {/* Permission 2: Create leads */}
                  <label className="flex items-start gap-3 p-2.5 bg-white rounded-xl border border-slate-200 hover:border-indigo-300 transition cursor-pointer">
                    <input
                      type="checkbox"
                      checked={permissions.canCreateLeads}
                      onChange={(e) =>
                        setPermissions({ ...permissions, canCreateLeads: e.target.checked })
                      }
                      className="mt-0.5 w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                    />
                    <div>
                      <p className="text-xs font-bold text-slate-900">
                        Créer de nouveaux leads (Bouton Nouveau Lead)
                      </p>
                      <p className="text-[11px] text-slate-500">
                        Permet de créer un prospect Auto, Habitation ou VTC.
                      </p>
                    </div>
                  </label>

                  {/* Permission 3: Edit leads */}
                  <label className="flex items-start gap-3 p-2.5 bg-white rounded-xl border border-slate-200 hover:border-indigo-300 transition cursor-pointer">
                    <input
                      type="checkbox"
                      checked={permissions.canEditLeads}
                      onChange={(e) =>
                        setPermissions({ ...permissions, canEditLeads: e.target.checked })
                      }
                      className="mt-0.5 w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                    />
                    <div>
                      <p className="text-xs font-bold text-slate-900">
                        Modifier les fiches leads & devis
                      </p>
                      <p className="text-[11px] text-slate-500">
                        Éditer les coordonnées, caractéristiques du véhicule/logement et montants de prime.
                      </p>
                    </div>
                  </label>

                  {/* Permission 4: Delete leads */}
                  <label className="flex items-start gap-3 p-2.5 bg-white rounded-xl border border-slate-200 hover:border-indigo-300 transition cursor-pointer">
                    <input
                      type="checkbox"
                      checked={permissions.canDeleteLeads}
                      onChange={(e) =>
                        setPermissions({ ...permissions, canDeleteLeads: e.target.checked })
                      }
                      className="mt-0.5 w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                    />
                    <div>
                      <p className="text-xs font-bold text-slate-900 text-rose-700 flex items-center gap-1">
                        <Trash2 className="w-3.5 h-3.5" />
                        Supprimer des leads
                      </p>
                      <p className="text-[11px] text-slate-500">
                        Accorde le droit de supprimer définitivement une fiche client du système.
                      </p>
                    </div>
                  </label>

                  {/* Permission 5: Change lead status */}
                  <label className="flex items-start gap-3 p-2.5 bg-white rounded-xl border border-slate-200 hover:border-indigo-300 transition cursor-pointer">
                    <input
                      type="checkbox"
                      checked={permissions.canChangeLeadStatus}
                      onChange={(e) =>
                        setPermissions({ ...permissions, canChangeLeadStatus: e.target.checked })
                      }
                      className="mt-0.5 w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                    />
                    <div>
                      <p className="text-xs font-bold text-slate-900">
                        Changer le statut & la qualification
                      </p>
                      <p className="text-[11px] text-slate-500">
                        Passer le lead de "Nouveau" à "Devis Envoyé", "Gagné" ou "Perdu".
                      </p>
                    </div>
                  </label>

                  {/* Permission 6: Export data */}
                  <label className="flex items-start gap-3 p-2.5 bg-white rounded-xl border border-slate-200 hover:border-indigo-300 transition cursor-pointer">
                    <input
                      type="checkbox"
                      checked={permissions.canExportData}
                      onChange={(e) =>
                        setPermissions({ ...permissions, canExportData: e.target.checked })
                      }
                      className="mt-0.5 w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                    />
                    <div>
                      <p className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                        <Download className="w-3.5 h-3.5 text-blue-600" />
                        Exporter les données (Excel / CSV)
                      </p>
                      <p className="text-[11px] text-slate-500">
                        Autorise le téléchargement des fichiers d'export de la base de prospects.
                      </p>
                    </div>
                  </label>

                  {/* Permission 7: Assign leads */}
                  <label className="flex items-start gap-3 p-2.5 bg-white rounded-xl border border-slate-200 hover:border-indigo-300 transition cursor-pointer">
                    <input
                      type="checkbox"
                      checked={permissions.canAssignLeads}
                      onChange={(e) =>
                        setPermissions({ ...permissions, canAssignLeads: e.target.checked })
                      }
                      className="mt-0.5 w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                    />
                    <div>
                      <p className="text-xs font-bold text-slate-900">
                        Re-assigner les leads aux courtiers
                      </p>
                      <p className="text-[11px] text-slate-500">
                        Changer le courtier responsable d'un portefeuille de leads.
                      </p>
                    </div>
                  </label>

                  {/* Permission 8: Manage users */}
                  <label className="flex items-start gap-3 p-2.5 bg-white rounded-xl border border-slate-200 hover:border-indigo-300 transition cursor-pointer">
                    <input
                      type="checkbox"
                      checked={permissions.canManageUsers}
                      onChange={(e) =>
                        setPermissions({ ...permissions, canManageUsers: e.target.checked })
                      }
                      className="mt-0.5 w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                    />
                    <div>
                      <p className="text-xs font-bold text-slate-900 text-purple-700 flex items-center gap-1">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        Gérer les utilisateurs et les droits
                      </p>
                      <p className="text-[11px] text-slate-500">
                        Accès à cette page de gestion des utilisateurs.
                      </p>
                    </div>
                  </label>

                  {/* Permission 9: Settings & SMTP */}
                  <label className="flex items-start gap-3 p-2.5 bg-white rounded-xl border border-slate-200 hover:border-indigo-300 transition cursor-pointer">
                    <input
                      type="checkbox"
                      checked={permissions.canEditSettings}
                      onChange={(e) =>
                        setPermissions({ ...permissions, canEditSettings: e.target.checked })
                      }
                      className="mt-0.5 w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                    />
                    <div>
                      <p className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                        <Settings className="w-3.5 h-3.5 text-slate-700" />
                        Accéder aux Paramètres du Cabinet & Serveur SMTP
                      </p>
                      <p className="text-[11px] text-slate-500">
                        Modifier l'ORIAS, la raison sociale, les modèles d'e-mail et le serveur mail.
                      </p>
                    </div>
                  </label>
                </div>
              </div>

              {/* Modal Footer Actions */}
              <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition cursor-pointer"
                >
                  Annuler
                </button>

                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow-md transition cursor-pointer flex items-center gap-2"
                >
                  <Check className="w-4 h-4" />
                  <span>{editingUser ? 'Enregistrer les modifications' : 'Créer l\'utilisateur'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* DELETE USER CONFIRMATION MODAL */}
      {deletingUser && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 border border-slate-200 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-rose-100 rounded-2xl text-rose-600 shrink-0">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-base text-slate-900">Supprimer l'utilisateur ?</h3>
                <p className="text-xs text-slate-500">Cette action est définitive et irréversible.</p>
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-700 leading-relaxed">
              Vous allez supprimer le compte de <strong className="text-slate-900">{deletingUser.prenom} {deletingUser.nom}</strong> ({deletingUser.email}). Ses accès au CRM seront immédiatement révoqués.
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeletingUser(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={() => {
                  onDeleteUser(deletingUser.id);
                  showToast(`Utilisateur ${deletingUser.prenom} ${deletingUser.nom} supprimé avec succès`);
                  setDeletingUser(null);
                }}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-md shadow-rose-600/20 transition cursor-pointer flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Supprimer Définitivement</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MANAGE TEAMS MODAL */}
      {showTeamsModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 border border-slate-200 shadow-2xl space-y-6 max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-indigo-100 text-indigo-700 rounded-2xl">
                  <Layers className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900">Gestion des Équipes & Organigramme</h3>
                  <p className="text-xs text-slate-500">Créez et organisez les équipes pour y attacher vos commerciaux, gestionnaires et responsables d'équipe.</p>
                </div>
              </div>
              <button
                onClick={() => setShowTeamsModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Add Team Form */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleAddTeam(newTeamInput);
              }}
              className="flex items-center gap-2 p-3 bg-indigo-50/60 rounded-2xl border border-indigo-100 shrink-0"
            >
              <input
                type="text"
                value={newTeamInput}
                onChange={(e) => setNewTeamInput(e.target.value)}
                placeholder="Nom de la nouvelle équipe (ex: Équipe Risques Spéciaux, Équipe Flottes...)"
                className="flex-1 px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
              />
              <button
                type="submit"
                disabled={!newTeamInput.trim()}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center gap-1.5 cursor-pointer shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>Ajouter l'équipe</span>
              </button>
            </form>

            {/* Teams List */}
            <div className="flex-1 overflow-y-auto space-y-3 pr-1">
              {teamsList.map((teamName) => {
                const members = users.filter(u => u.equipe === teamName);
                const commercialsCount = members.filter(u => u.role === 'AGENT_COMMERCIAL' || u.role === 'COURTIER').length;
                const gestionnairesCount = members.filter(u => u.role === 'GESTIONNAIRE').length;
                const responsablesCount = members.filter(u => u.role === 'RESPONSABLE_EQUIPE' || u.role === 'MANAGER').length;
                const isEditing = editingTeam?.oldName === teamName;

                return (
                  <div
                    key={teamName}
                    className="p-4 bg-slate-50 hover:bg-slate-100/80 rounded-2xl border border-slate-200 transition space-y-3"
                  >
                    <div className="flex items-center justify-between gap-3">
                      {isEditing ? (
                        <div className="flex items-center gap-2 flex-1">
                          <input
                            type="text"
                            value={editingTeam.newName}
                            onChange={(e) => setEditingTeam({ ...editingTeam, newName: e.target.value })}
                            className="flex-1 px-3 py-1.5 bg-white border border-indigo-400 rounded-xl text-xs font-bold outline-none"
                          />
                          <button
                            type="button"
                            onClick={() => handleRenameTeam(teamName, editingTeam.newName)}
                            className="p-1.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition cursor-pointer"
                            title="Valider"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingTeam(null)}
                            className="p-1.5 bg-slate-300 text-slate-700 rounded-lg hover:bg-slate-400 transition cursor-pointer"
                            title="Annuler"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-sm text-slate-900">{teamName}</h4>
                          <span className="px-2 py-0.5 bg-slate-200 text-slate-700 rounded-full text-[10px] font-bold">
                            {members.length} membre{members.length > 1 ? 's' : ''}
                          </span>
                        </div>
                      )}

                      {!isEditing && (
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => setEditingTeam({ oldName: teamName, newName: teamName })}
                            className="p-1.5 bg-white border border-slate-200 text-slate-600 hover:text-indigo-600 rounded-xl transition cursor-pointer shadow-2xs"
                            title="Renommer l'équipe"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteTeam(teamName)}
                            className="p-1.5 bg-rose-50 border border-rose-200 text-rose-600 hover:bg-rose-100 rounded-xl transition cursor-pointer shadow-2xs"
                            title="Supprimer l'équipe"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Member breakdown */}
                    <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-200/60">
                      {responsablesCount > 0 && (
                        <span className="px-2.5 py-1 bg-blue-100 text-blue-800 text-[11px] font-semibold rounded-lg">
                          👤 {responsablesCount} Resp. d'Équipe
                        </span>
                      )}
                      {commercialsCount > 0 && (
                        <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 text-[11px] font-semibold rounded-lg">
                          💼 {commercialsCount} Commercial{commercialsCount > 1 ? 'aux' : ''}
                        </span>
                      )}
                      {gestionnairesCount > 0 && (
                        <span className="px-2.5 py-1 bg-amber-100 text-amber-800 text-[11px] font-semibold rounded-lg">
                          🏢 {gestionnairesCount} Gestionnaire{gestionnairesCount > 1 ? 's' : ''}
                        </span>
                      )}
                      {members.length === 0 && (
                        <span className="text-[11px] text-slate-400 italic">
                          Aucun membre n'est encore rattaché à cette équipe.
                        </span>
                      )}
                    </div>

                    {/* Member Avatars */}
                    {members.length > 0 && (
                      <div className="flex flex-wrap items-center gap-2 pt-1">
                        {members.map((u) => (
                          <div
                            key={u.id}
                            className="inline-flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-xl border border-slate-200 shadow-2xs text-[11px]"
                          >
                            <img
                              src={u.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(u.prenom + ' ' + u.nom)}&background=0284c7&color=fff`}
                              alt={u.prenom}
                              className="w-4 h-4 rounded-full object-cover"
                            />
                            <span className="font-semibold text-slate-800">{u.prenom} {u.nom}</span>
                            <span className="text-[10px] text-slate-400 font-medium">({u.role === 'AGENT_COMMERCIAL' ? 'Agent' : u.role === 'RESPONSABLE_EQUIPE' ? 'Resp.' : u.role})</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Modal Footer */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-end">
              <button
                type="button"
                onClick={() => setShowTeamsModal(false)}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md transition cursor-pointer"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
