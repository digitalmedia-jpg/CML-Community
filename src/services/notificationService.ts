import { 
  collection, 
  addDoc, 
  serverTimestamp, 
  getDocs, 
  query 
} from 'firebase/firestore';
import { db } from '../lib/firebase';

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
}

export const notificationService = {
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
      const { where } = await import('firebase/firestore');
      const q = query(collection(db, 'users'), where('role', 'in', ['Administrator', 'Manager', 'Audit']));
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
