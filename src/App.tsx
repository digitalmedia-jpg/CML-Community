import React, { useState, useEffect, useRef } from "react";
import { 
  LayoutDashboard, 
  Users, 
  GraduationCap, 
  ShieldCheck, 
  HelpCircle,
  Shield,
  Settings, 
  FileText, 
  Bell, 
  ChevronRight,
  ArrowLeft,
  ExternalLink,
  Layers,
  Globe,
  TrendingUp,
  DollarSign,
  Percent,
  LogOut,
  Menu,
  X,
  Search,
  Hotel,
  RefreshCw,
  Wrench,
  ChevronDown,
  Printer,
  Download,
  History,
  CheckCircle2,
  AlertTriangle,
  MessageSquare,
  Key,
  Lock,
  CreditCard,
  ScanLine,
  Smartphone,
  CheckCircle,
  Waves,
  Wind,
  Send,
  History as HistoryIcon,
  LifeBuoy,
  ArrowRight,
  UserCog,
  Briefcase,
  Clock,
  Package,
  Camera,
  Check,
  ClipboardList,
  Play,
  Plus
} from "lucide-react";
import { notificationService, NotificationType } from './services/notificationService';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from "recharts";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "./lib/utils";
import { auth, loginWithGoogle, logout } from "./lib/firebase";
import { onAuthStateChanged, User } from "firebase/auth";
import { Forum } from "./components/Forum";
import { UserManagement } from "./components/UserManagement";
import { NotificationDropdown } from './components/NotificationDropdown';
import { GlobalSearch } from './components/GlobalSearch';

// Mock data for the chart
const chartData = [
  { name: "Mon", rev: 4000 },
  { name: "Tue", rev: 3000 },
  { name: "Wed", rev: 5500 },
  { name: "Thu", rev: 4800 },
  { name: "Fri", rev: 7200 },
  { name: "Sat", rev: 9000 },
  { name: "Sun", rev: 8500 },
];

// Mock companies data
const COMPANIES = [
  { 
    id: "cml", 
    name: "CML", 
    logo: "https://ramadawailoaloafiji.com/wp-content/uploads/2026/05/CML-Thumbnail-Logo.jpg",
    description: "Cove Mangement Limited",
    theme: "bg-gold",
    accent: "text-gold",
    glow: "shadow-gold/20"
  },
  { 
    id: "ramada", 
    name: "Ramada", 
    logo: "https://ramadawailoaloafiji.com/wp-content/uploads/2026/05/Ramada-Thumbnail-Logo.jpg", 
    description: "Suites by Wyndham Wailoaloa Beach Fiji",
    theme: "bg-red-700",
    accent: "text-red-700",
    glow: "shadow-red-700/20"
  },
  { 
    id: "wyndham", 
    name: "Wyndham Garden", 
    logo: "https://ramadawailoaloafiji.com/wp-content/uploads/2026/05/WG-Thumbnail-Logo.jpg", 
    description: "Wailoaloa Beach Fiji",
    theme: "bg-emerald-700",
    accent: "text-emerald-700",
    glow: "shadow-emerald-700/20"
  }
];

const HR_FORMS = [
  { 
    name: "Missed Clock In/Clock Out Register", 
    id: "missed-clock", 
    type: "external", 
    url: "https://wyndhamgardenwailoaloafiji.com/?ff_landing=36",
    category: "Operational"
  },
  { 
    name: "Early Leave Request Form", 
    id: "early-leave-ext", 
    type: "external", 
    url: "https://wyndhamgardenwailoaloafiji.com/?ff_landing=32",
    category: "HR"
  },
  { 
    name: "Return to Work Form", 
    id: "return-work", 
    type: "external", 
    url: "https://wyndhamgardenwailoaloafiji.com/?ff_landing=28",
    category: "HR"
  },
  { 
    name: "General Leave Application", 
    id: "leave-app", 
    type: "external", 
    url: "https://wyndhamgardenwailoaloafiji.com/?ff_landing=25",
    category: "HR"
  },
  { 
    name: "Overtime Approval Form", 
    id: "overtime", 
    type: "external", 
    url: "https://wyndhamgardenwailoaloafiji.com/?ff_landing=17",
    category: "HR"
  },
  { 
    name: "Employee Feedback Form", 
    id: "feedback", 
    type: "external", 
    url: "https://wyndhamgardenwailoaloafiji.com/?ff_landing=40",
    category: "Engagement"
  },
  { 
    name: "360 Reflection Tool (v1)", 
    id: "360-v1", 
    type: "external", 
    url: "https://wyndhamgardenwailoaloafiji.com/?ff_landing=43",
    category: "Development"
  },
  { 
    name: "360 Reflection Tool (v2)", 
    id: "360-v2", 
    type: "external", 
    url: "https://wyndhamgardenwailoaloafiji.com/?ff_landing=42",
    category: "Development"
  },
  { 
    name: "Employee Training Form", 
    id: "training", 
    type: "external", 
    url: "https://wyndhamgardenwailoaloafiji.com/?ff_landing=46",
    category: "Development"
  },
  { 
    name: "Employee Forms Portal", 
    id: "forms-portal", 
    type: "external", 
    url: "https://wyndhamgardenwailoaloafiji.com/?ff_landing=33",
    category: "Resource"
  },
  { 
    name: "Employee Post-Screening", 
    id: "post-screening", 
    type: "external", 
    url: "https://wyndhamgardenwailoaloafiji.com/?ff_landing=19",
    category: "HR"
  },
  { 
    name: "Conference Booking Request", 
    id: "conference-booking", 
    type: "external", 
    url: "https://wyndhamgardenwailoaloafiji.com/?ff_landing=44",
    category: "Events"
  },
  { 
    name: "Guest Security Deposit Agreement", 
    id: "guest-sd", 
    type: "external", 
    url: "https://wyndhamgardenwailoaloafiji.com/?ff_landing=38",
    category: "Front Office"
  },
  { 
    name: "Guest Registration (Chinese)", 
    id: "guest-reg-chinese", 
    type: "external", 
    url: "https://wyndhamgardenwailoaloafiji.com/?ff_landing=15",
    category: "Front Office"
  },
  { 
    name: "Guest Waiver Form", 
    id: "guest-waiver", 
    type: "external", 
    url: "https://wyndhamgardenwailoaloafiji.com/?ff_landing=4",
    category: "Legal"
  },
  { 
    name: "Guest Check-in Form", 
    id: "guest-checkin", 
    type: "external", 
    url: "https://wyndhamgardenwailoaloafiji.com/?ff_landing=3",
    category: "Front Office"
  },
  { 
    name: "Contact Us Form", 
    id: "contact-us", 
    type: "external", 
    url: "https://wyndhamgardenwailoaloafiji.com/?ff_landing=1",
    category: "Resource"
  }
];

export default function App() {
  const [selectedCompany, setSelectedCompany] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("property-overview");
  const [selectedForm, setSelectedForm] = useState<string | null>(null);
  const [openMenus, setOpenMenus] = useState<string[]>([]);
  const [maintenanceHistory, setMaintenanceHistory] = useState<any[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [dashboardViewMode, setDashboardViewMode] = useState<"percentage" | "pie">("percentage");
  const [checklistDate, setChecklistDate] = useState(new Date().toISOString().split('T')[0]);
  const [checklistValues, setChecklistValues] = useState<Record<string, 'ok' | 'repair' | null>>({});
  const [checklistNotes, setChecklistNotes] = useState("");
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [complaints, setComplaints] = useState<any[]>([]);

  // Firestore Error Handling
  const handleFirestoreError = (error: unknown, operationType: string, path: string | null) => {
    const errInfo = {
      error: error instanceof Error ? error.message : String(error),
      authInfo: {
        userId: auth.currentUser?.uid,
        email: auth.currentUser?.email,
        emailVerified: auth.currentUser?.emailVerified,
      },
      operationType,
      path
    };
    console.error('Firestore Error Detail: ', JSON.stringify(errInfo));
    return new Error(JSON.stringify(errInfo));
  };
  const [showComplaintForm, setShowComplaintForm] = useState(false);
  const [complaintSearch, setComplaintSearch] = useState("");
  const [complaintForm, setComplaintForm] = useState({
    guestName: "",
    roomNumber: "",
    type: "Service Issue",
    priority: "Medium",
    description: ""
  });

  const [lostItems, setLostItems] = useState<any[]>([]);
  const [showLostFoundForm, setShowLostFoundForm] = useState(false);
  const [lostFoundSearch, setLostFoundSearch] = useState("");
  const [selectedItemForDispatch, setSelectedItemForDispatch] = useState<any | null>(null);
  const [dispatchForm, setDispatchForm] = useState({
    guestName: "",
    guestEmail: "",
    guestPhone: "",
    roomNumber: "",
    releaseDate: new Date().toISOString().split('T')[0],
    idProofType: "Passport",
    idProofNumber: "",
    idDocumentUrl: "",
    recipientPhotoUrl: "",
    notes: ""
  });
  const [lostItemForm, setLostItemForm] = useState({
    itemName: "",
    description: "",
    locationFound: "",
    staffName: "",
    staffPosition: "",
    imageUrl: "",
    status: "Found" as "Found" | "Claimed" | "Disposed"
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [sops, setSops] = useState<{title: string, url: string, date: string}[]>(() => {
    const saved = localStorage.getItem('cml_sops');
    return saved ? JSON.parse(saved) : [
      { title: "Standard Front Office Protocol", url: "#", date: "2024-05-01" },
      { title: "Housekeeping Safety Standards", url: "#", date: "2024-04-15" },
      { title: "Emergency Evacuation Plan", url: "#", date: "2024-03-20" }
    ];
  });
  const [sopSearch, setSopSearch] = useState("");
  const [isSopUploading, setIsSopUploading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    localStorage.setItem('cml_sops', JSON.stringify(sops));
  }, [sops]);

  const filteredSops = sops.filter(sop => 
    sop.title.toLowerCase().includes(sopSearch.toLowerCase())
  );

  const handleDispatchItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !selectedItemForDispatch) return;

    try {
      const { doc, updateDoc, serverTimestamp } = await import('firebase/firestore');
      const { db } = await import('./lib/firebase');

      const autoNote = `[AUTOMATIC SYSTEM NOTE: Item already released/dispatched to ${dispatchForm.guestName} on ${dispatchForm.releaseDate}]`;

      await updateDoc(doc(db, 'lost-and-found', selectedItemForDispatch.id), {
        status: "Claimed",
        dispatchDetails: {
          ...dispatchForm,
          systemAutoNote: autoNote,
          dispatchedBy: currentUser.displayName || currentUser.email?.split('@')[0],
          dispatchedAt: serverTimestamp()
        }
      });

      // Notify the reporter
      if (selectedItemForDispatch.authorId) {
        notificationService.notifyUser(selectedItemForDispatch.authorId, {
          title: "Item Dispatched",
          message: `The item "${selectedItemForDispatch.itemName}" you reported has been released to ${dispatchForm.guestName}.`,
          type: NotificationType.LOST_FOUND,
          link: 'lost-and-found'
        });
      }

      setSelectedItemForDispatch(null);
      setDispatchForm({
        guestName: "",
        guestEmail: "",
        guestPhone: "",
        roomNumber: "",
        releaseDate: new Date().toISOString().split('T')[0],
        idProofType: "Passport",
        idProofNumber: "",
        idDocumentUrl: "",
        recipientPhotoUrl: "",
        notes: ""
      });
    } catch (error) {
      console.error("Dispatch error:", error);
      alert("Failed to process dispatch. Ensure you have Audit or Manager permissions.");
    }
  };

  const handlePdfUpload = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      if (file.size > 10 * 1024 * 1024) {
        alert("Please select a document smaller than 10MB.");
        reject(new Error("File too large"));
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        resolve(reader.result as string);
      };
      reader.onerror = () => reject(new Error("FileReader error"));
      reader.readAsDataURL(file);
    });
  };

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

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      const url = await handleImageUpload(file);
      setLostItemForm(prev => ({ ...prev, imageUrl: url }));
    } catch (error) {
      console.error("Upload error:", error);
    } finally {
      setIsUploading(false);
    }
  };

  useEffect(() => {
    if (!currentUser) return;
    
    // Lazy load firestore
    const initComplaints = async () => {
      const { collection, query, orderBy, onSnapshot } = await import('firebase/firestore');
      const { db } = await import('./lib/firebase');
      
      const q = query(collection(db, 'complaints'), orderBy('createdAt', 'desc'));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const docs = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setComplaints(docs);
      }, (err) => {
        console.error("Complaints listener error:", err);
      });
      
      return unsubscribe;
    };
    
    const initLostItems = async () => {
      const { collection, query, orderBy, onSnapshot } = await import('firebase/firestore');
      const { db } = await import('./lib/firebase');
      
      const q = query(collection(db, 'lost-and-found'), orderBy('createdAt', 'desc'));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const docs = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setLostItems(docs);
      }, (err) => {
        console.error("Lost & Found listener error:", err);
      });
      
      return unsubscribe;
    };

    let unsub: any;
    let unsubLost: any;
    initComplaints().then(u => unsub = u);
    initLostItems().then(u => unsubLost = u);
    
    return () => {
      unsub && unsub();
      unsubLost && unsubLost();
    };
  }, [currentUser]);

  const handleReportLostItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    try {
      const { collection, addDoc, serverTimestamp } = await import('firebase/firestore');
      const { db } = await import('./lib/firebase');

      await addDoc(collection(db, 'lost-and-found'), {
        ...lostItemForm,
        authorId: currentUser.uid,
        createdAt: serverTimestamp()
      });

      // Notification
      const logName = currentUser.displayName || currentUser.email?.split('@')[0];
      notificationService.notifyManagement({
        title: "New Lost Item Found",
        message: `${logName} found a "${lostItemForm.itemName}" at ${lostItemForm.locationFound}.`,
        type: NotificationType.LOST_FOUND,
        link: 'lost-and-found'
      }, currentUser.uid);

      setLostItemForm({
        itemName: "",
        description: "",
        locationFound: "",
        staffName: "",
        staffPosition: "",
        imageUrl: "",
        status: "Found"
      });
      setShowLostFoundForm(false);
    } catch (error) {
      console.error("Lost & Found error:", error);
      const handledError = handleFirestoreError(error, 'WRITE', 'lost-and-found');
      alert(`Submission Error: ${handledError.message}`);
    }
  };

  const handleLodgeComplaint = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    try {
      const { collection, addDoc, serverTimestamp } = await import('firebase/firestore');
      const { db } = await import('./lib/firebase');

      await addDoc(collection(db, 'complaints'), {
        ...complaintForm,
        status: "Pending",
        authorId: currentUser.uid,
        authorName: currentUser.displayName || currentUser.email?.split('@')[0],
        createdAt: serverTimestamp()
      });

      // Notification
      const logName = currentUser.displayName || currentUser.email?.split('@')[0];
      notificationService.notifyManagement({
        title: "New Guest Complaint",
        message: (`${complaintForm.priority} Priority: ${complaintForm.guestName} in Room ${complaintForm.roomNumber} - ${complaintForm.type}`).substring(0, 100),
        type: NotificationType.MAINTENANCE,
        link: 'property-overview'
      }, currentUser.uid);

      // Notify the recovery team via backend API
      try {
        await fetch('/api/notify-recovery', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            complaint: complaintForm,
            sender: {
              name: currentUser.displayName || currentUser.email?.split('@')[0],
              email: currentUser.email
            }
          })
        });
      } catch (notifyError) {
        console.error("Notification failed:", notifyError);
      }

      setComplaintForm({
        guestName: "",
        roomNumber: "",
        type: "Service Issue",
        priority: "Medium",
        description: ""
      });
      setShowComplaintForm(false);
    } catch (error) {
      console.error("Complaint error:", error);
    }
  };

  const handleSeedData = async () => {
    if (!currentUser) return;
    try {
      const { collection, addDoc, serverTimestamp, setDoc, doc } = await import('firebase/firestore');
      const { db } = await import('./lib/firebase');

      // Seed Complaints
      const sampleComplaints = [
        { guestName: "John Wick", roomNumber: "101", type: "Service Issue", priority: "Urgent", description: "Security concern regarding an unauthorized visitor. Requires immediate manager attention.", status: "Pending" },
        { guestName: "Tony Stark", roomNumber: "PH-1", type: "Folio Correction", priority: "Low", description: "Incorrect charge for 'Iron Man' movie rental. I have the rights to this film.", status: "Resolved" },
        { guestName: "Sherlock Holmes", roomNumber: "221B", type: "Key Sync Failure", priority: "High", description: "Electronic key fails every time I approach room. Possible magnetic interference.", status: "In Progress" },
        { guestName: "Elena Vance", roomNumber: "305", type: "Restroom Issue", priority: "Medium", description: "Shower pressure is inconsistent. Requires maintenance visit.", status: "Pending" }
      ];

      for (const c of sampleComplaints) {
        await addDoc(collection(db, 'complaints'), {
          ...c,
          authorId: currentUser.uid,
          authorName: "System Seed",
          createdAt: serverTimestamp()
        });
      }

      // Seed Pre-authorized Users
      const sampleUsers = [
        { email: "manager@cml.com.fj", displayName: "Operational Manager", role: "Manager" },
        { email: "frontdesk@cml.com.fj", displayName: "Front Desk Supervisor", role: "Staff" }
      ];

      for (const u of sampleUsers) {
        const userRef = doc(collection(db, 'users'));
        await setDoc(userRef, {
          ...u,
          createdAt: serverTimestamp(),
          isPending: true
        });
      }

      // Seed Lost & Found
      const sampleLostItems = [
        { itemName: "Silver Rolex Wristwatch", description: "Oyster Perpetual model, silver band, slightly scratched on the face.", locationFound: "Room 402 Bedside Table", staffName: "Anita Prasad", staffPosition: "Housekeeping", imageUrl: "https://images.unsplash.com/photo-1547996160-81dfa63595dd?q=80&w=1000&auto=format&fit=crop", status: "Found" },
        { itemName: "Blue Leather Wallet", description: "Contains national ID and various credit cards. No cash found.", locationFound: "Gym Changing Room", staffName: "Rajesh Kumar", staffPosition: "Security", imageUrl: "https://images.unsplash.com/photo-1627123424574-724758594e93?q=80&w=1000&auto=format&fit=crop", status: "Found" },
        { itemName: "Designer Sunglasses", description: "Ray-Ban Aviators in a brown leather case.", locationFound: "Swimming Pool Deck", staffName: "Makereta S.", staffPosition: "Pool Attendant", imageUrl: "https://images.unsplash.com/photo-1511499767010-0601a59d4586?q=80&w=1000&auto=format&fit=crop", status: "Claimed" }
      ];

      for (const item of sampleLostItems) {
        await addDoc(collection(db, 'lost-and-found'), {
          ...item,
          authorId: currentUser.uid,
          createdAt: serverTimestamp()
        });
      }

      alert("Sample data successfully seeded into Guest Recovery, Staff Directory, and Lost & Found.");
    } catch (error) {
      console.error("Seeding error:", error);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
          // Sync user profile
        try {
          const { setDoc, getDoc, doc, serverTimestamp, updateDoc, onSnapshot } = await import('firebase/firestore');
          const { db } = await import('./lib/firebase');
          const userDocRef = doc(db, 'users', user.uid);
          
          const handleFirestoreError = (error: any, operation: string) => {
            console.error(`Firestore ${operation} error:`, error);
            const errInfo = {
              message: error.message,
              code: error.code,
              userId: user.uid,
              userEmail: user.email,
              operation
            };
            throw new Error(JSON.stringify(errInfo));
          };

          // Listen for role changes real-time
          const unsubRole = onSnapshot(userDocRef, (doc) => {
            if (doc.exists()) {
              setUserRole(doc.data().role);
            }
          }, (err) => {
            console.error("Role listener error:", err);
          });

          const userDoc = await getDoc(userDocRef).catch(e => handleFirestoreError(e, 'getDoc'));
          
          const profileData = {
            displayName: user.displayName || user.email?.split('@')[0] || "Team Member",
            email: user.email || "",
            photoURL: user.photoURL || ""
          };

          if (!userDoc.exists()) {
            const { query, collection, where, getDocs, deleteDoc } = await import('firebase/firestore');
            const q = query(collection(db, 'users'), where('email', '==', user.email));
            const querySnapshot = await getDocs(q);
            
            let initialRole = "Viewer";
            let pendingDocRef = null;

            if (!querySnapshot.empty) {
              const pendingDoc = querySnapshot.docs[0];
              initialRole = pendingDoc.data().role;
              if (pendingDoc.id !== user.uid) {
                pendingDocRef = pendingDoc.ref;
              }
            }

            const isBootstrapAdmin = user.email === "digitalmedia@cml.com.fj";
            await setDoc(userDocRef, {
              ...profileData,
              role: isBootstrapAdmin ? "Administrator" : initialRole,
              createdAt: serverTimestamp()
            }).catch(e => handleFirestoreError(e, 'setDoc'));

            // Clean up pre-authorized record if it was a different doc
            if (pendingDocRef) {
              await deleteDoc(pendingDocRef).catch(e => console.warn("Could not clean up pending user doc", e));
            }
          } else {
            const existingData = userDoc.data();
            const updates: any = {};
            
            if (existingData.displayName !== profileData.displayName) {
              updates.displayName = profileData.displayName;
            }
            if (existingData.photoURL !== profileData.photoURL) {
              updates.photoURL = profileData.photoURL;
            }

            // Role migration for older accounts or bootstrap admin
            if (user.email === "digitalmedia@cml.com.fj" && existingData.role !== "Administrator") {
              updates.role = "Administrator";
            } else if (existingData.role === "admin") {
              updates.role = "Administrator";
            } else if (existingData.role === "staff") {
              updates.role = "Staff";
            }

            if (Object.keys(updates).length > 0) {
              await updateDoc(userDocRef, updates).catch(e => handleFirestoreError(e, 'updateDoc'));
            }
          }
          return () => unsubRole();
        } catch (e) {
          console.error("Profile sync error:", e);
        }
      } else {
        setUserRole(null);
      }
    });
    return () => unsubscribe();
  }, []);

  const currentCompany = COMPANIES.find(c => c.id === selectedCompany);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const navItems = [
    { id: "property-overview", label: "Property Overview", icon: Hotel },
    { id: "team-chat", label: "Team Chat", icon: Send },
    { id: "brand", label: "Brand & QA", icon: ShieldCheck },
    { 
      id: "training", 
      label: "Team & Training", 
      icon: Users,
      subItems: [
        { id: "sop", label: "SOP" },
        { id: "training-videos", label: "Training videos" }
      ]
    },
    { id: "hrms", label: "HRMS", icon: UserCog, url: "https://studio--studio-5960583516-49f75.us-central1.hosted.app" },
    { id: "lost-and-found", label: "Lost & Found", icon: Package },
    { id: "resources", label: "Resources & IT Help", icon: HelpCircle },
    { id: "hr", label: "HR Forms", icon: FileText },
    { 
      id: "keycard-sops", 
      label: "Key Card & Lock SOPs", 
      icon: Key,
      subItems: [
        { id: "guest-room-keys", label: "Guest Room Keys" },
        { id: "master-staff-keys", label: "Master & Staff Keys" }
      ]
    },
    { 
      id: "maintenance", 
      label: "Property Maintenance SOPs", 
      icon: Wrench,
      subItems: [
        { id: "maintenance-guidelines", label: "Maintenance Standards" },
        { id: "checklists", label: "PM Checklist" },
        { id: "equipment-logs", label: "Equipment Logs" }
      ]
    },
    { id: "canary", label: "Canary", icon: Globe },
    { id: "forum", label: "Forum", icon: MessageSquare },
  ];

  const toggleMenu = (id: string) => {
    setOpenMenus(prev => 
      prev.includes(id) ? prev.filter(m => m !== id) : [...prev, id]
    );
  };

  if (!selectedCompany) {
    return (
      <div className="min-h-screen bg-luxury-black flex flex-col items-center justify-center p-8 font-sans overflow-hidden relative">
        {/* Subtle Luxury Gradient Background */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(197,160,89,0.05)_0%,transparent_70%)] pointer-events-none" />
        
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="max-w-5xl w-full text-center relative z-10"
        >
          <div className="flex flex-col items-center mb-16">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.8 }}
              className="mb-8"
            >
              <img 
                src="https://ramadawailoaloafiji.com/wp-content/uploads/2026/05/CML-Thumbnail-Logo.jpg" 
                alt="CML Group" 
                className="h-32 w-auto object-contain filter drop-shadow-[0_0_20px_rgba(197,160,89,0.3)]"
                referrerPolicy="no-referrer"
              />
            </motion.div>
            <h1 className="text-5xl md:text-6xl font-serif font-light text-white tracking-tight mb-4 uppercase italic">
              CML <span className="text-gold font-normal">COMMUNITY</span>
            </h1>
            <p className="luxury-label !text-slate-500">Corporate Extranet & Performance Portal</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 px-4">
            {COMPANIES.map((company, idx) => (
              <motion.button
                key={company.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + (idx * 0.1), duration: 0.5 }}
                onClick={() => setSelectedCompany(company.id)}
                className="group relative bg-[#222] border border-white/5 p-10 rounded-sm hover:border-gold/50 transition-all duration-700 flex flex-col items-center text-center shadow-2xl hover:shadow-gold/5"
              >
                {/* Decorative Corners */}
                <div className="absolute top-0 left-0 w-4 h-4 border-t border-l border-white/10 group-hover:border-gold transition-colors duration-500" />
                <div className="absolute bottom-0 right-0 w-4 h-4 border-b border-r border-white/10 group-hover:border-gold transition-colors duration-500" />
                
                <div className="w-24 h-24 bg-white/5 flex items-center justify-center mb-8 group-hover:scale-110 transition-transform duration-700 overflow-hidden relative">
                  <img 
                    src={company.logo} 
                    alt={company.name} 
                    className="w-full h-full object-contain p-2 group-hover:brightness-125 transition-all"
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${company.name.replace(' ', '+')}&background=${company.theme.split('-')[1] === 'gold' ? 'C5A059' : company.theme.split('-')[1] === 'red' ? 'B91C1C' : '059669'}&color=fff&size=128&bold=true`;
                    }}
                  />
                </div>
                
                <h3 className="text-xl font-serif font-medium text-white mb-3 tracking-wide">{company.name}</h3>
                <p className="text-[10px] text-slate-500 font-display uppercase tracking-[0.2em]">{company.description}</p>
                
                <div className="mt-10 h-px w-8 bg-white/10 group-hover:w-16 group-hover:bg-gold transition-all duration-500" />
                
                <div className="mt-8 text-[9px] font-bold uppercase tracking-[0.3em] text-white/30 group-hover:text-gold transition-colors">
                  Enter Property
                </div>
              </motion.button>
            ))}
          </div>
        </motion.div>
        
        <div className="mt-24 pt-8 border-t border-white/5 w-full max-w-5xl flex justify-center items-center text-slate-600 text-[9px] font-display uppercase tracking-[0.3em]">
          <span>@ 2026 Cove Management Limited</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-luxury-cream font-sans text-luxury-black overflow-hidden italic-headings">
      {/* Sidebar Nav */}
      <nav className={cn(
        "bg-luxury-black flex flex-col border-r border-gold/10 shrink-0 transition-all duration-500 ease-in-out fixed inset-y-0 left-0 z-50 md:relative",
        isSidebarOpen ? "w-64" : "w-20",
        !isSidebarOpen && "hidden md:flex"
      )}>
        <div className="p-8 pb-4 shrink-0">
          <div className="flex items-center justify-between mb-12">
            <div className="flex items-center gap-4 cursor-pointer group" onClick={() => setSelectedCompany(null)}>
              <div className={cn("w-10 h-10 flex items-center justify-center font-serif italic text-white text-xl transition-all shadow-lg", currentCompany?.theme, currentCompany?.glow)}>
                {currentCompany?.name[0]}
              </div>
              <AnimatePresence>
                {isSidebarOpen && (
                  <motion.div 
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    className="leading-tight"
                  >
                    <span className="text-white font-serif text-lg tracking-tight block">CML<span className="text-gold">Portal</span></span>
                    <span className="luxury-label !text-[8px] mt-0.5 block opacity-100">Community</span>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            {isSidebarOpen && (
              <button 
                onClick={() => setSidebarOpen(false)}
                className="p-2 text-slate-600 hover:text-white md:hidden"
              >
                <X size={20} />
              </button>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar px-4 pb-12">
          <div className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id || item.subItems?.some(sub => sub.id === activeTab);
              const hasSubItems = item.subItems && item.subItems.length > 0;
              const isOpen = openMenus.includes(item.id);
              
              const content = (
                <div className="flex items-center gap-4 w-full text-left">
                  {isActive && (
                    <motion.div 
                      layoutId="nav-pill" 
                      className="absolute left-0 w-1 h-full bg-gold" 
                    />
                  )}
                  <Icon size={16} className={cn("shrink-0", isActive ? "text-gold" : "group-hover:text-gold transition-colors")} />
                  {isSidebarOpen && (
                    <div className="flex items-center justify-between w-full">
                      <span className="text-left leading-tight py-1">{item.label}</span>
                      {hasSubItems && (
                        <ChevronDown size={12} className={cn("transition-transform duration-300 shrink-0 ml-2", isOpen ? "rotate-180" : "")} />
                      )}
                    </div>
                  )}
                </div>
              );

              if ((item as any).url) {
                return (
                  <a
                    key={item.id}
                    href={(item as any).url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={cn(
                      "w-full flex items-center justify-start gap-4 px-4 py-3 rounded-none text-[11px] font-display uppercase tracking-widest transition-all duration-300 relative group text-white/90 hover:text-gold"
                    )}
                  >
                    {content}
                  </a>
                );
              }

              return (
                <div key={item.id} className="w-full">
                  <button
                    onClick={() => {
                      if (hasSubItems) {
                        toggleMenu(item.id);
                      } else {
                        setActiveTab(item.id);
                        if (window.innerWidth < 768) setSidebarOpen(false);
                      }
                    }}
                    className={cn(
                      "w-full flex items-center justify-start px-4 py-3 rounded-none text-[11px] font-display uppercase tracking-widest transition-all duration-300 relative group",
                      isActive 
                        ? "text-gold bg-white/5" 
                        : "text-white/90 hover:text-gold"
                    )}
                  >
                    {content}
                  </button>
                  
                  {hasSubItems && isSidebarOpen && (
                    <motion.div
                      initial={false}
                      animate={{ height: isOpen ? "auto" : 0, opacity: isOpen ? 1 : 0 }}
                      className="overflow-hidden bg-black/20"
                    >
                      {item.subItems.map((sub: any) => (
                        <button
                          key={sub.id}
                          onClick={() => {
                            setActiveTab(sub.id);
                            if (window.innerWidth < 768) setSidebarOpen(false);
                          }}
                          className={cn(
                            "w-full flex items-center justify-start text-left pl-12 pr-4 py-2 text-[10px] font-display uppercase tracking-widest transition-all duration-300 group",
                            activeTab === sub.id ? "text-gold font-bold bg-white/5" : "text-white hover:text-white hover:bg-white/5"
                          )}
                        >
                          <span className="text-left w-full">{sub.label}</span>
                        </button>
                      ))}
                    </motion.div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
        
        <div className="mt-auto p-8 border-t border-white/5">
          {isSidebarOpen && <div className="luxury-label !text-[8px] mb-4 opacity-70">Operational Status</div>}
          <div className="flex items-center gap-3 text-[10px] text-emerald-400 font-display uppercase tracking-widest">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div> 
            {isSidebarOpen && <span>Encrypted Sync Active</span>}
          </div>
        </div>
      </nav>

      {/* Backdrop for mobile */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
          />
        )}
      </AnimatePresence>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-16 md:h-20 bg-white border-b border-gold/10 flex items-center justify-between px-3 md:px-10 shrink-0">
          <div className="flex items-center gap-1 md:gap-6 flex-1 min-w-0">
            <button 
              onClick={() => setSidebarOpen(!isSidebarOpen)} 
              className="p-1.5 md:p-2 hover:bg-luxury-cream rounded-full transition-colors text-slate-900 hover:text-gold shrink-0"
            >
              <Menu size={20} />
            </button>
            <div className="h-6 w-px bg-slate-200 hidden md:block" />
            
            <div className="flex flex-col md:flex-row md:items-center truncate">
              <h1 className="text-[11px] md:text-sm font-serif text-slate-900 italic font-light truncate">
                Welcome back, <span className="font-bold not-italic">{currentUser ? (currentUser.displayName || (currentUser.email === "digitalmedia@cml.com.fj" ? "Charles" : currentUser.email?.split('@')[0])) : "Guest"}</span>
              </h1>
              
              <div className="flex items-center gap-1 md:gap-3">
                 <span className="text-slate-600 text-xs hidden md:block mx-1">/</span>
                 <select 
                   value={selectedCompany || ""}
                   onChange={(e) => setSelectedCompany(e.target.value)}
                   className="bg-transparent border-none text-[8px] md:text-[11px] font-display uppercase tracking-[0.05em] md:tracking-[0.2em] font-black text-gold focus:ring-0 cursor-pointer hover:text-gold-dark transition-colors max-w-[120px] md:max-w-none truncate p-0 md:p-1"
                 >
                   {COMPANIES.map(c => (
                     <option key={c.id} value={c.id}>{c.name}</option>
                   ))}
                   <option value="group">Group Corporate</option>
                 </select>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-1.5 md:gap-8 shrink-0">
            <div className="hidden lg:block">
              <GlobalSearch 
                onNavigate={(tab, formId) => {
                  setActiveTab(tab);
                  if (formId) setSelectedForm(formId);
                }} 
              />
            </div>
            
            <div className="text-right hidden xl:block">
              <p className="luxury-label !text-slate-900 !font-black opacity-100">{currentUser ? (userRole || "Team Member") : "Guest Mode"}</p>
              <div className="flex items-center justify-end gap-2 mt-0.5">
                <span className="text-[8px] font-display uppercase tracking-widest bg-gold/10 text-gold px-1.5 py-0.5 rounded-full font-black">Enterprise Core</span>
                <p className="text-[10px] font-sans text-slate-600 font-medium truncate max-w-[150px]">{currentUser?.email}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-1 md:gap-4">
              {currentUser && (
                <NotificationDropdown onNavigate={(tab) => setActiveTab(tab)} />
              )}
              
              <div className="relative">
                <button 
                  onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                  className={cn(
                    "w-7 h-7 md:w-10 md:h-10 border p-0.5 flex items-center justify-center rounded-sm transition-all active:scale-95 overflow-hidden shadow-sm",
                    isProfileMenuOpen ? "border-gold bg-gold" : "border-slate-200 bg-white hover:border-gold"
                  )}
                >
                    {currentUser?.photoURL ? (
                      <img src={currentUser.photoURL} alt="Profile" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    ) : (
                      <div className={cn("w-full h-full flex items-center justify-center text-[10px] md:text-sm font-bold font-display uppercase", isProfileMenuOpen ? "text-white" : "text-gold")}>
                        {currentUser?.displayName?.[0] || currentUser?.email?.[0] || "?"}
                      </div>
                    )}
                </button>
                
                <AnimatePresence>
                  {isProfileMenuOpen && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setIsProfileMenuOpen(false)} />
                      <motion.div 
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        className="absolute right-0 mt-4 w-64 bg-white shadow-2xl border border-gold/10 p-0 z-50 rounded-sm overflow-hidden"
                      >
                        <div className="p-6 border-b border-slate-100 bg-slate-50/50">
                          <p className="text-[10px] font-display uppercase tracking-[0.2em] text-gold font-black mb-1">Authenticated Account</p>
                          <p className="text-sm font-serif italic text-slate-950 font-bold truncate leading-none mb-2">{currentUser?.displayName || "Team Member"}</p>
                          <p className="text-[10px] text-slate-600 truncate font-sans mb-1">{currentUser?.email}</p>
                          <p className="text-[10px] text-gold font-display uppercase tracking-widest font-black mb-3">Subscription: Enterprise Core</p>
                          <p className="text-[9px] font-display uppercase tracking-widest text-white px-3 py-1 bg-luxury-black inline-block font-black">{userRole || "Access Level: Staff"}</p>
                        </div>
                        
                        <div className="p-2">
                          <button 
                            onClick={() => {
                              setActiveTab("profile");
                              setIsProfileMenuOpen(false);
                            }}
                            className="w-full text-left px-4 py-3 text-[10px] font-display uppercase tracking-widest font-black text-slate-800 hover:bg-luxury-cream hover:text-gold transition-all flex items-center gap-3"
                          >
                            <Users size={14} className="opacity-70" /> User Profile Detail
                          </button>
                          
                          {userRole === "Administrator" && (
                            <button 
                              onClick={() => {
                                setActiveTab("user-management");
                                setIsProfileMenuOpen(false);
                              }}
                              className="w-full text-left px-4 py-3 text-[10px] font-display uppercase tracking-widest font-black text-slate-800 hover:bg-luxury-cream hover:text-gold transition-all flex items-center gap-3"
                            >
                              <ShieldCheck size={14} className="opacity-70" /> Admin Control Panel
                            </button>
                          )}
                          
                          <div className="h-px bg-slate-100 my-2" />
                          
                          <button 
                            onClick={() => logout()}
                            className="w-full text-left px-4 py-3 text-[10px] font-display uppercase tracking-widest font-black text-red-700 hover:bg-red-50 hover:text-red-900 transition-all flex items-center gap-3"
                          >
                            <LogOut size={14} /> End Active Session
                          </button>
                        </div>
                        
                        <div className="p-3 bg-luxury-black text-[8px] font-display uppercase tracking-[0.3em] text-white/30 text-center">
                          CML Group Corporate Proxy
                        </div>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <main className={cn(
          "flex-1 overflow-x-hidden",
          ["canary", "team-chat"].includes(activeTab) ? "p-0 h-full overflow-hidden" : "p-4 md:p-10 overflow-y-auto"
        )}>
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className={cn(["canary", "team-chat"].includes(activeTab) ? "w-full h-full flex flex-col" : "h-full max-w-7xl mx-auto")}
          >
            {["guest-room-keys", "master-staff-keys"].includes(activeTab) ? (
              <div className="max-w-5xl space-y-12 pb-32">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12 no-print">
                  <div>
                    <h2 className="text-4xl font-serif text-slate-900 italic">
                      {activeTab === "guest-room-keys" ? "Room Key Card Issue & Door Lock Programming" : "Master & Staff Key SOPs"}
                    </h2>
                    <p className="luxury-label opacity-100">Security Protocols & Operational Standards</p>
                  </div>
                  <button 
                    onClick={() => window.print()}
                    className="flex items-center gap-2 px-6 py-3 bg-luxury-black text-white text-[10px] font-display uppercase tracking-widest font-bold hover:bg-gold transition-all shadow-sm"
                  >
                    <Printer size={14} /> Print SOP
                  </button>
                </div>

                {/* Print Header */}
                <div className="hidden print:block mb-8 border-b-2 border-gold/20 pb-4">
                   <div className="flex justify-between items-end mb-4">
                      <div>
                         <h1 className="text-2xl font-serif italic text-slate-900">
                           {activeTab === "guest-room-keys" ? "Guest Room Key Issuance & Programming" : "Master Key Control & Security"}
                         </h1>
                         <p className="text-[10px] font-display uppercase tracking-widest text-gold font-bold">{currentCompany?.name} SECURITY REGISTRY</p>
                      </div>
                      <div className="text-right">
                         <p className="text-[10px] font-display uppercase tracking-widest text-slate-600">Effective Date</p>
                         <p className="text-sm font-serif italic text-slate-900">{new Date().toLocaleDateString()}</p>
                      </div>
                   </div>
                </div>

                {activeTab === "guest-room-keys" ? (
                  <div className="space-y-12">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                       <div className="luxury-card p-8 bg-white border-t-2 border-t-gold/20 relative overflow-hidden group">
                          <div className="absolute -right-4 -top-4 text-gold/5 group-hover:text-gold/10 transition-colors">
                             <CreditCard size={120} strokeWidth={0.5} />
                          </div>
                          <div className="flex items-center gap-3 mb-6 pb-2 border-b border-slate-50 relative z-10">
                             <div className="w-8 h-8 bg-luxury-cream text-gold flex items-center justify-center">
                                <Key size={16} strokeWidth={1} />
                             </div>
                             <h4 className="text-[10px] font-display uppercase tracking-widest font-black text-slate-800">Issuing Room Cards</h4>
                          </div>
                          <div className="space-y-4 relative z-10">
                             {[
                               "Log in Username: reception | Password: 123456",
                               "Select room and stay duration",
                               "Choose number of cards (recommended: 2)",
                               "Place card on reader click Issue",
                               "Confirm issuance card is active",
                               "Keys expire at 11:00 AM on checkout day"
                             ].map((step, i) => (
                               <div key={i} className="flex gap-3">
                                  <span className="text-[10px] font-display font-black text-gold/40">0{i+1}</span>
                                  <p className="text-xs text-slate-600 font-serif italic leading-relaxed">{step}</p>
                               </div>
                             ))}
                          </div>
                       </div>

                       <div className="luxury-card p-8 bg-white border-t-2 border-t-gold/20 relative overflow-hidden group">
                          <div className="absolute -right-4 -top-4 text-gold/5 group-hover:text-gold/10 transition-colors">
                             <ScanLine size={120} strokeWidth={0.5} />
                          </div>
                          <div className="flex items-center gap-3 mb-6 pb-2 border-b border-slate-50 relative z-10">
                             <div className="w-8 h-8 bg-luxury-cream text-gold flex items-center justify-center">
                                <ScanLine size={16} strokeWidth={1} />
                             </div>
                             <h4 className="text-[10px] font-display uppercase tracking-widest font-black text-slate-800">Reading a Card</h4>
                          </div>
                          <div className="space-y-4 relative z-10">
                             {[
                               "Select Card from the menu",
                               "Click Read Card",
                               "Follow on-screen instructions",
                               "Reference Guide"
                             ].map((step, i) => (
                               <div key={i} className="flex gap-3">
                                  <span className="text-[10px] font-display font-black text-gold/40">0{i+1}</span>
                                  <p className="text-xs text-slate-600 font-serif italic leading-relaxed">{step}</p>
                               </div>
                             ))}
                          </div>
                       </div>

                       <div className="luxury-card p-8 bg-luxury-black text-white border-t-2 border-t-gold relative overflow-hidden group">
                          <div className="absolute -right-8 -bottom-8 text-gold/10 group-hover:text-gold/20 transition-colors">
                             <ShieldCheck size={160} strokeWidth={0.5} />
                          </div>
                          <h4 className="text-[10px] font-display uppercase tracking-widest font-black text-gold mb-6 pb-2 border-b border-white/5 relative z-10">Quick Reference</h4>
                          <div className="space-y-6 relative z-10">
                             <div className="flex items-start gap-3">
                                <CheckCircle size={14} className="text-gold mt-0.5" />
                                <div>
                                   <p className="text-[9px] font-display uppercase tracking-widest text-slate-600 mb-1">Issue Cards</p>
                                   <p className="text-[11px] font-serif italic text-slate-200">Login, Select room, Choose 2 cards, Issue.</p>
                                </div>
                             </div>
                             <div className="flex items-start gap-3">
                                <CheckCircle size={14} className="text-gold mt-0.5" />
                                <div>
                                   <p className="text-[9px] font-display uppercase tracking-widest text-slate-600 mb-1">Read Card</p>
                                   <p className="text-[11px] font-serif italic text-slate-200">Menu, Card, Read Card.</p>
                                </div>
                             </div>
                             <div className="flex items-start gap-3">
                                <AlertTriangle size={14} className="text-amber-500 mt-0.5" />
                                <div>
                                   <p className="text-[9px] font-display uppercase tracking-widest text-slate-600 mb-1">System Warning</p>
                                   <p className="text-[11px] font-serif italic text-amber-500">Keys expire 11:00 AM. Max 90 master cards.</p>
                                </div>
                             </div>
                          </div>
                       </div>
                    </div>

                    <div className="luxury-card overflow-hidden bg-white">
                       <div className="p-8 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                             <div className="w-10 h-10 bg-luxury-black text-gold flex items-center justify-center">
                                <Smartphone size={20} strokeWidth={1} />
                             </div>
                             <h3 className="text-xl font-serif italic text-slate-900">PDA Usage to Program Door Locks</h3>
                          </div>
                          <div className="hidden md:flex items-center gap-2 text-[8px] font-display uppercase tracking-[0.2em] font-bold text-slate-700">
                             <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                             Hardware Sync Active
                          </div>
                       </div>
                       <div className="p-10 grid grid-cols-1 md:grid-cols-2 gap-12">
                          <div className="space-y-6">
                             {[
                               "Turn on PDA select Lock",
                               "Choose floor and correct room number",
                               "Hold PDA close to lock",
                               "System (Room Number): click OK blue light + beep",
                               "Parameter (Room Number): click OK blue light + beep",
                               "After these steps, guest/master/floor cards can open the lock."
                             ].map((step, i) => (
                               <div key={i} className="flex gap-4 items-start">
                                  <div className="w-6 h-6 rounded-full border border-gold/30 flex items-center justify-center shrink-0">
                                     <span className="text-[10px] font-display font-black text-gold">{i+1}</span>
                                  </div>
                                  <p className="text-sm text-slate-600 font-serif italic leading-relaxed">{step}</p>
                               </div>
                             ))}
                          </div>
                          <div className="bg-luxury-cream/30 p-10 flex flex-col justify-center border-l border-slate-100 relative overflow-hidden group">
                             <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                                <Lock size={80} strokeWidth={0.5} />
                             </div>
                             <div className="flex items-center gap-3 mb-6">
                                <AlertTriangle className="text-amber-600" size={20} strokeWidth={1} />
                                <h5 className="text-[10px] font-display uppercase tracking-widest font-black text-slate-800">Critical Verification</h5>
                             </div>
                             <p className="text-xs text-slate-800 font-serif italic leading-loose">
                                Ensure both the <span className="text-slate-900 font-bold">System</span> and <span className="text-slate-900 font-bold">Parameter</span> clicks result in a <span className="text-emerald-600 font-bold flex items-center gap-2 mt-1">
                                   <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
                                   Blue Light + Beep
                                </span>. Without the double confirmation, the door lock may remain in its previous state.
                             </p>
                          </div>
                       </div>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="luxury-card p-10 bg-white">
                      <h4 className="text-[10px] font-display uppercase tracking-[0.3em] font-black text-gold mb-8 border-b border-slate-50 pb-4">Standard Protocol</h4>
                      <div className="space-y-6">
                        {[
                          "Identity verification required for all duplicates",
                          "Audit logs must be checked daily",
                          "Key encoder maintenance every 30 days",
                          "Lost keys must be deactivated immediately"
                        ].map((sop, i) => (
                          <div key={i} className="flex gap-4">
                             <span className="text-gold font-serif italic">0{i+1}</span>
                             <p className="text-sm text-slate-600 font-serif italic">{sop}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="luxury-card p-10 bg-luxury-black text-white">
                      <h4 className="text-[10px] font-display uppercase tracking-[0.3em] font-black text-gold mb-8 border-b border-white/5 pb-4">Security Notice</h4>
                      <p className="text-xs text-slate-700 mb-8 font-serif leading-relaxed italic">
                        Strict adherence to key control is mandatory for property insurance compliance. Failure to log master key movements may result in disciplinary action.
                      </p>
                      <button className="w-full border border-gold/40 py-4 text-[10px] font-display uppercase tracking-widest font-black text-gold hover:bg-gold hover:text-white transition-all">
                        Download Full Security PDF
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : activeTab === "equipment-logs" ? (
              <div className="space-y-12">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12 no-print">
                  <div>
                    <h2 className="text-4xl font-serif text-slate-900 italic">Equipment Logs & Reports</h2>
                    <p className="luxury-label opacity-100">Maintenance health & failure frequency analytics</p>
                  </div>
                  <button 
                    onClick={() => window.print()}
                    className="flex items-center gap-2 px-6 py-3 bg-luxury-black text-white text-[10px] font-display uppercase tracking-widest font-bold hover:bg-gold transition-all shadow-sm"
                  >
                    <Printer size={14} /> Export Report
                  </button>
                </div>

                {/* Print-only Stats Header */}
                <div className="hidden print:block mb-8 border-b-2 border-gold/20 pb-4">
                   <div className="flex justify-between items-end mb-4">
                      <div>
                         <h1 className="text-2xl font-serif italic text-slate-900">Equipment Performance Report</h1>
                         <p className="text-[10px] font-display uppercase tracking-widest text-gold font-bold">{currentCompany?.name} MAINTENANCE ANALYSIS</p>
                      </div>
                      <div className="text-right">
                         <p className="text-[10px] font-display uppercase tracking-widest text-slate-600">Analysis Date</p>
                         <p className="text-sm font-serif italic text-slate-900">{new Date().toLocaleDateString()}</p>
                      </div>
                   </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  <div className="lg:col-span-2 space-y-8">
                    <div className="luxury-card p-8 bg-white">
                      <div className="flex items-center justify-between mb-8">
                        <h3 className="text-xl font-serif italic text-slate-900">Repair Frequency Trend</h3>
                        <p className="text-[9px] font-display uppercase tracking-widest text-slate-700">Reported issues over time</p>
                      </div>
                      <div className="h-72 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={maintenanceHistory.map(h => ({
                            date: h.date,
                            repairs: Object.values(h.values || {}).filter(v => v === 'repair').length
                          })).reverse()}>
                            <defs>
                              <linearGradient id="colorRepairs" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#C5A059" stopOpacity={0.3}/>
                                <stop offset="95%" stopColor="#C5A059" stopOpacity={0}/>
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                            <XAxis dataKey="date" stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
                            <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
                            <Tooltip 
                              contentStyle={{ 
                                backgroundColor: '#fff', 
                                border: '1px solid #C5A059', 
                                borderRadius: '0',
                                fontFamily: 'Inter',
                                fontSize: '10px'
                              }} 
                            />
                            <Area type="monotone" dataKey="repairs" stroke="#C5A059" strokeWidth={2} fillOpacity={1} fill="url(#colorRepairs)" />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    <div className="luxury-card overflow-hidden">
                      <div className="p-8 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                         <h3 className="text-xl font-serif italic text-slate-900">Critical Issues Ledger</h3>
                         <span className="bg-amber-50 text-amber-600 text-[9px] font-black uppercase tracking-widest px-3 py-1">Active Alerts</span>
                      </div>
                      <div className="overflow-x-auto">
                         <table className="w-full text-left">
                            <thead className="bg-luxury-cream/30">
                               <tr>
                                  <th className="px-8 py-4 luxury-label !text-slate-800">Date Reported</th>
                                  <th className="px-8 py-4 luxury-label !text-slate-800">Equipment Item</th>
                                  <th className="px-8 py-4 luxury-label !text-slate-800">Log Category</th>
                                  <th className="px-8 py-4 luxury-label !text-slate-800">Notes</th>
                               </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                               {maintenanceHistory.flatMap(log => 
                                 Object.entries(log.values || {})
                                   .filter(([_, val]) => val === 'repair')
                                   .map(([key, _]) => ({ key, log }))
                               ).length === 0 ? (
                                 <tr>
                                    <td colSpan={4} className="px-8 py-16 text-center text-slate-700 font-serif italic">No equipment failures currently logged.</td>
                                 </tr>
                               ) : (
                                 maintenanceHistory.flatMap(log => 
                                   Object.entries(log.values || {})
                                     .filter(([_, val]) => val === 'repair')
                                     .map(([key, _], i) => (
                                       <tr key={`${log.date}-${i}`} className="hover:bg-luxury-cream/10 transition-colors">
                                          <td className="px-8 py-4 text-[11px] font-serif italic">{log.date}</td>
                                          <td className="px-8 py-4 text-[11px] font-bold text-slate-700 uppercase tracking-tight">{key.split('-').pop()}</td>
                                          <td className="px-8 py-4">
                                            <span className="text-[10px] font-display uppercase tracking-widest text-gold opacity-60">
                                              {log.type === 'public' ? 'Public' : log.type === 'guest' ? 'Guest Room' : 'Service'}
                                            </span>
                                          </td>
                                          <td className="px-8 py-4 text-[10px] text-slate-800 italic max-w-xs truncate">
                                            {log.notes || "No detailed findings recorded."}
                                          </td>
                                       </tr>
                                     ))
                                 )
                               )}
                            </tbody>
                         </table>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-8 no-print">
                    <div className="luxury-card p-8 bg-luxury-black text-white">
                      <h4 className="text-[10px] font-display uppercase tracking-[0.3em] font-black text-gold mb-6">Service Summary</h4>
                      <div className="space-y-6">
                        <div className="flex justify-between items-end border-b border-white/10 pb-4">
                          <p className="text-[10px] font-display uppercase text-slate-300">Total In-Depth Logs</p>
                          <span className="text-2xl font-serif italic text-gold">{maintenanceHistory.length}</span>
                        </div>
                        <div className="flex justify-between items-end border-b border-white/10 pb-4">
                          <p className="text-[10px] font-display uppercase text-slate-300">Items Needing Repair</p>
                          <span className="text-2xl font-serif italic text-amber-500">
                             {maintenanceHistory.reduce((acc, log) => acc + Object.values(log.values || {}).filter(v => v === 'repair').length, 0)}
                          </span>
                        </div>
                        <div className="flex justify-between items-end">
                          <p className="text-[10px] font-display uppercase text-slate-300">Fleet Health Index</p>
                          <span className="text-2xl font-serif italic text-emerald-500">92%</span>
                        </div>
                      </div>
                    </div>

                    <div className="luxury-card p-8 bg-white">
                       <h4 className="text-[10px] font-display uppercase tracking-widest font-black text-slate-800 mb-6 flex items-center gap-2">
                         <AlertTriangle size={14} className="text-amber-500" />
                         Recurring Low-Performance
                       </h4>
                       <div className="space-y-4">
                          {[
                            { name: "Parking Lot Signage", freq: "3x this month" },
                            { name: "Bathtub Caulking", freq: "5x this week" },
                            { name: "Public Restroom Fans", freq: "2x this month" }
                          ].map((rec, i) => (
                            <div key={i} className="p-4 bg-slate-50 border border-slate-100 rounded-sm">
                               <p className="text-[11px] font-bold text-slate-700 uppercase tracking-tight mb-1">{rec.name}</p>
                               <p className="text-[9px] font-display uppercase tracking-widest text-amber-600 font-black">Frequency: {rec.freq}</p>
                            </div>
                          ))}
                       </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : activeTab === "checklists" ? (
              <div className="space-y-12">
                <div className="flex flex-col gap-2 mb-12">
                  <h2 className="text-4xl font-serif text-slate-900 italic">Checklist Registry</h2>
                  <p className="luxury-label opacity-60">Access and submit property operational checklists</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {[
                    { 
                      id: "maintenance-checklist", 
                      title: "Public Area Checklist", 
                      desc: "Daily preventative maintenance for public spaces",
                      cat: "DIGITAL / FILLABLE"
                    },
                    { 
                      id: "maintenance-checklist-guest", 
                      title: "Guest Room Checklist", 
                      desc: "In-depth room condition and maintenance verification",
                      cat: "DIGITAL / FILLABLE"
                    },
                    { 
                      id: "concierge-checklist", 
                      title: "Concierge & Porter Checklist", 
                      desc: "Operational standards for guest service team",
                      cat: "DIGITAL / FILLABLE"
                    }
                  ].map((item) => (
                    <motion.div
                      key={item.id}
                      whileHover={{ y: -5 }}
                      className="luxury-card group bg-white shadow-sm hover:shadow-xl transition-all duration-500 overflow-hidden"
                    >
                      <div className="p-8">
                        <div className="flex justify-between items-start mb-12">
                          <div className="w-12 h-12 bg-luxury-cream flex items-center justify-center text-gold group-hover:bg-gold group-hover:text-white transition-all">
                            <FileText size={24} strokeWidth={1} />
                          </div>
                        </div>
                        <h3 className="text-xl font-serif italic text-slate-900 mb-8 group-hover:text-gold transition-colors leading-tight h-12 flex items-center">{item.title}</h3>
                        
                        <div className="flex items-center justify-between pt-6 border-t border-slate-50">
                          <span className="text-[9px] font-display uppercase tracking-widest font-bold text-slate-300">{item.cat}</span>
                          <button 
                            onClick={() => {
                              setActiveTab(item.id);
                              setShowHistory(false);
                            }}
                            className="flex items-center gap-2 text-[10px] font-display uppercase tracking-widest font-black text-gold hover:text-luxury-black transition-colors"
                          >
                            Open Checklist <ChevronRight size={14} />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            ) : ["maintenance-checklist", "maintenance-checklist-guest", "concierge-checklist"].includes(activeTab) ? (
              <div className="space-y-8 pb-32">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 no-print">
                  <div>
                    <div className="flex items-center gap-4 mb-2">
                       <h2 className="text-3xl font-serif text-slate-900 italic">
                         {activeTab === "maintenance-checklist" ? "Public Areas Checklist" : 
                          activeTab === "maintenance-checklist-guest" ? "Guest Room Checklist" : 
                          "Concierge & Porter Checklist"}
                       </h2>
                       <div className="h-0.5 w-12 bg-gold/30" />
                    </div>
                    <p className="luxury-label !text-[10px]">Daily Operational & Service Registry</p>
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-4">
                    <div className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-100 shadow-sm">
                      <label className="text-[9px] font-display uppercase tracking-widest text-slate-600 font-bold">Date:</label>
                      <input 
                        type="date" 
                        value={checklistDate}
                        onChange={(e) => setChecklistDate(e.target.value)}
                        className="border-none text-xs font-serif italic text-gold focus:ring-0 p-0 bg-transparent"
                      />
                    </div>
                    
                    <button 
                      onClick={() => setActiveTab("checklists")}
                      className="flex items-center gap-2 px-6 py-3 border border-slate-100 text-[10px] font-display uppercase tracking-widest font-bold hover:bg-slate-50 transition-all shadow-sm"
                    >
                      <X size={14} /> Close & Exit
                    </button>

                    <button 
                      onClick={() => setShowHistory(!showHistory)}
                      className="flex items-center gap-2 px-6 py-3 border border-gold/20 text-[10px] font-display uppercase tracking-widest font-bold hover:bg-gold hover:text-white transition-all shadow-sm"
                    >
                      {showHistory ? <ChevronRight size={14} /> : <HistoryIcon size={14} />}
                      {showHistory ? "Back to Form" : "Submission History"}
                    </button>
                    
                    <button 
                      onClick={() => window.print()}
                      className="flex items-center gap-2 px-6 py-3 bg-luxury-black text-white text-[10px] font-display uppercase tracking-widest font-bold hover:bg-gold transition-all shadow-sm"
                    >
                      <Printer size={14} /> Print / PDF
                    </button>
                  </div>
                </div>

                {showHistory ? (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="luxury-card overflow-hidden no-print"
                  >
                    <div className="p-8 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                       <h3 className="text-xl font-serif italic text-slate-900">Submission History</h3>
                       <p className="text-[10px] font-display uppercase tracking-widest text-slate-600">Recorded Maintenance logs</p>
                    </div>
                    <div className="overflow-x-auto">
                       <table className="w-full text-left">
                          <thead>
                             <tr className="bg-luxury-cream/50 border-b border-gold/10">
                                <th className="px-8 py-5 luxury-label font-black !text-slate-500">Submission Date</th>
                                <th className="px-8 py-5 luxury-label font-black !text-slate-500">Log Type</th>
                                <th className="px-8 py-5 luxury-label font-black !text-slate-500">Completed By</th>
                                <th className="px-8 py-5 luxury-label font-black !text-slate-500 text-right">Actions</th>
                             </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-50">
                             {maintenanceHistory.length === 0 ? (
                               <tr>
                                  <td colSpan={4} className="px-8 py-20 text-center text-slate-500 font-serif italic">No maintenance logs found.</td>
                               </tr>
                             ) : (
                               maintenanceHistory.map((log, i) => (
                                 <tr key={i} className="hover:bg-luxury-cream/20 transition-colors">
                                    <td className="px-8 py-6 font-serif text-slate-900 italic">{log.date}</td>
                                    <td className="px-8 py-6 text-[10px] font-bold text-gold uppercase tracking-widest">
                                      {log.type === "public" ? "Public Area" : log.type === "guest" ? "Guest Room" : "Concierge"}
                                    </td>
                                    <td className="px-8 py-6 text-xs text-slate-500 font-display uppercase tracking-widest">{log.user || "Charles"}</td>
                                    <td className="px-8 py-6 text-right">
                                       <button className="text-gold hover:text-luxury-black transition-colors">
                                          <Download size={18} strokeWidth={1.5} />
                                       </button>
                                    </td>
                                 </tr>
                               ))
                             )}
                          </tbody>
                       </table>
                    </div>
                  </motion.div>
                ) : (
                  <div className="space-y-12">
                     {/* Print-only Header */}
                     <div className="hidden print:block mb-8 border-b-2 border-gold/20 pb-4">
                        <div className="flex justify-between items-end mb-4">
                           <div>
                              <h1 className="text-2xl font-serif italic text-slate-900">
                                {activeTab === "maintenance-checklist" ? "Public Areas Checklist" : 
                                 activeTab === "maintenance-checklist-guest" ? "Guest Room Checklist" : 
                                 "Concierge & Porter Checklist"}
                              </h1>
                              <p className="text-[10px] font-display uppercase tracking-widest text-gold font-bold">{currentCompany?.name} PROPERTY REGISTRY</p>
                           </div>
                           <div className="text-right">
                              <p className="text-[10px] font-display uppercase tracking-widest text-slate-600 font-bold">Submission Date</p>
                              <p className="text-sm font-serif italic text-slate-900">{checklistDate || new Date().toLocaleDateString()}</p>
                           </div>
                        </div>
                     </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 printable-area">
                      {(activeTab === "maintenance-checklist" ? [
                        {
                          title: "Parking Lot & Area",
                          items: ["Signage illuminated & condition", "Parking lot lights", "Parking lot stripes", "Curb Landscaping", "Sidewalks"]
                        },
                        {
                          title: "Dumpster Area",
                          items: ["Dumpster gates & lock", "Dumpster walls", "Dumpster area"]
                        },
                        {
                          title: "Hotel Exterior",
                          items: ["Exterior windows/screens", "Waste cans & ashtrays", "Exterior doors", "Exterior locks", "Lights", "Outside of building", "Check roof"]
                        },
                        {
                          title: "Business Center",
                          items: ["Lighting", "Switches", "Counter", "Waste can", "Carpet", "Chairs", "Cabinets", "Walls", "Equipment"]
                        },
                        {
                          title: "Breakfast Area",
                          items: ["Lighting", "Toasters", "Microwaves", "Other Equipment", "Cabinets", "Electrical outlets", "Counter", "Tables", "Chairs", "Vents", "Walls", "Carpet", "Flooring"]
                        },
                        {
                          title: "Pantry",
                          items: ["Flooring", "Counters", "Drains", "Sinks", "Dishwashing unit", "Refrigeration unit", "Lighting", "Walls", "Shelving"]
                        },
                        {
                          title: "Restrooms",
                          items: ["Signage", "Door", "Mirrors", "Counter/Vanity", "Stall walls", "Sinks", "Toilets", "Walls", "Floors", "Fans/Vents", "Lighting", "Chart for checking"]
                        },
                        {
                          title: "Storage Areas",
                          items: ["Storage area", "Fire rated storage cabinet", "First aid kit", "Storage area walls", "Doors", "Vents", "Paperwork", "Keys for area", "Tool inventory", "Cribs"]
                        },
                        {
                           title: "Lobby & Vending",
                           items: ["Vending machines", "Machines lighting", "Area rug", "Chairs/Couch", "Tables", "Lamps", "Lamp shades", "Telephone", "Plants/Planters"]
                        },
                        {
                           title: "Halls & Stairwells",
                           items: ["Carpet conditions", "Walls conditions", "Lighting", "Fire extinguishers", "Fire alarms", "Exit signs", "Stairwells", "Railing", "Stairwell doors"]
                        },
                        {
                           title: "Housekeeping & Dept",
                           items: ["Doors/walls/floors", "Dryers", "Washers", "Linen Chute", "First Aid Kit", "Emergency Manuals", "MSDS sheets"]
                        },
                        {
                           title: "Pool & Mechanical",
                           items: ["Pool Container", "Gate/Lock", "Furniture", "Chemicals", "Pool deck", "Fence", "Lifesaving equipment", "Pump Room pressure", "Boiler operations"]
                        }
                      ] : activeTab === "maintenance-checklist-guest" ? [
                        {
                          title: "Entrance Door",
                          items: [
                            "Room number (check condition)", 
                            "Outside door frame (tight, clean, good repair)", 
                            "Key card lock (card inserts easily)", 
                            "Screws in hinges (in place & tight)", 
                            "Door (closes properly)", 
                            "Emergency exit sign (in place, correct)", 
                            "Hotel laws (in place)", 
                            "Door handle (secure)", 
                            "Swing bar (check condition)", 
                            "Peep hole (in place, working)", 
                            "Deadbolt (works easily)", 
                            "Inside door (frame tight, clean)", 
                            "Light switch at door (turns on one light)", 
                            "Room door knob bumper (in place, check condition)", 
                            "Entrance light (working, condition)"
                          ]
                        },
                        {
                          title: "Bedroom",
                          items: [
                            "Walls (not scuffed or marked)", 
                            "Table (condition, not wobbly)", 
                            "Chairs/sofas (good condition, secure)", 
                            "Credenza (condition)", 
                            "Credenza drawers (operate smoothly, clean)", 
                            "Credenza mirror (secure, condition)", 
                            "Credenza lamp (working, condition)", 
                            "Desk/Desk drawers (condition, operates smoothly)", 
                            "Desk chair (check condition, rollers)", 
                            "Desk lamp (working, condition)", 
                            "Desk lamp shade (check condition)", 
                            "Table lamp (condition, knobs, working)", 
                            "Table (check stability, condition)", 
                            "Pictures (secure, condition)", 
                            "Mattresses (flipped to correct position, condition, stains)", 
                            "Box springs (condition, stains, against the wall)", 
                            "Box frame (condition, stability)", 
                            "Headboards (condition, secure)", 
                            "Smoke alarms (check battery, condition)", 
                            "Arm chair (condition, stability)", 
                            "Ceilings/corners (check for cobwebs)", 
                            "Floor lamp (condition, stability)", 
                            "Floor lamp shade (condition, knobs)", 
                            "Rug (condition, burns, cleanliness)"
                          ]
                        },
                        {
                          title: "Draperies/Windows",
                          items: [
                            "Drapery rod (secure)", 
                            "Drapery box (secure, condition)", 
                            "Drapery hooks (not missing)", 
                            "Draperies (check condition)", 
                            "Window (frame, track clean, window slides easily)", 
                            "Window locks (locks securely)", 
                            "Window pane/screen (check condition)", 
                            "Window stops (condition, secure)"
                          ]
                        },
                        {
                          title: "Bathroom",
                          items: [
                            "Door (condition)", 
                            "Door knob (operable, condition)", 
                            "Door frame (secure, condition)", 
                            "Clothes hook (secure)", 
                            "Door knob bumper (in place, secure)", 
                            "Towel racks (secure)", 
                            "Toilet tissue holder (secure, good condition)", 
                            "Chrome on shower rods (clean)", 
                            "Bathtub caulking (check condition)", 
                            "Bathtub (holds water securely, drains properly)", 
                            "Bathtub fixtures (secure, check condition)", 
                            "Bathtub shower head (secure, working properly, clean)", 
                            "Bathtub mirror (secure, check condition)", 
                            "Commode (no leaks, flushes properly)", 
                            "Commode seat (secure, cover caps in place)", 
                            "Commode base (screws tight, caps in place)"
                          ]
                        }
                      ] : [
                        {
                          title: "Shift Start / Operational Checks",
                          items: [
                            "Report to duty on time in full uniform and proper grooming",
                            "Attend shift briefing with supervisor",
                            "Check daily arrivals, departures, and VIP guests",
                            "Review group arrivals and special requirements",
                            "Inspect lobby, entrance, and driveway cleanliness",
                            "Check luggage storage area is clean and organized",
                            "Ensure trolleys are clean and in good condition",
                            "Check hotel vehicles (if applicable) are clean and ready",
                            "Confirm bell desk logbook is updated",
                            "Check communication devices (radio/phone) are working",
                            "Verify signage and display boards are properly placed",
                            "Review weather conditions and prepare umbrellas if needed",
                            "Confirm transport bookings for the day",
                            "Check lost & found log updates",
                            "Ensure all porter equipment is ready for service"
                          ]
                        },
                        {
                          title: "Guest Arrival Service",
                          items: [
                            "Greet all arriving guests warmly (eye contact, smile)",
                            "Assist guests with luggage promptly upon arrival",
                            "Open car doors and welcome guests",
                            "Escort guests to reception/check-in area",
                            "Inform Front Office of guest arrival if needed",
                            "Tag and label luggage correctly",
                            "Handle luggage with care and professionalism",
                            "Provide brief hotel orientation (facilities, timings)",
                            "Escort guests to rooms after check-in",
                            "Demonstrate room features (AC, TV, safe, etc.)",
                            "Confirm guest satisfaction before leaving room",
                            "Offer additional assistance (tours, transport, dining)",
                            "Prioritize VIP and elderly guest assistance",
                            "Manage multiple arrivals efficiently during peak times",
                            "Maintain professional body language at all times"
                          ]
                        },
                        {
                          title: "Guest Departure Service",
                          items: [
                            "Respond promptly to guest departure requests",
                            "Assist with luggage collection from rooms",
                            "Verify room number and guest details before handling luggage",
                            "Transport luggage safely to lobby or vehicle",
                            "Confirm transport arrangements (taxi, shuttle, private car)",
                            "Load luggage carefully into vehicles",
                            "Thank guests and bid farewell courteously",
                            "Inform Front Office once guest has departed",
                            "Check lobby for unattended luggage",
                            "Ensure luggage storage for late departures is logged",
                            "Handle express check-outs efficiently",
                            "Assist with group departures coordination",
                            "Provide directions or travel assistance if needed",
                            "Ensure zero luggage mishandling incidents",
                            "Maintain smooth traffic flow at entrance"
                          ]
                        },
                        {
                          title: "Luggage Handling & Storage",
                          items: [
                            "Tag all luggage with correct guest details",
                            "Store luggage in designated areas securely",
                            "Maintain proper luggage logbook entries",
                            "Ensure no luggage is misplaced or unattended",
                            "Handle fragile items with extra care",
                            "Follow SOP for long-term luggage storage",
                            "Verify luggage before releasing to guests",
                            "Maintain cleanliness of storage area",
                            "Monitor high-volume luggage periods (groups/events)",
                            "Assist with oversized or special luggage",
                            "Report any damaged luggage immediately",
                            "Ensure security procedures are followed at all times",
                            "Keep luggage trolleys organized",
                            "Avoid stacking luggage unsafely",
                            "Maintain efficiency during peak hours"
                          ]
                        },
                        {
                          title: "Concierge & Guest Assistance",
                          items: [
                            "Provide directions and local area information",
                            "Assist guests with transport bookings (taxi, shuttle)",
                            "Recommend restaurants, tours, and attractions",
                            "Handle guest requests promptly (within 10-15 mins)",
                            "Coordinate with Front Office for guest needs",
                            "Arrange wake-up calls or reminders if requested",
                            "Assist with delivery of items to guest rooms",
                            "Handle guest complaints politely and escalate if needed",
                            "Provide umbrellas during bad weather",
                            "Assist elderly or disabled guests with extra care",
                            "Maintain knowledge of hotel services and promotions",
                            "Help guests with luggage during room changes",
                            "Provide accurate information at all times",
                            "Ensure guest satisfaction with every interaction",
                            "Maintain professional communication at all times"
                          ]
                        },
                        {
                          title: "Transport & Valet Coordination",
                          items: [
                            "Coordinate taxi and shuttle services for guests",
                            "Ensure timely arrival of booked transport",
                            "Maintain transport booking log",
                            "Assist guests with loading/unloading luggage",
                            "Coordinate airport transfers",
                            "Communicate delays or issues to guests promptly",
                            "Ensure hotel vehicles are clean and presentable",
                            "Guide drivers to correct pickup/drop-off points",
                            "Assist with valet parking if applicable",
                            "Maintain smooth traffic flow at entrance",
                            "Track transport schedules for VIP guests",
                            "Coordinate group transport logistics",
                            "Ensure guest safety during vehicle boarding",
                            "Verify transport details before dispatch",
                            "Maintain professional interaction with drivers"
                          ]
                        },
                        {
                          title: "Communication & Coordination",
                          items: [
                            "Maintain constant communication with Front Office",
                            "Coordinate with Housekeeping for room readiness",
                            "Liaise with F&B for guest requests",
                            "Communicate VIP arrivals to all departments",
                            "Update bell desk logbook regularly",
                            "Report maintenance issues immediately",
                            "Coordinate with security for safety concerns",
                            "Inform team of high-priority tasks",
                            "Assist other departments during peak hours",
                            "Ensure smooth inter-departmental communication",
                            "Follow up on pending guest requests",
                            "Share updates during shift handover",
                            "Maintain clear and professional communication",
                            "Escalate unresolved issues promptly",
                            "Support teamwork across departments"
                          ]
                        },
                        {
                          title: "Safety, Security & Compliance",
                          items: [
                            "Monitor lobby and entrance for suspicious activity",
                            "Ensure guest belongings are handled securely",
                            "Follow hotel security procedures at all times",
                            "Report lost & found items immediately",
                            "Maintain record of lost & found items",
                            "Ensure emergency exits are clear",
                            "Follow fire and safety protocols",
                            "Assist during emergency situations if required",
                            "Avoid unauthorized access to guest areas",
                            "Maintain confidentiality of guest information",
                            "Ensure safe handling of heavy luggage",
                            "Prevent accidents in lobby/driveway area",
                            "Report hazards or risks immediately",
                            "Ensure compliance with hotel SOPs",
                            "Maintain awareness of safety procedures"
                          ]
                        },
                        {
                          title: "Lobby & Public Area Management",
                          items: [
                            "Ensure lobby is clean and presentable at all times",
                            "Arrange luggage trolleys neatly",
                            "Monitor guest flow in lobby area",
                            "Assist guests entering/exiting the hotel",
                            "Ensure entrance area is clutter-free",
                            "Check lighting and ambiance in lobby",
                            "Coordinate with housekeeping for cleanliness",
                            "Maintain professional posture at bell desk",
                            "Assist with event guest directions",
                            "Monitor waiting times for guests",
                            "Ensure signage is clear and visible",
                            "Keep umbrella stands organized",
                            "Ensure music/ambience is appropriate",
                            "Assist during peak lobby traffic",
                            "Maintain welcoming atmosphere at all times"
                          ]
                        },
                        {
                          title: "End of Day / Shift Handover",
                          items: [
                            "Update bell desk logbook with all activities",
                            "Ensure all luggage movements are recorded",
                            "Handover pending tasks to next shift",
                            "Confirm all guest requests have been completed",
                            "Report any incidents or issues to supervisor",
                            "Check storage area for remaining luggage",
                            "Ensure lobby and entrance are clean and organized",
                            "Return equipment (radios, keys, trolleys) to proper place",
                            "Verify transport bookings for next shift",
                            "Update lost & found records",
                            "Report maintenance issues noticed during shift",
                            "Confirm VIP arrangements for next shift",
                            "Share important updates during handover briefing",
                            "Ensure no guest requests are left unattended",
                            "Clock out as per schedule"
                          ]
                        }
                      ]).map((section, idx) => (
                        <div key={idx} className="luxury-card p-6 bg-white border-t-2 border-t-gold/20">
                           <h4 className="text-[11px] font-display uppercase tracking-[0.25em] font-black text-slate-800 mb-6 pb-2 border-b border-slate-50">{section.title}</h4>
                           <div className="space-y-4">
                              {section.items.map((item, itemIdx) => {
                                const itemKey = `${activeTab}-${section.title}-${item}`;
                                const val = checklistValues[itemKey];
                                return (
                                  <div key={itemIdx} className="flex items-start gap-3 group border-b border-slate-50 pb-2 mb-2 last:border-0 print:border-slate-100 print:mb-1 print:pb-1">
                                     <div className="flex-1">
                                        <div className="flex items-start gap-2">
                                           <span className="hidden print:inline-flex items-center justify-center w-3 h-3 border border-slate-400 mt-0.5 shrink-0 text-[8px] font-bold">
                                             {val === 'ok' ? "✓" : ""}
                                           </span>
                                           <p className="text-[12px] text-slate-950 leading-tight group-hover:text-gold transition-colors font-bold print:text-[8px] print:font-normal">{item}</p>
                                        </div>
                                        <div className="mt-2 flex gap-2 no-print">
                                           <button 
                                              onClick={() => setChecklistValues(prev => ({ ...prev, [itemKey]: val === 'ok' ? null : 'ok' }))}
                                              className={cn(
                                                "text-[8px] px-3 py-1 font-display uppercase font-bold transition-all border shrink-0",
                                                val === 'ok' ? "bg-emerald-700 text-white border-emerald-700" : "bg-white text-slate-950 border-slate-300 hover:border-emerald-400 hover:text-emerald-700 shadow-sm"
                                              )}
                                           >
                                              OK
                                           </button>
                                           <button 
                                              onClick={() => setChecklistValues(prev => ({ ...prev, [itemKey]: val === 'repair' ? null : 'repair' }))}
                                              className={cn(
                                                "text-[8px] px-3 py-1 font-display uppercase font-bold transition-all border shrink-0",
                                                val === 'repair' ? "bg-amber-700 text-white border-amber-700" : "bg-white text-slate-950 border-slate-300 hover:border-amber-400 hover:text-amber-700 shadow-sm"
                                              )}
                                           >
                                              Needs Repair
                                           </button>
                                        </div>
                                        <div className="hidden print:flex gap-4 mt-1">
                                          <span className={cn("text-[6px] font-bold uppercase", val === 'repair' ? "text-slate-900 underline" : "text-slate-300")}>[ ] Needs Repair</span>
                                        </div>
                                     </div>
                                  </div>
                                );
                              })}
                           </div>
                        </div>
                      ))}
                    </div>

                    <div className="luxury-card p-8 bg-white max-w-2xl notes-area">
                       <h4 className="text-[10px] font-display uppercase tracking-widest font-black text-slate-800 mb-4">Additional Notes & Findings</h4>
                       {/* Hidden on screen for print if blank, but usually we want to show it */}
                       <div className="hidden print:block text-xs font-serif italic text-slate-700 min-h-[100px] whitespace-pre-wrap">
                          {checklistNotes || "No additional notes recorded for this inspection."}
                       </div>
                       <textarea 
                          value={checklistNotes}
                          onChange={(e) => setChecklistNotes(e.target.value)}
                          placeholder="Please specify any additional details or maintenance requirements found during inspection..."
                          className="w-full h-32 p-4 bg-slate-50 border border-slate-100 text-sm font-serif italic focus:ring-1 focus:ring-gold focus:border-gold outline-none resize-none no-print"
                       />
                    </div>

                    <div className="hidden print:flex justify-between items-end mt-12 pt-8 border-t border-slate-100">
                       <div className="signature-line">Supervisor / Manager Signature</div>
                       <div className="signature-line">Inspector Signature</div>
                    </div>

                    <div className="flex justify-start pt-8 pb-32 no-print">
                       <button 
                          onClick={() => {
                            const newLog = { 
                              date: checklistDate, 
                              user: currentUser?.displayName || "Charles", 
                              type: activeTab === "maintenance-checklist" ? "public" : 
                                    activeTab === "maintenance-checklist-guest" ? "guest" : "concierge",
                              values: checklistValues,
                              notes: checklistNotes 
                            };

                            // Check for repair items
                            const repairItems = Object.entries(checklistValues)
                              .filter(([key, val]) => key.startsWith(activeTab) && val === 'repair');
                            
                            if (repairItems.length > 0) {
                              import('./services/notificationService').then(({ notificationService, NotificationType }) => {
                                notificationService.broadcast({
                                  title: 'Urgent Maintenance Required',
                                  message: `${repairItems.length} items marked for repair in ${newLog.type} checklist by ${newLog.user}.`,
                                  type: NotificationType.MAINTENANCE,
                                  link: 'equipment-logs'
                                });
                              });
                            }

                            setMaintenanceHistory([newLog, ...maintenanceHistory]);
                            alert("Checklist successfully submitted to digitalmedia@cml.com.fj");
                            setShowHistory(true);
                            setChecklistValues({});
                            setChecklistNotes("");
                          }}
                          className="luxury-button !px-12 !py-5 text-sm uppercase tracking-[0.4em] font-black group flex items-center gap-4"
                       >
                          Submit Checklist <ChevronRight size={18} className="translate-x-0 group-hover:translate-x-1 transition-transform" />
                       </button>
                    </div>
                  </div>
                )}
              </div>
            ) : activeTab === "maintenance-guidelines" ? (
              <div className="space-y-8">
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h2 className="text-3xl font-serif text-slate-900 mb-2 italic">Maintenance Guidelines</h2>
                    <p className="luxury-label !text-[10px]">Standard Operating Procedures for Property Management</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                   {/* Public Areas Section */}
                   <div className="luxury-card p-10 bg-white space-y-10 border-t-4 border-t-gold">
                      <div className="flex items-center gap-6">
                         <div className="w-16 h-16 bg-luxury-cream text-gold flex items-center justify-center">
                            <Hotel size={32} strokeWidth={1} />
                         </div>
                         <div>
                            <h3 className="text-3xl font-serif italic text-slate-900">Public Areas</h3>
                            <p className="luxury-label !text-[8px] opacity-60">Preventive Maintenance Process</p>
                         </div>
                      </div>

                      <div className="space-y-12">
                         <section>
                            <h4 className="text-[10px] font-display uppercase tracking-[0.25em] font-black text-gold mb-6 flex items-center gap-4">
                               Steps to Complete Process
                               <div className="h-px flex-1 bg-gold/10" />
                            </h4>
                            <div className="space-y-6">
                               {[
                                 "Take a walk around all public areas (depending on the size of your site you may have to break it up into multiple days).",
                                 "Complete a visual inspection of the area(s).",
                                 "Perform all necessary corrective work.",
                                 "In a binder index the completed property checklist(s) or save as a computer file.",
                                 "Notify Owner/GM of trends and any additional concerns."
                               ].map((step, i) => (
                                 <div key={i} className="flex gap-6 items-start group">
                                    <span className="font-serif italic text-gold text-2xl leading-none opacity-40 group-hover:opacity-100 transition-opacity">{i+1}.</span>
                                    <p className="text-[13px] text-slate-600 leading-relaxed font-medium">{step}</p>
                                 </div>
                               ))}
                            </div>
                         </section>

                         <section>
                            <h4 className="text-[10px] font-display uppercase tracking-[0.25em] font-black text-gold mb-6 flex items-center gap-4">
                               Schedule Property Maintenance
                               <div className="h-px flex-1 bg-gold/10" />
                            </h4>
                            <div className="grid grid-cols-1 gap-4">
                               {[
                                 "Schedule preventive checks within a year's timeframe or more frequently if determined by management.",
                                 "Customize scheduling for individual property needs in coordination with GM/Ownership.",
                                 "Schedule during slow hours to minimize impact on guest experience and enjoyment.",
                                 "Maintain a fully-equipped maintenance cart for efficient and timely implementation."
                               ].map((item, i) => (
                                 <div key={i} className="flex gap-4 items-center p-4 bg-slate-50/50 border border-slate-100 rounded-sm italic text-[11px] text-slate-500">
                                    <div className="w-1 h-1 bg-gold rounded-full shrink-0" />
                                    {item}
                                 </div>
                               ))}
                            </div>
                         </section>

                         <section className="bg-luxury-black p-8 text-white relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-24 h-24 bg-gold/5 rounded-full translate-x-1/2 -translate-y-1/2" />
                            <h4 className="text-[10px] font-display uppercase tracking-[0.3em] font-black text-gold mb-6">Securing External Bids</h4>
                            <div className="space-y-4">
                               {[
                                 "Obtain three competitive bids per contract",
                                 "Avoid automatic renewal clauses in agreements",
                                 "Request optional 30-day cancellation clauses",
                                 "Include termination rights for poor workmanship"
                               ].map((tip, i) => (
                                 <div key={i} className="flex items-center gap-3 text-[10px] font-display uppercase tracking-widest text-slate-300">
                                    <ChevronRight size={14} className="text-gold" />
                                    {tip}
                                 </div>
                               ))}
                            </div>
                         </section>

                         <section className="flex items-center justify-between p-6 bg-luxury-cream/30 border border-gold/10">
                            <div>
                               <h5 className="text-[10px] font-display uppercase tracking-widest font-black text-slate-800 mb-1">Record Keeping</h5>
                               <p className="text-[11px] text-slate-500 italic">Maintain checks in three-ring binder or secure digital storage.</p>
                            </div>
                            <FileText className="text-gold/40" size={24} />
                         </section>
                      </div>
                   </div>

                   {/* Guest Room Section */}
                   <div className="luxury-card p-10 bg-white border-t-4 border-t-gold space-y-10">
                      <div className="flex items-center gap-6">
                         <div className="w-16 h-16 bg-luxury-cream text-gold flex items-center justify-center">
                            <Hotel size={32} strokeWidth={1} />
                         </div>
                         <div>
                            <h3 className="text-3xl font-serif italic text-slate-900">Guest Room</h3>
                            <p className="luxury-label !text-[8px] opacity-60">Preventive Maintenance Process</p>
                         </div>
                      </div>

                      <div className="space-y-12">
                         <section>
                            <h4 className="text-[10px] font-display uppercase tracking-[0.25em] font-black text-gold mb-6 flex items-center gap-4">
                               Steps to Complete Process
                               <div className="h-px flex-1 bg-gold/10" />
                            </h4>
                            <div className="space-y-6">
                               {[
                                 "Select a guest room(s) for maintenance.",
                                 "Complete a visual inspection.",
                                 "Note any items needing repair or attention.",
                                 "Perform all necessary corrective work in the guest room/suite.",
                                 "In a binder, index the completed checklist form under the appropriate room number or save as a computer file.",
                                 "In the front of the binder, record the room number on the Preventative Maintenance Summary under the appropriate quarter.",
                                 "Notify Owner/GM of trends and any additional concerns."
                               ].map((step, i) => (
                                 <div key={i} className="flex gap-6 items-start group">
                                    <span className="font-serif italic text-gold text-2xl leading-none opacity-40 group-hover:opacity-100 transition-opacity">{i+1}.</span>
                                    <p className="text-[13px] text-slate-600 leading-relaxed font-medium">{step}</p>
                                 </div>
                               ))}
                            </div>
                         </section>

                         <section>
                            <h4 className="text-[10px] font-display uppercase tracking-[0.25em] font-black text-gold mb-6 flex items-center gap-4">
                               Scheduling Guest Room Maintenance
                               <div className="h-px flex-1 bg-gold/10" />
                            </h4>
                            <div className="grid grid-cols-1 gap-4">
                               {[
                                 "Schedule preventive checks within a year's timeframe or more frequently if determined by ownership/management.",
                                 "Customize scheduling for individual property needs in coordination with GM/Ownership.",
                                 "Work with your Owner, General Manager, Regional manager or Management.",
                                 "Company to determine how often this program should take place.",
                                 "Prepare fully-equipped maintenance carts to implement and maintain the program efficiently and correctly."
                               ].map((item, i) => (
                                 <div key={i} className="flex gap-4 items-center p-4 bg-slate-50/50 border border-slate-100 rounded-sm italic text-[11px] text-slate-500">
                                    <div className="w-1 h-1 bg-gold rounded-full shrink-0" />
                                    {item}
                                 </div>
                               ))}
                            </div>
                         </section>

                         <section className="bg-luxury-black p-8 text-white relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-24 h-24 bg-gold/5 rounded-full translate-x-1/2 -translate-y-1/2" />
                            <h4 className="text-[10px] font-display uppercase tracking-[0.3em] font-black text-gold mb-6">Securing Bids Standards</h4>
                            <div className="space-y-4">
                               {[
                                 "Obtain no less than three competitive bids per contract",
                                 "Avoid automatic renewal clauses from contracts",
                                 "Request the option of a 30-day cancellation",
                                 "Include termination rights for poor quality or workmanship"
                               ].map((tip, i) => (
                                 <div key={i} className="flex items-center gap-3 text-[10px] font-display uppercase tracking-widest text-slate-300">
                                    <ChevronRight size={14} className="text-gold" />
                                    {tip}
                                 </div>
                               ))}
                            </div>
                         </section>

                         <section className="p-6 bg-luxury-cream/30 border border-gold/10 space-y-4">
                            <div className="flex items-center justify-between">
                               <div>
                                  <h5 className="text-[10px] font-display uppercase tracking-widest font-black text-slate-800 mb-1">Record Keeping</h5>
                                  <p className="text-[11px] text-slate-500 italic">One inspection sheet per room, indexed by room number.</p>
                               </div>
                               <FileText className="text-gold/40" size={24} />
                            </div>
                            <p className="text-[10.5px] leading-relaxed text-slate-500 border-t border-gold/10 pt-4">
                               Place the <span className="font-bold text-slate-700">Preventive Maintenance Summary</span> in the very beginning of the binder to summarize frequency by quarter.
                            </p>
                         </section>

                         <div className="pt-6 border-t border-slate-100">
                            <p className="text-[11px] text-slate-500 italic leading-relaxed">
                               <span className="font-bold text-gold uppercase tracking-widest text-[9px] mr-2">Additional Note:</span>
                               Complete room preventive maintenance on a daily basis to stay ahead. Each hotel has a responsibility to maintain records for unannounced inspections.
                            </p>
                         </div>
                      </div>
                   </div>
                </div>
              </div>
            ) : activeTab === "hr" ? (
              <div className="space-y-8">
                <div className="flex items-center justify-between mb-12 no-print">
                  <div>
                    <h2 className="text-4xl font-serif text-slate-900 mb-2 italic">HR Forms Registry</h2>
                    <p className="luxury-label !text-[11px] opacity-60">
                      Access and submit internal property documentation and compliance forms via secure external portal
                    </p>
                  </div>
                </div>

                <div className="space-y-16">
                  {Array.from(new Set(HR_FORMS.map(f => f.category || "General"))).map((category) => (
                    <section key={category} className="space-y-6">
                      <div className="flex items-center gap-4">
                        <h3 className="text-[11px] font-display uppercase tracking-[0.4em] font-black text-gold/60">{category}</h3>
                        <div className="h-px flex-1 bg-gold/10" />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {HR_FORMS.filter(f => (f.category || "General") === category).map((form) => (
                          <motion.div 
                            key={form.id} 
                            whileHover={{ y: -4, scale: 1.02 }}
                            onClick={() => window.open(form.url, "_blank")}
                            className="bg-white p-8 border border-slate-100 hover:border-gold hover:shadow-2xl hover:shadow-gold/10 transition-all cursor-pointer flex flex-col group relative overflow-hidden"
                          >
                            <div className="absolute top-0 right-0 p-4 opacity-40 group-hover:opacity-100 transition-opacity">
                              <ExternalLink size={14} className="text-gold" />
                            </div>

                            <div className="flex justify-between items-start mb-6">
                               <div className="w-12 h-12 bg-slate-50 text-slate-400 flex items-center justify-center group-hover:bg-gold group-hover:text-white transition-all rounded-lg">
                                 <FileText size={20} strokeWidth={1.5} />
                               </div>
                               <div className="flex flex-col items-end">
                                  <span className="text-[7px] font-display uppercase tracking-widest px-2 py-1 bg-emerald-50 text-emerald-600 font-bold group-hover:bg-emerald-500 group-hover:text-white transition-colors rounded-sm">
                                    Secure Portal
                                  </span>
                               </div>
                            </div>

                            <h3 className="text-lg font-serif italic text-slate-900 mb-2 leading-tight group-hover:text-gold transition-colors">{form.name}</h3>
                            <p className="text-[9px] text-slate-400 luxury-label !opacity-60 mb-8">Opens in secure external encrypted window</p>

                            <div className="mt-auto pt-6 border-t border-slate-50 flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-gold animate-pulse" />
                                <span className="text-[8px] font-display uppercase tracking-[0.2em] text-slate-500 font-black">
                                   REF: {form.id.toUpperCase()}
                                </span>
                              </div>
                              <button className="px-4 py-2 bg-slate-50 text-gold flex items-center gap-2 text-[9px] uppercase tracking-[0.2em] font-black group-hover:bg-gold group-hover:text-white transition-all rounded-md">
                                Open Portal <ChevronRight size={12} />
                              </button>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </section>
                  ))}

                  <div className="bg-luxury-black p-16 text-center relative overflow-hidden rounded-xl shadow-2xl">
                     <div className="absolute inset-0 opacity-10">
                        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-gold/30 via-transparent to-transparent" />
                     </div>
                     <Shield size={56} className="text-gold mx-auto mb-8 opacity-30" />
                     <h4 className="text-2xl font-serif italic text-gold mb-4">Encryption & Security Notice</h4>
                     <p className="max-w-2xl mx-auto text-[11px] font-display uppercase tracking-[0.4em] text-slate-300 leading-loose">
                       Form submissions are routed through CML Digital’s high-security SSL WordPress integration. 
                       Each session generates an encrypted token for property compliance.
                     </p>
                  </div>
                </div>
              </div>
            ) : activeTab === "property-overview" ? (
              <div className="space-y-24 pb-32">
                {/* Hero Section */}
                <motion.div 
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 1.2 }}
                  className="relative h-[70vh] -mx-10 -mt-10 overflow-hidden group mb-12 shadow-2xl"
                >
                  <img 
                    src="/src/assets/images/regenerated_image_1778546396685.png" 
                    alt="Wyndham Garden Exterior" 
                    className="w-full h-full object-cover transition-transform duration-[3s] ease-out group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-luxury-black/90 via-luxury-black/20 to-transparent"></div>
                  <div className="absolute bottom-0 left-0 p-20 w-full max-w-5xl">
                    <motion.div
                      initial={{ opacity: 0, y: 30 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.5, duration: 1 }}
                    >
                      <p className="text-gold font-display text-xs uppercase tracking-[0.5em] mb-6 font-black flex items-center gap-4">
                        <span className="w-12 h-px bg-gold/50"></span>
                        Fiji's Premier Waterfront Retreat
                      </p>
                      <h2 className="text-7xl font-serif text-white italic leading-[1.1]">Wyndham Garden <br/><span className="text-white/80">Wailoaloa Beach Fiji</span></h2>
                      <div className="mt-12 flex gap-12">
                         <div className="space-y-1">
                            <p className="text-[10px] font-display uppercase tracking-[0.2em] text-slate-700">Location</p>
                            <p className="text-lg font-serif italic text-white">Nadi Waterfront</p>
                         </div>
                         <div className="space-y-1">
                            <p className="text-[10px] font-display uppercase tracking-[0.2em] text-slate-700">Distance</p>
                            <p className="text-lg font-serif italic text-white">15 Min from Airport</p>
                         </div>
                         <div className="space-y-1">
                            <p className="text-[10px] font-display uppercase tracking-[0.2em] text-slate-700">Floors</p>
                            <p className="text-lg font-serif italic text-white">7 Levels of Luxury</p>
                         </div>
                      </div>
                    </motion.div>
                  </div>
                </motion.div>

                {/* Introduction & Quick Facts */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-20">
                  <div className="lg:col-span-8 space-y-20">
                    <section>
                      <div className="flex items-center gap-4 mb-10">
                        <h3 className="text-4xl font-serif italic text-slate-900 leading-tight">Property Concept</h3>
                        <div className="flex-1 h-px bg-slate-100"></div>
                      </div>
                      <p className="text-slate-700 font-serif italic text-2xl leading-relaxed mb-12">
                        Fiji's newest 4 star, Wyndham Garden Wailoaloa Beach Fiji 7-floor beachfront serviced hotel is idyllically situated on the beach of Wailoaloa with a unique view of the sea and nearby surrounding Islands.
                      </p>
                      <img 
                        src="/src/assets/images/regenerated_image_1778546992084.png" 
                        alt="Aerial view" 
                        className="w-full h-[400px] object-cover mb-12 border border-slate-50 shadow-lg"
                      />
                      <p className="text-slate-600 font-serif italic text-lg leading-relaxed">
                        We have thought of almost everything you'll need while you're here with our modern and comfortable rooms which come with IP TV display, Study desk, balcony, and Air-con. The property offers great facilities such as a spa, deli shop, pool, beach deck dining, and conference rooms.
                      </p>
                    </section>

                    <section className="space-y-12">
                       <div className="flex items-center gap-4 mb-10">
                        <h3 className="text-4xl font-serif italic text-slate-900 leading-tight">Room Inventory</h3>
                        <div className="flex-1 h-px bg-slate-100"></div>
                      </div>
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                          {[
                            { name: "Beachfront Executive King", size: "49.38m²", sleeps: "3 Guests", img: "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?auto=format&fit=crop&q=80&w=800" },
                            { name: "Garden Ocean View King", size: "30.28m²", sleeps: "2 Guests", img: "https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&q=80&w=800" },
                            { name: "Garden Ocean View Twin", size: "30.28m²", sleeps: "2 Guests", img: "https://images.unsplash.com/photo-1566665797739-1674de7a421a?auto=format&fit=crop&q=80&w=800" },
                            { name: "Garden King Room", size: "30.28m²", sleeps: "2 Guests", img: "https://images.unsplash.com/photo-1591088398332-8a77d397ef84?auto=format&fit=crop&q=80&w=800" }
                          ].map((room, i) => (
                            <motion.div 
                              key={i} 
                              whileHover={{ y: -10 }}
                              className="luxury-card group overflow-hidden bg-white shadow-xl"
                            >
                               <div className="h-64 overflow-hidden relative">
                                  <img src={room.img} alt={room.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                                  <div className="absolute top-6 right-6 bg-white/90 backdrop-blur-sm px-4 py-1 text-[9px] font-display uppercase tracking-[0.2em] font-black italic">
                                     {room.size}
                                  </div>
                               </div>
                               <div className="p-8">
                                  <h4 className="text-xl font-serif italic text-slate-900 mb-2">{room.name}</h4>
                                  <p className="text-[10px] font-display uppercase tracking-widest text-slate-700 italic">Occupancy: {room.sleeps}</p>
                               </div>
                            </motion.div>
                          ))}
                       </div>
                    </section>
                  </div>

                  <div className="lg:col-span-4 space-y-12">
                    <div className="sticky top-12 space-y-12">
                      <div className="luxury-card p-10 bg-luxury-black text-white shadow-2xl relative overflow-hidden group">
                        <div className="absolute -right-12 -top-12 w-48 h-48 bg-gold/5 rounded-full blur-3xl group-hover:bg-gold/10 transition-colors"></div>
                        <h4 className="text-[10px] font-display uppercase tracking-[0.4em] font-black text-gold mb-10 pb-4 border-b border-gold/10 relative z-10 italic">Core Amenities</h4>
                        <div className="grid grid-cols-1 gap-8 relative z-10">
                           {[
                             { label: "Free High Speed Wi-Fi", icon: Globe, desc: "Seamless connectivity throughout" },
                             { label: "Swimming Pool & Spa", icon: Waves, desc: "Infinity edge recreation" },
                             { label: "Business Centre", icon: Briefcase, desc: "24/7 productivity suite" },
                             { label: "Meeting Space", icon: Users, desc: "Executive event facilities" },
                             { label: "IP TV Display", icon: Smartphone, desc: "Next-gen entertainment" },
                             { label: "Full Air-conditioning", icon: Wind, desc: "Individual climate control" }
                           ].map((feature, i) => (
                             <div key={i} className="flex items-start gap-4 group">
                                <div className="w-10 h-10 bg-white/5 border border-white/10 flex items-center justify-center text-gold group-hover:border-gold group-hover:bg-gold group-hover:text-white transition-all duration-500">
                                   <feature.icon size={16} strokeWidth={1} />
                                </div>
                                <div>
                                   <p className="text-[11px] font-display uppercase tracking-widest text-white transition-all mb-1 font-bold">{feature.label}</p>
                                   <p className="text-[9px] text-slate-300 font-serif italic italic not-italic font-bold">{feature.desc}</p>
                                </div>
                             </div>
                           ))}
                        </div>
                      </div>

                      <div className="luxury-card p-10 bg-white border border-slate-100 shadow-xl italic-headings">
                         <h4 className="text-[10px] font-display uppercase tracking-[0.4em] font-black text-slate-800 mb-10 pb-4 border-b border-gold/10 italic">Property Highlights</h4>
                         <div className="space-y-6">
                            {[
                              "Beachfront Serviced Hotel",
                              "15 Mins from Nadi Airport",
                              "90 Luxury Guest Rooms",
                              "360-Degree Scenic Rooftop",
                              "Waterfront Event Deck"
                            ].map((highlight, i) => (
                              <div key={i} className="flex items-center gap-3">
                                 <div className="w-1.5 h-1.5 bg-gold rounded-full"></div>
                                 <span className="text-xs font-serif italic text-slate-600">{highlight}</span>
                              </div>
                            ))}
                         </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Culinary Excellence Section */}
                <section className="space-y-16 -mx-10 bg-luxury-black text-white p-20 py-32 relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-20 opacity-5">
                     <Hotel size={500} strokeWidth={0.5} />
                  </div>
                  <div className="max-w-6xl mx-auto relative z-10">
                    <div className="flex flex-col items-center text-center mb-20">
                      <p className="text-gold font-display text-[10px] uppercase tracking-[0.6em] mb-6 font-black italic">Gastronomy</p>
                      <h3 className="text-5xl font-serif italic text-white mb-8">Culinary Masterpieces</h3>
                      <p className="max-w-2xl text-slate-300 font-serif italic text-lg leading-relaxed">
                        Are you searching for a dining experience that combines breathtaking views with mouthwatering cuisine? Look no further.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 mb-20 items-center">
                       <div className="space-y-10 order-2 lg:order-1">
                          <div className="space-y-4">
                             <h4 className="text-3xl font-serif italic text-gold">Sky Garden Restaurant & Bar</h4>
                             <p className="text-slate-600 font-serif italic leading-relaxed text-lg italic">
                                Offering not just delicious food but also 360-degree scenic rooftop views overlooking Wailoaloa Beach and Nadi Bay.
                             </p>
                          </div>
                          <div className="flex gap-4">
                             <div className="h-64 flex-1 overflow-hidden">
                                <img 
                                  src="https://images.unsplash.com/photo-1550966841-3ee7adac1661?auto=format&fit=crop&q=80&w=800" 
                                  className="w-full h-full object-cover transition-transform duration-700 hover:scale-110" 
                                  alt="Rooftop dining"
                                />
                             </div>
                             <div className="h-64 flex-1 overflow-hidden">
                                <img 
                                  src="https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&q=80&w=800" 
                                  className="w-full h-full object-cover transition-transform duration-700 hover:scale-110" 
                                  alt="Cocktails"
                                />
                             </div>
                          </div>
                       </div>
                       <div className="h-[500px] overflow-hidden order-1 lg:order-2 shadow-2xl border border-white/5">
                          <img 
                            src="https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&q=80&w=2000" 
                            className="w-full h-full object-cover transition-transform duration-[4s] hover:scale-105" 
                            alt="Signature Dish"
                          />
                       </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
                       <div className="h-[500px] overflow-hidden shadow-2xl border border-white/5">
                          <img 
                            src="https://images.unsplash.com/photo-1533777857889-4be7c70b33f7?auto=format&fit=crop&q=80&w=2000" 
                            className="w-full h-full object-cover transition-transform duration-[4s] hover:scale-105" 
                            alt="Oceanfront dining"
                          />
                       </div>
                       <div className="space-y-10">
                          <div className="space-y-4">
                             <h4 className="text-3xl font-serif italic text-gold">Jasmine Beachfront & Lobster Bar</h4>
                             <p className="text-slate-600 font-serif italic leading-relaxed text-lg italic">
                                Offering mouthwatering seafood cuisines and delectable desserts. Our talented chefs have crafted a menu filled with exquisitely tasty dishes to satisfy all palates.
                             </p>
                          </div>
                          <div className="flex gap-4">
                             <div className="h-64 flex-1 overflow-hidden">
                                <img 
                                  src="https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&q=80&w=800" 
                                  className="w-full h-full object-cover transition-transform duration-700 hover:scale-110" 
                                  alt="Wine selection"
                                />
                             </div>
                             <div className="h-64 flex-1 overflow-hidden">
                                <img 
                                  src="https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&q=80&w=800" 
                                  className="w-full h-full object-cover transition-transform duration-700 hover:scale-110" 
                                  alt="Fine dining table"
                                />
                             </div>
                          </div>
                       </div>
                    </div>
                  </div>
                </section>

                {/* Events & Meeting Section */}
                <section className="space-y-16">
                  <div className="flex flex-col items-center text-center">
                    <p className="text-gold font-display text-[10px] uppercase tracking-[0.6em] mb-6 font-black italic">MICE & Events</p>
                    <h3 className="text-5xl font-serif italic text-slate-900 italic mb-8">Conferences with Character</h3>
                    <p className="max-w-2xl text-slate-500 font-serif italic text-lg leading-relaxed">
                      Wyndham Garden Wailoaloa Beach Fiji is the perfect venue for any special occasions you wish to celebrate.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                     {[
                       "https://images.unsplash.com/photo-1431540015161-0bf868a2d407?auto=format&fit=crop&q=80&w=1200",
                       "https://images.unsplash.com/photo-1505373877841-8d25f7d46678?auto=format&fit=crop&q=80&w=1200",
                       "https://images.unsplash.com/photo-1543007630-9710e4a00a20?auto=format&fit=crop&q=80&w=1200"
                     ].map((img, i) => (
                       <div key={i} className="h-[400px] overflow-hidden shadow-lg border border-slate-100">
                          <img src={img} className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-1000" />
                       </div>
                     ))}
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
                    <div className="lg:col-span-5 space-y-10">
                       <h4 className="text-3xl font-serif italic text-slate-900 border-b border-slate-100 pb-4">Meeting Space Highlights</h4>
                       <ul className="space-y-6">
                          {[
                            "State of the art audiovisual technology",
                            "LCD projector screens & High-definition displays",
                            "High-Speed Wi-Fi & Cordless Microphones",
                            "Full Event Catering & Planning Services",
                            "Flipcharts with assorted markers & white boards"
                          ].map((item, i) => (
                            <div key={i} className="flex gap-4">
                               <div className="w-6 h-6 bg-luxury-cream text-gold flex items-center justify-center shrink-0">
                                  <CheckCircle size={14} />
                               </div>
                               <p className="text-slate-600 font-serif italic leading-relaxed">{item}</p>
                            </div>
                          ))}
                       </ul>
                    </div>
                    <div className="lg:col-span-7">
                       <div className="luxury-card overflow-hidden shadow-2xl border border-slate-100">
                          <div className="p-8 bg-luxury-black text-white flex justify-between items-center">
                             <h4 className="text-[10px] font-display uppercase tracking-[0.4em] font-black text-gold italic">Capacity Chart</h4>
                             <div className="text-right">
                                <p className="text-[9px] font-display uppercase text-slate-600">Total Area</p>
                                <p className="text-xl font-serif italic text-white">224 m² / 22.55m x 9.91m</p>
                             </div>
                          </div>
                          <table className="w-full text-left font-serif italic">
                             <thead className="bg-luxury-cream/30 text-[10px] font-display uppercase tracking-widest text-slate-500 italic not-italic">
                                <tr>
                                   <th className="p-8">Setup Configuration</th>
                                   <th className="p-8 text-right">Maximum Capacity</th>
                                </tr>
                             </thead>
                             <tbody className="divide-y divide-slate-50">
                                {[
                                  { name: "Theatre Style", cap: "120 Pax" },
                                  { name: "Banquet Style", cap: "80 Pax" },
                                  { name: "Classroom Style", cap: "80 Pax" },
                                  { name: "U-Shape Setup", cap: "80 Pax" },
                                  { name: "Boardroom Setup", cap: "50 Pax" }
                                ].map((row, i) => (
                                  <tr key={i} className="hover:bg-luxury-cream/10 transition-colors">
                                     <td className="p-8 text-slate-900 text-lg">{row.name}</td>
                                     <td className="p-8 text-right text-gold font-bold text-xl">{row.cap}</td>
                                  </tr>
                                ))}
                             </tbody>
                          </table>
                       </div>
                    </div>
                  </div>
                </section>

                {/* Area Entertainment Section */}
                <section className="space-y-16 pb-20">
                   <div className="flex items-center gap-4 mb-10">
                    <h3 className="text-4xl font-serif italic text-slate-900 leading-tight">Local Culture & Fun</h3>
                    <div className="flex-1 h-px bg-slate-100"></div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                     {[
                       { name: "Sri Siva Temple", dist: "10 Mins", img: "https://images.unsplash.com/photo-1548013146-72479768b921?auto=format&fit=crop&q=80&w=800" },
                       { name: "Garden of Sleeping Giant", dist: "30 Mins", img: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&q=80&w=800" },
                       { name: "Sabeto Hot Springs", dist: "30 Mins", img: "https://images.unsplash.com/photo-1510218830377-1e58288594cc?auto=format&fit=crop&q=80&w=800" },
                       { name: "Port Denarau", dist: "15 Mins", img: "https://images.unsplash.com/photo-1549488344-1f9b8d2bd1f3?auto=format&fit=crop&q=80&w=800" }
                     ].map((attr, i) => (
                       <div key={i} className="luxury-card group overflow-hidden bg-white shadow-sm border border-slate-50">
                          <div className="h-48 overflow-hidden">
                             <img src={attr.img} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 grayscale hover:grayscale-0" alt={attr.name} />
                          </div>
                          <div className="p-6">
                             <h4 className="text-sm font-serif italic text-slate-900 mb-1">{attr.name}</h4>
                             <p className="text-[9px] font-display uppercase tracking-widest text-slate-600">Distance: {attr.dist}</p>
                          </div>
                       </div>
                     ))}
                  </div>
                </section>
              </div>
            ) : activeTab === "profile" ? (
              <div className="max-w-4xl mx-auto py-12">
                <div className="flex flex-col md:flex-row items-center gap-12 mb-16">
                  <div className="w-32 h-32 md:w-48 md:h-48 border-2 border-gold/20 p-2 rounded-none">
                    <div className="w-full h-full bg-luxury-black flex items-center justify-center text-gold text-4xl md:text-6xl font-serif italic overflow-hidden">
                      {currentUser?.photoURL ? (
                        <img src={currentUser.photoURL} alt="Profile" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      ) : (
                        currentUser?.displayName?.[0] || currentUser?.email?.[0] || "?"
                      )}
                    </div>
                  </div>
                  <div className="text-center md:text-left">
                    <h2 className="text-5xl font-serif text-slate-900 italic mb-2">{currentUser?.displayName || "Team Member"}</h2>
                    <p className="luxury-label font-bold text-gold !text-sm mb-4">{userRole || "Fetching Role..."}</p>
                    <div className="flex flex-wrap justify-center md:justify-start gap-4">
                      <span className="px-4 py-2 bg-white border border-slate-100 text-[10px] font-display uppercase tracking-widest text-slate-500">{currentUser?.email}</span>
                      <span className="px-4 py-2 bg-emerald-50 text-emerald-600 text-[10px] font-display uppercase tracking-widest font-bold">Active Sync</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="luxury-card p-10 bg-white shadow-sm">
                    <h3 className="text-[11px] font-display uppercase tracking-[0.3em] font-black text-gold mb-8 italic border-b border-slate-50 pb-4">Account Permissions</h3>
                    <div className="space-y-6">
                      <div className="flex justify-between items-center">
                        <p className="text-xs text-slate-500 font-serif italic">Portal Access</p>
                        <span className="text-[10px] font-bold text-emerald-600 uppercase">Granted</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <p className="text-xs text-slate-500 font-serif italic">Executive Dashboards</p>
                        <span className={cn("text-[10px] font-bold uppercase", userRole === "Administrator" ? "text-emerald-600" : "text-slate-300")}>{userRole === "Administrator" ? "Enabled" : "Restricted"}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <p className="text-xs text-slate-500 font-serif italic">Management Tools</p>
                        <span className={cn("text-[10px] font-bold uppercase", userRole === "Administrator" ? "text-emerald-600" : "text-slate-300")}>{userRole === "Administrator" ? "Enabled" : "Restricted"}</span>
                      </div>
                      {userRole === "Administrator" && (
                        <div className="pt-4 mt-4 border-t border-slate-50">
                          <button 
                            onClick={() => setActiveTab("user-management")}
                            className="bg-luxury-black text-white px-6 py-2 text-[9px] font-display uppercase tracking-widest font-black hover:bg-gold transition-all flex items-center justify-center gap-2 w-full shadow-lg"
                          >
                            <ShieldCheck size={12} /> Access User Control
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="luxury-card p-10 bg-luxury-black text-white shadow-xl">
                    <h3 className="text-[11px] font-display uppercase tracking-[0.3em] font-black text-gold mb-8 italic border-b border-white/5 pb-4">System Settings</h3>
                    <div className="space-y-6 opacity-40">
                      <div className="flex justify-between items-center">
                         <p className="text-xs font-serif italic">Notification Alerts</p>
                         <div className="w-8 h-4 bg-white/20 rounded-full relative">
                            <div className="absolute right-0 w-4 h-4 bg-gold rounded-full scale-75 shadow-lg" />
                         </div>
                      </div>
                      <div className="flex justify-between items-center">
                         <p className="text-xs font-serif italic">Email Digests</p>
                         <div className="w-8 h-4 bg-white/20 rounded-full relative">
                            <div className="absolute left-0 w-4 h-4 bg-slate-500 rounded-full scale-75" />
                         </div>
                      </div>
                      <div className="mt-8 pt-4 border-t border-white/5">
                        <p className="text-[10px] text-slate-500 font-serif italic leading-relaxed">Advanced system preferences and regional settings are managed by corporate administration defaults.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : activeTab === "hrms" ? (
              <div className="max-w-5xl space-y-8 pb-32">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                  <div className="flex items-center gap-3 md:gap-4">
                     <div className="w-10 h-10 md:w-12 md:h-12 bg-luxury-black text-gold flex items-center justify-center shadow-lg">
                        <UserCog size={20} md:size={24} strokeWidth={1} />
                     </div>
                     <div>
                        <h2 className="text-2xl md:text-3xl font-serif text-slate-900 italic leading-tight">Human Resource Management</h2>
                        <p className="luxury-label opacity-60">Enterprise Staff Portal</p>
                     </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  {/* HRMS Dashboard Cards */}
                  <div className="luxury-card p-8 bg-white shadow-sm border-t-2 border-gold flex flex-col gap-4">
                    <div className="w-10 h-10 bg-slate-50 flex items-center justify-center text-gold">
                      <Users size={20} />
                    </div>
                    <h3 className="text-lg font-serif italic text-slate-900">Personnel Directory</h3>
                    <p className="text-[11px] text-slate-500 font-serif italic leading-relaxed">Manage employee profiles, emergency contacts, and digital records.</p>
                    <button className="mt-4 text-[10px] font-display uppercase tracking-widest font-black text-gold hover:text-luxury-black transition-colors flex items-center gap-2">
                       Enter Directory <ArrowRight size={12} />
                    </button>
                  </div>

                  <div className="luxury-card p-8 bg-white shadow-sm border-t-2 border-gold flex flex-col gap-4">
                    <div className="w-10 h-10 bg-slate-50 flex items-center justify-center text-gold">
                      <Briefcase size={20} />
                    </div>
                    <h3 className="text-lg font-serif italic text-slate-900">Payroll & Benefits</h3>
                    <p className="text-[11px] text-slate-500 font-serif italic leading-relaxed">Access salary slips, tax documentation, and benefit enrollment status.</p>
                    <button className="mt-4 text-[10px] font-display uppercase tracking-widest font-black text-gold hover:text-luxury-black transition-colors flex items-center gap-2">
                       View Statements <ArrowRight size={12} />
                    </button>
                  </div>

                  <div className="luxury-card p-8 bg-white shadow-sm border-t-2 border-gold flex flex-col gap-4">
                    <div className="w-10 h-10 bg-slate-50 flex items-center justify-center text-gold">
                      <Clock size={20} />
                    </div>
                    <h3 className="text-lg font-serif italic text-slate-900">Time & Attendance</h3>
                    <p className="text-[11px] text-slate-500 font-serif italic leading-relaxed">Review shift schedules, leave requests, and attendance biometric logs.</p>
                    <button className="mt-4 text-[10px] font-display uppercase tracking-widest font-black text-gold hover:text-luxury-black transition-colors flex items-center gap-2">
                       Log Attendance <ArrowRight size={12} />
                    </button>
                  </div>
                </div>

                <div className="luxury-card p-10 bg-luxury-black text-white shadow-xl flex flex-col md:flex-row items-center gap-8">
                  <div className="flex-1">
                    <h4 className="text-gold text-[10px] font-display uppercase tracking-[0.3em] font-black mb-4">HR Announcements</h4>
                    <h3 className="text-2xl font-serif italic mb-4">Annual Leave Policy Update 2026</h3>
                    <p className="text-sm text-slate-600 font-serif italic leading-relaxed">We have updated the carry-over policy for the upcoming fiscal year. Please review the new guidelines in the team manual.</p>
                  </div>
                  <button className="bg-gold text-white px-8 py-3 text-[10px] font-display uppercase tracking-widest font-black hover:bg-white hover:text-luxury-black transition-all shadow-lg shrink-0">
                    Read Policy
                  </button>
                </div>
              </div>
            ) : activeTab === "sop" ? (
              <div className="space-y-8">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                  <div>
                    <h2 className="text-3xl font-serif text-slate-900 italic">SOP Registry</h2>
                    <p className="luxury-label opacity-60">Standard Operating Procedures & Official Documentation</p>
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-4">
                    <div className="relative">
                      <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input 
                        type="text"
                        placeholder="Search SOPs..."
                        value={sopSearch}
                        onChange={(e) => setSopSearch(e.target.value)}
                        className="pl-10 pr-4 py-3 bg-white border border-slate-100 text-[10px] font-display uppercase tracking-widest focus:ring-1 focus:ring-gold outline-none w-64 shadow-sm"
                      />
                    </div>
                    
                    <div className="relative overflow-hidden group">
                      <input 
                        type="file" 
                        accept=".pdf"
                        className="hidden" 
                        id="sop-upload"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            setIsSopUploading(true);
                            try {
                              const url = await handlePdfUpload(file);
                              const newSop = {
                                title: file.name.replace(/\.[^/.]+$/, ""),
                                url: url,
                                date: new Date().toISOString().split('T')[0]
                              };
                              setSops(prev => [newSop, ...prev]);
                            } catch (err) {
                              console.error(err);
                            } finally {
                              setIsSopUploading(false);
                            }
                          }
                        }}
                      />
                      <label 
                        htmlFor="sop-upload"
                        className={cn(
                          "flex items-center gap-2 px-6 py-3 bg-gold text-white text-[10px] font-display uppercase tracking-widest font-black transition-all shadow-lg cursor-pointer hover:bg-luxury-black",
                          isSopUploading && "opacity-50 cursor-wait"
                        )}
                      >
                        {isSopUploading ? (
                          <>
                            <RefreshCw size={14} className="animate-spin" /> Uploading...
                          </>
                        ) : (
                          <>
                            <Plus size={14} /> Upload PDF SOP
                          </>
                        )}
                      </label>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  <AnimatePresence mode="popLayout">
                    {filteredSops.map((sop, idx) => (
                      <motion.div
                        layout
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        key={idx}
                        className="group bg-white border border-slate-100 p-6 hover:shadow-2xl hover:border-gold/30 transition-all duration-500 flex flex-col h-full relative"
                      >
                        <div className="w-12 h-16 bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-300 group-hover:bg-luxury-cream group-hover:text-gold transition-all mb-6 relative overflow-hidden">
                           <FileText size={32} strokeWidth={1} />
                           <div className="absolute bottom-0 right-0 p-1 bg-red-600 text-white text-[6px] font-black uppercase">PDF</div>
                        </div>

                        <h3 className="text-sm font-serif italic text-slate-900 mb-2 font-bold group-hover:text-gold transition-colors leading-tight line-clamp-2 h-10">{sop.title}</h3>
                        <p className="text-[9px] font-display uppercase tracking-widest text-slate-400 mb-8 font-bold">Released: {sop.date}</p>

                        <div className="mt-auto pt-6 border-t border-slate-50 flex items-center justify-between">
                           <button 
                             onClick={() => window.open(sop.url, '_blank')}
                             className="flex items-center gap-2 text-[9px] font-display uppercase tracking-widest font-black text-gold hover:text-luxury-black transition-colors"
                           >
                             View Document <ExternalLink size={12} />
                           </button>
                           
                           <button 
                             onClick={() => {
                               if (confirm("Are you sure you want to remove this SOP?")) {
                                 setSops(prev => prev.filter((_, i) => i !== idx));
                               }
                             }}
                             className="text-slate-200 hover:text-red-600 transition-colors opacity-0 group-hover:opacity-100"
                           >
                             <X size={14} />
                           </button>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>

                {filteredSops.length === 0 && (
                  <div className="py-32 text-center bg-white border border-dashed border-slate-200">
                    <FileText size={48} className="mx-auto text-slate-100 mb-6" />
                    <h3 className="text-xl font-serif italic text-slate-400">No matching SOPs found</h3>
                    <p className="text-[10px] font-display uppercase tracking-widest text-slate-300 mt-2">Try adjusting your search filters</p>
                  </div>
                )}
              </div>
            ) : activeTab === "training-videos" ? (
              <div className="space-y-8">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                  <div>
                    <h2 className="text-3xl font-serif text-slate-900 italic">Training Library</h2>
                    <p className="luxury-label opacity-60">Educational video resources for property staff</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {[
                    { title: "Service Excellence", duration: "12:45", category: "Hospitality" },
                    { title: "Safety & Fire Protocols", duration: "08:20", category: "Security" },
                    { title: "Property Management System", duration: "25:10", category: "Technical" }
                  ].map((video, idx) => (
                    <motion.div 
                      key={idx}
                      whileHover={{ y: -5 }}
                      className="group bg-white overflow-hidden shadow-sm hover:shadow-xl transition-all duration-500"
                    >
                      <div className="aspect-video bg-slate-100 relative overflow-hidden flex items-center justify-center">
                        <div className="absolute inset-0 bg-luxury-black/40 group-hover:bg-luxury-black/10 transition-colors z-10" />
                        <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center text-white relative z-20 group-hover:scale-110 transition-transform cursor-pointer">
                           <Play size={24} className="ml-1" />
                        </div>
                        <div className="absolute bottom-4 right-4 bg-black/60 px-2 py-1 text-[9px] text-white font-display z-20">
                          {video.duration}
                        </div>
                      </div>
                      <div className="p-6">
                        <div className="text-[8px] font-display uppercase tracking-widest text-gold font-black mb-2">{video.category}</div>
                        <h4 className="text-lg font-serif italic text-slate-900 mb-4">{video.title}</h4>
                        <button className="w-full py-3 border border-slate-100 text-[9px] font-display uppercase tracking-widest font-black text-slate-800 hover:bg-gold hover:text-white hover:border-gold transition-all">
                          Watch Training
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            ) : activeTab === "lost-and-found" ? (
              <div className="max-w-5xl space-y-8 pb-32">
                {/* Header and Actions */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                  <div className="flex items-center gap-3 md:gap-4">
                     <div className="w-10 h-10 md:w-12 md:h-12 bg-luxury-black text-gold flex items-center justify-center shadow-lg">
                        <Package size={20} md:size={24} strokeWidth={1} />
                     </div>
                     <div>
                        <h2 className="text-2xl md:text-3xl font-serif text-slate-900 italic leading-tight">Lost & Found</h2>
                        <p className="luxury-label opacity-60">Property Asset Recovery</p>
                     </div>
                  </div>

                  <button 
                    onClick={() => setShowLostFoundForm(!showLostFoundForm)}
                    className="bg-luxury-black text-white px-8 py-3 text-[10px] font-display uppercase tracking-widest font-black hover:bg-gold transition-all shadow-xl active:scale-95 flex items-center gap-2"
                  >
                    {showLostFoundForm ? <X size={14} /> : <AlertTriangle size={14} />}
                    {showLostFoundForm ? "Cancel Report" : "Report Found Item"}
                  </button>
                </div>

                {/* Form Overlay/Section */}
                <AnimatePresence>
                  {showLostFoundForm && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="luxury-card p-6 md:p-8 bg-white shadow-2xl border-t-4 border-gold mb-8">
                        <h3 className="text-xl font-serif italic text-slate-900 mb-6">Report Found Item</h3>
                        <form onSubmit={handleReportLostItem} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <label className="luxury-label mb-2 block text-slate-800">Item Name</label>
                            <input 
                              type="text" 
                              required
                              value={lostItemForm.itemName}
                              onChange={(e) => setLostItemForm({...lostItemForm, itemName: e.target.value})}
                              className="w-full bg-slate-50 border-none px-4 py-3 text-sm font-serif italic focus:ring-1 focus:ring-gold/50"
                              placeholder="e.g. Silver Wristwatch"
                            />
                          </div>
                          <div>
                            <label className="luxury-label mb-2 block text-slate-800">Location Found</label>
                            <input 
                              type="text" 
                              required
                              value={lostItemForm.locationFound}
                              onChange={(e) => setLostItemForm({...lostItemForm, locationFound: e.target.value})}
                              className="w-full bg-slate-50 border-none px-4 py-3 text-sm font-serif italic focus:ring-1 focus:ring-gold/50"
                              placeholder="e.g. Room 402, Gym, Lobby"
                            />
                          </div>
                          <div>
                            <label className="luxury-label mb-2 block text-slate-800">Your Name</label>
                            <input 
                              type="text" 
                              required
                              value={lostItemForm.staffName}
                              onChange={(e) => setLostItemForm({...lostItemForm, staffName: e.target.value})}
                              className="w-full bg-slate-50 border-none px-4 py-3 text-sm font-serif italic focus:ring-1 focus:ring-gold/50"
                              placeholder="Full Name"
                            />
                          </div>
                          <div>
                            <label className="luxury-label mb-2 block text-slate-800">Your Position</label>
                            <input 
                              type="text" 
                              value={lostItemForm.staffPosition}
                              onChange={(e) => setLostItemForm({...lostItemForm, staffPosition: e.target.value})}
                              className="w-full bg-slate-50 border-none px-4 py-3 text-sm font-serif italic focus:ring-1 focus:ring-gold/50"
                              placeholder="e.g. Housekeeping Lead"
                            />
                          </div>
                          <div className="md:col-span-2">
                            <label className="luxury-label mb-2 block text-slate-800">Item Description</label>
                            <textarea 
                              required
                              rows={3}
                              value={lostItemForm.description}
                              onChange={(e) => setLostItemForm({...lostItemForm, description: e.target.value})}
                              className="w-full bg-slate-50 border-none px-4 py-3 text-sm font-serif italic focus:ring-1 focus:ring-gold/50 resize-none"
                              placeholder="Details about the item (color, brand, distinguishing features)..."
                            />
                          </div>
                          <div className="md:col-span-2">
                             <label className="luxury-label mb-2 block text-slate-800">Image of Item</label>
                             <input 
                               type="file"
                               ref={fileInputRef}
                               onChange={handleImageChange}
                               accept="image/*"
                               className="hidden"
                             />
                             
                             <div className="flex flex-col md:flex-row gap-4">
                               {lostItemForm.imageUrl ? (
                                 <div className="relative w-full md:w-48 h-48 bg-slate-100 group">
                                   <img 
                                     src={lostItemForm.imageUrl} 
                                     alt="Item Preview" 
                                     className="w-full h-full object-cover shadow-inner" 
                                     referrerPolicy="no-referrer"
                                   />
                                   <button 
                                     type="button"
                                     onClick={() => setLostItemForm(prev => ({ ...prev, imageUrl: "" }))}
                                     className="absolute top-2 right-2 bg-luxury-black text-white p-1 hover:bg-red-600 transition-colors"
                                   >
                                     <X size={14} />
                                   </button>
                                   <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                                      <p className="text-[10px] text-white font-display tracking-widest uppercase">Change Image</p>
                                   </div>
                                 </div>
                               ) : (
                                 <button 
                                   type="button"
                                   disabled={isUploading}
                                   onClick={() => fileInputRef.current?.click()}
                                   className="w-full md:w-48 h-48 border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-500 hover:border-gold hover:text-gold transition-all group bg-slate-50/50"
                                 >
                                   {isUploading ? (
                                      <div className="flex flex-col items-center gap-2">
                                        <div className="w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin"></div>
                                        <p className="text-[10px] font-display uppercase tracking-widest">Processing...</p>
                                      </div>
                                   ) : (
                                      <>
                                        <Camera size={32} strokeWidth={1} className="mb-3 group-hover:scale-110 transition-transform" />
                                        <p className="text-[10px] font-display uppercase tracking-widest font-black">Attach Photo</p>
                                        <p className="text-[9px] font-serif italic opacity-60 mt-1">Select from camera or gallery</p>
                                      </>
                                   )}
                                 </button>
                               )}
                               
                               <div className="flex-1 space-y-3">
                                  <div className="p-4 bg-slate-50/50 border border-slate-100 italic font-serif text-xs text-slate-500 leading-relaxed">
                                     <p className="mb-2 font-black text-[10px] uppercase tracking-widest text-gold not-italic">Reporting Tip</p>
                                     Capture clear photos showing any unique markings or serial numbers. For high-value items, ensure the background is neutral. Image data is encrypted and stored securely within the recovery database.
                                  </div>
                                  <div className="flex items-center gap-2 text-slate-900 font-black">
                                     <ShieldCheck size={12} />
                                     <span className="text-[9px] uppercase tracking-tighter">SECURE CLOUD STORAGE ENABLED</span>
                                  </div>
                               </div>
                             </div>
                          </div>
                          <div className="md:col-span-2 flex justify-end">
                            <button 
                              type="submit"
                              className="bg-luxury-black text-white px-12 py-4 text-[11px] font-display uppercase tracking-[0.3em] font-black hover:bg-gold transition-all"
                            >
                              Log Found Item
                            </button>
                          </div>
                        </form>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Directory and Filters */}
                <div className="space-y-6">
                  <div className="luxury-card p-6 bg-white shadow-sm border-t-2 border-gold flex flex-col md:flex-row gap-4 items-center">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                      <input 
                        type="text" 
                        value={lostFoundSearch}
                        onChange={(e) => setLostFoundSearch(e.target.value)}
                        placeholder="Search items, locations, or staff..."
                        className="w-full bg-slate-50 border-none pl-10 pr-4 py-3 text-sm font-serif italic focus:ring-1 focus:ring-gold/50"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {lostItems.filter(item => 
                      item.itemName.toLowerCase().includes(lostFoundSearch.toLowerCase()) ||
                      item.description.toLowerCase().includes(lostFoundSearch.toLowerCase()) ||
                      item.locationFound.toLowerCase().includes(lostFoundSearch.toLowerCase()) ||
                      item.staffName.toLowerCase().includes(lostFoundSearch.toLowerCase())
                    ).length === 0 ? (
                      <div className="col-span-full py-20 text-center bg-white border border-slate-100">
                        <div className="w-16 h-16 bg-slate-50 flex items-center justify-center mx-auto mb-4 text-slate-300">
                           <Package size={32} />
                        </div>
                        <p className="text-slate-600 font-serif italic">No lost items match your search criteria.</p>
                      </div>
                    ) : (
                      lostItems.filter(item => 
                        item.itemName.toLowerCase().includes(lostFoundSearch.toLowerCase()) ||
                        item.description.toLowerCase().includes(lostFoundSearch.toLowerCase()) ||
                        item.locationFound.toLowerCase().includes(lostFoundSearch.toLowerCase()) ||
                        item.staffName.toLowerCase().includes(lostFoundSearch.toLowerCase())
                      ).map((item) => (
                        <motion.div 
                          key={item.id}
                          layout
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="luxury-card bg-white shadow-sm overflow-hidden group hover:shadow-xl transition-all duration-500 border border-slate-50"
                        >
                          {item.imageUrl && (
                            <div className="h-48 overflow-hidden bg-slate-100">
                              <img src={item.imageUrl} alt={item.itemName} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" referrerPolicy="no-referrer" />
                            </div>
                          )}
                          <div className="p-6">
                            <div className="flex justify-between items-start mb-4">
                              <span className={cn(
                                "px-2 py-0.5 text-[8px] font-display uppercase tracking-widest font-black",
                                item.status === 'Found' ? "bg-amber-50 text-amber-600" :
                                item.status === 'Claimed' ? "bg-emerald-50 text-emerald-600" : "bg-slate-50 text-slate-500"
                              )}>
                                {item.status}
                              </span>
                              <span className="text-[10px] text-slate-300 font-serif italic">
                                {item.createdAt?.toDate ? new Date(item.createdAt.toDate()).toLocaleDateString() : "Present"}
                              </span>
                            </div>
                            <h4 className="text-lg font-serif italic text-slate-900 mb-2 truncate">{item.itemName}</h4>
                            <p className="text-[11px] text-slate-500 font-serif italic mb-4 line-clamp-2 leading-relaxed">
                              {item.description}
                            </p>
                            <div className="pt-4 border-t border-slate-50 space-y-2">
                               <div className="flex items-center gap-2 text-[9px] text-slate-600 font-bold">
                                  <Hotel size={12} className="text-gold" />
                                  <span className="uppercase tracking-widest">Found at {item.locationFound}</span>
                               </div>
                               <div className="flex items-center gap-2 text-[9px] text-slate-600 font-bold">
                                  <Users size={12} className="text-gold" />
                                  <span className="uppercase tracking-widest">By {item.staffName} ({item.staffPosition})</span>
                                </div>
                             </div>

                             {item.status === 'Found' && (userRole === 'Administrator' || userRole === 'Manager' || userRole === 'Audit' || userRole === 'admin') && (
                               <div className="mt-4 pt-4 border-t border-slate-50">
                                 <button 
                                   onClick={() => setSelectedItemForDispatch(item)}
                                   className="w-full py-2 bg-luxury-black text-white text-[9px] font-display uppercase tracking-widest font-black hover:bg-gold transition-all"
                                 >
                                   Release / Dispatch Item
                                 </button>
                               </div>
                             )}

                             {item.status === 'Claimed' && item.dispatchDetails && (
                               <div className="mt-4 pt-4 border-t border-slate-50 space-y-3">
                                   <div className="flex items-center justify-between">
                                      <p className="text-[10px] font-display uppercase tracking-widest text-emerald-600 font-black flex items-center gap-2">
                                        <CheckCircle size={14} /> Released to {item.dispatchDetails.guestName}
                                      </p>
                                      {item.dispatchDetails.roomNumber && (
                                        <span className="text-[9px] font-display uppercase tracking-widest bg-slate-100 px-2 py-0.5 font-bold">Room {item.dispatchDetails.roomNumber}</span>
                                      )}
                                   </div>
                                   
                                   {item.dispatchDetails.systemAutoNote && (
                                      <div className="p-3 bg-emerald-50/50 border border-emerald-100 rounded text-[9px] text-emerald-800 italic leading-relaxed text-left">
                                         {item.dispatchDetails.systemAutoNote}
                                      </div>
                                   )}

                                   <div className="grid grid-cols-2 gap-4 text-left pt-2">
                                      <div className="space-y-1">
                                         <p className="text-[7px] uppercase tracking-widest text-slate-400 font-bold">Release Date</p>
                                         <p className="text-[9px] font-serif italic text-slate-700">{item.dispatchDetails.releaseDate || 'N/A'}</p>
                                      </div>
                                      <div className="space-y-1">
                                         <p className="text-[7px] uppercase tracking-widest text-slate-400 font-bold">Verified By</p>
                                         <p className="text-[9px] font-serif italic text-slate-700">{item.dispatchDetails.dispatchedBy}</p>
                                      </div>
                                   </div>

                                   {item.dispatchDetails.notes && (
                                      <div className="space-y-1 text-left pt-2">
                                         <p className="text-[7px] uppercase tracking-widest text-slate-400 font-bold">Release Notes</p>
                                         <p className="text-[9px] font-serif italic text-slate-600">{item.dispatchDetails.notes}</p>
                                      </div>
                                   )}

                                   {(item.dispatchDetails.idDocumentUrl || item.dispatchDetails.recipientPhotoUrl) && (
                                     <div className="pt-2 flex gap-4">
                                       {item.dispatchDetails.idDocumentUrl && (
                                         <div className="space-y-1">
                                            <p className="text-[7px] uppercase tracking-widest text-slate-400 font-bold">Verification ID</p>
                                            <a 
                                              href={item.dispatchDetails.idDocumentUrl} 
                                              target="_blank" 
                                              rel="noreferrer"
                                              className="flex items-center gap-1.5 p-1.5 bg-slate-50 border border-slate-100 rounded hover:bg-gold/5 hover:border-gold/20 transition-all"
                                            >
                                              <FileText size={10} className="text-gold" />
                                              <span className="text-[8px] font-display uppercase tracking-widest font-black text-slate-900">View ID</span>
                                            </a>
                                         </div>
                                       )}
                                       {item.dispatchDetails.recipientPhotoUrl && (
                                         <div className="space-y-1">
                                            <p className="text-[7px] uppercase tracking-widest text-slate-400 font-bold">Recipient Photo</p>
                                            <button 
                                              onClick={() => window.open(item.dispatchDetails.recipientPhotoUrl, '_blank')}
                                              className="w-10 h-10 border border-slate-100 rounded overflow-hidden hover:border-gold/30 transition-all"
                                            >
                                              <img src={item.dispatchDetails.recipientPhotoUrl} alt="Recipient" className="w-full h-full object-cover" />
                                            </button>
                                         </div>
                                       )}
                                     </div>
                                   )}
                               </div>
                             )}</div></motion.div>
                      ))
                    )}
                  </div>
                </div>
                {/* Dispatch Form Modal */}
                <AnimatePresence>
                  {selectedItemForDispatch && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                      <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setSelectedItemForDispatch(null)}
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                      />
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="relative w-full max-w-lg bg-white shadow-2xl border-t-4 border-gold overflow-hidden"
                      >
                        <div className="p-8">
                          <div className="flex justify-between items-start mb-6">
                            <div>
                               <h3 className="text-xl font-serif italic text-slate-900">Item Dispatch Form</h3>
                               <p className="luxury-label !text-slate-500">Authorized Release Registry</p>
                            </div>
                            <button onClick={() => setSelectedItemForDispatch(null)} className="text-slate-400 hover:text-slate-900 transition-colors">
                              <X size={20} />
                            </button>
                          </div>

                          <div className="mb-6 p-4 bg-slate-50 border border-slate-100 flex gap-4 items-center">
                            {selectedItemForDispatch.imageUrl ? (
                              <div className="w-16 h-16 shrink-0 bg-white p-1 border border-slate-200">
                                <img src={selectedItemForDispatch.imageUrl} alt="" className="w-full h-full object-cover" />
                              </div>
                            ) : (
                              <div className="w-16 h-16 shrink-0 bg-white border border-slate-200 flex items-center justify-center">
                                <Hotel size={24} className="text-slate-200" />
                              </div>
                            )}
                            <div>
                              <p className="text-xs font-serif italic font-bold text-slate-900">{selectedItemForDispatch.itemName}</p>
                              <p className="text-[10px] text-slate-500 line-clamp-1">{selectedItemForDispatch.description}</p>
                            </div>
                          </div>

                          <form onSubmit={handleDispatchItem} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <label className="text-[10px] font-display uppercase tracking-widest font-black text-slate-800 block mb-1">Release Date</label>
                                <input 
                                  type="date"
                                  required
                                  value={dispatchForm.releaseDate}
                                  onChange={(e) => setDispatchForm({...dispatchForm, releaseDate: e.target.value})}
                                  className="w-full bg-slate-50 border-none px-4 py-3 text-sm font-serif italic focus:ring-1 focus:ring-gold/50"
                                />
                              </div>
                              <div>
                                <label className="text-[10px] font-display uppercase tracking-widest font-black text-slate-800 block mb-1">Room Number</label>
                                <input 
                                  type="text"
                                  placeholder="e.g. 402"
                                  value={dispatchForm.roomNumber}
                                  onChange={(e) => setDispatchForm({...dispatchForm, roomNumber: e.target.value})}
                                  className="w-full bg-slate-50 border-none px-4 py-3 text-sm font-serif italic focus:ring-1 focus:ring-gold/50"
                                />
                              </div>
                            </div>

                            <div>
                              <label className="text-[10px] font-display uppercase tracking-widest font-black text-slate-800 block mb-1">Recipient Name</label>
                              <input 
                                type="text"
                                required
                                value={dispatchForm.guestName}
                                onChange={(e) => setDispatchForm({...dispatchForm, guestName: e.target.value})}
                                className="w-full bg-slate-50 border-none px-4 py-3 text-sm font-serif italic focus:ring-1 focus:ring-gold/50"
                                placeholder="Full name of person claiming item"
                              />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <label className="text-[10px] font-display uppercase tracking-widest font-black text-slate-800 block mb-1">Email Address</label>
                                <input 
                                  type="email"
                                  value={dispatchForm.guestEmail}
                                  onChange={(e) => setDispatchForm({...dispatchForm, guestEmail: e.target.value})}
                                  className="w-full bg-slate-50 border-none px-4 py-3 text-sm font-serif italic focus:ring-1 focus:ring-gold/50"
                                  placeholder="guest@example.com"
                                />
                              </div>
                              <div>
                                <label className="text-[10px] font-display uppercase tracking-widest font-black text-slate-800 block mb-1">Phone Number</label>
                                <input 
                                  type="tel"
                                  value={dispatchForm.guestPhone}
                                  onChange={(e) => setDispatchForm({...dispatchForm, guestPhone: e.target.value})}
                                  className="w-full bg-slate-50 border-none px-4 py-3 text-sm font-serif italic focus:ring-1 focus:ring-gold/50"
                                  placeholder="+679 ..."
                                />
                              </div>
                            </div>

                            <div>
                              <label className="text-[10px] font-display uppercase tracking-widest font-black text-slate-800 block mb-1">ID Verification & Documents</label>
                              <div className="space-y-3">
                                <div className="flex gap-2">
                                  <select 
                                    value={dispatchForm.idProofType}
                                    onChange={(e) => setDispatchForm({...dispatchForm, idProofType: e.target.value})}
                                    className="bg-slate-50 border-none px-2 py-3 text-[10px] font-display uppercase tracking-widest focus:ring-0"
                                  >
                                    <option>Passport</option>
                                    <option>Driver Lic</option>
                                    <option>National ID</option>
                                    <option>Other</option>
                                  </select>
                                  <input 
                                    type="text"
                                    required
                                    value={dispatchForm.idProofNumber}
                                    onChange={(e) => setDispatchForm({...dispatchForm, idProofNumber: e.target.value})}
                                    className="flex-1 bg-slate-50 border-none px-4 py-3 text-sm font-serif italic focus:ring-1 focus:ring-gold/50"
                                    placeholder="ID Number"
                                  />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                  {/* ID Attachment */}
                                  <div className="relative group">
                                    <input 
                                      type="file" 
                                      accept="image/*,.pdf"
                                      className="hidden" 
                                      id="id-doc-upload"
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
                                      htmlFor="id-doc-upload"
                                      className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-slate-100 bg-slate-50/30 hover:border-gold/30 hover:bg-gold/5 transition-all cursor-pointer min-h-[80px]"
                                    >
                                      {dispatchForm.idDocumentUrl ? (
                                        <div className="flex items-center gap-2 text-emerald-600">
                                          <Check size={14} />
                                          <span className="text-[9px] font-display uppercase tracking-widest font-black">ID Attached</span>
                                        </div>
                                      ) : (
                                        <>
                                          <FileText size={16} className="text-slate-400 mb-1" />
                                          <span className="text-[7px] font-display uppercase tracking-widest text-slate-500 font-black">Attach ID Scan</span>
                                        </>
                                      )}
                                    </label>
                                  </div>

                                  {/* Recipient Photo */}
                                  <div className="relative group">
                                    <input 
                                      type="file" 
                                      accept="image/*"
                                      capture="user"
                                      className="hidden" 
                                      id="recipient-photo-upload"
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
                                      htmlFor="recipient-photo-upload"
                                      className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-slate-100 bg-slate-50/30 hover:border-gold/30 hover:bg-gold/5 transition-all cursor-pointer min-h-[80px]"
                                    >
                                      {dispatchForm.recipientPhotoUrl ? (
                                        <div className="flex items-center gap-2 text-emerald-600">
                                          <Camera size={14} />
                                          <span className="text-[9px] font-display uppercase tracking-widest font-black">Photo Taken</span>
                                        </div>
                                      ) : (
                                        <>
                                          <Camera size={16} className="text-slate-400 mb-1" />
                                          <span className="text-[7px] font-display uppercase tracking-widest text-slate-500 font-black">Capture Recipient</span>
                                        </>
                                      )}
                                    </label>
                                  </div>
                                </div>
                              </div>
                            </div>

                            <div>
                               <label className="text-[10px] font-display uppercase tracking-widest font-black text-slate-800 block mb-1">Dispatch Notes</label>
                               <textarea 
                                 rows={2}
                                 value={dispatchForm.notes}
                                 onChange={(e) => setDispatchForm({...dispatchForm, notes: e.target.value})}
                                 className="w-full bg-slate-50 border-none px-4 py-3 text-sm font-serif italic focus:ring-1 focus:ring-gold/50 resize-none"
                                 placeholder="Optional notes regarding the release..."
                               />
                            </div>

                            <div className="pt-4 flex flex-col gap-3">
                              <p className="text-[9px] text-slate-400 italic text-center">By clicking below, you confirm that the receiver's identity has been verified as per Protocol 14-B.</p>
                              <button 
                                type="submit"
                                className="w-full py-4 bg-gold text-white text-[11px] font-display uppercase tracking-[0.3em] font-black hover:bg-gold transition-all shadow-lg"
                              >
                                Authorize & Release Item
                              </button>
                            </div>
                          </form>
                        </div>
                      </motion.div>
                    </div>
                  )}
                </AnimatePresence>
              </div>
            ) : activeTab === "team-chat" ? (
              <div className="flex-1 flex flex-col bg-white overflow-hidden border-t border-slate-200">
                {/* Browser Toolbar - Ultra Slim */}
                <div className="bg-[#f8f9fa] border-b border-slate-200 px-3 py-1 flex items-center gap-3 shrink-0">
                  <div className="flex gap-1 mr-3 shrink-0">
                    <div className="w-2.5 h-2.5 rounded-full bg-[#ff5f56] shadow-sm" />
                    <div className="w-2.5 h-2.5 rounded-full bg-[#ffbd2e] shadow-sm" />
                    <div className="w-2.5 h-2.5 rounded-full bg-[#27c93f] shadow-sm" />
                  </div>
                  
                  <div className="flex items-center gap-1 shrink-0">
                    <button className="p-1 hover:bg-slate-200 rounded text-slate-600 cursor-not-allowed">
                      <ArrowLeft size={12} />
                    </button>
                    <button className="p-1 hover:bg-slate-200 rounded text-slate-600 rotate-180 cursor-not-allowed">
                      <ArrowLeft size={12} />
                    </button>
                    <button 
                      onClick={() => setRefreshKey(k => k + 1)}
                      className="p-1 hover:bg-slate-200 rounded text-slate-600 hover:text-gold transition-all"
                    >
                      <RefreshCw size={12} className={cn(refreshKey > 0 && "animate-spin-once")} />
                    </button>
                  </div>

                  <div className="flex-1 flex items-center bg-white px-2 py-0.5 rounded text-[10px] border border-slate-200 shadow-inner overflow-hidden">
                    <div className="flex items-center gap-1.5 text-emerald-600 font-bold shrink-0">
                      <ShieldCheck size={10} strokeWidth={3} />
                      <span className="uppercase tracking-tighter text-[8px]">Secure Gateway</span>
                    </div>
                    <div className="mx-2 h-2.5 w-px bg-slate-200 shrink-0" />
                    <span className="text-slate-500 truncate font-sans select-all flex-1">
                      mail.google.com/chat/space/AAAAEpnKTIM
                    </span>
                  </div>

                  <button 
                    onClick={() => window.open("https://mail.google.com/mail/u/0/#chat/space/AAAAEpnKTIM", "_blank")}
                    className="flex items-center gap-1.5 px-2 py-1 bg-gold text-white text-[8px] font-display uppercase tracking-widest font-black hover:bg-luxury-black transition-all shrink-0 shadow-sm active:scale-95"
                  >
                    Open Externally <ExternalLink size={8} />
                  </button>
                </div>

                {/* Browser Shell */}
                <div className="flex-1 bg-white relative overflow-hidden">
                  <iframe 
                    key={refreshKey}
                    src="https://mail.google.com/mail/u/0/#chat/space/AAAAEpnKTIM"
                    className="w-full h-full border-none bg-white relative z-10"
                    title="Google Chat Integrated"
                    allow="clipboard-write; camera; microphone; payment; geolocation"
                    sandbox="allow-forms allow-scripts allow-same-origin allow-popups allow-modals allow-downloads allow-popups-to-escape-sandbox"
                    style={{ height: '100%' }}
                  />
                  
                  {/* Fallback/Loading State behind the frame */}
                  <div className="absolute inset-0 z-0 flex flex-col items-center justify-center bg-slate-50">
                    <div className="text-center max-w-md px-8">
                       <div className="w-16 h-16 bg-luxury-cream text-gold flex items-center justify-center mx-auto mb-6 shadow-xl">
                          <Send size={32} strokeWidth={1} />
                       </div>
                      <h4 className="text-[10px] font-display uppercase tracking-[0.2em] text-slate-900 font-black mb-4 italic">Google Chat Interface</h4>
                      <p className="text-xs font-serif italic text-slate-500 leading-relaxed mb-4">
                        If the chat does not load, it is because Google prevents its services from being embedded in other portals for security reasons.
                      </p>
                      
                      <div className="mt-8 flex gap-2 justify-center">
                        <div className="w-1.5 h-1.5 rounded-full bg-gold animate-bounce" />
                        <div className="w-1.5 h-1.5 rounded-full bg-gold animate-bounce delay-75" />
                        <div className="w-1.5 h-1.5 rounded-full bg-gold animate-bounce delay-150" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : activeTab === "canary" ? (
              <div className="flex-1 flex flex-col bg-white overflow-hidden border-t border-slate-200">
                {/* Browser Toolbar - Ultra Slim */}
                <div className="bg-[#f8f9fa] border-b border-slate-200 px-3 py-1 flex items-center gap-3 shrink-0">
                  <div className="flex gap-1 mr-3 shrink-0">
                    <div className="w-2.5 h-2.5 rounded-full bg-[#ff5f56] shadow-sm" />
                    <div className="w-2.5 h-2.5 rounded-full bg-[#ffbd2e] shadow-sm" />
                    <div className="w-2.5 h-2.5 rounded-full bg-[#27c93f] shadow-sm" />
                  </div>
                  
                  <div className="flex items-center gap-1 shrink-0">
                    <button className="p-1 hover:bg-slate-200 rounded text-slate-600 cursor-not-allowed">
                      <ArrowLeft size={12} />
                    </button>
                    <button className="p-1 hover:bg-slate-200 rounded text-slate-600 rotate-180 cursor-not-allowed">
                      <ArrowLeft size={12} />
                    </button>
                    <button 
                      onClick={() => setRefreshKey(k => k + 1)}
                      className="p-1 hover:bg-slate-200 rounded text-slate-600 hover:text-gold transition-all"
                    >
                      <RefreshCw size={12} className={cn(refreshKey > 0 && "animate-spin-once")} />
                    </button>
                  </div>

                  <div className="flex-1 flex items-center bg-white px-2 py-0.5 rounded text-[10px] border border-slate-200 shadow-inner overflow-hidden">
                    <div className="flex items-center gap-1.5 text-emerald-600 font-bold shrink-0">
                      <ShieldCheck size={10} strokeWidth={3} />
                      <span className="uppercase tracking-tighter text-[8px]">Secure</span>
                    </div>
                    <div className="mx-2 h-2.5 w-px bg-slate-200 shrink-0" />
                    <span className="text-slate-950 truncate font-sans select-all flex-1 font-bold">
                      eu.canarytechnologies.com/hotels/
                    </span>
                  </div>

                  <button 
                    onClick={() => {
                        setRefreshKey(prev => prev + 1);
                    }}
                    className="flex items-center gap-1.5 px-2 py-1 bg-gold text-white text-[8px] font-display uppercase tracking-widest font-black hover:bg-luxury-black transition-all shrink-0 shadow-sm active:scale-95"
                  >
                    Refresh Session
                  </button>
                </div>

                {/* Browser Shell - Forces full height */}
                <div className="flex-1 bg-white relative overflow-hidden">
                  <iframe 
                    key={refreshKey}
                    src="https://eu.canarytechnologies.com/hotels/"
                    className="w-full h-full border-none bg-white relative z-10"
                    title="Canary Technologies Integrated"
                    allow="clipboard-write; camera; microphone; payment; geolocation"
                    sandbox="allow-forms allow-scripts allow-same-origin allow-popups allow-modals allow-downloads allow-popups-to-escape-sandbox"
                    style={{ height: '100%' }}
                  />
                  
                  {/* Loading State Behind Frame */}
                  <div className="absolute inset-0 z-0 flex flex-col items-center justify-center bg-slate-50">
                    <div className="text-center max-w-md px-8">
                      <Globe size={48} className="mx-auto mb-6 text-gold/20 animate-pulse" />
                      <h4 className="text-[10px] font-display uppercase tracking-[0.2em] text-slate-600 font-bold mb-2">Connecting to Secure Gateway</h4>
                      <p className="text-xs font-serif italic text-slate-500 leading-relaxed">
                        If the content is not displaying, the integrated browser session may require a direct login.
                      </p>
                      <div className="mt-8 flex gap-2 justify-center">
                        <div className="w-1.5 h-1.5 rounded-full bg-gold animate-bounce" />
                        <div className="w-1.5 h-1.5 rounded-full bg-gold animate-bounce delay-75" />
                        <div className="w-1.5 h-1.5 rounded-full bg-gold animate-bounce delay-150" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : activeTab === "forum" ? (
              <Forum />
            ) : activeTab === "user-management" ? (
              <UserManagement />
            ) : (
              <>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12 no-print">
                   <div>
                      <h2 className="text-4xl font-serif text-slate-900 italic">Property Dashboard</h2>
                      <p className="luxury-label opacity-60">Real-time performance & hospitality metrics</p>
                   </div>
                   
                   <div className="flex bg-white p-1 border border-slate-100 shadow-sm rounded-none">
                      <button 
                        onClick={() => setDashboardViewMode("percentage")}
                        className={cn(
                          "px-6 py-2 text-[10px] font-display uppercase tracking-widest font-black transition-all",
                          dashboardViewMode === "percentage" ? "bg-gold text-white" : "text-slate-800 hover:text-gold"
                        )}
                      >
                        Percentage View
                      </button>
                      <button 
                        onClick={() => setDashboardViewMode("pie")}
                        className={cn(
                          "px-6 py-2 text-[10px] font-display uppercase tracking-widest font-black transition-all",
                          dashboardViewMode === "pie" ? "bg-gold text-white" : "text-slate-800 hover:text-gold"
                        )}
                      >
                        Pie Chart View
                      </button>
                   </div>
                </div>

                {/* Print-only Dashboard Header */}
                <div className="hidden print:block mb-12 border-b-2 border-gold/20 pb-6">
                   <div className="flex justify-between items-end">
                      <div>
                        <h1 className="text-3xl font-serif italic text-slate-900">Property Performance Report</h1>
                        <p className="text-[10px] font-display uppercase tracking-widest text-gold font-bold">{currentCompany?.name} EXECUTIVE SUMMARY</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] font-display uppercase tracking-widest text-slate-600 font-bold">Report Generated</p>
                        <p className="text-sm font-serif italic text-slate-900">{new Date().toLocaleDateString()}</p>
                      </div>
                   </div>
                </div>

                {dashboardViewMode === "percentage" ? (
                  /* KPI Grid */
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
                    <StatCard 
                      label="Occupancy" 
                      value="84.2%" 
                      trend="+3.1%" 
                      icon={TrendingUp}
                      color="gold"
                    />
                    <StatCard 
                      label="Average Daily Rate" 
                      value="$245.10" 
                      trend="+$12.40" 
                      icon={DollarSign}
                      color="gold"
                    />
                    <StatCard 
                      label="RevPAR" 
                      value="$206.29" 
                      trend="Stable" 
                      icon={Percent}
                      color="gold"
                    />
                    <StatCard 
                      label="Compliance Logs" 
                      value="94.8%" 
                      trend="Healthy" 
                      icon={FileText}
                      color="gold"
                    />
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
                    {[
                      { label: "Occupancy Rate", value: 84.2, color: "#C5A059" },
                      { label: "Revenue Target", value: 72.5, color: "#222" },
                      { label: "Compliance Index", value: 94.8, color: "#D4AF37" }
                    ].map((chart, idx) => (
                      <div key={idx} className="luxury-card p-10 bg-white flex flex-col items-center">
                        <h4 className="luxury-label mb-8">{chart.label}</h4>
                        <div className="h-64 w-full">
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={[
                                  { name: "Current", value: chart.value },
                                  { name: "Remaining", value: 100 - chart.value }
                                ]}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={80}
                                paddingAngle={5}
                                dataKey="value"
                              >
                                <Cell fill={chart.color} />
                                <Cell fill="#F8F9FA" />
                              </Pie>
                              <Tooltip />
                            </PieChart>
                          </ResponsiveContainer>
                        </div>
                        <div className="mt-4 text-center">
                          <span className="text-3xl font-serif italic text-slate-900">{chart.value}%</span>
                          <p className="text-[9px] font-display uppercase tracking-widest text-slate-600 font-bold mt-2">Performance Index</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Modules Row */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                  {/* Performance Module */}
                   <div className="lg:col-span-8 space-y-8">
                     <div className="luxury-card p-10 relative overflow-hidden">
                        {/* Decorative Background Text */}
                        <div className="absolute top-0 right-0 font-serif text-[120px] font-black text-slate-50/50 -translate-y-1/2 translate-x-1/4 pointer-events-none select-none">DATA</div>
                        
                        <div className="flex items-center justify-between mb-10 relative z-10">
                          <div>
                            <h2 className="text-2xl font-serif text-slate-900 mb-1">Financial Performance</h2>
                            <p className="luxury-label !text-[8px]">{currentCompany?.name} Portfolio Benchmarks</p>
                          </div>
                          <div className="flex gap-4">
                             <div className="flex items-center gap-2">
                               <span className="w-2 h-2 rounded-full bg-gold"></span>
                               <span className="text-[9px] font-display uppercase tracking-widest font-black">Revenue</span>
                             </div>
                          </div>
                        </div>
                        
                        <div className="h-[320px] w-full">
                          <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chartData}>
                              <defs>
                                <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor="#C5A059" stopOpacity={0.2}/>
                                  <stop offset="95%" stopColor="#C5A059" stopOpacity={0}/>
                                </linearGradient>
                              </defs>
                              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" opacity={0.5} />
                              <XAxis 
                                dataKey="name" 
                                axisLine={false} 
                                tickLine={false} 
                                tick={{fill: '#94A3B8', fontSize: 10, fontFamily: 'Montserrat'}} 
                                dy={15}
                              />
                              <YAxis hide={true}/>
                              <Tooltip 
                                contentStyle={{ 
                                  backgroundColor: '#1A1A1A', 
                                  border: 'none', 
                                  borderRadius: '4px',
                                  boxShadow: '0 20px 40px rgba(0,0,0,0.2)'
                                }}
                                itemStyle={{ color: '#C5A059', fontSize: '10px', textTransform: 'uppercase', fontStyle: 'Bold' }}
                              />
                              <Area 
                                type="monotone" 
                                dataKey="rev" 
                                stroke="#C5A059" 
                                strokeWidth={2} 
                                fillOpacity={1} 
                                fill="url(#colorRev)" 
                                animationDuration={2000}
                              />
                            </AreaChart>
                          </ResponsiveContainer>
                        </div>
                     </div>

                     {/* Property Table */}
                     <div className="luxury-card overflow-hidden">
                        <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                          <div>
                            <h2 className="text-lg font-serif text-slate-900">Property Portfolio</h2>
                            <p className="luxury-label !text-[8px]">Active Real-time Status</p>
                          </div>
                          <button className="luxury-button !py-2 !px-4">Export Audit</button>
                        </div>
                        <div className="overflow-x-auto">
                          <table className="w-full text-left">
                            <thead>
                              <tr className="bg-luxury-cream/50 border-b border-luxury-cream">
                                <th className="px-8 py-5 luxury-label !text-slate-600 italic">Property Identity</th>
                                <th className="px-8 py-5 luxury-label !text-slate-600">Executive</th>
                                <th className="px-8 py-5 luxury-label !text-slate-600">Compliance Status</th>
                                <th className="px-8 py-5 luxury-label !text-slate-600 text-right">Access</th>
                              </tr>
                            </thead>
                            <tbody className="text-sm divide-y divide-slate-50">
                              {[
                                { name: `${currentCompany?.id.toUpperCase()} - Nadi`, exec: "Robert Chen", status: "Validated", health: 100 },
                                { name: `${currentCompany?.id.toUpperCase()} - Suva`, exec: "Sarah Malik", status: "Audit Pending", health: 85, alert: true },
                                { name: "Beachfront West Lux", exec: "John Doe", status: "Validated", health: 98 },
                              ].map((property, i) => (
                                <tr key={property.name} className="group hover:bg-luxury-cream/30 transition-colors">
                                  <td className="px-8 py-6">
                                    <p className="font-serif text-slate-900 text-base">{property.name}</p>
                                    <p className="text-[10px] text-slate-600 font-display uppercase tracking-widest mt-0.5 font-bold">Asset ID: {1029 + i}</p>
                                  </td>
                                  <td className="px-8 py-6 text-slate-500 font-display text-[11px] font-medium tracking-wide uppercase">{property.exec}</td>
                                  <td className="px-8 py-6">
                                    <div className="flex items-center gap-2">
                                      <div className={cn("w-1.5 h-1.5 rounded-full", property.alert ? "bg-amber-500" : "bg-emerald-500")} />
                                      <span className={cn("text-[10px] font-bold uppercase tracking-widest", property.alert ? "text-amber-600" : "text-emerald-600")}>{property.status}</span>
                                    </div>
                                  </td>
                                  <td className="px-8 py-6 text-right">
                                    <button className="text-slate-300 group-hover:text-gold transition-colors">
                                      <ChevronRight size={18} />
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                     </div>
                   </div>

                   {/* Sidebar Widgets */}
                   <div className="lg:col-span-4 space-y-8">
                     {/* Training Widget */}
                     <div className="luxury-card p-8">
                        <h2 className="text-xl font-serif text-slate-900 mb-6">Staff Training</h2>
                        <div className="space-y-8">
                          {[
                            { label: "Luxury Brand Ethos", pct: 98 },
                            { label: "Concierge Etiquette", pct: 45 },
                            { label: "Safety & Security", pct: 100 },
                          ].map((course) => (
                            <div key={course.label}>
                              <div className="flex justify-between items-end mb-3">
                                <span className="text-[11px] font-display uppercase tracking-widest font-bold text-slate-600">{course.label}</span>
                                <span className="text-sm font-serif italic text-gold">{course.pct}%</span>
                              </div>
                              <div className="w-full h-0.5 bg-slate-100 relative">
                                 <motion.div 
                                   initial={{ width: 0 }}
                                   animate={{ width: `${course.pct}%` }}
                                   transition={{ duration: 1, ease: "easeOut" }}
                                   className="absolute top-0 left-0 h-full bg-gold"
                                 />
                              </div>
                            </div>
                          ))}
                        </div>
                        <button className="w-full mt-10 text-[10px] font-display uppercase tracking-[0.3em] font-bold py-4 border border-gold/10 hover:border-gold hover:bg-gold/5 transition-all text-slate-700 hover:text-gold uppercase">
                          Open LMS Dashboard
                        </button>
                     </div>

                     {/* Secure Documents */}
                     <div className="bg-luxury-black p-8 text-white relative group overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-gold/5 rounded-full translate-x-1/2 -translate-y-1/2 group-hover:bg-gold/10 transition-colors duration-700" />
                        
                        <h2 className="text-xs font-display uppercase tracking-[0.3em] text-gold mb-8 italic">Secure Forms Vault</h2>
                        <div className="space-y-6 relative z-10">
                          {[
                            { title: "Employment_Agreement.pdf", date: "Secure Template" },
                            { title: "SOP_Guest_Privacy.dwpt", date: "Restricted Access" },
                          ].map((doc) => (
                            <div key={doc.title} className="flex gap-4 items-start group cursor-pointer">
                              <div className="w-10 h-10 border border-white/10 flex items-center justify-center text-gold group-hover:bg-gold group-hover:text-white transition-all">
                                 <FileText size={18} strokeWidth={1} />
                              </div>
                              <div>
                                <p className="text-[11px] font-medium leading-tight group-hover:text-gold transition-colors">{doc.title}</p>
                                <p className="text-[9px] text-slate-500 font-display uppercase tracking-widest mt-1">{doc.date}</p>
                              </div>
                            </div>
                          ))}
                          <button className="w-full mt-6 py-4 bg-white/5 hover:bg-gold transition-all text-[10px] font-bold uppercase tracking-[0.2em] text-white">
                            Access Credentials Required
                          </button>
                        </div>
                     </div>

                     {/* System Info */}
                     <div className="p-6 border border-gold/10 bg-white shadow-sm flex items-center justify-between">
                        <div>
                          <p className="luxury-label">Global Health Index</p>
                          <p className="text-xl font-serif italic text-slate-900 mt-1">Excellent</p>
                        </div>
                        <div className="w-12 h-12 rounded-full border border-gold/10 flex items-center justify-center text-gold font-serif italic">
                           98
                        </div>
                     </div>
                   </div>
                </div>
              </>
            )}
          </motion.div>
        </main>
      </div>
    </div>
  );
}

function StatCard({ label, value, trend, icon: Icon, color }: any) {
  return (
    <div className="luxury-card p-6 group">
      <div className="flex items-center justify-between mb-4">
        <div className={cn(
          "w-10 h-10 flex items-center justify-center rounded-none transition-all duration-500",
          color === "gold" ? "bg-luxury-cream text-gold group-hover:bg-gold group-hover:text-white" : "bg-slate-100 text-slate-500 group-hover:bg-luxury-black group-hover:text-white"
        )}>
          <Icon size={18} strokeWidth={1} />
        </div>
        <div className="text-[10px] font-display uppercase tracking-widest text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5">
          {trend}
        </div>
      </div>
      <div>
        <h4 className="luxury-label mb-1">{label}</h4>
        <p className="text-3xl font-serif italic font-light text-slate-900 mt-1">{value}</p>
      </div>
    </div>
  );
}


