import React, { useState, useEffect, useRef } from "react";
import { 
  Newspaper, 
  Search, 
  Plus, 
  User, 
  Calendar, 
  Tag, 
  Trash2, 
  Loader2, 
  Filter, 
  X,
  FileText,
  AlertCircle,
  Clock,
  Sparkles,
  Bookmark,
  Maximize2,
  ExternalLink,
  Printer,
  Download,
  ZoomIn
} from "lucide-react";
import { ConfirmModal } from "./ConfirmModal";
import { 
  db, 
  auth,
  collection, 
  query, 
  orderBy, 
  onSnapshot, 
  addDoc, 
  deleteDoc, 
  doc, 
  serverTimestamp 
} from "../lib/firebase";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "../lib/utils";

interface NewsArticle {
  id: string;
  title: string;
  content: string;
  category: "Announcement" | "Operational" | "HR" | "Event" | "Training" | "Marketing";
  authorName: string;
  authorEmail: string;
  propertyTarget: "All" | "Wyndham Garden" | "Ramada Suites" | "CML Corporate";
  createdAt: any;
  imageUrl?: string;
  imageCaption?: string;
  isUrgent?: boolean;
}

const DEFAULT_NEWS_SEEDS: Omit<NewsArticle, "id">[] = [
  {
    title: "CML Headquarters Completes High-Speed Fiber Ingress Deployment",
    content: "To support our growing real-time property management syndicate, CML Group Head Office and local property hubs have successfully finished updating to symmetric 1Gbps fiber internet routes. Staff communication, database synchronizations, and customer experience operations are now running at ultra-low latencies across all devices.",
    category: "Operational",
    authorName: "Corporate IT Team",
    authorEmail: "digitalmedia@cml.com.fj",
    propertyTarget: "CML Corporate",
    createdAt: null,
    imageUrl: "https://images.unsplash.com/photo-1544197150-b99a580bb7a8?auto=format&fit=crop&q=80&w=800",
    isUrgent: true
  },
  {
    title: "Wyndham Garden Achieves Platinum Guest Satisfaction Rating in Regional Audit",
    content: "We are extremely proud to announce that Wyndham Garden Fiji (Wailoaloa Beach) has earned a flawless Guest Satisfaction index rating during the Q2 QA and Brand Standard audit. Sincere appreciation goes to our entire guest relations, housekeeping, and front office teams for delivering stellar Count-On-Me service behaviors consistently.",
    category: "Announcement",
    authorName: "General Manager",
    authorEmail: "gm@wyndham.com.fj",
    propertyTarget: "Wyndham Garden",
    createdAt: null,
    imageUrl: "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&q=80&w=800",
    isUrgent: false
  },
  {
    title: "Ramada Suites Wailoaloa Oceanview Penthouse Refibrillation & Lounge Launch",
    content: "Following standard luxury alignment guidelines, the top-tier ocean-view suites and Penthouse Club at Ramada Suites have completed fully updated interior styling schedules. The grand opening for registered corporate rewards lounge participants will be held this Saturday from 5 PM.",
    category: "Event",
    authorName: "Director of Sales",
    authorEmail: "sales@ramada.com.fj",
    propertyTarget: "Ramada Suites",
    createdAt: null,
    imageUrl: "https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&q=80&w=800",
    isUrgent: false
  },
  {
    title: "Customer Recovery Protocols Re-alignment & Service Recovery System Training",
    content: "All CML property duty managers, guest relationships leads, and operational department supervisors are requested to verify their recovery credentials. An interactive session reviewing common room sync issues and resolving procedure escalation pathways will be held in the main conference room next Tuesday.",
    category: "Training",
    authorName: "Group Operations Director",
    authorEmail: "ops@cml.com.fj",
    propertyTarget: "All",
    createdAt: null,
    imageUrl: "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?auto=format&fit=crop&q=80&w=800",
    isUrgent: true
  }
];

export function DailyNews() {
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("All");
  const [propertyFilter, setPropertyFilter] = useState<string>("All");
  const [selectedArticle, setSelectedArticle] = useState<NewsArticle | null>(null);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  // Form State
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState<NewsArticle["category"]>("Announcement");
  const [propertyTarget, setPropertyTarget] = useState<NewsArticle["propertyTarget"]>("All");
  const [imageUrl, setImageUrl] = useState("");
  const [imageCaption, setImageCaption] = useState("");
  const [imageSourceType, setImageSourceType] = useState<"upload" | "url">("upload");
  const [isDragging, setIsDragging] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [isUrgent, setIsUrgent] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processImageFile(file);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processImageFile(file);
    }
  };

  const processImageFile = (file: File) => {
    if (!file.type.startsWith("image/")) {
      alert("Invalid file type. Please select an image file.");
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      alert("Image is too large. Please select an image under 8MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setImageUrl(reader.result);
      }
    };
    reader.onerror = (error) => {
      console.error("Error reading image:", error);
    };
    reader.readAsDataURL(file);
  };

  // Check roles (Managers and Administrators can post news)
  const userEmail = auth.currentUser?.email?.toLowerCase() || "";
  const canPublish = userEmail.includes("cml") || userEmail.includes("ramada") || userEmail.includes("wyndham") || userEmail === "digitalmedia@cml.com.fj";

  useEffect(() => {
    const q = query(collection(db, "daily-news"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, async (snapshot) => {
      if (snapshot.empty) {
        // If empty, sync static seeds for visual perfection
        setArticles(DEFAULT_NEWS_SEEDS.map((s, idx) => ({
          id: `seed-${idx}`,
          ...s,
          createdAt: { toDate: () => new Date(Date.now() - idx * 86400000) }
        })));
        setLoading(false);
        return;
      }

      const docs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as NewsArticle[];
      setArticles(docs);
      setLoading(false);
    }, (error) => {
      console.error("Firestore onSnapshot error for daily-news:", error);
      // Fallback to static seeds on error (e.g. offline sandbox or permission initialization lag)
      setArticles(DEFAULT_NEWS_SEEDS.map((s, idx) => ({
        id: `seed-${idx}`,
        ...s,
        createdAt: { toDate: () => new Date(Date.now() - idx * 86400000) }
      })));
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    setSubmitLoading(true);
    try {
      const newArticle = {
        title,
        content,
        category,
        propertyTarget,
        imageUrl: imageUrl.trim() || undefined,
        imageCaption: imageCaption.trim() || undefined,
        isUrgent,
        authorName: auth.currentUser?.displayName || auth.currentUser?.email?.split('@')[0] || "Staff Correspondent",
        authorEmail: auth.currentUser?.email || "staff@cml.com.fj",
        createdAt: serverTimestamp()
      };

      await addDoc(collection(db, "daily-news"), newArticle);

      // Reset state
      setTitle("");
      setContent("");
      setImageUrl("");
      setImageCaption("");
      setIsUrgent(false);
      setCategory("Announcement");
      setPropertyTarget("All");
      setShowAddForm(false);
    } catch (err) {
      console.error("Error adding news article:", err);
      alert("Failed to publish operational briefing. Please try again.");
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTargetId) return;
    if (deleteTargetId.startsWith("seed-")) {
      alert("Seeded demo briefings cannot be purged.");
      setDeleteTargetId(null);
      return;
    }

    try {
      await deleteDoc(doc(db, "daily-news", deleteTargetId));
    } catch (err) {
      console.error("Error deleting article:", err);
      alert("Failed to delete briefing");
    } finally {
      setDeleteTargetId(null);
    }
  };

  const filteredArticles = articles.filter(art => {
    const matchesSearch = art.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          art.content.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === "All" || art.category === categoryFilter;
    const matchesProperty = propertyFilter === "All" || art.propertyTarget === propertyFilter;
    return matchesSearch && matchesCategory && matchesProperty;
  });

  const featuredArticle = filteredArticles.find(art => art.imageUrl);
  const gridArticles = featuredArticle 
    ? filteredArticles.filter(art => art.id !== featuredArticle.id)
    : filteredArticles;

  return (
    <div id="daily-news" className="space-y-8 animate-fade-in pb-16">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-slate-100">
        <div>
          <h2 className="text-4xl font-serif text-slate-900 italic">Daily Noticeboard</h2>
          <p className="luxury-label opacity-60">System announcements, property developments & daily field operations reports</p>
        </div>
        {canPublish && (
          <button 
            onClick={() => setShowAddForm(true)}
            className="flex items-center gap-2 px-8 py-4 bg-luxury-black text-white text-[10px] font-display uppercase tracking-widest font-black hover:bg-gold transition-all shadow-xl self-start md:self-auto"
          >
            <Plus size={16} /> Broadcast Briefing
          </button>
        )}
      </div>

      {/* Brief Filters Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Search */}
        <div className="relative flex items-center bg-white p-3 border border-slate-100 shadow-sm">
          <Search size={18} className="text-slate-400 mr-3 shrink-0" />
          <input 
            type="text"
            placeholder="Search Noticeboard feed..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-transparent border-none text-xs font-serif italic focus:ring-0 p-0 outline-none"
          />
          {searchTerm && (
            <button onClick={() => setSearchTerm("")}>
              <X size={14} className="text-slate-400 hover:text-slate-600" />
            </button>
          )}
        </div>

        {/* Category Selector */}
        <div className="flex items-center gap-2 bg-white p-1 border border-slate-100 shadow-sm overflow-x-auto no-scrollbar scrollbar-none">
          <div className="text-[8px] font-display uppercase tracking-wider text-slate-400 ml-2 font-black whitespace-nowrap">Category:</div>
          {["All", "Announcement", "Operational", "Event", "Training"].map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={cn(
                "whitespace-nowrap px-3 py-1.5 text-[8px] font-display uppercase tracking-wider font-bold transition-all",
                categoryFilter === cat ? "bg-gold text-white" : "text-slate-400 hover:text-slate-600"
              )}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Property Selector */}
        <div className="flex items-center gap-2 bg-white p-1 border border-slate-100 shadow-sm overflow-x-auto no-scrollbar scrollbar-none">
          <div className="text-[8px] font-display uppercase tracking-wider text-slate-400 ml-2 font-black whitespace-nowrap">Hub:</div>
          {["All", "CML Corporate", "Wyndham Garden", "Ramada Suites"].map((prop) => (
            <button
              key={prop}
              onClick={() => setPropertyFilter(prop)}
              className={cn(
                "whitespace-nowrap px-3 py-1.5 text-[8px] font-display uppercase tracking-wider font-bold transition-all",
                propertyFilter === prop ? "bg-gold text-white" : "text-slate-400 hover:text-slate-600"
              )}
            >
              {prop.replace(" Corporate", "").replace(" Garden", "").replace(" Suites", "")}
            </button>
          ))}
        </div>
      </div>

      {/* Main Grid */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4 bg-white/20 border border-slate-100">
          <Loader2 className="text-gold animate-spin" size={32} />
          <p className="text-[10px] font-display uppercase tracking-widest text-slate-500">Dispatching Noticeboard...</p>
        </div>
      ) : filteredArticles.length === 0 ? (
        <div className="text-center py-20 bg-white border border-slate-100">
          <AlertCircle className="mx-auto text-slate-300 mb-3" size={36} />
          <p className="text-slate-500 font-serif italic text-sm">No daily news publications found matching details.</p>
        </div>
      ) : (
        <div className="space-y-12">
          {/* Headline Featured Advertisement Billboard (Basically Big / Whole Page layout) */}
          {featuredArticle && (
            <motion.div 
              onClick={() => setSelectedArticle(featuredArticle)}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="relative bg-luxury-black border border-gold/15 overflow-hidden shadow-xl cursor-pointer group flex flex-col lg:flex-row h-auto lg:h-[480px] hover:border-gold/30 transition-all duration-300"
            >
              {/* Left Side: Uncropped flyer image */}
              <div className="w-full lg:w-[45%] bg-slate-950 p-6 flex flex-col justify-between overflow-hidden shrink-0 relative min-h-[350px] lg:min-h-0 border-b lg:border-b-0 lg:border-r border-gold/10">
                <div className="flex-1 flex items-center justify-center overflow-hidden">
                  <img 
                    src={featuredArticle.imageUrl} 
                    alt={featuredArticle.title} 
                    className="max-h-[300px] lg:max-h-[400px] object-contain mx-auto shadow-2xl transition-transform duration-700 group-hover:scale-[1.015]"
                    referrerPolicy="no-referrer"
                  />
                </div>
                
                <div className="absolute top-4 left-4 z-10">
                  <span className="px-2 py-1 text-[8px] font-display uppercase tracking-widest font-black bg-gold text-white shadow-md">
                    ★ PINNED ADVERTISEMENT
                  </span>
                </div>

                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center z-10">
                  <div className="bg-white/10 backdrop-blur-md border border-white/20 p-3 rounded-full text-white shadow-xl transition-transform group-hover:scale-105">
                    <Maximize2 size={18} className="text-gold" />
                  </div>
                  <span className="absolute bottom-6 text-[9px] font-display uppercase tracking-widest text-white font-bold bg-black/70 px-2.5 py-1 border border-white/10">
                    Click to Open Full Page Poster
                  </span>
                </div>
              </div>

              {/* Right Side: High contrast details */}
              <div className="flex-1 p-8 md:p-12 flex flex-col justify-between text-white relative">
                {/* Decorative background logo symbol */}
                <div className="absolute right-0 bottom-0 pointer-events-none opacity-[0.03] select-none text-right">
                  <Newspaper size={320} className="text-gold transform translate-x-12 translate-y-12" />
                </div>

                <div className="space-y-6 relative z-10">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 text-[8px] font-display uppercase tracking-widest font-black border border-gold text-gold">
                      {featuredArticle.category}
                    </span>
                    <span className="text-[10px] text-slate-300 font-mono uppercase tracking-widest">
                      Hub: {featuredArticle.propertyTarget}
                    </span>
                    {featuredArticle.isUrgent && (
                      <span className="text-[9px] font-display uppercase tracking-widest font-black text-rose-500 animate-pulse flex items-center gap-1">
                        <span>⚠️</span> CRITICAL ACTION REQUIRED
                      </span>
                    )}
                  </div>

                  <h3 className="text-3xl md:text-4.5xl font-serif italic leading-tight text-white group-hover:text-gold transition-colors duration-300">
                    {featuredArticle.title}
                  </h3>

                  <div className="h-[1px] bg-gold/20 w-24"></div>

                  <p className="text-xs md:text-sm text-slate-350 font-serif italic leading-relaxed line-clamp-4 max-w-xl">
                    {featuredArticle.content}
                  </p>
                </div>

                {/* Author Footer */}
                <div className="border-t border-white/10 pt-6 mt-8 flex items-center justify-between relative z-10">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-slate-300">
                      <User size={15} className="text-gold" />
                    </div>
                    <div className="leading-tight">
                      <p className="text-[9px] font-display uppercase tracking-widest font-black text-slate-100">{featuredArticle.authorName}</p>
                      <span className="text-[8px] text-slate-400 font-mono block">{featuredArticle.authorEmail}</span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-[8px] text-slate-405 font-mono uppercase tracking-widest block font-bold">Published On</span>
                    <time className="text-[10.5px] font-serif italic text-gold">
                      {featuredArticle.createdAt ? (featuredArticle.createdAt.toDate ? featuredArticle.createdAt.toDate().toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }) : new Date(featuredArticle.createdAt).toLocaleDateString()) : "Today"}
                    </time>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Grid list of remaining/other briefings */}
          {gridArticles.length > 0 && (
            <div className="space-y-6">
              {featuredArticle && (
                <div className="flex items-center gap-4 pt-4">
                  <span className="text-[9px] font-display uppercase tracking-[0.3em] text-slate-400 font-bold shrink-0">More News Publications</span>
                  <div className="flex-1 h-px bg-slate-100"></div>
                </div>
              )}
              
              <div className="grid grid-cols-1 gap-6">
                <AnimatePresence mode="popLayout">
                  {gridArticles.map((art) => (
                    <motion.article
                      key={art.id}
                      layout
                      initial={{ opacity: 0, scale: 0.98 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.98 }}
                      onClick={() => setSelectedArticle(art)}
                      className={cn(
                        "bg-luxury-black border border-gold/15 transition-all flex flex-col md:flex-row shadow-xl hover:border-gold/30 hover:-translate-y-0.5 duration-300 h-auto md:h-[280px] text-white relative overflow-hidden group cursor-pointer",
                        art.isUrgent ? "urgent-pulse-glow" : "border-gold/15"
                      )}
                    >
                      {/* Image / Header cover (Landscape split layout style matching billboard) */}
                      <div className="w-full md:w-[35%] bg-slate-950 p-4 flex flex-col items-center justify-center relative overflow-hidden border-b md:border-b-0 md:border-r border-gold/10 shrink-0 min-h-[220px] md:min-h-0">
                        {art.imageUrl ? (
                          <>
                            <div className="w-full h-full flex items-center justify-center overflow-hidden">
                              <img 
                                src={art.imageUrl} 
                                alt={art.title} 
                                className="max-h-[170px] md:max-h-[220px] object-contain mx-auto shadow-2xl transition-transform duration-700 group-hover:scale-[1.015]" 
                                referrerPolicy="no-referrer"
                              />
                            </div>
                            {/* Interactive Zoom Overlay */}
                            <div className="absolute inset-0 bg-black/45 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1 z-10">
                              <div className="bg-white/10 backdrop-blur-sm border border-white/20 p-2.5 rounded-full text-gold shadow-lg transform translate-y-2 group-hover:translate-y-0 transition-all duration-300">
                                <Maximize2 size={14} className="text-gold" />
                              </div>
                              <span className="text-[7.5px] font-display uppercase tracking-widest text-[#E5C384] font-bold bg-black/70 px-2 py-1 border border-gold/20 transform translate-y-2 group-hover:translate-y-0 transition-all duration-300">
                                Click to Open Full Page Poster
                              </span>
                            </div>
                          </>
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-slate-900/95">
                            <Newspaper size={36} className="text-gold/25" />
                          </div>
                        )}

                        {/* Top corner badge overlays inside image section for split aesthetic layout */}
                        <div className="absolute top-3 left-3 z-10 pointer-events-none">
                          <span className="px-2 py-0.5 text-[7px] font-display uppercase tracking-widest font-black bg-gold text-white shadow-md">
                            {art.category}
                          </span>
                        </div>

                        {art.isUrgent && (
                          <div className="absolute top-3 right-3 z-10 pointer-events-none">
                            <span className="px-2 py-0.5 text-[7px] font-display uppercase tracking-widest font-black bg-red-650 text-white animate-pulse shadow-md">
                              ⚠️ URGENT
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Article Details Content (Flexible right column matching billboard exactly) */}
                      <div className="flex-1 p-6 md:p-8 flex flex-col justify-between text-white relative overflow-hidden">
                        {/* Elegant watermark background element */}
                        <div className="absolute right-0 bottom-0 pointer-events-none opacity-[0.015] select-none text-right">
                          <Newspaper size={180} className="text-gold transform translate-x-6 translate-y-6" />
                        </div>

                        <div className="space-y-2.5 relative z-10">
                          {/* Inner Header row info */}
                          <div className="flex items-center gap-2">
                            <span className="px-1.5 py-0.5 text-[7px] font-display uppercase tracking-widest font-black border border-gold/30 text-gold-light">
                              {art.category}
                            </span>
                            <span className="text-[9px] text-slate-350 font-mono uppercase tracking-widest">
                              Hub: {art.propertyTarget}
                            </span>
                          </div>

                          <h3 className="text-base md:text-lg font-serif italic leading-tight text-[#f3e5be] group-hover:text-white transition-colors duration-300 pr-12 line-clamp-2">
                            {art.title}
                          </h3>

                          {/* Optional Image Caption inline right below title */}
                          {art.imageUrl && art.imageCaption && (
                            <div className="text-[10px] font-serif italic text-slate-400 block truncate" title={art.imageCaption}>
                              📷 {art.imageCaption}
                            </div>
                          )}

                          <div className="h-[1px] bg-gold/15 w-12"></div>

                          <p className="text-xs text-slate-300/90 font-serif italic leading-relaxed line-clamp-3 md:line-clamp-4 pr-1">
                            {art.content}
                          </p>
                        </div>

                        {/* Footer Author & Date details container */}
                        <div className="border-t border-white/10 pt-4 mt-4 flex items-center justify-between relative z-10 shrink-0">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-slate-350 shrink-0">
                              <User size={13} className="text-gold" />
                            </div>
                            <div className="leading-tight">
                              <p className="text-[9px] font-display uppercase tracking-widest font-black text-slate-100">{art.authorName}</p>
                              <span className="text-[8px] text-slate-400 font-mono block truncate max-w-[150px] md:max-w-[200px]">{art.authorEmail}</span>
                            </div>
                          </div>

                          <div className="text-right">
                            <span className="text-[8px] text-slate-405 font-mono uppercase tracking-widest block font-bold">Published</span>
                            <time className="text-[9px] font-serif italic text-gold-light">
                              {art.createdAt ? (art.createdAt.toDate ? art.createdAt.toDate().toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }) : new Date(art.createdAt).toLocaleDateString()) : "Today"}
                            </time>
                          </div>
                        </div>

                        {/* Admin Deletion in content area top right corner with modal confirmation */}
                        {canPublish && !art.id.startsWith("seed-") && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeleteTargetId(art.id);
                            }}
                            className="absolute top-6 right-6 p-2 bg-white/5 hover:bg-red-950/45 text-slate-300 hover:text-red-400 transition-colors border border-white/10 rounded-sm z-20"
                            title="Delete News Post"
                          >
                            <Trash2 size={12} />
                          </button>
                        )}
                      </div>
                    </motion.article>
                  ))}
                </AnimatePresence>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Post Modal overlay */}
      <AnimatePresence>
        {showAddForm && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAddForm(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />
            <motion.div
              layoutId="add-news-modal"
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative w-full max-w-2xl bg-white border border-gold/10 p-10 shadow-2xl overflow-y-auto max-h-[90vh] rounded-none"
            >
              <button 
                onClick={() => setShowAddForm(false)}
                className="absolute top-6 right-6 text-slate-400 hover:text-slate-900 transition-colors"
              >
                <X size={20} />
              </button>

              <div className="mb-8">
                <h3 className="text-3xl font-serif italic text-slate-900 mb-1">Broadcast Operational Briefing</h3>
                <p className="luxury-label opacity-60">Post announcement to property feed dashboards</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[8px] font-display uppercase tracking-widest text-slate-400 font-bold">Category</label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value as any)}
                      className="w-full bg-slate-50 border-none px-4 py-3 text-xs font-serif italic outline-none focus:ring-1 focus:ring-gold/30"
                    >
                      <option value="Announcement">Announcement</option>
                      <option value="Operational">Operational</option>
                      <option value="Event">Event</option>
                      <option value="Training">Training</option>
                      <option value="HR">Human Resources (HR)</option>
                      <option value="Marketing">Marketing</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[8px] font-display uppercase tracking-widest text-slate-400 font-bold">Property Scope Target</label>
                    <select
                      value={propertyTarget}
                      onChange={(e) => setPropertyTarget(e.target.value as any)}
                      className="w-full bg-slate-50 border-none px-4 py-3 text-xs font-serif italic outline-none focus:ring-1 focus:ring-gold/30"
                    >
                      <option value="All">All Hubs (Syndicate Broadcast)</option>
                      <option value="Wyndham Garden">Wyndham Garden</option>
                      <option value="Ramada Suites">Ramada Suites</option>
                      <option value="CML Corporate">CML Corporate</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[8px] font-display uppercase tracking-widest text-slate-400 font-bold">Briefing Title</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Server Migration Confirmation or Policy Guidance"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full bg-slate-50 border-none px-4 py-3 text-xs font-serif italic outline-none focus:ring-1 focus:ring-gold/30"
                  />
                </div>

                <div className="space-y-3">
                  <label className="text-[8px] font-display uppercase tracking-widest text-slate-400 font-bold">Briefing Artwork / Cover Image</label>
                  
                  {/* Toggle Image Source Selector */}
                  <div className="flex gap-2 p-1 bg-slate-50 border border-slate-100">
                    <button
                      type="button"
                      onClick={() => setImageSourceType("upload")}
                      className={cn(
                        "flex-1 py-1.5 text-[9px] font-display uppercase tracking-wider font-extrabold transition-all",
                        imageSourceType === "upload" ? "bg-luxury-black text-white" : "text-slate-400 hover:text-slate-900"
                      )}
                    >
                      Upload Local File
                    </button>
                    <button
                      type="button"
                      onClick={() => setImageSourceType("url")}
                      className={cn(
                        "flex-1 py-1.5 text-[9px] font-display uppercase tracking-wider font-extrabold transition-all",
                        imageSourceType === "url" ? "bg-luxury-black text-white" : "text-slate-400 hover:text-slate-900"
                      )}
                    >
                      Image URL Address
                    </button>
                  </div>

                  {imageSourceType === "upload" ? (
                    <div 
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                      onClick={() => fileInputRef.current?.click()}
                      className={cn(
                        "border-2 border-dashed rounded-none p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-1.5 min-h-[140px]",
                        isDragging ? "border-gold bg-gold/5" : "border-slate-200 bg-slate-50 hover:border-gold/50"
                      )}
                    >
                      <input 
                        type="file" 
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        accept="image/*"
                        className="hidden" 
                      />
                      {imageUrl ? (
                        <div className="relative w-full h-32 overflow-hidden bg-slate-900">
                          <img src={imageUrl} className="w-full h-full object-cover opacity-90" alt="Preview" referrerPolicy="no-referrer" />
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setImageUrl("");
                            }}
                            className="absolute top-2 right-2 bg-black/70 text-white hover:bg-black px-2 py-1 text-[8px] font-display uppercase font-bold tracking-widest"
                          >
                            Remove
                          </button>
                        </div>
                      ) : (
                        <>
                          <Sparkles className="text-gold" size={20} />
                          <p className="text-[10px] font-display uppercase tracking-wider text-slate-700 font-extrabold">Drag & Drop Image or Click to Browse</p>
                          <p className="text-[9px] text-slate-400 font-serif italic">Supports JPEG, PNG, WEBP, SVG</p>
                        </>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <input
                        type="url"
                        placeholder="e.g. https://images.unsplash.com/... or leave blank"
                        value={imageUrl}
                        onChange={(e) => setImageUrl(e.target.value)}
                        className="w-full bg-slate-50 border-none px-4 py-3 text-[10px] font-mono outline-none focus:ring-1 focus:ring-gold/30"
                      />
                    </div>
                  )}

                  {/* Caption Input */}
                  <div className="space-y-1 pt-1">
                    <label className="text-[8px] font-display uppercase tracking-widest text-slate-400 font-bold">Image Caption</label>
                    <input
                      type="text"
                      placeholder="e.g. CML Headquarters operational team syncing databases"
                      value={imageCaption}
                      onChange={(e) => setImageCaption(e.target.value)}
                      className="w-full bg-slate-50 border-none px-4 py-3 text-xs font-serif italic outline-none focus:ring-1 focus:ring-gold/30"
                    />
                  </div>
                </div>

                <div className="space-y-2 pt-2">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input 
                      type="checkbox"
                      checked={isUrgent}
                      onChange={(e) => setIsUrgent(e.target.checked)}
                      className="form-checkbox text-gold focus:ring-gold/30 h-4 w-4 border-slate-300"
                    />
                    <div className="leading-none">
                      <span className="text-[10px] font-display uppercase tracking-widest font-black text-rose-600">Mark as Critical / Urgent Announcement</span>
                      <p className="text-[9px] text-slate-400 font-serif italic mt-0.5">Increases visibility overlay on reader cards</p>
                    </div>
                  </label>
                </div>

                <div className="space-y-1">
                  <label className="text-[8px] font-display uppercase tracking-widest text-slate-400 font-bold">Briefing Content</label>
                  <textarea
                    rows={6}
                    required
                    placeholder="Draft the operational parameters, information update, or briefing schedule..."
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    className="w-full bg-slate-50 border-none px-4 py-3 text-xs font-serif italic outline-none focus:ring-1 focus:ring-gold/30 resize-none leading-relaxed"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitLoading}
                  className="w-full py-5 bg-gold text-white text-[11px] font-display uppercase tracking-[0.4em] font-black hover:bg-luxury-black transition-all shadow-2xl active:scale-95 flex items-center justify-center gap-2"
                >
                  {submitLoading ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Publishing to Syndicate...
                    </>
                  ) : "Broadcast News Briefing"}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Immersive Selected Article / Full-Page Flyer Lightbox Modal (Basically Big / Whole Page layout) */}
      <AnimatePresence>
        {selectedArticle && (
          <div id="selected-briefing-modal" className="fixed inset-0 z-[150] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedArticle(null)}
              className="absolute inset-0 bg-black/90 backdrop-blur-xl"
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 30 }}
              transition={{ type: "spring", damping: 25, stiffness: 220 }}
              className="relative w-full max-w-6xl bg-white border border-gold/20 shadow-2xl overflow-hidden rounded-none flex flex-col md:flex-row h-full max-h-[90vh] z-10"
            >
              {/* Close Button */}
              <button 
                onClick={() => setSelectedArticle(null)}
                className="absolute top-4 right-4 z-20 p-2 bg-black/80 hover:bg-gold text-white transition-colors border border-white/10 rounded-none shadow-lg flex items-center justify-center"
                title="Close Viewer"
              >
                <X size={18} />
              </button>

              {selectedArticle.imageUrl ? (
                <>
                  {/* Left Column: Massive uncropped advertisement flyer */}
                  <div className="w-full md:w-[50%] h-[45vh] md:h-full bg-slate-950 flex flex-col justify-between p-4 border-b md:border-b-0 md:border-r border-slate-100 shrink-0 relative overflow-hidden group">
                    <div className="flex-1 flex items-center justify-center overflow-auto no-scrollbar scrollbar-none min-h-0">
                      <img 
                        src={selectedArticle.imageUrl} 
                        alt={selectedArticle.title} 
                        className="max-w-full max-h-[70vh] object-contain shadow-2xl transition-transform hover:scale-[1.03] duration-500" 
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    {/* Caption & Actions footer inside left pane */}
                    <div className="pt-3 border-t border-white/10 shrink-0 flex flex-col gap-2">
                      {selectedArticle.imageCaption && (
                        <p className="text-[10px] font-serif italic text-slate-400 text-center leading-tight">
                          📷 {selectedArticle.imageCaption}
                        </p>
                      )}
                      <div className="flex items-center justify-center gap-4">
                        <a 
                          href={selectedArticle.imageUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/10 hover:text-gold text-slate-300 border border-white/10 text-[9px] font-display uppercase tracking-widest transition-all font-bold"
                        >
                          <ExternalLink size={12} /> Open in New Tab
                        </a>
                        <button
                          onClick={() => {
                            const printWindow = window.open("", "_blank");
                            if (printWindow) {
                              printWindow.document.write(`
                                <html>
                                  <head>
                                    <title>${selectedArticle.title}</title>
                                    <style>
                                      body { margin: 0; display: flex; justify-content: center; align-items: center; min-height: 100vh; background-color: #fff; }
                                      img { max-width: 100%; max-height: 100vh; object-fit: contain; }
                                    </style>
                                  </head>
                                  <body>
                                    <img src="${selectedArticle.imageUrl}" />
                                    <script>
                                      window.onload = function() {
                                        setTimeout(() => {
                                          window.print();
                                          window.close();
                                        }, 300);
                                      }
                                    </script>
                                  </body>
                                </html>
                              `);
                              printWindow.document.close();
                            }
                          }}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/10 hover:text-gold text-slate-300 border border-white/10 text-[9px] font-display uppercase tracking-widest transition-all font-bold"
                        >
                          <Printer size={12} /> Print Advertisement
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Editorial Text & Metadata */}
                  <div className="flex-1 p-6 md:p-10 flex flex-col justify-between overflow-y-auto bg-slate-50/30">
                    <div className="space-y-6">
                      {/* Meta header */}
                      <div className="flex flex-wrap items-center gap-2 pb-4 border-b border-slate-105">
                        <span className={cn(
                          "px-2.5 py-1 text-[8px] font-display uppercase tracking-widest font-black text-white",
                          selectedArticle.category === "Operational" ? "bg-amber-600" :
                          selectedArticle.category === "Announcement" ? "bg-indigo-600" :
                          selectedArticle.category === "Event" ? "bg-teal-600" :
                          selectedArticle.category === "Training" ? "bg-violet-600" : "bg-emerald-600"
                        )}>
                          {selectedArticle.category}
                        </span>
                        
                        <span className="px-2.5 py-1 text-[8px] font-display uppercase tracking-widest font-black border border-slate-200 text-slate-500">
                          Hub: {selectedArticle.propertyTarget}
                        </span>

                        {selectedArticle.isUrgent && (
                          <span className="px-2.5 py-1 text-[8px] font-display uppercase tracking-widest font-black bg-rose-600 text-white animate-pulse">
                            ⚠️ CRITICAL UPDATE
                          </span>
                        )}
                      </div>

                      {/* Title */}
                      <h2 className="text-2xl md:text-3.5xl font-serif text-slate-900 leading-snug italic font-medium">
                        {selectedArticle.title}
                      </h2>
                      
                      {/* Gold Separator */}
                      <div className="h-[2px] bg-gold/30 w-24"></div>

                      {/* Content block */}
                      <div className="prose prose-slate max-w-none">
                        <p className="text-xs md:text-sm text-slate-700 font-serif italic leading-relaxed whitespace-pre-wrap">
                          {selectedArticle.content}
                        </p>
                      </div>
                    </div>

                    {/* Author Footer */}
                    <div className="border-t border-slate-200 pt-6 mt-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white/60 p-5 border border-slate-100">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-500">
                          <User size={18} className="text-gold" />
                        </div>
                        <div className="leading-tight">
                          <p className="text-[10px] font-display uppercase tracking-[0.1em] font-black text-slate-800">{selectedArticle.authorName}</p>
                          <span className="text-[9px] text-slate-400 font-mono block">{selectedArticle.authorEmail}</span>
                        </div>
                      </div>

                      <div className="leading-tight sm:text-right">
                        <span className="text-[8px] text-slate-400 font-mono uppercase tracking-widest block font-bold">Noticeboard Bulletin Date</span>
                        <time className="text-[10px] font-serif italic text-slate-600 font-bold">
                          {selectedArticle.createdAt ? (selectedArticle.createdAt.toDate ? selectedArticle.createdAt.toDate().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : new Date(selectedArticle.createdAt).toLocaleDateString()) : "Today"}
                        </time>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                /* No Image: Gorgeous 1-Column Classic Letterhead Editorial Layout */
                <div className="flex-1 p-8 md:p-14 flex flex-col justify-between overflow-y-auto bg-white relative">
                  {/* Decorative background watermark */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.02]">
                    <Newspaper size={400} className="text-gold" />
                  </div>

                  <div className="space-y-8 relative z-10 max-w-3xl mx-auto w-full">
                    {/* Header line */}
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gold/15 pb-4">
                      <div className="flex items-center gap-2">
                        <span className="px-3 py-1 text-[8px] font-display uppercase tracking-widest font-black text-white bg-luxury-black">
                          {selectedArticle.category}
                        </span>
                        <span className="px-2.5 py-0.5 text-[8px] font-display uppercase tracking-widest font-black border border-slate-200 text-slate-500">
                          Hub: {selectedArticle.propertyTarget}
                        </span>
                      </div>
                      
                      {selectedArticle.isUrgent && (
                        <span className="px-2.5 py-1 text-[8px] font-display uppercase tracking-widest font-black bg-rose-600 text-white animate-pulse">
                          ⚠️ CRITICAL UPDATE
                        </span>
                      )}
                    </div>

                    {/* Title */}
                    <h2 className="text-3xl md:text-5xl font-serif text-slate-900 leading-tight italic font-medium text-center py-4">
                      {selectedArticle.title}
                    </h2>

                    {/* Decorative gold horizontal line with elegant center symbol */}
                    <div className="flex items-center justify-center gap-4">
                      <div className="h-px bg-gold/30 flex-1"></div>
                      <span className="text-gold text-xs">◆</span>
                      <div className="h-px bg-gold/30 flex-1"></div>
                    </div>

                    {/* Paragraph */}
                    <p className="text-sm md:text-base text-slate-800 font-serif italic leading-relaxed whitespace-pre-wrap text-center py-4 max-w-2xl mx-auto">
                      {selectedArticle.content}
                    </p>
                  </div>

                  {/* Footer */}
                  <div className="border-t border-slate-100 pt-6 mt-12 flex flex-col sm:flex-row sm:items-center justify-between gap-4 max-w-3xl mx-auto w-full relative z-10">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-500">
                        <User size={18} className="text-gold" />
                      </div>
                      <div className="leading-tight">
                        <p className="text-[10px] font-display uppercase tracking-widest font-black text-slate-800">{selectedArticle.authorName}</p>
                        <span className="text-[9px] text-slate-400 font-mono block">{selectedArticle.authorEmail}</span>
                      </div>
                    </div>

                    <div className="leading-tight sm:text-right">
                      <span className="text-[8px] text-slate-400 font-mono uppercase tracking-widest block font-bold">Noticeboard Dispatch Date</span>
                      <time className="text-[10px] font-serif italic text-slate-600 font-bold">
                        {selectedArticle.createdAt ? (selectedArticle.createdAt.toDate ? selectedArticle.createdAt.toDate().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : new Date(selectedArticle.createdAt).toLocaleDateString()) : "Today"}
                      </time>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <ConfirmModal
        isOpen={!!deleteTargetId}
        onClose={() => setDeleteTargetId(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete News Briefing?"
        description="Are you sure you want to permanently delete this operational briefing? This action is irreversible and the noticeboard entry will be lost."
        confirmLabel="Delete Truly"
        cancelLabel="Keep Briefing"
        variant="danger"
      />
    </div>
  );
}
