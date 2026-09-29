"use client";
import AppShell from "@/components/shell/AppShell";
import Gate from "@/components/shell/Gate";
import { ToastProvider } from "@/components/ui/Toast";
import { PlanProvider, usePlan, type Onglet } from "@/components/deck2editor/PlanContext";
import Reglages from "@/components/deck2editor/Reglages";
import Campagnes from "@/components/deck2editor/Campagnes";
import Groupes from "@/components/deck2editor/Groupes";
import MotsCles from "@/components/deck2editor/MotsCles";
import Extensions from "@/components/deck2editor/Extensions";
import PMax from "@/components/deck2editor/PMax";
import ImportDeck from "@/components/deck2editor/ImportDeck";
import IA from "@/components/deck2editor/IA";
import ValidationRail from "@/components/deck2editor/ValidationRail";
import { Settings, LayoutDashboard, FileText, Tag, Link2, Boxes, ClipboardPaste, Sparkles } from "lucide-react";

const ONGLETS: { id: Onglet; label: string; sous: string; Icon: typeof Settings }[] = [
  { id: "reglages", label: "Réglages", sous: "Contexte du plan, options d’export, plans sauvegardés.", Icon: Settings },
  { id: "campagnes", label: "Campagnes", sous: "Budget, enchères, diffusion, ciblage, AI Max.", Icon: LayoutDashboard },
  { id: "groupes", label: "Groupes et annonces", sous: "Une annonce responsive par groupe. 3 à 15 titres, 2 à 4 descriptions.", Icon: FileText },
  { id: "motscles", label: "Mots-clés", sous: "Positifs et négatifs, au niveau groupe ou campagne.", Icon: Tag },
  { id: "extensions", label: "Extensions", sous: "Liens annexes, accroches, extraits de site.", Icon: Link2 },
  { id: "pmax", label: "Performance Max", sous: "Titres, titres longs, descriptions, nom de l’entreprise.", Icon: Boxes },
  { id: "import", label: "Import deck", sous: "Collez un onglet Excel, l’outil en extrait le contenu.", Icon: ClipboardPaste },
  { id: "ia", label: "IA", sous: "Brouillon complet généré par Gemini, à valider.", Icon: Sparkles },
];

function Contenu() {
  const { onglet, setOnglet, plan, resultat } = usePlan();
  const compte: Record<Onglet, number | ""> = {
    reglages: "", campagnes: plan.campagnes.length, groupes: plan.groupes.length, motscles: plan.motsCles.length + plan.negatifs.length,
    extensions: plan.sitelinks.length + plan.callouts.length + plan.snippets.length, pmax: plan.assetGroups.length, import: "", ia: "",
  };
  const erreurs: Partial<Record<Onglet, number>> = {};
  resultat?.rapport.erreurs.forEach((e) => {
    const map: Record<string, Onglet> = { Campagnes: "campagnes", Localisations: "campagnes", "Groupes d'annonces": "groupes", "Annonces RSA": "groupes", "Mots-cles": "motscles", "Mots-cles negatifs": "motscles", Sitelinks: "extensions", Accroches: "extensions", "Extraits de site": "extensions", "Groupes d'assets": "pmax" };
    const o = map[e.bloc]; if (o) erreurs[o] = (erreurs[o] || 0) + 1;
  });
  const cur = ONGLETS.find((o) => o.id === onglet)!;
  return (
    <div className="flex gap-0 -mx-4 -my-6 sm:-mx-6 lg:-mx-8 xl:-mx-12 2xl:-mx-16">
      <div className="min-w-0 flex-1">
        <div className="border-b border-gray-200 bg-white px-6">
          <div className="flex flex-wrap gap-6">
            {ONGLETS.map(({ id, label, Icon }) => (
              <button key={id} type="button" onClick={() => setOnglet(id)} className={`relative -mb-px flex items-center gap-2 border-b-2 py-3 text-sm font-medium transition-colors ${onglet === id ? "border-primary text-gray-900" : "border-transparent text-gray-500 hover:text-gray-800"}`}>
                <Icon className="h-4 w-4" />{label}
                {erreurs[id] ? <span className="rounded-full bg-red-500 px-1.5 text-[10px] font-bold text-white">{erreurs[id]}</span> : compte[id] ? <span className="rounded-full bg-gray-100 px-1.5 text-[10px] font-bold text-gray-600">{compte[id]}</span> : null}
              </button>
            ))}
          </div>
        </div>
        <div className="px-6 py-6">
          <div className="mb-5"><h1 className="text-xl font-semibold tracking-tight text-gray-900">{cur.label}</h1><p className="mt-0.5 text-sm text-gray-500">{cur.sous}</p></div>
          {onglet === "reglages" && <Reglages />}
          {onglet === "campagnes" && <Campagnes />}
          {onglet === "groupes" && <Groupes />}
          {onglet === "motscles" && <MotsCles />}
          {onglet === "extensions" && <Extensions />}
          {onglet === "pmax" && <PMax />}
          {onglet === "import" && <ImportDeck />}
          {onglet === "ia" && <IA />}
        </div>
      </div>
      <ValidationRail />
    </div>
  );
}

export default function Page() {
  return (
    <ToastProvider>
      <Gate>
        <PlanProvider>
          <AppShell title="Deck2Editor · Deck vers Google Ads Editor">
            <Contenu />
          </AppShell>
        </PlanProvider>
      </Gate>
    </ToastProvider>
  );
}
