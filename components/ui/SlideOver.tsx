"use client";
import { Dialog, DialogPanel, DialogTitle } from "@headlessui/react";
import { X } from "lucide-react";
import type { ReactNode } from "react";

/* Panneau lateral droit, identique au formulaire « Nouvelle campagne » de MediaBox. */
export default function SlideOver({ open, onClose, title, children, width = "w-[50vw] min-w-[560px]" }: { open: boolean; onClose: () => void; title: string; children: ReactNode; width?: string }) {
  return (
    <Dialog open={open} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity" />
      <div className="fixed inset-0 overflow-hidden">
        <div className="fixed inset-y-0 right-0 flex max-w-full">
          <DialogPanel className={`pointer-events-auto ${width}`}>
            <div className="flex h-full flex-col overflow-hidden border-l border-gray-200 bg-white shadow-2xl">
              <div className="shrink-0">
                <div className="flex items-center justify-between bg-primary px-6 py-4">
                  <DialogTitle className="text-lg font-semibold tracking-tight text-white">{title}</DialogTitle>
                  <button type="button" onClick={onClose} className="rounded-control p-2 text-white/80 transition-colors hover:bg-white/15 hover:text-white"><span className="sr-only">Fermer</span><X className="h-5 w-5" /></button>
                </div>
                <div className="plus-pattern-on-brand h-1" />
              </div>
              <div className="min-h-0 flex-1 overflow-y-auto p-6">{children}</div>
            </div>
          </DialogPanel>
        </div>
      </div>
    </Dialog>
  );
}
