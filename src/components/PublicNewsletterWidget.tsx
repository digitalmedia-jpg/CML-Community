import React, { useState } from "react";
import { Mail, CheckCircle2, Loader2, Sparkles, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface PublicNewsletterWidgetProps {
  companyId: string;
}

export function PublicNewsletterWidget({ companyId = "cml" }: PublicNewsletterWidgetProps) {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isRamada = companyId === "ramada" || companyId === "ramadax";
  
  // Custom brand colors based on selected company
  const brandTitle = isRamada ? "Ramada Suites Port" : "Cove Management Ltd";
  const brandSubtitle = isRamada ? "Exclusive guest privileges & suite rewards" : "Elite privileges, news, and member updates";
  
  const bgGradient = isRamada 
    ? "from-[#800020] via-[#5c0017] to-[#3a000d]" // Rich burgundy/wine luxury
    : "from-[#131435] via-[#1b1d4c] to-[#0d0d26]"; // Premium royal midnight blue

  const accentColor = isRamada ? "#E2B13C" : "#C5A02D"; // Rich Gold
  const accentHover = isRamada ? "hover:bg-[#E2B13C]/90" : "hover:bg-[#C5A02D]/90";
  const accentText = isRamada ? "text-[#E2B13C]" : "text-[#C5A02D]";
  const accentBorder = isRamada ? "border-[#E2B13C]/20" : "border-[#C5A02D]/20";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/newsletter-ingest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          source: "Embedded Iframe Widget",
          companyId: companyId
        })
      });

      const data = await response.json();
      if (response.ok && data.success) {
        setIsSuccess(true);
      } else {
        throw new Error(data.error || "Failed to submit newsletter request");
      }
    } catch (err: any) {
      console.error("Widget submission error:", err);
      setError(err.message || "An error occurred while subscribing. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={`min-h-screen w-full flex items-center justify-center bg-slate-900/10 p-4 font-sans`}>
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className={`w-full max-w-sm rounded-2xl shadow-xl overflow-hidden border border-white/10 bg-gradient-to-br ${bgGradient} text-white p-6 relative`}
      >
        {/* Decorative Gold Accent Bar */}
        <div 
          className="absolute top-0 left-0 right-0 h-1" 
          style={{ backgroundColor: accentColor }}
        />

        <AnimatePresence mode="wait">
          {!isSuccess ? (
            <motion.div
              key="form-view"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-5"
            >
              <div className="space-y-1.5 text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-white/5 border border-white/10 mb-2">
                  <Mail className="w-5 h-5 text-amber-400" />
                </div>
                <h3 className="text-lg font-bold tracking-tight uppercase font-display">
                  {brandTitle}
                </h3>
                <p className="text-white/70 text-xs">
                  {brandSubtitle}
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-3.5">
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-white/50">
                    Email Address
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="name@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isSubmitting}
                    className="w-full h-11 px-3.5 rounded-lg bg-white/5 border border-white/15 focus:border-amber-400 focus:bg-white/10 focus:outline-none transition text-sm text-white placeholder-white/40"
                  />
                </div>

                {error && (
                  <div className="flex items-start gap-2 p-2.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-300 text-xs">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{error}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting || !email.trim()}
                  className={`w-full h-11 font-bold text-xs uppercase tracking-wider text-slate-950 rounded-lg transition-all flex items-center justify-center gap-2 shadow-md hover:shadow-lg disabled:opacity-50 cursor-pointer`}
                  style={{ backgroundColor: accentColor }}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                      <span>Subscribing...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5 text-slate-950" />
                      <span>Subscribe Now</span>
                    </>
                  )}
                </button>
              </form>

              <div className="text-[9px] text-center text-white/40 border-t border-white/5 pt-3">
                ✦ Secure & instant synchronization with loyalty member accounts ✦
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="success-view"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-6 space-y-4"
            >
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 mb-1">
                <CheckCircle2 className="w-8 h-8 text-emerald-400" />
              </div>
              <div className="space-y-1.5">
                <h4 className="text-base font-bold text-emerald-400">Subscription Successful!</h4>
                <p className="text-white/80 text-xs leading-relaxed max-w-xs mx-auto">
                  Thank you for subscribing! Your email <span className="font-mono text-amber-400 font-semibold">{email}</span> has been linked to our live guest registry.
                </p>
              </div>
              <div className="text-[10px] text-emerald-400/80 font-mono bg-emerald-500/5 py-1 px-3 rounded border border-emerald-500/10 inline-block">
                ✓ Event wpcf7submit Synced
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
