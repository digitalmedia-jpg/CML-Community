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
  Award
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
      "Fully fitted 88 Apartments with 210 key hotel room",
      "Restaurants, Bar & Dining areas",
      "Lobby, Front Office & Guest Lounge",
      "Conference Room (350 pax) & Breakout Rooms",
      "Swimming Pool, Spa & Fitness Centre",
      "High Floor Bar, Restaurant & Kitchen",
      "Power Generator with Automatic Changeover",
      "Water Tank & Pressurised Water Systems"
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

export function AgreementsSigning() {
  // --- STATE ---
  const [agreements, setAgreements] = useState<Agreement[]>(() => {
    const saved = localStorage.getItem("cml_agreements");
    return saved ? JSON.parse(saved) : INITIAL_AGREEMENTS;
  });

  const [activeSubView, setActiveSubView] = useState<"dashboard" | "builder" | "viewer" | "storage">("dashboard");
  const [role, setRole] = useState<"admin" | "owner">("owner"); // Charles is an Owner, but can switch to Admin to build/test!
  const [selectedAgreement, setSelectedAgreement] = useState<Agreement | null>(null);
  
  // Builder state
  const [selectedTemplate, setSelectedTemplate] = useState<string>("Hotel Management LOI");
  const [prefilledTarget, setPrefilledTarget] = useState<"ramada" | "wyndham" | "custom">("ramada");
  const [builderForm, setBuilderForm] = useState({
    title: "",
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
    facilitiesText: "Fully fitted 88 Apartments with 210 key hotel room\nRestaurants, Bar & Dining areas\nLobby, Front Office & Guest Lounge\nConference Room (350 pax) & Breakout Rooms\nSwimming Pool, Spa & Fitness Centre\nHigh Floor Bar, Restaurant & Kitchen",
    customNotes: ""
  });

  // Search/Filter state
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("All");

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

  // Handle template selection pre-fills
  useEffect(() => {
    if (prefilledTarget === "ramada") {
      setBuilderForm({
        title: `${selectedTemplate} – Ramada Plaza & Suites Nadi`,
        ownerName: "Charles",
        ownerCompany: "Koro Fiji-Nadi Bay Sands Investment Limited",
        ownerEmail: "digitalmedia@cml.com.fj",
        ownerPhone: "+679 672 8885",
        hotelName: "Ramada Plaza by Wyndham & Suites",
        hotelAddress: "Lot 2 Northern Press Rd, Martintar, Nadi Fiji",
        inventory: "88 Apartments & 210 hotel rooms (Total 298 Keys)",
        managementFee: "20% of Gross Operating Profit (GOP) payable monthly in arrears",
        techFee: "US$15,000 payable upon contract execution",
        initialTerm: "10 Years from Opening Date",
        renewalTerm: "One (1) further term of Ten (10) Operating Years",
        facilitiesText: "Fully fitted 88 Apartments with 210 key hotel room\nRestaurants, Bar & Dining areas\nLobby, Front Office & Guest Lounge\nConference Room (350 pax) & Breakout Rooms\nSwimming Pool, Spa & Fitness Centre\nHigh Floor Bar, Restaurant & Kitchen",
        customNotes: "Proposed in accordance with Cove Management hospitality standards."
      });
    } else if (prefilledTarget === "wyndham") {
      setBuilderForm({
        title: `${selectedTemplate} – Wyndham Garden Wailoaloa`,
        ownerName: "Charles",
        ownerCompany: "Koro Fiji-Nadi Bay Sands Investment Limited",
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
  }, [selectedTemplate, prefilledTarget]);

  // Show standard notification toast
  const triggerNotification = (message: string, type: "success" | "error" | "info" = "success") => {
    setNotification({ message, type });
    setTimeout(() => {
      setNotification(null);
    }, 5000);
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
    setActiveSubView("dashboard");
    triggerNotification(`Successfully drafted "${builderForm.title}".`, "success");
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

          {/* PORTAL SWITCHER & QUICK STATS */}
          <div className="flex flex-col items-end gap-3 shrink-0">
            <div className="bg-[#142642] p-1.5 border border-[#C5A02D]/30 flex items-center gap-1 rounded-none shadow-inner">
              <span className="text-[9px] font-display uppercase tracking-widest text-[#C5A02D] font-bold px-3">Role Switcher:</span>
              <button 
                onClick={() => { setRole("owner"); triggerNotification("Switched to Owner Portal View", "info"); }}
                className={cn(
                  "px-4 py-1.5 text-[10px] font-display uppercase tracking-wider font-black transition-all",
                  role === "owner" ? "bg-[#C5A02D] text-[#0B1C33] shadow" : "text-slate-300 hover:text-white"
                )}
              >
                Owner Portal
              </button>
              <button 
                onClick={() => { setRole("admin"); triggerNotification("Switched to Cove Admin Portal View", "info"); }}
                className={cn(
                  "px-4 py-1.5 text-[10px] font-display uppercase tracking-wider font-black transition-all",
                  role === "admin" ? "bg-[#C5A02D] text-[#0B1C33] shadow" : "text-slate-300 hover:text-white"
                )}
              >
                CML Admin
              </button>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="h-2 w-2 rounded-full bg-[#10B981] animate-pulse" />
              <span className="text-slate-400">Secure SHA-256 Vault Connected</span>
            </div>
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
              onClick={() => { setActiveSubView("dashboard"); setSelectedAgreement(null); }}
              className={cn(
                "px-5 py-2.5 text-xs font-display uppercase tracking-wider font-bold transition-all border-b-2",
                activeSubView === "dashboard" ? "border-[#C5A02D] text-[#0B1C33] font-black" : "border-transparent text-slate-500 hover:text-[#0B1C33]"
              )}
            >
              Document Dashboard
            </button>
            <button
              onClick={() => { setActiveSubView("storage"); setSelectedAgreement(null); }}
              className={cn(
                "px-5 py-2.5 text-xs font-display uppercase tracking-wider font-bold transition-all border-b-2",
                activeSubView === "storage" ? "border-[#C5A02D] text-[#0B1C33] font-black" : "border-transparent text-slate-500 hover:text-[#0B1C33]"
              )}
            >
              Vault Archives
            </button>
            {role === "admin" && (
              <button
                onClick={() => { setActiveSubView("builder"); setSelectedAgreement(null); }}
                className={cn(
                  "px-5 py-2.5 text-xs font-display uppercase tracking-wider font-bold transition-all border-b-2 flex items-center gap-1.5 text-amber-700",
                  activeSubView === "builder" ? "border-amber-600 text-amber-900 font-black" : "border-transparent hover:text-amber-900"
                )}
              >
                <Plus size={14} /> Create Agreement
              </button>
            )}
          </div>

          <div className="text-xs font-serif italic text-slate-500">
            {role === "owner" ? (
              <span>Viewing as: <strong className="text-[#0B1C33] font-medium font-sans">Charles</strong> (Koro Fiji MD)</span>
            ) : (
              <span className="text-amber-800">Cove Management Admin Controls Active</span>
            )}
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
          <div className="bg-white border border-slate-200 shadow-lg p-8 max-w-4xl mx-auto">
            <div className="text-center mb-8 pb-6 border-b border-slate-100">
              <span className="text-xs font-display uppercase tracking-widest text-[#C5A02D] font-bold">New Agreement Builder</span>
              <h2 className="text-3xl font-serif italic text-[#0B1C33] mt-1">Professional Contract Prefiller</h2>
              <p className="text-xs text-slate-400 mt-2">
                Configure, pre-fill from property assets, and draft legal covenants for hotel owner review.
              </p>
            </div>

            <form onSubmit={handleCreateAgreement} className="space-y-6">
              
              {/* Preset Prefillers */}
              <div className="bg-[#FAF7F2] p-4 border border-[#C5A02D]/25 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-3">
                  <span className="text-[9px] font-display uppercase tracking-widest text-[#C5A02D] font-bold block mb-2">Pre-fill presets from properties database:</span>
                </div>
                <button
                  type="button"
                  onClick={() => setPrefilledTarget("ramada")}
                  className={cn(
                    "p-3 border text-left flex flex-col justify-between transition-all rounded-none",
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
                    "p-3 border text-left flex flex-col justify-between transition-all rounded-none",
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
                    "p-3 border text-left flex flex-col justify-between transition-all rounded-none",
                    prefilledTarget === "custom" ? "border-[#C5A02D] bg-white shadow-md text-[#0B1C33]" : "border-slate-200 hover:border-slate-300 text-slate-500"
                  )}
                >
                  <span className="text-xs font-bold">Blank Custom Agreement</span>
                  <span className="text-[9px] font-mono mt-1 opacity-70">Manually enter all covenants</span>
                </button>
              </div>

              {/* Form Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Select Template */}
                <div className="space-y-1">
                  <label className="text-[10px] font-display uppercase tracking-wider text-[#0B1C33] font-bold">Choose Legal Template</label>
                  <select
                    value={selectedTemplate}
                    onChange={(e) => setSelectedTemplate(e.target.value)}
                    className="w-full border border-slate-200 p-2.5 text-xs bg-[#FDFBF7] focus:border-[#C5A02D] outline-none"
                  >
                    <option>Hotel Management LOI</option>
                    <option>Hotel Management Agreement</option>
                    <option>Technical Services Agreement</option>
                    <option>Consultancy Agreement</option>
                    <option>NDA</option>
                    <option>Custom Agreement</option>
                  </select>
                </div>

                {/* Title */}
                <div className="space-y-1">
                  <label className="text-[10px] font-display uppercase tracking-wider text-[#0B1C33] font-bold">Agreement Title</label>
                  <input
                    type="text"
                    required
                    value={builderForm.title}
                    onChange={(e) => setBuilderForm({ ...builderForm, title: e.target.value })}
                    className="w-full border border-slate-200 p-2 text-xs bg-[#FDFBF7] focus:border-[#C5A02D] outline-none"
                    placeholder="Enter agreement title..."
                  />
                </div>

                <div className="border-t border-slate-100 md:col-span-2 pt-4">
                  <span className="text-[11px] font-display uppercase tracking-widest text-[#C5A02D] font-bold block mb-4">OWNER SIGNATORY PARTY INFORMATION</span>
                </div>

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

                {/* Owner Company */}
                <div className="space-y-1">
                  <label className="text-[10px] font-display uppercase tracking-wider text-[#0B1C33] font-bold">Owner Corporate Entity Name</label>
                  <input
                    type="text"
                    required
                    value={builderForm.ownerCompany}
                    onChange={(e) => setBuilderForm({ ...builderForm, ownerCompany: e.target.value })}
                    className="w-full border border-slate-200 p-2 text-xs bg-[#FDFBF7] focus:border-[#C5A02D] outline-none"
                    placeholder="Koro Fiji-Nadi Bay Sands Investment Limited"
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

                <div className="border-t border-slate-100 md:col-span-2 pt-4">
                  <span className="text-[11px] font-display uppercase tracking-widest text-[#C5A02D] font-bold block mb-4">COMMERCIAL COVENANTS & INVENTORY</span>
                </div>

                {/* Hotel Name */}
                <div className="space-y-1">
                  <label className="text-[10px] font-display uppercase tracking-wider text-[#0B1C33] font-bold">Asset (Hotel Name)</label>
                  <input
                    type="text"
                    required
                    value={builderForm.hotelName}
                    onChange={(e) => setBuilderForm({ ...builderForm, hotelName: e.target.value })}
                    className="w-full border border-slate-200 p-2 text-xs bg-[#FDFBF7] focus:border-[#C5A02D] outline-none"
                  />
                </div>

                {/* Hotel Address */}
                <div className="space-y-1">
                  <label className="text-[10px] font-display uppercase tracking-wider text-[#0B1C33] font-bold">Asset Physical Address</label>
                  <input
                    type="text"
                    value={builderForm.hotelAddress}
                    onChange={(e) => setBuilderForm({ ...builderForm, hotelAddress: e.target.value })}
                    className="w-full border border-slate-200 p-2 text-xs bg-[#FDFBF7] focus:border-[#C5A02D] outline-none"
                  />
                </div>

                {/* Inventory / Keys */}
                <div className="space-y-1">
                  <label className="text-[10px] font-display uppercase tracking-wider text-[#0B1C33] font-bold">Room Inventory (Keys)</label>
                  <input
                    type="text"
                    value={builderForm.inventory}
                    onChange={(e) => setBuilderForm({ ...builderForm, inventory: e.target.value })}
                    className="w-full border border-slate-200 p-2 text-xs bg-[#FDFBF7] focus:border-[#C5A02D] outline-none"
                  />
                </div>

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
                <div className="space-y-1">
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
                    rows={4}
                    value={builderForm.facilitiesText}
                    onChange={(e) => setBuilderForm({ ...builderForm, facilitiesText: e.target.value })}
                    className="w-full border border-slate-200 p-2 text-xs bg-[#FDFBF7] focus:border-[#C5A02D] outline-none font-mono"
                  />
                </div>

              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-6 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setActiveSubView("dashboard")}
                  className="px-6 py-2.5 border border-slate-200 text-xs font-display uppercase tracking-widest font-black text-slate-500 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-8 py-2.5 bg-[#0B1C33] text-[#C5A02D] hover:bg-[#C5A02D] hover:text-[#0B1C33] text-xs font-display uppercase tracking-widest font-black transition-all border border-[#0B1C33] hover:border-[#C5A02D]"
                >
                  Draft Agreement
                </button>
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

                {selectedAgreement.status === "Completed" && (
                  <button
                    onClick={() => window.print()}
                    className="px-4 py-2 bg-[#0B1C33] text-[#C5A02D] text-xs font-display uppercase tracking-widest font-bold flex items-center gap-1 border border-[#0B1C33] hover:bg-[#C5A02D] hover:text-[#0B1C33] transition-all"
                  >
                    <Download size={13} /> Print / Export
                  </button>
                )}
              </div>
            </div>

            {/* TWO-COLUMN LAYOUT: DOCUMENT VS SIGN PANEL */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* LUXURY INVESTMENT-STYLE DOCUMENT VIEWER (2 cols) */}
              <div className="lg:col-span-2 space-y-12 overflow-y-auto max-h-[80vh] pr-4 custom-scrollbar bg-white border border-slate-200/80 p-8 shadow-md">
                
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
                            onClick={() => triggerNotification(`Downloading "${docItem.name}"...`, "info")}
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
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-slate-100 mb-8">
              <div>
                <h3 className="text-xl font-serif italic text-[#0B1C33]">Secured CML Document Vault</h3>
                <p className="text-xs text-[#C5A02D] font-display uppercase tracking-widest font-bold">Encrypted Archive Storage</p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <input 
                  type="text" 
                  placeholder="Search secure documents..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="px-4 py-2 border border-slate-200 text-xs w-60 focus:outline-none focus:border-[#C5A02D] bg-[#FDFBF7]"
                />
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
              </div>
            </div>

            {filteredAgreements.length === 0 ? (
              <div className="py-16 text-center text-slate-400 font-serif italic border-2 border-dashed border-slate-100 max-w-lg mx-auto">
                No matching legal documents stored in active partitions.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredAgreements.map((ag) => (
                  <div key={ag.id} className="border border-slate-200 hover:border-[#C5A02D]/60 p-5 bg-[#FAF7F2]/30 flex flex-col justify-between h-72 relative group transition-all hover:shadow-md">
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

                    <div className="pt-4 border-t border-slate-100/60 flex items-center justify-between gap-2 mt-4 text-[10px] font-display font-bold">
                      <button
                        onClick={() => handleViewAgreement(ag)}
                        className="text-[#0B1C33] hover:text-[#C5A02D] transition-colors uppercase tracking-wider"
                      >
                        REVIEW ARCHIVE
                      </button>

                      {ag.status === "Completed" ? (
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => triggerNotification(`Dispatching copy of "${ag.title}" to registered email: ${ag.ownerEmail}...`, "info")}
                            className="p-1 text-slate-400 hover:text-[#0B1C33]"
                            title="Email Secure Copy"
                          >
                            <Mail size={13} />
                          </button>
                          <button
                            onClick={() => triggerNotification(`Downloading secured contract package...`, "success")}
                            className="p-1 text-slate-400 hover:text-[#0B1C33]"
                            title="Download SECURE CML PDF"
                          >
                            <Download size={13} />
                          </button>
                        </div>
                      ) : (
                        <span className="text-[9px] text-amber-600 font-mono">✓ IN-VAULT PENDING LOCK</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
