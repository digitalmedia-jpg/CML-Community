import { ConfirmModal } from "./ConfirmModal";
import React, { useState, useEffect } from "react";
import { 
  X, 
  Trash2, 
  Filter, 
  Database, 
  Flame, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  RefreshCw,
  Clock,
  ExternalLink,
  Shield,
  Search,
  CheckCircle,
  AlertCircle
} from "lucide-react";
import { syncLogger, SyncEvent } from "../lib/syncLogger";

interface SyncEventLogProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SyncEventLog: React.FC<SyncEventLogProps> = ({ isOpen, onClose }) => {
  const [events, setEvents] = useState<SyncEvent[]>([]);
  const [statusFilter, setStatusFilter] = useState<'all' | 'success' | 'failure' | 'pending'>('all');
  const [searchQuery, setSearchQuery] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    
    // Subscribe to real-time events from the logger
    const unsubscribe = syncLogger.subscribe((updatedEvents) => {
      setEvents(updatedEvents);
    });

    return () => unsubscribe();
  }, [isOpen]);

  if (!isOpen) return null;

  const handleClearAll = () => {
    setShowClearConfirm(true);
  };

  const handleClearConfirm = () => {
    syncLogger.clearEvents();
    setEvents([]);
    setShowClearConfirm(false);
  };

  const handleManualRefresh = () => {
    setIsRefreshing(true);
    setEvents(syncLogger.getEvents());
    setTimeout(() => {
      setIsRefreshing(false);
    }, 600);
  };

  // Filter events
  const filteredEvents = events.filter(evt => {
    const matchesStatus = statusFilter === 'all' || evt.status === statusFilter;
    const matchesSearch = 
      evt.collection.toLowerCase().includes(searchQuery.toLowerCase()) ||
      evt.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
      evt.message.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        id="sync-event-log-backdrop"
        className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm cursor-default" 
        onClick={onClose} 
      />

      {/* Modal Content */}
      <div 
        id="sync-event-log-modal"
        className="relative bg-white w-full max-w-4xl shadow-2xl flex flex-col border border-slate-200 animate-in zoom-in-95 duration-250 max-h-[90vh] rounded-none font-sans"
      >
        {/* Header */}
        <div className="p-5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-slate-900 text-gold shrink-0">
              <Database size={18} />
            </div>
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 font-display">
                Real-Time Firestore Sync Monitor
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Inspect live Gateway requests, active subscriptions, and local sandbox safety fallbacks
              </p>
            </div>
          </div>
          <button
            id="sync-event-log-close-btn"
            onClick={onClose}
            className="p-1.5 hover:bg-slate-200 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Filters bar */}
        <div className="p-4 border-b border-slate-150 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            {/* Search Input */}
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                id="sync-event-log-search"
                type="text"
                placeholder="Search logs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-3 py-1.5 border border-slate-200 outline-none focus:ring-1 focus:ring-gold bg-slate-50 focus:bg-white text-xs w-48 rounded-none"
              />
            </div>

            {/* Status Filter buttons */}
            <div className="flex items-center border border-slate-200 p-0.5 bg-slate-50">
              <button
                id="sync-filter-all"
                onClick={() => setStatusFilter('all')}
                className={`px-2.5 py-1 font-medium transition-colors cursor-pointer ${
                  statusFilter === 'all' 
                    ? 'bg-slate-900 text-white' 
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                All ({events.length})
              </button>
              <button
                id="sync-filter-success"
                onClick={() => setStatusFilter('success')}
                className={`px-2.5 py-1 font-medium transition-colors flex items-center gap-1 cursor-pointer ${
                  statusFilter === 'success' 
                    ? 'bg-emerald-600 text-white' 
                    : 'text-slate-600 hover:text-emerald-600'
                }`}
              >
                Success ({events.filter(e => e.status === 'success').length})
              </button>
              <button
                id="sync-filter-failure"
                onClick={() => setStatusFilter('failure')}
                className={`px-2.5 py-1 font-medium transition-colors flex items-center gap-1 cursor-pointer ${
                  statusFilter === 'failure' 
                    ? 'bg-red-600 text-white' 
                    : 'text-slate-600 hover:text-red-600'
                }`}
              >
                Failed ({events.filter(e => e.status === 'failure').length})
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              id="sync-event-log-refresh"
              onClick={handleManualRefresh}
              disabled={isRefreshing}
              className="p-1.5 hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition-colors border border-slate-200 cursor-pointer disabled:opacity-50 flex items-center gap-1.5 font-medium"
            >
              <RefreshCw size={14} className={isRefreshing ? "animate-spin text-gold" : ""} />
              {isRefreshing ? "Loading..." : "Refresh"}
            </button>
            <button
              id="sync-event-log-clear"
              onClick={handleClearAll}
              disabled={events.length === 0}
              className="px-3 py-1.5 bg-red-50 text-red-600 hover:bg-red-100 transition-colors cursor-pointer text-xs font-semibold flex items-center gap-1 border border-red-100 disabled:opacity-50"
            >
              <Trash2 size={13} />
              Clear Log
            </button>
          </div>
        </div>

        {/* Sync Info Banner */}
        <div className="bg-amber-50/50 border-b border-amber-100 px-5 py-2.5 text-[11px] leading-relaxed text-slate-600 flex gap-2">
          <Shield size={14} className="text-amber-500 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold text-slate-800">Connection Redundancy System: </span>
            A "Sandbox" source indicates our corporate fail-safe activated local replication to prevent data loss. A "Live" source indicates direct communication with production Firestore.
          </div>
        </div>

        {/* Logs Table Area */}
        <div className="flex-1 overflow-y-auto min-h-[300px] max-h-[50vh]">
          {filteredEvents.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-slate-400">
              <Database size={36} className="text-slate-200 mb-2 animate-pulse" />
              <p className="text-xs font-semibold">No sync events match your criteria</p>
              <p className="text-[11px] text-slate-400 mt-1">Ready to capture automated complaints transaction requests...</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-400 font-mono text-[10px] uppercase tracking-widest border-b border-slate-150">
                  <th className="p-3 pl-5 w-24">Time</th>
                  <th className="p-3 w-52">Collection</th>
                  <th className="p-3 w-36">Action</th>
                  <th className="p-3 w-28">Source</th>
                  <th className="p-3 w-24">Status</th>
                  <th className="p-3 pr-5">Message / Recovery Details</th>
                </tr>
              </thead>
              <tbody id="sync-logs-table-body" className="divide-y divide-slate-100 text-xs font-sans">
                {filteredEvents.map((evt) => (
                  <tr 
                    key={evt.id} 
                    className={`hover:bg-slate-50/80 transition-colors ${
                      evt.status === 'failure' ? 'bg-red-50/20' : ''
                    }`}
                  >
                    {/* Timestamp */}
                    <td className="p-3 pl-5 font-mono text-[11px] text-slate-500 flex items-center gap-1.5">
                      <Clock size={11} className="text-slate-300" />
                      {evt.timestamp}
                    </td>

                    {/* Collection */}
                    <td className="p-3 font-mono text-[11px] font-semibold text-slate-700">
                      <span className="bg-slate-100 text-slate-800 px-1.5 py-0.5 border border-slate-200">
                        {evt.collection}
                      </span>
                    </td>

                    {/* Action */}
                    <td className="p-3">
                      <span className="font-mono text-[10px] font-bold text-slate-800 uppercase bg-slate-50 px-1.5 py-0.5 border border-slate-150">
                        {evt.action}
                      </span>
                    </td>

                    {/* Source */}
                    <td className="p-3">
                      <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 font-bold uppercase text-[9px] ${
                        evt.source === 'live' 
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' 
                          : 'bg-amber-50 text-amber-700 border border-amber-100'
                      }`}>
                        {evt.source === 'live' ? "Live Cloud" : "Sandbox"}
                      </span>
                    </td>

                    {/* Status Badge */}
                    <td className="p-3">
                      {evt.status === 'success' ? (
                        <span className="inline-flex items-center gap-1 text-emerald-700 font-bold text-[10px]">
                          <CheckCircle size={12} className="text-emerald-500" />
                          SUCCESS
                        </span>
                      ) : evt.status === 'failure' ? (
                        <span className="inline-flex items-center gap-1 text-red-600 font-bold text-[10px]">
                          <AlertCircle size={12} className="text-red-500 animate-pulse" />
                          FAILED
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-slate-500 font-bold text-[10px]">
                          <Clock size={12} className="text-slate-400" />
                          PENDING
                        </span>
                      )}
                    </td>

                    {/* Message Details */}
                    <td className="p-3 pr-5 text-slate-600 font-normal leading-relaxed text-[11px]">
                      {evt.message}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Footer info stats */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 text-[10px] text-slate-400 font-mono flex flex-wrap items-center justify-between gap-2">
          <span>
            Total buffer contents: {events.length}/100 logs
          </span>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1 text-emerald-700 font-bold">
              <span className="h-1.5 w-1.5 bg-emerald-500 rounded-full"></span>
              Live Core OK
            </span>
            <span className="flex items-center gap-1 text-amber-700 font-bold">
              <span className="h-1.5 w-1.5 bg-amber-500 rounded-full"></span>
              Sandbox Ready
            </span>
          </div>
        </div>
      </div>

      <ConfirmModal
        isOpen={showClearConfirm}
        onClose={() => setShowClearConfirm(false)}
        onConfirm={handleClearConfirm}
        title="Clear Diagnostic Log Buffer?"
        description="Are you sure you want to wipe all diagnostic sync event traces from the developer log stack? Wiped files cannot be recovered."
        confirmLabel="Wipe Logs"
        cancelLabel="Retain Logs"
        variant="warning"
      />

    </div>
  );
};
