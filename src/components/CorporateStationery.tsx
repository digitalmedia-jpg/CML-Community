import React, { useState, useRef } from "react";
import { 
  Printer, 
  Download, 
  RotateCcw, 
  Sparkles, 
  Check, 
  Edit3, 
  FileText, 
  MapPin, 
  FileImage, 
  Mail, 
  ChevronRight,
  Bookmark,
  Share2
} from "lucide-react";

// Local SVG implementation of the CML corporate monogram for modular self-containment
const CMLMonogramSVG: React.FC<{ 
  className?: string; 
  colorC?: string; 
  colorM?: string; 
  colorL?: string; 
}> = ({ 
  className = "w-16 h-12", 
  colorC = "#C5A02D", 
  colorM = "#1A1A1A", 
  colorL = "#C5A02D" 
}) => {
  return (
    <svg viewBox="0 0 140 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <path d="M48 20 C22 20 12 40 12 55 C12 70 20 90 48 90 C62 90 70 83 73 79 L73 67 C67 71 60 76 48 76 C33 76 27 64 27 55 C27 46 33 34 48 34 C59 34 66 39 72 44 L72 32 C68 27 60 20 48 20 Z" fill={colorC} />
      <path d="M50 28 L63 72 L76 28 H88 L96 82 H83 L79 46 L67 88 H59 L47 46 L43 82 H30 L38 28 H50 Z" fill={colorM} />
      <path d="M83 20 H96 V78 H120 V90 H83 V20 Z" fill={colorL} />
    </svg>
  );
};

export const CorporateStationery: React.FC = () => {
  const [stationeryType, setStationeryType] = useState<"notepad" | "envelope" | "banner">("notepad");
  
  // Notepad real-time states
  const [noteTitle, setNoteTitle] = useState("WEEKLY EXECUTIVE BRIEFING");
  const [noteContent, setNoteContent] = useState(
    "1. Ramada Suites Wailoaloa quality standards remain compliant.\n" +
    "2. Prepare lobby for the upcoming QA audit scheduled this Friday.\n" +
    "3. Review the corporate guest stationery and checklist distribution.\n" +
    "4. Ensure 100% compliance on the PM preventive maintenance routine."
  );

  // Envelope real-time states
  const [envelopeTo, setEnvelopeTo] = useState("Mr. Avishek Chandra");
  const [envelopeDept, setEnvelopeDept] = useState("Operations & Quality Management");
  const [envelopeReference, setEnvelopeReference] = useState("Q3 RAMADA QA REPORT DIRECTIVE");
  const [envelopeBody, setEnvelopeBody] = useState(
    "Please find enclosed the finalized CML Brand Standards Checklist, " +
    "updated maintenance schedules, and the official CML Corporate Stationery layout designs " +
    "for the Ramada Suites by Wyndham Wailoaloa Beach property."
  );

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handlePrint = () => {
    window.print();
    showToast("Opening print dialogue for corporate stationery...");
  };

  const handleDownloadTxt = () => {
    let text = "";
    let filename = "";
    
    if (stationeryType === "notepad") {
      text = `COVE MANAGEMENT LIMITED\r\nCORPORATE EXECUTIVE NOTEPAD\r\n\r\nTITLE: ${noteTitle}\r\nDATE: ${new Date().toLocaleDateString()}\r\n\r\n${noteContent}\r\n\r\nwww.cml.com.fj`;
      filename = `CML_Notepad_Note.txt`;
    } else if (stationeryType === "envelope") {
      text = `COVE MANAGEMENT LIMITED\r\nMEMO / ENVELOPE RECORD\r\n\r\nTO: ${envelopeTo}\r\nDEPT: ${envelopeDept}\r\nREF: ${envelopeReference}\r\nDATE: ${new Date().toLocaleDateString()}\r\n\r\nMESSAGE:\r\n${envelopeBody}\r\n\r\nLot 14 Wasawasa Road, Wailoaloa Fiji\r\nwww.cml.com.fj`;
      filename = `CML_Envelope_Memo.txt`;
    } else {
      text = `COVE MANAGEMENT LIMITED - GROUP BRANDS BANNER REPORT\r\nProperties: Ramada Suites, Wyndham Garden, Days Inn\r\nQA status: 100% Certified Brand Standards`;
      filename = `CML_Brand_Banner_Info.txt`;
    }

    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast("Downloaded text record successfully!");
  };

  const handleReset = () => {
    if (stationeryType === "notepad") {
      setNoteTitle("WEEKLY EXECUTIVE BRIEFING");
      setNoteContent(
        "1. Ramada Suites Wailoaloa quality standards remain compliant.\n" +
        "2. Prepare lobby for the upcoming QA audit scheduled this Friday.\n" +
        "3. Review the corporate guest stationery and checklist distribution.\n" +
        "4. Ensure 100% compliance on the PM preventive maintenance routine."
      );
    } else if (stationeryType === "envelope") {
      setEnvelopeTo("Mr. Avishek Chandra");
      setEnvelopeDept("Operations & Quality Management");
      setEnvelopeReference("Q3 RAMADA QA REPORT DIRECTIVE");
      setEnvelopeBody(
        "Please find enclosed the finalized CML Brand Standards Checklist, " +
        "updated maintenance schedules, and the official CML Corporate Stationery layout designs " +
        "for the Ramada Suites by Wyndham Wailoaloa Beach property."
      );
    }
    showToast("Stationery templates reset to standard defaults.");
  };

  return (
    <div className="space-y-8 font-sans">
      
      {/* Toast Alert Banner */}
      {toastMessage && (
        <div className="fixed top-6 right-6 z-50 px-5 py-3 shadow-2xl flex items-center gap-3 border font-display text-[10px] tracking-widest uppercase font-extrabold bg-stone-950 border-gold/40 text-emerald-400">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          {toastMessage}
        </div>
      )}

      {/* Header Panel */}
      <div className="bg-white border border-slate-100 p-8 rounded-sm shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-gold">
            <Sparkles size={16} />
            <span className="text-[10px] font-display uppercase tracking-[0.25em] font-black">Corporate Identity Assets</span>
          </div>
          <h3 className="text-2xl font-serif italic text-slate-900">Ramada & CML Stationery Standards</h3>
          <p className="text-xs text-slate-500 max-w-2xl leading-relaxed">
            The official corporate stationery, executive notepad, envelope, and group brand visual standards. 
            Select an asset type to view, interact with, edit, and print or download high-fidelity brand templates.
          </p>
        </div>

        {/* Toolbar Controls */}
        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <button 
            onClick={handleReset}
            className="flex items-center gap-2 px-4 py-2.5 border border-slate-200 text-slate-600 hover:text-slate-900 text-[10px] font-display uppercase tracking-widest font-black transition-all bg-slate-50 hover:bg-slate-100"
          >
            <RotateCcw size={12} /> Reset Standard
          </button>
          <button 
            onClick={handleDownloadTxt}
            className="flex items-center gap-2 px-4 py-2.5 border border-slate-200 text-slate-600 hover:text-slate-900 text-[10px] font-display uppercase tracking-widest font-black transition-all bg-white hover:bg-slate-50"
          >
            <Download size={12} /> Download Record
          </button>
          <button 
            onClick={handlePrint}
            className="flex items-center gap-2 px-5 py-2.5 bg-gold text-white text-[10px] font-display uppercase tracking-widest font-black transition-all hover:bg-luxury-black hover:border-luxury-black"
          >
            <Printer size={12} /> Print Asset
          </button>
        </div>
      </div>

      {/* Asset Switcher Tabs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[
          { id: "notepad", label: "Executive Lined Notepad", icon: FileText, desc: "Portrait writing pad & rules" },
          { id: "envelope", label: "Corporate Envelope / Letterhead", icon: Mail, desc: "Landscape corporate envelope layout" },
          { id: "banner", label: "Group Brand Identity Banner", icon: FileImage, desc: "CML brand family & tourism awards banner" }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setStationeryType(tab.id as any)}
            className={`p-5 flex flex-col items-start gap-2 border text-left rounded-sm transition-all duration-300 ${
              stationeryType === tab.id 
                ? "bg-luxury-black text-white border-gold/40 shadow-md ring-1 ring-gold/25" 
                : "bg-white text-slate-700 border-slate-100 hover:border-slate-200 hover:bg-slate-50/50"
            }`}
          >
            <div className="flex items-center justify-between w-full">
              <tab.icon className={stationeryType === tab.id ? "text-gold animate-pulse-subtle" : "text-slate-400"} size={18} />
              {stationeryType === tab.id && <span className="text-[7px] font-mono text-gold border border-gold/30 px-1 rounded">ACTIVE</span>}
            </div>
            <div className="mt-2">
              <span className="block text-[10.5px] font-display uppercase tracking-widest font-bold leading-none">{tab.label}</span>
              <span className={`block text-[10px] italic mt-1 leading-none ${stationeryType === tab.id ? "text-slate-400" : "text-slate-400"}`}>{tab.desc}</span>
            </div>
          </button>
        ))}
      </div>

      {/* Main Preview Workbench */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Workspace Controls Side Panel (Left 4 cols) */}
        <div className="lg:col-span-4 bg-white border border-slate-100 p-6 rounded-sm space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h4 className="text-[11px] font-display uppercase tracking-widest font-black text-slate-900">Design Tool Parameters</h4>
            <p className="text-[10px] text-slate-400 italic">Customize copy parameters directly to preview layout adjustments in real-time.</p>
          </div>

          {stationeryType === "notepad" && (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[9px] font-display uppercase tracking-widest font-bold text-slate-500 block">Notepad Header Title</label>
                <input 
                  type="text" 
                  value={noteTitle} 
                  onChange={(e) => setNoteTitle(e.target.value.toUpperCase())}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded bg-slate-50 text-slate-800 font-mono"
                  placeholder="NOTEPAD HEADER"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[9px] font-display uppercase tracking-widest font-bold text-slate-500 block">Notepad Ruled Lines Content</label>
                <textarea 
                  rows={8}
                  value={noteContent} 
                  onChange={(e) => setNoteContent(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded bg-slate-50 text-slate-800 font-mono leading-relaxed"
                  placeholder="Type notes line-by-line..."
                />
              </div>

              <div className="p-4 bg-amber-50/50 border border-amber-500/10 text-stone-600 rounded text-[11px] space-y-2">
                <span className="font-bold text-amber-700 uppercase font-display text-[9px] block">CML NOTEPAD Brand Guidelines</span>
                <p className="italic leading-relaxed">
                  Ruled lines are calibrated at exactly 28px vertical line height. Text styling defaults to a high-end mono typeface to preserve handwritten grid layout standards. Watermarks occupy the lower right margin quadrant.
                </p>
              </div>
            </div>
          )}

          {stationeryType === "envelope" && (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[9px] font-display uppercase tracking-widest font-bold text-slate-500 block">Recipient Addressee</label>
                <input 
                  type="text" 
                  value={envelopeTo} 
                  onChange={(e) => setEnvelopeTo(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded bg-slate-50 text-slate-800 font-sans"
                  placeholder="Recipient Name"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[9px] font-display uppercase tracking-widest font-bold text-slate-500 block">Department / Role</label>
                <input 
                  type="text" 
                  value={envelopeDept} 
                  onChange={(e) => setEnvelopeDept(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded bg-slate-50 text-slate-800 font-sans"
                  placeholder="Department Name"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[9px] font-display uppercase tracking-widest font-bold text-slate-500 block">Corporate Memo Reference</label>
                <input 
                  type="text" 
                  value={envelopeReference} 
                  onChange={(e) => setEnvelopeReference(e.target.value.toUpperCase())}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded bg-slate-50 text-slate-800 font-mono text-[10px]"
                  placeholder="REFERENCE MEMO"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[9px] font-display uppercase tracking-widest font-bold text-slate-500 block">Memo Message Body</label>
                <textarea 
                  rows={6}
                  value={envelopeBody} 
                  onChange={(e) => setEnvelopeBody(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded bg-slate-50 text-slate-800 font-sans leading-relaxed"
                  placeholder="Type letter contents here..."
                />
              </div>
            </div>
          )}

          {stationeryType === "banner" && (
            <div className="space-y-4">
              <div className="p-4 bg-slate-50 border border-slate-100 text-slate-600 rounded text-[11px] space-y-4">
                <div>
                  <span className="font-bold text-slate-800 uppercase font-display text-[9px] block">BANNER PURPOSE</span>
                  <p className="italic leading-relaxed mt-1">
                    This horizontal billboard design bridges Cove Management Group's corporate governance with the resort brand properties at Wailoaloa Beach (Nadi) and Martintar, showcasing outstanding regional hospitality certifications.
                  </p>
                </div>

                <div className="border-t border-slate-200 pt-3">
                  <span className="font-bold text-slate-800 uppercase font-display text-[9px] block">ASSOCIATED BRANDS</span>
                  <ul className="list-disc pl-4 space-y-1.5 mt-2 text-slate-500">
                    <li>Ramada Suites by Wyndham</li>
                    <li>Wyndham Garden Beach Resort</li>
                    <li>Days Inn by Wyndham</li>
                    <li>Wyndham Rewards Program</li>
                    <li>Island Connections Fiji</li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Live Visual Board (Right 8 cols) */}
        <div className="lg:col-span-8 flex flex-col items-center">
          
          <div className="w-full border-b border-slate-100 pb-3 mb-6 flex justify-between items-center">
            <span className="text-[9px] font-display uppercase tracking-widest text-slate-400 font-black">Interactive Canvas Preview</span>
            <span className="text-[9px] font-mono text-gold font-bold">Wysiwyg Active</span>
          </div>

          {/* Render Notepad */}
          {stationeryType === "notepad" && (
            <div 
              id="cml-stationery-notepad"
              className="bg-[#FAF6EE] border border-stone-200 w-full max-w-lg aspect-[1/1.414] shadow-2xl rounded-sm p-8 flex flex-col relative overflow-hidden text-stone-800"
              style={{ contentVisibility: "auto" }}
            >
              {/* Header block with Logo and golden accents */}
              <div className="flex items-center justify-between border-b border-stone-200 pb-4 shrink-0">
                <div className="flex items-center gap-3">
                  <CMLMonogramSVG className="w-14 h-10 shrink-0" colorC="#C5A02D" colorM="#1A1A1A" colorL="#C5A02D" />
                  <div className="h-8 w-px bg-[#C5A02D]/40" />
                  <div className="flex flex-col text-left">
                    <span className="text-[13px] font-sans font-black tracking-[0.1em] text-stone-900 leading-none">COVE MANAGEMENT</span>
                    <div className="flex items-center gap-1.5 my-1">
                      <div className="h-px w-6 bg-[#C5A02D]" />
                      <span className="text-[8px] font-sans font-black tracking-widest text-[#C5A02D] leading-none">LIMITED</span>
                      <div className="h-px w-6 bg-[#C5A02D]" />
                    </div>
                    <span className="text-[8px] font-sans font-bold tracking-widest text-stone-500 leading-none uppercase">Hotels • Resorts • Vacations</span>
                  </div>
                </div>
                
                {/* Date indicator */}
                <div className="text-right flex flex-col">
                  <span className="text-[7px] font-display uppercase tracking-widest text-stone-400">Date Logged</span>
                  <span className="text-[10px] font-mono font-medium text-stone-700">{new Date().toLocaleDateString()}</span>
                </div>
              </div>

              {/* Bold golden divider line */}
              <div className="h-1 bg-[#C5A02D] w-full mt-2 shrink-0" />

              {/* Editable Title block */}
              <div className="mt-6 mb-2 shrink-0">
                <input 
                  type="text" 
                  value={noteTitle} 
                  onChange={(e) => setNoteTitle(e.target.value.toUpperCase())}
                  className="w-full bg-transparent border-none text-center font-serif text-lg tracking-wide text-stone-900 focus:outline-none font-bold"
                />
                <div className="w-12 h-0.5 bg-stone-300 mx-auto mt-1" />
              </div>

              {/* Notepad Ruled Content Area */}
              <div className="flex-1 mt-6 relative" style={{ minHeight: "280px" }}>
                {/* Lined Grid Overlay Background */}
                <div 
                  className="absolute inset-0 pointer-events-none" 
                  style={{
                    backgroundImage: "linear-gradient(#C5A02D 1px, transparent 1px)",
                    backgroundSize: "100% 28px",
                    opacity: 0.18
                  }}
                />

                {/* Real-time editable Textarea matching exactly the line height */}
                <textarea
                  value={noteContent}
                  onChange={(e) => setNoteContent(e.target.value)}
                  spellCheck="false"
                  className="w-full h-full bg-transparent border-none resize-none focus:outline-none font-mono text-[13px] text-stone-800 leading-[28px] py-1.5 relative z-10 select-text"
                  style={{
                    lineHeight: "28px",
                    paddingTop: "1px",
                    fontFamily: "'JetBrains Mono', Courier, monospace"
                  }}
                  placeholder="Begin drafting notes directly onto executive stationery lines..."
                />

                {/* Huge, faint background CML Monogram watermark */}
                <div className="absolute bottom-4 right-2 opacity-[0.04] pointer-events-none z-0">
                  <CMLMonogramSVG className="w-64 h-48" colorC="#C5A02D" colorM="#1A1A1A" colorL="#C5A02D" />
                </div>
              </div>

              {/* Notepad Footer standard */}
              <div className="border-t border-stone-200 pt-4 mt-4 flex justify-between items-end shrink-0">
                <div className="flex items-center gap-1.5 text-stone-500">
                  <MapPin size={10} className="text-[#C5A02D]" />
                  <span className="text-[8px] font-sans font-medium tracking-wide">Wailoaloa Beach Resort Complex</span>
                </div>
                <div className="text-center">
                  <span className="text-[10px] font-display uppercase tracking-[0.25em] font-black text-stone-700">www.cml.com.fj</span>
                </div>
                <div className="text-right">
                  <span className="text-[7px] font-mono text-stone-400">Notepad ID: CML-EXE-01</span>
                </div>
              </div>

            </div>
          )}

          {/* Render Envelope / Letterhead */}
          {stationeryType === "envelope" && (
            <div 
              id="cml-stationery-envelope"
              className="bg-[#FAF6EE] border border-stone-200 w-full aspect-[1.7/1] shadow-2xl rounded-sm p-8 flex flex-col justify-between relative overflow-hidden text-stone-800"
              style={{ contentVisibility: "auto" }}
            >
              {/* Envelope Header Block */}
              <div className="flex items-start justify-between shrink-0">
                <div className="flex items-center gap-3">
                  <CMLMonogramSVG className="w-12 h-9 shrink-0" colorC="#C5A02D" colorM="#1A1A1A" colorL="#C5A02D" />
                  <div className="h-7 w-px bg-[#C5A02D]/40" />
                  <div className="flex flex-col text-left">
                    <span className="text-[11px] font-sans font-black tracking-[0.1em] text-stone-900 leading-none">COVE MANAGEMENT</span>
                    <div className="flex items-center gap-1.5 my-0.5">
                      <div className="h-px w-5 bg-[#C5A02D]" />
                      <span className="text-[7.5px] font-sans font-black tracking-widest text-[#C5A02D] leading-none">LIMITED</span>
                      <div className="h-px w-5 bg-[#C5A02D]" />
                    </div>
                    <span className="text-[7.5px] font-sans font-bold tracking-widest text-stone-400 leading-none uppercase">Hotels • Resorts • Vacations</span>
                  </div>
                </div>

                {/* Stamp Indicator block */}
                <div className="w-12 h-14 border border-dashed border-[#C5A02D]/40 flex flex-col items-center justify-center p-1 rounded-sm text-stone-400 bg-stone-50/50">
                  <span className="text-[6px] font-mono leading-none block uppercase font-bold text-center">Corporate</span>
                  <span className="text-[6px] font-mono leading-none block uppercase font-bold text-center mt-1 text-[#C5A02D]">Seal</span>
                </div>
              </div>

              {/* Envelope Center Address Fields */}
              <div className="my-2 relative z-10 max-w-md mx-auto w-full bg-white/40 backdrop-blur-xs border border-stone-200/50 p-4 rounded-sm flex flex-col gap-2">
                <div className="flex gap-2 text-xs">
                  <span className="w-14 font-mono text-[9px] font-bold text-[#C5A02D] uppercase tracking-wider py-1 shrink-0">Recipient:</span>
                  <input 
                    type="text" 
                    value={envelopeTo} 
                    onChange={(e) => setEnvelopeTo(e.target.value)}
                    className="flex-1 bg-transparent border-none font-bold text-stone-900 focus:outline-none"
                    placeholder="Recipient Name"
                  />
                </div>
                <div className="flex gap-2 text-xs">
                  <span className="w-14 font-mono text-[9px] font-bold text-stone-400 uppercase tracking-wider py-1 shrink-0">Dept:</span>
                  <input 
                    type="text" 
                    value={envelopeDept} 
                    onChange={(e) => setEnvelopeDept(e.target.value)}
                    className="flex-1 bg-transparent border-none text-stone-600 focus:outline-none text-[11px]"
                    placeholder="Department Name"
                  />
                </div>
                <div className="flex gap-2 text-xs border-t border-dashed border-stone-200 pt-2 mt-1">
                  <span className="w-14 font-mono text-[9px] font-bold text-[#C5A02D] uppercase tracking-wider py-1 shrink-0">Subject:</span>
                  <input 
                    type="text" 
                    value={envelopeReference} 
                    onChange={(e) => setEnvelopeReference(e.target.value.toUpperCase())}
                    className="flex-1 bg-transparent border-none text-[10.5px] font-mono text-stone-800 font-semibold focus:outline-none"
                    placeholder="MEMO TITLE REFERENCE"
                  />
                </div>
                <div className="text-xs text-stone-600 italic leading-relaxed pt-1 select-text">
                  <textarea
                    value={envelopeBody}
                    onChange={(e) => setEnvelopeBody(e.target.value)}
                    rows={3}
                    spellCheck="false"
                    className="w-full bg-transparent border-none resize-none focus:outline-none text-[11px] leading-relaxed"
                    placeholder="Write correspondence memo lines..."
                  />
                </div>
              </div>

              {/* Envelope Footer coordinates */}
              <div className="flex items-end justify-between border-t border-stone-200/60 pt-3 shrink-0">
                <div className="flex items-start gap-1.5 text-stone-500 text-left">
                  <MapPin size={11} className="text-[#C5A02D] shrink-0 mt-0.5" />
                  <div className="flex flex-col leading-none">
                    <span className="text-[8px] font-sans font-black tracking-wide text-stone-800">Lot 14 Wasawasa Road</span>
                    <span className="text-[7.5px] font-sans font-bold text-stone-400 mt-0.5">Wailoaloa Beach, Nadi, Fiji</span>
                  </div>
                </div>

                <span className="text-[9px] font-display uppercase tracking-[0.25em] font-black text-stone-600">www.cml.com.fj</span>
              </div>

              {/* Big Watermark on Right */}
              <div className="absolute bottom-6 right-6 opacity-[0.03] pointer-events-none z-0">
                <CMLMonogramSVG className="w-56 h-40" />
              </div>

            </div>
          )}

          {/* Render Group Brand Banner */}
          {stationeryType === "banner" && (
            <div 
              id="cml-corporate-brands-banner"
              className="w-full border border-stone-800 shadow-2xl rounded-sm flex flex-col md:flex-row relative overflow-hidden"
              style={{ 
                background: "linear-gradient(to right, #0F0F0E 0%, #171716 40%, #121211 100%)",
                contentVisibility: "auto"
              }}
            >
              {/* Left Column (Solid Black CML block - 1/3 width) */}
              <div className="w-full md:w-[28%] bg-[#080808] border-r border-stone-800/80 p-6 flex flex-col items-center justify-center text-center space-y-4">
                <CMLMonogramSVG className="w-20 h-16" colorC="#C5A02D" colorM="#FFFFFF" colorL="#C5A02D" />
                
                <div className="space-y-1">
                  <span className="text-[12px] font-sans font-black tracking-[0.15em] text-white block">COVE MANAGEMENT</span>
                  <div className="flex items-center justify-center gap-1.5">
                    <div className="h-px w-5 bg-[#C5A02D]" />
                    <span className="text-[9px] font-sans font-black tracking-widest text-[#C5A03D] block">LIMITED</span>
                    <div className="h-px w-5 bg-[#C5A02D]" />
                  </div>
                  <span className="text-[7.5px] font-sans font-bold tracking-widest text-stone-400 block pt-0.5 uppercase">Hotels • Resorts • Vacations</span>
                </div>

                <div className="w-14 h-px bg-[#C5A02D]/45" />

                <div className="space-y-0.5">
                  <span className="text-[9.5px] font-serif italic text-stone-300 block">"Your Investment, Our Commitment"</span>
                </div>
              </div>

              {/* Right Column (Wailoaloa brands showcase - 2/3 width) */}
              <div className="flex-1 p-6 flex flex-col justify-between space-y-6">
                
                {/* Brand Showcase Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 items-center justify-center pt-2">
                  
                  {/* Ramada */}
                  <div className="flex flex-col items-center justify-center text-center py-2 border-r border-stone-800/50">
                    <span className="text-sm font-serif font-black text-white tracking-widest leading-none block">RAMADA</span>
                    <span className="text-[5.5px] font-mono tracking-widest text-stone-400 block mt-1 uppercase">Suites by Wyndham</span>
                    <span className="text-[5px] font-sans font-bold tracking-wider text-[#C5A02D] block uppercase">Wailoaloa Beach Fiji</span>
                  </div>

                  {/* Wyndham Garden */}
                  <div className="flex flex-col items-center justify-center text-center py-2 border-r border-stone-800/50">
                    <span className="text-xs font-sans font-black text-white tracking-[0.12em] leading-none block uppercase">Wyndham Garden</span>
                    <span className="text-[5px] font-sans font-bold tracking-widest text-[#C5A02D] block mt-1.5 uppercase">Wailoaloa Beach Fiji</span>
                  </div>

                  {/* Days Inn */}
                  <div className="flex flex-col items-center justify-center text-center py-2 border-r border-stone-800/50">
                    <div className="flex items-center gap-0.5 justify-center">
                      <span className="text-sm font-serif font-bold text-white italic tracking-tight leading-none block">Days Inn</span>
                      <span className="text-[5px] text-[#C5A02D] font-bold border border-[#C5A02D]/30 px-0.5 rounded">BY WYNDHAM</span>
                    </div>
                    <span className="text-[5px] font-sans font-bold tracking-widest text-stone-400 block mt-1.5 uppercase">Nadi, Fiji Islands</span>
                  </div>

                  {/* Wyndham Rewards */}
                  <div className="flex flex-col items-center justify-center text-center py-2">
                    <span className="text-xs font-sans font-black text-stone-200 tracking-[0.18em] block uppercase">Wyndham</span>
                    <span className="text-[7px] font-sans font-bold tracking-[0.25em] text-[#C5A02D] block mt-0.5 uppercase">Rewards</span>
                  </div>

                </div>

                {/* Subtitle dividing line */}
                <div className="flex items-center gap-4 text-center">
                  <div className="h-px bg-stone-800 flex-1" />
                  <span className="text-[7.5px] font-display uppercase tracking-[0.35em] text-[#C5A02D] font-black">CML WAILOALOA RESORT PORTFOLIO & EXCELLENCE AWARDS</span>
                  <div className="h-px bg-stone-800 flex-1" />
                </div>

                {/* Awards Badging Footer */}
                <div className="flex flex-wrap items-center justify-between gap-4 pt-1">
                  
                  {/* Island Connections Fiji */}
                  <div className="flex items-center gap-2">
                    {/* Stylized vector turtle logo */}
                    <svg viewBox="0 0 100 100" className="w-7 h-7 text-[#C5A02D]" fill="currentColor">
                      <path d="M50 15c-3.3 0-6 2.7-6 6 0 .8.2 1.5.5 2.1-4 1.3-6.5 4.9-6.5 9 0 1.4.3 2.8.9 4-3.4.6-5.9 3.5-5.9 7.1 0 .6.1 1.2.2 1.8-3 .6-5.2 3.1-5.2 6.2 0 1.7.7 3.3 1.9 4.4-.3 1-.5 2.1-.5 3.2 0 4.6 3.4 8.4 7.9 9.3l1 5.3c-1.3.5-2.2 1.8-2.2 3.3 0 2 1.6 3.6 3.6 3.6.8 0 1.5-.3 2.1-.8l5.3-2.6c1 .4 2 .6 3.1.6 4.8 0 8.7-3.6 9-8.3h.2c.3 4.7 4.2 8.3 9 8.3 1.1 0 2.1-.2 3.1-.6l5.3 2.6c.6.5 1.3.8 2.1.8 2 0 3.6-1.6 3.6-3.6 0-1.5-.9-2.8-2.2-3.3l1-5.3c4.5-.9 7.9-4.7 7.9-9.3 0-1.1-.2-2.2-.5-3.2 1.2-1.1 1.9-2.7 1.9-4.4 0-3.1-2.2-5.6-5.2-6.2.1-.6.2-1.2.2-1.8 0-3.6-2.5-6.5-5.9-7.1.6-1.2.9-2.6.9-4 0-4.1-2.5-7.7-6.5-9 .3-.6.5-1.3.5-2.1 0-3.3-2.7-6-6-6zm0 14c4.4 0 8 3.6 8 8s-3.6 8-8 8-8-3.6-8-8 3.6-8 8-8z" />
                    </svg>
                    <div className="flex flex-col text-left">
                      <span className="text-[10px] font-sans font-black text-white leading-none tracking-wide">ISLAND</span>
                      <span className="text-[7.5px] font-mono tracking-widest text-[#C5A03D] leading-none mt-0.5">CONNECTIONS FIJI</span>
                    </div>
                  </div>

                  {/* Award Badging */}
                  <div className="flex items-center gap-6">
                    
                    {/* TripAdvisor Laurel 1 */}
                    <div className="flex items-center gap-1.5 border border-stone-800/50 bg-stone-900/40 px-2 py-1 rounded-sm">
                      <div className="text-[5.5px] font-sans font-black text-[#C5A02D] leading-tight text-center uppercase tracking-wider">
                        Tripadvisor<br/><span className="text-white">Travelers'</span><br/>Choice 2024
                      </div>
                    </div>

                    {/* TripAdvisor Laurel 2 */}
                    <div className="flex items-center gap-1.5 border border-stone-800/50 bg-stone-900/40 px-2 py-1 rounded-sm">
                      <div className="text-[5.5px] font-sans font-black text-[#C5A02D] leading-tight text-center uppercase tracking-wider">
                        Tripadvisor<br/><span className="text-white">Travelers'</span><br/>Choice 2023
                      </div>
                    </div>

                    {/* Best of Ramada Badge */}
                    <div className="flex flex-col items-center justify-center bg-stone-900/75 border border-[#C5A02D]/40 px-2.5 py-1 rounded-xs">
                      <span className="text-[5px] font-mono tracking-widest text-[#C5A02D] leading-none uppercase">Best of</span>
                      <span className="text-[7.5px] font-serif font-black text-white leading-none mt-0.5">RAMADA</span>
                    </div>

                    {/* 100% Vaccinated Stamp */}
                    <div className="flex items-center gap-1 bg-stone-950 border border-emerald-500/20 px-2 py-1 rounded-full text-emerald-400">
                      <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-ping shrink-0" />
                      <span className="text-[6.5px] font-mono tracking-wider uppercase font-bold leading-none">100% Vaccinated Certified</span>
                    </div>

                  </div>

                </div>

              </div>
            </div>
          )}

        </div>

      </div>

    </div>
  );
};
