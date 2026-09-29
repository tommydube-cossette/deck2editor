"use client";
import Link from "next/link";
import { LayoutDashboard, ChartLine, Layers, Receipt, FileText, FileSpreadsheet, Users, Settings, FolderOpen, CircleHelp, Bell, ChevronDown, Wand2, LogOut } from "lucide-react";
import { useAuth } from "@/lib/auth";
import Button from "@/components/ui/Button";

/* Coquille identique a MediaBox (barre laterale 210 px, barre superieure 48 px).
   Les entrees de menu sont celles de MediaBox ; seule « Deck2Editor » est active ici,
   les autres pointent vers MediaBox en production. */
const MB = "https://mediabox.pluscompany.com";
const NAV = [
  { href: `${MB}/campaigns`, label: "Campagnes", Icon: LayoutDashboard },
  { href: `${MB}/strategy`, label: "Stratégie", Icon: ChartLine },
  { href: `${MB}/tactiques`, label: "Tactiques", Icon: Layers },
  { href: `${MB}/mcpe`, label: "MCPE", Icon: Receipt },
  { href: `${MB}/documents`, label: "Documents", Icon: FileText },
  { href: `${MB}/mpa`, label: "MPA", Icon: FileSpreadsheet },
  { href: `${MB}/partenaires`, label: "Partenaires", Icon: Users },
];

export default function AppShell({ children, title }: { children: React.ReactNode; title?: string }) {
  const { user, deconnecter } = useAuth();
  return (
    <div className="flex h-screen bg-gray-50">
      <aside className="flex h-full w-[210px] flex-col border-r border-gray-200 bg-white pb-10">
        <div className="plus-pattern h-1 shrink-0" />
        <div className="border-b border-gray-200 p-4">
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded bg-primary-50 font-bold text-primary">MB</div>
            <span className="truncate font-medium text-gray-900">MediaBox</span>
          </div>
        </div>
        <nav className="flex-1 overflow-y-auto pt-2">
          <ul className="space-y-1">
            {NAV.map(({ href, label, Icon }) => (
              <li key={label} className="px-2">
                <a href={href} className="flex items-center rounded-control px-2 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-50">
                  <Icon className="mr-3 h-5 w-5 text-gray-400" /><span className="flex-1">{label}</span>
                </a>
              </li>
            ))}
            <li className="px-2"><span className="flex items-center rounded-control px-2 py-2 text-sm text-gray-700"><Settings className="mr-3 h-5 w-5 text-gray-400" /><span className="flex-1">Configuration</span></span></li>
            <li className="px-2">
              <span className="flex items-center rounded-control px-2 py-2 text-sm text-gray-700"><FolderOpen className="mr-3 h-5 w-5 text-gray-400" /><span className="flex-1">Modules spécialisés</span></span>
              <ul className="ml-4 border-l border-gray-200 pl-2">
                <li>
                  <Link href="/deck2editor" className="flex items-center rounded-control bg-primary-50 px-2 py-2 text-sm font-medium text-primary-700">
                    <Wand2 className="mr-3 h-5 w-5 text-primary" /><span className="flex-1">Deck2Editor</span>
                    <span className="ml-auto rounded bg-primary-100 px-1.5 py-0.5 text-[9px] font-bold text-primary-700">NEW</span>
                  </Link>
                </li>
              </ul>
            </li>
            <li className="px-2"><a href={`${MB}/aide`} className="flex items-center rounded-control px-2 py-2 text-sm text-gray-700 hover:bg-gray-50"><CircleHelp className="mr-3 h-5 w-5 text-gray-400" /><span className="flex-1">Aide</span></a></li>
          </ul>
        </nav>
        <div className="border-t border-gray-200 p-4 text-center text-xs text-gray-500">Deck2Editor v8.0</div>
      </aside>

      <main className="flex-1 overflow-auto">
        <div className="relative flex h-12 items-center justify-end gap-3 border-b border-gray-200 bg-white px-6">
          {title && <span className="mr-auto text-sm font-medium text-gray-700">{title}</span>}
          <button className="relative rounded-control p-2 transition-colors hover:bg-gray-100" title="Notifications"><Bell className="h-5 w-5 text-gray-600" /></button>
          {user ? (
            <div className="flex items-center gap-2 rounded-control px-1.5 py-1">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {user.photoURL && <img src={user.photoURL} alt="" className="h-8 w-8 rounded-full object-cover" />}
              <span className="hidden max-w-[160px] truncate text-sm font-medium text-gray-900 sm:block">{user.displayName || user.email}</span>
              <ChevronDown className="h-4 w-4 text-gray-400" />
              <Button variant="ghost" size="sm" onClick={deconnecter} title="Se déconnecter"><LogOut /></Button>
            </div>
          ) : null}
          <div className="mx-1 h-5 w-px bg-gray-200" />
          <div role="group" aria-label="Langue / Language" className="inline-flex items-center gap-0.5 rounded-control bg-gray-100 p-0.5 text-xs font-semibold">
            <button type="button" className="rounded-[6px] bg-primary px-2.5 py-1 text-white shadow-sm">FR</button>
            <button type="button" className="rounded-[6px] px-2.5 py-1 text-gray-500 hover:text-gray-800">EN</button>
          </div>
        </div>
        <div className="px-4 py-6 sm:px-6 lg:px-8 xl:px-12 2xl:px-16">{children}</div>
      </main>
    </div>
  );
}
