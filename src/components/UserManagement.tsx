import { ConfirmModal } from "./ConfirmModal";
import React, { useState, useEffect } from 'react';
import { 
  db, 
  auth, 
  handleFirestoreError, 
  OperationType,
  collection, 
  query, 
  orderBy, 
  onSnapshot, 
  doc, 
  updateDoc,
  setDoc, 
  serverTimestamp, 
  deleteDoc
} from '../lib/firebase';
import { notificationService, NotificationType } from '../services/notificationService';
import { 
  Users, 
  Shield, 
  User as UserIcon, 
  Search,
  Check,
  ChevronDown,
  Plus,
  X as CloseIcon,
  Trash2,
  Mail,
  MoreVertical,
  Clock,
  MapPin,
  Lock,
  Sliders,
  Timer,
  ShieldAlert,
  RefreshCw,
  Info,
  Calendar
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';


interface UserProfile {
  id: string;
  displayName: string;
  email: string;
  role: string;
  photoURL?: string;
  createdAt: any;
  lastLogin?: any;
  lastActiveTab?: string;
  isPending?: boolean;
  loginCount?: number;
}

const ROLES = ["Group Controller", "Administrator", "Super Admin", "Manager", "Staff", "Viewer", "Audit"];

const DEPARTMENTS = [
  "Front Office",
  "Housekeeping",
  "Food & Beverage",
  "Sales & Marketing",
  "Engineering",
  "Human Resources",
  "Finance & Accounts",
  "Administration",
  "IT Support",
  "Digital Media",
  "Operations",
  "Customer Service"
];

export const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [showAddUser, setShowAddUser] = useState(false);
  const [newUser, setNewUser] = useState({ email: '', role: 'Staff', displayName: '' });

  const [activeSubTab, setActiveSubTab] = useState<'users' | 'logs' | 'workflow'>('users');
  const [loginLogs, setLoginLogs] = useState<any[]>([]);
  const [deleteUserTarget, setDeleteUserTarget] = useState<{ id: string; email: string } | null>(null);

  const [selectedApproverEmails, setSelectedApproverEmails] = useState<string[]>([]);
  const [strictGeofenceDepartments, setStrictGeofenceDepartments] = useState<{ [key: string]: boolean }>({});
  const [roleGracePeriods, setRoleGracePeriods] = useState<{ [key: string]: number }>({});
  const [savingWorkflow, setSavingWorkflow] = useState(false);
  const [successWorkflow, setSuccessWorkflow] = useState(false);

  const [delegations, setDelegations] = useState<any[]>([]);
  const [delegationFromEmail, setDelegationFromEmail] = useState('');
  const [delegationToEmail, setDelegationToEmail] = useState('');
  const [delegationStartDate, setDelegationStartDate] = useState('');
  const [delegationEndDate, setDelegationEndDate] = useState('');

  useEffect(() => {
    const q = query(collection(db, 'users'), orderBy('createdAt', 'desc'));
    
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

    // Logs listener
    const logsQ = query(collection(db, 'login_logs'), orderBy('timestamp', 'desc'));
    const unsubscribeLogs = onSnapshot(logsQ, (snapshot) => {
      setLoginLogs(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    // Workflow config listener
    const unsubscribeConfig = onSnapshot(doc(db, "workflow-configs", "global"), (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        if (data.approverEmails) {
          setSelectedApproverEmails(data.approverEmails);
        }
        if (data.strictGeofenceDepartments) {
          setStrictGeofenceDepartments(data.strictGeofenceDepartments);
        }
        if (data.roleGracePeriods) {
          setRoleGracePeriods(data.roleGracePeriods);
        }
        if (data.delegations) {
          setDelegations(data.delegations);
        }
      }
    }, (error) => {
      console.error("Failed to load workflow-configs:", error);
    });

    return () => {
      unsubscribe();
      unsubscribeLogs();
      unsubscribeConfig();
    };
  }, []);

  const handleSaveWorkflow = async () => {
    setSavingWorkflow(true);
    setSuccessWorkflow(false);
    try {
      const selectedNames = users
        .filter(u => selectedApproverEmails.includes(u.email))
        .map(u => u.displayName || u.email.split('@')[0]);

      await setDoc(doc(db, "workflow-configs", "global"), {
        approverEmails: selectedApproverEmails,
        approverNames: selectedNames,
        strictGeofenceDepartments,
        roleGracePeriods,
        delegations: delegations,
        updatedAt: serverTimestamp(),
        updatedBy: auth.currentUser?.email || "unknown"
      });

      setSuccessWorkflow(true);
      setTimeout(() => setSuccessWorkflow(false), 2000);

      notificationService.notifyManagement({
        title: "🔄 Workflow Config Updated",
        message: `SuperAdmin configured the Default Approvers, Geofence Enforcement, exception Grace Periods, and approval Delegations.`,
        type: NotificationType.SYSTEM,
        link: "user-management"
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, "workflow-configs/global");
    } finally {
      setSavingWorkflow(false);
    }
  };

  const getDelegationStatus = (startDate: string, endDate: string) => {
    const today = new Date();
    today.setHours(0,0,0,0);
    const start = new Date(startDate);
    start.setHours(0,0,0,0);
    const end = new Date(endDate);
    end.setHours(0,0,0,0);

    if (today > end) return "Expired";
    if (today < start) return "Prescheduled";
    return "Active";
  };

  const handleAddDelegation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!delegationFromEmail || !delegationToEmail || !delegationStartDate || !delegationEndDate) {
      alert("Please configure Assigning Manager, Delegate Substitute, and fully complete the Start and End dates.");
      return;
    }
    if (delegationFromEmail === delegationToEmail) {
      alert("Assigning Supervisor and Delegate Substitute must be different staff members.");
      return;
    }
    const newDelItem = {
      id: Math.random().toString(36).substring(2, 9),
      fromUserEmail: delegationFromEmail,
      toUserEmail: delegationToEmail,
      startDate: delegationStartDate,
      endDate: delegationEndDate,
      createdAt: new Date().toISOString()
    };
    
    const updated = [...delegations, newDelItem];
    setDelegations(updated);

    try {
      const selectedNames = users
        .filter(u => selectedApproverEmails.includes(u.email))
        .map(u => u.displayName || u.email.split('@')[0]);

      await setDoc(doc(db, "workflow-configs", "global"), {
        approverEmails: selectedApproverEmails,
        approverNames: selectedNames,
        strictGeofenceDepartments,
        roleGracePeriods,
        delegations: updated,
        updatedAt: serverTimestamp(),
        updatedBy: auth.currentUser?.email || "unknown"
      });

      // Reset inputs
      setDelegationFromEmail("");
      setDelegationToEmail("");
      setDelegationStartDate("");
      setDelegationEndDate("");

      notificationService.notifyManagement({
        title: "🔑 Approval Authority Delegated",
        message: `Temporarily assigned the approval authority of ${delegationFromEmail} to ${delegationToEmail}.`,
        type: NotificationType.SYSTEM,
        link: "user-management"
      });
    } catch (err) {
      console.error("Failed to save delegation in DB:", err);
      alert("Failed to save delegation in database.");
    }
  };

  const handleRevokeDelegation = async (id: string) => {
    const updated = delegations.filter(d => d.id !== id);
    setDelegations(updated);

    try {
      const selectedNames = users
        .filter(u => selectedApproverEmails.includes(u.email))
        .map(u => u.displayName || u.email.split('@')[0]);

      await setDoc(doc(db, "workflow-configs", "global"), {
        approverEmails: selectedApproverEmails,
        approverNames: selectedNames,
        strictGeofenceDepartments,
        roleGracePeriods,
        delegations: updated,
        updatedAt: serverTimestamp(),
        updatedBy: auth.currentUser?.email || "unknown"
      });
    } catch (err) {
      console.error("Failed to revoke delegation in DB:", err);
      alert("Failed to save updated delegations list.");
    }
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUser.email) return;

    try {
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
        title: 'New Member Pre-Authorized',
        message: `${newUser.email} has been given ${newUser.role} access upon next login.`,
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

      notificationService.notifyUser(userId, {
        title: 'Access Level Modified',
        message: `An administrator has updated your role to: ${newRole}`,
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

  const handleDeleteUserConfirm = async () => {
    if (!deleteUserTarget) return;
    try {
      await deleteDoc(doc(db, 'users', deleteUserTarget.id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `users/${deleteUserTarget.id}`);
    } finally {
      setDeleteUserTarget(null);
    }
  };

  const filteredUsers = users.filter(user => 
    user.displayName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'Group Controller': return 'bg-gold text-white px-3 ring-2 ring-luxury-black shadow-lg';
      case 'Super Admin': return 'bg-red-700 text-white px-3 ring-2 ring-gold/40 shadow-md font-bold';
      case 'Administrator': return 'bg-luxury-black text-white px-3 ring-1 ring-gold/30';
      case 'Manager': return 'bg-gold text-white px-3';
      case 'Audit': return 'bg-slate-800 text-slate-100 px-3';
      case 'Staff': return 'bg-luxury-cream text-gold px-3 border border-gold/10';
      default: return 'bg-slate-50 text-slate-400 px-3 border border-slate-100';
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4">
        <div className="w-10 h-10 border-2 border-gold border-t-transparent animate-spin rounded-sm shadow-lg shadow-gold/20"></div>
        <p className="text-[10px] font-display uppercase tracking-[0.3em] text-slate-400 font-bold">Synchronizing Command Center</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto py-8 lg:py-12 animate-in fade-in duration-700">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-8 mb-12 px-4 lg:px-0">
        <div className="space-y-4">
           <div className="flex items-center gap-3">
              <div className="px-2 py-1 bg-gold/10 border border-gold/20 rounded-sm">
                <p className="text-[8px] font-display uppercase tracking-widest text-gold font-black">Admin Module_02</p>
              </div>
              <div className="flex bg-slate-100 p-0.5 rounded-sm">
                <button 
                  onClick={() => setActiveSubTab('users')}
                  className={cn(
                    "px-4 py-1 text-[8px] font-display uppercase tracking-widest font-black transition-all",
                    activeSubTab === 'users' ? "bg-white text-gold shadow-sm" : "text-slate-400 hover:text-slate-600"
                  )}
                >
                  Members
                </button>
                <button 
                  onClick={() => setActiveSubTab('logs')}
                  className={cn(
                    "px-4 py-1 text-[8px] font-display uppercase tracking-widest font-black transition-all",
                    activeSubTab === 'logs' ? "bg-white text-gold shadow-sm" : "text-slate-400 hover:text-slate-600"
                  )}
                >
                  Login Logs
                </button>
                <button 
                  onClick={() => setActiveSubTab('workflow')}
                  className={cn(
                    "px-4 py-1 text-[8px] font-display uppercase tracking-widest font-black transition-all",
                    activeSubTab === 'workflow' ? "bg-white text-gold shadow-sm" : "text-slate-400 hover:text-slate-600"
                  )}
                >
                  Workflow Config
                </button>
              </div>
           </div>
           <div>
              <h2 className="text-4xl font-serif text-slate-900 italic font-light tracking-tight leading-none mb-3">Identity & Access</h2>
              <p className="luxury-label opacity-40">Governing member status and system permissions across the CML network</p>
           </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-4 w-full lg:w-auto">
          <div className="relative w-full sm:w-72 group">
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter identity records..."
              className="w-full bg-white border border-slate-100 pl-10 pr-4 py-3 text-xs font-serif italic focus:border-gold/30 transition-all shadow-sm outline-none"
            />
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-gold transition-colors" />
          </div>
          <button 
            onClick={() => setShowAddUser(true)}
            className="w-full sm:w-auto bg-luxury-black text-white px-8 py-3 text-[10px] font-display uppercase tracking-[0.2em] font-black hover:bg-gold transition-all shadow-xl shadow-luxury-black/10 flex items-center justify-center gap-3 whitespace-nowrap active:scale-[0.98]"
          >
            <Plus size={14} /> Authorize Member
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {activeSubTab === 'users' ? (
          <motion.div
            key="users-tab"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
          >
            <AnimatePresence>
              {showAddUser && (
                <motion.div 
                  initial={{ opacity: 0, y: -20, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -20, scale: 0.98 }}
                  className="mb-12 p-10 bg-white border border-slate-100 shadow-[0_32px_64px_-12px_rgba(0,0,0,0.1)] relative mx-4 lg:mx-0 overflow-hidden"
                >
                  <div className="absolute top-0 right-0 w-24 h-24 pointer-events-none opacity-5">
                    <Shield size={96} className="text-gold" />
                  </div>
                  
                  <button 
                    onClick={() => setShowAddUser(false)}
                    className="absolute top-6 right-6 text-slate-400 hover:text-slate-900 transition-colors p-2"
                  >
                    <CloseIcon size={20} />
                  </button>
                  
                  <div className="mb-8">
                    <h3 className="text-2xl font-serif italic text-slate-900 leading-none mb-2">Member Pre-Authentication</h3>
                    <p className="text-[10px] font-display uppercase tracking-widest text-slate-400">Establish role before identity verification</p>
                  </div>

                  <form onSubmit={handleAddUser} className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                    <div className="lg:col-span-1">
                      <label className="text-[9px] font-display uppercase tracking-widest text-gold font-black opacity-80 mb-3 block pl-1">Target Account</label>
                      <div className="relative group">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-gold transition-colors" size={14} />
                        <input 
                          type="email" 
                          required
                          value={newUser.email}
                          onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                          className="w-full bg-slate-50 border-none pl-12 pr-4 py-4 text-sm font-serif italic focus:ring-1 focus:ring-gold/30 outline-none transition-all"
                          placeholder="email@example.com"
                        />
                      </div>
                    </div>
                    <div className="lg:col-span-1">
                      <label className="text-[9px] font-display uppercase tracking-widest text-gold font-black opacity-80 mb-3 block pl-1">Primary Alias (Optional)</label>
                      <div className="relative group">
                        <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-gold transition-colors" size={14} />
                        <input 
                          type="text" 
                          value={newUser.displayName}
                          onChange={(e) => setNewUser({...newUser, displayName: e.target.value})}
                          className="w-full bg-slate-50 border-none pl-12 pr-4 py-4 text-sm font-serif italic focus:ring-1 focus:ring-gold/30 outline-none transition-all"
                          placeholder="e.g. Elena Vance"
                        />
                      </div>
                    </div>
                    <div className="lg:col-span-1">
                      <label className="text-[9px] font-display uppercase tracking-widest text-gold font-black opacity-80 mb-3 block pl-1">Initial Clearance</label>
                      <div className="relative group">
                        <Shield className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-gold transition-colors" size={14} />
                        <select 
                          value={newUser.role}
                          onChange={(e) => setNewUser({...newUser, role: e.target.value})}
                          className="w-full appearance-none bg-slate-50 border-none pl-12 pr-10 py-4 text-[10px] font-display uppercase tracking-widest font-black focus:ring-1 focus:ring-gold/30 outline-none transition-all cursor-pointer"
                        >
                          {ROLES.map(role => (
                            <option key={role}>{role}</option>
                          ))}
                        </select>
                        <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none" />
                      </div>
                    </div>
                    <div className="lg:col-span-1 flex items-end">
                      <button 
                        type="submit"
                        className="w-full bg-gold text-white px-6 py-4 text-[11px] font-display uppercase tracking-widest font-black hover:bg-gold-dark transition-all shadow-lg active:scale-95"
                      >
                        Verify member
                      </button>
                    </div>
                  </form>
                </motion.div>
              )}
            </AnimatePresence>
            

            <div className="bg-white border border-slate-100 shadow-[0_8px_32px_rgba(0,0,0,0.04)] mx-4 lg:mx-0 overflow-hidden">
              <div className="overflow-x-auto custom-scrollbar">
                <table className="w-full text-left border-collapse min-w-[800px]">
                  <thead>
                    <tr className="border-b border-slate-50 bg-slate-50/30">
                      <th className="px-8 py-7 text-[10px] font-display uppercase tracking-[0.2em] text-slate-400 font-bold">Identity</th>
                      <th className="px-8 py-7 text-[10px] font-display uppercase tracking-[0.2em] text-slate-400 font-bold">Clearance Level</th>
                      <th className="px-8 py-7 text-[10px] font-display uppercase tracking-[0.2em] text-slate-400 font-bold">Status</th>
                      <th className="px-8 py-7 text-[10px] font-display uppercase tracking-[0.2em] text-slate-400 font-bold">Activity Log</th>
                      <th className="px-8 py-7 text-[10px] font-display uppercase tracking-[0.2em] text-slate-400 font-bold text-right">System Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((user) => (
                      <motion.tr 
                        layout
                        key={user.id} 
                        className="border-b border-slate-50 group hover:bg-slate-50/50 transition-colors"
                      >
                        <td className="px-8 py-6">
                          <div className="flex items-center gap-4">
                            <div className="relative">
                              {user.photoURL ? (
                                <img src={user.photoURL} alt="" className="w-11 h-11 rounded-sm object-cover border border-slate-100 shadow-sm" />
                              ) : (
                                <div className="w-11 h-11 bg-luxury-cream text-gold flex items-center justify-center rounded-sm border border-gold/10">
                                  <UserIcon size={20} strokeWidth={1} />
                                </div>
                              )}
                              {user.isPending && (
                                <div className="absolute -top-1 -right-1 w-3 h-3 bg-gold border-2 border-white rounded-full animate-pulse" />
                              )}
                            </div>
                            <div>
                              <p className="text-sm font-serif italic text-slate-900 leading-tight mb-0.5">{user.displayName || 'Unnamed User'}</p>
                              <p className="text-[9px] text-slate-400 font-display uppercase tracking-widest font-bold">Ref: {user.id.substring(0, 8)}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-8 py-6">
                          <span className={cn(
                            "px-3 py-1.5 text-[9px] font-display uppercase tracking-widest font-black rounded-sm transition-all duration-300",
                            getRoleBadgeColor(user.role)
                          )}>
                            {user.role}
                          </span>
                        </td>
                        <td className="px-8 py-6">
                          <div className="flex flex-col gap-1.5">
                            <div className="flex items-center gap-2">
                              <div className={cn("w-1.5 h-1.5 rounded-full", user.isPending ? "bg-amber-400" : "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]")} />
                              <span className="text-[9px] font-display uppercase tracking-widest text-slate-500 font-bold">
                                {user.isPending ? "Awaiting Login" : "Verified Identity"}
                              </span>
                              {user.loginCount !== undefined && (
                                <div className="px-1.5 py-0.5 bg-slate-100 rounded-full">
                                   <p className="text-[7px] font-display font-black text-slate-400">{user.loginCount} Logins</p>
                                </div>
                              )}
                            </div>
                            <div className="flex items-center gap-2 pl-3.5">
                              <Mail size={10} className="text-slate-300" />
                              <p className="font-serif italic text-[10px] text-slate-400 truncate max-w-[150px]">{user.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-8 py-6">
                          <div className="space-y-1.5">
                            <div className="flex items-center gap-2">
                              <Clock size={12} className="text-slate-300" />
                              <p className="text-[10px] text-slate-500 font-display uppercase tracking-widest">
                                {user.lastLogin ? new Date(user.lastLogin.seconds * 1000).toLocaleString('en-US', { 
                                  month: 'short', 
                                  day: 'numeric', 
                                  hour: '2-digit', 
                                  minute: '2-digit' 
                                }).toUpperCase() : 'NEVER'}
                              </p>
                            </div>
                            {user.lastActiveTab && (
                              <div className="flex items-center gap-2">
                                <Search size={12} className="text-gold/50" />
                                <p className="text-[9px] text-gold font-display uppercase tracking-widest font-bold">
                                  Focus: {user.lastActiveTab.replace(/-/g, ' ')}
                                </p>
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-8 py-6 text-right">
                          <div className="flex items-center justify-end gap-3 transition-all duration-300 transform translate-x-0">
                            <div className="relative">
                              <p className="text-[7px] font-display uppercase tracking-widest text-gold font-black mb-1 text-left opacity-60">Modify Level</p>
                              <select
                                value={user.role}
                                onChange={(e) => handleRoleChange(user.id, e.target.value)}
                                disabled={updatingId === user.id}
                                className="appearance-none bg-white border border-slate-200 pl-4 pr-10 py-2.5 text-[9px] font-display uppercase tracking-widest font-black cursor-pointer hover:border-gold transition-all outline-none shadow-sm"
                              >
                                {ROLES.map(role => (
                                  <option key={role} value={role}>{role}</option>
                                ))}
                              </select>
                              <ChevronDown size={12} className="absolute right-3 bottom-3 text-slate-300 pointer-events-none" />
                              {updatingId === user.id && (
                                <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
                                  <Check size={14} className="text-emerald-500" />
                                </div>
                              )}
                            </div>
                            
                            <button 
                              onClick={() => {
                                if (user.id === auth.currentUser?.uid) {
                                  alert("You cannot revoke your own access.");
                                  return;
                                }
                                setDeleteUserTarget({ id: user.id, email: user.email });
                              }}
                              className="p-2.5 text-slate-300 hover:text-red-500 hover:bg-red-50 transition-all rounded-sm self-end mb-0.5"
                              title="Revoke All Access"
                            >
                              <Trash2 size={16} strokeWidth={1.5} />
                            </button>
                          </div>

                          {/* Mobile visible action */}
                          <div className="lg:hidden">
                             <MoreVertical size={16} className="text-slate-300" />
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        ) : activeSubTab === 'logs' ? (
          <motion.div
            key="logs-tab"
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            className="bg-white border border-slate-100 shadow-sm overflow-hidden"
          >
             <div className="overflow-x-auto">
               <table className="w-full text-left">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100">
                      <th className="px-8 py-5 text-[10px] font-display uppercase tracking-widest text-slate-400 font-bold">User</th>
                      <th className="px-8 py-5 text-[10px] font-display uppercase tracking-widest text-slate-400 font-bold">Timestamp</th>
                      <th className="px-8 py-5 text-[10px] font-display uppercase tracking-widest text-slate-400 font-bold">Property Source</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loginLogs.map((log) => (
                      <tr key={log.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                        <td className="px-8 py-4">
                           <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-sm bg-gold/10 flex items-center justify-center text-gold text-[10px] font-black">
                                 {log.displayName?.[0] || 'U'}
                              </div>
                              <div>
                                 <p className="text-sm font-serif italic text-slate-900">{log.displayName}</p>
                                 <p className="text-[9px] text-slate-400">{log.email}</p>
                              </div>
                           </div>
                        </td>
                        <td className="px-8 py-4">
                           <div className="flex items-center gap-2">
                              <Clock size={12} className="text-slate-300" />
                              <p className="text-[10px] text-slate-500 font-display tracking-widest uppercase">
                                 {log.timestamp?.toDate ? new Date(log.timestamp.toDate()).toLocaleString() : 'Just now'}
                              </p>
                           </div>
                        </td>
                        <td className="px-8 py-4">
                           <span className="px-2 py-1 bg-slate-100 text-slate-500 text-[8px] font-display uppercase tracking-widest font-black rounded-sm border border-slate-200">
                              {log.propertyId?.toUpperCase()}
                           </span>
                        </td>
                      </tr>
                    ))}
                    {loginLogs.length === 0 && (
                      <tr>
                        <td colSpan={3} className="px-8 py-12 text-center text-slate-400 italic font-serif">No login records found</td>
                      </tr>
                    )}
                  </tbody>
               </table>
             </div>
          </motion.div>
        ) : activeSubTab === 'workflow' ? (
          <motion.div
            key="workflow-tab"
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            className="space-y-8 px-4 lg:px-0"
          >
            {/* Main configuration pane inside a gorgeous luxury bento-style design */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Workplace Premises Policy Card */}
              <div className="bg-white border border-slate-100 shadow-[0_8px_32px_rgba(0,0,0,0.03)] p-8">
                <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-50">
                  <div className="p-2 bg-[#b2a265]/10 text-[#b2a265] rounded-sm">
                    <MapPin size={18} />
                  </div>
                  <div>
                    <h3 className="text-lg font-serif italic text-slate-900 leading-none mb-1">Workplace Premises Policy</h3>
                    <p className="text-[9px] font-display uppercase tracking-widest text-[#b2a265]">Lock or relax secure location-based clock-in policies</p>
                  </div>
                </div>

                <p className="text-[11px] text-slate-500 font-serif italic mb-6 leading-relaxed">
                  When active, staff must satisfy standard environment validation. Disabling allows relaxed, remote authorization for that department.
                </p>

                <div className="space-y-3.5 max-h-[380px] overflow-y-auto pr-2 custom-scrollbar">
                  {DEPARTMENTS.map((dept) => {
                    const isStrict = strictGeofenceDepartments[dept] !== false; // default to true
                    return (
                      <div key={dept} className="flex justify-between items-center py-2.5 px-4 bg-slate-50 border border-slate-100 hover:border-slate-200 hover:bg-slate-50/80 transition-all rounded-sm">
                        <div>
                          <span className="text-xs font-medium text-slate-900">{dept}</span>
                          <span className="block text-[8px] text-slate-400 font-display uppercase tracking-wider mt-0.5">
                            Policy ID: {dept.substring(0, 3).toUpperCase()}-WP
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className={cn(
                            "text-[8px] font-display font-black uppercase tracking-wider px-2 py-0.5 rounded-full border",
                            isStrict 
                              ? "bg-emerald-50 text-emerald-700 border-emerald-100" 
                              : "bg-amber-50 text-amber-700 border-amber-100"
                          )}>
                            {isStrict ? "Standard Policy" : "Remote Allowed"}
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              setStrictGeofenceDepartments({
                                ...strictGeofenceDepartments,
                                [dept]: !isStrict
                              });
                            }}
                            className="relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none"
                            style={{ backgroundColor: isStrict ? "#b2a265" : "#cbd5e1" }}
                          >
                            <span
                              className={cn(
                                "pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
                                isStrict ? "translate-x-4" : "translate-x-0"
                              )}
                            />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Exception Grace Period Card */}
              <div className="bg-white border border-slate-100 shadow-[0_8px_32px_rgba(0,0,0,0.03)] p-8 flex flex-col justify-between">
                <div className="space-y-6">
                  <div className="flex items-center gap-3 mb-4 pb-4 border-b border-slate-50">
                    <div className="p-2 bg-amber-50 text-amber-700 rounded-sm">
                      <Timer size={18} />
                    </div>
                    <div>
                      <h3 className="text-lg font-serif italic text-slate-900 leading-none mb-1">Exception Grace Periods</h3>
                      <p className="text-[9px] font-display uppercase tracking-widest text-slate-400">Establish geographic verification allowance by role</p>
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-500 font-serif italic leading-relaxed">
                    Senior clearances can be granted a spatial grace check allowance (in minutes) exempting them from hard lockouts, catering to remote managers or offsite audits.
                  </p>

                  <div className="space-y-4 max-h-[350px] overflow-y-auto pr-2 custom-scrollbar">
                    {ROLES.map((role) => {
                      const graceMin = roleGracePeriods[role] || 0;
                      return (
                        <div key={role} className="flex flex-col sm:flex-row justify-between items-start sm:items-center py-3 px-4 bg-slate-50 hover:bg-slate-100/50 hover:border-slate-200 border border-slate-100 transition-all gap-4">
                          <div>
                            <span className="text-xs font-bold text-slate-950 uppercase tracking-wide">{role}</span>
                            <span className="block text-[8px] text-slate-400 font-display uppercase tracking-wider mt-0.5">
                              Policy rule: EX-{role.toUpperCase().replace(/\s/g, "-")}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <input 
                              type="number"
                              min={0}
                              max={240}
                              value={graceMin}
                              onChange={(e) => {
                                const val = Math.max(0, Math.min(240, parseInt(e.target.value) || 0));
                                setRoleGracePeriods({
                                  ...roleGracePeriods,
                                  [role]: val
                                });
                              }}
                              className="w-20 bg-white border border-slate-200 text-center text-xs font-mono py-1.5 focus:border-gold/30 outline-none shadow-sm rounded-sm"
                            />
                            <span className="text-[9px] font-display uppercase tracking-widest text-slate-400 font-bold">Minutes Exemption</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="mt-6 p-4 bg-gold/5 border border-gold/10 text-[10px] text-slate-500 flex items-start gap-2 leading-relaxed">
                  <Info size={14} className="text-gold shrink-0 mt-0.5" />
                  <p>Changes made to geofences and exception windows sync dynamically to the Attendance Clock-In terminals in real-time without session interruptions.</p>
                </div>
              </div>
            </div>

            {/* Delegate Approval Section */}
            <div className="bg-white border border-slate-100 shadow-[0_8px_32px_rgba(0,0,0,0.03)] p-8">
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-50">
                <div className="p-2 bg-amber-50 text-amber-700 rounded-sm">
                  <Calendar size={18} />
                </div>
                <div>
                  <h3 className="text-lg font-serif italic text-slate-900 leading-none mb-1">Temporary Approval Delegation</h3>
                  <p className="text-[9px] font-display uppercase tracking-widest text-slate-400">Delegate HOD sign-off authority for specific date ranges</p>
                </div>
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                {/* Assignment Form */}
                <form onSubmit={handleAddDelegation} className="xl:col-span-1 space-y-4 bg-slate-50/50 p-6 border border-slate-100 rounded-sm">
                  <h4 className="text-xs font-display uppercase tracking-widest text-slate-800 font-bold mb-2">Create New Delegation</h4>
                  
                  <div>
                    <label className="block text-[8px] font-display uppercase tracking-wider text-slate-400 mb-1 font-bold">Assigning Supervisor / HOD</label>
                    <select
                      value={delegationFromEmail}
                      onChange={(e) => setDelegationFromEmail(e.target.value)}
                      className="w-full bg-white border border-slate-200 text-xs px-3 py-2 outline-none focus:border-gold/50 rounded-none font-serif italic"
                    >
                      <option value="">-- Choose HOD --</option>
                      {users.map((u) => (
                        <option key={u.id} value={u.email}>
                          {u.displayName || u.email.split('@')[0]} ({u.role})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[8px] font-display uppercase tracking-wider text-slate-400 mb-1 font-bold">Delegate Substitute (Staff)</label>
                    <select
                      value={delegationToEmail}
                      onChange={(e) => setDelegationToEmail(e.target.value)}
                      className="w-full bg-white border border-slate-200 text-xs px-3 py-2 outline-none focus:border-gold/50 rounded-none font-serif italic"
                    >
                      <option value="">-- Choose Delegate Staff --</option>
                      {users.map((u) => (
                        <option key={u.id} value={u.email}>
                          {u.displayName || u.email.split('@')[0]} ({u.role})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[8px] font-display uppercase tracking-wider text-slate-400 mb-1 font-bold">Start Date</label>
                      <input
                        type="date"
                        value={delegationStartDate}
                        onChange={(e) => setDelegationStartDate(e.target.value)}
                        className="w-full bg-white border border-slate-200 text-xs px-2 py-1.5 focus:border-gold/50 outline-none rounded-none font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[8px] font-display uppercase tracking-wider text-slate-400 mb-1 font-bold">End/Expiry Date</label>
                      <input
                        type="date"
                        value={delegationEndDate}
                        onChange={(e) => setDelegationEndDate(e.target.value)}
                        className="w-full bg-white border border-slate-200 text-xs px-2 py-1.5 focus:border-gold/50 outline-none rounded-none font-mono"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-luxury-black text-white py-2.5 text-[9px] font-display uppercase tracking-widest font-black hover:bg-gold transition-all cursor-pointer"
                  >
                    + Assign Authority
                  </button>
                </form>

                {/* Registry View */}
                <div className="xl:col-span-2 space-y-4">
                  <h4 className="text-xs font-display uppercase tracking-widest text-slate-800 font-bold">Live Delegation Registry</h4>
                  {delegations.length === 0 ? (
                    <div className="text-center py-12 bg-slate-50 border border-slate-100 rounded-sm text-slate-400 italic text-xs font-serif">
                      No active or pre-scheduled authority delegations are currently registered in the database.
                    </div>
                  ) : (
                    <div className="border border-slate-100 overflow-x-auto">
                      <table className="w-full text-left text-xs font-sans text-slate-600 font-normal">
                        <thead>
                          <tr className="bg-slate-50 text-[9px] font-display uppercase tracking-wider text-slate-800 border-b border-slate-100">
                            <th className="p-3 font-extrabold">Assigning HOD</th>
                            <th className="p-3 font-extrabold">Delegate Staff</th>
                            <th className="p-3 font-extrabold">Duration Period</th>
                            <th className="p-3 font-extrabold">Coverage State</th>
                            <th className="p-3 font-extrabold text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 bg-white">
                          {delegations.map((del) => {
                            const status = getDelegationStatus(del.startDate, del.endDate);
                            const fromUserObj = users.find(u => u.email === del.fromUserEmail);
                            const toUserObj = users.find(u => u.email === del.toUserEmail);
                            
                            return (
                              <tr key={del.id} className="hover:bg-slate-50/50 transition-colors">
                                <td className="p-3">
                                  <p className="font-bold text-slate-900 font-serif italic text-xs">{fromUserObj?.displayName || del.fromUserEmail.split('@')[0]}</p>
                                  <p className="text-[8px] text-slate-400 font-mono mt-0.5">{del.fromUserEmail}</p>
                                </td>
                                <td className="p-3">
                                  <p className="font-bold text-slate-900 font-serif italic text-xs">{toUserObj?.displayName || del.toUserEmail.split('@')[0]}</p>
                                  <p className="text-[8px] text-slate-400 font-mono mt-0.5">{del.toUserEmail}</p>
                                </td>
                                <td className="p-3 text-[10px] font-mono font-medium text-slate-700">
                                  {new Date(del.startDate).toLocaleDateString()} – {new Date(del.endDate).toLocaleDateString()}
                                </td>
                                <td className="p-3">
                                  <span className={cn(
                                    "text-[8px] font-display font-black uppercase tracking-wider px-2 py-0.5 rounded-full border",
                                    status === "Active" ? "bg-emerald-50 text-emerald-700 border-emerald-100 animate-pulse" :
                                    status === "Prescheduled" ? "bg-blue-50 text-blue-700 border-blue-100" :
                                    "bg-slate-100 text-slate-400 border-slate-200"
                                  )}>
                                    {status}
                                  </span>
                                </td>
                                <td className="p-3 text-right">
                                  <button
                                    onClick={() => handleRevokeDelegation(del.id)}
                                    className="p-1 px-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-100 hover:border-rose-200 text-[8px] font-display uppercase tracking-widest font-black transition-all cursor-pointer"
                                  >
                                    Revoke
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Approvers Registry section */}
            <div className="bg-white border border-slate-100 shadow-[0_8px_32px_rgba(0,0,0,0.03)] p-8">
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-50">
                <div className="p-2 bg-slate-100 text-slate-800 rounded-sm">
                  <Shield size={18} />
                </div>
                <div>
                  <h3 className="text-lg font-serif italic text-slate-900 leading-none mb-1">Adjudication Escalation Group</h3>
                  <p className="text-[9px] font-display uppercase tracking-widest text-slate-400">Specify system accounts eligible to sign-off and clear HOD disputes</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[220px] overflow-y-auto pr-2 custom-scrollbar">
                {users.map((u) => {
                  const isChecked = selectedApproverEmails.includes(u.email);
                  return (
                    <label 
                      key={u.id} 
                      className={cn(
                        "flex items-center justify-between p-4 border transition-all cursor-pointer rounded-sm select-none",
                        isChecked 
                          ? "border-gold/30 bg-gold/5 text-slate-900" 
                          : "border-slate-100 bg-slate-50 hover:bg-slate-100 hover:border-slate-200 text-slate-500"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <input 
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {
                            if (isChecked) {
                              setSelectedApproverEmails(selectedApproverEmails.filter(e => e !== u.email));
                            } else {
                              setSelectedApproverEmails([...selectedApproverEmails, u.email]);
                            }
                          }}
                          className="sr-only"
                        />
                        <div className={cn(
                          "w-4 h-4 rounded-sm border flex items-center justify-center transition-all",
                          isChecked ? "bg-gold border-gold text-white" : "border-slate-300 bg-white"
                        )}>
                          {isChecked && <Check size={10} strokeWidth={3} />}
                        </div>
                        <div>
                          <p className="text-xs font-serif italic leading-tight">{u.displayName || u.email.split('@')[0]}</p>
                          <p className="text-[8px] text-slate-400 font-mono mt-0.5">{u.email}</p>
                        </div>
                      </div>
                      <span className="text-[8px] font-display font-medium uppercase tracking-[0.1em] px-2 py-0.5 bg-slate-200/50 rounded text-slate-500">
                        {u.role}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Save Controls Panel */}
            <div className="bg-slate-50 border border-slate-100 p-6 flex flex-col sm:flex-row justify-between items-center gap-4">
              <div className="flex items-start gap-2.5">
                <ShieldAlert size={16} className="text-gold shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-serif italic text-slate-900 leading-tight">Authorize Policy Commitments</p>
                  <p className="text-[9px] uppercase tracking-widest text-slate-400 font-display mt-0.5">This will override current database-wide constraints and geofencing systems</p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleSaveWorkflow}
                disabled={savingWorkflow}
                className="w-full sm:w-auto bg-luxury-black text-white px-10 py-3.5 text-[10px] font-display uppercase tracking-widest font-black hover:bg-gold transition-all shadow-xl active:scale-95 disabled:opacity-50"
              >
                {savingWorkflow ? "Committing to System..." : successWorkflow ? "Configuration Saved!" : "Apply Policy Updates"}
              </button>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
      
      {filteredUsers.length === 0 && (
        <div className="luxury-card p-24 text-center bg-white mt-4 border border-dashed border-slate-100 mx-4 lg:mx-0">
          <div className="w-16 h-16 bg-slate-50 flex items-center justify-center rounded-full mx-auto mb-6">
            <Users className="text-slate-200" size={32} />
          </div>
          <p className="italic font-serif text-slate-400 text-lg">Identity database yielded zero results for "{searchQuery}"</p>
          <button 
            onClick={() => setSearchQuery('')}
            className="text-[10px] font-display uppercase tracking-widest text-gold font-black mt-4 hover:underline"
          >
            Clear Master Filter
          </button>
        </div>
      )}

      <div className="mt-12 px-4 lg:px-0 flex flex-col sm:flex-row justify-between items-center gap-6 border-t border-slate-100 pt-8">
        <div className="flex items-center gap-4">
           <div className="flex -space-x-2">
             {users.slice(0, 5).map((u, i) => (
                u.photoURL ? (
                  <img key={i} src={u.photoURL} alt="" className="w-8 h-8 rounded-full border-2 border-white object-cover" />
                ) : (
                  <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-slate-100 flex items-center justify-center text-[10px] font-black text-slate-400">
                    {u.displayName?.[0] || '?'}
                  </div>
                )
             ))}
           </div>
           <p className="text-[10px] font-display uppercase tracking-widest text-slate-400">
             <span className="text-luxury-black font-black">{users.length}</span> verified personnel in directory
           </p>
        </div>
        <div className="flex items-center gap-2 py-2 px-4 bg-slate-50 text-[9px] font-display uppercase tracking-[0.2em] text-slate-400 font-bold rounded-sm">
           <div className="w-1 h-1 bg-emerald-400 rounded-full animate-pulse" />
           Live Surveillance Active
        </div>
      </div>

      <ConfirmModal
        isOpen={!!deleteUserTarget}
        onClose={() => setDeleteUserTarget(null)}
        onConfirm={handleDeleteUserConfirm}
        title="Revoke Personnel Access?"
        description={`Are you sure you want to revoke access credentials for "${deleteUserTarget?.email}"? This will permanently erase their association from the System Control Panel.`}
        confirmLabel="Revoke Credentials"
        cancelLabel="Retain Access"
        variant="danger"
      />
    </div>
  );
};
