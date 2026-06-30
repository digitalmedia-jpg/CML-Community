import { ConfirmModal } from "./ConfirmModal";
import React, { useState, useEffect, useRef } from "react";
import { 
  Package, 
  Search, 
  Plus, 
  MapPin, 
  User, 
  Calendar, 
  Tag, 
  CheckCircle, 
  XCircle, 
  Trash2, 
  Edit2, 
  Camera, 
  Image as ImageIcon,
  MoreVertical,
  ExternalLink,
  ChevronRight,
  ChevronLeft,
  Loader2,
  Filter,
  Check,
  X,
  LayoutGrid,
  List
} from "lucide-react";
import { 
  db, 
  auth,
  collection, 
  query, 
  orderBy, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  serverTimestamp,
  where 
} from "../lib/firebase";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "../lib/utils";
import { ItemCommentsSection } from "./ItemCommentsSection";
import { notificationService, NotificationType } from "../services/notificationService";
import { toastService } from "../services/toastService";

interface LostItem {
  id: string;
  itemName: string;
  description: string;
  locationFound: string;
  staffName: string;
  staffPosition?: string;
  imageUrls?: string[];
  status: "Found" | "Received at Office" | "Secured in Office" | "Claimed" | "Disposed";
  authorId: string;
  createdAt: any;
  isArchived?: boolean;
  isHighValue?: boolean;
  dispatchDetails?: {
    guestName?: string;
    guestEmail?: string;
    guestPhone?: string;
    roomNumber?: string;
    dispatchedAt?: any;
    dispatchedBy?: string;
    notes?: string;
    signatureUrl?: string;
    staffSignatureUrl?: string;
    idDocumentUrl?: string;
    recipientPhotoUrl?: string;
  };
  disposalDetails?: {
    disposedBy: string;
    disposedAt: any;
    reason?: string;
    witnessName?: string;
    notes?: string;
    signatureUrl?: string;
  };
  receivedDetails?: {
    storageLocation: string;
    storageKeyNumber?: string;
    receivedBy: string;
    receivedAt: any;
    department: string;
    signatureUrl?: string;
    notes?: string;
  };
}

const SignaturePad: React.FC<{ onSave: (url: string) => void, onClear: () => void }> = ({ onSave, onClear }) => {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
  }, []);

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    setIsDrawing(true);
    draw(e);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (canvas) {
      onSave(canvas.toDataURL());
    }
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = ('touches' in e) ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = ('touches' in e) ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const clear = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (canvas && ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.beginPath();
      onClear();
    }
  };

  return (
    <div className="space-y-2">
      <div className="border border-gold/20 bg-white">
        <canvas 
          ref={canvasRef}
          width={400}
          height={150}
          className="w-full h-auto cursor-crosshair touch-none"
          onMouseDown={startDrawing}
          onMouseUp={stopDrawing}
          onMouseOut={stopDrawing}
          onMouseMove={draw}
          onTouchStart={startDrawing}
          onTouchEnd={stopDrawing}
          onTouchMove={draw}
        />
      </div>
      <button 
        type="button" 
        onClick={clear}
        className="text-[8px] font-display uppercase tracking-widest text-slate-500 hover:text-gold transition-colors"
      >
        Clear Signature
      </button>
    </div>
  );
};

export const LostAndFound: React.FC<{ userRole?: string, companyId?: string }> = ({ userRole, companyId = "cml" }) => {
  const [activeCompanyId, setActiveCompanyId] = useState<string>(companyId);
  
  useEffect(() => {
    setActiveCompanyId(companyId);
  }, [companyId]);

  const [items, setItems] = useState<LostItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"All" | "Found" | "Secured in Office" | "Claimed" | "Disposed" | "Archived">("All");
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">(() => {
    try {
      const saved = localStorage.getItem("lost-and-found-view-mode");
      return (saved === "list" || saved === "grid") ? saved : "grid";
    } catch (e) {
      return "grid";
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem("lost-and-found-view-mode", viewMode);
    } catch (e) {}
  }, [viewMode]);

  // Request desktop push notification permission on mount
  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      if (Notification.permission === "default") {
        Notification.requestPermission().then(permission => {
          if (permission === "granted") {
            console.log("Desktop push notification permission active.");
          }
        });
      }
    }
  }, []);

  const [isAdding, setIsAdding] = useState(false);
  const [editingItem, setEditingItem] = useState<LostItem | null>(null);
  const [selectedItemForLogReceived, setSelectedItemForLogReceived] = useState<LostItem | null>(null);
  const [selectedItemForDispatch, setSelectedItemForDispatch] = useState<LostItem | null>(null);
  const [selectedItemForDispose, setSelectedItemForDispose] = useState<LostItem | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [restoreTargetId, setRestoreTargetId] = useState<string | null>(null);

  const [lightboxData, setLightboxData] = useState<{
    urls: string[];
    index: number;
    title: string;
  } | null>(null);

  useEffect(() => {
    if (!lightboxData) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setLightboxData(null);
      } else if (e.key === "ArrowLeft") {
        setLightboxData(prev => {
          if (!prev || prev.urls.length <= 1) return prev;
          const newIndex = (prev.index - 1 + prev.urls.length) % prev.urls.length;
          return { ...prev, index: newIndex };
        });
      } else if (e.key === "ArrowRight") {
        setLightboxData(prev => {
          if (!prev || prev.urls.length <= 1) return prev;
          const newIndex = (prev.index + 1) % prev.urls.length;
          return { ...prev, index: newIndex };
        });
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [lightboxData]);

  const [webcamStep, setWebcamStep] = useState<"idDocument" | "recipientPhoto" | "itemPhoto" | null>(null);
  const webcamVideoRef = useRef<HTMLVideoElement | null>(null);
  const [webcamStream, setWebcamStream] = useState<MediaStream | null>(null);
  const [cameraErrorMsg, setCameraErrorMsg] = useState<string | null>(null);

  const startWebcam = async (type: "idDocument" | "recipientPhoto" | "itemPhoto") => {
    setWebcamStep(type);
    setCameraErrorMsg(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: type === "recipientPhoto" ? "user" : "environment" }
      });
      setWebcamStream(stream);
      setTimeout(() => {
        if (webcamVideoRef.current) {
          webcamVideoRef.current.srcObject = stream;
        }
      }, 100);
    } catch (err: any) {
      console.error("Camera access failed", err);
      setCameraErrorMsg("Failed to access camera stream. Please ensure camera permissions are active.");
    }
  };

  const stopWebcam = () => {
    if (webcamStream) {
      webcamStream.getTracks().forEach(track => track.stop());
      setWebcamStream(null);
    }
    setWebcamStep(null);
  };

  const captureWebcamPhoto = () => {
    if (webcamVideoRef.current) {
      const video = webcamVideoRef.current;
      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      const ctx = canvas.getContext("2d");
      ctx?.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL("image/jpeg", 0.7);
      
      if (webcamStep === "itemPhoto") {
        setNewItem(prev => ({
          ...prev,
          imageUrls: [...prev.imageUrls, dataUrl].filter(Boolean)
        }));
      } else if (webcamStep === "idDocument") {
        setDispatchForm(prev => ({
          ...prev,
          idDocumentUrl: dataUrl
        }));
      } else if (webcamStep === "recipientPhoto") {
        setDispatchForm(prev => ({
          ...prev,
          recipientPhotoUrl: dataUrl
        }));
      }
      stopWebcam();
    }
  };
  
  const [logReceivedForm, setLogReceivedForm] = useState({
    storageLocation: "",
    storageKeyNumber: "",
    receivedBy: auth.currentUser?.displayName || auth.currentUser?.email?.split('@')[0] || "",
    department: "Front Office",
    notes: "",
    signatureUrl: ""
  });

  const [dispatchForm, setDispatchForm] = useState({
    guestName: "",
    guestEmail: "",
    guestPhone: "",
    roomNumber: "",
    dispatchedBy: auth.currentUser?.displayName || auth.currentUser?.email?.split('@')[0] || "",
    releaseDate: new Date().toISOString().split('T')[0],
    idProofType: "Passport",
    idProofNumber: "",
    idDocumentUrl: "",
    recipientPhotoUrl: "",
    signatureUrl: "",
    staffSignatureUrl: "",
    notes: ""
  });

  const [disposeForm, setDisposeForm] = useState({
    disposedBy: auth.currentUser?.displayName || auth.currentUser?.email?.split('@')[0] || "",
    witnessName: "",
    reason: "Expired 90-days retention period",
    date: new Date().toISOString().split('T')[0],
    signatureUrl: "",
    notes: ""
  });

  // Form state
  const [newItem, setNewItem] = useState({
    itemName: "",
    description: "",
    locationFound: "",
    staffName: "",
    staffPosition: "",
    imageUrls: [] as string[],
    isHighValue: false
  });

  const [manuallyHighValue, setManuallyHighValue] = useState<boolean | null>(null);

  const checkIfHighValue = (name: string, desc: string): boolean => {
    const text = `${name} ${desc}`.toLowerCase();
    const highValueKeywords = [
      "ring", "necklace", "bracelet", "earring", "jewelry", "jewel", "gem", "diamond", "gold", "silver", "platinum", "pearl",
      "phone", "iphone", "samsung", "ipad", "tablet", "laptop", "macbook", "computer", "camera", "watch", "smartwatch", "rolex", "apple watch",
      "airpods", "headphone", "device", "console", "nintendo", "playstation", "xbox", "cash", "wallet", "purse", "money", "dollar", "euro",
      "card", "passport", "visa"
    ];
    return highValueKeywords.some(keyword => text.includes(keyword));
  };

  // Automated high value detection
  useEffect(() => {
    if (manuallyHighValue !== null) return;
    const isAutoHigh = checkIfHighValue(newItem.itemName, newItem.description);
    setNewItem(prev => {
      if (prev.isHighValue !== isAutoHigh) {
        return { ...prev, isHighValue: isAutoHigh };
      }
      return prev;
    });
  }, [newItem.itemName, newItem.description, manuallyHighValue]);

  const handleOpenAdd = () => {
    setNewItem({
      itemName: "",
      description: "",
      locationFound: "",
      staffName: auth.currentUser?.displayName || auth.currentUser?.email?.split('@')[0] || "",
      staffPosition: "",
      imageUrls: [],
      isHighValue: false
    });
    setManuallyHighValue(null);
    setEditingItem(null);
    setIsAdding(true);
  };

  const isAdmin = userRole === "Administrator" || userRole === "Manager" || userRole === "Group Controller";
  const isAdministrator = userRole === "Administrator" || userRole === "admin" || userRole === "Manager" || userRole === "Group Controller";

  useEffect(() => {
    // Collect from property-specific database as requested by Charles
    const q = query(
      collection(db, `lost-and-found-${activeCompanyId}`), 
      orderBy("createdAt", "desc")
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as LostItem[];
      setItems(docs);
      setLoading(false);
    }, (error) => {
      console.error("Firestore listener error:", error);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [activeCompanyId]);

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser) return;

    try {
      setLoading(true);
      const filteredUrls = newItem.imageUrls.filter(url => url && typeof url === 'string' && url.trim() !== "");
      
      const targetCollection = collection(db, `lost-and-found-${activeCompanyId}`);

      const itemData = {
        itemName: newItem.itemName,
        description: newItem.description,
        locationFound: newItem.locationFound,
        staffName: newItem.staffName,
        staffPosition: newItem.staffPosition,
        imageUrls: filteredUrls,
        propertyId: activeCompanyId,
        isHighValue: newItem.isHighValue
      };

      if (editingItem) {
        if (!isAdministrator) {
          alert("Only Administrators and Managers are permitted to edit records.");
          return;
        }
        await updateDoc(doc(db, `lost-and-found-${activeCompanyId}`, editingItem.id), {
          ...itemData,
          updatedAt: serverTimestamp()
        });
      } else {
        await addDoc(targetCollection, {
          ...itemData,
          status: "Found",
          authorId: auth.currentUser.uid,
          createdAt: serverTimestamp()
        });

        // Trigger dynamic High-Value Push Notification Trigger if it's marked or classified as high-value
        if (newItem.isHighValue) {
          // 1. Notify the management team in Firestore (so they see it in their Alert Center dropdown)
          try {
            await notificationService.notifyManagement({
              title: `🚨 HIGH-VALUE ALIENATION ALERT`,
              message: `High-value safety: A new high-value item ("${newItem.itemName}") has been registered at ${newItem.locationFound} by ${newItem.staffName}. Alert sent.`,
              type: NotificationType.LOST_FOUND,
              link: "lost-found"
            });
          } catch (notifErr) {
            console.warn("Failed to dispatch management notification:", notifErr);
          }

          // 2. Trigger native HTML5 Desktop Push Notification if permission is granted
          if (typeof window !== "undefined" && "Notification" in window) {
            if (Notification.permission === "granted") {
              try {
                new Notification(`🚨 High-Value Alert (${activeCompanyId.toUpperCase()})`, {
                  body: `"${newItem.itemName}" has been logged at ${newItem.locationFound} by ${newItem.staffName}. Management team alert has been triggered successfully.`,
                  icon: "https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?q=80&w=2576"
                });
              } catch (pushErr) {
                console.warn("Native browser notification failed:", pushErr);
              }
            } else if (Notification.permission === "default") {
              Notification.requestPermission();
            }
          }

          // 3. Dispatch a real-time floating in-app warning notification
          toastService.warning(
            `A high-value push notification and alert have been executed and dispatched to the management team directory for immediate security protocol compliance.`,
            `🚨 SECURITY TRIPPED: ${newItem.itemName.toUpperCase()}`
          );
        }

        // Background notifications
        (async () => {
          try {
             await fetch("/api/notify-found-item", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                item: { ...itemData, imageUrls: filteredUrls },
                sender: {
                  name: auth.currentUser?.displayName || "Staff Member",
                  email: auth.currentUser?.email
                }
              })
             });
            
             await fetch("/api/webhook-notify", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                companyId: activeCompanyId,
                item: { ...itemData, imageUrls: filteredUrls },
                type: "found",
                sender: {
                  name: auth.currentUser?.displayName || "Staff Member",
                  email: auth.currentUser?.email
                }
              })
             });
          } catch (e) {
            console.warn("Background notifications failed:", e);
          }
        })();
      }
      
      setIsAdding(false);
      setEditingItem(null);
      setNewItem({
        itemName: "",
        description: "",
        locationFound: "",
        staffName: auth.currentUser?.displayName || auth.currentUser?.email?.split('@')[0] || "",
        staffPosition: "",
        imageUrls: [],
        isHighValue: false
      });
      setManuallyHighValue(null);
    } catch (error) {
      console.error("Error saving item:", error);
      alert("Failed to save item. Check permissions.");
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = (item: LostItem) => {
    if (!isAdministrator) return;
    setEditingItem(item);
    setNewItem({
      itemName: item.itemName,
      description: item.description,
      locationFound: item.locationFound,
      staffName: item.staffName,
      staffPosition: item.staffPosition || "",
      imageUrls: item.imageUrls || [],
      isHighValue: item.isHighValue || false
    });
    setManuallyHighValue(item.isHighValue !== undefined ? item.isHighValue : null);
    setIsAdding(true);
  };

  const handleUpdateStatus = async (id: string, newStatus: "Found" | "Received at Office" | "Claimed" | "Disposed") => {
    try {
      await updateDoc(doc(db, `lost-and-found-${activeCompanyId}`, id), {
        status: newStatus,
        updatedAt: serverTimestamp(),
        ...(newStatus === "Received at Office" ? {
          receivedAtOfficeAt: serverTimestamp(),
          receivedAtOfficeBy: auth.currentUser?.displayName || auth.currentUser?.email?.split('@')[0]
        } : {})
      });
    } catch (error) {
      console.error("Error updating status:", error);
    }
  };

  const handleDisposeItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItemForDispose || !auth.currentUser) return;
    try {
      setLoading(true);
      await updateDoc(doc(db, `lost-and-found-${activeCompanyId}`, selectedItemForDispose.id), {
        status: "Disposed",
        isArchived: true,
        archivedAt: serverTimestamp(),
        archivedBy: auth.currentUser?.displayName || auth.currentUser?.email?.split('@')[0] || "Staff Member",
        archivedReason: "Disposed Item",
        disposalDetails: {
          ...disposeForm,
          disposedAt: serverTimestamp()
        },
        updatedAt: serverTimestamp()
      });

      // Trigger webhook notification for disposal
      await fetch("/api/webhook-notify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyId: activeCompanyId,
          type: "disposed",
          item: {
            ...selectedItemForDispose,
            itemName: selectedItemForDispose.itemName,
            description: selectedItemForDispose.description,
            disposalDetails: {
              ...disposeForm,
              disposedAt: new Date().toISOString()
            }
          },
          sender: {
            name: auth.currentUser?.displayName || "Staff Member",
            email: auth.currentUser?.email
          }
        })
      }).catch(err => console.error("Webhook notification failed:", err));

      setSelectedItemForDispose(null);
      setDisposeForm({
        disposedBy: auth.currentUser?.displayName || auth.currentUser?.email?.split('@')[0] || "",
        witnessName: "",
        reason: "Expired 90-days retention period",
        date: new Date().toISOString().split('T')[0],
        signatureUrl: "",
        notes: ""
      });
    } catch (error) {
       console.error("Disposal error:", error);
       alert("Failed to process disposal.");
    } finally {
       setLoading(false);
    }
  };

  const handleLogReceivedItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItemForLogReceived || !auth.currentUser) return;
    try {
      setLoading(true);
      await updateDoc(doc(db, `lost-and-found-${activeCompanyId}`, selectedItemForLogReceived.id), {
        status: "Secured in Office",
        receivedDetails: {
          ...logReceivedForm,
          receivedAt: serverTimestamp()
        },
        updatedAt: serverTimestamp()
      });

      // Trigger webhook notification for log received
      await fetch("/api/webhook-notify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyId: activeCompanyId,
          type: "secured",
          item: {
            ...selectedItemForLogReceived,
            itemName: selectedItemForLogReceived.itemName,
            description: selectedItemForLogReceived.description,
            receivedDetails: {
              ...logReceivedForm,
              receivedAt: new Date().toISOString()
            }
          },
          sender: {
            name: auth.currentUser?.displayName || "Staff Member",
            email: auth.currentUser?.email
          }
        })
      }).catch(err => console.error("Webhook notification failed:", err));

      setSelectedItemForLogReceived(null);
      setLogReceivedForm({
        storageLocation: "",
        storageKeyNumber: "",
        receivedBy: auth.currentUser?.displayName || auth.currentUser?.email?.split('@')[0] || "",
        department: "Front Office",
        notes: "",
        signatureUrl: ""
      });
    } catch (error) {
      console.error("Log received error:", error);
      alert("Failed to update status.");
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      if (file.size > 50 * 1024 * 1024) {
        alert("Please select an image smaller than 50MB.");
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

  const handleDispatchItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser || !selectedItemForDispatch) return;

    try {
      setLoading(true);
      const autoNote = `[AUTOMATIC SYSTEM NOTE: Item already released/dispatched to ${dispatchForm.guestName} on ${dispatchForm.releaseDate}]`;

      await updateDoc(doc(db, `lost-and-found-${activeCompanyId}`, selectedItemForDispatch.id), {
        status: "Claimed",
        isArchived: true,
        archivedAt: serverTimestamp(),
        archivedBy: auth.currentUser.displayName || auth.currentUser.email?.split('@')[0] || "Staff",
        archivedReason: "Dispatched to Guest",
        dispatchDetails: {
          ...dispatchForm,
          dispatchedBy: dispatchForm.dispatchedBy || auth.currentUser.displayName || auth.currentUser.email?.split('@')[0],
          systemAutoNote: autoNote,
          dispatchedAt: serverTimestamp()
        },
        updatedAt: serverTimestamp()
      });

      // Trigger webhook notification for dispatch/claim
      await fetch("/api/webhook-notify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyId: activeCompanyId,
          type: "claimed",
          item: {
            ...selectedItemForDispatch,
            itemName: selectedItemForDispatch.itemName,
            description: selectedItemForDispatch.description,
            dispatchDetails: {
              ...dispatchForm,
              dispatchedBy: auth.currentUser.displayName || auth.currentUser.email?.split('@')[0]
            }
          },
          sender: {
            name: auth.currentUser.displayName || "Staff Member",
            email: auth.currentUser.email
          }
        })
      }).catch(err => console.error("Webhook notification failed:", err));

      setSelectedItemForDispatch(null);
      setDispatchForm({
        guestName: "",
        guestEmail: "",
        guestPhone: "",
        roomNumber: "",
        dispatchedBy: auth.currentUser?.displayName || auth.currentUser?.email?.split('@')[0] || "",
        releaseDate: new Date().toISOString().split('T')[0],
        idProofType: "Passport",
        idProofNumber: "",
        idDocumentUrl: "",
        recipientPhotoUrl: "",
        signatureUrl: "",
        staffSignatureUrl: "",
        notes: ""
      });
    } catch (error) {
      console.error("Dispatch error:", error);
      alert("Failed to process dispatch.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTargetId) return;
    try {
      await updateDoc(doc(db, `lost-and-found-${activeCompanyId}`, deleteTargetId), {
        isArchived: true,
        archivedAt: serverTimestamp(),
        archivedBy: auth.currentUser?.displayName || auth.currentUser?.email?.split('@')[0] || "Administrator",
        archivedReason: "Deleted By Admin"
      });
    } catch (error) {
      console.error("Error archiving item:", error);
    } finally {
      setDeleteTargetId(null);
    }
  };

  const handleRestoreConfirm = async () => {
    if (!restoreTargetId) return;
    try {
      setLoading(true);
      await updateDoc(doc(db, `lost-and-found-${activeCompanyId}`, restoreTargetId), {
        isArchived: false,
        archivedAt: null,
        archivedBy: null,
        archivedReason: null
      });
    } catch (error) {
      console.error("Error restoring item:", error);
    } finally {
      setLoading(false);
      setRestoreTargetId(null);
    }
  };

  const filteredItems = items.filter(item => {
    const matchesSearch = item.itemName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          item.locationFound.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (filter === "All") {
      // Show Found and Secured/Received at Office items that are not archived
      return item.isArchived !== true && item.status !== "Claimed" && item.status !== "Disposed" && matchesSearch;
    } else if (filter === "Secured in Office") {
      return (item.status === "Secured in Office" || item.status === "Received at Office") && item.isArchived !== true && matchesSearch;
    } else if (filter === "Claimed") {
      // Dispatched/Claimed items go to Dispatch folder
      return item.status === "Claimed" && matchesSearch;
    } else if (filter === "Disposed") {
      // Disposed items go to Dispose folder
      return item.status === "Disposed" && matchesSearch;
    } else if (filter === "Archived") {
      // Deleted/Archived items (where isArchived is true but they aren't explicitly Claimed or Disposed)
      return item.isArchived === true && item.status !== "Claimed" && item.status !== "Disposed" && matchesSearch;
    } else {
      return item.status === filter && item.isArchived !== true && matchesSearch;
    }
  });

  // Sort logically so the most recent logged items are always 1st showing at the top
  const sortedFilteredItems = [...filteredItems].sort((a, b) => {
    const getMs = (item: LostItem) => {
      if (!item) return 0;
      if (item.createdAt?.seconds) {
        return item.createdAt.seconds * 1000 + Math.floor((item.createdAt.nanoseconds || 0) / 1000000);
      }
      if (item.createdAt?.toDate) {
        return item.createdAt.toDate().getTime();
      }
      if (item.createdAt) {
        try {
          return new Date(item.createdAt).getTime() || 0;
        } catch (_) {}
      }
      // Put pending local serverTimestamp creations at the very top (now)
      return Date.now() + 100000;
    };
    return getMs(b) - getMs(a);
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Found": return "bg-blue-50 text-blue-700 border-blue-200";
      case "Received at Office":
      case "Secured in Office": return "bg-amber-50 text-amber-700 border-amber-200";
      case "Claimed": return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "Disposed": return "bg-slate-100 text-slate-700 border-slate-200";
      default: return "bg-slate-50 text-slate-600 border-slate-200";
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-serif italic text-slate-900 mb-2">Lost & Found Registry</h2>
          <p className="text-[10px] font-display uppercase tracking-[0.2em] text-gold font-bold">
            Property asset recovery and documentation system
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <button 
            onClick={handleOpenAdd}
            className="flex items-center gap-2 bg-gold hover:bg-gold-dark text-black px-4 py-2 text-[10px] font-display uppercase tracking-widest font-black transition-all shadow-md cursor-pointer"
          >
            <Plus size={14} />
            Report Found Item
          </button>
        </div>
      </div>

      {/* Property Registry Selector */}
      <div className="flex border-b border-slate-100 pb-2 gap-6 text-[10px] font-display uppercase tracking-widest overflow-x-auto scrollbar-none">
        {[
          { id: "wyndham", label: "Wyndham Garden Wailoaloa" },
          { id: "ramada", label: "Ramada Suites Wailoaloa" },
          { id: "cml", label: "CML Corporate Office" }
        ].map((prop) => {
          const isActive = activeCompanyId === prop.id;
          return (
            <button
              key={prop.id}
              onClick={() => setActiveCompanyId(prop.id)}
              className={cn(
                "pb-2 font-extrabold transition-all relative flex items-center gap-1.5 whitespace-nowrap cursor-pointer",
                isActive ? "text-gold border-b-2 border-gold font-black" : "text-slate-400 hover:text-slate-600"
              )}
            >
              {prop.label}
              <span className={cn(
                "text-[8px] font-mono px-1.5 py-0.2 rounded-full",
                isActive ? "bg-gold text-white" : "bg-slate-100 text-slate-500"
              )}>
                {isActive ? items.length : "-"}
              </span>
            </button>
          );
        })}
      </div>

      {/* Controls */}
      <div className="flex flex-col gap-5">
        {/* Row 1: Search and Display Layout */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 justify-between">
          <div className="relative group w-full sm:max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-gold transition-colors" size={16} />
            <input 
              type="text"
              placeholder="Search items, locations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white border border-slate-200 pl-10 pr-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 outline-none focus:border-gold transition-all shadow-sm"
            />
          </div>

          <div className="flex items-center justify-between sm:justify-end gap-3 sm:border-l sm:border-slate-100 sm:pl-4">
            <span className="text-[9px] font-display uppercase tracking-widest text-slate-500 font-bold">Display Layout:</span>
            <div className="flex items-center bg-slate-50 p-0.5 border border-slate-200 rounded-sm">
              <button
                onClick={() => setViewMode("grid")}
                className={cn(
                  "p-2 rounded-sm transition-all cursor-pointer",
                  viewMode === "grid" ? "bg-white text-gold border border-slate-200/30 shadow-sm" : "text-slate-400 hover:text-slate-700"
                )}
                title="Grid Layout"
              >
                <LayoutGrid size={13} />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={cn(
                  "p-2 rounded-sm transition-all cursor-pointer",
                  viewMode === "list" ? "bg-white text-gold border border-slate-200/30 shadow-sm" : "text-slate-400 hover:text-slate-700"
                )}
                title="Detailed List Layout"
              >
                <List size={13} />
              </button>
            </div>
          </div>
        </div>

        {/* Row 2: Filter Tabs - Full width, horizontally scrollable on mobile with elegant buttons */}
        <div className="bg-slate-50 p-1.5 border border-slate-200 rounded-sm overflow-x-auto scrollbar-thin">
          <div className="flex items-center gap-1.5 min-w-max">
            {([
              { id: "All", label: "Active Items" },
              { id: "Secured in Office", label: "Secured in Office" },
              { id: "Claimed", label: "Dispatch Folder (Claimed)" },
              { id: "Disposed", label: "Dispose Folder (Disposed)" },
              { id: "Archived", label: "Archive Folder" }
            ] as const).map((tab) => (
              <button
                key={tab.id}
                onClick={() => setFilter(tab.id)}
                className={cn(
                  "px-4 py-2.5 text-[9px] font-display uppercase tracking-widest font-bold transition-all cursor-pointer rounded-sm border",
                  filter === tab.id 
                    ? "bg-white text-gold border-gold/20 shadow-sm font-black" 
                    : "bg-transparent text-slate-600 border-transparent hover:text-slate-900 hover:bg-slate-100"
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Archive Folder Header Indicator */}
      {filter === "Archived" && (
        <div className="p-4 bg-amber-50/70 border border-amber-200 text-sm text-slate-700 flex items-center gap-3 rounded-sm">
          <Package className="text-amber-600" size={20} />
          <div>
            <p className="font-semibold text-slate-900 uppercase tracking-wider text-[11px] font-display">Secure Archive Folder</p>
            <p className="text-xs text-slate-600 mt-0.5">Historical overview of deleted records, claimed/dispatched items, and professional disposals with full signature tracking.</p>
          </div>
        </div>
      )}

      {/* Items Grid */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <Loader2 className="text-gold animate-spin" size={32} />
          <p className="text-[10px] font-display uppercase tracking-widest text-slate-500">Syncing Registry...</p>
        </div>
      ) : sortedFilteredItems.length === 0 ? (
        <div className="text-center py-24 border border-dashed border-white/5">
          <Package className="mx-auto text-slate-700 mb-4" size={48} />
          <p className="text-slate-500 font-serif italic">No items found matching your criteria</p>
        </div>
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          <AnimatePresence>
            {sortedFilteredItems.map((item) => (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white border border-slate-150 group hover:border-gold/30 hover:shadow-md transition-all flex flex-col h-full rounded-sm overflow-hidden"
              >
                {/* Image Placeholder or Gallery */}
                <div className="aspect-video bg-slate-50 overflow-hidden relative group/img">
                  {item.imageUrls && item.imageUrls.length > 0 ? (
                    <div 
                      className="flex w-full h-full cursor-zoom-in"
                      onClick={() => setLightboxData({ urls: item.imageUrls || [], index: 0, title: item.itemName })}
                    >
                      {item.imageUrls.map((url, idx) => (
                        <img 
                          key={idx}
                          src={url} 
                          alt={item.itemName} 
                          className={cn(
                            "w-full h-full object-cover transition-transform duration-500 group-hover/img:scale-110",
                            item.imageUrls!.length > 1 && idx > 0 && "hidden" // Only show first for now, can add a slider
                          )}
                          referrerPolicy="no-referrer"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1540317580384-e5d43616b9aa?q=80&w=2576&auto=format&fit=crop";
                          }}
                        />
                      ))}
                      {item.imageUrls.length > 1 && (
                        <div className="absolute bottom-2 right-2 bg-black/60 backdrop-blur-md px-2 py-1 rounded text-[8px] font-display uppercase font-black text-white flex items-center gap-1">
                          <ImageIcon size={8} /> +{item.imageUrls.length - 1}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-slate-400 bg-slate-50/50">
                      <ImageIcon size={32} />
                      <span className="text-[8px] font-display uppercase tracking-widest font-bold">No Image Secured</span>
                    </div>
                  )}
                  
                  <div className="absolute top-4 left-4">
                    <span className={cn(
                      "px-3 py-1 text-[8px] font-display uppercase tracking-[0.2em] font-black border backdrop-blur-md shadow-sm",
                      getStatusColor(item.status)
                    )}>
                      {item.status}
                    </span>
                  </div>

                  {isAdministrator && (
                    <div className="absolute top-4 right-4 flex gap-2">
                       <button 
                        onClick={() => handleEditClick(item)}
                        className="w-8 h-8 bg-white/90 backdrop-blur-md border border-slate-200/50 flex items-center justify-center text-slate-500 hover:text-gold transition-all opacity-0 group-hover:opacity-100 shadow-sm"
                        title="Edit Entry"
                      >
                        <Edit2 size={14} />
                      </button>
                       <button 
                        onClick={() => {
                          if (!isAdministrator) {
                            alert("Only Administrators and Managers are permitted to delete records.");
                            return;
                          }
                          setDeleteTargetId(item.id);
                        }}
                        className="w-8 h-8 bg-white/90 backdrop-blur-md border border-slate-200/50 flex items-center justify-center text-slate-500 hover:text-red-500 transition-all opacity-0 group-hover:opacity-100 shadow-sm"
                        title="Delete Entry"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  )}
                </div>

                <div className="p-6 flex-1 flex flex-col">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-slate-900 font-serif italic text-lg leading-tight mb-1 flex items-center flex-wrap gap-2">
                        {item.itemName}
                        {item.isHighValue && (
                          <span 
                            title="Classified as High-Value"
                            className="inline-flex items-center gap-1 bg-amber-500/10 text-amber-700 border border-amber-500/20 rounded-full px-2 py-0.5 text-[8px] font-display uppercase tracking-widest font-black leading-none"
                          >
                            💎 High-Value
                          </span>
                        )}
                      </h3>
                      <div className="flex items-center gap-2 text-gold">
                        <MapPin size={10} />
                        <span className="text-[9px] font-display uppercase tracking-widest font-bold">{item.locationFound}</span>
                      </div>
                    </div>
                  </div>

                  <p className="text-slate-600 text-xs leading-relaxed mb-6 line-clamp-3">
                    {item.description}
                  </p>

                  <div className="mt-auto pt-4 border-t border-slate-100 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <User size={12} className="text-slate-400" />
                        <span className="text-[9px] text-slate-600 font-display uppercase tracking-widest">Found By: <strong className="text-slate-800 font-semibold">{item.staffName}</strong></span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar size={12} className="text-slate-400" />
                        <span className="text-[9px] text-slate-600 font-display uppercase tracking-widest">
                          {item.createdAt?.toDate ? item.createdAt.toDate().toLocaleDateString() : 'Pending'}
                        </span>
                      </div>
                    </div>

                        {item.status === "Found" && !item.isArchived && (isAdmin || userRole === "Administrator" || userRole === "Manager" || userRole === "Audit" || userRole === "admin" || userRole === "Group Controller") && (
                          <div className="flex flex-col gap-2 mt-4 w-full">
                            <button 
                              onClick={() => setSelectedItemForLogReceived(item)}
                              className="w-full bg-amber-500/10 border border-amber-500/20 text-amber-400 py-2.5 text-[8px] font-display uppercase tracking-widest font-black hover:bg-amber-500/20 transition-all flex items-center justify-center gap-2"
                            >
                              <MapPin size={12} />
                              Log Received / Secured in Office
                            </button>
                            <div className="flex gap-2">
                              <button 
                                onClick={() => setSelectedItemForDispatch(item)}
                                className="flex-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 py-2.5 text-[8px] font-display uppercase tracking-widest font-black hover:bg-emerald-500/20 transition-all flex items-center justify-center gap-2"
                              >
                                <CheckCircle size={12} />
                                Dispatch
                              </button>
                              <button 
                                onClick={() => setSelectedItemForDispose(item)}
                                className="flex-1 bg-slate-500/10 border border-slate-500/20 text-slate-400 py-2.5 text-[8px] font-display uppercase tracking-widest font-black hover:bg-slate-500/20 transition-all flex items-center justify-center gap-2"
                              >
                                <XCircle size={12} />
                                Dispose
                              </button>
                            </div>
                          </div>
                        )}

                        {(item.status === "Received at Office" || item.status === "Secured in Office") && !item.isArchived && (isAdmin || userRole === "Administrator" || userRole === "Manager" || userRole === "Audit" || userRole === "admin" || userRole === "Group Controller") && (
                           <div className="flex flex-col gap-2 mt-4 w-full">
                             <div className="p-2 mb-2 bg-amber-500/5 border border-amber-500/10 text-[8px] font-display uppercase tracking-widest text-amber-500 text-center font-bold">
                               Secured in Storage Location
                             </div>
                             
                             {item.receivedDetails && (
                               <div className="mb-4 text-left p-3 border border-white/5 bg-white/5 space-y-2">
                                 <div>
                                   <p className="text-[7px] uppercase tracking-widest text-slate-500 font-bold">Physical Location</p>
                                   <p className="text-[10px] text-white font-medium">{item.receivedDetails.storageLocation}</p>
                                 </div>
                                 {item.receivedDetails.storageKeyNumber && (
                                   <div>
                                     <p className="text-[7px] uppercase tracking-widest text-slate-500 font-bold">Cabinet/Key Number</p>
                                     <p className="text-[9px] text-slate-300 font-mono">{item.receivedDetails.storageKeyNumber}</p>
                                   </div>
                                 )}
                                 <div className="grid grid-cols-2 gap-2">
                                   <div>
                                     <p className="text-[7px] uppercase tracking-widest text-slate-500 font-bold">Receiver</p>
                                     <p className="text-[8px] text-slate-300">{item.receivedDetails.receivedBy}</p>
                                   </div>
                                   <div>
                                     <p className="text-[7px] uppercase tracking-widest text-slate-500 font-bold">Department</p>
                                     <p className="text-[8px] text-slate-300">{item.receivedDetails.department}</p>
                                   </div>
                                 </div>
                                 {item.receivedDetails.notes && (
                                   <div>
                                     <p className="text-[7px] uppercase tracking-widest text-slate-500 font-bold">Store Notes</p>
                                     <p className="text-[9px] text-slate-400 italic">"{item.receivedDetails.notes}"</p>
                                   </div>
                                 )}
                                 {item.receivedDetails.signatureUrl && (
                                   <div>
                                     <p className="text-[7px] uppercase tracking-widest text-slate-500 font-bold mb-1">Receiver Signature</p>
                                     <img src={item.receivedDetails.signatureUrl} alt="" className="h-8 object-contain bg-white border border-white/10" />
                                   </div>
                                 )}
                               </div>
                             )}

                             <div className="flex gap-2">
                              <button 
                                onClick={() => setSelectedItemForDispatch(item)}
                                className="flex-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 py-2.5 text-[8px] font-display uppercase tracking-widest font-black hover:bg-emerald-500/20 transition-all flex items-center justify-center gap-2"
                              >
                                <CheckCircle size={12} />
                                Dispatch
                              </button>
                              <button 
                                onClick={() => setSelectedItemForDispose(item)}
                                className="flex-1 bg-slate-500/10 border border-slate-500/20 text-slate-400 py-2.5 text-[8px] font-display uppercase tracking-widest font-black hover:bg-slate-500/20 transition-all flex items-center justify-center gap-2"
                              >
                                <XCircle size={12} />
                                Dispose
                              </button>
                             </div>
                           </div>
                        )}

                        {item.isArchived && (
                          <div className="mt-4 p-4 border border-amber-200 bg-amber-50/20 rounded-sm space-y-3">
                            <div className="flex items-center justify-between border-b border-amber-200/50 pb-2">
                              <span className="text-[10px] font-display uppercase tracking-widest font-black text-amber-800">
                                Secure Archived Record
                              </span>
                              {isAdministrator && (
                                <button 
                                  onClick={() => setRestoreTargetId(item.id)}
                                  className="px-2 py-1 bg-amber-100 border border-amber-300 text-amber-800 text-[8px] font-display uppercase tracking-widest font-bold hover:bg-amber-200 transition-all cursor-pointer"
                                >
                                  Restore Item
                                </button>
                              )}
                            </div>
                            <div className="grid grid-cols-2 gap-4 text-left">
                              <div>
                                <p className="text-[7px] uppercase tracking-widest text-slate-500 font-bold">Archived By</p>
                                <p className="text-[9px] text-slate-800 font-serif italic">{(item as any).archivedBy || "System Admin"}</p>
                              </div>
                              <div>
                                <p className="text-[7px] uppercase tracking-widest text-slate-500 font-bold">Category/Reason</p>
                                <p className="text-[9px] text-amber-800 font-mono font-bold">{(item as any).archivedReason || (item.status === "Claimed" ? "Claimed / Dispatched" : "Disposed")}</p>
                              </div>
                            </div>
                            {(item as any).archivedAt && (
                              <div className="text-left">
                                <p className="text-[7px] uppercase tracking-widest text-slate-500 font-bold">Archive Timestamp</p>
                                <p className="text-[9px] text-slate-700">
                                  {(item as any).archivedAt?.toDate ? (item as any).archivedAt.toDate().toLocaleString() : new Date((item as any).archivedAt).toLocaleString()}
                                </p>
                              </div>
                            )}
                          </div>
                        )}

                    {item.status === "Claimed" && item.dispatchDetails && (
                       <div className="mt-4 pt-4 border-t border-slate-200 space-y-3">
                          <div className="flex items-center justify-between">
                             <p className="text-[10px] font-display uppercase tracking-widest text-emerald-800 font-black flex items-center gap-2">
                               <CheckCircle size={14} className="text-emerald-600" /> Released to {item.dispatchDetails.guestName}
                             </p>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4 text-left">
                             <div className="space-y-1">
                                <p className="text-[7px] uppercase tracking-widest text-slate-500 font-bold">Dispatched By</p>
                                <p className="text-[9px] font-serif italic text-slate-800">{(item.dispatchDetails as any).dispatchedBy}</p>
                             </div>
                             <div className="space-y-1">
                                <p className="text-[7px] uppercase tracking-widest text-slate-500 font-bold">Release Date</p>
                                <p className="text-[9px] font-serif italic text-slate-800">{(item.dispatchDetails as any).releaseDate}</p>
                             </div>
                          </div>

                          {(item as any).dispatchDetails?.guestEmail && (
                             <div className="grid grid-cols-2 gap-4 text-left">
                               <div className="space-y-1">
                                  <p className="text-[7px] uppercase tracking-widest text-slate-500 font-bold">Email</p>
                                  <p className="text-[8px] font-mono text-slate-800">{(item as any).dispatchDetails.guestEmail}</p>
                               </div>
                               <div className="space-y-1">
                                  <p className="text-[7px] uppercase tracking-widest text-slate-500 font-bold">Phone</p>
                                  <p className="text-[8px] text-slate-800">{(item as any).dispatchDetails.guestPhone || 'N/A'}</p>
                               </div>
                            </div>
                          )}

                          {(item as any).dispatchDetails?.notes && (
                             <div className="space-y-1 text-left">
                                <p className="text-[7px] uppercase tracking-widest text-slate-500 font-bold">Handover Notes</p>
                                <p className="text-[9px] font-serif italic text-slate-600">"{(item as any).dispatchDetails.notes}"</p>
                             </div>
                          )}

                          <div className="grid grid-cols-2 gap-4">
                            {(item as any).dispatchDetails?.signatureUrl && (
                               <div className="space-y-1 text-left">
                                  <p className="text-[7px] uppercase tracking-widest text-slate-500 font-bold">Guest Signature</p>
                                  <img src={(item as any).dispatchDetails.signatureUrl} alt="Signature" className="h-10 object-contain bg-white border border-slate-200" />
                               </div>
                            )}

                            {(item as any).dispatchDetails?.staffSignatureUrl && (
                               <div className="space-y-1 text-left">
                                  <p className="text-[7px] uppercase tracking-widest text-slate-500 font-bold">Staff Authorizer Signature</p>
                                  <img src={(item as any).dispatchDetails.staffSignatureUrl} alt="Staff Signature" className="h-10 object-contain bg-white border border-slate-200" />
                                </div>
                            )}
                          </div>

                          <div className="flex gap-2">
                             {(item as any).dispatchDetails?.idDocumentUrl && (
                               <a 
                                 href={(item as any).dispatchDetails.idDocumentUrl} 
                                 target="_blank" 
                                 rel="noreferrer"
                                 className="flex-1 py-1.5 bg-slate-50 border border-slate-200 text-[7px] font-display uppercase tracking-widest text-slate-800 text-center hover:bg-slate-100"
                               >
                                 View ID Proof
                               </a>
                             )}
                             {(item as any).dispatchDetails?.recipientPhotoUrl && (
                               <a 
                                 href={(item as any).dispatchDetails.recipientPhotoUrl} 
                                 target="_blank" 
                                 rel="noreferrer"
                                 className="flex-1 py-1.5 bg-slate-50 border border-slate-200 text-[7px] font-display uppercase tracking-widest text-slate-800 text-center hover:bg-slate-100"
                               >
                                 Recipient Photo
                               </a>
                             )}
                          </div>
                       </div>
                    )}

                    {item.status === "Disposed" && item.disposalDetails && (
                       <div className="mt-4 pt-4 border-t border-slate-200 space-y-3">
                          <div className="flex items-center justify-between">
                             <p className="text-[10px] font-display uppercase tracking-widest text-red-700 font-black flex items-center gap-2">
                               <XCircle size={14} className="text-red-600" /> Item Professionally Disposed
                             </p>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4 text-left">
                             <div className="space-y-1">
                                <p className="text-[7px] uppercase tracking-widest text-slate-500 font-bold">Disposed By</p>
                                <p className="text-[9px] font-serif italic text-slate-800">{item.disposalDetails.disposedBy}</p>
                             </div>
                             <div className="space-y-1">
                                <p className="text-[7px] uppercase tracking-widest text-slate-500 font-bold">Witnessed By</p>
                                <p className="text-[9px] font-serif italic text-slate-800">{item.disposalDetails.witnessName || "None"}</p>
                             </div>
                          </div>

                          <div className="grid grid-cols-2 gap-4 text-left">
                             <div className="space-y-1">
                                <p className="text-[7px] uppercase tracking-widest text-slate-500 font-bold">Reason</p>
                                <p className="text-[9px] text-slate-800">{item.disposalDetails.reason}</p>
                             </div>
                             <div className="space-y-1">
                                <p className="text-[7px] uppercase tracking-widest text-slate-500 font-bold">Disposal Date</p>
                                <p className="text-[9px] text-slate-800">{item.disposalDetails.disposedAt ? (item.disposalDetails.disposedAt.toDate ? item.disposalDetails.disposedAt.toDate().toLocaleDateString() : new Date(item.disposalDetails.disposedAt).toLocaleDateString()) : 'Pending'}</p>
                             </div>
                          </div>

                          {item.disposalDetails.notes && (
                             <div className="space-y-1 text-left">
                                <p className="text-[7px] uppercase tracking-widest text-slate-500 font-bold">Protocol Notes</p>
                                <p className="text-[9px] font-serif italic text-slate-600">"{item.disposalDetails.notes}"</p>
                             </div>
                          )}

                          {item.disposalDetails.signatureUrl && (
                             <div className="space-y-1 text-left">
                                <p className="text-[7px] uppercase tracking-widest text-slate-500 font-bold mb-1">Authorization Signature</p>
                                <img src={item.disposalDetails.signatureUrl} alt="Signature" className="h-10 object-contain bg-white border border-slate-200" />
                             </div>
                          )}
                       </div>
                    )}
                  </div>
                </div>
                <ItemCommentsSection item={item} companyId={activeCompanyId} />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      ) : (
        <div className="flex flex-col gap-5">
          <AnimatePresence>
            {sortedFilteredItems.map((item) => (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 12 }}
                className="bg-white border border-slate-150 group hover:border-gold/30 hover:shadow-md transition-all flex flex-col h-auto overflow-hidden text-left rounded-sm"
              >
                <div className="flex flex-col md:flex-row">
                  {/* Photo Container */}
                  <div className="w-full md:w-52 h-44 md:h-auto min-h-[176px] bg-slate-50 overflow-hidden relative shrink-0">
                    {item.imageUrls && item.imageUrls.length > 0 ? (
                      <div 
                        className="w-full h-full cursor-zoom-in"
                        onClick={() => setLightboxData({ urls: item.imageUrls || [], index: 0, title: item.itemName })}
                      >
                        <img 
                          src={item.imageUrls[0]} 
                          alt={item.itemName} 
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                          referrerPolicy="no-referrer"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1540317580384-e5d43616b9aa?q=80&w=2576&auto=format&fit=crop";
                          }}
                        />
                      </div>
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-slate-400 bg-slate-50/50">
                        <ImageIcon size={28} />
                        <span className="text-[8px] font-display uppercase tracking-widest font-bold">No Image Secured</span>
                      </div>
                    )}
                    
                    <div className="absolute top-4 left-4">
                      <span className={cn(
                        "px-3 py-1 text-[8px] font-display uppercase tracking-[0.2em] font-black border backdrop-blur-md shadow-sm",
                        getStatusColor(item.status)
                      )}>
                        {item.status}
                      </span>
                    </div>

                    {isAdministrator && (
                      <div className="absolute bottom-4 left-4 flex gap-2 bg-white/95 p-1 rounded backdrop-blur-md border border-slate-200 opacity-0 group-hover:opacity-100 transition-opacity shadow-sm">
                        <button 
                          onClick={() => handleEditClick(item)}
                          className="w-7 h-7 flex items-center justify-center text-slate-500 hover:text-gold transition-all cursor-pointer"
                          title="Edit Entry"
                        >
                          <Edit2 size={12} />
                        </button>
                        <button 
                          onClick={() => {
                            if (!isAdministrator) {
                              alert("Only Administrators and Managers are permitted to delete records.");
                              return;
                            }
                            setDeleteTargetId(item.id);
                          }}
                          className="w-7 h-7 flex items-center justify-center text-slate-500 hover:text-red-500 transition-all cursor-pointer"
                          title="Delete Entry"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Text Description/Meta area */}
                  <div className="p-6 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-3">
                        <div>
                          <h3 className="text-slate-900 font-serif italic text-xl leading-snug flex items-center flex-wrap gap-2">
                            {item.itemName}
                            {item.isHighValue && (
                              <span 
                                title="Classified as High-Value"
                                className="inline-flex items-center gap-1 bg-amber-500/10 text-amber-700 border border-amber-500/20 rounded-full px-2 py-0.5 text-[8px] font-display uppercase tracking-widest font-black leading-none"
                              >
                                💎 High-Value
                              </span>
                            )}
                          </h3>
                          <p className="text-slate-600 text-xs leading-relaxed mt-2 max-w-3xl">
                            {item.description}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 text-gold shrink-0 self-start sm:self-auto bg-gold/5 border border-gold/15 px-3 py-1 rounded-sm shadow-sm">
                          <MapPin size={11} />
                          <span className="text-[9px] font-display uppercase tracking-widest font-bold">{item.locationFound}</span>
                        </div>
                      </div>

                      {/* Info bar for lists */}
                      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 py-3 border-y border-slate-150 text-[9px] text-slate-500 font-display uppercase tracking-widest mb-4">
                        <div className="flex items-center gap-2">
                          <User size={12} className="text-slate-400" />
                          <span>Found By: <strong className="text-slate-800 font-semibold">{item.staffName}</strong></span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar size={12} className="text-slate-400" />
                          <span>Logged Date: <strong className="text-slate-800 font-semibold font-sans">
                            {item.createdAt?.toDate ? item.createdAt.toDate().toLocaleDateString() : 'Pending'}
                          </strong></span>
                        </div>
                      </div>
                    </div>

                    {/* Operational Details based on status */}
                    <div className="space-y-4">
                      {/* Active Actions */}
                      {item.status === "Found" && !item.isArchived && (isAdmin || userRole === "Administrator" || userRole === "Manager" || userRole === "Audit" || userRole === "admin" || userRole === "Group Controller") && (
                        <div className="flex flex-col sm:flex-row gap-3 max-w-2xl mt-2">
                          <button 
                            onClick={() => setSelectedItemForLogReceived(item)}
                            className="bg-amber-500/10 border border-amber-500/20 text-amber-400 py-2.5 px-5 text-[8px] font-display uppercase tracking-widest font-black hover:bg-amber-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
                          >
                            <MapPin size={12} />
                            Log Received / Secured in Office
                          </button>
                          <div className="flex gap-2 flex-1">
                            <button 
                              onClick={() => setSelectedItemForDispatch(item)}
                              className="flex-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 py-2.5 text-[8px] font-display uppercase tracking-widest font-black hover:bg-emerald-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
                            >
                              <CheckCircle size={12} />
                              Dispatch
                            </button>
                            <button 
                              onClick={() => setSelectedItemForDispose(item)}
                              className="flex-1 bg-slate-500/10 border border-slate-500/20 text-slate-400 py-2.5 text-[8px] font-display uppercase tracking-widest font-black hover:bg-slate-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
                            >
                              <XCircle size={12} />
                              Dispose
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Secured Storage Area */}
                      {(item.status === "Received at Office" || item.status === "Secured in Office") && !item.isArchived && (isAdmin || userRole === "Administrator" || userRole === "Manager" || userRole === "Audit" || userRole === "admin" || userRole === "Group Controller") && (
                        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center bg-slate-50 border border-slate-200 p-4 rounded-sm mt-2">
                          {item.receivedDetails && (
                            <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-4 text-left w-full">
                              <div>
                                <p className="text-[7px] uppercase tracking-widest text-[#c5a02d] font-bold">Physical Storage</p>
                                <p className="text-[10px] text-slate-900 font-medium font-sans">{item.receivedDetails.storageLocation}</p>
                              </div>
                              {item.receivedDetails.storageKeyNumber && (
                                <div>
                                  <p className="text-[7px] uppercase tracking-widest text-slate-500 font-bold">Cabinet/Bin No.</p>
                                  <p className="text-[9px] text-slate-800 font-mono">{item.receivedDetails.storageKeyNumber}</p>
                                </div>
                              )}
                              <div>
                                <p className="text-[7px] uppercase tracking-widest text-slate-500 font-bold font-sans">Receiver Badge</p>
                                <p className="text-[9px] text-slate-800 uppercase tracking-widest font-mono font-bold text-[8px]">{item.receivedDetails.receivedBy} ({item.receivedDetails.department})</p>
                              </div>
                              {item.receivedDetails.signatureUrl && (
                                <div>
                                  <p className="text-[7px] uppercase tracking-widest text-slate-500 font-bold mb-1">Receiver Signature</p>
                                  <img src={item.receivedDetails.signatureUrl} alt="" className="h-6 object-contain bg-white border border-slate-200" />
                                </div>
                              )}
                            </div>
                          )}

                          <div className="flex gap-2 shrink-0 w-full lg:w-auto">
                            <button 
                              onClick={() => setSelectedItemForDispatch(item)}
                              className="flex-1 lg:flex-initial bg-emerald-50 border border-emerald-300 text-emerald-800 py-2.5 px-4 text-[8px] font-display uppercase tracking-widest font-black hover:bg-emerald-100 transition-all flex items-center justify-center gap-2 cursor-pointer"
                            >
                              <CheckCircle size={11} className="text-emerald-600" />
                              Dispatch
                            </button>
                            <button 
                              onClick={() => setSelectedItemForDispose(item)}
                              className="flex-1 lg:flex-initial bg-slate-50 border border-slate-300 text-slate-700 py-2.5 px-4 text-[8px] font-display uppercase tracking-widest font-black hover:bg-slate-100 transition-all flex items-center justify-center gap-2 cursor-pointer"
                            >
                              <XCircle size={11} className="text-slate-500" />
                              Dispose
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Released / Claimed Area */}
                      {item.status === "Claimed" && item.dispatchDetails && (
                        <div className="mt-2 p-4 bg-emerald-50/20 border border-emerald-200 rounded-sm space-y-3">
                          <div className="flex items-center gap-2 border-b border-emerald-100 pb-2">
                            <CheckCircle className="text-emerald-700 animate-pulse" size={13} />
                            <span className="text-[10px] font-display uppercase tracking-widest text-emerald-800 font-black">
                              Handed Over & Released to <strong className="text-slate-900 font-black">{item.dispatchDetails.guestName}</strong>
                            </span>
                          </div>

                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-left">
                            <div>
                              <p className="text-[7px] uppercase tracking-widest text-slate-500 font-bold">Rel. Authorized By</p>
                              <p className="text-[9px] text-slate-800 font-serif italic">{(item.dispatchDetails as any).dispatchedBy}</p>
                            </div>
                            <div>
                              <p className="text-[7px] uppercase tracking-widest text-slate-500 font-bold">Release Timestamp</p>
                              <p className="text-[9px] text-slate-800 font-serif italic">{(item.dispatchDetails as any).releaseDate}</p>
                            </div>
                            {item.dispatchDetails.guestEmail && (
                              <div className="col-span-2">
                                <p className="text-[7px] uppercase tracking-widest text-slate-500 font-bold">Registered Contacts</p>
                                <p className="text-[9px] text-slate-700">
                                  {item.dispatchDetails.guestEmail} {item.dispatchDetails.guestPhone ? `| ${item.dispatchDetails.guestPhone}` : ""}
                                </p>
                              </div>
                            )}
                          </div>

                          <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-slate-200">
                            <div className="flex gap-4">
                              {item.dispatchDetails.signatureUrl && (
                                <div className="space-y-0.5 text-left">
                                  <p className="text-[7px] uppercase tracking-widest text-slate-500 font-bold">Guest Signature</p>
                                  <img src={item.dispatchDetails.signatureUrl} alt="" className="h-8 object-contain bg-white border border-slate-200" />
                                </div>
                              )}
                              {item.dispatchDetails.staffSignatureUrl && (
                                <div className="space-y-0.5 text-left">
                                  <p className="text-[7px] uppercase tracking-widest text-slate-500 font-bold">Agent Signature</p>
                                  <img src={item.dispatchDetails.staffSignatureUrl} alt="" className="h-8 object-contain bg-white border border-slate-200" />
                                </div>
                              )}
                            </div>

                            <div className="flex gap-2">
                              {item.dispatchDetails.idDocumentUrl && (
                                <a 
                                  href={item.dispatchDetails.idDocumentUrl} 
                                  target="_blank" 
                                  rel="noreferrer"
                                  className="py-1 px-3 bg-slate-50 border border-slate-200 text-[8px] font-display uppercase tracking-widest text-slate-800 hover:text-slate-950 hover:bg-slate-100 transition-colors"
                                >
                                  ID File
                                </a>
                              )}
                              {item.dispatchDetails.recipientPhotoUrl && (
                                <a 
                                  href={item.dispatchDetails.recipientPhotoUrl} 
                                  target="_blank" 
                                  rel="noreferrer"
                                  className="py-1 px-3 bg-slate-50 border border-slate-200 text-[8px] font-display uppercase tracking-widest text-slate-800 hover:text-slate-950 hover:bg-slate-100 transition-colors"
                                >
                                  Recip Photo
                                </a>
                              )}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Professional Disposal Area */}
                      {item.status === "Disposed" && item.disposalDetails && (
                        <div className="mt-2 p-4 bg-red-50/20 border border-red-200 rounded-sm space-y-3">
                          <div className="flex items-center gap-2 border-b border-red-100 pb-2">
                            <XCircle className="text-red-700" size={13} />
                            <span className="text-[10px] font-display uppercase tracking-widest text-red-800 font-black font-sans">
                              Item Destroyed, Recycled, or Donated
                            </span>
                          </div>

                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-left">
                            <div>
                              <p className="text-[7px] uppercase tracking-widest text-slate-500 font-bold">Disposing Officer</p>
                              <p className="text-[9px] text-slate-800 font-serif italic">{item.disposalDetails.disposedBy}</p>
                            </div>
                            <div>
                              <p className="text-[7px] uppercase tracking-widest text-slate-500 font-bold font-sans">Witness Name</p>
                              <p className="text-[9px] text-slate-800 font-serif italic">{item.disposalDetails.witnessName || "None"}</p>
                            </div>
                            <div className="col-span-2">
                              <p className="text-[7px] uppercase tracking-widest text-slate-500 font-bold">Disposal Protocol & Reason</p>
                              <p className="text-[9px] text-slate-800 font-sans font-bold">{item.disposalDetails.reason}</p>
                            </div>
                          </div>
                          
                          {item.disposalDetails.notes && (
                            <div className="p-2 border border-slate-200 bg-slate-50">
                              <p className="text-[7px] uppercase tracking-widest text-slate-500 font-bold">Disposal Action Notes</p>
                              <p className="text-[9px] text-slate-600 italic">"{item.disposalDetails.notes}"</p>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Secured Archive Area */}
                      {item.isArchived && (
                        <div className="mt-2 p-4 bg-amber-50/20 border border-amber-200 rounded-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-left flex-1 w-full">
                            <div>
                              <p className="text-[7px] uppercase tracking-widest text-slate-500 font-bold">Authorised Archiver</p>
                              <p className="text-[9px] text-slate-800 italic">{item.isArchived ? "Archived and Secured" : "Active"}</p>
                            </div>
                            <div>
                              <p className="text-[7px] uppercase tracking-widest text-slate-500 font-bold">Process Category</p>
                              <p className="text-[9px] text-amber-800 font-mono font-bold">{(item as any).archivedReason || (item.status === "Claimed" ? "Claimed / Dispatched" : "Disposed")}</p>
                            </div>
                            {(item as any).archivedAt && (
                              <div>
                                <p className="text-[7px] uppercase tracking-widest text-slate-500 font-bold">Closure Date</p>
                                <p className="text-[9px] text-slate-700 font-sans">
                                  {(item as any).archivedAt?.toDate ? (item as any).archivedAt.toDate().toLocaleString() : new Date((item as any).archivedAt).toLocaleString()}
                                </p>
                              </div>
                            )}
                          </div>
                          {isAdministrator && (
                            <button 
                              onClick={() => setRestoreTargetId(item.id)}
                              className="px-4 py-2 bg-amber-100 border border-amber-300 text-amber-800 text-[8px] font-display uppercase tracking-widest font-black hover:bg-amber-200 transition-all shrink-0 w-full sm:w-auto cursor-pointer"
                            >
                              Restore Record
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Full-width Comments block at the bottom of the line */}
                <ItemCommentsSection item={item} companyId={activeCompanyId} />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Add Item Modal */}
      <AnimatePresence>
        {isAdding && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
              onClick={() => setIsAdding(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-[#1a1a1a] border border-white/10 w-full max-w-2xl relative z-10 p-8 md:p-12 shadow-2xl h-auto max-h-[90vh] overflow-y-auto"
            >
              <div className="flex justify-between items-center mb-10">
                <div>
                  <h2 className="text-2xl font-serif italic text-white mb-2">
                    {editingItem ? "Edit Registry Entry" : "Report Found Item"}
                  </h2>
                  <p className="text-[10px] font-display uppercase tracking-widest text-gold font-black opacity-60">Security Registry Entry</p>
                </div>
                <button 
                  onClick={() => {
                    setIsAdding(false);
                    setEditingItem(null);
                  }} 
                  className="text-slate-500 hover:text-white transition-colors"
                >
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleAddItem} className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <label className="text-[9px] font-display uppercase tracking-widest text-gold font-black opacity-80">Item Designation</label>
                    <input 
                      required
                      placeholder="e.g., iPhone 15 Pro, Black Leather Wallet"
                      className="w-full bg-white/5 border border-white/10 px-4 py-3 text-sm text-white outline-none focus:border-gold/30 transition-all"
                      value={newItem.itemName}
                      onChange={e => setNewItem({...newItem, itemName: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[9px] font-display uppercase tracking-widest text-gold font-black opacity-80">Location Found</label>
                    <input 
                      required
                      placeholder="e.g., Pool Deck, Lobby Restroom"
                      className="w-full bg-white/5 border border-white/10 px-4 py-3 text-sm text-white outline-none focus:border-gold/30 transition-all"
                      value={newItem.locationFound}
                      onChange={e => setNewItem({...newItem, locationFound: e.target.value})}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[9px] font-display uppercase tracking-widest text-gold font-black opacity-80">Detailed Description</label>
                  <textarea 
                    required
                    rows={4}
                    placeholder="Provide specific identifiers, markings, or contents..."
                    className="w-full bg-white/5 border border-white/10 px-4 py-3 text-sm text-white outline-none focus:border-gold/30 transition-all resize-none"
                    value={newItem.description}
                    onChange={e => setNewItem({...newItem, description: e.target.value})}
                  />
                </div>

                {/* High Value Trigger Integration */}
                <div className="p-5 bg-gold/[0.03] border border-gold/20 rounded-sm space-y-4">
                  <div className="flex items-start gap-4">
                    <input 
                      type="checkbox"
                      id="is-high-value-checkbox"
                      className="mt-1 accent-gold w-4 h-4 cursor-pointer"
                      checked={newItem.isHighValue}
                      onChange={e => {
                        setNewItem({...newItem, isHighValue: e.target.checked});
                        setManuallyHighValue(e.target.checked);
                      }}
                    />
                    <div className="space-y-1">
                      <label htmlFor="is-high-value-checkbox" className="text-[11px] font-display uppercase tracking-widest text-[#c5a02d] font-black cursor-pointer flex items-center gap-1.5">
                        High-Value Item Classification
                      </label>
                      <p className="text-[10px] text-slate-400 font-serif italic">
                        Check this box if the item belongs to premium categories such as Jewelry, Electronics, Credit Cards, Cash, or ID Documents. Keyword triggers are automatically tracked.
                      </p>
                    </div>
                  </div>


                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <label className="text-[9px] font-display uppercase tracking-widest text-gold font-black opacity-80">Reporting Staff</label>
                    <input 
                      required
                      placeholder="Staff Member Name"
                      className="w-full bg-white/5 border border-white/10 px-4 py-3 text-sm text-white outline-none focus:border-gold/30 transition-all font-serif italic"
                      value={newItem.staffName}
                      onChange={e => setNewItem({...newItem, staffName: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[9px] font-display uppercase tracking-widest text-gold font-black opacity-80">Staff Department</label>
                    <input 
                      placeholder="e.g., Housekeeping, Front Desk"
                      className="w-full bg-white/5 border border-white/10 px-4 py-3 text-sm text-white outline-none focus:border-gold/30 transition-all"
                      value={newItem.staffPosition}
                      onChange={e => setNewItem({...newItem, staffPosition: e.target.value})}
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="text-[9px] font-display uppercase tracking-widest text-gold font-black opacity-80">Evidence Photos (Upload or URLs)</label>
                    <div className="flex items-center gap-4">
                      <button 
                        type="button"
                        onClick={() => setNewItem({...newItem, imageUrls: [...newItem.imageUrls, ""]})}
                        className="text-[8px] font-display uppercase tracking-widest text-gold hover:text-white transition-colors"
                      >
                        + Add URL Slot
                      </button>
                      <div className="relative">
                        <input 
                          type="file"
                          accept="image/*"
                          multiple
                          id="found-item-upload-new"
                          className="hidden"
                          onChange={async (e) => {
                            const files = e.target.files;
                            if (files && files.length > 0) {
                              setIsUploading(true);
                              try {
                                const filesArray = Array.from(files);
                                const uploadPromises = filesArray.map(file => handleImageUpload(file as File));
                                const urls = await Promise.all(uploadPromises);
                                setNewItem(prev => ({
                                  ...prev,
                                  imageUrls: [...prev.imageUrls, ...urls].filter(url => url !== "")
                                }));
                              } catch (error) {
                                console.error("Upload error:", error);
                                alert("Failed to process images.");
                              } finally {
                                setIsUploading(false);
                              }
                            }
                          }}
                        />
                        <label 
                          htmlFor="found-item-upload-new"
                          className="text-[8px] font-display uppercase tracking-widest bg-gold/20 text-gold px-3 py-1 cursor-pointer hover:bg-gold hover:text-black transition-all flex items-center gap-1 border border-gold/30 rounded-sm"
                        >
                          <Camera size={10} /> {isUploading ? "Processing..." : "Select & Upload Photos"}
                        </label>
                      </div>
                      
                      <button 
                        type="button"
                        onClick={() => startWebcam("itemPhoto")}
                        className="text-[8px] font-display uppercase tracking-widest bg-amber-500/20 text-amber-400 px-3 py-1 cursor-pointer hover:bg-amber-500 hover:text-white transition-all flex items-center gap-1 border border-amber-500/30 rounded-sm font-black"
                      >
                        <Camera size={10} /> Use Live Camera
                      </button>
                    </div>
                  </div>
                  
                  {newItem.imageUrls.length > 0 && (
                    <div className="grid grid-cols-4 gap-2 mb-4">
                      {newItem.imageUrls.map((url, idx) => (
                        url && (
                          <div key={idx} className="aspect-square relative group">
                            <img src={url} alt="" className="w-full h-full object-cover border border-white/10" referrerPolicy="no-referrer" />
                            <button 
                              type="button"
                              onClick={() => {
                                const newUrls = newItem.imageUrls.filter((_, i) => i !== idx);
                                setNewItem({...newItem, imageUrls: newUrls});
                              }}
                              className="absolute -top-1 -right-1 bg-red-600 text-white p-0.5 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <X size={10} />
                            </button>
                          </div>
                        )
                      ))}
                    </div>
                  )}

                  {newItem.imageUrls.map((url, index) => (
                    <div key={index} className="relative group">
                      <ImageIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" size={14} />
                      <input 
                        placeholder="Or paste a photo URL here..."
                        className="w-full bg-white/5 border border-white/10 px-12 py-3 text-[10px] text-white outline-none focus:border-gold/30 transition-all font-mono"
                        value={url}
                        onChange={e => {
                          const newUrls = [...newItem.imageUrls];
                          newUrls[index] = e.target.value;
                          setNewItem({...newItem, imageUrls: newUrls});
                        }}
                      />
                      {newItem.imageUrls.length > 0 && (
                        <button 
                          type="button"
                          onClick={() => {
                            const newUrls = newItem.imageUrls.filter((_, i) => i !== index);
                            setNewItem({...newItem, imageUrls: newUrls});
                          }}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-600 hover:text-red-500 transition-colors"
                        >
                          <Trash2 size={12} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                <div className="pt-6 border-t border-white/5 flex gap-4">
                  <button 
                    type="button"
                    onClick={() => {
                      setIsAdding(false);
                      setEditingItem(null);
                    }}
                    className="flex-1 border border-white/10 hover:bg-white/5 text-white py-4 text-[10px] font-display uppercase tracking-widest font-black transition-all"
                  >
                    Discard Changes
                  </button>
                  <button 
                    type="submit"
                    disabled={loading}
                    className="flex-1 bg-gold hover:bg-gold-dark text-black py-4 text-[10px] font-display uppercase tracking-widest font-black transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {loading ? <Loader2 className="animate-spin" size={14} /> : <Check size={14} />}
                    {editingItem ? "Update Entry" : "Log Found Item"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Dispatch Modal */}
      <AnimatePresence>
        {selectedItemForDispatch && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
              onClick={() => setSelectedItemForDispatch(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-[#1a1a1a] border border-white/10 w-full max-w-lg relative z-10 p-8 shadow-2xl h-auto max-h-[90vh] overflow-y-auto"
            >
              <div className="flex justify-between items-center mb-8">
                <div>
                  <h2 className="text-xl font-serif italic text-white mb-1">Item Dispatch Form</h2>
                  <p className="text-[9px] font-display uppercase tracking-widest text-gold font-black opacity-60">Verified Release Registry</p>
                </div>
                <button onClick={() => setSelectedItemForDispatch(null)} className="text-slate-500 hover:text-white transition-colors">
                  <X size={20} />
                </button>
              </div>

              <div className="mb-8 p-4 bg-white/5 border border-white/10 flex gap-4 items-center">
                 {selectedItemForDispatch.imageUrls && selectedItemForDispatch.imageUrls.length > 0 ? (
                    <img src={selectedItemForDispatch.imageUrls[0]} alt="" className="w-12 h-12 object-cover border border-white/10" referrerPolicy="no-referrer" />
                 ) : (
                    <div className="w-12 h-12 bg-black/40 flex items-center justify-center text-slate-700 border border-white/10">
                       <Package size={20} />
                    </div>
                 )}
                 <div>
                    <p className="text-xs font-serif italic text-white">{selectedItemForDispatch.itemName}</p>
                    <p className="text-[9px] text-slate-500 uppercase tracking-widest">Ref: {selectedItemForDispatch.id.substring(0, 8)}</p>
                 </div>
              </div>

              <form onSubmit={handleDispatchItem} className="space-y-6">
                 <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                       <label className="text-[8px] font-display uppercase tracking-widest text-gold font-black">Release Date</label>
                       <input 
                         type="date"
                         required
                         value={dispatchForm.releaseDate}
                         onChange={e => setDispatchForm({...dispatchForm, releaseDate: e.target.value})}
                         className="w-full bg-white/5 border border-white/10 px-3 py-2 text-xs text-white outline-none focus:border-gold/30"
                       />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[8px] font-display uppercase tracking-widest text-gold font-black">Room / Location</label>
                       <input 
                         type="text"
                         placeholder="e.g. 402"
                         value={dispatchForm.roomNumber}
                         onChange={e => setDispatchForm({...dispatchForm, roomNumber: e.target.value})}
                         className="w-full bg-white/5 border border-white/10 px-3 py-2 text-xs text-white outline-none focus:border-gold/30"
                       />
                    </div>
                 </div>

                 <div className="space-y-2">
                    <label className="text-[8px] font-display uppercase tracking-widest text-gold font-black">Recipient Full Name</label>
                    <input 
                      required
                      placeholder="As per identification document"
                      value={dispatchForm.guestName}
                      onChange={e => setDispatchForm({...dispatchForm, guestName: e.target.value})}
                      className="w-full bg-white/5 border border-white/10 px-3 py-2 text-xs text-white outline-none focus:border-gold/30"
                    />
                 </div>

                 <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                       <label className="text-[8px] font-display uppercase tracking-widest text-gold font-black">Recipient Email</label>
                       <input 
                         type="email"
                         placeholder="guest@example.com"
                         value={dispatchForm.guestEmail}
                         onChange={e => setDispatchForm({...dispatchForm, guestEmail: e.target.value})}
                         className="w-full bg-white/5 border border-white/10 px-3 py-2 text-xs text-white outline-none focus:border-gold/30"
                       />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[8px] font-display uppercase tracking-widest text-gold font-black">Recipient Phone</label>
                       <input 
                         type="tel"
                         placeholder="+679 ..."
                         value={dispatchForm.guestPhone}
                         onChange={e => setDispatchForm({...dispatchForm, guestPhone: e.target.value})}
                         className="w-full bg-white/5 border border-white/10 px-3 py-2 text-xs text-white outline-none focus:border-gold/30"
                       />
                    </div>
                 </div>

                 <div className="space-y-2">
                    <label className="text-[8px] font-display uppercase tracking-widest text-gold font-black">Released By / Dispatched By (Name)</label>
                    <input 
                      required
                      placeholder="Name of person releasing the item"
                      value={dispatchForm.dispatchedBy}
                      onChange={e => setDispatchForm({...dispatchForm, dispatchedBy: e.target.value})}
                      className="w-full bg-white/5 border border-white/10 px-3 py-2 text-xs text-white outline-none focus:border-gold/30 italic font-serif"
                    />
                 </div>

                 <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                       <label className="text-[8px] font-display uppercase tracking-widest text-gold font-black">ID Document Type</label>
                       <select 
                         value={dispatchForm.idProofType}
                         onChange={e => setDispatchForm({...dispatchForm, idProofType: e.target.value})}
                         className="w-full bg-white/5 border border-white/10 px-3 py-2 text-xs text-white outline-none focus:border-gold/30"
                       >
                          <option value="Passport">Passport</option>
                          <option value="Driving License">Driving License</option>
                          <option value="National ID">National ID</option>
                          <option value="Staff ID">Staff ID</option>
                       </select>
                    </div>
                    <div className="space-y-2">
                       <label className="text-[8px] font-display uppercase tracking-widest text-gold font-black">ID Number</label>
                       <input 
                         required
                         placeholder="Document Number"
                         value={dispatchForm.idProofNumber}
                         onChange={e => setDispatchForm({...dispatchForm, idProofNumber: e.target.value})}
                         className="w-full bg-white/5 border border-white/10 px-3 py-2 text-xs text-white outline-none focus:border-gold/30"
                       />
                    </div>
                 </div>

                 <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                       <label className="text-[8px] font-display uppercase tracking-widest text-gold font-black">ID Attachment</label>
                       <div className="relative">
                          <input 
                            type="file" 
                            accept="image/*"
                            className="hidden" 
                            id="id-proof-upload"
                            onChange={async (e) => {
                               const file = e.target.files?.[0];
                               if (file) {
                                  setIsUploading(true);
                                  const url = await handleImageUpload(file);
                                  setDispatchForm(prev => ({ ...prev, idDocumentUrl: url }));
                                  setIsUploading(false);
                               }
                            }}
                          />
                          <label 
                            htmlFor="id-proof-upload"
                            className="flex flex-col items-center justify-center p-4 border border-dashed border-white/10 bg-white/5 hover:bg-white/10 transition-all cursor-pointer min-h-[80px]"
                          >
                             {dispatchForm.idDocumentUrl ? (
                                <div className="text-emerald-400 flex flex-col items-center gap-1">
                                   <Check size={16} />
                                   <span className="text-[7px] font-black uppercase">Captured</span>
                                </div>
                             ) : isUploading ? (
                                <Loader2 size={16} className="animate-spin text-gold" />
                             ) : (
                                <div className="flex flex-col items-center gap-1 text-slate-500">
                                   <Camera size={16} />
                                   <span className="text-[7px] font-black uppercase">Attach ID</span>
                                </div>
                             )}
                          </label>
                          <button 
                            type="button"
                            onClick={() => startWebcam("idDocument")}
                            className="w-full mt-2 py-1.5 bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[8px] font-display uppercase tracking-widest font-black hover:bg-amber-500 hover:text-white transition-all text-center rounded-sm font-black"
                          >
                            Take Live ID Photo
                          </button>
                       </div>
                    </div>
                    <div className="space-y-2">
                       <label className="text-[8px] font-display uppercase tracking-widest text-gold font-black">Recipient Photo</label>
                       <div className="relative">
                          <input 
                             type="file" 
                             accept="image/*"
                             capture="user"
                             className="hidden" 
                             id="recipient-face-upload"
                             onChange={async (e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                   setIsUploading(true);
                                   const url = await handleImageUpload(file);
                                   setDispatchForm(prev => ({ ...prev, recipientPhotoUrl: url }));
                                   setIsUploading(false);
                                }
                             }}
                          />
                          <label 
                            htmlFor="recipient-face-upload"
                            className="flex flex-col items-center justify-center p-4 border border-dashed border-white/10 bg-white/5 hover:bg-white/10 transition-all cursor-pointer min-h-[80px]"
                          >
                             {dispatchForm.recipientPhotoUrl ? (
                                <div className="text-emerald-400 flex flex-col items-center gap-1">
                                   <Check size={16} />
                                   <span className="text-[7px] font-black uppercase">Captured</span>
                                </div>
                             ) : isUploading ? (
                                <Loader2 size={16} className="animate-spin text-gold" />
                             ) : (
                                <div className="flex flex-col items-center gap-1 text-slate-500">
                                   <User size={16} />
                                   <span className="text-[7px] font-black uppercase">Face Capture</span>
                                </div>
                             )}
                          </label>
                          <button 
                            type="button"
                            onClick={() => startWebcam("recipientPhoto")}
                            className="w-full mt-2 py-1.5 bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[8px] font-display uppercase tracking-widest font-black hover:bg-amber-500 hover:text-white transition-all text-center rounded-sm font-black"
                          >
                            Take Live Face Photo
                          </button>
                       </div>
                    </div>
                 </div>

                 <div className="space-y-2">
                    <label className="text-[8px] font-display uppercase tracking-widest text-gold font-black">Dispatch Notes</label>
                    <textarea 
                      placeholder="Additional details regarding the hand-over..."
                      rows={2}
                      value={dispatchForm.notes}
                      onChange={e => setDispatchForm({...dispatchForm, notes: e.target.value})}
                      className="w-full bg-white/5 border border-white/10 px-3 py-2 text-xs text-white outline-none focus:border-gold/30 resize-none"
                    />
                 </div>

                 <div className="space-y-2">
                    <label className="text-[8px] font-display uppercase tracking-widest text-gold font-black">Guest Acknowledgement Signature</label>
                    <SignaturePad 
                       onSave={(url) => setDispatchForm({...dispatchForm, signatureUrl: url})}
                       onClear={() => setDispatchForm({...dispatchForm, signatureUrl: ""})}
                    />
                 </div>

                 <div className="pt-4 flex gap-4">
                    <button 
                      type="button"
                      onClick={() => setSelectedItemForDispatch(null)}
                      className="flex-1 border border-white/10 py-3 text-[9px] font-display uppercase tracking-widest text-white hover:bg-white/5"
                    >
                       Cancel
                    </button>
                    <button 
                      type="submit"
                      disabled={loading}
                      className="flex-1 bg-emerald-600 text-white py-3 text-[9px] font-display uppercase tracking-widest font-black transition-all disabled:opacity-50"
                    >
                       {loading ? "Processing..." : "Authorize Release"}
                    </button>
                 </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Log Received Item Modal (Secured in Office) */}
      <AnimatePresence>
        {selectedItemForLogReceived && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
              onClick={() => setSelectedItemForLogReceived(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-[#1a1a1a] border border-white/10 w-full max-w-lg relative z-10 p-8 shadow-2xl h-auto max-h-[90vh] overflow-y-auto"
            >
              <div className="flex justify-between items-center mb-8">
                <div>
                  <h2 className="text-xl font-serif italic text-white mb-1">Log Received Item</h2>
                  <p className="text-[9px] font-display uppercase tracking-widest text-gold font-black opacity-60">Physical Securement Registry</p>
                </div>
                <button onClick={() => setSelectedItemForLogReceived(null)} className="text-slate-500 hover:text-white transition-colors">
                  <X size={20} />
                </button>
              </div>

              <div className="mb-8 p-4 bg-white/5 border border-white/10 flex gap-4 items-center">
                 {selectedItemForLogReceived.imageUrls && selectedItemForLogReceived.imageUrls.length > 0 ? (
                    <img src={selectedItemForLogReceived.imageUrls[0]} alt="" className="w-12 h-12 object-cover border border-white/10" referrerPolicy="no-referrer" />
                 ) : (
                    <div className="w-12 h-12 bg-black/40 flex items-center justify-center text-slate-700 border border-white/10">
                       <Package size={20} />
                    </div>
                 )}
                 <div>
                    <p className="text-xs font-serif italic text-white">{selectedItemForLogReceived.itemName}</p>
                    <p className="text-[9px] text-slate-500 uppercase tracking-widest">Found Area: {selectedItemForLogReceived.locationFound}</p>
                 </div>
              </div>

              <form onSubmit={handleLogReceivedItem} className="space-y-6">
                <div className="space-y-2">
                   <label className="text-[8px] font-display uppercase tracking-widest text-gold font-black">Physical Storage Location (Required)</label>
                   <select 
                     required
                     value={logReceivedForm.storageLocation}
                     onChange={e => setLogReceivedForm({...logReceivedForm, storageLocation: e.target.value})}
                     className="w-full bg-[#1e1e1e] border border-white/10 px-3 py-2 text-xs text-white outline-none focus:border-gold/30"
                   >
                     <option value="" disabled>-- Choose Location --</option>
                     <option value="Head Office Safe">Head Office Safe</option>
                     <option value="Front Office Drawer 2">Front Office Drawer 2</option>
                     <option value="Security Key Vault">Security Key Vault</option>
                     <option value="Lost & Found Main Cabinet">Lost & Found Main Cabinet</option>
                     <option value="Executive Safe Deposit Box">Executive Safe Deposit Box</option>
                   </select>
                </div>

                <div className="space-y-2">
                   <label className="text-[8px] font-display uppercase tracking-widest text-gold font-black">Storage Key or Bin Reference Number</label>
                   <input 
                     type="text"
                     placeholder="e.g., Cabinet A, Key Row 4"
                     value={logReceivedForm.storageKeyNumber}
                     onChange={e => setLogReceivedForm({...logReceivedForm, storageKeyNumber: e.target.value})}
                     className="w-full bg-white/5 border border-white/10 px-3 py-2 text-xs text-white outline-none focus:border-gold/30"
                   />
                </div>

                 <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                       <label className="text-[8px] font-display uppercase tracking-widest text-gold font-black">Received By</label>
                       <input 
                         type="text"
                         required
                         value={logReceivedForm.receivedBy}
                         onChange={e => setLogReceivedForm({...logReceivedForm, receivedBy: e.target.value})}
                         className="w-full bg-white/5 border border-white/10 px-3 py-2 text-xs text-white outline-none focus:border-gold/30 font-serif italic"
                       />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[8px] font-display uppercase tracking-widest text-gold font-black">Department</label>
                       <select 
                         value={logReceivedForm.department}
                         onChange={e => setLogReceivedForm({...logReceivedForm, department: e.target.value})}
                         className="w-full bg-[#1e1e1e] border border-white/10 px-3 py-2 text-xs text-white outline-none focus:border-gold/30"
                       >
                         <option value="Front Office">Front Office</option>
                         <option value="Security Dept">Security Dept</option>
                         <option value="Housekeeping Dept">Housekeeping Dept</option>
                         <option value="Administration">Administration</option>
                         <option value="Audit Team">Audit Team</option>
                       </select>
                    </div>
                 </div>

                 <div className="space-y-2">
                    <label className="text-[8px] font-display uppercase tracking-widest text-gold font-black">Store / Physical Inventory Notes</label>
                    <textarea 
                      placeholder="Specify packaging type, key tag reference or item tags details..."
                      rows={2}
                      value={logReceivedForm.notes}
                      onChange={e => setLogReceivedForm({...logReceivedForm, notes: e.target.value})}
                      className="w-full bg-white/5 border border-white/10 px-3 py-2 text-xs text-white outline-none focus:border-gold/30 resize-none"
                    />
                 </div>

                 <div className="space-y-2">
                    <label className="text-[8px] font-display uppercase tracking-widest text-gold font-black">Receiver Signature (Head Office Staff Only)</label>
                    <SignaturePad 
                       onSave={(url) => setLogReceivedForm({...logReceivedForm, signatureUrl: url})}
                       onClear={() => setLogReceivedForm({...logReceivedForm, signatureUrl: ""})}
                    />
                 </div>

                 <div className="pt-4 flex gap-4">
                    <button 
                      type="button"
                      onClick={() => setSelectedItemForLogReceived(null)}
                      className="flex-1 border border-white/10 py-3 text-[9px] font-display uppercase tracking-widest text-white hover:bg-white/5"
                    >
                       Cancel
                    </button>
                    <button 
                      type="submit"
                      disabled={loading || !logReceivedForm.storageLocation}
                      className="flex-1 bg-amber-600 text-white py-3 text-[9px] font-display uppercase tracking-widest font-black transition-all disabled:opacity-50"
                    >
                       {loading ? "Processing..." : "Log Received"}
                    </button>
                 </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Dispose Item Modal */}
      <AnimatePresence>
        {selectedItemForDispose && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
              onClick={() => setSelectedItemForDispose(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-[#1a1a1a] border border-white/10 w-full max-w-lg relative z-10 p-8 shadow-2xl h-auto max-h-[90vh] overflow-y-auto"
            >
              <div className="flex justify-between items-center mb-8">
                <div>
                  <h2 className="text-xl font-serif italic text-white mb-1">Dispose Found Item</h2>
                  <p className="text-[9px] font-display uppercase tracking-widest text-red-500 font-black opacity-60">Official Hazard & Disposal Form</p>
                </div>
                <button onClick={() => setSelectedItemForDispose(null)} className="text-slate-500 hover:text-white transition-colors">
                  <X size={20} />
                </button>
              </div>

              <div className="mb-4 p-4 bg-red-950/20 border border-red-900/40 text-red-200 text-xs rounded-lg select-none">
                 Warning: This action records the physical disposal, incineration, or recycling of the item after the legal retention limit.
              </div>

              <form onSubmit={handleDisposeItem} className="space-y-6">
                 <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                       <label className="text-[8px] font-display uppercase tracking-widest text-gold font-black">Authorized Officer</label>
                       <input 
                         type="text"
                         required
                         value={disposeForm.disposedBy}
                         onChange={e => setDisposeForm({...disposeForm, disposedBy: e.target.value})}
                         className="w-full bg-white/5 border border-white/10 px-3 py-2 text-xs text-white outline-none focus:border-gold/30 font-serif italic"
                       />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[8px] font-display uppercase tracking-widest text-gold font-black">Witness Name (Required)</label>
                       <input 
                         type="text"
                         required
                         placeholder="Witness staff name"
                         value={disposeForm.witnessName}
                         onChange={e => setDisposeForm({...disposeForm, witnessName: e.target.value})}
                         className="w-full bg-white/5 border border-white/10 px-3 py-2 text-xs text-white outline-none focus:border-gold/30"
                       />
                    </div>
                 </div>

                 <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                       <label className="text-[8px] font-display uppercase tracking-widest text-gold font-black">Disposal Reason</label>
                       <select 
                         value={disposeForm.reason}
                         onChange={e => setDisposeForm({...disposeForm, reason: e.target.value})}
                         className="w-full bg-[#1e1e1e] border border-white/10 px-3 py-2 text-xs text-white outline-none focus:border-gold/30"
                       >
                         <option value="Expired 90-days retention period">Expired 90-days retention period</option>
                         <option value="Damaged/Perishable hazard">Damaged/Perishable hazard</option>
                         <option value="Unclaimed electronics recycling">Unclaimed electronics recycling</option>
                         <option value="Charitable donation transfer">Charitable donation transfer</option>
                       </select>
                    </div>
                    <div className="space-y-2">
                       <label className="text-[8px] font-display uppercase tracking-widest text-gold font-black">Disposal Date</label>
                       <input 
                         type="date"
                         required
                         value={disposeForm.date}
                         onChange={e => setDisposeForm({...disposeForm, date: e.target.value})}
                         className="w-full bg-white/5 border border-white/10 px-3 py-2 text-xs text-white outline-none focus:border-gold/30"
                       />
                    </div>
                 </div>

                 <div className="space-y-2">
                    <label className="text-[8px] font-display uppercase tracking-widest text-gold font-black">Protocol Notes & Method</label>
                    <textarea 
                      placeholder="Describe how the item was destroyed, recycled, or donated..."
                      rows={2}
                      value={disposeForm.notes}
                      onChange={e => setDisposeForm({...disposeForm, notes: e.target.value})}
                      className="w-full bg-white/5 border border-white/10 px-3 py-2 text-xs text-white outline-none focus:border-gold/30 resize-none"
                    />
                 </div>

                 <div className="space-y-2">
                    <label className="text-[8px] font-display uppercase tracking-widest text-gold font-black">Officer Authorization Signature</label>
                    <SignaturePad 
                       onSave={(url) => setDisposeForm({...disposeForm, signatureUrl: url})}
                       onClear={() => setDisposeForm({...disposeForm, signatureUrl: ""})}
                    />
                 </div>

                 <div className="pt-4 flex gap-4">
                    <button 
                      type="button"
                      onClick={() => setSelectedItemForDispose(null)}
                      className="flex-1 border border-white/10 py-3 text-[9px] font-display uppercase tracking-widest text-white hover:bg-white/5"
                    >
                       Cancel
                    </button>
                    <button 
                      type="submit"
                      disabled={loading || !disposeForm.witnessName}
                      className="flex-1 bg-red-650 text-white py-3 text-[9px] font-display uppercase tracking-widest font-black transition-all disabled:opacity-50"
                    >
                       Confirm Disposal
                    </button>
                 </div>
              </form>
            </motion.div>
          </div>
        )}

        {webcamStep && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/90 backdrop-blur-sm"
              onClick={stopWebcam}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-[#1a1a1a] border border-white/20 w-full max-w-md relative z-10 p-6 shadow-2xl rounded-sm flex flex-col gap-4 text-white"
            >
              <div className="flex justify-between items-center pb-2 border-b border-white/10">
                <div>
                  <h3 className="text-md font-serif italic">Live Media Stream Capture</h3>
                  <p className="text-[8px] font-display uppercase tracking-widest text-gold font-black">
                    {webcamStep === "itemPhoto" ? "Found Item Photo" : webcamStep === "idDocument" ? "Guest ID Attachment" : "Recipient Face Verification"}
                  </p>
                </div>
                <button type="button" onClick={stopWebcam} className="text-slate-400 hover:text-white">
                  <X size={18} />
                </button>
              </div>

              {cameraErrorMsg ? (
                <div className="p-4 bg-red-950/20 border border-red-900 text-red-200 text-xs rounded-sm text-center font-serif italic">
                  {cameraErrorMsg}
                </div>
              ) : (
                <div className="relative aspect-video w-full bg-black/40 border border-white/10 overflow-hidden flex items-center justify-center">
                  <video 
                    ref={webcamVideoRef}
                    autoPlay 
                    playsInline 
                    className="w-full h-full object-cover"
                  />
                  {!webcamStream && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
                      <Loader2 className="animate-spin text-gold" size={24} />
                      <span className="text-[9px] font-display uppercase tracking-widest text-slate-400 font-bold">Initializing Stream...</span>
                    </div>
                  )}
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={stopWebcam}
                  className="flex-1 py-2.5 border border-white/10 text-[9px] font-display uppercase tracking-widest hover:bg-white/5 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={!webcamStream}
                  onClick={captureWebcamPhoto}
                  className="flex-1 py-2.5 bg-gold text-white text-[9px] font-display uppercase tracking-widest font-black hover:bg-amber-600 transition-colors disabled:opacity-40"
                >
                  Take Snapshot
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Image Lightbox Modal Overlay */}
      <AnimatePresence>
        {lightboxData && lightboxData.urls.length > 0 && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/95 backdrop-blur-md"
              onClick={() => setLightboxData(null)}
            />
            
            {/* Top Close bar */}
            <div className="absolute top-4 left-4 right-4 flex justify-between items-center z-20 pointer-events-none">
              <span className="text-[10px] font-display uppercase tracking-[0.2em] font-black text-gold bg-black/60 px-3 py-1.5 backdrop-blur-sm border border-gold/20 rounded-sm">
                Image Lightbox • {lightboxData.title}
              </span>
              <button 
                onClick={() => setLightboxData(null)} 
                className="pointer-events-auto w-10 h-10 bg-black/60 hover:bg-black/85 backdrop-blur-sm border border-white/10 rounded-full flex items-center justify-center text-slate-400 hover:text-white transition-all cursor-pointer"
                title="Close Lightbox (Esc)"
              >
                <X size={20} />
              </button>
            </div>

            {/* Carousel navigation controls if there are multiple images */}
            {lightboxData.urls.length > 1 && (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setLightboxData(prev => {
                      if (!prev) return null;
                      const newIndex = (prev.index - 1 + prev.urls.length) % prev.urls.length;
                      return { ...prev, index: newIndex };
                    });
                  }}
                  className="absolute left-6 z-20 w-12 h-12 bg-black/60 hover:bg-[#c5a02d]/25 border border-white/15 hover:border-[#c5a02d]/40 rounded-full flex items-center justify-center text-slate-400 hover:text-gold transition-all cursor-pointer"
                  title="Previous Image (Arrow Left)"
                >
                  <ChevronLeft size={24} />
                </button>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setLightboxData(prev => {
                      if (!prev) return null;
                      const newIndex = (prev.index + 1) % prev.urls.length;
                      return { ...prev, index: newIndex };
                    });
                  }}
                  className="absolute right-6 z-20 w-12 h-12 bg-black/60 hover:bg-[#c5a02d]/25 border border-white/15 hover:border-[#c5a02d]/40 rounded-full flex items-center justify-center text-slate-400 hover:text-gold transition-all cursor-pointer"
                  title="Next Image (Arrow Right)"
                >
                  <ChevronRight size={24} />
                </button>
              </>
            )}

            {/* Main Image content */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="relative z-10 w-full max-w-5xl max-h-[85vh] flex items-center justify-center pointer-events-none"
            >
              <img 
                src={lightboxData.urls[lightboxData.index]} 
                alt={lightboxData.title}
                className="max-w-full max-h-[85vh] object-contain shadow-2xl border border-white/10 pointer-events-auto rounded-sm"
                referrerPolicy="no-referrer"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1540317580384-e5d43516b9aa?q=80&w=2576&auto=format&fit=crop";
                }}
              />
            </motion.div>

            {/* Bottom Counter / Title indicator */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-black/65 px-4 py-2 border border-white/5 rounded-full flex items-center gap-3 z-15 backdrop-blur-sm shadow-xl">
              <span className="text-[10px] font-display uppercase tracking-widest text-slate-400 font-bold max-w-[200px] truncate">
                {lightboxData.title}
              </span>
              {lightboxData.urls.length > 1 && (
                <>
                  <span className="text-white/20 text-xs">|</span>
                  <span className="text-[10px] font-mono text-gold font-bold">
                    {lightboxData.index + 1} / {lightboxData.urls.length}
                  </span>
                </>
              )}
            </div>
          </div>
        )}
      </AnimatePresence>

      <ConfirmModal
        isOpen={!!deleteTargetId}
        onClose={() => setDeleteTargetId(null)}
        onConfirm={handleDeleteConfirm}
        title="Archive / Delete Item Record?"
        description="Are you sure you want to delete this lost-and-found item? Once confirmed, this item will automatically move to the Archived folder and will not appear in current active logistics logs."
        confirmLabel="Archive / Delete"
        cancelLabel="Preserve Item"
        variant="danger"
      />

      <ConfirmModal
        isOpen={!!restoreTargetId}
        onClose={() => setRestoreTargetId(null)}
        onConfirm={handleRestoreConfirm}
        title="Restore Archived Item?"
        description="Are you sure you want to restore this archived record back into the active list?"
        confirmLabel="Restore Item"
        cancelLabel="Keep Archived"
        variant="warning"
      />
    </div>
  );
};
