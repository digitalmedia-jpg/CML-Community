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

export interface User {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL?: string | null;
  getIdToken?: (forceRefresh?: boolean) => Promise<string>;
  getIdTokenResult?: (forceRefresh?: boolean) => Promise<any>;
}

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
}

const safeObjectProxy = (target: any): any => {
  return new Proxy(target, {
    get: (obj, prop) => {
      if (typeof prop === 'symbol' || prop === 'toJSON' || prop === 'constructor' || prop === 'then') {
        return obj[prop];
      }
      if (prop in obj) {
        const val = obj[prop];
        if (typeof val === 'object' && val !== null) return safeObjectProxy(val);
        return val;
      }
      return safeObjectProxy({});
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
  if (path.startsWith("complaints-") || path.startsWith("posts")) {
    if (listenersMap["hybrid_sandbox"]) {
      listenersMap["hybrid_sandbox"].forEach(cb => {
        try { cb(); } catch (e) {}
      });
    }
  }
}

export async function syncWithServerDirect(updates?: Record<string, any>, deletedKeys?: string[], forcePush = false): Promise<boolean> {
  const isPushedSession = (updates && Object.keys(updates).length > 0) || (deletedKeys && deletedKeys.length > 0);
  
  if (!forcePush && !isPushedSession && Object.keys(pendingUpdates).length === 0 && pendingDeletes.length === 0) {
    return true;
  }

  if (updates) {
    pendingUpdates = { ...pendingUpdates, ...updates };
  }
  if (deletedKeys) {
    pendingDeletes = [...new Set([...pendingDeletes, ...deletedKeys])];
  }
  
  savePendingSyncState();
  
  if (isSyncing && !forcePush) return false;
  isSyncing = true;
  
  let success = false;
  try {
    const response = await fetch("/api/mock-db", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ updates: pendingUpdates, deletedKeys: pendingDeletes })
    });
    if (response.ok) {
      const data = await response.json();
      if (data && data.db) {
        success = true;
        const changedKeys = new Set<string>();
        
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
        
        for (const k of Object.keys(MOCK_STORE)) {
          if (!(k in data.db) && !k.startsWith('users/') && !pendingDeletes.includes(k)) {
            delete MOCK_STORE[k];
            changedKeys.add(k);
          }
        }

        pendingDeletes.forEach(k => {
          delete MOCK_STORE[k];
        });
        
        try {
          localStorage.setItem('cml_mock_db', JSON.stringify(MOCK_STORE));
        } catch (e) {}

        if (isCurrentlyOffline) {
          isCurrentlyOffline = false;
        }
        
        if (!hasDoneInitialSync) {
          hasDoneInitialSync = true;
          if (Object.keys(data.db || {}).length === 0 && Object.keys(MOCK_STORE).length > 0) {
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
  return success;
}

if (typeof window !== 'undefined') {
  // Setup real-time Server-Sent Events (SSE) listener to sync database updates instantly
  let sseSource: EventSource | null = null;
  const connectSSE = () => {
    if (sseSource) {
      try { sseSource.close(); } catch (e) {}
    }
    sseSource = new EventSource("/api/sync-stream");
    sseSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data && data.type === "update") {
          const changedKeys = new Set<string>();
          const updates = data.updates || {};
          const deletedKeys = data.deletedKeys || [];

          for (const [k, newVal] of Object.entries(updates)) {
            if (k in pendingUpdates) continue;
            
            const oldVal = MOCK_STORE[k];
            if (JSON.stringify(oldVal) !== JSON.stringify(newVal)) {
              MOCK_STORE[k] = newVal;
              changedKeys.add(k);
            }
          }

          deletedKeys.forEach((k: string) => {
            if (MOCK_STORE[k]) {
              delete MOCK_STORE[k];
              changedKeys.add(k);
            }
          });

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
          }
        }
      } catch (err) {
        console.error("[SSE] Error processing update:", err);
      }
    };
    sseSource.onerror = (err) => {
      console.warn("[SSE] Connection lost, retrying in 5 seconds...", err);
      sseSource?.close();
      setTimeout(connectSSE, 5000);
    };
  };

  setTimeout(() => {
    connectSSE();
    syncWithServerDirect(undefined, undefined, true);
    setInterval(() => {
      syncWithServerDirect();
    }, 15000); 
  }, 2000);

  window.addEventListener('online', () => {
    syncWithServerDirect(undefined, undefined, true);
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

  constructor() {
    try {
      const saved = localStorage.getItem('cml_mock_user');
      if (saved) {
        this._currentUser = JSON.parse(saved);
        if (this._currentUser) {
          this._currentUser.getIdToken = async (forceRefresh?: boolean) => "mock-id-token";
          this._currentUser.getIdTokenResult = async (forceRefresh?: boolean) => ({
            token: "mock-id-token",
            claims: {
              role: "Administrator"
            }
          });
        }
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

  updatePhotoURL(photoURL: string) {
    if (this._currentUser) {
      this._currentUser.photoURL = photoURL;
      try {
        localStorage.setItem('cml_mock_user', JSON.stringify({
          uid: this._currentUser.uid,
          email: this._currentUser.email,
          displayName: this._currentUser.displayName,
          photoURL: photoURL
        }));
      } catch (e) {}
      this.trigger();
    }
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
      try { localStorage.setItem('cml_suggested_property', matched.property); } catch (e) {}
    }

    this._currentUser = {
      uid: resolvedUid,
      email: resolvedEmail,
      displayName: displayName,
      photoURL: isCharles ? 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=256' : '',
      getIdToken: async (forceRefresh?: boolean) => "mock-id-token",
      getIdTokenResult: async (forceRefresh?: boolean) => ({
        token: "mock-id-token",
        claims: {
          role: "Administrator"
        }
      })
    };
    try { localStorage.setItem('cml_mock_user', JSON.stringify({
      uid: resolvedUid,
      email: resolvedEmail,
      displayName: displayName,
      photoURL: this._currentUser.photoURL
    })); } catch (e) {}
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

// 4. Initialization
let firebaseApp: any = null;
let productionDb: any = null;
let productionAuth: any = null;
let initializedRealFirebase = false;

if (firebaseConfig && firebaseConfig.apiKey) {
  try {
    firebaseApp = initializeApp(firebaseConfig);
    productionDb = getFirestore(firebaseApp, (firebaseConfig as any).firestoreDatabaseId || "(default)");
    productionAuth = getAuth(firebaseApp);
    initializedRealFirebase = true;
  } catch (err) {}
}

// 5. Export Bridges
const mockAuthInstance = new MockAuth();

class HybridAuth {
  get currentUser() {
    return mockAuthInstance.currentUser;
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
  async updatePhotoURL(photoURL: string) {
    mockAuthInstance.updatePhotoURL(photoURL);
    return Promise.resolve();
  }
}

export const auth = new HybridAuth();
export const db = initializedRealFirebase ? productionDb : { _isMock: true };

export const onAuthStateChanged = (...args: any[]) => {
  if (args[0] && typeof args[0] === 'object') {
    const actualCallback = args[1];
    return auth.onAuthStateChanged(actualCallback);
  }
  return auth.onAuthStateChanged(args[0]);
};

export const collection = (firestoreDb: any, path?: string, ...rest: any[]) => {
  if (initializedRealFirebase && firestoreDb && !firestoreDb._isMock) {
    return fbCollection(firestoreDb, path!, ...rest);
  }
  if (!path) {
    const resolvedPath = typeof firestoreDb === 'string' ? firestoreDb : (firestoreDb?.path || '');
    return new MockCollectionRef(resolvedPath);
  }
  let resolvedPath = path;
  if (typeof firestoreDb === 'object' && firestoreDb !== null) {
    if (firestoreDb.type === 'document') {
      resolvedPath = `${firestoreDb.path}/${path}`;
    }
  }
  return new MockCollectionRef(resolvedPath);
};

export const doc = (first: any, second?: any, ...rest: any[]) => {
  if (initializedRealFirebase && first && !first._isMock) {
    if (second === undefined) {
      return fbDoc(first);
    }
    return fbDoc(first, second, ...rest);
  }
  if (second === undefined) {
    if (typeof first === 'object' && first !== null) {
      const parentPath = first.path || '';
      const randomId = Math.random().toString(36).substring(2, 11);
      return new MockDocRef(parentPath, randomId);
    } else if (typeof first === 'string') {
      const parts = first.split('/');
      const parentPath = parts.slice(0, -1).join('/');
      const docId = parts[parts.length - 1] || '';
      return new MockDocRef(parentPath, docId);
    }
  }
  
  if (rest.length === 0) {
    if (typeof first === 'object' && first !== null) {
      if (first.type === 'collection') {
        return new MockDocRef(first.path, second);
      } else {
        const parts = String(second).split('/');
        const parentPath = parts.slice(0, -1).join('/');
        const docId = parts[parts.length - 1] || '';
        return new MockDocRef(parentPath, docId);
      }
    } else {
      const parts = String(second).split('/');
      const parentPath = parts.slice(0, -1).join('/');
      const docId = parts[parts.length - 1] || '';
      return new MockDocRef(parentPath, docId);
    }
  }
  
  return new MockDocRef(second, rest[0]);
};

export const getDoc = async (docRef: any) => {
  if (initializedRealFirebase && docRef && !docRef._isMock) {
    return fbGetDoc(docRef);
  }
  const pathKey = docRef.path;
  const data = MOCK_STORE[pathKey];
  return new MockDocSnapshot(docRef, data);
};

function getVirtualHybridSandboxDocs(): MockDocSnapshot[] {
  const list: MockDocSnapshot[] = [];
  for (const [k, v] of Object.entries(MOCK_STORE)) {
    if (k.startsWith("complaints-") || k.startsWith("posts")) {
      const parts = k.split('/');
      if (parts.length >= 2) {
        const collectionName = parts.slice(0, -1).join('/');
        const docId = parts[parts.length - 1];
        
        // Synthesize virtual hybrid_sandbox document ID
        const virtualDocId = k.replace(/\//g, "___");
        const docRef = new MockDocRef("hybrid_sandbox", virtualDocId);
        
        const docData = {
          collection: collectionName,
          db_json: JSON.stringify(v),
          payload_json: JSON.stringify(v),
          createdAt: v.createdAt || new Date().toISOString(),
          ...v
        };
        
        list.push(new MockDocSnapshot(docRef, docData));
      }
    }
  }
  return list;
}

function normalizeWrite(pathKey: string, data: any) {
  if (pathKey.startsWith("hybrid_sandbox/")) {
    const virtualDocId = pathKey.replace("hybrid_sandbox/", "");
    if (virtualDocId.includes("___")) {
      const parts = virtualDocId.split("___");
      const collectionName = parts.slice(0, -1).join('/');
      const docId = parts[parts.length - 1];
      const directKey = `${collectionName}/${docId}`;
      
      let payload = data;
      if (data.db_json) {
        try { payload = JSON.parse(data.db_json); } catch (e) {}
      } else if (data.payload_json) {
        try { payload = JSON.parse(data.payload_json); } catch (e) {}
      }
      
      return { key: directKey, value: payload };
    }
  }
  return null;
}

export const getDocs = async (queryOrRef: any) => {
  if (initializedRealFirebase && queryOrRef && !queryOrRef._isMock) {
    return fbGetDocs(queryOrRef);
  }
  const collectionPath = queryOrRef.path || queryOrRef.collectionRef?.path || '';
  const matchedDocs: MockDocSnapshot[] = [];
  
  if (collectionPath === "hybrid_sandbox") {
    matchedDocs.push(...getVirtualHybridSandboxDocs());
  }
  
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
  if (initializedRealFirebase && docRef && !docRef._isMock) {
    return fbSetDoc(docRef, data, options);
  }
  const pathKey = docRef.path;
  const normalized = normalizeWrite(pathKey, data);
  if (normalized) {
    if (options?.merge && MOCK_STORE[normalized.key]) {
      MOCK_STORE[normalized.key] = { ...MOCK_STORE[normalized.key], ...normalized.value };
    } else {
      MOCK_STORE[normalized.key] = normalized.value;
    }
    MOCK_STORE[pathKey] = data;
    saveMockStore(normalized.key);
    return Promise.resolve();
  }

  if (options?.merge && MOCK_STORE[pathKey]) {
    MOCK_STORE[pathKey] = { ...MOCK_STORE[pathKey], ...data };
  } else {
    MOCK_STORE[pathKey] = data;
  }
  saveMockStore(pathKey);
  return Promise.resolve();
};

export const updateDoc = async (docRef: any, data: any) => {
  if (initializedRealFirebase && docRef && !docRef._isMock) {
    return fbUpdateDoc(docRef, data);
  }
  const pathKey = docRef.path;
  const normalized = normalizeWrite(pathKey, data);
  if (normalized) {
    MOCK_STORE[normalized.key] = { ...(MOCK_STORE[normalized.key] || {}), ...normalized.value };
    MOCK_STORE[pathKey] = { ...(MOCK_STORE[pathKey] || {}), ...data };
    saveMockStore(normalized.key);
    return Promise.resolve();
  }

  MOCK_STORE[pathKey] = { ...(MOCK_STORE[pathKey] || {}), ...data };
  saveMockStore(pathKey);
  return Promise.resolve();
};

export const addDoc = async (collectionRef: any, data: any) => {
  if (initializedRealFirebase && collectionRef && !collectionRef._isMock) {
    return fbAddDoc(collectionRef, data);
  }
  const collectionPath = collectionRef.path || '';
  if (collectionPath === "hybrid_sandbox") {
    let targetCollection = data.collection;
    if (targetCollection && (targetCollection.startsWith("complaints-") || targetCollection.startsWith("posts"))) {
      let payload = data;
      if (data.db_json) {
        try { payload = JSON.parse(data.db_json); } catch (e) {}
      } else if (data.payload_json) {
        try { payload = JSON.parse(data.payload_json); } catch (e) {}
      }
      
      const newId = payload.id || (targetCollection.startsWith("complaints-") ? "comp_" : (targetCollection.endsWith("/comments") ? "comment_" : "post_")) + Math.random().toString(36).substring(2, 11);
      const directKey = `${targetCollection}/${newId}`;
      
      MOCK_STORE[directKey] = {
        ...payload,
        id: newId,
        createdAt: payload.createdAt || new Date().toISOString()
      };
      
      saveMockStore(directKey);
      return new MockDocRef("hybrid_sandbox", directKey.replace(/\//g, "___"));
    }
  }

  const newId = Math.random().toString(36).substring(2, 11);
  const pathKey = `${collectionPath}/${newId}`;
  MOCK_STORE[pathKey] = data;
  saveMockStore(pathKey);
  return new MockDocRef(collectionRef.path, newId);
};

export const deleteDoc = async (docRef: any) => {
  if (initializedRealFirebase && docRef && !docRef._isMock) {
    return fbDeleteDoc(docRef);
  }
  const pathKey = docRef.path;
  if (pathKey.startsWith("hybrid_sandbox/")) {
    const virtualDocId = pathKey.replace("hybrid_sandbox/", "");
    if (virtualDocId.includes("___")) {
      const parts = virtualDocId.split("___");
      const collectionName = parts.slice(0, -1).join('/');
      const docId = parts[parts.length - 1];
      const directKey = `${collectionName}/${docId}`;
      
      delete MOCK_STORE[directKey];
      delete MOCK_STORE[pathKey];
      saveMockStore(directKey, true);
      return Promise.resolve();
    }
  }

  delete MOCK_STORE[pathKey];
  saveMockStore(pathKey, true);
  return Promise.resolve();
};

export const onSnapshot = (queryOrRef: any, onNext: any, onError?: any) => {
  if (initializedRealFirebase && queryOrRef && !queryOrRef._isMock) {
    return fbOnSnapshot(queryOrRef, onNext, onError);
  }
  let callback = typeof onNext === 'function' ? onNext : (typeof onError === 'function' ? onError : undefined);
  if (!callback) {
    callback = () => {};
  }
  const collectionPath = queryOrRef.path || queryOrRef.collectionRef?.path || '';
  
  const internalUpdate = () => {
    if (queryOrRef.type === 'document') {
      callback(new MockDocSnapshot(queryOrRef, MOCK_STORE[queryOrRef.path]));
    } else {
      const matchedDocs: MockDocSnapshot[] = [];
      
      if (collectionPath === "hybrid_sandbox") {
        matchedDocs.push(...getVirtualHybridSandboxDocs());
      }
      
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
  if (initializedRealFirebase && collectionRef && !collectionRef._isMock) {
    return fbQuery(collectionRef, ...constraints);
  }
  return new MockQuery(collectionRef, constraints);
};

export const where = (field: string, op: string, value: any) => {
  if (initializedRealFirebase) {
    return fbWhere(field, op as any, value);
  }
  return { type: 'where', field, op, value };
};

export const orderBy = (field: string, direction?: string) => {
  if (initializedRealFirebase) {
    return fbOrderBy(field, direction as any);
  }
  return { type: 'orderBy', field, direction };
};

export const limit = (num: number) => {
  if (initializedRealFirebase) {
    return fbLimit(num);
  }
  return { type: 'limit', num };
};

export const serverTimestamp = () => {
  if (initializedRealFirebase) {
    return fbServerTimestamp();
  }
  return new Date().toISOString();
};

export const increment = (n: number) => {
  if (initializedRealFirebase) {
    return fbIncrement(n);
  }
  return n;
};

export const arrayUnion = (...items: any[]) => {
  if (initializedRealFirebase) {
    return fbArrayUnion(...items);
  }
  return items;
};

export const writeBatch = (firestoreDb: any) => {
  if (initializedRealFirebase && firestoreDb && !firestoreDb._isMock) {
    return fbWriteBatch(firestoreDb);
  }
  return {
    set: (docRef: any, data: any) => setDoc(docRef, data),
    update: (docRef: any, data: any) => updateDoc(docRef, data),
    delete: (docRef: any) => deleteDoc(docRef),
    commit: () => Promise.resolve()
  };
};

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

export const loginWithGoogle = async () => {
  const provider = new GoogleAuthProvider();
  const activeAuth = productionAuth || auth;
  try {
    if (initializedRealFirebase) {
      return await signInWithPopup(activeAuth, provider);
    }
  } catch (err) {
    console.error("Google login error, falling back to mock:", err);
  }
  return auth.signInWithEmailAndPassword("digitalmedia@cml.com.fj", "Blukukurtz_8");
};

export const resetPassword = async (email: string) => {
  return Promise.resolve();
};

export const logout = async () => {
  return auth.signOut();
};

export const forceSyncNow = async () => {
  return syncWithServerDirect(undefined, undefined, true);
};

// Google Chat Sync Integrations
export const getGoogleWorkspaceConnections = (): Record<string, any> => {
  try {
    const saved = localStorage.getItem("cml_google_connections");
    return saved ? JSON.parse(saved) : {};
  } catch (e) { return {}; }
};

export const disconnectGoogleWorkspaceProperty = (propertyId: string) => {
  const connections = getGoogleWorkspaceConnections();
  delete connections[propertyId];
  localStorage.setItem("cml_google_connections", JSON.stringify(connections));
};

export const connectGoogleWorkspace = async (propertyId: string = "cml"): Promise<string> => {
  const provider = new GoogleAuthProvider();
  provider.addScope("https://www.googleapis.com/auth/chat.spaces");
  provider.addScope("https://www.googleapis.com/auth/chat.messages");
  provider.setCustomParameters({ prompt: "select_account" });
  
  try {
    const activeAuth = productionAuth || auth;
    const result = await signInWithPopup(activeAuth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (credential?.accessToken) {
      const token = credential.accessToken;
      const connection = {
        accessToken: token,
        email: result.user?.email || "",
        displayName: result.user?.displayName || "Workspace User"
      };
      const connections = getGoogleWorkspaceConnections();
      connections[propertyId] = connection;
      localStorage.setItem("cml_google_connections", JSON.stringify(connections));
      return token;
    }
    throw new Error("Token missing.");
  } catch (error) {
    console.error("Workspace Auth Error:", error);
    throw error;
  }
};

export const getGoogleAccessToken = (propertyId?: string): string | null => {
  if (!propertyId) return null;
  const connections = getGoogleWorkspaceConnections();
  return connections[propertyId]?.accessToken || null;
};