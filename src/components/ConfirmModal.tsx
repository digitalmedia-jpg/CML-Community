import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { Trash2, LucideIcon } from "lucide-react";

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  icon?: LucideIcon;
  variant?: "danger" | "warning" | "info";
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = "Acknowledge",
  cancelLabel = "Cancel",
  icon: Icon = Trash2,
  variant = "danger",
}) => {
  // Styles based on variant
  const iconBgColor = 
    variant === "danger" ? "bg-red-50 text-red-500 border border-red-100" :
    variant === "warning" ? "bg-amber-50 text-amber-600 border border-amber-100" :
    "bg-slate-50 text-slate-600 border border-slate-150";

  const confirmBtnColor = 
    variant === "danger" ? "bg-red-650 hover:bg-red-700 text-white" :
    variant === "warning" ? "bg-amber-600 hover:bg-amber-700 text-white" :
    "bg-gold hover:bg-gold-dark text-black font-black";

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-[2px]"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 15 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 15 }}
            transition={{ type: "spring", duration: 0.35, bounce: 0.15 }}
            className="relative bg-[#1A1A1E] border border-gold/15 max-w-sm w-full p-6 shadow-2xl flex flex-col gap-5 text-center items-center rounded-sm z-[101]"
          >
            {/* Action Icon */}
            <div className={`w-14 h-14 rounded-full flex items-center justify-center ${iconBgColor} shadow-md`}>
              <Icon size={24} />
            </div>

            {/* Title & Description */}
            <div className="space-y-2">
              <h3 className="font-serif italic text-lg text-gold-light tracking-wide">{title}</h3>
              <p className="text-xs text-slate-400 leading-relaxed font-serif italic">
                {description}
              </p>
            </div>

            {/* Button Actions */}
            <div className="flex flex-col sm:flex-row gap-2.5 w-full mt-1">
              <button
                type="button"
                onClick={onClose}
                className="w-full sm:flex-1 border border-white/20 text-white hover:bg-white/10 py-2.5 px-4 text-[10px] uppercase font-display tracking-widest transition-colors font-bold cursor-pointer"
              >
                {cancelLabel}
              </button>
              <button
                type="button"
                onClick={() => {
                  onConfirm();
                  onClose();
                }}
                className={`w-full sm:flex-1 ${confirmBtnColor} py-2.5 px-4 text-[10px] uppercase font-display tracking-widest font-black transition-all hover:scale-[1.01] shadow-lg cursor-pointer`}
              >
                {confirmLabel}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
