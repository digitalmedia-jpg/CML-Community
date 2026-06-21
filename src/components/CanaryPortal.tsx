import React from "react";
import { 
  Globe, 
  ExternalLink, 
  ShieldCheck, 
  Smartphone, 
  CheckCircle, 
  ChevronRight, 
  FileCheck, 
  AlertCircle,
  Clock,
  TrendingUp,
  CreditCard
} from "lucide-react";
import { motion } from "motion/react";

interface CanaryPortalProps {
  companyId: string;
}

export const CanaryPortal: React.FC<CanaryPortalProps> = ({ companyId }) => {
  const isWyndham = companyId === "wyndham";
  const portalUrl = "https://eu.canarytechnologies.com/hotels/wyndham-47731/check-ins"; 
  const companyName = isWyndham ? "Wyndham Garden Wailoaloa" : "Ramada Suites Wailoaloa";

  const metrics = [
    { label: "Contactless Check-In", value: "88.4%", trend: "+2.4%", icon: Smartphone, color: "text-emerald-600 bg-emerald-50 border-emerald-100" },
    { label: "Pre-Authorizations", value: "100% Secure", trend: "Active", icon: ShieldCheck, color: "text-blue-600 bg-blue-50 border-blue-100" },
    { label: "Digital Upsells (M-T-D)", value: "$4,850", trend: "+12.1%", icon: TrendingUp, color: "text-amber-600 bg-amber-50 border-amber-100" },
    { label: "e-Signatures / Contracts", value: "97.2% Signed", trend: "9 Pending", icon: FileCheck, color: "text-indigo-600 bg-indigo-50 border-indigo-100" }
  ];

  return (
    <div className="flex flex-col h-full space-y-8 pb-12">
      {/* Header Banner */}
      <div className="relative bg-luxury-black text-white p-8 md:p-12 overflow-hidden rounded-sm shadow-xl">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_30%,rgba(197,160,89,0.15)_0%,transparent_60%)] pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <span className="p-2 bg-gold/10 text-gold rounded-full border border-gold/20">
                <Globe size={18} />
              </span>
              <p className="text-[10px] font-display uppercase tracking-[0.4em] text-gold font-bold">External System Integration</p>
            </div>
            <h2 className="text-3xl md:text-5xl font-serif text-white italic">
              Canary Technologies Dashboard
            </h2>
            <p className="text-xs text-slate-300 font-serif italic max-w-xl">
              Live guest check-in, dynamic secure credit card authorizations, and contactless experience portal for <span className="text-gold font-sans not-italic font-bold">{companyName}</span>.
            </p>
          </div>

          <a 
            href={portalUrl} 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center gap-3 px-8 py-4 bg-gold text-white text-[10px] font-display uppercase tracking-[0.3em] font-black hover:bg-white hover:text-luxury-black transition-all shadow-lg group rounded-sm shrink-0"
          >
            Launch Live Canary Portal <ExternalLink size={14} className="group-hover:translate-x-1 transition-transform" />
          </a>
        </div>
      </div>

      {/* Quick Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metrics.map((m, idx) => (
          <motion.div 
            key={idx}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="bg-white p-6 border border-slate-100 rounded-sm shadow-sm flex flex-col justify-between"
          >
            <div className="flex justify-between items-start mb-4">
              <span className="text-[10px] font-display uppercase tracking-widest text-slate-500 font-bold">{m.label}</span>
              <div className={`p-2 rounded-full border ${m.color}`}>
                <m.icon size={16} />
              </div>
            </div>
            <div>
              <span className="text-2xl font-serif italic text-slate-950 font-medium">{m.value}</span>
              <div className="flex items-center gap-1.5 mt-2">
                <span className="text-[9px] font-display uppercase tracking-widest text-emerald-600 font-black">{m.trend}</span>
                <span className="text-[8px] font-display uppercase tracking-widest text-slate-400">Current Standard</span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Embedded Terminal Frame with elegant fallback */}
      <div className="bg-white border border-slate-150 shadow-lg rounded-sm overflow-hidden flex flex-col flex-1 h-[70vh]">
        <div className="bg-slate-100 border-b border-slate-200 px-6 py-4 flex justify-between items-center text-xs">
          <div className="flex items-center gap-1.5 font-mono text-[10px] text-slate-600">
            <span className="w-2.5 h-2.5 rounded-full bg-red-400" />
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
            <span className="w-2.5 h-2.5 rounded-full bg-green-400" />
            <span className="ml-2 font-black">SECURE IFRAME TUNNEL:</span> {portalUrl}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[9px] font-display uppercase tracking-widest px-2.5 py-1 bg-emerald-100 text-emerald-800 font-bold rounded-full">
              SSL Verified
            </span>
          </div>
        </div>

        <div className="flex-1 relative bg-slate-50 min-h-[500px]">
          {/* Fallback & Helper Notice */}
          <div className="absolute inset-x-8 top-8 z-10 p-6 bg-amber-50/90 border border-amber-200 text-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4 rounded-sm shadow-md">
            <div className="flex gap-3">
              <AlertCircle className="text-amber-600 shrink-0 mt-0.5" size={20} />
              <div className="space-y-1">
                <p className="text-[10px] font-display uppercase tracking-widest font-black text-amber-900">Security Sandbox Advisory</p>
                <p className="font-serif italic text-xs leading-relaxed max-w-xl">
                  Some corporate firewalls, ad blockers, or X-Frame headers may prevent loading Canary directly inside this iframe. If the screen remains blank below, click "Launch External Tab" to sign in directly.
                </p>
              </div>
            </div>
            <a 
              href={portalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-2.5 bg-amber-600 text-white text-[9px] font-display uppercase tracking-widest font-black hover:bg-amber-700 transition-colors shadow-sm rounded-sm shrink-0 text-center"
            >
              Launch External Tab
            </a>
          </div>

          <iframe 
            src={portalUrl}
            title="Canary Technologies Portal"
            className="w-full h-full border-none absolute inset-0 z-0 bg-white"
            allow="payment; camera; clipboard-write"
          />
        </div>
      </div>
    </div>
  );
};
