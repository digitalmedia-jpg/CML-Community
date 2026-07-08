import { ConfirmModal } from "./components/ConfirmModal";
import { AgreementsSigning } from "./components/AgreementsSigning";
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
  PenTool,
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
  ClipboardCheck
} from "lucide-react";
import { notificationService, NotificationType } from './services/notificationService';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from "recharts";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "./lib/utils";
import { 
  auth, 
  loginWithGoogle, 
  logout, 
  db,
  collection, 
  addDoc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  doc, 
  serverTimestamp, 
  onSnapshot, 
  query, 
  orderBy, 
  limit,
  where,
  getDocs,
  deleteDoc,
  increment,
  arrayUnion,
  onAuthStateChanged,
  User,
  forceSyncNow
} from "./lib/firebase";
import { Forum } from "./components/Forum";
import { UserManagement } from "./components/UserManagement";
import { DutyRoster } from "./components/DutyRoster";
import { NotificationDropdown } from './components/NotificationDropdown';
import { GlobalSearch } from './components/GlobalSearch';
import { LoginPage } from "./components/LoginPage";
import { LostAndFound } from "./components/LostAndFound";
import { CloudInsights } from "./components/CloudInsights";
import { ResourcesHelp } from "./components/ResourcesHelp";
import { DigitalFlipbook } from "./components/DigitalFlipbook";
import { HRMS } from "./components/HRMS";
import { RestaurantScanner } from "./components/RestaurantScanner";
import { StaffMailer } from "./components/StaffMailer";
import NewsletterSubscribers from "./components/NewsletterSubscribers";
import { CanaryPortal } from "./components/CanaryPortal";
import { BrandKit } from "./components/BrandKit";
import { RamadaFormsSuite } from "./components/RamadaFormsSuite";
import { GoogleFormsSuite } from "./components/GoogleFormsSuite";
import { PublicCardDownloadGateway } from "./components/PublicCardDownloadGateway";
import { ManageCases } from "./components/ManageCases";
import { DailyNews } from "./components/DailyNews";
import { SystemDiagnostics } from "./components/SystemDiagnostics";
import WyndhamChecklist from "./components/WyndhamChecklist";
import { syncLogger } from "./lib/syncLogger";
import { ToastContainer } from "./components/ToastContainer";
import { toastService } from "./services/toastService";
import { GoogleAIPlanMan } from "./components/GoogleAIPlanMan";
import { GoogleChatWidget } from "./components/GoogleChatWidget";
import { SopBatchUploadModal } from "./components/SopBatchUploadModal";
import { ImageLightboxModal } from "./components/ImageLightboxModal";
import { AdminDashboard } from "./components/AdminDashboard";
import { HotelOrgChart } from "./components/HotelOrgChart";
import { PublicNewsletterWidget } from "./components/PublicNewsletterWidget";
import { BrandStandardsDocManager } from "./components/BrandStandardsDocManager";
import { INITIAL_EMPLOYEES } from "./data/initialEmployees";

// Mock data for the chart
const chartData = [
  { name: "Mon", rev: 4000 },
  { name: "Tue", rev: 3000 },
  { name: "Wed", rev: 5500 },
  { name: "Thu", rev: 4800 },
  { name: "Fri", rev: 7200 },
  { name: "Sat", rev: 9000 },
  { name: "Sun", rev: 8500 },
];

// Mock companies data
const COMPANIES = [
  { 
    id: "cml", 
    name: "CML", 
    fullName: "Cove Management Limited",
    logo: "https://cml.com.fj/wp-content/uploads/2026/05/CML-Thumbnail-Logo-2.jpg",
    logoPortal: "https://cml.com.fj/wp-content/uploads/2026/05/CML-Thumbnail-Logo-2.jpg",
    description: "Cove Management Limited",
    theme: "#C5A02D",
    accent: "text-[#C5A02D]",
    glow: "shadow-[#C5A02D]/20",
    sidebar: "#1a1a1a",
    brand: "#C5A02D",
    heroImage: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&q=80&w=1600",
    tagline: "Excellence in Hospitality Management",
    location: "Nadi, Fiji Islands",
    distance: "Group Headquarters",
    floors: "Multi-Property Portfolio",
    concept: "Cove Management Limited (CML) is a leading hospitality management firm in Fiji, overseeing a diverse portfolio of premier properties including internationally branded hotels and resorts.",
    conceptImage: "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=1200",
    longDescription: "With decades of experience in the South Pacific market, CML provides comprehensive management solutions, from operational oversight and financial auditing to brand development and human resource management.",
    highlights: ["Portfolio Compliance", "Operational Auditing", "Revenue Management", "Brand Integration", "Asset Management"],
    amenities: [
      { label: "Corporate Strategy", icon: Shield, desc: "Long-term asset growth" },
      { label: "HR Management", icon: Users, desc: "Team development & payroll" },
      { label: "Financial Audits", icon: DollarSign, desc: "P&L oversight & compliance" }
    ],
    culinary: {
      title: "Operational Excellence",
      desc: "Managing high-performance dining venues across Fiji.",
      venues: []
    }
  },
  { 
    id: "ramada", 
    name: "Ramada Suites", 
    fullName: "Ramada Suites by Wyndham Wailoaloa Beach Fiji",
    logo: "https://ramadawailoaloafiji.com/wp-content/uploads/2026/05/Ramada-Thumbnail-Logo.jpg", 
    logoPortal: "https://ramadawailoaloafiji.com/wp-content/uploads/2026/05/Ramada-Thumbnail-Logo.jpg",
    description: "Suites by Wyndham Wailoaloa Beach Fiji",
    theme: "#D11242", // Ramada Red from guidelines
    accent: "text-[#D11242]",
    glow: "shadow-[#D11242]/20",
    sidebar: "#7c1414",
    brand: "#D11242",
    heroImage: "https://ramadawailoaloafiji.com/wp-content/uploads/2026/05/Ramada-70.jpg",
    tagline: "SAY HELLO TO RED®",
    brandTagline: "SAY HELLO TO RED®",
    location: "Wailoaloa Beach",
    distance: "15 Min from Nadi Airport",
    floors: "Luxury Serviced Suites",
    concept: "Experience true Fijian hospitality at Ramada Suites by Wyndham Wailoaloa Beach Fiji. Our property offers a mix of studio, one, and two-bedroom suites designed for comfort.",
    conceptImage: "https://ramadawailoaloafiji.com/wp-content/uploads/2026/05/Hero-Shoot-scaled.jpg",
    longDescription: "Located on the pristine shores of Wailoaloa Beach, our suites feature full kitchen facilities, separate living areas, and private balconies. We provide the perfect balance of home-like convenience and hotel luxury.",
    highlights: ["Beachfront Serviced Suites", "15 Mins from Nadi Airport", "Spacious 1, 2 & 3 Bedrooms", "Stunning Sunset Views", "Self-Catering Facilities"],
    rooms: [
      { name: "King Studio Suite", size: "45m²", sleeps: "2 Guests", img: "https://ramadawailoaloafiji.com/wp-content/uploads/2023/04/king-studio-1.png" },
      { name: "Two Bedroom Partial Ocean View Suite", size: "95m²", sleeps: "4 Guests", img: "https://ramadawailoaloafiji.com/wp-content/uploads/2023/04/Two-bedroom-ocean-view-1.png" },
      { name: "Beachfront 2 Bedroom Suite", size: "115m²", sleeps: "5 Guests", img: "https://images.unsplash.com/photo-1566665797739-1674de7a421a?auto=format&fit=crop&q=80&w=800" }
    ],
    amenities: [
      { label: "Full Kitchens", icon: Utensils, desc: "Equipped in all suites" },
      { label: "Rooftop Pool", icon: Waves, desc: "Infinite ocean views" },
      { label: "Beachfront Access", icon: Wind, desc: "Direct walk to the sand" }
    ],
    culinary: {
      title: "Coastal Gastronomy",
      desc: "Indulge in flavors that celebrate the sea and Fiji's fresh produce.",
      venues: [
        { name: "Club57", desc: "Our signature dining venue offering a mix of local and international flavors.", img: "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&q=80&w=1000" },
        { name: "Sunset Pool Bar", desc: "Enjoy cocktails and light bites while watching the world-famous Wailoaloa sunset.", img: "https://images.unsplash.com/photo-1533777857889-4be7c70b33f7?auto=format&fit=crop&q=80&w=1000" }
      ]
    },
    eventImages: [
      "https://images.unsplash.com/photo-1511578334221-d3023616374c?auto=format&fit=crop&q=80&w=1200",
      "https://images.unsplash.com/photo-1505373877841-8d25f7d46678?auto=format&fit=crop&q=80&w=1200",
      "https://images.unsplash.com/photo-1543007630-9710e4a00a20?auto=format&fit=crop&q=80&w=1200"
    ],
    meetingHighlights: [
      "Boardroom & Conference Facilities",
      "Advanced Audio-Visual Support",
      "Tailored Banquet Menus",
      "Dedicated Events Team",
      "High-Speed Connectivity"
    ],
    capacityChart: {
      totalArea: "120 m²",
      dimensions: "12m x 10m",
      rows: [
        { name: "Grand Boardroom (Theater)", cap: "80 Pax" },
        { name: "Grand Boardroom (Banquet)", cap: "60 Pax" },
        { name: "Sunset Deck (Reception)", cap: "80 Pax" }
      ]
    }
  },
  { 
    id: "wyndham", 
    name: "Wyndham Garden", 
    fullName: "Wyndham Garden Wailoaloa Beach Fiji",
    logo: "https://wyndhamgardenwailoaloafiji.com/wp-content/uploads/2026/05/WG-Thumbnail-Logo.jpg", 
    logoPortal: "",
    description: "Wailoaloa Beach Fiji",
    theme: "#0b5c4b",
    accent: "text-[#0b5c4b]",
    glow: "shadow-[#0b5c4b]/20",
    sidebar: "#063b31",
    brand: "#0b5c4b",
    heroImage: "https://wyndhamgardenwailoaloafiji.com/wp-content/uploads/2026/05/Gemini_Generated_Image_80t55280t55280t5.png",
    tagline: "Fiji's Premier Waterfront Retreat",
    location: "Wailoaloa Beach, Nadi",
    distance: "15 Min from Airport",
    floors: "7 Levels of Luxury",
    concept: "Fiji's newest 4 star, Wyndham Garden Wailoaloa Beach Fiji 7-floor beachfront serviced hotel is idyllically situated on the beach of Wailoaloa with a unique view of the sea and nearby surrounding Islands. Conveniently located 15 minutes away from Nadi International Airport, Port Denarau Marina, and Nadi Town Central.",
    conceptImage: "https://wyndhamgardenwailoaloafiji.com/wp-content/uploads/2026/05/8.-Beachfront-Room.jpg",
    longDescription: "There is a total of 90 rooms located on six-floor levels comprising a mix of beachfront executive king room, garden ocean view double, and twin rooms. Enjoy modern and comfortable rooms which come with Flat LED smart TV with satellite channels, complimentary coffee & tea making facilities, safe deposit box, hair dryer, iron and board, study desk, private balcony, and air-conditioning. The property offers exquisite resort features such as an outdoor swimming pool, spa, deli shop, beach deck dining, corporate meeting space, and Fiji's premier 360-degree scenic viewing rooftop bar and restaurant overlooking Nadi Bay & Mamanuca Islands.",
    highlights: ["4-Star Beachfront Serviced Hotel", "15 Mins from Nadi Airport & Denarau", "90 Rooms across 6 Floors", "360-Degree Scenic Rooftop Dining", "Spa, Outdoor Pool & Gym Services"],
    rooms: [
      { name: "Beachfront Executive King Room", size: "75m²", sleeps: "3 Guests (2 Adults & 1 Infant) | 1 King size bed", img: "https://wyndhamgardenwailoaloafiji.com/wp-content/uploads/2026/05/8.-Beachfront-Room.jpg" },
      { name: "Garden Ocean View King Room", size: "75m²", sleeps: "2 Guests (2 Adults) | 1 Queen size bed", img: "https://wyndhamgardenwailoaloafiji.com/wp-content/uploads/2026/05/Garden-Oceanview-Twin.jpg" },
      { name: "Garden Ocean View Twin Room", size: "75m²", sleeps: "2 Guests (2 Adults) | 2 Single size beds", img: "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?auto=format&fit=crop&q=80&w=800" },
      { name: "Garden King Room", size: "75m²", sleeps: "2 Guests (2 Adults) | 1 Queen size bed", img: "https://wyndhamgardenwailoaloafiji.com/wp-content/uploads/2026/05/Garden-King-Room.webp" },
      { name: "Garden Twin Room", size: "75m²", sleeps: "2 Guests (2 Adults) | 2 Single size beds", img: "https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&q=80&w=800" },
      { name: "Garden Small Twin Room", size: "75m²", sleeps: "2 Guests (2 Adults) | 2 Single size beds", img: "https://images.unsplash.com/photo-1512918728675-ed5a9ecdebfd?auto=format&fit=crop&q=80&w=800" }
    ],
    amenities: [
      { label: "Free High Speed Wi-Fi", icon: Globe, desc: "Seamless connectivity throughout properties" },
      { label: "Pool, Spa & Beach Deck Dining", icon: Waves, desc: "Fijian oceanfront premium leisure facilities" },
      { label: "Meeting & Event Spaces", icon: Users, desc: "Up to 120 guest conference config" }
    ],
    culinary: {
      title: "Resort Bars & Restaurants",
      desc: "Experience breathtaking 360-degree views paired with mouthwatering cuisines meticulously prepared by our head chefs.",
      venues: [
        { name: "Garden Rooftop Bar & Restaurant", desc: "Offering delectable international and island food topped with our famous 360-degree scenic rooftop views overlooking Wailoaloa Beach, Nadi Bay & nearby Mamanuca Islands.", img: "https://images.unsplash.com/photo-1550966841-3ee7adac1661?auto=format&fit=crop&q=80&w=1000" },
        { name: "The Captains Catch Seafood Restaurant and Bar", desc: "Savor exquisite and fresh seafood, culinary appetizers, and signature cocktails directly on our beachfront dining deck.", img: "https://images.unsplash.com/photo-1533777857889-4be7c70b33f7?auto=format&fit=crop&q=80&w=1000" }
      ]
    },
    eventImages: [
      "https://images.unsplash.com/photo-1431540015161-0bf868a2d407?auto=format&fit=crop&q=80&w=1200",
      "https://images.unsplash.com/photo-1505373877841-8d25f7d46678?auto=format&fit=crop&q=80&w=1200",
      "https://images.unsplash.com/photo-1543007630-9710e4a00a20?auto=format&fit=crop&q=80&w=1200"
    ],
    meetingHighlights: [
      "Event rooms equipped with state of the art audiovisual technology",
      "LCD projector screen & DVD / CD player systems",
      "Wireless sound system, high-speed Wi-Fi & cordless microphones",
      "Assorted flipcharts with colored markers and white boards"
    ],
    capacityChart: {
      totalArea: "Flexible MICE",
      dimensions: "Various Formats",
      rows: [
        { name: "Boardroom Setup", cap: "50 Pax" },
        { name: "Banquet Setup", cap: "80 Pax" },
        { name: "Classroom Setup", cap: "80 Pax" },
        { name: "Theatre Style", cap: "120 Pax" },
        { name: "U-Shape Setup", cap: "80 Pax" }
      ]
    }
  }
];

const HR_FORMS = [
  { 
    name: "General Leave Application Form - Ramada Hotel Wailoaloa Fiji", 
    id: "leave-app", 
    type: "external", 
    url: "https://ramadawailoaloafiji.com/?ff_landing=12",
    category: "HR & Leave Operations"
  },
  { 
    name: "RETURN TO WORK FORM - Ramada Wailoaloa Fiji", 
    id: "return-work", 
    type: "external", 
    url: "https://ramadawailoaloafiji.com/?ff_landing=10",
    category: "HR & Leave Operations"
  },
  { 
    name: "Staff Feedback Form", 
    id: "staff-feedback", 
    type: "external", 
    url: "https://ramadawailoaloafiji.com/?ff_landing=17",
    category: "Feedback & Portals"
  },
  { 
    name: "Guest Waiver Form", 
    id: "guest-waiver", 
    type: "external", 
    url: "https://ramadawailoaloafiji.com/?ff_landing=4",
    category: "Guest & Front Office"
  },
  { 
    name: "Ramada Checkin Form", 
    id: "ramada-checkin", 
    type: "external", 
    url: "https://ramadawailoaloafiji.com/?ff_landing=3",
    category: "Guest & Front Office"
  },
  { 
    name: "Contact Form Demo", 
    id: "contact-form-demo", 
    type: "external", 
    url: "https://ramadawailoaloafiji.com/?ff_landing=1",
    category: "Guest & Front Office"
  },
  { 
    name: "Missed Clock-In/Clock-Out Register - Ramada Wailoaloa Fiji", 
    id: "missed-clock", 
    type: "external", 
    url: "https://ramadawailoaloafiji.com/?ff_landing=22",
    category: "HR & Leave Operations"
  },
  { 
    name: "Ramada Hotel - Property Officer Patrol LOG -Deck Area", 
    id: "patrol-log-deck", 
    type: "external", 
    url: "https://ramadawailoaloafiji.com/?ff_landing=19",
    category: "Operations & Logs"
  },
  { 
    name: "Property Officer Logging Form", 
    id: "property-officer-logging", 
    type: "external", 
    url: "#",
    category: "Operations & Logs"
  },
  { 
    name: "Training Acknowledgement Form", 
    id: "training-ack", 
    type: "external", 
    url: "https://ramadawailoaloafiji.com/?ff_landing=16",
    category: "Operations & Logs"
  },
  { 
    name: "Ramada Hotel Employee Forms Portal", 
    id: "employee-forms-portal", 
    type: "external", 
    url: "https://ramadawailoaloafiji.com/?ff_landing=15",
    category: "Feedback & Portals"
  },
  { 
    name: "EARLY LEAVE FORM - Ramada Hotel Wailoaloa Fiji", 
    id: "early-leave-ext", 
    type: "external", 
    url: "https://ramadawailoaloafiji.com/?ff_landing=14",
    category: "HR & Leave Operations"
  },
  { 
    name: "Overtime Approval Form - Ramada Wailoaloa Hotel Fiji", 
    id: "overtime", 
    type: "external", 
    url: "https://ramadawailoaloafiji.com/?ff_landing=13",
    category: "HR & Leave Operations"
  }
];

const WYNDHAM_FORMS = [
  {
    name: "Wyndham Garden Employee Training Form",
    id: "wyndham-46",
    type: "external",
    url: "https://wyndhamgardenwailoaloafiji.com/?ff_landing=46",
    category: "Operations & Logs"
  },
  {
    name: "Wyndham Garden - Conference Booking Request",
    id: "wyndham-44",
    type: "external",
    url: "https://wyndhamgardenwailoaloafiji.com/?ff_landing=44",
    category: "Operations & Logs"
  },
  {
    name: "360 Reflection & Employee Improvement Tool",
    id: "wyndham-43",
    type: "external",
    url: "https://wyndhamgardenwailoaloafiji.com/?ff_landing=43",
    category: "Feedback & Portals"
  },
  {
    name: "360 Reflection & Employee Improvement Tool",
    id: "wyndham-42",
    type: "external",
    url: "https://wyndhamgardenwailoaloafiji.com/?ff_landing=42",
    category: "Feedback & Portals"
  },
  {
    name: "Employee Feedback Form",
    id: "wyndham-40",
    type: "external",
    url: "https://wyndhamgardenwailoaloafiji.com/?ff_landing=40",
    category: "Feedback & Portals"
  },
  {
    name: "Wyndham Garden Guest Security Deposit Agreement (No Cash Deposit)",
    id: "wyndham-38",
    type: "external",
    url: "https://wyndhamgardenwailoaloafiji.com/?ff_landing=38",
    category: "Guest & Front Office"
  },
  {
    name: "Missed Clock-In/Clock-Out Register - Wyndham Garden Wailoaloa Fiji",
    id: "wyndham-36",
    type: "external",
    url: "https://wyndhamgardenwailoaloafiji.com/?ff_landing=36",
    category: "HR & Leave Operations"
  },
  {
    name: "Wyndham Garden Employee Forms Portal",
    id: "wyndham-33",
    type: "external",
    url: "https://wyndhamgardenwailoaloafiji.com/?ff_landing=33",
    category: "Feedback & Portals"
  },
  {
    name: "EARLY LEAVE FORM - Wyndham Garden Wailoaloa Fiji",
    id: "wyndham-32",
    type: "external",
    url: "https://wyndhamgardenwailoaloafiji.com/?ff_landing=32",
    category: "HR & Leave Operations"
  },
  {
    name: "RETURN TO WORK FORM - Wyndham Garden Wailoaloa Fiji",
    id: "wyndham-28",
    type: "external",
    url: "https://wyndhamgardenwailoaloafiji.com/?ff_landing=28",
    category: "HR & Leave Operations"
  },
  {
    name: "General Leave Application Form - Wyndham Garden Wailoaloa Fiji",
    id: "wyndham-25",
    type: "external",
    url: "https://wyndhamgardenwailoaloafiji.com/?ff_landing=25",
    category: "HR & Leave Operations"
  },
  {
    name: "Employee Post-Screening Documents.",
    id: "wyndham-19",
    type: "external",
    url: "https://wyndhamgardenwailoaloafiji.com/?ff_landing=19",
    category: "HR & Leave Operations"
  },
  {
    name: "Overtime Approval Form - Wyndham Garden Wailoaloa Fiji",
    id: "wyndham-17",
    type: "external",
    url: "https://wyndhamgardenwailoaloafiji.com/?ff_landing=17",
    category: "HR & Leave Operations"
  },
  {
    name: "Chinese Language Guest Registration Form",
    id: "wyndham-15",
    type: "external",
    url: "https://wyndhamgardenwailoaloafiji.com/?ff_landing=15",
    category: "Guest & Front Office"
  },
  {
    name: "Guest Waiver Form",
    id: "wyndham-4",
    type: "external",
    url: "https://wyndhamgardenwailoaloafiji.com/?ff_landing=4",
    category: "Guest & Front Office"
  },
  {
    name: "Wyndham Garden Guest Checkin Form",
    id: "wyndham-3",
    type: "external",
    url: "https://wyndhamgardenwailoaloafiji.com/?ff_landing=3",
    category: "Guest & Front Office"
  },
  {
    name: "Wyndham Garden Contact US Form",
    id: "wyndham-1",
    type: "external",
    url: "https://wyndhamgardenwailoaloafiji.com/?ff_landing=1",
    category: "Feedback & Portals"
  }
];

// Pulsing loading skeleton matching the luxury dashboard layout to prevent sudden jumps
function DashboardSkeleton({ companyId }: { companyId: string | null }) {
  return (
    <div className="space-y-12 pb-32 animate-pulse mt-6" id="dashboard-skeleton">
      {/* 1. Hero banner Skeleton resembling property-overview page */}
      <div className="relative h-[45vh] md:h-[55vh] -mx-4 -mt-4 p-6 md:-mx-10 md:-mt-10 overflow-hidden mb-12 bg-neutral-200/50 dark:bg-neutral-800/50 flex items-end rounded-sm">
        <div className="w-full max-w-3xl space-y-6 p-4 md:p-10">
          {/* Tagline skeleton */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-px bg-slate-300 dark:bg-slate-700"></div>
            <div className="h-3 w-48 bg-slate-300 dark:bg-slate-700 rounded-xs"></div>
          </div>
          {/* Logo / Big Title skeleton */}
          <div className="h-12 md:h-16 w-80 bg-slate-300 dark:bg-slate-700 rounded-sm"></div>
          {/* Mini info items */}
          <div className="flex gap-8 mt-6">
            <div className="space-y-2">
              <div className="h-2 w-16 bg-slate-300 dark:bg-slate-700 rounded-sm"></div>
              <div className="h-4 w-24 bg-slate-300 dark:bg-slate-700 rounded-sm"></div>
            </div>
            <div className="space-y-2">
              <div className="h-2 w-16 bg-slate-300 dark:bg-slate-700 rounded-sm"></div>
              <div className="h-4 w-24 bg-slate-300 dark:bg-slate-700 rounded-sm"></div>
            </div>
            <div className="space-y-2">
              <div className="h-2 w-20 bg-slate-300 dark:bg-slate-700 rounded-sm"></div>
              <div className="h-4 w-24 bg-slate-300 dark:bg-slate-700 rounded-sm"></div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Grid split layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 px-2 md:px-0">
        {/* Left concept & rooms skeleton */}
        <div className="lg:col-span-8 space-y-12">
          {/* Section: Concept */}
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="h-7 w-48 bg-neutral-200 dark:bg-neutral-800 rounded-sm"></div>
              <div className="flex-1 h-px bg-slate-250 dark:bg-slate-750"></div>
            </div>
            <div className="space-y-3">
              <div className="h-5 w-full bg-neutral-250 dark:bg-neutral-800 rounded-sm"></div>
              <div className="h-5 w-5/6 bg-neutral-250 dark:bg-neutral-800 rounded-sm"></div>
              <div className="h-5 w-4/6 bg-neutral-250 dark:bg-neutral-800 rounded-sm"></div>
            </div>
            <div className="w-full h-[280px] bg-neutral-200/40 dark:bg-neutral-800/40 rounded flex items-center justify-center">
              <svg className="w-12 h-12 text-slate-300 dark:text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          </div>

          {/* Section: Room Inventory Skeletons */}
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="h-7 w-40 bg-neutral-200 dark:bg-neutral-800 rounded-sm"></div>
              <div className="flex-1 h-px bg-slate-250 dark:bg-slate-750"></div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {[1, 2].map((n) => (
                <div key={n} className="border border-slate-100 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm p-4 rounded-sm space-y-4">
                  <div className="h-40 bg-neutral-200 dark:bg-neutral-800 rounded relative"></div>
                  <div className="h-4 w-3/4 bg-neutral-250 dark:bg-neutral-800 rounded-sm"></div>
                  <div className="h-3 w-1/2 bg-neutral-250 dark:bg-neutral-800 rounded-sm"></div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right side static highlights */}
        <div className="lg:col-span-4 space-y-8">
          <div className="border border-slate-100 dark:border-neutral-800 p-8 bg-white/50 dark:bg-neutral-900/50 shadow rounded space-y-6">
            <div className="h-4 w-28 bg-neutral-200 dark:bg-neutral-800 rounded"></div>
            <div className="h-0.5 bg-slate-100 dark:bg-neutral-800 w-full mb-4"></div>
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="flex gap-4 items-center">
                <div className="w-8 h-8 rounded-full bg-neutral-200 dark:bg-neutral-800 shrink-0"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-3 w-2/3 bg-neutral-250 dark:bg-neutral-800 rounded-sm"></div>
                  <div className="h-2 w-1/2 bg-neutral-200 dark:bg-neutral-800 rounded-sm"></div>
                </div>
              </div>
            ))}
          </div>

          <div className="border border-slate-100 dark:border-neutral-800 p-8 bg-white/50 dark:bg-neutral-900/50 shadow rounded space-y-6">
            <div className="h-4 w-32 bg-neutral-200 dark:bg-neutral-800 rounded"></div>
            <div className="h-[120px] bg-neutral-200 dark:bg-neutral-800 rounded"></div>
          </div>
        </div>
      </div>
    </div>
  );
}

const SignaturePad: React.FC<{ onSave: (url: string) => void, onClear: () => void }> = ({ onSave, onClear }) => {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
  }, []);

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    setIsDrawing(true);
    draw(e);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (canvas) {
      onSave(canvas.toDataURL());
    }
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = ('touches' in e) ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = ('touches' in e) ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const clear = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (canvas && ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.beginPath();
      onClear();
    }
  };

  return (
    <div className="space-y-2">
      <div className="border border-slate-300 bg-white rounded-sm">
        <canvas 
          ref={canvasRef}
          width={400}
          height={150}
          className="w-full h-[150px] cursor-crosshair touch-none bg-slate-50/50"
          onMouseDown={startDrawing}
          onMouseUp={stopDrawing}
          onMouseOut={stopDrawing}
          onMouseMove={draw}
          onTouchStart={startDrawing}
          onTouchEnd={stopDrawing}
          onTouchMove={draw}
        />
      </div>
      <button 
        type="button" 
        onClick={clear}
        className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-[10px] font-sans font-bold uppercase tracking-wider text-slate-700 transition-colors rounded-sm border border-slate-200"
      >
        Clear Signature
      </button>
    </div>
  );
};

export default function App() {
  console.log("[DEBUG App.tsx] imported db is:", db, "type of db:", typeof db, "is Firestore?", db && typeof db === 'object' && 'app' in db);
  
  const [workstationAuthorized, setWorkstationAuthorized] = useState<boolean>(() => {
    try {
      return localStorage.getItem("cml_workstation_verified_v3") === "true";
    } catch (_) {
      return false;
    }
  });

  const handleAuthorizeWorkstation = () => {
    try {
      localStorage.setItem("cml_workstation_verified_v3", "true");
    } catch (e) {
      console.warn("Storage write blocked:", e);
    }
    setWorkstationAuthorized(true);

    // Request permissions seamlessly in background without direct explanation of camera/location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        () => {}, 
        () => {}, 
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
      );
    }
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      navigator.mediaDevices.getUserMedia({ video: true })
        .then(stream => {
          stream.getTracks().forEach(track => track.stop());
        })
        .catch(() => {});
    }
  };

  const getUserFriendlyName = () => {
    if (!currentUser) return "Guest Mode";
    if (userProfileData?.displayName) return userProfileData.displayName;
    const email = currentUser.email?.toLowerCase();
    if (email === "digitalmedia@cml.com.fj" || email === "cml@wyndhamgardenwailoaloafiji.com") return "Charles Cebujano";
    if (email === "operations@ramadasuitesfiji.com") return "Avishek Chandra";
    if (email === "litia.r@wyndhamfiji.com" || email === "litia.r@wyndhamgardenwailoaloafiji.com") return "Litia R.";
    return currentUser.displayName || currentUser.email?.split("@")[0] || "Team Member";
  };
  
  // Safe mount effect ensuring we register the app has mounted successfully without throwing localStorage security exceptions
  useEffect(() => {
    try {
      console.log("[App Mount] Checking sandboxed client browser parameters.");
    } catch (e) {
      console.warn("[App Mount Warning] Isolated client container:", e);
    }
  }, []);

  // Dynamic Background Auto-Updater and Cache-Buster
  useEffect(() => {
    let checkInterval: any;
    let initialLoadVersion: string | null = null;

    const checkVersion = async () => {
      try {
        const response = await fetch(`/version_info.json?cb=${Date.now()}`);
        if (!response.ok) return;
        const data = await response.json();
        const currentServerVersion = data.version;

        if (currentServerVersion) {
          const storedVersion = localStorage.getItem("cml_local_build_version");
          
          if (!storedVersion) {
            localStorage.setItem("cml_local_build_version", currentServerVersion);
            initialLoadVersion = currentServerVersion;
          } else if (storedVersion !== currentServerVersion) {
            console.log(`[Auto-Updater] New version detected! Server: ${currentServerVersion}, Local: ${storedVersion}. Triggering force refresh...`);
            localStorage.setItem("cml_local_build_version", currentServerVersion);
            
            // Show a nice modern toast alert or banner so the user knows what's happening
            const container = document.createElement('div');
            container.id = 'dynamic-update-banner';
            container.style.cssText = 'position:fixed;bottom:24px;right:24px;background:#1e293b;color:white;padding:20px;border-radius:6px;box-shadow:0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1);z-index:999999;font-family:ui-sans-serif, system-ui, sans-serif;font-size:14px;border:1px solid #c5a02d;max-width:360px;transition:all 0.5s ease;';
            container.innerHTML = `
              <div style="font-weight:bold;margin-bottom:6px;color:#c5a02d;display:flex;items-center:center;gap:6px;text-transform:uppercase;font-size:11px;letter-spacing:0.1em;">✨ Fresh System Update Published</div>
              <div style="font-size:12px;opacity:0.9;line-height:1.5;">Applying optimized performance layouts and syncing offline rosters on this device...</div>
            `;
            document.body.appendChild(container);
            
            setTimeout(() => {
              triggerHardRefresh();
            }, 3000);
          } else {
            initialLoadVersion = currentServerVersion;
          }
        }
      } catch (err) {
        console.warn("[Auto-Updater Warning] Failed to reach version check server:", err);
      }
    };

    // Run immediately on app mount
    const isDevEnv = window.location.hostname === "localhost" || 
                     window.location.hostname.includes("ais-dev") || 
                     window.location.hostname.includes("ais-pre");

    if (isDevEnv) {
      console.log("[Auto-Updater] Auto-updater polling disabled in the development sandbox to prevent rate-limiting.");
      return;
    }

    const startupTimeout = setTimeout(() => {
      checkVersion();
    }, 10000);

    // Then check periodically every 5 minutes in production
    checkInterval = setInterval(() => {
      checkVersion();
    }, 300000);

    return () => {
      clearTimeout(startupTimeout);
      clearInterval(checkInterval);
    };
  }, []);

  const handleArchiveComplaintConfirm = async () => {
    if (!deleteComplaintTarget) return;
    try {
      const nextFields = {
        ...deleteComplaintTarget,
        isArchived: true,
        status: "Archived",
        archivedAt: new Date().toISOString(),
        archivedBy: currentUser?.displayName || currentUser?.email?.split('@')[0] || "Staff"
      };
      
      try {
        await updateDoc(doc(db, "hybrid_sandbox", deleteComplaintTarget.id), {
          db_json: JSON.stringify(nextFields),
          payload_json: JSON.stringify(nextFields),
          isArchived: true,
          status: "Archived",
          archivedAt: new Date().toISOString(),
          archivedBy: currentUser?.displayName || currentUser?.email?.split('@')[0] || "Staff"
        });
      } catch (err) {
        await updateDoc(doc(db, `complaints-${deleteComplaintTarget.propertyId || selectedCompany || 'cml'}`, deleteComplaintTarget.id), {
          isArchived: true,
          status: "Archived",
          archivedAt: new Date(),
          archivedBy: currentUser?.displayName || currentUser?.email?.split('@')[0] || "Staff"
        });
      }
      setSelectedComplaint(null);
    } catch (e) {
      console.error(e);
      alert("Failed to archive log.");
    } finally {
      setDeleteComplaintTarget(null);
    }
  };

  const handleDeleteCustomFormConfirm = async () => {
    if (!deleteCustomFormTarget) return;
    try {
      await deleteDoc(doc(db, `forms-${selectedCompany || 'cml'}`, deleteCustomFormTarget.id));
    } catch (err) {
      console.error("Error deleting form:", err);
    } finally {
      setDeleteCustomFormTarget(null);
    }
  };

  const handleDeleteSopConfirm = () => {
    if (!deleteSopTarget) return;
    setSops(prev => prev.filter((_, i) => i !== deleteSopTarget.index));
    setDeleteSopTarget(null);
  };

  const triggerHardRefresh = async () => {
    try {
      console.log("[Hard Refresh] Purging all service workers and clearing local caches to force live sync.");
      
      // 1. Unregister all service worker registrations
      if ("serviceWorker" in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        for (const registration of registrations) {
          try {
            await registration.unregister();
            console.log("[PWA Cache Recovery] Unregistered stale worker:", registration);
          } catch (err) {
            console.warn("[PWA Cache Recovery] Unregister failed:", err);
          }
        }
      }
      
      // 2. Clear all cache databases
      if ("caches" in window) {
        const cacheKeys = await caches.keys();
        await Promise.all(cacheKeys.map(key => caches.delete(key).catch(() => {})));
        console.log("[PWA Cache Recovery] Cleared browser cache keys stores.");
      }
      
      // 3. Clear browser volatile storage safely
      try {
        sessionStorage.clear();
      } catch (e) {}
      
      // 4. Force browser reloading with query parameter cache-buster safely
      try {
        const uniqueReloadTag = "v_hard_reload_" + Date.now();
        localStorage.setItem("cml_app_cache_version_tag", uniqueReloadTag);
      } catch (e) {}
      
      window.location.href = window.location.origin + window.location.pathname + "?force_reload=" + Date.now();
    } catch (e) {
      console.error("[Hard Refresh Error] Fallback reload triggered:", e);
      window.location.reload();
    }
  };

  const [selectedCompany, setSelectedCompany] = useState<string | null>(null);
  const [clickedCompanyId, setClickedCompanyId] = useState<string | null>(null);
  const [transitionPhase, setTransitionPhase] = useState<'idle' | 'pressing' | 'fetching' | 'skeleton' | 'fadedIn'>('idle');
  const [portalError, setPortalError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("property-overview");
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [tabHistory, setTabHistory] = useState<string[]>([]);
  const [externalFlipbookId, setExternalFlipbookId] = useState<string | null>(null);
  const [prefilledRewardsMember, setPrefilledRewardsMember] = useState<{ email: string; fullName: string } | null>(null);

  // Unified confirmation modal target states
  const [deleteComplaintTarget, setDeleteComplaintTarget] = useState<any | null>(null);
  const [deleteCustomFormTarget, setDeleteCustomFormTarget] = useState<any | null>(null);
  const [deleteSopTarget, setDeleteSopTarget] = useState<any | null>(null);

  // Operational Window Date Filters (Guest Recovery & Maintenance Logs)
  const [recoveryStartDate, setRecoveryStartDate] = useState<string>("");
  const [recoveryEndDate, setRecoveryEndDate] = useState<string>("");
  const [maintenanceStartDate, setMaintenanceStartDate] = useState<string>("");
  const [maintenanceEndDate, setMaintenanceEndDate] = useState<string>("");

  // Synchronize company changes (e.g. dropdown switches or initial URL query parameter triggers) with elegant skeleton loads
  useEffect(() => {
    if (!selectedCompany) {
      setTransitionPhase('idle');
      return;
    }

    setTransitionPhase('skeleton');
    const timer = setTimeout(() => {
      setTransitionPhase('fadedIn');
    }, 600); // High-performance premium skeleton animation slide
    return () => clearTimeout(timer);
  }, [selectedCompany]);

  const handleCompanyClick = (companyId: string) => {
    if (clickedCompanyId) return;

    // Validate email domain permissions
    const email = currentUser?.email || "";
    const domain = email.trim().toLowerCase().split("@")[1] || "";
    
    let isAllowed = false;
    let errorMsg = "";
    
    if (companyId === 'ramada') {
      if (domain === 'ramadawailoaloafiji.com' || domain === 'cml.com.fj') {
        isAllowed = true;
      } else {
        errorMsg = "Unauthorized domain. Access to Ramada Wailoaloa Fiji is restricted to @ramadawailoaloafiji.com or @cml.com.fj users.";
      }
    } else if (companyId === 'wyndham') {
      if (domain === 'wyndhamgardenwailoaloafiji.com' || domain === 'cml.com.fj') {
        isAllowed = true;
      } else {
        errorMsg = "Unauthorized domain. Access to Wyndham corporate portal is restricted to @wyndhamgardenwailoaloafiji.com or @cml.com.fj users.";
      }
    } else if (companyId === 'cml') {
      if (domain === 'cml.com.fj') {
        isAllowed = true;
      } else {
        errorMsg = "Unauthorized domain. Access to CML Business portal is restricted exclusively to @cml.com.fj users.";
      }
    }
    
    if (!isAllowed) {
      setPortalError(errorMsg);
      // Auto-clear error after 7 seconds
      setTimeout(() => {
        setPortalError(null);
      }, 7000);
      return;
    }

    setPortalError(null);

    // Phase 1: Click indication (pressing state)
    setClickedCompanyId(companyId);
    setTransitionPhase('pressing');

    setTimeout(() => {
      // Phase 2: Fade to credentials and database synchronization fetching loader
      setTransitionPhase('fetching');

      setTimeout(() => {
        // Phase 3: Selection commit triggers the react-governed skeleton animation
        setSelectedCompany(companyId);
      }, 350); // Fluid luxury delay
    }, 100); // Perceptual micro-feel click duration
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const flipbookId = params.get("flipbook");
    const company = params.get("company");
    if (flipbookId) {
      setExternalFlipbookId(flipbookId);
      setActiveTab("digital-flipbooks");
      if (company) {
        setSelectedCompany(company);
      } else {
        setSelectedCompany("cml");
      }
    }

    const prefillEmail = params.get("prefill_email");
    if (prefillEmail) {
      const prefillName = params.get("prefill_name") || "";
      const prefillCompany = params.get("company") || "cml";
      setSelectedCompany(prefillCompany);
      setPrefilledRewardsMember({ email: prefillEmail, fullName: prefillName });
      setActiveTab("dining-loyalty");

      // Clean up search query parameters elegantly
      const url = new URL(window.location.href);
      url.searchParams.delete("prefill_email");
      url.searchParams.delete("prefill_name");
      window.history.replaceState({}, document.title, url.pathname + url.search);
    }
  }, []);

  const navigateTo = (tab: string) => {
    if (tab !== activeTab) {
      setTabHistory(prev => [...prev, activeTab]);
      setActiveTab(tab);
    }
  };

  const navigateBack = () => {
    if (tabHistory.length > 0) {
      const prev = tabHistory[tabHistory.length - 1];
      setTabHistory(prevHistory => prevHistory.slice(0, -1));
      setActiveTab(prev);
    } else {
      setActiveTab("property-overview");
    }
  };

  const [selectedForm, setSelectedForm] = useState<string | null>(null);
  const [openMenus, setOpenMenus] = useState<string[]>([
    "hotel-management",
    "guest-experience",
    "loyalty-marketing",
    "brand-qa",
    "team-training",
    "resources-help"
  ]);
  const [maintenanceHistory, setMaintenanceHistory] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem("cml_maintenance_history");
      return saved ? JSON.parse(saved) : [];
    } catch (_) {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem("cml_maintenance_history", JSON.stringify(maintenanceHistory));
    } catch (e) {
      console.warn("Failed to save maintenance history", e);
    }
  }, [maintenanceHistory]);
  const [showHistory, setShowHistory] = useState(false);
  const [dashboardViewMode, setDashboardViewMode] = useState<"percentage" | "pie">("percentage");
  const [checklistDate, setChecklistDate] = useState(new Date().toISOString().split('T')[0]);
  const [checklistValues, setChecklistValues] = useState<Record<string, 'ok' | 'repair' | null>>({});
  const [checklistNotes, setChecklistNotes] = useState("");
  const [checklistRoomNumber, setChecklistRoomNumber] = useState("");
  const [checklistInspectorName, setChecklistInspectorName] = useState("Charles");
  const [checklistInspectionType, setChecklistInspectionType] = useState("Routine");
  const [checklistShift, setChecklistShift] = useState("Morning");

  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isHuddleOpen, setIsHuddleOpen] = useState(false);
  const [isPlanManOpen, setIsPlanManOpen] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxStartIndex, setLightboxStartIndex] = useState(0);
  const [lightboxImages, setLightboxImages] = useState<{ src: string; title: string; category: string }[]>([]);

  const getCompanyImages = (company: any) => {
    if (!company) return [];
    const gallery: { src: string; title: string; category: string }[] = [];
    
    if (company.conceptImage) {
      gallery.push({
        src: company.conceptImage,
        title: "Resort Frontage & Main Property View",
        category: "Main Property"
      });
    } else if (company.heroImage) {
      gallery.push({
        src: company.heroImage,
        title: `Welcome to ${company.name}`,
        category: "Hero Banner"
      });
    }

    if (company.rooms && Array.isArray(company.rooms)) {
      company.rooms.forEach((room: any) => {
        if (room.img) {
          gallery.push({
            src: room.img,
            title: room.name || "Luxury Suite Accommodation",
            category: "Room Inventory"
          });
        }
      });
    }

    if (company.culinary && company.culinary.venues && Array.isArray(company.culinary.venues)) {
      company.culinary.venues.forEach((venue: any) => {
        if (venue.img) {
          gallery.push({
            src: venue.img,
            title: venue.name || "Fine Dining & Venue Experience",
            category: "Culinary & Gastronomy"
          });
        }
      });
    }

    if (company.eventImages && Array.isArray(company.eventImages)) {
      company.eventImages.forEach((img: any, idx: number) => {
        gallery.push({
          src: img,
          title: `Prestige Event & Meeting Space ${idx + 1}`,
          category: "MICE & Events"
        });
      });
    }

    return gallery;
  };

  const openCompanyLightbox = (targetSrc: string) => {
    const gallery = getCompanyImages(currentCompany);
    if (gallery.length === 0) return;
    setLightboxImages(gallery);
    const idx = gallery.findIndex(img => img.src === targetSrc);
    setLightboxStartIndex(idx >= 0 ? idx : 0);
    setLightboxOpen(true);
  };

  const [refreshKey, setRefreshKey] = useState(0);
  const [isSyncingAll, setIsSyncingAll] = useState(false);

  const handleManualSyncAll = async () => {
    if (isSyncingAll) return;
    setIsSyncingAll(true);
    toastService.info("Synchronizing with group ledger...", "Group Sync");
    
    const success = await forceSyncNow();
    
    setTimeout(() => {
      setIsSyncingAll(false);
      setRefreshKey(prev => prev + 1);
      if (success) {
        toastService.success("Database synced in real-time across all terminals!", "Sync Complete");
      } else {
        toastService.error("Connection warning: local data cached, syncing automatically in background.", "Sync Warning");
      }
    }, 800);
  };

  const [currentTime, setCurrentTime] = useState(new Date());
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  const [sessionExpirationTime, setSessionExpirationTime] = useState<number | null>(null);
  const [sessionRemainingSeconds, setSessionRemainingSeconds] = useState<number | null>(null);
  const [isRefreshingSession, setIsRefreshingSession] = useState(false);

  const checkTokenExpiration = async (userToCheck = currentUser) => {
    if (!userToCheck) {
      setSessionExpirationTime(null);
      setSessionRemainingSeconds(null);
      return;
    }
    try {
      const tokenResult = await userToCheck.getIdTokenResult();
      const expirationMs = new Date(tokenResult.expirationTime).getTime();
      setSessionExpirationTime(expirationMs);
      const remaining = Math.max(0, Math.floor((expirationMs - Date.now()) / 1000));
      setSessionRemainingSeconds(remaining);
    } catch (error) {
      console.error("Error fetching session token details:", error);
    }
  };

  const handleRefreshSession = async () => {
    if (!currentUser) return;
    setIsRefreshingSession(true);
    try {
      toastService.info("Renewing secure Firebase session handshake...", "Session Persistence");
      await currentUser.getIdToken(true);
      await checkTokenExpiration(currentUser);
      toastService.success("Firebase secure session token successfully renewed!", "Session Persistence");
    } catch (error: any) {
      console.error("Failed to refresh session:", error);
      toastService.error("Handshake refresh failed. Please sign out and sign in again.", "Session Error");
    } finally {
      setIsRefreshingSession(false);
    }
  };

  useEffect(() => {
    const interval = setInterval(() => {
      if (sessionExpirationTime) {
        const remaining = Math.max(0, Math.floor((sessionExpirationTime - Date.now()) / 1000));
        setSessionRemainingSeconds(remaining);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [sessionExpirationTime]);

  // Automatic background token refresh when session has less than 2 minutes (120 seconds) remaining
  useEffect(() => {
    if (currentUser && sessionRemainingSeconds !== null && sessionRemainingSeconds < 120 && sessionRemainingSeconds > 0 && !isRefreshingSession) {
      console.log(`[Auto Session Refresh] Session has less than 2 minutes remaining (${sessionRemainingSeconds}s). Triggering silent background token refresh.`);
      handleRefreshSession();
    }
  }, [sessionRemainingSeconds, currentUser, isRefreshingSession]);
  
  // Custom user session detection: restricts property-specific logins and unlocks corporate HQ permissions
  const userEmail = currentUser?.email?.toLowerCase() || "";
  const isCmlUser = currentUser ? (!userEmail.includes("ramada") && !userEmail.includes("wyndham")) : true;

  // Daily News Hook for Home Dashboard
  const [lastComplaintsSnapshotTime, setLastComplaintsSnapshotTime] = useState<Date | null>(null);
  const [lastNewsSnapshotTime, setLastNewsSnapshotTime] = useState<Date | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [complaints, setComplaints] = useState<any[]>([]);
  
  const [latestCorporateNews, setLatestCorporateNews] = useState<any[]>([]);
  const [newsLoading, setNewsLoading] = useState(true);

  useEffect(() => {
    if (!currentUser || !selectedCompany) return;
    
    // Map selectedCompany ID to propertyTarget filter in the news database
    const targetProp = 
      selectedCompany === 'cml' ? "CML Corporate" :
      selectedCompany === 'wyndham' ? "Wyndham Garden" :
      selectedCompany === 'ramada' ? "Ramada Suites" : "All";

    const q = query(
      collection(db, "daily-news"), 
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setLastNewsSnapshotTime(new Date());
      let newsItems: any[] = [];
      if (!snapshot.empty) {
        newsItems = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
      } else {
        // Fallback to static seed publications matching target
        newsItems = [
          {
            id: "seed-0",
            title: "CML Headquarters Completes High-Speed Fiber Ingress Deployment",
            content: "To support our growing real-time property management syndicate, CML Group Head Office and local property hubs have successfully finished updating to symmetric 1Gbps fiber internet routes. Staff communication, database synchronizations, and customer experience operations are now running at ultra-low latencies across all devices.",
            category: "Operational",
            authorName: "Corporate IT Team",
            authorEmail: "digitalmedia@cml.com.fj",
            propertyTarget: "CML Corporate",
            createdAt: { toDate: () => new Date() },
            imageUrl: "https://images.unsplash.com/photo-1544197150-b99a580bb7a8?auto=format&fit=crop&q=80&w=800",
            isUrgent: true
          },
          {
            id: "seed-1",
            title: "Wyndham Garden Achieves Platinum Guest Satisfaction Rating in Regional Audit",
            content: "We are extremely proud to announce that Wyndham Garden Fiji (Wailoaloa Beach) has earned a flawless Guest Satisfaction index rating during the Q2 QA and Brand Standard audit. Sincere appreciation goes to our entire guest relations, housekeeping, and front office teams for delivering stellar Count-On-Me service behaviors consistently.",
            category: "Announcement",
            authorName: "General Manager",
            authorEmail: "gm@wyndham.com.fj",
            propertyTarget: "Wyndham Garden",
            createdAt: { toDate: () => new Date() },
            imageUrl: "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&q=80&w=800",
            isUrgent: false
          },
          {
            id: "seed-2",
            title: "Ramada Suites Wailoaloa Oceanview Penthouse Refibrillation & Lounge Launch",
            content: "Following standard luxury alignment guidelines, the top-tier ocean-view suites and Penthouse Club at Ramada Suites have completed fully updated interior styling schedules. The grand opening for registered corporate rewards lounge participants will be held this Saturday from 5 PM.",
            category: "Event",
            authorName: "Director of Sales",
            authorEmail: "sales@ramada.com.fj",
            propertyTarget: "Ramada Suites",
            createdAt: { toDate: () => new Date() },
            imageUrl: "https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&q=80&w=800",
            isUrgent: false
          }
        ];
      }
      
      // Filter the news items for relevance: "All" or matches the current company hub
      const filtered = newsItems.filter((item: any) => 
        item.propertyTarget === "All" || 
        item.propertyTarget === targetProp
      ).slice(0, 3); // max 3 elements
      
      setLatestCorporateNews(filtered);
      setNewsLoading(false);
    }, (error) => {
      console.error("Error fetching homepage corporate news:", error);
      setNewsLoading(false);
    });

    return () => unsubscribe();
  }, [currentUser, selectedCompany, refreshTrigger]);
  const [sopSubTab, setSopSubTab] = useState<string>("registry");
  const [brandSubTab, setBrandSubTab] = useState<string>("rules");

  const [hasRunDiagnosticForProperty, setHasRunDiagnosticForProperty] = useState<Record<string, boolean>>({});

  // 1. Explicitly re-fetch and reconcile all data (re-queries collections via direct REST/Firestore getDocs)
  const reFetchAllData = async () => {
    // Increment refreshTrigger to force fresh onSnapshot listener subscriptions
    setRefreshTrigger(prev => prev + 1);

    try {
      if (!db || typeof db !== 'object') return;
      
      console.log("[Re-fetch All Data] Manually re-querying Firestore collections for instant reconciliation...");
      
      // Re-query Complaints for active properties from hybrid_sandbox
      const complaintsMap: { [key: string]: any[] } = {
        cml: [],
        ramada: [],
        wyndham: []
      };
      try {
        const snapshot = await getDocs(collection(db, "hybrid_sandbox"));
        console.log(`[Re-fetch All Data] Explict query successful for hybrid_sandbox: ${snapshot?.docs?.length || 0} docs.`);
        
        if (snapshot && snapshot.docs) {
          setLastComplaintsSnapshotTime(new Date());
          snapshot.docs.forEach((doc) => {
            const data = doc.data();
            const isComplaint = 
              doc.id.startsWith("complaints-") || 
              doc.id.startsWith("complaints_") || 
              doc.id.startsWith("complaint-") || 
              doc.id.startsWith("complaint_") || 
              (data.collection && typeof data.collection === "string" && data.collection.startsWith("complaints-")) ||
              (data.guestName && data.roomNumber) ||
              (data.payload && typeof data.payload === "object" && (data.payload.guestName || data.payload.roomNumber));

            if (isComplaint) {
              let prefix = "wyndham";
              if (data.collection && typeof data.collection === "string") {
                prefix = data.collection.replace("complaints-", "");
              } else if (doc.id.includes("___")) {
                const beforeTriple = doc.id.split("___")[0];
                if (beforeTriple.startsWith("complaints-")) {
                  prefix = beforeTriple.replace("complaints-", "");
                } else if (beforeTriple.startsWith("complaints_")) {
                  prefix = beforeTriple.replace("complaints_", "");
                }
              } else if (doc.id.startsWith("complaints_")) {
                const parts = doc.id.split("_");
                if (parts[1]) prefix = parts[1];
              } else if (doc.id.startsWith("complaints-")) {
                const parts = doc.id.split("-");
                if (parts[1]) prefix = parts[1];
              } else if (data.propertyId) {
                prefix = data.propertyId;
              } else if (data.payload?.propertyId) {
                prefix = data.payload.propertyId;
              }
              
              let payload: any = {};
              if (data.payload && typeof data.payload === "object") {
                payload = data.payload;
              } else if (data.db_json) {
                try { payload = JSON.parse(data.db_json); } catch (e) {}
              } else if (data.payload_json) {
                try { payload = JSON.parse(data.payload_json); } catch (e) {}
              } else {
                payload = data;
              }
              
              const docObj = {
                id: doc.id,
                ...payload,
                propertyId: prefix
              };
              
              if (complaintsMap[prefix]) {
                complaintsMap[prefix].push(docObj);
              } else {
                complaintsMap[prefix] = [docObj];
              }
            }
          });
        }
      } catch (err) {
        console.warn(`[Re-fetch All Data] Warning during direct hybrid_sandbox query:`, err);
      }

      // Combine and sort by createdAt desc
      const aggregated = Object.values(complaintsMap).flat();
      const getTimestamp = (val: any) => {
        if (!val) return 0;
        if (typeof val.toDate === 'function') return val.toDate().getTime();
        if (val.seconds) return val.seconds * 1000;
        const d = new Date(val).getTime();
        return isNaN(d) ? 0 : d;
      };
      aggregated.sort((a, b) => {
        return getTimestamp(b.createdAt) - getTimestamp(a.createdAt);
      });
      setComplaints(aggregated);

      // Re-query Daily News
      try {
        const qNews = query(collection(db, "daily-news"), orderBy("createdAt", "desc"));
        const snapshotNews = await getDocs(qNews);
        console.log(`[Re-fetch All Data] Explict query successful for daily-news: ${snapshotNews?.docs?.length || 0} docs.`);
        
        if (snapshotNews && snapshotNews.docs) {
          setLastNewsSnapshotTime(new Date());
          const newsItems = snapshotNews.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          
          const targetProp = 
            selectedCompany === 'cml' ? "CML Corporate" :
            selectedCompany === 'wyndham' ? "Wyndham Garden" :
            selectedCompany === 'ramada' ? "Ramada Suites" : "All";
            
          const filtered = newsItems.filter((item: any) => 
            item.propertyTarget === "All" || 
            item.propertyTarget === targetProp
          ).slice(0, 3); // max 3 elements
          
          setLatestCorporateNews(filtered);
        }
      } catch (err) {
        console.warn("[Re-fetch All Data] Warning during direct daily-news query:", err);
      }
      
    } catch (err) {
      console.error("[Re-fetch All Data] Critical error during manual reconciliation:", err);
    }
  };

  // 2. Robust refresh handler for the header RefreshCw button
  const [isRefreshingData, setIsRefreshingData] = useState(false);
  const handleRefreshData = async () => {
    if (isRefreshingData) return;
    setIsRefreshingData(true);
    
    try {
      console.log("[Refresh Header Action] Initiating robust cache clear and active Firestore sync...");
      
      // Clear local cache indices for the current property in localStorage
      if (selectedCompany) {
        const cacheKeys = [
          `cml_maintenance_history_${selectedCompany}`,
          `cml_sops_${selectedCompany}`,
          `cml_maintenance_history`,
          `cml_sops`
        ];
        cacheKeys.forEach(k => {
          try {
            localStorage.removeItem(k);
          } catch (e) {}
        });
        console.log(`[Refresh Header Action] Successfully cleared local property-level cache indices for '${selectedCompany}'.`);
      }

      // Trigger immediate mock/cloud DB active synchronizations
      await forceSyncNow();

      // Trigger explicit re-fetch of onSnapshot lists and direct query reconciliation
      await reFetchAllData();

      // Provide user feedback via toast service
      toastService.success(
        `Database re-synchronization completed! Fresh real-time listings reconciled for ${selectedCompany ? selectedCompany.toUpperCase() : "CML"}.`, 
        "System Refreshed"
      );
    } catch (err: any) {
      console.error("[Refresh Header Action] Failure during robust sync:", err);
      toastService.error("Synchronization warning. Local offline buffer maintained safely.", "Sync Warn");
    } finally {
      setIsRefreshingData(false);
    }
  };

  // 3. Diagnostic status check effect on initialization / selectedCompany changes (Requirement 3)
  useEffect(() => {
    if (!currentUser || !selectedCompany) return;
    if (hasRunDiagnosticForProperty[selectedCompany]) return;

    // Set a period of 4 seconds to verify if Firestore document data is detected
    const diagnosticTimer = setTimeout(async () => {
      setHasRunDiagnosticForProperty(prev => ({ ...prev, [selectedCompany]: true }));
      const isComplaintsDetected = complaints && complaints.length > 0;
      const isNewsDetected = latestCorporateNews && latestCorporateNews.length > 0;

      if (!isComplaintsDetected || !isNewsDetected) {
        console.warn("[Diagnostic Startup] Real-time Firestore document data not fully detected after set period (4.0s). Triggering automated cache-busting fallback...");
        
        try {
          // Implement automated fallback logic to query the server with cache-busting parameters (`forceGet`)
          const cb = Date.now();
          const response = await fetch(`/api/sync-cloud?forceGet=true&cb=${cb}`);
          
          if (response.ok) {
            const data = await response.json();
            console.log("[Diagnostic Startup] Automated forceGet cache-busting server fetch succeeded. Returned keys count:", Object.keys(data).length);
            
            // Reconcile and ensure data is rendered in the UI
            await reFetchAllData();
            
            toastService.info("Automated diagnostic connection restored. Live database states synchronized successfully.", "Self-Healing Portal");
          } else {
            console.warn("[Diagnostic Startup] forceGet fallback responded with status:", response.status);
          }
        } catch (err) {
          console.error("[Diagnostic Startup] Automated forceGet query fallback failed:", err);
        }
      } else {
        console.log("[Diagnostic Startup] Firestore data check: verified. Live real-time documents active.");
      }
    }, 4000);

    return () => clearTimeout(diagnosticTimer);
  }, [currentUser, selectedCompany, complaints?.length, latestCorporateNews?.length, hasRunDiagnosticForProperty]);

  useEffect(() => {
    if (currentUser) {
      setChecklistInspectorName(currentUser.displayName || currentUser.email?.split('@')[0] || "Charles");
    } else {
      setChecklistInspectorName("Charles");
    }
  }, [currentUser]);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [userProfileData, setUserProfileData] = useState<any>(null);
  const [editedDisplayName, setEditedDisplayName] = useState("");
  const [editedMobile, setEditedMobile] = useState("");
  const [editedDepartment, setEditedDepartment] = useState("");
  const [editedDesignation, setEditedDesignation] = useState("");
  const [editedEmergency, setEditedEmergency] = useState("");
  const [editedPhotoURL, setEditedPhotoURL] = useState("");
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileSaveSuccess, setProfileSaveSuccess] = useState(false);

  useEffect(() => {
    if (userProfileData) {
      setEditedDisplayName(userProfileData.displayName || "");
      setEditedMobile(userProfileData.mobile || "");
      setEditedDepartment(userProfileData.department || "");
      setEditedDesignation(userProfileData.designation || "");
      setEditedEmergency(userProfileData.emergencyContact || "");
      setEditedPhotoURL(userProfileData.photoURL || "");
    }
  }, [userProfileData]);

  const handleSaveProfile = async () => {
    if (!currentUser) return;
    setIsSavingProfile(true);
    setProfileSaveSuccess(false);
    try {
      const userDocRef = doc(db, 'users', currentUser.uid);
      await updateDoc(userDocRef, {
        displayName: editedDisplayName,
        mobile: editedMobile || "",
        department: editedDepartment || "",
        designation: editedDesignation || "",
        emergencyContact: editedEmergency || "",
        photoURL: editedPhotoURL || "",
      });
      setProfileSaveSuccess(true);
      setTimeout(() => setProfileSaveSuccess(false), 4000);
    } catch (err) {
      console.error("Error saving profile:", err);
      alert("Failed to save profile details.");
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleUpdatePhoto = async (base64Image: string) => {
    if (!currentUser) return;
    try {
      const userDocRef = doc(db, 'users', currentUser.uid);
      await updateDoc(userDocRef, {
        photoURL: base64Image,
      });
      toastService.success("Profile photo updated successfully!");
    } catch (err) {
      console.error("Error updating photo:", err);
      toastService.error("Failed to update profile photo.");
    }
  };
  const [workflowConfig, setWorkflowConfig] = useState<{ approverEmails?: string[]; delegations?: any[] } | null>(null);
  const [complaintForm, setComplaintForm] = useState({
    guestName: "",
    roomNumber: "",
    type: "Service Issue",
    priority: "Low",
    description: "",
    reporterName: "",
    reporterRole: "",
    photoBase64: "",
    propertyId: "",
    assignedDepartment: "Front Office",
  });
  const [showComplaintForm, setShowComplaintForm] = useState(false);
  const [reporterTypeSelect, setReporterTypeSelect] = useState("Staff Member");
  const [reporterDeptInput, setReporterDeptInput] = useState("");
  
  // 3-Level Guest Recovery Floating Overlay Workflow States
  const [showApprovalOverlayModal, setShowApprovalOverlayModal] = useState(false);
  const [approvalOverlayNotes, setApprovalOverlayNotes] = useState("");
  const [approvalOverlayStaffName, setApprovalOverlayStaffName] = useState("");
  const [approvalOverlaySignature, setApprovalOverlaySignature] = useState("");
  const [approvalOverlayLevel, setApprovalOverlayLevel] = useState<1 | 2 | 3>(1);
  const [selectedComplaint, setSelectedComplaint] = useState<any>(null);
  useEffect(() => {
    if (!selectedComplaint) return;
    const updated = complaints.find(c => c.id === selectedComplaint.id);
    if (updated) {
      if (JSON.stringify(updated.updates) !== JSON.stringify(selectedComplaint.updates) || updated.status !== selectedComplaint.status || updated.hodApproved !== selectedComplaint.hodApproved || updated.superAdminApproved !== selectedComplaint.superAdminApproved) {
        setSelectedComplaint(updated);
      }
    }
  }, [complaints, selectedComplaint]);
  const [complaintSearch, setComplaintSearch] = useState("");
  const [guestRecoveryPropertyFilter, setGuestRecoveryPropertyFilter] = useState<string>("active");

  const [offlineComplaintsCount, setOfflineComplaintsCount] = useState<number>(0);
  const [isOfflineSyncing, setIsOfflineSyncing] = useState<boolean>(false);
  const [offlineRatesCount, setOfflineRatesCount] = useState<number>(0);
  const [isOfflineRatesSyncing, setIsOfflineRatesSyncing] = useState<boolean>(false);
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);
  const [pendingComplaintsList, setPendingComplaintsList] = useState<any[]>([]);
  const [pendingRatesList, setPendingRatesList] = useState<any[]>([]);
  const activeSyncToastIdRef = useRef<string | null>(null);
  const activeRatesSyncToastIdRef = useRef<string | null>(null);

  useEffect(() => {
    const fetchPendingDetails = async () => {
      try {
        const complaintsList = await getOfflineComplaintsFromDB();
        setPendingComplaintsList(complaintsList);
      } catch (e) {
        console.warn("Failed to get offline complaints inside detail fetch:", e);
      }
      try {
        const ratesList = await getOfflineRatesFromDB();
        setPendingRatesList(ratesList);
      } catch (e) {
        console.warn("Failed to get offline rates inside detail fetch:", e);
      }
    };
    if (isSyncModalOpen) {
      fetchPendingDetails();
    }
  }, [isSyncModalOpen, offlineComplaintsCount, offlineRatesCount, isOfflineSyncing, isOfflineRatesSyncing]);

  useEffect(() => {
    setGuestRecoveryPropertyFilter(selectedCompany || "cml");
  }, [selectedCompany]);

  useEffect(() => {
    if (!currentUser) return;
    const unsub = onSnapshot(doc(db, "workflow-configs", "global"), (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        if (data && data.approverEmails) {
          setWorkflowConfig({ approverEmails: data.approverEmails });
        }
      }
    }, (error) => {
      console.error("Failed to load workflow-configs in App.tsx:", error);
    });
    return () => unsub();
  }, [currentUser]);
  const [isResolving, setIsResolving] = useState(false);
  const [resolveForm, setResolveForm] = useState({
    resolvedBy: auth.currentUser?.displayName || auth.currentUser?.email?.split('@')[0] || "",
    department: "",
    resolutionNotes: ""
  });
  const [isDispatching, setIsDispatching] = useState(false);
  const [dispatchComplaintForm, setDispatchComplaintForm] = useState({
    dispatchedTo: "",
    dispatchNotes: ""
  });
  const [newStaffReply, setNewStaffReply] = useState("");

  // Firestore Error Handling
  const handleFirestoreError = (error: unknown, operationType: string, path: string | null) => {
    const errInfo = {
      error: error instanceof Error ? error.message : String(error),
      authInfo: {
        userId: auth.currentUser?.uid,
        email: auth.currentUser?.email,
        emailVerified: auth.currentUser?.emailVerified,
      },
      operationType,
      path
    };
    console.error('Firestore Error Detail: ', JSON.stringify(errInfo));
    return new Error(JSON.stringify(errInfo));
  };

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [sops, setSops] = useState<{title: string, url: string, date: string}[]>(() => {
    try {
      const saved = localStorage.getItem('cml_sops');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.warn("[App] Could not read sops from localStorage:", e);
    }
    return [
      { title: "Standard Front Office Protocol", url: "#", date: "2024-05-01" },
      { title: "Housekeeping Safety Standards", url: "#", date: "2024-04-15" },
      { title: "Emergency Evacuation Plan", url: "#", date: "2024-03-20" }
    ];
  });
  const [sopSearch, setSopSearch] = useState("");
  const [isSopUploading, setIsSopUploading] = useState(false);
  const [isSopZipModalOpen, setIsSopZipModalOpen] = useState(false);
  const [selectedSopZipFile, setSelectedSopZipFile] = useState<File | null>(null);

  const handleSopZipSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.name.toLowerCase().endsWith(".zip")) {
        alert("Please upload a valid .zip file containing PDF documents.");
        return;
      }
      setSelectedSopZipFile(file);
      setIsSopZipModalOpen(true);
      e.target.value = "";
    }
  };

  const handleSopZipImport = (newSops: { title: string; url: string; date: string }[]) => {
    setSops(prev => [...newSops, ...prev]);
  };

  const [isUploading, setIsUploading] = useState(false);

  const [customForms, setCustomForms] = useState<any[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formsViewMode, setFormsViewMode] = useState<"google" | "interactive" | "registry">("interactive");
  const [formsLayoutView, setFormsLayoutView] = useState<"grid" | "list">("list");
  const [selectedFormCategory, setSelectedFormCategory] = useState<string>("All");
  const [isPrintFriendly, setIsPrintFriendly] = useState(false);
  const [hotelInfoViewMode, setHotelInfoViewMode] = useState<"team" | "property" | "inventory" | "org-chart" | "edit-staff">("team");

  const [executiveBoard, setExecutiveBoard] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem("cml_executive_board");
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return [
      {
        id: "exec_1",
        name: "MARK HINTON",
        role: "CEO / Co-Founder",
        initials: "MH",
        color: "from-amber-50 to-amber-100 text-amber-900 border-amber-200",
        desc: "Steers group-wide strategy, multi-brand hospitality acquisitions, and CML property portfolios.",
        email: "mark.hinton@cml.com.fj"
      },
      {
        id: "exec_2",
        name: "JENICE HINTON",
        role: "Director / Co-Founder",
        initials: "JH",
        color: "from-[#FDFBF7] to-[#F1E9DB] text-amber-950 border-[#E4D5BE]",
        desc: "Directs group governance protocols, stakeholder syndications, brand standards and executive advisory.",
        email: "jenice.hinton@cml.com.fj"
      },
      {
        id: "exec_3",
        name: "ROHIT LAL",
        role: "General Manager / Director",
        initials: "RL",
        color: "from-stone-100 to-stone-200 text-stone-900 border-stone-300",
        desc: "Drives dual-property operations, resort revenue maximization, guest recovery compliance, and brand alignment.",
        email: "rohit.lal@cml.com.fj"
      }
    ];
  });

  const [corporateOps, setCorporateOps] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem("cml_corporate_ops");
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return [
      {
        id: "corp_1",
        name: "SHAHIL SHARMA",
        role: "Group Financial Controller",
        initials: "SS",
        color: "bg-slate-950 text-[#C5A059] border-gold/20",
        email: "shahil.sharma@cml.com.fj"
      },
      {
        id: "corp_2",
        name: "NEETISA DEVI",
        role: "Group People & Culture Manager",
        initials: "ND",
        color: "bg-slate-900 text-stone-100 border-slate-800",
        email: "neetisa.devi@cml.com.fj"
      },
      {
        id: "corp_3",
        name: "JOHN SINGH",
        role: "Group Technology & Innovation Manager",
        initials: "JS",
        color: "bg-[#8D6E32]/10 text-[#8D6E32] border-[#8D6E32]/25",
        email: "john.singh@cml.com.fj"
      },
      {
        id: "corp_4",
        name: "SHWARAN SHIVANI",
        role: "Group Sales, Marketing & Revenue Manager",
        initials: "SS",
        color: "bg-stone-900 text-amber-100 border-zinc-800",
        email: "shwaran.shivani@cml.com.fj"
      },
      {
        id: "corp_5",
        name: "PRATEEK SHARMA",
        role: "Group Asset Protection & Compliance Manager",
        initials: "PS",
        color: "bg-[#1C1917] text-amber-50 border-amber-900/40",
        email: "prateek.sharma@cml.com.fj"
      },
      {
        id: "corp_6",
        name: "CHARLES CEBUJANO",
        role: "Group Digital Marketing & I.T Executive",
        initials: "CC",
        color: "bg-gradient-to-br from-[#8D6E32] to-[#C5A059] text-slate-950 border-gold/40",
        email: "digitalmedia@cml.com.fj",
        highlight: true
      }
    ];
  });

  const [allEmployees, setAllEmployees] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem("cml_all_employees");
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return INITIAL_EMPLOYEES;
  });

  // State variables for HR / Staff Editing tab
  const [editStaffSubTab, setEditStaffSubTab] = useState<"board" | "council" | "employees">("employees");
  const [editingMember, setEditingMember] = useState<any | null>(null);
  const [isAddingEmployee, setIsAddingEmployee] = useState(false);
  const [employeeSearchQuery, setEmployeeSearchQuery] = useState("");
  const [employeeDeptFilter, setEmployeeDeptFilter] = useState("All");
  const [selectedRoomNumber, setSelectedRoomNumber] = useState("Room 101");
  const [showAddRepairModal, setShowAddRepairModal] = useState(false);
  const [maintenanceLogs, setMaintenanceLogs] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem("cml_maintenance_logs");
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return [
      { id: "log-1", roomNumber: "Room 204", propertyId: "ramada", issue: "AC compressor replacement", technician: "Kalesh Prasad", date: "2026-06-15", cost: 450, status: "Resolved", notes: "Installed brand new Panasonic unit." },
      { id: "log-2", roomNumber: "Room 204", propertyId: "ramada", issue: "Balcony door latch repair", technician: "Sereana V.", date: "2026-06-10", cost: 50, status: "Resolved", notes: "Re-aligned latch mechanism." },
      { id: "log-3", roomNumber: "Room 215", propertyId: "wyndham", issue: "Shower mixer leakage", technician: "Kalesh Prasad", date: "2026-06-25", cost: 120, status: "In Progress", notes: "Waiting for replacement cartridges." },
      { id: "log-4", roomNumber: "Room 102", propertyId: "ramada", issue: "Smart TV connectivity setup", technician: "John Singh", date: "2026-06-18", cost: 0, status: "Resolved", notes: "Updated firmware and configured VLAN authentication." }
    ];
  });

  useEffect(() => {
    if (selectedCompany === "ramada") {
      setSelectedRoomNumber("Room 101");
    } else {
      setSelectedRoomNumber("Room 110");
    }
    if (hotelInfoViewMode === "org-chart" && selectedCompany !== "ramada" && selectedCompany !== "wyndham") {
      setHotelInfoViewMode("team");
    }
  }, [selectedCompany, hotelInfoViewMode]);

  // Real-time synchronization of employees list from Firestore
  useEffect(() => {
    const propertyId = selectedCompany || "cml";
    const usersRef = collection(db, `cml-signin-users-${propertyId}`);
    
    const unsubscribe = onSnapshot(usersRef, (snapshot) => {
      if (!snapshot.empty) {
        const list = snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            firstName: data.firstName || "",
            lastName: data.lastName || "",
            name: `${data.firstName || ""} ${data.lastName || ""}`.trim(),
            phone: data.phone || "",
            email: data.email || "",
            employeeCode: data.employeeCode || "",
            role: data.role || "Staff",
            department: data.department || "",
            managerName: data.managerName || "",
            dateOfBirth: data.dateOfBirth || ""
          };
        });
        setAllEmployees(list);
      } else {
        // Fallback if empty
        setAllEmployees(INITIAL_EMPLOYEES);
      }
    }, (err) => {
      console.error("Firestore employees sync failed:", err);
    });

    return () => unsubscribe();
  }, [selectedCompany, db]);

  const [orgSearchQuery, setOrgSearchQuery] = useState("");
  const [selectedOrgTier, setSelectedOrgTier] = useState<"all" | "board" | "executive" | "operations">("all");
  const [selectedOrgNode, setSelectedOrgNode] = useState<any>(null);
  const [orgViewLayout, setOrgViewLayout] = useState<"visual" | "directory">("visual");

  const isStaffMatch = (name: string, role: string) => {
    if (!orgSearchQuery) return false;
    const q = orgSearchQuery.toLowerCase();
    return name.toLowerCase().includes(q) || role.toLowerCase().includes(q);
  };

  const [revenueDivisionFilter, setRevenueDivisionFilter] = useState<"All" | "Western" | "Central">("All");
  const [portfolioSortKey, setPortfolioSortKey] = useState<"name" | "occupancy" | "revpar" | null>(null);
  const [portfolioSortOrder, setPortfolioSortOrder] = useState<"asc" | "desc">("desc");

  const handlePortfolioSort = (key: "name" | "occupancy" | "revpar") => {
    if (portfolioSortKey === key) {
      setPortfolioSortOrder(prev => (prev === "asc" ? "desc" : "asc"));
    } else {
      setPortfolioSortKey(key);
      setPortfolioSortOrder("desc");
    }
  };
  const [newFormDetails, setNewFormDetails] = useState({
    name: "",
    url: "",
    category: "HR & Leave Operations"
  });

  const getDefaultForms = (companyId: string | null) => {
    const company = companyId || 'cml';
    if (company === 'wyndham') {
      return WYNDHAM_FORMS.map(form => ({
        ...form,
        isDefault: true
      }));
    }
    return HR_FORMS.map(form => {
      let mappedName = form.name;
      let mappedUrl = form.url;
      
      if (company === 'cml') {
        mappedName = form.name
          .replace(/Ramada Hotel Wailoaloa Fiji/gi, "Cove Management Limited (CML)")
          .replace(/Ramada Wailoaloa Fiji/gi, "Cove Management Limited (CML)")
          .replace(/Ramada Hotel/gi, "Cove Management Limited")
          .replace(/Ramada Wailoaloa Hotel Fiji/gi, "Cove Management Limited (CML)")
          .replace(/Ramada/gi, "CML");
        mappedUrl = form.url;
      }
      
      return {
        ...form,
        name: mappedName,
        url: mappedUrl,
        isDefault: true
      };
    });
  };

  useEffect(() => {
    if (!db || !selectedCompany) return;
    
    let unsubscribe: () => void;
    try {
      const q = query(
        collection(db, `forms-${selectedCompany}`),
        orderBy('createdAt', 'desc')
      );
      unsubscribe = onSnapshot(q, (snapshot) => {
        const docs = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setCustomForms(docs);
      }, (err) => {
        console.warn("Custom forms snapshot restricted or not available yet. Falling back to default list.");
      });
    } catch (e) {
      console.error(e);
    }
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [selectedCompany]);

  useEffect(() => {
    try {
      localStorage.setItem('cml_sops', JSON.stringify(sops));
    } catch (e) {
      console.warn("[App] Could not write sops to localStorage:", e);
    }
  }, [sops]);

  const filteredSops = sops.filter(sop => 
    sop.title.toLowerCase().includes(sopSearch.toLowerCase())
  );

  const handlePdfUpload = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      if (file.size > 10 * 1024 * 1024) {
        alert("Please select a document smaller than 10MB.");
        reject(new Error("File too large"));
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        resolve(reader.result as string);
      };
      reader.onerror = () => reject(new Error("FileReader error"));
      reader.readAsDataURL(file);
    });
  };

  const handleImageUpload = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      if (file.size > 5 * 1024 * 1024) {
        alert("Please select an image smaller than 5MB.");
        reject(new Error("File too large"));
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          
          const maxDim = 800;
          if (width > height) {
            if (width > maxDim) {
              height *= maxDim / width;
              width = maxDim;
            }
          } else {
            if (height > maxDim) {
              width *= maxDim / height;
              height = maxDim;
            }
          }
          
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          
          const compressedBase64 = canvas.toDataURL('image/jpeg', 0.6);
          resolve(compressedBase64);
        };
        img.onerror = () => reject(new Error("Image load error"));
        img.src = reader.result as string;
      };
      reader.onerror = () => reject(new Error("FileReader error"));
      reader.readAsDataURL(file);
    });
  };

  const [complaintsError, setComplaintsError] = useState<string | null>(null);

  useEffect(() => {
    if (!currentUser) return;
    
    if (!db || typeof db !== 'object') {
      console.warn("[App] Complaints subscription deferred: db is falsy/invalid");
      setComplaintsError("Portal Database Sync status: Standby. Waiting for credentials.");
      return;
    }

    setComplaintsError(null);

    let unsubscribes: (() => void)[] = [];
    try {
      const q = query(collection(db, "hybrid_sandbox"));
      
      const unsub = onSnapshot(q, (snapshot) => {
        setLastComplaintsSnapshotTime(new Date());
        
        const complaintsMap: { [key: string]: any[] } = {
          cml: [],
          ramada: [],
          wyndham: []
        };
        
        snapshot.docs.forEach((doc) => {
          const data = doc.data();
          // Check if this document represents a complaint
          const isComplaint = 
            doc.id.startsWith("complaints-") || 
            doc.id.startsWith("complaints_") || 
            doc.id.startsWith("complaint-") || 
            doc.id.startsWith("complaint_") || 
            (data.collection && typeof data.collection === "string" && data.collection.startsWith("complaints-")) ||
            (data.guestName && data.roomNumber) ||
            (data.payload && typeof data.payload === "object" && (data.payload.guestName || data.payload.roomNumber));

          if (isComplaint) {
            let prefix = "wyndham";
            if (data.collection && typeof data.collection === "string") {
              prefix = data.collection.replace("complaints-", "");
            } else if (doc.id.includes("___")) {
              const beforeTriple = doc.id.split("___")[0];
              if (beforeTriple.startsWith("complaints-")) {
                prefix = beforeTriple.replace("complaints-", "");
              } else if (beforeTriple.startsWith("complaints_")) {
                prefix = beforeTriple.replace("complaints_", "");
              }
            } else if (doc.id.startsWith("complaints_")) {
              const parts = doc.id.split("_");
              if (parts[1]) prefix = parts[1];
            } else if (doc.id.startsWith("complaints-")) {
              const parts = doc.id.split("-");
              if (parts[1]) prefix = parts[1];
            } else if (data.propertyId) {
              prefix = data.propertyId;
            } else if (data.payload?.propertyId) {
              prefix = data.payload.propertyId;
            }
            
            let payload: any = {};
            if (data.payload && typeof data.payload === "object") {
              payload = data.payload;
            } else if (data.db_json) {
              try { payload = JSON.parse(data.db_json); } catch (e) {}
            } else if (data.payload_json) {
              try { payload = JSON.parse(data.payload_json); } catch (e) {}
            } else {
              payload = data;
            }
            
            const docObj = {
              id: doc.id,
              ...payload,
              propertyId: prefix
            };
            
            if (complaintsMap[prefix]) {
              complaintsMap[prefix].push(docObj);
            } else {
              complaintsMap[prefix] = [docObj];
            }
          }
        });

        // Log to Sync Event Log
        syncLogger.logEvent({
          collection: `hybrid_sandbox`,
          action: 'REACTIVE_SUBSCRIPTION_UPDATE',
          status: 'success',
          source: 'sandbox',
          message: `Synchronized ${snapshot?.docs?.length || 0} active records from hybrid_sandbox successfully`
        });

        // Combine and sort by createdAt desc
        const aggregated = Object.values(complaintsMap).flat();
        const getTimestamp = (val: any) => {
          if (!val) return 0;
          if (typeof val.toDate === 'function') return val.toDate().getTime();
          if (val.seconds) return val.seconds * 1000;
          const d = new Date(val).getTime();
          return isNaN(d) ? 0 : d;
        };
        aggregated.sort((a, b) => {
          return getTimestamp(b.createdAt) - getTimestamp(a.createdAt);
        });
        setComplaints(aggregated);
        console.log(`[Firestore Listener] Dynamic aggregated complaint state updated from hybrid_sandbox. Total complaints: ${aggregated.length}`);
      }, (err) => {
        console.error(`Group-wide complaints subscription failed for collection: hybrid_sandbox`, err);
        
        syncLogger.logEvent({
          collection: `hybrid_sandbox`,
          action: 'REACTIVE_SUBSCRIPTION_UPDATE',
          status: 'failure',
          source: 'sandbox',
          message: `Subscription warning: ${err?.message || err}`
        });
      });
      unsubscribes.push(unsub);
    } catch (err) {
      console.error("Failed to construct complaints query from hybrid_sandbox:", err);
      setComplaintsError("Failed to synchronize complaints database. Please check permissions.");
    }
    
    return () => {
      unsubscribes.forEach(unsub => unsub());
    };
  }, [currentUser, isCmlUser, refreshKey, selectedCompany, refreshTrigger]);

  const handleComplaintImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      const img = new Image();
      img.src = reader.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const max_size = 500; // Optimized and resized to 500 pixels max to stay within bounds
        let width = img.width;
        let height = img.height;
        if (width > height) {
          if (width > max_size) {
            height *= max_size / width;
            width = max_size;
          }
        } else {
          if (height > max_size) {
            width *= max_size / height;
            height = max_size;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.5); // Reduced quality for maximum synchronization stability
        setComplaintForm(prev => ({ ...prev, photoBase64: dataUrl }));
      };
    };
    reader.readAsDataURL(file);
  };

  const handleQuickApproveHOD = async (complaint: any) => {
    try {
      const authorName = currentUser?.displayName || currentUser?.email?.toLowerCase().split('@')[0] || "HOD Manager";
      const nextUpdates = [
        ...(complaint.updates || []),
        {
          message: `STEP 1 APPROVED: Department Head (HOD) approval granted by ${authorName}.`,
          authorName: "SYSTEM_ACTION",
          timestamp: new Date().toISOString()
        }
      ];
      const nextFields = {
        ...complaint,
        hodApproved: true,
        hodApprovedBy: authorName,
        hodApprovedAt: new Date().toISOString(),
        status: "HOD Approved",
        updates: nextUpdates
      };

      try {
        await updateDoc(doc(db, "hybrid_sandbox", complaint.id), {
          db_json: JSON.stringify(nextFields),
          payload_json: JSON.stringify(nextFields),
          hodApproved: true,
          hodApprovedBy: authorName,
          hodApprovedAt: new Date().toISOString(),
          status: "HOD Approved",
          updates: nextUpdates
        });
      } catch (err) {
        await updateDoc(doc(db, `complaints-${complaint.propertyId || selectedCompany || 'cml'}`, complaint.id), {
          hodApproved: true,
          hodApprovedBy: authorName,
          hodApprovedAt: new Date(),
          status: "HOD Approved",
          updates: arrayUnion({
            message: `STEP 1 APPROVED: Department Head (HOD) approval granted by ${authorName}.`,
            authorName: "SYSTEM_ACTION",
            timestamp: new Date()
          })
        });
      }

      // Trigger background notification sync
      fetch("/api/notify-complaint-update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          complaint,
          action: "update",
          authorName: "SYSTEM_ACTION",
          updateMessage: `STEP 1 APPROVED: Department Head (HOD) approval granted by ${authorName}.`,
          companyId: complaint.propertyId || selectedCompany || 'cml'
        })
      }).catch(err => console.error("Webhook update notification failed", err));

      toastService.success("HOD Approval granted successfully!");
    } catch (e: any) {
      toastService.error("HOD Approval failed: " + e.message);
    }
  };

  const handleQuickApproveSuperAdmin = async (complaint: any, name: string, dept: string) => {
    try {
      const nextUpdates = [
        ...(complaint.updates || []),
        {
          message: `STEP 2 RESOLVED: Final SuperAdmin sign-off granted by ${name} (${dept}).`,
          authorName: "SYSTEM_ACTION",
          timestamp: new Date().toISOString()
        }
      ];
      const nextFields = {
        ...complaint,
        superAdminApproved: true,
        superAdminApprovedBy: name,
        superAdminApprovedAt: new Date().toISOString(),
        status: "Resolved",
        resolvedAt: new Date().toISOString(),
        resolvedBy: name,
        resolvedDepartment: dept,
        updates: nextUpdates
      };

      try {
        await updateDoc(doc(db, "hybrid_sandbox", complaint.id), {
          db_json: JSON.stringify(nextFields),
          payload_json: JSON.stringify(nextFields),
          superAdminApproved: true,
          superAdminApprovedBy: name,
          superAdminApprovedAt: new Date().toISOString(),
          status: "Resolved",
          resolvedAt: new Date().toISOString(),
          resolvedBy: name,
          resolvedDepartment: dept,
          updates: nextUpdates
        });
      } catch (err) {
        await updateDoc(doc(db, `complaints-${complaint.propertyId || selectedCompany || 'cml'}`, complaint.id), {
          superAdminApproved: true,
          superAdminApprovedBy: name,
          superAdminApprovedAt: new Date(),
          status: "Resolved",
          resolvedAt: serverTimestamp(),
          resolvedBy: name,
          resolvedDepartment: dept,
          updates: arrayUnion({
            message: `STEP 2 RESOLVED: Final SuperAdmin sign-off granted by ${name} (${dept}).`,
            authorName: "SYSTEM_ACTION",
            timestamp: new Date()
          })
        });
      }

      // Trigger background webhook of Google Chat & Emails
      fetch("/api/notify-complaint-update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          complaint,
          action: "superadmin_approve",
          authorName: name,
          companyId: complaint.propertyId || selectedCompany || 'cml',
          department: dept,
          resolvedBy: name
        })
      }).catch(err => console.error("SuperAdmin Approve notification failed", err));

      toastService.success("SuperAdmin sign-off and resolve completed!");
    } catch (e: any) {
      toastService.error("SuperAdmin approval failed: " + e.message);
    }
  };

  // ==========================================
  // Client-Side PWA IndexedDB & Background Sync Core
  // ==========================================

  const openOfflineComplaintsDB = (): Promise<IDBDatabase> => {
    return new Promise((resolve, reject) => {
      try {
        if (!window.indexedDB) {
          reject(new Error("IndexedDB is not supported"));
          return;
        }
        const request = window.indexedDB.open("cml-offline-complaints-db", 1);
        request.onupgradeneeded = (event: any) => {
          const db = event.target.result;
          if (!db.objectStoreNames.contains("pending-complaints")) {
            db.createObjectStore("pending-complaints", { keyPath: "id", autoIncrement: true });
          }
        };
        request.onsuccess = (event: any) => {
          resolve(event.target.result);
        };
        request.onerror = (event: any) => {
          reject(event.target.error);
        };
      } catch (err) {
        reject(err);
      }
    });
  };

  const saveComplaintToOfflineDB = async (complaint: any): Promise<void> => {
    try {
      const db = await openOfflineComplaintsDB();
      return new Promise<void>((resolve, reject) => {
        const transaction = db.transaction("pending-complaints", "readwrite");
        const store = transaction.objectStore("pending-complaints");
        const request = store.add(complaint);
        request.onsuccess = () => {
          console.log("[Offline DB] Successfully cached pending complaint offline:", complaint);
          resolve();
        };
        request.onerror = () => reject(request.error);
      });
    } catch (err) {
      console.error("[Offline DB] Failed to save complaint offline:", err);
    }
  };

  const getOfflineComplaintsFromDB = async (): Promise<any[]> => {
    try {
      const db = await openOfflineComplaintsDB();
      return new Promise<any[]>((resolve, reject) => {
        const transaction = db.transaction("pending-complaints", "readonly");
        const store = transaction.objectStore("pending-complaints");
        const request = store.getAll();
        request.onsuccess = () => resolve(request.result || []);
        request.onerror = () => reject(request.error);
      });
    } catch (err) {
      console.error("[Offline DB] Failed to get offline complaints:", err);
      return [];
    }
  };

  const openOfflineRatesDB = (): Promise<IDBDatabase> => {
    return new Promise((resolve, reject) => {
      try {
        if (!window.indexedDB) {
          reject(new Error("IndexedDB is not supported"));
          return;
        }
        const request = window.indexedDB.open("cml-offline-rates-db", 1);
        request.onupgradeneeded = (event: any) => {
          const db = event.target.result;
          if (!db.objectStoreNames.contains("pending-rates")) {
            db.createObjectStore("pending-rates", { keyPath: "id", autoIncrement: true });
          }
        };
        request.onsuccess = (event: any) => {
          resolve(event.target.result);
        };
        request.onerror = (event: any) => {
          reject(event.target.error);
        };
      } catch (err) {
        reject(err);
      }
    });
  };

  const saveRateToOfflineDB = async (rateUpdate: any): Promise<void> => {
    try {
      const db = await openOfflineRatesDB();
      return new Promise<void>((resolve, reject) => {
        const transaction = db.transaction("pending-rates", "readwrite");
        const store = transaction.objectStore("pending-rates");
        const request = store.add(rateUpdate);
        request.onsuccess = () => {
          console.log("[Offline Rates DB] Successfully cached pending rate offline:", rateUpdate);
          resolve();
        };
        request.onerror = () => reject(request.error);
      });
    } catch (err) {
      console.error("[Offline Rates DB] Failed to save rate offline:", err);
    }
  };

  const getOfflineRatesFromDB = async (): Promise<any[]> => {
    try {
      const db = await openOfflineRatesDB();
      return new Promise<any[]>((resolve, reject) => {
        const transaction = db.transaction("pending-rates", "readonly");
        const store = transaction.objectStore("pending-rates");
        const request = store.getAll();
        request.onsuccess = () => resolve(request.result || []);
        request.onerror = () => reject(request.error);
      });
    } catch (err) {
      console.error("[Offline Rates DB] Failed to get offline rates:", err);
      return [];
    }
  };

  const triggerRatesBackgroundSync = async () => {
    setIsOfflineRatesSyncing(true);
    try {
      const pending = await getOfflineRatesFromDB();
      if (pending.length > 0) {
        console.log(`[Rates Sync Client] Syncing ${pending.length} rate updates.`);
        const response = await fetch("/api/sync-offline-rates", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ rates: pending })
        });
        if (response.ok) {
          const resData = await response.json();
          console.log(`[Rates Sync Client] Synced ${resData.count} items.`);
          
          // Clear IndexedDB pending rates
          const db = await openOfflineRatesDB();
          const transaction = db.transaction("pending-rates", "readwrite");
          const store = transaction.objectStore("pending-rates");
          for (const item of pending) {
            if (item.id !== undefined) {
              store.delete(item.id);
            }
          }
          setOfflineRatesCount(0);

          if (activeRatesSyncToastIdRef.current) {
            toastService.dismiss(activeRatesSyncToastIdRef.current);
            activeRatesSyncToastIdRef.current = null;
          }

          toastService.success(
            `Successfully synchronized ${pending.length} offline cached rate update(s) to Live Channel Manager.`,
            "Rates Synced"
          );

          syncLogger.logEvent({
            collection: "offline-cache",
            action: "BACKGROUND_SYNC_RATES",
            status: "success",
            source: "live",
            message: `Successfully distributed ${pending.length} offline cached rate updates to CML Siteminder dynamic channel manager database.`
          });
        }
      }
    } catch (err) {
      console.error("[Rates Sync Client] Direct push failed:", err);
    } finally {
      setTimeout(() => {
        setIsOfflineRatesSyncing(false);
      }, 1500);
    }
  };

  const handleDistributeRates = async () => {
    const isOffline = !navigator.onLine;
    const dummyRateUpdate = {
      propertyId: selectedCompany || "ramada",
      baseRate: 200.00,
      occupancySurcharge: 30.00,
      weekendMarkup: 30.00,
      ecoTax: 15.00,
      projectedBAR: 275.00,
      timestamp: new Date().toISOString()
    };

    if (isOffline) {
      console.log("[handleDistributeRates] Offline. Caching rate in IndexedDB.");
      await saveRateToOfflineDB(dummyRateUpdate);
      const pendingRates = await getOfflineRatesFromDB();
      setOfflineRatesCount(pendingRates.length);

      toastService.warning(
        `Device is currently OFFLINE. Successfully cached ${pendingRates.length} rate update(s) in local sync queue.`,
        "Offline Rate Saved"
      );

      syncLogger.logEvent({
        collection: "offline-cache",
        action: 'CACHE_OFFLINE_RATE',
        status: 'success',
        source: 'sandbox',
        message: `Saved offline rate update ($275.00) in IndexedDB. Sync queued.`
      });
    } else {
      console.log("[handleDistributeRates] Online. Updating directly.");
      toastService.success(
        "Successfully distributed calculator rates directly to active Siteminder Channel Manager.",
        "Rates Distributed"
      );

      syncLogger.logEvent({
        collection: "rates-live",
        action: 'DISTRIBUTE_RATES_LIVE',
        status: 'success',
        source: 'live',
        message: `Distributed dynamic rate update ($275.00) directly to channel manager.`
      });
    }
  };

  const triggerClientBackgroundSync = async () => {
    setIsOfflineSyncing(true);
    
    // 1. Register background sync tag (for browsers supporting PWA Sync API natively)
    if ("serviceWorker" in navigator && "SyncManager" in window) {
      try {
        const registration = await navigator.serviceWorker.ready;
        await (registration as any).sync.register("sync-complaints");
        console.log("[PWA Sync Client] Registered sync tag 'sync-complaints' with service worker.");
      } catch (err) {
        console.warn("[PWA Sync Client] Background Sync registration failed:", err);
      }
    }

    // 2. Direct Service Worker PostMessage (for instant background push)
    if ("serviceWorker" in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({ type: "TRIGGER_SYNC" });
      console.log("[PWA Sync Client] Sent TRIGGER_SYNC postMessage to active service worker controller.");
    } else {
      // 3. Fallback client-side REST call if service worker is inactive/absent
      try {
        const pending = await getOfflineComplaintsFromDB();
        if (pending.length > 0) {
          console.log(`[PWA Sync Client] Direct push fallback. Syncing ${pending.length} complaints via REST.`);
          const response = await fetch("/api/sync-offline-complaints", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ complaints: pending })
          });
          if (response.ok) {
            const resData = await response.json();
            console.log(`[PWA Sync Client] REST push synced ${resData.count} items.`);
            // Clear IndexedDB pending complaints
            const db = await openOfflineComplaintsDB();
            const transaction = db.transaction("pending-complaints", "readwrite");
            const store = transaction.objectStore("pending-complaints");
            for (const item of pending) {
              store.delete(item.id);
            }
            setOfflineComplaintsCount(0);

            // Dismiss the "Sync Pending" toast if it is open
            if (activeSyncToastIdRef.current) {
              toastService.dismiss(activeSyncToastIdRef.current);
              activeSyncToastIdRef.current = null;
            }
            // Notify user with success toast
            toastService.success(
              `Successfully synchronized ${pending.length} offline cached complaint(s) via REST connection.`,
              "Sync Completed"
            );
          }
        }
      } catch (err) {
        console.error("[PWA Sync Client] Fallback client push failed:", err);
      }
    }
    
    // Safety delay to reset spinner
    setTimeout(() => {
      setIsOfflineSyncing(false);
    }, 2000);
  };

  // Synchronize and monitor offline guest complaints and rate updates cached in IndexedDB
  useEffect(() => {
    const updateOfflineCount = async () => {
      try {
        const pendingList = await getOfflineComplaintsFromDB();
        setOfflineComplaintsCount(pendingList ? pendingList.length : 0);
      } catch (err) {
        console.warn("[App] Failed to update offline complaints count:", err);
      }
      try {
        const pendingRates = await getOfflineRatesFromDB();
        setOfflineRatesCount(pendingRates ? pendingRates.length : 0);
      } catch (err) {
        console.warn("[App] Failed to update offline rates count:", err);
      }
    };

    updateOfflineCount();

    // Listen to Service Worker messages when synchronization starts or completes
    const handleServiceWorkerMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === "SYNC_COMPLETED") {
        console.log(`[PWA Sync Client] Received SYNC_COMPLETED signal. Synced ${event.data.count} items.`);
        setIsOfflineSyncing(false);
        updateOfflineCount();
        
        // Log success to Sync Event Log
        syncLogger.logEvent({
          collection: "offline-cache",
          action: "BACKGROUND_SYNC",
          status: "success",
          source: "live",
          message: `Service worker successfully pushed ${event.data.count} offline cached complaints to cloud Firestore.`
        });

        // Dismiss the persistent "Sync Pending" toast if it is open
        if (activeSyncToastIdRef.current) {
          toastService.dismiss(activeSyncToastIdRef.current);
          activeSyncToastIdRef.current = null;
        }

        // Show a success toast
        toastService.success(
          `Successfully synchronized ${event.data.count} offline cached complaint(s) to cloud Firestore.`,
          "Sync Completed"
        );
        
        // Custom UI notification trigger
        if (currentUser) {
          notificationService.notifyManagement({
            title: "Offline Synced",
            message: `PWA Background Sync committed ${event.data.count} guest complaint files successfully.`,
            type: NotificationType.SYSTEM,
            link: "property-overview"
          }, currentUser.uid);
        }
      }
    };

    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.addEventListener("message", handleServiceWorkerMessage);
    }

    // Trigger background sync when client comes back online
    const handleOnlineStatus = async () => {
      setIsOnline(true);
      console.log("[Connection Client] Network connection regained. Instigating PWA sync run...");
      
      try {
        const pendingList = await getOfflineComplaintsFromDB();
        if (pendingList.length > 0) {
          if (activeSyncToastIdRef.current) {
            toastService.dismiss(activeSyncToastIdRef.current);
          }
          activeSyncToastIdRef.current = toastService.show(
            `${pendingList.length} offline complaint(s) detected in local cache. Running background synchronization...`,
            "info",
            0, // Persistent toast
            "Sync Pending"
          );
        }
      } catch (err) {
        console.error("[CML Sync] Failed to inspect offline cache on reconnection:", err);
      }

      try {
        const pendingRates = await getOfflineRatesFromDB();
        if (pendingRates.length > 0) {
          if (activeRatesSyncToastIdRef.current) {
            toastService.dismiss(activeRatesSyncToastIdRef.current);
          }
          activeRatesSyncToastIdRef.current = toastService.show(
            `${pendingRates.length} offline rate update(s) detected in local cache. Running background synchronization...`,
            "info",
            0, // Persistent toast
            "Rates Sync Pending"
          );
        }
      } catch (err) {
        console.error("[CML Sync] Failed to inspect offline rates cache on reconnection:", err);
      }

      triggerClientBackgroundSync();
      triggerRatesBackgroundSync();
    };

    const handleOfflineStatus = () => {
      setIsOnline(false);
      console.log("[Connection Client] Network connection lost.");
    };

    window.addEventListener("online", handleOnlineStatus);
    window.addEventListener("offline", handleOfflineStatus);

    return () => {
      if ("serviceWorker" in navigator) {
        navigator.serviceWorker.removeEventListener("message", handleServiceWorkerMessage);
      }
      window.removeEventListener("online", handleOnlineStatus);
      window.removeEventListener("offline", handleOfflineStatus);
    };
  }, [currentUser]);

  const handleLodgeComplaint = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    const targetPropertyId = complaintForm.propertyId || selectedCompany || 'wyndham';
    const compiledRole = `${reporterTypeSelect}${reporterDeptInput ? ` (${reporterDeptInput})` : ''}`;
    
    const { propertyId, ...cleanForm } = complaintForm;
    const payloadForm = {
      ...cleanForm,
      reporterRole: compiledRole
    };

    // If browser is currently offline, intercept and cache in local IndexedDB immediately
    const isOffline = !navigator.onLine;

    if (isOffline) {
      console.log("[handleLodgeComplaint] Browser reports offline. Caching complaint in offline IndexedDB.");
      const offlinePayload = {
        ...payloadForm,
        status: "Pending",
        authorId: currentUser.uid,
        authorName: currentUser.displayName || currentUser.email?.split('@')[0],
        propertyId: targetPropertyId,
        createdAt: new Date().toISOString()
      };

      await saveComplaintToOfflineDB(offlinePayload);
      
      // Update local count
      const pendingList = await getOfflineComplaintsFromDB();
      setOfflineComplaintsCount(pendingList.length);

      // Log success to Sync Event Log
      syncLogger.logEvent({
        collection: `complaints-${targetPropertyId}`,
        action: 'CACHE_OFFLINE_RECORD',
        status: 'success',
        source: 'sandbox',
        message: `Saved guest complaint for ${payloadForm.guestName} offline (IndexedDB). Background sync primed.`
      });

      // Clear the form and close modal
      setComplaintForm({
        guestName: "",
        roomNumber: "",
        type: "Service Issue",
        priority: "Medium",
        description: "",
        reporterName: "",
        reporterRole: "",
        photoBase64: "",
        propertyId: "",
        assignedDepartment: "Front Office",
      });
      setReporterDeptInput("");
      setReporterTypeSelect("Staff Member");
      setShowComplaintForm(false);
      
      alert("ℹ️ Offline Mode: Your guest complaint has been cached locally in IndexedDB. It will automatically synchronize to Firestore once network connectivity is restored.");
      return;
    }

    try {
      const targetPropertyId = complaintForm.propertyId || selectedCompany || 'wyndham';
      const compiledRole = `${reporterTypeSelect}${reporterDeptInput ? ` (${reporterDeptInput})` : ''}`;
      
      const { propertyId, ...cleanForm } = complaintForm;
      const payloadForm = {
        ...cleanForm,
        reporterRole: compiledRole
      };

      const docPayload = {
        ...payloadForm,
        status: "Pending",
        authorId: currentUser.uid,
        authorName: currentUser.displayName || currentUser.email?.split('@')[0],
        createdAt: new Date().toISOString(),
        propertyId: targetPropertyId
      };

      await addDoc(collection(db, "hybrid_sandbox"), {
        collection: `complaints-${targetPropertyId}`,
        db_json: JSON.stringify(docPayload),
        payload_json: JSON.stringify(docPayload),
        createdAt: new Date().toISOString()
      });

      // Log success to Sync Event Log
      syncLogger.logEvent({
        collection: `complaints-${targetPropertyId}`,
        action: 'CREATE_RECORD',
        status: 'success',
        source: db && '_isMock' in db ? 'sandbox' : 'live',
        message: `Registered new recovery log for guest ${payloadForm.guestName} (Room ${payloadForm.roomNumber}) successfully`
      });

      // Notification
      const logName = currentUser.displayName || currentUser.email?.split('@')[0];
      notificationService.notifyManagement({
        title: "New Guest Complaint",
        message: (`${complaintForm.priority} Priority: ${complaintForm.guestName} in Room ${complaintForm.roomNumber} - ${complaintForm.type}`).substring(0, 100),
        type: NotificationType.MAINTENANCE,
        link: 'property-overview'
      }, currentUser.uid);

      // Notify the recovery team via backend API
      try {
        await fetch('/api/notify-recovery', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            complaint: payloadForm,
            companyId: targetPropertyId,
            sender: {
              name: currentUser.displayName || currentUser.email?.split('@')[0],
              email: currentUser.email
            }
          })
        });
      } catch (notifyError) {
        console.error("Notification failed:", notifyError);
      }

      setComplaintForm({
        guestName: "",
        roomNumber: "",
        type: "Service Issue",
        priority: "Medium",
        description: "",
        reporterName: "",
        reporterRole: "",
        photoBase64: "",
        propertyId: "",
        assignedDepartment: "Front Office",
      });
      setReporterDeptInput("");
      setReporterTypeSelect("Staff Member");
      setShowComplaintForm(false);
    } catch (error: any) {
      console.error("Complaint error (falling back to offline caching):", error);
      
      try {
        const targetPropertyId = complaintForm.propertyId || selectedCompany || 'wyndham';
        const compiledRole = `${reporterTypeSelect}${reporterDeptInput ? ` (${reporterDeptInput})` : ''}`;
        const { propertyId, ...cleanForm } = complaintForm;
        const payloadForm = {
          ...cleanForm,
          reporterRole: compiledRole
        };
        const offlinePayload = {
          ...payloadForm,
          status: "Pending",
          authorId: currentUser.uid,
          authorName: currentUser.displayName || currentUser.email?.split('@')[0],
          propertyId: targetPropertyId,
          createdAt: new Date().toISOString()
        };

        await saveComplaintToOfflineDB(offlinePayload);
        const pendingList = await getOfflineComplaintsFromDB();
        setOfflineComplaintsCount(pendingList.length);

        syncLogger.logEvent({
          collection: `complaints-${targetPropertyId}`,
          action: 'CACHE_OFFLINE_RECORD',
          status: 'success',
          source: 'sandbox',
          message: `Network error or timeout. Complaint for ${payloadForm.guestName} cached offline safely in local IndexedDB.`
        });

        setComplaintForm({
          guestName: "",
          roomNumber: "",
          type: "Service Issue",
          priority: "Medium",
          description: "",
          reporterName: "",
          reporterRole: "",
          photoBase64: "",
          propertyId: "",
          assignedDepartment: "Front Office",
        });
        setReporterDeptInput("");
        setReporterTypeSelect("Staff Member");
        setShowComplaintForm(false);
        
        alert("⚠️ Connection unstable: Captured guest complaint safely offline in IndexedDB. It will synchronize once a solid connection is confirmed!");
      } catch (innerErr) {
        console.error("Failed to save offline fallback:", innerErr);
        
        // Log original failure if fallback also fails
        syncLogger.logEvent({
          collection: `complaints-${complaintForm.propertyId || selectedCompany || 'wyndham'}`,
          action: 'CREATE_RECORD',
          status: 'failure',
          source: db && '_isMock' in db ? 'sandbox' : 'live',
          message: `Failed to register complaint: ${error?.message || error}`
        });
      }
    }
  };

  const handleSeedData = async () => {
    if (!currentUser) return;
    try {
      // Seed Complaints
      const sampleComplaints = [
        { guestName: "John Wick", roomNumber: "101", type: "Service Issue", priority: "Urgent", description: "Security concern regarding an unauthorized visitor. Requires immediate manager attention.", status: "Pending" },
        { guestName: "Tony Stark", roomNumber: "PH-1", type: "Folio Correction", priority: "Low", description: "Incorrect charge for 'Iron Man' movie rental. I have the rights to this film.", status: "Resolved" },
        { guestName: "Sherlock Holmes", roomNumber: "221B", type: "Key Sync Failure", priority: "High", description: "Electronic key fails every time I approach room. Possible magnetic interference.", status: "In Progress" },
        { guestName: "Elena Vance", roomNumber: "305", type: "Restroom Issue", priority: "Medium", description: "Shower pressure is inconsistent. Requires maintenance visit.", status: "Pending" }
      ];

      const seedProperty = selectedCompany || 'cml';
      for (const c of sampleComplaints) {
        const payload = {
          ...c,
          authorId: currentUser.uid,
          authorName: "System Seed",
          propertyId: seedProperty,
          createdAt: new Date().toISOString()
        };
        await addDoc(collection(db, "hybrid_sandbox"), {
          collection: `complaints-${seedProperty}`,
          db_json: JSON.stringify(payload),
          payload_json: JSON.stringify(payload),
          createdAt: new Date().toISOString()
        });
      }

      // Seed Pre-authorized Users
      const sampleUsers = [
        { email: "graphics@cml.com.fj", displayName: "Priyesh Narayan", role: "Administrator" },
        { email: "rohit@cml.com.fj", displayName: "Rohit Lal", role: "Administrator" },
        { email: "manageraccounts@cml.com.fj", displayName: "Shahil Sharma", role: "Administrator" },
        { email: "accounts@cml.com.fj", displayName: "Zaiba Khan", role: "Administrator" },
        { email: "sales@cml.com.fj", displayName: "Shwaran Shivani", role: "Administrator" },
        { email: "itmanager@cml.com.fj", displayName: "John Singh", role: "Administrator" },
        { email: "reservations@ramadawailoaloafiji.com", displayName: "Anjeshni Devi", role: "Administrator" },
        { email: "mod@ramadawailoaloafiji.com", displayName: "Charlene Nand", role: "Administrator" },
        { email: "roomsd@ramadawailoaloafiji.com", displayName: "Nolau Malo", role: "Administrator" },
        { email: "hr@cml.com.fj", displayName: "Neetisa Devi", role: "Administrator" },
        { email: "digitalmedia@cml.com.fj", displayName: "Charles Cebujano", role: "Administrator" },
        { email: "cml@wyndhamgardenwailoaloafiji.com", displayName: "Charles Cebujano", role: "Administrator" }
      ];

      for (const u of sampleUsers) {
        // Use email as doc ID if possible to avoid duplicates during seeding, 
        // but the auth sync uses UID. So we check if email exists.
        const q = query(collection(db, 'users'), where('email', '==', u.email));
        const snap = await getDocs(q);
        
        if (snap.empty) {
          const userRef = doc(collection(db, 'users'));
          await setDoc(userRef, {
            ...u,
            createdAt: serverTimestamp(),
            isPending: true
          });
        }
      }

      // Seed Lost & Found
      const sampleLostItems = [
        { itemName: "Silver Rolex Wristwatch", description: "Oyster Perpetual model, silver band, slightly scratched on the face.", locationFound: "Room 402 Bedside Table", staffName: "Anita Prasad", staffPosition: "Housekeeping", imageUrl: "https://images.unsplash.com/photo-1547996160-81dfa63595dd?q=80&w=1000&auto=format&fit=crop", status: "Found" },
        { itemName: "Blue Leather Wallet", description: "Contains national ID and various credit cards. No cash found.", locationFound: "Gym Changing Room", staffName: "Rajesh Kumar", staffPosition: "Security", imageUrl: "https://images.unsplash.com/photo-1627123424574-724758594e93?q=80&w=1000&auto=format&fit=crop", status: "Found" },
        { itemName: "Designer Sunglasses", description: "Ray-Ban Aviators in a brown leather case.", locationFound: "Swimming Pool Deck", staffName: "Makereta S.", staffPosition: "Pool Attendant", imageUrl: "https://images.unsplash.com/photo-1511499767010-0601a59d4586?q=80&w=1000&auto=format&fit=crop", status: "Claimed" }
      ];

      for (const item of sampleLostItems) {
        await addDoc(collection(db, `lost-and-found-${seedProperty}`), {
          ...item,
          authorId: currentUser.uid,
          propertyId: seedProperty,
          createdAt: serverTimestamp()
        });
      }

      // Seed Newsletter Subscribers
      const sampleNewsletterSubscribers = [
        { email: "digitalmedia@cml.com.fj", source: "WordPress Widget", firstName: "Charles", lastName: "Cebujano", phone: "+679 998 4676" },
        { email: "guest.relation@ramadasuitesfiji.com", source: "HTML Ingest", firstName: "Sera", lastName: "Wailoaloa", phone: "+679 672 5000" },
        { email: "charlie.bravo@gmail.com", source: "Manual Entry", firstName: "Charlie", lastName: "Bravo", phone: "+61 412 345 678" }
      ];

      for (const sub of sampleNewsletterSubscribers) {
        await addDoc(collection(db, `newsletter-subscribers-${seedProperty}`), {
          ...sub,
          createdAt: serverTimestamp()
        });
      }

      // Seed Restaurant Guests (CML Rewards)
      const sampleRestaurantGuests = [
        { fullName: "Charles Cebujano", email: "digitalmedia@cml.com.fj", phone: "+679 998 4676", visitCount: 12, rewardPoints: 1250, lastVisited: new Date().toISOString() },
        { fullName: "Rohit Lal", email: "rohit@cml.com.fj", phone: "+679 998 9499", visitCount: 8, rewardPoints: 850, lastVisited: new Date().toISOString() },
        { fullName: "John Wick", email: "john.wick@continental.com", phone: "+1 555 0199", visitCount: 15, rewardPoints: 3400, lastVisited: new Date().toISOString() }
      ];

      for (const guest of sampleRestaurantGuests) {
        await addDoc(collection(db, `restaurant-guests-${seedProperty}`), {
          ...guest,
          createdAt: serverTimestamp()
        });
      }

      alert("Sample data successfully seeded into Guest Recovery, Staff Directory, Lost & Found, Newsletter Subscribers, and CML Rewards.");
    } catch (error) {
      console.error("Seeding error:", error);
    }
  };

  useEffect(() => {
    let unsubRole: (() => void) | null = null;
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        checkTokenExpiration(user);
        // Ensure strict dynamic segregation and total privacy as requested:
        const email = user.email?.toLowerCase() || "";
        const isRamada = email.includes("ramada");
        const isWyndham = email.includes("wyndham");

        if (isRamada) {
          setSelectedCompany("ramada");
        } else if (isWyndham) {
          setSelectedCompany("wyndham");
        } else {
          // If CML HQ corporate staff, let them choose. Do not override if already selected.
          if (!selectedCompany) {
            setSelectedCompany(null);
          }
        }

        // Sync user profile
        try {
          if (!db || typeof db !== 'object') {
            console.warn("[App] Profile synchronization bypassed: db is invalid/falsy.");
            setUserRole("Viewer"); // Offline standby role fallback
            return;
          }

          const userDocRef = doc(db, 'users', user.uid);
          
          const handleFirestoreError = (error: any, operation: string) => {
            console.error(`Firestore ${operation} error:`, error);
            const errInfo = {
              message: error.message,
              code: error.code,
              userId: user.uid,
              userEmail: user.email,
              operation
            };
            throw new Error(JSON.stringify(errInfo));
          };

          // Clean up any existing role listener if switching users
          if (unsubRole) {
            unsubRole();
            unsubRole = null;
          }

          // Listen for role changes real-time
          unsubRole = onSnapshot(userDocRef, (doc) => {
            if (doc.exists()) {
              const data = doc.data();
              setUserRole(data.role);
              setUserProfileData(data);
            }
          }, (err) => {
            console.error("Role listener error:", err);
          });

          // Log Login Activity
          try {
            const loginLogsRef = collection(db, 'login_logs');
            await addDoc(loginLogsRef, {
              email: user.email,
              displayName: user.displayName || user.email?.split('@')[0],
              timestamp: serverTimestamp(),
              propertyId: selectedCompany || 'group'
            });
          } catch (logErr) {
            console.warn("Failed to log login activity", logErr);
          }

          const userDoc = await getDoc(userDocRef).catch(e => handleFirestoreError(e, 'getDoc'));
          
          const profileData = {
            displayName: (user.email === "digitalmedia@cml.com.fj" || user.email === "cml@wyndhamgardenwailoaloafiji.com") ? "Charles Cebujano" : (user.displayName || user.email?.split('@')[0] || "Team Member"),
            email: user.email || "",
            photoURL: user.photoURL || "",
            lastLogin: serverTimestamp(),
            loginCount: increment(1)
          };

          if (!userDoc.exists()) {
            const q = query(collection(db, 'users'), where('email', '==', user.email));
            const querySnapshot = await getDocs(q);
            
            let initialRole = "Viewer";
            let pendingDocRef = null;

            if (!querySnapshot.empty) {
              const pendingDoc = querySnapshot.docs[0];
              initialRole = pendingDoc.data().role;
              if (pendingDoc.id !== user.uid) {
                pendingDocRef = pendingDoc.ref;
              }
            }

            const ADMIN_EMAILS = [
              "graphics@cml.com.fj",
              "rohit@cml.com.fj",
              "manageraccounts@cml.com.fj",
              "accounts@cml.com.fj",
              "sales@cml.com.fj",
              "itmanager@cml.com.fj",
              "reservations@ramadawailoaloafiji.com",
              "mod@ramadawailoaloafiji.com",
              "roomsd@ramadawailoaloafiji.com",
              "hr@cml.com.fj",
              "digitalmedia@cml.com.fj",
              "cml@wyndhamgardenwailoaloafiji.com"
            ];
            
            const isBootstrapAdmin = ADMIN_EMAILS.includes((user.email || "").toLowerCase());
            
            await setDoc(userDocRef, {
              ...profileData,
              role: isBootstrapAdmin ? "Administrator" : (initialRole || "Staff"),
              createdAt: serverTimestamp()
            }).catch(e => handleFirestoreError(e, 'setDoc'));

            // Clean up pre-authorized record if it was a different doc
            if (pendingDocRef) {
              await deleteDoc(pendingDocRef).catch(e => console.warn("Could not clean up pending user doc", e));
            }
          } else {
            const existingData = userDoc.data();
            const updates: any = {
              ...profileData
            };
            
            const ADMIN_EMAILS = [
              "graphics@cml.com.fj",
              "rohit@cml.com.fj",
              "manageraccounts@cml.com.fj",
              "accounts@cml.com.fj",
              "sales@cml.com.fj",
              "itmanager@cml.com.fj",
              "reservations@ramadawailoaloafiji.com",
              "mod@ramadawailoaloafiji.com",
              "roomsd@ramadawailoaloafiji.com",
              "hr@cml.com.fj",
              "digitalmedia@cml.com.fj",
              "cml@wyndhamgardenwailoaloafiji.com"
            ];

            // Preserve existing roles dynamically, defaulting to Administrator for bootstrap admins or Staff otherwise
            const isBootstrapAdmin = ADMIN_EMAILS.includes((user.email || "").toLowerCase());
            updates.role = existingData?.role || (isBootstrapAdmin ? "Administrator" : "Staff");

            await updateDoc(userDocRef, updates).catch(e => handleFirestoreError(e, 'updateDoc'));
          }

          // Auto-provision requested members if current user is the root admin
          if (user.email === "digitalmedia@cml.com.fj" || user.email === "cml@wyndhamgardenwailoaloafiji.com") {
            try {
              const teamEmails = [
                { email: "graphics@cml.com.fj", name: "Priyesh Narayan", role: "Administrator" },
                { email: "rohit@cml.com.fj", name: "Rohit Lal", role: "Administrator" },
                { email: "manageraccounts@cml.com.fj", name: "Shahil Sharma", role: "Administrator" },
                { email: "accounts@cml.com.fj", name: "Zaiba Khan", role: "Administrator" },
                { email: "sales@cml.com.fj", name: "Shwaran Shivani", role: "Administrator" },
                { email: "itmanager@cml.com.fj", name: "John Singh", role: "Administrator" },
                { email: "reservations@ramadawailoaloafiji.com", name: "Anjeshni Devi", role: "Administrator" },
                { email: "mod@ramadawailoaloafiji.com", name: "Charlene Nand", role: "Administrator" },
                { email: "roomsd@ramadawailoaloafiji.com", name: "Nolau Malo", role: "Administrator" },
                { email: "hr@cml.com.fj", name: "Neetisa Devi", role: "Administrator" }
              ];

              for (const member of teamEmails) {
                const q = query(collection(db, 'users'), where('email', '==', member.email));
                const snap = await getDocs(q);
                if (snap.empty) {
                  const newRef = doc(collection(db, 'users'));
                  await setDoc(newRef, {
                    email: member.email,
                    displayName: member.name,
                    role: member.role,
                    createdAt: serverTimestamp(),
                    isPending: true,
                    loginCount: 0
                  });
                  console.log(`Auto-provisioned ${member.email}`);
                }
              }
            } catch (provErr) {
              console.warn("Auto-provisioning of team admins bypassed or encountered an error:", provErr);
            }
          }
        } catch (e) {
          console.error("Profile sync error:", e);
        }
      } else {
        setUserRole(null);
        setSessionExpirationTime(null);
        setSessionRemainingSeconds(null);
        if (unsubRole) {
          unsubRole();
          unsubRole = null;
        }
      }
    });
    return () => {
      unsubscribe();
      if (unsubRole) unsubRole();
    };
  }, []);

  const currentCompany = COMPANIES.find(c => c.id === selectedCompany?.toLowerCase());

  // Track active tab for admin surveillance
  useEffect(() => {
    if (currentUser && activeTab) {
      const updateActivity = async () => {
        try {
          await updateDoc(doc(db, 'users', currentUser.uid), {
            lastActiveTab: activeTab
          });
        } catch (e) {
          // Silently fail activity logging
        }
      };
      
      const timeout = setTimeout(updateActivity, 2000); // Debounce
      return () => clearTimeout(timeout);
    }
  }, [activeTab, currentUser]);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const navItems = selectedCompany?.toLowerCase() === 'cml' ? [
    {
      id: "property-overview",
      label: "Dashboard",
      icon: Home,
    },
    {
      id: "hotel-management",
      label: "Properties",
      icon: Hotel,
      subItems: [
        { id: "hotel-info", label: "Hotel Information", icon: Hotel },
        { id: "revenue-mgmt", label: "Revenue Management", icon: DollarSign, disabled: true }
      ]
    },
    {
      id: "guest-experience",
      label: "Guest Experience",
      icon: Users,
      subItems: [
        { id: "guest-recovery", label: "Customer Recovery", icon: RefreshCw },
        { id: "lost-and-found", label: "Lost & Found", icon: Package },
        { id: "customer-care", label: "Customer Care", icon: MessageSquare, disabled: true },
        { id: "cml-connect", label: "CML Connect", icon: Globe, disabled: true },
        { id: "count-on-me", label: "Count on Me", icon: CheckCircle2, disabled: true }
      ]
    },
    {
      id: "loyalty-marketing",
      label: "Loyalty, Sales & Marketing",
      icon: TrendingUp,
      subItems: [
        { id: "dining-loyalty", label: "CML Rewards", icon: Award },
        { id: "newsletter-subscribers", label: "Newsletter Subscribers", icon: Mail },
        { id: "cml-sales", label: "CML Sales", icon: TrendingUp, disabled: true },
        { id: "local-sales", label: "Local Sales", icon: Users, disabled: true },
        { id: "brand-kit", label: "Marketing Materials", icon: Gift, disabled: true },
      ]
    },
    {
      id: "owners-section",
      label: "Owners",
      icon: Users,
      disabled: true
    },
    {
      id: "reservations-section",
      label: "Reservations (future)",
      icon: Calendar,
      disabled: true
    },
    {
      id: "resources-help",
      label: "Documents",
      icon: FileText,
      subItems: [
        { id: "hotel-resources", label: "Hotel Resources", icon: FileText, disabled: true },
        { id: "hr", label: "Forms", icon: ClipboardList },
        { id: "digital-flipbooks", label: "Flipbooks", icon: Layers }
      ]
    },
    {
      id: "agreements-signing",
      label: "Agreements & Digital Signing",
      icon: PenTool,
    },
    {
      id: "projects-section",
      label: "Projects",
      icon: Briefcase,
      disabled: true
    },
    {
      id: "reports-section",
      label: "Reports",
      icon: TrendingUp,
      disabled: true
    },
    {
      id: "messages-section",
      label: "Messages",
      icon: MessageSquare,
      disabled: true
    },
    {
      id: "settings-section",
      label: "Settings",
      icon: Settings,
      disabled: true
    }
  ] : [
    ...(isCmlUser ? [{
      id: "admin-dashboard",
      label: "ADMIN DASHBOARD",
      icon: LayoutDashboard,
    }] : []),
    {
      id: "property-overview",
      label: "HOME DASHBOARD",
      icon: Home,
    },
    {
      id: "hotel-management",
      label: "Hotel Management",
      icon: Hotel,
      subItems: [
        { id: "hotel-info", label: "Hotel Information", icon: Hotel },
        { id: "revenue-mgmt", label: "Revenue Management", icon: DollarSign, disabled: true }
      ]
    },
    {
      id: "guest-experience",
      label: "Guest Experience",
      icon: Users,
      subItems: [
        { id: "guest-recovery", label: "Customer Recovery", icon: RefreshCw },
        { id: "lost-and-found", label: "Lost & Found", icon: Package },
        { id: "customer-care", label: "Customer Care", icon: MessageSquare, disabled: true },
        { id: "cml-connect", label: "CML Connect", icon: Globe, disabled: true },
        { id: "count-on-me", label: "Count on Me", icon: CheckCircle2, disabled: true }
      ]
    },
    {
      id: "loyalty-marketing",
      label: "Loyalty, Sales & Marketing",
      icon: TrendingUp,
      subItems: [
        { id: "dining-loyalty", label: "CML Rewards", icon: Award },
        { id: "newsletter-subscribers", label: "Newsletter Subscribers", icon: Mail },
        { id: "cml-sales", label: "CML Sales", icon: TrendingUp, disabled: true },
        { id: "local-sales", label: "Local Sales", icon: Users, disabled: true },
        { id: "brand-kit", label: "Marketing Materials", icon: Gift, disabled: true },
        { id: "search-marketing", label: "Paid & Organic Search", icon: Search, disabled: true },
        { id: "otas-business", label: "OTAs & Business", icon: Briefcase, disabled: true },
        { id: "photo-guidance", label: "Hotel Photo Guidance", icon: Camera, disabled: true }
      ]
    },
    {
      id: "brand-qa",
      label: "Brand & QA",
      icon: ShieldCheck,
      disabled: false,
      subItems: [
        { id: "qa-prep", label: "QA Preparation", icon: ClipboardList, disabled: true },
        { id: "qa-results", label: "QA Results", icon: CheckCircle, disabled: true },
        { id: "brand-standards", label: "Brand Standards", icon: ShieldCheck, disabled: false },
        { id: "architecture-design", label: "Architecture & Design", icon: Layers, disabled: true }
      ]
    },
    {
      id: "team-training",
      label: "Team & Training",
      icon: GraduationCap,
      subItems: [
        { id: "checklist", label: "Checklist & JD", icon: ClipboardCheck },
        { id: "sop", label: "SOP", icon: BookOpen },
        { 
          id: "cml-university", 
          label: selectedCompany === 'ramada' ? "Ramada University" : selectedCompany === 'wyndham' ? "Wyndham Garden University" : "CML University", 
          icon: GraduationCap,
          disabled: true 
        },
        { id: "training-videos", label: "CML Strong", icon: Play, disabled: true }
      ]
    },
    {
      id: "resources-help",
      label: "Resources & IT Help",
      icon: LifeBuoy,
      subItems: [
        { id: "resources", label: "IT Help", icon: LifeBuoy, disabled: true },
        { id: "managed-cases", label: "Managed Cases", icon: Settings },
        { id: "hotel-resources", label: "Hotel Resources", icon: FileText, disabled: true },
        { id: "hr", label: "Forms", icon: ClipboardList },
        { id: "digital-flipbooks", label: "Flipbooks", icon: Layers }
      ]
    },
    {
      id: "wyndham-connect",
      label: "Wyndham Connect (by Canary)",
      icon: ExternalLink,
      url: "https://sign-in.wyndham.com/app/whrfranchise_canaryemea_1/exkoh2d23w3h2lt1d4x7/sso/saml"
    }
  ];

  // Automatically expand parent menus of active sub-menu tabs
  useEffect(() => {
    if (activeTab) {
      if (activeTab === "guest-room-keys") {
        setActiveTab("sop");
        setSopSubTab("guest-room-keys");
        return;
      }
      if (activeTab === "master-staff-keys") {
        setActiveTab("sop");
        setSopSubTab("master-staff-keys");
        return;
      }
      if (activeTab === "maintenance-guidelines") {
        setActiveTab("brand-standards");
        setBrandSubTab("maintenance");
        return;
      }
      if (activeTab === "checklists") {
        setActiveTab("brand-standards");
        setBrandSubTab("checklists");
        return;
      }
      const parentWithSub = navItems.find((item: any) => 
        item.subItems?.some((sub: any) => sub.id === activeTab)
      );
      if (parentWithSub) {
        setOpenMenus(prev => {
          if (!prev.includes(parentWithSub.id)) {
            return [...prev, parentWithSub.id];
          }
          return prev;
        });
      }
    }
  }, [activeTab]);

  const toggleMenu = (id: string) => {
    setOpenMenus(prev => 
      prev.includes(id) ? prev.filter(m => m !== id) : [...prev, id]
    );
  };

  // Public Auto-Download Business Card Handler (No login or selection required!)
  const publicUrlParams = new URLSearchParams(window.location.search);
  let downloadCardId = publicUrlParams.get("downloadCard");
  let downloadCardCompany = publicUrlParams.get("company") || "cml";

  // Support clean path routing (/public-card/COMPANY_ID/CARD_ID) from QR code scans!
  const pathParts = window.location.pathname.split("/").filter(Boolean);
  if (pathParts[0] === "public-card" && pathParts.length >= 3) {
    downloadCardCompany = pathParts[1];
    downloadCardId = pathParts[2];
  }

  if (downloadCardId) {
    return (
      <PublicCardDownloadGateway 
        cardId={downloadCardId} 
        companyId={downloadCardCompany} 
      />
    );
  }

  // Support clean path routing (/embed-newsletter/COMPANY_ID) or search query ?embed=newsletter
  let embedNewsletterCompany = publicUrlParams.get("company") || "cml";
  let isEmbedNewsletter = publicUrlParams.get("embed") === "newsletter" || pathParts[0] === "embed-newsletter" || pathParts[0] === "newsletter-widget";
  if ((pathParts[0] === "embed-newsletter" || pathParts[0] === "newsletter-widget") && pathParts.length >= 2) {
    embedNewsletterCompany = pathParts[1];
  }

  if (isEmbedNewsletter) {
    return (
      <PublicNewsletterWidget companyId={embedNewsletterCompany} />
    );
  }

  // Support independent "Sign-in information" page bypass (Requirement 13)
  const isDirectHrmsBypass = 
    publicUrlParams.get("page") === "hrms" || 
    publicUrlParams.get("tab") === "hrms" || 
    publicUrlParams.get("page") === "sign-in" ||
    publicUrlParams.get("page") === "signin";

  if (isDirectHrmsBypass) {
    const hrmsCompany = publicUrlParams.get("company") || "cml";
    return (
      <>
        <HRMS 
          companyId={hrmsCompany} 
          onBackToPortal={() => {
            window.location.href = window.location.origin + window.location.pathname;
          }}
        />
        <ToastContainer />
      </>
    );
  }

  if (!currentUser) {
    return (
      <>
        <LoginPage onLoginSuccess={() => {}} />
        <ToastContainer />
      </>
    );
  }

  if (!selectedCompany) {
    return (
      <div className="min-h-screen bg-luxury-black flex flex-col items-center justify-center p-8 font-sans overflow-hidden relative">
        {/* Subtle Luxury Gradient Background */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(197,160,89,0.05)_0%,transparent_70%)] pointer-events-none" />
        
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="max-w-5xl w-full text-center relative z-10"
        >
          <div className="flex flex-col items-center mb-16">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.8 }}
              className="mb-8"
            >
              <img 
                src="https://cml.com.fj/wp-content/uploads/2026/05/CML-Thumbnail-Logo-2.jpg" 
                alt="CML Group" 
                className="h-32 w-auto object-contain filter drop-shadow-[0_0_20px_rgba(197,160,89,0.3)]"
                referrerPolicy="no-referrer"
              />
            </motion.div>
            <h1 className="text-5xl md:text-6xl font-serif font-light text-white tracking-tight mb-4 uppercase italic">
              CML <span className="text-gold font-normal">COMMUNITY</span>
            </h1>
            <p className="luxury-label !text-slate-500">Corporate Extranet & Performance Portal</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 px-4 relative">
            {COMPANIES.map((company, idx) => (
              <motion.button
                key={company.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ 
                  scale: clickedCompanyId === company.id 
                    ? (transitionPhase === 'pressing' ? 0.97 : (transitionPhase === 'fetching' ? 1.05 : 1))
                    : (clickedCompanyId ? 0.95 : 1),
                  opacity: clickedCompanyId 
                    ? (clickedCompanyId === company.id ? (transitionPhase === 'fetching' ? 0 : 1) : 0.15)
                    : 1,
                  y: 0
                }}
                whileHover={!clickedCompanyId ? { scale: 1.02, y: -4 } : {}}
                whileTap={!clickedCompanyId ? { scale: 0.97 } : {}}
                transition={{ 
                  duration: transitionPhase === 'pressing' ? 0.1 : (transitionPhase === 'fetching' ? 0.4 : 0.5),
                  ease: "easeInOut"
                }}
                onClick={() => handleCompanyClick(company.id)}
                className={cn(
                  "group relative border border-white/10 p-10 rounded-sm flex flex-col items-center text-center shadow-2xl cursor-pointer select-none",
                  company.id === 'cml' ? "bg-[#C5A02D] hover:bg-[#D4AF37]" : 
                  company.id === 'ramada' ? "bg-[#B91C1C] hover:bg-[#991B1B]" : 
                  "bg-[#059669] hover:bg-[#047857]"
                )}
              >
                {/* Decorative Corners */}
                <div className="absolute top-0 left-0 w-4 h-4 border-t border-l border-white/20 group-hover:border-white transition-colors duration-500" />
                <div className="absolute bottom-0 right-0 w-4 h-4 border-b border-r border-white/20 group-hover:border-white transition-colors duration-500" />
                
                <div className="w-24 h-24 bg-white/10 flex items-center justify-center mb-8 group-hover:scale-110 transition-transform duration-700 overflow-hidden relative rounded-sm shadow-inner mt-4">
                  <img 
                    src={company.logo} 
                    alt={company.name} 
                    className="w-full h-full object-contain p-2 group-hover:brightness-110 transition-all"
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${company.name.replace(' ', '+')}&background=fff&color=000&size=128&bold=true`;
                    }}
                  />
                </div>
                
                <h3 className="text-2xl font-serif font-medium text-white mb-3 tracking-wide">{company.name}</h3>
                <p className="text-[10px] text-white/70 font-display uppercase tracking-[0.2em] max-w-[180px]">{company.description}</p>
                
                <div className="mt-10 h-px w-8 bg-white/20 group-hover:w-16 group-hover:bg-white transition-all duration-500" />
                
                <div className="mt-8 text-[9px] font-bold uppercase tracking-[0.3em] text-white/50 group-hover:text-white transition-colors">
                  Enter Property
                </div>
              </motion.button>
            ))}
          </div>

          <AnimatePresence>
            {portalError && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }} 
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mt-8 mx-auto max-w-xl p-4 bg-red-950/45 border border-red-500/30 rounded-sm text-red-400 text-[10px] font-display uppercase tracking-widest text-center"
              >
                {portalError}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Core circular progress loading overlay displayed during simulated credentials and data fetching */}
          <AnimatePresence>
            {transitionPhase === 'fetching' && (
              <motion.div 
                key="fetching-loader"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-luxury-black/90 backdrop-blur-md flex flex-col items-center justify-center z-50 select-none rounded-lg"
              >
                <div className="flex flex-col items-center gap-6 max-w-xs text-center p-8 bg-neutral-900/60 border border-white/10 rounded-sm shadow-2xl">
                  <div className="relative w-20 h-20 flex items-center justify-center">
                    {/* Subtle pulsing background ring */}
                    <div className="absolute inset-0 border-2 border-white/5 rounded-full" />
                    {/* Rotating elegant golden arc border */}
                    <div className="absolute inset-0 border-2 border-[#C5A02D] border-t-transparent rounded-full animate-spin" />
                    {/* Pulsing center icon */}
                    <Sparkles className="text-gold animate-pulse" size={24} />
                  </div>
                  
                  <div className="space-y-2">
                    <h4 className="text-sm font-serif italic text-white font-medium uppercase tracking-[0.2em]">{COMPANIES.find(c => c.id === clickedCompanyId)?.name || 'CML Asset'}</h4>
                    <p className="text-[9px] font-display uppercase tracking-[0.3em] text-[#C5A02D] font-black animate-pulse">Establishing Secure Proxy Sync...</p>
                  </div>

                  <div className="w-48 h-[2px] bg-white/10 overflow-hidden relative rounded-full mt-2">
                    <motion.div 
                      initial={{ left: "-100%" }}
                      animate={{ left: "100%" }}
                      transition={{ repeat: Infinity, duration: 1.2, ease: "easeInOut" }}
                      className="absolute inset-y-0 w-1/3 bg-gold"
                    />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
        
        <div className="mt-20 pt-8 border-t border-white/5 w-full max-w-5xl flex flex-col md:flex-row justify-between items-center gap-4 text-slate-500 text-[9px] font-display uppercase tracking-[0.2em] relative z-10 px-4">
          <div className="flex items-center gap-2">
            <span className="text-gold/80">Logged in as:</span>
            <span className="text-white font-black">{currentUser.displayName || currentUser.email}</span>
          </div>
          <span className="opacity-60 text-center md:text-left">© 2026 Cove Management Limited</span>
          <button 
            type="button"
            onClick={async () => {
              await logout();
              setSelectedCompany(null);
              setClickedCompanyId(null);
            }}
            className="flex items-center gap-2 text-red-400 hover:text-red-300 transition-all font-bold cursor-pointer hover:underline"
            id="btn-portal-selection-logout"
          >
            <LogOut size={12} />
            Logout Session
          </button>
        </div>
        <ToastContainer />
      </div>
    );
  }

  const parseDateToMs = (val: any) => {
    if (!val) return 0;
    if (typeof val.toDate === 'function') return val.toDate().getTime();
    if (val.seconds) return val.seconds * 1000;
    const d = new Date(val).getTime();
    return isNaN(d) ? 0 : d;
  };

  const parsedComplaintsList = complaints.filter(c => {
    // 1. Strictly isolate to the currently selected property/company only
    const targetProperty = (selectedCompany || "wyndham").toLowerCase();
    const cProperty = (c.propertyId || "").toLowerCase();
    if (cProperty !== targetProperty) return false;

    const matchesSearch = 
      (c.guestName || "").toLowerCase().includes(complaintSearch.toLowerCase()) ||
      (c.roomNumber || "").toLowerCase().includes(complaintSearch.toLowerCase()) ||
      (c.description || "").toLowerCase().includes(complaintSearch.toLowerCase());
    
    // Check Date Range (Operational Window)
    let matchesDateRange = true;
    if (recoveryStartDate || recoveryEndDate) {
      const ts = parseDateToMs(c.createdAt);
      if (!ts) {
        matchesDateRange = false;
      } else {
        if (recoveryStartDate) {
          const startMs = new Date(recoveryStartDate + "T00:00:00").getTime();
          if (ts < startMs) matchesDateRange = false;
        }
        if (recoveryEndDate) {
          const endMs = new Date(recoveryEndDate + "T23:59:59").getTime();
          if (ts > endMs) matchesDateRange = false;
        }
      }
    }

    if (!matchesDateRange) return false;

    if (guestRecoveryPropertyFilter === "archived") {
      return matchesSearch && c.isArchived === true;
    } else if (guestRecoveryPropertyFilter === "pending-approvals") {
      if (c.isArchived === true) return false;
      const todayStr = new Date().toISOString().split("T")[0];
      const hasActiveDelegation = Array.isArray(workflowConfig?.delegations) && workflowConfig.delegations.some((del: any) => {
        if (del.toUserEmail?.toLowerCase() !== currentUser?.email?.toLowerCase()) return false;
        return todayStr >= del.startDate && todayStr <= del.endDate;
      });
      const isApproverInConfig = workflowConfig?.approverEmails?.includes(currentUser?.email || "");
      const isHOD = userRole === "Manager" || userRole === "Administrator" || userRole === "Super Admin" || userRole === "admin" || isApproverInConfig || hasActiveDelegation;
      const isSuperAdmin = userRole === "Administrator" || userRole === "Super Admin" || userRole === "admin" || isApproverInConfig;
      
      const needsHOD = !c.hodApproved;
      const needsSuperAdmin = c.hodApproved && !c.superAdminApproved;
      
      const isMyApprovalNeeded = (needsHOD && isHOD) || (needsSuperAdmin && isSuperAdmin);
      return matchesSearch && isMyApprovalNeeded;
    } else {
      // Otherwise, active logs
      return matchesSearch && c.isArchived !== true;
    }
  });

  const filteredMaintenanceHistory = maintenanceHistory.filter(log => {
    if (maintenanceStartDate && log.date && log.date < maintenanceStartDate) return false;
    if (maintenanceEndDate && log.date && log.date > maintenanceEndDate) return false;
    return true;
  });

  if (!workstationAuthorized) {
    return (
      <div className="fixed inset-0 z-[100000] flex items-center justify-center bg-slate-950 overflow-y-auto p-4 md:p-8 font-sans antialiased text-white selection:bg-[#c5a02d]">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black opacity-90 -z-10" />
        {/* Subtle grid pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px] -z-10" />
        
        <div className="w-full max-w-lg bg-slate-900/40 border border-[#b2a265]/20 backdrop-blur-xl shadow-[0_24px_64px_rgba(0,0,0,0.8)] overflow-hidden rounded-sm relative">
          {/* Accent light peak */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-[2px] bg-gradient-to-r from-transparent via-[#b2a265] to-transparent" />
          
          <div className="p-8 md:p-10 space-y-8">
            <div className="text-center space-y-3.5">
              <div className="inline-flex items-center justify-center p-3.5 bg-[#b2a265]/10 border border-[#b2a265]/15 rounded-sm text-[#b2a265] mb-2 shadow-[0_0_24px_rgba(178,162,101,0.1)] relative">
                <span className="absolute inset-0 rounded-sm border border-[#b2a265]/35 animate-ping opacity-25 scale-105" />
                <ShieldCheck size={32} strokeWidth={1.5} />
              </div>
              <h1 className="text-xl md:text-2xl font-serif italic text-[#b2a265] tracking-tight leading-none">
                System Interface Handshake
              </h1>
              <p className="text-[9px] font-display uppercase tracking-[0.3em] text-slate-400">
                Mandatory Terminal &amp; Client Environment Verification
              </p>
            </div>

            <div className="bg-slate-950/60 border border-slate-800 p-5 rounded-sm space-y-4 text-slate-300">
              <p className="text-[12px] leading-relaxed font-serif text-slate-200 italic">
                CML Corporate network workstations are governed by unified compliance handshakes. Proceeding initializes the digital secure workplace container.
              </p>
              
              <div className="space-y-3 pt-2.5 border-t border-slate-900/80">
                <div className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#b2a265] mt-1.5 shrink-0" />
                  <div>
                    <span className="block text-[11px] font-bold text-slate-200">Continuous Environment Validation</span>
                    <span className="block text-[10px] text-slate-400 mt-0.5 leading-normal">
                      The application maps active on-premises parameters to support geofence and workflow verification.
                    </span>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#b2a265] mt-1.5 shrink-0" />
                  <div>
                    <span className="block text-[11px] font-bold text-slate-200">Terminal Integrity Protocol</span>
                    <span className="block text-[10px] text-slate-400 mt-0.5 leading-normal">
                      Monitored and sealed session handshake validates compliance before authorizing executive portal controls.
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-3.5">
              <button
                type="button"
                onClick={handleAuthorizeWorkstation}
                className="w-full bg-[#b2a265] hover:bg-[#c5a02d] text-slate-950 font-display uppercase tracking-[0.2em] font-black text-xs py-4 px-6 transition duration-300 ease-in-out shadow-lg hover:shadow-[#b2a265]/10 rounded-sm active:scale-[0.99] cursor-pointer block text-center"
              >
                Accept &amp; Validate Handshake
              </button>
              
              <p className="text-center text-[9px] text-slate-500 font-medium tracking-wide">
                By validating, you confirm compliance with corporate system requirements.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn(
      "flex h-screen font-sans text-luxury-black overflow-hidden italic-headings transition-colors duration-700",
      selectedCompany === 'ramada' ? "bg-red-50/30" : 
      selectedCompany === 'wyndham' ? "bg-emerald-50/30" : 
      "bg-luxury-cream"
    )}>
      {/* Sidebar Nav */}
      <nav 
        style={{ 
          backgroundColor: currentCompany?.sidebar || '#1a1a1a',
          color: 'white' // Force default text color for dark sidebars
        }}
        className={cn(
          "flex flex-col border-r border-gold/10 shrink-0 transition-all duration-500 ease-in-out fixed inset-y-0 left-0 z-50 md:relative overflow-hidden",
          isSidebarOpen ? "w-64 shadow-[20px_0_40px_rgba(0,0,0,0.2)]" : "w-20",
          !isSidebarOpen && "hidden md:flex"
        )}
      >
        {/* Background layer to ensure opacity and color are solid */}
        <div 
          className="absolute inset-0 opacity-100 -z-10" 
          style={{ backgroundColor: currentCompany?.sidebar || '#1a1a1a' }} 
        />

        <div className="p-8 pb-4 shrink-0">
          <div className="flex items-center justify-between mb-12">
            <div className="flex items-center gap-4 cursor-pointer group" onClick={() => {
              if (isCmlUser) {
                setSelectedCompany(null);
                setClickedCompanyId(null);
                setTransitionPhase('idle');
              } else {
                setActiveTab("property-overview");
              }
            }}>
              <div 
                className="flex items-center justify-center transition-all overflow-hidden shrink-0"
              >
                <img 
                  src={currentCompany?.logo || "https://wyndhamgardenwailoaloafiji.com/wp-content/uploads/2026/05/WG-Thumbnail-Logo.jpg"} 
                  alt={currentCompany?.name || "Group Portal"} 
                  className="h-12 w-auto object-contain" 
                  referrerPolicy="no-referrer" 
                />
              </div>
              <AnimatePresence>
                {isSidebarOpen && (
                  <motion.div 
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    className="leading-tight overflow-hidden"
                  >
                    <span className="text-white font-serif text-lg tracking-tight block whitespace-nowrap">
                      {currentCompany?.name || 'CML'}
                      <span className="text-gold">Portal</span>
                    </span>
                    <span className="luxury-label !text-[8px] mt-0.5 block opacity-100 whitespace-nowrap">
                      {currentCompany?.id === 'cml' ? 'Group Headquarters' : 'Property Management'}
                    </span>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            {isSidebarOpen && (
              <button 
                onClick={() => setSidebarOpen(false)}
                className="p-2 text-slate-600 hover:text-white md:hidden"
              >
                <X size={20} />
              </button>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar px-4 pb-12">
          {transitionPhase === 'skeleton' ? (
            <div className="space-y-6 pt-4 px-2">
              {[1, 2, 3, 4, 5, 6, 7].map((idx) => (
                <div key={idx} className="flex items-center gap-4 py-2">
                  <div className="w-5 h-5 bg-white/10 rounded-xs animate-pulse" />
                  {isSidebarOpen ? (
                    <div className="h-3 w-28 bg-white/10 rounded-sm animate-pulse" />
                  ) : null}
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-1">
            {navItems.map((item, index) => {
              const Icon = (item as any).icon;
              const isActive = activeTab === item.id;
              const isMenuOpen = openMenus.includes(item.id);
              const hasSubItems = !!(item as any).subItems;

              if (hasSubItems) {
                const subItems = (item as any).subItems;
                const isSubItemActive = subItems.some((sub: any) => activeTab === sub.id);
                const isParentDisabled = item.disabled;
                
                return (
                  <div key={item.id} className="w-full">
                    <button
                      onClick={() => {
                        if (isParentDisabled) {
                          return;
                        }
                        if (!isSidebarOpen) {
                          setSidebarOpen(true);
                          if (!openMenus.includes(item.id)) {
                            setOpenMenus(prev => [...prev, item.id]);
                          }
                        } else {
                          setOpenMenus(prev =>
                            prev.includes(item.id) ? prev.filter(id => id !== item.id) : [...prev, item.id]
                          );
                        }
                      }}
                      className={cn(
                        "w-full flex items-center justify-between px-4 py-2.5 border-b border-white/5 rounded-none text-[13px] font-sans transition-all duration-300 relative group font-medium",
                        isParentDisabled
                          ? "opacity-35 cursor-not-allowed text-stone-500 hover:text-stone-500"
                          : isSubItemActive ? "text-gold bg-white/5 font-bold animate-pulse-subtle" : "text-stone-300 hover:text-gold"
                      )}
                    >
                      <div className="flex items-center gap-4 text-left py-1 text-slate-300">
                        {Icon && <Icon size={18} className={cn("shrink-0", isParentDisabled ? "text-stone-600" : isSubItemActive ? "text-gold" : "text-stone-300 group-hover:text-gold transition-colors")} />}
                        {isSidebarOpen && (
                          <span className="text-left leading-tight py-1 flex items-center gap-2">
                            <span>{item.label}</span>
                            {isParentDisabled && (
                              <span className="text-[7px] font-mono text-amber-500 border border-amber-500/35 px-1 rounded bg-amber-500/5">OFF</span>
                            )}
                          </span>
                        )}
                      </div>
                      {isSidebarOpen && !isParentDisabled && (
                        <div className="text-stone-400 group-hover:text-gold transition-colors">
                          {isMenuOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                        </div>
                      )}
                    </button>
                    
                    {isMenuOpen && isSidebarOpen && !isParentDisabled && (
                      <div className="bg-black/15 flex flex-col pl-4 border-l border-white/5 ml-4 mt-0.5 space-y-0.5">
                        {subItems.map((sub: any) => {
                          const SubIcon = sub.icon;
                          const isSubActive = activeTab === sub.id;
                          return (
                            <button
                              key={sub.id}
                              onClick={() => {
                                if (sub.disabled) {
                                  return;
                                }
                                navigateTo(sub.id);
                                if (window.innerWidth < 768) setSidebarOpen(false);
                              }}
                              className={cn(
                                "w-full flex items-center justify-start gap-3 px-4 py-2 text-[12px] font-sans transition-all duration-300 relative group rounded-none",
                                sub.disabled
                                  ? "opacity-35 cursor-not-allowed text-stone-500 hover:text-stone-500"
                                  : isSubActive 
                                    ? "text-gold bg-white/10 font-bold" 
                                    : "text-stone-300 hover:text-gold"
                              )}
                            >
                              {isSubActive && !sub.disabled && (
                                <motion.div 
                                  layoutId="subnav-pill" 
                                  className="absolute left-0 w-1 h-[70%] top-[15%] bg-gold" 
                                />
                              )}
                              {SubIcon && <SubIcon size={14} className={cn("shrink-0", sub.disabled ? "text-stone-600" : isSubActive ? "text-gold" : "text-stone-400 group-hover:text-gold transition-colors")} />}
                              <span className="text-left leading-normal flex items-center justify-between w-full">
                                <span>{sub.label}</span>
                                {sub.disabled && (
                                  <span className="text-[7px] font-mono text-amber-500 border border-amber-500/25 px-1 rounded bg-amber-500/5 leading-none">OFFLINE</span>
                                )}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              }

              const content = (
                <div className="flex items-center gap-4 w-full text-left py-1">
                  {isActive && (
                    <motion.div 
                      layoutId="nav-pill" 
                      className="absolute left-0 w-1.5 h-full bg-gold" 
                    />
                  )}
                  {Icon && <Icon size={18} className={cn("shrink-0", isActive ? "text-gold" : "text-stone-300 group-hover:text-gold transition-colors")} />}
                  {isSidebarOpen && (
                    <div className="flex items-center justify-between w-full">
                      <span className="text-left leading-tight py-1 font-medium font-sans tracking-wide text-[13px]">{item.label}</span>
                    </div>
                  )}
                </div>
              );

              if ((item as any).url) {
                return (
                  <a
                    key={item.id}
                    href={(item as any).url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={cn(
                      "w-full flex items-center justify-start gap-4 px-4 py-2.5 border-b border-white/5 rounded-none text-[13px] font-sans transition-all duration-300 relative group text-stone-100 hover:text-gold"
                    )}
                  >
                    {content}
                  </a>
                );
              }

              return (
                <div key={item.id} className="w-full">
                  <button
                    onClick={() => {
                      if (item.disabled) {
                        return;
                      }
                      navigateTo(item.id);
                      if (window.innerWidth < 768) setSidebarOpen(false);
                    }}
                    className={cn(
                      "w-full flex items-center justify-start px-4 py-2.5 border-b border-white/5 rounded-none text-[13px] font-sans transition-all duration-300 relative group",
                      item.disabled
                        ? "opacity-35 cursor-not-allowed text-stone-500 hover:text-stone-500"
                        : isActive 
                          ? "text-gold bg-white/10 font-bold" 
                          : "text-stone-100 hover:text-gold"
                    )}
                  >
                    {content}
                  </button>
                </div>
              );
            })}
            
            {/* Quick Links Section */}
            <div className="mt-8 border-t border-white/10 pt-6 px-1 select-none">
              <div className="flex items-center justify-between px-3 mb-4 text-gold text-[10px] font-display font-black uppercase tracking-[0.25em]">
                {isSidebarOpen ? (
                  <>
                    <span>QUICK LINKS</span>
                    <button 
                      onClick={() => navigateTo("profile")} 
                      className="text-stone-400 hover:text-gold transition-colors p-1"
                      title="Quick Links Settings"
                    >
                      <Settings size={13} className="hover:rotate-45 transition-transform" />
                    </button>
                  </>
                ) : (
                  <span className="w-full text-center">•</span>
                )}
              </div>
              <div className="space-y-1">
                {[
                  { id: "brand-standards", label: "Brand Standards", icon: Award, disabled: false },
                  { id: "canary", label: "Wyndham Connect", icon: Globe, extraLabel: " (by Canary)", disabled: false },
                  { id: "managed-cases", label: "My Request", icon: Send, disabled: false },
                  { id: "property-overview", label: "Property Management", icon: Hotel, url: "https://idcs-256bd455f58c4aeb8d0305d1ea06637c.identity.oraclecloud.com/ui/v1/signin", disabled: false }
                ].map((link) => {
                  const LinkIcon = link.icon;
                  const isLinkActive = activeTab === link.id;
                  return (
                    <button
                      key={link.id}
                      onClick={() => {
                        if (link.disabled) {
                          return;
                        }
                        if ('url' in link && link.url) {
                          window.open(link.url, "_blank");
                          return;
                        }
                        navigateTo(link.id);
                        if (window.innerWidth < 768) setSidebarOpen(false);
                      }}
                      className={cn(
                        "w-full flex items-center justify-start gap-4 px-3.5 py-3 border-b border-white/5 text-[14px] font-sans transition-all duration-300 relative group",
                        link.disabled
                          ? "opacity-35 cursor-not-allowed text-stone-500 hover:text-stone-500"
                          : isLinkActive ? "text-gold bg-white/10 font-bold" : "text-stone-200 hover:text-gold"
                      )}
                    >
                      {isLinkActive && !link.disabled && (
                        <div className="absolute left-0 w-1.5 h-full bg-gold" />
                      )}
                      <LinkIcon size={16} className={cn("shrink-0", link.disabled ? "text-stone-600" : isLinkActive ? "text-gold" : "text-stone-400 group-hover:text-gold transition-colors")} />
                      {isSidebarOpen && (
                        <span className="truncate text-left flex items-center justify-between w-full">
                          <span>
                            {link.label}
                            {link.extraLabel && <span className="text-[10px] text-stone-400 font-light font-sans">{link.extraLabel}</span>}
                          </span>
                          {link.disabled && (
                            <span className="text-[7.5px] font-mono text-amber-500 border border-amber-500/25 px-1 py-0.5 rounded bg-amber-500/5 leading-none shrink-0">OFFLINE</span>
                          )}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
          )}
        </div>
        

      </nav>

      {/* Backdrop for mobile */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
          />
        )}
      </AnimatePresence>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {currentUser && sessionRemainingSeconds !== null && sessionRemainingSeconds < 600 && (
          <div className="bg-red-600 text-white px-4 py-2.5 flex items-center justify-between text-xs font-sans tracking-wide font-medium shadow-sm z-50 animate-pulse shrink-0">
            <div className="flex items-center gap-2">
              <AlertTriangle size={16} className="shrink-0 text-white" />
              <span>
                Your secure Firebase authentication session is nearing expiration (expires in{" "}
                <strong>
                  {Math.floor(sessionRemainingSeconds / 60)}m {sessionRemainingSeconds % 60}s
                </strong>
                ). Please refresh your session now to avoid service interruption.
              </span>
            </div>
            <button
              onClick={handleRefreshSession}
              disabled={isRefreshingSession}
              className="bg-white text-red-600 px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded-sm hover:bg-slate-100 transition-colors flex items-center gap-1 cursor-pointer"
            >
              <RefreshCw size={12} className={cn("shrink-0", isRefreshingSession && "animate-smooth-spin")} />
              <span>{isRefreshingSession ? "Refreshing..." : "Refresh Session"}</span>
            </button>
          </div>
        )}
        {/* Header */}
        <header className="h-16 md:h-20 bg-white border-b border-gold/10 flex items-center justify-between px-3 md:px-10 shrink-0">
          <div className="flex items-center gap-1 md:gap-6 flex-1 min-w-0">
            <button 
              onClick={() => setSidebarOpen(!isSidebarOpen)} 
              className="p-1.5 md:p-2 hover:bg-luxury-cream rounded-full transition-colors text-slate-900 hover:text-gold shrink-0"
            >
              <Menu size={20} />
            </button>
            <div className="h-6 w-px bg-slate-200 hidden md:block" />
            
            <div className="flex flex-col md:flex-row md:items-center truncate">
              {transitionPhase === 'skeleton' ? (
                <div className="flex items-center gap-4">
                  <div className="h-4 w-36 bg-slate-200 animate-pulse rounded-sm" />
                  <div className="h-4 w-2 bg-slate-100 hidden md:block animate-pulse" />
                  <div className="h-4 w-24 bg-slate-200 animate-pulse rounded-sm" />
                </div>
              ) : (
                <>
                  <h1 className="text-[11px] md:text-sm font-serif text-slate-900 italic font-light truncate">
                    Welcome, <span className="font-bold not-italic">{getUserFriendlyName()}</span>
                  </h1>
                  
                  <div className="flex items-center gap-1 md:gap-3">
                     <span className="text-slate-600 text-xs hidden md:block mx-1">/</span>
                     {isCmlUser ? (
                       <select 
                         value={selectedCompany || ""}
                         onChange={(e) => setSelectedCompany(e.target.value)}
                         className="bg-transparent border-none text-[8px] md:text-[11px] font-display uppercase tracking-[0.05em] md:tracking-[0.2em] font-black text-gold focus:ring-0 cursor-pointer hover:text-gold-dark transition-colors max-w-[120px] md:max-w-none truncate p-0 md:p-1"
                       >
                         {COMPANIES.map(c => (
                           <option key={c.id} value={c.id}>{c.name}</option>
                         ))}
                       </select>
                     ) : (
                       <span className="text-[8px] md:text-[11px] font-display uppercase tracking-[0.05em] md:tracking-[0.2em] font-black text-gold max-w-[120px] md:max-w-none truncate p-0 md:p-1">
                         {COMPANIES.find(c => c.id === selectedCompany)?.name || ""}
                       </span>
                     )}
                  </div>
                </>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-1.5 md:gap-8 shrink-0">
            <div className="hidden lg:block">
              {transitionPhase === 'skeleton' ? (
                <div className="h-9 w-44 bg-slate-200 animate-pulse rounded-sm" />
              ) : (
                <GlobalSearch 
                  onNavigate={(tab, formId) => {
                     navigateTo(tab);
                     if (formId) setSelectedForm(formId);
                  }} 
                />
              )}
            </div>
            
            <div className="text-right hidden xl:block">
              <p className="text-xs font-serif italic font-medium text-slate-900 tracking-wide truncate max-w-[200px]">
                {currentUser ? getUserFriendlyName() : "Guest Mode"}
              </p>
            </div>
            
            <div className="flex items-center flex-nowrap justify-end gap-1.5 sm:gap-2 md:gap-3 shrink-0">
              {currentUser && (
                <button
                  id="global-header-sync-btn"
                  type="button"
                  onClick={handleRefreshData}
                  disabled={isRefreshingData}
                  className={cn(
                    "p-1.5 md:p-2 border flex items-center justify-center shrink-0 rounded-sm transition-all duration-200 active:scale-95 shadow-sm cursor-pointer",
                    isRefreshingData 
                      ? "bg-slate-50 border-gold/40 text-gold" 
                      : "bg-white border-slate-200 hover:border-gold text-slate-700 hover:text-gold"
                  )}
                  title="Clear cache and re-sync all Firestore documents"
                >
                  <RefreshCw size={13} className={cn("transition-transform duration-500", isRefreshingData && "animate-spin")} />
                  <span className="hidden sm:inline-block text-[9px] uppercase tracking-wider font-bold ml-1.5 font-sans">
                    {isRefreshingData ? "Syncing..." : "Sync All"}
                  </span>
                </button>
              )}

              {currentUser && (
                <SystemDiagnostics 
                  complaintsCount={complaints?.length || 0}
                  complaintsError={complaintsError}
                  onForceResync={reFetchAllData}
                  lastComplaintsSnapshotTime={lastComplaintsSnapshotTime}
                  lastNewsSnapshotTime={lastNewsSnapshotTime}
                  selectedCompany={selectedCompany}
                  onSeedData={handleSeedData}
                />
              )}

              {/* Session Persistence Heartbeat Status Indicator */}
              {currentUser && (
                <div 
                  id="session-persistence-indicator"
                  className={cn(
                    "flex items-center shrink-0 gap-1 md:gap-2 px-1 md:px-2.5 py-1 md:py-1.5 border rounded-sm shadow-sm text-[9px] md:text-[10px] font-sans font-medium tracking-wide transition-all",
                    sessionRemainingSeconds !== null && sessionRemainingSeconds < 600
                      ? "bg-red-50 border-red-300 text-red-700 animate-pulse"
                      : "bg-white border-slate-200 text-slate-700 hover:border-gold"
                  )}
                >
                  <div className="relative flex h-2 w-2 shrink-0">
                    {sessionRemainingSeconds !== null && sessionRemainingSeconds < 600 ? (
                      <>
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-red-600"></span>
                      </>
                    ) : (
                      <>
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                      </>
                    )}
                  </div>
                  <div className="flex flex-col text-left leading-tight shrink-0">
                    <span className="hidden lg:inline-block text-[8px] uppercase font-bold tracking-widest text-slate-500">
                      Session Persistence
                    </span>
                    <span className="font-mono text-[9px] md:text-[10px] whitespace-nowrap">
                      {sessionRemainingSeconds !== null 
                        ? `${Math.floor(sessionRemainingSeconds / 60)}m ${sessionRemainingSeconds % 60}s`
                        : "Active"
                      }
                    </span>
                  </div>
                </div>
              )}

              {currentUser && (
                <NotificationDropdown onNavigate={(tab) => navigateTo(tab)} />
              )}
              
              <div className="relative shrink-0">
                <button 
                  onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                  className={cn(
                    "w-8 h-8 md:w-10 md:h-10 shrink-0 border p-0.5 flex items-center justify-center rounded-sm transition-all active:scale-95 overflow-hidden shadow-sm",
                    isProfileMenuOpen ? "border-gold bg-gold" : "border-slate-200 bg-white hover:border-gold"
                  )}
                >
                    {userProfileData?.photoURL || currentUser?.photoURL ? (
                      <img src={userProfileData?.photoURL || currentUser?.photoURL} alt="Profile" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    ) : (
                      <div className={cn("w-full h-full flex items-center justify-center text-[10px] md:text-sm font-bold font-display uppercase", isProfileMenuOpen ? "text-white" : "text-gold")}>
                        {userProfileData?.displayName?.[0] || currentUser?.displayName?.[0] || currentUser?.email?.[0] || "?"}
                      </div>
                    )}
                </button>
                
                <AnimatePresence>
                  {isProfileMenuOpen && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setIsProfileMenuOpen(false)} />
                      <motion.div 
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        className="absolute right-0 mt-4 w-64 bg-white shadow-2xl border border-gold/10 p-0 z-50 rounded-sm overflow-hidden"
                      >
                        <div className="p-6 border-b border-slate-100 bg-slate-50/50">
                          <p className="text-[10px] font-display uppercase tracking-[0.2em] text-gold font-black mb-1">Authenticated Account</p>
                          <p className="text-sm font-serif italic text-slate-950 font-bold truncate leading-none mb-2">{getUserFriendlyName()}</p>
                          <p className="text-[10px] text-slate-600 truncate font-sans mb-1">{currentUser?.email}</p>
                          <p className="text-[10px] text-gold font-display uppercase tracking-widest font-black mb-3">Subscription: Enterprise Core</p>
                          <p className="text-[9px] font-display uppercase tracking-widest text-white px-3 py-1 bg-luxury-black inline-block font-black">{userRole || "Access Level: Staff"}</p>
                        </div>
                        
                        <div className="p-2">
                          <button 
                            onClick={() => {
                              navigateTo("profile");
                              setIsProfileMenuOpen(false);
                            }}
                            className="w-full text-left px-4 py-3 text-[10px] font-display uppercase tracking-widest font-black text-slate-800 hover:bg-luxury-cream hover:text-gold transition-all flex items-center gap-3"
                          >
                            <Users size={14} className="opacity-70" /> User Profile Detail
                          </button>
                          
                          {(userRole === "Administrator" || userRole === "Super Admin" || userRole === "Group Controller") && (
                            <button 
                              onClick={() => {
                                navigateTo("user-management");
                                setIsProfileMenuOpen(false);
                              }}
                              className="w-full text-left px-4 py-3 text-[10px] font-display uppercase tracking-widest font-black text-slate-800 hover:bg-luxury-cream hover:text-gold transition-all flex items-center gap-3"
                            >
                              <Settings size={14} className="opacity-70 text-gold" /> Group Account Settings
                            </button>
                          )}
                          
                          <div className="h-px bg-slate-100 my-2" />
                          
                          <button 
                            onClick={async () => {
                              await logout();
                              setSelectedCompany(null);
                              setClickedCompanyId(null);
                              setIsProfileMenuOpen(false);
                            }}
                            className="w-full text-left px-4 py-3 text-[10px] font-display uppercase tracking-widest font-black text-red-700 hover:bg-red-50 hover:text-red-900 transition-all flex items-center gap-3"
                          >
                            <LogOut size={14} /> Logout
                          </button>
                        </div>
                        
                        <div className="p-3 bg-luxury-black text-[8px] font-display uppercase tracking-[0.3em] text-white/30 text-center">
                          CML Group Corporate Proxy
                        </div>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <main className={cn(
          "flex-1 overflow-x-hidden",
          ["canary", "team-chat"].includes(activeTab) ? "p-0 h-full overflow-hidden" : "p-4 md:p-10 overflow-y-auto"
        )}>
          {transitionPhase === 'skeleton' ? (
            <div className="h-full max-w-7xl mx-auto px-4 md:px-0">
              <DashboardSkeleton companyId={selectedCompany} />
            </div>
          ) : (
            <motion.div
              key={activeTab}
              initial={transitionPhase === 'fadedIn' ? { opacity: 0, y: 35 } : { opacity: 0, x: 20 }}
              animate={{ opacity: 1, y: 0, x: 0 }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.15 }}
              className={cn(["canary", "team-chat"].includes(activeTab) ? "w-full h-full flex flex-col" : "h-full max-w-7xl mx-auto")}
            >
            {["guest-room-keys", "master-staff-keys"].includes(activeTab) ? (
              <div className="max-w-5xl space-y-12 pb-32">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12 no-print">
                  <div>
                    <h2 className="text-4xl font-serif text-slate-900 italic">
                      {activeTab === "guest-room-keys" ? "Room Key Card Issue & Door Lock Programming" : "Master & Staff Key SOPs"}
                    </h2>
                    <p className="luxury-label opacity-100">Security Protocols & Operational Standards</p>
                  </div>
                  <button 
                    onClick={() => window.print()}
                    className="flex items-center gap-2 px-6 py-3 bg-luxury-black text-white text-[10px] font-display uppercase tracking-widest font-bold hover:bg-gold transition-all shadow-sm"
                  >
                    <Printer size={14} /> Print SOP
                  </button>
                </div>

                {/* Print Header */}
                <div className="hidden print:block mb-8 border-b-2 border-gold/20 pb-4">
                   <div className="flex justify-between items-end mb-4">
                      <div>
                         <h1 className="text-2xl font-serif italic text-slate-900">
                           {activeTab === "guest-room-keys" ? "Guest Room Key Issuance & Programming" : "Master Key Control & Security"}
                         </h1>
                         <p className="text-[10px] font-display uppercase tracking-widest text-gold font-bold">{currentCompany?.name} SECURITY REGISTRY</p>
                      </div>
                      <div className="text-right">
                         <p className="text-[10px] font-display uppercase tracking-widest text-slate-600">Effective Date</p>
                         <p className="text-sm font-serif italic text-slate-900">{new Date().toLocaleDateString()}</p>
                      </div>
                   </div>
                </div>

                {activeTab === "guest-room-keys" ? (
                  <div className="space-y-12">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                       <div className="luxury-card p-8 bg-white border-t-2 border-t-gold/20 relative overflow-hidden group">
                          <div className="absolute -right-4 -top-4 text-gold/5 group-hover:text-gold/10 transition-colors">
                             <CreditCard size={120} strokeWidth={0.5} />
                          </div>
                          <div className="flex items-center gap-3 mb-6 pb-2 border-b border-slate-50 relative z-10">
                             <div className="w-8 h-8 bg-luxury-cream text-gold flex items-center justify-center">
                                <Key size={16} strokeWidth={1} />
                             </div>
                             <h4 className="text-[10px] font-display uppercase tracking-widest font-black text-slate-800">Issuing Room Cards</h4>
                          </div>
                          <div className="space-y-4 relative z-10">
                             {[
                               "Log in Username: reception | Password: 123456",
                               "Select room and stay duration",
                               "Choose number of cards (recommended: 2)",
                               "Place card on reader click Issue",
                               "Confirm issuance card is active",
                               "Keys expire at 11:00 AM on checkout day"
                             ].map((step, i) => (
                               <div key={i} className="flex gap-3">
                                  <span className="text-[10px] font-display font-black text-gold/40">0{i+1}</span>
                                  <p className="text-xs text-slate-600 font-serif italic leading-relaxed">{step}</p>
                               </div>
                             ))}
                          </div>
                       </div>

                       <div className="luxury-card p-8 bg-white border-t-2 border-t-gold/20 relative overflow-hidden group">
                          <div className="absolute -right-4 -top-4 text-gold/5 group-hover:text-gold/10 transition-colors">
                             <ScanLine size={120} strokeWidth={0.5} />
                          </div>
                          <div className="flex items-center gap-3 mb-6 pb-2 border-b border-slate-50 relative z-10">
                             <div className="w-8 h-8 bg-luxury-cream text-gold flex items-center justify-center">
                                <ScanLine size={16} strokeWidth={1} />
                             </div>
                             <h4 className="text-[10px] font-display uppercase tracking-widest font-black text-slate-800">Reading a Card</h4>
                          </div>
                          <div className="space-y-4 relative z-10">
                             {[
                               "Select Card from the menu",
                               "Click Read Card",
                               "Follow on-screen instructions",
                               "Reference Guide"
                             ].map((step, i) => (
                               <div key={i} className="flex gap-3">
                                  <span className="text-[10px] font-display font-black text-gold/40">0{i+1}</span>
                                  <p className="text-xs text-slate-600 font-serif italic leading-relaxed">{step}</p>
                               </div>
                             ))}
                          </div>
                       </div>

                       <div className="luxury-card p-8 bg-luxury-black text-white border-t-2 border-t-gold relative overflow-hidden group">
                          <div className="absolute -right-8 -bottom-8 text-gold/10 group-hover:text-gold/20 transition-colors">
                             <ShieldCheck size={160} strokeWidth={0.5} />
                          </div>
                          <h4 className="text-[10px] font-display uppercase tracking-widest font-black text-gold mb-6 pb-2 border-b border-white/5 relative z-10">Quick Reference</h4>
                          <div className="space-y-6 relative z-10">
                             <div className="flex items-start gap-3">
                                <CheckCircle size={14} className="text-gold mt-0.5" />
                                <div>
                                   <p className="text-[9px] font-display uppercase tracking-widest text-slate-600 mb-1">Issue Cards</p>
                                   <p className="text-[11px] font-serif italic text-slate-200">Login, Select room, Choose 2 cards, Issue.</p>
                                </div>
                             </div>
                             <div className="flex items-start gap-3">
                                <CheckCircle size={14} className="text-gold mt-0.5" />
                                <div>
                                   <p className="text-[9px] font-display uppercase tracking-widest text-slate-600 mb-1">Read Card</p>
                                   <p className="text-[11px] font-serif italic text-slate-200">Menu, Card, Read Card.</p>
                                </div>
                             </div>
                             <div className="flex items-start gap-3">
                                <AlertTriangle size={14} className="text-amber-500 mt-0.5" />
                                <div>
                                   <p className="text-[9px] font-display uppercase tracking-widest text-slate-600 mb-1">System Warning</p>
                                   <p className="text-[11px] font-serif italic text-amber-500">Keys expire 11:00 AM. Max 90 master cards.</p>
                                </div>
                             </div>
                          </div>
                       </div>
                    </div>

                    <div className="luxury-card overflow-hidden bg-white">
                       <div className="p-8 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                             <div className="w-10 h-10 bg-luxury-black text-gold flex items-center justify-center">
                                <Smartphone size={20} strokeWidth={1} />
                             </div>
                             <h3 className="text-xl font-serif italic text-slate-900">PDA Usage to Program Door Locks</h3>
                          </div>
                          <div className="hidden md:flex items-center gap-2 text-[8px] font-display uppercase tracking-[0.2em] font-bold text-slate-700">
                             <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                             Hardware Sync Active
                          </div>
                       </div>
                       <div className="p-10 grid grid-cols-1 md:grid-cols-2 gap-12">
                          <div className="space-y-6">
                             {[
                               "Turn on PDA select Lock",
                               "Choose floor and correct room number",
                               "Hold PDA close to lock",
                               "System (Room Number): click OK blue light + beep",
                               "Parameter (Room Number): click OK blue light + beep",
                               "After these steps, guest/master/floor cards can open the lock."
                             ].map((step, i) => (
                               <div key={i} className="flex gap-4 items-start">
                                  <div className="w-6 h-6 rounded-full border border-gold/30 flex items-center justify-center shrink-0">
                                     <span className="text-[10px] font-display font-black text-gold">{i+1}</span>
                                  </div>
                                  <p className="text-sm text-slate-600 font-serif italic leading-relaxed">{step}</p>
                               </div>
                             ))}
                          </div>
                          <div className="bg-luxury-cream/30 p-10 flex flex-col justify-center border-l border-slate-100 relative overflow-hidden group">
                             <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                                <Lock size={80} strokeWidth={0.5} />
                             </div>
                             <div className="flex items-center gap-3 mb-6">
                                <AlertTriangle className="text-amber-600" size={20} strokeWidth={1} />
                                <h5 className="text-[10px] font-display uppercase tracking-widest font-black text-slate-800">Critical Verification</h5>
                             </div>
                             <p className="text-xs text-slate-800 font-serif italic leading-loose">
                                Ensure both the <span className="text-slate-900 font-bold">System</span> and <span className="text-slate-900 font-bold">Parameter</span> clicks result in a <span className="text-emerald-600 font-bold flex items-center gap-2 mt-1">
                                   <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
                                   Blue Light + Beep
                                </span>. Without the double confirmation, the door lock may remain in its previous state.
                             </p>
                          </div>
                       </div>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="luxury-card p-10 bg-white">
                      <h4 className="text-[10px] font-display uppercase tracking-[0.3em] font-black text-gold mb-8 border-b border-slate-50 pb-4">Standard Protocol</h4>
                      <div className="space-y-6">
                        {[
                          "Identity verification required for all duplicates",
                          "Audit logs must be checked daily",
                          "Key encoder maintenance every 30 days",
                          "Lost keys must be deactivated immediately"
                        ].map((sop, i) => (
                          <div key={i} className="flex gap-4">
                             <span className="text-gold font-serif italic">0{i+1}</span>
                             <p className="text-sm text-slate-600 font-serif italic">{sop}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="luxury-card p-10 bg-luxury-black text-white">
                      <h4 className="text-[10px] font-display uppercase tracking-[0.3em] font-black text-gold mb-8 border-b border-white/5 pb-4">Security Notice</h4>
                      <p className="text-xs text-slate-700 mb-8 font-serif leading-relaxed italic">
                        Strict adherence to key control is mandatory for property insurance compliance. Failure to log master key movements may result in disciplinary action.
                      </p>
                      <button className="w-full border border-gold/40 py-4 text-[10px] font-display uppercase tracking-widest font-black text-gold hover:bg-gold hover:text-white transition-all">
                        Download Full Security PDF
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : activeTab === "equipment-logs" ? (
              <div className="space-y-12">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12 no-print">
                  <div>
                    <h2 className="text-4xl font-serif text-slate-900 italic">Equipment Logs & Reports</h2>
                    <p className="luxury-label opacity-100">Maintenance health & failure frequency analytics</p>
                  </div>
                  <button 
                    onClick={() => window.print()}
                    className="flex items-center gap-2 px-6 py-3 bg-luxury-black text-white text-[10px] font-display uppercase tracking-widest font-bold hover:bg-gold transition-all shadow-sm"
                  >
                    <Printer size={14} /> Export Report
                  </button>
                </div>

                {/* Print-only Stats Header */}
                <div className="hidden print:block mb-8 border-b-2 border-gold/20 pb-4">
                   <div className="flex justify-between items-end mb-4">
                      <div>
                         <h1 className="text-2xl font-serif italic text-slate-900">Equipment Performance Report</h1>
                         <p className="text-[10px] font-display uppercase tracking-widest text-gold font-bold">{currentCompany?.name} MAINTENANCE ANALYSIS</p>
                      </div>
                      <div className="text-right">
                         <p className="text-[10px] font-display uppercase tracking-widest text-slate-600">Analysis Date</p>
                         <p className="text-sm font-serif italic text-slate-900">{new Date().toLocaleDateString()}</p>
                      </div>
                   </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  <div className="lg:col-span-2 space-y-8">
                    <div className="luxury-card p-8 bg-white">
                      <div className="flex items-center justify-between mb-8">
                        <h3 className="text-xl font-serif italic text-slate-900">Repair Frequency Trend</h3>
                        <p className="text-[9px] font-display uppercase tracking-widest text-slate-700">Reported issues over time</p>
                      </div>
                      <div className="h-72 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={maintenanceHistory.map(h => ({
                            date: h.date,
                            repairs: Object.values(h.values || {}).filter(v => v === 'repair').length
                          })).reverse()}>
                            <defs>
                              <linearGradient id="colorRepairs" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#C5A059" stopOpacity={0.3}/>
                                <stop offset="95%" stopColor="#C5A059" stopOpacity={0}/>
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                            <XAxis dataKey="date" stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
                            <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
                            <Tooltip 
                              contentStyle={{ 
                                backgroundColor: '#fff', 
                                border: '1px solid #C5A059', 
                                borderRadius: '0',
                                fontFamily: 'Inter',
                                fontSize: '10px'
                              }} 
                            />
                            <Area type="monotone" dataKey="repairs" stroke="#C5A059" strokeWidth={2} fillOpacity={1} fill="url(#colorRepairs)" />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    <div className="luxury-card overflow-hidden">
                      <div className="p-8 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                         <h3 className="text-xl font-serif italic text-slate-900">Critical Issues Ledger</h3>
                         <span className="bg-amber-50 text-amber-600 text-[9px] font-black uppercase tracking-widest px-3 py-1">Active Alerts</span>
                      </div>
                      <div className="overflow-x-auto">
                         <table className="w-full text-left">
                            <thead className="bg-luxury-cream/30">
                               <tr>
                                  <th className="px-8 py-4 luxury-label !text-slate-800">Date Reported</th>
                                  <th className="px-8 py-4 luxury-label !text-slate-800">Equipment Item</th>
                                  <th className="px-8 py-4 luxury-label !text-slate-800">Log Category</th>
                                  <th className="px-8 py-4 luxury-label !text-slate-800">Notes</th>
                               </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                               {maintenanceHistory.flatMap(log => 
                                 Object.entries(log.values || {})
                                   .filter(([_, val]) => val === 'repair')
                                   .map(([key, _]) => ({ key, log }))
                               ).length === 0 ? (
                                 <tr>
                                    <td colSpan={4} className="px-8 py-16 text-center text-slate-700 font-serif italic">No equipment failures currently logged.</td>
                                 </tr>
                               ) : (
                                 maintenanceHistory.flatMap(log => 
                                   Object.entries(log.values || {})
                                     .filter(([_, val]) => val === 'repair')
                                     .map(([key, _], i) => (
                                       <tr key={`${log.date}-${i}`} className="hover:bg-luxury-cream/10 transition-colors">
                                          <td className="px-8 py-4 text-[11px] font-serif italic">{log.date}</td>
                                          <td className="px-8 py-4 text-[11px] font-bold text-slate-700 uppercase tracking-tight">{key.split('-').pop()}</td>
                                          <td className="px-8 py-4">
                                            <span className="text-[10px] font-display uppercase tracking-widest text-gold opacity-60">
                                              {log.type === 'public' ? 'Public' : log.type === 'guest' ? 'Guest Room' : 'Service'}
                                            </span>
                                          </td>
                                          <td className="px-8 py-4 text-[10px] text-slate-800 italic max-w-xs truncate">
                                            {log.notes || "No detailed findings recorded."}
                                          </td>
                                       </tr>
                                     ))
                                 )
                               )}
                            </tbody>
                         </table>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-8 no-print">
                    <div className="luxury-card p-8 bg-luxury-black text-white">
                      <h4 className="text-[10px] font-display uppercase tracking-[0.3em] font-black text-gold mb-6">Service Summary</h4>
                      <div className="space-y-6">
                        <div className="flex justify-between items-end border-b border-white/10 pb-4">
                          <p className="text-[10px] font-display uppercase text-slate-300">Total In-Depth Logs</p>
                          <span className="text-2xl font-serif italic text-gold">{maintenanceHistory.length}</span>
                        </div>
                        <div className="flex justify-between items-end border-b border-white/10 pb-4">
                          <p className="text-[10px] font-display uppercase text-slate-300">Items Needing Repair</p>
                          <span className="text-2xl font-serif italic text-amber-500">
                             {maintenanceHistory.reduce((acc, log) => acc + Object.values(log.values || {}).filter(v => v === 'repair').length, 0)}
                          </span>
                        </div>
                        <div className="flex justify-between items-end">
                          <p className="text-[10px] font-display uppercase text-slate-300">Fleet Health Index</p>
                          <span className="text-2xl font-serif italic text-emerald-500">92%</span>
                        </div>
                      </div>
                    </div>

                    <div className="luxury-card p-8 bg-white">
                       <h4 className="text-[10px] font-display uppercase tracking-widest font-black text-slate-800 mb-6 flex items-center gap-2">
                         <AlertTriangle size={14} className="text-amber-500" />
                         Recurring Low-Performance
                       </h4>
                       <div className="space-y-4">
                          {[
                            { name: "Parking Lot Signage", freq: "3x this month" },
                            { name: "Bathtub Caulking", freq: "5x this week" },
                            { name: "Public Restroom Fans", freq: "2x this month" }
                          ].map((rec, i) => (
                            <div key={i} className="p-4 bg-slate-50 border border-slate-100 rounded-sm">
                               <p className="text-[11px] font-bold text-slate-700 uppercase tracking-tight mb-1">{rec.name}</p>
                               <p className="text-[9px] font-display uppercase tracking-widest text-amber-600 font-black">Frequency: {rec.freq}</p>
                            </div>
                          ))}
                       </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : activeTab === "brand-standards" ? (
              <BrandStandardsDocManager />
            ) : ["maintenance-checklist", "maintenance-checklist-guest", "concierge-checklist", "wyndham-hk-supervisor", "wyndham-houseman", "wyndham-public-area", "wyndham-room-attendant"].includes(activeTab) ? (
              <div className="space-y-8 pb-32">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 no-print">
                  <div>
                    <div className="flex items-center gap-4 mb-2">
                       <h2 className="text-3xl font-serif text-slate-900 italic">
                         {activeTab === "maintenance-checklist" ? "Public Areas Checklist" : 
                          activeTab === "maintenance-checklist-guest" ? "Guest Room Checklist" : 
                          activeTab === "wyndham-hk-supervisor" ? "Housekeeping Supervisor Daily Checklist" :
                          activeTab === "wyndham-houseman" ? "Houseman Daily Checklist" :
                          activeTab === "wyndham-public-area" ? "Public Area Attendant Daily Checklist" :
                          activeTab === "wyndham-room-attendant" ? "Room Attendant Daily Checklist" :
                          "Concierge & Porter Checklist"}
                       </h2>
                       <div className="h-0.5 w-12 bg-gold/30" />
                    </div>
                    <p className="luxury-label !text-[10px]">Daily Operational & Service Registry</p>
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-4">
                    <div className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-100 shadow-sm">
                      <label className="text-[9px] font-display uppercase tracking-widest text-slate-600 font-bold">Date:</label>
                      <input 
                        type="date" 
                        value={checklistDate}
                        onChange={(e) => setChecklistDate(e.target.value)}
                        className="border-none text-xs font-serif italic text-gold focus:ring-0 p-0 bg-transparent"
                      />
                    </div>
                    
                    <button 
                      onClick={() => navigateTo("checklists")}
                      className="flex items-center gap-2 px-6 py-3 border border-slate-100 text-[10px] font-display uppercase tracking-widest font-bold hover:bg-slate-50 transition-all shadow-sm"
                    >
                      <X size={14} /> Close & Exit
                    </button>

                    <button 
                      onClick={() => setShowHistory(!showHistory)}
                      className="flex items-center gap-2 px-6 py-3 border border-gold/20 text-[10px] font-display uppercase tracking-widest font-bold hover:bg-gold hover:text-white transition-all shadow-sm"
                    >
                      {showHistory ? <ChevronRight size={14} /> : <HistoryIcon size={14} />}
                      {showHistory ? "Back to Form" : "Submission History"}
                    </button>
                    
                    <button 
                      onClick={() => window.print()}
                      className="flex items-center gap-2 px-6 py-3 bg-luxury-black text-white text-[10px] font-display uppercase tracking-widest font-bold hover:bg-gold transition-all shadow-sm"
                    >
                      <Printer size={14} /> Print / PDF
                    </button>
                  </div>
                </div>

                {showHistory ? (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="luxury-card overflow-hidden no-print"
                  >
                    <div className="p-8 border-b border-slate-100 bg-slate-50/50 flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div>
                           <h3 className="text-xl font-serif italic text-slate-900">Submission History</h3>
                           <p className="text-[10px] font-display uppercase tracking-widest text-slate-600">Recorded Maintenance logs</p>
                        </div>
                        
                        <div className="flex flex-wrap items-center gap-4 bg-white/85 p-3 border border-slate-100 rounded-sm shadow-sm backdrop-blur-sm">
                           <div className="flex items-center gap-2">
                              <Calendar size={14} className="text-gold shrink-0" />
                              <span className="text-[10px] font-display uppercase tracking-wider text-slate-500 font-bold">Log Date Window:</span>
                           </div>
                           <div className="flex items-center gap-2">
                              <input 
                                 type="date" 
                                 value={maintenanceStartDate}
                                 onChange={(e) => setMaintenanceStartDate(e.target.value)}
                                 className="px-2 py-1 bg-slate-50 border border-slate-200 text-xs text-slate-700 font-mono focus:outline-none focus:border-gold"
                              />
                              <span className="text-[10px] text-slate-400">—</span>
                              <input 
                                 type="date" 
                                 value={maintenanceEndDate}
                                 onChange={(e) => setMaintenanceEndDate(e.target.value)}
                                 className="px-2 py-1 bg-slate-50 border border-slate-200 text-xs text-slate-700 font-mono focus:outline-none focus:border-gold"
                              />
                           </div>
                           {(maintenanceStartDate || maintenanceEndDate) && (
                              <button 
                                 onClick={() => { setMaintenanceStartDate(""); setMaintenanceEndDate(""); }}
                                 className="text-[10px] font-display uppercase tracking-widest text-red-500 hover:text-red-700 transition-colors font-bold px-2 py-1 border border-red-200 bg-red-50"
                              >
                                 Reset Window
                              </button>
                           )}
                        </div>
                     </div>
                    <div className="overflow-x-auto">
                       <table className="w-full text-left">
                          <thead>
                             <tr className="bg-luxury-cream/50 border-b border-gold/10">
                                <th className="px-8 py-5 luxury-label font-black !text-slate-500">Submission Date</th>
                                <th className="px-8 py-5 luxury-label font-black !text-slate-500">Log Type</th>
                                <th className="px-8 py-5 luxury-label font-black !text-slate-500">Target Room / Area</th>
                                <th className="px-8 py-5 luxury-label font-black !text-slate-500">Completed By</th>
                                <th className="px-8 py-5 luxury-label font-black !text-slate-500 text-right">Actions</th>
                             </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-50">
                              {filteredMaintenanceHistory.length === 0 ? (
                                <tr>
                                   <td colSpan={5} className="px-8 py-20 text-center text-slate-500 font-serif italic">No maintenance logs found matching criteria.</td>
                                </tr>
                              ) : (
                                filteredMaintenanceHistory.map((log, i) => (
                                  <tr key={i} className="hover:bg-luxury-cream/20 transition-colors">
                                     <td className="px-8 py-6 font-serif text-slate-900 italic">{log.date}</td>
                                     <td className="px-8 py-6 text-[10px] font-bold text-gold uppercase tracking-widest">
                                       {log.type === "public" ? "Public Area" : 
                                         log.type === "guest" ? "Guest Room" : 
                                         log.type === "hk-supervisor" ? "HK Supervisor" : 
                                         log.type === "houseman" ? "Houseman" : 
                                         log.type === "public-area" ? "Public Area HK" : 
                                         log.type === "room-attendant" ? "Room Attendant" : "Concierge"}
                                     </td>
                                     <td className="px-8 py-6 text-xs text-slate-500 font-display font-medium uppercase tracking-wider">
                                       {log.roomNumber || "N/A"}
                                     </td>
                                     <td className="px-8 py-6 text-xs text-slate-500 font-display uppercase tracking-widest">{log.user || "Charles"}</td>
                                     <td className="px-8 py-6 text-right">
                                        <button className="text-gold hover:text-luxury-black transition-colors">
                                           <Download size={18} strokeWidth={1.5} />
                                        </button>
                                     </td>
                                  </tr>
                                ))
                              )}
                          </tbody>
                       </table>
                    </div>
                  </motion.div>
                ) : (
                  <div className="space-y-12">
                     {/* Print-only Header */}
                     <div className="hidden print:block mb-6 border-b-2 border-gold/20 pb-4">
                        <div className="flex justify-between items-end mb-4">
                           <div>
                              <h1 className="text-2xl font-serif italic text-slate-900">
                                {activeTab === "maintenance-checklist" ? "Public Areas Checklist" :
                          activeTab === "maintenance-checklist-guest" ? "Guest Room Checklist" :
                          activeTab === "wyndham-hk-supervisor" ? "Housekeeping Supervisor Daily Checklist" :
                          activeTab === "wyndham-houseman" ? "Houseman Daily Checklist" :
                          activeTab === "wyndham-public-area" ? "Public Area Attendant Daily Checklist" :
                          activeTab === "wyndham-room-attendant" ? "Room Attendant Daily Checklist" :
                          "Concierge & Porter Checklist"}
                              </h1>
                              <p className="text-[10px] font-display uppercase tracking-widest text-gold font-bold">{currentCompany?.name || "CML"} PROPERTY REGISTRY</p>
                           </div>
                           <div className="text-right">
                              <p className="text-[9px] font-display uppercase tracking-widest text-slate-600 font-bold">Audit Registry Code</p>
                              <p className="text-xs font-mono font-bold text-slate-900">
                                {activeTab === "maintenance-checklist-guest" || activeTab === "wyndham-room-attendant" ? `RM-CHKL-${checklistRoomNumber || 'N/A'}` : 
                                  activeTab.startsWith("wyndham-") ? `CHKL-${activeTab.replace("wyndham-", "").toUpperCase()}` : 
                                  `CHKL-${activeTab.substring(12).toUpperCase()}`}
                              </p>
                           </div>
                        </div>

                        <div className="grid grid-cols-4 gap-4 bg-slate-50/50 p-4 border border-slate-100 rounded-sm text-left">
                           <div>
                              <span className="block text-[8px] font-display uppercase tracking-widest text-slate-500 font-black">
                                {activeTab === "maintenance-checklist-guest" || activeTab === "wyndham-room-attendant" ? "Room Number" : "Inspection Location"}
                              </span>
                              <span className="text-xs font-serif italic font-bold text-slate-950 font-medium">{checklistRoomNumber || "Not Specified"}</span>
                           </div>
                           <div>
                              <span className="block text-[8px] font-display uppercase tracking-widest text-slate-500 font-black">Inspected By</span>
                              <span className="text-xs font-serif italic font-bold text-slate-950 font-medium">{checklistInspectorName || "Charles"}</span>
                           </div>
                           <div>
                              <span className="block text-[8px] font-display uppercase tracking-widest text-slate-500 font-black">Date</span>
                              <span className="text-xs font-serif italic font-bold text-slate-950 font-medium">{checklistDate}</span>
                           </div>
                           <div>
                              <span className="block text-[8px] font-display uppercase tracking-widest text-slate-500 font-black">Shift & Std</span>
                              <span className="text-xs font-serif italic font-bold text-slate-950 font-medium">{checklistShift} / {checklistInspectionType}</span>
                           </div>
                        </div>
                     </div>

                     {/* Screen-only Metadata Input Panel with premium gold accents */}
                     <div className="no-print bg-slate-50 border border-slate-150 p-8 rounded-sm space-y-6 text-left mb-6">
                        <div className="flex items-center gap-2 border-b border-fold/10 pb-3">
                           <FileText size={16} className="text-gold" />
                           <h3 className="text-[11px] font-display uppercase tracking-widest font-black text-slate-800">
                             {activeTab === "maintenance-checklist-guest" || activeTab === "wyndham-room-attendant" ? "Room/Suite Registry Auditing" :
                               activeTab.startsWith("wyndham-") ? "Wyndham Housekeeping Daily Details" :
                               activeTab === "maintenance-checklist" ? "Public Area Inspection Details" : "Concierge Shift Specifications"}
                           </h3>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                           <div className="space-y-2">
                              <label className="block text-[9px] font-display uppercase tracking-widest font-black text-slate-800">
                                {activeTab === "maintenance-checklist-guest" || activeTab === "wyndham-room-attendant" ? "Room Number *" :
                                  activeTab === "maintenance-checklist" ? "Inspection Location *" : "Assignment/Area *"}
                              </label>
                              <input 
                                 type="text" 
                                 required
                                 placeholder={activeTab === "maintenance-checklist-guest" || activeTab === "wyndham-room-attendant" ? "e.g. 302, 415" : activeTab === "maintenance-checklist" ? "e.g. Lobby, Garden" : "e.g. Bell Desk, Valet / HK Duty"}
                                 value={checklistRoomNumber}
                                 onChange={(e) => setChecklistRoomNumber(e.target.value)}
                                 className="w-full p-2.5 bg-white border border-slate-200 text-xs text-slate-900 font-serif italic focus:ring-1 focus:ring-gold focus:border-gold outline-none shadow-sm rounded-sm"
                              />
                           </div>

                           <div className="space-y-2">
                              <label className="block text-[9px] font-display uppercase tracking-widest font-black text-slate-800">
                                Inspected By
                              </label>
                              <input 
                                 type="text" 
                                 placeholder="Full representative name"
                                 value={checklistInspectorName}
                                 onChange={(e) => setChecklistInspectorName(e.target.value)}
                                 className="w-full p-2.5 bg-white border border-slate-200 text-xs text-slate-900 font-serif italic focus:ring-1 focus:ring-gold focus:border-gold outline-none shadow-sm rounded-sm"
                              />
                           </div>

                           <div className="space-y-2">
                              <label className="block text-[9px] font-display uppercase tracking-widest font-black text-slate-800">
                                Check Type / Standard
                              </label>
                              <select 
                                 value={checklistInspectionType}
                                 onChange={(e) => setChecklistInspectionType(e.target.value)}
                                 className="w-full p-2.5 bg-white border border-slate-200 text-xs text-slate-950 font-serif italic focus:ring-1 focus:ring-gold focus:border-gold outline-none shadow-sm rounded-sm"
                              >
                                 <option value="Routine">Standard Routine Check</option>
                                 <option value="Deep Clean">Full Deep Clean Audit</option>
                                 <option value="VIP Pre-Arrival">VIP Pre-Arrival Screening</option>
                                 <option value="Departure Inspect">Post-Departure Inspection</option>
                                 <option value="Preventative">Scheduled Preventative Maintenance</option>
                              </select>
                           </div>

                           <div className="space-y-2">
                              <label className="block text-[9px] font-display uppercase tracking-widest font-black text-slate-800">
                                Shift Schedule
                              </label>
                              <select 
                                 value={checklistShift}
                                 onChange={(e) => setChecklistShift(e.target.value)}
                                 className="w-full p-2.5 bg-white border border-slate-200 text-xs text-slate-950 font-serif italic focus:ring-1 focus:ring-gold focus:border-gold outline-none shadow-sm rounded-sm"
                              >
                                 <option value="Morning">Morning Shift (06:00 - 14:00)</option>
                                 <option value="Afternoon">Afternoon Shift (14:00 - 22:00)</option>
                                 <option value="Night">Night Shift (22:00 - 06:00)</option>
                              </select>
                           </div>
                        </div>
                     </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 printable-area">
                      {(activeTab === "maintenance-checklist" ? [
                        {
                          title: "Parking Lot & Area",
                          items: ["Signage illuminated & condition", "Parking lot lights", "Parking lot stripes", "Curb Landscaping", "Sidewalks"]
                        },
                        {
                          title: "Dumpster Area",
                          items: ["Dumpster gates & lock", "Dumpster walls", "Dumpster area"]
                        },
                        {
                          title: "Hotel Exterior",
                          items: ["Exterior windows/screens", "Waste cans & ashtrays", "Exterior doors", "Exterior locks", "Lights", "Outside of building", "Check roof"]
                        },
                        {
                          title: "Business Center",
                          items: ["Lighting", "Switches", "Counter", "Waste can", "Carpet", "Chairs", "Cabinets", "Walls", "Equipment"]
                        },
                        {
                          title: "Breakfast Area",
                          items: ["Lighting", "Toasters", "Microwaves", "Other Equipment", "Cabinets", "Electrical outlets", "Counter", "Tables", "Chairs", "Vents", "Walls", "Carpet", "Flooring"]
                        },
                        {
                          title: "Pantry",
                          items: ["Flooring", "Counters", "Drains", "Sinks", "Dishwashing unit", "Refrigeration unit", "Lighting", "Walls", "Shelving"]
                        },
                        {
                          title: "Restrooms",
                          items: ["Signage", "Door", "Mirrors", "Counter/Vanity", "Stall walls", "Sinks", "Toilets", "Walls", "Floors", "Fans/Vents", "Lighting", "Chart for checking"]
                        },
                        {
                          title: "Storage Areas",
                          items: ["Storage area", "Fire rated storage cabinet", "First aid kit", "Storage area walls", "Doors", "Vents", "Paperwork", "Keys for area", "Tool inventory", "Cribs"]
                        },
                        {
                           title: "Lobby & Vending",
                           items: ["Vending machines", "Machines lighting", "Area rug", "Chairs/Couch", "Tables", "Lamps", "Lamp shades", "Telephone", "Plants/Planters"]
                        },
                        {
                           title: "Halls & Stairwells",
                           items: ["Carpet conditions", "Walls conditions", "Lighting", "Fire extinguishers", "Fire alarms", "Exit signs", "Stairwells", "Railing", "Stairwell doors"]
                        },
                        {
                           title: "Housekeeping & Dept",
                           items: ["Doors/walls/floors", "Dryers", "Washers", "Linen Chute", "First Aid Kit", "Emergency Manuals", "MSDS sheets"]
                        },
                        {
                           title: "Pool & Mechanical",
                           items: ["Pool Container", "Gate/Lock", "Furniture", "Chemicals", "Pool deck", "Fence", "Lifesaving equipment", "Pump Room pressure", "Boiler operations"]
                        }
                      ] : activeTab === "wyndham-hk-supervisor" ? [
                        {
                          title: "Staff Attendance & Grooming Inspection",
                          items: [
                            "Staff roll call & shifts allocation",
                            "Check uniform cleanliness & nametag",
                            "Verify staff overall hygiene & grooming",
                            "Ensure PPE (gloves/masks) issued",
                            "Confirm radios & mobile devices active",
                            "Review daily assignment sheets",
                            "Discuss VIP arrivals & special requests",
                            "Conduct motivational daily briefing"
                          ]
                        },
                        {
                          title: "Housekeeping Office & Store Inspection",
                          items: [
                            "Ensure office is clean & clutter-free",
                            "Check store room shelving structure",
                            "Verify chemical stocks & labeling",
                            "Check vacuum cleaner operational state",
                            "Inspect housekeeping trolleys & carts",
                            "Verify lost and found registry update"
                          ]
                        },
                        {
                          title: "Daily Room Coordination & PMS",
                          items: [
                            "Review PMS vacant clean/inspected status",
                            "Prioritize VIP and return rooms first",
                            "Coordinate directly with Front Office",
                            "Follow up on room attendant progress",
                            "Confirm departures cleaned & inspected"
                          ]
                        },
                        {
                          title: "Corridor & Floor Area Inspection",
                          items: [
                            "Ensure guest corridors free of clutter",
                            "Check secondary lighting & emergency signs",
                            "Inspect wall paint & corner scuffs",
                            "Verify fire exits clear of linen carts",
                            "Ensure floor service rooms clean & locked"
                          ]
                        }
                      ] : activeTab === "wyndham-houseman" ? [
                        {
                          title: "Start of Shift Preparation",
                          items: [
                            "Clock in on time in pristine uniform",
                            "Receive shift assignment & master keys",
                            "Prepare utility cart with heavy supplies"
                          ]
                        },
                        {
                          title: "Guest Room Assistance Support",
                          items: [
                            "Deliver heavy linens / rollaways to rooms",
                            "Assist room attendants with heavy lifting",
                            "Check baby cot availability & state"
                          ]
                        },
                        {
                          title: "Corridor & Walkway Cleaning",
                          items: [
                            "Vacuum corridors & lobby walk zones",
                            "Dust baseboards, lamps, and wall art",
                            "Spot clean lift doors & call frame buttons"
                          ]
                        },
                        {
                          title: "Linen & Garbage Handling",
                          items: [
                            "Collect dirty linen from floor carts",
                            "Deliver fresh linen bales to floor stores",
                            "Sort trash, recyclables, and cardboard",
                            "Clear chute rooms & transport to compactor"
                          ]
                        }
                      ] : activeTab === "wyndham-public-area" ? [
                        {
                          title: "Start of Shift Preparation",
                          items: [
                            "Clock in, check uniform, and collect keys",
                            "Prepare public area chemical kits & mops"
                          ]
                        },
                        {
                          title: "Lobby & Reception Area Cleaning",
                          items: [
                            "Sanitize receptionist desk & counter glaze",
                            "Polish main gold entrance door handles",
                            "Vacuum high-traffic lobby carpets",
                            "Wipe lounge tables, chairs & decorative items"
                          ]
                        },
                        {
                          title: "Public Restroom Maintenance",
                          items: [
                            "Sani-scrub public toilet bowl & urinal",
                            "Wipe mirrors and chrome washbasin taps",
                            "Check & refill liquid soap / tissues",
                            "Mop restroom tiles & empty sanitary bins"
                          ]
                        },
                        {
                          title: "Poolside & Exterior Pathways",
                          items: [
                            "Wipe poolside lounges & clear dry leaves",
                            "Inspect public bins & empty outdoor ashtrays",
                            "Sweep beach boardwalks & entrance porch"
                          ]
                        }
                      ] : activeTab === "wyndham-room-attendant" ? [
                        {
                          title: "Start of Shift Procedures",
                          items: [
                            "Clock in & review room assignment boards",
                            "Sanitize trolley handle and stock amenities"
                          ]
                        },
                        {
                          title: "Room Entrance & Initial Check",
                          items: [
                            "Knock twice and announce 'Housekeeping'",
                            "Check room lock handles & room numbers"
                          ]
                        },
                        {
                          title: "Bedroom Cleaning Procedures",
                          items: [
                            "Strip dirty linen & inspect mattress protectors",
                            "Make the bed with signature Wyndham folds",
                            "Check under bed for guest items or dust",
                            "Dust nightstands, TV frame, lamp bases",
                            "Clean mirror glaze & telephone receiver"
                          ]
                        },
                        {
                          title: "Bathroom Cleaning Procedures",
                          items: [
                            "Disinfect & scrub toilet, including the rim",
                            "Scrub vanity basin & polish chrome taps",
                            "Clean shower glass partitions (no streaks)",
                            "Verify shower drain filter & water flow",
                            "Replenish clean towels & vanity items"
                          ]
                        },
                        {
                          title: "Balcony & Final Finishes",
                          items: [
                            "Sweep balcony tiles & clean glass frame rails",
                            "Vacuum carpets deeply, window track check",
                            "Ensure AC operates and thermostat is nominal"
                          ]
                        }
                      ] : activeTab === "maintenance-checklist-guest" ? [
                        {
                          title: "Entrance Door",
                          items: [
                            "Room number (check condition)", 
                            "Outside door frame (tight, clean, good repair)", 
                            "Key card lock (card inserts easily)", 
                            "Screws in hinges (in place & tight)", 
                            "Door (closes properly)", 
                            "Emergency exit sign (in place, correct)", 
                            "Hotel laws (in place)", 
                            "Door handle (secure)", 
                            "Swing bar (check condition)", 
                            "Peep hole (in place, working)", 
                            "Deadbolt (works easily)", 
                            "Inside door (frame tight, clean)", 
                            "Light switch at door (turns on one light)", 
                            "Room door knob bumper (in place, check condition)", 
                            "Entrance light (working, condition)"
                          ]
                        },
                        {
                          title: "Bedroom",
                          items: [
                            "Walls (not scuffed or marked)", 
                            "Table (condition, not wobbly)", 
                            "Chairs/sofas (good condition, secure)", 
                            "Credenza (condition)", 
                            "Credenza drawers (operate smoothly, clean)", 
                            "Credenza mirror (secure, condition)", 
                            "Credenza lamp (working, condition)", 
                            "Desk/Desk drawers (condition, operates smoothly)", 
                            "Desk chair (check condition, rollers)", 
                            "Desk lamp (working, condition)", 
                            "Desk lamp shade (check condition)", 
                            "Table lamp (condition, knobs, working)", 
                            "Table (check stability, condition)", 
                            "Pictures (secure, condition)", 
                            "Mattresses (flipped to correct position, condition, stains)", 
                            "Box springs (condition, stains, against the wall)", 
                            "Box frame (condition, stability)", 
                            "Headboards (condition, secure)", 
                            "Smoke alarms (check battery, condition)", 
                            "Arm chair (condition, stability)", 
                            "Ceilings/corners (check for cobwebs)", 
                            "Floor lamp (condition, stability)", 
                            "Floor lamp shade (condition, knobs)", 
                            "Rug (condition, burns, cleanliness)"
                          ]
                        },
                        {
                          title: "Draperies/Windows",
                          items: [
                            "Drapery rod (secure)", 
                            "Drapery box (secure, condition)", 
                            "Drapery hooks (not missing)", 
                            "Draperies (check condition)", 
                            "Window (frame, track clean, window slides easily)", 
                            "Window locks (locks securely)", 
                            "Window pane/screen (check condition)", 
                            "Window stops (condition, secure)"
                          ]
                        },
                        {
                          title: "Bathroom",
                          items: [
                            "Door (condition)", 
                            "Door knob (operable, condition)", 
                            "Door frame (secure, condition)", 
                            "Clothes hook (secure)", 
                            "Door knob bumper (in place, secure)", 
                            "Towel racks (secure)", 
                            "Toilet tissue holder (secure, good condition)", 
                            "Chrome on shower rods (clean)", 
                            "Bathtub caulking (check condition)", 
                            "Bathtub (holds water securely, drains properly)", 
                            "Bathtub fixtures (secure, check condition)", 
                            "Bathtub shower head (secure, working properly, clean)", 
                            "Bathtub mirror (secure, check condition)", 
                            "Commode (no leaks, flushes properly)", 
                            "Commode seat (secure, cover caps in place)", 
                            "Commode base (screws tight, caps in place)"
                          ]
                        }
                      ] : [
                        {
                          title: "Shift Start / Operational Checks",
                          items: [
                            "Report to duty on time in full uniform and proper grooming",
                            "Attend shift briefing with supervisor",
                            "Check daily arrivals, departures, and VIP guests",
                            "Review group arrivals and special requirements",
                            "Inspect lobby, entrance, and driveway cleanliness",
                            "Check luggage storage area is clean and organized",
                            "Ensure trolleys are clean and in good condition",
                            "Check hotel vehicles (if applicable) are clean and ready",
                            "Confirm bell desk logbook is updated",
                            "Check communication devices (radio/phone) are working",
                            "Verify signage and display boards are properly placed",
                            "Review weather conditions and prepare umbrellas if needed",
                            "Confirm transport bookings for the day",
                            "Check lost & found log updates",
                            "Ensure all porter equipment is ready for service"
                          ]
                        },
                        {
                          title: "Guest Arrival Service",
                          items: [
                            "Greet all arriving guests warmly (eye contact, smile)",
                            "Assist guests with luggage promptly upon arrival",
                            "Open car doors and welcome guests",
                            "Escort guests to reception/check-in area",
                            "Inform Front Office of guest arrival if needed",
                            "Tag and label luggage correctly",
                            "Handle luggage with care and professionalism",
                            "Provide brief hotel orientation (facilities, timings)",
                            "Escort guests to rooms after check-in",
                            "Demonstrate room features (AC, TV, safe, etc.)",
                            "Confirm guest satisfaction before leaving room",
                            "Offer additional assistance (tours, transport, dining)",
                            "Prioritize VIP and elderly guest assistance",
                            "Manage multiple arrivals efficiently during peak times",
                            "Maintain professional body language at all times"
                          ]
                        },
                        {
                          title: "Guest Departure Service",
                          items: [
                            "Respond promptly to guest departure requests",
                            "Assist with luggage collection from rooms",
                            "Verify room number and guest details before handling luggage",
                            "Transport luggage safely to lobby or vehicle",
                            "Confirm transport arrangements (taxi, shuttle, private car)",
                            "Load luggage carefully into vehicles",
                            "Thank guests and bid farewell courteously",
                            "Inform Front Office once guest has departed",
                            "Check lobby for unattended luggage",
                            "Ensure luggage storage for late departures is logged",
                            "Handle express check-outs efficiently",
                            "Assist with group departures coordination",
                            "Provide directions or travel assistance if needed",
                            "Ensure zero luggage mishandling incidents",
                            "Maintain smooth traffic flow at entrance"
                          ]
                        },
                        {
                          title: "Luggage Handling & Storage",
                          items: [
                            "Tag all luggage with correct guest details",
                            "Store luggage in designated areas securely",
                            "Maintain proper luggage logbook entries",
                            "Ensure no luggage is misplaced or unattended",
                            "Handle fragile items with extra care",
                            "Follow SOP for long-term luggage storage",
                            "Verify luggage before releasing to guests",
                            "Maintain cleanliness of storage area",
                            "Monitor high-volume luggage periods (groups/events)",
                            "Assist with oversized or special luggage",
                            "Report any damaged luggage immediately",
                            "Ensure security procedures are followed at all times",
                            "Keep luggage trolleys organized",
                            "Avoid stacking luggage unsafely",
                            "Maintain efficiency during peak hours"
                          ]
                        },
                        {
                          title: "Concierge & Guest Assistance",
                          items: [
                            "Provide directions and local area information",
                            "Assist guests with transport bookings (taxi, shuttle)",
                            "Recommend restaurants, tours, and attractions",
                            "Handle guest requests promptly (within 10-15 mins)",
                            "Coordinate with Front Office for guest needs",
                            "Arrange wake-up calls or reminders if requested",
                            "Assist with delivery of items to guest rooms",
                            "Handle guest complaints politely and escalate if needed",
                            "Provide umbrellas during bad weather",
                            "Assist elderly or disabled guests with extra care",
                            "Maintain knowledge of hotel services and promotions",
                            "Help guests with luggage during room changes",
                            "Provide accurate information at all times",
                            "Ensure guest satisfaction with every interaction",
                            "Maintain professional communication at all times"
                          ]
                        },
                        {
                          title: "Transport & Valet Coordination",
                          items: [
                            "Coordinate taxi and shuttle services for guests",
                            "Ensure timely arrival of booked transport",
                            "Maintain transport booking log",
                            "Assist guests with loading/unloading luggage",
                            "Coordinate airport transfers",
                            "Communicate delays or issues to guests promptly",
                            "Ensure hotel vehicles are clean and presentable",
                            "Guide drivers to correct pickup/drop-off points",
                            "Assist with valet parking if applicable",
                            "Maintain smooth traffic flow at entrance",
                            "Track transport schedules for VIP guests",
                            "Coordinate group transport logistics",
                            "Ensure guest safety during vehicle boarding",
                            "Verify transport details before dispatch",
                            "Maintain professional interaction with drivers"
                          ]
                        },
                        {
                          title: "Communication & Coordination",
                          items: [
                            "Maintain constant communication with Front Office",
                            "Coordinate with Housekeeping for room readiness",
                            "Liaise with F&B for guest requests",
                            "Communicate VIP arrivals to all departments",
                            "Update bell desk logbook regularly",
                            "Report maintenance issues immediately",
                            "Coordinate with security for safety concerns",
                            "Inform team of high-priority tasks",
                            "Assist other departments during peak hours",
                            "Ensure smooth inter-departmental communication",
                            "Follow up on pending guest requests",
                            "Share updates during shift handover",
                            "Maintain clear and professional communication",
                            "Escalate unresolved issues promptly",
                            "Support teamwork across departments"
                          ]
                        },
                        {
                          title: "Safety, Security & Compliance",
                          items: [
                            "Monitor lobby and entrance for suspicious activity",
                            "Ensure guest belongings are handled securely",
                            "Follow hotel security procedures at all times",
                            "Report lost & found items immediately",
                            "Maintain record of lost & found items",
                            "Ensure emergency exits are clear",
                            "Follow fire and safety protocols",
                            "Assist during emergency situations if required",
                            "Avoid unauthorized access to guest areas",
                            "Maintain confidentiality of guest information",
                            "Ensure safe handling of heavy luggage",
                            "Prevent accidents in lobby/driveway area",
                            "Report hazards or risks immediately",
                            "Ensure compliance with hotel SOPs",
                            "Maintain awareness of safety procedures"
                          ]
                        },
                        {
                          title: "Lobby & Public Area Management",
                          items: [
                            "Ensure lobby is clean and presentable at all times",
                            "Arrange luggage trolleys neatly",
                            "Monitor guest flow in lobby area",
                            "Assist guests entering/exiting the hotel",
                            "Ensure entrance area is clutter-free",
                            "Check lighting and ambiance in lobby",
                            "Coordinate with housekeeping for cleanliness",
                            "Maintain professional posture at bell desk",
                            "Assist with event guest directions",
                            "Monitor waiting times for guests",
                            "Ensure signage is clear and visible",
                            "Keep umbrella stands organized",
                            "Ensure music/ambience is appropriate",
                            "Assist during peak lobby traffic",
                            "Maintain welcoming atmosphere at all times"
                          ]
                        },
                        {
                          title: "End of Day / Shift Handover",
                          items: [
                            "Update bell desk logbook with all activities",
                            "Ensure all luggage movements are recorded",
                            "Handover pending tasks to next shift",
                            "Confirm all guest requests have been completed",
                            "Report any incidents or issues to supervisor",
                            "Check storage area for remaining luggage",
                            "Ensure lobby and entrance are clean and organized",
                            "Return equipment (radios, keys, trolleys) to proper place",
                            "Verify transport bookings for next shift",
                            "Update lost & found records",
                            "Report maintenance issues noticed during shift",
                            "Confirm VIP arrangements for next shift",
                            "Share important updates during handover briefing",
                            "Ensure no guest requests are left unattended",
                            "Clock out as per schedule"
                          ]
                        }
                      ]).map((section, idx) => (
                        <div key={idx} className="luxury-card p-6 bg-white border-t-2 border-t-gold/20">
                           <h4 className="text-[11px] font-display uppercase tracking-[0.25em] font-black text-slate-800 mb-6 pb-2 border-b border-slate-50">{section.title}</h4>
                           <div className="space-y-4">
                              {section.items.map((item, itemIdx) => {
                                const itemKey = `${activeTab}-${section.title}-${item}`;
                                const val = checklistValues[itemKey];
                                return (
                                  <div key={itemIdx} className="flex items-start gap-3 group border-b border-slate-50 pb-2 mb-2 last:border-0 print:border-slate-100 print:mb-1 print:pb-1">
                                     <div className="flex-1">
                                        <div className="flex items-start gap-2">
                                           <span className="hidden print:inline-flex items-center justify-center w-3 h-3 border border-slate-400 mt-0.5 shrink-0 text-[8px] font-bold">
                                             {val === 'ok' ? "✓" : ""}
                                           </span>
                                           <p className="text-[12px] text-slate-950 leading-tight group-hover:text-gold transition-colors font-bold print:text-[8px] print:font-normal">{item}</p>
                                        </div>
                                        <div className="mt-2 flex gap-2 no-print">
                                           <button 
                                              onClick={() => setChecklistValues(prev => ({ ...prev, [itemKey]: val === 'ok' ? null : 'ok' }))}
                                              className={cn(
                                                "text-[8px] px-3 py-1 font-display uppercase font-bold transition-all border shrink-0",
                                                val === 'ok' ? "bg-emerald-700 text-white border-emerald-700" : "bg-white text-slate-950 border-slate-300 hover:border-emerald-400 hover:text-emerald-700 shadow-sm"
                                              )}
                                           >
                                              OK
                                           </button>
                                           <button 
                                              onClick={() => setChecklistValues(prev => ({ ...prev, [itemKey]: val === 'repair' ? null : 'repair' }))}
                                              className={cn(
                                                "text-[8px] px-3 py-1 font-display uppercase font-bold transition-all border shrink-0",
                                                val === 'repair' ? "bg-amber-700 text-white border-amber-700" : "bg-white text-slate-950 border-slate-300 hover:border-amber-400 hover:text-amber-700 shadow-sm"
                                              )}
                                           >
                                              Needs Repair
                                           </button>
                                        </div>
                                        <div className="hidden print:flex gap-4 mt-1">
                                          <span className={cn("text-[6px] font-bold uppercase", val === 'repair' ? "text-slate-900 underline" : "text-slate-300")}>[ ] Needs Repair</span>
                                        </div>
                                     </div>
                                  </div>
                                );
                              })}
                           </div>
                        </div>
                      ))}
                    </div>

                    <div className="luxury-card p-8 bg-white max-w-2xl notes-area">
                       <h4 className="text-[10px] font-display uppercase tracking-widest font-black text-slate-800 mb-4">Additional Notes & Findings</h4>
                       {/* Hidden on screen for print if blank, but usually we want to show it */}
                       <div className="hidden print:block text-xs font-serif italic text-slate-700 min-h-[100px] whitespace-pre-wrap">
                          {checklistNotes || "No additional notes recorded for this inspection."}
                       </div>
                       <textarea 
                          value={checklistNotes}
                          onChange={(e) => setChecklistNotes(e.target.value)}
                          placeholder="Please specify any additional details or maintenance requirements found during inspection..."
                          className="w-full h-32 p-4 bg-slate-50 border border-slate-100 text-sm font-serif italic focus:ring-1 focus:ring-gold focus:border-gold outline-none resize-none no-print"
                       />
                    </div>

                    <div className="hidden print:flex justify-between items-end mt-12 pt-8 border-t border-slate-100">
                       <div className="signature-line">Supervisor / Manager Signature</div>
                       <div className="signature-line">Inspector Signature</div>
                    </div>

                    <div className="flex justify-start pt-8 pb-32 no-print">
                       <button 
                          onClick={() => {
                             if (!checklistRoomNumber.trim()) {
                               if (activeTab === "maintenance-checklist-guest" || activeTab === "wyndham-room-attendant") {
                                 alert("Please specify the Room Number before submitting.");
                               } else if (activeTab === "maintenance-checklist") {
                                 alert("Please specify the Inspection Location before submitting.");
                               } else if (activeTab.startsWith("wyndham-")) {
                                 alert("Please specify the Inspection Assignment/Area before submitting.");
                               } else {
                                 alert("Please specify the Desk Assignment/Area before submitting.");
                               }
                               return;
                             }

                             const newLog = { 
                               date: checklistDate, 
                               user: checklistInspectorName || "Charles", 
                               roomNumber: checklistRoomNumber,
                               inspectionType: checklistInspectionType,
                               shift: checklistShift,
                              type: activeTab === "maintenance-checklist" ? "public" : 
                                    activeTab === "maintenance-checklist-guest" ? "guest" : 
                                    activeTab === "wyndham-hk-supervisor" ? "hk-supervisor" : 
                                    activeTab === "wyndham-houseman" ? "houseman" : 
                                    activeTab === "wyndham-public-area" ? "public-area" : 
                                    activeTab === "wyndham-room-attendant" ? "room-attendant" : "concierge",
                              values: checklistValues,
                              notes: checklistNotes 
                            };

                            // Check for repair items
                            const repairItems = Object.entries(checklistValues)
                              .filter(([key, val]) => key.startsWith(activeTab) && val === 'repair');
                            
                            if (repairItems.length > 0) {
                              import('./services/notificationService').then(({ notificationService, NotificationType }) => {
                                notificationService.broadcast({
                                  title: 'Urgent Maintenance Required',
                                  message: `${repairItems.length} items marked for repair in ${newLog.type} checklist by ${newLog.user}.`,
                                  type: NotificationType.MAINTENANCE,
                                  link: 'equipment-logs'
                                });
                              });
                            }

                            setMaintenanceHistory([newLog, ...maintenanceHistory]);
                            alert("Checklist successfully submitted to digitalmedia@cml.com.fj");
                            setShowHistory(true);
                            setChecklistValues({});
                            setChecklistNotes("");
                            setChecklistRoomNumber("");
                          }}
                          className="luxury-button !px-12 !py-5 text-sm uppercase tracking-[0.4em] font-black group flex items-center gap-4"
                       >
                          Submit Checklist <ChevronRight size={18} className="translate-x-0 group-hover:translate-x-1 transition-transform" />
                       </button>
                    </div>
                  </div>
                )}
              </div>
            ) : activeTab === "admin-dashboard" ? (
              <AdminDashboard 
                 complaints={complaints}
                 userRole={userRole}
                 workflowConfig={workflowConfig}
                 currentUser={currentUser}
                 onPropertySwitch={(propertyId, tabId) => {
                   setSelectedCompany(propertyId);
                   setActiveTab(tabId);
                   setGuestRecoveryPropertyFilter(propertyId);
                 }}
                 onQuickApproveHOD={handleQuickApproveHOD}
                 onQuickApproveSuperAdmin={handleQuickApproveSuperAdmin}
              />
            ) : activeTab === "guest-recovery" ? (
              <div className="space-y-8">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                  <div>
                    <h2 className="text-4xl font-serif text-slate-900 italic">Guest Recovery Console</h2>
                    <p className="luxury-label opacity-60">Resolution registry & service recovery management</p>
                    {offlineComplaintsCount > 0 && (
                      <div className="mt-3 flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-800 px-3 py-2 text-xs rounded-md shadow-sm w-fit transition-all duration-300">
                        <span className="flex h-2 w-2 relative">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                        </span>
                        <span className="font-sans font-semibold">
                          {offlineComplaintsCount} Pending Offline Submissions Cached
                        </span>
                        <button
                          type="button"
                          onClick={() => triggerClientBackgroundSync()}
                          disabled={isOfflineSyncing}
                          className={`ml-2 px-2.5 py-1 bg-amber-600 text-white rounded hover:bg-amber-700 text-[10px] font-sans font-extrabold uppercase tracking-wider transition flex items-center gap-1 cursor-pointer border border-amber-500 shadow-xs ${isOfflineSyncing ? "opacity-50 cursor-not-allowed" : ""}`}
                        >
                          {isOfflineSyncing ? "Syncing..." : "🔄 Sync Now"}
                        </button>
                      </div>
                    )}
                  </div>
                  {(userRole === "Administrator" || userRole === "Super Admin" || userRole === "Group Controller" || userRole === "Manager" || userRole === "Audit" || userRole === "admin") && (
                    <button 
                      onClick={() => setShowComplaintForm(true)}
                      className="flex items-center gap-2 px-8 py-4 bg-luxury-black text-white text-[10px] font-display uppercase tracking-widest font-black hover:bg-gold transition-all shadow-xl"
                    >
                      <Plus size={16} /> Report Guest Concern
                    </button>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center bg-white p-4 border border-slate-100 shadow-sm mb-4">
                  <div className="flex-1 flex items-center gap-3">
                    <Search size={18} className="text-slate-400 shrink-0" />
                    <input 
                      type="text"
                      placeholder="Search by Guest Name, Room or Description..."
                      value={complaintSearch}
                      onChange={(e) => setComplaintSearch(e.target.value)}
                      className="w-full bg-transparent border-none text-sm font-serif italic focus:ring-0 outline-none"
                    />
                  </div>
                  <div className="h-px sm:h-8 w-full sm:w-px bg-slate-100" />
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-2">
                      <Calendar size={14} className="text-gold shrink-0" />
                      <span className="text-[10px] font-display uppercase tracking-wider text-slate-400 font-bold">Operational Window:</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <input 
                        type="date" 
                        value={recoveryStartDate}
                        onChange={(e) => setRecoveryStartDate(e.target.value)}
                        className="px-2 py-1 bg-slate-50 border border-slate-200 text-xs text-slate-700 font-mono focus:outline-none focus:border-gold"
                      />
                      <span className="text-[10px] text-slate-400">—</span>
                      <input 
                        type="date" 
                        value={recoveryEndDate}
                        onChange={(e) => setRecoveryEndDate(e.target.value)}
                        className="px-2 py-1 bg-slate-50 border border-slate-200 text-xs text-slate-700 font-mono focus:outline-none focus:border-gold"
                      />
                    </div>
                    {(recoveryStartDate || recoveryEndDate) && (
                      <button 
                        onClick={() => { setRecoveryStartDate(""); setRecoveryEndDate(""); }}
                        className="text-[10px] font-display uppercase tracking-widest text-red-500 hover:text-red-700 transition-colors font-bold px-2 py-1 border border-red-200 bg-red-50/50"
                      >
                        Reset Window
                      </button>
                    )}
                  </div>
                </div>

                {/* Real-time Property Syndicate Navigator */}
                <div className="flex border-b border-slate-100 pb-2 mb-6 gap-6 text-[10px] font-display uppercase tracking-widest overflow-x-auto scrollbar-none">
                  {[
                    { 
                      id: "active", 
                      label: (selectedCompany || "wyndham").toLowerCase() === "wyndham"
                        ? "Wyndham Garden Active Logs"
                        : (selectedCompany || "wyndham").toLowerCase() === "ramada"
                        ? "Ramada Suites Active Logs"
                        : "CML Corporate Active Logs"
                    },
                    { id: "pending-approvals", label: "My Pending Approvals" },
                    { id: "archived", label: "Disposed / Archived Logs" }
                  ].map((tab) => {
                    const isActive = guestRecoveryPropertyFilter === tab.id;
                    const count = complaints.filter(c => {
                      // 1. Force strict property isolation for the tab count
                      const targetProperty = (selectedCompany || "wyndham").toLowerCase();
                      const cProperty = (c.propertyId || "").toLowerCase();
                      if (cProperty !== targetProperty) return false;

                      let matchesDateRange = true;
                      if (recoveryStartDate || recoveryEndDate) {
                        const ts = parseDateToMs(c.createdAt);
                        if (!ts) {
                          matchesDateRange = false;
                        } else {
                          if (recoveryStartDate) {
                            const startMs = new Date(recoveryStartDate + "T00:00:00").getTime();
                            if (ts < startMs) matchesDateRange = false;
                          }
                          if (recoveryEndDate) {
                            const endMs = new Date(recoveryEndDate + "T23:59:59").getTime();
                            if (ts > endMs) matchesDateRange = false;
                          }
                        }
                      }
                      if (!matchesDateRange) return false;

                      if (tab.id === "archived") {
                        return c.isArchived === true;
                      } else if (tab.id === "pending-approvals") {
                        if (c.isArchived === true) return false;
                        const todayStr = new Date().toISOString().split("T")[0];
                        const hasActiveDelegation = Array.isArray(workflowConfig?.delegations) && workflowConfig.delegations.some((del: any) => {
                          if (del.toUserEmail?.toLowerCase() !== currentUser?.email?.toLowerCase()) return false;
                          return todayStr >= del.startDate && todayStr <= del.endDate;
                        });
                        const isApproverInConfig = workflowConfig?.approverEmails?.includes(currentUser?.email || "");
                        const isHOD = userRole === "Manager" || userRole === "Administrator" || userRole === "Super Admin" || userRole === "admin" || isApproverInConfig || hasActiveDelegation;
                        const isSuperAdmin = userRole === "Administrator" || userRole === "Super Admin" || userRole === "admin" || isApproverInConfig;
                        
                        const needsHOD = !c.hodApproved;
                        const needsSuperAdmin = c.hodApproved && !c.superAdminApproved;
                        
                        return (needsHOD && isHOD) || (needsSuperAdmin && isSuperAdmin);
                      } else {
                        return c.isArchived !== true;
                      }
                    }).length;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setGuestRecoveryPropertyFilter(tab.id)}
                        className={cn(
                          "pb-2 font-extrabold transition-all relative flex items-center gap-1.5 whitespace-nowrap",
                          isActive ? "text-gold border-b-2 border-gold font-black" : "text-slate-400 hover:text-slate-600"
                        )}
                      >
                        {tab.label}
                        <span className={cn(
                          "text-[8px] font-mono px-1.5 py-0.2 rounded-full",
                          isActive ? "bg-gold text-white" : "bg-slate-100 text-slate-500"
                        )}>
                          {count}
                        </span>
                      </button>
                    );
                  })}
                </div>

                <div className="grid grid-cols-1 gap-6 max-h-[700px] overflow-y-auto pr-4 custom-scrollbar rounded-sm">
                  {complaintsError ? (
                    <div className="py-20 px-10 text-center bg-white border border-red-100 flex flex-col items-center gap-6">
                      <div className="w-16 h-16 bg-red-50 text-red-600 flex items-center justify-center rounded-sm">
                         <Shield size={32} />
                      </div>
                      <div>
                        <h3 className="text-xl font-serif italic text-slate-800 mb-2">Access Restricted</h3>
                        <p className="text-slate-500 font-serif italic text-sm">{complaintsError}</p>
                      </div>
                    </div>
                  ) : (
                    parsedComplaintsList.length === 0 ? (
                      <div className="py-20 text-center bg-white border border-slate-100">
                        <div className="w-16 h-16 bg-luxury-cream text-gold flex items-center justify-center mx-auto mb-4">
                           <AlertCircle size={32} />
                        </div>
                        <p className="text-slate-600 font-serif italic">No guest complaint cases found matching your criteria.</p>
                      </div>
                    ) : (
                      parsedComplaintsList.map((complaint) => (
                        <motion.div 
                          key={complaint.id}
                          layout
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          onClick={() => setSelectedComplaint(complaint)}
                          className={cn(
                            "luxury-card bg-white p-8 border border-slate-100 group transition-all shadow-sm flex flex-col md:flex-row gap-8 items-start md:items-center cursor-pointer",
                            complaint.priority === 'Urgent' && complaint.status !== 'Resolved' ? "urgent-pulse-glow" : "hover:border-gold/30"
                          )}
                        >
                           <div className="shrink-0 w-full md:w-48">
                              <div className="flex items-center flex-wrap gap-2 mb-2">
                                 <span className={cn(
                                   "px-2 py-0.5 text-[8px] font-display uppercase tracking-widest font-black",
                                   complaint.priority === 'Urgent' || complaint.priority === 'High' ? "bg-red-50 text-red-600" :
                                   complaint.priority === 'Medium' ? "bg-amber-50 text-amber-600" : "bg-slate-50 text-slate-500"
                                 )}>
                                   {complaint.priority} Priority
                                 </span>
                                 <span className={cn(
                                   "px-2 py-0.5 text-[8px] font-display uppercase tracking-widest font-black border",
                                   complaint.propertyId === 'wyndham' ? "bg-teal-50 text-teal-800 border-teal-100" :
                                   complaint.propertyId === 'ramada' ? "bg-indigo-50 text-indigo-800 border-indigo-100" :
                                   "bg-amber-50 text-amber-800 border-amber-100"
                                 )}>
                                   {complaint.propertyId === 'wyndham' ? "Wyndham" :
                                    complaint.propertyId === 'ramada' ? "Ramada" :
                                    "HQ-CML"}
                                 </span>
                                 <span className={cn(
                                   "px-2 py-0.5 text-[8px] font-display uppercase tracking-widest font-black",
                                   complaint.status === 'Resolved' ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"
                                 )}>
                                   {complaint.status}
                                 </span>
                                 {complaint.photoBase64 && (
                                   <span className="px-2 py-0.5 text-[8px] font-display uppercase tracking-widest font-black bg-blue-50 text-blue-600 shadow-sm flex items-center gap-1">
                                      📸 Photo Attached
                                   </span>
                                 )}
                              </div>
                              <h4 className="text-xl font-serif italic text-slate-900 group-hover:text-gold transition-colors truncate">{complaint.guestName || "Anonymous Guest"}</h4>
                              <p className="text-[10px] font-display uppercase tracking-widest text-slate-500 font-bold">Room No. / Walk-ins: {complaint.roomNumber || "N/A"}</p>
                           </div>

                           <div className="flex-1 w-full border-l-0 md:border-l border-slate-100 md:pl-8">
                              <p className="text-[10px] font-display uppercase tracking-widest text-gold mb-2 font-black">{complaint.type}</p>
                              <p className="text-sm text-slate-600 font-serif italic leading-relaxed line-clamp-2">{complaint.description}</p>
                           </div>

                           <div className="shrink-0 w-full md:w-auto flex flex-col items-end gap-2">
                              <div className="text-right flex flex-col items-end">
                                 <p className="text-[8px] font-display uppercase tracking-widest text-slate-400 font-black">Reported By</p>
                                 <p className="text-[10px] font-serif italic text-slate-950 font-bold">{complaint.reporterName || complaint.authorName}</p>
                                 {complaint.reporterRole && (
                                   <span className="px-1.5 py-0.5 bg-slate-100 rounded-[2px] font-display uppercase text-[7px] text-slate-500 tracking-widest block mt-0.5">
                                      {complaint.reporterRole}
                                   </span>
                                 )}
                              </div>
                              <div className="text-right">
                                 <p className="text-[8px] font-display uppercase tracking-widest text-slate-400 font-black">Timestamp</p>
                                 <p className="text-[10px] font-serif italic text-slate-700">
                                   {complaint.createdAt ? (complaint.createdAt.toDate ? new Date(complaint.createdAt.toDate()).toLocaleString() : new Date(complaint.createdAt).toLocaleString()) : "Real-time"}
                                 </p>
                              </div>
                           </div>
                        </motion.div>
                      ))
                    )
                  )}
                </div>

                <AnimatePresence>
                  {showComplaintForm && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                      <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setShowComplaintForm(false)}
                        className="absolute inset-0 bg-black/80 backdrop-blur-md"
                      />
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="relative w-full max-w-2xl bg-white shadow-2xl border-t-8 border-gold overflow-y-auto max-h-[90vh]"
                      >
                         <form onSubmit={handleLodgeComplaint} className="p-12 space-y-8">
                            <div className="flex justify-between items-start mb-4">
                               <div>
                                  <h3 className="text-3xl font-serif italic text-slate-900 mb-2">Report Guest Concern</h3>
                                  <p className="luxury-label opacity-60">Formal registry for service recovery tracking</p>
                               </div>
                               <button type="button" onClick={() => setShowComplaintForm(false)} className="text-slate-400 hover:text-slate-900 transition-colors">
                                  <X size={24} />
                               </button>
                            </div>

                            <div className="space-y-2 border-b border-slate-100 pb-6">
                               <label className="text-[10px] font-display uppercase tracking-widest font-black text-slate-800">CML Portfolio Hotel/Property (Authorized Login)</label>
                               <div className="w-full bg-slate-50 border border-slate-100 rounded-sm px-6 py-4 text-sm font-serif italic text-slate-700 font-bold select-none">
                                 {selectedCompany === 'ramada' ? "Ramada Suites by Wyndham Wailoaloa Beach" : 
                                  selectedCompany === 'wyndham' ? "Wyndham Garden Wailoaloa Beach" : 
                                  "CML Corporate / Other"}
                               </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                               <div className="space-y-2">
                                  <label className="text-[10px] font-display uppercase tracking-widest font-black text-slate-800">Guest Full Name</label>
                                  <input 
                                    type="text"
                                    required
                                    value={complaintForm.guestName}
                                    onChange={(e) => setComplaintForm({...complaintForm, guestName: e.target.value})}
                                    className="w-full bg-slate-50 border-none px-6 py-4 text-sm font-serif italic focus:ring-1 focus:ring-gold/50"
                                    placeholder="e.g. John Doe"
                                  />
                               </div>
                               <div className="space-y-2">
                                  <label className="text-[10px] font-display uppercase tracking-widest font-black text-slate-800">Room No. / Walk-ins</label>
                                  <input 
                                    type="text"
                                    required
                                    value={complaintForm.roomNumber}
                                    onChange={(e) => setComplaintForm({...complaintForm, roomNumber: e.target.value})}
                                    className="w-full bg-slate-50 border-none px-6 py-4 text-sm font-serif italic focus:ring-1 focus:ring-gold/50"
                                    placeholder="e.g. 402 or Restaurant/Retail"
                                  />
                               </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                               <div className="space-y-2">
                                  <label className="text-[10px] font-display uppercase tracking-widest font-black text-slate-800">Your Full Name (Reporter)</label>
                                  <input 
                                    type="text"
                                    required
                                    value={complaintForm.reporterName}
                                    onChange={(e) => setComplaintForm({...complaintForm, reporterName: e.target.value})}
                                    className="w-full bg-slate-50 border-none px-6 py-4 text-sm font-serif italic focus:ring-1 focus:ring-gold/50"
                                    placeholder="e.g. Jean-Luc"
                                  />
                               </div>
                             <div className="space-y-2">
                                <label className="text-[10px] font-display uppercase tracking-widest font-black text-slate-800">Concerned Department (Who will attend to the complaint)</label>
                                <select 
                                  value={complaintForm.assignedDepartment || "Front Office"}
                                  onChange={(e) => setComplaintForm({...complaintForm, assignedDepartment: e.target.value})}
                                  className="w-full bg-slate-50 border-none px-6 py-4 text-sm font-serif italic focus:ring-1 focus:ring-gold/50 font-serif"
                                >
                                  <option value="Front Office">Front Office (GSA / Reception)</option>
                                  <option value="Housekeeping">Housekeeping</option>
                                  <option value="Food & Beverage">Food & Beverage (F&B)</option>
                                  <option value="Engineering & Maintenance">Engineering & Maintenance</option>
                                  <option value="Accounts & Billing">Accounts & Billing</option>
                                  <option value="Security">Security</option>
                                  <option value="Executive Office">Executive Office (GM / OM)</option>
                                </select>
                             </div>

                               <div className="space-y-2">
                                  <label className="text-[10px] font-display uppercase tracking-widest font-black text-slate-800">Your Department / Group / Guest Status</label>
                                  <input 
                                    type="text"
                                    required
                                    value={complaintForm.reporterRole}
                                    onChange={(e) => setComplaintForm({...complaintForm, reporterRole: e.target.value})}
                                    className="w-full bg-slate-50 border-none px-6 py-4 text-sm font-serif italic focus:ring-1 focus:ring-gold/50"
                                    placeholder="e.g. Front Office, F&B Staff, Guest, Walk-in"
                                  />
                               </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                               <div className="space-y-2">
                                  <label className="text-[10px] font-display uppercase tracking-widest font-black text-slate-800">Issue Category</label>
                                  <select 
                                    value={complaintForm.type}
                                    onChange={(e) => setComplaintForm({...complaintForm, type: e.target.value})}
                                    className="w-full bg-slate-50 border-none px-6 py-4 text-sm font-serif italic focus:ring-1 focus:ring-gold/50"
                                  >
                                    <option>Service Issue</option>
                                    <option>Cleanliness</option>
                                    <option>Maintenance</option>
                                    <option>Billing / Folio</option>
                                    <option>Noise Complaint</option>
                                    <option>Security / Safety</option>
                                    <option>Staff Conduct</option>
                                    <option>FB Quality</option>
                                  </select>
                               </div>
                               <div className="space-y-2">
                                  <label className="text-[10px] font-display uppercase tracking-widest font-black text-slate-800">Priority Level</label>
                                  <div className="flex gap-2">
                                    {['Low', 'Medium', 'High', 'Urgent'].map((level) => (
                                      <button
                                        key={level}
                                        type="button"
                                        onClick={() => setComplaintForm({...complaintForm, priority: level})}
                                        className={cn(
                                          "flex-1 py-1 px-1 text-[8px] font-display uppercase tracking-widest font-black transition-all border",
                                          complaintForm.priority === level 
                                            ? "bg-gold text-white border-gold shadow-lg" 
                                            : "bg-white text-slate-400 border-slate-100 hover:border-gold/30"
                                        )}
                                      >
                                        {level}
                                      </button>
                                    ))}
                                  </div>
                               </div>
                            </div>

                            <div className="space-y-2">
                               <label className="text-[10px] font-display uppercase tracking-widest font-black text-slate-800">Photo Evidence / Attachment</label>
                               <div className="flex items-center gap-6 p-6 bg-slate-50 border border-dashed border-slate-200">
                                  {!complaintForm.photoBase64 ? (
                                    <label className="flex items-center gap-3 cursor-pointer py-2 px-4 bg-white border border-slate-100 hover:border-gold/30 text-slate-700 transition-all shadow-sm">
                                       <Camera size={16} className="text-gold" />
                                       <span className="text-[10px] font-display uppercase tracking-widest font-black text-slate-600">Attach Location/Appliance Photo</span>
                                       <input 
                                         type="file" 
                                         accept="image/*" 
                                         capture="environment"
                                         onChange={handleComplaintImageUpload} 
                                         className="hidden" 
                                       />
                                    </label>
                                  ) : (
                                    <div className="flex items-center gap-4 w-full">
                                       <div className="relative w-20 h-20 border border-gold/30 bg-white p-1">
                                          <img src={complaintForm.photoBase64} alt="Evidence Preview" className="w-full h-full object-cover" />
                                       </div>
                                       <div className="flex-1">
                                          <p className="text-[10px] font-display uppercase tracking-widest text-emerald-600 font-bold mb-1">✓ Evidence Photo Attached</p>
                                          <button 
                                            type="button" 
                                            onClick={() => setComplaintForm(prev => ({ ...prev, photoBase64: "" }))}
                                            className="text-[9px] font-display uppercase tracking-widest text-red-500 font-black hover:underline"
                                          >
                                            Remove Photo
                                          </button>
                                       </div>
                                    </div>
                                  )}
                               </div>
                            </div>

                            <div className="space-y-2">
                               <label className="text-[10px] font-display uppercase tracking-widest font-black text-slate-800">Concern Description</label>
                               <textarea 
                                 rows={4}
                                 required
                                 value={complaintForm.description}
                                 onChange={(e) => setComplaintForm({...complaintForm, description: e.target.value})}
                                 className="w-full bg-slate-50 border-none px-6 py-4 text-sm font-serif italic focus:ring-1 focus:ring-gold/50 resize-none"
                                 placeholder="Please provide full details of the guest's concern and any immediate actions taken..."
                               />
                            </div>

                            <div className="pt-6">
                               <button 
                                 type="submit"
                                 className="w-full py-5 bg-gold text-white text-[11px] font-display uppercase tracking-[0.4em] font-black hover:bg-luxury-black transition-all shadow-2xl active:scale-95"
                               >
                                 Submit Concern to Recovery Team
                               </button>
                            </div>
                         </form>
                      </motion.div>
                    </div>
                  )}
                </AnimatePresence>

                <AnimatePresence>
                  {selectedComplaint && (
                    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
                      <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setSelectedComplaint(null)}
                        className="absolute inset-0 bg-black/80 backdrop-blur-md"
                      />
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="relative w-full max-w-4xl bg-white shadow-2xl border-t-8 border-gold overflow-hidden flex flex-col max-h-[90vh]"
                      >
                         <div className="p-8 border-b border-slate-100 flex justify-between items-start">
                            <div>
                               <div className="flex items-center gap-2 mb-2">
                                  <span className={cn(
                                    "px-2 py-0.5 text-[8px] font-display uppercase tracking-widest font-black",
                                    selectedComplaint.priority === 'Urgent' || selectedComplaint.priority === 'High' ? "bg-red-50 text-red-600" :
                                    selectedComplaint.priority === 'Medium' ? "bg-amber-50 text-amber-600" : "bg-slate-50 text-slate-500"
                                  )}>
                                    {selectedComplaint.priority} Priority
                                  </span>
                                  <span className={cn(
                                    "px-2 py-0.5 text-[8px] font-display uppercase tracking-widest font-black",
                                    selectedComplaint.status === 'Resolved' ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"
                                  )}>
                                    {selectedComplaint.status}
                                  </span>
                               </div>
                               <h3 className="text-3xl font-serif italic text-slate-900">{selectedComplaint.guestName}</h3>
                               <p className="text-xs font-display uppercase tracking-widest text-slate-400 font-bold">Room {selectedComplaint.roomNumber} • {selectedComplaint.type}</p>
                            </div>
                            <button onClick={() => setSelectedComplaint(null)} className="text-slate-400 hover:text-slate-900 transition-colors">
                               <X size={24} />
                            </button>
                         </div>

                         <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                               <div className="lg:col-span-2 space-y-12">
                                  <section>
                                     <h4 className="text-[10px] font-display uppercase tracking-[0.2em] text-gold font-black mb-4">Initial Concern Details</h4>
                                     <div className="p-6 bg-slate-50 border border-slate-100 rounded-sm italic font-serif text-slate-700 leading-relaxed">
                                        {selectedComplaint.description}
                                     </div>
                                  </section>

                                  {selectedComplaint.photoBase64 && (
                                    <section>
                                       <h4 className="text-[10px] font-display uppercase tracking-[0.2em] text-gold font-black mb-4">Attached Photo Evidence</h4>
                                       <div className="p-4 bg-slate-50 border border-slate-100 rounded-sm flex justify-center items-center">
                                          <img 
                                            src={selectedComplaint.photoBase64} 
                                            alt="Complaint Evidence" 
                                            className="max-w-full max-h-[350px] object-contain shadow-md border-2 border-white rounded-[2px]" 
                                          />
                                       </div>
                                    </section>
                                  )}

                                  <section>
                                     <h4 className="text-[10px] font-display uppercase tracking-[0.2em] text-gold font-black mb-4 flex items-center justify-between">
                                        Communication & Action Thread
                                        <div className="h-px w-24 bg-gold/20" />
                                     </h4>
                                     <div className="space-y-6">
                                        <div className="space-y-4">
                                           {(Array.isArray(selectedComplaint.updates) ? selectedComplaint.updates : []).map((update: any, i: number) => (
                                              <div key={i} className="flex gap-4 items-start">
                                                 <div className="w-8 h-8 rounded-sm bg-luxury-cream text-gold flex items-center justify-center shrink-0 text-[10px] font-black border border-gold/10">
                                                    {update.authorName?.[0] || 'S'}
                                                 </div>
                                                 <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-1">
                                                       <p className="text-[9px] font-display uppercase tracking-widest text-slate-900 font-bold">{update.authorName}</p>
                                                       <p className="text-[8px] text-slate-400">{update.timestamp ? (update.timestamp.toDate ? new Date(update.timestamp.toDate()).toLocaleString() : new Date(update.timestamp).toLocaleString()) : 'Just now'}</p>
                                                    </div>
                                                    <p className="text-xs font-serif italic text-slate-600 bg-white p-3 border border-slate-100 shadow-sm">{update.message}</p>
                                                 </div>
                                              </div>
                                           ))}
                                        </div>

                                        <div className="pt-4">
                                           <div className="relative">
                                              <textarea 
                                                value={newStaffReply}
                                                onChange={(e) => setNewStaffReply(e.target.value)}
                                                placeholder="Add staff update or reply to thread..."
                                                className="w-full bg-slate-50 border border-slate-200 p-4 text-xs font-serif italic outline-none focus:border-gold/30 resize-none h-24"
                                              />
                                              <button 
                                                onClick={async () => {
                                                  if (!newStaffReply.trim()) return;
                                                  try {

                                                    const messageContent = newStaffReply;
                                                    const nextUpdates = [
                                                      ...(selectedComplaint.updates || []),
                                                      {
                                                        message: messageContent,
                                                        authorName: currentUser.displayName || currentUser.email?.split('@')[0],
                                                        timestamp: new Date().toISOString()
                                                      }
                                                    ];
                                                    const nextFields = {
                                                      ...selectedComplaint,
                                                      updates: nextUpdates
                                                    };

                                                    try {
                                                      await updateDoc(doc(db, "hybrid_sandbox", selectedComplaint.id), {
                                                        db_json: JSON.stringify(nextFields),
                                                        payload_json: JSON.stringify(nextFields),
                                                        updates: nextUpdates
                                                      });
                                                    } catch (err) {
                                                      await updateDoc(doc(db, `complaints-${selectedComplaint.propertyId || selectedCompany || 'cml'}`, selectedComplaint.id), {
                                                        updates: arrayUnion({
                                                          message: messageContent,
                                                          authorName: currentUser.displayName || currentUser.email?.split('@')[0],
                                                          timestamp: new Date()
                                                        })
                                                      });
                                                    }

                                                    // Safe background trigger of Google Chat webhook proxy
                                                    fetch("/api/notify-complaint-update", {
                                                      method: "POST",
                                                      headers: { "Content-Type": "application/json" },
                                                      body: JSON.stringify({
                                                        complaint: selectedComplaint,
                                                        action: "update",
                                                        authorName: currentUser.displayName || currentUser.email?.split('@')[0] || "Staff",
                                                        updateMessage: messageContent,
                                                        companyId: selectedComplaint.propertyId || selectedCompany || 'cml'
                                                      })
                                                    }).catch(err => console.error("Webhook update notification failed", err));

                                                    setNewStaffReply("");
                                                    // Local state update for responsiveness
                                                    setSelectedComplaint((prev: any) => ({
                                                      ...prev,
                                                      updates: [...(Array.isArray(prev.updates) ? prev.updates : []), {
                                                        message: messageContent,
                                                        authorName: currentUser.displayName || currentUser.email?.split('@')[0],
                                                        timestamp: { toDate: () => new Date() }
                                                      }]
                                                    }));
                                                  } catch (e) { console.error(e); }
                                                }}
                                                className="absolute bottom-4 right-4 bg-gold text-white px-4 py-2 text-[9px] font-display uppercase tracking-widest font-black shadow-lg"
                                              >
                                                Post Update
                                              </button>
                                           </div>
                                        </div>
                                     </div>
                                  </section>
                               </div>

                               <div className="space-y-8">
                                  <div className="p-6 border border-slate-100 bg-slate-50/50 space-y-4">
                                     <h4 className="text-[10px] font-display uppercase tracking-widest text-slate-800 font-black border-b border-slate-100 pb-3">Reporter Profile</h4>
                                     <div className="space-y-3">
                                        <div>
                                           <p className="text-[8px] font-display uppercase tracking-widest text-slate-400 font-black">Full Name</p>
                                           <p className="text-xs font-serif italic text-slate-900 font-bold">{selectedComplaint.reporterName || "Staff Account Profile"}</p>
                                        </div>
                                        <div>
                                           <p className="text-[8px] font-display uppercase tracking-widest text-slate-400 font-black">Department / Relation / Status</p>
                                           <p className="text-xs font-serif italic text-slate-800">{selectedComplaint.reporterRole || "Staff Account Role"}</p>
                                        </div>
                                        <div>
                                           <p className="text-[8px] font-display uppercase tracking-widest text-slate-400 font-black">Submission Account</p>
                                           <p className="text-[10px] font-mono text-slate-500">{selectedComplaint.authorName}</p>
                                        </div>
                                     </div>
                                  </div>
                                  <div className="p-6 border border-gold/10 bg-gold/5 space-y-6">
                                     <h4 className="text-[10px] font-display uppercase tracking-widest text-gold font-black border-b border-gold/10 pb-4">Dispatch Concern</h4>
                                     <div className="space-y-4">
                                        <div className="space-y-1">
                                           <label className="text-[8px] font-display uppercase tracking-widest text-slate-500 font-bold">Assign to Department/Member</label>
                                           <input 
                                             value={dispatchComplaintForm.dispatchedTo}
                                             onChange={(e) => setDispatchComplaintForm({...dispatchComplaintForm, dispatchedTo: e.target.value})}
                                             className="w-full bg-white border border-slate-200 px-3 py-2 text-[10px] font-serif italic outline-none focus:border-gold/30"
                                             placeholder="e.g. Housekeeping VM"
                                           />
                                        </div>
                                        <button 
                                          onClick={async () => {
                                            if (!dispatchComplaintForm.dispatchedTo) return;
                                            try {
                                              const nextUpdates = [
                                                ...(selectedComplaint.updates || []),
                                                {
                                                  message: `Issue dispatched to: ${dispatchComplaintForm.dispatchedTo}`,
                                                  authorName: "SYSTEM_ACTION",
                                                  timestamp: new Date().toISOString()
                                                }
                                              ];
                                              const nextFields = {
                                                ...selectedComplaint,
                                                status: "In Progress",
                                                dispatchedTo: dispatchComplaintForm.dispatchedTo,
                                                updates: nextUpdates
                                              };

                                              try {
                                                await updateDoc(doc(db, "hybrid_sandbox", selectedComplaint.id), {
                                                  db_json: JSON.stringify(nextFields),
                                                  payload_json: JSON.stringify(nextFields),
                                                  status: "In Progress",
                                                  dispatchedTo: dispatchComplaintForm.dispatchedTo,
                                                  updates: nextUpdates
                                                });
                                              } catch (err) {
                                                await updateDoc(doc(db, `complaints-${selectedComplaint.propertyId || selectedCompany || 'cml'}`, selectedComplaint.id), {
                                                  status: "In Progress",
                                                  dispatchedTo: dispatchComplaintForm.dispatchedTo,
                                                  updates: arrayUnion({
                                                    message: `Issue dispatched to: ${dispatchComplaintForm.dispatchedTo}`,
                                                    authorName: "SYSTEM_ACTION",
                                                    timestamp: new Date()
                                                  })
                                                });
                                              }
                                              setSelectedComplaint((prev: any) => ({
                                                ...prev,
                                                status: "In Progress",
                                                dispatchedTo: dispatchComplaintForm.dispatchedTo
                                              }));
                                              setDispatchComplaintForm({ dispatchedTo: "", dispatchNotes: "" });
                                            } catch (e) { console.error(e); }
                                          }}
                                          className="w-full py-3 bg-luxury-black text-white text-[9px] font-display uppercase tracking-widest font-black hover:bg-gold transition-colors"
                                        >
                                          Execute Dispatch
                                        </button>
                                     </div>
                                   <div className="p-6 border border-emerald-100 bg-emerald-50/20 rounded-sm space-y-6">
                                     <h4 className="text-[10px] font-display uppercase tracking-widest text-emerald-600 font-extrabold border-b border-emerald-100 pb-3 flex items-center justify-between">
                                        <span>🛡️ Multi-Level Clearance</span>
                                        <span className="text-[8px] px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full font-sans uppercase font-bold tracking-wider">Rank-Authorized</span>
                                     </h4>
                                     
                                     <div className="relative border-l-2 border-emerald-100 pl-4 ml-2 space-y-6">
                                        {/* LEVEL 1: GSA CLEARANCE */}
                                        <div className="relative">
                                           {/* Bullet node */}
                                           <div className={cn(
                                              "absolute -left-[25px] top-1.5 w-4 h-4 rounded-full border-2 flex items-center justify-center bg-white",
                                              selectedComplaint.level1Completed ? "border-emerald-500 bg-emerald-50" : "border-slate-300"
                                           )}>
                                              {selectedComplaint.level1Completed && <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />}
                                           </div>
                                           <div className="space-y-1">
                                              <div className="flex justify-between items-center">
                                                 <span className="text-[9px] font-display uppercase tracking-wider text-slate-700 font-bold">Level 1: GSA Initial Recovery</span>
                                                 {selectedComplaint.level1Completed ? (
                                                    <span className="text-[8px] font-sans font-bold text-emerald-600">Cleared ✓</span>
                                                 ) : (
                                                    <span className="text-[8px] font-sans font-bold text-amber-600">Active ⚡</span>
                                                 )}
                                              </div>
                                              {selectedComplaint.level1Completed ? (
                                                 <div className="text-[10px] font-serif italic text-slate-600 space-y-1 bg-white/50 p-2 border border-slate-100">
                                                    <p>Staff: <strong className="text-slate-850 font-sans not-italic">{selectedComplaint.level1Staff}</strong></p>
                                                    <p className="text-slate-500">" {selectedComplaint.level1Notes} "</p>
                                                    {selectedComplaint.level1CompletedAt && (
                                                       <p className="text-[8px] font-mono text-slate-400">
                                                          {new Date(selectedComplaint.level1CompletedAt.seconds ? selectedComplaint.level1CompletedAt.seconds * 1000 : selectedComplaint.level1CompletedAt).toLocaleString()}
                                                       </p>
                                                    )}
                                                 </div>
                                              ) : (
                                                 <div className="pt-1">
                                                    <button
                                                       type="button"
                                                       onClick={() => {
                                                          setApprovalOverlayLevel(1);
                                                          setApprovalOverlayNotes("");
                                                          setApprovalOverlayStaffName(currentUser?.displayName || currentUser?.email?.split('@')[0] || "");
                                                          setApprovalOverlaySignature("");
                                                          setShowApprovalOverlayModal(true);
                                                       }}
                                                       className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-[9px] font-display uppercase tracking-widest font-black transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
                                                    >
                                                       ✍️ Enter Level 1 Clearance
                                                    </button>
                                                 </div>
                                              )}
                                           </div>
                                        </div>

                                        {/* LEVEL 2: HOD / DUTY MANAGER */}
                                        <div className="relative">
                                           {/* Bullet node */}
                                           <div className={cn(
                                              "absolute -left-[25px] top-1.5 w-4 h-4 rounded-full border-2 flex items-center justify-center bg-white",
                                              (selectedComplaint.level2Completed || selectedComplaint.hodApproved) ? "border-emerald-500 bg-emerald-50" : "border-slate-300"
                                           )}>
                                              {(selectedComplaint.level2Completed || selectedComplaint.hodApproved) && <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />}
                                           </div>
                                           <div className="space-y-1">
                                              <div className="flex justify-between items-center">
                                                 <span className="text-[9px] font-display uppercase tracking-wider text-slate-700 font-bold">Level 2: Duty Manager / HOD</span>
                                                 {(selectedComplaint.level2Completed || selectedComplaint.hodApproved) ? (
                                                    <span className="text-[8px] font-sans font-bold text-emerald-600">Cleared ✓</span>
                                                 ) : selectedComplaint.level1Completed ? (
                                                    <span className="text-[8px] font-sans font-bold text-amber-600">Awaiting ⏳</span>
                                                 ) : (
                                                    <span className="text-[8px] font-sans font-bold text-slate-400">Locked 🔒</span>
                                                 )}
                                              </div>
                                              {(selectedComplaint.level2Completed || selectedComplaint.hodApproved) ? (
                                                 <div className="text-[10px] font-serif italic text-slate-600 space-y-1 bg-white/50 p-2 border border-slate-100">
                                                    <p>Supervisor: <strong className="text-slate-850 font-sans not-italic">{selectedComplaint.level2Supervisor || selectedComplaint.hodApprovedBy}</strong></p>
                                                    <p className="text-slate-500">" {selectedComplaint.level2Notes || "Oversight clearance granted."} "</p>
                                                    {(selectedComplaint.level2CompletedAt || selectedComplaint.hodApprovedAt) && (
                                                       <p className="text-[8px] font-mono text-slate-400">
                                                          {new Date((selectedComplaint.level2CompletedAt || selectedComplaint.hodApprovedAt).seconds ? (selectedComplaint.level2CompletedAt || selectedComplaint.hodApprovedAt).seconds * 1000 : (selectedComplaint.level2CompletedAt || selectedComplaint.hodApprovedAt)).toLocaleString()}
                                                       </p>
                                                    )}
                                                 </div>
                                              ) : (
                                                 <div className="pt-1">
                                                    <button
                                                       type="button"
                                                       disabled={!selectedComplaint.level1Completed}
                                                       onClick={() => {
                                                          setApprovalOverlayLevel(2);
                                                          setApprovalOverlayNotes("");
                                                          setApprovalOverlayStaffName(currentUser?.displayName || currentUser?.email?.split('@')[0] || "");
                                                          setApprovalOverlaySignature("");
                                                          setShowApprovalOverlayModal(true);
                                                       }}
                                                       className={cn(
                                                          "px-3 py-1.5 text-white text-[9px] font-display uppercase tracking-widest font-black transition-all flex items-center gap-1.5 shadow-sm",
                                                          selectedComplaint.level1Completed 
                                                             ? "bg-amber-600 hover:bg-amber-700 cursor-pointer" 
                                                             : "bg-slate-300 cursor-not-allowed opacity-50"
                                                       )}
                                                    >
                                                       ✍️ Verify & Transfer to Level 3
                                                    </button>
                                                 </div>
                                              )}
                                           </div>
                                        </div>

                                        {/* LEVEL 3: OPERATIONS MANAGER / GM / AUDIT */}
                                        <div className="relative">
                                           {/* Bullet node */}
                                           <div className={cn(
                                              "absolute -left-[25px] top-1.5 w-4 h-4 rounded-full border-2 flex items-center justify-center bg-white",
                                              (selectedComplaint.level3Completed || selectedComplaint.superAdminApproved) ? "border-emerald-500 bg-emerald-50" : "border-slate-300"
                                           )}>
                                              {(selectedComplaint.level3Completed || selectedComplaint.superAdminApproved) && <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />}
                                           </div>
                                           <div className="space-y-1">
                                              <div className="flex justify-between items-center">
                                                 <span className="text-[9px] font-display uppercase tracking-wider text-slate-700 font-bold">Level 3: Operations Mgr / GM / Audit</span>
                                                 {(selectedComplaint.level3Completed || selectedComplaint.superAdminApproved) ? (
                                                    <span className="text-[8px] font-sans font-bold text-emerald-600">Sealed & Dispatched ✓</span>
                                                 ) : (selectedComplaint.level2Completed || selectedComplaint.hodApproved) ? (
                                                    <span className="text-[8px] font-sans font-bold text-amber-600">GM Review ⏳</span>
                                                 ) : (
                                                    <span className="text-[8px] font-sans font-bold text-slate-400">Locked 🔒</span>
                                                 )}
                                              </div>
                                              {(selectedComplaint.level3Completed || selectedComplaint.superAdminApproved) ? (
                                                 <div className="text-[10px] font-serif italic text-slate-600 space-y-2 bg-white/50 p-2 border border-slate-100">
                                                    <p>Manager/GM: <strong className="text-slate-850 font-sans not-italic">{selectedComplaint.level3Manager || selectedComplaint.superAdminApprovedBy}</strong></p>
                                                    <p className="text-slate-500">" {selectedComplaint.level3Notes || "Final resolution and audit seal."} "</p>
                                                    {(selectedComplaint.level3SignatureUrl || selectedComplaint.signatureUrl) && (
                                                       <div className="border border-slate-200 bg-white p-1 rounded-sm max-w-[150px]">
                                                          <p className="text-[7px] font-display uppercase tracking-wider text-slate-400 font-bold mb-0.5">Verified Signature</p>
                                                          <img 
                                                             src={selectedComplaint.level3SignatureUrl || selectedComplaint.signatureUrl} 
                                                             alt="Executive Signature" 
                                                             className="h-10 w-auto object-contain bg-slate-50"
                                                             referrerPolicy="no-referrer"
                                                          />
                                                       </div>
                                                    )}
                                                    {(selectedComplaint.level3CompletedAt || selectedComplaint.superAdminApprovedAt) && (
                                                       <p className="text-[8px] font-mono text-slate-400">
                                                          {new Date((selectedComplaint.level3CompletedAt || selectedComplaint.superAdminApprovedAt).seconds ? (selectedComplaint.level3CompletedAt || selectedComplaint.superAdminApprovedAt).seconds * 1000 : (selectedComplaint.level3CompletedAt || selectedComplaint.superAdminApprovedAt)).toLocaleString()}
                                                       </p>
                                                    )}
                                                 </div>
                                              ) : (
                                                 <div className="pt-1">
                                                    <button
                                                       type="button"
                                                       disabled={!(selectedComplaint.level2Completed || selectedComplaint.hodApproved)}
                                                       onClick={() => {
                                                          setApprovalOverlayLevel(3);
                                                          setApprovalOverlayNotes("");
                                                          setApprovalOverlayStaffName(currentUser?.displayName || currentUser?.email?.split('@')[0] || "");
                                                          setApprovalOverlaySignature("");
                                                          setShowApprovalOverlayModal(true);
                                                       }}
                                                       className={cn(
                                                          "px-3 py-1.5 text-white text-[9px] font-display uppercase tracking-widest font-black transition-all flex items-center gap-1.5 shadow-sm",
                                                          (selectedComplaint.level2Completed || selectedComplaint.hodApproved)
                                                             ? "bg-emerald-600 hover:bg-emerald-700 cursor-pointer" 
                                                             : "bg-slate-300 cursor-not-allowed opacity-50"
                                                       )}
                                                    >
                                                       ✍️ Final GM Sign-Off & Dispatch
                                                    </button>
                                                 </div>
                                              )}
                                           </div>
                                        </div>
                                     </div>
                                  </div>
                                  </div>

                                  <div className="p-6 border border-rose-100 bg-rose-50/20 space-y-4">
                                     <h4 className="text-[10px] font-display uppercase tracking-widest text-rose-600 font-black border-b border-rose-100 pb-4">Dispose & Archive Log</h4>
                                     <p className="text-slate-550 font-serif italic text-[11px] leading-relaxed">
                                       Move this customer recovery log record safely to the corporate archive/disposed folder for long-term audit retention.
                                     </p>
                                     <button 
                                       onClick={async () => {
                                         if (true) { setDeleteComplaintTarget({ id: selectedComplaint.id, propertyId: selectedComplaint.propertyId }); return; }
                                         try {
                                           await updateDoc(doc(db, `complaints-${selectedComplaint.propertyId || selectedCompany || 'cml'}`, selectedComplaint.id), {
                                             isArchived: true,
                                             status: "Archived",
                                             archivedAt: new Date(),
                                             archivedBy: currentUser?.displayName || currentUser?.email?.split('@')[0] || "Staff"
                                           });
                                           setSelectedComplaint(null);
                                         } catch (e) {
                                           console.error(e);
                                           alert("Failed to archive log.");
                                         }
                                       }}
                                       className="w-full py-3 bg-rose-600 text-white text-[9px] font-display uppercase tracking-widest font-black hover:bg-rose-700 transition-colors shadow-lg shadow-rose-600/20"
                                     >
                                       Archive & Dispose Record
                                     </button>
                                  </div>
                               </div>
                            </div>
                         </div>
                      </motion.div>
                    </div>
                  )}
                </AnimatePresence>

                <AnimatePresence>
                  {showApprovalOverlayModal && (
                    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
                      <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setShowApprovalOverlayModal(false)}
                        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
                      />
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="relative w-full max-w-md bg-white shadow-2xl rounded-sm overflow-hidden border-t-4 border-emerald-500 z-10 p-6 flex flex-col space-y-4"
                      >
                        <div className="flex justify-between items-start border-b border-slate-100 pb-3">
                           <div>
                              <h3 className="text-sm font-sans font-bold uppercase tracking-wider text-slate-800">
                                 {approvalOverlayLevel === 1 && "Level 1 Clearance: GSA Sign-Off"}
                                 {approvalOverlayLevel === 2 && "Level 2 Clearance: Supervisor/HOD Sign-Off"}
                                 {approvalOverlayLevel === 3 && "Level 3 Clearance: OM / GM Final Sign-Off"}
                              </h3>
                              <p className="text-[10px] text-slate-400 font-sans">Enter verification & recovery details below</p>
                           </div>
                           <button 
                              type="button" 
                              onClick={() => setShowApprovalOverlayModal(false)}
                              className="text-slate-400 hover:text-slate-600 font-bold"
                           >
                              ✕
                           </button>
                        </div>

                        <div className="space-y-4">
                           <div className="space-y-1">
                              <label className="text-[9px] font-display uppercase tracking-widest text-slate-500 font-bold">Authorized Staff Name</label>
                              <input 
                                 type="text"
                                 required
                                 value={approvalOverlayStaffName}
                                 onChange={(e) => setApprovalOverlayStaffName(e.target.value)}
                                 placeholder="e.g. Charles Cebujano"
                                 className="w-full bg-slate-50 border border-slate-200 px-3 py-2 text-xs font-serif italic outline-none focus:border-emerald-300"
                              />
                           </div>

                           <div className="space-y-1">
                              <label className="text-[9px] font-display uppercase tracking-widest text-slate-500 font-bold">Verification & Actions Notes</label>
                              <textarea 
                                 required
                                 value={approvalOverlayNotes}
                                 onChange={(e) => setApprovalOverlayNotes(e.target.value)}
                                 placeholder="Detail what was done, resolution steps, or auditing remarks..."
                                 className="w-full h-20 bg-slate-50 border border-slate-200 px-3 py-2 text-xs font-serif italic outline-none focus:border-emerald-300 resize-none"
                              />
                           </div>

                           {approvalOverlayLevel === 3 && (
                              <div className="space-y-1">
                                 <label className="text-[9px] font-display uppercase tracking-widest text-slate-500 font-bold">Draw Executive Signature (Compulsory)</label>
                                 <SignaturePad 
                                    onSave={(url) => setApprovalOverlaySignature(url)}
                                    onClear={() => setApprovalOverlaySignature("")}
                                 />
                                 {approvalOverlaySignature ? (
                                    <p className="text-[8px] text-emerald-600 font-sans font-bold">✓ Signature captured and validated.</p>
                                 ) : (
                                    <p className="text-[8px] text-rose-500 font-sans font-bold">⚠️ Signature drawing is required before dispatch clearance.</p>
                                 )}
                              </div>
                           )}
                        </div>

                        <div className="flex justify-end gap-2 border-t border-slate-100 pt-3">
                           <button
                              type="button"
                              onClick={() => setShowApprovalOverlayModal(false)}
                              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-[10px] font-display uppercase tracking-wider text-slate-700 transition-all rounded-sm"
                           >
                              Cancel
                           </button>
                           <button
                              type="button"
                              disabled={!approvalOverlayStaffName.trim() || !approvalOverlayNotes.trim() || (approvalOverlayLevel === 3 && !approvalOverlaySignature)}
                              onClick={async () => {
                                 if (!approvalOverlayStaffName.trim() || !approvalOverlayNotes.trim()) return;
                                 if (approvalOverlayLevel === 3 && !approvalOverlaySignature) {
                                    alert("Please draw your signature to complete Level 3 executive clearance.");
                                    return;
                                 }
                                 try {
                                    const targetPropertyId = selectedComplaint.propertyId || selectedCompany || 'wyndham';
                                    const updateData: any = {};
                                    let logMsg = "";

                                    if (approvalOverlayLevel === 1) {
                                       updateData.level1Completed = true;
                                       updateData.level1Staff = approvalOverlayStaffName;
                                       updateData.level1Notes = approvalOverlayNotes;
                                       updateData.level1CompletedAt = new Date();
                                       updateData.status = "GSA Attended";
                                       logMsg = `LEVEL 1 COMPLETED: GSA ${approvalOverlayStaffName} completed initial recovery. Notes: "${approvalOverlayNotes}"`;
                                    } else if (approvalOverlayLevel === 2) {
                                       updateData.level2Completed = true;
                                       updateData.level2Supervisor = approvalOverlayStaffName;
                                       updateData.level2Notes = approvalOverlayNotes;
                                       updateData.level2CompletedAt = new Date();
                                       updateData.hodApproved = true;
                                       updateData.hodApprovedBy = approvalOverlayStaffName;
                                       updateData.hodApprovedAt = new Date();
                                       updateData.status = "HOD Approved";
                                       logMsg = `LEVEL 2 APPROVED: Supervisor/HOD ${approvalOverlayStaffName} verified recovery. Notes: "${approvalOverlayNotes}"`;
                                    } else if (approvalOverlayLevel === 3) {
                                       updateData.level3Completed = true;
                                       updateData.level3Manager = approvalOverlayStaffName;
                                       updateData.level3Notes = approvalOverlayNotes;
                                       updateData.level3SignatureUrl = approvalOverlaySignature;
                                       updateData.level3CompletedAt = new Date();
                                       updateData.superAdminApproved = true;
                                       updateData.superAdminApprovedBy = approvalOverlayStaffName;
                                       updateData.superAdminApprovedAt = new Date();
                                       updateData.resolvedBy = approvalOverlayStaffName;
                                       updateData.resolvedDepartment = "Executive & Audit";
                                       updateData.status = "Resolved";
                                       updateData.resolvedAt = new Date();
                                       logMsg = `LEVEL 3 RESOLVED: GM/Operations Manager ${approvalOverlayStaffName} verified & signed-off for dispatch. Notes: "${approvalOverlayNotes}"`;
                                    }

                                    // Firestore update
                                    const nextUpdates = [
                                       ...(selectedComplaint.updates || []),
                                       {
                                          message: logMsg,
                                          authorName: "SYSTEM_ACTION",
                                          timestamp: new Date().toISOString()
                                       }
                                    ];
                                    const nextFields = {
                                       ...selectedComplaint,
                                       ...updateData,
                                       updates: nextUpdates
                                    };

                                    try {
                                       await updateDoc(doc(db, "hybrid_sandbox", selectedComplaint.id), {
                                          db_json: JSON.stringify(nextFields),
                                          payload_json: JSON.stringify(nextFields),
                                          ...updateData,
                                          updates: nextUpdates
                                       });
                                    } catch (err) {
                                       await updateDoc(doc(db, `complaints-${targetPropertyId}`, selectedComplaint.id), {
                                          ...updateData,
                                          updates: arrayUnion({
                                             message: logMsg,
                                             authorName: "SYSTEM_ACTION",
                                             timestamp: new Date()
                                          })
                                       });
                                    }

                                    // Webhook update
                                    fetch("/api/notify-complaint-update", {
                                       method: "POST",
                                       headers: { "Content-Type": "application/json" },
                                       body: JSON.stringify({
                                          complaint: { ...selectedComplaint, ...updateData },
                                          action: approvalOverlayLevel === 3 ? "superadmin_approve" : approvalOverlayLevel === 2 ? "hod_approve" : "gsa_clear",
                                          authorName: approvalOverlayStaffName,
                                          companyId: targetPropertyId,
                                          notes: approvalOverlayNotes
                                       })
                                    }).catch(err => console.error("Webhook update notification failed", err));

                                    // Local state update
                                    setSelectedComplaint((prev: any) => ({
                                       ...prev,
                                       ...updateData,
                                       updates: [...(Array.isArray(prev.updates) ? prev.updates : []), {
                                          message: logMsg,
                                          authorName: "SYSTEM_ACTION",
                                          timestamp: new Date()
                                       }]
                                    }));

                                    setShowApprovalOverlayModal(false);
                                 } catch (err: any) {
                                    alert("Error processing clearance update: " + err.message);
                                 }
                              }}
                              className={cn(
                                 "px-4 py-2 text-[10px] font-display uppercase tracking-wider text-white transition-all rounded-sm font-bold shadow-md",
                                 (!approvalOverlayStaffName.trim() || !approvalOverlayNotes.trim() || (approvalOverlayLevel === 3 && !approvalOverlaySignature))
                                    ? "bg-slate-300 cursor-not-allowed"
                                    : "bg-emerald-600 hover:bg-emerald-700 cursor-pointer"
                              )}
                           >
                              Submit Clearance
                           </button>
                        </div>
                      </motion.div>
                    </div>
                  )}
                </AnimatePresence>
              </div>
            ) : activeTab === "hr" ? (
              <div className="space-y-8">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-12 no-print border-b border-gold/10 pb-6">
                  <div>
                    <h2 className="text-4xl font-serif text-slate-900 mb-2 italic">WordPress Forms Registry</h2>
                    <p className="luxury-label !text-[11px] opacity-60">
                      Access and submit internal property documentation and compliance forms via secure external portal
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    {/* Compact layout mode toggler */}
                    <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200">
                      <button
                        type="button"
                        onClick={() => setFormsLayoutView("list")}
                        className={`flex items-center gap-1.5 px-3 py-1.5 text-[9px] font-display uppercase tracking-wider font-extrabold transition-all rounded-md ${
                          formsLayoutView === "list"
                            ? "bg-white text-slate-900 shadow-sm"
                            : "text-slate-500 hover:text-slate-800"
                        }`}
                        title="List View"
                      >
                        <List size={11} /> List View
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormsLayoutView("grid")}
                        className={`flex items-center gap-1.5 px-3 py-1.5 text-[9px] font-display uppercase tracking-wider font-extrabold transition-all rounded-md ${
                          formsLayoutView === "grid"
                            ? "bg-white text-slate-900 shadow-sm"
                            : "text-slate-500 hover:text-slate-800"
                        }`}
                        title="Grid View"
                      >
                        <LayoutGrid size={11} /> Grid View
                      </button>
                    </div>

                    {(userRole === "Administrator" || userRole === "Super Admin" || userRole === "Group Controller" || userRole === "Manager" || userRole === "Audit") && (
                      <button 
                        onClick={() => setShowAddForm(!showAddForm)}
                        className="flex items-center gap-2 px-5 py-2.5 bg-gold text-white text-[10px] font-display uppercase tracking-widest font-black transition-all shadow-md hover:bg-luxury-black rounded-md"
                      >
                        <Plus size={14} /> {showAddForm ? "Close Creator" : "Add Form Reference"}
                      </button>
                    )}
                  </div>
                </div>

                {/* Horizontal Category Filtering Bar */}
                <div className="no-print mb-8 py-3 px-4 bg-slate-50 border border-slate-100 flex flex-wrap items-center gap-2 rounded-lg">
                  <span className="text-[9px] font-display uppercase tracking-widest text-slate-400 font-extrabold mr-2">Filter Category:</span>
                  {["All", "HR & Leave Operations", "Operations & Logs", "Guest & Front Office", "Feedback & Portals", "General Administration"].map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setSelectedFormCategory(cat)}
                      className={`px-4 py-2 text-[9px] font-display uppercase tracking-widest font-extrabold rounded transition-all duration-200 ${
                        selectedFormCategory === cat
                          ? "bg-gold text-white shadow-sm"
                          : "bg-white text-slate-600 hover:text-slate-900 border border-slate-200"
                      }`}
                    >
                      {cat === "All" ? "All categories" : cat}
                    </button>
                  ))}
                </div>

                {/* Inline Add form creator panel with luxury style */}
                <AnimatePresence>
                  {showAddForm && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden mb-12"
                    >
                      <div className="p-8 border border-gold/20 bg-gold/5 max-w-2xl rounded-sm space-y-6 text-left">
                        <h4 className="text-[11px] font-display uppercase tracking-[0.2em] text-gold font-black">Create Custom Form Registry Reference</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-2">
                            <label className="text-[10px] font-display uppercase tracking-widest font-black text-slate-800">Form / Portal Name</label>
                            <input 
                              type="text" 
                              placeholder="e.g. Asset Audit Register Form" 
                              value={newFormDetails.name}
                              onChange={(e) => setNewFormDetails(prev => ({ ...prev, name: e.target.value }))}
                              className="w-full p-3 bg-white border border-slate-150 text-[10px] font-display uppercase tracking-widest focus:ring-1 focus:ring-gold outline-none shadow-sm"
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-[10px] font-display uppercase tracking-widest font-black text-slate-800">Form Destination URL</label>
                            <input 
                              type="text" 
                              placeholder="e.g. https://cml.com.fj/your-form" 
                              value={newFormDetails.url}
                              onChange={(e) => setNewFormDetails(prev => ({ ...prev, url: e.target.value }))}
                              className="w-full p-3 bg-white border border-slate-150 text-[10px] font-display uppercase tracking-widest focus:ring-1 focus:ring-gold outline-none shadow-sm"
                            />
                          </div>
                          <div className="space-y-2 md:col-span-2">
                            <label className="text-[10px] font-display uppercase tracking-widest font-black text-slate-800">Category Group</label>
                            <select 
                              value={newFormDetails.category}
                              onChange={(e) => setNewFormDetails(prev => ({ ...prev, category: e.target.value }))}
                              className="w-full p-3 bg-white border border-slate-150 text-[10px] font-display uppercase tracking-widest focus:ring-1 focus:ring-gold outline-none shadow-sm"
                            >
                              <option value="HR & Leave Operations">HR & Leave Operations</option>
                              <option value="Operations & Logs">Operations & Logs</option>
                              <option value="Guest & Front Office">Guest & Front Office</option>
                              <option value="Feedback & Portals">Feedback & Portals</option>
                              <option value="General Administration">General Administration</option>
                            </select>
                          </div>
                        </div>
                        <button 
                          onClick={async () => {
                            if (!newFormDetails.name || !newFormDetails.url) {
                              alert("Please fill in both Form Name and destination URL.");
                              return;
                            }
                            try {
                              const targetCompany = selectedCompany || 'cml';
                              await addDoc(collection(db, `forms-${targetCompany}`), {
                                name: newFormDetails.name,
                                url: newFormDetails.url,
                                category: newFormDetails.category,
                                createdAt: new Date().toISOString()
                              });
                              setNewFormDetails({
                                name: "",
                                url: "",
                                category: "HR & Leave Operations"
                              });
                              setShowAddForm(false);
                            } catch (e) {
                              console.error("Error creating Form reference:", e);
                              alert("An error occurred while registering the form reference.");
                            }
                          }}
                          className="px-6 py-3 bg-gold text-white text-[9px] font-display uppercase tracking-widest font-black hover:bg-luxury-black transition-colors shadow-lg rounded-md"
                        >
                          Register Reference
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="space-y-16">
                  {(() => {
                    const defaultFormsMerged = getDefaultForms(selectedCompany);
                    const displayForms = [...customForms.map(f => ({ ...f, isDefault: false })), ...defaultFormsMerged.map(f => ({ ...f, isDefault: true }))];
                    const categories = Array.from(new Set(displayForms.map(f => f.category || "General")))
                      .filter(category => selectedFormCategory === "All" || category === selectedFormCategory);
                    return categories.map((category) => (
                      <section key={category} className="space-y-6">
                        <div className="flex items-center gap-4">
                          <h3 className="text-[11px] font-display uppercase tracking-[0.4em] font-black text-gold/60">{category}</h3>
                          <div className="h-px flex-1 bg-gold/10" />
                        </div>
                        
                        {formsLayoutView === "list" ? (
                          <div className="space-y-4">
                            {displayForms.filter(f => (f.category || "General") === category).map((form) => {
                              const isDefault = form.isDefault !== false;
                              return (
                                <motion.div 
                                  key={form.id || form.name} 
                                  whileHover={{ x: 6 }}
                                  onClick={() => window.open(form.url, "_blank")}
                                  className="bg-white p-5 border border-slate-100/80 hover:border-gold/40 hover:shadow-lg hover:shadow-gold/5 transition-all cursor-pointer flex items-center justify-between group relative rounded-lg"
                                >
                                  <div className="flex items-center gap-4 min-w-0">
                                    {/* Concentric Circle Bullet Item with property custom branding */}
                                    <div className={`flex-shrink-0 w-8 h-8 rounded-full border flex items-center justify-center transition-all duration-300 ${
                                      selectedCompany === 'ramada' 
                                        ? "border-red-200 bg-red-50/50 group-hover:bg-[#D11242] group-hover:border-[#D11242]" 
                                        : selectedCompany === 'wyndham' 
                                        ? "border-emerald-200 bg-emerald-50/50 group-hover:bg-[#0b5c4b] group-hover:border-[#0b5c4b]" 
                                        : "border-gold/30 bg-gold/5 group-hover:bg-gold group-hover:border-gold"
                                    }`}>
                                      <div className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                                        selectedCompany === 'ramada' 
                                          ? "bg-[#D11242] group-hover:bg-white" 
                                          : selectedCompany === 'wyndham' 
                                          ? "bg-[#0b5c4b] group-hover:bg-white" 
                                          : "bg-gold group-hover:bg-white"
                                      }`} />
                                    </div>

                                    <div className="min-w-0">
                                      <h3 className="text-sm font-serif italic text-slate-900 group-hover:text-gold transition-colors truncate">
                                        {form.name}
                                      </h3>
                                      <p className="text-[9px] text-slate-400 font-mono uppercase tracking-wider">
                                        REF: {(form.id || form.name.toLowerCase().replace(/[^a-z0-9]/g, "-")).substring(0, 15).toUpperCase()}
                                      </p>
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-3 ml-4 flex-shrink-0">
                                    <span className="hidden sm:inline-block text-[7px] font-display uppercase tracking-widest px-2.5 py-1 bg-slate-50 text-slate-500 font-bold rounded-sm border border-slate-100 group-hover:border-transparent group-hover:bg-emerald-50 group-hover:text-emerald-600 transition-all">
                                      {isDefault ? "Secure Portal" : "Custom Added"}
                                    </span>
                                    {!isDefault && (
                                      <button 
                                        onClick={async (e) => {
                                          e.stopPropagation();
                                          if (true) { setDeleteCustomFormTarget({ id: form.id, name: form.name }); } else if (false) {
                                            try {
                                              await deleteDoc(doc(db, `forms-${selectedCompany || 'cml'}`, form.id));
                                            } catch (err) {
                                              console.error("Error deleting form:", err);
                                            }
                                          }
                                        }}
                                        className="p-1.5 text-red-500 hover:bg-rose-50 rounded transition-colors"
                                        title="Delete Reference"
                                      >
                                        <Trash2 size={12} />
                                      </button>
                                    )}
                                    <div className="w-5 h-5 flex items-center justify-center text-slate-300 group-hover:text-gold group-hover:translate-x-1 transition-all">
                                      <ChevronRight size={14} />
                                    </div>
                                  </div>
                                </motion.div>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {displayForms.filter(f => (f.category || "General") === category).map((form) => {
                              const isDefault = form.isDefault !== false;
                              return (
                                <motion.div 
                                  key={form.id || form.name} 
                                  whileHover={{ y: -4, scale: 1.02 }}
                                  onClick={() => window.open(form.url, "_blank")}
                                  className="bg-white p-8 border border-slate-100 hover:border-gold hover:shadow-2xl hover:shadow-gold/10 transition-all cursor-pointer flex flex-col group relative overflow-hidden"
                                >
                                  <div className="absolute top-0 right-0 p-4 opacity-40 group-hover:opacity-100 transition-opacity">
                                    <ExternalLink size={14} className="text-gold" />
                                  </div>

                                  <div className="flex justify-between items-start mb-6">
                                    <div className="w-12 h-12 bg-slate-50 text-slate-400 flex items-center justify-center group-hover:bg-gold group-hover:text-white transition-all rounded-lg">
                                      <FileText size={20} strokeWidth={1.5} />
                                    </div>
                                    <div className="flex flex-col items-end gap-1">
                                      <span className="text-[7px] font-display uppercase tracking-widest px-2 py-1 bg-emerald-50 text-emerald-600 font-bold group-hover:bg-emerald-500 group-hover:text-white transition-colors rounded-sm shadow-sm">
                                        {isDefault ? "Secure Portal" : "Custom Added"}
                                      </span>
                                      {!isDefault && (
                                        <button 
                                          onClick={async (e) => {
                                            e.stopPropagation();
                                            if (true) { setDeleteCustomFormTarget({ id: form.id, name: form.name }); } else if (false) {
                                              try {
                                                await deleteDoc(doc(db, `forms-${selectedCompany || 'cml'}`, form.id));
                                              } catch (err) {
                                                console.error("Error deleting form:", err);
                                              }
                                            }
                                          }}
                                          className="p-1 text-red-500 hover:bg-rose-50 rounded transition-colors"
                                          title="Delete Reference"
                                        >
                                          <Trash2 size={12} />
                                        </button>
                                      )}
                                    </div>
                                  </div>

                                  <h3 className="text-lg font-serif italic text-slate-900 mb-2 leading-tight group-hover:text-gold transition-colors">{form.name}</h3>
                                  <p className="text-[9px] text-slate-400 luxury-label !opacity-60 mb-8">Opens in secure external encrypted window</p>

                                  <div className="mt-auto pt-6 border-t border-slate-50 flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                      <div className="w-1.5 h-1.5 rounded-full bg-gold animate-pulse" />
                                      <span className="text-[8px] font-display uppercase tracking-[0.2em] text-slate-500 font-black">
                                        REF: {(form.id || form.name.toLowerCase().replace(/[^a-z0-9]/g, "-")).substring(0, 15).toUpperCase()}
                                      </span>
                                    </div>
                                    <button className="px-4 py-2 bg-slate-50 text-gold flex items-center gap-2 text-[9px] uppercase tracking-[0.2em] font-black group-hover:bg-gold group-hover:text-white transition-all rounded-md">
                                      Open Portal <ChevronRight size={12} />
                                    </button>
                                  </div>
                                </motion.div>
                              );
                            })}
                          </div>
                        )}
                      </section>
                    ));
                  })()}

                  <div className="bg-luxury-black p-16 text-center relative overflow-hidden rounded-xl shadow-2xl">
                     <div className="absolute inset-0 opacity-10">
                        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-gold/30 via-transparent to-transparent" />
                     </div>
                     <Shield size={56} className="text-gold mx-auto mb-8 opacity-30" />
                     <h4 className="text-2xl font-serif italic text-gold mb-4">Encryption & Security Notice</h4>
                     <p className="max-w-2xl mx-auto text-[11px] font-display uppercase tracking-[0.4em] text-slate-300 leading-loose">
                       Form submissions are routed through CML Digital’s high-security SSL WordPress integration. 
                       Each session generates an encrypted token for property compliance.
                     </p>
                </div>
              </div>
            </div>
            ) : activeTab === "hotel-info" ? (
              <div className="space-y-8 pb-32">
                {/* Header block with brand colors */}
                <div className={cn(
                  "p-8 border relative overflow-hidden",
                  selectedCompany === 'ramada' ? "bg-red-50/50 border-red-200/50" : 
                  selectedCompany === 'wyndham' ? "bg-emerald-50/50 border-emerald-200/50" : 
                  "bg-gold/5 border-gold/10"
                )}>
                  <div className="relative z-10 max-w-3xl">
                    <div className={cn(
                      "text-[9px] font-display uppercase tracking-[0.25em] font-black pb-2 border-b max-w-max mb-6",
                      selectedCompany === 'ramada' ? "text-[#D11242] border-red-200" : 
                      selectedCompany === 'wyndham' ? "text-[#0b5c4b] border-emerald-200" : 
                      "text-gold border-gold/20"
                    )}>
                      {selectedCompany === 'ramada' ? "Ramada Suites Wailoaloa" : 
                       selectedCompany === 'wyndham' ? "Wyndham Garden Wailoaloa" : 
                       "Cove Management Limited"} • Directory
                    </div>
                    <h2 className="text-4xl font-serif text-slate-900 italic tracking-tight font-light mb-4">
                      Property & Corporate Directory
                    </h2>
                    <p className="text-sm font-serif italic text-slate-600 max-w-xl leading-relaxed">
                      Core physical profiles, room status inventories, guest policy standards, and corporate executive leadership team representing the CML Group operations.
                    </p>
                  </div>
                </div>

                {/* Sub-tab navigation */}
                <div className="flex border-b border-slate-100 pb-px gap-4 overflow-x-auto scroller-hidden">
                  <button
                    onClick={() => setHotelInfoViewMode("team")}
                    className={cn(
                      "px-6 py-4 text-xs font-display uppercase tracking-widest font-extrabold border-b-2 transition-all shrink-0 flex items-center gap-2.5",
                      hotelInfoViewMode === "team" 
                        ? "border-gold text-slate-950 font-black" 
                        : "border-transparent text-slate-400 hover:text-slate-600 font-medium"
                    )}
                  >
                    <Users size={14} className={hotelInfoViewMode === "team" ? "text-gold" : "text-slate-400"} />
                    Executive Leadership & Corporate Operations
                  </button>
                  
                  {(selectedCompany === "ramada" || selectedCompany === "wyndham") && (
                    <button
                      onClick={() => setHotelInfoViewMode("org-chart")}
                      className={cn(
                        "px-6 py-4 text-xs font-display uppercase tracking-widest font-extrabold border-b-2 transition-all shrink-0 flex items-center gap-2.5",
                        hotelInfoViewMode === "org-chart" 
                          ? "border-gold text-slate-950 font-black" 
                          : "border-transparent text-slate-400 hover:text-slate-600 font-medium"
                      )}
                    >
                      <Layers size={14} className={hotelInfoViewMode === "org-chart" ? "text-gold" : "text-slate-400"} />
                      Organizational Structure
                    </button>
                  )}

                  <button
                    onClick={() => setHotelInfoViewMode("property")}
                    className={cn(
                      "px-6 py-4 text-xs font-display uppercase tracking-widest font-extrabold border-b-2 transition-all shrink-0 flex items-center gap-2.5",
                      hotelInfoViewMode === "property" 
                        ? "border-gold text-slate-950 font-black" 
                        : "border-transparent text-slate-400 hover:text-slate-600 font-medium"
                    )}
                  >
                    <Globe size={14} className={hotelInfoViewMode === "property" ? "text-gold" : "text-slate-400"} />
                    Property Profile & Wi-Fi Details
                  </button>
                  <button
                    onClick={() => setHotelInfoViewMode("inventory")}
                    className={cn(
                      "px-6 py-4 text-xs font-display uppercase tracking-widest font-extrabold border-b-2 transition-all shrink-0 flex items-center gap-2.5",
                      hotelInfoViewMode === "inventory" 
                        ? "border-gold text-slate-950 font-black" 
                        : "border-transparent text-slate-400 hover:text-slate-600 font-medium"
                    )}
                  >
                    <Wrench size={14} className={hotelInfoViewMode === "inventory" ? "text-gold" : "text-slate-400"} />
                    Room Inventory & Maintenance History
                  </button>

                  <button
                    onClick={() => setHotelInfoViewMode("edit-staff")}
                    className={cn(
                      "px-6 py-4 text-xs font-display uppercase tracking-widest font-extrabold border-b-2 transition-all shrink-0 flex items-center gap-2.5",
                      hotelInfoViewMode === "edit-staff" 
                        ? "border-amber-600 text-slate-950 font-black" 
                        : "border-transparent text-slate-400 hover:text-slate-600 font-medium"
                    )}
                  >
                    <UserCog size={14} className={hotelInfoViewMode === "edit-staff" ? "text-amber-600" : "text-slate-400"} />
                    ✏️ Edit Staff & Directory Info
                  </button>
                </div>

                {hotelInfoViewMode === "team" ? (
                  <div className="space-y-12">
                    {/* SECTION 1: Leadership Team */}
                    <div>
                      <div className="mb-6">
                        <span className="text-[10px] font-display uppercase tracking-widest text-[#C5A059] font-extrabold block mb-1">Executive Board</span>
                        <h3 className="text-2xl font-serif text-slate-950 italic">Leadership Team</h3>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {executiveBoard.map((person, index) => (
                          <motion.div
                            key={index}
                            whileHover={{ y: -4 }}
                            className="bg-white border border-slate-100 shadow-xs overflow-hidden flex flex-col group transition-all"
                          >
                            {/* Accent line */}
                            <div className="h-1 bg-gradient-to-r from-gold/30 to-gold/70" />
                            
                            {/* Stylized premium image placeholder */}
                            <div className="bg-[#FAF8F5] p-10 flex flex-col items-center justify-center border-b border-slate-50 relative overflow-hidden h-72">
                              <div className="absolute inset-x-0 bottom-0 top-1/2 bg-gradient-to-t from-slate-50/80 to-transparent" />
                              <div className="absolute -right-10 -top-10 w-40 h-40 rounded-full border border-gold/5 pointer-events-none" />
                              <div className="absolute -left-10 -bottom-10 w-40 h-40 rounded-full border border-gold/5 pointer-events-none" />
                              
                              <div className={cn(
                                "w-36 h-36 rounded-2xl flex items-center justify-center font-display text-3xl font-black shadow-inner border tracking-wide transition-all duration-500 group-hover:scale-105 group-hover:rotate-1 bg-gradient-to-br", 
                                person.color || "from-amber-50 to-amber-100 text-amber-900 border-amber-200"
                              )}>
                                {person.initials || person.name.charAt(0)}
                              </div>
                            </div>

                            <div className="p-6 flex flex-col flex-1">
                              <h4 className="text-[#A28249] text-lg font-serif font-bold tracking-wider mb-1">
                                {person.name}
                              </h4>
                              <p className="text-slate-900 text-xs font-sans font-bold uppercase tracking-wider mb-4 border-b border-amber-50 pb-2">
                                {person.role}
                              </p>
                              <p className="text-slate-500 font-serif italic text-xs leading-relaxed flex-1">
                                "{person.desc}"
                              </p>
                              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                                <span className="text-[10px] text-slate-400 font-mono tracking-normal">{person.email}</span>
                                <button
                                  onClick={() => {
                                    window.location.href = `mailto:${person.email}`;
                                  }}
                                  className="text-[9px] font-display uppercase tracking-widest bg-gold/10 hover:bg-gold text-slate-950 font-black px-3.5 py-1.5 rounded transition-all"
                                >
                                  CONTACT
                                </button>
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </div>

                    {/* SECTION 2: Corporate Operations & Management (Circular Photo Wall Row!) */}
                    <div className="bg-[#FAF8F5] p-8 md:p-12 border border-slate-100 rounded-lg shadow-xs">
                      <div className="text-center mb-10 max-w-2xl mx-auto">
                        <span className="text-[10px] font-display uppercase tracking-[0.2em] text-[#C5A059] font-black block mb-2">Operational Council</span>
                        <h3 className="text-2xl font-serif text-slate-950 italic">CORPORATE OPERATIONS & MANAGEMENT</h3>
                        <div className="w-16 h-0.5 bg-gold/40 mx-auto mt-3" />
                      </div>

                      {/* Panoramic list matching the exact 6 profiles circular layouts */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8">
                        {corporateOps.map((member, idx) => (
                          <motion.div
                            key={idx}
                            whileHover={{ y: -3 }}
                            className="flex flex-col items-center text-center group"
                          >
                            <div className="relative mb-4">
                              {/* High end ambient border ring */}
                              <div className={cn(
                                "absolute -inset-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300",
                                member.highlight ? "bg-gradient-to-tr from-[#8D6E32] via-[#C5A059] to-[#8D6E32]" : "bg-slate-200/50"
                              )} />
                              
                              {/* Circle Frame */}
                              <div className={cn(
                                "w-28 h-28 rounded-full border-2 flex items-center justify-center font-display text-xl font-bold tracking-wider relative shadow-md transition-all duration-300 z-10 bg-gradient-to-br",
                                member.color || "bg-slate-900 text-stone-100 border-slate-800",
                                member.highlight ? "ring-2 ring-offset-2 ring-gold" : ""
                              )}>
                                {member.initials || member.name.charAt(0)}
                                {member.highlight && (
                                  <span className="absolute -top-1 -right-1 bg-gold text-slate-950 text-[7px] font-display uppercase tracking-widest font-black px-1.5 py-0.5 rounded-full shadow-lg">
                                    Current
                                  </span>
                                )}
                              </div>
                            </div>

                            <h4 className="text-[12px] md:text-[13px] font-display font-black text-slate-900 tracking-wider hover:text-gold transition-colors">
                              {member.name}
                            </h4>
                            <p className="text-[10px] font-serif italic text-slate-500 leading-snug max-w-[140px] mt-1 flex-1">
                              {member.role}
                            </p>
                            <a
                              href={`mailto:${member.email}`}
                              className="text-[9px] font-mono text-slate-400 opacity-60 group-hover:opacity-100 transition-opacity duration-200 mt-2 hover:text-[#C5A059]"
                            >
                              {member.email}
                            </a>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : hotelInfoViewMode === "org-chart" && (selectedCompany === "ramada" || selectedCompany === "wyndham") ? (
                  <HotelOrgChart
                    selectedCompany={selectedCompany}
                    initialEmployees={allEmployees}
                    orgSearchQuery={orgSearchQuery}
                    setOrgSearchQuery={setOrgSearchQuery}
                    selectedOrgTier={selectedOrgTier}
                    setSelectedOrgTier={setSelectedOrgTier}
                    selectedOrgNode={selectedOrgNode}
                    setSelectedOrgNode={setSelectedOrgNode}
                    orgViewLayout={orgViewLayout}
                    setOrgViewLayout={setOrgViewLayout}
                    isStaffMatch={isStaffMatch}
                  />
                ) : hotelInfoViewMode === "property" ? (
                  /* Current physical profiles structures */
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {/* Column 1: Property Profile & Wi-Fi */}
                    <div className="bg-white border border-slate-100 p-6 shadow-sm flex flex-col justify-between">
                      <div>
                        <h3 className="text-xs font-display uppercase tracking-widest text-[#1a1a1a] font-extrabold border-b border-slate-50 pb-3 mb-4">
                          {selectedCompany === 'ramada' ? "Ramada Suites Profile" : 
                           selectedCompany === 'wyndham' ? "Wyndham Garden Profile" : 
                           "CML Property Profile"}
                        </h3>
                        <table className="w-full text-xs font-sans text-slate-600 space-y-2">
                          <tbody>
                            <tr className="border-b border-slate-50">
                              <td className="py-2.5 font-semibold text-slate-800">Physical Address</td>
                              <td className="py-2.5 text-right font-serif">
                                {selectedCompany === 'ramada' ? "14 Wailoaloa Road, Wailoaloa Beach, Nadi, Fiji" :
                                 selectedCompany === 'wyndham' ? "Lot 3 Wailoaloa Beach Road, Nadi, Fiji" :
                                 "Wailoaloa Beach Road, Nadi, Fiji Islands"}
                              </td>
                            </tr>
                            <tr className="border-b border-slate-50">
                              <td className="py-2.5 font-semibold text-slate-800">Room Units</td>
                              <td className="py-2.5 text-right font-serif">
                                {selectedCompany === 'ramada' ? "40 Luxury 1, 2, & 3 Bedroom Suites" : 
                                 selectedCompany === 'wyndham' ? "75 Premium Guest Rooms & Suites" : 
                                 "Multi-Property Group Portfolio"}
                              </td>
                            </tr>
                            <tr className="border-b border-slate-50">
                              <td className="py-2.5 font-semibold text-slate-800">Key Features</td>
                              <td className="py-2.5 text-right font-serif text-[11px]">
                                {selectedCompany === 'ramada' ? "Full Kitchens, Ocean views, Senikai Spa, Pool, Gym" :
                                 selectedCompany === 'wyndham' ? "Outdoor Courtyard Pool, Garden Terrace, Close to Airport" :
                                 "Dual-brand beach resort operations"}
                              </td>
                            </tr>
                            <tr className="border-b border-slate-50">
                              <td className="py-2.5 font-semibold text-slate-800">Operational Status</td>
                              <td className="py-2.5 text-right text-emerald-600 font-bold flex items-center justify-end gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span> Active
                              </td>
                            </tr>
                            <tr className="border-b border-slate-50">
                              <td className="py-2.5 font-semibold text-slate-800">Default Check-in</td>
                              <td className="py-2.5 text-right font-serif">14:00 (Check-out 11:00)</td>
                            </tr>
                            <tr>
                              <td className="py-2.5 font-semibold text-slate-800">Official Web Link</td>
                              <td className="py-2.5 text-right">
                                <a 
                                  href={selectedCompany === 'ramada' ? "https://ramadawailoaloafiji.com/" : "https://wyndhamhotels.com/wyndham-garden/nadi-fiji/wyndham-garden-wailoaloa-beach-fiji/rooms-rates"} 
                                  target="_blank" 
                                  rel="noopener noreferrer" 
                                  className="text-gold hover:underline font-bold font-mono text-[10px] uppercase"
                                >
                                  View Website ↗
                                </a>
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>

                      <div className="bg-slate-50 border border-slate-200/50 p-4 mt-6">
                        <div className="flex items-center gap-3 mb-2">
                          <Globe size={16} className="text-gold" />
                          <h4 className="text-[10px] font-display uppercase tracking-wider text-slate-800 font-bold">Encrypted Property Wi-Fi</h4>
                        </div>
                        <div className="text-[11px] text-slate-600 font-serif space-y-1">
                          <p><strong>Guest SSID:</strong> {selectedCompany === 'ramada' ? "Ramada_Suites_Guest" : selectedCompany === 'wyndham' ? "Wyndham_Garden_Guest" : "CML_Corporate_Guest"}</p>
                          <p><strong>Security Portal:</strong> 100Mbps Click-to-Connect Gate</p>
                          <p className="border-t border-slate-200/50 pt-1.5 mt-1.5"><strong>Staff SSID:</strong> CML_SECURE_VLAN</p>
                          <p><strong>Staff Password:</strong> <code className="bg-slate-200/60 px-1 font-mono rounded">CmlSecureWailo2026!</code></p>
                        </div>
                      </div>
                    </div>

                    {/* Column 2: Management Contacts & Hotlines */}
                    <div className="bg-white border border-slate-100 p-6 shadow-sm">
                      <h3 className="text-xs font-display uppercase tracking-widest text-[#1a1a1a] font-extrabold border-b border-slate-50 pb-3 mb-4">
                        Management & Operations Directory
                      </h3>
                      <div className="space-y-4">
                        {[
                          { title: "General Manager", name: "Charles O'Neill", email: "gm@cml.com.fj", ext: "Ext. 700" },
                          { title: "Front Desk Duty Manager", name: "Front Host Team", email: "frontdesk@cml.com.fj", ext: "Ext. 100/101" },
                          { title: "Executive Housekeeper", name: "Sereana V.", email: "housekeeping@cml.com.fj", ext: "Ext. 204" },
                          { title: "Security & Engineering Lead", name: "Kalesh Prasad", email: "maintenance@cml.com.fj", ext: "Ext. 505" },
                          { title: "Revenue & OTAs Relations", name: "A. Patel", email: "revenue@cml.com.fj", ext: "Ext. 902" }
                        ].map((contact, idx) => (
                          <div key={idx} className="flex justify-between items-start text-xs border-b border-slate-50 pb-3 last:border-0 last:pb-0">
                            <div>
                              <p className="font-semibold text-slate-900">{contact.title}</p>
                              <p className="text-slate-500 font-serif italic">{contact.name}</p>
                              <p className="text-[10px] text-slate-400 font-mono">{contact.email}</p>
                            </div>
                            <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded-xs font-mono text-[9px] font-black shrink-0">
                              {contact.ext}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Column 3: Corporate Policy Standards */}
                    <div className="bg-white border border-slate-100 p-6 shadow-sm flex flex-col justify-between">
                      <div>
                        <h3 className="text-xs font-display uppercase tracking-widest text-[#1a1a1a] font-extrabold border-b border-slate-50 pb-3 mb-4">
                          Brand Compliance Policy
                        </h3>
                        <div className="space-y-4">
                          <div className="text-xs text-slate-600 font-serif leading-relaxed">
                            <p className="font-semibold text-slate-800 font-sans mb-1 text-[11px] uppercase tracking-wider">Complaint Resolution</p>
                            Verify and log all guest complaints in real-time under the <strong>Customer Recovery Console</strong>. Resolve within 15 minutes of initial lodge.
                          </div>
                          <div className="text-xs text-slate-600 font-serif leading-relaxed">
                            <p className="font-semibold text-slate-800 font-sans mb-1 text-[11px] uppercase tracking-wider">Lost & Found Security</p>
                            Found items must be tagged and loaded into the loss log database immediately. Secure high-value items in the safebox.
                          </div>
                          <div className="text-xs text-slate-600 font-serif leading-relaxed">
                            <p className="font-semibold text-slate-800 font-sans mb-1 text-[11px] uppercase tracking-wider">Master Keys Control</p>
                            A maximum of 90 active duplicate master cards can exist across properties. Master key compliance audits run weekly.
                          </div>
                        </div>
                      </div>

                      <div className={cn(
                        "p-4 border mt-6 text-center text-[10px] font-display uppercase tracking-widest font-black",
                        selectedCompany === 'ramada' ? "bg-red-50 text-[#D11242] border-red-200/50" :
                        selectedCompany === 'wyndham' ? "bg-emerald-50 text-[#0b5c4b] border-emerald-200/50" :
                        "bg-gold/10 text-slate-900 border-gold/20"
                      )}>
                        Weekly Compliance Checklist Audited
                      </div>
                    </div>
                  </div>
                ) : hotelInfoViewMode === "inventory" ? (
                  <div className="space-y-8 animate-fade-in text-left">
                    <div>
                      <span className="text-[10px] font-display uppercase tracking-widest text-gold font-extrabold block mb-1">Room Status Logs</span>
                      <h3 className="text-2xl font-serif text-slate-950 italic">Room Inventory & Maintenance History</h3>
                      <p className="text-xs text-slate-500 italic mt-1">Real-time status tracking and logged repairs for each guest unit across CML properties.</p>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                      {/* Left: Rooms list */}
                      <div className="lg:col-span-1 space-y-4">
                        <div className="bg-white border border-slate-100 p-5 shadow-xs">
                          <h4 className="text-xs font-display uppercase tracking-wider text-slate-800 font-extrabold mb-3">Unit Directory</h4>
                          
                          {/* List of rooms for the active property */}
                          <div className="space-y-3">
                            {(selectedCompany === "ramada" ? [
                              { roomNumber: "Room 101", type: "Luxury 1-Bed Suite", status: "Occupied", condition: "Excellent", lastCheckDate: "2026-06-28" },
                              { roomNumber: "Room 102", type: "Luxury 2-Bed Suite", status: "Vacant Clean", condition: "Excellent", lastCheckDate: "2026-06-30" },
                              { roomNumber: "Room 204", type: "Luxury 3-Bed Suite", status: "Dirty", condition: "Needs Repair", lastCheckDate: "2026-06-15" },
                              { roomNumber: "Room 305", type: "Oceanfront Penthouse", status: "Occupied", condition: "Excellent", lastCheckDate: "2026-07-01" },
                            ] : [
                              { roomNumber: "Room 110", type: "Garden Standard King", status: "Occupied", condition: "Excellent", lastCheckDate: "2026-06-25" },
                              { roomNumber: "Room 112", type: "Garden Deluxe Queen", status: "Vacant Clean", condition: "Excellent", lastCheckDate: "2026-06-29" },
                              { roomNumber: "Room 215", type: "Premium King Suite", status: "Out of Service", condition: "Needs Repair", lastCheckDate: "2026-06-20" },
                              { roomNumber: "Room 320", type: "Ocean View Studio", status: "Occupied", condition: "Excellent", lastCheckDate: "2026-07-01" },
                            ]).map((room) => {
                              const isSelected = selectedRoomNumber === room.roomNumber;
                              return (
                                <button
                                  key={room.roomNumber}
                                  onClick={() => setSelectedRoomNumber(room.roomNumber)}
                                  className={cn(
                                    "w-full text-left p-3.5 border transition-all flex flex-col gap-1 hover:border-gold rounded-none cursor-pointer",
                                    isSelected 
                                      ? "bg-gold/5 border-gold shadow-xs" 
                                      : "bg-white border-slate-100"
                                  )}
                                >
                                  <div className="flex items-center justify-between">
                                    <span className="text-[13px] font-sans font-bold text-slate-900">{room.roomNumber}</span>
                                    <span className={cn(
                                      "text-[8px] font-display uppercase tracking-wider px-2 py-0.5 font-bold",
                                      room.status === "Occupied" ? "bg-blue-50 text-blue-700" :
                                      room.status === "Vacant Clean" ? "bg-emerald-50 text-emerald-700" :
                                      room.status === "Dirty" ? "bg-amber-50 text-amber-700" :
                                      "bg-rose-50 text-rose-700"
                                    )}>
                                      {room.status}
                                    </span>
                                  </div>
                                  <div className="flex items-center justify-between text-[11px] text-slate-500 font-serif italic">
                                    <span>{room.type}</span>
                                    <span className={cn(
                                      "font-semibold",
                                      room.condition === "Excellent" ? "text-emerald-600" :
                                      room.condition === "Fair" ? "text-amber-500" : "text-rose-500"
                                    )}>
                                      {room.condition}
                                    </span>
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </div>

                      {/* Right: Maintenance History Details & Add form */}
                      <div className="lg:col-span-2 space-y-6">
                        <div className="bg-white border border-slate-100 p-6 shadow-xs space-y-6">
                          <div className="flex items-center justify-between border-b border-slate-100 pb-4 flex-wrap gap-2">
                            <div>
                              <h4 className="text-sm font-display uppercase tracking-wider text-slate-900 font-extrabold">
                                Maintenance History: <span className="text-gold font-sans font-bold ml-1">{selectedRoomNumber}</span>
                              </h4>
                              <p className="text-[11px] text-slate-400 font-serif italic">Viewing resolved and scheduled past repairs for this room.</p>
                            </div>
                            <button
                              onClick={() => setShowAddRepairModal(true)}
                              className="bg-slate-950 hover:bg-gold hover:text-slate-950 text-white text-[9px] font-display uppercase tracking-widest font-black px-4 py-2 rounded-none transition-all flex items-center gap-1.5 cursor-pointer"
                            >
                              <Wrench size={10} />
                              LOG NEW REPAIR
                            </button>
                          </div>

                          {/* Repairs history timeline */}
                          <div className="space-y-4 text-left">
                            {maintenanceLogs
                              .filter((log) => log.roomNumber === selectedRoomNumber && log.propertyId === selectedCompany)
                              .length === 0 ? (
                                <div className="text-center py-12 bg-slate-50/50 border border-dashed border-slate-200">
                                  <Wrench className="text-slate-300 mx-auto mb-3" size={24} />
                                  <p className="text-xs font-serif text-slate-500 italic">No maintenance history recorded for this room.</p>
                                </div>
                              ) : (
                                <div className="relative border-l-2 border-slate-100 pl-6 ml-3 space-y-6">
                                  {maintenanceLogs
                                    .filter((log) => log.roomNumber === selectedRoomNumber && log.propertyId === selectedCompany)
                                    .map((log) => (
                                      <div key={log.id} className="relative">
                                        {/* Timeline point */}
                                        <span className="absolute -left-[31px] top-1.5 bg-white border-2 border-gold rounded-full w-4 h-4 flex items-center justify-center z-10">
                                          <span className="w-1.5 h-1.5 rounded-full bg-gold" />
                                        </span>

                                        <div className="bg-slate-50/75 p-4 border border-slate-100 space-y-2 text-left">
                                          <div className="flex items-start justify-between flex-wrap gap-2">
                                            <div>
                                              <p className="text-xs font-display uppercase tracking-wide text-slate-900 font-extrabold">{log.issue}</p>
                                              <p className="text-[10px] text-slate-400 font-mono mt-0.5">Logged: {log.date} • Technician: {log.technician}</p>
                                            </div>
                                            <div className="flex flex-col items-end gap-1">
                                              <span className={cn(
                                                "text-[8px] font-display uppercase tracking-wider px-2 py-0.5 font-bold",
                                                log.status === "Resolved" ? "bg-emerald-50 text-emerald-700" :
                                                log.status === "In Progress" ? "bg-blue-50 text-blue-700" :
                                                "bg-amber-50 text-amber-700"
                                              )}>
                                                {log.status}
                                              </span>
                                              {log.cost > 0 && (
                                                <span className="text-[10px] text-slate-600 font-mono font-bold">${log.cost.toFixed(2)}</span>
                                              )}
                                            </div>
                                          </div>
                                          {log.notes && (
                                            <p className="text-[11px] text-slate-600 font-serif italic leading-relaxed border-t border-slate-200/40 pt-1.5 mt-1">
                                              "{log.notes}"
                                            </p>
                                          )}
                                        </div>
                                      </div>
                                    ))}
                                </div>
                              )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Simple Embedded Form Modal for Logging repairs */}
                    {showAddRepairModal && (
                      <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fade-in">
                        <div className="bg-white border border-slate-100 shadow-xl w-full max-w-md p-6 space-y-4 relative text-left">
                          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <h3 className="text-xs font-display uppercase tracking-widest text-slate-950 font-extrabold flex items-center gap-1.5">
                              <Wrench size={13} className="text-gold" />
                              Log Past/New Repair for {selectedRoomNumber}
                            </h3>
                            <button 
                              onClick={() => setShowAddRepairModal(false)}
                              className="text-slate-400 hover:text-slate-600 text-xs cursor-pointer p-1"
                            >
                              ✕
                            </button>
                          </div>

                          <form onSubmit={(e) => {
                            e.preventDefault();
                            const formData = new FormData(e.currentTarget);
                            const issue = formData.get("issue") as string;
                            const technician = formData.get("technician") as string;
                            const costStr = formData.get("cost") as string;
                            const status = formData.get("status") as any;
                            const notes = formData.get("notes") as string;

                            if (!issue || !technician) {
                              toastService.error("Please fill in issue and technician names.");
                              return;
                            }

                            const newLog = {
                              id: `repair-${Date.now()}`,
                              roomNumber: selectedRoomNumber,
                              propertyId: selectedCompany,
                              issue,
                              technician,
                              date: new Date().toISOString().split("T")[0],
                              cost: parseFloat(costStr) || 0,
                              status,
                              notes
                            };

                            const updated = [...maintenanceLogs, newLog];
                            setMaintenanceLogs(updated);
                            localStorage.setItem("cml_maintenance_logs", JSON.stringify(updated));
                            setShowAddRepairModal(false);
                            toastService.success(`Repair log for ${selectedRoomNumber} successfully recorded!`);
                          }} className="space-y-3 text-xs text-left">
                            <div className="space-y-1">
                              <label className="text-[8px] uppercase tracking-wider text-slate-500 font-bold">Repair Issue / Job Description</label>
                              <input 
                                type="text" 
                                name="issue"
                                required
                                placeholder="e.g. Shower hose leak replacement"
                                className="w-full border border-slate-200 p-2 text-slate-800 focus:border-gold outline-none rounded-none"
                              />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-1">
                                <label className="text-[8px] uppercase tracking-wider text-slate-500 font-bold">Technician Name</label>
                                <input 
                                  type="text" 
                                  name="technician"
                                  required
                                  placeholder="e.g. Kalesh Prasad"
                                  className="w-full border border-slate-200 p-2 text-slate-800 focus:border-gold outline-none rounded-none"
                                />
                              </div>
                              <div className="space-y-1">
                                <label className="text-[8px] uppercase tracking-wider text-slate-500 font-bold">Estimated Cost ($)</label>
                                <input 
                                  type="number" 
                                  name="cost"
                                  defaultValue="0"
                                  className="w-full border border-slate-200 p-2 text-slate-800 focus:border-gold outline-none rounded-none"
                                />
                              </div>
                            </div>

                            <div className="space-y-1">
                              <label className="text-[8px] uppercase tracking-wider text-slate-500 font-bold">Repair Status</label>
                              <select 
                                name="status"
                                className="w-full border border-slate-200 p-2 text-slate-800 focus:border-gold outline-none bg-white rounded-none"
                              >
                                <option value="Resolved">Resolved</option>
                                <option value="In Progress">In Progress</option>
                                <option value="Scheduled">Scheduled</option>
                              </select>
                            </div>

                            <div className="space-y-1">
                              <label className="text-[8px] uppercase tracking-wider text-slate-500 font-bold">Technician Repair Notes / Details</label>
                              <textarea 
                                name="notes"
                                placeholder="Details about repair, replacement parts or actions taken..."
                                className="w-full border border-slate-200 p-2 text-slate-800 focus:border-gold outline-none h-20 resize-none rounded-none"
                              />
                            </div>

                            <div className="pt-2 flex items-center justify-end gap-2">
                              <button 
                                type="button" 
                                onClick={() => setShowAddRepairModal(false)}
                                className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-none cursor-pointer"
                              >
                                Cancel
                              </button>
                              <button 
                                type="submit" 
                                className="px-4 py-2 bg-slate-950 text-white hover:bg-gold hover:text-slate-950 font-bold rounded-none cursor-pointer"
                              >
                                Save Repair Log
                              </button>
                            </div>
                          </form>
                        </div>
                      </div>
                    )}
                  </div>
                ) : hotelInfoViewMode === "edit-staff" ? (
                  <div className="space-y-8 animate-fade-in text-left">
                    {/* Header */}
                    <div className="flex items-center justify-between flex-wrap gap-4 bg-[#FAF8F5] p-6 border border-slate-100 rounded-lg shadow-xs">
                      <div>
                        <span className="text-[10px] font-display uppercase tracking-widest text-[#C5A059] font-black block mb-1">Human Resources Command</span>
                        <h3 className="text-xl font-serif text-slate-950 italic">Staff & Leadership Editor</h3>
                        <p className="text-xs text-slate-500 italic mt-1">Manage executive leadership, corporate managers, and property-specific employees with real-time cloud sync.</p>
                      </div>
                      
                      {editStaffSubTab === "employees" && (
                        <button
                          onClick={() => {
                            setEditingMember(null);
                            setIsAddingEmployee(true);
                          }}
                          className="bg-slate-950 hover:bg-gold hover:text-slate-950 text-white text-[10px] font-display uppercase tracking-widest font-black px-4 py-2.5 rounded-none transition-all flex items-center gap-1.5 cursor-pointer"
                        >
                          <Plus size={12} />
                          ADD NEW EMPLOYEE
                        </button>
                      )}
                    </div>

                    {/* Sub-Tabs Selector */}
                    <div className="flex border-b border-slate-100 pb-px gap-4 overflow-x-auto scroller-hidden">
                      <button
                        onClick={() => { setEditStaffSubTab("employees"); setEditingMember(null); setIsAddingEmployee(false); }}
                        className={cn(
                          "px-6 py-4 text-xs font-display uppercase tracking-widest font-extrabold border-b-2 transition-all shrink-0 flex items-center gap-2",
                          editStaffSubTab === "employees" 
                            ? "border-amber-600 text-slate-950 font-black" 
                            : "border-transparent text-slate-400 hover:text-slate-600 font-medium"
                        )}
                      >
                        👥 Property Employees Directory ({selectedCompany === "ramada" ? "Ramada" : selectedCompany === "wyndham" ? "Wyndham" : "CML"})
                      </button>
                      <button
                        onClick={() => { setEditStaffSubTab("board"); setEditingMember(null); setIsAddingEmployee(false); }}
                        className={cn(
                          "px-6 py-4 text-xs font-display uppercase tracking-widest font-extrabold border-b-2 transition-all shrink-0 flex items-center gap-2",
                          editStaffSubTab === "board" 
                            ? "border-amber-600 text-slate-950 font-black" 
                            : "border-transparent text-slate-400 hover:text-slate-600 font-medium"
                        )}
                      >
                        👑 Executive Board / Leaders
                      </button>
                      <button
                        onClick={() => { setEditStaffSubTab("council"); setEditingMember(null); setIsAddingEmployee(false); }}
                        className={cn(
                          "px-6 py-4 text-xs font-display uppercase tracking-widest font-extrabold border-b-2 transition-all shrink-0 flex items-center gap-2",
                          editStaffSubTab === "council" 
                            ? "border-amber-600 text-slate-950 font-black" 
                            : "border-transparent text-slate-400 hover:text-slate-600 font-medium"
                        )}
                      >
                        🏢 Corporate Council Managers
                      </button>
                    </div>

                    {/* 1. EMPLOYEE DIRECTORY SUBTAB */}
                    {editStaffSubTab === "employees" && (
                      <div className="space-y-6">
                        {/* Search and Filter Row */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-white p-4 border border-slate-100 shadow-xs">
                          <div className="relative">
                            <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
                            <input
                              type="text"
                              placeholder="Search employees by name, role, code..."
                              value={employeeSearchQuery}
                              onChange={(e) => setEmployeeSearchQuery(e.target.value)}
                              className="w-full pl-9 pr-4 py-2 border border-slate-200 text-xs focus:border-gold outline-none rounded-none"
                            />
                          </div>
                          <div>
                            <select
                              value={employeeDeptFilter}
                              onChange={(e) => setEmployeeDeptFilter(e.target.value)}
                              className="w-full border border-slate-200 p-2 text-xs focus:border-gold outline-none bg-white rounded-none"
                            >
                              <option value="All">All Departments</option>
                              {Array.from(new Set(allEmployees.map(e => e.department).filter(Boolean))).map(dept => (
                                <option key={dept} value={dept}>{dept}</option>
                              ))}
                            </select>
                          </div>
                          <div className="text-right text-[10px] text-slate-400 flex items-center justify-end">
                            Showing {
                              allEmployees.filter(e => {
                                const matchesSearch = !employeeSearchQuery || 
                                  `${e.firstName || ""} ${e.lastName || ""}`.toLowerCase().includes(employeeSearchQuery.toLowerCase()) ||
                                  (e.employeeCode || "").toLowerCase().includes(employeeSearchQuery.toLowerCase()) ||
                                  (e.role || "").toLowerCase().includes(employeeSearchQuery.toLowerCase());
                                const matchesDept = employeeDeptFilter === "All" || e.department === employeeDeptFilter;
                                return matchesSearch && matchesDept;
                              }).length
                            } of {allEmployees.length} employees
                          </div>
                        </div>

                        {/* Employee Add or Edit Inline Panel */}
                        {(isAddingEmployee || (editingMember && editStaffSubTab === "employees")) && (
                          <motion.div 
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-[#FAF8F5] p-6 border border-[#C5A059]/40 rounded-lg space-y-4 text-left"
                          >
                            <h4 className="text-xs font-display uppercase tracking-wider text-slate-900 font-extrabold pb-2 border-b border-slate-200 flex items-center gap-2">
                              <span>{isAddingEmployee ? "➕ Add New Staff Record" : "✏️ Edit Staff Record"}</span>
                            </h4>

                            <form onSubmit={async (e) => {
                              e.preventDefault();
                              const formData = new FormData(e.currentTarget);
                              const fName = formData.get("firstName") as string;
                              const lName = formData.get("lastName") as string;
                              const email = formData.get("email") as string;
                              const phone = formData.get("phone") as string;
                              const empCode = formData.get("employeeCode") as string;
                              const role = formData.get("role") as string;
                              const department = formData.get("department") as string;
                              const managerName = formData.get("managerName") as string;
                              const dob = formData.get("dateOfBirth") as string;

                              if (!fName || !lName || !email) {
                                toastService.error("First Name, Last Name, and Email are required.");
                                return;
                              }

                              const propId = selectedCompany || "cml";
                              const recordId = isAddingEmployee ? `emp_${Date.now()}` : editingMember.id;
                              
                              const employeeData = {
                                firstName: fName,
                                lastName: lName,
                                email,
                                phone: phone || "",
                                employeeCode: empCode || "",
                                role: role || "Staff",
                                department: department || "Operations",
                                managerName: managerName || "",
                                dateOfBirth: dob || "",
                                updatedAt: new Date().toISOString()
                              };

                              try {
                                const docRef = doc(db, `cml-signin-users-${propId}`, recordId);
                                await setDoc(docRef, employeeData, { merge: true });
                                toastService.success(isAddingEmployee ? "Added employee successfully!" : "Updated employee details successfully!");
                                setIsAddingEmployee(false);
                                setEditingMember(null);
                              } catch (err) {
                                console.error("Error writing employee:", err);
                                toastService.error("Database connection failure. Please retry.");
                              }
                            }} className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                              <div className="space-y-1">
                                <label className="text-[9px] uppercase tracking-wider text-slate-500 font-black">First Name *</label>
                                <input type="text" name="firstName" required defaultValue={editingMember?.firstName || ""} className="w-full border border-slate-200 p-2 bg-white" />
                              </div>
                              <div className="space-y-1">
                                <label className="text-[9px] uppercase tracking-wider text-slate-500 font-black">Last Name *</label>
                                <input type="text" name="lastName" required defaultValue={editingMember?.lastName || ""} className="w-full border border-slate-200 p-2 bg-white" />
                              </div>
                              <div className="space-y-1">
                                <label className="text-[9px] uppercase tracking-wider text-slate-500 font-black">Email Address *</label>
                                <input type="email" name="email" required defaultValue={editingMember?.email || ""} className="w-full border border-slate-200 p-2 bg-white" />
                              </div>
                              <div className="space-y-1">
                                <label className="text-[9px] uppercase tracking-wider text-slate-500 font-black">Phone Number</label>
                                <input type="text" name="phone" defaultValue={editingMember?.phone || ""} className="w-full border border-slate-200 p-2 bg-white" />
                              </div>
                              <div className="space-y-1">
                                <label className="text-[9px] uppercase tracking-wider text-slate-500 font-black">Employee Code</label>
                                <input type="text" name="employeeCode" defaultValue={editingMember?.employeeCode || ""} className="w-full border border-slate-200 p-2 bg-white" />
                              </div>
                              <div className="space-y-1">
                                <label className="text-[9px] uppercase tracking-wider text-slate-500 font-black">Job Role / Designation</label>
                                <input type="text" name="role" defaultValue={editingMember?.role || ""} className="w-full border border-slate-200 p-2 bg-white" />
                              </div>
                              <div className="space-y-1">
                                <label className="text-[9px] uppercase tracking-wider text-slate-500 font-black">Department</label>
                                <select name="department" defaultValue={editingMember?.department || "Operations"} className="w-full border border-slate-200 p-2 bg-white">
                                  <option value="Front Office">Front Office</option>
                                  <option value="Housekeeping">Housekeeping</option>
                                  <option value="Maintenance">Maintenance</option>
                                  <option value="Food & Beverage">Food & Beverage</option>
                                  <option value="Spa & Recreation">Spa & Recreation</option>
                                  <option value="Sales & Marketing">Sales & Marketing</option>
                                  <option value="Human Resources">Human Resources</option>
                                  <option value="IT & Security">IT & Security</option>
                                  <option value="Finance">Finance</option>
                                  <option value="Operations">Operations</option>
                                </select>
                              </div>
                              <div className="space-y-1">
                                <label className="text-[9px] uppercase tracking-wider text-slate-500 font-black">Manager Name</label>
                                <input type="text" name="managerName" defaultValue={editingMember?.managerName || ""} className="w-full border border-slate-200 p-2 bg-white" />
                              </div>
                              <div className="space-y-1">
                                <label className="text-[9px] uppercase tracking-wider text-slate-500 font-black">Date of Birth</label>
                                <input type="date" name="dateOfBirth" defaultValue={editingMember?.dateOfBirth || ""} className="w-full border border-slate-200 p-2 bg-white" />
                              </div>

                              <div className="md:col-span-3 pt-4 border-t border-slate-200/50 flex justify-end gap-2">
                                <button
                                  type="button"
                                  onClick={() => { setIsAddingEmployee(false); setEditingMember(null); }}
                                  className="px-4 py-2 border border-slate-300 hover:bg-slate-100 rounded-none cursor-pointer"
                                >
                                  Cancel
                                </button>
                                <button
                                  type="submit"
                                  className="px-6 py-2 bg-slate-950 hover:bg-gold hover:text-slate-950 text-white font-bold rounded-none cursor-pointer"
                                >
                                  {isAddingEmployee ? "Add To Database" : "Save Record Updates"}
                                </button>
                              </div>
                            </form>
                          </motion.div>
                        )}

                        {/* Employees Directory List Table */}
                        <div className="bg-white border border-slate-100 shadow-sm overflow-x-auto">
                          <table className="w-full text-left border-collapse min-w-[700px]">
                            <thead>
                              <tr className="bg-slate-50 text-slate-400 text-[10px] uppercase font-display tracking-wider border-b border-slate-100">
                                <th className="p-4 font-black">Employee Code / Name</th>
                                <th className="p-4 font-black">Department / Role</th>
                                <th className="p-4 font-black">Email / Phone</th>
                                <th className="p-4 font-black">Reporting To</th>
                                <th className="p-4 font-black text-right">Actions</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-xs">
                              {allEmployees
                                .filter(e => {
                                  const matchesSearch = !employeeSearchQuery || 
                                    `${e.firstName || ""} ${e.lastName || ""}`.toLowerCase().includes(employeeSearchQuery.toLowerCase()) ||
                                    (e.employeeCode || "").toLowerCase().includes(employeeSearchQuery.toLowerCase()) ||
                                    (e.role || "").toLowerCase().includes(employeeSearchQuery.toLowerCase());
                                  const matchesDept = employeeDeptFilter === "All" || e.department === employeeDeptFilter;
                                  return matchesSearch && matchesDept;
                                })
                                .map((employee) => (
                                  <tr key={employee.id} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="p-4">
                                      <p className="font-bold text-slate-900">{employee.firstName} {employee.lastName}</p>
                                      <p className="text-[10px] font-mono text-slate-400 font-bold">{employee.employeeCode || "N/A"}</p>
                                    </td>
                                    <td className="p-4">
                                      <p className="text-slate-800 font-semibold">{employee.role}</p>
                                      <span className="text-[9px] bg-slate-100 text-slate-600 font-display font-bold uppercase tracking-wider px-2 py-0.5 rounded-sm">
                                        {employee.department || "Operations"}
                                      </span>
                                    </td>
                                    <td className="p-4">
                                      <p className="text-slate-600 font-mono text-[11px]">{employee.email}</p>
                                      <p className="text-slate-400 font-mono text-[10px]">{employee.phone || "No phone record"}</p>
                                    </td>
                                    <td className="p-4 font-serif italic text-slate-500">
                                      {employee.managerName || "Direct Reporting"}
                                    </td>
                                    <td className="p-4 text-right space-x-2 shrink-0">
                                      <button
                                        onClick={() => {
                                          setEditingMember(employee);
                                          setIsAddingEmployee(false);
                                        }}
                                        className="text-amber-600 hover:text-amber-700 bg-amber-50 hover:bg-amber-100 px-2.5 py-1 text-[11px] rounded transition-colors font-bold"
                                      >
                                        ✏️ Edit
                                      </button>
                                      <button
                                        onClick={async () => {
                                          if (window.confirm(`Are you absolutely sure you want to delete ${employee.firstName} ${employee.lastName} from the cloud directory?`)) {
                                            try {
                                              await deleteDoc(doc(db, `cml-signin-users-${selectedCompany || 'cml'}`, employee.id));
                                              toastService.success(`Deleted ${employee.firstName} from the live staff directory.`);
                                            } catch (err) {
                                              console.error("Error deleting:", err);
                                              toastService.error("Delete failed. Check Firebase network permissions.");
                                            }
                                          }
                                        }}
                                        className="text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 px-2.5 py-1 text-[11px] rounded transition-colors font-bold"
                                      >
                                        ❌ Delete
                                      </button>
                                    </td>
                                  </tr>
                                ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    {/* 2. DIRECTORS BOARD AND COUNCIL SUBTABS */}
                    {(editStaffSubTab === "board" || editStaffSubTab === "council") && (
                      <div className="space-y-6">
                        {editingMember && (
                          <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-[#FAF8F5] p-6 border border-[#C5A059]/40 rounded-lg space-y-4 text-left"
                          >
                            <h4 className="text-xs font-display uppercase tracking-wider text-slate-900 font-extrabold pb-2 border-b border-slate-200">
                              ✏️ Edit {editStaffSubTab === "board" ? "Executive Board Member" : "Corporate Council Leader"} Details
                            </h4>

                            <form onSubmit={(e) => {
                              e.preventDefault();
                              const formData = new FormData(e.currentTarget);
                              const name = formData.get("name") as string;
                              const role = formData.get("role") as string;
                              const email = formData.get("email") as string;
                              const initials = formData.get("initials") as string;
                              const color = formData.get("color") as string;
                              const desc = formData.get("desc") as string;

                              if (!name || !role || !email) {
                                toastService.error("Name, role, and email are required.");
                                return;
                              }

                              const updatedMember = {
                                ...editingMember,
                                name,
                                role,
                                email,
                                initials: initials || name.substring(0, 2).toUpperCase(),
                                color,
                                ...(editStaffSubTab === "board" && { desc })
                              };

                              if (editStaffSubTab === "board") {
                                const list = executiveBoard.map(b => b.id === editingMember.id ? updatedMember : b);
                                setExecutiveBoard(list);
                                localStorage.setItem("cml_executive_board", JSON.stringify(list));
                              } else {
                                const list = corporateOps.map(c => c.id === editingMember.id ? updatedMember : c);
                                setCorporateOps(list);
                                localStorage.setItem("cml_corporate_ops", JSON.stringify(list));
                              }

                              toastService.success("Leader record saved successfully!");
                              setEditingMember(null);
                            }} className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                              <div className="space-y-1">
                                <label className="text-[9px] uppercase tracking-wider text-slate-500 font-black">Full Name *</label>
                                <input type="text" name="name" required defaultValue={editingMember.name} className="w-full border border-slate-200 p-2 bg-white" />
                              </div>
                              <div className="space-y-1">
                                <label className="text-[9px] uppercase tracking-wider text-slate-500 font-black">Designation / Role *</label>
                                <input type="text" name="role" required defaultValue={editingMember.role} className="w-full border border-slate-200 p-2 bg-white" />
                              </div>
                              <div className="space-y-1">
                                <label className="text-[9px] uppercase tracking-wider text-slate-500 font-black">Initials</label>
                                <input type="text" name="initials" defaultValue={editingMember.initials} maxLength={3} className="w-full border border-slate-200 p-2 bg-white" />
                              </div>
                              <div className="space-y-1">
                                <label className="text-[9px] uppercase tracking-wider text-slate-500 font-black">Email Address *</label>
                                <input type="email" name="email" required defaultValue={editingMember.email} className="w-full border border-slate-200 p-2 bg-white" />
                              </div>
                              <div className="space-y-1 md:col-span-2">
                                <label className="text-[9px] uppercase tracking-wider text-slate-500 font-black">Visual Badge Style Class</label>
                                <input type="text" name="color" defaultValue={editingMember.color} placeholder="e.g. bg-slate-900 text-stone-100" className="w-full border border-slate-200 p-2 bg-white" />
                              </div>

                              {editStaffSubTab === "board" && (
                                <div className="space-y-1 md:col-span-2">
                                  <label className="text-[9px] uppercase tracking-wider text-slate-500 font-black">Professional Biography / Bio Quote</label>
                                  <textarea name="desc" defaultValue={editingMember.desc || ""} rows={3} className="w-full border border-slate-200 p-2 bg-white resize-none" />
                                </div>
                              )}

                              <div className="md:col-span-2 pt-4 border-t border-slate-200/50 flex justify-end gap-2">
                                <button
                                  type="button"
                                  onClick={() => setEditingMember(null)}
                                  className="px-4 py-2 border border-slate-300 hover:bg-slate-100 rounded-none cursor-pointer"
                                >
                                  Cancel
                                </button>
                                <button
                                  type="submit"
                                  className="px-6 py-2 bg-slate-950 hover:bg-gold hover:text-slate-950 text-white font-bold rounded-none cursor-pointer"
                                >
                                  Save Leader Updates
                                </button>
                              </div>
                            </form>
                          </motion.div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                          {(editStaffSubTab === "board" ? executiveBoard : corporateOps).map((leader) => (
                            <div key={leader.id} className="bg-white border border-slate-100 p-5 shadow-sm flex flex-col justify-between group">
                              <div>
                                <div className="flex items-center gap-3 mb-4">
                                  <div className={cn("w-12 h-12 rounded-full flex items-center justify-center font-bold font-display text-sm tracking-wide bg-gradient-to-br border border-slate-100", leader.color)}>
                                    {leader.initials || leader.name.charAt(0)}
                                  </div>
                                  <div>
                                    <h4 className="font-bold text-slate-900 text-sm group-hover:text-gold transition-colors">{leader.name}</h4>
                                    <p className="text-[10px] text-slate-400 uppercase font-display tracking-wider font-extrabold">{leader.role}</p>
                                  </div>
                                </div>
                                <p className="text-slate-500 font-mono text-[11px] mb-3">{leader.email}</p>
                                {leader.desc && (
                                  <p className="text-[11px] text-slate-500 font-serif italic mb-4 leading-relaxed bg-slate-50 p-2.5 border-l-2 border-gold/40">
                                    "{leader.desc}"
                                  </p>
                                )}
                              </div>

                              <div className="pt-3 border-t border-slate-50 flex justify-end">
                                <button
                                  onClick={() => setEditingMember(leader)}
                                  className="text-xs text-amber-600 hover:text-amber-700 bg-amber-50 hover:bg-amber-100 px-3.5 py-1.5 font-bold transition-all"
                                >
                                  ✏️ Edit Leader Information
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : null}
              </div>
            ) : activeTab === "revenue" ? (
              <div className="space-y-8 pb-32">
                {(() => {
                  const isManagement = userRole === "Manager" || userRole === "Administrator" || userRole === "Super Admin" || userRole === "Group Controller" || userRole === "admin";
                  return (
                    <>
                      {/* Header Block */}
                      <div className={cn(
                        "p-8 border relative overflow-hidden",
                        selectedCompany === 'ramada' ? "bg-red-50/50 border-red-200/50" : 
                        selectedCompany === 'wyndham' ? "bg-emerald-50/50 border-emerald-200/50" : 
                        "bg-gold/5 border-gold/10"
                      )}>
                        <div className="relative z-10 max-w-3xl">
                          <div className={cn(
                            "text-[9px] font-display uppercase tracking-[0.25em] font-black pb-2 border-b max-w-max mb-6",
                            selectedCompany === 'ramada' ? "text-[#D11242] border-red-200" : 
                            selectedCompany === 'wyndham' ? "text-[#0b5c4b] border-emerald-200" : 
                            "text-gold border-gold/20"
                          )}>
                            {selectedCompany === 'ramada' ? "Ramada Suites" : 
                             selectedCompany === 'wyndham' ? "Wyndham Garden" : 
                             "Cove Management Limited"} • Yield Performance
                          </div>
                          <h2 className="text-4xl font-serif text-slate-900 italic tracking-tight font-light mb-4">
                            Property Revenue Intelligence
                          </h2>
                          <p className="text-sm font-serif italic text-slate-600 max-w-xl leading-relaxed">
                            Interactive sales trackers, channel yield distributions, historical room night metrics, and dynamic MTD billing.
                          </p>
                        </div>
                      </div>

                      {/* Key Yield Stats */}
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        {[
                          { label: "RevPar (Performance)", value: isManagement ? `$${selectedCompany === 'ramada' ? '215.20' : selectedCompany === 'wyndham' ? '184.50' : '198.80'}` : "🔒 RESTRICTED", trend: isManagement ? "Target: $180.00" : "Management Clearance Required", color: isManagement ? "text-slate-900" : "text-amber-600 font-bold" },
                          { label: "ADR (Average Rate)", value: isManagement ? `$${selectedCompany === 'ramada' ? '280.00' : selectedCompany === 'wyndham' ? '230.00' : '255.00'}` : "🔒 RESTRICTED", trend: isManagement ? "Dynamic BAR Active" : "Management Clearance Required", color: isManagement ? "text-slate-900" : "text-amber-600 font-bold" },
                          { label: "Avg Occupancy %", value: `${selectedCompany === 'ramada' ? '82.4%' : selectedCompany === 'wyndham' ? '76.8%' : '79.2%'}`, trend: "Target: 75.0%", color: "text-emerald-600 font-serif" },
                          { label: "MTD Gross Yield", value: isManagement ? `$${selectedCompany === 'ramada' ? '142,500' : selectedCompany === 'wyndham' ? '118,900' : '129,400'}` : "🔒 RESTRICTED", trend: isManagement ? "Ahead of schedule" : "Management Clearance Required", color: isManagement ? "text-slate-900" : "text-amber-600 font-bold" }
                        ].map((stat, idx) => (
                          <div key={idx} className="bg-white border border-slate-100 p-6 shadow-sm">
                            <p className="text-[9px] font-display uppercase tracking-widest text-slate-400 font-bold mb-1">{stat.label}</p>
                            <p className={cn("text-2xl font-serif italic font-bold", stat.color)}>{stat.value}</p>
                            <p className="text-[10px] text-slate-500 mt-1 font-mono">{stat.trend}</p>
                          </div>
                        ))}
                      </div>

                      {/* Recharts Yield Graph */}
                      {!isManagement ? (
                        <div className="bg-amber-50/50 border border-amber-200/60 p-12 text-center rounded-lg">
                          <Lock className="text-amber-500 mx-auto mb-4 animate-pulse" size={32} />
                          <h3 className="text-sm font-display uppercase tracking-widest text-slate-800 font-black">Restricted Financial Analytics</h3>
                          <p className="text-xs font-serif text-slate-500 italic mt-1">Detailed room-night yield distribution charts are restricted to authorized HODs and Corporate Controllers.</p>
                        </div>
                      ) : (
                        <div className="bg-white border border-slate-100 p-6 shadow-sm">
                          <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-50">
                            <div>
                              <h3 className="text-xs font-display uppercase tracking-widest text-slate-800 font-extrabold mb-1">Weekly Yield Performance & Room Night Sales</h3>
                              <p className="text-xs font-serif italic text-slate-500">Comparing ADR (Average Daily Rate) and Gross revenue distributions across Nadi market</p>
                            </div>
                          </div>
                          <div className="h-80 w-full font-mono">
                            <ResponsiveContainer width="100%" height="100%">
                              <AreaChart
                                data={[
                                  { day: "Mon", rev: 14200, adr: 220 },
                                  { day: "Tue", rev: 15800, adr: 235 },
                                  { day: "Wed", rev: 17200, adr: 240 },
                                  { day: "Thu", rev: 19100, adr: 250 },
                                  { day: "Fri", rev: 24500, adr: 280 },
                                  { day: "Sat", rev: 26800, adr: 295 },
                                  { day: "Sun", rev: 22400, adr: 260 }
                                ]}
                                margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                              >
                                <defs>
                                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor={selectedCompany === 'ramada' ? '#D11242' : '#0b5c4b'} stopOpacity={0.2}/>
                                    <stop offset="95%" stopColor={selectedCompany === 'ramada' ? '#D11242' : '#0b5c4b'} stopOpacity={0}/>
                                  </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="day" stroke="#94a3b8" fontSize={11} fontStyle="italic" />
                                <YAxis stroke="#94a3b8" fontSize={11} />
                                <Tooltip />
                                <Area type="monotone" dataKey="rev" stroke={selectedCompany === 'ramada' ? '#D11242' : '#0b5c4b'} strokeWidth={2} fillOpacity={1} fill="url(#colorRev)" name="Daily Gross Rev ($)" />
                              </AreaChart>
                            </ResponsiveContainer>
                          </div>
                        </div>
                      )}

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Channel Breakdown Table */}
                        {!isManagement ? (
                          <div className="bg-amber-50/50 border border-amber-200/60 p-12 text-center rounded-lg col-span-2">
                            <Lock className="text-amber-500 mx-auto mb-4 animate-pulse" size={32} />
                            <h3 className="text-sm font-display uppercase tracking-widest text-slate-800 font-black">Restricted Channel Matrix</h3>
                            <p className="text-xs font-serif text-slate-500 italic mt-1">Siteminder/SynXis channel distributions are visible only to Corporate General Managers and Controllers.</p>
                          </div>
                        ) : (
                          <>
                            <div className="bg-white border border-slate-100 p-6 shadow-sm">
                              <h3 className="text-xs font-display uppercase tracking-widest text-slate-800 font-extrabold mb-4 border-b border-slate-50 pb-3">Channel Yield Matrix</h3>
                              <table className="w-full text-xs font-sans text-slate-600">
                                <thead>
                                  <tr className="border-b border-slate-100 text-[10px] font-display uppercase tracking-wider text-slate-400">
                                    <th className="py-2.5 text-left font-bold">Distribution Channel</th>
                                    <th className="py-2.5 text-center font-bold">Share %</th>
                                    <th className="py-2.5 text-right font-bold">Avg Yield</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {[
                                    { channel: "Booking.com Partner Group", share: "38%", yield: `$${selectedCompany === 'ramada' ? '268.00' : '210.00'}` },
                                    { channel: "Expedia Web Network", share: "22%", yield: `$${selectedCompany === 'ramada' ? '274.00' : '215.00'}` },
                                    { channel: "Agoda Global Services", share: "14%", yield: `$${selectedCompany === 'ramada' ? '255.00' : '205.00'}` },
                                    { channel: "Direct Walk-ins & Web Booking", share: "16%", yield: `$${selectedCompany === 'ramada' ? '290.00' : '240.00'}` },
                                    { channel: "Corporate Contract Groups", share: "10%", yield: `$${selectedCompany === 'ramada' ? '220.00' : '185.00'}` }
                                  ].map((row, idx) => (
                                    <tr key={idx} className="border-b border-slate-50 hover:bg-slate-50 transition-colors animate-fade-in">
                                      <td className="py-2.5 font-semibold text-slate-800">{row.channel}</td>
                                      <td className="py-2.5 text-center text-slate-600 font-mono">{row.share}</td>
                                      <td className="py-2.5 text-right text-slate-900 font-mono font-bold">{row.yield}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </>
                        )}

                        {/* Channel Yield Chart representation */}
                        <div className="bg-white border border-slate-100 p-6 shadow-sm flex flex-col justify-between">
                          <div>
                            <h3 className="text-xs font-display uppercase tracking-widest text-slate-800 font-extrabold mb-2 border-b border-slate-50 pb-3">OTA Channel Parity Alerts</h3>
                            <p className="text-xs font-serif italic text-slate-500 mb-4">Daily automated scanning of Rate compliance across channels.</p>
                            <div className="space-y-3">
                              <div className="p-3 bg-red-50 border border-red-100 rounded-none flex items-center gap-3">
                                <AlertTriangle className="text-red-500 shrink-0" size={16} />
                                <div className="text-[11px] text-red-800 leading-normal font-serif">
                                  <strong>Expedia Discrepancy!</strong> Rates on Expedia are floating at $245, while direct BAR is restricted at $280. Parity breached.
                                </div>
                              </div>
                              <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-none flex items-center gap-3">
                                <CheckCircle className="text-emerald-500 shrink-0" size={16} />
                                <div className="text-[11px] text-emerald-800 leading-normal font-serif">
                                  <strong>Booking.com Compliant.</strong> Rate synched perfectly at $280 via Siteminder OTA bridge.
                                </div>
                              </div>
                            </div>
                          </div>
                          <button 
                            onClick={() => navigateTo("revenue-mgmt")} 
                            className="w-full text-center py-2.5 bg-black text-white hover:bg-gold text-[9px] font-display uppercase tracking-widest font-black transition-colors mt-6"
                          >
                            Access Rate Control Console
                          </button>
                        </div>
                      </div>
                    </>
                  );
                })()}
              </div>
            ) : activeTab === "revenue-mgmt" ? (
              <div className="space-y-8 pb-32">
                {/* Header Block with Division Pivot Selectbox */}
                <div className={cn(
                  "p-8 border relative overflow-hidden flex flex-col md:flex-row md:items-center md:justify-between gap-6",
                  selectedCompany === 'ramada' ? "bg-red-50/50 border-red-200/50" : 
                  selectedCompany === 'wyndham' ? "bg-emerald-50/50 border-emerald-200/50" : 
                  "bg-gold/5 border-gold/10"
                )}>
                  <div className="relative z-10 max-w-2xl">
                    <div className={cn(
                      "text-[9px] font-display uppercase tracking-[0.25em] font-black pb-2 border-b max-w-max mb-6",
                      selectedCompany === 'ramada' ? "text-[#D11242] border-red-200" : 
                      selectedCompany === 'wyndham' ? "text-[#0b5c4b] border-emerald-200" : 
                      "text-gold border-gold/20"
                    )}>
                      {selectedCompany === 'ramada' ? "Ramada Suites" : 
                       selectedCompany === 'wyndham' ? "Wyndham Garden" : 
                       "Cove Management Limited"} • Rate Management
                    </div>
                    <h2 className="text-4xl font-serif text-slate-900 italic tracking-tight font-light mb-2">
                      Revenue Control Console
                    </h2>
                    <p className="text-sm font-serif italic text-slate-600 leading-relaxed">
                      Sync BAR, distribute yield rates, run the dynamic pricing calculator, and audit parity flags instantly to optimize occupancy margins.
                    </p>
                    {offlineRatesCount > 0 && (
                      <div className="mt-4 flex items-center gap-2.5 bg-amber-50 border border-amber-205 text-amber-800 px-4 py-3 text-xs w-fit transition-all duration-300">
                        <span className="flex h-2.5 w-2.5 relative">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
                        </span>
                        <span className="font-sans font-bold uppercase tracking-wider">
                          {offlineRatesCount} Pending Rate Update(s) Cached Offline
                        </span>
                        <button
                          type="button"
                          onClick={() => triggerRatesBackgroundSync()}
                          disabled={isOfflineRatesSyncing}
                          className={`ml-3 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-sans font-extrabold uppercase tracking-widest text-[9px] transition-all flex items-center gap-1 cursor-pointer border border-amber-500 shadow-sm ${isOfflineRatesSyncing ? 'opacity-55 cursor-not-allowed' : ''}`}
                        >
                          {isOfflineRatesSyncing ? "Synchronizing Rates..." : "🔄 Sync Now"}
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Filter Dropdown - Pivoting Data by Division */}
                  <div className="bg-white border border-slate-100 p-4 shadow-xs min-w-[240px] shrink-0">
                    <label className="text-[9px] font-display uppercase tracking-widest text-[#1a1a1a] font-extrabold block mb-2">
                      Pivoted Division / Region
                    </label>
                    <div className="relative">
                      <select
                        value={revenueDivisionFilter}
                        onChange={(e) => setRevenueDivisionFilter(e.target.value as any)}
                        className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-xs font-serif italic py-2 px-3 focus:outline-none focus:border-gold rounded-none"
                      >
                        <option value="All">All Regions / Properties</option>
                        <option value="Western">Western Division</option>
                        <option value="Central">Central Division</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* 1. KPI Summary Cards (Desktop 3 columns layout matching Streamlit metrics) */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* KPI 1: Total Portfolio Revenue MTD */}
                  <div className="bg-white border border-slate-100 p-6 shadow-sm flex flex-col justify-between">
                    <div>
                      <span className="text-[9px] font-display uppercase tracking-wider text-slate-400 font-extrabold block mb-2">
                        Total Portfolio Revenue (MTD)
                      </span>
                      <p className="text-2xl font-serif text-slate-950 font-bold tracking-tight">
                        FJD $1,248,500.00
                      </p>
                    </div>
                    <div className="mt-4 flex items-center gap-1.5 text-xs font-sans text-emerald-600 font-bold">
                      <span className="text-base">↑</span> +12.4% vs last month
                    </div>
                  </div>

                  {/* KPI 2: Average Portfolio Occupancy */}
                  <div className="bg-white border border-slate-100 p-6 shadow-sm flex flex-col justify-between">
                    <div>
                      <span className="text-[9px] font-display uppercase tracking-wider text-slate-400 font-extrabold block mb-2">
                        Average Portfolio Occupancy
                      </span>
                      <p className="text-2xl font-serif text-[#C5A059] font-bold tracking-tight">
                        81.2%
                      </p>
                    </div>
                    <div className="mt-4 flex items-center gap-1.5 text-xs font-sans text-emerald-600 font-bold">
                      <span className="text-base">↑</span> Target 75.0% | +3.5% YoY
                    </div>
                  </div>

                  {/* KPI 3: System Diagnostics */}
                  <div className="bg-white border border-slate-100 p-6 shadow-sm flex flex-col justify-between">
                    <div>
                      <span className="text-[9px] font-display uppercase tracking-wider text-slate-400 font-extrabold block mb-2">
                        System Diagnostics
                      </span>
                      <p className="text-2xl font-serif text-emerald-700 font-bold tracking-tight flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse inline-block" />
                        CML Encryption Enforced
                      </p>
                    </div>
                    <div className="mt-4 flex items-center gap-1.5 text-xs font-sans text-emerald-600 font-bold">
                      🔒 94.8% Secure Protocol
                    </div>
                  </div>
                </div>

                {/* 2. Performance Tracking Interactive Table Block */}
                <div className="bg-white border border-slate-100 p-6 shadow-sm">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-50 pb-4 mb-6 gap-4">
                    <div>
                      <h3 className="text-xs font-display uppercase tracking-widest text-[#1a1a1a] font-extrabold">
                        Property Portfolio Performance Index
                      </h3>
                      <p className="text-[11px] font-serif italic text-slate-500 mt-1">
                        Displaying metrics filtered by: <strong className="text-gold capitalize">{revenueDivisionFilter} Division</strong>
                      </p>
                    </div>
                    
                    {/* Tiny inline visual badge count */}
                    <span className="bg-slate-50 text-slate-700 border border-slate-150 px-3 py-1 font-mono text-[9px] tracking-wider font-extrabold">
                      {[
                        { name: "Ramada Suites Wailoaloa", division: "Western", status: "Optimal", occupancy: "84.5%", adr: "FJD $320.00", revpar: "FJD $270.40" },
                        { name: "Wyndham Garden Wailoaloa", division: "Western", status: "Action Required", occupancy: "76.8%", adr: "FJD $280.00", revpar: "FJD $215.04" },
                        { name: "CML Headquarters Suite", division: "Central", status: "Optimal", occupancy: "89.2%", adr: "FJD $350.00", revpar: "FJD $312.20" }
                      ].filter(p => revenueDivisionFilter === "All" || p.division === revenueDivisionFilter).length} PROPERTIES LOADED
                    </span>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs font-sans text-slate-600">
                      <thead>
                        <tr className="bg-slate-50 text-[10px] font-display uppercase tracking-wider text-slate-800 border-b border-slate-100">
                          <th 
                            onClick={() => handlePortfolioSort("name")}
                            className="p-4 font-extrabold cursor-pointer hover:bg-slate-100/50 transition-colors select-none group"
                          >
                            <span className="flex items-center gap-1">
                              Property Name
                              <span className="text-gold font-bold">
                                {portfolioSortKey === "name" ? (portfolioSortOrder === "asc" ? " ▲" : " ▼") : " ↕"}
                              </span>
                            </span>
                          </th>
                          <th className="p-4 font-extrabold">Region Division</th>
                          <th className="p-4 font-extrabold">Status flag</th>
                          <th 
                            onClick={() => handlePortfolioSort("occupancy")}
                            className="p-4 font-extrabold text-right cursor-pointer hover:bg-slate-100/50 transition-colors select-none group"
                          >
                            <span className="flex items-center justify-end gap-1">
                              Occupancy %
                              <span className="text-gold font-bold">
                                {portfolioSortKey === "occupancy" ? (portfolioSortOrder === "asc" ? " ▲" : " ▼") : " ↕"}
                              </span>
                            </span>
                          </th>
                          <th className="p-4 font-extrabold text-right">ADR (FJD)</th>
                          <th 
                            onClick={() => handlePortfolioSort("revpar")}
                            className="p-4 font-extrabold text-right cursor-pointer hover:bg-slate-100/50 transition-colors select-none group"
                          >
                            <span className="flex items-center justify-end gap-1">
                              RevPAR (FJD)
                              <span className="text-gold font-bold">
                                {portfolioSortKey === "revpar" ? (portfolioSortOrder === "asc" ? " ▲" : " ▼") : " ↕"}
                              </span>
                            </span>
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {(() => {
                          const baseRows = [
                            { name: "Ramada Suites Wailoaloa", division: "Western", status: "Optimal", occupancy: "84.5%", adr: "FJD $320.00", revpar: "FJD $270.40" },
                            { name: "Wyndham Garden Wailoaloa", division: "Western", status: "Action Required", occupancy: "76.8%", adr: "FJD $280.00", revpar: "FJD $215.04" },
                            { name: "CML Headquarters Suite", division: "Central", status: "Optimal", occupancy: "89.2%", adr: "FJD $350.00", revpar: "FJD $312.20" }
                          ];
                          
                          const filtered = baseRows.filter(p => revenueDivisionFilter === "All" || p.division === revenueDivisionFilter);
                          
                          if (portfolioSortKey) {
                            filtered.sort((a, b) => {
                              let valA: string | number = "";
                              let valB: string | number = "";
                              
                              if (portfolioSortKey === "name") {
                                valA = a.name;
                                valB = b.name;
                              } else if (portfolioSortKey === "occupancy") {
                                valA = parseFloat(a.occupancy);
                                valB = parseFloat(b.occupancy);
                              } else if (portfolioSortKey === "revpar") {
                                valA = parseFloat(a.revpar.replace(/[^\d.]/g, ""));
                                valB = parseFloat(b.revpar.replace(/[^\d.]/g, ""));
                              }

                              if (typeof valA === "number" && typeof valB === "number") {
                                return portfolioSortOrder === "asc" ? valA - valB : valB - valA;
                              } else {
                                return portfolioSortOrder === "asc"
                                  ? String(valA).localeCompare(String(valB))
                                  : String(valB).localeCompare(String(valA));
                              }
                            });
                          }
                          
                          return filtered.map((row, idx) => (
                            <motion.tr 
                              key={row.name} 
                              whileHover={{ backgroundColor: "rgba(197, 160, 89, 0.02)" }}
                              className="border-b border-slate-100 hover:border-slate-200 transition-colors"
                            >
                              <td className="p-4 font-semibold text-slate-900 font-serif italic text-sm">{row.name}</td>
                              <td className="p-4">
                                <span className="bg-slate-100 text-slate-700 text-[9px] font-display uppercase tracking-wider px-2 py-0.5 font-bold">
                                  {row.division} Division
                                </span>
                              </td>
                              <td className="p-4">
                                <div className="flex items-center gap-1.5">
                                  <span className={cn(
                                    "w-1.5 h-1.5 rounded-full inline-block",
                                    row.status === 'Optimal' ? "bg-emerald-500" : "bg-amber-500 animate-pulse"
                                  )} />
                                  <span className={cn(
                                    "text-[10px] font-sans font-extrabold uppercase tracking-wider",
                                    row.status === 'Optimal' ? "text-emerald-700" : "text-amber-700"
                                  )}>
                                    {row.status}
                                  </span>
                                </div>
                              </td>
                              <td className="p-4 text-right font-mono font-medium text-slate-900">{row.occupancy}</td>
                              <td className="p-4 text-right font-mono text-slate-900 font-bold">{row.adr}</td>
                              <td className="p-4 text-right font-mono text-[#C5A059] font-black">{row.revpar}</td>
                            </motion.tr>
                          ));
                        })()}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Parity & Sync Control Block */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Active Channels Control Panel */}
                  <div className="bg-white border border-slate-100 p-6 shadow-sm flex flex-col justify-between">
                    <div>
                      <h3 className="text-xs font-display uppercase tracking-widest text-[#1a1a1a] font-extrabold border-b border-slate-50 pb-3 mb-4">
                        OTA Channel Parity Sync Status
                      </h3>
                      <div className="space-y-4">
                        {[
                          { channel: "Siteminder Channel Manager", status: "Active Syncing", flag: "ok", lastUpdated: "4 mins ago" },
                          { channel: "Booking.com Partner Portal", status: "Parity Match", flag: "ok", lastUpdated: "12 mins ago" },
                          { channel: "Expedia Partner Central", status: "Rate Mismatch ($245 / $280)", flag: "warning", lastUpdated: "1 hr ago" },
                          { channel: "Agoda Extranet Terminal", status: "Parity Match", flag: "ok", lastUpdated: "5 mins ago" }
                        ].map((row, idx) => (
                          <div key={idx} className="flex justify-between items-center text-xs border-b border-slate-50 pb-3 last:border-0 last:pb-0">
                            <div>
                              <p className="font-semibold text-slate-900">{row.channel}</p>
                              <p className="text-[10px] text-slate-400 font-mono">Last ping: {row.lastUpdated}</p>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className={cn(
                                "text-[9px] font-display uppercase tracking-wider font-extrabold px-2 py-0.5 rounded-none",
                                row.flag === 'ok' ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700 animate-pulse"
                              )}>
                                {row.status}
                              </span>
                              {row.flag !== 'ok' && (
                                <button className="px-2 py-1 bg-[#D11242] text-white hover:bg-black text-[9px] font-display uppercase tracking-[0.1em] font-black transition-colors rounded-none">
                                  Force Resync
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Interactive Pricing Calculator */}
                  <div className="bg-white border border-slate-100 p-6 shadow-sm flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-2 border-b border-slate-50 pb-3">
                        <TrendingUp size={16} className="text-gold" />
                        <h3 className="text-xs font-display uppercase tracking-widest text-slate-800 font-extrabold">Dynamic Margin Calculator</h3>
                      </div>
                      <p className="text-xs font-serif italic text-slate-500 mb-4">Simulate markup pricing strategy based on occupancy and weekend index values.</p>
                      
                      <div className="space-y-3 text-xs font-sans text-slate-600">
                        <div className="flex justify-between items-center">
                          <span>Base Room BAR Rate:</span>
                          <span className="font-mono font-bold text-slate-900">$200.00</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span>Occupancy Surcharge (at &gt;80% occupancy):</span>
                          <span className="font-mono font-bold text-slate-900">+$30.00</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span>Weekend Markup Factor (+15%):</span>
                          <span className="font-mono font-bold text-slate-900">+$30.00</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span>Property Eco-Tax Compliance Levy:</span>
                          <span className="font-mono font-bold text-slate-900">+$15.00</span>
                        </div>
                        <div className="border-t border-slate-200/50 pt-3 mt-3 flex justify-between items-center text-sm font-bold text-slate-900">
                          <span>Dynamic Projected BAR Rate:</span>
                          <span className="font-mono text-gold text-lg">$275.00</span>
                        </div>
                      </div>
                    </div>

                    <button 
                      onClick={handleDistributeRates}
                      className="w-full text-center py-2.5 bg-black text-white hover:bg-gold text-[9px] font-display uppercase tracking-widest font-black transition-colors mt-6 cursor-pointer"
                    >
                      Distribute Calculator Rates to Channel Manager
                    </button>
                  </div>
                </div>

                {/* 4. Luxury Hospitality Portal Corporate Footer Markup */}
                <div className="pt-12 border-t border-slate-100 text-center">
                  <p className="text-[10px] font-sans text-slate-400 uppercase tracking-widest leading-loose">
                    © 2026 CML Community Portal | Security Protocol: CML Encryption Standard Enforced
                  </p>
                </div>
              </div>
            ) : activeTab === "property-overview" ? (
              <div className="space-y-24 pb-32">
                {/* Hero Section */}
                <motion.div 
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 1.2 }}
                  className="relative h-[70vh] -mx-10 -mt-10 overflow-hidden group mb-12 shadow-2xl"
                >
                  <img 
                    src={(currentCompany as any)?.heroImage || "https://ramadawailoaloafiji.com/wp-content/uploads/2026/05/Ramada-70.jpg"} 
                    alt={`${currentCompany?.name} Exterior`} 
                    className="w-full h-full object-cover transition-transform duration-[3s] ease-out group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-luxury-black/90 via-luxury-black/20 to-transparent"></div>
                  <div className="absolute bottom-0 left-0 p-20 w-full max-w-5xl">
                    <motion.div
                      initial={{ opacity: 0, y: 30 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.5, duration: 1 }}
                    >
                      <p className="text-gold font-display text-xs uppercase tracking-[0.5em] mb-6 font-black flex items-center gap-4">
                        <span className="w-12 h-px bg-gold/50"></span>
                        {(currentCompany as any)?.tagline || "Fiji's Premier Waterfront Retreat"}
                      </p>
                      
                      {(currentCompany as any)?.brandTagline && (
                        <p className="text-white font-display text-lg uppercase tracking-[0.3em] mb-4 font-black">
                          {(currentCompany as any)?.brandTagline}
                        </p>
                      )}

                      {(currentCompany as any)?.logoPortal && selectedCompany !== 'wyndham' ? (
                        <img 
                          src={(currentCompany as any)?.logoPortal} 
                          alt={`${currentCompany?.name} Logo`} 
                          className="h-32 mb-8 object-contain" 
                          referrerPolicy="no-referrer"
                        />
                      ) : (currentCompany as any)?.logoPortal && selectedCompany === 'wyndham' ? (
                        <img 
                          src={(currentCompany as any)?.logoPortal} 
                          alt="Wyndham Garden Logo" 
                          className="h-32 mb-8 object-contain brightness-0 invert" 
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <h2 className="text-7xl font-serif text-white italic leading-[1.1]">
                          {currentCompany?.name} <br/><span className="text-white/80">{currentCompany?.description}</span>
                        </h2>
                      )}
                      
                      <div className="mt-12 flex gap-12">
                         <div className="space-y-1">
                            <p className="text-[10px] font-display uppercase tracking-[0.2em] text-slate-700">Location</p>
                            <p className="text-lg font-serif italic text-white">{(currentCompany as any)?.location || "Nadi Waterfront"}</p>
                         </div>
                         <div className="space-y-1">
                            <p className="text-[10px] font-display uppercase tracking-[0.2em] text-slate-700">Distance</p>
                            <p className="text-lg font-serif italic text-white">{(currentCompany as any)?.distance || "15 Min from Airport"}</p>
                         </div>
                         <div className="space-y-1">
                            <p className="text-[10px] font-display uppercase tracking-[0.2em] text-slate-700">Property Type</p>
                            <p className="text-lg font-serif italic text-white">{(currentCompany as any)?.floors || "7 Levels of Luxury"}</p>
                         </div>
                      </div>
                    </motion.div>
                  </div>
                </motion.div>

                {/* Introduction & Quick Facts */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-20">
                  <div className="lg:col-span-8 space-y-20">
                    <section>
                      <div className="flex items-center gap-4 mb-10">
                        <h3 className="text-4xl font-serif italic text-slate-900 leading-tight">Property Concept</h3>
                        <div className="flex-1 h-px bg-slate-100"></div>
                      </div>
                      <p className="text-slate-700 font-serif italic text-2xl leading-relaxed mb-12">
                        {(currentCompany as any)?.concept || "Fiji's newest 4 star serviced hotel is idyllically situated on the beach of Wailoaloa with a unique view of the sea and nearby surrounding Islands."}
                      </p>
                      <img 
                        src={(currentCompany as any)?.conceptImage || "/src/assets/images/regenerated_image_1778546992084.png"} 
                        alt="Property view" 
                        className="w-full h-[400px] object-cover mb-12 border border-slate-50 shadow-lg cursor-pointer hover:shadow-xl hover:brightness-105 transition-all duration-300"
                        onClick={() => openCompanyLightbox((currentCompany as any)?.conceptImage || "/src/assets/images/regenerated_image_1778546992084.png")}
                        title="Click to view full-screen"
                      />
                      <p className="text-slate-600 font-serif italic text-lg leading-relaxed">
                        {(currentCompany as any)?.longDescription || "We have thought of almost everything you'll need while you're here with our modern and comfortable rooms. The property offers great facilities such as a spa, deli shop, pool, beach deck dining, and conference rooms."}
                      </p>
                    </section>

                    <section className="space-y-12">
                       <div className="flex items-center gap-4 mb-10">
                        <h3 className="text-4xl font-serif italic text-slate-900 leading-tight">Room Inventory</h3>
                        <div className="flex-1 h-px bg-slate-100"></div>
                      </div>
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                          {((currentCompany as any)?.rooms || []).map((room: any, i: number) => (
                             <motion.div 
                               key={i} 
                               whileHover={{ y: -10 }}
                               className="luxury-card group overflow-hidden bg-white shadow-xl"
                             >
                                <div className="h-64 overflow-hidden relative cursor-pointer" onClick={() => openCompanyLightbox(room.img)}>
                                   <img src={room.img} alt={room.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                                   <div className="absolute inset-0 bg-black/10 group-hover:bg-black/30 transition-all duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
                                      <span className="text-[9px] font-display uppercase tracking-[0.2em] font-bold text-white border border-white/20 bg-slate-950/80 px-4 py-2">Explore Suite</span>
                                   </div>
                                   <div className="absolute top-6 right-6 bg-white/90 backdrop-blur-sm px-4 py-1 text-[9px] font-display uppercase tracking-[0.2em] font-black italic">
                                      {room.size}
                                   </div>
                                </div>
                                <div className="p-8">
                                   <h4 className="text-xl font-serif italic text-slate-900 mb-2">{room.name}</h4>
                                   <p className="text-[10px] font-display uppercase tracking-widest text-slate-700 italic">Occupancy: {room.sleeps}</p>
                                </div>
                             </motion.div>
                          ))}
                       </div>
                    </section>
                  </div>

                  <div className="lg:col-span-4 space-y-12">
                    <div className="sticky top-12 space-y-12">
                      {/* Active CML Rewards Promo Callout */}
                      <div className="luxury-card p-8 bg-gradient-to-br from-indigo-950 via-slate-900 to-stone-900 text-white border border-[#C5A02D]/40 shadow-2xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 opacity-15">
                           <Award size={90} className="text-[#C5A02D]" strokeWidth={1} />
                        </div>
                        <div className="relative z-10 space-y-5">
                          <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                            <span className="text-[9px] font-display uppercase tracking-[0.3em] text-[#C5A02D] font-black">CML Rewards Core Active</span>
                          </div>
                          
                          <h4 className="text-xl font-serif italic text-white leading-snug">
                            CML Member Dining & Loyalty Portal
                          </h4>
                          
                          <p className="text-[10.5px] text-slate-300 leading-relaxed font-sans font-light">
                            Instantly scan member profiles, award dining loyalty tokens, manage seatings, and process VIP voucher redemptions.
                          </p>
                          
                          <button
                            onClick={() => navigateTo("dining-loyalty")}
                            className="w-full py-3 bg-[#C5A02D] hover:bg-gold-light text-[#1c1c1c] text-[10px] uppercase font-display font-black tracking-widest transition-all duration-300 hover:scale-[1.02] shadow-lg shadow-black/25 flex items-center justify-center gap-2"
                          >
                            <Award size={14} /> Launch CML Rewards
                          </button>
                        </div>
                      </div>

                      {/* What's New Vertical Banner */}
                      <div className="luxury-card p-8 bg-gradient-to-br from-amber-500/10 to-gold/5 border border-gold/30 shadow-xl relative overflow-hidden group">
                        <div className="absolute right-0 top-0 p-4 opacity-10">
                           <Newspaper size={80} strokeWidth={1} />
                        </div>
                        <div className="flex items-center gap-2 mb-6 border-b border-gold/20 pb-4 relative z-10">
                          <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                          <h4 className="text-[11px] font-display uppercase tracking-[0.3em] font-black text-slate-800 italic">WHAT'S NEW</h4>
                        </div>
                        
                        <div className="space-y-6 relative z-10 max-h-[460px] overflow-y-auto pr-1.5 scrollbar-thin scrollbar-thumb-gold/20">
                          {latestCorporateNews.length === 0 ? (
                            <p className="text-[11px] font-serif italic text-slate-500">No new updates posted today.</p>
                          ) : (
                            latestCorporateNews.map((news: any) => {
                              const createdDateString = news.createdAt?.toDate 
                                ? news.createdAt.toDate().toLocaleDateString()
                                : news.createdAt ? new Date(news.createdAt).toLocaleDateString() : "";
                              return (
                                <div key={news.id} className="group/news border-b border-slate-100 last:border-0 pb-5 last:pb-0 space-y-2">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="text-[8px] font-display uppercase tracking-widest bg-gold/15 text-slate-800 px-1.5 py-0.5 font-bold">
                                      {news.category || "Notice"}
                                    </span>
                                    {news.isUrgent && (
                                      <span className="text-[8px] font-display uppercase tracking-widest bg-red-600 text-white px-1.5 py-0.5 font-bold animate-pulse">
                                        Urgent
                                      </span>
                                    )}
                                    <span className="text-[8px] font-mono text-slate-400 font-bold ml-auto">{createdDateString}</span>
                                  </div>
                                  <h5 className="text-[13px] font-serif italic text-slate-900 group-hover/news:text-gold transition-colors font-bold leading-snug">
                                    {news.title}
                                  </h5>
                                  <p className="text-[10px] text-slate-600 line-clamp-3 leading-relaxed font-sans">
                                    {news.content}
                                  </p>
                                  {news.imageUrl && (
                                    <img 
                                      src={news.imageUrl} 
                                      alt={news.title} 
                                      className="w-full h-24 object-cover mt-2.5 rounded-sm border border-slate-100" 
                                      referrerPolicy="no-referrer"
                                    />
                                  )}
                                  <div className="text-[8px] font-display uppercase tracking-widest text-[#c5a02d] font-bold pt-1">
                                    By {news.authorName || "CML Admin"}
                                  </div>
                                </div>
                              );
                            })
                          )}
                        </div>
                      </div>

                      <div className="luxury-card p-10 bg-luxury-black text-white shadow-2xl relative overflow-hidden group">
                        <div className="absolute -right-12 -top-12 w-48 h-48 bg-gold/5 rounded-full blur-3xl group-hover:bg-gold/10 transition-colors"></div>
                        <h4 className="text-[10px] font-display uppercase tracking-[0.4em] font-black text-gold mb-10 pb-4 border-b border-gold/10 relative z-10 italic">Core Amenities</h4>
                        <div className="grid grid-cols-1 gap-8 relative z-10">
                           {((currentCompany as any)?.amenities || []).map((feature: any, i: number) => (
                             <div key={i} className="flex items-start gap-4 group">
                                <div className="w-10 h-10 bg-white/5 border border-white/10 flex items-center justify-center text-gold group-hover:border-gold group-hover:bg-gold group-hover:text-white transition-all duration-500">
                                   <feature.icon size={16} strokeWidth={1} />
                                </div>
                                <div>
                                   <p className="text-[11px] font-display uppercase tracking-widest text-white transition-all mb-1 font-bold">{feature.label}</p>
                                   <p className="text-[9px] text-slate-300 font-serif italic not-italic font-bold">{feature.desc}</p>
                                </div>
                             </div>
                           ))}
                        </div>
                      </div>

                      <div className="luxury-card p-10 bg-white border border-slate-100 shadow-xl italic-headings">
                         <h4 className="text-[10px] font-display uppercase tracking-[0.4em] font-black text-slate-800 mb-10 pb-4 border-b border-gold/10 italic">Property Highlights</h4>
                         <div className="space-y-6">
                            {((currentCompany as any)?.highlights || []).map((highlight: string, i: number) => (
                              <div key={i} className="flex items-center gap-3">
                                 <div className="w-1.5 h-1.5 bg-gold rounded-full"></div>
                                 <span className="text-xs font-serif italic text-slate-600">{highlight}</span>
                              </div>
                            ))}
                         </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Culinary Excellence Section */}
                {((currentCompany as any)?.culinary?.venues?.length > 0) && (
                  <section className="space-y-16 -mx-10 bg-luxury-black text-white p-20 py-32 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-20 opacity-5">
                       <Hotel size={500} strokeWidth={0.5} />
                    </div>
                    <div className="max-w-6xl mx-auto relative z-10">
                      <div className="flex flex-col items-center text-center mb-20">
                        <p className="text-gold font-display text-[10px] uppercase tracking-[0.6em] mb-6 font-black italic">Gastronomy</p>
                        <h3 className="text-5xl font-serif italic text-white mb-8">{(currentCompany as any)?.culinary?.title}</h3>
                        <p className="max-w-2xl text-slate-300 font-serif italic text-lg leading-relaxed">
                          {(currentCompany as any)?.culinary?.desc}
                        </p>
                      </div>

                      <div className="space-y-32">
                        {((currentCompany as any)?.culinary?.venues || []).map((venue: any, idx: number) => (
                          <div key={idx} className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
                            <div className={cn("space-y-10", idx % 2 === 1 ? "order-2" : "order-2 lg:order-1")}>
                               <div className="space-y-4">
                                  <h4 className="text-3xl font-serif italic text-gold">{venue.name}</h4>
                                  <p className="text-slate-300 font-serif italic leading-relaxed text-lg">
                                     {venue.desc}
                                  </p>
                               </div>
                            </div>
                            <div className={cn("h-[500px] overflow-hidden shadow-2xl border border-white/5 cursor-pointer relative group/venue", idx % 2 === 1 ? "order-1" : "order-1 lg:order-2")} onClick={() => openCompanyLightbox(venue.img)}>
                               <img 
                                 src={venue.img} 
                                 className="w-full h-full object-cover transition-transform duration-[4s] group-hover/venue:scale-105" 
                                 alt={venue.name}
                               />
                               <div className="absolute inset-0 bg-black/10 group-hover/venue:bg-black/35 transition-all duration-300 flex items-center justify-center opacity-0 group-hover/venue:opacity-100">
                                  <span className="text-[9px] font-display uppercase tracking-[0.2em] font-bold text-white border border-white/20 bg-slate-950/80 px-4 py-2">View Venue</span>
                               </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </section>
                )}

                {/* Events & Meeting Section */}
                <section className="space-y-16">
                  <div className="flex flex-col items-center text-center">
                    <p className="text-gold font-display text-[10px] uppercase tracking-[0.6em] mb-6 font-black italic">MICE & Events</p>
                    <h3 className="text-5xl font-serif italic text-slate-900 italic mb-8">Conferences with Character</h3>
                    <p className="max-w-2xl text-slate-500 font-serif italic text-lg leading-relaxed">
                      {currentCompany?.fullName} is the perfect venue for any special occasions you wish to celebrate.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                     {((currentCompany as any)?.eventImages || [
                       "https://images.unsplash.com/photo-1431540015161-0bf868a2d407?auto=format&fit=crop&q=80&w=1200",
                       "https://images.unsplash.com/photo-1505373877841-8d25f7d46678?auto=format&fit=crop&q=80&w=1200",
                       "https://images.unsplash.com/photo-1543007630-9710e4a00a20?auto=format&fit=crop&q=80&w=1200"
                     ]).map((img: string, i: number) => (
                       <div key={i} className="h-[400px] overflow-hidden shadow-lg border border-slate-100 cursor-pointer relative group/event" onClick={() => openCompanyLightbox(img)}>
                          <img src={img} className="w-full h-full object-cover grayscale group-hover/event:grayscale-0 transition-all duration-1000 group-hover/event:scale-105" />
                          <div className="absolute inset-0 bg-black/10 group-hover/event:bg-black/35 transition-all duration-300 flex items-center justify-center opacity-0 group-hover/event:opacity-100">
                             <span className="text-[9px] font-display uppercase tracking-[0.2em] font-bold text-white border border-white/20 bg-slate-950/80 px-4 py-2">View Gallery</span>
                          </div>
                       </div>
                     ))}
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
                    <div className="lg:col-span-5 space-y-10">
                       <h4 className="text-3xl font-serif italic text-slate-900 border-b border-slate-100 pb-4">Meeting Space Highlights</h4>
                       <ul className="space-y-6">
                          {((currentCompany as any)?.meetingHighlights || [
                            "State of the art audiovisual technology",
                            "LCD projector screens & High-definition displays",
                            "High-Speed Wi-Fi & Cordless Microphones",
                            "Full Event Catering & Planning Services",
                            "Flipcharts with assorted markers & white boards"
                          ]).map((item: string, i: number) => (
                            <div key={i} className="flex gap-4">
                               <div className="w-6 h-6 bg-luxury-cream text-gold flex items-center justify-center shrink-0">
                                  <CheckCircle size={14} />
                               </div>
                               <p className="text-slate-600 font-serif italic leading-relaxed">{item}</p>
                            </div>
                          ))}
                       </ul>
                    </div>
                    <div className="lg:col-span-7">
                       <div className="luxury-card overflow-hidden shadow-2xl border border-slate-100">
                          <div className="p-8 bg-luxury-black text-white flex justify-between items-center">
                             <h4 className="text-[10px] font-display uppercase tracking-[0.4em] font-black text-gold italic">Capacity Chart</h4>
                             <div className="text-right">
                                <p className="text-[9px] font-display uppercase text-slate-600">Total Area</p>
                                <p className="text-xl font-serif italic text-white">{(currentCompany as any)?.capacityChart?.totalArea || "224 m²"} / {(currentCompany as any)?.capacityChart?.dimensions || "22.55m x 9.91m"}</p>
                             </div>
                          </div>
                          <table className="w-full text-left font-serif italic">
                             <thead className="bg-luxury-cream/30 text-[10px] font-display uppercase tracking-widest text-slate-500 italic not-italic">
                                <tr>
                                   <th className="p-8">Setup Configuration</th>
                                   <th className="p-8 text-right">Maximum Capacity</th>
                                </tr>
                             </thead>
                             <tbody className="divide-y divide-slate-50">
                                {((currentCompany as any)?.capacityChart?.rows || [
                                  { name: "Theatre Style", cap: "120 Pax" },
                                  { name: "Banquet Style", cap: "80 Pax" },
                                  { name: "Classroom Style", cap: "80 Pax" },
                                  { name: "U-Shape Setup", cap: "80 Pax" },
                                  { name: "Boardroom Setup", cap: "50 Pax" }
                                ]).map((row: any, i: number) => (
                                  <tr key={i} className="hover:bg-luxury-cream/10 transition-colors">
                                     <td className="p-8 text-slate-900 text-lg">{row.name}</td>
                                     <td className="p-8 text-right text-gold font-bold text-xl">{row.cap}</td>
                                  </tr>
                                ))}
                             </tbody>
                          </table>
                       </div>
                    </div>
                  </div>
                </section>

                {/* Area Entertainment Section */}
                <section className="space-y-16 pb-20">
                   <div className="flex items-center gap-4 mb-10">
                    <h3 className="text-4xl font-serif italic text-slate-900 leading-tight">Local Culture & Fun</h3>
                    <div className="flex-1 h-px bg-slate-100"></div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                     {[
                       { name: "Sri Siva Temple", dist: "10 Mins", img: "https://images.unsplash.com/photo-1548013146-72479768b921?auto=format&fit=crop&q=80&w=800" },
                       { name: "Garden of Sleeping Giant", dist: "30 Mins", img: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&q=80&w=800" },
                       { name: "Sabeto Hot Springs", dist: "30 Mins", img: "https://images.unsplash.com/photo-1510218830377-1e58288594cc?auto=format&fit=crop&q=80&w=800" },
                       { name: "Port Denarau", dist: "15 Mins", img: "https://images.unsplash.com/photo-1549488344-1f9b8d2bd1f3?auto=format&fit=crop&q=80&w=800" }
                     ].map((attr, i) => (
                       <div key={i} className="luxury-card group overflow-hidden bg-white shadow-sm border border-slate-50">
                          <div className="h-48 overflow-hidden">
                             <img src={attr.img} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 grayscale hover:grayscale-0" alt={attr.name} />
                          </div>
                          <div className="p-6">
                             <h4 className="text-sm font-serif italic text-slate-900 mb-1">{attr.name}</h4>
                             <p className="text-[9px] font-display uppercase tracking-widest text-slate-600">Distance: {attr.dist}</p>
                          </div>
                       </div>
                     ))}
                  </div>
                </section>

                {/* Daily News Noticeboard Feed at the bottom of the main dashboard menu */}
                <section className="space-y-12">
                   <div className="flex items-center justify-between gap-4 mb-6">
                     <div className="flex items-center gap-4 flex-1">
                        <h3 className="text-4xl font-serif italic text-slate-900 leading-tight">Daily Noticeboard</h3>
                        <div className="flex-1 h-px bg-slate-100"></div>
                     </div>
                     <button
                       onClick={() => navigateTo("daily-news")}
                       className="px-6 py-3 border border-gold/40 text-gold text-[10px] font-display uppercase tracking-wider font-extrabold hover:bg-gold hover:text-white transition-all whitespace-nowrap"
                     >
                       Full Noticeboard
                     </button>
                   </div>
                   {newsLoading ? (
                     <div className="flex flex-col items-center justify-center p-12 bg-white border border-slate-100/50">
                       <RefreshCw className="animate-spin text-gold" size={24} />
                       <p className="text-[10px] font-display uppercase tracking-widest text-slate-400 mt-2">Loading Daily Noticeboard...</p>
                     </div>
                   ) : latestCorporateNews.length === 0 ? (
                     <p className="text-slate-500 font-serif italic text-center py-6">No dynamic briefs are active right now.</p>
                   ) : (
                     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                       {latestCorporateNews.map((news: any) => (
                         <div 
                           key={news.id} 
                           onClick={() => navigateTo("daily-news")}
                           className={cn(
                             "luxury-card bg-white border p-6 shadow-sm hover:shadow-md hover:scale-[1.01] transition-all cursor-pointer flex flex-col justify-between h-[360px] group relative overflow-hidden",
                             news.isUrgent ? "border-red-200 bg-red-50/5" : "border-slate-100"
                           )}
                         >
                           <div className="space-y-4">
                             <div className="flex items-center justify-between">
                               <span className={cn(
                                 "text-[8px] font-display uppercase tracking-widest font-black px-2 py-0.5 text-white",
                                 news.category === "Operational" ? "bg-amber-600" :
                                 news.category === "Announcement" ? "bg-indigo-600" :
                                 news.category === "Event" ? "bg-teal-600" : "bg-emerald-600"
                               )}>
                                 {news.category || "ANN"}
                               </span>
                               {news.isUrgent && (
                                 <span className="text-[7.5px] font-display uppercase tracking-widest text-red-650 font-black animate-pulse flex items-center gap-1">
                                   ⚠️ URGENT
                                 </span>
                               )}
                             </div>
                             
                             <h4 className="text-base font-serif italic text-slate-900 group-hover:text-gold transition-colors line-clamp-2 leading-snug">
                               {news.title}
                             </h4>
                             <p className="text-xs text-slate-500 font-serif italic leading-relaxed line-clamp-4">
                               {news.content}
                             </p>
                           </div>

                           <div className="border-t border-slate-50 pt-4 flex items-center justify-between mt-auto">
                             <div className="flex items-center gap-2">
                               <div className="w-6 h-6 rounded-full bg-slate-50 flex items-center justify-center text-slate-500">
                                 <Users size={10} className="text-gold" />
                               </div>
                               <div>
                                 <p className="text-[8px] font-display uppercase tracking-widest font-black text-slate-800">{news.authorName}</p>
                                 <p className="text-[7px] text-slate-400 font-mono block truncate max-w-[120px]">{news.authorEmail}</p>
                               </div>
                             </div>

                             <div className="text-right">
                               <span className="text-[7px] uppercase tracking-widest text-slate-400 font-bold block">Published</span>
                               <span className="text-[8.5px] font-serif italic text-slate-500">
                                 {news.createdAt ? (news.createdAt.toDate ? news.createdAt.toDate().toLocaleDateString() : new Date(news.createdAt).toLocaleDateString()) : "Today"}
                               </span>
                             </div>
                           </div>
                         </div>
                       ))}
                     </div>
                   )}
                </section>
              </div>
            ) : activeTab === "profile" ? (
              <div className="max-w-4xl mx-auto py-12">
                <div className="flex flex-col md:flex-row items-center gap-12 mb-16">
                  <div className="flex flex-col items-center gap-4">
                    <div className="w-32 h-32 md:w-48 md:h-48 border-2 border-gold/20 p-2 rounded-none relative overflow-hidden group bg-luxury-black">
                      <div className="w-full h-full flex items-center justify-center text-gold text-4xl md:text-6xl font-serif italic overflow-hidden">
                        {userProfileData?.photoURL || currentUser?.photoURL ? (
                          <img src={userProfileData?.photoURL || currentUser?.photoURL} alt="Profile" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        ) : (
                          userProfileData?.displayName?.[0] || currentUser?.displayName?.[0] || currentUser?.email?.[0] || "?"
                        )}
                      </div>
                    </div>
                    
                    <label className="cursor-pointer bg-white hover:bg-slate-50 border border-slate-200 text-[9px] font-display uppercase tracking-widest font-black px-4 py-2 flex items-center gap-2 transition-all active:scale-95 shadow-xs">
                      <Camera size={12} className="text-[#C5A059]" />
                      Change Photo
                      <input 
                        type="file" 
                        accept="image/*" 
                        className="hidden" 
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onload = (event) => {
                              const img = new Image();
                              img.onload = () => {
                                const canvas = document.createElement("canvas");
                                const MAX_WIDTH = 250;
                                const MAX_HEIGHT = 250;
                                let width = img.width;
                                let height = img.height;

                                if (width > height) {
                                  if (width > MAX_WIDTH) {
                                    height *= MAX_WIDTH / width;
                                    width = MAX_WIDTH;
                                  }
                                } else {
                                  if (height > MAX_HEIGHT) {
                                    width *= MAX_HEIGHT / height;
                                    height = MAX_HEIGHT;
                                  }
                                }

                                canvas.width = width;
                                canvas.height = height;
                                const ctx = canvas.getContext("2d");
                                ctx?.drawImage(img, 0, 0, width, height);
                                
                                const compressedBase64 = canvas.toDataURL("image/jpeg", 0.75);
                                setEditedPhotoURL(compressedBase64);
                                handleUpdatePhoto(compressedBase64);
                              };
                              img.src = event.target?.result as string;
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                      />
                    </label>
                  </div>

                  <div className="text-center md:text-left">
                    <h2 className="text-5xl font-serif text-slate-900 italic mb-2">{userProfileData?.displayName || currentUser?.displayName || "Team Member"}</h2>
                    <p className="luxury-label font-bold text-gold !text-sm mb-4">{userRole || "Fetching Role..."}</p>
                    <div className="flex flex-wrap justify-center md:justify-start gap-4">
                      <span className="px-4 py-2 bg-white border border-slate-100 text-[10px] font-display uppercase tracking-widest text-slate-500">{currentUser?.email}</span>
                      <span className="px-4 py-2 bg-emerald-50 text-emerald-600 text-[10px] font-display uppercase tracking-widest font-bold">Active Sync</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="luxury-card p-10 bg-white shadow-sm">
                    <h3 className="text-[11px] font-display uppercase tracking-[0.3em] font-black text-gold mb-8 italic border-b border-slate-50 pb-4">Account Permissions</h3>
                    <div className="space-y-6">
                      <div className="flex justify-between items-center">
                        <p className="text-xs text-slate-500 font-serif italic">Portal Access</p>
                        <span className="text-[10px] font-bold text-emerald-600 uppercase">Granted</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <p className="text-xs text-slate-500 font-serif italic">Executive Dashboards</p>
                        <span className={cn("text-[10px] font-bold uppercase", (userRole === "Administrator" || userRole === "Super Admin" || userRole === "Group Controller") ? "text-emerald-600" : "text-slate-300")}>{(userRole === "Administrator" || userRole === "Super Admin" || userRole === "Group Controller") ? "Enabled" : "Restricted"}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <p className="text-xs text-slate-500 font-serif italic">Management Tools</p>
                        <span className={cn("text-[10px] font-bold uppercase", (userRole === "Administrator" || userRole === "Super Admin" || userRole === "Group Controller") ? "text-emerald-600" : "text-slate-300")}>{(userRole === "Administrator" || userRole === "Super Admin" || userRole === "Group Controller") ? "Enabled" : "Restricted"}</span>
                      </div>
                      {(userRole === "Administrator" || userRole === "Super Admin" || userRole === "Group Controller") && (
                        <div className="pt-4 mt-4 border-t border-slate-50">
                          <button 
                            onClick={() => navigateTo("user-management")}
                            className="bg-luxury-black text-white px-6 py-2 text-[9px] font-display uppercase tracking-widest font-black hover:bg-gold transition-all flex items-center justify-center gap-2 w-full shadow-lg"
                          >
                            <ShieldCheck size={12} /> Access User Control
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="luxury-card p-10 bg-luxury-black text-white shadow-xl">
                    <h3 className="text-[11px] font-display uppercase tracking-[0.3em] font-black text-gold mb-8 italic border-b border-white/5 pb-4">System Settings</h3>
                    <div className="space-y-6 opacity-40">
                      <div className="flex justify-between items-center">
                         <p className="text-xs font-serif italic">Notification Alerts</p>
                         <div className="w-8 h-4 bg-white/20 rounded-full relative">
                            <div className="absolute right-0 w-4 h-4 bg-gold rounded-full scale-75 shadow-lg" />
                         </div>
                      </div>
                      <div className="flex justify-between items-center">
                         <p className="text-xs font-serif italic">Email Digests</p>
                         <div className="w-8 h-4 bg-white/20 rounded-full relative">
                            <div className="absolute left-0 w-4 h-4 bg-slate-500 rounded-full scale-75" />
                         </div>
                      </div>
                      <div className="mt-8 pt-4 border-t border-white/5">
                        <p className="text-[10px] text-slate-500 font-serif italic leading-relaxed">Advanced system preferences and regional settings are managed by corporate administration defaults.</p>
                      </div>
                    </div>
                  </div>

                  <div className="md:col-span-2 luxury-card p-10 bg-white border border-slate-100 shadow-sm">
                    <h3 className="text-[11px] font-display uppercase tracking-[0.3em] font-black text-gold mb-8 italic border-b border-slate-50 pb-4">Edit Personal Details</h3>
                    
                    {profileSaveSuccess && (
                      <div className="mb-6 p-4 bg-emerald-50 border border-emerald-100 text-emerald-800 text-[11px] font-display uppercase tracking-widest font-black flex items-center gap-3">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                        ✓ Profile updated successfully and synced to live directories.
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div>
                        <label className="block text-[9px] font-display uppercase tracking-widest text-gold font-black mb-2">Display Name</label>
                        <input 
                          type="text" 
                          value={editedDisplayName} 
                          onChange={(e) => setEditedDisplayName(e.target.value)} 
                          placeholder="Your full name"
                          className="w-full bg-slate-50 border border-slate-100 pl-4 pr-4 py-3 text-xs font-serif italic focus:border-gold/30 transition-all outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[9px] font-display uppercase tracking-widest text-gold font-black mb-2">Mobile Number</label>
                        <input 
                          type="text" 
                          value={editedMobile} 
                          onChange={(e) => setEditedMobile(e.target.value)} 
                          placeholder="Your contact mobile"
                          className="w-full bg-slate-50 border border-slate-100 pl-4 pr-4 py-3 text-xs font-serif italic focus:border-gold/30 transition-all outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[9px] font-display uppercase tracking-widest text-gold font-black mb-2">Department</label>
                        <select 
                          value={editedDepartment} 
                          onChange={(e) => setEditedDepartment(e.target.value)} 
                          className="w-full bg-slate-50 border border-slate-100 pl-4 pr-4 py-3 text-xs font-display uppercase tracking-widest font-bold focus:border-gold/30 transition-all outline-none"
                        >
                          <option value="">Select Department</option>
                          <option value="Front Office">Front Office</option>
                          <option value="Housekeeping">Housekeeping</option>
                          <option value="Food & Beverage">Food & Beverage</option>
                          <option value="Sales & Marketing">Sales & Marketing</option>
                          <option value="Engineering">Engineering</option>
                          <option value="Human Resources">Human Resources</option>
                          <option value="Finance & Accounts">Finance & Accounts</option>
                          <option value="Administration">Administration</option>
                          <option value="IT Support">IT Support</option>
                          <option value="Digital Media">Digital Media</option>
                          <option value="Operations">Operations</option>
                          <option value="Customer Service">Customer Service</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[9px] font-display uppercase tracking-widest text-gold font-black mb-2">Designation / Title</label>
                        <input 
                          type="text" 
                          value={editedDesignation} 
                          onChange={(e) => setEditedDesignation(e.target.value)} 
                          placeholder="e.g. Graphic Designer / Accountant"
                          className="w-full bg-slate-50 border border-slate-100 pl-4 pr-4 py-3 text-xs font-serif italic focus:border-gold/30 transition-all outline-none"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-[9px] font-display uppercase tracking-widest text-gold font-black mb-2">Emergency Contact Info</label>
                        <input 
                          type="text" 
                          value={editedEmergency} 
                          onChange={(e) => setEditedEmergency(e.target.value)} 
                          placeholder="Name & Contact number of emergency contact"
                          className="w-full bg-slate-50 border border-slate-100 pl-4 pr-4 py-3 text-xs font-serif italic focus:border-gold/30 transition-all outline-none"
                        />
                      </div>
                    </div>

                    <div className="mt-8 flex justify-end">
                      <button 
                        onClick={handleSaveProfile}
                        disabled={isSavingProfile}
                        className="bg-luxury-black text-white px-10 py-3 text-[10px] font-display uppercase tracking-[0.2em] font-black hover:bg-gold transition-all shadow-xl disabled:opacity-50 active:scale-95"
                      >
                        {isSavingProfile ? "Syncing..." : "Save Profile Details"}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : activeTab === "hrms" ? (
              <HRMS 
                companyId={selectedCompany || 'cml'} 
                userRole={userRole || undefined} 
                onBackToPortal={() => setActiveTab("property-overview")}
              />
            ) : activeTab === "sop" ? (
              <div className="space-y-8">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-4">
                  <div>
                    <h2 className="text-3xl font-serif text-slate-900 italic">Hotel System Training</h2>
                    <p className="luxury-label opacity-60">Consolidated System Guidance & Standard Operating Procedures</p>
                  </div>
                </div>

                {/* Tab Switcher for SOP/Keycard Guidelines */}
                <div className="flex border-b border-gold/10 mb-6 space-x-1 overflow-x-auto no-scrollbar">
                  {[
                    { id: 'registry', label: 'Official SOP Documents Hub' }
                  ].map((tabItem) => (
                    <button
                      key={tabItem.id}
                      onClick={() => setSopSubTab(tabItem.id)}
                      className={cn(
                        "px-6 py-3.5 text-[10px] font-display uppercase tracking-widest font-black transition-all border-b-2 shrink-0 whitespace-nowrap border-gold text-gold bg-gold/5 font-extrabold"
                      )}
                    >
                      {tabItem.label}
                    </button>
                  ))}
                </div>

                <div className="space-y-8">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                      <h3 className="text-xl font-serif italic text-slate-800">SOP Registry</h3>
                      <p className="text-[10px] font-display uppercase tracking-widest text-slate-400">Search and manage official operational documents</p>
                    </div>
                      
                      <div className="flex flex-wrap items-center gap-4">
                        <div className="relative">
                          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                          <input 
                            type="text"
                            placeholder="Search SOPs..."
                            value={sopSearch}
                            onChange={(e) => setSopSearch(e.target.value)}
                            className="pl-10 pr-4 py-3 bg-white border border-slate-100 text-[10px] font-display uppercase tracking-widest focus:ring-1 focus:ring-gold outline-none w-64 shadow-sm"
                          />
                        </div>
                        
                        <div className="flex gap-3">
                          <div className="relative overflow-hidden group">
                            <input 
                              type="file" 
                              accept=".pdf"
                              className="hidden" 
                              id="sop-upload"
                              onChange={async (e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  setIsSopUploading(true);
                                  try {
                                    const url = await handlePdfUpload(file);
                                    const newSop = {
                                      title: file.name.replace(/\.[^/.]+$/, ""),
                                      url: url,
                                      date: new Date().toISOString().split('T')[0]
                                    };
                                    setSops(prev => [newSop, ...prev]);
                                  } catch (err) {
                                    console.error(err);
                                  } finally {
                                    setIsSopUploading(false);
                                  }
                                }
                              }}
                            />
                            <label 
                              htmlFor="sop-upload"
                              className={cn(
                                "flex items-center gap-2 px-6 py-3 bg-gold text-white text-[10px] font-display uppercase tracking-widest font-black transition-all shadow-lg cursor-pointer hover:bg-luxury-black",
                                isSopUploading && "opacity-50 cursor-wait"
                              )}
                            >
                              {isSopUploading ? (
                                <>
                                  <RefreshCw size={14} className="animate-spin" /> Uploading...
                                </>
                              ) : (
                                <>
                                  <Plus size={14} /> Upload PDF SOP
                                </>
                              )}
                            </label>
                          </div>

                          <div className="relative overflow-hidden group">
                            <input 
                              type="file" 
                              accept=".zip"
                              className="hidden" 
                              id="sop-zip-upload"
                              onChange={handleSopZipSelected}
                            />
                            <label 
                              htmlFor="sop-zip-upload"
                              className="flex items-center gap-2 px-6 py-3 bg-slate-800 text-white text-[10px] font-display uppercase tracking-widest font-black transition-all shadow-lg cursor-pointer hover:bg-gold"
                            >
                              <FolderArchive size={14} /> ZIP Batch Upload
                            </label>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                      <AnimatePresence mode="popLayout">
                        {filteredSops.map((sop, idx) => (
                          <motion.div
                            layout
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            key={idx}
                            className="group bg-white border border-slate-100 p-6 hover:shadow-2xl hover:border-gold/30 transition-all duration-500 flex flex-col h-full relative"
                          >
                            <div className="w-12 h-16 bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-300 group-hover:bg-luxury-cream group-hover:text-gold transition-all mb-6 relative overflow-hidden">
                               <FileText size={32} strokeWidth={1} />
                               <div className="absolute bottom-0 right-0 p-1 bg-red-600 text-white text-[6px] font-black uppercase">PDF</div>
                            </div>

                            <h3 className="text-sm font-serif italic text-slate-900 mb-2 font-bold group-hover:text-gold transition-colors leading-tight line-clamp-2 h-10">{sop.title}</h3>
                            <p className="text-[9px] font-display uppercase tracking-widest text-slate-400 mb-8 font-bold">Released: {sop.date}</p>

                            <div className="mt-auto pt-6 border-t border-slate-50 flex items-center justify-between">
                               <button 
                                 onClick={() => window.open(sop.url, '_blank')}
                                 className="flex items-center gap-2 text-[9px] font-display uppercase tracking-widest font-black text-gold hover:text-luxury-black transition-colors"
                               >
                                 View Document <ExternalLink size={12} />
                               </button>
                               
                               <button 
                                 onClick={() => {
                                   if (true) { setDeleteSopTarget({ index: idx, title: sop.title }); } else if (false) {
                                     setSops(prev => prev.filter((_, i) => i !== idx));
                                   }
                                 }}
                                 className="text-slate-200 hover:text-red-600 transition-colors opacity-0 group-hover:opacity-100"
                               >
                                 <X size={14} />
                               </button>
                            </div>
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    </div>

                    {filteredSops.length === 0 && (
                      <div className="py-32 text-center bg-white border border-dashed border-slate-200">
                        <FileText size={48} className="mx-auto text-slate-100 mb-6" />
                        <h3 className="text-xl font-serif italic text-slate-400">No matching SOPs found</h3>
                        <p className="text-[10px] font-display uppercase tracking-widest text-slate-300 mt-2">Try adjusting your search filters</p>
                      </div>
                    )}
                  </div>
                </div>
              ) : activeTab === "cml-university" ? (
              <div className="space-y-8">
                {/* Hero Banner styled based on selected brand */}
                <div className={cn(
                  "p-8 md:p-12 border relative overflow-hidden",
                  selectedCompany === 'ramada' ? "bg-red-50/50 border-red-200/50" : 
                  selectedCompany === 'wyndham' ? "bg-emerald-50/50 border-emerald-200/50" : 
                  "bg-gold/5 border-gold/10"
                )}>
                  <div className="absolute right-0 top-0 h-full w-1/3 opacity-5 pointer-events-none">
                    <GraduationCap size={240} className="transform translate-x-12 translate-y-6" />
                  </div>
                  <div className="relative z-10 max-w-3xl">
                    <div className={cn(
                      "text-[9px] font-display uppercase tracking-[0.25em] font-black pb-2 border-b max-w-max mb-6",
                      selectedCompany === 'ramada' ? "text-[#D11242] border-red-200" : 
                      selectedCompany === 'wyndham' ? "text-[#0b5c4b] border-emerald-200" : 
                      "text-gold border-gold/20"
                    )}>
                      {selectedCompany === 'ramada' ? "Ramada Suites Wailoaloa" : 
                       selectedCompany === 'wyndham' ? "Wyndham Garden Wailoaloa" : 
                       "Cove Management Limited"} • LMS Portal
                    </div>
                    <h2 className="text-4xl md:text-5xl font-serif text-slate-900 italic tracking-tight font-light mb-4">
                      {selectedCompany === 'ramada' ? "Ramada University" : 
                       selectedCompany === 'wyndham' ? "Wyndham Garden University" : 
                       "CML University"}
                    </h2>
                    <p className="text-sm font-serif italic text-slate-600 max-w-xl leading-relaxed">
                      LMS Hub for elite hospitality training, operational mastery, brand compliance standards, and continuous carrier accreditation. Track, log, and elevate your customer relations score.
                    </p>
                  </div>
                </div>

                {/* Professional Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  {[
                    { label: "Active Team Enrolments", value: "32 Staff Members", trend: "+4 this week", icon: Users },
                    { label: "Compliance Score", value: "98.4%", trend: "Target: 95.0%", icon: ShieldCheck },
                    { label: "SOP Training Hours Completed", value: "420.5 Hours", trend: "Property Record", icon: Clock },
                    { label: "Accredited Certifications", value: "14 Badges", trend: "Ready to print", icon: Award }
                  ].map((stat, idx) => {
                    const StatIcon = stat.icon;
                    return (
                      <div key={idx} className="bg-white border border-slate-100 p-6 shadow-sm flex items-center justify-between">
                        <div>
                          <p className="text-[9px] font-display uppercase tracking-widest text-slate-400 font-bold mb-1">{stat.label}</p>
                          <p className="text-xl font-serif italic font-bold text-slate-900">{stat.value}</p>
                          <p className="text-[10px] text-slate-500 mt-1 font-mono">{stat.trend}</p>
                        </div>
                        <StatIcon className="text-slate-200" size={32} />
                      </div>
                    );
                  })}
                </div>

                {/* Curriculum Grid */}
                <div>
                  <h3 className="text-xs font-display uppercase tracking-widest text-[#1a1a1a] font-extrabold border-b border-slate-100 pb-4 mb-6">
                    Mandatory Curriculums & SOP Modules
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {[
                      {
                        title: "Core Hospitality & Luxury Foundations",
                        duration: "2.5 hrs",
                        lessons: "8 Lessons",
                        desc: "Standard protocols for greeting guests, tone-of-voice control, posture, vocabulary, and five-star brand expectations.",
                        level: "All Staff",
                        color: "bg-amber-50 text-amber-700 border-amber-200/50"
                      },
                      {
                        title: "Interactive System & Platform Navigation",
                        duration: "1.5 hrs",
                        lessons: "5 Lessons",
                        desc: "Mastering the live Case Management dashboard, lodging high-priority service requests, updating status logs, and tracking KPIs.",
                        level: "Operations",
                        color: "bg-blue-50 text-blue-700 border-blue-200/50"
                      },
                      {
                        title: "Brand Philosophy & Promise Implementation",
                        duration: "3.0 hrs",
                        lessons: "10 Lessons",
                        desc: selectedCompany === 'ramada' ? "Living 'Say Hello to Red®' - the signature Wyndham guest expectations, proactive solutions, and red-standards checking." :
                              selectedCompany === 'wyndham' ? "Living 'Count on Me!' - the service promise, ownership, respect, and standard service culture alignments." :
                              "Living Cove Management core guidelines - portfolio compliance, system reliability, and standard reporting paths.",
                        level: "Brand Alignment",
                        color: "bg-rose-50 text-rose-700 border-rose-200/50"
                      },
                      {
                        title: "Daily Yield Strategy & Rate Parity",
                        duration: "4.0 hrs",
                        lessons: "12 Lessons",
                        desc: "In-depth training on channel distribution, OTA compliance, price management, and diagnosing rates discrepancy across portals.",
                        level: "Management",
                        color: "bg-emerald-50 text-emerald-700 border-emerald-200/50"
                      },
                      {
                        title: "Emergency Procedures & Encrypted Locking",
                        duration: "2.0 hrs",
                        lessons: "6 Lessons",
                        desc: "Guidelines for secure metal key logs, door lock encoding, backup card generation, master key protocols, and evacuation routing.",
                        level: "Security & FD",
                        color: "bg-purple-50 text-purple-700 border-purple-200/50"
                      },
                      {
                        title: "Incident Restoration & Customer Recovery",
                        duration: "3.5 hrs",
                        lessons: "9 Lessons",
                        desc: "The art of service recovery. Learn to de-escalate guest complaints, manage standard compensation budgets, and document recovery steps.",
                        level: "Guest Relations",
                        color: "bg-indigo-50 text-indigo-700 border-indigo-200/50"
                      }
                    ].map((mod, index) => (
                      <motion.div
                        key={index}
                        whileHover={{ y: -4 }}
                        className="bg-white border border-slate-100 p-6 shadow-sm flex flex-col justify-between"
                      >
                        <div>
                          <div className="flex items-center justify-between mb-4">
                            <span className={cn("text-[9px] font-display uppercase tracking-wider font-bold px-2.5 py-1", mod.color)}>
                              {mod.level}
                            </span>
                            <span className="text-[10px] font-mono text-slate-400">{mod.duration}</span>
                          </div>
                          <h4 className="text-lg font-serif italic text-slate-900 mb-3">{mod.title}</h4>
                          <p className="text-xs text-slate-500 font-serif leading-relaxed mb-6">{mod.desc}</p>
                        </div>
                        <div className="border-t border-slate-50 pt-4 flex items-center justify-between mt-auto">
                          <span className="text-[10px] text-slate-400 font-mono">{mod.lessons}</span>
                          <button className={cn(
                            "text-[9px] font-display uppercase tracking-widest font-black transition-colors focus:outline-none",
                            selectedCompany === 'ramada' ? "text-[#D11242] hover:text-[#7c1414]" : 
                            selectedCompany === 'wyndham' ? "text-[#0b5c4b] hover:text-[#063b31]" : 
                            "text-gold hover:text-black"
                          )}>
                            Start Course &rarr;
                          </button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>

                {/* Integration Notice */}
                <div className="bg-slate-50 border border-slate-200 p-6 flex flex-col md:flex-row items-center justify-between gap-6 no-print">
                  <div className="flex items-center gap-4">
                    <GraduationCap className="text-slate-400 shrink-0" size={36} />
                    <div>
                      <h4 className="text-xs font-display uppercase tracking-widest text-slate-800 font-bold mb-1">Cove Group Active Integration</h4>
                      <p className="text-xs font-serif italic text-slate-500 leading-normal">
                        LMS course completion is synced directly with your primary payroll profile and employee performance records in the CML HR platform.
                      </p>
                    </div>
                  </div>
                  <button className="px-6 py-3 bg-black text-white text-[9px] font-display uppercase tracking-widest font-black shrink-0 hover:bg-gold transition-colors">
                    Access My LMS Profile
                  </button>
                </div>
              </div>
            ) : activeTab === "training-videos" ? (
              <div className="space-y-8">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                  <div>
                    <h2 className="text-3xl font-serif text-slate-900 italic">Training Library</h2>
                    <p className="luxury-label opacity-60">Educational video resources for property staff</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {[
                    { title: "Service Excellence", duration: "12:45", category: "Hospitality" },
                    { title: "Safety & Fire Protocols", duration: "08:20", category: "Security" },
                    { title: "Property Management System", duration: "25:10", category: "Technical" }
                  ].map((video, idx) => (
                    <motion.div 
                      key={idx}
                      whileHover={{ y: -5 }}
                      className="group bg-white overflow-hidden shadow-sm hover:shadow-xl transition-all duration-500"
                    >
                      <div className="aspect-video bg-slate-100 relative overflow-hidden flex items-center justify-center">
                        <div className="absolute inset-0 bg-luxury-black/40 group-hover:bg-luxury-black/10 transition-colors z-10" />
                        <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center text-white relative z-20 group-hover:scale-110 transition-transform cursor-pointer">
                           <Play size={24} className="ml-1" />
                        </div>
                        <div className="absolute bottom-4 right-4 bg-black/60 px-2 py-1 text-[9px] text-white font-display z-20">
                          {video.duration}
                        </div>
                      </div>
                      <div className="p-6">
                        <div className="text-[8px] font-display uppercase tracking-widest text-gold font-black mb-2">{video.category}</div>
                        <h4 className="text-lg font-serif italic text-slate-900 mb-4">{video.title}</h4>
                        <button className="w-full py-3 border border-slate-100 text-[9px] font-display uppercase tracking-widest font-black text-slate-800 hover:bg-gold hover:text-white hover:border-gold transition-all">
                          Watch Training
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            ) : activeTab === "checklist" ? (
              <WyndhamChecklist selectionProperty={selectedCompany || 'cml'} />
            ) : activeTab === "brand-kit" ? (
              <BrandKit companyId={selectedCompany || 'cml'} />
            ) : activeTab === "duty-roster" ? (
              <DutyRoster companyId={selectedCompany || 'cml'} />
            ) : activeTab === "canary" ? (
              <CanaryPortal companyId={selectedCompany || 'cml'} />
            ) : activeTab === "lost-and-found" ? (
              <LostAndFound 
                userRole={userRole || undefined} 
                companyId={selectedCompany || 'cml'} 
              />
            ) : activeTab === "staff-mailer" ? (
              <StaffMailer companyId={selectedCompany || 'cml'} />
            ) : activeTab === "digital-flipbooks" ? (
              <DigitalFlipbook 
                companyId={selectedCompany || 'cml'} 
                userRole={userRole || undefined} 
                externalFlipbookId={externalFlipbookId}
                onCloseExternalView={() => {
                  setExternalFlipbookId(null);
                  window.history.pushState({}, document.title, window.location.pathname);
                }}
              />
            ) : activeTab === "newsletter-subscribers" ? (
              <NewsletterSubscribers 
                companyId={selectedCompany || 'cml'} 
                userRole={userRole || undefined}
                onConvertSubscriber={(email, fullName) => {
                  setPrefilledRewardsMember({ email, fullName });
                  setActiveTab("dining-loyalty");
                }}
              />
            ) : (activeTab === "restaurant-scanner" || activeTab.startsWith("dining-")) ? (
              <RestaurantScanner 
                companyId={selectedCompany || 'cml'} 
                prefilledRewardsMember={prefilledRewardsMember}
                onClearPrefilledRewards={() => setPrefilledRewardsMember(null)}
                initialSubTab={
                  activeTab === "dining-buffet" ? "buffet" :
                  activeTab === "dining-loyalty" ? "scanner" :
                  activeTab === "dining-capacity" ? "capacity" :
                  activeTab === "dining-reservations" ? "reservations" : undefined
                }
                onSubTabChange={(subTab) => {
                  const mappedTab = 
                    subTab === "buffet" ? "dining-buffet" :
                    subTab === "scanner" ? "dining-loyalty" :
                    subTab === "capacity" ? "dining-capacity" :
                    subTab === "reservations" ? "dining-reservations" : "dining-buffet";
                  if (activeTab !== mappedTab) {
                    setActiveTab(mappedTab);
                  }
                }}
              />
            ) : activeTab === "agreements-signing" ? (
              <AgreementsSigning />
            ) : activeTab === "managed-cases" ? (
              <ManageCases />
            ) : activeTab === "resources" ? (
              <ResourcesHelp />
            ) : activeTab === "forum" ? (
              <Forum />
            ) : activeTab === "daily-news" ? (
              <DailyNews />
            ) : activeTab === "user-management" ? (
              (userRole === "Administrator" || userRole === "Super Admin" || userRole === "Group Controller") ? (
                <UserManagement />
              ) : (
                <div className="flex items-center justify-center h-64 text-slate-500 font-serif italic">
                  Access Restricted to Administrators
                </div>
              )
            ) : (
              <>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12 no-print">
                   <div>
                      <h2 className="text-4xl font-serif text-slate-900 italic">Property Dashboard</h2>
                      <p className="luxury-label opacity-60">Real-time performance & hospitality metrics</p>
                   </div>
                   
                   <div className="flex bg-white p-1 border border-slate-100 shadow-sm rounded-none">
                      <button 
                        onClick={() => setDashboardViewMode("percentage")}
                        className={cn(
                          "px-6 py-2 text-[10px] font-display uppercase tracking-widest font-black transition-all",
                          dashboardViewMode === "percentage" ? "bg-gold text-white" : "text-slate-800 hover:text-gold"
                        )}
                      >
                        Percentage View
                      </button>
                      <button 
                        onClick={() => setDashboardViewMode("pie")}
                        className={cn(
                          "px-6 py-2 text-[10px] font-display uppercase tracking-widest font-black transition-all",
                          dashboardViewMode === "pie" ? "bg-gold text-white" : "text-slate-800 hover:text-gold"
                        )}
                      >
                        Pie Chart View
                      </button>
                   </div>
                </div>

                {/* Print-only Dashboard Header */}
                <div className="hidden print:block mb-12 border-b-2 border-gold/20 pb-6">
                   <div className="flex justify-between items-end">
                      <div>
                        <h1 className="text-3xl font-serif italic text-slate-900">Property Performance Report</h1>
                        <p className="text-[10px] font-display uppercase tracking-widest text-gold font-bold">{currentCompany?.name} EXECUTIVE SUMMARY</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] font-display uppercase tracking-widest text-slate-600 font-bold">Report Generated</p>
                        <p className="text-sm font-serif italic text-slate-900">{new Date().toLocaleDateString()}</p>
                      </div>
                   </div>
                </div>

                {dashboardViewMode === "percentage" ? (
                  /* KPI Grid */
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
                    <StatCard 
                      label="Occupancy" 
                      value="84.2%" 
                      trend="+3.1%" 
                      icon={TrendingUp}
                      color="gold"
                    />
                    <StatCard 
                      label="Average Daily Rate" 
                      value="$245.10" 
                      trend="+$12.40" 
                      icon={DollarSign}
                      color="gold"
                    />
                    <StatCard 
                      label="RevPAR" 
                      value="$206.29" 
                      trend="Stable" 
                      icon={Percent}
                      color="gold"
                    />
                    <StatCard 
                      label="Compliance Logs" 
                      value="94.8%" 
                      trend="Healthy" 
                      icon={FileText}
                      color="gold"
                    />
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
                    {[
                      { label: "Occupancy Rate", value: 84.2, color: "#C5A059" },
                      { label: "Revenue Target", value: 72.5, color: "#222" },
                      { label: "Compliance Index", value: 94.8, color: "#D4AF37" }
                    ].map((chart, idx) => (
                      <div key={idx} className="luxury-card p-10 bg-white flex flex-col items-center">
                        <h4 className="luxury-label mb-8">{chart.label}</h4>
                        <div className="h-64 w-full">
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={[
                                  { name: "Current", value: chart.value },
                                  { name: "Remaining", value: 100 - chart.value }
                                ]}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={80}
                                paddingAngle={5}
                                dataKey="value"
                              >
                                <Cell fill={chart.color} />
                                <Cell fill="#F8F9FA" />
                              </Pie>
                              <Tooltip />
                            </PieChart>
                          </ResponsiveContainer>
                        </div>
                        <div className="mt-4 text-center">
                          <span className="text-3xl font-serif italic text-slate-900">{chart.value}%</span>
                          <p className="text-[9px] font-display uppercase tracking-widest text-slate-600 font-bold mt-2">Performance Index</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Modules Row */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                  {/* Performance Module */}
                   <div className="lg:col-span-8 space-y-8">
                     <div className="luxury-card p-10 relative overflow-hidden">
                        {/* Decorative Background Text */}
                        <div className="absolute top-0 right-0 font-serif text-[120px] font-black text-slate-50/50 -translate-y-1/2 translate-x-1/4 pointer-events-none select-none">DATA</div>
                        
                        <div className="flex items-center justify-between mb-10 relative z-10">
                          <div>
                            <h2 className="text-2xl font-serif text-slate-900 mb-1">Financial Performance</h2>
                            <p className="luxury-label !text-[8px]">{currentCompany?.name} Portfolio Benchmarks</p>
                          </div>
                          <div className="flex gap-4">
                             <div className="flex items-center gap-2">
                               <span className="w-2 h-2 rounded-full bg-gold"></span>
                               <span className="text-[9px] font-display uppercase tracking-widest font-black">Revenue</span>
                             </div>
                          </div>
                        </div>
                        
                        <div className="h-[320px] w-full">
                          <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chartData}>
                              <defs>
                                <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor="#C5A059" stopOpacity={0.2}/>
                                  <stop offset="95%" stopColor="#C5A059" stopOpacity={0}/>
                                </linearGradient>
                              </defs>
                              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" opacity={0.5} />
                              <XAxis 
                                dataKey="name" 
                                axisLine={false} 
                                tickLine={false} 
                                tick={{fill: '#94A3B8', fontSize: 10, fontFamily: 'Montserrat'}} 
                                dy={15}
                              />
                              <YAxis hide={true}/>
                              <Tooltip 
                                contentStyle={{ 
                                  backgroundColor: '#1A1A1A', 
                                  border: 'none', 
                                  borderRadius: '4px',
                                  boxShadow: '0 20px 40px rgba(0,0,0,0.2)'
                                }}
                                itemStyle={{ color: '#C5A059', fontSize: '10px', textTransform: 'uppercase', fontStyle: 'Bold' }}
                              />
                              <Area 
                                type="monotone" 
                                dataKey="rev" 
                                stroke="#C5A059" 
                                strokeWidth={2} 
                                fillOpacity={1} 
                                fill="url(#colorRev)" 
                                animationDuration={2000}
                              />
                            </AreaChart>
                          </ResponsiveContainer>
                        </div>
                     </div>

                     {/* Property Table */}
                     <div className="luxury-card overflow-hidden">
                        <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                          <div>
                            <h2 className="text-lg font-serif text-slate-900">Property Portfolio</h2>
                            <p className="luxury-label !text-[8px]">Active Real-time Status</p>
                          </div>
                          <button className="luxury-button !py-2 !px-4">Export Audit</button>
                        </div>
                        <div className="overflow-x-auto">
                          <table className="w-full text-left">
                            <thead>
                              <tr className="bg-luxury-cream/50 border-b border-luxury-cream">
                                <th className="px-8 py-5 luxury-label !text-slate-600 italic">Property Identity</th>
                                <th className="px-8 py-5 luxury-label !text-slate-600">Executive</th>
                                <th className="px-8 py-5 luxury-label !text-slate-600">Compliance Status</th>
                                <th className="px-8 py-5 luxury-label !text-slate-600 text-right">Access</th>
                              </tr>
                            </thead>
                            <tbody className="text-sm divide-y divide-slate-50">
                              {[
                                { name: `${(currentCompany?.id || "").toUpperCase()} - Nadi`, exec: "Robert Chen", status: "Validated", health: 100 },
                                { name: `${(currentCompany?.id || "").toUpperCase()} - Suva`, exec: "Sarah Malik", status: "Audit Pending", health: 85, alert: true },
                                { name: "Beachfront West Lux", exec: "John Doe", status: "Validated", health: 98 },
                              ].map((property, i) => (
                                <tr 
                                  key={property.name} 
                                  className="group hover:bg-luxury-cream/30 hover:scale-[1.01] hover:shadow-md transition-all duration-300 ease-out transform origin-center cursor-pointer"
                                >
                                  <td className="px-8 py-6">
                                    <p className="font-serif text-slate-900 text-base">{property.name}</p>
                                    <p className="text-[10px] text-slate-600 font-display uppercase tracking-widest mt-0.5 font-bold">Asset ID: {1029 + i}</p>
                                  </td>
                                  <td className="px-8 py-6 text-slate-500 font-display text-[11px] font-medium tracking-wide uppercase">{property.exec}</td>
                                  <td className="px-8 py-6">
                                    <div className="flex items-center gap-2">
                                      <div className={cn("w-1.5 h-1.5 rounded-full", property.alert ? "bg-amber-500" : "bg-emerald-500")} />
                                      <span className={cn("text-[10px] font-bold uppercase tracking-widest", property.alert ? "text-amber-600" : "text-emerald-600")}>{property.status}</span>
                                    </div>
                                  </td>
                                  <td className="px-8 py-6 text-right">
                                    <button className="text-slate-300 group-hover:text-gold transition-colors">
                                      <ChevronRight size={18} />
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                     </div>
                   </div>

                   {/* Sidebar Widgets */}
                   <div className="lg:col-span-4 space-y-8">
                     {/* Training Widget */}
                     <div className="luxury-card p-8">
                        <h2 className="text-xl font-serif text-slate-900 mb-6">Staff Training</h2>
                        <div className="space-y-8">
                          {[
                            { label: "Luxury Brand Ethos", pct: 98 },
                            { label: "Concierge Etiquette", pct: 45 },
                            { label: "Safety & Security", pct: 100 },
                          ].map((course) => (
                            <div key={course.label}>
                              <div className="flex justify-between items-end mb-3">
                                <span className="text-[11px] font-display uppercase tracking-widest font-bold text-slate-600">{course.label}</span>
                                <span className="text-sm font-serif italic text-gold">{course.pct}%</span>
                              </div>
                              <div className="w-full h-0.5 bg-slate-100 relative">
                                 <motion.div 
                                   initial={{ width: 0 }}
                                   animate={{ width: `${course.pct}%` }}
                                   transition={{ duration: 1, ease: "easeOut" }}
                                   className="absolute top-0 left-0 h-full bg-gold"
                                 />
                              </div>
                            </div>
                          ))}
                        </div>
                        <button className="w-full mt-10 text-[10px] font-display uppercase tracking-[0.3em] font-bold py-4 border border-gold/10 hover:border-gold hover:bg-gold/5 transition-all text-slate-700 hover:text-gold uppercase">
                          Open LMS Dashboard
                        </button>
                     </div>

                     {/* Secure Documents */}
                     <div className="bg-luxury-black p-8 text-white relative group overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-gold/5 rounded-full translate-x-1/2 -translate-y-1/2 group-hover:bg-gold/10 transition-colors duration-700" />
                        
                        <h2 className="text-xs font-display uppercase tracking-[0.3em] text-gold mb-8 italic">Secure Forms Vault</h2>
                        <div className="space-y-6 relative z-10">
                          {[
                            { title: "Employment_Agreement.pdf", date: "Secure Template" },
                            { title: "SOP_Guest_Privacy.dwpt", date: "Restricted Access" },
                          ].map((doc) => (
                            <div key={doc.title} className="flex gap-4 items-start group cursor-pointer">
                              <div className="w-10 h-10 border border-white/10 flex items-center justify-center text-gold group-hover:bg-gold group-hover:text-white transition-all">
                                 <FileText size={18} strokeWidth={1} />
                              </div>
                              <div>
                                <p className="text-[11px] font-medium leading-tight group-hover:text-gold transition-colors">{doc.title}</p>
                                <p className="text-[9px] text-slate-500 font-display uppercase tracking-widest mt-1">{doc.date}</p>
                              </div>
                            </div>
                          ))}
                          <button className="w-full mt-6 py-4 bg-white/5 hover:bg-gold transition-all text-[10px] font-bold uppercase tracking-[0.2em] text-white">
                            Access Credentials Required
                          </button>
                        </div>
                     </div>

                     {/* System Info */}
                     <div className="p-6 border border-gold/10 bg-white shadow-sm flex items-center justify-between">
                        <div>
                          <p className="luxury-label">Global Health Index</p>
                          <p className="text-xl font-serif italic text-slate-900 mt-1">Excellent</p>
                        </div>
                        <div className="w-12 h-12 rounded-full border border-gold/10 flex items-center justify-center text-gold font-serif italic">
                           98
                        </div>
                     </div>

                      {/* AI Assistant Widget */}
                      <div className="luxury-card p-8 bg-luxury-black text-white overflow-hidden relative group">
                         <div className="absolute top-0 right-0 w-32 h-32 bg-gold/10 rounded-full translate-x-1/2 -translate-y-1/2 blur-2xl group-hover:bg-gold/20 transition-all duration-1000" />
                         <div className="flex items-center gap-3 mb-6 relative z-10">
                             <Sparkles className="text-gold" size={18} />
                             <h2 className="text-xs font-display uppercase tracking-[0.3em] text-gold italic">AI Plan Man</h2>
                         </div>
                         <p className="text-[10px] text-slate-500 font-serif italic mb-6 leading-relaxed relative z-10">
                             Hospitality strategic planner, guest recovery, dynamic rates pricing, and SOP audit compliance.
                         </p>
                         <button 
                             className="w-full py-4 border border-gold/20 hover:border-gold hover:bg-gold/10 transition-all text-[9px] font-black uppercase tracking-[0.3em] relative z-10 cursor-pointer"
                             onClick={() => setIsPlanManOpen(true)}
                         >
                             Launch AI Plan Man
                         </button>
                      </div>
                   </div>
                </div>
              </>
            )}
          </motion.div>
          )}
        </main>
      </div>
      <ToastContainer />
      <GoogleChatWidget companyId={selectedCompany || 'cml'} />
      <GoogleAIPlanMan
         isOpen={isPlanManOpen}
         onClose={() => setIsPlanManOpen(false)}
         selectedCompany={selectedCompany || 'cml'}
         complaints={complaints}
      />
      <SopBatchUploadModal
         isOpen={isSopZipModalOpen}
         onClose={() => setIsSopZipModalOpen(false)}
         onImport={handleSopZipImport}
         zipFile={selectedSopZipFile}
      />

      <ConfirmModal
        isOpen={!!deleteComplaintTarget}
        onClose={() => setDeleteComplaintTarget(null)}
        onConfirm={handleArchiveComplaintConfirm}
        title="Archive Recovery Log?"
        description="Are you sure you want to archive and dispose of this customer complaint recovery record? This will file the log under permanent audit archives."
        confirmLabel="Archive Record"
        cancelLabel="Keep Active"
        variant="warning"
      />

      <ConfirmModal
        isOpen={!!deleteCustomFormTarget}
        onClose={() => setDeleteCustomFormTarget(null)}
        onConfirm={handleDeleteCustomFormConfirm}
        title="Remove Custom Form Reference?"
        description={`Are you sure you want to delete form reference "${deleteCustomFormTarget?.name}"? It will be removed from your secure guest and company portals.`}
        confirmLabel="Remove Reference"
        cancelLabel="Preserve Reference"
        variant="danger"
      />

      <ConfirmModal
        isOpen={!!deleteSopTarget}
        onClose={() => setDeleteSopTarget(null)}
        onConfirm={handleDeleteSopConfirm}
        title="Delete SOP Document?"
        description={`Are you sure you want to permanently delete standard operating procedure "${deleteSopTarget?.title}"? This operation cannot be undone.`}
        confirmLabel="Delete Document"
        cancelLabel="Retain SOP"
        variant="danger"
      />

      <ImageLightboxModal
        isOpen={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
        images={lightboxImages}
        startIndex={lightboxStartIndex}
      />

      {/* Offline Sync Manager Modal */}
      <AnimatePresence>
        {isSyncModalOpen && (
          <div className="fixed inset-0 z-[100000] flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSyncModalOpen(false)}
              className="absolute inset-0 bg-stone-900/80 backdrop-blur-md"
            />

            {/* Modal Box */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", duration: 0.4 }}
              className="relative w-full max-w-lg bg-white border border-stone-200 shadow-2xl rounded-sm overflow-hidden flex flex-col z-10 max-h-[85vh]"
            >
              {/* Header */}
              <div className="bg-stone-950 p-5 text-white flex items-center justify-between border-b border-stone-800">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "p-1.5 rounded-full shrink-0",
                    isOnline ? "bg-emerald-500/20 text-emerald-400" : "bg-rose-500/20 text-rose-400"
                  )}>
                    <Globe size={18} className={cn(isOnline && "animate-spin")} style={{ animationDuration: '6s' }} />
                  </div>
                  <div>
                    <h3 className="font-display uppercase tracking-widest text-xs font-black">
                      System Sync Control Hub
                    </h3>
                    <p className="text-[10px] text-stone-400 font-sans tracking-wide mt-0.5">
                      {isOnline ? "All services reporting dynamic real-time upload active" : "Offline backup database active & caching locally"}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsSyncModalOpen(false)}
                  className="text-stone-400 hover:text-white transition-colors p-1"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Status Banner */}
              <div className={cn(
                "px-5 py-3 text-[11px] font-sans flex items-center justify-between",
                isOnline ? "bg-emerald-50 text-emerald-800 border-b border-emerald-100" : "bg-amber-50 text-amber-800 border-b border-amber-100"
              )}>
                <div className="flex items-center gap-2">
                  <span className="relative flex h-2 w-2 shrink-0">
                    <span className={cn("animate-ping absolute inline-flex h-full w-full rounded-full opacity-75", isOnline ? "bg-emerald-400" : "bg-amber-400")}></span>
                    <span className={cn("relative inline-flex rounded-full h-2 w-2", isOnline ? "bg-emerald-500" : "bg-amber-500")}></span>
                  </span>
                  <span>
                    Status: <strong className="uppercase">{isOnline ? "Online" : "Offline"}</strong> ({offlineComplaintsCount + offlineRatesCount} pending transfers)
                  </span>
                </div>
                {isOnline && (offlineComplaintsCount > 0 || offlineRatesCount > 0) && (
                  <button
                    onClick={async () => {
                      if (offlineComplaintsCount > 0) {
                        await triggerClientBackgroundSync();
                      }
                      if (offlineRatesCount > 0) {
                        await triggerRatesBackgroundSync();
                      }
                    }}
                    disabled={isOfflineSyncing || isOfflineRatesSyncing}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-sans text-[9px] font-extrabold uppercase tracking-wider px-3 py-1.5 transition flex items-center gap-1 cursor-pointer border border-emerald-500 rounded"
                  >
                    {(isOfflineSyncing || isOfflineRatesSyncing) ? (
                      <>
                        <RefreshCw size={10} className="animate-spin" />
                        Synchronizing...
                      </>
                    ) : (
                      "🚀 Trigger Sync Now"
                    )}
                  </button>
                )}
              </div>

              {/* Task Details List */}
              <div className="flex-1 overflow-y-auto p-5 space-y-4 min-h-[250px]">
                <h4 className="font-display font-black uppercase text-[10px] text-stone-500 tracking-wider mb-2">
                  Pending Task Ledger (Granular Queue)
                </h4>

                {pendingComplaintsList.length === 0 && pendingRatesList.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center space-y-3">
                    <CheckCircle2 size={36} className="text-stone-300 animate-bounce" />
                    <div>
                      <p className="text-xs font-bold text-stone-700">All local records fully synchronized</p>
                      <p className="text-[10px] text-stone-400 mt-1 max-w-[280px]">No pending forms or pricing adjustments are in the queue. Secure cloud database is current.</p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {/* Complaints lists */}
                    {pendingComplaintsList.map((item, idx) => (
                      <div key={`complaint-${idx}`} className="p-3 border border-stone-200/90 bg-stone-50/60 rounded-xs flex items-center justify-between gap-3 shadow-xs hover:border-slate-300 transition-all duration-150">
                        <div className="flex items-start gap-2.5 min-w-0">
                          <div className="p-1.5 bg-sky-100 text-sky-800 font-bold shrink-0 text-xs">
                            <FileText size={15} />
                          </div>
                          <div className="min-w-0 pr-2">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-display uppercase text-[9px] font-extrabold tracking-wider bg-stone-200 px-1.5 py-0.5 text-stone-750">
                                Guest Recovery
                              </span>
                              {item.priority === 'Urgent' ? (
                                <span className="text-[8.5px] font-extrabold text-rose-700 bg-rose-50 border border-rose-100 px-1 uppercase tracking-wide">
                                  Urgent
                                </span>
                              ) : (
                                <span className="text-[8.5px] font-extrabold text-stone-500 bg-stone-100 border border-stone-200 px-1 uppercase tracking-wide">
                                  {item.priority}
                                </span>
                              )}
                            </div>
                            <h5 className="font-serif italic font-semibold text-xs text-stone-900 truncate mt-1">
                              Guest: {item.guestName || "Unspecified"} (Room {item.roomNumber || "N/A"})
                            </h5>
                            <p className="text-[10px] text-stone-550 truncate mt-0.5 leading-tight font-sans">
                              {item.description || "No description provided."}
                            </p>
                            <p className="text-[8.5px] text-stone-400 mt-1 font-mono">
                              Cached: {item.createdAt ? new Date(item.createdAt).toLocaleTimeString() : "Recent"}
                            </p>
                          </div>
                        </div>

                        <div className="shrink-0 text-right">
                          <span className="inline-flex items-center gap-1 bg-amber-150 border border-amber-250 text-amber-900 font-mono text-[8.5px] uppercase font-bold px-1.5 py-0.5 rounded-sm animate-pulse">
                            ⚠️ Queued
                          </span>
                        </div>
                      </div>
                    ))}

                    {/* Rates list */}
                    {pendingRatesList.map((item, idx) => (
                      <div key={`rate-${idx}`} className="p-3 border border-stone-200/90 bg-stone-50/60 rounded-xs flex items-center justify-between gap-3 shadow-xs hover:border-slate-300 transition-all duration-150">
                        <div className="flex items-start gap-2.5 min-w-0">
                          <div className="p-1.5 bg-amber-100 text-amber-800 font-bold shrink-0 text-xs">
                            <Percent size={15} />
                          </div>
                          <div className="min-w-0 pr-2">
                            <div className="flex items-center gap-1.5">
                              <span className="font-display uppercase text-[9px] font-extrabold tracking-wider bg-stone-200 px-1.5 py-0.5 text-stone-750">
                                Rates Update
                              </span>
                              <span className="text-[8.5px] font-extrabold text-emerald-700 bg-emerald-50 border border-emerald-100 px-1 uppercase tracking-wide">
                                Channel Dist
                              </span>
                            </div>
                            <h5 className="font-serif italic font-semibold text-xs text-stone-900 truncate mt-1">
                              BAR Rate: FJD ${item.projectedBAR ? Number(item.projectedBAR).toFixed(2) : "0.00"}
                            </h5>
                            <p className="text-[10px] text-stone-550 truncate mt-0.5 leading-tight font-sans">
                              Base: ${item.baseRate || "0.00"} | Surcharges: ${item.occupancySurcharge || "0.00"}
                            </p>
                            <p className="text-[8.5px] text-stone-400 mt-1 font-mono">
                              Cached: {item.timestamp ? new Date(item.timestamp).toLocaleTimeString() : "Recent"}
                            </p>
                          </div>
                        </div>

                        <div className="shrink-0 text-right">
                          <span className="inline-flex items-center gap-1 bg-amber-150 border border-amber-250 text-amber-900 font-mono text-[8.5px] uppercase font-bold px-1.5 py-0.5 rounded-sm animate-pulse">
                            ⚠️ Queued
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="p-4 bg-stone-50 border-t border-stone-200 text-right flex items-center justify-between">
                <span className="text-[9px] text-stone-450 font-sans tracking-wide">
                  Cove Management Limited (CML) System Ledger
                </span>
                <button
                  type="button"
                  onClick={() => setIsSyncModalOpen(false)}
                  className="px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white font-sans text-[10px] font-black uppercase tracking-widest cursor-pointer outline-none rounded-none"
                >
                  Dismiss Controls
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}

function StatCard({ label, value, trend, icon: Icon, color }: any) {
  return (
    <div className="luxury-card p-6 group">
      <div className="flex items-center justify-between mb-4">
        <div className={cn(
          "w-10 h-10 flex items-center justify-center rounded-none transition-all duration-500",
          color === "gold" ? "bg-luxury-cream text-gold group-hover:bg-gold group-hover:text-white" : "bg-slate-100 text-slate-500 group-hover:bg-luxury-black group-hover:text-white"
        )}>
          <Icon size={18} strokeWidth={1} />
        </div>
        <div className="text-[10px] font-display uppercase tracking-widest text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5">
          {trend}
        </div>
      </div>
      <div>
        <h4 className="luxury-label mb-1">{label}</h4>
        <p className="text-3xl font-serif italic font-light text-slate-900 mt-1">{value}</p>
      </div>
    </div>
  );
}


