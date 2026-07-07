import React, { useState, useEffect } from "react";
import { 
  FileText, 
  FileSpreadsheet, 
  FileImage, 
  File, 
  Upload, 
  Download, 
  Trash2, 
  Search, 
  Filter, 
  Sparkles, 
  CheckCircle, 
  AlertCircle, 
  Folder, 
  Calendar, 
  User, 
  RefreshCw,
  Eye,
  X,
  ChevronLeft,
  ChevronRight,
  Printer
} from "lucide-react";
import { 
  db, 
  collection, 
  addDoc, 
  getDocs, 
  deleteDoc, 
  doc, 
  onSnapshot, 
  query, 
  orderBy, 
  serverTimestamp 
} from "../lib/firebase";

// Define the interface matching firebaseblueprint
interface BrandDocument {
  id: string;
  name: string;
  description: string;
  fileType: "pdf" | "docx" | "xlsx" | "png" | "svg" | "jpg" | "doc" | "xls";
  category: "Logos" | "Templates" | "Manuals" | "Spreadsheets";
  fileSize: string;
  uploadedBy: string;
  uploadedById: string;
  createdAt: any;
  fileData: string; // Base64 encoded or raw text
  isDefault?: boolean;
}

// Sample SVG Monogram Logo data
const sampleCMLMonogramSVG = `<svg viewBox="0 0 140 100" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect width="140" height="100" rx="8" fill="#1A1A1A"/>
  <path d="M48 20 C22 20 12 40 12 55 C12 70 20 90 48 90 C62 90 70 83 73 79 L73 67 C67 71 60 76 48 76 C33 76 27 64 27 55 C27 46 33 34 48 34 C59 34 66 39 72 44 L72 32 C68 27 60 20 48 20 Z" fill="#C5A02D" />
  <path d="M50 28 L63 72 L76 28 H88 L96 82 H83 L79 46 L67 88 H59 L47 46 L43 82 H30 L38 28 H50 Z" fill="#FFFFFF" />
  <path d="M83 20 H96 V78 H120 V90 H83 V20 Z" fill="#C5A02D" />
  <text x="70" y="94" fill="#C5A02D" font-family="sans-serif" font-size="5" text-anchor="middle" letter-spacing="1">COVE MANAGEMENT LIMITED</text>
</svg>`;

// Default standard files to seed if database is empty
const defaultFiles: Omit<BrandDocument, "id">[] = [
  {
    name: "CML_Corporate_Monogram_Logo.svg",
    description: "Official Cove Management Limited high-resolution vector emblem logo.",
    fileType: "svg",
    category: "Logos",
    fileSize: "1.2 KB",
    uploadedBy: "System Standard",
    uploadedById: "system",
    createdAt: null,
    fileData: `data:image/svg+xml;utf8,${encodeURIComponent(sampleCMLMonogramSVG)}`,
    isDefault: true
  },
  {
    name: "CML_Brand_Identity_Guidelines.pdf",
    description: "Complete 2026 style guide including brand colors, typography rules, and logo spacing requirements.",
    fileType: "pdf",
    category: "Manuals",
    fileSize: "342 KB",
    uploadedBy: "System Standard",
    uploadedById: "system",
    createdAt: null,
    fileData: "data:application/pdf;base64,JVBERi0xLjQKJVRlbXBsYXRlIGZvciBDTUwgQnJhbmQgSWRlbnRpdHkgR3VpZGVsaW5lcyAtIFVwbG9hZGVkIGFuZCBNYW5hZ2VkIHNlY3VyZWx5IGluIENvdmdlIE1hbmFnZW1lbnQgQ2xvdWQgVmF1bHQu",
    isDefault: true
  },
  {
    name: "CML_Stationery_Letterhead_Template.docx",
    description: "Official letterhead document template for general corporate notifications and guest greetings.",
    fileType: "docx",
    category: "Templates",
    fileSize: "128 KB",
    uploadedBy: "System Standard",
    uploadedById: "system",
    createdAt: null,
    fileData: "data:application/vnd.openxmlformats-officedocument.wordprocessingml.document;base64,UEsDBBQAAAAIAAAAAADoCML_Letterhead_Template_Placeholder",
    isDefault: true
  },
  {
    name: "Wyndham_PM_Preventive_Maintenance_Checklist.xlsx",
    description: "Asset maintenance spreadsheet with comprehensive checklists for guestrooms and public facilities.",
    fileType: "xlsx",
    category: "Spreadsheets",
    fileSize: "75 KB",
    uploadedBy: "System Standard",
    uploadedById: "system",
    createdAt: null,
    fileData: "data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64,UEsDBBQAAAAIAAAAAADoCML_Maintenance_Checklist_Placeholder",
    isDefault: true
  }
];

export const BrandStandardsDocManager: React.FC = () => {
  const [documents, setDocuments] = useState<BrandDocument[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [selectedFormat, setSelectedFormat] = useState<string>("All");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<"success" | "error" | "info">("success");
  const [dragOver, setDragOver] = useState(false);

  // New Upload Form state
  const [customDescription, setCustomDescription] = useState("");
  const [customCategory, setCustomCategory] = useState<"Logos" | "Templates" | "Manuals" | "Spreadsheets">("Templates");

  // Interactive Brand File Previewer States
  const [selectedDocForPreview, setSelectedDocForPreview] = useState<BrandDocument | null>(null);
  const [previewBackground, setPreviewBackground] = useState<"light" | "dark" | "gold">("light");
  const [previewZoom, setPreviewZoom] = useState<number>(100);
  const [previewLetterBody, setPreviewLetterBody] = useState<string>(
    "Dear team,\n\nI am pleased to share our finalized brand guidelines and letterhead layouts for Cove Management Limited. Please ensure all official guest communications, resort templates, and daily newsletters strictly conform to these approved typography, margin, and color systems.\n\nWarm regards,\n\nCharles\nGroup Digital Marketing Director"
  );
  const [previewSlideIndex, setPreviewSlideIndex] = useState<number>(0);
  
  // Interactive checklist spreadsheets states
  const [checklistStatuses, setChecklistStatuses] = useState<Record<string, "Compliant" | "Non-Compliant" | "N/A">>({
    "1": "Compliant",
    "2": "Compliant",
    "3": "Compliant",
    "4": "Compliant",
    "5": "Compliant",
    "6": "Compliant",
  });
  const [checklistComments, setChecklistComments] = useState<Record<string, string>>({
    "1": "All chandeliers checked on shift-start. No dimmed bulbs.",
    "2": "Plentiful replenishment of lemongrass signature towels.",
    "3": "Brass plating polished.",
    "4": "Completed.",
    "5": "Responsive average clocking 1.2s.",
    "6": "Emergency indicators tested perfectly."
  });

  const showToast = (msg: string, type: "success" | "error" | "info" = "success") => {
    setToastMessage(msg);
    setToastType(type);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Real-time Firestore sync and dynamic default file seeding
  useEffect(() => {
    const q = query(collection(db, "brand-documents"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docsList: BrandDocument[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        docsList.push({
          id: docSnap.id,
          ...data
        } as BrandDocument);
      });

      // If the database is completely empty, let's automatically seed the default templates!
      if (docsList.length === 0) {
        seedDefaultTemplates();
      } else {
        // Sort: User uploads first, defaults last, ordered by date
        const sorted = [...docsList].sort((a, b) => {
          if (a.isDefault && !b.isDefault) return 1;
          if (!a.isDefault && b.isDefault) return -1;
          const timeA = a.createdAt?.seconds || 0;
          const timeB = b.createdAt?.seconds || 0;
          return timeB - timeA;
        });
        setDocuments(sorted);
      }
    }, (error) => {
      console.error("Firestore loading error: ", error);
      showToast("Failed to sync documents with Cloud Vault.", "error");
    });

    return () => unsubscribe();
  }, []);

  const seedDefaultTemplates = async () => {
    try {
      for (const file of defaultFiles) {
        await addDoc(collection(db, "brand-documents"), {
          ...file,
          createdAt: serverTimestamp()
        });
      }
      showToast("Brand standards repository initialized with system templates.", "info");
    } catch (e) {
      console.error("Seeding error:", e);
    }
  };

  // Handle uploading files (converted to base64 for persistent Firestore storage)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement> | React.DragEvent<HTMLDivElement>, fileList?: FileList) => {
    const files = fileList || (e.target as HTMLInputElement).files;
    if (!files || files.length === 0) return;

    const file = files[0];
    const fileExtension = file.name.split(".").pop()?.toLowerCase() as any;
    const allowedExtensions = ["pdf", "docx", "xlsx", "png", "svg", "jpg", "doc", "xls"];

    if (!allowedExtensions.includes(fileExtension)) {
      showToast(`Unsupported file format. Supported: ${allowedExtensions.join(", ").toUpperCase()}`, "error");
      return;
    }

    // Limit size to 1MB due to Firestore document limits
    if (file.size > 1024 * 1024) {
      showToast("File size exceeds 1MB limit for Cloud synchronization.", "error");
      return;
    }

    setIsUploading(true);
    setUploadProgress("Reading file contents...");

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const fileDataString = event.target?.result as string;
        const formattedSize = file.size > 1024 * 1024 
          ? `${(file.size / (1024 * 1024)).toFixed(1)} MB` 
          : `${(file.size / 1024).toFixed(0)} KB`;

        const newDoc: Omit<BrandDocument, "id"> = {
          name: file.name,
          description: customDescription || `Uploaded brand asset template for general property management.`,
          fileType: fileExtension,
          category: customCategory,
          fileSize: formattedSize,
          uploadedBy: "Charles", // User rule: "The user's name is Charles. Never call him Alexandra."
          uploadedById: "charles_admin",
          createdAt: serverTimestamp(),
          fileData: fileDataString,
          isDefault: false
        };

        setUploadProgress("Saving to Cove Cloud database...");
        await addDoc(collection(db, "brand-documents"), newDoc);
        
        // Reset inputs
        setCustomDescription("");
        showToast(`Successfully uploaded "${file.name}" to Brand Standards vault!`, "success");
      } catch (err) {
        console.error("Upload error:", err);
        showToast("Error saving document to Cloud Storage.", "error");
      } finally {
        setIsUploading(false);
        setUploadProgress(null);
      }
    };

    reader.onerror = () => {
      showToast("Failed to read file.", "error");
      setIsUploading(false);
      setUploadProgress(null);
    };

    reader.readAsDataURL(file);
  };

  // Drag and Drop handlers
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files) {
      handleFileUpload(e, e.dataTransfer.files);
    }
  };

  // Standard File Downloader
  const handleDownload = (docItem: BrandDocument) => {
    try {
      const link = document.createElement("a");
      link.href = docItem.fileData;
      link.download = docItem.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showToast(`Downloading "${docItem.name}"...`, "success");
    } catch (e) {
      console.error(e);
      showToast("Download failed. File may be corrupted or unreadable.", "error");
    }
  };

  // Delete document
  const handleDelete = async (docId: string, docName: string) => {
    if (!window.confirm(`Are you sure you want to permanently delete "${docName}" from the Brand Standard vault?`)) {
      return;
    }
    try {
      await deleteDoc(doc(db, "brand-documents", docId));
      showToast(`Removed "${docName}" from the repository.`, "info");
    } catch (err) {
      console.error("Delete error:", err);
      showToast("Failed to delete document from database.", "error");
    }
  };

  // Filter logic
  const filteredDocs = documents.filter(d => {
    const matchesSearch = d.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          d.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          d.uploadedBy.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = selectedCategory === "All" || d.category === selectedCategory;
    
    const matchesFormat = selectedFormat === "All" || 
                          (selectedFormat === "PDF" && d.fileType === "pdf") ||
                          (selectedFormat === "Word" && ["docx", "doc"].includes(d.fileType)) ||
                          (selectedFormat === "Spreadsheet" && ["xlsx", "xls"].includes(d.fileType)) ||
                          (selectedFormat === "Logos & Images" && ["png", "svg", "jpg"].includes(d.fileType));

    return matchesSearch && matchesCategory && matchesFormat;
  });

  // Get format icon helper
  const getFileIcon = (fileType: string) => {
    switch (fileType) {
      case "pdf":
        return <FileText className="text-rose-500 w-10 h-10" />;
      case "docx":
      case "doc":
        return <FileText className="text-blue-500 w-10 h-10" />;
      case "xlsx":
      case "xls":
        return <FileSpreadsheet className="text-emerald-500 w-10 h-10" />;
      case "png":
      case "jpg":
      case "svg":
        return <FileImage className="text-amber-500 w-10 h-10" />;
      default:
        return <File className="text-slate-400 w-10 h-10" />;
    }
  };

  return (
    <div className="space-y-8 font-sans">
      
      {/* Toast notifications */}
      {toastMessage && (
        <div className={`fixed top-6 right-6 z-50 px-5 py-3 shadow-2xl flex items-center gap-3 border font-display text-[10px] tracking-widest uppercase font-extrabold ${
          toastType === "success" ? "bg-stone-950 border-emerald-500/40 text-emerald-400" :
          toastType === "error" ? "bg-stone-950 border-rose-500/40 text-rose-400" :
          "bg-stone-950 border-amber-500/40 text-amber-400"
        }`}>
          <span className={`w-2 h-2 rounded-full ${
            toastType === "success" ? "bg-emerald-400 animate-pulse" :
            toastType === "error" ? "bg-rose-400" : "bg-amber-400"
          }`}></span>
          {toastMessage}
        </div>
      )}

      {/* Hero Header Panel */}
      <div className="bg-white border border-slate-100 p-8 rounded-sm shadow-sm flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-[#C5A02D]">
            <Sparkles size={16} />
            <span className="text-[10px] font-display uppercase tracking-[0.25em] font-black">Official Asset Vault</span>
          </div>
          <h3 className="text-3xl font-serif italic text-slate-900">Brand Standards & Templates</h3>
          <p className="text-xs text-slate-500 max-w-3xl leading-relaxed">
            Welcome, <strong className="text-slate-800">Charles</strong>. This repository is designated for uploading and downloading official CML corporate identity files. Access official vector logos, document templates, presentation style guides, and operational spreadsheets securely.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-400 shrink-0 font-mono bg-slate-50 border border-slate-100 px-4 py-2 rounded-sm">
          <Folder size={14} className="text-[#C5A02D]" />
          <span>VAULT STATUS: SECURE CLOUD SYNC</span>
        </div>
      </div>

      {/* Main Workspace split into upload composer & document grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Upload Composer Column (4 Columns) */}
        <div className="lg:col-span-4 bg-white border border-slate-100 p-6 rounded-sm space-y-6 shadow-sm">
          <div>
            <h4 className="text-[11px] font-display uppercase tracking-widest font-black text-slate-900 mb-1">Corporate File Uploader</h4>
            <p className="text-[10px] text-slate-400 italic">Upload official logos, PDFs, word docs, or checklists to sync across resort managers.</p>
          </div>

          <div className="space-y-4">
            {/* Category Select */}
            <div className="space-y-1.5">
              <label className="text-[9px] font-display uppercase tracking-widest font-bold text-slate-500 block">Asset Category</label>
              <select 
                value={customCategory}
                onChange={(e) => setCustomCategory(e.target.value as any)}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded bg-slate-50 text-slate-800 focus:outline-none focus:ring-1 focus:ring-gold"
              >
                <option value="Templates">Templates (Word, Letters, Layouts)</option>
                <option value="Logos">Logos & Vectors</option>
                <option value="Manuals">Manuals & SOP Guidelines</option>
                <option value="Spreadsheets">Spreadsheets (Excel Schedules)</option>
              </select>
            </div>

            {/* Custom Description */}
            <div className="space-y-1.5">
              <label className="text-[9px] font-display uppercase tracking-widest font-bold text-slate-500 block">Short Description</label>
              <textarea 
                rows={3}
                value={customDescription}
                onChange={(e) => setCustomDescription(e.target.value)}
                placeholder="Describe this brand file template..."
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded bg-slate-50 text-slate-800 focus:outline-none focus:ring-1 focus:ring-gold"
              />
            </div>

            {/* Drag and Drop Zone */}
            <div 
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-sm p-8 text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-3 relative ${
                dragOver ? "border-[#C5A02D] bg-amber-50/20" : "border-slate-200 hover:border-[#C5A02D]/60 bg-slate-50"
              }`}
            >
              <input 
                type="file" 
                id="brand-file-input"
                onChange={handleFileUpload}
                accept=".pdf,.docx,.xlsx,.png,.svg,.jpg,.doc,.xls"
                className="absolute inset-0 opacity-0 cursor-pointer"
                disabled={isUploading}
              />
              
              {isUploading ? (
                <div className="space-y-2">
                  <RefreshCw size={24} className="text-[#C5A02D] animate-spin mx-auto" />
                  <p className="text-[11px] font-display uppercase tracking-widest font-black text-slate-700">{uploadProgress}</p>
                </div>
              ) : (
                <>
                  <Upload size={24} className="text-slate-400 group-hover:text-gold" />
                  <div>
                    <p className="text-[10.5px] font-display uppercase tracking-widest font-black text-slate-800">Drag & Drop File</p>
                    <p className="text-[9px] text-slate-400 mt-1">or click to browse local files</p>
                  </div>
                  <div className="text-[8.5px] font-mono text-slate-400 border border-slate-100 bg-white px-2 py-0.5 rounded">
                    Max: 1MB (PDF, Word, Excel, Logos)
                  </div>
                </>
              )}
            </div>

            {/* Constraints block */}
            <div className="p-4 bg-slate-50 border border-slate-100 rounded text-[11px] space-y-2 text-slate-500 leading-relaxed">
              <span className="font-bold text-slate-800 uppercase font-display text-[9px] block flex items-center gap-1.5 text-[#C5A02D]">
                <AlertCircle size={10} /> Secure File Rules
              </span>
              <p>Uploaded templates are stored persistently in Cove Cloud. Files must be authentic property assets compliant with Nadi hospitality standard specifications.</p>
            </div>
          </div>
        </div>

        {/* Right Document Vault (8 Columns) */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Filters Bar */}
          <div className="bg-white border border-slate-100 p-4 rounded-sm shadow-sm flex flex-col md:flex-row items-center gap-4 justify-between">
            {/* Search Input */}
            <div className="relative w-full md:w-64">
              <Search size={14} className="absolute left-3 top-3 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search templates & files..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-xs border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-gold bg-slate-50 text-slate-800"
              />
            </div>

            {/* Filter Group selectors */}
            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-end">
              {/* Category Filter */}
              <div className="flex items-center gap-1.5">
                <Filter size={11} className="text-[#C5A02D]" />
                <span className="text-[9px] font-display uppercase tracking-widest font-bold text-slate-400">Category:</span>
                <select 
                  value={selectedCategory} 
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="px-2.5 py-1.5 text-[10.5px] bg-slate-50 border border-slate-200 rounded focus:outline-none text-slate-700"
                >
                  <option value="All">All Categories</option>
                  <option value="Templates">Templates</option>
                  <option value="Logos">Logos & Vectors</option>
                  <option value="Manuals">Manuals</option>
                  <option value="Spreadsheets">Spreadsheets</option>
                </select>
              </div>

              {/* Format Filter */}
              <div className="flex items-center gap-1.5">
                <span className="text-[9px] font-display uppercase tracking-widest font-bold text-slate-400">Format:</span>
                <select 
                  value={selectedFormat} 
                  onChange={(e) => setSelectedFormat(e.target.value)}
                  className="px-2.5 py-1.5 text-[10.5px] bg-slate-50 border border-slate-200 rounded focus:outline-none text-slate-700"
                >
                  <option value="All">All Formats</option>
                  <option value="PDF">PDF Documents</option>
                  <option value="Word">Google/MS Word (.docx)</option>
                  <option value="Spreadsheet">Excel/Sheets (.xlsx)</option>
                  <option value="Logos & Images">Logos & Images</option>
                </select>
              </div>
            </div>
          </div>

          {/* Documents Grid */}
          {filteredDocs.length === 0 ? (
            <div className="bg-white border border-slate-100 rounded-sm p-16 text-center shadow-sm flex flex-col items-center justify-center gap-4">
              <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center text-slate-300">
                <File size={28} />
              </div>
              <div>
                <p className="text-sm font-display uppercase tracking-widest font-black text-slate-800">No brand files match search</p>
                <p className="text-xs text-slate-400 mt-1 italic">Try adjusting your filters or upload a new template to start.</p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredDocs.map((docItem) => (
                <div 
                  key={docItem.id}
                  className="bg-white border border-slate-100 hover:border-[#C5A02D]/30 transition-all duration-300 p-6 rounded-sm shadow-sm flex flex-col justify-between hover:shadow-md relative group"
                >
                  {/* Default Tag */}
                  {docItem.isDefault && (
                    <span className="absolute top-4 right-4 text-[7px] font-mono bg-amber-50 text-[#C5A02D] px-2 py-0.5 rounded font-extrabold tracking-widest uppercase border border-amber-200/50">
                      SYSTEM STANDARD
                    </span>
                  )}

                  {/* Top card block */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 bg-slate-50 flex items-center justify-center rounded-sm shrink-0 border border-slate-100">
                        {getFileIcon(docItem.fileType)}
                      </div>
                      <div className="space-y-1">
                        <span className="text-[9px] font-display uppercase tracking-widest font-bold text-slate-400 block">{docItem.category}</span>
                        <h4 className="text-xs font-bold text-slate-800 line-clamp-1 group-hover:text-[#C5A02D] transition-colors pr-20" title={docItem.name}>
                          {docItem.name}
                        </h4>
                      </div>
                    </div>

                    <p className="text-[11.5px] text-slate-500 italic leading-relaxed min-h-[44px] line-clamp-2">
                      {docItem.description}
                    </p>
                  </div>

                  {/* Metadata and Actions footer */}
                  <div className="border-t border-slate-50 mt-5 pt-4 flex items-center justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                        <User size={10} className="text-[#C5A02D]" />
                        <span>Uploaded by: <strong className="text-slate-600">{docItem.uploadedBy}</strong></span>
                      </div>
                      <div className="flex items-center gap-1.5 text-[9px] text-slate-400 font-mono">
                        <Calendar size={10} />
                        <span>Size: {docItem.fileSize}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Delete button (only if not default template) */}
                      {!docItem.isDefault && (
                        <button 
                          onClick={() => handleDelete(docItem.id, docItem.name)}
                          className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-colors rounded"
                          title="Remove file from Cloud Vault"
                        >
                          <Trash2 size={13} />
                        </button>
                      )}

                       {/* View button with custom effect */}
                      <button 
                        onClick={() => {
                          setSelectedDocForPreview(docItem);
                          setPreviewSlideIndex(0);
                        }}
                        className="flex items-center gap-1.5 px-3 py-2 bg-[#1A1A1A] hover:bg-[#C5A02D] hover:text-white text-white transition-all text-[10px] font-display uppercase tracking-widest font-black rounded-sm shadow-sm shrink-0 cursor-pointer"
                        title="Interact & preview brand standard"
                      >
                        <Eye size={11} /> View
                      </button>

                      {/* Download button */}
                      <button 
                        onClick={() => handleDownload(docItem)}
                        className="flex items-center gap-1.5 px-3 py-2 bg-slate-50 hover:bg-[#C5A02D] hover:text-white transition-all text-[10px] font-display uppercase tracking-widest font-black text-slate-600 border border-slate-200 hover:border-transparent rounded-sm shrink-0 cursor-pointer"
                        title="Download file to local machine"
                      >
                        <Download size={11} /> Download
                      </button>
                    </div>
                  </div>

                </div>
              ))}
            </div>
          )}

          {/* Quick format guide footer info */}
          <div className="p-4 bg-stone-900 text-white rounded-sm flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-stone-800 flex items-center justify-center text-gold">
                <Sparkles size={16} />
              </div>
              <div className="text-left">
                <span className="text-[10px] font-display uppercase tracking-wider text-[#C5A02D] font-bold block">Need vector logos or presentation decks?</span>
                <span className="text-[10.5px] text-stone-400 italic">Upload custom corporate assets with uploader configured as Charles.</span>
              </div>
            </div>
            
            <div className="flex gap-2">
              <span className="text-[9px] font-mono bg-stone-800 text-stone-300 px-2 py-1 rounded">PDF</span>
              <span className="text-[9px] font-mono bg-stone-800 text-stone-300 px-2 py-1 rounded">DOCX</span>
              <span className="text-[9px] font-mono bg-stone-800 text-stone-300 px-2 py-1 rounded">XLSX</span>
              <span className="text-[9px] font-mono bg-stone-800 text-stone-300 px-2 py-1 rounded">SVG/PNG</span>
            </div>
          </div>

          {/* Real-time Interactive Brand File Previewer Overlay */}
          {selectedDocForPreview && (
            <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
              <div className="bg-white dark:bg-stone-900 rounded-lg w-full max-w-5xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
                {/* Header of Modal */}
                <div className="px-6 py-4 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between bg-stone-50 dark:bg-stone-950">
                  <div className="flex items-center gap-2.5">
                    <span className="p-2 bg-amber-500/10 text-amber-500 rounded font-bold text-xs uppercase tracking-wider font-mono">
                      {selectedDocForPreview.fileType}
                    </span>
                    <div className="text-left">
                      <h3 className="text-sm font-display font-bold tracking-tight text-stone-950 dark:text-white uppercase">
                        {selectedDocForPreview.name}
                      </h3>
                      <p className="text-[10px] text-stone-400 font-sans tracking-wide">
                        Interactive Brand Canvas • Group Digital standard for Charles
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={() => {
                        window.print();
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 dark:bg-stone-800 dark:hover:bg-stone-700 dark:text-stone-300 rounded text-[10px] font-display font-semibold uppercase tracking-wider cursor-pointer"
                    >
                      <Printer size={12} /> Print
                    </button>
                    <button 
                      onClick={() => setSelectedDocForPreview(null)}
                      className="p-1.5 bg-stone-100 hover:bg-rose-500 hover:text-white text-stone-700 dark:bg-stone-800 dark:text-stone-300 dark:hover:bg-rose-500 dark:hover:text-white rounded transition-colors cursor-pointer"
                    >
                      <X size={16} />
                    </button>
                  </div>
                </div>

                {/* Body / Active Preview Area */}
                <div className="flex-1 overflow-y-auto p-6 bg-stone-100/50 dark:bg-stone-950/60 flex flex-col md:flex-row gap-6 min-h-[50vh]">
                  
                  {/* Left Side: Interactive Work-area */}
                  <div className="flex-1 flex flex-col bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded shadow-inner overflow-hidden min-h-[400px]">
                    
                    {/* Brand guidelines slide/flipbook */}
                    {selectedDocForPreview.category === "Manuals" || selectedDocForPreview.fileType === "pdf" ? (
                      <div className="flex-1 flex flex-col justify-between p-6">
                        {previewSlideIndex === 0 && (
                          <div className="flex-1 flex flex-col justify-center items-center text-center p-8 bg-stone-950 text-white rounded relative overflow-hidden">
                            {/* Accent graphics */}
                            <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 rounded-full filter blur-3xl" />
                            <div className="absolute -bottom-10 -left-10 w-48 h-48 bg-yellow-500/5 rounded-full filter blur-2xl" />
                            
                            <div className="border border-amber-500/30 p-8 rounded flex flex-col items-center max-w-md bg-stone-900/60 backdrop-blur-sm z-10">
                              <span className="text-[10px] font-mono tracking-[0.3em] text-[#C5A02D] uppercase mb-4">Cove Management Limited</span>
                              <h2 className="text-xl md:text-2xl font-display font-light uppercase tracking-widest text-white leading-normal">
                                Brand Identity <br/>Guidelines
                              </h2>
                              <div className="h-0.5 w-16 bg-[#C5A02D] my-6" />
                              <p className="text-[11px] text-stone-400 font-sans tracking-wide uppercase">
                                Version 4.1 • Enforcement Standard 2026
                              </p>
                              <p className="text-[9px] text-[#C5A02D]/70 font-mono mt-3 uppercase tracking-widest">
                                FOR RAMADA SUITES & AFFILIATES
                              </p>
                            </div>
                          </div>
                        )}

                        {previewSlideIndex === 1 && (
                          <div className="flex-1 flex flex-col justify-center p-6 bg-stone-50 dark:bg-stone-950 rounded">
                            <h4 className="text-xs font-display font-black uppercase tracking-wider text-stone-900 dark:text-white mb-6 flex items-center gap-2">
                              <span className="w-1.5 h-3 bg-[#C5A02D]"></span>
                              Primary Color Palette & Strict Formulas
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              <div className="p-4 rounded border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 flex flex-col items-center">
                                <div className="w-16 h-16 rounded bg-[#C5A02D] mb-3 shadow-md" />
                                <span className="text-[10px] font-display font-bold uppercase tracking-wider text-stone-900 dark:text-stone-100">Ramada Gold</span>
                                <span className="text-[9px] font-mono text-stone-400 mt-1">#C5A02D</span>
                                <button 
                                  onClick={() => {
                                    navigator.clipboard.writeText("#C5A02D");
                                    showToast("Copied Ramada Gold #C5A02D to clipboard", "success");
                                  }}
                                  className="mt-3 px-2 py-1 bg-stone-100 hover:bg-stone-200 text-stone-600 rounded text-[8px] font-mono uppercase tracking-widest cursor-pointer"
                                >
                                  Copy Hex
                                </button>
                              </div>

                              <div className="p-4 rounded border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 flex flex-col items-center">
                                <div className="w-16 h-16 rounded bg-[#1A1A1A] mb-3 shadow-md border border-stone-800" />
                                <span className="text-[10px] font-display font-bold uppercase tracking-wider text-stone-900 dark:text-stone-100">Luxury Charcoal</span>
                                <span className="text-[9px] font-mono text-stone-400 mt-1">#1A1A1A</span>
                                <button 
                                  onClick={() => {
                                    navigator.clipboard.writeText("#1A1A1A");
                                    showToast("Copied Luxury Charcoal #1A1A1A to clipboard", "success");
                                  }}
                                  className="mt-3 px-2 py-1 bg-stone-100 hover:bg-stone-200 text-stone-600 rounded text-[8px] font-mono uppercase tracking-widest cursor-pointer"
                                >
                                  Copy Hex
                                </button>
                              </div>

                              <div className="p-4 rounded border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 flex flex-col items-center">
                                <div className="w-16 h-16 rounded bg-[#FDFBF7] mb-3 shadow-md border border-stone-200" />
                                <span className="text-[10px] font-display font-bold uppercase tracking-wider text-stone-900 dark:text-stone-100">Warm Alabaster</span>
                                <span className="text-[9px] font-mono text-stone-400 mt-1">#FDFBF7</span>
                                <button 
                                  onClick={() => {
                                    navigator.clipboard.writeText("#FDFBF7");
                                    showToast("Copied Warm Alabaster #FDFBF7 to clipboard", "success");
                                  }}
                                  className="mt-3 px-2 py-1 bg-stone-100 hover:bg-stone-200 text-stone-600 rounded text-[8px] font-mono uppercase tracking-widest cursor-pointer"
                                >
                                  Copy Hex
                                </button>
                              </div>
                            </div>
                            <p className="text-[9.5px] text-stone-400 italic mt-6 leading-relaxed">
                              Use gold for accents, key borders, and headers only. Backgrounds must remain charcoal or soft off-white/alabaster. Avoid bright yellows or green pairings.
                            </p>
                          </div>
                        )}

                        {previewSlideIndex === 2 && (
                          <div className="flex-1 flex flex-col justify-center p-6 bg-stone-50 dark:bg-stone-950 rounded">
                            <h4 className="text-xs font-display font-black uppercase tracking-wider text-stone-900 dark:text-white mb-4 flex items-center gap-2">
                              <span className="w-1.5 h-3 bg-[#C5A02D]"></span>
                              Typography Hierarchy system
                            </h4>
                            <div className="space-y-4 text-left">
                              <div className="p-3 bg-white dark:bg-stone-900 rounded border border-stone-200 dark:border-stone-800">
                                <span className="text-[8px] font-mono text-[#C5A02D] uppercase block tracking-widest mb-1">Display / Primary Headings</span>
                                <span className="text-lg font-display text-stone-900 dark:text-stone-100 uppercase tracking-widest font-black">Space Grotesk</span>
                                <p className="text-[9px] text-stone-400">Used for hotel titles, hero sections, side navigation labels, and major headers.</p>
                              </div>

                              <div className="p-3 bg-white dark:bg-stone-900 rounded border border-stone-200 dark:border-stone-800">
                                <span className="text-[8px] font-mono text-[#C5A02D] uppercase block tracking-widest mb-1">Body Text / Controls</span>
                                <span className="text-sm font-sans text-stone-900 dark:text-stone-100 font-medium">Inter (Regular/Medium)</span>
                                <p className="text-[9px] text-stone-400">Used for employee names, guest descriptions, notification lists, and text content.</p>
                              </div>

                              <div className="p-3 bg-white dark:bg-stone-900 rounded border border-stone-200 dark:border-stone-800">
                                <span className="text-[8px] font-mono text-[#C5A02D] uppercase block tracking-widest mb-1">Technical Data / Metadata</span>
                                <span className="text-xs font-mono text-stone-900 dark:text-stone-100 font-semibold">JetBrains Mono</span>
                                <p className="text-[9px] text-stone-400">Used for diagnostics, timestamps, clocking metrics, and database record stats.</p>
                              </div>
                            </div>
                          </div>
                        )}

                        {previewSlideIndex === 3 && (
                          <div className="flex-1 flex flex-col justify-center p-6 bg-stone-50 dark:bg-stone-950 rounded">
                            <h4 className="text-xs font-display font-black uppercase tracking-wider text-stone-900 dark:text-white mb-4 flex items-center gap-2">
                              <span className="w-1.5 h-3 bg-[#C5A02D]"></span>
                              Strict Logo Usage Rules
                            </h4>
                            <ul className="space-y-2 text-left">
                              <li className="flex items-start gap-2 text-[10.5px] text-stone-600 dark:text-stone-300">
                                <span className="text-green-500 font-bold mt-0.5">✔</span>
                                <span>Always maintain a minimum safe padding equal to 20% of logo width on all sides.</span>
                              </li>
                              <li className="flex items-start gap-2 text-[10.5px] text-stone-600 dark:text-stone-300">
                                <span className="text-green-500 font-bold mt-0.5">✔</span>
                                <span>Ensure high-contrast backgrounds (either dark grey #1A1A1A or white/alabaster).</span>
                              </li>
                              <li className="flex items-start gap-2 text-[10.5px] text-stone-600 dark:text-stone-300">
                                <span className="text-red-500 font-bold mt-0.5">✘</span>
                                <span>Do not compress, stretch, skew, or rotate the official corporate emblem.</span>
                              </li>
                              <li className="flex items-start gap-2 text-[10.5px] text-stone-600 dark:text-stone-300">
                                <span className="text-red-500 font-bold mt-0.5">✘</span>
                                <span>Do not change color of emblem elements (e.g., painting CML gold monogram in red).</span>
                              </li>
                            </ul>
                            <div className="mt-4 p-3 bg-amber-500/5 border border-amber-500/10 rounded text-[9.5px] text-amber-600/90 leading-relaxed italic text-center">
                              "As Wyndham standard delegates, we honor absolute consistency across all guest touchpoints."
                            </div>
                          </div>
                        )}

                        {/* Navigation Footer */}
                        <div className="border-t border-stone-200 dark:border-stone-800 pt-4 mt-4 flex items-center justify-between">
                          <span className="text-[10px] text-stone-400 font-mono">
                            Page {previewSlideIndex + 1} of 4
                          </span>
                          <div className="flex gap-1.5">
                            <button
                              disabled={previewSlideIndex === 0}
                              onClick={() => setPreviewSlideIndex(p => p - 1)}
                              className="p-1.5 rounded border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 text-stone-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800 disabled:opacity-30 cursor-pointer"
                            >
                              <ChevronLeft size={14} />
                            </button>
                            <button
                              disabled={previewSlideIndex === 3}
                              onClick={() => setPreviewSlideIndex(p => p + 1)}
                              className="p-1.5 rounded border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 text-stone-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800 disabled:opacity-30 cursor-pointer"
                            >
                              <ChevronRight size={14} />
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : selectedDocForPreview.category === "Logos" || selectedDocForPreview.fileType === "svg" || selectedDocForPreview.fileType === "png" || selectedDocForPreview.fileType === "jpg" ? (
                      <div className="flex-1 flex flex-col justify-between p-6">
                        {/* Interactive Background & Zoom controls */}
                        <div className="flex flex-wrap items-center justify-between gap-3 mb-4 bg-stone-50 dark:bg-stone-950 p-2.5 rounded border border-stone-100 dark:border-stone-800">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[9px] font-display uppercase tracking-wider text-stone-400 font-bold">Contrast Deck:</span>
                            <button
                              onClick={() => setPreviewBackground("light")}
                              className={`px-2 py-1 text-[8px] font-mono uppercase tracking-widest rounded transition-all cursor-pointer ${previewBackground === "light" ? "bg-white text-stone-950 border border-stone-300 font-bold" : "bg-stone-200 text-stone-600 dark:bg-stone-800 dark:text-stone-400"}`}
                            >
                              Light Alabaster
                            </button>
                            <button
                              onClick={() => setPreviewBackground("dark")}
                              className={`px-2 py-1 text-[8px] font-mono uppercase tracking-widest rounded transition-all cursor-pointer ${previewBackground === "dark" ? "bg-stone-950 text-white border border-stone-700 font-bold" : "bg-stone-200 text-stone-600 dark:bg-stone-800 dark:text-stone-400"}`}
                            >
                              Dark Luxury
                            </button>
                            <button
                              onClick={() => setPreviewBackground("gold")}
                              className={`px-2 py-1 text-[8px] font-mono uppercase tracking-widest rounded transition-all cursor-pointer ${previewBackground === "gold" ? "bg-[#C5A02D] text-white font-bold" : "bg-stone-200 text-stone-600 dark:bg-stone-800 dark:text-stone-400"}`}
                            >
                              Royal Gold
                            </button>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="text-[9px] font-display uppercase tracking-wider text-stone-400 font-bold">Scaling:</span>
                            <input 
                              type="range" 
                              min="50" 
                              max="150" 
                              value={previewZoom} 
                              onChange={(e) => setPreviewZoom(Number(e.target.value))}
                              className="w-24 accent-[#C5A02D] cursor-pointer"
                            />
                            <span className="text-[9px] font-mono font-bold text-stone-600 dark:text-stone-300 w-8 text-right">{previewZoom}%</span>
                          </div>
                        </div>

                        {/* Logo Container Workspace */}
                        <div 
                          className={`flex-1 min-h-[250px] flex items-center justify-center rounded border transition-all ${
                            previewBackground === "light" ? "bg-[#FDFBF7]" : 
                            previewBackground === "dark" ? "bg-[#1A1A1A]" : "bg-gradient-to-br from-[#E2C055] to-[#997813]"
                          } border-stone-200 dark:border-stone-800 relative`}
                        >
                          <div 
                            style={{ transform: `scale(${previewZoom / 100})`, transformOrigin: "center" }}
                            className="transition-transform duration-100 max-w-[80%] max-h-[80%]"
                            dangerouslySetInnerHTML={{ 
                              __html: selectedDocForPreview.fileData.includes("svg") 
                                ? decodeURIComponent(selectedDocForPreview.fileData.split(",")[1] || "")
                                : `<div className="p-4 text-center text-xs text-stone-400 font-mono">[Rendering custom image asset]</div>`
                            }}
                          />
                        </div>

                        <div className="mt-4 p-3 bg-stone-50 dark:bg-stone-950 rounded border border-stone-100 dark:border-stone-800">
                          <span className="text-[8px] font-mono text-[#C5A02D] uppercase block tracking-widest mb-1.5">Official Brand Hex Specifications:</span>
                          <div className="flex items-center gap-4 text-[9px] font-mono text-stone-500">
                            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-[#C5A02D]"></span> #C5A02D (Gold Accent)</span>
                            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-[#1A1A1A] border border-stone-400"></span> #1A1A1A (Luxury Slate)</span>
                            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-white border border-stone-200"></span> #FFFFFF (Pristine White)</span>
                          </div>
                        </div>
                      </div>
                    ) : selectedDocForPreview.category === "Templates" || selectedDocForPreview.fileType === "docx" ? (
                      <div className="flex-1 flex flex-col justify-between p-6">
                        {/* Stationery / Letterhead Layout */}
                        <div className="flex-1 overflow-y-auto bg-stone-100 dark:bg-stone-950/60 p-4 rounded border border-stone-200 dark:border-stone-800">
                          <div className="mx-auto max-w-[480px] bg-white text-[#1A1A1A] shadow-lg p-8 min-h-[460px] flex flex-col justify-between relative border-t-8 border-[#C5A02D]">
                            
                            {/* Letterhead Header block */}
                            <div>
                              <div className="flex items-start justify-between border-b border-stone-100 pb-4 mb-4">
                                <div className="text-left font-sans">
                                  <span className="text-[12px] font-display font-black tracking-widest block uppercase text-[#1A1A1A]">COVE MANAGEMENT LIMITED</span>
                                  <span className="text-[7.5px] font-mono uppercase tracking-widest text-[#C5A02D]">Corporate Head Office | Wailoaloa Fiji</span>
                                </div>
                                <div className="w-12 h-12 shrink-0">
                                  <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <circle cx="50" cy="50" r="45" fill="#1A1A1A"/>
                                    <path d="M35 30 L45 70 L55 30 H65 L70 80 H60 L57 50 L48 85 H42 L33 50 L30 80 H20 L25 30 H35 Z" fill="#C5A02D" />
                                  </svg>
                                </div>
                              </div>

                              {/* Date and Sender */}
                              <div className="text-[9.5px] text-stone-500 flex justify-between font-mono mb-4">
                                <span>Ref: CML-HQ-2026-07</span>
                                <span>Date: July 6, 2026</span>
                              </div>

                              {/* Interactive Body Textarea */}
                              <div className="text-[11px] leading-relaxed text-left space-y-4">
                                <textarea
                                  value={previewLetterBody}
                                  onChange={(e) => setPreviewLetterBody(e.target.value)}
                                  className="w-full min-h-[180px] bg-amber-50/20 text-[#1A1A1A] text-[11px] font-sans border border-dashed border-stone-200 focus:border-amber-500 rounded p-3 leading-relaxed focus:outline-none placeholder-stone-400 shadow-inner resize-none"
                                  placeholder="Type custom notification letter content here..."
                                />
                              </div>
                            </div>

                            {/* Sign block */}
                            <div className="border-t border-stone-100 pt-4 mt-6 text-left">
                              <p className="text-[7.5px] text-[#C5A02D] font-mono uppercase tracking-widest">
                                Authorized Corporate Standard Letterhead
                              </p>
                              <div className="flex justify-between items-end mt-1">
                                <div className="font-sans">
                                  <span className="font-serif italic text-xs block text-[#1A1A1A]">Charles</span>
                                  <span className="text-[8.5px] text-stone-500 block">Digital Director</span>
                                </div>
                                <div className="text-right text-[7px] text-stone-400 font-mono">
                                  CML Community Vault Secure-ID: #B3113E
                                </div>
                              </div>
                            </div>

                          </div>
                        </div>
                        
                        <div className="mt-4 p-2 text-stone-400 text-[9.5px] italic text-center">
                          ✎ Feel free to edit the letterhead text directly above! You can copy or print the result.
                        </div>
                      </div>
                    ) : (
                      // Excel / Spreadsheet view (Interactive Checklist)
                      <div className="flex-1 flex flex-col justify-between p-6">
                        <div className="flex items-center justify-between bg-emerald-50 dark:bg-emerald-950/20 p-2.5 rounded border border-emerald-100 dark:border-emerald-900/30 mb-4">
                          <div className="flex items-center gap-2">
                            <span className="px-1.5 py-0.5 bg-emerald-500 text-white rounded text-[8px] font-bold font-mono">XLSX</span>
                            <span className="text-[10px] font-display uppercase tracking-wider text-emerald-800 dark:text-emerald-400 font-bold">
                              Live Preventive Maintenance Sheet
                            </span>
                          </div>
                          <div className="text-right">
                            <span className="text-[11px] font-mono font-bold text-emerald-700 dark:text-emerald-400">
                              Compliance Status: {
                                Math.round((Object.values(checklistStatuses).filter(v => v === "Compliant").length / Object.values(checklistStatuses).length) * 100)
                              }% Compliant
                            </span>
                          </div>
                        </div>

                        {/* Spreadsheet Grid Mock */}
                        <div className="flex-1 overflow-x-auto">
                          <table className="w-full text-left border-collapse text-[10.5px]">
                            <thead>
                              <tr className="bg-stone-50 dark:bg-stone-800 border-b border-stone-200 dark:border-stone-700 text-[9px] font-display uppercase tracking-wider text-stone-400 font-bold">
                                <th className="p-2 border border-stone-200 dark:border-stone-700 w-10 text-center">ID</th>
                                <th className="p-2 border border-stone-200 dark:border-stone-700">Audit Parameter</th>
                                <th className="p-2 border border-stone-200 dark:border-stone-700 w-32">Status</th>
                                <th className="p-2 border border-stone-200 dark:border-stone-700">Inspector Observations</th>
                              </tr>
                            </thead>
                            <tbody>
                              {[
                                { id: "1", param: "Grand Lobby Chandelier & Secondary Accent Sconces" },
                                { id: "2", param: "Lemongrass Linen replenishment & Scent Diffusion" },
                                { id: "3", param: "Brass Handrails & Elevator Threshold Polishing" },
                                { id: "4", param: "Pristine Glass Frontage check (Windwards spray clean)" },
                                { id: "5", param: "Wi-Fi Portal & Ramada Check-in Client latency check" },
                                { id: "6", param: "Emergency Exit Fire Extinguisher validation" }
                              ].map((item) => (
                                <tr key={item.id} className="border-b border-stone-200 dark:border-stone-800 hover:bg-stone-50/50 dark:hover:bg-stone-900/50">
                                  <td className="p-2 border border-stone-200 dark:border-stone-800 text-center font-mono text-stone-400">{item.id}</td>
                                  <td className="p-2 border border-stone-200 dark:border-stone-800 text-stone-900 dark:text-stone-100 font-medium text-left">{item.param}</td>
                                  <td className="p-2 border border-stone-200 dark:border-stone-800">
                                    <select
                                      value={checklistStatuses[item.id] || "Compliant"}
                                      onChange={(e) => setChecklistStatuses(prev => ({ ...prev, [item.id]: e.target.value as any }))}
                                      className="w-full bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded p-1 text-[10px] font-mono focus:outline-none focus:border-emerald-500 cursor-pointer"
                                    >
                                      <option value="Compliant">🟢 Compliant</option>
                                      <option value="Non-Compliant">🔴 Non-Compliant</option>
                                      <option value="N/A">⚪ N/A</option>
                                    </select>
                                  </td>
                                  <td className="p-2 border border-stone-200 dark:border-stone-800">
                                    <input 
                                      type="text"
                                      value={checklistComments[item.id] || ""}
                                      onChange={(e) => setChecklistComments(prev => ({ ...prev, [item.id]: e.target.value }))}
                                      placeholder="No concerns reported"
                                      className="w-full bg-transparent text-stone-700 dark:text-stone-300 placeholder-stone-400 text-[10px] px-1 py-0.5 border-b border-transparent hover:border-stone-200 focus:border-emerald-500 focus:outline-none"
                                    />
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>

                        <div className="mt-4 p-3 bg-stone-50 dark:bg-stone-950 rounded border border-stone-100 dark:border-stone-800 flex justify-between items-center text-[9px] font-mono text-stone-500">
                          <span>Form Sheet: RM-PM-REV6</span>
                          <span>Inspector Delegate: Charles</span>
                          <span className="text-[#C5A02D] font-bold">Auto-Saving Enabled</span>
                        </div>
                      </div>
                    )}

                  </div>

                  {/* Right Side: File Info Panel */}
                  <div className="w-full md:w-64 bg-stone-50 dark:bg-stone-900/60 border border-stone-200 dark:border-stone-800 rounded p-4 flex flex-col justify-between shrink-0">
                    <div className="text-left">
                      <span className="text-[8px] font-mono text-[#C5A02D] uppercase block tracking-widest mb-1.5">File Metadata</span>
                      <h4 className="text-xs font-display font-bold uppercase text-stone-800 dark:text-white mb-4">
                        Document Blueprint
                      </h4>
                      
                      <div className="space-y-4 text-left">
                        <div className="p-2.5 bg-white dark:bg-stone-900 rounded border border-stone-100 dark:border-stone-800">
                          <span className="text-[8px] text-stone-400 block font-mono uppercase">Category</span>
                          <span className="text-[10px] font-display font-semibold uppercase tracking-wider text-[#C5A02D]">
                            {selectedDocForPreview.category}
                          </span>
                        </div>

                        <div className="p-2.5 bg-white dark:bg-stone-900 rounded border border-stone-100 dark:border-stone-800">
                          <span className="text-[8px] text-stone-400 block font-mono uppercase">Original Size</span>
                          <span className="text-[10px] text-stone-700 dark:text-stone-300 font-mono">
                            {selectedDocForPreview.fileSize}
                          </span>
                        </div>

                        <div className="p-2.5 bg-white dark:bg-stone-900 rounded border border-stone-100 dark:border-stone-800">
                          <span className="text-[8px] text-stone-400 block font-mono uppercase">Uploader Account</span>
                          <span className="text-[10px] text-stone-700 dark:text-stone-300 font-sans font-semibold">
                            {selectedDocForPreview.uploadedBy}
                          </span>
                        </div>

                        <div className="p-2.5 bg-white dark:bg-stone-900 rounded border border-stone-100 dark:border-stone-800">
                          <span className="text-[8px] text-stone-400 block font-mono uppercase">Standard Security</span>
                          <span className="text-[9.5px] text-stone-700 dark:text-stone-300 font-mono flex items-center gap-1.5 text-green-500">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-ping"></span> CML Secure Vault
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-6 pt-4 border-t border-stone-200 dark:border-stone-800 text-[10px] text-stone-400 italic leading-relaxed text-left">
                      "Each of these files represents the operational standard approved by our Co-Founders, Mark & Jenice Hinton."
                    </div>
                  </div>

                </div>

                {/* Footer of Modal */}
                <div className="px-6 py-3 border-t border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-950 flex items-center justify-between">
                  <span className="text-[10px] font-sans text-stone-400">
                    Press ESC to cancel • Cove Management Standard 2026
                  </span>
                  <button
                    onClick={() => setSelectedDocForPreview(null)}
                    className="px-4 py-2 bg-stone-900 hover:bg-[#C5A02D] text-white transition-all text-[10px] font-display uppercase tracking-widest font-black rounded-sm cursor-pointer"
                  >
                    Done
                  </button>
                </div>

              </div>
            </div>
          )}

        </div>

      </div>

    </div>
  );
};
