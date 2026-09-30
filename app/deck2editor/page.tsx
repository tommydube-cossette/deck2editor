"use client";
import { useState } from "react";
import AppShell from "@/components/shell/AppShell";
import Gate from "@/components/shell/Gate";
import { ToastProvider, useToast } from "@/components/ui/Toast";
import Button from "@/components/ui/Button";
import SlideOver from "@/components/ui/SlideOver";
import { PlanProvider, usePlan, type Onglet } from "@/components/deck2editor/PlanContext";
import Accueil from "@/components/deck2editor/Accueil";
import Contexte from "@/components/deck2editor/Contexte";
import Campagnes from "@/components/deck2editor/Campagnes";
import Groupes from "@/components/deck2editor/Groupes";
import MotsCles from "@/components/deck2editor/MotsCles";
import Extensions from "@/components/deck2editor/Extensions";
import PMax from "@/components/deck2editor/PMax";
import Generation from "@/components/deck2editor/Generation";
import Importer from "@/components/deck2editor/Importer";
import IA from "@/components/deck2editor/IA";
import ValidationRail from "@/components/deck2editor/ValidationRail";
import { useAuth } from "@/lib/auth";
import { sauvegarderPlan, titreParDefaut } from "@/lib/deck2editor/firestore";
import { ArrowLeft, Save } from "lucide-react";

/* Sequence unique, numerotee : 1 Contexte > 2 Campagnes > 3 Groupes et annonces > 4 Mots-cles > 5 Extensions > 6 Performance Max > 7 Generation.
   La source (IA, fichier, a la main) se choisit a l'accueil ; les panneaux IA et Importer ne s'ouvrent que depuis l'accueil.
   En cours de route, seul « Coller un deck » existe, dans la carte de chaque groupe d'annonces. */
const ETAPES: { id: Onglet; label: string; sous: string }[] = [
  { id: "contexte", label: "Contexte", sous: "Client, demande, site officiel, options d’export." },
  { id: "campagnes", label: "Campagnes", sous: "Budget, enchères, diffusion, ciblage, AI Max." },
  { id: "groupes", label: "Groupes et annonces", sous: "Une annonce responsive par groupe : 3 à 15 titres, 2 à 4 descriptions." },
  { id: "motscles", label: "Mots-clés", sous: "Positifs et négatifs, au niveau groupe ou campagne." },
  { id: "extensions", label: "Extensions", sous: "Liens annexes, accroches, extraits de site." },
  { id: "pmax", label: "Performance Max", sous: "Groupes d’assets : titres, titres longs, descriptions." },
  { id: "generation", label: "Génération", sous: "Fichiers pour Editor, checklist, deck client." },
];
const BLOC2ONGLET: Record<string, Onglet> = { Campagnes: "campagnes", Localisations: "campagnes", "Groupes d'annonces": "groupes", "Annonces RSA": "groupes", "Mots-cles": "motscles", "Mots-cles negatifs": "motscles", Sitelinks: "extensions", Accroches: "extensions", "Extraits de site": "extensions", "Groupes d'assets": "pmax" };

function Editeur() {
  const { plan, onglet, setOnglet, resultat, setVue, panneau, setPanneau, planId, setPlanId } = usePlan();
  const { user, configure } = useAuth();
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const compte: Record<Onglet, number | ""> = { contexte: "", campagnes: plan.campagnes.length, groupes: plan.groupes.length, motscles: plan.motsCles.length + plan.negatifs.length, extensions: plan.sitelinks.length + plan.callouts.length + plan.snippets.length, pmax: plan.assetGroups.length, generation: resultat ? resultat.fichiers.length : "" };
  const erreurs: Partial<Record<Onglet, number>> = {};
  resultat?.rapport.erreurs.forEach((e) => { const o = BLOC2ONGLET[e.bloc]; if (o) erreurs[o] = (erreurs[o] || 0) + 1; });
  const idx = ETAPES.findIndex((e) => e.id === onglet); const cur = ETAPES[idx];
  const sauvegarder = async () => {
    if (!user) return toast("Connexion requise pour sauvegarder.");
    setBusy(true);
    try { const id = await sauvegarderPlan(planId, { clientId: "", clientNom: plan.options.client || "", demande: plan.options.demande || "", titre: titreParDefaut(plan), ownerUid: user.uid, ownerEmail: user.email || "", statut: resultat?.rapport.pret ? "valide" : "brouillon", plan }); setPlanId(id); toast("Plan sauvegardé."); }
    catch (e) { toast("Sauvegarde impossible : " + (e as Error).message); }
    setBusy(false);
  };

  return (
    <div className="-mx-4 -my-6 flex sm:-mx-6 lg:-mx-8 xl:-mx-12 2xl:-mx-16">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-3 border-b border-gray-200 bg-white px-6 py-3">
          <button type="button" onClick={() => setVue("accueil")} className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900"><ArrowLeft className="h-4 w-4" />Accueil</button>
          <div className="mx-1 h-5 w-px bg-gray-200" />
          <div className="min-w-0 flex-1 truncate text-sm font-medium text-gray-900">{titreParDefaut(plan)}{planId ? "" : <span className="ml-2 text-xs font-normal text-gray-500">(non sauvegardé)</span>}</div>
          <Button size="sm" variant="primary" disabled={!configure || !user || busy} onClick={sauvegarder} title={configure ? "" : "Firebase non configuré"}><Save />Sauvegarder</Button>
        </div>
        <div className="border-b border-gray-200 bg-white px-6">
          <div className="flex flex-wrap gap-5">
            {ETAPES.map((e, i) => (
              <button key={e.id} type="button" onClick={() => setOnglet(e.id)} className={`relative -mb-px flex items-center gap-2 border-b-2 py-3 text-sm font-medium transition-colors ${onglet === e.id ? "border-primary text-gray-900" : "border-transparent text-gray-500 hover:text-gray-800"}`}>
                <span className={`flex h-5 w-5 items-center justify-center rounded-full font-mono text-[11px] font-bold ${onglet === e.id ? "bg-primary text-white" : "bg-gray-100 text-gray-500"}`}>{i + 1}</span>{e.label}
                {erreurs[e.id] ? <span className="rounded-full bg-red-500 px-1.5 text-[10px] font-bold text-white">{erreurs[e.id]}</span> : compte[e.id] ? <span className="rounded-full bg-gray-100 px-1.5 text-[10px] font-bold text-gray-600">{compte[e.id]}</span> : null}
              </button>
            ))}
          </div>
        </div>
        <div className="px-6 py-6">
          <div className="mb-5 flex items-end justify-between gap-4">
            <div><h1 className="text-xl font-semibold tracking-tight text-gray-900">{idx + 1}. {cur.label}</h1><p className="mt-0.5 text-sm text-gray-500">{cur.sous}</p></div>
            <div className="flex shrink-0 gap-2">
              {idx > 0 && <Button size="sm" onClick={() => setOnglet(ETAPES[idx - 1].id)}>Précédent</Button>}
              {idx < ETAPES.length - 1 && <Button size="sm" variant="primary" onClick={() => setOnglet(ETAPES[idx + 1].id)}>Suivant</Button>}
            </div>
          </div>
          {onglet === "contexte" && <Contexte />}
          {onglet === "campagnes" && <Campagnes />}
          {onglet === "groupes" && <Groupes />}
          {onglet === "motscles" && <MotsCles />}
          {onglet === "extensions" && <Extensions />}
          {onglet === "pmax" && <PMax />}
          {onglet === "generation" && <Generation />}
        </div>
      </div>
      <ValidationRail />
      <SlideOver open={panneau === "importer"} onClose={() => setPanneau(null)} title="Importer un plan"><Importer /></SlideOver>
      <SlideOver open={panneau === "ia"} onClose={() => setPanneau(null)} title="Brouillon avec Gemini"><IA /></SlideOver>
    </div>
  );
}

function Contenu() { const { vue } = usePlan(); return vue === "accueil" ? <Accueil /> : <Editeur />; }

export default function Page() {
  return (
    <ToastProvider>
      <Gate>
        <PlanProvider>
          <AppShell title="Deck2Editor · Deck vers Google Ads Editor"><Contenu /></AppShell>
        </PlanProvider>
      </Gate>
    </ToastProvider>
  );
}
