"use client";
import { useState, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";

/* Bloc repliable « ? » identique a « A propos des campagnes » de MediaBox. */
export default function AboutBox({ title, children, defaultOpen = false }: { title: string; children: ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="overflow-hidden rounded-surface border border-primary-200 bg-primary-50">
      <button type="button" aria-expanded={open} onClick={() => setOpen(!open)} className="group flex w-full items-center gap-3 px-4 py-3 text-left">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-control bg-primary-100 text-sm font-bold leading-none text-primary-700 transition-colors group-hover:bg-primary-200">?</span>
        <span className="flex-1 text-sm font-medium text-gray-900">{title}</span>
        <ChevronDown className={`h-4 w-4 shrink-0 text-primary-700 transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </button>
      {open && <div className="border-t border-primary-200 bg-white/60 px-4 py-4 text-sm text-gray-700">{children}</div>}
    </div>
  );
}
