import { ChatChannel, ChatMessage } from '../types/crm';

export const initialChatChannels: ChatChannel[] = [
  {
    id: 'channel-group-auto-habitation',
    type: 'GROUP',
    name: '📢 Groupe - Équipe Auto & Habitation',
    description: 'Canal officiel d\'échange entre les agents, la responsable d\'équipe et la direction.',
    equipe: 'Équipe Auto & Habitation',
    participantIds: ['user-1', 'user-2', 'user-3', 'user-4', 'user-6'],
    lastMessage: 'Parfait, je mets à jour les fiches de souscription.',
    lastMessageTime: '2026-07-26 11:30'
  },
  {
    id: 'channel-group-vtc-pro',
    type: 'GROUP',
    name: '📢 Groupe - Équipe VTC & Pro',
    description: 'Canal dédié à l\'équipe VTC, Flottes et Risques Professionnels.',
    equipe: 'Équipe VTC & Pro',
    participantIds: ['user-1', 'user-2', 'user-5'],
    lastMessage: 'Dossiers VTC validés pour cette semaine.',
    lastMessageTime: '2026-07-26 09:15'
  },
  {
    id: 'direct-user-3-user-4',
    type: 'DIRECT',
    name: 'Échange Marc Dubreuil & Sophie Martin',
    participantIds: ['user-3', 'user-4'],
    lastMessage: 'Super, merci beaucoup !',
    lastMessageTime: '2026-07-26 10:45'
  },
  {
    id: 'direct-user-1-user-3',
    type: 'DIRECT',
    name: 'Échange Sophie Martin & Pierre-Antoine Dupuis',
    participantIds: ['user-1', 'user-3'],
    lastMessage: 'Merci Pierre-Antoine ! Marc et Julie ont fait un excellent travail.',
    lastMessageTime: '2026-07-25 16:20'
  },
  {
    id: 'direct-user-1-user-4',
    type: 'DIRECT',
    name: 'Échange Marc Dubreuil & Pierre-Antoine Dupuis',
    participantIds: ['user-1', 'user-4'],
    lastMessage: 'Validation accordée pour le dossier M. Dupuis.',
    lastMessageTime: '2026-07-24 14:10'
  }
];

export const initialChatMessages: ChatMessage[] = [
  // Channel Group Auto & Habitation
  {
    id: 'msg-1',
    channelId: 'channel-group-auto-habitation',
    senderId: 'user-3',
    senderName: 'Sophie Martin',
    senderRole: 'RESPONSABLE_EQUIPE',
    senderAvatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    content: 'Bonjour à tous ! Les nouveaux barèmes tarifaires Auto & Habitation 2026 sont en ligne dans l\'outil. N\'hésitez pas si vous avez des questions sur les conditions de souscription.',
    timestamp: '2026-07-26 09:00',
    reactions: { '👍': ['user-4', 'user-6', 'user-1'] }
  },
  {
    id: 'msg-2',
    channelId: 'channel-group-auto-habitation',
    senderId: 'user-4',
    senderName: 'Marc Dubreuil',
    senderRole: 'AGENT_COMMERCIAL',
    senderAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    content: 'Bonjour Sophie, merci pour l\'information ! Est-ce que les critères d\'acceptation concernant les suspensions de permis restent inchangés ?',
    timestamp: '2026-07-26 09:12'
  },
  {
    id: 'msg-3',
    channelId: 'channel-group-auto-habitation',
    senderId: 'user-1',
    senderName: 'Pierre-Antoine Dupuis',
    senderRole: 'ADMIN',
    senderAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    content: 'Oui Marc, les règles de souscription pour profils aggravés restent identiques jusqu me la fin du trimestre. Excellente journée et bonnes ventes à l\'équipe !',
    timestamp: '2026-07-26 10:05',
    reactions: { '🔥': ['user-3', 'user-4'] }
  },
  {
    id: 'msg-4',
    channelId: 'channel-group-auto-habitation',
    senderId: 'user-6',
    senderName: 'Julie Moreau',
    senderRole: 'GESTIONNAIRE',
    senderAvatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
    content: 'Parfait, je mets à jour les fiches de souscription.',
    timestamp: '2026-07-26 11:30'
  },

  // Direct Marc Dubreuil <-> Sophie Martin
  {
    id: 'msg-10',
    channelId: 'direct-user-3-user-4',
    senderId: 'user-4',
    senderName: 'Marc Dubreuil',
    senderRole: 'AGENT_COMMERCIAL',
    senderAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    content: 'Bonjour Sophie, j\'ai le prospect M. Cherkaoui pour sa proposition Tous Risques Auto. Il hésite à cause des frais de dossier de 50€. Est-ce qu\'on peut lui faire une remise ?',
    timestamp: '2026-07-26 10:30'
  },
  {
    id: 'msg-11',
    channelId: 'direct-user-3-user-4',
    senderId: 'user-3',
    senderName: 'Sophie Martin',
    senderRole: 'RESPONSABLE_EQUIPE',
    senderAvatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    content: 'Salut Marc, tu peux lui offrir 50% de remise sur les frais s\'il signe le mandat SEPA aujourd\'hui !',
    timestamp: '2026-07-26 10:38'
  },
  {
    id: 'msg-12',
    channelId: 'direct-user-3-user-4',
    senderId: 'user-4',
    senderName: 'Marc Dubreuil',
    senderRole: 'AGENT_COMMERCIAL',
    senderAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    content: 'Super, merci beaucoup !',
    timestamp: '2026-07-26 10:45'
  },

  // Direct Sophie Martin <-> Pierre-Antoine Dupuis
  {
    id: 'msg-20',
    channelId: 'direct-user-1-user-3',
    senderId: 'user-1',
    senderName: 'Pierre-Antoine Dupuis',
    senderRole: 'ADMIN',
    senderAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    content: 'Bonjour Sophie, le rapport de conversion hebdomadaire de ton équipe est très positif. Félicitations pour le suivi des relances.',
    timestamp: '2026-07-25 15:40'
  },
  {
    id: 'msg-21',
    channelId: 'direct-user-1-user-3',
    senderId: 'user-3',
    senderName: 'Sophie Martin',
    senderRole: 'RESPONSABLE_EQUIPE',
    senderAvatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    content: 'Merci Pierre-Antoine ! Marc et Julie ont fait un excellent travail.',
    timestamp: '2026-07-25 16:20'
  }
];
