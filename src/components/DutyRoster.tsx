import React, { useState, useEffect } from "react";
import { 
  Calendar, 
  Clock, 
  User, 
  Filter, 
  Plus, 
  Search, 
  Sparkles, 
  Trash2, 
  CheckCircle,
  FileText
} from "lucide-react";

interface Shift {
  id: string;
  employeeName: string;
  department: "IT Graphics Support" | "Engineering Maintenance" | "Sales Reservations" | "Support" | "Housekeeping" | "Culinary F&B" | "Front Office" | "Security";
  shiftType: "Morning" | "Afternoon" | "Night" | "Mid-Day";
  hours: string;
  days: string[]; // e.g. ["Mon", "Tue", "Wed", "Thu", "Fri"]
  notes?: string;
}

interface DutyRosterProps {
  companyId: string;
}

const DEFAULT_SHIFTS: Shift[] = [
  {
    id: "shift-1",
    employeeName: "Charles Cebujano",
    department: "IT Graphics Support",
    shiftType: "Morning",
    hours: "08:00 - 17:00",
    days: ["Mon", "Tue", "Wed", "Thu", "Fri"],
    notes: "Corporate Proxy & System Diagnostic Oversight"
  },
  {
    id: "shift-2",
    employeeName: "Anita Prasad",
    department: "Housekeeping",
    shiftType: "Morning",
    hours: "06:00 - 14:00",
    days: ["Mon", "Tue", "Wed", "Sat", "Sun"],
    notes: "Room inspection checks"
  },
  {
    id: "shift-3",
    employeeName: "Rajesh Kumar",
    department: "Security",
    shiftType: "Night",
    hours: "22:00 - 06:00",
    days: ["Wed", "Thu", "Fri", "Sat", "Sun"],
    notes: "Night safety protocol audits"
  },
  {
    id: "shift-4",
    employeeName: "Makereta S.",
    department: "Culinary F&B",
    shiftType: "Mid-Day",
    hours: "11:00 - 19:00",
    days: ["Tue", "Wed", "Thu", "Fri", "Sat"],
    notes: "Special beach dinner deck oversight"
  },
  {
    id: "shift-5",
    employeeName: "Savenaca T.",
    department: "Engineering Maintenance",
    shiftType: "Afternoon",
    hours: "14:00 - 22:00",
    days: ["Mon", "Tue", "Wed", "Thu", "Fri"],
    notes: "Preventative public spaces maintenance check"
  }
];

export const DutyRoster: React.FC<DutyRosterProps> = ({ companyId }) => {
  const [shifts, setShifts] = useState<Shift[]>(() => {
    const saved = localStorage.getItem(`duty-roster-${companyId}`);
    return saved ? JSON.parse(saved) : DEFAULT_SHIFTS;
  });

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDept, setSelectedDept] = useState<string>("All");
  const [selectedShiftType, setSelectedShiftType] = useState<string>("All");
  
  // Shift creation form states
  const [showAddModal, setShowAddModal] = useState(false);
  const [newShift, setNewShift] = useState<Omit<Shift, "id">>({
    employeeName: "",
    department: "IT Graphics Support",
    shiftType: "Morning",
    hours: "08:00 - 17:00",
    days: ["Mon", "Tue", "Wed", "Thu", "Fri"],
    notes: ""
  });

  useEffect(() => {
    localStorage.setItem(`duty-roster-${companyId}`, JSON.stringify(shifts));
  }, [shifts, companyId]);

  const handleAddShift = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newShift.employeeName.trim()) return;

    const addedShift: Shift = {
      id: `shift-${Date.now()}`,
      ...newShift
    };

    setShifts(prev => [addedShift, ...prev]);
    setShowAddModal(false);
    setNewShift({
      employeeName: "",
      department: "IT Graphics Support",
      shiftType: "Morning",
      hours: "08:00 - 17:00",
      days: ["Mon", "Tue", "Wed", "Thu", "Fri"],
      notes: ""
    });
  };

  const handleDeleteShift = (id: string) => {
    if (confirm("Are you sure you want to remove this shift entry from the roster?")) {
      setShifts(prev => prev.filter(s => s.id !== id));
    }
  };

  const handleToggleDay = (day: string) => {
    setNewShift(prev => {
      const isSelected = prev.days.includes(day);
      const updatedDays = isSelected 
        ? prev.days.filter(d => d !== day)
        : [...prev.days, day];
      return { ...prev, days: updatedDays };
    });
  };

  const filteredShifts = shifts.filter(s => {
    const matchesSearch = s.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (s.notes && s.notes.toLowerCase().includes(searchTerm.toLowerCase())) ||
                          s.department.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesDept = selectedDept === "All" || s.department === selectedDept;
    const matchesType = selectedShiftType === "All" || s.shiftType === selectedShiftType;

    return matchesSearch && matchesDept && matchesType;
  });

  const departmentList = [
    "IT Graphics Support",
    "Engineering Maintenance",
    "Sales Reservations",
    "Support",
    "Housekeeping",
    "Culinary F&B",
    "Front Office",
    "Security"
  ];

  const DAYS_OF_WEEK = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  return (
    <div id="duty-roster-container" className="space-y-8 animate-fade-in pb-16">
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-4xl font-serif text-slate-900 italic">Duty Roster & Shift Schedules</h2>
          <p className="luxury-label opacity-60">System alignments, active managers on-duty & resource distribution</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-6 py-3 bg-slate-950 text-white text-[10px] font-display uppercase tracking-widest font-bold hover:bg-gold transition-all shadow-md self-start md:self-auto border border-gold/20"
        >
          <Plus size={14} /> Schedule Shift
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white border border-slate-100 p-6 shadow-sm relative overflow-hidden">
          <p className="text-[9px] font-display uppercase tracking-widest text-slate-400 font-bold mb-1">Active Roster Entries</p>
          <p className="text-3xl font-serif text-slate-900 italic font-bold">{shifts.length}</p>
          <p className="text-[10px] text-slate-500 mt-2">Fully configured personnel shifts</p>
        </div>
        <div className="bg-white border border-slate-100 p-6 shadow-sm relative overflow-hidden">
          <p className="text-[9px] font-display uppercase tracking-widest text-slate-400 font-bold mb-1">Active Today</p>
          <p className="text-3xl font-serif text-slate-900 italic font-bold">
            {shifts.filter(s => {
              const currentDayStr = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][new Date().getDay()];
              return s.days.includes(currentDayStr);
            }).length}
          </p>
          <p className="text-[10px] text-slate-500 mt-2">Personnel on rotation for the current day</p>
        </div>
        <div className="bg-white border border-slate-100 p-6 shadow-sm relative overflow-hidden">
          <p className="text-[9px] font-display uppercase tracking-widest text-slate-400 font-bold mb-1">Weekly Standard Integrity</p>
          <p className="text-3xl font-serif text-emerald-600 italic font-bold">100%</p>
          <p className="text-[10px] text-slate-500 mt-2">All primary resort shifts covered</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-slate-100 p-6 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search size={16} className="absolute left-3.5 top-[50%] transform -translate-y-[50%] text-slate-400" />
            <input
              type="text"
              placeholder="Search employee names, notes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 pl-10 pr-4 py-2.5 text-xs text-slate-800 focus:bg-white focus:border-gold outline-none transition-all placeholder:text-slate-400 rounded-none"
            />
          </div>
          <div className="flex gap-4">
            <div className="flex items-center gap-2">
              <Filter size={13} className="text-slate-400" />
              <select
                value={selectedDept}
                onChange={(e) => setSelectedDept(e.target.value)}
                className="bg-slate-50 border border-slate-200 text-slate-700 text-xs px-3 py-2.5 outline-none rounded-none focus:border-gold"
              >
                <option value="All">All Departments</option>
                {departmentList.map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
            <select
              value={selectedShiftType}
              onChange={(e) => setSelectedShiftType(e.target.value)}
              className="bg-slate-50 border border-slate-200 text-slate-700 text-xs px-3 py-2.5 outline-none rounded-none focus:border-gold"
            >
              <option value="All">All Shift Types</option>
              <option value="Morning">Morning Rotation</option>
              <option value="Afternoon">Afternoon Rotation</option>
              <option value="Night">Night Rotation</option>
              <option value="Mid-Day">Mid-Day Rotation</option>
            </select>
          </div>
        </div>
      </div>

      {/* Schedule Grid Representation */}
      <div className="bg-white border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar size={16} className="text-gold" />
            <h3 className="text-xs uppercase tracking-wider font-bold text-slate-800">Rotational Matrix Overview</h3>
          </div>
          <span className="text-[9px] font-mono text-slate-400 uppercase tracking-widest bg-slate-50 px-2 py-1">
            Active Week: {new Date().toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} – 2026
          </span>
        </div>

        {/* Schedule List */}
        <div className="divide-y divide-slate-100">
          {filteredShifts.length === 0 ? (
            <div className="py-16 text-center text-slate-400 font-serif italic text-sm">
              No matching schedules configured for the selected criteria.
            </div>
          ) : (
            filteredShifts.map((shift) => (
              <div key={shift.id} className="p-6 hover:bg-slate-50/50 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-700 font-serif italic font-bold">
                      {shift.employeeName.charAt(0)}
                    </div>
                    <div>
                      <h4 className="font-serif italic font-bold text-base text-slate-900">{shift.employeeName}</h4>
                      <p className="text-[10px] font-display uppercase tracking-widest text-[#c5a02d] font-bold">
                        {shift.department}
                      </p>
                    </div>
                  </div>

                  {/* Active Days */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {DAYS_OF_WEEK.map(day => {
                      const isActive = shift.days.includes(day);
                      return (
                        <span 
                          key={day} 
                          className={`text-[8px] font-display uppercase font-bold tracking-widest px-2 py-1 rounded-sm border ${
                            isActive 
                              ? "bg-slate-950 text-white border-slate-950 font-black shadow-sm" 
                              : "bg-slate-50 text-slate-300 border-slate-100"
                          }`}
                        >
                          {day}
                        </span>
                      );
                    })}
                  </div>
                </div>

                <div className="flex flex-col md:items-end gap-2.5">
                  <div className="flex items-center gap-2">
                    <span className={`text-[9px] font-display uppercase tracking-widest font-black px-2.5 py-1 border rounded-sm ${
                      shift.shiftType === "Morning" ? "bg-amber-50 text-amber-700 border-amber-200" :
                      shift.shiftType === "Afternoon" ? "bg-sky-50 text-sky-700 border-sky-200" :
                      shift.shiftType === "Night" ? "bg-purple-50 text-purple-700 border-purple-200" :
                      "bg-slate-50 text-slate-700 border-slate-200"
                    }`}>
                      {shift.shiftType} Shift
                    </span>
                    <span className="text-xs font-mono text-slate-500 bg-slate-50 px-2.5 py-1 border border-slate-100">
                      <Clock size={11} className="inline mr-1 text-slate-400 align-middle" />
                      {shift.hours}
                    </span>
                  </div>
                  {shift.notes && (
                    <p className="text-xs text-slate-600 font-serif italic max-w-sm text-left md:text-right">
                      &ldquo;{shift.notes}&rdquo;
                    </p>
                  )}
                  <button
                    onClick={() => handleDeleteShift(shift.id)}
                    className="text-slate-400 hover:text-red-600 hover:bg-red-50 p-1.5 rounded transition-all transition-colors mt-2 self-start md:self-auto"
                    title="Delete Roster Record"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Add Shift Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
          <div className="bg-white border border-slate-200 w-full max-w-lg p-8 shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b pb-4">
              <h3 className="text-lg font-serif italic font-bold text-slate-900">Configure Personnel Shift</h3>
              <button 
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-900 transition-colors"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleAddShift} className="space-y-4 text-slate-700">
              <div className="space-y-1">
                <label className="text-[10px] font-display uppercase tracking-widest text-slate-400 font-bold block">Employee Name</label>
                <input
                  type="text"
                  required
                  value={newShift.employeeName}
                  onChange={e => setNewShift({...newShift, employeeName: e.target.value})}
                  placeholder="e.g. Savenaca Tabua"
                  className="w-full bg-slate-50 border border-slate-200 px-3 py-2 text-xs outline-none focus:border-gold focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-display uppercase tracking-widest text-slate-400 font-bold block">Department</label>
                  <select
                    value={newShift.department}
                    onChange={e => setNewShift({...newShift, department: e.target.value as any})}
                    className="w-full bg-slate-50 border border-slate-200 px-3 py-2 text-xs outline-none focus:border-gold"
                  >
                    {departmentList.map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-display uppercase tracking-widest text-slate-400 font-bold block">Shift Rotation</label>
                  <select
                    value={newShift.shiftType}
                    onChange={e => {
                      const value = e.target.value;
                      let recommendedHours = "08:00 - 17:00";
                      if (value === "Morning") recommendedHours = "06:00 - 14:00";
                      else if (value === "Afternoon") recommendedHours = "14:00 - 22:00";
                      else if (value === "Night") recommendedHours = "22:00 - 06:00";
                      setNewShift({...newShift, shiftType: value as any, hours: recommendedHours});
                    }}
                    className="w-full bg-slate-50 border border-slate-200 px-3 py-2 text-xs outline-none focus:border-gold"
                  >
                    <option value="Morning">Morning Rotation</option>
                    <option value="Afternoon">Afternoon Rotation</option>
                    <option value="Night">Night Rotation</option>
                    <option value="Mid-Day">Mid-Day Rotation</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-display uppercase tracking-widest text-slate-400 font-bold block">Shift Timings / Hours</label>
                <input
                  type="text"
                  required
                  value={newShift.hours}
                  onChange={e => setNewShift({...newShift, hours: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-200 px-3 py-2 text-xs outline-none focus:border-gold focus:bg-white font-mono"
                />
              </div>

              {/* Day selection */}
              <div className="space-y-2">
                <label className="text-[10px] font-display uppercase tracking-widest text-slate-400 font-bold block">Scheduled Days</label>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {DAYS_OF_WEEK.map(day => {
                    const isSelected = newShift.days.includes(day);
                    return (
                      <button
                        type="button"
                        key={day}
                        onClick={() => handleToggleDay(day)}
                        className={`text-[9px] font-display uppercase tracking-wider px-3 py-1.5 border transition-all ${
                          isSelected 
                            ? "bg-slate-950 text-white border-slate-950 font-black shadow-sm" 
                            : "bg-slate-50 text-slate-400 hover:text-slate-700 border-slate-200"
                        }`}
                      >
                        {day}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-display uppercase tracking-widest text-slate-400 block font-bold">Duty Notes / Handover Orders</label>
                <textarea
                  value={newShift.notes}
                  onChange={e => setNewShift({...newShift, notes: e.target.value})}
                  placeholder="e.g. Carry out public area preventative maintenance checks..."
                  className="w-full bg-slate-50 border border-slate-200 px-3 py-2 text-xs outline-none focus:border-gold focus:bg-white font-serif italic"
                  rows={2}
                />
              </div>

              <div className="flex gap-4 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-display uppercase tracking-widest font-bold transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-slate-950 text-white hover:bg-gold hover:text-white text-[10px] font-display uppercase tracking-widest font-bold transition-all border border-gold/20"
                >
                  Publish Shift
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
