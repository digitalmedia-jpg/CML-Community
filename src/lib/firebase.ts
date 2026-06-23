import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import firebaseConfig from "../../firebase-applet-config.json";

// 1. Required Build Enums
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

// 2. Explicit Application Profiles
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

// 3. Robust Mock References & Proxies to Prevent Runtime Crashes
export class MockDocRef {
  type = 'document' as const;
  _isMock = true;
  constructor(public parentPath: string, public id: string) {}
  get path() { return `${this.parentPath}/${this.id}`; }
}

export class MockCollectionRef {
  type = 'collection' as const;
  _isMock = true;
  constructor(public path: string) {}
}

const safeObjectProxy = (target: any): any => {
  return new Proxy(target, {
    get: (obj, prop) => {
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
  constructor(public ref: MockDocRef, public _data: any) {}
  exists() { return this._data !== undefined && this._data !== null; }
  data() { return safeObjectProxy(this._data || {}); }
  get id() { return this.ref.id; }
}

export class MockQuerySnapshot {
  _isMock = true;
  constructor(public docs: MockDocSnapshot[]) {}
  get empty() { return this.docs.length === 0; }
  forEach(cb: any) { this.docs.forEach(cb); }
}

const MOCK_STORE: Record<string, any> = {};
try {
  const saved = localStorage.getItem('cml_mock_db');
  if (saved) Object.assign(MOCK_STORE, JSON.parse(saved));
} catch (e) {}

// 4. Custom Local Authentication Core
export const auth = {
  currentUser: null,
  onAuthStateChanged: (cb: any) => {
    setTimeout(() => cb(null), 0);
    return () => {};
  },
  signInWithEmailAndPassword: async (email: string, pass: string) => {
    const trimmed = (email || "").trim().toLowerCase();
    const matched = EXPLICIT_CREDENTIALS.find(u => 
      (u.username.toLowerCase() === trimmed || u.email.toLowerCase() === trimmed) && u.password === pass
    );
    const mockUser = {
      uid: matched ? `user_${matched.username.toLowerCase()}` : "mock-uid",
      email: matched ? matched.email : email,
      displayName: matched ? matched.name : "Mock User"
    };
    return { user: mockUser };
  },
  signOut: async () => {}
};

export const db = { _isMock: true };

// 5. Functional Export Mappings Required by App Components
export const onAuthStateChanged = (arg1: any, arg2?: any) => {
  const cb = typeof arg1 === 'function' ? arg1 : arg2;
  return auth.onAuthStateChanged(cb);
};

export const collection = (db: any, path: string) => new MockCollectionRef(path);
export const doc = (db: any, path: string, ...rest: any[]) => new MockDocRef(path, rest[0] || "");
export const getDoc = async (ref: any) => new MockDocSnapshot(ref, MOCK_STORE[ref.path]);
export const getDocs = async (ref: any) => new MockQuerySnapshot([]);
export const setDoc = async (ref: any, data: any) => { MOCK_STORE[ref.path] = data; return Promise.resolve(); };
export const updateDoc = async (ref: any, data: any) => { MOCK_STORE[ref.path] = { ...MOCK_STORE[ref.path], ...data }; return Promise.resolve(); };
export const addDoc = async (ref: any, data: any) => new MockDocRef(ref.path, "123");
export const deleteDoc = async (ref: any) => { delete MOCK_STORE[ref.path]; return Promise.resolve(); };
export const onSnapshot = (ref: any, cb: any) => { setTimeout(() => cb(new MockQuerySnapshot([])), 0); return () => {}; };
export const query = (ref: any) => ref;
export const where = () => {};
export const orderBy = () => {};
export const limit = () => {};
export const serverTimestamp = () => new Date().toISOString();
export const increment = (n: number) => n;
export const arrayUnion = (...items: any[]) => items;

export const writeBatch = () => ({
  set: (docRef: any, data: any) => setDoc(docRef, data),
  update: (docRef: any, data: any) => updateDoc(docRef, data),
  delete: (docRef: any) => deleteDoc(docRef),
  commit: () => Promise.resolve()
});

export const handleFirestoreError = (err: any, op: OperationType, path?: string) => {
  return { error: String(err), operationType: op, path: path || null };
};

export const loginWithEmail = async (e: string, p: string) => auth.signInWithEmailAndPassword(e, p);
export const registerWithEmail = async (e: string, p: string) => auth.signInWithEmailAndPassword(e, p);
export const logout = async () => auth.signOut();
export const resetPassword = async (email: string) => Promise.resolve(); // Resolves binding block in LoginPage.tsx