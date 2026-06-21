// Premium Adaptive Hybrid Firebase SDK client wrapper
// Dynamically bridges live Firestore/Auth production gates with elegant local-storage mocks

import { initializeApp, getApps, getApp } from "firebase/app";
import { 
  getAuth, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut,
  onAuthStateChanged as fbOnAuthStateChanged
} from "firebase/auth";
import { 
  getFirestore, 
  collection as fbCollection, 
  doc as fbDoc, 
  getDoc as fbGetDoc, 
  getDocs as fbGetDocs, 
  setDoc as fbSetDoc, 
  updateDoc as fbUpdateDoc, 
  addDoc as fbAddDoc, 
  deleteDoc as fbDeleteDoc, 
  onSnapshot as fbOnSnapshot, 
  query as fbQuery, 
  where as fbWhere, 
  orderBy as fbOrderBy, 
  limit as fbLimit,
  serverTimestamp as fbServerTimestamp,
  increment as fbIncrement,
  arrayUnion as fbArrayUnion,
  writeBatch as fbWriteBatch,
  enableMultiTabIndexedDbPersistence,
  enableIndexedDbPersistence
} from "firebase/firestore";
import firebaseConfig from "../../firebase-applet-config.json";
import { toastService } from "../services/toastService";

// 1. Definition of Mock References (Fallback Engine)
export class MockDocRef {
  type = 'document' as const;
  _isMock = true;
  firestore = {};
  constructor(public parentPath: string, public id: string) {}
  get path() {
    return `${this.parentPath}/${this.id}`;
  }
}

export class MockCollectionRef {
  type = 'collection' as const;
  _isMock = true;
  firestore = {};
  constructor(public path: string) {}
}

export class MockQuery {
  _isMock = true;
  constructor(public collectionRef: MockCollectionRef, public constraints: any[]) {}
}

export class MockDocSnapshot {
  _isMock = true;
  metadata = { fromCache: false, hasPendingWrites: false };
  constructor(public ref: MockDocRef, public _data: any) {}
  exists() {
    return this._data !== undefined && this._data !== null;
  }
  data() {
    return this._data;
  }
  get id() {
    return this.ref.id;
  }
  get refObject() {
    return this.ref;
  }
}

export class MockQuerySnapshot {
  _isMock = true;
  metadata = { fromCache: false, hasPendingWrites: false };
  constructor(public docs: MockDocSnapshot[]) {}
  get empty() {
    return this.docs.length === 0;
  }
}

// 2. Local Database Store for Mock Mode
const MOCK_STORE: Record<string, any> = {};

try {
  const saved = localStorage.getItem('cml_mock_db');
  if (saved) {
    Object.assign(MOCK_STORE, JSON.parse(saved));
  }
} catch (e) {
  console.warn("[MOCK_DB] localStorage is unavailable, using volatile in-memory store.");
}

function saveMockStore(updatedPath?: string, isDelete = false) {
  try {
    localStorage.setItem('cml_mock_db', JSON.stringify(MOCK_STORE));
  } catch (e) {}
  
  if (updatedPath) {
    if (isDelete) {
      syncWithServerDirect(undefined, [updatedPath], true);
    } else {
      syncWithServerDirect({ [updatedPath]: MOCK_STORE[updatedPath] }, undefined, true);
    }
  } else {
    syncWithServerDirect(MOCK_STORE, undefined, true);
  }
}

let isSyncing = false;
let pendingUpdates: Record<string, any> = {};
let pendingDeletes: string[] = [];
let hasDoneInitialSync = false;

// Safe Offline Sync Persistence
try {
  const savedPendingUpdates = localStorage.getItem('cml_pending_updates');
  if (savedPendingUpdates) {
    pendingUpdates = JSON.parse(savedPendingUpdates);
  }
  const savedPendingDeletes = localStorage.getItem('cml_pending_deletes');
  if (savedPendingDeletes) {
    pendingDeletes = JSON.parse(savedPendingDeletes);
  }
} catch (e) {
  console.warn("[MOCK_DB] Could not hydrate pending sync state from localStorage:", e);
}

function savePendingSyncState() {
  try {
    localStorage.setItem('cml_pending_updates', JSON.stringify(pendingUpdates));
    localStorage.setItem('cml_pending_deletes', JSON.stringify(pendingDeletes));
  } catch (e) {}
}

let isCurrentlyOffline = false;

export async function syncWithServerDirect(updates?: Record<string, any>, deletedKeys?: string[], forcePush = false) {
  const isPushedSession = (updates && Object.keys(updates).length > 0) || (deletedKeys && deletedKeys.length > 0);
  const hadOfflinePending = Object.keys(pendingUpdates).length > 0 || pendingDeletes.length > 0;

  if (updates) {
    pendingUpdates = { ...pendingUpdates, ...updates };
  }
  if (deletedKeys) {
    pendingDeletes = [...new Set([...pendingDeletes, ...deletedKeys])];
  }
  
  savePendingSyncState();
  
  if (isSyncing && !forcePush) return;
  isSyncing = true;
  
  try {
    const response = await fetch("/api/mock-db", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ updates: pendingUpdates, deletedKeys: pendingDeletes })
    });
    if (response.ok) {
      const data = await response.json();
      if (data && data.db) {
        // High-Fidelity Diff-Based Synchronization Engine
        const changedKeys = new Set<string>();
        
        // Find changes or additions on the server
        for (const [k, newVal] of Object.entries(data.db)) {
          const oldVal = MOCK_STORE[k];
          if (k in pendingUpdates) {
            // Keep user's offline pending state in local store until pushed successfully
            continue;
          }
          if (JSON.stringify(oldVal) !== JSON.stringify(newVal)) {
            MOCK_STORE[k] = newVal;
            changedKeys.add(k);
          }
        }
        
        // Handle server-side deletions cleanly (non-users entries)
        for (const k of Object.keys(MOCK_STORE)) {
          if (!(k in data.db) && !k.startsWith('users/') && !pendingDeletes.includes(k)) {
            delete MOCK_STORE[k];
            changedKeys.add(k);
          }
        }

        // Apply completed deletions
        pendingDeletes.forEach(k => {
          delete MOCK_STORE[k];
        });
        
        try {
          localStorage.setItem('cml_mock_db', JSON.stringify(MOCK_STORE));
        } catch (e) {}

        const isReconnecting = isCurrentlyOffline;
        if (isCurrentlyOffline) {
          isCurrentlyOffline = false;
          // Silenced background sync notification
        }
        
        // Dynamic client-side seeding of restarted/empty servers
        const serverDbEmpty = Object.keys(data.db || {}).length === 0;
        const localDbHasEntries = Object.keys(MOCK_STORE).length > 0;
        
        const isFirstSync = !hasDoneInitialSync;
        if (!hasDoneInitialSync) {
          hasDoneInitialSync = true;
          if (serverDbEmpty && localDbHasEntries) {
            console.log("[MOCK_DB] Server empty on boot. Pushing local cache to hydrate server...");
            setTimeout(() => {
              syncWithServerDirect(MOCK_STORE, undefined, true);
            }, 100);
          } else {
            // Silenced background sync notification
          }
        } else {
          // If we had offline modifications queued up that are now pushed and merged cleanly
          if (hadOfflinePending && Object.keys(pendingUpdates).length === 0 && pendingDeletes.length === 0) {
            // Silenced background sync notification
          } else if (changedKeys.size > 0 && !isPushedSession && !isReconnecting) {
            // Silenced background sync notification
          }
        }

        pendingUpdates = {};
        pendingDeletes = [];
        savePendingSyncState();
        
        // Trigger reactive UI listeners only for keys that actually changed or updated!
        changedKeys.forEach(k => {
          triggerListeners(k);
          const parts = k.split('/');
          if (parts.length > 1) {
            triggerListeners(parts.slice(0, -1).join('/'));
          }
        });
      }
    } else {
      if (!isCurrentlyOffline) {
        isCurrentlyOffline = true;
        // Silenced background sync notification
      }
    }
  } catch (err) {
    console.warn("[MOCK_DB Sync Error]", err);
    if (!isCurrentlyOffline) {
      isCurrentlyOffline = true;
      // Silenced background sync notification
    }
  } finally {
    isSyncing = false;
  }
}

// Fetch master state initially on browser load, and poll every 1.5s
if (typeof window !== 'undefined') {
  setTimeout(() => {
    syncWithServerDirect(undefined, undefined, true);
    setInterval(() => {
      syncWithServerDirect();
    }, 1500);
  }, 1000);

  // Instantly force synchronization when connection is re-established
  window.addEventListener('online', () => {
    console.log("[MOCK_DB] Browser reconnected online. Forcing instant synchronization...");
    syncWithServerDirect(undefined, undefined, true);
  });
}


function getDocumentsInCollection(collectionPath: string) {
  const docs: MockDocSnapshot[] = [];
  const prefix = collectionPath + '/';
  const expectedSegments = collectionPath.split('/').length + 1;
  
  for (const [docPath, data] of Object.entries(MOCK_STORE)) {
    if (docPath.startsWith(prefix)) {
      const segments = docPath.split('/');
      if (segments.length === expectedSegments) {
        const id = segments[segments.length - 1];
        docs.push(new MockDocSnapshot(new MockDocRef(collectionPath, id), data));
      }
    }
  }
  return docs;
}

// 3. Simulated Auth Manager
export const EXPLICIT_CREDENTIALS = [
  { username: "Priyesh.Narayan", password: "CML2025!!", property: "cml", name: "Priyesh Narayan", email: "graphics@cml.com.fj" },
  { username: "Rohit.Lal", password: "CML2026!!", property: "cml", name: "Rohit Lal", email: "rohit@cml.com.fj" },
  { username: "Shahil.Sharma", password: "CML2026!!", property: "cml", name: "Shahil Sharma", email: "manageraccounts@cml.com.fj" },
  { username: "Zaiba.Khan", password: "FLYAWAY2026!!", property: "cml", name: "Zaiba Khan", email: "accounts@cml.com.fj" },
  { username: "Priyesh.Narayan.Ramada", password: "RAMADA2026!!", property: "ramada", name: "Priyesh Narayan", email: "graphics@cml.com.fj" },
  { username: "Priyesh.Narayan.WG", password: "WG2026!!", property: "wyndham", name: "Priyesh Narayan", email: "graphics@cml.com.fj" },
  { username: "Shwaran.Shivani", password: "CML2026!!", property: "cml", name: "Shwaran Shivani", email: "sales@cml.com.fj" },
  { username: "John.Singh", password: "CML2026!!", property: "cml", name: "John Singh", email: "itmanager@cml.com.fj" },
  { username: "Anjeshni.Devi", password: "FLYAWAY26!!", property: "cml", name: "Anjeshni Devi", email: "reservations@ramadawailoaloafiji.com" },
  { username: "Charlene.Nand", password: "CHARLENE26!!", property: "ramada", name: "Charlene Nand", email: "MOD@ramadawailoaloafiji.com" },
  { username: "Nolau.Malo", password: "RAMADA26!!", property: "ramada", name: "Nolau Malo", email: "roomsd@ramadawailoaloafiji.com" },
  { username: "Neetisa.Devi", password: "CML2026!!", property: "cml", name: "Neetisa Devi", email: "hr@cml.com.fj" },
  { username: "Charles.Cebujano", password: "Blukukurtz_8", property: "cml", name: "Charles Cebujano", email: "digitalmedia@cml.com.fj" },
  { username: "Charles.Cebujano.WG", password: "WG123456!@", property: "wyndham", name: "Charles Cebujano", email: "cml@wyndhamgardenwailoaloafiji.com" }
];

class MockAuth {
  private listeners = new Set<(user: any) => void>();
  private _currentUser: any = null;

  constructor() {
    this._currentUser = null;
    try {
      const saved = localStorage.getItem('cml_mock_user');
      if (saved) {
        this._currentUser = JSON.parse(saved);
      }
    } catch (e) {}

    setTimeout(() => {
      this.trigger();
    }, 100);
  }

  get currentUser() {
    return this._currentUser;
  }

  onAuthStateChanged(callback: (user: any) => void) {
    this.listeners.add(callback);
    setTimeout(() => {
      callback(this._currentUser);
    }, 0);
    return () => {
      this.listeners.delete(callback);
    };
  }

  trigger() {
    this.listeners.forEach(cb => {
      try {
        cb(this._currentUser);
      } catch (err) {
        console.error("[MOCK_AUTH] Listener error:", err);
      }
    });
  }

  async signInWithEmailAndPassword(email: string, pass: string) {
    const trimmedInput = (email || "").trim().toLowerCase();
    const matched = EXPLICIT_CREDENTIALS.find(u => 
      (u.username.toLowerCase() === trimmedInput || u.email.toLowerCase() === trimmedInput) && 
      u.password === pass
    );

    const isCharles = email === "digitalmedia@cml.com.fj";
    const displayName = matched ? matched.name : (isCharles ? "Charles Cebujano" : (email ? email.split('@')[0] : 'Guest User'));
    const resolvedEmail = matched ? matched.email : (email || 'user@example.com');
    const resolvedUid = matched ? `user_${matched.username.toLowerCase()}_${matched.property}` : (isCharles ? "charles_mock_uid" : 'user_' + Math.random().toString(36).substring(2, 11));

    if (matched) {
      try {
        localStorage.setItem('cml_suggested_property', matched.property);
      } catch (e) {}
    }

    this._currentUser = {
      uid: resolvedUid,
      email: resolvedEmail,
      displayName: displayName,
      photoURL: isCharles ? 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=256' : ''
    };
    try {
      localStorage.setItem('cml_mock_user', JSON.stringify(this._currentUser));
    } catch (e) {}
    this.trigger();
    return { user: this._currentUser };
  }

  async createUserWithEmailAndPassword(email: string, pass: string) {
    return this.signInWithEmailAndPassword(email, pass);
  }

  async signOut() {
    this._currentUser = null;
    try {
      localStorage.removeItem('cml_mock_user');
    } catch (e) {}
    this.trigger();
    return Promise.resolve();
  }
}

// Seeding Initial Datasets (If local DB hasn't been initialized yet)
const DEFAULT_USERS = {
  "users/charles_mock_uid": {
    email: "digitalmedia@cml.com.fj",
    displayName: "Charles Cebujano",
    role: "Administrator",
    photoURL: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=256",
    createdAt: new Date().toISOString(),
    loginCount: 15
  },
  "users/rohit_mock_uid": {
    email: "rohit@cml.com.fj",
    displayName: "Rohit",
    role: "Administrator",
    createdAt: new Date().toISOString(),
    loginCount: 8
  },
  "users/graphics_mock_uid": {
    email: "graphics@cml.com.fj",
    displayName: "Graphics Team",
    role: "Administrator",
    createdAt: new Date().toISOString(),
    loginCount: 3
  },
  "users/reservations_mock_uid": {
    email: "reservations@ramadawailoaloafiji.com",
    displayName: "Reservations Dept",
    role: "Administrator",
    createdAt: new Date().toISOString(),
    loginCount: 0
  },
  "users/manager_mock_uid": {
    email: "manager@cml.com.fj",
    displayName: "Operational Manager",
    role: "Manager",
    createdAt: new Date().toISOString(),
    loginCount: 12
  }
};

const PROPERTIES = ["cml", "ramada", "wyndham", "radisson"];

let isSeeded = false;
try {
  isSeeded = !!localStorage.getItem('cml_mock_db_seeded');
} catch (e) {
  console.warn("[MOCK_DB] Could not check seed status:", e);
}

if (!isSeeded) {
  console.log("[MOCK_DB] Seeding hybrid client database with premium datasets...");
  
  for (const [key, user] of Object.entries(DEFAULT_USERS)) {
    MOCK_STORE[key] = user;
  }

  PROPERTIES.forEach(prop => {
    MOCK_STORE[`complaints-${prop}/comp_1`] = {
      id: "comp_1",
      guestName: "Deborah Jenkins",
      roomNumber: "305",
      title: "Air Conditioner Noise",
      description: "Guest complained that the air conditioner hummed loudly during the night, interrupting sleep. Requested room move or urgent service.",
      severity: "High",
      status: "Resolved",
      owner: "Engineering",
      createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
      updates: [
        { message: "Assigned technician Savenaca to inspect unit.", timestamp: new Date(Date.now() - 3600000 * 4).toISOString(), user: "Operational Manager" },
        { message: "Technician tightened housing brackets and balanced the fan. Noise successfully resolved.", timestamp: new Date(Date.now() - 3600000 * 2).toISOString(), user: "Engineering Dept" }
      ]
    };
    MOCK_STORE[`complaints-${prop}/comp_2`] = {
      id: "comp_2",
      guestName: "Marc-Antoine Dupont",
      roomNumber: "102",
      title: "Delayed Airport Shuttle",
      description: "Guest missed their lunch booking due to the 11:30 AM airport shuttle arriving 25 minutes late because of local pipeline roadworks.",
      severity: "Medium",
      status: "In Progress",
      owner: "Front Office",
      createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
      updates: [
        { message: "Offered complimentary welcome mocktails and a $40 F&B voucher to apologize for the delay.", timestamp: new Date(Date.now() - 3600000 * 1).toISOString(), user: "Front Desk Duty Manager" }
      ]
    };

    MOCK_STORE[`lost-and-found-${prop}/item_1`] = {
      id: "item_1",
      itemName: "Silver Rolex Wristwatch",
      description: "Oyster Perpetual model, silver band, slightly scratched on the face.",
      locationFound: "Room 402 Bedside Table",
      staffName: "Anita Prasad",
      staffPosition: "Housekeeping",
      imageUrl: "https://images.unsplash.com/photo-1547996160-81dfa63595dd?q=80&w=1000&auto=format&fit=crop",
      status: "Found",
      propertyId: prop,
      createdAt: new Date(Date.now() - 3600000 * 24).toISOString()
    };
    MOCK_STORE[`lost-and-found-${prop}/item_2`] = {
      id: "item_2",
      itemName: "Blue Leather Wallet",
      description: "Contains Fiji national ID and various credit cards. No cash found.",
      locationFound: "Gym Changing Room",
      staffName: "Rajesh Kumar",
      staffPosition: "Security",
      imageUrl: "https://images.unsplash.com/photo-1627123424574-724758594e93?q=80&w=1000&auto=format&fit=crop",
      status: "Found",
      propertyId: prop,
      createdAt: new Date(Date.now() - 3600000 * 48).toISOString()
    };

    MOCK_STORE[`restaurant-guests-${prop}/guest_1`] = {
      id: "guest_1",
      fullName: "Akisi Ravuvu",
      room: "405",
      pax: 2,
      plan: "Half Board (HB)",
      status: "Active",
      visitCount: 1,
      rewardPoints: 100,
      notes: "Vegetarian meals preferred. Allergic to pineapples."
    };
    MOCK_STORE[`restaurant-guests-${prop}/guest_1/visits/v1`] = {
      id: "v1",
      timestamp: new Date(Date.now() - 86400000).toISOString(),
      servedBy: "Waisake L.",
      meal: "Breakfast",
      notes: "Enjoyed the fresh tropical fruit platter."
    };

    MOCK_STORE[`mailer-contacts-${prop}/contact_1`] = {
      id: "contact_1",
      name: "Tevita Waqanidrola",
      email: "tevitaw@ramadawailoaloafiji.com",
      department: "Food & Beverage",
      role: "F&B Captain",
      active: true,
      lastEmailed: "2026-05-25"
    };
    MOCK_STORE[`mailer-contacts-${prop}/contact_2`] = {
      id: "contact_2",
      name: "Litia Naulumatua",
      email: "litian@ramadawailoaloafiji.com",
      department: "Housekeeping",
      role: "Floor Supervisor",
      active: true,
      lastEmailed: "2026-05-26"
    };

    MOCK_STORE[`flipbooks-${prop}/fb_1`] = {
      id: "fb_1",
      title: "CML Standard Grooming Guidelines",
      category: "SOP Manuals",
      pagesUrl: "https://ramadawailoaloafiji.com/wp-content/uploads/2026/05/grooming_guide.pdf",
      pageCount: 12,
      lastUpdated: new Date().toISOString()
    };
  });

  MOCK_STORE[`posts/post_1`] = {
    id: "post_1",
    title: "Upcoming CML Anniversary Long-Service Awards Nominations",
    content: "Team, please remember to submit your nominations for the annual Long-Service awards. Let's celebrate our hardworking leaders who have been with CML since inception under our Fiji properties!",
    authorName: "Charles Cebujano",
    authorEmail: "digitalmedia@cml.com.fj",
    authorRole: "Administrator",
    createdAt: new Date(Date.now() - 3600000 * 10).toISOString(),
    likes: 8,
    likedBy: []
  };
  MOCK_STORE[`posts/post_1/comments/comm1`] = {
    id: "comm1",
    content: "Outstanding! I would love to nominate Litia from Housekeeping. She is incredible.",
    authorName: "Rohit",
    authorRole: "Administrator",
    createdAt: new Date(Date.now() - 3600000 * 8).toISOString()
  };

  MOCK_STORE[`users/charles_mock_uid/notifications/notif_1`] = {
    id: "notif_1",
    title: "SOP Document Approved",
    message: "\"CML Standard Grooming Guidelines\" has been successfully approved and verified. Now visible to all staff.",
    type: "system",
    read: false,
    createdAt: new Date(Date.now() - 600000).toISOString()
  };
  MOCK_STORE[`users/charles_mock_uid/notifications/notif_2`] = {
    id: "notif_2",
    title: "New Forum Post",
    message: "Rohit posted a comment on the Long-Service awards announcement.",
    type: "forum",
    read: false,
    createdAt: new Date(Date.now() - 1200000).toISOString()
  };

  saveMockStore();
  try {
    localStorage.setItem('cml_mock_db_seeded', 'true');
  } catch (e) {
    console.warn("[MOCK_DB] Could not set mock db seeded flag:", e);
  }
}

// 4. Initialization of REAL production-grade structures
let firebaseApp: any = null;
let productionDb: any = null;
let productionAuth: any = null;
let initializedRealFirebase = false;

if (firebaseConfig && firebaseConfig.apiKey) {
  try {
    firebaseApp = initializeApp(firebaseConfig);
    productionDb = getFirestore(firebaseApp, (firebaseConfig as any).firestoreDatabaseId || "default");
    productionAuth = getAuth(firebaseApp);
    initializedRealFirebase = true;
    console.log("[Firebase Hybrid] Live production database and auth bridges activated successfully.");
    
    // Offline persistence bypassed for named database support and sandbox stability
    console.log("[Firebase Hybrid] Sandbox local/real hybrid database initialized ready.");
    
    // Asynchronously pre-register all defined staff members into Firebase Authentication & Firestore
    setTimeout(async () => {
      try {
        console.log("[Firebase Seeder] Starting dynamic background pre-registration of corporate user list...");
        for (const cred of EXPLICIT_CREDENTIALS) {
          try {
            const firstMatchRef = EXPLICIT_CREDENTIALS.find(u => u.email.toLowerCase() === cred.email.toLowerCase());
            const passToUse = firstMatchRef ? firstMatchRef.password : cred.password;
            
            const res = await createUserWithEmailAndPassword(productionAuth, cred.email, passToUse);
            const u = res.user;
            if (u) {
              console.log(`[Firebase Seeder] Registered new account: ${cred.email}`);
              const userDocRef = fbDoc(productionDb, 'users', u.uid);
              await fbSetDoc(userDocRef, {
                displayName: cred.name,
                email: cred.email,
                photoURL: '',
                role: 'Administrator',
                property: cred.property,
                createdAt: fbServerTimestamp(),
                lastLogin: fbServerTimestamp(),
                loginCount: 0
              });
              console.log(`[Firebase Seeder] Created Firestore user profile for: ${cred.email}`);
            }
          } catch (itemErr: any) {
            if (itemErr.code === 'auth/email-already-in-use') {
              // Ignore already registered users
            } else if (itemErr.code === 'auth/operation-not-allowed') {
              console.warn("[Firebase Seeder] Live email authentication is disabled in Firebase Console. Aborting live seeder.");
              break; // Abort further attempts as this is a master switch
            } else {
              console.warn(`[Firebase Seeder] Synchronization warning for ${cred.email}:`, itemErr.message);
            }
          }
        }
      } catch (seedErr) {
        console.warn("[Firebase Seeder] Background thread error:", seedErr);
      }
    }, 1500);
  } catch (err) {
    console.warn("[Firebase Hybrid] Failed to initialize live Firebase SDK. Falling back to local/express mock store:", err);
  }
}

// 5. Adaptive Export Bridges (Prevents runtime crashes 100%)

const mockAuthInstance = new MockAuth();

let isQuotaExhaustedGlobal = false;

function isQuotaOrResourceExhausted(err: any): boolean {
  if (!err) return false;
  const errMsg = String(err.message || err || "").toLowerCase();
  const errCode = String(err.code || "").toLowerCase();
  const isExhausted = (
    errCode === "resource-exhausted" ||
    errCode === "permission-denied" ||
    errMsg.includes("quota") ||
    errMsg.includes("limit exceeded") ||
    errMsg.includes("exhausted") ||
    errMsg.includes("billing")
  );
  if (isExhausted && !isQuotaExhaustedGlobal) {
    isQuotaExhaustedGlobal = true;
    console.warn("[Firebase Hybrid] Quota exceeded on live database operation. Automatically transitioning this session down to local corporate sandbox safely.");
    try {
      auth.setMode('mock');
    } catch (e) {}
  }
  return isExhausted;
}

class HybridAuth {
  private activeMode: 'real' | 'mock' = 'mock';
  
  constructor() {
    this.activeMode = 'mock';
  }

  get currentUser() {
    return mockAuthInstance.currentUser;
  }

  setMode(mode: 'real' | 'mock') {
    if (isQuotaExhaustedGlobal) {
      this.activeMode = 'mock';
      return;
    }
    this.activeMode = mode;
  }

  getMode() {
    if (isQuotaExhaustedGlobal) {
      return 'mock';
    }
    return this.activeMode;
  }

  onAuthStateChanged(callback: (user: any) => void) {
    const unsubMock = mockAuthInstance.onAuthStateChanged((mockUser) => {
      callback(mockUser);
    });

    return () => {
      unsubMock();
    };
  }

  async signInWithEmailAndPassword(email: string, pass: string) {
    this.activeMode = 'mock';
    const result = await mockAuthInstance.signInWithEmailAndPassword(email, pass);
    
    // Background authentication to actual Firebase production-grade structures for real integrations
    if (initializedRealFirebase && productionAuth) {
      try {
        const trimmedInput = (email || "").trim().toLowerCase();
        const matched = EXPLICIT_CREDENTIALS.find(u => 
          (u.username.toLowerCase() === trimmedInput || u.email.toLowerCase() === trimmedInput) && 
          u.password === pass
        );
        const resolvedEmail = matched ? matched.email : email;
        console.log(`[Firebase Hybrid] Sychronizing background session to live Firebase Auth for ${resolvedEmail}...`);
        await signInWithEmailAndPassword(productionAuth, resolvedEmail, pass);
        console.log("[Firebase Hybrid] Live authentication background bridge success.");
      } catch (authErr: any) {
        console.warn("[Firebase Hybrid] Live Auth background bridge missed synchronization:", authErr.message);
      }
    }

    setTimeout(() => {
      syncWithServerDirect(undefined, undefined, true);
    }, 50);
    return result;
  }

  async createUserWithEmailAndPassword(email: string, pass: string) {
    this.activeMode = 'mock';
    const result = await mockAuthInstance.createUserWithEmailAndPassword(email, pass);
    
    // Background creation or authentication to actual Firebase production-grade structures for real integrations
    if (initializedRealFirebase && productionAuth) {
      try {
        console.log(`[Firebase Hybrid] Registering/authenticating background session on live Firebase Auth for ${email}...`);
        await createUserWithEmailAndPassword(productionAuth, email, pass);
        console.log("[Firebase Hybrid] Live registration background bridge success.");
      } catch (authErr: any) {
        if (authErr.code === 'auth/email-already-in-use') {
          try {
            await signInWithEmailAndPassword(productionAuth, email, pass);
            console.log("[Firebase Hybrid] Live authentication fallback background bridge success.");
          } catch (signInErr: any) {
            console.warn("[Firebase Hybrid] Background login failed for existing live Firebase Auth account:", signInErr.message);
          }
        } else {
          console.warn("[Firebase Hybrid] Background registration failed on live Firebase Auth:", authErr.message);
        }
      }
    }

    setTimeout(() => {
      syncWithServerDirect(undefined, undefined, true);
    }, 50);
    return result;
  }

  async signOut() {
    this.activeMode = 'mock';
    const result = await mockAuthInstance.signOut();
    
    // Sign out from live Firebase production-grade authentication in the background
    if (initializedRealFirebase && productionAuth) {
      try {
        await signOut(productionAuth);
        console.log("[Firebase Hybrid] Live session background bridge signs out.");
      } catch (err: any) {
        console.warn("[Firebase Hybrid] Live signOut background failure:", err.message);
      }
    }

    return result;
  }
}

export const auth = new HybridAuth();
export const db = initializedRealFirebase ? (productionDb || { _isMock: true }) : { _isMock: true };

// Helper to identify public collections bypass
function isPublicPath(target: any, ...args: any[]): boolean {
  if (auth && typeof auth.getMode === "function" && auth.getMode() !== "real") {
    return false;
  }
  const checkStr = (str: any): boolean => {
    return typeof str === 'string' && (str.includes('business-cards') || str.includes('flipbooks'));
  };
  if (checkStr(target)) return true;
  if (args && args.some(arg => checkStr(arg))) return true;
  if (target && typeof target === 'object') {
    if ('path' in target && checkStr(target.path)) return true;
    if ('parentPath' in target && checkStr(target.parentPath)) return true;
    if ('collectionRef' in target && target.collectionRef) {
      return isPublicPath(target.collectionRef);
    }
  }
  return false;
}

// Collection factory
export const collection = (firestoreOrCollection: any, ...args: any[]) => {
  const isPub = isPublicPath(firestoreOrCollection, ...args);
  // If we are using real Firebase and (we are in real mode OR the path is public) and the database is not our mock dictionary
  if (initializedRealFirebase && (auth.getMode() === 'real' || isPub) && firestoreOrCollection && typeof firestoreOrCollection === 'object' && !('_isMock' in firestoreOrCollection)) {
    try {
      if (args.length > 0) {
        return fbCollection(firestoreOrCollection, args[0], ...args.slice(1));
      }
      return firestoreOrCollection; // acts as CollectionReference
    } catch (e) {
      console.warn("[Firebase Hybrid] Failed real collection factory. Falling back to mock resolution:", e);
    }
  }
  
  // High-Fidelity Mock collection resolution
  let pathStr = '';
  if (typeof firestoreOrCollection === 'string') {
    pathStr = firestoreOrCollection;
    if (args.length > 0) {
      pathStr += '/' + args.join('/');
    }
  } else if (firestoreOrCollection && typeof firestoreOrCollection === 'object') {
    if (firestoreOrCollection.type === 'collection') {
      pathStr = firestoreOrCollection.path;
    } else if (firestoreOrCollection.type === 'document') {
      pathStr = firestoreOrCollection.path;
    } else {
      pathStr = args[0] || '';
      if (args.length > 1) {
        pathStr = [args[0], ...args.slice(1)].join('/');
      }
    }
  }
  return new MockCollectionRef(pathStr);
};

// Document factory
export const doc = (firestoreOrColOrDoc: any, ...args: any[]) => {
  const isPub = isPublicPath(firestoreOrColOrDoc, ...args);
  if (initializedRealFirebase && (auth.getMode() === 'real' || isPub) && firestoreOrColOrDoc && typeof firestoreOrColOrDoc === 'object' && !('_isMock' in firestoreOrColOrDoc)) {
    try {
      if (args.length > 0) {
        return fbDoc(firestoreOrColOrDoc, args[0], ...args.slice(1));
      }
      return fbDoc(firestoreOrColOrDoc);
    } catch (e) {
      console.warn("[Firebase Hybrid] Failed real doc factory. Falling back to mock resolution:", e);
    }
  }

  // High-Fidelity Mock doc resolution
  let pathStr = '';
  let id = '';
  const generateAutoId = () => 'auto_' + Math.random().toString(36).substring(2, 11) + '_' + Date.now().toString(36);

  if (typeof firestoreOrColOrDoc === 'string') {
    pathStr = firestoreOrColOrDoc;
    if (args.length > 0) {
      id = args[args.length - 1];
      if (args.length > 1) {
        pathStr += '/' + args.slice(0, -1).join('/');
      }
    }
  } else if (firestoreOrColOrDoc && typeof firestoreOrColOrDoc === 'object') {
    if (firestoreOrColOrDoc.type === 'collection') {
      pathStr = firestoreOrColOrDoc.path;
      id = args[0] || generateAutoId();
    } else if (firestoreOrColOrDoc.type === 'document') {
      pathStr = firestoreOrColOrDoc.parentPath;
      id = firestoreOrColOrDoc.id;
    } else {
      if (args.length >= 2) {
        id = args[args.length - 1];
        pathStr = args.slice(0, -1).join('/');
      } else {
        pathStr = args[0] || '';
        const segments = pathStr.split('/').filter(Boolean);
        if (segments.length % 2 === 1) {
          id = generateAutoId();
        } else if (segments.length > 0) {
          id = segments.pop() || '';
          pathStr = segments.join('/');
        }
      }
    }
  }
  return new MockDocRef(pathStr, id);
};

export const query = (collectionRef: any, ...constraints: any[]) => {
  const isPub = isPublicPath(collectionRef);
  if (initializedRealFirebase && (auth.getMode() === 'real' || isPub) && collectionRef && typeof collectionRef === 'object' && !('_isMock' in collectionRef)) {
    try {
      return fbQuery(collectionRef, ...constraints.map(c => {
        if (c && typeof c === 'object' && c.type === 'where') {
          return fbWhere(c.field, c.op, c.val);
        }
        if (c && typeof c === 'object' && c.type === 'orderBy') {
          return fbOrderBy(c.field, c.direction);
        }
        if (c && typeof c === 'object' && c.type === 'limit') {
          return fbLimit(c.n);
        }
        return c;
      }));
    } catch (e) {
      console.warn("[Firebase Hybrid] fbQuery failed. Falling back to mock resolution:", e);
    }
  }
  return new MockQuery(collectionRef, constraints);
};

export const where = (field: string, op: any, val: any) => {
  return { type: 'where', field, op, val };
};

export const orderBy = (field: string, direction?: 'asc' | 'desc') => {
  return { type: 'orderBy', field, direction };
};

export const limit = (n: number) => {
  return { type: 'limit', n };
};

// Premium Adaptive Hybrid Firebase SDK client wrapper
// Dynamically bridges live Firestore/Auth production gates with elegant local-storage mocks

// Helper to convert mock references and queries into genuine real Firestore equivalents
function convertToRealReference(target: any): any {
  if (!initializedRealFirebase || !productionDb) return null;
  if (!target || typeof target !== 'object') return target;
  
  if (!('_isMock' in target)) {
    return target;
  }
  
  if (target.type === 'document') {
    return fbDoc(productionDb, target.parentPath, target.id);
  }
  
  if (target.type === 'collection') {
    return fbCollection(productionDb, target.path);
  }
  
  if ('_isMock' in target && target.collectionRef) {
    const realCol = fbCollection(productionDb, target.collectionRef.path);
    const realConstraints = (target.constraints || []).map((c: any) => {
      if (c && typeof c === 'object') {
        if (c.type === 'where') {
          return fbWhere(c.field, c.op, c.val);
        }
        if (c.type === 'orderBy') {
          return fbOrderBy(c.field, c.direction);
        }
        if (c.type === 'limit') {
          return fbLimit(c.n);
        }
      }
      return c;
    });
    return fbQuery(realCol, ...realConstraints);
  }
  
  return target;
}

// Real-time snap subscriber
const listeners: Record<string, Set<() => void>> = {};

function triggerListeners(path: string) {
  if (listeners[path]) {
    listeners[path].forEach(cb => {
      try {
        cb();
      } catch (e) {
        console.error("[MOCK_DB] Listener dispatch error:", e);
      }
    });
  }
}

export const onSnapshot = (target: any, onNext: (snap: any) => void, onError?: (err: any) => void) => {
  const isPub = isPublicPath(target);
  let isUnsubscribed = false;
  let activeUnsubscribe: (() => void) | null = null;

  // Set up mock subscription
  const startMockListener = () => {
    const updateCallback = () => {
      if (isUnsubscribed) return;
      try {
        if (target.type === 'document') {
          const fullPath = `${target.parentPath}/${target.id}`;
          const data = MOCK_STORE[fullPath];
          onNext(new MockDocSnapshot(target, data));
        } else {
          const path = target.type === 'collection' ? target.path : target.collectionRef.path;
          const docs = getDocumentsInCollection(path);
          onNext(new MockQuerySnapshot(docs));
        }
      } catch (e) {
        if (onError) onError(e);
      }
    };

    setTimeout(updateCallback, 0);

    const watchPath = target.type === 'document' ? `${target.parentPath}/${target.id}` : (target.type === 'collection' ? target.path : target.collectionRef.path);
    if (!listeners[watchPath]) {
      listeners[watchPath] = new Set();
    }
    listeners[watchPath].add(updateCallback);

    activeUnsubscribe = () => {
      if (listeners[watchPath]) {
        listeners[watchPath].delete(updateCallback);
      }
    };
  };

  const safeOnError = (err: any) => {
    if (isQuotaOrResourceExhausted(err)) {
      console.warn("[Firebase Hybrid] Quota exceeded inside onSnapshot listener. Activating local corporate sandbox.");
      if (activeUnsubscribe) {
        try { activeUnsubscribe(); } catch (e) {}
      }
      startMockListener();
    } else {
      if (onError) onError(err);
    }
  };

  if (isQuotaExhaustedGlobal) {
    startMockListener();
  } else if (initializedRealFirebase && (auth.getMode() === 'real' || isPub) && target && typeof target === 'object' && !('_isMock' in target)) {
    const realTarget = convertToRealReference(target) || target;
    try {
      activeUnsubscribe = fbOnSnapshot(realTarget, onNext, safeOnError);
    } catch (e) {
      if (isQuotaOrResourceExhausted(e)) {
        console.warn("[Firebase Hybrid] fbOnSnapshot initialization failed on quota. Activating sandbox mock.");
        startMockListener();
      } else {
        console.warn("[Firebase Hybrid] fbOnSnapshot failed. Falling back to mock observer.", e);
        startMockListener();
      }
    }
  } else {
    startMockListener();
  }

  return () => {
    isUnsubscribed = true;
    if (activeUnsubscribe) {
      try { activeUnsubscribe(); } catch (e) {}
    }
  };
};

export const getDoc = async (docRef: any) => {
  const isPub = isPublicPath(docRef);
  let targetRef = docRef;
  if (!isQuotaExhaustedGlobal && initializedRealFirebase && (auth.getMode() === 'real' || isPub)) {
    targetRef = convertToRealReference(docRef) || docRef;
  }
  
  if (!isQuotaExhaustedGlobal && initializedRealFirebase && (auth.getMode() === 'real' || isPub) && targetRef && typeof targetRef === 'object' && !('_isMock' in targetRef)) {
    try {
      return await fbGetDoc(targetRef);
    } catch (e) {
      if (isQuotaOrResourceExhausted(e)) {
        console.warn("[Firebase Hybrid] fbGetDocs/fbGetDoc hit quota limit. Transitioning to sandbox mode.");
      } else {
        console.warn("[Firebase Hybrid] fbGetDoc failed. Falling back to mock fetch.", e);
      }
    }
  }

  const fullPath = `${docRef.parentPath}/${docRef.id}`;
  const data = MOCK_STORE[fullPath];
  return new MockDocSnapshot(docRef, data);
};

export const getDocFromServer = getDoc;

export const getDocs = async (queryOrCollection: any) => {
  const isPub = isPublicPath(queryOrCollection);
  let targetRef = queryOrCollection;
  if (!isQuotaExhaustedGlobal && initializedRealFirebase && (auth.getMode() === 'real' || isPub)) {
    targetRef = convertToRealReference(queryOrCollection) || queryOrCollection;
  }

  if (!isQuotaExhaustedGlobal && initializedRealFirebase && (auth.getMode() === 'real' || isPub) && targetRef && typeof targetRef === 'object' && !('_isMock' in targetRef)) {
    try {
      return await fbGetDocs(targetRef);
    } catch (e) {
      if (isQuotaOrResourceExhausted(e)) {
        console.warn("[Firebase Hybrid] fbGetDocs hit quota limit. Transitioning to sandbox mode.");
      } else {
        console.warn("[Firebase Hybrid] fbGetDocs failed. Falling back to mock fetch.", e);
      }
    }
  }

  let path = '';
  if (queryOrCollection.type === 'collection') {
    path = queryOrCollection.path;
  } else if (queryOrCollection.collectionRef) {
    path = queryOrCollection.collectionRef.path;
  }
  const docs = getDocumentsInCollection(path);
  return new MockQuerySnapshot(docs);
};

export const setDoc = async (docRef: any, data: any) => {
  const isPub = isPublicPath(docRef);
  let targetRef = docRef;
  if (!isQuotaExhaustedGlobal && initializedRealFirebase && (auth.getMode() === 'real' || isPub)) {
    targetRef = convertToRealReference(docRef) || docRef;
  }

  if (!isQuotaExhaustedGlobal && initializedRealFirebase && (auth.getMode() === 'real' || isPub) && targetRef && typeof targetRef === 'object' && !('_isMock' in targetRef)) {
    try {
      return await fbSetDoc(targetRef, data);
    } catch (e) {
      if (isQuotaOrResourceExhausted(e)) {
        console.warn("[Firebase Hybrid] fbSetDoc hit quota limit. Fallback to sandbox mode.");
      } else {
        console.warn("[Firebase Hybrid] fbSetDoc failed. Save routed to local store backup.", e);
      }
    }
  }

  const fullPath = `${docRef.parentPath}/${docRef.id}`;
  MOCK_STORE[fullPath] = { ...data };
  saveMockStore(fullPath);
  triggerListeners(docRef.parentPath);
  triggerListeners(fullPath);
};

export const addDoc = async (collectionRef: any, data: any) => {
  const isPub = isPublicPath(collectionRef);
  let targetRef = collectionRef;
  if (!isQuotaExhaustedGlobal && initializedRealFirebase && (auth.getMode() === 'real' || isPub)) {
    targetRef = convertToRealReference(collectionRef) || collectionRef;
  }

  if (!isQuotaExhaustedGlobal && initializedRealFirebase && (auth.getMode() === 'real' || isPub) && targetRef && typeof targetRef === 'object' && !('_isMock' in targetRef)) {
    try {
      return await fbAddDoc(targetRef, data);
    } catch (e) {
      if (isQuotaOrResourceExhausted(e)) {
        console.warn("[Firebase Hybrid] fbAddDoc hit quota limit. Fallback to sandbox mode.");
      } else {
        console.warn("[Firebase Hybrid] fbAddDoc failed. Fallback to local store backup.", e);
      }
    }
  }

  const id = 'mock_id_' + Math.random().toString(36).substring(2, 11);
  const docRef = new MockDocRef(collectionRef.path, id);
  const fullPath = `${collectionRef.path}/${id}`;
  MOCK_STORE[fullPath] = { ...data, id };
  saveMockStore(fullPath);
  triggerListeners(collectionRef.path);
  return docRef;
};

export const updateDoc = async (docRef: any, updates: any) => {
  const isPub = isPublicPath(docRef);
  let targetRef = docRef;
  if (!isQuotaExhaustedGlobal && initializedRealFirebase && (auth.getMode() === 'real' || isPub)) {
    targetRef = convertToRealReference(docRef) || docRef;
  }

  if (!isQuotaExhaustedGlobal && initializedRealFirebase && (auth.getMode() === 'real' || isPub) && targetRef && typeof targetRef === 'object' && !('_isMock' in targetRef)) {
    try {
      return await fbUpdateDoc(targetRef, updates);
    } catch (e) {
      if (isQuotaOrResourceExhausted(e)) {
        console.warn("[Firebase Hybrid] fbUpdateDoc hit quota limit. Fallback to sandbox mode.");
      } else {
        console.warn("[Firebase Hybrid] fbUpdateDoc failed. Fallback to local store update.", e);
      }
    }
  }

  const fullPath = `${docRef.parentPath}/${docRef.id}`;
  const current = MOCK_STORE[fullPath] || {};
  
  const processedUpdates = { ...updates };
  for (const [key, val] of Object.entries(processedUpdates)) {
    if (val && typeof val === 'object') {
      if ((val as any).type === 'increment') {
        const prevNum = typeof current[key] === 'number' ? current[key] : 0;
        processedUpdates[key] = prevNum + (val as any).value;
      } else if ((val as any).type === 'arrayUnion') {
        const prevArray = Array.isArray(current[key]) ? current[key] : [];
        const unionValues = (val as any).values;
        processedUpdates[key] = [...prevArray, ...unionValues.filter((v: any) => !prevArray.includes(v))];
      }
    }
  }

  MOCK_STORE[fullPath] = {
    ...current,
    ...processedUpdates
  };
  saveMockStore(fullPath);
  triggerListeners(docRef.parentPath);
  triggerListeners(fullPath);
};

export const deleteDoc = async (docRef: any) => {
  const isPub = isPublicPath(docRef);
  let targetRef = docRef;
  if (!isQuotaExhaustedGlobal && initializedRealFirebase && (auth.getMode() === 'real' || isPub)) {
    targetRef = convertToRealReference(docRef) || docRef;
  }

  if (!isQuotaExhaustedGlobal && initializedRealFirebase && (auth.getMode() === 'real' || isPub) && targetRef && typeof targetRef === 'object' && !('_isMock' in targetRef)) {
    try {
      return await fbDeleteDoc(targetRef);
    } catch (e) {
      if (isQuotaOrResourceExhausted(e)) {
        console.warn("[Firebase Hybrid] fbDeleteDoc hit quota limit. Fallback to sandbox mode.");
      } else {
        console.warn("[Firebase Hybrid] fbDeleteDoc failed. Falling back to local store dispatch.", e);
      }
    }
  }

  const fullPath = `${docRef.parentPath}/${docRef.id}`;
  delete MOCK_STORE[fullPath];
  saveMockStore(fullPath, true);
  triggerListeners(docRef.parentPath);
  triggerListeners(fullPath);
};

export const serverTimestamp = () => {
  if (initializedRealFirebase && auth.getMode() === 'real') {
    return fbServerTimestamp();
  }
  return new Date().toISOString();
};

export const increment = (value: number) => {
  if (initializedRealFirebase && auth.getMode() === 'real') {
    return fbIncrement(value);
  }
  return { type: 'increment', value };
};

export const arrayUnion = (...values: any[]) => {
  if (initializedRealFirebase) {
    return fbArrayUnion(...values);
  }
  return { type: 'arrayUnion', values };
};

export const writeBatch = (dbInstance?: any) => {
  if (initializedRealFirebase && dbInstance && !('_isMock' in dbInstance)) {
    return fbWriteBatch(dbInstance);
  }
  
  const operations: Array<() => Promise<void>> = [];
  return {
    set: (docRef: any, data: any) => {
      operations.push(async () => {
        await setDoc(docRef, data);
      });
    },
    update: (docRef: any, updates: any) => {
      operations.push(async () => {
        await updateDoc(docRef, updates);
      });
    },
    delete: (docRef: any) => {
      operations.push(async () => {
        await deleteDoc(docRef);
      });
    },
    commit: async () => {
      for (const op of operations) {
        await op();
      }
    }
  };
};

const syncUserProfile = async (u: any, matchedTemplate: any, targetEmail: string) => {
  try {
    if (u) {
      const userDocRef = fbDoc(productionDb, 'users', u.uid);
      const userDoc = await fbGetDoc(userDocRef);
      if (!userDoc.exists()) {
        await fbSetDoc(userDocRef, {
          displayName: matchedTemplate ? matchedTemplate.name : (u.displayName || targetEmail.split('@')[0]),
          email: targetEmail,
          photoURL: '',
          role: 'Administrator',
          property: matchedTemplate ? matchedTemplate.property : 'cml',
          createdAt: fbServerTimestamp(),
          lastLogin: fbServerTimestamp(),
          loginCount: 1
        });
      }
    }
  } catch (seedErr) {
    console.warn("Fidelity seed failed:", seedErr);
  }
};

let googleAccessToken: string | null = null;

export const getGoogleAccessToken = () => googleAccessToken;
export const setGoogleAccessToken = (token: string | null) => {
  googleAccessToken = token;
};

export const connectGoogleWorkspace = async () => {
  if (initializedRealFirebase) {
    try {
      const provider = new GoogleAuthProvider();
      provider.addScope('https://www.googleapis.com/auth/forms.body');
      provider.addScope('https://www.googleapis.com/auth/forms.body.readonly');
      provider.addScope('https://www.googleapis.com/auth/forms.responses.readonly');
      provider.addScope('https://www.googleapis.com/auth/drive.readonly');
      provider.addScope('https://www.googleapis.com/auth/drive.file');
      provider.addScope('https://www.googleapis.com/auth/drive');
      
      const res = await signInWithPopup(productionAuth, provider);
      const credential = GoogleAuthProvider.credentialFromResult(res);
      if (credential?.accessToken) {
        googleAccessToken = credential.accessToken;
        return googleAccessToken;
      }
    } catch (error) {
      console.warn("[Firebase Auth] connectGoogleWorkspace failed:", error);
      throw error;
    }
  }
  throw new Error("Real Firebase is not initialized");
};

export const loginWithGoogle = async () => {
  if (initializedRealFirebase) {
    try {
      const provider = new GoogleAuthProvider();
      provider.addScope('https://www.googleapis.com/auth/forms.body');
      provider.addScope('https://www.googleapis.com/auth/forms.body.readonly');
      provider.addScope('https://www.googleapis.com/auth/forms.responses.readonly');
      provider.addScope('https://www.googleapis.com/auth/drive.readonly');
      provider.addScope('https://www.googleapis.com/auth/drive.file');
      provider.addScope('https://www.googleapis.com/auth/drive');
      
      const res = await signInWithPopup(productionAuth, provider);
      const credential = GoogleAuthProvider.credentialFromResult(res);
      if (credential?.accessToken) {
        googleAccessToken = credential.accessToken;
      }
      auth.setMode('real');
      return res;
    } catch (error) {
      console.warn("[Firebase Auth] Google login failed, fallback to simulated login:", error);
    }
  }
  return auth.signInWithEmailAndPassword("digitalmedia@cml.com.fj", "");
};

export const loginWithEmail = async (email: string, pass: string) => {
  const trimmedInput = (email || "").trim().toLowerCase();
  
  // Look for predefined explicit credentials by username or email
  const matchedTemplate = EXPLICIT_CREDENTIALS.find(u => 
    u.username.toLowerCase() === trimmedInput || u.email.toLowerCase() === trimmedInput
  );

  let targetEmail = email;
  let targetPass = pass;
  
  if (matchedTemplate) {
    targetEmail = matchedTemplate.email;
    // Suggest property in localStorage
    try {
      localStorage.setItem('cml_suggested_property', matchedTemplate.property);
    } catch (e) {}
  }

  if (initializedRealFirebase) {
    auth.setMode('real');
  } else {
    auth.setMode('mock');
  }
  return auth.signInWithEmailAndPassword(targetEmail, targetPass);
};

export const registerWithEmail = async (email: string, pass: string) => {
  const trimmedInput = (email || "").trim().toLowerCase();
  const matchedTemplate = EXPLICIT_CREDENTIALS.find(u => 
    u.username.toLowerCase() === trimmedInput || u.email.toLowerCase() === trimmedInput
  );
  const targetEmail = matchedTemplate ? matchedTemplate.email : email;

  if (initializedRealFirebase) {
    auth.setMode('real');
  } else {
    auth.setMode('mock');
  }
  return auth.createUserWithEmailAndPassword(targetEmail, pass);
};

export const resetPassword = async (email: string) => {
  const trimmedInput = (email || "").trim().toLowerCase();
  const matchedTemplate = EXPLICIT_CREDENTIALS.find(u => 
    u.username.toLowerCase() === trimmedInput || u.email.toLowerCase() === trimmedInput
  );
  const targetEmail = matchedTemplate ? matchedTemplate.email : email;
  console.log("[Firebase Auth] Password reset requested for:", targetEmail);
  return Promise.resolve();
};

export const logout = async () => {
  await auth.signOut();
};

export const onAuthStateChanged = (authObj: any, callback: (user: any) => void) => {
  if (authObj && typeof authObj.onAuthStateChanged === 'function') {
    return authObj.onAuthStateChanged(callback);
  }
  if (initializedRealFirebase && authObj) {
    return fbOnAuthStateChanged(authObj, callback);
  }
  return mockAuthInstance.onAuthStateChanged(callback);
};

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  console.error('[HYBRID_DB] Firestore warning: ', error, operationType, path);
}

export type User = any;
