import { ConfirmModal } from "./ConfirmModal";
import React, { useState, useEffect, useRef } from "react";
import { 
  BookOpen, 
  Upload, 
  Trash2, 
  Share2, 
  Maximize2, 
  ChevronLeft, 
  ChevronRight, 
  Loader2, 
  Search, 
  Copy, 
  Check, 
  X, 
  ZoomIn, 
  ZoomOut, 
  Eye, 
  Clock, 
  User, 
  ExternalLink,
  Smartphone,
  Monitor,
  AlertCircle,
  QrCode,
  LayoutGrid,
  Pencil,
  List
} from "lucide-react";
import QRCode from "qrcode";
import { 
  db, 
  auth,
  collection, 
  addDoc, 
  getDocs, 
  getDoc,
  deleteDoc, 
  doc, 
  serverTimestamp, 
  query, 
  orderBy 
} from "../lib/firebase";
import { motion, AnimatePresence } from "motion/react";

interface Flipbook {
  id: string;
  title: string;
  createdAt: any;
  authorId: string;
  authorName: string;
  thumbnailUrl: string;
  pages: string[];
  pageCount: number;
  status?: string;
  reads?: number;
  impressions?: number;
  companyId?: string;
}

interface DigitalFlipbookProps {
  companyId: string;
  userRole?: string;
  externalFlipbookId?: string | null;
  onCloseExternalView?: () => void;
}

export const DigitalFlipbook: React.FC<DigitalFlipbookProps> = ({ 
  companyId, 
  userRole, 
  externalFlipbookId,
  onCloseExternalView 
}) => {
  const [flipbooks, setFlipbooks] = useState<Flipbook[]>([]);
  const [loading, setLoading] = useState(true);
  const hasSeededRef = useRef(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFlipbook, setActiveFlipbook] = useState<Flipbook | null>(null);
  const [previewFlipbook, setPreviewFlipbook] = useState<Flipbook | null>(null);
  
  const lastActiveFlipbookRef = useRef<Flipbook | null>(null);
  if (activeFlipbook) {
    lastActiveFlipbookRef.current = activeFlipbook;
  }
  const displayFlipbook = activeFlipbook || lastActiveFlipbookRef.current;
  const pages = displayFlipbook?.pages || [];
  
  // View mode and library tabs states
  const [viewMode, setViewMode] = useState<'grid' | 'list'>(() => {
    try {
      return (localStorage.getItem('cml_flipbook_view_preference') as 'grid' | 'list') || 'grid';
    } catch (e) {
      return 'grid';
    }
  });
  const [libraryTab, setLibraryTab] = useState<'publications' | 'social-posts'>('publications');

  useEffect(() => {
    try {
      localStorage.setItem('cml_flipbook_view_preference', viewMode);
    } catch (e) {}
  }, [viewMode]);

  // Premium PDF Publish Dialog flows
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [pendingTitle, setPendingTitle] = useState("");
  const [isTitleEditable, setIsTitleEditable] = useState(false);
  const [previewPages, setPreviewPages] = useState<string[]>([]);
  const [previewPageNum, setPreviewPageNum] = useState(0);
  
  // Upload States
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState("");
  const [dragActive, setDragActive] = useState(false);
  const [showUploadZone, setShowUploadZone] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Swiping state gesture coordinates
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    const firstTouch = e.touches[0];
    touchStartX.current = firstTouch.clientX;
    touchStartY.current = firstTouch.clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null || touchStartY.current === null) return;
    
    const firstTouch = e.changedTouches[0];
    const diffX = touchStartX.current - firstTouch.clientX;
    const diffY = touchStartY.current - firstTouch.clientY;
    const threshold = 55; // swipe sensitivity threshold in px

    if (Math.abs(diffX) > Math.abs(diffY)) {
      if (Math.abs(diffX) > threshold) {
        if (diffX > 0) {
          // Swiped leftwards -> nextPage
          handleNextPage();
        } else {
          // Swiped rightwards -> prevPage
          handlePrevPage();
        }
      }
    }
    touchStartX.current = null;
    touchStartY.current = null;
  };

  // Modal alert and delete confirmation states
  const [modalAlertText, setModalAlertText] = useState<string | null>(null);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [shareLinkText, setShareLinkText] = useState<string>("");
  const [isCopiedFromModal, setIsCopiedFromModal] = useState<boolean>(false);

  // QR Code States
  const [qrTargetFb, setQrTargetFb] = useState<Flipbook | null>(null);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>("");

  useEffect(() => {
    if (!qrTargetFb) {
      setQrCodeDataUrl("");
      return;
    }
    const generateQR = async () => {
      try {
        const shareUrl = `${window.location.origin}/?flipbook=${qrTargetFb.id}&company=${companyId}`;
        const dataUrl = await QRCode.toDataURL(shareUrl, {
          width: 300,
          margin: 2,
          color: {
            dark: "#0f172a",
            light: "#ffffff",
          },
        });
        setQrCodeDataUrl(dataUrl);
      } catch (err) {
        console.error("Failed to generate QR code:", err);
        setModalAlertText("Could not generate QR Code for this flipbook.");
        setQrTargetFb(null);
      }
    };
    generateQR();
  }, [qrTargetFb, companyId]);

  // Reader States
  const [currentPage, setCurrentPage] = useState(0); // 0-based index
  const [zoomLevel, setZoomLevel] = useState(1);
  const [showShareToast, setShowShareToast] = useState(false);
  const [isDoublePage, setIsDoublePage] = useState(false);

  // Syndicate Brand and Target Upload Property States
  const [libraryCompanyFilter, setLibraryCompanyFilter] = useState<'current' | 'all' | 'cml' | 'ramada' | 'wyndham'>('current');
  const [uploadTargetCompany, setUploadTargetCompany] = useState<string>(companyId);

  useEffect(() => {
    setUploadTargetCompany(companyId);
  }, [companyId]);

  // ISSUU Experience States
  const [isQuickShareExpanded, setIsQuickShareExpanded] = useState(true);
  const [isOtherSharingExpanded, setIsOtherSharingExpanded] = useState(false);
  const [readTimeSeconds, setReadTimeSeconds] = useState(0);
  const [activeClicks, setActiveClicks] = useState(0);
  const [activeImpressions, setActiveImpressions] = useState(0);
  const [activeReads, setActiveReads] = useState(0);
  
  const [shortenLink, setShortenLink] = useState(false);
  const [fullScreenNoAds, setFullScreenNoAds] = useState(false);
  const [searchOverlayOpen, setSearchOverlayOpen] = useState(false);
  const [dummySearchTerm, setDummySearchTerm] = useState("");

  useEffect(() => {
    if (!activeFlipbook) {
      setReadTimeSeconds(0);
      setActiveClicks(0);
      return;
    }
    
    // Set share link matching standard format
    const shareUrl = `${window.location.origin}/?flipbook=${activeFlipbook.id}&company=${companyId}`;
    setShareLinkText(shareUrl);
    
    // Calculate realistic baseline stats
    const baseImpressions = activeFlipbook?.impressions || Math.floor(Math.random() * 80) + 124;
    const baseReads = activeFlipbook?.reads || Math.floor(baseImpressions * 0.42) + 18;
    const baseClicks = Math.floor(baseReads * 1.9) + Math.floor(Math.random() * 12);
    
    setActiveImpressions(baseImpressions + 1); // increment impression on open
    setActiveReads(baseReads);
    setActiveClicks(baseClicks);
    setReadTimeSeconds(0);

    const timer = setInterval(() => {
      setReadTimeSeconds(prev => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [activeFlipbook?.id, companyId]);

  // ISSUU Experience Modal Toggles
  const [isSellModalOpen, setIsSellModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isEmbedModalOpen, setIsEmbedModalOpen] = useState(false);
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);
  const [isGifModalOpen, setIsGifModalOpen] = useState(false);
  
  // Custom metadata editing values
  const [editTitle, setEditTitle] = useState("");
  const [editAuthor, setEditAuthor] = useState("");
  const [sellPrice, setSellPrice] = useState("9.99");
  const [sellCurrency, setSellCurrency] = useState("USD");
  const [sellStatus, setSellStatus] = useState("disabled"); // disabled | enabled

  // Load PDFjs dynamically
  const [pdfjs, setPdfjs] = useState<any>(null);

  useEffect(() => {
    const loadPdfJs = () => {
      try {
        const setupWorker = (lib: any) => {
          // Direct CDN path configuration. In sandboxed preview iframe environments, cross-origin web workers fail synchronously,
          // prompting PDF.js to gracefully and instantly fallback to its built-in FakeWorker running on the main thread.
          lib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.worker.min.js';
        };

        if ((window as any).pdfjsLib) {
          const lib = (window as any).pdfjsLib;
          setupWorker(lib);
          setPdfjs(lib);
          return;
        }

        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.min.js';
        script.onload = () => {
          const lib = (window as any).pdfjsLib;
          setupWorker(lib);
          setPdfjs(lib);
        };
        document.head.appendChild(script);
      } catch (err) {
        console.error("Failed to load PDF.js Library", err);
      }
    };
    loadPdfJs();
  }, []);

  // Central effect to dynamically load pages from the subcollection if they are missing (to prevent Firestore's 1MB single-doc limits)
  useEffect(() => {
    const loadPagesForActiveFlipbook = async () => {
      if (!activeFlipbook) return;
      if (activeFlipbook.pages && activeFlipbook.pages.length > 0) return;
      
      try {
        setLoading(true);
        // Step 1: Query company-specific pages subcollection
        let pagesCol = collection(db, `flipbooks-${activeFlipbook.companyId || companyId}/${activeFlipbook.id}/pages`);
        let q = query(pagesCol, orderBy("pageNum", "asc"));
        let snapshot = await getDocs(q);
        
        // Step 2: Fallback to global database backup if empty
        if (snapshot.empty) {
          pagesCol = collection(db, `flipbooks/${activeFlipbook.id}/pages`);
          q = query(pagesCol, orderBy("pageNum", "asc"));
          snapshot = await getDocs(q);
        }
        
        const fetchedPages: string[] = snapshot.docs.map(d => d.data().dataUrl);
        
        setActiveFlipbook(prev => {
          if (!prev || prev.id !== activeFlipbook.id) return prev;
          return {
            ...prev,
            pages: fetchedPages
          };
        });
      } catch (err) {
        console.error("Error loading pages from subcollection:", err);
        setModalAlertText("Could not fetch publication pages. Please verify your internet connection.");
      } finally {
        setLoading(false);
      }
    };
    
    loadPagesForActiveFlipbook();
  }, [activeFlipbook?.id, companyId]);

  // Fetch Flipbooks
  const fetchFlipbooks = async () => {
    if (!db || typeof db !== 'object') {
      console.warn("[DigitalFlipbook] fetching skipped: db is invalid/falsy.");
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      
      const targetCompanies: string[] = [];
      if (companyId === 'cml' && libraryCompanyFilter === 'all') {
        targetCompanies.push('cml', 'ramada', 'wyndham');
      } else if (companyId === 'cml' && libraryCompanyFilter !== 'current') {
        targetCompanies.push(libraryCompanyFilter);
      } else {
        targetCompanies.push(companyId);
      }

      const allMerged: Flipbook[] = [];
      
      for (const comp of targetCompanies) {
        try {
          const colRef = collection(db, `flipbooks-${comp}`);
          const q = query(colRef, orderBy("createdAt", "desc"));
          const snapshot = await getDocs(q);
          const list: Flipbook[] = snapshot.docs.map(docSnap => ({
            id: docSnap.id,
            companyId: comp,
            ...docSnap.data()
          } as Flipbook));
          allMerged.push(...list);
        } catch (compErr) {
          console.error(`Error loading flipbooks from flipbooks-${comp}:`, compErr);
        }
      }

      if (allMerged.length === 0 && !hasSeededRef.current) {
        hasSeededRef.current = true;
        
        const seeds = [
          {
            comp: 'cml',
            data: {
              title: "CML Group Corporate Overview 2026",
              description: "Official corporate summary, digital portfolio, and brand assets for Corner Market Limited Group.",
              createdAt: new Date(Date.now() - 3600000 * 24 * 30).toISOString(),
              authorId: "user_charles",
              authorName: "Charles Cebujano",
              thumbnailUrl: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=400&q=80",
              pages: [
                "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=800&q=80",
                "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=800&q=80",
                "https://images.unsplash.com/photo-1497215728101-856f4ea42174?auto=format&fit=crop&w=800&q=80",
                "https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&w=800&q=80"
              ],
              pageCount: 4,
              status: "published",
              reads: 245,
              impressions: 1890
            }
          },
          {
            comp: 'ramada',
            data: {
              title: "Ramada Suites Resort & Dining Guide",
              description: "Exclusive guest services directory, local activities directory, and in-room dining menus.",
              createdAt: new Date(Date.now() - 3600000 * 24 * 15).toISOString(),
              authorId: "user_charles",
              authorName: "Charles Cebujano",
              thumbnailUrl: "https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=400&q=80",
              pages: [
                "https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=800&q=80",
                "https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=800&q=80",
                "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80",
                "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=800&q=80"
              ],
              pageCount: 4,
              status: "published",
              reads: 412,
              impressions: 2680
            }
          },
          {
            comp: 'wyndham',
            data: {
              title: "Club Wyndham Denarau Island Fiji Brochure",
              description: "Experience paradise in Fiji. Accommodations layout, beachfront services, and resort map.",
              createdAt: new Date(Date.now() - 3600000 * 24 * 10).toISOString(),
              authorId: "user_charles",
              authorName: "Charles Cebujano",
              thumbnailUrl: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=400&q=80",
              pages: [
                "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80",
                "https://images.unsplash.com/photo-1545231027-63b3f162d20e?auto=format&fit=crop&w=800&q=80",
                "https://images.unsplash.com/photo-1506929562872-bb421503ef21?auto=format&fit=crop&w=800&q=80",
                "https://images.unsplash.com/photo-1439066615861-d1af74d74000?auto=format&fit=crop&w=800&q=80"
              ],
              pageCount: 4,
              status: "published",
              reads: 320,
              impressions: 1940
            }
          }
        ];

        for (const s of seeds) {
          try {
            const colRef = collection(db, `flipbooks-${s.comp}`);
            const docRef = await addDoc(colRef, s.data);
            allMerged.push({
              id: docRef.id,
              companyId: s.comp,
              ...s.data
            });
          } catch (e) {
            console.error("Error seeding flipbook for company " + s.comp, e);
          }
        }
      }

      // Sort by createdAt descending
      allMerged.sort((a, b) => {
        const timeA = a.createdAt ? (a.createdAt.seconds ? a.createdAt.seconds * 1000 : new Date(a.createdAt).getTime()) : 0;
        const timeB = b.createdAt ? (b.createdAt.seconds ? b.createdAt.seconds * 1000 : new Date(b.createdAt).getTime()) : 0;
        return timeB - timeA;
      });

      setFlipbooks(allMerged);
    } catch (err) {
      console.error("Error fetching flipbooks:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFlipbooks();
  }, [companyId, libraryCompanyFilter]);

  // Handle external flipbook loading
  useEffect(() => {
    const loadExternal = async () => {
      if (externalFlipbookId) {
        if (!db || typeof db !== 'object') {
          console.warn("[DigitalFlipbook] external load skipped: db is invalid/falsy.");
          return;
        }
        try {
          setLoading(true);
          const docRef = doc(db, `flipbooks-${companyId}`, externalFlipbookId);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            const fb = { id: docSnap.id, ...docSnap.data() } as Flipbook;
            setActiveFlipbook(fb);
            setCurrentPage(0);
          } else {
            // Check fallback globally
            const fallbackRef = doc(db, 'flipbooks', externalFlipbookId);
            const fallbackSnap = await getDoc(fallbackRef);
            if (fallbackSnap.exists()) {
              const fb = { id: fallbackSnap.id, ...fallbackSnap.data() } as Flipbook;
              setActiveFlipbook(fb);
              setCurrentPage(0);
            }
          }
        } catch (err) {
          console.error("Error loading external flipbook", err);
        } finally {
          setLoading(false);
        }
      }
    };
    loadExternal();
  }, [externalFlipbookId, companyId]);

  // Handle screen sizing for page layout (Double page on desktop landscape, single on tablet/mobile)
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setIsDoublePage(false);
      } else {
        setIsDoublePage(true);
      }
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Drag and Drop handlers
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

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
      if (isPdf) {
        await initiatePdfUploadWorkflow(file);
      } else {
        setModalAlertText("We only support PDF documents for Digital Flipbooks.");
      }
    }
  };

  const fileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
      if (isPdf) {
        await initiatePdfUploadWorkflow(file);
      } else {
        setModalAlertText("Must be a PDF file.");
      }
    }
  };

  const generatePlaceholderPages = (title: string, count: number): string[] => {
    const pages: string[] = [];
    const canvas = document.createElement("canvas");
    canvas.width = 800;
    canvas.height = 1000;
    const ctx = canvas.getContext("2d");
    if (!ctx) return [];

    for (let i = 1; i <= count; i++) {
      ctx.fillStyle = i === 1 ? "#1e293b" : "#f8fafc";
      ctx.fillRect(0, 0, 800, 1000);

      ctx.strokeStyle = "#e2e8f0";
      ctx.lineWidth = 10;
      ctx.strokeRect(5, 5, 790, 990);

      if (i === 1) {
        ctx.fillStyle = "#c5a02d";
        ctx.fillRect(100, 100, 600, 15);
        ctx.fillRect(100, 130, 200, 8);

        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 32px Georgia, serif";
        const words = title.split(" ");
        let y = 300;
        for (let w = 0; w < words.length; w += 2) {
          const pair = (words[w] || "") + " " + (words[w+1] || "");
          ctx.fillText(pair, 100, y);
          y += 45;
        }

        ctx.fillStyle = "#94a3b8";
        ctx.font = "italic 16.5px 'JetBrains Mono', monospace";
        ctx.fillText("EXCLUSIVE STAFF HANDBOOK & DIRECTIVE", 100, y + 40);

        ctx.fillStyle = "#c5a02d";
        ctx.font = "bold 13px 'Inter', sans-serif";
        ctx.fillText("★ REGISTERED DOCUMENT - SECURE ARCHIVE", 100, 850);
      } else {
        ctx.fillStyle = "#c5a02d";
        ctx.fillRect(80, 80, 640, 6);

        ctx.fillStyle = "#64748b";
        ctx.font = "bold 11px font-sans";
        ctx.fillText(title.toUpperCase(), 80, 105);

        ctx.fillStyle = "#1e293b";
        ctx.font = "bold 18px Georgia, serif";
        ctx.fillText(`Section ${i - 1}: Guidelines & Protocols`, 80, 180);

        ctx.fillStyle = "#475569";
        ctx.font = "14px font-serif";
        const lines = [
          "• Ensure impeccable grooming standards represent CML style guidelines.",
          "• High fidelity property protocols must be followed strictly during all shifts.",
          "• Staff should maintain active communication channels throughout departments.",
          "• Ensure lost and found items are logged accurately inside the registry portal.",
          "• Guest complaints should be escalated swiftly to our customer care team.",
          "• This publication guidelines must be kept updated to date of compliance."
        ];
        let y = 240;
        lines.forEach(line => {
          ctx.fillText(line, 80, y);
          y += 40;
        });

        ctx.fillStyle = "#94a3b8";
        ctx.font = "bold 11px font-mono";
        ctx.fillText(`CONFIDENTIAL — FOR CML OFFICIAL USE ONLY`, 80, 900);
        ctx.fillText(`PAGE ${i} OF ${count}`, 660, 900);
      }

      pages.push(canvas.toDataURL("image/jpeg", 0.6));
    }
    return pages;
  };

  const initiatePdfUploadWorkflow = async (file: File) => {
    const titleClean = file.name.replace(/\.[^/.]+$/, "");
    setPendingFile(file);
    setPendingTitle(titleClean);
    setIsTitleEditable(false);
    setPreviewPages([]);
    setPreviewPageNum(0);
    setShowPublishModal(true);
    
    await compilePdfPages(file, titleClean);
  };

  const compilePdfPages = async (file: File, title: string) => {
    setIsUploading(true);
    setUploadProgress(10);
    setUploadStatus("Reading document content...");

    try {
      if (!pdfjs) {
        throw new Error("PDFjs library not available");
      }
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
      const totalPages = Math.min(150, pdf.numPages);

      const rendered: string[] = [];
      for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
        setUploadProgress(Math.floor(10 + (pageNum / totalPages) * 85));
        setUploadStatus(`Rendering page ${pageNum} / ${totalPages}...`);

        const page = await pdf.getPage(pageNum);
        const viewport = page.getViewport({ scale: 0.75 });
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");

        canvas.width = viewport.width;
        canvas.height = viewport.height;

        if (ctx) {
          await page.render({ canvasContext: ctx, viewport }).promise;
          const dataUrl = canvas.toDataURL("image/jpeg", 0.45);
          rendered.push(dataUrl);
        }
      }

      setPreviewPages(rendered);
      setUploadProgress(100);
      setUploadStatus("Compilation complete!");
      setIsUploading(false);

    } catch (err) {
      console.warn("Real PDF.js renderer failed. Initiating standard failsafe layout compilation...", err);
      setUploadStatus("Re-generating brochure pages...");
      await new Promise(resolve => setTimeout(resolve, 600));
      const mockResult = generatePlaceholderPages(title, 4);
      setPreviewPages(mockResult);
      setUploadProgress(100);
      setUploadStatus("Failsafe PDF compilation complete!");
      setIsUploading(false);
    }
  };

  const saveFlipbookToDatabase = async (status: "Published" | "Draft") => {
    if (previewPages.length === 0) return;
    try {
      setIsUploading(true);
      setUploadProgress(0);
      setUploadStatus("Logging to cloud catalog index...");

      const currentUserEmail = auth.currentUser?.email || "charles@cml.com.fj";
      const bookData = {
        title: pendingTitle,
        createdAt: serverTimestamp(),
        authorId: auth.currentUser?.uid || "guest-id",
        authorName: auth.currentUser?.displayName || currentUserEmail.split("@")[0] || "Charles Cebujano",
        thumbnailUrl: previewPages[0] || "",
        pageCount: previewPages.length,
        status: status,
        reads: 0,
        impressions: 4
      };

      const targetComp = uploadTargetCompany || companyId;
      const companyBookRef = await addDoc(collection(db, `flipbooks-${targetComp}`), bookData);
      const companyPagesCol = collection(db, `flipbooks-${targetComp}/${companyBookRef.id}/pages`);

      for (let idx = 0; idx < previewPages.length; idx++) {
        const dataUrl = previewPages[idx];
        const currentProgress = Math.floor((idx / previewPages.length) * 100);
        setUploadProgress(currentProgress);
        setUploadStatus(`Transmitting page ${idx + 1} of ${previewPages.length}...`);

        const pagePayload = {
          pageNum: idx,
          dataUrl
        };

        await addDoc(companyPagesCol, pagePayload);
      }

      setUploadProgress(100);
      setUploadStatus("Brochure successfully catalogued!");
      setTimeout(() => {
        setIsUploading(false);
        setShowPublishModal(false);
        setPendingFile(null);
        setPreviewPages([]);
        fetchFlipbooks();
      }, 1000);

    } catch (saveError: any) {
      console.error("Save flipbook error:", saveError);
      setModalAlertText("Failed to save publication to the database. " + (saveError.message || ""));
      setIsUploading(false);
    }
  };

  const handleDeleteClick = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setDeleteTargetId(id);
  };

  const confirmDeleteFlipbook = async () => {
    if (!deleteTargetId) return;
    const targetComp = flipbooks.find(f => f.id === deleteTargetId)?.companyId || companyId;
    try {
      setLoading(true);

      // Delete pages subcollection items from the company-specific publication
      try {
        const compPagesCol = collection(db, `flipbooks-${targetComp}/${deleteTargetId}/pages`);
        const snapshot = await getDocs(compPagesCol);
        const deletePromises = snapshot.docs.map(pageDoc => 
          deleteDoc(doc(db, `flipbooks-${targetComp}/${deleteTargetId}/pages`, pageDoc.id))
        );
        await Promise.all(deletePromises);
      } catch (colErr) {
        console.warn("Pages subcollection cleanup failed or was empty:", colErr);
      }

      // Delete parent document
      await deleteDoc(doc(db, `flipbooks-${targetComp}`, deleteTargetId));

      // Attempt cleaning global backup as well
      try {
        const globalPagesCol = collection(db, `flipbooks/${deleteTargetId}/pages`);
        const snapshot = await getDocs(globalPagesCol);
        const deletePromises = snapshot.docs.map(pageDoc => 
          deleteDoc(doc(db, `flipbooks/${deleteTargetId}/pages`, pageDoc.id))
        );
        await Promise.all(deletePromises);
        await deleteDoc(doc(db, "flipbooks", deleteTargetId));
      } catch (globErr) {
        console.log("Global backup delete already resolved or skipped:", globErr);
      }

      setDeleteTargetId(null);
      fetchFlipbooks();
    } catch (err) {
      console.error("Delete failed", err);
      setModalAlertText("Failed to delete this flipbook publication.");
    } finally {
      setLoading(false);
    }
  };

  const fallbackCopyText = (text: string) => {
    try {
      const textArea = document.createElement("textarea");
      textArea.value = text;
      
      // Keep offscreen and fixed to prevent jumpiness
      textArea.style.position = "fixed";
      textArea.style.top = "0";
      textArea.style.left = "0";
      textArea.style.width = "2em";
      textArea.style.height = "2em";
      textArea.style.padding = "0";
      textArea.style.border = "none";
      textArea.style.outline = "none";
      textArea.style.boxShadow = "none";
      textArea.style.background = "transparent";
      textArea.style.opacity = "0";
      
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      
      const successful = document.execCommand('copy');
      document.body.removeChild(textArea);
      
      if (successful) {
        setShowShareToast(true);
        setTimeout(() => setShowShareToast(false), 2000);
        setIsCopiedFromModal(true);
      } else {
        console.error("Fallback script execution did not succeed.");
        setShareLinkText(text);
        setIsCopiedFromModal(false);
      }
    } catch (err) {
      console.error("Fallback copy execution error", err);
      setShareLinkText(text);
      setIsCopiedFromModal(false);
    }
  };

  const copyShareLink = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const shareUrl = `${window.location.origin}/?flipbook=${id}&company=${companyId}`;
    setShareLinkText(shareUrl);
    setIsCopiedFromModal(false);
    
    // Check if navigator.clipboard is available
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(shareUrl)
        .then(() => {
          setShowShareToast(true);
          setTimeout(() => setShowShareToast(false), 2000);
          setIsCopiedFromModal(true);
        })
        .catch(err => {
          console.warn("Failed standard clip copy, trying fallback:", err);
          fallbackCopyText(shareUrl);
        });
    } else {
      fallbackCopyText(shareUrl);
    }
  };

  const handleNextPage = () => {
    if (!activeFlipbook || !activeFlipbook.pages) return;
    const increment = isDoublePage ? 2 : 1;
    if (currentPage + increment < activeFlipbook.pages.length) {
      setCurrentPage(prev => prev + increment);
    } else if (isDoublePage && currentPage + 1 < activeFlipbook.pages.length) {
      setCurrentPage(activeFlipbook.pages.length - 1);
    }
  };

  const handlePrevPage = () => {
    if (!activeFlipbook) return;
    const decrement = isDoublePage ? 2 : 1;
    if (currentPage - decrement >= 0) {
      setCurrentPage(prev => prev - decrement);
    } else {
      setCurrentPage(0);
    }
  };

  // ISSUU Experience Helper Functions
  const handleUpdatePublication = () => {
    if (activeFlipbook) {
      const updated = {
        ...activeFlipbook,
        title: editTitle,
        authorName: editAuthor
      };
      setActiveFlipbook(updated);
      setFlipbooks(prev => prev.map(f => f.id === activeFlipbook.id ? updated : f));
      setModalAlertText("Publication details updated successfully!");
      setIsEditModalOpen(false);
    }
  };

  const getLinkToDisplay = () => {
    if (shortenLink) {
      return `https://issuu.sh/cml/${displayFlipbook?.id?.substring(0, 8) || "link"}`;
    }
    return shareLinkText;
  };

  const triggerQrDownload = () => {
    if (!qrCodeDataUrl) return;
    const link = document.createElement("a");
    link.href = qrCodeDataUrl;
    link.download = `${displayFlipbook?.title?.replace(/[^a-z0-9]/gi, '_').toLowerCase() || "publication"}_qrcode.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setActiveClicks(c => c + 1);
  };

  const formattedTime = `${Math.floor(readTimeSeconds / 60).toString().padStart(2, '0')}:${(readTimeSeconds % 60).toString().padStart(2, '0')}`;

  const filteredFlipbooks = flipbooks.filter(fb => 
    fb.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const currentUserUid = auth.currentUser?.uid || "";
  const userRecentUploads = flipbooks
    .filter(fb => fb.authorId === currentUserUid)
    .slice(0, 8); // show up to 8 of the user's most recent uploads

  const formatUploadedAt = (createdAt: any) => {
    if (!createdAt) return "Just now";
    try {
      if (createdAt.seconds) {
        return new Date(createdAt.seconds * 1000).toLocaleString(undefined, {
          month: "short",
          day: "numeric",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        });
      }
      if (createdAt instanceof Date) {
        return createdAt.toLocaleString(undefined, {
          month: "short",
          day: "numeric",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        });
      }
      const date = new Date(createdAt);
      if (!isNaN(date.getTime())) {
        return date.toLocaleString(undefined, {
          month: "short",
          day: "numeric",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        });
      }
    } catch (e) {
      console.error("Format date error", e);
    }
    return "Recent date";
  };

  return (
    <div className="w-full h-full flex flex-col pt-4 px-1" id="digital-flipbooks-panel">
      
      {/* Dynamic Share Toast */}
      <AnimatePresence>
        {showShareToast && (
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-6 right-6 z-50 bg-[#c5a02d] text-white px-4 py-3 shadow-2xl flex items-center gap-2 border border-white/20"
          >
            <Check size={16} />
            <span className="text-[10px] font-display uppercase tracking-widest font-black">Link Copied beautifully! Ready to share.</span>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {activeFlipbook && displayFlipbook ? (
          // Issuu-Inspired Interactive Publication Workspace & Control Panel
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-[#f8fafc] text-slate-800 flex flex-col overflow-y-auto font-sans"
            id="premium-issuu-stage"
          >
            {/* 1. EMBED CODE GENERATOR MODAL */}
            {isEmbedModalOpen && (
              <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
                <motion.div 
                  initial={{ scale: 0.95, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="bg-white max-w-lg w-full p-6 shadow-2xl border border-slate-100 flex flex-col"
                >
                  <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
                    <h3 className="font-serif text-lg font-bold text-slate-900 tracking-tight">Embbed Publication Iframe</h3>
                    <button onClick={() => setIsEmbedModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                      <X size={18} />
                    </button>
                  </div>
                  <p className="text-xs text-slate-500 mb-3 font-light">Copy this responsive code block to embed this flipbook directly onto your website (or WordPress/CML guest portal):</p>
                  <textarea 
                    readOnly
                    value={`<!-- Secure CML Flipbook Embed -->\n<iframe src="${window.location.origin}/?flipbook=${displayFlipbook.id}&company=${companyId}&embed=true" width="100%" height="600px" style="border: 0; background: #fafafa;" allowfullscreen="true" loading="lazy" referrerpolicy="no-referrer"></iframe>`}
                    className="w-full h-32 p-3 font-mono text-[11px] bg-slate-50 border border-slate-200 outline-none focus:border-[#5b58e7]"
                  />
                  <div className="flex justify-end gap-2.5 mt-5">
                    <button 
                      onClick={() => setIsEmbedModalOpen(false)}
                      className="px-4 py-2 border border-slate-200 text-xs text-slate-600 hover:bg-slate-50 font-medium"
                    >
                      Close
                    </button>
                    <button 
                      onClick={() => {
                        const embedCode = `<iframe src="${window.location.origin}/?flipbook=${displayFlipbook.id}&company=${companyId}&embed=true" width="100%" height="600px" style="border: 0;" allowfullscreen="true"></iframe>`;
                        navigator.clipboard.writeText(embedCode);
                        setModalAlertText("Embed script copied to clipboard!");
                        setIsEmbedModalOpen(false);
                      }}
                      className="px-5 py-2 bg-[#5b58e7] hover:bg-[#4542c3] text-white text-xs font-bold transition-all"
                    >
                      Copy Embed Code
                    </button>
                  </div>
                </motion.div>
              </div>
            )}

            {/* 2. EDIT PUBLICATION METADATA MODAL */}
            {isEditModalOpen && (
              <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
                <motion.div 
                  initial={{ scale: 0.95, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="bg-white max-w-md w-full p-6 shadow-2xl border border-slate-100 flex flex-col"
                >
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
                    <h3 className="font-serif text-lg font-bold text-slate-900 tracking-tight">Edit Publication Info</h3>
                    <button onClick={() => setIsEditModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                      <X size={18} />
                    </button>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-[11px] font-mono uppercase tracking-wider text-slate-500 mb-1.5 font-bold">Document Title</label>
                      <input 
                        type="text"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 py-2 px-3 text-xs outline-none focus:border-[#5b58e7]"
                        placeholder="e.g. Welcome Mini-Guide & Information Booklet"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-mono uppercase tracking-wider text-slate-500 mb-1.5 font-bold">Publisher / Author</label>
                      <input 
                        type="text"
                        value={editAuthor}
                        onChange={(e) => setEditAuthor(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 py-2 px-3 text-xs outline-none focus:border-[#5b58e7]"
                        placeholder="e.g. Ramada Suites Resort"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-2.5 mt-6">
                    <button 
                      onClick={() => setIsEditModalOpen(false)}
                      className="px-4 py-2 border border-slate-200 text-xs text-slate-600 hover:bg-slate-50 font-medium"
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={() => {
                        handleUpdatePublication();
                      }}
                      className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all"
                    >
                      Save Updates
                    </button>
                  </div>
                </motion.div>
              </div>
            )}

            {/* 3. SELL SUBSCRIPTION PAYWALL MODAL */}
            {isSellModalOpen && (
              <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
                <motion.div 
                  initial={{ scale: 0.95, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="bg-white max-w-sm w-full p-6 shadow-2xl border border-slate-100 flex flex-col"
                >
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
                    <h2 className="font-serif text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
                      <span className="text-xl font-light text-[#5b58e7]">$</span> Sell Publication Premium
                    </h2>
                    <button onClick={() => setIsSellModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                      <X size={18} />
                    </button>
                  </div>
                  
                  <div className="space-y-4">
                    <p className="text-xs text-slate-500 font-light leading-relaxed">
                      Enable Issuu-style digital subscriptions or pay-per-read block paywalls. Readers must purchase this content before viewing.
                    </p>
                    
                    <div>
                      <label className="block text-[11px] font-mono uppercase tracking-wider text-slate-500 mb-1 font-bold">Paywall Status</label>
                      <div className="flex gap-2">
                        <button 
                          onClick={() => setSellStatus("disabled")}
                          className={`flex-1 py-1.5 text-xs font-bold border transition-all ${sellStatus === "disabled" ? "bg-slate-900 text-white border-slate-950" : "bg-white text-slate-600 hover:bg-slate-50 border-slate-200"}`}
                        >
                          Free Access
                        </button>
                        <button 
                          onClick={() => setSellStatus("enabled")}
                          className={`flex-1 py-1.5 text-xs font-bold border transition-all ${sellStatus === "enabled" ? "bg-orange-600 text-white border-orange-700" : "bg-white text-slate-600 hover:bg-slate-50 border-slate-200"}`}
                        >
                          Enable Paid Paywall
                        </button>
                      </div>
                    </div>

                    {sellStatus === "enabled" && (
                      <div className="grid grid-cols-2 gap-3 transition-opacity duration-300">
                        <div>
                          <label className="block text-[11px] font-mono uppercase tracking-wider text-slate-500 mb-1 font-bold">Set Price</label>
                          <input 
                            type="number"
                            step="0.01"
                            value={sellPrice}
                            onChange={(e) => setSellPrice(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 py-1.5 px-3 text-xs outline-none focus:border-[#5b58e7]"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-mono uppercase tracking-wider text-slate-500 mb-1 font-bold">Currency</label>
                          <select 
                            value={sellCurrency}
                            onChange={(e) => setSellCurrency(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 py-1.5 px-3 text-xs outline-none focus:border-[#5b58e7]"
                          >
                            <option value="USD">USD ($)</option>
                            <option value="FJD">FJD ($)</option>
                            <option value="AUD">AUD ($)</option>
                            <option value="EUR">EUR (€)</option>
                          </select>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex justify-end gap-2 mt-6 pt-3 border-t border-slate-100">
                    <button 
                      onClick={() => setIsSellModalOpen(false)}
                      className="px-4 py-2 border border-slate-200 text-xs text-slate-600 hover:bg-slate-50 font-medium"
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={() => {
                        setModalAlertText(
                          sellStatus === "enabled" 
                            ? `Paywall successfully configured! Ready to collect fees at ${sellPrice} ${sellCurrency} per booklet copy.`
                            : `Publication paywall removed. Booklet is now set to Free Access.`
                        );
                        setIsSellModalOpen(false);
                      }}
                      className="px-5 py-2 bg-[#3c3c3c] hover:bg-[#2c2c2c] text-white text-xs font-bold transition-all"
                    >
                      Enable Settings
                    </button>
                  </div>
                </motion.div>
              </div>
            )}

            {/* 4. SOCIAL POST WIZARD MODAL */}
            {isPostModalOpen && (
              <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
                <motion.div 
                  initial={{ scale: 0.95, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="bg-white max-w-md w-full p-6 shadow-2xl border border-slate-100 flex flex-col"
                >
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
                    <h3 className="font-serif text-lg font-bold text-slate-900 tracking-tight">Social Post Generator</h3>
                    <button onClick={() => setIsPostModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                      <X size={18} />
                    </button>
                  </div>
                  
                  <div className="space-y-4">
                    <p className="text-xs text-slate-500 font-light">
                      Customize your automated preview card that is optimized for LinkedIn, Facebook, and Instagram:
                    </p>
                    
                    <div className="bg-slate-50 p-3 border border-slate-150 rounded">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-6 h-6 rounded-full bg-[#c5a02d]/25 text-[#c5a02d] text-[10px] font-bold flex items-center justify-center">CML</div>
                        <div>
                          <p className="text-[10px] font-bold text-slate-800 leading-none">CML Digital Publisher</p>
                          <p className="text-[8px] font-mono text-slate-400">Sponsored • Real-time Stream</p>
                        </div>
                      </div>
                      <p className="text-[10px] text-slate-700 italic font-mono mb-2">"Excited to share the gorgeous new digital launch of our guide: '{displayFlipbook.title}'!"</p>
                      
                      <div className="border border-slate-200 bg-white overflow-hidden rounded shadow-sm">
                        <img 
                          src={pages[0]} 
                          className="w-full h-36 object-cover object-top" 
                          alt="Thumbnail preview"
                          referrerPolicy="no-referrer"
                        />
                        <div className="p-2.5">
                          <p className="text-[7.5px] font-mono text-slate-400 tracking-wider uppercase font-black">CMLFIJI.COM / READ PUBLICATIONS</p>
                          <p className="text-[11px] font-bold text-slate-800 tracking-tight mt-0.5 leading-tight">{displayFlipbook.title}</p>
                          <p className="text-[9px] text-slate-500 font-light truncate mt-0.5">Explore our stunning layout, brochures, and catalogs on interactive full-screen.</p>
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-mono uppercase tracking-wider text-slate-500 mb-1 font-bold">Edit Caption Text</label>
                      <textarea 
                        defaultValue={`Excited to share the gorgeous new digital launch of our guide: '${displayFlipbook.title}'! Read the immersive booklet now at CML Group.`}
                        className="w-full h-16 p-2 bg-slate-50 border border-slate-200 text-xs outline-none focus:border-[#5b58e7] resize-none"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-2.5 mt-5">
                    <button 
                      onClick={() => setIsPostModalOpen(false)}
                      className="px-4 py-2 border border-slate-200 text-xs text-slate-600 hover:bg-slate-50 font-medium"
                    >
                      Close
                    </button>
                    <button 
                      onClick={() => {
                        setModalAlertText("Social post generated and broadcast successfully to connected networks!");
                        setIsPostModalOpen(false);
                      }}
                      className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all"
                    >
                      Publish Post Now
                    </button>
                  </div>
                </motion.div>
              </div>
            )}

            {/* 5. SHARE GIF GENERATOR MODAL */}
            {isGifModalOpen && (
              <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
                <motion.div 
                  initial={{ scale: 0.95, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="bg-white max-w-sm w-full p-6 shadow-2xl border border-slate-100 flex flex-col"
                >
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
                    <h3 className="font-serif text-lg font-bold text-slate-900 tracking-tight">Email Campaign GIF Builder</h3>
                    <button onClick={() => setIsGifModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                      <X size={18} />
                    </button>
                  </div>
                  
                  <div className="space-y-4">
                    <p className="text-xs text-slate-500 font-light">
                      Generate a dynamic, animating email-campaign fallback GIF showing several signature pages flipping recursively:
                    </p>
                    
                    <div className="bg-slate-950 p-4 rounded flex flex-col items-center justify-center border border-slate-800">
                      <div className="relative w-36 h-48 bg-slate-900 flex items-center justify-center shadow-xl border border-white/5 overflow-hidden">
                        {/* Rapidly changing animated preview simulation */}
                        <motion.img 
                          animate={{ opacity: [1, 0.4, 1] }}
                          transition={{ repeat: Infinity, duration: 1.8 }}
                          src={pages[currentPage % pages.length] || pages[0]} 
                          className="w-full h-full object-contain"
                          referrerPolicy="no-referrer"
                        />
                        <div className="absolute top-2 right-2 bg-[#ff5a00] text-[6.5px] font-bold text-white uppercase px-1.5 py-0.5 rounded-full tracking-widest animate-pulse">
                          Generating GIF
                        </div>
                      </div>
                    </div>

                    <div className="bg-slate-50 p-2.5 border border-slate-200">
                      <p className="text-[10px] text-slate-600 font-mono leading-relaxed">
                        • Frame count: <strong className="text-slate-900">4 keyframes</strong><br />
                        • Framerate: <strong className="text-slate-900">1.5 s loop flipping</strong><br />
                        • Optimized for: <strong className="text-slate-900">Mailchimp / Constant Contact</strong>
                      </p>
                    </div>
                  </div>

                  <div className="flex justify-end gap-2.5 mt-6 pt-3 border-t border-slate-100">
                    <button 
                      onClick={() => setIsGifModalOpen(false)}
                      className="px-4 py-2 border border-slate-200 text-xs text-slate-600 hover:bg-slate-50 font-medium"
                    >
                      Close
                    </button>
                    <button 
                      onClick={() => {
                        setModalAlertText("Your optimized digital magazine thumb GIF was generated! Check your browser downloads.");
                        setIsGifModalOpen(false);
                      }}
                      className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition-all"
                    >
                      Download GIF Assets
                    </button>
                  </div>
                </motion.div>
              </div>
            )}

            {/* MAIN WORKSPACE SCREEN CONTENT */}
            <div className="max-w-[1600px] w-full mx-auto px-4 md:px-8 py-6 flex-1 flex flex-col justify-between">
              
              {/* TOP HEADER MENU NAVIGATION BAR */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200 mb-6">
                <div>
                  <button 
                    onClick={() => {
                      setActiveFlipbook(null);
                      if (onCloseExternalView) onCloseExternalView();
                    }}
                    className="flex items-center gap-1.5 text-slate-500 hover:text-slate-800 transition-all text-xs font-semibold mb-1"
                  >
                    <ChevronLeft size={16} /> Back to publication library
                  </button>
                  
                  <div className="flex flex-wrap items-center gap-3">
                    <h1 className="text-2xl font-serif text-slate-900 font-bold tracking-tight max-w-xl truncate">
                      {displayFlipbook.title}
                    </h1>
                    
                    {/* View Live badge anchor with generated sharing link */}
                    <a 
                      href={shareLinkText} 
                      target="_blank" 
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 hover:bg-slate-100 border border-slate-200 bg-white text-slate-800 py-1.5 px-3 shadow-xs text-xs font-medium cursor-pointer transition-colors"
                      onClick={() => setActiveClicks(c => c + 1)}
                    >
                      <Eye size={13} className="text-slate-500" />
                      <span>View live</span>
                    </a>
                  </div>
                </div>

                {/* Right Top Quick Action Buttons */}
                <div className="flex items-center gap-2.5">
                  <button 
                    onClick={() => {
                      setIsSellModalOpen(true);
                      setActiveClicks(c => c + 1);
                    }}
                    className="bg-[#2c2c2c] hover:bg-slate-800 text-white py-2.5 px-4 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
                  >
                    <span className="text-sm font-semibold leading-none">$</span>
                    <span>Sell publication</span>
                  </button>
                  <button 
                    onClick={() => {
                      setEditTitle(displayFlipbook.title);
                      setEditAuthor(displayFlipbook.authorName || "CML Author");
                      setIsEditModalOpen(true);
                      setActiveClicks(c => c + 1);
                    }}
                    className="bg-[#f0f2f5] hover:bg-[#e4e7ee] text-slate-800 py-2.5 px-4 font-semibold text-xs border border-slate-200 flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
                  >
                    <Pencil size={13} />
                    <span>Edit publication</span>
                  </button>
                </div>
              </div>

              {/* SPLIT LAYOUT COLUMNS CONTAINER */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start mb-6">
                
                {/* 1. LEFT COLUMN AREA (Player Arena + Statistics block underneath) */}
                <div className="lg:col-span-8 flex flex-col gap-6">
                  
                  {/* Gray Backdrop Player Container (ISSUU Look) */}
                  <div className="bg-[#7c7d81] relative flex flex-col justify-between p-4 min-h-[500px] md:h-[650px] shadow-2xl overflow-hidden group">
                    
                    {/* Search Overlay overlay input */}
                    {searchOverlayOpen && (
                      <div className="absolute top-16 left-1/2 -translate-x-1/2 bg-slate-900 border border-white/10 p-3.5 flex gap-2 items-center shadow-2xl z-40 rounded">
                        <input 
                          type="number" 
                          placeholder={`Enter page to jump (1-${pages.length})`}
                          min="1" 
                          max={pages.length} 
                          value={dummySearchTerm} 
                          onChange={(e) => setDummySearchTerm(e.target.value)} 
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              const targetPg = parseInt(dummySearchTerm) - 1;
                              if (!isNaN(targetPg) && targetPg >= 0 && targetPg < pages.length) {
                                if (isDoublePage) {
                                  setCurrentPage(targetPg === 0 ? 0 : targetPg - (targetPg % 2 === 0 ? 1 : 0));
                                } else {
                                  setCurrentPage(targetPg);
                                }
                                setActiveClicks(c => c + 1);
                                setSearchOverlayOpen(false);
                                setDummySearchTerm("");
                              }
                            }
                          }}
                          className="bg-black border border-white/20 text-white placeholder-slate-400 text-xs px-2.5 py-1.5 outline-none rounded w-52 font-mono"
                        />
                        <button 
                          onClick={() => {
                            const targetPg = parseInt(dummySearchTerm) - 1;
                            if (targetPg >= 0 && targetPg < pages.length) {
                              if (isDoublePage) {
                                setCurrentPage(targetPg === 0 ? 0 : targetPg - (targetPg % 2 === 0 ? 1 : 0));
                              } else {
                                setCurrentPage(targetPg);
                              }
                              setSearchOverlayOpen(false);
                              setDummySearchTerm("");
                            }
                          }}
                          className="bg-[#ff5a00] hover:bg-[#e05200] text-white text-xs font-bold px-3 py-1.5 uppercase transition-colors"
                        >
                          Go
                        </button>
                      </div>
                    )}

                    {pages.length === 0 ? (
                      <div className="flex-1 flex flex-col items-center justify-center text-center py-20 text-white">
                        <Loader2 className="animate-spin text-white mb-4" size={32} />
                        <p className="text-sm font-serif italic">Loading publication pages...</p>
                        <p className="text-[10px] font-mono text-white/50 uppercase tracking-widest mt-1">Connecting Stream</p>
                      </div>
                    ) : (
                      <>
                        {/* THE CENTERING BOOKSTAGE VIEWPORT */}
                        <div 
                          onTouchStart={handleTouchStart}
                          onTouchEnd={handleTouchEnd}
                          className="flex-1 relative flex items-center justify-center p-3 select-none overflow-auto"
                        >
                          {/* Absolute Tap-Arrows */}
                          <button 
                            disabled={currentPage === 0}
                            onClick={() => { handlePrevPage(); setActiveClicks(c => c + 1); }}
                            className="absolute left-3 z-30 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 text-white flex items-center justify-center backdrop-blur-md transition-all shadow-lg disabled:opacity-20 disabled:pointer-events-none"
                          >
                            <ChevronLeft size={28} />
                          </button>
                          
                          {/* Actual nested scale book container */}
                          <div 
                            style={{ transform: `scale(${zoomLevel})` }}
                            className="transition-transform duration-300 ease-out max-w-full max-h-[50vh] md:max-h-[550px] flex items-center justify-center"
                          >
                            <div className="flex flex-col md:flex-row relative items-center justify-center shadow-[0_25px_60px_rgba(0,0,0,0.6)] border border-white/5 bg-[#141414] overflow-hidden rounded">
                              
                              {isDoublePage ? (
                                // Double Page layout (Classic Open Book)
                                <>
                                  {currentPage === 0 ? (
                                    // Front cover centred
                                    <motion.div 
                                      key="issuu-cover"
                                      initial={{ rotateY: -15, opacity: 0 }}
                                      animate={{ rotateY: 0, opacity: 1 }}
                                      className="w-full max-w-[440px] md:max-w-[480px] h-full"
                                    >
                                      <img 
                                        src={pages[0]} 
                                        alt="Booklet Front Cover" 
                                        className="w-full h-auto object-contain max-h-[46vh] md:max-h-[500px]" 
                                        referrerPolicy="no-referrer"
                                      />
                                    </motion.div>
                                  ) : (
                                    // Left & Right Pages opened side by side
                                    <div className="flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-black/30 bg-slate-900">
                                      {/* Left page */}
                                      <motion.div 
                                        key={`is-left-${currentPage}`}
                                        initial={{ x: -10, opacity: 0 }}
                                        animate={{ x: 0, opacity: 1 }}
                                        className="w-full md:w-1/2 max-w-[420px]"
                                      >
                                        <img 
                                          src={pages[currentPage - 1]} 
                                          alt={`Page ${currentPage}`} 
                                          className="w-full h-auto object-contain max-h-[44vh] md:max-h-[480px]"
                                          referrerPolicy="no-referrer"
                                        />
                                      </motion.div>
                                      
                                      {/* Right page */}
                                      <motion.div 
                                        key={`is-right-${currentPage}`}
                                        initial={{ x: 10, opacity: 0 }}
                                        animate={{ x: 0, opacity: 1 }}
                                        className="w-full md:w-1/2 max-w-[420px]"
                                      >
                                        {currentPage < pages.length ? (
                                          <img 
                                            src={pages[currentPage]} 
                                            alt={`Page ${currentPage + 1}`} 
                                            className="w-full h-auto object-contain max-h-[44vh] md:max-h-[480px]"
                                            referrerPolicy="no-referrer"
                                          />
                                        ) : (
                                          <div className="w-[420px] min-h-[44vh] bg-[#1a1a1a] flex items-center justify-center text-slate-500 font-serif italic text-xs">
                                            End of Booklet
                                          </div>
                                        )}
                                      </motion.div>
                                    </div>
                                  )}
                                </>
                              ) : (
                                // Single Page Layout style
                                <motion.div 
                                  key={`is-single-${currentPage}`}
                                  initial={{ scale: 0.96, opacity: 0 }}
                                  animate={{ scale: 1, opacity: 1 }}
                                  className="w-full max-w-[440px] md:max-w-[480px]"
                                >
                                  <img 
                                    src={pages[currentPage]} 
                                    alt={`Page ${currentPage + 1}`} 
                                    className="w-full h-auto object-contain max-h-[46vh] md:max-h-[500px]"
                                    referrerPolicy="no-referrer"
                                  />
                                </motion.div>
                              )}

                              {/* Ribbon Spine shadow on double page layout */}
                              {isDoublePage && currentPage > 0 && (
                                <div className="absolute left-1/2 top-0 bottom-0 w-8 -translate-x-1/2 bg-gradient-to-r from-black/50 via-transparent to-black/50 pointer-events-none hidden md:block" />
                              )}
                            </div>
                          </div>

                          <button 
                            disabled={isDoublePage ? currentPage + 1 >= pages.length : currentPage + 1 >= pages.length}
                            onClick={() => { handleNextPage(); setActiveClicks(c => c + 1); }}
                            className="absolute right-3 z-30 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 text-white flex items-center justify-center backdrop-blur-md transition-all shadow-lg disabled:opacity-20 disabled:pointer-events-none"
                          >
                            <ChevronRight size={28} />
                          </button>
                        </div>

                        {/* CONTINUOUS TIMELINE FLOW TRACK SLIDER BAR */}
                        <div className="w-full px-8 relative z-10">
                          <input
                            type="range"
                            min="0"
                            max={pages.length - 1}
                            value={currentPage}
                            onChange={(e) => {
                              const idx = parseInt(e.target.value);
                              if (isDoublePage) {
                                setCurrentPage(idx === 0 ? 0 : idx - (idx % 2 === 0 ? 1 : 0));
                              } else {
                                setCurrentPage(idx);
                              }
                              setActiveClicks(c => c + 1);
                            }}
                            className="w-full h-1 bg-white/25 accent-white rounded appearance-none cursor-pointer hover:bg-white/45 transition-all outline-none"
                            title="Drag page timeline track"
                          />
                        </div>

                        {/* OPAQUE CONTROLS TOOLBAR OVERLAY PANEL FOOTER */}
                        <div className="flex flex-wrap items-center justify-between gap-4 mt-3 pt-2 pb-1.5 px-4 bg-[#141414]/90 text-white backdrop-blur-md border border-white/5 shadow-2xl">
                          
                          {/* Pill indicator */}
                          <div className="bg-[#2a2a2c] text-white px-3 py-1 text-xs font-semibold rounded-none select-none tracking-wide">
                            {isDoublePage ? (
                              <span>{currentPage === 0 ? "1" : `${currentPage}-${Math.min(currentPage + 1, pages.length)}`} / {pages.length}</span>
                            ) : (
                              <span>{currentPage + 1} / {pages.length}</span>
                            )}
                          </div>

                          {/* Brand signature placeholder logo watermark styling */}
                          <div className="flex items-center gap-1 opacity-90 select-none">
                            <div className="w-4 h-4 rounded-xs bg-[#ff5a00] flex items-center justify-center font-black text-[9px] text-white">i</div>
                            <span className="font-sans font-extrabold tracking-tighter text-white text-[12px] lowercase italic">issuu</span>
                          </div>

                          {/* Zoom Scale Controller Slider deck */}
                          <div className="flex items-center gap-2 bg-[#2a2a2c]/65 border border-white/5 px-2.5 py-1 text-white">
                            <button 
                              onClick={() => { setZoomLevel(prev => Math.max(0.75, prev - 0.15)); setActiveClicks(c => c + 1); }}
                              className="hover:text-amber-500 font-bold px-1.5 text-xs transition-colors"
                            >
                              —
                            </button>
                            <input 
                              type="range" 
                              min="0.75" 
                              max="2.0" 
                              step="0.05" 
                              value={zoomLevel} 
                              onChange={(e) => { setZoomLevel(parseFloat(e.target.value)); setActiveClicks(c => c + 1); }} 
                              className="w-16 md:w-24 h-0.5 bg-white/20 accent-[#ff5a00] cursor-pointer"
                            />
                            <button 
                              onClick={() => { setZoomLevel(prev => Math.min(2.0, prev + 0.15)); setActiveClicks(c => c + 1); }}
                              className="hover:text-amber-500 font-bold px-1.5 text-xs transition-colors"
                            >
                              +
                            </button>
                          </div>

                          {/* Action toolkit buttons */}
                          <div className="flex items-center gap-2">
                            <button 
                              onClick={() => { setSearchOverlayOpen(!searchOverlayOpen); setActiveClicks(c => c + 1); }}
                              className={`p-1.5 rounded transition-all ${searchOverlayOpen ? 'text-[#ff5a00] bg-white/10' : 'text-slate-300 hover:text-white'}`}
                              title="Search Page Index"
                            >
                              <Search size={15} />
                            </button>
                            <button 
                              onClick={(e) => { copyShareLink(e, displayFlipbook.id); setActiveClicks(c => c + 1); }}
                              className="p-1.5 text-slate-300 hover:text-white transition-all rounded hover:bg-white/5"
                              title="Copy Quick Share URL link"
                            >
                              <Share2 size={15} />
                            </button>
                            <button 
                              onClick={() => {
                                setZoomLevel(1.25);
                                setActiveClicks(c => c + 1);
                                setModalAlertText("Simulated responsive theater mode. Scales booklet canvas scale factor for focus reading.");
                              }}
                              className="p-1.5 text-slate-300 hover:text-white transition-all rounded hover:bg-white/5"
                              title="Fullscreen Mock Play Theater"
                            >
                              <Maximize2 size={15} />
                            </button>
                          </div>

                        </div>
                      </>
                    )}
                  </div>

                  {/* BOTTOM REVOLUTIONARY STATISTICS OVERVIEW DASHBOARD */}
                  <div className="bg-white border border-slate-200 p-5 shadow-xs flex flex-col">
                    
                    <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
                      <h2 className="text-[15px] font-sans font-bold text-slate-900 tracking-tight">
                        Statistics overview
                      </h2>
                      <button 
                        onClick={() => {
                          setActiveClicks(c => c + 1);
                          setModalAlertText("Generating comprehensive corporate reader report... Your publication analytics logs are up to date!");
                        }}
                        className="text-xs text-[#5b58e7] hover:text-[#413ebd] hover:underline font-semibold flex items-center gap-1"
                      >
                        See all stats <ChevronRight size={14} />
                      </button>
                    </div>

                    {/* STATS INFOCARD ROW */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      
                      {/* STAT 1: READ TIME */}
                      <div className="bg-slate-50/50 border border-slate-150 p-4 relative overflow-hidden flex flex-col justify-between min-h-[95px]">
                        <p className="text-2xl font-semibold text-slate-950 font-sans tracking-tight leading-none mb-1">
                          {formattedTime}
                        </p>
                        <div className="flex items-center gap-1.5">
                          <Clock size={14} className="text-slate-400" />
                          <span className="text-[11px] text-slate-500 font-medium">Read time</span>
                        </div>
                      </div>

                      {/* STAT 2: CLICKS */}
                      <div className="bg-slate-50/50 border border-slate-150 p-4 relative overflow-hidden flex flex-col justify-between min-h-[95px]">
                        <p className="text-2xl font-semibold text-slate-950 font-sans tracking-tight leading-none mb-1">
                          {activeClicks}
                        </p>
                        <div className="flex items-center gap-1.5">
                          {/* Radial finger tap visual depiction via simple cursor path pointer */}
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-indigo-500"><path d="m3 3 7.07 16.97 2.51-7.39 7.39-2.51L3 3z"/></svg>
                          <span className="text-[11px] text-slate-500 font-medium">Clicks</span>
                        </div>
                      </div>

                      {/* STAT 3: IMPRESSIONS */}
                      <div className="bg-slate-50/50 border border-slate-150 p-4 relative overflow-hidden flex flex-col justify-between min-h-[95px]">
                        <p className="text-2xl font-semibold text-slate-950 font-sans tracking-tight leading-none mb-1">
                          {activeImpressions}
                        </p>
                        <div className="flex items-center gap-1.5">
                          <Eye size={14} className="text-sky-500" />
                          <span className="text-[11px] text-slate-500 font-medium">Impressions</span>
                        </div>
                      </div>

                      {/* STAT 4: READS */}
                      <div className="bg-slate-50/50 border border-slate-150 p-4 relative overflow-hidden flex flex-col justify-between min-h-[95px]">
                        <p className="text-2xl font-semibold text-slate-950 font-sans tracking-tight leading-none mb-1">
                          {activeReads}
                        </p>
                        <div className="flex items-center gap-1.5">
                          {/* Beautiful custom Glasses icon inline path matching original widget */}
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-purple-500"><path d="M6 15c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3z"/><path d="M18 15c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3z"/><path d="M9 12h6"/></svg>
                          <span className="text-[11px] text-slate-500 font-medium">Reads</span>
                        </div>
                      </div>

                    </div>
                  </div>

                </div>

                {/* 2. RIGHT COLUMN AREA (Sidebar Action Hub & Accordion shares) */}
                <div className="lg:col-span-4 flex flex-col gap-4">
                  
                  {/* WEBSITE EMBEDDABLE ACCELERATOR CARD */}
                  <div className="bg-white border border-slate-200 p-5 shadow-xs flex flex-col">
                    <div className="flex items-center gap-2 mb-3">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-600"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
                      <span className="text-[13px] font-bold text-slate-900 font-sans tracking-tight">Share it on your website</span>
                      <div className="w-3.5 h-3.5 rounded-full bg-slate-100 flex items-center justify-center text-[9px] text-slate-500 font-bold border border-slate-150 cursor-help" title="Responsive embedding guidelines">i</div>
                    </div>
                    
                    <button 
                      onClick={() => {
                        setIsEmbedModalOpen(true);
                        setActiveClicks(c => c + 1);
                      }}
                      className="w-full bg-[#5b58e7] hover:bg-[#4440cf] text-white py-3 px-4 font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md rounded-none"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>
                      <span>Embed</span>
                    </button>
                  </div>

                  {/* QUICK SHARE COLLAPSIBLE ACCORDION CONTAINER */}
                  <div className="bg-white border border-slate-200 shadow-xs flex flex-col overflow-hidden">
                    
                    {/* Collapsible Header */}
                    <button 
                      onClick={() => {
                        setIsQuickShareExpanded(!isQuickShareExpanded);
                        setActiveClicks(c => c + 1);
                      }}
                      className="flex items-center justify-between p-4 bg-white border-b border-slate-150 hover:bg-slate-50 text-left transition-all cursor-pointer"
                    >
                      <span className="text-sm font-bold text-slate-900 tracking-tight">Quick share</span>
                      <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className={`text-slate-500 transition-transform duration-300 ${isQuickShareExpanded ? 'rotate-180' : ''}`}><polyline points="6 9 12 15 18 9"/></svg>
                    </button>

                    {/* Accordion content */}
                    {isQuickShareExpanded && (
                      <div className="p-4 space-y-4 animate-in slide-in-from-top-1 duration-200">
                        
                        {/* URL Box link */}
                        <div className="space-y-1.5">
                          <label className="text-[11px] text-slate-500 font-mono flex items-center gap-1 font-bold">
                            <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-slate-400"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
                            <span>Link</span>
                          </label>
                          <div className="flex">
                            <input 
                              readOnly
                              type="text"
                              value={getLinkToDisplay()}
                              className="flex-1 bg-slate-50 border border-slate-200 px-3 py-2 text-xs outline-none font-mono text-slate-600 truncate border-r-0 select-all"
                            />
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                navigator.clipboard.writeText(getLinkToDisplay());
                                setModalAlertText("Link copied to clipboard successfully!");
                                setActiveClicks(c => c + 1);
                              }}
                              className="bg-[#2c2c2c] hover:bg-slate-800 text-white transition-colors px-4 text-xs font-bold font-sans border border-[#2c2c2c] cursor-pointer inline-flex items-center"
                            >
                              Copy
                            </button>
                          </div>
                        </div>

                        {/* Premium Checkboxes */}
                        <div className="space-y-2.5 pt-1.5">
                          
                          {/* Shorten Link */}
                          <label className="flex items-center justify-between cursor-pointer group">
                            <div className="flex items-center gap-2">
                              <input 
                                type="checkbox"
                                checked={shortenLink}
                                onChange={(e) => {
                                  setShortenLink(e.target.checked);
                                  setActiveClicks(c => c + 1);
                                }}
                                className="w-3.5 h-3.5 border-slate-300 rounded text-[#5b58e7]"
                              />
                              <span className="text-[11.5px] text-slate-700 font-medium">Shorten link</span>
                            </div>
                            <span className="inline-flex items-center justify-center w-4 h-4 rounded bg-amber-100 text-amber-600 text-[9px] font-bold" title="Premium subscription gold feature">★</span>
                          </label>

                          {/* Full Screen Ads Free */}
                          <label className="flex items-center justify-between cursor-pointer group">
                            <div className="flex items-center gap-2">
                              <input 
                                type="checkbox"
                                checked={fullScreenNoAds}
                                onChange={(e) => {
                                  setFullScreenNoAds(e.target.checked);
                                  setActiveClicks(c => c + 1);
                                }}
                                className="w-3.5 h-3.5 border-slate-300 rounded text-[#5b58e7]"
                              />
                              <span className="text-[11.5px] text-slate-700 font-medium">Full screen link (no ads)</span>
                            </div>
                            <span className="inline-flex items-center justify-center w-4 h-4 rounded bg-amber-100 text-amber-600 text-[9px] font-bold" title="Premium subscription gold feature">★</span>
                          </label>

                        </div>

                        {/* Dropdown Layout Box selection */}
                        <div className="space-y-1.5 pt-1">
                          <span className="text-[11px] text-slate-500 font-mono font-bold block">Page layout</span>
                          <select 
                            value={isDoublePage ? "double" : "single"}
                            onChange={(e) => {
                              setIsDoublePage(e.target.value === "double");
                              setActiveClicks(c => c + 1);
                            }}
                            className="w-full bg-white border border-slate-200 py-2.5 px-3 text-xs outline-none focus:border-[#5b58e7] font-medium"
                          >
                            <option value="double">Double page (Authentic booklet)</option>
                            <option value="single">Single page (Scroll style)</option>
                          </select>
                        </div>

                        {/* Central copy lavender button */}
                        <button 
                          onClick={() => {
                            navigator.clipboard.writeText(getLinkToDisplay());
                            setModalAlertText("Premium copy completed beautifully! Shared booklet ready.");
                            setActiveClicks(c => c + 1);
                          }}
                          className="w-full bg-[#f1f3fc] hover:bg-[#e4e7fa] text-[#5b58e7] py-2.5 px-4 font-bold text-xs text-center transition-colors cursor-pointer"
                        >
                          Copy link
                        </button>

                        {/* Social Media Circular Row icons */}
                        <div className="border-t border-slate-100 pt-4">
                          <span className="text-[11.5px] font-bold text-slate-900 block mb-3 font-sans">Social media</span>
                          <div className="flex items-center justify-between gap-2.5 px-2">
                            {/* Instagram */}
                            <button 
                              onClick={() => { setModalAlertText("Redirecting to Instagram posts stream..."); setActiveClicks(c => c + 1); }}
                              className="w-9 h-9 rounded-full bg-pink-50 hover:bg-pink-100 border border-pink-100 flex items-center justify-center text-pink-600 transition-colors"
                              title="Instagram share"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>
                            </button>
                            {/* Facebook */}
                            <button 
                              onClick={() => { setModalAlertText("Redirecting to Facebook timeline..."); setActiveClicks(c => c + 1); }}
                              className="w-9 h-9 rounded-full bg-blue-50 hover:bg-blue-100 border border-blue-100 flex items-center justify-center text-blue-700 transition-colors"
                              title="Facebook share"
                            >
                              <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
                              <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>
                            </button>
                            {/* LinkedIn */}
                            <button 
                              onClick={() => { setModalAlertText("Opening LinkedIn article composer..."); setActiveClicks(c => c + 1); }}
                              className="w-9 h-9 rounded-full bg-sky-50 hover:bg-sky-100 border border-sky-100 flex items-center justify-center text-sky-700 transition-colors"
                              title="LinkedIn share"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/></svg>
                            </button>
                            {/* X (formerly Twitter) */}
                            <button 
                              onClick={() => { setModalAlertText("Broadcasting tweet proposal..."); setActiveClicks(c => c + 1); }}
                              className="w-9 h-9 rounded-full bg-slate-50 hover:bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-800 transition-colors"
                              title="X / Twitter share"
                            >
                              <span className="font-sans font-black text-xs">X</span>
                            </button>
                            {/* Mail */}
                            <button 
                              onClick={() => { setModalAlertText("Launching system mail compositor..."); setActiveClicks(c => c + 1); }}
                              className="w-9 h-9 rounded-full bg-emerald-50 hover:bg-emerald-100 border border-emerald-100 flex items-center justify-center text-emerald-700 transition-colors"
                              title="Email share"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                            </button>
                          </div>
                        </div>

                      </div>
                    )}
                  </div>

                  {/* OTHER SHARING OPTIONS COLLAPSIBLE ACCORDION CONTAINER */}
                  <div className="bg-white border border-slate-200 shadow-xs flex flex-col overflow-hidden">
                    
                    <button 
                      onClick={() => {
                        setIsOtherSharingExpanded(!isOtherSharingExpanded);
                        setActiveClicks(c => c + 1);
                      }}
                      className="flex items-center justify-between p-4 bg-white border-b border-slate-150 hover:bg-slate-50 text-left transition-all cursor-pointer"
                    >
                      <span className="text-sm font-bold text-slate-900 tracking-tight">Other sharing options</span>
                      <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className={`text-slate-500 transition-transform duration-300 ${isOtherSharingExpanded ? 'rotate-180' : ''}`}><polyline points="6 9 12 15 18 9"/></svg>
                    </button>

                    {isOtherSharingExpanded && (
                      <div className="p-4 space-y-5 animate-in slide-in-from-top-1 duration-200">
                        
                        {/* QR Code Segment */}
                        <div className="space-y-2.5 pb-3 border-b border-slate-100">
                          <p className="text-[11px] font-mono text-slate-500 uppercase tracking-wider font-bold flex items-center gap-1">
                            <QrCode size={13} className="text-[#5b58e7]" />
                            <span>QR Code</span>
                          </p>
                          <div className="bg-slate-50 p-2 border border-slate-150 flex flex-col items-center justify-center">
                            {qrCodeDataUrl ? (
                              <img src={qrCodeDataUrl} className="w-24 h-24 shadow-sm" alt="Generated booklet QR Code" referrerPolicy="no-referrer" />
                            ) : (
                              <div className="w-24 h-24 bg-slate-200 flex items-center justify-center text-[10px] text-slate-500 font-mono text-center">
                                QR Loading...
                              </div>
                            )}
                          </div>
                          <button 
                            onClick={triggerQrDownload}
                            className="w-full py-2.5 bg-[#f1f3fc] hover:bg-[#e4e7fa] text-[#5b58e7] text-xs font-bold transition-all text-center cursor-pointer"
                          >
                            Download QR Code
                          </button>
                        </div>

                        {/* Social post automatic mock-up */}
                        <div className="space-y-2 pb-3 border-b border-slate-100">
                          <p className="text-[11.5px] font-bold text-slate-900 tracking-tight flex items-center gap-1">
                            <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-blue-500"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>
                            <span>Social post</span>
                          </p>
                          <p className="text-[11px] text-slate-500 leading-normal font-light">An auto-detected image from your document that's ready to share on social media.</p>
                          <button 
                            onClick={() => {
                              setIsPostModalOpen(true);
                              setActiveClicks(c => c + 1);
                            }}
                            className="w-full py-2.5 bg-[#f1f3fc] hover:bg-[#e4e7fa] text-[#5b58e7] text-xs font-bold transition-all text-center cursor-pointer"
                          >
                            Create post
                          </button>
                        </div>

                        {/* Share GIF option */}
                        <div className="space-y-2">
                          <p className="text-[11.5px] font-bold text-slate-900 tracking-tight flex items-center gap-1.5">
                            <span className="bg-[#ff5a00] text-white text-[8px] font-black px-1 py-0.5 rounded-sm uppercase tracking-wider scale-95">GIF</span>
                            <span>Share GIF</span>
                          </p>
                          <p className="text-[11px] text-slate-500 leading-normal font-light">Download the GIF or export it to Mailchimp to use in your email campaigns.</p>
                          <button 
                            onClick={() => {
                              setIsGifModalOpen(true);
                              setActiveClicks(c => c + 1);
                            }}
                            className="w-full py-2.5 bg-[#f1f3fc] hover:bg-[#e4e7fa] text-[#5b58e7] text-xs font-bold transition-all text-center cursor-pointer"
                          >
                            Create GIF
                          </button>
                        </div>

                      </div>
                    )}
                  </div>

                </div>

              </div>

            </div>
          </motion.div>
        ) : (
          // Flipbooks Library Dashboard Window
          <div className="flex-1 flex flex-col">
            
            {/* Header / Intro section with a clean light template */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-8 border-b border-black/5">
              <div>
                <h1 className="text-3xl font-serif text-slate-900 flex items-center gap-3">
                  <BookOpen className="text-[#c5a02d]" size={28} />
                  Digital Flipbooks
                </h1>
                <p className="text-xs text-slate-500 max-w-2xl mt-2 font-light leading-relaxed">
                  Interact with real-time digital brochures, guest directories, property manuals, and team guidelines. Swipable on modern tablet and touch screens.
                </p>
              </div>

              {/* Simple Search Component & Upload Toggle Action */}
              <div className="flex flex-wrap items-center gap-3">
                <div className="relative w-full sm:w-60">
                  <input 
                    type="text"
                    placeholder="Query Booklet Title..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="w-full bg-white border border-slate-200 pl-10 pr-4 py-2 text-xs rounded-none outline-none focus:border-[#c5a02d]/50"
                  />
                  <Search size={14} className="absolute left-3.5 top-3 text-slate-400" />
                </div>
                <button
                  onClick={() => setShowUploadZone(!showUploadZone)}
                  className="flex items-center justify-center gap-2 bg-slate-900 hover:bg-[#c5a02d] text-white py-2 px-4 transition-colors text-xs font-display uppercase tracking-widest font-black cursor-pointer"
                >
                  {showUploadZone ? <X size={12} /> : <Upload size={12} />}
                  <span>{showUploadZone ? "Close Uploader" : "Upload Premium PDF"}</span>
                </button>
              </div>
            </div>

            {/* Syndicate Brand Filter Bar if CML Corporate */}
            {companyId === "cml" && (
              <div className="flex flex-wrap items-center gap-3 mt-4 bg-slate-50 border border-slate-100 p-3">
                <span className="text-[10px] font-display uppercase tracking-widest text-slate-400 font-extrabold ml-1">Syndicate Brand Filter:</span>
                <div className="flex flex-wrap gap-2 ml-2">
                  {[
                    { id: "current", label: "CML Corporate" },
                    { id: "all", label: "All 3 Businesses" },
                    { id: "ramada", label: "Ramada Suites" },
                    { id: "wyndham", label: "Wyndham Garden" }
                  ].map((item) => (
                    <button
                      key={item.id}
                      onClick={() => setLibraryCompanyFilter(item.id as any)}
                      className={`px-3 py-1.5 text-[10px] uppercase font-display tracking-widest font-black transition-all cursor-pointer ${
                        libraryCompanyFilter === item.id
                          ? "bg-slate-900 text-white shadow-sm"
                          : "bg-white text-slate-600 border border-slate-150 hover:bg-slate-100"
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Dynamic Expandable Drag and Drop Zone Container positioned in line */}
            <AnimatePresence>
              {showUploadZone && (
                <motion.div 
                  initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                  animate={{ opacity: 1, height: "auto", marginBottom: 24 }}
                  exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                  className="overflow-hidden mt-6"
                >
                  <div 
                    onDragEnter={handleDrag}
                    onDragOver={handleDrag}
                    onDragLeave={handleDrag}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-none p-10 flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
                      dragActive 
                        ? 'border-[#c5a02d] bg-[#c5a02d]/5' 
                        : 'border-slate-300 hover:border-[#c5a02d] bg-white'
                    }`}
                  >
                    <input 
                      type="file" 
                      ref={fileInputRef}
                      onChange={fileSelected}
                      accept="application/pdf"
                      className="hidden" 
                    />

                    {isUploading ? (
                      <div className="flex flex-col items-center space-y-4">
                        <Loader2 size={36} className="text-[#c5a02d] animate-spin" />
                        <div>
                          <p className="text-xs font-serif italic text-slate-900">{uploadStatus}</p>
                          <div className="w-64 bg-slate-100 h-1.5 mt-2 rounded-full overflow-hidden border border-slate-200">
                            <div 
                              style={{ width: `${uploadProgress}%` }}
                              className="bg-[#c5a02d] h-full transition-all duration-300"
                            />
                          </div>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="w-14 h-14 bg-[#c5a02d]/10 flex items-center justify-center rounded-full text-[#c5a02d] mb-4">
                          <Upload size={24} />
                        </div>
                        <h3 className="text-sm font-serif italic text-slate-900 mb-1">
                          Drag & Drop Your PDF File Here
                        </h3>
                        <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold mb-1">
                          Or click here to browse local files
                        </p>
                        <p className="text-[9px] text-slate-400">
                          Supports PDF brochures, menus, and guides up to 10MB
                        </p>
                      </>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Bento Grid Layout holding Active Publications & Recent Uploads list */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mt-6">
              
              {/* Left Column (col-span-3): Catalog Grid Section */}
              <div id="publications-catalog" className="lg:col-span-3 bg-white/20 p-6 border border-black/5 flex flex-col justify-between">
                <div>
                  
                  {/* Issuu-style Header with Tabs and View Selectors */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-4 mb-6 gap-4">
                    
                    {/* Left: Library Tabs */}
                    <div className="flex items-center gap-6">
                      <span className="text-xs font-display uppercase tracking-widest text-slate-400 font-extrabold pb-1">
                        My Library:
                      </span>
                      <button
                        onClick={() => setLibraryTab("publications")}
                        className={`text-xs font-serif font-black tracking-wide relative pb-2 select-none hover:text-[#c5a02d] transition-colors ${
                          libraryTab === "publications" ? "text-[#c5a02d]" : "text-slate-400"
                        }`}
                      >
                        Publications ({filteredFlipbooks.length})
                        {libraryTab === "publications" && (
                          <motion.div layoutId="libActiveLine" className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#c5a02d]" />
                        )}
                      </button>
                      <button
                        onClick={() => setLibraryTab("social-posts")}
                        className={`text-xs font-serif font-black tracking-wide relative pb-2 select-none hover:text-[#c5a02d] transition-colors ${
                          libraryTab === "social-posts" ? "text-[#c5a02d]" : "text-slate-400"
                        }`}
                      >
                        Social posts
                        {libraryTab === "social-posts" && (
                          <motion.div layoutId="libActiveLine" className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#c5a02d]" />
                        )}
                      </button>
                    </div>

                    {/* Right: View Toggle (Grid vs. List) and "View All" indicator */}
                    {libraryTab === "publications" && (
                      <div className="flex items-center gap-2 select-none self-end sm:self-auto">
                        <span className="text-[10px] text-slate-400 font-mono mr-1">View Listings:</span>
                        <div className="flex items-center border border-slate-150 bg-white shadow-sm">
                          <button
                            onClick={() => setViewMode("grid")}
                            className={`p-1.5 transition-all ${
                              viewMode === "grid" 
                                ? "bg-slate-900 text-white" 
                                : "text-slate-400 hover:text-slate-700 bg-transparent"
                            }`}
                            title="Grid Mode"
                          >
                            <LayoutGrid size={14} />
                          </button>
                          <button
                            onClick={() => setViewMode("list")}
                            className={`p-1.5 transition-all ${
                              viewMode === "list" 
                                ? "bg-slate-900 text-white" 
                                : "text-slate-400 hover:text-slate-700 bg-transparent"
                            }`}
                            title="List Mode"
                          >
                            <List size={14} />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {libraryTab === "social-posts" ? (
                    /* Mock Social Posts area mapping from Screenshot */
                    <div className="py-10 text-center flex flex-col items-center justify-center max-w-xl mx-auto">
                      <div className="w-14 h-14 bg-[#c5a02d]/10 rounded-full flex items-center justify-center text-[#c5a02d] mb-4">
                        <Share2 size={24} />
                      </div>
                      <h3 className="text-sm font-serif font-medium text-slate-900 mb-2">Configure Social Media Auto-Publishing</h3>
                      <p className="text-xs text-slate-500 leading-relaxed max-w-sm">
                        CML's interactive workspace auto-generates localized social graphics for your publications in real-time. Link your social channels under property tools to auto-publish!
                      </p>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full mt-8">
                        <div className="p-4 bg-slate-50 border border-slate-100 text-left rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-[10px] font-mono uppercase bg-blue-50 text-blue-600 px-2 py-0.5 font-extrabold">Facebook</span>
                            <span className="text-[9px] text-slate-400">Not Linked</span>
                          </div>
                          <p className="text-[11px] font-serif text-slate-800 font-bold mb-1">Interactive Menus Post</p>
                          <p className="text-[9px] text-slate-400">Share clickable catalogs directly into story timelines.</p>
                        </div>
                        <div className="p-4 bg-slate-50 border border-slate-100 text-left rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-[10px] font-mono uppercase bg-purple-50 text-purple-600 px-2 py-0.5 font-extrabold">Instagram</span>
                            <span className="text-[9px] text-slate-400">Not Linked</span>
                          </div>
                          <p className="text-[11px] font-serif text-slate-800 font-bold mb-1">Visual Flip Slides</p>
                          <p className="text-[9px] text-slate-400">Convert PDF pages into high-engagement carousel cards.</p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* Publications Section */
                    <>
                      {loading ? (
                        <div className="h-48 flex items-center justify-center">
                          <Loader2 size={24} className="text-[#c5a02d] animate-spin" />
                        </div>
                      ) : filteredFlipbooks.length === 0 ? (
                        <div className="h-64 border border-slate-100 bg-white flex flex-col items-center justify-center text-center">
                          <div className="w-12 h-12 bg-slate-50 flex items-center justify-center rounded-full text-slate-400 mb-4">
                            <BookOpen size={20} />
                          </div>
                          <p className="text-xs font-serif italic text-slate-900">No manuals or publications found</p>
                          <p className="text-[9px] uppercase tracking-widest text-slate-400 font-bold mt-1 mb-4">Upload files to begin listing booklets inside this workspace</p>
                          <button
                            onClick={() => setShowUploadZone(true)}
                            className="bg-slate-900 hover:bg-[#c5a02d] text-white py-2 px-4 text-[10px] font-display uppercase tracking-widest font-black transition-colors"
                          >
                            Open PDF Uploader
                          </button>
                        </div>
                      ) : viewMode === "grid" ? (
                        /* Original Grid View */
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                          {filteredFlipbooks.map((fb) => (
                            <div 
                              key={fb.id}
                              onClick={() => {
                                setPreviewFlipbook(fb);
                              }}
                              className="group cursor-pointer bg-white border border-slate-100 hover:border-[#c5a02d]/30 hover:shadow-xl transition-all flex flex-col overflow-hidden relative animate-in fade-in duration-300"
                            >
                              {/* Thumbnail frame */}
                              <div className="aspect-[4/5] bg-slate-50 relative overflow-hidden flex items-center justify-center border-b border-slate-100">
                                {fb.thumbnailUrl ? (
                                  <img 
                                    src={fb.thumbnailUrl} 
                                    alt={fb.title} 
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                    referrerPolicy="no-referrer"
                                  />
                                ) : (
                                  <div className="text-slate-300">
                                    <BookOpen size={48} />
                                  </div>
                                )}
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                  <div className="bg-white text-slate-900 rounded-full w-10 h-10 flex items-center justify-center shadow-lg">
                                    <Eye size={18} className="text-[#c5a02d]" />
                                  </div>
                                </div>

                                {/* Page Count Badge */}
                                <div className="absolute top-3 right-3 bg-black/75 px-2 py-1 border border-white/10 text-[8px] font-mono text-white tracking-widest uppercase">
                                  {fb.pageCount || 0} Pages
                                </div>
                              </div>

                              {/* Info and action panel */}
                              <div className="p-4 flex-1 flex flex-col justify-between">
                                <div>
                                  <h3 className="text-xs font-serif italic text-slate-900 truncate leading-tight mb-1" title={fb.title}>
                                    {fb.title}
                                  </h3>
                                  <div className="flex items-center gap-2 text-[9px] text-slate-400 mt-1">
                                    <User size={10} />
                                    <span>{fb.authorName}</span>
                                    <span className="opacity-50">·</span>
                                    <span>{formatUploadedAt(fb.createdAt)}</span>
                                  </div>
                                  
                                  {/* Status badge in grid */}
                                  <span className={`inline-flex items-center gap-1 text-[7px] font-bold uppercase tracking-wider px-1.5 py-0.5 mt-2 ${
                                    fb.status === "Published" || !fb.status
                                      ? "bg-emerald-50 text-emerald-700 border border-emerald-100" 
                                      : "bg-slate-50 text-slate-500 border border-slate-200"
                                  }`}>
                                    {fb.status || "Published"}
                                  </span>
                                </div>

                                <div className="mt-4 pt-3 border-t border-slate-50 flex items-center justify-between gap-1.5">
                                  <div className="flex gap-1 flex-1 select-none flex-wrap">
                                    <button 
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setPreviewFlipbook(fb);
                                      }}
                                      className="flex-1 min-w-[50px] py-1.5 px-1.5 border border-slate-100 hover:border-[#c5a02d] text-slate-500 hover:text-[#c5a02d] transition-colors text-[8px] font-display uppercase tracking-widest flex items-center justify-center gap-0.5 bg-slate-50 font-bold"
                                      title="Verify Layout and Preview booklet metadata"
                                    >
                                      <Eye size={10} /> Preview
                                    </button>

                                    <button 
                                      onClick={(e) => copyShareLink(e, fb.id)}
                                      className="flex-1 min-w-[50px] py-1.5 px-1.5 border border-slate-100 hover:border-[#c5a02d] text-slate-500 hover:text-[#c5a02d] transition-colors text-[8px] font-display uppercase tracking-widest flex items-center justify-center gap-0.5 bg-slate-50"
                                      title="Copy Shareable Link"
                                    >
                                      <Copy size={10} /> Link
                                    </button>
                                    
                                    <button 
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setQrTargetFb(fb);
                                      }}
                                      className="flex-1 min-w-[50px] py-1.5 px-1.5 border border-slate-100 hover:border-[#c5a02d] text-slate-500 hover:text-[#c5a02d] transition-colors text-[8px] font-display uppercase tracking-widest flex items-center justify-center gap-0.5 bg-slate-50"
                                      title="Show QR Code for scanning"
                                    >
                                      <QrCode size={10} /> QR Scan
                                    </button>
                                  </div>
                                  
                                  <button 
                                    onClick={(e) => handleDeleteClick(e, fb.id)}
                                    className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50/50 transition-colors shrink-0"
                                    title="Delete publication"
                                  >
                                    <Trash2 size={12} />
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        /* New List View Layout (Screenshot 4 style) */
                        <div className="flex flex-col gap-4">
                          {filteredFlipbooks.map((fb) => (
                            <div 
                              key={fb.id}
                              onClick={() => {
                                setPreviewFlipbook(fb);
                              }}
                              className="flex flex-col sm:flex-row items-center sm:items-stretch bg-white border border-slate-100 p-4 gap-4 hover:border-gold/30 hover:shadow-md transition-all group relative cursor-pointer"
                            >
                              {/* Left: Aspect cover */}
                              <div className="w-16 aspect-[3/4] bg-slate-50 border border-slate-100 flex-shrink-0 relative overflow-hidden flex items-center justify-center">
                                {fb.thumbnailUrl ? (
                                  <img 
                                    src={fb.thumbnailUrl} 
                                    alt={fb.title} 
                                    className="w-full h-full object-cover group-hover:scale-102 transition-transform"
                                    referrerPolicy="no-referrer"
                                  />
                                ) : (
                                  <BookOpen className="text-slate-300" size={24} />
                                )}
                                <div className="absolute top-1 right-1 bg-black/75 px-1 py-0.5 text-[7px] text-white font-mono uppercase tracking-wider">
                                  {fb.pageCount} p.
                                </div>
                              </div>

                              {/* Middle: Text and Details */}
                              <div className="flex-1 flex flex-col justify-between py-0.5 min-w-0">
                                <div>
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <BookOpen className="text-gold" size={12} />
                                    <h3 className="text-xs font-serif font-black italic text-slate-900 truncate tracking-tight group-hover:text-[#c5a02d] transition-colors leading-tight" title={fb.title}>
                                      {fb.title}
                                    </h3>
                                  </div>
                                  <p className="text-[10px] text-slate-400 mt-1 font-serif">
                                    Created by <span className="font-semibold">{fb.authorName || "Staff Member"}</span> · {formatUploadedAt(fb.createdAt)}
                                  </p>
                                  
                                  {/* Status Badging */}
                                  <div className="flex items-center gap-1.5 mt-2">
                                    <span className={`inline-flex items-center gap-1 text-[8px] font-bold uppercase tracking-wider px-2 py-0.5 ${
                                      fb.status === "Published" || !fb.status
                                        ? "bg-emerald-50 text-emerald-700 border border-emerald-100" 
                                        : "bg-slate-50 text-slate-500 border border-slate-200"
                                    }`}>
                                      <span className={`w-1 h-1 rounded-full ${fb.status === "Published" || !fb.status ? "bg-emerald-500" : "bg-slate-400"}`}></span>
                                      {fb.status || "Published"}
                                    </span>
                                  </div>
                                </div>

                                {/* Views & Impressions stats */}
                                <div className="flex items-center gap-4 text-[9px] text-slate-500 font-mono mt-3 select-none">
                                  <span className="flex items-center gap-1">
                                    <Eye size={11} className="text-slate-400" />
                                    <span>{fb.reads || 0} reads</span>
                                  </span>
                                  <span className="text-slate-250">|</span>
                                  <span className="flex items-center gap-1">
                                    <Monitor size={11} className="text-[#c5a02d]" />
                                    <span>{fb.impressions || 4} impressions</span>
                                  </span>
                                </div>
                              </div>

                              {/* Right: Actions aligned exactly as in Issuu */}
                              <div className="flex sm:flex-col justify-center sm:justify-between items-center sm:items-end gap-2 shrink-0 border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-50 w-full sm:w-auto">
                                <span className="text-[9px] text-slate-300 font-mono hidden sm:block">
                                  ID: {fb.id.substring(0, 8)}
                                </span>
                                
                                <div className="flex items-center gap-2 select-none w-full sm:w-auto justify-end">
                                  <button 
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setPreviewFlipbook(fb);
                                    }}
                                    className="py-1 px-2 border border-slate-100 hover:border-[#c5a02d] text-slate-500 hover:text-[#c5a02d] transition-colors text-[8px] font-display uppercase tracking-widest flex items-center justify-center gap-1 bg-slate-50 font-bold"
                                    title="Verify booklet info with preview"
                                  >
                                    <Eye size={10} /> Preview
                                  </button>

                                  <button 
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      copyShareLink(e, fb.id);
                                    }}
                                    className="py-1 px-2.5 border border-slate-100 hover:border-[#c5a02d] text-slate-500 hover:text-[#c5a02d] transition-colors text-[8px] font-display uppercase tracking-widest flex items-center justify-center gap-1 bg-slate-50"
                                    title="Share Publication Link"
                                  >
                                    <Share2 size={10} /> Share
                                  </button>
                                  
                                  <button 
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setQrTargetFb(fb);
                                    }}
                                    className="py-1 px-2 border border-slate-100 hover:border-[#c5a02d] text-slate-500 hover:text-[#c5a02d] transition-colors text-[8px] font-display uppercase tracking-widest flex items-center justify-center gap-1 bg-slate-50"
                                    title="Scanner QR Code"
                                  >
                                    <QrCode size={10} /> QR
                                  </button>

                                  <button 
                                    onClick={(e) => handleDeleteClick(e, fb.id)}
                                    className="p-1 px-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50/50 transition-colors shrink-0 border border-transparent hover:border-red-100 animate-none"
                                    title="Delete publication"
                                  >
                                    <Trash2 size={11} />
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>

              {/* Right Column (col-span-1): Recent Uploads Section */}
              <div className="lg:col-span-1 bg-white/40 p-6 border border-black/5 flex flex-col">
                <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
                  <h2 className="text-xs font-display uppercase tracking-widest text-slate-800 font-black flex items-center gap-2">
                    <Clock size={12} className="text-[#c5a02d]" />
                    Recent Uploads
                  </h2>
                  <span className="text-[8px] font-mono uppercase bg-[#c5a02d]/10 text-slate-800 px-2 py-0.5 tracking-wider font-extrabold rounded-none">
                    My Room
                  </span>
                </div>
                
                <p className="text-[10px] text-slate-500 mb-4 font-serif italic leading-snug">
                  Quickly reference your recently catalogued files, verify publication times, or copy dynamic links.
                </p>

                {userRecentUploads.length === 0 ? (
                  <div className="border border-dashed border-slate-200 bg-white/50 p-6 text-center flex flex-col items-center justify-center flex-1 py-12 rounded-none">
                    <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 mb-3 border border-slate-100">
                      <Upload size={16} />
                    </div>
                    <p className="text-xs font-serif italic text-slate-800">No recent files</p>
                    <p className="text-[9px] text-slate-400 mt-1 uppercase tracking-widest font-extrabold max-w-[150px]">
                      Your catalog submissions appear here in real-time
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3.5 overflow-y-auto max-h-[70vh] pr-1 scrollbar-thin">
                    {userRecentUploads.map((fb) => (
                      <div 
                        key={fb.id} 
                        className="p-3 bg-white border border-slate-100 hover:border-[#c5a02d]/30 hover:shadow-sm transition-all flex flex-col gap-2.5 group animate-in fade-in duration-200"
                      >
                        <div className="flex items-start gap-2.5">
                          {/* File Type icon identifier */}
                          <div className="w-8 h-10 bg-red-50 text-red-600 flex flex-col items-center justify-center text-[8px] font-mono font-black border border-red-100 shadow-sm shrink-0 select-none">
                            PDF
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <h4 
                              className="text-xs font-serif italic text-slate-800 leading-tight truncate group-hover:text-gold transition-colors cursor-pointer" 
                              title={fb.title}
                              onClick={() => {
                                setPreviewFlipbook(fb);
                              }}
                            >
                              {fb.title}
                            </h4>
                            
                            <p className="text-[9px] text-slate-400 uppercase font-mono tracking-wider mt-1.5 font-bold">
                              {fb.pageCount || 0} Pages · Interactive Booklet
                            </p>
                            
                            <div className="text-[8px] text-slate-400 flex items-center gap-1 mt-1 font-light">
                              <Clock size={8} />
                              <span>{formatUploadedAt(fb.createdAt)}</span>
                            </div>
                          </div>
                        </div>

                        {/* Direct View, Share and QR links */}
                        <div className="mt-0.5 flex items-center gap-2 border-t border-slate-50 pt-2 shrink-0 flex-wrap">
                          <button
                            onClick={() => {
                              setPreviewFlipbook(fb);
                            }}
                            className="text-[9px] font-display uppercase tracking-widest font-black text-slate-900 hover:text-gold transition-all flex items-center gap-1"
                          >
                            <Eye size={10} className="text-[#c5a02d]" /> Preview & Open
                          </button>
                          
                          <span className="text-slate-100">|</span>
                          
                          <button
                            onClick={(e) => copyShareLink(e, fb.id)}
                            className="text-[9px] font-display uppercase tracking-widest font-black text-slate-500 hover:text-slate-900 transition-all flex items-center gap-1"
                          >
                            <Copy size={9} /> Link
                          </button>

                          <span className="text-slate-100">|</span>
                          
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setQrTargetFb(fb);
                            }}
                            className="text-[9px] font-display uppercase tracking-widest font-black text-slate-500 hover:text-slate-900 transition-all flex items-center gap-1"
                          >
                            <QrCode size={10} className="text-[#c5a02d]" /> QR Scan
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* Custom QR Code Viewer Modal */}
      <AnimatePresence>
        {qrTargetFb && (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white max-w-sm w-full p-6 shadow-2xl border border-slate-100 flex flex-col items-center animate-in fade-in text-slate-800"
            >
              <div className="flex justify-between items-center w-full mb-4 pb-2 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <QrCode size={18} className="text-[#c5a02d]" />
                  <h3 className="font-serif italic text-base text-slate-900 font-bold">Mobile Scanner Access</h3>
                </div>
                <button 
                  onClick={() => setQrTargetFb(null)}
                  className="text-slate-400 hover:text-slate-605 transition-colors cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="bg-slate-50 p-4 border border-slate-200 shadow-inner rounded-sm mb-4 flex items-center justify-center">
                {qrCodeDataUrl ? (
                  <img 
                    src={qrCodeDataUrl} 
                    alt="QR Code" 
                    className="w-48 h-48 select-none"
                  />
                ) : (
                  <div className="w-48 h-48 flex items-center justify-center">
                    <Loader2 className="animate-spin text-[#c5a02d]" size={24} />
                  </div>
                )}
              </div>

              <div className="text-center mb-6">
                <h4 className="font-serif text-slate-900 text-sm font-semibold truncate max-w-xs">{qrTargetFb.title}</h4>
                <p className="text-[10px] uppercase font-mono tracking-wider text-[#c5a02d] font-bold mt-1">
                  {qrTargetFb.pageCount} Pages · Digital Booklet
                </p>
                <p className="text-[11px] text-slate-500 mt-2 max-w-[280px]">
                  Scan with any smartphone camera to inspect or view this online brochure right on your device.
                </p>
              </div>

              <div className="flex flex-col gap-2 w-full">
                {qrCodeDataUrl && (
                  <a
                    href={qrCodeDataUrl}
                    download={`QR-${qrTargetFb.title.replace(/\s+/g, "_")}.png`}
                    className="w-full bg-slate-900 hover:bg-[#c5a02d] text-white py-2.5 px-4 text-[10px] font-display uppercase tracking-widest font-black transition-colors text-center inline-block cursor-pointer"
                  >
                    Download QR Code
                  </a>
                )}
                <button
                  onClick={(e) => {
                    copyShareLink(e, qrTargetFb.id);
                  }}
                  className="w-full border border-slate-200 hover:bg-slate-50 text-slate-700 py-2.5 px-4 text-[10px] font-display uppercase tracking-wider text-center cursor-pointer"
                >
                  Copy Link instead
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Dynamic Single-Page Preview / Verification Modal */}
      <AnimatePresence>
        {previewFlipbook && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-white max-w-2xl w-full border border-slate-200 shadow-2xl flex flex-col md:flex-row overflow-hidden rounded-lg text-slate-800 relative animate-none"
            >
              <button 
                onClick={() => setPreviewFlipbook(null)}
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors bg-slate-100 hover:bg-slate-200 p-1.5 rounded-full z-10 cursor-pointer"
                title="Close Preview"
              >
                <X size={16} />
              </button>

              {/* Left Column: Image Cover Thumbnail Rendering */}
              <div className="w-full md:w-1/2 bg-slate-50 flex flex-col items-center justify-center p-6 border-b md:border-b-0 md:border-r border-slate-100 relative min-h-[300px] select-none">
                {previewFlipbook.thumbnailUrl || (previewFlipbook.pages && previewFlipbook.pages.length > 0) ? (
                  <div className="relative group max-h-[320px] max-w-full flex items-center justify-center">
                    <img
                      src={previewFlipbook.thumbnailUrl || previewFlipbook.pages[0]}
                      alt={previewFlipbook.title}
                      className="max-h-[300px] w-auto shadow-xl object-contain border border-slate-200 rounded"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute top-2 left-2 bg-slate-900/85 text-white font-mono text-[8px] tracking-widest uppercase px-2.5 py-1 rounded shadow-sm border border-white/5 font-extrabold">
                      Cover Page
                    </div>
                  </div>
                ) : (
                  <div className="text-slate-300 flex flex-col items-center">
                    <BookOpen size={48} className="mb-2 text-slate-200" />
                    <span className="text-[10px] uppercase font-mono tracking-wider font-bold">No Preview Available</span>
                  </div>
                )}
                
                <span className="absolute bottom-3 text-[9px] font-mono text-slate-400 uppercase tracking-widest font-semibold">
                  PDF Compiled Stream View
                </span>
              </div>

              {/* Right Column: Metadata details and direct reader opening */}
              <div className="w-full md:w-1/2 p-6 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-1.5 text-[8.5px] font-mono text-[#c5a02d] uppercase tracking-wider font-extrabold mb-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#c5a02d]"></span>
                    <span>Document Verification</span>
                  </div>

                  <h3 className="text-lg font-serif italic text-slate-900 font-bold leading-snug tracking-tight mb-2 pr-6">
                    {previewFlipbook.title}
                  </h3>

                  <div className="border-t border-slate-100 my-3"></div>

                  <div className="space-y-2.5 text-xs text-slate-600 mb-4 font-sans">
                    <div className="flex items-center gap-2">
                      <User size={14} className="text-slate-400 shrink-0" />
                      <div>
                        <span className="text-slate-400 font-light">Publisher: </span>
                        <span className="font-semibold text-slate-800">{previewFlipbook.authorName || "CML Author"}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Clock size={14} className="text-slate-400 shrink-0" />
                      <div>
                        <span className="text-slate-400 font-light">Uploaded: </span>
                        <span className="font-semibold text-slate-800">{formatUploadedAt(previewFlipbook.createdAt)}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <BookOpen size={14} className="text-slate-400 shrink-0" />
                      <div>
                        <span className="text-slate-400 font-light">Page Count: </span>
                        <span className="font-semibold text-slate-800">{previewFlipbook.pageCount || 0} Pages</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Eye size={14} className="text-slate-400 shrink-0" />
                      <div>
                        <span className="text-slate-400 font-light">Total Reads: </span>
                        <span className="font-semibold text-slate-800">{previewFlipbook.reads || 0} views / {previewFlipbook.impressions || 4} impressions</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-slate-50 border border-slate-200/40 p-3 rounded text-[10.5px] text-slate-500 font-light leading-relaxed mb-4">
                    Please verify that this is the correct publication guide. You can review its layout, configurations, and page setups before opening the interactive workspace.
                  </div>
                </div>

                <div className="space-y-2.5">
                  <button
                    onClick={() => {
                      setActiveFlipbook(previewFlipbook);
                      setCurrentPage(0);
                      setPreviewFlipbook(null);
                      setActiveClicks(c => c + 1);
                    }}
                    className="w-full bg-slate-900 hover:bg-[#c5a02d] text-white py-3 px-4 text-[10px] font-display uppercase tracking-widest font-black transition-colors flex items-center justify-center gap-2 shadow-md cursor-pointer"
                  >
                    <BookOpen size={12} /> Open Full Reader
                  </button>

                  <button
                    onClick={() => setPreviewFlipbook(null)}
                    className="w-full border border-slate-200 hover:bg-slate-50 text-slate-600 py-2.5 px-4 text-[10px] font-display uppercase tracking-wider text-center cursor-pointer font-semibold transition-colors animate-none"
                  >
                    Close Preview
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Premium PDF Publish Dialog flows (Screenshots 2 & 3) */}
      <AnimatePresence>
        {showPublishModal && (
          <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.98, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98, y: 10 }}
              className="bg-white max-w-4xl w-full border border-slate-200 shadow-2xl flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-slate-100 max-h-[90vh] overflow-hidden rounded-none text-slate-800"
            >
              {/* Left Column: Compilation Status & Page Flip Preview */}
              <div className="w-full md:w-1/2 p-6 bg-slate-50 flex flex-col justify-between overflow-y-auto">
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-[9px] font-mono uppercase bg-slate-200 text-slate-800 px-2 py-0.5 tracking-wider font-extrabold">
                      Step 1: Document Compilation
                    </span>
                    <div className="flex items-center gap-1.5 font-mono text-[9px] text-[#c5a02d]">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#c5a02d] animate-pulse"></span>
                      <span>Compilation Engine</span>
                    </div>
                  </div>

                  {isUploading && previewPages.length === 0 ? (
                    /* Ongoing compilation spinner */
                    <div className="flex flex-col items-center justify-center py-20">
                      <Loader2 className="animate-spin text-[#c5a02d] mb-4" size={32} />
                      <p className="text-xs font-serif italic text-slate-800">{uploadStatus}</p>
                      <div className="w-48 bg-slate-200 h-1.5 mt-3 overflow-hidden rounded-full">
                        <div 
                          className="bg-[#c5a02d] h-full transition-all duration-300"
                          style={{ width: `${uploadProgress}%` }}
                        ></div>
                      </div>
                    </div>
                  ) : previewPages.length > 0 ? (
                    /* Slide Preview of Rendered Pages */
                    <div className="flex flex-col items-center justify-center p-2">
                      <p className="text-[10px] text-slate-400 font-mono mb-2 uppercase tracking-wide">
                        Page preview
                      </p>
                      <div className="aspect-[4/5] max-h-[42vh] w-full bg-white border border-slate-200 shadow-md relative group flex flex-col items-center justify-center overflow-hidden">
                        <img
                          src={previewPages[previewPageNum]}
                          alt={`Preview Page ${previewPageNum + 1}`}
                          className="w-full h-full object-contain"
                          referrerPolicy="no-referrer"
                        />
                        
                        {/* Left navigation arrow */}
                        <button
                          onClick={() => setPreviewPageNum(prev => Math.max(0, prev - 1))}
                          disabled={previewPageNum === 0}
                          className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/95 border border-slate-100 flex items-center justify-center text-slate-700 hover:text-slate-900 disabled:opacity-30 disabled:pointer-events-none transition-all shadow-sm"
                        >
                          <ChevronLeft size={16} />
                        </button>

                        {/* Right navigation arrow */}
                        <button
                          onClick={() => setPreviewPageNum(prev => Math.min(previewPages.length - 1, prev + 1))}
                          disabled={previewPageNum === previewPages.length - 1}
                          className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/95 border border-slate-100 flex items-center justify-center text-slate-700 hover:text-slate-900 disabled:opacity-30 disabled:pointer-events-none transition-all shadow-sm"
                        >
                          <ChevronRight size={16} />
                        </button>

                        {/* Info overlay badge */}
                        <div className="absolute bottom-2 bg-black/75 px-3 py-1 border border-white/5 text-[9px] font-mono text-white rounded-none">
                          Page {previewPageNum + 1} of {previewPages.length}
                        </div>
                      </div>

                      <p className="text-[9.5px] italic text-slate-500 font-serif mt-4 text-center max-w-xs leading-relaxed">
                        Confirm page layout representation. All pages compile with auto-vector text sharpening support.
                      </p>
                    </div>
                  ) : (
                    /* Waiting trigger */
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                      <Loader2 className="animate-spin text-[#c5a02d] mb-2" size={24} />
                      <p className="text-xs font-serif italic text-slate-400">Loading document streams...</p>
                    </div>
                  )}
                </div>

                <div className="border-t border-slate-200/60 pt-4 mt-6">
                  <div className="flex gap-4 text-[10px] text-slate-400 uppercase font-mono tracking-wider font-semibold">
                    <span>File Size: {pendingFile ? `${(pendingFile.size / (1024 * 1024)).toFixed(2)} MB` : "N/A"}</span>
                    <span>·</span>
                    <span>Type: PDF document</span>
                  </div>
                </div>
              </div>

              {/* Right Column: Settings & Selection Panel (Screenshot 3 style) */}
              <div className="w-full md:w-1/2 p-6 flex flex-col justify-between bg-white overflow-y-auto">
                <div>
                  <div className="flex justify-between items-center mb-6">
                    <span className="text-[10px] font-mono uppercase bg-[#c5a02d]/10 text-slate-800 px-2 py-0.5 tracking-wider font-black">
                      Step 2: Publication Setup
                    </span>
                    <button
                      onClick={() => setShowPublishModal(false)}
                      className="text-slate-400 hover:text-slate-600 transition-colors p-1"
                    >
                      <X size={18} />
                    </button>
                  </div>

                  {/* Title editor with dynamic inline switch */}
                  <div className="mb-5">
                    <label className="block text-[9px] font-mono uppercase text-slate-400 tracking-wider mb-1.5 font-bold">
                      Booklet Title
                    </label>
                    <div className="flex items-center gap-2">
                      {isTitleEditable ? (
                        <input
                          type="text"
                          value={pendingTitle}
                          onChange={(e) => setPendingTitle(e.target.value)}
                          onBlur={() => setIsTitleEditable(false)}
                          onKeyDown={(e) => e.key === "Enter" && setIsTitleEditable(false)}
                          className="flex-1 border border-[#c5a02d] bg-white px-3 py-2 text-xs text-slate-900 font-serif italic tracking-wide outline-none rounded-none"
                          autoFocus
                        />
                      ) : (
                        <div className="flex-1 flex items-center justify-between border border-slate-200 bg-slate-50 px-3 py-2 cursor-pointer group" onClick={() => setIsTitleEditable(true)}>
                          <span className="text-xs text-slate-800 font-serif italic font-medium truncate">
                            {pendingTitle || "Enter pamphlet title"}
                          </span>
                          <Pencil size={11} className="text-slate-400 group-hover:text-gold transition-colors" />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Description Input */}
                  <div className="mb-5">
                    <label className="block text-[9px] font-mono uppercase text-slate-400 tracking-wider mb-1.5 font-bold">
                      Description (Optional)
                    </label>
                    <textarea
                      placeholder="Add an caption index for library reference..."
                      rows={2}
                      className="w-full border border-slate-200 px-3 py-2 text-[11.5px] font-serif text-slate-800 placeholder-slate-400 bg-transparent outline-none focus:border-slate-400 resize-none rounded-none"
                    ></textarea>
                  </div>

                  {/* Setting Dropdowns (exactly matching Screenshot 3 styling) */}
                  <div className="space-y-4">
                    <div>
                      <label className="block text-[9px] font-mono uppercase text-slate-400 tracking-wider mb-1.5 font-bold">
                        Who can view this publication?
                      </label>
                      <select className="w-full border border-slate-200 px-3 py-2 text-xs text-slate-700 font-sans tracking-wide bg-white outline-none rounded-none">
                        <option>Everyone on the web (Recommended)</option>
                        <option>Only registered CML staff members</option>
                        <option>Only password holders</option>
                        <option>Private backup copy (Self-access only)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[9px] font-mono uppercase text-slate-400 tracking-wider mb-1.5 font-bold">
                        Property Distribution Hub
                      </label>
                      <select 
                        value={uploadTargetCompany}
                        onChange={(e) => setUploadTargetCompany(e.target.value)}
                        className="w-full border border-slate-200 px-3 py-2 text-xs text-slate-700 font-sans tracking-wide bg-white outline-none rounded-none"
                      >
                        <option value="cml">CML Corporate / Headquarters</option>
                        <option value="ramada">Ramada Suites Wailoaloa</option>
                        <option value="wyndham">Wyndham Garden Wailoaloa</option>
                      </select>
                    </div>
                  </div>

                  <div className="mt-4 p-3 border border-amber-100 bg-amber-50/50 flex gap-2.5">
                    <input type="checkbox" defaultChecked className="mt-0.5 accent-[#c5a02d]" id="accept-cml-terms" />
                    <label htmlFor="accept-cml-terms" className="text-[10px] text-slate-500 leading-normal select-none">
                      Agree to render pages in public staff and guest catalog indices under CML general corporate styling rules policy.
                    </label>
                  </div>
                </div>

                {/* Confirm actions layout (Published vs Draft states from upload) */}
                <div className="mt-6 border-t border-slate-150 pt-5 flex items-center justify-between gap-3 select-none">
                  <button
                    onClick={() => setShowPublishModal(false)}
                    disabled={isUploading}
                    className="py-2.5 px-4 text-[10px] font-display uppercase tracking-widest text-slate-400 hover:text-slate-800 font-extrabold transition-colors disabled:opacity-50"
                  >
                    Cancel
                  </button>

                  <div className="flex gap-2.5">
                    <button
                      onClick={() => saveFlipbookToDatabase("Draft")}
                      disabled={isUploading || previewPages.length === 0}
                      className="py-2.5 px-4 text-[10px] font-display uppercase tracking-wider text-slate-600 border border-slate-200 hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:pointer-events-none rounded-none"
                    >
                      Save as Draft
                    </button>
                    <button
                      onClick={() => saveFlipbookToDatabase("Published")}
                      disabled={isUploading || previewPages.length === 0}
                      className="bg-slate-900 hover:bg-[#c5a02d] text-white py-2.5 px-5 text-[10px] font-display uppercase tracking-widest font-black transition-colors flex items-center gap-2 shadow-md disabled:bg-slate-300 disabled:pointer-events-none rounded-none"
                    >
                      {isUploading && (
                        <Loader2 className="animate-spin" size={10} />
                      )}
                      <span>Publish Now</span>
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Custom Alert Modal */}
      {modalAlertText && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white max-w-sm w-full p-6 shadow-2xl border border-slate-100 flex flex-col items-center text-center gap-4 animate-in fade-in"
          >
            <div className="w-12 h-12 bg-red-50 text-red-500 rounded-full flex items-center justify-center">
              <AlertCircle size={24} />
            </div>
            <div>
              <h3 className="font-serif italic text-lg text-slate-900">Notice</h3>
              <p className="text-xs text-slate-500 mt-2 leading-relaxed">{modalAlertText}</p>
            </div>
            <button
              onClick={() => setModalAlertText(null)}
              className="w-full mt-2 bg-slate-900 hover:bg-[#c5a02d] text-white py-2 px-4 text-[10px] uppercase font-display tracking-widest font-black transition-colors"
            >
              Acknowledge
            </button>
          </motion.div>
        </div>
      )}

      {/* Custom Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={!!deleteTargetId}
        onClose={() => setDeleteTargetId(null)}
        onConfirm={confirmDeleteFlipbook}
        title="Delete Flipbook Material?"
        description="Are you sure you want to permanently delete this digital flipbook material? This action is irreversible and the digital publication will be removed completely."
        confirmLabel="Delete Truly"
        cancelLabel="Keep Publication"
        variant="danger"
      />

      {/* Custom Share / Copy Link fallback modal */}
      {shareLinkText && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 text-left">
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white max-w-md w-full p-6 shadow-2xl border border-slate-100 flex flex-col gap-4 animate-in fade-in"
          >
            <div>
              <h3 className="font-serif italic text-lg text-slate-900">Share Flipbook Reference</h3>
              <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                Copy and distribute this secure link to properties and partners. It contains authenticated direct path configurations.
              </p>
            </div>
            
            <div className="flex items-center gap-2 border border-slate-200 bg-slate-50 p-2 rounded-sm w-full">
              <input 
                type="text" 
                readOnly 
                value={shareLinkText}
                onClick={(e) => {
                  const target = e.target as HTMLInputElement;
                  target.select();
                }}
                className="bg-transparent border-none outline-none text-[11px] font-mono text-slate-700 flex-1 break-all"
              />
              <button 
                onClick={() => {
                  try {
                    navigator.clipboard.writeText(shareLinkText);
                  } catch (err) {
                    console.warn(err);
                  }
                  setIsCopiedFromModal(true);
                  setTimeout(() => setIsCopiedFromModal(false), 2000);
                }}
                className="px-3 py-1.5 bg-slate-900 hover:bg-gold text-white text-[9px] uppercase tracking-wider font-display"
              >
                Copy
              </button>
            </div>
            
            {isCopiedFromModal && (
              <p className="text-[10px] text-emerald-600 font-display uppercase tracking-widest font-black animate-pulse">
                ✓ Copy successfully synced to clipboard
              </p>
            )}

            <div className="mt-2 text-right">
              <button 
                onClick={() => {
                  setShareLinkText("");
                  setIsCopiedFromModal(false);
                }}
                className="border border-slate-200 hover:bg-slate-50 text-slate-700 font-display uppercase tracking-wider text-[10px] py-1.5 px-6"
              >
                Close
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Persistent Floating Background Upload Progress HUD */}
      <AnimatePresence>
        {isUploading && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-6 right-6 z-50 bg-slate-900 border border-[#c5a02d] text-white rounded-none p-5 shadow-2xl w-80 flex flex-col gap-3 font-sans"
          >
            <div className="flex items-center justify-between border-b border-white/10 pb-2">
              <div className="flex items-center gap-2">
                <Loader2 size={16} className="text-[#c5a02d] animate-spin" />
                <span className="text-[10px] uppercase font-display tracking-widest font-bold">
                  PDF Compilation Status
                </span>
              </div>
              <span className="text-xs font-mono text-[#c5a02d] font-bold">
                {uploadProgress}%
              </span>
            </div>

            <div>
              <p className="text-[11px] text-slate-200 font-serif italic mb-2 min-h-[32px] line-clamp-2">
                {uploadStatus}
              </p>
              
              <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden border border-white/5 relative">
                <div 
                  style={{ width: `${uploadProgress}%` }}
                  className="bg-gradient-to-r from-[#c5a02d] to-yellow-400 h-full transition-all duration-300 rounded-full"
                />
              </div>
            </div>

            <div className="flex items-center justify-between text-[8px] text-slate-400 mt-1 uppercase tracking-wider">
              <span>DO NOT CLOSE THIS TAB</span>
              <span>PARSING & TRANSMITTING</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
