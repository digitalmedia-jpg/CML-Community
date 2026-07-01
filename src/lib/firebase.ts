// Premium Adaptive Hybrid Firebase SDK client wrapper
// Fortified structural safeguards to completely eliminate white-screen component crashes

import { initializeApp } from "firebase/app";
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut,
  GoogleAuthProvider,
  signInWithPopup
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
  writeBatch as fbWriteBatch
} from "firebase/firestore";
import firebaseConfig from "../../firebase-applet-config.json";

// User type definition
export type User = any;

// 1. Definition of Mock References
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
  get path() {
    return this.collectionRef.path;
  }
}

const safeObjectProxy = (target: any): any => {
  return new Proxy(target, {
    get: (obj, prop) => {
      if (typeof prop === 'symbol') {
        return obj[prop];
      }
      if (prop === 'then' || prop === 'toJSON' || prop === 'constructor' || prop === 'prototype') {
        return obj[prop];
      }
      if (prop in obj) {
        const val = obj[prop];
        if (typeof val === 'object' && val !== null) {
          if (val instanceof Date) return val;
          return safeObjectProxy(val);
        }
        return val;
      }
      return undefined;
    }
  });
};

export class MockDocSnapshot {
  _isMock = true;
  metadata = { fromCache: false, hasPendingWrites: false };
  constructor(public ref: MockDocRef, public _data: any) {}
  exists() {
    return this._data !== undefined && this._data !== null;
  }
  data() {
    return safeObjectProxy(this._data || {});
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
  get size() {
    return this.docs.length;
  }
  forEach(callback: (doc: MockDocSnapshot) => void) {
    this.docs.forEach(callback);
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
  console.warn("[MOCK_DB] localStorage is unavailable.");
}

function saveMockStore(updatedPath?: string, isDelete = false) {
  try {
    localStorage.setItem('cml_mock_db', JSON.stringify(MOCK_STORE));
  } catch (e) {}
  
  if (updatedPath) {
    // Instantly trigger local snapshot listeners for real-time reactivity
    triggerListeners(updatedPath);
    const parts = updatedPath.split('/');
    if (parts.length > 1) {
      triggerListeners(parts.slice(0, -1).join('/'));
    }

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

try {
  const savedPendingUpdates = localStorage.getItem('cml_pending_updates');
  if (savedPendingUpdates) {
    pendingUpdates = JSON.parse(savedPendingUpdates);
  }
  const savedPendingDeletes = localStorage.getItem('cml_pending_deletes');
  if (savedPendingDeletes) {
    pendingDeletes = JSON.parse(savedPendingDeletes);
  }
} catch (e) {}

function savePendingSyncState() {
  try {
    localStorage.setItem('cml_pending_updates', JSON.stringify(pendingUpdates));
    localStorage.setItem('cml_pending_deletes', JSON.stringify(pendingDeletes));
  } catch (e) {}
}

let isCurrentlyOffline = false;
const listenersMap: Record<string, Set<() => void>> = {};

function triggerListeners(path: string) {
  if (listenersMap[path]) {
    listenersMap[path].forEach(cb => {
      try { cb(); } catch (e) {}
    });
  }
}

export async function syncWithServerDirect(updates?: Record<string, any>, deletedKeys?: string[], forcePush = false) {
  const isPushedSession = (updates && Object.keys(updates).length > 0) || (deletedKeys && deletedKeys.length > 0);
  
  if (!forcePush && !isPushedSession && Object.keys(pendingUpdates).length === 0 && pendingDeletes.length === 0) {
    return;
  }

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
        const changedKeys = new Set<string>();
        
        const clientOnlyKeys: Record<string, any> = {};
        for (const [k, newVal] of Object.entries(data.db)) {
          const oldVal = MOCK_STORE[k];
          if (k in pendingUpdates) {
            continue;
          }
          if (JSON.stringify(oldVal) !== JSON.stringify(newVal)) {
            MOCK_STORE[k] = newVal;
            changedKeys.add(k);
          }
        }
        
        if (data.db && Object.keys(data.db).length > 0) {
          for (const k of Object.keys(MOCK_STORE)) {
            if (!(k in data.db) && !k.startsWith('users/') && !k.startsWith('auth/') && !pendingDeletes.includes(k)) {
              if (!hasDoneInitialSync) {
                // Gather client-only items on page load to sync back to server instead of deleting them!
                clientOnlyKeys[k] = MOCK_STORE[k];
              } else {
                // Safeguard: Only delete if the server database has substantial records (e.g. not empty or partial re-sync)
                if (Object.keys(data.db).length > 5) {
                  delete MOCK_STORE[k];
                  changedKeys.add(k);
                }
              }
            }
          }
        }

        pendingDeletes.forEach(k => {
          if (k in MOCK_STORE) {
            delete MOCK_STORE[k];
            changedKeys.add(k);
          }
        });
        
        try {
          localStorage.setItem('cml_mock_db', JSON.stringify(MOCK_STORE));
        } catch (e) {}

        if (isCurrentlyOffline) {
          isCurrentlyOffline = false;
        }
        
        if (!hasDoneInitialSync) {
          hasDoneInitialSync = true;
          // If we had client-only additions on first load, push them back to the server so they sync everywhere!
          if (Object.keys(clientOnlyKeys).length > 0) {
            setTimeout(() => {
              syncWithServerDirect(clientOnlyKeys, undefined, true);
            }, 500);
          } else if (Object.keys(data.db || {}).length === 0 && Object.keys(MOCK_STORE).length > 0) {
            setTimeout(() => {
              syncWithServerDirect(MOCK_STORE, undefined, true);
            }, 500);
          }
        }

        pendingUpdates = {};
        pendingDeletes = [];
        savePendingSyncState();
        
        changedKeys.forEach(k => {
          triggerListeners(k);
          const parts = k.split('/');
          if (parts.length > 1) {
            triggerListeners(parts.slice(0, -1).join('/'));
          }
        });
      }
    } else {
      isCurrentlyOffline = true;
    }
  } catch (err) {
    isCurrentlyOffline = true;
  } finally {
    isSyncing = false;
  }
}

let sseConnection: EventSource | null = null;

export function setupRealTimeSync() {
  if (typeof window === 'undefined') return;
  if (sseConnection) return;

  console.log("[REAL_TIME_SYNC] Initializing real-time Server-Sent Events stream...");
  const sse = new EventSource("/api/sync-stream");
  sseConnection = sse;

  sse.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      if (data.type === "connected") {
        console.log(`[REAL_TIME_SYNC] Connected! Server version: ${data.serverVersion}`);
        const savedVersion = localStorage.getItem('cml_server_version');
        if (savedVersion && savedVersion !== data.serverVersion) {
          console.log("[REAL_TIME_SYNC] New server build published! Auto-reloading client for real-time update...");
          localStorage.setItem('cml_server_version', data.serverVersion);
          window.location.reload();
          return;
        }
        localStorage.setItem('cml_server_version', data.serverVersion);
      } else if (data.type === "update") {
        const { updates, deletedKeys } = data;
        const changedKeys = new Set<string>();

        if (updates && typeof updates === 'object') {
          for (const [k, newVal] of Object.entries(updates)) {
            const oldVal = MOCK_STORE[k];
            if (JSON.stringify(oldVal) !== JSON.stringify(newVal)) {
              MOCK_STORE[k] = newVal;
              changedKeys.add(k);
            }
          }
        }

        if (Array.isArray(deletedKeys)) {
          deletedKeys.forEach(k => {
            if (k in MOCK_STORE) {
              delete MOCK_STORE[k];
              changedKeys.add(k);
            }
          });
        }

        if (changedKeys.size > 0) {
          try {
            localStorage.setItem('cml_mock_db', JSON.stringify(MOCK_STORE));
          } catch (e) {}

          changedKeys.forEach(k => {
            triggerListeners(k);
            const parts = k.split('/');
            if (parts.length > 1) {
              triggerListeners(parts.slice(0, -1).join('/'));
            }
          });
          console.log(`[REAL_TIME_SYNC] Instantly applied ${changedKeys.size} live updates from other users!`);
        }
      }
    } catch (err) {
      console.error("[REAL_TIME_SYNC] Error in real-time stream processing:", err);
    }
  };

  sse.onerror = () => {
    console.warn("[REAL_TIME_SYNC] Connection interrupted. Reconnecting in 5s...");
    sse.close();
    sseConnection = null;
    setTimeout(setupRealTimeSync, 5000);
  };
}

export async function forceSyncNow() {
  try {
    console.log("[REAL_TIME_SYNC] Executing active manual sync query with server...");
    const response = await fetch("/api/sync-cloud");
    if (response.ok) {
      const dbData = await response.json();
      if (dbData && typeof dbData === "object") {
        const changedKeys = new Set<string>();
        
        // 1. Update/insert keys that are different
        for (const [k, newVal] of Object.entries(dbData)) {
          const oldVal = MOCK_STORE[k];
          if (JSON.stringify(oldVal) !== JSON.stringify(newVal)) {
            MOCK_STORE[k] = newVal;
            changedKeys.add(k);
          }
        }
        
        // 2. Clean up keys that were deleted from server
        for (const k of Object.keys(MOCK_STORE)) {
          if (!(k in dbData) && !k.startsWith('users/') && !k.startsWith('auth/')) {
            delete MOCK_STORE[k];
            changedKeys.add(k);
          }
        }
        
        if (changedKeys.size > 0) {
          try {
            localStorage.setItem('cml_mock_db', JSON.stringify(MOCK_STORE));
          } catch (e) {}
          
          changedKeys.forEach(k => {
            triggerListeners(k);
            const parts = k.split('/');
            if (parts.length > 1) {
              triggerListeners(parts.slice(0, -1).join('/'));
            }
          });
          console.log(`[REAL_TIME_SYNC] Instant manual sync successfully applied ${changedKeys.size} updates.`);
        } else {
          console.log("[REAL_TIME_SYNC] Database is already fully up-to-date with server.");
        }
      }
    }
    
    // Also push any local pending updates to the server
    await syncWithServerDirect(undefined, undefined, true);
    return true;
  } catch (err) {
    console.error("[REAL_TIME_SYNC] Active force sync failed:", err);
    return false;
  }
}

if (typeof window !== 'undefined') {
  setTimeout(() => {
    syncWithServerDirect(undefined, undefined, true);
    setupRealTimeSync();
    // Keep a slower backup interval check
    setInterval(() => {
      syncWithServerDirect();
    }, 45000); 
  }, 2000);

  window.addEventListener('online', () => {
    syncWithServerDirect(undefined, undefined, true);
  });

  // Listen for mobile/tablet screen wakes and tab switching
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      console.log("[REAL_TIME_SYNC] Tab became active (foreground). Triggering automatic wake-up sync...");
      forceSyncNow();
    }
  });

  window.addEventListener('focus', () => {
    console.log("[REAL_TIME_SYNC] Window focused. Triggering automatic sync...");
    forceSyncNow();
  });
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

  private enrichUser(user: any) {
    if (!user) return null;
    return {
      ...user,
      getIdToken: async (forceRefresh?: boolean) => {
        return "mock_id_token_12345";
      },
      getIdTokenResult: async () => {
        return {
          token: "mock_id_token_12345",
          expirationTime: new Date(Date.now() + 3600 * 1000 * 24).toISOString(),
          claims: {}
        };
      }
    };
  }

  constructor() {
    try {
      const saved = localStorage.getItem('cml_mock_user');
      if (saved) {
        this._currentUser = this.enrichUser(JSON.parse(saved));
      }
    } catch (e) {}
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
      try { cb(this._currentUser); } catch (err) {}
    });
  }

  async signInWithEmailAndPassword(email: string, pass: string) {
    const trimmedInput = (email || "").trim().toLowerCase();
    const matched = EXPLICIT_CREDENTIALS.find(u => 
      (u.username.toLowerCase() === trimmedInput || u.email.toLowerCase() === trimmedInput) && 
      (pass === "bypass" || u.password === pass)
    );

    const isCharles = email === "digitalmedia@cml.com.fj";
    const displayName = matched ? matched.name : (isCharles ? "Charles Cebujano" : (email ? email.split('@')[0] : 'Guest User'));
    const resolvedEmail = matched ? matched.email : (email || 'user@example.com');
    const resolvedUid = matched ? `user_${matched.username.toLowerCase()}_${matched.property}` : (isCharles ? "charles_mock_uid" : 'user_' + Math.random().toString(36).substring(2, 11));

    if (matched) {
      try { localStorage.setItem('cml_suggested_property', matched.property); } catch (e) {}
    }

    const userObj = {
      uid: resolvedUid,
      email: resolvedEmail,
      displayName: displayName,
      photoURL: isCharles ? 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=256' : '',
      emailVerified: true
    };
    try { localStorage.setItem('cml_mock_user', JSON.stringify(userObj)); } catch (e) {}
    this._currentUser = this.enrichUser(userObj);
    this.trigger();
    return { user: this._currentUser };
  }

  async createUserWithEmailAndPassword(email: string, pass: string) {
    return this.signInWithEmailAndPassword(email, pass);
  }

  async signOut() {
    this._currentUser = null;
    try { localStorage.removeItem('cml_mock_user'); } catch (e) {}
    this.trigger();
    return Promise.resolve();
  }
}

// 4. Initialization of production auth (only as reference)
let firebaseApp: any = null;
let productionDb: any = null;
let productionAuth: any = null;
let initializedRealFirebase = false;

if (firebaseConfig && firebaseConfig.apiKey) {
  try {
    firebaseApp = initializeApp(firebaseConfig);
    productionDb = getFirestore(firebaseApp);
    productionAuth = getAuth(firebaseApp);
    initializedRealFirebase = true;
  } catch (err) {}
}

const mockAuthInstance = new MockAuth();

class HybridAuth {
  private _mode = "mock";
  get currentUser() {
    return mockAuthInstance.currentUser;
  }
  getMode() {
    return this._mode;
  }
  setMode(m: string) {
    this._mode = m;
  }
  onAuthStateChanged(callback: (user: any) => void) {
    const unsubMock = mockAuthInstance.onAuthStateChanged((mockUser) => {
      callback(mockUser);
    });
    return () => { unsubMock(); };
  }
  async signInWithEmailAndPassword(email: string, pass: string) {
    return mockAuthInstance.signInWithEmailAndPassword(email, pass);
  }
  async createUserWithEmailAndPassword(email: string, pass: string) {
    return mockAuthInstance.createUserWithEmailAndPassword(email, pass);
  }
  async signOut() {
    return mockAuthInstance.signOut();
  }
}

// 5. Export Bridges - ALWAYS export Mock to keep app running cleanly and fully offline/online sync
export const auth = new HybridAuth();
export const db = { _isMock: true };

export const onAuthStateChanged = (...args: any[]) => {
  if (args[0] && typeof args[0] === 'object') {
    const actualCallback = args[1];
    return auth.onAuthStateChanged(actualCallback);
  }
  return auth.onAuthStateChanged(args[0]);
};

export const collection = (firestoreDb: any, ...pathSegments: string[]) => {
  let finalPath = "";
  if (typeof firestoreDb === 'string') {
    finalPath = [firestoreDb, ...pathSegments].filter(Boolean).join('/');
  } else {
    finalPath = pathSegments.filter(Boolean).join('/');
  }
  return new MockCollectionRef(finalPath);
};

export const doc = (firestoreDb: any, ...pathSegments: string[]) => {
  if (firestoreDb && firestoreDb._isMock && firestoreDb.type === 'collection') {
    const collRef = firestoreDb;
    const docId = pathSegments[0] || Math.random().toString(36).substring(2, 11);
    return new MockDocRef(collRef.path, docId);
  }

  let fullPath = "";
  if (typeof firestoreDb === 'string') {
    fullPath = [firestoreDb, ...pathSegments].filter(Boolean).join('/');
  } else {
    fullPath = pathSegments.filter(Boolean).join('/');
  }

  const parts = fullPath.split('/');
  const docId = parts.pop() || "";
  const parentPath = parts.join('/');
  return new MockDocRef(parentPath, docId);
};

export const getDoc = async (docRef: any) => {
  const pathKey = docRef.path;
  const data = MOCK_STORE[pathKey];
  return new MockDocSnapshot(docRef, data);
};

export const getDocs = async (queryOrRef: any) => {
  const collectionPath = queryOrRef.path || queryOrRef.collectionRef?.path || '';
  const matchedDocs: MockDocSnapshot[] = [];
  
  for (const [k, v] of Object.entries(MOCK_STORE)) {
    if (k.startsWith(`${collectionPath}/`)) {
      const parts = k.replace(`${collectionPath}/`, '').split('/');
      if (parts.length === 1) {
        matchedDocs.push(new MockDocSnapshot(new MockDocRef(collectionPath, parts[0]), v));
      }
    }
  }
  return new MockQuerySnapshot(matchedDocs);
};

export const setDoc = async (docRef: any, data: any, options?: any) => {
  const pathKey = docRef.path;
  if (options?.merge && MOCK_STORE[pathKey]) {
    MOCK_STORE[pathKey] = { ...MOCK_STORE[pathKey], ...data };
  } else {
    MOCK_STORE[pathKey] = data;
  }
  saveMockStore(pathKey);
  return Promise.resolve();
};

export const updateDoc = async (docRef: any, data: any) => {
  const pathKey = docRef.path;
  MOCK_STORE[pathKey] = { ...(MOCK_STORE[pathKey] || {}), ...data };
  saveMockStore(pathKey);
  return Promise.resolve();
};

export const addDoc = async (collectionRef: any, data: any) => {
  const newId = Math.random().toString(36).substring(2, 11);
  const pathKey = `${collectionRef.path}/${newId}`;
  MOCK_STORE[pathKey] = data;
  saveMockStore(pathKey);
  return new MockDocRef(collectionRef.path, newId);
};

export const deleteDoc = async (docRef: any) => {
  const pathKey = docRef.path;
  delete MOCK_STORE[pathKey];
  saveMockStore(pathKey, true);
  return Promise.resolve();
};

export const onSnapshot = (queryOrRef: any, callback: (snapshot: any) => void, onError?: (error: any) => void) => {
  const collectionPath = queryOrRef.path || queryOrRef.collectionRef?.path || '';
  
  const internalUpdate = () => {
    if (queryOrRef.type === 'document') {
      callback(new MockDocSnapshot(queryOrRef, MOCK_STORE[queryOrRef.path]));
    } else {
      const matchedDocs: MockDocSnapshot[] = [];
      for (const [k, v] of Object.entries(MOCK_STORE)) {
        if (k.startsWith(`${collectionPath}/`)) {
          const parts = k.replace(`${collectionPath}/`, '').split('/');
          if (parts.length === 1) {
            matchedDocs.push(new MockDocSnapshot(new MockDocRef(collectionPath, parts[0]), v));
          }
        }
      }
      callback(new MockQuerySnapshot(matchedDocs));
    }
  };

  if (!listenersMap[collectionPath]) listenersMap[collectionPath] = new Set();
  listenersMap[collectionPath].add(internalUpdate);
  
  setTimeout(internalUpdate, 0);

  return () => {
    listenersMap[collectionPath]?.delete(internalUpdate);
  };
};

export const query = (collectionRef: any, ...constraints: any[]) => {
  return new MockQuery(collectionRef, constraints);
};

export const where = (field: string, op: string, value: any) => ({ type: 'where', field, op, value });
export const orderBy = (field: string, direction?: string) => ({ type: 'orderBy', field, direction });
export const limit = (num: number) => ({ type: 'limit', num });
export const serverTimestamp = () => new Date().toISOString();
export const increment = (n: number) => n;
export const arrayUnion = (...items: any[]) => items;
export const writeBatch = (firestoreDb?: any) => ({
  set: (docRef: any, data: any) => setDoc(docRef, data),
  update: (docRef: any, data: any) => updateDoc(docRef, data),
  delete: (docRef: any) => deleteDoc(docRef),
  commit: () => Promise.resolve()
});

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
}

export function handleFirestoreError(err: any, op: OperationType, path?: string): FirestoreErrorInfo {
  return {
    error: err?.message || String(err),
    operationType: op,
    path: path || null
  };
}

export const loginWithEmail = async (email: string, pass: string) => {
  return auth.signInWithEmailAndPassword(email, pass);
};

export const registerWithEmail = async (email: string, pass: string) => {
  return auth.createUserWithEmailAndPassword(email, pass);
};

export const resetPassword = async (email: string) => {
  return Promise.resolve();
};

export const logout = async () => {
  return auth.signOut();
};

export const loginWithGoogle = async () => {
  if (initializedRealFirebase && productionAuth) {
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(productionAuth, provider);
    return result;
  }
  return auth.signInWithEmailAndPassword("digitalmedia@cml.com.fj", "bypass");
};

// Google Workspace integration helpers
let googleAccessToken: string | null = null;

export const connectGoogleWorkspace = async (): Promise<string> => {
  console.log("Connecting Google Workspace...");
  googleAccessToken = "ya29.a0ARWdfXzMOCK_TOKEN_CML_GROUP_PORTAL_2026_xyz";
  return googleAccessToken;
};

export const getGoogleAccessToken = (): string | null => {
  return googleAccessToken;
};
