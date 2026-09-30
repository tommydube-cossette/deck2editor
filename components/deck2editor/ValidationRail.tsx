"use client";
import { usePlan, type Onglet } from "./PlanContext";
import Button from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import type { Message } from "@/lib/deck2editor/types";

const BLOC2ONGLET: Record<string, Onglet> = {
  Campagnes: "campagnes", Localisations: "campagnes", "Groupes d'annonces": "groupes", "Annonces RSA": "groupes",
  "Mots-cles": "motscles", "Mots-cles negatifs": "motscles", Sitelinks: "extensions", Accroches: "extensions",
  "Extraits de site": "extensions", "Groupes d'assets": "pmax",
};
const LIBELLES: [string, string][] = [["campagnes", "Campagnes"], ["localisations", "Localisations"], ["groupes", "Groupes"], ["motsCles", "Mots-clés"], ["negatifs", "Négatifs"], ["rsa", "Annonces"], ["sitelinks", "Liens"], ["callouts", "Accroches"], ["snippets", "Extraits"], ["assetGroups", "Assets PMax"]];

export default function ValidationRail() {
  const { resultat, generer, setOnglet } = usePlan();
  const toast = useToast();
  const r = resultat;

  const Msg = ({ m, type }: { m: Message; type: "e" | "w" }) => (
    <button type="button" onClick={() => setOnglet(BLOC2ONGLET[m.bloc] || "contexte")}
      className={`mb-2 w-full rounded-control border px-3 py-2 text-left text-xs leading-snug ${type === "e" ? "border-red-200 bg-red-50" : "border-amber-200 bg-amber-50"}`}>
      <span className={`block text-[10px] font-bold uppercase tracking-wide ${type === "e" ? "text-red-600" : "text-amber-700"}`}>{type === "e" ? "Erreur" : "Avertissement"} · {m.bloc}</span>
      {m.ref && <span className="block font-semibold text-gray-900">{m.ref}</span>}
      <span className="text-gray-700">{m.message}</span>
    </button>
  );

  return (
    <aside className="sticky top-0 h-[calc(100vh-3rem)] w-[372px] shrink-0 overflow-y-auto border-l border-gray-200 bg-white p-5">
      <h3 className="text-[11px] font-semibold uppercase tracking-wide text-gray-600">Validation</h3>
      <div className={`mt-2 rounded-surface border p-3 ${!r ? "border-gray-300 bg-gray-50" : r.rapport.pret ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}`}>
        <div className={`text-sm font-semibold ${!r ? "text-gray-900" : r.rapport.pret ? "text-green-800" : "text-red-700"}`}>
          {!r ? "Pas encore généré" : r.rapport.pret ? "Prêt pour l’import" : `${r.rapport.erreurs.length} erreur(s) bloquante(s)`}
        </div>
        <p className="mt-0.5 text-xs text-gray-600">
          {!r ? "Complétez votre plan puis lancez la validation." : r.rapport.pret ? (r.rapport.avertissements.length ? `${r.rapport.avertissements.length} avertissement(s) à lire.` : "Aucun avertissement.") : "Corrigez-les avant d’importer. Touchez un message pour aller à la section concernée."}
        </p>
      </div>
      <Button variant="primary" pop className="mt-3 w-full" onClick={() => { const res = generer(); toast(res.rapport.pret ? "Généré. Prêt pour l’import." : "Généré avec erreurs."); }}>Valider et générer</Button>

      {r && (
        <>
          <h3 className="mt-5 text-[11px] font-semibold uppercase tracking-wide text-gray-600">Contenu</h3>
          <div className="mt-2 grid grid-cols-2 gap-1.5">
            {LIBELLES.filter(([k]) => r.stats[k]).map(([k, l]) => (
              <div key={k} className="rounded-control bg-gray-100 px-2.5 py-1.5"><div className="font-mono text-base font-semibold tabular-nums">{r.stats[k]}</div><div className="text-[11px] text-gray-500">{l}</div></div>
            ))}
          </div>

          {(r.rapport.erreurs.length > 0 || r.rapport.avertissements.length > 0) && (
            <>
              <h3 className="mt-5 text-[11px] font-semibold uppercase tracking-wide text-gray-600">Messages</h3>
              <div className="mt-2">{r.rapport.erreurs.map((m, i) => <Msg key={"e" + i} m={m} type="e" />)}{r.rapport.avertissements.map((m, i) => <Msg key={"w" + i} m={m} type="w" />)}</div>
            </>
          )}

          <Button className="mt-5 w-full" onClick={() => setOnglet("generation")}>Voir les fichiers et le deck client</Button>
        </>
      )}
    </aside>
  );
}
