"use client";
import { useRef, useState } from "react";
import { usePlan } from "./PlanContext";
import Button from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { telechargerExcel, importerExcel, importerExportEditor } from "@/lib/deck2editor/exports";

type Source = "excel" | "editor";

/* Panneau « Importer » : trois sources, un plan a l'arrivee. */
export default function Importer() {
  const { plan, ouvrirPlan, generer } = usePlan();
  const toast = useToast();
  const [source, setSource] = useState<Source>("excel");
  const [resume, setResume] = useState("");
  const xlsx = useRef<HTMLInputElement>(null); const csv = useRef<HTMLInputElement>(null);
  const aDesDonnees = plan.campagnes.some((c) => c.nom) || plan.groupes.length > 0;
  const lire = (f: File) => new Promise<ArrayBuffer>((ok, ko) => { const r = new FileReader(); r.onload = () => ok(r.result as ArrayBuffer); r.onerror = () => ko(new Error("Fichier illisible : " + f.name)); r.readAsArrayBuffer(f); });

  const importExcel = async (f?: File) => {
    if (!f) return;
    if (aDesDonnees && !confirm("Le plan actuel sera remplacé par le fichier Excel. Continuer ?")) return;
    try {
      const N = await importerExcel(await lire(f));
      if (!N) return toast("Aucun onglet reconnu. Utilisez le modèle Excel de l’outil.");
      ouvrirPlan(N, null, "generation"); setTimeout(() => { const r = generer(); toast(r.rapport.pret ? "Plan Excel importé et validé : prêt pour l’import." : "Plan Excel importé : des corrections sont signalées à droite."); }, 0);
    } catch (e) { toast("Fichier Excel illisible : " + (e as Error).message); }
  };
  const importEditor = async (f?: File) => {
    if (!f) return;
    if (aDesDonnees && !confirm("Le plan actuel sera remplacé par l’export Editor. Continuer ?")) return;
    try {
      const res = await importerExportEditor(await lire(f));
      if (!res) return toast("Aucune entité reconnue. Utilisez un export CSV de Google Ads Editor (Account > Export).");
      setResume(res.resumeHTML); ouvrirPlan(res.plan, null, "campagnes");
      toast(`Export Editor chargé : ${res.cpt.campagnes} campagne(s), ${res.cpt.groupes} groupe(s), ${res.cpt.motsCles} mot(s)-clé(s).`);
    } catch (e) { toast("Fichier illisible : " + (e as Error).message); }
  };

  const Onglet = ({ id, label }: { id: Source; label: string }) => (
    <button type="button" onClick={() => setSource(id)} className={`-mb-px border-b-2 py-3 text-sm font-medium transition-colors ${source === id ? "border-primary text-gray-900" : "border-transparent text-gray-500 hover:text-gray-800"}`}>{label}</button>
  );

  return (
    <div>
      <div className="mb-5 flex gap-6 border-b border-gray-200"><Onglet id="excel" label="Deck Excel" /><Onglet id="editor" label="Export Google Ads Editor" /></div>

      {source === "excel" && (
        <div className="space-y-4">
          <p className="text-sm text-gray-600">Déposez le modèle Excel rempli, ou un deck Excel généré par l’outil. Le plan est chargé, validé, et les fichiers pour Editor sont générés immédiatement.</p>
          <div className="flex flex-wrap gap-2">
            <Button variant="primary" onClick={() => xlsx.current?.click()}>Choisir un fichier Excel</Button>
            <Button onClick={() => telechargerExcel(plan, "modele").then(() => toast("Modèle Excel téléchargé."))}>Télécharger le modèle vide</Button>
            <input ref={xlsx} type="file" accept=".xlsx,.xls" className="hidden" onChange={(e) => { importExcel(e.target.files?.[0]); e.target.value = ""; }} />
          </div>
          <p className="text-xs text-gray-500">Le modèle a la même structure que le deck Excel généré : un onglet par type d’entité, en-têtes en français ou en anglais selon la langue choisie.</p>
        </div>
      )}
      {source === "editor" && (
        <div className="space-y-4">
          <p className="text-sm text-gray-600">Chemin inverse, pour documenter un compte existant. Dans Google Ads Editor : Account &gt; Export &gt; Export whole account (ou une sélection) &gt; CSV. Campagnes, localisations, groupes, mots-clés, annonces responsives, liens annexes, accroches, extraits et groupes d’assets remplissent le plan.</p>
          <Button variant="primary" onClick={() => csv.current?.click()}>Choisir un export Editor</Button>
          <input ref={csv} type="file" accept=".csv,.tsv,.txt" className="hidden" onChange={(e) => { importEditor(e.target.files?.[0]); e.target.value = ""; }} />
          {resume && <div className="[&_.state]:rounded-surface [&_.state]:border [&_.state]:border-green-200 [&_.state]:bg-green-50 [&_.state]:p-3 [&_.state]:text-sm [&_.big]:font-semibold [&_.big]:text-green-800 [&_p]:mt-1 [&_p]:text-gray-700" dangerouslySetInnerHTML={{ __html: resume }} />}
        </div>
      )}
    </div>
  );
}
