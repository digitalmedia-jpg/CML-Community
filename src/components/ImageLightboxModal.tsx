import React, { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  X, 
  ChevronLeft, 
  ChevronRight, 
  ZoomIn, 
  ZoomOut, 
  Maximize, 
  Move,
  Info
} from "lucide-react";

export interface LightboxImage {
  src: string;
  title: string;
  category: string;
}

interface ImageLightboxModalProps {
  isOpen: boolean;
  onClose: () => void;
  images: LightboxImage[];
  startIndex: number;
}

export function ImageLightboxModal({
  isOpen,
  onClose,
  images,
  startIndex = 0,
}: ImageLightboxModalProps) {
  const [currentIndex, setCurrentIndex] = useState(startIndex);
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  // Sync index when the modal opens with a specific photo
  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(startIndex);
      setScale(1);
      setPosition({ x: 0, y: 0 });
    }
  }, [isOpen, startIndex]);

  const handleNext = useCallback(() => {
    if (images.length === 0) return;
    setCurrentIndex((prev) => (prev + 1) % images.length);
    setScale(1);
    setPosition({ x: 0, y: 0 });
  }, [images.length]);

  const handlePrev = useCallback(() => {
    if (images.length === 0) return;
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
    setScale(1);
    setPosition({ x: 0, y: 0 });
  }, [images.length]);

  const handleZoomIn = () => {
    setScale((prev) => Math.min(prev + 0.5, 4));
  };

  const handleZoomOut = () => {
    setScale((prev) => {
      const nextScale = Math.max(prev - 0.5, 1);
      if (nextScale === 1) {
        setPosition({ x: 0, y: 0 });
      }
      return nextScale;
    });
  };

  const handleResetZoom = () => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  };

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === "Escape") {
        onClose();
      } else if (e.key === "ArrowRight") {
        handleNext();
      } else if (e.key === "ArrowLeft") {
        handlePrev();
      } else if (e.key === "+" || (e.key === "=" && e.shiftKey)) {
        handleZoomIn();
      } else if (e.key === "-") {
        handleZoomOut();
      } else if (e.key === "0") {
        handleResetZoom();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose, handleNext, handlePrev]);

  if (!isOpen || images.length === 0) return null;

  const activeImage = images[currentIndex];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[9999] flex flex-col bg-slate-950/95 backdrop-blur-md select-none"
        id="image-lightbox-wrapper"
        ref={containerRef}
      >
        {/* Top bar with image info and action controls */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-900/50 border-b border-white/5 backdrop-blur-sm z-20">
          <div className="flex flex-col">
            <span className="text-[10px] font-display font-black uppercase tracking-[0.3em] text-amber-500">
              {activeImage?.category || "Property View"}
            </span>
            <h3 className="text-sm font-serif italic text-white mt-0.5">
              {activeImage?.title || "Property & Amenity Presentation"}
            </h3>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono font-medium text-slate-400 bg-slate-800/80 px-2.5 py-1 rounded-sm mr-4">
              {currentIndex + 1} / {images.length}
            </span>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-full transition-colors cursor-pointer"
              title="Close (Esc)"
              id="lightbox-close-btn"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Central visual slider area */}
        <div className="relative flex-1 flex items-center justify-center overflow-hidden p-4">
          
          {/* Navigation - Left Arrow */}
          {images.length > 1 && (
            <button
              onClick={handlePrev}
              className="absolute left-6 z-30 p-3 bg-slate-900/60 hover:bg-slate-800/80 text-white rounded-full transition-all border border-white/5 active:scale-95 cursor-pointer shadow-lg hover:shadow-black/50"
              title="Previous"
              id="lightbox-prev-btn"
            >
              <ChevronLeft size={24} />
            </button>
          )}

          {/* Central image container with Framer Motion zoom & drag */}
          <div className="relative w-full h-full max-w-5xl max-h-[80vh] flex items-center justify-center overflow-hidden rounded-sm">
            <motion.div
              drag={scale > 1}
              dragMomentum={false}
              dragElastic={0.1}
              onDrag={(event, info) => {
                setPosition((prev) => ({
                  x: prev.x + info.delta.x,
                  y: prev.y + info.delta.y,
                }));
              }}
              style={{
                x: position.x,
                y: position.y,
                cursor: scale > 1 ? "grab" : "default",
              }}
              className="flex items-center justify-center"
              id="lightbox-drag-container"
            >
              <motion.img
                key={currentIndex}
                src={activeImage?.src}
                alt={activeImage?.title}
                animate={{ scale }}
                transition={{ type: "spring", stiffness: 350, damping: 30 }}
                className="max-w-full max-h-[75vh] object-contain shadow-2xl pointer-events-none select-none rounded border border-white/10"
              />
            </motion.div>
          </div>

          {/* Navigation - Right Arrow */}
          {images.length > 1 && (
            <button
              onClick={handleNext}
              className="absolute right-6 z-30 p-3 bg-slate-900/60 hover:bg-slate-800/80 text-white rounded-full transition-all border border-white/5 active:scale-95 cursor-pointer shadow-lg hover:shadow-black/50"
              title="Next"
              id="lightbox-next-btn"
            >
              <ChevronRight size={24} />
            </button>
          )}
        </div>

        {/* Floating Toolbar with zoom controls and instructional hint */}
        <div className="flex flex-col items-center gap-3 px-6 py-4 bg-slate-900/60 border-t border-white/5 backdrop-blur-sm z-20">
          <div className="flex items-center gap-3 bg-slate-950/80 px-4 py-2 border border-white/10">
            <button
              onClick={handleZoomOut}
              disabled={scale <= 1}
              className="p-1.5 text-slate-400 hover:text-white disabled:opacity-30 disabled:hover:text-slate-400 transition-colors cursor-pointer"
              title="Zoom Out (-)"
              id="lightbox-zoom-out"
            >
              <ZoomOut size={16} />
            </button>

            <div className="w-[1px] h-4 bg-white/10" />

            <span className="text-[10px] font-mono text-slate-300 font-bold min-w-[40px] text-center">
              {Math.round(scale * 100)}%
            </span>

            <div className="w-[1px] h-4 bg-white/10" />

            <button
              onClick={handleZoomIn}
              disabled={scale >= 4}
              className="p-1.5 text-slate-400 hover:text-white disabled:opacity-30 disabled:hover:text-slate-400 transition-colors cursor-pointer"
              title="Zoom In (+)"
              id="lightbox-zoom-in"
            >
              <ZoomIn size={16} />
            </button>

            <div className="w-[1px] h-4 bg-white/10" />

            <button
              onClick={handleResetZoom}
              className="p-1.5 text-slate-400 hover:text-white transition-colors cursor-pointer"
              title="Reset Zoom (0)"
              id="lightbox-zoom-reset"
            >
              <Maximize size={15} />
            </button>
          </div>

          <div className="flex items-center gap-2 text-[10px] text-slate-500 font-serif italic">
            <Info size={11} className="text-amber-500" />
            {scale > 1 ? (
              <span className="flex items-center gap-1">
                <Move size={11} className="animate-pulse text-amber-500" /> Drag to pan/view details or scroll to zoom.
              </span>
            ) : (
              <span>Click zoom or scroll to explore details. Use ← or → to navigate.</span>
            )}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
