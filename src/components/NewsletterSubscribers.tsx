import React, { useState, useEffect } from "react";
import { 
  collection, 
  getDocs, 
  addDoc, 
  deleteDoc, 
  doc, 
  updateDoc,
  setDoc
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
  Edit
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
  const [copiedScript, setCopiedScript] = useState(false);
  const [copiedHtml, setCopiedHtml] = useState(false);
  const [copiedIframe, setCopiedIframe] = useState(false);
  const [copiedCorporate, setCopiedCorporate] = useState(false);
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

  // HTML Widget code to display
  const widgetHtml = `<div class="cml-newsletter-widget">
    <h3 class="widget-title"><span>Newsletter</span></h3>
    <p class="widget-subtitle">Subscribe to our newsletter for exclusive offers and updates.</p>
    
    <div class="form-container">
        <div class="input-wrapper">
            <input type="email" name="email-851" placeholder="Your Email Address" required />
        </div>
        <button type="submit" class="submit-btn">Subscribe Now</button>
    </div>
</div>

<style>
    .cml-newsletter-widget { font-family: sans-serif; max-width: 360px; background: #ffffff; padding: 24px; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
    .cml-newsletter-widget .widget-title { color: #131435; font-size: 20px; font-weight: 700; margin: 0 0 8px 0; text-transform: uppercase; border-bottom: 2px solid #cfa950; display: inline-block; padding-bottom: 4px; }
    .cml-newsletter-widget .widget-subtitle { color: #4a5568; font-size: 14px; margin: 0 0 20px 0; }
    .cml-newsletter-widget .form-container { display: flex; flex-direction: column; gap: 12px; }
    .cml-newsletter-widget .input-wrapper input[type="email"] { width: 100%; height: 48px; padding: 0 16px; border: 1px solid #cbd5e0; border-radius: 4px; font-size: 14px; }
    .cml-newsletter-widget .input-wrapper input[type="email"]:focus { border-color: #cfa950; outline: none; box-shadow: 0 0 0 3px rgba(207, 169, 80, 0.2); }
    .cml-newsletter-widget .submit-btn { width: 100%; height: 48px; background-color: #131435; color: #ffffff; border: none; border-radius: 4px; font-weight: 700; cursor: pointer; font-size: 14px; transition: background 0.2s; }
    .cml-newsletter-widget .submit-btn:hover { background-color: #cfa950; }
</style>`;

  // Javascript webhook code with the dynamic server host
  const webhookJs = `<script>
document.addEventListener('DOMContentLoaded', function() {
  // 1. Contact Form 7 Native AJAX Event Listener
  document.addEventListener('wpcf7submit', function(event) {
    if (event.detail && (event.detail.status === 'mail_sent' || event.detail.status === 'success')) {
      var inputs = event.detail.inputs || [];
      var subscriberEmail = '';
      for (var i = 0; i < inputs.length; i++) {
        if (inputs[i].name === 'email-851') {
          subscriberEmail = inputs[i].value;
          break;
        }
      }
      if (subscriberEmail) {
        sendNewsletterToRegistry(subscriberEmail, 'Website CF7 Submission');
      }
    }
  }, false);

  // 2. Direct Fallback Form & Click Interception (Handles raw HTML widgets or broken form configurations)
  function setupDirectBinding() {
    var emailInput = document.querySelector('input[name="email-851"]');
    if (!emailInput) return;

    var form = emailInput.closest('form');
    if (form) {
      form.addEventListener('submit', function(e) {
        var emailVal = emailInput.value.trim();
        if (emailVal) {
          sendNewsletterToRegistry(emailVal, 'Website Form Interceptor');
        }
      });
    } else {
      // If there is no wrapping <form> element (e.g. raw HTML widget), bind click handler to the button
      var submitBtn = emailInput.closest('.cml-newsletter-widget')?.querySelector('.submit-btn') || 
                       emailInput.closest('.form-container')?.querySelector('button') ||
                       document.querySelector('.submit-btn');
      
      if (submitBtn) {
        submitBtn.addEventListener('click', function(e) {
          e.preventDefault();
          var emailVal = emailInput.value.trim();
          if (emailVal && emailVal.indexOf('@') !== -1) {
            submitBtn.disabled = true;
            var originalText = submitBtn.innerText;
            submitBtn.innerText = 'Subscribing...';
            
            fetch('${activeDomain}/api/newsletter-ingest', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                email: emailVal,
                source: 'Direct HTML Widget',
                companyId: '${companyId}'
              })
            })
            .then(function(res) { return res.json(); })
            .then(function(data) {
              submitBtn.innerText = 'Subscribed!';
              alert('Thank you! You have subscribed successfully.');
              emailInput.value = '';
              setTimeout(function() {
                submitBtn.disabled = false;
                submitBtn.innerText = originalText;
              }, 4000);
            })
            .catch(function(err) {
              submitBtn.disabled = false;
              submitBtn.innerText = originalText;
              alert('Subscribed successfully!');
            });
          } else {
            alert('Please enter a valid email address.');
          }
        });
      }
    }
  }

  function sendNewsletterToRegistry(email, source) {
    fetch('${activeDomain}/api/newsletter-ingest', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: email,
        source: source,
        companyId: '${companyId}'
      })
    })
    .then(function(res) { return res.json(); })
    .then(function(data) {
      console.log('Newsletter synced successfully:', data);
    })
    .catch(function(err) {
      console.error('Newsletter syncing error:', err);
    });
  }

  setupDirectBinding();
  setTimeout(setupDirectBinding, 1000);
  setTimeout(setupDirectBinding, 3000);
});
</script>`;

  const embedUrl = typeof window !== "undefined" ? `${window.location.origin}/embed-newsletter/${companyId}` : "";
  const iframeCode = `<iframe src="${embedUrl}" width="100%" height="450px" style="border:none; background:transparent; overflow:hidden;" scrolling="no" loading="lazy" referrerpolicy="no-referrer"></iframe>`;

  const corporateWidgetCode = `<div class="cml-corporate-newsletter-widget">
    <div class="widget-header">
        <h3 class="widget-title">CML Hospitality Group</h3>
        <p class="widget-subtitle">Subscribe to our newsletter & exclusive rewards program</p>
    </div>
    
    <form id="cml-newsletter-form" class="form-container">
        <!-- Email Field (Required) -->
        <div class="form-group">
            <label for="cml-email">Email Address <span class="required">*</span></label>
            <input type="email" id="cml-email" name="email" placeholder="email@address.com" required />
        </div>

        <!-- Optional Loyalty Program Enrollment Checkbox -->
        <div class="checkbox-row">
            <input type="checkbox" id="cml-join-rewards" name="joinRewards" checked />
            <label for="cml-join-rewards" class="checkbox-label">
                Join <strong>CML Loyalty Rewards</strong> & earn <strong>100 Welcome Points</strong>!
            </label>
        </div>

        <!-- Collapsible Name & Phone fields (Revealed when Join Rewards is checked) -->
        <div id="cml-loyalty-fields" class="collapsible-section">
            <div class="form-row">
                <div class="form-group">
                    <label for="cml-first-name">First Name <span class="required">*</span></label>
                    <input type="text" id="cml-first-name" name="firstName" placeholder="First Name" required />
                </div>
                <div class="form-group">
                    <label for="cml-last-name">Last Name <span class="required">*</span></label>
                    <input type="text" id="cml-last-name" name="lastName" placeholder="Last Name" required />
                </div>
            </div>

            <!-- Phone Field -->
            <div class="form-group">
                <label for="cml-phone">Phone Number</label>
                <input type="text" id="cml-phone" name="phone" placeholder="+679..." />
            </div>
        </div>

        <!-- Preferred Property Selector -->
        <div class="form-group">
            <label for="cml-property">Select Property <span class="required">*</span></label>
            <select id="cml-property" name="companyId" required>
                <option value="cml">Cove Management Limited (CML)</option>
                <option value="ramada">Ramada Suites by Wyndham Suva</option>
                <option value="wyndham">Wyndham Resort Denarau Island</option>
            </select>
        </div>

        <button type="submit" id="cml-submit-btn" class="submit-btn">Subscribe & Enroll</button>
        <div id="cml-form-feedback" class="form-feedback"></div>
    </form>
</div>

<style>
    .cml-corporate-newsletter-widget {
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
        max-width: 480px;
        margin: 0 auto;
        background: #ffffff;
        padding: 32px;
        border-radius: 12px;
        box-shadow: 0 10px 25px rgba(19, 20, 53, 0.08);
        border: 1px solid #e2e8f0;
    }
    .cml-corporate-newsletter-widget .widget-header {
        text-align: center;
        margin-bottom: 24px;
        border-bottom: 2px solid #C5A02D;
        padding-bottom: 16px;
    }
    .cml-corporate-newsletter-widget .widget-title {
        color: #131435;
        font-size: 22px;
        font-weight: 800;
        margin: 0 0 6px 0;
        text-transform: uppercase;
        letter-spacing: 0.5px;
    }
    .cml-corporate-newsletter-widget .widget-subtitle {
        color: #64748b;
        font-size: 13px;
        margin: 0;
        line-height: 1.4;
    }
    .cml-corporate-newsletter-widget .form-container {
        display: flex;
        flex-direction: column;
        gap: 16px;
    }
    .cml-corporate-newsletter-widget .form-row {
        display: flex;
        gap: 12px;
    }
    .cml-corporate-newsletter-widget .form-group {
        display: flex;
        flex-direction: column;
        gap: 6px;
        flex: 1;
    }
    .cml-corporate-newsletter-widget label {
        font-size: 11px;
        font-weight: 700;
        color: #131435;
        text-transform: uppercase;
        letter-spacing: 0.5px;
    }
    .cml-corporate-newsletter-widget .required {
        color: #ef4444;
    }
    .cml-corporate-newsletter-widget input,
    .cml-corporate-newsletter-widget select {
        width: 100%;
        height: 44px;
        padding: 0 14px;
        border: 1px solid #cbd5e1;
        border-radius: 6px;
        font-size: 13px;
        background-color: #f8fafc;
        color: #0f172a;
        transition: all 0.2s ease-in-out;
        box-sizing: border-box;
    }
    .cml-corporate-newsletter-widget input:focus,
    .cml-corporate-newsletter-widget select:focus {
        border-color: #C5A02D;
        background-color: #ffffff;
        outline: none;
        box-shadow: 0 0 0 3px rgba(197, 160, 45, 0.15);
    }
    .cml-corporate-newsletter-widget .checkbox-row {
        display: flex;
        align-items: center;
        gap: 10px;
        background: #f8fafc;
        padding: 12px;
        border-radius: 6px;
        border: 1px solid #e2e8f0;
    }
    .cml-corporate-newsletter-widget .checkbox-row input[type="checkbox"] {
        width: 18px;
        height: 18px;
        accent-color: #C5A02D;
        cursor: pointer;
    }
    .cml-corporate-newsletter-widget .checkbox-label {
        font-size: 12px;
        font-weight: 500;
        color: #334155;
        text-transform: none;
        letter-spacing: 0;
        cursor: pointer;
    }
    .cml-corporate-newsletter-widget .collapsible-section {
        display: flex;
        flex-direction: column;
        gap: 16px;
        overflow: hidden;
        max-height: 500px;
        opacity: 1;
        transition: all 0.3s ease-in-out;
    }
    .cml-corporate-newsletter-widget .collapsible-section.collapsed {
        max-height: 0;
        opacity: 0;
        margin: 0;
        padding: 0;
        pointer-events: none;
    }
    .cml-corporate-newsletter-widget .submit-btn {
        width: 100%;
        height: 46px;
        background-color: #131435;
        color: #ffffff;
        border: none;
        border-radius: 6px;
        font-weight: 700;
        cursor: pointer;
        font-size: 13px;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        transition: all 0.2s ease-in-out;
        margin-top: 8px;
    }
    .cml-corporate-newsletter-widget .submit-btn:hover {
        background-color: #C5A02D;
        color: #131435;
    }
    .cml-corporate-newsletter-widget .form-feedback {
        font-size: 12px;
        text-align: center;
        margin-top: 4px;
        font-weight: 600;
        display: none;
    }
    .cml-corporate-newsletter-widget .form-feedback.success {
        color: #10b981;
        display: block;
    }
    .cml-corporate-newsletter-widget .form-feedback.error {
        color: #ef4444;
        display: block;
    }
</style>

<script>
document.addEventListener('DOMContentLoaded', function() {
    var form = document.getElementById('cml-newsletter-form');
    var submitBtn = document.getElementById('cml-submit-btn');
    var feedback = document.getElementById('cml-form-feedback');
    var joinCheckbox = document.getElementById('cml-join-rewards');
    var loyaltyFields = document.getElementById('cml-loyalty-fields');
    var firstNameInput = document.getElementById('cml-first-name');
    var lastNameInput = document.getElementById('cml-last-name');

    if (!form) return;

    // Toggle loyalty fields collapsible behavior
    if (joinCheckbox && loyaltyFields) {
        joinCheckbox.addEventListener('change', function() {
            if (this.checked) {
                loyaltyFields.classList.remove('collapsed');
                firstNameInput.required = true;
                lastNameInput.required = true;
            } else {
                loyaltyFields.classList.add('collapsed');
                firstNameInput.required = false;
                lastNameInput.required = false;
                firstNameInput.value = '';
                lastNameInput.value = '';
            }
        });
    }

    form.addEventListener('submit', function(e) {
        e.preventDefault();
        
        feedback.className = 'form-feedback';
        feedback.style.display = 'none';
        
        var email = document.getElementById('cml-email').value.trim();
        var companyId = document.getElementById('cml-property').value;
        var joinRewards = joinCheckbox ? joinCheckbox.checked : false;
        
        var firstName = joinRewards ? firstNameInput.value.trim() : '';
        var lastName = joinRewards ? lastNameInput.value.trim() : '';
        var phone = joinRewards ? document.getElementById('cml-phone').value.trim() : '';

        if (!email) {
            feedback.innerText = 'Please enter a valid email address.';
            feedback.className = 'form-feedback error';
            return;
        }

        submitBtn.disabled = true;
        var originalBtnText = submitBtn.innerText;
        submitBtn.innerText = 'PRODUCING PROFILE...';

        fetch('${activeDomain}/api/newsletter-ingest', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: email,
                firstName: firstName,
                lastName: lastName,
                phone: phone,
                joinRewards: joinRewards,
                companyId: companyId,
                source: '3-Property CML Widget'
            })
        })
        .then(function(res) {
            if (!res.ok) throw new Error('Network response was not ok');
            return res.json();
        })
        .then(function(data) {
            feedback.innerHTML = 'Success! Thank you for subscribing to Cove Management Resorts. ' + 
                (joinRewards ? '<br><a href="${activeDomain}/?prefill_email=' + encodeURIComponent(email) + '&prefill_name=' + encodeURIComponent(firstName + ' ' + lastName) + '&company=' + companyId + '" target="_blank" style="color: #C5A02D; font-weight: bold; text-decoration: underline;">Complete Rewards Profile & View Loyalty Card ➔</a>' : '');
            feedback.className = 'form-feedback success';
            form.reset();
            if (joinCheckbox) {
                joinCheckbox.checked = true;
                loyaltyFields.classList.remove('collapsed');
                firstNameInput.required = true;
                lastNameInput.required = true;
            }
        })
        .catch(function(err) {
            console.error('Submission error:', err);
            feedback.innerText = 'Success! Thank you for subscribing to Cove Management Resorts.';
            feedback.className = 'form-feedback success';
            form.reset();
        })
        .finally(function() {
            submitBtn.disabled = false;
            submitBtn.innerText = originalBtnText;
        });
    });
});
</script>`;

  useEffect(() => {
    fetchSubscribers();

    const handleWpcf7Submit = (event: Event) => {
      const customEvent = event as CustomEvent;
      if (customEvent.detail && customEvent.detail.status === "mail_sent") {
        const inputs = customEvent.detail.inputs;
        let subscriberEmail = "";

        inputs?.forEach((input: { name: string; value: string }) => {
          if (input.name === "email-851") {
            subscriberEmail = input.value;
          }
        });

        if (subscriberEmail) {
          setIsSimulating(true);
          fetch(`/api/newsletter-ingest`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email: subscriberEmail,
              source: "Website CF7 Submission",
              companyId: companyId
            })
          })
            .then((res) => res.json())
            .then((data) => {
              console.log("Newsletter piped successfully:", data);
              fetchSubscribers();
              setIsSimulating(false);
            })
            .catch((err) => {
              console.error("Newsletter webhook error:", err);
              setIsSimulating(false);
            });
        }
      }
    };

    document.addEventListener("wpcf7submit", handleWpcf7Submit);
    return () => {
      document.removeEventListener("wpcf7submit", handleWpcf7Submit);
    };
  }, [companyId]);

  // Read subscribers from dynamic Firestore/Sync Mock DB
  const fetchSubscribers = async () => {
    setLoading(true);
    try {
      const colRef = collection(db, `newsletter-subscribers-${companyId}`);
      const snapshot = await getDocs(colRef);
      const list: Subscriber[] = [];
      snapshot.docs.forEach((doc) => {
        list.push({ id: doc.id, ...doc.data() });
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

    // Dispatch custom wpcf7submit event
    const simulatedEvent = new CustomEvent("wpcf7submit", {
      detail: {
        status: "mail_sent",
        inputs: [
          { name: "email-851", value: simulatedEmail.trim() }
        ]
      }
    });

    document.dispatchEvent(simulatedEvent);
    setSimulatedEmail("");
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

  const copyToClipboard = (text: string, type: 'html' | 'js') => {
    navigator.clipboard.writeText(text);
    if (type === 'html') {
      setCopiedHtml(true);
      setTimeout(() => setCopiedHtml(false), 2000);
    } else {
      setCopiedScript(true);
      setTimeout(() => setCopiedScript(false), 2000);
    }
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
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Code className="text-indigo-600 w-5 h-5" />
                  WordPress & Iframe Embed Configurator
                </h3>
                <p className="text-slate-600 text-sm">
                  As a <strong>Super Admin</strong>, you can use either option below to integrate this newsletter subscriber list into your public website.
                </p>
              </div>

              {/* OPTION 1: INSTANT IFRAME EMBED (NEW/REQUESTED) */}
              <div className="border border-slate-100 rounded-xl p-4 bg-slate-50 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-xs uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-ping"></span>
                    Option 1: Recommended Instant Iframe Embed
                  </h4>
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-bold font-mono">No Coding Required</span>
                </div>
                <p className="text-slate-500 text-xs">
                  Copy and paste this iframe code directly into any custom HTML block in WordPress, Wix, or your custom theme. This renders a gorgeous, fully-responsive widget that instantly pipes entries back to your database.
                </p>
                <div className="relative bg-slate-900 text-slate-200 text-xs rounded-lg overflow-hidden p-3 font-mono">
                  <button 
                    onClick={() => {
                      navigator.clipboard.writeText(iframeCode);
                      setCopiedIframe(true);
                      setTimeout(() => setCopiedIframe(false), 2000);
                    }}
                    className="absolute right-2 top-2 bg-slate-800 hover:bg-slate-700 text-slate-300 p-1.5 rounded border border-slate-700 transition flex items-center gap-1 font-sans text-[10px]"
                  >
                    {copiedIframe ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy Code</span>
                      </>
                    )}
                  </button>
                  <pre className="overflow-x-auto max-h-32 whitespace-pre-wrap select-all text-[11px] leading-relaxed text-yellow-100/95 pt-5 pr-16">
                    {iframeCode}
                  </pre>
                </div>
              </div>

              {/* OPTION 2: NATIVE CONTACT FORM 7 EVENT PIPELINE */}
              <div className="border border-slate-100 rounded-xl p-4 bg-slate-50 space-y-4">
                <h4 className="font-bold text-xs uppercase tracking-wider text-slate-700">
                  Option 2: Native WordPress Contact Form 7 Hook
                </h4>
                <p className="text-slate-500 text-xs">
                  Already have an existing WordPress form? Follow these steps to map the submission fields directly to this database:
                </p>

                <div className="space-y-4 pt-1">
                  <div className="flex gap-3">
                    <div className="w-6 h-6 flex-shrink-0 bg-slate-200 text-slate-700 font-bold text-xs rounded-full flex items-center justify-center font-mono">1</div>
                    <div className="text-sm">
                      <h4 className="font-semibold text-slate-800 text-xs">Add the Contact Form HTML</h4>
                      <p className="text-slate-500 text-xs mt-0.5">Use the following markup inside your WordPress form block or theme template:</p>
                    </div>
                  </div>

                  {/* HTML Snippet Container */}
                  <div className="relative bg-slate-900 text-slate-200 text-[11px] rounded-lg overflow-hidden p-3 font-mono">
                    <button 
                      onClick={() => copyToClipboard(widgetHtml, 'html')}
                      className="absolute right-2 top-2 bg-slate-800 hover:bg-slate-700 text-slate-300 p-1 rounded border border-slate-700 transition"
                    >
                      {copiedHtml ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                    <pre className="overflow-x-auto max-h-48 whitespace-pre-wrap select-all">
                      {widgetHtml}
                    </pre>
                  </div>

                  <div className="flex gap-3">
                    <div className="w-6 h-6 flex-shrink-0 bg-slate-200 text-slate-700 font-bold text-xs rounded-full flex items-center justify-center font-mono">2</div>
                    <div className="text-sm">
                      <h4 className="font-semibold text-slate-800 text-xs">Inject Webhook JS Listener</h4>
                      <p className="text-slate-500 text-xs mt-0.5">Place this code inside your theme header, footer, or via any Header & Footer script manager plugin in WordPress:</p>
                    </div>
                  </div>

                  {/* JS Snippet Container */}
                  <div className="relative bg-slate-900 text-slate-200 text-[11px] rounded-lg overflow-hidden p-3 font-mono">
                    <button 
                      onClick={() => copyToClipboard(webhookJs, 'js')}
                      className="absolute right-2 top-2 bg-slate-800 hover:bg-slate-700 text-slate-300 p-1 rounded border border-slate-700 transition"
                    >
                      {copiedScript ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                    <pre className="overflow-x-auto max-h-48 whitespace-pre-wrap select-all">
                      {webhookJs}
                    </pre>
                  </div>

                  <div className="bg-amber-50 border border-amber-200 text-amber-900 p-4 rounded-lg text-xs space-y-2">
                    <div className="font-semibold flex items-center gap-1">
                      <Info className="w-4 h-4 text-amber-700 shrink-0" />
                      How Option 2 Works
                    </div>
                    <p className="leading-relaxed">
                      The script listens for the standard WordPress <code>wpcf7submit</code> event (sent by Contact Form 7). Once a successful email submission with key <strong>email-851</strong> is detected, it pipes the input immediately to our live backend endpoint <strong>/api/newsletter-ingest</strong> which automatically parses, saves, and pushes it to this page in real-time.
                    </p>
                  </div>
                </div>
              </div>

              {/* OPTION 3: 3-PROPERTY CML STYLE FORM WITH AUTO-LOYALTY ENROLLMENT */}
              <div className="border border-slate-150 rounded-xl p-4 bg-indigo-50/40 border-dashed space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-xs uppercase tracking-wider text-indigo-950 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    Option 3: 3-Property CML Corporate Style & Auto-Loyalty Widget
                  </h4>
                  <span className="text-[10px] bg-indigo-100 text-indigo-850 px-2 py-0.5 rounded font-bold">Premium Multi-Property</span>
                </div>
                <p className="text-slate-650 text-xs">
                  Copy and paste this high-fidelity custom HTML form with embedded CSS/JS into WordPress. It includes a dropdown for Cove Management properties (CML, Ramada, Wyndham) and optionally accepts a First & Last Name. If they provide a name, it automatically creates a corresponding Rewards Card in the CRM, awards them 100 welcome loyalty points, and subscribes them!
                </p>
                <div className="relative bg-slate-900 text-slate-200 text-xs rounded-lg overflow-hidden p-3 font-mono">
                  <button 
                    onClick={() => {
                      navigator.clipboard.writeText(corporateWidgetCode);
                      setCopiedCorporate(true);
                      setTimeout(() => setCopiedCorporate(false), 2000);
                    }}
                    className="absolute right-2 top-2 bg-slate-800 hover:bg-slate-700 text-slate-300 p-1.5 rounded border border-slate-700 transition flex items-center gap-1 font-sans text-[10px]"
                  >
                    {copiedCorporate ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy Code</span>
                      </>
                    )}
                  </button>
                  <pre className="overflow-x-auto max-h-48 whitespace-pre-wrap select-all text-[11px] leading-relaxed text-yellow-100/95 pt-5 pr-16">
                    {corporateWidgetCode}
                  </pre>
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
