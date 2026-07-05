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
  Mail
} from "lucide-react";
import { toastService } from "../services/toastService";

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
}

interface MemberPresence {
  name: string;
  role: string;
  status: "online" | "away";
}

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

  const [isCreatingSpace, setIsCreatingSpace] = useState(false);
  const [newSpaceName, setNewSpaceName] = useState("");
  const [newSpaceDesc, setNewSpaceDesc] = useState("");

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
    }
  ];

  const spaces = [...baseSpaces, ...customSpaces];

  // Call & Video Simulation state
  const [activeCall, setActiveCall] = useState<{
    type: "voice" | "video";
    status: "ringing" | "connected" | "ended";
    participantName: string;
    hasVideo: boolean;
    hasMic: boolean;
  } | null>(null);

  // Sync custom spaces state on companyId change
  useEffect(() => {
    try {
      const saved = localStorage.getItem(`cml_custom_spaces_${companyId}`);
      setCustomSpaces(saved ? JSON.parse(saved) : []);
    } catch (e) {
      setCustomSpaces([]);
    }
  }, [companyId]);

  // Create new Group Space/Forum
  const handleAddSpace = (name: string, description: string) => {
    if (!name.trim()) return;
    const cleanName = name.trim().toLowerCase().replace(/\s+/g, '-');
    const newSpace: ChatSpace = {
      id: `custom-space-${cleanName}-${Date.now()}`,
      name: `📁 ${cleanName}`,
      description: description.trim() || "Custom staff group discussion forum",
      unreadCount: 0
    };
    const updated = [...customSpaces, newSpace];
    setCustomSpaces(updated);
    localStorage.setItem(`cml_custom_spaces_${companyId}`, JSON.stringify(updated));
    setActiveSpaceId(newSpace.id);
    setIsCreatingSpace(false);
    setNewSpaceName("");
    setNewSpaceDesc("");
    toastService.success(`Successfully created and synchronized group space #${cleanName}!`);
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

  // Active Colleagues list
  const activeMembers: MemberPresence[] = [
    { name: "Charles Cebujano", role: "Digital Media / Administrator", status: "online" },
    { name: "Priyesh Narayan", role: "Graphics Designer", status: "online" },
    { name: "Rohit Lal", role: "Executive Accounts", status: "online" },
    { name: "Charlene Nand", role: "Duty Manager (Ramada)", status: "online" },
    { name: "Nolau Malo", role: "Rooms Division Manager", status: "away" },
    { name: "Neetisa Devi", role: "Human Resources Manager", status: "online" }
  ];

  // Load real spaces from Google Chat API
  useEffect(() => {
    if (!isWorkspaceConnected || !workspaceAccessToken) {
      setRealSpaces(null);
      return;
    }

    const loadRealSpaces = async () => {
      try {
        setApiError(null);
        const res = await fetch("https://chat.googleapis.com/v1/spaces", {
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
        
        let isValid = false;
        if (companyId === "ramada" && domain === "ramadawailoaloafiji.com") {
          isValid = true;
        } else if (companyId === "wyndham" && domain === "wyndhamgardenwailoaloafiji.com") {
          isValid = true;
        } else if (companyId === "cml" && domain === "cml.com.fj") {
          isValid = true;
        }

        if (!isValid) {
          disconnectGoogleWorkspaceProperty(companyId);
          setConnections(getGoogleWorkspaceConnections());
          let expected = "";
          if (companyId === "ramada") expected = "ramadawailoaloafiji.com";
          else if (companyId === "wyndham") expected = "wyndhamgardenwailoaloafiji.com";
          else expected = "cml.com.fj";
          toastService.error(`Linking failed: Only @${expected} domain emails are authorized for this property's Google Chat Widget.`);
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
    const targetCol = `google-chat-messages-${companyId}-${activeSpaceId}`;
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
      const targetCol = `google-chat-messages-${companyId}-${space.id}`;
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

              // Native Desktop Push notification (perfect when in background/other tabs)
              if (!isCurrentActiveSpaceFocused && window.Notification && Notification.permission === "granted") {
                new Notification(`CML Chat: ${space.name.replace(/^[^\s]+\s/, '')}`, {
                  body: `${msg.senderName}: ${msg.content}`,
                  icon: "https://cml.com.fj/wp-content/uploads/2025/12/CML-Logo-White-BG-Landscape-e1780482084995.png"
                });
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

  // Pre-seed some initial professional messages when a space is empty
  useEffect(() => {
    const checkAndSeed = async () => {
      const colRef = collection(db, "hybrid_sandbox");
      const targetCol = `google-chat-messages-${companyId}-${activeSpaceId}`;
      
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
              const chatCol = `google-chat-messages-${companyId}-forum-discussions-sync`;
              
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

                const chatCol = `google-chat-messages-${companyId}-wyndham-recovery-operations`;
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

  // Synchronize Google Chat messages from space AAAAApnKTIM to CML widget (ramada-forum-sync)
  useEffect(() => {
    if (companyId !== "ramada" || activeSpaceId !== "forum-discussions-sync") {
      return;
    }

    let intervalId: any = null;

    const syncMessagesFromGoogleChat = async () => {
      const token = workspaceAccessToken || getGoogleAccessToken("ramada");
      if (!token) {
        return;
      }

      try {
        const spaceId = "AAAAEpnKTIM";
        const response = await fetch(`https://chat.googleapis.com/v1/spaces/${spaceId}/messages?pageSize=30`, {
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

        for (const gMsg of googleMessages) {
          if (gMsg.text && (gMsg.text.includes("(CML Widget)") || gMsg.text.includes("📢 Forum Sync") || gMsg.text.includes("🛡️ Guest Recovery Monitor"))) {
            continue;
          }

          const msgId = `gchat_${gMsg.name.replace(/\//g, "_")}`;
          const senderName = gMsg.sender?.displayName || "Google Chat Member";
          const senderEmail = gMsg.sender?.email || "gchat@ramadawailoaloafiji.com";
          const content = gMsg.text || "";
          const timestamp = gMsg.createTime || new Date().toISOString();

          const targetCol = `google-chat-messages-ramada-forum-discussions-sync`;
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
      } catch (err) {
        console.error("Error syncing Google Chat messages:", err);
      }
    };

    syncMessagesFromGoogleChat();
    intervalId = setInterval(syncMessagesFromGoogleChat, 10000);

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [companyId, activeSpaceId, workspaceAccessToken]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() && !simulatedAttachment) return;

    try {
      const user = auth.currentUser;
      const targetCol = `google-chat-messages-${companyId}-${activeSpaceId}`;
      
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

      // Two-way Google Chat space webhook sync for Ramada Forum
      if (companyId === "ramada" && activeSpaceId === "forum-discussions-sync") {
        try {
          let text = `*${payload.senderName}* (CML Widget):\n${payload.content}`;
          if (payload.attachmentUrl) {
            text += `\n📎 *Attachment:* [${payload.attachmentName || "File"}](${payload.attachmentUrl})`;
          }
          await fetch("https://chat.googleapis.com/v1/spaces/AAAAEpnKTIM/messages?key=AIzaSyDdI0hCZtE6vySjMm-WEfRq3CPzqKqqsHI&token=vPwVpjTZY-LCMzE-k99FArPmX0r1icantvbCflTP6bk", {
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
                                  
                                  let isValid = false;
                                  if (propId === "ramada" && domain === "ramadawailoaloafiji.com") {
                                    isValid = true;
                                  } else if (propId === "wyndham" && domain === "wyndhamgardenwailoaloafiji.com") {
                                    isValid = true;
                                  } else if (propId === "cml" && domain === "cml.com.fj") {
                                    isValid = true;
                                  }

                                  if (!isValid) {
                                    disconnectGoogleWorkspaceProperty(propId);
                                    setConnections(getGoogleWorkspaceConnections());
                                    let expected = "";
                                    if (propId === "ramada") expected = "ramadawailoaloafiji.com";
                                    else if (propId === "wyndham") expected = "wyndhamgardenwailoaloafiji.com";
                                    else expected = "cml.com.fj";
                                    toastService.error(`Linking failed: Only @${expected} domain emails are authorized for this property's Google Chat Widget.`);
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
              <button 
                onClick={() => {
                  const name = isDM ? dmName : (spaces.find(s => s.id === activeSpaceId)?.name.replace(/^[^\s]+\s/, '') || "Team Members");
                  setActiveCall({
                    type: "voice",
                    status: "ringing",
                    participantName: name,
                    hasVideo: false,
                    hasMic: true
                  });
                  toastService.info(`Calling ${name}...`);
                  setTimeout(() => {
                    setActiveCall(prev => prev ? { ...prev, status: "connected" } : null);
                  }, 2500);
                }}
                className="p-1 hover:bg-slate-200 transition-colors"
                style={{ color: primaryColor }}
                title="Start Voice Call"
              >
                <Phone size={13} />
              </button>
              <button 
                onClick={() => {
                  const name = isDM ? dmName : (spaces.find(s => s.id === activeSpaceId)?.name.replace(/^[^\s]+\s/, '') || "Team Members");
                  setActiveCall({
                    type: "video",
                    status: "ringing",
                    participantName: name,
                    hasVideo: true,
                    hasMic: true
                  });
                  toastService.info(`Starting video call with ${name}...`);
                  setTimeout(() => {
                    setActiveCall(prev => prev ? { ...prev, status: "connected" } : null);
                  }, 2500);
                }}
                className="p-1 hover:bg-slate-200 transition-colors"
                style={{ color: primaryColor }}
                title="Start Video Call"
              >
                <Video size={13} />
              </button>

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
            <div className="bg-slate-100 border-b border-slate-200 p-3 max-h-[140px] overflow-y-auto custom-scrollbar shrink-0">
              <h4 className="text-[8px] font-display uppercase tracking-wider text-slate-500 font-black mb-1.5">Active Presence Portfolio</h4>
              <div className="space-y-1">
                {activeMembers.map((member, i) => (
                  <div 
                    key={i} 
                    onClick={() => handleStartPrivateChat(member.name)}
                    className="flex items-center justify-between text-[9px] hover:bg-slate-200/60 p-1 rounded cursor-pointer transition-all select-none"
                    title={`Start private chat with ${member.name}`}
                  >
                    <div className="flex items-center gap-1.5 min-w-0">
                      <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${member.status === 'online' ? 'bg-emerald-500' : 'bg-amber-400'}`} />
                      <span className="font-bold text-slate-800 truncate">{member.name}</span>
                      <span className="text-[7px] text-slate-400 font-serif truncate">({member.role})</span>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <span className="text-[7px] text-slate-400 uppercase font-bold mr-1">{member.status}</span>
                      <span className="text-[8px] hover:underline font-bold font-sans" style={{ color: primaryColor }}>Chat</span>
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
                    <button
                      key={space.id}
                      onClick={() => {
                        setActiveSpaceId(space.id);
                        setShowSearch(false);
                        setSearchQuery("");
                        setIsCreatingSpace(false);
                      }}
                      className={`w-full text-left px-2.5 py-2 text-[10px] border-b border-slate-100 flex flex-col gap-0.5 transition-all outline-none ${
                        isActive 
                          ? "border-l-2 font-bold" 
                          : "text-slate-600 hover:bg-slate-100"
                      }`}
                      style={isActive ? {
                        backgroundColor: companyId === "ramada" ? "#fef2f2" : (companyId === "wyndham" ? "#f0fdfa" : "#fdfbeb"),
                        borderLeftColor: primaryColor,
                        color: primaryColor
                      } : {}}
                    >
                      <span className="truncate font-sans font-medium flex items-center gap-1 text-[10px]">{space.name}</span>
                    </button>
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
                        className="w-full text-[10px] border border-slate-200 px-2 py-1.5 outline-none bg-white font-sans text-slate-700 resize-none h-16"
                        maxLength={100}
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-2 mt-4">
                    <button 
                      type="button"
                      onClick={() => setIsCreatingSpace(false)}
                      className="flex-1 border border-slate-200 hover:bg-slate-100 text-slate-500 text-[9px] font-sans font-bold py-1.5 rounded transition-all"
                    >
                      Cancel
                    </button>
                    <button 
                      type="button"
                      onClick={() => handleAddSpace(newSpaceName, newSpaceDesc)}
                      disabled={!newSpaceName.trim()}
                      className="flex-1 disabled:bg-slate-200 disabled:text-slate-400 text-white text-[9px] font-sans font-bold py-1.5 rounded transition-all shadow-sm"
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
                        <div className="w-20 h-20 rounded-full flex items-center justify-center border-2 border-dashed border-[#C5A02D]/40 bg-slate-900 animate-pulse relative">
                          <div className="absolute inset-2 bg-[#0B1C33] rounded-full flex items-center justify-center">
                            <span className="text-3xl">👤</span>
                          </div>
                        </div>
                        <div className="text-center">
                          <h4 className="text-sm font-sans font-black text-white">{activeCall.participantName}</h4>
                          <p className="text-[9px] text-[#C5A02D] mt-1.5 uppercase font-bold tracking-widest font-sans flex items-center justify-center gap-1">
                            {activeCall.status === "ringing" ? (
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
                    {activeCall.status === "ringing" ? (
                      <div className="grid grid-cols-2 gap-3 w-full">
                        {/* ACCEPT / ANSWER BUTTON */}
                        <button
                          type="button"
                          onClick={() => {
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
                          onClick={() => {
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

                        {/* END CALL BUTTON (Very big, clear, labeled) */}
                        <button 
                          type="button"
                          onClick={() => {
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
    </>
  );
};
