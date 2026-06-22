import { 
  db,
  collection, 
  addDoc, 
  serverTimestamp, 
  getDocs, 
  query,
  where
} from '../lib/firebase';

export enum NotificationType {
  FORUM = 'forum',
  MAINTENANCE = 'maintenance',
  SYSTEM = 'system',
  ROLE = 'role',
  LOST_FOUND = 'lost-found'
}

export interface NotificationPayload {
  title: string;
  message: string;
  type: NotificationType;
  link?: string;
  badge?: string;
  icon?: string;
  vibrate?: number[];
  tag?: string;
}

export const notificationService = {
  /**
   * Verified Mobile/Desktop Service Worker Registration
   */
  async registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
    if (!('serviceWorker' in navigator)) {
      console.warn("Service worker is not supported on this device/browser.");
      return null;
    }
    try {
      // Register or verify the registration of /sw.js
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/'
      });
      console.log("Service Worker registered/verified successfully for Mobile Push Alerts:", registration);
      return registration;
    } catch (error) {
      console.error("Failed to register/verify Service Worker listener:", error);
      return null;
    }
  },

  /**
   * Play a clean, professional, and subtle synthesizer tone based on notification type
   */
  async playNotificationSound(type?: string | NotificationType) {
    try {
      // Use standard browser AudioContext
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;

      const ctx = new AudioCtx();
      
      // Resume if suspended due to browser autoplay policies
      if (ctx.state === 'suspended') {
        await ctx.resume().catch(() => {});
      }

      const playedTime = ctx.currentTime;

      // Helper to play a clean chime/beep with precise ADSR/decay volume envelope
      const playTone = (freq: number, startTime: number, duration: number, typeWave: OscillatorType = 'sine', volume = 0.08) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = typeWave;
        osc.frequency.setValueAtTime(freq, startTime);

        // Standard decay envelope for a smooth, high-quality, clicked-free chime
        gain.gain.setValueAtTime(0, startTime);
        gain.gain.linearRampToValueAtTime(volume, startTime + 0.015); // gentle fade-in
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration); // smooth decay

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(startTime);
        osc.stop(startTime + duration + 0.05);
      };

      // Match elegant sound signatures to distinct notification types
      const notificationType = type?.toLowerCase();
      switch (notificationType) {
        case NotificationType.MAINTENANCE:
          // Maintenance alert: Gentle, warm double warning sequence (reassuring, engineering tone)
          // 261.63Hz (Middle C) and 220Hz (A3) with a slightly warmer triangle-wave decay
          playTone(261.63, playedTime, 0.22, 'triangle', 0.06);
          playTone(220.00, playedTime + 0.15, 0.35, 'triangle', 0.05);
          break;

        case NotificationType.SYSTEM:
          // System alert: High, clear double ascending chime representing formal system alerts
          // 523.25Hz (C5) and 659.25Hz (E5)
          playTone(523.25, playedTime, 0.12, 'sine', 0.07);
          playTone(659.25, playedTime + 0.08, 0.22, 'sine', 0.07);
          break;

        case NotificationType.FORUM:
          // Forum notification: Quick, organic bubble chirp style sound for light social updates
          playTone(493.88, playedTime, 0.10, 'sine', 0.08);
          playTone(739.99, playedTime + 0.07, 0.15, 'sine', 0.06);
          break;

        case NotificationType.ROLE:
          // Role/Access alert: Ascending, stately major 3-note chord for administrative authority
          // 349.23Hz (F4), 440.00Hz (A4), 523.25Hz (C5)
          playTone(349.23, playedTime, 0.12, 'sine', 0.08);
          playTone(440.00, playedTime + 0.08, 0.12, 'sine', 0.08);
          playTone(523.25, playedTime + 0.16, 0.30, 'sine', 0.08);
          break;

        case NotificationType.LOST_FOUND:
          // Lost & Found: Warm, light, double bell chime
          playTone(392.00, playedTime, 0.18, 'sine', 0.08);
          playTone(587.33, playedTime + 0.12, 0.28, 'sine', 0.08);
          break;

        default:
          // Default: High-quality, subtle single chime
          playTone(440, playedTime, 0.18, 'sine', 0.08);
          break;
      }

      // Safeguard resource cleanup: close audio context after sounds terminate
      setTimeout(() => {
        ctx.close().catch(() => {});
      }, 1000);

    } catch (error) {
      console.warn("[AUDIO_PLAY_ERR] AudioContext blocked or not supported on this device:", error);
    }
  },

  /**
   * Helper to trigger standard mobile device pop-up alerts using Service Worker showNotification API
   */
  async triggerMobileNotification(title: string, message: string, options: Partial<NotificationPayload> = {}) {
    try {
      // Play professional, customized notification sound alerts with graceful error handling
      this.playNotificationSound(options.type).catch(err => {
        console.warn("[AUDIO] Notification audio playback was prevented or failed:", err);
      });

      const isMobileCompatibleOptions = {
        body: message,
        icon: options.icon || '/icon-192.png',
        badge: options.badge || '/icon-192.png',
        vibrate: options.vibrate || [100, 50, 100],
        tag: options.tag || 'cml-portal-notification',
        renotify: true,
        data: {
          url: options.link || '/'
        },
        actions: [
          { action: 'open', title: 'Open Portal' }
        ]
      };

      // Ensure permission is granted first
      if ('Notification' in window && Notification.permission === 'granted') {
        const registration = await this.registerServiceWorker();
        if (registration && 'showNotification' in registration) {
          await registration.showNotification(title, isMobileCompatibleOptions);
          console.log("Push notification showing via registered Service Worker");
        } else {
          // Fallback to standard window Notification
          const notif = new Notification(title, isMobileCompatibleOptions);
          notif.onclick = () => {
            window.focus();
            if (options.link) {
              window.location.href = options.link;
            }
          };
          console.log("Push notification showing via standard fallback");
        }
      } else {
        console.warn("Notification permissions not granted to trigger mobile pop-up alerts.");
      }
    } catch (e) {
      console.error("Error triggering mobile pop-up notification:", e);
    }
  },

  /**
   * Send a notification to a specific user
   */
  async notifyUser(userId: string, payload: NotificationPayload) {
    try {
      await addDoc(collection(db, 'users', userId, 'notifications'), {
        ...payload,
        read: false,
        createdAt: serverTimestamp()
      });
      // Also trigger a local push popup alert contextually
      await this.triggerMobileNotification(payload.title, payload.message, {
        link: payload.link,
        icon: payload.icon,
        badge: payload.badge,
        vibrate: payload.vibrate,
        tag: payload.tag,
        type: payload.type
      });
    } catch (error) {
      console.error('Error sending notification to user:', userId, error);
    }
  },

  /**
   * Broadcast a notification to all users
   * Note: In a large app, this should be a Cloud Function.
   * For this app, we'll fetch all users and iterate.
   */
  async broadcast(payload: NotificationPayload) {
    try {
      const usersSnapshot = await getDocs(collection(db, 'users'));
      const notificationPromises = usersSnapshot.docs.map(userDoc => 
        this.notifyUser(userDoc.id, payload)
      );
      await Promise.all(notificationPromises);
    } catch (error) {
      console.error('Error broadcasting notification:', error);
    }
  },

  /**
   * Notify only users with specific roles (Administrator, Manager, Audit)
   */
  async notifyManagement(payload: NotificationPayload, excludeUserId?: string) {
    try {
      const q = query(collection(db, 'users'), where('role', 'in', ['Administrator', 'Manager', 'Audit', 'Super Admin', 'Group Controller', 'GM']));
      const snapshot = await getDocs(q);
      const promises = snapshot.docs
        .filter(doc => doc.id !== excludeUserId)
        .map(doc => this.notifyUser(doc.id, payload));
      await Promise.all(promises);
    } catch (error) {
      console.error('Error notifying management:', error);
    }
  }
};
