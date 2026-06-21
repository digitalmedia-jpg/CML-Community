import { ConfirmModal } from "./ConfirmModal";
import React, { useState, useEffect, useRef } from "react";
import { 
  Mail, 
  Plus, 
  Trash2, 
  Upload, 
  CheckCircle, 
  AlertTriangle, 
  Send, 
  History, 
  Users, 
  Check, 
  Settings, 
  AlertCircle, 
  Sparkles,
  RefreshCw,
  FileSpreadsheet,
  Layers,
  Search,
  ExternalLink,
  ChevronRight,
  User,
  Info,
  Smartphone,
  Monitor,
  Copy,
  ChevronUp,
  ChevronDown,
  Eye,
  FileCode,
  LayoutTemplate
} from "lucide-react";
import { 
  db,
  collection, 
  doc, 
  getDocs, 
  setDoc, 
  addDoc, 
  deleteDoc, 
  serverTimestamp 
} from "../lib/firebase";
import { motion, AnimatePresence } from "motion/react";

interface MailerContact {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  isValid: boolean;
  validationReason?: string;
  createdAt: any;
}

interface CampaignLog {
  id: string;
  senderName: string;
  subject: string;
  body: string;
  totalRecipients: number;
  successCount: number;
  failCount: number;
  timestamp: any;
  recipients: Array<{
    firstName: string;
    lastName: string;
    email: string;
    status: "success" | "failed";
    reason?: string;
  }>;
}

interface StaffMailerProps {
  companyId: string;
}

interface NewsletterBlock {
  id: string;
  type: "header" | "text" | "button" | "image" | "twocolumn" | "html" | "divider" | "footer";
  title?: string;
  content?: string;
  buttonText?: string;
  buttonUrl?: string;
  imageUrl?: string;
  backgroundColor?: string;
  textColor?: string;
  align?: "left" | "center" | "right";
  col1Title?: string;
  col1Content?: string;
  col2Title?: string;
  col2Content?: string;
}

const DISPOSABLE_DOMAINS = [
  "mailinator.com", "yopmail.com", "trashmail.com", "10minutemail.com",
  "tempmail.com", "dispostable.com", "guerrillamail.com", "maildrop.cc",
  "sharklasers.com", "guerrillamailblock.com", "getairmail.com",
  "throwawaymail.com", "tempmailaddress.com", "mytemp.email"
];

// Rich Premium Presets
const PRESETS: Record<string, { subject: string; blocks: NewsletterBlock[] }> = {
  welcome: {
    subject: "Welcome to Fiji! Your Seaside Experience Awaits 🌴",
    blocks: [
      {
        id: "header-1",
        type: "header",
        title: "SEASCAPE RESORTS & VILLAS",
        content: "Where Hospitality Meets the Ocean Breeze",
        backgroundColor: "#1e293b",
        textColor: "#C5A02D",
        align: "center"
      },
      {
        id: "image-1",
        type: "image",
        imageUrl: "https://images.unsplash.com/photo-1540553016722-983e48a2cd10?auto=format&fit=crop&w=1200&q=80",
        title: "Breathtaking Resort Panoramas"
      },
      {
        id: "text-1",
        type: "text",
        title: "Bula Vinaka {{First Name}}!",
        content: "We are absolutely thrilled to welcome you to the Seascape Resort family. Your upcoming stay is fully registered under our VIP portfolio.\n\nPlease find your booking itinerary enclosed. Let us know if you have any questions regarding private dining reservations or yacht transfers.",
        align: "left"
      },
      {
        id: "divider-1",
        type: "divider"
      },
      {
        id: "twocolumn-1",
        type: "twocolumn",
        col1Title: "🌅 Island Excursions",
        col1Content: "Enjoy complimentary non-motorized watersports and daily beachfront yoga with Fiji's finest instructors.",
        col2Title: "🍹 Happy Hours",
        col2Content: "Sip sunset cocktails at the Ocean Edge Lounge. Happy hour runs between 4:00 PM and 7:00 PM."
      },
      {
        id: "button-1",
        type: "button",
        buttonText: "Plan Your Activities Portal",
        buttonUrl: "https://cml.com.fj",
        backgroundColor: "#C5A02D",
        textColor: "#ffffff"
      },
      {
        id: "footer-1",
        type: "footer",
        content: "You received this email because you are a registered guest of Seascape Resorts Fiji."
      }
    ]
  },
  promo: {
    subject: "Exclusive Corporate Rates & Special Offers for {{First Name}} 🏷️",
    blocks: [
      {
        id: "header-p1",
        type: "header",
        title: "SEASCAPE LUXURY OFFERS",
        content: "Bespoke Deals Configured for Charles & Associates",
        backgroundColor: "#111827",
        textColor: "#C5A02D",
        align: "center"
      },
      {
        id: "text-p1",
        type: "text",
        title: "Flash Resort Sale: 25% Off Waterfront Rooms",
        content: "Greetings {{First Name}} {{Last Name}},\n\nTake advantage of our exclusive seasonal voucher program. Book prior to the end of the month to receive complimentary breakfast and spa treatment credits.",
        align: "center"
      },
      {
        id: "button-p1",
        type: "button",
        buttonText: "Redeem Flash Promo Code Now",
        buttonUrl: "https://cml.com.fj/offers",
        backgroundColor: "#C5A02D",
        textColor: "#ffffff"
      },
      {
        id: "divider-p1",
        type: "divider"
      },
      {
        id: "footer-p1",
        type: "footer",
        content: "Offers valid exclusively for registered newsletter recipients. Terms and conditions apply."
      }
    ]
  },
  internal: {
    subject: "Staff Announcement: New Operations Standard Operating Procedures (SOPs)",
    blocks: [
      {
        id: "header-i1",
        type: "header",
        title: "SEASCAPE REGULATORY BOARD",
        content: "Internal SOP Notification Protocol",
        backgroundColor: "#0f172a",
        textColor: "#f8fafc",
        align: "left"
      },
      {
        id: "text-i1",
        type: "text",
        title: "Mandatory Training Updates",
        content: "Attention all Property Staff,\n\nPlease log in to your HRMS portal and view the updated Fire Evacuation and Guest Relations Digital Flipbooks.\n\nAll staff are expected to complete their modular video training prior to the upcoming high-season review.",
        align: "left"
      },
      {
        id: "button-i1",
        type: "button",
        buttonText: "Access Staff HRMS Portal",
        buttonUrl: "https://cml.com.fj/hrms",
        backgroundColor: "#334155",
        textColor: "#ffffff"
      },
      {
        id: "footer-i1",
        type: "footer",
        content: "Seascape Internal Communication. Confidential. Please do not forward this announcement outwardly."
      }
    ]
  }
};

export const StaffMailer: React.FC<StaffMailerProps> = ({ companyId }) => {
  // Tabs: "contacts" | "campaign" | "logs" | "api-config"
  const [activeSubTab, setActiveSubTab] = useState<"contacts" | "campaign" | "logs" | "api-config">("campaign");

  const [contacts, setContacts] = useState<MailerContact[]>([]);
  const [campaignLogs, setCampaignLogs] = useState<CampaignLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [deleteContactTarget, setDeleteContactTarget] = useState<{ id: string; name: string } | null>(null);
  
  // Custom API Delivery Config State (saved in localStorage)
  const [mailConfig, setMailConfig] = useState(() => {
    try {
      const saved = localStorage.getItem(`mailer_config_${companyId}`);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.warn("[StaffMailer] Could not read mailer config from localStorage:", e);
    }
    return {
      provider: "simulation", // default simulation, can toggle to real SMTP
      smtpHost: "",
      smtpPort: "587",
      smtpUser: "",
      smtpPass: "",
      sendgridApiKey: "",
      defaultSenderEmail: "newsletter@cml.com.fj"
    };
  });

  // Save config effect
  useEffect(() => {
    try {
      localStorage.setItem(`mailer_config_${companyId}`, JSON.stringify(mailConfig));
    } catch (e) {
      console.warn("[StaffMailer] Could not save mailer config to localStorage:", e);
    }
  }, [mailConfig, companyId]);

  // Form states for manual Contact
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [emailAddress, setEmailAddress] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [validationAlert, setValidationAlert] = useState<{ type: "success" | "error" | "info"; text: string } | null>(null);

  // Campaign builder states
  const [senderName, setSenderName] = useState("Seascape Resorts Group");
  const [senderEmail, setSenderEmail] = useState(mailConfig.defaultSenderEmail || "marketing@cml.com.fj");
  const [subjectLine, setSubjectLine] = useState("Welcome to your tropical seaside escape, {{First Name}}!");
  const [isSending, setIsSending] = useState(false);
  const [sendingProgress, setSendingProgress] = useState(0);
  const [sendingStatus, setSendingStatus] = useState("");
  const [sendLogs, setSendLogs] = useState<string[]>([]);
  
  // Test Email input state
  const [testEmailAddress, setTestEmailAddress] = useState("digitalmedia@cml.com.fj");
  const [testResult, setTestResult] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [isSendingTest, setIsSendingTest] = useState(false);

  // File drag & drop state
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Newsletter builder elements state
  const [blocks, setBlocks] = useState<NewsletterBlock[]>(() => {
    // default elements layout
    return [
      {
        id: "header",
        type: "header",
        title: "SEASCAPE RESORTS & SPAS",
        content: "Hospitality SOP & Marketing Channel",
        backgroundColor: "#1e293b",
        textColor: "#C5A02D",
        align: "center"
      },
      {
        id: "text-p",
        type: "text",
        title: "Hello {{First Name}}!",
        content: "Welcome to the Seascape Campaign center. Start building high converting emails with our modular layout blocks. Click any element in the workspace to customize its styling and wording instantly.",
        align: "left"
      },
      {
        id: "action-button",
        type: "button",
        buttonText: "Access Digital Resources",
        buttonUrl: "https://cml.com.fj",
        backgroundColor: "#C5A02D",
        textColor: "#ffffff"
      },
      {
        id: "footer-note",
        type: "footer",
        content: "You are receiving this official correspondence because of your corporate partnership with Seascape Properties."
      }
    ];
  });

  const [selectedBlockId, setSelectedBlockId] = useState<string | null>("text-p");
  const [previewDevice, setPreviewDevice] = useState<"desktop" | "mobile">("desktop");
  const [previewTab, setPreviewTab] = useState<"visual" | "html">("visual");
  const [campaignSidebarTab, setCampaignSidebarTab] = useState<"add" | "settings" | "dispatch">("add");

  const [draggedItemIndex, setDraggedItemIndex] = useState<number | null>(null);
  const [draggingNewBlockType, setDraggingNewBlockType] = useState<NewsletterBlock["type"] | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [dragDropPosition, setDragDropPosition] = useState<"before" | "after" | null>(null);

  const clearDragStates = () => {
    setDraggedItemIndex(null);
    setDraggingNewBlockType(null);
    setDragOverIndex(null);
    setDragDropPosition(null);
  };

  // Email Validation Helper
  const validateEmail = (email: string): { isValid: boolean; reason?: string } => {
    const cleanEmail = email.trim().toLowerCase();
    
    // 1. Regex Match
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      return { isValid: false, reason: "Invalid Email Format Code" };
    }

    // 2. Disposable Domain Match
    const domain = cleanEmail.split("@")[1];
    if (DISPOSABLE_DOMAINS.includes(domain)) {
      return { isValid: false, reason: "Forbidden Throwaway Server" };
    }

    return { isValid: true };
  };

  // Fetch lists
  const fetchMailerData = async () => {
    setLoading(true);
    try {
      // 1. Fetch Contacts
      const contactsSnap = await getDocs(collection(db, `mailer-contacts-${companyId}`));
      const contactsList: MailerContact[] = contactsSnap.docs.map(docSnap => ({
        id: docSnap.id,
        ...docSnap.data()
      } as MailerContact));
      
      // Sort: Valid ones first, then newest
      contactsList.sort((a, b) => {
        if (a.isValid === b.isValid) {
          return 0;
        }
        return a.isValid ? -1 : 1;
      });

      setContacts(contactsList);

      // 2. Fetch Logs
      const logsSnap = await getDocs(collection(db, `mailer-logs-${companyId}`));
      const logsList: CampaignLog[] = logsSnap.docs.map(docSnap => ({
        id: docSnap.id,
        ...docSnap.data()
      } as CampaignLog));
      
      // Sort newest first
      logsList.sort((a, b) => {
        const timeA = a.timestamp?.seconds || 0;
        const timeB = b.timestamp?.seconds || 0;
        return timeB - timeA;
      });

      setCampaignLogs(logsList);
    } catch (err) {
      console.error("Error reading Mailer database:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMailerData();
  }, [companyId]);

  // Seed sample database
  const seedSampleLists = async () => {
    setLoading(true);
    try {
      const samples = [
        { firstName: "Charles", lastName: "Viti (VIP)", email: "charles.viti@cml.com.fj" },
        { firstName: "Savenaca", lastName: "Radrodro", email: "savenaca.r@ramada.com" },
        { firstName: "Mereoni", lastName: "Nasilasila", email: "mereoni.n@wyndhamfiji.com" },
        { firstName: "John", lastName: "Doe (Fake)", email: "johnny99@mailinator.com" }, // Throwaway
        { firstName: "Invalid", lastName: "User", email: "invalid-email-format@" }, // Bad format
        { firstName: "Marika", lastName: "Tuicuvu", email: "marika.t@cml.com.fj" },
        { firstName: "Rohit", lastName: "Singh", email: "rohit@cml.com.fj" }
      ];

      for (const item of samples) {
        const val = validateEmail(item.email);
        const contactData = {
          firstName: item.firstName,
          lastName: item.lastName,
          email: item.email,
          isValid: val.isValid,
          validationReason: val.reason || "",
          createdAt: serverTimestamp()
        };

        const docId = `contact-${Math.random().toString(36).substr(2, 9)}`;
        await setDoc(doc(db, `mailer-contacts-${companyId}`, docId), contactData);
      }

      await fetchMailerData();
      setValidationAlert({
        type: "success",
        text: "Database populated with standard Fijian hotel industry samples and intentional flagged addresses!"
      });
    } catch (err) {
      console.error("Error seeding mailer samples:", err);
    } finally {
      setLoading(false);
    }
  };

  // Add individual contact manually
  const handleAddContact = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationAlert(null);

    const emailTrimmed = emailAddress.trim();
    if (!firstName.trim() || !lastName.trim() || !emailTrimmed) {
      setValidationAlert({ type: "error", text: "First Name, Last Name and Email are all required." });
      return;
    }

    const { isValid, reason } = validateEmail(emailTrimmed);

    try {
      const contactData: Omit<MailerContact, "id"> = {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: emailTrimmed,
        isValid,
        validationReason: reason || "",
        createdAt: serverTimestamp()
      };

      const docId = `contact-${Date.now()}`;
      await setDoc(doc(db, `mailer-contacts-${companyId}`, docId), contactData);

      setFirstName("");
      setLastName("");
      setEmailAddress("");
      setShowAddForm(false);
      setValidationAlert({
        type: "success",
        text: isValid 
          ? `Successfully registered ${firstName} ${lastName}! Email verified.` 
          : `Security WARNING: Registered ${firstName} ${lastName} but the email was flagged: "${reason}"`
      });

      fetchMailerData();
    } catch (err) {
      console.error("Save error:", err);
      setValidationAlert({ type: "error", text: "Database save failed. Please verify Firestore connectivity." });
    }
  };

  // Delete Individual Contact Confirm
  const handleDeleteContactConfirm = async () => {
    if (!deleteContactTarget) return;

    try {
      await deleteDoc(doc(db, `mailer-contacts-${companyId}`, deleteContactTarget.id));
      setContacts(prev => prev.filter(c => c.id !== deleteContactTarget.id));
    } catch (err) {
      console.error("Delete failed:", err);
    } finally {
      setDeleteContactTarget(null);
    }
  };

  // Parsed bulk file import CSV/TXT
  const processCsvImport = async (text: string) => {
    const lines = text.split(/\r?\n/);
    let importedCount = 0;
    let flaggedCount = 0;

    for (const line of lines) {
      if (!line.trim()) continue;
      
      const parts = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
      if (parts.length < 3) continue;

      const fName = parts[0].replace(/"/g, "").trim();
      const lName = parts[1].replace(/"/g, "").trim();
      const email = parts[2].replace(/"/g, "").trim();

      // Skip header lines
      if (fName.toLowerCase() === "first name" || email.toLowerCase() === "email") {
        continue;
      }

      if (!email || !fName) continue;

      const val = validateEmail(email);
      const contactData = {
        firstName: fName,
        lastName: lName || "",
        email: email,
        isValid: val.isValid,
        validationReason: val.reason || "",
        createdAt: serverTimestamp()
      };

      const docId = `contact-csv-${Math.random().toString(36).substr(2, 9)}`;
      await setDoc(doc(db, `mailer-contacts-${companyId}`, docId), contactData);
      
      importedCount++;
      if (!val.isValid) flaggedCount++;
    }

    setValidationAlert({
      type: "success",
      text: `Bulk file ingestion complete: Registered ${importedCount} contacts (${flaggedCount} flagged as invalid/unsafe).`
    });
    fetchMailerData();
  };

  // Drag & drop handlers
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      handleFileRead(file);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileRead(e.target.files[0]);
    }
  };

  const handleFileRead = (file: File) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target && typeof event.target.result === "string") {
        processCsvImport(event.target.result);
      }
    };
    reader.readAsText(file);
  };

  // Preset Applicator
  const applyPreset = (key: keyof typeof PRESETS) => {
    const pr = PRESETS[key];
    if (confirm(`Do you want to overwrite your active workspace blocks with the "${key}" layout preset?`)) {
      setSubjectLine(pr.subject);
      setBlocks(JSON.parse(JSON.stringify(pr.blocks)));
      setSelectedBlockId(pr.blocks[0]?.id || null);
    }
  };

  // Add Blocks dynamically
  const createBlockInstance = (type: NewsletterBlock["type"]): NewsletterBlock => {
    const id = `block-${type}-${Math.random().toString(36).substr(2, 5)}`;
    let newBlock: NewsletterBlock = { id, type };

    switch (type) {
      case "header":
        newBlock = {
          id,
          type,
          title: "SEASCAPE PROPERTIES",
          content: "Announcements & Premium Correspondence",
          backgroundColor: "#1e293b",
          textColor: "#C5A02D",
          align: "center"
        };
        break;
      case "text":
        newBlock = {
          id,
          type,
          title: "Announcing Special Updates",
          content: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aliquam ac lacus non dolor tristique interdum. Personalized values like {{First Name}} will replace automatically during real delivery loop.",
          align: "left"
        };
        break;
      case "button":
        newBlock = {
          id,
          type,
          buttonText: "Click Here to Book",
          buttonUrl: "https://cml.com.fj",
          backgroundColor: "#C5A02D",
          textColor: "#ffffff"
        };
        break;
      case "image":
        newBlock = {
          id,
          type,
          imageUrl: "https://images.unsplash.com/photo-1540553016722-983e48a2cd10?auto=format&fit=crop&w=1200&q=80",
          title: "Fijian Paradise Beach Resort view"
        };
        break;
      case "twocolumn":
        newBlock = {
          id,
          type,
          col1Title: "Column One Title",
          col1Content: "Premium details or service descriptors suited side-by-side inside client newsletters.",
          col2Title: "Column Two Title",
          col2Content: "Highlight secondary services, special spa features, or key internal SOP links easily."
        };
        break;
      case "html":
        newBlock = {
          id,
          type,
          content: `<!-- Drag & Drop HTML layout -->
<div style="background-color: #fca5a5; padding: 20px; text-align: center; border: 2px dashed #dc2626;">
  <h3 style="margin: 0; color: #991b1b; font-family: serif;">Luxury Flash Notice Header</h3>
  <p style="margin: 5px 0 0 0; font-size: 11px; color: #7f1d1d;">Write any raw, inline CSS HTML and build customized layouts flawlessly.</p>
</div>`
        };
        break;
      case "divider":
        newBlock = { id, type };
        break;
      case "footer":
        newBlock = {
          id,
          type,
          content: "Seascape Resort Ltd, Denarau Island, Nadi, Fiji Islands. Unsubscribe"
        };
        break;
    }
    return newBlock;
  };

  const addBlock = (type: NewsletterBlock["type"]) => {
    const newBlock = createBlockInstance(type);
    setBlocks(prev => [...prev, newBlock]);
    setSelectedBlockId(newBlock.id);
  };

  const insertBlockAt = (type: NewsletterBlock["type"], index: number) => {
    const newBlock = createBlockInstance(type);
    const copy = [...blocks];
    copy.splice(index, 0, newBlock);
    setBlocks(copy);
    setSelectedBlockId(newBlock.id);
  };

  // Block Actions (Delete, Sort, Duplicate)
  const deleteBlock = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (blocks.length <= 1) {
      alert("A newsletter must contain at least 1 building block element.");
      return;
    }
    setBlocks(prev => prev.filter(b => b.id !== id));
    if (selectedBlockId === id) {
      setSelectedBlockId(null);
    }
  };

  const moveBlock = (index: number, direction: "up" | "down", e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const newIdx = direction === "up" ? index - 1 : index + 1;
    if (newIdx < 0 || newIdx >= blocks.length) return;

    const copy = [...blocks];
    const temp = copy[index];
    copy[index] = copy[newIdx];
    copy[newIdx] = temp;
    setBlocks(copy);
  };

  const duplicateBlock = (block: NewsletterBlock, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const duplicated: NewsletterBlock = {
      ...JSON.parse(JSON.stringify(block)),
      id: `${block.type}-${Math.random().toString(36).substr(2, 5)}`
    };
    const index = blocks.findIndex(b => b.id === block.id);
    const copy = [...blocks];
    copy.splice(index + 1, 0, duplicated);
    setBlocks(copy);
    setSelectedBlockId(duplicated.id);
  };

  // drag sorting
  const handleDragStartBlock = (index: number) => {
    setDraggedItemIndex(index);
  };

  const handleDragOverBlock = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.stopPropagation();

    // Compute if we drag over top half or bottom half of block index
    const rect = e.currentTarget.getBoundingClientRect();
    const relativeY = e.clientY - rect.top;
    const isTopHalf = relativeY < rect.height / 2;

    setDragOverIndex(index);
    setDragDropPosition(isTopHalf ? "before" : "after");
  };

  const handleDragEndBlock = () => {
    clearDragStates();
  };

  const handleDropOnWorkspaceBlock = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    e.stopPropagation();

    let insertIndex = targetIndex;
    if (dragDropPosition === "after") {
      insertIndex = targetIndex + 1;
    }

    if (draggingNewBlockType) {
      insertBlockAt(draggingNewBlockType, insertIndex);
    } else if (draggedItemIndex !== null) {
      const sourceIndex = draggedItemIndex;
      if (sourceIndex === targetIndex) {
        clearDragStates();
        return;
      }

      const copy = [...blocks];
      const [movedBlock] = copy.splice(sourceIndex, 1);

      let finalInsertIndex = insertIndex;
      if (sourceIndex < finalInsertIndex) {
        finalInsertIndex -= 1;
      }

      copy.splice(finalInsertIndex, 0, movedBlock);
      setBlocks(copy);
    }

    clearDragStates();
  };

  const handleToolboxDragStart = (e: React.DragEvent, type: NewsletterBlock["type"]) => {
    setDraggingNewBlockType(type);
    e.dataTransfer.setData("text/plain", `add-block:${type}`);
    e.dataTransfer.effectAllowed = "copy";
  };

  const handleToolboxDragEnd = () => {
    clearDragStates();
  };

  // Dynamic Editor Property Updates
  const updateBlockProperty = (field: keyof NewsletterBlock, value: any) => {
    if (!selectedBlockId) return;
    setBlocks(prev => prev.map(b => {
      if (b.id === selectedBlockId) {
        return { ...b, [field]: value };
      }
      return b;
    }));
  };

  // Compile final Newsletter HTML structure
  const compileBespokeHtml = (recipient: { firstName: string; lastName: string; email: string } = { firstName: "Charles", lastName: "Viti", email: "charles.viti@cml.com.fj" }): string => {
    const replaceVariables = (str: string) => {
      if (!str) return "";
      return str
        .replace(/\{\{\s*First Name\s*\}\}/gi, recipient.firstName)
        .replace(/\{\{\s*Last Name\s*\}\}/gi, recipient.lastName)
        .replace(/\{\{\s*Email\s*\}\}/gi, recipient.email);
    };

    let compiledBlocks = "";

    blocks.forEach(b => {
      switch (b.type) {
        case "header":
          compiledBlocks += `
            <table width="100%" cellpadding="0" cellspacing="0" style="background-color: ${b.backgroundColor || "#1e293b"}; color: ${b.textColor || "#ffffff"}; border-collapse: collapse; font-family: 'Playfair Display', Georgia, serif;">
              <tr>
                <td style="padding: 30px 20px; text-align: ${b.align || "center"};">
                  <h1 style="margin: 0; font-size: 24px; letter-spacing: 2px; font-weight: normal; color: ${b.textColor || "#C5A02D"}">${replaceVariables(b.title || "")}</h1>
                  ${b.content ? `<p style="margin: 10px 0 0 0; font-size: 12px; font-family: 'Inter', sans-serif; opacity: 0.85; letter-spacing: 1px;">${replaceVariables(b.content)}</p>` : ""}
                </td>
              </tr>
            </table>
          `;
          break;
        case "image":
          compiledBlocks += `
            <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse;">
              <tr>
                <td style="padding: 0; text-align: center;">
                  <img src="${b.imageUrl}" alt="${b.title || "Campaign Image"}" style="width: 100%; max-width: 600px; height: auto; display: block; border: 0;" />
                  ${b.title ? `<div style="background-color: #fafafa; padding: 8px; font-size: 10px; font-family: 'Inter', sans-serif; color: #666666; font-style: italic;">${b.title}</div>` : ""}
                </td>
              </tr>
            </table>
          `;
          break;
        case "text":
          compiledBlocks += `
            <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-collapse: collapse; font-family: 'Inter', system-ui, sans-serif;">
              <tr>
                <td style="padding: 30px 24px; text-align: ${b.align || "left"}; line-height: 1.6; color: #334155; font-size: 14px;">
                  ${b.title ? `<h2 style="font-family: 'Playfair Display', Georgia, serif; font-size: 20px; color: #0f172a; margin-top: 0; margin-bottom: 12px; font-weight: normal;">${replaceVariables(b.title)}</h2>` : ""}
                  <div style="white-space: pre-line;">${replaceVariables(b.content || "")}</div>
                </td>
              </tr>
            </table>
          `;
          break;
        case "button":
          compiledBlocks += `
            <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-collapse: collapse; font-family: 'Inter', sans-serif;">
              <tr>
                <td style="padding: 15px 24px; text-align: center;">
                  <!--[if mso]>
                  <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="${b.buttonUrl || "#"}" style="height:40px;v-text-anchor:middle;width:240px;" arcsize="0%" stroke="f" fillcolor="${b.backgroundColor || "#C5A02D"}">
                    <w:anchorlock/>
                    <center style="color:${b.textColor || "#ffffff"};font-family:sans-serif;font-size:13px;font-weight:bold;">${b.buttonText}</center>
                  </v:roundrect>
                  <![endif]-->
                  <a href="${b.buttonUrl || "#"}" style="background-color: ${b.backgroundColor || "#C5A02D"}; color: ${b.textColor || "#ffffff"}; display: inline-block; padding: 12px 28px; text-decoration: none; font-size: 13px; font-weight: bold; font-family: 'Inter', sans-serif; letter-spacing: 1px;" target="_blank">${b.buttonText}</a>
                </td>
              </tr>
            </table>
          `;
          break;
        case "twocolumn":
          compiledBlocks += `
            <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-collapse: collapse; font-family: 'Inter', sans-serif; text-align: left; padding: 10px 0;">
              <tr>
                <td style="padding: 15px 24px;">
                  <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse;">
                    <tr>
                      <td width="48%" valign="top" style="padding-right: 12px;">
                        <h3 style="font-size: 13px; color: #011627; margin: 0 0 8px 0; border-bottom: 1px solid #e1e8ed; padding-bottom: 4px; uppercase">${b.col1Title}</h3>
                        <p style="font-size: 11px; line-height: 1.5; color: #4a5568; margin: 0;">${b.col1Content}</p>
                      </td>
                      <td width="4%" style="font-size:1px;">&nbsp;</td>
                      <td width="48%" valign="top" style="padding-left: 12px;">
                        <h3 style="font-size: 13px; color: #011627; margin: 0 0 8px 0; border-bottom: 1px solid #e1e8ed; padding-bottom: 4px; uppercase">${b.col2Title}</h3>
                        <p style="font-size: 11px; line-height: 1.5; color: #4a5568; margin: 0;">${b.col2Content}</p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          `;
          break;
        case "html":
          compiledBlocks += `
            <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse;">
              <tr>
                <td style="padding: 0;">
                  ${replaceVariables(b.content || "")}
                </td>
              </tr>
            </table>
          `;
          break;
        case "divider":
          compiledBlocks += `
            <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-collapse: collapse;">
              <tr>
                <td style="padding: 15px 24px;">
                  <div style="border-top: 1px dashed #cccccc; height: 1px; font-size: 1px; line-height: 1px;">&nbsp;</div>
                </td>
              </tr>
            </table>
          `;
          break;
        case "footer":
          compiledBlocks += `
            <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #fafafa; border-collapse: collapse; font-family: 'Inter', sans-serif;">
              <tr>
                <td style="padding: 30px 24px; text-align: center; font-size: 10px; color: #7f8c8d; line-height: 1.5;">
                  <p style="margin: 0 0 8px 0;">${replaceVariables(b.content || "")}</p>
                  <p style="margin: 0;">&copy; ${new Date().getFullYear()} Seascape Properties | Denarau Resorts. All rights reserved.</p>
                  <p style="margin: 10px 0 0 0; font-size: 9px;"><a href="#" style="color: #bf9f2c; text-decoration: underline;">Manage Preferences</a> | <a href="#" style="color: #bf9f2c; text-decoration: underline;">Unsubscribe</a></p>
                </td>
              </tr>
            </table>
          `;
          break;
      }
    });

    return `
      <!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
      <html xmlns="http://www.w3.org/1900/xhtml" lang="en">
        <head>
          <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <title>${subjectLine}</title>
          <style type="text/css">
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700&family=Playfair+Display:ital,wght@0,400;0,700;1,450&display=swap');
            body { margin: 0; padding: 0; min-width: 100%; width: 100% !important; background-color: #f1f5f9; }
            img { border: 0; max-width: 100%; height: auto; outline: none; text-decoration: none; }
            .content-wrapper { max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e1e8ed; }
            @media only screen and (max-width: 599px) {
              .content-wrapper { width: 100% !important; }
            }
          </style>
        </head>
        <body>
          <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f1f5f9; padding: 20px 0;">
            <tr>
              <td>
                <div class="content-wrapper">
                  ${compiledBlocks}
                </div>
              </td>
            </tr>
          </table>
        </body>
      </html>
    `;
  };

  // SEND SINGLE TEST EMAIL
  const handleSendTestEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setTestResult(null);

    const testTarget = testEmailAddress.trim();
    if (!testTarget) {
      setTestResult({ type: "error", text: "Please declare a valid destination address." });
      return;
    }

    setIsSendingTest(true);

    // Compile customized text
    const sampleRecipient = {
      firstName: "Charles",
      lastName: "VIP (Test)",
      email: testTarget
    };
    const compiledNewsletterHtml = compileBespokeHtml(sampleRecipient);

    try {
      const response = await fetch("/api/campaigns/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          senderName: `${senderName} [TEST]`,
          senderEmail,
          recipientEmail: testTarget,
          recipientName: `${sampleRecipient.firstName} ${sampleRecipient.lastName}`,
          subject: `${subjectLine} [TEST COPY]`,
          body: compiledNewsletterHtml, // HTML compiled newsletter body
          config: mailConfig
        })
      });

      const resData = await response.json();
      if (response.ok && resData.success) {
        setTestResult({
          type: "success",
          text: `Test dispatch delivered successfully to "${testTarget}" using ${resData.mode === "simulation" ? "Sandbox Simulation" : "Selected Delivery SMTP Port"}!`
        });
      } else {
        setTestResult({
          type: "error",
          text: `Server API rejection: ${resData.error || "SMTP authentication failed"}`
        });
      }
    } catch (err: any) {
      setTestResult({
        type: "error",
        text: `Network failure connecting to delivery daemon: ${err.message}`
      });
    } finally {
      setIsSendingTest(false);
    }
  };

  // Dispatch campaign loop to everyone
  const handleSendCampaign = async (e: React.FormEvent) => {
    e.preventDefault();

    const validContacts = contacts.filter(c => c.isValid);
    if (validContacts.length === 0) {
      alert("No valid contacts on mailing lists. Please add or import some safe subscribers beforehand.");
      return;
    }

    if (!confirm(`Confirm broad-scale rollout of "${subjectLine}" to ${validContacts.length} valid corporate channels? This operation is irreversible.`)) {
      return;
    }

    setIsSending(true);
    setSendingProgress(0);
    setSendLogs([]);
    setSendingStatus("Initializing broad campaign broadcast...");

    const delayMs = 200; // 200ms sleep delay between dispatches
    const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

    const total = validContacts.length;
    let completed = 0;
    let successCount = 0;
    let failCount = 0;
    const recipientsLogs: Array<{
      firstName: string;
      lastName: string;
      email: string;
      status: "success" | "failed";
      reason?: string;
    }> = [];

    // Begin Bulk Delivery
    for (let i = 0; i < total; i++) {
      const contact = validContacts[i];
      const percent = Math.round(((i + 1) / total) * 100);
      
      setSendingProgress(percent);
      setSendingStatus(`Dispatching to target ${i + 1}/${total}: ${contact.email}...`);

      let logMsg = "";
      let deliverySuccess = false;
      let errorReason = "";

      // Compile beautiful customized newsletter html template
      const customizedHtml = compileBespokeHtml({
        firstName: contact.firstName,
        lastName: contact.lastName,
        email: contact.email
      });

      try {
        const response = await fetch("/api/campaigns/send", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            senderName,
            senderEmail,
            recipientEmail: contact.email,
            recipientName: `${contact.firstName} ${contact.lastName}`,
            subject: subjectLine,
            body: customizedHtml,
            config: mailConfig
          })
        });

        const resData = await response.json();
        if (response.ok && resData.success) {
          deliverySuccess = true;
          logMsg = `[OK] Delivered to ${contact.email} (${resData.mode || "production"})`;
          successCount++;
        } else {
          errorReason = resData.error || "Delivery relay refused connection";
          logMsg = `[FAIL] Refused and logged for ${contact.email}: ${errorReason}`;
          failCount++;
        }
      } catch (err: any) {
        errorReason = err.message || "Relay connection timed out";
        logMsg = `[FAIL] Timeout on ${contact.email}: ${errorReason}`;
        failCount++;
      }

      setSendLogs(prev => [...prev, logMsg]);
      recipientsLogs.push({
        firstName: contact.firstName,
        lastName: contact.lastName,
        email: contact.email,
        status: deliverySuccess ? "success" : "failed",
        reason: errorReason || undefined
      });

      completed++;
      await delay(delayMs);
    }

    setSendingStatus("Publishing campaign logs...");

    try {
      const campaignLogData = {
        senderName,
        subject: subjectLine,
        body: `Campaign dispatched with ${blocks.length} building blocks. Subject: ${subjectLine}`,
        totalRecipients: total,
        successCount,
        failCount,
        timestamp: serverTimestamp(),
        recipients: recipientsLogs
      };

      await addDoc(collection(db, `mailer-logs-${companyId}`), campaignLogData);
      fetchMailerData();

      setSendingStatus(`Campaign rollout finished! ${successCount} successful, ${failCount} errors.`);
    } catch (saveErr) {
      console.error("Unable to save broadcast statistics:", saveErr);
      setSendingStatus(`Dispatched successfully but logs failed to record: FireStore write error.`);
    } finally {
      setIsSending(false);
    }
  };

  const filteredContacts = contacts.filter(c => 
    c.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.lastName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="w-full flex flex-col gap-6" id="staff-mailer-module">
      
      {/* SELECTION BAR OR WARNING IF DB EMPTY */}
      {contacts.length === 0 && (
        <div className="p-4 bg-[#C5A02D]/10 border border-[#C5A02D]/35 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-3">
            <Sparkles className="text-[#C5A02D] shrink-0" size={20} />
            <div>
              <p className="text-xs font-serif italic font-bold text-slate-900">Mailing List Database Empty</p>
              <p className="text-[10px] text-slate-500">Would you like to seed some mock hotel industry guest contacts with verified formats and disposable address indicators?</p>
            </div>
          </div>
          <button
            onClick={seedSampleLists}
            className="bg-slate-950 hover:bg-[#C5A02D] text-white py-1.5 px-4 text-[9px] font-display uppercase tracking-wider font-extrabold transition-all"
          >
            Prepopulate Fiji Resorts Samples
          </button>
        </div>
      )}

      {/* COMPONENT TITLE GRID */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-black/5" id="mailer-title-grid">
        <div>
          <h1 className="text-2xl md:text-3xl font-serif text-slate-900 flex items-center gap-2.5">
            <Mail className="text-[#C5A02D]" size={28} />
            Seascape Campaigns & Corporate Mailer
          </h1>
          <p className="text-xs text-slate-500 max-w-2xl mt-1 font-light leading-relaxed">
            Corporate newsletter and internal SOP announcement engine. Leverage our dynamic drag-and-drop template blocks, test-sending capabilities, and real-time validation checks.
          </p>
        </div>

        {/* TABS SELECTOR */}
        <div className="flex flex-wrap items-center gap-1 bg-slate-100 p-1 border border-slate-200 shadow-sm rounded-none">
          <button
            onClick={() => setActiveSubTab("campaign")}
            className={`px-3 py-1.5 text-[10px] font-display font-bold uppercase tracking-wider transition-all ${
              activeSubTab === "campaign" ? "bg-slate-900 text-white shadow-sm" : "text-slate-600 hover:bg-slate-200"
            }`}
          >
            <LayoutTemplate className="inline-block mr-1" size={13} /> 1. Edit Newsletter
          </button>
          <button
            onClick={() => { setActiveSubTab("contacts"); setValidationAlert(null); }}
            className={`px-3 py-1.5 text-[10px] font-display font-bold uppercase tracking-wider transition-all ${
              activeSubTab === "contacts" ? "bg-slate-900 text-white shadow-sm" : "text-slate-600 hover:bg-slate-200"
            }`}
          >
            <Users className="inline-block mr-1" size={13} /> 2. Contacts ({contacts.length})
          </button>
          <button
            onClick={() => setActiveSubTab("logs")}
            className={`px-3 py-1.5 text-[10px] font-display font-bold uppercase tracking-wider transition-all ${
              activeSubTab === "logs" ? "bg-slate-900 text-white shadow-sm" : "text-slate-600 hover:bg-slate-200"
            }`}
          >
            <History className="inline-block mr-1" size={13} /> 3. Dispatch Logs ({campaignLogs.length})
          </button>
          <button
            onClick={() => setActiveSubTab("api-config")}
            className={`px-3 py-1.5 text-[10px] font-display font-bold uppercase tracking-wider transition-all ${
              activeSubTab === "api-config" ? "bg-slate-900 text-gold text-yellow-350 shadow-sm animate-pulse" : "text-slate-600 hover:bg-slate-200"
            }`}
          >
            ⚙ Delivery Settings
          </button>
        </div>
      </div>

      {/* DASHBOARD STATS ROW */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="border border-slate-150 bg-white p-4 flex flex-col justify-between">
          <span className="text-[8px] uppercase tracking-wider font-bold text-slate-400">Total Subscribers</span>
          <span className="text-xl font-bold text-slate-800 mt-1">{contacts.length} Records</span>
          <span className="text-[9px] text-slate-500 mt-1 flex items-center gap-1">Validated database count</span>
        </div>

        <div className="border border-slate-150 bg-white p-4 flex flex-col justify-between">
          <span className="text-[8px] uppercase tracking-wider font-bold text-slate-400">Validated Safe Emails</span>
          <span className="text-xl font-bold text-emerald-600 mt-1">
            {contacts.filter(c => c.isValid).length} Ready
          </span>
          <span className="text-[9px] text-slate-500 mt-1">100% spam-trap validated</span>
        </div>

        <div className="border border-slate-150 bg-white p-4 flex flex-col justify-between">
          <span className="text-[8px] uppercase tracking-wider font-bold text-slate-400">Flagged Disposable/Unsafe</span>
          <span className={`text-xl font-bold mt-1 ${contacts.some(c => !c.isValid) ? "text-red-500" : "text-slate-400"}`}>
            {contacts.filter(c => !c.isValid).length} Flagged
          </span>
          <span className="text-[9px] text-slate-500 mt-1">Safe-mode filters applied</span>
        </div>

        <div className="border border-slate-150 bg-white p-4 flex flex-col justify-between">
          <span className="text-[8px] uppercase tracking-wider font-bold text-slate-400">Outgoing Protocol</span>
          <span className="text-xl font-bold text-[#C5A02D] uppercase mt-1">
            {mailConfig.provider === "simulation" ? "Sandbox Simulation" : mailConfig.provider.toUpperCase()}
          </span>
          <span className="text-[9px] text-slate-500 mt-1">Click settings tab to adjust</span>
        </div>
      </div>

      {/* SUBTABS RENDERING WITH ANIMATION */}
      <AnimatePresence mode="wait">
        
        {/* TAB 1: NEWSLETTER BUILDER & CAMPAIGN CREATOR */}
        {activeSubTab === "campaign" && (
          <motion.div
            key="tab-campaign"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="grid grid-cols-1 xl:grid-cols-12 gap-0 border border-slate-200 bg-white shadow-xl rounded-xl overflow-hidden min-h-[780px]"
          >
            {/* 1. SMALL VERTICAL NAVIGATION RAIL (LEFT DIRECTORY) */}
            <div className="hidden sm:flex xl:col-span-1 flex-col items-center border-r border-slate-150 py-6 bg-slate-50 gap-6 select-none w-16 shrink-0 justify-start">
              <button
                type="button"
                onClick={() => setCampaignSidebarTab("add")}
                className={`p-3 rounded-xl flex flex-col items-center text-center gap-1 transition-all w-12 h-12 justify-center ${
                  campaignSidebarTab === "add" ? "bg-slate-900 text-[#C5A02D] shadow" : "text-slate-500 hover:bg-slate-150 hover:text-slate-800"
                }`}
                title="Add Content Blocks"
              >
                <Plus size={16} />
                <span className="text-[7.5px] font-bold uppercase tracking-wider block">Add</span>
              </button>
              <button
                type="button"
                onClick={() => setCampaignSidebarTab("settings")}
                className={`p-3 rounded-xl flex flex-col items-center text-center gap-1 transition-all w-12 h-12 justify-center ${
                  campaignSidebarTab === "settings" ? "bg-slate-900 text-[#C5A02D] shadow" : "text-slate-500 hover:bg-slate-150 hover:text-slate-800"
                }`}
                title="Branding & Core Metadata Settings"
              >
                <Sparkles size={16} />
                <span className="text-[7.5px] font-bold uppercase tracking-wider block">Styles</span>
              </button>
              <button
                type="button"
                onClick={() => setCampaignSidebarTab("dispatch")}
                className={`p-3 rounded-xl flex flex-col items-center text-center gap-1 transition-all w-12 h-12 justify-center ${
                  campaignSidebarTab === "dispatch" ? "bg-slate-900 text-[#C5A02D] shadow relative" : "text-slate-500 hover:bg-slate-150 hover:text-slate-800"
                }`}
                title="Send Test & Broadcast Control"
              >
                <Send size={15} />
                <span className="text-[7.5px] font-bold uppercase tracking-wider block">Dispatch</span>
              </button>
            </div>

            {/* 2. DYNAMIC PRIMARY SIDEBAR PANEL (LEFT INNER DRAWER) */}
            <div className="xl:col-span-3 border-r border-slate-150 bg-white flex flex-col h-[750px] overflow-y-auto" id="builder-toolbox">
              {/* RENDER TAB: ADD BLOCKS */}
              {campaignSidebarTab === "add" && (
                <div className="p-4 flex flex-col gap-4 animate-in fade-in duration-150">
                  <div className="border-b pb-2.5">
                    <span className="text-[9px] uppercase tracking-wider font-extrabold text-slate-400 block">
                      MAILCHIMP BLOCKS INVENTORY
                    </span>
                    <p className="text-[8.5px] text-slate-500 mt-1 leading-relaxed">
                      Drag a tile directly into the central live canvas preview, or click to append block instantly.
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    {/* Widget: Heading (Header) */}
                    <button
                      draggable={true}
                      onDragStart={(e) => handleToolboxDragStart(e, "header")}
                      onDragEnd={handleToolboxDragEnd}
                      onClick={() => addBlock("header")}
                      className="p-3 border border-slate-200 bg-slate-50 hover:bg-slate-100 hover:border-[#C5A02D] text-center flex flex-col items-center justify-center gap-1.5 transition-all cursor-grab active:cursor-grabbing rounded shadow-sm group"
                    >
                      <div className="w-8 h-8 rounded-full bg-slate-950 text-white flex items-center justify-center text-xs font-serif font-black shadow-sm group-hover:scale-105 transition-transform">Hi</div>
                      <div>
                        <span className="text-[9.5px] block font-extrabold text-slate-800">Heading Block</span>
                        <span className="text-[7.5px] block text-slate-400">Title & Tagline</span>
                      </div>
                    </button>

                    {/* Widget: Text Paragraph */}
                    <button
                      draggable={true}
                      onDragStart={(e) => handleToolboxDragStart(e, "text")}
                      onDragEnd={handleToolboxDragEnd}
                      onClick={() => addBlock("text")}
                      className="p-3 border border-slate-200 bg-slate-50 hover:bg-slate-100 hover:border-[#C5A02D] text-center flex flex-col items-center justify-center gap-1.5 transition-all cursor-grab active:cursor-grabbing rounded shadow-sm group"
                    >
                      <div className="w-8 h-8 rounded-full bg-slate-100 border text-slate-800 flex items-center justify-center text-xs font-serif font-black shadow-sm group-hover:scale-105 transition-transform">¶</div>
                      <div>
                        <span className="text-[9.5px] block font-extrabold text-slate-800">Paragraph Text</span>
                        <span className="text-[7.5px] block text-slate-400">Editorial Wording</span>
                      </div>
                    </button>

                    {/* Widget: Action CTA button */}
                    <button
                      draggable={true}
                      onDragStart={(e) => handleToolboxDragStart(e, "button")}
                      onDragEnd={handleToolboxDragEnd}
                      onClick={() => addBlock("button")}
                      className="p-3 border border-slate-200 bg-slate-50 hover:bg-slate-100 hover:border-[#C5A02D] text-center flex flex-col items-center justify-center gap-1.5 transition-all cursor-grab active:cursor-grabbing rounded shadow-sm group"
                    >
                      <div className="w-8 h-8 rounded bg-[#C5A02D] text-white flex items-center justify-center text-[9px] font-black tracking-wider shadow-sm group-hover:scale-105 transition-transform">CTA</div>
                      <div>
                        <span className="text-[9.5px] block font-extrabold text-slate-800">Action Button</span>
                        <span className="text-[7.5px] block text-slate-400">Click redirects</span>
                      </div>
                    </button>

                    {/* Widget: Hero Image */}
                    <button
                      draggable={true}
                      onDragStart={(e) => handleToolboxDragStart(e, "image")}
                      onDragEnd={handleToolboxDragEnd}
                      onClick={() => addBlock("image")}
                      className="p-3 border border-slate-200 bg-slate-50 hover:bg-slate-100 hover:border-[#C5A02D] text-center flex flex-col items-center justify-center gap-1.5 transition-all cursor-grab active:cursor-grabbing rounded shadow-sm group"
                    >
                      <div className="w-8 h-8 rounded-full bg-blue-50 border border-blue-105 text-blue-700 flex items-center justify-center text-xs shadow-sm group-hover:scale-105 transition-transform">📷</div>
                      <div>
                        <span className="text-[9.5px] block font-extrabold text-[#0f172a]">Hero Image</span>
                        <span className="text-[7.5px] block text-slate-400">Full Banner Hotlink</span>
                      </div>
                    </button>

                    {/* Widget: 2 Column Highlights */}
                    <button
                      draggable={true}
                      onDragStart={(e) => handleToolboxDragStart(e, "twocolumn")}
                      onDragEnd={handleToolboxDragEnd}
                      onClick={() => addBlock("twocolumn")}
                      className="p-3 border border-slate-200 bg-slate-50 hover:bg-slate-100 hover:border-[#C5A02D] text-center flex flex-col items-center justify-center gap-1.5 transition-all cursor-grab active:cursor-grabbing rounded shadow-sm group"
                    >
                      <div className="w-8 h-8 rounded border-dashed border-2 flex items-center justify-center text-xs text-slate-500 bg-white font-bold group-hover:scale-105 transition-transform">⧉</div>
                      <div>
                        <span className="text-[9.5px] block font-extrabold text-slate-800">2-Col Highlights</span>
                        <span className="text-[7.5px] block text-slate-400">Split description</span>
                      </div>
                    </button>

                    {/* Widget: Raw custom HTML */}
                    <button
                      draggable={true}
                      onDragStart={(e) => handleToolboxDragStart(e, "html")}
                      onDragEnd={handleToolboxDragEnd}
                      onClick={() => addBlock("html")}
                      className="p-3 border border-slate-200 bg-slate-50 hover:bg-slate-100 hover:border-[#C5A02D] text-center flex flex-col items-center justify-center gap-1.5 transition-all cursor-grab active:cursor-grabbing rounded shadow-sm group"
                    >
                      <div className="w-8 h-8 bg-slate-900 rounded text-amber-400 flex items-center justify-center font-mono text-[9px] font-bold tracking-tighter group-hover:scale-105 transition-transform">&lt;/&gt;</div>
                      <div>
                        <span className="text-[9.5px] block font-extrabold text-slate-850">Raw Custom HTML</span>
                        <span className="text-[7.5px] block text-slate-400">Embed layout codes</span>
                      </div>
                    </button>

                    {/* Widget: Divider line */}
                    <button
                      draggable={true}
                      onDragStart={(e) => handleToolboxDragStart(e, "divider")}
                      onDragEnd={handleToolboxDragEnd}
                      onClick={() => addBlock("divider")}
                      className="col-span-2 p-2 px-3 border border-slate-200 bg-slate-50 hover:bg-[#C5A02D]/10 hover:border-[#C5A02D] text-center flex items-center justify-center gap-2 transition-all cursor-grab active:cursor-grabbing rounded"
                    >
                      <span className="text-slate-400 font-mono text-xs">──</span>
                      <span className="text-[9px] uppercase font-bold text-slate-700 tracking-wider">Drag Separator Divider</span>
                      <span className="text-slate-400 font-mono text-xs">──</span>
                    </button>
                  </div>
                </div>
              )}

              {/* RENDER TAB: STYLE & PRESET SETTINGS */}
              {campaignSidebarTab === "settings" && (
                <div className="p-4 flex flex-col gap-5 animate-in fade-in duration-150">
                  <div className="border-b pb-2">
                    <span className="text-[9px] uppercase tracking-wider font-extrabold text-slate-400 block">
                      CORE CAMPAIGN METADATA
                    </span>
                    <p className="text-[8px] text-slate-500 italic leading-relaxed">
                      Initialize layout presets or edit sender verification metrics.
                    </p>
                  </div>

                  {/* PRESETS LOADING ROW */}
                  <div>
                    <label className="text-[8px] uppercase tracking-wider text-slate-400 font-extrabold block mb-2">
                      Load Branded Design Preset Layouts
                    </label>
                    <div className="grid grid-cols-3 gap-1">
                      <button
                        onClick={() => applyPreset("welcome")}
                        className="p-1.5 border border-slate-250 bg-slate-55 hover:bg-slate-50 hover:border-[#C5A02D] text-center rounded flex flex-col items-center gap-1 transition-all"
                      >
                        <Sparkles className="text-[#C5A02D]" size={12} />
                        <span className="text-[7px] font-bold uppercase text-slate-700 block">VIP Welcome</span>
                      </button>
                      <button
                        onClick={() => applyPreset("promo")}
                        className="p-1.5 border border-slate-250 bg-slate-55 hover:bg-slate-50 hover:border-[#C5A02D] text-center rounded flex flex-col items-center gap-1 transition-all"
                      >
                        <Layers className="text-[#C5A02D]" size={12} />
                        <span className="text-[7px] font-bold uppercase text-slate-700 block">Flash Promo</span>
                      </button>
                      <button
                        onClick={() => applyPreset("internal")}
                        className="p-1.5 border border-slate-250 bg-slate-55 hover:bg-slate-50 hover:border-[#C5A02D] text-center rounded flex flex-col items-center gap-1 transition-all"
                      >
                        <Info className="text-[#C5A02D]" size={12} />
                        <span className="text-[7px] font-bold uppercase text-slate-700 block">SOP Notice</span>
                      </button>
                    </div>
                  </div>

                  {/* CAMPAIGN METRICS INPUTS */}
                  <div className="flex flex-col gap-3">
                    <div>
                      <div className="flex justify-between items-center mb-0.5">
                        <label className="text-[8px] uppercase tracking-wider text-slate-500 font-bold">Email Subject Line</label>
                        <span className="text-[7.5px] text-[#C5A02D] font-bold italic">Supports merge codes</span>
                      </div>
                      <input
                        type="text"
                        required
                        value={subjectLine}
                        onChange={e => setSubjectLine(e.target.value)}
                        placeholder="Tropical Newsletter for {{First Name}}"
                        className="w-full border border-slate-300 px-2 py-1 text-xs outline-none focus:border-[#C5A02D]"
                      />
                    </div>

                    <div>
                      <label className="text-[8px] uppercase tracking-wider text-slate-500 font-bold block mb-0.5">Sender Name</label>
                      <input
                        type="text"
                        required
                        value={senderName}
                        onChange={e => setSenderName(e.target.value)}
                        className="w-full border border-slate-300 px-2 py-1 text-xs outline-none focus:border-[#C5A02D]"
                      />
                    </div>

                    <div>
                      <label className="text-[8px] uppercase tracking-wider text-slate-500 font-bold block mb-0.5">Reply-To Email Address</label>
                      <input
                        type="email"
                        required
                        value={senderEmail}
                        onChange={e => setSenderEmail(e.target.value)}
                        className="w-full border border-slate-300 px-2 py-1 text-xs outline-none focus:border-[#C5A02D] font-mono"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* RENDER TAB: DISPATCH & TEST CONSOLE */}
              {campaignSidebarTab === "dispatch" && (
                <div className="p-4 flex flex-col gap-4 animate-in fade-in duration-150">
                  <div className="border-b pb-2">
                    <span className="text-[9px] uppercase tracking-wider font-extrabold text-slate-400 block">
                      DELIVERY COMMAND DESK
                    </span>
                    <p className="text-[8px] text-slate-400 leading-relaxed italic block mt-0.5">
                      Broadcast real campaigns or test delivery to individual accounts instantly.
                    </p>
                  </div>

                  {/* STACK 1: SEND INDIVIDUAL TEST */}
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded">
                    <span className="text-[8.5px] uppercase font-bold tracking-widest text-[#C5A02D] block mb-1">
                      1. SEND FULL DRAFT TEST
                    </span>
                    <p className="text-[7.5px] text-slate-500 mb-2 leading-tight">
                      Delivers a simulated copy of this template layout immediately to verify fonts and design formatting.
                    </p>

                    <form onSubmit={handleSendTestEmail} className="flex flex-col gap-1.5">
                      <input
                        type="email"
                        required
                        placeholder="test@cml.com.fj"
                        value={testEmailAddress}
                        onChange={e => setTestEmailAddress(e.target.value)}
                        className="w-full text-xs font-mono border border-slate-300 bg-white px-2 py-1 outline-none focus:border-[#C5A02D]"
                      />
                      <button
                        type="submit"
                        disabled={isSendingTest}
                        className="w-full bg-slate-900 hover:bg-[#C5A02D] disabled:bg-slate-300 text-white py-1 px-3.5 text-[8.5px] font-bold uppercase tracking-wider transition-colors"
                      >
                        {isSendingTest ? "Sending Draft test..." : "Send Test Draft Copy"}
                      </button>

                      {testResult && (
                        <div className={`p-1.5 text-[8.5px] border mt-1 font-sans ${
                          testResult.type === "success" 
                            ? "bg-emerald-50 border-emerald-200 text-emerald-800" 
                            : "bg-rose-50 border-rose-200 text-rose-800"
                        }`}>
                          {testResult.text}
                        </div>
                      )}
                    </form>
                  </div>

                  {/* STACK 2: SYSTEM EXECUTOR FOR PRODUCTION ROLLOUT */}
                  <div className="p-3 border border-slate-200 bg-slate-50 rounded flex flex-col gap-2">
                    <span className="text-[8.5px] uppercase font-bold tracking-widest text-slate-600 block">
                      2. PUBLIC CAMPAIGN BROADCAST
                    </span>
                    <p className="text-[7.5px] text-slate-500 leading-tight">
                      Rollout this email design directly to your audited subscriber contacts list.
                    </p>

                    <div className="text-[11px] font-bold text-slate-800 bg-white border border-slate-100 p-1.5 flex justify-between items-center text-center">
                      <span className="text-[7.5px] text-slate-400 uppercase font-black">Ready List</span>
                      <span className="text-emerald-600 font-mono text-xs">{contacts.filter(c => c.isValid).length} Valid verified</span>
                    </div>

                    {isSending ? (
                      <div className="p-2.5 bg-slate-950 text-white flex flex-col gap-2 rounded">
                        <div className="flex justify-between items-center text-[8px] tracking-wider text-[#C5A02D] font-black">
                          <span className="flex items-center gap-1 animate-pulse">⚡ TRANSMITTING campaign</span>
                          <span>{sendingProgress}%</span>
                        </div>
                        <div className="w-full bg-slate-800 h-1 rounded overflow-hidden">
                          <div 
                            className="bg-[#C5A02D] h-full transition-all duration-300"
                            style={{ width: `${sendingProgress}%` }}
                          />
                        </div>
                        <span className="text-[8px] font-mono italic text-slate-400 block truncate">{sendingStatus}</span>

                        {sendLogs.length > 0 && (
                          <div className="bg-black/80 border border-slate-900 p-1 text-[7.5px] font-mono max-h-12 overflow-y-auto leading-none text-emerald-400">
                            {sendLogs.slice(-2).map((l, index) => (
                              <div key={index} className="truncate">{l}</div>
                            ))}
                          </div>
                        )}
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={handleSendCampaign}
                        disabled={contacts.filter(c => c.isValid).length === 0}
                        className="w-full bg-[#C5A02D] disabled:bg-slate-300 hover:bg-slate-900 text-white font-display text-[9px] uppercase tracking-wider font-extrabold py-3.5 px-4 transition-colors flex items-center justify-center gap-1.5 shadow-sm leading-none"
                      >
                        <Send size={12} /> Broadcast newsletter to {contacts.filter(c => c.isValid).length} subscribers
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* 3. MIDDLE DYNAMIC INTERACTIVE LIVE EDITOR CANVAS (THE VISUAL MAILCHIMP AREA) */}
            <div className="xl:col-span-5 bg-slate-100 border-r border-slate-150 p-4 xl:p-6 flex flex-col h-[750px] overflow-y-auto">
              {/* CANVAS CONTROL BAR WITH TOGGLES */}
              <div className="flex justify-between items-center mb-4 pb-2 border-b border-slate-205 select-none">
                <div className="flex flex-col">
                  <span className="text-[9px] uppercase font-bold text-slate-500 font-display tracking-widest block">
                    Interactive Live visual Canvas
                  </span>
                  <span className="text-[7.5px] text-slate-400">Click elements directly below to edit properties</span>
                </div>

                <div className="flex gap-1.5 items-center bg-slate-200 p-0.5 rounded-md">
                  <button
                    type="button"
                    onClick={() => setPreviewDevice("desktop")}
                    className={`px-2 py-1 rounded transition-all text-[8px] uppercase tracking-wider font-extrabold flex items-center gap-1 ${
                      previewDevice === "desktop" ? "bg-white text-slate-950 shadow-sm" : "text-slate-550 hover:bg-slate-250"
                    }`}
                    title="Desktop view limits"
                  >
                    <Monitor size={10} /> Desk
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewDevice("mobile")}
                    className={`px-2 py-1 rounded transition-all text-[8px] uppercase tracking-wider font-extrabold flex items-center gap-1 ${
                      previewDevice === "mobile" ? "bg-white text-slate-950 shadow-sm" : "text-slate-550 hover:bg-slate-250"
                    }`}
                    title="Mobile preview layout"
                  >
                    <Smartphone size={10} /> Mobile
                  </button>
                </div>
              </div>

              {/* LIVE NEWSLETTER WORKSPACE BOX CONTAINER */}
              <div 
                className="flex flex-col flex-1"
                onDragOver={(e) => {
                  e.preventDefault();
                }}
                onDrop={(e) => {
                  if (dragOverIndex === null) {
                    if (draggingNewBlockType) {
                      insertBlockAt(draggingNewBlockType, blocks.length);
                    } else if (draggedItemIndex !== null) {
                      const copy = [...blocks];
                      const [movedBlock] = copy.splice(draggedItemIndex, 1);
                      copy.push(movedBlock);
                      setBlocks(copy);
                    }
                    clearDragStates();
                  }
                }}
                onDragLeave={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const x = e.clientX;
                  const y = e.clientY;
                  if (x < rect.left || x >= rect.right || y < rect.top || y >= rect.bottom) {
                    setDragOverIndex(null);
                    setDragDropPosition(null);
                  }
                }}
              >
                <div 
                  className="bg-white shadow-xl border border-slate-250 transition-all duration-300 mx-auto min-h-[550px] flex flex-col w-full relative select-none"
                  style={{ width: previewDevice === "desktop" ? "100%" : "340px", maxWidth: "100%" }}
                >
                  {/* SIMULATED CLIENT MAILBOX CHROME BAR */}
                  <div className="bg-slate-50 border-b border-slate-100 p-3 text-[8.5px] font-mono text-slate-400 select-none flex flex-col gap-0.5">
                    <div className="flex justify-between">
                      <span><strong>To:</strong> Charles Viti &lt;charles.viti@cml.com.fj&gt;</span>
                      <span className="text-[7.5px] bg-slate-220 text-slate-500 px-1 hover:bg-slate-300 cursor-pointer" onClick={() => {
                        setActiveSubTab("contacts");
                      }}>📋 Merge Tags loaded</span>
                    </div>
                    <div className="truncate"><strong>Subject:</strong> {subjectLine || "Welcome newsletter letter copy"}</div>
                  </div>

                  {blocks.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-400">
                      <span className="text-3xl mb-2 block">✏️</span>
                      <span className="text-[10px] font-bold block">Your template canvas is flat empty</span>
                      <span className="text-[8.5px] max-w-[200px] mt-1 text-slate-400">Click or Drag items from the Left block drawer tray to begin building the email.</span>
                    </div>
                  ) : (
                    blocks.map((block, index) => {
                      const isSelected = selectedBlockId === block.id;
                      const isDragOver = dragOverIndex === index;

                      // Helper function to replace variables for local preview render
                      const previewReplaceVariables = (strVal: string | undefined): string => {
                        if (!strVal) return "";
                        return strVal
                          .replace(/\{\{\s*First Name\s*\}\}/gi, "Charles")
                          .replace(/\{\{\s*Last Name\s*\}\}/gi, "Viti")
                          .replace(/\{\{\s*Email\s*\}\}/gi, "charles.viti@cml.com.fj");
                      };

                      return (
                        <React.Fragment key={block.id}>
                          {/* DRAG BEFORE INDICATOR PLACEHOLDER */}
                          {isDragOver && dragDropPosition === "before" && (
                            <div className="h-1 bg-[#C5A02D] rounded-full animate-pulse my-0.5 z-10 w-full" />
                          )}

                          <div
                            draggable={true}
                            onDragStart={() => handleDragStartBlock(index)}
                            onDragOver={(e) => handleDragOverBlock(e, index)}
                            onDrop={(e) => handleDropOnWorkspaceBlock(e, index)}
                            onDragEnd={handleDragEndBlock}
                            onClick={() => setSelectedBlockId(block.id)}
                            className={`relative group border transition-all ${
                              isSelected 
                                ? "ring-2 ring-[#C5A02D] border-[#C5A02D] z-10 bg-[#C5A02D]/5" 
                                : "border-transparent hover:border-[#D0C070]/50 hover:bg-slate-50/50"
                            } ${draggedItemIndex === index ? "opacity-35" : ""}`}
                          >
                            {/* HOVER / SELECTED HANDY FLOATING ACTIONS BAR (Mailchimp style) */}
                            <div className="absolute top-1 right-2 flex items-center bg-slate-900 border border-[#C5A02D]/50 text-white rounded shadow-md h-6 px-1 gap-1 py-0.5 z-20 opacity-0 group-hover:opacity-100 transition-opacity">
                              <span className="text-[7.5px] uppercase font-mono font-bold px-1 select-none text-[#C5A02D]/90 mr-1.5">
                                ⣿ drag to order
                              </span>
                              
                              <button
                                type="button"
                                disabled={index === 0}
                                onClick={(e) => moveBlock(index, "up", e)}
                                title="Move up"
                                className="p-0.5 hover:bg-slate-800 disabled:opacity-30 rounded-sm"
                              >
                                <ChevronUp size={11} className="text-white" />
                              </button>
                              <button
                                type="button"
                                disabled={index === blocks.length - 1}
                                onClick={(e) => moveBlock(index, "down", e)}
                                title="Move down"
                                className="p-0.5 hover:bg-slate-800 disabled:opacity-30 rounded-sm"
                              >
                                <ChevronDown size={11} className="text-white" />
                              </button>
                              <button
                                type="button"
                                onClick={(e) => duplicateBlock(block, e)}
                                title="Duplicate element block"
                                className="p-1 hover:bg-slate-800 rounded-sm"
                              >
                                <Layers size={9} className="text-amber-400" />
                              </button>
                              <button
                                type="button"
                                onClick={(e) => deleteBlock(block.id, e)}
                                title="Delete Block"
                                className="p-0.5 hover:bg-red-800 text-red-400 rounded-sm"
                              >
                                <MinusIcon size={11} />
                              </button>
                            </div>

                            {/* TYPE LABEL TAB ON HOVER */}
                            <div className="absolute top-1 left-2 select-none bg-[#C5A02D] text-black font-mono font-black text-[7.5px] px-1 py-0.5 uppercase z-20 opacity-0 group-hover:opacity-100 transition-opacity">
                              {block.type}
                            </div>

                            {/* CORE RENDERING CORRESPONDING TO TYPE */}
                            {block.type === "header" && (
                              <div 
                                style={{ 
                                  backgroundColor: block.backgroundColor || "#1e293b", 
                                  color: block.textColor || "#C5A02D", 
                                  textAlign: block.align || "center" 
                                }}
                                className="p-8 transition-all font-serif"
                              >
                                <h1 className="text-base md:text-xl font-bold tracking-widest uppercase m-0 leading-tight">
                                  {previewReplaceVariables(block.title || "HEADER TITLE")}
                                </h1>
                                {block.content && (
                                  <p className="text-[10px] mt-1.5 font-sans opacity-95 tracking-wide leading-none font-normal">
                                    {previewReplaceVariables(block.content)}
                                  </p>
                                )}
                              </div>
                            )}

                            {block.type === "text" && (
                              <div className="p-6 md:p-8 bg-white text-slate-800" style={{ textAlign: block.align || "left" }}>
                                {block.title && (
                                  <h2 className="font-serif text-base text-slate-900 font-bold mb-2">
                                    {previewReplaceVariables(block.title)}
                                  </h2>
                                )}
                                <p className="text-xs font-sans text-slate-600 leading-relaxed whitespace-pre-wrap">
                                  {previewReplaceVariables(block.content || "Placeholder content layout section...")}
                                </p>
                              </div>
                            )}

                            {block.type === "image" && (
                              <div className="bg-slate-50 text-center border-y border-slate-100 select-none">
                                {block.imageUrl ? (
                                  <img 
                                    src={block.imageUrl} 
                                    alt={block.title || "Newsletter Image"} 
                                    className="w-full max-h-[350px] object-cover mx-auto"
                                    referrerPolicy="no-referrer"
                                  />
                                ) : (
                                  <div className="p-10 text-slate-400 bg-slate-100 text-xs italic">
                                    📷 Provide a hotlink image URL inside the properties panel on the right.
                                  </div>
                                )}
                                {block.title && (
                                  <div className="p-2 bg-slate-50 border-t text-[10px] text-slate-500 font-sans italic">
                                    {block.title}
                                  </div>
                                )}
                              </div>
                            )}

                            {block.type === "button" && (
                              <div className="p-5 bg-white text-center">
                                <a 
                                  href={block.buttonUrl || "#"}
                                  onClick={(e) => e.preventDefault()} 
                                  style={{ 
                                    backgroundColor: block.backgroundColor || "#C5A02D", 
                                    color: block.textColor || "#ffffff" 
                                  }}
                                  className="inline-block px-5 py-2 text-xs font-bold uppercase tracking-wider font-sans shadow-sm rounded-none border border-transparent select-none cursor-grab"
                                >
                                  {block.buttonText || "Interactive button"}
                                </a>
                              </div>
                            )}

                            {block.type === "twocolumn" && (
                              <div className="grid grid-cols-2 gap-4 p-5 bg-white border-y border-slate-100 text-left font-sans leading-relaxed select-none">
                                <div className="pr-2 border-r border-slate-100">
                                  <h3 className="text-[10.5px] font-bold text-slate-800 uppercase border-b pb-0.5 mb-1">
                                    {block.col1Title || "Left Header"}
                                  </h3>
                                  <p className="text-[9.5px] text-slate-500">{block.col1Content || "Content goes here."}</p>
                                </div>
                                <div className="pl-2">
                                  <h3 className="text-[10.5px] font-bold text-slate-800 uppercase border-b pb-0.5 mb-1">
                                    {block.col2Title || "Right Header"}
                                  </h3>
                                  <p className="text-[9.5px] text-slate-500">{block.col2Content || "Content goes here."}</p>
                                </div>
                              </div>
                            )}

                            {block.type === "html" && (
                              <div className="p-4 bg-slate-900 border-y border-slate-950 font-mono text-center text-amber-400 text-[10px] select-none">
                                <div className="inline-block text-[8px] bg-amber-400 text-black px-1.5 py-0.5 rounded-sm uppercase tracking-wider font-extrabold mb-1">Raw Embedded Markup</div>
                                <p className="text-slate-400 truncate text-[9px] max-w-full font-serif font-black">
                                  {block.content ? "Custom customized tags embedded inside container successfully." : "No custom tags loaded in editor flow."}
                                </p>
                              </div>
                            )}

                            {block.type === "divider" && (
                              <div className="py-4 bg-white px-6 select-none">
                                <div className="border-t border-dashed border-slate-350 h-px w-full" />
                              </div>
                            )}

                            {block.type === "footer" && (
                              <div className="p-8 bg-slate-50 text-center text-slate-500 border-t border-slate-100 leading-normal text-[9.5px]">
                                <p className="mb-1 leading-normal">
                                  {previewReplaceVariables(block.content || "Unsubscribe coordinates and partnership disclaimers correspond to brand guidelines.")}
                                </p>
                                <p className="text-[8.5px] opacity-80 mt-1">
                                  &copy; {new Date().getFullYear()} Seascape Properties | Denarau Resorts. All rights reserved.
                                </p>
                                <p className="text-[8.5px] text-[#C5A02D] underline mt-1 select-none">
                                  Manage Preferences | Unsubscribe
                                </p>
                              </div>
                            )}

                          </div>

                          {/* DRAG AFTER INDICATOR PLACEHOLDER */}
                          {isDragOver && dragDropPosition === "after" && (
                            <div className="h-1 bg-[#C5A02D] rounded-full animate-pulse my-0.5 z-10 w-full" />
                          )}
                        </React.Fragment>
                      );
                    })
                  )}
                </div>
              </div>

              {/* FLOATING DIRECT DEPLOY CAMPAIGN FOOT BAR */}
              <div className="mt-4 p-3 bg-white border border-slate-205 flex justify-between items-center rounded select-none">
                <span className="text-[9px] text-slate-500 italic block">
                  👉 Click any content block on the visual template canvas above to inspect and edit its contents instantly!
                </span>
                <button
                  type="button"
                  onClick={() => {
                    const el = document.getElementById("html-raw-preview-box");
                    const rawTab = document.createElement("a");
                    setPreviewTab("html");
                    setCampaignSidebarTab("dispatch");
                  }}
                  className="bg-slate-200 hover:bg-[#C5A02D]/20 text-slate-800 text-[8.5px] uppercase tracking-wider font-extrabold py-1 px-3 border border-slate-300 transition-colors"
                >
                  View compiled HTML Code
                </button>
              </div>
            </div>

            {/* 4. DYNAMIC SECONDARY SIDEBAR PANEL (RIGHT PROPERTIES PANEL) */}
            <div className="xl:col-span-3 bg-slate-50 flex flex-col h-[750px] overflow-y-auto border-l border-slate-150 p-4">
              <div className="flex justify-between items-center pb-2.5 border-b border-rose-100/20 border-slate-200 mb-3 select-none">
                <div className="flex flex-col">
                  <span className="text-[9.5px] uppercase tracking-widest font-black text-[#C5A02D]">
                    ELEMENT PROPERTIES
                  </span>
                  <span className="text-[8px] text-slate-400">Content and inline visual settings</span>
                </div>
                {selectedBlockId ? (
                  <span className="text-[8px] font-mono bg-slate-900 text-white px-2 py-0.5 font-bold">
                    {blocks.find(b => b.id === selectedBlockId)?.type.toUpperCase()} BLOCK
                  </span>
                ) : (
                  <span className="text-[8px] font-mono text-slate-400 italic">No selection</span>
                )}
              </div>

              {selectedBlockId ? (
                (() => {
                  const block = blocks.find(b => b.id === selectedBlockId);
                  if (!block) return (
                    <div className="text-center py-8 text-slate-400 text-[10px] italic">
                      Please select an element on the central layout canvas to inspect settings.
                    </div>
                  );
                  return (
                    <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-top-1 duration-150">
                      {/* HEADER PROPERTY CHANNELS */}
                      {block.type === "header" && (
                        <>
                          <div className="flex flex-col gap-2">
                            <div>
                              <label className="text-[8px] uppercase tracking-wider text-slate-500 font-extrabold block mb-0.5">Company/Header Brand Label</label>
                              <input
                                type="text"
                                value={block.title || ""}
                                onChange={e => updateBlockProperty("title", e.target.value)}
                                className="w-full bg-white border border-slate-300 px-2 py-1 text-xs outline-none focus:border-[#C5A02D]"
                              />
                            </div>
                            <div>
                              <label className="text-[8px] uppercase tracking-wider text-slate-500 font-extrabold block mb-0.5">Sub-slogan Tagline Content</label>
                              <input
                                type="text"
                                value={block.content || ""}
                                onChange={e => updateBlockProperty("content", e.target.value)}
                                className="w-full bg-white border border-slate-300 px-2 py-1 text-xs outline-none focus:border-[#C5A02D]"
                              />
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-2 mt-1">
                            <div>
                              <label className="text-[8px] uppercase tracking-wider text-slate-500 font-extrabold block mb-0.5">Bg Hex</label>
                              <input
                                type="text"
                                value={block.backgroundColor || ""}
                                placeholder="#1e293b"
                                onChange={e => updateBlockProperty("backgroundColor", e.target.value)}
                                className="w-full bg-white border border-slate-300 px-2 py-1 text-xs font-mono outline-none focus:border-[#C5A02D]"
                              />
                            </div>
                            <div>
                              <label className="text-[8px] uppercase tracking-wider text-slate-500 font-extrabold block mb-0.5">Gold Hex</label>
                              <input
                                type="text"
                                value={block.textColor || ""}
                                placeholder="#C5A02D"
                                onChange={e => updateBlockProperty("textColor", e.target.value)}
                                className="w-full bg-white border border-slate-300 px-2 py-1 text-xs font-mono outline-none focus:border-[#C5A02D]"
                              />
                            </div>
                          </div>

                          <div>
                            <label className="text-[8px] uppercase tracking-wider text-slate-500 font-extrabold block mb-1">Brand Align</label>
                            <div className="grid grid-cols-3 gap-1">
                              {["left", "center", "right"].map(al => (
                                <button
                                  key={al}
                                  type="button"
                                  onClick={() => updateBlockProperty("align", al)}
                                  className={`py-1 text-[8.5px] uppercase font-bold border transition-all ${
                                    block.align === al ? 'bg-slate-900 border-slate-900 text-[#C5A02D]' : 'bg-white border-slate-300 text-slate-600 hover:bg-slate-100'
                                  }`}
                                >
                                  {al}
                                </button>
                              ))}
                            </div>
                          </div>
                        </>
                      )}

                      {/* TEXT PROPERTY CHANNELS */}
                      {block.type === "text" && (
                        <>
                          <div className="flex flex-col gap-2.5">
                            <div>
                              <label className="text-[8px] uppercase tracking-wider text-slate-500 font-extrabold block mb-0.5">Section Title Label (Optional)</label>
                              <input
                                type="text"
                                value={block.title || ""}
                                placeholder="Bula, Charles!"
                                onChange={e => updateBlockProperty("title", e.target.value)}
                                className="w-full bg-white border border-slate-300 px-2 py-1 text-xs outline-none focus:border-[#C5A02D]"
                              />
                            </div>
                            <div>
                              <label className="text-[8px] uppercase tracking-wider text-slate-500 font-extrabold block mb-0.5">Body Wording Content</label>
                              <textarea
                                value={block.content || ""}
                                rows={6}
                                onChange={e => updateBlockProperty("content", e.target.value)}
                                className="w-full bg-white border border-slate-300 px-2 py-1.5 text-xs font-sans leading-relaxed outline-none focus:border-[#C5A02D]"
                              />
                            </div>

                            <div>
                              <label className="text-[8px] uppercase tracking-wider text-slate-500 font-extrabold block mb-1">Paragraph Align</label>
                              <div className="grid grid-cols-2 gap-1.5">
                                {["left", "center"].map(al => (
                                  <button
                                    key={al}
                                    type="button"
                                    onClick={() => updateBlockProperty("align", al)}
                                    className={`py-1 text-[8.5px] uppercase font-bold border transition-all ${
                                      block.align === al ? 'bg-slate-900 border-slate-900 text-[#C5A02D]' : 'bg-white border-slate-300 text-slate-600 hover:bg-slate-100'
                                    }`}
                                  >
                                    {al}
                                  </button>
                                ))}
                              </div>
                            </div>
                          </div>
                        </>
                      )}

                      {/* IMAGE PROPERTY CHANNELS */}
                      {block.type === "image" && (
                        <>
                          <div className="flex flex-col gap-2.5">
                            <div>
                              <label className="text-[8px] uppercase tracking-wider text-slate-500 font-extrabold block mb-0.5">Hotlink Image Address URL</label>
                              <input
                                type="text"
                                value={block.imageUrl || ""}
                                placeholder="https://images.unsplash.com/..."
                                onChange={e => updateBlockProperty("imageUrl", e.target.value)}
                                className="w-full bg-white border border-slate-300 px-2 py-1 text-xs outline-none focus:border-[#C5A02D] font-mono text-[10.5px]"
                              />
                              <span className="text-[7.5px] text-slate-400 italic block mt-0.5 leading-tight">Requires full public secure HTTPS address.</span>
                            </div>
                            <div>
                              <label className="text-[8px] uppercase tracking-wider text-slate-500 font-extrabold block mb-0.5">Subtitle/Caption Text</label>
                              <input
                                type="text"
                                value={block.title || ""}
                                onChange={e => updateBlockProperty("title", e.target.value)}
                                className="w-full bg-white border border-slate-300 px-2 py-1 text-xs outline-none focus:border-[#C5A02D]"
                              />
                            </div>
                          </div>
                        </>
                      )}

                      {/* BUTTON PROPERTY CHANNELS */}
                      {block.type === "button" && (
                        <>
                          <div className="flex flex-col gap-2.5">
                            <div>
                              <label className="text-[8px] uppercase tracking-wider text-slate-500 font-extrabold block mb-0.5">Button text label</label>
                              <input
                                type="text"
                                value={block.buttonText || ""}
                                onChange={e => updateBlockProperty("buttonText", e.target.value)}
                                className="w-full bg-white border border-slate-300 px-2 py-1 text-xs outline-none focus:border-[#C5A02D]"
                              />
                            </div>
                            <div>
                              <label className="text-[8px] uppercase tracking-wider text-slate-500 font-extrabold block mb-0.5">Action link url target</label>
                              <input
                                type="text"
                                value={block.buttonUrl || ""}
                                onChange={e => updateBlockProperty("buttonUrl", e.target.value)}
                                className="w-full bg-white border border-slate-300 px-2 py-1 text-xs outline-none focus:border-[#C5A02D] font-mono text-[10px]"
                              />
                            </div>

                            <div className="grid grid-cols-2 gap-2 mt-1">
                              <div>
                                <label className="text-[8px] uppercase tracking-wider text-slate-500 font-extrabold block mb-0.5">Btn Hex</label>
                                <input
                                  type="text"
                                  value={block.backgroundColor || ""}
                                  placeholder="#C5A02D"
                                  onChange={e => updateBlockProperty("backgroundColor", e.target.value)}
                                  className="w-full bg-white border border-slate-300 px-2 py-1 text-xs font-mono outline-none focus:border-[#C5A02D]"
                                />
                              </div>
                              <div>
                                <label className="text-[8px] uppercase tracking-wider text-slate-500 font-extrabold block mb-0.5">Text Hex</label>
                                <input
                                  type="text"
                                  value={block.textColor || ""}
                                  placeholder="#ffffff"
                                  onChange={e => updateBlockProperty("textColor", e.target.value)}
                                  className="w-full bg-white border border-slate-300 px-2 py-1 text-xs font-mono outline-none focus:border-[#C5A02D]"
                                />
                              </div>
                            </div>
                          </div>
                        </>
                      )}

                      {/* TWOMULTICOL FEATURE LAYOUT CHANNELS */}
                      {block.type === "twocolumn" && (
                        <>
                          <div className="flex flex-col gap-3">
                            <div className="p-2 border border-slate-200 bg-white shadow-sm">
                              <span className="text-[8px] uppercase font-black text-rose-800 tracking-wider">Column Left</span>
                              <div className="mt-1 flex flex-col gap-1.5">
                                <div>
                                  <label className="text-[7.5px] uppercase block mb-0.5 text-slate-505">Left Header</label>
                                  <input
                                    type="text"
                                    value={block.col1Title || ""}
                                    onChange={e => updateBlockProperty("col1Title", e.target.value)}
                                    className="w-full border border-slate-300 px-2 py-0.5 text-xs outline-none focus:border-[#C5A02D]"
                                  />
                                </div>
                                <div>
                                  <label className="text-[7.5px] uppercase block mb-0.5 text-slate-505">Left content</label>
                                  <textarea
                                    value={block.col1Content || ""}
                                    rows={2}
                                    onChange={e => updateBlockProperty("col1Content", e.target.value)}
                                    className="w-full border border-slate-300 px-2 py-0.5 text-xs outline-none focus:border-[#C5A02D]"
                                  />
                                </div>
                              </div>
                            </div>

                            <div className="p-2 border border-slate-200 bg-white shadow-sm">
                              <span className="text-[8px] uppercase font-black text-rose-800 tracking-wider">Column Right</span>
                              <div className="mt-1 flex flex-col gap-1.5">
                                <div>
                                  <label className="text-[7.5px] uppercase block mb-0.5 text-slate-505">Right Header</label>
                                  <input
                                    type="text"
                                    value={block.col2Title || ""}
                                    onChange={e => updateBlockProperty("col2Title", e.target.value)}
                                    className="w-full border border-slate-300 px-2 py-0.5 text-xs outline-none focus:border-[#C5A02D]"
                                  />
                                </div>
                                <div>
                                  <label className="text-[7.5px] uppercase block mb-0.5 text-slate-505">Right Content</label>
                                  <textarea
                                    value={block.col2Content || ""}
                                    rows={2}
                                    onChange={e => updateBlockProperty("col2Content", e.target.value)}
                                    className="w-full border border-slate-300 px-2 py-0.5 text-xs outline-none focus:border-[#C5A02D]"
                                  />
                                </div>
                              </div>
                            </div>
                          </div>
                        </>
                      )}

                      {/* RAW EMBEDDED HTML CHANNELS */}
                      {block.type === "html" && (
                        <>
                          <div>
                            <div className="flex justify-between items-center mb-1">
                              <label className="text-[8px] uppercase tracking-wider text-slate-500 font-extrabold block">Raw tags content Code</label>
                              <span className="text-[7.5px] text-red-500 font-bold uppercase font-mono bg-red-50 px-1">HTML active</span>
                            </div>
                            <textarea
                              value={block.content || ""}
                              rows={8}
                              onChange={e => updateBlockProperty("content", e.target.value)}
                              className="w-full bg-slate-900 text-amber-300 font-mono p-2.5 text-[9px] border border-slate-300 outline-none whitespace-pre"
                            />
                          </div>
                        </>
                      )}

                      {/* SYSTEM FOOTER LEGAL LAYOUT */}
                      {block.type === "footer" && (
                        <>
                          <div>
                            <label className="text-[8px] uppercase tracking-wider text-slate-500 font-extrabold block mb-0.5">Disclaimer description footer text</label>
                            <textarea
                              value={block.content || ""}
                              rows={4}
                              onChange={e => updateBlockProperty("content", e.target.value)}
                              className="w-full bg-white border border-slate-300 px-2 py-1 text-xs outline-none focus:border-[#C5A02D]"
                            />
                          </div>
                        </>
                      )}

                      {/* GENERIC BLOCK CONTROL TRIGGERS */}
                      <div className="flex gap-1.5 justify-end pt-3 border-t border-slate-200 mt-2 select-none">
                        <button
                          type="button"
                          onClick={(e) => duplicateBlock(block, e)}
                          className="bg-slate-200 hover:bg-slate-300 text-slate-700 text-[8px] uppercase font-display font-extrabold tracking-wider px-2.5 py-1.5 rounded"
                        >
                          Duplicate
                        </button>
                        <button
                          type="button"
                          onClick={(e) => deleteBlock(block.id, e)}
                          className="bg-red-100 hover:bg-red-650 hover:text-white border border-red-200 text-red-700 text-[8px] uppercase font-display font-extrabold tracking-wider px-2.5 py-1.5 rounded"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  );
                })()
              ) : (
                <div className="text-center py-10 bg-slate-100 border border-slate-200 text-slate-450 text-[10px] italic">
                  Tap any component section block centered on the visual live canvas representation to load its content input variables tags instantly.
                </div>
              )}
            </div>

          </motion.div>
        )}

        {/* TAB 2: SUBSCRIBER CONTACTS */}
        {activeSubTab === "contacts" && (
          <motion.div
            key="tab-contacts"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start"
          >
            {/* MANUAL PROFILE ENTRY OR CSV IMPORTER */}
            <div className="lg:col-span-4 flex flex-col gap-6">
              
              {!showAddForm ? (
                <button
                  onClick={() => { setShowAddForm(true); setValidationAlert(null); }}
                  className="w-full bg-[#C5A02D] hover:bg-black text-white py-3.5 px-4 font-display text-[10.5px] uppercase tracking-widest font-black transition-colors flex items-center justify-center gap-2 shadow-sm rounded-none"
                >
                  <Plus size={14} /> Add Individual subscriber
                </button>
              ) : (
                <div className="bg-white border border-slate-150 p-6 flex flex-col gap-4 animate-in fade-in zoom-in-95 rounded-none">
                  <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                    <span className="text-[10px] font-display font-black uppercase tracking-wider text-[#C5A02D]">Manual Contact Registration</span>
                    <button onClick={() => setShowAddForm(false)} className="text-slate-400 hover:text-black">
                      <Trash2 size={13} />
                    </button>
                  </div>

                  <form onSubmit={handleAddContact} className="flex flex-col gap-3">
                    <div>
                      <label className="text-[9px] uppercase tracking-wider text-slate-400 font-bold block mb-1">First Name</label>
                      <input
                        type="text"
                        required
                        placeholder="John"
                        value={firstName}
                        onChange={e => setFirstName(e.target.value)}
                        className="w-full border border-slate-200 px-3 py-1.5 text-xs outline-none focus:border-[#C5A02D]"
                      />
                    </div>
                    <div>
                      <label className="text-[9px] uppercase tracking-wider text-slate-400 block mb-1">Last Name (Surnames)</label>
                      <input
                        type="text"
                        required
                        placeholder="Doe"
                        value={lastName}
                        onChange={e => setLastName(e.target.value)}
                        className="w-full border border-slate-200 px-3 py-1.5 text-xs outline-none focus:border-[#C5A02D]"
                      />
                    </div>
                    <div>
                      <label className="text-[9px] uppercase tracking-wider text-slate-400 block mb-1">Email Address Tag</label>
                      <input
                        type="email"
                        required
                        placeholder="john.doe@cml.com.fj"
                        value={emailAddress}
                        onChange={e => setEmailAddress(e.target.value)}
                        className="w-full border border-slate-200 px-3 py-1.5 text-xs font-mono outline-none focus:border-[#C5A02D]"
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full mt-2 bg-slate-950 hover:bg-[#C5A02D] text-white py-2 text-[10px] uppercase font-display tracking-widest font-bold transition-all"
                    >
                      Audit, Validate & Add
                    </button>
                  </form>
                </div>
              )}

              {/* Bulk file upload module */}
              <div 
                className={`bg-white border-2 border-dashed p-8 text-center flex flex-col items-center justify-center transition-all ${
                  dragActive ? 'border-[#C5A02D] bg-[#C5A02D]/5' : 'border-slate-200 hover:border-slate-300'
                }`}
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
              >
                <FileSpreadsheet className="text-slate-350 mb-3 animate-bounce" size={32} />
                <span className="text-xs font-bold text-slate-800">BULK IMPORT CLIENT CSV / TXT SHEET</span>
                <p className="text-[9.5px] text-slate-400 max-w-sm mt-1 mb-4 leading-relaxed">
                  Drop guest rosters here or load raw sheets with format:<br /><strong>First Name, Last Name, Email</strong>
                </p>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="bg-slate-900 border border-slate-900 hover:bg-[#C5A02D] text-white py-2 px-5 text-[9px] font-display uppercase tracking-wider font-extrabold transition-all"
                >
                  Locate CSV Document
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.txt"
                  className="hidden"
                  onChange={handleFileChange}
                />
              </div>

              {/* CSV Sample layout snippet */}
              <div className="bg-slate-55 border border-slate-150 p-4 font-mono">
                <span className="text-[9px] uppercase tracking-wider font-bold text-slate-500 font-display flex items-center gap-1.5">
                  <Info size={12} className="text-[#C5A02D]" /> Spreadsheet Structure Example
                </span>
                <pre className="text-[9px] text-slate-605 mt-2 p-2 bg-white border border-slate-100 rounded-none overflow-x-auto leading-normal">
{`First Name,Last Name,Email
Charles,Viti,charles.viti@cml.com.fj
Anit,Sen,anit.s@mailinator.com
Savenaca,Radrodro,savenaca@ramada.com`}
                </pre>
              </div>

            </div>

            {/* SUBSCRIBER TABLE VIEW CONTAINER */}
            <div className="lg:col-span-8 bg-white border border-slate-150 shadow-sm p-6">
              
              {validationAlert && (
                <div className={`p-3 text-[11px] font-sans flex items-start gap-2 border mb-4 ${
                  validationAlert.type === "success" 
                    ? "bg-green-50 border-green-250 text-green-800" 
                    : validationAlert.type === "info"
                    ? "bg-blue-50 border-blue-200 text-blue-800"
                    : "bg-rose-50 border-rose-250 text-red-800"
                }`}>
                  {validationAlert.type === "success" ? <CheckCircle size={15} className="shrink-0 text-green-600 mt-0.5" /> : <AlertTriangle size={15} className="shrink-0 text-red-650 mt-0.5" />}
                  <span>{validationAlert.text}</span>
                </div>
              )}

              {/* Search & Ingest counters */}
              <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-3 mb-4 pb-2 border-b border-slate-100">
                <div className="relative flex-1">
                  <input
                    type="text"
                    placeholder="Search name, surname or corporate domain..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 pl-8 pr-3 py-1.5 text-[11px] outline-none focus:border-[#C5A02D]"
                  />
                  <Search size={12} className="absolute left-2.5 top-2.5 text-slate-400" />
                </div>
                <button
                  type="button"
                  onClick={fetchMailerData}
                  className="flex items-center justify-center gap-1.5 border border-slate-200 text-slate-600 hover:text-black hover:bg-slate-55 px-3 py-1.5 text-[10px] font-display uppercase tracking-widest font-black"
                >
                  <RefreshCw size={11} className="animate-spin" /> Refresh Roster
                </button>
              </div>

              {/* Table rendering content */}
              <div className="border border-slate-100 overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 text-[9px] uppercase tracking-wider text-slate-500 border-b border-slate-150">
                    <tr>
                      <th className="p-3">Subscriber Name</th>
                      <th className="p-3">Email Address</th>
                      <th className="p-3">Auto-Spam Protection Validation</th>
                      <th className="p-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-150">
                    {loading ? (
                      <tr>
                        <td colSpan={4} className="p-8 text-center text-slate-400 italic">
                          <span className="animate-pulse">Loading verified mailing parameters...</span>
                        </td>
                      </tr>
                    ) : filteredContacts.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="p-8 text-center text-slate-400 italic">
                          No corporate channels loaded under selected company.
                        </td>
                      </tr>
                    ) : (
                      filteredContacts.map(c => (
                        <tr 
                          key={c.id} 
                          className={`hover:bg-slate-50 transition-colors ${
                            !c.isValid ? 'bg-red-50/25' : ''
                          }`}
                        >
                          <td className="p-3 font-serif font-semibold text-slate-800">
                            {c.firstName} {c.lastName}
                          </td>
                          <td className={`p-3 font-mono text-[11px] ${
                            !c.isValid ? 'text-red-600 font-bold' : 'text-slate-600'
                          }`}>
                            {c.email}
                          </td>
                          <td className="p-3">
                            {c.isValid ? (
                              <span className="inline-flex items-center gap-1 text-[9px] uppercase tracking-widest font-bold text-emerald-600 font-display bg-emerald-50 px-1.5 py-0.5 border border-emerald-150">
                                <Check size={11} /> Passed Spam Check
                              </span>
                            ) : (
                              <span className="inline-flex flex-col text-[9px] uppercase tracking-wider font-bold text-red-600 font-display bg-red-50 px-2 py-0.5 border border-red-200">
                                <span className="flex items-center gap-1"><AlertTriangle size={11} className="shrink-0" /> INVALID/UNSAFE ADDRESS</span>
                                <span className="font-mono text-[7.5px] text-red-500 font-normal leading-none mt-0.5">{c.validationReason || "Syntax rejection"}</span>
                              </span>
                            )}
                          </td>
                          <td className="p-3 text-right">
                            <button
                              onClick={() => setDeleteContactTarget({ id: c.id, name: `${c.firstName} ${c.lastName}` })}
                              className="text-slate-350 hover:text-red-600 p-1.5 transition-colors inline-block"
                              title="Delete profile document permanent layout"
                            >
                              <Trash2 size={13} />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination elements status */}
              <div className="flex justify-between items-center mt-3 text-[10px] text-slate-400 italic">
                <span>Display order prioritized by validation integrity</span>
                <span>Filtered {filteredContacts.length} of {contacts.length} documents</span>
              </div>

            </div>

          </motion.div>
        )}

        {/* TAB 3: CAMPAIGN LOGS */}
        {activeSubTab === "logs" && (
          <motion.div
            key="tab-logs"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex flex-col gap-6"
          >
            {campaignLogs.length === 0 ? (
              <div className="bg-white border border-slate-150 p-12 text-center text-slate-405 italic">
                <History size={32} className="text-slate-350 mx-auto mb-2" />
                No campaigns have been processed yet on this node platform.
              </div>
            ) : (
              campaignLogs.map(log => (
                <div key={log.id} className="bg-white border border-slate-150 p-6 flex flex-col gap-4 shadow-sm">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 border-b border-slate-100 pb-3">
                    <div>
                      <h4 className="font-serif italic font-semibold text-slate-900 text-base">{log.subject}</h4>
                      <span className="text-[9px] font-mono uppercase text-[#C5A02D] font-bold block mt-0.5">
                        Broadcast By: {log.senderName} •{" "}
                        {log.timestamp ? new Date(log.timestamp.seconds ? log.timestamp.seconds * 1000 : log.timestamp).toLocaleDateString() + " at " + new Date(log.timestamp.seconds ? log.timestamp.seconds * 1000 : log.timestamp).toLocaleTimeString() : "Just now"}
                      </span>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <span className="text-xs text-slate-500 font-bold block">Sent successfully: <strong className="text-emerald-600">{log.successCount}</strong></span>
                        <span className="text-[10px] text-slate-400">Errors flagged: <strong className="text-red-500">{log.failCount}</strong></span>
                      </div>
                    </div>
                  </div>

                  {/* Body preview */}
                  <div className="p-3 bg-slate-50 border border-slate-100 text-slate-600 font-mono text-[10px] whitespace-pre-wrap max-h-24 overflow-y-auto">
                    {log.body}
                  </div>

                  {/* Recipients details loop */}
                  <div className="flex flex-col gap-2 mt-2">
                    <span className="text-[8px] uppercase tracking-wider font-extrabold text-slate-400">Processed delivery roster details</span>
                    <div className="flex flex-wrap gap-1.5">
                      {log.recipients?.map((rec, rIdx) => (
                        <div 
                          key={rIdx} 
                          className={`text-[9px] font-mono px-2 py-0.5 border flex items-center gap-1 ${
                            rec.status === "success" 
                              ? "bg-green-50 border-green-200 text-green-700" 
                              : "bg-red-50 border-red-200 text-red-700"
                          }`}
                          title={rec.reason || "Delivered"}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${rec.status === "success" ? 'bg-green-500' : 'bg-red-500'}`} />
                          {rec.firstName} {rec.lastName} ({rec.email})
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))
            )}
          </motion.div>
        )}

        {/* TAB 4: API OVERRIDE CODES */}
        {activeSubTab === "api-config" && (
          <motion.div
            key="tab-api"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="max-w-2xl bg-white border border-slate-150 p-6 flex flex-col gap-6"
          >
            <div className="border-b border-slate-100 pb-3">
              <span className="text-[10px] uppercase font-display font-black text-[#C5A02D] tracking-widest flex items-center gap-2">
                <Settings size={15} /> Outgoing Gateway Relay Protocol
              </span>
              <p className="text-[10px] text-slate-500 mt-1 italic leading-relaxed">
                Connect your physical SMTP servers or keep in Sandbox simulation. When simulating, campaign logs register and live email preview compiles normally.
              </p>
            </div>

            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[9px] uppercase tracking-wider text-slate-400 font-bold">Delivery Channel Provider</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setMailConfig({ ...mailConfig, provider: "simulation" })}
                    className={`p-3 text-[10px] font-sans font-bold flex flex-col items-center gap-1 border ${
                      mailConfig.provider === "simulation" ? "border-[#C5A02D] bg-[#C5A02D]/10 font-black text-slate-900" : "bg-white border-slate-220 text-slate-500"
                    }`}
                  >
                    <span>🛡️ Sandbox</span>
                    <span className="text-[7.5px] font-normal lowercase">(Simulate Dispatch)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setMailConfig({ ...mailConfig, provider: "smtp" })}
                    className={`p-3 text-[10px] font-sans font-bold flex flex-col items-center gap-1 border ${
                      mailConfig.provider === "smtp" ? "border-[#C5A02D] bg-[#C5A02D]/10 font-black text-slate-900" : "bg-white border-slate-220 text-slate-500"
                    }`}
                  >
                    <span>⚡ Custom SMTP Gateway</span>
                    <span className="text-[7.5px] font-normal lowercase">(Local/SSL/Port)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setMailConfig({ ...mailConfig, provider: "sendgrid" })}
                    className={`p-3 text-[10px] font-sans font-bold flex flex-col items-center gap-1 border ${
                      mailConfig.provider === "sendgrid" ? "border-[#C5A02D] bg-[#C5A02D]/10 font-black text-slate-900" : "bg-white border-slate-220 text-slate-500"
                    }`}
                  >
                    <span>🌿 SendGrid Port</span>
                    <span className="text-[7.5px] font-normal lowercase">(Custom API Key)</span>
                  </button>
                </div>
              </div>

              {mailConfig.provider === "smtp" && (
                <div className="grid grid-cols-2 gap-3 p-4 bg-slate-50 border border-slate-200 animate-in fade-in duration-200">
                  <div className="col-span-2">
                    <label className="text-[8px] uppercase tracking-wider text-slate-400 block mb-0.5">SMTP Host Server</label>
                    <input
                      type="text"
                      value={mailConfig.smtpHost || ""}
                      placeholder="mail.seascape.com"
                      onChange={e => setMailConfig({ ...mailConfig, smtpHost: e.target.value })}
                      className="w-full bg-white border border-slate-350 px-2 py-1 text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[8px] uppercase tracking-wider text-slate-400 block mb-0.5">SMTP Auth User login</label>
                    <input
                      type="text"
                      value={mailConfig.smtpUser || ""}
                      placeholder="marketing@seascape.com"
                      onChange={e => setMailConfig({ ...mailConfig, smtpUser: e.target.value })}
                      className="w-full bg-white border border-slate-350 px-2 py-1 text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[8px] uppercase tracking-wider text-slate-400 block mb-0.5">SMTP password credential</label>
                    <input
                      type="password"
                      value={mailConfig.smtpPass || ""}
                      placeholder="••••••••••••"
                      onChange={e => setMailConfig({ ...mailConfig, smtpPass: e.target.value })}
                      className="w-full bg-white border border-slate-350 px-2 py-1 text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[8px] uppercase tracking-wider text-slate-400 block mb-0.5">Server Port</label>
                    <input
                      type="text"
                      value={mailConfig.smtpPort || "587"}
                      onChange={e => setMailConfig({ ...mailConfig, smtpPort: e.target.value })}
                      className="w-full bg-white border border-slate-350 px-2 py-1 text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[8px] uppercase tracking-wider text-slate-400 block mb-0.5">Sender Mask reply email</label>
                    <input
                      type="text"
                      value={mailConfig.defaultSenderEmail || "newsletter@cml.com.fj"}
                      onChange={e => setMailConfig({ ...mailConfig, defaultSenderEmail: e.target.value })}
                      className="w-full bg-white border border-slate-350 px-2 py-1 text-xs font-mono"
                    />
                  </div>
                </div>
              )}

              {mailConfig.provider === "sendgrid" && (
                <div className="p-4 bg-slate-50 border border-slate-200 animate-in fade-in duration-200">
                  <label className="text-[8px] uppercase tracking-wider text-slate-400 block mb-0.5">Sendgrid Secret API Key Value</label>
                  <input
                    type="password"
                    value={mailConfig.sendgridApiKey || ""}
                    placeholder="SG.••••••••••••••••••••"
                    onChange={e => setMailConfig({ ...mailConfig, sendgridApiKey: e.target.value })}
                    className="w-full bg-white border border-slate-350 px-2.5 py-1 text-xs font-mono"
                  />
                  <span className="text-[8px] text-slate-400 mt-1 block">Your API Key values persist safely in standard client-side secure localStorage keys specific to this resort portal.</span>
                </div>
              )}

              {mailConfig.provider === "simulation" && (
                <div className="p-4 bg-[#C5A02D]/10 border border-[#C5A02D]/30">
                  <span className="text-xs text-slate-800 font-bold block mb-1">🛡️ Protected Sandbox Flight Active</span>
                  <p className="text-[9.5px] text-slate-600 leading-relaxed">
                    Corporate broadcasts simulate client transmission logs instantaneously without consuming real SMTP SMTP quotas. Live device look-and-feel operates fully!
                  </p>
                </div>
              )}

              {/* SAVE CONFIG */}
              <button
                type="button"
                onClick={() => {
                  try {
                    localStorage.setItem(`mailer_config_${companyId}`, JSON.stringify(mailConfig));
                  } catch (e) {
                    console.warn("[StaffMailer] Could not save mailConfig manually:", e);
                  }
                  alert("Gateway protocol updated!");
                  setActiveSubTab("campaign");
                }}
                className="w-full bg-[#C5A02D] hover:bg-slate-900 text-white font-display text-[10px] font-bold py-2 px-4 uppercase tracking-widest"
              >
                Authenticate Connection Channel & Exit
              </button>
            </div>
          </motion.div>
        )}

      </AnimatePresence>

      <ConfirmModal
        isOpen={!!deleteContactTarget}
        onClose={() => setDeleteContactTarget(null)}
        onConfirm={handleDeleteContactConfirm}
        title="Remove Mailer Contact?"
        description={`Are you sure you want to permanently delete recipient "${deleteContactTarget?.name}" from your system mailer index? This contact will no longer receive any broad scale corporate newsletters or bulletins.`}
        confirmLabel="Confirm Delete"
        cancelLabel="Preserve Contact"
        variant="danger"
      />

    </div>
  );
};

// Simplified UI MinusIcon for alignment 
const MinusIcon: React.FC<{ size: number }> = ({ size }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-minus">
    <path d="M5 12h14"></path>
  </svg>
);
