"use client";
import { useState } from "react";
import { usePlan } from "./PlanContext";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Textarea, Check, Chips } from "@/components/ui/Field";
import Button from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { normaliserPlan } from "@/lib/deck2editor/plan";
import type { Plan } from "@/lib/deck2editor/types";

/* Brouillon de plan par Gemini (recherche web + JSON), a valider ensuite par le moteur.
   L'IA propose, l'outil valide, l'humain corrige. */
export default function IA() {
  const { setPlan, setOnglet, setPlanId } = usePlan();
  const toast = useToast();
  const [brief, setBrief] = useState(""); const [langue, setLangue] = useState("fr"); const [web, setWeb] = useState(true);
  const [busy, setBusy] = useState(false); const [notes, setNotes] = useState(""); const [sources, setSources] = useState<{ titre: string; url: string }[]>([]); const [erreur, setErreur] = useState("");

  const lancer = async () => {
    if (!brief.trim()) return toast("Décrivez le mandat.");
    setBusy(true); setErreur(""); setNotes(""); setSources([]);
    try {
      const r = await fetch("/api/deck2editor/ai", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ brief, langue, rechercheWeb: web }) });
      const j = await r.json();
      if (!r.ok) { setErreur(j.erreur || "Erreur inconnue."); setBusy(false); return; }
      const p: Plan = normaliserPlan(j.plan);
      setPlan(p); setPlanId(null); setNotes(j.notes || ""); setSources(j.sources || []);
      toast(`Brouillon généré par ${j.modele}. Validez-le avant tout import.`); setOnglet("campagnes");
    } catch (e) { setErreur((e as Error).message); }
    setBusy(false);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader title="Générer un brouillon avec Gemini" subtitle="Décrivez le mandat : annonceur, produit ou offre, objectif, territoire, période, budget, pages de destination, ton. L’IA cherche sur le web, propose un plan complet, et le moteur le valide comme n’importe quel plan saisi à la main." />
        <CardBody>
          <Textarea className="min-h-[160px]" placeholder="Ex. : Sépaq, campagne camping automne 2026, Québec, du 15 septembre au 31 octobre, 8 000 $ / mois, page https://www.sepaq.com/camping, objectif réservations, mots-clés en français…" value={brief} onChange={(e) => setBrief(e.target.value)} />
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <Chips label="Langue des textes" options={["fr", "en"]} value={langue} onChange={setLangue} />
            <div className="flex items-end"><Check label="Recherche web (grounding Google Search)" sub="Facturée à la requête par Google. Désactiver pour un brouillon sans recherche." checked={web} onChange={setWeb} /></div>
          </div>
          <Button variant="primary" pop className="mt-4" disabled={busy} onClick={lancer}>{busy ? "Génération en cours…" : "Générer le brouillon"}</Button>
          {erreur && <div className="mt-4 rounded-surface border border-red-200 bg-red-50 p-3 text-sm text-red-700">{erreur}</div>}
          {notes && (
            <details className="mt-4 rounded-surface border border-gray-200 bg-gray-50 p-3 text-sm">
              <summary className="cursor-pointer font-medium text-gray-900">Notes de recherche</summary>
              <pre className="mt-2 whitespace-pre-wrap font-sans text-gray-700">{notes}</pre>
              {sources.length > 0 && <ul className="mt-3 list-disc space-y-1 pl-5">{sources.map((s, i) => <li key={i}><a className="text-primary-700 underline" href={s.url} target="_blank" rel="noreferrer">{s.titre || s.url}</a></li>)}</ul>}
            </details>
          )}
          <p className="mt-4 text-xs text-gray-500">Le plan généré remplace le plan courant. Sauvegardez d’abord le plan en cours si nécessaire.</p>
        </CardBody>
      </Card>
    </div>
  );
}
