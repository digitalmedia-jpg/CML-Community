import React, { useEffect, useState } from "react";
import { 
  X, 
  CheckCircle, 
  AlertCircle, 
  AlertTriangle, 
  Info, 
  WifiOff, 
  RefreshCw,
  Sparkles,
  LayoutGrid
} from "lucide-react";
import { toastService, Toast } from "../services/toastService";
import { motion, AnimatePresence } from "motion/react";

export const ToastContainer: React.FC = () => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    const unsub = toastService.subscribe((updatedToasts) => {
      setToasts(updatedToasts);
    });
    return () => unsub();
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div 
      id="global-toast-container" 
      className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-3 w-full max-w-sm pointer-events-none"
    >
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => {
          let icon = <Info size={18} className="text-blue-500" />;
          let bgColor = "bg-white border-slate-200 text-slate-800";
          let barColor = "bg-blue-500";
          let defaultTitle = "Information";

          switch (toast.type) {
            case "success":
              icon = <CheckCircle size={18} className="text-emerald-500" />;
              bgColor = "bg-emerald-50/95 border-emerald-200 text-slate-900 shadow-md backdrop-blur-md";
              barColor = "bg-emerald-500";
              defaultTitle = "Synchronization Success";
              break;
            case "error":
              icon = <AlertCircle size={18} className="text-red-500" />;
              bgColor = "bg-red-50/95 border-red-200 text-slate-900 shadow-md backdrop-blur-md";
              barColor = "bg-red-500";
              defaultTitle = "Execution Halted";
              break;
            case "warning":
              icon = <WifiOff size={18} className="text-amber-500 animate-pulse" />;
              bgColor = "bg-amber-50/95 border-amber-200 text-slate-900 shadow-md backdrop-blur-md";
              barColor = "bg-amber-500";
              defaultTitle = "Connectivity Status";
              break;
            case "drift":
              icon = <AlertTriangle size={18} className="text-red-600 animate-bounce" />;
              bgColor = "bg-rose-50/95 border-rose-200 text-slate-900 shadow-lg border-2 backdrop-blur-md";
              barColor = "bg-red-600";
              defaultTitle = "State Drift Detected";
              break;
            case "info":
            default:
              icon = <Sparkles size={18} className="text-[#C5A02D]" />;
              bgColor = "bg-slate-950/95 border-slate-800 text-white shadow-xl backdrop-blur-md";
              barColor = "bg-[#C5A02D]";
              defaultTitle = "Portal Sync Update";
              break;
          }

          return (
            <motion.div
              layout
              initial={{ opacity: 0, y: 30, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, x: 80, scale: 0.95 }}
              transition={{ type: "spring", stiffness: 350, damping: 25 }}
              key={toast.id}
              id={`toast-card-${toast.id}`}
              className={`pointer-events-auto relative p-4 border font-sans text-xs flex gap-3 overflow-hidden shadow-lg select-none rounded-none ${bgColor}`}
            >
              {/* Icon Container */}
              <div className="shrink-0 mt-0.5">
                {icon}
              </div>

              {/* Text Area */}
              <div className="flex-1 pr-4">
                <span className="font-bold text-[11px] uppercase tracking-wider block font-display leading-[1.3] mb-0.5">
                  {toast.title || defaultTitle}
                </span>
                <p className="text-[11px] text-slate-700 font-medium leading-relaxed dark:text-slate-200">
                  {toast.message}
                </p>
              </div>

              {/* Dismiss Button */}
              <button
                id={`toast-dismiss-${toast.id}`}
                onClick={() => toastService.dismiss(toast.id)}
                className="shrink-0 text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors h-5 w-5 flex items-center justify-center p-0 cursor-pointer self-start rounded-full hover:bg-slate-200/55"
              >
                <X size={14} />
              </button>

              {/* Progress Count-down bar */}
              {toast.duration && toast.duration > 0 && (
                <motion.div 
                  initial={{ width: "100%" }}
                  animate={{ width: "0%" }}
                  transition={{ duration: toast.duration / 1000, ease: "linear" }}
                  className={`absolute bottom-0 left-0 h-1 ${barColor}`}
                />
              )}
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
};
