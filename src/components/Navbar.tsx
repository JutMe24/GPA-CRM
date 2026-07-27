import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Users, 
  Settings, 
  Plus, 
  FileSpreadsheet, 
  ShieldCheck, 
  Bell,
  Clock,
  CheckCircle2,
  ChevronRight,
  X,
  Phone,
  UserCheck,
  ChevronDown,
  MessageSquare,
  Monitor,
  ExternalLink,
  AlertCircle,
  Check,
  Lock,
  Key,
  LogOut
} from 'lucide-react';
import { CabinetInfo, Lead, User } from '../types/crm';
import {
  isNotificationSupported,
  getNotificationPermission,
  requestNotificationPermission,
  isInIframe
} from '../utils/notifications';

interface NavbarProps {
  currentTab: 'dashboard' | 'leads' | 'settings' | 'users' | 'chat';
  setCurrentTab: (tab: 'dashboard' | 'leads' | 'settings' | 'users' | 'chat') => void;
  onOpenNewLeadModal: () => void;
  onOpenImportModal: () => void;
  cabinetInfo: CabinetInfo;
  pendingActionsCount: number;
  unreadChatCount?: number;
  leads?: Lead[];
  onSelectLead?: (lead: Lead) => void;
  onCompleteReminder?: (leadId: string) => void;
  users?: User[];
  currentUser?: User;
  onLogout?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  setCurrentTab,
  onOpenNewLeadModal,
  onOpenImportModal,
  cabinetInfo,
  pendingActionsCount,
  unreadChatCount = 0,
  leads = [],
  onSelectLead,
  onCompleteReminder,
  users = [],
  currentUser,
  onLogout
}) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [notifPermission, setNotifPermission] = useState<NotificationPermission>('default');
  const [showIframeModal, setShowIframeModal] = useState(false);

  useEffect(() => {
    setNotifPermission(getNotificationPermission());
  }, []);

  const handleEnableWindowsNotifications = async () => {
    // If inside an iframe, browsers block Notification.requestPermission()
    if (isInIframe()) {
      setShowIframeModal(true);
      return;
    }

    const res = await requestNotificationPermission();
    setNotifPermission(res);
    if (res === 'denied') {
      alert("⚠️ Les notifications sont bloquées dans votre navigateur.\n\nPour les autoriser :\n1. Cliquez sur le cadenas 🔒 à gauche de l'adresse URL en haut.\n2. Autorisez les Notifications.\n3. Rechargez la page.");
    }
  };

  const currentDateFormatted = new Date().toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  const todayStr = new Date().toISOString().split('T')[0];

  // Scheduled Reminders list
  const scheduledReminders = leads.filter(
    (l) => l.prochaineActionDate && l.status !== 'GAGNE' && l.status !== 'PERDU'
  ).sort((a, b) => (a.prochaineActionDate || '').localeCompare(b.prochaineActionDate || ''));

  const overdueCount = scheduledReminders.filter(l => (l.prochaineActionDate || '') < todayStr).length;

  const getRoleColorClass = (role?: string) => {
    switch (role) {
      case 'ADMIN': return 'bg-purple-500/20 text-purple-300 border-purple-500/40';
      case 'MANAGER': return 'bg-blue-500/20 text-blue-300 border-blue-500/40';
      case 'GESTIONNAIRE': return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
      case 'COURTIER':
      default: return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
    }
  };

  return (
    <div className="bg-slate-900 border-b border-slate-800 text-white sticky top-0 z-30 shadow-md">
      {/* Top Header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Brand & Cabinet Logo */}
        <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setCurrentTab('dashboard')}>
          {cabinetInfo.logoUrl ? (
            <div className="h-10 max-w-[140px] px-2 py-1 bg-white rounded-xl flex items-center justify-center shadow-md">
              <img
                src={cabinetInfo.logoUrl}
                alt={cabinetInfo.nomCabinet}
                className="max-h-8 max-w-[120px] object-contain"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
            </div>
          ) : (
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white font-bold shadow-lg shadow-blue-500/20">
              <ShieldCheck className="w-6 h-6" />
            </div>
          )}

          <div>
            <h1 className="font-bold text-lg text-slate-100 tracking-tight leading-none">
              {cabinetInfo.nomCabinet || 'Cabinet Assurance'}
            </h1>
            <p className="text-xs text-slate-300 mt-1 capitalize">
              {currentDateFormatted}
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="hidden lg:flex items-center space-x-1 bg-slate-950/60 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => setCurrentTab('dashboard')}
            className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-xs font-medium transition-all cursor-pointer ${
              currentTab === 'dashboard'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30 font-bold'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>Tableau de bord</span>
          </button>

          <button
            onClick={() => setCurrentTab('leads')}
            className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-xs font-medium transition-all relative cursor-pointer ${
              currentTab === 'leads'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30 font-bold'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Gestion des Leads</span>
            {pendingActionsCount > 0 && (
              <span className="bg-amber-500 text-slate-950 text-[10px] font-bold px-1.5 py-0.2 rounded-full">
                {pendingActionsCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setCurrentTab('chat')}
            className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-xs font-medium transition-all relative cursor-pointer ${
              currentTab === 'chat'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30 font-bold'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span>Messagerie</span>
            {unreadChatCount > 0 && (
              <span className="bg-blue-500 text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full">
                {unreadChatCount}
              </span>
            )}
          </button>

          {currentUser?.role === 'ADMIN' && (
            <button
              onClick={() => setCurrentTab('settings')}
              className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                currentTab === 'settings' || currentTab === 'users'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30 font-bold'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Settings className="w-4 h-4" />
              <span>Paramètres</span>
            </button>
          )}
        </nav>

        {/* Action, Notifications & User Switcher */}
        <div className="flex items-center space-x-2">

          {/* User Profile Switcher */}
          {currentUser && (
            <div className="relative">
              <button
                onClick={() => {
                  setShowUserMenu(!showUserMenu);
                  setShowNotifications(false);
                }}
                className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700/80 border border-slate-700 rounded-xl flex items-center gap-2 transition cursor-pointer"
                title="Changer d'utilisateur / Profil actif"
              >
                <img
                  src={
                    currentUser.avatarUrl ||
                    `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser.prenom + ' ' + currentUser.nom)}&background=0284c7&color=fff`
                  }
                  alt={currentUser.prenom}
                  className="w-7 h-7 rounded-lg object-cover border border-slate-600 shrink-0"
                />
                <div className="text-left hidden sm:block">
                  <p className="text-xs font-bold leading-none text-slate-100">{currentUser.prenom} {currentUser.nom}</p>
                  <p className="text-[10px] text-slate-400 font-medium leading-tight mt-0.5">{currentUser.role}</p>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 ml-1" />
              </button>

              {/* Profile Card Dropdown */}
              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-72 bg-white text-slate-900 rounded-2xl shadow-2xl border border-slate-200 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2">
                  <div className="p-4 bg-slate-900 text-white space-y-2">
                    <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Compte Connecté</p>
                    <div className="flex items-center gap-3">
                      <img
                        src={
                          currentUser.avatarUrl ||
                          `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser.prenom + ' ' + currentUser.nom)}&background=0284c7&color=fff`
                        }
                        alt={currentUser.prenom}
                        className="w-10 h-10 rounded-xl object-cover border border-slate-700 shrink-0"
                      />
                      <div>
                        <p className="font-bold text-sm text-white">{currentUser.prenom} {currentUser.nom}</p>
                        <span className={`inline-block text-[9px] font-bold px-2 py-0.5 rounded border mt-0.5 ${getRoleColorClass(currentUser.role)}`}>
                          {currentUser.role}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="p-3 space-y-2 text-xs text-slate-600 border-b border-slate-100">
                    <div className="flex justify-between items-center py-1">
                      <span className="font-semibold text-slate-500">Équipe :</span>
                      <span className="font-bold text-slate-800">{currentUser.equipe || 'Équipe Générale'}</span>
                    </div>
                    <div className="flex justify-between items-center py-1">
                      <span className="font-semibold text-slate-500">Email :</span>
                      <span className="font-medium text-slate-700 truncate max-w-[150px]" title={currentUser.email}>{currentUser.email}</span>
                    </div>
                    {currentUser.specialite && (
                      <div className="flex justify-between items-center py-1">
                        <span className="font-semibold text-slate-500">Spécialité :</span>
                        <span className="font-medium text-slate-700 truncate max-w-[150px]">{currentUser.specialite}</span>
                      </div>
                    )}
                  </div>

                  {currentUser.role === 'ADMIN' && (
                    <div className="p-2 space-y-1 bg-slate-50 border-b border-slate-100">
                      <button
                        onClick={() => {
                          setCurrentTab('settings');
                          setShowUserMenu(false);
                        }}
                        className="w-full py-2 px-3 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition text-center flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                      >
                        <UserCheck className="w-3.5 h-3.5 text-indigo-100" />
                        <span>Gestion Utilisateurs & Droits</span>
                      </button>
                      <button
                        onClick={() => {
                          setCurrentTab('settings');
                          setShowUserMenu(false);
                        }}
                        className="w-full py-2 px-3 bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold rounded-xl transition text-center flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <Settings className="w-3.5 h-3.5 text-slate-600" />
                        <span>Paramètres du Cabinet</span>
                      </button>
                    </div>
                  )}

                  {/* Déconnexion */}
                  <div className="p-2 bg-rose-50/50 rounded-b-2xl">
                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        onLogout?.();
                      }}
                      className="w-full py-2 px-3 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs rounded-xl transition flex items-center justify-center gap-2 cursor-pointer border border-rose-200/80"
                    >
                      <LogOut className="w-3.5 h-3.5 text-rose-600" />
                      <span>Se Déconnecter</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* System Notification Bell */}
          <div className="relative">
            <button
              onClick={() => {
                setShowNotifications(!showNotifications);
                setShowUserMenu(false);
              }}
              className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl border border-slate-700 transition relative cursor-pointer flex items-center justify-center"
              title="Notifications des rappels et relances"
            >
              <Bell className="w-5 h-5 text-amber-400" />
              {scheduledReminders.length > 0 && (
                <span className={`absolute -top-1 -right-1 text-[10px] font-bold px-1.5 py-0.2 rounded-full shadow ${
                  overdueCount > 0 ? 'bg-red-500 text-white animate-pulse' : 'bg-amber-500 text-slate-950'
                }`}>
                  {scheduledReminders.length}
                </span>
              )}
            </button>

            {/* Notification Drawer Popover */}
            {showNotifications && (
              <div className="absolute right-0 mt-3 w-80 sm:w-96 bg-white text-slate-900 rounded-2xl shadow-2xl border border-slate-200 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2">
                <div className="bg-slate-900 text-white px-4 py-3 flex items-center justify-between border-b border-slate-800">
                  <div className="flex items-center space-x-2">
                    <Clock className="w-4 h-4 text-amber-400" />
                    <h3 className="font-bold text-xs">Rappels & Relances Programmés</h3>
                  </div>
                  <button onClick={() => setShowNotifications(false)} className="text-slate-400 hover:text-white">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Windows Desktop Popup Banner */}
                <div className="p-3 bg-indigo-900/10 border-b border-indigo-100 flex items-center justify-between gap-2">
                  <div className="flex items-center space-x-2">
                    <div className="p-1.5 bg-indigo-600 text-white rounded-lg shrink-0">
                      <Monitor className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-[11px] font-bold text-indigo-950 flex items-center gap-1">
                        Notifications Windows / Bureau
                      </p>
                      <p className="text-[10px] text-slate-500 leading-tight">
                        {notifPermission === 'granted'
                          ? 'Popups actifs lorsque vous êtes hors du CRM'
                          : 'Alerte popup quand vous êtes sur une autre page'}
                      </p>
                    </div>
                  </div>

                  <div className="shrink-0">
                    {notifPermission === 'granted' ? (
                      <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-lg border border-emerald-300 flex items-center gap-1">
                        <Check className="w-3 h-3 text-emerald-600" />
                        <span>Actif</span>
                      </span>
                    ) : (
                      <button
                        onClick={handleEnableWindowsNotifications}
                        className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold rounded-lg transition flex items-center gap-1 cursor-pointer shadow-xs"
                      >
                        <Bell className="w-3 h-3 text-emerald-100" />
                        <span>Activer</span>
                      </button>
                    )}
                  </div>
                </div>

                <div className="p-2 max-h-96 overflow-y-auto divide-y divide-slate-100">
                  {scheduledReminders.length === 0 ? (
                    <div className="p-6 text-center text-xs text-slate-500 space-y-1">
                      <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-1" />
                      <p className="font-bold text-slate-800">Aucun rappel en attente</p>
                      <p className="text-[11px] text-slate-400">Toutes vos actions programmées sont à jour !</p>
                    </div>
                  ) : (
                    scheduledReminders.map((lead) => {
                      const isOverdue = (lead.prochaineActionDate || '') < todayStr;
                      const isToday = (lead.prochaineActionDate || '') === todayStr;

                      return (
                        <div key={lead.id} className="p-3 hover:bg-slate-50 transition rounded-xl space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                              isOverdue ? 'bg-red-100 text-red-800 border border-red-200' :
                              isToday ? 'bg-amber-100 text-amber-800 border border-amber-200' :
                              'bg-blue-100 text-blue-800 border border-blue-200'
                            }`}>
                              {isOverdue ? '🚨 EN RETARD' : isToday ? '📅 AUJOURD\'HUI' : '🔮 À VENIR'}
                            </span>

                            <span className="text-[10px] font-mono font-bold text-slate-500">
                              {lead.prochaineActionDate} {lead.prochaineActionHeure && `à ${lead.prochaineActionHeure}`}
                            </span>
                          </div>

                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-bold text-xs text-slate-900">{lead.prenom} {lead.nom}</p>
                              <p className="text-[11px] text-amber-900 font-semibold flex items-center gap-1">
                                📌 {lead.prochaineActionIntitule || 'Rappel'}
                              </p>
                            </div>

                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700">
                              {lead.type}
                            </span>
                          </div>

                          <div className="pt-1 flex items-center justify-between text-[11px]">
                            <span className="text-slate-500 font-mono flex items-center gap-1">
                              <Phone className="w-3 h-3 text-slate-400" />
                              {lead.telephone}
                            </span>

                            <div className="flex items-center space-x-1">
                              {onCompleteReminder && (
                                <button
                                  onClick={() => {
                                    onCompleteReminder(lead.id);
                                  }}
                                  className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-md border border-emerald-200 transition cursor-pointer"
                                  title="Marquer comme traité"
                                >
                                  ✓ Fait
                                </button>
                              )}

                              {onSelectLead && (
                                <button
                                  onClick={() => {
                                    onSelectLead(lead);
                                    setShowNotifications(false);
                                  }}
                                  className="px-2 py-1 bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-bold rounded-md transition flex items-center gap-0.5 cursor-pointer"
                                >
                                  <span>Fiche</span>
                                  <ChevronRight className="w-3 h-3" />
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>

          {currentUser && (currentUser.role === 'ADMIN' || currentUser.role === 'DIRECTEUR_PRODUCTION') && (
            <button
              onClick={onOpenImportModal}
              className="hidden sm:flex items-center space-x-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg border border-slate-700 transition cursor-pointer"
              title="Importer des leads via fichier Excel ou CSV"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
              <span>Import Excel</span>
            </button>
          )}

          {currentUser?.permissions.canCreateLeads && (
            <button
              onClick={onOpenNewLeadModal}
              className="flex items-center space-x-2 px-3.5 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-semibold rounded-lg shadow-lg shadow-emerald-900/30 transition transform active:scale-95 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Nouveau Lead</span>
            </button>
          )}
        </div>
      </div>

      {/* Mobile Submenu Bar */}
      <div className="flex lg:hidden border-t border-slate-800 px-2 py-1.5 justify-around bg-slate-950/80">
        <button
          onClick={() => setCurrentTab('dashboard')}
          className={`flex flex-col items-center py-1 px-3 rounded-lg text-xs font-medium ${
            currentTab === 'dashboard' ? 'text-blue-400 font-bold' : 'text-slate-400'
          }`}
        >
          <LayoutDashboard className="w-5 h-5 mb-0.5" />
          <span>Dashboard</span>
        </button>
        <button
          onClick={() => setCurrentTab('leads')}
          className={`flex flex-col items-center py-1 px-3 rounded-lg text-xs font-medium relative ${
            currentTab === 'leads' ? 'text-blue-400 font-bold' : 'text-slate-400'
          }`}
        >
          <Users className="w-5 h-5 mb-0.5" />
          <span>Leads</span>
          {pendingActionsCount > 0 && (
            <span className="absolute top-0 right-2 bg-amber-500 text-slate-950 text-[10px] font-bold px-1 rounded-full">
              {pendingActionsCount}
            </span>
          )}
        </button>
        <button
          onClick={() => setCurrentTab('settings')}
          className={`flex flex-col items-center py-1 px-3 rounded-lg text-xs font-medium ${
            currentTab === 'settings' || currentTab === 'users' ? 'text-blue-400 font-bold' : 'text-slate-400'
          }`}
        >
          <Settings className="w-5 h-5 mb-0.5" />
          <span>Paramètres</span>
        </button>
      </div>

      {/* Iframe / New Tab Guidance Modal */}
      {showIframeModal && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 text-slate-900">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2 text-indigo-600">
                <Monitor className="w-6 h-6" />
                <h3 className="font-bold text-base">Activation des Notifications Windows</h3>
              </div>
              <button
                onClick={() => setShowIframeModal(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-4 space-y-3">
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 flex items-start space-x-3 text-amber-900">
                <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <p className="text-xs leading-relaxed">
                  <strong>Sécurité Navigateur (Chrome / Edge) :</strong> Les autorisations de notifications popups ne peuvent pas être demandées directement à l'intérieur d'un cadre de prévisualisation (iframe).
                </p>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed">
                Pour recevoir les rappels clients sous forme de <strong>popups Windows</strong> en arrière-plan :
              </p>

              <ol className="text-xs text-slate-700 space-y-2 list-decimal list-inside font-medium bg-slate-50 p-3 rounded-xl border border-slate-200">
                <li>Ouvrez le CRM dans un <strong>nouvel onglet indépendant</strong> (bouton ci-dessous).</li>
                <li>Dans ce nouvel onglet, cliquez sur l'icône de cloche 🔔 puis sur <strong>Activer</strong>.</li>
                <li>Acceptez la demande d'autorisation de votre navigateur.</li>
              </ol>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row items-center justify-end gap-2">
              <button
                onClick={() => setShowIframeModal(false)}
                className="w-full sm:w-auto px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
              >
                Fermer
              </button>

              <button
                onClick={() => {
                  window.open(window.location.href, '_blank');
                  setShowIframeModal(false);
                }}
                className="w-full sm:w-auto px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-indigo-200"
              >
                <ExternalLink className="w-4 h-4" />
                <span>Ouvrir le CRM dans un nouvel onglet</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
