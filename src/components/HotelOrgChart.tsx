import React from "react";
import { Search, X, ChevronRight, MessageSquare } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "../lib/utils";
import { toastService } from "../services/toastService";

interface HotelOrgChartProps {
  selectedCompany: "ramada" | "wyndham";
  initialEmployees: any[];
  orgSearchQuery: string;
  setOrgSearchQuery: (val: string) => void;
  selectedOrgTier: "all" | "board" | "executive" | "operations";
  setSelectedOrgTier: (val: "all" | "board" | "executive" | "operations") => void;
  selectedOrgNode: any;
  setSelectedOrgNode: (val: any) => void;
  orgViewLayout: "visual" | "directory";
  setOrgViewLayout: (val: "visual" | "directory") => void;
  isStaffMatch: (name: string, role: string) => boolean;
}

export function HotelOrgChart({
  selectedCompany,
  initialEmployees,
  orgSearchQuery,
  setOrgSearchQuery,
  selectedOrgTier,
  setSelectedOrgTier,
  selectedOrgNode,
  setSelectedOrgNode,
  orgViewLayout,
  setOrgViewLayout,
  isStaffMatch
}: HotelOrgChartProps) {
  const isWyndham = selectedCompany === "wyndham";
  const orgThemeColor = isWyndham ? "#0b5c4b" : "#D11242";
  const orgHoverBg = isWyndham ? "hover:bg-[#063b31]" : "hover:bg-red-700";
  const orgAccentClass = isWyndham ? "text-[#0b5c4b]" : "text-[#D11242]";
  const orgBadgeClass = isWyndham ? "bg-[#0b5c4b]/10 text-[#0b5c4b]" : "bg-red-500/10 text-[#D11242]";
  const orgBorderClass = isWyndham ? "border-[#0b5c4b]" : "border-[#D11242]";
  const orgRingClass = isWyndham ? "ring-[#0b5c4b]/10 bg-[#0b5c4b]/5" : "ring-red-500/10 bg-red-50/10";
  const orgRingHeavyClass = isWyndham ? "ring-[#0b5c4b]/30 border-[#0b5c4b]" : "ring-red-500/30 border-[#D11242]";
  const orgButtonBg = isWyndham ? "bg-[#0b5c4b]" : "bg-[#D11242]";
  const orgSubtitle = isWyndham ? "Wailoaloa Beach • Wyndham Garden 2026" : "Wailoaloa Beach • Standard 2026";
  const orgTag = isWyndham ? "Wyndham Garden" : "Ramada Suites";
  const orgDatabaseName = isWyndham ? "Wyndham HR Database" : "Ramada HR Database";

  const ramadaDepartments = [
    { 
      id: "housekeeping-operations",
      dept: "Housekeeping", 
      color: "bg-rose-500/10 text-rose-700 border-rose-200", 
      lead: "Housekeeping Supervisor",
      leadName: "Miriama Waqabaca",
      description: "Responsible for full room sanitation compliance, turnaround schedules, public area cleanliness, laundry pipeline management, and guest requests.",
      staff: ["Public Area Attendant", "Room Attendants", "Housemen"]
    },
    { 
      id: "front-office-operations",
      dept: "Front Office", 
      color: "bg-indigo-500/10 text-indigo-700 border-indigo-200", 
      lead: "Front Office Supervisor",
      leadName: "Sera Seniloli",
      description: "Oversees direct front desk operations, guest service check-in metrics, credit control, guest complaint recovery, and VIP procedures.",
      staff: ["Guest Service Agent"]
    },
    { 
      id: "porter-operations",
      dept: "Porter / Concierge", 
      color: "bg-amber-500/10 text-amber-800 border-amber-200", 
      lead: "Head Porter",
      leadName: "Front Office Team",
      description: "Responsible for seamless guest arrival, lobby welcome ceremonies, heavy luggage transfers, shuttle schedules, and tourist information support.",
      staff: ["Concierge / Porter"]
    },
    { 
      id: "maintenance-operations",
      dept: "Engineering", 
      color: "bg-orange-500/10 text-orange-800 border-orange-200", 
      lead: "Engineering Supervisor",
      leadName: "Kavitesh Sharma",
      description: "Executes preventative maintenance checklist, room mechanical hardware audits, resort generator checks, pool chemical levels, and contractor logs.",
      staff: ["Handyman", "Property Officer", "Activities Officer"]
    },
    { 
      id: "sales-operations",
      dept: "Sales & Revenue", 
      color: "bg-blue-500/10 text-blue-700 border-blue-200", 
      lead: "Reservations Supervisor",
      leadName: "Shwaran Shivani",
      description: "Audits wholesale allotments, direct phone bookings, reservations entry, corporate banquet contracts, and wedding setups.",
      staff: ["Reservations Agent", "Tour Desk"]
    },
    { 
      id: "audit-operations",
      dept: "Night Audit", 
      color: "bg-purple-500/10 text-purple-700 border-purple-200", 
      lead: "Night Auditor",
      leadName: "Finance Team",
      description: "Performs critical post-midnight cash balances, PMS daily rollover actions, revenue validation, and system maintenance summaries.",
      staff: []
    },
    { 
      id: "accounts-operations",
      dept: "Finance & Accounts", 
      color: "bg-emerald-500/10 text-emerald-700 border-emerald-200", 
      lead: "Accounts Officer",
      leadName: "Salesh Prasad",
      description: "Verifies daily resort cashier drawers, petty cash reconciliation, supplier payments, stock invoices, and food & beverage margins audits.",
      staff: ["Line / Stock Controller"]
    }
  ];

  const wyndhamDepartments = [
    { 
      id: "rooms-division-operations",
      dept: "Rooms Division", 
      color: "bg-emerald-500/10 text-emerald-800 border-emerald-200", 
      lead: "Rooms Division Manager",
      leadName: "Varisila Lawenikadavu",
      description: "HOD for Rooms Division. Oversees Front Office, Housekeeping, Guest Services, and Night Audit teams.",
      staff: ["Housekeeping Supervisor", "Night Auditor", "Front Office Supervisor", "Head Concierge / Porter"]
    },
    { 
      id: "housekeeping-operations",
      dept: "Housekeeping", 
      color: "bg-rose-500/10 text-rose-700 border-rose-200", 
      lead: "Housekeeping Supervisor",
      leadName: "Miriama Waqabaca",
      description: "Responsible for full room sanitation, linen inventory, public area cleanliness, and turn-down services.",
      staff: ["Room Attendants", "Linen Controller", "Housemen", "Public Area Attendant"]
    },
    { 
      id: "front-office-operations",
      dept: "Front Office", 
      color: "bg-indigo-500/10 text-indigo-700 border-indigo-200", 
      lead: "Front Office Supervisor",
      leadName: "Sera Seniloli",
      description: "Oversees front desk, guest check-in, reservations, concierge, and driver dispatches.",
      staff: ["Guest Service Agent", "Concierge / Porter", "Reservations Agent", "Driver"]
    },
    { 
      id: "f&b-operations",
      dept: "F&B / Culinary", 
      color: "bg-yellow-500/10 text-yellow-800 border-yellow-200", 
      lead: "F&B / Culinary Manager",
      leadName: "Rohit Lal",
      description: "Directs food and beverage venues, culinary standards, kitchen roster operations, banquet catering, and restaurant service.",
      staff: ["Head Barman", "F&B Supervisor", "Head Chef", "Sous Chef"]
    },
    { 
      id: "maintenance-operations",
      dept: "Engineering", 
      color: "bg-orange-500/10 text-orange-800 border-orange-200", 
      lead: "Maintenance Supervisor",
      leadName: "Kavitesh Sharma",
      description: "Maintains resort physical assets, plumbing, guest room appliances, pools, and coordinates with the Head Property Officer.",
      staff: ["Handyman", "Property Officer", "Activities Officer"]
    },
    { 
      id: "sales-operations",
      dept: "Sales & Revenue", 
      color: "bg-blue-500/10 text-blue-700 border-blue-200", 
      lead: "Revenue & Sales Supervisor",
      leadName: "Shwaran Shivani",
      description: "Manages pricing grids, wholesale allotments, event sales contracts, and tour desk activities.",
      staff: ["Tour Desk Agent", "Revenue & Sales Agent"]
    },
    { 
      id: "accounts-operations",
      dept: "Finance & Accounts", 
      color: "bg-purple-500/10 text-purple-700 border-purple-200", 
      lead: "Accounts Officer",
      leadName: "Salesh Prasad",
      description: "Verifies daily resort cashier drawers, petty cash reconciliation, supplier payments, stock invoices, and food & beverage margins audits.",
      staff: ["Stock Controller", "Audit Officer", "Purchasing Officer"]
    }
  ];

  const operationsDepartments = isWyndham ? wyndhamDepartments : ramadaDepartments;

  const directoryPeople = [
    { id: "mark-hinton", name: "Mark Hinton", role: "Director / Co-Founder", email: "mark@cml.com.fj", phone: "9992001", tier: "board", dept: "Corporate Governance", icon: "🏛️", description: "Responsible for joint strategic planning and major financial assets investments across the Cove Management portfolio." },
    { id: "jenice-hinton", name: "Jenice Hinton", role: "Director / Co-Founder", email: "jenice@cml.com.fj", phone: "9992002", tier: "board", dept: "Corporate Governance", icon: "🏛️", description: "Provides strategic governance, corporate compliance audits, and brand standard reviews across resort holdings." },
    { id: "rohit-lal", name: "Rohit Lal", role: "General Manager / Director", email: "rohit@cml.com.fj", phone: "9984676", tier: "executive", dept: "Administration", icon: "👑", description: "Directs all operational departments, financial performance, brand standard integration, and guest satisfaction across the resort." },
    { id: "neetisa-devi", name: "Neetisa Devi", role: "Cluster HRM", icon: "👥", dept: "Human Resources", tier: "executive", email: "hr@cml.com.fj", phone: "9924840", description: "Directs recruiting drives, industrial employee relations, compliance audits, payroll logs, and team welfare incentives." },
    { id: "john-singh", name: "John Singh", role: "Group I.T Manager", icon: "⚙️", dept: "Engineering", tier: "executive", email: "itmanager@cml.com.fj", phone: "9924841", description: "Fortifies core local property firewalls, hospitality server databases, PMS compliance, and direct secure backups." },
    { id: "charles-cebujano", name: "Charles Cebujano", role: "Group Digital Marketing Exec", icon: "📢", dept: "Administration", tier: "executive", email: "digitalmedia@cml.com.fj", phone: "7144909", description: "Oversees digital platforms, OTA booking engines, digital brand portfolios, and real-time community engagement." },
    { id: "priyesh-narayan", name: "Priyesh Narayan", role: "Cluster Digital Marketing Officer", email: "graphics@cml.com.fj", phone: "9924842", dept: "Administration", tier: "operations", icon: "🎨", description: "Handles media collateral development, high-resolution resort asset templates, photography, and layout designs." },
    { id: "shwaran-shivani", name: "Shwaran Shivani", role: "Group Sales & Revenue Mgr", icon: "📊", dept: "Sales & Revenue", tier: "executive", email: "sales@cml.com.fj", phone: "9924843", description: "Executes target corporate sales contracts, wholesale price negotiations, and maximizes room occupancy yield margins." },
    { id: "prateek-sharma", name: "Prateek Sharma", role: "Group Asset Protection & Compliance", icon: "🔍", dept: "Security & Compliance", tier: "executive", email: "compliance@cml.com.fj", phone: "9924844", description: "Supervises general guest safety protocols, physical asset locks, standards validation audits, and incident documentation." },
    { id: "shahil-sharma", name: "Shahil Sharma", role: "Group Financial Controller", icon: "💰", dept: "Finance & Accounts", tier: "executive", email: "manageraccounts@cml.com.fj", phone: "9924845", description: "Coordinates property audits, statutory compliance reports, capital ledger reconciliation, and weekly P&L reviews." },
    ...(isWyndham ? [
      { id: "rooms-division-operations", name: "Varisila Lawenikadavu", role: "Rooms Division Manager", icon: "🔑", dept: "Rooms Division", tier: "operations", email: "cml@wyndhamgardenwailoaloafiji.com", phone: "9924846", description: "HOD for Rooms Division. Oversees Front Office, Housekeeping, Guest Services, and Night Audit teams." },
      { id: "housekeeping-operations", name: "Miriama Waqabaca", role: "Housekeeping Supervisor", icon: "🧹", dept: "Housekeeping", tier: "operations", email: "cml@wyndhamgardenwailoaloafiji.com", phone: "9924847", description: "Responsible for full room sanitation compliance, turnaround schedules, public area cleanliness, laundry pipeline management, and guest requests." },
      { id: "front-office-operations", name: "Sera Seniloli", role: "Front Office Supervisor", icon: "🛎️", dept: "Front Office", tier: "operations", email: "cml@wyndhamgardenwailoaloafiji.com", phone: "9924848", description: "Oversees front desk, guest check-in, reservations, concierge, and driver dispatches." },
      { id: "f&b-operations", name: "Rohit Lal", role: "F&B / Culinary Manager", icon: "🍴", dept: "F&B / Culinary", tier: "operations", email: "rohit@cml.com.fj", phone: "9924849", description: "Directs food and beverage venues, culinary standards, kitchen roster operations, banquet catering, and restaurant service." },
      { id: "maintenance-operations", name: "Kavitesh Sharma", role: "Engineering Supervisor", icon: "🔧", dept: "Engineering", tier: "operations", email: "digitalmedia@cml.com.fj", phone: "9924850", description: "Maintains resort physical assets, plumbing, guest room appliances, pools, and coordinates with the Head Property Officer." },
      { id: "sales-operations", name: "Shwaran Shivani", role: "Revenue & Sales Supervisor", icon: "📈", dept: "Sales & Revenue", tier: "operations", email: "sales@cml.com.fj", phone: "9924851", description: "Manages pricing grids, wholesale allotments, event sales contracts, and tour desk activities." },
      { id: "accounts-operations", name: "Salesh Prasad", role: "Accounts Officer", icon: "📝", dept: "Finance & Accounts", tier: "operations", email: "digitalmedia@cml.com.fj", phone: "9924852", description: "Verifies daily resort cashier drawers, petty cash reconciliation, supplier payments, stock invoices, and food & beverage margins audits." }
    ] : [
      { id: "housekeeping-operations", name: "Miriama Waqabaca", role: "Housekeeping Supervisor", icon: "🧹", dept: "Housekeeping", tier: "operations", email: "housekeeping@ramadawailoaloafiji.com", phone: "9924846", description: "Responsible for full room sanitation compliance, turnaround schedules, public area cleanliness, laundry pipeline management, and guest requests." },
      { id: "front-office-operations", name: "Sera Seniloli", role: "Front Office Supervisor", icon: "🛎️", dept: "Front Office", tier: "operations", email: "reservations@ramadawailoaloafiji.com", phone: "9924847", description: "Oversees direct front desk operations, guest service check-in metrics, credit control, guest complaint recovery, and VIP procedures." },
      { id: "maintenance-operations", name: "Kavitesh Sharma", role: "Engineering Supervisor", icon: "🔧", dept: "Engineering", tier: "operations", email: "digitalmedia@cml.com.fj", phone: "9924848", description: "Executes preventative maintenance checklist, room mechanical hardware audits, resort generator checks, pool chemical levels, and contractor logs." },
      { id: "accounts-operations", name: "Salesh Prasad", role: "Accounts Officer", icon: "📝", dept: "Finance & Accounts", tier: "operations", email: "digitalmedia@cml.com.fj", phone: "9924849", description: "Verifies daily resort cashier drawers, petty cash reconciliation, supplier payments, stock invoices, and food & beverage margins audits." }
    ])
  ];

  return (
    <div className="space-y-8 animate-fade-in text-left">
      {/* Header Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className={cn("text-[10px] font-display font-bold uppercase tracking-widest px-2.5 py-1 rounded", isWyndham ? "bg-teal-500/10 text-[#0b5c4b]" : "bg-red-500/10 text-[#D11242]")}>
              {orgTag}
            </span>
            <span className="text-[9px] font-mono text-slate-400">
              {orgSubtitle}
            </span>
          </div>
          <h3 className="text-2xl font-serif text-slate-950 italic">
            Organizational Structure & Team Directory
          </h3>
        </div>
        
        {/* Search and Layout Selectors */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
              <Search size={14} />
            </span>
            <input 
              type="text"
              placeholder="Search directors, managers, roles..."
              value={orgSearchQuery}
              onChange={(e) => setOrgSearchQuery(e.target.value)}
              className={cn("pl-9 pr-4 py-1.5 bg-slate-50 border focus:outline-none rounded text-xs w-60 text-slate-700 shadow-inner", isWyndham ? "focus:border-[#0b5c4b]" : "focus:border-[#D11242]")}
            />
            {orgSearchQuery && (
              <button 
                onClick={() => setOrgSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-mono font-black text-slate-400 hover:text-slate-600 bg-slate-200/50 hover:bg-slate-200 rounded px-1"
              >
                CLEAR
              </button>
            )}
          </div>
          
          {/* Layout Select Mode */}
          <div className="flex bg-slate-100 p-0.5 rounded border border-slate-200">
            <button
              onClick={() => setOrgViewLayout("visual")}
              className={cn(
                "px-3 py-1 rounded-sm text-[10px] font-display uppercase tracking-wider font-extrabold transition-all cursor-pointer",
                orgViewLayout === "visual" 
                  ? "bg-white text-slate-950 shadow-sm font-black" 
                  : "text-slate-500 hover:text-slate-800"
              )}
            >
              Tree View
            </button>
            <button
              onClick={() => setOrgViewLayout("directory")}
              className={cn(
                "px-3 py-1 rounded-sm text-[10px] font-display uppercase tracking-wider font-extrabold transition-all cursor-pointer",
                orgViewLayout === "directory" 
                  ? "bg-white text-slate-950 shadow-sm font-black" 
                  : "text-slate-500 hover:text-slate-800"
              )}
            >
              Card List
            </button>
          </div>

          {/* Tier Filters */}
          <div className="flex bg-slate-100 p-0.5 rounded border border-slate-200">
            {[
              { id: "all", label: "Full Chart" },
              { id: "board", label: "Board" },
              { id: "executive", label: "Executive" },
              { id: "operations", label: "Operations" }
            ].map(t => (
              <button
                key={t.id}
                onClick={() => setSelectedOrgTier(t.id as any)}
                className={cn(
                  "px-3 py-1 rounded-sm text-[10px] font-display uppercase tracking-wider font-extrabold transition-all cursor-pointer",
                  selectedOrgTier === t.id 
                    ? "bg-white text-slate-950 shadow-sm font-black" 
                    : "text-slate-500 hover:text-slate-800"
                )}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Helper Banner */}
      <div className="bg-slate-50 border border-slate-100 p-4 rounded-lg flex items-center justify-between text-xs text-slate-600">
        <div className="flex items-center gap-2.5">
          <span className="text-sm">💡</span>
          <span>
            <strong>Interactive Directory Connected:</strong> Click on any department card or management node to inspect their operational profile, copy direct contact information, and dynamically query their active staff roster from the <strong>{orgDatabaseName}</strong>.
          </span>
        </div>
        <div className="hidden md:block font-mono text-[10px] text-slate-400 bg-white border px-2 py-0.5 rounded">
          Total Staff: {initialEmployees.length}
        </div>
      </div>

      {/* Rendering Layouts */}
      {orgViewLayout === "visual" ? (
        <div className="p-6 bg-slate-50/50 rounded-xl border border-slate-100 overflow-x-auto min-w-full scroller-premium">
          <div className="flex flex-col items-center space-y-12 py-4 min-w-[1300px]">
            
            {/* SECTION 1: BOARD OF DIRECTORS */}
            {(selectedOrgTier === "all" || selectedOrgTier === "board") && (
              <div className="flex flex-col items-center">
                <span className={cn("text-[10px] font-display uppercase tracking-[0.2em] font-extrabold mb-4 flex items-center gap-1.5", orgAccentClass)}>
                  <span>🏛️</span> Board of Directors & Ownership
                </span>
                <div className="flex justify-center gap-6">
                  {[
                    { id: "mark-hinton", name: "Mark Hinton", role: "Director / Co-Founder", email: "mark@cml.com.fj", phone: "9992001", tier: "board", description: "Responsible for joint strategic planning and major financial assets investments across the Cove Management portfolio." },
                    { id: "jenice-hinton", name: "Jenice Hinton", role: "Director / Co-Founder", email: "jenice@cml.com.fj", phone: "9992002", tier: "board", description: "Provides strategic governance, corporate compliance audits, and brand standard reviews across resort holdings." },
                    { id: "rohit-lal-board", name: "Rohit Lal", role: "General Manager / Director", email: "rohit@cml.com.fj", phone: "9984676", dept: "Administration", tier: "executive", description: "Unifies board strategic direction with daily property operational teams and high-level resort metrics." }
                  ].map((b, i) => {
                    const isMatched = isStaffMatch(b.name, b.role);
                    return (
                      <div 
                        key={i} 
                        onClick={() => setSelectedOrgNode(b)}
                        className={cn(
                          "p-4 rounded-xl border text-center w-56 transition-all shadow-sm bg-white cursor-pointer hover:-translate-y-1 hover:shadow-md",
                          isMatched 
                            ? (isWyndham ? "border-[#0b5c4b] ring-4 ring-teal-500/10 bg-teal-50/10" : "border-[#D11242] ring-4 ring-red-500/10 bg-red-50/10") 
                            : "border-slate-200 hover:border-slate-350"
                        )}
                      >
                        <div className="w-10 h-10 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center font-display font-black text-xs text-slate-700 mx-auto mb-2">
                          {b.name.split(" ").map(n => n[0]).join("")}
                        </div>
                        <h4 className="text-xs font-display font-black text-slate-900 uppercase tracking-wider">{b.name}</h4>
                        <p className="text-[10px] font-serif text-slate-500 italic mt-1">{b.role}</p>
                        <div className={cn("text-[8px] font-mono mt-2 px-2 py-0.5 rounded-full inline-block uppercase font-black", isWyndham ? "bg-teal-50 text-[#0b5c4b]" : "bg-red-50 text-[#D11242]")}>
                          OWNERSHIP
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="w-0.5 h-10 bg-slate-300 mt-4"></div>
              </div>
            )}

            {/* SECTION 2: GENERAL MANAGER (ROHIT LAL) */}
            {(selectedOrgTier === "all" || selectedOrgTier === "board" || selectedOrgTier === "executive") && (
              <div className="flex flex-col items-center">
                <div 
                  onClick={() => setSelectedOrgNode({
                    id: "rohit-lal",
                    name: "Rohit Lal",
                    role: "General Manager / Director",
                    tier: "executive",
                    icon: "👑",
                    email: "rohit@cml.com.fj",
                    phone: "9984676",
                    description: "Directs all operational departments, financial performance, brand standard integration, and guest satisfaction across the resort.",
                    dept: "Administration"
                  })}
                  className={cn(
                    "p-5 rounded-xl border text-center w-72 transition-all shadow-md text-white cursor-pointer hover:-translate-y-1 hover:shadow-lg bg-gradient-to-r",
                    isWyndham ? "from-[#084236] to-stone-900 border-[#0b5c4b]" : "from-red-950 to-stone-900 border-stone-800",
                    isStaffMatch("Rohit Lal", "General Manager") ? (isWyndham ? "ring-4 ring-teal-500/30 border-[#0b5c4b]" : "ring-4 ring-red-500/30 border-[#D11242]") : ""
                  )}
                >
                  <div className={cn("w-2.5 h-2.5 rounded-full mx-auto mb-2.5 animate-pulse", isWyndham ? "bg-teal-400" : "bg-[#D11242]")} />
                  <h4 className="text-sm font-display font-black uppercase tracking-widest text-white">Rohit Lal</h4>
                  <p className="text-[11px] text-red-100 mt-0.5">General Manager & Director</p>
                  <p className="text-[8px] font-mono text-[#C5A02D] tracking-[0.25em] uppercase mt-3 font-extrabold bg-amber-500/10 py-1 rounded border border-amber-500/20">
                    Resort Operational Lead
                  </p>
                </div>
                <div className="w-0.5 h-12 bg-slate-300 mt-2"></div>
              </div>
            )}

            {/* SECTION 3: CORPORATE EXECUTIVE TEAM */}
            {(selectedOrgTier === "all" || selectedOrgTier === "executive") && (
              <div className="flex flex-col items-center w-full">
                {/* Horizontal Line for executives */}
                <div className="w-[85%] h-0.5 bg-slate-300 mb-0"></div>
                
                <div className="flex justify-between w-[92%] gap-4 pt-4">
                  {[
                    { id: "neetisa-devi", name: "Neetisa Devi", role: "Cluster HRM", icon: "👥", dept: "Human Resources", tier: "executive", email: "hr@cml.com.fj", phone: "9924840", description: "Directs recruiting drives, industrial employee relations, compliance audits, payroll logs, and team welfare incentives." },
                    { id: "john-singh", name: "John Singh", role: "Group I.T Manager", icon: "⚙️", dept: "Engineering", tier: "executive", email: "itmanager@cml.com.fj", phone: "9924841", description: "Fortifies core local property firewalls, hospitality server databases, PMS compliance, and direct secure backups." },
                    { 
                      id: "charles-cebujano", 
                      name: "Charles Cebujano", 
                      role: "Group Digital Marketing Exec", 
                      icon: "📢",
                      dept: "Administration",
                      tier: "executive",
                      email: "digitalmedia@cml.com.fj",
                      phone: "7144909",
                      description: "Oversees digital platforms, OTA booking engines, digital brand portfolios, and real-time community engagement.",
                      subordinates: [
                        { name: "Priyesh Narayan", role: "Cluster Digital Marketing Officer", email: "graphics@cml.com.fj", phone: "9924842" }
                      ]
                    },
                    { id: "shwaran-shivani", name: "Shwaran Shivani", role: "Group Sales & Revenue Mgr", icon: "📊", dept: "Sales & Revenue", tier: "executive", email: "sales@cml.com.fj", phone: "9924843", description: "Executes target corporate sales contracts, wholesale price negotiations, and maximizes room occupancy yield margins." },
                    { id: "prateek-sharma", name: "Prateek Sharma", role: "Group Asset Protection & Compliance", icon: "🔍", dept: "Security & Compliance", tier: "executive", email: "compliance@cml.com.fj", phone: "9924844", description: "Supervises general guest safety protocols, physical asset locks, standards validation audits, and incident documentation." },
                    { id: "shahil-sharma", name: "Shahil Sharma", role: "Group Financial Controller", icon: "💰", dept: "Finance & Accounts", tier: "executive", email: "manageraccounts@cml.com.fj", phone: "9924845", description: "Coordinates property audits, statutory compliance reports, capital ledger reconciliation, and weekly P&L reviews." }
                  ].map((exec, idx) => {
                    const isMatched = isStaffMatch(exec.name, exec.role);
                    return (
                      <div key={idx} className="flex flex-col items-center flex-1 min-w-[150px]">
                        {/* Vertical drop line to node */}
                        <div className="w-0.5 h-4 bg-slate-300 -mt-4 mb-2"></div>
                        
                        <div 
                          onClick={() => setSelectedOrgNode(exec)}
                          className={cn(
                            "p-4 rounded-xl border w-full text-center bg-white transition-all shadow-sm flex flex-col justify-between h-32 cursor-pointer hover:-translate-y-1 hover:shadow-md",
                            isMatched 
                              ? (isWyndham ? "border-[#0b5c4b] ring-4 ring-teal-500/10 bg-teal-50/10" : "border-[#D11242] ring-4 ring-red-500/10 bg-red-50/10") 
                              : "border-slate-200 hover:border-slate-300"
                          )}
                        >
                          <div>
                            <span className="text-xl block mb-1">{exec.icon}</span>
                            <h5 className="text-[10px] font-display font-black text-slate-900 uppercase leading-snug tracking-wider">{exec.name}</h5>
                          </div>
                          <div className="mt-auto">
                            <p className={cn("text-[9px] font-semibold leading-snug mt-1 py-0.5 rounded uppercase tracking-wider", isWyndham ? "text-[#0b5c4b] bg-teal-50/55" : "text-[#D11242] bg-red-50/55")}>{exec.role}</p>
                          </div>
                        </div>

                        {/* Render subordinate if present */}
                        {exec.subordinates && exec.subordinates.map((sub, sIdx) => (
                          <div key={sIdx} className="flex flex-col items-center w-full mt-2">
                            <div className="w-0.5 h-4 bg-slate-300"></div>
                            <div 
                              onClick={() => setSelectedOrgNode({
                                id: "priyesh-narayan",
                                name: sub.name,
                                role: sub.role,
                                dept: "Administration",
                                tier: "operations",
                                email: sub.email,
                                phone: sub.phone,
                                description: "Handles media collateral development, high-resolution resort asset templates, photography, and layout designs."
                              })}
                              className={cn(
                                "p-2.5 rounded-lg border w-11/12 text-center bg-stone-50 transition-all text-[9.5px] cursor-pointer hover:bg-stone-100",
                                isStaffMatch(sub.name, sub.role) ? (isWyndham ? "border-[#0b5c4b] bg-teal-50/20" : "border-[#D11242] bg-red-50/20") : "border-slate-200"
                              )}
                            >
                              <h6 className="font-display font-black text-slate-800 uppercase leading-tight">{sub.name}</h6>
                              <p className={cn("text-[8.5px] font-medium uppercase mt-0.5", orgAccentClass)}>{sub.role}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    );
                  })}
                </div>
                
                <div className="w-0.5 h-12 bg-slate-300 mt-6"></div>
              </div>
            )}

            {/* SECTION 4: HOTEL OPERATIONS */}
            {(selectedOrgTier === "all" || selectedOrgTier === "operations") && (
              <div className="flex flex-col items-center w-full">
                <span className={cn("text-[10px] font-display uppercase tracking-[0.2em] font-extrabold mb-4 flex items-center gap-1.5", orgAccentClass)}>
                  <span>🏨</span> Resort Operations Departments & HODs
                </span>
                
                {/* Manager on Duty Card */}
                <div 
                  onClick={() => setSelectedOrgNode({
                    id: "mod",
                    name: "Manager on Duty",
                    role: "Active Property Operations Lead",
                    tier: "operations",
                    email: isWyndham ? "cml@wyndhamgardenwailoaloafiji.com" : "MOD@ramadawailoaloafiji.com",
                    phone: "9924846",
                    description: "Rotational executive shift controller overseeing overnight guest care, critical maintenance dispatches, safety routines, and daily revenue reconciliation.",
                    dept: "Front Office"
                  })}
                  className={cn(
                    "p-3.5 rounded-xl border text-center w-64 transition-all shadow text-white border-transparent cursor-pointer hover:-translate-y-1 hover:shadow-md",
                    orgButtonBg,
                    isStaffMatch("Manager on Duty", "Operations") ? "ring-4 ring-offset-2 ring-emerald-500/30" : ""
                  )}
                >
                  <h4 className="text-xs font-display font-black uppercase tracking-widest flex items-center justify-center gap-2">
                    <span>🛎️</span> Manager on Duty
                  </h4>
                  <p className="text-[9px] text-teal-100 mt-0.5">Rotational Shift Controller</p>
                </div>
                
                <div className="w-0.5 h-8 bg-slate-300 mt-1"></div>
                
                {/* Horizontal operations connection line */}
                <div className="w-[92%] h-0.5 bg-slate-300 mb-0"></div>

                {/* Operations Departments Row */}
                <div className="flex justify-between w-full gap-4 pt-4">
                  {operationsDepartments.map((dep, dIdx) => {
                    const isMatched = isStaffMatch(dep.lead, dep.dept) || isStaffMatch(dep.leadName, dep.dept);
                    return (
                      <div key={dIdx} className="flex flex-col items-center flex-1 min-w-[160px]">
                        {/* vertical connection drop */}
                        <div className="w-0.5 h-4 bg-slate-300 -mt-4 mb-2"></div>

                        {/* Department Head Node */}
                        <div 
                          onClick={() => setSelectedOrgNode({
                            id: dep.id,
                            name: dep.leadName,
                            role: dep.lead,
                            dept: dep.dept,
                            tier: "operations",
                            email: dep.dept === "Housekeeping" ? (isWyndham ? "cml@wyndhamgardenwailoaloafiji.com" : "housekeeping@ramadawailoaloafiji.com") : dep.dept === "Front Office" ? (isWyndham ? "cml@wyndhamgardenwailoaloafiji.com" : "reservations@ramadawailoaloafiji.com") : "digitalmedia@cml.com.fj",
                            phone: "992484" + (10 + dIdx),
                            description: dep.description,
                            staffRoles: dep.staff
                          })}
                          className={cn(
                            "p-4 rounded-xl border w-full text-center bg-white transition-all shadow-sm cursor-pointer hover:-translate-y-1 hover:shadow-md",
                            isMatched 
                              ? (isWyndham ? "border-[#0b5c4b] ring-4 ring-teal-500/10 bg-teal-50/10" : "border-[#D11242] ring-4 ring-red-500/10 bg-red-50/10") 
                              : "border-slate-200 hover:border-slate-350"
                          )}
                        >
                          <span className={cn("px-2 py-0.5 rounded text-[8px] font-display uppercase tracking-wider font-extrabold block text-center mb-2", dep.color)}>
                            {dep.dept}
                          </span>
                          <h5 className="text-[10px] font-display font-black text-slate-900 uppercase leading-snug">{dep.leadName}</h5>
                          <p className="text-[8.5px] font-serif text-slate-500 italic mt-0.5">{dep.lead}</p>
                        </div>

                        {/* Staff Members List */}
                        {dep.staff.length > 0 && (
                          <div className="flex flex-col items-center w-full mt-2.5 space-y-1.5">
                            <div className="w-0.5 h-3 bg-slate-300"></div>
                            
                            {dep.staff.map((s, sIdx) => {
                              const isRoleMatched = isStaffMatch(s, dep.dept);
                              return (
                                <div 
                                  key={sIdx}
                                  onClick={() => setSelectedOrgNode({
                                    id: `staff-${dIdx}-${sIdx}`,
                                    name: s + " (Department Category)",
                                    role: s,
                                    dept: dep.dept,
                                    tier: "operations",
                                    email: isWyndham ? "cml@wyndhamgardenwailoaloafiji.com" : "digitalmedia@cml.com.fj",
                                    phone: "9984676",
                                    description: `Core front-line roster staff representing ${s} responsibilities in our ${dep.dept} operations.`,
                                    staffRoles: []
                                  })}
                                  className={cn(
                                    "p-2 rounded-lg border border-slate-100 bg-stone-50 w-[95%] text-center text-[9px] font-semibold text-slate-700 cursor-pointer transition-all hover:bg-stone-100",
                                    isRoleMatched ? (isWyndham ? "border-[#0b5c4b] bg-teal-50/20 text-slate-950 font-extrabold" : "border-[#D11242] bg-red-50/20 text-slate-950 font-extrabold") : ""
                                  )}
                                >
                                  {s}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

              </div>
            )}

          </div>
        </div>
      ) : (
        /* DIRECTORY CARD LIST LAYOUT */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in">
          {directoryPeople.filter(p => {
            // Search query filter
            const matchesSearch = !orgSearchQuery || 
              p.name.toLowerCase().includes(orgSearchQuery.toLowerCase()) ||
              p.role.toLowerCase().includes(orgSearchQuery.toLowerCase()) ||
              p.dept.toLowerCase().includes(orgSearchQuery.toLowerCase());
            
            // Tier filter
            const matchesTier = selectedOrgTier === "all" || p.tier === selectedOrgTier;
            return matchesSearch && matchesTier;
          }).map((person) => (
            <div 
              key={person.id}
              onClick={() => setSelectedOrgNode(person)}
              className="bg-white rounded-xl border border-slate-150 p-5 shadow-sm hover:shadow-md cursor-pointer transition-all hover:-translate-y-1 text-left flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3.5">
                  <div className="w-9 h-9 rounded-full bg-slate-50 border flex items-center justify-center font-display font-black text-xs text-slate-700">
                    {person.name.split(" ").map(n => n[0]).join("")}
                  </div>
                  <span className={cn(
                    "text-[8px] font-display uppercase tracking-widest px-2.5 py-0.5 rounded font-extrabold",
                    person.tier === "board" ? "bg-amber-100 text-amber-800 border border-amber-200" :
                    person.tier === "executive" ? "bg-slate-150 text-slate-800 border border-slate-200" :
                    (isWyndham ? "bg-[#0b5c4b]/10 text-[#0b5c4b] border border-[#0b5c4b]/25" : "bg-red-50 text-red-700 border border-red-200")
                  )}>
                    {person.dept}
                  </span>
                </div>
                <h4 className="text-xs font-display font-black uppercase tracking-wider text-slate-900">{person.name}</h4>
                <p className="text-[10px] text-slate-500 font-serif italic mt-0.5">{person.role}</p>
                <p className="text-[10.5px] text-slate-600 font-sans leading-relaxed mt-3.5 line-clamp-2">
                  {person.description}
                </p>
              </div>
              <div className="mt-4 pt-3.5 border-t border-slate-100 flex items-center justify-between text-[10px] font-mono text-slate-400">
                <span>📧 {person.email}</span>
                <span className="text-gold font-extrabold flex items-center gap-1">VIEW PROFILE <ChevronRight size={10} /></span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* INTERACTIVE PROFILE OVERLAY / SIDE PANEL DRAWER */}
      <AnimatePresence>
        {selectedOrgNode && (
          <>
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.3 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedOrgNode(null)}
              className="fixed inset-0 bg-black z-40"
            />
            {/* Drawer Panel */}
            <motion.div 
              initial={{ opacity: 0, x: 400 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 400 }}
              transition={{ type: "spring", damping: 25, stiffness: 220 }}
              className="fixed inset-y-0 right-0 w-full sm:w-[480px] bg-white shadow-2xl z-50 p-6 overflow-y-auto border-l border-slate-200 text-left"
            >
              {/* Close Button */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-5">
                <span className={cn("text-[10px] font-display font-black uppercase tracking-widest", orgAccentClass)}>
                  Staff Operational Dossier
                </span>
                <button 
                  onClick={() => setSelectedOrgNode(null)}
                  className="p-1 hover:bg-slate-100 rounded text-slate-500 transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Banner & Head */}
              <div className={cn("relative rounded-xl overflow-hidden text-white p-6 mb-6 bg-gradient-to-r", isWyndham ? "from-teal-900 to-stone-900" : "from-red-900 to-stone-900")}>
                <div className="absolute top-2 right-2 font-mono text-[8px] bg-white/20 px-2 py-0.5 rounded uppercase tracking-wider">
                  {selectedOrgNode.tier}
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-white/15 border border-white/25 flex items-center justify-center font-display font-black text-lg text-white shadow-inner shrink-0">
                    {selectedOrgNode.name ? selectedOrgNode.name.split(" ").map((n: string) => n[0]).join("") : "RM"}
                  </div>
                  <div>
                    <h3 className="text-base font-display font-black uppercase tracking-wider text-white">
                      {selectedOrgNode.name}
                    </h3>
                    <p className="text-xs text-teal-100 font-serif italic mt-0.5">
                      {selectedOrgNode.role}
                    </p>
                    <p className="text-[10px] text-amber-400 font-mono font-bold uppercase tracking-widest mt-2">
                      📍 {selectedOrgNode.dept || (isWyndham ? "Wyndham Garden Operations" : "Ramada Suites Operations")}
                    </p>
                  </div>
                </div>
              </div>

              {/* Profile Details Cards */}
              <div className="space-y-5">
                {/* Summary / Mission */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <h4 className="text-[10px] font-display font-black text-slate-400 uppercase tracking-widest mb-1.5">
                    Operational Scope & Mandate
                  </h4>
                  <p className="text-xs font-serif text-slate-700 italic leading-relaxed">
                    "{selectedOrgNode.description}"
                  </p>
                </div>

                {/* Contact Information */}
                <div className="border border-slate-150 rounded-xl p-4 space-y-3.5">
                  <h4 className="text-[10px] font-display font-black text-slate-400 uppercase tracking-widest border-b pb-2">
                    Verified Contact Details
                  </h4>
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-500">Corporate Email</span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-slate-800">{selectedOrgNode.email || (isWyndham ? "cml@wyndhamgardenwailoaloafiji.com" : "digitalmedia@cml.com.fj")}</span>
                      <button 
                        onClick={() => {
                          navigator.clipboard.writeText(selectedOrgNode.email || (isWyndham ? "cml@wyndhamgardenwailoaloafiji.com" : "digitalmedia@cml.com.fj"));
                          toastService.success("Email copied to clipboard!");
                        }}
                        className="text-[9px] font-mono font-bold bg-slate-100 hover:bg-slate-200 border px-1.5 py-0.5 rounded text-slate-700"
                      >
                        COPY
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-500">Mobile Directory</span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-slate-800">Fiji (+679) {selectedOrgNode.phone || "9984676"}</span>
                      <button 
                        onClick={() => {
                          navigator.clipboard.writeText(selectedOrgNode.phone || "9984676");
                          toastService.success("Phone number copied!");
                        }}
                        className="text-[9px] font-mono font-bold bg-slate-100 hover:bg-slate-200 border px-1.5 py-0.5 rounded text-slate-700"
                      >
                        COPY
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-500">System Permissions</span>
                    <span className="text-[9.5px] font-display font-black uppercase text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-100">
                      {selectedOrgNode.tier === "board" ? "SYSTEM_ROOT_OWNER" : selectedOrgNode.tier === "executive" ? "L2_HOD_ADMIN" : "L1_STAFF_READ_WRITE"}
                    </span>
                  </div>
                </div>

                {/* ACTIONS QUICK LAUNCH */}
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <button
                    onClick={() => {
                      const targetSpace = selectedOrgNode.dept === "Housekeeping" 
                        ? "Wyndham Recovery Operations" 
                        : "General Announcements";
                      setSelectedOrgNode(null);
                      toastService.success(`Please open the CML Chat widget on the bottom-right to message in the "${targetSpace}" channel!`);
                    }}
                    className={cn("py-2.5 text-white font-display text-[10px] font-black uppercase tracking-wider rounded-lg transition-all flex items-center justify-center gap-2 shadow-sm cursor-pointer hover:opacity-90", orgButtonBg)}
                  >
                    <MessageSquare size={13} />
                    Message Team
                  </button>
                  <button
                    onClick={() => {
                      toastService.success(`Dialing +679 ${selectedOrgNode.phone || "9984676"} in virtual office...`);
                    }}
                    className="py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-800 font-display text-[10px] font-black uppercase tracking-wider rounded-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    📞 Virtual Dial
                  </button>
                </div>

                {/* DYNAMIC STAFF ROSTER FILTERED DIRECTLY FROM THE 300+ EMPLOYEES DATABASE */}
                {selectedOrgNode.dept && (
                  <div className="border border-slate-150 rounded-xl p-4 mt-2 space-y-3 bg-stone-50/50">
                    <div className="flex items-center justify-between border-b pb-2">
                      <h4 className="text-[10px] font-display font-black text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                        <span>👥</span> Active Department Roster
                      </h4>
                      <span className="text-[9px] font-mono text-slate-400 font-bold">
                        DATABASE RECORD MATCHES
                      </span>
                    </div>

                    <div className="max-h-52 overflow-y-auto pr-1 space-y-2 scroller-premium">
                      {initialEmployees.filter(emp => {
                        // Clean department matches
                        const nodeDept = selectedOrgNode.dept.toLowerCase();
                        const empDept = emp.department.toLowerCase();
                        return empDept === nodeDept || 
                               (nodeDept === "engineering" && empDept === "engineering") ||
                               (nodeDept === "finance & accounts" && empDept === "finance & accounts") ||
                               (nodeDept === "rooms division" && (empDept === "front office" || empDept === "housekeeping"));
                      }).slice(0, 15).map((staffMember) => (
                        <div 
                          key={staffMember.id}
                          className="bg-white p-2.5 rounded-lg border border-slate-100 shadow-xs flex items-center justify-between text-xs"
                        >
                          <div>
                            <div className="font-display font-black text-slate-900 uppercase text-[10.5px]">
                              {staffMember.firstName} {staffMember.lastName}
                            </div>
                            <div className="text-[9px] text-slate-400 font-mono mt-0.5 flex items-center gap-2">
                              <span>ID: {staffMember.employeeCode}</span>
                              <span>•</span>
                              <span>DOB: {staffMember.dateOfBirth}</span>
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="text-[8px] font-display uppercase font-black px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 border">
                              {staffMember.role}
                            </span>
                            <div className="text-[8.5px] font-mono text-slate-500 mt-1">
                              {staffMember.email ? staffMember.email : "No email logged"}
                            </div>
                          </div>
                        </div>
                      ))}
                      {initialEmployees.filter(emp => emp.department.toLowerCase() === selectedOrgNode.dept.toLowerCase()).length === 0 && (
                        <div className="text-center py-6 text-slate-400 italic text-[11px]">
                          No front-line staff logs match this executive management category.
                        </div>
                      )}
                    </div>
                    
                    <div className="text-[8.5px] font-mono text-slate-400 text-center border-t pt-2 mt-2">
                      Showing up to 15 real-time roster entries dynamically connected.
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
