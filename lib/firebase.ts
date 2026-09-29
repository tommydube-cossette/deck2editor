import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";

/* Meme montage que MediaBox : SDK Firebase cote client, Auth Google, Firestore direct.
   Initialisation paresseuse : sans .env.local, l'outil tourne en mode local sans sauvegarde
   et le build ne touche jamais Firebase. */
const config = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

export const firebaseConfigure = !!config.apiKey && !!config.projectId;

let app: FirebaseApp | null = null;
let authInst: Auth | null = null;
let dbInst: Firestore | null = null;
let provider: GoogleAuthProvider | null = null;

function ensure() {
  if (!firebaseConfigure) throw new Error("Firebase non configuré (voir .env.example).");
  if (!app) app = getApps().length ? getApp() : initializeApp(config);
  return app;
}
export function fbAuth(): Auth { if (!authInst) authInst = getAuth(ensure()); return authInst; }
export function fbDb(): Firestore { if (!dbInst) dbInst = getFirestore(ensure()); return dbInst; }
export function fbGoogle(): GoogleAuthProvider {
  if (!provider) { provider = new GoogleAuthProvider(); provider.setCustomParameters({ prompt: "select_account" }); }
  return provider;
}
