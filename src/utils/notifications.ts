// Helper utility for Browser & Windows Desktop Popup Notifications

export const isNotificationSupported = (): boolean => {
  return typeof window !== 'undefined' && 'Notification' in window;
};

export const isInIframe = (): boolean => {
  if (typeof window === 'undefined') return false;
  try {
    return window.self !== window.top;
  } catch (e) {
    return true;
  }
};

export const playNotificationSound = () => {
  if (typeof window === 'undefined') return;
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    
    // Create a pleasant double-chime sound (587.33Hz D5 -> 880Hz A5)
    const playNote = (freq: number, startTime: number, duration: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, startTime);
      gain.gain.setValueAtTime(0.15, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(startTime);
      osc.stop(startTime + duration);
    };

    const now = ctx.currentTime;
    playNote(587.33, now, 0.2);
    playNote(880, now + 0.15, 0.4);
  } catch (e) {
    console.warn('Could not play audio notification chime:', e);
  }
};

export const getNotificationPermission = (): NotificationPermission => {
  if (!isNotificationSupported()) return 'denied';
  return Notification.permission;
};

export const requestNotificationPermission = async (): Promise<NotificationPermission> => {
  if (!isNotificationSupported()) {
    alert("Les notifications de bureau ne sont pas supportées par votre navigateur.");
    return 'denied';
  }

  // Handle request permission with fallback for older browsers and promises
  try {
    let perm: NotificationPermission = Notification.permission;
    
    if (Notification.requestPermission.length === 0) {
      perm = await Notification.requestPermission();
    } else {
      perm = await new Promise((resolve) => {
        Notification.requestPermission(resolve);
      });
    }

    if (perm === 'granted') {
      playNotificationSound();
      sendWindowsDesktopNotification('🔔 Notifications CRM Actives', {
        body: 'Vous recevrez désormais les rappels clients sous forme de popup Windows en arrière-plan !',
        icon: 'https://cdn-icons-png.flaticon.com/512/1827/1827504.png',
        tag: 'welcome-notification'
      });
    }
    return perm;
  } catch (err) {
    console.error('Erreur lors de la demande de permission de notification:', err);
    return Notification.permission || 'denied';
  }
};

export interface DesktopNotificationOptions {
  body?: string;
  icon?: string;
  tag?: string;
  data?: any;
  onClickUrl?: string;
}

export const sendWindowsDesktopNotification = (
  title: string,
  options: DesktopNotificationOptions = {}
): Notification | null => {
  if (!isNotificationSupported()) return null;

  if (Notification.permission !== 'granted') {
    return null;
  }

  try {
    const notifOptions: NotificationOptions = {
      body: options.body || '',
      icon: options.icon || 'https://cdn-icons-png.flaticon.com/512/1827/1827504.png',
      badge: 'https://cdn-icons-png.flaticon.com/512/1827/1827504.png',
      tag: options.tag || `crm-notif-${Date.now()}`,
      data: options.data,
      requireInteraction: true, // Keep Windows notification active until user clicks or dismisses
      silent: false
    };

    const notification = new Notification(title, notifOptions);

    notification.onclick = (event) => {
      event.preventDefault();
      if (typeof window !== 'undefined') {
        window.focus();
      }
      notification.close();
    };

    return notification;
  } catch (err) {
    console.error('Erreur lors de l\'envoi de la notification Windows:', err);
    return null;
  }
};

// Set to keep track of notified reminder IDs to avoid duplicate popups in the same session
const notifiedReminderKeys = new Set<string>();

export const checkAndNotifyReminders = (leads: any[]) => {
  const todayStr = new Date().toISOString().split('T')[0];

  leads.forEach((lead) => {
    if (!lead.prochaineActionDate) return;
    if (lead.status === 'GAGNE' || lead.status === 'PERDU') return;

    const actionDate = lead.prochaineActionDate;
    const actionHeure = lead.prochaineActionHeure || '';
    const key = `${lead.id}-${actionDate}-${actionHeure}-${lead.prochaineActionIntitule || ''}`;

    if (notifiedReminderKeys.has(key)) {
      return; // Already notified
    }

    const isToday = actionDate === todayStr;
    const isOverdue = actionDate < todayStr;

    // Trigger notification if action is due today or overdue
    if (isToday || isOverdue) {
      notifiedReminderKeys.add(key);

      // Always play audio sound chime
      playNotificationSound();

      // Trigger Windows popup if notification permission is granted
      if (isNotificationSupported() && Notification.permission === 'granted') {
        const title = isOverdue
          ? `🚨 Rappel Client En Retard : ${lead.prenom} ${lead.nom}`
          : `📅 Rappel Client Imminent : ${lead.prenom} ${lead.nom}`;

        const actionText = lead.prochaineActionIntitule
          ? `Action : ${lead.prochaineActionIntitule}`
          : 'Rappel téléphonique prévu';

        const contactInfo = lead.telephone ? `📞 ${lead.telephone}` : `✉️ ${lead.email}`;

        sendWindowsDesktopNotification(title, {
          body: `${actionText}\nProduit: ${lead.type} | ${contactInfo}\nHeure : ${actionHeure || 'Aujourd\'hui'}`,
          tag: `reminder-${lead.id}`,
          icon: 'https://cdn-icons-png.flaticon.com/512/3602/3602145.png'
        });
      }
    }
  });
};

