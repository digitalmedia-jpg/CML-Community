import { ConfirmModal } from "./ConfirmModal";
import React, { useState, useEffect, useRef } from "react";
import { 
  db, 
  auth,
  collection, 
  addDoc, 
  getDocs, 
  deleteDoc, 
  doc, 
  query, 
  orderBy,
  onSnapshot
} from "../lib/firebase";
import { motion, AnimatePresence } from "motion/react";
import { 
  FileText, 
  Download, 
  Printer, 
  Search, 
  Trash2, 
  History, 
  Plus, 
  Check, 
  AlertCircle, 
  Calendar, 
  ChevronLeft, 
  User, 
  Clock, 
  Users,
  ChevronRight,
  ShieldAlert,
  HelpCircle,
  FileSpreadsheet
} from "lucide-react";

// Types for submissions
interface FormSubmission {
  id: string;
  formId: string;
  formName: string;
  filledBy: string;
  staffName?: string;
  timestamp: string;
  data: Record<string, any>;
  companyId: string;
}

const RAMADA_RED = "#D11242";

// Definition of the 12 forms based on official attachments
const RAMADA_FORMS_SPEC = [
  {
    id: "adjustment",
    name: "Adjustment Request Form",
    category: "Financial & Front Office",
    description: "Used to request adjustments for billing, posting errors, discrepancy, or incorrect guest folio postings.",
    icon: FileSpreadsheet
  },
  {
    id: "coaching",
    name: "Coaching Note",
    category: "Human Resources",
    description: "Records disciplinary coaching conversations, areas of discussion, improvements required, and staff feedback.",
    icon: User
  },
  {
    id: "discussion",
    name: "Discussion Note",
    category: "Human Resources",
    description: "Detailed 15-point structured meeting document to review performance, training, or corrective strategies.",
    icon: Users
  },
  {
    id: "guest-feedback",
    name: "Guest Feedback Form",
    category: "Guest Relations",
    description: "Documents guest praise, compliments, complaints or suggestions along with staff receiving details.",
    icon: HelpCircle
  },
  {
    id: "incident-report",
    name: "Incident Report",
    category: "Operations & Safety",
    description: "Formal document used to log on-site accidents, property damage, guest complaints, and supervisor logs.",
    icon: ShieldAlert
  },
  {
    id: "line-understanding",
    name: "Line of Understanding",
    category: "Human Resources",
    description: "Advanced performance warning or clear boundary layout outlining repeated issues and action required.",
    icon: FileText
  },
  {
    id: "managers-report",
    name: "Manager's Report",
    category: "Management Logs",
    description: "Direct management incident, audit, shift, or operations logging form for department supervisors.",
    icon: FileText
  },
  {
    id: "pre-employment",
    name: "Pre-Employment Declaration Form",
    category: "Human Resources",
    description: "Mandatory pre-hiring verification of criminal history, police check consent, medical conditions, and pregnancy status.",
    icon: FileText
  },
  {
    id: "staff-feedback",
    name: "Staff Feedback Form",
    category: "Human Resources",
    description: "Confidential feedback form populated directly by employees to share suggestions or internal reports with management.",
    icon: User
  },
  {
    id: "staff-grievance",
    name: "Staff Grievance Form",
    category: "Human Resources",
    description: "Empowers employees to raise formal complaints, grievances, or work disputes directly to the HOD or General Manager.",
    icon: ShieldAlert
  },
  {
    id: "supervisors-report",
    name: "Supervisors Report",
    category: "Management Logs",
    description: "HOD and shift leader report documenting employee performance incidents or structural concerns with action suggested.",
    icon: FileText
  },
  {
    id: "training-form",
    name: "Training Form",
    category: "Operations & Safety",
    description: "Captures training attendance lists, topics discussed, trainer signatures, and general learning logs.",
    icon: Users
  }
];

export const RamadaFormsSuite: React.FC<{ companySecret: string }> = ({ companySecret }) => {
  const [activeFormId, setActiveFormId] = useState<string | null>(null);
  const [currentView, setCurrentView] = useState<"catalog" | "write" | "history">("catalog");
  const [submissions, setSubmissions] = useState<FormSubmission[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSubmission, setSelectedSubmission] = useState<FormSubmission | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);
  
  // Dynamic fields state
  const [formData, setFormData] = useState<Record<string, any>>({});
  
  // Custom states for dynamic lists
  const [discussionPoints, setDiscussionPoints] = useState<string[]>(Array(15).fill(""));
  const [discussionParticipants, setDiscussionParticipants] = useState<Array<{ name: string; d1: boolean; d2: boolean; d3: boolean }>>([
    { name: "", d1: false, d2: false, d3: false }
  ]);
  const [trainingParticipants, setTrainingParticipants] = useState<Array<{ name: string; signature: string }>>([
    { name: "", signature: "" }
  ]);

  const printAreaRef = useRef<HTMLDivElement>(null);

  // Load submissions from Firestore
  useEffect(() => {
    if (!db) return;
    const q = query(collection(db, "ramada_form_submissions"), orderBy("timestamp", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(docDoc => ({
        id: docDoc.id,
        ...docDoc.data()
      })) as FormSubmission[];
      
      // Filter by company profile
      const filtered = docs.filter(docDoc => docDoc.companyId === (companySecret || "cml"));
      setSubmissions(filtered);
    }, (err) => {
      console.warn("Submissions loading bypassed or in mock fallback:", err);
    });

    return () => unsubscribe();
  }, [companySecret]);

  // Set default form structure when active form changes
  useEffect(() => {
    if (!activeFormId) return;
    
    // Default form configuration
    const defaults: Record<string, any> = {};
    const defaultDate = new Date().toISOString().split("T")[0];
    const userEmail = auth?.currentUser?.email || "Staff Member";
    
    defaults.date = defaultDate;
    defaults.reportedBy = userEmail;
    defaults.timestamp = new Date().toISOString();
    
    switch (activeFormId) {
      case "adjustment":
        defaults.requestedBy = userEmail;
        defaults.department = "";
        defaults.guestName = "";
        defaults.confirmationNum = "";
        defaults.roomNum = "";
        defaults.checkInDate = defaultDate;
        defaults.checkOutDate = defaultDate;
        defaults.adjustmentType = "Rate Adjustment";
        defaults.reason = "";
        defaults.incorrectAmountA = "0";
        defaults.correctAmountB = "0";
        defaults.adjustmentAmount = "0";
        defaults.approvedBy = "";
        defaults.dateApproved = defaultDate;
        break;
      case "coaching":
        defaults.department = "";
        defaults.staffName = "";
        defaults.discussionAreas = "With various discussions and line of understanding given, the following concerns have still been ignored and neglected by you:";
        defaults.staffFeedback = "";
        defaults.areasImprove = "";
        defaults.staffSignature = "";
        defaults.signatureDate = defaultDate;
        defaults.witnessName = "";
        defaults.witnessSignature = "";
        defaults.witnessPosition = "";
        defaults.witnessDate = defaultDate;
        break;
      case "discussion":
        defaults.name = "";
        defaults.conductedBy = userEmail;
        defaults.readUnderstoodByDate = defaultDate;
        setDiscussionPoints(Array(15).fill(""));
        setDiscussionParticipants([{ name: "", d1: false, d2: false, d3: false }]);
        break;
      case "guest-feedback":
        defaults.reportedByName = "";
        defaults.details = "";
        defaults.ackName = "";
        defaults.guestSignature = "";
        defaults.guestSigDate = defaultDate;
        defaults.receivedByName = "";
        defaults.receivedDepartment = "";
        defaults.receivedDate = defaultDate;
        break;
      case "incident-report":
        defaults.reportedByName = userEmail;
        defaults.incidentDetails = "";
        defaults.supervisorsReport = "";
        defaults.ackName = "";
        defaults.staffSignature = "";
        defaults.signatureDate = defaultDate;
        defaults.receivedByName = "";
        defaults.receivedDepartment = "";
        defaults.receivedDate = defaultDate;
        break;
      case "line-understanding":
        defaults.name = "";
        defaults.hodManager = userEmail;
        defaults.issuesDiscussed = "Further to numerous discussions held, the following concerns are still ongoing/repeated by you:";
        defaults.staffFeedback = "";
        defaults.managerFeedback = "";
        defaults.ackName = "";
        defaults.staffSignature = "";
        defaults.deptManagerName = "";
        defaults.administrativeManagerName = "";
        defaults.staffSigDate = defaultDate;
        defaults.managersSigDate = defaultDate;
        defaults.adminSigDate = defaultDate;
        break;
      case "managers-report":
        defaults.reportedBy = userEmail;
        defaults.concernedStaffName = "";
        defaults.report = "";
        defaults.ackName = "";
        defaults.signatureDate = defaultDate;
        defaults.receivedByName = "";
        defaults.department = "";
        defaults.signature = "";
        defaults.adminManager = "";
        break;
      case "pre-employment":
        defaults.applicantName = "";
        defaults.dob = "1995-01-01";
        defaults.address = "";
        defaults.contactNumber = "";
        defaults.crimNeverConvicted = true;
        defaults.crimConvicted = false;
        defaults.crimDetails = "";
        defaults.consentPoliceCheck = true;
        defaults.consentInvestigation = true;
        defaults.consentNotWithheld = true;
        defaults.pregNotExpecting = true;
        defaults.pregExpecting = false;
        defaults.pregDetails = "";
        defaults.medNoCondition = true;
        defaults.medHasCondition = false;
        defaults.medDetails = "";
        defaults.signature = "";
        defaults.date = defaultDate;
        break;
      case "staff-feedback":
      case "staff-grievance":
        defaults.reportedByName = userEmail;
        defaults.details = "";
        defaults.ackName = "";
        defaults.staffSignature = "";
        defaults.staffSigDate = defaultDate;
        defaults.receivedByName = "";
        defaults.receivedDepartment = "";
        defaults.receivedDate = defaultDate;
        break;
      case "supervisors-report":
        defaults.reportedByName = userEmail;
        defaults.concernedStaffName = "";
        defaults.report = "";
        defaults.actionRequired = "";
        defaults.staffName = "";
        defaults.staffSignature = "";
        defaults.staffSigDate = defaultDate;
        defaults.adminName = "";
        defaults.adminDept = "";
        defaults.adminSignature = "";
        defaults.adminSigDate = defaultDate;
        break;
      case "training-form":
        defaults.department = "";
        defaults.employeesPresent = "";
        defaults.topicsSubject = "";
        defaults.conductedBy = userEmail;
        defaults.topicsDetails = "";
        defaults.staffName = "";
        defaults.staffSignature = "";
        defaults.staffSigDate = defaultDate;
        defaults.deptManagerName = "";
        defaults.deptManagerSignature = "";
        defaults.deptManagerSigDate = defaultDate;
        defaults.adminManagerName = "";
        defaults.adminManagerSignature = "";
        defaults.adminManagerSigDate = defaultDate;
        setTrainingParticipants([{ name: "", signature: "" }]);
        break;
    }
    
    setFormData(defaults);
  }, [activeFormId]);

  // Handle live calculation on adjustment form
  const handleAmtChange = (field: "incorrectAmountA" | "correctAmountB", value: string) => {
    const updated = { ...formData, [field]: value };
    const a = parseFloat(updated.incorrectAmountA) || 0;
    const b = parseFloat(updated.correctAmountB) || 0;
    const diff = b - a;
    updated.adjustmentAmount = diff.toFixed(2);
    setFormData(updated);
  };

  const handleSaveSubmission = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setMsg(null);

    try {
      const activeSpec = RAMADA_FORMS_SPEC.find(s => s.id === activeFormId);
      if (!activeSpec) throw new Error("Invalid form selected");

      // Inject extra dynamic arrays
      const finalData = { ...formData };
      if (activeFormId === "discussion") {
        finalData.discussionPoints = discussionPoints;
        finalData.discussionParticipants = discussionParticipants;
      } else if (activeFormId === "training-form") {
        finalData.trainingParticipants = trainingParticipants;
      }

      const submissionPayload = {
        formId: activeFormId,
        formName: activeSpec.name,
        filledBy: auth?.currentUser?.email || "Anonymous Staff",
        staffName: formData.staffName || formData.userName || formData.applicantName || formData.name || formData.reportedByName || auth?.currentUser?.email || "N/A",
        timestamp: new Date().toISOString(),
        data: finalData,
        companyId: companySecret || "cml"
      };

      await addDoc(collection(db, "ramada_form_submissions"), submissionPayload);
      
      setMsg({ type: "success", text: `${activeSpec.name} submitted and recorded securely!` });
      setTimeout(() => {
        setCurrentView("history");
        setActiveFormId(null);
        setMsg(null);
      }, 1500);
    } catch (err: any) {
      console.error("Error saving form submission:", err);
      setMsg({ type: "error", text: "Failed to record submission. Please check connection and try again." });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteSubmissionConfirm = async () => {
    if (!deleteTarget) return;
    try {
      await deleteDoc(doc(db, "ramada_form_submissions", deleteTarget.id));
    } catch (err) {
      console.error("Error deleting submission:", err);
    } finally {
      setDeleteTarget(null);
    }
  };

  const triggerPrint = () => {
    window.print();
  };

  const triggerDownloadPDF = () => {
    const activeSpec = RAMADA_FORMS_SPEC.find(s => s.id === activeFormId);
    const formTitle = activeSpec ? activeSpec.name.replace(/[^A-Za-z0-9]/g, '_') : 'Ramada_Form';
    const staffName = String(formData.staffName || formData.userName || formData.applicantName || formData.name || formData.reportedByName || "Record").replace(/[^A-Za-z0-9]/g, '_');
    const dateStr = String(formData.date || new Date().toISOString().split('T')[0]);
    const originalTitle = document.title;
    
    // Set document title temporarily to ensure clean PDF export naming
    document.title = `Ramada_${formTitle}_${staffName}_${dateStr}`;
    
    window.print();
    
    // Restore original title
    setTimeout(() => {
      document.title = originalTitle;
    }, 1000);
  };

  // Filtered submissions
  const filteredSubmissions = submissions.filter(sub => {
    const term = searchQuery.toLowerCase();
    return (
      sub.formName.toLowerCase().includes(term) ||
      sub.filledBy.toLowerCase().includes(term) ||
      (sub.staffName && sub.staffName.toLowerCase().includes(term)) ||
      sub.timestamp.includes(term)
    );
  });

  return (
    <div className="w-full bg-slate-50 min-h-screen text-slate-900 pb-20">
      
      {/* Dynamic Header Toolbar */}
      <div className="bg-white border-b border-slate-200 py-6 px-8 sticky top-0 z-10 no-print flex flex-col md:flex-row justify-between items-center gap-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-[#D11242]/10 rounded-lg text-[#D11242]">
            <FileText size={24} />
          </div>
          <div>
            <h1 className="text-xl font-serif text-slate-950 font-semibold tracking-wide flex items-center gap-2">
              Ramada Suites Official Digital Forms
            </h1>
            <p className="text-[10px] uppercase font-display tracking-widest text-[#D11242] font-extrabold">
              SAY HELLO TO RED® • Authorized Personnel Portal
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setCurrentView("catalog");
              setActiveFormId(null);
              setSelectedSubmission(null);
            }}
            className={`px-4 py-2 font-display text-[10px] tracking-widest font-black uppercase rounded-sm border ${
              currentView === "catalog" 
                ? "bg-[#D11242] text-white border-[#D11242]" 
                : "bg-white text-slate-700 hover:bg-slate-100 border-slate-200"
            } transition-all`}
          >
            Forms Catalog
          </button>
          
          <button
            onClick={() => {
              setCurrentView("history");
              setActiveFormId(null);
              setSelectedSubmission(null);
            }}
            className={`px-4 py-2 font-display text-[10px] tracking-widest font-black uppercase rounded-sm border flex items-center gap-2 ${
              currentView === "history" 
                ? "bg-[#D11242] text-white border-[#D11242]" 
                : "bg-white text-slate-700 hover:bg-slate-100 border-slate-200"
            } transition-all`}
          >
            <History size={12} />
            Submission History ({submissions.length})
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 mt-10">
        
        {/* VIEW 1: Catalog */}
        {currentView === "catalog" && (
          <div className="space-y-8">
            <div className="text-center max-w-xl mx-auto space-y-3 mb-10">
              <span className="text-[10px] font-display uppercase tracking-[0.25em] text-[#D11242] font-black">
                Interactive Template Center
              </span>
              <h2 className="text-3xl font-serif italic text-slate-950">Select an Official Hotel Form</h2>
              <p className="text-slate-500 text-xs leading-relaxed">
                All forms below are styled precisely to Wyndham and Ramada standard guidelines, including embedded digital sign-offs, automatic math evaluation, history tracking, and native browser printing.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {RAMADA_FORMS_SPEC.map((spec) => {
                const Icon = spec.icon;
                return (
                  <motion.div
                    key={spec.id}
                    whileHover={{ y: -4 }}
                    className="bg-white border border-slate-200/80 rounded-xl p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between hover:border-[#D11242]/30 group"
                  >
                    <div className="space-y-4">
                      <div className="flex justify-between items-start">
                        <div className="p-3 bg-rose-50 text-[#D11242] rounded-lg group-hover:bg-[#D11242] group-hover:text-white transition-colors">
                          <Icon size={20} />
                        </div>
                        <span className="text-[8px] font-display uppercase tracking-widest bg-slate-100 px-2.5 py-1 text-slate-600 rounded-full font-bold">
                          {spec.category}
                        </span>
                      </div>
                      
                      <div className="space-y-1">
                        <h3 className="font-serif text-lg text-slate-900 group-hover:text-[#D11242] transition-colors leading-snug">
                          {spec.name}
                        </h3>
                        <p className="text-xs text-slate-500 line-clamp-3 leading-relaxed">
                          {spec.description}
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        setActiveFormId(spec.id);
                        setCurrentView("write");
                      }}
                      className="mt-6 w-full py-2.5 bg-slate-900 hover:bg-[#D11242] text-white rounded-md text-[9px] font-display uppercase tracking-widest font-black transition-all flex items-center justify-center gap-1"
                    >
                      Write Form <ChevronRight size={12} />
                    </button>
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}

        {/* VIEW 2: Write Form Formats */}
        {currentView === "write" && activeFormId && (
          <div className="max-w-4xl mx-auto space-y-8">
            <button
              onClick={() => setCurrentView("catalog")}
              className="flex items-center gap-1.5 text-slate-600 hover:text-slate-900 text-xs font-display uppercase tracking-widest font-extrabold no-print"
            >
              <ChevronLeft size={16} /> Back to Catalog
            </button>

            {/* HISTORIC RECORD BANNER */}
            {selectedSubmission && (
              <div className="p-4 bg-slate-100 border border-slate-300 rounded-lg flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 no-print">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-[#D11242]/10 rounded-full text-[#D11242]">
                    <Clock size={16} />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">Viewing Archived Submission Record</h4>
                    <p className="text-[11px] text-slate-500">
                      Submitted by <strong className="text-slate-700">{selectedSubmission.filledBy}</strong> on {new Date(selectedSubmission.timestamp).toLocaleString("en-US", { dateStyle: "long", timeStyle: "short" })}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedSubmission(null);
                    setCurrentView("history");
                  }}
                  className="px-3.5 py-1.5 bg-white border border-slate-200 text-[#D11242] text-[10px] font-display uppercase tracking-wider font-extrabold rounded-md shadow-sm hover:bg-slate-50 transition-all shrink-0"
                >
                  Return to History Logs
                </button>
              </div>
            )}

            {/* MESSAGE FALLBACK */}
            {msg && (
              <div className={`p-4 rounded-lg flex items-center gap-3 no-print ${
                msg.type === "success" ? "bg-emerald-50 text-emerald-800 border border-emerald-200" : "bg-rose-50 text-rose-800 border border-rose-200"
              }`}>
                {msg.type === "success" ? <Check size={18} /> : <AlertCircle size={18} />}
                <p className="text-xs font-medium">{msg.text}</p>
              </div>
            )}

            <form onSubmit={handleSaveSubmission} className="space-y-8 no-print">
              
              {/* THE FORM CONTAINER WITH PRINT MATCHING EMBEDDED STYLES */}
              <div 
                ref={printAreaRef}
                className="bg-white border border-slate-200 shadow-xl relative overflow-hidden rounded-md text-left print-container"
                style={{ fontFamily: "'Inter', sans-serif" }}
              >
                
                {/* SVG repeating circles geometric watermark background overlay similar to screenshots */}
                <div className="absolute inset-0 pointer-events-none opacity-[0.03] z-0">
                  <svg width="100%" height="100%">
                    <pattern id="circlePattern" width="60" height="60" patternUnits="userSpaceOnUse">
                      <circle cx="30" cy="30" r="28" fill="none" stroke="#000000" strokeWidth="1" />
                      <circle cx="30" cy="30" r="14" fill="none" stroke="#000000" strokeWidth="0.5" />
                    </pattern>
                    <rect width="100%" height="100%" fill="url(#circlePattern)" />
                  </svg>
                </div>

                {/* OFFICIAL EMBEDDED PRINT HEADER */}
                <div className="relative z-10 border-b-2 border-[#D11242] p-8 md:p-12 text-center bg-white space-y-4">
                  <div className="flex flex-col items-center justify-center space-y-2">
                    <img 
                      src="https://ramadawailoaloafiji.com/wp-content/uploads/2026/05/Ramada-Thumbnail-Logo.jpg" 
                      alt="Ramada Suites Brand"
                      className="h-14 object-contain"
                    />
                    <span className="text-[9px] tracking-[0.3em] font-display uppercase font-black text-slate-500">
                      Ramada Suites by Wyndham Wailoaloa Beach Fiji
                    </span>
                  </div>
                  <h2 className="text-2xl md:text-3xl font-serif italic text-[#D11242] leading-tight font-black pt-2">
                    {RAMADA_FORMS_SPEC.find(s => s.id === activeFormId)?.name}
                  </h2>
                </div>

                {/* THE FORM CONTENT CHUNK */}
                <div className="relative z-10 p-8 md:p-12 space-y-8 bg-transparent">
                  
                  {/* DYNAMIC FIELD MODULE LAYOUTS BASED ON EACH PDF ATTACHMENT SPEC */}
                  
                  {/* Form 1: Adjustment Request Form */}
                  {activeFormId === "adjustment" && (
                    <div className="space-y-6">
                      <div className="space-y-3">
                        <h4 className="text-[10px] font-display uppercase tracking-widest font-black text-slate-800 bg-slate-100 px-3 py-1.5 rounded-sm">
                          Requestor Info
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="space-y-1">
                            <label className="text-[8px] font-display uppercase tracking-widest font-bold text-slate-500">Date</label>
                            <input type="date" required value={formData.date || ""} onChange={(e) => setFormData({...formData, date: e.target.value})} className="form-theme-input" />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[8px] font-display uppercase tracking-widest font-bold text-slate-500">Requested By</label>
                            <input type="text" required value={formData.requestedBy || ""} onChange={(e) => setFormData({...formData, requestedBy: e.target.value})} className="form-theme-input" placeholder="Staff Name" />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[8px] font-display uppercase tracking-widest font-bold text-slate-500">Department</label>
                            <input type="text" required value={formData.department || ""} onChange={(e) => setFormData({...formData, department: e.target.value})} className="form-theme-input" placeholder="e.g. Front Office / Accounts" />
                          </div>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <h4 className="text-[10px] font-display uppercase tracking-widest font-black text-slate-800 bg-slate-100 px-3 py-1.5 rounded-sm">
                          Guest Details
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="space-y-1 md:col-span-1">
                            <label className="text-[8px] font-display uppercase tracking-widest font-bold text-slate-500">Guest Name</label>
                            <input type="text" required value={formData.guestName || ""} onChange={(e) => setFormData({...formData, guestName: e.target.value})} className="form-theme-input" placeholder="Guest Full Name" />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[8px] font-display uppercase tracking-widest font-bold text-slate-500">Confirmation #</label>
                            <input type="text" required value={formData.confirmationNum || ""} onChange={(e) => setFormData({...formData, confirmationNum: e.target.value})} className="form-theme-input" placeholder="e.g. R48921" />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[8px] font-display uppercase tracking-widest font-bold text-slate-500">Room #</label>
                            <input type="text" required value={formData.roomNum || ""} onChange={(e) => setFormData({...formData, roomNum: e.target.value})} className="form-theme-input" placeholder="e.g. 302" />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[8px] font-display uppercase tracking-widest font-bold text-slate-500">Check-In Date</label>
                            <input type="date" required value={formData.checkInDate || ""} onChange={(e) => setFormData({...formData, checkInDate: e.target.value})} className="form-theme-input" />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[8px] font-display uppercase tracking-widest font-bold text-slate-500">Check-Out Date</label>
                            <input type="date" required value={formData.checkOutDate || ""} onChange={(e) => setFormData({...formData, checkOutDate: e.target.value})} className="form-theme-input" />
                          </div>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <h4 className="text-[10px] font-display uppercase tracking-widest font-black text-slate-800 bg-slate-100 px-3 py-1.5 rounded-sm">
                          Adjustment Details
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <label className="text-[8px] font-display uppercase tracking-widest font-bold text-slate-500">Adjustment Type</label>
                            <select value={formData.adjustmentType || ""} onChange={(e) => setFormData({...formData, adjustmentType: e.target.value})} className="form-theme-input">
                              <option value="Rate Adjustment">Rate Adjustment</option>
                              <option value="Posting Error">Posting Error</option>
                              <option value="Complimentary Waiver">Complimentary Waiver</option>
                              <option value="F&B Discount Discrepancy">F&B Discount Discrepancy</option>
                              <option value="Other">Other Adjustment</option>
                            </select>
                          </div>
                          <div className="space-y-1 md:col-span-2">
                            <label className="text-[8px] font-display uppercase tracking-widest font-bold text-slate-500">Reason for Adjustment</label>
                            <textarea required value={formData.reason || ""} onChange={(e) => setFormData({...formData, reason: e.target.value})} className="form-theme-input min-h-[80px]" placeholder="State clear reasons why adjustment is needed..." />
                          </div>
                          
                          <div className="space-y-1">
                            <label className="text-[8px] font-display uppercase tracking-widest font-bold text-slate-500">Incorrect Amount Posted ($ A)</label>
                            <input type="number" step="0.01" required value={formData.incorrectAmountA || ""} onChange={(e) => handleAmtChange("incorrectAmountA", e.target.value)} className="form-theme-input" />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[8px] font-display uppercase tracking-widest font-bold text-slate-500">Correct Amount to be Posted ($ B)</label>
                            <input type="number" step="0.01" required value={formData.correctAmountB || ""} onChange={(e) => handleAmtChange("correctAmountB", e.target.value)} className="form-theme-input" />
                          </div>
                          <div className="space-y-1 md:col-span-2 bg-[#D11242]/5 p-4 border border-[#D11242]/20">
                            <div className="flex justify-between items-center">
                              <span className="text-[9px] font-display uppercase tracking-widest font-black text-[#D11242]">Adjustment Amount (B - A):</span>
                              <span className="text-lg font-mono font-bold text-[#D11242]">${formData.adjustmentAmount || "0.00"} FJD</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <h4 className="text-[10px] font-display uppercase tracking-widest font-black text-slate-800 bg-slate-100 px-3 py-1.5 rounded-sm">
                          Approval Section
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <label className="text-[8px] font-display uppercase tracking-widest font-bold text-slate-500">Approved By (HOD / Controller)</label>
                            <input type="text" value={formData.approvedBy || ""} onChange={(e) => setFormData({...formData, approvedBy: e.target.value})} className="form-theme-input" placeholder="Approving Officer" />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[8px] font-display uppercase tracking-widest font-bold text-slate-500">Date of Approval</label>
                            <input type="date" value={formData.dateApproved || ""} onChange={(e) => setFormData({...formData, dateApproved: e.target.value})} className="form-theme-input" />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Form 2: Coaching Note */}
                  {activeFormId === "coaching" && (
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-1">
                          <label className="text-[8px] font-display uppercase tracking-widest font-bold text-slate-500">Department</label>
                          <input type="text" required value={formData.department || ""} onChange={(e) => setFormData({...formData, department: e.target.value})} className="form-theme-input" placeholder="Department label" />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[8px] font-display uppercase tracking-widest font-bold text-slate-500">Date</label>
                          <input type="date" required value={formData.date || ""} onChange={(e) => setFormData({...formData, date: e.target.value})} className="form-theme-input" />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[8px] font-display uppercase tracking-widest font-bold text-slate-500">Staff Name</label>
                          <input type="text" required value={formData.staffName || ""} onChange={(e) => setFormData({...formData, staffName: e.target.value})} className="form-theme-input" placeholder="Employee Name" />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-[9px] font-display uppercase tracking-widest font-black text-slate-800">
                          Area of Discussion and Improvements
                        </label>
                        <p className="text-[11px] text-zinc-600 font-sans italic leading-relaxed bg-[#D11242]/5 p-3 rounded border border-[#D11242]/10 mb-2 font-medium">
                          "With various discussions and line of understanding given, the following concerns have still been ignored and neglected by you:"
                        </p>
                        <textarea required value={formData.discussionAreas || ""} onChange={(e) => setFormData({...formData, discussionAreas: e.target.value})} className="form-theme-input min-h-[120px]" placeholder="Outline exact neglect of duties or concerns here..." />
                      </div>

                      <div className="space-y-2">
                        <label className="text-[9px] font-display uppercase tracking-widest font-black text-slate-800">
                          Staff Feedback
                        </label>
                        <textarea required value={formData.staffFeedback || ""} onChange={(e) => setFormData({...formData, staffFeedback: e.target.value})} className="form-theme-input min-h-[100px]" placeholder="Staff responses, explanations, or comments..." />
                      </div>

                      <div className="space-y-2">
                        <label className="text-[9px] font-display uppercase tracking-widest font-black text-slate-800">
                          Areas to Improve Immediately
                        </label>
                        <textarea required value={formData.areasImprove || ""} onChange={(e) => setFormData({...formData, areasImprove: e.target.value})} className="form-theme-input min-h-[100px]" placeholder="Specific KPIs, immediate action points suggested..." />
                      </div>

                      <div className="border-t border-slate-200 pt-6 space-y-4">
                        <h4 className="text-[10px] font-display uppercase tracking-[0.2em] font-black text-[#D11242]">
                          Statement of Understanding
                        </h4>
                        <p className="text-[10px] text-slate-500 leading-relaxed italic">
                          I have read and understood the full content and expectations of this discussion. I understand that I will be required to meet the expectations outlined. It will be my sole responsibility to ensure that these expectations are met, and procedures always followed.
                        </p>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                          <div className="space-y-1">
                            <label className="text-[8px] font-display uppercase tracking-widest font-bold text-slate-500">Signature of Staff (Digital Consent)</label>
                            <input type="text" required value={formData.staffSignature || ""} onChange={(e) => setFormData({...formData, staffSignature: e.target.value})} className="form-theme-input" placeholder="Type name to sign" />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[8px] font-display uppercase tracking-widest font-bold text-slate-500">Signature Date</label>
                            <input type="date" required value={formData.signatureDate || ""} onChange={(e) => setFormData({...formData, signatureDate: e.target.value})} className="form-theme-input" />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 border-t border-slate-100 pt-4">
                          <div className="space-y-1">
                            <label className="text-[8px] font-display uppercase tracking-widest font-bold text-slate-500">Witness Name</label>
                            <input type="text" value={formData.witnessName || ""} onChange={(e) => setFormData({...formData, witnessName: e.target.value})} className="form-theme-input" />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[8px] font-display uppercase tracking-widest font-bold text-slate-500">Witness Signature</label>
                            <input type="text" value={formData.witnessSignature || ""} onChange={(e) => setFormData({...formData, witnessSignature: e.target.value})} className="form-theme-input" />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[8px] font-display uppercase tracking-widest font-bold text-slate-500">Witness Position</label>
                            <input type="text" value={formData.witnessPosition || ""} onChange={(e) => setFormData({...formData, witnessPosition: e.target.value})} className="form-theme-input" />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[8px] font-display uppercase tracking-widest font-bold text-slate-500">Witness Date</label>
                            <input type="date" value={formData.witnessDate || ""} onChange={(e) => setFormData({...formData, witnessDate: e.target.value})} className="form-theme-input" />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Form 3: Discussion Note */}
                  {activeFormId === "discussion" && (
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-1">
                          <label className="text-[8px] font-display uppercase tracking-widest font-bold text-slate-500">Name of Employee</label>
                          <input type="text" required value={formData.name || ""} onChange={(e) => setFormData({...formData, name: e.target.value})} className="form-theme-input" placeholder="Name" />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[8px] font-display uppercase tracking-widest font-bold text-slate-500">Conducted By</label>
                          <input type="text" required value={formData.conductedBy || ""} onChange={(e) => setFormData({...formData, conductedBy: e.target.value})} className="form-theme-input" />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[8px] font-display uppercase tracking-widest font-bold text-slate-500">Date</label>
                          <input type="date" required value={formData.date || ""} onChange={(e) => setFormData({...formData, date: e.target.value})} className="form-theme-input" />
                        </div>
                      </div>

                      <div className="space-y-4">
                        <h4 className="text-[10px] font-display uppercase tracking-widest font-black text-slate-800 bg-slate-100 px-3 py-1.5 rounded-sm">
                          Points Discussed (1 to 15)
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {discussionPoints.map((point, index) => (
                            <div key={index} className="space-y-1 flex items-center gap-3">
                              <span className="text-[10px] font-mono font-bold w-6 h-6 flex justify-center items-center bg-zinc-200 text-slate-800 rounded-full">{index + 1}</span>
                              <input 
                                type="text" 
                                placeholder={`Discussed Point details ${index + 1}`} 
                                value={point} 
                                onChange={(e) => {
                                  const c = [...discussionPoints];
                                  c[index] = e.target.value;
                                  setDiscussionPoints(c);
                                }} 
                                className="form-theme-input flex-1" 
                              />
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="bg-rose-50 border border-slate-200 p-4 font-sans text-xs italic text-slate-700">
                        "Discussed Above Points With Department Staffs. Same Will Be Trained Using Training Form."
                      </div>

                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <h4 className="text-[10px] font-display uppercase tracking-widest font-black text-slate-800">
                            Participants Discussion Matrix List
                          </h4>
                          <button
                            type="button"
                            onClick={() => setDiscussionParticipants([...discussionParticipants, { name: "", d1: false, d2: false, d3: false }])}
                            className="text-[9px] font-display text-emerald-600 hover:text-emerald-800 flex items-center gap-1 font-extrabold uppercase tracking-widest"
                          >
                            <Plus size={10} /> Add Participant Row
                          </button>
                        </div>
                        
                        <div className="overflow-x-auto">
                          <table className="w-full text-left text-xs border border-slate-200 min-w-[500px]">
                            <thead>
                              <tr className="bg-slate-100 border-b border-slate-200">
                                <th className="p-2.5 font-display text-[9px] uppercase tracking-widest font-bold">Staff Name</th>
                                <th className="p-2.5 font-display text-[9px] uppercase tracking-widest font-bold text-center">Discussion 1</th>
                                <th className="p-2.5 font-display text-[9px] uppercase tracking-widest font-bold text-center">Discussion 2</th>
                                <th className="p-2.5 font-display text-[9px] uppercase tracking-widest font-bold text-center">Discussion 3</th>
                                <th className="p-2.5 text-center"></th>
                              </tr>
                            </thead>
                            <tbody>
                              {discussionParticipants.map((row, idx) => (
                                <tr key={idx} className="border-b border-slate-150">
                                  <td className="p-1.5">
                                    <input 
                                      type="text" 
                                      placeholder="Employee Name" 
                                      value={row.name} 
                                      onChange={(e) => {
                                        const next = [...discussionParticipants];
                                        next[idx].name = e.target.value;
                                        setDiscussionParticipants(next);
                                      }}
                                      className="w-full p-2 border border-slate-200 text-xs text-slate-800"
                                    />
                                  </td>
                                  <td className="p-1.5 text-center">
                                    <input 
                                      type="checkbox" 
                                      checked={row.d1} 
                                      onChange={(e) => {
                                        const next = [...discussionParticipants];
                                        next[idx].d1 = e.target.checked;
                                        setDiscussionParticipants(next);
                                      }}
                                      className="accent-[#D11242]"
                                    />
                                  </td>
                                  <td className="p-1.5 text-center">
                                    <input 
                                      type="checkbox" 
                                      checked={row.d2} 
                                      onChange={(e) => {
                                        const next = [...discussionParticipants];
                                        next[idx].d2 = e.target.checked;
                                        setDiscussionParticipants(next);
                                      }}
                                      className="accent-[#D11242]"
                                    />
                                  </td>
                                  <td className="p-1.5 text-center">
                                    <input 
                                      type="checkbox" 
                                      checked={row.d3} 
                                      onChange={(e) => {
                                        const next = [...discussionParticipants];
                                        next[idx].d3 = e.target.checked;
                                        setDiscussionParticipants(next);
                                      }}
                                      className="accent-[#D11242]"
                                    />
                                  </td>
                                  <td className="p-1.5 text-center">
                                    {discussionParticipants.length > 1 && (
                                      <button 
                                        type="button" 
                                        onClick={() => setDiscussionParticipants(discussionParticipants.filter((_, i) => i !== idx))}
                                        className="text-red-500 hover:text-red-700"
                                      >
                                        <Trash2 size={13} />
                                      </button>
                                    )}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-slate-200 pt-6">
                        <div className="space-y-1">
                          <label className="text-[8px] font-display uppercase tracking-widest font-bold text-slate-500">Read and Understood by Date</label>
                          <input type="date" value={formData.readUnderstoodByDate || ""} onChange={(e) => setFormData({...formData, readUnderstoodByDate: e.target.value})} className="form-theme-input" />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Form 4: Guest Feedback Form */}
                  {activeFormId === "guest-feedback" && (
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-[8px] font-display uppercase tracking-widest font-bold text-slate-500">Date of Report</label>
                          <input type="date" required value={formData.date || ""} onChange={(e) => setFormData({...formData, date: e.target.value})} className="form-theme-input" />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[8px] font-display uppercase tracking-widest font-bold text-slate-500">Reported By - Name (Guest / Receptionist)</label>
                          <input type="text" required value={formData.reportedByName || ""} onChange={(e) => setFormData({...formData, reportedByName: e.target.value})} className="form-theme-input" placeholder="Reporter Full Name" />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-[9px] font-display uppercase tracking-widest font-black text-slate-800">
                          Feedback / Report Details
                        </label>
                        <textarea required value={formData.details || ""} onChange={(e) => setFormData({...formData, details: e.target.value})} className="form-theme-input min-h-[160px]" placeholder="State details fully here..." />
                      </div>

                      <div className="border-t border-slate-200 pt-6 space-y-4">
                        <h4 className="text-[10px] font-display uppercase tracking-[0.2em] font-black text-[#D11242]">
                          Acknowledge & Consent
                        </h4>
                        <div className="bg-slate-50 p-4 border border-slate-100 rounded">
                          <div className="flex items-start gap-3">
                            <span className="text-slate-600 text-xs italic">
                              "I, <span className="font-bold underline text-slate-900">{formData.reportedByName || "[Guest Name]"}</span>, hereby acknowledge that report provided by myself is true."
                            </span>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                          <div className="space-y-1">
                            <label className="text-[8px] font-display uppercase tracking-widest font-bold text-slate-500">Guest Signature (Digital Consent)</label>
                            <input type="text" required value={formData.guestSignature || ""} onChange={(e) => setFormData({...formData, guestSignature: e.target.value})} className="form-theme-input" placeholder="Type Guest Name to sign" />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[8px] font-display uppercase tracking-widest font-bold text-slate-500">Date signed</label>
                            <input type="date" required value={formData.guestSigDate || ""} onChange={(e) => setFormData({...formData, guestSigDate: e.target.value})} className="form-theme-input" />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-t border-slate-100 pt-4">
                          <div className="space-y-1">
                            <label className="text-[8px] font-display uppercase tracking-widest font-bold text-slate-500">Received By (Staff Name)</label>
                            <input type="text" required value={formData.receivedByName || ""} onChange={(e) => setFormData({...formData, receivedByName: e.target.value})} className="form-theme-input" placeholder="Name" />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[8px] font-display uppercase tracking-widest font-bold text-slate-500">Staff Department</label>
                            <input type="text" required value={formData.receivedDepartment || ""} onChange={(e) => setFormData({...formData, receivedDepartment: e.target.value})} className="form-theme-input" placeholder="Department" />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[8px] font-display uppercase tracking-widest font-bold text-slate-500">Date Received</label>
                            <input type="date" required value={formData.receivedDate || ""} onChange={(e) => setFormData({...formData, receivedDate: e.target.value})} className="form-theme-input" />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Form 5: Incident Report */}
                  {activeFormId === "incident-report" && (
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-[8px] font-display uppercase tracking-widest font-bold text-slate-500">Date of Incident</label>
                          <input type="date" required value={formData.date || ""} onChange={(e) => setFormData({...formData, date: e.target.value})} className="form-theme-input" />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[8px] font-display uppercase tracking-widest font-bold text-slate-500">Reported By - Name</label>
                          <input type="text" required value={formData.reportedByName || ""} onChange={(e) => setFormData({...formData, reportedByName: e.target.value})} className="form-theme-input" placeholder="Reporter Full Name" />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-[9px] font-display uppercase tracking-widest font-black text-slate-800">
                          Incident Details (What, When, Where, Who)
                        </label>
                        <textarea required value={formData.incidentDetails || ""} onChange={(e) => setFormData({...formData, incidentDetails: e.target.value})} className="form-theme-input min-h-[160px]" placeholder="Describe the incident details thoroughly..." />
                      </div>

                      <div className="space-y-2 border-t border-slate-100 pt-4">
                        <label className="text-[9px] font-display uppercase tracking-widest font-black text-slate-800">
                          Supervisors Report & Actions Taken
                        </label>
                        <textarea required value={formData.supervisorsReport || ""} onChange={(e) => setFormData({...formData, supervisorsReport: e.target.value})} className="form-theme-input min-h-[120px]" placeholder="Immediate supervisors findings and action logs..." />
                      </div>

                      <div className="border-t border-slate-200 pt-6 space-y-4">
                        <h4 className="text-[10px] font-display uppercase tracking-[0.2em] font-black text-[#D11242]">
                          Acknowledge Statement
                        </h4>
                        <div className="bg-slate-50 p-4 border border-slate-150 text-slate-700 italic text-xs">
                          "I, <span className="font-bold underline text-slate-900">{formData.reportedByName || "[Staff Name]"}</span>, hereby acknowledge that report provided by myself is true."
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <label className="text-[8px] font-display uppercase tracking-widest font-bold text-slate-500">Signature of Staff (Digital Consent)</label>
                            <input type="text" required value={formData.staffSignature || ""} onChange={(e) => setFormData({...formData, staffSignature: e.target.value})} className="form-theme-input" placeholder="Type Name to sign" />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[8px] font-display uppercase tracking-widest font-bold text-slate-500">Date Signed</label>
                            <input type="date" required value={formData.signatureDate || ""} onChange={(e) => setFormData({...formData, signatureDate: e.target.value})} className="form-theme-input" />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-t border-slate-100 pt-4">
                          <div className="space-y-1">
                            <label className="text-[8px] font-display uppercase tracking-widest font-bold text-slate-500">Received By (Manager Name)</label>
                            <input type="text" required value={formData.receivedByName || ""} onChange={(e) => setFormData({...formData, receivedByName: e.target.value})} className="form-theme-input" placeholder="Manager Name" />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[8px] font-display uppercase tracking-widest font-bold text-slate-500">Manager's Department</label>
                            <input type="text" required value={formData.receivedDepartment || ""} onChange={(e) => setFormData({...formData, receivedDepartment: e.target.value})} className="form-theme-input" placeholder="e.g. Operations" />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[8px] font-display uppercase tracking-widest font-bold text-slate-500">Date Received</label>
                            <input type="date" required value={formData.receivedDate || ""} onChange={(e) => setFormData({...formData, receivedDate: e.target.value})} className="form-theme-input" />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Form 6: Line of Understanding */}
                  {activeFormId === "line-understanding" && (
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-1">
                          <label className="text-[8px] font-display uppercase tracking-widest font-bold text-slate-500">Date</label>
                          <input type="date" required value={formData.date || ""} onChange={(e) => setFormData({...formData, date: e.target.value})} className="form-theme-input" />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[8px] font-display uppercase tracking-widest font-bold text-slate-500">Name of staff</label>
                          <input type="text" required value={formData.name || ""} onChange={(e) => setFormData({...formData, name: e.target.value})} className="form-theme-input" placeholder="Staff Name" />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[8px] font-display uppercase tracking-widest font-bold text-slate-500">HOD / Manager</label>
                          <input type="text" required value={formData.hodManager || ""} onChange={(e) => setFormData({...formData, hodManager: e.target.value})} className="form-theme-input" />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-[9px] font-display uppercase tracking-widest font-black text-slate-800">
                          Issues Discussed
                        </label>
                        <p className="text-[11px] text-zinc-650 italic leading-relaxed bg-[#D11242]/5 border border-[#D11242]/10 p-3 rounded font-medium mb-1">
                          "Further to numerous discussions held, the following concerns are still ongoing/repeated by you:"
                        </p>
                        <textarea required value={formData.issuesDiscussed || ""} onChange={(e) => setFormData({...formData, issuesDiscussed: e.target.value})} className="form-theme-input min-h-[120px]" />
                      </div>

                      <div className="space-y-2">
                        <label className="text-[9px] font-display uppercase tracking-widest font-black text-slate-800">
                          Staff Feedback
                        </label>
                        <textarea required value={formData.staffFeedback || ""} onChange={(e) => setFormData({...formData, staffFeedback: e.target.value})} className="form-theme-input min-h-[100px]" placeholder="Staff remarks/feedback..." />
                      </div>

                      <div className="space-y-2">
                        <label className="text-[9px] font-display uppercase tracking-widest font-black text-slate-800">
                          Department Manager Feedback / Action
                        </label>
                        <textarea required value={formData.managerFeedback || ""} onChange={(e) => setFormData({...formData, managerFeedback: e.target.value})} className="form-theme-input min-h-[105px]" placeholder="Manager feedback/immediate action requested..." />
                      </div>

                      <div className="border-t border-slate-200 pt-6 space-y-4">
                        <h4 className="text-[10px] font-display uppercase tracking-[0.2em] font-black text-[#D11242]">
                          Statement of Understanding
                        </h4>
                        <p className="text-[10px] text-slate-500 leading-relaxed italic">
                          I, <span className="font-bold underline text-slate-900">{formData.name || "[Staff Name]"}</span>, hereby acknowledge that I have read and understood the topics that was discussed with me.
                        </p>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <label className="text-[8px] font-display uppercase tracking-widest font-bold text-slate-500">Sign (Staff Signature)</label>
                            <input type="text" required value={formData.staffSignature || ""} onChange={(e) => setFormData({...formData, staffSignature: e.target.value})} className="form-theme-input" placeholder="Type Staff Name to sign" />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[8px] font-display uppercase tracking-widest font-bold text-slate-500">Staff Date Signed</label>
                            <input type="date" required value={formData.staffSigDate || ""} onChange={(e) => setFormData({...formData, staffSigDate: e.target.value})} className="form-theme-input" />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-slate-100 pt-4">
                          <div className="space-y-2">
                            <label className="text-[8px] font-display uppercase tracking-widest font-bold text-slate-500">Dept. Manager Name & Signature</label>
                            <input type="text" required value={formData.deptManagerName || ""} onChange={(e) => setFormData({...formData, deptManagerName: e.target.value})} className="form-theme-input" placeholder="Type Manager Name to sign" />
                            <input type="date" required value={formData.managersSigDate || ""} onChange={(e) => setFormData({...formData, managersSigDate: e.target.value})} className="form-theme-input mt-1.5" />
                          </div>
                          <div className="space-y-2">
                            <label className="text-[8px] font-display uppercase tracking-widest font-bold text-slate-500">Admin Manager Name & Signature</label>
                            <input type="text" required value={formData.administrativeManagerName || ""} onChange={(e) => setFormData({...formData, administrativeManagerName: e.target.value})} className="form-theme-input" placeholder="Type Admin Manager Name to sign" />
                            <input type="date" required value={formData.adminSigDate || ""} onChange={(e) => setFormData({...formData, adminSigDate: e.target.value})} className="form-theme-input mt-1.5" />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Form 7: Manager's Report */}
                  {activeFormId === "managers-report" && (
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-1">
                          <label className="text-[8px] font-display uppercase tracking-widest font-bold text-slate-500">Date</label>
                          <input type="date" required value={formData.date || ""} onChange={(e) => setFormData({...formData, date: e.target.value})} className="form-theme-input" />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[8px] font-display uppercase tracking-widest font-bold text-slate-500">Reported By (Manager Name)</label>
                          <input type="text" required value={formData.reportedBy || ""} onChange={(e) => setFormData({...formData, reportedBy: e.target.value})} className="form-theme-input" />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[8px] font-display uppercase tracking-widest font-bold text-slate-500">Concerned Staff Name</label>
                          <input type="text" required value={formData.concernedStaffName || ""} onChange={(e) => setFormData({...formData, concernedStaffName: e.target.value})} className="form-theme-input" placeholder="Employee under discussion" />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-[9px] font-display uppercase tracking-widest font-black text-slate-800">
                          Manager's Report Details
                        </label>
                        <textarea required value={formData.report || ""} onChange={(e) => setFormData({...formData, report: e.target.value})} className="form-theme-input min-h-[160px]" placeholder="Write complete audit or operational shift reports..." />
                      </div>

                      <div className="border-t border-slate-200 pt-6 space-y-4">
                        <h4 className="text-[10px] font-display uppercase tracking-[0.2em] font-black text-[#D11242]">
                          Acknowledge Statement
                        </h4>
                        <p className="text-xs text-slate-650 italic">
                          "I, <span className="font-bold underline text-slate-900">{formData.reportedBy || "[Manager Name]"}</span>, hereby acknowledge that report provided by myself is true."
                        </p>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                          <div className="space-y-1">
                            <label className="text-[8px] font-display uppercase tracking-widest font-bold text-slate-500">Name</label>
                            <input type="text" required value={formData.reportedBy || ""} onChange={(e) => setFormData({...formData, reportedBy: e.target.value})} className="form-theme-input" />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[8px] font-display uppercase tracking-widest font-bold text-slate-500">Signature</label>
                            <input type="text" required value={formData.signature || ""} onChange={(e) => setFormData({...formData, signature: e.target.value})} className="form-theme-input" placeholder="Type to sign" />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[8px] font-display uppercase tracking-widest font-bold text-slate-500">Date</label>
                            <input type="date" required value={formData.signatureDate || ""} onChange={(e) => setFormData({...formData, signatureDate: e.target.value})} className="form-theme-input" />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-t border-slate-100 pt-4">
                          <div className="space-y-1">
                            <label className="text-[8px] font-display uppercase tracking-widest font-bold text-slate-500">Received By</label>
                            <input type="text" value={formData.receivedByName || ""} onChange={(e) => setFormData({...formData, receivedByName: e.target.value})} className="form-theme-input" placeholder="Reviewer Name" />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[8px] font-display uppercase tracking-widest font-bold text-slate-500">Department</label>
                            <input type="text" value={formData.department || ""} onChange={(e) => setFormData({...formData, department: e.target.value})} className="form-theme-input" placeholder="e.g. General Accounts" />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[8px] font-display uppercase tracking-widest font-bold text-slate-500">Admin Manager Approved</label>
                            <input type="text" value={formData.adminManager || ""} onChange={(e) => setFormData({...formData, adminManager: e.target.value})} className="form-theme-input" placeholder="Admin Manager Sign" />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Form 8: Pre-Employment Declaration Form */}
                  {activeFormId === "pre-employment" && (
                    <div className="space-y-6">
                      <div className="space-y-3">
                        <h4 className="text-[10px] font-display uppercase tracking-widest font-black text-slate-800 bg-slate-100 px-3 py-1.5 rounded-sm">
                          Applicant Details
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <label className="text-[8px] font-display uppercase tracking-widest font-bold text-slate-500">Full Name</label>
                            <input type="text" required value={formData.applicantName || ""} onChange={(e) => setFormData({...formData, applicantName: e.target.value})} className="form-theme-input" placeholder="Johnathan Doe" />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[8px] font-display uppercase tracking-widest font-bold text-slate-500">Date of Birth</label>
                            <input type="date" required value={formData.dob || ""} onChange={(e) => setFormData({...formData, dob: e.target.value})} className="form-theme-input" />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[8px] font-display uppercase tracking-widest font-bold text-slate-500">Address</label>
                            <input type="text" required value={formData.address || ""} onChange={(e) => setFormData({...formData, address: e.target.value})} className="form-theme-input" placeholder="Full Home Address" />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[8px] font-display uppercase tracking-widest font-bold text-slate-500">Contact Number</label>
                            <input type="text" required value={formData.contactNumber || ""} onChange={(e) => setFormData({...formData, contactNumber: e.target.value})} className="form-theme-input" placeholder="e.g. +679 999 1122" />
                          </div>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <h4 className="text-[10px] font-display uppercase tracking-widest font-black text-[#D11242] border-b border-[#D11242]/20 pb-1">
                          1. Criminal History
                        </h4>
                        <div className="space-y-2">
                          <label className="flex items-start gap-2.5 text-xs font-semibold cursor-pointer text-slate-800">
                            <input 
                              type="checkbox" 
                              checked={formData.crimNeverConvicted === true} 
                              onChange={(e) => setFormData({...formData, crimNeverConvicted: e.target.checked, crimConvicted: !e.target.checked})} 
                              className="mt-1 accent-[#D11242]" 
                            />
                            I have never been convicted of any criminal offense.
                          </label>
                          <label className="flex items-start gap-2.5 text-xs font-semibold cursor-pointer text-slate-800">
                            <input 
                              type="checkbox" 
                              checked={formData.crimConvicted === true} 
                              onChange={(e) => setFormData({...formData, crimConvicted: e.target.checked, crimNeverConvicted: !e.target.checked})} 
                              className="mt-1 accent-[#D11242]" 
                            />
                            I have been convicted of a criminal offense (please provide details below).
                          </label>
                          <textarea 
                            value={formData.crimDetails || ""} 
                            onChange={(e) => setFormData({...formData, crimDetails: e.target.value})} 
                            disabled={!formData.crimConvicted}
                            className="form-theme-input min-h-[60px]" 
                            placeholder="Please provide details of conviction..." 
                          />
                        </div>
                      </div>

                      <div className="space-y-3">
                        <h4 className="text-[10px] font-display uppercase tracking-widest font-black text-[#D11242] border-b border-[#D11242]/20 pb-1">
                          2. Police Record Check
                        </h4>
                        <div className="space-y-2 text-xs">
                          <label className="flex items-start gap-2.5 cursor-pointer text-slate-800">
                            <input type="checkbox" checked={formData.consentPoliceCheck === true} onChange={(e) => setFormData({...formData, consentPoliceCheck: e.target.checked})} className="mt-1 accent-[#D11242]" />
                            I consent to the company conducting a police / background check.
                          </label>
                          <label className="flex items-start gap-2.5 cursor-pointer text-slate-800">
                            <input type="checkbox" checked={formData.consentInvestigation === true} onChange={(e) => setFormData({...formData, consentInvestigation: e.target.checked})} className="mt-1 accent-[#D11242]" />
                            I am not currently under investigation or facing any legal restrictions preventing me from performing this role.
                          </label>
                          <label className="flex items-start gap-2.5 cursor-pointer text-slate-800">
                            <input type="checkbox" checked={formData.consentNotWithheld === true} onChange={(e) => setFormData({...formData, consentNotWithheld: e.target.checked})} className="mt-1 accent-[#D11242]" />
                            I have not withheld any information that may be material to my employment.
                          </label>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <h4 className="text-[10px] font-display uppercase tracking-widest font-black text-[#D11242] border-b border-[#D11242]/20 pb-1">
                          3. Pregnancy / Expecting Status
                        </h4>
                        <div className="space-y-2">
                          <label className="flex items-start gap-2.5 text-xs cursor-pointer text-slate-800">
                            <input type="checkbox" checked={formData.pregNotExpecting === true} onChange={(e) => setFormData({...formData, pregNotExpecting: e.target.checked, pregExpecting: !e.target.checked})} className="mt-1 accent-[#D11242]" />
                            I am not currently pregnant or expecting a child.
                          </label>
                          <label className="flex items-start gap-2.5 text-xs cursor-pointer text-slate-800">
                            <input type="checkbox" checked={formData.pregExpecting === true} onChange={(e) => setFormData({...formData, pregExpecting: e.target.checked, pregNotExpecting: !e.target.checked})} className="mt-1 accent-[#D11242]" />
                            I am currently pregnant/expecting. (Provide details if required for safety accommodations).
                          </label>
                          <textarea 
                            value={formData.pregDetails || ""} 
                            onChange={(e) => setFormData({...formData, pregDetails: e.target.value})} 
                            disabled={!formData.pregExpecting}
                            className="form-theme-input min-h-[50px]" 
                            placeholder="Optional expectation notes..." 
                          />
                        </div>
                      </div>

                      <div className="space-y-3">
                        <h4 className="text-[10px] font-display uppercase tracking-widest font-black text-[#D11242] border-b border-[#D11242]/20 pb-1">
                          4. Medical Conditions / Other Disorders
                        </h4>
                        <div className="space-y-2">
                          <label className="flex items-start gap-2.5 text-xs cursor-pointer text-slate-800">
                            <input type="checkbox" checked={formData.medNoCondition === true} onChange={(e) => setFormData({...formData, medNoCondition: e.target.checked, medHasCondition: !e.target.checked})} className="mt-1 accent-[#D11242]" />
                            I do not have any medical conditions, disabilities, or disorders affecting my ability to perform full duties.
                          </label>
                          <label className="flex items-start gap-2.5 text-xs cursor-pointer text-slate-800">
                            <input type="checkbox" checked={formData.medHasCondition === true} onChange={(e) => setFormData({...formData, medHasCondition: e.target.checked, medNoCondition: !e.target.checked})} className="mt-1 accent-[#D11242]" />
                            I have medical conditions, disabilities, or disorders (please specify only those relevant to safety or desk job performance).
                          </label>
                          <textarea 
                            value={formData.medDetails || ""} 
                            onChange={(e) => setFormData({...formData, medDetails: e.target.value})} 
                            disabled={!formData.medHasCondition}
                            className="form-theme-input min-h-[50px]" 
                            placeholder="Specify medical disorders/conditions here..." 
                          />
                        </div>
                      </div>

                      <div className="border-t border-slate-200 pt-6 space-y-4">
                        <h4 className="text-[10px] font-display uppercase tracking-[0.2em] font-black text-[#D11242]">
                          Declaration & Consent Agreement
                        </h4>
                        <p className="text-[10px] text-zinc-500 leading-relaxed italic">
                          I hereby declare that the information provided above is true and accurate to the best of my knowledge. I understand that any false or misleading information may result in the withdrawal of my employment offer or termination of employment. I consent to the company verifying any information provided.
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <label className="text-[8px] font-display uppercase tracking-widest font-bold text-slate-500">Applicant Signature (Type to Sign)</label>
                            <input type="text" required value={formData.signature || ""} onChange={(e) => setFormData({...formData, signature: e.target.value})} className="form-theme-input" placeholder="Full Signature Name" />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[8px] font-display uppercase tracking-widest font-bold text-slate-500">Date Signed</label>
                            <input type="date" required value={formData.date || ""} onChange={(e) => setFormData({...formData, date: e.target.value})} className="form-theme-input" />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Forms 9 & 10: Staff Feedback & Staff Grievance Forms */}
                  {(activeFormId === "staff-feedback" || activeFormId === "staff-grievance") && (
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-[8px] font-display uppercase tracking-widest font-bold text-slate-500">Date</label>
                          <input type="date" required value={formData.date || ""} onChange={(e) => setFormData({...formData, date: e.target.value})} className="form-theme-input" />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[8px] font-display uppercase tracking-widest font-bold text-slate-500">Reported By - Name (Staff Member)</label>
                          <input type="text" required value={formData.reportedByName || ""} onChange={(e) => setFormData({...formData, reportedByName: e.target.value})} className="form-theme-input" />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-[9px] font-display uppercase tracking-widest font-black text-slate-800">
                          {activeFormId === "staff-feedback" ? "Feedback / Suggestions Details" : "Grievance, Work Disput, or Complaint Details"}
                        </label>
                        <textarea required value={formData.details || ""} onChange={(e) => setFormData({...formData, details: e.target.value})} className="form-theme-input min-h-[160px]" placeholder="Please write complete descriptions here..." />
                      </div>

                      <div className="border-t border-slate-200 pt-6 space-y-4">
                        <h4 className="text-[10px] font-display uppercase tracking-[0.2em] font-black text-[#D11242]">
                          Acknowledge Statement
                        </h4>
                        <div className="p-4 bg-zinc-50 rounded border border-zinc-150 font-sans italic text-xs text-slate-700">
                          "I, <span className="font-bold underline text-slate-900">{formData.reportedByName || "[Staff Name]"}</span>, hereby acknowledge that report provided by myself is true."
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <label className="text-[8px] font-display uppercase tracking-widest font-bold text-slate-500">Signature of Staff (Consent Signature)</label>
                            <input type="text" required value={formData.staffSignature || ""} onChange={(e) => setFormData({...formData, staffSignature: e.target.value})} className="form-theme-input" placeholder="Type signature" />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[8px] font-display uppercase tracking-widest font-bold text-slate-500">Date Signed</label>
                            <input type="date" required value={formData.staffSigDate || ""} onChange={(e) => setFormData({...formData, staffSigDate: e.target.value})} className="form-theme-input" />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-t border-slate-100 pt-4">
                          <div className="space-y-1">
                            <label className="text-[8px] font-display uppercase tracking-widest font-bold text-slate-500">Received By (HOD / HR Officer)</label>
                            <input type="text" value={formData.receivedByName || ""} onChange={(e) => setFormData({...formData, receivedByName: e.target.value})} className="form-theme-input" placeholder="HOD Name" />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[8px] font-display uppercase tracking-widest font-bold text-slate-500">Received Department</label>
                            <input type="text" value={formData.receivedDepartment || ""} onChange={(e) => setFormData({...formData, receivedDepartment: e.target.value})} className="form-theme-input" />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[8px] font-display uppercase tracking-widest font-bold text-slate-500">Date Received</label>
                            <input type="date" value={formData.receivedDate || ""} onChange={(e) => setFormData({...formData, receivedDate: e.target.value})} className="form-theme-input" />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Form 11: Supervisors Report */}
                  {activeFormId === "supervisors-report" && (
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-1">
                          <label className="text-[8px] font-display uppercase tracking-widest font-bold text-slate-500">Date</label>
                          <input type="date" required value={formData.date || ""} onChange={(e) => setFormData({...formData, date: e.target.value})} className="form-theme-input" />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[8px] font-display uppercase tracking-widest font-bold text-slate-500">Reported By - Name</label>
                          <input type="text" required value={formData.reportedByName || ""} onChange={(e) => setFormData({...formData, reportedByName: e.target.value})} className="form-theme-input" />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[8px] font-display uppercase tracking-widest font-bold text-slate-500">Concerned Staff Name</label>
                          <input type="text" required value={formData.concernedStaffName || ""} onChange={(e) => setFormData({...formData, concernedStaffName: e.target.value})} className="form-theme-input" placeholder="Staff Member Name" />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-[9px] font-display uppercase tracking-widest font-black text-slate-800">
                          Supervisor's Report Details
                        </label>
                        <textarea required value={formData.report || ""} onChange={(e) => setFormData({...formData, report: e.target.value})} className="form-theme-input min-h-[140px]" placeholder="Explain performance concerns, attendance, or policy issues..." />
                      </div>

                      <div className="space-y-2">
                        <label className="text-[9px] font-display uppercase tracking-widest font-black text-slate-800">
                          Action Required / Suggested
                        </label>
                        <textarea required value={formData.actionRequired || ""} onChange={(e) => setFormData({...formData, actionRequired: e.target.value})} className="form-theme-input min-h-[100px]" placeholder="Immediate action suggested or corrective goals..." />
                      </div>

                      <div className="border-t border-slate-200 pt-6 space-y-4">
                        <h4 className="text-[10px] font-display uppercase tracking-[0.2em] font-black text-[#D11242]">
                          Acknowledge & Received Sign-offs
                        </h4>
                        <p className="text-[10px] text-zinc-500 leading-relaxed italic">
                          "I, <span className="font-bold underline text-slate-900">{formData.concernedStaffName || "[Staff Name]"}</span>, hereby acknowledge that report provided by myself is true."
                        </p>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                          <div className="space-y-1">
                            <label className="text-[8px] font-display uppercase tracking-widest font-bold text-slate-500">Staff Name Under Discussion</label>
                            <input type="text" value={formData.staffName || ""} onChange={(e) => setFormData({...formData, staffName: e.target.value})} className="form-theme-input" />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[8px] font-display uppercase tracking-widest font-bold text-slate-500">Staff Signature</label>
                            <input type="text" value={formData.staffSignature || ""} onChange={(e) => setFormData({...formData, staffSignature: e.target.value})} className="form-theme-input" placeholder="Type signature" />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[8px] font-display uppercase tracking-widest font-bold text-slate-500">Staff Date Signed</label>
                            <input type="date" value={formData.staffSigDate || ""} onChange={(e) => setFormData({...formData, staffSigDate: e.target.value})} className="form-theme-input" />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 border-t border-slate-100 pt-4">
                          <div className="space-y-1">
                            <label className="text-[8px] font-display uppercase tracking-widest font-bold text-slate-500">Admin Manager Approved</label>
                            <input type="text" value={formData.adminName || ""} onChange={(e) => setFormData({...formData, adminName: e.target.value})} className="form-theme-input" placeholder="Type name" />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[8px] font-display uppercase tracking-widest font-bold text-slate-500">Admin Department</label>
                            <input type="text" value={formData.adminDept || ""} onChange={(e) => setFormData({...formData, adminDept: e.target.value})} className="form-theme-input" placeholder="Admin Department" />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[8px] font-display uppercase tracking-widest font-bold text-slate-500">Admin Signature</label>
                            <input type="text" value={formData.adminSignature || ""} onChange={(e) => setFormData({...formData, adminSignature: e.target.value})} className="form-theme-input" placeholder="Type to sign" />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[8px] font-display uppercase tracking-widest font-bold text-slate-500">Admin Sign Date</label>
                            <input type="date" value={formData.adminSigDate || ""} onChange={(e) => setFormData({...formData, adminSigDate: e.target.value})} className="form-theme-input" />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Form 12: Training Form */}
                  {activeFormId === "training-form" && (
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-[8px] font-display uppercase tracking-widest font-bold text-slate-500">Date of Training</label>
                          <input type="date" required value={formData.date || ""} onChange={(e) => setFormData({...formData, date: e.target.value})} className="form-theme-input" />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[8px] font-display uppercase tracking-widest font-bold text-slate-500">Department</label>
                          <input type="text" required value={formData.department || ""} onChange={(e) => setFormData({...formData, department: e.target.value})} className="form-theme-input" />
                        </div>
                        <div className="space-y-1 md:col-span-2">
                          <label className="text-[8px] font-display uppercase tracking-widest font-bold text-slate-500">Topic / Subject Title</label>
                          <input type="text" required value={formData.topicsSubject || ""} onChange={(e) => setFormData({...formData, topicsSubject: e.target.value})} className="form-theme-input" placeholder="e.g. Fire Safety & Evacuation Drills" />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[8px] font-display uppercase tracking-widest font-bold text-slate-500">Training Conducted By</label>
                          <input type="text" required value={formData.conductedBy || ""} onChange={(e) => setFormData({...formData, conductedBy: e.target.value})} className="form-theme-input" />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[8px] font-display uppercase tracking-widest font-bold text-slate-500">Key Present Employees (Summary)</label>
                          <input type="text" value={formData.employeesPresent || ""} onChange={(e) => setFormData({...formData, employeesPresent: e.target.value})} className="form-theme-input" placeholder="e.g. Front Office Night Shift crew" />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-[9px] font-display uppercase tracking-widest font-black text-slate-800">
                          Topics Discussed in Training
                        </label>
                        <textarea required value={formData.topicsDetails || ""} onChange={(e) => setFormData({...formData, topicsDetails: e.target.value})} className="form-theme-input min-h-[140px]" placeholder="Detailed descriptions of training points..." />
                      </div>

                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <h4 className="text-[10px] font-display uppercase tracking-widest font-black text-slate-800">
                            Training Attendance Matrix List
                          </h4>
                          <button
                            type="button"
                            onClick={() => setTrainingParticipants([...trainingParticipants, { name: "", signature: "" }])}
                            className="text-[9px] font-display text-emerald-600 hover:text-emerald-800 flex items-center gap-1 font-extrabold uppercase tracking-widest"
                          >
                            <Plus size={10} /> Add Student Row
                          </button>
                        </div>
                        
                        <div className="overflow-x-auto">
                          <table className="w-full text-left text-xs border border-slate-200 min-w-[500px]">
                            <thead>
                              <tr className="bg-slate-100 border-b border-slate-200">
                                <th className="p-2.5 font-display text-[9px] uppercase tracking-widest font-bold w-1/2">Staff Name</th>
                                <th className="p-2.5 font-display text-[9px] uppercase tracking-widest font-bold w-1/2">Attendance Signature / Confirmation</th>
                                <th className="p-2.5 text-center"></th>
                              </tr>
                            </thead>
                            <tbody>
                              {trainingParticipants.map((row, idx) => (
                                <tr key={idx} className="border-b border-slate-150">
                                  <td className="p-1.5">
                                    <input 
                                      type="text" 
                                      placeholder="Employee Student Name" 
                                      value={row.name} 
                                      onChange={(e) => {
                                        const next = [...trainingParticipants];
                                        next[idx].name = e.target.value;
                                        setTrainingParticipants(next);
                                      }}
                                      className="w-full p-2 border border-slate-200 text-xs text-slate-800"
                                    />
                                  </td>
                                  <td className="p-1.5">
                                    <input 
                                      type="text" 
                                      placeholder="Employee Sign" 
                                      value={row.signature} 
                                      onChange={(e) => {
                                        const next = [...trainingParticipants];
                                        next[idx].signature = e.target.value;
                                        setTrainingParticipants(next);
                                      }}
                                      className="w-full p-2 border border-slate-200 text-xs text-slate-800 font-mono italic"
                                    />
                                  </td>
                                  <td className="p-1.5 text-center">
                                    {trainingParticipants.length > 1 && (
                                      <button 
                                        type="button" 
                                        onClick={() => setTrainingParticipants(trainingParticipants.filter((_, i) => i !== idx))}
                                        className="text-red-500 hover:text-red-700"
                                      >
                                        <Trash2 size={13} />
                                      </button>
                                    )}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>

                      <div className="border-t border-slate-200 pt-6 space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
                          <div className="space-y-1">
                            <label className="text-[8px] font-display uppercase tracking-widest font-bold text-slate-500">Trainer Signature</label>
                            <input type="text" required value={formData.staffSignature || ""} onChange={(e) => setFormData({...formData, staffSignature: e.target.value})} className="form-theme-input" placeholder="Type name to sign" />
                            <input type="date" required value={formData.staffSigDate || ""} onChange={(e) => setFormData({...formData, staffSigDate: e.target.value})} className="form-theme-input mt-1" />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[8px] font-display uppercase tracking-widest font-bold text-slate-500">Dept. Manager Signature</label>
                            <input type="text" required value={formData.deptManagerSignature || ""} onChange={(e) => setFormData({...formData, deptManagerSignature: e.target.value})} className="form-theme-input" placeholder="Type to sign" />
                            <input type="date" required value={formData.deptManagerSigDate || ""} onChange={(e) => setFormData({...formData, deptManagerSigDate: e.target.value})} className="form-theme-input mt-1" />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[8px] font-display uppercase tracking-widest font-bold text-slate-500">Admin Manager Signature</label>
                            <input type="text" required value={formData.adminManagerSignature || ""} onChange={(e) => setFormData({...formData, adminManagerSignature: e.target.value})} className="form-theme-input" placeholder="Type to sign" />
                            <input type="date" required value={formData.adminManagerSigDate || ""} onChange={(e) => setFormData({...formData, adminManagerSigDate: e.target.value})} className="form-theme-input mt-1" />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                </div>

                {/* OFFICIAL EMBEDDED PRINT FOOTER */}
                <div className="relative z-10 bg-[#D11242] text-white p-6 md:p-8 flex flex-col md:flex-row justify-between items-center gap-4">
                  <div className="text-center md:text-left space-y-1 md:max-w-md">
                    <span className="text-[9px] tracking-widest font-display block uppercase font-extrabold text-stone-200">
                      www.ramadawailoaloafiji.com
                    </span>
                    <p className="text-[7.5px] text-stone-150 leading-tight">
                      © Ramada Suites by Wyndham. All rights reserved. The hotel is independently owned and operated.
                    </p>
                  </div>
                  <div>
                    <span className="font-serif italic text-base tracking-widest font-black uppercase text-stone-100 flex items-center gap-1.5">
                      RAMADA <span className="text-[7px] tracking-[0.2em] font-sans uppercase bg-white text-[#D11242] px-2.5 py-1 font-black rounded-sm">SUITES</span>
                    </span>
                  </div>
                </div>

              </div>

              {/* SAVE & DOWNLOAD AS PDF TOOLBAR */}
              <div className="flex flex-col sm:flex-row justify-between items-center gap-4 border-t border-slate-200 pt-6 no-print">
                <div className="flex items-center gap-2">
                  {selectedSubmission && (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedSubmission(null);
                        setCurrentView("history");
                      }}
                      className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md text-[9px] font-display uppercase tracking-widest font-black transition-all"
                    >
                      Back to History Logs
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                  <button
                    type="button"
                    onClick={triggerDownloadPDF}
                    className="px-6 py-3 bg-[#D11242] hover:bg-rose-700 text-white rounded-md text-[10px] font-display uppercase tracking-widest font-black transition-all flex items-center justify-center gap-2 shadow-lg hover:scale-[1.03] active:scale-[0.97] duration-150"
                  >
                    <Download size={14} /> Download as PDF
                  </button>
                  
                  {!selectedSubmission ? (
                    <button
                      type="submit"
                      disabled={isSaving}
                      className="px-8 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-md text-[10px] font-display uppercase tracking-widest font-black transition-all flex items-center justify-center gap-2 shadow-md disabled:opacity-50 hover:scale-[1.03] active:scale-[0.97] duration-150"
                    >
                      {isSaving ? "Saving..." : "Submit & Record Form"}
                    </button>
                  ) : (
                    <div className="text-[10px] font-display uppercase tracking-widest font-black text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-sm border border-emerald-200 flex items-center gap-1.5">
                      <Check size={12} /> Submission Recorded
                    </div>
                  )}
                </div>
              </div>

            </form>
          </div>
        )}

        {/* VIEW 3: Submission Records & History */}
        {currentView === "history" && (
          <div className="space-y-6">
            <div className="text-left space-y-2 mb-8">
              <h2 className="text-3xl font-serif italic text-slate-950">Form Submission History Log</h2>
              <p className="text-slate-500 text-xs">
                A persistent record of all staff and personnel who have written, signed, or submitted hotel forms. Type names, form names or dates to filter the active logs.
              </p>
            </div>

            {/* SEARCH BOX */}
            <div className="bg-white p-4 border border-slate-200 shadow-sm rounded-lg flex items-center gap-3 no-print">
              <Search className="text-slate-400" size={18} />
              <input
                type="text"
                placeholder="Search history by staff name, form, submitter email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-transparent outline-none text-slate-800 text-xs"
              />
            </div>

            {/* HISTORY LIST */}
            <div className="bg-white border border-slate-250/70 rounded-xl overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-100 border-b border-slate-200 text-slate-700 font-display text-[9px] uppercase tracking-widest font-bold">
                      <th className="p-4">Timestamp</th>
                      <th className="p-4">Form Name</th>
                      <th className="p-4">Staff Member / Subject</th>
                      <th className="p-4">Submitted By</th>
                      <th className="p-4 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredSubmissions.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="p-12 text-center text-slate-400 font-medium">
                          No submission records found following this query.
                        </td>
                      </tr>
                    ) : (
                      filteredSubmissions.map((sub) => (
                        <tr key={sub.id} className="border-b border-zinc-150 hover:bg-slate-50 transition-colors">
                          <td className="p-4 text-zinc-600 font-mono text-[11px]">
                            {new Date(sub.timestamp).toLocaleString("en-US", {
                              year: "numeric",
                              month: "short",
                              day: "2-digit",
                              hour: "2-digit",
                              minute: "2-digit"
                            })}
                          </td>
                          <td className="p-4 font-serif italic text-sm text-slate-900 font-semibold">
                            {sub.formName}
                          </td>
                          <td className="p-4 font-medium text-slate-800">
                            {sub.staffName || "N/A"}
                          </td>
                          <td className="p-4 text-zinc-500 font-mono">
                            {sub.filledBy}
                          </td>
                          <td className="p-4 text-center">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={() => {
                                  setSelectedSubmission(sub);
                                  // Map dynamic arrays if present
                                  setFormData(sub.data);
                                  if (sub.formId === "discussion") {
                                    setDiscussionPoints(sub.data.discussionPoints || Array(15).fill(""));
                                    setDiscussionParticipants(sub.data.discussionParticipants || []);
                                  } else if (sub.formId === "training-form") {
                                    setTrainingParticipants(sub.data.trainingParticipants || []);
                                  }
                                  setActiveFormId(sub.formId);
                                  setCurrentView("write");
                                }}
                                className="px-3 py-1 bg-[#D11242]/10 hover:bg-[#D11242] hover:text-white text-[#D11242] text-[9px] font-display uppercase tracking-widest font-extrabold rounded transition-all"
                              >
                                View File
                              </button>
                              
                              <button
                                onClick={() => setDeleteTarget({ id: sub.id, name: sub.formName || "Record" })}
                                className="p-1.5 text-rose-500 hover:bg-[#D11242]/10 rounded transition-all transition-colors"
                                title="Delete Record"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

      </div>

      <ConfirmModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteSubmissionConfirm}
        title="Delete Form Record?"
        description={`Are you sure you want to permanently delete the form record for "${deleteTarget?.name}"? This action is irreversible.`}
        confirmLabel="Pinpoint Deletion"
        cancelLabel="Preserve Record"
        variant="danger"
      />

      <style>{`
        .form-theme-input {
          width: 100%;
          padding: 10px;
          border: 1.5px solid #CBD5E1;
          background-color: #FFFFFF;
          color: #1E293B;
          font-family: inherit;
          font-size: 11px;
          outline: none;
          transition: all 0.15s ease-in-out;
        }
        .form-theme-input:focus {
          border-color: #D11242;
          box-shadow: 0 0 0 1px rgba(209, 18, 66, 0.15);
        }
        @media print {
          /* Setup basic print canvas and override gray bounds */
          html, body {
            background-color: #FFFFFF !important;
            color: #000000 !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          body * {
            visibility: hidden !important;
          }
          .no-print, .no-print * {
            display: none !important;
            height: 0 !important;
            width: 0 !important;
            overflow: hidden !important;
          }
          /* Ensure print container remains prominently visible & full size */
          .print-container, .print-container * {
            visibility: visible !important;
          }
          .print-container {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            border: none !important;
            box-shadow: none !important;
            margin: 0 !important;
            padding: 0 !important;
            background-color: #FFFFFF !important;
          }
          /* High-end clean form formatting */
          input.form-theme-input, 
          select.form-theme-input, 
          textarea.form-theme-input {
            border: none !important;
            border-bottom: 1.5px solid #000000 !important;
            border-radius: 0 !important;
            padding: 4px 1px !important;
            background: transparent !important;
            color: #000000 !important;
            font-size: 12px !important;
            font-weight: 500 !important;
            box-shadow: none !important;
            transition: none !important;
          }
          textarea.form-theme-input {
            border-bottom: 1.5px dashed #4b5563 !important;
            height: auto !important;
            resize: none !important;
            overflow: visible !important;
            white-space: pre-wrap !important;
          }
          select.form-theme-input {
            appearance: none !important;
            -webkit-appearance: none !important;
            background-image: none !important;
          }
          /* Custom styled checkboxes for precise physical checkmark printout */
          input[type="checkbox"] {
            appearance: none !important;
            -webkit-appearance: none !important;
            -moz-appearance: none !important;
            width: 14px !important;
            height: 14px !important;
            border: 1.5px solid #000000 !important;
            display: inline-block !important;
            position: relative !important;
            vertical-align: middle !important;
            margin-right: 6px !important;
            background-color: transparent !important;
          }
          input[type="checkbox"]:checked::after {
            content: "✔" !important;
            font-size: 12px !important;
            font-weight: bold !important;
            color: #D11242 !important;
            position: absolute !important;
            top: -3px !important;
            left: 1.5px !important;
            display: block !important;
          }
          /* High-resolution vector background graphics enforcement */
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          @page {
            size: A4 portrait;
            margin: 1.5cm 1.5cm 1.5cm 1.5cm;
          }
        }
      `}</style>
    </div>
  );
};
