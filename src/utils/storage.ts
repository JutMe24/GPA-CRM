import { Lead, SmtpConfig, EmailTemplate, CabinetInfo, User, ChatChannel, ChatMessage, InsurancePartnerApiConfig } from '../types/crm';
import { initialLeads, initialSmtpConfig, initialEmailTemplates, initialCabinetInfo, initialUsers } from '../data/mockData';
import { initialChatChannels, initialChatMessages } from '../data/mockChatData';
import { initialInsurancePartners } from '../data/mockPartnersData';

const LEADS_KEY = 'crm_insurance_leads_v1';
const SMTP_KEY = 'crm_insurance_smtp_v1';
const TEMPLATES_KEY = 'crm_insurance_templates_v1';
const CABINET_KEY = 'crm_insurance_cabinet_v1';
const USERS_KEY = 'crm_insurance_users_v1';
const CURRENT_USER_KEY = 'crm_insurance_current_user_v1';
const CHANNELS_KEY = 'crm_insurance_chat_channels_v1';
const MESSAGES_KEY = 'crm_insurance_chat_messages_v1';
const PARTNERS_KEY = 'crm_insurance_partners_v1';
const TEAMS_KEY = 'crm_insurance_teams_v1';

export const initialTeams: string[] = [
  'Direction Générale',
  'Direction Production',
  'Équipe Auto & Habitation',
  'Équipe VTC & Pro',
  'Équipe Santé & Prévoyance',
  'Équipe Risques Spéciaux',
  'Équipe Entreprises & Flottes'
];

export const loadTeams = (): string[] => {
  try {
    const raw = localStorage.getItem(TEAMS_KEY);
    if (!raw) {
      saveTeams(initialTeams);
      return initialTeams;
    }
    const teams = JSON.parse(raw);
    return Array.isArray(teams) && teams.length > 0 ? teams : initialTeams;
  } catch (err) {
    console.error('Error loading teams', err);
    return initialTeams;
  }
};

export const saveTeams = (teams: string[]): void => {
  try {
    localStorage.setItem(TEAMS_KEY, JSON.stringify(teams));
  } catch (err) {
    console.error('Error saving teams', err);
  }
};


export const loadUsers = (): User[] => {
  try {
    const raw = localStorage.getItem(USERS_KEY);
    if (!raw) {
      saveUsers(initialUsers);
      return initialUsers;
    }
    return JSON.parse(raw);
  } catch (err) {
    console.error('Error loading users', err);
    return initialUsers;
  }
};

export const saveUsers = (users: User[]): void => {
  try {
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
  } catch (err) {
    console.error('Error saving users', err);
  }
};

export const loadCurrentUser = (): User => {
  try {
    const raw = localStorage.getItem(CURRENT_USER_KEY);
    const users = loadUsers();
    if (raw) {
      const parsed = JSON.parse(raw);
      // Ensure current user reflects latest saved permissions in users list
      const matched = users.find(u => u.id === parsed.id);
      if (matched) return matched;
    }
    const defaultAdmin = users.find(u => u.role === 'ADMIN') || users[0] || initialUsers[0];
    saveCurrentUser(defaultAdmin);
    return defaultAdmin;
  } catch (err) {
    return initialUsers[0];
  }
};

export const saveCurrentUser = (user: User): void => {
  try {
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
  } catch (err) {
    console.error('Error saving current user', err);
  }
};

export const loadLeads = (): Lead[] => {
  try {
    const raw = localStorage.getItem(LEADS_KEY);
    let loaded: Lead[];
    if (!raw) {
      loaded = initialLeads;
    } else {
      loaded = JSON.parse(raw);
    }
    const uniqueMap = new Map<string, Lead>();
    loaded.forEach((l) => {
      if (l && l.id) {
        uniqueMap.set(l.id, l);
      }
    });
    const uniqueLeads = Array.from(uniqueMap.values());
    if (!raw || uniqueLeads.length !== loaded.length) {
      saveLeads(uniqueLeads);
    }
    return uniqueLeads;
  } catch (err) {
    console.error('Error loading leads from storage', err);
    return initialLeads;
  }
};

export const saveLeads = (leads: Lead[]): void => {
  try {
    const uniqueMap = new Map<string, Lead>();
    leads.forEach((l) => {
      if (l && l.id) {
        uniqueMap.set(l.id, l);
      }
    });
    const uniqueLeads = Array.from(uniqueMap.values());
    localStorage.setItem(LEADS_KEY, JSON.stringify(uniqueLeads));
  } catch (err) {
    console.error('Error saving leads to storage', err);
  }
};

export const loadSmtpConfig = (): SmtpConfig => {
  try {
    const raw = localStorage.getItem(SMTP_KEY);
    if (!raw) {
      saveSmtpConfig(initialSmtpConfig);
      return initialSmtpConfig;
    }
    return JSON.parse(raw);
  } catch (err) {
    return initialSmtpConfig;
  }
};

export const saveSmtpConfig = (config: SmtpConfig): void => {
  try {
    localStorage.setItem(SMTP_KEY, JSON.stringify(config));
  } catch (err) {
    console.error('Error saving SMTP config', err);
  }
};

export const loadEmailTemplates = (): EmailTemplate[] => {
  try {
    const raw = localStorage.getItem(TEMPLATES_KEY);
    if (!raw) {
      saveEmailTemplates(initialEmailTemplates);
      return initialEmailTemplates;
    }
    return JSON.parse(raw);
  } catch (err) {
    return initialEmailTemplates;
  }
};

export const saveEmailTemplates = (templates: EmailTemplate[]): void => {
  try {
    localStorage.setItem(TEMPLATES_KEY, JSON.stringify(templates));
  } catch (err) {
    console.error('Error saving email templates', err);
  }
};

export const loadCabinetInfo = (): CabinetInfo => {
  try {
    const raw = localStorage.getItem(CABINET_KEY);
    if (!raw) {
      saveCabinetInfo(initialCabinetInfo);
      return initialCabinetInfo;
    }
    return JSON.parse(raw);
  } catch (err) {
    return initialCabinetInfo;
  }
};

export const saveCabinetInfo = (info: CabinetInfo): void => {
  try {
    localStorage.setItem(CABINET_KEY, JSON.stringify(info));
  } catch (err) {
    console.error('Error saving cabinet info', err);
  }
};

export const loadChatChannels = (): ChatChannel[] => {
  try {
    const raw = localStorage.getItem(CHANNELS_KEY);
    if (!raw) {
      saveChatChannels(initialChatChannels);
      return initialChatChannels;
    }
    return JSON.parse(raw);
  } catch (err) {
    console.error('Error loading chat channels', err);
    return initialChatChannels;
  }
};

export const saveChatChannels = (channels: ChatChannel[]): void => {
  try {
    localStorage.setItem(CHANNELS_KEY, JSON.stringify(channels));
  } catch (err) {
    console.error('Error saving chat channels', err);
  }
};

export const loadChatMessages = (): ChatMessage[] => {
  try {
    const raw = localStorage.getItem(MESSAGES_KEY);
    if (!raw) {
      saveChatMessages(initialChatMessages);
      return initialChatMessages;
    }
    return JSON.parse(raw);
  } catch (err) {
    console.error('Error loading chat messages', err);
    return initialChatMessages;
  }
};

export const saveChatMessages = (messages: ChatMessage[]): void => {
  try {
    localStorage.setItem(MESSAGES_KEY, JSON.stringify(messages));
  } catch (err) {
    console.error('Error saving chat messages', err);
  }
};

export const loadInsurancePartners = (): InsurancePartnerApiConfig[] => {
  try {
    const raw = localStorage.getItem(PARTNERS_KEY);
    if (!raw) {
      return [];
    }
    const parsed: InsurancePartnerApiConfig[] = JSON.parse(raw);
    // Filter out any leftover initial mock partners (e.g. partner-allianz, etc)
    const realPartners = parsed.filter(p => !p.id.startsWith('partner-'));
    if (realPartners.length !== parsed.length) {
      saveInsurancePartners(realPartners);
    }
    return realPartners;
  } catch (err) {
    console.error('Error loading insurance partners', err);
    return [];
  }
};

export const saveInsurancePartners = (partners: InsurancePartnerApiConfig[]): void => {
  try {
    localStorage.setItem(PARTNERS_KEY, JSON.stringify(partners));
  } catch (err) {
    console.error('Error saving insurance partners', err);
  }
};

export const generateQuoteReference = (productType?: string): string => {
  const randomNum = Math.floor(1000 + Math.random() * 9000);
  const year = new Date().getFullYear();
  const prefix = productType ? `DEV-${productType}` : 'DEV';
  return `${prefix}-${year}-${randomNum}`;
};
