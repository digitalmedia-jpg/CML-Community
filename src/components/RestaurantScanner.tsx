import React, { useState, useEffect, useRef, useMemo } from "react";
import { 
  ScanLine, 
  Camera, 
  Search, 
  Award, 
  Gift, 
  Clock, 
  User, 
  Users,
  Hotel,
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
  TrendingUp,
  Check,
  Flame,
  Armchair,
  BookOpen,
  Calendar,
  Lock,
  ChevronRight,
  Sliders,
  Play,
  Download
} from "lucide-react";
import { 
  db,
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  setDoc, 
  updateDoc, 
  addDoc, 
  query, 
  orderBy, 
  serverTimestamp 
} from "../lib/firebase";
import { motion, AnimatePresence } from "motion/react";
import jsQR from "jsqr";

interface GuestProfile {
  id: string; // The Card ID
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

interface ZoneSeating {
  id: string; // cml-main, cml-ocean, cml-garden
  name: string;
  tables: number;
  chairs: number;
  occupiedTables: number;
}

interface BuffetLog {
  id: string;
  roomNumber: string;
  guestName: string;
  partySize: number;
  zoneId: string;
  timestamp: any; // Date
  mealType?: "Breakfast" | "Lunch" | "Dinner";
  isWalkIn?: boolean;
  paymentMode?: string;
}

interface Reservation {
  id: string;
  guestName: string;
  roomNumber: string;
  partySize: number;
  zoneId: string;
  timeSlot: string; // e.g. "07:00 AM - 08:30 AM"
  dateString: string; // e.g. "2026-05-22"
}

interface RestaurantScannerProps {
  companyId: string;
  initialSubTab?: "scanner" | "capacity" | "buffet" | "reservations";
  onSubTabChange?: (subTab: "scanner" | "capacity" | "buffet" | "reservations") => void;
}

export const RestaurantScanner: React.FC<RestaurantScannerProps> = ({ companyId, initialSubTab, onSubTabChange }) => {
  // Tabs: "scanner", "capacity", "buffet", "reservations"
  const [activeSubTab, setActiveSubTab] = useState<"scanner" | "capacity" | "buffet" | "reservations">("scanner");

  const switchSubTab = (subTab: "scanner" | "capacity" | "buffet" | "reservations") => {
    setActiveSubTab(subTab);
    if (onSubTabChange) {
      onSubTabChange(subTab);
    }
  };

  // Sync state if initialSubTab prop changes from parent sidebar
  useEffect(() => {
    if (initialSubTab) {
      setActiveSubTab(initialSubTab);
    }
  }, [initialSubTab]);

  const [guests, setGuests] = useState<GuestProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Camera & Scanning states
  const [cameraPermission, setCameraPermission] = useState<"prompt" | "granted" | "denied">("prompt");
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [scannedCardId, setScannedCardId] = useState<string | null>(null);
  const [manualCardId, setManualCardId] = useState("");
  
  // Selected Profile details
  const [selectedProfile, setSelectedProfile] = useState<GuestProfile | null>(null);
  const [recentVisits, setRecentVisits] = useState<VisitLog[]>([]);
  const [loadingVisits, setLoadingVisits] = useState(false);

  // New Guest Profile Form
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newCardId, setNewCardId] = useState("");
  const [newFullName, setNewFullName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");

  // Log Visit Form
  const [showLogVisitModal, setShowLogVisitModal] = useState(false);
  const [receiptNumber, setReceiptNumber] = useState("");
  const [billAmount, setBillAmount] = useState("");
  const [visitLogSuccess, setVisitLogSuccess] = useState("");
  const [visitLogError, setVisitLogError] = useState("");

  // UI status messages
  const [scannerStatus, setScannerStatus] = useState("Ready to Scan");
  const [showCelebration, setShowCelebration] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // 3-Zone state managers with state storage (persisted locally to avoid complex setups)
  const [zones, setZones] = useState<ZoneSeating[]>(() => {
    try {
      const saved = localStorage.getItem(`restaurant_zones_${companyId}`);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.warn("[RestaurantScanner] Could not read zones from localStorage:", e);
    }
    return [
      { id: "main", name: "Main Dining Hall", tables: 30, chairs: 120, occupiedTables: 12 },
      { id: "ocean", name: "Oceanfront Horizon Deck", tables: 15, chairs: 60, occupiedTables: 8 },
      { id: "garden", name: "Garden Sanctuary Pavilion", tables: 18, chairs: 72, occupiedTables: 4 }
    ];
  });

  // Save zones effect
  useEffect(() => {
    try {
      localStorage.setItem(`restaurant_zones_${companyId}`, JSON.stringify(zones));
    } catch (e) {
      console.warn("[RestaurantScanner] Could not save zones to localStorage:", e);
    }
  }, [zones, companyId]);

  // Fine-grained table status indicator states: available, occupied, cleaning
  const [tableStatuses, setTableStatuses] = useState<Record<string, Record<number, "Available" | "Occupied" | "Cleaning">>>(() => {
    let saved: string | null = null;
    try {
      saved = localStorage.getItem(`restaurant_table_statuses_${companyId}`);
    } catch (e) {
      console.warn("[RestaurantScanner] Could not read table statuses from localStorage:", e);
    }
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // Fallback
      }
    }
    const defaults: Record<string, Record<number, "Available" | "Occupied" | "Cleaning">> = {
      main: {},
      ocean: {},
      garden: {}
    };
    for (let i = 1; i <= 30; i++) {
      defaults.main[i] = i === 3 || i === 7 || i === 12 || i === 15 || i === 18 || i === 25 || i === 28 || i === 30 || i === 1 || i === 4 || i === 14 ? "Occupied" : i === 5 || i === 22 || i === 16 ? "Cleaning" : "Available";
    }
    for (let i = 1; i <= 15; i++) {
      defaults.ocean[i] = i === 2 || i === 4 || i === 8 || i === 10 || i === 11 || i === 13 || i === 14 || i === 15 ? "Occupied" : i === 6 ? "Cleaning" : "Available";
    }
    for (let i = 1; i <= 18; i++) {
      defaults.garden[i] = i === 1 || i === 11 || i === 5 || i === 9 ? "Occupied" : i === 3 || i === 13 ? "Cleaning" : "Available";
    }
    return defaults;
  });

  // Save table statuses effect
  useEffect(() => {
    try {
      localStorage.setItem(`restaurant_table_statuses_${companyId}`, JSON.stringify(tableStatuses));
    } catch (e) {
      console.warn("[RestaurantScanner] Could not save table statuses to localStorage:", e);
    }
  }, [tableStatuses, companyId]);

  // Buffet state logs
  const [buffetLogs, setBuffetLogs] = useState<BuffetLog[]>(() => {
    try {
      const saved = localStorage.getItem(`restaurant_buffet_${companyId}`);
      const parsed = saved ? JSON.parse(saved) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      return [];
    }
  });

  // Reservations state
  const [reservations, setReservations] = useState<Reservation[]>(() => {
    try {
      const saved = localStorage.getItem(`restaurant_reservations_${companyId}`);
      const parsed = saved ? JSON.parse(saved) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      return [];
    }
  });

  // Save collections helper
  useEffect(() => {
    try {
      localStorage.setItem(`restaurant_buffet_${companyId}`, JSON.stringify(buffetLogs));
    } catch (e) {
      console.warn("[RestaurantScanner] Could not save buffet logs to localStorage:", e);
    }
  }, [buffetLogs, companyId]);

  useEffect(() => {
    try {
      localStorage.setItem(`restaurant_reservations_${companyId}`, JSON.stringify(reservations));
    } catch (e) {
      console.warn("[RestaurantScanner] Could not save reservations to localStorage:", e);
    }
  }, [reservations, companyId]);

  // Intake breakfast inputs
  const [buffetRoom, setBuffetRoom] = useState("");
  const [buffetName, setBuffetName] = useState("");
  const [buffetPartySize, setBuffetPartySize] = useState("2");
  const [buffetZone, setBuffetZone] = useState("main");
  const [buffetAlert, setBuffetAlert] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Suggested meal type based on local hour
  const getSuggestedMealType = (): "Breakfast" | "Lunch" | "Dinner" => {
    const hours = new Date().getHours();
    if (hours < 11) return "Breakfast";
    if (hours < 16) return "Lunch";
    return "Dinner";
  };

  const [buffetMealType, setBuffetMealType] = useState<"Breakfast" | "Lunch" | "Dinner">(getSuggestedMealType());
  const [isWalkIn, setIsWalkIn] = useState(false);
  const [walkInPayment, setWalkInPayment] = useState("Paid Cash (FJD)");
  const [buffetFilterMeal, setBuffetFilterMeal] = useState<"All" | "Breakfast" | "Lunch" | "Dinner">("All");

  const [buffetSortBy, setBuffetSortBy] = useState<"latest" | "oldest" | "name" | "partySize">("latest");
  const [resSortBy, setResSortBy] = useState<"latest" | "oldest" | "name" | "partySize">("latest");
  const [guestSortBy, setGuestSortBy] = useState<"latest" | "name" | "points">("latest");

  const sortedBuffetLogs = useMemo(() => {
    const filtered = buffetLogs.filter(l => buffetFilterMeal === "All" || (l.mealType || "Breakfast") === buffetFilterMeal);
    return [...filtered].sort((a, b) => {
      if (buffetSortBy === "latest") {
        return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
      }
      if (buffetSortBy === "oldest") {
        return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
      }
      if (buffetSortBy === "name") {
        return a.guestName.localeCompare(b.guestName);
      }
      if (buffetSortBy === "partySize") {
        return b.partySize - a.partySize;
      }
      return 0;
    });
  }, [buffetLogs, buffetFilterMeal, buffetSortBy]);

  const sortedReservations = useMemo(() => {
    return [...reservations].sort((a, b) => {
      if (resSortBy === "latest") {
        const tA = parseInt(a.id.replace("res-", "")) || 0;
        const tB = parseInt(b.id.replace("res-", "")) || 0;
        return tB - tA;
      }
      if (resSortBy === "oldest") {
        const tA = parseInt(a.id.replace("res-", "")) || 0;
        const tB = parseInt(b.id.replace("res-", "")) || 0;
        return tA - tB;
      }
      if (resSortBy === "name") {
        return a.guestName.localeCompare(b.guestName);
      }
      if (resSortBy === "partySize") {
        return b.partySize - a.partySize;
      }
      return 0;
    });
  }, [reservations, resSortBy]);

  const sortedGuests = useMemo(() => {
    const list = (Array.isArray(guests) ? guests : []).filter(g => {
      const name = g?.fullName || "";
      const id = g?.id || "";
      const search = searchQuery || "";
      return name.toLowerCase().includes(search.toLowerCase()) ||
             id.toLowerCase().includes(search.toLowerCase());
    });
    
    return [...list].sort((a, b) => {
      if (guestSortBy === "name") {
        return a.fullName.localeCompare(b.fullName);
      }
      if (guestSortBy === "points") {
        return b.rewardPoints - a.rewardPoints;
      }
      if (guestSortBy === "latest") {
        const tA = a.createdAt ? (a.createdAt.seconds ? a.createdAt.seconds * 1000 : new Date(a.createdAt).getTime()) : 0;
        const tB = b.createdAt ? (b.createdAt.seconds ? b.createdAt.seconds * 1000 : new Date(b.createdAt).getTime()) : 0;
        if (tA && tB) return tB - tA;
        return a.fullName.localeCompare(b.fullName);
      }
      return 0;
    });
  }, [guests, searchQuery, guestSortBy]);

  // Seat Reservation inputs
  const [resName, setResName] = useState("");
  const [resRoom, setResRoom] = useState("");
  const [resPartySize, setResPartySize] = useState("4");
  const [resZone, setResZone] = useState("main");
  const [resTime, setResTime] = useState("07:00 AM - 08:30 AM");
  const [resDate, setResDate] = useState("2026-05-22");
  const [resAlert, setResAlert] = useState<string | null>(null);

  // Edit capacity state
  const [editingCapacityZone, setEditingCapacityZone] = useState<string | null>(null);
  const [tempTables, setTempTables] = useState(0);
  const [tempChairs, setTempChairs] = useState(0);

  // Load Guests from database
  const fetchGuests = async () => {
    try {
      setLoading(true);
      const colRef = collection(db, `restaurant-guests-${companyId}`);
      const snapshot = await getDocs(colRef);
      if (snapshot.empty) {
        console.log("[RestaurantScanner] No guest profiles in Firestore. Auto-seeding CML Rewards now...");
        
        const sampleProfiles = [
          {
            id: "CML-RE-001",
            fullName: "Charles (VIP Member)",
            email: "charles.viti@cml.com.fj",
            phone: "+679 883 2910",
            visitCount: 14,
            rewardPoints: 6850, // Super close to 7,000 threshold so Charles can test voucher redemption
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
          },
          {
            id: "CML-RE-004",
            fullName: "Marika Tuicuvu",
            email: "marika.t@cml.com.fj",
            phone: "+679 441 5509",
            visitCount: 1,
            rewardPoints: 100,
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

          // Seed initial visits
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

        // Seed initial reservations
        const initialReservations: Reservation[] = [
          {
            id: "res-1",
            guestName: "Mereoni Nasilasila",
            roomNumber: "305",
            partySize: 4,
            zoneId: "ocean",
            timeSlot: "07:30 AM - 09:00 AM",
            dateString: new Date().toISOString().split('T')[0]
          },
          {
            id: "res-2",
            guestName: "Marika Tuicuvu",
            roomNumber: "104",
            partySize: 2,
            zoneId: "main",
            timeSlot: "08:00 AM - 09:30 AM",
            dateString: new Date().toISOString().split('T')[0]
          }
        ];
        setReservations(initialReservations);
        localStorage.setItem(`restaurant_reservations_${companyId}`, JSON.stringify(initialReservations));

        // Seed initial buffet entries for today
        const initialBuffet: BuffetLog[] = [
          {
            id: "buf-1",
            roomNumber: "202",
            guestName: "Savenaca Radrodro",
            partySize: 2,
            zoneId: "main",
            timestamp: new Date().toISOString()
          }
        ];
        setBuffetLogs(initialBuffet);
        localStorage.setItem(`restaurant_buffet_${companyId}`, JSON.stringify(initialBuffet));

        // Fetch again now that the data has been written
        const refetchedSnapshot = await getDocs(colRef);
        const list: GuestProfile[] = refetchedSnapshot.docs.map(docSnap => ({
          id: docSnap.id,
          ...docSnap.data()
        } as GuestProfile));
        setGuests(list);
      } else {
        const list: GuestProfile[] = snapshot.docs.map(docSnap => ({
          id: docSnap.id,
          ...docSnap.data()
        } as GuestProfile));
        setGuests(list);
      }
    } catch (err) {
      console.error("Error loading guests:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGuests();
    return () => {
      stopCamera();
    };
  }, [companyId]);

  // Load selected guest visit logs
  const fetchVisitLogs = async (cardId: string) => {
    try {
      setLoadingVisits(true);
      const colRef = collection(db, `restaurant-guests-${companyId}`, cardId, "visits");
      const q = query(colRef, orderBy("timestamp", "desc"));
      const snapshot = await getDocs(q);
      const list = snapshot.docs.map(docSnap => ({
        id: docSnap.id,
        ...docSnap.data()
      } as VisitLog));
      setRecentVisits(list);
    } catch (err) {
      console.error("Error fetching guest logs:", err);
    } finally {
      setLoadingVisits(false);
    }
  };

  // Prepopulate Demo Dataset
  const handleSeedSamplesList = async () => {
    try {
      setLoading(true);
      const sampleProfiles = [
        {
          id: "CML-RE-001",
          fullName: "Charles (VIP Member)",
          email: "charles.viti@cml.com.fj",
          phone: "+679 883 2910",
          visitCount: 14,
          rewardPoints: 6850, // Super close to 7,000 threshold so Charles can test voucher redemption
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
        },
        {
          id: "CML-RE-004",
          fullName: "Marika Tuicuvu",
          email: "marika.t@cml.com.fj",
          phone: "+679 441 5509",
          visitCount: 1,
          rewardPoints: 100,
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

        // Seed initial visits
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

      // Seed initial reservations
      const initialReservations: Reservation[] = [
        {
          id: "res-1",
          guestName: "Mereoni Nasilasila",
          roomNumber: "305",
          partySize: 4,
          zoneId: "ocean",
          timeSlot: "07:30 AM - 09:00 AM",
          dateString: new Date().toISOString().split('T')[0]
        },
        {
          id: "res-2",
          guestName: "Marika Tuicuvu",
          roomNumber: "104",
          partySize: 2,
          zoneId: "main",
          timeSlot: "08:00 AM - 09:30 AM",
          dateString: new Date().toISOString().split('T')[0]
        }
      ];
      setReservations(initialReservations);

      // Seed initial buffet entries for today
      // e.g. guest from Room 202 already ate today
      const todayString = new Date().toISOString().split('T')[0];
      const initialBuffet: BuffetLog[] = [
        {
          id: "buf-1",
          roomNumber: "202",
          guestName: "Savenaca Radrodro",
          partySize: 2,
          zoneId: "main",
          timestamp: new Date().toISOString()
        }
      ];
      setBuffetLogs(initialBuffet);

      setScannerStatus("Successfully loaded beautiful seed demo dataset!");
      fetchGuests();
    } catch (err) {
      console.error("Error seeding sample data:", err);
      alert("Unable to write demo entries. Please double check firestore internet connection.");
    } finally {
      setLoading(false);
    }
  };

  // Start Camera feed
  const startCamera = async () => {
    try {
      setScannerStatus("Accessing web security camera stream...");
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: "environment" } 
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setCameraPermission("granted");
      setIsCameraActive(true);
      setScannerStatus("Position membership QR or barcode ID inside the target grid");
    } catch (err) {
      console.error("Camera access error:", err);
      setCameraPermission("denied");
      setScannerStatus("Camera blocked or unavailable. Enter card ID manually.");
    }
  };

  // Stop Camera feed
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
  };
  
  const handleExportCSV = () => {
    if (!recentVisits || recentVisits.length === 0) return;
    
    // CSV Header row
    const headers = ["Date", "Receipt Reference", "Amount (FJD)", "Loyalty Points Action", "Type", "Guest Name", "Guest Card ID"];
    
    // Guest info for context
    const guestName = selectedProfile?.fullName || "Unknown Guest";
    const guestId = selectedProfile?.id || "";
    
    // Map visits data to CSV format
    const rows = recentVisits.map(v => {
      const dateStr = v.timestamp 
        ? new Date(v.timestamp.seconds ? v.timestamp.seconds * 1000 : v.timestamp).toLocaleDateString() 
        : "N/A";
      const actionText = v.pointsAwarded > 0 ? `+${v.pointsAwarded} points awarded` : "Voucher Redeemed";
      const typeLabel = v.type === "visit" ? "Meal / Invoice Earn" : "Voucher Redeem";
      
      return [
        `"${dateStr.replace(/"/g, '""')}"`,
        `"${(v.receiptNumber || 'N/A').replace(/"/g, '""')}"`,
        v.billAmount ? v.billAmount.toFixed(2) : "0.00",
        `"${actionText.replace(/"/g, '""')}"`,
        `"${typeLabel.replace(/"/g, '""')}"`,
        `"${guestName.replace(/"/g, '""')}"`,
        `"${guestId.replace(/"/g, '""')}"`
      ];
    });
    
    const csvContent = [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    const fileName = `Visit_Ledger_${guestName.replace(/\s+/g, "_")}_${new Date().toISOString().split('T')[0]}.csv`;
    link.setAttribute("download", fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Simulate scanning a code
  const handleSimulateScan = () => {
    if (guests.length === 0) {
      setScannerStatus("Registry empty. Tap 'Seed Interactive Demo Data' to load sample accounts first!");
      return;
    }
    // Pick a card
    const randomGuest = guests[Math.floor(Math.random() * guests.length)];
    setScannerStatus(`Card detected: ${randomGuest.id}!`);
    setTimeout(() => {
      handleMatchCard(randomGuest.id);
      stopCamera();
    }, 800);
  };

  // Handle Match Card lookup
  const handleMatchCard = async (cardId: string) => {
    if (!cardId.trim()) return;
    const cleanId = cardId.trim().toUpperCase();
    
    try {
      setLoading(true);
      const guestRef = doc(db, `restaurant-guests-${companyId}`, cleanId);
      const snap = await getDoc(guestRef);
      
      if (snap.exists()) {
        const profile = { id: snap.id, ...snap.data() } as GuestProfile;
        setSelectedProfile(profile);
        setScannedCardId(cleanId);
        fetchVisitLogs(cleanId);
        setScannerStatus(`Matched: ${profile.fullName}!`);
      } else {
        setScannerStatus(`Card ID "${cleanId}" not registered. Register it below.`);
        setSelectedProfile(null);
      }
    } catch (err) {
      console.error("Search error:", err);
    } finally {
      setLoading(false);
    }
  };

  const scanRequestRef = useRef<number | null>(null);

  useEffect(() => {
    let active = true;
    
    const scanFrame = () => {
      if (!active || !isCameraActive || !videoRef.current) return;
      
      const video = videoRef.current;
      if (video.readyState === video.HAVE_ENOUGH_DATA) {
        try {
          const canvas = document.createElement("canvas");
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          const ctx = canvas.getContext("2d");
          if (ctx) {
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const code = jsQR(imageData.data, imageData.width, imageData.height, {
              inversionAttempts: "dontInvert",
            });
            if (code && code.data) {
              const scannedId = code.data.trim();
              if (scannedId) {
                handleMatchCard(scannedId);
                setScannerStatus(`Successfully scanned QR Code: ${scannedId}`);
                stopCamera();
                return;
              }
            }
          }
        } catch (error) {
          console.error("QR Code parsing exception:", error);
        }
      }
      
      scanRequestRef.current = requestAnimationFrame(scanFrame);
    };

    if (isCameraActive) {
      scanRequestRef.current = requestAnimationFrame(scanFrame);
    } else {
      if (scanRequestRef.current) {
        cancelAnimationFrame(scanRequestRef.current);
        scanRequestRef.current = null;
      }
    }

    return () => {
      active = false;
      if (scanRequestRef.current) {
        cancelAnimationFrame(scanRequestRef.current);
        scanRequestRef.current = null;
      }
    };
  }, [isCameraActive, companyId]);

  // Register Guest
  const handleCreateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    setFormSuccess("");

    if (!newCardId || !newFullName) {
      setFormError("Card ID and Full Name are strictly required.");
      return;
    }

    const cleanCardId = newCardId.trim().toUpperCase();

    try {
      const docRef = doc(db, `restaurant-guests-${companyId}`, cleanCardId);
      const existSnap = await getDoc(docRef);
      if (existSnap.exists()) {
        setFormError("This Card ID is already registered.");
        return;
      }

      const profile: Omit<GuestProfile, "id"> = {
        fullName: newFullName.trim(),
        email: newEmail.trim() || `${cleanCardId.toLowerCase()}@mail.com.fj`,
        phone: newPhone.trim() || "+679",
        visitCount: 0,
        rewardPoints: 0,
        lastVisited: null,
        createdAt: serverTimestamp()
      };

      await setDoc(docRef, profile);
      setFormSuccess(`Registered ${newFullName}!`);
      setNewCardId("");
      setNewFullName("");
      setNewEmail("");
      setNewPhone("");
      fetchGuests();
      
      handleMatchCard(cleanCardId);
      setTimeout(() => setShowCreateForm(false), 1200);
    } catch (err) {
      console.error("Error:", err);
      setFormError("Failed. Please check internet.");
    }
  };

  // Add diner visit details
  const handleLogVisit = async (e: React.FormEvent) => {
    e.preventDefault();
    setVisitLogError("");
    setVisitLogSuccess("");

    if (!selectedProfile) return;
    if (!receiptNumber) {
      setVisitLogError("Please supply receipt document number.");
      return;
    }

    const amount = parseFloat(billAmount) || 0;
    const pointsToAdd = 100 + Math.floor(amount * 10);

    try {
      const guestRef = doc(db, `restaurant-guests-${companyId}`, selectedProfile.id);
      const visitsColRef = collection(db, `restaurant-guests-${companyId}`, selectedProfile.id, "visits");
      
      const visitDoc: Omit<VisitLog, "id"> = {
        cardId: selectedProfile.id,
        receiptNumber: receiptNumber.trim(),
        billAmount: amount,
        pointsAwarded: pointsToAdd,
        type: "visit",
        timestamp: serverTimestamp()
      };

      await addDoc(visitsColRef, visitDoc);

      const updatedVisits = selectedProfile.visitCount + 1;
      const updatedPoints = selectedProfile.rewardPoints + pointsToAdd;

      await updateDoc(guestRef, {
        visitCount: updatedVisits,
        rewardPoints: updatedPoints,
        lastVisited: serverTimestamp()
      });

      setVisitLogSuccess(`Transaction Recorded! +${pointsToAdd} loyalty pts applied.`);
      
      setSelectedProfile({
        ...selectedProfile,
        visitCount: updatedVisits,
        rewardPoints: updatedPoints,
        lastVisited: new Date()
      });

      fetchVisitLogs(selectedProfile.id);
      fetchGuests();

      if (updatedPoints >= 7000 && selectedProfile.rewardPoints < 7000) {
        setShowCelebration(true);
      }

      setReceiptNumber("");
      setBillAmount("");
      setTimeout(() => {
        setShowLogVisitModal(false);
        setVisitLogSuccess("");
      }, 1200);

    } catch (err) {
      setVisitLogError("Action failed.");
    }
  };

  const handleRedeemReward = async () => {
    if (!selectedProfile || selectedProfile.rewardPoints < 7000) return;

    if (!confirm(`Confirm points deduction of 7,000 for ${selectedProfile.fullName}?`)) {
      return;
    }

    try {
      setLoading(true);
      const guestRef = doc(db, `restaurant-guests-${companyId}`, selectedProfile.id);
      const visitsColRef = collection(db, `restaurant-guests-${companyId}`, selectedProfile.id, "visits");
      
      await addDoc(visitsColRef, {
        cardId: selectedProfile.id,
        receiptNumber: "REDEEM-7K",
        billAmount: 0,
        pointsAwarded: -7000,
        type: "redemption",
        timestamp: serverTimestamp()
      });

      const updatedPoints = selectedProfile.rewardPoints - 7000;
      await updateDoc(guestRef, { rewardPoints: updatedPoints });

      setSelectedProfile({
        ...selectedProfile,
        rewardPoints: updatedPoints
      });

      fetchVisitLogs(selectedProfile.id);
      fetchGuests();
      alert("Redeemed! Hand Charles / the guest their dine-in dining reward certificate.");
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // BUFFER INTAKE SYSTEM (WITH SAME-DAY LOCK PROTECTION & WALK-IN BYPASS)
  const handleIntakeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setBuffetAlert(null);

    const roomClean = isWalkIn ? "Walk-In" : buffetRoom.trim();
    const guestNameClean = buffetName.trim();
    const size = parseInt(buffetPartySize) || 1;

    if (!roomClean || !guestNameClean) {
      setBuffetAlert({ type: "error", text: "Please enter Room Number (or check Walk-In) and Guest Name." });
      return;
    }

    // 1. Same-Day Double Intake Blocking Check! (Bypassed for Walk-Ins)
    if (!isWalkIn) {
      const todayStr = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
      
      // Check if room has entered today for the SPECIFIC meal type
      const alreadyEatenLog = buffetLogs.find(log => {
        const logDate = new Date(log.timestamp).toISOString().split("T")[0];
        const logMealType = log.mealType || "Breakfast";
        return log.roomNumber.toLowerCase() === roomClean.toLowerCase() && 
               logDate === todayStr && 
               logMealType === buffetMealType;
      });

      if (alreadyEatenLog) {
        const entryTime = new Date(alreadyEatenLog.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        setBuffetAlert({
          type: "error",
          text: `🔴 INTAKE BLOCK: Room ${roomClean} already checked into Today's ${buffetMealType} Buffet at ${entryTime}! Duplicate ${buffetMealType.toLowerCase()} sweeps are blocked.`
        });
        return;
      }
    }

    // 2. Increment active occupancy capacity indicators
    setZones(prev => prev.map(z => {
      if (z.id === buffetZone) {
        return {
          ...z,
          occupiedTables: Math.min(z.tables, z.occupiedTables + Math.ceil(size / 4))
        };
      }
      return z;
    }));

    // 3. Register log entry
    const newLog: BuffetLog = {
      id: "buf-" + Date.now(),
      roomNumber: roomClean,
      guestName: guestNameClean,
      partySize: size,
      zoneId: buffetZone,
      timestamp: new Date().toISOString(),
      mealType: buffetMealType,
      isWalkIn,
      paymentMode: isWalkIn ? walkInPayment : undefined
    };

    setBuffetLogs(prev => [newLog, ...prev]);
    
    const zoneName = zones.find(z => z.id === buffetZone)?.name || buffetZone;
    setBuffetAlert({
      type: "success",
      text: isWalkIn 
        ? `✅ ACCESS GRANTED: Walk-In Customer "${guestNameClean}" (${size} Guests) admitted to ${buffetMealType} in ${zoneName}. Payment: ${walkInPayment}.`
        : `✅ ACCESS GRANTED: Room ${roomClean} - ${guestNameClean} (${size} Guests) admitted to ${buffetMealType} Buffet in ${zoneName}.`
    });

    // Reset fields
    setBuffetRoom("");
    setBuffetName("");
    setIsWalkIn(false);
  };

  // Add reservation custom
  const handleCreateReservation = (e: React.FormEvent) => {
    e.preventDefault();
    setResAlert(null);

    if (!resName || !resRoom) {
      setResAlert("Guest name and room number are required.");
      return;
    }

    const newRes: Reservation = {
      id: "res-" + Date.now(),
      guestName: resName,
      roomNumber: resRoom,
      partySize: parseInt(resPartySize) || 2,
      zoneId: resZone,
      timeSlot: resTime,
      dateString: resDate
    };

    setReservations(prev => [...prev, newRes]);
    setResName("");
    setResRoom("");
    setResAlert("Reservation successfully registered!");
    setTimeout(() => setResAlert(null), 2000);
  };

  // Edit Capacity zone tables/chairs settings
  const handleSaveCapacitySetting = (zoneId: string) => {
    setZones(prev => prev.map(z => {
      if (z.id === zoneId) {
        return {
          ...z,
          tables: tempTables,
          chairs: tempChairs
        };
      }
      return z;
    }));
    setEditingCapacityZone(null);
  };

  const filteredGuests = (Array.isArray(guests) ? guests : []).filter(g => {
    const name = g?.fullName || "";
    const id = g?.id || "";
    const search = searchQuery || "";
    return name.toLowerCase().includes(search.toLowerCase()) ||
           id.toLowerCase().includes(search.toLowerCase());
  });

  return (
    <div className="w-full flex flex-col gap-6" id="restaurant-scanner-module">
      
      {/* SEED DATA ALERT PROP - VISIBLE IF EMPTY TO GUIDE CHARLES */}
      {guests.length === 0 && (
        <div className="p-4 bg-[#C5A02D]/10 border border-[#C5A02D]/35 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-3">
            <Sparkles className="text-[#C5A02D] shrink-0" size={20} />
            <div>
              <p className="text-xs font-serif italic font-bold text-slate-900">Configure Loyalty Scanning Demo</p>
              <p className="text-[10px] text-slate-500">Need some clean sample cardholder records to see how scanning works? Tap seed to pre-populate logs automatically!</p>
            </div>
          </div>
          <button
            onClick={handleSeedSamplesList}
            className="bg-slate-950 hover:bg-[#C5A02D] text-white py-1.5 px-3.5 text-[9px] font-display uppercase tracking-wider font-extrabold transition-all"
          >
            Seed Interactive Demo Data
          </button>
        </div>
      )}

      {/* HEADER BAR */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-black/5" id="scanner-title-area">
        <div>
          <span className="text-[8px] font-display uppercase tracking-widest font-black text-[#C5A02D] block mb-1.5">
            {companyId === "wyndham" ? "Wyndham Wailoaloa F&B Division" :
             companyId === "ramada" ? "Ramada Suites Coastal Gastronomy" :
             "CML Culinary Operations & Guest Services"}
          </span>
          <h1 className="text-xl md:text-2xl font-serif text-slate-900 flex items-center gap-2.5">
            <Utensils className="text-[#C5A02D]" size={24} />
            {activeSubTab === "buffet" ? `${buffetMealType} Buffet Intake Control` :
             activeSubTab === "scanner" ? "Fiji Guest Loyalty & Points Ledger" :
             activeSubTab === "capacity" ? "Restaurant Dining Capacity Coach" :
             "Table Seating & Reservation Ledger"}
          </h1>
          <p className="text-[11px] text-slate-550 max-w-2xl mt-1 font-light leading-relaxed">
            {activeSubTab === "buffet" ? `Real-time guest dining headcount, room authentication matches, and double-entry prevention for ${companyId === "wyndham" ? "Garden Rooftop & Beach Bistro" : companyId === "ramada" ? "Club57 Restaurant & Seascape Deck" : "Seascape Diner"}.` :
             activeSubTab === "scanner" ? "Scan customer profiles, award dining loyalty points ($1 spent = 10 pts + 100 base), and process free meal voucher eligibility when guests reach 7,000 points." :
             activeSubTab === "capacity" ? "Optimize seating configurations, track real-time occupied zones, and manage seating-density thresholds across breakfast, lunch, and dinner turns." :
             "Confirm guest bookings, schedule dining room slots, and allocate tables dynamically with status oversight."}
          </p>
        </div>

        {/* SUBTABS BAR */}
        <div className="flex flex-wrap items-center gap-1.5 bg-slate-50 p-1 border border-slate-150">
          <button
            onClick={() => { switchSubTab("buffet"); stopCamera(); }}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-[9px] font-display font-medium uppercase tracking-wider transition-all duration-300 ${
              activeSubTab === "buffet" 
                ? "bg-slate-900 text-white font-bold" 
                : "text-slate-650 hover:bg-slate-150 hover:text-slate-900"
            }`}
          >
            <Hotel size={13} className={activeSubTab === "buffet" ? "text-[#C5A02D]" : "text-slate-400"} />
            <span>Buffet Intake Portal</span>
          </button>
          <button
            onClick={() => { switchSubTab("scanner"); stopCamera(); }}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-[9px] font-display font-medium uppercase tracking-wider transition-all duration-300 ${
              activeSubTab === "scanner" 
                ? "bg-slate-900 text-white font-bold" 
                : "text-slate-600 hover:bg-slate-150 hover:text-slate-900"
            }`}
          >
            <Award size={13} className={activeSubTab === "scanner" ? "text-[#C5A02D]" : "text-slate-400"} />
            <span>Loyalty Points & Ledger</span>
          </button>
          <button
            onClick={() => { switchSubTab("capacity"); stopCamera(); }}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-[9px] font-display font-medium uppercase tracking-wider transition-all duration-300 ${
              activeSubTab === "capacity" 
                ? "bg-slate-900 text-white font-bold" 
                : "text-slate-600 hover:bg-slate-150 hover:text-slate-900"
            }`}
          >
            <Sliders size={13} className={activeSubTab === "capacity" ? "text-[#C5A02D]" : "text-slate-400"} />
            <span>Restaurant Capacity Setup</span>
          </button>
          <button
            onClick={() => { switchSubTab("reservations"); stopCamera(); }}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-[9px] font-display font-medium uppercase tracking-wider transition-all duration-300 ${
              activeSubTab === "reservations" 
                ? "bg-slate-900 text-white font-bold" 
                : "text-slate-600 hover:bg-slate-150 hover:text-slate-900"
            }`}
          >
            <Calendar size={13} className={activeSubTab === "reservations" ? "text-[#C5A02D]" : "text-slate-400"} />
            <span>Table Seating Ledger</span>
          </button>
        </div>
      </div>

      {/* QUICK LIVE VISUAL METRIC DASHBOARD */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Total registers */}
        <div className="border border-slate-150 bg-white p-4 flex flex-col">
          <span className="text-[8px] uppercase tracking-wider font-bold text-slate-400">Total Registered Cardholders</span>
          <span className="text-xl font-bold text-slate-800 mt-1">{guests.length} Profiles</span>
          <span className="text-[9px] text-slate-500 italic mt-0.5">Click "Seed" above to add more.</span>
        </div>

        {/* 3 Zones visual overview */}
        {zones.map(z => {
          const ratio = Math.round((z.occupiedTables / z.tables) * 100);
          return (
            <div key={z.id} className="border border-slate-150 bg-white p-4 flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start">
                  <span className="text-[9px] uppercase tracking-wider font-extrabold text-slate-900 w-2/3 truncate">{z.name}</span>
                  <span className="text-[9px] font-mono text-[#C5A02D] font-bold">{ratio}% full</span>
                </div>
                <div className="text-[10px] font-semibold text-slate-600 mt-1">
                  {z.occupiedTables} / {z.tables} Tables Occupied
                </div>
              </div>
              <div className="w-full h-1.5 bg-slate-100 mt-2 rounded-none overflow-hidden">
                <div 
                  className={`h-full ${ratio > 80 ? "bg-red-500" : ratio > 50 ? "bg-yellow-500" : "bg-green-500"}`}
                  style={{ width: `${Math.min(100, ratio)}%` }}
                />
              </div>
              <span className="text-[8px] text-slate-400 block mt-1">Seates capacity: {z.chairs} chairs</span>
            </div>
          );
        })}
      </div>

      {/* RENDER CURRENT TAB VIEW */}
      <AnimatePresence mode="wait">
        
        {/* TAB 1: CARD LOYALTY SCANNER */}
        {activeSubTab === "scanner" && (
          <motion.div
            key="tab-scanner"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start"
          >
            {/* LEFT SIDE: SCAN ENGINE */}
            <div className="lg:col-span-5 flex flex-col gap-6">
              <div className="bg-white border border-slate-150 shadow-sm p-6" id="vanguard-camera-module">
                <div className="flex items-center justify-between mb-4 border-b border-slate-50 pb-3">
                  <span className="text-[10px] uppercase font-display font-black text-[#C5A02D] tracking-widest flex items-center gap-1.5">
                    <Camera size={14} /> Scanner Port
                  </span>
                  <div className="flex items-center gap-1 font-mono text-[9px] text-slate-500">
                    <span className={`w-1.5 h-1.5 rounded-full ${isCameraActive ? 'bg-emerald-500' : 'bg-rose-450'}`} />
                    {isCameraActive ? "PORT ARMED" : "IDLE"}
                  </div>
                </div>

                {/* Video Area */}
                <div className="relative aspect-video bg-neutral-900 overflow-hidden border border-slate-800 flex flex-col items-center justify-center">
                  {isCameraActive ? (
                    <>
                      <video 
                        ref={videoRef} 
                        className="absolute inset-0 w-full h-full object-cover z-0"
                        playsInline 
                        muted 
                      />
                      <div className="absolute inset-0 border-[30px] border-black/45 z-10 flex items-center justify-center pointer-events-none">
                        <div className="border border-dashed border-[#C5A02D]/70 w-3/4 h-3/4 relative">
                          <div className="absolute left-0 right-0 h-[2.5px] bg-[#C5A02D] shadow-[0_0_8px_#C5A02D] animate-bounce top-1/2" />
                        </div>
                      </div>
                      
                      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex gap-2">
                        <button
                          onClick={handleSimulateScan}
                          className="px-3 py-1.5 bg-[#C5A02D] text-white font-display text-[9px] tracking-wider uppercase font-black shadow-lg"
                        >
                          Simulate Camera Scan Card
                        </button>
                        <button
                          onClick={stopCamera}
                          className="px-3 py-1.5 bg-red-650 text-white font-display text-[9px] tracking-wider uppercase font-black shadow-lg"
                        >
                          Cancel
                        </button>
                      </div>
                    </>
                  ) : (
                    <div className="flex flex-col items-center gap-3 p-8 text-center text-slate-400">
                      <ScanLine size={44} strokeWidth={1} className="text-slate-700" />
                      <p className="text-[11px] font-serif italic text-slate-500">Camera reader offline. Tap below to activate webcam capture.</p>
                      <button
                        onClick={startCamera}
                        className="bg-slate-900 text-white hover:bg-[#C5A02D] py-1.5 px-3.5 text-[9px] font-display uppercase tracking-wider font-bold transition-all"
                      >
                        Activate Video Scanner
                      </button>
                    </div>
                  )}
                </div>

                {/* Manual Input Entry */}
                <div className="mt-5 pt-4 border-t border-slate-100 flex flex-col gap-3">
                  <label className="text-[9px] uppercase tracking-wider font-display font-bold text-slate-400">
                    Search Card ID or input manually
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="E.g. CML-RE-001"
                      value={manualCardId}
                      onChange={e => setManualCardId(e.target.value)}
                      className="flex-1 border border-slate-200 px-3 py-2 text-xs font-mono rounded-none outline-none focus:border-[#C5A02D]"
                      onKeyDown={e => e.key === 'Enter' && handleMatchCard(manualCardId)}
                    />
                    <button
                      onClick={() => handleMatchCard(manualCardId)}
                      className="bg-slate-900 hover:bg-[#C5A02D] text-white px-4 py-2 font-display uppercase tracking-wider font-black text-[10px]"
                    >
                      Verify ID
                    </button>
                  </div>
                  <div className="text-[10px] font-mono p-2.5 bg-slate-50 border border-slate-100 text-slate-600 flex items-center gap-2">
                    <Database size={12} className="text-[#C5A02D]" />
                    <span className="italic leading-none">Scanning Engine Status: <strong>{scannerStatus}</strong></span>
                  </div>
                </div>
              </div>

              {/* CARDHOLDERS REPOSITRY */}
              <div className="bg-white border border-slate-150 shadow-sm p-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3 pb-2 border-b border-slate-100">
                  <h3 className="text-[10px] uppercase font-display font-black tracking-widest text-[#C5A02D]">
                    Fiji Rewards Members List ({sortedGuests.length})
                  </h3>
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] font-display font-medium uppercase tracking-wider text-slate-400">Sort:</span>
                    <select
                      value={guestSortBy}
                      onChange={(e) => setGuestSortBy(e.target.value as any)}
                      className="bg-white border border-slate-200 px-1.5 py-0.5 text-[10px] font-mono outline-none focus:border-[#C5A02D] text-slate-800"
                    >
                      <option value="latest">Latest Added</option>
                      <option value="name">Name (A-Z)</option>
                      <option value="points">Points (Highest)</option>
                    </select>
                    <button onClick={fetchGuests} className="text-slate-400 hover:text-black p-1" title="Sync database cache">
                      <RefreshCw size={11} className={loading ? "animate-spin" : ""} />
                    </button>
                  </div>
                </div>

                <div className="relative mb-3">
                  <input
                    type="text"
                    placeholder="Search name or ID..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 pl-8 pr-3 py-1.5 text-[11px] rounded-none outline-none focus:border-[#C5A02D]"
                  />
                  <Search size={12} className="absolute left-2.5 top-2.5 text-slate-400" />
                </div>

                <div className="divide-y divide-slate-100 max-h-56 overflow-y-auto">
                  {loading ? (
                    <div className="p-4 text-center">
                      <span className="text-[10px] font-mono text-slate-400 animate-pulse">Consulting cloud files...</span>
                    </div>
                  ) : sortedGuests.length === 0 ? (
                    <div className="p-4 text-center text-slate-450 italic text-xs">
                      No active registry logs match query.
                    </div>
                  ) : (
                    sortedGuests.map((gst) => {
                      const isSelf = selectedProfile?.id === gst.id;
                      return (
                        <button
                          key={gst.id}
                          onClick={() => handleMatchCard(gst.id)}
                          className={`w-full text-left p-2 transition-all flex items-center justify-between ${
                            isSelf ? 'bg-[#C5A02D]/10 border-l-2 border-[#C5A02D]' : 'hover:bg-slate-50'
                          }`}
                        >
                          <div>
                            <div className="text-xs font-serif font-semibold text-slate-800">
                              {gst.fullName}
                            </div>
                            <div className="text-[9px] font-mono text-slate-500">
                              CARD ID: {gst.id}
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="text-[11px] font-bold text-slate-800 block">
                              {gst.rewardPoints} pts
                            </span>
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>
              </div>
            </div>

            {/* RIGHT SIDE: SELECTED PROFILE DETAILS */}
            <div className="lg:col-span-7 flex flex-col gap-6">
              {selectedProfile ? (
                <div className="bg-white border border-slate-150 shadow-sm p-8 flex flex-col gap-6">
                  
                  {/* points award banner alert */}
                  {showCelebration && (
                    <div className="p-4 bg-amber-50 border border-amber-200 text-amber-900 rounded-none flex items-start gap-4 animate-bounce">
                      <Sparkles size={22} className="text-[#C5A02D] shrink-0" />
                      <div>
                        <h4 className="text-xs font-bold font-serif italic">Charles Milestone: Reward Qualified!</h4>
                        <p className="text-[10px] text-amber-800 mt-1">This member has reached the 7,000 loyalty points limit! Redeem voucher below.</p>
                      </div>
                      <button onClick={() => setShowCelebration(false)} className="text-slate-400 hover:text-slate-950 ml-auto">
                        <X size={15} />
                      </button>
                    </div>
                  )}

                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-4 border-b border-slate-100">
                    <div>
                      <h2 className="text-xl font-serif text-slate-900">{selectedProfile.fullName}</h2>
                      <span className="text-[9px] font-mono bg-slate-100 text-slate-650 px-1.5 py-0.5 uppercase tracking-widest font-black inline-block mt-1">
                        CARD: {selectedProfile.id}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 w-full md:w-auto">
                      <button
                        onClick={() => setShowLogVisitModal(true)}
                        className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-slate-900 hover:bg-[#C5A02D] text-white px-4 py-2 text-[10px] font-display uppercase tracking-wider font-extrabold"
                      >
                        <Receipt size={13} /> Log Restaurant Visit
                      </button>
                      {selectedProfile.rewardPoints >= 7000 && (
                        <button
                          onClick={handleRedeemReward}
                          className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-[#C5A02D] hover:bg-black text-white px-4 py-2 text-[10px] font-display uppercase tracking-wider font-extrabold animate-pulse"
                        >
                          <Gift size={13} /> Redeem Voucher (-7K)
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Analytics KPIs */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="border border-slate-100 p-4 bg-slate-50">
                      <span className="text-[8px] uppercase tracking-wider font-bold text-slate-400">Collected Points</span>
                      <div className="text-2xl font-black text-slate-900 mt-1">{selectedProfile.rewardPoints}</div>
                      <span className="text-[9px] text-[#C5A02D] font-serif italic">Need 7,000 for voucher</span>
                    </div>
                    <div className="border border-slate-100 p-4 bg-slate-50">
                      <span className="text-[8px] uppercase tracking-wider font-bold text-slate-400">Recorded Diners Visited</span>
                      <div className="text-2xl font-black text-slate-900 mt-1">{selectedProfile.visitCount}</div>
                      <span className="text-[9px] text-slate-500 font-serif italic">Frequency level</span>
                    </div>
                    <div className="border border-slate-100 p-4 bg-slate-50">
                      <span className="text-[8px] uppercase tracking-wider font-bold text-slate-400">Fiji Contact Info</span>
                      <div className="text-[10px] text-slate-700 font-mono mt-1 break-all">{selectedProfile.email}</div>
                      <div className="text-[10px] text-slate-500 font-mono mt-0.5">{selectedProfile.phone}</div>
                    </div>
                  </div>

                  {/* PROGRESS BAR */}
                  <div className="p-4 border border-slate-100 bg-slate-50/50">
                    <div className="flex justify-between items-center mb-1 text-[9px] font-mono">
                      <span>VOUCHER GOAL PROGRESS</span>
                      <span className="font-bold text-slate-800">{Math.round(Math.min(100, (selectedProfile.rewardPoints / 7000) * 100))}%</span>
                    </div>
                    <div className="w-full h-3 bg-slate-150 relative">
                      <div 
                        className="bg-[#C5A02D] h-full transition-all duration-300"
                        style={{ width: `${Math.min(100, (selectedProfile.rewardPoints / 7000) * 100)}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[8px] text-slate-400 mt-1">
                      <span>0 PTS</span>
                      {selectedProfile.rewardPoints >= 7000 ? (
                        <span className="text-green-600 font-bold">QUALIFIED FOR VOUCHER REWARD!</span>
                      ) : (
                        <span>{7000 - selectedProfile.rewardPoints} points to target</span>
                      )}
                      <span>7,000 PTS</span>
                    </div>
                  </div>

                  {/* Visit log grid table */}
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-1">
                      <span className="text-[9px] uppercase tracking-widest font-extrabold text-[#C5A02D] flex items-center gap-1.5">
                        <History size={13} /> Visit log journal entries
                      </span>
                      {recentVisits.length > 0 && (
                        <button
                          onClick={handleExportCSV}
                          type="button"
                          className="flex items-center gap-1.5 text-[9px] uppercase tracking-widest font-extrabold text-slate-600 hover:text-[#C5A02D] transition-colors border border-slate-200 px-2 py-0.5 bg-slate-50 cursor-pointer"
                        >
                          <Download size={11} /> Export to CSV
                        </button>
                      )}
                    </div>
                    {loadingVisits ? (
                      <span className="text-[10px] text-slate-400">Loading ledger logs...</span>
                    ) : recentVisits.length === 0 ? (
                      <span className="text-xs text-slate-400 italic">No historical visits found for this guestCard.</span>
                    ) : (
                      <div className="border border-slate-150 overflow-x-auto rounded-none w-full scrollbar-thin scrollbar-thumb-slate-200">
                        <table className="w-full text-xs text-left min-w-[480px] md:min-w-full table-layout-fixed">
                          <thead className="bg-slate-50 text-[9px] uppercase tracking-wider text-slate-500 border-b border-slate-150">
                            <tr>
                              <th className="p-2.5">Date</th>
                              <th className="p-2.5 hidden sm:table-cell">Receipt Reference</th>
                              <th className="p-2.5">Amount (FJD)</th>
                              <th className="p-2.5">Loyalty Action</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {recentVisits.map((v) => (
                              <tr key={v.id} className="hover:bg-slate-50/50">
                                <td className="p-2.5 font-mono text-[10px] text-slate-500">
                                  {v.timestamp ? new Date(v.timestamp.seconds ? v.timestamp.seconds * 1000 : v.timestamp).toLocaleDateString() : "Just now"}
                                </td>
                                <td className="p-2.5 font-mono text-[11px] font-semibold hidden sm:table-cell">{v.receiptNumber}</td>
                                <td className="p-2.5 font-mono">${v.billAmount?.toFixed(2)}</td>
                                <td className="p-2.5 font-mono">
                                  <span className={`text-[10px] font-bold ${v.pointsAwarded > 0 ? "text-green-600" : "text-amber-600"}`}>
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
                <div className="bg-slate-50 border-2 border-dashed border-slate-200 p-12 text-center flex flex-col items-center justify-center h-full">
                  <CreditCard size={36} className="text-slate-350 mb-3" />
                  <p className="text-xs text-slate-700 font-serif italic">Registry Reader Standby</p>
                  <p className="text-[10px] text-slate-400 max-w-sm mt-1 leading-relaxed">
                    Look up member profiles, simulate camera physical barcode readers, apply repeat bills, or register a new member profile below.
                  </p>
                  <button
                    onClick={() => setShowCreateForm(true)}
                    className="mt-4 bg-[#C5A02D] hover:bg-black text-white py-1.5 px-4 text-[9px] font-display uppercase tracking-wider font-extrabold"
                  >
                    Create New Guest Card Profile
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* TAB 2: BUFFET INTAKE CONTROL (BREAKFAST / LUNCH / DINNER & WALK-IN) */}
        {activeSubTab === "buffet" && (
          <motion.div
            key="tab-buffet"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start"
          >
            {/* INTAKE FORM */}
            <div className="lg:col-span-5 bg-white border border-slate-150 p-6 flex flex-col gap-4">
              <div className="border-b border-slate-100 pb-3">
                <span className="text-[10px] uppercase font-display font-black text-[#C5A02D] tracking-widest flex items-center gap-2">
                  <Utensils size={15} /> Buffet Entrance Intake Portal
                </span>
                <p className="text-[10px] text-slate-550 mt-1 italic leading-relaxed">
                  Hostesses register arriving guests. The system matches logs to block double-entry guest profiles for the active buffet turn.
                </p>
              </div>
 
              {buffetAlert && (
                <div className={`p-3 text-[11px] font-sans flex items-start gap-2 border ${
                  buffetAlert.type === "success" 
                    ? "bg-green-50 border-green-250 text-green-800" 
                    : "bg-rose-50 border-rose-250 text-red-800"
                }`}>
                  {buffetAlert.type === "success" ? <CheckCircle size={15} className="shrink-0 text-green-600 mt-0.5" /> : <Lock size={15} className="shrink-0 text-red-650 mt-0.5" />}
                  <span>{buffetAlert.text}</span>
                </div>
              )}
 
              <form onSubmit={handleIntakeSubmit} className="flex flex-col gap-4">
                {/* MEAL TURN CONTROLS */}
                <div className="flex flex-col gap-1.5 pb-1">
                  <label className="text-[10px] uppercase font-display font-black text-slate-500 tracking-wider">Active Meal Session</label>
                  <div className="flex gap-2">
                    {(["Breakfast", "Lunch", "Dinner"] as const).map((meal) => (
                      <button
                        key={meal}
                        type="button"
                        onClick={() => setBuffetMealType(meal)}
                        className={`flex-1 py-1.5 text-[10px] font-display uppercase tracking-wider font-extrabold border transition-all cursor-pointer ${
                          buffetMealType === meal 
                            ? "bg-[#C5A02D] text-white border-[#C5A02D] shadow-sm" 
                            : "bg-slate-50 text-slate-650 border-slate-200 hover:bg-slate-100"
                        }`}
                      >
                        {meal}
                      </button>
                    ))}
                  </div>
                </div>

                {/* WALK-IN CHECKBOX PORTAL */}
                <div className="flex items-center gap-2 bg-amber-50/40 p-2.5 border border-amber-200/50 mt-0.5">
                  <input
                    type="checkbox"
                    id="is-walk-in"
                    checked={isWalkIn}
                    onChange={(e) => {
                      setIsWalkIn(e.target.checked);
                      if (e.target.checked) {
                        setBuffetRoom("Walk-In");
                      } else {
                        setBuffetRoom("");
                      }
                    }}
                    className="w-4 h-4 text-[#C5A02D] border-slate-300 rounded focus:ring-[#C5A02D] cursor-pointer"
                  />
                  <label htmlFor="is-walk-in" className="text-[10px] uppercase font-display font-extrabold text-amber-850 cursor-pointer select-none flex-1">
                    Walk-In Customer (No Room No. / External Diner)
                  </label>
                </div>

                {!isWalkIn ? (
                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] uppercase font-display font-bold text-slate-500">Arriving Room Number</label>
                    <input
                      type="text"
                      required
                      placeholder="E.g. Room 305"
                      value={buffetRoom}
                      onChange={e => setBuffetRoom(e.target.value)}
                      className="border border-slate-200 px-3 py-2 text-xs font-mono outline-none focus:border-[#C5A02D]"
                    />
                  </div>
                ) : (
                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] uppercase font-display font-bold text-slate-500 font-extrabold">Walk-In Billing / Payment</label>
                    <select
                      value={walkInPayment}
                      onChange={e => setWalkInPayment(e.target.value)}
                      className="border border-slate-200 px-2 py-2 text-xs font-mono outline-none focus:border-[#C5A02D] bg-amber-50/20 font-bold text-[#c5a02d]"
                    >
                      <option value="Paid Cash (FJD)">Paid Cash (FJD)</option>
                      <option value="Paid Credit Card (BSP/ANZ)">Paid Credit Card (BSP/ANZ)</option>
                      <option value="Charge to Corporate Account">Charge to Corporate Account</option>
                      <option value="Complimentary VIP Pass">Complimentary VIP Pass</option>
                    </select>
                  </div>
                )}
 
                <div className="flex flex-col gap-1">
                  <label className="text-[9px] uppercase font-display font-bold text-slate-500">Diner Guest Name {isWalkIn ? "(Walk-In)" : ""}</label>
                  <input
                    type="text"
                    required
                    placeholder={isWalkIn ? "E.g. Charles Walk-In Customer" : "E.g. Savenaca Radrodro"}
                    value={buffetName}
                    onChange={e => setBuffetName(e.target.value)}
                    className="border border-slate-200 px-3 py-2 text-xs font-mono outline-none focus:border-[#C5A02D]"
                  />
                </div>
 
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] uppercase font-display font-bold text-slate-500">Guests Eating count</label>
                    <select
                      value={buffetPartySize}
                      onChange={e => setBuffetPartySize(e.target.value)}
                      className="border border-slate-200 px-2 py-2 text-xs font-mono outline-none focus:border-[#C5A02D]"
                    >
                      <option value="1">1 Person</option>
                      <option value="2">2 Persons</option>
                      <option value="3">3 Persons</option>
                      <option value="4">4 Persons</option>
                      <option value="5">5 Persons</option>
                      <option value="6">6+ Persons</option>
                    </select>
                  </div>
 
                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] uppercase font-display font-bold text-slate-500">Destination Seating Zone</label>
                    <select
                      value={buffetZone}
                      onChange={e => setBuffetZone(e.target.value)}
                      className="border border-slate-200 px-2 py-2 text-xs font-mono outline-none focus:border-[#C5A02D]"
                    >
                      {zones.map(z => (
                        <option key={z.id} value={z.id}>{z.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
 
                <button
                  type="submit"
                  className="w-full bg-[#C5A02D] hover:bg-black text-white text-[10px] font-display uppercase tracking-widest font-extrabold py-2.5 shadow-md transition-all cursor-pointer"
                >
                  Verify & Log Intake Entry
                </button>
              </form>
            </div>
 
            {/* LIVE INTAKE TODAY'S LOG */}
            <div className="lg:col-span-7 bg-white border border-slate-150 p-6 flex flex-col gap-5">
              
              {/* LIVE DIGITAL VISUAL DINER COUNTER BAR */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-4 border border-slate-100 shadow-inner">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#C5A02D]/10 flex items-center justify-center text-[#C5A02D] shrink-0">
                    <Users size={20} />
                  </div>
                  <div>
                    <span className="text-[9px] uppercase tracking-wider font-extrabold text-slate-400 block">TOTAL DINERS TODAY</span>
                    <span className="text-base font-bold font-mono text-slate-900">
                      {buffetLogs.reduce((sum, item) => sum + item.partySize, 0)} Headcount
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-650 flex items-center justify-center shrink-0">
                    <Hotel size={20} />
                  </div>
                  <div>
                    <span className="text-[9px] uppercase tracking-wider font-extrabold text-slate-400 block">ROOMS & WALK-INS LOGGED</span>
                    <span className="text-base font-bold font-mono text-slate-900">
                      {new Set(buffetLogs.map(l => l.roomNumber)).size} Lodges
                    </span>
                  </div>
                </div>
              </div>

              {/* MEAL LEVEL PAXs */}
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="bg-slate-50/50 p-2.5 border border-slate-150">
                  <span className="text-[8.5px] uppercase tracking-wider font-extrabold text-[#C5A02D] block">BREAKFAST PAXs</span>
                  <span className="text-sm font-mono font-bold text-slate-800">
                    {buffetLogs.filter(l => (l.mealType || "Breakfast") === "Breakfast").reduce((sum, item) => sum + item.partySize, 0)} pax
                  </span>
                </div>
                <div className="bg-slate-50/50 p-2.5 border border-slate-150">
                  <span className="text-[8.5px] uppercase tracking-wider font-extrabold text-teal-650 block">LUNCH PAXs</span>
                  <span className="text-sm font-mono font-bold text-slate-800">
                    {buffetLogs.filter(l => l.mealType === "Lunch").reduce((sum, item) => sum + item.partySize, 0)} pax
                  </span>
                </div>
                <div className="bg-slate-50/50 p-2.5 border border-slate-150">
                  <span className="text-[8.5px] uppercase tracking-wider font-extrabold text-indigo-650 block">DINNER PAXs</span>
                  <span className="text-sm font-mono font-bold text-slate-800">
                    {buffetLogs.filter(l => l.mealType === "Dinner").reduce((sum, item) => sum + item.partySize, 0)} pax
                  </span>
                </div>
              </div>
 
              <div className="border-b border-slate-100 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <span className="text-[10px] uppercase font-display font-black text-slate-400 tracking-widest block">
                    Buffered Attendance Logs List (Today)
                  </span>
                  <p className="text-[10px] text-slate-400">Log entries for double-entry and seating control matches.</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {/* Sorting dropdown */}
                  <div className="flex items-center gap-1.5 border border-slate-200 bg-slate-50 px-2 py-1">
                    <span className="text-[9px] font-display font-bold uppercase tracking-wider text-slate-500">Sort:</span>
                    <select
                      value={buffetSortBy}
                      onChange={(e) => setBuffetSortBy(e.target.value as any)}
                      className="bg-transparent text-[10px] font-mono outline-none text-slate-800 cursor-pointer"
                    >
                      <option value="latest">Latest Entry</option>
                      <option value="oldest">Oldest Entry</option>
                      <option value="name">Name (A-Z)</option>
                      <option value="partySize">Party Size (High-Low)</option>
                    </select>
                  </div>

                  <div className="flex bg-slate-100 p-0.5 border border-slate-200">
                    {(["All", "Breakfast", "Lunch", "Dinner"] as const).map((filter) => {
                      const count = filter === "All" 
                        ? buffetLogs.length 
                        : buffetLogs.filter(l => (l.mealType || "Breakfast") === filter).length;
                      return (
                        <button
                          key={filter}
                          type="button"
                          onClick={() => setBuffetFilterMeal(filter)}
                          className={`px-2 py-1 text-[8.5px] font-display uppercase tracking-wider font-extrabold transition-all cursor-pointer ${
                            buffetFilterMeal === filter 
                              ? "bg-slate-900 text-white font-black" 
                              : "text-slate-650 hover:text-slate-900 hover:bg-slate-200"
                          }`}
                        >
                          {filter} ({count})
                        </button>
                      );
                    })}
                  </div>
                  <button
                    onClick={() => {
                      if (confirm("Reset today's logs deck?")) {
                        setBuffetLogs([]);
                      }
                    }}
                    className="text-[9px] uppercase tracking-widest font-extrabold text-red-650 hover:underline border border-dashed border-red-200 px-2 py-1 bg-red-50/30 font-bold"
                  >
                    Reset Daily
                  </button>
                </div>
              </div>
 
              <div className="divide-y divide-slate-100 max-h-96 overflow-y-auto">
                {sortedBuffetLogs.length === 0 ? (
                  <div className="p-8 text-center text-slate-400 font-serif italic text-xs">
                    No {buffetFilterMeal !== "All" ? buffetFilterMeal.toLowerCase() : ""} guests recorded in the system yet today. Ensure you log guests on the form.
                  </div>
                ) : (
                  sortedBuffetLogs.map((log) => {
                      const zoneObj = zones.find(z => z.id === log.zoneId);
                      const mType = log.mealType || "Breakfast";
                      const isLgWalkIn = log.isWalkIn;
                      
                      let mealBadgeStyle = "bg-amber-50 text-amber-800 border-amber-250";
                      if (mType === "Lunch") {
                        mealBadgeStyle = "bg-teal-50 text-teal-800 border-teal-250";
                      } else if (mType === "Dinner") {
                        mealBadgeStyle = "bg-indigo-50 text-indigo-850 border-indigo-250";
                      }
                      
                      return (
                        <div key={log.id} className="py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5">
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className={`font-mono text-xs font-bold px-1.5 py-0.5 rounded ${
                                isLgWalkIn 
                                  ? 'bg-amber-100 text-amber-900 border border-amber-350' 
                                  : 'bg-slate-100 text-slate-800 border border-slate-200'
                              }`}>
                                {isLgWalkIn ? "Walk-In Customer" : log.roomNumber}
                              </span>
                              <span className="text-slate-800 font-serif font-semibold text-xs truncate max-w-[200px]">{log.guestName}</span>
                            </div>
                            <div className="flex flex-wrap items-center gap-1.5 text-[10px] text-slate-500 mt-1.5">
                              <span>Zone: <strong>{zoneObj ? zoneObj.name : log.zoneId}</strong></span>
                              <span>•</span>
                              <span>Party size: <strong>{log.partySize} dining</strong></span>
                              {isLgWalkIn && log.paymentMode && (
                                <>
                                  <span>•</span>
                                  <span className="text-amber-805 bg-amber-50 px-1 py-0.5 border border-amber-150 text-[9px] uppercase font-bold tracking-wider">{log.paymentMode}</span>
                                </>
                              )}
                            </div>
                          </div>
 
                          <div className="flex items-center justify-between sm:justify-end gap-2 shrink-0">
                            <span className="text-[10px] font-mono text-slate-500 bg-slate-50 p-1 border border-slate-150">
                              {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                            <span className={`text-[8.5px] border uppercase tracking-widest font-black px-2 py-0.5 ${mealBadgeStyle}`}>
                              {mType}
                            </span>
                          </div>
                        </div>
                      );
                    })
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* TAB 3: CAPACITY INVENTORY SETTINGS */}
        {activeSubTab === "capacity" && (
          <motion.div
            key="tab-capacity"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex flex-col gap-6"
          >
            <div className="bg-white border border-slate-150 p-6">
              <div className="border-b border-slate-100 pb-3">
                <span className="text-[10px] uppercase font-display font-black text-[#C5A02D] tracking-widest flex items-center gap-2">
                  <Armchair size={15} /> Seating Layout Configurations Setup
                </span>
                <p className="text-[10px] text-slate-500 mt-1 leading-relaxed">
                  Configure maximum Tables and Chairs capacity setup for the 3 distinct food & beverage dining zones of the resort properties.
                </p>
              </div>

              {/* CARD DECK */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
                {zones.map((z) => {
                  const isEditing = editingCapacityZone === z.id;
                  return (
                    <div key={z.id} className="border border-slate-150 bg-slate-50/50 p-6 flex flex-col gap-4">
                      <div className="border-b border-slate-150 pb-2 flex items-center justify-between">
                        <span className="text-xs font-serif font-black text-slate-900">{z.name}</span>
                        <Sliders size={14} className="text-[#C5A02D]" />
                      </div>

                      {isEditing ? (
                        <div className="flex flex-col gap-3">
                          <div className="flex flex-col gap-1">
                            <label className="text-[9px] uppercase font-bold text-slate-500">Tables Count Needed</label>
                            <input
                              type="number"
                              value={tempTables}
                              onChange={e => setTempTables(parseInt(e.target.value) || 0)}
                              className="border border-slate-200 px-2 py-1 text-xs font-mono outline-none"
                            />
                          </div>

                          <div className="flex flex-col gap-1">
                            <label className="text-[9px] uppercase font-bold text-slate-500">Chairs Capacity Count</label>
                            <input
                              type="number"
                              value={tempChairs}
                              onChange={e => setTempChairs(parseInt(e.target.value) || 0)}
                              className="border border-slate-200 px-2 py-1 text-xs font-mono"
                            />
                          </div>

                          <div className="flex gap-2 pt-1">
                            <button
                              onClick={() => handleSaveCapacitySetting(z.id)}
                              className="bg-slate-900 text-white hover:bg-green-600 text-[10px] font-display uppercase tracking-wider py-1 px-3 text-xs"
                            >
                              Save Setup
                            </button>
                            <button
                              onClick={() => setEditingCapacityZone(null)}
                              className="border border-slate-200 text-slate-700 hover:bg-slate-100 text-[10px] uppercase py-1 px-3"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col gap-2">
                          <div className="flex justify-between text-xs text-slate-705 font-mono">
                            <span>Max Setup Tables:</span>
                            <span className="font-bold text-slate-900">{z.tables} Tables</span>
                          </div>

                          <div className="flex justify-between text-xs text-slate-705 font-mono">
                            <span>Max Setup Chairs:</span>
                            <span className="font-bold text-slate-900">{z.chairs} Chairs</span>
                          </div>

                          <div className="flex justify-between text-xs text-slate-705 font-mono border-b border-slate-150 pb-2.5">
                            <span>Expected Occupancy:</span>
                            <span className="font-bold text-slate-900">{z.occupiedTables} Tables Occupied</span>
                          </div>

                          {/* Table Map Visualizer Status Indicators */}
                          <div className="pt-2">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-[9px] uppercase tracking-wider font-extrabold text-[#C5A02D] flex items-center gap-1.5">
                                <Armchair size={11} /> Table Status Map Grid
                              </span>
                              <span className="text-[8px] text-slate-400 font-mono">Tap to change status</span>
                            </div>

                            {/* Legend */}
                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mb-3 text-[8.5px] uppercase tracking-wider font-semibold font-mono text-slate-500">
                              <div className="flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                <span>Available ({Object.values(tableStatuses[z.id] || {}).filter(s => s === "Available").length || Math.max(0, z.tables - (Object.values(tableStatuses[z.id] || {}).filter(s => s !== "Available").length))})</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                                <span>Occupied ({Object.values(tableStatuses[z.id] || {}).filter(s => s === "Occupied").length})</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                                <span>Cleaning ({Object.values(tableStatuses[z.id] || {}).filter(s => s === "Cleaning").length})</span>
                              </div>
                            </div>

                            <div className="grid grid-cols-6 gap-1.5 max-h-[160px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-200">
                              {Array.from({ length: z.tables }).map((_, index) => {
                                const tableNum = index + 1;
                                const status = tableStatuses[z.id]?.[tableNum] || "Available";

                                let statusBg = "bg-emerald-50 text-emerald-800 border-emerald-150 hover:bg-emerald-100";
                                let dotBg = "bg-emerald-500";
                                if (status === "Occupied") {
                                  statusBg = "bg-amber-50 text-amber-850 border-amber-200 hover:bg-amber-100";
                                  dotBg = "bg-amber-500";
                                } else if (status === "Cleaning") {
                                  statusBg = "bg-indigo-50 text-indigo-805 border-indigo-200 hover:bg-indigo-100";
                                  dotBg = "bg-indigo-500";
                                }

                                return (
                                  <button
                                    key={tableNum}
                                    onClick={() => {
                                      const nextStatus = status === "Available" ? "Occupied" : status === "Occupied" ? "Cleaning" : "Available";
                                      setTableStatuses(prev => {
                                        const zoneMap = { ...(prev[z.id] || {}) };
                                        zoneMap[tableNum] = nextStatus;

                                        // Recalculate dynamic occupant tables
                                        const occupiedCount = Object.values(zoneMap).filter(v => v === "Occupied").length;
                                        setZones(oldZones => oldZones.map(oz => oz.id === z.id ? { ...oz, occupiedTables: occupiedCount } : oz));

                                        return {
                                          ...prev,
                                          [z.id]: zoneMap
                                        };
                                      });
                                    }}
                                    type="button"
                                    title={`Table ${tableNum}: ${status} (Tap to change)`}
                                    className={`border p-1 text-center font-mono text-[9px] font-bold rounded-none transition-all flex flex-col items-center justify-center gap-0.5 cursor-pointer select-none h-11 ${statusBg}`}
                                  >
                                    <span className="text-[8px] text-slate-650">T-{tableNum}</span>
                                    <span className={`w-1.5 h-1.5 rounded-full ${dotBg} transition-transform duration-200 animate-pulse`} />
                                  </button>
                                );
                              })}
                            </div>
                          </div>

                          <button
                            onClick={() => {
                              setEditingCapacityZone(z.id);
                              setTempTables(z.tables);
                              setTempChairs(z.chairs);
                            }}
                            className="mt-3 text-center w-full border border-slate-250 text-[#C5A02D] hover:bg-slate-900 hover:text-white hover:border-transparent py-1.5 text-[9px] font-display uppercase tracking-widest font-black transition-all"
                          >
                            Re-Configure Grid Settings
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}

        {/* TAB 4: RESERVATIONS BOOKINGS */}
        {activeSubTab === "reservations" && (
          <motion.div
            key="tab-reservations"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start"
          >
            {/* ADD BOOKING FORM */}
            <div className="lg:col-span-5 bg-white border border-slate-150 p-6 flex flex-col gap-4">
              <div className="border-b border-slate-100 pb-3">
                <span className="text-[10px] uppercase font-display font-black text-[#C5A02D] tracking-widest flex items-center gap-2">
                  <Calendar size={15} /> Book Dine Seating Reservation
                </span>
                <p className="text-[10px] text-slate-400 mt-1 italic leading-relaxed">
                  Reserve a dining table for premium guests or VIP accounts in a specific restaurant sector.
                </p>
              </div>

              {resAlert && (
                <div className="p-3 bg-green-50 border border-green-200 text-green-800 text-xs flex items-center gap-1.5">
                  <CheckCircle size={14} />
                  <span>{resAlert}</span>
                </div>
              )}

              <form onSubmit={handleCreateReservation} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-[9px] uppercase font-bold text-slate-500">Diner Guest Name</label>
                  <input
                    type="text"
                    required
                    placeholder="Charles"
                    value={resName}
                    onChange={e => setResName(e.target.value)}
                    className="border border-slate-200 px-3 py-2 text-xs font-mono outline-none focus:border-[#C5A02D]"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[9px] uppercase font-bold text-slate-500">Representative Room Number</label>
                  <input
                    type="text"
                    required
                    placeholder="E.g. Room 302"
                    value={resRoom}
                    onChange={e => setResRoom(e.target.value)}
                    className="border border-slate-200 px-3 py-2 text-xs font-mono outline-none focus:border-[#C5A02D]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] uppercase font-bold text-slate-500">Party Seating size</label>
                    <select
                      value={resPartySize}
                      onChange={e => setResPartySize(e.target.value)}
                      className="border border-slate-200 px-2 py-2 text-xs font-mono"
                    >
                      <option value="2">2 Persons</option>
                      <option value="4">4 Persons</option>
                      <option value="6">6 Persons</option>
                      <option value="8">8 Persons</option>
                    </select>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] uppercase font-bold text-slate-500">Selected Zone Sector</label>
                    <select
                      value={resZone}
                      onChange={e => setResZone(e.target.value)}
                      className="border border-slate-200 px-2 py-2 text-xs font-mono"
                    >
                      {zones.map(z => (
                        <option key={z.id} value={z.id}>{z.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] uppercase font-bold text-slate-500">Time-Slot Hour</label>
                    <select
                      value={resTime}
                      onChange={e => setResTime(e.target.value)}
                      className="border border-slate-200 px-2 py-2 text-xs font-mono"
                    >
                      <option value="07:00 AM - 08:30 AM">07:00 AM - 08:30 AM</option>
                      <option value="08:30 AM - 10:00 AM">08:30 AM - 10:00 AM</option>
                      <option value="12:00 PM - 02:00 PM">12:00 PM - 02:00 PM</option>
                      <option value="06:30 PM - 08:30 PM">06:30 PM - 08:30 PM</option>
                      <option value="08:30 PM - 10:30 PM">08:30 PM - 10:30 PM</option>
                    </select>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] uppercase font-bold text-slate-500">Date Plan</label>
                    <input
                      type="date"
                      value={resDate}
                      onChange={e => setResDate(e.target.value)}
                      className="border border-slate-200 px-2 py-1.5 text-xs font-mono"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full bg-[#C5A02D] hover:bg-black text-white text-[10px] font-display uppercase tracking-widest font-black py-2.5 shadow-md"
                >
                  Confirm Seat reservation
                </button>
              </form>
            </div>

            {/* LIVE BOOKINGS LIST */}
            <div className="lg:col-span-7 bg-white border border-slate-150 p-6 flex flex-col gap-4">
              <div className="border-b border-slate-100 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <span className="text-[10px] uppercase font-display font-black text-slate-400 tracking-widest">
                    Future Reservations Registry
                  </span>
                  <p className="text-[10px] text-slate-400">Arriving dining lists setup config.</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <div className="flex items-center gap-1.5 border border-slate-200 bg-slate-50 px-2 py-1">
                    <span className="text-[9px] font-display font-bold uppercase tracking-wider text-slate-500">Sort:</span>
                    <select
                      value={resSortBy}
                      onChange={(e) => setResSortBy(e.target.value as any)}
                      className="bg-transparent text-[10px] font-mono outline-none text-slate-800 cursor-pointer"
                    >
                      <option value="latest">Latest Booked</option>
                      <option value="oldest">Oldest Booked</option>
                      <option value="name">Name (A-Z)</option>
                      <option value="partySize">Party Size (High-Low)</option>
                    </select>
                  </div>
                  <button
                    onClick={() => {
                      if (confirm("Reset reservation bookings?")) {
                        setReservations([]);
                      }
                    }}
                    className="text-[9px] uppercase tracking-widest font-extrabold text-red-650 hover:underline border border-dashed border-red-200 px-2 py-1 bg-red-50/30 font-bold"
                  >
                    Clear Booking Grid
                  </button>
                </div>
              </div>

              <div className="divide-y divide-slate-100 max-h-96 overflow-y-auto">
                {sortedReservations.length === 0 ? (
                  <div className="p-8 text-center text-slate-400 font-serif italic text-xs">
                    No dining reservations booked in system files yet. Add reservations to see layout logs.
                  </div>
                ) : (
                  sortedReservations.map((res) => {
                    const zoneObj = zones.find(z => z.id === res.zoneId);
                    return (
                      <div key={res.id} className="py-3.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 hover:bg-slate-50/50">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-slate-900 font-serif font-semibold text-xs truncate max-w-[200px]">{res.guestName}</span>
                            <span className="font-mono text-[9px] bg-slate-50 border border-slate-100 text-slate-600 px-1 py-0.5 shrink-0">Room {res.roomNumber}</span>
                          </div>
                          <div className="flex flex-wrap items-center gap-1.5 text-[10px] text-slate-500 mt-1">
                            <span>Zone Sector: <strong className="text-slate-700">{zoneObj ? zoneObj.name : res.zoneId}</strong></span>
                            <span>•</span>
                            <span>Admitting Party: <strong className="text-[#C5A02D]">{res.partySize} Guests</strong></span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                          <span className="text-[9px] font-mono text-slate-400 bg-slate-50 border border-slate-100 px-1.5 py-0.5">
                            Planned: {res.dateString}
                          </span>
                          <span className="text-[10px] font-mono text-slate-700 bg-slate-100 px-2 py-1 font-bold border border-slate-200">
                            {res.timeSlot}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MODAL / NEW GUEST REGISTRATION */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white max-w-md w-full shadow-2xl overflow-hidden"
          >
            <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
              <span className="font-serif italic text-base flex items-center gap-2">
                <UserPlus className="text-[#C5A02D]" size={20} /> Register New Cardholder
              </span>
              <button onClick={() => setShowCreateForm(false)} className="text-slate-400 hover:text-white">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateProfile} className="p-6 flex flex-col gap-4">
              {formError && (
                <div className="p-3 bg-red-50 text-red-750 text-xs flex items-center gap-1.5">
                  <AlertCircle size={14} className="shrink-0" />
                  <span>{formError}</span>
                </div>
              )}
              {formSuccess && (
                <div className="p-3 bg-green-50 text-green-750 text-xs flex items-center gap-1.5">
                  <CheckCircle size={14} />
                  <span>{formSuccess}</span>
                </div>
              )}

              <div className="flex flex-col gap-1">
                <label className="text-[10px] uppercase font-display font-bold text-slate-500 tracking-wider">
                  Membership Card ID (Unique)
                </label>
                <input
                  type="text"
                  placeholder="E.g., CML-RE-104"
                  value={newCardId}
                  onChange={e => setNewCardId(e.target.value)}
                  className="border border-slate-200 p-2 text-xs font-mono rounded-none outline-none focus:border-[#C5A02D]"
                  required
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] uppercase font-display font-bold text-slate-500 tracking-wider">
                  Guest Full Name
                </label>
                <input
                  type="text"
                  placeholder="Charles"
                  value={newFullName}
                  onChange={e => setNewFullName(e.target.value)}
                  className="border border-slate-200 p-2 text-xs font-mono rounded-none outline-none"
                  required
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] uppercase font-display font-bold text-slate-500 tracking-wider">
                  Email Address
                </label>
                <input
                  type="email"
                  placeholder="charles@cml.com.fj"
                  value={newEmail}
                  onChange={e => setNewEmail(e.target.value)}
                  className="border border-slate-200 p-2 text-xs font-mono"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] uppercase font-display font-bold text-slate-500 tracking-wider">
                  Phone Contact Registry
                </label>
                <input
                  type="text"
                  placeholder="+679..."
                  value={newPhone}
                  onChange={e => setNewPhone(e.target.value)}
                  className="border border-slate-200 p-2 text-xs font-mono"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="border border-slate-250 text-slate-700 hover:bg-slate-50 px-4 py-2 font-display text-[10px] uppercase tracking-wider"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-[#C5A02D] hover:bg-black text-white px-5 py-2 font-display text-[10px] uppercase tracking-widest font-black transition-all"
                >
                  Confirm Card Registration
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* MODAL RECORD RESTAURANT VISIT TRANSACTION */}
      {showLogVisitModal && selectedProfile && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white max-w-md w-full shadow-2xl overflow-hidden"
          >
            <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
              <span className="font-serif italic text-base flex items-center gap-2">
                <Receipt className="text-[#C5A02D]" size={20} /> Append Dine Receipt Bill
              </span>
              <button onClick={() => setShowLogVisitModal(false)} className="text-slate-400 hover:text-white">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleLogVisit} className="p-6 flex flex-col gap-4">
              <div className="p-3 bg-blue-50 border border-blue-105 text-slate-700 text-[11px]">
                <strong className="text-[#C5A02D] block">Fiji Diner Rewards Rule:</strong>
                Fiji visits credit <strong>100 points Base</strong> + <strong>10 points per dollar ($1)</strong> spent at our premium bistros.
              </div>

              {visitLogError && (
                <span className="text-xs text-red-500 font-mono">{visitLogError}</span>
              )}
              {visitLogSuccess && (
                <span className="text-xs text-green-600 font-mono">{visitLogSuccess}</span>
              )}

              <div className="flex flex-col gap-1">
                <label className="text-[10px] uppercase font-display font-bold text-slate-500">Selected Diner Account</label>
                <div className="text-xs font-bold font-serif bg-slate-50 p-2.5 border border-slate-200">
                  {selectedProfile.fullName}
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] uppercase font-display font-bold text-slate-500">Invoice Draft Receipt Number</label>
                <input
                  type="text"
                  placeholder="REC-904..."
                  value={receiptNumber}
                  onChange={e => setReceiptNumber(e.target.value)}
                  className="border border-slate-200 p-2.5 text-xs font-mono"
                  required
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] uppercase font-display font-bold text-slate-500">Invoice Total Bill (FJD $)</label>
                <input
                  type="number"
                  placeholder="0.00"
                  step="0.01"
                  value={billAmount}
                  onChange={e => setBillAmount(e.target.value)}
                  className="border border-slate-200 p-2.5 text-xs font-mono"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowLogVisitModal(false)}
                  className="border border-slate-250 text-slate-700 hover:bg-slate-50 px-4 py-2 font-display text-[10px] uppercase"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-slate-900 hover:bg-[#C5A02D] text-white px-5 py-2 font-display text-[10px] uppercase tracking-widest font-black transition-all"
                >
                  Authorize Allocation
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
};
