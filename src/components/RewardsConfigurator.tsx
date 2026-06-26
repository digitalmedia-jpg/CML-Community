import React, { useState, useEffect } from "react";
import { 
  collection, 
  getDocs, 
  addDoc, 
  deleteDoc, 
  doc, 
  updateDoc,
  setDoc,
  db
} from "../lib/firebase";
import { 
  Award, 
  Plus, 
  Trash2, 
  Edit2, 
  Save, 
  TrendingUp, 
  Settings, 
  RefreshCw, 
  CheckCircle,
  HelpCircle,
  ChevronRight,
  Sparkles,
  Info
} from "lucide-react";

export interface TierConfig {
  id: string;
  name: string;
  minPoints: number;
  pointConversionRate: number;
  benefits: string; // Comma-separated or text
  color: string;     // Tailwind gradient classes, e.g. "from-blue-400 to-indigo-500"
  bg: string;        // Tailwind bg color, e.g. "bg-blue-500"
  badgeColor: string;// Tailwind badge color, e.g. "bg-blue-100 text-blue-950 border-blue-200"
}

interface RewardsConfiguratorProps {
  companyId: string;
  onClose: () => void;
  onConfigUpdated?: () => void;
}

// Preset color options for styling the tiers
const COLOR_PRESETS = [
  {
    name: "Classic Blue",
    color: "from-blue-400 to-indigo-500",
    bg: "bg-blue-500",
    badgeColor: "bg-blue-100 text-blue-950 border-blue-200"
  },
  {
    name: "Sterling Silver",
    color: "from-slate-400 to-slate-600",
    bg: "bg-slate-500",
    badgeColor: "bg-slate-100 text-slate-950 border-slate-200"
  },
  {
    name: "Privilege Gold",
    color: "from-amber-400 to-[#C5A02D]",
    bg: "bg-[#C5A02D]",
    badgeColor: "bg-amber-100 text-amber-950 border-amber-200"
  },
  {
    name: "Royal Purple",
    color: "from-purple-500 to-pink-600",
    bg: "bg-purple-600",
    badgeColor: "bg-purple-100 text-purple-950 border-purple-200"
  },
  {
    name: "Luxury Cyan",
    color: "from-cyan-500 to-blue-600",
    bg: "bg-cyan-500",
    badgeColor: "bg-cyan-100 text-cyan-950 border-cyan-200"
  },
  {
    name: "Emerald VIP",
    color: "from-emerald-400 to-teal-700",
    bg: "bg-emerald-500",
    badgeColor: "bg-emerald-100 text-emerald-950 border-emerald-200"
  }
];

// Initial default tiers if nothing is in DB
export const DEFAULT_TIERS: Omit<TierConfig, 'id'>[] = [
  {
    name: "BLUE",
    minPoints: 0,
    pointConversionRate: 10,
    benefits: "✦ $1 Spent = 10 Reward Points, ✦ Welcome Drinks on Arrival, ✦ Elite Member Rates",
    color: "from-blue-400 to-indigo-500",
    bg: "bg-blue-500",
    badgeColor: "bg-blue-100 text-blue-950 border-blue-200"
  },
  {
    name: "SILVER",
    minPoints: 1500,
    pointConversionRate: 10,
    benefits: "✦ Priority Dining Reservations, ✦ Elite Member Rates, ✦ Welcome Drink Upgrade",
    color: "from-slate-400 to-slate-600",
    bg: "bg-slate-500",
    badgeColor: "bg-slate-100 text-slate-950 border-slate-200"
  },
  {
    name: "GOLD",
    minPoints: 5000,
    pointConversionRate: 10,
    benefits: "✦ Standard Room Upgrades, ✦ Priority Reservations, ✦ 15% Spa Discount",
    color: "from-amber-400 to-[#C5A02D]",
    bg: "bg-[#C5A02D]",
    badgeColor: "bg-amber-100 text-amber-950 border-amber-200"
  },
  {
    name: "PLATINUM",
    minPoints: 1500,
    pointConversionRate: 10,
    benefits: "✦ Free Resort Day Pass, ✦ Suite Upgrades, ✦ Early Check-in & Late Checkout",
    color: "from-purple-500 to-pink-600",
    bg: "bg-purple-600",
    badgeColor: "bg-purple-100 text-purple-950 border-purple-200"
  },
  {
    name: "DIAMOND",
    minPoints: 40000,
    pointConversionRate: 10,
    benefits: "✦ VIP Butler Service, ✦ Executive Lounge Access, ✦ Presidential Airport Transfer",
    color: "from-cyan-500 to-blue-600",
    bg: "bg-cyan-500",
    badgeColor: "bg-cyan-100 text-cyan-950 border-cyan-200"
  }
];

export default function RewardsConfigurator({ companyId, onClose, onConfigUpdated }: RewardsConfiguratorProps) {
  const [tiers, setTiers] = useState<TierConfig[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Form states
  const [editingId, setEditingId] = useState<string | null>(null);
  const [tierName, setTierName] = useState("");
  const [minPoints, setMinPoints] = useState(0);
  const [conversionRate, setConversionRate] = useState(10);
  const [benefitText, setBenefitText] = useState("");
  const [selectedColorPreset, setSelectedColorPreset] = useState(0);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchTiers();
  }, [companyId]);

  const fetchTiers = async () => {
    setLoading(true);
    try {
      const colRef = collection(db, `rewards-config-${companyId}-tiers`);
      const snapshot = await getDocs(colRef);
      const list: TierConfig[] = [];
      
      snapshot.docs.forEach((doc) => {
        list.push({ id: doc.id, ...doc.data() } as TierConfig);
      });

      // If no configurations exist, initialize with defaults
      if (list.length === 0) {
        const batchPromises = DEFAULT_TIERS.map(async (defTier) => {
          const docRef = await addDoc(colRef, defTier);
          return { id: docRef.id, ...defTier } as TierConfig;
        });
        const initializedList = await Promise.all(batchPromises);
        initializedList.sort((a, b) => a.minPoints - b.minPoints);
        setTiers(initializedList);
      } else {
        list.sort((a, b) => a.minPoints - b.minPoints);
        setTiers(list);
      }
    } catch (e) {
      console.error("Error loading tier configuration:", e);
      // Fallback
      setTiers(DEFAULT_TIERS.map((t, idx) => ({ id: `fallback_${idx}`, ...t })));
    } finally {
      setLoading(false);
    }
  };

  const handleSaveTier = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tierName.trim()) return;

    setIsSaving(true);
    const selectedPreset = COLOR_PRESETS[selectedColorPreset];
    const payload = {
      name: tierName.trim().toUpperCase(),
      minPoints: Number(minPoints),
      pointConversionRate: Number(conversionRate),
      benefits: benefitText.trim(),
      color: selectedPreset.color,
      bg: selectedPreset.bg,
      badgeColor: selectedPreset.badgeColor
    };

    try {
      const colRef = collection(db, `rewards-config-${companyId}-tiers`);
      if (editingId) {
        // Edit existing doc
        const docRef = doc(db, `rewards-config-${companyId}-tiers`, editingId);
        await updateDoc(docRef, payload);
      } else {
        // Create new doc
        await addDoc(colRef, payload);
      }

      // Reset form fields
      setEditingId(null);
      setTierName("");
      setMinPoints(0);
      setConversionRate(10);
      setBenefitText("");
      setSelectedColorPreset(0);
      
      // Refresh database
      await fetchTiers();
      if (onConfigUpdated) onConfigUpdated();
      alert("Tier setting successfully persisted to Firestore!");
    } catch (err) {
      console.error("Failed to save loyalty tier:", err);
      alert("Error saving tier settings. Check Firestore connection.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditInit = (tier: TierConfig) => {
    setEditingId(tier.id);
    setTierName(tier.name);
    setMinPoints(tier.minPoints);
    setConversionRate(tier.pointConversionRate);
    setBenefitText(tier.benefits);
    
    // Find matching preset index
    const presetIndex = COLOR_PRESETS.findIndex(p => p.color === tier.color);
    if (presetIndex !== -1) {
      setSelectedColorPreset(presetIndex);
    }
  };

  const handleDeleteTier = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete the ${name} loyalty tier? Guests on this level will fall back to other matched tiers.`)) {
      return;
    }

    try {
      const docRef = doc(db, `rewards-config-${companyId}-tiers`, id);
      await deleteDoc(docRef);
      await fetchTiers();
      if (onConfigUpdated) onConfigUpdated();
      alert("Tier successfully deleted from Firestore!");
    } catch (err) {
      console.error("Failed to delete tier:", err);
      alert("Could not delete the tier. Please try again.");
    }
  };

  const resetToDefaults = async () => {
    if (!window.confirm("Warning: This will overwrite your existing custom loyalty tiers and reset back to standard Fiji Privilege Club levels. Proceed?")) {
      return;
    }

    setLoading(true);
    try {
      // 1. Delete all current tiers
      for (const t of tiers) {
        if (!t.id.startsWith("fallback_")) {
          const docRef = doc(db, `rewards-config-${companyId}-tiers`, t.id);
          await deleteDoc(docRef);
        }
      }

      // 2. Add defaults
      const colRef = collection(db, `rewards-config-${companyId}-tiers`);
      const batchPromises = DEFAULT_TIERS.map(async (defTier) => {
        const docRef = await addDoc(colRef, defTier);
        return { id: docRef.id, ...defTier } as TierConfig;
      });
      const initializedList = await Promise.all(batchPromises);
      initializedList.sort((a, b) => a.minPoints - b.minPoints);
      
      setTiers(initializedList);
      if (onConfigUpdated) onConfigUpdated();
      alert("Loyalty tiers successfully reset to default Fiji Privilege Club settings.");
    } catch (err) {
      console.error("Failed to reset tiers:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="rewards-configurator-container" className="space-y-6">
      {/* Informational Hero Area */}
      <div className="bg-slate-900 rounded-xl p-5 border border-slate-800 text-white flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="space-y-1">
          <h3 className="text-lg font-serif text-amber-400 flex items-center gap-2">
            <Settings className="w-5 h-5 animate-spin-slow text-amber-400" />
            Loyalty Tier Configurator
          </h3>
          <p className="text-slate-350 text-xs">
            Admin interface to set up active reward tiers, minimum point thresholds, and custom dollar-to-point conversion rates stored dynamically in Firestore.
          </p>
        </div>
        <div>
          <button
            type="button"
            onClick={resetToDefaults}
            className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-amber-400 text-xs font-semibold uppercase font-mono px-3.5 py-2 border border-slate-700 rounded-md transition"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Reset Defaults
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left Side: Create / Edit Form (takes 2 columns) */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="bg-slate-950 p-4 text-white">
              <h4 className="text-xs uppercase font-bold font-mono tracking-wider text-amber-400 flex items-center gap-2">
                <Plus className="w-4 h-4" />
                {editingId ? "Modify Loyalty Tier" : "Add Custom Loyalty Tier"}
              </h4>
            </div>

            <form onSubmit={handleSaveTier} className="p-5 space-y-4 text-slate-800">
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">Tier Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. SILVER SUITE, GOLD VIP"
                  value={tierName}
                  onChange={(e) => setTierName(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-250 rounded-lg focus:outline-none focus:border-indigo-500 font-bold uppercase"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">Min Points Required</label>
                  <input
                    type="number"
                    required
                    min="0"
                    placeholder="e.g. 5000"
                    value={minPoints}
                    onChange={(e) => setMinPoints(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs border border-slate-250 rounded-lg focus:outline-none focus:border-indigo-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">Pts per $1 spent</label>
                  <input
                    type="number"
                    required
                    min="1"
                    placeholder="e.g. 10"
                    value={conversionRate}
                    onChange={(e) => setConversionRate(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs border border-slate-250 rounded-lg focus:outline-none focus:border-indigo-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">Benefits List (Use ✦ or commas)</label>
                <textarea
                  rows={3}
                  required
                  placeholder="e.g. ✦ Standard Room Upgrades, ✦ Priority Dining Reservations, ✦ 15% Spa Discount"
                  value={benefitText}
                  onChange={(e) => setBenefitText(e.target.value)}
                  className="w-full p-3 text-xs border border-slate-250 rounded-lg focus:outline-none focus:border-indigo-500 leading-relaxed"
                />
                <span className="text-[10px] text-slate-400 block mt-1">
                  Prefix each benefit with a star character (✦) to format them perfectly on user cards.
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">Visual Card Accent Theme</label>
                <div className="grid grid-cols-3 gap-2">
                  {COLOR_PRESETS.map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setSelectedColorPreset(idx)}
                      className={`flex flex-col items-center justify-center p-2 rounded-lg border text-center transition-all ${
                        selectedColorPreset === idx 
                          ? "border-[#C5A02D] bg-amber-50/50 ring-2 ring-amber-400/20" 
                          : "border-slate-200 hover:bg-slate-50"
                      }`}
                    >
                      <div className={`w-8 h-4 rounded bg-gradient-to-r ${preset.color} shadow-sm mb-1`} />
                      <span className="text-[9px] font-mono font-medium text-slate-600">{preset.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t border-slate-100">
                {editingId && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingId(null);
                      setTierName("");
                      setMinPoints(0);
                      setConversionRate(10);
                      setBenefitText("");
                      setSelectedColorPreset(0);
                    }}
                    className="flex-1 px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-bold uppercase transition"
                  >
                    Cancel
                  </button>
                )}
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex-1 px-4 py-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-[#C5A02D] font-extrabold uppercase rounded-lg text-xs tracking-wider transition shadow-sm flex items-center justify-center gap-1.5"
                >
                  <Save className="w-4 h-4" />
                  {isSaving ? "Saving..." : editingId ? "Update Tier" : "Save Tier"}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Right Side: Existing Tiers List (takes 3 columns) */}
        <div className="lg:col-span-3 space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
            <h4 className="text-xs uppercase font-bold font-mono tracking-wider text-slate-500 flex items-center gap-2">
              <Award className="w-4 h-4 text-indigo-600" />
              Existing Loyalty Tiers in Firestore
            </h4>

            {loading ? (
              <div className="text-center py-12 text-slate-400 text-xs italic">
                Loading levels...
              </div>
            ) : tiers.length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-xs">
                No custom tiers configured. Add one on the left to begin!
              </div>
            ) : (
              <div className="space-y-4">
                {tiers.map((tier) => (
                  <div 
                    key={tier.id} 
                    className="border border-slate-150 rounded-xl p-4 bg-slate-50/50 hover:bg-slate-50 transition flex flex-col md:flex-row md:items-start justify-between gap-4 shadow-xs"
                  >
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 font-mono font-black text-[9px] rounded-md tracking-wider border uppercase ${tier.badgeColor}`}>
                          {tier.name}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          (Qualifies at {tier.minPoints.toLocaleString()} pts)
                        </span>
                      </div>

                      <div className="space-y-1">
                        <p className="text-xs font-mono font-medium text-slate-600 flex items-center gap-1.5">
                          <TrendingUp className="w-3.5 h-3.5 text-slate-400" />
                          Earn rate: <strong className="text-slate-800">{tier.pointConversionRate} Points</strong> per $1 spent
                        </p>
                        
                        <div className="pt-1.5 border-t border-slate-200/50">
                          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Tier Benefits:</p>
                          <p className="text-[11px] text-slate-600 leading-relaxed font-light whitespace-pre-line">
                            {tier.benefits}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex md:flex-col items-center justify-end gap-2 shrink-0 self-center md:self-stretch">
                      <button
                        type="button"
                        onClick={() => handleEditInit(tier)}
                        title="Edit tier specifications"
                        className="flex items-center gap-1 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 p-2 rounded-lg text-xs font-bold transition shadow-xs"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteTier(tier.id, tier.name)}
                        title="Delete loyalty tier"
                        className="flex items-center gap-1 bg-white hover:bg-red-50 border border-slate-200 text-red-600 p-2 rounded-lg text-xs font-bold transition shadow-xs"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
