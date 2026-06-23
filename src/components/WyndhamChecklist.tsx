import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ClipboardCheck, 
  User, 
  Clock, 
  Send, 
  RefreshCw, 
  CheckSquare, 
  Square,
  Hotel,
  Calendar as CalendarIcon,
  Percent,
  CheckCircle,
  FileText
} from "lucide-react";
import { db, auth } from "../lib/firebase";
import { collection, addDoc } from "firebase/firestore";

interface ChecklistItem {
  id: string;
  text: string;
  checked: boolean;
}

interface ChecklistSection {
  title: string;
  items: ChecklistItem[];
}

type RoleType = "porter" | "housekeeping" | "maintenance" | "houseman" | "public_area" | "property_officer" | "duty_manager" | "hotel_manager" | "hr_compliance";

export default function WyndhamChecklist({ selectionProperty }: { selectionProperty: string }) {
  const [selectedRole, setSelectedRole] = useState<RoleType>("porter");
  const [occupancy, setOccupancy] = useState<string>("85");
  const [staffName, setStaffName] = useState<string>("");
  const [shift, setShift] = useState<string>("AM");
  const [date, setDate] = useState<string>(new Date().toISOString().split("T")[0]);
  const [concernsNotes, setConcernsNotes] = useState<string>("");
  
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSigned, setHasSigned] = useState(false);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionComplete, setSubmissionComplete] = useState(false);

  useEffect(() => {
    if (auth.currentUser?.displayName) {
      setStaffName(auth.currentUser.displayName);
    }
  }, []);

  const [porterSections, setPorterSections] = useState<ChecklistSection[]>([
    {
      title: "1. Attendance & Shift Readiness",
      items: [
        { id: "p1_1", text: "Punch in before the official start of the shift to ensure punctuality and proper attendance tracking.", checked: false },
        { id: "p1_2", text: "Arrive at least 10–15 minutes early to allow time for preparation and operational briefing.", checked: false },
        { id: "p1_3", text: "Ensure full, clean, and properly pressed uniform is worn with name badge clearly visible.", checked: false },
        { id: "p1_4", text: "Review assigned duties and areas of responsibility for the shift before starting.", checked: false }
      ]
    },
    {
      title: "2. Lobby & Storage Area Cleanliness",
      items: [
        { id: "p2_1", text: "Ensure front lobby and guest reception pathways are immaculate, clear, and welcoming.", checked: false },
        { id: "p2_2", text: "Keep luggage storage room highly organized, secure, and clear of accidental blockages.", checked: false },
        { id: "p2_3", text: "Wipe down luggage trolleys, handles, and sanitize multi-touch terminal surfaces.", checked: false }
      ]
    }
  ]);

  const [hkSections, setHkSections] = useState<ChecklistSection[]>([
    {
      title: "1. Staff Attendance & Grooming Inspection",
      items: [
        { id: "h1_1", text: "Conduct staff roll call and confirm attendance schedules of all cleaners, runners, and housemen.", checked: false },
        { id: "h1_2", text: "Verify uniform guidelines, personal presentation, and distribution of communication radios or master keys.", checked: false }
      ]
    },
    {
      title: "2. Public Area, Corridors & Linen Swaps",
      items: [
        { id: "h2_1", text: "Inspect public guest walkways: vacuum carpets, empty outdoor ashtrays, and check lighting modules.", checked: false },
        { id: "h2_2", text: "Verify public restroom sanitization records: confirm soap, luxury towels, and fragrance stock layers.", checked: false }
      ]
    }
  ]);

  const [maintSections, setMaintSections] = useState<ChecklistSection[]>([
    {
      title: "1. Emergency & Distribution Sweeps",
      items: [
        { id: "m1_1", text: "Walk main distribution rooms: confirm electrical thermal values and clear out structural obstructions.", checked: false },
        { id: "m1_2", text: "Verify backup emergency power generator is set on standby and fuel thresholds sit above safe levels.", checked: false }
      ]
    }
  ]);

  const [housemanSections, setHousemanSections] = useState<ChecklistSection[]>([
    {
      title: "1. Heavy Operations Support",
      items: [
        { id: "hm1_1", text: "Assist room attendants with structural furniture adjustments and transport bulky soil linen loads.", checked: false },
        { id: "hm1_2", text: "Replenish floor closet allocations with clean linen reserves and heavy chemical units safely.", checked: false }
      ]
    }
  ]);

  const [publicAreaSections, setPublicAreaSections] = useState<ChecklistSection[]>([
    {
      title: "1. External Lobby & High-Traffic Footprints",
      items: [
        { id: "pa1_1", text: "Mop high-traffic floor segments thoroughly and ensure clear 'Wet Floor' visible signs are placed.", checked: false },
        { id: "pa1_2", text: "Clean and buff primary entrance glass partitions and elevator control panel plates.", checked: false }
      ]
    }
  ]);

  const [propertyOfficerSections, setPropertyOfficerSections] = useState<ChecklistSection[]>([
    {
      title: "1. Property Patrols & Alarm Audits",
      items: [
        { id: "po1_1", text: "Conduct full property safety perimeter patrols at designated 30-minute operational intervals.", checked: false },
        { id: "po1_2", text: "Verify all structural emergency exits are entirely unlocked from the inside and exit tags illuminate correctly.", checked: false }
      ]
    }
  ]);

  const [dutyManagerSections, setDutyManagerSections] = useState<ChecklistSection[]>([
    {
      title: "1. Wyndham Brand Cultural Verification",
      items: [
        { id: "dm1_1", text: "Confirm Wyndham 'Count on Me' service benchmarks are reviewed during morning cluster syncs.", checked: false },
        { id: "dm1_2", text: "Audit previous manager handover reports and address unresolved guest service tickets immediately.", checked: false }
      ]
    }
  ]);

  const [hotelManagerSections, setHotelManagerSections] = useState<ChecklistSection[]>([
    {
      title: "1. High-Level Performance Oversight",
      items: [
        { id: "hmg1_1", text: "Review active day Medallia metrics and compile operational feedback loops with core HOD leaders.", checked: false },
        { id: "hmg1_2", text: "Inspect property landscaping zones, beachfront configurations, and engineering progress charts.", checked: false }
      ]
    }
  ]);

  const [hrComplianceSections, setHrComplianceSections] = useState<ChecklistSection[]>([
    {
      title: "1. Employee Documentation & Compliance",
      items: [
        { id: "hr1_1", text: "Audit active personnel archives for mandatory professional certificates, visas, and operational licenses.", checked: false },
        { id: "hr1_2", text: "Monitor labor standard thresholds, employee welfare parameters, and roster break intervals.", checked: false }
      ]
    }
  ]);

  const getActiveDataset = (): ChecklistSection[] => {
    switch(selectedRole) {
      case "housekeeping": return hkSections;
      case "maintenance": return maintSections;
      case "houseman": return housemanSections;
      case "public_area": return publicAreaSections;
      case "property_officer": return propertyOfficerSections;
      case "duty_manager": return dutyManagerSections;
      case "hotel_manager": return hotelManagerSections;
      case "hr_compliance": return hrComplianceSections;
      default: return porterSections;
    }
  };

  const updateActiveDataset = (updated: ChecklistSection[]) => {
    switch(selectedRole) {
      case "housekeeping": setHkSections(updated); break;
      case "maintenance": setMaintSections(updated); break;
      case "houseman": setHousemanSections(updated); break;
      case "public_area": setPublicAreaSections(updated); break;
      case "property_officer": setPropertyOfficerSections(updated); break;
      case "duty_manager": setDutyManagerSections(updated); break;
      case "hotel_manager": setHotelManagerSections(updated); break;
      case "hr_compliance": setHrComplianceSections(updated); break;
      default: setPorterSections(updated); break;
    }
  };

  const activeSections = getActiveDataset();
  const totalItems = activeSections.reduce((acc, sec) => acc + sec.items.length, 0);
  const checkedItems = activeSections.reduce((acc, sec) => acc + sec.items.filter(i => i.checked).length, 0);
  const percentComplete = totalItems > 0 ? Math.round((checkedItems / totalItems) * 100) : 0;

  const handleToggleItem = (sectionIndex: number, itemIndex: number) => {
    const updated = JSON.parse(JSON.stringify(activeSections));
    updated[sectionIndex].items[itemIndex].checked = !updated[sectionIndex].items[itemIndex].checked;
    updateActiveDataset(updated);
  };

  const handleToggleSectionAll = (sectionIndex: number) => {
    const updated = JSON.parse(JSON.stringify(activeSections));
    const sec = updated[sectionIndex];
    const allChecked = sec.items.every((i: any) => i.checked);
    sec.items.forEach((i: any) => i.checked = !allChecked);
    updateActiveDataset(updated);
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    
    setIsDrawing(true);
    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    
    ctx.beginPath();
    ctx.moveTo(clientX - rect.left, clientY - rect.top);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    ctx.lineTo(clientX - rect.left, clientY - rect.top);
    ctx.strokeStyle = "#041e42";
    ctx.lineWidth = 2.5;
    ctx.stroke();
    setHasSigned(true);
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSigned(false);
  };

  const handleSubmitChecklist = async () => {
    setIsSubmitting(true);
    try {
      const signatureDataUrl = canvasRef.current ? canvasRef.current.toDataURL() : "";

      const submissionPayload = {
        property: selectionProperty || "Wyndham Garden Fiji",
        formType: selectedRole,
        date,
        shift,
        occupancy: `${occupancy}%`,
        staffMember: staffName || "Anonymous Staff",
        completedItemsCount: checkedItems,
        totalItemsCount: totalItems,
        completionRate: `${percentComplete}%`,
        notes: concernsNotes,
        signatureBase64: signatureDataUrl,
        submittedAt: new Date().toISOString(),
        dispatchRecipients: ["digitalmedia@cml.com.fj", "graphics@cml.com.fj"],
        meta: {
          userAgent: navigator.userAgent,
          platform: "Mobile-optimized-web-applet"
        }
      };

      await addDoc(collection(db, "compliance_submissions"), submissionPayload);
      setSubmissionComplete(true);
    } catch (err) {
      alert(`Submission failed to sync: ${String(err)}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submissionComplete) {
    return (
      <div className="p-6 max-w-xl mx-auto text-center bg-white border border-slate-200 mt-12 rounded-lg shadow-sm">
        <CheckCircle className="text-[#0b5c4b] mx-auto mb-4" size={56} />
        <h2 className="text-xl font-bold text-slate-800 mb-2">Checklist Dispatched</h2>
        <p className="text-xs text-slate-500 mb-6 px-4">
          The compliance data report has been compiled and submitted. Copies have been queued for secure delivery alerts to <span className="font-semibold text-slate-700">digitalmedia@cml.com.fj</span> and <span className="font-semibold text-slate-700">graphics@cml.com.fj</span>.
        </p>
        <button
          onClick={() => {
            setSubmissionComplete(false);
            clearSignature();
            setConcernsNotes("");
          }}
          className="bg-[#0b5c4b] text-white text-xs font-bold tracking-wider uppercase px-6 py-3 rounded hover:bg-[#073b30] transition-colors w-full"
        >
          Open New Form
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-3 py-4 space-y-4 font-sans text-slate-800 select-none">
      
      {/* STANDARD HEADER */}
      <div className="bg-[#041e42] text-white p-4 text-center relative border-b-4 border-[#0b5c4b] shadow-sm rounded-t-md">
        <div className="flex items-center justify-center gap-2 mb-1">
          <Hotel size={20} className="text-amber-400" />
          <span className="text-[10px] tracking-widest uppercase font-black text-amber-400">Wyndham Garden Hotel Group</span>
        </div>
        <h1 className="text-base font-extrabold tracking-tight">Compliance & Operational Audit Log</h1>
        <p className="text-[9px] text-slate-300 italic mt-0.5">Brand compliance inspection standards & digital validation workflow</p>
      </div>

      {/* Form Selector Carousel */}
      <div className="bg-white p-3 border border-slate-200 space-y-2 rounded-md shadow-sm">
        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block flex items-center gap-1.5">
          <FileText size={12} className="text-[#0b5c4b]" /> Choose Active Target Form Template:
        </label>
        <div className="flex gap-1.5 overflow-x-auto pb-2 scrollbar-none snap-x -mx-1 px-1">
          {[
            { id: "porter", label: "Concierge & Porter" },
            { id: "housekeeping", label: "Housekeeping Supervisor" },
            { id: "maintenance", label: "Maintenance" },
            { id: "houseman", label: "Houseman" },
            { id: "public_area", label: "Public Area Attendant" },
            { id: "property_officer", label: "Property Officer" },
            { id: "duty_manager", label: "Duty Manager" },
            { id: "hotel_manager", label: "Hotel Manager" },
            { id: "hr_compliance", label: "HR & Compliance" }
          ].map((role) => (
            <button
              key={role.id}
              type="button"
              onClick={() => setSelectedRole(role.id as RoleType)}
              className={`px-4 py-2 text-xs font-bold rounded-full border whitespace-nowrap transition-all snap-start ${
                selectedRole === role.id 
                  ? "bg-[#041e42] text-white border-[#041e42] shadow-sm scale-105"
                  : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
              }`}
            >
              {role.label}
            </button>
          ))}
        </div>
      </div>

      {/* Parameters Blocks */}
      <div className="bg-white p-4 border border-slate-200 grid grid-cols-2 md:grid-cols-4 gap-3 rounded-md shadow-sm">
        <div>
          <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Staff Member Name</label>
          <div className="relative">
            <User size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text"
              value={staffName}
              onChange={(e) => setStaffName(e.target.value)}
              placeholder="Enter name"
              className="w-full bg-slate-50 border border-slate-200 rounded pl-7 pr-2 py-2 text-xs font-semibold focus:outline-none focus:border-[#0b5c4b]"
            />
          </div>
        </div>

        <div>
          <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Date Logged</label>
          <div className="relative">
            <CalendarIcon size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded pl-7 pr-2 py-2 text-xs font-semibold focus:outline-none focus:border-[#0b5c4b]"
            />
          </div>
        </div>

        <div>
          <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Occupancy (%)</label>
          <div className="relative">
            <Percent size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="number"
              value={occupancy}
              onChange={(e) => setOccupancy(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded pl-7 pr-2 py-2 text-xs font-semibold focus:outline-none focus:border-[#0b5c4b]"
            />
          </div>
        </div>

        <div>
          <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Shift Type</label>
          <div className="grid grid-cols-2 gap-1 h-[34px]">
            {["AM", "PM"].map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setShift(s)}
                className={`text-xs font-bold rounded transition-all border ${
                  shift === s 
                    ? "bg-[#0b5c4b] text-white border-[#0b5c4b]" 
                    : "bg-slate-50 text-slate-600 border-slate-200"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Sticky Metrics Tracker */}
      <div className="bg-slate-900 text-white p-3 flex items-center justify-between sticky top-2 z-40 rounded-md shadow-md border-l-4 border-amber-400">
        <div className="flex items-center gap-2">
          <ClipboardCheck className="text-amber-400" size={18} />
          <div>
            <div className="text-[10px] font-black tracking-wider uppercase text-slate-400">Completion Bar</div>
            <div className="text-xs font-bold">{checkedItems} of {totalItems} parameters checked</div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <span className="text-lg font-black text-amber-400">{percentComplete}%</span>
          </div>
          <div className="w-16 bg-slate-700 h-2 rounded overflow-hidden">
            <div className="bg-amber-400 h-full transition-all duration-300" style={{ width: `${percentComplete}%` }} />
          </div>
        </div>
      </div>

      {/* Checklist Cards Container */}
      <div className="space-y-4">
        {activeSections.map((section, sectionIdx) => (
          <div key={section.title} className="bg-white border border-slate-200 overflow-hidden rounded-md shadow-sm">
            
            <div className="bg-slate-50 px-3 py-2.5 border-b border-slate-200 flex items-center justify-between gap-2">
              <h3 className="text-xs font-extrabold text-slate-700 uppercase tracking-wide">{section.title}</h3>
              <button
                type="button"
                onClick={() => handleToggleSectionAll(sectionIdx)}
                className="text-[10px] font-bold bg-slate-200 text-slate-600 hover:bg-slate-300 px-2.5 py-1 rounded transition-all"
              >
                Select/Check All
              </button>
            </div>

            <div className="divide-y divide-slate-100">
              {section.items.map((item, itemIdx) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleToggleItem(sectionIdx, itemIdx)}
                  className={`w-full text-left p-3.5 flex items-start gap-3 transition-colors ${
                    item.checked ? "bg-emerald-50/40" : "hover:bg-slate-50/50"
                  }`}
                >
                  <div className="shrink-0 mt-0.5">
                    {item.checked ? (
                      <CheckSquare className="text-[#0b5c4b]" size={20} />
                    ) : (
                      <Square className="text-slate-300" size={20} />
                    )}
                  </div>
                  <span className={`text-xs leading-relaxed font-medium transition-all ${
                    item.checked ? "text-slate-400 line-through font-normal" : "text-slate-700"
                  }`}>
                    {item.text}
                  </span>
                </button>
              ))}
            </div>

          </div>
        ))}
      </div>

      {/* Concerns Log Input */}
      <div className="bg-white p-4 border border-slate-200 space-y-2 rounded-md shadow-sm">
        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
          Operational Concerns, Actions or Recommendations Log
        </label>
        <textarea
          rows={3}
          value={concernsNotes}
          onChange={(e) => setConcernsNotes(e.target.value)}
          placeholder="Type any concerns or notes recorded during the shift..."
          className="w-full bg-slate-50 border border-slate-200 rounded p-2.5 text-xs font-medium focus:outline-none focus:border-[#0b5c4b]"
        />
      </div>

      {/* FOOTER & SIGN-OFF */}
      <div className="bg-white border border-slate-200 p-4 rounded-md shadow-sm space-y-4">
        
        <div className="border-b border-slate-100 pb-2">
          <h4 className="text-xs font-black uppercase text-slate-700 tracking-wider">Shift Closure Accountability Sign-Off</h4>
          <p className="text-[10px] text-slate-400 mt-0.5 leading-normal">
            Ensure all assigned tasks are fully audited before departure. By signing, you verify records comply with Wyndham standards.
          </p>
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Draw Signature (Use Touchscreen/Finger)</span>
            {hasSigned && (
              <button
                type="button"
                onClick={clearSignature}
                className="text-[10px] text-rose-600 font-extrabold uppercase hover:underline"
              >
                Clear Draw Box
              </button>
            )}
          </div>
          
          <div className="border-2 border-dashed border-slate-200 bg-slate-50 rounded overflow-hidden touch-none relative h-28">
            <canvas
              ref={canvasRef}
              width={500}
              height={120}
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={() => setIsDrawing(false)}
              onMouseLeave={() => setIsDrawing(false)}
              onTouchStart={startDrawing}
              onTouchMove={draw}
              onTouchEnd={() => setIsDrawing(false)}
              className="w-full h-full cursor-crosshair"
            />
            {!hasSigned && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <span className="text-[10px] text-slate-400 italic">Sign here inside box</span>
              </div>
            )}
          </div>
        </div>

        <div className="pt-2">
          <button
            type="button"
            disabled={isSubmitting || !hasSigned || percentComplete < 5}
            onClick={handleSubmitChecklist}
            className="w-full bg-[#0b5c4b] text-white hover:bg-[#073b30] hover:shadow-md disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed py-3.5 text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2.5 transition-all rounded"
          >
            {isSubmitting ? (
              <>
                <RefreshCw className="animate-spin" size={14} />
                Syncing Dispatch...
              </>
            ) : (
              <>
                <Send size={14} />
                Submit Compliance Checklist
              </>
            )}
          </button>
          {(!hasSigned || percentComplete < 5) && (
            <span className="text-[9px] text-center block text-amber-600 font-medium italic mt-2">
              ⚠️ Please check parameters and complete signature above to release form submit.
            </span>
          )}
        </div>

        <div className="text-center pt-2 border-t border-slate-100 flex flex-col items-center justify-center gap-0.5">
          <span className="text-[10px] font-bold text-slate-500">wyndhamgardenwailoaloafiji.com</span>
          <span className="text-[8px] tracking-wider text-slate-400 font-medium uppercase">relax, you're here</span>
        </div>

      </div>

    </div>
  );
}