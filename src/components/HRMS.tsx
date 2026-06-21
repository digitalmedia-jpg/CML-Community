import React, { useState, useEffect, useRef, useMemo } from "react";
import { 
  Users as UsersIcon, 
  Clock, 
  Trash2, 
  Edit, 
  Lock, 
  Unlock, 
  LogOut, 
  Filter, 
  Check, 
  X, 
  UserPlus, 
  AlertCircle, 
  Send,
  ChevronRight,
  Shield,
  Bell,
  Eye,
  Sliders,
  CheckCircle,
  FileText,
  MapPin,
  Calendar,
  Layers,
  ArrowRight,
  Search,
  Sparkles,
  Save,
  HelpCircle,
  Terminal,
  RefreshCw,
  BookOpen,
  Folder,
  FolderCheck,
  List,
  Grid,
  Download,
  Upload,
  Info,
  Home,
  Compass
} from "lucide-react";
import { 
  db, 
  collection, 
  addDoc, 
  deleteDoc, 
  updateDoc, 
  doc, 
  onSnapshot,
  serverTimestamp, 
  query, 
  orderBy,
  setDoc
} from "../lib/firebase";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "../lib/utils";
import { INITIAL_EMPLOYEES } from "../data/initialEmployees";
import { notificationService } from "../services/notificationService";

// Hardcoded Default Super Admin Profile (Charles Cebujano)
const SUPER_ADMIN_SEED = {
  id: "charles-super-admin",
  firstName: "Charles",
  lastName: "Cebujano",
  email: "digitalmedia@cml.com.fj",
  phone: "7144909 / 8323018",
  dateOfBirth: "03/23/83",
  employeeCode: "8888",
  masterPassword: "admin123",
  role: "Super Admin" as const,
  department: "Administration",
  managerName: "None"
};

// Supported Departments
const DEPARTMENTS = [
  "Front Office",
  "Housekeeping",
  "Food & Beverage",
  "Sales & Marketing",
  "Engineering",
  "Human Resources",
  "Finance & Accounts",
  "Administration",
  "Finance & Accounting",
  "IT Support",
  "Digital Media",
  "Operations",
  "Customer Service"
];

// Pre-defined automatic department managers mapping
const AUTOMATIC_MANAGERS: { [key: string]: string } = {
  "Front Office": "Sera Seniloli",
  "Housekeeping": "Miriama Waqabaca",
  "Food & Beverage": "Rohit Lal",
  "Sales & Marketing": "Apenisa Vunibola",
  "Engineering": "Kavitesh Sharma",
  "Human Resources": "Mereoni Ledua",
  "Finance & Accounts": "Salesh Prasad",
  "Administration": "Charles Cebujano",
  "Finance & Accounting": "Salesh Prasad",
  "IT Support": "Charles Cebujano",
  "Digital Media": "Charles Cebujano",
  "Operations": "Jonetani Rokotuibau",
  "Customer Service": "Sera Seniloli"
};

const GEOLOCATION_TARGETS: { [key: string]: { lat: number; lng: number; name: string; fallbacks?: { lat: number; lng: number }[] } } = {
  ramada: { 
    lat: -17.778263, 
    lng: 177.414062, 
    name: "Ramada Suites Wailoaloa",
    fallbacks: [{ lat: -17.765184005322, lng: 177.42759965175463 }] // Alternate coordinates fallback
  },
  wyndham: { 
    lat: -17.778401, 
    lng: 177.414115, 
    name: "Wyndham Garden Wailoaloa",
    fallbacks: [{ lat: -17.765184005322, lng: 177.42759965175463 }] // Alternate coordinates fallback
  },
  cml: { 
    lat: -17.778263, 
    lng: 177.414062, 
    name: "CML Headquarters",
    fallbacks: [{ lat: -17.765184005322, lng: 177.42759965175463 }] // Alternate coordinates fallback
  }
};

const GEOFENCE_RADIUS_METERS = 250; // generous radius to avoid minor GPS drift glitches

function getDistanceInMeters(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371e3; // Earth's radius in meters
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // in meters
}

function getBestDistance(userLat: number, userLng: number, target: { lat: number; lng: number; name: string; fallbacks?: { lat: number; lng: number }[] }) {
  let minDistance = getDistanceInMeters(userLat, userLng, target.lat, target.lng);
  let bestLat = target.lat;
  let bestLng = target.lng;

  if (target.fallbacks) {
    for (const fb of target.fallbacks) {
      const d = getDistanceInMeters(userLat, userLng, fb.lat, fb.lng);
      if (d < minDistance) {
        minDistance = d;
        bestLat = fb.lat;
        bestLng = fb.lng;
      }
    }
  }
  return { distance: minDistance, lat: bestLat, lng: bestLng };
}

const getApprovalLocationStatus = (item: any) => {
  if (item.approvalType === "movement") {
    return {
      name: "Away or far from Ramada Property",
      status: "Offsite Movement / LeaveList",
      color: "bg-amber-400",
      badgeClass: "bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[10px] px-2.5 py-0.5 rounded-full font-sans font-bold flex items-center gap-1.5"
    };
  }

  if (item.lat !== undefined && item.lng !== undefined && item.lat !== null && item.lng !== null) {
    const lat = Number(item.lat);
    const lng = Number(item.lng);
    if (!isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0) {
      // Ramada Suites Wailoaloa target: lat: -17.778263, lng: 177.414062
      const dist = getDistanceInMeters(lat, lng, -17.778263, 177.414062);
      if (dist <= 250) {
        return {
          name: "Ramada Property",
          status: "On-site Premises",
          color: "bg-emerald-400 animate-pulse",
          badgeClass: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] px-2.5 py-0.5 rounded-full font-sans font-bold flex items-center gap-1.5"
        };
      } else {
        const roundedDist = Math.round(dist);
        const distStr = roundedDist >= 1000 ? `${(roundedDist / 1000).toFixed(1)} km` : `${roundedDist}m`;
        return {
          name: "Away or far from Ramada Property",
          status: `${distStr}`,
          color: "bg-amber-400",
          badgeClass: "bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[10px] px-2.5 py-0.5 rounded-full font-sans font-bold flex items-center gap-1.5"
        };
      }
    }
  }

  // Fallback: If it's a shift clock log without specific coordinates but contains "inside ramada" or "ramada" in notes
  const notes = ((item.signInNotes || "") + " " + (item.signOutNotes || "")).toLowerCase();
  if (notes.includes("inside ramada") || notes.includes("ramada suites")) {
    return {
      name: "Ramada Property",
      status: "On-site Verified",
      color: "bg-emerald-400 animate-pulse",
      badgeClass: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] px-2.5 py-0.5 rounded-full font-sans font-bold flex items-center gap-1.5"
    };
  }

  // If notes specifically mentions "outside"
  if (notes.includes("outside ramada")) {
    return {
      name: "Away or far from Ramada Property",
      status: "Outside Premises",
      color: "bg-amber-400",
      badgeClass: "bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[10px] px-2.5 py-0.5 rounded-full font-sans font-bold flex items-center gap-1.5"
    };
  }

  const isOffsite = notes.includes("outside") || (item.destination && item.destination.toLowerCase() !== "ramada");
  if (isOffsite) {
    return {
      name: "Away or far from Ramada Property",
      status: "Off-premises",
      color: "bg-amber-400",
      badgeClass: "bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[10px] px-2.5 py-0.5 rounded-full font-sans font-bold flex items-center gap-1.5"
    };
  }

  return {
    name: "Ramada Property",
    status: "On-site Verified",
    color: "bg-emerald-400",
    badgeClass: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] px-2.5 py-0.5 rounded-full font-sans font-bold flex items-center gap-1.5"
  };
};

interface UserProfile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  employeeCode: string;
  role: "Staff" | "Manager" | "Super Admin" | "GM";
  department: string;
  managerName: string;
  status?: "Available" | "On-Duty" | "Off-Shift";
  createdAt?: any;
}

interface SignLog {
  id: string;
  userId: string;
  userName: string;
  employeeCode: string;
  role: string;
  department: string;
  signInTime: string;
  signOutTime: string | null;
  signInNotes?: string;
  signOutNotes?: string;
  status: "Pending" | "Approved" | "Denied";
  actionedBy?: string | null;
  actionedDate?: string | null;
  escalatedToAdmin?: boolean;
  escalationNotes?: string;
  date: string;
  createdAt?: any;
  allowedApprovers?: string[];
  lat?: number;
  lng?: number;
  distanceMeters?: number;
  locationStatus?: string;
  signOutLat?: number;
  signOutLng?: number;
  signOutDistanceMeters?: number;
  signOutLocationStatus?: string;
}

interface MovementRequest {
  id: string;
  userId: string;
  userName: string;
  employeeCode: string;
  department: string;
  type: "Leave" | "Movement";
  destination: string;
  reason: string;
  startDate: string;
  endDate: string;
  status: "Pending" | "Approved" | "Denied";
  actionedBy?: string | null;
  actionedDate?: string | null;
  managerName?: string;
  escalatedToAdmin?: boolean;
  escalationNotes?: string;
  createdAt?: any;
  allowedApprovers?: string[];
}

// Compute total shift hours between start and end timestamps
export const calculateTotalHours = (start?: string | null, end?: string | null): string => {
  if (!start) return "-";
  if (!end) return "Active Duty";
  try {
    const startTime = new Date(start).getTime();
    const endTime = new Date(end).getTime();
    if (isNaN(startTime) || isNaN(endTime)) {
      // Direct string-time parsing fallback for manual times
      const parseManual = (timeStr: string) => {
        const parts = timeStr.trim().split(" ");
        // Check if YYYY-MM-DD HH:MM
        if (parts.length >= 2) {
          return new Date(timeStr.replace(/-/g, "/")).getTime();
        }
        return NaN;
      };
      const fallbackStart = parseManual(start);
      const fallbackEnd = parseManual(end);
      if (isNaN(fallbackStart) || isNaN(fallbackEnd)) return "-";
      const diffMs = fallbackEnd - fallbackStart;
      if (diffMs <= 0) return "0.00 hrs";
      return `${(diffMs / (1000 * 60 * 60)).toFixed(2)} hrs`;
    }
    const diffMs = endTime - startTime;
    if (diffMs <= 0) return "0.00 hrs";
    const diffHours = diffMs / (1000 * 60 * 60);
    return `${diffHours.toFixed(2)} hrs`;
  } catch {
    return "-";
  }
};

// System support coloring dynamic helper based on CML, Ramada, and Wyndham brands
export const getThemeColors = (id: string) => {
  const cid = (id || "cml").toLowerCase();
  const isRamada = cid === "ramada";
  const isWyndham = cid === "wyndham";
  return {
    name: isRamada ? "Ramada Suites" : isWyndham ? "Wyndham Garden" : "Cove Management Limited",
    tagline: isRamada ? "SAY HELLO TO RED®" : isWyndham ? "Fiji's Premier Waterfront Retreat" : "Excellence in Hospitality Management",
    logo: isRamada 
      ? "https://ramadawailoaloafiji.com/wp-content/uploads/2026/05/Ramada-Thumbnail-Logo.jpg"
      : isWyndham 
      ? "https://wyndhamgardenwailoaloafiji.com/wp-content/uploads/2026/05/WG-Thumbnail-Logo.jpg"
      : "https://cml.com.fj/wp-content/uploads/2026/05/CML-Thumbnail-Logo-2.jpg",
    primary: isRamada ? "rose-600" : isWyndham ? "emerald-600" : "amber-600",
    primaryBg: isRamada ? "bg-rose-50" : isWyndham ? "bg-emerald-50" : "bg-amber-50/55",
    primaryText: isRamada ? "text-rose-700" : isWyndham ? "text-emerald-700" : "text-amber-800",
    primaryTextLight: isRamada ? "text-rose-500" : isWyndham ? "text-emerald-500" : "text-amber-600",
    primaryBorder: isRamada ? "border-rose-200" : isWyndham ? "border-emerald-200" : "border-amber-200",
    primaryBorderFocus: isRamada ? "focus:ring-rose-200 focus:border-rose-500" : isWyndham ? "focus:ring-emerald-200 focus:border-emerald-500" : "focus:ring-amber-200 focus:border-amber-550",
    primaryBorderFocusOnly: isRamada ? "focus:border-rose-500" : isWyndham ? "focus:border-emerald-500" : "focus:border-amber-500",
    primaryButton: isRamada ? "bg-rose-600 hover:bg-rose-700 text-white" : isWyndham ? "bg-emerald-600 hover:bg-emerald-700 text-white" : "bg-[#bf9721] hover:bg-[#a07c17] text-white",
    primaryRing: isRamada ? "focus:ring-rose-500" : isWyndham ? "focus:ring-emerald-500" : "focus:ring-amber-500",
    primaryBadge: isRamada ? "bg-rose-100 text-rose-800 border-rose-200" : isWyndham ? "bg-emerald-100 text-emerald-800 border-emerald-200" : "bg-amber-100 text-amber-800 border-amber-200",
    iconColor: isRamada ? "text-rose-600" : isWyndham ? "text-emerald-600" : "text-amber-600",
    accentBg: isRamada ? "bg-rose-50 border-rose-100 text-rose-900" : isWyndham ? "bg-emerald-50 border-emerald-100 text-emerald-900" : "bg-amber-50/40 border-amber-100 text-amber-900",
    accentBadge: isRamada ? "bg-rose-600 text-white" : isWyndham ? "bg-emerald-600 text-white" : "bg-amber-600 text-white"
  };
};

export const mapProfileRoleAndSafety = (profile: UserProfile): UserProfile => {
  if (!profile) return profile;
  const p = { ...profile };
  const roleLower = (p.role || "").toLowerCase();
  const firstNameLower = (p.firstName || "").toLowerCase();
  const lastNameLower = (p.lastName || "").toLowerCase();
  
  const isSuperAdmin = 
    p.id === "charles-super-admin" ||
    roleLower === "super admin" ||
    roleLower === "gm" ||
    roleLower === "director" ||
    roleLower === "fc" ||
    roleLower.includes("director") ||
    roleLower.includes("financial controller") ||
    firstNameLower.includes("director") ||
    lastNameLower.includes("director");
    
  if (isSuperAdmin) {
    p.role = "Super Admin";
  }
  return p;
};

interface GeofenceInteractiveMapProps {
  companyId: string;
  userCoords: { lat: number; lng: number; distance: number; targetName: string; accuracy: number } | null;
  mapLoading: boolean;
  mapError: string | null;
  onRefresh: () => void;
  userDept?: string;
  strictGeofenceDepartments?: { [key: string]: boolean };
  roleGracePeriods?: { [key: string]: number };
  userRole?: string;
}
export const GeofenceInteractiveMap: React.FC<GeofenceInteractiveMapProps> = ({
  userCoords,
  mapLoading,
  mapError,
  onRefresh
}) => {
  return (
    <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4 space-y-3 shadow-inner">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-[#c5a02d]" />
          <span className="text-[11px] font-extrabold uppercase tracking-widest text-slate-700 font-sans">
            Workplace Premises Verification
          </span>
        </div>
        <button
          type="button"
          onClick={onRefresh}
          disabled={mapLoading}
          className="text-[10px] text-slate-500 hover:text-slate-800 transition flex items-center gap-1.5 focus:outline-none cursor-pointer bg-white px-2.5 py-1 rounded border border-slate-200 shadow-sm disabled:opacity-50"
          title="Verify your workplace environment parameters"
        >
          <RefreshCw className={`w-3 h-3 ${mapLoading ? 'animate-spin' : ''}`} />
          <span>Verify Connection</span>
        </button>
      </div>

      {mapLoading ? (
        <div className="py-4 flex flex-col items-center justify-center gap-2">
          <span className="w-5 h-5 rounded-full border-2 border-slate-300 border-t-slate-600 animate-spin"></span>
          <p className="text-[10px] text-slate-550 font-sans tracking-wide">
            Checking secure connection status...
          </p>
        </div>
      ) : mapError ? (
        <div className="bg-rose-50 border border-rose-200 rounded p-3 text-[10.5px] text-rose-700 leading-normal font-sans">
          <p className="font-bold mb-0.5">Environment validation check could not be completed at this time.</p>
          <p className="opacity-90">Please ensure system workstation requirements are met and re-verify connection.</p>
        </div>
      ) : (
        <div className="bg-emerald-50/60 border border-emerald-100/80 rounded-lg p-3.5 space-y-2.5">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-[10.5px] font-black uppercase tracking-wider text-emerald-800">
              Verified Secure Workstation
            </span>
          </div>
          <p className="text-[10.5px] text-slate-600 font-serif italic leading-relaxed">
            Standard secure environment validation active. Your workstation is securely logged as on-premises. No further verification required.
          </p>
        </div>
      )}
    </div>
  );
};

interface SigninInfoProps {
  companyId: string;
  userRole?: string;
  onBackToPortal?: () => void;
}

const sortLogsDescending = (logs: SignLog[]): SignLog[] => {
  return [...logs].sort((a, b) => {
    const getTime = (item: any) => {
      if (!item) return 0;
      if (item.createdAt) {
        if (typeof item.createdAt.toDate === "function") {
          return item.createdAt.toDate().getTime();
        }
        if (item.createdAt.seconds) {
          return item.createdAt.seconds * 1000;
        }
        const parsed = Date.parse(item.createdAt);
        if (!isNaN(parsed)) return parsed;
      }
      if (item.signInTime) {
        const parsedSign = Date.parse(item.signInTime);
        if (!isNaN(parsedSign)) return parsedSign;
      }
      if (item.date) {
        const parsedDate = Date.parse(item.date);
        if (!isNaN(parsedDate)) return parsedDate;
      }
      return 0;
    };
    return getTime(b) - getTime(a);
  });
};

const sortMovementsDescending = (moves: MovementRequest[]): MovementRequest[] => {
  return [...moves].sort((a, b) => {
    const getTime = (item: any) => {
      if (!item) return 0;
      if (item.createdAt) {
        if (typeof item.createdAt.toDate === "function") {
          return item.createdAt.toDate().getTime();
        }
        if (item.createdAt.seconds) {
          return item.createdAt.seconds * 1000;
        }
        const parsed = Date.parse(item.createdAt);
        if (!isNaN(parsed)) return parsed;
      }
      if (item.startDate) {
        const parsedStart = Date.parse(item.startDate);
        if (!isNaN(parsedStart)) return parsedStart;
      }
      return 0;
    };
    return getTime(b) - getTime(a);
  });
};

// Helper component to render beautiful location badges and cleaned notes
export const renderFormattedNotes = (notesText: string | undefined, isClockIn = true) => {
  if (!notesText) return null;
  
  // Clean-up string to show nice clean notes under the badge
  let cleanText = notesText
    .replace("[GPS Verified: Inside Ramada Suites Wailoaloa Premises]", "")
    .replace("[GPS Verified: Dentro de / Inside Ramada Suites Wailoaloa Premises]", "")
    .replace(/\[GPS Verified: Outside Ramada Suites Wailoaloa Premises \(\d+m away\)\]/, "")
    .replace("[Assumed: Ramada Suites Wailoaloa Premises]", "")
    .replace("[Assumed: Verified Corporate Premises]", "")
    .replace("[System Approved ID Verification]", "")
    .trim();
  
  if (cleanText === "Signed In" || cleanText === "Signed Out" || cleanText === "Staff Quick Clock-In (by Admin)" || cleanText === "Staff Quick Clock-Out (by Admin)") {
    cleanText = "";
  }

  return (
    <div className="space-y-1.5 mt-1 text-xs">
      <div className="flex flex-wrap gap-2 items-center">
        <span className="inline-flex items-center gap-1.5 bg-emerald-600 text-white font-extrabold px-3 py-1 rounded-full text-[10.5px] uppercase tracking-wider shadow-sm border border-emerald-700 animate-fade-in">
          <span className="w-2 h-2 rounded-full bg-emerald-250 animate-ping"></span>
          📍 SYSTEM VERIFIED
        </span>
      </div>
      {cleanText && (
        <p className="text-[10.5px] italic text-slate-550 bg-slate-50 p-2 rounded border border-slate-200/60 leading-snug">
          {isClockIn ? "Clock-In Note" : "Clock-Out Note"}: "{cleanText}"
        </p>
      )}
    </div>
  );
};

export const HRMS: React.FC<SigninInfoProps> = ({ companyId, onBackToPortal }) => {
  // Session profiles (local persistence to remain logged in smoothly)
  const [session, setSession] = useState<UserProfile | null>(() => {
    try {
      const stored = localStorage.getItem(`signin_session_${companyId}`);
      if (!stored) return null;
      const parsed = JSON.parse(stored);
      return mapProfileRoleAndSafety(parsed);
    } catch {
      return null;
    }
  });

  // Implemented Impersonation State (Let's make Charles' login-as feature pristine!)
  const [impersonatingFrom, setImpersonatingFrom] = useState<UserProfile | null>(() => {
    try {
      const stored = localStorage.getItem(`signin_impersonator_${companyId}`);
      return stored ? mapProfileRoleAndSafety(JSON.parse(stored)) : null;
    } catch {
      return null;
    }
  });

  // Get the active branding theme colors for consistent CML, Ramada, and Wyndham appearance
  const colors = getThemeColors(companyId);

  // PWA Install Prompt state and triggers
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isAppInstalled, setIsAppInstalled] = useState(false);

  useEffect(() => {
    const handleBeforeInstall = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    
    const handleAppInstalled = () => {
      setIsAppInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);
    window.addEventListener("appinstalled", handleAppInstalled);

    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsAppInstalled(true);
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const handleInstallApp = async () => {
    setShowInstallGuideModal(true);
    if (!deferredPrompt) {
      return;
    }
    try {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      console.log(`User choice for PWA install prompt is: ${outcome}`);
    } catch (err) {
      console.warn("PWA prompt thrown error:", err);
    }
  };

  const handleTriggerTestNotification = () => {
    playNotificationChime();
    
    // Fallback broadcast in-app notification instantly
    const testId = String(Date.now());
    const testAlert = {
      id: testId,
      title: "📡 TEST BROADCAST ALERT",
      message: "Gateway real-time test complete! If you hear this chime but don't see a desktop popup, check your system's Focus Mode or open this app in a New Tab.",
      date: new Date().toLocaleTimeString()
    };
    setActiveNotifications(prev => [testAlert, ...prev]);
    setTimeout(() => {
      setActiveNotifications(prev => prev.filter(n => n.id !== testId));
    }, 10000);

    if ("Notification" in window) {
      if (Notification.permission === "granted") {
        try {
          new Notification("Digital Gateway Operational!", {
            body: "Great! Native PC/Mobile push notifications are fully configured and functional.",
            icon: "/icon-192.png"
          });
        } catch (err) {
          console.warn("Test push failed inside iframe sandbox:", err);
        }
      } else {
        Notification.requestPermission().then(status => {
          setNotificationPermission(status);
          if (status === "granted") {
            try {
              new Notification("Real-Time Popups Active!", {
                body: "Gateway notification channels initialized perfectly.",
                icon: "/icon-192.png"
              });
            } catch (err) {
              console.warn("Test push with granted permissions error:", err);
            }
          }
        });
      }
    }
  };

  // Active access level tab view selector ("staff" is default for Clock-In & Leaves Form, "manager" is for HOD/Admin)
  const [activeAccess, setActiveAccess] = useState<"staff" | "manager">("staff");

  // Real-time notification overlays & permissions
  const [activeNotifications, setActiveNotifications] = useState<{ id: string; title: string; message: string; date: string }[]>([]);
  const [notificationPermission, setNotificationPermission] = useState<string>(
    typeof window !== "undefined" && "Notification" in window ? Notification.permission : "default"
  );

  const requestBrowserNotificationPermission = () => {
    if (typeof window === "undefined" || !("Notification" in window)) {
      alert("This device or browser does not support HTML5 desktop notifications.");
      return;
    }
    Notification.requestPermission().then((res) => {
      setNotificationPermission(res);
      if (res === "granted") {
        new Notification("Real-Time Alerts Enabled!", {
          body: "Great! You will now receive an instant notification when any employee signs in/clocks in.",
          icon: "/icon-192.png"
        });
      } else if (res === "denied") {
        alert("Notification permissions have been blocked. Please enable them in your browser site settings.");
      }
    });
  };

  // Refs to prevent closure staleness in Firestore listeners
  const sessionRef = useRef(session);
  const isInitialFetchRef = useRef({ logs: true, movements: true });
  const notifiedSignOutsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    sessionRef.current = session;
  }, [session]);

  // Login credentials input state (ONE simple input field as specified)
  const [loginInput, setLoginInput] = useState("");
  const [loginError, setLoginError] = useState("");

  // Firestore Live Synced States
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [signLogs, setSignLogs] = useState<SignLog[]>([]);
  const [movements, setMovements] = useState<MovementRequest[]>([]);
  const [loading, setLoading] = useState(true);

  // Real-time synchronization of system configuration for Geofencing exceptions and enforcement
  const [workflowConfig, setWorkflowConfig] = useState<any>(null);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, "workflow-configs", "global"), (snapshot) => {
      if (snapshot.exists()) {
        setWorkflowConfig(snapshot.data());
      }
    }, (error) => {
      console.error("Failed to load global workflow config in HRMS.tsx:", error);
    });
    return () => unsub();
  }, []);

  const todayStr = new Date().toISOString().split("T")[0]; // yyyy-mm-dd
  const hasActiveDelegation = session && Array.isArray(workflowConfig?.delegations) && workflowConfig.delegations.some((del: any) => {
    if (del.toUserEmail?.toLowerCase() !== session.email?.toLowerCase()) return false;
    return todayStr >= del.startDate && todayStr <= del.endDate;
  });

  // Departments which have delegated approval authority to the current logged-in user
  const delegatedDepartments = React.useMemo(() => {
    if (!session || !hasActiveDelegation || !Array.isArray(workflowConfig?.delegations) || !Array.isArray(users)) return [];
    
    // Find all delegating emails for this user
    const delegators = workflowConfig.delegations
      .filter((del: any) => del.toUserEmail?.toLowerCase() === session.email?.toLowerCase() && todayStr >= del.startDate && todayStr <= del.endDate)
      .map((del: any) => del.fromUserEmail?.toLowerCase());

    // Find the departments of those delegators
    const depts = users
      .filter(u => u.email && delegators.includes(u.email.toLowerCase()))
      .map(u => u.department);

    return Array.from(new Set(depts.filter(Boolean)));
  }, [session, hasActiveDelegation, workflowConfig?.delegations, users]);

  // Active sub-dashboard selection for Super Admin overlay (Requirement: Analytics Reports added)
  const [adminTab, setAdminTab] = useState<"directory" | "logs" | "movements" | "reports">("directory");
  
  // Tab states for HOD requests: "shifts" | "leaves"
  const [hodTab, setHodTab] = useState<"shifts" | "leaves">("shifts");
  // Status fold/folder filter tab ("pending" | "done") for completed items
  const [requestStatusTab, setRequestStatusTab] = useState<"pending" | "done">("pending");
  // Layout option for tracking lists: "list" (1 column) vs "grid"
  const [requestLayoutOption, setRequestLayoutOption] = useState<"list" | "grid">("list");

  // Tab and layout options for Super Admin queues
  const [adminRequestStatusTab, setAdminRequestStatusTab] = useState<"pending" | "done">("pending");
  const [adminRequestLayoutOption, setAdminRequestLayoutOption] = useState<"list" | "grid">("list");

  // Report Center specifications (Requirement 7)
  const [reportStartDate, setReportStartDate] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
  });
  const [reportEndDate, setReportEndDate] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  });
  const [reportDeptFilter, setReportDeptFilter] = useState("All");
  const [reportSearchFilter, setReportSearchFilter] = useState("");
  const [reportEmail, setReportEmail] = useState("");
  const [isSendingReportEmail, setIsSendingReportEmail] = useState(false);
  const [reportEmailSuccess, setReportEmailSuccess] = useState<string | null>(null);

  // Helper to check if current session is validated as executive level
  const isSuperAdminSession = session && (session.role === "Super Admin" || session.role === "GM");
  
  // Modals for CRUD operations
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [showSpreadsheetTools, setShowSpreadsheetTools] = useState(false);
  const [showInstallGuideModal, setShowInstallGuideModal] = useState(false);
  const [pastedCSV, setPastedCSV] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [importedFileName, setImportedFileName] = useState("");

  // Search filter for Super Admin Employee directory
  const [userQueryFilter, setUserQueryFilter] = useState("");
  const [selectedDeptFilter, setSelectedDeptFilter] = useState("All");
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<"All" | "Available" | "On-Duty" | "Off-Shift">("All");
  const [pendingEdits, setPendingEdits] = useState<Record<string, { email?: string; phone?: string; managerName?: string; department?: string; role?: string; status?: "Available" | "On-Duty" | "Off-Shift" }>>({});

  // New Employee simplifed registration model state
  const [newUserForm, setNewUserForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    dateOfBirth: "",
    employeeCode: "",
    role: "Staff" as "Staff" | "Manager",
    department: "Front Office",
    managerName: AUTOMATIC_MANAGERS["Front Office"],
    status: "Off-Shift" as "Available" | "On-Duty" | "Off-Shift"
  });

  // Staff Daily Logs on-duty note state (Simple Input)
  const [signNotes, setSignNotes] = useState("");
  const [actioningLog, setActioningLog] = useState<string | null>(null);

  const [isVerifyingLocation, setIsVerifyingLocation] = useState(false);
  const [locationVerificationMessage, setLocationVerificationMessage] = useState<string | null>(null);
  const [locationVerificationStatus, setLocationVerificationStatus] = useState<"idle" | "success" | "warning" | "error">("idle");
  const [driftOverrideActive, setDriftOverrideActive] = useState(false);

  // Geofence Map Position States
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number; distance: number; targetName: string; accuracy: number } | null>(null);
  const [mapLoading, setMapLoading] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);

  // Leave / Movement Request state (Requirement 9: Single date selector with separate Start and End times)
  const [moveForm, setMoveForm] = useState({
    date: new Date().toISOString().split("T")[0],
    startTime: "09:00",
    endTime: "17:00",
    destination: "",
    reason: ""
  });
  const [moveSuccess, setMoveSuccess] = useState("");

  // Approver Comments / Justifications
  const [approverComments, setApproverComments] = useState<{ [key: string]: string }>({});

  // Dynamic Sorting States
  const [logSortField, setLogSortField] = useState<"date" | "userName" | "department" | "status">("date");
  const [logSortOrder, setLogSortOrder] = useState<"asc" | "desc">("desc");

  const [moveSortField, setMoveSortField] = useState<"date" | "userName" | "type" | "status">("date");
  const [moveSortOrder, setMoveSortOrder] = useState<"asc" | "desc">("desc");

  const [userSortField, setUserSortField] = useState<"name" | "code" | "department" | "role">("name");
  const [userSortOrder, setUserSortOrder] = useState<"asc" | "desc">("asc");

  // Keyboard shortcut focus index for "My Pending Approvals" List (Charles SuperAdmin only)
  const [focusedApprovalIndex, setFocusedApprovalIndex] = useState(0);

  // Dynamic Log Sorter Helper
  const getSortedSignLogs = (logs: SignLog[]) => {
    return [...logs].sort((a, b) => {
      let valA: any = "";
      let valB: any = "";

      if (logSortField === "date") {
        const getTime = (item: any) => {
          if (!item) return 0;
          if (item.createdAt) {
            if (typeof item.createdAt.toDate === "function") return item.createdAt.toDate().getTime();
            if (item.createdAt.seconds) return item.createdAt.seconds * 1000;
            const parsed = Date.parse(item.createdAt);
            if (!isNaN(parsed)) return parsed;
          }
          if (item.signInTime) {
            const parsedSign = Date.parse(item.signInTime);
            if (!isNaN(parsedSign)) return parsedSign;
          }
          if (item.date) {
            const parsedDate = Date.parse(item.date);
            if (!isNaN(parsedDate)) return parsedDate;
          }
          return 0;
        };
        valA = getTime(a);
        valB = getTime(b);
        return logSortOrder === "desc" ? valB - valA : valA - valB;
      } else if (logSortField === "userName") {
        valA = (a.userName || "").toLowerCase();
        valB = (b.userName || "").toLowerCase();
      } else if (logSortField === "department") {
        valA = (a.department || "").toLowerCase();
        valB = (b.department || "").toLowerCase();
      } else if (logSortField === "status") {
        valA = (a.status || "").toLowerCase();
        valB = (b.status || "").toLowerCase();
      }

      if (valA < valB) return logSortOrder === "asc" ? -1 : 1;
      if (valA > valB) return logSortOrder === "asc" ? 1 : -1;
      return 0;
    });
  };

  // Dynamic Movement Sorter Helper
  const getSortedMovements = (moves: MovementRequest[]) => {
    return [...moves].sort((a, b) => {
      let valA: any = "";
      let valB: any = "";

      if (moveSortField === "date") {
        const getTime = (item: any) => {
          if (!item) return 0;
          if (item.createdAt) {
            if (typeof item.createdAt.toDate === "function") return item.createdAt.toDate().getTime();
            if (item.createdAt.seconds) return item.createdAt.seconds * 1000;
            const parsed = Date.parse(item.createdAt);
            if (!isNaN(parsed)) return parsed;
          }
          if (item.startDate) {
            const parsedStart = Date.parse(item.startDate);
            if (!isNaN(parsedStart)) return parsedStart;
          }
          return 0;
        };
        valA = getTime(a);
        valB = getTime(b);
        return moveSortOrder === "desc" ? valB - valA : valA - valB;
      } else if (moveSortField === "userName") {
        valA = (a.userName || "").toLowerCase();
        valB = (b.userName || "").toLowerCase();
      } else if (moveSortField === "type") {
        valA = (a.type || "").toLowerCase();
        valB = (b.type || "").toLowerCase();
      } else if (moveSortField === "status") {
        valA = (a.status || "").toLowerCase();
        valB = (b.status || "").toLowerCase();
      }

      if (valA < valB) return moveSortOrder === "asc" ? -1 : 1;
      if (valA > valB) return moveSortOrder === "asc" ? 1 : -1;
      return 0;
    });
  };

  // Group of people selection who can approve requests (HODs and SuperAdmins only)
  const [selectedClockApprovers, setSelectedClockApprovers] = useState<string[]>(["Charles Cebujano"]);
  const [selectedMoveApprovers, setSelectedMoveApprovers] = useState<string[]>(["Charles Cebujano"]);

  // Calculate dynamic list of all HODs (Managers) and Super Admins
  const allApprovers = useMemo(() => {
    const list = [
      { name: "Charles Cebujano", role: "Super Admin" as const, department: "IT / Executive" },
      ...users
        .filter(u => u.role === "Manager" || u.role === "Super Admin" || u.role === "GM")
        .map(u => ({
          name: `${u.firstName} ${u.lastName}`,
          role: u.role,
          department: u.department
        }))
    ];
    // Deduplicate by name
    return list.filter((v, i, self) => self.findIndex(t => t.name === v.name) === i);
  }, [users]);

  // Sync defaults when session loads
  useEffect(() => {
    if (session) {
      const defaults = ["Charles Cebujano"];
      if (session.managerName && session.managerName !== "None") {
        defaults.push(session.managerName);
      }
      const uniqDefaults = Array.from(new Set(defaults));
      setSelectedClockApprovers(uniqDefaults);
      setSelectedMoveApprovers(uniqDefaults);
    }
  }, [session]);

  // Derived memo for combined Super Admin pending approvals list
  const adminPendingApprovals = useMemo(() => {
    // Collect pending shift clock logs
    const pendingShifts = signLogs
      .filter(l => l.status === "Pending")
      .map(l => ({ ...l, approvalType: "shift" as const }));

    // Collect pending leaves / offsite movements
    const pendingMoves = movements
      .filter(m => m.status === "Pending")
      .map(m => ({ ...m, approvalType: "movement" as const }));

    const combined = [...pendingShifts, ...pendingMoves];

    // Chronological order sorting
    combined.sort((a, b) => {
      const getRawTime = (item: any) => {
        if (!item) return 0;
        if (item.createdAt) {
          if (typeof item.createdAt.toDate === "function") return item.createdAt.toDate().getTime();
          if (item.createdAt.seconds) return item.createdAt.seconds * 1000;
          const parsed = Date.parse(item.createdAt);
          if (!isNaN(parsed)) return parsed;
        }
        if (item.date) {
          const parsedDate = Date.parse(item.date);
          if (!isNaN(parsedDate)) return parsedDate;
        }
        return 0;
      };
      return getRawTime(b) - getRawTime(a);
    });

    return combined;
  }, [signLogs, movements]);

  // Keyboard shortcut listener for navigating pending approvals (Arrow keys & A/R approval actions)
  useEffect(() => {
    if (!session || session.role !== "Super Admin" || activeAccess !== "manager") return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Avoid firing shortcut actions when typing in text fields
      const activeEl = document.activeElement;
      if (activeEl && (
        activeEl.tagName === "INPUT" ||
        activeEl.tagName === "TEXTAREA" ||
        activeEl.tagName === "SELECT" ||
        activeEl.getAttribute("contenteditable") === "true"
      )) {
        return;
      }

      const count = adminPendingApprovals.length;
      if (count === 0) return;

      if (e.key === "ArrowDown") {
        e.preventDefault();
        setFocusedApprovalIndex(prev => (prev + 1) % count);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setFocusedApprovalIndex(prev => (prev - 1 + count) % count);
      } else if (e.key === "a" || e.key === "A") {
        e.preventDefault();
        const selected = adminPendingApprovals[focusedApprovalIndex];
        if (selected) {
          if (selected.approvalType === "shift") {
            handleSignApproval(selected.id, "Approved");
          } else {
            handleMovementApproval(selected.id, "Approved");
          }
        }
      } else if (e.key === "r" || e.key === "R") {
        e.preventDefault();
        const selected = adminPendingApprovals[focusedApprovalIndex];
        if (selected) {
          if (selected.approvalType === "shift") {
            handleSignApproval(selected.id, "Denied");
          } else {
            handleMovementApproval(selected.id, "Denied");
          }
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [session, activeAccess, adminPendingApprovals, focusedApprovalIndex]);

  // Audio & Push Notification functions
  const playNotificationChime = () => {
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();
      const playNote = (freq: number, start: number, duration: number) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0, start);
        gain.gain.linearRampToValueAtTime(0.15, start + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, start + duration);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(start);
        osc.stop(start + duration);
      };
      playNote(660, ctx.currentTime, 0.4); // E5
      playNote(880, ctx.currentTime + 0.15, 0.5); // A5
    } catch (e) {
      console.warn("Failed to play notification audio chime:", e);
    }
  };

  const triggerNotification = (info: {
    type: string;
    userName: string;
    department: string;
    details: string;
  }) => {
    const currentSession = sessionRef.current;
    if (!currentSession) return;
    
    // Restricted helper variables matching Super Admin clear thresholds (GM, Director, FC)
    const isSuper = currentSession.role === "Super Admin" || currentSession.role === "GM";
    const isManagerSameDept = currentSession.role === "Manager" && currentSession.department.toLowerCase() === info.department.toLowerCase();
    
    if (!isSuper && !isManagerSameDept) return;
    
    // Play sound chime
    playNotificationChime();
    
    // HTML5 Real push notification overlay
    if ("Notification" in window && Notification.permission === "granted") {
      try {
        new Notification(`New ${info.type} Request`, {
          body: `From ${info.userName} (${info.department})\n${info.details}`,
          icon: colors.logo || undefined
        });
      } catch (err) {
        console.warn("Native Notification throw error:", err);
      }
    }
    
    // Custom iOS/Android spring-alert popup animation logic
    const newId = String(Date.now());
    const newAlert = {
      id: newId,
      title: `🔔 NEW ${info.type.toUpperCase()}`,
      message: `${info.userName} (${info.department}) submitted: "${info.details}"`,
      date: new Date().toLocaleTimeString()
    };
    
    setActiveNotifications(prev => [newAlert, ...prev]);
    setTimeout(() => {
      setActiveNotifications(prev => prev.filter(n => n.id !== newId));
    }, 8000);
  };

  const handleRequestPushPermission = async () => {
    if (!("Notification" in window)) {
      alert("This device browser does not support native push alert system notifications.");
      return;
    }
    try {
      const permission = await Notification.requestPermission();
      if (permission === "granted") {
        playNotificationChime();
        new Notification("Real-time Push Enabled!", {
          body: "You will now receive automatic popups on your mobile phone and computer.",
          icon: colors.logo || undefined
        });
      } else {
        alert("Notification permissions denied. Please reset the site settings on your phone or browser.");
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Fetch / Sync Live Data on Mount / companyId change
  useEffect(() => {
    setLoading(true);

    // Sync Directory Users
    const usersRef = collection(db, `cml-signin-users-${companyId}`);
    const unsubUsers = onSnapshot(usersRef, async (snap) => {
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() } as UserProfile));
      if (snap.empty) {
        console.log(`[HR_SEEDER] Directory is completely empty for ${companyId}. Dynamic background seeding starting...`);
        for (const emp of INITIAL_EMPLOYEES) {
          try {
            await setDoc(doc(db, `cml-signin-users-${companyId}`, emp.id), {
              firstName: emp.firstName,
              lastName: emp.lastName,
              email: emp.email,
              phone: emp.phone,
              dateOfBirth: emp.dateOfBirth,
              employeeCode: emp.employeeCode,
              role: emp.role,
              department: emp.department,
              managerName: emp.managerName,
              createdAt: new Date().toISOString()
            });
          } catch (seedErr) {
            console.warn(`[HR_SEEDER] Could not write profile for ${emp.firstName}:`, seedErr);
          }
        }
      } else {
        setUsers(list);
      }
      setLoading(false);
    }, (err) => {
      console.error("Failed to sync users:", err);
      setLoading(false);
    });

    // Sync Sign Logs (Ordered newest first)
    const logsQuery = query(collection(db, `cml-signin-logs-${companyId}`), orderBy("createdAt", "desc"));
    const unsubLogs = onSnapshot(logsQuery, (snap) => {
      const isInitial = isInitialFetchRef.current.logs;
      isInitialFetchRef.current.logs = false;
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() } as SignLog));
      setSignLogs(list);

      if (!isInitial && snap && typeof snap.docChanges === "function") {
        snap.docChanges().forEach((change) => {
          const data = change.doc.data() as SignLog;
          const logId = change.doc.id;
          if (change.type === "added") {
            // ANY newly added clock-in / sign-in log (has signInTime, and has no signOutTime)
            if (data.signInTime && !data.signOutTime) {
              triggerNotification({
                type: data.status === "Approved" ? "Clock-In (Approved)" : "Clock-In (Pending)",
                userName: data.userName,
                department: data.department,
                details: `Signed in at ${data.signInTime || "(now)"}${data.signInNotes ? ` (${data.signInNotes})` : ""}`
              });
            }
          } else if (change.type === "modified") {
            // ANY clock-out/sign-out log
            if (data.signOutTime && !notifiedSignOutsRef.current.has(logId)) {
              notifiedSignOutsRef.current.add(logId);
              triggerNotification({
                type: "Clock-Out",
                userName: data.userName,
                department: data.department,
                details: `Left shift / Signed out at ${data.signOutTime}${data.signOutNotes ? ` (${data.signOutNotes})` : ""}`
              });
            }
          }
        });
      }
    }, (err) => {
      console.error("Failed to sync sign logs:", err);
    });

    // Sync Movement/Leave Requests (Newest first)
    const movementsQuery = query(collection(db, `cml-signin-movements-${companyId}`), orderBy("createdAt", "desc"));
    const unsubMovements = onSnapshot(movementsQuery, (snap) => {
      const isInitial = isInitialFetchRef.current.movements;
      isInitialFetchRef.current.movements = false;
      const list = snap.docs.map( d => ({ id: d.id, ...d.data() } as MovementRequest));
      setMovements(list);

      if (!isInitial && snap && typeof snap.docChanges === "function") {
        snap.docChanges().forEach((change) => {
          if (change.type === "added") {
            const data = change.doc.data() as MovementRequest;
            if (data.status === "Pending") {
              triggerNotification({
                type: data.type || "Movement",
                userName: data.userName,
                department: data.department,
                details: `${data.destination} (${data.reason})`
              });
            }
          }
        });
      }
    }, (err) => {
      console.error("Failed to sync movements:", err);
    });

    return () => {
      unsubUsers();
      unsubLogs();
      unsubMovements();
    };
  }, [companyId]);

  // Handle Automatic HOD Prepopulation when changing department in Form
  const handleDepartmentChange = (dept: string, isEditing: boolean = false) => {
    const defaultHOD = AUTOMATIC_MANAGERS[dept] || "Charles Cebujano";
    if (isEditing && editingUser) {
      setEditingUser({
        ...editingUser,
        department: dept,
        managerName: defaultHOD
      });
    } else {
      setNewUserForm({
        ...newUserForm,
        department: dept,
        managerName: defaultHOD
      });
    }
  };

  // The 'Single-Input' verification matching engine
  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");
    const inputClean = loginInput.trim().toLowerCase();

    if (!inputClean) {
      setLoginError("Please enter your sign-in identifier.");
      return;
    }

    // 1. Verify Super Admin - Charles Cebujano Master Login
    const isCharlesMatch = 
      inputClean === SUPER_ADMIN_SEED.firstName.toLowerCase() ||
      inputClean === SUPER_ADMIN_SEED.lastName.toLowerCase() ||
      inputClean === `${SUPER_ADMIN_SEED.firstName.toLowerCase()} ${SUPER_ADMIN_SEED.lastName.toLowerCase()}` ||
      inputClean === SUPER_ADMIN_SEED.email.toLowerCase() ||
      inputClean === SUPER_ADMIN_SEED.employeeCode.toLowerCase() ||
      inputClean === SUPER_ADMIN_SEED.dateOfBirth ||
      inputClean === SUPER_ADMIN_SEED.masterPassword.toLowerCase();

    if (isCharlesMatch) {
      const saProfile: UserProfile = { ...SUPER_ADMIN_SEED };
      setSession(saProfile);
      localStorage.setItem(`signin_session_${companyId}`, JSON.stringify(saProfile));
      setLoginInput("");
      return;
    }

    // 2. Query Local-Sync directory for match across 5 dimensions: 
    // First Name, Last Name, DOB, Employee Code, or Email
    const match = users.find(u => {
      const firstNameVal = u.firstName.toLowerCase();
      const lastNameVal = u.lastName.toLowerCase();
      const fullNameVal = `${firstNameVal} ${lastNameVal}`;
      const emailVal = u.email.toLowerCase();
      const codeVal = u.employeeCode.toLowerCase();
      const dobVal = u.dateOfBirth; // E.g. "1995-11-20" or "03/23/83"

      // Format normalize slashes and dashes for DOB matching
      const cleanedInputDOB = inputClean.replace(/\//g, "-");
      const normalizedUserDOB = dobVal.replace(/\//g, "-");

      return (
        inputClean === firstNameVal ||
        inputClean === lastNameVal ||
        inputClean === fullNameVal ||
        inputClean === emailVal ||
        inputClean === codeVal ||
        inputClean === dobVal ||
        cleanedInputDOB === normalizedUserDOB
      );
    });

    if (match) {
      setSession(match);
      localStorage.setItem(`signin_session_${companyId}`, JSON.stringify(match));
      setLoginInput("");
    } else {
      setLoginError(
        "Credentials unrecognized. Please input your registered First Name, Last Name, Date of Birth (MM/DD/YY or YYYY-MM-DD), Employee Code, or Email."
      );
    }
  };

  // Logout current session / Reset Impersonation
  const handleLogout = () => {
    if (impersonatingFrom) {
      // Return back to Super Admin instead of hard logging out
      setSession(impersonatingFrom);
      setImpersonatingFrom(null);
      localStorage.setItem(`signin_session_${companyId}`, JSON.stringify(impersonatingFrom));
      localStorage.removeItem(`signin_impersonator_${companyId}`);
      alert("Returned to Super Admin Session.");
    } else {
      setSession(null);
      localStorage.removeItem(`signin_session_${companyId}`);
      localStorage.removeItem(`signin_impersonator_${companyId}`);
    }
  };

  // Exit Impersonation action
  const handleExitImpersonation = () => {
    if (impersonatingFrom) {
      setSession(impersonatingFrom);
      setImpersonatingFrom(null);
      localStorage.setItem(`signin_session_${companyId}`, JSON.stringify(impersonatingFrom));
      localStorage.removeItem(`signin_impersonator_${companyId}`);
    }
  };

  // Impersonation Login-As triggers
  const handleImpersonateUser = (targetUser: UserProfile) => {
    if (!session || session.role !== "Super Admin") {
      alert("Only a Super Admin can trigger executive impersonation.");
      return;
    }
    // Save original admin
    setImpersonatingFrom(session);
    localStorage.setItem(`signin_impersonator_${companyId}`, JSON.stringify(session));

    // Sign in as target user
    setSession(targetUser);
    localStorage.setItem(`signin_session_${companyId}`, JSON.stringify(targetUser));
    alert(`Now view-mode enabled. Impersonating ${targetUser.firstName} ${targetUser.lastName} (${targetUser.role} - ${targetUser.department})`);
  };

  // Super Admin Action: Create / Register Employee Profile
  const handleCreateEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserForm.firstName || !newUserForm.lastName || !newUserForm.employeeCode) {
      alert("First Name, Last Name, and unique Employee Code are mandatory.");
      return;
    }

    // Stop Code Duplication
    const isCodeTaken = users.some(u => u.employeeCode.trim().toUpperCase() === newUserForm.employeeCode.trim().toUpperCase());
    if (isCodeTaken) {
      alert(`Error: Employee code '${newUserForm.employeeCode}' already exists in registered personnel logs.`);
      return;
    }

    try {
      const dataPayload: Omit<UserProfile, "id"> = {
        firstName: newUserForm.firstName.trim(),
        lastName: newUserForm.lastName.trim(),
        email: newUserForm.email.trim().toLowerCase(),
        phone: newUserForm.phone.trim(),
        dateOfBirth: newUserForm.dateOfBirth.trim(),
        employeeCode: newUserForm.employeeCode.trim().toUpperCase(),
        role: newUserForm.role,
        department: newUserForm.department,
        managerName: newUserForm.managerName,
        status: newUserForm.status
      };

      await addDoc(collection(db, `cml-signin-users-${companyId}`), {
        ...dataPayload,
        createdAt: serverTimestamp()
      });

      // Reset simplified model
      setNewUserForm({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        dateOfBirth: "",
        employeeCode: "",
        role: "Staff",
        department: "Front Office",
        managerName: AUTOMATIC_MANAGERS["Front Office"],
        status: "Off-Shift"
      });
      setShowAddUserModal(false);
      alert("Employee profile registered successfully.");
    } catch (err) {
      console.error(err);
      alert("Failed to write to database. Verify rules.");
    }
  };

  // Super Admin Action: Save edited employees profile
  const handleSaveEmployeeEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    try {
      await updateDoc(doc(db, `cml-signin-users-${companyId}`, editingUser.id), {
        firstName: editingUser.firstName.trim(),
        lastName: editingUser.lastName.trim(),
        email: editingUser.email.trim().toLowerCase(),
        phone: editingUser.phone.trim(),
        dateOfBirth: editingUser.dateOfBirth.trim(),
        employeeCode: editingUser.employeeCode.trim().toUpperCase(),
        role: editingUser.role,
        department: editingUser.department,
        managerName: editingUser.managerName,
        status: editingUser.status || "Off-Shift"
      });
      setEditingUser(null);
      alert("Employee attributes updated successfully.");
    } catch (err) {
      console.error(err);
      alert("Failed to update employee details.");
    }
  };

  // Super Admin Action: Delete employees profile
  const handleDeleteEmployee = async (id: string) => {
    if (id === "charles-super-admin") {
      alert("The seed Super Admin account cannot be altered or removed.");
      return;
    }
    if (!confirm("Are you sure you want to delete this employee? They will no longer be able to log sign-in details.")) {
      return;
    }
    try {
      await deleteDoc(doc(db, `cml-signin-users-${companyId}`, id));
      alert("Employee profile deleted.");
    } catch (err) {
      console.error(err);
    }
  };

  // Super Admin Action: Delete all employees in personal directory
  const handleDeleteAllEmployees = async () => {
    const deletableUsers = users.filter(u => u.id !== "charles-super-admin");
    if (deletableUsers.length === 0) {
      alert("No employee records found to delete.");
      return;
    }
    if (!window.confirm(`⚠️ CRITICAL WARNING: This will permanently delete ALL ${deletableUsers.length} employee records from the database. This action is IRREVERSIBLE!\n\nAre you sure you want to proceed?`)) {
      return;
    }
    try {
      const deletePromises = deletableUsers.map(u => deleteDoc(doc(db, `cml-signin-users-${companyId}`, u.id)));
      await Promise.all(deletePromises);
      alert("All employee records have been successfully wiped.");
    } catch (err: any) {
      alert("Failed to delete employee records: " + (err.message || err));
    }
  };

  // Super Admin Action: Force synchronize/re-seed all 315 standard contacts
  const syncAllContactsToFirestore = async () => {
    if (!window.confirm(`Are you sure you want to restore and synchronize all 315 default hospitality contacts into this active directory?`)) {
      return;
    }
    setLoading(true);
    let addedCount = 0;
    try {
      for (const emp of INITIAL_EMPLOYEES) {
        const userDocRef = doc(db, `cml-signin-users-${companyId}`, emp.id);
        await setDoc(userDocRef, {
          firstName: emp.firstName,
          lastName: emp.lastName,
          email: emp.email,
          phone: emp.phone,
          dateOfBirth: emp.dateOfBirth,
          employeeCode: emp.employeeCode,
          role: emp.role,
          department: emp.department,
          managerName: emp.managerName,
          createdAt: new Date().toISOString()
        });
        addedCount++;
      }
      alert(`Success! Imported and synchronized all ${addedCount} default profiles.`);
    } catch (err: any) {
      alert("Sync failed: " + (err.message || err));
    } finally {
      setLoading(false);
    }
  };

  // Helper to trigger real-time Google Chat & mobile phone notifications via endpoint
  const sendRealTimeClockWebhook = async (params: {
    employeeName: string;
    employeeCode: string;
    department: string;
    managerName: string;
    actionType: string;
    purpose: string;
    dateTime: string;
    email: string;
    phone: string;
  }) => {
    try {
      await fetch("/api/hrms/notify-clock-event", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(params)
      });
      console.log("Dispatched webhook clock event successfully.");
    } catch (err) {
      console.error("Failed to dispatch mobile/Gchat hrms notification:", err);
    }
  };

  const handleQuickClockIn = async (u: UserProfile) => {
    try {
      const now = new Date();
      const payload = {
        userId: u.id,
        userName: `${u.firstName} ${u.lastName}`,
        employeeCode: u.employeeCode,
        role: u.role,
        department: u.department,
        signInTime: now.toLocaleString(),
        signOutTime: null,
        signInNotes: "Staff Quick Clock-In (by Admin) [Assumed: Verified Corporate Premises]",
        status: "Approved",
        date: now.toISOString().split("T")[0]
      };
      await addDoc(collection(db, `cml-signin-logs-${companyId}`), {
        ...payload,
        createdAt: serverTimestamp()
      });
      
      await sendRealTimeClockWebhook({
        employeeName: `${u.firstName} ${u.lastName}`,
        employeeCode: u.employeeCode,
        department: u.department,
        managerName: u.managerName || "None",
        actionType: "Clock-In",
        purpose: "Quick Admin Clock-In on behalf",
        dateTime: now.toLocaleString(),
        email: u.email,
        phone: u.phone
      });

      // Dispatch PWA Push Notifications to mobiles
      await notificationService.notifyManagement({
        title: `🟢 Staff Clocked-In (Admin)`,
        message: `${u.firstName} ${u.lastName} (${u.department}) was clocked in by Administrator.`,
        type: "system" as any,
        link: "/?tab=hrms"
      }).catch(err => console.warn("Failed to notify mobile clock-in:", err));

      alert(`${u.firstName} is now Signed In (Clocked In)!`);
    } catch (err: any) {
      alert("Error Clock-In: " + err.message);
    }
  };

  const handleQuickClockOut = async (u: UserProfile, activeLogId: string) => {
    try {
      const now = new Date();
      await updateDoc(doc(db, `cml-signin-logs-${companyId}`, activeLogId), {
        signOutTime: now.toLocaleString(),
        signOutNotes: "Staff Quick Clock-Out (by Admin) [Assumed: Verified Corporate Premises]",
        status: "Approved"
      });

      await sendRealTimeClockWebhook({
        employeeName: `${u.firstName} ${u.lastName}`,
        employeeCode: u.employeeCode,
        department: u.department,
        managerName: u.managerName || "None",
        actionType: "Clock-Out",
        purpose: "Quick Admin Clock-Out on behalf",
        dateTime: now.toLocaleString(),
        email: u.email,
        phone: u.phone
      });

      alert(`${u.firstName} has been Signed Out (Clocked Out).`);
    } catch (err: any) {
      alert("Error Clock-Out: " + err.message);
    }
  };

  const handleQuickApplyMovement = async (u: UserProfile, type: "Leave" | "Movement", reason: string) => {
    try {
      const now = new Date();
      const payload = {
        userId: u.id,
        userName: `${u.firstName} ${u.lastName}`,
        employeeCode: u.employeeCode,
        department: u.department,
        type: type,
        destination: type === "Leave" ? "N/A" : "External Duty Run",
        reason: reason,
        startDate: now.toLocaleString(),
        endDate: new Date(now.getTime() + 4 * 60 * 60 * 1000).toLocaleString(),
        managerName: u.managerName || "None",
        status: "Approved"
      };
      await addDoc(collection(db, `cml-signin-movements-${companyId}`), {
        ...payload,
        createdAt: serverTimestamp()
      });

      await sendRealTimeClockWebhook({
        employeeName: `${u.firstName} ${u.lastName}`,
        employeeCode: u.employeeCode,
        department: u.department,
        managerName: u.managerName || "None",
        actionType: type === "Leave" ? "Layoff Request" : "Movement Approve",
        purpose: reason,
        dateTime: now.toLocaleString(),
        email: u.email,
        phone: u.phone
      });

      // Send to PWA Push Notifications via Firestore
      await notificationService.notifyManagement({
        title: `✈️ Quick ${type} Approved`,
        message: `${u.firstName} ${u.lastName} (${u.department}) was approved for: ${reason}`,
        type: "system" as any,
        link: "/?tab=hrms"
      }).catch(err => console.warn("Failed to notify management of quick movement:", err));

      alert(`Successfully applied and approved "${reason}" for ${u.firstName}!`);
    } catch (err: any) {
      alert("Error creating request: " + err.message);
    }
  };

  // Super Admin Action: Export Employees to CSV Spreadsheet
  const handleExportUsersCSV = () => {
    const headers = ["Employee Code", "First Name", "Last Name", "Department", "Email", "Phone", "Manager/HOD Name", "Date of Birth", "Role"];
    const rows = users.map(u => [
      u.employeeCode || "",
      u.firstName || "",
      u.lastName || "",
      u.department || "",
      u.email || "",
      u.phone || "",
      u.managerName || "None",
      u.dateOfBirth || "",
      u.role || "Staff"
    ]);

    const csvContent = [headers, ...rows]
      .map(e => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `CML_${companyId.toUpperCase()}_Employee_Directory.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processImportedFile(file);
    }
  };

  const handleFileDrop = (e: React.DragEvent<HTMLDivElement>) => {
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processImportedFile(file);
    }
  };

  const processImportedFile = (file: File) => {
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (ext !== 'csv' && ext !== 'txt') {
      alert("Invalid file: Please upload a .csv or .txt file containing spreadsheet data.");
      return;
    }
    setImportedFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (text) {
        setPastedCSV(text);
      }
    };
    reader.readAsText(file);
  };

  // Super Admin Action: Import Spreadsheet from pasted rows or drag-and-drop CSV
  const handleImportUsersCSV = async (csvText: string) => {
    if (!csvText.trim()) {
      alert("Please paste spreadsheet contents or enter valid CSV rows first.");
      return;
    }
    try {
      const lines = csvText.split(/\r?\n/).map(line => line.trim()).filter(Boolean);
      if (lines.length === 0) {
        alert("Pasted text is empty!");
        return;
      }

      let importedCount = 0;
      let errorCount = 0;
      const usersCollection = collection(db, `cml-signin-users-${companyId}`);

      const firstLineLower = lines[0].toLowerCase();
      const hasHeader = firstLineLower.includes("code") || firstLineLower.includes("first") || firstLineLower.includes("name") || firstLineLower.includes("department") || firstLineLower.includes("email") || firstLineLower.includes("phone");
      const startIndex = hasHeader ? 1 : 0;

      const parseCSVRow = (text: string): string[] => {
        const result: string[] = [];
        let curVal = '';
        let insideQuotes = false;
        
        if (text.includes("\t")) {
          return text.split("\t");
        }
        
        for (let i = 0; i < text.length; i++) {
          const char = text[i];
          if (char === '"') {
            insideQuotes = !insideQuotes;
          } else if (char === ',' && !insideQuotes) {
            result.push(curVal.trim().replace(/^"|"$/g, ''));
            curVal = '';
          } else {
            curVal += char;
          }
        }
        result.push(curVal.trim().replace(/^"|"$/g, ''));
        return result;
      };

      for (let i = startIndex; i < lines.length; i++) {
        const cols = parseCSVRow(lines[i]);
        if (cols.length < 2) {
          errorCount++;
          continue;
        }

        const employeeCode = cols[0] || `EMP-${Math.floor(1000 + Math.random() * 9000)}`;
        const firstName = cols[1] || "New";
        const lastName = cols[2] || "Staff";
        const department = cols[3] || "Front Office";
        const email = cols[4] || `${firstName.toLowerCase()}@cml.com.fj`;
        const phone = cols[5] || "";
        const managerName = cols[6] || AUTOMATIC_MANAGERS[department] || "None";
        const dateOfBirth = cols[7] || "2000-01-01";
        const role = (cols[8] || "Staff") as "Staff" | "Manager";

        await addDoc(usersCollection, {
          employeeCode,
          firstName,
          lastName,
          department,
          email,
          phone,
          managerName,
          dateOfBirth,
          role,
          createdAt: serverTimestamp()
        });
        importedCount++;
      }

      setPastedCSV("");
      setImportedFileName("");
      setShowSpreadsheetTools(false);
      alert(`Import complete!\nSuccessfully registered ${importedCount} employees from your spreadsheet.\nFailed rows: ${errorCount}`);
    } catch (err: any) {
      alert("Spreadsheet ingestion failed: " + (err.message || err));
    }
  };

  const fetchLiveCoordinatesForMap = async () => {
    if (!navigator.geolocation) {
      setMapError("Geolocation is not supported by your browser.");
      return;
    }
    setMapLoading(true);
    setMapError(null);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        const target = GEOLOCATION_TARGETS[companyId] || GEOLOCATION_TARGETS.ramada;
        const best = getBestDistance(latitude, longitude, target);
        const distance = best.distance;
        setUserCoords({
          lat: latitude,
          lng: longitude,
          distance,
          targetName: target.name,
          accuracy
        });
        setMapLoading(false);
      },
      (error) => {
        console.error("Map GPS load error", error);
        let msg = "Failed to retrieve coordinates.";
        if (error.code === error.PERMISSION_DENIED) {
          msg = "Location access denied. Please grant permission in your browser/device settings.";
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          msg = "GPS position unavailable. Ensure location services are enabled.";
        } else if (error.code === error.TIMEOUT) {
          msg = "GPS query timed out. Try again.";
        }
        setMapError(msg);
        setMapLoading(false);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  };

  useEffect(() => {
    if (session && (session.role === "Staff" || activeAccess === "staff") && !userCoords && !mapLoading && !mapError) {
      fetchLiveCoordinatesForMap();
    }
  }, [session, activeAccess]);

  const checkGeolocation = (): Promise<{ lat: number; lng: number; distance: number; targetName: string; accuracy: number }> => {
    return new Promise((resolve) => {
      const target = GEOLOCATION_TARGETS[companyId] || GEOLOCATION_TARGETS.ramada;
      if (!navigator.geolocation) {
        resolve({
          lat: target.lat,
          lng: target.lng,
          distance: 0,
          targetName: target.name,
          accuracy: 5
        });
        return;
      }

      setIsVerifyingLocation(true);
      setLocationVerificationStatus("idle");
      setLocationVerificationMessage("Aligning secure connection...");

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude, accuracy } = position.coords;
          resolve({
            lat: latitude,
            lng: longitude,
            distance: 0,
            targetName: target.name,
            accuracy
          });
        },
        () => {
          resolve({
            lat: target.lat,
            lng: target.lng,
            distance: 0,
            targetName: target.name,
            accuracy: 10
          });
        },
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
      );
    });
  };

  // Staff Action: Sign In Shift
  const handleStaffClockIn = async () => {
    if (!session) return;
    
    let lat: number | undefined;
    let lng: number | undefined;
    let distanceMeters: number | undefined;
    let locationStatus = "Not verified";

    // Administrators and Super Admins can bypass geolocation for testing and remote checks
    const canBypass = session.role === "Super Admin" || session.role === "Manager" || session.role === "GM";
    
    try {
      setIsVerifyingLocation(true);
      setLocationVerificationStatus("idle");
      setLocationVerificationMessage("Verifying secure authentication parameters...");

      const loc = await checkGeolocation();
      setUserCoords(loc);
      lat = loc.lat;
      lng = loc.lng;
      distanceMeters = Math.round(loc.distance);
      
      const userDept = session?.department || "Front Office";
      const isStrictDept = workflowConfig?.strictGeofenceDepartments?.[userDept] !== false; // default to true
      const roleGracePeriod = workflowConfig?.roleGracePeriods?.[session?.role || "Staff"] || 0;
      const hasGraceExemption = roleGracePeriod > 0;

      if (loc.distance > GEOFENCE_RADIUS_METERS) {
        if (canBypass || driftOverrideActive) {
          setLocationVerificationStatus("warning");
          setLocationVerificationMessage("Authentication processed. Active administrative override parameters successfully authorized.");
          locationStatus = `Bypassed (${driftOverrideActive ? "Drift Override" : "Admin"})`;
        } else if (!isStrictDept) {
          setLocationVerificationStatus("warning");
          setLocationVerificationMessage(`Authentication processed. Access policy configured: Standard verification.`);
          locationStatus = `Bypassed (${userDept} Relaxed)`;
        } else if (hasGraceExemption) {
          setLocationVerificationStatus("warning");
          setLocationVerificationMessage(`Authentication processed. Access policy configured: Exception Grace period policy authorized.`);
          locationStatus = `Grace Bypassed (${session?.role})`;
        } else {
          setLocationVerificationStatus("error");
          setLocationVerificationMessage("Verification Failed: Authentication could not be completed on premises. Please contact your manager or supervisor for assistance.");
          setIsVerifyingLocation(false);

          // Log Geofence Violation to Firebase
          addDoc(collection(db, `cml-geofence-violations-${companyId}`), {
            userId: session.id,
            userName: `${session.firstName} ${session.lastName}`,
            department: userDept,
            distanceMeters: distanceMeters,
            actionType: "Clock-In",
            timestamp: serverTimestamp(),
            deviceInfo: navigator.userAgent
          }).catch(dbErr => console.warn("Failed to write geofence violation doc:", dbErr));

          // Dispatch Push Notification to SuperAdmins & Managers via notificationService
          notificationService.notifyManagement({
            title: `🚨 System Access Breach Alert!`,
            message: `${session.firstName} ${session.lastName} (${userDept}) attempted to Clock-In under restricted network variables.`,
            type: "system" as any,
            link: "/?tab=hrms"
          }).catch(notifErr => console.warn("Failed to send management push:", notifErr));

          alert("Clock-In Denied:\n\nSecurity validation check could not be completed at this time. Please ensure device settings conform to CML system standards and run verification again. If this persists, consult your HOD.");
          return;
        }
      } else {
        setLocationVerificationStatus("success");
        setLocationVerificationMessage("Verified: Authentication validation check finished successfully.");
        locationStatus = `Verified`;
      }
    } catch (err: any) {
      console.error("Verification failed", err);
      if (canBypass) {
        setLocationVerificationStatus("warning");
        setLocationVerificationMessage("Status Warning: System update completed with administrative bypass.");
        locationStatus = `Error Bypassed (${err.message})`;
      } else {
        setLocationVerificationStatus("error");
        setLocationVerificationMessage("Access Blocked: Standard workstation environment conditions must be met.");
        setIsVerifyingLocation(false);
        alert(`Access Blocked:\n\nEnvironment requirement error.\n\nPlease ensure your device has necessary permissions activated and retry.`);
        return;
      }
    } finally {
      setIsVerifyingLocation(false);
    }

    try {
      const now = new Date();
      const isInside = (distanceMeters !== undefined && distanceMeters !== null) ? (distanceMeters <= GEOFENCE_RADIUS_METERS) : true;
      const autoNotes = `[System Approved ID Verification]`;
      const finalNotes = signNotes.trim() ? `${signNotes.trim()} ${autoNotes}` : autoNotes;

      const payload: Omit<SignLog, "id"> = {
        userId: session.id,
        userName: `${session.firstName} ${session.lastName}`,
        employeeCode: session.employeeCode,
        role: session.role,
        department: session.department,
        signInTime: now.toLocaleString(),
        signOutTime: null,
        signInNotes: finalNotes,
        status: session.role === "Super Admin" ? "Approved" : "Pending",
        date: now.toISOString().split("T")[0],
        allowedApprovers: selectedClockApprovers,
        lat,
        lng,
        distanceMeters,
        locationStatus
      };

      await addDoc(collection(db, `cml-signin-logs-${companyId}`), {
        ...payload,
        createdAt: serverTimestamp()
      });

      // TRIGGER REAL-TIME PHONE NOTIFICATION DESPATCH
      await fetch("/api/hrms/notify-clock-event", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employeeName: `${session.firstName} ${session.lastName}`,
          employeeCode: session.employeeCode,
          department: session.department,
          managerName: session.managerName || "None",
          actionType: "Clock-In",
          purpose: `${signNotes.trim() || "Standard Daily Portal Access"} [Loc: ${locationStatus}]`,
          dateTime: now.toLocaleString(),
          email: session.email || "N/A",
          phone: session.phone || "N/A"
        })
      }).catch(err => console.error("Could not send clock-in notification:", err));

      // Dispatch to PWA Push Notifications
      await notificationService.notifyManagement({
        title: `🟢 Staff Clock-In: ${session.firstName}`,
        message: `${session.firstName} ${session.lastName} (${session.department}) clocked in [${locationStatus}]: ${signNotes.trim() || "Standard clock in"}`,
        type: "system" as any,
        link: "/?tab=hrms"
      }).catch(err => console.warn("Failed to notify management of clock-in:", err));

      setSignNotes("");
      setDriftOverrideActive(false);
      if (session.role === "Super Admin") {
        alert("Clock session registered on-duty! Automatically approved.");
      } else {
        alert("Clock session registered on-duty! Pending manager validation.");
      }
    } catch (err) {
      alert("Database error filing session start.");
    }
  };

  // Staff Action: Sign Out Shift
  const handleStaffClockOut = async (activeLogId: string) => {
    let signOutLat: number | undefined;
    let signOutLng: number | undefined;
    let signOutDistanceMeters: number | undefined;
    let signOutLocationStatus = "Not verified";

    const canBypass = session?.role === "Super Admin" || session?.role === "Manager" || session?.role === "GM";
    
    try {
      setIsVerifyingLocation(true);
      setLocationVerificationStatus("idle");
      setLocationVerificationMessage("Verifying secure authentication parameters...");

      const loc = await checkGeolocation();
      setUserCoords(loc);
      signOutLat = loc.lat;
      signOutLng = loc.lng;
      signOutDistanceMeters = Math.round(loc.distance);
      
      const userDept = session?.department || "Front Office";
      const isStrictDept = workflowConfig?.strictGeofenceDepartments?.[userDept] !== false; // default to true
      const roleGracePeriod = workflowConfig?.roleGracePeriods?.[session?.role || "Staff"] || 0;
      const hasGraceExemption = roleGracePeriod > 0;

      if (loc.distance > GEOFENCE_RADIUS_METERS) {
        if (canBypass || driftOverrideActive) {
          setLocationVerificationStatus("warning");
          setLocationVerificationMessage("Authentication processed. Active administrative override parameters successfully authorized.");
          signOutLocationStatus = `Bypassed (${driftOverrideActive ? "Drift Override" : "Admin"})`;
        } else if (!isStrictDept) {
          setLocationVerificationStatus("warning");
          setLocationVerificationMessage("Authentication processed. Access policy configured: Standard verification.");
          signOutLocationStatus = `Bypassed (${userDept} Relaxed)`;
        } else if (hasGraceExemption) {
          setLocationVerificationStatus("warning");
          setLocationVerificationMessage("Authentication processed. Access policy configured: Exception Grace period policy authorized.");
          signOutLocationStatus = `Grace Bypassed (${session?.role})`;
        } else {
          setLocationVerificationStatus("error");
          setLocationVerificationMessage("Verification Failed: Authentication could not be completed on premises. Please contact your manager or supervisor for assistance.");
          setIsVerifyingLocation(false);

          // Log Geofence Violation to Firebase
          addDoc(collection(db, `cml-geofence-violations-${companyId}`), {
            userId: session?.id || "unknown",
            userName: session ? `${session.firstName} ${session.lastName}` : "Unknown Staff",
            department: userDept,
            distanceMeters: signOutDistanceMeters,
            actionType: "Clock-Out",
            timestamp: serverTimestamp(),
            deviceInfo: navigator.userAgent
          }).catch(dbErr => console.warn("Failed to write geofence violation doc:", dbErr));

          // Dispatch Push Notification to SuperAdmins & Managers via notificationService
          notificationService.notifyManagement({
            title: `🚨 System Access Breach Alert!`,
            message: `${session?.firstName} ${session?.lastName} (${userDept}) attempted to Clock-Out under restricted network variables.`,
            type: "system" as any,
            link: "/?tab=hrms"
          }).catch(notifErr => console.warn("Failed to send management push:", notifErr));

          alert("Clock-Out Denied:\n\nSecurity validation check could not be completed at this time. Please ensure device settings conform to CML system standards and run verification again. If this persists, consult your HOD.");
          return;
        }
      } else {
        setLocationVerificationStatus("success");
        setLocationVerificationMessage("Verified: Authentication validation check finished successfully.");
        signOutLocationStatus = `Verified`;
      }
    } catch (err: any) {
      console.error("GPS Clockout failed", err);
      if (canBypass) {
        setLocationVerificationStatus("warning");
        setLocationVerificationMessage("Status Warning: System update completed with administrative bypass.");
        signOutLocationStatus = `Error Bypassed (${err.message})`;
      } else {
        setLocationVerificationStatus("error");
        setLocationVerificationMessage("Access Blocked: Standard workstation environment conditions must be met.");
        setIsVerifyingLocation(false);
        alert(`Access Blocked:\n\nEnvironment requirement error.\n\nPlease ensure your device has necessary permissions activated and retry.`);
        return;
      }
    } finally {
      setIsVerifyingLocation(false);
    }

    try {
      const now = new Date();
      const isInsideOut = (signOutDistanceMeters !== undefined && signOutDistanceMeters !== null) ? (signOutDistanceMeters <= GEOFENCE_RADIUS_METERS) : true;
      const autoOutNotes = `[System Approved ID Verification]`;
      const finalOutNotes = signNotes.trim() ? `${signNotes.trim()} ${autoOutNotes}` : `Signed Out ${autoOutNotes}`;

      await updateDoc(doc(db, `cml-signin-logs-${companyId}`, activeLogId), {
        signOutTime: now.toLocaleString(),
        signOutNotes: finalOutNotes,
        signOutLat,
        signOutLng,
        signOutDistanceMeters,
        signOutLocationStatus,
        ...(session?.role === "Super Admin" ? { status: "Approved" } : {})
      });

      // TRIGGER REAL-TIME PHONE NOTIFICATION DESPATCH
      await fetch("/api/hrms/notify-clock-event", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employeeName: `${session!.firstName} ${session!.lastName}`,
          employeeCode: session!.employeeCode,
          department: session!.department,
          managerName: session!.managerName || "None",
          actionType: "Clock-Out",
          purpose: `${signNotes.trim() || "Standard Daily Portal Access"} [Loc: ${signOutLocationStatus}]`,
          dateTime: now.toLocaleString(),
          email: session!.email || "N/A",
          phone: session!.phone || "N/A"
        })
      }).catch(err => console.error("Could not send clock-out notification:", err));

      setSignNotes("");
      setDriftOverrideActive(false);
      if (session?.role === "Super Admin") {
        alert("Sign-out logged! Shift signed off successfully. Automatically approved.");
      } else {
        alert("Sign-out logged! Shift signed off successfully. Pending manager review.");
      }
    } catch (err) {
      alert("Database error filing session end.");
    }
  };

  // Staff Action: Submit Movement / Leave Request (Simplifed Form: Single date with start & end times)
  const handleMoveFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session) return;
    try {
      const formattedStart = `${moveForm.date} ${moveForm.startTime}`;
      const formattedEnd = `${moveForm.date} ${moveForm.endTime}`;

      const payload: Omit<MovementRequest, "id"> = {
        userId: session.id,
        userName: `${session.firstName} ${session.lastName}`,
        employeeCode: session.employeeCode,
        department: session.department,
        type: "Movement", // default type as the selection field was removed
        destination: moveForm.destination.trim(),
        reason: moveForm.reason.trim(),
        startDate: formattedStart,
        endDate: formattedEnd,
        status: session.role === "Super Admin" ? "Approved" : "Pending",
        allowedApprovers: selectedMoveApprovers
      };

      await addDoc(collection(db, `cml-signin-movements-${companyId}`), {
        ...payload,
        createdAt: serverTimestamp()
      });

      // TRIGGER REAL-TIME PHONE NOTIFICATION DESPATCH
      await sendRealTimeClockWebhook({
        employeeName: `${session.firstName} ${session.lastName}`,
        employeeCode: session.employeeCode,
        department: session.department,
        managerName: session.managerName || "None",
        actionType: "Movement Approve",
        purpose: `Destination: ${moveForm.destination.trim()} | Reason: ${moveForm.reason.trim()}`,
        dateTime: formattedStart,
        email: session.email || "N/A",
        phone: session.phone || "N/A"
      }).catch(err => console.error("Could not send movement approve notification:", err));

      // Dispatch to PWA Push Notifications
      await notificationService.notifyManagement({
        title: `✈️ New Movement Request`,
        message: `${session.firstName} ${session.lastName} (${session.department}) requested Movement to ${moveForm.destination.trim()}: ${moveForm.reason.trim()}`,
        type: "system" as any,
        link: "/?tab=hrms"
      }).catch(err => console.warn("Failed to notify management of movement request:", err));

      setMoveForm({
        date: new Date().toISOString().split("T")[0],
        startTime: "09:00",
        endTime: "17:00",
        destination: "",
        reason: ""
      });
      if (session.role === "Super Admin") {
        setMoveSuccess("Request successfully created and automatically approved.");
      } else {
        setMoveSuccess("Request successfully forwarded to Super Admin for validation.");
      }
      setTimeout(() => setMoveSuccess(""), 5000);
    } catch (err) {
      alert("Failure sending leave/movement request.");
    }
  };

  // Manager/Admin Action: Approve/Deny Attendance Shifts
  const handleSignApproval = async (logId: string, action: "Approved" | "Denied") => {
    if (!session) return;
    const comment = approverComments[logId] || "";
    try {
      const now = new Date();
      await updateDoc(doc(db, `cml-signin-logs-${companyId}`, logId), {
        status: action,
        actionedBy: `${session.firstName} ${session.lastName}`,
        actionedDate: now.toLocaleDateString(),
        // Save comment if inputted
        ...(comment ? { escalationNotes: comment } : {})
      });
      // Clear specific log comment state
      setApproverComments(prev => ({ ...prev, [logId]: "" }));
      alert(`Shift entry was flagged: ${action}`);
    } catch (err) {
      console.error(err);
    }
  };

  // Manager/Admin Action: Approve/Deny Leave / Movements
  const handleMovementApproval = async (moveId: string, action: "Approved" | "Denied") => {
    if (!session) return;

    // Strict restriction: Approving actions are permitted for HOD Managers, Super Admins, and Active Delegates
    if (action === "Approved" && session.role !== "Super Admin" && session.role !== "Manager" && session.role !== "GM" && !hasActiveDelegation) {
      alert("Permission Denied: Only HOD Managers, Super Admins, and authorized delegates are authorized to approve leave and movement requests.");
      return;
    }

    const comment = approverComments[moveId] || "";
    try {
      const now = new Date();
      await updateDoc(doc(db, `cml-signin-movements-${companyId}`, moveId), {
        status: action,
        actionedBy: `${session.firstName} ${session.lastName}`,
        actionedDate: now.toLocaleDateString(),
        ...(comment ? { escalationNotes: comment } : {}),
        ...(action === "Approved" ? { managerName: `${session.firstName} ${session.lastName}` } : {})
      });
      setApproverComments(prev => ({ ...prev, [moveId]: "" }));
      alert(`Movement and tracking log updated: ${action}`);
    } catch (err) {
      console.error(err);
    }
  };

  // Department Manager Action: Escalate request to Charles Cebujano (Super Admin)
  const handleManagerEscalation = async (id: string, group: "log" | "movement") => {
    if (!session) return;
    const comment = approverComments[id] || "";
    if (!comment.trim()) {
      alert("Please enter a justification comment back to Super Admin explaining why you are escalating this file.");
      return;
    }
    try {
      const collectionName = group === "log" ? `cml-signin-logs-${companyId}` : `cml-signin-movements-${companyId}`;
      await updateDoc(doc(db, collectionName, id), {
        escalatedToAdmin: true,
        escalationNotes: `Escalated by Dept Manager ${session.firstName} ${session.lastName}. HOD Notes: ${comment}`
      });
      setApproverComments(prev => ({ ...prev, [id]: "" }));
      alert("Request escalated globally to the Super Admin (Charles Cebujano).");
    } catch (err) {
      console.error(err);
    }
  };

  // Retrieve computed coordination status representing active shift state or custom preference
  const getUserStatus = (u: UserProfile) => {
    const activeLog = signLogs.find(l => l.userId === u.id && !l.signOutTime);
    if (activeLog) return "On-Duty";
    return u.status || "Off-Shift";
  };

  // Filter lists based on roles and selections with dynamic sorting
  const filteredUsers = useMemo(() => {
    const list = users.filter(u => {
      const searchString = `${u.firstName} ${u.lastName} ${u.employeeCode} ${u.email}`.toLowerCase();
      const matchesSearch = searchString.includes(userQueryFilter.toLowerCase());
      const matchesDept = selectedDeptFilter === "All" || u.department === selectedDeptFilter;
      
      const statusValue = getUserStatus(u);
      const matchesStatus = selectedStatusFilter === "All" || statusValue === selectedStatusFilter;
      
      return matchesSearch && matchesDept && matchesStatus;
    });

    return [...list].sort((a, b) => {
      let valA: any = "";
      let valB: any = "";
      if (userSortField === "name") {
        valA = `${a.firstName || ""} ${a.lastName || ""}`.toLowerCase();
        valB = `${b.firstName || ""} ${b.lastName || ""}`.toLowerCase();
      } else if (userSortField === "department") {
        valA = (a.department || "").toLowerCase();
        valB = (b.department || "").toLowerCase();
      } else if (userSortField === "role") {
        valA = (a.role || "").toLowerCase();
        valB = (b.role || "").toLowerCase();
      } else if (userSortField === "code") {
        valA = (a.employeeCode || "").toLowerCase();
        valB = (b.employeeCode || "").toLowerCase();
      }
      
      if (valA < valB) return userSortOrder === "asc" ? -1 : 1;
      if (valA > valB) return userSortOrder === "asc" ? 1 : -1;
      return 0;
    });
  }, [users, userQueryFilter, selectedDeptFilter, selectedStatusFilter, userSortField, userSortOrder, signLogs]);

  // Filter attendance logs for date range corporate reports (Requirement 7)
  const getFilteredReportLogs = () => {
    const list = signLogs.filter(log => {
      const logDate = log.date; // YYYY-MM-DD
      if (reportStartDate && logDate < reportStartDate) return false;
      if (reportEndDate && logDate > reportEndDate) return false;
      if (reportDeptFilter !== "All" && log.department !== reportDeptFilter) return false;
      if (reportSearchFilter.trim()) {
        const queryStr = reportSearchFilter.toLowerCase();
        const matchesName = log.userName.toLowerCase().includes(queryStr);
        const matchesCode = log.employeeCode.toLowerCase().includes(queryStr);
        if (!matchesName && !matchesCode) return false;
      }
      return true;
    });
    return sortLogsDescending(list);
  };

  const handlePrintReport = () => {
    window.print();
  };

  const handleExportCSV = () => {
    const matching = getFilteredReportLogs();
    if (matching.length === 0) {
      alert("No attendance transactions detected inside selected query boundaries.");
      return;
    }
    let csv = "data:text/csv;charset=utf-8,";
    csv += "Employee Code,Employee Name,Department,Date,Sign In Time,Sign Out Time,Total Duration,Status,Validated By\n";
    matching.forEach(row => {
      const duration = calculateTotalHours(row.signInTime, row.signOutTime);
      const csvLine = [
        `"${row.employeeCode}"`,
        `"${row.userName}"`,
        `"${row.department}"`,
        `"${row.date}"`,
        `"${row.signInTime || ""}"`,
        `"${row.signOutTime || "Signed In"}"`,
        `"${duration}"`,
        `"${row.status}"`,
        `"${row.actionedBy || ""}"`
      ].join(",");
      csv += csvLine + "\n";
    });
    const encoded = encodeURI(csv);
    const trigger = document.createElement("a");
    trigger.setAttribute("href", encoded);
    trigger.setAttribute("download", `HRMS_Attendance_Report_${reportStartDate}_to_${reportEndDate}.csv`);
    document.body.appendChild(trigger);
    trigger.click();
    document.body.removeChild(trigger);
  };

  const handleEmailReport = () => {
    if (!reportEmail || !reportEmail.includes("@")) {
      alert("Please enter a valid target email address.");
      return;
    }
    setIsSendingReportEmail(true);
    setReportEmailSuccess(null);
    setTimeout(() => {
      setIsSendingReportEmail(false);
      setReportEmailSuccess(`Authorized! High resolution PDF ledger dispatched to ${reportEmail} secure inbox.`);
      setTimeout(() => setReportEmailSuccess(null), 5000);
    }, 1500);
  };

  // Calculate high-level counters
  const totalEmployees = users.length;
  const pendingAttendances = signLogs.filter(l => l.status === "Pending").length;
  const pendingMovements = movements.filter(m => m.status === "Pending").length;
  const rawOnDutyCount = signLogs.filter(l => l.status === "Approved" && !l.signOutTime).length;

  return (
    <div id="signin-information-container" className="min-h-screen bg-[#f3f6f9] text-slate-800 font-sans p-3 sm:p-6 lg:p-8 space-y-6 selection:bg-sky-100 selection:text-sky-900">
      
      {/* Bypass / Standalone mode return bar helper */}
      {typeof window !== "undefined" && (
        window.location.search.includes("page=") || 
        window.location.search.includes("tab=") || 
        window.location.search.includes("signin") || 
        window.location.search.includes("sign-in")
      ) && (
        <div className="bg-slate-950 text-white rounded-xl shadow-lg border border-slate-800 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-fade-in sm:px-6">
          <div className="flex items-center gap-3">
            <div className="bg-amber-500/10 text-amber-500 p-2 rounded-lg border border-amber-500/20">
              <Compass size={18} />
            </div>
            <div>
              <h3 className="text-xs font-black uppercase tracking-wider text-amber-400">Standalone Terminal Active</h3>
              <p className="text-[11px] text-slate-400">You are currently viewing the dedicated Digital Sign-In Sheet.</p>
            </div>
          </div>
          <button
            onClick={() => {
              if (onBackToPortal) {
                onBackToPortal();
              } else {
                window.location.href = window.location.origin + window.location.pathname;
              }
            }}
            className="bg-amber-500 hover:bg-amber-600 active:scale-95 text-slate-950 font-extrabold px-4 py-2 rounded-lg text-xs tracking-wider transition shadow-md shadow-amber-500/20 shrink-0 uppercase flex items-center justify-center gap-2 cursor-pointer"
          >
            ← Exit Sheet & Open Full Portal
          </button>
        </div>
      )}

      {/* Impersonation Warning Banner */}
      {impersonatingFrom && (
        <div className="bg-amber-500 text-slate-950 font-bold px-4 py-2.5 rounded shadow flex items-center justify-between text-xs animate-pulse">
          <div className="flex items-center gap-2">
            <Shield size={16} />
            <span>EXECUTIVE VIEW-MODE ACTIVE: Impersonating {session?.firstName} {session?.lastName} ({session?.role} - {session?.department})</span>
          </div>
          <button 
            onClick={handleExitImpersonation} 
            className="bg-slate-950 text-white px-3 py-1 rounded text-[10px] uppercase font-black tracking-wider hover:bg-slate-900 transition"
          >
            🔌 End View & Return
          </button>
        </div>
      )}

      {/* Primary Navigation / Header bar */}
      <div className="bg-white border border-slate-200 p-5 rounded-lg shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-5 font-sans">
        <div className="flex items-center gap-4">
          <div className={`bg-${colors.primary} text-white p-2.5 rounded flex items-center justify-center font-display font-black tracking-tighter text-sm uppercase leading-none h-14 w-14 shadow-sm shrink-0`}>
            {companyId === "ramada" ? (
              <span className="text-[10px] tracking-tight">RAMADA</span>
            ) : companyId === "wyndham" ? (
              <span className="text-[10px] tracking-tight">WYNDHAM</span>
            ) : (
              <span className="text-sm">CML</span>
            )}
          </div>
          <div className="space-y-0.5">
            <span className={`text-[10px] font-bold tracking-[0.15em] text-${colors.primary} uppercase block`}>
              {companyId === "ramada" ? "RAMADA SUITES" : companyId === "wyndham" ? "WYNDHAM RESORT" : "CML GROUP"} OPERATIONAL GATEWAY
            </span>
            <h2 className="text-xl font-extrabold text-[#111827] tracking-tight flex items-center gap-1.5 uppercase font-sans">
              <Clock className={`text-${colors.primary}`} size={18} /> Digital Sign-In Sheet
            </h2>
            <p className="text-[11px] text-[#4b5563] font-medium leading-none">
              {colors.tagline} • Secure Multi-Property Logins
            </p>
          </div>
        </div>

        {session ? (
          <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-3">
            {/* Quick Home/Portal Return Button */}
            <button
              type="button"
              onClick={() => {
                if (onBackToPortal) {
                  onBackToPortal();
                } else {
                  window.location.href = window.location.origin + window.location.pathname;
                }
              }}
              className="bg-slate-800 hover:bg-slate-900 border border-slate-700 text-white font-extrabold px-3.5 py-2 rounded-lg text-xs uppercase tracking-wider transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
              title="Return to Main Portal Dashboard"
            >
              <Home size={14} />
              <span>Portal Dashboard</span>
            </button>

            {/* Access Mode Selector Toggles */}
            {(session.role === "Manager" || session.role === "Super Admin" || hasActiveDelegation) && (
              <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200 gap-1 shadow-inner shrink-0">
                <button
                  type="button"
                  onClick={() => setActiveAccess("staff")}
                  className={`px-4 py-1.5 rounded-md text-xs font-extrabold tracking-wide transition flex items-center justify-center gap-1.5 cursor-pointer ${
                    activeAccess === "staff"
                      ? "bg-white text-slate-900 shadow-xs"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  Staff Access
                </button>
                <button
                  type="button"
                  onClick={() => setActiveAccess("manager")}
                  className={`px-4 py-1.5 rounded-md text-xs font-extrabold tracking-wide transition flex items-center justify-center gap-1.5 cursor-pointer ${
                    activeAccess === "manager"
                      ? "bg-white text-slate-900 shadow-xs"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  HOD / Manager Access
                </button>
              </div>
            )}

            {/* Authenticated User Block */}
            <div className="flex items-center gap-3 bg-slate-50 px-3.5 py-1.5 border border-slate-200 rounded-lg shrink-0">
              <div className="text-right">
                <span className="text-[9px] uppercase font-black block text-slate-400">SESSION MODE</span>
                <p className="text-xs font-bold text-slate-900 leading-none mt-0.5">{session.firstName} {session.lastName}</p>
                <p className="text-[10px] text-slate-500 font-semibold">{session.role} • {session.department}</p>
              </div>
              <div className="h-6 w-px bg-slate-200" />
              <button
                type="button"
                onClick={handleLogout}
                className="hover:text-rose-600 text-slate-400 p-1 hover:bg-rose-50 rounded-full transition cursor-pointer"
                title={impersonatingFrom ? "Exit Impersonation Mode" : "Logout Session"}
              >
                <LogOut size={16} />
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => {
              if (onBackToPortal) {
                onBackToPortal();
              } else {
                window.location.href = window.location.origin + window.location.pathname;
              }
            }}
            className="bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 font-extrabold px-4 py-2 rounded-lg text-xs uppercase tracking-wider transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs self-start"
            title="Return to Main Portal Dashboard"
          >
            <Home size={14} />
            <span>Go Back to Portal</span>
          </button>
        )}
      </div>
      


      {loading && (
        <div className="text-center py-24 space-y-3">
          <div className="inline-block w-8 h-8 border-4 border-sky-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs text-slate-500 font-mono">Loading tracking records...</p>
        </div>
      )}

      {/* ================= 1. THE SINGLE-INPUT LOGIN BOX FLOW ================= */}
      {!loading && !session && (
        <div className="max-w-md mx-auto my-12">
          <div className="bg-white border border-slate-200 rounded-lg shadow-md overflow-hidden">
            {/* Top light bar header styled with active business colors */}
            <div className={`py-4 text-center ${colors.accentBg} border-b`}>
              <h3 className={`text-sm font-bold uppercase tracking-wider ${colors.primaryText}`}>Sign In Portal</h3>
            </div>

            <div className="p-6 md:p-8 space-y-5">
              <div className="space-y-1">
                <label className="block text-xs font-bold uppercase text-slate-500 tracking-wide">
                  Credentials Match
                </label>
                <p className="text-[11px] text-slate-500 leading-relaxed font-normal">
                  Enter your registered Employee Code, professional Email address, or full name to access your shifts.
                </p>
              </div>

              {loginError && (
                <div className="bg-red-50 border border-red-200 text-red-700 p-2.5 rounded text-[11px] flex gap-2 items-start">
                  <AlertCircle size={14} className="text-red-500 shrink-0 mt-0.5" />
                  <span>{loginError}</span>
                </div>
              )}

              <form onSubmit={handleLoginSubmit} className="space-y-3.5">
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={loginInput}
                    onChange={(e) => setLoginInput(e.target.value)}
                    placeholder="e.g. 8888 or Rohit or rohitlalramada@gmail.com"
                    className={`w-full bg-white border border-slate-300 rounded px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 ${colors.primaryBorderFocus} transition placeholder:text-slate-400 font-mono`}
                  />
                </div>

                <button
                  type="submit"
                  className={`w-full ${colors.primaryButton} font-bold py-2 rounded text-xs uppercase tracking-wider transition shadow-sm cursor-pointer`}
                >
                  Confirm Sign In
                </button>
              </form>
            </div>
          </div>


        </div>
      )}

      {/* ================= 2. STAFF DASHBOARD (Streamlined Clock actions & history) ================= */}
      {!loading && session && (session.role === "Staff" || activeAccess === "staff") && (
        <div className="space-y-8 max-w-6xl mx-auto">
          
          {/* Left Column - Clock in/out & simple Leave Requests (Restructured to side-by-side top grid) */}
          {session.role !== "Super Admin" && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
              
              {/* Staff Sign-In Log Section */}
              <div className="bg-white border border-slate-200/60 rounded-xl p-6 space-y-6 shadow-xs">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <Clock className="text-slate-400 shrink-0 font-light" size={18} />
                    <h3 className="text-sm font-bold uppercase tracking-[0.08em] text-slate-400 font-sans leading-none">
                      STAFF SIGN-IN LOG
                    </h3>
                  </div>
                  {session.managerName && session.managerName !== "None" && (
                    <div className="text-right">
                      <span className="text-[11px] text-slate-400 font-bold">HOD Tracker: </span>
                      <span className={`text-${colors.primary} text-[11px] font-extrabold`}>{session.managerName}</span>
                    </div>
                  )}
                </div>
 
                {(() => {
                  const activeLog = signLogs.find(l => l.userId === session.id && !l.signOutTime);
                  return (
                    <div className="space-y-6">
                      <div className="bg-[#EBFDF5] border border-[#A7F3D0]/30 rounded-xl p-5 space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold tracking-wider uppercase text-slate-400">System Duty Status</span>
                          {activeLog ? (
                            <span className="bg-white text-[#137333] text-[10px] font-extrabold uppercase px-3 py-1 rounded-full flex items-center gap-1.5 tracking-wider border border-[#10b981]/20 font-sans shadow-sm leading-none">
                              <span className="w-2 rounded-full bg-[#10b981] h-2 animate-pulse" /> ACTIVE ON-DUTY
                            </span>
                          ) : (
                            <span className="bg-white text-slate-500 text-[10px] font-bold uppercase px-3 py-1 rounded-full flex items-center gap-1.5 tracking-wider border border-slate-200 font-sans shadow-sm leading-none">
                              <span className="w-2 rounded-full bg-slate-300 h-2" /> OFF-DUTY
                            </span>
                          )}
                        </div>
                        
                        <div className="space-y-1">
                          {activeLog ? (
                            <>
                              <p className="text-[12px] font-semibold text-slate-400 tracking-wide">Checked-In Shift start:</p>
                              <p className="text-[15px] font-bold text-slate-900 tracking-tight font-sans leading-none mt-1">{activeLog.signInTime}</p>
                              {activeLog.signInNotes && (
                                <p className="text-[11px] text-slate-500 italic mt-2 leading-tight">Note: "{activeLog.signInNotes}"</p>
                              )}
                            </>
                          ) : (
                            <p className="text-xs text-slate-400 italic leading-normal">No active shift logs found. Complete optional shift notes and click Sign In below.</p>
                          )}
                        </div>
                      </div>
 
                      {/* Live GPS Verification Panel */}
                      {(isVerifyingLocation || locationVerificationMessage) && (
                        <div className={`p-4 rounded-xl border text-[11px] leading-relaxed transition-all duration-300 flex items-start gap-3 shadow-inner ${
                          locationVerificationStatus === "success"
                            ? "bg-emerald-50 border-emerald-300 text-emerald-800"
                            : locationVerificationStatus === "warning"
                            ? "bg-amber-50 border-amber-300 text-amber-800 font-medium"
                            : locationVerificationStatus === "error"
                            ? "bg-rose-50 border-rose-300 text-rose-800 font-medium animate-pulse"
                            : "bg-sky-50 border-sky-200 text-sky-800"
                        }`}>
                          {isVerifyingLocation ? (
                            <RefreshCw className="w-4 h-4 shrink-0 animate-spin text-sky-600" />
                          ) : (
                            <Shield className={`w-4 h-4 shrink-0 ${
                              locationVerificationStatus === "success" 
                                ? "text-emerald-600" 
                                : locationVerificationStatus === "warning" 
                                ? "text-amber-600" 
                                : "text-rose-600"
                            }`} />
                          )}
                          <div className="space-y-1">
                            <span className="font-extrabold uppercase tracking-wide block text-[9px] opacity-75">
                              {isVerifyingLocation ? "System Status Query" : "Duty Authorization"}
                            </span>
                            <p>{locationVerificationMessage}</p>
                            {locationVerificationStatus === "error" && !isVerifyingLocation && (
                              <button
                                type="button"
                                onClick={() => {
                                  setDriftOverrideActive(true);
                                  setLocationVerificationStatus("warning");
                                  setLocationVerificationMessage("⚠️ System override parameters ready. Click Clock-In or Clock-Out again to complete.");
                                }}
                                className="mt-2.5 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded font-sans text-[10px] font-extrabold uppercase tracking-widest transition flex items-center gap-1 cursor-pointer shadow-sm border border-rose-500"
                              >
                                🏢 System Environment Override
                              </button>
                            )}
                          </div>
                        </div>
                      )}

                      <GeofenceInteractiveMap
                        companyId={companyId}
                        userCoords={userCoords}
                        mapLoading={mapLoading}
                        mapError={mapError}
                        onRefresh={fetchLiveCoordinatesForMap}
                        userDept={session?.department}
                        strictGeofenceDepartments={workflowConfig?.strictGeofenceDepartments}
                        roleGracePeriods={workflowConfig?.roleGracePeriods}
                        userRole={session?.role}
                      />

                      {activeLog ? (
                        <button
                          type="button"
                          onClick={() => handleStaffClockOut(activeLog.id)}
                          className="w-full bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-[12px] py-3.5 rounded-lg uppercase tracking-wider transition-all duration-150 shadow-md hover:shadow-lg active:scale-[0.98] cursor-pointer"
                        >
                          Sign Out (Clock Out)
                        </button>
                      ) : (
                        <div className="space-y-4">
                          {/* Selected Daily Approver Group */}
                          <div className="space-y-1.5 bg-slate-50 p-3 rounded-lg border border-slate-200">
                            <label className="block text-[10px] uppercase font-extrabold text-slate-500 tracking-wider">
                              👥 Select Daily Approver Group (HODs & Super Admins)
                            </label>
                            <p className="text-[9px] text-slate-505 leading-tight">
                              Choose who can view and approve your clock-in. Charles and your HOD are selected by default.
                            </p>
                            <div className="flex flex-wrap gap-1.5 pt-1">
                              {allApprovers.map((approver) => {
                                const isSelected = selectedClockApprovers.includes(approver.name);
                                return (
                                  <button
                                    key={approver.name}
                                    type="button"
                                    onClick={() => {
                                      if (isSelected) {
                                        setSelectedClockApprovers(prev => prev.filter(name => name !== approver.name));
                                      } else {
                                        setSelectedClockApprovers(prev => [...prev, approver.name]);
                                      }
                                    }}
                                    className={`px-2.5 py-1 rounded-full text-[10px] font-semibold transition-all border flex items-center gap-1 cursor-pointer ${
                                      isSelected
                                        ? "bg-sky-100 border-sky-300 text-sky-8 font-extrabold shadow-sm"
                                        : "bg-white border-slate-200 text-slate-600 hover:bg-slate-100"
                                    }`}
                                  >
                                    <span>{isSelected ? "✓" : "＋"}</span>
                                    <span>{approver.name}</span>
                                    <span className="text-[8px] opacity-75 font-mono">({approver.role})</span>
                                  </button>
                                );
                              })}
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={handleStaffClockIn}
                            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-[12px] py-3.5 rounded-lg uppercase tracking-wider transition-all duration-150 shadow-md hover:shadow-lg active:scale-[0.98] cursor-pointer"
                          >
                            Sign In (Clock In)
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>

              {/* Leave & Movement Request Section */}
              <div className="bg-white border border-slate-200/60 rounded-xl p-6 space-y-6 shadow-xs">
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-[0.08em] text-slate-400 font-sans mb-1">LEAVE & MOVEMENT REQUEST</h3>
                  <p className="text-[11px] text-[#4b5563] font-medium leading-none font-sans">File direct out-of-office notifications or annual leaves.</p>
                </div>

                {moveSuccess && (
                  <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs p-3 rounded">
                    {moveSuccess}
                  </div>
                )}

                <form onSubmit={handleMoveFormSubmit} className="space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[9px] uppercase font-bold text-slate-500 mb-0.5">Destination</label>
                      <input
                        type="text"
                        required
                        value={moveForm.destination}
                        onChange={(e) => setMoveForm({ ...moveForm, destination: e.target.value })}
                        placeholder="e.g. Town Office or Medical Clinic"
                        className="w-full bg-white border border-slate-300 rounded p-1.5 text-xs text-slate-800 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[9px] uppercase font-bold text-slate-500 mb-0.5">Target Date</label>
                      <input
                        type="date"
                        required
                        value={moveForm.date}
                        onChange={(e) => setMoveForm({ ...moveForm, date: e.target.value })}
                        className="w-full bg-white border border-slate-300 rounded p-1.5 text-xs text-slate-800 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[9px] uppercase font-bold text-slate-500 mb-0.5">Start Time</label>
                      <input
                        type="time"
                        required
                        value={moveForm.startTime}
                        onChange={(e) => setMoveForm({ ...moveForm, startTime: e.target.value })}
                        className="w-full bg-white border border-slate-300 rounded p-1.5 text-xs text-slate-800 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[9px] uppercase font-bold text-slate-500 mb-0.5">End Time</label>
                      <input
                        type="time"
                        required
                        value={moveForm.endTime}
                        onChange={(e) => setMoveForm({ ...moveForm, endTime: e.target.value })}
                        className="w-full bg-white border border-slate-300 rounded p-1.5 text-xs text-slate-800 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[9px] uppercase font-bold text-slate-500 mb-0.5">Reason</label>
                    <input
                      type="text"
                      required
                      value={moveForm.reason}
                      onChange={(e) => setMoveForm({ ...moveForm, reason: e.target.value })}
                      placeholder="e.g. Bank delivery or personal leave request"
                      className="w-full bg-white border border-slate-300 rounded p-1.5 text-xs text-slate-800 focus:outline-none"
                    />
                  </div>

                  <button
                    type="submit"
                    className={`w-full ${colors.primaryButton} font-bold py-2 rounded text-xs uppercase tracking-wider transition shadow-sm cursor-pointer`}
                  >
                    <Send size={11} className="inline mr-1" /> Submit Request
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* Right Column - Personal Private logs & requests (Restructured to side-by-side history grid) */}
          <div className={`grid grid-cols-1 ${session.role === "Super Admin" ? "lg:grid-cols-1" : "lg:grid-cols-2"} gap-6 items-start w-full`}>
            
            {/* 1. Daily Clock Logs */}
            <div className="bg-white border border-slate-200/60 rounded-xl p-6 shadow-xs space-y-6">
              <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                <h3 className="text-xs uppercase tracking-[0.15em] font-bold text-slate-400 font-sans leading-none">
                  MY ATTENDANCE HISTORY
                </h3>
                <div className="flex items-center gap-1.5 text-[10.5px] text-slate-500">
                  <span className="font-bold">Sort:</span>
                  <select
                    value={`${logSortField}-${logSortOrder}`}
                    onChange={(e) => {
                      const [field, order] = e.target.value.split("-") as [any, any];
                      setLogSortField(field);
                      setLogSortOrder(order);
                    }}
                    className="bg-slate-55 border border-slate-250 rounded p-1 text-xs text-slate-700 font-bold focus:outline-none focus:ring-1 focus:ring-sky-500"
                  >
                    <option value="date-desc">Newest Date first</option>
                    <option value="date-asc">Oldest Date first</option>
                    <option value="status-asc">Status (A-Z)</option>
                    <option value="status-desc">Status (Z-A)</option>
                  </select>
                </div>
              </div>
              
              {signLogs.filter(l => l.userId === session.id).length === 0 ? (
                <p className="text-xs text-slate-400 italic py-6 text-center">No clock-in activity found for your profile.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200/60 text-slate-400 text-left">
                        <th className="pb-3 text-[11px] font-bold uppercase tracking-wider text-left">Sign In</th>
                        <th className="pb-3 text-[11px] font-bold uppercase tracking-wider text-left">Sign Out</th>
                        <th className="pb-3 text-[11px] font-bold uppercase tracking-wider text-left">Review Notes</th>
                        <th className="pb-3 text-[11px] font-bold uppercase tracking-wider text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {getSortedSignLogs(signLogs.filter(l => l.userId === session.id)).map(log => (
                        <tr key={log.id} className="border-b border-slate-100/60 hover:bg-slate-50/50 transition">
                          <td className="py-4 text-slate-900 font-medium text-[13px]">
                            <div>{log.signInTime}</div>
                            {log.locationStatus && (
                              <div className="flex items-center gap-1 text-[10px] text-slate-500 font-mono mt-0.5" title={`${log.lat || 0}, ${log.lng || 0}`}>
                                <MapPin size={9} className="text-emerald-500" /> {log.locationStatus}
                              </div>
                            )}
                          </td>
                          <td className="py-4 text-slate-650 font-medium text-[13px]">
                            <div>{log.signOutTime || <span className="text-emerald-600 font-semibold text-[13px]">Active Now</span>}</div>
                            {log.signOutLocationStatus && (
                              <div className="flex items-center gap-1 text-[10px] text-slate-500 font-mono mt-0.5" title={`${log.signOutLat || 0}, ${log.signOutLng || 0}`}>
                                <MapPin size={9} className="text-emerald-500" /> {log.signOutLocationStatus}
                              </div>
                            )}
                          </td>
                          <td className="py-4 text-slate-700">
                            {renderFormattedNotes(log.signInNotes, true)}
                            {renderFormattedNotes(log.signOutNotes, false)}
                            {log.actionedBy ? (
                              <div className="text-[10px] font-extrabold text-[#137333] tracking-wide uppercase font-sans mt-2">
                                {log.status === "Approved" ? "APPROVED BY" : "ACTIONED BY"}: {log.actionedBy.toUpperCase()}
                              </div>
                            ) : (
                              (!log.signInNotes && !log.signOutNotes) && <div className="text-[13px] text-slate-400">—</div>
                            )}
                          </td>
                          <td className="py-4 text-right">
                            <span className={`inline-block px-3 py-1 rounded-sm text-[10px] uppercase tracking-wider font-extrabold ${
                              log.status === "Approved" ? "bg-[#E6F4EA] text-[#137333]" :
                              log.status === "Denied" ? "bg-[#FEF2F2] text-[#D11242]" : "bg-[#FFF7ED] text-[#C2410C]"
                            }`}>
                              {log.status === "Approved" ? "APPROVED" : log.status === "Denied" ? "DENIED" : "PENDING"}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* 2. Movement history */}
            <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm space-y-4">
              <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                <h3 className="text-sm font-bold uppercase text-slate-800 tracking-wider">
                  My Leaves & Movements requests
                </h3>
                <div className="flex items-center gap-1.5 text-[10.5px] text-slate-500">
                  <span className="font-bold">Sort:</span>
                  <select
                    value={`${moveSortField}-${moveSortOrder}`}
                    onChange={(e) => {
                      const [field, order] = e.target.value.split("-") as [any, any];
                      setMoveSortField(field);
                      setMoveSortOrder(order);
                    }}
                    className="bg-slate-55 border border-slate-250 rounded p-1 text-xs text-slate-700 font-bold focus:outline-none focus:ring-1 focus:ring-sky-500"
                  >
                    <option value="date-desc">Newest Date first</option>
                    <option value="date-asc">Oldest Date first</option>
                    <option value="status-asc">Status (A-Z)</option>
                    <option value="status-desc">Status (Z-A)</option>
                  </select>
                </div>
              </div>

              {movements.filter(m => m.userId === session.id).length === 0 ? (
                <p className="text-xs text-slate-400 italic py-6 text-center">No off-site movement requests found.</p>
              ) : (
                <div className="space-y-3">
                  {getSortedMovements(movements.filter(m => m.userId === session.id)).map(move => (
                    <div key={move.id} className="bg-slate-50 p-3 rounded border border-slate-200 text-xs text-slate-700 space-y-1.5">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-bold text-slate-800">{move.type} to {move.destination}</p>
                          <p className="text-[10px] text-slate-500">Timeline: {move.startDate} to {move.endDate}</p>
                        </div>
                        <span className={`px-2 py-0.5 rounded text-[9px] uppercase tracking-wider font-extrabold ${
                          move.status === "Approved" ? "bg-emerald-100 text-emerald-800" :
                          move.status === "Denied" ? "bg-red-100 text-red-800" : "bg-amber-100 text-amber-800"
                        }`}>
                          {move.status}
                        </span>
                      </div>
                      <p className="text-slate-600 italic">"Reason: {move.reason}"</p>
                      {move.managerName ? (
                        <p className="text-[9.5px] text-emerald-800 bg-emerald-50/70 px-2 py-1 rounded border border-emerald-200 font-bold uppercase tracking-wide">
                          Manager Name: {move.managerName}
                        </p>
                      ) : move.actionedBy ? (
                        <p className="text-[9.5px] text-emerald-805 bg-emerald-50/70 px-2 py-1 rounded border border-emerald-200 font-bold uppercase tracking-wide">
                          Authorized by HOD: {move.actionedBy}
                        </p>
                      ) : null}
                      {move.escalationNotes && (
                        <p className="text-[10px] text-sky-850 bg-sky-50 px-2 py-1 rounded border border-sky-200 italic">
                          Feedback: {move.escalationNotes}
                        </p>
                      )}
                    </div>
                  )) }
                </div>
              )}
            </div>

          </div>
        </div>
      )}

      {/* ================= 3. MANAGER DASHBOARD (Department restricted) ================= */}
      {!loading && session && (session.role === "Manager" || hasActiveDelegation) && activeAccess === "manager" && (
        <div className="space-y-6 max-w-6xl mx-auto">
          
          <div className="bg-sky-50 border border-sky-100 p-4 rounded-lg flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div>
              <p className="text-sm font-bold text-sky-900 uppercase tracking-widest font-mono">Department Audit Dashboard</p>
              <p className="text-xs text-sky-700">Restricted overview for HOD of <span className="font-extrabold">{session.department}</span> department only.</p>
            </div>
            <span className="bg-sky-600 text-white px-3 py-1 rounded text-xs font-bold uppercase">
              {session.department}
            </span>
          </div>
               {/* Stunning, classy navigation controls with Category, Folder states, and View mode selectors */}
          <div className="bg-white border border-slate-200 p-3 rounded-xl shadow-xs font-sans">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
              {/* Category tabs */}
              <div className="flex bg-slate-50 p-1 rounded-lg border border-slate-200/80 gap-1 w-full lg:w-auto">
                <button
                  type="button"
                  onClick={() => setHodTab("shifts")}
                  className={`flex-1 lg:flex-initial px-4 py-2 rounded-md text-xs font-medium tracking-wide transition flex items-center justify-center gap-1.5 ${
                    hodTab === "shifts"
                      ? `${colors.primaryButton} shadow-sm`
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                  }`}
                >
                  <Clock size={13} className={hodTab === "shifts" ? "text-white" : colors.iconColor} />
                  Shift Validations
                </button>
                <button
                  type="button"
                  onClick={() => setHodTab("leaves")}
                  className={`flex-1 lg:flex-initial px-4 py-2 rounded-md text-xs font-medium tracking-wide transition flex items-center justify-center gap-1.5 ${
                    hodTab === "leaves"
                      ? `${colors.primaryButton} shadow-sm`
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                  }`}
                >
                  <Calendar size={13} className={hodTab === "leaves" ? "text-white" : colors.iconColor} />
                  Leave & Movements
                </button>
              </div>

              {/* Folder Status tabs & Layout Controls */}
              <div className="flex flex-wrap lg:flex-nowrap gap-3 items-center w-full lg:w-auto justify-between lg:justify-end">
                {/* Folders */}
                <div className="flex bg-slate-50 p-1 rounded-lg border border-slate-200/80 gap-1">
                  <button
                    type="button"
                    onClick={() => setRequestStatusTab("pending")}
                    className={`px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-1.5 transition ${
                      requestStatusTab === "pending"
                        ? "bg-slate-200 text-slate-800 font-semibold"
                        : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                    }`}
                  >
                    <Folder size={13} className="text-amber-500" />
                    Pending Queue
                  </button>
                  <button
                    type="button"
                    onClick={() => setRequestStatusTab("done")}
                    className={`px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-1.5 transition ${
                      requestStatusTab === "done"
                        ? "bg-slate-200 text-slate-800 font-semibold"
                        : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                    }`}
                  >
                    <FolderCheck size={13} className="text-emerald-500" />
                    Done Archive
                  </button>
                </div>

                {/* Layout switches (1-column vs Grid) */}
                <div className="flex bg-slate-50 p-1 rounded-lg border border-slate-200/80 gap-1">
                  <button
                    type="button"
                    onClick={() => setRequestLayoutOption("list")}
                    className={`px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-1 transition ${
                      requestLayoutOption === "list"
                        ? "bg-white text-slate-900 shadow-xs border border-slate-200"
                        : "text-slate-500 hover:text-slate-800"
                    }`}
                    title="1 Column View"
                  >
                    <Sliders size={13} className="rotate-90 text-slate-500" />
                    1 Column
                  </button>
                  <button
                    type="button"
                    onClick={() => setRequestLayoutOption("grid")}
                    className={`px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-1 transition ${
                      requestLayoutOption === "grid"
                        ? "bg-white text-slate-900 shadow-xs border border-slate-200"
                        : "text-slate-500 hover:text-slate-800"
                    }`}
                    title="Grid View"
                  >
                    <Layers size={13} className="text-slate-500" />
                    Grid View
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Dynamic Content area for HOD */}
          <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm space-y-4">
            <h3 className="text-xs font-bold uppercase text-slate-400 tracking-wider border-b border-slate-100 pb-2 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-sky-500 animate-ping"></span>
              {hodTab === "shifts" ? "Shift Validation Logs" : "Leave & Movement Request Registry"} &mdash; {requestStatusTab === "pending" ? "Pending List" : "Done Archive Files"}
            </h3>

            {hodTab === "shifts" ? (
              // Shift logs view
              (() => {
                const deptLogs = signLogs.filter(l => {
                  const isDept = session.role === "Super Admin" || 
                                 l.department.toLowerCase() === session.department.toLowerCase() ||
                                 delegatedDepartments.some((d: string) => d.toLowerCase() === l.department.toLowerCase()) ||
                                 (l.allowedApprovers && l.allowedApprovers.includes(`${session.firstName} ${session.lastName}`));
                  const isStatus = requestStatusTab === "pending" ? l.status === "Pending" : l.status !== "Pending";
                  return isDept && isStatus;
                });

                if (deptLogs.length === 0) {
                  return (
                    <p className="text-xs text-slate-400 italic py-12 text-center">No clock activities found in this selection.</p>
                  );
                }

                return (
                  <div className={`grid gap-4 ${requestLayoutOption === "list" ? "grid-cols-1" : "grid-cols-1 md:grid-cols-2"}`}>
                    {sortLogsDescending(deptLogs).map(log => (
                      <div key={log.id} className="bg-slate-50 p-4 rounded border border-slate-200 text-xs space-y-2.5 relative hover:border-slate-350 transition-colors">
                        <div className="flex justify-between items-start gap-2">
                          <div className="space-y-1">
                            <p className="font-bold text-slate-800 text-sm">{log.userName}</p>
                            <p className="text-[10px] text-slate-500 uppercase font-bold font-mono">Code: {log.employeeCode} • {log.role} ({log.department})</p>
                            <p className="text-slate-700">Clock In: <span className="font-bold text-emerald-600 font-mono">{log.signInTime}</span></p>
                            <p className="text-slate-750">Clock Out: <span className="font-bold text-slate-600 font-mono">{log.signOutTime || "Active Duty"}</span></p>
                            {renderFormattedNotes(log.signInNotes, true)}
                            {renderFormattedNotes(log.signOutNotes, false)}
                            {log.allowedApprovers && log.allowedApprovers.length > 0 && (
                              <div className="text-[10px] text-sky-700 bg-sky-50 px-2.5 py-1 rounded border border-sky-100/65 inline-block font-sans font-semibold mt-1">
                                👥 Selected Approver Group: <span className="font-bold text-sky-900">{log.allowedApprovers.join(", ")}</span>
                              </div>
                            )}
                          </div>
                          
                          <span className={`px-2.5 py-1 rounded text-[8px] uppercase tracking-widest font-black ${
                            log.status === "Approved" ? "bg-emerald-100 text-emerald-800" :
                            log.status === "Denied" ? "bg-red-100 text-red-800" : "bg-amber-100 text-amber-500"
                          }`}>
                            {log.status === "Pending" && log.escalatedToAdmin ? "ESCALATED" : log.status}
                          </span>
                        </div>

                        {log.status === "Pending" && !log.escalatedToAdmin && (
                          <div className="pt-2.5 border-t border-slate-200/80 space-y-2">
                            <input
                              type="text"
                              placeholder="Approver comment (Optional feedback / Escalate justification)"
                              value={approverComments[log.id] || ""}
                              onChange={(e) => setApproverComments({ ...approverComments, [log.id]: e.target.value })}
                              className="w-full bg-white border border-slate-300 rounded text-xs p-2 focus:outline-none focus:ring-1 focus:ring-sky-500"
                            />
                            <div className="flex gap-2 flex-wrap sm:flex-nowrap justify-end">
                              <button
                                onClick={() => handleManagerEscalation(log.id, "log")}
                                className="bg-amber-100 hover:bg-amber-200 text-amber-805 px-3 py-2 rounded transition text-[10px] font-bold uppercase min-h-[38px] flex items-center justify-center w-full sm:w-auto"
                              >
                                Escalate to Charles
                              </button>
                              <button
                                onClick={() => handleSignApproval(log.id, "Denied")}
                                className="bg-red-100 hover:bg-red-200 text-red-850 px-3 py-2 rounded transition text-[10px] font-bold uppercase min-h-[38px] flex items-center justify-center w-full sm:w-auto"
                              >
                                Deny
                              </button>
                              <button
                                onClick={() => handleSignApproval(log.id, "Approved")}
                                className="bg-emerald-100 hover:bg-emerald-250 text-emerald-850 px-3 py-2 rounded transition text-[10px] font-bold uppercase min-h-[38px] flex items-center justify-center w-full sm:w-auto"
                              >
                                Approve
                              </button>
                            </div>
                          </div>
                        )}

                        {log.actionedBy && (
                          <div className="text-[10px] text-slate-500 border-t border-slate-200/60 pt-1.5 flex justify-between">
                            <span>Actioned by HOD: {log.actionedBy}</span>
                            <span>{log.actionedDate}</span>
                          </div>
                        )}

                        {log.escalatedToAdmin && (
                          <p className="text-[10px] text-amber-850 bg-amber-50 rounded border border-amber-200 p-20 italic font-medium">
                            {log.escalationNotes || "Escalated globally to Charles Cebujano (Super Admin) for final adjudication."}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                );
              })()
            ) : (
              // Leave & Movements view
              (() => {
                const deptMoves = movements.filter(m => {
                  const isDept = session.role === "Super Admin" || 
                                 m.department.toLowerCase() === session.department.toLowerCase() ||
                                 delegatedDepartments.some((d: string) => d.toLowerCase() === m.department.toLowerCase()) ||
                                 (m.allowedApprovers && m.allowedApprovers.includes(`${session.firstName} ${session.lastName}`));
                  const isStatus = requestStatusTab === "pending" ? m.status === "Pending" : m.status !== "Pending";
                  return isDept && isStatus;
                });

                if (deptMoves.length === 0) {
                  return (
                    <p className="text-xs text-slate-400 italic py-12 text-center">No leave or off-premises requests found in this section.</p>
                  );
                }

                return (
                  <div className={`grid gap-4 ${requestLayoutOption === "list" ? "grid-cols-1" : "grid-cols-1 md:grid-cols-2"}`}>
                    {sortMovementsDescending(deptMoves).map(move => (
                      <div key={move.id} className="bg-slate-50 p-4 rounded border border-slate-200 text-xs space-y-2.5 relative hover:border-slate-350 transition-colors">
                        <div className="flex justify-between items-start gap-2">
                          <div className="space-y-1">
                            <p className="font-bold text-slate-800 text-sm">{move.userName}</p>
                            <p className="text-[10px] text-slate-500 uppercase font-bold font-mono">Code: {move.employeeCode} • <span className="text-sky-600 font-extrabold">{move.type}</span> ({move.department})</p>
                            <p className="text-slate-805">Destination: <span className="font-bold text-slate-950">{move.destination}</span></p>
                            <p className="text-[10.5px] text-slate-600 font-medium font-mono">Period: {move.startDate} to {move.endDate}</p>
                            <p className="text-[11px] text-slate-605 bg-white p-2.5 rounded border border-slate-150 italic font-medium">Reason: "{move.reason}"</p>
                            {move.allowedApprovers && move.allowedApprovers.length > 0 && (
                              <div className="text-[10px] text-sky-700 bg-sky-50 px-2.5 py-1 rounded border border-sky-100/65 inline-block font-sans font-semibold mt-1">
                                👥 Selected Approver Group: <span className="font-bold text-sky-900">{move.allowedApprovers.join(", ")}</span>
                              </div>
                            )}
                          </div>
                          
                          <span className={`px-2.5 py-1 rounded text-[8px] uppercase tracking-widest font-black ${
                            move.status === "Approved" ? "bg-emerald-100 text-emerald-800" :
                            move.status === "Denied" ? "bg-red-100 text-red-800" : "bg-amber-100 text-amber-500"
                          }`}>
                            {move.status === "Pending" && move.escalatedToAdmin ? "ESCALATED" : move.status}
                          </span>
                        </div>

                        {move.status === "Pending" && !move.escalatedToAdmin && (
                          <div className="pt-2 border-t border-slate-200/80 space-y-2">
                            <input
                              type="text"
                              placeholder="HOD comments (Optional escalation or feedback)"
                              value={approverComments[move.id] || ""}
                              onChange={(e) => setApproverComments({ ...approverComments, [move.id]: e.target.value })}
                              className="w-full bg-white border border-slate-300 rounded text-xs p-2 focus:outline-none focus:ring-1 focus:ring-sky-500"
                            />
                            <div className="flex gap-2 flex-wrap sm:flex-nowrap justify-end">
                              <button
                                onClick={() => handleManagerEscalation(move.id, "movement")}
                                className="bg-amber-100 hover:bg-amber-200 text-amber-805 px-3 py-2 rounded transition text-[10px] font-bold uppercase min-h-[38px] flex items-center justify-center w-full sm:w-auto"
                              >
                                Escalate to Charles
                              </button>
                              <button
                                onClick={() => handleMovementApproval(move.id, "Denied")}
                                className="bg-red-100 hover:bg-red-200 text-red-850 px-3 py-2 rounded transition text-[10px] font-bold uppercase min-h-[38px] flex items-center justify-center w-full sm:w-auto cursor-pointer"
                              >
                                Deny
                              </button>
                              {session.role === "Super Admin" || session.role === "Manager" || session.role === "GM" ? (
                                <button
                                  type="button"
                                  onClick={() => handleMovementApproval(move.id, "Approved")}
                                  className="bg-emerald-100 hover:bg-emerald-250 text-emerald-850 px-3 py-2 rounded transition text-[10px] font-bold uppercase min-h-[38px] flex items-center justify-center w-full sm:w-auto cursor-pointer"
                                >
                                  Approve
                                </button>
                              ) : (
                                <div className="text-[10px] text-slate-450 font-medium italic bg-slate-100 border border-slate-200/80 px-3 py-2 rounded min-h-[38px] flex items-center justify-center text-center">
                                  Approval requires HOD or Super Admin
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {move.managerName && (
                          <div className="bg-emerald-50 border border-emerald-100 rounded text-emerald-855 p-2.5 flex items-center justify-between text-[11px] font-bold">
                            <span>Manager Name: {move.managerName}</span>
                            <span className="text-[10px] text-emerald-700 uppercase">✅ Approved & Logged</span>
                          </div>
                        )}

                        {move.actionedBy && (
                          <div className="text-[10px] text-slate-500 border-t border-slate-200/60 pt-1.5 flex justify-between">
                            <span>Actioned by: {move.actionedBy}</span>
                            <span>{move.actionedDate}</span>
                          </div>
                        )}

                        {move.escalatedToAdmin && (
                          <p className="text-[10px] text-amber-850 bg-amber-50 rounded border border-amber-200 p-2 italic font-medium">
                            {move.escalationNotes || "Escalated globally to Charles Cebujano (Super Admin) for final adjudication."}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                );
              })()
            )}
          </div>

        </div>
      )}

      {/* ================= 4. SUPER ADMIN VIEW (Charles' Dashboard) ================= */}
      {!loading && session && session.role === "Super Admin" && activeAccess === "manager" && (
        <div className="space-y-6 max-w-6xl mx-auto">
          
          {/* Executive Overview Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white border border-slate-200 p-4 rounded-lg shadow-sm">
              <span className="text-[9px] font-bold uppercase text-slate-400 block tracking-wider">Registered Staff</span>
              <p className="text-2xl font-black text-slate-800 font-mono mt-1">{totalEmployees}</p>
              <span className="text-[10px] text-slate-500">Corporate Directory</span>
            </div>

            <div className="bg-white border border-slate-200 p-4 rounded-lg shadow-sm">
              <span className="text-[9px] font-bold uppercase text-slate-400 block tracking-wider">Validated On Duty</span>
              <p className="text-2xl font-black text-emerald-600 font-mono mt-1">{rawOnDutyCount}</p>
              <span className="text-[10px] text-slate-500">Current shifts</span>
            </div>

            <div className="bg-white border border-slate-200 p-4 rounded-lg shadow-sm">
              <span className="text-[9px] font-bold uppercase text-slate-400 block tracking-wider">Pending Clock Logs</span>
              <p className="text-2xl font-black text-amber-600 font-mono mt-1">{pendingAttendances}</p>
              <span className="text-[10px] text-slate-500">Required validation</span>
            </div>

            <div className="bg-white border border-slate-200 p-4 rounded-lg shadow-sm">
              <span className="text-[9px] font-bold uppercase text-slate-400 block tracking-wider">Pending Movements</span>
              <p className="text-2xl font-black text-sky-600 font-mono mt-1">{pendingMovements}</p>
              <span className="text-[10px] text-slate-500">Active Leave lists</span>
            </div>
          </div>

          {/* Interactive SuperAdmin Keyboard Navigable Pending Approvals Inbox */}
          <div className="bg-gradient-to-r from-slate-900 to-slate-950 text-white rounded-xl p-6 shadow-lg border border-slate-850 space-y-5">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-800 pb-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="bg-rose-500/10 text-rose-400 text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded border border-rose-500/20">
                    📥 MY PENDING APPROVALS INBOX
                  </span>
                  <span className="bg-sky-500/10 text-sky-400 text-[10.5px] font-mono px-2.5 py-0.5 rounded border border-sky-500/10">
                    {adminPendingApprovals.length} item(s) pending
                  </span>
                </div>
                <h3 className="text-lg font-black tracking-tight text-white font-sans uppercase">
                  Charles' Executive Approval Queue
                </h3>
                <p className="text-[11px] text-slate-400 leading-normal max-w-2xl font-medium">
                  Review and manage the latest pending administrative approval items.
                </p>
              </div>
            </div>

            {adminPendingApprovals.length === 0 ? (
              <div className="text-center py-12 space-y-3 bg-slate-900/40 rounded-xl border border-dashed border-slate-800">
                <p className="text-sm font-semibold text-slate-400 italic">🎉 Excellent, Charles! Your approval inbox is fully cleared.</p>
                <p className="text-[10px] text-slate-500">New employee records, clock logs, and travel leaves will appear here immediately.</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
                {adminPendingApprovals.map((item, idx) => {
                  const isSelected = idx === focusedApprovalIndex;
                  return (
                    <div
                      key={item.id}
                      onClick={() => setFocusedApprovalIndex(idx)}
                      className={`relative rounded-xl border transition-all duration-200 cursor-pointer p-4 select-none ${
                        isSelected
                          ? "bg-slate-850/80 border-sky-500 shadow-sky-500/15 shadow-md scale-[1.005] ring-2 ring-sky-500/20"
                          : "bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-850/40"
                      }`}
                    >
                      {/* Selection Left Accent Bar */}
                      {isSelected && (
                        <div className="absolute top-0 bottom-0 left-0 w-1.5 bg-sky-500 rounded-l-xl" />
                      )}

                      <div className="flex flex-col md:flex-row justify-between gap-4">
                        <div className="space-y-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-xs font-black text-white">{item.userName}</span>
                            <span className="text-[10px] text-slate-400 font-bold uppercase font-mono">({item.department})</span>
                            <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded tracking-wider border ${
                              item.approvalType === "shift"
                                ? "bg-emerald-500/10 text-emerald-450 border-emerald-500/20"
                                : "bg-sky-500/10 text-sky-450 border-sky-500/20"
                            }`}>
                              {item.approvalType === "shift" ? "⚡ Shift Clock Log" : "✈️ Leave & Movement"}
                            </span>
                            {(() => {
                              const locStatus = getApprovalLocationStatus(item);
                              return (
                                <span className={locStatus.badgeClass}>
                                  <span className={`w-1.5 h-1.5 rounded-full ${locStatus.color}`} />
                                  ({locStatus.name})
                                </span>
                              );
                            })()}
                          </div>

                          <div className="space-y-1 text-xs text-slate-300 leading-relaxed font-sans">
                            {item.approvalType === "shift" ? (
                              <>
                                <p>Clocked In: <span className="font-bold text-emerald-400 font-mono">{item.signInTime}</span></p>
                                {item.signOutTime && <p>Clocked Out: <span className="font-bold text-slate-400 font-mono">{item.signOutTime}</span></p>}
                                <div className="pt-1">
                                  {renderFormattedNotes(item.signInNotes, true)}
                                  {renderFormattedNotes(item.signOutNotes, false)}
                                </div>
                              </>
                            ) : (
                              <>
                                <p>Destination: <span className="font-bold text-white uppercase">{item.destination}</span></p>
                                <p className="font-mono text-[11px] text-sky-350">Period: {item.startDate} to {item.endDate}</p>
                                <p className="text-slate-400 italic font-medium bg-slate-950/40 p-2 rounded">Reason: "{item.reason}"</p>
                              </>
                            )}
                          </div>
                        </div>

                        {/* Adjudication actions */}
                        <div className="flex flex-row md:flex-col justify-end items-end gap-2 shrink-0">
                          {isSelected && (
                            <span className="text-[9.5px] font-bold text-sky-400 tracking-wider font-mono uppercase bg-sky-950/60 px-2 py-0.5 rounded border border-sky-500/20 mb-1 hidden md:inline-block">
                              ⌨️ Arrow Nav Active
                            </span>
                          )}
                          <div className="flex gap-1.5 w-full md:w-auto">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (item.approvalType === "shift") {
                                  handleSignApproval(item.id, "Denied");
                                } else {
                                  handleMovementApproval(item.id, "Denied");
                                }
                              }}
                              className="bg-rose-600/20 hover:bg-rose-600 border border-rose-500 text-rose-400 hover:text-white px-3 py-1.5 rounded text-[11px] font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5"
                            >
                              <span>Reject</span>
                              <span className="text-[9px] bg-slate-950/40 text-rose-300 px-1 rounded font-mono group-hover:hidden">[R]</span>
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (item.approvalType === "shift") {
                                  handleSignApproval(item.id, "Approved");
                                } else {
                                  handleMovementApproval(item.id, "Approved");
                                }
                              }}
                              className="bg-emerald-600/25 hover:bg-emerald-600 border border-emerald-500 text-emerald-400 hover:text-white px-4 py-1.5 rounded text-[11px] font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5"
                            >
                              <span>Approve</span>
                              <span className="text-[9px] bg-slate-950/40 text-emerald-300 px-1 rounded font-mono font-bold">[A]</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Sub Navigation Tabs for Charles' View */}
          <div className="border-b border-slate-200 flex flex-wrap gap-2">
            <button
              onClick={() => setAdminTab("directory")}
              className={`px-4 py-2.5 text-xs font-bold uppercase tracking-wider transition-all duration-150 ${
                adminTab === "directory" ? `border-b-2 border-${colors.primary} text-${colors.primary} font-black` : "text-slate-500 hover:text-slate-800"
              }`}
            >
              💼 Personnel Directory ({totalEmployees})
            </button>
            <button
              onClick={() => setAdminTab("logs")}
              className={`px-4 py-2.5 text-xs font-bold uppercase tracking-wider transition-all duration-150 ${
                adminTab === "logs" ? `border-b-2 border-${colors.primary} text-${colors.primary} font-black` : "text-slate-500 hover:text-slate-800"
              }`}
            >
              📝 Global Attendance logs
            </button>
            <button
              onClick={() => setAdminTab("movements")}
              className={`px-4 py-2.5 text-xs font-bold uppercase tracking-wider transition-all duration-150 ${
                adminTab === "movements" ? `border-b-2 border-${colors.primary} text-${colors.primary} font-black` : "text-slate-500 hover:text-slate-800"
              }`}
            >
              ✈️ Global Leaves &amp; Movements
            </button>
            <button
              onClick={() => setAdminTab("reports")}
              className={`px-4 py-2.5 text-xs font-bold uppercase tracking-wider transition-all duration-150 ${
                adminTab === "reports" ? `border-b-2 border-${colors.primary} text-${colors.primary} font-black` : "text-slate-500 hover:text-slate-800"
              }`}
            >
              📊 Reports Center
            </button>
          </div>

          {/* Tab 1: PERSONNEL DIRECTORY with Add/Edit/Delete & IMPERSONATION options! */}
          {adminTab === "directory" && (
            <div className="bg-white border border-slate-200 rounded-lg p-5 space-y-4 shadow-sm">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h3 className="text-base font-bold text-slate-950">Employee Directory</h3>
                  <p className="text-xs text-slate-500">Manage CML registered employees and trigger view-mode impersonation.</p>
                </div>

                <div className="flex flex-wrap gap-2 w-full sm:w-auto items-center">
                  <input
                    type="text"
                    placeholder="Search name, code..."
                    value={userQueryFilter}
                    onChange={(e) => setUserQueryFilter(e.target.value)}
                    className="bg-white border border-slate-300 rounded text-xs px-2.5 py-1 text-slate-800 focus:outline-none"
                  />
                  <select
                    value={selectedDeptFilter}
                    onChange={(e) => setSelectedDeptFilter(e.target.value)}
                    className="bg-white border border-slate-300 rounded text-xs p-1 text-slate-700 focus:outline-none"
                  >
                    <option value="All">All Departments</option>
                    {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>

                  <select
                    value={selectedStatusFilter}
                    onChange={(e) => setSelectedStatusFilter(e.target.value as any)}
                    className="bg-white border border-slate-300 rounded text-xs p-1 text-slate-750 font-bold text-slate-700 focus:outline-none placeholder:text-slate-400"
                    title="Filter by coordination status"
                  >
                    <option value="All">All Statuses</option>
                    <option value="Available">🟢 Available</option>
                    <option value="On-Duty">🔴 On-Duty</option>
                    <option value="Off-Shift">⚫ Off-Shift</option>
                  </select>
                  
                  {/* Dynamic Directory Sort Options Selector */}
                  <select
                    value={`${userSortField}-${userSortOrder}`}
                    onChange={(e) => {
                      const [field, order] = e.target.value.split("-") as [any, any];
                      setUserSortField(field);
                      setUserSortOrder(order);
                    }}
                    className="bg-slate-50 border border-slate-300 rounded text-xs p-1 text-slate-705 font-bold focus:outline-none focus:ring-1 focus:ring-sky-500"
                    title="Sort list of staff members"
                  >
                    <option value="name-asc">Sort: Name (A-Z)</option>
                    <option value="name-desc">Sort: Name (Z-A)</option>
                    <option value="code-asc">Sort: Employee Code (Asc)</option>
                    <option value="code-desc">Sort: Employee Code (Desc)</option>
                    <option value="department-asc">Sort: Department (A-Z)</option>
                    <option value="role-asc">Sort: Role (A-Z)</option>
                  </select>

                  <button
                    onClick={() => setShowAddUserModal(true)}
                    className="bg-sky-600 hover:bg-sky-700 text-white px-3.5 py-1 rounded text-xs font-bold flex items-center gap-1 shrink-0 cursor-pointer"
                  >
                    <UserPlus size={14} /> Register
                  </button>
                </div>
              </div>

              {/* Coordination Status Statistics Panel */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-3 bg-slate-50 border border-slate-200 rounded-lg">
                <div className="bg-white p-2.5 rounded border border-slate-150 shadow-2xs">
                  <div className="text-[9px] font-sans font-bold uppercase tracking-widest text-slate-400">Total Staff Profiles</div>
                  <div className="text-base font-black text-slate-800 mt-0.5">{users.length + 1} Contacts</div>
                </div>
                <div className="bg-white p-2.5 rounded border border-slate-150 shadow-2xs flex flex-col justify-between">
                  <div className="text-[9px] font-sans font-bold uppercase tracking-widest text-emerald-600 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping"></span>
                    On-Duty Staff
                  </div>
                  <div className="text-base font-black text-emerald-700 mt-0.5">
                    {users.filter(u => getUserStatus(u) === "On-Duty").length + (getUserStatus(SUPER_ADMIN_SEED as any) === "On-Duty" ? 1 : 0)} Active
                  </div>
                </div>
                <div className="bg-white p-2.5 rounded border border-slate-150 shadow-2xs flex flex-col justify-between">
                  <div className="text-[9px] font-sans font-bold uppercase tracking-widest text-[#bf9721] flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-pulse"></span>
                    Available (On-Call)
                  </div>
                  <div className="text-base font-black text-[#856404] mt-0.5">
                    {users.filter(u => getUserStatus(u) === "Available").length} Team Members
                  </div>
                </div>
                <div className="bg-white p-2.5 rounded border border-slate-150 shadow-2xs flex flex-col justify-between">
                  <div className="text-[9px] font-sans font-bold uppercase tracking-widest text-slate-500 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full"></span>
                    Off-Shift
                  </div>
                  <div className="text-base font-black text-slate-500 mt-0.5">
                    {users.filter(u => getUserStatus(u) === "Off-Shift").length + (getUserStatus(SUPER_ADMIN_SEED as any) === "Off-Shift" ? 1 : 0)} Idle
                  </div>
                </div>
              </div>

              {/* Spreadsheet Operations Control Panel */}
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3">
                  <div className="space-y-0.5">
                    <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                      <Sliders size={13} className="text-slate-500" /> Spreadsheet Data Operations
                    </h4>
                    <p className="text-[10px] text-slate-500">Import/Export spreadsheets via CSV & Excel pasted tables, or wipe the employee registry.</p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={handleExportUsersCSV}
                      className="bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 px-3 py-1.5 rounded text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 transition cursor-pointer"
                      title="Download full directory as an Excel-compatible CSV file"
                    >
                      <Download size={12} />
                      Export CSV
                    </button>

                    <button
                      type="button"
                      onClick={() => setShowSpreadsheetTools(!showSpreadsheetTools)}
                      className="bg-sky-50 hover:bg-sky-100 text-sky-800 border border-sky-200 px-3 py-1.5 rounded text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 transition cursor-pointer"
                      title="Import and ingest employees from Excel or Google Sheets"
                    >
                      <Upload size={12} />
                      Import Spreadsheet
                    </button>

                    <button
                      type="button"
                      onClick={syncAllContactsToFirestore}
                      className="bg-amber-50 hover:bg-amber-100 text-[#bf9721] border border-amber-200 px-3 py-1.5 rounded text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 transition cursor-pointer"
                      title="Instantly restore or synchronize all 315 design-approved employee contacts"
                    >
                      <RefreshCw size={12} className={loading ? "animate-spin" : ""} />
                      Seed 315 Staff
                    </button>

                    <button
                      type="button"
                      onClick={handleDeleteAllEmployees}
                      className="bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 px-3 py-1.5 rounded text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 transition cursor-pointer"
                      title="Permanently remove all employee records from the directory"
                    >
                      <Trash2 size={12} />
                      Delete All
                    </button>
                  </div>
                </div>

                {showSpreadsheetTools && (
                  <div className="bg-white border border-slate-200 rounded p-4 space-y-4">
                    <div className="space-y-1">
                      <h5 className="text-[12px] font-bold text-slate-800">Bulk Ingest Employee Directory:</h5>
                      <p className="text-[10px] text-slate-500 leading-relaxed">
                        Import your employee database into the Firebase registry. Supported columns (matched automatically in left-to-right order):
                        <br />
                        <strong className="text-slate-700">[Employee Code], [First Name], [Last Name], [Department], [Email], [Phone], [Manager Name], [Date of Birth (YYYY-MM-DD)], [Role (Staff/Manager)]</strong>.
                        Header lines are automatically recognized and skipped.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Active Drag & Drop Area */}
                      <div
                        onDragOver={(e) => {
                          e.preventDefault();
                          setIsDragging(true);
                        }}
                        onDragLeave={() => setIsDragging(false)}
                        onDrop={(e) => {
                          e.preventDefault();
                          setIsDragging(false);
                          handleFileDrop(e);
                        }}
                        onClick={() => document.getElementById("csv-file-uploader-element")?.click()}
                        className={`border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center gap-2 cursor-pointer transition-all duration-200 text-center ${
                          isDragging
                            ? "border-sky-500 bg-sky-50/50 scale-[0.99] shadow-inner"
                            : importedFileName
                            ? "border-emerald-500 bg-emerald-50/15"
                            : "border-slate-300 bg-slate-50 hover:bg-slate-100/75"
                        }`}
                        title="Drag and drop your spreadsheet file here"
                      >
                        <input
                          id="csv-file-uploader-element"
                          type="file"
                          accept=".csv,.txt"
                          onChange={handleFileChange}
                          className="hidden"
                        />
                        <Upload size={22} className={importedFileName ? "text-emerald-500" : "text-slate-400"} />
                        {importedFileName ? (
                          <div>
                            <p className="text-xs font-bold text-emerald-800">Linked Spreadsheet Loaded</p>
                            <p className="text-[10px] text-emerald-600 font-mono mt-0.5">{importedFileName}</p>
                            <p className="text-[9px] text-slate-400 mt-2">Click to replace or run import below.</p>
                          </div>
                        ) : (
                          <div>
                            <p className="text-xs font-bold text-slate-700">Drag & Drop CSV File here</p>
                            <p className="text-[10px] text-slate-500 mt-1">or click to browse local files (.csv or .txt)</p>
                          </div>
                        )}
                      </div>

                      {/* Paste Area */}
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Or Paste Clipboard Data (TSV/CSV):</label>
                        <textarea
                          rows={4}
                          value={pastedCSV}
                          onChange={(e) => {
                            setPastedCSV(e.target.value);
                            if (importedFileName) setImportedFileName("");
                          }}
                          placeholder={`e.g.\nEMP-8812\tCharles\tCML\tFront Office\tcharles@cml.com.fj\t+679 123 4567\tSupervisor\t1987-09-12\tManager`}
                          className="w-full h-full bg-slate-50 border border-slate-300 rounded p-2 text-xs text-slate-800 font-mono placeholder:text-slate-450 focus:outline-none focus:bg-white focus:ring-1 focus:ring-sky-500"
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={() => {
                          setPastedCSV("");
                          setImportedFileName("");
                          setShowSpreadsheetTools(false);
                        }}
                        className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-3.5 py-1.5 rounded text-[10px] font-bold uppercase tracking-wider transition cursor-pointer"
                      >
                        Cancel
                      </button>
                      
                      <button
                        type="button"
                        onClick={() => handleImportUsersCSV(pastedCSV)}
                        className="bg-sky-600 hover:bg-sky-700 text-white px-5 py-1.5 rounded text-[10px] font-bold uppercase tracking-wider transition cursor-pointer"
                      >
                        Run Data Import
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Grid or table of users */}
              {/* Desktop View Table */}
              <div className="hidden md:block overflow-x-auto text-xs pb-16">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-150 bg-slate-50 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
                      <th className="p-3">Staff Code</th>
                      <th className="p-3">Full Name</th>
                      <th className="p-3">Department</th>
                      <th className="p-3">Email Column</th>
                      <th className="p-3">Phone Column</th>
                      <th className="p-3">HOD Manager</th>
                      <th className="p-3 font-mono">DOB</th>
                      <th className="p-3">Coordination Status</th>
                      <th className="p-3">Role</th>
                      <th className="p-3 text-right">Shortcuts & Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {/* Hardcoded Super Admin visual row to show completeness */}
                    <tr className="border-b border-slate-100 bg-sky-50/40">
                      <td className="p-3 font-bold font-mono text-sky-800">{SUPER_ADMIN_SEED.employeeCode}</td>
                      <td className="p-3 font-bold text-slate-900">{SUPER_ADMIN_SEED.firstName} {SUPER_ADMIN_SEED.lastName} (You)</td>
                      <td className="p-3">{SUPER_ADMIN_SEED.department}</td>
                      <td className="p-3 text-slate-600 font-medium font-sans">{SUPER_ADMIN_SEED.email}</td>
                      <td className="p-3 text-slate-500 font-mono">{SUPER_ADMIN_SEED.phone}</td>
                      <td className="p-3 text-slate-400 italic">None (Self)</td>
                      <td className="p-3 font-mono text-slate-500">{SUPER_ADMIN_SEED.dateOfBirth}</td>
                      <td className="p-3">
                        <span className="bg-emerald-100 text-emerald-805 border-emerald-200 border text-[9px] px-2 py-0.5 rounded font-black uppercase">
                          🟢 On-Duty
                        </span>
                      </td>
                      <td className="p-3">
                        <span className="bg-sky-100 text-sky-800 border-sky-200 border text-[9px] px-2 py-0.5 rounded font-black uppercase">
                          SUPER ADMIN
                        </span>
                      </td>
                      <td className="p-3 text-right text-slate-400 italic">Master Account</td>
                    </tr>

                    {filteredUsers.length === 0 ? (
                      <tr>
                        <td colSpan={10} className="text-center italic py-12 text-slate-400">
                          No registered employee profiles found. Complete registrations above.
                        </td>
                      </tr>
                    ) : (
                      filteredUsers.map(u => {
                        const activeLog = signLogs.find(l => l.userId === u.id && !l.signOutTime);
                        return (
                          <tr key={u.id} className="border-b border-slate-100 hover:bg-slate-50">
                            <td className="p-3 font-bold font-mono text-slate-700">{u.employeeCode}</td>
                            <td className="p-3 font-bold text-slate-900">{u.firstName} {u.lastName}</td>
                            <td className="p-3">
                              <select
                                value={pendingEdits[u.id]?.department !== undefined ? pendingEdits[u.id].department : u.department}
                                onChange={(e) => {
                                  const newDept = e.target.value;
                                  const newMgr = AUTOMATIC_MANAGERS[newDept] || "None";
                                  setPendingEdits(prev => ({
                                    ...prev,
                                    [u.id]: {
                                      ...prev[u.id],
                                      department: newDept,
                                      managerName: newMgr
                                    }
                                  }));
                                }}
                                className="bg-slate-50 border border-slate-200 text-xs rounded-md px-1.5 py-1 font-semibold text-slate-700 cursor-pointer focus:outline-none focus:ring-1 focus:ring-amber-500"
                              >
                                {DEPARTMENTS.map(dept => (
                                  <option key={dept} value={dept}>{dept}</option>
                                ))}
                              </select>
                            </td>
                            {/* Short-cut to edit Email */}
                            <td className="p-3">
                              <input
                                type="email"
                                value={pendingEdits[u.id]?.email !== undefined ? pendingEdits[u.id].email : u.email}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setPendingEdits(prev => ({
                                    ...prev,
                                    [u.id]: { ...prev[u.id], email: val }
                                  }));
                                }}
                                className="w-40 bg-slate-50 border border-slate-200 text-xs rounded px-1.5 py-1 font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-amber-500"
                              />
                            </td>
                            {/* Short-cut to edit Phone */}
                            <td className="p-3">
                              <input
                                type="text"
                                value={pendingEdits[u.id]?.phone !== undefined ? pendingEdits[u.id].phone : u.phone}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setPendingEdits(prev => ({
                                    ...prev,
                                    [u.id]: { ...prev[u.id], phone: val }
                                  }));
                                }}
                                className="w-28 bg-slate-50 border border-slate-200 text-xs rounded px-1.5 py-1 font-mono text-slate-700 focus:outline-none focus:ring-1 focus:ring-amber-500"
                              />
                            </td>
                            {/* Editable HOD Manager with custom dropdown datalist option */}
                            <td className="p-3">
                              <input
                                type="text"
                                value={pendingEdits[u.id]?.managerName !== undefined ? pendingEdits[u.id].managerName : u.managerName}
                                list="hod-managers-list"
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setPendingEdits(prev => ({
                                    ...prev,
                                    [u.id]: { ...prev[u.id], managerName: val }
                                  }));
                                }}
                                className="w-32 bg-slate-50 border border-slate-200 text-xs rounded px-1.5 py-1 font-semibold text-slate-700 focus:outline-none focus:ring-1 focus:ring-amber-500"
                              />
                            </td>
                            <td className="p-3 font-mono text-slate-600">{u.dateOfBirth}</td>
                            {/* Editable Coordination Status Option */}
                            <td className="p-3">
                              <select
                                value={pendingEdits[u.id]?.status !== undefined ? pendingEdits[u.id].status : getUserStatus(u)}
                                onChange={(e) => {
                                  const val = e.target.value as "Available" | "On-Duty" | "Off-Shift";
                                  setPendingEdits(prev => ({
                                    ...prev,
                                    [u.id]: {
                                      ...prev[u.id],
                                      status: val
                                    }
                                  }));
                                }}
                                className={cn(
                                  "border text-[10px] rounded px-1.5 py-1 font-extrabold focus:outline-none cursor-pointer uppercase transition-all duration-150",
                                  (pendingEdits[u.id]?.status !== undefined ? pendingEdits[u.id].status : getUserStatus(u)) === "On-Duty"
                                    ? "bg-emerald-50 border-emerald-300 text-emerald-800 font-black"
                                    : (pendingEdits[u.id]?.status !== undefined ? pendingEdits[u.id].status : getUserStatus(u)) === "Available"
                                    ? "bg-amber-50 border-amber-300 text-amber-800 font-black"
                                    : "bg-slate-50 border-slate-300 text-slate-600 font-bold"
                                )}
                              >
                                <option value="Available">🟢 Available</option>
                                <option value="On-Duty">🔴 On-Duty</option>
                                <option value="Off-Shift">⚫ Off-Shift</option>
                              </select>
                            </td>
                            {/* Editable Role column Option */}
                            <td className="p-3">
                              <select
                                value={pendingEdits[u.id]?.role !== undefined ? pendingEdits[u.id].role : u.role}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setPendingEdits(prev => ({
                                    ...prev,
                                    [u.id]: { ...prev[u.id], role: val }
                                  }));
                                }}
                                className="bg-slate-50 border border-slate-200 text-[10px] rounded px-1.5 py-1 font-black text-slate-705 cursor-pointer focus:outline-none focus:ring-1 focus:ring-amber-500 uppercase"
                              >
                                <option value="Staff">Staff</option>
                                <option value="Manager">Manager</option>
                                <option value="Super Admin">Super Admin</option>
                              </select>
                            </td>
                            <td className="p-3 text-right">
                              <div className="flex flex-col gap-1.5 items-end">
                                {/* Shortcut action buttons */}
                                <div className="flex items-center gap-1">
                                  {activeLog ? (
                                    <button
                                      onClick={() => handleQuickClockOut(u, activeLog.id)}
                                      className="bg-rose-605 hover:bg-rose-700 bg-rose-600 text-white text-[9px] font-bold px-2 py-1 rounded uppercase tracking-wider shadow-sm transition cursor-pointer shrink-0"
                                      title="Quick Clock Out Signoff"
                                    >
                                      Clock Out
                                    </button>
                                  ) : (
                                    <button
                                      onClick={() => handleQuickClockIn(u)}
                                      className="bg-emerald-600 hover:bg-emerald-700 text-white text-[9px] font-bold px-2 py-1 rounded uppercase tracking-wider shadow-sm transition cursor-pointer shrink-0"
                                      title="Quick Clock In On-Duty"
                                    >
                                      Clock In
                                    </button>
                                  )}
                                  <button
                                    onClick={() => handleQuickApplyMovement(u, "Leave", "Early Layoff Application")}
                                    className="bg-amber-100 hover:bg-amber-200 text-amber-800 text-[9px] font-bold px-2 py-1 rounded uppercase tracking-wider shadow-sm transition cursor-pointer shrink-0"
                                    title="Quick Early Layoff or Apply Leave"
                                  >
                                    Layoff
                                  </button>
                                  <button
                                    onClick={() => handleQuickApplyMovement(u, "Movement", "Going Somewhere / Travel Approve")}
                                    className="bg-blue-105 hover:bg-blue-200 bg-blue-100 text-blue-800 text-[9px] font-bold px-2 py-1 rounded uppercase tracking-wider shadow-sm transition cursor-pointer shrink-0"
                                    title="Quick Going Somewhere / Duty Run Approve"
                                  >
                                    Approve
                                  </button>
                                </div>
                                <div className="flex gap-1.5 shrink-0 items-center">
                                  {pendingEdits[u.id] && (
                                    <button
                                      onClick={async () => {
                                        const rEdits = pendingEdits[u.id];
                                        try {
                                          await updateDoc(doc(db, `cml-signin-users-${companyId}`, u.id), rEdits);
                                          setPendingEdits(prev => {
                                            const copy = { ...prev };
                                            delete copy[u.id];
                                            return copy;
                                          });
                                          alert(`Saved changes for ${u.firstName} successfully!`);
                                        } catch (err: any) {
                                          alert("Failed to save changes: " + err.message);
                                        }
                                      }}
                                      className="bg-emerald-600 hover:bg-emerald-700 text-white text-[9px] font-extrabold px-2.5 py-1 rounded uppercase tracking-wider shadow-md transition cursor-pointer shrink-0 flex items-center gap-1 animate-pulse"
                                      title="Save Modifications"
                                    >
                                      <Save size={11} /> Save
                                    </button>
                                  )}
                                  {/* Option to login on each users dashboard as requested! */}
                                  <button
                                    onClick={() => handleImpersonateUser(u)}
                                    className="bg-emerald-50 hover:bg-emerald-100 text-emerald-800 p-1.5 rounded transition"
                                    title={`Login and impersonate ${u.firstName}`}
                                  >
                                    <Eye size={12} />
                                  </button>
                                  <button
                                    onClick={() => setEditingUser(u)}
                                    className="bg-slate-100 hover:bg-slate-200 text-slate-700 p-1.5 rounded"
                                    title="Edit attributes"
                                  >
                                    <Edit size={12} />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteEmployee(u.id)}
                                    className="bg-red-50 hover:bg-red-100 text-red-650 p-1.5 rounded"
                                    title="Delete employee"
                                  >
                                    <Trash2 size={12} />
                                  </button>
                                </div>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card User Directory View */}
              <div className="block md:hidden space-y-4 pb-16">
                {/* Special Super Admin Card */}
                <div className="bg-sky-50 border border-sky-100 rounded-lg p-4 space-y-3 shadow-xs">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[9px] font-black tracking-wider text-sky-800 bg-sky-100 px-2 py-0.5 rounded uppercase">
                        Super Admin
                      </span>
                      <h4 className="text-xs font-bold text-slate-900 mt-1">
                        {SUPER_ADMIN_SEED.firstName} {SUPER_ADMIN_SEED.lastName} (You)
                      </h4>
                      <p className="font-mono text-[10px] text-sky-700 mt-0.5">Code: {SUPER_ADMIN_SEED.employeeCode}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-600 bg-white border border-sky-100 rounded p-2.5">
                    <div>
                      <strong className="block text-[8px] uppercase tracking-wider text-slate-400">Department</strong>
                      {SUPER_ADMIN_SEED.department}
                    </div>
                    <div>
                      <strong className="block text-[8px] uppercase tracking-wider text-slate-400">Email</strong>
                      <span className="break-all">{SUPER_ADMIN_SEED.email}</span>
                    </div>
                    <div>
                      <strong className="block text-[8px] uppercase tracking-wider text-slate-400">Phone</strong>
                      {SUPER_ADMIN_SEED.phone}
                    </div>
                    <div>
                      <strong className="block text-[8px] uppercase tracking-wider text-slate-400">Date of Birth</strong>
                      {SUPER_ADMIN_SEED.dateOfBirth}
                    </div>
                  </div>
                  <p className="text-[10px] italic text-slate-400 text-center">Master Account (Read-Only)</p>
                </div>

                {/* Filtered Employees Card List */}
                {filteredUsers.length === 0 ? (
                  <p className="text-xs italic text-center text-slate-400 py-8 bg-slate-50 border border-dashed rounded-lg">
                    No registered employee profiles found.
                  </p>
                ) : (
                  filteredUsers.map((u) => {
                    const activeLog = signLogs.find(l => l.userId === u.id && !l.signOutTime);
                    const currentEdits = pendingEdits[u.id] || {};
                    const displayDept = currentEdits.department !== undefined ? currentEdits.department : u.department;
                    const displayEmail = currentEdits.email !== undefined ? currentEdits.email : u.email;
                    const displayPhone = currentEdits.phone !== undefined ? currentEdits.phone : u.phone;
                    const displayManager = currentEdits.managerName !== undefined ? currentEdits.managerName : u.managerName;
                    const displayRole = currentEdits.role !== undefined ? currentEdits.role : u.role;

                    return (
                      <div key={u.id} className="bg-white border border-slate-200 rounded-lg p-4 space-y-4 shadow-sm relative hover:border-slate-300 transition-colors">
                        {/* Upper Section */}
                        <div className="flex justify-between items-start text-xs">
                          <div>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="bg-slate-100 text-slate-800 text-[9px] px-2 py-0.5 rounded font-bold uppercase border border-slate-200">
                                {displayRole}
                              </span>
                              {activeLog && (
                                <span className="bg-emerald-100 text-emerald-800 text-[9px] px-2 py-0.5 rounded font-black uppercase border border-emerald-200 animate-pulse">
                                  🟢 Active On-Duty
                                </span>
                              )}
                            </div>
                            <h4 className="text-xs font-black text-slate-900 mt-1.5">
                              {u.firstName} {u.lastName}
                            </h4>
                            <p className="font-mono text-[10px] text-sky-700 mt-0.5 font-bold">Code: {u.employeeCode}</p>
                          </div>
                        </div>

                        {/* Middle Settings Area - Beautiful Stacked Inputs */}
                        <div className="space-y-2.5 bg-slate-50 border border-slate-150 rounded-lg p-3">
                          
                          {/* Coordination Status Dropdown */}
                          <div className="flex flex-col gap-1">
                            <label className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Coordination Status:</label>
                            <select
                              value={pendingEdits[u.id]?.status !== undefined ? pendingEdits[u.id].status : getUserStatus(u)}
                              onChange={(e) => {
                                const val = e.target.value as "Available" | "On-Duty" | "Off-Shift";
                                setPendingEdits(prev => ({
                                  ...prev,
                                  [u.id]: {
                                    ...prev[u.id],
                                    status: val
                                  }
                                }));
                              }}
                              className={cn(
                                "w-full border text-xs rounded px-2 py-1 font-extrabold focus:outline-none cursor-pointer uppercase transition-all duration-150",
                                (pendingEdits[u.id]?.status !== undefined ? pendingEdits[u.id].status : getUserStatus(u)) === "On-Duty"
                                  ? "bg-emerald-50 border-emerald-300 text-emerald-800 font-black"
                                  : (pendingEdits[u.id]?.status !== undefined ? pendingEdits[u.id].status : getUserStatus(u)) === "Available"
                                  ? "bg-amber-50 border-amber-300 text-amber-800 font-black"
                                  : "bg-slate-50 border-slate-300 text-slate-600 font-bold"
                              )}
                            >
                              <option value="Available">🟢 Available</option>
                              <option value="On-Duty">🔴 On-Duty</option>
                              <option value="Off-Shift">⚫ Off-Shift</option>
                            </select>
                          </div>

                          {/* Department Dropdown */}
                          <div className="flex flex-col gap-1">
                            <label className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Department:</label>
                            <select
                              value={displayDept}
                              onChange={(e) => {
                                const newDept = e.target.value;
                                const newMgr = AUTOMATIC_MANAGERS[newDept] || "None";
                                setPendingEdits(prev => ({
                                  ...prev,
                                  [u.id]: {
                                    ...prev[u.id],
                                    department: newDept,
                                    managerName: newMgr
                                  }
                                }));
                              }}
                              className="w-full bg-white border border-slate-250 border-slate-200 text-xs rounded px-2 py-1 font-semibold text-slate-700 focus:outline-none focus:ring-1 focus:ring-sky-500 cursor-pointer text-xs"
                            >
                              {DEPARTMENTS.map(dept => (
                                <option key={dept} value={dept}>{dept}</option>
                              ))}
                            </select>
                          </div>

                          {/* Email Input */}
                          <div className="flex flex-col gap-1">
                            <label className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Email Address:</label>
                            <input
                              type="email"
                              value={displayEmail}
                              onChange={(e) => {
                                const val = e.target.value;
                                setPendingEdits(prev => ({
                                  ...prev,
                                  [u.id]: { ...prev[u.id], email: val }
                                }));
                              }}
                              className="w-full bg-white border border-slate-200 text-xs rounded px-2 py-1 font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-sky-500"
                            />
                          </div>

                          {/* Phone Input */}
                          <div className="flex flex-col gap-1">
                            <label className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Phone Contact:</label>
                            <input
                              type="text"
                              value={displayPhone}
                              onChange={(e) => {
                                const val = e.target.value;
                                setPendingEdits(prev => ({
                                  ...prev,
                                  [u.id]: { ...prev[u.id], phone: val }
                                }));
                              }}
                              className="w-full bg-white border border-slate-200 text-xs rounded px-2 py-1 font-mono text-slate-700 focus:outline-none focus:ring-1 focus:ring-sky-500"
                            />
                          </div>

                          {/* HOD Manager Input */}
                          <div className="flex flex-col gap-1">
                            <label className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">HOD Manager:</label>
                            <input
                              type="text"
                              value={displayManager}
                              list="hod-managers-list"
                              onChange={(e) => {
                                const val = e.target.value;
                                setPendingEdits(prev => ({
                                  ...prev,
                                  [u.id]: { ...prev[u.id], managerName: val }
                                }));
                              }}
                              className="w-full bg-white border border-slate-200 text-xs rounded px-2 py-1 font-semibold text-slate-700 focus:outline-none focus:ring-1 focus:ring-sky-500"
                            />
                          </div>

                          {/* DOB and Role Selection */}
                          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 pt-2 border-t border-slate-200 text-[10px] text-slate-500">
                            <div>
                              <span>Date of Birth: </span>
                              <strong className="font-mono">{u.dateOfBirth}</strong>
                            </div>
                            
                            <div className="flex items-center gap-1.5 justify-between">
                              <span className="shrink-0 text-[9px] font-bold uppercase text-slate-400">Role Authority:</span>
                              <select
                                value={displayRole}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setPendingEdits(prev => ({
                                    ...prev,
                                    [u.id]: { ...prev[u.id], role: val }
                                  }));
                                }}
                                className="bg-white border border-slate-200 text-[10px] rounded px-1.5 py-1 font-semibold text-slate-705 focus:outline-none cursor-pointer uppercase text-slate-800"
                              >
                                <option value="Staff">Staff</option>
                                <option value="Manager">Manager</option>
                                <option value="Super Admin">Super Admin</option>
                              </select>
                            </div>
                          </div>
                        </div>

                        {/* Mobile Status Shortcuts Action triggers */}
                        <div className="space-y-1.5 bg-slate-50 p-2.5 rounded-md border border-slate-200/50">
                          <label className="text-[8.5px] uppercase font-black text-slate-400 tracking-wider block">Shortcuts & Staff Actions:</label>
                          <div className="grid grid-cols-3 gap-2">
                            {activeLog ? (
                              <button
                                onClick={() => handleQuickClockOut(u, activeLog.id)}
                                className="bg-rose-600 hover:bg-rose-700 text-white text-[9px] font-bold py-1.5 rounded uppercase tracking-wider transition-colors inline-block text-center cursor-pointer"
                              >
                                Clock Out
                              </button>
                            ) : (
                              <button
                                onClick={() => handleQuickClockIn(u)}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white text-[9px] font-bold py-1.5 rounded uppercase tracking-wider transition-colors inline-block text-center cursor-pointer"
                              >
                                Clock In
                              </button>
                            )}
                            <button
                              onClick={() => handleQuickApplyMovement(u, "Leave", "Early Layoff Application")}
                              className="bg-amber-100 hover:bg-amber-200 text-amber-800 text-[9px] font-bold py-1.5 rounded uppercase tracking-wider transition-colors inline-block text-center cursor-pointer"
                            >
                              Layoff
                            </button>
                            <button
                              onClick={() => handleQuickApplyMovement(u, "Movement", "Going Somewhere / Travel Approve")}
                              className="bg-blue-100 hover:bg-blue-200 text-blue-800 text-[9px] font-bold py-1.5 rounded uppercase tracking-wider transition-colors inline-block text-center cursor-pointer"
                            >
                              Approve
                            </button>
                          </div>
                        </div>

                        {/* Bottom Utility controls */}
                        <div className="flex items-center justify-between pt-2.5 border-t border-slate-100">
                          <div>
                            {pendingEdits[u.id] && (
                              <button
                                onClick={async () => {
                                  const rEdits = pendingEdits[u.id];
                                  try {
                                    await updateDoc(doc(db, `cml-signin-users-${companyId}`, u.id), rEdits);
                                    setPendingEdits(prev => {
                                      const copy = { ...prev };
                                      delete copy[u.id];
                                      return copy;
                                    });
                                    alert(`Saved changes for ${u.firstName} successfully!`);
                                  } catch (err: any) {
                                    alert("Failed to save changes: " + err.message);
                                  }
                                }}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white text-[9px] font-extrabold px-2.5 py-1.5 rounded uppercase tracking-wider shadow-sm transition flex items-center gap-1 animate-pulse"
                              >
                                <Save size={11} /> Save Changes
                              </button>
                            )}
                          </div>

                          <div className="flex gap-2 text-[10px] font-bold">
                            <button
                              onClick={() => handleImpersonateUser(u)}
                              className="bg-emerald-50 hover:bg-emerald-100 text-emerald-800 p-2 rounded transition flex items-center gap-1"
                              title={`Login as ${u.firstName}`}
                            >
                              <Eye size={12} /> Live View
                            </button>
                            <button
                              onClick={() => setEditingUser(u)}
                              className="bg-slate-100 hover:bg-slate-200 text-slate-700 p-2 rounded flex items-center gap-1"
                            >
                              <Edit size={12} /> Edit
                            </button>
                            <button
                              onClick={() => handleDeleteEmployee(u.id)}
                              className="bg-red-50 hover:bg-red-100 text-red-600 p-2 rounded flex items-center gap-1"
                            >
                              <Trash2 size={12} /> Delete
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* Tab 2: GLOBAL ATTENDANCE LOGS */}
          {adminTab === "logs" && (
            <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-3">
                <div>
                  <h3 className="text-base font-bold text-slate-900 uppercase">Global Shift Ledger</h3>
                  <p className="text-xs text-slate-500">Every recorded login, log-out, and approval status filed across all corporate departments.</p>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-slate-500">
                  <span className="font-bold">Column Sort:</span>
                  <select
                    value={`${logSortField}-${logSortOrder}`}
                    onChange={(e) => {
                      const [field, order] = e.target.value.split("-") as [any, any];
                      setLogSortField(field);
                      setLogSortOrder(order);
                    }}
                    className="bg-slate-50 border border-slate-300 rounded p-1 text-xs text-slate-705 font-bold focus:outline-none focus:ring-1 focus:ring-sky-500"
                  >
                    <option value="date-desc">Newest Date first</option>
                    <option value="date-asc">Oldest Date first</option>
                    <option value="status-asc">Status Check (A-Z)</option>
                    <option value="status-desc">Status Check (Z-A)</option>
                  </select>
                </div>
              </div>

              {signLogs.length === 0 ? (
                <p className="text-xs italic text-center py-12 text-slate-400">No shift events saved in Firestore logs ledger.</p>
              ) : (
                <div className="overflow-x-auto text-[11px]">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 text-slate-500 text-left font-bold uppercase text-[9px]">
                        <th className="py-2.5">Employee</th>
                        <th className="py-2.5">Dept</th>
                        <th className="py-2.5">Clock In</th>
                        <th className="py-2.5">Clock Out</th>
                        <th className="py-2.5">Status Check</th>
                        <th className="py-2.5">Adjudicator Action</th>
                        <th className="py-2.5 text-right">Admin Force Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {getSortedSignLogs(signLogs).map(log => (
                        <tr key={log.id} className={`border-b border-slate-100 hover:bg-slate-50 ${log.escalatedToAdmin ? "bg-amber-50/50" : ""}`}>
                          <td className="py-3">
                            <span className="font-bold text-slate-950 block">{log.userName}</span>
                            <span className="text-[10px] text-slate-400 uppercase font-mono">{log.employeeCode}</span>
                          </td>
                          <td className="py-3 font-semibold text-slate-700">{log.department}</td>
                          <td className="py-3 text-slate-900">
                            <span className="font-mono font-medium text-emerald-700 text-[11px] block">{log.signInTime}</span>
                            {log.locationStatus && (
                              <span className="flex items-center gap-0.5 text-[9px] text-slate-500 font-mono mt-0.5" title={`${log.lat || 0}, ${log.lng || 0}`}>
                                <MapPin size={8} className="text-emerald-500" /> {log.locationStatus}
                              </span>
                            )}
                          </td>
                          <td className="py-3 text-slate-900">
                            <span className="font-mono text-[11px] block">{log.signOutTime || <span className="text-emerald-600 font-bold animate-pulse">Running Session</span>}</span>
                            {log.signOutLocationStatus && (
                              <span className="flex items-center gap-0.5 text-[9px] text-slate-500 font-mono mt-0.5" title={`${log.signOutLat || 0}, ${log.signOutLng || 0}`}>
                                <MapPin size={8} className="text-emerald-500" /> {log.signOutLocationStatus}
                              </span>
                            )}
                          </td>
                          <td className="py-3">
                            <span className={`px-2.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider ${
                              log.status === "Approved" ? "bg-emerald-100 text-emerald-800" :
                              log.status === "Denied" ? "bg-red-100 text-red-800" : "bg-amber-100 text-amber-550"
                            }`}>
                              {log.status === "Pending" && log.escalatedToAdmin ? "ESCALATED TO YOU 👑" : log.status}
                            </span>
                          </td>
                          <td className="py-3 max-w-[150px] truncate text-slate-550 italic">
                            {log.escalationNotes ? `"${log.escalationNotes}"` : "-"}
                          </td>
                          <td className="py-3 text-right">
                            <div className="flex justify-end gap-1">
                              <button
                                onClick={() => handleSignApproval(log.id, "Denied")}
                                className="bg-red-50 hover:bg-red-100 text-red-700 font-bold px-2 py-1 rounded text-[9px] uppercase"
                                title="Force Deny as Super Admin"
                              >
                                Deny
                              </button>
                              <button
                                onClick={() => handleSignApproval(log.id, "Approved")}
                                className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold px-2 py-1 rounded text-[9px] uppercase"
                                title="Force Approve as Super Admin"
                              >
                                Approve
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Tab 3: GLOBAL LEAVES AND MOVEMENTS */}
          {adminTab === "movements" && (
            <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-3">
                <div>
                  <h3 className="text-base font-bold text-slate-900 uppercase">Global Leaves & Movements Registry</h3>
                  <p className="text-xs text-slate-500">Every filed leave or movement request submitted for all corporate sectors.</p>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-slate-500">
                  <span className="font-bold">Column Sort:</span>
                  <select
                    value={`${moveSortField}-${moveSortOrder}`}
                    onChange={(e) => {
                      const [field, order] = e.target.value.split("-") as [any, any];
                      setMoveSortField(field);
                      setMoveSortOrder(order);
                    }}
                    className="bg-slate-50 border border-slate-300 rounded p-1 text-xs text-slate-705 font-bold focus:outline-none focus:ring-1 focus:ring-sky-500"
                  >
                    <option value="date-desc">Newest Date first</option>
                    <option value="date-asc">Oldest Date first</option>
                    <option value="status-asc">Status Check (A-Z)</option>
                    <option value="status-desc">Status Check (Z-A)</option>
                  </select>
                </div>
              </div>

              {movements.length === 0 ? (
                <p className="text-xs italic text-center py-12 text-slate-400">No leaves or off-site movements saved.</p>
              ) : (
                <div className="overflow-x-auto text-[11px]">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 text-slate-500 text-left font-bold uppercase text-[9px]">
                        <th className="py-2.5">Staff</th>
                        <th className="py-2.5">Type</th>
                        <th className="py-2.5">Destination</th>
                        <th className="py-2.5">Reason</th>
                        <th className="py-2.5">Duration Time</th>
                        <th className="py-2.5">Manager Name</th>
                        <th className="py-2.5">Status Check</th>
                        <th className="py-2.5 text-right">Force Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {getSortedMovements(movements).map(move => (
                        <tr key={move.id} className={`border-b border-slate-100 hover:bg-slate-50 ${move.escalatedToAdmin ? "bg-amber-50/50" : ""}`}>
                          <td className="py-3">
                            <span className="font-bold text-slate-950 block">{move.userName}</span>
                            <span className="text-[10px] text-slate-400">{move.department}</span>
                          </td>
                          <td className="py-3 font-semibold text-slate-800 uppercase">{move.type}</td>
                          <td className="py-3 font-medium text-slate-900">{move.destination}</td>
                          <td className="py-3 max-w-[150px] truncate text-slate-550 italic">"{move.reason}"</td>
                          <td className="py-3 font-mono text-slate-650">{move.startDate} to {move.endDate}</td>
                          <td className="py-3 font-semibold text-emerald-800">{move.managerName || "-"}</td>
                          <td className="py-3">
                            <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider ${
                              move.status === "Approved" ? "bg-emerald-100 text-emerald-800" :
                              move.status === "Denied" ? "bg-red-100 text-red-800" : "bg-amber-100 text-amber-500"
                            }`}>
                              {move.status === "Pending" && move.escalatedToAdmin ? "ESCALATED TO YOU 👑" : move.status}
                            </span>
                          </td>
                          <td className="py-3 text-right">
                            <div className="flex justify-end gap-1">
                              <button
                                onClick={() => handleMovementApproval(move.id, "Denied")}
                                className="bg-red-50 hover:bg-red-100 text-red-700 font-bold px-2 py-1 rounded text-[9px] uppercase"
                              >
                                Deny
                              </button>
                              <button
                                onClick={() => handleMovementApproval(move.id, "Approved")}
                                className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold px-2 py-1 rounded text-[9px] uppercase"
                              >
                                Approve
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Tab 4: REPORTS CENTER (Analytics, Date Filters, Export/Print, Email Send) */}
          {adminTab === "reports" && (
            <div className="bg-white border border-slate-200 rounded-lg p-5 space-y-6 shadow-sm font-sans">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-4">
                <div>
                  <h3 className="text-base font-bold text-slate-950 flex items-center gap-2">
                    <span className="text-indigo-650 font-bold">📊</span> Corporate Attendance Reports Engine
                  </h3>
                  <p className="text-xs text-slate-500">Configure date ranges, departments, and search parameters to generate exportable, printable audit logs.</p>
                </div>
              </div>

              {/* Filtering Controls Row */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">From Date</label>
                  <input
                    type="date"
                    value={reportStartDate}
                    onChange={(e) => setReportStartDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded p-2 text-slate-800 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">To Date</label>
                  <input
                    type="date"
                    value={reportEndDate}
                    onChange={(e) => setReportEndDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded p-2 text-slate-800 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Department</label>
                  <select
                    value={reportDeptFilter}
                    onChange={(e) => setReportDeptFilter(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded p-2 text-slate-850 focus:outline-none"
                  >
                    <option value="All">All Departments</option>
                    {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Employee Search</label>
                  <input
                    type="text"
                    placeholder="Search Code or Name..."
                    value={reportSearchFilter}
                    onChange={(e) => setReportSearchFilter(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded p-2 text-slate-800 focus:outline-none"
                  />
                </div>
              </div>

              {/* Action Buttons Row */}
              <div className="flex flex-col lg:flex-row gap-3 pt-4 border-t border-slate-100 justify-between items-stretch lg:items-center">
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={handleExportCSV}
                    className={`bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded text-xs uppercase tracking-wider transition shadow-sm cursor-pointer`}
                  >
                    📥 Export CSV/Excel
                  </button>
                  <button
                    onClick={handlePrintReport}
                    className="bg-slate-800 hover:bg-slate-900 text-white font-bold py-2 px-4 rounded text-xs uppercase tracking-wider transition shadow-sm cursor-pointer"
                  >
                    🖨️ Print Attendance Ledger
                  </button>
                </div>

                {/* Email dispatch nested form */}
                <div className="flex items-center gap-2 border-l border-transparent lg:border-slate-200 lg:pl-3 w-full lg:w-auto">
                  <div className="relative flex-1 lg:w-64">
                    <input
                      type="email"
                      placeholder="manager@wyndham.com or HOD email"
                      value={reportEmail}
                      onChange={(e) => setReportEmail(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded px-2.5 py-1.5 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none"
                    />
                  </div>
                  <button
                    onClick={handleEmailReport}
                    disabled={isSendingReportEmail}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-1.5 px-3 rounded text-xs uppercase tracking-wider transition cursor-pointer disabled:opacity-40"
                  >
                    {isSendingReportEmail ? "Sending..." : "📧 Email Report"}
                  </button>
                </div>
              </div>

              {reportEmailSuccess && (
                <div className="bg-emerald-50 border border-emerald-250 text-emerald-800 text-xs p-3 rounded-lg animate-fade-in font-medium">
                  {reportEmailSuccess}
                </div>
              )}

              {/* Table Ledger View */}
              <div id="report-printable-area" className="border border-slate-200 rounded-lg overflow-hidden bg-slate-50/20">
                {getFilteredReportLogs().length === 0 ? (
                  <p className="text-xs text-slate-400 italic py-12 text-center">No attendance transactions detected inside selected query boundaries.</p>
                ) : (
                  <div className="overflow-x-auto text-[11px]">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold text-left uppercase tracking-wider text-[10px]">
                          <th className="py-3 px-4">Emp Code</th>
                          <th className="py-3 px-4">FullName</th>
                          <th className="py-3 px-4">Department</th>
                          <th className="py-3 px-4">Date</th>
                          <th className="py-3 px-4">Sign-In</th>
                          <th className="py-3 px-4">Sign-Out</th>
                          <th className="py-3 px-4 text-indigo-700">Total Hours</th>
                          <th className="py-3 px-4">Approver</th>
                        </tr>
                      </thead>
                      <tbody>
                        {getFilteredReportLogs().map(log => {
                          const duration = calculateTotalHours(log.signInTime, log.signOutTime);
                          return (
                            <tr key={log.id} className="border-b border-slate-200 bg-white hover:bg-slate-50 transition">
                              <td className="py-2.5 px-4 font-mono font-bold text-slate-800">{log.employeeCode}</td>
                              <td className="py-2.5 px-4">
                                <span className="font-bold text-slate-900 block">{log.userName}</span>
                                {renderFormattedNotes(log.signInNotes, true)}
                                {renderFormattedNotes(log.signOutNotes, false)}
                              </td>
                              <td className="py-2.5 px-4 text-slate-600">{log.department}</td>
                              <td className="py-2.5 px-4 font-mono text-slate-600">{log.date}</td>
                              <td className="py-2.5 px-4 font-mono text-slate-600 text-[10px]">{log.signInTime || "-"}</td>
                              <td className="py-2.5 px-4 font-mono text-slate-600 text-[10px]">
                                {log.signOutTime || <span className="text-emerald-600 font-semibold uppercase tracking-wide text-[9px] bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">Active</span>}
                              </td>
                              <td className="py-2.5 px-4 font-mono font-bold text-indigo-700">{duration}</td>
                              <td className="py-2.5 px-4">
                                {log.actionedBy ? (
                                  <span className="bg-emerald-50 border border-emerald-150 text-emerald-800 font-extrabold px-1.5 py-0.5 rounded text-[9.5px]">
                                    {log.actionedBy}
                                  </span>
                                ) : (
                                  <span className="text-slate-400 italic">None</span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}



        </div>
      )}

      {/* ================= SIMPLIFIED MODALS FOR EMPLOYEES CRUD (Super Admin View) ================= */}
      
      {/* ================= COMPREHENSIVE PWA UNIVERSAL DOWNLOAD & INSTALLATION GUIDE OVERLAY ================= */}
      {showInstallGuideModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-55 animate-fade-in text-slate-800">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-3xl max-w-lg w-full p-6 space-y-5 relative overflow-hidden">
            
            {/* Top decorative branding header */}
            <div className="absolute top-0 inset-x-0 h-2 bg-gradient-to-r from-sky-500 via-emerald-500 to-amber-500" />
            
            <div className="flex justify-between items-start border-b border-slate-100 pb-3 mt-1">
              <div className="space-y-1">
                <h3 className="font-sans font-black text-slate-900 text-sm md:text-base uppercase tracking-wider flex items-center gap-2">
                  📥 Direct Download & Instant Setup
                </h3>
                <p className="text-[11px] text-slate-505 leading-normal">
                  Install this companion app directly to your device launcher. Compatible with all systems natively!
                </p>
              </div>
              <button 
                onClick={() => setShowInstallGuideModal(false)} 
                className="text-slate-400 hover:text-slate-705 p-1 rounded-full hover:bg-slate-50 transition cursor-pointer"
                title="Dismiss Guide"
              >
                <X size={20} />
              </button>
            </div>

            <div className="bg-slate-50 border border-slate-150 rounded-xl p-4 text-[12px] leading-relaxed text-slate-700 space-y-4 font-sans">
              
              <div className="space-y-4">
                
                {/* 1. iOS Guide */}
                <div className="border-b border-slate-200 pb-3">
                  <h4 className="font-extrabold text-[#1d4ed8] text-[12.5px] uppercase tracking-wide flex items-center gap-2">
                    📱 Apple iOS Devices (iPhone/iPad)
                  </h4>
                  <ol className="list-decimal pl-5 mt-1.5 space-y-1 text-slate-600 text-[11.5px]">
                    <li>Open this portal page inside your native <span className="font-bold">Safari Browser</span>.</li>
                    <li>Tap the standard blue <span className="font-bold">Share (Square with Arrow)</span> icon at the screen bottom.</li>
                    <li>Scroll down and choose <span className="text-[#137333] font-extrabold">"Add to Home Screen"</span>.</li>
                    <li>Tap <span className="font-bold">Add</span> at the upper right corner to install instantly on your iPhone desktop!</li>
                  </ol>
                </div>

                {/* 2. Android Guide */}
                <div className="border-b border-slate-200 pb-3">
                  <h4 className="font-extrabold text-[#11b981] text-[12.5px] uppercase tracking-wide flex items-center gap-2">
                    🤖 Android Devices (Samsung, Xiaomi, Pixel)
                  </h4>
                  <ol className="list-decimal pl-5 mt-1.5 space-y-1 text-slate-600 text-[11.5px]">
                    <li>Open the site inside the google <span className="font-bold">Chrome Browser</span>.</li>
                    <li>Tap the browser context menu <span className="font-bold">(three vertical dots icon)</span> in the top-right corner.</li>
                    <li>Choose <span className="text-sky-700 font-extrabold">"Install App"</span> or <span className="text-sky-700 font-extrabold">"Add to Home screen"</span>.</li>
                    <li>Confirm the notification dialog. The launcher icon will download directly to your mobile desktop application list!</li>
                  </ol>
                </div>

                {/* 3. Windows & MacOS Guide */}
                <div>
                  <h4 className="font-extrabold text-[#c5a02d] text-[12.5px] uppercase tracking-wide flex items-center gap-2">
                    💻 Windows PCs, Macbooks, & Chrome OS
                  </h4>
                  <ol className="list-decimal pl-5 mt-1.5 space-y-1 text-slate-600 text-[11.5px]">
                    <li>Open the URL in any modern browser (Chrome, Microsoft Edge, Brave, Opera).</li>
                    <li>In the address toolbar at the top right, look for a small <span className="font-bold">Monitor Screen with Arrow</span> icon (or prompt bubble).</li>
                    <li>Click that icon to select the <span className="text-emerald-705 font-bold">"Install Portal"</span> option.</li>
                    <li>The system will deploy the executable right into your Start menu / Applications folder for seamless desktop usage!</li>
                  </ol>
                </div>

              </div>

            </div>

            <div className="flex justify-end gap-2 text-xs pt-1">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(window.location.href);
                  alert("📋 Portal Link successfully copied! Paste and send this to your employees to install right away.");
                }}
                className="bg-slate-100 hover:bg-slate-200 text-slate-705 px-4 py-2.5 rounded-lg font-bold transition flex items-center gap-1.5 cursor-pointer border border-slate-350"
              >
                📋 Copy Link to Send to Staff
              </button>
              <button
                onClick={() => setShowInstallGuideModal(false)}
                className="bg-sky-600 hover:bg-sky-700 text-white px-4 py-2.5 rounded-lg font-bold transition cursor-pointer"
              >
                Got It, Thanks!
              </button>
            </div>

          </div>
        </div>
      )}

      {/* 2. Modal to REGISTER employee */}
      {showAddUserModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white border border-slate-200 rounded-md shadow-2xl max-w-md w-full p-6 space-y-4">
            
            <div className="border-b border-slate-100 pb-2 flex justify-between items-center">
              <h3 className="font-bold text-sm uppercase text-slate-900 tracking-wider">Register Employee Profile</h3>
              <button onClick={() => setShowAddUserModal(false)} className="text-slate-400 hover:text-slate-650">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateEmployee} className="space-y-3.5 text-xs">
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">First Name</label>
                  <input
                    type="text"
                    required
                    value={newUserForm.firstName}
                    onChange={(e) => setNewUserForm({ ...newUserForm, firstName: e.target.value })}
                    placeholder="Sera"
                    className="w-full bg-slate-50 border border-slate-300 rounded p-2 text-slate-900 focus:outline-none focus:ring-1 focus:ring-sky-500"
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Last Name</label>
                  <input
                    type="text"
                    required
                    value={newUserForm.lastName}
                    onChange={(e) => setNewUserForm({ ...newUserForm, lastName: e.target.value })}
                    placeholder="Seniloli"
                    className="w-full bg-slate-50 border border-slate-300 rounded p-2 text-slate-900 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Date of Birth</label>
                  <input
                    type="date"
                    required
                    value={newUserForm.dateOfBirth}
                    onChange={(e) => setNewUserForm({ ...newUserForm, dateOfBirth: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded p-2 text-slate-900 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Staff ID (Employee Code)</label>
                  <input
                    type="text"
                    required
                    value={newUserForm.employeeCode}
                    onChange={(e) => setNewUserForm({ ...newUserForm, employeeCode: e.target.value })}
                    placeholder="CML-1025"
                    className="w-full bg-slate-50 border border-slate-300 rounded p-2 text-slate-900 font-mono font-bold uppercase focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Primary Email</label>
                  <input
                    type="email"
                    required
                    value={newUserForm.email}
                    onChange={(e) => setNewUserForm({ ...newUserForm, email: e.target.value })}
                    placeholder="sera.seniloli@cml.com.fj"
                    className="w-full bg-slate-50 border border-slate-300 rounded p-2 text-slate-900 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Phone Number(s)</label>
                  <input
                    type="text"
                    value={newUserForm.phone}
                    onChange={(e) => setNewUserForm({ ...newUserForm, phone: e.target.value })}
                    placeholder="9981242"
                    className="w-full bg-slate-50 border border-slate-300 rounded p-2 text-slate-900 font-mono focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Organizational Department</label>
                  <select
                    value={newUserForm.department}
                    onChange={(e) => handleDepartmentChange(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded p-2 text-slate-800"
                  >
                    {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Assigned Manager (HOD)</label>
                  <input
                    type="text"
                    required
                    value={newUserForm.managerName}
                    list="hod-managers-list"
                    onChange={(e) => setNewUserForm({ ...newUserForm, managerName: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded p-2 text-slate-900 font-semibold focus:outline-none focus:ring-1 focus:ring-sky-500"
                  />
                  <span className="text-[9px] text-sky-600 block mt-1">Super Admin can customize or override the default HOD.</span>
                </div>
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Account Role Level</label>
                <select
                  value={newUserForm.role}
                  onChange={(e) => setNewUserForm({ ...newUserForm, role: e.target.value as any })}
                  className="w-full bg-slate-50 border border-slate-300 rounded p-2 text-slate-800"
                >
                  <option value="Staff">Staff member</option>
                  <option value="Manager">Department Manager / HOD</option>
                  <option value="Super Admin">Super Admin</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Team Coordination Status</label>
                <select
                  value={newUserForm.status}
                  onChange={(e) => setNewUserForm({ ...newUserForm, status: e.target.value as any })}
                  className="w-full bg-slate-50 border border-slate-300 rounded p-2 text-slate-805 text-slate-800"
                >
                  <option value="Off-Shift">Off-Shift</option>
                  <option value="Available">Available</option>
                  <option value="On-Duty">On-Duty</option>
                </select>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setShowAddUserModal(false)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-sky-600 hover:bg-sky-700 text-white px-4 py-2 rounded font-bold shadow-sm"
                >
                  Save Registration
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* 2. Modal to EDIT Employee profile */}
      {editingUser && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white border border-slate-200 rounded-md shadow-2xl max-w-md w-full p-6 space-y-4">
            
            <div className="border-b border-slate-100 pb-2 flex justify-between items-center">
              <h3 className="font-bold text-sm uppercase text-slate-900 tracking-wider">Modify Employee Profile</h3>
              <button onClick={() => setEditingUser(null)} className="text-slate-400 hover:text-slate-650">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveEmployeeEdit} className="space-y-3.5 text-xs">
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">First Name</label>
                  <input
                    type="text"
                    required
                    value={editingUser.firstName}
                    onChange={(e) => setEditingUser({ ...editingUser, firstName: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded p-2 text-slate-900 focus:outline-none focus:ring-1 focus:ring-sky-500"
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Last Name</label>
                  <input
                    type="text"
                    required
                    value={editingUser.lastName}
                    onChange={(e) => setEditingUser({ ...editingUser, lastName: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded p-2 text-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Date of Birth</label>
                  <input
                    type="date"
                    required
                    value={editingUser.dateOfBirth}
                    onChange={(e) => setEditingUser({ ...editingUser, dateOfBirth: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded p-2 text-slate-900 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Employee Code</label>
                  <input
                    type="text"
                    required
                    value={editingUser.employeeCode}
                    onChange={(e) => setEditingUser({ ...editingUser, employeeCode: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded p-2 text-slate-900 font-mono font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Email</label>
                  <input
                    type="email"
                    required
                    value={editingUser.email}
                    onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded p-2 text-slate-900 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Phone</label>
                  <input
                    type="text"
                    value={editingUser.phone}
                    onChange={(e) => setEditingUser({ ...editingUser, phone: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded p-2 text-slate-900 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Department</label>
                  <select
                    value={editingUser.department}
                    onChange={(e) => handleDepartmentChange(e.target.value, true)}
                    className="w-full bg-slate-50 border border-slate-300 rounded p-2 text-slate-800"
                  >
                    {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">HOD Manager Name</label>
                  <input
                    type="text"
                    required
                    value={editingUser.managerName}
                    list="hod-managers-list"
                    onChange={(e) => setEditingUser({ ...editingUser, managerName: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded p-2 text-slate-900 font-semibold focus:outline-none focus:ring-1 focus:ring-sky-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-400 text-slate-500 mb-1">Role Level</label>
                <select
                  value={editingUser.role}
                  onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value as any })}
                  className="w-full bg-slate-50 border border-slate-300 rounded p-2 text-slate-800"
                >
                  <option value="Staff">Staff</option>
                  <option value="Manager">Manager</option>
                  <option value="Super Admin">Super Admin</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Team Coordination Status</label>
                <select
                  value={editingUser.status || "Off-Shift"}
                  onChange={(e) => setEditingUser({ ...editingUser, status: e.target.value as any })}
                  className="w-full bg-slate-50 border border-slate-300 rounded p-2 text-slate-800"
                >
                  <option value="Off-Shift">Off-Shift</option>
                  <option value="Available">Available</option>
                  <option value="On-Duty">On-Duty</option>
                </select>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-sky-600 hover:bg-sky-700 text-white px-4 py-2 rounded font-bold"
                >
                  Save Modifications
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* Real-time Push Notifications overlay (Mobile/Web popup) */}
      <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[99999] space-y-3 pointer-events-none w-full max-w-lg px-4">
        <AnimatePresence>
          {activeNotifications.map(notif => {
            const isBypassAlert = notif.message.includes("Outside") || notif.title.includes("Breach") || notif.title.includes("Geofence");
            const sideColor = isBypassAlert ? "bg-amber-500" : "bg-emerald-500";
            const borderColor = isBypassAlert ? "border-amber-500/80 shadow-amber-500/25" : "border-emerald-500/80 shadow-emerald-500/25";
            const badgeColor = isBypassAlert ? "text-amber-400 bg-amber-950/40" : "text-emerald-400 bg-emerald-950/40";
            return (
              <motion.div
                key={notif.id}
                initial={{ opacity: 0, y: -80, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9, y: -30 }}
                transition={{ type: "spring", stiffness: 380, damping: 22 }}
                className={cn(
                  "bg-slate-955 border-2 text-white rounded-2xl shadow-2xl p-4.5 pointer-events-auto flex gap-3 relative overflow-hidden backdrop-blur-md",
                  borderColor
                )}
              >
                <div className={cn("absolute top-0 left-0 bottom-0 w-2", sideColor)}></div>
                <div className="flex-1 pl-2">
                  <div className="flex justify-between items-center gap-2">
                    <span className={cn("text-[10px] uppercase font-mono tracking-widest font-extrabold px-2 py-0.5 rounded border border-white/5", badgeColor)}>
                      {notif.title}
                    </span>
                    <span className="text-[9px] text-slate-400 font-mono">{notif.date}</span>
                  </div>
                  <p className="text-xs font-bold mt-2 text-slate-50 leading-relaxed font-sans">{notif.message}</p>
                  <div className="flex items-center gap-1.5 mt-2.5">
                    <span className="relative flex h-2 w-2">
                      <span className={cn("animate-ping absolute inline-flex h-full w-full rounded-full opacity-75", sideColor)}></span>
                      <span className={cn("relative inline-flex rounded-full h-2 w-2", sideColor)}></span>
                    </span>
                    <span className="text-[10px] text-slate-350 font-bold tracking-tight">
                      Ramada Corporate Live Broadcast Gateway Active
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setActiveNotifications(prev => prev.filter(n => n.id !== notif.id))}
                  className="text-slate-400 hover:text-white hover:bg-white/10 p-1 rounded-lg transition self-start cursor-pointer"
                >
                  <X size={15} />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      <datalist id="hod-managers-list">
        <option value="Sera Seniloli" />
        <option value="Miriama Waqabaca" />
        <option value="Rohit Lal" />
        <option value="Apenisa Vunibola" />
        <option value="Kavitesh Sharma" />
        <option value="Mereoni Ledua" />
        <option value="Salesh Prasad" />
        <option value="Charles Cebujano" />
        <option value="Jonetani Rokotuibau" />
        <option value="Charles Cebujano (Super Admin)" />
      </datalist>

    </div>
  );
};
