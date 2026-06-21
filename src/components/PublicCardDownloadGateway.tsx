import React, { useState, useEffect } from "react";
import { 
  Download, 
  FileText, 
  Loader2, 
  Phone, 
  Mail, 
  Globe, 
  MapPin, 
  Check, 
  AlertTriangle,
  Building,
  User,
  Sparkles,
  Share2,
  Camera
} from "lucide-react";
import { db, doc, getDoc } from "../lib/firebase";
import { StackedCMLLogo, CMLEmblem, generateVirtualCardImageAndDownload } from "./BrandKit";

interface PublicCardDownloadGatewayProps {
  cardId: string;
  companyId: string;
}

export const PublicCardDownloadGateway: React.FC<PublicCardDownloadGatewayProps> = ({ cardId, companyId }) => {
  const [card, setCard] = useState<any | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [downloadTriggered, setDownloadTriggered] = useState<boolean>(false);
  const [downloadSuccess, setDownloadSuccess] = useState<boolean>(false);
  const [galleryInstructionOpen, setGalleryInstructionOpen] = useState<boolean>(false);
  const [canShare, setCanShare] = useState<boolean>(false);
  const [isSharing, setIsSharing] = useState<boolean>(false);

  useEffect(() => {
    if (typeof navigator !== "undefined" && navigator.share) {
      setCanShare(true);
    }
  }, []);

  useEffect(() => {
    const fetchCardData = async () => {
      try {
        setLoading(true);
        setError(null);

        let cardData: any = null;

        // TIER 1: Fetch from Central Express Server-side memory registry first (Highly Reliable & Instant!)
        try {
          const res = await fetch(`/api/business-cards/${companyId}/${cardId}`);
          if (res.ok) {
            cardData = await res.json();
            console.log("Resolved card from central memory registry gateway:", cardData);
          }
        } catch (apiErr) {
          console.warn("Central card registry API fetch error:", apiErr);
        }

        // TIER 2: Fallback to Firestore with 2.5s Timeout Race (Avoids indefinite mobile hangs)
        if (!cardData && db) {
          try {
            const docRef = doc(db, `business-cards-${companyId}`, cardId);
            
            // Race the Firestore query against a 2.5s timeout promise
            const docSnapPromise = getDoc(docRef);
            const timeoutPromise = new Promise<null>((_, reject) => 
              setTimeout(() => reject(new Error("Database connection timeout")), 2500)
            );

            const docSnap = await Promise.race([docSnapPromise, timeoutPromise]) as any;
            if (docSnap && docSnap.exists()) {
              cardData = { id: docSnap.id, ...docSnap.data() };
            }
          } catch (fsErr) {
            console.warn("Firestore download query timeout or error:", fsErr);
          }
        }

        // Fallback: Check local storage direct if Mock wrapper failed to synchronize
        if (!cardData) {
          const storedMock = localStorage.getItem("cml_mock_db");
          if (storedMock) {
            const dbObj = JSON.parse(storedMock);
            const mockRecord = dbObj[`business-cards-${companyId}/${cardId}`];
            if (mockRecord) {
              cardData = mockRecord;
            }
          }
        }

        // Fallback: If it's a default pre-seeded card and not customized in DB, match by ID
        if (!cardData && cardId.startsWith("mock_")) {
          // Hardcoded lookups for CML, Ramada and Wyndham default records
          if (cardId === "mock_cml_1") {
            cardData = {
              id: "mock_cml_1",
              name: "Rohit Lal",
              title: "General Manager | Director",
              department: "Executive Board",
              phone: "+679 998 9499",
              email: "sales@cml.com.fj",
              website: "cml.com.fj",
              location: "Lot 14 Wasawasa Road, Wailoaloa Beach, Nadi, Fiji Islands",
              pages: []
            };
          } else if (cardId === "mock_cml_2") {
            cardData = {
              id: "mock_cml_2",
              name: "Charles Cebujano",
              title: "Digital Media Specialist",
              department: "Marketing & Design",
              phone: "+679 998 4676",
              email: "digitalmedia@cml.com.fj",
              website: "cml.com.fj",
              location: "Lot 14 Wasawasa Road, Wailoaloa Beach, Nadi, Fiji Islands",
              pages: ["https://cml.com.fj/wp-content/uploads/2026/06/Charles-Cebujano-CML.png"]
            };
          } else if (cardId === "mock_ramada_1") {
            cardData = {
              id: "mock_ramada_1",
              name: "Avishek Chandra",
              title: "Director of Operations",
              department: "Property Management & Operations",
              phone: "+679 672 5000",
              email: "operations@ramadasuitesfiji.com",
              website: "ramadasuitesfiji.com",
              location: "Lot 14 Wasawasa Road, Wailoaloa Beach, Nadi, Fiji Islands",
              pages: []
            };
          } else if (cardId === "mock_wyndham_1") {
            cardData = {
              id: "mock_wyndham_1",
              name: "Litia R.",
              title: "Guest Relations Lead Manager",
              department: "Guest Services",
              phone: "+679 675 0411",
              email: "litia.r@wyndhamfiji.com",
              website: "wyndhamfiji.com",
              location: "Denarau Island, Nadi, Fiji Islands",
              pages: []
            };
          }
        }

        if (cardData) {
          setCard(cardData);
          setLoading(false);
          
          // Trigger the auto-download after a short delay for premium feel
          setTimeout(() => {
            triggerFileDownload(cardData);
            
            // On mobile devices, automatically prompt with native share/Photos Gallery saving sheet
            if (typeof window !== "undefined" && typeof navigator !== "undefined" && /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)) {
              setTimeout(() => {
                shareToPhotoGallery();
              }, 1200);
            }
          }, 1500);
        } else {
          setError("The requested business card could not be found in CML private registers.");
          setLoading(false);
        }
      } catch (err) {
        console.error("Public gateway resolution error:", err);
        setError("Network connection failure. Please reload the gateway page.");
        setLoading(false);
      }
    };

    fetchCardData();
  }, [cardId, companyId]);

  const downloadSingleSource = (dataUrl: string, fileName: string) => {
    if (dataUrl.startsWith("data:")) {
      try {
        const arr = dataUrl.split(',');
        const mime = arr[0].match(/:(.*?);/)![1];
        const bstr = atob(arr[1]);
        let n = bstr.length;
        const u8arr = new Uint8Array(n);
        while (n--) {
          u8arr[n] = bstr.charCodeAt(n);
        }
        const blob = new Blob([u8arr], { type: mime });
        const blobUrl = URL.createObjectURL(blob);
        
        const link = document.createElement("a");
        link.href = blobUrl;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(blobUrl);
      } catch (err) {
        console.error("Direct base64 fallback download failed:", err);
        const link = document.createElement("a");
        link.href = dataUrl;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } else {
      // Force direct proxy download to bypass browser CORS blockages and save directly to iPhone and Android galleries!
      const proxyDownloadUrl = `/api/download-image?url=${encodeURIComponent(dataUrl)}&filename=${encodeURIComponent(fileName)}`;
      const link = document.createElement("a");
      link.href = proxyDownloadUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const triggerFileDownload = (targetCard: any) => {
    const pages = targetCard.pages || [];
    
    // If it's a seed or they didn't upload specific pages, generate high-fidelity replica
    if (pages.length === 0 && (!targetCard.pdfBase64 || !targetCard.pdfBase64.startsWith("data:image"))) {
      setDownloadTriggered(true);
      generateVirtualCardImageAndDownload(targetCard, companyId);
      setDownloadSuccess(true);
      return;
    }

    try {
      setDownloadTriggered(true);
      
      // ALWAYS prefer downloading separate pages as high-quality JPEG/PNG images (instead of raw PDF files)
      if (pages.length > 0) {
        if (pages.length === 1) {
          const page = pages[0];
          const ext = page.includes("png") ? "png" : "jpg";
          downloadSingleSource(page, `BusinessCard_${targetCard.name.replace(/\s+/g, "_")}.${ext}`);
          setDownloadSuccess(true);
          return;
        }

        pages.forEach((page, index) => {
          setTimeout(() => {
            const ext = page.includes("png") ? "png" : "jpg";
            const side = index === 0 ? "Front" : "Back";
            downloadSingleSource(page, `BusinessCard_${side}_${targetCard.name.replace(/\s+/g, "_")}.${ext}`);
          }, index * 600);
        });
        setDownloadSuccess(true);
        return;
      }

      // If no separate rendered pages are available but there is a raw PDF source
      if (targetCard.pdfBase64 && targetCard.pdfBase64.startsWith("data:application/pdf")) {
        downloadSingleSource(targetCard.pdfBase64, `BusinessCard_${targetCard.name.replace(/\s+/g, "_")}.pdf`);
        setDownloadSuccess(true);
        return;
      }
      
      // Fallback single source download
      const singleSource = targetCard.pdfBase64 || pages[0];
      if (singleSource) {
        const ext = singleSource.includes("png") ? "png" : singleSource.includes("pdf") ? "pdf" : "jpg";
        downloadSingleSource(singleSource, `BusinessCard_${targetCard.name.replace(/\s+/g, "_")}.${ext}`);
        setDownloadSuccess(true);
      }
    } catch (e) {
      console.error("File download error:", e);
      setDownloadSuccess(false);
    }
  };

  const forceDownload = () => {
    if (card) {
      triggerFileDownload(card);
      
      // On mobile layouts, additionally trigger the photo gallery saver sheet seamlessly
      if (typeof window !== "undefined" && typeof navigator !== "undefined" && /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)) {
        setTimeout(() => {
          shareToPhotoGallery();
        }, 800);
      }
    }
  };

  const downloadVCard = () => {
    if (!card) return;
    const vCardContent = [
      "BEGIN:VCARD",
      "VERSION:3.0",
      `N:${card.name.split(" ").reverse().join(";")}`,
      `FN:${card.name}`,
      `ORG:${companyId.toUpperCase() === "CML" ? "Cove Management Limited" : companyId.toUpperCase() + " Resort Suites"}`,
      `TITLE:${card.title}`,
      `TEL;TYPE=CELL,VOICE:${card.phone}`,
      `EMAIL;TYPE=PREF,INTERNET:${card.email}`,
      `URL:${card.website}`,
      `ADR;TYPE=WORK:;;${card.location}`,
      "REV:" + new Date().toISOString().replace(/[-:]/g, "").split(".")[0] + "Z",
      "END:VCARD"
    ].join("\r\n");

    const blob = new Blob([vCardContent], { type: "text/vcard;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${card.name.replace(/\s+/g, "_")}.vcf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const shareToPhotoGallery = async () => {
    if (!card) return;
    const pages = card.pages || [];
    
    // Check if sharing is natively supported, otherwise fallback to instruction modal/overlay immediately
    if (typeof navigator === "undefined" || !navigator.share) {
      setGalleryInstructionOpen(true);
      return;
    }

    try {
      setIsSharing(true);
      const filesToShare: File[] = [];

      if (pages.length > 0) {
        for (let i = 0; i < pages.length; i++) {
          const pageDataUrl = pages[i];
          if (!pageDataUrl) continue;
          
          let response: Response;
          try {
            // Check if page URL is external and route through our proxy to dodge CORS blockers!
            const targetUrl = pageDataUrl.startsWith("http") 
              ? `/api/download-image?url=${encodeURIComponent(pageDataUrl)}`
              : pageDataUrl;
            response = await fetch(targetUrl);
          } catch (fetchErr) {
            console.warn("Failed fetch in share, trying local split chunk fallback:", fetchErr);
            if (pageDataUrl.startsWith("data:")) {
              const arr = pageDataUrl.split(',');
              const mime = arr[0].match(/:(.*?);/)![1];
              const bstr = atob(arr[1]);
              let n = bstr.length;
              const u8arr = new Uint8Array(n);
              while (n--) {
                u8arr[n] = bstr.charCodeAt(n);
              }
              const blob = new Blob([u8arr], { type: mime });
              const side = i === 0 ? "Front" : "Back";
              const filename = pages.length === 1 ? `CML_${card.name.replace(/\s+/g, "_")}.${mime.split("/")[1] || "png"}` : `CML_${side}_${card.name.replace(/\s+/g, "_")}.${mime.split("/")[1] || "png"}`;
              filesToShare.push(new File([blob], filename, { type: mime }));
              continue;
            } else {
              continue;
            }
          }
          
          const blob = await response.blob();
          const ext = pageDataUrl.includes("png") ? "png" : "jpg";
          const side = i === 0 ? "Front" : "Back";
          const filename = pages.length === 1 ? `CML_${card.name.replace(/\s+/g, "_")}.${ext}` : `CML_${side}_${card.name.replace(/\s+/g, "_")}.${ext}`;
          filesToShare.push(new File([blob], filename, { type: blob.type }));
        }
      } else {
        const sourceDataUrl = card.pdfBase64 || "";
        if (sourceDataUrl && sourceDataUrl.startsWith("data:image")) {
          let response: Response;
          try {
            response = await fetch(sourceDataUrl);
          } catch {
            const arr = sourceDataUrl.split(',');
            const mime = arr[0].match(/:(.*?);/)![1];
            const bstr = atob(arr[1]);
            let n = bstr.length;
            const u8arr = new Uint8Array(n);
            while (n--) {
              u8arr[n] = bstr.charCodeAt(n);
            }
            const blob = new Blob([u8arr], { type: mime });
            const filename = `CML_${card.name.replace(/\s+/g, "_")}.${mime.split("/")[1] || "png"}`;
            filesToShare.push(new File([blob], filename, { type: mime }));
            response = new Response(blob); // dummy
          }
          const blob = await response.blob();
          const ext = sourceDataUrl.includes("png") ? "png" : "jpg";
          const filename = `CML_${card.name.replace(/\s+/g, "_")}.${ext}`;
          filesToShare.push(new File([blob], filename, { type: blob.type }));
        }
      }

      if (filesToShare.length > 0) {
        if (navigator.canShare && navigator.canShare({ files: filesToShare })) {
          await navigator.share({
            files: filesToShare,
            title: `${card.name} Business Card`,
            text: `Download digital business card for ${card.name} directly to your Photo Gallery.`
          });
        } else {
          // fallback string sharing
          await navigator.share({
            title: `${card.name} Business Card`,
            text: `Check out ${card.name}'s business card visual designs!`,
            url: window.location.href
          });
        }
      } else {
        setGalleryInstructionOpen(true);
      }
    } catch (err) {
      console.warn("Native share canceled or unsuccessful:", err);
      setGalleryInstructionOpen(true);
    } finally {
      setIsSharing(false);
    }
  };

  // Determine brand colors based on companyId
  const brandGold = "#C5A02D";
  const bgTheme = companyId === "ramada" ? "bg-red-950 text-white" : 
                  companyId === "wyndham" ? "bg-emerald-950 text-white" : 
                  "bg-[#131211] text-white";

  const buttonColor = companyId === "ramada" ? "bg-red-700 hover:bg-neutral-100 text-white hover:text-red-950" : 
                      companyId === "wyndham" ? "bg-emerald-700 hover:bg-neutral-100 text-white hover:text-emerald-950" : 
                      "bg-gold hover:bg-white text-stone-950";

  return (
    <div className={`min-h-screen ${bgTheme} flex flex-col items-center justify-center p-6 font-sans relative overflow-hidden`}>
      {/* Decorative ambient vector glows */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[radial-gradient(circle_at_center,rgba(197,160,45,0.08)_0%,transparent_60%)] pointer-events-none" />

      <div className="max-w-md w-full text-center relative z-10 bg-neutral-900/60 border border-white/5 p-8 rounded-sm shadow-2xl backdrop-blur-md">
        
        {/* Crest Logo Top */}
        <div className="flex flex-col items-center mb-6">
          <StackedCMLLogo darkTheme={true} className="scale-90 origin-center mb-2" />
          <div className="h-px w-24 bg-gold/35 mt-4" />
        </div>

        {loading ? (
          <div className="py-12 flex flex-col items-center justify-center space-y-4">
            <Loader2 size={36} className="text-gold animate-spin" />
            <p className="text-[10px] font-mono tracking-[0.2em] text-stone-400 uppercase">Resolving Private Registry Data...</p>
          </div>
        ) : error ? (
          <div className="py-10 text-center space-y-4">
            <div className="inline-flex p-3 bg-red-950/50 border border-red-800 text-red-400 rounded-full">
              <AlertTriangle size={24} />
            </div>
            <h3 className="text-base font-serif italic text-red-300">Could Not Found Card</h3>
            <p className="text-xs text-stone-400 font-serif italic max-w-xs mx-auto">
              {error}
            </p>
            <button 
              onClick={() => window.location.href = "/"}
              className="mt-4 px-5 py-2 border border-stone-800 hover:bg-stone-900 text-stone-300 text-[9px] font-display uppercase tracking-widest transition-colors"
            >
              Back to Portal
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            
            {/* Dynamic Status Title */}
            <div>
              <span className="text-[8px] font-display uppercase tracking-[0.43em] text-[#C5A02D] font-black block">Direct Access Gateway</span>
              <h2 className="text-xl font-serif text-white mt-1.5 leading-snug">
                {card.name}
              </h2>
              <p className="text-[10.5px] font-serif text-stone-400 italic mt-0.5">
                {card.title}
              </p>
            </div>

            {/* Visual Business Card Display */}
            <div className="w-full space-y-4">
              {card.pages && card.pages.length > 0 ? (
                <div className="flex flex-col gap-4 items-center">
                  {card.pages.map((page: string, idx: number) => (
                    <div key={idx} className="w-full max-w-[340px] aspect-[1.75/1] relative shadow-2xl rounded-none border border-stone-850 overflow-hidden shrink-0">
                      <span className="absolute top-2 left-2 text-[8px] font-mono tracking-widest uppercase bg-stone-950/80 px-2 py-0.5 text-gold z-10 border border-stone-800/60 select-none">
                        {idx === 0 ? "Front Side" : "Back Side"}
                      </span>
                      <img 
                        src={page} 
                        alt={`${card.name} Business Card Page ${idx + 1}`} 
                        className="w-full h-full object-fill block cursor-pointer transition-transform hover:scale-[1.01]"
                        referrerPolicy="no-referrer"
                        onClick={forceDownload}
                        title="Click to download business card image"
                      />
                    </div>
                  ))}
                  <p className="text-[9px] font-serif text-stone-400 italic leading-normal">
                    Tip: Tap on any card image above to download, or <span className="text-gold font-bold">long-press (tap & hold)</span> to save directly to Photos!
                  </p>
                </div>
              ) : (
                /* Elegant Front/Back Simulated Card Display for templates */
                <div className="flex flex-col gap-4 items-center">
                  <div 
                    className="w-full max-w-[340px] aspect-[1.75/1] relative shadow-2xl rounded-none border border-stone-850 overflow-hidden shrink-0 cursor-pointer transition-transform hover:scale-[1.01]"
                    onClick={forceDownload}
                    title="Click to generate and download business card image"
                  >
                    <span className="absolute top-2 left-2 text-[8px] font-mono tracking-widest uppercase bg-stone-950/80 px-2 py-0.5 text-gold z-10 border border-stone-800/60 select-none">
                      Front Side Template (Click to Download)
                    </span>
                    <div className="w-full h-full bg-[#FAF8F5] flex text-stone-950 relative p-4 box-border overflow-hidden select-none text-left">
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
                          {card.name}
                        </h4>
                        <p className="font-display font-bold italic text-[7px] text-[#C5A03D] tracking-wide mb-2 uppercase">
                          {card.title}
                        </p>
                        <div className="space-y-1 text-stone-800 text-[6px] font-mono leading-none">
                          <div className="flex items-center gap-1">
                            <span>☏</span>
                            <span>{card.phone}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <span>✉</span>
                            <span className="truncate max-w-[85px] block">{card.email}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <span>🌐</span>
                            <span>{card.website}</span>
                          </div>
                        </div>
                      </div>
                      <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-[#1A1A1A]"></div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Auto-Downloading Notice indicator */}
            <div className="bg-stone-950/80 border border-stone-850 p-4 font-display text-[9.5px] uppercase tracking-wide rounded-sm text-center">
              {!downloadTriggered ? (
                <div className="flex items-center justify-center gap-2 text-stone-400 animate-pulse">
                  <Loader2 size={13} className="animate-spin text-gold" />
                  <span>Preparing secure digital download...</span>
                </div>
              ) : downloadSuccess ? (
                <div className="flex items-center justify-center gap-2 text-emerald-400 font-extrabold">
                  <Check size={14} />
                  <span>Download program initiated!</span>
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2 text-gold animate-pulse">
                  <Sparkles size={11} />
                  <span>Initiating download... Check browser files</span>
                </div>
              )}
            </div>

            {/* Action controls */}
            <div className="flex flex-col gap-2 font-display text-[9px] uppercase tracking-widest font-black leading-none pt-2">
              
              <button
                onClick={forceDownload}
                className={`${buttonColor} w-full py-4.5 rounded-sm flex items-center justify-center gap-2 shadow-lg transition-transform hover:scale-[1.01]`}
              >
                <Download size={13} />
                <span>Download Business Card</span>
              </button>

              <button
                onClick={shareToPhotoGallery}
                className="bg-stone-900 border border-gold/40 hover:bg-[#C5A02D] hover:text-stone-950 text-gold w-full py-4.5 rounded-sm flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <Share2 size={13} />
                <span>Add / Save to Photo Gallery</span>
              </button>

              <button
                onClick={downloadVCard}
                className="bg-neutral-800 hover:bg-neutral-700 text-stone-200 w-full py-3.5 rounded-sm flex items-center justify-center gap-2 transition-colors border border-stone-800"
              >
                <FileText size={13} />
                <span>Download Contact (vCard.vcf)</span>
              </button>

            </div>

            <p className="text-[8px] text-stone-500 max-w-xs mx-auto text-center leading-normal pt-2 font-mono uppercase tracking-wide">
              Scan-to-Download Corporate Gateway &copy; 2026 Cove Management Ltd. All rights reserved. Registered Fiji Islands.
            </p>

          </div>
        )}

      </div>

      {/* Photo Gallery Guide Custom Overlay Modal */}
      {galleryInstructionOpen && (
        <div id="gallery-guide-modal" className="fixed inset-0 bg-black/95 z-55 flex items-center justify-center p-5 backdrop-blur-md transition-opacity">
          <div className="bg-[#121211] border border-gold/30 max-w-sm w-full p-6 text-center space-y-5 shadow-2xl relative">
            <div className="p-3 bg-stone-950 rounded-full border border-stone-850 text-gold w-fit mx-auto">
              <Camera size={26} />
            </div>
            <div className="space-y-1.5">
              <h3 className="font-display uppercase tracking-widest font-black text-[12.5px] text-white">
                Save to Photo Gallery
              </h3>
              <p className="text-[11px] text-stone-400 font-serif italic leading-relaxed">
                To save this corporate business card directly to your mobile's Photo Gallery/Photos app:
              </p>
            </div>
            <div className="bg-stone-950 p-4.5 border border-stone-850 text-left space-y-3 rounded-sm">
              <div className="flex items-start gap-2.5 text-[10.5px]">
                <span className="text-gold font-black">1.</span>
                <span className="text-stone-300">Scroll to the business card preview image shown on this page.</span>
              </div>
              <div className="flex items-start gap-2.5 text-[10.5px]">
                <span className="text-gold font-black">2.</span>
                <span className="text-stone-300">
                  <span className="font-black text-white uppercase tracking-wide">Press and Hold</span> (long-press) on the card image for 2 seconds.
                </span>
              </div>
              <div className="flex items-start gap-2.5 text-[10.5px]">
                <span className="text-gold font-black">3.</span>
                <span className="text-stone-300">
                  Select <span className="font-bold text-gold">"Save Image"</span> or <span className="font-bold text-gold">"Add to Photos"</span> in the menu sheet!
                </span>
              </div>
            </div>
            <button
              onClick={() => setGalleryInstructionOpen(false)}
              className="w-full bg-[#C5A02D] hover:bg-white text-stone-950 py-3 text-[10px] font-display uppercase font-black tracking-widest rounded-sm transition-colors cursor-pointer"
            >
              Understand & Save Card
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
