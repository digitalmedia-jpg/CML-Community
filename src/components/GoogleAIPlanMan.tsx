import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Sparkles, 
  X, 
  Brain, 
  Copy, 
  Check, 
  Download, 
  Trash, 
  History, 
  ChevronRight, 
  FileText, 
  Database,
  Building,
  Wand2,
  ListTodo,
  Plus,
  Compass,
  FileCheck
} from "lucide-react";
import { toastService } from "../services/toastService";

interface GoogleAIPlanManProps {
  isOpen: boolean;
  onClose: () => void;
  selectedCompany: string; // 'cml' | 'ramada' | 'wyndham'
  complaints: any[]; // active complaints to inject
}

interface SavedPlan {
  id: string;
  title: string;
  strategyType: string;
  property: string;
  prompt: string;
  result: string;
  createdAt: string;
  tasks: { text: string; done: boolean }[];
}

export const GoogleAIPlanMan: React.FC<GoogleAIPlanManProps> = ({
  isOpen,
  onClose,
  selectedCompany,
  complaints
}) => {
  const [strategyType, setStrategyType] = useState<string>("complaint-recovery");
  const [customContext, setCustomContext] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [generatedPlan, setGeneratedPlan] = useState<string>("");
  const [copied, setCopied] = useState<boolean>(false);
  const [savedPlans, setSavedPlans] = useState<SavedPlan[]>([]);
  const [activeTab, setActiveTab] = useState<"builder" | "history">("builder");
  const [selectedHistoryPlan, setSelectedHistoryPlan] = useState<SavedPlan | null>(null);
  
  // Mandatory safety triggers requested to prevent infinite loops, multiple firings, or programmatic triggers
  const [isSafetyUnlocked, setIsSafetyUnlocked] = useState<boolean>(false);
  const isGeneratingRef = useRef<boolean>(false);

  // Interactive checklist state for active plan
  const [checklist, setChecklist] = useState<{ text: string; done: boolean }[]>([]);

  // Load saved plans from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(`cml_saved_ai_plans_${selectedCompany}`);
      if (stored) {
        setSavedPlans(JSON.parse(stored));
      }
    } catch (e) {
      console.error("Failed to load saved plans:", e);
    }
  }, [selectedCompany]);

  // Save plans to localStorage
  const savePlansToStorage = (updatedPlans: SavedPlan[]) => {
    try {
      localStorage.setItem(`cml_saved_ai_plans_${selectedCompany}`, JSON.stringify(updatedPlans));
      setSavedPlans(updatedPlans);
    } catch (e) {
      console.error("Failed to persist saved plans:", e);
    }
  };

  const getCompanyLabel = (code: string) => {
    const c = code.toLowerCase();
    if (c === "ramada") return "Ramada Suites Wailoaloa Beach";
    if (c === "wyndham") return "Wyndham Garden Fiji";
    return "Cove Management Ltd (HQ)";
  };

  // Pre-load prompt with company state
  const handleInjectData = (dataType: "complaints" | "standards" | "revenue") => {
    if (dataType === "complaints") {
      const propertyComplaints = complaints.filter(
        c => !c.propertyId || c.propertyId.toLowerCase() === selectedCompany.toLowerCase()
      );

      if (propertyComplaints.length === 0) {
        toastService.warning(
          "Data Ingestion Warning", 
          `No active complaints recorded for ${selectedCompany.toUpperCase()} to inject.`
        );
        return;
      }

      const complaintSummary = propertyComplaints
        .map((c, idx) => `[${idx + 1}] Guest: ${c.guestName || "Anon"}, Room: ${c.roomNumber || "N/A"}, Issue: ${c.description || c.type} (Priority: ${c.priority || "Medium"})`)
        .join("\n");

      setCustomContext(prev => prev + (prev ? "\n\n" : "") + `ACTIVE COMPLAINTS FOR AUDIT:\n${complaintSummary}`);
      toastService.success("Data Ingestion Success", "Loaded active complaints data into Plan Man prompt successfully.");
    } else if (dataType === "standards") {
      const standardText = `BRAND STANDARDS SOP ALIGNMENT AUDIT:
- Verify front-desk reception response time to under 3 minutes.
- Audit electronic lock synchronization and keycard master checkoffs.
- Enforce standard housekeeping room turn-over time of 35 minutes per suite.
- Re-validate regional high-occupancy guest greeting etiquette constraints.`;
      setCustomContext(prev => prev + (prev ? "\n\n" : "") + standardText);
      toastService.success("Data Ingestion Success", "Standards guideline references appended successfully.");
    } else if (dataType === "revenue") {
      const revenueText = `DYNAMIC REVENUE MANAGEMENT CONSTRAINTS:
- Mid-week occupancy targets: 72%
- Current weekend BAR (Best Available Rate) margin skew: +12%
- Strategic corporate allocation priority: 25% allocation limit
- Main OTA channel price parity discrepancy limits: +/-1.5%`;
      setCustomContext(prev => prev + (prev ? "\n\n" : "") + revenueText);
      toastService.success("Data Ingestion Success", "Corporate revenue metrics and yield bounds appended.");
    }
  };

  const generatePlanAction = async () => {
    if (isGeneratingRef.current) {
      toastService.warning("Action Blocked", "Another strategy synthesis is currently in progress. Please wait.");
      return;
    }
    if (!isSafetyUnlocked) {
      toastService.warning("Safety Lock Enabled", "Please unlock the Strict Manual AI Synthesis Trigger to authorize Gemini API usage.");
      return;
    }
    if (!customContext.trim()) {
      toastService.warning("Required Input", "Please provide operational context or inject data first.");
      return;
    }

    isGeneratingRef.current = true;
    setIsGenerating(true);
    setGeneratedPlan("");
    setChecklist([]);

    const fullPrompt = `Strategy Request Type: ${strategyType.toUpperCase()}
Property: ${getCompanyLabel(selectedCompany)} (${selectedCompany.toUpperCase()})
Instructions and operational state context:
${customContext}`;

    try {
      const response = await fetch("/api/ai/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: fullPrompt,
          type: "strategy"
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to generate strategy plan.");
      }

      const data = await response.json();
      const planText = data.analysis;
      setGeneratedPlan(planText);

      // Auto-extract checklist from lines containing actions or lists
      const extractedTasks = planText
        .split("\n")
        .filter((line: string) => /^[*\-\d]+\.?\s+\[?\s*\d*\]?\s*/.test(line.trim())) // lines starting with list markers
        .map((line: string) => ({
          text: line.replace(/^[*\-\d]+\.?\s+/, "").trim(),
          done: false
        }))
        .filter((t: any) => t.text.length > 5 && t.text.length < 150)
        .slice(0, 8); // take top 8 action steps

      setChecklist(extractedTasks);
      setIsSafetyUnlocked(false); // Reset unlock state on success to compel manual re-authorization for the next call
      toastService.success("Plan Created", "Google AI Plan Man has completed the dynamic strategy synthesis!");

    } catch (err: any) {
      console.error("[Plan Man Call Failed]", err);
      toastService.error("Synthesis Failed", err.message || "An unexpected error occurred during model analysis.");
    } finally {
      isGeneratingRef.current = false;
      setIsGenerating(false);
    }
  };

  const saveCurrentPlanToHistory = () => {
    if (!generatedPlan) return;
    
    // Deduce a smart title based on strategyType
    const titleMap: Record<string, string> = {
      "complaint-recovery": "Guest Complaint Recovery Blueprint & Response Draft",
      "revenue-yield": "Strategic Yield Optimization & Rate Parity Action Plan",
      "sop-standards": "SOP Alignment & Quality Assurance Roadmap",
      "maintenance-audit": "Preventative Asset Audit & Maintenance Workflow"
    };
    
    const newPlan: SavedPlan = {
      id: Math.random().toString(36).substr(2, 9),
      title: titleMap[strategyType] || "Custom Digital Hospitality Strategy Plan",
      strategyType,
      property: selectedCompany.toUpperCase(),
      prompt: customContext,
      result: generatedPlan,
      tasks: checklist,
      createdAt: new Date().toLocaleString()
    };

    const updated = [newPlan, ...savedPlans];
    savePlansToStorage(updated);
    toastService.success("Plan Saved", "The strategy plan has been permanently saved to the corporate dashboard archives.");
  };

  const deleteSavedPlan = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const filtered = savedPlans.filter(p => p.id !== id);
    savePlansToStorage(filtered);
    if (selectedHistoryPlan?.id === id) {
      setSelectedHistoryPlan(null);
    }
    toastService.success("Plan Deleted", "Strategy plan removed from archives.");
  };

  const copyToClipboard = () => {
    const textToCopy = selectedHistoryPlan ? selectedHistoryPlan.result : generatedPlan;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    toastService.success("Copied to Clipboard", "Full strategy document text has been copied to your clipboard.");
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadPlan = () => {
    const textToCopy = selectedHistoryPlan ? selectedHistoryPlan.result : generatedPlan;
    const title = selectedHistoryPlan ? selectedHistoryPlan.title : "CML_AI_Strategy_Plan";
    const element = document.createElement("a");
    const file = new Blob([textToCopy], { type: "text/plain;charset=utf-8" });
    element.href = URL.createObjectURL(file);
    element.download = `${title.replace(/\s+/g, "_")}_${selectedCompany.toUpperCase()}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    toastService.success("Plan Exported", "Document exported as standalone text file.");
  };

  const toggleTask = (index: number) => {
    if (selectedHistoryPlan) {
      const updatedTasks = [...selectedHistoryPlan.tasks];
      updatedTasks[index].done = !updatedTasks[index].done;
      
      const updatedPlans = savedPlans.map(p => 
        p.id === selectedHistoryPlan.id ? { ...p, tasks: updatedTasks } : p
      );
      savePlansToStorage(updatedPlans);
      setSelectedHistoryPlan({ ...selectedHistoryPlan, tasks: updatedTasks });
    } else {
      const updated = [...checklist];
      updated[index].done = !updated[index].done;
      setChecklist(updated);
    }
  };

  // Helper to parse double asterisks and hash headings in text beautifully
  const renderFormattedResult = (text: string) => {
    if (!text) return null;
    return text.split("\n").map((line, idx) => {
      const trimmed = line.trim();
      
      // Case if it is a main heading
      if (trimmed.startsWith("###")) {
        return (
          <h4 key={idx} className="text-[11px] font-bold uppercase tracking-wider text-amber-500 mt-4 mb-2 border-b border-white/5 pb-1">
            {trimmed.replace("###", "").trim()}
          </h4>
        );
      }
      if (trimmed.startsWith("##")) {
        return (
          <h3 key={idx} className="text-xs font-black uppercase tracking-[0.15em] text-gold mt-6 mb-3">
            {trimmed.replace("##", "").trim()}
          </h3>
        );
      }
      if (trimmed.startsWith("#")) {
        return (
          <h2 key={idx} className="text-sm font-serif font-black underline decoration-gold/60 underline-offset-4 text-white mt-8 mb-4">
            {trimmed.replace("#", "").trim()}
          </h2>
        );
      }

      // Handle bold blocks via regex inside lines
      const parts = line.split(/(\*\*.*?\*\*)/g);
      const parsedElements = parts.map((part, pIdx) => {
        if (part.startsWith("**") && part.endsWith("**")) {
          return <span key={pIdx} className="font-extrabold text-amber-300">{part.slice(2, -2)}</span>;
        }
        return part;
      });

      // Render standard list item if it starts with dash or asterisk
      if (trimmed.startsWith("-") || trimmed.startsWith("*")) {
        return (
          <div key={idx} className="flex gap-2 text-[10.5px] leading-relaxed text-slate-300 my-1 ml-3 pl-1 border-l border-amber-500/10">
            <span className="text-gold select-none">•</span>
            <div>{parsedElements.slice(1)}</div>
          </div>
        );
      }

      return (
        <p key={idx} className="text-[10.5px] leading-relaxed text-slate-300 my-1.5">
          {parsedElements}
        </p>
      );
    });
  };

  if (!isOpen) return null;

  return (
    <div id="ai-planman-modal" className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-6 transition-all">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="bg-stone-950 border border-amber-500/25 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.8)] w-full max-w-5xl rounded-2xl flex flex-col md:flex-row overflow-hidden h-[90vh] md:h-[80vh]"
      >
        {/* Left Side: Controls & Branding */}
        <div className="w-full md:w-2/5 border-b md:border-b-0 md:border-r border-white/10 p-5 sm:p-6 flex flex-col bg-stone-900/40 relative">
          
          {/* Logo Heading */}
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-amber-500/20 text-gold p-2.5 rounded-xl border border-gold/35 shadow-inner">
              <Brain size={20} className="animate-pulse text-amber-400" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-black tracking-[0.3em] uppercase bg-amber-500/15 text-gold px-1.5 py-0.5 rounded border border-amber-500/30">
                  Google AI
                </span>
              </div>
              <h1 className="text-lg font-serif italic text-white mt-1">Plan Man Portal</h1>
            </div>
          </div>

          {/* Navigation tabs inside Plan Man */}
          <div className="flex gap-1.5 bg-black/40 border border-white/5 p-1 rounded-lg mb-6 text-[10px] font-bold">
            <button 
              onClick={() => { setActiveTab("builder"); setSelectedHistoryPlan(null); }}
              className={`flex-1 py-1.5 rounded-md transition-all flex items-center justify-center gap-1.5 ${
                activeTab === "builder" && !selectedHistoryPlan 
                  ? "bg-amber-600 text-white shadow-sm" 
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Wand2 size={11} />
              <span>Strategy Builder</span>
            </button>
            <button 
              onClick={() => setActiveTab("history")}
              className={`flex-1 py-1.5 rounded-md transition-all flex items-center justify-center gap-1.5 ${
                activeTab === "history" || selectedHistoryPlan
                  ? "bg-amber-600 text-white shadow-sm" 
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <History size={11} />
              <span>History ({savedPlans.length})</span>
            </button>
          </div>

          {activeTab === "builder" && !selectedHistoryPlan ? (
            <div className="space-y-4 flex-1 flex flex-col overflow-y-auto pr-1">
              <div>
                <label className="text-[9px] uppercase font-bold tracking-widest text-[#C5A02D] block mb-1.5">
                  1. Choice of Strategic Focus
                </label>
                <div className="grid grid-cols-2 gap-2 text-[10px]">
                  <button 
                    onClick={() => setStrategyType("complaint-recovery")}
                    className={`p-2.5 border rounded-lg text-left transition ${
                      strategyType === "complaint-recovery" 
                        ? "border-amber-500/50 bg-amber-500/10 text-white font-bold" 
                        : "border-white/5 bg-white/5 text-slate-300 hover:bg-white/10"
                    }`}
                  >
                    Guest Recovery
                  </button>
                  <button 
                    onClick={() => setStrategyType("revenue-yield")}
                    className={`p-2.5 border rounded-lg text-left transition ${
                      strategyType === "revenue-yield" 
                        ? "border-amber-500/50 bg-amber-500/10 text-white font-bold" 
                        : "border-white/5 bg-white/5 text-slate-300 hover:bg-white/10"
                    }`}
                  >
                    Yield Pricing
                  </button>
                  <button 
                    onClick={() => setStrategyType("sop-standards")}
                    className={`p-2.5 border rounded-lg text-left transition ${
                      strategyType === "sop-standards" 
                        ? "border-amber-500/50 bg-amber-500/10 text-white font-bold" 
                        : "border-white/5 bg-white/5 text-slate-300 hover:bg-white/10"
                    }`}
                  >
                    SOP Standards
                  </button>
                  <button 
                    onClick={() => setStrategyType("maintenance-audit")}
                    className={`p-2.5 border rounded-lg text-left transition ${
                      strategyType === "maintenance-audit" 
                        ? "border-amber-500/50 bg-amber-500/10 text-white font-bold" 
                        : "border-white/5 bg-white/5 text-slate-300 hover:bg-white/10"
                    }`}
                  >
                    Asset Operations
                  </button>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-[9px] uppercase font-bold tracking-widest text-[#C5A02D]">
                    2. Dynamic Data Feed Ingestion
                  </label>
                  <span className="text-[8px] bg-sky-500/10 text-sky-400 font-mono px-1 border border-sky-500/20 rounded">
                    Real Sync
                  </span>
                </div>
                <div className="flex gap-1.5 flex-wrap">
                  <button 
                    type="button"
                    onClick={() => handleInjectData("complaints")}
                    className="px-2.5 py-1 text-[8.5px] bg-slate-800 hover:bg-slate-700 text-slate-200 rounded border border-white/5 font-mono flex items-center gap-1 transition"
                  >
                    <Database size={10} />
                    <span>Complaints</span>
                  </button>
                  <button 
                    type="button"
                    onClick={() => handleInjectData("standards")}
                    className="px-2.5 py-1 text-[8.5px] bg-slate-800 hover:bg-slate-700 text-slate-200 rounded border border-white/5 font-mono flex items-center gap-1 transition"
                  >
                    <Building size={10} />
                    <span>SOP Specs</span>
                  </button>
                  <button 
                    type="button"
                    onClick={() => handleInjectData("revenue")}
                    className="px-2.5 py-1 text-[8.5px] bg-slate-800 hover:bg-slate-700 text-slate-200 rounded border border-white/5 font-mono flex items-center gap-1 transition"
                  >
                    <Wand2 size={10} />
                    <span>Revenue Metrics</span>
                  </button>
                </div>
              </div>

              <div className="flex-1 flex flex-col min-h-[140px]">
                <label className="text-[9px] uppercase font-bold tracking-widest text-[#C5A02D] block mb-1.5">
                  3. Prompt Engineering Guidance
                </label>
                <textarea
                  id="planman-prompt-textarea"
                  value={customContext}
                  onChange={(e) => setCustomContext(e.target.value)}
                  placeholder="Ask Gemini anything or modify the data values loaded above..."
                  className="w-full flex-1 p-3 bg-black/60 border border-white/10 rounded-xl text-[10.5px] text-white placeholder-slate-500 focus:outline-none focus:border-gold/50 font-sans resize-none leading-relaxed"
                />
              </div>

              {/* Strict manual authorization switch requested to safeguard tokens */}
              <div className="flex items-center gap-2.5 p-3 bg-amber-500/5 rounded-xl border border-amber-500/20 my-1 animate-pulse-subtle">
                <input
                  id="ai-token-safety-lock"
                  type="checkbox"
                  checked={isSafetyUnlocked}
                  onChange={(e) => setIsSafetyUnlocked(e.target.checked)}
                  className="w-4 h-4 rounded border-amber-500 text-amber-500 bg-stone-900 focus:ring-amber-500/50 cursor-pointer accent-amber-500 shrink-0"
                />
                <label 
                  htmlFor="ai-token-safety-lock" 
                  className="text-[10px] text-stone-300 font-mono select-none cursor-pointer leading-tight flex-1"
                >
                  Confirm and Authorize **Manual AI Strategy Synthesis** (Requests @google/genai Token Usage)
                </label>
              </div>

              <button 
                onClick={generatePlanAction}
                disabled={isGenerating || !isSafetyUnlocked}
                className="w-full h-11 bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-500 hover:to-yellow-500 text-white rounded-xl text-[10px] uppercase font-extrabold tracking-[0.2em] transition disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-2 border border-amber-400/20 shadow-md shadow-amber-950/20 mt-1"
              >
                {isGenerating ? (
                  <>
                    <svg className="animate-spin h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span>Synthesizing Strategy...</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={12} />
                    <span>Ask Plan Man (Gemini)</span>
                  </>
                )}
              </button>
            </div>
          ) : (
            <div className="flex-1 flex flex-col overflow-y-auto pr-1">
              <label className="text-[9px] uppercase font-bold tracking-widest text-[#C5A02D] block mb-2">
                Saved Operational Strategy Archive
              </label>
              {savedPlans.length === 0 ? (
                <div className="text-center py-10 border border-dashed border-white/5 rounded-xl bg-black/20">
                  <History size={20} className="mx-auto text-stone-600 mb-2" />
                  <p className="text-[10px] text-stone-500 font-serif italic">No saved plans recorded yet.</p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {savedPlans.map((p) => (
                    <div 
                      key={p.id}
                      onClick={() => {
                        setSelectedHistoryPlan(p);
                        setActiveTab("history"); // focus tabs
                      }}
                      className={`p-3 border rounded-xl cursor-pointer text-left transition flex items-center justify-between gap-3 ${
                        selectedHistoryPlan?.id === p.id 
                          ? "border-amber-500/50 bg-amber-500/5" 
                          : "border-white/5 bg-white/5 hover:bg-white/10"
                      }`}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-1">
                          <span className="text-[8px] uppercase tracking-wider bg-amber-600/20 text-gold px-1 rounded font-bold font-mono">
                            {p.property}
                          </span>
                          <span className="text-[8px] text-slate-500 font-mono">
                            {p.createdAt.split(",")[0]}
                          </span>
                        </div>
                        <h4 className="text-[10.5px] font-bold text-slate-100 truncate">{p.title}</h4>
                      </div>
                      <button 
                        onClick={(e) => deleteSavedPlan(p.id, e)}
                        className="text-stone-500 hover:text-red-400 p-1 rounded hover:bg-stone-800 transition"
                      >
                        <Trash size={11} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* User rule alignment footer */}
          <div className="absolute bottom-4 left-6 right-6 hidden md:block">
            <div className="flex items-center gap-2 border-t border-white/10 pt-3 text-[9px] text-[#A6956D] font-mono">
              <Compass size={11} />
              <span>Planner: Plan Man</span>
              <span className="ml-auto opacity-70">User: Charles</span>
            </div>
          </div>
        </div>

        {/* Right Side: Document View / Output */}
        <div className="w-full md:w-3/5 flex flex-col h-full bg-black">
          
          {/* Header Controls */}
          <div className="border-b border-white/10 p-4.5 flex items-center justify-between px-6 bg-stone-950/80">
            <div>
              <p className="text-[8px] font-display uppercase tracking-[0.25em] text-gold">Generated Active Document</p>
              <h2 className="text-[11px] font-bold text-slate-100 mt-0.5 max-w-[280px] sm:max-w-md truncate">
                {selectedHistoryPlan ? selectedHistoryPlan.title : (generatedPlan ? "Ready to Implement Strategy Blueprint" : "Operational Strategy Workspace")}
              </h2>
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={onClose}
                className="text-slate-400 hover:text-white p-1.5 bg-white/5 hover:bg-white/10 rounded-lg transition"
                title="Close"
              >
                <X size={14} />
              </button>
            </div>
          </div>

          {/* Main workspace viewport */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            
            {/* If no plan is produced yet */}
            {!generatedPlan && !selectedHistoryPlan ? (
              <div className="h-full flex flex-col items-center justify-center text-center max-w-sm mx-auto my-12 md:my-16">
                <div className="w-16 h-16 rounded-full border border-gold/10 flex items-center justify-center text-gold bg-gold/5 animate-pulse mb-4">
                  <Sparkles size={24} />
                </div>
                <h3 className="text-sm font-serif text-slate-200 italic mb-2">Initialize Plan Man</h3>
                <p className="text-[10.5px] text-slate-500 leading-relaxed">
                  Inject active complaints, audit brand target specs, or construct a custom hospitality optimization request on the left.
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                
                {/* Export / Copy Panel bar */}
                <div className="flex items-center gap-1.5 bg-stone-900 px-4 py-2.5 rounded-xl border border-white/5">
                  <span className="text-[10px] text-amber-500 font-mono font-extrabold flex items-center gap-1 mr-auto">
                    <FileCheck size={11} className="text-amber-400" />
                    <span>Real-Time Plan Generated</span>
                  </span>
                  
                  <button 
                    onClick={copyToClipboard}
                    className="p-1 px-2 text-[9px] font-bold uppercase tracking-wider text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-white/10 rounded flex items-center gap-1 transition"
                  >
                    {copied ? <Check size={10} className="text-emerald-500" /> : <Copy size={10} />}
                    <span>{copied ? "Copied" : "Copy Document"}</span>
                  </button>

                  <button 
                    onClick={downloadPlan}
                    className="p-1 px-2 text-[9px] font-bold uppercase tracking-wider text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-white/10 rounded flex items-center gap-1 transition"
                  >
                    <Download size={10} />
                    <span>Export Plan</span>
                  </button>

                  {!selectedHistoryPlan && (
                    <button 
                      onClick={saveCurrentPlanToHistory}
                      className="p-1 px-2.5 text-[9px] font-black uppercase tracking-wider text-stone-950 bg-gold hover:bg-yellow-500 rounded flex items-center gap-1 transition border border-yellow-400/40"
                    >
                      <Plus size={10} />
                      <span>Save to Archives</span>
                    </button>
                  )}
                </div>

                {/* Micro Action Checklist extracted directly by LLM */}
                {((selectedHistoryPlan && selectedHistoryPlan.tasks?.length > 0) || checklist.length > 0) && (
                  <div className="bg-gradient-to-br from-amber-950/20 to-transparent p-4.5 rounded-xl border border-amber-500/20">
                    <p className="text-[9px] font-display uppercase tracking-widest text-[#C5A02D] mb-3 flex items-center gap-1.5 font-black">
                      <ListTodo size={11} />
                      <span>Workspace Checklist (Track Progression)</span>
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {(selectedHistoryPlan ? selectedHistoryPlan.tasks : checklist).map((task, idx) => (
                        <div 
                          key={idx} 
                          onClick={() => toggleTask(idx)}
                          className="flex items-center gap-2.5 p-2 bg-stone-900/60 rounded-lg hover:bg-stone-900/90 border border-white/5 transition cursor-pointer select-none text-left"
                        >
                          <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center transition-all ${
                            task.done 
                              ? "bg-amber-500 border-amber-400 text-stone-950" 
                              : "border-white/20 bg-stone-950"
                          }`}>
                            {task.done && <Check size={10} strokeWidth={4} />}
                          </div>
                          <span className={`text-[9.5px] leading-tight truncate ${task.done ? "text-stone-500 line-through" : "text-slate-200"}`}>
                            {task.text}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Styled output viewport */}
                <div id="ai-plan-rich-content" className="bg-stone-900/35 border border-white/5 rounded-2xl p-6 font-sans text-slate-100 max-w-none shadow-inner select-text">
                  <div className="prose prose-invert max-w-none">
                    {renderFormattedResult(selectedHistoryPlan ? selectedHistoryPlan.result : generatedPlan)}
                  </div>
                </div>

              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
};
