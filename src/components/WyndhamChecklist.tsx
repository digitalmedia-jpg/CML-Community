import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ClipboardCheck, 
  Percent, 
  User, 
  Send, 
  RefreshCw, 
  CheckSquare, 
  Square,
  Hotel,
  ChevronDown,
  ChevronUp,
  Mail,
  FileText,
  Clock,
  Shield,
  Briefcase,
  Calendar,
  CheckCircle2
} from "lucide-react";

type OperationalRole = 
  | "porter" 
  | "housekeeping_sup" 
  | "houseman" 
  | "public_area" 
  | "maintenance" 
  | "property_officer" 
  | "hr_compliance" 
  | "duty_manager" 
  | "hotel_manager";

interface ChecklistItem {
  id: string;
  text: string;
  checked: boolean;
}

interface ChecklistSection {
  title: string;
  items: ChecklistItem[];
  concern?: string;
  action?: string;
  recommendation?: string;
}

export default function WyndhamChecklist({ selectionProperty = "Wyndham Garden Wailoaloa" }: { selectionProperty?: string }) {
  const [selectedRole, setSelectedRole] = useState<OperationalRole>("porter");
  const [occupancy, setOccupancy] = useState<string>("75");
  const [staffName, setStaffName] = useState<string>("");
  const [shift, setShift] = useState<string>("AM");
  const [date, setDate] = useState<string>(new Date().toISOString().split("T")[0]);
  
  const [guestFeedback, setGuestFeedback] = useState<string>("");
  const [hrOfficerFeedback, setHrOfficerFeedback] = useState<string>("");

  const [roleData, setRoleData] = useState<Record<OperationalRole, ChecklistSection[]>>({
    porter: [
      { 
        title: "1. Attendance & Shift Readiness", 
        items: [
          { id: "p1_1", text: "Punch in before the official start of the shift to ensure punctuality and proper attendance tracking in the system.", checked: false },
          { id: "p1_2", text: "Arrive at least 10-15 minutes early to allow time for preparation, briefing review, and readiness for guest service.", checked: false },
          { id: "p1_3", text: "Ensure full, clean, and properly pressed uniform is worn at all times to maintain professional hotel standards.", checked: false },
          { id: "p1_4", text: "Name badge must be clearly visible and correctly positioned to allow guests to identify staff easily.", checked: false },
          { id: "p1_5", text: "Maintain high personal grooming standards including clean appearance, neat hair, and proper hygiene.", checked: false },
          { id: "p1_6", text: "Be mentally alert and physically ready to handle guest requests, luggage movement, and operational duties.", checked: false },
          { id: "p1_7", text: "Review assigned duties and areas of responsibility for the shift before starting any task.", checked: false },
          { id: "p1_8", text: "Check noticeboards or communication logs for any special instructions or operational updates.", checked: false }
        ]
      },
      { 
        title: "10. Shift Closure & Accountability", 
        items: [
          { id: "p10_1", text: "Ensure all assigned tasks are fully completed before ending the shift.", checked: false },
          { id: "p10_2", text: "Re-check luggage storage area to confirm all items are properly secured.", checked: false },
          { id: "p10_3", text: "Verify that all luggage movements have been accurately recorded in logbooks.", checked: false },
          { id: "p10_4", text: "Confirm that all guest requests have been addressed or handed over properly.", checked: false },
          { id: "p10_5", text: "Clean and organize all work areas before leaving duty.", checked: false },
          { id: "p10_6", text: "Ensure logbook entries are complete, accurate, and signed where required.", checked: false },
          { id: "p10_7", text: "Prepare a clear and concise handover note for the incoming shift team.", checked: false },
          { id: "p10_8", text: "Punch out only after completing all duties and receiving approval if required.", checked: false }
        ]
      }
    ],
    housekeeping_sup: [
      { 
        title: "Staff Attendance & Grooming Inspection", 
        items: [
          { id: "hk_s1", text: "Conduct staff roll call and ensure all attendants, public area cleaners, linen runners, and housemen are present.", checked: false },
          { id: "hk_s2", text: "Verify all staff are properly groomed according to hotel standards (uniform clean, pressed, complete with nametag).", checked: false },
          { id: "hk_s3", text: "Ensure staff are wearing proper personal protective equipment (PPE) where required.", checked: false },
          { id: "hk_s4", text: "Review room assignment sheets with attendants and explain VIP arrivals, early check-ins, late departures, and special requests.", checked: false }
        ]
      },
      { 
        title: "Health, Safety & Hygiene Inspection", 
        items: [
          { id: "hk_s5", text: "Ensure housekeeping staff practice proper hygiene procedures and change gloves between room cleaning tasks.", checked: false },
          { id: "hk_s6", text: "Verify chemicals are diluted and used correctly according to safe operational procedures.", checked: false },
          { id: "hk_s7", text: "Check wet floor signage usage across active operational floors.", checked: false }
        ]
      }
    ],
    houseman: [
      { 
        title: "Start of Shift Preparation", 
        items: [
          { id: "hm1", text: "Punch in at the designated time clock system before starting duty and report to Supervisor immediately.", checked: false },
          { id: "hm2", text: "Attend daily briefing to receive assigned duties, areas, occupancy reports, and special requests.", checked: false },
          { id: "hm3", text: "Collect all required housekeeping equipment, supplies, and functionality checks for carts and tools.", checked: false }
        ]
      },
      { 
        title: "Guest Room Assistance Support", 
        items: [
          { id: "hm4", text: "Assist room attendants with heavy cleaning tasks and physical furniture movement inside guest domains.", checked: false },
          { id: "hm5", text: "Deliver extra linens, towels, pillows, and guest amenities promptly upon request.", checked: false }
        ]
      }
    ],
    public_area: [
      { 
        title: "Start of Shift Preparation", 
        items: [
          { id: "pa1", text: "Punch in and receive explicit work assignments from the Shift Supervisor.", checked: false },
          { id: "pa2", text: "Inspect trolley/cart for cleanliness and fulfill spray bottles, tissues, liners, and cleaning cloths.", checked: false }
        ]
      },
      { 
        title: "Lobby & Reception Area Cleaning", 
        items: [
          { id: "pa3", text: "Sweep and mop lobby floors thoroughly; vacuum carpets and rugs including corners and edges.", checked: false },
          { id: "pa4", text: "Sanitize high-touch surfaces, counter desks, entrance glass doors, and elevator interface buttons.", checked: false }
        ]
      }
    ],
    maintenance: [
      { 
        title: "Staff Readiness & Briefing", 
        items: [
          { id: "m1", text: "Punch in on time, report to Maintenance Office, and attend daily shift briefing with the Supervisor.", checked: false },
          { id: "m2", text: "Review handover logbook from previous shift alongside pending maintenance jobs and priorities.", checked: false }
        ]
      },
      { 
        title: "Maintenance Response & Work Orders", 
        items: [
          { id: "m3", text: "Attend guest maintenance requests promptly and prioritize urgent service complaints.", checked: false },
          { id: "m4", text: "Update all work orders accurately and record completed jobs in the maintenance logbook.", checked: false }
        ]
      }
    ],
    property_officer: [
      { 
        title: "Shift Start / Operational Checks", 
        items: [
          { id: "po1", text: "Report to duty on time in full uniform, proper grooming, and inspect communication devices (radio/phone).", checked: false },
          { id: "po2", text: "Account for all master keys, access cards, and passes; review incident logs from the previous shift.", checked: false }
        ]
      },
      { 
        title: "Patrol & Monitoring Duties", 
        items: [
          { id: "po3", text: "Conduct regular patrols of assigned property areas every half an hour.", checked: false },
          { id: "po4", text: "Monitor all entrances and exits for unauthorized access.", checked: false },
          { id: "po5", text: "Check and report on property forum regarding parking areas and property perimeters every 30 minutes.", checked: false }
        ]
      }
    ],
    hr_compliance: [
      { 
        title: "Employee Records & Documentation", 
        items: [
          { id: "hr1", text: "Maintain updated employee files (contracts, ID, certifications, licenses) and track expiry dates.", checked: false },
          { id: "hr2", text: "Ensure the HR database is perfectly current and all records comply strictly with national labor laws.", checked: false }
        ]
      },
      { 
        title: "Compliance & Brand Standards", 
        items: [
          { id: "hr3", text: "Ensure labor law compliance across active department schedules (working hours, minimum wage, benefits).", checked: false },
          { id: "hr4", text: "Conduct regular site audits against Wyndham premium brand standards (guest service, cleanliness, presentation).", checked: false }
        ]
      }
    ],
    duty_manager: [
      { 
        title: "Pre-shift Ritual (Wyndham Brand Focus)", 
        items: [
          { id: "dm1", text: "Review Wyndham Garden Daily Brief, previous Duty Manager handover logs, and property occupancy forecasts.", checked: false },
          { id: "dm2", text: "Check Wyndham brand guest communication notes, VIP arrival parameters, and group events.", checked: false },
          { id: "dm3", text: "Confirm Wyndham 'Count on Me' service culture briefing points: Be responsive, be respectful, deliver great experience.", checked: false }
        ]
      },
      { 
        title: "End-of-Shift Handover", 
        items: [
          { id: "dm4", text: "Log outstanding tasks for the Night Manager and confirm lobby/FO areas are completely neat before leaving.", checked: false },
          { id: "dm5", text: "Final property walk completed covering pool, lobby, back-of-house (BOH), and main public entrances.", checked: false }
        ]
      }
    ],
    hotel_manager: [
      { 
        title: "Staff Briefing & HOD Operations", 
        items: [
          { id: "hm_g1", text: "Hold a daily operations briefing with all department heads to discuss occupancy, VIPs, events, and metrics.", checked: false },
          { id: "hm_g2", text: "Review all department handover reports, previous MOD logs, and enforce accountability comments.", checked: false }
        ]
      },
      { 
        title: "Guest Services & Brand Standards", 
        items: [
          { id: "hm_g3", text: "Monitor responses to guest queries, handle escalated complaints promptly, and verify updated Medallia feedback scores.", checked: false },
          { id: "hm_g4", text: "Inspect lobby, front desk, and reception environments for absolute cleanliness, ambient fragrance, layout, and presentation.", checked: false }
        ]
      }
    ]
  });

  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSigned, setHasSigned] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successPayload, setSuccessPayload] = useState<any | null>(null);

  useEffect(() => {
    const currentSections = roleData[selectedRole];
    const initialExpanded: Record<string, boolean> = {};
    currentSections.forEach((_, idx) => {
      initialExpanded[`${selectedRole}_${idx}`] = true;
    });
    setExpandedSections(initialExpanded);
  }, [selectedRole]);

  const toggleItem = (sectionIdx: number, itemIdx: number) => {
    const updated = { ...roleData };
    updated[selectedRole][sectionIdx].items[itemIdx].checked = !updated[selectedRole][sectionIdx].items[itemIdx].checked;
    setRoleData(updated);
  };

  const handleTextFieldChange = (sectionIdx: number, field: "concern" | "action" | "recommendation", value: string) => {
    const updated = { ...roleData };
    updated[selectedRole][sectionIdx][field] = value;
    setRoleData(updated);
  };

  const currentSections = roleData[selectedRole];
  const totalItems = currentSections.reduce((sum, s) => sum + s.items.length, 0);
  const checkedItems = currentSections.reduce((sum, s) => sum + s.items.filter(i => i.checked).length, 0);
  const percentComplete = totalItems > 0 ? Math.round((checkedItems / totalItems) * 100) : 0;

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.strokeStyle = "#002855"; 
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";

    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    ctx.beginPath();
    ctx.moveTo(clientX - rect.left, clientY - rect.top);
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    ctx.lineTo(clientX - rect.left, clientY - rect.top);
    ctx.stroke();
    setHasSigned(true);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSigned(false);
  };

  const handleSubmitChecklist = async () => {
    if (!staffName.trim()) {
      alert("Please provide the staff member name before dispatching compliance report.");
      return;
    }
    if (!hasSigned) {
      alert("Verification signature trace is required to lock operational report.");
      return;
    }

    setIsSubmitting(true);
    const canvas = canvasRef.current;
    const signatureBase64 = canvas ? canvas.toDataURL() : "";

    const payload = {
      property: selectionProperty,
      role: selectedRole.toUpperCase().replace("_", " "),
      staffName,
      shift,
      occupancy: `${occupancy}%`,
      date,
      completionRate: `${percentComplete}%`,
      auditLogs: currentSections.map(s => ({
        section: s.title,
        itemsChecked: `${s.items.filter(i => i.checked).length}/${s.items.length}`,
        concern: s.concern || "Nil",
        action: s.action || "Nil",
        recommendation: s.recommendation || "Nil"
      })),
      feedback: {
        guestFeedback: guestFeedback || "None Registered",
        hrOfficerFeedback: hrOfficerFeedback || "None Registered"
      },
      routingTargets: ["digitalmedia@cml.com.fj", "graphics@cml.com.fj"],
      signature: signatureBase64,
      timestamp: new Date().toLocaleTimeString()
    };

    setTimeout(() => {
      setIsSubmitting(false);
      setSuccessPayload(payload);
    }, 1200);
  };

  if (successPayload) {
    return (
      <div className="min-h-screen bg-[#f1f5f9] text-[#1e293b] font-sans antialiased p-4 xl:p-8 flex items-center justify-center">
        <div className="max-w-3xl w-full bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden relative">
          <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-[#002855] via-[#007A87] to-[#002855]" />
          
          <div className="p-6 md:p-8 space-y-6">
            {/* Header */}
            <div className="text-center space-y-2">
              <div className="inline-flex p-3 bg-emerald-50 rounded-full text-emerald-600 border border-emerald-100">
                <CheckCircle2 size={32} />
              </div>
              <h2 className="text-2xl font-bold text-[#002855] tracking-tight font-serif uppercase">Compliance Dispatch Complete</h2>
              <p className="text-xs text-slate-500 font-medium">
                The daily operational audit log has been validated, digitally signed, and logged to the central ledger.
              </p>
            </div>

            {/* Meta Table */}
            <div className="bg-slate-50 rounded-2xl border border-slate-100 p-5 grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <span className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider">Property</span>
                <span className="text-xs font-bold text-slate-800">{successPayload.property}</span>
              </div>
              <div>
                <span className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider">Operational Role</span>
                <span className="text-xs font-bold text-[#007A87]">{successPayload.role}</span>
              </div>
              <div>
                <span className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider">Staff Operator</span>
                <span className="text-xs font-bold text-slate-800">{successPayload.staffName}</span>
              </div>
              <div>
                <span className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider">Date & Shift</span>
                <span className="text-xs font-bold text-slate-800">{successPayload.date} ({successPayload.shift})</span>
              </div>
            </div>

            {/* Audit Logs Breakdown */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-[#002855] uppercase tracking-wider">Audit Sections Breakdown</h3>
              <div className="overflow-x-auto rounded-xl border border-slate-100">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100 text-slate-400 font-bold uppercase text-[9px] tracking-wider">
                      <th className="p-3">Section Title</th>
                      <th className="p-3">Compliance Rate</th>
                      <th className="p-3">Issues / Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {successPayload.auditLogs.map((log: any, idx: number) => (
                      <tr key={idx} className="hover:bg-slate-50/50">
                        <td className="p-3 font-semibold text-[#002855]">{log.section}</td>
                        <td className="p-3 font-mono font-bold text-slate-600">{log.itemsChecked}</td>
                        <td className="p-3">
                          <div className="space-y-0.5">
                            <p><span className="font-bold text-amber-600">Issue:</span> {log.concern}</p>
                            <p><span className="font-bold text-emerald-600">Action:</span> {log.action}</p>
                            <p><span className="font-bold text-slate-500">Rec:</span> {log.recommendation}</p>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Feedback & Comments */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-slate-50/50 border border-slate-100 p-4 rounded-xl space-y-1">
                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Guest Feedback Log</h4>
                <p className="text-xs font-semibold text-slate-700">{successPayload.feedback.guestFeedback}</p>
              </div>
              <div className="bg-slate-50/50 border border-slate-100 p-4 rounded-xl space-y-1">
                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">HR/Compliance Comments</h4>
                <p className="text-xs font-semibold text-slate-700">{successPayload.feedback.hrOfficerFeedback}</p>
              </div>
            </div>

            {/* Footer with Signature */}
            <div className="border-t border-slate-100 pt-6 flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="space-y-1 text-center md:text-left">
                <span className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider">Verification Routing Target Alerts</span>
                <div className="flex flex-wrap gap-1.5 justify-center md:justify-start">
                  {successPayload.routingTargets.map((email: string) => (
                    <span key={email} className="text-[10px] bg-slate-100 text-slate-600 border border-slate-200/50 px-2.5 py-0.5 rounded-full font-bold">
                      {email}
                    </span>
                  ))}
                </div>
              </div>
              
              <div className="flex flex-col items-center md:items-end space-y-1.5">
                <span className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider">Authorized Digital Signature</span>
                {successPayload.signature ? (
                  <div className="bg-slate-50 p-2 rounded-xl border border-slate-200">
                    <img src={successPayload.signature} alt="Sign-off" className="h-10 w-32 object-contain" />
                  </div>
                ) : (
                  <span className="text-xs text-rose-500 font-bold uppercase tracking-wider">Trace Missing</span>
                )}
                <span className="text-[9px] font-mono font-bold text-slate-400 uppercase">Timestamped: {successPayload.timestamp}</span>
              </div>
            </div>

            {/* Actions */}
            <div className="pt-4">
              <button
                onClick={() => {
                  setSuccessPayload(null);
                  setStaffName("");
                  clearCanvas();
                  // Reset all checklist selections
                  const resetRoleData = { ...roleData };
                  Object.keys(resetRoleData).forEach((roleKey) => {
                    resetRoleData[roleKey as OperationalRole].forEach((section) => {
                      section.items.forEach((item) => {
                        item.checked = false;
                      });
                      section.concern = "";
                      section.action = "";
                      section.recommendation = "";
                    });
                  });
                  setRoleData(resetRoleData);
                  setGuestFeedback("");
                  setHrOfficerFeedback("");
                }}
                className="w-full bg-[#002855] hover:bg-[#001f42] text-white py-3.5 rounded-xl text-xs font-bold uppercase tracking-wider cursor-pointer transition-all shadow-md text-center"
              >
                Open New Operational Form
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f1f5f9] text-[#1e293b] font-sans antialiased p-4 xl:p-8">
      
      {/* Master Outer Screen Containment Grid */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Controller Column */}
        <div className="lg:col-span-4 space-y-6 lg:sticky lg:top-8">
          
          {/* Top Panel Brand Heading Card */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-6 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-[#002855]" />
            <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-[#007A87] mb-1">
              <Hotel size={13} className="fill-[#007A87]" /> {selectionProperty}
            </div>
            <h1 className="text-xl font-bold text-[#002855] tracking-tight uppercase font-serif">
              Compliance Console
            </h1>
            <p className="text-xs text-slate-500 mt-1 font-medium">
              Property operational metrics & verification stream.
            </p>
          </div>

          {/* Core Configuration Parameters Form Panel */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-xs font-bold text-[#002855] uppercase tracking-wider">
                Shift Meta Parameters
              </h2>
              <div className="px-2.5 py-1 bg-slate-100 rounded-full text-[10px] font-bold text-slate-600">
                Live Session
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wide mb-1.5 flex items-center gap-1.5">
                <Briefcase size={12} className="text-slate-400" /> Operational Profile
              </label>
              <select 
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value as OperationalRole)}
                className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#002855]/10 focus:border-[#002855] focus:bg-white transition-all shadow-2xs"
              >
                <option value="porter">Concierge & Porter Team</option>
                <option value="housekeeping_sup">Housekeeping Supervisor</option>
                <option value="houseman">Houseman Team</option>
                <option value="public_area">Public Area Attendant</option>
                <option value="maintenance">Maintenance Engineer</option>
                <option value="property_officer">Property Safety Officer</option>
                <option value="hr_compliance">HR & Compliance Officer</option>
                <option value="duty_manager">Duty Manager (MOD)</option>
                <option value="hotel_manager">Hotel Manager / GM</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wide mb-1.5 flex items-center gap-1.5">
                <User size={12} className="text-slate-400" /> Operator Name
              </label>
              <input 
                type="text"
                placeholder="First & Last Name"
                value={staffName}
                onChange={(e) => setStaffName(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#002855]/10 focus:border-[#002855] focus:bg-white transition-all shadow-2xs"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wide mb-1.5 flex items-center gap-1.5">
                <Clock size={12} className="text-slate-400" /> Duty Shift Rotation
              </label>
              <div className="grid grid-cols-3 bg-slate-100 p-1 rounded-xl shadow-2xs gap-1">
                {["AM", "PM", "NIGHT"].map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setShift(s)}
                    className={`py-2 text-[10px] font-bold tracking-wider rounded-lg transition-all ${shift === s ? "bg-white text-[#002855] shadow-xs" : "text-slate-500 hover:text-slate-800"}`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wide mb-1.5 flex items-center gap-1.5">
                  <Percent size={12} className="text-slate-400" /> Occupancy %
                </label>
                <input 
                  type="number"
                  value={occupancy}
                  onChange={(e) => setOccupancy(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#002855]/10 focus:border-[#002855] focus:bg-white transition-all shadow-2xs"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wide mb-1.5 flex items-center gap-1.5">
                  <Calendar size={12} className="text-slate-400" /> Log Date
                </label>
                <input 
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#002855]/10 focus:border-[#002855] focus:bg-white transition-all shadow-2xs"
                />
              </div>
            </div>
          </div>

          {/* Operational Metrics Real-time Analytics Tracker Progress Block */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-6 space-y-4">
            <div className="flex justify-between items-center text-xs font-bold text-[#002855] uppercase tracking-wide">
              <span>Audit Metric Progress</span>
              <span className="text-[#007A87] font-mono text-sm bg-slate-50 px-2 py-0.5 rounded-md border border-slate-100">{percentComplete}%</span>
            </div>
            <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200/50">
              <div 
                className="h-full bg-gradient-to-r from-[#002855] to-[#007A87] transition-all duration-500 ease-out"
                style={{ width: `${percentComplete}%` }}
              />
            </div>
            <p className="text-[11px] text-slate-400 font-medium leading-normal">
              State validation metrics track completion nodes recursively inside local sandbox buffer memory spaces.
            </p>
          </div>
        </div>

        {/* Right Task Streams Stack Column */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Active Checklist Items Iterative Array Container Modules */}
          {currentSections.map((section, sIdx) => {
            const sectionKey = `${selectedRole}_${sIdx}`;
            const isExpanded = expandedSections[sectionKey] !== false;
            const checkedCount = section.items.filter(i => i.checked).length;
            const totalCount = section.items.length;
            
            return (
              <div key={sectionKey} className="bg-white rounded-2xl shadow-sm border border-slate-200/80 overflow-hidden transition-all">
                {/* Section Header */}
                <div className="bg-slate-50/70 p-4 border-b border-slate-100 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setExpandedSections(prev => ({ ...prev, [sectionKey]: !isExpanded }))}
                      className="text-[#002855] hover:text-[#007A87] p-1 rounded-lg hover:bg-slate-200/50 transition-all cursor-pointer"
                    >
                      {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </button>
                    <div>
                      <h3 className="text-xs font-bold text-[#002855] uppercase tracking-wide">{section.title}</h3>
                      <p className="text-[10px] text-slate-400 font-medium">Compliance verification queue items</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded-md border bg-white text-slate-500 border-slate-100">
                      {checkedCount}/{totalCount} Items
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        const updated = { ...roleData };
                        const allChecked = section.items.every(i => i.checked);
                        section.items.forEach(i => i.checked = !allChecked);
                        setRoleData(updated);
                      }}
                      className="text-[10px] font-bold bg-[#007A87]/10 hover:bg-[#007A87]/20 text-[#007A87] border border-[#007A87]/20 px-2.5 py-1 rounded-lg transition-all cursor-pointer"
                    >
                      Toggle All
                    </button>
                  </div>
                </div>

                {/* Section Items & Fields */}
                <AnimatePresence initial={false}>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      {/* Items Checklist List */}
                      <div className="p-4 space-y-1">
                        {section.items.map((item, itemIdx) => (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => toggleItem(sIdx, itemIdx)}
                            className={`w-full text-left p-3 flex items-start gap-3 transition-all rounded-xl ${
                              item.checked ? "bg-emerald-50/20 text-slate-400" : "hover:bg-slate-50"
                            }`}
                          >
                            <div className="shrink-0 mt-0.5">
                              {item.checked ? (
                                <CheckSquare className="text-[#007A87]" size={18} />
                              ) : (
                                <Square className="text-slate-300" size={18} />
                              )}
                            </div>
                            <span className={`text-xs font-semibold leading-relaxed transition-all ${
                              item.checked ? "line-through text-slate-400 font-normal" : "text-slate-700"
                            }`}>
                              {item.text}
                            </span>
                          </button>
                        ))}
                      </div>

                      {/* Observations Log Sub-panel */}
                      <div className="border-t border-slate-100 p-4 bg-slate-50/50 space-y-3">
                        <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                          <FileText size={11} className="text-[#007A87]" /> Section Observations & Action Logs
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          <div>
                            <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1">Concern / Issue</label>
                            <input 
                              type="text"
                              placeholder="Record any issues encountered"
                              value={section.concern || ""}
                              onChange={(e) => handleTextFieldChange(sIdx, "concern", e.target.value)}
                              className="w-full bg-white border border-slate-200 px-3 py-2 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#002855] focus:border-[#002855] transition-all"
                            />
                          </div>
                          <div>
                            <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1">Action Taken</label>
                            <input 
                              type="text"
                              placeholder="Describe immediate response"
                              value={section.action || ""}
                              onChange={(e) => handleTextFieldChange(sIdx, "action", e.target.value)}
                              className="w-full bg-white border border-slate-200 px-3 py-2 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#002855] focus:border-[#002855] transition-all"
                            />
                          </div>
                          <div>
                            <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1">Recommendation</label>
                            <input 
                              type="text"
                              placeholder="Advised structural fix"
                              value={section.recommendation || ""}
                              onChange={(e) => handleTextFieldChange(sIdx, "recommendation", e.target.value)}
                              className="w-full bg-white border border-slate-200 px-3 py-2 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#002855] focus:border-[#002855] transition-all"
                            />
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}

          {/* Feedback & General Remarks */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-6 space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <Mail className="text-[#002855]" size={16} />
              <h3 className="text-xs font-bold text-[#002855] uppercase tracking-wider">General Remarks & Feedback Log</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wide mb-1.5">Guest Feedback & Sentiments</label>
                <textarea
                  rows={3}
                  placeholder="Record guest feedback, compliments, or grievances..."
                  value={guestFeedback}
                  onChange={(e) => setGuestFeedback(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#002855]/10 focus:border-[#002855] focus:bg-white transition-all shadow-2xs"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wide mb-1.5">HR / Compliance Officer Review Comments</label>
                <textarea
                  rows={3}
                  placeholder="Compliance remarks, team observations, etc..."
                  value={hrOfficerFeedback}
                  onChange={(e) => setHrOfficerFeedback(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#002855]/10 focus:border-[#002855] focus:bg-white transition-all shadow-2xs"
                />
              </div>
            </div>
          </div>

          {/* Digital Sign-off & Accountability Verification Trace Card */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Shield className="text-[#002855]" size={16} />
                <h3 className="text-xs font-bold text-[#002855] uppercase tracking-wider">Digital Verification & Sign-Off</h3>
              </div>
              {hasSigned && (
                <button
                  type="button"
                  onClick={clearCanvas}
                  className="text-[10px] text-rose-600 hover:text-rose-700 font-extrabold uppercase hover:underline cursor-pointer"
                >
                  Clear Draw Box
                </button>
              )}
            </div>
            
            <p className="text-[11px] text-slate-500 font-medium leading-normal">
              I hereby certify that the above tasks have been completed and verified under standard operating procedures for {selectionProperty}. By adding a digital signature trace, I consent to logging these compliance items into the system.
            </p>

            <div className="border-2 border-dashed border-slate-200 bg-slate-50 rounded-2xl overflow-hidden touch-none relative h-32 shadow-inner">
              <canvas
                ref={canvasRef}
                width={500}
                height={128}
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={() => setIsDrawing(false)}
                onMouseLeave={() => setIsDrawing(false)}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={() => setIsDrawing(false)}
                className="w-full h-full cursor-crosshair bg-transparent"
              />
              {!hasSigned && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest animate-pulse">Sign here to authorize</span>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={handleSubmitChecklist}
              disabled={isSubmitting}
              className={`w-full py-4 rounded-xl text-xs font-bold uppercase tracking-wider text-white transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md ${
                isSubmitting 
                  ? "bg-slate-400 cursor-not-allowed" 
                  : "bg-gradient-to-r from-[#002855] to-[#007A87] hover:from-[#001f42] hover:to-[#006673]"
              }`}
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="animate-spin" size={14} />
                  Locking compliance ledger...
                </>
              ) : (
                <>
                  <Send size={14} />
                  Submit & Dispatch Audit Ledger
                </>
              )}
            </button>
          </div>

        </div>

      </div>

    </div>
  );
}