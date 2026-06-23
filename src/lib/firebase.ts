import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

// Complete updated team roster matching your explicit spreadsheet input
export const EXPLICIT_CREDENTIALS = [
  { username: "Priyesh.Narayan", email: "graphics@cml.com.fj", password: "CML2025!!", property: "CML", name: "Priyesh Narayan" },
  { username: "Rohit.Lal", email: "rohit@cml.com.fj", password: "CML2026!!", property: "CML", name: "Rohit Lal" },
  { username: "Shahil.Sharma", email: "manageraccounts@cml.com.fj", password: "CML2026!!", property: "CML", name: "Shahil Sharma" },
  { username: "Zaiba.Khan", email: "accounts@cml.com.fj", password: "FLYAWAY2026!!", property: "CML", name: "Zaiba Khan" },
  { username: "Priyesh.Ramada", email: "graphics@cml.com.fj", password: "RAMADA2026!!", property: "Ramada", name: "Priyesh Narayan" },
  { username: "Priyesh.WG", email: "graphics@cml.com.fj", password: "WG2026!!", property: "Wyndham Garden", name: "Priyesh Narayan" },
  { username: "Shwaran.Shivani", email: "sales@cml.com.fj", password: "CML2026!!", property: "CML", name: "Shwaran Shivani" },
  { username: "John.Singh", email: "itmanager@cml.com.fj", password: "CML2026!!", property: "CML", name: "John Singh" },
  { username: "Anjeshni.Devi", email: "reservations@ramadawailoaloafiji.com", password: "FLYAWAY26!!", property: "CML", name: "Anjeshni Devi" },
  { username: "Charlene.Nand", email: "MOD@ramadawailoaloafiji.com", password: "CHARLENE26!!", property: "Ramada", name: "Charlene Nand" },
  { username: "Nolau.Malo", email: "roomsd@ramadawailoaloafiji.com", password: "RAMADA26!!", property: "Ramada", name: "Nolau Malo" },
  { username: "Neetisa.Devi", email: "hr@cml.com.fj", password: "CML2026!!", property: "CML", name: "Neetisa Devi" },
  { username: "Charles.Cebujano", email: "digitalmedia@cml.com.fj", password: "Blukukurtz_8", property: "CML", name: "Charles Cebujano" }
];

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

export const auth = {
  currentUser: null as any,
  onAuthStateChanged: (cb: any) => {
    setTimeout(() => cb(auth.currentUser), 0);
    return () => {};
  },
  signInWithEmailAndPassword: async (identifier: string, pass: string) => {
    // Clean up input variations (lowercase, remove phone trailing spaces)
    const trimmedInput = (identifier || "").trim().toLowerCase();
    const cleanPassword = (pass || "").trim();
    
    // Scan table for matches against BOTH username or email properties
    const matched = EXPLICIT_CREDENTIALS.find(u => 
      u.username.toLowerCase() === trimmedInput || 
      u.email.toLowerCase() === trimmedInput
    );

    if (!matched || matched.password !== cleanPassword) {
      throw new Error("Invalid login identifier or incorrect password entry.");
    }

    const mockUser = {
      uid: `user_${matched.username.toLowerCase()}`,
      email: matched.email,
      displayName: matched.name,
      photoURL: matched.property
    };

    auth.currentUser = mockUser;
    return { user: mockUser };
  },
  signOut: async () => {
    auth.currentUser = null;
  }
};

export const db = { _isMock: true };

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
export const resetPassword = async (email: string) => Promise.resolve();