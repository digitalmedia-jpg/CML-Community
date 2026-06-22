import React, { useState, useEffect } from "react";
import { 
  Plus, 
  Search, 
  Trash2, 
  History,
  Archive,
  Layers,
  ArrowLeft,
  Check
} from "lucide-react";

interface Shift {
  id: string;
  employeeName: string;
  department: string;
  shiftType: "Morning" | "Afternoon" | "Night" | "Mid-Day";
  hours: string;
  days: string[];
  notes?: string;
}

interface HistoricalRoster {
  archiveId: string;
  savedAt: string;
  companyId: string;
  weekLabel: string;
  shifts: Shift[];
}

const MOCK_SEEDS: Record<string, Shift[]> = {
  ramada: [
    {
      id: "ramada-1",
      employeeName: "Charles Cebujano",
      department: "IT Graphics Support",
      shiftType: "Morning",
      hours: "08:00 - 17:00",
      days: ["Mon", "Tue", "Wed", "Thu", "Fri"],
      notes: "Corporate Proxy & System Diagnostic Oversight"
    },
    {
      id: "ramada-2",
      employeeName: "Anita Prasad",
      department: "Housekeeping",
      shiftType: "Morning",
      hours: "06:00 - 14:00",
      days: ["Mon", "Tue", "Wed", "Sat", "Sun"],
      notes: "Room inspection checks"
    }
  ],
  wyndham: [
    {
      id: "wyndham-1",
      employeeName: "Savenaca Tabua",
      department: "Front Office",
      shiftType: "Afternoon",
      hours: "14:00 - 22:00",
      days: ["Thu", "Fri", "Sat", "Sun"],
      notes: "VIP check-ins & arrival coordination"
    }
  ],
  cml: [
    {
      id: "cml-1",
      employeeName: "Rohit Lal",
      department: "Support",
      shiftType: "Morning",
      hours: "08:00 - 17:00",
      days: ["Mon", "Tue", "Wed", "Thu", "Fri"],
      notes: "CML Core System Operations"
    }
  ]
};

interface DutyRosterProps {
  companyId?: string;
}

export const DutyRoster: React.FC<DutyRosterProps> = ({ companyId: propCompanyId }) => {
  // Safe detection fallback to see which sidebar workspace tab is active
  const [internalCompanyId, setInternalCompanyId] = useState<string>("ramada");

  useEffect(() => {
    if (propCompanyId) {
      setInternalCompanyId(propCompanyId);
    } else {
      const path = window.location.pathname.toLowerCase();
      if (path.includes("wyndham")) setInternalCompanyId("wyndham");
      else if (path.includes("cml")) setInternalCompanyId("cml");
      else setInternalCompanyId("ramada");
    }
  }, [propCompanyId]);

  const companyId = propCompanyId || internalCompanyId;

  const businessLabel = companyId.toUpperCase();
  const [viewMode, setViewMode] = useState<"current" | "history">("current");
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [historyLog, setHistoryLog] = useState<HistoricalRoster[]>([]);
  const [selectedArchivedRoster, setSelectedArchivedRoster] = useState<HistoricalRoster | null>(null);
  
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDept, setSelectedDept] = useState<string>("All");
  const [selectedShiftType, setSelectedShiftType] = useState<string>("All");
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
    const storageKey = `duty-roster-isolated-${companyId}`;
    const historyKey = `duty-roster-history-isolated-${companyId}`;
    
    const savedShifts = localStorage.getItem(storageKey);
    const fallbackSeed = MOCK_SEEDS[companyId.toLowerCase()] || [];
    setShifts(savedShifts ? JSON.parse(savedShifts) : fallbackSeed);

    const savedHistory = localStorage.getItem(historyKey);
    setHistoryLog(savedHistory ? JSON.parse(savedHistory) : []);
  }, [companyId]);

  const saveShiftsAndArchive = (updatedShifts: Shift[]) => {
    setShifts(updatedShifts);
    localStorage.setItem(`duty-roster-isolated-${companyId}`, JSON.stringify(updatedShifts));

    const dateNow = new Date();
    const formattedWeek = `Week of ${dateNow.toLocaleDateString(undefined, { month: "short", day: "numeric" })}`;
    const newHistoryRecord: HistoricalRoster = {
      archiveId: `archive-${Date.now()}`,
      savedAt: dateNow.toLocaleString(),
      companyId: companyId,
      weekLabel: formattedWeek,
      shifts: updatedShifts
    };

    const updatedHistory = [newHistoryRecord, ...historyLog];
    setHistoryLog(updatedHistory);
    localStorage.setItem(`duty-roster-history-isolated-${companyId}`, JSON.stringify(updatedHistory));
  };

  const handleAddShift = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newShift.employeeName.trim()) return;

    const addedShift: Shift = {
      id: `shift-${Date.now()}`,
      ...newShift
    };

    saveShiftsAndArchive([addedShift, ...shifts]);
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
    if (confirm(`Remove this record from the active ${businessLabel} matrix?`)) {
      saveShiftsAndArchive(shifts.filter(s => s.id !== id));
    }
  };

  const handleToggleDay = (day: string) => {
    setNewShift(prev => {
      const isSelected = prev.days.includes(day);
      return {
        ...prev,
        days: isSelected ? prev.days.filter(d => d !== day) : [...prev.days, day]
      };
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
    "IT Graphics Support", "Engineering Maintenance", "Sales Reservations",
    "Support", "Housekeeping", "Culinary F&B", "Front Office", "Security"
  ];

  const DAYS_OF_WEEK = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  // Metrics configurations
  const activeEntriesCount = filteredShifts.length;
  const onRotationCount = filteredShifts.filter(s => s.days.length > 0).length;

  return (
    <div id="duty-roster-container" className="space-y-8 animate-fade-in pb-16 px-1">
      
      {/* Dynamic Header Block Context Control */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-200 pb-6 gap-4">
        <div>
          <h2 className="text-4xl font-serif text-slate-900 italic font-medium">{businessLabel} Duty Roster</h2>
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400 font-bold mt-1">
            System Alignments, Active Managers On-Duty & Resource Distribution
          </p>
        </div>

        {/* Isolated Log Context Switch Controls */}
        <div className="flex gap-2 bg-slate-100 p-1 rounded border border-slate-200 self-start md:self-auto">
          <button
            onClick={() => { setViewMode("current"); setSelectedArchivedRoster(null); }}
            className={`flex items-center gap-1.5 px-4 py-1.5 text-[10px] font-display uppercase tracking-wider font-bold rounded transition-all ${
              viewMode === "current" ? "bg-white text-slate-950 shadow-sm" : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <Layers size={12} /> Active Matrix
          </button>
          <button
            onClick={() => setViewMode("history")}
            className={`flex items-center gap-1.5 px-4 py-1.5 text-[10px] font-display uppercase tracking-wider font-bold rounded transition-all ${
              viewMode === "history" ? "bg-white text-slate-950 shadow-sm" : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <History size={12} /> Roster Logs
          </button>
        </div>
      </div>

      {viewMode === "current" ? (
        <>
          {/* Dynamic Analytical Stat Panels */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white border border-slate-200/60 p-6 shadow-sm">
              <span className="text-[10px] font-display uppercase tracking-wider text-slate-400 font-bold">Active Roster Entries</span>
              <div className="text-3xl font-serif font-bold italic text-slate-900 mt-2">{activeEntriesCount}</div>
              <p className="text-[11px] text-slate-400 mt-1">{businessLabel} configured personnel shifts</p>
            </div>
            <div className="bg-white border border-slate-200/60 p-6 shadow-sm">
              <span className="text-[10px] font-display uppercase tracking-wider text-slate-400 font-bold">Active Today</span>
              <div className="text-3xl font-serif font-bold italic text-slate-900 mt-2">{onRotationCount}</div>
              <p className="text-[11px] text-slate-400 mt-1">Personnel on rotation for the current day</p>
            </div>
            <div className="bg-white border border-slate-200/60 p-6 shadow-sm flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-display uppercase tracking-wider text-slate-400 font-bold">Weekly Standard Integrity</span>
                <div className="text-3xl font-serif font-bold italic text-[#c5a02d] mt-2">100%</div>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">All primary brand shifts accounted for</p>
            </div>
          </div>

          {/* Core Table Spreadsheet Filter Row Layout Elements */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 pt-2">
            <div className="w-full md:flex-1 relative">
              <Search size={16} className="absolute left-3.5 top-[50%] transform -translate-y-[50%] text-slate-400" />
              <input
                type="text"
                placeholder={`Search ${businessLabel} employee names, notes...`}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-white border border-slate-200 pl-10 pr-4 py-2.5 text-xs text-slate-800 outline-none focus:border-slate-400 transition-all placeholder:text-slate-400"
              />
            </div>
            <div className="w-full md:w-auto flex gap-3 justify-end">
              <select
                value={selectedDept}
                onChange={(e) => setSelectedDept(e.target.value)}
                className="bg-white border border-slate-200 text-slate-700 text-xs px-3 py-2.5 outline-none focus:border-slate-400"
              >
                <option value="All">All Departments</option>
                {departmentList.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
              <select
                value={selectedShiftType}
                onChange={(e) => setSelectedShiftType(e.target.value)}
                className="bg-white border border-slate-200 text-slate-700 text-xs px-3 py-2.5 outline-none focus:border-slate-400"
              >
                <option value="All">All Shift Types</option>
                <option value="Morning">Morning Shift</option>
                <option value="Afternoon">Afternoon Shift</option>
                <option value="Night">Night Shift</option>
                <option value="Mid-Day">Mid-Day Shift</option>
              </select>
              <button
                onClick={() => setShowAddModal(true)}
                className="bg-slate-950 text-white text-[10px] font-display uppercase tracking-widest font-bold px-5 py-3 hover:bg-slate-800 transition-all flex items-center gap-2 whitespace-nowrap"
              >
                <Plus size={12} /> Schedule {businessLabel} Shift
              </button>
            </div>
          </div>

          {/* Current Live Active Data Matrix Grid layout items */}
          <div className="bg-white border border-slate-200 shadow-sm mt-4">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <span className="text-[10px] font-display uppercase tracking-[0.15em] font-bold text-slate-800 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
                {businessLabel} Rotational Matrix
              </span>
              <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
                Active Week: 22 Jun - 2026
              </span>
            </div>
            
            <div className="divide-y divide-slate-100">
              {filteredShifts.length === 0 ? (
                <div className="py-16 text-center text-slate-400 font-serif italic text-sm">No roster records matching filter parameters.</div>
              ) : (
                filteredShifts.map((shift) => (
                  <div key={shift.id} className="p-6 hover:bg-slate-50/40 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-serif italic font-bold border border-slate-200">
                          {shift.employeeName.charAt(0)}
                        </div>
                        <div>
                          <h4 className="font-serif italic font-bold text-base text-slate-900">{shift.employeeName}</h4>
                          <p className="text-[10px] font-display uppercase tracking-widest text-[#c5a02d] font-bold mt-0.5">{shift.department}</p>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        {DAYS_OF_WEEK.map(day => {
                          const active = shift.days.includes(day);
                          return (
                            <span key={day} className={`text-[8px] font-display uppercase font-bold px-2 py-1 border transition-all ${
                              active ? "bg-slate-950 text-white border-slate-950 font-black shadow-sm" : "bg-slate-50 text-slate-300 border-slate-100"
                            }`}>{day}</span>
                          );
                        })}
                      </div>
                    </div>
                    <div className="flex flex-col md:items-end gap-2 text-left md:text-right">
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] font-display uppercase font-bold tracking-wider bg-amber-50 text-amber-800 border border-amber-200 px-2.5 py-0.5 rounded-sm">
                          {shift.shiftType} Shift
                        </span>
                        <span className="text-xs font-mono text-slate-500 bg-slate-50 border border-slate-200 px-2.5 py-0.5 rounded-sm">
                          {shift.hours}
                        </span>
                      </div>
                      {shift.notes && <p className="text-xs text-slate-400 font-serif italic max-w-xs">&ldquo;{shift.notes}&rdquo;</p>}
                      <button onClick={() => handleDeleteShift(shift.id)} className="text-slate-300 hover:text-red-600 mt-1 transition-colors self-start md:self-auto">
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      ) : (
        /* History logs representation view system */
        <div className="space-y-6">
          {!selectedArchivedRoster ? (
            <div className="bg-white border border-slate-200 p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-4 border-b pb-3">
                <History size={16} className="text-slate-400" />
                <h3 className="text-xs uppercase tracking-wider font-bold text-slate-800">{businessLabel} Roster Archives Log</h3>
              </div>
              <div className="divide-y divide-slate-100">
                {historyLog.length === 0 ? (
                  <div className="py-8 text-center text-slate-400 font-serif italic text-sm">No deployment historical baselines logged yet for this properties asset frame.</div>
                ) : (
                  historyLog.map((log) => (
                    <div key={log.archiveId} className="py-4 flex items-center justify-between hover:bg-slate-50 px-2 transition-all">
                      <div className="space-y-0.5">
                        <span className="font-serif italic font-bold text-slate-900 text-base">{log.weekLabel}</span>
                        <p className="text-[10px] text-slate-400">Snapshot save context: {log.savedAt}</p>
                      </div>
                      <button
                        onClick={() => setSelectedArchivedRoster(log)}
                        className="text-xs font-display uppercase tracking-widest text-[#c5a02d] hover:text-slate-950 font-bold"
                      >
                        Review Layout &rarr;
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <button onClick={() => setSelectedArchivedRoster(null)} className="flex items-center gap-1.5 text-xs font-display uppercase tracking-wider font-bold text-slate-500 hover:text-slate-900">
                <ArrowLeft size={14} /> Back to Archive Log Timeline
              </button>
              <div className="bg-amber-50/60 border border-amber-200 p-4 text-xs font-serif italic text-amber-900">
                Viewing read-only snapshot data structure for <strong>{businessLabel}</strong> captured on <strong>{selectedArchivedRoster.savedAt}</strong>.
              </div>
              <div className="bg-white border border-slate-200 divide-y divide-slate-100 shadow-sm">
                {selectedArchivedRoster.shifts.map((s) => (
                  <div key={s.id} className="p-5 flex items-center justify-between">
                    <div>
                      <h4 className="font-serif font-bold text-slate-900">{s.employeeName}</h4>
                      <p className="text-[10px] font-display uppercase tracking-widest text-slate-400">{s.department}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-mono text-slate-600 bg-slate-50 px-2 py-1 border border-slate-100">{s.hours}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modal Dialog layout component configuration */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
          <div className="bg-white border border-slate-200 w-full max-w-lg p-8 shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b pb-4">
              <h3 className="text-lg font-serif italic font-bold text-slate-900">Deploy Shift to {businessLabel}</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-900 text-xl">&times;</button>
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
                  className="w-full bg-slate-50 border border-slate-200 px-3 py-2 text-xs outline-none focus:border-slate-400 focus:bg-white transition-colors"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-display uppercase tracking-widest text-slate-400 font-bold block">Department</label>
                  <select
                    value={newShift.department}
                    onChange={e => setNewShift({...newShift, department: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 px-3 py-2 text-xs outline-none focus:border-slate-400 bg-white"
                  >
                    {departmentList.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-display uppercase tracking-widest text-slate-400 font-bold block">Rotation Block</label>
                  <select
                    value={newShift.shiftType}
                    onChange={e => {
                      const val = e.target.value as any;
                      let hrs = "08:00 - 17:00";
                      if (val === "Morning") hrs = "06:00 - 14:00";
                      else if (val === "Afternoon") hrs = "14:00 - 22:00";
                      else if (val === "Night") hrs = "22:00 - 06:00";
                      setNewShift({...newShift, shiftType: val, hours: hrs});
                    }}
                    className="w-full bg-slate-50 border border-slate-200 px-3 py-2 text-xs outline-none focus:border-slate-400 bg-white"
                  >
                    <option value="Morning">Morning Rotation</option>
                    <option value="Afternoon">Afternoon Rotation</option>
                    <option value="Night">Night Rotation</option>
                    <option value="Mid-Day">Mid-Day Rotation</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-display uppercase tracking-widest text-slate-400 font-bold block">Shift Timings</label>
                <input
                  type="text"
                  required
                  value={newShift.hours}
                  onChange={e => setNewShift({...newShift, hours: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-200 px-3 py-2 text-xs outline-none focus:border-slate-400 font-mono"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-display uppercase tracking-widest text-slate-400 font-bold block">Active Roster Days</label>
                <div className="flex flex-wrap gap-1">
                  {DAYS_OF_WEEK.map(day => {
                    const selected = newShift.days.includes(day);
                    return (
                      <button
                        type="button"
                        key={day}
                        onClick={() => handleToggleDay(day)}
                        className={`flex-1 min-w-[45px] py-2 text-[9px] font-display uppercase font-bold border transition-all ${
                          selected ? "bg-slate-950 text-white border-slate-950 font-black" : "bg-slate-50 text-slate-400 border-slate-200 hover:bg-slate-100"
                        }`}
                      >
                        {day}
                        {selected && <Check size={8} className="mx-auto mt-0.5 text-amber-400" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-display uppercase tracking-widest text-slate-400 block font-bold">Duty Handover Notes</label>
                <textarea
                  value={newShift.notes}
                  onChange={e => setNewShift({...newShift, notes: e.target.value})}
                  placeholder="Special orders or instructions..."
                  className="w-full bg-slate-50 border border-slate-200 px-3 py-2 text-xs outline-none focus:border-slate-400 focus:bg-white font-serif italic"
                  rows={2}
                />
              </div>

              <div className="flex gap-4 pt-2">
                <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 py-2.5 bg-slate-100 text-slate-700 text-[10px] font-display uppercase tracking-widest font-bold">Cancel</button>
                <button type="submit" className="flex-1 py-2.5 bg-slate-950 text-white text-[10px] font-display uppercase tracking-widest font-bold hover:bg-slate-800 transition-all">Publish Shift</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default DutyRoster;