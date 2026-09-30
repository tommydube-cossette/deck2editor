"use client";
import { useState } from "react";
import { usePlan, optionsCampagne } from "./PlanContext";
import { Card, CardBody, CardHeader, SectionTitle } from "@/components/ui/Card";
import { Input, Select, Textarea } from "@/components/ui/Field";
import Button from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { groupeVide, rsaVide, typeCampagneDe } from "@/lib/deck2editor/plan";
import { X, ClipboardPaste } from "lucide-react";
import SlideOver from "@/components/ui/SlideOver";
import ImportDeck from "./ImportDeck";

export default function Groupes() {
  const { plan, update } = usePlan();
  return (
    <div className="space-y-6">
      {plan.groupes.length === 0 && <div className="rounded-surface border border-dashed border-gray-300 bg-white p-8 text-center text-sm text-gray-500">Aucun groupe d’annonces.</div>}
      {plan.groupes.map((g, i) => <GroupeCard key={i} i={i} />)}
      <Button className="w-full border-dashed" onClick={() => update((p) => { p.groupes.push(groupeVide()); p.rsas.push(rsaVide()); })}>+ Ajouter un groupe d’annonces</Button>
    </div>
  );
}

function GroupeCard({ i }: { i: number }) {
  const { plan, update } = usePlan();
  const g = plan.groupes[i], r = plan.rsas[i];
  const [coller, setColler] = useState(false);
  const setCamp = (v: string) => update((p) => {
    const old = p.groupes[i].campagne, nomG = p.groupes[i].nom;
    p.groupes[i].campagne = v; p.rsas[i].campagne = v;
    if (old && old !== v && nomG) [p.motsCles, p.negatifs].forEach((a) => a.forEach((m) => { if (m.campagne === old && m.groupe === nomG) m.campagne = v; }));
  });
  const setNom = (v: string) => update((p) => {
    const old = p.groupes[i].nom, camp = p.groupes[i].campagne;
    p.groupes[i].nom = v; p.rsas[i].groupe = v;
    if (old && old !== v) [p.motsCles, p.negatifs].forEach((a) => a.forEach((m) => { if (m.campagne === camp && m.groupe === old) m.groupe = v; }));
  });
  const supprimer = () => update((p) => {
    const gg = p.groupes[i];
    p.motsCles = p.motsCles.filter((m) => !(m.campagne === gg.campagne && m.groupe === gg.nom));
    p.negatifs = p.negatifs.filter((m) => !(m.campagne === gg.campagne && m.groupe === gg.nom));
    p.groupes.splice(i, 1); p.rsas.splice(i, 1);
  });
  const type = typeCampagneDe(plan, g.campagne);

  return (
    <Card>
      <CardHeader title={g.nom || `Groupe ${i + 1}`} subtitle={`${r.titres.length} titres · ${r.descriptions.length} desc.`}
        right={<div className="flex gap-2"><Button size="sm" disabled={!g.campagne || !g.nom} title={!g.campagne || !g.nom ? "Choisissez la campagne et nommez le groupe d’abord" : ""} onClick={() => setColler(true)}><ClipboardPaste />Coller un deck</Button><Button size="sm" variant="danger" onClick={supprimer}>Supprimer</Button></div>} />
      <SlideOver open={coller} onClose={() => setColler(false)} title={`Coller un deck : ${g.nom}`}>
        <p className="mb-4 text-sm text-gray-600">Sélectionnez les cellules de l’onglet du deck dans Excel ou Sheets (titres, descriptions, chemins, URL, mots-clés, négatifs, liens annexes, accroches, extraits), copiez, collez ci-dessous. Les titres et descriptions de ce groupe seront remplacés ; le reste s’ajoute.</p>
        <ImportDeck campagneFixe={g.campagne} groupeFixe={g.nom} onFin={() => setColler(false)} />
      </SlideOver>
      <CardBody>
        <div className="grid gap-4 md:grid-cols-4">
          <div>
            <Select label="Campagne" required options={optionsCampagne(plan, "std")} value={g.campagne} onChange={(e) => setCamp(e.target.value)} />
            {type === "Performance Max" && <p className="mt-1 text-xs text-red-600">Cette campagne est de type Performance Max : les groupes d’annonces et les mots-clés ne s’y appliquent pas.</p>}
          </div>
          <Input label="Nom du groupe" required placeholder="nom_du_groupe" value={g.nom} onChange={(e) => setNom(e.target.value)} />
          <Input label="Max CPC" value={g.maxCPC} onChange={(e) => update((p) => { p.groupes[i].maxCPC = e.target.value; })} />
          <Select label="Statut" options={["Enabled", "Paused"]} value={g.statut} onChange={(e) => update((p) => { p.groupes[i].statut = e.target.value; })} />
          <Input label="URL finale de l’annonce" required placeholder="https://www.exemple.com/page" value={r.urlFinale} onChange={(e) => update((p) => { p.rsas[i].urlFinale = e.target.value; })} />
          <Input label="URL mobile" hint="facultatif" value={r.urlMobile} onChange={(e) => update((p) => { p.rsas[i].urlMobile = e.target.value; })} />
          <Input label="Chemin 1" hint="15 car." max={15} value={r.path1} onChange={(e) => update((p) => { p.rsas[i].path1 = e.target.value; })} />
          <Input label="Chemin 2" hint="15 car." max={15} value={r.path2} onChange={(e) => update((p) => { p.rsas[i].path2 = e.target.value; })} />
        </div>
        <ZoneAssets i={i} cle="titres" titre="Titres" max={30} plafond={15} mini={3} pins={["", "1", "2", "3"]} />
        <ZoneAssets i={i} cle="descriptions" titre="Descriptions" max={90} plafond={4} mini={2} pins={["", "1", "2"]} />
      </CardBody>
    </Card>
  );
}

function ZoneAssets({ i, cle, titre, max, plafond, mini, pins }: { i: number; cle: "titres" | "descriptions"; titre: string; max: number; plafond: number; mini: number; pins: string[] }) {
  const { plan, update } = usePlan();
  const toast = useToast();
  const arr = plan.rsas[i][cle];
  const n = arr.length, mauvais = n < mini || n > plafond;
  const [bulk, setBulk] = useState(false); const [txt, setTxt] = useState("");
  return (
    <div>
      <SectionTitle meta={`${n} / ${plafond}${n < mini ? `  ·  minimum ${mini}` : ""}`} bad={mauvais}>{titre}</SectionTitle>
      <div className="mb-2 h-1 overflow-hidden rounded bg-gray-100"><div className={`h-full ${mauvais ? "bg-red-500" : "bg-primary"}`} style={{ width: `${Math.min(100, Math.round((n / plafond) * 100))}%` }} /></div>
      <div className="space-y-1.5">
        {arr.map((a, j) => (
          <div key={j} className="flex items-center gap-2">
            <span className="w-5 text-right font-mono text-xs text-gray-400">{j + 1}</span>
            <div className="flex-1"><Input max={max} value={a.texte} onChange={(e) => update((p) => { p.rsas[i][cle][j].texte = e.target.value; })} /></div>
            <select className="w-20 rounded-control border border-gray-300 px-2 py-2 text-xs" title="Épingler" value={a.pin} onChange={(e) => update((p) => { p.rsas[i][cle][j].pin = e.target.value; })}>
              {pins.map((v) => <option key={v} value={v}>{v ? "Pos. " + v : "—"}</option>)}
            </select>
            <button className="rounded-control p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600" onClick={() => update((p) => { p.rsas[i][cle].splice(j, 1); })}><X className="h-4 w-4" /></button>
          </div>
        ))}
      </div>
      <div className="mt-2 flex gap-2">
        <Button size="sm" disabled={n >= plafond} onClick={() => update((p) => { p.rsas[i][cle].push({ texte: "", pin: "" }); })}>+ Ajouter</Button>
        <Button size="sm" onClick={() => setBulk(!bulk)}>Coller en lot</Button>
      </div>
      {bulk && (
        <div className="mt-2">
          <Textarea placeholder="Une ligne par élément" value={txt} onChange={(e) => setTxt(e.target.value)} />
          <Button size="sm" variant="primary" className="mt-2" onClick={() => {
            const lignes = txt.split(/\r?\n/).map((x) => x.trim()).filter(Boolean); let nb = 0;
            update((p) => { lignes.forEach((x) => { if (p.rsas[i][cle].length < plafond) { p.rsas[i][cle].push({ texte: x, pin: "" }); nb++; } }); });
            setTxt(""); setBulk(false); toast(`${nb} ligne(s) importée(s).`);
          }}>Ajouter ces lignes</Button>
        </div>
      )}
    </div>
  );
}
