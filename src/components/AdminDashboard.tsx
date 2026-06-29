import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Building, 
  ShieldCheck, 
  AlertCircle, 
  ThumbsUp, 
  CheckCircle2, 
  Clock, 
  ArrowRight, 
  LayoutDashboard, 
  TrendingUp, 
  CheckCircle, 
  Search, 
  ChevronDown, 
  ChevronUp, 
  ExternalLink,
  Sparkles,
  AlertTriangle,
  RefreshCw,
  Lock
} from "lucide-react";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from "recharts";

interface AdminDashboardProps {
  complaints: any[];
  userRole: string | undefined;
  workflowConfig: any;
  currentUser: any;
  onPropertySwitch: (propertyId: string, tabId: string) => void;
  onQuickApproveHOD: (complaint: any) => Promise<void>;
  onQuickApproveSuperAdmin: (complaint: any, name: string, dept: string) => Promise<void>;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  complaints,
  userRole,
  workflowConfig,
  currentUser,
  onPropertySwitch,
  onQuickApproveHOD,
  onQuickApproveSuperAdmin
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedProperty, setExpandedProperty] = useState<string | null>(null);
  const [quickDept, setQuickDept] = useState("Management Operations");
  const [quickAdminName, setQuickAdminName] = useState(currentUser?.displayName || "Executive Leader");
  const [approvingId, setApprovingId] = useState<string | null>(null);

  // 🔒 SECURITY GUARD: Check if user has explicit management credentials.
  // If you want to disable this dashboard completely for EVERYONE, change this to: const isAuthorized = false;
  const isAuthorized = 
    userRole === "Administrator" || 
    userRole === "Super Admin" || 
    userRole === "admin" || 
    workflowConfig?.approverEmails?.includes(currentUser?.email || "");

  // If the user is not authorized, render a secure "Disabled / Access Denied" fallback screen instead of the dashboard data
  if (!isAuthorized) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center px-4">
        <div className="p-4 bg-slate-100 rounded-full text-slate-400 mb-4 border border-slate-200">
          <Lock size={32} />
        </div>
        <h3 className="text-xl font-serif text-slate-950 italic font-medium">Dashboard Access Deactivated</h3>
        <p className="text-xs font-sans text-slate-400 max-w-sm mt-2 leading-relaxed">
          The Executive Boardroom Portal has been restricted or disabled by the platform administrator. If you require operational access matrix privileges, please contact management.
        </p>
      </div>
    );
  }

  // Hardcoded listing of properties managed under the syndicate umbrella
  const PROPERTIES = [
    { id: "cml", name: "Cove Management Limited", location: "CML Headquarters", color: "border-gold text-gold bg-gold/10" },
    { id: "ramada", name: "Ramada Suites Wailoaloa", location: "Wailoaloa Beach", color: "border-red-500 text-red-500 bg-red-500/10" },
    { id: "wyndham", name: "Wyndham Garden Wailoaloa", location: "Wailoaloa Beach Road", color: "border-emerald-500 text-emerald-500 bg-emerald-500/10" }
  ];

  // Derive aggregates for each property
  const propertyMetrics = PROPERTIES.map(prop => {
    const propComplaints = complaints.filter(c => c.propertyId === prop.id);
    const active = propComplaints.filter(c => c.status !== "Resolved" && c.isArchived !== true);
    const resolved = propComplaints.filter(c => c.status === "Resolved" || c.superAdminApproved === true);
    const archived = propComplaints.filter(c => c.isArchived === true);
    
    // Approvals pending
    const pendingHOD = propComplaints.filter(c => !c.hodApproved && c.status !== "Resolved" && c.isArchived !== true);
    const pendingSuper = propComplaints.filter(c => c.hodApproved && !c.superAdminApproved && c.status !== "Resolved" && c.isArchived !== true);
    
    // Urgent priority
    const urgentCount = propComplaints.filter(c => (c.priority === "Urgent" || c.priority === "High") && c.status !== "Resolved" && c.isArchived !== true);

    return {
      ...prop,
      total: propComplaints.length,
      active: active.length,
      resolved: resolved.length,
      archived: archived.length,
      pendingHOD: pendingHOD.length,
      pendingSuper: pendingSuper.length,
      urgent: urgentCount.length,
      resolutionRate: propComplaints.length > 0 
        ? Math.round((resolved.length / propComplaints.length) * 100) 
        : 100,
      rawList: propComplaints
    };
  });

  // Consolidated portfolio-wide metrics
  const totalComplaints = complaints.length;
  const totalActive = complaints.filter(c => c.status !== "Resolved" && c.isArchived !== true).length;
  const totalResolved = complaints.filter(c => c.status === "Resolved" || c.superAdminApproved === true).length;
  const totalPendingHOD = complaints.filter(c => !c.hodApproved && c.status !== "Resolved" && c.isArchived !== true).length;
  const totalPendingSuper = complaints.filter(c => c.hodApproved && !c.superAdminApproved && c.status !== "Resolved" && c.isArchived !== true).length;
  const totalUrgent = complaints.filter(c => (c.priority === "Urgent" || c.priority === "High") && c.status !== "Resolved" && c.isArchived !== true).length;
  
  const overallResolutionPercent = totalComplaints > 0 
    ? Math.round((totalResolved / totalComplaints) * 100) 
    : 100;

  // Chart data for comparing properties
  const chartData = propertyMetrics.map(p => ({
    name: p.id === "cml" ? "CML HQ" : p.id === "ramada" ? "Ramada" : "Wyndham",
    Resolved: p.resolved,
    Active: p.active,
    "Pending HOD": p.pendingHOD,
    "Pending Super": p.pendingSuper
  }));

  // Toggle dynamic sub-table drill down
  const toggleRow = (propertyId: string) => {
    if (expandedProperty === propertyId) {
      setExpandedProperty(null);
    } else {
      setExpandedProperty(propertyId);
    }
  };

  // Check if a complaint requires active user's approval
  const isSecurityApprover = (complaint: any) => {
    const todayStr = new Date().toISOString().split("T")[0];
    const hasActiveDelegation = Array.isArray(workflowConfig?.delegations) && workflowConfig.delegations.some((del: any) => {
      return del.toUserEmail?.toLowerCase() === currentUser?.email?.toLowerCase() && todayStr >= del.startDate && todayStr <= del.endDate;
    });
    const isApproverInConfig = workflowConfig?.approverEmails?.includes(currentUser?.email || "");
    const isHOD = userRole === "Manager" || userRole === "Administrator" || userRole === "Super Admin" || userRole === "admin" || isApproverInConfig || hasActiveDelegation;
    const isSuperAdmin = userRole === "Administrator" || userRole === "Super Admin" || userRole === "admin" || isApproverInConfig;

    const needsHOD = !complaint.hodApproved;
    const needsSuperAdmin = complaint.hodApproved && !complaint.superAdminApproved;

    return (needsHOD && isHOD) || (needsSuperAdmin && isSuperAdmin);
  };

  return (
    <div className="space-y-8 pb-12" id="executive-admin-dashboard">
      {/* Dashboard Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="p-1 px-2.5 rounded-sm bg-gold/10 border border-gold text-[#C5A02D] text-[9px] font-display uppercase tracking-widest font-black flex items-center gap-1 shadow-sm">
              <Sparkles size={10} className="animate-pulse" />
              Syndicate Executive Authority
            </span>
          </div>
          <h2 className="text-4xl font-serif text-slate-900 italic font-medium">Executive Asset Intelligence</h2>
          <p className="luxury-label opacity-60">Consolidated Property Recovery Registry & Boardroom Briefing Portal</p>
        </div>

        {/* Global Quick Action */}
        <div className="bg-white/80 border border-slate-100 p-3 flex items-center gap-4 rounded-sm shadow-sm backdrop-blur-md">
          <p className="text-[10px] font-display uppercase tracking-widest text-slate-400 font-bold">Authorized User:</p>
          <div className="text-right">
            <p className="text-[11px] font-serif italic text-slate-900 font-bold">{currentUser?.displayName || currentUser?.email?.split("@")[0]}</p>
            <p className="text-[8px] font-mono text-[#C5A02D] uppercase tracking-wider">{userRole || "Administrator Scope"}</p>
          </div>
        </div>
      </div>

      {/* Analytics Highlights / Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="bg-white border border-slate-100 p-6 shadow-sm relative overflow-hidden"
        >
          <div className="absolute top-0 left-0 w-1 h-full bg-slate-900" />
          <div className="flex justify-between items-start mb-4">
            <p className="text-[10px] font-display uppercase tracking-widest text-slate-400 font-extrabold">Active Complaints</p>
            <AlertCircle size={16} className="text-slate-900" />
          </div>
          <h3 className="text-4xl font-serif italic font-light text-slate-900 mb-1">{totalActive} <span className="text-xs font-sans not-italic text-slate-400">Cases</span></h3>
          <p className="text-[9px] font-mono text-slate-400 uppercase tracking-wider">Across entire syndicate group</p>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.05 }}
          className="bg-white border border-slate-100 p-6 shadow-sm relative overflow-hidden"
        >
          <div className="absolute top-0 left-0 w-1 h-full bg-[#C5A02D]" />
          <div className="flex justify-between items-start mb-4">
            <p className="text-[10px] font-display uppercase tracking-widest text-slate-400 font-extrabold">Recovery Quality</p>
            <TrendingUp size={16} className="text-[#C5A02D]" />
          </div>
          <h3 className="text-4xl font-serif italic font-light text-slate-900 mb-1">{overallResolutionPercent}%</h3>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <p className="text-[9px] font-mono text-[#C5A02D] uppercase tracking-wider">{totalResolved} of {totalComplaints} Disposed Logs</p>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="bg-white border border-slate-100 p-6 shadow-sm relative overflow-hidden"
        >
          <div className="absolute top-0 left-0 w-1 h-full bg-amber-500" />
          <div className="flex justify-between items-start mb-4">
            <p className="text-[10px] font-display uppercase tracking-widest text-slate-400 font-extrabold">HOD Auth Waiting</p>
            <Clock size={16} className="text-amber-500" />
          </div>
          <h3 className="text-4xl font-serif italic font-light text-slate-900 mb-1">{totalPendingHOD} <span className="text-xs font-sans not-italic text-slate-400">HOD</span></h3>
          <p className="text-[9px] font-mono text-slate-400 uppercase tracking-wider">Awaiting Dept Head clearances</p>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.15 }}
          className="bg-white border border-slate-100 p-6 shadow-sm relative overflow-hidden"
        >
          <div className="absolute top-0 left-0 w-1 h-full bg-rose-600" />
          <div className="flex justify-between items-start mb-4">
            <p className="text-[10px] font-display uppercase tracking-widest text-slate-400 font-extrabold">Executive Clearances</p>
            <ShieldCheck size={16} className="text-rose-600" />
          </div>
          <h3 className="text-4xl font-serif italic font-light text-slate-900 mb-1">{totalPendingSuper} <span className="text-xs font-sans not-italic text-slate-400">GM</span></h3>
          <p className="text-[9px] font-mono text-slate-400 uppercase tracking-wider">Awaiting SuperAdmin/HQ sign-off</p>
        </motion.div>
      </div>

      {/* Main Comparative View */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 bg-white border border-slate-100 shadow-sm p-8">
          <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-100">
            <div>
              <h3 className="text-xl font-serif italic text-slate-900">Syndicate Portfolio Status Map</h3>
              <p className="text-[10px] font-display uppercase tracking-widest text-slate-400 mt-1">Status aggregates mapping across active physical locations</p>
            </div>
            <div className="hidden sm:flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#C5A02D]" />
              <span className="text-[8px] font-display uppercase tracking-widest text-slate-400 font-black">Live Database Proxy Activated</span>
            </div>
          </div>

          <div className="overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-[9px] font-display uppercase tracking-widest text-slate-400 font-black">
                  <th className="py-4">Property Identity</th>
                  <th className="py-4 text-center">Active</th>
                  <th className="py-4 text-center">Resolved</th>
                  <th className="py-4 text-center">HOD Pend</th>
                  <th className="py-4 text-center">GM Pend</th>
                  <th className="py-4 text-center">Urgent</th>
                  <th className="py-4 text-right">Progress</th>
                  <th className="py-4 text-right pr-2">Action</th>
                </tr>
              </thead>
              <tbody>
                {propertyMetrics.map((prop) => {
                  const isExpanded = expandedProperty === prop.id;
                  return (
                    <React.Fragment key={prop.id}>
                      <tr 
                        id={`row-${prop.id}`}
                        className={`border-b border-slate-100 group hover:bg-slate-50/70 transition-all cursor-pointer ${isExpanded ? "bg-slate-50/50" : ""}`}
                        onClick={() => toggleRow(prop.id)}
                      >
                        <td className="py-4">
                          <div className="flex items-center gap-3">
                            <div className={`p-2 border rounded-sm ${prop.color}`}>
                              <Building size={14} />
                            </div>
                            <div>
                              <p className="text-xs font-serif italic font-bold text-slate-900 group-hover:text-[#C5A02D] transition-colors">{prop.name}</p>
                              <p className="text-[8px] font-mono text-slate-400 uppercase tracking-widest">{prop.location}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 text-center font-serif italic text-slate-900 text-xs font-medium">{prop.active}</td>
                        <td className="py-4 text-center">
                          <span className="px-2 py-0.5 bg-emerald-50 text-emerald-800 text-[10px] font-bold border border-emerald-100">{prop.resolved}</span>
                        </td>
                        <td className="py-4 text-center">
                          {prop.pendingHOD > 0 ? (
                            <span className="px-2 py-0.5 bg-amber-50 text-amber-800 text-[10px] font-bold border border-amber-100 animate-pulse">{prop.pendingHOD}</span>
                          ) : (
                            <span className="text-slate-300">-</span>
                          )}
                        </td>
                        <td className="py-4 text-center">
                          {prop.pendingSuper > 0 ? (
                            <span className="px-2 py-0.5 bg-rose-50 text-rose-800 text-[10px] font-bold border border-rose-100">{prop.pendingSuper}</span>
                          ) : (
                            <span className="text-slate-300">-</span>
                          )}
                        </td>
                        <td className="py-4 text-center">
                          {prop.urgent > 0 ? (
                            <span className="px-1.5 py-0.5 bg-red-600 text-white text-[9px] font-bold font-mono">{prop.urgent} URGENT</span>
                          ) : (
                            <span className="text-slate-300">-</span>
                          )}
                        </td>
                        <td className="py-4 text-right">
                          <div>
                            <span className="text-xs font-mono text-slate-900 font-bold">{prop.resolutionRate}%</span>
                            <div className="w-16 h-1 bg-slate-100 rounded-full mt-1 ml-auto overflow-hidden">
                              <div className="h-full bg-[#C5A02D]" style={{ width: `${prop.resolutionRate}%` }} />
                            </div>
                          </div>
                        </td>
                        <td className="py-4 text-right pr-2">
                          <button 
                            type="button"
                            onClick={(e) => { e.stopPropagation(); toggleRow(prop.id); }}
                            className="p-1 hover:text-[#C5A02D] text-slate-400 transition-colors"
                          >
                            {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                          </button>
                        </td>
                      </tr>

                      <AnimatePresence>
                        {isExpanded && (
                          <tr>
                            <td colSpan={8} className="py-0">
                              <motion.div 
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                exit={{ opacity: 0, height: 0 }}
                                className="bg-slate-50/80 px-8 py-6 border-b border-indigo-50/50 space-y-4 overflow-hidden"
                              >
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-3">
                                  <div>
                                    <h4 className="text-xs font-display uppercase tracking-wider text-slate-800 font-black flex items-center gap-2">
                                      <Building size={12} className="text-[#C5A02D]" />
                                      {prop.name} Awaiting Action
                                    </h4>
                                    <p className="text-[9px] text-slate-400 font-mono mt-0.5">Quick oversight panel for pending approvals & urgent incidents</p>
                                  </div>
                                  <div className="flex flex-wrap items-center gap-3">
                                    <button
                                      onClick={() => onPropertySwitch(prop.id, "guest-recovery")}
                                      className="luxury-button !px-4 !py-2 text-[8px] uppercase tracking-widest font-black flex items-center gap-2 group cursor-pointer"
                                    >
                                      Go to Recovery Console <ExternalLink size={10} />
                                    </button>
                                  </div>
                                </div>

                                <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                                  {prop.rawList.filter(c => c.status !== "Resolved" && c.isArchived !== true).length === 0 ? (
                                    <div className="py-4 text-center text-slate-400 text-xs font-serif italic">
                                      ✓ Perfect Record: No pending approvals or active complaints for this property asset.
                                    </div>
                                  ) : (
                                    prop.rawList
                                      .filter(c => c.status !== "Resolved" && c.isArchived !== true)
                                      .map((complaint: any) => {
                                        const isHODApprovalPending = !complaint.hodApproved;
                                        const isSuperApprovalPending = complaint.hodApproved && !complaint.superAdminApproved;
                                        const myAuthorizationRequired = isSecurityApprover(complaint);
                                        const isActioning = approvingId === complaint.id;

                                        return (
                                          <div key={complaint.id} className="bg-white border border-slate-200 rounded-sm p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:border-[#C5A02D]/30 transition-all shadow-sm">
                                            <div className="space-y-1">
                                              <div className="flex items-center gap-2 flex-wrap">
                                                <span className={`text-[8px] font-mono font-bold uppercase px-1.5 py-0.5 ${complaint.priority === 'Urgent' || complaint.priority === 'High' ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-slate-100 text-slate-600'}`}>{complaint.priority} Priority</span>
                                                <span className="text-[10px] font-serif italic font-bold text-slate-900">Room {complaint.roomNumber || "N/A"} • {complaint.guestName || "Guest"}</span>
                                              </div>
                                              <p className="text-xs text-slate-600 font-serif italic max-w-xl line-clamp-1">"{complaint.description}"</p>
                                              <div className="flex items-center gap-8 text-[8px] font-mono text-slate-400 uppercase tracking-widest pt-1 flex-wrap">
                                                <span>Reported: {complaint.createdAt ? (complaint.createdAt.seconds ? new Date(complaint.createdAt.seconds * 1000).toLocaleString() : new Date(complaint.createdAt).toLocaleString()) : "Recently"}</span>
                                                <span>Status: <strong className="text-amber-600 font-bold">{complaint.status}</strong></span>
                                                {complaint.hodApproved && <span className="text-emerald-600 font-bold">✓ HOD Approved ({complaint.hodApprovedBy})</span>}
                                              </div>
                                            </div>

                                            <div className="flex items-center gap-3 shrink-0 self-end md:self-center">
                                              {myAuthorizationRequired ? (
                                                <div className="flex flex-col sm:flex-row items-end sm:items-center gap-2">
                                                  {isSuperApprovalPending && (
                                                    <div className="flex gap-2">
                                                      <input
                                                        type="text"
                                                        value={quickDept}
                                                        onChange={(e) => setQuickDept(e.target.value)}
                                                        placeholder="Dept Name"
                                                        className="bg-slate-50 border border-slate-200 px-2 py-1 text-[9px] font-serif italic w-24 focus:border-gold outline-none"
                                                      />
                                                      <input
                                                        type="text"
                                                        value={quickAdminName}
                                                        onChange={(e) => setQuickAdminName(e.target.value)}
                                                        placeholder="Admin Name"
                                                        className="bg-slate-50 border border-slate-200 px-2 py-1 text-[9px] font-serif italic w-24 focus:border-gold outline-none"
                                                      />
                                                    </div>
                                                  )}
                                                  <button
                                                    disabled={isActioning}
                                                    onClick={async (e) => {
                                                      e.stopPropagation();
                                                      setApprovingId(complaint.id);
                                                      try {
                                                        if (isHODApprovalPending) {
                                                          await onQuickApproveHOD({ ...complaint, propertyId: prop.id });
                                                        } else {
                                                          if (!quickDept || !quickAdminName) {
                                                            alert("Please supply sign-off department & authorized name");
                                                            setApprovingId(null);
                                                            return;
                                                          }
                                                          await onQuickApproveSuperAdmin({ ...complaint, propertyId: prop.id }, quickAdminName, quickDept);
                                                        }
                                                      } catch (err) {
                                                        console.error(err);
                                                      } finally {
                                                        setApprovingId(null);
                                                      }
                                                    }}
                                                    className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white text-[9px] font-display uppercase tracking-widest font-black transition-all cursor-pointer shadow-sm flex items-center gap-1.5"
                                                  >
                                                    {isActioning ? <RefreshCw size={10} className="animate-spin" /> : isHODApprovalPending ? "✓ Appr. HOD" : "✓ Appr. GM Signoff"}
                                                  </button>
                                                </div>
                                              ) : (
                                                <div className="flex items-center gap-1.5">
                                                  <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                                                  <span className="text-[8px] font-display uppercase tracking-widest text-slate-400 font-bold">Cleared Awaiting Others</span>
                                                </div>
                                              )}
                                            </div>
                                          </div>
                                        );
                                      })
                                  )}
                                </div>
                              </motion.div>
                            </td>
                          </tr>
                        )}
                      </AnimatePresence>
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Visualized Charts using Recharts */}
        <div className="lg:col-span-4 bg-white border border-slate-100 shadow-sm p-8 flex flex-col">
          <div className="border-b border-slate-100 pb-4 mb-6">
            <h3 className="text-xl font-serif italic text-slate-900">Statistical Analysis</h3>
            <p className="text-[10px] font-display uppercase tracking-widest text-slate-400 mt-1">Properties unresolved vs resolved comparison</p>
          </div>

          <div className="h-64 w-full flex-1 min-h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 10, fontFamily: 'monospace' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#64748b', fontSize: 9, fontFamily: 'monospace' }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '2px', color: '#fff', fontSize: '10px', fontFamily: 'monospace' }} />
                <Legend wrapperStyle={{ fontSize: '9px', fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: '1px' }} verticalAlign="bottom" height={36} />
                <Bar dataKey="Resolved" fill="#10b981" radius={[2, 2, 0, 0]} />
                <Bar dataKey="Active" fill="#f59e0b" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-6 p-4 bg-slate-50 border border-slate-100 space-y-2">
            <div className="flex items-center gap-2">
              <AlertTriangle size={14} className="text-amber-500 shrink-0" />
              <span className="text-[9px] font-display uppercase tracking-widest text-slate-950 font-black">Escalation Audit Warning</span>
            </div>
            <p className="text-[10px] font-serif italic text-slate-500 leading-relaxed">
              Consolidated portfolio analysis shows that {totalPendingHOD + totalPendingSuper} cases are currently bottle-necked in approvals. Direct action on table drill-downs is advised immediately.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};