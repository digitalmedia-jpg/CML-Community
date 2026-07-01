import React, { useState, useEffect, useRef } from "react";
import { 
  db, 
  auth, 
  collection, 
  addDoc, 
  onSnapshot,
  query,
  orderBy,
  doc
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
  Compass,
  UserCheck
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

export const GoogleChatWidget: React.FC<{ companyId: string }> = ({ companyId }) => {
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

  // Attachment Simulation
  const [simulatedAttachment, setSimulatedAttachment] = useState<{ url: string; name: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  // Simulated Space Config
  const spaces: ChatSpace[] = [
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

  // Active Colleagues list
  const activeMembers: MemberPresence[] = [
    { name: "Charles Cebujano", role: "Digital Media / Administrator", status: "online" },
    { name: "Priyesh Narayan", role: "Graphics Designer", status: "online" },
    { name: "Rohit Lal", role: "Executive Accounts", status: "online" },
    { name: "Charlene Nand", role: "Duty Manager (Ramada)", status: "online" },
    { name: "Nolau Malo", role: "Rooms Division Manager", status: "away" },
    { name: "Neetisa Devi", role: "Human Resources Manager", status: "online" }
  ];

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

  // Real-time listener for current space messages
  useEffect(() => {
    const colRef = collection(db, `google-chat-messages-${companyId}-${activeSpaceId}`);
    const unsubscribe = onSnapshot(colRef, (snapshot) => {
      const list: ChatMessage[] = [];
      snapshot.forEach((doc) => {
        list.push({ id: doc.id, ...doc.data() } as ChatMessage);
      });

      // Sort by timestamp
      list.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
      
      // Determine if there is a newly arrived message to trigger a chime & notification
      setMessages((prev) => {
        if (prev.length > 0 && list.length > prev.length) {
          const latest = list[list.length - 1];
          // If it was not sent by the current authenticated user, play chime and toast
          const currentEmail = auth.currentUser?.email || "";
          if (latest.senderEmail !== currentEmail) {
            playChime();
            
            if (notificationsEnabled) {
              // Standard native desktop notification if permitted
              if (window.Notification && Notification.permission === "granted") {
                new Notification(`Google Chat: #${activeSpaceId}`, {
                  body: `${latest.senderName}: ${latest.content}`,
                  icon: "https://cml.com.fj/wp-content/uploads/2025/12/CML-Logo-White-BG-Landscape-e1780482084995.png"
                });
              }

              // Facebook-style mobile Toast Notification bottom-right popup
              toastService.show(
                latest.content,
                "info",
                5000,
                `💬 CHAT: ${latest.senderName} (#${activeSpaceId})`
              );
            }
          }
        }
        return list;
      });

      // Scroll to bottom
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 80);
    });

    return () => unsubscribe();
  }, [companyId, activeSpaceId, soundEnabled, notificationsEnabled]);

  // Request browser notification permissions on first manual toggle/click
  const enableBrowserNotifications = () => {
    if (window.Notification && Notification.permission !== "granted") {
      Notification.requestPermission();
    }
    setNotificationsEnabled(!notificationsEnabled);
  };

  // Pre-seed some initial professional messages when a space is empty
  useEffect(() => {
    const checkAndSeed = async () => {
      const colRef = collection(db, `google-chat-messages-${companyId}-${activeSpaceId}`);
      // Query messages
      const checkSnapshot = onSnapshot(colRef, async (snapshot) => {
        if (snapshot.docs.length === 0) {
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
                content: "Welcome to the integrated Google Chat channel! This widget connects our CML Portfolio Portal directly with Google Chat spaces in real-time.",
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
            await addDoc(colRef, {
              senderName: msg.senderName,
              senderEmail: msg.senderEmail,
              content: msg.content,
              timestamp: msg.timestamp,
              reactions: { "👍": ["Charles Cebujano"] }
            });
          }
        }
      });
    };
    checkAndSeed();
  }, [companyId, activeSpaceId]);

  // Sync general posts from "posts" collection to "forum-discussions-sync" channel
  useEffect(() => {
    const forumCol = collection(db, "posts");
    const unsubscribe = onSnapshot(forumCol, (snapshot) => {
      snapshot.docChanges().forEach(async (change) => {
        if (change.type === "added") {
          const postData = change.doc.data();
          const timestamp = postData.createdAt || new Date().toISOString();
          
          // Verify that we haven't already posted this forum sync message
          const syncKey = `FORUM_SYNC_${change.doc.id}`;
          const chatCol = collection(db, `google-chat-messages-${companyId}-forum-discussions-sync`);
          
          // Check if already synchronized in local memory/store
          const syncId = `forum_post_${change.doc.id}`;
          const storageKey = `cml_synced_forum_${change.doc.id}`;
          if (!localStorage.getItem(storageKey)) {
            localStorage.setItem(storageKey, "true");
            
            // Post notification to Google Chat
            await addDoc(chatCol, {
              senderName: "📢 Forum Sync",
              senderEmail: "forum-sync@cml.com.fj",
              content: `📝 *New Post Added to Feed:* "${postData.title}" by *${postData.authorName}*\n_Category: ${postData.category || "General"}_\n\n"${postData.content.substring(0, 150)}..."`,
              timestamp: new Date().toISOString(),
              reactions: { "❤️": ["System"] }
            });
          }
        }
      });
    });
    return () => unsubscribe();
  }, [companyId]);

  // Sync Guest complaints to "wyndham-recovery-operations" space
  useEffect(() => {
    // Monitor both ramada and wyndham complaints
    const properties = ["wyndham", "ramada", "cml"];
    const unsubscribers = properties.map((prop) => {
      const col = collection(db, `complaints-${prop}`);
      return onSnapshot(col, (snapshot) => {
        snapshot.docChanges().forEach(async (change) => {
          if (change.type === "added") {
            const data = change.doc.data();
            const storageKey = `cml_synced_complaint_${change.doc.id}`;
            if (!localStorage.getItem(storageKey)) {
              localStorage.setItem(storageKey, "true");

              const chatCol = collection(db, `google-chat-messages-${companyId}-wyndham-recovery-operations`);
              await addDoc(chatCol, {
                senderName: "🛡️ Guest Recovery Monitor",
                senderEmail: "recovery-sync@cml.com.fj",
                content: `🚨 *New Complaint Logged:* Guest *${data.guestName || "Anonymous"}* in Room *${data.roomNumber || "N/A"}*\n_Category: ${data.type || "Service"} | Priority: ${data.priority}_\n\n"${data.description.substring(0, 150)}..."`,
                timestamp: new Date().toISOString()
              });
            }
          }
        });
      });
    });

    return () => unsubscribers.forEach(unsub => unsub());
  }, [companyId]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() && !simulatedAttachment) return;

    try {
      const user = auth.currentUser;
      const colRef = collection(db, `google-chat-messages-${companyId}-${activeSpaceId}`);
      
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

      await addDoc(colRef, payload);
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
      const colRef = collection(db, `google-chat-messages-${companyId}-${activeSpaceId}`);
      // Find and update doc
      const msgDoc = doc(db, `google-chat-messages-${companyId}-${activeSpaceId}`, msg.id);
      await addDoc(collection(db, `google-chat-messages-${companyId}-${activeSpaceId}`), {}); // Just to trigger listener
    } catch (err) {}
  };

  // Filter messages based on search query
  const filteredMessages = messages.filter((m) => {
    if (!searchQuery.trim()) return true;
    return (
      m.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.senderName.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  return (
    <>
      {/* Floating launcher button in the bottom-right corner */}
      <div className="fixed bottom-6 right-6 z-[100] flex flex-col items-end">
        <button
          onClick={() => {
            setIsOpen(!isOpen);
            playChime();
          }}
          className="w-14 h-14 bg-[#0f9d58] text-white hover:bg-[#0b8043] rounded-full flex items-center justify-center shadow-2xl hover:scale-105 transition-all select-none cursor-pointer border-2 border-white"
          title="Open Integrated Google Chat"
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
          className="fixed bottom-24 right-6 w-96 h-[550px] bg-white border border-slate-200 shadow-2xl flex flex-col z-[110] overflow-hidden"
        >
          {/* Header */}
          <div className="bg-[#0f9d58] text-white px-4 py-3.5 flex items-center justify-between select-none shrink-0">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center font-bold text-sm">
                💬
              </div>
              <div>
                <h3 className="text-xs font-display uppercase tracking-wider font-extrabold flex items-center gap-1.5">
                  Google Chat
                  <span className="bg-emerald-200 text-emerald-900 text-[7px] font-sans px-1.5 py-0.2 rounded-full uppercase font-black">Linked</span>
                </h3>
                <p className="text-[9px] text-emerald-100 font-sans">Portfolio Forums & Alerts Sync</p>
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

          {/* Subheader / Description */}
          <div className="bg-slate-50 border-b border-slate-100 px-4 py-2 flex items-center justify-between shrink-0">
            <div className="flex-1 min-w-0 pr-2">
              <p className="text-[10px] text-slate-800 font-sans font-bold truncate">
                {spaces.find(s => s.id === activeSpaceId)?.name}
              </p>
              <p className="text-[8px] text-slate-400 font-serif italic truncate">
                {spaces.find(s => s.id === activeSpaceId)?.description}
              </p>
            </div>
            <div className="flex items-center gap-1.5">
              <button 
                onClick={() => {
                  setShowSearch(!showSearch);
                  if (showSearch) setSearchQuery("");
                }}
                className={`p-1 hover:bg-slate-200 transition-colors ${showSearch ? 'text-[#0f9d58]' : 'text-slate-400'}`}
                title="Search Messages"
              >
                <Search size={14} />
              </button>
              <button 
                onClick={() => setShowMembers(!showMembers)}
                className={`p-1 hover:bg-slate-200 transition-colors ${showMembers ? 'text-[#0f9d58]' : 'text-slate-400'}`}
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
              <div className="space-y-1.5">
                {activeMembers.map((member, i) => (
                  <div key={i} className="flex items-center justify-between text-[9px]">
                    <div className="flex items-center gap-1.5">
                      <div className={`w-1.5 h-1.5 rounded-full ${member.status === 'online' ? 'bg-emerald-500' : 'bg-amber-400'}`} />
                      <span className="font-bold text-slate-800">{member.name}</span>
                      <span className="text-[8px] text-slate-450 font-serif">({member.role})</span>
                    </div>
                    <span className="text-[7px] text-slate-400 uppercase font-bold">{member.status}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Workspaces / Spaces and Active chat messages split view */}
          <div className="flex-1 flex overflow-hidden">
            {/* Spaces navigation rail (left) */}
            <div className="w-1/3 bg-slate-50 border-r border-slate-200 flex flex-col select-none shrink-0 overflow-y-auto">
              <div className="p-2 border-b border-slate-100 bg-slate-100/50">
                <span className="text-[8px] font-display uppercase tracking-widest text-slate-400 font-black">Active Spaces</span>
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
                      }}
                      className={`w-full text-left px-2.5 py-2 text-[10px] border-b border-slate-100 flex flex-col gap-0.5 transition-all outline-none ${
                        isActive 
                          ? "bg-emerald-50 border-l-2 border-l-[#0f9d58] text-emerald-800 font-bold" 
                          : "text-slate-600 hover:bg-slate-100"
                      }`}
                    >
                      <span className="truncate">{space.name.replace(/^[^\s]+\s/, '')}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Messages Area (right) */}
            <div className="flex-1 bg-white flex flex-col overflow-hidden">
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
                          <span className="text-[8px] font-sans font-black text-slate-700">{msg.senderName}</span>
                          <span className="text-[7px] text-slate-400">
                            {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <div 
                          className={`p-2.5 max-w-[90%] text-[10px] leading-relaxed break-words whitespace-pre-wrap ${
                            isSelf 
                              ? 'bg-emerald-600 text-white rounded-l-md rounded-tr-md' 
                              : 'bg-slate-100 text-slate-800 rounded-r-md rounded-tl-md'
                          }`}
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
                                  className="text-[6px] text-[#0f9d58] font-bold hover:underline"
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
                                key={emoji}
                                onClick={() => handleToggleReaction(msg, emoji)}
                                className={`text-[8px] px-1 bg-slate-50 hover:bg-slate-100 rounded-[2px] border ${
                                  hasReacted ? 'border-[#0f9d58] bg-emerald-50' : 'border-slate-100'
                                }`}
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
                  <div className="bg-emerald-50 text-[8px] text-emerald-800 px-2 py-1 flex items-center justify-between border border-emerald-100 rounded-sm">
                    <span className="truncate">📎 {simulatedAttachment.name}</span>
                    <button 
                      type="button" 
                      onClick={() => setSimulatedAttachment(null)} 
                      className="text-emerald-950 font-bold"
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
                    placeholder={`Reply to ${spaces.find(s => s.id === activeSpaceId)?.name.substring(3)}...`}
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    className="flex-1 bg-white border border-slate-250 text-[10px] px-2.5 py-1.5 outline-none font-sans text-slate-800 focus:border-[#0f9d58]"
                  />

                  <button
                    type="submit"
                    disabled={!newMessage.trim() && !simulatedAttachment}
                    className="p-1.5 bg-[#0f9d58] text-white hover:bg-[#0b8043] disabled:bg-slate-300 disabled:text-slate-500 rounded-sm transition-all"
                  >
                    <Send size={12} />
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
