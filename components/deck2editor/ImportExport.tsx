"use client";
import { useRef, useState } from "react";
import { usePlan } from "./PlanContext";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { telechargerExcel, importerExcel, importerExportEditor, telechargerDeckHTML, imprimerDeckPDF } from "@/lib/deck2editor/exports";

/* Chemins d'echange : Excel (modele, deck, import), export Google Ads Editor (chemin inverse), deck client. */
export default function ImportExport() {
  const { plan, setPlan, setPlanId, setOnglet, generer } = usePlan();
  const toast = useToast();
  const [resume, setResume] = useState("");
  const xlsxIn = useRef<HTMLInputElement>(null); const xlsxDirect = useRef<HTMLInputElement>(null);
  const csvEd = useRef<HTMLInputElement>(null); const csvEdX = useRef<HTMLInputElement>(null);
  const aDesDonnees = plan.campagnes.some((c) => c.nom) || plan.groupes.length > 0;

  const lireFichier = (f: File) => new Promise<ArrayBuffer>((ok, ko) => { const r = new FileReader(); r.onload = () => ok(r.result as ArrayBuffer); r.onerror = () => ko(new Error("Fichier illisible : " + f.name)); r.readAsArrayBuffer(f); });

  const importExcel = async (f: File | undefined, puisGenerer: boolean) => {
    if (!f) return;
    if (aDesDonnees && !confirm("Le plan actuel sera remplacé par le fichier Excel. Continuer ?")) return;
    try {
      const N = await importerExcel(await lireFichier(f));
      if (!N) return toast("Aucun onglet reconnu. Utilisez le modèle Excel de l’outil.");
      setPlan(N); setPlanId(null);
      if (puisGenerer) { setTimeout(() => { const r = generer(); toast(r.rapport.pret ? "Fichier 00 généré. Prêt pour l’import." : "Généré avec erreurs : voir la colonne de droite."); }, 0); }
      else { toast(`Plan Excel importé : ${N.campagnes.length} campagne(s), ${N.groupes.length} groupe(s), ${N.motsCles.length} mot(s)-clé(s).`); setOnglet("campagnes"); }
    } catch (e) { toast("Fichier Excel illisible : " + (e as Error).message); }
  };

  const importEditor = async (f: File | undefined, versExcel: boolean) => {
    if (!f) return;
    if (aDesDonnees && !confirm("Le plan actuel sera remplacé par l’export Editor. Continuer ?")) return;
    try {
      const res = await importerExportEditor(await lireFichier(f));
      if (!res) return toast("Aucune entité reconnue. Utilisez un export CSV de Google Ads Editor (Account > Export).");
      setPlan(res.plan); setPlanId(null); setResume(res.resumeHTML);
      if (versExcel) { await telechargerExcel(res.plan, "plan"); toast("Deck Excel du compte généré."); }
      else toast(`Export Editor chargé : ${res.cpt.campagnes} campagne(s), ${res.cpt.groupes} groupe(s), ${res.cpt.motsCles} mot(s)-clé(s).`);
    } catch (e) { toast("Fichier illisible : " + (e as Error).message); }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader title="Excel vers Editor en un clic" subtitle="Déposez le modèle Excel rempli (ou un deck Excel généré par l’outil) : le plan est chargé, validé, et le fichier 00 pour Editor est généré immédiatement." />
        <CardBody>
          <div className="flex flex-wrap gap-2">
            <Button variant="primary" onClick={() => xlsxDirect.current?.click()}>Choisir un fichier Excel et générer</Button>
            <Button onClick={() => xlsxIn.current?.click()}>Importer un plan Excel (sans générer)</Button>
            <Button onClick={() => telechargerExcel(plan, "modele").then(() => toast("Modèle Excel téléchargé."))}>Télécharger le modèle Excel</Button>
            <input ref={xlsxDirect} type="file" accept=".xlsx,.xls" className="hidden" onChange={(e) => { importExcel(e.target.files?.[0], true); e.target.value = ""; }} />
            <input ref={xlsxIn} type="file" accept=".xlsx,.xls" className="hidden" onChange={(e) => { importExcel(e.target.files?.[0], false); e.target.value = ""; }} />
          </div>
          <p className="mt-3 text-xs text-gray-500">Le modèle a la même structure que le deck Excel généré : remplissez-le (ou faites-le remplir par le client), importez, corrigez ce que l’outil signale, puis générez le fichier 00.</p>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Editor vers Excel : documenter un compte existant" subtitle="Chemin inverse. Dans Google Ads Editor : Account > Export > Export whole account (ou une sélection de campagnes) > CSV. Déposez ce fichier ici : campagnes, localisations, groupes, mots-clés, annonces responsives, liens annexes, accroches, extraits de site et groupes d’assets remplissent le plan. Aucune écriture dans Google Ads." />
        <CardBody>
          <div className="flex flex-wrap gap-2">
            <Button variant="primary" onClick={() => csvEdX.current?.click()}>Choisir un export Editor et générer le deck Excel</Button>
            <Button onClick={() => csvEd.current?.click()}>Charger un export Editor dans le plan</Button>
            <input ref={csvEdX} type="file" accept=".csv,.tsv,.txt" className="hidden" onChange={(e) => { importEditor(e.target.files?.[0], true); e.target.value = ""; }} />
            <input ref={csvEd} type="file" accept=".csv,.tsv,.txt" className="hidden" onChange={(e) => { importEditor(e.target.files?.[0], false); e.target.value = ""; }} />
          </div>
          {resume && <div className="mt-4 [&_.state]:rounded-surface [&_.state]:border [&_.state]:border-green-200 [&_.state]:bg-green-50 [&_.state]:p-3 [&_.state]:text-sm [&_.big]:font-semibold [&_.big]:text-green-800 [&_p]:mt-1 [&_p]:text-gray-700" dangerouslySetInnerHTML={{ __html: resume }} />}
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Deck client" subtitle="Document de présentation du plan pour approbation : aperçu Google de chaque annonce, listes avec compteurs de caractères, mots-clés, extensions." />
        <CardBody>
          <div className="flex flex-wrap gap-2">
            <Button variant="primary" disabled={!aDesDonnees} onClick={async () => { if (!(await imprimerDeckPDF(plan))) toast("Fenêtre bloquée : autorisez les fenêtres surgissantes pour ce site."); }}>Deck client (PDF)</Button>
            <Button disabled={!aDesDonnees} onClick={() => telechargerDeckHTML(plan).then(() => toast("Deck client téléchargé."))}>Deck client (HTML)</Button>
            <Button disabled={!aDesDonnees} onClick={() => telechargerExcel(plan, "plan").then(() => toast("Excel généré."))}>Deck client (Excel)</Button>
          </div>
          <p className="mt-3 text-xs text-gray-500">PDF : le deck s’ouvre dans un nouvel onglet et la boîte d’impression apparaît ; choisissez « Enregistrer au format PDF ».</p>
        </CardBody>
      </Card>
    </div>
  );
}
