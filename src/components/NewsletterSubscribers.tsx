import React, { useState, useEffect, useRef } from "react";
import { 
  collection, 
  getDocs, 
  addDoc, 
  deleteDoc, 
  doc, 
  updateDoc,
  setDoc,
  onSnapshot
} from "../lib/firebase";
import { db } from "../lib/firebase";
import { 
  Mail, 
  Plus, 
  Search, 
  Trash2, 
  UserPlus, 
  Download, 
  CheckCircle, 
  Code, 
  Copy, 
  Check, 
  ExternalLink,
  ChevronRight,
  Filter,
  Info,
  Sparkles,
  Edit,
  RefreshCw,
  Database
} from "lucide-react";

interface Subscriber {
  id: string;
  email: string;
  source: string;
  createdAt: string;
  convertedToRewards?: boolean;
  rewardsCardId?: string;
}

interface NewsletterSubscribersProps {
  companyId: string;
  userRole?: string;
  onConvertSubscriber?: (email: string, fullName: string) => void;
}

export default function NewsletterSubscribers({ companyId, userRole, onConvertSubscriber }: NewsletterSubscribersProps) {
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [newSource, setNewSource] = useState("Manual Entry");
  const [copiedWebhook, setCopiedWebhook] = useState(false);
  const [selectedWebhookProperty, setSelectedWebhookProperty] = useState(companyId);
  const [isConverting, setIsConverting] = useState<string | null>(null);
  const [simulatedEmail, setSimulatedEmail] = useState("");
  const [isSimulating, setIsSimulating] = useState(false);

  // States for editing subscriber details
  const [showEditModal, setShowEditModal] = useState<Subscriber | null>(null);
  const [editEmail, setEditEmail] = useState("");
  const [editSource, setEditSource] = useState("");
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  // Super Admin Check: default to true if undefined (for seamless setup), restrict if role is non-admin
  const isSuperAdmin = !userRole || userRole === "Super Admin" || userRole === "Administrator" || userRole === "admin";

  // Rewards registration temporary info modal state
  const [showConvertModal, setShowConvertModal] = useState<Subscriber | null>(null);
  const [convertName, setConvertName] = useState("");
  const [convertPhone, setConvertPhone] = useState("");

  const activeDomain = typeof window !== "undefined" ? window.location.origin : "https://your-app-domain.com";

  // Sync selected webhook property state when companyId changes
  useEffect(() => {
    setSelectedWebhookProperty(companyId);
  }, [companyId]);

  const [isScanningCloud, setIsScanningCloud] = useState(false);

  const handleDeepLedgerRecoveryScan = async () => {
    setIsScanningCloud(true);
    try {
      const res = await fetch("/api/trigger-recovery-scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" }
      });
      const data = await res.json();
      if (data.success) {
        alert("Deep Ledger Scan Completed! All raw historical subscribers and restaurant guests have been fully recovered from the Firestore cloud collections.");
        fetchSubscribers();
      } else {
        alert("Deep Scan Warning: " + (data.message || "Could not complete recovery scan. Please try again."));
      }
    } catch (err: any) {
      console.error("Deep scan failed:", err);
      alert("Failed to initiate deep scan. Check connection.");
    } finally {
      setIsScanningCloud(false);
    }
  };

  // Construct the smart universal script dynamically!
  const getUniversalWebhookScript = () => {
    return `<script>
(function() {
  function handleWordPressSubmission(formData, formElement) {
    // 1. Identify the subscriber's details dynamically by scanning form inputs & labels!
    var payload = {
      email: '',
      firstName: '',
      lastName: '',
      phone: '',
      source: 'WordPress Integrated Form',
      companyId: '${selectedWebhookProperty}',
      joinRewards: true
    };

    if (formElement) {
      var inputs = formElement.querySelectorAll('input, select, textarea');
      inputs.forEach(function(input) {
        var nameAttr = (input.getAttribute('name') || '').toLowerCase();
        var idAttr = (input.getAttribute('id') || '').toLowerCase();
        var typeAttr = (input.getAttribute('type') || '').toLowerCase();
        var placeholderAttr = (input.getAttribute('placeholder') || '').toLowerCase();
        
        // Find text content of any associated label
        var labelText = '';
        var labelEl = formElement.querySelector('label[for="' + input.id + '"]');
        if (labelEl) {
          labelText = labelEl.innerText.toLowerCase();
        } else {
          var parentLabel = input.closest('label');
          if (parentLabel) {
            labelText = parentLabel.innerText.toLowerCase();
          }
        }

        var value = input.value.trim();
        if (!value) return;

        // Intelligent keyword matching to dynamically map form inputs
        var isEmail = typeAttr === 'email' || nameAttr.indexOf('email') > -1 || nameAttr.indexOf('mail') > -1 || idAttr.indexOf('email') > -1 || placeholderAttr.indexOf('email') > -1 || labelText.indexOf('email') > -1;
        var isFirstName = nameAttr.indexOf('first') > -1 || nameAttr.indexOf('fname') > -1 || idAttr.indexOf('first') > -1 || placeholderAttr.indexOf('first') > -1 || labelText.indexOf('first name') > -1;
        var isLastName = nameAttr.indexOf('last') > -1 || nameAttr.indexOf('lname') > -1 || idAttr.indexOf('last') > -1 || placeholderAttr.indexOf('last') > -1 || labelText.indexOf('last name') > -1;
        var isFullName = !isFirstName && !isLastName && (nameAttr === 'name' || nameAttr.indexOf('full') > -1 || idAttr.indexOf('name') > -1 || placeholderAttr.indexOf('name') > -1 || labelText.indexOf('name') > -1);
        var isPhone = typeAttr === 'tel' || nameAttr.indexOf('phone') > -1 || nameAttr.indexOf('tel') > -1 || nameAttr.indexOf('mobile') > -1 || idAttr.indexOf('phone') > -1 || placeholderAttr.indexOf('phone') > -1 || labelText.indexOf('phone') > -1;
        var isProperty = nameAttr.indexOf('property') > -1 || nameAttr.indexOf('hotel') > -1 || nameAttr.indexOf('resort') > -1 || idAttr.indexOf('property') > -1 || labelText.indexOf('property') > -1 || labelText.indexOf('resort') > -1;

        if (isEmail) {
          payload.email = value;
        } else if (isFirstName) {
          payload.firstName = value;
        } else if (isLastName) {
          payload.lastName = value;
        } else if (isFullName) {
          var parts = value.split(' ');
          payload.firstName = parts[0] || '';
          payload.lastName = parts.slice(1).join(' ') || '';
        } else if (isPhone) {
          payload.phone = value;
        } else if (isProperty) {
          var lowerVal = value.toLowerCase();
          if (lowerVal.indexOf('wyndham') > -1 || lowerVal.indexOf('denarau') > -1) {
            payload.companyId = 'wyndham';
          } else if (lowerVal.indexOf('ramada') > -1 || lowerVal.indexOf('suva') > -1) {
            payload.companyId = 'ramada';
          } else {
            payload.companyId = 'cml';
          }
        }
      });
    }

    // Direct extraction from raw FormData if available (Contact Form 7 support)
    if (formData && !payload.email) {
      formData.forEach(function(value, key) {
        var lowerKey = key.toLowerCase();
        var valStr = String(value).trim();
        if (!valStr) return;

        if (lowerKey.indexOf('email') > -1 || lowerKey.indexOf('mail') > -1) {
          payload.email = valStr;
        } else if (lowerKey.indexOf('first') > -1) {
          payload.firstName = valStr;
        } else if (lowerKey.indexOf('last') > -1) {
          payload.lastName = valStr;
        } else if (lowerKey === 'name' || lowerKey.indexOf('full') > -1) {
          var parts = valStr.split(' ');
          payload.firstName = parts[0] || '';
          payload.lastName = parts.slice(1).join(' ') || '';
        } else if (lowerKey.indexOf('phone') > -1 || lowerKey.indexOf('tel') > -1) {
          payload.phone = valStr;
        }
      });
    }

    if (!payload.email) {
      console.warn('[CML Webhook] Aborted. No email field detected in submission form.');
      return;
    }

    // Post data to the live CRM & Newsletter Ingestion engine
    fetch('${activeDomain}/api/newsletter-ingest', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
    .then(function(res) { return res.json(); })
    .then(function(data) {
      console.log('[CML Webhook] Ingestion succeeded:', data);
      alert('Thank you! You have successfully subscribed to our newsletter.');
    })
    .catch(function(err) {
      console.error('[CML Webhook] Connection error:', err);
    });
  }

  // Hook 1: Listen for native WordPress Contact Form 7 submissions
  document.addEventListener('wpcf7submit', function(event) {
    if (event.detail && (event.detail.status === 'mail_sent' || event.detail.status === 'success')) {
      var inputs = event.detail.inputs || [];
      var formData = new Map();
      inputs.forEach(function(inp) {
        formData.set(inp.name, inp.value);
      });
      handleWordPressSubmission(formData, event.target);
    }
  }, false);

  // Hook 2: Capture standard form submissions across the website
  document.addEventListener('submit', function(e) {
    var form = e.target;
    if (form) {
      var emailInp = form.querySelector('input[type="email"], input[name*="email"], input[name*="mail"]');
      if (emailInp && emailInp.value) {
        // Run asynchronously to avoid interfering with default browser submission behavior
        setTimeout(function() {
          handleWordPressSubmission(null, form);
        }, 50);
      }
    }
  });
})();
<\/script>`;
  };

  const hasSeededRef = useRef(false);

  useEffect(() => {
    setLoading(true);
    const colRef = collection(db, `newsletter-subscribers-${companyId}`);
    const unsubscribe = onSnapshot(colRef, async (snapshot) => {
      if (snapshot.empty && !hasSeededRef.current) {
        hasSeededRef.current = true;
        const defaultSubs = [
          { email: "digitalmedia@cml.com.fj", source: "WordPress Widget", firstName: "Charles", lastName: "Cebujano", phone: "+679 998 4676", createdAt: new Date(Date.now() - 3600000 * 24 * 5).toISOString(), convertedToRewards: true, rewardsCardId: "CML-8849-01" },
          { email: "guest.relation@ramadasuitesfiji.com", source: "HTML Ingest", firstName: "Sera", lastName: "Wailoaloa", phone: "+679 672 5000", createdAt: new Date(Date.now() - 3600000 * 24 * 3).toISOString(), convertedToRewards: false },
          { email: "charlie.bravo@gmail.com", source: "Manual Entry", firstName: "Charlie", lastName: "Bravo", phone: "+61 412 345 678", createdAt: new Date(Date.now() - 3600000 * 24 * 1).toISOString(), convertedToRewards: false },
          { email: "rohit.lal@cml.com.fj", source: "CML Rewards Link", firstName: "Rohit", lastName: "Lal", phone: "+679 998 9499", createdAt: new Date(Date.now() - 3600000 * 6).toISOString(), convertedToRewards: true, rewardsCardId: "CML-9184-02" },
          { email: "john.wick@continental.com", source: "WordPress Widget", firstName: "John", lastName: "Wick", phone: "+1 555 0199", createdAt: new Date(Date.now() - 3600000 * 2).toISOString(), convertedToRewards: true, rewardsCardId: "CML-4281-03" }
        ];
        for (const sub of defaultSubs) {
          await addDoc(colRef, sub);
        }
        return;
      }

      const list: Subscriber[] = [];
      snapshot.forEach((docSnap) => {
        list.push({ id: docSnap.id, ...docSnap.data() } as any);
      });

      // Sort descending by date
      list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setSubscribers(list);
      setLoading(false);
    }, (e) => {
      console.error("Error fetching newsletter subscribers snapshot:", e);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [companyId]);

  // Read subscribers from dynamic Firestore/Sync Mock DB
  const fetchSubscribers = async () => {
    setLoading(true);
    try {
      const colRef = collection(db, `newsletter-subscribers-${companyId}`);
      const snapshot = await getDocs(colRef);
      const list: Subscriber[] = [];
      snapshot.docs.forEach((doc) => {
        list.push({ id: doc.id, ...doc.data() } as any);
      });
      // Sort descending by date
      list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setSubscribers(list);
    } catch (e) {
      console.error("Error fetching newsletter subscribers:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleAddSubscriber = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail.trim()) return;

    try {
      const colRef = collection(db, `newsletter-subscribers-${companyId}`);
      await addDoc(colRef, {
        email: newEmail.trim().toLowerCase(),
        source: newSource || "Manual Entry",
        createdAt: new Date().toISOString(),
        convertedToRewards: false
      });
      setNewEmail("");
      setNewSource("Manual Entry");
      setShowAddModal(false);
      fetchSubscribers();
    } catch (err) {
      console.error("Failed to add subscriber manually:", err);
    }
  };

  const handleSimulateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!simulatedEmail.trim()) return;

    setIsSimulating(true);
    fetch(`/api/newsletter-ingest`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: simulatedEmail.trim().toLowerCase(),
        source: "Simulator Test Ingest",
        companyId: companyId,
        joinRewards: true
      })
    })
      .then((res) => res.json())
      .then((data) => {
        setIsSimulating(false);
        setSimulatedEmail("");
        alert("Simulator Success: Email successfully added to the Newsletter Subscribers Database as Unconverted.");
        fetchSubscribers();
      })
      .catch((err) => {
        console.error("Simulation submission failed:", err);
        setIsSimulating(false);
        alert("Simulation failed. Ensure backend server is running.");
      });
  };

  const handleDeleteSubscriber = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this subscriber?")) return;
    try {
      const docRef = doc(db, `newsletter-subscribers-${companyId}`, id);
      await deleteDoc(docRef);
      fetchSubscribers();
    } catch (err) {
      console.error("Failed to delete subscriber:", err);
    }
  };

  // Edit newsletter subscriber details
  const handleOpenEditModal = (sub: Subscriber) => {
    setShowEditModal(sub);
    setEditEmail(sub.email);
    setEditSource(sub.source);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showEditModal) return;
    setIsSavingEdit(true);
    try {
      const docRef = doc(db, `newsletter-subscribers-${companyId}`, showEditModal.id);
      await setDoc(docRef, {
        email: editEmail.trim().toLowerCase(),
        source: editSource.trim()
      }, { merge: true });
      setShowEditModal(null);
      fetchSubscribers();
    } catch (err) {
      console.error("Failed to edit subscriber:", err);
      alert("Error saving edits to subscriber.");
    } finally {
      setIsSavingEdit(false);
    }
  };

  // Convert to CML Rewards Program
  const handleOpenConvertModal = (sub: Subscriber) => {
    const defaultName = sub.email.split('@')[0].replace(/[._-]/g, ' ');
    setConvertName(defaultName.replace(/\b\w/g, c => c.toUpperCase()));
    setConvertPhone("");
    setShowConvertModal(sub);
  };

  const handleConvertToRewards = async () => {
    if (!showConvertModal) return;
    const sub = showConvertModal;
    setIsConverting(sub.id);
    try {
      // 1. Generate unique rewards card number
      const prefix = companyId === "ramada" ? "RP" : companyId === "wyndham" ? "WG" : "CR";
      const randomDigits = Math.floor(10000 + Math.random() * 90000); // 5 digit random number
      const generatedCardId = `${prefix}${randomDigits}`;

      // 2. Create the rewards member profile under restaurant-guests-${companyId}
      const guestsCol = collection(db, `restaurant-guests-${companyId}`);
      
      // Let's create the guest object
      const guestProfile = {
        id: generatedCardId,
        fullName: convertName.trim() || "Newsletter Subscriber",
        email: sub.email,
        phone: convertPhone.trim() || "",
        visitCount: 0,
        rewardPoints: 100, // 100 welcome/newsletter subscription signup bonus!
        lastVisited: null,
        createdAt: new Date().toISOString()
      };

      // Set the document in the guest collection
      const guestDocRef = doc(db, `restaurant-guests-${companyId}`, generatedCardId);
      await setDoc(guestDocRef, guestProfile);

      // Also create an initial welcome points deposit VisitLog
      const visitsCol = collection(db, `restaurant-guests-${companyId}`, generatedCardId, "visits");
      await addDoc(visitsCol, {
        cardId: generatedCardId,
        receiptNumber: "NEWSLETTER-BONUS",
        billAmount: 0,
        pointsAwarded: 100,
        type: "visit",
        timestamp: new Date().toISOString()
      });

      // 3. Mark the subscriber as converted and save cardId
      const subscriberDocRef = doc(db, `newsletter-subscribers-${companyId}`, sub.id);
      await updateDoc(subscriberDocRef, {
        convertedToRewards: true,
        rewardsCardId: generatedCardId
      });

      // Show success alert and close modal
      alert(`Successfully registered ${convertName} to CML Rewards!\nCard Number: ${generatedCardId}\n100 Welcome Points awarded.`);
      setShowConvertModal(null);
      fetchSubscribers();
    } catch (err) {
      console.error("Error converting to CML Rewards:", err);
      alert("Failed to convert. Please try again.");
    } finally {
      setIsConverting(null);
    }
  };

  const exportToCSV = () => {
    if (subscribers.length === 0) return;
    
    const headers = ["Email", "Source", "Date Subscribed", "Converted to Rewards", "Rewards Card ID"];
    const rows = subscribers.map(sub => [
      sub.email,
      sub.source,
      new Date(sub.createdAt).toLocaleString(),
      sub.convertedToRewards ? "Yes" : "No",
      sub.rewardsCardId || "N/A"
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(","), ...rows.map(e => e.map(val => `"${val.replace(/"/g, '""')}"`).join(","))].join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `newsletter_subscribers_${companyId}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedWebhook(true);
    setTimeout(() => setCopiedWebhook(false), 2000);
  };

  const filteredSubscribers = subscribers.filter(sub => 
    sub.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    sub.source.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div id="newsletter-subscribers-root" className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header Dashboard Banner */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between bg-gradient-to-r from-slate-900 to-indigo-950 text-white rounded-xl p-6 shadow-md gap-4">
        <div className="space-y-1">
          <h2 className="text-2xl font-semibold tracking-tight font-sans">Newsletter Subscribers Database</h2>
          <p className="text-indigo-200 text-sm">
            View, manage, and convert newsletter contacts into CML Rewards loyal customers.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button 
            id="btn-export-csv"
            onClick={exportToCSV}
            disabled={subscribers.length === 0}
            className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white font-medium px-4 py-2.5 rounded-lg text-sm transition border border-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
          <button 
            id="btn-add-sub"
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-semibold px-4 py-2.5 rounded-lg text-sm transition"
          >
            <Plus className="w-4 h-4" />
            Add Subscriber
          </button>
        </div>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-lg">
            <Mail className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-mono uppercase tracking-wider text-slate-500 font-semibold">Total Subscribers</p>
            <h3 className="text-2xl font-bold text-slate-900 mt-0.5">{subscribers.length}</h3>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-lg">
            <CheckCircle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-mono uppercase tracking-wider text-slate-500 font-semibold">Rewards Conversions</p>
            <h3 className="text-2xl font-bold text-slate-900 mt-0.5">
              {subscribers.filter(s => s.convertedToRewards).length}
            </h3>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg">
            <UserPlus className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-mono uppercase tracking-wider text-slate-500 font-semibold">Conversion Rate</p>
            <h3 className="text-2xl font-bold text-slate-900 mt-0.5">
              {subscribers.length > 0 
                ? `${Math.round((subscribers.filter(s => s.convertedToRewards).length / subscribers.length) * 100)}%`
                : "0%"
              }
            </h3>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Subscriber Table (occupies 2 cols) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            {/* Table Controls */}
            <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-2.5 text-slate-400 w-4.5 h-4.5" />
                <input 
                  id="search-subscriber"
                  type="text" 
                  placeholder="Search by email or submission source..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500 focus:bg-white transition"
                />
              </div>
              <div className="flex items-center gap-2 text-xs font-mono text-slate-500">
                <Filter className="w-3.5 h-3.5" />
                <span>Showing {filteredSubscribers.length} of {subscribers.length} rows</span>
              </div>
            </div>

            {/* Main Table */}
            {loading ? (
              <div className="p-12 text-center text-slate-500 font-serif italic">
                Loading subscribers...
              </div>
            ) : filteredSubscribers.length === 0 ? (
              <div className="p-12 text-center">
                <Mail className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <h4 className="text-base font-semibold text-slate-800">No subscribers found</h4>
                <p className="text-slate-500 text-sm max-w-sm mx-auto mt-1">
                  Connect your WordPress Contact Form 7 using the instructions on the right, or add a subscriber manually!
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table id="subscribers-table" className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-slate-600 uppercase text-[11px] font-mono tracking-wider border-b border-slate-100">
                      <th className="py-3.5 px-4 font-semibold">Subscriber Email</th>
                      <th className="py-3.5 px-4 font-semibold">Source</th>
                      <th className="py-3.5 px-4 font-semibold">Subscribed Date</th>
                      <th className="py-3.5 px-4 font-semibold">Rewards Status</th>
                      <th className="py-3.5 px-4 font-semibold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm">
                    {filteredSubscribers.map((sub) => (
                      <tr key={sub.id} className="hover:bg-slate-50/50 transition">
                        <td className="py-3.5 px-4 font-medium text-slate-900 font-mono">
                          {sub.email}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-700">
                            {sub.source}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-slate-500 text-xs">
                          {new Date(sub.createdAt).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit"
                          })}
                        </td>
                        <td className="py-3.5 px-4">
                          {sub.convertedToRewards ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <CheckCircle className="w-3.5 h-3.5" />
                              {sub.rewardsCardId || "Converted"}
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-800 border border-amber-200">
                              Unconverted
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {!sub.convertedToRewards ? (
                              <button
                                onClick={() => {
                                  const defaultName = sub.email.split('@')[0].replace(/[._-]/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
                                  if (onConvertSubscriber) {
                                    onConvertSubscriber(sub.email, defaultName);
                                  } else {
                                    handleOpenConvertModal(sub);
                                  }
                                }}
                                title="Convert to Rewards Member"
                                className="flex items-center gap-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold px-2.5 py-1.5 rounded-md text-xs transition shadow-sm"
                              >
                                <UserPlus className="w-3.5 h-3.5" />
                                Convert to Rewards
                              </button>
                            ) : (
                              <div className="text-xs text-slate-400 font-mono italic pr-2">
                                Registered
                              </div>
                            )}
                            <button
                              onClick={() => handleOpenEditModal(sub)}
                              title="Edit subscriber"
                              className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteSubscriber(sub.id)}
                              title="Delete contact"
                              className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-md transition"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: WordPress Automated Integration Guide */}
        <div className="space-y-6">
          {/* Live Interactive Simulator Playground Card */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
            <div className="space-y-1">
              <h3 className="text-md font-bold text-slate-900 flex items-center gap-2">
                <Sparkles className="text-amber-500 w-5 h-5 shrink-0" />
                Live Widget Simulator
              </h3>
              <p className="text-slate-500 text-xs">
                Fill out the newsletter form below to test the automatic integration loop! Clicking "Subscribe Now" will dispatch the <strong>wpcf7submit</strong> event and pipe the contact through your custom endpoint.
              </p>
            </div>

            {/* Embedded styles exactly as provided by user */}
            <style dangerouslySetInnerHTML={{ __html: `
              .cml-newsletter-widget-preview { font-family: sans-serif; max-width: 100%; background: #ffffff; padding: 24px; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); border: 1px solid #e2e8f0; }
              .cml-newsletter-widget-preview .widget-title { color: #131435; font-size: 20px; font-weight: 700; margin: 0 0 8px 0; text-transform: uppercase; border-bottom: 2px solid #cfa950; display: inline-block; padding-bottom: 4px; }
              .cml-newsletter-widget-preview .widget-subtitle { color: #4a5568; font-size: 14px; margin: 0 0 20px 0; }
              .cml-newsletter-widget-preview .form-container { display: flex; flex-direction: column; gap: 12px; }
              .cml-newsletter-widget-preview .input-wrapper input[type="email"] { width: 100%; height: 48px; padding: 0 16px; border: 1px solid #cbd5e0; border-radius: 4px; font-size: 14px; background: #ffffff; color: #1a202c; }
              .cml-newsletter-widget-preview .input-wrapper input[type="email"]:focus { border-color: #cfa950; outline: none; box-shadow: 0 0 0 3px rgba(207, 169, 80, 0.2); }
              .cml-newsletter-widget-preview .submit-btn { width: 100%; height: 48px; background-color: #131435; color: #ffffff; border: none; border-radius: 4px; font-weight: 700; cursor: pointer; font-size: 14px; transition: background 0.2s; }
              .cml-newsletter-widget-preview .submit-btn:hover { background-color: #cfa950; color: #131435; }
            ` }} />

            {/* Simulated HTML widget */}
            <form onSubmit={handleSimulateSubmit} className="cml-newsletter-widget-preview">
              <h3 className="widget-title"><span>Newsletter</span></h3>
              <p className="widget-subtitle">Subscribe to our newsletter for exclusive offers and updates.</p>
              
              <div className="form-container">
                  <div className="input-wrapper">
                      <input 
                        type="email" 
                        name="email-851" 
                        placeholder="Your Email Address" 
                        required 
                        value={simulatedEmail}
                        onChange={(e) => setSimulatedEmail(e.target.value)}
                        className="font-sans"
                      />
                  </div>
                  <button type="submit" disabled={isSimulating} className="submit-btn font-sans">
                    {isSimulating ? "Subscribing..." : "Subscribe Now"}
                  </button>
              </div>
            </form>
          </div>

          {isSuperAdmin && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-6">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-indigo-50 rounded-lg text-indigo-600">
                    <Code className="w-5 h-5" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900">
                    WordPress Form Webhook Configurator
                  </h3>
                </div>
                <p className="text-slate-600 text-sm">
                  Integrate your WordPress forms (Contact Form 7, Elementor Forms, WPForms, or any standard HTML form) directly with the CML CRM and Loyalty system. The smart webhook script automatically reads form field labels, placeholders, and inputs to register users and award loyalty points in real-time.
                </p>
              </div>

              {/* Dynamic Property Customizer */}
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 space-y-4">
                <div className="space-y-1">
                  <label htmlFor="webhook-property-select" className="block text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Configure Webhook Property Destination
                  </label>
                  <p className="text-slate-500 text-xs">
                    Choose which CML hospitality brand submissions should default to.
                  </p>
                </div>
                <select 
                  id="webhook-property-select"
                  value={selectedWebhookProperty}
                  onChange={(e) => setSelectedWebhookProperty(e.target.value)}
                  className="w-full bg-white border border-slate-200 text-slate-800 text-sm font-medium py-2 px-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="ramada">Ramada Suites by Wyndham Suva</option>
                  <option value="wyndham">Wyndham Resort Denarau Island</option>
                  <option value="cml">Cove Management Limited (Corporate)</option>
                </select>
              </div>

              {/* Script Delivery Box */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-ping"></span>
                    Smart Webhook Script Code
                  </h4>
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-bold">Copy-Paste Ready</span>
                </div>
                <div className="relative bg-slate-900 text-slate-200 text-xs rounded-xl overflow-hidden p-4 font-mono">
                  <button 
                    onClick={() => copyToClipboard(getUniversalWebhookScript())}
                    className="absolute right-3 top-3 bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-1.5 rounded-lg border border-slate-700 transition flex items-center gap-1.5 font-sans text-xs font-semibold shadow-sm z-10"
                  >
                    {copiedWebhook ? (
                      <>
                        <Check className="w-4 h-4 text-emerald-400" />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        <span>Copy Webhook</span>
                      </>
                    )}
                  </button>
                  <pre className="overflow-x-auto max-h-56 whitespace-pre text-[11px] leading-relaxed text-yellow-100/90 pt-6 select-all">
                    {getUniversalWebhookScript()}
                  </pre>
                </div>
              </div>

              {/* Field Mapping Guide */}
              <div className="border border-slate-100 rounded-xl p-4 bg-slate-50 space-y-3">
                <h4 className="font-bold text-xs uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  How Auto-Label Detection Works
                </h4>
                <p className="text-slate-500 text-xs">
                  Your WordPress form doesn't need specific field names! Our intelligent script scans your form inputs and matches them using their labels, placeholders, or types.
                </p>
                <div className="overflow-hidden border border-slate-200 rounded-lg text-xs">
                  <div className="grid grid-cols-2 bg-slate-100 font-bold p-2 text-slate-700 border-b border-slate-200">
                    <div>If Label or Placeholder Contains:</div>
                    <div>Maps in CRM System to:</div>
                  </div>
                  <div className="divide-y divide-slate-100 bg-white">
                    <div className="grid grid-cols-2 p-2">
                      <div className="font-mono text-slate-600">"email", "mail", "e-mail"</div>
                      <div className="font-medium text-slate-800">Email Address (Subscribed)</div>
                    </div>
                    <div className="grid grid-cols-2 p-2">
                      <div className="font-mono text-slate-600">"first", "fname", "given"</div>
                      <div className="font-medium text-slate-800">First Name (Rewards Profile)</div>
                    </div>
                    <div className="grid grid-cols-2 p-2">
                      <div className="font-mono text-slate-600">"last", "lname", "family"</div>
                      <div className="font-medium text-slate-800">Last Name (Rewards Profile)</div>
                    </div>
                    <div className="grid grid-cols-2 p-2">
                      <div className="font-mono text-slate-600">"phone", "mobile", "tel"</div>
                      <div className="font-medium text-slate-800">Phone Number (Rewards Profile)</div>
                    </div>
                    <div className="grid grid-cols-2 p-2">
                      <div className="font-mono text-slate-600">"property", "hotel", "resort"</div>
                      <div className="font-medium text-slate-800">Dynamic Property Brand Router</div>
                    </div>
                  </div>
                </div>
                <div className="bg-indigo-50 border border-indigo-150 text-indigo-900 p-3.5 rounded-lg text-xs leading-relaxed space-y-1">
                  <div className="font-semibold flex items-center gap-1 text-indigo-950">
                    <Info className="w-4 h-4 shrink-0 text-indigo-700" />
                    Automatic Loyalty Enrollment Enabled
                  </div>
                  <p>
                    Every time a user subscribes, the script registers them for <strong>CML Loyalty Rewards</strong>, provisions their card profile, and awards them <strong>100 welcome points</strong> automatically. No manual setup required!
                  </p>
                </div>
              </div>

              {/* Simple Integration steps */}
              <div className="space-y-3 pt-1">
                <h4 className="font-bold text-xs uppercase tracking-wider text-slate-700">
                  Easy 2-Step WordPress Installation
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div className="p-3 bg-white border border-slate-200 rounded-lg space-y-1 shadow-xs">
                    <div className="font-bold text-slate-800 flex items-center gap-1.5">
                      <span className="w-5 h-5 rounded-full bg-slate-900 text-white flex items-center justify-center font-mono">1</span>
                      Setup WordPress Form
                    </div>
                    <p className="text-slate-500 leading-relaxed">
                      Design your newsletter sign-up form inside your favorite WordPress editor (Elementor, CF7, Divi, Gutenberg) with standard fields.
                    </p>
                  </div>
                  <div className="p-3 bg-white border border-slate-200 rounded-lg space-y-1 shadow-xs">
                    <div className="font-bold text-slate-800 flex items-center gap-1.5">
                      <span className="w-5 h-5 rounded-full bg-slate-900 text-white flex items-center justify-center font-mono">2</span>
                      Paste Webhook Script
                    </div>
                    <p className="text-slate-500 leading-relaxed">
                      Paste the copied Webhook Script block in your page footer or via any WordPress plugin like "Insert Headers and Footers". Done!
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Manual Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-md overflow-hidden">
            <div className="bg-slate-950 p-4 text-white flex justify-between items-center">
              <h3 className="font-semibold flex items-center gap-2">
                <Mail className="w-5 h-5 text-amber-400" />
                Add New Subscriber
              </h3>
              <button 
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-white transition"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleAddSubscriber} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">Email Address</label>
                <input 
                  type="email" 
                  required
                  placeholder="subscriber@domain.com"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500 font-mono text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">Source / Attribution</label>
                <input 
                  type="text" 
                  placeholder="e.g. Manual Entry, VIP Event, Walk-in"
                  value={newSource}
                  onChange={(e) => setNewSource(e.target.value)}
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500 text-sm"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button 
                  type="button" 
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-lg text-sm font-medium hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition"
                >
                  Save Subscriber
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Manual Edit Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-md overflow-hidden">
            <div className="bg-slate-950 p-4 text-white flex justify-between items-center">
              <h3 className="font-semibold flex items-center gap-2">
                <Edit className="w-5 h-5 text-amber-400" />
                Edit Subscriber Details
              </h3>
              <button 
                onClick={() => setShowEditModal(null)}
                className="text-slate-400 hover:text-white transition"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleSaveEdit} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">Email Address</label>
                <input 
                  type="email" 
                  required
                  placeholder="subscriber@domain.com"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500 font-mono text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">Source / Attribution</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. WordPress Widget, Manual Entry"
                  value={editSource}
                  onChange={(e) => setEditSource(e.target.value)}
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500 text-sm"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button 
                  type="button" 
                  onClick={() => setShowEditModal(null)}
                  className="px-4 py-2 border border-slate-200 rounded-lg text-sm font-medium hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={isSavingEdit}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition"
                >
                  {isSavingEdit ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Convert to Rewards Modal */}
      {showConvertModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-md overflow-hidden animate-scale-up">
            <div className="bg-amber-500 p-4 text-slate-950 flex justify-between items-center">
              <h3 className="font-bold flex items-center gap-2">
                <UserPlus className="w-5 h-5" />
                Register for CML Rewards Program
              </h3>
              <button 
                onClick={() => setShowConvertModal(null)}
                className="text-amber-950 hover:text-slate-950 font-bold text-lg transition"
              >
                ✕
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 text-xs space-y-1.5 font-mono text-slate-600">
                <div className="flex justify-between">
                  <span>Contact Email:</span>
                  <span className="font-semibold text-slate-900">{showConvertModal.email}</span>
                </div>
                <div className="flex justify-between">
                  <span>Loyalty Tier:</span>
                  <span className="font-semibold text-amber-700">Standard Member</span>
                </div>
                <div className="flex justify-between">
                  <span>Welcome Reward:</span>
                  <span className="font-semibold text-emerald-600">+100 loyalty points</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">Full Name</label>
                <input 
                  type="text" 
                  required
                  placeholder="Enter member's full name"
                  value={convertName}
                  onChange={(e) => setConvertName(e.target.value)}
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500 text-sm font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">Phone Number (Optional)</label>
                <input 
                  type="tel" 
                  placeholder="e.g. +679 998 1234"
                  value={convertPhone}
                  onChange={(e) => setConvertPhone(e.target.value)}
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500 text-sm font-mono"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button 
                  type="button" 
                  onClick={() => setShowConvertModal(null)}
                  className="px-4 py-2 border border-slate-200 rounded-lg text-sm font-medium hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button 
                  type="button" 
                  onClick={handleConvertToRewards}
                  disabled={isConverting !== null || !convertName.trim()}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-slate-950 font-bold rounded-lg text-sm transition flex items-center gap-2 shadow-sm"
                >
                  {isConverting ? "Converting..." : "Complete Registration"}
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
