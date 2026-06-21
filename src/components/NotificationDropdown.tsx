import React, { useState, useEffect } from 'react';
import { 
  db, 
  auth,
  collection, 
  query, 
  orderBy, 
  onSnapshot, 
  doc, 
  updateDoc, 
  deleteDoc,
  limit,
  writeBatch
} from '../lib/firebase';
import { 
  Bell, 
  X, 
  Check, 
  MessageSquare, 
  Shield, 
  Wrench, 
  AlertTriangle,
  Clock,
  Trash2,
  CheckCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '../lib/utils';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'forum' | 'maintenance' | 'system' | 'role';
  read: boolean;
  link?: string;
  createdAt: any;
}

interface NotificationDropdownProps {
  onNavigate: (tab: string) => void;
}

export const NotificationDropdown: React.FC<NotificationDropdownProps> = ({ onNavigate }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!auth.currentUser) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    const q = query(
      collection(db, 'users', auth.currentUser.uid, 'notifications'),
      orderBy('createdAt', 'desc'),
      limit(20)
    );

    let isInitial = true;
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const notifs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Notification[];
      setNotifications(notifs);
      setUnreadCount(notifs.filter(n => !n.read).length);

      if (!isInitial && snapshot && typeof snapshot.docChanges === 'function') {
        snapshot.docChanges().forEach((change) => {
          if (change.type === 'added') {
            const data = change.doc.data();
            import('../services/notificationService').then(({ notificationService }) => {
              notificationService.triggerMobileNotification(
                data.title || "CML Portal Notification",
                data.message || "New alert received.",
                {
                  link: data.link || "/",
                  icon: data.icon,
                  badge: data.badge,
                  tag: change.doc.id,
                  type: data.type
                }
              ).catch(err => console.warn("Failed to fire receiving push alert:", err));
            });
          }
        });
      }
      isInitial = false;
    }, (error) => {
      console.warn("Notification listener permission or fetch error:", error);
    });

    return () => unsubscribe();
  }, [auth.currentUser?.uid]);

  const markAsRead = async (id: string) => {
    if (!auth.currentUser) return;
    try {
      await updateDoc(doc(db, 'users', auth.currentUser.uid, 'notifications', id), {
        read: true
      });
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    if (!auth.currentUser || notifications.length === 0) return;
    const unread = notifications.filter(n => !n.read);
    if (unread.length === 0) return;

    try {
      const batch = writeBatch(db);
      unread.forEach(n => {
        const ref = doc(db, 'users', auth.currentUser!.uid, 'notifications', n.id);
        batch.update(ref, { read: true });
      });
      await batch.commit();
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const deleteNotification = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!auth.currentUser) return;
    try {
      await deleteDoc(doc(db, 'users', auth.currentUser.uid, 'notifications', id));
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const clearAll = async () => {
    if (!auth.currentUser || notifications.length === 0) return;
    try {
      const batch = writeBatch(db);
      notifications.forEach(n => {
        const ref = doc(db, 'users', auth.currentUser!.uid, 'notifications', n.id);
        batch.delete(ref);
      });
      await batch.commit();
    } catch (error) {
      console.error('Error clearing all notifications:', error);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'forum': return <MessageSquare size={16} className="text-gold" />;
      case 'role': return <Shield size={16} className="text-gold" />;
      case 'maintenance': return <Wrench size={16} className="text-amber-500" />;
      default: return <Bell size={16} className="text-gold" />;
    }
  };

  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "w-10 h-10 md:w-12 md:h-12 flex items-center justify-center rounded-full transition-all relative border",
          isOpen ? "border-gold bg-gold/5 shadow-lg" : "border-gold/20 hover:border-gold hover:bg-luxury-cream text-slate-400 hover:text-gold"
        )}
      >
        <Bell size={18} className={cn(unreadCount > 0 && "animate-bounce-slow")} />
        {unreadCount > 0 && (
          <span className="absolute top-2 right-2 w-4 h-4 bg-red-500 text-white text-[9px] font-black flex items-center justify-center rounded-full border-2 border-white">
            {unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="absolute right-0 mt-4 w-[320px] md:w-[400px] bg-white border border-gold/10 shadow-2xl z-50 flex flex-col max-h-[500px]"
            >
              <div className="p-4 border-b border-slate-50 flex items-center justify-between bg-slate-50/30">
                <div className="flex items-center gap-2">
                  <h4 className="text-xs font-display uppercase tracking-widest font-black text-slate-800">Alert Center</h4>
                  {unreadCount > 0 && (
                    <span className="bg-gold text-white text-[8px] px-1.5 py-0.5 font-bold">{unreadCount} New</span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={markAllAsRead}
                    title="Mark all as read"
                    className="p-1.5 text-slate-400 hover:text-gold transition-colors"
                  >
                    <CheckCheck size={14} />
                  </button>
                  <button 
                    onClick={clearAll}
                    title="Clear all"
                    className="p-1.5 text-slate-400 hover:text-red-500 transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto custom-scrollbar">
                {notifications.length === 0 ? (
                  <div className="p-12 text-center">
                    <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-200">
                      <Bell size={24} />
                    </div>
                    <p className="text-xs font-serif italic text-slate-400 underline decoration-gold/20">No active alerts recorded.</p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-50">
                    {notifications.map((notif) => (
                      <div 
                        key={notif.id}
                        onClick={() => {
                          if (!notif.read) markAsRead(notif.id);
                          if (notif.link) onNavigate(notif.link);
                          setIsOpen(false);
                        }}
                        className={cn(
                          "p-4 flex gap-4 cursor-pointer transition-all hover:bg-luxury-cream/30 relative group",
                          !notif.read && "bg-gold/[0.02]"
                        )}
                      >
                        {!notif.read && (
                          <div className="absolute left-0 top-0 bottom-0 w-1 bg-gold" />
                        )}
                        <div className="shrink-0 pt-1">
                          <div className="w-8 h-8 bg-white border border-slate-100 flex items-center justify-center shadow-sm">
                            {getIcon(notif.type)}
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <h5 className={cn(
                              "text-[11px] font-serif transition-colors truncate pr-4",
                              notif.read ? "text-slate-500" : "text-slate-900 font-bold"
                            )}>
                              {notif.title}
                            </h5>
                            <span className="text-[9px] text-slate-400 italic shrink-0">
                              {notif.createdAt ? (notif.createdAt.toDate ? formatDistanceToNow(notif.createdAt.toDate(), { addSuffix: false }) : new Date(notif.createdAt).toLocaleDateString()) : 'now'}
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-500 font-serif italic leading-relaxed line-clamp-2">
                            {notif.message}
                          </p>
                        </div>
                        <button 
                          onClick={(e) => deleteNotification(e, notif.id)}
                          className="opacity-0 group-hover:opacity-100 p-1 text-slate-300 hover:text-red-500 transition-all self-center"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="p-4 bg-luxury-black text-[8px] font-display uppercase tracking-[0.3em] text-white/30 text-center">
                Real-time Community Radar active
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};
