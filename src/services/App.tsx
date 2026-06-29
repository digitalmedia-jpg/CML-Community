import { ConfirmModal } from "./components/ConfirmModal";
import React, { useState, useEffect, useRef } from "react"; 
import { 
  LayoutDashboard, 
  Users, 
  GraduationCap, 
  ShieldCheck, 
  HelpCircle,
  Shield,
  Settings, 
  FileText, 
  Bell, 
  ChevronRight,
  ChevronLeft,
  ArrowLeft,
  ExternalLink,
  FolderArchive,
  Layers,
  Globe,
  TrendingUp,
  DollarSign,
  Percent,
  LogOut,
  Menu,
  X,
  Search,
  Mail,
  Home,
  Gift,
  Award,
  Hotel,
  RefreshCw,
  Wrench,
  ChevronDown,
  Printer,
  Download,
  History,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  MessageSquare,
  Key,
  Lock,
  CreditCard,
  ScanLine,
  Smartphone,
  CheckCircle,
  Waves,
  Wind,
  Send,
  History as HistoryIcon,
  LifeBuoy,
  ArrowRight,
  UserCog,
  Briefcase,
  Clock,
  Package,
  Camera,
  Check,
  ClipboardList,
  Play,
  Plus,
  Utensils,
  Sparkles,
  BookOpen,
  Trash2,
  List,
  LayoutGrid,
  Newspaper,
  Calendar,
  ClipboardCheck,
  Egg
} from "lucide-react";
import { notificationService, NotificationType } from './services/notificationService';
import { db, auth } from "./services/firebase";
import { collection, query, onSnapshot, orderBy, doc, updateDoc, addDoc, serverTimestamp, getDocs } from "firebase/firestore";
import { AdminDashboard } from "./components/AdminDashboard";
import { CanaryPortal } from "./components/CanaryPortal";
import { BreakfastMonitor } from './components/BreakfastMonitor';

function cn(...classes: any[]) {
  return classes.filter(Boolean).join(" ");
}

export default function App() {
  const [activeProperty, setActiveProperty] = useState("cml");
  const [activeTab, setActiveTab] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
    "guest-exp": true,
    "hr-compliance": false,
    "operations": false
  });

  // Database States
  const [complaints, setComplaints] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showNotificationCenter, setShowNotificationCenter] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);

  // Real-time listener for complaints
  useEffect(() => {
    const q = query(collection(db, "complaints"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list: any[] = [];
      snapshot.forEach((doc) => {
        list.push({ id: doc.id, ...doc.data() });
      });
      setComplaints(list);
      setLoading(false);
    }, (error) => {
      console.error("Firestore loading error:", error);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handlePropertySwitch = (propertyId: string, tabId: string) => {
    setActiveProperty(propertyId);
    setActiveTab(tabId);
  };

  const toggleGroup = (groupId: string) => {
    setExpandedGroups(prev => ({ ...prev, [groupId]: !prev[groupId] }));
  };

  // 🛠️ LEFT SIDEBAR PANEL DATA MAP (Admin & Clock In/Out successfully deactivated here)
  const menuGroups = [
    {
      id: "guest-exp",
      title: "Guest Experience",
      icon: Hotel,
      items: [
        { id: "dashboard", name: "Dashboard Overview", icon: LayoutGrid },
        { id: "canary-ramada", name: "Ramada Guest Portal", icon: Globe },
        { id: "canary-wyndham", name: "Wyndham Guest Portal", icon: Globe },
        { id: "breakfast-monitor", name: "Breakfast Monitor", icon: Utensils }, // Added Breakfast tracking element directly 🍳
        { id: "lost-found", name: "Lost & Found Log", icon: Package },
        { id: "vip-amenities", name: "VIP Amenity Tracker", icon: Gift }
      ]
    },
    {
      id: "operations",
      title: "Hotel Operations",
      icon: Wrench,
      items: [
        { id: "maintenance", name: "Engineering Work Orders", icon: Wrench },
        { id: "hk-rooms", name: "Housekeeping & Room Status", icon: Layers },
        { id: "incident-reports", name: "Duty Manager Incidents", icon: AlertTriangle }
      ]
    },
    {
      id: "hr-compliance",
      title: "HR & Compliance",
      icon: ShieldCheck,
      items: [
        { id: "training-academy", name: "CML Training Academy", icon: GraduationCap },
        { id: "sop-library", name: "Standard Operating Procedures", icon: BookOpen },
        { id: "whs-audits", name: "WHS Safety Checklists", icon: ClipboardCheck }
      ]
    }
  ];

  // Dynamic Content Render Engine
  const renderContent = () => {
    if (activeTab === "breakfast-monitor") {
      return <BreakfastMonitor />;
    }
    if (activeTab === "canary-ramada") {
      return <CanaryPortal companyId="ramada" />;
    }
    if (activeTab === "canary-wyndham") {
      return <CanaryPortal companyId="wyndham" />;
    }
    
    // Default fallback placeholder text for secondary operational views
    return (
      <div className="p-8 bg-white border border-slate-100 shadow-sm min-h-[400px] flex flex-col items-center justify-center text-center">
        <div className="w-12 h-12 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-400 mb-4">
          <Layers size={20} />
        </div>
        <h3 className="text-lg font-serif italic text-slate-900 capitalize">{activeTab.replace("-", " ")} Workspace</h3>
        <p className="text-xs text-slate-400 max-w-sm mt-1 leading-relaxed">
          Operational framework module loaded. Use the left navigation index structure map parameters to return to live dashboards.
        </p>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#FDFCF7] text-slate-900 flex font-sans antialiased selection:bg-gold/20 selection:text-slate-900">
      
      {/* Dynamic Left Sidebar Element */}
      <aside className={cn(
        "bg-[#1A1112] text-white flex flex-col transition-all duration-300 z-30 shrink-0 border-r border-white/5 shadow-2xl",
        sidebarOpen ? "w-64" : "w-0 md:w-20 overflow-hidden"
      )}>
        {/* Core Sidebar Branding Section */}
        <div className="p-6 border-b border-white/5 flex items-center justify-between bg-black/20">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 border border-gold flex items-center justify-center text-gold font-serif italic text-base bg-gold/5">C</div>
            {sidebarOpen && (
              <div>
                <h1 className="text-xs font-display tracking-[0.2em] font-black uppercase text-white">COVE MGMT</h1>
                <p className="text-[7px] font-mono tracking-widest text-[#C5A02D] uppercase mt-0.5">Syndicate Hub</p>
              </div>
            )}
          </div>
        </div>

        {/* Dynamic Sidebar Links Navigation Render Map */}
        <nav className="flex-1 py-6 px-4 space-y-6 overflow-y-auto custom-scrollbar">
          {menuGroups.map((group) => (
            <div key={group.id} className="space-y-1">
              {sidebarOpen && (
                <button 
                  onClick={() => toggleGroup(group.id)}
                  className="w-full px-3 py-1.5 flex items-center justify-between text-[9px] font-display uppercase tracking-widest text-slate-500 font-extrabold hover:text-white transition-colors"
                >
                  <span className="flex items-center gap-2">
                    <group.icon size={11} className="text-[#C5A02D]" />
                    {group.title}
                  </span>
                  <ChevronDown size={10} className={cn("transition-transform duration-200", expandedGroups[group.id] && "rotate-180")} />
                </button>
              )}
              
              {(!sidebarOpen || expandedGroups[group.id]) && (
                <div className="space-y-0.5">
                  {group.items.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeTab === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => setActiveTab(item.id)}
                        className={cn(
                          "w-full flex items-center gap-3 px-3 py-2 text-xs font-medium transition-all duration-150 rounded-sm group relative",
                          isActive 
                            ? "bg-[#C5A02D] text-black font-semibold shadow-md" 
                            : "text-slate-400 hover:bg-white/5 hover:text-white"
                        )}
                      >
                        <Icon size={14} className={isActive ? "text-black" : "text-[#C5A02D] group-hover:scale-105 transition-transform"} />
                        {sidebarOpen && <span>{item.name}</span>}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </nav>

        {/* Bottom Workspace Action Context Sign-Out */}
        <div className="p-4 border-t border-white/5 bg-black/10">
          <button className="w-full flex items-center gap-3 px-3 py-2 text-xs font-medium text-slate-500 hover:text-rose-400 rounded-sm transition-colors cursor-pointer">
            <LogOut size={14} />
            {sidebarOpen && <span>Exit Portal Hub</span>}
          </button>
        </div>
      </aside>

      {/* Main Structural Right Work Canvas Wrapper Layout */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        
        {/* Upper Operations Task Header Bar */}
        <header className="bg-white/80 backdrop-blur-md border-b border-slate-100 h-16 flex items-center justify-between px-8 z-20 sticky top-0 shadow-sm">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-50 transition-all rounded-sm cursor-pointer"
            >
              {sidebarOpen ? <ChevronLeft size={16} /> : <Menu size={16} />}
            </button>
            <div className="hidden md:flex items-center gap-1.5 text-[10px] font-mono text-slate-400 uppercase tracking-widest">
              <span>Assets</span>
              <ChevronRight size={10} />
              <span className="text-slate-900 font-bold">{activeProperty.toUpperCase()} Portfolio Matrix</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Live Operational Status Indicator */}
            <div className="flex items-center gap-2 px-3 py-1 bg-emerald-50 border border-emerald-100 rounded-none shadow-sm">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
              <span className="text-[9px] font-mono font-bold text-emerald-800 uppercase tracking-wider">Cloud Engine Linked</span>
            </div>
          </div>
        </header>

        {/* Central Component Injector Canvas Frame */}
        <main className="flex-1 overflow-y-auto p-8 bg-[#FAFAFA] custom-scrollbar">
          {renderContent()}
        </main>
      </div>
    </div>
  );
}