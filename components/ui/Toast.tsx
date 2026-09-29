"use client";
import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from "react";

const Ctx = createContext<(m: string) => void>(() => {});
export function ToastProvider({ children }: { children: ReactNode }) {
  const [msg, setMsg] = useState<string | null>(null);
  const t = useRef<ReturnType<typeof setTimeout> | null>(null);
  const toast = useCallback((m: string) => {
    setMsg(m); if (t.current) clearTimeout(t.current);
    t.current = setTimeout(() => setMsg(null), 2800);
  }, []);
  return (
    <Ctx.Provider value={toast}>
      {children}
      <div aria-live="polite" className={`pointer-events-none fixed bottom-20 left-1/2 z-[130] max-w-[82vw] -translate-x-1/2 rounded-control bg-gray-900 px-4 py-2.5 text-center text-sm font-medium text-white shadow-lg transition-all duration-200 ${msg ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0"}`}>{msg}</div>
    </Ctx.Provider>
  );
}
export const useToast = () => useContext(Ctx);
