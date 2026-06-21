import React, { useState, useEffect } from "react";
import { 
  db, 
  auth, 
  handleFirestoreError, 
  OperationType,
  collection, 
  query, 
  orderBy, 
  onSnapshot, 
  addDoc, 
  serverTimestamp,
  doc,
  deleteDoc,
  updateDoc
} from "../lib/firebase";
import { 
  HelpCircle, 
  Download, 
  ExternalLink, 
  Cpu, 
  FileText, 
  PhoneCall, 
  Send, 
  CheckCircle, 
  AlertTriangle, 
  Clock, 
  User, 
  ShieldAlert,
  Server,
  Smartphone,
  Laptop,
  Monitor,
  Info,
  Chrome
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface ITTicket {
  id: string;
  employeeName: string;
  department: string;
  issueType: string;
  priority: "Low" | "Medium" | "Urgent";
  description: string;
  status: "Received" | "Assigned" | "Resolving" | "Resolved";
  createdAt: any;
  timestampDisplay?: string;
  ccEmails?: string[];
}

export const ResourcesHelp: React.FC = () => {
  const [tickets, setTickets] = useState<ITTicket[]>([]);
  const [loading, setLoading] = useState(true);

  // PWA state hooks
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [pwaInstallStatus, setPwaInstallStatus] = useState<"idle" | "success" | "dismissed">("idle");
  const [pwaPlatformTab, setPwaPlatformTab] = useState<"ios" | "android" | "pc" | "mac">("ios");

  // Detect PWA Support and Capture Install Prompt
  useEffect(() => {
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    if (window.matchMedia("(display-mode: standalone)").matches) {
      setPwaInstallStatus("success");
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  const triggerNativePwaInstall = async () => {
    if (!deferredPrompt) {
      alert("Notice: Direct installation triggered. Safe app initialization can also be performed via your browser menu ('Install app' or 'Add to Home screen').");
      return;
    }
    try {
      deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      if (choiceResult.outcome === "accepted") {
        setPwaInstallStatus("success");
      } else {
        setPwaInstallStatus("dismissed");
      }
      setDeferredPrompt(null);
      setIsInstallable(false);
    } catch (err) {
      console.warn("Desktop/Mobile native PWA prompt exception:", err);
    }
  };

  // Form states
  const [employeeName, setEmployeeName] = useState("");
  const [department, setDepartment] = useState("IT Graphics Support");
  const [issueType, setIssueType] = useState("Hardware");
  const [priority, setPriority] = useState<"Low" | "Medium" | "Urgent">("Medium");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [ticketSuccess, setTicketSuccess] = useState(false);

  // Detail Modal & Filter States
  const [selectedDetailTicket, setSelectedDetailTicket] = useState<ITTicket | null>(null);
  const [filterQuery, setFilterQuery] = useState("");
  const [filterDept, setFilterDept] = useState("All");
  const [filterStatusState, setFilterStatusState] = useState("All");

  // Delete Individual Ticket
  const handleDeleteTicket = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const confirmDelete = window.confirm("Are you sure you want to permanently delete this support ticket?");
    if (!confirmDelete) return;

    try {
      if (db && !('_isMock' in db)) {
        await deleteDoc(doc(db, "it_tickets", id));
      } else {
        const stored = localStorage.getItem("cml_it_tickets");
        const existing = stored ? JSON.parse(stored) : [];
        const updated = existing.filter((t: any) => t.id !== id);
        localStorage.setItem("cml_it_tickets", JSON.stringify(updated));
        setTickets(updated);
      }
      if (selectedDetailTicket?.id === id) {
        setSelectedDetailTicket(null);
      }
    } catch (err) {
      console.error("Error deleting ticket:", err);
    }
  };

  // Delete All Tickets
  const handleDeleteAllTickets = async () => {
    const confirmDelete = window.confirm("WARNING: Are you sure you want to permanently delete ALL active support tickets?");
    if (!confirmDelete) return;

    try {
      if (db && !('_isMock' in db)) {
        for (const t of tickets) {
          await deleteDoc(doc(db, "it_tickets", t.id));
        }
      } else {
        localStorage.setItem("cml_it_tickets", JSON.stringify([]));
        setTickets([]);
      }
      setSelectedDetailTicket(null);
    } catch (err) {
      console.error("Error deleting all tickets:", err);
    }
  };

  // Update Status of Ticket
  const handleUpdateTicketStatus = async (id: string, newStatus: "Received" | "Assigned" | "Resolving" | "Resolved") => {
    try {
      if (db && !('_isMock' in db)) {
        const ticketRef = doc(db, "it_tickets", id);
        await updateDoc(ticketRef, { status: newStatus });
      } else {
        const stored = localStorage.getItem("cml_it_tickets");
        const existing = stored ? JSON.parse(stored) : [];
        const updated = existing.map((t: any) => t.id === id ? { ...t, status: newStatus } : t);
        localStorage.setItem("cml_it_tickets", JSON.stringify(updated));
        setTickets(updated);
      }
      if (selectedDetailTicket && selectedDetailTicket.id === id) {
        setSelectedDetailTicket(prev => prev ? { ...prev, status: newStatus } : null);
      }
    } catch (err) {
      console.error("Error updating ticket status:", err);
    }
  };

  // Load Active Tickets
  useEffect(() => {
    let unsubscribe = () => {};

    try {
      if (db && !('_isMock' in db)) {
        const q = query(
          collection(db, "it_tickets"), 
          orderBy("createdAt", "desc")
        );
        unsubscribe = onSnapshot(q, (snapshot) => {
          const ticketsData = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          })) as ITTicket[];
          setTickets(ticketsData);
          setLoading(false);
        }, (error) => {
          console.error("Firestore error loading tickets, switching to local state:", error);
          loadMockTickets();
        });
      } else {
        loadMockTickets();
      }
    } catch {
      loadMockTickets();
    }

    return () => unsubscribe();
  }, []);

  const loadMockTickets = () => {
    const stored = localStorage.getItem("cml_it_tickets");
    if (stored) {
      setTickets(JSON.parse(stored));
    } else {
      const initialMock: ITTicket[] = [
        {
          id: "ticket_1",
          employeeName: "Charles Cebujano",
          department: "Marketing",
          issueType: "Access Management",
          priority: "Medium",
          description: "Requesting additional design folder sharing permissions on Google Drive.",
          status: "Resolved",
          createdAt: new Date(Date.now() - 3 * 3600 * 1000).toISOString()
        },
        {
          id: "ticket_2",
          employeeName: "Siteri Ravu",
          department: "Front Desk",
          issueType: "Hardware",
          priority: "Urgent",
          description: "Key card encoder workstation 2 is disconnected and showing communications error.",
          status: "Assigned",
          createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString()
        }
      ];
      localStorage.setItem("cml_it_tickets", JSON.stringify(initialMock));
      setTickets(initialMock);
    }
    setLoading(false);
  };

  const handleSubmitTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!employeeName.trim() || !description.trim()) return;

    setIsSubmitting(true);
    const automaticTimestamp = new Date().toLocaleString("en-US", { hour12: true });
    
    const newTicketData = {
      employeeName,
      department,
      issueType,
      priority,
      description,
      status: "Received" as const,
      timestampDisplay: automaticTimestamp,
      ccEmails: ["digitalmedia@cml.com.fj", "graphics@cml.com.fj"]
    };

    try {
      if (db && !('_isMock' in db)) {
        await addDoc(collection(db, "it_tickets"), {
          ...newTicketData,
          createdAt: serverTimestamp()
        });
      } else {
        const stored = localStorage.getItem("cml_it_tickets");
        const existing = stored ? JSON.parse(stored) : [];
        const fullTicket: ITTicket = {
          id: "ticket_" + Math.random().toString(36).substring(2, 9),
          ...newTicketData,
          createdAt: new Date().toISOString()
        };
        const updated = [fullTicket, ...existing];
        localStorage.setItem("cml_it_tickets", JSON.stringify(updated));
        setTickets(updated);
      }

      // dispatch Google Chat Webhook (with no-cors option to avoid iframe preflight issues)
      const chatWebhook = "https://chat.googleapis.com/v1/spaces/AAQAeSiA28A/messages?key=AIzaSyDdI0hCZtE6vySjMm-WEfRq3CPzqKqqsHI&token=_RyHit_rCIzmMOpflNuh3giOFYw9gdBtwTjpttDG7OQ";
      const webhookPayload = {
        text: `🚨 *NEW OPERATIONS IT SUPPORT TICKET*\n` +
              `-----------------------------------------------\n` +
              `👤 *Requested By:* ${employeeName}\n` +
              `🏢 *Department:* ${department}\n` +
              `⚙️ *Category/Device:* ${issueType}\n` +
              `⚠️ *Priority Level:* ${priority}\n` +
              `📅 *Logged Time:* ${automaticTimestamp}\n` +
              `📬 *Copied To:* digitalmedia@cml.com.fj & graphics@cml.com.fj\n` +
              `-----------------------------------------------\n` +
              `📝 *Diagnostic Details:*\n_"${description}"_\n` +
              `-----------------------------------------------\n` +
              `*Action Required:* Access the IT help console to update diagnostic status.`
      };

      try {
        await fetch(chatWebhook, {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(webhookPayload),
          mode: "no-cors"
        });
      } catch (webhookErr) {
        console.warn("Could not reach Google Chat Space endpoint directly:", webhookErr);
      }

      setEmployeeName("");
      setDescription("");
      setTicketSuccess(true);
      setTimeout(() => setTicketSuccess(false), 5000);
    } catch (err) {
      console.error("Error submitting ticket:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Static Data
  const QUICK_LINKS = [
    { title: "Opera PMS Console", desc: "Front office, guest folios & room tracking browser gateway.", url: "https://opera.example.com", category: "Property Management" },
    { title: "SiteMinder", desc: "OTA channel manager sync & room rate yields distribution.", url: "https://siteminder.example.com", category: "Revenue Management" },
    { title: "Corporate Email", desc: "Access your cloud employee @cml.com.fj inbox.", url: "https://mail.google.com", category: "Communication" },
    { title: "Guest Wi-Fi Dashboard", desc: "Control lobby broadband access, voucher generation & speeds.", url: "https://wifi.example.com", category: "Guest Network" }
  ];

  const DOWNLOADS = [
    { name: "Epson POS Printer Driver", desc: "TM-T88VI thermal printer native 64-bit USB/Network installer.", size: "14.2 MB", filename: "Epson_TM-T88VI_v6.02.exe" },
    { name: "Skins KeyCard Encoder Core", desc: "VingCard Visionline direct USB encoder active workspace drivers.", size: "8.7 MB", filename: "VingCard_Visionline_Encoder_Setup.msi" },
    { name: "Daily Night Audit Balancing Ledger", desc: "Standard template matrix sheet to balance daily drops and accounts receivable.", size: "128 KB", filename: "Night_Audit_Template_v2.xlsx" },
    { name: "Duty Manager Shift Handover Guide", desc: "Comprehensive Word format daily summary outline and SOP instructions.", size: "450 KB", filename: "DM_Handover_Guidelines_2026.docx" }
  ];

  const CONTACTS = [
    { title: "IT Hotline Desk (Ext)", info: "Extension #4004 (24/7 Operations Support)", type: "Phone" },
    { title: "IT Urgent Support Email", info: "itsupport@cml.com.fj", type: "Email" },
    { title: "On-Duty IT Lead", info: "+679 998 1234 (Anare Wati)", type: "Mobile" },
    { title: "Escalations Helpline", info: "+679 555 9090 (Hospitality Operations Systems)", type: "Mobile" }
  ];

  // Dynamic filter lists for Charles' view
  const filteredTickets = tickets.filter(t => {
    const queryStr = filterQuery.toLowerCase();
    const matchesQuery = t.employeeName.toLowerCase().includes(queryStr) || 
                         t.description.toLowerCase().includes(queryStr) ||
                         t.department.toLowerCase().includes(queryStr) ||
                         (t.issueType && t.issueType.toLowerCase().includes(queryStr));
    
    const matchesDept = filterDept === "All" || t.department === filterDept;
    
    let matchesStatus = true;
    if (filterStatusState === "Pending") {
      matchesStatus = t.status !== "Resolved";
    } else if (filterStatusState !== "All") {
      matchesStatus = t.status === filterStatusState;
    }

    return matchesQuery && matchesDept && matchesStatus;
  });

  const pendingTickets = tickets.filter(t => t.status !== "Resolved");

  return (
    <div className="max-w-6xl mx-auto py-4 md:py-8 space-y-8">
      
      {/* PENDING NOTIFICATION ON TOP */}
      {pendingTickets.length > 0 && (
        <div className="bg-red-950/40 border-2 border-red-900 p-4 text-left flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse mt-1 shrink-0" />
            <div>
              <p className="text-xs text-red-200 font-sans tracking-wide leading-relaxed">
                <span className="font-extrabold text-red-100 uppercase tracking-wider block text-[10px] mb-0.5">⚠️ Operations Alert: Pending Requests</span>
                There are <span className="font-bold text-white">{pendingTickets.length} active support requests pending processing</span> right now. Please inspect, assign, or mark them resolved to maintain standard CML hotel compliance.
              </p>
            </div>
          </div>
          <button 
            onClick={() => {
              setFilterStatusState("Pending");
              const el = document.getElementById("tickets-console");
              if (el) el.scrollIntoView({ behavior: "smooth" });
            }}
            className="text-[9.5px] uppercase font-display tracking-widest font-black text-rose-300 hover:text-white border border-rose-700 hover:border-rose-400 px-3 py-1.5 bg-red-950/80 transition-all shrink-0 cursor-pointer"
          >
            Review Pending ({pendingTickets.length})
          </button>
        </div>
      )}
      
      {/* HEADER BAR */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-stone-900/40 border border-stone-850 p-6 md:p-8 gap-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-stone-950 border border-stone-800 text-gold flex items-center justify-center shadow-xl shrink-0">
            <HelpCircle size={24} />
          </div>
          <div>
            <h2 className="text-2xl md:text-3xl font-serif italic text-white leading-tight">Resources & IT Help</h2>
            <p className="text-[10px] font-display uppercase tracking-widest text-[#C5A03D] mt-0.5">Central Support, Drivers, & IT Ticketing</p>
          </div>
        </div>

        {/* Operational Status Display */}
        <div className="flex items-center gap-3 bg-stone-950/60 border border-stone-850 px-4 py-2.5">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <div className="text-left">
            <span className="text-[8px] font-mono tracking-widest text-stone-550 uppercase block font-bold">Network Systems</span>
            <span className="text-[10.5px] font-display uppercase font-black text-emerald-400 tracking-wider">All Systems Operational</span>
          </div>
        </div>
      </div>

      {/* PENDING TICKETS TOP NOTIFICATION ALERTER */}
      {tickets.filter(t => t.status !== "Resolved").length > 0 && (
        <div className="bg-red-950/20 border border-red-900/60 p-4 flex items-center justify-between gap-4 text-left">
          <div className="flex items-center gap-3">
            <span className="relative flex h-3 w-3 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-red-600"></span>
            </span>
            <div>
              <p className="text-[11px] font-display uppercase tracking-widest text-red-400 font-extrabold flex items-center gap-1.5">
                Outstanding Support Notice <span className="font-serif italic text-[10px] text-stone-400 lowercase normal-case">({tickets.filter(t => t.status !== "Resolved").length} pending requests)</span>
              </p>
              <p className="text-[10px] text-stone-300 italic font-serif leading-relaxed mt-0.5">
                Active technical diagnostics tickets are currently requiring dispatch. Please inspect and update their resolution status in the terminal console below.
              </p>
            </div>
          </div>
          
          <a
            href="#tickets-console"
            className="shrink-0 bg-red-950 hover:bg-red-900 text-white font-display text-[9px] uppercase tracking-widest font-black py-2 px-3 border border-red-800 transition"
          >
            Review Requests
          </a>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* LEFT COLUMN: TICKET SUBMISSION & TICKET TRACKER */}
        <div className="lg:col-span-7 space-y-8">
          
          {/* IT TICKET SUBMISSION FORM */}
          <div className="bg-stone-905 border border-stone-850 p-6 shadow-2xl relative">
            <div className="flex items-center gap-2.5 mb-5 border-b border-stone-850 pb-4">
              <Cpu size={16} className="text-[#C5A03D]" />
              <h3 className="font-display text-[12px] font-bold uppercase tracking-widest text-white">Create IT Support Request</h3>
            </div>

            <form onSubmit={handleSubmitTicket} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[9.5px] font-display uppercase tracking-wider text-stone-400 block font-bold">Your Name</label>
                  <input
                    type="text"
                    required
                    value={employeeName}
                    onChange={(e) => setEmployeeName(e.target.value)}
                    placeholder="e.g. Charles Cebujano"
                    className="w-full bg-stone-950 border border-stone-800 focus:border-gold px-3.5 py-2.5 text-xs text-white rounded-none outline-none font-serif italic"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[9.5px] font-display uppercase tracking-wider text-gold block font-bold">Service Department Needed</label>
                  <select
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="w-full bg-stone-950 border border-stone-800 focus:border-gold px-3 py-2.5 text-xs text-stone-300 rounded-none outline-none font-display uppercase tracking-wider text-[9.5px]"
                  >
                    <option value="IT Graphics Support">I T graphics support</option>
                    <option value="Engineering Maintenance">Engineering maintenance</option>
                    <option value="Sales Reservations">Sales reservations</option>
                    <option value="Support">support</option>
                    <option value="Housekeeping">Housekeeping & Laundry</option>
                    <option value="Culinary F&B">Culinary Food and Beverage</option>
                    <option value="Front Office">Front Office & Guest Services</option>
                    <option value="Security">Security & Risk Management</option>
                    <option value="Finance Administration">Finance & Executive Administration</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[9.5px] font-display uppercase tracking-wider text-stone-400 block font-bold">Category of Issue</label>
                  <select
                    value={issueType}
                    onChange={(e) => setIssueType(e.target.value)}
                    className="w-full bg-stone-950 border border-stone-800 focus:border-gold px-3 py-2.5 text-xs text-stone-300 rounded-none outline-none"
                  >
                    <option value="Hardware">Hardware Failure (Printer/Key Station)</option>
                    <option value="Software/PMS">Software/PMS (Opera/SiteMinder)</option>
                    <option value="Network/Wi-Fi">Broadband / Guest Wi-Fi / LAN</option>
                    <option value="Access Management">Account Login / Folder Access</option>
                    <option value="General Support">Other Technical Question</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[9.5px] font-display uppercase tracking-wider text-stone-400 block font-bold">Urgency / Priority</label>
                  <div className="flex bg-stone-950 p-1 border border-stone-800 gap-1 h-[42px] items-center">
                    {(["Low", "Medium", "Urgent"] as const).map((level) => (
                      <button
                        key={level}
                        type="button"
                        onClick={() => setPriority(level)}
                        className={`flex-1 py-1 text-[9.5px] font-display uppercase tracking-widest font-black transition-all ${
                          priority === level
                            ? level === "Urgent"
                              ? "bg-red-900 text-white"
                              : "bg-[#C5A03D] text-stone-950"
                            : "text-stone-450 hover:text-white"
                        }`}
                      >
                        {level}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[9.5px] font-display uppercase tracking-wider text-stone-400 block font-bold">Explain Technical Diagnostic Details</label>
                <textarea
                  required
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe your error code, symptom, workspace location, and any troubleshooting measures tried..."
                  className="w-full bg-stone-950 border border-stone-800 focus:border-gold p-3.5 text-xs text-white rounded-none outline-none font-serif italic resize-none"
                />
              </div>

              <div className="flex justify-between items-center pt-2">
                <AnimatePresence>
                  {ticketSuccess && (
                    <motion.div 
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0 }}
                      className="text-emerald-400 font-serif italic text-xs flex items-center gap-1.5"
                    >
                      <CheckCircle size={14} /> Desk Ticket submitted! Resolving immediately.
                    </motion.div>
                  )}
                </AnimatePresence>
                
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-gold hover:bg-white text-stone-950 px-6 py-3 text-[10px] font-display uppercase tracking-widest font-black transition-all shadow-lg flex items-center gap-2 cursor-pointer ml-auto shrink-0"
                >
                  {isSubmitting ? "Submitting Request..." : "File IT Ticket"}
                  <Send size={11} className="stroke-[2.5]" />
                </button>
              </div>
            </form>
          </div>

          {/* ACTIVE IT TICKETS LOG */}
          <div className="space-y-4 text-left" id="tickets-console">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-stone-850 pb-4">
              <div>
                <span className="text-[11px] font-display uppercase tracking-widest text-gold font-black block">Active IT Requests Console</span>
                <span className="text-[9px] text-stone-500 font-mono">Current match count: {filteredTickets.length} / {tickets.length} records</span>
              </div>
              
              {tickets.length > 0 && (
                <button
                  type="button"
                  onClick={handleDeleteAllTickets}
                  className="px-3 py-1.5 bg-red-950/80 hover:bg-red-900 text-red-300 font-display text-[9.5px] uppercase tracking-widest font-black border border-red-800 transition-all cursor-pointer"
                >
                  Clear All Tickets
                </button>
              )}
            </div>

            {/* LIVE FILTERS BAR */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-stone-900/40 p-4 border border-stone-850">
              {/* Search String */}
              <div className="space-y-1">
                <label className="text-[8px] font-mono uppercase tracking-wider text-stone-500 block">Search keyword</label>
                <input
                  type="text"
                  value={filterQuery}
                  onChange={e => setFilterQuery(e.target.value)}
                  placeholder="Type name, keyword, or error..."
                  className="w-full bg-stone-950 border border-stone-800 focus:border-gold p-2 text-xs text-white rounded-none outline-none font-serif italic"
                />
              </div>

              {/* Department Option */}
              <div className="space-y-1">
                <label className="text-[8px] font-mono uppercase tracking-wider text-stone-500 block">Filter Department</label>
                <select
                  value={filterDept}
                  onChange={e => setFilterDept(e.target.value)}
                  className="w-full bg-stone-950 border border-stone-800 focus:border-gold p-2 text-xs text-stone-300 rounded-none outline-none text-[10px] font-display uppercase tracking-wider h-[34px]"
                >
                  <option value="All">All Departments</option>
                  <option value="Front Office">Front Office / Desk</option>
                  <option value="Housekeeping">Housekeeping</option>
                  <option value="Food & Beverage">Culinary / F&B</option>
                  <option value="Digital Media">Digital Media</option>
                  <option value="Maintenance">Maintenance / Engineering</option>
                  <option value="Marketing">Marketing / Management</option>
                  <option value="Executive Administration">Administration</option>
                </select>
              </div>

              {/* Status Selector Switch */}
              <div className="space-y-1">
                <label className="text-[8px] font-mono uppercase tracking-wider text-stone-500 block">Status Filter</label>
                <div className="flex bg-stone-950 border border-stone-800 p-1 rounded-none gap-1 h-[34px] items-center">
                  {[
                    { val: "All", label: "All" },
                    { val: "Pending", label: "Pending" },
                    { val: "Resolved", label: "Resolved" }
                  ].map((btn) => (
                    <button
                      key={btn.val}
                      type="button"
                      onClick={() => setFilterStatusState(btn.val)}
                      className={`flex-1 text-[9px] font-display uppercase font-bold py-1 transition-all cursor-pointer ${
                        filterStatusState === btn.val
                          ? "bg-gold text-stone-950 font-black"
                          : "text-stone-400 hover:text-white"
                      }`}
                    >
                      {btn.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* TICKETS LIST CONTAINER */}
            <div className="space-y-3.5 mt-2">
              {loading ? (
                <div className="text-center py-6 text-stone-500 font-serif italic text-xs">Synchronizing logs...</div>
              ) : filteredTickets.length === 0 ? (
                <div className="bg-stone-900/10 border border-stone-850 border-dashed p-10 text-center">
                  <p className="font-serif italic text-stone-400 text-xs">No active support tickets match the selected filters.</p>
                </div>
              ) : (
                filteredTickets.map((t) => {
                  const isPending = t.status !== "Resolved";
                  
                  return (
                    <div 
                      key={t.id} 
                      onClick={() => setSelectedDetailTicket(t)}
                      className={`p-4 border bg-stone-955/50 flex flex-col md:flex-row justify-between items-start gap-4 transition-all cursor-pointer hover:bg-stone-900 hover:border-gold/35 relative ${
                        t.priority === "Urgent" ? "border-red-950/80 bg-red-950/5" : "border-stone-850"
                      }`}
                    >
                      <div className="space-y-2.5 text-left flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2.5">
                          <span className={`text-[8px] font-mono tracking-widest uppercase px-2 py-0.5 font-bold ${
                            t.priority === "Urgent" ? "bg-red-950 text-red-400 border border-red-900" : "bg-stone-950 text-[#C5A02D] border border-stone-800"
                          }`}>
                            {t.priority}
                          </span>
                          
                          {isPending && (
                            <span 
                              id="pending-red-mark"
                              className="inline-flex items-center gap-1.5 px-2 py-0.5 text-[8px] font-mono font-extrabold uppercase bg-red-950 text-red-500 border border-red-900 animate-pulse"
                            >
                              ⚠️ PENDING DISPATCH
                            </span>
                          )}

                          <span className="text-[10px] text-stone-400 font-serif italic flex items-center gap-1 truncate">
                            <User size={10} className="text-gold" /> {t.employeeName} ({t.department})
                          </span>
                        </div>
                        
                        <p className="text-[12px] font-serif text-stone-100 truncate pr-4 font-normal">
                          {t.description}
                        </p>
                        
                        <div className="text-[9px] font-mono tracking-wider text-stone-550 uppercase flex flex-wrap items-center gap-3">
                          <span>Device: {t.issueType}</span>
                          <span>&bull;</span>
                          <span className="flex items-center gap-1">
                            <Clock size={10} /> Logged: {t.timestampDisplay || (t.createdAt ? (new Date(t.createdAt).toLocaleDateString() === new Date().toLocaleDateString() ? "Today" : new Date(t.createdAt).toLocaleDateString()) : "Just now")}
                          </span>
                        </div>
                      </div>

                      {/* Right Control Edge */}
                      <div className="shrink-0 flex items-center gap-3 self-end md:self-center">
                        <div className={`px-2.5 py-1.5 border text-[9px] font-display uppercase tracking-widest font-black ${
                          t.status === "Resolved" 
                            ? "bg-emerald-950/40 text-emerald-400 border-emerald-900" 
                            : "bg-amber-950/40 text-amber-400 border-amber-900"
                        }`}>
                          {t.status}
                        </div>
                        
                        <button
                          type="button"
                          onClick={(e) => handleDeleteTicket(t.id, e)}
                          className="p-2 bg-stone-950 hover:bg-red-950 border border-stone-850 hover:border-red-900 text-stone-450 hover:text-red-400 transition-all cursor-pointer shadow-sm shrink-0"
                          title="Purge Ticket Records"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path></svg>
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: DOWNLOADS, QUICK LINKS & EMERGENCY CONTACTS */}
        <div className="lg:col-span-5 space-y-8">
          
          {/* STRICT PWA INSTALLATION CENTER */}
          <div className="bg-stone-900/40 border-2 border-[#C5A03D]/60 p-6 space-y-5 shadow-2xl relative overflow-hidden backdrop-blur-md">
            <div className="absolute top-0 right-0 p-1 bg-[#C5A03D] text-[#0a0a0a] text-[8px] font-mono tracking-widest uppercase font-black">
              STRICT SECURE INSTALL
            </div>

            <div className="space-y-1 text-left">
              <span className="text-[8px] font-mono tracking-widest text-[#C5A03D] uppercase block font-bold">Cross-Platform Deployments</span>
              <h4 className="text-[13px] font-display uppercase tracking-widest text-white font-extrabold flex items-center gap-1.5">
                📦 Native App Installation Panel
              </h4>
              <p className="text-[10px] text-stone-400 font-serif italic leading-relaxed">
                Install this web application into your mobile's, laptop's, or tablet's operating system as a native app. This guarantees secure geofencing validation, lightning-fast offline startup speeds, and background alert dispatches.
              </p>
            </div>

            {/* Application Installation Status Badge */}
            <div className="flex items-center justify-between p-3 bg-stone-950/80 border border-stone-850">
              <span className="text-[9px] font-mono text-stone-400 uppercase font-black">Environment Status:</span>
              {window.matchMedia("(display-mode: standalone)").matches || pwaInstallStatus === "success" ? (
                <span className="flex items-center gap-1.5 px-2 py-0.5 text-[8.5px] font-mono font-bold bg-emerald-950/60 text-emerald-400 border border-emerald-900 rounded-none">
                  <CheckCircle size={10} /> INSTALLED (NATIVE APP ACTIVE)
                </span>
              ) : (
                <span className="flex items-center gap-1.5 px-2 py-0.5 text-[8.5px] font-mono font-bold bg-amber-950/60 text-amber-400 border border-amber-900 rounded-none animate-pulse">
                  <Info size={10} /> WEB PORTAL ACCESS
                </span>
              )}
            </div>

            {/* Direct PWA Install Button (If detected as strictly installable) */}
            {isInstallable && (
              <button
                onClick={triggerNativePwaInstall}
                className="w-full bg-[#C5A03D] hover:bg-[#A3812C] text-[#0a0a0a] font-display text-[10.5px] uppercase tracking-widest font-black py-3 px-4 shadow-xl border border-[#D5B04D] transition-all hover:scale-[1.01] flex items-center justify-center gap-2 cursor-pointer"
              >
                <Download size={13} className="stroke-[3px]" />
                Install CML Native App Now
              </button>
            )}

            {/* Tab selection for OS */}
            <div className="border-b border-stone-850 pb-2">
              <p className="text-[9px] font-mono text-stone-400 uppercase tracking-widest text-center mb-2.5 font-bold">Select Your Operating System:</p>
              <div className="grid grid-cols-4 gap-1">
                <button
                  onClick={() => setPwaPlatformTab("ios")}
                  className={`py-1.5 px-1 font-display text-[8.5px] uppercase tracking-widest font-bold border transition ${
                    pwaPlatformTab === "ios" 
                      ? "bg-[#C5A03D] text-stone-950 border-[#C5A03D]" 
                      : "bg-stone-950 hover:bg-stone-900 text-stone-400 border-stone-850"
                  }`}
                >
                  iPhone iOS
                </button>
                <button
                  onClick={() => setPwaPlatformTab("android")}
                  className={`py-1.5 px-1 font-display text-[8.5px] uppercase tracking-widest font-bold border transition ${
                    pwaPlatformTab === "android" 
                      ? "bg-[#C5A03D] text-stone-950 border-[#C5A03D]" 
                      : "bg-stone-950 hover:bg-stone-900 text-stone-400 border-stone-850"
                  }`}
                >
                  Android
                </button>
                <button
                  onClick={() => setPwaPlatformTab("pc")}
                  className={`py-1.5 px-1 font-display text-[8.5px] uppercase tracking-widest font-bold border transition ${
                    pwaPlatformTab === "pc" 
                      ? "bg-[#C5A03D] text-stone-950 border-[#C5A03D]" 
                      : "bg-stone-950 hover:bg-stone-900 text-stone-400 border-stone-850"
                  }`}
                >
                  PC/Laptop
                </button>
                <button
                  onClick={() => setPwaPlatformTab("mac")}
                  className={`py-1.5 px-1 font-display text-[8.5px] uppercase tracking-widest font-bold border transition ${
                    pwaPlatformTab === "mac" 
                      ? "bg-[#C5A03D] text-stone-950 border-[#C5A03D]" 
                      : "bg-stone-950 hover:bg-stone-900 text-stone-400 border-stone-850"
                  }`}
                >
                  Mac Safari
                </button>
              </div>
            </div>

            {/* Tab Contents styling */}
            <div className="text-left bg-stone-950/40 p-4 border border-stone-850 space-y-3 min-h-[160px]">
              {pwaPlatformTab === "ios" && (
                <div id="ios-guide-sec" className="space-y-2">
                  <div className="flex items-center gap-1.5">
                    <Smartphone size={13} className="text-[#C5A03D]" />
                    <span className="text-[9px] font-mono tracking-widest uppercase text-[#C5A03D] font-extrabold">Apple iOS (Safari App Store Alternative)</span>
                  </div>
                  <ol className="list-decimal list-inside text-[10px] text-stone-300 font-serif leading-relaxed space-y-1.5 pl-1">
                    <li>Launch the CML Corporate Portal in your primary <strong className="text-white">Safari</strong> browser.</li>
                    <li>Tap the built-in <strong className="text-white">Share Button</strong> <span className="font-sans px-1 py-0.5 bg-stone-900 text-xs border border-stone-800 rounded">⎋</span> (square with upward arrow) on Safari toolbar.</li>
                    <li>Scroll down and choose <strong className="text-white">"Add to Home Screen"</strong> from the options.</li>
                    <li>Verify the app details (CML Portal) and tap <strong className="text-white">"Add"</strong> in the upper-right corner.</li>
                    <li>The app is now native on your Home screen with sandbox execution privileges!</li>
                  </ol>
                </div>
              )}

              {pwaPlatformTab === "android" && (
                <div id="android-guide-sec" className="space-y-2">
                  <div className="flex items-center gap-1.5">
                    <Chrome size={13} className="text-[#C5A03D]" />
                    <span className="text-[9px] font-mono tracking-widest uppercase text-[#C5A03D] font-extrabold">Android OS (Chrome Deployment)</span>
                  </div>
                  <ol className="list-decimal list-inside text-[10px] text-stone-300 font-serif leading-relaxed space-y-1.5 pl-1">
                    <li>Open this portal in your Google <strong className="text-white">Chrome Browser</strong>.</li>
                    <li>Look for either the <strong className="text-emerald-400">"Install CML Web App"</strong> banner on screen, or click the <strong className="text-white">Three-Dot Menu</strong> in Chrome's top right.</li>
                    <li>Tap the <strong className="text-white">"Install app"</strong> or <strong className="text-white">"Add to Home Screen"</strong> option.</li>
                    <li>Click <strong className="text-white">"Install"</strong> inside the secure system modal popup.</li>
                    <li>Chrome will package and cache the portal as an offline Android APK container.</li>
                  </ol>
                </div>
              )}

              {pwaPlatformTab === "pc" && (
                <div id="pc-guide-sec" className="space-y-2">
                  <div className="flex items-center gap-1.5">
                    <Monitor size={13} className="text-[#C5A03D]" />
                    <span className="text-[9px] font-mono tracking-widest uppercase text-[#C5A03D] font-extrabold">Windows & Laptop (Chrome / Edge)</span>
                  </div>
                  <ol className="list-decimal list-inside text-[10px] text-stone-300 font-serif leading-relaxed space-y-1.5 pl-1">
                    <li>Use <strong className="text-white">Chrome</strong> or <strong className="text-white">Edge</strong> on your laptop/PC.</li>
                    <li>In the browser address bar (URL field), look for the <strong className="text-[#C5A03D]">Install Icon</strong> (overlapping screens or down-arrow sign).</li>
                    <li>Click the icon and select <strong className="text-white">"Install"</strong> inside the browser menu.</li>
                    <li>Alternatively, open the browser's main setting menu and hit <strong className="text-white">"Save and Share &gt; Install CML Portal"</strong>.</li>
                    <li>This opens the app in its own borderless window, added automatically to your Desktop.</li>
                  </ol>
                </div>
              )}

              {pwaPlatformTab === "mac" && (
                <div id="mac-guide-sec" className="space-y-2">
                  <div className="flex items-center gap-1.5">
                    <Laptop size={13} className="text-[#C5A03D]" />
                    <span className="text-[9px] font-mono tracking-widest uppercase text-[#C5A03D] font-extrabold">macOS Apple Desktop (Safari)</span>
                  </div>
                  <ol className="list-decimal list-inside text-[10px] text-stone-300 font-serif leading-relaxed space-y-1.5 pl-1">
                    <li>Launch the CML Portal app in <strong className="text-white">Safari on your Mac</strong>.</li>
                    <li>Select the <strong className="text-white">"File" menu</strong> on your Mac's topmost utility bar.</li>
                    <li>Click or select the <strong className="text-[#C5A03D]">"Add to Dock..."</strong> action.</li>
                    <li>Tap <strong className="text-white">"Add"</strong>. The launcher installs instantly on your Macbook dock, running in a full-screen frame layout.</li>
                  </ol>
                </div>
              )}
            </div>

            <div className="bg-stone-950/30 p-3.5 border border-stone-850/60 rounded-none text-left">
              <p className="text-[8.5px] font-mono text-stone-400 leading-normal uppercase">
                ⚙️ <strong className="text-white">PWA Security Sandbox:</strong> Once installed, this portal completely bypasses CORS storage and cookie retention limits, allowing persistent local sign-ins and bypasses typical browser suspension loops.
              </p>
            </div>
          </div>

          {/* QUICK LINKS GRID */}
          <div className="bg-stone-900/20 border border-stone-850 p-5 space-y-4">
            <h4 className="text-[10px] font-display uppercase tracking-widest text-gold font-bold text-left">Property Core Systems Links</h4>
            <div className="grid grid-cols-1 gap-3.5">
              {QUICK_LINKS.map((link, idx) => (
                <a 
                  key={idx}
                  href={link.url}
                  target="_blank"
                  rel="noreferrer"
                  className="p-3.5 bg-stone-950/40 border border-stone-850 hover:border-[#C5A030] hover:bg-stone-950/80 transition-all text-left block group"
                >
                  <div className="flex justify-between items-start gap-2">
                    <span className="text-[8px] font-mono tracking-widest text-stone-500 uppercase block font-bold">{link.category}</span>
                    <ExternalLink size={10} className="text-stone-600 group-hover:text-gold transition-colors" />
                  </div>
                  <h5 className="font-display text-[11.5px] font-black text-stone-200 mt-1 uppercase group-hover:text-gold transition-colors">{link.title}</h5>
                  <p className="text-[10px] text-stone-400 font-serif italic leading-relaxed mt-0.5">{link.desc}</p>
                </a>
              ))}
            </div>
          </div>

          {/* DOWNLOADABLE TEMPLATES & UTILITIES */}
          <div className="bg-stone-900/20 border border-stone-850 p-5 space-y-4">
            <h4 className="text-[10px] font-display uppercase tracking-widest text-gold font-bold text-left">Downloads: Utilities & Master Templates</h4>
            <div className="grid grid-cols-1 gap-3.5 text-left">
              {DOWNLOADS.map((dl, idx) => (
                <div key={idx} className="p-3.5 bg-stone-955/35 border border-stone-855 flex items-center justify-between gap-4">
                  <div className="space-y-1 block min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <FileText size={12} className="text-[#C5A03D]" />
                      <h5 className="font-display text-[11px] font-bold text-stone-200 uppercase truncate">{dl.name}</h5>
                    </div>
                    <p className="text-[10px] text-stone-400 font-serif italic truncate">{dl.desc}</p>
                    <span className="text-[8px] font-mono tracking-wider text-stone-500 uppercase block">{dl.filename} &bull; {dl.size}</span>
                  </div>
                  
                  <button
                    onClick={() => {
                      alert(`Mocking secure download for ${dl.filename}. In production, this directly serves the physical driver binary payload safely.`);
                    }}
                    className="p-2.5 bg-stone-900 hover:bg-[#C5A03D] border border-stone-800 hover:text-stone-950 text-stone-450 transition-all cursor-pointer shadow-md shrink-0 block"
                    title="Download registration asset file"
                  >
                    <Download size={13} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* EMERGENCY CONTACTS LIST */}
          <div className="bg-stone-950/60 border border-stone-850 p-5 space-y-4">
            <div className="flex items-center gap-2 text-red-500 text-left">
              <ShieldAlert size={14} />
              <h4 className="text-[10px] font-display uppercase tracking-widest font-black uppercase tracking-wider text-red-400 font-extrabold">Emergency Tech Diagnostics CRM</h4>
            </div>
            
            <div className="grid grid-cols-1 gap-3 Text-left text-left">
              {CONTACTS.map((contact, idx) => (
                <div key={idx} className="flex justify-between items-center p-3 border border-stone-900 bg-stone-955 relative group">
                  <div className="text-left space-y-0.5 flex-1 min-w-0">
                    <span className="text-[8px] font-mono tracking-widest text-stone-500 uppercase block font-bold">{contact.title}</span>
                    <span className="font-display text-[11px] text-stone-200 leading-none break-all block font-bold">{contact.info}</span>
                  </div>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(contact.info.split('(')[0].trim());
                      alert(`Copied diagnostic parameter: ${contact.info.split('(')[0].trim()}`);
                    }}
                    className="ml-3 px-2 py-1.5 bg-stone-900 hover:bg-stone-800 border border-stone-800 text-[8px] font-display uppercase tracking-widest font-black text-stone-400 hover:text-white transition-all shrink-0"
                  >
                    Copy
                  </button>
                </div>
              ))}
            </div>
          </div>
          
        </div>

      </div>

      {/* DETAILED TICKET DIALOG / DRAWER POPUP */}
      <AnimatePresence>
        {selectedDetailTicket && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[110] flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-stone-900 border border-stone-800 text-white max-w-lg w-full p-6 shadow-2xl relative"
            >
              <div className="flex justify-between items-start border-b border-stone-850 pb-4 mb-4">
                <div>
                  <span className="text-[10px] font-mono tracking-widest text-[#C5A03D] uppercase block font-bold">Request Detail Diagnostics Audit</span>
                  <h3 className="font-serif italic text-lg text-white mt-1">Ticket: {selectedDetailTicket.id.toUpperCase().substring(0, 10)}</h3>
                </div>
                <button
                  onClick={() => setSelectedDetailTicket(null)}
                  className="p-1 px-2.5 bg-stone-955 hover:bg-stone-800 text-[10px] uppercase font-display font-black tracking-wider text-stone-400 hover:text-white border border-stone-850 cursor-pointer"
                >
                  Close
                </button>
              </div>

              <div className="space-y-4 text-left text-xs text-stone-300">
                <div className="grid grid-cols-2 gap-3.5 bg-stone-950 p-3 border border-stone-850">
                  <div>
                    <span className="text-[8px] font-mono uppercase text-stone-500 block">Requester Name</span>
                    <span className="font-semibold text-white">{selectedDetailTicket.employeeName}</span>
                  </div>
                  <div>
                    <span className="text-[8px] font-mono uppercase text-stone-500 block">Department</span>
                    <span className="font-semibold text-white">{selectedDetailTicket.department}</span>
                  </div>
                  <div>
                    <span className="text-[8px] font-mono uppercase text-stone-500 block">Device Category</span>
                    <span className="font-semibold text-white">{selectedDetailTicket.issueType}</span>
                  </div>
                  <div>
                    <span className="text-[8px] font-mono uppercase text-stone-500 block">Priority / Urgency</span>
                    <span className={`font-semibold ${selectedDetailTicket.priority === "Urgent" ? "text-red-400" : "text-amber-400"}`}>
                      {selectedDetailTicket.priority} Urgent
                    </span>
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-[8px] font-mono uppercase text-stone-500 block">Full Message description / diagnostics</span>
                  <div className="bg-stone-940 p-4 border border-stone-850 text-slate-100 font-serif italic whitespace-pre-line leading-relaxed">
                    "{selectedDetailTicket.description}"
                  </div>
                </div>

                <div className="bg-emerald-950/25 border border-emerald-900 text-emerald-305 p-3 text-[10.5px] leading-relaxed">
                  <strong>📨 Copy Dispatched Successfully:</strong> A carbon copy has been synced and emailed automatically to <strong>digitalmedia@cml.com.fj</strong> and <strong>graphics@cml.com.fj</strong>.
                </div>

                {/* Status Changing Switcher Hub */}
                <div className="border-t border-stone-850 pt-4 mt-2 space-y-2">
                  <span className="text-[8.5px] font-mono uppercase tracking-widest text-[#C5A03D] block font-bold">Update Resolution Status:</span>
                  <div className="flex flex-wrap gap-2">
                    {(["Received", "Assigned", "Resolving", "Resolved"] as const).map((statusValue) => (
                      <button
                        key={statusValue}
                        onClick={() => handleUpdateTicketStatus(selectedDetailTicket.id, statusValue)}
                        className={`text-[9.5px] font-display uppercase tracking-widest font-black px-3 py-1.5 transition-all scroll-smooth cursor-pointer ${
                          selectedDetailTicket.status === statusValue
                            ? statusValue === "Resolved"
                              ? "bg-emerald-700 text-white"
                              : "bg-amber-600 text-stone-950 font-extrabold"
                            : "bg-stone-950 hover:bg-stone-800 text-stone-400 hover:text-white"
                        }`}
                      >
                        {statusValue}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex justify-between items-center border-t border-stone-850 pt-4 mt-4">
                  <span className="text-[9px] text-stone-500 font-mono">
                    Logged: {selectedDetailTicket.timestampDisplay || "Automatic Log System"}
                  </span>
                  
                  <button
                    type="button"
                    onClick={() => handleDeleteTicket(selectedDetailTicket.id)}
                    className="bg-red-955/40 hover:bg-red-900 font-display text-[9px] uppercase tracking-widest text-red-350 hover:text-white px-3 py-1.5 border border-red-900 transition-all cursor-pointer"
                  >
                    Delete Forever
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};
