import React, { useState, useEffect } from "react";
import { 
  db, 
  auth, 
  collection, 
  addDoc, 
  getDocs, 
  deleteDoc, 
  doc, 
  query, 
  onSnapshot 
} from "../lib/firebase";
import { 
  connectGoogleWorkspace, 
  getGoogleAccessToken 
} from "../lib/firebase";
import { 
  FileText, 
  Plus, 
  Search, 
  Trash2, 
  ExternalLink, 
  RefreshCw, 
  Check, 
  AlertCircle, 
  Eye, 
  Link2, 
  BarChart3, 
  Sparkles, 
  FileSpreadsheet, 
  UserCheck, 
  Calendar,
  X,
  Play,
  HeartHandshake
} from "lucide-react";
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  PieChart, 
  Pie, 
  Cell 
} from "recharts";

interface GoogleFormRef {
  id: string;
  formId: string;
  title: string;
  description: string;
  responderUri: string;
  editUri: string;
  importedBy: string;
  createdAt: string;
  companyId: string;
}

interface FormResponseItem {
  responseId: string;
  createTime: string;
  respondentEmail?: string;
  answers: Record<string, {
    questionId: string;
    textAnswers?: { answers: Array<{ value: string }> };
  }>;
}

export const GoogleFormsSuite: React.FC<{ companyId: string }> = ({ companyId }) => {
  const [googleForms, setGoogleForms] = useState<GoogleFormRef[]>([]);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLikingGoogle, setIsLikingGoogle] = useState(false);
  const [importUrl, setImportUrl] = useState("");
  const [createTitle, setCreateTitle] = useState("");
  const [createDesc, setCreateDesc] = useState("");
  
  // Dynamic alerts
  const [notification, setNotification] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [isFormCreating, setIsFormCreating] = useState(false);
  const [isFormImporting, setIsFormImporting] = useState(false);
  
  // Interactive overlays
  const [activeEmbedForm, setActiveEmbedForm] = useState<GoogleFormRef | null>(null);
  const [activeAnalysisForm, setActiveAnalysisForm] = useState<GoogleFormRef | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [deleteIdTarget, setDeleteIdTarget] = useState<string | null>(null);
  
  // Responses data states
  const [responsesData, setResponsesData] = useState<FormResponseItem[]>([]);
  const [formDetailApi, setFormDetailApi] = useState<any | null>(null);
  const [isFetchingResponses, setIsFetchingResponses] = useState(false);

  // Auto-load token if cached already
  useEffect(() => {
    const cachedToken = getGoogleAccessToken();
    if (cachedToken) {
      setAccessToken(cachedToken);
    }
  }, []);

  // Listen to Google Form links indexed in Firestore
  useEffect(() => {
    if (!db) return;
    const q = query(collection(db, "google_forms_links"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(docDoc => ({
        id: docDoc.id,
        ...docDoc.data()
      })) as GoogleFormRef[];
      
      // Filter by company profile
      const filtered = docs.filter(f => f.companyId === (companyId || "cml"));
      setGoogleForms(filtered);
    }, (err) => {
      console.warn("[Google Forms UI] Subscription warning:", err);
    });

    return () => unsubscribe();
  }, [companyId]);

  // Request OAuth connection
  const handleConnectGoogle = async () => {
    setIsLikingGoogle(true);
    setNotification(null);
    try {
      const token = await connectGoogleWorkspace();
      setAccessToken(token);
      setNotification({ type: "success", text: "Successfully integrated Google Workspace scopes!" });
    } catch (err: any) {
      console.error(err);
      setNotification({ type: "error", text: "Integration cancelled or failed. Please check permissions." });
    } finally {
      setIsLikingGoogle(false);
    }
  };

  // Helper: Extract Form ID from URL
  const extractFormId = (url: string): string | null => {
    const trimmed = url.trim();
    // Match common form patterns: docs.google.com/forms/d/[ID]/...
    const match = trimmed.match(/\/forms\/d\/e\/([a-zA-Z0-9-_]+)/) || 
                  trimmed.match(/\/forms\/d\/([a-zA-Z0-9-_]+)/);
    if (match && match[1]) {
      return match[1];
    }
    // Return direct string if it looks like an ID
    if (trimmed.length > 20 && !trimmed.includes("/")) {
      return trimmed;
    }
    return null;
  };

  // Import existing Google Form via Forms API
  const handleImportForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!importUrl) return;
    
    const formId = extractFormId(importUrl);
    if (!formId) {
      setNotification({ type: "error", text: "Invalid Google Form URL or ID structure." });
      return;
    }

    if (!accessToken) {
      setNotification({ type: "error", text: "Authorization target unavailable. Please connect Google first." });
      return;
    }

    setIsFormImporting(true);
    setNotification(null);

    try {
      // Pull form metadata
      const res = await fetch(`https://forms.googleapis.com/v1/forms/${formId}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (!res.ok) {
        throw new Error(`Google API returned status ${res.status}`);
      }

      const formMetadata = await res.json();
      
      // Save metadata to shared Firestore index
      await addDoc(collection(db, "google_forms_links"), {
        formId: formId,
        title: formMetadata.info?.title || "Untitled Google Form",
        description: formMetadata.info?.description || "No description provided.",
        responderUri: formMetadata.responderUri || `https://docs.google.com/forms/d/e/${formId}/viewform`,
        editUri: `https://docs.google.com/forms/d/${formId}/edit`,
        importedBy: auth?.currentUser?.email || "Manager",
        createdAt: new Date().toISOString(),
        companyId: companyId || "cml"
      });

      setNotification({ type: "success", text: `Successfully indexed Google Form: "${formMetadata.info?.title}"!` });
      setImportUrl("");
    } catch (err: any) {
      console.error(err);
      setNotification({ type: "error", text: "Failed to access form. Ensure the Google account owns or has access to this form." });
    } finally {
      setIsFormImporting(false);
    }
  };

  // Create standard Google Form from scratch using Forms API
  const handleCreateNewForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createTitle) return;

    if (!accessToken) {
      setNotification({ type: "error", text: "Access token missing. Please connect to Google Workspace first." });
      return;
    }

    setIsFormCreating(true);
    setNotification(null);

    try {
      // 1. Create empty form structure
      const createRes = await fetch("https://forms.googleapis.com/v1/forms", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          info: {
            title: createTitle,
            description: createDesc || "Automated satisfaction survey generated from Ramada companion suite."
          }
        })
      });

      if (!createRes.ok) {
        throw new Error(`Create Form API request failed: ${createRes.status}`);
      }

      const newForm = await createRes.json();
      const newFormId = newForm.formId;

      // 2. Insert standard default hotel evaluation questions (ratings and text boxes) using batchUpdate
      const questionsPayload = {
        requests: [
          {
            createItem: {
              item: {
                title: "How would you rate our overall team hospitality?",
                description: "Choose score scale from 1 (unacceptable) to 5 (excellent excellence).",
                questionItem: {
                  question: {
                    required: true,
                    scaleQuestion: {
                      low: 1,
                      high: 5,
                      lowLabel: "Poor",
                      highLabel: "Excellent"
                    }
                  }
                }
              },
              location: { index: 0 }
            }
          },
          {
            createItem: {
              item: {
                title: "Which department did you interact with most?",
                questionItem: {
                  question: {
                    required: true,
                    choiceQuestion: {
                      type: "DROP_DOWN",
                      options: [
                        { value: "Front Office" },
                        { value: "Housekeeping" },
                        { value: "F&B / Restaurant" },
                        { value: "Engineering & Maintenance" },
                        { value: "Management & Sales" }
                      ]
                    }
                  }
                }
              },
              location: { index: 1 }
            }
          },
          {
            createItem: {
              item: {
                title: "Provide comments or highlight staff who performed exceptionally:",
                questionItem: {
                  question: {
                    textQuestion: { paragraph: true }
                  }
                }
              },
              location: { index: 2 }
            }
          }
        ]
      };

      const updateRes = await fetch(`https://forms.googleapis.com/v1/forms/${newFormId}:batchUpdate`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(questionsPayload)
      });

      if (!updateRes.ok) {
        console.warn("[Forms Update] Questions insertion failed, but empty form was created successfully.");
      }

      // Fetch latest metadata after upgrade
      const finalFormRes = await fetch(`https://forms.googleapis.com/v1/forms/${newFormId}`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      const finalForm = finalFormRes.ok ? await finalFormRes.json() : newForm;

      // Register successfully generated Form reference in shared database
      await addDoc(collection(db, "google_forms_links"), {
        formId: newFormId,
        title: createTitle,
        description: createDesc || "Custom Feedback Google Form.",
        responderUri: finalForm.responderUri || `https://docs.google.com/forms/d/e/${newFormId}/viewform`,
        editUri: `https://docs.google.com/forms/d/${newFormId}/edit`,
        importedBy: auth?.currentUser?.email || "Manager",
        createdAt: new Date().toISOString(),
        companyId: companyId || "cml"
      });

      setNotification({ type: "success", text: `Successfully generated Google Form "${createTitle}" with template questions!` });
      setCreateTitle("");
      setCreateDesc("");
    } catch (err: any) {
      console.error(err);
      setNotification({ type: "error", text: "Failed to generate Google Form. Review API permissions." });
    } finally {
      setIsFormCreating(false);
    }
  };

  // Pull responses for dynamic dashboard view
  const handleFetchResponses = async (formRef: GoogleFormRef) => {
    if (!accessToken) {
      setNotification({ type: "error", text: "Access token required to view analytics. Please connect." });
      return;
    }

    setIsFetchingResponses(true);
    setResponsesData([]);
    setFormDetailApi(null);
    setActiveAnalysisForm(formRef);

    try {
      // 1. Fetch live form details (questions mapping)
      const formDetailsRes = await fetch(`https://forms.googleapis.com/v1/forms/${formRef.formId}`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      if (formDetailsRes.ok) {
        const detailJson = await formDetailsRes.json();
        setFormDetailApi(detailJson);
      }

      // 2. Fetch responses list
      const respRes = await fetch(`https://forms.googleapis.com/v1/forms/${formRef.formId}/responses`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      
      if (!respRes.ok) {
        throw new Error(`Google API returned status ${respRes.status}`);
      }

      const jsonResponses = await respRes.json();
      setResponsesData(jsonResponses.responses || []);
    } catch (err: any) {
      console.warn("[Google Forms API] Could not access responses. Check scopes/permissions:", err);
      setNotification({ type: "error", text: "Responses access denied or form has no submissions yet." });
    } finally {
      setIsFetchingResponses(false);
    }
  };

  const handleUnsyncForm = async (id: string) => {
    const confirmDelete = window.confirm("Are you sure you want to unsync/remove this Google Form registry link? This will not delete the form itself on Google Drive.");
    if (!confirmDelete) return;

    try {
      await deleteDoc(doc(db, "google_forms_links", id));
      setNotification({ type: "success", text: "Successfully removed Google Form registry pointer." });
    } catch (e) {
      console.error(e);
      setNotification({ type: "error", text: "Failed to remove Google Form reference." });
    }
  };

  // Compile question mapping for simple diagnostics display
  const getQuestionTitle = (questionId: string): string => {
    if (!formDetailApi?.items) return `Question ${questionId}`;
    for (const item of formDetailApi.items) {
      if (item.questionItem?.question?.questionId === questionId) {
        return item.title || `Question ${questionId}`;
      }
    }
    return `Field ${questionId}`;
  };

  // Compile stats for charts
  const compileRatingStats = () => {
    // Find numeric evaluation responses
    const counts: Record<string, number> = { "1": 0, "2": 0, "3": 0, "4": 0, "5": 0 };
    let totalRatings = 0;

    responsesData.forEach(resp => {
      Object.keys(resp.answers).forEach(ansId => {
        const textValue = resp.answers[ansId]?.textAnswers?.answers?.[0]?.value;
        if (textValue && ["1", "2", "3", "4", "5"].includes(textValue.trim())) {
          counts[textValue.trim()]++;
          totalRatings++;
        }
      });
    });

    return {
      data: Object.keys(counts).map(score => ({ name: `${score} Star`, value: counts[score] })),
      total: totalRatings
    };
  };

  const compiledRatings = compileRatingStats();
  const COLORS = ["#EA4335", "#FBBC05", "#4285F4", "#24C1E0", "#34A853"];

  // Filter linked forms
  const filteredForms = googleForms.filter(f => {
    const t = searchQuery.toLowerCase();
    return f.title.toLowerCase().includes(t) || f.description.toLowerCase().includes(t) || f.formId.toLowerCase().includes(t);
  });

  return (
    <div className="space-y-8 text-left">
      
      {/* Top Banner Connection Info */}
      <div className="bg-gradient-to-r from-blue-500/10 via-indigo-500/5 to-purple-500/10 border border-slate-250 p-6 flex flex-col md:flex-row items-center justify-between gap-6 rounded-xl shadow-sm">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-blue-500/10 rounded-full text-blue-600">
            <FileSpreadsheet size={28} />
          </div>
          <div>
            <h3 className="text-sm font-display uppercase tracking-widest text-[#0f172a] font-bold flex items-center gap-2">
              Google Workspace Forms Hub
              <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                Full OAuth Connected
              </span>
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed mt-1">
              Synchronize, deploy templates, fill directly within standard subviews, and preview submission analytics in real time.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {accessToken ? (
            <div className="flex items-center gap-2 px-4 py-2.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-lg text-xs font-semibold">
              <UserCheck size={14} className="shrink-0 text-emerald-600" />
              Connected to Google
            </div>
          ) : (
            <button
              onClick={handleConnectGoogle}
              disabled={isLikingGoogle}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-display uppercase tracking-wider font-extrabold flex items-center gap-2 shadow-md hover:scale-[1.02] transition-all disabled:opacity-50"
            >
              <RefreshCw size={13} className={isLikingGoogle ? "animate-spin" : ""} />
              Connect Google Forms Account
            </button>
          )}
        </div>
      </div>

      {notification && (
        <div className={`p-4 rounded-lg flex items-center gap-3 border ${
          notification.type === "success" 
            ? "bg-emerald-50 text-emerald-800 border-emerald-200" 
            : "bg-rose-50 text-rose-800 border-rose-200"
        }`}>
          {notification.type === "success" ? <Check size={18} /> : <AlertCircle size={18} />}
          <p className="text-xs font-medium">{notification.text}</p>
        </div>
      )}

      {/* Grid of Manager controls */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Box 1: CREATE NEW FORM */}
        <div className="bg-white border border-slate-200 outline-none p-6 rounded-xl shadow-sm space-y-4">
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-purple-100 rounded text-purple-600">
              <Sparkles size={16} />
            </span>
            <h4 className="text-xs font-display uppercase tracking-wider font-extrabold text-slate-800">
              Generate Hotel Feedback Template
            </h4>
          </div>
          <p className="text-xs text-slate-500 leading-normal">
            Generate a fresh Google Form automatically with rating scales and qualitative feedback boxes. Ready to send feedback instantly.
          </p>

          <form onSubmit={handleCreateNewForm} className="space-y-4 pt-2">
            <div className="space-y-1">
              <label className="text-[9px] font-display uppercase tracking-widest text-slate-500 font-bold">Form Title</label>
              <input 
                type="text" 
                required
                placeholder="e.g. Ramada Guest Experience Survey June"
                value={createTitle}
                onChange={(e) => setCreateTitle(e.target.value)}
                className="w-full text-xs p-3 border border-slate-200 rounded-lg outline-none bg-slate-50 focus:bg-white focus:border-blue-500 transition-all font-medium"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[9px] font-display uppercase tracking-widest text-slate-500 font-bold">Survey Description</label>
              <textarea 
                placeholder="Share your satisfaction with our amenities and housekeeping services..."
                value={createDesc}
                onChange={(e) => setCreateDesc(e.target.value)}
                className="w-full text-xs p-3 border border-slate-200 rounded-lg outline-none bg-slate-50 focus:bg-white focus:border-blue-500 transition-all font-medium min-h-[64px]"
              />
            </div>
            
            <button
              type="submit"
              disabled={isFormCreating || !accessToken}
              className="w-full py-2.5 bg-purple-600 hover:bg-purple-700 disabled:bg-slate-200 text-white disabled:text-slate-400 rounded-lg text-xs font-display uppercase tracking-wider font-black transition-all flex items-center justify-center gap-2"
            >
              {isFormCreating ? (
                <>
                  <RefreshCw size={13} className="animate-spin" />
                  Generating Google Form Structure...
                </>
              ) : (
                <>
                  <Plus size={14} />
                  Deploy Google Form Template
                </>
              )}
            </button>
            {!accessToken && (
              <span className="text-[10px] text-zinc-400 text-center block leading-normal">
                Requires Google connection first to request permission
              </span>
            )}
          </form>
        </div>

        {/* Box 2: IMPORT EXISTING FORM */}
        <div className="bg-white border border-slate-200 p-6 rounded-xl shadow-sm space-y-4">
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-blue-100 rounded text-blue-600">
              <Link2 size={16} />
            </span>
            <h4 className="text-xs font-display uppercase tracking-wider font-extrabold text-slate-800">
              Index Existing Google Form
            </h4>
          </div>
          <p className="text-xs text-slate-500 leading-normal">
            Already have an active Google Form? Back up, pull structures, and index it into our resort companion applet catalog.
          </p>

          <form onSubmit={handleImportForm} className="space-y-4 pt-2">
            <div className="space-y-1">
              <label className="text-[9px] font-display uppercase tracking-widest text-slate-500 font-bold">Google Form Link or ID</label>
              <input 
                type="text" 
                required
                placeholder="https://docs.google.com/forms/d/e/.../viewform"
                value={importUrl}
                onChange={(e) => setImportUrl(e.target.value)}
                className="w-full text-xs p-3 border border-slate-200 rounded-lg outline-none bg-slate-50 focus:bg-white focus:border-blue-500 transition-all font-medium"
              />
            </div>

            <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 text-[11px] text-slate-500 leading-relaxed">
              <strong>Tip:</strong> Ensure you copy the edit URL or view link. The app will fetch title descriptions automatically using Workspace metadata.
            </div>

            <button
              type="submit"
              disabled={isFormImporting || !accessToken}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 text-white disabled:text-slate-400 rounded-lg text-xs font-display uppercase tracking-wider font-black transition-all flex items-center justify-center gap-2"
            >
              {isFormImporting ? (
                <>
                  <RefreshCw size={13} className="animate-spin" />
                  Fetching Form Layout...
                </>
              ) : (
                <>
                  <Eye size={14} />
                  Connect & Index Form Link
                </>
              )}
            </button>
          </form>
        </div>
      </div>

      {/* Forms Catalog Registry section */}
      <div className="space-y-6 pt-4">
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
          <div>
            <h3 className="text-lg font-serif italic text-slate-900 leading-snug">Active Google Forms Registry</h3>
            <p className="text-xs text-slate-500">Shared hotel and resort feedback forms indices</p>
          </div>
          
          <div className="relative max-w-xs w-full">
            <Search className="absolute left-3 top-2.5 text-slate-400" size={14} />
            <input 
              type="text"
              placeholder="Filter Google Forms..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-xs outline-none focus:border-blue-500 transition-colors font-medium text-slate-700"
            />
          </div>
        </div>

        {filteredForms.length === 0 ? (
          <div className="py-12 border border-dashed border-slate-200 rounded-xl text-center text-slate-500 italic text-xs space-y-2">
            <p>No active Google Forms have been registered yet.</p>
            <p className="text-[10px] text-slate-400 font-sans not-italic">
              Integrate Google Workspace and submit your first form template using the boxes above!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredForms.map((form) => (
              <div 
                key={form.id}
                className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group"
              >
                <div className="space-y-3 text-left">
                  <div className="flex justify-between items-start">
                    <span className="p-2 bg-indigo-50 text-indigo-600 rounded-lg group-hover:bg-indigo-600 group-hover:text-white transition-all">
                      <FileText size={18} />
                    </span>
                    <button 
                      onClick={() => handleUnsyncForm(form.id)}
                      className="p-1 text-slate-400 hover:text-rose-600 transition-colors"
                      title="Remove Registry Pointer"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>

                  <div>
                    <h4 className="font-serif text-base text-slate-900 group-hover:text-blue-600 transition-colors leading-snug line-clamp-2">
                      {form.title}
                    </h4>
                    <p className="text-xs text-slate-505 leading-relaxed line-clamp-3 text-slate-500 mt-1">
                      {form.description}
                    </p>
                  </div>

                  <div className="flex items-center gap-3 text-[10px] text-slate-400 font-sans pt-2">
                    <span className="flex items-center gap-1">
                      <Calendar size={11} />
                      {new Date(form.createdAt).toLocaleDateString()}
                    </span>
                    <span className="flex items-center gap-1 line-clamp-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-400 inline-block"></span>
                      By {form.importedBy.split("@")[0]}
                    </span>
                  </div>
                </div>

                <div className="space-y-2 pt-6">
                  <div className="flex gap-2">
                    <button
                      onClick={() => setActiveEmbedForm(form)}
                      className="flex-1 py-2 border border-slate-200 hover:border-blue-500 hover:bg-blue-50 text-slate-700 hover:text-blue-700 text-[10px] font-display uppercase tracking-widest font-black rounded-lg transition-all flex items-center justify-center gap-1.5"
                    >
                      <Play size={11} /> Fill In-App
                    </button>
                    {accessToken && (
                      <button
                        onClick={() => handleFetchResponses(form)}
                        className="py-2 px-3 border border-slate-200 hover:border-indigo-500 hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 rounded-lg transition-all"
                        title="Analyze Submissions"
                      >
                        <BarChart3 size={14} />
                      </button>
                    )}
                  </div>
                  <a 
                    href={form.responderUri} 
                    target="_blank" 
                    rel="noreferrer"
                    className="w-full py-1.5 bg-slate-900 hover:bg-blue-600 text-white rounded-lg text-[9px] font-display uppercase tracking-widest font-bold transition-all flex items-center justify-center gap-1"
                  >
                    Open Google Portal <ExternalLink size={10} />
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* MODAL 1: Embed Google Form Frame */}
      {activeEmbedForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-4xl h-[85vh] flex flex-col shadow-2xl overflow-hidden text-left relative">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-55 pointer-events-auto">
              <div>
                <h3 className="text-sm font-display uppercase tracking-widest text-[#0f172a] font-bold">
                  Evaluating: {activeEmbedForm.title}
                </h3>
                <p className="text-[11px] text-slate-400">Embedding official responder frame securely</p>
              </div>
              <button 
                onClick={() => setActiveEmbedForm(null)}
                className="p-1.5 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-900 transition-colors"
              >
                <X size={18} />
              </button>
            </div>
            
            <div className="flex-1 bg-slate-50 relative">
              <iframe 
                src={activeEmbedForm.responderUri}
                className="w-full h-full border-0"
                title={activeEmbedForm.title}
                referrerPolicy="no-referrer"
              >
                Loading Google Form...
              </iframe>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 px-6 flex justify-between items-center text-xs text-slate-500">
              <span className="flex items-center gap-1"><HeartHandshake size={14} /> Synced via Cove Companion Hub</span>
              <button
                type="button"
                onClick={() => setActiveEmbedForm(null)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-[10px] font-display uppercase tracking-widest font-black rounded-md"
              >
                Dismiss Frame
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Form Submissions Analysis */}
      {activeAnalysisForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-5xl h-[85vh] flex flex-col shadow-2xl overflow-hidden text-left relative">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-55 pointer-events-auto">
              <div>
                <h3 className="text-sm font-display uppercase tracking-widest text-slate-900 font-bold">
                  Surveys Analytics Dashboard
                </h3>
                <p className="text-[11px] text-slate-500">
                  Form: <strong className="text-slate-800">{activeAnalysisForm.title}</strong> • ID: {activeAnalysisForm.formId}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleFetchResponses(activeAnalysisForm!)}
                  className="p-1 px-3 border border-slate-200 text-[10px] font-display tracking-wider font-extrabold uppercase hover:bg-slate-100 rounded-md transition-all flex items-center gap-1.5"
                  title="F5 Sync"
                >
                  <RefreshCw size={11} className={isFetchingResponses ? "animate-spin" : ""} />
                  Sync
                </button>
                <button 
                  onClick={() => setActiveAnalysisForm(null)}
                  className="p-1.5 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-900"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-8 bg-slate-50">
              
              {isFetchingResponses ? (
                <div className="h-64 flex flex-col items-center justify-center text-slate-500 italic text-xs gap-3">
                  <RefreshCw className="animate-spin text-blue-500" size={32} />
                  Loading client responses from Google Cloud...
                </div>
              ) : responsesData.length === 0 ? (
                <div className="py-16 text-center italic text-slate-400 text-xs border border-dashed border-slate-300 rounded-xl max-w-lg mx-auto bg-white mt-10">
                  <AlertCircle className="mx-auto mb-2 text-slate-300" size={24} />
                  No responses recorded in this form yet, or responses are inaccessible.
                  <p className="text-[10px] text-slate-400 mt-1 not-italic">
                    Ensure employees/guests have filled out the form and this Google client has permission.
                  </p>
                </div>
              ) : (
                <div className="space-y-8">
                  
                  {/* Performance metrics dashboard metrics row */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white border border-slate-200 p-5 rounded-xl text-left shadow-sm">
                      <div className="text-[9px] font-display uppercase tracking-wider text-slate-400 font-extrabold">Total Submissions</div>
                      <div className="text-3xl font-mono font-bold text-slate-800 mt-2">{responsesData.length}</div>
                      <div className="text-[10px] text-slate-400 mt-1">Live submissions count</div>
                    </div>
                    
                    <div className="bg-white border border-slate-200 p-5 rounded-xl text-left shadow-sm">
                      <div className="text-[9px] font-display uppercase tracking-wider text-slate-400 font-extrabold">Active Items Structure</div>
                      <div className="text-3xl font-mono font-bold text-slate-800 mt-2">
                        {formDetailApi?.items ? formDetailApi.items.length : "N/A"}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-1">Google components list</div>
                    </div>

                    <div className="bg-white border border-slate-200 p-5 rounded-xl text-left shadow-sm">
                      <div className="text-[9px] font-display uppercase tracking-wider text-slate-400 font-extrabold">Registry Author</div>
                      <div className="text-sm font-bold text-slate-700 mt-2 italic truncate">{activeAnalysisForm.importedBy}</div>
                      <div className="text-[10px] text-slate-400 mt-1">Registry index owner</div>
                    </div>
                  </div>

                  {/* Summary Rating analysis charts */}
                  {compiledRatings.total > 0 && (
                    <div className="bg-white border border-slate-200 p-6 rounded-xl shadow-sm text-left">
                      <h4 className="text-xs font-display uppercase tracking-wider font-extrabold text-slate-800 mb-6">
                        Quantitative Score Distribution (Hospitality Scales)
                      </h4>
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                        <div className="h-60">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={compiledRatings.data}>
                              <XAxis dataKey="name" stroke="#888888" fontSize={11} tickLine={false} axisLine={false} />
                              <YAxis stroke="#888888" fontSize={11} tickLine={false} axisLine={false} />
                              <Tooltip />
                              <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                                {compiledRatings.data.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                              </Bar>
                            </BarChart>
                          </ResponsiveContainer>
                        </div>

                        <div className="space-y-4">
                          <div className="text-xs text-slate-500 font-medium">Rating details breakdown:</div>
                          <div className="divide-y divide-slate-100">
                            {compiledRatings.data.map((item, idx) => (
                              <div key={idx} className="py-2 flex items-center justify-between text-xs">
                                <div className="flex items-center gap-2">
                                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }}></span>
                                  <span className="font-semibold text-slate-700">{item.name}</span>
                                </div>
                                <span className="font-mono font-extrabold text-slate-900">{item.value} submissions ({compiledRatings.total ? Math.round((item.value / compiledRatings.total) * 100) : 0}%)</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Actual responses listing */}
                  <div className="space-y-4 text-left">
                    <h4 className="text-xs font-display uppercase tracking-wider font-extrabold text-slate-800">
                      Form Submission Feed
                    </h4>
                    <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
                      {responsesData.map((submission, index) => (
                        <div key={submission.responseId} className="bg-white border border-slate-150 p-5 rounded-xl space-y-4 shadow-xs">
                          <div className="flex justify-between items-start text-xs border-b border-slate-100 pb-2">
                            <div>
                              <span className="font-bold text-slate-800">Respondent: </span>
                              <span className="font-mono text-blue-600 font-medium">{submission.respondentEmail || "Anonymous Guest/Staff"}</span>
                            </div>
                            <span className="text-slate-400 font-medium">
                              {new Date(submission.createTime).toLocaleString()}
                            </span>
                          </div>

                          <div className="space-y-3">
                            {Object.keys(submission.answers).map((ansId) => {
                              const ansItem = submission.answers[ansId];
                              const title = getQuestionTitle(ansId);
                              const valStr = ansItem.textAnswers?.answers?.map(a => a.value).join(", ") || "";
                              
                              return (
                                <div key={ansId} className="text-xs space-y-1">
                                  <p className="font-semibold text-slate-600">{title}</p>
                                  <p className="p-2.5 bg-slate-50 border border-slate-100 rounded text-slate-800 italic leading-relaxed">
                                    {valStr || <span className="text-slate-400">Response left blank</span>}
                                  </p>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>
              )}

            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 px-6 flex justify-between items-center text-xs text-slate-500">
              <span>Total items loaded - {responsesData.length} records</span>
              <button
                type="button"
                onClick={() => setActiveAnalysisForm(null)}
                className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-[10px] font-display uppercase tracking-widest font-black rounded-lg"
              >
                Close Dashboard
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
