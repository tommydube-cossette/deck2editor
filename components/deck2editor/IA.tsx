"use client";
import { useState } from "react";
import { usePlan } from "./PlanContext";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Input, Textarea, Check, Chips } from "@/components/ui/Field";
import Button from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { normaliserPlan } from "@/lib/deck2editor/plan";
import { domaineDe } from "@/lib/deck2editor/ai";

/* Brouillon de plan par Gemini : lecture du site officiel + recherche web, puis JSON,
   puis validation par le moteur. L'IA propose, l'outil valide, l'humain corrige. */
export default function IA() {
  const { plan, setPlan, setOnglet, setPlanId } = usePlan();
  const toast = useToast();
  const [brief, setBrief] = useState(""); const [site, setSite] = useState(plan.options.siteOfficiel || "");
  const [langue, setLangue] = useState<"fr" | "en">("fr"); const [web, setWeb] = useState(true);
  const [busy, setBusy] = useState(false); const [notes, setNotes] = useState(""); const [sources, setSources] = useState<{ titre: string; url: string }[]>([]);
  const [corrections, setCorrections] = useState<string[]>([]); const [erreur, setErreur] = useState("");
  const domaine = domaineDe(site);

  const lancer = async () => {
    if (!brief.trim()) return toast("Décrivez le mandat.");
    if (!domaine) return toast("Indiquez le site officiel du client (ex. https://www.sepaq.com).");
    if (plan.campagnes.some((c) => c.nom) && !confirm("Le plan généré remplacera le plan courant. Continuer ?")) return;
    setBusy(true); setErreur(""); setNotes(""); setSources([]); setCorrections([]);
    try {
      const r = await fetch("/api/deck2editor/ai", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ brief, siteOfficiel: site, langue, rechercheWeb: web }) });
      const j = await r.json();
      if (!r.ok) { setErreur(j.erreur || "Erreur inconnue."); setBusy(false); return; }
      const p = normaliserPlan(j.plan); p.options = { ...p.options, siteOfficiel: site };
      setPlan(p); setPlanId(null); setNotes(j.notes || ""); setSources(j.sources || []); setCorrections(j.corrections || []);
      toast(`Brouillon généré par ${j.modele}. Validez-le avant tout import.`); setOnglet("campagnes");
    } catch (e) { setErreur((e as Error).message); }
    setBusy(false);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader title="Générer un brouillon avec Gemini" subtitle="L’IA lit le site officiel du client (seule source de vérité sur l’annonceur), consulte le web uniquement pour le vocabulaire de recherche, puis propose un plan complet que le moteur valide comme n’importe quel plan saisi à la main." />
        <CardBody>
          <Input label="Site officiel du client" required hint={domaine ? `domaine retenu : ${domaine}` : "toutes les URL finales devront être sur ce domaine"} placeholder="https://www.sepaq.com" value={site} onChange={(e) => setSite(e.target.value)} />
          <div className="mt-4">
            <Textarea label="Mandat" className="min-h-[160px]" placeholder="Ex. : Sépaq, campagne camping automne 2026, Québec, du 15 septembre au 31 octobre, 8 000 $ par mois, objectif réservations, pages camping et prêt-à-camper, ton chaleureux…" value={brief} onChange={(e) => setBrief(e.target.value)} />
          </div>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <Chips label="Langue des textes" options={["fr", "en"]} value={langue} onChange={(v) => setLangue(v as "fr" | "en")} />
            <div className="flex items-end"><Check label="Recherche web (grounding Google Search)" sub="Sert seulement au vocabulaire de recherche. Facturée à la requête par Google." checked={web} onChange={setWeb} /></div>
          </div>
          <Button variant="primary" pop className="mt-4" disabled={busy} onClick={lancer}>{busy ? "Génération en cours…" : "Générer le brouillon"}</Button>
          {erreur && <div className="mt-4 rounded-surface border border-red-200 bg-red-50 p-3 text-sm text-red-700">{erreur}</div>}
          {corrections.length > 0 && (
            <div className="mt-4 rounded-surface border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
              <div className="font-semibold">URL hors du site officiel remplacées par la page d’accueil ({corrections.length})</div>
              <ul className="mt-1 list-disc pl-5">{corrections.map((c, i) => <li key={i}>{c}</li>)}</ul>
            </div>
          )}
          {notes && (
            <details className="mt-4 rounded-surface border border-gray-200 bg-gray-50 p-3 text-sm">
              <summary className="cursor-pointer font-medium text-gray-900">Notes de recherche</summary>
              <pre className="mt-2 whitespace-pre-wrap font-sans text-gray-700">{notes}</pre>
              {sources.length > 0 && <ul className="mt-3 list-disc space-y-1 pl-5">{sources.map((s, i) => <li key={i}><a className="text-primary-700 underline" href={s.url} target="_blank" rel="noreferrer">{s.titre || s.url}</a></li>)}</ul>}
            </details>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
