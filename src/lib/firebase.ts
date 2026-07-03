import { initializeApp, getApps, getApp } from "firebase/app";
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut,
  GoogleAuthProvider,
  signInWithPopup,
  sendPasswordResetEmail,
  onAuthStateChanged as fbOnAuthStateChanged,
  User as FirebaseUser
} from "firebase/auth";
import { 
  initializeFirestore,
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

// Your Firebase configuration keys
const firebaseConfig = {
  apiKey: "AIzaSyC-zbYXWxtoRLMWuvRxMSvhjFALeG1iv8k" , // Put your Web API Key string here
  authDomain: "gen-lang-client-0274279306.firebaseapp.com",
  projectId: "gen-lang-client-0274279306",
  storageBucket: "gen-lang-client-0274279306.firebasestorage.app",
  messagingSenderId: "113045738113",
  appId: "1:113045738113:web:26f8fc9288f54d23727380",
  measurementId: "G-H7W90HRVZT"

};

// Clean Initialization with double-init safeguards
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Force Firestore to talk to your specific database instance cleanly
export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true
}, "ai-studio-b3113e74-1023-4099-b19c-1c2b6c9c399c");
(db as any)._isMock = false;

const realAuth = getAuth(app);

// Extend realAuth with helper methods for back-compatibility
(realAuth as any).setMode = (m: string) => {
  console.log(`[Firebase Wrapper] setMode called with: ${m}. Active mode is always live Firebase.`);
};
(realAuth as any).getMode = () => "live";
(realAuth as any).signInWithEmailAndPassword = (email: string, pass: string) => {
  return signInWithEmailAndPassword(realAuth, email, pass);
};
(realAuth as any).createUserWithEmailAndPassword = (email: string, pass: string) => {
  return createUserWithEmailAndPassword(realAuth, email, pass);
};
(realAuth as any).signOut = () => {
  return signOut(realAuth);
};

export const auth = realAuth;
export type User = FirebaseUser;

// Direct Firebase SDK Exports (No Mocks Intercepting) with parameter-shifting support
export const collection = (firestoreDb: any, ...pathSegments: string[]) => {
  if (typeof firestoreDb === "string") {
    return fbCollection(db, firestoreDb, ...pathSegments);
  }
  const [first, ...rest] = pathSegments;
  if (!first) {
    throw new Error("Invalid collection path");
  }
  return fbCollection(db, first, ...rest);
};

export const doc = (firestoreDb: any, ...pathSegments: string[]) => {
  if (typeof firestoreDb === "string") {
    return fbDoc(db, firestoreDb, ...pathSegments);
  }
  const [first, ...rest] = pathSegments;
  if (!first) {
    throw new Error("Invalid document path");
  }
  return fbDoc(db, first, ...rest);
};

export const getDoc = fbGetDoc;
export const getDocs = fbGetDocs;
export const setDoc = fbSetDoc;
export const updateDoc = fbUpdateDoc;
export const addDoc = fbAddDoc;
export const deleteDoc = fbDeleteDoc;
export const onSnapshot = fbOnSnapshot;
export const query = fbQuery;
export const where = fbWhere;
export const orderBy = fbOrderBy;
export const limit = fbLimit;
export const serverTimestamp = fbServerTimestamp;
export const increment = fbIncrement;
export const arrayUnion = fbArrayUnion;
export const writeBatch = (customDb?: any) => fbWriteBatch(customDb || db);

export const onAuthStateChanged = (...args: any[]) => {
  if (args.length === 2) {
    return fbOnAuthStateChanged(args[0], args[1]);
  } else {
    return fbOnAuthStateChanged(auth, args[0]);
  }
};

export const loginWithEmail = async (email: string, pass: string) => {
  return signInWithEmailAndPassword(auth, email, pass);
};

export const registerWithEmail = async (email: string, pass: string) => {
  return createUserWithEmailAndPassword(auth, email, pass);
};

export const loginWithGoogle = async () => {
  const provider = new GoogleAuthProvider();
  return signInWithPopup(auth, provider);
};

export const logout = async () => {
  return signOut(auth);
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
    const result = await signInWithPopup(auth, provider);
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

export const resetPassword = async (email: string) => {
  return sendPasswordResetEmail(auth, email);
};

export const forceSyncNow = async () => {
  return true;
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