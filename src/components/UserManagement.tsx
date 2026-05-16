import React, { useState, useEffect } from 'react';
import { 
  collection, 
  query, 
  onSnapshot, 
  doc, 
  updateDoc 
} from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from '../lib/firebase';
import { notificationService, NotificationType } from '../services/notificationService';
import { 
  Users, 
  Shield, 
  User as UserIcon, 
  Search,
  Check,
  ChevronDown,
  Plus,
  X as CloseIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { setDoc, serverTimestamp } from 'firebase/firestore';

interface UserProfile {
  id: string;
  displayName: string;
  email: string;
  role: string;
  photoURL?: string;
  createdAt: any;
}

const ROLES = ["Administrator", "Manager", "Staff", "Viewer"];

export const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [showAddUser, setShowAddUser] = useState(false);
  const [newUser, setNewUser] = useState({ email: '', role: 'Staff', displayName: '' });

  useEffect(() => {
    const q = query(collection(db, 'users'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const usersData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as UserProfile[];
      setUsers(usersData);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'users');
    });

    return () => unsubscribe();
  }, []);

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUser.email) return;

    try {
      // Use email as a temporary ID or if we can't get UID yet.
      // Actually, it's better to create a document with a predictable ID if possible, 
      // but since Firebase Auth uses UIDs, we'll store this as a "pre-authorized" user or just 
      // use a hashed email as doc ID if we want them to inherit it.
      // Most robust: use a collection like 'authorized_roles' or just add to 'users' with a flag.
      
      // Let's create a temporary ID based on email to ensure they get the role when they log in.
      // Note: App.tsx uses user.uid for doc ID. 
      // We'll add a 'pending' user or just search by email during sync in App.tsx.
      // Charles wants to "Add users and role".
      
      // For now, let's just add it to a 'users' collection using a random ID, 
      // and update App.tsx to check for existing email if user doc doesn't exist.
      
      const userRef = doc(collection(db, 'users'));
      await setDoc(userRef, {
        email: newUser.email,
        displayName: newUser.displayName || newUser.email.split('@')[0],
        role: newUser.role,
        createdAt: serverTimestamp(),
        isPending: true
      });

      setShowAddUser(false);
      setNewUser({ email: '', role: 'Staff', displayName: '' });
      notificationService.notifyUser(auth.currentUser?.uid || 'admin', {
        title: 'User Added',
        message: `Temporary profile created for ${newUser.email}`,
        type: NotificationType.SYSTEM,
        link: 'user-management'
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'users');
    }
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    setUpdatingId(userId);
    try {
      await updateDoc(doc(db, 'users', userId), {
        role: newRole
      });

      // Notify the user about their role change
      notificationService.notifyUser(userId, {
        title: 'Role Updated',
        message: `Your access level has been updated to: ${newRole}`,
        type: NotificationType.ROLE,
        link: 'profile'
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${userId}`);
    } finally {
      setUpdatingId(userId);
      setTimeout(() => setUpdatingId(null), 2000);
    }
  };

  const filteredUsers = users.filter(user => 
    user.displayName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-gold border-t-transparent animate-spin rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto py-4 md:py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8 md:mb-12 px-2 md:px-0">
        <div className="flex items-center gap-4">
           <div className="w-10 h-10 md:w-12 md:h-12 bg-luxury-black text-gold flex items-center justify-center shadow-lg">
              <Shield size={20} md:size={24} strokeWidth={1} />
           </div>
           <div>
              <h2 className="text-2xl md:text-3xl font-serif text-slate-900 italic leading-tight">User Control</h2>
              <p className="luxury-label opacity-60">Manage permissions & access</p>
           </div>
        </div>

        <div className="relative w-full md:w-auto flex flex-col md:flex-row gap-4">
          <div className="relative w-full md:w-80">
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search team members..."
              className="w-full bg-white border border-slate-100 pl-10 pr-4 py-3 md:py-2 text-xs font-serif italic focus:ring-1 focus:ring-gold/20 shadow-sm"
            />
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" />
          </div>
          <button 
            onClick={() => setShowAddUser(true)}
            className="bg-luxury-black text-white px-6 py-2 text-[10px] font-display uppercase tracking-widest font-black hover:bg-gold transition-all shadow-lg flex items-center justify-center gap-2 whitespace-nowrap"
          >
            <Plus size={14} /> Add Staff
          </button>
        </div>
      </div>

      <AnimatePresence>
        {showAddUser && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="mb-8 p-8 bg-white border-t-4 border-gold shadow-2xl relative mx-2 md:mx-0"
          >
            <button 
              onClick={() => setShowAddUser(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-900"
            >
              <CloseIcon size={18} />
            </button>
            <h3 className="text-xl font-serif italic text-slate-900 mb-6">Authorize New Staff Member</h3>
            <form onSubmit={handleAddUser} className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="luxury-label mb-2 block">Staff Email</label>
                <input 
                  type="email" 
                  required
                  value={newUser.email}
                  onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                  className="w-full bg-slate-50 border-none px-4 py-3 text-sm font-serif italic focus:ring-1 focus:ring-gold/50"
                  placeholder="email@example.com"
                />
              </div>
              <div>
                <label className="luxury-label mb-2 block">Full Name (Optional)</label>
                <input 
                  type="text" 
                  value={newUser.displayName}
                  onChange={(e) => setNewUser({...newUser, displayName: e.target.value})}
                  className="w-full bg-slate-50 border-none px-4 py-3 text-sm font-serif italic focus:ring-1 focus:ring-gold/50"
                  placeholder="e.g. Elena Vance"
                />
              </div>
              <div>
                <label className="luxury-label mb-2 block">Access Level</label>
                <select 
                  value={newUser.role}
                  onChange={(e) => setNewUser({...newUser, role: e.target.value})}
                  className="w-full bg-slate-50 border-none px-4 py-3 text-sm font-serif italic focus:ring-1 focus:ring-gold/50"
                >
                  {ROLES.map(role => (
                    <option key={role}>{role}</option>
                  ))}
                </select>
              </div>
              <div className="md:col-span-3 flex justify-end">
                <button 
                  type="submit"
                  className="bg-luxury-black text-white px-10 py-3 text-[10px] font-display uppercase tracking-widest font-black hover:bg-gold transition-all"
                >
                  Create Staff Record
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="luxury-card bg-white overflow-hidden shadow-xl mx-2 md:mx-0">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse min-w-[600px]">
            <thead>
              <tr className="border-b border-slate-50 bg-slate-50/50">
                <th className="p-4 md:p-6 luxury-label">User</th>
                <th className="p-4 md:p-6 luxury-label">Role</th>
                <th className="p-4 md:p-6 luxury-label">Email</th>
                <th className="p-4 md:p-6 luxury-label text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => (
                <motion.tr 
                  layout
                  key={user.id} 
                  className="border-b border-slate-50 hover:bg-slate-50/30 transition-colors"
                >
                  <td className="p-4 md:p-6">
                    <div className="flex items-center gap-3">
                      {user.photoURL ? (
                        <img src={user.photoURL} alt="" className="w-8 h-8 md:w-10 md:h-10 rounded-full border border-slate-100" />
                      ) : (
                        <div className="w-8 h-8 md:w-10 md:h-10 bg-luxury-cream text-gold flex items-center justify-center rounded-full border border-gold/10">
                          <UserIcon size={16} md:size={20} strokeWidth={1} />
                        </div>
                      )}
                      <div>
                        <p className="text-xs md:text-sm font-serif italic text-slate-900">{user.displayName || 'Anonymous User'}</p>
                        <p className="text-[8px] md:text-[10px] text-slate-400 font-display uppercase tracking-widest">{user.id.substring(0, 8)}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4 md:p-6">
                    <span className={cn(
                      "px-2 md:px-3 py-1 text-[8px] md:text-[9px] font-display uppercase tracking-widest font-black rounded-full",
                      user.role === 'Administrator' ? "bg-luxury-black text-white" :
                      user.role === 'Manager' ? "bg-gold text-white" :
                      "bg-luxury-cream text-gold"
                    )}>
                      {user.role}
                    </span>
                  </td>
                  <td className="p-4 md:p-6 font-serif italic text-[10px] md:text-xs text-slate-500 whitespace-nowrap">
                    {user.email}
                  </td>
                  <td className="p-4 md:p-6 text-right">
                    <div className="flex justify-end">
                      <div className="relative group">
                        <select
                          value={user.role}
                          onChange={(e) => handleRoleChange(user.id, e.target.value)}
                          disabled={updatingId === user.id}
                          className="appearance-none bg-white border border-slate-200 pl-3 md:pl-4 pr-8 md:pr-10 py-1.5 md:py-2 text-[9px] md:text-[10px] font-display uppercase tracking-widest font-black cursor-pointer hover:border-gold transition-all focus:ring-1 focus:ring-gold/30"
                        >
                          {ROLES.map(role => (
                            <option key={role} value={role}>{role}</option>
                          ))}
                        </select>
                        <div className="absolute right-2 md:right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 group-hover:text-gold transition-colors">
                          {updatingId === user.id ? (
                            <Check size={12} md:size={14} className="text-emerald-500 animate-pulse" />
                          ) : (
                            <ChevronDown size={12} md:size={14} />
                          )}
                        </div>
                      </div>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
      {filteredUsers.length === 0 && (
        <div className="luxury-card p-12 text-center bg-white mt-4 italic font-serif text-slate-400 mx-2 md:mx-0">
          No users match your search criteria.
        </div>
      )}
    </div>
  );
};
