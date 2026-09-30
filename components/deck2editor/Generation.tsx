"use client";
import { useState } from "react";
import { usePlan } from "./PlanContext";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { telechargerFichier, telechargerZip, copierTSV } from "@/lib/deck2editor/download";
import { telechargerExcel, telechargerDeckHTML, imprimerDeckPDF } from "@/lib/deck2editor/exports";

/* Etape finale : fichiers pour Editor, checklist, deck client. */
export default function Generation() {
  const { plan, resultat, generer } = usePlan();
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const r = resultat;
  const aDesDonnees = plan.campagnes.some((c) => c.nom);
  const checklist = r?.fichiers.find((f) => f.nom.endsWith(".txt"));

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader title="Fichiers pour Google Ads Editor" subtitle="Importez le fichier 00 dans Editor : Account > Import > From file. Vérifiez l’aperçu, puis Post pour envoyer au compte." right={<Button variant="primary" pop onClick={() => { const res = generer(); toast(res.rapport.pret ? "Généré. Prêt pour l’import." : "Généré avec erreurs : voir la colonne de droite."); }}>{r ? "Régénérer" : "Valider et générer"}</Button>} />
        <CardBody>
          {!r ? <p className="text-sm text-gray-500">Rien de généré pour l’instant. Cliquez « Valider et générer ».</p> : (
            <>
              <div className={`mb-4 rounded-surface border p-3 text-sm ${r.rapport.pret ? "border-green-200 bg-green-50 text-green-800" : "border-red-200 bg-red-50 text-red-700"}`}>
                {r.rapport.pret ? `Prêt pour l’import. ${r.rapport.avertissements.length} avertissement(s) à lire dans la colonne de droite.` : `${r.rapport.erreurs.length} erreur(s) bloquante(s) : corrigez-les (colonne de droite) puis régénérez. Les fichiers ci-dessous sont incomplets tant que des erreurs subsistent.`}
              </div>
              <div className="space-y-1.5">
                {r.fichiers.map((f, i) => (
                  <div key={i} className="flex items-center gap-2 rounded-control border border-gray-200 bg-white px-3 py-2">
                    <span className="min-w-0 flex-1 truncate font-mono text-sm font-medium">{f.nom}</span>
                    {f.nbLignes > 0 && <span className="font-mono text-xs text-gray-500">{f.nbLignes} ligne(s)</span>}
                    <Button size="sm" onClick={() => telechargerFichier(f)}>Télécharger</Button>
                    {f.tsv && <Button size="sm" onClick={async () => toast((await copierTSV(f)) ? "Copié. Dans Editor : Account > Import > Paste text." : "Copie impossible.")}>Copier</Button>}
                  </div>
                ))}
              </div>
              <Button className="mt-3" disabled={busy} onClick={async () => { setBusy(true); await telechargerZip(r.fichiers); setBusy(false); }}>Tout télécharger (ZIP)</Button>
            </>
          )}
        </CardBody>
      </Card>

      {checklist && (
        <Card>
          <CardHeader title="Checklist après import" subtitle="Ce qui ne passe pas par le fichier et se termine dans Editor ou Google Ads." />
          <CardBody><pre className="whitespace-pre-wrap font-mono text-xs leading-relaxed text-gray-700">{checklist.csv}</pre></CardBody>
        </Card>
      )}

      <Card>
        <CardHeader title="Deck client pour approbation" subtitle="Aperçu Google de chaque annonce, listes avec compteurs, mots-clés, extensions." />
        <CardBody>
          <div className="flex flex-wrap gap-2">
            <Button variant="primary" disabled={!aDesDonnees} onClick={async () => { if (!(await imprimerDeckPDF(plan))) toast("Fenêtre bloquée : autorisez les fenêtres surgissantes."); }}>Deck client (PDF)</Button>
            <Button disabled={!aDesDonnees} onClick={() => telechargerDeckHTML(plan).then(() => toast("Deck HTML téléchargé."))}>Deck client (HTML)</Button>
            <Button disabled={!aDesDonnees} onClick={() => telechargerExcel(plan, "plan").then(() => toast("Deck Excel téléchargé."))}>Deck client (Excel)</Button>
          </div>
          <p className="mt-3 text-xs text-gray-500">PDF : le deck s’ouvre dans un nouvel onglet avec la boîte d’impression ; choisissez « Enregistrer au format PDF ».</p>
        </CardBody>
      </Card>
    </div>
  );
}
