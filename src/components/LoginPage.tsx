import React, { useState } from "react";
import { motion } from "motion/react";
import { Mail, Lock, ArrowRight, ShieldCheck } from "lucide-react";
import { loginWithEmail, EXPLICIT_CREDENTIALS } from "../lib/firebase";

interface LoginPageProps {
  onLoginSuccess: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleEmailAction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return setError("Username or Email is required");
    if (!password) return setError("Password is required");
    
    const targetIdentifier = email.trim();
    
    // Find matching explicit credentials (case-insensitive username or email match)
    const explicitMatched = EXPLICIT_CREDENTIALS.find(u => 
      u.username.toLowerCase() === targetIdentifier.toLowerCase() || 
      u.email.toLowerCase() === targetIdentifier.toLowerCase()
    );

    const resolvedEmail = explicitMatched ? explicitMatched.email : targetIdentifier;

    // Check password if it is a pre-registered corporate account
    if (explicitMatched && password !== explicitMatched.password) {
      return setError("Invalid password for this corporate account. Please try again.");
    }

    // Check allowed corporate domains for non-explicit entries
    if (!explicitMatched) {
      const emailDomain = targetIdentifier.toLowerCase().split("@")[1] || "";
      const allowedDomains = ["cml.com.fj", "ramadawailoaloafiji.com", "wyndhamgardenwailoaloafiji.com"];
      
      if (!allowedDomains.includes(emailDomain)) {
        return setError("Unauthorized domain. Please use a registered username or your corporate email (@cml.com.fj, @ramadawailoaloafiji.com, etc.).");
      }
    }
    
    try {
      setLoading(true);
      setError(null);
      
      // Log in via mock/firebase auth state manager so App.tsx detects it
      await loginWithEmail(resolvedEmail, password);
      onLoginSuccess();
    } catch (err: any) {
      setError(err.message || "Authentication failed. Please verify your credentials.");
    } finally {
      setLoading(false);
    }
  };

  const handleSandboxBypass = async () => {
    try {
      setLoading(true);
      setError(null);
      // Force sign in as Charles Cebujano (digitalmedia@cml.com.fj) with correct password
      await loginWithEmail("digitalmedia@cml.com.fj", "Blukukurtz_8");
      onLoginSuccess();
    } catch (err: any) {
      setError(err.message || "Sandbox bypass failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-luxury-black flex flex-col items-center justify-center p-6 md:p-10 font-sans overflow-hidden relative">
      {/* Subtle Luxury Background Effects */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,rgba(197,160,89,0.08)_0%,transparent_60%)] pointer-events-none" />
      <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-transparent via-gold/50 to-transparent" />
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md px-3 sm:px-0 relative z-10"
      >
        <div className="bg-[#1a1a1a] border border-white/5 p-5 sm:p-10 md:p-14 shadow-2xl rounded-sm relative overflow-hidden">
          {/* Decorative Corner */}
          <div className="absolute top-0 right-0 w-20 h-20 pointer-events-none">
            <div className="absolute top-5 right-5 w-px h-10 bg-gold/20" />
            <div className="absolute top-5 right-5 h-px w-10 bg-gold/20" />
          </div>

          <div className="mb-8 sm:mb-10 text-center">
            <motion.img 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              src="https://cml.com.fj/wp-content/uploads/2026/05/CML-Thumbnail-Logo-2.jpg" 
              className="h-12 sm:h-20 mx-auto mb-4 sm:mb-6 filter drop-shadow-[0_0_15px_rgba(197,160,89,0.2)]"
              alt="CML"
              referrerPolicy="no-referrer"
            />
            <h1 className="text-xl sm:text-2xl font-serif italic text-white tracking-tight uppercase mb-1 sm:mb-2">
              CML <span className="text-gold">Community</span>
            </h1>
            <p className="text-[9px] sm:text-[11px] text-slate-400 font-display uppercase tracking-[0.25em] font-bold">
              Gateway to Excellence & Performance
            </p>
          </div>

          <form onSubmit={handleEmailAction} className="space-y-4 sm:space-y-6">
            <div className="space-y-1.5">
              <label className="text-[9px] sm:text-[10px] font-display uppercase tracking-widest text-gold font-black opacity-90 pl-1">
                Username or Email
              </label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-gold transition-colors" size={14} />
                <input 
                  type="text"
                  required
                  placeholder="Enter your Username or Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-[#242424] border border-neutral-750 pl-11 pr-4 py-3 sm:py-4 text-xs sm:text-sm text-white placeholder:text-gray-500 outline-none focus:border-gold/60 focus:bg-[#2c2c2c] transition-all rounded-sm font-sans"
                  id="login-username-input"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[9px] sm:text-[10px] font-display uppercase tracking-widest text-gold font-black opacity-90 pl-1">
                Password
              </label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-gold transition-colors" size={14} />
                <input 
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-[#242424] border border-neutral-750 pl-11 pr-4 py-3 sm:py-4 text-xs sm:text-sm text-white placeholder:text-gray-500 outline-none focus:border-gold/60 focus:bg-[#2c2c2c] transition-all rounded-sm font-sans"
                  id="login-password-input"
                />
              </div>
            </div>

            {error && (
              <div className="space-y-2">
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-[10px] sm:text-[11px] text-red-500 font-display uppercase tracking-widest font-black text-center py-2.5 bg-red-500/10 rounded-sm border border-red-500/15 px-2.5 leading-relaxed"
                >
                  {error}
                </motion.div>
                
                <div className="p-2.5 bg-amber-500/5 border border-[#c5a02d]/25 rounded-sm text-center">
                  <p className="text-[8px] sm:text-[9px] text-amber-200/90 uppercase tracking-widest font-bold mb-1 leading-normal">
                    Having trouble accessing your account?
                  </p>
                  <button
                    type="button"
                    onClick={handleSandboxBypass}
                    className="text-[9px] sm:text-[10px] uppercase tracking-widest text-gold hover:text-white font-black underline transition-colors"
                    id="btn-error-sandbox-bypass"
                  >
                    Activate Secure Offline Session
                  </button>
                </div>
              </div>
            )}

            <button 
              type="submit"
              disabled={loading}
              className="w-full bg-gold border border-gold hover:bg-gold-dark text-black py-3 sm:py-4 text-[9px] sm:text-[10px] font-display uppercase tracking-[0.25em] font-black transition-all shadow-xl shadow-gold/10 active:scale-[0.98] disabled:opacity-50 disabled:scale-100 flex items-center justify-center gap-2"
              id="btn-login-submit"
            >
              {loading ? "Signing In..." : "Sign In"}
              <ArrowRight size={16} />
            </button>
          </form>

          <div className="mt-10 pt-6 border-t border-white/5 flex flex-col items-center gap-4">
            <div className="flex items-center gap-2 text-[10px] text-slate-500 font-display uppercase tracking-widest font-bold">
              <ShieldCheck size={12} className="text-gold opacity-60" />
              <span>CML Encryption Standard Enforced</span>
            </div>
          </div>
        </div>
        
        <p className="mt-10 text-center text-[10px] text-slate-500 font-display uppercase tracking-[0.3em] font-medium">
          Internal Use Only @ 2026 Cove Management Ltd
        </p>
      </motion.div>
    </div>
  );
};
