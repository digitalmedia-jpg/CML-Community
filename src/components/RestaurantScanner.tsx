import React, { useState, useEffect, useMemo } from "react";
import { 
  Search, 
  Award, 
  Gift, 
  User, 
  Users,
  Plus, 
  UserPlus, 
  CheckCircle, 
  Database, 
  AlertCircle, 
  RefreshCw, 
  Sparkles,
  Utensils,
  Receipt,
  X,
  CreditCard,
  History,
  Download,
  Mail,
  Phone,
  ChevronRight,
  TrendingUp,
  Check,
  Award as AwardIcon,
  Edit
} from "lucide-react";
import { 
  db,
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  setDoc, 
  addDoc, 
  serverTimestamp 
} from "../lib/firebase";
import { motion, AnimatePresence } from "motion/react";
import RewardsConfigurator from "./RewardsConfigurator";

interface GuestProfile {
  id: string; // The Card ID (e.g. RP00001)
  fullName: string;
  email: string;
  phone: string;
  visitCount: number;
  rewardPoints: number;
  lastVisited: any;
  createdAt: any;
}

interface VisitLog {
  id: string;
  cardId: string;
  receiptNumber: string;
  billAmount: number;
  pointsAwarded: number;
  type: "visit" | "redemption";
  timestamp: any;
}

interface RestaurantScannerProps {
  companyId: string;
  initialSubTab?: string;
  onSubTabChange?: (tab: string) => void;
  prefilledRewardsMember?: { email: string; fullName: string } | null;
  onClearPrefilledRewards?: () => void;
}

export function RestaurantScanner({ companyId, prefilledRewardsMember, onClearPrefilledRewards }: RestaurantScannerProps) {
  // Core states
  const [guests, setGuests] = useState<GuestProfile[]>([]);
  const [selectedProfile, setSelectedProfile] = useState<GuestProfile | null>(null);
  const [recentVisits, setRecentVisits] = useState<VisitLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingVisits, setLoadingVisits] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [guestSortBy, setGuestSortBy] = useState<"latest" | "name" | "points">("latest");
  const [isCardBack, setIsCardBack] = useState(false);
  
  // Modals / Form toggles
  const [showLogVisitModal, setShowLogVisitModal] = useState(false);

  // Edit guest profile states
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);
  const [editFullName, setEditFullName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editError, setEditError] = useState("");
  const [editSuccess, setEditSuccess] = useState("");
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);

  // New guest registration fields
  const [newFullName, setNewFullName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Award points fields
  const [billAmount, setBillAmount] = useState("");
  const [receiptNumber, setReceiptNumber] = useState("");
  const [pointsToAward, setPointsToAward] = useState("");
  const [visitLogError, setVisitLogError] = useState("");
  const [visitLogSuccess, setVisitLogSuccess] = useState(false);
  const [isLogging, setIsLogging] = useState(false);

  // Dynamic Membership Benefits State
  const [benefits, setBenefits] = useState<string[]>([
    "Priority Dining Reservations",
    "$1 Spent = 10 Reward Points",
    "Free Resort Day Pass at 7K Pts",
    "Standard Room Upgrades",
    "Welcome Drinks on Arrival",
    "Elite Member Rates"
  ]);
  const [showBenefitsModal, setShowBenefitsModal] = useState(false);
  const [editingBenefitsList, setEditingBenefitsList] = useState<string[]>([]);
  const [newBenefitText, setNewBenefitText] = useState("");
  const [isSavingBenefits, setIsSavingBenefits] = useState(false);

  const [showRewardsConfigurator, setShowRewardsConfigurator] = useState(false);
  const [tiersConfig, setTiersConfig] = useState<any[]>([]);

  const fetchTiersConfig = async () => {
    try {
      const colRef = collection(db, `rewards-config-${companyId}-tiers`);
      const snapshot = await getDocs(colRef);
      const list: any[] = [];
      snapshot.docs.forEach((doc) => {
        list.push({ id: doc.id, ...doc.data() });
      });
      if (list.length > 0) {
        list.sort((a, b) => a.minPoints - b.minPoints);
        setTiersConfig(list);
      } else {
        setTiersConfig([]);
      }
    } catch (e) {
      console.error("Error loading tiers config:", e);
      setTiersConfig([]);
    }
  };

  // Capture pre-filled subscriber conversion info
  useEffect(() => {
    if (prefilledRewardsMember) {
      setNewFullName(prefilledRewardsMember.fullName);
      setNewEmail(prefilledRewardsMember.email);
      setNewPhone(""); // Reset phone
      setFormError("");
      setFormSuccess("");
      // Clear prefilled state to avoid recurrent updates
      if (onClearPrefilledRewards) {
        onClearPrefilledRewards();
      }
    }
  }, [prefilledRewardsMember, onClearPrefilledRewards]);

  // Load benefits and tiers on change of companyId
  useEffect(() => {
    const fetchBenefits = async () => {
      try {
        const configDocRef = doc(db, `rewards-config-${companyId}`, "benefits");
        const docSnap = await getDoc(configDocRef);
        if (docSnap && typeof docSnap.exists === "function" && docSnap.exists()) {
          const data = docSnap.data();
          if (data && Array.isArray(data.list)) {
            setBenefits(data.list);
            return;
          }
        }
        // Fallback to localStorage
        const saved = localStorage.getItem(`cml_rewards_benefits_${companyId}`);
        if (saved) {
          setBenefits(JSON.parse(saved));
        }
      } catch (e) {
        console.error("Error fetching rewards benefits configuration:", e);
      }
    };
    fetchBenefits();
    fetchTiersConfig();
  }, [companyId]);

  const handleOpenBenefitsModal = () => {
    setEditingBenefitsList([...benefits]);
    setNewBenefitText("");
    setShowBenefitsModal(true);
  };

  const handleSaveBenefits = async () => {
    setIsSavingBenefits(true);
    try {
      const configDocRef = doc(db, `rewards-config-${companyId}`, "benefits");
      await setDoc(configDocRef, { list: editingBenefitsList });
      setBenefits(editingBenefitsList);
      try {
        localStorage.setItem(`cml_rewards_benefits_${companyId}`, JSON.stringify(editingBenefitsList));
      } catch (e) {}
      alert("Membership benefits list updated successfully!");
      setShowBenefitsModal(false);
    } catch (e) {
      console.error("Failed to save benefits list:", e);
      alert("Failed to save benefits on server. Local backup updated.");
      setBenefits(editingBenefitsList);
      try {
        localStorage.setItem(`cml_rewards_benefits_${companyId}`, JSON.stringify(editingBenefitsList));
      } catch (e) {}
      setShowBenefitsModal(false);
    } finally {
      setIsSavingBenefits(false);
    }
  };

  // Load Guests from database
  const fetchGuests = async (autoSelectId?: string) => {
    try {
      setLoading(true);
      const colRef = collection(db, `restaurant-guests-${companyId}`);
      const snapshot = await getDocs(colRef);
      const list: GuestProfile[] = [];
      
      snapshot.forEach(docSnap => {
        const data = docSnap.data();
        list.push({
          id: docSnap.id,
          fullName: data.fullName || "",
          email: data.email || "",
          phone: data.phone || "",
          visitCount: data.visitCount || 0,
          rewardPoints: data.rewardPoints || 0,
          lastVisited: data.lastVisited,
          createdAt: data.createdAt
        });
      });

      if (list.length === 0) {
        console.log("[RestaurantScanner] No guest profiles in Firestore. Seeding initial samples...");
        const sampleProfiles = [
          {
            id: "CML-RE-001",
            fullName: "Charles (VIP Member)",
            email: "charles.viti@cml.com.fj",
            phone: "+679 883 2910",
            visitCount: 14,
            rewardPoints: 6850,
          },
          {
            id: "CML-RE-002",
            fullName: "Savenaca Radrodro",
            email: "savenaca.r@ramada.com",
            phone: "+679 992 1044",
            visitCount: 5,
            rewardPoints: 2400,
          },
          {
            id: "CML-RE-003",
            fullName: "Mereoni Nasilasila",
            email: "mereoni.n@wyndhamfiji.com",
            phone: "+679 775 3215",
            visitCount: 9,
            rewardPoints: 4800,
          }
        ];

        for (const profile of sampleProfiles) {
          const guestRef = doc(db, `restaurant-guests-${companyId}`, profile.id);
          await setDoc(guestRef, {
            fullName: profile.fullName,
            email: profile.email,
            phone: profile.phone,
            visitCount: profile.visitCount,
            rewardPoints: profile.rewardPoints,
            createdAt: new Date(),
            lastVisited: new Date()
          });

          const colVisits = collection(db, `restaurant-guests-${companyId}`, profile.id, "visits");
          await addDoc(colVisits, {
            cardId: profile.id,
            receiptNumber: "INV-2026-801",
            billAmount: 125.50,
            pointsAwarded: 1350,
            type: "visit",
            timestamp: new Date()
          });
        }

        // Re-fetch after seeding
        const secondSnapshot = await getDocs(colRef);
        const secondList: GuestProfile[] = [];
        secondSnapshot.forEach(docSnap => {
          const data = docSnap.data();
          secondList.push({
            id: docSnap.id,
            fullName: data.fullName || "",
            email: data.email || "",
            phone: data.phone || "",
            visitCount: data.visitCount || 0,
            rewardPoints: data.rewardPoints || 0,
            lastVisited: data.lastVisited,
            createdAt: data.createdAt
          });
        });
        setGuests(secondList);
        if (secondList.length > 0) {
          setSelectedProfile(secondList[0]);
        }
      } else {
        setGuests(list);
        if (autoSelectId) {
          const found = list.find(g => g.id === autoSelectId);
          if (found) setSelectedProfile(found);
        } else if (!selectedProfile && list.length > 0) {
          setSelectedProfile(list[0]);
        } else if (selectedProfile) {
          // Keep current selection hydrated with latest points/visits
          const updated = list.find(g => g.id === selectedProfile.id);
          if (updated) setSelectedProfile(updated);
        }
      }
    } catch (err) {
      console.error("Error loading guests:", err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch visits log for selected member
  const fetchVisits = async (cardId: string) => {
    try {
      setLoadingVisits(true);
      const colVisits = collection(db, `restaurant-guests-${companyId}`, cardId, "visits");
      const snapshot = await getDocs(colVisits);
      const list: VisitLog[] = [];
      snapshot.forEach(docSnap => {
        const data = docSnap.data();
        list.push({
          id: docSnap.id,
          cardId: data.cardId || cardId,
          receiptNumber: data.receiptNumber || "N/A",
          billAmount: data.billAmount || 0,
          pointsAwarded: data.pointsAwarded || 0,
          type: data.type || "visit",
          timestamp: data.timestamp
        });
      });

      // Sort client-side by timestamp descending
      list.sort((a, b) => {
        const timeA = a.timestamp?.seconds ? a.timestamp.seconds * 1000 : (a.timestamp ? new Date(a.timestamp).getTime() : 0);
        const timeB = b.timestamp?.seconds ? b.timestamp.seconds * 1000 : (b.timestamp ? new Date(b.timestamp).getTime() : 0);
        return timeB - timeA;
      });

      setRecentVisits(list);
    } catch (err) {
      console.error("Error fetching visits:", err);
    } finally {
      setLoadingVisits(false);
    }
  };

  // Load database on mount
  useEffect(() => {
    fetchGuests();
  }, [companyId]);

  // Load visits whenever active member changes
  useEffect(() => {
    if (selectedProfile) {
      fetchVisits(selectedProfile.id);
    } else {
      setRecentVisits([]);
    }
    setIsCardBack(false);
  }, [selectedProfile]);

  // Generate unique sequential membership ID
  const generateNextMemberId = (): string => {
    let maxNum = 0;
    const arr = Array.isArray(guests) ? guests : [];
    arr.forEach(g => {
      const id = g.id || "";
      const match = id.match(/\d+/);
      if (match) {
        const num = parseInt(match[0], 10);
        if (num > maxNum) maxNum = num;
      }
    });
    const nextNum = maxNum > 0 ? maxNum + 1 : (arr.length > 0 ? arr.length + 1 : 1);
    return `RP${String(nextNum).padStart(5, "0")}`;
  };

  // Register New Member
  const handleCreateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    setFormSuccess("");
    
    if (!newFullName.trim()) {
      setFormError("Guest Full Name is required.");
      return;
    }

    setIsSubmitting(true);
    const newId = generateNextMemberId();

    try {
      const docRef = doc(db, `restaurant-guests-${companyId}`, newId);
      const existSnap = await getDoc(docRef);
      if (existSnap.exists()) {
        setFormError("The generated Membership ID already exists. Please try again.");
        setIsSubmitting(false);
        return;
      }

      const profile = {
        fullName: newFullName.trim(),
        email: newEmail.trim() || `${newId.toLowerCase()}@cml-rewards.com`,
        phone: newPhone.trim() || "+679",
        visitCount: 0,
        rewardPoints: 0,
        lastVisited: null,
        createdAt: new Date(),
      };

      await setDoc(docRef, profile);
      
      // Add first visit log to initialize
      const colVisits = collection(db, `restaurant-guests-${companyId}`, newId, "visits");
      await addDoc(colVisits, {
        cardId: newId,
        receiptNumber: "MEMBERSHIP-CREATION",
        billAmount: 0,
        pointsAwarded: 100, // 100 base sign up points!
        type: "visit",
        timestamp: new Date()
      });

      // Update reward points to include base sign up points
      await setDoc(docRef, { ...profile, rewardPoints: 100, visitCount: 1 }, { merge: true });

      setFormSuccess(`Successfully registered ${newFullName.trim()} with ID: ${newId}!`);
      setNewFullName("");
      setNewEmail("");
      setNewPhone("");
      
      // Refetch and auto select this new member
      await fetchGuests(newId);
    } catch (err) {
      console.error("Error creating member profile:", err);
      setFormError("Failed to persist member registration in cloud database.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Update Existing Member Profile Details
  const handleOpenEditProfileModal = () => {
    if (!selectedProfile) return;
    setEditFullName(selectedProfile.fullName || "");
    setEditEmail(selectedProfile.email || "");
    setEditPhone(selectedProfile.phone || "");
    setEditError("");
    setEditSuccess("");
    setShowEditProfileModal(true);
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProfile) return;
    if (!editFullName.trim()) {
      setEditError("Full Name is required.");
      return;
    }

    setIsUpdatingProfile(true);
    setEditError("");
    setEditSuccess("");

    try {
      const docRef = doc(db, `restaurant-guests-${companyId}`, selectedProfile.id);
      
      const updatedFields = {
        fullName: editFullName.trim(),
        email: editEmail.trim(),
        phone: editPhone.trim()
      };

      await setDoc(docRef, updatedFields, { merge: true });
      
      setEditSuccess("Member details updated successfully!");
      
      // Update local state for selected profile
      setSelectedProfile(prev => prev ? { ...prev, ...updatedFields } : null);
      
      // Refresh list
      await fetchGuests(selectedProfile.id);
      
      setTimeout(() => {
        setShowEditProfileModal(false);
      }, 1200);
    } catch (err) {
      console.error("Error updating member profile:", err);
      setEditError("Failed to update member registration in cloud database.");
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  // Log Restaurant Visit & Award Points ($1 spent = 10 pts + 100 base)
  const handleLogVisit = async (e: React.FormEvent) => {
    e.preventDefault();
    setVisitLogError("");
    setVisitLogSuccess(false);

    if (!selectedProfile) return;
    if (!billAmount || isNaN(Number(billAmount)) || Number(billAmount) < 0) {
      setVisitLogError("Please enter a valid bill amount.");
      return;
    }

    setIsLogging(true);
    const amt = parseFloat(billAmount);
    const computedPoints = Math.round(amt * 10) + 100; // $1 = 10 pts + 100 base
    const receiptRef = receiptNumber.trim() || `REC-${Math.floor(100000 + Math.random() * 900000)}`;

    try {
      // 1. Add visit document
      const visitsColRef = collection(db, `restaurant-guests-${companyId}`, selectedProfile.id, "visits");
      await addDoc(visitsColRef, {
        cardId: selectedProfile.id,
        receiptNumber: receiptRef,
        billAmount: amt,
        pointsAwarded: computedPoints,
        type: "visit",
        timestamp: new Date()
      });

      // 2. Update parent profile
      const guestRef = doc(db, `restaurant-guests-${companyId}`, selectedProfile.id);
      const nextPoints = (selectedProfile.rewardPoints || 0) + computedPoints;
      const nextVisits = (selectedProfile.visitCount || 0) + 1;

      await setDoc(guestRef, {
        rewardPoints: nextPoints,
        visitCount: nextVisits,
        lastVisited: new Date()
      }, { merge: true });

      setVisitLogSuccess(true);
      setBillAmount("");
      setReceiptNumber("");
      setPointsToAward("");
      
      // Refresh current records
      await fetchGuests(selectedProfile.id);
      setTimeout(() => {
        setShowLogVisitModal(false);
        setVisitLogSuccess(false);
      }, 1500);
    } catch (err) {
      console.error("Error logging visit:", err);
      setVisitLogError("Could not update transaction history.");
    } finally {
      setIsLogging(false);
    }
  };

  // Redeem Points for Vouchers
  const handleRedeemPoints = async (pointsCost: number, title: string) => {
    if (!selectedProfile) return;
    if (selectedProfile.rewardPoints < pointsCost) {
      alert("Insufficient reward points to claim this privilege.");
      return;
    }

    if (!confirm(`Are you sure you want to redeem ${pointsCost} points for "${title}"?`)) {
      return;
    }

    try {
      const visitsColRef = collection(db, `restaurant-guests-${companyId}`, selectedProfile.id, "visits");
      await addDoc(visitsColRef, {
        cardId: selectedProfile.id,
        receiptNumber: "REWARD-REDEMPTION",
        billAmount: 0,
        pointsAwarded: -pointsCost,
        type: "redemption",
        timestamp: new Date()
      });

      const guestRef = doc(db, `restaurant-guests-${companyId}`, selectedProfile.id);
      const nextPoints = selectedProfile.rewardPoints - pointsCost;

      await setDoc(guestRef, {
        rewardPoints: nextPoints
      }, { merge: true });

      alert(`Successfully claimed: ${title}! Dedicated voucher has been registered.`);
      await fetchGuests(selectedProfile.id);
    } catch (err) {
      console.error("Error redeeming points:", err);
      alert("Redemption failed. Check internet link.");
    }
  };

  // Automatically calculate points to show to user when they enter bill amount
  useEffect(() => {
    if (billAmount && !isNaN(Number(billAmount))) {
      const pts = Math.round(parseFloat(billAmount) * 10) + 100;
      setPointsToAward(String(pts));
    } else {
      setPointsToAward("");
    }
  }, [billAmount]);

  // Export ledger history to CSV
  const handleExportCSV = () => {
    if (!selectedProfile || recentVisits.length === 0) return;
    
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Date,Receipt Number,Bill Amount (FJD),Points Awarded,Transaction Type\n";
    
    recentVisits.forEach((v) => {
      const dt = v.timestamp ? new Date(v.timestamp.seconds ? v.timestamp.seconds * 1000 : v.timestamp).toLocaleDateString() : "Just now";
      csvContent += `"${dt}","${v.receiptNumber}",$${v.billAmount?.toFixed(2)},${v.pointsAwarded},"${v.type}"\n`;
    });
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `CML_Rewards_Ledger_${selectedProfile.id}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filter and sort members list
  const sortedGuests = useMemo(() => {
    const arr = Array.isArray(guests) ? guests : [];
    const filtered = arr.filter(g => {
      const search = searchQuery.toLowerCase().trim();
      return g.fullName.toLowerCase().includes(search) || 
             g.id.toLowerCase().includes(search) ||
             g.email.toLowerCase().includes(search);
    });

    return [...filtered].sort((a, b) => {
      if (guestSortBy === "name") {
        return a.fullName.localeCompare(b.fullName);
      } else if (guestSortBy === "points") {
        return (b.rewardPoints || 0) - (a.rewardPoints || 0);
      } else {
        // latest
        const timeA = a.createdAt?.seconds ? a.createdAt.seconds : (a.createdAt ? new Date(a.createdAt).getTime() : 0);
        const timeB = b.createdAt?.seconds ? b.createdAt.seconds : (b.createdAt ? new Date(b.createdAt).getTime() : 0);
        return timeB - timeA;
      }
    });
  }, [guests, searchQuery, guestSortBy]);

  // Tier calculation helper
  const getTierDetails = (points: number) => {
    if (tiersConfig && tiersConfig.length > 0) {
      // Find the active tier: the tier with the highest minPoints that is <= points
      let activeIndex = -1;
      for (let i = 0; i < tiersConfig.length; i++) {
        if (points >= tiersConfig[i].minPoints) {
          activeIndex = i;
        }
      }

      if (activeIndex !== -1) {
        const active = tiersConfig[activeIndex];
        const next = activeIndex < tiersConfig.length - 1 ? tiersConfig[activeIndex + 1] : null;
        
        let progressPercent = 100;
        let pointsToNext = null;
        let nextTierPoints = null;

        if (next) {
          nextTierPoints = next.minPoints;
          const range = next.minPoints - active.minPoints;
          progressPercent = range > 0 ? Math.min(100, Math.max(0, ((points - active.minPoints) / range) * 100)) : 100;
          pointsToNext = next.minPoints - points;
        }

        return {
          currentTier: active.name,
          nextTier: next ? next.name : null,
          nextTierPoints,
          progressPercent,
          pointsToNext,
          color: active.color || "from-blue-400 to-indigo-500",
          bg: active.bg || "bg-blue-500",
          badgeColor: active.badgeColor || "bg-blue-100 text-blue-950 border-blue-200",
          benefits: active.benefits || ""
        };
      }
    }

    if (points >= 40000) {
      return {
        currentTier: "DIAMOND",
        nextTier: null,
        nextTierPoints: null,
        progressPercent: 100,
        pointsToNext: null,
        color: "from-cyan-550 to-blue-600",
        bg: "bg-cyan-500",
        badgeColor: "bg-cyan-100 text-cyan-950 border-cyan-200",
        benefits: "✦ VIP Butler Service, ✦ Executive Lounge Access, ✦ Presidential Airport Transfer"
      };
    } else if (points >= 15000) {
      const nextTierPoints = 40000;
      const progressPercent = Math.min(100, Math.max(0, ((points - 15000) / (nextTierPoints - 15000)) * 100));
      return {
        currentTier: "PLATINUM",
        nextTier: "DIAMOND",
        nextTierPoints,
        progressPercent,
        pointsToNext: nextTierPoints - points,
        color: "from-purple-500 to-pink-600",
        bg: "bg-purple-600",
        badgeColor: "bg-purple-100 text-purple-950 border-purple-200",
        benefits: "✦ Free Resort Day Pass, ✦ Suite Upgrades, ✦ Early Check-in & Late Checkout"
      };
    } else if (points >= 5000) {
      const nextTierPoints = 15000;
      const progressPercent = Math.min(100, Math.max(0, ((points - 5000) / (nextTierPoints - 5000)) * 100));
      return {
        currentTier: "GOLD",
        nextTier: "PLATINUM",
        nextTierPoints,
        progressPercent,
        pointsToNext: nextTierPoints - points,
        color: "from-amber-400 to-[#C5A02D]",
        bg: "bg-[#C5A02D]",
        badgeColor: "bg-amber-100 text-amber-950 border-amber-200",
        benefits: "✦ Standard Room Upgrades, ✦ Priority Reservations, ✦ 15% Spa Discount"
      };
    } else if (points >= 1500) {
      const nextTierPoints = 5000;
      const progressPercent = Math.min(100, Math.max(0, ((points - 1500) / (nextTierPoints - 1500)) * 100));
      return {
        currentTier: "SILVER",
        nextTier: "GOLD",
        nextTierPoints,
        progressPercent,
        pointsToNext: nextTierPoints - points,
        color: "from-slate-400 to-slate-600",
        bg: "bg-slate-500",
        badgeColor: "bg-slate-100 text-slate-950 border-slate-200",
        benefits: "✦ Priority Dining Reservations, ✦ Elite Member Rates, ✦ Welcome Drink Upgrade"
      };
    } else {
      const nextTierPoints = 1500;
      const progressPercent = Math.min(100, Math.max(0, (points / nextTierPoints) * 100));
      return {
        currentTier: "BLUE",
        nextTier: "SILVER",
        nextTierPoints,
        progressPercent,
        pointsToNext: nextTierPoints - points,
        color: "from-blue-400 to-indigo-500",
        bg: "bg-blue-500",
        badgeColor: "bg-blue-100 text-blue-950 border-blue-200",
        benefits: "✦ $1 Spent = 10 Reward Points, ✦ Welcome Drinks on Arrival, ✦ Elite Member Rates"
      };
    }
  };

  const activeTier = selectedProfile ? getTierDetails(selectedProfile.rewardPoints || 0) : null;

  return (
    <div className="w-full flex flex-col gap-6" id="restaurant-scanner-module">
      
      {/* HEADER BAR */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-black/5" id="scanner-title-area">
        <div>
          <span className="text-[8px] font-display uppercase tracking-widest font-black text-[#C5A02D] block mb-1.5">
            CML Privilege Club Fiji
          </span>
          <h1 className="text-xl md:text-2xl font-serif text-slate-900 flex items-center gap-2.5">
            <Award className="text-[#C5A02D]" size={24} />
            CML Rewards Database & Member Portal
          </h1>
          <p className="text-[11px] text-slate-500 max-w-2xl mt-1 font-light leading-relaxed">
            Register new Privilege Club loyalty cardholders, manage rewards tier points balances in real-time, issue exclusive milestone certificates, and check active status.
          </p>
        </div>
        <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 px-3 py-1.5">
          <Database size={13} className="text-[#C5A02D] animate-pulse" />
          <span className="text-[9px] font-mono font-bold uppercase text-slate-600">CONNECTED TO CLOUD FIRESTORE</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* LEFT SIDE: DIRECT MEMBER REGISTRATION & SEARCHABLE DIRECTORY */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          
          {/* 1. REWARDS MEMBER REGISTRATION FORM */}
          <div className="bg-white border border-slate-150 shadow-sm p-6">
            <div className="flex items-center gap-2 mb-4 border-b border-slate-100 pb-3">
              <UserPlus className="text-[#C5A02D]" size={16} />
              <h2 className="text-xs font-display font-black uppercase tracking-widest text-slate-900">
                Privilege Member Signup
              </h2>
            </div>

            <form onSubmit={handleCreateProfile} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-[9px] uppercase tracking-wider font-display font-black text-slate-450">
                  Guest Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="E.g. Charles Cebujano"
                  value={newFullName}
                  onChange={e => setNewFullName(e.target.value)}
                  className="border border-slate-200 px-3 py-2 text-xs rounded-none outline-none focus:border-[#C5A02D] transition-colors"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[9px] uppercase tracking-wider font-display font-black text-slate-450">
                  Email Address
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-slate-400">
                    <Mail size={12} />
                  </span>
                  <input
                    type="email"
                    placeholder="E.g. charles@cml.com.fj"
                    value={newEmail}
                    onChange={e => setNewEmail(e.target.value)}
                    className="w-full border border-slate-200 pl-8 pr-3 py-2 text-xs rounded-none outline-none focus:border-[#C5A02D] transition-colors"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[9px] uppercase tracking-wider font-display font-black text-slate-450">
                  Phone Number
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-slate-400">
                    <Phone size={12} />
                  </span>
                  <input
                    type="text"
                    placeholder="E.g. +679 883 2910"
                    value={newPhone}
                    onChange={e => setNewPhone(e.target.value)}
                    className="w-full border border-slate-200 pl-8 pr-3 py-2 text-xs rounded-none outline-none focus:border-[#C5A02D] transition-colors"
                  />
                </div>
              </div>

              {formError && (
                <div className="p-2.5 bg-red-50 border border-red-250 text-red-750 text-[10px] flex items-center gap-2">
                  <AlertCircle size={12} />
                  <span>{formError}</span>
                </div>
              )}

              {formSuccess && (
                <div className="p-2.5 bg-green-50 border border-green-250 text-green-800 text-[10px] flex items-center gap-2">
                  <CheckCircle size={12} />
                  <span>{formSuccess}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-slate-950 hover:bg-[#C5A02D] text-white py-2.5 px-4 text-[10px] font-display uppercase tracking-wider font-extrabold transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="animate-spin" size={12} />
                    <span>Adding to cloud...</span>
                  </>
                ) : (
                  <>
                    <UserPlus size={12} />
                    <span>Register New Rewards Member</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* 2. SEARCHABLE MEMBERS DIRECTORY */}
          <div className="bg-white border border-slate-150 shadow-sm p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 pb-2 border-b border-slate-100">
              <h3 className="text-[10px] uppercase font-display font-black tracking-widest text-[#C5A02D] flex items-center gap-1.5">
                <Users size={14} /> Registered Members Directory ({sortedGuests.length})
              </h3>
              <div className="flex items-center gap-2">
                <select
                  value={guestSortBy}
                  onChange={(e) => setGuestSortBy(e.target.value as any)}
                  className="bg-white border border-slate-200 px-1.5 py-0.5 text-[10px] font-mono outline-none focus:border-[#C5A02D] text-slate-800 cursor-pointer"
                >
                  <option value="latest">Latest Added</option>
                  <option value="name">Name (A-Z)</option>
                  <option value="points">Points (Highest)</option>
                </select>
                <button onClick={() => fetchGuests()} className="text-slate-450 hover:text-black p-1" title="Sync database cache">
                  <RefreshCw size={11} className={loading ? "animate-spin" : ""} />
                </button>
              </div>
            </div>

            <div className="relative mb-3">
              <input
                type="text"
                placeholder="Search by name, ID, or email..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 pl-8 pr-3 py-1.5 text-[11px] rounded-none outline-none focus:border-[#C5A02D]"
              />
              <Search size={12} className="absolute left-2.5 top-2.5 text-slate-400" />
            </div>

            <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto pr-1">
              {loading ? (
                <div className="p-6 text-center">
                  <span className="text-[10px] font-mono text-slate-400 animate-pulse">Syncing with Firestore...</span>
                </div>
              ) : sortedGuests.length === 0 ? (
                <div className="p-6 text-center text-slate-400 italic text-xs">
                  No active members match your query.
                </div>
              ) : (
                sortedGuests.map((gst) => {
                  const isSelected = selectedProfile?.id === gst.id;
                  const points = gst.rewardPoints || 0;
                  const info = getTierDetails(points);

                  return (
                    <button
                      key={gst.id}
                      onClick={() => setSelectedProfile(gst)}
                      className={`w-full text-left p-3.5 transition-all flex items-center justify-between border border-transparent ${
                        isSelected 
                          ? 'bg-[#C5A02D]/10 border-l-4 border-l-[#C5A02D] border-y-slate-100' 
                          : 'hover:bg-slate-50 border-b border-b-slate-100'
                      }`}
                    >
                      <div>
                        <div className="text-xs font-serif font-bold text-slate-900">
                          {gst.fullName}
                        </div>
                        <div className="text-[9px] font-mono text-slate-500 flex items-center gap-1.5 mt-1">
                          <span className={`px-1 rounded text-[7.5px] font-bold ${info.badgeColor} uppercase tracking-wider border`}>
                            {info.currentTier}
                          </span>
                          <span>ID: {gst.id}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-bold text-slate-800 block">
                          {points.toLocaleString()} pts
                        </span>
                        <span className="text-[8px] text-slate-400 block font-mono mt-0.5">
                          {gst.visitCount} visits
                        </span>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>

        </div>

        {/* RIGHT SIDE: REWARDS MEMBER DASHBOARD & POINTS PROGRESS BAR */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          {selectedProfile ? (
            <div className="bg-white border border-slate-150 shadow-sm p-8 flex flex-col gap-6">
              
              {/* Reward qualified top announcement */}
              {selectedProfile.rewardPoints >= 7000 && (
                <div className="p-4 bg-amber-50 border border-amber-200 text-amber-900 rounded-none flex items-start gap-3.5">
                  <Sparkles size={20} className="text-[#C5A02D] shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-bold font-serif italic text-slate-900">Qualified for CML Privilege Voucher!</h4>
                    <p className="text-[10px] text-slate-650 mt-1 leading-normal">
                      This member has reached the 7,000 loyalty points threshold! Claim a complimentary luxury buffet or resort privilege card below.
                    </p>
                  </div>
                </div>
              )}

              {/* Dashboard Member Info Header */}
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-4 border-b border-slate-100">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-lg md:text-xl font-serif text-slate-900">{selectedProfile.fullName}</h2>
                    {activeTier && (
                      <span className={`text-[8px] font-mono px-1.5 py-0.5 uppercase tracking-widest font-extrabold rounded-sm border ${activeTier.badgeColor}`}>
                        {activeTier.currentTier} MEMBER
                      </span>
                    )}
                  </div>
                  <span className="text-[9px] font-mono bg-slate-100 text-slate-650 px-1.5 py-0.5 uppercase tracking-widest font-black inline-block mt-1">
                    Membership ID: {selectedProfile.id}
                  </span>
                </div>

                <div className="flex items-center gap-2 w-full md:w-auto">
                  <button
                    onClick={handleOpenEditProfileModal}
                    className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-600 text-slate-950 px-4 py-2.5 text-[9px] font-display uppercase tracking-wider font-extrabold transition-all shadow-sm"
                  >
                    <Edit size={13} />
                    <span>Edit Profile</span>
                  </button>
                  <button
                    onClick={() => setShowLogVisitModal(true)}
                    className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-slate-950 hover:bg-[#C5A02D] text-white px-4 py-2.5 text-[9px] font-display uppercase tracking-wider font-extrabold transition-all"
                  >
                    <Receipt size={13} />
                    <span>Award Visit Points</span>
                  </button>
                </div>
              </div>

              {/* INTERACTIVE 3D FLIPPABLE DIGITAL CARD */}
              <div className="flex flex-col items-center gap-4 py-4 bg-slate-50/50 border border-slate-150 p-6 rounded-none">
                <span className="text-[8px] font-display font-bold uppercase tracking-widest text-[#C5A02D] flex items-center gap-1">
                  <CreditCard size={12} /> Privilege Digital Pass (Tap Card to Flip)
                </span>
                
                <div 
                  className="w-full max-w-sm h-56 relative cursor-pointer"
                  style={{ perspective: "1000px" }}
                  onClick={() => setIsCardBack(!isCardBack)}
                >
                  <div 
                    className="w-full h-full relative"
                    style={{
                      transformStyle: "preserve-3d",
                      transition: "transform 0.6s cubic-bezier(0.4, 0, 0.2, 1)",
                      transform: isCardBack ? "rotateY(180deg)" : "rotateY(0deg)"
                    }}
                  >
                    
                    {/* CARD FRONT */}
                    <div 
                      className="absolute inset-0 w-full h-full rounded-2xl p-6 bg-gradient-to-br from-[#dfba6b] via-[#bfa054] to-[#876a26] text-white shadow-xl border border-yellow-300/20 flex flex-col justify-between overflow-hidden"
                      style={{ backfaceVisibility: "hidden" }}
                    >
                      <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/5 to-white/0 pointer-events-none transform -skew-x-12" />
                      
                      <div className="flex justify-between items-start">
                        <div className="flex flex-col">
                          <span className="text-[8px] font-black tracking-widest uppercase font-display leading-tight">CML COVE MANAGEMENT LIMITED</span>
                          <span className="text-[6px] tracking-wider uppercase font-mono opacity-80">FIJI PRIVILEGE CLUB</span>
                        </div>
                        <div className="text-right">
                          <span className="text-[8px] font-serif tracking-widest font-black text-white bg-black/35 px-2 py-0.5 rounded border border-white/15 uppercase">
                            {activeTier?.currentTier}
                          </span>
                        </div>
                      </div>

                      <div className="my-auto text-center">
                        <h2 className="text-lg md:text-xl font-serif tracking-[0.25em] font-light text-yellow-50">
                          PRIVILEGE MEMBER
                        </h2>
                      </div>

                      <div className="grid grid-cols-2 gap-2 border-t border-white/20 pt-3">
                        <div className="flex flex-col">
                          <span className="text-[6.5px] uppercase tracking-wider font-mono opacity-75">CARDHOLDER NAME</span>
                          <span className="text-[11px] font-semibold uppercase truncate font-serif">{selectedProfile.fullName}</span>
                        </div>
                        <div className="flex flex-col text-right">
                          <span className="text-[6.5px] uppercase tracking-wider font-mono opacity-75">MEMBERSHIP NO.</span>
                          <span className="text-[11px] font-mono font-bold">{selectedProfile.id}</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[6.5px] uppercase tracking-wider font-mono opacity-75">LOYALTY TIER</span>
                          <span className="text-[9.5px] font-serif font-bold text-yellow-100">
                            {activeTier?.currentTier} STATUS
                          </span>
                        </div>
                        <div className="flex flex-col text-right">
                          <span className="text-[6.5px] uppercase tracking-wider font-mono opacity-75">MEMBER SINCE</span>
                          <span className="text-[11px] font-mono">
                            {selectedProfile.createdAt 
                              ? new Date(selectedProfile.createdAt.seconds ? selectedProfile.createdAt.seconds * 1000 : selectedProfile.createdAt).toLocaleDateString("en-US", { month: "2-digit", year: "numeric" })
                              : "06/2026"}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* CARD BACK */}
                    <div 
                      className="absolute inset-0 w-full h-full rounded-2xl p-6 bg-gradient-to-br from-[#876a26] via-[#4d3a0c] to-[#1c1502] text-white shadow-xl border border-yellow-800/20 flex flex-col justify-between overflow-hidden"
                      style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
                    >
                      <div className="flex justify-between items-center border-b border-white/10 pb-2">
                        <span className="text-[8px] font-black tracking-widest uppercase text-yellow-300">EXCLUSIVE MEMBERSHIP BENEFITS</span>
                        <span className="text-[7px] font-mono text-white/55">CML COVE PRIVILEGE</span>
                      </div>

                      <ul className="grid grid-cols-2 gap-y-1.5 gap-x-3 text-[8.5px] font-serif text-yellow-100/90 my-auto">
                        {activeTier && activeTier.benefits ? (
                          activeTier.benefits.split(/,|\n/).map((b: string) => b.trim()).filter(Boolean).map((benefit: string, idx: number) => (
                            <li key={idx} className="flex items-start gap-1">
                              <span className="text-yellow-400 shrink-0">✦</span>
                              <span>{benefit.replace(/^✦\s*/, "")}</span>
                            </li>
                          ))
                        ) : (
                          benefits.map((benefit, idx) => (
                            <li key={idx} className="flex items-start gap-1">
                              <span className="text-yellow-400 shrink-0">✦</span>
                              <span>{benefit}</span>
                            </li>
                          ))
                        )}
                      </ul>

                      <div className="border-t border-white/10 pt-2 flex justify-between items-end">
                        <div className="text-left">
                          <p className="text-[6px] text-white/40 leading-none uppercase">*SUBJECT TO AVAILABILITY. T&CS APPLY.</p>
                          <p className="text-[8px] font-serif font-bold tracking-wider text-yellow-400 mt-1 uppercase">YOUR ISLAND JOURNEY. OUR PASSION.</p>
                        </div>
                        <div className="text-right">
                          <span className="text-[8.5px] font-mono font-bold tracking-widest text-white/80">CML.COM.FJ</span>
                        </div>
                      </div>
                    </div>

                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsCardBack(!isCardBack)}
                    className="text-[9px] uppercase tracking-wider bg-slate-900 hover:bg-[#C5A02D] text-white font-extrabold px-3 py-1 mt-1 transition-all"
                  >
                    🔄 Flip Card Details
                  </button>
                  <button
                    onClick={() => setShowRewardsConfigurator(true)}
                    className="text-[9px] uppercase tracking-wider bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-extrabold px-3 py-1 mt-1 transition-all border border-indigo-200 flex items-center gap-1 shadow-sm"
                  >
                    ⚙️ Rewards Configurator
                  </button>
                  <button
                    onClick={handleOpenBenefitsModal}
                    className="text-[9px] uppercase tracking-wider bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold px-3 py-1 mt-1 transition-all border border-slate-300 flex items-center gap-1"
                  >
                    📝 Edit Benefits List
                  </button>
                </div>
              </div>

              {/* CORE DASHBOARD KPI COUNTERS */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="border border-slate-100 p-4 bg-slate-50 flex flex-col justify-between">
                  <span className="text-[8.5px] uppercase tracking-wider font-extrabold text-slate-400">Total Points Balance</span>
                  <div className="text-2xl font-black text-slate-900 mt-1">{(selectedProfile.rewardPoints || 0).toLocaleString()}</div>
                  <span className="text-[9px] text-[#C5A02D] font-serif italic mt-1">Ready to redeem</span>
                </div>
                <div className="border border-slate-100 p-4 bg-slate-50 flex flex-col justify-between">
                  <span className="text-[8.5px] uppercase tracking-wider font-extrabold text-slate-400">Recorded Hotel Visits</span>
                  <div className="text-2xl font-black text-slate-900 mt-1">{selectedProfile.visitCount || 0}</div>
                  <span className="text-[9px] text-slate-500 font-serif italic mt-1">Loyalty visit history</span>
                </div>
                <div className="border border-slate-100 p-4 bg-slate-50 flex flex-col justify-between">
                  <span className="text-[8.5px] uppercase tracking-wider font-extrabold text-slate-400">Contact details</span>
                  <div className="text-[10px] text-slate-700 font-mono mt-1 break-all truncate">{selectedProfile.email}</div>
                  <div className="text-[10px] text-slate-550 font-mono mt-0.5">{selectedProfile.phone}</div>
                </div>
              </div>

              {/* VISUAL PROGRESS BAR TO NEXT LOYALTY TIER */}
              {activeTier && (
                <div className="p-5 border border-slate-150 bg-slate-50/50 flex flex-col gap-3">
                  <div className="flex justify-between items-center text-[9px] font-mono">
                    <span className="tracking-wider uppercase font-black text-slate-500 flex items-center gap-1">
                      <TrendingUp size={12} className="text-[#C5A02D]" />
                      Loyalty Tier Progression
                    </span>
                    <span className="font-bold text-slate-800">
                      {(selectedProfile.rewardPoints || 0).toLocaleString()} / {activeTier.nextTierPoints ? activeTier.nextTierPoints.toLocaleString() : "Max"} points
                    </span>
                  </div>

                  {/* Sleek dynamic gradient progress bar */}
                  <div className="w-full h-4 bg-slate-200 overflow-hidden relative border border-slate-300">
                    <div 
                      className={`h-full bg-gradient-to-r ${activeTier.color} transition-all duration-700 shadow-inner`}
                      style={{ width: `${activeTier.progressPercent}%` }}
                    />
                  </div>

                  {/* Labels and point descriptors */}
                  <div className="flex justify-between items-center text-[10px] mt-0.5">
                    <span className="font-bold text-slate-700">{activeTier.currentTier} MEMBER</span>
                    {activeTier.nextTier ? (
                      <span className="font-bold text-slate-500">{activeTier.nextTier} MEMBER</span>
                    ) : (
                      <span className="font-bold text-[#C5A02D] flex items-center gap-0.5">★ ELITE STATUS MAXED</span>
                    )}
                  </div>

                  <p className="text-[10px] text-slate-550 italic font-serif leading-relaxed text-center mt-1">
                    {activeTier.nextTier ? (
                      <>
                        You are <strong>{activeTier.pointsToNext?.toLocaleString()} points</strong> away from unlocking the prestigious <strong>{activeTier.nextTier}</strong> status! ({Math.round(activeTier.progressPercent)}% complete)
                      </>
                    ) : (
                      "Congratulations! You have reached our ultimate Diamond tier level. Thank you for your continued loyalty in Fiji."
                    )}
                  </p>
                </div>
              )}

              {/* MILESTONE CLAIMABLE VOUCHERS */}
              <div className="flex flex-col gap-3 border border-slate-150 p-5 bg-white">
                <span className="text-[9px] font-display font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5 pb-2 border-b border-slate-100">
                  <Gift size={13} className="text-[#C5A02D]" /> Select and Claim Unlocked Privileges
                </span>

                <div className="divide-y divide-slate-100 border border-slate-150">
                  {[
                    { pts: 1500, title: "Go Fast Level 1", desc: "Preferred room selection and a complimentary sunset welcome cocktail at Seascape Diner." },
                    { pts: 3000, title: "Go Fast Level 2", desc: "$30 FJD complimentary Resort Spa or premium dining voucher." },
                    { pts: 6000, title: "Go Fast Level 3", desc: "Complimentary VIP Sunset Catamaran Cruise excursion ticket." },
                    { pts: 7000, title: "CML Privilege Voucher", desc: "Complimentary luxury dinner buffet or resort day pass at Seascape Diner.", highlighted: true },
                    { pts: 15000, title: "CML Stay Award Level 1", desc: "1 Free Night award voucher valid at select partner resorts." },
                    { pts: 40000, title: "CML Stay Award Level 2", desc: "1 Free Night luxury stay award at elite beachfront executive villas." }
                  ].map((m) => {
                    const isQualified = (selectedProfile.rewardPoints || 0) >= m.pts;
                    return (
                      <div 
                        key={m.pts} 
                        className={`p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors ${
                          m.highlighted ? "bg-amber-50/40" : ""
                        }`}
                      >
                        <div className="flex items-start gap-2.5">
                          <div className={`w-4.5 h-4.5 rounded-full border flex items-center justify-center mt-0.5 text-[9px] font-mono font-bold shrink-0 ${
                            isQualified ? "bg-green-600 border-green-600 text-white" : "border-slate-300 text-slate-400 bg-slate-50"
                          }`}>
                            {isQualified ? "✓" : "•"}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-xs font-bold font-serif text-slate-800">{m.title}</span>
                              <span className="font-mono text-[8.5px] bg-slate-100 text-slate-650 px-1.5 py-0.2 rounded">
                                {m.pts.toLocaleString()} pts
                              </span>
                              {m.highlighted && (
                                <span className="bg-[#C5A02D] text-white text-[7px] font-black uppercase tracking-widest px-1 py-0.2">CML EXCLUSIVE</span>
                              )}
                            </div>
                            <p className="text-[10px] text-slate-500 mt-1 leading-relaxed max-w-lg">{m.desc}</p>
                          </div>
                        </div>

                        <div className="shrink-0 text-right">
                          {isQualified ? (
                            <button
                              onClick={() => handleRedeemPoints(m.pts, m.title)}
                              className="w-full sm:w-auto px-3 py-1.5 bg-green-600 hover:bg-slate-900 text-white font-display text-[9px] tracking-wider uppercase font-black transition-all cursor-pointer"
                            >
                              Claim Reward (-{m.pts})
                            </button>
                          ) : (
                            <span className="text-[8.5px] font-mono text-slate-400 italic">
                              Needs {(m.pts - selectedProfile.rewardPoints).toLocaleString()} more pts
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* RECENT LOYALTY HISTORY TRANSITIONS */}
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                  <span className="text-[9px] uppercase tracking-widest font-extrabold text-[#C5A02D] flex items-center gap-1.5">
                    <History size={13} /> Loyalty Transaction & Visit Journal
                  </span>
                  {recentVisits.length > 0 && (
                    <button
                      onClick={handleExportCSV}
                      type="button"
                      className="flex items-center gap-1.5 text-[9px] uppercase tracking-widest font-extrabold text-slate-650 hover:text-[#C5A02D] transition-colors border border-slate-200 px-2 py-0.5 bg-slate-50 cursor-pointer"
                    >
                      <Download size={11} /> Export Ledger to CSV
                    </button>
                  )}
                </div>
                
                {loadingVisits ? (
                  <span className="text-[10px] text-slate-400">Consulting transactions history...</span>
                ) : recentVisits.length === 0 ? (
                  <span className="text-xs text-slate-400 italic">No historical visits logged for this cardholder.</span>
                ) : (
                  <div className="border border-slate-150 overflow-x-auto rounded-none w-full scrollbar-thin">
                    <table className="w-full text-xs text-left min-w-[480px] md:min-w-full table-layout-fixed">
                      <thead className="bg-slate-50 text-[9px] uppercase tracking-wider text-slate-500 border-b border-slate-150">
                        <tr>
                          <th className="p-2.5">Transaction Date</th>
                          <th className="p-2.5">Receipt Reference</th>
                          <th className="p-2.5">Bill Amount (FJD)</th>
                          <th className="p-2.5">Loyalty Points Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {recentVisits.map((v) => (
                          <tr key={v.id} className="hover:bg-slate-50/50">
                            <td className="p-2.5 font-mono text-[10px] text-slate-500">
                              {v.timestamp ? new Date(v.timestamp.seconds ? v.timestamp.seconds * 1000 : v.timestamp).toLocaleDateString() : "Just now"}
                            </td>
                            <td className="p-2.5 font-mono text-[10.5px] font-semibold text-slate-800">{v.receiptNumber}</td>
                            <td className="p-2.5 font-mono">${v.billAmount?.toFixed(2)}</td>
                            <td className="p-2.5 font-mono">
                              <span className={`text-[10px] font-extrabold ${v.pointsAwarded > 0 ? "text-green-600" : "text-amber-600"}`}>
                                {v.pointsAwarded > 0 ? `+${v.pointsAwarded}` : v.pointsAwarded} pts
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

            </div>
          ) : (
            <div className="bg-slate-50 border-2 border-dashed border-slate-200 p-12 text-center flex flex-col items-center justify-center h-full min-h-[400px]">
              <Award size={36} className="text-slate-300 mb-3" />
              <p className="text-xs text-slate-700 font-serif italic">Privilege Club standby</p>
              <p className="text-[10px] text-slate-400 max-w-sm mt-1 leading-relaxed">
                Please register a new rewards member or select an existing member from the registered list on the left to load the progress tracker, points ledger, and custom benefits.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* AWARD VISIT POINTS MODAL */}
      <AnimatePresence>
        {showLogVisitModal && selectedProfile && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-[1px] z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white border border-slate-200 shadow-2xl w-full max-w-md p-6 relative"
            >
              <button 
                onClick={() => setShowLogVisitModal(false)}
                className="absolute right-4 top-4 text-slate-400 hover:text-black transition-colors"
              >
                <X size={16} />
              </button>

              <div className="flex items-center gap-2 mb-4 border-b border-slate-100 pb-3">
                <Receipt className="text-[#C5A02D]" size={16} />
                <h3 className="text-xs font-display font-black uppercase tracking-widest text-slate-900">
                  Award Points to {selectedProfile.fullName}
                </h3>
              </div>

              <form onSubmit={handleLogVisit} className="flex flex-col gap-4">
                <p className="text-[10px] text-slate-500 leading-normal">
                  Privilege Club Multiplier: Every dollar spent earns <strong>10 points</strong>, plus a <strong>100 point base bonus</strong> for checking in.
                </p>

                <div className="flex flex-col gap-1">
                  <label className="text-[9px] uppercase tracking-wider font-display font-black text-slate-450">
                    Total Bill Spent (FJD) <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-xs text-slate-450 font-mono">$</span>
                    <input
                      type="number"
                      step="0.01"
                      required
                      min="0"
                      placeholder="0.00"
                      value={billAmount}
                      onChange={e => setBillAmount(e.target.value)}
                      className="w-full border border-slate-200 pl-6 pr-3 py-2 text-xs rounded-none outline-none focus:border-[#C5A02D] font-mono"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[9px] uppercase tracking-wider font-display font-black text-slate-450">
                    Receipt / Reference Number
                  </label>
                  <input
                    type="text"
                    placeholder="E.g. INV-2026-940"
                    value={receiptNumber}
                    onChange={e => setReceiptNumber(e.target.value)}
                    className="border border-slate-200 px-3 py-2 text-xs rounded-none outline-none focus:border-[#C5A02D] font-mono"
                  />
                </div>

                {pointsToAward && (
                  <div className="p-3 bg-[#C5A02D]/10 border border-[#C5A02D]/30 text-slate-900 text-xs font-mono flex flex-col gap-1">
                    <div className="flex justify-between">
                      <span>Multiplier Points:</span>
                      <span className="font-bold">+{Math.round(parseFloat(billAmount) * 10)} pts</span>
                    </div>
                    <div className="flex justify-between text-slate-500 text-[10px]">
                      <span>Check-in Base:</span>
                      <span>+100 pts</span>
                    </div>
                    <div className="flex justify-between border-t border-slate-200 pt-1.5 text-[#876a26] font-bold">
                      <span>Total to Award:</span>
                      <span>+{pointsToAward} pts</span>
                    </div>
                  </div>
                )}

                {visitLogError && (
                  <div className="p-2.5 bg-red-50 border border-red-250 text-red-750 text-[10px] flex items-center gap-2">
                    <AlertCircle size={12} />
                    <span>{visitLogError}</span>
                  </div>
                )}

                {visitLogSuccess && (
                  <div className="p-2.5 bg-green-50 border border-green-250 text-green-800 text-[10px] flex items-center gap-2">
                    <CheckCircle size={12} />
                    <span>Transaction registered successfully!</span>
                  </div>
                )}

                <div className="flex gap-2 justify-end mt-2">
                  <button
                    type="button"
                    onClick={() => setShowLogVisitModal(false)}
                    className="px-4 py-2 border border-slate-200 text-slate-650 text-[10px] uppercase font-display font-bold hover:bg-slate-50 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isLogging}
                    className="bg-slate-950 hover:bg-[#C5A02D] text-white px-5 py-2 text-[10px] uppercase font-display font-black tracking-wider transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    {isLogging ? (
                      <>
                        <RefreshCw className="animate-spin" size={11} />
                        <span>Applying...</span>
                      </>
                    ) : (
                      <>
                        <Check size={12} />
                        <span>Commit & Award Points</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {showEditProfileModal && selectedProfile && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-[1px] z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white border border-slate-200 shadow-2xl w-full max-w-md p-6 relative animate-scale-up"
            >
              <button 
                onClick={() => setShowEditProfileModal(false)}
                className="absolute right-4 top-4 text-slate-400 hover:text-black transition-colors animate-fade-in"
              >
                <X size={16} />
              </button>

              <div className="flex items-center gap-2 mb-4 border-b border-slate-100 pb-3">
                <Edit className="text-[#C5A02D]" size={16} />
                <h3 className="text-xs font-display font-black uppercase tracking-widest text-slate-900">
                  Edit Member Details: {selectedProfile.id}
                </h3>
              </div>

              <form onSubmit={handleUpdateProfile} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-[9px] uppercase tracking-wider font-display font-black text-slate-450">
                    Guest Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="E.g. Charles Cebujano"
                    value={editFullName}
                    onChange={e => setEditFullName(e.target.value)}
                    className="border border-slate-200 px-3 py-2 text-xs rounded-none outline-none focus:border-[#C5A02D] transition-colors"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[9px] uppercase tracking-wider font-display font-black text-slate-450">
                    Email Address
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-slate-400">
                      <Mail size={12} />
                    </span>
                    <input
                      type="email"
                      placeholder="E.g. charles@cml.com.fj"
                      value={editEmail}
                      onChange={e => setEditEmail(e.target.value)}
                      className="w-full border border-slate-200 pl-8 pr-3 py-2 text-xs rounded-none outline-none focus:border-[#C5A02D] transition-colors font-mono"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[9px] uppercase tracking-wider font-display font-black text-slate-450">
                    Phone Number
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-slate-400">
                      <Phone size={12} />
                    </span>
                    <input
                      type="text"
                      placeholder="E.g. +679 883 2910"
                      value={editPhone}
                      onChange={e => setEditPhone(e.target.value)}
                      className="w-full border border-slate-200 pl-8 pr-3 py-2 text-xs rounded-none outline-none focus:border-[#C5A02D] transition-colors font-mono"
                    />
                  </div>
                </div>

                {editError && (
                  <div className="p-2.5 bg-red-50 border border-red-250 text-red-750 text-[10px] flex items-center gap-2">
                    <AlertCircle size={12} />
                    <span>{editError}</span>
                  </div>
                )}

                {editSuccess && (
                  <div className="p-2.5 bg-green-50 border border-green-250 text-green-800 text-[10px] flex items-center gap-2">
                    <CheckCircle size={12} />
                    <span>{editSuccess}</span>
                  </div>
                )}

                <div className="flex gap-2 justify-end mt-2">
                  <button
                    type="button"
                    onClick={() => setShowEditProfileModal(false)}
                    className="px-4 py-2 border border-slate-200 text-slate-650 text-[10px] uppercase font-display font-bold hover:bg-slate-50 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isUpdatingProfile}
                    className="bg-slate-950 hover:bg-[#C5A02D] text-white px-5 py-2 text-[10px] uppercase font-display font-black tracking-wider transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    {isUpdatingProfile ? (
                      <>
                        <RefreshCw className="animate-spin" size={11} />
                        <span>Saving...</span>
                      </>
                    ) : (
                      <>
                        <Check size={12} />
                        <span>Save Changes</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {showBenefitsModal && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
            <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
              <div className="bg-slate-950 p-4 text-white flex justify-between items-center shrink-0">
                <h3 className="font-semibold flex items-center gap-2 text-sm uppercase tracking-wider font-display">
                  <AwardIcon size={16} className="text-amber-400" />
                  Manage Membership Benefits List
                </h3>
                <button 
                  onClick={() => setShowBenefitsModal(false)}
                  className="text-slate-400 hover:text-white transition text-sm font-bold"
                >
                  ✕
                </button>
              </div>
              
              <div className="p-5 overflow-y-auto space-y-6 flex-1">
                {/* INSTRUCTIONAL TIP EXPLAINING HOW TO EDIT THE CODE TEMPLATE OR INTERFACE */}
                <div className="bg-amber-50 border border-amber-200 text-amber-900 p-4 rounded-lg text-xs space-y-2">
                  <div className="font-bold flex items-center gap-1.5 uppercase tracking-wider">
                    <Sparkles className="w-4 h-4 text-amber-600" />
                    How to Edit Interface Styles & Templates
                  </div>
                  <p className="leading-relaxed">
                    This admin setting manages benefits shown on the member cards dynamically in real-time. If you want to modify the hardcoded visual card template (colors, font styles, layouts, logos):
                  </p>
                  <ul className="list-disc pl-4 space-y-1 mt-1 leading-relaxed">
                    <li>Open <code>src/components/RestaurantScanner.tsx</code> in your code editor.</li>
                    <li>For <strong>Card Front Styling</strong>, navigate to around line 760 (containing the gradient background classes like <code>bg-gradient-to-br from-[#876a26]</code>).</li>
                    <li>For <strong>Card Back Styling & Layouts</strong>, navigate to around line 885 to edit background gradients or typography weights.</li>
                    <li>Update colors using Tailwind classes (e.g. <code>from-amber-500 to-amber-900</code>) to match your custom hotel brand assets!</li>
                  </ul>
                </div>

                <div className="space-y-3">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">Active Card Benefits</label>
                  
                  {editingBenefitsList.length === 0 ? (
                    <div className="text-center py-6 text-slate-400 text-xs italic border border-dashed rounded-lg border-slate-200">
                      No benefits listed. Add a benefit below!
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-48 overflow-y-auto p-1 border rounded-lg border-slate-100 bg-slate-50">
                      {editingBenefitsList.map((benefit, bIdx) => (
                        <div key={bIdx} className="flex items-center gap-2 bg-white border border-slate-150 p-2 rounded shadow-sm">
                          <input 
                            type="text" 
                            value={benefit}
                            onChange={(e) => {
                              const newList = [...editingBenefitsList];
                              newList[bIdx] = e.target.value;
                              setEditingBenefitsList(newList);
                            }}
                            className="flex-1 text-xs px-2 py-1 border border-slate-100 rounded focus:outline-none focus:border-indigo-500 text-slate-800"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const newList = editingBenefitsList.filter((_, idx) => idx !== bIdx);
                              setEditingBenefitsList(newList);
                            }}
                            className="text-red-500 hover:bg-red-50 p-1 rounded transition text-xs font-semibold"
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Add New Benefit */}
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">Add New Benefit</label>
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      placeholder="e.g. Complimentary Spa Discount"
                      value={newBenefitText}
                      onChange={(e) => setNewBenefitText(e.target.value)}
                      className="flex-1 px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500 text-slate-800"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (!newBenefitText.trim()) return;
                        setEditingBenefitsList([...editingBenefitsList, newBenefitText.trim()]);
                        setNewBenefitText("");
                      }}
                      className="px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-lg text-xs transition"
                    >
                      Add Item
                    </button>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3 shrink-0">
                <button 
                  type="button" 
                  onClick={() => setShowBenefitsModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-lg text-xs font-bold uppercase font-display text-slate-600 hover:bg-white transition"
                >
                  Cancel
                </button>
                <button 
                  type="button" 
                  onClick={handleSaveBenefits}
                  disabled={isSavingBenefits}
                  className="px-5 py-2 bg-[#C5A02D] hover:bg-[#b08f23] text-slate-950 font-black rounded-lg text-xs uppercase font-display tracking-wider transition shadow-sm"
                >
                  {isSavingBenefits ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </div>
          </div>
        )}

        {showRewardsConfigurator && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
            <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-5xl overflow-hidden flex flex-col max-h-[90vh] my-8 animate-fade-in">
              <div className="bg-slate-950 p-4 text-white flex justify-between items-center shrink-0">
                <h3 className="font-semibold flex items-center gap-2 text-sm uppercase tracking-wider font-display text-amber-400">
                  <AwardIcon size={16} className="text-amber-400 font-bold" />
                  Rewards & Loyalty Tier Configurator Panel
                </h3>
                <button 
                  onClick={() => setShowRewardsConfigurator(false)}
                  className="text-slate-400 hover:text-white transition text-sm font-bold"
                >
                  ✕
                </button>
              </div>
              
              <div className="p-6 overflow-y-auto flex-1 bg-slate-50">
                <RewardsConfigurator 
                  companyId={companyId} 
                  onClose={() => setShowRewardsConfigurator(false)} 
                  onConfigUpdated={() => {
                    fetchTiersConfig();
                  }}
                />
              </div>

              <div className="p-4 bg-slate-100 border-t border-slate-200 flex justify-end shrink-0">
                <button 
                  type="button" 
                  onClick={() => setShowRewardsConfigurator(false)}
                  className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-[#C5A02D] font-extrabold rounded-lg text-xs uppercase tracking-wider transition shadow-sm"
                >
                  Close Configurator
                </button>
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
