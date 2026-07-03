import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  FileText, 
  CheckCircle2, 
  Clock, 
  Eye, 
  Send, 
  User, 
  Calendar, 
  TrendingUp, 
  Users, 
  Layers, 
  PenTool, 
  Download, 
  Mail, 
  Search, 
  Filter, 
  Lock, 
  Unlock, 
  ShieldCheck, 
  Upload, 
  ChevronRight, 
  ChevronDown,
  Info,
  DollarSign,
  Briefcase,
  AlertCircle,
  Plus,
  Trash2,
  Copy,
  Check,
  Building,
  MapPin,
  Camera,
  Activity,
  FileCheck2,
  ExternalLink,
  MessageSquare,
  Award,
  LayoutGrid,
  List,
  Columns,
  Printer
} from "lucide-react";
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
import { cn } from "../lib/utils";

// --- THEME COLORS ---
// Navy Blue: #0B1C33 (very deep elegant navy)
// Gold: #C5A02D (sophisticated gold)
// Cream background: #FDFBF7 (light ivory)
// Slate / Off-black text: #1A2536

interface AuditLog {
  id: string;
  action: string;
  timestamp: string;
  user: string;
  ip: string;
  browser: string;
  device: string;
  location?: string;
}

interface Agreement {
  id: string;
  title: string;
  templateType: string;
  status: "Draft" | "Sent" | "Viewed" | "Awaiting Signature" | "Signed" | "Completed" | "Expired";
  ownerName: string;
  ownerCompany: string;
  ownerEmail: string;
  ownerPhone: string;
  hotelName: string;
  hotelAddress: string;
  inventory: string;
  managementFee: string;
  techFee: string;
  initialTerm: string;
  renewalTerm: string;
  createdDate: string;
  viewedDate?: string;
  ownerSignedDate?: string;
  managerSignedDate?: string;
  completedDate?: string;
  version: string;
  facilities: string[];
  ownerSignature?: {
    method: "draw" | "type" | "upload";
    data: string;
    signedBy: string;
    title: string;
    date: string;
  };
  managerSignature?: {
    signature: string;
    signedBy: string;
    title: string;
    date: string;
  };
  auditTrail: AuditLog[];
  supportingDocs: { id: string; name: string; size: string; date: string }[];
  ownerDetails?: string;
  managerDetails?: string;
  franchiseAgreement?: string;
  developmentType?: string;
  rentalProgram?: string;
  milestoneDates?: string;
  ffeReserve?: string;
  sinkingFund?: string;
  ownerResponsibilities?: string;
  currency?: string;
  ownerAddress?: string;
  hotelBrand?: string;
  proposedHotelName?: string;
}

const INITIAL_AGREEMENTS: Agreement[] = [
  {
    id: "CML-AGR-2026-001",
    title: "Letter of Intent (LOI) – Ramada Plaza & Suites Nadi",
    templateType: "Hotel Management LOI",
    status: "Awaiting Signature",
    ownerName: "Charles",
    ownerCompany: "Koro Fiji-Nadi Bay Sands Investment Limited",
    ownerEmail: "digitalmedia@cml.com.fj",
    ownerPhone: "+679 672 8885",
    hotelName: "Ramada Plaza by Wyndham & Suites",
    hotelAddress: "Lot 2 Northern Press Rd, Martintar, Nadi Fiji",
    inventory: "88 Apartments & 210 hotel rooms (Total 298 Keys)",
    managementFee: "20% of Gross Operating Profit (GOP)",
    techFee: "US$15,000 payable upon contract execution",
    initialTerm: "10 Years from Opening Date",
    renewalTerm: "One (1) further term of Ten (10) Operating Years",
    createdDate: "2026-06-25 10:15",
    viewedDate: "2026-07-01 14:22",
    version: "1.0",
    facilities: [
      "Fully fitted 88 Apartments with 210 key hotel room as per brand requirements",
      "Fully fitted Kitchen, Restaurant & Bar and Dining area to meet brand standard",
      "Fully fitted branded Front Office Reception as per brand standards",
      "Designed lobby and Guest Luggage Room",
      "Car parking space",
      "Maintenance Room",
      "Fully functional Administration Office including Manager’s offices",
      "Guest waiting Lounge Area",
      "Swimming Pool and fully equipped pump room",
      "Ground Floor Dining area",
      "Outdoor guest Male and Female shower and toilets at the deck area",
      "Recommended Brand quality silent power generator with Automatic changeover control system",
      "Water pressuring pump system both installed on ground floor and rooftop water tank system",
      "Fully equipped System Server Room including Servers with software to cater for IPTV Sky Channel & in room movie system, room and property Phones, Hotel PMS, CCTV control, Data Protection Firewall, Vingcard room door lock key control system",
      "Staff Room and Staff area, toilet and shower",
      "Branded and fully functional lift with emergency rescue device installed",
      "Fully functional fire protection system, heat & smoke detectors, extinguishers and fire hose requirements as per local authorities",
      "Linen rooms with storage space at all levels",
      "Fully functional pressured Instant Hot water supply system for the entire building",
      "Standard Wall paintings and coverings",
      "Fully equipped and functional water storage tanks for fresh water supply to the entire building",
      "Fully functional high floor Bar, Restaurant, Kitchen and Dining",
      "Fully functional Conference room to handle around 350 people",
      "Conference break-out meeting rooms at least 2 to handle 30pax in room",
      "Entire property network and Wifi setup including all hardware",
      "Vingcard door lock system for guest rooms and office doors",
      "Concierge/Porter desk",
      "Meet & Greet guest lobby for guest pickup and drop off",
      "Proper Rubbish bin storage area with bins",
      "Disable Toilet and shower room",
      "Fully Functional Spa and Fitness Center",
      "Maids Stations on each level",
      "Amenity storage Room",
      "Kitchen Dry Storage Room",
      "Kitchen Freezer Room and Cooler Room",
      "Beer Cooler Room",
      "Maintenance Storage Rooms",
      "Maintenance working area",
      "Property Guest Transporting Vehicle",
      "Gym",
      "Spa",
      "Shop"
    ],
    supportingDocs: [
      { id: "doc-1", name: "Land_Title_Koro_Fiji.pdf", size: "2.4 MB", date: "2026-06-25" },
      { id: "doc-2", name: "Wyndham_Approval_Letter.pdf", size: "1.1 MB", date: "2026-06-26" }
    ],
    auditTrail: [
      {
        id: "log-1",
        action: "Agreement Document Drafted",
        timestamp: "2026-06-25 10:15",
        user: "Admin (Cove Management)",
        ip: "122.102.112.5",
        browser: "Chrome v124 (MacOS)",
        device: "Desktop",
        location: "Singapore Headquarters"
      },
      {
        id: "log-2",
        action: "Sent for Signature to Owner",
        timestamp: "2026-06-25 11:30",
        user: "Admin (Cove Management)",
        ip: "122.102.112.5",
        browser: "Chrome v124 (MacOS)",
        device: "Desktop",
        location: "Singapore Headquarters"
      },
      {
        id: "log-3",
        action: "Document Viewed by Owner",
        timestamp: "2026-07-01 14:22",
        user: "Charles",
        ip: "118.232.44.82",
        browser: "Safari Mobile (iOS)",
        device: "iPad Pro",
        location: "Nadi, Fiji"
      }
    ]
  },
  {
    id: "CML-AGR-2026-002",
    title: "Technical Services Agreement (TSA) – Wyndham Garden Wailoaloa",
    templateType: "Technical Services Agreement",
    status: "Completed",
    ownerName: "Charles",
    ownerCompany: "Koro Fiji-Nadi Bay Sands Investment Limited",
    ownerEmail: "digitalmedia@cml.com.fj",
    ownerPhone: "+679 672 8885",
    hotelName: "Wyndham Garden Wailoaloa Beach",
    hotelAddress: "Lot 3 Wailoaloa Beach Road, Nadi, Fiji",
    inventory: "120 Key Select-Service Resort",
    managementFee: "2.5% of Gross Rooms Revenue",
    techFee: "US$20,000 upfront",
    initialTerm: "5 Years",
    renewalTerm: "5 Years by mutual agreement",
    createdDate: "2026-05-10 09:00",
    viewedDate: "2026-05-12 11:15",
    ownerSignedDate: "2026-05-14 16:45",
    managerSignedDate: "2026-05-15 10:00",
    completedDate: "2026-05-15 10:00",
    version: "2.1",
    facilities: [
      "120 Brand Standard Guest Rooms",
      "Wyndham Garden Cafe & Bar",
      "Executive Meeting Room",
      "Outdoor Pool & Landscaped Gardens",
      "Fully functional back-of-house & laundry"
    ],
    ownerSignature: {
      method: "type",
      data: "Charles",
      signedBy: "Charles",
      title: "Managing Director",
      date: "2026-05-14"
    },
    managerSignature: {
      signature: "Cove Management Ltd – Executive Director",
      signedBy: "Director of Operations",
      title: "Executive Director",
      date: "2026-05-15"
    },
    supportingDocs: [
      { id: "doc-3", name: "TS_Brand_Standards_Compliance.pdf", size: "5.7 MB", date: "2026-05-10" }
    ],
    auditTrail: [
      {
        id: "log-10",
        action: "TSA Created from Template",
        timestamp: "2026-05-10 09:00",
        user: "Admin (Cove Management)",
        ip: "122.102.112.5",
        browser: "Chrome v124 (MacOS)",
        device: "Desktop"
      },
      {
        id: "log-11",
        action: "Sent to Owner for Signature",
        timestamp: "2026-05-11 10:00",
        user: "Admin (Cove Management)",
        ip: "122.102.112.5",
        browser: "Chrome v124 (MacOS)",
        device: "Desktop"
      },
      {
        id: "log-12",
        action: "TSA Signed digitally by Owner",
        timestamp: "2026-05-14 16:45",
        user: "Charles",
        ip: "118.232.44.82",
        browser: "Safari Mobile (iOS)",
        device: "iPad Pro",
        location: "Nadi, Fiji"
      },
      {
        id: "log-13",
        action: "Counter-Signed by Cove Management Director",
        timestamp: "2026-05-15 10:00",
        user: "Cove Management Director",
        ip: "122.102.112.5",
        browser: "Chrome v124 (MacOS)",
        device: "Desktop",
        location: "Singapore Headquarters"
      },
      {
        id: "log-14",
        action: "Agreement Locked & Certified PDF Generated",
        timestamp: "2026-05-15 10:02",
        user: "CML System",
        ip: "System Engine",
        browser: "N/A",
        device: "Server"
      }
    ]
  },
  {
    id: "CML-AGR-2026-003",
    title: "Mutual NDA – Hotel Management Consultancy Service",
    templateType: "NDA",
    status: "Draft",
    ownerName: "Charles",
    ownerCompany: "Koro Fiji-Nadi Bay Sands Investment Limited",
    ownerEmail: "digitalmedia@cml.com.fj",
    ownerPhone: "+679 672 8885",
    hotelName: "Cove Management Fiji Portfolio",
    hotelAddress: "Nadi, Fiji Islands",
    inventory: "N/A (Group Portfolio)",
    managementFee: "N/A",
    techFee: "N/A",
    initialTerm: "3 Years",
    renewalTerm: "N/A",
    createdDate: "2026-07-01 09:30",
    version: "1.0",
    facilities: [],
    supportingDocs: [],
    auditTrail: [
      {
        id: "log-20",
        action: "NDA Draft Created",
        timestamp: "2026-07-01 09:30",
        user: "Admin (Cove Management)",
        ip: "122.102.112.5",
        browser: "Chrome v124 (MacOS)",
        device: "Desktop"
      }
    ]
  }
];

const getOwnerDetails = (ag: Agreement) => ag.ownerDetails || `${ag.ownerCompany}\n${ag.hotelAddress || ""}`;
const getManagerDetails = (ag: Agreement) => ag.managerDetails || "Cove Management Pte Ltd\nLot 14, Wasawasa Rd, Wailoaloa Beach, Nadi";
const getHotelBrand = (ag: Agreement) => ag.hotelBrand || (ag.templateType?.includes("Wyndham") ? "Wyndham Garden - subject to final approval by Wyndham" : "Ramada Plaza- subject to final approval by Wyndham Hotels and Resorts");
const getProposedHotelName = (ag: Agreement) => ag.proposedHotelName || ag.hotelName;
const getFranchiseAgreement = (ag: Agreement) => ag.franchiseAgreement || "Owner acknowledges and agrees that Manager will enter into a Franchise Agreement with Wyndham Hotel Asia Pacific Co. Ltd (Wyndham)- the terms of which will be negotiated between Manager and Wyndham. All costs associated with the Franchise Agreement shall be operational costs of the hotel";
const getHotelAddress = (ag: Agreement) => ag.hotelAddress;
const getDevelopmentType = (ag: Agreement) => ag.developmentType || "New Build";
const getRentalProgram = (ag: Agreement) => ag.rentalProgram || "Owner will continue to own all Facilities in the hotel and will not individually sell any of the guest rooms – all bookings are to go through Management reservations systems";
const getInitialTerm = (ag: Agreement) => ag.initialTerm || "Commencing on the Effective Date and expiring at XXX pm (local time at the Hotel) on XXXX of the year in which the tenth (10th) anniversary of the Opening Date occurs.";
const getRenewalTerm = (ag: Agreement) => ag.renewalTerm || "One (1) further term of Ten (10) Operating Years by mutual agreement]";
const getMilestoneDates = (ag: Agreement) => ag.milestoneDates || "Construction Commencement: Commenced\nConstruction Completion: xxxx\nOpening Date: xxxxx";
const getManagementFee = (ag: Agreement) => ag.managementFee || "Owner agrees to allocate 20% of the Gross Operating Profit (GOP) of the hotel to Manager as a Management Fee payable monthly in arrears. For the avoidance of doubt, GOP is defined as per Definitions Schedule below";
const getTechFee = (ag: Agreement) => ag.techFee || "Owner shall pay Manager (which funds will subsequently be distributed to Wyndham) a Technical Services Fee of US$15,000- payable upon contract execution to ensure compliance with applicable Days Inn brand standards";
const getFfeReserve = (ag: Agreement) => ag.ffeReserve || "The following amounts will be transferred monthly from the operating account of the Hotel to a reserve fund for the Hotel:\n1. 5% of Gross Revenues for the first Operating Year;\n2. 6% of Gross Revenues for the second and third Operating Year; and\n3. 7% of Gross Revenues for the fourth Operating Year and each subsequent Operating Year.\n\nAmounts in such Reserve fund will be used for routine capital and FF&E improvements.";
const getSinkingFund = (ag: Agreement) => ag.sinkingFund || "Manager will reserve monthly Sinking Fund for the Hotel at rate of 5% off the Gross Revenue, capped at $250k for any major upkeep, renovation & replacement works and to be utilized as a working capital under unseen circumstances situations.\n\nOwner will be contributing $150k initially towards to this Reserve Sinking fund account to be utilized as working capital by the Manager to start its hotel operations and Manager to build up Sinking fund account monthly by said deduction process.";
const getOwnerResponsibilities = (ag: Agreement) => ag.ownerResponsibilities || "Open Hotel by no later than the agreed Opening Date.\nAcquire and construct the Hotel in compliance with all applicable laws and regulations and according to the Hotel Brand Standards.\nApprove the annual plan in accordance with the procedures of the Management Agreement.\nRetain responsibility for working capital, property taxes, debt services and the like.\nObtain and maintain appropriate insurance.\nWyndham initial design set up fee.\nProvide working capital in the sinking fund account as per above Reserve Sinking Fund clause.";
const getCurrency = (ag: Agreement) => ag.currency || "All payments to Manager under the Management Agreement shall be made in Fijian Dollars";

export function AgreementsSigning() {
  // --- STATE ---
  const [agreements, setAgreements] = useState<Agreement[]>(() => {
    const saved = localStorage.getItem("cml_agreements");
    return saved ? JSON.parse(saved) : INITIAL_AGREEMENTS;
  });

  const [activeSubView, setActiveSubView] = useState<"dashboard" | "builder" | "viewer" | "storage">("storage");
  const [role, setRole] = useState<"admin" | "owner">("admin"); // Default to CML Admin with full control, owner portal toggle removed
  const [selectedAgreement, setSelectedAgreement] = useState<Agreement | null>(null);
  const [docViewTab, setDocViewTab] = useState<"designed" | "legal" | "excel">("legal");
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [isSheetEditorOpen, setIsSheetEditorOpen] = useState(true);
  
  // Builder state
  const [selectedTemplate, setSelectedTemplate] = useState<string>("Hotel Management LOI");
  const [prefilledTarget, setPrefilledTarget] = useState<"ramada" | "wyndham" | "custom">("ramada");
  const [builderForm, setBuilderForm] = useState({
    title: "",
    ownerName: "Charles",
    ownerCompany: "Koro Fiji-Nadi Bay Sands Investment Limited",
    ownerDetails: "Koro Fiji-Nadi Bay Sands Investment Limited\nLot 2 Northern Press Rd, Martintar, Nadi Fiji",
    ownerEmail: "digitalmedia@cml.com.fj",
    ownerPhone: "+679 672 8885",
    hotelName: "Ramada Plaza by Wyndham & Suites",
    hotelAddress: "Lot 2 Northern Press Rd, Martintar, Nadi Fiji",
    inventory: "88 Apartments & 210 hotel rooms (Total 298 Keys)",
    managementFee: "20% of Gross Operating Profit (GOP)",
    techFee: "US$15,000 payable upon contract execution",
    initialTerm: "10 Years from Opening Date",
    renewalTerm: "One (1) further term of Ten (10) Operating Years",
    facilitiesText: "Fully fitted 88 Apartments with 210 key hotel room as per brand requirements\nFully fitted Kitchen, Restaurant & Bar and Dining area to meet brand standard\nFully fitted branded Front Office Reception as per brand standards\nDesigned lobby and Guest Luggage Room\nCar parking space\nMaintenance Room\nFully functional Administration Office including Manager’s offices\nGuest waiting Lounge Area\nSwimming Pool and fully equipped pump room\nGround Floor Dining area\nOutdoor guest Male and Female shower and toilets at the deck area\nRecommended Brand quality silent power generator with Automatic changeover control system\nWater pressuring pump system both installed on ground floor and rooftop water tank system\nFully equipped System Server Room including Servers with software to cater for IPTV Sky Channel & in room movie system, room and property Phones, Hotel PMS, CCTV control, Data Protection Firewall, Vingcard room door lock key control system\nStaff Room and Staff area, toilet and shower\nBranded and fully functional lift with emergency rescue device installed\nFully functional fire protection system, heat & smoke detectors, extinguishers and fire hose requirements as per local authorities\nLinen rooms with storage space at all levels\nFully functional pressured Instant Hot water supply system for the entire building\nStandard Wall paintings and coverings\nFully equipped and functional water storage tanks for fresh water supply to the entire building\nFully functional high floor Bar, Restaurant, Kitchen and Dining\nFully functional Conference room to handle around 350 people\nConference break-out meeting rooms at least 2 to handle 30pax in room\nEntire property network and Wifi setup including all hardware\nVingcard door lock system for guest rooms and office doors\nConcierge/Porter desk\nMeet & Greet guest lobby for guest pickup and drop off\nProper Rubbish bin storage area with bins\nDisable Toilet and shower room\nFully Functional Spa and Fitness Center\nMaids Stations on each level\nAmenity storage Room\nKitchen Dry Storage Room\nKitchen Freezer Room and Cooler Room\nBeer Cooler Room\nMaintenance Storage Rooms\nMaintenance working area\nProperty Guest Transporting Vehicle\nGym\nSpa\nShop",
    customNotes: ""
  });

  // Multi-step and Draft persistence states
  const [isDraftRestored, setIsDraftRestored] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<string | null>(null);
  const [formStep, setFormStep] = useState(1);

  const restoredTemplateRef = useRef<string | null>(null);
  const restoredTargetRef = useRef<string | null>(null);

  // Search/Filter state
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [viewMode, setViewMode] = useState<"grid" | "list" | "columns">("grid");

  // Signing state
  const [signMethod, setSignMethod] = useState<"draw" | "type" | "upload">("draw");
  const [typedSignText, setTypedSignText] = useState("");
  const [drawnSignData, setDrawnSignData] = useState<string>("");
  const [uploadedSignData, setUploadedSignData] = useState<string>("");
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [signingName, setSigningName] = useState("Charles");
  const [signingTitle, setSigningTitle] = useState("Managing Director");
  const [signingCompany, setSigningCompany] = useState("Koro Fiji-Nadi Bay Sands Investment Limited");

  // Notifications
  const [notification, setNotification] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);

  // Canvas drawing ref
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  // File upload ref
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Persist agreements
  useEffect(() => {
    localStorage.setItem("cml_agreements", JSON.stringify(agreements));
  }, [agreements]);

  // Load draft on mount
  useEffect(() => {
    try {
      const savedDraft = localStorage.getItem("cml_agreement_draft");
      if (savedDraft) {
        const parsed = JSON.parse(savedDraft);
        if (parsed.builderForm) {
          setBuilderForm(parsed.builderForm);
        }
        if (parsed.selectedTemplate) {
          setSelectedTemplate(parsed.selectedTemplate);
          restoredTemplateRef.current = parsed.selectedTemplate;
        }
        if (parsed.prefilledTarget) {
          setPrefilledTarget(parsed.prefilledTarget);
          restoredTargetRef.current = parsed.prefilledTarget;
        }
        if (parsed.formStep) {
          setFormStep(parsed.formStep);
        }
        setLastSaved(parsed.lastSaved || null);
        console.log("[AgreementBuilder] Restored auto-saved draft from localStorage.");
      }
    } catch (e) {
      console.error("Error restoring draft:", e);
    }
    setIsDraftRestored(true);
  }, []);

  // Auto-save draft
  useEffect(() => {
    if (!isDraftRestored) return;

    setIsSaving(true);
    const saveTimer = setTimeout(() => {
      try {
        const draftData = {
          builderForm,
          selectedTemplate,
          prefilledTarget,
          formStep,
          lastSaved: new Date().toLocaleTimeString()
        };
        localStorage.setItem("cml_agreement_draft", JSON.stringify(draftData));
        setLastSaved(draftData.lastSaved);
      } catch (e) {
        console.error("Error auto-saving draft:", e);
      } finally {
        setIsSaving(false);
      }
    }, 800); // Debounce saves by 800ms

    return () => clearTimeout(saveTimer);
  }, [builderForm, selectedTemplate, prefilledTarget, formStep, isDraftRestored]);

  // Handle template selection pre-fills
  useEffect(() => {
    if (!isDraftRestored) return;

    // Skip pre-fill if it matches the draft restored on mount
    if (restoredTemplateRef.current === selectedTemplate && restoredTargetRef.current === prefilledTarget) {
      restoredTemplateRef.current = null;
      restoredTargetRef.current = null;
      return;
    }

    if (prefilledTarget === "ramada") {
      setBuilderForm({
        title: `${selectedTemplate} – Ramada Plaza & Suites Nadi`,
        ownerName: "Charles",
        ownerCompany: "Koro Fiji-Nadi Bay Sands Investment Limited",
        ownerDetails: "Koro Fiji-Nadi Bay Sands Investment Limited\nLot 2 Northern Press Rd, Martintar, Nadi Fiji",
        ownerEmail: "digitalmedia@cml.com.fj",
        ownerPhone: "+679 672 8885",
        hotelName: "Ramada Plaza by Wyndham & Suites",
        hotelAddress: "Lot 2 Northern Press Rd, Martintar, Nadi Fiji",
        inventory: "88 Apartments & 210 hotel rooms (Total 298 Keys)",
        managementFee: "20% of Gross Operating Profit (GOP) payable monthly in arrears",
        techFee: "US$15,000 payable upon contract execution",
        initialTerm: "10 Years from Opening Date",
        renewalTerm: "One (1) further term of Ten (10) Operating Years",
        facilitiesText: "Fully fitted 88 Apartments with 210 key hotel room as per brand requirements\nFully fitted Kitchen, Restaurant & Bar and Dining area to meet brand standard\nFully fitted branded Front Office Reception as per brand standards\nDesigned lobby and Guest Luggage Room\nCar parking space\nMaintenance Room\nFully functional Administration Office including Manager’s offices\nGuest waiting Lounge Area\nSwimming Pool and fully equipped pump room\nGround Floor Dining area\nOutdoor guest Male and Female shower and toilets at the deck area\nRecommended Brand quality silent power generator with Automatic changeover control system\nWater pressuring pump system both installed on ground floor and rooftop water tank system\nFully equipped System Server Room including Servers with software to cater for IPTV Sky Channel & in room movie system, room and property Phones, Hotel PMS, CCTV control, Data Protection Firewall, Vingcard room door lock key control system\nStaff Room and Staff area, toilet and shower\nBranded and fully functional lift with emergency rescue device installed\nFully functional fire protection system, heat & smoke detectors, extinguishers and fire hose requirements as per local authorities\nLinen rooms with storage space at all levels\nFully functional pressured Instant Hot water supply system for the entire building\nStandard Wall paintings and coverings\nFully equipped and functional water storage tanks for fresh water supply to the entire building\nFully functional high floor Bar, Restaurant, Kitchen and Dining\nFully functional Conference room to handle around 350 people\nConference break-out meeting rooms at least 2 to handle 30pax in room\nEntire property network and Wifi setup electronic key, smart door lock\nGym\nSpa\nShop",
        customNotes: "Proposed in accordance with Cove Management hospitality standards."
      });
    } else if (prefilledTarget === "wyndham") {
      setBuilderForm({
        title: `${selectedTemplate} – Wyndham Garden Wailoaloa`,
        ownerName: "Charles",
        ownerCompany: "Koro Fiji-Nadi Bay Sands Investment Limited",
        ownerDetails: "Koro Fiji-Nadi Bay Sands Investment Limited\nLot 3 Wailoaloa Beach Road, Nadi, Fiji",
        ownerEmail: "digitalmedia@cml.com.fj",
        ownerPhone: "+679 672 8885",
        hotelName: "Wyndham Garden Wailoaloa Beach",
        hotelAddress: "Lot 3 Wailoaloa Beach Road, Nadi, Fiji",
        inventory: "120 Key Select-Service Resort",
        managementFee: "2.5% of Gross Rooms Revenue",
        techFee: "US$20,000 upfront brand entry fee",
        initialTerm: "5 Years",
        renewalTerm: "5 Years by mutual agreement",
        facilitiesText: "120 Brand Standard Guest Rooms\nWyndham Garden Cafe & Bar\nExecutive Meeting Room\nOutdoor Pool & Landscaped Gardens\nFully functional back-of-house & laundry",
        customNotes: "Technical service advisory guidelines apply."
      });
    } else {
      setBuilderForm({
        title: `${selectedTemplate} – Custom Development`,
        ownerName: "",
        ownerCompany: "",
        ownerDetails: "",
        ownerEmail: "",
        ownerPhone: "",
        hotelName: "New Hotel Resort",
        hotelAddress: "",
        inventory: "",
        managementFee: "",
        techFee: "",
        initialTerm: "10 Years",
        renewalTerm: "5 Years",
        facilitiesText: "",
        customNotes: ""
      });
    }
  }, [selectedTemplate, prefilledTarget, isDraftRestored]);

  // Show standard notification toast
  const triggerNotification = (message: string, type: "success" | "error" | "info" = "success") => {
    setNotification({ message, type });
    setTimeout(() => {
      setNotification(null);
    }, 5000);
  };

  // Download official text term sheet to local PC
  const downloadAgreement = (ag: Agreement) => {
    const fileContent = `================================================================================
                        COVE MANAGEMENT LIMITED (CML)
                        OFFICIAL HOTEL TERM SHEET COVENANT
================================================================================

DOCUMENT REF ID: ${ag.id}
TITLE:           ${ag.title}
TEMPLATE TYPE:   ${ag.templateType}
STATUS:          ${ag.status.toUpperCase()}
VERSION LIMIT:   v${ag.version}
CREATED DATE:    ${ag.createdDate}
${ag.completedDate ? `COMPLETED DATE:  ${ag.completedDate}` : ""}

--------------------------------------------------------------------------------
1. PARTIES
--------------------------------------------------------------------------------
OWNER:           ${ag.ownerCompany}
Owner Contact:   ${ag.ownerName} (${ag.ownerEmail} / ${ag.ownerPhone})
Owner Details:
${getOwnerDetails(ag)}

MANAGER:         Cove Management Pte Ltd
Manager Address: Lot 14, Wasawasa Rd, Wailoaloa Beach, Nadi, Fiji

--------------------------------------------------------------------------------
2. HOTEL PROPERTY DETAILS
--------------------------------------------------------------------------------
Hotel Brand:     ${getHotelBrand(ag)}
Hotel Name:      ${getProposedHotelName(ag)} (or as agreed between parties)
Hotel Address:   ${ag.hotelAddress}
Development:     ${getDevelopmentType(ag)}
Inventory:       ${ag.inventory}

DESIGNATED FACILITIES:
${ag.facilities.map((fac, idx) => `  [${String(idx + 1).padStart(2, '0')}] ${fac}`).join("\n")}

--------------------------------------------------------------------------------
3. COMMERCIAL COVENANTS & FEES
--------------------------------------------------------------------------------
Initial Term:    ${getInitialTerm(ag)}
Renewal Term:    ${getRenewalTerm(ag)}
Management Fee:  ${getManagementFee(ag)}
Technical Fee:   ${getTechFee(ag)}

FF&E Reserve Fund:
${getFfeReserve(ag)}

Reserve Sinking Fund:
${getSinkingFund(ag)}

Owner Responsibilities & Covenants:
${getOwnerResponsibilities(ag)}

Settlement Currency:
${getCurrency(ag)}

Franchise Covenants:
${getFranchiseAgreement(ag)}

Rental Pool Program Covenants:
${getRentalProgram(ag)}

--------------------------------------------------------------------------------
4. KEY COVENANT DATES & MILESTONES
--------------------------------------------------------------------------------
${getMilestoneDates(ag)}

--------------------------------------------------------------------------------
5. DIGITAL SIGNATURES & SECURITY METADATA
--------------------------------------------------------------------------------
OWNER SIGN-OFF:
${ag.ownerSignature ? `  Signed By:   ${ag.ownerSignature.signedBy}
  Title:       ${ag.ownerSignature.title}
  Date Signed: ${ag.ownerSignature.date}
  Method:      ${ag.ownerSignature.method.toUpperCase()}
  Signature:   ${ag.ownerSignature.method === "type" ? ag.ownerSignature.data : "[STYLIZED SECURITY SIGNATURE / IMAGE REPRESENTATION]"}
  Verification:✓ SECURED VIA DIGI-KEY SECURE VAULT` : "  STATUS:      PENDING OWNER SIGNATURE"}

COVE MANAGER SIGN-OFF:
${ag.managerSignature ? `  Signed By:   ${ag.managerSignature.signedBy}
  Title:       ${ag.managerSignature.title}
  Date Signed: ${ag.managerSignature.date}
  Signature:   ${ag.managerSignature.signedBy} (Cove Management Pte Ltd)
  Verification:✓ SSL CERTIFICATE ENCRYPTED LOCK` : "  STATUS:      PENDING COVE MANAGER COUNTER-SIGNATURE"}

--------------------------------------------------------------------------------
6. AUDIT TRAIL LOGS
--------------------------------------------------------------------------------
${ag.auditTrail.map(log => `[${log.timestamp}] [${log.action.toUpperCase()}] By: ${log.user}
  IP: ${log.ip} | Browser: ${log.browser} | Device: ${log.device} | Location: ${log.location || "Nadi, Fiji"}`).join("\n\n")}

================================================================================
This is a secure electronic copy generated from the CML Digital Vault.
================================================================================
`;

    // Use full-stack native POST form submit to bypass sandboxed iframe download restrictions
    const form = document.createElement("form");
    form.method = "POST";
    form.action = "/api/download-text";
    form.target = "_self";

    const filenameInput = document.createElement("input");
    filenameInput.type = "hidden";
    filenameInput.name = "filename";
    filenameInput.value = `${ag.id}_${ag.title.replace(/[^a-z0-9]/gi, "_").toLowerCase()}.txt`;
    form.appendChild(filenameInput);

    const contentInput = document.createElement("input");
    contentInput.type = "hidden";
    contentInput.name = "content";
    contentInput.value = fileContent;
    form.appendChild(contentInput);

    document.body.appendChild(form);
    form.submit();
    document.body.removeChild(form);

    triggerNotification(`Downloading CML secured copy of ${ag.id} to your PC...`, "success");
  };

  // Download supporting attachments to local PC
  const downloadAttachmentFile = (docItem: { id: string; name: string; size: string; date: string }) => {
    const content = `================================================================================
                     COVE MANAGEMENT LIMITED SECURE FILE VAULT
================================================================================
File Name:     ${docItem.name}
Size:          ${docItem.size}
Date Uploaded: ${docItem.date}
Status:        Secured & Certified

This is a verified secure copy of the contract annexure "${docItem.name}".
================================================================================
`;
    // Use full-stack native POST form submit to bypass sandboxed iframe download restrictions
    const form = document.createElement("form");
    form.method = "POST";
    form.action = "/api/download-text";
    form.target = "_self";

    const filenameInput = document.createElement("input");
    filenameInput.type = "hidden";
    filenameInput.name = "filename";
    filenameInput.value = docItem.name;
    form.appendChild(filenameInput);

    const contentInput = document.createElement("input");
    contentInput.type = "hidden";
    contentInput.name = "content";
    contentInput.value = content;
    form.appendChild(contentInput);

    document.body.appendChild(form);
    form.submit();
    document.body.removeChild(form);

    triggerNotification(`Downloading attachment "${docItem.name}" to your PC...`, "success");
  };

  // --- SIGNATURE DRAW CANVAS LOGIC ---
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.strokeStyle = "#0B1C33"; // deep navy ink
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";

    const rect = canvas.getBoundingClientRect();
    let clientX, clientY;
    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    ctx.beginPath();
    ctx.moveTo(clientX - rect.left, clientY - rect.top);
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    let clientX, clientY;
    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    ctx.lineTo(clientX - rect.left, clientY - rect.top);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    saveDrawnSignature();
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setDrawnSignData("");
  };

  const saveDrawnSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL();
    // Check if canvas is blank before setting
    setDrawnSignData(dataUrl);
  };

  // Handle signature upload
  const handleSignatureUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setUploadedSignData(event.target.result as string);
          triggerNotification("Signature file loaded successfully.", "success");
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // --- ACTIONS ---
  const getOwnerDetails = (ag: Agreement) => ag.ownerDetails || `${ag.ownerCompany}\n${ag.ownerAddress || "Lot 2 Northern Press Rd, Martintar, Nadi Fiji"}`;
  const getManagerDetails = (ag: Agreement) => ag.managerDetails || `Cove Management Pte Ltd\nLot 14, Wasawasa Rd, Wailoaloa Beach, Nadi`;
  const getHotelBrand = (ag: Agreement) => ag.hotelBrand || "Ramada Plaza - subject to final approval by Wyndham Hotels and Resorts";
  const getProposedHotelName = (ag: Agreement) => ag.hotelName || "Ramada Plaza by Wyndham";
  const getFranchiseAgreement = (ag: Agreement) => ag.franchiseAgreement || "Owner acknowledges and agrees that Manager will enter into a Franchise Agreement directly with Wyndham Hotels and Resorts to flag the establishment.";
  const getHotelAddress = (ag: Agreement) => ag.hotelAddress || "Martintar, Nadi Fiji";
  const getDevelopmentType = (ag: Agreement) => ag.developmentType || "New Build & Managed Luxury Resort";
  const getRentalProgram = (ag: Agreement) => ag.rentalProgram || "Owner and Manager will establish a rental pool program for privately owned villas/units in the resort, managed exclusively by Manager under a 50/50 net revenue split covenant.";
  const getInitialTerm = (ag: Agreement) => ag.initialTerm || "15 Years from opening";
  const getRenewalTerm = (ag: Agreement) => ag.renewalTerm || "5 Years (Two terms)";
  const getMilestoneDates = (ag: Agreement) => ag.milestoneDates || "Construction Start: Q4 2026\nHotel Opening: Q4 2028";
  const getManagementFee = (ag: Agreement) => ag.managementFee || "20% of Gross Operating Profit (GOP) payable monthly in arrears";
  const getTechFee = (ag: Agreement) => ag.techFee || "One-time Technical Services Fee of US$15,000";
  const getFfeReserve = (ag: Agreement) => ag.ffeReserve || "5% of Gross Revenues for Year 1, 6% for Years 2-3, and 7% for Year 4 onwards.";
  const getSinkingFund = (ag: Agreement) => ag.sinkingFund || "5% of Gross Revenue capped at $250,000 for major upkeep and replacement works. Owner to make $150,000 initial contribution.";
  const getCurrency = (ag: Agreement) => ag.currency || "Fijian Dollars";

  const updateAgreementField = (field: keyof Agreement, value: any) => {
    if (!selectedAgreement) return;
    const updatedAg = {
      ...selectedAgreement,
      [field]: value
    };
    setSelectedAgreement(updatedAg);
    setAgreements(prev => prev.map(ag => ag.id === selectedAgreement.id ? updatedAg : ag));
  };

  const handleCreateAgreement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!builderForm.title || !builderForm.ownerName || !builderForm.hotelName) {
      triggerNotification("Please fill out all primary fields.", "error");
      return;
    }

    const newAgreementId = `CML-AGR-2026-00${agreements.length + 1}`;
    const newAg: Agreement = {
      id: newAgreementId,
      title: builderForm.title,
      templateType: selectedTemplate,
      status: "Draft",
      ownerName: builderForm.ownerName,
      ownerCompany: builderForm.ownerCompany,
      ownerDetails: builderForm.ownerDetails,
      ownerEmail: builderForm.ownerEmail,
      ownerPhone: builderForm.ownerPhone,
      hotelName: builderForm.hotelName,
      hotelAddress: builderForm.hotelAddress,
      inventory: builderForm.inventory,
      managementFee: builderForm.managementFee,
      techFee: builderForm.techFee,
      initialTerm: builderForm.initialTerm,
      renewalTerm: builderForm.renewalTerm,
      createdDate: new Date().toISOString().replace('T', ' ').substring(0, 16),
      version: "1.0",
      facilities: builderForm.facilitiesText.split('\n').filter(l => l.trim().length > 0),
      supportingDocs: [],
      ownerResponsibilities: `Open Hotel by no later than the agreed Opening Date.\nAcquire and construct the Hotel in compliance with all applicable laws and regulations and according to the Hotel Brand Standards.\nApprove the annual plan in accordance with the procedures of the Management Agreement.\nRetain responsibility for working capital, property taxes, debt services and the like.\nObtain and maintain appropriate insurance.\nWyndham initial design set up fee.\nProvide working capital in the sinking fund account as per above Reserve Sinking Fund clause.`,
      ffeReserve: `The following amounts will be transferred monthly from the operating account of the Hotel to a reserve fund for the Hotel:\n1. 5% of Gross Revenues for the first Operating Year;\n2. 6% of Gross Revenues for the second and third Operating Year; and\n3. 7% of Gross Revenues for the fourth Operating Year and each subsequent Operating Year.\n\nAmounts in such Reserve fund will be used for routine capital and FF&E improvements.`,
      sinkingFund: `Manager will reserve monthly Sinking Fund for the Hotel at rate of 5% off the Gross Revenue, capped at $250k for any major upkeep, renovation & replacement works and to be utilized as a working capital under unseen circumstances situations.\n\nOwner will be contributing $150k initially towards to this Reserve Sinking fund account to be utilized as working capital by the Manager to start its hotel operations and Manager to build up Sinking fund account monthly by said deduction process.`,
      currency: "All payments to Manager under the Management Agreement shall be made in Fijian Dollars",
      auditTrail: [
        {
          id: `log-${Date.now()}`,
          action: "Agreement Document Created via Template Builder",
          timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
          user: "Admin (Cove Management)",
          ip: "122.102.112.5",
          browser: "Chrome v124 (MacOS)",
          device: "Desktop",
          location: "Singapore Headquarters"
        }
      ]
    };

    setAgreements([newAg, ...agreements]);
    setActiveSubView("storage");
    triggerNotification(`Successfully drafted "${builderForm.title}".`, "success");

    // Clean up draft storage
    localStorage.removeItem("cml_agreement_draft");
    setFormStep(1);
    setBuilderForm({
      title: "",
      ownerName: "Charles",
      ownerCompany: "Koro Fiji-Nadi Bay Sands Investment Limited",
      ownerDetails: "Koro Fiji-Nadi Bay Sands Investment Limited\nLot 2 Northern Press Rd, Martintar, Nadi Fiji",
      ownerEmail: "digitalmedia@cml.com.fj",
      ownerPhone: "+679 672 8885",
      hotelName: "Ramada Plaza by Wyndham & Suites",
      hotelAddress: "Lot 2 Northern Press Rd, Martintar, Nadi Fiji",
      inventory: "88 Apartments & 210 hotel rooms (Total 298 Keys)",
      managementFee: "20% of Gross Operating Profit (GOP)",
      techFee: "US$15,000 payable upon contract execution",
      initialTerm: "10 Years from Opening Date",
      renewalTerm: "One (1) further term of Ten (10) Operating Years",
      facilitiesText: "Fully fitted 88 Apartments with 210 key hotel room as per brand requirements\nFully fitted Kitchen, Restaurant & Bar and Dining area to meet brand standard\nFully fitted branded Front Office Reception as per brand standards\nDesigned lobby and Guest Luggage Room\nCar parking space\nMaintenance Room\nFully functional Administration Office including Manager’s offices\nGuest waiting Lounge Area\nSwimming Pool and fully equipped pump room\nGround Floor Dining area\nOutdoor guest Male and Female shower and toilets at the deck area\nRecommended Brand quality silent power generator with Automatic changeover control system\nWater pressuring pump system both installed on ground floor and rooftop water tank system\nFully equipped System Server Room including Servers with software to cater for IPTV Sky Channel & in room movie system, room and property Phones, Hotel PMS, CCTV control, Data Protection Firewall, Vingcard room door lock key control system\nStaff Room and Staff area, toilet and shower\nBranded and fully functional lift with emergency rescue device installed\nFully functional fire protection system, heat & smoke detectors, extinguishers and fire hose requirements as per local authorities\nLinen rooms with storage space at all levels\nFully functional pressured Instant Hot water supply system for the entire building\nStandard Wall paintings and coverings\nFully equipped and functional water storage tanks for fresh water supply to the entire building\nFully functional high floor Bar, Restaurant, Kitchen and Dining\nFully functional Conference room to handle around 350 people\nConference break-out meeting rooms at least 2 to handle 30pax in room\nEntire property network and Wifi setup electronic key, smart door lock\nGym\nSpa\nShop",
      customNotes: ""
    });
  };

  const handleSendAgreement = (id: string) => {
    setAgreements(prev => prev.map(ag => {
      if (ag.id === id) {
        const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 16);
        return {
          ...ag,
          status: "Awaiting Signature",
          auditTrail: [
            ...ag.auditTrail,
            {
              id: `log-${Date.now()}`,
              action: "Agreement Dispatched to Owner Portal",
              timestamp,
              user: "Admin (Cove Management)",
              ip: "122.102.112.5",
              browser: "Chrome v124 (MacOS)",
              device: "Desktop",
              location: "Singapore Headquarters"
            }
          ]
        };
      }
      return ag;
    }));
    triggerNotification("Agreement sent to Owner Portal.", "success");
  };

  const handleDeleteAgreement = (id: string) => {
    setAgreements(prev => prev.filter(ag => ag.id !== id));
    triggerNotification("Agreement deleted successfully.", "info");
  };

  const handleViewAgreement = (ag: Agreement) => {
    setSelectedAgreement(ag);
    // Log viewed event if not already completed/signed
    if (ag.status === "Sent" || ag.status === "Awaiting Signature") {
      setAgreements(prev => prev.map(item => {
        if (item.id === ag.id) {
          const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 16);
          const updatedTrail = [
            ...item.auditTrail,
            {
              id: `log-${Date.now()}`,
              action: "Agreement Opened and Reviewed by Owner",
              timestamp,
              user: role === "owner" ? ag.ownerName : "Manager",
              ip: "118.232.44.82",
              browser: "Safari Mobile (iOS)",
              device: "iPad Pro",
              location: "Nadi, Fiji"
            }
          ];
          return {
            ...item,
            status: "Viewed",
            viewedDate: timestamp,
            auditTrail: updatedTrail
          };
        }
        return item;
      }));
    }
    setActiveSubView("viewer");
  };

  const handleOwnerSignAgreement = () => {
    if (!selectedAgreement) return;
    if (!acceptTerms) {
      triggerNotification("You must read and agree to the terms.", "error");
      return;
    }

    let signatureData = "";
    if (signMethod === "draw") {
      if (!drawnSignData) {
        triggerNotification("Please draw your signature in the signature area.", "error");
        return;
      }
      signatureData = drawnSignData;
    } else if (signMethod === "type") {
      if (!typedSignText.trim()) {
        triggerNotification("Please type your signature text.", "error");
        return;
      }
      signatureData = typedSignText;
    } else {
      if (!uploadedSignData) {
        triggerNotification("Please upload a signature image file.", "error");
        return;
      }
      signatureData = uploadedSignData;
    }

    const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 16);

    setAgreements(prev => prev.map(ag => {
      if (ag.id === selectedAgreement.id) {
        const updated = {
          ...ag,
          status: "Signed" as const,
          ownerSignedDate: timestamp,
          ownerSignature: {
            method: signMethod,
            data: signatureData,
            signedBy: signingName,
            title: signingTitle,
            date: timestamp.split(" ")[0]
          },
          auditTrail: [
            ...ag.auditTrail,
            {
              id: `log-${Date.now()}`,
              action: `Owner Signature Applied (${signMethod.toUpperCase()})`,
              timestamp,
              user: signingName,
              ip: "118.232.44.82",
              browser: "Safari Mobile (iOS)",
              device: "iPad Pro",
              location: "Nadi, Fiji"
            },
            {
              id: `log-not-${Date.now()}`,
              action: "Cove Management Pte Ltd notified automatically for counter-signing",
              timestamp,
              user: "CML System",
              ip: "Server Node",
              browser: "N/A",
              device: "Server"
            }
          ]
        };
        setSelectedAgreement(updated);
        return updated;
      }
      return ag;
    }));

    triggerNotification("You have successfully signed this agreement! Cove Management has been notified.", "success");
  };

  const handleManagerCounterSign = () => {
    if (!selectedAgreement) return;

    const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 16);

    setAgreements(prev => prev.map(ag => {
      if (ag.id === selectedAgreement.id) {
        const updated = {
          ...ag,
          status: "Completed" as const,
          managerSignedDate: timestamp,
          completedDate: timestamp,
          managerSignature: {
            signature: "Cove Management Pte Ltd – Authorized Counter-Sign",
            signedBy: "Director of Hospitality Investments",
            title: "Executive Director",
            date: timestamp.split(" ")[0]
          },
          auditTrail: [
            ...ag.auditTrail,
            {
              id: `log-${Date.now()}`,
              action: "Counter-Signed and Approved by Cove Management Director",
              timestamp,
              user: "Director (Cove Management)",
              ip: "122.102.112.5",
              browser: "Chrome v124 (MacOS)",
              device: "Desktop",
              location: "Singapore Headquarters"
            },
            {
              id: `log-lock-${Date.now()}`,
              action: "Agreement Locked & Audit Certificate Finalized",
              timestamp,
              user: "CML Security Engine",
              ip: "SSL Secure Key",
              browser: "SHA-256 System",
              device: "Vault Server"
            }
          ]
        };
        setSelectedAgreement(updated);
        return updated;
      }
      return ag;
    }));

    triggerNotification("Agreement has been counter-signed! The document is now officially active and locked.", "success");
  };

  const handleUploadSupportingDoc = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!selectedAgreement) return;
    const file = e.target.files?.[0];
    if (file) {
      const newDoc = {
        id: `sdoc-${Date.now()}`,
        name: file.name,
        size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
        date: new Date().toISOString().split("T")[0]
      };

      setAgreements(prev => prev.map(ag => {
        if (ag.id === selectedAgreement.id) {
          const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 16);
          const updated = {
            ...ag,
            supportingDocs: [...ag.supportingDocs, newDoc],
            auditTrail: [
              ...ag.auditTrail,
              {
                id: `log-${Date.now()}`,
                action: `Supporting Document Uploaded: ${file.name}`,
                timestamp,
                user: role === "owner" ? ag.ownerName : "Manager",
                ip: "118.232.44.82",
                browser: "Safari Mobile (iOS)",
                device: "iPad Pro"
              }
            ]
          };
          setSelectedAgreement(updated);
          return updated;
        }
        return ag;
      }));

      triggerNotification(`Uploaded "${file.name}" as supporting document.`, "success");
    }
  };

  // Reset signature form
  useEffect(() => {
    if (activeSubView === "viewer") {
      setAcceptTerms(false);
      setTypedSignText("");
      setDrawnSignData("");
      setUploadedSignData("");
    }
  }, [activeSubView]);

  // Filtered list
  const filteredAgreements = agreements.filter(ag => {
    const matchesSearch = 
      ag.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ag.hotelName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ag.id.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (statusFilter === "All") return matchesSearch;
    return matchesSearch && ag.status === statusFilter;
  });

  // Calculate stats for Dashboard
  const stats = {
    draft: agreements.filter(a => a.status === "Draft").length,
    sent: agreements.filter(a => a.status === "Sent" || a.status === "Awaiting Signature").length,
    viewed: agreements.filter(a => a.status === "Viewed").length,
    awaiting: agreements.filter(a => a.status === "Awaiting Signature").length,
    signed: agreements.filter(a => a.status === "Signed").length,
    completed: agreements.filter(a => a.status === "Completed").length,
    expired: agreements.filter(a => a.status === "Expired").length
  };

  // Recharts Data
  const monthlyTimelineData = [
    { name: "Jan", Signed: 1, Completed: 1 },
    { name: "Feb", Signed: 2, Completed: 1 },
    { name: "Mar", Signed: 4, Completed: 3 },
    { name: "Apr", Signed: 3, Completed: 2 },
    { name: "May", Signed: 5, Completed: 4 },
    { name: "Jun", Signed: 7, Completed: 5 },
    { name: "Jul", Signed: 8, Completed: 6 },
  ];

  const statusPieData = [
    { name: "Draft", value: stats.draft, color: "#94A3B8" },
    { name: "Awaiting Signature", value: stats.sent + stats.viewed, color: "#F59E0B" },
    { name: "Completed", value: stats.completed, color: "#10B981" },
    { name: "Expired", value: stats.expired, color: "#EF4444" }
  ].filter(d => d.value > 0);

  return (
    <div id="cml-owner-portal-root" className="min-h-screen bg-[#FDFBF7] text-[#1A2536] font-sans pb-16 relative">
      
      {/* BRANDING SUB-HEADER (Cove Management Premium Style) */}
      <div className="bg-[#0B1C33] text-white px-6 md:px-12 py-10 shadow-lg border-b-2 border-[#C5A02D] relative overflow-hidden">
        {/* Abstract Gold Background Arc */}
        <div className="absolute right-0 top-0 w-96 h-96 bg-[radial-gradient(circle,rgba(197,160,45,0.08)_0%,transparent_75%)] pointer-events-none rounded-full" />
        
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-6 z-10 relative">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="text-[#C5A02D] font-display text-xs uppercase tracking-[0.25em] font-bold">Cove Management Pte Ltd</span>
              <span className="h-4 w-[1px] bg-white/25" />
              <span className="text-[10px] bg-[#C5A02D]/15 border border-[#C5A02D]/35 text-[#C5A02D] px-2 py-0.5 font-mono uppercase font-black">v2.0 Premium</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-serif tracking-tight italic font-light">
              Agreements & <span className="text-[#C5A02D] font-normal">Digital Signing Desk</span>
            </h1>
            <p className="text-sm text-slate-300 mt-1 max-w-2xl font-light leading-relaxed">
              Secure digital legal document center and online investment platform for Cove Management hotel assets, owners, and developers.
            </p>
          </div>

          {/* SECURE STATUS BADGE */}
          <div className="flex flex-col items-end gap-1.5 shrink-0">
            <div className="bg-[#142642] px-4 py-2 border border-[#C5A02D]/30 flex items-center gap-2 rounded-none shadow-sm">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-white text-[10px] font-display uppercase tracking-wider font-bold">SHA-256 Vault Secure</span>
            </div>
            <span className="text-[9px] text-[#C5A02D] font-mono">CML Authorized Desk</span>
          </div>
        </div>
      </div>

      {/* TOAST CONTAINER */}
      <AnimatePresence>
        {notification && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-6 left-1/2 -translate-x-1/2 z-50 max-w-md w-full px-4"
          >
            <div className={cn(
              "p-4 shadow-xl border flex items-center gap-3 backdrop-blur-md",
              notification.type === "success" ? "bg-[#0B1C33] border-[#C5A02D] text-white" : 
              notification.type === "error" ? "bg-red-950 border-red-500 text-red-100" :
              "bg-slate-900 border-slate-700 text-slate-100"
            )}>
              {notification.type === "success" ? (
                <ShieldCheck className="text-[#C5A02D] shrink-0" size={24} />
              ) : (
                <AlertCircle className="text-red-400 shrink-0" size={24} />
              )}
              <p className="text-xs font-medium leading-relaxed">{notification.message}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-7xl mx-auto px-6 md:px-12 mt-8">

        {/* --- NAVIGATION SUB-MENU --- */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-4 mb-8">
          <div className="flex items-center gap-2">
            <button
              onClick={() => { setActiveSubView("storage"); setSelectedAgreement(null); }}
              className={cn(
                "px-5 py-2.5 text-xs font-display uppercase tracking-wider font-bold transition-all border-b-2",
                activeSubView === "storage" ? "border-[#C5A02D] text-[#0B1C33] font-black" : "border-transparent text-slate-500 hover:text-[#0B1C33]"
              )}
            >
              Secure Vault Archives (Client & Contract Database)
            </button>
            <button
              onClick={() => { setActiveSubView("builder"); setSelectedAgreement(null); }}
              className={cn(
                "px-5 py-2.5 text-xs font-display uppercase tracking-wider font-bold transition-all border-b-2 flex items-center gap-1.5 text-[#C5A02D]",
                activeSubView === "builder" ? "border-[#C5A02D] text-[#0B1C33] font-black" : "border-transparent hover:text-[#0B1C33]"
              )}
            >
              <Plus size={14} /> Fill & Draft New Agreement Form
            </button>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex border border-slate-200 p-0.5 bg-slate-100 rounded">
              <button
                onClick={() => setRole("admin")}
                className={cn(
                  "px-3 py-1.5 text-[10px] font-display uppercase tracking-wider font-bold transition-all",
                  role === "admin" ? "bg-[#0B1C33] text-white rounded-sm shadow-sm" : "text-slate-500 hover:text-[#0B1C33]"
                )}
              >
                CML Admin Portal
              </button>
              <button
                onClick={() => setRole("owner")}
                className={cn(
                  "px-3 py-1.5 text-[10px] font-display uppercase tracking-wider font-bold transition-all",
                  role === "owner" ? "bg-[#C5A02D] text-[#0B1C33] font-black rounded-sm shadow-sm" : "text-slate-500 hover:text-[#0B1C33]"
                )}
              >
                Owner Portal
              </button>
            </div>
            <span className={cn(
              "text-[10px] font-mono px-2.5 py-1 rounded border uppercase font-bold tracking-wider",
              role === "admin" ? "bg-slate-50 border-slate-200 text-slate-600" : "bg-[#FAF7F2] border-[#C5A02D]/40 text-[#0B1C33]"
            )}>
              {role === "admin" ? "Admin Mode" : "Owner Mode"}
            </span>
          </div>
        </div>

        {/* ==================== 1. DASHBOARD VIEW ==================== */}
        {activeSubView === "dashboard" && (
          <div className="space-y-10">
            
            {/* KPI STAT CARDS */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
              {[
                { label: "Draft Agreements", count: stats.draft, icon: FileText, color: "text-slate-400 bg-slate-50 border-slate-200" },
                { label: "Sent for Signature", count: stats.sent, icon: Send, color: "text-blue-500 bg-blue-50/50 border-blue-100" },
                { label: "Viewed by Owner", count: stats.viewed, icon: Eye, color: "text-amber-500 bg-amber-50/50 border-amber-100" },
                { label: "Awaiting Sign", count: stats.awaiting, icon: Clock, color: "text-yellow-600 bg-yellow-50/50 border-yellow-100" },
                { label: "Signed by Owner", count: stats.signed, icon: FileCheck2, color: "text-purple-600 bg-purple-50/50 border-purple-100" },
                { label: "Completed & Locked", count: stats.completed, icon: CheckCircle2, color: "text-emerald-600 bg-emerald-50/50 border-emerald-100" },
                { label: "Expired Terms", count: stats.expired, icon: AlertCircle, color: "text-rose-500 bg-rose-50/50 border-rose-100" }
              ].map((kpi, idx) => (
                <div key={idx} className={cn("p-4 border shadow-sm flex flex-col justify-between h-28 relative overflow-hidden", kpi.color)}>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-display uppercase tracking-wider font-bold leading-tight max-w-[80%]">{kpi.label}</span>
                    <kpi.icon size={16} className="opacity-70 shrink-0" />
                  </div>
                  <span className="text-3xl font-serif text-[#0B1C33] font-light mt-2">{kpi.count}</span>
                </div>
              ))}
            </div>

            {/* CHARTS & ANALYTICS ROW */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* Timeline Chart */}
              <div className="lg:col-span-2 bg-white border border-slate-200/80 p-6 shadow-sm flex flex-col justify-between">
                <div>
                  <h3 className="text-lg font-serif italic text-[#0B1C33] mb-1">Agreement Analytics</h3>
                  <p className="text-[11px] font-display uppercase tracking-widest text-[#C5A02D] font-bold mb-4">CML Performance Over Time</p>
                </div>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={monthlyTimelineData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorSigned" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#C5A02D" stopOpacity={0.2}/>
                          <stop offset="95%" stopColor="#C5A02D" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorCompleted" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#0B1C33" stopOpacity={0.2}/>
                          <stop offset="95%" stopColor="#0B1C33" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                      <XAxis dataKey="name" stroke="#94A3B8" fontSize={10} tickLine={false} />
                      <YAxis stroke="#94A3B8" fontSize={10} tickLine={false} />
                      <Tooltip />
                      <Area type="monotone" dataKey="Signed" stroke="#C5A02D" fillOpacity={1} fill="url(#colorSigned)" strokeWidth={2} />
                      <Area type="monotone" dataKey="Completed" stroke="#0B1C33" fillOpacity={1} fill="url(#colorCompleted)" strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Status Pie Chart */}
              <div className="bg-white border border-slate-200/80 p-6 shadow-sm flex flex-col justify-between">
                <div>
                  <h3 className="text-lg font-serif italic text-[#0B1C33] mb-1">Status Distribution</h3>
                  <p className="text-[11px] font-display uppercase tracking-widest text-[#C5A02D] font-bold mb-4">Live Document Shares</p>
                </div>
                <div className="h-44 flex items-center justify-center relative">
                  {statusPieData.length === 0 ? (
                    <span className="text-xs text-slate-400 italic">No agreements documented</span>
                  ) : (
                    <>
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={statusPieData}
                            cx="50%"
                            cy="50%"
                            innerRadius={45}
                            outerRadius={65}
                            paddingAngle={5}
                            dataKey="value"
                          >
                            {statusPieData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="absolute flex flex-col items-center">
                        <span className="text-2xl font-serif text-[#0B1C33]">{agreements.length}</span>
                        <span className="text-[8px] font-display uppercase tracking-widest text-slate-400">Total</span>
                      </div>
                    </>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-2 mt-4 text-[10px]">
                  {statusPieData.map((d, i) => (
                    <div key={i} className="flex items-center gap-1.5">
                      <span className="h-2 w-2 shrink-0" style={{ backgroundColor: d.color }} />
                      <span className="text-slate-600 truncate">{d.name} ({d.value})</span>
                    </div>
                  ))}
                </div>
              </div>

            </div>

            {/* AGREEMENTS TABLE & TIMELINE */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
              
              {/* Documents Table */}
              <div className="xl:col-span-2 bg-white border border-slate-200/80 p-6 shadow-sm">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                  <div>
                    <h3 className="text-lg font-serif italic text-[#0B1C33]">Pending Actions & Agreements</h3>
                    <p className="text-[11px] font-display uppercase tracking-widest text-[#C5A02D] font-bold">Requires Attention</p>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <Search className="absolute left-3 top-2.5 text-slate-400" size={14} />
                      <input 
                        type="text" 
                        placeholder="Search hotel, owner, ID..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-8 pr-4 py-1.5 border border-slate-200 text-xs w-56 focus:outline-none focus:border-[#C5A02D] bg-[#FDFBF7]"
                      />
                    </div>
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="border border-slate-200 py-1.5 px-3 text-xs focus:outline-none bg-[#FDFBF7]"
                    >
                      <option value="All">All Statuses</option>
                      <option value="Draft">Draft</option>
                      <option value="Awaiting Signature">Awaiting Signature</option>
                      <option value="Signed">Signed</option>
                      <option value="Completed">Completed</option>
                    </select>
                  </div>
                </div>

                {filteredAgreements.length === 0 ? (
                  <div className="py-12 text-center text-slate-400 font-serif italic border-2 border-dashed border-slate-100">
                    No agreements matching filters found.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-slate-100 bg-[#FAF7F2] text-slate-500 font-display uppercase tracking-wider text-[9px]">
                          <th className="py-3 px-4">Agreement / ID</th>
                          <th className="py-3 px-4">Asset Name</th>
                          <th className="py-3 px-4">Owner Party</th>
                          <th className="py-3 px-4">Status</th>
                          <th className="py-3 px-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {filteredAgreements.map((ag) => (
                          <tr key={ag.id} className="hover:bg-[#FAF8F4]/50 transition-colors">
                            <td className="py-4 px-4">
                              <div className="font-semibold text-slate-900 leading-normal">{ag.title}</div>
                              <div className="font-mono text-[9px] text-slate-400 mt-1">{ag.id} • v{ag.version} • Created: {ag.createdDate.split(" ")[0]}</div>
                            </td>
                            <td className="py-4 px-4 font-serif italic text-slate-700">
                              {ag.hotelName}
                            </td>
                            <td className="py-4 px-4">
                              <div className="font-medium text-slate-800">{ag.ownerCompany}</div>
                              <div className="text-[10px] text-slate-400">Attn: {ag.ownerName}</div>
                            </td>
                            <td className="py-4 px-4">
                              <span className={cn(
                                "px-2.5 py-1 text-[9px] font-display uppercase tracking-wider font-bold rounded-none border",
                                ag.status === "Completed" ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                                ag.status === "Signed" ? "bg-purple-50 text-purple-700 border-purple-200" :
                                ag.status === "Awaiting Signature" ? "bg-amber-50 text-amber-700 border-amber-200" :
                                ag.status === "Viewed" ? "bg-yellow-50 text-yellow-700 border-yellow-200" :
                                "bg-slate-50 text-slate-600 border-slate-200"
                              )}>
                                {ag.status}
                              </span>
                            </td>
                            <td className="py-4 px-4 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  onClick={() => handleViewAgreement(ag)}
                                  className="p-1.5 hover:bg-[#C5A02D]/10 text-[#0B1C33] border border-slate-200 hover:border-[#C5A02D] transition-all flex items-center gap-1 text-[10px] uppercase font-display font-bold px-2.5"
                                >
                                  <Eye size={12} />
                                  Review
                                </button>
                                
                                {role === "admin" && ag.status === "Draft" && (
                                  <button
                                    onClick={() => handleSendAgreement(ag.id)}
                                    className="p-1.5 bg-[#0B1C33] text-white border border-[#0B1C33] hover:bg-[#C5A02D] hover:border-[#C5A02D] transition-all flex items-center gap-1 text-[10px] uppercase font-display font-bold px-2.5"
                                  >
                                    <Send size={12} />
                                    Dispatch
                                  </button>
                                )}

                                {role === "admin" && (
                                  <button
                                    onClick={() => handleDeleteAgreement(ag.id)}
                                    className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 border border-transparent hover:border-red-100 transition-all"
                                    title="Delete Draft"
                                  >
                                    <Trash2 size={12} />
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Recent Activity Timeline */}
              <div className="bg-white border border-slate-200/80 p-6 shadow-sm flex flex-col justify-between">
                <div>
                  <h3 className="text-lg font-serif italic text-[#0B1C33] mb-1">Live Audit Trail</h3>
                  <p className="text-[11px] font-display uppercase tracking-widest text-[#C5A02D] font-bold mb-4">Real-time system events</p>
                </div>

                <div className="space-y-5 h-80 overflow-y-auto pr-2 custom-scrollbar">
                  {agreements.flatMap(a => a.auditTrail.map(trail => ({ ...trail, agrTitle: a.title, agrId: a.id })))
                    .sort((x, y) => y.timestamp.localeCompare(x.timestamp))
                    .slice(0, 10)
                    .map((item, idx) => (
                      <div key={idx} className="flex gap-3 relative pb-2 group">
                        {idx < 9 && <div className="absolute left-2.5 top-6 bottom-0 w-[1px] bg-slate-100 group-hover:bg-[#C5A02D]/35 transition-colors" />}
                        <div className="h-5 w-5 rounded-full bg-[#0B1C33] text-[#C5A02D] text-[8px] flex items-center justify-center shrink-0 z-10 border border-[#C5A02D]/40 font-mono">
                          {idx + 1}
                        </div>
                        <div className="space-y-1">
                          <p className="text-xs font-semibold text-slate-800 leading-tight">{item.action}</p>
                          <p className="text-[10px] text-slate-500 font-serif italic">{item.agrTitle}</p>
                          <div className="flex items-center gap-2 text-[9px] text-slate-400 font-mono">
                            <span>{item.timestamp}</span>
                            <span>•</span>
                            <span className="text-slate-500">{item.user}</span>
                            {item.location && (
                              <>
                                <span>•</span>
                                <span className="text-[#C5A02D]">{item.location}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </div>

            </div>

          </div>
        )}


        {/* ==================== 2. AGREEMENT BUILDER (CML ADMIN ONLY) ==================== */}
        {activeSubView === "builder" && role === "admin" && (
          <div className="bg-white border border-slate-200 shadow-xl p-8 max-w-4xl mx-auto relative overflow-hidden">
            {/* Top corner Gold accent line */}
            <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-[#0B1C33] via-[#C5A02D] to-[#0B1C33]" />

            {/* Header with Auto-Save Status */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 pb-6 border-b border-slate-100">
              <div>
                <span className="text-xs font-display uppercase tracking-widest text-[#C5A02D] font-black">New Agreement Builder</span>
                <h2 className="text-3xl font-serif italic text-[#0B1C33] mt-1">Professional Contract Prefiller</h2>
                <p className="text-xs text-slate-400 mt-1">
                  Configure, pre-fill from property assets, and draft legal covenants for hotel owner review.
                </p>
              </div>

              {/* Auto-Save Indicator */}
              <div className="flex flex-col items-end gap-1">
                <div className="flex items-center gap-2 px-3 py-1.5 bg-[#FAF7F2] border border-slate-200">
                  <span className={cn(
                    "h-2 w-2 rounded-full",
                    isSaving ? "bg-amber-500 animate-pulse" : "bg-emerald-500"
                  )} />
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#0B1C33]">
                    {isSaving ? "Saving Draft..." : lastSaved ? `Draft Saved (${lastSaved})` : "Draft Saved"}
                  </span>
                </div>
                {lastSaved && (
                  <button
                    type="button"
                    onClick={() => {
                      if (confirm("Are you sure you want to clear your draft and start over?")) {
                        localStorage.removeItem("cml_agreement_draft");
                        setFormStep(1);
                        setBuilderForm({
                          title: "",
                          ownerName: "Charles",
                          ownerCompany: "Koro Fiji-Nadi Bay Sands Investment Limited",
                          ownerDetails: "Koro Fiji-Nadi Bay Sands Investment Limited\nLot 2 Northern Press Rd, Martintar, Nadi Fiji",
                          ownerEmail: "digitalmedia@cml.com.fj",
                          ownerPhone: "+679 672 8885",
                          hotelName: "Ramada Plaza by Wyndham & Suites",
                          hotelAddress: "Lot 2 Northern Press Rd, Martintar, Nadi Fiji",
                          inventory: "88 Apartments & 210 hotel rooms (Total 298 Keys)",
                          managementFee: "20% of Gross Operating Profit (GOP)",
                          techFee: "US$15,000 payable upon contract execution",
                          initialTerm: "10 Years from Opening Date",
                          renewalTerm: "One (1) further term of Ten (10) Operating Years",
                          facilitiesText: "Fully fitted 88 Apartments with 210 key hotel room as per brand requirements\nFully fitted Kitchen, Restaurant & Bar and Dining area to meet brand standard\nFully fitted branded Front Office Reception as per brand standards\nDesigned lobby and Guest Luggage Room\nCar parking space\nMaintenance Room\nFully functional Administration Office including Manager’s offices\nGuest waiting Lounge Area\nSwimming Pool and fully equipped pump room\nGround Floor Dining area\nOutdoor guest Male and Female shower and toilets at the deck area\nRecommended Brand quality silent power generator with Automatic changeover control system\nWater pressuring pump system both installed on ground floor and rooftop water tank system\nFully equipped System Server Room including Servers with software to cater for IPTV Sky Channel & in room movie system, room and property Phones, Hotel PMS, CCTV control, Data Protection Firewall, Vingcard room door lock key control system\nStaff Room and Staff area, toilet and shower\nBranded and fully functional lift with emergency rescue device installed\nFully functional fire protection system, heat & smoke detectors, extinguishers and fire hose requirements as per local authorities\nLinen rooms with storage space at all levels\nFully functional pressured Instant Hot water supply system for the entire building\nStandard Wall paintings and coverings\nFully equipped and functional water storage tanks for fresh water supply to the entire building\nFully functional high floor Bar, Restaurant, Kitchen and Dining\nFully functional Conference room to handle around 350 people\nConference break-out meeting rooms at least 2 to handle 30pax in room\nEntire property network and Wifi setup electronic key, smart door lock\nGym\nSpa\nShop",
                          customNotes: ""
                        });
                        triggerNotification("Draft has been reset.", "info");
                      }
                    }}
                    className="text-[9px] font-mono text-rose-600 hover:underline hover:text-rose-700"
                  >
                    Reset and Clear Draft
                  </button>
                )}
              </div>
            </div>

            {/* VISUAL PROGRESS TRACKER */}
            <div className="mb-8">
              <div className="grid grid-cols-4 gap-2">
                {[
                  { step: 1, name: "Template & Preset", desc: "Select document type" },
                  { step: 2, name: "Signatory Party", desc: "Owner & contact details" },
                  { step: 3, name: "Asset Description", desc: "Hotel name & inventory" },
                  { step: 4, name: "Commercials", desc: "Management fees & covenants" }
                ].map((s) => {
                  const isActive = formStep === s.step;
                  const isCompleted = formStep > s.step;
                  return (
                    <button
                      key={s.step}
                      type="button"
                      onClick={() => {
                        // Allow skipping backwards freely, but forward only if we have filled the basic title
                        if (s.step < formStep || builderForm.title) {
                          setFormStep(s.step);
                        }
                      }}
                      className={cn(
                        "text-left p-3 border transition-all relative flex flex-col justify-between h-20 rounded-none",
                        isActive ? "border-[#C5A02D] bg-[#FAF7F2] shadow-sm" :
                        isCompleted ? "border-[#0B1C33]/30 bg-white" :
                        "border-slate-100 bg-slate-50/50 opacity-60 cursor-not-allowed"
                      )}
                    >
                      <div className="flex items-center justify-between w-full">
                        <span className={cn(
                          "text-[10px] font-mono font-black",
                          isActive ? "text-[#C5A02D]" : "text-slate-400"
                        )}>
                          0{s.step}
                        </span>
                        {isCompleted && <span className="text-emerald-600 text-xs font-bold">✓</span>}
                      </div>
                      <div className="mt-auto">
                        <p className={cn(
                          "text-[10px] font-display uppercase tracking-wider font-bold truncate block w-full",
                          isActive ? "text-[#0B1C33]" : "text-slate-500"
                        )}>
                          {s.name}
                        </p>
                        <p className="text-[9px] text-slate-400 font-serif italic truncate hidden md:block">
                          {s.desc}
                        </p>
                      </div>
                      {isActive && (
                        <div className="absolute bottom-0 left-0 h-[2px] bg-[#C5A02D] w-full animate-pulse" />
                      )}
                    </button>
                  );
                })}
              </div>
              {/* Numeric Indicator */}
              <div className="flex items-center justify-between mt-3 px-1 text-[10px] text-slate-400 font-mono">
                <span>Step {formStep} of 4</span>
                <span>{Math.round(((formStep) / 4) * 100)}% Complete</span>
              </div>
            </div>

            {/* FORM CONTAINER */}
            <form onSubmit={handleCreateAgreement} className="space-y-6">
              
              {/* STEP 1: PRESET & TEMPLATE IDENTIFICATION */}
              {formStep === 1 && (
                <div className="space-y-6 animate-fadeIn">
                  <div className="bg-[#FAF7F2] p-4 border border-[#C5A02D]/25 grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-3">
                      <span className="text-[9px] font-display uppercase tracking-widest text-[#C5A02D] font-bold block mb-1">Pre-fill presets from properties database:</span>
                      <p className="text-[10px] text-slate-400 mb-2 font-serif italic">Selecting a preset automatically populates default covenants to accelerate the draft.</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setPrefilledTarget("ramada")}
                      className={cn(
                        "p-4 border text-left flex flex-col justify-between transition-all rounded-none",
                        prefilledTarget === "ramada" ? "border-[#C5A02D] bg-white shadow-md text-[#0B1C33]" : "border-slate-200 hover:border-slate-300 text-slate-500"
                      )}
                    >
                      <span className="text-xs font-bold">Ramada Plaza & Suites</span>
                      <span className="text-[9px] font-mono mt-1 opacity-70">Lot 2 Northern Press, 298 Keys</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPrefilledTarget("wyndham")}
                      className={cn(
                        "p-4 border text-left flex flex-col justify-between transition-all rounded-none",
                        prefilledTarget === "wyndham" ? "border-[#C5A02D] bg-white shadow-md text-[#0B1C33]" : "border-slate-200 hover:border-slate-300 text-slate-500"
                      )}
                    >
                      <span className="text-xs font-bold">Wyndham Garden Beach</span>
                      <span className="text-[9px] font-mono mt-1 opacity-70">Lot 3 Wailoaloa Rd, 120 Keys</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPrefilledTarget("custom")}
                      className={cn(
                        "p-4 border text-left flex flex-col justify-between transition-all rounded-none",
                        prefilledTarget === "custom" ? "border-[#C5A02D] bg-white shadow-md text-[#0B1C33]" : "border-slate-200 hover:border-slate-300 text-slate-500"
                      )}
                    >
                      <span className="text-xs font-bold">Blank Custom Agreement</span>
                      <span className="text-[9px] font-mono mt-1 opacity-70">Manually enter all covenants</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Choose Legal Template */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-display uppercase tracking-wider text-[#0B1C33] font-bold">Choose Legal Template</label>
                      <select
                        value={selectedTemplate}
                        onChange={(e) => setSelectedTemplate(e.target.value)}
                        className="w-full border border-slate-200 p-2.5 text-xs bg-[#FDFBF7] focus:border-[#C5A02D] outline-none font-bold text-[#0B1C33]"
                      >
                        <option>Hotel Management LOI</option>
                        <option>Hotel Management Agreement</option>
                        <option>Technical Services Agreement</option>
                        <option>Consultancy Agreement</option>
                        <option>NDA</option>
                        <option>Custom Agreement</option>
                      </select>
                    </div>

                    {/* Agreement Title */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-display uppercase tracking-wider text-[#0B1C33] font-bold">Agreement Title</label>
                      <input
                        type="text"
                        required
                        value={builderForm.title}
                        onChange={(e) => setBuilderForm({ ...builderForm, title: e.target.value })}
                        className="w-full border border-slate-200 p-2 text-xs bg-[#FDFBF7] focus:border-[#C5A02D] outline-none font-semibold text-[#0B1C33]"
                        placeholder="Enter agreement title..."
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 2: OWNER SIGNATORY PARTY DETAILS */}
              {formStep === 2 && (
                <div className="space-y-6 animate-fadeIn">
                  <div className="border-b border-slate-100 pb-2">
                    <span className="text-[11px] font-display uppercase tracking-widest text-[#C5A02D] font-bold block">OWNER SIGNATORY PARTY INFORMATION</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Owner Name */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-display uppercase tracking-wider text-[#0B1C33] font-bold">Owner Representative Name</label>
                      <input
                        type="text"
                        required
                        value={builderForm.ownerName}
                        onChange={(e) => setBuilderForm({ ...builderForm, ownerName: e.target.value })}
                        className="w-full border border-slate-200 p-2 text-xs bg-[#FDFBF7] focus:border-[#C5A02D] outline-none"
                        placeholder="Charles"
                      />
                    </div>

                    {/* Owner Email */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-display uppercase tracking-wider text-[#0B1C33] font-bold">Owner Email (For Alerts)</label>
                      <input
                        type="email"
                        required
                        value={builderForm.ownerEmail}
                        onChange={(e) => setBuilderForm({ ...builderForm, ownerEmail: e.target.value })}
                        className="w-full border border-slate-200 p-2 text-xs bg-[#FDFBF7] focus:border-[#C5A02D] outline-none"
                        placeholder="digitalmedia@cml.com.fj"
                      />
                    </div>

                    {/* Owner Phone */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-display uppercase tracking-wider text-[#0B1C33] font-bold">Owner Phone Number</label>
                      <input
                        type="text"
                        value={builderForm.ownerPhone}
                        onChange={(e) => setBuilderForm({ ...builderForm, ownerPhone: e.target.value })}
                        className="w-full border border-slate-200 p-2 text-xs bg-[#FDFBF7] focus:border-[#C5A02D] outline-none"
                        placeholder="+679 672 8885"
                      />
                    </div>

                    {/* Owner Corporate Entity Name & Address */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-display uppercase tracking-wider text-[#0B1C33] font-bold">Owner Corporate Entity Name & Address</label>
                      <textarea
                        required
                        rows={3}
                        value={builderForm.ownerDetails}
                        onChange={(e) => {
                          const lines = e.target.value.split('\n');
                          setBuilderForm({ 
                            ...builderForm, 
                            ownerDetails: e.target.value,
                            ownerCompany: lines[0] || ""
                          });
                        }}
                        className="w-full border border-slate-200 p-2 text-xs bg-[#FDFBF7] focus:border-[#C5A02D] outline-none font-sans"
                        placeholder="Koro Fiji-Nadi Bay Sands Investment Limited&#10;Lot 2 Northern Press Rd, Martintar, Nadi Fiji"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 3: ASSET DESCRIPTION & KEYS */}
              {formStep === 3 && (
                <div className="space-y-6 animate-fadeIn">
                  <div className="border-b border-slate-100 pb-2">
                    <span className="text-[11px] font-display uppercase tracking-widest text-[#C5A02D] font-bold block">ASSET DESCRIPTION & KEY INVENTORIES</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Hotel Name */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-display uppercase tracking-wider text-[#0B1C33] font-bold">Asset (Hotel Name)</label>
                      <input
                        type="text"
                        required
                        value={builderForm.hotelName}
                        onChange={(e) => setBuilderForm({ ...builderForm, hotelName: e.target.value })}
                        className="w-full border border-slate-200 p-2 text-xs bg-[#FDFBF7] focus:border-[#C5A02D] outline-none font-bold"
                      />
                    </div>

                    {/* Asset Physical Address */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-display uppercase tracking-wider text-[#0B1C33] font-bold">Asset Physical Address</label>
                      <input
                        type="text"
                        value={builderForm.hotelAddress}
                        onChange={(e) => setBuilderForm({ ...builderForm, hotelAddress: e.target.value })}
                        className="w-full border border-slate-200 p-2 text-xs bg-[#FDFBF7] focus:border-[#C5A02D] outline-none"
                      />
                    </div>

                    {/* Room Inventory (Keys) */}
                    <div className="md:col-span-2 space-y-1">
                      <label className="text-[10px] font-display uppercase tracking-wider text-[#0B1C33] font-bold">Room Inventory (Keys)</label>
                      <input
                        type="text"
                        value={builderForm.inventory}
                        onChange={(e) => setBuilderForm({ ...builderForm, inventory: e.target.value })}
                        className="w-full border border-slate-200 p-2 text-xs bg-[#FDFBF7] focus:border-[#C5A02D] outline-none font-mono"
                        placeholder="e.g. 88 Apartments & 210 hotel rooms (Total 298 Keys)"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 4: COVENANTS & FACILITIES */}
              {formStep === 4 && (
                <div className="space-y-6 animate-fadeIn">
                  <div className="border-b border-slate-100 pb-2">
                    <span className="text-[11px] font-display uppercase tracking-widest text-[#C5A02D] font-bold block">COMMERCIAL COVENANTS & DESIGNATED FACILITIES</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Management Fee */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-display uppercase tracking-wider text-[#0B1C33] font-bold">Management Fee Percentage</label>
                      <input
                        type="text"
                        value={builderForm.managementFee}
                        onChange={(e) => setBuilderForm({ ...builderForm, managementFee: e.target.value })}
                        className="w-full border border-slate-200 p-2 text-xs bg-[#FDFBF7] focus:border-[#C5A02D] outline-none"
                      />
                    </div>

                    {/* Technical Service Fee */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-display uppercase tracking-wider text-[#0B1C33] font-bold">Technical Services Advisory Fee (TSF)</label>
                      <input
                        type="text"
                        value={builderForm.techFee}
                        onChange={(e) => setBuilderForm({ ...builderForm, techFee: e.target.value })}
                        className="w-full border border-slate-200 p-2 text-xs bg-[#FDFBF7] focus:border-[#C5A02D] outline-none"
                      />
                    </div>

                    {/* Initial Term */}
                    <div className="md:col-span-2 space-y-1">
                      <label className="text-[10px] font-display uppercase tracking-wider text-[#0B1C33] font-bold">Initial Management Term Covenants</label>
                      <input
                        type="text"
                        value={builderForm.initialTerm}
                        onChange={(e) => setBuilderForm({ ...builderForm, initialTerm: e.target.value })}
                        className="w-full border border-slate-200 p-2 text-xs bg-[#FDFBF7] focus:border-[#C5A02D] outline-none"
                      />
                    </div>

                    {/* Facilities List */}
                    <div className="md:col-span-2 space-y-1">
                      <label className="text-[10px] font-display uppercase tracking-wider text-[#0B1C33] font-bold">Designated Facilities (One item per line)</label>
                      <textarea
                        rows={6}
                        value={builderForm.facilitiesText}
                        onChange={(e) => setBuilderForm({ ...builderForm, facilitiesText: e.target.value })}
                        className="w-full border border-slate-200 p-2 text-xs bg-[#FDFBF7] focus:border-[#C5A02D] outline-none font-mono leading-relaxed"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Action / Navigation Buttons */}
              <div className="flex items-center justify-between pt-6 border-t border-slate-100">
                {/* Left Side: Cancel or Back */}
                {formStep > 1 ? (
                  <button
                    type="button"
                    onClick={() => setFormStep(step => step - 1)}
                    className="px-6 py-2.5 border border-[#0B1C33] text-[11px] font-display uppercase tracking-widest font-black text-[#0B1C33] hover:bg-slate-50 transition-all"
                  >
                    ← Previous Step
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setActiveSubView("dashboard")}
                    className="px-6 py-2.5 border border-slate-200 text-[11px] font-display uppercase tracking-widest font-black text-slate-500 hover:bg-slate-50 transition-all"
                  >
                    Cancel
                  </button>
                )}

                {/* Right Side: Next or Submit */}
                {formStep < 4 ? (
                  <button
                    type="button"
                    onClick={() => {
                      if (formStep === 1 && !builderForm.title) {
                        triggerNotification("Please fill out the Agreement Title to proceed.", "error");
                        return;
                      }
                      setFormStep(step => step + 1);
                    }}
                    className="px-8 py-2.5 bg-[#0B1C33] text-[#C5A02D] hover:bg-[#C5A02D] hover:text-[#0B1C33] text-[11px] font-display uppercase tracking-widest font-black transition-all border border-[#0B1C33] hover:border-[#C5A02D]"
                  >
                    Next Step →
                  </button>
                ) : (
                  <button
                    type="submit"
                    className="px-10 py-3 bg-[#0B1C33] text-[#C5A02D] hover:bg-[#C5A02D] hover:text-[#0B1C33] text-[11px] font-display uppercase tracking-widest font-black transition-all border border-[#0B1C33] hover:border-[#C5A02D] shadow-md hover:shadow-lg"
                  >
                    Draft Agreement & Pre-file ✓
                  </button>
                )}
              </div>

            </form>
          </div>
        )}

        {/* ==================== 3. LUXURY AGREEMENT VIEW & SIGN VIEW ==================== */}
        {activeSubView === "viewer" && selectedAgreement && (
          <div className="space-y-8">
            
            {/* Viewer Controls */}
            <div className="bg-white border border-slate-200 p-4 shadow-sm flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setActiveSubView("dashboard")}
                  className="px-4 py-2 border border-slate-200 text-xs font-display uppercase tracking-widest font-bold text-slate-500 hover:bg-slate-50 flex items-center gap-1"
                >
                  ← Back to desk
                </button>
                <div className="h-5 w-[1px] bg-slate-200" />
                <span className="text-xs text-slate-400 font-mono">ID: {selectedAgreement.id} • Version {selectedAgreement.version}</span>
              </div>

              {/* Document Lock/Status banner */}
              <div className="flex items-center gap-3">
                <span className={cn(
                  "px-3 py-1.5 text-[9px] font-display uppercase tracking-wider font-black border",
                  selectedAgreement.status === "Completed" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-amber-50 text-amber-700 border-[#C5A02D]/40"
                )}>
                  {selectedAgreement.status === "Completed" ? "DOCUMENT SECURED & locked" : "AWAITING DIGITAL signatures"}
                </span>

                <div className="flex gap-2">
                  <button
                    onClick={() => downloadAgreement(selectedAgreement)}
                    className="px-3 py-1.5 bg-[#FAF7F2] text-[#0B1C33] text-[10px] font-display uppercase tracking-widest font-bold flex items-center gap-1.5 border border-slate-300 hover:bg-[#0B1C33] hover:text-[#C5A02D] transition-all"
                    title="Download Term Sheet as a file"
                  >
                    <Download size={12} /> Download PC Copy
                  </button>
                  <button
                    onClick={() => window.print()}
                    className="px-3 py-1.5 bg-[#0B1C33] text-[#C5A02D] text-[10px] font-display uppercase tracking-widest font-bold flex items-center gap-1.5 border border-[#0B1C33] hover:bg-[#C5A02D] hover:text-[#0B1C33] transition-all"
                    title="Open print panel / save PDF"
                  >
                    <Printer size={12} /> Print / Save PDF
                  </button>
                </div>
              </div>
            </div>

            {/* DOCUMENT VIEW STYLE TAB SWITCHER */}
            <div className="flex border-b border-slate-200 bg-white">
              <button
                onClick={() => setDocViewTab("legal")}
                className={cn(
                  "px-6 py-3.5 text-[10px] font-display uppercase tracking-[0.15em] font-bold transition-all relative border-t-2 flex items-center gap-2",
                  docViewTab === "legal"
                    ? "border-t-[#0B1C33] text-[#0B1C33] bg-white font-black"
                    : "border-t-transparent text-slate-400 hover:text-slate-600 hover:bg-slate-50/50"
                )}
              >
                📜 Official Legal Term Sheet
              </button>
              <button
                onClick={() => setDocViewTab("designed")}
                className={cn(
                  "px-6 py-3.5 text-[10px] font-display uppercase tracking-[0.15em] font-bold transition-all relative border-t-2 flex items-center gap-2",
                  docViewTab === "designed"
                    ? "border-t-[#0B1C33] text-[#0B1C33] bg-white font-black"
                    : "border-t-transparent text-slate-400 hover:text-slate-600 hover:bg-slate-50/50"
                )}
              >
                ✨ Premium Presentation Slides
              </button>
              <button
                onClick={() => setDocViewTab("excel")}
                className={cn(
                  "px-6 py-3.5 text-[10px] font-display uppercase tracking-[0.15em] font-bold transition-all relative border-t-2 flex items-center gap-2",
                  docViewTab === "excel"
                    ? "border-t-[#0B1C33] text-[#0B1C33] bg-white font-black"
                    : "border-t-transparent text-slate-400 hover:text-slate-600 hover:bg-slate-50/50"
                )}
              >
                📋 Interactive Label Form (Live Excel)
              </button>
            </div>

            {/* TWO-COLUMN LAYOUT: DOCUMENT VS SIGN PANEL */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* LUXURY INVESTMENT-STYLE DOCUMENT VIEWER (2 cols) */}
              <div className="lg:col-span-2 space-y-12 overflow-y-auto max-h-[80vh] pr-4 custom-scrollbar bg-white border border-slate-200/80 p-8 shadow-md">
                
                {docViewTab === "legal" ? (
                  /* ==================== OFFICIAL LEGAL TERM SHEET DRAFT ==================== */
                  <div className="bg-[#FAF8F5] border-2 border-slate-200 p-6 md:p-10 shadow-inner text-[#1A2536] space-y-8 font-serif leading-relaxed text-[13px] rounded-sm">
                    
                    {/* Header */}
                    <div className="text-center space-y-2 border-b-2 border-slate-300 pb-6">
                      <h2 className="text-xl font-bold tracking-tight font-sans uppercase text-[#0B1C33]">TERM SHEET</h2>
                      <h3 className="text-sm font-bold font-sans uppercase text-[#C5A02D] tracking-widest">HOTEL AGREEMENTS</h3>
                      <p className="text-[11px] italic text-slate-500 max-w-xl mx-auto leading-normal">
                        This Term Sheet is a summary of key terms for discussion purposes only, and is not a comprehensive list of all terms and fees applicable to the definitive agreements. It is a non-binding summary subject to negotiation and change. No legally binding obligations will be created, implied or inferred with respect to either party until appropriate documents in final form regarding the terms are duly executed.
                      </p>
                    </div>

                    {/* Parties Section */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 border-b border-slate-200 pb-6">
                      <div className="space-y-1">
                        <h4 className="font-sans font-bold uppercase text-[10px] tracking-wider text-slate-500">Owner</h4>
                        <p className="font-bold text-[#0B1C33]">{selectedAgreement.ownerCompany}</p>
                        <p className="text-xs text-slate-600">{selectedAgreement.hotelAddress}</p>
                      </div>
                      <div className="space-y-1">
                        <h4 className="font-sans font-bold uppercase text-[10px] tracking-wider text-slate-500">Manager</h4>
                        <p className="font-bold text-[#0B1C33]">Cove Management Pte Ltd</p>
                        <p className="text-xs text-slate-600">Lot 14, Wasawasa Rd, Wailoaloa Beach, Nadi</p>
                      </div>
                    </div>

                    {/* Hotel Details */}
                    <div className="space-y-4">
                      <h4 className="font-sans font-bold uppercase text-xs tracking-wider text-[#0B1C33] border-b-2 border-[#C5A02D]/40 pb-1 flex items-center justify-between">
                        <span>HOTEL DETAILS</span>
                        <span className="text-[9px] text-slate-400 font-mono">SECTION I</span>
                      </h4>
                      <div className="space-y-3">
                        <div className="grid grid-cols-3 gap-2 border-b border-slate-100 pb-2">
                          <span className="font-sans font-semibold text-xs text-slate-500">Hotel Brand</span>
                          <span className="col-span-2 text-slate-800">Ramada Plaza - subject to final approval by Wyndham Hotels and Resorts</span>
                        </div>
                        <div className="grid grid-cols-3 gap-2 border-b border-slate-100 pb-2">
                          <span className="font-sans font-semibold text-xs text-slate-500">Proposed Hotel Name</span>
                          <span className="col-span-2 text-slate-800 font-bold">{selectedAgreement.hotelName} – or as agreed between the parties and subject to board approval of Manager.</span>
                        </div>
                        <div className="grid grid-cols-3 gap-2 border-b border-slate-100 pb-2">
                          <span className="font-sans font-semibold text-xs text-slate-500">Franchise Agreement</span>
                          <span className="col-span-2 text-slate-700 text-xs">
                            Owner acknowledges and agrees that Manager will enter into a Franchise Agreement with Wyndham Hotel Asia Pacific Co. Ltd (Wyndham) - the terms of which will be negotiated between Manager and Wyndham. All costs associated with the Franchise Agreement shall be operational costs of the hotel.
                          </span>
                        </div>
                        <div className="grid grid-cols-3 gap-2 border-b border-slate-100 pb-2">
                          <span className="font-sans font-semibold text-xs text-slate-500">Hotel Address</span>
                          <span className="col-span-2 text-slate-800">{selectedAgreement.hotelAddress}</span>
                        </div>
                        <div className="grid grid-cols-3 gap-2 border-b border-slate-100 pb-2">
                          <span className="font-sans font-semibold text-xs text-slate-500">Development Type</span>
                          <span className="col-span-2 text-slate-800">New Build</span>
                        </div>
                        
                        {/* Facilities */}
                        <div className="pt-2">
                          <span className="font-sans font-bold text-xs text-[#0B1C33] block mb-2">Designated Facilities ({selectedAgreement.facilities.length} Items)</span>
                          <div className="bg-white p-4 border border-slate-200 max-h-64 overflow-y-auto rounded-sm space-y-1.5 custom-scrollbar shadow-inner">
                            {selectedAgreement.facilities.map((fac, index) => (
                              <div key={index} className="flex gap-2 text-xs text-slate-700 hover:bg-slate-50 p-1 rounded-sm transition-all">
                                <span className="font-mono text-[10px] text-[#C5A02D] font-bold shrink-0">[{String(index + 1).padStart(2, '0')}]</span>
                                <span>{fac}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Rental Program */}
                    <div className="space-y-2 pt-2">
                      <h4 className="font-sans font-bold uppercase text-xs tracking-wider text-[#0B1C33] border-b-2 border-[#C5A02D]/40 pb-1 flex items-center justify-between">
                        <span>RENTAL PROGRAM / RESIDENTIAL SALES</span>
                        <span className="text-[9px] text-slate-400 font-mono">SECTION II</span>
                      </h4>
                      <p className="text-slate-700 italic bg-white p-3 border border-slate-100 text-xs shadow-sm">
                        Owner will continue to own all Facilities in the hotel and will not individually sell any of the guest rooms – all bookings are to go through Management reservations systems.
                      </p>
                    </div>

                    {/* Dates & Milestones */}
                    <div className="space-y-3 pt-2">
                      <h4 className="font-sans font-bold uppercase text-xs tracking-wider text-[#0B1C33] border-b-2 border-[#C5A02D]/40 pb-1 flex items-center justify-between">
                        <span>DATES & TERM COVENANTS</span>
                        <span className="text-[9px] text-slate-400 font-mono">SECTION III</span>
                      </h4>
                      <div className="space-y-2">
                        <div className="grid grid-cols-3 gap-2 border-b border-slate-100 pb-2">
                          <span className="font-sans font-semibold text-xs text-slate-500">Initial Term</span>
                          <span className="col-span-2 text-slate-800">{selectedAgreement.initialTerm}</span>
                        </div>
                        <div className="grid grid-cols-3 gap-2 border-b border-slate-100 pb-2">
                          <span className="font-sans font-semibold text-xs text-slate-500">Renewal Term(s)</span>
                          <span className="col-span-2 text-slate-800">{selectedAgreement.renewalTerm}</span>
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                          <span className="font-sans font-semibold text-xs text-slate-500">Milestone Dates</span>
                          <span className="col-span-2 text-xs text-slate-800 space-y-1 block">
                            <p className="flex justify-between max-w-sm border-b border-slate-50 pb-1">
                              <span className="text-slate-500">Construction Commencement:</span> 
                              <strong className="text-[#0B1C33]">Commenced</strong>
                            </p>
                            <p className="flex justify-between max-w-sm border-b border-slate-50 pb-1">
                              <span className="text-slate-500">Construction Completion:</span> 
                              <strong className="text-slate-600">XXXX</strong>
                            </p>
                            <p className="flex justify-between max-w-sm">
                              <span className="text-slate-500">Opening Date:</span> 
                              <strong className="text-slate-600">XXXXX</strong>
                            </p>
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Management Fees */}
                    <div className="space-y-2 pt-2">
                      <h4 className="font-sans font-bold uppercase text-xs tracking-wider text-[#0B1C33] border-b-2 border-[#C5A02D]/40 pb-1 flex items-center justify-between">
                        <span>MANAGEMENT FEES</span>
                        <span className="text-[9px] text-slate-400 font-mono">SECTION IV</span>
                      </h4>
                      <div className="grid grid-cols-3 gap-2 bg-white p-3 border border-slate-100 shadow-sm">
                        <span className="font-sans font-bold text-xs text-slate-600 self-center">Management Fee Structure</span>
                        <span className="col-span-2 text-slate-800 text-xs">
                          Owner agrees to allocate <strong>20% of the Gross Operating Profit (GOP)</strong> of the hotel to Manager as a Management Fee payable monthly in arrears. For the avoidance of doubt, GOP is defined as per Definitions Schedule below.
                        </span>
                      </div>
                    </div>

                    {/* Technical Services */}
                    <div className="space-y-2 pt-2">
                      <h4 className="font-sans font-bold uppercase text-xs tracking-wider text-[#0B1C33] border-b-2 border-[#C5A02D]/40 pb-1 flex items-center justify-between">
                        <span>TECHNICAL SERVICES</span>
                        <span className="text-[9px] text-slate-400 font-mono">SECTION V</span>
                      </h4>
                      <div className="grid grid-cols-3 gap-2 bg-white p-3 border border-slate-100 shadow-sm">
                        <span className="font-sans font-bold text-xs text-slate-600 self-center">Technical Advisory Fee</span>
                        <span className="col-span-2 text-slate-800 text-xs font-medium">
                          {selectedAgreement.techFee}
                        </span>
                      </div>
                    </div>

                    {/* Other Key Matters */}
                    <div className="space-y-4 pt-2">
                      <h4 className="font-sans font-bold uppercase text-xs tracking-wider text-[#0B1C33] border-b-2 border-[#C5A02D]/40 pb-1 flex items-center justify-between">
                        <span>OTHER KEY MATTERS & COVENANTS</span>
                        <span className="text-[9px] text-slate-400 font-mono">SECTION VI</span>
                      </h4>
                      <div className="space-y-3 text-xs">
                        <div className="space-y-1 bg-white p-3 border border-slate-100 shadow-sm rounded-sm">
                          <span className="font-sans font-bold text-xs text-[#0B1C33] block">FF&E Reserve Fund</span>
                          <p className="text-slate-700 leading-normal">
                            The following amounts will be transferred monthly from the operating account of the Hotel to a reserve fund for the Hotel: <br />
                            • <strong className="text-[#0B1C33]">5%</strong> of Gross Revenues for the first Operating Year; <br />
                            • <strong className="text-[#0B1C33]">6%</strong> of Gross Revenues for the second and third Operating Year; and <br />
                            • <strong className="text-[#0B1C33]">7%</strong> of Gross Revenues for the fourth Operating Year and each subsequent Operating Year. <br />
                            Amounts in such Reserve fund will be used for routine capital and FF&E improvements.
                          </p>
                        </div>
                        <div className="space-y-1 bg-white p-3 border border-slate-100 shadow-sm rounded-sm">
                          <span className="font-sans font-bold text-xs text-[#0B1C33] block">Reserve Sinking Fund</span>
                          <p className="text-slate-700 leading-normal">
                            Manager will reserve monthly Sinking Fund for the Hotel at rate of <strong>5% off the Gross Revenue</strong>, capped at <strong>$250k</strong> for any major upkeep, renovation & replacement works and to be utilized as a working capital under unseen circumstances situations. <br />
                            Owner will be contributing <strong>$150k initially</strong> towards to this Reserve Sinking fund account to be utilized as working capital by the Manager to start its hotel operations and Manager to build up Sinking fund account monthly by said deduction process.
                          </p>
                        </div>
                        <div className="space-y-1 bg-white p-3 border border-slate-100 shadow-sm rounded-sm">
                          <span className="font-sans font-bold text-xs text-[#0B1C33] block">Key Owner Responsibilities</span>
                          <ul className="text-slate-700 list-decimal pl-4 space-y-1">
                            <li>Open Hotel by no later than the agreed Opening Date.</li>
                            <li>Acquire and construct the Hotel in compliance with all applicable laws and regulations and according to the Hotel Brand Standards.</li>
                            <li>Approve the annual plan in accordance with the procedures of the Management Agreement.</li>
                            <li>Retain responsibility for working capital, property taxes, debt services and the like.</li>
                            <li>Obtain and maintain appropriate insurance.</li>
                            <li>Wyndham initial design set up fee.</li>
                            <li>Provide working capital in the sinking fund account as per above Reserve Sinking Fund clause.</li>
                          </ul>
                        </div>
                        <div className="grid grid-cols-3 gap-2 bg-white p-3 border border-slate-100 shadow-sm">
                          <span className="font-sans font-bold text-xs text-slate-600">Settlement Currency</span>
                          <span className="col-span-2 text-slate-800">All payments to Manager under the Management Agreement shall be made in <strong>Fijian Dollars (FJD)</strong></span>
                        </div>
                      </div>
                    </div>

                    {/* Definitions Schedule */}
                    <div className="space-y-4 pt-2">
                      <h4 className="font-sans font-bold uppercase text-xs tracking-wider text-[#0B1C33] border-b-2 border-[#C5A02D]/40 pb-1 flex items-center justify-between">
                        <span>DEFINITIONS SCHEDULE</span>
                        <span className="text-[9px] text-slate-400 font-mono">SCHEDULE I</span>
                      </h4>
                      <div className="space-y-4 text-xs text-slate-700">
                        <div className="bg-white p-3 border border-slate-100 shadow-sm">
                          <p className="font-bold font-sans text-slate-800">“Gross Operating Profit”</p>
                          <p className="pl-3 border-l-2 border-[#C5A02D] italic text-slate-600 mt-1">
                            means for any period, an amount by which Gross Revenue exceeds Operating Expenses for such period.
                          </p>
                        </div>
                        
                        <div className="bg-white p-3 border border-slate-100 shadow-sm space-y-2">
                          <p className="font-bold font-sans text-slate-800">“Gross Revenues”</p>
                          <p className="pl-3 border-l-2 border-[#C5A02D] text-slate-600 leading-relaxed text-[11px]">
                            means, in respect of any period, all revenues, receipts and income of every kind derived directly or indirectly during such period from all or any part of the Hotel, as finally determined on an accrual basis in accordance with GAAP, including: (i) all Gross Room Revenues and all other rentals and charges for guest rooms, suites, meeting rooms, conference rooms, ballrooms and other public rooms, including all charges for room reservations and deposits not refunded to guests; (ii) all sales of food and beverages, whether served on or off the premises, including all charges for room service, banquets and catering fees; (iii) all sales or leases of miscellaneous and sundry merchandise and services including laundry, valet, garage, parking, telephone, telex, telecopy, e-mail, Internet, check room, vault and other miscellaneous services, cover and minimum charges for guest entertainment, fees charged for the temporary use of facilities at the Hotel, all sales through vending machines and all other receipts from business conducted by, through or under Manager at, in, on, about or from the Hotel; (iv) all business interruption insurance awards received in respect of the Hotel; (v) Condemnation awards for temporary use of the Hotel; (vi) all rentals, fees, commissions, concessions and other payments derived from lessees, licensees and concessionaires; (vii) all charges, rentals and other proceeds from any and all recreational and other activities and services conducted in connection with the Hotel; and (viii) any service charges charged to patrons or guests and not distributed to Hotel employees.
                          </p>
                          <div className="pt-1 border-t border-slate-100">
                            <p className="font-sans font-bold text-slate-700 text-[11px]">Gross Revenues for any such period do not include:</p>
                            <ul className="list-decimal pl-6 space-y-1 text-[11px] text-slate-500 mt-1">
                              <li>Excise, sales and use taxes or similar impositions collected directly from patrons or guests or included as part of the sales price of any goods or services and paid to any Governmental Authority, such as gross receipts, admission or similar equivalent taxes;</li>
                              <li>Sales and other receipts of tenants, licensees and concessionaires, except to the extent payable as rent under a lease or occupancy agreement;</li>
                              <li>Insurance proceeds (subject, however, to the inclusion of business interruption insurance proceeds as provided in clause (iv) above);</li>
                              <li>Condemnation awards, except as provided in clause (v) above.</li>
                            </ul>
                          </div>
                        </div>

                        <div className="bg-white p-3 border border-slate-100 shadow-sm space-y-2">
                          <p className="font-bold font-sans text-slate-800">“Operating Expenses”</p>
                          <p className="pl-3 border-l-2 border-[#C5A02D] text-slate-600 leading-relaxed text-[11px]">
                            means all ordinary and necessary expenses incurred in the Operation of the Hotel in accordance with this Agreement, including all (a) costs of employees of Hotel and all other Reimbursable Expenses, (b) all expenses for maintenance and repair, (c) costs for utilities, (d) administrative expenses, including all costs and expenses relating to the Operating Accounts and preparation of financial statements, (e) costs and expenses for marketing, advertising and promotion of the Hotel, and (f) amounts payable to Manager as set forth in this Agreement, all as determined in accordance with Uniform Systems of Accounts.
                          </p>
                          <div className="pt-1 border-t border-slate-100">
                            <p className="font-sans font-bold text-slate-700 text-[11px]">Operating Expenses expressly exclude the following:</p>
                            <ul className="list-roman pl-6 space-y-1 text-[11px] text-slate-500 mt-1">
                              <li>The Incentive Fees and Base Fees/License Fees;</li>
                              <li>Taxes;</li>
                              <li>All insurance costs as provided in Exhibit E;</li>
                              <li>Reserve fund contributions and any expenditures for routine capital improvements and other capital improvements;</li>
                              <li>Costs for the rental of real or personal property (except, with respect to personal property, rentals incurred directly in connection with revenue generating activities);</li>
                              <li>Any depreciation and amortization of capital assets;</li>
                              <li>Costs for the administration of Owner (including any board of shareholder meetings) or Owner’s personnel (other than Hotel employees), including salaries, wages, employee benefits and reimbursements of Owner’s directors, officers, employees or agents; and</li>
                              <li>Fees and costs for professional services, including the fees and expenses of attorneys, accountants and appraisers, incurred directly or indirectly in connection with any category of expense that is not itself an Operating Expense.</li>
                            </ul>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Execution blocks */}
                    <div className="space-y-6 border-t-2 border-slate-300 pt-6">
                      <h4 className="font-sans font-bold uppercase text-xs tracking-wider text-center text-slate-600">SIGNATURE PARTIES SIGN-OFF</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 text-xs">
                        
                        {/* Owner sign block */}
                        <div className="space-y-2">
                          <p className="font-bold font-sans uppercase text-[10px] text-slate-500">OWNER EXECUTION</p>
                          <div className="bg-white border border-slate-200 p-4 min-h-[110px] flex flex-col justify-between shadow-sm">
                            {selectedAgreement.ownerSignature ? (
                              <>
                                {selectedAgreement.ownerSignature.method === "type" ? (
                                  <div className="font-serif italic text-xl border-b border-slate-200 pb-1 text-[#0B1C33]">
                                    {selectedAgreement.ownerSignature.data}
                                  </div>
                                ) : (
                                  <img src={selectedAgreement.ownerSignature.data} alt="Owner Signature" className="max-h-12 object-contain mr-auto" />
                                )}
                                <div className="text-[10px] font-mono mt-2 space-y-0.5 text-slate-500">
                                  <p>By: <strong>{selectedAgreement.ownerSignature.signedBy}</strong></p>
                                  <p>Title: {selectedAgreement.ownerSignature.title}</p>
                                  <p>Date: {selectedAgreement.ownerSignature.date}</p>
                                </div>
                              </>
                            ) : (
                              <div className="text-slate-400 italic text-xs my-auto">Awaiting Owner Signature</div>
                            )}
                          </div>
                          <p className="font-sans font-bold text-xs text-slate-700">{selectedAgreement.ownerCompany}</p>
                        </div>

                        {/* Manager sign block */}
                        <div className="space-y-2">
                          <p className="font-bold font-sans uppercase text-[10px] text-slate-500">COVE MANAGER EXECUTION</p>
                          <div className="bg-white border border-slate-200 p-4 min-h-[110px] flex flex-col justify-between shadow-sm">
                            {selectedAgreement.managerSignature ? (
                              <>
                                <div className="font-serif italic text-xl border-b border-slate-200 pb-1 text-[#0B1C33]">
                                  {selectedAgreement.managerSignature.signedBy}
                                </div>
                                <div className="text-[10px] font-mono mt-2 space-y-0.5 text-slate-500">
                                  <p>By: <strong>{selectedAgreement.managerSignature.signedBy}</strong></p>
                                  <p>Title: {selectedAgreement.managerSignature.title}</p>
                                  <p>Date: {selectedAgreement.managerSignature.date}</p>
                                </div>
                              </>
                            ) : (
                              <div className="text-slate-400 italic text-xs my-auto">
                                {selectedAgreement.status === "Signed" ? (
                                  <span className="text-amber-600 font-bold animate-pulse">Awaiting Counter-Signature</span>
                                ) : (
                                  "Awaiting Manager Counter-Sign"
                                )}
                              </div>
                            )}
                          </div>
                          <p className="font-sans font-bold text-xs text-slate-700">Cove Management Pte Ltd</p>
                        </div>

                      </div>
                    </div>

                  </div>
                ) : docViewTab === "excel" ? (
                  /* ==================== INTERACTIVE LABELED SPREADSHEET FORM ==================== */
                  <div className="bg-slate-50 border border-slate-200 p-2 md:p-4 shadow-sm text-slate-800 rounded-sm">
                    {/* Excel Bar */}
                    <div className="flex items-center justify-between bg-[#107C41] text-white px-4 py-2 font-display uppercase tracking-wider text-[11px] font-bold shadow-sm mb-4 rounded-t-sm">
                      <div className="flex items-center gap-2">
                        <span className="bg-white text-[#107C41] font-black px-1.5 py-0.5 rounded-sm text-[10px]">XLS</span>
                        <span>CML_LOI_Term_Sheet_Template.xlsx (Live Sync)</span>
                      </div>
                      <span className="text-[9px] bg-emerald-800 px-2 py-0.5 rounded-full text-emerald-100 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                        LIVE FORM FILLING ACTIVE
                      </span>
                    </div>

                    <div className="overflow-x-auto border border-slate-200 bg-white shadow-inner">
                      <table className="w-full border-collapse font-sans text-xs">
                        <thead>
                          <tr className="bg-slate-100 border-b border-slate-200 text-slate-500 font-bold select-none text-[11px]">
                            <th className="w-10 border-r border-slate-200 py-1.5 text-center font-normal"></th>
                            <th className="w-1/3 border-r border-slate-200 px-4 text-left font-semibold">Column A: Label Form Fields</th>
                            <th className="px-4 text-left font-semibold">Column B: Sheet Values (Click and Edit Live)</th>
                          </tr>
                        </thead>
                        <tbody>
                          {[
                            { key: "ownerDetails", label: "Owner Party (Corporate Entity & Address)", category: "PARTIES", isLong: true },
                            { key: "managerDetails", label: "Manager Party (Corporate Entity & Address)", category: "PARTIES", isLong: true },
                            { key: "hotelBrand", label: "Hotel Brand Approval", category: "HOTEL DETAILS" },
                            { key: "hotelName", label: "Proposed Hotel Name", category: "HOTEL DETAILS" },
                            { key: "franchiseAgreement", label: "Franchise Agreement Terms", category: "HOTEL DETAILS", isLong: true },
                            { key: "hotelAddress", label: "Hotel Location Address", category: "HOTEL DETAILS" },
                            { key: "developmentType", label: "Development / Build Type", category: "HOTEL DETAILS" },
                            { key: "facilitiesText", label: "Facilities (One item per line)", category: "HOTEL DETAILS", isLong: true, isList: true },
                            { key: "rentalProgram", label: "Rental / Residential Program", category: "HOTEL DETAILS", isLong: true },
                            { key: "initialTerm", label: "Initial Agreement Term", category: "DATES & TERM", isLong: true },
                            { key: "renewalTerm", label: "Renewal Option Covenants", category: "DATES & TERM" },
                            { key: "milestoneDates", label: "Milestone Target Dates", category: "DATES & TERM", isLong: true },
                            { key: "managementFee", label: "Management Fee (GOP %)", category: "FEES & COMMERCIALS", isLong: true },
                            { key: "techFee", label: "Technical Services Fee", category: "FEES & COMMERCIALS", isLong: true },
                            { key: "ffeReserve", label: "FF&E Reserve Account Terms", category: "OTHER COVENANTS", isLong: true },
                            { key: "sinkingFund", label: "Operating Sinking Fund Terms", category: "OTHER COVENANTS", isLong: true },
                            { key: "ownerResponsibilities", label: "Key Owner Obligations", category: "OTHER COVENANTS", isLong: true },
                            { key: "currency", label: "Transaction / Operating Currency", category: "OTHER COVENANTS" }
                          ].reduce((acc: any[], item, idx) => {
                            if (idx === 0 || item.category !== acc[acc.length - 1]?.categoryName) {
                              acc.push({ isHeader: true, categoryName: item.category });
                            }
                            acc.push({ ...item, rowNum: acc.length + 1 });
                            return acc;
                          }, []).map((row, index) => {
                            if (row.isHeader) {
                              return (
                                <tr key={`hdr-${index}`} className="bg-slate-100 border-b border-slate-200">
                                  <td className="border-r border-slate-200 bg-slate-100 py-1 text-center font-mono text-[10px] text-slate-400 select-none">{index + 1}</td>
                                  <td colSpan={2} className="px-4 py-1.5 font-display text-[9px] uppercase tracking-widest font-black text-[#C5A02D] bg-[#0B1C33]/90">
                                    ✦ {row.categoryName}
                                  </td>
                                </tr>
                              );
                            }

                            const val = row.isList
                              ? (selectedAgreement.facilities || []).join("\n")
                              : ((selectedAgreement as any)[row.key] || "");

                            return (
                              <tr key={`row-${index}`} className="border-b border-slate-200 hover:bg-slate-50/40 group">
                                <td className="border-r border-slate-200 bg-slate-100 text-center font-mono text-[10px] text-slate-400 select-none py-2">{index + 1}</td>
                                <td className="border-r border-slate-200 px-4 py-2 font-display text-[10px] tracking-wider text-slate-600 font-bold bg-slate-50/30">
                                  {row.label}
                                </td>
                                <td className="px-3 py-1 font-mono text-xs">
                                  {row.isLong ? (
                                    <textarea
                                      rows={row.isList ? 8 : 3}
                                      value={val}
                                      onChange={(e) => {
                                        if (row.isList) {
                                          updateAgreementField("facilities", e.target.value.split("\n"));
                                        } else {
                                          updateAgreementField(row.key as keyof Agreement, e.target.value);
                                        }
                                      }}
                                      className="w-full bg-transparent p-1.5 outline-none font-mono text-xs text-slate-800 border border-transparent focus:border-[#107C41] focus:bg-white focus:ring-1 focus:ring-[#107C41] transition-all rounded-sm resize-y"
                                      placeholder={`Enter ${row.label.toLowerCase()}...`}
                                    />
                                  ) : (
                                    <input
                                      type="text"
                                      value={val}
                                      onChange={(e) => updateAgreementField(row.key as keyof Agreement, e.target.value)}
                                      className="w-full bg-transparent p-1.5 outline-none font-mono text-xs text-slate-800 border border-transparent focus:border-[#107C41] focus:bg-white focus:ring-1 focus:ring-[#107C41] transition-all rounded-sm"
                                      placeholder={`Enter ${row.label.toLowerCase()}...`}
                                    />
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* PAGE 1: COVER PAGE */}
                    <div className="min-h-[75vh] border-4 border-double border-[#C5A02D]/20 p-8 flex flex-col justify-between bg-gradient-to-b from-[#0B1C33] to-[#122846] text-white relative overflow-hidden">
                  {/* Decorative curved shape resembling the gold frame in Image 1 */}
                  <div className="absolute right-0 bottom-0 w-80 h-80 bg-cover bg-center opacity-30 mix-blend-overlay" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&q=80&w=800')" }} />
                  <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(circle_at_top_right,rgba(197,160,45,0.15)_0%,transparent_60%)] pointer-events-none" />

                  {/* Cove Logo Header */}
                  <div className="flex flex-col items-center pt-8">
                    <img 
                      src="https://cml.com.fj/wp-content/uploads/2026/05/CML-Thumbnail-Logo-2.jpg" 
                      alt="CML Logo" 
                      className="h-20 w-auto object-contain filter brightness-100 contrast-120 drop-shadow-[0_0_10px_rgba(197,160,45,0.4)]"
                      referrerPolicy="no-referrer"
                    />
                    <span className="text-[10px] font-display uppercase tracking-[0.3em] text-[#C5A02D] font-bold mt-3">Cove Management</span>
                    <span className="text-[7px] font-mono text-slate-400">PTE LTD</span>
                  </div>

                  <div className="my-16 space-y-4 text-center md:text-left md:pl-8">
                    <span className="h-0.5 w-16 bg-[#C5A02D] block mb-6 mx-auto md:mx-0" />
                    <h1 className="text-4xl md:text-5xl font-serif tracking-tight leading-none text-white">
                      HOTEL MANAGEMENT <br />
                      <span className="text-[#C5A02D] font-light italic">AGREEMENT</span>
                    </h1>
                    <p className="text-[#C5A02D] font-display text-sm uppercase tracking-widest font-black mt-2">
                      {selectedAgreement.templateType.toUpperCase()}
                    </p>
                    
                    <div className="pt-8">
                      <p className="text-xl font-serif italic text-slate-200">{selectedAgreement.hotelName}</p>
                      <p className="text-[10px] font-display uppercase tracking-wider text-[#C5A02D] mt-1">{selectedAgreement.hotelAddress}</p>
                    </div>
                  </div>

                  <div className="flex flex-col md:flex-row md:items-end justify-between border-t border-white/10 pt-6 text-[10px] font-display text-slate-400">
                    <div className="space-y-1">
                      <p className="uppercase tracking-widest font-bold">CONFIDENTIAL COVENANT</p>
                      <p className="font-mono text-[9px]">DRAFT REFERENCE: {selectedAgreement.id}</p>
                    </div>
                    <p className="uppercase tracking-widest font-bold text-[#C5A02D] mt-3 md:mt-0">JULY 2026 • FILE LOCKED ON SECURE SHA-256</p>
                  </div>
                </div>

                {/* PAGE 2: EXECUTIVE SUMMARY */}
                <div className="space-y-8 py-8 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <span className="text-lg font-mono text-[#C5A02D] font-bold">01.</span>
                    <h2 className="text-2xl font-serif text-[#0B1C33] italic">Why Partner with Cove Management?</h2>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed max-w-2xl">
                    Cove Management Pte Ltd is a premier hotel management company delivering exceptional hospitality experiences and maximizing asset value for hotel owners across the South Pacific.
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                    {[
                      { title: "PROVEN EXPERIENCE", desc: "Track record of successfully managing high-yield hotels and premium residential portfolios across the Pacific region." },
                      { title: "INTERNATIONAL BRAND PARTNERS", desc: "Strong alignments with world-class hospitality franchises, ensuring compliance with global standards including Wyndham & Ramada." },
                      { title: "REVENUE OPTIMIZATION", desc: "Data-driven yield strategies, modern channels, and automated rate management to maximize ADR, occupancy, and GOP." },
                      { title: "ASSET SECURITY & MAINTENANCE", desc: "Ensuring long-term appreciation of physical structures and grounds via world-class engineering, SOPs, and QA checks." }
                    ].map((feat, idx) => (
                      <div key={idx} className="bg-[#FAF7F2] p-4 border-l-2 border-[#C5A02D] space-y-1">
                        <span className="text-[9px] font-display uppercase tracking-wider font-bold text-[#0B1C33]">{feat.title}</span>
                        <p className="text-[11px] text-slate-500 leading-normal">{feat.desc}</p>
                      </div>
                    ))}
                  </div>

                  <div className="bg-[#0B1C33] p-6 text-center shadow-md relative overflow-hidden mt-6">
                    <div className="absolute top-0 left-0 w-1.5 h-full bg-[#C5A02D]" />
                    <p className="text-[#C5A02D] font-serif italic text-sm leading-relaxed max-w-xl mx-auto">
                      &ldquo;Our absolute commitment is to protect your asset, maximize operating returns, and deliver exceptional guest experiences aligned fully with ownership vision.&rdquo;
                    </p>
                  </div>
                </div>

                {/* PAGE 3: PROJECT OVERVIEW */}
                <div className="space-y-8 py-8 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <span className="text-lg font-mono text-[#C5A02D] font-bold">02.</span>
                    <h2 className="text-2xl font-serif text-[#0B1C33] italic">Project Overview</h2>
                  </div>

                  <div className="border border-slate-200 overflow-hidden shadow-sm">
                    <table className="w-full text-left text-xs divide-y divide-slate-100">
                      <tbody>
                        {[
                          { label: "HOTEL BRAND", value: selectedAgreement.templateType.includes("Wyndham") ? "Wyndham Garden (Worldwide)" : "Ramada Plaza by Wyndham" },
                          { label: "PROPOSED NAME", value: selectedAgreement.hotelName },
                          { label: "HOTEL ADDRESS", value: selectedAgreement.hotelAddress },
                          { label: "DEVELOPMENT TYPE", value: "New Build & Managed Luxury Resort" },
                          { label: "TOTAL INVENTORY", value: selectedAgreement.inventory },
                          { label: "COMMERCIAL SCOPE", value: selectedAgreement.managementFee },
                          { label: "TECHNICAL SERVICE FEE", value: selectedAgreement.techFee }
                        ].map((row, idx) => (
                          <tr key={idx} className={cn("divide-x divide-slate-100", idx % 2 === 0 ? "bg-[#FAF7F2]/50" : "bg-white")}>
                            <td className="py-3 px-4 font-display uppercase tracking-wider text-[9px] text-[#0B1C33] font-bold w-1/3">{row.label}</td>
                            <td className="py-3 px-4 text-slate-700 font-serif italic">{row.value}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Nice resort image preview */}
                  <div className="h-44 bg-cover bg-center shadow-md border border-slate-200" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1540541338287-41700207dee6?auto=format&fit=crop&q=80&w=800')" }} />
                </div>

                {/* PAGE 4: COMMERCIAL TERMS & COVENANTS */}
                <div className="space-y-8 py-8 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <span className="text-lg font-mono text-[#C5A02D] font-bold">03.</span>
                    <h2 className="text-2xl font-serif text-[#0B1C33] italic">Commercial Terms & Fees</h2>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    
                    {/* Management Fee Circle */}
                    <div className="md:col-span-1 bg-[#FAF7F2] border border-[#C5A02D]/35 p-6 flex flex-col items-center text-center justify-center space-y-3 shadow-sm">
                      <div className="text-4xl font-serif text-[#0B1C33] font-black">{selectedAgreement.managementFee.includes("20%") ? "20%" : "2.5%"}</div>
                      <span className="text-[9px] font-display uppercase tracking-widest text-amber-800 font-bold">BASE MANAGEMENT FEE</span>
                      <p className="text-[10px] text-slate-500 italic">Of Gross Operating Profit (GOP) payable monthly in arrears.</p>
                    </div>

                    <div className="md:col-span-2 space-y-4">
                      <div className="bg-[#0B1C33] text-white p-4">
                        <span className="text-[8px] font-display uppercase tracking-widest text-[#C5A02D] font-bold block mb-1">TECHNICAL SERVICES FEE (TSF)</span>
                        <p className="text-sm font-serif italic text-slate-200">{selectedAgreement.techFee}</p>
                        <p className="text-[9px] text-slate-400 mt-1 leading-normal">Covers architectural advisory, MEP compliance, and Wyndham brand standards review prior to opening.</p>
                      </div>

                      <div className="border border-slate-100 p-4 space-y-2">
                        <span className="text-[9px] font-display uppercase tracking-wider text-slate-800 font-bold block">RESERVE FUNDS & SINKING CAPITAL</span>
                        <ul className="text-[10px] text-slate-500 space-y-1.5 list-disc pl-4 leading-normal">
                          <li><strong>FF&E Reserve:</strong> Monthly transfer of 5% of Gross Revenues in Year 1, 6% in Years 2-3, and 7% from Year 4 onwards to finance future soft goods refurbishments.</li>
                          <li><strong>Sinking Fund:</strong> Monthly transfer of 5% of Gross Revenue capped at $250k. Owner to initial contribute $150,000 for working capital.</li>
                        </ul>
                      </div>
                    </div>

                  </div>
                </div>

                {/* PAGE 5: SHARED RESPONSIBILITIES */}
                <div className="space-y-8 py-8 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <span className="text-lg font-mono text-[#C5A02D] font-bold">04.</span>
                    <h2 className="text-2xl font-serif text-[#0B1C33] italic">Shared Commitments & Covenants</h2>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-[11px]">
                    
                    {/* Owner */}
                    <div className="space-y-3">
                      <div className="bg-[#FAF7F2] p-2.5 border-t-2 border-[#C5A02D] font-display uppercase tracking-widest text-[#0B1C33] font-bold">
                        OWNER RESPONSIBILITIES
                      </div>
                      <ul className="space-y-2 text-slate-600 list-inside list-decimal leading-relaxed">
                        <li>Construction and outfitting of the hotel strictly in accordance with brand standards.</li>
                        <li>Funding of all capital expenditures (CapEx) and structural upgrades.</li>
                        <li>Maintaining adequate property, structural, and liability insurance policies.</li>
                        <li>Timely payment of all government taxes, rates, and lease fees.</li>
                        <li>Provision of ongoing operational working capital requested by Manager.</li>
                        <li>Securing structural repairs and prompt approvals for key operations.</li>
                      </ul>
                    </div>

                    {/* Manager */}
                    <div className="space-y-3">
                      <div className="bg-[#0B1C33] text-[#C5A02D] p-2.5 font-display uppercase tracking-widest font-bold">
                        MANAGER (COVE) RESPONSIBILITIES
                      </div>
                      <ul className="space-y-2 text-slate-600 list-inside list-decimal leading-relaxed">
                        <li>Exclusive day-to-day management and operational control of the property.</li>
                        <li>Recruitment, training, and supervision of all operational staff.</li>
                        <li>Procurement of reservations, yield management, and distribution.</li>
                        <li>Detailed financial reporting, monthly P&L audits, and cash reconciliations.</li>
                        <li>Implementation of brand standards, health-safety protocols, and QA tests.</li>
                        <li>Guest relations, marketing campaigns, and quality service execution.</li>
                      </ul>
                    </div>

                  </div>
                </div>

                {/* PAGE 6: FACILITIES LIST */}
                {selectedAgreement.facilities.length > 0 && (
                  <div className="space-y-8 py-8 border-b border-slate-100">
                    <div className="flex items-center gap-3">
                      <span className="text-lg font-mono text-[#C5A02D] font-bold">05.</span>
                      <h2 className="text-2xl font-serif text-[#0B1C33] italic">Designated Assets & Facilities</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {selectedAgreement.facilities.map((fac, i) => (
                        <div key={i} className="flex items-center gap-2 text-xs text-slate-700 bg-[#FAF7F2]/40 p-2 border border-slate-100">
                          <CheckCircle2 size={13} className="text-[#C5A02D] shrink-0" />
                          <span className="font-serif italic">{fac}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* PAGE 7: SIGNATURE DISCLOSURE */}
                <div className="space-y-8 py-8">
                  <div className="flex items-center gap-3">
                    <span className="text-lg font-mono text-[#C5A02D] font-bold">06.</span>
                    <h2 className="text-2xl font-serif text-[#0B1C33] italic">Acceptance & Execution</h2>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    By applying digital signatures, the Parties acknowledge they have reviewed, understood, and consented to the specific legal covenants and operational terms set forth under this Cove Management Limited (CML) Hotel Owner Framework.
                  </p>

                  <div className="grid grid-cols-2 gap-8 border border-slate-200 p-6 bg-[#FAF7F2]/30">
                    
                    {/* Owner side */}
                    <div className="space-y-4">
                      <span className="text-[10px] font-display uppercase tracking-wider text-slate-800 font-bold block">AUTHORIZED OWNER SIGNATORY</span>
                      
                      {selectedAgreement.ownerSignature ? (
                        <div className="space-y-2 border-t border-slate-200 pt-3">
                          {selectedAgreement.ownerSignature.method === "type" ? (
                            <div className="p-4 bg-white border border-slate-200/60 font-serif italic text-2xl text-navy-950 tracking-wider text-[#0B1C33] bg-amber-50/10">
                              {selectedAgreement.ownerSignature.data}
                            </div>
                          ) : (
                            <div className="bg-white p-2 border border-slate-200 flex items-center justify-center h-20">
                              <img src={selectedAgreement.ownerSignature.data} alt="Owner Signature" className="max-h-16 object-contain" />
                            </div>
                          )}
                          <div className="text-[10px] text-slate-500 font-mono space-y-0.5">
                            <p>Signed By: <strong>{selectedAgreement.ownerSignature.signedBy}</strong></p>
                            <p>Title: {selectedAgreement.ownerSignature.title}</p>
                            <p>Date Apply: {selectedAgreement.ownerSignature.date}</p>
                            <p className="text-[#10B981] font-bold">✓ SECURED VIA DIGI-KEY</p>
                          </div>
                        </div>
                      ) : (
                        <div className="py-8 text-center text-slate-400 italic text-[11px] border border-dashed border-slate-200">
                          Pending Owner Signature
                        </div>
                      )}
                    </div>

                    {/* Manager side */}
                    <div className="space-y-4">
                      <span className="text-[10px] font-display uppercase tracking-wider text-slate-800 font-bold block">AUTHORIZED COVE MANAGER</span>
                      
                      {selectedAgreement.managerSignature ? (
                        <div className="space-y-2 border-t border-slate-200 pt-3">
                          <div className="p-4 bg-white border border-slate-200/60 font-serif italic text-2xl text-emerald-950 tracking-wider text-[#0B1C33] bg-emerald-50/10">
                            {selectedAgreement.managerSignature.signedBy}
                          </div>
                          <div className="text-[10px] text-slate-500 font-mono space-y-0.5">
                            <p>Counter-Signed: <strong>Cove Management Pte Ltd</strong></p>
                            <p>Title: {selectedAgreement.managerSignature.title}</p>
                            <p>Date Apply: {selectedAgreement.managerSignature.date}</p>
                            <p className="text-[#10B981] font-bold">✓ SSL CERTIFICATE LOCK</p>
                          </div>
                        </div>
                      ) : (
                        <div className="py-8 text-center text-slate-400 italic text-[11px] border border-dashed border-slate-200">
                          {selectedAgreement.status === "Signed" ? (
                            <span className="text-amber-600 font-semibold animate-pulse">✓ Signed by Owner! Awaiting Manager Counter-Sign</span>
                          ) : (
                            <span>Pending Counter-Signing</span>
                          )}
                        </div>
                      )}
                    </div>

                  </div>
                </div>

                  </>
                )}
              </div>


              {/* INTERACTIVE DIGITAL SIGNING DESK / AUDIT DETAILS SIDEBAR (1 col) */}
              <div className="space-y-6">
                
                {/* 1. SIGN PANEL (Conditional on active signature status) */}
                {selectedAgreement.status !== "Completed" && (
                  <div className="bg-white border border-[#C5A02D]/40 shadow-lg p-6 relative">
                    <div className="absolute top-0 left-0 right-0 h-1 bg-[#C5A02D]" />
                    
                    <h3 className="text-lg font-serif italic text-[#0B1C33] mb-1">Digital Signing Desk</h3>
                    <p className="text-[10px] font-display uppercase tracking-widest text-[#C5A02D] font-bold mb-6">Execution Covenants</p>

                    {/* Scenario A: Owner signing */}
                    {role === "owner" && !selectedAgreement.ownerSignature && (
                      <div className="space-y-5">
                        
                        {/* Signer Info inputs */}
                        <div className="space-y-3">
                          <div className="space-y-1">
                            <label className="text-[9px] font-display uppercase tracking-wider text-slate-500 font-bold">Your Name</label>
                            <input 
                              type="text" 
                              value={signingName} 
                              onChange={(e) => setSigningName(e.target.value)}
                              className="w-full border border-slate-200 p-2 text-xs focus:border-[#C5A02D] outline-none bg-[#FDFBF7]"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[9px] font-display uppercase tracking-wider text-slate-500 font-bold">Title / Designation</label>
                            <input 
                              type="text" 
                              value={signingTitle} 
                              onChange={(e) => setSigningTitle(e.target.value)}
                              className="w-full border border-slate-200 p-2 text-xs focus:border-[#C5A02D] outline-none bg-[#FDFBF7]"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[9px] font-display uppercase tracking-wider text-slate-500 font-bold">Company</label>
                            <input 
                              type="text" 
                              value={signingCompany} 
                              onChange={(e) => setSigningCompany(e.target.value)}
                              className="w-full border border-slate-200 p-2 text-xs focus:border-[#C5A02D] outline-none bg-[#FDFBF7]"
                            />
                          </div>
                        </div>

                        {/* Sign Method Tab Switcher */}
                        <div className="border border-slate-200 p-1 flex items-center bg-[#FAF7F2]">
                          {(["draw", "type", "upload"] as const).map((method) => (
                            <button
                              key={method}
                              type="button"
                              onClick={() => setSignMethod(method)}
                              className={cn(
                                "flex-1 py-1 text-[9px] font-display uppercase tracking-wider font-black transition-all",
                                signMethod === method ? "bg-[#0B1C33] text-[#C5A02D]" : "text-slate-500 hover:text-slate-800"
                              )}
                            >
                              {method}
                            </button>
                          ))}
                        </div>

                        {/* Signature Methods Canvas / Input */}
                        {signMethod === "draw" && (
                          <div className="space-y-2">
                            <div className="border border-slate-300 bg-[#FAF7F2] relative overflow-hidden flex flex-col">
                              <canvas
                                ref={canvasRef}
                                width={300}
                                height={130}
                                onMouseDown={startDrawing}
                                onMouseMove={draw}
                                onMouseUp={stopDrawing}
                                onMouseLeave={stopDrawing}
                                onTouchStart={startDrawing}
                                onTouchMove={draw}
                                onTouchEnd={stopDrawing}
                                className="w-full cursor-crosshair bg-white touch-none"
                              />
                              <div className="p-2 border-t border-slate-200/80 flex items-center justify-between text-[9px] bg-white">
                                <span className="text-slate-400 italic">Draw your signature with cursor/finger</span>
                                <button type="button" onClick={clearCanvas} className="text-[#C5A02D] hover:underline font-bold">Clear Pad</button>
                              </div>
                            </div>
                          </div>
                        )}

                        {signMethod === "type" && (
                          <div className="space-y-2">
                            <input 
                              type="text" 
                              placeholder="Type your full name..."
                              value={typedSignText}
                              onChange={(e) => setTypedSignText(e.target.value)}
                              className="w-full border border-slate-200 p-2 text-xs focus:border-[#C5A02D] outline-none bg-[#FDFBF7]"
                            />
                            {typedSignText.trim() && (
                              <div className="p-4 border border-[#C5A02D]/35 bg-amber-50/5 text-center font-serif text-2xl italic text-[#0B1C33] tracking-wide bg-[#FAF7F2]">
                                {typedSignText}
                              </div>
                            )}
                          </div>
                        )}

                        {signMethod === "upload" && (
                          <div className="space-y-2">
                            <div 
                              onClick={() => fileInputRef.current?.click()}
                              className="border-2 border-dashed border-slate-200 hover:border-[#C5A02D] p-6 text-center cursor-pointer bg-[#FAF7F2]/50 transition-colors"
                            >
                              <Upload className="mx-auto text-slate-400 mb-2" size={24} />
                              <span className="text-[10px] font-display uppercase tracking-wider text-slate-500 font-bold block">Drag signature photo or click to browse</span>
                              <input 
                                type="file" 
                                ref={fileInputRef}
                                accept="image/*"
                                onChange={handleSignatureUpload}
                                className="hidden" 
                              />
                            </div>
                            {uploadedSignData && (
                              <div className="flex items-center justify-center p-2 border border-slate-200 bg-white">
                                <img src={uploadedSignData} alt="Loaded signature" className="max-h-16 object-contain" />
                              </div>
                            )}
                          </div>
                        )}

                        {/* Checkbox agreement */}
                        <label className="flex items-start gap-2.5 text-[10px] text-slate-600 cursor-pointer pt-2">
                          <input 
                            type="checkbox" 
                            checked={acceptTerms}
                            onChange={(e) => setAcceptTerms(e.target.checked)}
                            className="mt-0.5" 
                          />
                          <span className="leading-tight select-none">I have read the luxury covenants and hereby apply my digital authorized signature to bind the Terms of this framework.</span>
                        </label>

                        {/* Sign Action Button */}
                        <button
                          onClick={handleOwnerSignAgreement}
                          className="w-full py-3 bg-[#0B1C33] text-[#C5A02D] hover:bg-[#C5A02D] hover:text-[#0B1C33] transition-all duration-300 text-[10px] font-display uppercase tracking-widest font-black flex items-center justify-center gap-2 shadow-lg border border-[#0B1C33] hover:border-[#C5A02D]"
                        >
                          <PenTool size={14} /> SIGN AGREEMENT (SECURED)
                        </button>
                      </div>
                    )}

                    {/* Scenario B: Owner signed, awaiting manager counter-signing */}
                    {selectedAgreement.ownerSignature && !selectedAgreement.managerSignature && (
                      <div className="space-y-4">
                        <div className="bg-amber-50 border border-amber-200 p-4 space-y-2">
                          <span className="text-[10px] font-display uppercase tracking-wider text-amber-800 font-bold block">✓ Owner Signed Securely</span>
                          <p className="text-[11px] text-slate-600 leading-normal">
                            Owner representative <strong>{selectedAgreement.ownerSignature.signedBy}</strong> signed this document on {selectedAgreement.ownerSignature.date}.
                          </p>
                        </div>

                        {role === "admin" ? (
                          <div className="space-y-3">
                            <span className="text-xs text-slate-500 italic block">As a Cove Management Director, review the document details and apply counter-signature.</span>
                            
                            <button
                              onClick={handleManagerCounterSign}
                              className="w-full py-3 bg-[#C5A02D] text-[#0B1C33] hover:bg-[#0B1C33] hover:text-[#C5A02D] text-[10px] font-display uppercase tracking-widest font-black flex items-center justify-center gap-1.5 border border-[#C5A02D] hover:border-[#C5A02D] transition-all"
                            >
                              <Lock size={13} /> COUNTER-SIGN & LOCK AGREEMENT
                            </button>
                          </div>
                        ) : (
                          <div className="text-center p-6 bg-slate-50 border border-slate-100 text-slate-400 italic text-xs leading-normal">
                            Awaiting Cove Management executive verification and counter-signature. An alert email has been queued.
                          </div>
                        )}
                      </div>
                    )}

                    {/* Scenario C: You are Admin but Owner hasn't signed yet */}
                    {role === "admin" && !selectedAgreement.ownerSignature && (
                      <div className="bg-blue-50 border border-blue-100 p-6 text-center space-y-3">
                        <Info className="mx-auto text-blue-500" size={24} />
                        <span className="text-xs font-bold text-[#0B1C33] block">Awaiting Owner Signature</span>
                        <p className="text-[10px] text-slate-500 leading-normal">
                          Charles (the property owner) must log into his CML Community portal, read, and apply his signature first.
                        </p>
                        <button
                          onClick={() => { setRole("owner"); triggerNotification("Switched view to Owner Portal", "info"); }}
                          className="px-4 py-2 bg-[#0B1C33] text-white text-[9px] font-display uppercase tracking-wider font-bold block mx-auto"
                        >
                          Simulate Owner Signing
                        </button>
                      </div>
                    )}

                  </div>
                )}

                {/* 2. SUPPORTING DOCUMENTS / UPLOADS */}
                <div className="bg-white border border-slate-200/80 p-6 shadow-sm">
                  <h3 className="text-sm font-display uppercase tracking-wider text-[#0B1C33] font-bold mb-4">Supporting Attachments</h3>
                  
                  {selectedAgreement.supportingDocs.length === 0 ? (
                    <p className="text-[11px] text-slate-400 italic mb-4">No supporting attachments loaded yet.</p>
                  ) : (
                    <div className="space-y-3 mb-4">
                      {selectedAgreement.supportingDocs.map((docItem) => (
                        <div key={docItem.id} className="flex items-center justify-between p-2.5 bg-[#FAF7F2] border border-slate-100 text-xs">
                          <div className="flex items-center gap-2">
                            <FileText size={14} className="text-slate-400 shrink-0" />
                            <div className="truncate">
                              <p className="font-semibold text-slate-800 truncate">{docItem.name}</p>
                              <p className="text-[9px] text-slate-400 font-mono">{docItem.size} • {docItem.date}</p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => downloadAttachmentFile(docItem)}
                            className="p-1 hover:bg-[#C5A02D]/10 text-[#0B1C33] transition-colors"
                            title="Download Attachment"
                          >
                            <Download size={13} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Upload input */}
                  {selectedAgreement.status !== "Completed" && (
                    <div className="pt-2">
                      <input 
                        type="file" 
                        id="supporting-doc-input"
                        className="hidden" 
                        onChange={handleUploadSupportingDoc}
                      />
                      <button
                        onClick={() => document.getElementById("supporting-doc-input")?.click()}
                        className="w-full py-2 border border-dashed border-[#C5A02D]/60 hover:border-[#C5A02D] text-[9px] font-display uppercase tracking-widest font-bold text-[#0B1C33] hover:bg-[#C5A02D]/5 transition-all flex items-center justify-center gap-1.5"
                      >
                        <Upload size={12} /> UPLOAD LAND TITLE / PERMIT
                      </button>
                    </div>
                  )}
                </div>

                {/* 3. AUDIT CERTIFICATE DISPLAY (Clickable once completed) */}
                {selectedAgreement.status === "Completed" && (
                  <div className="bg-[#0B1C33] text-white p-6 shadow-lg border border-[#C5A02D] space-y-4">
                    <div className="flex items-center gap-2 text-[#C5A02D]">
                      <ShieldCheck size={20} />
                      <span className="text-[10px] font-display uppercase tracking-widest font-black">Audit Certificate Secure</span>
                    </div>

                    <div className="text-[10px] space-y-1.5 font-mono text-slate-300">
                      <p>Certificate SHA: <span className="text-[#C5A02D]">8f83a2c0be1...</span></p>
                      <p>Agreement ID: {selectedAgreement.id}</p>
                      <p>Viewed Logged: {selectedAgreement.viewedDate || "N/A"}</p>
                      <p>Owner Signed: {selectedAgreement.ownerSignedDate}</p>
                      <p>Cove Secured: {selectedAgreement.managerSignedDate}</p>
                      <p>System Status: <span className="text-[#10B981] font-bold">✓ LOCKED FOREVER</span></p>
                    </div>

                    <div className="h-[1px] bg-white/10" />
                    <p className="text-[9px] text-slate-400 italic leading-relaxed">
                      This certificate guarantees the electronic document has not been altered since counter-signing. Copies are registered on CML Vault servers.
                    </p>
                  </div>
                )}

              </div>

            </div>

          </div>
        )}

        {/* ==================== 4. VAULT STORAGE ARCHIVE ==================== */}
        {activeSubView === "storage" && (
          <div className="bg-white border border-slate-200 p-8 shadow-md">
            
            {/* Quick Audit / Statistics Bar */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8 bg-[#0B1C33] text-white p-6 border border-[#C5A02D]/40">
              <div className="flex flex-col">
                <span className="text-[9px] font-display uppercase tracking-[0.2em] text-[#C5A02D] font-bold">TOTAL REGISTERED ARCHIVES</span>
                <span className="text-3xl font-serif mt-1 font-bold">{agreements.length} <span className="text-xs text-slate-400 font-sans font-normal">Active Covenants</span></span>
              </div>
              <div className="flex flex-col border-t md:border-t-0 md:border-l border-white/15 pt-3 md:pt-0 md:pl-6">
                <span className="text-[9px] font-display uppercase tracking-[0.2em] text-[#C5A02D] font-bold">PENDING COUNTER-SIGNATURE</span>
                <span className="text-3xl font-serif mt-1 font-bold text-amber-400">
                  {agreements.filter(a => a.status !== "Completed").length} <span className="text-xs text-slate-400 font-sans font-normal">Awaiting Action</span>
                </span>
              </div>
              <div className="flex flex-col border-t md:border-t-0 md:border-l border-white/15 pt-3 md:pt-0 md:pl-6">
                <span className="text-[9px] font-display uppercase tracking-[0.2em] text-[#C5A02D] font-bold">SHA-256 VAULT HEALTH</span>
                <span className="text-3xl font-serif mt-1 font-bold text-emerald-400 flex items-center gap-2">
                  100% <span className="text-xs text-slate-400 font-sans font-normal">Online Secure</span>
                </span>
              </div>
            </div>

            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-slate-100 mb-8">
              <div>
                <h3 className="text-xl font-serif italic text-[#0B1C33]">Secured CML Document Vault</h3>
                <p className="text-xs text-[#C5A02D] font-display uppercase tracking-widest font-bold">Encrypted Archive Storage</p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 text-slate-400" size={13} />
                  <input 
                    type="text" 
                    placeholder="Search secure documents..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8 pr-4 py-2 border border-slate-200 text-xs w-56 focus:outline-none focus:border-[#C5A02D] bg-[#FDFBF7]"
                  />
                </div>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="border border-slate-200 py-2 px-4 text-xs focus:outline-none bg-[#FDFBF7]"
                >
                  <option value="All">All Statuses</option>
                  <option value="Draft">Draft</option>
                  <option value="Awaiting Signature">Awaiting Signature</option>
                  <option value="Completed">Completed Secure</option>
                </select>

                {/* VIEW SWITCHER COMPONENT */}
                <div className="flex border border-slate-200 p-0.5 bg-[#FAF7F2]">
                  <button
                    type="button"
                    onClick={() => setViewMode("grid")}
                    className={cn(
                      "p-1.5 px-3 text-[10px] font-display uppercase tracking-wider font-bold flex items-center gap-1.5 transition-all",
                      viewMode === "grid" ? "bg-[#0B1C33] text-[#C5A02D]" : "text-slate-500 hover:text-slate-800"
                    )}
                    title="Grid View"
                  >
                    <LayoutGrid size={11} /> Grid
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode("list")}
                    className={cn(
                      "p-1.5 px-3 text-[10px] font-display uppercase tracking-wider font-bold flex items-center gap-1.5 transition-all border-l border-r border-slate-200/60",
                      viewMode === "list" ? "bg-[#0B1C33] text-[#C5A02D]" : "text-slate-500 hover:text-slate-800"
                    )}
                    title="List Table View"
                  >
                    <List size={11} /> List
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode("columns")}
                    className={cn(
                      "p-1.5 px-3 text-[10px] font-display uppercase tracking-wider font-bold flex items-center gap-1.5 transition-all",
                      viewMode === "columns" ? "bg-[#0B1C33] text-[#C5A02D]" : "text-slate-500 hover:text-slate-800"
                    )}
                    title="Pipeline Columns View"
                  >
                    <Columns size={11} /> Columns
                  </button>
                </div>
              </div>
            </div>

            {filteredAgreements.length === 0 ? (
              <div className="py-16 text-center text-slate-400 font-serif italic border-2 border-dashed border-slate-100 max-w-lg mx-auto">
                No matching legal documents stored in active partitions.
              </div>
            ) : (
              <div>
                
                {/* 1. GRID VIEW */}
                {viewMode === "grid" && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredAgreements.map((ag) => (
                      <div key={ag.id} className="border border-slate-200 hover:border-[#C5A02D]/60 p-5 bg-[#FAF7F2]/30 flex flex-col justify-between min-h-[385px] h-auto pb-6 relative group transition-all hover:shadow-md">
                        <div>
                          <div className="flex items-center justify-between gap-3 mb-3">
                            <span className="text-[9px] font-mono font-bold text-slate-400">{ag.id}</span>
                            <span className={cn(
                              "px-2 py-0.5 text-[8px] font-display uppercase tracking-wider font-bold border",
                              ag.status === "Completed" ? "bg-emerald-50 text-emerald-700 border-emerald-100" :
                              ag.status === "Signed" ? "bg-purple-50 text-purple-700 border-purple-100" :
                              "bg-amber-50 text-amber-700 border-amber-100"
                            )}>
                              {ag.status}
                            </span>
                          </div>

                          <h4 className="text-sm font-bold text-[#0B1C33] font-serif leading-snug group-hover:text-[#C5A02D] transition-colors">
                            {ag.title}
                          </h4>
                          <p className="text-[11px] text-slate-500 font-serif italic mt-1">{ag.hotelName}</p>

                          <div className="mt-4 pt-4 border-t border-slate-100 space-y-1.5 text-[10px] text-slate-600 font-mono">
                            <p>Tenant Party: <strong>{ag.ownerCompany}</strong></p>
                            <p>Version Limit: v{ag.version}</p>
                            <p>Secured Date: {ag.completedDate || ag.createdDate}</p>
                          </div>
                        </div>

                        <div className="pt-4 border-t border-slate-100/60 mt-4">
                          {/* Premium Quick Action Desk Buttons */}
                          <div className="flex items-center justify-between gap-2 mb-2 pb-2 border-b border-slate-100/40 text-[9px] font-sans">
                            <span className="text-[#C5A02D] font-bold">Quick Desk Actions:</span>
                            <div className="flex items-center gap-1.5">
                              {/* Email Straight to Person */}
                              <a 
                                href={`mailto:${ag.ownerEmail}?subject=Cove Management (CML) - Urgent Review Required: ${encodeURIComponent(ag.title)}&body=Dear ${ag.ownerName},%0A%0APlease review the attached framework agreement for ${encodeURIComponent(ag.hotelName)}: ${encodeURIComponent(ag.id)}.%0A%0AWarm regards,%0ACML Administration`}
                                className="p-1 bg-slate-50 hover:bg-amber-100 hover:text-amber-800 text-slate-500 rounded transition-all border border-slate-200/50"
                                title={`Email Straight to ${ag.ownerName} (${ag.ownerEmail})`}
                              >
                                <Mail size={11} />
                              </a>

                              {/* Contact Client Direct */}
                              <a 
                                href={`tel:${ag.ownerPhone}`}
                                className="p-1 bg-slate-50 hover:bg-emerald-100 hover:text-emerald-800 text-slate-500 rounded transition-all border border-slate-200/50"
                                title={`Call Client Direct (${ag.ownerPhone})`}
                              >
                                <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.94.725l.548 2.2a1 1 0 01-.321.988l-1.305.98a10.582 10.582 0 004.872 4.872l.98-1.305a1 1 0 01.988-.321l2.2.548a1 1 0 01.725.94V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                </svg>
                              </a>

                              {/* Direct message in CML Chat */}
                              <button
                                onClick={() => {
                                  // Trigger notification & tell user they can chat in the widget
                                  triggerNotification(`Initiating secure Workspace chat with ${ag.ownerName}...`, "info");
                                  const openWidgetBtn = document.querySelector('button[title="Open Integrated CML Chat"]') as HTMLButtonElement;
                                  if (openWidgetBtn) {
                                    openWidgetBtn.click();
                                    setTimeout(() => {
                                      // Locate the DM button or presence to initiate chat
                                      const dmId = `dm-${ag.ownerName.toLowerCase().replace(/\s+/g, '-')}`;
                                      const savedSpaces = localStorage.getItem(`cml_custom_spaces_cml`);
                                      let customArr = [];
                                      try { customArr = savedSpaces ? JSON.parse(savedSpaces) : []; } catch(e){}
                                      const exists = customArr.some((s: any) => s.id === dmId);
                                      if (!exists) {
                                        const newS = { id: dmId, name: `👤 ${ag.ownerName}`, description: `Private secure communication with ${ag.ownerName}`, unreadCount: 0 };
                                        localStorage.setItem(`cml_custom_spaces_cml`, JSON.stringify([...customArr, newS]));
                                      }
                                    }, 300);
                                  }
                                }}
                                className="p-1 bg-slate-50 hover:bg-indigo-100 hover:text-indigo-800 text-slate-500 rounded transition-all border border-slate-200/50"
                                title={`Chat with ${ag.ownerName} immediately`}
                              >
                                <MessageSquare size={11} />
                              </button>

                              {/* Download copy */}
                              <button
                                onClick={() => downloadAgreement(ag)}
                                className="p-1 bg-slate-50 hover:bg-blue-100 hover:text-blue-800 text-slate-500 rounded transition-all border border-slate-200/50"
                                title="Download document package"
                              >
                                <Download size={11} />
                              </button>
                            </div>
                          </div>

                          <div className="flex items-center justify-between gap-2 mt-2 text-[10px] font-display font-bold">
                            <button
                              onClick={() => handleViewAgreement(ag)}
                              className="text-[#0B1C33] hover:text-[#C5A02D] transition-colors uppercase tracking-wider flex items-center gap-1"
                            >
                              <Eye size={12} /> REVIEW FRAMEWORK
                            </button>

                            {ag.status === "Completed" ? (
                              <span className="text-[8px] text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100/50">✓ SIGNED & ARCHIVED</span>
                            ) : (
                              <button
                                onClick={() => handleViewAgreement(ag)}
                                className="text-[#C5A02D] hover:underline"
                              >
                                SIGN CONTRACT NOW
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* 2. LIST VIEW (Detailed Corporate Registry Table) */}
                {viewMode === "list" && (
                  <div className="overflow-x-auto border border-slate-200 bg-white">
                    <table className="w-full text-left text-xs divide-y divide-slate-100">
                      <thead>
                        <tr className="bg-[#FAF7F2] text-slate-500 font-display uppercase tracking-wider text-[9px] border-b border-slate-200">
                          <th className="py-4 px-6 font-bold text-[#0B1C33]">Ref ID / Title</th>
                          <th className="py-4 px-6 font-bold text-[#0B1C33]">Hotel Asset</th>
                          <th className="py-4 px-6 font-bold text-[#0B1C33]">Tenant Party / Client</th>
                          <th className="py-4 px-6 font-bold text-[#0B1C33]">Secured Date</th>
                          <th className="py-4 px-6 font-bold text-[#0B1C33]">Status</th>
                          <th className="py-4 px-6 font-bold text-right text-[#0B1C33]">Desk Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 bg-white">
                        {filteredAgreements.map((ag) => (
                          <tr key={ag.id} className="hover:bg-[#FAF8F4]/50 transition-colors group">
                            <td className="py-4 px-6">
                              <div className="font-mono text-[9px] font-bold text-slate-400 mb-1">{ag.id}</div>
                              <div className="font-serif text-sm font-bold text-[#0B1C33] group-hover:text-[#C5A02D] transition-colors leading-tight">
                                {ag.title}
                              </div>
                            </td>
                            <td className="py-4 px-6 font-serif italic text-slate-600">
                              {ag.hotelName}
                            </td>
                            <td className="py-4 px-6">
                              <div className="text-slate-800 font-semibold">{ag.ownerCompany}</div>
                              <div className="text-[10px] text-slate-500 mt-0.5 font-mono">Attn: {ag.ownerName}</div>
                            </td>
                            <td className="py-4 px-6 font-mono text-slate-500 text-[10px]">
                              {ag.completedDate || ag.createdDate}
                            </td>
                            <td className="py-4 px-6">
                              <span className={cn(
                                "px-2.5 py-1 text-[9px] font-display uppercase tracking-wider font-bold border",
                                ag.status === "Completed" ? "bg-emerald-50 text-emerald-700 border-emerald-100" :
                                ag.status === "Signed" ? "bg-purple-50 text-purple-700 border-purple-100" :
                                "bg-amber-50 text-amber-700 border-amber-100"
                              )}>
                                {ag.status}
                              </span>
                            </td>
                            <td className="py-4 px-6 text-right">
                              <div className="flex items-center justify-end gap-2">
                                {/* Email */}
                                <a 
                                  href={`mailto:${ag.ownerEmail}?subject=Cove Management (CML) - Urgent Review Required: ${encodeURIComponent(ag.title)}&body=Dear ${ag.ownerName},%0A%0APlease review the attached framework agreement for ${encodeURIComponent(ag.hotelName)}: ${encodeURIComponent(ag.id)}.%0A%0AWarm regards,%0ACML Administration`}
                                  className="p-1.5 bg-slate-50 hover:bg-amber-100 hover:text-amber-800 text-slate-500 rounded transition-all border border-slate-200/50"
                                  title={`Email ${ag.ownerName}`}
                                >
                                  <Mail size={12} />
                                </a>
                                {/* Phone */}
                                <a 
                                  href={`tel:${ag.ownerPhone}`}
                                  className="p-1.5 bg-slate-50 hover:bg-emerald-100 hover:text-emerald-800 text-slate-500 rounded transition-all border border-slate-200/50"
                                  title={`Call Direct`}
                                >
                                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.94.725l.548 2.2a1 1 0 01-.321.988l-1.305.98a10.582 10.582 0 004.872 4.872l.98-1.305a1 1 0 01.988-.321l2.2.548a1 1 0 01.725.94V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                  </svg>
                                </a>
                                {/* Chat */}
                                <button
                                  onClick={() => {
                                    triggerNotification(`Initiating secure Workspace chat with ${ag.ownerName}...`, "info");
                                    const openWidgetBtn = document.querySelector('button[title="Open Integrated CML Chat"]') as HTMLButtonElement;
                                    if (openWidgetBtn) openWidgetBtn.click();
                                  }}
                                  className="p-1.5 bg-slate-50 hover:bg-indigo-100 hover:text-indigo-800 text-slate-500 rounded transition-all border border-slate-200/50"
                                  title={`Chat with Client`}
                                >
                                  <MessageSquare size={12} />
                                </button>
                                {/* Download */}
                                <button
                                  onClick={() => downloadAgreement(ag)}
                                  className="p-1.5 bg-slate-50 hover:bg-blue-100 hover:text-blue-800 text-slate-500 rounded transition-all border border-slate-200/50"
                                  title="Download Copy"
                                >
                                  <Download size={12} />
                                </button>

                                {/* Review Button */}
                                <button
                                  onClick={() => handleViewAgreement(ag)}
                                  className="px-3 py-1.5 bg-[#0B1C33] text-[#C5A02D] hover:bg-[#C5A02D] hover:text-[#0B1C33] transition-all text-[9px] font-display uppercase tracking-wider font-black ml-2"
                                >
                                  Review
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* 3. COLUMNS VIEW (Pipeline Progress Kanban) */}
                {viewMode === "columns" && (
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    
                    {/* Pipeline 1: Drafts & Sent */}
                    <div className="flex flex-col">
                      <div className="bg-slate-100 border-b-2 border-slate-400 p-4 flex items-center justify-between mb-4">
                        <span className="text-xs font-display uppercase tracking-wider font-extrabold text-slate-800">Drafts & Workspace</span>
                        <span className="bg-slate-200 text-slate-800 px-2.5 py-0.5 text-[10px] font-mono font-bold">
                          {filteredAgreements.filter(a => ["Draft", "Sent", "Viewed"].includes(a.status)).length}
                        </span>
                      </div>
                      <div className="space-y-4 bg-slate-50/50 p-3 border border-slate-200/60 min-h-[480px]">
                        {filteredAgreements.filter(a => ["Draft", "Sent", "Viewed"].includes(a.status)).map(ag => (
                          <div key={ag.id} className="bg-white border border-slate-200 p-4 hover:border-[#C5A02D] shadow-sm transition-all hover:shadow-md flex flex-col justify-between min-h-[200px]">
                            <div>
                              <div className="flex justify-between items-center mb-2">
                                <span className="text-[9px] font-mono text-slate-400 font-bold">{ag.id}</span>
                                <span className="px-1.5 py-0.5 text-[8px] bg-slate-100 border border-slate-200 text-slate-600 font-bold tracking-wider uppercase font-display">{ag.status}</span>
                              </div>
                              <h5 className="text-xs font-bold text-[#0B1C33] font-serif leading-snug line-clamp-2">{ag.title}</h5>
                              <p className="text-[10px] text-slate-500 font-serif italic mt-1">{ag.hotelName}</p>
                              
                              <div className="mt-3 text-[9px] text-slate-500 font-mono space-y-0.5">
                                <p>Party: <span className="font-sans font-bold text-slate-700">{ag.ownerCompany.split(" ")[0]}...</span></p>
                                <p>Created: {ag.createdDate.split(" ")[0]}</p>
                              </div>
                            </div>
                            
                            <div className="pt-3 border-t border-slate-100 mt-3 flex items-center justify-between gap-2">
                              <div className="flex gap-1">
                                <a href={`mailto:${ag.ownerEmail}`} className="p-1 bg-slate-50 border hover:bg-amber-50 text-slate-400 hover:text-amber-700" title="Email"><Mail size={10} /></a>
                                <a href={`tel:${ag.ownerPhone}`} className="p-1 bg-slate-50 border hover:bg-emerald-50 text-slate-400 hover:text-emerald-700"><svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.94.725l.548 2.2a1 1 0 01-.321.988l-1.305.98a10.582 10.582 0 004.872 4.872l.98-1.305a1 1 0 01.988-.321l2.2.548a1 1 0 01.725.94V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg></a>
                              </div>
                              <button onClick={() => handleViewAgreement(ag)} className="text-[10px] font-display font-black text-[#0B1C33] hover:text-[#C5A02D] uppercase tracking-wider flex items-center gap-0.5">
                                Edit <ChevronRight size={10} />
                              </button>
                            </div>
                          </div>
                        ))}
                        {filteredAgreements.filter(a => ["Draft", "Sent", "Viewed"].includes(a.status)).length === 0 && (
                          <div className="text-center py-12 text-slate-400 italic text-[11px]">No matching documents in workspace.</div>
                        )}
                      </div>
                    </div>

                    {/* Pipeline 2: Awaiting Signature / Executable */}
                    <div className="flex flex-col">
                      <div className="bg-amber-500/10 border-b-2 border-amber-500 p-4 flex items-center justify-between mb-4">
                        <span className="text-xs font-display uppercase tracking-wider font-extrabold text-amber-800">Awaiting Signature</span>
                        <span className="bg-amber-500 text-white px-2.5 py-0.5 text-[10px] font-mono font-bold">
                          {filteredAgreements.filter(a => ["Awaiting Signature", "Signed"].includes(a.status)).length}
                        </span>
                      </div>
                      <div className="space-y-4 bg-amber-50/20 p-3 border border-amber-200/40 min-h-[480px]">
                        {filteredAgreements.filter(a => ["Awaiting Signature", "Signed"].includes(a.status)).map(ag => (
                          <div key={ag.id} className="bg-white border border-slate-200 p-4 hover:border-amber-500 shadow-sm transition-all hover:shadow-md flex flex-col justify-between min-h-[200px]">
                            <div>
                              <div className="flex justify-between items-center mb-2">
                                <span className="text-[9px] font-mono text-slate-400 font-bold">{ag.id}</span>
                                <span className="px-1.5 py-0.5 text-[8px] bg-amber-50 border border-amber-150 text-amber-700 font-bold tracking-wider uppercase font-display">{ag.status}</span>
                              </div>
                              <h5 className="text-xs font-bold text-[#0B1C33] font-serif leading-snug line-clamp-2">{ag.title}</h5>
                              <p className="text-[10px] text-slate-500 font-serif italic mt-1">{ag.hotelName}</p>
                              
                              <div className="mt-3 text-[9px] text-slate-500 font-mono space-y-0.5">
                                <p>Signee: <span className="font-sans font-bold text-slate-700">{ag.ownerName}</span></p>
                                <p>Covenant Date: {ag.createdDate.split(" ")[0]}</p>
                              </div>
                            </div>
                            
                            <div className="pt-3 border-t border-slate-100 mt-3 flex items-center justify-between gap-2">
                              <div className="flex gap-1">
                                <a href={`mailto:${ag.ownerEmail}`} className="p-1 bg-slate-50 border hover:bg-amber-50 text-slate-400 hover:text-amber-700" title="Email"><Mail size={10} /></a>
                                <button onClick={() => {
                                  triggerNotification(`Initiating secure Workspace chat with ${ag.ownerName}...`, "info");
                                  const openWidgetBtn = document.querySelector('button[title="Open Integrated CML Chat"]') as HTMLButtonElement;
                                  if (openWidgetBtn) openWidgetBtn.click();
                                }} className="p-1 bg-slate-50 border hover:bg-indigo-50 text-slate-400 hover:text-indigo-700"><MessageSquare size={10} /></button>
                              </div>
                              <button onClick={() => handleViewAgreement(ag)} className="text-[10px] font-display font-black text-amber-700 hover:text-amber-800 uppercase tracking-wider flex items-center gap-0.5">
                                Sign Now <ChevronRight size={10} />
                              </button>
                            </div>
                          </div>
                        ))}
                        {filteredAgreements.filter(a => ["Awaiting Signature", "Signed"].includes(a.status)).length === 0 && (
                          <div className="text-center py-12 text-slate-400 italic text-[11px]">No agreements pending signature.</div>
                        )}
                      </div>
                    </div>

                    {/* Pipeline 3: Encrypted & Completed */}
                    <div className="flex flex-col">
                      <div className="bg-emerald-600/10 border-b-2 border-emerald-600 p-4 flex items-center justify-between mb-4">
                        <span className="text-xs font-display uppercase tracking-wider font-extrabold text-emerald-800">Completed Vault Secure</span>
                        <span className="bg-emerald-600 text-white px-2.5 py-0.5 text-[10px] font-mono font-bold">
                          {filteredAgreements.filter(a => a.status === "Completed").length}
                        </span>
                      </div>
                      <div className="space-y-4 bg-emerald-50/20 p-3 border border-emerald-200/40 min-h-[480px]">
                        {filteredAgreements.filter(a => a.status === "Completed").map(ag => (
                          <div key={ag.id} className="bg-white border border-slate-200 p-4 hover:border-emerald-600 shadow-sm transition-all hover:shadow-md flex flex-col justify-between min-h-[200px]">
                            <div>
                              <div className="flex justify-between items-center mb-2">
                                <span className="text-[9px] font-mono text-slate-400 font-bold">{ag.id}</span>
                                <span className="px-1.5 py-0.5 text-[8px] bg-emerald-50 border border-emerald-150 text-emerald-700 font-bold tracking-wider uppercase font-display">Secured</span>
                              </div>
                              <h5 className="text-xs font-bold text-[#0B1C33] font-serif leading-snug line-clamp-2">{ag.title}</h5>
                              <p className="text-[10px] text-slate-500 font-serif italic mt-1">{ag.hotelName}</p>
                              
                              <div className="mt-3 text-[9px] text-slate-500 font-mono space-y-0.5">
                                <p>Secured Date: <span className="text-emerald-700 font-bold">{ag.completedDate?.split(" ")[0]}</span></p>
                                <p>Certificate: <span className="text-[#C5A02D]">SHA-256 Vaulted</span></p>
                              </div>
                            </div>
                            
                            <div className="pt-3 border-t border-slate-100 mt-3 flex items-center justify-between gap-2">
                              <div className="flex gap-1">
                                <button onClick={() => downloadAgreement(ag)} className="p-1 bg-slate-50 border hover:bg-blue-50 text-slate-400 hover:text-blue-700" title="Download copy"><Download size={10} /></button>
                              </div>
                              <button onClick={() => handleViewAgreement(ag)} className="text-[10px] font-display font-black text-emerald-700 hover:text-emerald-800 uppercase tracking-wider flex items-center gap-0.5">
                                Audit <ChevronRight size={10} />
                              </button>
                            </div>
                          </div>
                        ))}
                        {filteredAgreements.filter(a => a.status === "Completed").length === 0 && (
                          <div className="text-center py-12 text-slate-400 italic text-[11px]">No vaulted secure documents.</div>
                        )}
                      </div>
                    </div>

                  </div>
                )}

              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
