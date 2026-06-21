import React, { useState, useEffect, useRef } from 'react';
import { 
  db,
  collection, 
  query, 
  getDocs, 
  limit 
} from '../lib/firebase';
import { 
  Search as SearchIcon, 
  X, 
  MessageSquare, 
  FileText, 
  Hotel, 
  ChevronRight,
  Clock,
  ArrowRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

interface SearchResult {
  id: string;
  title: string;
  description: string;
  category: 'Forum' | 'Forms' | 'Property Data' | 'SOPs';
  link: string;
  meta?: string;
}

const HR_FORMS = [
  { name: "General Leave Application Form - Ramada Hotel Wailoaloa Fiji", id: "leave-app", tab: "hr" },
  { name: "RETURN TO WORK FORM - Ramada Wailoaloa Fiji", id: "return-work", tab: "hr" },
  { name: "Staff Feedback Form", id: "staff-feedback", tab: "hr" },
  { name: "Guest Waiver Form", id: "guest-waiver", tab: "hr" },
  { name: "Ramada Checkin Form", id: "ramada-checkin", tab: "hr" },
  { name: "Contact Form Demo", id: "contact-form-demo", tab: "hr" },
  { name: "Missed Clock-In/Clock-Out Register - Ramada Wailoaloa Fiji", id: "missed-clock", tab: "hr" },
  { name: "Ramada Hotel - Property Officer Patrol LOG -Deck Area", id: "patrol-log-deck", tab: "hr" },
  { name: "Property Officer Logging Form", id: "property-officer-logging", tab: "hr" },
  { name: "Training Acknowledgement Form", id: "training-ack", tab: "hr" },
  { name: "Ramada Hotel Employee Forms Portal", id: "employee-forms-portal", tab: "hr" },
  { name: "EARLY LEAVE FORM - Ramada Hotel Wailoaloa Fiji", id: "early-leave-ext", tab: "hr" },
  { name: "Overtime Approval Form - Ramada Wailoaloa Hotel Fiji", id: "overtime", tab: "hr" }
];

const PROPERTY_DATA = [
  { title: "Guest Room Keys SOP", id: "guest-room-keys", category: "SOPs" },
  { title: "Master & Staff Keys SOP", id: "master-staff-keys", category: "SOPs" },
  { title: "Maintenance Guidelines", id: "maintenance-guidelines", category: "Property Data" },
  { title: "PM Checklist", id: "checklists", category: "Property Data" },
  { title: "Equipment Logs", id: "equipment-logs", category: "Property Data" },
  { title: "Property Overview", id: "property-overview", category: "Property Data" }
];

interface GlobalSearchProps {
  onNavigate: (tab: string, formId?: string) => void;
}

export const GlobalSearch: React.FC<GlobalSearchProps> = ({ onNavigate }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(true);
      }
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setResults([]);
      return;
    }

    const performSearch = async () => {
      setIsSearching(true);
      const queryLower = searchQuery.toLowerCase();
      
      const foundResults: SearchResult[] = [];

      // 1. Search HR Forms
      HR_FORMS.forEach(form => {
        if (form.name.toLowerCase().includes(queryLower)) {
          foundResults.push({
            id: form.id,
            title: form.name,
            description: 'Employment and management documentation',
            category: 'Forms',
            link: form.tab
          });
        }
      });

      // 2. Search Property Data & SOPs
      PROPERTY_DATA.forEach(data => {
        if (data.title.toLowerCase().includes(queryLower)) {
          foundResults.push({
            id: data.id,
            title: data.title,
            description: 'Property operational standards and records',
            category: data.category as any,
            link: data.id
          });
        }
      });

      // 3. Search Forum Posts (from Firestore)
      try {
        const postsRef = collection(db, 'posts');
        const postsSnapshot = await getDocs(query(postsRef, limit(50)));
        postsSnapshot.docs.forEach(doc => {
          const data = doc.data();
          if (
            data.title.toLowerCase().includes(queryLower) || 
            data.content.toLowerCase().includes(queryLower)
          ) {
            foundResults.push({
              id: doc.id,
              title: data.title,
              description: data.content.substring(0, 100) + '...',
              category: 'Forum',
              link: 'forum',
              meta: data.authorName
            });
          }
        });
      } catch (error) {
        console.error('Search error (Forum):', error);
      }

      setResults(foundResults);
      setIsSearching(false);
    };

    const debounceTimer = setTimeout(performSearch, 300);
    return () => clearTimeout(debounceTimer);
  }, [searchQuery]);

  const handleResultClick = (result: SearchResult) => {
    if (result.category === 'Forms') {
      onNavigate(result.link, result.id);
    } else {
      onNavigate(result.link);
    }
    setIsOpen(false);
    setSearchQuery('');
  };

  const categories = Array.from(new Set(results.map(r => r.category)));

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="hidden md:flex items-center gap-3 px-4 py-2 bg-slate-50 border border-slate-100 text-slate-400 hover:text-gold hover:border-gold/30 hover:bg-white transition-all rounded-none w-64 group"
      >
        <SearchIcon size={14} className="group-hover:scale-110 transition-transform" />
        <span className="text-[10px] font-display uppercase tracking-widest flex-1 text-left">Internal Search...</span>
        <kbd className="text-[9px] font-sans opacity-40">⌘K</kbd>
      </button>

      <button 
        onClick={() => setIsOpen(true)}
        className="md:hidden p-2 text-slate-400 hover:text-gold"
      >
        <SearchIcon size={20} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[10vh] px-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="absolute inset-0 bg-luxury-black/60 backdrop-blur-md"
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -20 }}
              className="relative w-full max-w-2xl bg-white border border-gold/20 shadow-2xl overflow-hidden"
            >
              <div className="flex items-center p-6 border-b border-slate-100">
                <SearchIcon size={20} className="text-gold mr-4" />
                <input 
                  ref={inputRef}
                  type="text" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search forum, SOPs, forms, properties..."
                  className="flex-1 bg-transparent border-none text-lg font-serif italic text-slate-900 focus:ring-0 placeholder:text-slate-300"
                />
                {isSearching ? (
                  <div className="w-5 h-5 border-2 border-gold border-t-transparent animate-spin rounded-full" />
                ) : (
                  <button onClick={() => setIsOpen(false)} className="p-2 text-slate-400 hover:text-red-500 transition-colors">
                    <X size={20} />
                  </button>
                )}
              </div>

              <div className="max-h-[60vh] overflow-y-auto custom-scrollbar">
                {!searchQuery.trim() ? (
                  <div className="p-12 text-center">
                    <div className="w-16 h-16 bg-luxury-cream text-gold flex items-center justify-center mx-auto mb-6">
                      <Hotel size={32} strokeWidth={1} />
                    </div>
                    <h3 className="text-xl font-serif italic text-slate-900 mb-2">CML Community Index</h3>
                    <p className="text-xs font-display uppercase tracking-widest text-slate-400">Type to search across property modules</p>
                  </div>
                ) : results.length === 0 && !isSearching ? (
                  <div className="p-12 text-center">
                    <p className="text-slate-400 font-serif italic text-lg">No matches found for "{searchQuery}"</p>
                  </div>
                ) : (
                  <div className="pb-8">
                    {categories.map(cat => (
                      <div key={cat} className="mt-6 first:mt-0">
                        <div className="px-6 py-2 bg-slate-50 border-y border-slate-100">
                          <h4 className="text-[10px] font-display uppercase tracking-[0.3em] font-black text-slate-400 italic">{cat}</h4>
                        </div>
                        <div className="divide-y divide-slate-50">
                          {results.filter(r => r.category === cat).map(result => (
                            <button
                              key={result.id + result.category}
                              onClick={() => handleResultClick(result)}
                              className="w-full p-6 text-left hover:bg-luxury-cream/30 transition-all flex items-start gap-4 group"
                            >
                              <div className="w-10 h-10 bg-white border border-slate-100 flex items-center justify-center text-slate-300 group-hover:text-gold group-hover:border-gold/30 transition-all shrink-0">
                                {cat === 'Forum' ? <MessageSquare size={18} strokeWidth={1.5} /> : 
                                 cat === 'Forms' ? <FileText size={18} strokeWidth={1.5} /> : 
                                 <Hotel size={18} strokeWidth={1.5} />}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between mb-1">
                                  <h5 className="text-sm font-serif italic text-slate-900 group-hover:text-gold transition-colors truncate">{result.title}</h5>
                                  <ArrowRight size={14} className="text-gold opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                                </div>
                                <p className="text-[11px] text-slate-400 font-serif italic line-clamp-1 opacity-80 group-hover:opacity-100">{result.description}</p>
                                {result.meta && (
                                  <div className="flex items-center gap-2 mt-2">
                                    <div className="w-1 h-1 bg-gold rounded-full opacity-40" />
                                    <span className="text-[8px] font-display uppercase tracking-widest text-slate-300">Posted by {result.meta}</span>
                                  </div>
                                )}
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="p-4 bg-luxury-black text-white flex items-center justify-between">
                <p className="text-[8px] font-display uppercase tracking-[0.3em] text-white/30 italic">Global search provider v1.0</p>
                <div className="flex items-center gap-4 text-[8px] font-display uppercase tracking-widest text-gold/60">
                   <div className="flex items-center gap-1"><Clock size={10} /> Live Index</div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};
