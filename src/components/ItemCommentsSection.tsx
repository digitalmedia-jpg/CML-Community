import React, { useState } from "react";
import { 
  MessageSquare, 
  Send, 
  Camera, 
  Loader2, 
  Trash2, 
  X, 
  Check, 
  ChevronDown, 
  ChevronUp 
} from "lucide-react";
import { 
  db, 
  auth, 
  updateDoc, 
  doc, 
  arrayUnion 
} from "../lib/firebase";
import { motion, AnimatePresence } from "motion/react";

interface Comment {
  id: string;
  content: string;
  authorName: string;
  createdAt: string;
  photoUrl?: string;
}

interface ItemCommentsSectionProps {
  item: any; // LostItem
  companyId: string;
}

export const ItemCommentsSection: React.FC<ItemCommentsSectionProps> = ({ item, companyId }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [commentPhoto, setCommentPhoto] = useState<string>("");
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [isSending, setIsSending] = useState(false);

  const commentsList: Comment[] = item.comments || [];

  const handleImageUpload = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      if (file.size > 5 * 1024 * 1024) {
        alert("Please select an image smaller than 5MB.");
        reject(new Error("File too large"));
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          
          const maxDim = 800;
          if (width > height) {
            if (width > maxDim) {
              height *= maxDim / width;
              width = maxDim;
            }
          } else {
            if (height > maxDim) {
              width *= maxDim / height;
              height = maxDim;
            }
          }
          
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          
          const compressedBase64 = canvas.toDataURL('image/jpeg', 0.6);
          resolve(compressedBase64);
        };
        img.onerror = () => reject(new Error("Image load error"));
        img.src = reader.result as string;
      };
      reader.onerror = () => reject(new Error("FileReader error"));
      reader.readAsDataURL(file);
    });
  };

  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingPhoto(true);
    try {
      const base64 = await handleImageUpload(file);
      setCommentPhoto(base64);
    } catch (err) {
      console.error("[Comment Photo Upload Error]", err);
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim() && !commentPhoto) return;
    if (!auth.currentUser) return;

    setIsSending(true);
    try {
      const author = auth.currentUser.displayName || auth.currentUser.email?.split("@")[0] || "Staff Member";
      const newComment: Comment = {
        id: Math.random().toString(36).substring(7),
        content: commentText.trim(),
        authorName: author,
        createdAt: new Date().toISOString(),
        photoUrl: commentPhoto || undefined
      };

      // 1. Update Firestore
      await updateDoc(doc(db, `lost-and-found-${companyId}`, item.id), {
        comments: arrayUnion(newComment)
      });

      // 2. Notify Google Chat Webhook via our custom Proxy
      await fetch("/api/webhook-notify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyId: companyId,
          type: "comment",
          item: {
            ...item,
            itemName: item.itemName,
            description: item.description,
            commentDetails: {
              authorName: author,
              content: commentText.trim(),
              photoUrl: commentPhoto ? "[Base64 Photo Evidence Attached]" : undefined
            }
          },
          sender: {
            name: author,
            email: auth.currentUser.email
          }
        })
      }).catch(err => console.error("Webhook notification failed:", err));

      // 3. Reset Local States
      setCommentText("");
      setCommentPhoto("");
    } catch (err) {
      console.error("[Comment Submit Error]", err);
      alert("Failed to submit comment. Check permissions.");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="border-t border-white/5 pt-4 mt-2">
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between text-[10px] font-display uppercase tracking-widest text-slate-500 hover:text-gold transition-colors py-1 cursor-pointer"
      >
        <span className="flex items-center gap-2">
          <MessageSquare size={12} className={commentsList.length > 0 ? "text-gold" : ""} />
          Comments & Updates ({commentsList.length})
        </span>
        {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden space-y-4 pt-3"
          >
            {/* Thread of comments */}
            <div className="space-y-3 max-h-[220px] overflow-y-auto pr-1 no-scrollbar">
              {commentsList.length === 0 ? (
                <p className="text-[10px] text-slate-600 font-serif italic text-center py-4">
                  No registered announcements or updates for this item.
                </p>
              ) : (
                commentsList.map((c) => (
                  <div key={c.id} className="p-3 bg-white/5 border border-white/5 text-left space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="text-[8px] font-display uppercase tracking-wider text-gold font-bold">
                        {c.authorName}
                      </span>
                      <span className="text-[7px] font-mono text-slate-600">
                        {new Date(c.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}{" "}
                        {new Date(c.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    {c.content && (
                      <p className="text-[11px] text-slate-350 leading-relaxed break-words font-serif italic">
                        "{c.content}"
                      </p>
                    )}
                    {c.photoUrl && (
                      <div className="mt-2 group relative max-w-[120px] aspect-square overflow-hidden border border-white/10">
                        <img 
                          src={c.photoUrl} 
                          alt="Attached Evidence" 
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform" 
                          referrerPolicy="no-referrer"
                        />
                        <a 
                          href={c.photoUrl} 
                          target="_blank" 
                          rel="noreferrer" 
                          className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-[7px] font-display text-white uppercase tracking-wider transition-all"
                        >
                          View Full
                        </a>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>

            {/* Input form */}
            <form onSubmit={handleSubmit} className="space-y-3 pt-2 border-t border-white/5">
              <div className="relative">
                <textarea
                  placeholder="Log an update or reply..."
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 p-3 pr-10 text-[11px] text-white placeholder:text-slate-600 outline-none focus:border-gold/30 resize-none h-16"
                  disabled={isSending}
                />
                
                {/* Photo upload attachment inside comment */}
                <div className="absolute right-3 bottom-3 flex items-center gap-2">
                  <input
                    type="file"
                    accept="image/*"
                    id={`comment-photo-file-${item.id}`}
                    className="hidden"
                    onChange={handlePhotoSelect}
                    disabled={isSending || isUploadingPhoto}
                  />
                  <label
                    htmlFor={`comment-photo-file-${item.id}`}
                    className="cursor-pointer text-slate-500 hover:text-gold transition-colors flex items-center"
                    title="Attach supplementary photo"
                  >
                    {isUploadingPhoto ? (
                      <Loader2 size={12} className="animate-spin text-gold" />
                    ) : (
                      <Camera size={12} className={commentPhoto ? "text-emerald-400" : ""} />
                    )}
                  </label>
                </div>
              </div>

              {/* Photo preview thumbnail before sending */}
              {commentPhoto && (
                <div className="flex items-center gap-2 bg-white/5 p-2 border border-white/10 max-w-[140px] relative">
                  <img src={commentPhoto} alt="Preview" className="w-8 h-8 object-cover border border-white/10" referrerPolicy="no-referrer" />
                  <span className="text-[7px] text-emerald-400 font-display uppercase font-black">Photo Attached</span>
                  <button
                    type="button"
                    onClick={() => setCommentPhoto("")}
                    className="absolute -top-1 -right-1 bg-red-600 text-white p-0.5 rounded-full"
                  >
                    <X size={8} />
                  </button>
                </div>
              )}

              <button
                type="submit"
                disabled={isSending || (!commentText.trim() && !commentPhoto)}
                className="w-full bg-gold hover:bg-gold-dark text-black py-2 text-[9px] font-display uppercase tracking-widest font-black transition-all disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
              >
                {isSending ? (
                  <>
                    <Loader2 size={10} className="animate-spin" />
                    Sending Update...
                  </>
                ) : (
                  <>
                    <Send size={10} />
                    Sync & Copy Update
                  </>
                )}
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
