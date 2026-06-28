import React, { useState, useEffect } from "react";
import { 
  Activity, 
  Database, 
  Wifi, 
  WifiOff, 
  RefreshCw, 
  CheckCircle, 
  AlertCircle, 
  ChevronDown,
  Shield,
  ActivitySquare
} from "lucide-react";
import { auth, db, forceSyncNow } from "../lib/firebase";
import { SyncEventLog } from "./SyncEventLog";

interface SystemDiagnosticsProps {
  complaintsCount: number;
  complaintsError: string | null;
  onForceResync?: () => void;
  lastComplaintsSnapshotTime?: Date | null;
  lastNewsSnapshotTime?: Date | null;
  selectedCompany?: string | null;
}

export const SystemDiagnostics: React.FC<SystemDiagnosticsProps> = ({
  complaintsCount,
  complaintsError,
  onForceResync,
  lastComplaintsSnapshotTime,
  lastNewsSnapshotTime,
  selectedCompany
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoggerOpen, setIsLoggerOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [lastSyncTime, setLastSyncTime] = useState<string>(new Date().toLocaleTimeString());

  // Detect genuine browser online state
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const activeMode = auth.getMode(); // 'real' or 'mock'
  const isUsingLiveFirebase = activeMode === "real" && !db._isMock;
  
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await forceSyncNow();
    if (onForceResync) {
      onForceResync();
    }
    setTimeout(() => {
      setIsRefreshing(false);
      setLastSyncTime(new Date().toLocaleTimeString());
    }, 1000);
  };

  return (
    <div className="relative font-sans text-slate-700">
      {/* Real-time Status Badge in Header */}
      <button
        id="sys-diagnostics-badge-btn"
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-1.5 md:gap-2 px-2.5 py-1.5 border rounded-none transition-all duration-200 cursor-pointer shadow-sm active:scale-95 ${
          complaintsError
            ? "border-red-200 bg-red-50 text-red-700 hover:bg-red-100"
            : !isOnline
            ? "border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100"
            : "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
        }`}
        title="View System Connection Diagnostics & Force Sync"
      >
        <span className="relative flex h-2 w-2 shrink-0">
          <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
            complaintsError 
              ? "bg-red-400" 
              : !isOnline 
              ? "bg-amber-400" 
              : "bg-emerald-400"
          }`}></span>
          <span className={`relative inline-flex rounded-full h-2 w-2 ${
            complaintsError 
              ? "bg-red-600" 
              : !isOnline 
              ? "bg-amber-600" 
              : "bg-emerald-600"
          }`}></span>
        </span>

        <Activity size={13} className={`${isRefreshing ? "animate-spin text-gold" : "text-slate-500"}`} />
        
        <span className="text-[10px] uppercase tracking-wider font-semibold hidden md:inline">
          {complaintsError 
            ? "Sync Blocked" 
            : !isOnline 
            ? "Offline Buffering" 
            : "Live Sync Connected"
          }
        </span>
        <ChevronDown size={12} className="text-slate-400" />
      </button>

      {/* Diagnostics Dropdown Menu */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            id="sys-diagnostics-backdrop"
            className="fixed inset-0 z-40 cursor-default" 
            onClick={() => setIsOpen(false)} 
          />
          
          <div 
            id="sys-diagnostics-dropdown"
            className="absolute right-0 mt-2 w-72 md:w-80 bg-white border border-slate-200 shadow-xl z-50 p-4 transition-all animate-in fade-in slide-in-from-top-2 duration-150 rounded-none transform origin-top-right"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-3">
              <div className="flex items-center gap-2">
                <ActivitySquare size={16} className="text-gold" />
                <h3 className="text-xs uppercase tracking-wider font-black text-slate-900 font-display">
                  System Diagnostics
                </h3>
              </div>
              <span className="text-[9px] font-mono text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded-sm">
                v1.2-LiveBridges
              </span>
            </div>

            {/* General Health Indicators */}
            <div className="space-y-2.5 text-xs">
              {/* Online State */}
              <div className="flex items-center justify-between px-1">
                <span className="text-slate-500 flex items-center gap-1.5">
                  {isOnline ? <Wifi size={14} className="text-emerald-500" /> : <WifiOff size={14} className="text-red-500" />}
                  Internet Gateway
                </span>
                <span className={`font-semibold ${isOnline ? "text-emerald-600" : "text-red-600"}`}>
                  {isOnline ? "Connected" : "Offline / Broken"}
                </span>
              </div>

              {/* Firestore Operational Mode */}
              <div className="flex items-center justify-between px-1">
                <span className="text-slate-500 flex items-center gap-1.5">
                  <Database size={14} className="text-slate-400" />
                  Firestore Bridge
                </span>
                <div className="flex flex-col items-end">
                  <span className="font-semibold uppercase text-[10px] px-1.5 py-0.5 bg-gold/10 text-slate-800 border border-gold/20">
                    SANDBOX ACTIVE
                  </span>
                </div>
              </div>

              {/* Collections Status */}
              <div className="border-t border-slate-100 pt-2.5 my-2">
                <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold mb-1.5">
                  Collection Subscriptions
                </p>
                <div className="bg-slate-50 p-2 space-y-1.5 font-mono text-[10px]">
                  {/* Selected property info */}
                  <div className="flex flex-col border-b border-slate-200/50 pb-2 mb-2 text-[10px]">
                    <div className="flex justify-between text-slate-400 uppercase tracking-widest font-bold text-[9px] mb-1">
                      <span>Active Hotel Property:</span>
                    </div>
                    <span className="text-slate-800 font-bold font-sans text-xs">
                      {selectedCompany === "wyndham" 
                        ? "Wyndham Garden Fiji (Wailoaloa Beach)" 
                        : selectedCompany === "ramada" 
                        ? "Ramada Suites Wailoaloa" 
                        : "CML Corporate Headquarters"
                      }
                    </span>
                    <span className="text-[9px] text-slate-400 font-mono mt-0.5">ID: {selectedCompany || "cml"}</span>
                  </div>

                  {/* Complaints Collections */}
                  <div className="flex flex-col gap-0.5">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-600 font-semibold">complaints-{selectedCompany || "cml"}</span>
                      <span className={`${isOnline ? "text-emerald-600" : "text-amber-600"} flex items-center gap-1 text-[9px] font-semibold`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${isOnline ? "bg-emerald-500 animate-pulse" : "bg-amber-500"}`}></span>
                        {isOnline ? "Receiving Live" : "Buffered"}
                      </span>
                    </div>
                    <div className="flex justify-between text-[9px] text-slate-400 mt-0.5">
                      <span>Last Snapshot Receipt:</span>
                      <span className="font-bold text-slate-700">
                        {lastComplaintsSnapshotTime 
                          ? lastComplaintsSnapshotTime.toLocaleDateString() + " " + lastComplaintsSnapshotTime.toLocaleTimeString()
                          : "Connecting..."
                        }
                      </span>
                    </div>
                  </div>

                  {/* Daily News Collections */}
                  <div className="flex flex-col gap-0.5 pt-2 mt-2 border-t border-slate-150">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-600 font-semibold">daily-news (Noticeboard)</span>
                      <span className={`${isOnline ? "text-emerald-600" : "text-amber-600"} flex items-center gap-1 text-[9px] font-semibold`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${isOnline ? "bg-emerald-500 animate-pulse" : "bg-amber-500"}`}></span>
                        {isOnline ? "Receiving Live" : "Buffered"}
                      </span>
                    </div>
                    <div className="flex justify-between text-[9px] text-slate-400 mt-0.5">
                      <span>Last Snapshot Receipt:</span>
                      <span className="font-bold text-slate-700">
                        {lastNewsSnapshotTime 
                          ? lastNewsSnapshotTime.toLocaleDateString() + " " + lastNewsSnapshotTime.toLocaleTimeString()
                          : "Connecting..."
                        }
                      </span>
                    </div>
                  </div>

                  {/* Cache info */}
                  <div className="flex items-center justify-between pt-1.5 border-t border-slate-200/60 mt-1.5 text-[9px]">
                    <span className="text-slate-500">Active Records:</span>
                    <span className="font-semibold text-slate-700">{complaintsCount} logs</span>
                  </div>
                </div>
              </div>

              {/* Error Log Panel */}
              {complaintsError && (
                <div className="bg-red-50 border border-red-100 p-2 text-red-700 rounded-sm text-[11px] leading-relaxed flex gap-2">
                  <AlertCircle size={14} className="shrink-0 text-red-500 mt-0.5" />
                  <div>
                    <span className="font-bold block">Permission / Sync Issue</span>
                    {complaintsError}
                  </div>
                </div>
              )}

              {/* Educational Explanation block (Why it fallbacks) */}
              {!isUsingLiveFirebase && (
                <div className="bg-gold/5 border border-gold/20 p-2.5 text-[11px] leading-relaxed text-slate-600">
                  <div className="font-bold text-slate-900 flex items-center gap-1 mb-1">
                    <Shield size={12} className="text-gold" />
                    Offline Sandbox Safety-Valve
                  </div>
                  Our system maintains a corporate offline sandbox so that you never lose data on bad connections or disabled auth! All data is saved on this terminal and synced back once live authority replies.
                </div>
              )}

              {/* Footer Sync Actions */}
              <div className="border-t border-slate-100 pt-3 flex items-center justify-between mt-3 text-[11px]">
                <div className="text-slate-400 font-mono">
                  Sync: {lastSyncTime}
                </div>
                <button
                  id="sys-diagnostics-sync-now-btn"
                  onClick={handleRefresh}
                  disabled={isRefreshing}
                  className="px-3 py-1 bg-slate-900 text-white font-medium hover:bg-gold transition-colors flex items-center gap-1 cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw size={11} className={isRefreshing ? "animate-spin" : ""} />
                  {isRefreshing ? "Refreshing..." : "Force Sync Now"}
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* SyncEventLog Modal */}
      <SyncEventLog isOpen={isLoggerOpen} onClose={() => setIsLoggerOpen(false)} />
    </div>
  );
};
