"use client";
import { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, signInWithPopup, signOut, type User } from "firebase/auth";
import { fbAuth, fbGoogle, firebaseConfigure } from "./firebase";

interface AuthState {
  user: User | null; loading: boolean; configure: boolean;
  connecter: () => Promise<void>; deconnecter: () => Promise<void>;
}
const Ctx = createContext<AuthState>({ user: null, loading: true, configure: false, connecter: async () => {}, deconnecter: async () => {} });

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    if (!firebaseConfigure) { setLoading(false); return; }
    return onAuthStateChanged(fbAuth(), (u) => {
      const domaine = process.env.NEXT_PUBLIC_ALLOWED_EMAIL_DOMAIN;
      if (u && domaine && !(u.email || "").toLowerCase().endsWith("@" + domaine.toLowerCase())) { signOut(fbAuth()); setUser(null); }
      else setUser(u);
      setLoading(false);
    });
  }, []);
  const connecter = async () => { await signInWithPopup(fbAuth(), fbGoogle()); };
  const deconnecter = async () => { await signOut(fbAuth()); };
  return <Ctx.Provider value={{ user, loading, configure: firebaseConfigure, connecter, deconnecter }}>{children}</Ctx.Provider>;
}
export const useAuth = () => useContext(Ctx);
