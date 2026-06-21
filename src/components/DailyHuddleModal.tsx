import React, { useState, useEffect } from "react";
import { 
  X,
  Megaphone, 
  Wrench, 
  AlertTriangle, 
  CheckCircle, 
  Users, 
  Coffee, 
  Clock, 
  ClipboardList, 
  Plus, 
  Trash2, 
  Check, 
  BookmarkCheck,
  Building,
  UserCheck
} from "lucide-react";
import { 
  db, 
  auth,
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  onSnapshot, 
  query, 
  orderBy, 
  serverTimestamp 
} from "../lib/firebase";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "../lib/utils";

interface DailyHuddleModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedCompany: string;
  complaints: any[];
  maintenanceHistory: any[];
  latestCorporateNews: any[];
}

interface HuddleTask {
  id: string;
  taskName: string;
  location: string;
  priority: "Low" | "Medium" | "High" | "Urgent";
  status: "Pending" | "Completed";
  assignedTo: string;
  createdAt: any;
}

export const DailyHuddleModal: React.FC<DailyHuddleModalProps> = ({
  isOpen,
  onClose,
  selectedCompany,
  complaints,
  maintenanceHistory,
  latestCorporateNews
}) => {
  const [activeSubTab, setActiveSubTab] = useState<"complaints" | "maintenance" | "announcements">("complaints");
  const [shiftType, setShiftType] = useState<"Morning" | "Afternoon" | "Night">("Morning");
  const [huddleLeader, setHuddleLeader] = useState("");
  
  // Shift huddle tasks list synced with Firestore
  const [huddleTasks, setHuddleTasks] = useState<HuddleTask[]>([]);
  const [tasksLoading, setTasksLoading] = useState(false);
  const [newTaskName, setNewTaskName] = useState("");
  const [newTaskLoc, setNewTaskLoc] = useState("");
  const [newTaskPriority, setNewTaskPriority] = useState<"Low" | "Medium" | "High" | "Urgent">("Medium");
  const [newTaskAssignee, setNewTaskAssignee] = useState("");

  // Acknowledged announcements IDs in local state (or save to localStorage for the shift)
  const [acknowledgedNews, setAcknowledgedNews] = useState<string[]>([]);

  // Default Shift leader name setup based on authenticated user
  useEffect(() => {
    if (auth.currentUser) {
      setHuddleLeader(auth.currentUser.displayName || auth.currentUser.email?.split('@')[0] || "Shift Supervisor");
    }
  }, [auth.currentUser, isOpen]);

  // Determine current shift based on local time
  useEffect(() => {
    if (!isOpen) return;
    const hour = new Date().getHours();
    if (hour >= 6 && hour < 14) {
      setShiftType("Morning");
    } else if (hour >= 14 && hour < 22) {
      setShiftType("Afternoon");
    } else {
      setShiftType("Night");
    }
  }, [isOpen]);

  // Sync Shift Tasks with Firestore
  useEffect(() => {
    if (!isOpen || !selectedCompany) return;
    
    setTasksLoading(true);
    const q = query(
      collection(db, `huddle-tasks-${selectedCompany}`),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as HuddleTask[];
      setHuddleTasks(docs);
      setTasksLoading(false);
    }, (error) => {
      console.error("Error loading huddle tasks:", error);
      setTasksLoading(false);
    });

    return () => unsubscribe();
  }, [isOpen, selectedCompany]);

  // Load acknowledged announcements for this company on initial mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(`cml_huddle_ack_${selectedCompany}`);
      if (saved) {
        setAcknowledgedNews(JSON.parse(saved));
      }
    } catch (e) {
      console.log("Could not load huddle acknowledgements", e);
    }
  }, [selectedCompany]);

  const saveAckToStorage = (updated: string[]) => {
    try {
      localStorage.setItem(`cml_huddle_ack_${selectedCompany}`, JSON.stringify(updated));
    } catch (e) {
      console.log("Could not save acknowledgements", e);
    }
  };

  const handleToggleAckNews = (id: string) => {
    const next = acknowledgedNews.includes(id)
      ? acknowledgedNews.filter(x => x !== id)
      : [...acknowledgedNews, id];
    setAcknowledgedNews(next);
    saveAckToStorage(next);
  };

  const handleAddHuddleTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskName.trim()) return;

    try {
      const payload = {
        taskName: newTaskName.trim(),
        location: newTaskLoc.trim() || "N/A",
        priority: newTaskPriority,
        status: "Pending" as const,
        assignedTo: newTaskAssignee.trim() || "Unassigned",
        createdAt: serverTimestamp()
      };

      await addDoc(collection(db, `huddle-tasks-${selectedCompany}`), payload);
      
      setNewTaskName("");
      setNewTaskLoc("");
      setNewTaskPriority("Medium");
      setNewTaskAssignee("");
    } catch (err) {
      console.error("Failed to add huddle task:", err);
    }
  };

  const handleToggleTaskStatus = async (task: HuddleTask) => {
    try {
      const nextStatus = task.status === "Pending" ? "Completed" : "Pending";
      await updateDoc(doc(db, `huddle-tasks-${selectedCompany}`, task.id), {
        status: nextStatus
      });
    } catch (err) {
      console.error("Failed to update task status:", err);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    try {
      await deleteDoc(doc(db, `huddle-tasks-${selectedCompany}`, taskId));
    } catch (err) {
      console.error("Failed to delete task:", err);
    }
  };

  // Quick action to address/resolve a pending guest complaint right inside the Daily Huddle Briefing
  const handleSetComplaintStatus = async (complaintId: string, propertyId: string, nextStatus: string) => {
    try {
      await updateDoc(doc(db, `complaints-${propertyId}`, complaintId), {
        status: nextStatus,
        updatedAt: serverTimestamp()
      });
    } catch (err) {
      console.error("Failed to set complaint status:", err);
    }
  };

  if (!isOpen) return null;

  // Filter complaints for the active property that are Pending or In Progress (i.e. Active Concerns)
  const activeComplaints = complaints.filter(c => 
    c.propertyId === selectedCompany && 
    (c.status === "Pending" || c.status === "In Progress") && 
    !c.isArchived
  );

  // Collate active maintenance checklist items needing repair
  const repairChecklistItems = maintenanceHistory.flatMap(log => 
    Object.entries(log.values || {})
      .filter(([_, val]) => val === 'repair')
      .map(([key, _]) => ({
        itemName: key.split('-').pop() || key,
        category: log.type === 'public' ? 'Public Space' : log.type === 'guest' ? 'Guest Room' : 'Concierge Area',
        location: log.roomNumber || "Reported Location",
        date: log.date,
        notes: log.notes || "Item marked for repair during shift inspection checklist walkthrough."
      }))
  );

  // Filter announcements matching company target or "All"
  const propFilterString = 
    selectedCompany === 'cml' ? "CML Corporate" :
    selectedCompany === 'wyndham' ? "Wyndham Garden" :
    selectedCompany === 'ramada' ? "Ramada Suites" : "All";

  // Critical announcements include urgent ones, or any specific property news
  const criticalAnnouncements = latestCorporateNews.filter(news => 
    news.isUrgent || 
    news.propertyTarget === "All" || 
    news.propertyTarget === propFilterString
  );

  // Shift goal & description map
  const shiftFocusOptions = {
    Morning: {
      goal: "SOP Execution, High-Fidelity Room Audits, and Express Turnarounds",
      bullets: [
        "Monitor checkout velocities and fast-track late departure requests.",
        "Ensure all public space checks are finished prior to peak morning lounge traffic.",
        "Verify standard amenity presentations for arriving VIP guest profiles."
      ]
    },
    Afternoon: {
      goal: "Peak Arrival Check-In Synchronization & Room Recovery Management",
      bullets: [
        "Audit room-key distribution blocks and pre-allocate keyless configurations.",
        "Immediately address any open service recovery cases before guests return from outings.",
        "Validate restaurant and lounge kapasitas statuses for immediate peak service prep."
      ]
    },
    Night: {
      goal: "Asset Hard Protection, Master Lock Key Auditing, and System Backups",
      bullets: [
        "Conduct complete door double-lock checks and check perimeter cameras.",
        "Audit staff controller cards, master key returns, and de-activate lost badges.",
        "Synchronize pending local database logs to secure cloud servers."
      ]
    }
  };

  return (
    <div id="daily-huddle-backdrop" className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="w-full max-w-5xl h-[85vh] bg-white text-slate-900 border border-gold/20 shadow-2xl flex flex-col overflow-hidden rounded-none"
        id="daily-huddle-modal-container"
      >
        {/* Header */}
        <div className="p-6 bg-luxury-black text-white border-b border-gold/10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shrink-0">
          <div>
            <div className="flex items-center gap-3">
              <span className="p-1 px-2.5 bg-gold text-slate-950 text-[10px] font-display uppercase tracking-widest font-black">Shift Briefing</span>
              <h2 className="text-2xl font-serif text-white italic tracking-wide">Daily Huddle Board</h2>
            </div>
            <p className="text-[10px] uppercase font-display tracking-widest text-slate-400 mt-1 flex items-center gap-2">
              <Building size={12} className="text-gold" />
              Property: {selectedCompany === "ramada" ? "Ramada Suites" : selectedCompany === "wyndham" ? "Wyndham Garden" : "CML Corporate"}
            </p>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            {/* Shift Picker */}
            <div className="flex items-center gap-1.5 p-1 bg-white/5 border border-white/10 rounded-none">
              {(["Morning", "Afternoon", "Night"] as const).map(s => (
                <button
                  key={s}
                  onClick={() => setShiftType(s)}
                  className={cn(
                    "px-3 py-1 text-[9px] font-display uppercase tracking-wider font-extrabold transition-all",
                    shiftType === s ? "bg-gold text-slate-950" : "text-slate-400 hover:text-white"
                  )}
                >
                  {s}
                </button>
              ))}
            </div>

            {/* Close Button */}
            <button 
              onClick={onClose}
              className="p-2 ml-auto hover:bg-white/10 text-slate-400 hover:text-white transition-all rounded-xs border border-white/10"
              id="huddle-modal-close"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Shift Setting Sub-Bar */}
        <div className="bg-luxury-cream border-b border-gold/10 p-4 md:px-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shrink-0">
          <div className="flex items-center gap-5">
            <div className="flex items-center gap-2">
              <Clock size={14} className="text-gold" />
              <div className="text-left">
                <span className="block text-[8px] font-display uppercase tracking-widest text-slate-500 font-bold">Shift Schedule</span>
                <span className="text-xs font-serif italic text-slate-900 font-bold">
                  {new Date().toLocaleDateString("en-US", { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                </span>
              </div>
            </div>

            <div className="h-8 w-px bg-slate-200" />

            <div className="flex items-center gap-2">
              <UserCheck size={14} className="text-gold" />
              <div className="text-left">
                <label className="block text-[8px] font-display uppercase tracking-widest text-slate-500 font-bold">Huddle Leader</label>
                <input
                  type="text"
                  value={huddleLeader}
                  onChange={(e) => setHuddleLeader(e.target.value)}
                  className="bg-transparent border-none text-xs font-serif italic font-bold p-0 text-slate-950 focus:ring-0 w-36 h-4"
                  placeholder="Enter Shift Leader"
                />
              </div>
            </div>
          </div>

          <div className="flex-1 md:max-w-md w-full">
            <span className="block text-[8.5px] font-display uppercase tracking-widest text-slate-700 font-bold mb-1">Active Focus</span>
            <div className="bg-white/80 p-2 border border-gold/10 text-[10px] font-serif italic text-slate-950 leading-relaxed font-semibold">
              🎯 "{shiftFocusOptions[shiftType].goal}"
            </div>
          </div>
        </div>

        {/* Main Workspace Layout */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* Quick Stats & Shift Checklist sidebar */}
          <div className="w-full md:w-72 border-r border-slate-100 bg-slate-50 p-6 flex flex-col justify-between overflow-y-auto shrink-0">
            <div className="space-y-6">
              <div>
                <h4 className="text-[10px] font-display uppercase tracking-widest font-black text-slate-800 mb-3 flex items-center gap-2">
                  <ClipboardList size={12} className="text-gold" /> Shift Handover List
                </h4>
                <ul className="space-y-2.5">
                  {shiftFocusOptions[shiftType].bullets.map((b, idx) => (
                    <li key={idx} className="flex gap-2 text-[11px] font-serif italic text-slate-600 leading-relaxed">
                      <span className="text-gold font-body not-italic font-bold">✓</span>
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="border-t border-slate-200 pt-6">
                <h4 className="text-[10px] font-display uppercase tracking-widest font-black text-slate-800 mb-3">
                  Quick Huddle Metrics
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-white border border-slate-100 shadow-xs">
                    <span className="block text-[8px] font-display uppercase text-slate-500 font-bold">Urgent Concerns</span>
                    <span className={cn(
                      "text-xl font-serif italic font-bold", 
                      activeComplaints.length > 0 ? "text-red-500" : "text-emerald-500"
                    )}>
                      {activeComplaints.length}
                    </span>
                  </div>
                  <div className="p-3 bg-white border border-slate-100 shadow-xs">
                    <span className="block text-[8px] font-display uppercase text-slate-500 font-bold">Active Repairs</span>
                    <span className="text-xl font-serif italic text-gold font-bold">
                      {repairChecklistItems.length + huddleTasks.filter(t => t.status === "Pending").length}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8 border-t border-slate-200 pt-6">
              <div className="p-3.5 bg-gold/5 border border-gold/10 text-[10px] text-slate-700 font-serif italic leading-relaxed text-center">
                📢 "Huddles are standard 10-minute shift checkpoints. Keep briefings concise, actionable, and aligned on customer experience recovery standards."
              </div>
            </div>
          </div>

          {/* Primary Operations Tabs Workspace */}
          <div className="flex-1 flex flex-col overflow-hidden bg-white">
            {/* Tabs Row */}
            <div className="flex border-b border-slate-100 px-6 shrink-0 bg-slate-50/50">
              {[
                { id: "complaints", label: "Active Guest Recovery", count: activeComplaints.length, icon: AlertTriangle, badgeColor: "bg-red-100 text-red-600" },
                { id: "maintenance", label: "Maintenance & Tasks", count: repairChecklistItems.length + huddleTasks.length, icon: Wrench, badgeColor: "bg-gold/20 text-gold-dark" },
                { id: "announcements", label: "Shift Briefing News", count: criticalAnnouncements.length, icon: Megaphone, badgeColor: "bg-slate-200 text-slate-700" }
              ].map(tab => {
                const isActive = activeSubTab === tab.id;
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveSubTab(tab.id as any)}
                    className={cn(
                      "py-4 px-4 font-display uppercase tracking-widest text-[9.5px] font-black border-b-2 flex items-center gap-2 transition-all relative",
                      isActive ? "border-gold text-gold" : "border-transparent text-slate-400 hover:text-slate-700"
                    )}
                  >
                    <Icon size={13} className={isActive ? "text-gold animate-pulse" : "text-slate-400"} />
                    <span>{tab.label}</span>
                    {tab.count > 0 && (
                      <span className={cn("text-[8px] px-1.5 py-0.2 rounded-full font-mono", tab.badgeColor)}>
                        {tab.count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Tab Contents Pane */}
            <div className="flex-1 p-6 overflow-y-auto">
              <AnimatePresence mode="wait">
                {activeSubTab === "complaints" && (
                  <motion.div
                    key="complaints"
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    className="space-y-4"
                  >
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="text-base font-serif italic text-slate-900">
                        Pending Guest Complaints & Services Alerts
                      </h3>
                      <p className="text-[9px] uppercase font-display tracking-widest text-slate-500">Live Sync Feed</p>
                    </div>

                    {activeComplaints.length === 0 ? (
                      <div className="p-12 border border-dashed border-slate-100 text-center">
                        <CheckCircle size={32} className="text-emerald-500 mx-auto mb-3" />
                        <p className="font-serif italic text-slate-500 text-sm">All guest complaints resolved! Perfect shift standing.</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {activeComplaints.map(c => (
                          <div key={c.id} className="p-4 bg-white border border-slate-100 shadow-xs hover:border-gold/30 transition-all">
                            <div className="flex flex-wrap justify-between items-start gap-2">
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-serif font-black text-slate-950">{c.guestName}</span>
                                  <span className="text-[8.5px] font-display uppercase font-bold text-gold bg-luxury-cream px-2 py-0.5">Room {c.roomNumber}</span>
                                  <span className={cn(
                                    "text-[8px] font-display uppercase font-black px-2 py-0.5",
                                    c.priority === "Urgent" ? "bg-red-50 text-red-600 border border-red-200" :
                                    c.priority === "High" ? "bg-amber-50 text-amber-600 border border-amber-200" :
                                    "bg-blue-50 text-blue-600 border border-blue-200"
                                  )}>
                                    {c.priority} Priority
                                  </span>
                                </div>
                                <p className="text-[10px] text-slate-400 font-display uppercase tracking-widest mt-1">Lodge Type: {c.type}</p>
                              </div>

                              <div className="flex items-center gap-2.5">
                                <span className={cn(
                                  "text-[8px] font-display uppercase font-black px-2 py-0.5 rounded-full",
                                  c.status === "Pending" ? "bg-red-50 text-red-500" : "bg-amber-50 text-amber-500"
                                )}>
                                  {c.status}
                                </span>
                                
                                <div className="h-px w-2 bg-slate-200" />
                                
                                <button
                                  onClick={() => handleSetComplaintStatus(c.id, c.propertyId, "In Progress")}
                                  className={cn(
                                    "px-2 py-1 text-[8px] font-display uppercase tracking-widest border transition-all",
                                    c.status === "In Progress" ? "bg-slate-100 text-slate-500 cursor-not-allowed" : "bg-white text-slate-950 hover:bg-slate-50 border-slate-300"
                                  )}
                                  disabled={c.status === "In Progress"}
                                >
                                  Deploy Team
                                </button>
                                
                                <button
                                  onClick={() => handleSetComplaintStatus(c.id, c.propertyId, "Resolved")}
                                  className="px-2 py-1 bg-emerald-600 text-white text-[8px] font-display uppercase tracking-widest hover:bg-emerald-700 transition-all"
                                >
                                  Resolve Case
                                </button>
                              </div>
                            </div>

                            <p className="text-[11px] font-serif italic text-slate-800 leading-relaxed mt-2 bg-slate-50 p-2.5 border-l-2 border-gold/30">
                              "{c.description}"
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </motion.div>
                )}

                {activeSubTab === "maintenance" && (
                  <motion.div
                    key="maintenance"
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    className="space-y-6"
                  >
                    {/* Add Custom Huddle Task Form */}
                    <form onSubmit={handleAddHuddleTask} className="p-4 bg-slate-50 border border-slate-100 space-y-3">
                      <h4 className="text-[10px] font-display uppercase tracking-widest font-black text-slate-800 flex items-center gap-1.5">
                        <Plus size={11} className="text-gold" strokeWidth={3} /> Record Quick Action / Shift Maintenance item
                      </h4>
                      
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                        <input
                          type="text"
                          required
                          placeholder="Task Description (e.g., Shower friction)"
                          value={newTaskName}
                          onChange={(e) => setNewTaskName(e.target.value)}
                          className="bg-white border border-slate-200 text-xs font-serif italic p-2 text-slate-900 focus:outline-none focus:border-gold"
                        />
                        <input
                          type="text"
                          placeholder="Location (e.g., Room 304, Lobby)"
                          value={newTaskLoc}
                          onChange={(e) => setNewTaskLoc(e.target.value)}
                          className="bg-white border border-slate-200 text-xs font-serif italic p-2 text-slate-900 focus:outline-none focus:border-gold"
                        />
                        <input
                          type="text"
                          placeholder="Assignee (e.g., Makereta)"
                          value={newTaskAssignee}
                          onChange={(e) => setNewTaskAssignee(e.target.value)}
                          className="bg-white border border-slate-200 text-xs font-serif italic p-2 text-slate-900 focus:outline-none focus:border-gold"
                        />
                        
                        <div className="flex gap-2">
                          <select
                            value={newTaskPriority}
                            onChange={(e) => setNewTaskPriority(e.target.value as any)}
                            className="bg-white border border-slate-200 text-[10px] font-display uppercase tracking-wide px-2 p-1.5 text-slate-800 focus:outline-none focus:border-gold max-w-[100px] shrink-0"
                          >
                            <option value="Low">Low</option>
                            <option value="Medium font-bold">Medium</option>
                            <option value="High">High</option>
                            <option value="Urgent">Urgent</option>
                          </select>
                          
                          <button
                            type="submit"
                            className="flex-1 bg-luxury-black text-white hover:bg-gold transition-colors text-[9px] font-display uppercase tracking-widest font-extrabold flex items-center justify-center gap-1"
                          >
                            <Plus size={12} /> Add Task
                          </button>
                        </div>
                      </div>
                    </form>

                    {/* Integrated list: Checklist items needing repair + Quick custom tasks */}
                    <div className="space-y-4">
                      <div className="flex justify-between items-center bg-white border-b border-slate-100 pb-2">
                        <h4 className="text-xs font-serif italic font-bold text-slate-800">
                          Active Dispatch & Repairs ledger
                        </h4>
                        <span className="text-[8.5px] font-display uppercase text-slate-400">Total: {repairChecklistItems.length + huddleTasks.length} Issues</span>
                      </div>

                      {/* Display Custom Tasks synced with Firestore */}
                      {huddleTasks.length > 0 && (
                        <div className="space-y-2.5">
                          <p className="text-[8.5px] font-display uppercase tracking-wider text-slate-500 font-extrabold">Quick Shift Action Items (Live Database)</p>
                          {huddleTasks.map(t => (
                            <div key={t.id} className={cn(
                              "p-3.5 bg-slate-50 border flex items-center justify-between gap-4 transition-all hover:bg-white",
                              t.status === "Completed" ? "border-emerald-100 bg-emerald-50/10 opacity-70" : "border-slate-100"
                            )}>
                              <div className="flex items-start gap-3">
                                <button 
                                  onClick={() => handleToggleTaskStatus(t)}
                                  className={cn(
                                    "w-5 h-5 flex items-center justify-center border transition-all mt-0.5 shrink-0",
                                    t.status === "Completed" ? "bg-emerald-600 border-emerald-600 text-white" : "bg-white border-slate-300 hover:border-gold text-transparent"
                                  )}
                                >
                                  <Check size={12} strokeWidth={3} />
                                </button>

                                <div>
                                  <span className={cn(
                                    "text-xs font-serif italic text-slate-900 font-medium block",
                                    t.status === "Completed" && "line-through text-slate-400"
                                  )}>
                                    {t.taskName}
                                  </span>
                                  <div className="flex items-center gap-3 text-[9px] font-display uppercase font-bold text-slate-500 mt-1">
                                    <span className="text-gold">📍 {t.location}</span>
                                    <span>•</span>
                                    <span>Rep: {t.assignedTo}</span>
                                    <span>•</span>
                                    <span className={cn(
                                      "font-black text-[8px]",
                                      t.priority === "Urgent" ? "text-red-500" : t.priority === "High" ? "text-orange-500" : "text-slate-400"
                                    )}>{t.priority}</span>
                                  </div>
                                </div>
                              </div>

                              <button 
                                onClick={() => handleDeleteTask(t.id)}
                                className="p-1.5 text-slate-400 hover:text-red-500 transition-colors"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Display checklist failures harvested from history */}
                      {repairChecklistItems.length > 0 && (
                        <div className="space-y-2.5 mt-4">
                          <p className="text-[8.5px] font-display uppercase tracking-wider text-slate-500 font-extrabold">Active Maintenance Defect Checklist Detections</p>
                          {repairChecklistItems.map((item, idx) => (
                            <div key={idx} className="p-3.5 bg-white border border-slate-100 shadow-xs">
                              <div className="flex justify-between items-start gap-4">
                                <div>
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="text-xs font-serif font-black text-slate-900">{item.itemName}</span>
                                    <span className="text-[8.5px] font-display uppercase font-extrabold text-[#94743c] bg-amber-55/10 px-2 py-0.2">Type: {item.category}</span>
                                    <span className="text-[9px] font-mono text-slate-500 font-semibold">{item.date}</span>
                                  </div>
                                  <p className="text-[10px] text-slate-600 italic mt-1.5 leading-relaxed bg-slate-50/50 p-2 border-l border-gold">
                                    "{item.notes}"
                                  </p>
                                </div>

                                <div className="text-right">
                                  <span className="text-[8px] font-display uppercase text-white bg-amber-600 px-2.5 py-0.5 tracking-wider font-extrabold">Needs Repair</span>
                                  <span className="block text-[8px] font-mono text-slate-400 mt-1 uppercase font-bold">📍 {item.location}</span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {repairChecklistItems.length === 0 && huddleTasks.length === 0 && (
                        <div className="p-12 border border-dashed border-slate-100 text-center">
                          <CheckCircle size={32} className="text-emerald-500 mx-auto mb-3" />
                          <p className="font-serif italic text-slate-500 text-sm">No maintenance failures discovered or shift actions needed.</p>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}

                {activeSubTab === "announcements" && (
                  <motion.div
                    key="announcements"
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    className="space-y-4"
                  >
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="text-base font-serif italic text-slate-900">
                        Shift Briefing News & Critical Announcements
                      </h3>
                      <p className="text-[9px] uppercase font-display tracking-widest text-slate-400">Mark read to indicate staff was briefed</p>
                    </div>

                    {criticalAnnouncements.length === 0 ? (
                      <div className="p-12 border border-dashed border-slate-100 text-center">
                        <Megaphone size={32} className="text-slate-300 mx-auto mb-3" />
                        <p className="font-serif italic text-slate-500 text-sm">No active corporate announcements issued for this hub.</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {criticalAnnouncements.map(ann => {
                          const isAck = acknowledgedNews.includes(ann.id);
                          return (
                            <div key={ann.id} className={cn(
                              "p-4 bg-white border flex flex-col md:flex-row justify-between gap-4 transition-all",
                              isAck ? "border-slate-100 opacity-60 bg-slate-50/50" : "border-slate-200 border-l-4 border-l-gold"
                            )}>
                              <div className="flex-1">
                                <div className="flex items-center gap-2.5 flex-wrap">
                                  <span className={cn(
                                    "text-[8px] font-display uppercase tracking-wider font-extrabold px-2 py-0.3",
                                    ann.isUrgent ? "bg-red-100 text-red-650" : "bg-gold/20 text-gold-dark"
                                  )}>
                                    {ann.isUrgent ? "CRITICAL ALERT" : "OPERATIONAL"}
                                  </span>
                                  <span className="text-[9.5px] font-display uppercase tracking-widest font-black text-slate-400">{ann.category}</span>
                                </div>
                                
                                <h4 className="text-sm font-serif font-black text-slate-950 mt-1 leading-snug">{ann.title}</h4>
                                <p className="text-[11px] font-serif italic text-slate-700 leading-relaxed mt-2 p-2 bg-slate-50">
                                  {ann.content}
                                </p>
                                
                                <span className="block text-[8.5px] font-display text-slate-400 mt-2 uppercase font-extrabold">ISSUED BY: {ann.authorName} &bull; {ann.propertyTarget}</span>
                              </div>

                              <div className="flex md:flex-col items-center justify-between md:justify-center shrink-0 border-t md:border-t-0 md:border-l border-slate-100 pt-3 md:pt-0 md:pl-4 min-w-[120px]">
                                <button
                                  onClick={() => handleToggleAckNews(ann.id)}
                                  className={cn(
                                    "w-full text-center px-3 py-2 text-[8px] font-display uppercase tracking-widest font-extrabold flex items-center justify-center gap-2 transition-all border",
                                    isAck ? "bg-emerald-50 text-emerald-600 border-emerald-200" : "bg-luxury-black text-white hover:bg-gold hover:border-gold border-slate-900"
                                  )}
                                >
                                  {isAck ? (
                                    <>
                                      <BookmarkCheck size={11} strokeWidth={3} /> Briefed ✓
                                    </>
                                  ) : (
                                    <>
                                      Brief Team
                                    </>
                                  )}
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-5 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-4 shrink-0">
          <div className="flex items-center gap-2 text-[10px] text-slate-500 italic">
            <span>Shift leader briefing compiled on {new Date().toLocaleTimeString()} system local time.</span>
          </div>

          <button
            onClick={onClose}
            className="w-full sm:w-auto px-8 py-3 bg-luxury-black text-white text-[10px] font-display uppercase tracking-widest font-black hover:bg-gold transition-colors"
          >
            Acknowledge & Close Huddle
          </button>
        </div>
      </motion.div>
    </div>
  );
};
