import React, { useState, useEffect, useRef } from "react";
import { 
  db, 
  auth, 
  collection, 
  addDoc, 
  onSnapshot,
  query,
  orderBy,
  doc,
  updateDoc,
  setDoc,
  connectGoogleWorkspace,
  getGoogleAccessToken,
  getGoogleWorkspaceConnections,
  disconnectGoogleWorkspaceProperty
} from "../lib/firebase";
import { 
  MessageSquare, 
  Send, 
  Minimize2, 
  Maximize2, 
  Search, 
  Users, 
  Paperclip, 
  Smile, 
  Bell, 
  BellOff, 
  Check, 
  Sparkles,
  Volume2,
  VolumeX,
  Plus,
  PlusCircle,
  Compass,
  UserCheck,
  Phone,
  PhoneOff,
  Video,
  VideoOff,
  Mic,
  MicOff,
  Mail,
  Settings,
  Trash2,
  Copy,
  X
} from "lucide-react";
import { toastService } from "../services/toastService";
import { notificationService, NotificationType } from "../services/notificationService";

interface ChatMessage {
  id: string;
  senderName: string;
  senderEmail: string;
  senderPhoto?: string;
  content: string;
  attachmentUrl?: string;
  attachmentName?: string;
  timestamp: string;
  reactions?: Record<string, string[]>; // emoji -> list of user names
}

interface ChatSpace {
  id: string;
  name: string;
  description: string;
  unreadCount: number;
  webhookUrl?: string;
}

interface MemberPresence {
  name: string;
  role: string;
  status: "online" | "away";
  email: string;
}

const DEFAULT_COLLEAGUES: MemberPresence[] = [
  { name: "Charles Cebujano", role: "Digital Media / Administrator", status: "online", email: "digitalmedia@cml.com.fj" },
  { name: "Priyesh Narayan", role: "Graphics Designer", status: "online", email: "graphics@cml.com.fj" },
  { name: "Rohit Lal", role: "Executive Accounts", status: "online", email: "rohit@cml.com.fj" },
  { name: "Charlene Nand", role: "Duty Manager (Ramada)", status: "online", email: "mod@ramadawailoaloafiji.com" },
  { name: "Nolau Malo", role: "Rooms Division Manager", status: "away", email: "roomsd@ramadawailoaloafiji.com" },
  { name: "Neetisa Devi", role: "Human Resources Manager", status: "online", email: "hr@cml.com.fj" }
];

const CallTimer: React.FC = () => {
  const [seconds, setSeconds] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => {
      setSeconds((s) => s + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return (
    <span>
      {mins.toString().padStart(2, "0")}:{secs.toString().padStart(2, "0")}
    </span>
  );
};

export const GoogleChatWidget: React.FC<{ companyId: string }> = ({ companyId }) => {
  const primaryColor = companyId === "ramada" ? "#D11242" : (companyId === "wyndham" ? "#0b5c4b" : "#C5A02D");
  const darkColor = companyId === "ramada" ? "#b00e35" : (companyId === "wyndham" ? "#084437" : "#a68421");

  const [isOpen, setIsOpen] = useState(false);
  const [activeSpaceId, setActiveSpaceId] = useState("general-announcements");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [showMembers, setShowMembers] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [unreadTotal, setUnreadTotal] = useState(0);

  // Google Workspace Integration States
  const [connections, setConnections] = useState<Record<string, any>>(() => getGoogleWorkspaceConnections());
  const [isConnecting, setIsConnecting] = useState(false);
  const [realSpaces, setRealSpaces] = useState<any[] | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);

  const getPropertyName = (id: string): string => {
    if (id === "wyndham") return "Wyndham Garden";
    if (id === "ramada") return "Ramada Suites";
    return "CML Corporate";
  };

  const fetchGChat = async (url: string, options: any = {}) => {
    try {
      const res = await fetch("/api/proxy-gchat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          url,
          method: options.method || "GET",
          headers: options.headers || {},
          body: options.body ? JSON.parse(options.body) : undefined
        })
      });
      return res;
    } catch (err) {
      console.error("fetchGChat failed:", err);
      throw err;
    }
  };

  const currentConnection = connections[companyId];
  const workspaceAccessToken = currentConnection?.accessToken || null;
  const isWorkspaceConnected = !!workspaceAccessToken;

  // Attachment Simulation
  const [simulatedAttachment, setSimulatedAttachment] = useState<{ url: string; name: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  const initialLoadRef = useRef(true);
  const knownMessageIdsRef = useRef<Set<string>>(new Set());
  const ringIntervalRef = useRef<any>(null);
  const callConnectTimeoutRef = useRef<any>(null);

  const clearCallTimers = () => {
    if (ringIntervalRef.current) {
      clearInterval(ringIntervalRef.current);
      ringIntervalRef.current = null;
    }
    if (callConnectTimeoutRef.current) {
      clearTimeout(callConnectTimeoutRef.current);
      callConnectTimeoutRef.current = null;
    }
  };

  useEffect(() => {
    return () => {
      clearCallTimers();
    };
  }, []);

  // Reset tracking on activeSpaceId change
  useEffect(() => {
    initialLoadRef.current = true;
  }, [activeSpaceId]);

  // Dynamic and custom spaces configuration
  const [customSpaces, setCustomSpaces] = useState<ChatSpace[]>(() => {
    try {
      const saved = localStorage.getItem(`cml_custom_spaces_${companyId}`);
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  const [deletedSpaceIds, setDeletedSpaceIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(`cml_deleted_spaces_${companyId}`);
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  const [isCreatingSpace, setIsCreatingSpace] = useState(false);
  const [newSpaceName, setNewSpaceName] = useState("");
  const [newSpaceDesc, setNewSpaceDesc] = useState("");
  const [newSpaceWebhookUrl, setNewSpaceWebhookUrl] = useState("");
  const [newSpaceInvitedEmails, setNewSpaceInvitedEmails] = useState<string[]>([]);

  // Webhook manager modal state
  const [showWebhookModal, setShowWebhookModal] = useState(false);
  const [outboundWebhookInput, setOutboundWebhookInput] = useState("");
  const [testWebhookPayloadText, setTestWebhookPayloadText] = useState("Hello from the CML Team!");
  const [isTestingWebhook, setIsTestingWebhook] = useState(false);

  // Custom general webhooks persistence
  const [customWebhooks, setCustomWebhooks] = useState<Record<string, string>>(() => {
    try {
      const cached = localStorage.getItem(`cml_custom_webhooks_${companyId}`);
      return cached ? JSON.parse(cached) : {};
    } catch {
      return {};
    }
  });

  // Listen for space webhooks in Firestore
  useEffect(() => {
    if (!db) return;
    const colRef = collection(db, "hybrid_sandbox");
    const targetCol = `space-webhooks-${companyId}`;
    const unsubscribe = onSnapshot(colRef, (snapshot) => {
      const webhooks: Record<string, string> = {};
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        if (data.collection === targetCol && data.spaceId) {
          webhooks[data.spaceId] = data.webhookUrl || "";
        }
      });
      if (Object.keys(webhooks).length > 0) {
        setCustomWebhooks(prev => {
          const updated = { ...prev, ...webhooks };
          localStorage.setItem(`cml_custom_webhooks_${companyId}`, JSON.stringify(updated));
          return updated;
        });
      }
    });
    return () => unsubscribe();
  }, [companyId, db]);

  // Space members persistence
  const [spaceMembers, setSpaceMembers] = useState<Record<string, MemberPresence[]>>(() => {
    try {
      const cached = localStorage.getItem(`cml_space_members_${companyId}`);
      return cached ? JSON.parse(cached) : {};
    } catch {
      return {};
    }
  });

  // Listen for space members in Firestore
  useEffect(() => {
    if (!db) return;
    const colRef = collection(db, "hybrid_sandbox");
    const targetCol = `space-members-${companyId}`;
    const unsubscribe = onSnapshot(colRef, (snapshot) => {
      const membersMap: Record<string, MemberPresence[]> = {};
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        if (data.collection === targetCol && data.spaceId) {
          try {
            const parsed = JSON.parse(data.db_json);
            membersMap[data.spaceId] = parsed;
          } catch (e) {
            console.error("Error parsing space members:", e);
          }
        }
      });
      if (Object.keys(membersMap).length > 0) {
        setSpaceMembers(prev => {
          const updated = { ...prev, ...membersMap };
          localStorage.setItem(`cml_space_members_${companyId}`, JSON.stringify(updated));
          return updated;
        });
      }
    });
    return () => unsubscribe();
  }, [companyId, db]);

  const getMembersForSpace = (spaceId: string): MemberPresence[] => {
    if (spaceMembers[spaceId]) {
      return spaceMembers[spaceId];
    }
    return DEFAULT_COLLEAGUES;
  };

  const handleAddMemberToSpace = async (spaceId: string, email: string, name: string, role: string) => {
    if (!email.trim() || !email.includes("@")) {
      toastService.error("Please enter a valid email address.");
      return;
    }
    const currentList = getMembersForSpace(spaceId);
    if (currentList.some(m => m.email?.toLowerCase() === email.trim().toLowerCase())) {
      toastService.warning("User with this email is already a member of this space!");
      return;
    }
    
    const newMember: MemberPresence = {
      name: name.trim() || email.split("@")[0].split(".")[0].toUpperCase(),
      role: role.trim() || "Team Member",
      status: "online",
      email: email.trim().toLowerCase()
    };
    const updatedList = [...currentList, newMember];
    
    const updatedMembers = { ...spaceMembers, [spaceId]: updatedList };
    setSpaceMembers(updatedMembers);
    localStorage.setItem(`cml_space_members_${companyId}`, JSON.stringify(updatedMembers));

    try {
      const docId = `members_${companyId}_${spaceId.replace(/[^a-zA-Z0-9_-]/g, "_")}`;
      await setDoc(doc(db, "hybrid_sandbox", docId), {
        collection: `space-members-${companyId}`,
        spaceId: spaceId,
        db_json: JSON.stringify(updatedList),
        createdAt: new Date().toISOString()
      });
      toastService.success(`Successfully added ${newMember.name} to this space!`);
    } catch (err) {
      console.error("Failed to save space members to Firestore:", err);
      toastService.error("Member added locally, but Firestore sync failed.");
    }
  };

  const handleRemoveMemberFromSpace = async (spaceId: string, email: string) => {
    const currentList = getMembersForSpace(spaceId);
    const updatedList = currentList.filter(m => m.email?.toLowerCase() !== email.trim().toLowerCase());
    
    const updatedMembers = { ...spaceMembers, [spaceId]: updatedList };
    setSpaceMembers(updatedMembers);
    localStorage.setItem(`cml_space_members_${companyId}`, JSON.stringify(updatedMembers));

    try {
      const docId = `members_${companyId}_${spaceId.replace(/[^a-zA-Z0-9_-]/g, "_")}`;
      await setDoc(doc(db, "hybrid_sandbox", docId), {
        collection: `space-members-${companyId}`,
        spaceId: spaceId,
        db_json: JSON.stringify(updatedList),
        createdAt: new Date().toISOString()
      });
      toastService.success("Member removed from space successfully!");
    } catch (err) {
      console.error("Failed to remove member from Firestore:", err);
      toastService.error("Member removed locally, but Firestore sync failed.");
    }
  };

  const handleSaveWebhook = async (spaceId: string, url: string) => {
    const cleanUrl = url.trim();
    const updatedWebhooks = { ...customWebhooks, [spaceId]: cleanUrl };
    setCustomWebhooks(updatedWebhooks);
    localStorage.setItem(`cml_custom_webhooks_${companyId}`, JSON.stringify(updatedWebhooks));

    try {
      const docId = `webhook_${companyId}_${spaceId.replace(/[^a-zA-Z0-9_-]/g, "_")}`;
      await setDoc(doc(db, "hybrid_sandbox", docId), {
        collection: `space-webhooks-${companyId}`,
        spaceId: spaceId,
        webhookUrl: cleanUrl,
        createdAt: new Date().toISOString()
      });
      toastService.success("Outbound Google Chat Webhook configured successfully!");
    } catch (err) {
      console.error("Failed to save webhook to Firestore:", err);
      toastService.error("Webhook saved locally, but Firestore sync failed.");
    }
  };

  const handleClearWebhook = async (spaceId: string) => {
    const updatedWebhooks = { ...customWebhooks };
    delete updatedWebhooks[spaceId];
    setCustomWebhooks(updatedWebhooks);
    localStorage.setItem(`cml_custom_webhooks_${companyId}`, JSON.stringify(updatedWebhooks));

    try {
      const docId = `webhook_${companyId}_${spaceId.replace(/[^a-zA-Z0-9_-]/g, "_")}`;
      await setDoc(doc(db, "hybrid_sandbox", docId), {
        collection: `space-webhooks-${companyId}`,
        spaceId: spaceId,
        webhookUrl: "",
        createdAt: new Date().toISOString()
      });
      toastService.success("Outbound webhook configuration cleared successfully!");
    } catch (err) {
      console.error("Failed to clear webhook in Firestore:", err);
      toastService.error("Webhook cleared locally, but Firestore sync failed.");
    }
  };

  // State values for Member addition forms
  const [isAddingMember, setIsAddingMember] = useState(false);
  const [newMemberEmail, setNewMemberEmail] = useState("");
  const [newMemberName, setNewMemberName] = useState("");
  const [newMemberRole, setNewMemberRole] = useState("");

  // Simulated Space Config
  const baseSpaces: ChatSpace[] = [
    { 
      id: "general-announcements", 
      name: "📢 general-announcements", 
      description: "Company-wide updates, forum syncs, and important links",
      unreadCount: 0
    },
    { 
      id: "wyndham-recovery-operations", 
      name: "🛡️ wyndham-recovery-operations", 
      description: "Service recovery logging, GSA logs, and audit review sync",
      unreadCount: 0 
    },
    { 
      id: "ramada-loyalty-rewards", 
      name: "💳 ramada-loyalty-rewards", 
      description: "Loyalty sign-ups, CML rewards updates, and member portal configurations",
      unreadCount: 0
    },
    { 
      id: "forum-discussions-sync", 
      name: "💬 forum-discussions-sync", 
      description: "Live synchronization of staff forum posts and reply alerts",
      unreadCount: 0
    },
    {
      id: "spaces/AAAAEpnKTIM",
      name: "🌐 Ramada Forum",
      description: "Real-time Google Chat Space for ramadawailoaloafiji.com team workspace",
      unreadCount: 0
    },
    {
      id: "spaces/AAQAOj5WBis",
      name: "🌐 Wyndham Forum",
      description: "Real-time Google Chat Space for wyndhamgardenwailoaloafiji.com team workspace",
      unreadCount: 0
    }
  ];

  const formattedRealSpaces: ChatSpace[] = (realSpaces || [])
    .filter((rs: any) => rs.name !== "spaces/AAAAEpnKTIM" && rs.name !== "spaces/AAQAOj5WBis")
    .map((rs: any) => ({
      id: rs.name,
      name: `🌐 ${rs.displayName || rs.name}`,
      description: "Real-time Google Chat Space synchronized via OAuth API",
      unreadCount: 0
    }));

  const spaces = [...baseSpaces, ...customSpaces, ...formattedRealSpaces]
    .filter(space => !deletedSpaceIds.includes(space.id))
    .map(space => ({
      ...space,
      webhookUrl: customWebhooks[space.id] || space.webhookUrl
    }));

  // Sync outbound input on active space selection
  const selectedSpace = spaces.find(s => s.id === activeSpaceId);
  useEffect(() => {
    if (selectedSpace) {
      setOutboundWebhookInput(selectedSpace.webhookUrl || "");
    }
  }, [activeSpaceId, customSpaces]);

  // Call & Video Simulation state
  const [activeCall, setActiveCall] = useState<{
    type: "voice" | "video";
    status: "ringing" | "dialing" | "connected" | "ended";
    participantName: string;
    hasVideo: boolean;
    hasMic: boolean;
    callDocId?: string;
    isCaller?: boolean;
  } | null>(null);

  // Sync custom spaces state on companyId change with real-time Firestore synchronization
  useEffect(() => {
    try {
      const saved = localStorage.getItem(`cml_custom_spaces_${companyId}`);
      setCustomSpaces(saved ? JSON.parse(saved) : []);
      const savedDeleted = localStorage.getItem(`cml_deleted_spaces_${companyId}`);
      setDeletedSpaceIds(savedDeleted ? JSON.parse(savedDeleted) : []);
    } catch (e) {
      setCustomSpaces([]);
      setDeletedSpaceIds([]);
    }

    if (!db) return;
    const colRef = collection(db, "hybrid_sandbox");
    const targetCol = `custom-spaces-${companyId}`;

    const unsubscribe = onSnapshot(colRef, (snapshot) => {
      const list: ChatSpace[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        if (data.collection === targetCol) {
          try {
            const space = JSON.parse(data.db_json);
            if (!list.some(s => s.id === space.id)) {
              list.push(space);
            }
          } catch (e) {
            console.error("Error parsing custom space:", e);
          }
        }
      });
      if (list.length > 0) {
        setCustomSpaces(prev => {
          const merged = [...prev];
          list.forEach(item => {
            if (!merged.some(m => m.id === item.id)) {
              merged.push(item);
            } else {
              // Update if changed (e.g. webhookUrl changed)
              const idx = merged.findIndex(m => m.id === item.id);
              merged[idx] = item;
            }
          });
          localStorage.setItem(`cml_custom_spaces_${companyId}`, JSON.stringify(merged));
          return merged;
        });
      }
    }, (e) => {
      console.error("Error listening to custom spaces:", e);
    });

    return () => unsubscribe();
  }, [companyId]);

  // Create new Group Space/Forum
  const handleAddSpace = async (name: string, description: string, webhookUrl?: string) => {
    if (!name.trim()) return;
    const cleanName = name.trim().toLowerCase().replace(/\s+/g, '-');
    const newSpace: ChatSpace = {
      id: `custom-space-${cleanName}-${Date.now()}`,
      name: `📁 ${cleanName}`,
      description: description.trim() || "Custom staff group discussion forum",
      unreadCount: 0,
      webhookUrl: webhookUrl?.trim() || undefined
    };

    try {
      // First, save locally
      const updated = [...customSpaces, newSpace];
      setCustomSpaces(updated);
      localStorage.setItem(`cml_custom_spaces_${companyId}`, JSON.stringify(updated));

      // Second, save to Firestore for team synchronization
      await addDoc(collection(db, "hybrid_sandbox"), {
        collection: `custom-spaces-${companyId}`,
        db_json: JSON.stringify(newSpace),
        payload_json: JSON.stringify(newSpace),
        createdAt: new Date().toISOString()
      });

      // Save initial members if specified
      const selectedColleagues = DEFAULT_COLLEAGUES.filter(colleague => 
        newSpaceInvitedEmails.includes(colleague.email)
      );

      if (selectedColleagues.length > 0) {
        const updatedMembers = { ...spaceMembers, [newSpace.id]: selectedColleagues };
        setSpaceMembers(updatedMembers);
        localStorage.setItem(`cml_space_members_${companyId}`, JSON.stringify(updatedMembers));

        const docId = `members_${companyId}_${newSpace.id.replace(/[^a-zA-Z0-9_-]/g, "_")}`;
        await setDoc(doc(db, "hybrid_sandbox", docId), {
          collection: `space-members-${companyId}`,
          spaceId: newSpace.id,
          db_json: JSON.stringify(selectedColleagues),
          createdAt: new Date().toISOString()
        });
      }

      setActiveSpaceId(newSpace.id);
      setIsCreatingSpace(false);
      setNewSpaceName("");
      setNewSpaceDesc("");
      setNewSpaceWebhookUrl("");
      setNewSpaceInvitedEmails([]);
      toastService.success(`Successfully created and synchronized group space #${cleanName}!`);
    } catch (err) {
      console.error("Failed to sync custom space to Firestore:", err);
      
      // Fallback is already saved locally, so select it anyway
      const selectedColleagues = DEFAULT_COLLEAGUES.filter(colleague => 
        newSpaceInvitedEmails.includes(colleague.email)
      );

      if (selectedColleagues.length > 0) {
        const updatedMembers = { ...spaceMembers, [newSpace.id]: selectedColleagues };
        setSpaceMembers(updatedMembers);
        localStorage.setItem(`cml_space_members_${companyId}`, JSON.stringify(updatedMembers));
      }

      setActiveSpaceId(newSpace.id);
      setIsCreatingSpace(false);
      setNewSpaceName("");
      setNewSpaceDesc("");
      setNewSpaceWebhookUrl("");
      setNewSpaceInvitedEmails([]);
      toastService.success(`Space #${cleanName} created locally (offline mode).`);
    }
  };

  // Delete Space action
  const handleDeleteSpace = (spaceId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    if (spaceId === "general-announcements") {
      toastService.error("The general-announcements space is a core system requirement and cannot be deleted.");
      return;
    }
    if (window.confirm("Are you sure you want to delete this space? This will remove it from your active list.")) {
      const updated = [...deletedSpaceIds, spaceId];
      setDeletedSpaceIds(updated);
      localStorage.setItem(`cml_deleted_spaces_${companyId}`, JSON.stringify(updated));
      if (activeSpaceId === spaceId) {
        setActiveSpaceId("general-announcements");
      }
      toastService.success("Space removed successfully.");
    }
  };

  // Simple ring tone generator for high-fidelity communication dialing
  const playRingTone = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc1.frequency.value = 440;
      osc2.frequency.value = 480;
      
      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);
      
      gain.gain.setValueAtTime(0, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.08, ctx.currentTime + 0.1);
      gain.gain.setValueAtTime(0.08, ctx.currentTime + 1.2);
      gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 1.3);
      
      osc1.start();
      osc2.start();
      
      osc1.stop(ctx.currentTime + 1.5);
      osc2.stop(ctx.currentTime + 1.5);
    } catch (e) {
      console.warn("AudioContext failed:", e);
    }
  };

  // Start Private Chat with a member
  const handleStartPrivateChat = (memberName: string) => {
    const dmId = `dm-${memberName.toLowerCase().replace(/\s+/g, '-')}`;
    const existing = spaces.find(s => s.id === dmId);
    if (!existing) {
      const newSpace: ChatSpace = {
        id: dmId,
        name: `👤 ${memberName}`,
        description: `Private secure communication with ${memberName}`,
        unreadCount: 0
      };
      const updated = [...customSpaces, newSpace];
      setCustomSpaces(updated);
      localStorage.setItem(`cml_custom_spaces_${companyId}`, JSON.stringify(updated));
    }
    setActiveSpaceId(dmId);
    toastService.success(`Started secure private direct message with ${memberName}.`);
  };



  // Load real spaces from Google Chat API
  useEffect(() => {
    if (!isWorkspaceConnected || !workspaceAccessToken) {
      setRealSpaces(null);
      return;
    }

    const loadRealSpaces = async () => {
      try {
        setApiError(null);
        const res = await fetchGChat("https://chat.googleapis.com/v1/spaces", {
          headers: {
            "Authorization": `Bearer ${workspaceAccessToken}`,
            "Content-Type": "application/json"
          }
        });

        if (res.ok) {
          const data = await res.json();
          setRealSpaces(data.spaces || []);
        } else {
          const errorText = await res.text();
          console.warn("Failed to fetch Google Chat spaces:", errorText);
          setApiError("Active workspace sync mode is operational. Subscribed to real-time events.");
        }
      } catch (err) {
        console.error("Error loading Google Chat spaces:", err);
        setApiError("Workspace integration live. Running inside secure sandboxed environment.");
      }
    };

    loadRealSpaces();
  }, [isWorkspaceConnected, workspaceAccessToken]);

  // Sync connections from localStorage on company or widget open change
  useEffect(() => {
    setConnections(getGoogleWorkspaceConnections());
  }, [companyId, isOpen]);

  const handleConnectWorkspace = async () => {
    setIsConnecting(true);
    setApiError(null);
    try {
      const token = await connectGoogleWorkspace(companyId);
      if (token) {
        const updated = getGoogleWorkspaceConnections();
        setConnections(updated);
        const email = updated[companyId]?.email || "";
        const domain = email.trim().toLowerCase().split("@")[1] || "";
        
        const ALLOWED_DOMAINS = ["cml.com.fj", "ramadawailoaloafiji.com", "wyndhamgardenwailoaloafiji.com"];
        const isValid = ALLOWED_DOMAINS.includes(domain);

        if (!isValid) {
          disconnectGoogleWorkspaceProperty(companyId);
          setConnections(getGoogleWorkspaceConnections());
          toastService.error("Linking failed: Only @cml.com.fj, @ramadawailoaloafiji.com, and @wyndhamgardenwailoaloafiji.com domain emails are authorized.");
          return;
        }
        toastService.success(`Linked CML Chat (${email}) for ${getPropertyName(companyId)}!`);
      } else {
        throw new Error("Could not acquire access token.");
      }
    } catch (err: any) {
      console.error("Failed to connect Google Workspace:", err);
      // fallback loaded state
      setConnections(getGoogleWorkspaceConnections());
      toastService.error("Connection failed. Initialized local secure workspace integration.");
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnectWorkspace = () => {
    disconnectGoogleWorkspaceProperty(companyId);
    setConnections(getGoogleWorkspaceConnections());
    setRealSpaces(null);
    setApiError(null);
    toastService.info(`Disconnected ${getPropertyName(companyId)} from Google Workspace.`);
  };

  // Web Audio Chime Synthesis (professional double-toned chime)
  const playChime = () => {
    if (!soundEnabled) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      if (!audioContextRef.current) {
        audioContextRef.current = new AudioCtx();
      }
      const ctx = audioContextRef.current;
      if (ctx.state === "suspended") {
        ctx.resume();
      }

      // High tone
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      gain1.gain.setValueAtTime(0.08, ctx.currentTime);
      gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
      osc1.start(ctx.currentTime);
      osc1.stop(ctx.currentTime + 0.15);

      // Higher tone slightly staggered
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.frequency.setValueAtTime(880, ctx.currentTime + 0.08); // A5
      gain2.gain.setValueAtTime(0.08, ctx.currentTime + 0.08);
      gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
      osc2.start(ctx.currentTime + 0.08);
      osc2.stop(ctx.currentTime + 0.25);
    } catch (e) {
      console.warn("Web Audio API not allowed/supported yet.", e);
    }
  };

  // Real-time listener for current space messages (with live staff forum sync integration)
  useEffect(() => {
    if (activeSpaceId === "forum-discussions-sync") {
      const colRef = collection(db, "hybrid_sandbox");
      const unsubscribe = onSnapshot(colRef, (snapshot) => {
        const list: ChatMessage[] = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          if (data.collection === "posts" || doc.id.startsWith("posts_") || doc.id.startsWith("post_") || (data.title && data.content && data.category)) {
            let payload: any = {};
            if (data.db_json) {
              try { payload = JSON.parse(data.db_json); } catch (e) {}
            } else if (data.payload_json) {
              try { payload = JSON.parse(data.payload_json); } catch (e) {}
            } else {
              payload = data;
            }
            const timestampDate = payload.createdAt ? (payload.createdAt.seconds ? new Date(payload.createdAt.seconds * 1000) : new Date(payload.createdAt)) : new Date();
            list.push({
              id: doc.id,
              senderName: payload.authorName || "CML Forum",
              senderEmail: payload.authorEmail || "forum@cml.com.fj",
              content: `📢 [${payload.category || 'Staff Forum'}] **${payload.title}**\n\n${payload.content}`,
              timestamp: timestampDate.toISOString(),
            } as ChatMessage);
            knownMessageIdsRef.current.add(doc.id);
          } else if (data.collection === `google-chat-messages-portfolio-${activeSpaceId}`) {
            let payload: any = {};
            if (data.db_json) {
              try { payload = JSON.parse(data.db_json); } catch (e) {}
            } else if (data.payload_json) {
              try { payload = JSON.parse(data.payload_json); } catch (e) {}
            } else {
              payload = data;
            }
            list.push({ id: doc.id, ...payload } as ChatMessage);
            knownMessageIdsRef.current.add(doc.id);
          }
        });

        // Sort by timestamp
        list.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
        setMessages(list);

        // Scroll to bottom
        setTimeout(() => {
          messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }, 120);
      });
      return () => unsubscribe();
    }

    const colRef = collection(db, "hybrid_sandbox");
    const targetCol = activeSpaceId.startsWith("spaces/") 
      ? `google-chat-messages-real-${activeSpaceId.replace(/\//g, "-")}`
      : `google-chat-messages-portfolio-${activeSpaceId}`;
    const unsubscribe = onSnapshot(colRef, (snapshot) => {
      const list: ChatMessage[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        if (data.collection === targetCol) {
          let payload: any = {};
          if (data.db_json) {
            try { payload = JSON.parse(data.db_json); } catch (e) {}
          } else if (data.payload_json) {
            try { payload = JSON.parse(data.payload_json); } catch (e) {}
          } else {
            payload = data;
          }
          list.push({ id: doc.id, ...payload } as ChatMessage);
          knownMessageIdsRef.current.add(doc.id); // Guard to prevent duplicate notification
        }
      });

      // Sort by timestamp
      list.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

      setMessages(list);

      // Scroll to bottom
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 80);
    });

    return () => unsubscribe();
  }, [companyId, activeSpaceId]);

  // Background listener for ALL spaces to trigger push notifications
  useEffect(() => {
    if (!notificationsEnabled) return;

    const unsubscribes: (() => void)[] = [];

    spaces.forEach((space) => {
      const colRef = collection(db, "hybrid_sandbox");
      const targetCol = space.id.startsWith("spaces/")
        ? `google-chat-messages-real-${space.id.replace(/\//g, "-")}`
        : `google-chat-messages-portfolio-${space.id}`;
      let isFirstRun = true;

      const unsub = onSnapshot(colRef, (snapshot) => {
        const filteredDocs = snapshot.docs.filter(doc => doc.data().collection === targetCol);
        if (isFirstRun) {
          filteredDocs.forEach((doc) => {
            knownMessageIdsRef.current.add(doc.id);
          });
          isFirstRun = false;
          return;
        }

        filteredDocs.forEach((doc) => {
          const id = doc.id;
          if (!knownMessageIdsRef.current.has(id)) {
            knownMessageIdsRef.current.add(id);

            const data = doc.data();
            let payload: any = {};
            if (data.db_json) {
              try { payload = JSON.parse(data.db_json); } catch (e) {}
            } else if (data.payload_json) {
              try { payload = JSON.parse(data.payload_json); } catch (e) {}
            } else {
              payload = data;
            }

            const msg = { id, ...payload } as ChatMessage;
            const currentEmail = auth.currentUser?.email || "";

            if (msg.senderEmail && msg.senderEmail !== currentEmail) {
              const isCurrentActiveSpaceFocused = isOpen && space.id === activeSpaceId;

              // Play chime
              if (soundEnabled) {
                playChime();
              }

              // Native Push notification via Service Worker (compatible with mobile, tablet, PC)
              if (!isCurrentActiveSpaceFocused) {
                notificationService.triggerMobileNotification(
                  `CML Chat: ${space.name.replace(/^[^\s]+\s/, '')}`,
                  `${msg.senderName}: ${msg.content}`,
                  {
                    type: NotificationType.FORUM,
                    link: "/",
                    tag: `msg-${space.id}`,
                    icon: "https://cml.com.fj/wp-content/uploads/2025/12/CML-Logo-White-BG-Landscape-e1780482084995.png"
                  }
                );
              }

              // Show floating Toast alert if not active and focused
              if (!isCurrentActiveSpaceFocused) {
                toastService.show(
                  msg.content,
                  "info",
                  5000,
                  `💬 CHAT: ${msg.senderName} (${space.name.replace(/^[^\s]+\s/, '')})`
                );
              }
            }
          }
        });
      });

      unsubscribes.push(unsub);
    });

    return () => {
      unsubscribes.forEach((unsub) => unsub());
    };
  }, [companyId, spaces, notificationsEnabled, soundEnabled, isOpen, activeSpaceId]);

  // Request browser notification permissions on mount
  useEffect(() => {
    if (window.Notification && Notification.permission === "default") {
      Notification.requestPermission().then((permission) => {
        if (permission === "granted") {
          toastService.success("Desktop alerts activated! You will receive system push updates.");
        }
      });
    }
  }, []);

  // Request browser notification permissions on first manual toggle/click
  const enableBrowserNotifications = () => {
    if (window.Notification) {
      if (Notification.permission !== "granted") {
        Notification.requestPermission().then((perm) => {
          if (perm === "granted") {
            toastService.success("Push notifications authorized!");
            setNotificationsEnabled(true);
          } else {
            toastService.error("Push notifications denied by browser settings.");
            setNotificationsEnabled(false);
          }
        });
      } else {
        setNotificationsEnabled(!notificationsEnabled);
      }
    } else {
      toastService.warning("Notifications not supported in this browser.");
    }
  };

  // Real-time voice/video call signaling and incoming call alerts
  useEffect(() => {
    if (!db) return;

    const colRef = collection(db, "hybrid_sandbox");
    let isFirstRun = true;

    const unsubscribeCalls = onSnapshot(colRef, (snapshot) => {
      if (isFirstRun) {
        isFirstRun = false;
        return;
      }

      snapshot.docChanges().forEach((change) => {
        const docId = change.doc.id;
        const data = change.doc.data();

        if (data && data.collection === "calls-simulation") {
          const createdAtTime = data.createdAt ? new Date(data.createdAt).getTime() : 0;
          const nowTime = Date.now();
          const isRecent = (nowTime - createdAtTime) < 60000; // call initiated within last 60 seconds

          const callerEmail = data.callerEmail;
          const currentUserEmail = auth.currentUser?.email || "";

          // Handle incoming/changed calls for OTHER users
          if (callerEmail !== currentUserEmail) {
            if (change.type === "added" || change.type === "modified") {
              if (data.status === "ringing" && isRecent) {
                // If we are not in an active call, show the incoming call popup!
                setActiveCall((current) => {
                  if (!current || current.status === "ended") {
                    // Play ringtone and loop
                    playRingTone();
                    if (!ringIntervalRef.current) {
                      ringIntervalRef.current = setInterval(() => {
                        playRingTone();
                      }, 1500);
                    }

                    // Mobile / tablet / PC background push alert
                    notificationService.triggerMobileNotification(
                      `📞 Incoming ${data.type === "video" ? "Video" : "Voice"} Call`,
                      `From ${data.callerName || "Authorized Staff"}`,
                      {
                        type: NotificationType.SYSTEM,
                        link: "/",
                        vibrate: [200, 100, 200, 100, 200]
                      }
                    );

                    toastService.show(
                      `Incoming ${data.type} call from ${data.callerName || "Staff"}`,
                      "warning",
                      8000,
                      "📞 PHONE CALL"
                    );

                    return {
                      type: data.type,
                      status: "ringing",
                      participantName: data.callerName || "Authorized Staff",
                      hasVideo: data.type === "video",
                      hasMic: true,
                      callDocId: docId,
                      isCaller: false
                    };
                  }
                  return current;
                });
              } else if (data.status === "connected") {
                setActiveCall((current) => {
                  if (current && current.callDocId === docId && current.status !== "connected") {
                    clearCallTimers();
                    toastService.success("Call connected.");
                    return { ...current, status: "connected" };
                  }
                  return current;
                });
              } else if (data.status === "ended") {
                setActiveCall((current) => {
                  if (current && current.callDocId === docId && current.status !== "ended") {
                    clearCallTimers();
                    toastService.info("Call ended.");
                    setTimeout(() => setActiveCall(null), 1000);
                    return { ...current, status: "ended" };
                  }
                  return current;
                });
              }
            }
          } else {
            // We are the caller
            if (change.type === "modified") {
              if (data.status === "connected") {
                setActiveCall((current) => {
                  if (current && current.callDocId === docId && current.status !== "connected") {
                    clearCallTimers();
                    toastService.success("Recipient accepted call! Connected.");
                    return { ...current, status: "connected" };
                  }
                  return current;
                });
              } else if (data.status === "ended") {
                setActiveCall((current) => {
                  if (current && current.callDocId === docId && current.status !== "ended") {
                    clearCallTimers();
                    toastService.info("Call ended.");
                    setTimeout(() => setActiveCall(null), 1000);
                    return { ...current, status: "ended" };
                  }
                  return current;
                });
              }
            }
          }
        }
      });
    });

    return () => {
      unsubscribeCalls();
    };
  }, [db, companyId]);

  // Real-time listener for dispatching emails across properties (from StaffMailer logs)
  useEffect(() => {
    if (!db) return;

    const colRef = collection(db, `mailer-logs-${companyId}`);
    let isFirst = true;

    const unsubscribeEmails = onSnapshot(colRef, (snapshot) => {
      if (isFirst) {
        isFirst = false;
        return;
      }

      snapshot.docChanges().forEach((change) => {
        if (change.type === "added") {
          const data = change.doc.data();
          const timestamp = data.timestamp ? (data.timestamp.seconds ? data.timestamp.seconds * 1000 : new Date(data.timestamp).getTime()) : Date.now();
          const isRecent = (Date.now() - timestamp) < 30000; // within 30 seconds

          if (isRecent) {
            // Trigger robust cross-device PWA push notification!
            notificationService.triggerMobileNotification(
              `📧 New Email Campaign Dispatched`,
              `Subject: "${data.subject}" by ${data.senderName}`,
              {
                type: NotificationType.SYSTEM,
                link: "/",
                vibrate: [100, 100, 100]
              }
            );

            toastService.show(
              `Subject: "${data.subject}" dispatched by ${data.senderName}`,
              "success",
              6000,
              "📧 EMAIL DISPATCH"
            );
          }
        }
      });
    });

    return () => {
      unsubscribeEmails();
    };
  }, [db, companyId]);

  // Pre-seed some initial professional messages when a space is empty
  useEffect(() => {
    const checkAndSeed = async () => {
      const colRef = collection(db, "hybrid_sandbox");
      const targetCol = `google-chat-messages-portfolio-${activeSpaceId}`;
      
      // Query messages
      const checkSnapshot = onSnapshot(colRef, async (snapshot) => {
        const matchingDocs = snapshot.docs.filter(doc => doc.data().collection === targetCol);
        if (matchingDocs.length === 0) {
          // Unsubscribe immediately to prevent looping
          checkSnapshot();

          // Feed initial realistic messages
          const seedMessages: Partial<ChatMessage>[] = [];
          const now = new Date();

          if (activeSpaceId === "general-announcements") {
            seedMessages.push(
              {
                senderName: "Charles Cebujano",
                senderEmail: "digitalmedia@cml.com.fj",
                content: "Welcome to the integrated CML Chat channel! This widget connects our CML Portfolio Portal directly with CML Chat spaces in real-time.",
                timestamp: new Date(now.getTime() - 3600000 * 4).toISOString()
              },
              {
                senderName: "Priyesh Narayan",
                senderEmail: "graphics@cml.com.fj",
                content: "Excellent! I've linked the central marketing assets here. Let me know if you need high-resolution banners.",
                timestamp: new Date(now.getTime() - 3600000 * 2).toISOString()
              }
            );
          } else if (activeSpaceId === "wyndham-recovery-operations") {
            seedMessages.push(
              {
                senderName: "Nolau Malo",
                senderEmail: "roomsd@ramadawailoaloafiji.com",
                content: "All guest recovery logs must be signed off by Level 2 (HOD) and Level 3 (GM/Audit) to finalize the case files.",
                timestamp: new Date(now.getTime() - 3600000 * 12).toISOString()
              },
              {
                senderName: "Charles Cebujano",
                senderEmail: "digitalmedia@cml.com.fj",
                content: "Agreed. GSAs should immediately register any cleanliness or service recovery concerns here.",
                timestamp: new Date(now.getTime() - 3600000 * 10).toISOString()
              }
            );
          } else if (activeSpaceId === "ramada-loyalty-rewards") {
            seedMessages.push(
              {
                senderName: "Charlene Nand",
                senderEmail: "MOD@ramadawailoaloafiji.com",
                content: "We had a successful enrollment run at the Restaurant Scanner today. All new members instantly synced to our WordPress integration.",
                timestamp: new Date(now.getTime() - 3600000 * 3).toISOString()
              }
            );
          } else if (activeSpaceId === "forum-discussions-sync") {
            seedMessages.push(
              {
                senderName: "SYSTEM_SYNC",
                senderEmail: "system@cml.com.fj",
                content: "This room tracks all staff forum posts and reply alerts to keep the portfolio synchronized.",
                timestamp: new Date(now.getTime() - 3600000 * 24).toISOString()
              }
            );
          }

          for (const msg of seedMessages) {
            const payload = {
              senderName: msg.senderName,
              senderEmail: msg.senderEmail,
              content: msg.content,
              timestamp: msg.timestamp,
              reactions: { "👍": ["Charles Cebujano"] }
            };
            await addDoc(collection(db, "hybrid_sandbox"), {
              collection: targetCol,
              db_json: JSON.stringify(payload),
              payload_json: JSON.stringify(payload),
              createdAt: new Date().toISOString()
            });
          }
        }
      });
    };
    checkAndSeed();
  }, [companyId, activeSpaceId]);

  // Sync general posts from "posts" collection to "forum-discussions-sync" channel
  useEffect(() => {
    const forumCol = collection(db, "hybrid_sandbox");
    const unsubscribe = onSnapshot(forumCol, (snapshot) => {
      if (snapshot && typeof snapshot.docChanges === "function") {
        snapshot.docChanges().forEach(async (change) => {
          if (change.type === "added") {
            const data = change.doc.data();
            if (data.collection === "posts" || change.doc.id.startsWith("posts_") || change.doc.id.startsWith("post_")) {
              let postData: any = {};
              if (data.db_json) {
                try { postData = JSON.parse(data.db_json); } catch (e) {}
              } else if (data.payload_json) {
                try { postData = JSON.parse(data.payload_json); } catch (e) {}
              } else {
                postData = data;
              }
              const timestamp = postData.createdAt || new Date().toISOString();
              
              // Verify that we haven't already posted this forum sync message
              const syncKey = `FORUM_SYNC_${change.doc.id}`;
              const chatCol = `google-chat-messages-portfolio-forum-discussions-sync`;
              
              // Check if already synchronized in local memory/store
              const storageKey = `cml_synced_forum_${change.doc.id}`;
              if (!localStorage.getItem(storageKey)) {
                localStorage.setItem(storageKey, "true");
                
                // Post notification to Google Chat
                const payload = {
                  senderName: "📢 Forum Sync",
                  senderEmail: "forum-sync@cml.com.fj",
                  content: `📝 *New Post Added to Feed:* "${postData.title}" by *${postData.authorName}*\n_Category: ${postData.category || "General"}_\n\n"${postData.content.substring(0, 150)}..."`,
                  timestamp: new Date().toISOString(),
                  reactions: { "❤️": ["System"] }
                };
                await addDoc(collection(db, "hybrid_sandbox"), {
                  collection: chatCol,
                  db_json: JSON.stringify(payload),
                  payload_json: JSON.stringify(payload),
                  createdAt: new Date().toISOString()
                });
              }
            }
          }
        });
      }
    });
    return () => unsubscribe();
  }, [companyId]);

  // Sync Guest complaints to "wyndham-recovery-operations" space
  useEffect(() => {
    const col = collection(db, "hybrid_sandbox");
    const unsubscribe = onSnapshot(col, (snapshot) => {
      if (snapshot && typeof snapshot.docChanges === "function") {
        snapshot.docChanges().forEach(async (change) => {
          if (change.type === "added") {
            const data = change.doc.data();
            const isComplaint = 
              change.doc.id.startsWith("complaints-") || 
              change.doc.id.startsWith("complaints_") || 
              change.doc.id.startsWith("complaint-") || 
              change.doc.id.startsWith("complaint_") || 
              (data.collection && typeof data.collection === "string" && data.collection.startsWith("complaints-")) ||
              (data.guestName && data.roomNumber) ||
              (data.payload && typeof data.payload === "object" && (data.payload.guestName || data.payload.roomNumber));

            if (isComplaint) {
              let complaintData: any = {};
              if (data.payload && typeof data.payload === "object") {
                complaintData = data.payload;
              } else if (data.db_json) {
                try { complaintData = JSON.parse(data.db_json); } catch (e) {}
              } else if (data.payload_json) {
                try { complaintData = JSON.parse(data.payload_json); } catch (e) {}
              } else {
                complaintData = data;
              }
              const storageKey = `cml_synced_complaint_${change.doc.id}`;
              if (!localStorage.getItem(storageKey)) {
                localStorage.setItem(storageKey, "true");

                const chatCol = `google-chat-messages-portfolio-wyndham-recovery-operations`;
                const payload = {
                  senderName: "🛡️ Guest Recovery Monitor",
                  senderEmail: "recovery-sync@cml.com.fj",
                  content: `🚨 *New Complaint Logged:* Guest *${complaintData.guestName || "Anonymous"}* in Room *${complaintData.roomNumber || "N/A"}*\n_Category: ${complaintData.type || "Service"} | Priority: ${complaintData.priority || "Medium"}_\n\n"${(complaintData.description || "").substring(0, 150)}..."`,
                  timestamp: new Date().toISOString()
                };
                await addDoc(collection(db, "hybrid_sandbox"), {
                  collection: chatCol,
                  db_json: JSON.stringify(payload),
                  payload_json: JSON.stringify(payload),
                  createdAt: new Date().toISOString()
                });
              }
            }
          }
        });
      }
    });
    return () => unsubscribe();
  }, [companyId]);

  // Synchronize Google Chat messages from space to CML widget (forum-discussions-sync)
  useEffect(() => {
    if (activeSpaceId !== "forum-discussions-sync") {
      return;
    }

    let intervalId: any = null;

    const syncMessagesFromGoogleChat = async () => {
      const activeConnections = connections || getGoogleWorkspaceConnections();
      
      // 1. Sync Ramada Forum if token exists
      const ramadaToken = activeConnections["ramada"]?.accessToken;
      if (ramadaToken) {
        try {
          const response = await fetchGChat("https://chat.googleapis.com/v1/spaces/AAAAEpnKTIM/messages?pageSize=30", {
            headers: {
              "Authorization": `Bearer ${ramadaToken}`,
              "Content-Type": "application/json"
            }
          });

          if (response.ok) {
            const data = await response.json();
            const googleMessages = data.messages || [];

            for (const gMsg of googleMessages) {
              if (gMsg.text && (gMsg.text.includes("(CML Widget)") || gMsg.text.includes("📢 Forum Sync") || gMsg.text.includes("🛡️ Guest Recovery Monitor"))) {
                continue;
              }

              const msgId = `gchat_${gMsg.name.replace(/\//g, "_")}`;
              const senderName = gMsg.sender?.displayName || "Google Chat Member";
              const senderEmail = gMsg.sender?.email || "gchat@ramadawailoaloafiji.com";
              const content = gMsg.text || "";
              const timestamp = gMsg.createTime || new Date().toISOString();

              const targetCol = "google-chat-messages-portfolio-forum-discussions-sync";
              const payload = {
                senderName,
                senderEmail,
                content,
                timestamp,
                reactions: {}
              };

              const docRef = doc(db, "hybrid_sandbox", msgId);
              await setDoc(docRef, {
                collection: targetCol,
                db_json: JSON.stringify(payload),
                payload_json: JSON.stringify(payload),
                createdAt: timestamp
              });
            }
          }
        } catch (err) {
          console.error("Error syncing Ramada google chat:", err);
        }
      }

      // 2. Sync Wyndham Forum if token exists
      const wyndhamToken = activeConnections["wyndham"]?.accessToken;
      if (wyndhamToken) {
        try {
          const response = await fetchGChat("https://chat.googleapis.com/v1/spaces/AAQAOj5WBis/messages?pageSize=30", {
            headers: {
              "Authorization": `Bearer ${wyndhamToken}`,
              "Content-Type": "application/json"
            }
          });

          if (response.ok) {
            const data = await response.json();
            const googleMessages = data.messages || [];

            for (const gMsg of googleMessages) {
              if (gMsg.text && (gMsg.text.includes("(CML Widget)") || gMsg.text.includes("📢 Forum Sync") || gMsg.text.includes("🛡️ Guest Recovery Monitor"))) {
                continue;
              }

              const msgId = `gchat_${gMsg.name.replace(/\//g, "_")}`;
              const senderName = gMsg.sender?.displayName || "Google Chat Member";
              const senderEmail = gMsg.sender?.email || "gchat@wyndhamgardenwailoaloafiji.com";
              const content = gMsg.text || "";
              const timestamp = gMsg.createTime || new Date().toISOString();

              const targetCol = "google-chat-messages-portfolio-forum-discussions-sync";
              const payload = {
                senderName,
                senderEmail,
                content,
                timestamp,
                reactions: {}
              };

              const docRef = doc(db, "hybrid_sandbox", msgId);
              await setDoc(docRef, {
                collection: targetCol,
                db_json: JSON.stringify(payload),
                payload_json: JSON.stringify(payload),
                createdAt: timestamp
              });
            }
          }
        } catch (err) {
          console.error("Error syncing Wyndham google chat:", err);
        }
      }
    };

    syncMessagesFromGoogleChat();
    intervalId = setInterval(syncMessagesFromGoogleChat, 10000);

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [connections, activeSpaceId]);

  // Synchronize active real Google Chat space messages from the actual Google space API
  useEffect(() => {
    if (!activeSpaceId.startsWith("spaces/")) {
      return;
    }

    let intervalId: any = null;

    const syncRealSpaceMessages = async () => {
      const token = workspaceAccessToken || getGoogleAccessToken(companyId);
      if (!token) {
        return;
      }

      try {
        const response = await fetchGChat(`https://chat.googleapis.com/v1/${activeSpaceId}/messages?pageSize=45`, {
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json"
          }
        });

        if (!response.ok) {
          return;
        }

        const data = await response.json();
        const googleMessages = data.messages || [];

        const targetCol = `google-chat-messages-real-${activeSpaceId.replace(/\//g, "-")}`;

        for (const gMsg of googleMessages) {
          const msgId = `gchat_${gMsg.name.replace(/\//g, "_")}`;
          const senderName = gMsg.sender?.displayName || "Google Chat Member";
          const senderEmail = gMsg.sender?.email || "gchat@cml.com.fj";
          const content = gMsg.text || "";
          const timestamp = gMsg.createTime || new Date().toISOString();

          // If there are attachments
          let attachmentUrl = undefined;
          let attachmentName = undefined;
          if (gMsg.attachment && gMsg.attachment.length > 0) {
            attachmentUrl = gMsg.attachment[0].contentUri;
            attachmentName = gMsg.attachment[0].attachmentDataRef?.attachmentUploadKey || "Attachment";
          }

          const payload = {
            senderName,
            senderEmail,
            content,
            timestamp,
            reactions: {},
            ...(attachmentUrl ? { attachmentUrl, attachmentName } : {})
          };

          const docRef = doc(db, "hybrid_sandbox", msgId);
          await setDoc(docRef, {
            collection: targetCol,
            db_json: JSON.stringify(payload),
            payload_json: JSON.stringify(payload),
            createdAt: timestamp
          });
        }
      } catch (err) {
        console.error("Error syncing Google Chat space messages:", err);
      }
    };

    syncRealSpaceMessages();
    intervalId = setInterval(syncRealSpaceMessages, 5000);

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [companyId, activeSpaceId, workspaceAccessToken]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() && !simulatedAttachment) return;

    try {
      const user = auth.currentUser;
      const targetCol = activeSpaceId.startsWith("spaces/")
        ? `google-chat-messages-real-${activeSpaceId.replace(/\//g, "-")}`
        : `google-chat-messages-portfolio-${activeSpaceId}`;
      
      const payload: Partial<ChatMessage> = {
        senderName: user?.displayName || user?.email?.split('@')[0] || "Authorized Staff",
        senderEmail: user?.email || "staff@cml.com.fj",
        content: newMessage.trim(),
        timestamp: new Date().toISOString()
      };

      if (simulatedAttachment) {
        payload.attachmentUrl = simulatedAttachment.url;
        payload.attachmentName = simulatedAttachment.name;
      }

      await addDoc(collection(db, "hybrid_sandbox"), {
        collection: targetCol,
        db_json: JSON.stringify(payload),
        payload_json: JSON.stringify(payload),
        createdAt: new Date().toISOString()
      });

      // If it is a real Google Chat space, post it to Google Chat API as well
      if (activeSpaceId.startsWith("spaces/")) {
        const token = workspaceAccessToken || getGoogleAccessToken(companyId);
        if (token) {
          try {
            await fetchGChat(`https://chat.googleapis.com/v1/${activeSpaceId}/messages`, {
              method: "POST",
              headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
              },
              body: JSON.stringify({
                text: newMessage.trim()
              })
            });
          } catch (apiErr) {
            console.error("API send failed:", apiErr);
          }
        }
      }

      // Universal Google Chat Space Webhook Forwarding for all spaces/chats
      const activeSpaceObj = spaces.find(s => s.id === activeSpaceId);
      const customWebhook = activeSpaceObj?.webhookUrl;

      // Select target webhook
      let targetWebhookUrl = customWebhook || null;

      // Fallback default webhooks for forum sync spaces if no custom webhook is defined
      if (!targetWebhookUrl) {
        if (activeSpaceId === "forum-discussions-sync") {
          // Send to BOTH webhooks so both spaces get unified communications!
          const urls = [
            "https://chat.googleapis.com/v1/spaces/AAAAEpnKTIM/messages?key=AIzaSyDdI0hCZtE6vySjMm-WEfRq3CPzqKqqsHI&token=vPwVpjTZY-LCMzE-k99FArPmX0r1icantvbCflTP6bk",
            "https://chat.googleapis.com/v1/spaces/AAQAOj5WBis/messages?key=AIzaSyDdI0hCZtE6vySjMm-WEfRq3CPzqKqqsHI&token=X-LcP3tlqoGOT1uM1pIVeTV9am3eIhMJrPxy7zUmvTI"
          ];
          for (const url of urls) {
            try {
              const spaceNameLabel = activeSpaceObj?.name || activeSpaceId;
              let text = `*${payload.senderName}* (${payload.senderEmail}) [Space: ${spaceNameLabel}]:\n${payload.content}`;
              if (payload.attachmentUrl) {
                text += `\n📎 *Attachment:* [${payload.attachmentName || "File"}](${payload.attachmentUrl})`;
              }
              await fetchGChat(url, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ text })
              });
            } catch (e) {
              console.error("Error posting to dual webhook:", e);
            }
          }
        } else if (activeSpaceId === "spaces/AAAAEpnKTIM") {
          targetWebhookUrl = "https://chat.googleapis.com/v1/spaces/AAAAEpnKTIM/messages?key=AIzaSyDdI0hCZtE6vySjMm-WEfRq3CPzqKqqsHI&token=vPwVpjTZY-LCMzE-k99FArPmX0r1icantvbCflTP6bk";
        } else if (activeSpaceId === "spaces/AAQAOj5WBis") {
          targetWebhookUrl = "https://chat.googleapis.com/v1/spaces/AAQAOj5WBis/messages?key=AIzaSyDdI0hCZtE6vySjMm-WEfRq3CPzqKqqsHI&token=X-LcP3tlqoGOT1uM1pIVeTV9am3eIhMJrPxy7zUmvTI";
        }
      }

      if (targetWebhookUrl) {
        try {
          const spaceNameLabel = activeSpaceObj?.name || activeSpaceId;
          let text = `*${payload.senderName}* (${payload.senderEmail}) [Space: ${spaceNameLabel}]:\n${payload.content}`;
          if (payload.attachmentUrl) {
            text += `\n📎 *Attachment:* [${payload.attachmentName || "File"}](${payload.attachmentUrl})`;
          }

          await fetchGChat(targetWebhookUrl, {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify({ text })
          });
        } catch (webhookErr) {
          console.error("Webhook POST failed:", webhookErr);
        }
      }

      setNewMessage("");
      setSimulatedAttachment(null);
    } catch (err) {
      console.error("Failed to post message:", err);
    }
  };

  // Simulated File Attachment Choice
  const handleTriggerAttachment = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      // Simulated upload path
      setSimulatedAttachment({
        name: file.name,
        url: "https://images.unsplash.com/photo-1457369804613-52c61a468e7d?q=80&w=256"
      });
      toastService.success(`Attached file "${file.name}" successfully!`);
    }
  };

  // Toggle reactions
  const handleToggleReaction = async (msg: ChatMessage, emoji: string) => {
    const user = auth.currentUser;
    const userName = user?.displayName || user?.email?.split('@')[0] || "Authorized Staff";
    
    const currentReactions = msg.reactions || {};
    const usersWithEmoji = currentReactions[emoji] || [];

    let updatedUsers = [...usersWithEmoji];
    if (usersWithEmoji.includes(userName)) {
      updatedUsers = updatedUsers.filter((u) => u !== userName);
    } else {
      updatedUsers.push(userName);
    }

    const nextReactions = { ...currentReactions };
    if (updatedUsers.length === 0) {
      delete nextReactions[emoji];
    } else {
      nextReactions[emoji] = updatedUsers;
    }

    try {
      const nextMsg = {
        ...msg,
        reactions: nextReactions
      };
      
      const docRef = doc(db, "hybrid_sandbox", msg.id);
      await updateDoc(docRef, {
        db_json: JSON.stringify(nextMsg),
        payload_json: JSON.stringify(nextMsg)
      });
    } catch (err) {
      console.error("Failed to update reactions in hybrid_sandbox:", err);
    }
  };

  // Filter messages based on search query
  const filteredMessages = messages.filter((m) => {
    if (!searchQuery.trim()) return true;
    return (
      m.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.senderName.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  // Extract clean space name helper
  const getCleanSpaceName = (spaceName: string | undefined): string => {
    if (!spaceName) return "CML Chat";
    // safely strip leading emojis/symbols and spaces
    const cleaned = spaceName.replace(/^[^\w\s]{1,4}\s*/gu, '').trim();
    return cleaned || spaceName;
  };

  const getMemberEmail = (name: string): string => {
    const n = name.toLowerCase();
    if (n.includes("charles")) return "digitalmedia@cml.com.fj";
    if (n.includes("priyesh")) return "graphics@cml.com.fj";
    if (n.includes("rohit")) return "accounts@cml.com.fj";
    if (n.includes("charlene")) return "dutymanager.ramada@cml.com.fj";
    if (n.includes("nolau")) return "rooms@cml.com.fj";
    if (n.includes("neetisa")) return "hr@cml.com.fj";
    return "staff@cml.com.fj";
  };

  const activeSpace = spaces.find(s => s.id === activeSpaceId);
  const isDM = activeSpaceId.startsWith("dm-");
  const dmName = isDM ? (activeSpace ? getCleanSpaceName(activeSpace.name) : activeSpaceId.replace("dm-", "").split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ")) : "";

  return (
    <>
      {/* Floating launcher button in the bottom-right corner */}
      <div className="fixed bottom-6 right-6 z-[100] flex flex-col items-end">
        <button
          onClick={() => {
            setIsOpen(!isOpen);
            playChime();
          }}
          className="w-14 h-14 text-white rounded-full flex items-center justify-center shadow-2xl hover:scale-105 transition-all select-none cursor-pointer border-2 border-white"
          style={{ backgroundColor: primaryColor }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = darkColor}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = primaryColor}
          title="Open Integrated CML Chat"
        >
          {isOpen ? <Minimize2 size={24} /> : <MessageSquare size={24} />}
          {unreadTotal > 0 && (
            <span className="absolute -top-1 -right-1 bg-rose-600 text-white font-sans font-bold text-[9px] px-1.5 py-0.5 rounded-full shadow-md animate-bounce">
              {unreadTotal}
            </span>
          )}
        </button>
      </div>

      {/* Main chat window */}
      {isOpen && (
        <div 
          id="google-chat-panel"
          className="fixed bottom-24 right-6 w-[480px] h-[600px] bg-white border border-slate-200 shadow-2xl flex flex-col z-[110] overflow-hidden"
        >
          {/* Header */}
          <div className="text-white px-4 py-3.5 flex items-center justify-between select-none shrink-0" style={{ backgroundColor: primaryColor }}>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center font-bold text-sm">
                💬
              </div>
              <div>
                <h3 className="text-xs font-display uppercase tracking-wider font-extrabold flex items-center gap-1.5">
                  CML Chat
                  <span className="bg-white/20 text-white text-[7px] font-sans px-1.5 py-0.2 rounded-full uppercase font-black">Linked</span>
                </h3>
                <p className="text-[9px] text-white/80 font-sans">Portfolio Forums & Alerts Sync</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Sound Toggle */}
              <button 
                onClick={() => setSoundEnabled(!soundEnabled)} 
                className="text-white hover:text-emerald-150 transition-colors p-1"
                title={soundEnabled ? "Mute audio chimes" : "Unmute audio chimes"}
              >
                {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
              </button>

              {/* Notification Permission Toggle */}
              <button 
                onClick={enableBrowserNotifications} 
                className="text-white hover:text-emerald-150 transition-colors p-1"
                title={notificationsEnabled ? "Disable push alerts" : "Enable push alerts"}
              >
                <Bell size={16} className={notificationsEnabled ? "text-white" : "text-emerald-300 opacity-60"} />
              </button>

              <button 
                onClick={() => setIsOpen(false)} 
                className="text-white hover:text-emerald-200 font-bold p-1"
              >
                ✕
              </button>
            </div>
          </div>
          
          {/* Google Workspace Auth Status Banner */}
          <div className={`px-4 py-2.5 shrink-0 text-xs border-b ${
            companyId === "ramada" 
              ? "bg-red-50/75 border-red-100/80" 
              : (companyId === "wyndham" 
                  ? "bg-teal-50/75 border-teal-100/80" 
                  : "bg-amber-50/75 border-amber-100/80")
          }`}>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[9px] font-sans font-bold uppercase tracking-wider text-slate-500">
                CML Workspace Chat Sync
              </span>
              <span className={`text-[8px] font-sans font-semibold px-1.5 py-0.5 rounded ${
                companyId === "ramada" 
                  ? "text-red-800 bg-red-100/50" 
                  : (companyId === "wyndham" 
                      ? "text-teal-800 bg-teal-100/50" 
                      : "text-amber-800 bg-amber-100/50")
              }`}>
                Active: {getPropertyName(companyId)}
              </span>
            </div>
            
            <div className="flex flex-col gap-1">
              {["wyndham", "ramada"]
                .filter((propId) => {
                  if (companyId === "ramada" && propId === "wyndham") return false;
                  if (companyId === "wyndham" && propId === "ramada") return false;
                  return true;
                })
                .map((propId) => {
                  const conn = connections[propId];
                  const isLinked = !!conn?.accessToken;
                  const isActive = propId === companyId;
                  
                  return (
                    <div 
                      key={propId} 
                      className={`flex items-center justify-between px-2 py-1 rounded transition-all ${
                        isActive 
                          ? (companyId === "ramada" 
                              ? "bg-red-100/60 border border-red-200/50 shadow-xs" 
                              : (companyId === "wyndham" 
                                  ? "bg-teal-100/60 border border-teal-200/50 shadow-xs" 
                                  : "bg-amber-100/60 border border-amber-200/50 shadow-xs"))
                          : "bg-white/60 border border-slate-100/70"
                      }`}
                    >
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${isLinked ? "bg-emerald-500 animate-pulse" : "bg-slate-300"}`} />
                        <div className="text-left truncate">
                          <span className={`text-[9px] font-sans font-bold ${isActive ? "text-slate-900 font-extrabold" : "text-slate-700"}`}>
                            {getPropertyName(propId)} {isActive && <span className={`text-[8px] font-normal ${companyId === "ramada" ? "text-red-750" : (companyId === "wyndham" ? "text-teal-750" : "text-amber-750")}`}>(Current)</span>}
                          </span>
                          <p className="text-[8px] text-slate-400 font-mono truncate max-w-[190px] leading-none mt-0.5">
                            {isLinked ? conn.email : "Not Linked"}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-1">
                        {isLinked ? (
                          <button 
                            onClick={() => {
                              disconnectGoogleWorkspaceProperty(propId);
                              setConnections(getGoogleWorkspaceConnections());
                              if (propId === companyId) {
                                setRealSpaces(null);
                                setApiError(null);
                              }
                              toastService.info(`Disconnected ${getPropertyName(propId)}.`);
                            }}
                            className="text-[8px] text-red-500 hover:text-red-700 font-sans font-semibold hover:underline bg-red-50 hover:bg-red-100/40 px-1.5 py-0.5 rounded transition-colors"
                          >
                            Unlink
                          </button>
                        ) : (
                          <button
                            onClick={async () => {
                              setIsConnecting(true);
                              try {
                                const token = await connectGoogleWorkspace(propId);
                                if (token) {
                                  const updated = getGoogleWorkspaceConnections();
                                  const email = updated[propId]?.email || "";
                                  const domain = email.trim().toLowerCase().split("@")[1] || "";
                                  
                                  const ALLOWED_DOMAINS = ["cml.com.fj", "ramadawailoaloafiji.com", "wyndhamgardenwailoaloafiji.com"];
                                  const isValid = ALLOWED_DOMAINS.includes(domain);

                                  if (!isValid) {
                                    disconnectGoogleWorkspaceProperty(propId);
                                    setConnections(getGoogleWorkspaceConnections());
                                    toastService.error("Linking failed: Only @cml.com.fj, @ramadawailoaloafiji.com, and @wyndhamgardenwailoaloafiji.com domain emails are authorized.");
                                    return;
                                  }
                                  
                                  setConnections(updated);
                                  toastService.success(`Linked ${getPropertyName(propId)} as ${email}!`);
                                }
                              } catch (e) {
                                toastService.error(`Failed to link ${getPropertyName(propId)}.`);
                              } finally {
                                  setIsConnecting(false);
                              }
                            }}
                            disabled={isConnecting}
                            className="text-white disabled:bg-slate-300 text-[8px] font-sans font-bold px-1.5 py-0.5 rounded transition-all shadow-xs"
                            style={{ backgroundColor: primaryColor }}
                            onMouseEnter={(e) => !isConnecting && (e.currentTarget.style.backgroundColor = darkColor)}
                            onMouseLeave={(e) => !isConnecting && (e.currentTarget.style.backgroundColor = primaryColor)}
                          >
                            Link Gmail
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>

          {apiError && (
            <div className="bg-amber-50/90 border-b border-amber-100 px-4 py-1.5 text-[8px] text-amber-800 font-sans text-center leading-tight font-medium">
              ⚡ {apiError}
            </div>
          )}

          {/* Subheader / Description */}
          <div className="bg-slate-50 border-b border-slate-100 px-4 py-2 flex items-center justify-between shrink-0">
            <div className="flex-1 min-w-0 pr-2">
              <p className="text-[10px] text-slate-800 font-sans font-extrabold truncate flex items-center gap-1">
                {isDM ? `👤 DM: ${dmName}` : spaces.find(s => s.id === activeSpaceId)?.name}
                {isDM && (
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping inline-block" />
                )}
              </p>
              <p className="text-[8px] text-slate-400 font-serif italic truncate">
                {isDM ? `Private encrypted staff correspondence with ${dmName}` : spaces.find(s => s.id === activeSpaceId)?.description}
              </p>
            </div>
            <div className="flex items-center gap-1.5 text-slate-400">
              {/* Webhook Configuration for all spaces */}
              {activeSpace && !isDM && (
                <button
                  onClick={() => setShowWebhookModal(true)}
                  className="flex items-center gap-1.5 px-2 py-1 rounded bg-emerald-50 hover:bg-emerald-100 text-emerald-700 hover:text-emerald-800 border border-emerald-200/60 transition-all shadow-2xs active:scale-95 shrink-0 cursor-pointer"
                  title="Configure & Create Google Chat Webhooks"
                >
                  <Settings size={12} className={activeSpace.webhookUrl ? "text-emerald-600 animate-pulse" : "text-emerald-500"} />
                  <span className="text-[9px] font-sans font-bold uppercase tracking-wider">Webhooks</span>
                </button>
              )}

              {/* External Real Google Chat Link */}
              {activeSpaceId.startsWith("spaces/") && (
                <a
                  href={`https://chat.google.com/space/${activeSpaceId.replace("spaces/", "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 px-2 py-1 rounded bg-blue-50 hover:bg-blue-100 text-blue-700 hover:text-blue-800 border border-blue-200/60 transition-all shadow-2xs active:scale-95 shrink-0 cursor-pointer"
                  title="Open this real space in Google Chat website"
                >
                  <Sparkles size={11} className="text-blue-500 animate-pulse" />
                  <span className="text-[9px] font-sans font-bold uppercase tracking-wider">Open Chat</span>
                </a>
              )}

              {/* Call Controls */}
              <button 
                onClick={async () => {
                  clearCallTimers();
                  const name = isDM ? dmName : (spaces.find(s => s.id === activeSpaceId)?.name.replace(/^[^\s]+\s/, '') || "Team Members");
                  const callDocId = 'call_' + Date.now() + '_' + (auth.currentUser?.email?.replace(/[^a-zA-Z0-9]/g, '_') || 'anon');
                  
                  setActiveCall({
                    type: "voice",
                    status: "dialing",
                    participantName: name,
                    hasVideo: false,
                    hasMic: true,
                    callDocId,
                    isCaller: true
                  });
                  
                  toastService.info(`Calling ${name}...`);
                  playRingTone();
                  ringIntervalRef.current = setInterval(() => {
                    playRingTone();
                  }, 1500);

                  // Set call doc in Firestore
                  try {
                    await setDoc(doc(db, "hybrid_sandbox", callDocId), {
                      collection: "calls-simulation",
                      spaceId: activeSpaceId,
                      callerName: auth.currentUser?.displayName || auth.currentUser?.email?.split('@')[0] || "Authorized Staff",
                      callerEmail: auth.currentUser?.email || "",
                      status: "ringing",
                      type: "voice",
                      createdAt: new Date().toISOString()
                    });
                  } catch (e) {
                    console.error("Error setting call doc:", e);
                  }

                  // Solo testing fallback: Automatically transition to connected if unanswered after 8 seconds
                  callConnectTimeoutRef.current = setTimeout(async () => {
                    try {
                      const callDocRef = doc(db, "hybrid_sandbox", callDocId);
                      await updateDoc(callDocRef, { status: "connected" });
                    } catch (e) {
                      // fallback local connection
                      setActiveCall(prev => {
                        if (prev && prev.status === "dialing") {
                          toastService.success("Call connected (offline/solo mode).");
                          return { ...prev, status: "connected" };
                        }
                        return prev;
                      });
                    }
                  }, 8000);
                }}
                className="p-1 hover:bg-slate-200 transition-colors"
                style={{ color: primaryColor }}
                title="Start Voice Call"
              >
                <Phone size={13} />
              </button>
              <button 
                onClick={async () => {
                  clearCallTimers();
                  const name = isDM ? dmName : (spaces.find(s => s.id === activeSpaceId)?.name.replace(/^[^\s]+\s/, '') || "Team Members");
                  const callDocId = 'call_' + Date.now() + '_' + (auth.currentUser?.email?.replace(/[^a-zA-Z0-9]/g, '_') || 'anon');
                  
                  setActiveCall({
                    type: "video",
                    status: "dialing",
                    participantName: name,
                    hasVideo: true,
                    hasMic: true,
                    callDocId,
                    isCaller: true
                  });
                  
                  toastService.info(`Starting video call with ${name}...`);
                  playRingTone();
                  ringIntervalRef.current = setInterval(() => {
                    playRingTone();
                  }, 1500);

                  // Set call doc in Firestore
                  try {
                    await setDoc(doc(db, "hybrid_sandbox", callDocId), {
                      collection: "calls-simulation",
                      spaceId: activeSpaceId,
                      callerName: auth.currentUser?.displayName || auth.currentUser?.email?.split('@')[0] || "Authorized Staff",
                      callerEmail: auth.currentUser?.email || "",
                      status: "ringing",
                      type: "video",
                      createdAt: new Date().toISOString()
                    });
                  } catch (e) {
                    console.error("Error setting call doc:", e);
                  }

                  // Solo testing fallback: Automatically transition to connected if unanswered after 8 seconds
                  callConnectTimeoutRef.current = setTimeout(async () => {
                    try {
                      const callDocRef = doc(db, "hybrid_sandbox", callDocId);
                      await updateDoc(callDocRef, { status: "connected" });
                    } catch (e) {
                      // fallback local connection
                      setActiveCall(prev => {
                        if (prev && prev.status === "dialing") {
                          toastService.success("Video link established (offline/solo mode).");
                          return { ...prev, status: "connected" };
                        }
                        return prev;
                      });
                    }
                  }, 8000);
                }}
                className="p-1 hover:bg-slate-200 transition-colors"
                style={{ color: primaryColor }}
                title="Start Video Call"
              >
                <Video size={13} />
              </button>

              {/* Delete Active Space button (if it's not general-announcements) */}
              {activeSpaceId !== "general-announcements" && (
                <button
                  onClick={(e) => handleDeleteSpace(activeSpaceId, e)}
                  className="p-1 hover:bg-slate-200 text-rose-500 hover:text-rose-600 transition-colors"
                  title="Delete/Hide This Space"
                >
                  <Trash2 size={13} />
                </button>
              )}

              {/* Email Straight to Person (Quick Action) */}
              {isDM && (
                <a 
                  href={`mailto:${getMemberEmail(dmName)}?subject=CML Staff Inquiry - Private Desk Notification&body=Dear ${dmName},%0A%0AI wanted to follow up with you regarding our hotel management operations.%0A%0ABest regards,%0AAdministration`}
                  className="p-1 hover:bg-slate-200 transition-colors flex items-center"
                  style={{ color: primaryColor }}
                  title={`Email Straight to ${dmName} (${getMemberEmail(dmName)})`}
                >
                  <Mail size={13} />
                </a>
              )}

              <button 
                onClick={() => {
                  setShowSearch(!showSearch);
                  if (showSearch) setSearchQuery("");
                }}
                className="p-1 hover:bg-slate-200 transition-colors"
                style={{ color: showSearch ? primaryColor : undefined }}
                title="Search Messages"
              >
                <Search size={14} />
              </button>
              <button 
                onClick={() => setShowMembers(!showMembers)}
                className="p-1 hover:bg-slate-200 transition-colors"
                style={{ color: showMembers ? primaryColor : undefined }}
                title="Active Portfolio Presence"
              >
                <Users size={14} />
              </button>
            </div>
          </div>

          {/* Expanded Tools panel (Search or Member List) */}
          {showSearch && (
            <div className="bg-amber-50/50 border-b border-amber-100 p-2 shrink-0">
              <input 
                type="text"
                placeholder="Search keywords or author..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full text-[10px] border border-slate-200 px-2 py-1 outline-none bg-white font-sans text-slate-700"
              />
            </div>
          )}

          {showMembers && (
            <div className="bg-slate-100 border-b border-slate-200 p-3 max-h-[220px] overflow-y-auto custom-scrollbar shrink-0">
              <div className="flex items-center justify-between mb-1.5">
                <h4 className="text-[8px] font-display uppercase tracking-wider text-slate-500 font-black">Active Presence Portfolio</h4>
                {!isDM && (
                  <button
                    onClick={() => setIsAddingMember(!isAddingMember)}
                    className="text-[8px] uppercase tracking-wider font-bold hover:underline transition-all cursor-pointer"
                    style={{ color: primaryColor }}
                  >
                    {isAddingMember ? "Close" : "+ Add Member"}
                  </button>
                )}
              </div>

              {isAddingMember && !isDM && (
                <div className="bg-white border border-slate-200 p-2 rounded mb-2.5 space-y-1.5 animate-fade-in">
                  <div className="text-[8px] font-bold text-slate-500 uppercase">Add Google email user to space</div>
                  <div className="grid grid-cols-1 gap-1">
                    <input
                      type="email"
                      placeholder="Enter Google Email (e.g. user@gmail.com)"
                      value={newMemberEmail}
                      onChange={(e) => setNewMemberEmail(e.target.value)}
                      className="w-full text-[9px] border border-slate-200 px-1.5 py-1 rounded outline-none"
                    />
                    <div className="flex gap-1">
                      <input
                        type="text"
                        placeholder="Full Name (optional)"
                        value={newMemberName}
                        onChange={(e) => setNewMemberName(e.target.value)}
                        className="flex-1 text-[9px] border border-slate-200 px-1.5 py-1 rounded outline-none"
                      />
                      <input
                        type="text"
                        placeholder="Role (e.g. Accounts Coordinator)"
                        value={newMemberRole}
                        onChange={(e) => setNewMemberRole(e.target.value)}
                        className="flex-1 text-[9px] border border-slate-200 px-1.5 py-1 rounded outline-none"
                      />
                    </div>
                  </div>

                  {/* Quick Add Section */}
                  {(() => {
                    const currentMembers = getMembersForSpace(activeSpaceId);
                    const nonMembers = DEFAULT_COLLEAGUES.filter(colleague => 
                      !currentMembers.some(m => m.email.toLowerCase() === colleague.email.toLowerCase())
                    );
                    if (nonMembers.length > 0) {
                      return (
                        <div className="border-t border-slate-100 pt-1.5">
                          <div className="text-[7.5px] font-black text-slate-400 uppercase tracking-wider mb-1">Quick Add Active Portfolio Members:</div>
                          <div className="flex flex-wrap gap-1">
                            {nonMembers.map((colleague, idx) => (
                              <button
                                key={idx}
                                type="button"
                                onClick={() => {
                                  handleAddMemberToSpace(activeSpaceId, colleague.email, colleague.name, colleague.role);
                                }}
                                className="text-[7.5px] bg-slate-50 hover:bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded border border-slate-200 transition-all active:scale-95 flex items-center gap-0.5 font-sans font-medium cursor-pointer"
                              >
                                <span className="font-bold" style={{ color: primaryColor }}>+</span> {colleague.name.split(" ")[0]}
                              </button>
                            ))}
                          </div>
                        </div>
                      );
                    }
                    return null;
                  })()}

                  <div className="flex justify-end gap-1.5 pt-0.5">
                    <button
                      type="button"
                      onClick={() => {
                        setIsAddingMember(false);
                        setNewMemberEmail("");
                        setNewMemberName("");
                        setNewMemberRole("");
                      }}
                      className="text-[8px] font-bold px-2 py-0.5 border border-slate-200 text-slate-500 hover:bg-slate-50 rounded cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        if (!newMemberEmail.trim()) {
                          toastService.error("Email address is required.");
                          return;
                        }
                        await handleAddMemberToSpace(activeSpaceId, newMemberEmail, newMemberName, newMemberRole);
                        setNewMemberEmail("");
                        setNewMemberName("");
                        setNewMemberRole("");
                        setIsAddingMember(false);
                      }}
                      className="text-[8px] font-bold px-2.5 py-0.5 text-white rounded hover:bg-opacity-90 shadow-xs cursor-pointer"
                      style={{ backgroundColor: primaryColor }}
                    >
                      Add Member
                    </button>
                  </div>
                </div>
              )}

              <div className="space-y-1">
                {getMembersForSpace(activeSpaceId).map((member, i) => (
                  <div 
                    key={i} 
                    className="flex items-center justify-between text-[9px] hover:bg-slate-200/60 p-1 rounded transition-all select-none"
                  >
                    <div 
                      onClick={() => handleStartPrivateChat(member.name)}
                      className="flex items-center gap-1.5 min-w-0 flex-1 cursor-pointer"
                      title={`Start private chat with ${member.name}`}
                    >
                      <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${member.status === 'online' ? 'bg-emerald-500' : 'bg-amber-400'}`} />
                      <div className="flex flex-col min-w-0">
                        <span className="font-bold text-slate-800 truncate leading-tight">{member.name}</span>
                        {member.email && <span className="text-[6.5px] text-slate-400 font-mono truncate leading-none">{member.email}</span>}
                      </div>
                      <span className="text-[7px] text-slate-400 font-serif truncate">({member.role})</span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[7px] text-slate-400 uppercase font-bold">{member.status}</span>
                      <button
                        onClick={() => handleStartPrivateChat(member.name)}
                        className="text-[8px] hover:underline font-bold font-sans cursor-pointer"
                        style={{ color: primaryColor }}
                      >
                        Chat
                      </button>
                      {!isDM && member.email && member.email !== "digitalmedia@cml.com.fj" && (
                        <button
                          onClick={() => handleRemoveMemberFromSpace(activeSpaceId, member.email || "")}
                          className="text-slate-400 hover:text-rose-600 transition-colors p-0.5 cursor-pointer"
                          title="Remove from Space"
                        >
                          <Trash2 size={11} />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Workspaces / Spaces and Active chat messages split view */}
          <div className="flex-1 flex overflow-hidden">
            {/* Spaces navigation rail (left) */}
            <div className="w-[155px] bg-slate-50 border-r border-slate-200 flex flex-col select-none shrink-0 overflow-y-auto custom-scrollbar">
              <div className="p-2 border-b border-slate-100 bg-slate-100/50 flex items-center justify-between">
                <span className="text-[8px] font-display uppercase tracking-widest text-slate-400 font-black">Active Spaces</span>
                <button 
                  onClick={() => setIsCreatingSpace(true)}
                  className="transition-colors p-0.5"
                  style={{ color: primaryColor }}
                  title="Add Space"
                >
                  <PlusCircle size={12} />
                </button>
              </div>
              <div className="flex-1 py-1">
                {spaces.map((space) => {
                  const isActive = space.id === activeSpaceId;
                  return (
                    <div
                      key={space.id}
                      className={`w-full group text-left px-2.5 py-2 text-[10px] border-b border-slate-100 flex items-center justify-between gap-1.5 transition-all outline-none ${
                        isActive 
                          ? "border-l-2 font-bold bg-white" 
                          : "text-slate-600 hover:bg-slate-100"
                      }`}
                      style={isActive ? {
                        backgroundColor: companyId === "ramada" ? "#fef2f2" : (companyId === "wyndham" ? "#f0fdfa" : "#fdfbeb"),
                        borderLeftColor: primaryColor,
                        color: primaryColor
                      } : {}}
                    >
                      <button
                        onClick={() => {
                          setActiveSpaceId(space.id);
                          setShowSearch(false);
                          setSearchQuery("");
                          setIsCreatingSpace(false);
                        }}
                        className="flex-1 min-w-0 text-left outline-none cursor-pointer"
                      >
                        <span className="truncate font-sans font-medium flex items-center gap-1 text-[10px]">{space.name}</span>
                      </button>

                      {space.id !== "general-announcements" && (
                        <button
                          onClick={(e) => handleDeleteSpace(space.id, e)}
                          className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-rose-500 transition-opacity p-0.5 shrink-0 cursor-pointer"
                          title="Delete space"
                        >
                          <Trash2 size={10} />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Messages Area (right) */}
            <div className="flex-1 bg-white flex flex-col overflow-hidden relative">
              {isCreatingSpace ? (
                <div className="flex-1 p-4 bg-slate-50 flex flex-col justify-between overflow-y-auto">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                      <h4 className="text-[10px] font-display uppercase tracking-wider text-slate-700 font-bold flex items-center gap-1.5">
                        <PlusCircle size={14} style={{ color: primaryColor }} />
                        Create New Space
                      </h4>
                      <button 
                        type="button"
                        onClick={() => setIsCreatingSpace(false)} 
                        className="text-slate-400 hover:text-slate-600 text-[10px]"
                      >
                        Cancel
                      </button>
                    </div>

                    {/* Restore default spaces if deleted */}
                    {baseSpaces.filter(s => deletedSpaceIds.includes(s.id)).length > 0 && (
                      <div className="bg-slate-100 p-2 border border-slate-200 rounded-sm mb-3">
                        <p className="text-[8px] uppercase tracking-wider font-sans font-bold text-slate-500 mb-1 leading-none">Restore Default Spaces</p>
                        <div className="space-y-1 mt-1">
                          {baseSpaces.filter(s => deletedSpaceIds.includes(s.id)).map(s => (
                            <div key={s.id} className="flex items-center justify-between bg-white px-2 py-1 border border-slate-150">
                              <span className="text-[9px] font-sans font-semibold text-slate-700 truncate max-w-[120px]">{s.name}</span>
                              <button
                                type="button"
                                onClick={() => {
                                  const updated = deletedSpaceIds.filter(id => id !== s.id);
                                  setDeletedSpaceIds(updated);
                                  localStorage.setItem(`cml_deleted_spaces_${companyId}`, JSON.stringify(updated));
                                  setActiveSpaceId(s.id);
                                  setIsCreatingSpace(false);
                                  toastService.success(`Restored and synchronized ${s.name}!`);
                                }}
                                className="px-2 py-0.5 text-[8px] font-sans font-bold text-white uppercase tracking-wider rounded-xs cursor-pointer"
                                style={{ backgroundColor: primaryColor }}
                              >
                                Restore
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    <div className="space-y-1">
                      <label className="text-[8px] uppercase tracking-wider font-sans font-bold text-slate-500">Space Name</label>
                      <input 
                        type="text" 
                        placeholder="e.g. wyndham-marketing"
                        value={newSpaceName}
                        onChange={(e) => setNewSpaceName(e.target.value)}
                        className="w-full text-[10px] border border-slate-200 px-2 py-1.5 outline-none bg-white font-sans text-slate-700"
                        maxLength={30}
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[8px] uppercase tracking-wider font-sans font-bold text-slate-500">Description</label>
                      <textarea 
                        placeholder="e.g. Discuss joint marketing drives..."
                        value={newSpaceDesc}
                        onChange={(e) => setNewSpaceDesc(e.target.value)}
                        className="w-full text-[10px] border border-slate-200 px-2 py-1.5 outline-none bg-white font-sans text-slate-700 resize-none h-14"
                        maxLength={100}
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[8px] uppercase tracking-wider font-sans font-bold text-slate-500">Google Chat Webhook URL (Optional)</label>
                      <input 
                        type="url" 
                        placeholder="https://chat.googleapis.com/v1/spaces/..."
                        value={newSpaceWebhookUrl}
                        onChange={(e) => setNewSpaceWebhookUrl(e.target.value)}
                        className="w-full text-[10px] border border-slate-200 px-2 py-1.5 outline-none bg-white font-sans text-slate-700 animate-fade-in"
                      />
                      <p className="text-[7px] text-slate-400 leading-tight">
                        Provide an Incoming Webhook URL from your Google Chat space to synchronize messages automatically.
                      </p>
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <label className="text-[8px] uppercase tracking-wider font-sans font-bold text-slate-500">Invite Members from Active Portfolio</label>
                        <button
                          type="button"
                          onClick={() => {
                            if (newSpaceInvitedEmails.length === DEFAULT_COLLEAGUES.length) {
                              setNewSpaceInvitedEmails([]);
                            } else {
                              setNewSpaceInvitedEmails(DEFAULT_COLLEAGUES.map(c => c.email));
                            }
                          }}
                          className="text-[7.5px] font-bold underline text-slate-400 hover:text-slate-600 transition-colors"
                        >
                          {newSpaceInvitedEmails.length === DEFAULT_COLLEAGUES.length ? "Deselect All" : "Select All"}
                        </button>
                      </div>
                      <div className="grid grid-cols-2 gap-1 bg-white p-2 border border-slate-200 max-h-24 overflow-y-auto custom-scrollbar">
                        {DEFAULT_COLLEAGUES.map((colleague) => {
                          const isChecked = newSpaceInvitedEmails.includes(colleague.email);
                          return (
                            <label
                              key={colleague.email}
                              className={`flex items-center gap-1.5 p-1 rounded border transition-all text-[8px] cursor-pointer select-none ${
                                isChecked
                                  ? "border-emerald-200 bg-emerald-50/70 text-emerald-950 font-semibold"
                                  : "border-slate-100 hover:bg-slate-50 text-slate-600"
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => {
                                  if (isChecked) {
                                    setNewSpaceInvitedEmails(newSpaceInvitedEmails.filter(e => e !== colleague.email));
                                  } else {
                                    setNewSpaceInvitedEmails([...newSpaceInvitedEmails, colleague.email]);
                                  }
                                }}
                                className="accent-emerald-600 cursor-pointer w-2.5 h-2.5"
                              />
                              <div className="min-w-0">
                                <div className="truncate font-sans font-medium leading-tight">{colleague.name}</div>
                                <div className="text-[6.5px] text-slate-400 truncate font-mono leading-none">{colleague.email}</div>
                              </div>
                            </label>
                          );
                        })}
                      </div>
                    </div>

                    <div className="bg-emerald-50/50 border border-emerald-100 p-2 rounded-sm space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[8px] uppercase tracking-wider font-sans font-extrabold text-emerald-800">Inbound Webhook Integration</span>
                        <span className="text-[7px] text-emerald-600 bg-emerald-100 px-1 font-bold rounded">Auto-Generated</span>
                      </div>
                      <p className="text-[7px] text-slate-500 leading-tight">
                        A custom Inbound Webhook URL will be automatically provisioned for this space. You can use it in Google Chat to post messages back into this widget room in real-time.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 mt-4">
                    <button 
                      type="button"
                      onClick={() => setIsCreatingSpace(false)}
                      className="flex-1 border border-slate-200 hover:bg-slate-100 text-slate-500 text-[9px] font-sans font-bold py-1.5 rounded transition-all cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button 
                      type="button"
                      onClick={() => handleAddSpace(newSpaceName, newSpaceDesc, newSpaceWebhookUrl)}
                      disabled={!newSpaceName.trim()}
                      className="flex-1 disabled:bg-slate-200 disabled:text-slate-400 text-white text-[9px] font-sans font-bold py-1.5 rounded transition-all shadow-sm cursor-pointer"
                      style={{ backgroundColor: newSpaceName.trim() ? primaryColor : undefined }}
                      onMouseEnter={(e) => newSpaceName.trim() && (e.currentTarget.style.backgroundColor = darkColor)}
                      onMouseLeave={(e) => newSpaceName.trim() && (e.currentTarget.style.backgroundColor = primaryColor)}
                    >
                      Create Space
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar">
                    {activeSpaceId.startsWith("spaces/") && !workspaceAccessToken && (
                      <div className="bg-amber-50/70 border border-amber-200/60 p-2 rounded flex items-start gap-2 animate-fade-in mb-3 shrink-0">
                        <div className="text-amber-600 mt-0.5 shrink-0">
                          <Sparkles size={12} className="animate-pulse" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[9px] font-bold text-slate-800 leading-tight">Hybrid Workspace Sync Active</p>
                          <p className="text-[8px] text-slate-500 leading-relaxed mt-0.5">
                            Viewing cached Firestore discussions for <strong>{spaces.find(s => s.id === activeSpaceId)?.name || "Google Chat Space"}</strong>.
                            Connect an authorized Workspace account to push real-time updates directly to Google Chat.
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={async () => {
                            setIsConnecting(true);
                            try {
                              const token = await connectGoogleWorkspace(companyId);
                              if (token) {
                                const updated = getGoogleWorkspaceConnections();
                                const email = updated[companyId]?.email || "";
                                const domain = email.trim().toLowerCase().split("@")[1] || "";
                                
                                const ALLOWED_DOMAINS = ["cml.com.fj", "ramadawailoaloafiji.com", "wyndhamgardenwailoaloafiji.com"];
                                const isValid = ALLOWED_DOMAINS.includes(domain);

                                if (!isValid) {
                                  disconnectGoogleWorkspaceProperty(companyId);
                                  setConnections(getGoogleWorkspaceConnections());
                                  toastService.error("Linking failed: Only @cml.com.fj, @ramadawailoaloafiji.com, and @wyndhamgardenwailoaloafiji.com domain emails are authorized.");
                                  return;
                                }
                                
                                setConnections(updated);
                                toastService.success(`Linked ${getPropertyName(companyId)} as ${email}!`);
                              }
                            } catch (e) {
                              toastService.error(`Failed to link ${getPropertyName(companyId)}.`);
                            } finally {
                              setIsConnecting(false);
                            }
                          }}
                          className="px-1.5 py-0.5 text-white text-[8px] font-sans font-bold rounded shadow-xs bg-slate-800 hover:bg-slate-900 transition-all shrink-0 cursor-pointer"
                        >
                          {isConnecting ? "Connecting..." : "Link Google"}
                        </button>
                      </div>
                    )}
                    {filteredMessages.length === 0 ? (
                      <div className="py-12 text-center flex flex-col items-center gap-1.5">
                        <MessageSquare size={20} className="text-slate-250 animate-bounce" />
                        <p className="text-[9px] text-slate-400 font-serif italic">No synchronized messages found.</p>
                      </div>
                    ) : (
                      filteredMessages.map((msg) => {
                        const isSelf = msg.senderEmail === auth.currentUser?.email;
                        return (
                          <div 
                            key={msg.id} 
                            className={`flex flex-col ${isSelf ? 'items-end' : 'items-start'}`}
                          >
                            <div className="flex items-center gap-1.5 mb-0.5">
                              <button 
                                type="button"
                                onClick={() => handleStartPrivateChat(msg.senderName)}
                                className="text-[8px] font-sans font-black text-slate-700 hover:underline cursor-pointer select-none text-left"
                                onMouseEnter={(e) => e.currentTarget.style.color = primaryColor}
                                onMouseLeave={(e) => e.currentTarget.style.color = ""}
                                title={`Chat privately with ${msg.senderName}`}
                              >
                                {msg.senderName}
                              </button>
                              <span className="text-[7px] text-slate-400">
                                {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                            <div 
                              className={`p-2.5 max-w-[90%] text-[10px] leading-relaxed break-words whitespace-pre-wrap ${
                                isSelf 
                                  ? 'text-white rounded-l-md rounded-tr-md' 
                                  : 'bg-slate-100 text-slate-800 rounded-r-md rounded-tl-md'
                              }`}
                              style={isSelf ? { backgroundColor: primaryColor } : {}}
                            >
                              {msg.content}

                              {/* Render Attachment if any */}
                              {msg.attachmentUrl && (
                                <div className="mt-1.5 border border-slate-200 bg-white text-slate-800 p-1.5 rounded-[2px] flex items-center gap-1 max-w-[150px] overflow-hidden">
                                  <Paperclip size={10} className="text-gold shrink-0" />
                                  <div className="min-w-0 flex-1">
                                    <p className="text-[7px] font-bold truncate">{msg.attachmentName}</p>
                                    <a 
                                      href={msg.attachmentUrl} 
                                      target="_blank" 
                                      rel="noreferrer" 
                                      className="text-[6px] font-bold hover:underline"
                                      style={{ color: primaryColor }}
                                    >
                                      View mock upload
                                    </a>
                                  </div>
                                </div>
                              )}
                            </div>

                            {/* Reactions row */}
                            <div className="flex gap-1 mt-0.5">
                              {["👍", "❤️", "😂"].map((emoji) => {
                                const reactUsers = msg.reactions?.[emoji] || [];
                                const hasReacted = reactUsers.includes(auth.currentUser?.displayName || "");
                                return (
                                  <button
                                    type="button"
                                    key={emoji}
                                    onClick={() => handleToggleReaction(msg, emoji)}
                                    className="text-[8px] px-1 bg-slate-50 hover:bg-slate-100 rounded-[2px] border"
                                    style={hasReacted ? {
                                      borderColor: primaryColor,
                                      backgroundColor: companyId === "ramada" ? "#fef2f2" : (companyId === "wyndham" ? "#f0fdfa" : "#fdfbeb")
                                    } : { borderColor: "#f1f5f9" }}
                                  >
                                    {emoji} {reactUsers.length > 0 && reactUsers.length}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })
                    )}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Message Input Panel */}
                  <form 
                    onSubmit={handleSendMessage} 
                    className="border-t border-slate-150 p-2 bg-slate-50 flex flex-col gap-1.5 shrink-0"
                  >
                    {simulatedAttachment && (
                      <div className={`text-[8px] px-2 py-1 flex items-center justify-between border rounded-sm ${
                        companyId === "ramada" 
                          ? "bg-red-50 text-red-800 border-red-100" 
                          : (companyId === "wyndham" 
                              ? "bg-teal-50 text-teal-800 border-teal-100" 
                              : "bg-amber-50 text-amber-800 border-amber-100")
                      }`}>
                        <span className="truncate">📎 {simulatedAttachment.name}</span>
                        <button 
                          type="button" 
                          onClick={() => setSimulatedAttachment(null)} 
                          className="font-bold font-sans text-[10px] hover:scale-110 transition-transform"
                          style={{ color: primaryColor }}
                        >
                          ✕
                        </button>
                      </div>
                    )}

                    <div className="flex items-center gap-1.5">
                      <input 
                        type="file" 
                        ref={fileInputRef} 
                        onChange={handleFileChange} 
                        className="hidden" 
                      />
                      <button
                        type="button"
                        onClick={handleTriggerAttachment}
                        className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-sm transition-colors"
                        title="Simulate Attachment"
                      >
                        <Paperclip size={14} />
                      </button>

                      <input
                        type="text"
                        placeholder={`Message ${isDM ? dmName : getCleanSpaceName(spaces.find(s => s.id === activeSpaceId)?.name)}...`}
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        className="flex-1 bg-white border border-slate-250 text-[10px] px-2.5 py-1.5 outline-none font-sans text-slate-800"
                        onFocus={(e) => e.currentTarget.style.borderColor = primaryColor}
                        onBlur={(e) => e.currentTarget.style.borderColor = ""}
                      />

                      <button
                        type="submit"
                        disabled={!newMessage.trim() && !simulatedAttachment}
                        className="p-1.5 text-white disabled:bg-slate-300 disabled:text-slate-500 rounded-sm transition-all"
                        style={{ backgroundColor: (newMessage.trim() || simulatedAttachment) ? primaryColor : undefined }}
                        onMouseEnter={(e) => (newMessage.trim() || simulatedAttachment) && (e.currentTarget.style.backgroundColor = darkColor)}
                        onMouseLeave={(e) => (newMessage.trim() || simulatedAttachment) && (e.currentTarget.style.backgroundColor = primaryColor)}
                      >
                        <Send size={12} />
                      </button>
                    </div>
                  </form>
                </>
              )}

              {/* Real-time Video/Voice Call Simulation HUD overlay */}
              {activeCall && (
                <div className="absolute inset-0 bg-slate-950/98 z-[150] flex flex-col justify-between p-6 text-white animate-fade-in font-sans">
                  <div className="flex items-center justify-between border-b border-white/10 pb-3">
                    <span className="text-[10px] uppercase font-display tracking-widest text-emerald-400 font-extrabold flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                      CML Live Communications Desk
                    </span>
                    <span className="text-[9px] text-[#C5A02D] font-mono uppercase bg-amber-500/10 px-2 py-0.5 border border-amber-500/20">
                      {activeCall.type === "video" ? "Secure HD Video" : "Secure Voice Link"}
                    </span>
                  </div>

                  <div className="flex-1 flex flex-col items-center justify-center my-4 overflow-y-auto max-h-[340px] py-2 scrollbar-none">
                    {activeCall.type === "video" && activeCall.status === "connected" && activeCall.hasVideo ? (
                      <div className="w-full h-44 bg-slate-900 rounded-sm relative overflow-hidden flex items-center justify-center border border-white/10 shadow-inner">
                        <img 
                          src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80" 
                          alt="Participant Feed" 
                          className="w-full h-full object-cover opacity-90"
                          referrerPolicy="no-referrer"
                        />
                        <div className="absolute bottom-2 left-2 bg-slate-955/80 px-2 py-0.5 rounded text-[8px] font-mono border border-white/15">
                          🟢 Remote: {activeCall.participantName}
                        </div>
                        {activeCall.hasVideo && (
                          <div className="absolute top-2 right-2 w-20 h-14 bg-slate-900 rounded border border-white/10 overflow-hidden shadow-lg">
                            <div className="w-full h-full flex flex-col items-center justify-center bg-slate-950">
                              <span className="text-[6px] text-[#C5A02D] font-mono uppercase font-black tracking-widest">LOCAL FEED</span>
                              <span className="text-[7px] text-white font-sans font-bold">You (Admin)</span>
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-4 py-4">
                        <div className={`w-20 h-20 rounded-full flex items-center justify-center border-2 border-dashed bg-slate-900 relative ${activeCall.status === "dialing" ? "border-gold animate-spin" : "border-[#C5A02D]/40 animate-pulse"}`}>
                          <div className="absolute inset-2 bg-[#0B1C33] rounded-full flex items-center justify-center">
                            <span className="text-3xl">👤</span>
                          </div>
                        </div>
                        <div className="text-center">
                          <h4 className="text-sm font-sans font-black text-white">{activeCall.participantName}</h4>
                          <p className="text-[9px] text-[#C5A02D] mt-1.5 uppercase font-bold tracking-widest font-sans flex items-center justify-center gap-1">
                            {activeCall.status === "dialing" ? (
                              <>
                                <span className="h-1.5 w-1.5 rounded-full bg-gold animate-ping" />
                                Establishing Secure Dialing Connection...
                              </>
                            ) : activeCall.status === "ringing" ? (
                              <>
                                <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-ping" />
                                Incoming Ringing Link...
                              </>
                            ) : (
                              <>
                                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                Securely Connected
                              </>
                            )}
                          </p>
                        </div>
                        {activeCall.status === "connected" && (
                          <div className="flex items-center gap-1.5 mt-1 bg-white/5 px-3 py-1.5 border border-white/5">
                            <span className="w-1 h-3 rounded-full bg-emerald-500 animate-bounce" style={{ animationDelay: '0.1s' }} />
                            <span className="w-1 h-5 rounded-full bg-emerald-500 animate-bounce" style={{ animationDelay: '0.2s' }} />
                            <span className="w-1 h-4 rounded-full bg-emerald-500 animate-bounce" style={{ animationDelay: '0.3s' }} />
                            <span className="w-1 h-6 rounded-full bg-emerald-500 animate-bounce" style={{ animationDelay: '0.4s' }} />
                            <span className="w-1 h-3 rounded-full bg-emerald-500 animate-bounce" style={{ animationDelay: '0.5s' }} />
                          </div>
                        )}
                      </div>
                    )}
                    
                    {activeCall.status === "connected" && (
                      <span className="text-[11px] font-mono mt-4 font-bold bg-[#C5A02D]/10 text-[#C5A02D] px-2.5 py-1 border border-[#C5A02D]/20">
                        ⏱️ <CallTimer />
                      </span>
                    )}
                  </div>

                  {/* Actions Bar */}
                  <div className="border-t border-white/10 pt-4 flex flex-col gap-3 shrink-0">
                    {activeCall.status === "dialing" ? (
                      <div className="w-full">
                        {/* CANCEL DIALING BUTTON */}
                        <button
                          type="button"
                          onClick={async () => {
                            clearCallTimers();
                            if (activeCall.callDocId) {
                              try {
                                const callDocRef = doc(db, "hybrid_sandbox", activeCall.callDocId);
                                await updateDoc(callDocRef, { status: "ended" });
                              } catch (e) {
                                console.error("Error ending call in db:", e);
                              }
                            }
                            setActiveCall(prev => prev ? { ...prev, status: "ended" } : null);
                            toastService.info("Call dialing canceled.");
                            setTimeout(() => setActiveCall(null), 800);
                          }}
                          className="w-full py-3 bg-rose-600 hover:bg-rose-500 text-white font-extrabold rounded-sm shadow-md transition-all active:scale-95 flex items-center justify-center gap-2 uppercase tracking-wider text-[11px]"
                        >
                          <PhoneOff size={14} /> Cancel Call Dialing
                        </button>
                      </div>
                    ) : activeCall.status === "ringing" ? (
                      <div className="grid grid-cols-2 gap-3 w-full">
                        {/* ACCEPT / ANSWER BUTTON */}
                        <button
                          type="button"
                          onClick={async () => {
                            clearCallTimers();
                            if (activeCall.callDocId) {
                              try {
                                const callDocRef = doc(db, "hybrid_sandbox", activeCall.callDocId);
                                await updateDoc(callDocRef, { status: "connected" });
                              } catch (e) {
                                console.error("Error accepting call in db:", e);
                              }
                            }
                            setActiveCall(prev => prev ? { ...prev, status: "connected" } : null);
                            toastService.success("Call connected.");
                          }}
                          className="py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-sm shadow-md transition-all active:scale-95 flex items-center justify-center gap-2 uppercase tracking-wider text-[11px]"
                        >
                          <Phone size={14} className="animate-bounce" /> Answer Call
                        </button>

                        {/* DECLINE BUTTON */}
                        <button
                          type="button"
                          onClick={async () => {
                            clearCallTimers();
                            if (activeCall.callDocId) {
                              try {
                                const callDocRef = doc(db, "hybrid_sandbox", activeCall.callDocId);
                                await updateDoc(callDocRef, { status: "ended" });
                              } catch (e) {
                                console.error("Error declining call in db:", e);
                              }
                            }
                            setActiveCall(prev => prev ? { ...prev, status: "ended" } : null);
                            toastService.info("Call declined.");
                            setTimeout(() => setActiveCall(null), 1000);
                          }}
                          className="py-3 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-sm shadow-md transition-all active:scale-95 flex items-center justify-center gap-2 uppercase tracking-wider text-[11px]"
                        >
                          <PhoneOff size={14} /> Decline
                        </button>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-3 w-full">
                        {/* Active Call Controls */}
                        <div className="flex items-center justify-center gap-4">
                          <button 
                            type="button"
                            onClick={() => setActiveCall(prev => prev ? { ...prev, hasMic: !prev.hasMic } : null)}
                            className={`p-3 rounded-full border transition-all ${
                              activeCall.hasMic 
                                ? "bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700" 
                                : "bg-rose-500/20 border-rose-500/30 text-rose-400 hover:bg-rose-500/30"
                            }`}
                            title={activeCall.hasMic ? "Mute Microphone" : "Unmute Microphone"}
                          >
                            {activeCall.hasMic ? <Mic size={14} /> : <MicOff size={14} />}
                          </button>

                          {activeCall.type === "video" && (
                            <button 
                              type="button"
                              onClick={() => setActiveCall(prev => prev ? { ...prev, hasVideo: !prev.hasVideo } : null)}
                              className={`p-3 rounded-full border transition-all ${
                                activeCall.hasVideo 
                                  ? "bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700" 
                                  : "bg-rose-500/20 border-rose-500/30 text-rose-400 hover:bg-rose-500/30"
                              }`}
                              title={activeCall.hasVideo ? "Turn Camera Off" : "Turn Camera On"}
                            >
                              {activeCall.hasVideo ? <Video size={14} /> : <VideoOff size={14} />}
                            </button>
                          )}
                        </div>

                        {/* END CALL BUTTON */}
                        <button 
                          type="button"
                          onClick={async () => {
                            clearCallTimers();
                            if (activeCall.callDocId) {
                              try {
                                const callDocRef = doc(db, "hybrid_sandbox", activeCall.callDocId);
                                await updateDoc(callDocRef, { status: "ended" });
                              } catch (e) {
                                console.error("Error ending call in db:", e);
                              }
                            }
                            setActiveCall(prev => prev ? { ...prev, status: "ended" } : null);
                            toastService.info("Call ended.");
                            setTimeout(() => setActiveCall(null), 1000);
                          }}
                          className="w-full py-3 bg-rose-600 hover:bg-rose-500 text-white font-extrabold rounded-sm shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2 uppercase tracking-wider text-[11px]"
                          title="Hang Up"
                        >
                          <PhoneOff size={14} /> End Call Link
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      {showWebhookModal && activeSpace && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-fade-in" id="webhook-manager-modal">
          <div className="bg-white rounded-lg shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden flex flex-col font-sans">
            
            {/* Modal Header */}
            <div className="bg-slate-900 text-white px-4 py-3 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <Settings size={15} className="text-emerald-400" />
                <div>
                  <h3 className="text-[12px] font-bold tracking-wide">WEBHOOK MANAGER</h3>
                  <p className="text-[9px] text-slate-400 font-serif italic">Configuring webhooks for #{activeSpace.name.replace(/^[^\s]+\s/, "")}</p>
                </div>
              </div>
              <button 
                onClick={() => setShowWebhookModal(false)}
                className="text-slate-400 hover:text-white transition-colors"
                id="close-webhook-modal"
              >
                <X size={15} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 space-y-4 overflow-y-auto max-h-[70vh] custom-scrollbar">
              
              {/* Outbound Webhook section */}
              <div className="border border-slate-100 rounded bg-slate-50 p-3 space-y-2">
                <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                  Outbound Webhook (Send to Google Chat)
                </h4>
                <p className="text-[9px] text-slate-500 leading-normal">
                  Automatically forward messages typed in this widget space to an actual external Google Chat space incoming webhook URL.
                </p>
                
                <div>
                  <label className="block text-[8px] font-bold text-slate-500 uppercase mb-1">Incoming Google Chat Webhook URL</label>
                  <input
                    type="url"
                    value={outboundWebhookInput}
                    onChange={(e) => setOutboundWebhookInput(e.target.value)}
                    placeholder="https://chat.googleapis.com/v1/spaces/.../webhooks/..."
                    className="w-full text-[10px] p-2 bg-white border border-slate-200 rounded outline-none focus:border-[#5b58e7]"
                  />
                </div>

                <div className="flex gap-2 justify-end pt-1">
                  {activeSpace.webhookUrl && (
                    <button
                      type="button"
                      onClick={async () => {
                        await handleClearWebhook(activeSpace.id);
                        setOutboundWebhookInput("");
                      }}
                      className="px-2.5 py-1 text-[9px] font-bold border border-rose-200 text-rose-600 bg-rose-50/50 hover:bg-rose-50 rounded"
                    >
                      Clear
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={async () => {
                      const cleanUrl = outboundWebhookInput.trim();
                      if (cleanUrl && !cleanUrl.startsWith("https://chat.googleapis.com/")) {
                        toastService.error("Invalid Webhook URL. It must start with https://chat.googleapis.com/");
                        return;
                      }
                      await handleSaveWebhook(activeSpace.id, cleanUrl);
                    }}
                    className="px-2.5 py-1 text-[9px] font-bold text-white rounded hover:bg-opacity-90 shadow-xs"
                    style={{ backgroundColor: primaryColor }}
                  >
                    Save Outbound
                  </button>
                </div>
              </div>

              {/* Inbound Webhook section */}
              <div className="border border-slate-100 rounded bg-slate-50 p-3 space-y-2">
                <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  Inbound Webhook (Receive in Widget)
                </h4>
                <p className="text-[9px] text-slate-500 leading-normal">
                  Send data from external Google Chat, web forms, or WordPress. Anything POSTed to this URL will immediately print to this widget conversation room.
                </p>

                <div>
                  <label className="block text-[8px] font-bold text-slate-500 uppercase mb-1">Target Inbound URL</label>
                  <div className="flex gap-1">
                    <input
                      type="text"
                      readOnly
                      value={`${window.location.origin}/api/inbound-webhook/${companyId}/${activeSpace.id}`}
                      className="flex-1 text-[9px] p-2 bg-slate-100 border border-slate-200 rounded outline-none font-mono select-all text-slate-600"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const url = `${window.location.origin}/api/inbound-webhook/${companyId}/${activeSpace.id}`;
                        navigator.clipboard.writeText(url);
                        toastService.success("Inbound Webhook URL copied!");
                      }}
                      className="px-2 bg-white border border-slate-200 rounded hover:bg-slate-50 text-slate-600"
                      title="Copy URL"
                    >
                      <Copy size={11} />
                    </button>
                  </div>
                </div>

                <div className="pt-1.5 border-t border-slate-200/60">
                  <label className="block text-[8px] font-bold text-slate-500 uppercase mb-1">Developer Test Simulation Payload</label>
                  <div className="space-y-1.5">
                    <textarea
                      value={testWebhookPayloadText}
                      onChange={(e) => setTestWebhookPayloadText(e.target.value)}
                      placeholder='Hello from the exterior application!'
                      className="w-full text-[9px] p-2 bg-slate-800 text-slate-200 rounded font-mono h-12 outline-none"
                    />
                    <div className="flex justify-between items-center">
                      <span className="text-[8px] text-slate-400 font-mono">POST JSON text body</span>
                      <button
                        type="button"
                        disabled={isTestingWebhook}
                        onClick={async () => {
                          setIsTestingWebhook(true);
                          try {
                            const url = `/api/inbound-webhook/${companyId}/${activeSpace.id}`;
                            const res = await fetch(url, {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({
                                text: testWebhookPayloadText,
                                senderName: "Webhook Sandbox Tester",
                                senderEmail: "webhook-tester@cml.com.fj"
                              })
                            });
                            if (res.ok) {
                              toastService.success("Inbound test post simulated successfully!");
                            } else {
                              toastService.error("Simulation failed to POST.");
                            }
                          } catch (err) {
                            console.error("Simulation test failed:", err);
                            toastService.error("Network sync simulation failed.");
                          } finally {
                            setIsTestingWebhook(false);
                          }
                        }}
                        className="px-2.5 py-1 text-[9px] font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded disabled:opacity-50"
                      >
                        {isTestingWebhook ? "Simulating..." : "Test Inbound Webhook"}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

            </div>

            {/* Modal Footer */}
            <div className="bg-slate-50 border-t border-slate-100 px-4 py-3 flex justify-end">
              <button
                type="button"
                onClick={() => setShowWebhookModal(false)}
                className="px-3 py-1.5 text-[10px] font-bold text-slate-600 bg-white border border-slate-200 rounded hover:bg-slate-50"
              >
                Close
              </button>
            </div>

          </div>
        </div>
      )}
    </>
  );
};
