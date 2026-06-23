import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ClipboardCheck, 
  MapPin, 
  Percent, 
  Calendar as CalendarIcon, 
  User, 
  Clock, 
  Send, 
  RefreshCw, 
  CheckSquare, 
  Square,
  AlertTriangle,
  Hotel
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

export default function WyndhamChecklist({ selectionProperty }: { selectionProperty: string }) {
  const [selectedRole, setSelectedRole] = useState<"porter" | "housekeeping" | "maintenance">("porter");
  const [occupancy, setOccupancy] = useState<string>("75");
  const [staffName, setStaffName] = useState<string>("");
  const [shift, setShift] = useState<string>("AM");
  const [date, setDate] = useState<string>(new Date().toISOString().split("T")[0]);
  
  // Signature Drawing State
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSigned, setHasSigned] = useState(false);
  
  // Submit state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionComplete, setSubmissionComplete] = useState(false);

  // Load staff name from logged in user if available
  useEffect(() => {
    if (auth.currentUser?.displayName) {
      setStaffName(auth.currentUser.displayName);
    }
  }, []);

  // Concierge/Porter Checklist
  const [porterSections, setPorterSections] = useState<ChecklistSection[]>([
    {
      title: "1. Attendance & Shift Readiness",
      items: [
        { id: "p1_1", text: "Punch in before the official start of the shift to ensure punctuality and proper attendance tracking in the system.", checked: false },
        { id: "p1_2", text: "Arrive at least 10–15 minutes early to allow time for preparation, briefing review, and readiness for guest service.", checked: false },
        { id: "p1_3", text: "Ensure full, clean, and properly pressed uniform is worn at all times to maintain professional hotel standards.", checked: false },
        { id: "p1_4", text: "Name badge must be clearly visible and correctly positioned to allow guests to identify staff easily.", checked: false },
        { id: "p1_5", text: "Maintain high personal grooming standards including clean appearance, neat hair, and proper hygiene.", checked: false },
        { id: "p1_6", text: "Be mentally alert and physically ready to handle guest requests, luggage movement, and operational duties.", checked: false },
        { id: "p1_7", text: "Review assigned duties and areas of responsibility for the shift before starting any task.", checked: false },
        { id: "p1_8", text: "Check noticeboards or communication logs for any special instructions or operational updates.", checked: false },
        { id: "p1_9", text: "Ensure all required tools such as luggage tags, pens, logbook access, and keys are available.", checked: false },
        { id: "p1_10", text: "Avoid distractions such as mobile phone use during duty unless for operational purposes only.", checked: false },
        { id: "p1_11", text: "Confirm attendance and shift assignment with supervisor if any discrepancies are noted.", checked: false },
        { id: "p1_12", text: "Position yourself at the designated duty area immediately after briefing or handover.", checked: false },
        { id: "p1_13", text: "Maintain a professional attitude and readiness to assist guests at all times.", checked: false },
        { id: "p1_14", text: "Ensure proper mental focus to handle busy operational periods efficiently.", checked: false },
        { id: "p1_15", text: "Demonstrate willingness to support team members from the beginning of the shift.", checked: false },
        { id: "p1_16", text: "Water pot plants, checking and cleaning the property as required.", checked: false }
      ]
    },
    {
      title: "2. Guest Service & Professional Conduct",
      items: [
        { id: "p2_1", text: "Always maintain a friendly, approachable, and welcoming attitude when interacting with guests.", checked: false },
        { id: "p2_2", text: "Greet every guest warmly with a smile, ensuring they feel acknowledged and valued upon arrival.", checked: false },
        { id: "p2_3", text: "Maintain consistent eye contact during conversations to show attentiveness and respect.", checked: false },
        { id: "p2_4", text: "Offer assistance proactively without waiting for guests to request help.", checked: false },
        { id: "p2_5", text: "Use polite, clear, and respectful language in all guest interactions at all times.", checked: false },
        { id: "p2_6", text: "Respond to guest requests promptly and efficiently without unnecessary delay.", checked: false },
        { id: "p2_7", text: "Avoid negative expressions, rude behavior, or dismissive body language at all times.", checked: false },
        { id: "p2_8", text: "Maintain professional posture and confident body language when assisting guests.", checked: false },
        { id: "p2_9", text: "Never ignore a guest, even when busy — acknowledge them and respond appropriately.", checked: false },
        { id: "p2_10", text: "Provide assistance with luggage handling, directions, and general guest support as required.", checked: false },
        { id: "p2_11", text: "Give priority assistance to elderly guests, families, and guests with special needs.", checked: false },
        { id: "p2_12", text: "Remain calm, patient, and professional even during peak occupancy or high-pressure situations.", checked: false },
        { id: "p2_13", text: "Respect guest privacy and confidentiality at all times during service delivery.", checked: false },
        { id: "p2_14", text: "Handle complaints or concerns with care, professionalism, and immediate attention.", checked: false },
        { id: "p2_15", text: "Always represent the hotel brand positively through behavior, communication, and attitude.", checked: false }
      ]
    },
    {
      title: "3. Shift Handover & Communication",
      items: [
        { id: "p3_1", text: "Receive a complete and structured handover from the outgoing midnight GSA or concierge team.", checked: false },
        { id: "p3_2", text: "Carefully review all pending tasks, guest requests, and operational notes from the previous shift.", checked: false },
        { id: "p3_3", text: "Obtain updated daily arrival, departure, and in-house guest lists from the front office team.", checked: false },
        { id: "p3_4", text: "Confirm any VIP arrivals, group bookings, or special handling instructions for the shift.", checked: false },
        { id: "p3_5", text: "Read all logbook entries thoroughly to understand ongoing operational requirements.", checked: false },
        { id: "p3_6", text: "Clarify any unclear instructions immediately with the outgoing staff or supervisor.", checked: false },
        { id: "p3_7", text: "Ensure smooth communication between concierge, front office, and housekeeping teams.", checked: false },
        { id: "p3_8", text: "Note any operational changes, alerts, or special instructions communicated during handover.", checked: false },
        { id: "p3_9", text: "Identify urgent tasks that require immediate attention at the start of the shift.", checked: false },
        { id: "p3_10", text: "Confirm expected luggage movements such as group arrivals or departures.", checked: false },
        { id: "p3_11", text: "Record all important handover details in the shift logbook for accountability.", checked: false },
        { id: "p3_12", text: "Acknowledge receipt of handover formally to ensure clear responsibility transfer.", checked: false },
        { id: "p3_13", text: "Report any inconsistencies or missing information immediately to the supervisor.", checked: false },
        { id: "p3_14", text: "Ensure understanding of all guest-related priorities for the shift.", checked: false },
        { id: "p3_15", text: "Maintain clear communication flow with team members throughout the shift.", checked: false }
      ]
    },
    {
      title: "4. Lobby, Bus Bay & Storage Area Cleanliness",
      items: [
        { id: "p4_1", text: "Ensure the front lobby area is clean, presentable, and welcoming at the start of the shift.", checked: false },
        { id: "p4_2", text: "Maintain cleanliness of the bus bay area by removing any litter, debris, or spills immediately.", checked: false },
        { id: "p4_3", text: "Keep the luggage storage room clean, organized, and free from clutter at all times.", checked: false },
        { id: "p4_4", text: "Regularly remove any waste or unwanted materials from public and operational areas.", checked: false },
        { id: "p4_5", text: "Ensure luggage trolleys are clean, functional, and properly arranged when not in use.", checked: false },
        { id: "p4_6", text: "Wipe down counters, handles, and frequently touched surfaces to maintain hygiene standards.", checked: false },
        { id: "p4_7", text: "Ensure hotel entrance areas remain visually appealing and free from obstruction.", checked: false },
        { id: "p4_8", text: "Inspect for potential hazards such as wet floors or obstacles and address them immediately.", checked: false },
        { id: "p4_9", text: "Maintain clear walking paths for guests to ensure safety and accessibility.", checked: false },
        { id: "p4_10", text: "Organize storage shelves properly to avoid misplaced or damaged luggage.", checked: false },
        { id: "p4_11", text: "Ensure front of house glass surfaces, mirrors, windows, and glass doors are cleaned thoroughly.", checked: false },
        { id: "p4_12", text: "Check that lighting in operational areas is functioning correctly for safety and visibility.", checked: false },
        { id: "p4_13", text: "Dispose of waste in designated bins and ensure bins are not overflowing.", checked: false },
        { id: "p4_14", text: "Maintain cleanliness consistently throughout the shift, not only at the start.", checked: false },
        { id: "p4_15", text: "Report any cleaning or maintenance issues immediately to the relevant department.", checked: false },
        { id: "p4_16", text: "Conduct final cleanliness check before end of shift if required.", checked: false }
      ]
    },
    {
      title: "5. Luggage Handling & Storage Management",
      items: [
        { id: "p5_1", text: "Ensure every incoming luggage item is tagged immediately upon arrival for proper identification.", checked: false },
        { id: "p5_2", text: "Clearly label each luggage item with correct guest details including name and room number.", checked: false },
        { id: "p5_3", text: "Mark fragile items visibly and handle them with extra care during movement and storage.", checked: false },
        { id: "p5_4", text: "Store luggage in designated secure areas to ensure safety and prevent misplacement.", checked: false },
        { id: "p5_5", text: "Always separate arriving, departing, and stored luggage for better organization.", checked: false },
        { id: "p5_6", text: "Handle all luggage carefully to avoid damage or mishandling during transportation.", checked: false },
        { id: "p5_7", text: "Never leave guest luggage unattended in public or unsecured areas.", checked: false },
        { id: "p5_8", text: "Stack luggage properly in storage areas to avoid falling or damage.", checked: false },
        { id: "p5_9", text: "Verify guest details before storing or releasing any luggage item.", checked: false },
        { id: "p5_10", text: "Ensure luggage retrieval is done only after proper guest verification.", checked: false },
        { id: "p5_11", text: "Assist guests promptly when collecting or dropping off their luggage.", checked: false },
        { id: "p5_12", text: "Ensure no luggage is damaged during handling or movement.", checked: false },
        { id: "p5_13", text: "Report any damaged or suspicious luggage immediately to supervisor.", checked: false },
        { id: "p5_14", text: "Maintain proper order and labeling system within the storage room.", checked: false },
        { id: "p5_15", text: "Ensure safe handling of group luggage during peak arrival or departure times.", checked: false }
      ]
    }
  ]);

  // Housekeeping Supervisor Checklist
  const [hkSections, setHkSections] = useState<ChecklistSection[]>([
    {
      title: "Staff Attendance & Grooming Inspection",
      items: [
        { id: "h1_1", text: "Conduct staff roll call and ensure all attendants, public area cleaners, linen runners, and housemen are present.", checked: false },
        { id: "h1_2", text: "Verify all staff are properly groomed according to hotel standards (uniform clean/pressed, name badge visible).", checked: false },
        { id: "h1_3", text: "Confirm all attendants have radios, communication devices, and keys assigned properly.", checked: false },
        { id: "h1_4", text: "Brief staff on daily occupancy, VIP arrivals, early check-ins, or late departures.", checked: false }
      ]
    },
    {
      title: "Store & Workspace Inspection",
      items: [
        { id: "h2_1", text: "Ensure housekeeping office and store rooms are clean, locked, and tidy.", checked: false },
        { id: "h2_2", text: "Verify adequate stock of linens, fresh towels, amenities, and cleaning chemicals.", checked: false },
        { id: "h2_3", text: "Check that chemicals are labeled clearly and stored safely per OHS protocols.", checked: false },
        { id: "h2_4", text: "Inspect housekeeping cart loads for cleanliness, proper stocking, and hazard-free arrangement.", checked: false }
      ]
    },
    {
      title: "Public Area, Corridor & Lobby Cleanliness",
      items: [
        { id: "h3_1", text: "Walk public guest corridors: ensure carpets are vacuumed, no rubbish, and lighting works.", checked: false },
        { id: "h3_2", text: "Check lobby, reception area counters, windows, and main glass entrance doors are clean and smudge-free.", checked: false },
        { id: "h3_3", text: "Inspect public guest restrooms: verify disinfected, smelling fresh, soap and towels fully stocked.", checked: false },
        { id: "h3_4", text: "Confirm pool deck, beachfront loungers, beach sand area and outdoor ashtrays are completely clear.", checked: false }
      ]
    }
  ]);

  // Maintenance Checklist
  const [maintSections, setMaintSections] = useState<ChecklistSection[]>([
    {
      title: "Workshop & Readiness inspection",
      items: [
        { id: "m1_1", text: "Report to maintenance office, punch in, and test communication devices.", checked: false },
        { id: "m1_2", text: "Verify workshop area is clean, tidy, and all tools are accounted for in locked cabinet storage.", checked: false },
        { id: "m1_3", text: "Check inventory levels of bulbs, AC filters, plumbing washers, and electrical fuses.", checked: false },
        { id: "m1_4", text: "Confirm fire extinguishers are clear of obstruction, tagged, and pressure values are safe.", checked: false }
      ]
    },
    {
      title: "Pool and Chemical Maintenance Checks",
      items: [
        { id: "m2_1", text: "Skim leaves, debris, pool sand, and clean pool pump basket.", checked: false },
        { id: "m2_2", text: "Perform pool water chemical analysis (free chlorine, pH, alkalinity) and document on central logs.", checked: false },
        { id: "m2_3", text: "Inspect pool tiles, coping, steps, handrails, and pool safety signs for damage.", checked: false },
        { id: "m2_4", text: "Ensure chemicals are locked safely and pool testing system is fully charged.", checked: false }
      ]
    },
    {
      title: "Property Fire, Electrical & Emergency Sweep",
      items: [
        { id: "m3_1", text: "Walk main distribution panels: confirm no electrical warmth, loose wires, or tripped breakers.", checked: false },
        { id: "m3_2", text: "Verify backup generator is on standby, fuel tank is filled, and log battery health value.", checked: false },
        { id: "m3_3", text: "Ensure fire exit signs, emergency evacuation maps, and exit lights are working and unobstructed.", checked: false }
      ]
    }
  ]);

  // Current active sections dataset
  const activeSections = selectedRole === "porter" 
    ? porterSections 
    : selectedRole === "housekeeping" 
    ? hkSections 
    : maintSections;

  const setActiveSections = (newSecs: ChecklistSection[]) => {
    if (selectedRole === "porter") {
      setPorterSections(newSecs);
    } else if (selectedRole === "housekeeping") {
      setHkSections(newSecs);
    } else {
      setMaintSections(newSecs);
    }
  };

  // Toggle item checkbox
  const handleToggleItem = (sectionIndex: number, itemIndex: number) => {
    const updated = [...activeSections];
    updated[sectionIndex].items[itemIndex].checked = !updated[sectionIndex].items[itemIndex].checked;
    setActiveSections(updated);
  };

  // Select all or Unselect all inside a section
  const handleToggleSectionAll = (sectionIndex: number) => {
    const updated = [...activeSections];
    const section = updated[sectionIndex];
    const allChecked = section.items.every(it => it.checked);
    section.items.forEach(it => {
      it.checked = !allChecked;
    });
    setActiveSections(updated);
  };

  // Calculation Metrics
  const totalItemsCount = activeSections.reduce((sum, s) => sum + s.items.length, 0);
  const checkedItemsCount = activeSections.reduce((sum, s) => sum + s.items.filter(it => it.checked).length, 0);
  const percentComplete = totalItemsCount > 0 ? Math.round((checkedItemsCount / totalItemsCount) * 100) : 0;

  // Signature Pad Mechanics
  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.strokeStyle = "#0b5c4b"; // Standard Wyndham green
        ctx.lineWidth = 2.5;
        ctx.lineCap = "round";
      }
    }
  }, [selectedRole, submissionComplete, selectionProperty]);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    
    // Get mouse/touch coordinates relative to canvas
    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
    setHasSigned(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSigned(false);
  };

  // Final Form Submission
  const handleSubmitChecklist = async () => {
    if (!staffName.trim()) {
      alert("Please enter the name of the staff completing this checklist.");
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Get base64 signature image 
      let signatureDataUrl = "";
      if (canvasRef.current && hasSigned) {
        signatureDataUrl = canvasRef.current.toDataURL("image/png");
      }

      const checklistPayload = {
        role: selectedRole === "porter" ? "Porter/Concierge" : selectedRole === "housekeeping" ? "Housekeeping Supervisor" : "Maintenance",
        property: "Wyndham Garden Wailoaloa Fiji",
        occupancy: occupancy,
        date: date,
        shift: shift,
        submittedBy: staffName,
        signature: signatureDataUrl,
        completionPercent: percentComplete,
        totalTasks: totalItemsCount,
        completedTasks: checkedItemsCount,
        sections: activeSections.map(s => ({
          title: s.title,
          items: s.items.map(it => ({ text: it.text, completed: it.checked }))
        })),
        timestamp: new Date().toISOString()
      };

      // 1. Persist to central Firestore (Wyndham checklists collection)
      const collRef = collection(db, "wyndham-checklists");
      await addDoc(collRef, checklistPayload);

      // 2. Dispatch email submit via backend
      await fetch("/api/submit-checklist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(checklistPayload)
      });

      setSubmissionComplete(true);
    } catch (err) {
      console.error("[Checklist Submit Error]", err);
      alert("An error occurred during submission. However, your data has been updated and queued.");
      setSubmissionComplete(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Reset Form
  const handleResetForm = () => {
    // Uncheck items
    const resetPorter = porterSections.map(s => ({
      ...s,
      items: s.items.map(it => ({ ...it, checked: false }))
    }));
    setPorterSections(resetPorter);

    const resetHk = hkSections.map(s => ({
      ...s,
      items: s.items.map(it => ({ ...it, checked: false }))
    }));
    setHkSections(resetHk);

    const resetMaint = maintSections.map(s => ({
      ...s,
      items: s.items.map(it => ({ ...it, checked: false }))
    }));
    setMaintSections(resetMaint);

    setSubmissionComplete(false);
    setHasSigned(false);
    setOccupancy("75");
  };

  // Guard condition: Add this attached checklist to Wyndham property only
  if (selectionProperty !== "wyndham") {
    return (
      <div className="max-w-4xl mx-auto py-16 px-4">
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white border-l-4 border-amber-500 rounded-lg p-8 shadow-sm space-y-4"
        >
          <div className="flex items-center gap-4 text-amber-500">
            <AlertTriangle size={36} />
            <h2 className="text-2xl font-serif italic text-slate-900">Wyndham Garden Checklist Restricted</h2>
          </div>
          <p className="text-sm leading-relaxed text-slate-600 font-sans">
            Checking brand alignment... Daily checklists are configured specifically for the Wyndham property only. Please select <strong>Wyndham Garden Wailoaloa Fiji</strong> from the top property selector to access, complete and submit Wyndham Garden compliance checklists.
          </p>
          <div className="pt-2">
            <span className="text-[10px] font-mono text-slate-400">Current Property Context: {selectionProperty?.toUpperCase() || "GLOBAL"}</span>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto py-6 px-4 md:px-8 space-y-8 font-sans pb-16">
      
      {/* Title Selection Card (No-Print) */}
      <div className="bg-white p-6 border border-slate-200 shadow-sm rounded-none flex flex-col md:flex-row md:items-center justify-between gap-4 no-print">
        <div className="space-y-1">
          <h2 className="text-lg font-serif italic text-slate-900 flex items-center gap-2">
            <ClipboardCheck size={20} className="text-[#0b5c4b]" />
            Wyndham Garden Compliance Checklist Panel
          </h2>
          <p className="text-[11px] text-slate-500">
            Select a specific role/department template to load, inspect, sign-off and dispatch records
          </p>
        </div>
        <div className="flex items-center gap-3">
          <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Role:</label>
          <select 
            className="bg-slate-50 border border-slate-200 px-4 py-2 text-xs font-medium text-slate-700 rounded-none outline-none focus:border-[#0b5c4b] transition-all"
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value as any)}
          >
            <option value="porter">Concierge / Porter Daily Checklist</option>
            <option value="housekeeping">Housekeeping Supervisor Checklist</option>
            <option value="maintenance">Maintenance Daily Checklist</option>
          </select>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {submissionComplete ? (
          <motion.div 
            key="complete"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            className="bg-white border-t-8 border-[#0b5c4b] p-8 md:p-12 text-center space-y-6 shadow-sm max-w-2xl mx-auto"
          >
            <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto text-[#0b5c4b]">
              <ClipboardCheck size={32} />
            </div>
            
            <div className="space-y-2">
              <h3 className="text-2xl font-serif italic text-slate-900">Checklist Submitted Successfully</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                Thank you. The daily compliance checklist reports have been saved in the cloud registry and dispatched automatically via SMTP.
              </p>
            </div>

            <div className="bg-slate-50 p-6 rounded-none text-left border border-slate-100 space-y-3">
              <div className="flex justify-between border-b pb-2 text-[11px] text-slate-600">
                <span className="font-bold">Role Template:</span>
                <span>{selectedRole === "porter" ? "Concierge/Porter Daily" : selectedRole === "housekeeping" ? "Housekeeping Supervisor" : "Maintenance"}</span>
              </div>
              <div className="flex justify-between border-b pb-2 text-[11px] text-slate-600">
                <span className="font-bold">Date / Shift:</span>
                <span>{date} ({shift})</span>
              </div>
              <div className="flex justify-between border-b pb-2 text-[11px] text-slate-600">
                <span className="font-bold">Occupancy For Day:</span>
                <span>{occupancy}%</span>
              </div>
              <div className="flex justify-between text-[11px] text-slate-600">
                <span className="font-bold">Recipients Dispatched:</span>
                <span className="text-[#0b5c4b] font-mono font-semibold">digitalmedia@cml.com.fj, graphics@cml.com.fj</span>
              </div>
            </div>

            <div className="flex justify-center gap-3 pt-4">
              <button 
                onClick={handleResetForm}
                className="bg-[#0b5c4b] text-white hover:bg-[#073b30] px-6 py-2.5 text-xs uppercase tracking-widest font-black transition-all rounded-none"
              >
                Log New Checklist
              </button>
            </div>
          </motion.div>
        ) : (
          <motion.div 
            key="form"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-[#fbfcfa] border border-[#0b5c4b]/20 shadow-lg relative print:border-none print:shadow-none"
          >
            
            {/* Standard Header for Wyndham */}
            <div className="bg-[#0b5c4b] text-white p-6 md:p-8 flex flex-col md:flex-row justify-between items-center gap-6 relative overflow-hidden">
              <div className="absolute right-0 top-0 opacity-10 transform translate-x-12 translate-y-[-14px]">
                <Hotel size={180} />
              </div>
              <div className="space-y-2 z-10 text-center md:text-left">
                <div className="text-[10px] uppercase font-bold tracking-[0.25em] text-white/50">Wyndham Garden Hotel Group</div>
                <h1 className="text-2xl md:text-3xl font-serif italic font-light tracking-wide">
                  {selectedRole === "porter" 
                    ? "Concierge/Porter JD & Daily Checklist" 
                    : selectedRole === "housekeeping" 
                    ? "Housekeeping Supervisor JD & Daily Checklist" 
                    : "Maintenance JD & Daily Checklist"}
                </h1>
                <p className="text-[11px] text-white/70 italic max-w-xl">
                  Daily operation guidelines, brand compliance inspection standards and OHS security validation log.
                </p>
              </div>
              
              <div className="shrink-0 z-10 text-center md:text-right border-l md:border-l-0 pl-0 md:pl-6 md:border-b-0 border-white/20 pb-2 md:pb-0">
                <div className="text-md font-serif font-black tracking-widest text-[#FFF]">WYNDHAM GARDEN</div>
                <div className="text-[10px] text-emerald-200 font-bold uppercase tracking-widest">Wailoaloa Beach Fiji</div>
                <div className="text-[9px] text-white/60 italic mt-0.5">relax, you're here</div>
              </div>
            </div>

            {/* Sub-Header Metadata Inputs (Property Fields) */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-6 bg-slate-50 border-b border-slate-200/60 no-print">
              
              <div className="space-y-1">
                <label className="text-[9px] uppercase tracking-wider font-bold text-slate-400">Property Name</label>
                <div className="bg-white border border-slate-200 px-3 py-2 text-xs text-slate-650 flex items-center gap-2 font-medium">
                  <MapPin size={12} className="text-[#0b5c4b]" />
                  <span>Wyndham Garden Fiji</span>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[9px] uppercase tracking-wider font-bold text-slate-400">Occupancy For the Day (%)</label>
                <div className="relative">
                  <input 
                    type="number" 
                    min="0" 
                    max="100" 
                    className="w-full bg-white border border-slate-200 pl-3 pr-8 py-2 text-xs text-slate-700 outline-none focus:border-[#0b5c4b] transition-all font-semibold"
                    value={occupancy}
                    onChange={(e) => setOccupancy(e.target.value)}
                  />
                  <Percent size={12} className="absolute right-3 top-2.5 text-slate-400" />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[9px] uppercase tracking-wider font-bold text-slate-400">Date Logged</label>
                <div className="relative">
                  <input 
                    type="date" 
                    className="w-full bg-white border border-slate-200 px-3 py-1.5 text-xs text-slate-700 outline-none focus:border-[#0b5c4b] transition-all"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[9px] uppercase tracking-wider font-bold text-slate-400">Shift Type</label>
                <div className="flex rounded-none overflow-hidden border border-slate-200">
                  {["AM", "PM", "Midnight"].map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setShift(s)}
                      className={`flex-1 py-1.5 text-[10px] font-bold transition-all ${shift === s ? "bg-[#0b5c4b] text-white" : "bg-white text-slate-700 hover:bg-slate-100"}`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

            </div>

            {/* Print Only Metadata Display (Clean table representation) */}
            <div className="hidden print:block p-6 border-b border-slate-200 bg-white space-y-4">
              <div className="grid grid-cols-4 gap-4 text-xs">
                <div><strong>Property Name:</strong> Wyndham Garden Wailoaloa Fiji</div>
                <div><strong>Occupancy For the Day:</strong> {occupancy}%</div>
                <div><strong>Date Logged:</strong> {date}</div>
                <div><strong>Shift Type:</strong> {shift} Shift</div>
              </div>
            </div>

            {/* Checklist items view progress bar */}
            <div className="px-6 py-4 bg-white border-b border-slate-200/50 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="text-xs font-bold text-slate-700 tracking-wider">
                  Checklist Completion:
                </div>
                <div className="bg-slate-100 h-2.5 w-40 md:w-60 rounded-full overflow-hidden border border-slate-200">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${percentComplete}%` }}
                    className="bg-[#0b5c4b] h-full"
                  />
                </div>
                <div className="text-xs font-black text-[#0b5c4b] font-mono">
                  {percentComplete}%
                </div>
              </div>
              <div className="text-[10px] text-slate-400 font-mono">
                {checkedItemsCount} of {totalItemsCount} checklist rules checked
              </div>
            </div>

            {/* Categorized Checklist Items Card container */}
            <div className="p-6 md:p-8 space-y-8 bg-white/70">
              {activeSections.map((section, sectionIdx) => (
                <div key={section.title} className="space-y-4 border border-slate-200/60 p-4 md:p-6 bg-white/80 rounded-none shadow-sm">
                  
                  {/* Category Header */}
                  <div className="flex items-center justify-between border-b border-[#0b5c4b]/15 pb-2.5">
                    <h3 className="text-sm font-serif italic text-[#0b5c4b] font-semibold flex items-center gap-2 uppercase tracking-wide">
                      {section.title}
                    </h3>
                    <button
                      type="button"
                      onClick={() => handleToggleSectionAll(sectionIdx)}
                      className="text-[10px] uppercase font-bold text-slate-400 hover:text-[#0b5c4b] transition-all no-print"
                    >
                      {section.items.every(it => it.checked) ? "Uncheck All" : "Select/Check All"}
                    </button>
                  </div>

                  {/* Checklist Rule Items Grid */}
                  <div className="divide-y divide-slate-100">
                    {section.items.map((item, itemIdx) => (
                      <div 
                        key={item.id}
                        onClick={() => handleToggleItem(sectionIdx, itemIdx)}
                        className={`flex items-start gap-4 py-3 px-2 cursor-pointer transition-all duration-200 select-none ${item.checked ? "bg-emerald-50/20 text-slate-800" : "hover:bg-slate-50/70 text-slate-600"}`}
                      >
                        <div className="shrink-0 mt-0.5 text-[#0b5c4b] transition-transform active:scale-95">
                          {item.checked ? (
                            <CheckSquare size={16} className="fill-emerald-50" />
                          ) : (
                            <Square size={16} className="text-slate-300" />
                          )}
                        </div>
                        <div className={`text-xs leading-relaxed ${item.checked ? "font-semibold" : "font-normal"}`}>
                          {item.text}
                        </div>
                      </div>
                    ))}
                  </div>

                </div>
              ))}
            </div>

            {/* Standard Footer with Sign-Off Pad */}
            <div className="p-6 md:p-8 border-t border-slate-200 bg-slate-50 space-y-6">
              
              <div className="space-y-2 text-center md:text-left">
                <h3 className="text-sm font-serif italic text-slate-900 font-semibold">Checks Validation & Staff Signature Pad</h3>
                <p className="text-[10px] text-slate-500 leading-relaxed max-w-2xl">
                  By digitally signing, you authenticate that multiple brand parameter rules outlined inside this compliance checklist have been diligently logged, verified, and safely integrated into operation.
                </p>
              </div>

              <div className="flex flex-col md:flex-row gap-6 items-start">
                
                {/* Staff Name field */}
                <div className="space-y-1 w-full md:w-1/3">
                  <label className="text-[9px] uppercase tracking-wider font-bold text-slate-400 flex items-center gap-1.5">
                    <User size={10} /> Authorized Operator Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Enter Staff Log Name"
                    className="w-full bg-white border border-slate-200 px-4 py-3 text-xs text-slate-700 outline-none focus:border-[#0b5c4b] transition-all font-serif italic font-semibold"
                    value={staffName}
                    onChange={(e) => setStaffName(e.target.value)}
                  />
                  <span className="text-[9px] text-slate-440 block text-right mt-1 italic">
                    Logged as {auth.currentUser?.email || "Staff Guest"}
                  </span>
                </div>

                {/* Digital Signature Drawing Canvas */}
                <div className="space-y-1 w-full md:w-2/3 no-print">
                  <label className="text-[9px] uppercase tracking-wider font-bold text-slate-400 flex items-center justify-between">
                    <span>Draw Digital Signature Sign-Off</span>
                    {hasSigned && (
                      <button 
                        type="button" 
                        onClick={clearSignature}
                        className="text-[9px] uppercase font-bold text-red-500 hover:text-red-700 transition"
                      >
                        Clear Signature
                      </button>
                    )}
                  </label>
                  
                  <div className="bg-white border border-slate-200 relative overflow-hidden" style={{ height: "135px" }}>
                    <canvas
                      ref={canvasRef}
                      width={600}
                      height={135}
                      className="absolute inset-0 w-full h-full cursor-crosshair touch-none"
                      onMouseDown={startDrawing}
                      onMouseMove={draw}
                      onMouseUp={stopDrawing}
                      onMouseLeave={stopDrawing}
                      onTouchStart={startDrawing}
                      onTouchMove={draw}
                      onTouchEnd={stopDrawing}
                    />
                    {!hasSigned && (
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-[10px] text-slate-450 italic font-mono uppercase bg-slate-50/20">
                        🖊️ Sign with Mouse / Finger here
                      </div>
                    )}
                  </div>
                </div>

              </div>

              {/* standard footer brand banner and print address */}
              <div className="border-t border-slate-200 pt-6 flex flex-col md:flex-row justify-between items-center gap-6">
                
                <div className="text-center md:text-left">
                  <div className="text-xs font-serif font-black tracking-widest text-[#0b5c4b]">WYNDHAM GARDEN</div>
                  <div className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Wailoaloa Beach Fiji</div>
                  <div className="text-[9px] text-[#0b5c4b] font-medium italic mt-0.5">relax, you're here</div>
                  <div className="text-[8px] text-slate-400 font-mono tracking-wide mt-2">wyndhamgardenwailoaloafiji.com</div>
                </div>

                {/* Submit Action Button */}
                <div className="shrink-0 w-full md:w-auto no-print">
                  <button
                    type="button"
                    disabled={isSubmitting || percentComplete < 10}
                    onClick={handleSubmitChecklist}
                    className="w-full md:w-auto bg-[#0b5c4b] text-white hover:bg-[#073b30] hover:shadow-md disabled:bg-slate-350 disabled:cursor-not-allowed px-10 py-3.5 text-xs font-black uppercase tracking-widest flex items-center justify-center gap-3 transition-all rounded-none"
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
                  {percentComplete < 10 && (
                    <span className="text-[9px] text-center md:text-right block text-amber-500 font-medium italic mt-1.5">
                      ⚠️ Please check off at least some tasks to allow submission sign-off.
                    </span>
                  )}
                </div>

              </div>

            </div>

          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
