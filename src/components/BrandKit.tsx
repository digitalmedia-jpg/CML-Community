import { ConfirmModal } from "./ConfirmModal";
import React, { useState, useEffect, useRef } from "react";
import { 
  Printer, 
  Download, 
  FileText, 
  Trash2, 
  Upload, 
  Search, 
  Building, 
  CreditCard, 
  Plus, 
  X, 
  Check, 
  Loader2, 
  Phone, 
  Mail, 
  Globe, 
  MapPin, 
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  User,
  RefreshCw,
  Sparkles
} from "lucide-react";
import { 
  db, 
  auth,
  collection, 
  addDoc, 
  getDocs, 
  getDoc,
  deleteDoc, 
  doc, 
  updateDoc,
  serverTimestamp, 
  query, 
  orderBy,
  onSnapshot
} from "../lib/firebase";
import { motion, AnimatePresence } from "motion/react";
import QRCode from "qrcode";

// --- HIGH FIDELITY CML SVGS (PRESERVED) ---

export const CMLEmblem: React.FC<{ className?: string; colorPrimary?: string; colorSecondary?: string }> = ({ 
  className = "w-12 h-12", 
  colorPrimary = "#C5A03D", 
  colorSecondary = "#1A1A1A" 
}) => {
  return (
    <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <circle cx="50" cy="45" r="32" stroke={colorPrimary} strokeWidth="1.5" strokeDasharray="none" />
      <circle cx="50" cy="45" r="28" stroke={colorPrimary} strokeWidth="0.75" opacity="0.6" />
      <path d="M42 80 H58 L55 83 H45 Z" fill={colorPrimary} />
      <path d="M48 80 V77 H52 V80 Z" fill={colorPrimary} opacity="0.8" />
      <path d="M49.2 77 L48 45 L50 42 L52 45 L50.8 77 Z" fill={colorPrimary} opacity="0.3" />
      <circle cx="50" cy="81" r="2" fill={colorPrimary} />
      <rect x="47" y="25" width="8" height="28" fill={colorSecondary} rx="1" />
      <rect x="44" y="32" width="6" height="21" fill={colorSecondary} rx="0.5" opacity="0.9" />
      <rect x="52" y="29" width="5" height="24" fill={colorSecondary} rx="0.5" opacity="0.8" />
      <path d="M43.5 53 V31.5 C43.5 30 44 29.5 45.5 29.5 H54.5 C56 29.5 56.5 30 56.5 31.5 V53" stroke={colorPrimary} strokeWidth="1" strokeLinecap="round" />
      <line x1="47" y1="28" x2="53" y2="28" stroke={colorPrimary} strokeWidth="0.5" />
      <line x1="50" y1="20" x2="50" y2="25" stroke={colorPrimary} strokeWidth="1" />
      <circle cx="50" cy="19" r="1" fill={colorPrimary} />
      <path d="M57 41 Q64 41 64 45 Q57 47 57 41 Z" fill={colorPrimary} />
      <path d="M57 41 Q59 36 63 35 Q60 41 57 41 Z" fill={colorPrimary} />
      <path d="M57 41 Q55 37 52 38 Q55 42 57 41 Z" fill={colorPrimary} />
      <path d="M57 41 C57.5 44 58.5 48 59 52" stroke={colorSecondary} strokeWidth="1" strokeLinecap="round" />
      <path d="M35 52 Q42.5 48 50 52 T65 52 Q70 54 73 52" stroke={colorPrimary} strokeWidth="1.5" strokeLinecap="round" />
      <path d="M31 56 Q40.5 52 50 56 T69 56 Q75 58 77 56" stroke={colorPrimary} strokeWidth="1" strokeLinecap="round" opacity="0.75" />
      <path d="M38 60 Q44 57 50 60 T62 60 Q66 61 68 60" stroke={colorPrimary} strokeWidth="0.75" strokeLinecap="round" opacity="0.5" />
    </svg>
  );
};

export const CMLMonogramOnly: React.FC<{ 
  className?: string; 
  colorC?: string; 
  colorM?: string; 
  colorL?: string; 
}> = ({ 
  className = "w-20 h-16", 
  colorC = "#C5A02D", 
  colorM = "#1A1A1A", 
  colorL = "#C5A02D" 
}) => {
  return (
    <svg viewBox="0 0 140 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <path d="M48 20 C22 20 12 40 12 55 C12 70 20 90 48 90 C62 90 70 83 73 79 L73 67 C67 71 60 76 48 76 C33 76 27 64 27 55 C27 46 33 34 48 34 C59 34 66 39 72 44 L72 32 C68 27 60 20 48 20 Z" fill={colorC} />
      <path d="M50 28 L63 72 L76 28 H88 L96 82 H83 L79 46 L67 88 H59 L47 46 L43 82 H30 L38 28 H50 Z" fill={colorM} opacity="0.95" />
      <path d="M83 20 H96 V78 H120 V90 H83 V20 Z" fill={colorL} />
    </svg>
  );
};

export const StackedCMLLogo: React.FC<{ 
  className?: string; 
  darkTheme?: boolean;
}> = ({ 
  className = "w-full", 
  darkTheme = false 
}) => {
  return (
    <div className={`flex flex-col items-center justify-center text-center ${className}`}>
      <img 
        src="https://cml.com.fj/wp-content/uploads/2026/06/CML-Logo-White-BG.png" 
        alt="Cove Management Limited Logo" 
        className="h-[68px] w-auto object-contain rounded-sm bg-white px-3 py-1 shadow border border-stone-200/10"
        referrerPolicy="no-referrer"
      />
    </div>
  );
};

// Compress image files to save inside Firestore storage correctly
export const compressImageBase64 = (base64Url: string, maxWidth = 1050, maxHeight = 600): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = base64Url;
    img.onload = () => {
      const canvas = document.createElement("canvas");
      let width = img.width;
      let height = img.height;
      if (width > maxWidth) {
        height = Math.round((height * maxWidth) / width);
        width = maxWidth;
      }
      if (height > maxHeight) {
        width = Math.round((width * maxHeight) / height);
        height = maxHeight;
      }
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", 0.65));
      } else {
        resolve(base64Url);
      }
    };
    img.onerror = () => {
      resolve(base64Url);
    };
  });
};

// High-fidelity replica of the corporate business cards of Cove Management Ltd (CML)
export const generateVirtualCardImageAndDownload = async (targetCard: any, companyId: string) => {
  const canvas = document.createElement("canvas");
  canvas.width = 1050; // 3.5 inches at 300 DPI
  canvas.height = 600; // 2.0 inches at 300 DPI
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  // Render Front Side of the Card
  ctx.fillStyle = "#FAF6EE"; // Cream warm elegant corporate backing
  ctx.fillRect(0, 0, 1050, 600);

  // Draw Center Vertical Gold Divider Line
  ctx.beginPath();
  ctx.moveTo(525, 80);
  ctx.lineTo(525, 490);
  ctx.strokeStyle = "#C5A02D";
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Load vector paths for letter C, M, and L
  const pathC = new Path2D("M48 20 C22 20 12 40 12 55 C12 70 20 90 48 90 C62 90 70 83 73 79 L73 67 C67 71 60 76 48 76 C33 76 27 64 27 55 C27 46 33 34 48 34 C59 34 66 39 72 44 L72 32 C68 27 60 20 48 20 Z");
  const pathM = new Path2D("M50 28 L63 72 L76 28 H88 L96 82 H83 L79 46 L67 88 H59 L47 46 L43 82 H30 L38 28 H50 Z");
  const pathL = new Path2D("M83 20 H96 V78 H120 V90 H83 V20 Z");

  // Draw CML Monogram on Left Side of Card Front
  ctx.save();
  ctx.translate(143.5, 95);
  ctx.scale(1.7, 1.7);
  ctx.fillStyle = "#C5A02D";
  ctx.fill(pathC);
  ctx.fillStyle = "#1A1A1A";
  ctx.fill(pathM);
  ctx.fillStyle = "#C5A03D";
  ctx.fill(pathL);
  ctx.restore();

  // Draw Brands/CML Labels on Left
  ctx.textAlign = "center";
  ctx.fillStyle = "#1A1A1A";
  ctx.font = "900 18.5px sans-serif";
  ctx.fillText("COVE MANAGEMENT", 262.5, 295);

  ctx.beginPath();
  ctx.moveTo(110, 326);
  ctx.lineTo(202, 326);
  ctx.strokeStyle = "#C5A02D";
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.fillStyle = "#C5A03D";
  ctx.font = "bold 13px sans-serif";
  ctx.fillText("LIMITED", 262.5, 331);

  ctx.beginPath();
  ctx.moveTo(323, 326);
  ctx.lineTo(415, 326);
  ctx.stroke();

  ctx.fillStyle = "#1A1A1A";
  ctx.font = "bold 9px sans-serif";
  ctx.fillText("HOTELS   ●   RESORTS   ●   VACATIONS", 262.5, 372);

  // Draw Personal Contact Details on Right Hand Side (aligned-left at x=560)
  ctx.textAlign = "left";
  ctx.fillStyle = "#1A1A1A";
  ctx.font = "bold 32px sans-serif";
  ctx.fillText(targetCard.name, 560, 215);

  ctx.fillStyle = "#C5A03D";
  ctx.font = "italic bold 15.5px sans-serif";
  ctx.fillText(targetCard.title || "DEPARTMENT REPRESENTATIVE", 560, 255);

  // Helper circle for icon drawing
  const drawIconMarker = (x: number, y: number) => {
    ctx.beginPath();
    ctx.arc(x, y, 13, 0, 2 * Math.PI);
    ctx.fillStyle = "#C5A02D";
    ctx.fill();
  };

  const startY = 320;
  const gapY = 46;

  // Phone
  drawIconMarker(575, startY);
  ctx.fillStyle = "#FAF6EE";
  ctx.font = "bold 12px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("☏", 575, startY + 4);

  ctx.textAlign = "left";
  ctx.font = "500 13px sans-serif";
  ctx.fillStyle = "#2D2D2D";
  ctx.fillText(targetCard.phone || "+679 998 9499 | 998 4676", 601, startY + 4);

  // Email
  drawIconMarker(575, startY + gapY);
  ctx.fillStyle = "#FAF6EE";
  ctx.font = "bold 10px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("✉", 575, startY + gapY + 3);

  ctx.textAlign = "left";
  ctx.font = "500 13px sans-serif";
  ctx.fillStyle = "#2D2D2D";
  ctx.fillText(targetCard.email || "sales@cml.com.fj", 601, startY + gapY + 4);

  // Website
  drawIconMarker(575, startY + 2 * gapY);
  ctx.fillStyle = "#FAF6EE";
  ctx.font = "bold 10px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("🌐", 575, startY + 2 * gapY + 3.5);

  ctx.textAlign = "left";
  ctx.font = "500 13px sans-serif";
  ctx.fillStyle = "#2D2D2D";
  ctx.fillText(targetCard.website || "cml.com.fj", 601, startY + 2 * gapY + 4);

  // Location
  drawIconMarker(575, startY + 3 * gapY);
  ctx.fillStyle = "#FAF6EE";
  ctx.font = "bold 10px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("📍", 575, startY + 3 * gapY + 3.5);

  ctx.textAlign = "left";
  ctx.font = "500 12.5px sans-serif";
  ctx.fillStyle = "#2D2D2D";
  ctx.fillText(targetCard.location || "Lot 14 Wasawasa Road, Wailoaloa Fiji", 601, startY + 3 * gapY + 4);

  // White base boundary box for QR (860, 40, w=135, h=135)
  ctx.fillStyle = "#FFFFFF";
  ctx.fillRect(860, 40, 135, 135);
  ctx.strokeStyle = "#E2E8F0";
  ctx.lineWidth = 1;
  ctx.strokeRect(860, 40, 135, 135);

  // Generate and draw dynamic Scan QR Code inside the box
  try {
    const publicUrl = `${window.location.origin}/public-card/${companyId}/${targetCard.id}`;
    const qrDataUrl = await QRCode.toDataURL(publicUrl, { margin: 1 });
    const qrImg = new Image();
    qrImg.src = qrDataUrl;
    await new Promise((resolve) => {
      qrImg.onload = resolve;
      qrImg.onerror = resolve;
    });
    ctx.drawImage(qrImg, 865, 45, 125, 125);
  } catch (err) {
    console.warn("Generating canvas QR fallback:", err);
    ctx.fillStyle = "#1E1E1D";
    ctx.fillRect(875, 55, 105, 105);
    ctx.fillStyle = "#FFFFFF";
    ctx.font = "9px monospace";
    ctx.textAlign = "center";
    ctx.fillText("SCAN ME", 927, 112);
  }

  // Draw Bottom solid black accent footer bar (height = 30)
  ctx.fillStyle = "#111111";
  ctx.fillRect(0, 570, 1050, 30);

  // Fire Front Download
  const frontDataUrl = canvas.toDataURL("image/png");
  const downloadSingleLocal = (urlStr: string, nameStr: string) => {
    const link = document.createElement("a");
    link.href = urlStr;
    link.download = nameStr;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  downloadSingleLocal(frontDataUrl, `BusinessCard_Front_${targetCard.name.replace(/\s+/g, "_")}.png`);

  // --- Render & Download Back Side Card ---
  setTimeout(() => {
    const canvasBack = document.createElement("canvas");
    canvasBack.width = 1050;
    canvasBack.height = 600;
    const ctxBack = canvasBack.getContext("2d");
    if (!ctxBack) return;

    ctxBack.fillStyle = "#0A0A09"; // Charcoal black back
    ctxBack.fillRect(0, 0, 1050, 600);

    // Draw Monogram in top half
    ctxBack.save();
    ctxBack.translate(413, 110);
    ctxBack.scale(1.6, 1.6);
    ctxBack.fillStyle = "#C5A02D";
    ctxBack.fill(pathC);
    ctxBack.fillStyle = "#FFFFFF"; // Pop letter M on dark
    ctxBack.fill(pathM);
    ctxBack.fillStyle = "#C5A02D";
    ctxBack.fill(pathL);
    ctxBack.restore();

    ctxBack.textAlign = "center";
    ctxBack.fillStyle = "#FFFFFF";
    ctxBack.font = "900 18px sans-serif";
    ctxBack.fillText("COVE MANAGEMENT", 525, 295);

    ctxBack.beginPath();
    ctxBack.moveTo(360, 326);
    ctxBack.lineTo(460, 326);
    ctxBack.strokeStyle = "#C5A02D";
    ctxBack.lineWidth = 1;
    ctxBack.stroke();

    ctxBack.fillStyle = "#C5A03D";
    ctxBack.font = "bold 13px sans-serif";
    ctxBack.fillText("LIMITED", 525, 331);

    ctxBack.beginPath();
    ctxBack.moveTo(590, 326);
    ctxBack.lineTo(690, 326);
    ctxBack.stroke();

    ctxBack.fillStyle = "#FFFFFF";
    ctxBack.font = "bold 9px sans-serif";
    ctxBack.fillText("HOTELS   ●   RESORTS   ●   VACATIONS", 525, 372);

    // Golden Divider Line
    ctxBack.beginPath();
    ctxBack.moveTo(100, 420);
    ctxBack.lineTo(950, 420);
    ctxBack.strokeStyle = "rgba(197, 160, 61, 0.4)";
    ctxBack.lineWidth = 1;
    ctxBack.stroke();

    // Bottom Partner Logos
    // Ramada
    ctxBack.font = "bold 17px Georgia, serif";
    ctxBack.fillStyle = "#FFFFFF";
    ctxBack.fillText("RAMADA RESORTS", 270, 485);
    ctxBack.font = "9px sans-serif";
    ctxBack.fillStyle = "#C5A02D";
    ctxBack.fillText("BY WYNDHAM • WAILOALOA BEACH, FIJI", 270, 502);

    // Wyndham Garden
    ctxBack.font = "bold 17px sans-serif";
    ctxBack.fillStyle = "#FFFFFF";
    ctxBack.fillText("WYNDHAM GARDEN", 525, 485);
    ctxBack.font = "9px sans-serif";
    ctxBack.fillStyle = "#C5A02D";
    ctxBack.fillText("WAILOALOA BEACH, FIJI", 525, 502);

    // Days Inn
    ctxBack.font = "bold 17px Georgia, serif";
    ctxBack.fillStyle = "#FFFFFF";
    ctxBack.fillText("Days Inn.", 780, 485);
    ctxBack.font = "9px sans-serif";
    ctxBack.fillStyle = "#C5A02D";
    ctxBack.fillText("BY WYNDHAM • NADI, FIJI", 780, 502);

    // Bottom solid gold accent bar (height = 15)
    ctxBack.fillStyle = "#C5A03D";
    ctxBack.fillRect(0, 585, 1050, 15);

    const backDataUrl = canvasBack.toDataURL("image/png");
    downloadSingleLocal(backDataUrl, `BusinessCard_Back_${targetCard.name.replace(/\s+/g, "_")}.png`);
  }, 750);
};

// --- DATA TYPE ---

interface BusinessCard {
  id: string;
  name: string;
  title: string;
  department: string;
  phone: string;
  email: string;
  website: string;
  location: string;
  pages: string[]; // Front/Back image data URL strings
  pdfBase64?: string; // Captured raw PDF/image Base64 string for direct downloads
  createdAt: any;
  companyId: string;
}

interface BrandKitProps {
  companyId: string;
}

// Seeded cards fallback for instant polish
const getMockBusinessCards = (companyId: string): BusinessCard[] => {
  if (companyId === "ramada") {
    return [
      {
        id: "mock_ramada_1",
        name: "Avishek Chandra",
        title: "Director of Operations",
        department: "Property Management & Operations",
        phone: "+679 672 5000",
        email: "operations@ramadasuitesfiji.com",
        website: "ramadasuitesfiji.com",
        location: "Lot 14 Wasawasa Road, Wailoaloa Beach, Nadi, Fiji Islands",
        pages: [],
        createdAt: "2026-06-01T00:00:00Z",
        companyId: "ramada"
      }
    ];
  }
  if (companyId === "wyndham") {
    return [
      {
        id: "mock_wyndham_1",
        name: "Litia R.",
        title: "Guest Relations Lead Manager",
        department: "Guest Services",
        phone: "+679 675 0411",
        email: "litia.r@wyndhamfiji.com",
        website: "wyndhamfiji.com",
        location: "Denarau Island, Nadi, Fiji Islands",
        pages: [],
        createdAt: "2026-06-01T00:00:00Z",
        companyId: "wyndham"
      }
    ];
  }
  return [
    {
      id: "mock_cml_1",
      name: "Rohit Lal",
      title: "General Manager | Director",
      department: "Executive Board",
      phone: "+679 998 9499",
      email: "sales@cml.com.fj",
      website: "cml.com.fj",
      location: "Lot 14 Wasawasa Road, Wailoaloa Beach, Nadi, Fiji Islands",
      pages: [],
      createdAt: "2026-06-01T00:00:00Z",
      companyId: "cml"
    },
    {
      id: "mock_cml_2",
      name: "Charles Cebujano",
      title: "Digital Media Specialist",
      department: "Marketing & Design",
      phone: "+679 998 4676",
      email: "digitalmedia@cml.com.fj",
      website: "cml.com.fj",
      location: "Lot 14 Wasawasa Road, Wailoaloa Beach, Nadi, Fiji Islands",
      pages: ["https://cml.com.fj/wp-content/uploads/2026/06/Charles-Cebujano-CML.png"],
      createdAt: "2026-06-01T01:15:00Z",
      companyId: "cml"
    }
  ];
};

export const BrandKit: React.FC<BrandKitProps> = ({ companyId }) => {
  const [cards, setCards] = useState<BusinessCard[]>([]);
  const [selectedCard, setSelectedCard] = useState<BusinessCard | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [pdfjs, setPdfjs] = useState<any>(null);

  // Upload States
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [uploadStatus, setUploadStatus] = useState<string>("");
  const [dragActive, setDragActive] = useState<boolean>(false);
  const [deleteCardTarget, setDeleteCardTarget] = useState<{ id: string; name: string } | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const replaceSideInputRef = useRef<HTMLInputElement>(null);

  // Form Parameters
  const [formName, setFormName] = useState<string>("");
  const [formTitle, setFormTitle] = useState<string>("");
  const [formDept, setFormDept] = useState<string>("");
  const [formPhone, setFormPhone] = useState<string>("");
  const [formEmail, setFormEmail] = useState<string>("");
  const [formWebsite, setFormWebsite] = useState<string>("");
  const [formLocation, setFormLocation] = useState<string>("");
  const [tempPages, setTempPages] = useState<string[]>([]);
  const [tempRawPdf, setTempRawPdf] = useState<string>("");

  const [activeSide, setActiveSide] = useState<"front" | "back">("front");
  const [alertMessage, setAlertMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>("");

  const triggerAlert = (type: "success" | "error", text: string) => {
    setAlertMessage({ type, text });
    setTimeout(() => setAlertMessage(null), 4000);
  };

  // Background synchronize all cards to the central express server-side memory registry!
  // This enables instant QR access from external device types such as physical mobiles
  useEffect(() => {
    if (cards && cards.length > 0) {
      cards.forEach(card => {
        fetch("/api/business-cards", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ card: { ...card, companyId } })
        }).catch(err => console.warn("Failed to backup card server-side:", err));
      });
    }
  }, [cards, companyId]);

  // Subscribe to DB Collections or seeds list
  useEffect(() => {
    if (!db) {
      const seeds = getMockBusinessCards(companyId);
      setCards(seeds);
      const charlesCard = seeds.find(c => c.name.toLowerCase().includes("charles"));
      setSelectedCard(charlesCard || seeds[0]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const colRef = collection(db, `business-cards-${companyId}`);
      const unsub = onSnapshot(colRef, (snapshot) => {
        const liveList: BusinessCard[] = [];
        snapshot.docs.forEach((docSnap) => {
          liveList.push({
            id: docSnap.id,
            ...docSnap.data()
          } as BusinessCard);
        });

        const finalCards = liveList.length === 0 ? getMockBusinessCards(companyId) : liveList;
        setCards(finalCards);
        
        // Auto select the card currently selected, or choose the first one
        if (finalCards.length > 0) {
          const charlesCard = finalCards.find(c => c.name.toLowerCase().includes("charles"));
          setSelectedCard((prev) => {
            if (prev) {
              return finalCards.find(c => c.id === prev.id) || finalCards[0];
            }
            return charlesCard || finalCards[0];
          });
        }
        setLoading(false);
      }, (err) => {
        console.error("Firestore loading failure:", err);
        const seeds = getMockBusinessCards(companyId);
        setCards(seeds);
        setSelectedCard(seeds.find(c => c.name.toLowerCase().includes("charles")) || seeds[0]);
        setLoading(false);
      });
      return () => unsub();
    } catch (e) {
      console.warn("Firestore error bind:", e);
      const seeds = getMockBusinessCards(companyId);
      setCards(seeds);
      setSelectedCard(seeds.find(c => c.name.toLowerCase().includes("charles")) || seeds[0]);
      setLoading(false);
    }
  }, [companyId]);

  // Load PDFJS on mounting
  useEffect(() => {
    const loadPdfJs = async () => {
      try {
        if ((window as any).pdfjsLib) {
          setPdfjs((window as any).pdfjsLib);
          return;
        }
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.min.js';
        script.onload = () => {
          const pdfjsLib = (window as any).pdfjsLib;
          pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.worker.min.js';
          setPdfjs(pdfjsLib);
        };
        document.head.appendChild(script);
      } catch (err) {
        console.error("Failed to load PDF.js:", err);
      }
    };
    loadPdfJs();
  }, []);

  // Generate large QR Code referencing this target card's public profile page
  useEffect(() => {
    const generateQR = async () => {
      if (!selectedCard) {
        setQrCodeDataUrl("");
        return;
      }
      try {
        const publicUrl = `${window.location.origin}/public-card/${companyId}/${selectedCard.id}`;
        const dataUrl = await QRCode.toDataURL(publicUrl, {
          width: 320,
          margin: 1.5,
          color: {
            dark: "#141414",
            light: "#FFFFFF"
          }
        });
        setQrCodeDataUrl(dataUrl);
      } catch (err) {
        console.error("QR Code compile error:", err);
      }
    };
    generateQR();
    setActiveSide("front");
  }, [selectedCard, companyId]);

  // Fill in active data details once selected card shifts
  useEffect(() => {
    if (selectedCard) {
      setFormName(selectedCard.name);
      setFormTitle(selectedCard.title);
      setFormDept(selectedCard.department);
      setFormPhone(selectedCard.phone);
      setFormEmail(selectedCard.email);
      setFormWebsite(selectedCard.website);
      setFormLocation(selectedCard.location);
      setTempPages(selectedCard.pages || []);
      setTempRawPdf(selectedCard.pdfBase64 || "");
    }
  }, [selectedCard]);

  const fileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      await processUploadedFiles(Array.from(e.target.files));
    }
  };

  // Handler for uploaded images or files (supports multi-image dual-page uploads!)
  const processUploadedFiles = async (files: File[]) => {
    if (files.length === 0) return;
    const firstFile = files[0];

    if (firstFile.type === "application/pdf") {
      await processUploadedPdf(firstFile);
      return;
    }

    const imageFiles = files.filter(f => f.type.startsWith("image/"));
    if (imageFiles.length > 0) {
      try {
        setIsUploading(true);
        setUploadProgress(15);
        setUploadStatus(imageFiles.length > 1 ? "De-serializing Front & Back Side Designs..." : "Indexing single card image...");

        const renderedPages: string[] = [];
        const processLimit = Math.min(imageFiles.length, 2);

        for (let idx = 0; idx < processLimit; idx++) {
          const currentImg = imageFiles[idx];
          setUploadProgress(20 + Math.floor((idx / processLimit) * 60));
          setUploadStatus(`Encoding and compressing page side ${idx + 1}...`);

          const base64UrlUncompressed = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target?.result as string);
            reader.onerror = (err) => reject(err);
            reader.readAsDataURL(currentImg);
          });

          const compressed = await compressImageBase64(base64UrlUncompressed, 1050, 600);
          renderedPages.push(compressed);
        }

        const leadFile = imageFiles[0];
        // Format clean filename for label
        const cleanFilename = leadFile.name.replace(/\.[^/.]+$/, "");
        const parts = cleanFilename.split(/[-_ ]+/).map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase());
        const formalName = parts.join(" ");

        const newCardData: Omit<BusinessCard, "id"> = {
          name: formalName,
          title: "Representative",
          department: "Ops & Media",
          phone: "+679 998 4676",
          email: `${parts[0]?.toLowerCase() || "sales"}@cml.com.fj`,
          website: companyId === "cml" ? "cml.com.fj" : `${companyId}.com.fj`,
          location: "Lot 14 Wasawasa Road, Wailoaloa Beach",
          pages: renderedPages,
          pdfBase64: renderedPages[0], // use first page for pdfBase64 fallback
          createdAt: serverTimestamp ? serverTimestamp() : new Date().toISOString(),
          companyId
        };

        let savedCard: BusinessCard;
        if (db && !('_isMock' in db)) {
          const colRef = collection(db, `business-cards-${companyId}`);
          const docRef = await addDoc(colRef, newCardData);
          savedCard = { id: docRef.id, ...newCardData } as BusinessCard;
        } else {
          const autoDocId = 'card_' + Math.random().toString(36).substring(2, 9);
          const storedMockDB = localStorage.getItem('cml_mock_db');
          const dbObj = storedMockDB ? JSON.parse(storedMockDB) : {};
          const fullCard = { id: autoDocId, ...newCardData, createdAt: new Date().toISOString() };
          dbObj[`business-cards-${companyId}/${autoDocId}`] = fullCard;
          localStorage.setItem('cml_mock_db', JSON.stringify(dbObj));
          savedCard = fullCard as unknown as BusinessCard;
          
          // trigger manual index refresh list
          const list = Object.entries(dbObj)
            .filter(([key]) => key.startsWith(`business-cards-${companyId}/`))
            .map(([_, val]) => val as BusinessCard);
          setCards(list.length > 0 ? list : getMockBusinessCards(companyId));
        }

        // Centralized Server Synchronizer backup
        fetch("/api/business-cards", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ card: savedCard })
        }).catch(err => console.warn("Failed to backup card server-side:", err));

        setSelectedCard(savedCard);
        triggerAlert("success", `Uploaded ${renderedPages.length > 1 ? "Front & Back" : "Front"} designs for ${formalName}!`);
        setIsUploading(false);
      } catch (err) {
        console.error(err);
        triggerAlert("error", "Failed to upload image file(s).");
        setIsUploading(false);
      }
      return;
    }

    triggerAlert("error", "Unsupported layout file. Provide a PDF, PNG or JPEG.");
  };

  const replaceSideFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0 && selectedCard) {
      const file = e.target.files[0];
      if (!file.type.startsWith("image/")) {
        triggerAlert("error", "Please provide a PNG or JPEG side image.");
        return;
      }
      try {
        setIsUploading(true);
        setUploadProgress(40);
        setUploadStatus(`Uploading replacement for ${activeSide} side...`);

        const base64UrlUncompressed = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (e) => resolve(e.target?.result as string);
          reader.onerror = (err) => reject(err);
          reader.readAsDataURL(file);
        });

        const compressed = await compressImageBase64(base64UrlUncompressed, 1050, 600);
        
        let currentPages = [...(selectedCard.pages || [])];
        if (activeSide === "front") {
          currentPages[0] = compressed;
        } else {
          currentPages[1] = compressed;
          if (!currentPages[0]) {
            currentPages[0] = "";
          }
        }

        const updatedData = {
          ...selectedCard,
          pages: currentPages,
          pdfBase64: currentPages[0],
          updatedAt: serverTimestamp ? serverTimestamp() : new Date().toISOString()
        };

        if (db && !('_isMock' in db)) {
          const docRef = doc(db, `business-cards-${companyId}`, selectedCard.id);
          await updateDoc(docRef, { pages: currentPages, pdfBase64: currentPages[0] });
        } else {
          const storedMockDB = localStorage.getItem('cml_mock_db');
          const dbObj = storedMockDB ? JSON.parse(storedMockDB) : {};
          dbObj[`business-cards-${companyId}/${selectedCard.id}`] = updatedData;
          localStorage.setItem('cml_mock_db', JSON.stringify(dbObj));
          
          const list = Object.entries(dbObj)
            .filter(([key]) => key.startsWith(`business-cards-${companyId}/`))
            .map(([_, val]) => val as BusinessCard);
          setCards(list.length > 0 ? list : getMockBusinessCards(companyId));
        }

        // Backup to server registry
        fetch("/api/business-cards", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ card: updatedData })
        }).catch(err => console.warn("Failed to backup card replacement server-side:", err));

        setSelectedCard(updatedData);
        triggerAlert("success", `${activeSide === "front" ? "Front" : "Back"} design side updated successfully!`);
        setIsUploading(false);
      } catch (err) {
        console.error(err);
        triggerAlert("error", "Failed to upload side replacement image.");
        setIsUploading(false);
      }
    }
  };

  const processUploadedPdf = async (file: File) => {
    if (!pdfjs) {
      triggerAlert("error", "Decompiler stream starting up, please try vector index again.");
      return;
    }

    try {
      setIsUploading(true);
      setUploadProgress(15);
      setUploadStatus("Processing PDF vector curves...");

      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
      const totalPages = Math.min(pdf.numPages, 2);

      const renderedPages: string[] = [];
      for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
        setUploadProgress(30 + Math.floor((pageNum / totalPages) * 50));
        setUploadStatus(`Deserializing page ${pageNum} visual properties...`);

        const page = await pdf.getPage(pageNum);
        const viewport = page.getViewport({ scale: 2.2 });
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");

        canvas.width = viewport.width;
        canvas.height = viewport.height;

        if (ctx) {
          await page.render({ canvasContext: ctx, viewport }).promise;
          const imgData = canvas.toDataURL("image/jpeg", 0.65);
          renderedPages.push(imgData);
        }
      }

      const cleanFilename = file.name.replace(/\.[^/.]+$/, "");
      const parts = cleanFilename.split(/[-_ ]+/).map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase());
      const formalName = parts.join(" ");

      // Read PDF base64 safely
      const reader = new FileReader();
      reader.onload = async (e) => {
        const rawBase64 = e.target?.result as string;
        
        const newCardData: Omit<BusinessCard, "id"> = {
          name: formalName,
          title: "Officer",
          department: "Operations Department",
          phone: "+679 998 4676",
          email: `${parts[0]?.toLowerCase() || "sales"}@cml.com.fj`,
          website: companyId === "cml" ? "cml.com.fj" : `${companyId}.com.fj`,
          location: "Lot 14 Wasawasa Road, Wailoaloa Beach",
          pages: renderedPages,
          pdfBase64: rawBase64.length < 900000 ? rawBase64 : renderedPages[0],
          createdAt: serverTimestamp ? serverTimestamp() : new Date().toISOString(),
          companyId
        };

        let savedCard: BusinessCard;
        if (db && !('_isMock' in db)) {
          const colRef = collection(db, `business-cards-${companyId}`);
          const docRef = await addDoc(colRef, newCardData);
          savedCard = { id: docRef.id, ...newCardData } as BusinessCard;
        } else {
          const autoDocId = 'card_' + Math.random().toString(36).substring(2, 9);
          const storedMockDB = localStorage.getItem('cml_mock_db');
          const dbObj = storedMockDB ? JSON.parse(storedMockDB) : {};
          const fullCard = { id: autoDocId, ...newCardData, createdAt: new Date().toISOString() };
          dbObj[`business-cards-${companyId}/${autoDocId}`] = fullCard;
          localStorage.setItem('cml_mock_db', JSON.stringify(dbObj));
          savedCard = fullCard as unknown as BusinessCard;

          const list = Object.entries(dbObj)
            .filter(([key]) => key.startsWith(`business-cards-${companyId}/`))
            .map(([_, val]) => val as BusinessCard);
          setCards(list.length > 0 ? list : getMockBusinessCards(companyId));
        }

        setSelectedCard(savedCard);
        triggerAlert("success", `Digitally archived PDF template for ${formalName}!`);
        setIsUploading(false);
      };
      reader.readAsDataURL(file);

    } catch (err) {
      console.error(err);
      triggerAlert("error", "Failed to deserialize vector parameters.");
      setIsUploading(false);
    }
  };

  const saveUpdatedForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCard) return;

    try {
      const updatedData = {
        name: formName,
        title: formTitle,
        department: formDept,
        phone: formPhone,
        email: formEmail,
        website: formWebsite,
        location: formLocation,
        pages: tempPages,
        pdfBase64: tempRawPdf,
        updatedAt: serverTimestamp ? serverTimestamp() : new Date().toISOString()
      };

      if (db && !('_isMock' in db)) {
        const docRef = doc(db, `business-cards-${companyId}`, selectedCard.id);
        await updateDoc(docRef, updatedData);
      } else {
        const storedMockDB = localStorage.getItem('cml_mock_db');
        const dbObj = storedMockDB ? JSON.parse(storedMockDB) : {};
        dbObj[`business-cards-${companyId}/${selectedCard.id}`] = {
          ...selectedCard,
          ...updatedData
        };
        localStorage.setItem('cml_mock_db', JSON.stringify(dbObj));
        const list = Object.entries(dbObj)
          .filter(([key]) => key.startsWith(`business-cards-${companyId}/`))
          .map(([_, val]) => val as BusinessCard);
        setCards(list.length > 0 ? list : getMockBusinessCards(companyId));
      }

      setSelectedCard({ ...selectedCard, ...updatedData });
      triggerAlert("success", "Card parameters indexed successfully!");
    } catch (err) {
      console.error(err);
      triggerAlert("error", "Failed to save card metadata edits.");
    }
  };

  const deleteCardConfirm = async () => {
    if (!deleteCardTarget) return;

    try {
      if (db && !('_isMock' in db)) {
        const docRef = doc(db, `business-cards-${companyId}`, deleteCardTarget.id);
        await deleteDoc(docRef);
      } else {
        const storedMockDB = localStorage.getItem('cml_mock_db');
        if (storedMockDB) {
          const dbObj = JSON.parse(storedMockDB);
          delete dbObj[`business-cards-${companyId}/${deleteCardTarget.id}`];
          localStorage.setItem('cml_mock_db', JSON.stringify(dbObj));
          const list = Object.entries(dbObj)
            .filter(([key]) => key.startsWith(`business-cards-${companyId}/`))
            .map(([_, val]) => val as BusinessCard);
          const nextCards = list.length > 0 ? list : getMockBusinessCards(companyId);
          setCards(nextCards);
          setSelectedCard(nextCards[0] || null);
        }
      }
      triggerAlert("success", `Archived card for ${deleteCardTarget.name} removed.`);
    } catch (err) {
      console.error(err);
      triggerAlert("error", "Failed to remove card.");
    } finally {
      setDeleteCardTarget(null);
    }
  };

  const downloadOriginalCardFile = () => {
    if (!selectedCard) return;
    
    const pages = selectedCard.pages || [];
    
    // If it's a pre-seeded mockup card without uploaded pages
    if (pages.length === 0 && (!selectedCard.pdfBase64 || !selectedCard.pdfBase64.startsWith("data:image"))) {
      generateVirtualCardImageAndDownload(selectedCard, companyId);
      triggerAlert("success", "Initiated high-fidelity digital card replica generation!");
      return;
    }

    // Always prefer downloading as JPEG/PNG files!
    if (pages.length > 0) {
      if (pages.length === 1) {
        // Only 1 page uploaded - download that single custom image instantly through proxy or native blob!
        const page = pages[0];
        const ext = page.includes("png") ? "png" : "jpg";
        const fileName = `BusinessCard_${selectedCard.name.replace(/\s+/g, "_")}.${ext}`;
        
        const link = document.createElement("a");
        link.href = page.startsWith("http") 
          ? `/api/download-image?url=${encodeURIComponent(page)}&filename=${encodeURIComponent(fileName)}`
          : page;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        triggerAlert("success", "Saved business card design instantly!");
        return;
      }

      // Download both sides (or all uploaded pages) with a slight delay
      pages.forEach((page, index) => {
        setTimeout(() => {
          const ext = page.includes("png") ? "png" : "jpg";
          const side = index === 0 ? "Front" : "Back";
          const fileName = `BusinessCard_${side}_${selectedCard.name.replace(/\s+/g, "_")}.${ext}`;
          
          const link = document.createElement("a");
          link.href = page.startsWith("http") 
            ? `/api/download-image?url=${encodeURIComponent(page)}&filename=${encodeURIComponent(fileName)}`
            : page;
          link.download = fileName;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        }, index * 600);
      });
      triggerAlert("success", "Saved both front & back card designs to your device!");
      return;
    }

    // Direct single fallback base64/image
    const fallbackSource = selectedCard.pdfBase64 || (selectedCard.pages ? selectedCard.pages[0] : null);
    if (fallbackSource) {
      let ext = "jpg";
      if (fallbackSource.startsWith("data:image/png")) ext = "png";
      else if (fallbackSource.startsWith("data:application/pdf")) ext = "pdf";
      const fileName = `BusinessCard_${selectedCard.name.replace(/\s+/g, "_")}.${ext}`;

      const link = document.createElement("a");
      link.href = fallbackSource.startsWith("http")
        ? `/api/download-image?url=${encodeURIComponent(fallbackSource)}&filename=${encodeURIComponent(fileName)}`
        : fallbackSource;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      triggerAlert("success", "Saved uploaded card design!");
    }
  };

  const downloadQRFile = () => {
    if (!qrCodeDataUrl || !selectedCard) return;
    
    // Save image blob safely
    const link = document.createElement("a");
    link.href = qrCodeDataUrl;
    link.download = `CML_QRCode_${selectedCard.name.replace(/\s+/g, "_")}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    triggerAlert("success", "QR Code saved successfully!");
  };

  const downloadVCardFile = () => {
    if (!selectedCard) return;
    const vCardContent = [
      "BEGIN:VCARD",
      "VERSION:3.0",
      `N:${selectedCard.name.split(" ").reverse().join(";")}`,
      `FN:${selectedCard.name}`,
      `ORG:Cove Management Limited`,
      `TITLE:${selectedCard.title}`,
      `TEL;TYPE=CELL,VOICE:${selectedCard.phone}`,
      `EMAIL;TYPE=PREF,INTERNET:${selectedCard.email}`,
      `URL:${selectedCard.website}`,
      `ADR;TYPE=WORK:;;${selectedCard.location}`,
      "END:VCARD"
    ].join("\r\n");

    const blob = new Blob([vCardContent], { type: "text/vcard;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${selectedCard.name.replace(/\s+/g, "_")}.vcf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    triggerAlert("success", "Phone contact file coordinates exported!");
  };

  const copyProfileShareUrl = () => {
    if (!selectedCard) return;
    const publicUrl = `${window.location.origin}/public-card/${companyId}/${selectedCard.id}`;
    navigator.clipboard.writeText(publicUrl);
    triggerAlert("success", "Dynamic website profile URL copied!");
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      await processUploadedFiles(Array.from(e.dataTransfer.files));
    }
  };

  const filteredCards = cards.filter(card => {
    const search = searchQuery.toLowerCase();
    return (
      card.name.toLowerCase().includes(search) ||
      card.title.toLowerCase().includes(search) ||
      card.department.toLowerCase().includes(search)
    );
  });

  return (
    <div className="w-full flex flex-col gap-6 font-sans text-white p-2" id="business-card-portal">
      
      {/* Toast Alert Banner */}
      <AnimatePresence>
        {alertMessage && (
          <motion.div 
            initial={{ opacity: 0, y: -24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -24 }}
            className={`fixed top-6 right-6 z-50 px-5 py-3 shadow-2xl flex items-center gap-3 border font-display text-[10px] tracking-widest uppercase font-extrabold bg-stone-950 border-gold/40 text-emerald-400`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            {alertMessage.text}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modern Compact Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-stone-850 pb-5">
        <div>
          <span className="text-[9px] font-display uppercase tracking-[0.4em] text-gold font-bold">CML Digital Directory Suite</span>
          <h2 className="text-3xl font-serif italic text-white mt-1">Business Card Repository</h2>
          <p className="text-xs text-stone-400 font-serif italic mt-1">
            Drag, drop, or select your business card image or PDF. Instantly generate its scan QR code and download the original uploaded card file.
          </p>
        </div>

        {selectedCard && (
          <button
            onClick={() => setSelectedCard(null)}
            className="bg-gold hover:bg-white hover:text-stone-950 text-stone-950 px-5 py-2.5 text-[9.5px] font-display uppercase tracking-widest font-black transition-all flex items-center gap-1.5 shadow-md"
          >
            <Plus size={13} className="stroke-[3]" /> Upload Another Card
          </button>
        )}
      </div>

      {/* Main Split Area */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* LEFT COLUMN: UPLOAD DROPZONE OR PREVIEW/FORM */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          
          {!selectedCard ? (
            /* UPLOAD DROPZONE */
            <div
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed bg-stone-900/10 p-12 text-center cursor-pointer transition-all flex flex-col items-center justify-center min-h-[340px] relative overflow-hidden ${
                dragActive ? "border-gold bg-gold/5" : "border-stone-850 hover:border-gold/30 hover:bg-stone-900/20"
              }`}
            >
              <input 
                type="file" 
                ref={fileInputRef}
                onChange={fileSelected}
                className="hidden" 
                accept="application/pdf, image/png, image/jpeg, image/jpg, image/webp"
                multiple
              />

              {isUploading ? (
                <div className="flex flex-col items-center justify-center p-6 space-y-4">
                  <Loader2 size={38} className="text-gold animate-spin" />
                  <p className="text-[11px] uppercase font-mono tracking-widest text-gold text-center">{uploadStatus}</p>
                  <div className="w-56 bg-stone-950 h-1.5 rounded-full overflow-hidden border border-stone-850">
                    <div 
                      className="bg-gold h-full transition-all duration-300" 
                      style={{ width: `${uploadProgress}%` }}
                    ></div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center p-4 space-y-4">
                  <div className="p-5 bg-stone-900 rounded-full border border-stone-800 text-gold shadow-xl">
                    <Upload size={28} />
                  </div>
                  <div className="space-y-1.5">
                    <p className="text-[13.5px] uppercase font-display tracking-widest font-extrabold text-white">
                      Drop Corporate Business Card (Front & Back) Here
                    </p>
                    <p className="text-[11px] text-stone-400 font-serif italic max-w-sm mx-auto">
                      Click to upload one or two business card images (such as Front & Back designs) or a multipage PDF template file. Dynamic QR codes are calculated instantly!
                    </p>
                  </div>
                  <div className="text-[8px] font-mono tracking-wider text-stone-500 uppercase pt-2">
                    Accepts up to 2 image files (JPEG/PNG/WEBP), or vector PDF up to 4MB
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* PREVIEW AND DETAIL FORMS PANEL */
            <div className="bg-stone-900/50 border border-stone-800 p-5 shadow-2xl space-y-5">
              
              {/* Visual Preview Banner */}
              <div className="py-6 bg-stone-950/80 border border-stone-850 flex flex-col items-center justify-center relative overflow-hidden">
                <span className="absolute top-2.5 left-3.5 text-[8px] font-mono tracking-widest uppercase text-stone-500 z-10 flex items-center gap-1 select-none">
                  <CreditCard size={10} className="text-gold" />
                  {selectedCard.id.startsWith("mock_") ? "Default CML Base Layout" : "Uploaded Business Card Asset File"}
                </span>

                {/* Resizes elegantly */}
                <div className="w-[335px] h-[190px] shrink-0 relative shadow-2xl rounded-none border border-stone-800 overflow-hidden">
                  {activeSide === "front" ? (
                    selectedCard.pages && selectedCard.pages[0] ? (
                      <img 
                        src={selectedCard.pages[0]} 
                        alt="Business Card Front Preview" 
                        className="w-full h-full object-fill"
                      />
                    ) : (
                      /* Elegant fallback CML graphic Front */
                      <div className="w-full h-full bg-[#FAF8F5] flex text-stone-950 relative p-4 box-border overflow-hidden select-none">
                        <div className="flex-[1.25] flex flex-col justify-center items-center">
                          <StackedCMLLogo darkTheme={false} className="scale-[0.8] origin-center" />
                        </div>
                        <div className="w-6 h-full flex flex-col items-center justify-center relative shrink-0">
                          <div className="absolute top-1 bottom-1 w-[1.2px] bg-[#C5A02D]/70"></div>
                          <div className="absolute top-1 z-10 bg-[#FAF8F5] p-0.5">
                            <CMLEmblem className="w-6 h-6" colorPrimary="#C5A02D" colorSecondary="#1A1A1A" />
                          </div>
                        </div>
                        <div className="flex-1 flex flex-col justify-center text-left pl-1.5">
                          <h4 className="font-display font-black text-[12px] text-[#111111] tracking-wider leading-none mb-0.5">
                            {selectedCard.name}
                          </h4>
                          <p className="font-display font-bold italic text-[7px] text-[#C5A03D] tracking-wide mb-2 uppercase">
                            {selectedCard.title}
                          </p>
                          <div className="space-y-1 text-stone-800 text-[6px] font-mono leading-none">
                            <div className="flex items-center gap-1">
                              <span>☏</span>
                              <span>{selectedCard.phone}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <span>✉</span>
                              <span className="truncate max-w-[85px] block">{selectedCard.email}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <span>🌐</span>
                              <span>{selectedCard.website}</span>
                            </div>
                          </div>
                        </div>
                        <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-[#1A1A1A]"></div>
                      </div>
                    )
                  ) : (
                    selectedCard.pages && selectedCard.pages[1] ? (
                      <img 
                        src={selectedCard.pages[1]} 
                        alt="Business Card Back Preview" 
                        className="w-full h-full object-fill"
                      />
                    ) : (
                      /* Elegant black backing graphic Back */
                      <div className="w-full h-full bg-[#0E0E0E] flex text-white relative p-4 box-border overflow-hidden select-none">
                        <div className="flex-[1.25] flex flex-col justify-center items-center">
                          <StackedCMLLogo darkTheme={true} className="scale-[0.8] origin-center" />
                        </div>
                        <div className="w-[1px] bg-[#C5A02D]/40 my-3 shrink-0"></div>
                        <div className="flex-1 flex flex-col justify-center items-center text-center">
                          {qrCodeDataUrl ? (
                            <div 
                              className="p-0.5 bg-white border border-[#C5A03D]/40 shadow-lg cursor-pointer hover:opacity-85 transition-opacity"
                              onClick={downloadOriginalCardFile}
                              title="Click to download business card"
                            >
                              <img src={qrCodeDataUrl} alt="Contact QR code link" className="w-[45px] h-[45px]" />
                            </div>
                          ) : (
                            <div className="w-[45px] h-[45px] bg-stone-800 animate-pulse"></div>
                          )}
                          <p className="text-[5.5px] font-display font-bold text-gold tracking-widest uppercase mt-1">
                            Scan Card Info
                          </p>
                        </div>
                        <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-[#2C210C]"></div>
                      </div>
                    )
                  )}
                </div>
              </div>

              {/* Toggle Sides */}
              <div className="flex justify-between items-center bg-stone-950 p-2.5 border border-stone-850">
                <div className="text-left">
                  <h4 className="font-display text-[14px] font-black tracking-wide text-white">{selectedCard.name}</h4>
                  <p className="text-[10px] text-stone-400 font-serif italic mt-0.5">{selectedCard.title} &bull; {selectedCard.department}</p>
                </div>
                
                <div className="flex bg-stone-900 p-0.5 border border-stone-800">
                  <button
                    onClick={() => setActiveSide("front")}
                    className={`px-3 py-1.5 text-[8.5px] font-display uppercase tracking-widest font-black transition-all ${
                      activeSide === "front" ? "bg-gold text-stone-950" : "text-stone-450 hover:text-white"
                    }`}
                  >
                    Front Design
                  </button>
                  <button
                    onClick={() => setActiveSide("back")}
                    className={`px-3 py-1.5 text-[8.5px] font-display uppercase tracking-widest font-black transition-all ${
                      activeSide === "back" ? "bg-gold text-stone-950" : "text-stone-450 hover:text-white"
                    }`}
                  >
                    Back Design
                  </button>
                </div>
              </div>

              {/* Upload or Replace Selected Side Individual Image Designs */}
              <div className="bg-stone-950/40 p-3 rounded-none border border-stone-850 flex items-center justify-between gap-4 text-left">
                <div className="space-y-0.5">
                  <span className="text-[8px] font-mono tracking-widest text-[#C5A03D] uppercase font-bold block">
                    Design Control ({activeSide === "front" ? "Front Side" : "Back Side"})
                  </span>
                  <p className="text-[9.5px] text-stone-400 font-serif italic">
                    Replace or add your card's {activeSide === "front" ? "Front design" : "Back design"} separately.
                  </p>
                </div>
                <input 
                  type="file" 
                  ref={replaceSideInputRef}
                  onChange={replaceSideFileSelected}
                  className="hidden" 
                  accept="image/png, image/jpeg, image/jpg, image/webp"
                />
                <button
                  type="button"
                  onClick={() => replaceSideInputRef.current?.click()}
                  className="px-3.5 py-2 bg-stone-900 hover:bg-[#C5A03D] border border-stone-800 hover:text-stone-950 text-stone-300 font-display uppercase font-black text-[9px] tracking-widest transition-all cursor-pointer flex items-center gap-1.5 shrink-0"
                >
                  <Upload size={11} />
                  <span>Replace {activeSide === "front" ? "Front" : "Back"} Side</span>
                </button>
              </div>

              {/* Edit Card Holder Metadata Details Form for Customizing Names/Titles */}
              <form onSubmit={saveUpdatedForm} className="border-t border-stone-850 pt-5 mt-4 space-y-4 text-left">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[10px] font-mono tracking-widest text-[#C5A03D] uppercase font-bold">
                    Edit Cardholder Profile Metadata
                  </span>
                  <div className="h-[1px] bg-stone-800 flex-1"></div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[9px] font-display uppercase tracking-wider text-stone-400 block font-bold">
                      Owner's Full Name
                    </label>
                    <input 
                      type="text"
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      className="w-full bg-stone-950/60 border border-stone-800 focus:border-[#C5A03D] px-3 py-2 text-xs text-white rounded-none outline-none font-serif italic"
                      placeholder="e.g. Charles Cebujano"
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] font-display uppercase tracking-wider text-stone-400 block font-bold">
                      Professional Title
                    </label>
                    <input 
                      type="text"
                      value={formTitle}
                      onChange={(e) => setFormTitle(e.target.value)}
                      className="w-full bg-stone-950/60 border border-stone-800 focus:border-[#C5A03D] px-3 py-2 text-xs text-white rounded-none outline-none font-display uppercase tracking-wider text-[10px]"
                      placeholder="e.g. Digital Media Specialist"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[9px] font-display uppercase tracking-wider text-stone-400 block font-bold">
                      Department
                    </label>
                    <input 
                      type="text"
                      value={formDept}
                      onChange={(e) => setFormDept(e.target.value)}
                      className="w-full bg-stone-950/60 border border-stone-800 focus:border-[#C5A03D] px-3 py-2 text-xs text-white rounded-none outline-none"
                      placeholder="e.g. Creative Services"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] font-display uppercase tracking-wider text-stone-400 block font-bold">
                      Direct Mobile Phone
                    </label>
                    <input 
                      type="text"
                      value={formPhone}
                      onChange={(e) => setFormPhone(e.target.value)}
                      className="w-full bg-stone-950/60 border border-stone-800 focus:border-[#C5A03D] px-3 py-2 text-xs text-white rounded-none outline-none font-mono"
                      placeholder="e.g. +679 998 4676"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[9px] font-display uppercase tracking-wider text-stone-400 block font-bold">
                      Corporate Email
                    </label>
                    <input 
                      type="email"
                      value={formEmail}
                      onChange={(e) => setFormEmail(e.target.value)}
                      className="w-full bg-stone-950/60 border border-stone-800 focus:border-[#C5A03D] px-3 py-2 text-xs text-white rounded-none outline-none font-serif italic"
                      placeholder="e.g. digitalmedia@cml.com.fj"
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] font-display uppercase tracking-wider text-stone-400 block font-bold">
                      Company Website
                    </label>
                    <input 
                      type="text"
                      value={formWebsite}
                      onChange={(e) => setFormWebsite(e.target.value)}
                      className="w-full bg-stone-950/60 border border-stone-800 focus:border-[#C5A03D] px-3 py-2 text-xs text-white rounded-none outline-none"
                      placeholder="e.g. www.cml.com.fj"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-display uppercase tracking-wider text-stone-400 block font-bold">
                    Office / Physical Address
                  </label>
                  <input 
                    type="text"
                    value={formLocation}
                    onChange={(e) => setFormLocation(e.target.value)}
                    className="w-full bg-stone-950/60 border border-stone-800 focus:border-[#C5A03D] px-3 py-2 text-xs text-white rounded-none outline-none font-serif italic"
                    placeholder="e.g. Lot 14 Wasawasa Road, Wailoaloa Beach"
                  />
                </div>

                <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center bg-stone-950/40 p-3 bg-stone-950/40 p-3.5 border border-stone-850 gap-4 mt-2">
                  <button
                    type="submit"
                    className="flex items-center justify-center gap-1.5 px-5 py-2.5 bg-[#C5A03D] hover:bg-white text-stone-955 font-display uppercase font-black text-[10px] tracking-widest transition-all cursor-pointer border border-[#C5A03D] hover:border-white"
                  >
                    Save Details & Recompile QR
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleteCardTarget({ id: selectedCard.id, name: selectedCard.name })}
                    className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-red-955/20 hover:bg-red-950 border border-red-900 text-red-400 hover:text-white font-display uppercase font-black text-[10px] tracking-widest transition-all cursor-pointer"
                    title="Remove registered card profile"
                  >
                    <Trash2 size={13} /> Remove Profile
                  </button>
                </div>
              </form>

            </div>
          )}

        </div>

        {/* RIGHT COLUMN: MASSIVE DYNAMIC QR CODE DISPLAY AND ALL DOWNLOADERS */}
        <div className="lg:col-span-5 h-full">
          <div className="bg-stone-900/40 border border-stone-800 p-6 flex flex-col items-center justify-center text-center space-y-6 h-full min-h-[440px] relative">
            
            {!selectedCard ? (
              <div className="py-12 space-y-3">
                <CreditCard size={48} className="text-stone-700 mx-auto animate-pulse" />
                <h3 className="font-serif italic text-lg text-stone-300">Awaiting Business Card Document</h3>
                <p className="text-xs text-stone-500 font-serif italic max-w-xs mx-auto">
                  Provide a card PDF or custom snapshot artwork image on the left side to compile its scan codes and download paths.
                </p>
              </div>
            ) : (
              <div className="w-full space-y-5">
                <div>
                  <span className="text-[8px] font-mono tracking-[0.25em] text-gold uppercase font-bold block">Corporate Index Compiled</span>
                  <h3 className="font-serif text-2xl italic text-white mt-1">{selectedCard.name}</h3>
                  <p className="text-[9.5px] font-display text-stone-450 tracking-widest uppercase mt-0.5">{selectedCard.title}</p>
                </div>

                {/* QR block frame */}
                <div 
                  className="bg-white p-3 border border-gold/40 shadow-2xl max-w-[200px] mx-auto relative group cursor-pointer transition-transform hover:scale-[1.02]"
                  onClick={downloadOriginalCardFile}
                  title="Click to download business card image"
                >
                  {qrCodeDataUrl ? (
                    <img 
                      src={qrCodeDataUrl} 
                      alt="Digital business card scan gateway QR" 
                      className="w-[176px] h-[176px] object-contain block hover:opacity-90 transition-opacity"
                    />
                  ) : (
                    <div className="w-[176px] h-[176px] bg-stone-950 flex items-center justify-center text-stone-500 text-[10px] font-mono uppercase tracking-wider">
                      Compiling QR Data...
                    </div>
                  )}
                  <div className="absolute inset-0 bg-stone-950/20 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                    <span className="bg-stone-900 text-white text-[8px] font-display uppercase tracking-widest font-black px-2 py-1 shadow-lg border border-gold/30">
                      Download Card
                    </span>
                  </div>
                </div>

                <div className="space-y-1.5 px-3 py-2 bg-stone-900 border border-stone-800 text-center rounded-xs mt-1 shadow-inner">
                  <p className="text-[11.5px] font-serif italic text-stone-200 leading-relaxed max-w-xs mx-auto">
                    "Scan with any mobile camera or click the QR display to instantly download the business card file."
                  </p>
                  <div className="text-[8.5px] font-mono text-gold uppercase tracking-widest font-bold flex items-center justify-center gap-1 pt-1.5">
                    <Sparkles size={9} /> Private Gateway Router Verified
                  </div>
                </div>

                {/* Operations Control Panel */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pt-2 text-[9px] font-display tracking-widest uppercase font-black">
                  
                  {/* SAVE QR CODE AS PNG */}
                  <button
                    onClick={downloadQRFile}
                    className="w-full py-3.5 bg-gold text-stone-950 hover:bg-white hover:text-stone-950 transition-colors flex items-center justify-center gap-2 shadow-lg cursor-pointer"
                  >
                    <Download size={13} className="stroke-[3]" /> Save QR PNG
                  </button>

                  {/* DOWNLOAD SPECIFIC BUSINESS CARD AS PER UPLOAD ONLY */}
                  <button
                    onClick={downloadOriginalCardFile}
                    className="w-full py-3.5 bg-stone-950 border border-gold/30 hover:bg-stone-900 hover:text-gold text-stone-200 transition-colors flex items-center justify-center gap-2 cursor-pointer"
                    title="Downloads the exact original files uploaded"
                  >
                    <FileText size={13} /> Save Business Card
                  </button>

                  {/* ADDITIONAL EXPORTS IN SINGLE BUTTONS */}
                  <button
                    onClick={downloadVCardFile}
                    className="w-full py-3.5 bg-stone-950 border border-stone-850 hover:bg-stone-900 text-stone-200 transition-colors flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Download size={12} /> Save Contact vCard
                  </button>

                  <button
                    onClick={copyProfileShareUrl}
                    className="w-full py-3.5 bg-stone-950 border border-stone-850 hover:bg-stone-900 text-stone-450 hover:text-white transition-colors flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <ExternalLink size={12} /> Copy Gateway URL
                  </button>

                </div>
              </div>
            )}

          </div>
        </div>

      </div>

      {/* REGISTERED HISTORY SLOTS LIST */}
      <div className="bg-stone-950 border border-stone-900 p-5 mt-4 space-y-4 text-left">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h3 className="font-serif text-[17px] italic text-stone-200">Staff Digital Card Registry</h3>
            <p className="text-[10px] text-stone-450 font-serif italic">Select any loaded employee template below to visualize details, scan QR codes, and trigger file exports.</p>
          </div>

          <div className="relative w-full md:w-64">
            <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-stone-550" />
            <input 
              type="text"
              placeholder="Search registry indices..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-stone-900 border border-stone-850 pl-8 pr-3 py-1.5 text-[10.5px] font-display text-white outline-none focus:border-gold/50"
            />
          </div>
        </div>

        {loading ? (
          <div className="py-8 text-center flex items-center justify-center gap-2 text-stone-500 font-mono text-[10px] uppercase">
            <Loader2 size={14} className="animate-spin text-gold" />
            Loading registry table...
          </div>
        ) : filteredCards.length === 0 ? (
          <div className="py-6 text-center text-stone-550 font-serif italic text-xs">
            No registered members match the search requirements.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredCards.map((card) => {
              const isActive = selectedCard && selectedCard.id === card.id;
              return (
                <div
                  key={card.id}
                  onClick={() => setSelectedCard(card)}
                  className={`p-3 text-left cursor-pointer transition-all flex items-center justify-between group border ${
                    isActive 
                      ? "bg-gold/10 border-gold text-gold" 
                      : "bg-stone-900/40 border-stone-850 text-stone-300 hover:border-stone-700 hover:bg-stone-900/80"
                  }`}
                >
                  <div className="truncate max-w-[80%]">
                    <h5 className="text-[11.5px] font-display font-bold leading-tight truncate">{card.name}</h5>
                    <p className="text-[8.5px] text-stone-500 font-mono mt-0.5 truncate uppercase">{card.title}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[8px] font-mono text-stone-600 group-hover:text-gold uppercase">Load</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteCardTarget({ id: card.id, name: card.name });
                      }}
                      className="p-1 opacity-0 group-hover:opacity-100 text-stone-605 hover:text-red-400 transition-all"
                      title="Delete profile"
                    >
                      <Trash2 size={10} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <ConfirmModal
        isOpen={!!deleteCardTarget}
        onClose={() => setDeleteCardTarget(null)}
        onConfirm={deleteCardConfirm}
        title="Purge Card Profile?"
        description={`Are you sure you want to permanently delete the registered business card details for "${deleteCardTarget?.name}"? All associated QR metadata will be unlinked and lost.`}
        confirmLabel="Confirm Purge"
        cancelLabel="Retain Card"
        variant="danger"
      />

    </div>
  );
};
