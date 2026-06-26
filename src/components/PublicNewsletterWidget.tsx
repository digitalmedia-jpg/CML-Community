import React, { useState } from "react";
import { Mail, CheckCircle2, Loader2, Sparkles, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface PublicNewsletterWidgetProps {
  companyId: string;
}

export function PublicNewsletterWidget({ companyId = "cml" }: PublicNewsletterWidgetProps) {
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [joinRewards, setJoinRewards] = useState(false);
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
          firstName: joinRewards ? firstName.trim() : "",
          lastName: joinRewards ? lastName.trim() : "",
          phone: joinRewards ? phone.trim() : "",
          joinRewards: joinRewards,
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

  const handleOpenRewardsRegistration = () => {
    const fullName = `${firstName} ${lastName}`.trim();
    const targetUrl = `${window.location.origin}/?prefill_email=${encodeURIComponent(email)}&prefill_name=${encodeURIComponent(fullName)}&company=${companyId}`;
    window.open(targetUrl, "_blank");
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
              className="space-y-4"
            >
              <div className="space-y-1 text-center">
                <div className="inline-flex items-center justify-center w-11 h-11 rounded-full bg-white/5 border border-white/10 mb-1">
                  <Mail className="w-5 h-5 text-amber-400" />
                </div>
                <h3 className="text-base font-bold tracking-tight uppercase font-display">
                  {brandTitle}
                </h3>
                <p className="text-white/70 text-[11px]">
                  {brandSubtitle}
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-3">
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
                    className="w-full h-10 px-3 rounded-lg bg-white/5 border border-white/15 focus:border-amber-400 focus:bg-white/10 focus:outline-none transition text-xs text-white placeholder-white/40"
                  />
                </div>

                {/* JOIN REWARDS CHECKBOX */}
                <div className="flex items-start gap-2.5 bg-white/5 p-2.5 rounded-lg border border-white/5 select-none">
                  <input
                    type="checkbox"
                    id="join-rewards-chk"
                    checked={joinRewards}
                    onChange={(e) => setJoinRewards(e.target.checked)}
                    className="mt-0.5 rounded accent-amber-500 text-slate-900 border-white/20 focus:ring-0"
                  />
                  <label htmlFor="join-rewards-chk" className="text-[11px] leading-snug text-white/90 font-medium cursor-pointer">
                    Join <span className="text-amber-400 font-bold">CML Loyalty Rewards</span> & earn <span className="text-amber-400 font-bold">100 Welcome Points</span>!
                  </label>
                </div>

                {/* COLLAPSIBLE NAME/PHONE FIELDS */}
                <AnimatePresence initial={false}>
                  {joinRewards && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden space-y-3 pt-1"
                    >
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <label className="block text-[9px] font-bold uppercase tracking-wider text-white/50">First Name</label>
                          <input
                            type="text"
                            placeholder="John"
                            required={joinRewards}
                            value={firstName}
                            onChange={(e) => setFirstName(e.target.value)}
                            className="w-full h-9 px-3 rounded-md bg-white/5 border border-white/10 focus:border-amber-400 focus:bg-white/10 focus:outline-none transition text-xs text-white placeholder-white/30"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="block text-[9px] font-bold uppercase tracking-wider text-white/50">Last Name</label>
                          <input
                            type="text"
                            placeholder="Doe"
                            required={joinRewards}
                            value={lastName}
                            onChange={(e) => setLastName(e.target.value)}
                            className="w-full h-9 px-3 rounded-md bg-white/5 border border-white/10 focus:border-amber-400 focus:bg-white/10 focus:outline-none transition text-xs text-white placeholder-white/30"
                          />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="block text-[9px] font-bold uppercase tracking-wider text-white/50">Phone Number</label>
                        <input
                          type="text"
                          placeholder="+679 123 4567"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          className="w-full h-9 px-3 rounded-md bg-white/5 border border-white/10 focus:border-amber-400 focus:bg-white/10 focus:outline-none transition text-xs text-white placeholder-white/30 font-mono"
                        />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {error && (
                  <div className="flex items-start gap-2 p-2.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-300 text-xs">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{error}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting || !email.trim()}
                  className={`w-full h-10 font-bold text-[11px] uppercase tracking-wider text-slate-950 rounded-lg transition-all flex items-center justify-center gap-2 shadow-md hover:shadow-lg disabled:opacity-50 cursor-pointer`}
                  style={{ backgroundColor: accentColor }}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                      <span>Syncing Ingest...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5 text-slate-950" />
                      <span>{joinRewards ? "Subscribe & Join Rewards" : "Subscribe to Newsletter"}</span>
                    </>
                  )}
                </button>
              </form>

              <div className="text-[9px] text-center text-white/40 border-t border-white/5 pt-2">
                ✦ Secure & instant synchronization with loyalty member accounts ✦
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="success-view"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-4 space-y-4"
            >
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-emerald-500/10 border border-emerald-500/20 mb-1">
                <CheckCircle2 className="w-7 h-7 text-emerald-400" />
              </div>
              <div className="space-y-1.5">
                <h4 className="text-sm font-bold text-emerald-400">Subscription Successful!</h4>
                <p className="text-white/80 text-[11px] leading-relaxed max-w-xs mx-auto">
                  Thank you! Your email <span className="font-mono text-amber-400 font-semibold">{email}</span> has been stored in Firestore and linked to our CRM database.
                </p>
                {joinRewards && (
                  <p className="text-amber-300 text-[10px] font-medium max-w-xs mx-auto">
                    ★ Your loyalty profile has been initialized with 100 welcome rewards points!
                  </p>
                )}
              </div>

              <div className="pt-2 border-t border-white/5 space-y-2">
                <p className="text-[10px] text-white/60">
                  Want to complete your rewards registration details, check your digital loyalty card, and view exclusive rewards?
                </p>
                <button
                  onClick={handleOpenRewardsRegistration}
                  className="w-full py-2 bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-600 hover:to-yellow-500 text-slate-950 text-[10px] font-black uppercase tracking-wider rounded-md transition shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Go to Rewards Registration ➔</span>
                </button>
              </div>

              <div className="text-[9px] text-emerald-400/80 font-mono bg-emerald-500/5 py-1 px-3 rounded border border-emerald-500/10 inline-block mt-2">
                ✓ Live Sync Complete
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
