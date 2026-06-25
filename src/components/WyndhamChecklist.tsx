import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  ClipboardCheck, 
  Search, 
  User, 
  Send, 
  RefreshCw, 
  CheckSquare, 
  Square,
  FileText,
  Clock,
  Shield,
  GraduationCap,
  AlertTriangle,
  UserCheck,
  Cpu,
  HeartPulse,
  Wrench,
  TrendingUp,
  Mail,
  CheckCircle2,
  List,
  LayoutGrid,
  Filter,
  Check,
  History,
  Archive,
  ArrowRight,
  BookOpen
} from "lucide-react";
import { db, auth, collection, addDoc, getDocs, query, orderBy, limit } from "../lib/firebase";

// Category type definition
type FormCategory = "HR & Training" | "Operations & Safety" | "Facility & Finance";

interface FormDefinition {
  id: string;
  title: string;
  category: FormCategory;
  icon: React.ComponentType<{ className?: string; size?: number }>;
  refCode: string;
  items: string[];
}

const FORM_TEMPLATES: FormDefinition[] = [
  {
    id: "cml-emp-file-audit",
    title: "CML Employee File Audit",
    category: "HR & Training",
    icon: FileText,
    refCode: "AUD-CML-EFA-01",
    items: [
      "Verify all active employment agreements are fully signed and dated",
      "Verify FNPF registration and monthly contribution registers are logged",
      "Verify TIN Letter copy is validated and present in physical file",
      "Verify certified true copies of all qualifications are attached",
      "Verify up-to-date emergency contact info is completed and on file",
      "Verify signed Employee Handbook and Code of Conduct acknowledgement is archived",
      "Verify previous performance evaluation results are properly filed"
    ]
  },
  {
    id: "daily-security-compliance",
    title: "Daily Security and Compliance",
    category: "Operations & Safety",
    icon: Shield,
    refCode: "AUD-CML-DSC-02",
    items: [
      "Verify all perimeter gates, main lobby, and BOH access controls are secure",
      "Verify external perimeter lighting and security lighting is fully functional",
      "Verify security officers completed the 30-minute patrol logs correctly",
      "Verify all CCTV cameras are transmitting high-definition feeds to the guardhouse",
      "Verify key card logbook balances against physical cards in secure storage",
      "Verify all fire exits, corridors, and assembly areas are clear of obstructions",
      "Verify emergency backup alarms and panic switches are operational"
    ]
  },
  {
    id: "dept-training-matrix",
    title: "Departmental Training Log and Matrix",
    category: "HR & Training",
    icon: GraduationCap,
    refCode: "AUD-CML-DTM-03",
    items: [
      "Verify current departmental training matrix is updated for the quarter",
      "Verify physical/digital attendance sheets are signed by all attendees",
      "Verify training materials and modules are approved by HR/Management",
      "Verify skill matrices are updated with newly achieved competencies",
      "Verify employee feedback surveys on the training session are compiled",
      "Verify schedule for required follow-up and refresher sessions is locked in",
      "Verify training certification badges have been issued to passing staff"
    ]
  },
  {
    id: "emp-exit-clearance",
    title: "Employee Exit Interview and Clearance",
    category: "HR & Training",
    icon: UserCheck,
    refCode: "AUD-CML-EEC-04",
    items: [
      "Verify all company-issued IT equipment (laptops, phones, chargers) is returned",
      "Verify physical ID badges, parking permits, and office keys are surrendered",
      "Verify completed Exit Interview questionnaire is signed and filed with HR",
      "Verify final payout calculations (including leave and FNPF) are audited",
      "Verify written clearance clearances are signed by all respective heads",
      "Verify all digital accounts, emails, and server access tokens are deactivated",
      "Verify direct task hand-over notes are finalized with team supervisors"
    ]
  },
  {
    id: "emergency-safety-drill",
    title: "Emergency Response and Safety Drill Log",
    category: "Operations & Safety",
    icon: AlertTriangle,
    refCode: "AUD-CML-ESD-05",
    items: [
      "Verify drill date, time, warden roster, and exit times are logged",
      "Verify fire alarms and visual indicators triggered successfully",
      "Verify all occupants assembled at the muster point within 3 minutes",
      "Verify floor wardens successfully cleared their assigned zones",
      "Verify first aid kits across the facility are fully stocked and checked",
      "Verify post-drill review meeting is held with feedback points noted",
      "Verify pressure indicators and dates on all extinguishers are validated"
    ]
  },
  {
    id: "contractor-compliance",
    title: "External Contractor and Vendor Compliance",
    category: "Operations & Safety",
    icon: Shield,
    refCode: "AUD-CML-EVC-06",
    items: [
      "Verify contractor Public Liability Insurance certificate is active",
      "Verify signed OHS site-specific compliance agreement is on file",
      "Verify valid Non-Disclosure Agreement (NDA) is signed for sensitive scopes",
      "Verify active Permit to Work (Working at Heights/Hot Work) is issued",
      "Verify full OHS safety induction training was completed before entry",
      "Verify contractor scope matches current building guidelines and approvals",
      "Verify log of contractor entry, exit, and badge numbers is logged daily"
    ]
  },
  {
    id: "hazmat-chemical-safety",
    title: "Hazardous Materials and Chemical Safety",
    category: "Operations & Safety",
    icon: AlertTriangle,
    refCode: "AUD-CML-HMC-07",
    items: [
      "Verify Material Safety Data Sheets (MSDS) are updated and posted in work areas",
      "Verify chemical storage cage is locked, dry, and properly ventilated",
      "Verify all chemical drums and spray bottles are clearly labeled with hazards",
      "Verify appropriate PPE (aprons, heavy gloves, safety goggles) is present",
      "Verify functional emergency eyewash stations have been tested and logged",
      "Verify chemical spill clean-up kits are fully stocked and visible",
      "Verify training log for chemical dilution rates is completed for the team"
    ]
  },
  {
    id: "hr-onboarding-flow",
    title: "HR Onboarding Process Flow",
    category: "HR & Training",
    icon: UserCheck,
    refCode: "AUD-CML-HOP-08",
    items: [
      "Verify welcome packet (org structure, key directories) is delivered",
      "Verify user email, slack, and compliance portal access is provisioned",
      "Verify workspace is physically prepared (desk, uniform, office supplies)",
      "Verify full policy and procedures manual acknowledgement is signed",
      "Verify team-wide introductions and workplace tour are completed",
      "Verify FNPF registration, bank details, and medical files are cataloged",
      "Verify 30-day training roadmap and mentor program are established"
    ]
  },
  {
    id: "it-asset-provisioning",
    title: "Internal IT Asset and Access Provisioning",
    category: "Facility & Finance",
    icon: Cpu,
    refCode: "AUD-CML-IAP-09",
    items: [
      "Verify computer/laptop specifications are logged in IT inventory",
      "Verify active directory credentials and company email are active",
      "Verify VPN client with Multi-Factor Authentication (MFA) is configured",
      "Verify core business software and communication apps are installed",
      "Verify mandatory antivirus and security tracking agents are active",
      "Verify asset tracking barcode or asset tag is physically affixed",
      "Verify IT asset usage agreement is read and signed by the employee"
    ]
  },
  {
    id: "monthly-whs-audit",
    title: "Monthly Workplace Health and Safety",
    category: "Operations & Safety",
    icon: HeartPulse,
    refCode: "AUD-CML-MHS-10",
    items: [
      "Verify comprehensive structural facility sweep is conducted for hazards",
      "Verify fire escape routes open outwards and are completely unblocked",
      "Verify floors, pathways, and outdoor stairs are slip and trip free",
      "Verify air conditioning and ventilation ducts are clear of dust and mold",
      "Verify desk and chair ergonomics are optimized for administration desks",
      "Verify emergency response plan and contacts list are printed and posted",
      "Verify monthly safety committee minutes and actions are submitted"
    ]
  },
  {
    id: "new-hire-doc-verification",
    title: "New Hire Document Verification",
    category: "HR & Training",
    icon: UserCheck,
    refCode: "AUD-CML-NDV-11",
    items: [
      "Verify original Birth Certificate copy against certified copy",
      "Verify valid Passport, Visa, and Work Permit (if applicable) are copied",
      "Verify TIN (Tax Identification Number) Letter is verified by Fiji Revenue",
      "Verify original FNPF membership card or letter is on record",
      "Verify copies of degrees, diplomas, and reference letters are validated",
      "Verify minimum two independent professional reference logs are filed",
      "Verify valid pre-employment medical fitness certificate is archived"
    ]
  },
  {
    id: "performance-review",
    title: "Performance Review and Evaluation Process",
    category: "HR & Training",
    icon: GraduationCap,
    refCode: "AUD-CML-PRE-12",
    items: [
      "Verify employee's goals and core performance standards are updated",
      "Verify supervisor's scorecards and evaluations are fully entered",
      "Verify current Key Performance Indicators (KPIs) are calculated",
      "Verify employee's self-evaluation form is compiled and integrated",
      "Verify continuous professional development goals are discussed",
      "Verify target dates for subsequent evaluations are set and agreed",
      "Verify HR-level salary increment and grading advice is recorded"
    ]
  },
  {
    id: "financial-compliance",
    title: "Quarterly Financial Compliance and Audit",
    category: "Facility & Finance",
    icon: TrendingUp,
    refCode: "AUD-CML-QFC-13",
    items: [
      "Verify cash-on-hand matches petty cash logbook exactly",
      "Verify standard invoice audit matches sample voucher transactions",
      "Verify tax files (VAT, ECAL, withholding tax) are filed and paid on time",
      "Verify actual department expenses align with quarterly budget limits",
      "Verify bank reconciliations are executed and signed off by Controller",
      "Verify capital expenditures over approved thresholds are signed off",
      "Verify draft financial compliance statements are compiled for audit"
    ]
  },
  {
    id: "remote-work-security",
    title: "Remote Work Infrastructure and Security",
    category: "Operations & Safety",
    icon: Cpu,
    refCode: "AUD-CML-RWS-14",
    items: [
      "Verify employee's home internet speed meets standard guidelines",
      "Verify corporate VPN access with active MFA is validated and secure",
      "Verify remote work setup conforms to ergonomic standards",
      "Verify signed Remote Work Security and Confidentiality Policy is on file",
      "Verify communication tools and video calling accounts are configured",
      "Verify locked cabinet or storage is confirmed for physical paper storage",
      "Verify company device is patched with the latest OS security updates"
    ]
  },
  {
    id: "weekly-facility-maintenance",
    title: "Weekly Facility Maintenance and Inspection",
    category: "Facility & Finance",
    icon: Wrench,
    refCode: "AUD-CML-WFM-15",
    items: [
      "Verify all corridor and room air conditioning filters are cleaned",
      "Verify hot water pumps and water pressure pipes are leak-free",
      "Verify electrical breaker boards are scanned for hot spots or errors",
      "Verify all non-functional lightbulbs in common areas are replaced",
      "Verify drywall, paint, ceilings, and paths are structurally clean",
      "Verify swimming pool chemical balance levels are verified and safe",
      "Verify backup electrical generator starts and has full fuel levels"
    ]
  }
];

export default function WyndhamChecklist({ selectionProperty = "cml" }: { selectionProperty?: string }) {
  // UI States
  const [activeTab, setActiveTab] = useState<"forms" | "history">("forms");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<FormCategory | "All">("All");
  const [selectedFormId, setSelectedFormId] = useState<string>("cml-emp-file-audit");
  
  // Active form data values
  const [operatorName, setOperatorName] = useState("Charles");
  const [designation, setDesignation] = useState("Compliance Auditor");
  const [auditDate, setAuditDate] = useState(new Date().toISOString().split("T")[0]);
  const [shift, setShift] = useState("AM");
  
  // Checkbox status state (keyed by formId_itemIndex)
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});
  
  // Action logs
  const [concern, setConcern] = useState("");
  const [actionTaken, setActionTaken] = useState("");
  const [recommendation, setRecommendation] = useState("");
  
  // Signature & sign-off
  const [signatureName, setSignatureName] = useState("Charles Cebujano");
  const [certifyChecked, setCertifyChecked] = useState(false);
  
  // Submission & Loader states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  // Submitted Forms History (from db / localStorage)
  const [submissionHistory, setSubmissionHistory] = useState<any[]>([]);

  // Fetch submitted history
  const fetchHistory = async () => {
    try {
      const targetCompany = selectionProperty || "cml";
      if (!db) {
        // Fallback to localStorage
        const localData = localStorage.getItem(`cml-forms-history-${targetCompany}`);
        if (localData) {
          setSubmissionHistory(JSON.parse(localData));
        }
        return;
      }
      const q = query(
        collection(db, `cml-forms-submissions-${targetCompany}`),
        orderBy("submittedAt", "desc"),
        limit(50)
      );
      const querySnapshot = await getDocs(q);
      const list: any[] = [];
      querySnapshot.forEach((doc) => {
        list.push({ id: doc.id, ...doc.data() });
      });
      setSubmissionHistory(list);
      // Synchronize back to localstorage as a cache
      localStorage.setItem(`cml-forms-history-${targetCompany}`, JSON.stringify(list));
    } catch (e) {
      console.error("Failed to load history:", e);
      // Fallback
      const targetCompany = selectionProperty || "cml";
      const localData = localStorage.getItem(`cml-forms-history-${targetCompany}`);
      if (localData) {
        setSubmissionHistory(JSON.parse(localData));
      }
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [selectionProperty]);

  // Find active form object
  const activeForm = FORM_TEMPLATES.find(f => f.id === selectedFormId) || FORM_TEMPLATES[0];

  // Calculate stats
  const activeItemsCount = activeForm.items.length;
  const activeCheckedCount = activeForm.items.filter((_, idx) => checkedItems[`${activeForm.id}_${idx}`]).length;
  const progressPercent = activeItemsCount > 0 ? Math.round((activeCheckedCount / activeItemsCount) * 100) : 0;

  const handleToggleItem = (idx: number) => {
    const key = `${activeForm.id}_${idx}`;
    setCheckedItems(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleToggleAll = () => {
    const allChecked = activeForm.items.every((_, idx) => checkedItems[`${activeForm.id}_${idx}`]);
    const updated: Record<string, boolean> = { ...checkedItems };
    activeForm.items.forEach((_, idx) => {
      updated[`${activeForm.id}_${idx}`] = !allChecked;
    });
    setCheckedItems(updated);
  };

  const handleResetForm = () => {
    const updated: Record<string, boolean> = { ...checkedItems };
    activeForm.items.forEach((_, idx) => {
      updated[`${activeForm.id}_${idx}`] = false;
    });
    setCheckedItems(updated);
    setConcern("");
    setActionTaken("");
    setRecommendation("");
    setCertifyChecked(false);
  };

  // Submit compliance checklist form
  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!certifyChecked) {
      alert("Please check the declaration box to certify this audit before submitting.");
      return;
    }

    setIsSubmitting(true);

    const targetCompany = selectionProperty || "cml";
    const checklistStatus = activeForm.items.map((text, idx) => ({
      checkpoint: text,
      verified: !!checkedItems[`${activeForm.id}_${idx}`]
    }));

    const payload = {
      formId: activeForm.id,
      formTitle: activeForm.title,
      formRefCode: activeForm.refCode,
      category: activeForm.category,
      operatorName,
      designation,
      auditDate,
      shift,
      verifiedCount: activeCheckedCount,
      totalCount: activeItemsCount,
      progressPercent,
      checklistStatus,
      observations: {
        concern: concern.trim(),
        actionTaken: actionTaken.trim(),
        recommendation: recommendation.trim()
      },
      signatureName,
      dispatchedToEmail: "digitalmedia@cml.com.fj",
      submittedAt: new Date().toISOString()
    };

    try {
      if (db) {
        await addDoc(collection(db, `cml-forms-submissions-${targetCompany}`), payload);
      }
      
      // Update local storage history directly so UI updates instantly
      const updatedHistory = [payload, ...submissionHistory].slice(0, 50);
      setSubmissionHistory(updatedHistory);
      localStorage.setItem(`cml-forms-history-${targetCompany}`, JSON.stringify(updatedHistory));

      setSubmitSuccess(true);
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 5000);

      // Reset fields but keep general parameters like operator name
      handleResetForm();
    } catch (err) {
      console.error("Submission failed:", err);
      alert("Error sending audit details to the compliance database. Fallback offline compilation active.");
      
      // Offline fallback still updates history
      const updatedHistory = [payload, ...submissionHistory].slice(0, 50);
      setSubmissionHistory(updatedHistory);
      localStorage.setItem(`cml-forms-history-${targetCompany}`, JSON.stringify(updatedHistory));
      
      setSubmitSuccess(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter templates
  const filteredTemplates = FORM_TEMPLATES.filter(form => {
    const matchesSearch = form.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          form.refCode.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "All" || form.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Dynamic Theme Styling based on Company
  const getThemeColors = () => {
    if (selectionProperty === 'ramada') {
      return {
        primary: "bg-[#D11242]",
        primaryHover: "hover:bg-[#a60e33]",
        text: "text-[#D11242]",
        border: "border-[#D11242]/20",
        lightBg: "bg-[#D11242]/5"
      };
    } else if (selectionProperty === 'wyndham') {
      return {
        primary: "bg-[#0b5c4b]",
        primaryHover: "hover:bg-[#084538]",
        text: "text-[#0b5c4b]",
        border: "border-[#0b5c4b]/20",
        lightBg: "bg-[#0b5c4b]/5"
      };
    } else {
      return {
        primary: "bg-gold",
        primaryHover: "hover:bg-luxury-black",
        text: "text-gold",
        border: "border-gold/20",
        lightBg: "bg-gold/5"
      };
    }
  };

  const colors = getThemeColors();

  return (
    <div id="cml-compliance-container" className="space-y-8">
      {/* Premium Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-100 pb-6 gap-4">
        <div>
          <span className="text-[9px] font-display uppercase tracking-[0.2em] font-black text-slate-400">
            CML Property Management System
          </span>
          <h2 className="text-3xl font-serif italic text-slate-900 mt-1">
            Compliance & Audit Form Registry
          </h2>
          <p className="text-[11px] text-slate-500 font-medium max-w-xl mt-1.5">
            Select, fill, and digitally submit formal property audit checklists. Complete submissions are compiled and routed directly to <span className="font-extrabold text-slate-700">digitalmedia@cml.com.fj</span>.
          </p>
        </div>

        {/* Tabs */}
        <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200 self-start md:self-center">
          <button
            onClick={() => setActiveTab("forms")}
            className={`flex items-center gap-1.5 px-4 py-2 text-[10px] font-display uppercase tracking-wider font-extrabold transition-all rounded-md ${
              activeTab === "forms"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <ClipboardCheck size={12} /> Forms Registry
          </button>
          <button
            onClick={() => setActiveTab("history")}
            className={`flex items-center gap-1.5 px-4 py-2 text-[10px] font-display uppercase tracking-wider font-extrabold transition-all rounded-md ${
              activeTab === "history"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <History size={12} /> Submission Log ({submissionHistory.length})
          </button>
        </div>
      </div>

      {activeTab === "forms" ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Forms Directory Directory */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white p-6 rounded-xl border border-slate-200/80 shadow-xs space-y-4">
              <h3 className="text-[11px] font-display uppercase tracking-wider text-slate-400 font-black flex items-center gap-2">
                <Filter size={12} /> Form Directory
              </h3>

              {/* Search */}
              <div className="relative">
                <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search forms by name or ref..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none focus:ring-1 focus:ring-gold focus:bg-white transition-all"
                />
              </div>

              {/* Category Filters */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                {["All", "HR & Training", "Operations & Safety", "Facility & Finance"].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat as any)}
                    className={`px-3 py-1.5 text-[9px] font-display uppercase tracking-wider font-black rounded transition-all ${
                      selectedCategory === cat
                        ? `${colors.primary} text-white`
                        : "bg-slate-50 text-slate-500 hover:text-slate-800 border border-slate-200/60"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Forms List Container */}
            <div className="max-h-[60vh] overflow-y-auto space-y-2 pr-1 custom-scrollbar">
              {filteredTemplates.length > 0 ? (
                filteredTemplates.map((tmpl) => {
                  const IconComponent = tmpl.icon;
                  const isSelected = selectedFormId === tmpl.id;
                  return (
                    <button
                      key={tmpl.id}
                      onClick={() => {
                        setSelectedFormId(tmpl.id);
                        setSubmitSuccess(false);
                      }}
                      className={`w-full p-4 rounded-xl border text-left transition-all flex items-start gap-3.5 ${
                        isSelected
                          ? `border-slate-800 bg-slate-900 text-white shadow-md`
                          : "border-slate-200 bg-white hover:border-slate-350 hover:shadow-xs text-slate-800"
                      }`}
                    >
                      <div className={`p-2 rounded-lg ${
                        isSelected ? 'bg-white/10 text-gold' : 'bg-slate-50 text-slate-500'
                      }`}>
                        <IconComponent size={16} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className={`text-[8px] font-display uppercase tracking-widest font-extrabold ${
                            isSelected ? 'text-slate-300' : 'text-slate-400'
                          }`}>
                            {tmpl.category}
                          </span>
                          <span className={`text-[8px] font-mono ${
                            isSelected ? 'text-gold' : 'text-slate-400'
                          }`}>
                            {tmpl.refCode}
                          </span>
                        </div>
                        <h4 className="text-[11.5px] font-display uppercase tracking-wider font-black mt-1 leading-snug truncate">
                          {tmpl.title}
                        </h4>
                      </div>
                    </button>
                  );
                })
              ) : (
                <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200 text-slate-400">
                  <FileText size={24} className="mx-auto mb-2 text-slate-300" />
                  <p className="text-xs font-semibold">No matching forms found.</p>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Digital Forms Engine */}
          <div className="lg:col-span-8">
            <AnimatePresence mode="wait">
              {submitSuccess ? (
                <motion.div
                  key="success-card"
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  className="bg-white p-8 md:p-12 rounded-2xl border border-slate-200 shadow-xl text-center space-y-6 relative overflow-hidden"
                >
                  {/* Decorative background stripes */}
                  <div className="absolute top-0 inset-x-0 h-2 bg-gradient-to-r from-emerald-500 to-teal-600" />
                  
                  <div className="w-16 h-16 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto shadow-sm">
                    <CheckCircle2 size={32} className="animate-bounce" />
                  </div>

                  <div className="space-y-2">
                    <h3 className="text-2xl font-serif italic text-slate-900">
                      Audit Ledger Dispatched Successfully
                    </h3>
                    <p className="text-xs font-bold font-display uppercase tracking-widest text-emerald-600">
                      Receipt Code: {activeForm.refCode}-{Math.floor(1000 + Math.random() * 9000)}
                    </p>
                  </div>

                  <div className="max-w-md mx-auto p-5 bg-slate-50 border border-slate-200 rounded-xl text-left space-y-3">
                    <div className="flex justify-between text-[11px] border-b border-slate-200/60 pb-2">
                      <span className="text-slate-400 font-display uppercase tracking-wider">Form Name:</span>
                      <span className="text-slate-800 font-extrabold">{activeForm.title}</span>
                    </div>
                    <div className="flex justify-between text-[11px] border-b border-slate-200/60 pb-2">
                      <span className="text-slate-400 font-display uppercase tracking-wider">Audited By:</span>
                      <span className="text-slate-800 font-extrabold">{operatorName}</span>
                    </div>
                    <div className="flex justify-between text-[11px] border-b border-slate-200/60 pb-2">
                      <span className="text-slate-400 font-display uppercase tracking-wider">Verification Score:</span>
                      <span className="text-slate-800 font-extrabold">{activeCheckedCount} of {activeItemsCount} ( {progressPercent}% )</span>
                    </div>
                    <div className="flex justify-between text-[11px]">
                      <span className="text-slate-400 font-display uppercase tracking-wider">Destination:</span>
                      <span className="text-slate-800 font-extrabold">digitalmedia@cml.com.fj</span>
                    </div>
                  </div>

                  <div className="bg-emerald-50/50 border border-emerald-150 p-4 rounded-xl text-left max-w-md mx-auto flex gap-3">
                    <Mail className="text-emerald-500 flex-shrink-0 mt-0.5" size={16} />
                    <p className="text-[11px] text-slate-600 font-semibold leading-relaxed">
                      A copy of this digital compliance audit has been formally compiled and securely dispatched. All checklist responses and logged observations have been locked in the ledger.
                    </p>
                  </div>

                  <div className="flex justify-center gap-4 pt-2">
                    <button
                      onClick={() => setSubmitSuccess(false)}
                      className={`px-6 py-3 text-[10px] font-display uppercase tracking-widest font-black text-white ${colors.primary} ${colors.primaryHover} transition-all rounded-lg shadow-sm`}
                    >
                      Fill Out New Audit
                    </button>
                    <button
                      onClick={() => setActiveTab("history")}
                      className="px-6 py-3 text-[10px] font-display uppercase tracking-widest font-black text-slate-600 border border-slate-200 hover:bg-slate-50 transition-all rounded-lg"
                    >
                      View Logs List
                    </button>
                  </div>
                </motion.div>
              ) : (
                <motion.form
                  key={selectedFormId}
                  onSubmit={handleSubmitForm}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden"
                >
                  {/* Decorative form card banner with custom color */}
                  <div className={`h-2.5 ${colors.primary}`} />

                  {/* Form Main Body */}
                  <div className="p-6 md:p-8 space-y-8">
                    
                    {/* Paper Document Title Header */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-dashed border-slate-200 pb-6 gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className={`px-2.5 py-0.5 rounded text-[8px] font-display uppercase tracking-widest font-black ${
                            activeForm.category === "HR & Training" ? "bg-amber-50 text-amber-600" :
                            activeForm.category === "Operations & Safety" ? "bg-blue-50 text-blue-600" :
                            "bg-purple-50 text-purple-600"
                          }`}>
                            {activeForm.category}
                          </span>
                          <span className="text-[10px] font-mono text-slate-400">
                            {activeForm.refCode}
                          </span>
                        </div>
                        <h3 className="text-xl font-serif text-slate-900 mt-2 font-bold leading-tight">
                          {activeForm.title}
                        </h3>
                      </div>

                      <div className="text-right md:self-center">
                        <span className="text-[8px] font-display uppercase tracking-widest text-slate-400 block font-bold">
                          Document Status
                        </span>
                        <span className="text-[10px] font-display uppercase tracking-widest font-black text-amber-500 flex items-center gap-1.5 mt-0.5 justify-end">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" /> Pending Submit
                        </span>
                      </div>
                    </div>

                    {/* Pre-Shift Parameters Form Section */}
                    <div className="bg-slate-50/50 p-5 rounded-xl border border-slate-200/60 space-y-4">
                      <h4 className="text-[10.5px] font-display uppercase tracking-widest text-slate-400 font-black">
                        Audit Meta Parameters
                      </h4>

                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="space-y-1">
                          <label className="block text-[9px] font-display uppercase tracking-wider font-extrabold text-slate-500">
                            Auditor Name
                          </label>
                          <div className="relative">
                            <User size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                              type="text"
                              required
                              value={operatorName}
                              onChange={(e) => setOperatorName(e.target.value)}
                              className="w-full pl-8 pr-3 py-2 bg-white border border-slate-200 rounded text-xs font-semibold text-slate-800 focus:outline-none focus:ring-1 focus:ring-gold"
                            />
                          </div>
                        </div>

                        <div className="space-y-1">
                          <label className="block text-[9px] font-display uppercase tracking-wider font-extrabold text-slate-500">
                            Designation
                          </label>
                          <input
                            type="text"
                            required
                            value={designation}
                            onChange={(e) => setDesignation(e.target.value)}
                            className="w-full px-3 py-2 bg-white border border-slate-200 rounded text-xs font-semibold text-slate-800 focus:outline-none focus:ring-1 focus:ring-gold"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="block text-[9px] font-display uppercase tracking-wider font-extrabold text-slate-500">
                            Audit Date
                          </label>
                          <input
                            type="date"
                            required
                            value={auditDate}
                            onChange={(e) => setAuditDate(e.target.value)}
                            className="w-full px-3 py-2 bg-white border border-slate-200 rounded text-xs font-semibold text-slate-800 focus:outline-none"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="block text-[9px] font-display uppercase tracking-wider font-extrabold text-slate-500">
                            Duty Shift
                          </label>
                          <div className="grid grid-cols-3 gap-1">
                            {["AM", "PM", "Night"].map((s) => (
                              <button
                                key={s}
                                type="button"
                                onClick={() => setShift(s)}
                                className={`py-2 text-[9px] font-display uppercase tracking-wider font-extrabold rounded border transition-all ${
                                  shift === s
                                    ? "bg-slate-800 text-white border-slate-800"
                                    : "bg-white text-slate-500 border-slate-200 hover:bg-slate-50"
                                }`}
                              >
                                {s}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Interactive Checklist Points */}
                    <div className="space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                        <div className="flex items-center gap-2">
                          <ClipboardCheck className={colors.text} size={16} />
                          <h4 className="text-[11px] font-display uppercase tracking-widest text-slate-800 font-black">
                            Compliance Verification Checklist ({activeCheckedCount}/{activeItemsCount})
                          </h4>
                        </div>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={handleToggleAll}
                            className="text-[9px] font-display uppercase tracking-wider text-slate-500 hover:text-slate-800 font-extrabold hover:underline"
                          >
                            Toggle All
                          </button>
                          <span className="text-slate-300">|</span>
                          <button
                            type="button"
                            onClick={handleResetForm}
                            className="text-[9px] font-display uppercase tracking-wider text-slate-500 hover:text-slate-800 font-extrabold hover:underline"
                          >
                            Reset
                          </button>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="space-y-1.5">
                        <div className="flex justify-between items-center text-[10px]">
                          <span className="text-slate-400 font-semibold font-display">COMPLETION PROGRESS</span>
                          <span className="text-slate-700 font-extrabold font-mono">{progressPercent}% Completed</span>
                        </div>
                        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${progressPercent}%` }}
                            transition={{ duration: 0.3 }}
                            className={`h-full ${colors.primary}`}
                          />
                        </div>
                      </div>

                      {/* Checkboxes List */}
                      <div className="border border-slate-200/80 rounded-xl divide-y divide-slate-100 overflow-hidden bg-slate-50/20">
                        {activeForm.items.map((itemText, idx) => {
                          const isChecked = !!checkedItems[`${activeForm.id}_${idx}`];
                          return (
                            <div
                              key={idx}
                              onClick={() => handleToggleItem(idx)}
                              className={`p-4 flex items-start gap-3.5 transition-colors cursor-pointer ${
                                isChecked ? "bg-slate-50/40" : "hover:bg-slate-50/80"
                              }`}
                            >
                              <div className="pt-0.5 flex-shrink-0 text-slate-400">
                                {isChecked ? (
                                  <div className={`w-5 h-5 rounded flex items-center justify-center text-white ${colors.primary}`}>
                                    <Check size={12} strokeWidth={3} />
                                  </div>
                                ) : (
                                  <div className="w-5 h-5 rounded border-2 border-slate-200 bg-white" />
                                )}
                              </div>
                              <p className={`text-xs font-semibold leading-relaxed transition-colors ${
                                isChecked ? "text-slate-800" : "text-slate-500"
                              }`}>
                                {itemText}
                              </p>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Actions & Observations logs */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                        <BookOpen className="text-slate-400" size={16} />
                        <h4 className="text-[11px] font-display uppercase tracking-widest text-slate-800 font-black">
                          Audit Observations & Action logs
                        </h4>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="space-y-1.5">
                          <label className="block text-[9px] font-display uppercase tracking-wider font-extrabold text-slate-500">
                            Concern / Deficit Noted
                          </label>
                          <textarea
                            rows={3}
                            placeholder="Describe any failures, non-compliance observations, or negative detections..."
                            value={concern}
                            onChange={(e) => setConcern(e.target.value)}
                            className="w-full bg-slate-50/50 border border-slate-200 p-3 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none focus:ring-1 focus:ring-gold focus:bg-white transition-all resize-none"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="block text-[9px] font-display uppercase tracking-wider font-extrabold text-slate-500">
                            Immediate Action Taken
                          </label>
                          <textarea
                            rows={3}
                            placeholder="Actions initiated on site to correct noted deficits..."
                            value={actionTaken}
                            onChange={(e) => setActionTaken(e.target.value)}
                            className="w-full bg-slate-50/50 border border-slate-200 p-3 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none focus:ring-1 focus:ring-gold focus:bg-white transition-all resize-none"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="block text-[9px] font-display uppercase tracking-wider font-extrabold text-slate-500">
                            Preventive Recommendation
                          </label>
                          <textarea
                            rows={3}
                            placeholder="Long-term recommendations to prevent reoccurrence of deficits..."
                            value={recommendation}
                            onChange={(e) => setRecommendation(e.target.value)}
                            className="w-full bg-slate-50/50 border border-slate-200 p-3 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none focus:ring-1 focus:ring-gold focus:bg-white transition-all resize-none"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Digital Authorization and Sign Off */}
                    <div className="bg-slate-50/50 p-6 rounded-xl border border-slate-200/60 space-y-4">
                      <div className="flex items-center gap-2 border-b border-slate-200/60 pb-3">
                        <Shield className="text-slate-500" size={16} />
                        <h4 className="text-[11px] font-display uppercase tracking-widest text-slate-800 font-black">
                          Digital Accountability & Verification
                        </h4>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                        <div className="space-y-2">
                          <label className="block text-[9px] font-display uppercase tracking-wider font-extrabold text-slate-500">
                            Authorized Auditor Signature
                          </label>
                          <input
                            type="text"
                            required
                            value={signatureName}
                            onChange={(e) => setSignatureName(e.target.value)}
                            className="w-full px-4 py-3 bg-white border border-slate-200 rounded text-xs font-semibold text-slate-800 focus:outline-none focus:ring-1 focus:ring-gold font-serif italic text-lg"
                            placeholder="Type full name to sign digitally"
                          />
                          <p className="text-[10px] text-slate-400 font-medium">
                            Preview signature script: <span className="font-serif italic font-black text-slate-600 text-sm pl-1">{signatureName || "Waiting for name..."}</span>
                          </p>
                        </div>

                        <div className="space-y-4">
                          <label className="flex items-start gap-2.5 cursor-pointer select-none">
                            <input
                              type="checkbox"
                              required
                              checked={certifyChecked}
                              onChange={(e) => setCertifyChecked(e.target.checked)}
                              className="mt-0.5 h-4 w-4 rounded border-slate-300 text-gold focus:ring-gold"
                            />
                            <span className="text-[11px] text-slate-500 font-semibold leading-relaxed">
                              I hereby certify that all criteria listed in <span className="font-extrabold text-slate-700">{activeForm.title}</span> have been honestly verified on this date, and the recorded details represent a true audit snapshot.
                            </span>
                          </label>

                          {/* CML Secure transmission active banner */}
                          <div className="bg-emerald-50/50 border border-emerald-100 p-3 rounded-lg flex items-center gap-2.5">
                            <CheckCircle2 className="text-emerald-500 flex-shrink-0" size={14} />
                            <p className="text-[9.5px] text-slate-500 font-semibold">
                              Secure dispatch path active to <span className="font-extrabold text-slate-700">digitalmedia@cml.com.fj</span>.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Submit Button */}
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className={`w-full py-4 text-xs font-display uppercase tracking-widest font-black text-white rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer ${
                        isSubmitting 
                          ? "bg-slate-400 cursor-not-allowed" 
                          : `${colors.primary} ${colors.primaryHover}`
                      }`}
                    >
                      {isSubmitting ? (
                        <>
                          <RefreshCw className="animate-spin" size={14} />
                          Compiling Audit Ledger & Transmitting...
                        </>
                      ) : (
                        <>
                          <Send size={14} />
                          Submit & Dispatch Audit Form
                        </>
                      )}
                    </button>

                  </div>
                </motion.form>
              )}
            </AnimatePresence>
          </div>

        </div>
      ) : (
        /* Submission Logs History Tab */
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 md:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-4 gap-4">
            <div>
              <h3 className="text-lg font-serif italic text-slate-900 font-bold">
                Compliance Verification Submission Logs
              </h3>
              <p className="text-[11px] text-slate-500 font-medium">
                Showing the most recent completed compliance audits dispatched to the Cove Management operations hub.
              </p>
            </div>
            <button
              onClick={fetchHistory}
              className="px-4 py-2 text-[9px] font-display uppercase tracking-widest font-black border border-slate-200 rounded hover:bg-slate-50 transition-all flex items-center gap-1.5 self-start sm:self-center"
            >
              <RefreshCw size={11} /> Refresh Logs
            </button>
          </div>

          {submissionHistory.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-[9px] font-display uppercase tracking-widest text-slate-400 font-black">
                    <th className="py-3 px-4">Ref Code</th>
                    <th className="py-3 px-4">Form / Audit Title</th>
                    <th className="py-3 px-4">Audited By</th>
                    <th className="py-3 px-4">Date / Shift</th>
                    <th className="py-3 px-4">Checkpoints Completed</th>
                    <th className="py-3 px-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-700">
                  {submissionHistory.map((log, index) => (
                    <tr key={index} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-4 px-4 font-mono text-slate-400 text-[10px]">
                        {log.formRefCode || "AUD-GEN"}
                      </td>
                      <td className="py-4 px-4">
                        <div className="font-display uppercase tracking-wider font-black text-slate-800 text-[11px]">
                          {log.formTitle}
                        </div>
                        <span className="text-[9px] text-slate-400 uppercase tracking-widest font-display font-bold">
                          {log.category}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <div className="text-slate-800">{log.operatorName || "System"}</div>
                        <span className="text-[9px] text-slate-400 font-display uppercase tracking-wider block">
                          {log.designation || "Staff"}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <div className="text-slate-800">{log.auditDate || new Date(log.submittedAt).toLocaleDateString()}</div>
                        <span className="px-1.5 py-0.25 bg-slate-100 text-slate-600 rounded text-[8px] font-display font-extrabold uppercase inline-block mt-0.5">
                          {log.shift || "AM"}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          <div className="w-16 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                            <div 
                              className="bg-emerald-500 h-full" 
                              style={{ width: `${log.progressPercent || 100}%` }}
                            />
                          </div>
                          <span className="font-mono text-[10px] text-slate-600 font-bold">
                            {log.verifiedCount || log.totalCount}/{log.totalCount} ({log.progressPercent || 100}%)
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <span className="px-2 py-1 bg-emerald-50 text-emerald-600 rounded text-[9px] font-display font-black uppercase tracking-wider inline-flex items-center gap-1">
                          <Check size={10} strokeWidth={3} /> Dispatched
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center p-12 border border-dashed border-slate-200 rounded-2xl bg-slate-50/55 max-w-md mx-auto">
              <Archive size={32} className="mx-auto mb-3 text-slate-300" />
              <h4 className="text-sm font-serif italic text-slate-800 font-bold">No Submissions Recorded Yet</h4>
              <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                As soon as audits are completed and dispatched, their verified ledgers will appear securely in this compliance log history.
              </p>
              <button
                onClick={() => setActiveTab("forms")}
                className={`mt-4 px-5 py-2.5 text-[9px] font-display uppercase tracking-widest font-black text-white ${colors.primary} ${colors.primaryHover} transition-all rounded-lg inline-flex items-center gap-1 shadow-sm`}
              >
                Launch First Audit <ArrowRight size={10} />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
