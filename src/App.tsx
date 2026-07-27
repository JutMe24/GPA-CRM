import React, { useState, useEffect } from 'react';
import { ShieldAlert } from 'lucide-react';
import { Navbar } from './components/Navbar';
import { Dashboard } from './components/Dashboard';
import { LeadsList } from './components/LeadsList';
import { UserManagementView } from './components/UserManagementView';
import { SettingsPage } from './components/SettingsPage';
import { LeadModal } from './components/LeadModal';
import { ImportExcelModal } from './components/ImportExcelModal';
import { LeadDetailsView } from './components/LeadDetailsView';
import { ChatView } from './components/ChatView';
import { LoginView } from './components/LoginView';

import { Lead, LeadStatus, LeadType, CabinetInfo, SmtpConfig, EmailTemplate, User, ChatChannel, ChatMessage, InsurancePartnerApiConfig } from './types/crm';
import { 
  loadLeads, 
  saveLeads, 
  loadCabinetInfo, 
  saveCabinetInfo, 
  loadSmtpConfig, 
  saveSmtpConfig, 
  loadEmailTemplates, 
  saveEmailTemplates,
  loadUsers,
  saveUsers,
  loadCurrentUser,
  saveCurrentUser,
  loadChatChannels,
  saveChatChannels,
  loadChatMessages,
  saveChatMessages,
  loadInsurancePartners,
  saveInsurancePartners,
  loadTeams,
  saveTeams
} from './utils/storage';
import { checkAndNotifyReminders } from './utils/notifications';

const AUTH_KEY = 'crm_insurance_authenticated_v1';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    const stored = localStorage.getItem(AUTH_KEY);
    return stored === null ? true : stored === 'true';
  });

  const [currentTab, setCurrentTab] = useState<'dashboard' | 'leads' | 'users' | 'settings' | 'chat'>('dashboard');
  const [productFilter, setProductFilter] = useState<LeadType | 'ALL'>('ALL');

  // Persistence State
  const [leads, setLeads] = useState<Lead[]>([]);
  const [users, setUsers] = useState<User[]>(loadUsers());
  const [currentUser, setCurrentUser] = useState<User>(loadCurrentUser());
  const [cabinetInfo, setCabinetInfo] = useState<CabinetInfo>(loadCabinetInfo());
  const [smtpConfig, setSmtpConfig] = useState<SmtpConfig>(loadSmtpConfig());
  const [emailTemplates, setEmailTemplates] = useState<EmailTemplate[]>(loadEmailTemplates());
  const [partners, setPartners] = useState<InsurancePartnerApiConfig[]>(loadInsurancePartners());
  const [teams, setTeams] = useState<string[]>(loadTeams());

  const handleSaveTeams = (newTeams: string[]) => {
    setTeams(newTeams);
    saveTeams(newTeams);
  };

  // Login / Logout Handlers
  const handleLogin = (user: User) => {
    setCurrentUser(user);
    saveCurrentUser(user);
    setIsAuthenticated(true);
    localStorage.setItem(AUTH_KEY, 'true');
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.setItem(AUTH_KEY, 'false');
  };

  // Chat State
  const [channels, setChannels] = useState<ChatChannel[]>(loadChatChannels());
  const [messages, setMessages] = useState<ChatMessage[]>(loadChatMessages());

  // Modal States
  const [isLeadModalOpen, setIsLeadModalOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);

  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  const [selectedLeadDetails, setSelectedLeadDetails] = useState<Lead | null>(null);

  // Load leads on mount and check background reminders
  useEffect(() => {
    const loaded = loadLeads();
    setLeads(loaded);
    checkAndNotifyReminders(loaded);

    // Periodically check for due/overdue reminders in background every 30s
    const interval = setInterval(() => {
      checkAndNotifyReminders(loaded);
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  // Also check whenever leads state updates
  useEffect(() => {
    if (leads.length > 0) {
      checkAndNotifyReminders(leads);
    }
  }, [leads]);

  // Chat Handlers
  const handleSendMessage = (channelId: string, content: string, attachments?: any[]) => {
    const formattedTime = new Date().toLocaleString('fr-FR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    }).replace(',', '');

    const newMsg: ChatMessage = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      channelId,
      senderId: currentUser.id,
      senderName: `${currentUser.prenom} ${currentUser.nom}`,
      senderRole: currentUser.role,
      senderAvatar: currentUser.avatarUrl,
      content,
      timestamp: formattedTime,
      attachments
    };

    const updatedMessages = [...messages, newMsg];
    setMessages(updatedMessages);
    saveChatMessages(updatedMessages);

    // Update last message in channel
    const updatedChannels = channels.map((chan) => {
      if (chan.id === channelId) {
        return {
          ...chan,
          lastMessage: content || 'Fichier joint',
          lastMessageTime: formattedTime
        };
      }
      return chan;
    });

    setChannels(updatedChannels);
    saveChatChannels(updatedChannels);
  };

  const handleCreateDirectChannel = (otherUser: User): string => {
    // Check if direct channel already exists
    const existing = channels.find(
      (c) =>
        c.type === 'DIRECT' &&
        c.participantIds.includes(currentUser.id) &&
        c.participantIds.includes(otherUser.id)
    );

    if (existing) {
      return existing.id;
    }

    const newChan: ChatChannel = {
      id: `direct-${currentUser.id}-${otherUser.id}`,
      type: 'DIRECT',
      name: `Échange ${currentUser.prenom} & ${otherUser.prenom}`,
      participantIds: [currentUser.id, otherUser.id],
      lastMessage: 'Nouvelle discussion démarrée',
      lastMessageTime: new Date().toLocaleString('fr-FR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      }).replace(',', '')
    };

    const updatedChannels = [newChan, ...channels];
    setChannels(updatedChannels);
    saveChatChannels(updatedChannels);
    return newChan.id;
  };

  const handleToggleReaction = (messageId: string, emoji: string) => {
    const updatedMessages = messages.map((msg) => {
      if (msg.id === messageId) {
        const reactions = { ...(msg.reactions || {}) };
        const currentUsersForEmoji = reactions[emoji] || [];

        if (currentUsersForEmoji.includes(currentUser.id)) {
          reactions[emoji] = currentUsersForEmoji.filter((id) => id !== currentUser.id);
        } else {
          reactions[emoji] = [...currentUsersForEmoji, currentUser.id];
        }

        return { ...msg, reactions };
      }
      return msg;
    });

    setMessages(updatedMessages);
    saveChatMessages(updatedMessages);
  };

  // User Management Persistence Handlers
  const handleSaveUser = (userToSave: User) => {
    const exists = users.some((u) => u.id === userToSave.id);
    let updatedUsers: User[];
    if (exists) {
      updatedUsers = users.map((u) => (u.id === userToSave.id ? userToSave : u));
    } else {
      updatedUsers = [userToSave, ...users];
    }
    setUsers(updatedUsers);
    saveUsers(updatedUsers);

    // If active user was updated, keep currentUser in sync
    if (currentUser.id === userToSave.id) {
      setCurrentUser(userToSave);
      saveCurrentUser(userToSave);
    }
  };

  const handleDeleteUser = (userId: string) => {
    const updatedUsers = users.filter((u) => u.id !== userId);
    setUsers(updatedUsers);
    saveUsers(updatedUsers);
  };

  const handleSwitchUser = (user: User) => {
    setCurrentUser(user);
    saveCurrentUser(user);
  };

  // Save Leads helper
  const updateLeadsList = (updated: Lead[]) => {
    const uniqueMap = new Map<string, Lead>();
    updated.forEach((l) => {
      if (l && l.id) uniqueMap.set(l.id, l);
    });
    const unique = Array.from(uniqueMap.values());
    setLeads(unique);
    saveLeads(unique);
  };

  // Handlers
  const handleSaveLead = (newOrUpdatedLead: Lead) => {
    const exists = leads.some((l) => l.id === newOrUpdatedLead.id);
    let updatedList: Lead[];

    if (exists) {
      updatedList = leads.map((l) => (l.id === newOrUpdatedLead.id ? newOrUpdatedLead : l));
    } else {
      updatedList = [newOrUpdatedLead, ...leads];
    }

    updateLeadsList(updatedList);

    // If currently inspecting this lead, update it
    if (selectedLeadDetails && selectedLeadDetails.id === newOrUpdatedLead.id) {
      setSelectedLeadDetails(newOrUpdatedLead);
    }
  };

  const handleDeleteLead = (leadId: string) => {
    // Check permission
    if (!currentUser.permissions.canDeleteLeads) {
      alert("Action non autorisée : Vous n'avez pas les droits nécessaires pour supprimer un lead.");
      return;
    }

    const updatedList = leads.filter((l) => l.id !== leadId);
    updateLeadsList(updatedList);
    if (selectedLeadDetails?.id === leadId) {
      setSelectedLeadDetails(null);
    }
  };

  const handleUpdateStatus = (leadId: string, status: LeadStatus) => {
    const updatedList = leads.map((l) =>
      l.id === leadId ? { ...l, status, updatedAt: new Date().toISOString() } : l
    );
    updateLeadsList(updatedList);

    if (selectedLeadDetails?.id === leadId) {
      setSelectedLeadDetails((prev) => (prev ? { ...prev, status } : null));
    }
  };

  const handleImportSuccess = (importedLeads: Lead[]) => {
    const existingIds = new Set(leads.map((l) => l.id));
    const processedImported = importedLeads.map((lead, idx) => {
      if (!lead.id || existingIds.has(lead.id)) {
        return {
          ...lead,
          id: `lead-import-${Date.now()}-${idx}-${Math.random().toString(36).substr(2, 4)}`
        };
      }
      return lead;
    });
    const merged = [...processedImported, ...leads];
    updateLeadsList(merged);
    setCurrentTab('leads');
  };

  const handleNavigateToLeads = (filter?: LeadType | 'ALL') => {
    if (filter) setProductFilter(filter);
    setCurrentTab('leads');
  };

  const handleOpenNewLeadModal = () => {
    if (!currentUser.permissions.canCreateLeads) {
      alert("Action non autorisée : Vous n'avez pas les droits nécessaires pour créer un lead.");
      return;
    }
    setEditingLead(null);
    setIsLeadModalOpen(true);
  };

  const handleOpenEditLeadModal = (lead: Lead) => {
    setEditingLead(lead);
    setIsLeadModalOpen(true);
  };

  const handleCompleteReminder = (leadId: string) => {
    const updatedList = leads.map((l) =>
      l.id === leadId
        ? {
            ...l,
            prochaineActionIntitule: '',
            prochaineActionDate: '',
            prochaineActionHeure: '',
            updatedAt: new Date().toISOString()
          }
        : l
    );
    updateLeadsList(updatedList);
    if (selectedLeadDetails?.id === leadId) {
      setSelectedLeadDetails((prev) =>
        prev
          ? {
              ...prev,
              prochaineActionIntitule: '',
              prochaineActionDate: '',
              prochaineActionHeure: ''
            }
          : null
      );
    }
  };

  const pendingActionsCount = leads.filter(
    (l) => l.prochaineActionDate && l.status !== 'GAGNE' && l.status !== 'PERDU'
  ).length;

  if (!isAuthenticated) {
    return (
      <LoginView
        users={users}
        cabinetInfo={cabinetInfo}
        onLogin={handleLogin}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 font-sans text-slate-900 flex flex-col">
      {/* Navigation Bar */}
      <Navbar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        onOpenNewLeadModal={handleOpenNewLeadModal}
        onOpenImportModal={() => {
          if (currentUser?.role === 'ADMIN' || currentUser?.role === 'DIRECTEUR_PRODUCTION') {
            setIsImportModalOpen(true);
          }
        }}
        cabinetInfo={cabinetInfo}
        pendingActionsCount={pendingActionsCount}
        leads={leads}
        onSelectLead={(lead) => setSelectedLeadDetails(lead)}
        onCompleteReminder={handleCompleteReminder}
        users={users}
        currentUser={currentUser}
        onLogout={handleLogout}
      />

      {/* Main View Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {currentTab === 'dashboard' && (
          <Dashboard
            leads={leads}
            currentUser={currentUser}
            users={users}
            onOpenNewLeadModal={handleOpenNewLeadModal}
            onSelectLead={(lead) => setSelectedLeadDetails(lead)}
            onNavigateToLeads={handleNavigateToLeads}
          />
        )}

        {currentTab === 'leads' && (
          <LeadsList
            leads={leads}
            onOpenNewLeadModal={handleOpenNewLeadModal}
            onOpenImportModal={() => {
              if (currentUser?.role === 'ADMIN' || currentUser?.role === 'DIRECTEUR_PRODUCTION') {
                setIsImportModalOpen(true);
              }
            }}
            onSelectLead={(lead) => setSelectedLeadDetails(lead)}
            onUpdateStatus={handleUpdateStatus}
            onUpdateLead={handleSaveLead}
            initialProductFilter={productFilter}
            currentUser={currentUser}
          />
        )}

        {currentTab === 'chat' && (
          <ChatView
            currentUser={currentUser}
            users={users}
            channels={channels}
            messages={messages}
            onSendMessage={handleSendMessage}
            onCreateDirectChannel={handleCreateDirectChannel}
            onToggleReaction={handleToggleReaction}
          />
        )}

        {(currentTab === 'settings' || currentTab === 'users') && (
          currentUser.role === 'ADMIN' ? (
            <SettingsPage
              cabinetInfo={cabinetInfo}
              onSaveCabinetInfo={(info) => {
                setCabinetInfo(info);
                saveCabinetInfo(info);
              }}
              smtpConfig={smtpConfig}
              onSaveSmtpConfig={(cfg) => {
                setSmtpConfig(cfg);
                saveSmtpConfig(cfg);
              }}
              emailTemplates={emailTemplates}
              onSaveEmailTemplates={(tmpls) => {
                setEmailTemplates(tmpls);
                saveEmailTemplates(tmpls);
              }}
              partners={partners}
              onSavePartners={(newP) => {
                setPartners(newP);
                saveInsurancePartners(newP);
              }}
              users={users}
              currentUser={currentUser}
              onSaveUser={handleSaveUser}
              onDeleteUser={handleDeleteUser}
              onSwitchUser={handleSwitchUser}
              teams={teams}
              onSaveTeams={handleSaveTeams}
            />
          ) : (
            <div className="max-w-md mx-auto my-12 p-8 bg-white rounded-3xl border border-slate-200 shadow-xl text-center space-y-4">
              <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-2xl mx-auto flex items-center justify-center">
                <ShieldAlert className="w-8 h-8" />
              </div>
              <h2 className="text-lg font-bold text-slate-900">Accès Réservé aux Administrateurs</h2>
              <p className="text-xs text-slate-500 leading-relaxed">
                Vous n'avez pas les privilèges nécessaires pour accéder à la configuration du cabinet et à la gestion des utilisateurs. Seuls les Administrateurs ont cet accès.
              </p>
              <button
                onClick={() => setCurrentTab('dashboard')}
                className="mt-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md transition cursor-pointer"
              >
                Retour au Tableau de bord
              </button>
            </div>
          )
        )}
      </main>

      {/* Modals & Drawers */}
      <LeadModal
        key={editingLead ? editingLead.id : `new-lead-${isLeadModalOpen}`}
        isOpen={isLeadModalOpen}
        onClose={() => setIsLeadModalOpen(false)}
        onSaveLead={handleSaveLead}
        existingLead={editingLead}
        cabinetInfo={cabinetInfo}
        users={users}
        currentUser={currentUser}
      />

      <ImportExcelModal
        isOpen={isImportModalOpen && (currentUser?.role === 'ADMIN' || currentUser?.role === 'DIRECTEUR_PRODUCTION')}
        onClose={() => setIsImportModalOpen(false)}
        onImportSuccess={handleImportSuccess}
      />

      <LeadDetailsView
        key={selectedLeadDetails ? selectedLeadDetails.id : 'lead-details-closed'}
        lead={selectedLeadDetails}
        onClose={() => setSelectedLeadDetails(null)}
        onEditLead={(lead) => {
          setSelectedLeadDetails(null);
          handleOpenEditLeadModal(lead);
        }}
        onDeleteLead={handleDeleteLead}
        onUpdateStatus={handleUpdateStatus}
        emailTemplates={emailTemplates}
        cabinetInfo={cabinetInfo}
        smtpConfig={smtpConfig}
        onUpdateLead={handleSaveLead}
        users={users}
        currentUser={currentUser}
        partners={partners}
        onSaveEmailTemplates={(tmpls) => {
          setEmailTemplates(tmpls);
          saveEmailTemplates(tmpls);
        }}
      />
    </div>
  );
}
