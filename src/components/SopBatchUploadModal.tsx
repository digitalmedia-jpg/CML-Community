import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  X, 
  FileText, 
  FolderArchive, 
  Calendar, 
  Check, 
  AlertCircle, 
  Loader2, 
  CheckSquare, 
  Square,
  Edit2,
  Trash2
} from "lucide-react";
import JSZip from "jszip";

// Helper function to concatenate classNames
function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

interface ParsedSopItem {
  id: string;
  originalName: string;
  title: string;
  date: string;
  base64Data: string;
  selected: boolean;
  isValid: boolean;
}

interface SopBatchUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (newSops: { title: string; url: string; date: string }[]) => void;
  zipFile: File | null;
}

export const SopBatchUploadModal: React.FC<SopBatchUploadModalProps> = ({
  isOpen,
  onClose,
  onImport,
  zipFile
}) => {
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [parsedItems, setParsedItems] = useState<ParsedSopItem[]>([]);
  const [selectAll, setSelectAll] = useState<boolean>(true);

  useEffect(() => {
    if (isOpen && zipFile) {
      processZipFile(zipFile);
    } else {
      // Reset state on close
      setParsedItems([]);
      setErrorMsg(null);
      setLoading(false);
    }
  }, [isOpen, zipFile]);

  // Handle the "Select All" toggle
  const handleToggleSelectAll = () => {
    const nextVal = !selectAll;
    setSelectAll(nextVal);
    setParsedItems(prev => prev.map(item => ({ ...item, selected: nextVal })));
  };

  // Toggle individual item selection
  const handleToggleSelectItem = (id: string) => {
    setParsedItems(prev => {
      const updated = prev.map(item => 
        item.id === id ? { ...item, selected: !item.selected } : item
      );
      // Update check all state
      const allSelected = updated.every(item => item.selected);
      setSelectAll(allSelected);
      return updated;
    });
  };

  // Handle manual inline title updates
  const handleUpdateTitle = (id: string, newTitle: string) => {
    setParsedItems(prev => prev.map(item => 
      item.id === id ? { ...item, title: newTitle } : item
    ));
  };

  // Handle manual inline date updates
  const handleUpdateDate = (id: string, newDate: string) => {
    setParsedItems(prev => prev.map(item => 
      item.id === id ? { ...item, date: newDate } : item
    ));
  };

  // Delete/Exclude single item
  const handleDeleteItem = (id: string) => {
    setParsedItems(prev => prev.filter(item => item.id !== id));
  };

  // Parser algorithm for SOP filenames
  const parseFilename = (filename: string): { title: string; date: string } => {
    // 1. Strip PDF extension and path directories if nested
    let baseName = filename.replace(/\.pdf$/i, "");
    
    // Support files organized inside internal directories
    const lastSlash = Math.max(baseName.lastIndexOf("/"), baseName.lastIndexOf("\\"));
    if (lastSlash !== -1) {
      baseName = baseName.substring(lastSlash + 1);
    }

    let extractedDate = new Date().toISOString().split("T")[0]; // Default to today
    let dateFound = false;

    // Pattern 1: YYYY-MM-DD or YYYY_MM_DD or YYYY/MM/DD
    const ymdRegex = /\b(20[0-9]{2})[-_/\.](0[1-9]|1[0-2])[-_/\.](0[1-9]|[12][0-9]|3[01])\b/;
    const ymdMatch = baseName.match(ymdRegex);
    if (ymdMatch) {
      extractedDate = `${ymdMatch[1]}-${ymdMatch[2]}-${ymdMatch[3]}`;
      baseName = baseName.replace(ymdMatch[0], "");
      dateFound = true;
    }

    // Pattern 2: DD-MM-YYYY or DD_MM_YYYY or DD/MM/YYYY or DD.MM.YYYY
    if (!dateFound) {
      const dmyRegex = /\b(0[1-9]|[12][0-9]|3[01])[-_/\.](0[1-9]|1[0-2])[-_/\.](20[0-9]{2})\b/;
      const dmyMatch = baseName.match(dmyRegex);
      if (dmyMatch) {
        extractedDate = `${dmyMatch[3]}-${dmyMatch[2]}-${dmyMatch[1]}`;
        baseName = baseName.replace(dmyMatch[0], "");
        dateFound = true;
      }
    }

    // Pattern 3: YYYYMMDD (compact numerical format like 20240415)
    if (!dateFound) {
      const compactYmdRegex = /\b(20[0-9]{2})(0[1-9]|1[0-2])(0[1-9]|[12][0-9]|3[01])\b/;
      const compactYmdMatch = baseName.match(compactYmdRegex);
      if (compactYmdMatch) {
        extractedDate = `${compactYmdMatch[1]}-${compactYmdMatch[2]}-${compactYmdMatch[3]}`;
        baseName = baseName.replace(compactYmdMatch[0], "");
        dateFound = true;
      }
    }

    // Cleanup prefix "SOP", "SOPs", "SOP_", etc.
    baseName = baseName.replace(/\bSOPs?\b/gi, "");
    
    // Replace typical separation characters with spaces
    baseName = baseName.replace(/[-_+\.]/g, " ");

    // Eradicate double spaces and trim edges
    baseName = baseName.replace(/\s+/g, " ").trim();

    if (!baseName) {
      baseName = "Untitled SOP Document";
    } else {
      // Prettify string with Title Case
      baseName = baseName
        .split(" ")
        .map(word => {
          if (!word) return "";
          // Keep common property-level shorthand fully capitalized
          if (word === word.toUpperCase() && word.length > 1 && word.length <= 4) {
            return word;
          }
          return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
        })
        .join(" ");
    }

    return {
      title: baseName,
      date: extractedDate
    };
  };

  // ZIP Extractor Engine using JSZip
  const processZipFile = async (file: File) => {
    setLoading(true);
    setErrorMsg(null);
    setParsedItems([]);

    try {
      const zip = new JSZip();
      const loadedZip = await zip.loadAsync(file);
      
      const filePromises: Promise<ParsedSopItem | null>[] = [];

      loadedZip.forEach((relativePath, zipEntry) => {
        // Skip directories and system metadata (like macOS resource forks)
        if (
          zipEntry.dir || 
          relativePath.startsWith("__MACOSX") || 
          !relativePath.toLowerCase().endsWith(".pdf") ||
          relativePath.split("/").some(part => part.startsWith("."))
        ) {
          return;
        }

        const prom = async (): Promise<ParsedSopItem | null> => {
          try {
            // Get content as base64
            const base64Content = await zipEntry.async("base64");
            const dataUrl = `data:application/pdf;base64,${base64Content}`;
            
            // Auto extract Title and Date
            const parsed = parseFilename(relativePath);

            return {
              id: `${relativePath}-${Date.now()}-${Math.random().toString(36).substring(4)}`,
              originalName: relativePath,
              title: parsed.title,
              date: parsed.date,
              base64Data: dataUrl,
              selected: true,
              isValid: true
            };
          } catch (e) {
            console.error(`Error parsing file ${relativePath} inside zip:`, e);
            return null;
          }
        };

        filePromises.push(prom());
      });

      const results = await Promise.all(filePromises);
      const filteredResults = results.filter((item): item is ParsedSopItem => item !== null);

      if (filteredResults.length === 0) {
        setErrorMsg("No valid .pdf files were found inside this ZIP archive. Check your directories and file formats.");
      } else {
        setParsedItems(filteredResults);
        setSelectAll(true);
      }
    } catch (err: any) {
      console.error("ZIP Processing Error:", err);
      setErrorMsg(`Failed to open or decode ZIP folder: ${err?.message || err}`);
    } finally {
      setLoading(false);
    }
  };

  // Submit and trigger bulk insertion
  const handleConfirmImport = () => {
    const selectedItems = parsedItems.filter(item => item.selected);
    if (selectedItems.length === 0) {
      alert("Please select at least one SOP to import.");
      return;
    }

    const compiledSops = selectedItems.map(item => ({
      title: item.title,
      url: item.base64Data,
      date: item.date
    }));

    onImport(compiledSops);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative w-full max-w-4xl bg-white shadow-2xl border-t-8 border-gold flex flex-col max-h-[85vh] overflow-hidden"
          id="sop-batch-process-modal"
        >
          {/* Header */}
          <div className="flex justify-between items-start p-6 border-b border-slate-100 bg-slate-50/50">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <FolderArchive className="text-gold" size={20} />
                <h3 className="text-xl font-serif text-slate-900 italic font-bold">
                  SOP ZIP Batch Processing
                </h3>
              </div>
              <p className="text-[10px] font-display uppercase tracking-widest text-slate-500 font-bold">
                Extracting and organizing standard operating procedures
              </p>
            </div>
            <button 
              onClick={onClose} 
              className="text-slate-400 hover:text-slate-900 transition-colors cursor-pointer"
            >
              <X size={20} />
            </button>
          </div>

          {/* Body Content */}
          <div className="flex-1 overflow-y-auto p-6 min-h-[300px]">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-24 gap-4">
                <Loader2 className="animate-spin text-gold" size={40} />
                <div className="text-center">
                  <p className="text-xs font-display uppercase tracking-widest text-slate-800 font-bold">
                    Analyzing ZIP Archive File...
                  </p>
                  <p className="text-[11px] text-slate-400 font-serif italic mt-1">
                    Expanding file paths, verifying headers, and auto-extracting metadata
                  </p>
                </div>
              </div>
            ) : errorMsg ? (
              <div className="flex flex-col items-center justify-center py-16 text-center max-w-md mx-auto">
                <AlertCircle className="text-red-500 mb-4" size={48} />
                <h4 className="text-sm font-display uppercase tracking-widest font-black text-slate-800">
                  Batch Extraction Failed
                </h4>
                <p className="text-xs text-slate-500 italic font-serif mt-2 mb-6">
                  {errorMsg}
                </p>
                <button
                  onClick={onClose}
                  className="px-6 py-2.5 bg-slate-800 text-white text-[10px] font-display uppercase tracking-widest font-bold hover:bg-gold transition-colors"
                >
                  Close & Try Again
                </button>
              </div>
            ) : (
              <div>
                {/* Meta Summary and Select All Toolbar */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-100">
                  <div className="text-left">
                    <p className="text-xs text-slate-600 font-serif italic">
                      Successfully parsed <span className="font-bold text-slate-900 font-sans">{parsedItems.length}</span> PDF documents.
                    </p>
                    <p className="text-[9px] font-display uppercase tracking-widest text-[#c5a02d] font-bold mt-0.5">
                      Check or edit parsed attributes before registering them in the system.
                    </p>
                  </div>

                  {parsedItems.length > 0 && (
                    <button
                      onClick={handleToggleSelectAll}
                      className="flex items-center gap-2 self-start md:self-auto px-3 py-1.5 border border-slate-200 text-slate-700 text-[10px] font-display uppercase tracking-widest font-bold hover:bg-slate-50 transition-colors"
                    >
                      {selectAll ? (
                        <>
                          <Square size={12} className="text-slate-400" /> Deselect All
                        </>
                      ) : (
                        <>
                          <CheckSquare size={12} className="text-[#c5a02d]" /> Select All
                        </>
                      )}
                    </button>
                  )}
                </div>

                {/* Grid Header labels */}
                {parsedItems.length > 0 && (
                  <div className="hidden md:grid grid-cols-12 gap-4 px-4 py-2 border-b border-slate-100 text-slate-400 text-[8px] font-display uppercase tracking-widest font-bold mb-3">
                    <div className="col-span-1 text-center">Import</div>
                    <div className="col-span-1 text-left">Format</div>
                    <div className="col-span-4 text-left">Parsed Title (Editable)</div>
                    <div className="col-span-3 text-left">Parsed Date (Editable)</div>
                    <div className="col-span-2 text-left">Original Filename</div>
                    <div className="col-span-1 text-center">Remove</div>
                  </div>
                )}

                {/* Items List */}
                <div className="space-y-3">
                  {parsedItems.map((item) => (
                    <div
                      key={item.id}
                      className={cn(
                        "grid grid-cols-1 md:grid-cols-12 gap-4 items-center p-4 border transition-all hover:bg-slate-50/50",
                        item.selected 
                          ? "border-[#c5a02d]/30 bg-gold/5" 
                          : "border-slate-100 bg-white"
                      )}
                    >
                      {/* Checkbox Trigger */}
                      <div className="col-span-1 flex justify-center">
                        <button
                          onClick={() => handleToggleSelectItem(item.id)}
                          className={cn(
                            "w-5 h-5 flex items-center justify-center border transition-all cursor-pointer",
                            item.selected 
                              ? "border-[#c5a02d] bg-[#c5a02d] text-white" 
                              : "border-slate-300 hover:border-[#c5a02d]"
                          )}
                        >
                          {item.selected && <Check size={14} strokeWidth={3} />}
                        </button>
                      </div>

                      {/* File Icon column */}
                      <div className="col-span-1 flex items-center gap-2 md:block text-left md:text-center">
                        <span className="text-[8px] md:hidden font-display uppercase font-bold text-slate-400">Format:</span>
                        <div className="w-8 h-10 bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-500 text-[8px] font-black uppercase rounded-sm relative shrink-0">
                          PDF
                        </div>
                      </div>

                      {/* Editable parsed title */}
                      <div className="col-span-4 text-left">
                        <div className="flex md:hidden items-center justify-between mb-1">
                          <span className="text-[8px] font-display uppercase font-bold text-slate-400">Parsed SOP Title:</span>
                          <span className="text-[7px] text-[#c5a02d] uppercase tracking-wider font-bold">Auto-parsed</span>
                        </div>
                        <div className="relative">
                          <input
                            type="text"
                            value={item.title}
                            onChange={(e) => handleUpdateTitle(item.id, e.target.value)}
                            className="w-full px-3 py-2 border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-gold font-sans bg-white"
                            placeholder="Enter Custom Title..."
                          />
                        </div>
                      </div>

                      {/* Editable Date */}
                      <div className="col-span-3 text-left">
                        <span className="text-[8px] md:hidden font-display uppercase font-bold text-slate-400 block mb-1">Effective Date:</span>
                        <div className="relative">
                          <Calendar 
                            size={12} 
                            className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" 
                          />
                          <input
                            type="date"
                            value={item.date}
                            onChange={(e) => handleUpdateDate(item.id, e.target.value)}
                            className="w-full pl-8 pr-3 py-2 border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-gold bg-white font-sans"
                          />
                        </div>
                      </div>

                      {/* Original Filename */}
                      <div className="col-span-2 text-left">
                        <span className="text-[8px] md:hidden font-display uppercase font-bold text-slate-400 block mb-0.5">Original File:</span>
                        <p className="text-[10px] text-slate-500 font-mono truncate max-w-full italic" title={item.originalName}>
                          {item.originalName}
                        </p>
                      </div>

                      {/* Delete item completely */}
                      <div className="col-span-1 flex justify-end md:justify-center">
                        <button
                          onClick={() => handleDeleteItem(item.id)}
                          className="p-1 text-slate-300 hover:text-red-500 transition-colors cursor-pointer"
                          title="Exclude document"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Footer Controls */}
          {parsedItems.length > 0 && !loading && (
            <div className="p-6 border-t border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-4">
              <span className="text-[10px] font-display uppercase tracking-widest text-slate-500 font-bold">
                Selected: <span className="text-slate-900 font-black">{parsedItems.filter(i => i.selected).length}</span> of {parsedItems.length} SOPs
              </span>
              <div className="flex gap-4">
                <button
                  onClick={onClose}
                  className="px-6 py-3 border border-slate-200 text-slate-700 text-[10px] font-display uppercase tracking-widest font-black transition-colors bg-white hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmImport}
                  className="px-8 py-3 bg-[#c5a02d] text-white text-[10px] font-display uppercase tracking-widest font-black hover:bg-luxury-black transition-all shadow-md cursor-pointer"
                >
                  Confirm Import ({parsedItems.filter(i => i.selected).length} SOPs)
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
