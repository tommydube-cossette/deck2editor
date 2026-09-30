"use client";
import { useState } from "react";
import { usePlan, optionsCampagne, optionsGroupe } from "./PlanContext";
import { Select, Textarea } from "@/components/ui/Field";
import Button from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import GAE from "@/lib/deck2editor/gae";

interface Parse {
  titres: string[]; descriptions: string[]; titresLongs: string[]; descriptionsCourtes: string[];
  motsCles: string[]; negatifs: string[]; callouts: string[];
  sitelinks: { texte: string; desc1: string; desc2: string; urlFinale: string }[];
  snippets: { entete: string; valeurs: string[] }[];
  path1: string; path2: string; urlFinale: string; nomEntreprise: string; cta: string;
}

/* Import d'un deck colle (onglet Excel). Reserve aux campagnes Search : un deck
   Performance Max se saisit dans l'onglet Performance Max (Coller en lot). */
export default function ImportDeck({ campagneFixe, groupeFixe, onFin }: { campagneFixe?: string; groupeFixe?: string; onFin?: () => void } = {}) {
  const { plan, update, setOnglet, setPanneau } = usePlan();
  const toast = useToast();
  const [txt, setTxt] = useState(""); const [camp, setCamp] = useState(campagneFixe || ""); const [grp, setGrp] = useState(groupeFixe || "");
  const [parse, setParse] = useState<Parse | null>(null);

  const analyser = () => { setParse(GAE.parserDeck(txt) as Parse); };
  const appliquer = () => {
    if (!parse) return toast("Cliquez d’abord sur Analyser.");
    if (!camp || !grp) return toast("Choisissez la campagne et le groupe de destination.");
    const idx = plan.groupes.findIndex((x) => x.campagne === camp && x.nom === grp);
    if (idx < 0) return toast("Groupe introuvable.");
    const r = parse;
    update((p) => {
      p.rsas[idx].titres = r.titres.slice(0, 15).map((t) => ({ texte: t, pin: "" }));
      p.rsas[idx].descriptions = r.descriptions.slice(0, 4).map((t) => ({ texte: t, pin: "" }));
      if (r.path1) p.rsas[idx].path1 = r.path1; if (r.path2) p.rsas[idx].path2 = r.path2; if (r.urlFinale) p.rsas[idx].urlFinale = r.urlFinale;
      r.motsCles.forEach((t) => p.motsCles.push({ campagne: camp, groupe: grp, texte: t, correspondance: "Phrase" }));
      r.negatifs.forEach((t) => p.negatifs.push({ campagne: camp, groupe: "", texte: t, correspondance: "Phrase" }));
      r.callouts.forEach((t) => p.callouts.push({ campagne: camp, texte: t }));
      r.sitelinks.forEach((x) => p.sitelinks.push({ campagne: camp, groupe: "", texte: x.texte, desc1: x.desc1 || "", desc2: x.desc2 || "", urlFinale: x.urlFinale || "" }));
      r.snippets.forEach((x) => p.snippets.push({ campagne: camp, entete: x.entete, valeurs: x.valeurs || [] }));
    });
    if (r.titresLongs.length || r.descriptionsCourtes.length) toast("Titres longs ignorés : la campagne de destination n’est pas de type Performance Max.");
    setOnglet("groupes"); setPanneau(null); onFin?.(); toast(`Deck appliqué au groupe « ${grp} ».`);
  };

  return (
    <div>
      <div>
          <Textarea label="Contenu collé" className="min-h-[200px]" value={txt} onChange={(e) => setTxt(e.target.value)} />
          {!groupeFixe && <div className="mt-4 grid gap-4 md:grid-cols-2">
            <Select label="Campagne de destination" options={optionsCampagne(plan, "std")} value={camp} onChange={(e) => { setCamp(e.target.value); setGrp(""); }} />
            <Select label="Groupe de destination" options={optionsGroupe(plan, camp, false)} value={grp} onChange={(e) => setGrp(e.target.value)} />
          </div>}
          <div className="mt-4 flex gap-2">
            <Button onClick={analyser}>Analyser</Button>
            <Button variant="primary" onClick={appliquer}>Appliquer</Button>
          </div>
          {parse && (
            <div className="mt-4 rounded-surface border border-green-200 bg-green-50 p-4 text-sm">
              <div className="font-semibold text-green-800">Deck analysé</div>
              <p className="mt-1 text-gray-700">{parse.titres.length} titre(s) · {parse.titresLongs.length} long(s) · {parse.descriptions.length} description(s) · {parse.descriptionsCourtes.length} courte(s)<br />
                {parse.motsCles.length} mot(s)-clé(s) · {parse.negatifs.length} négatif(s) · {parse.callouts.length} accroche(s) · {parse.sitelinks.length} lien(s) · {parse.snippets.length} extrait(s)
                {parse.urlFinale && <><br />URL : {parse.urlFinale}</>}{parse.path1 && <><br />Chemins : {parse.path1} / {parse.path2}</>}</p>
            </div>
          )}
      </div>
    </div>
  );
}
