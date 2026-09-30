"use client";
import { useState } from "react";
import { usePlan, optionsCampagne } from "./PlanContext";
import { Card, CardBody, CardHeader, SectionTitle } from "@/components/ui/Card";
import { Input, Select, Textarea } from "@/components/ui/Field";
import Button from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { assetGroupVide, typeCampagneDe } from "@/lib/deck2editor/plan";
import { X } from "lucide-react";

export default function PMax() {
  const { plan, update } = usePlan();
  return (
    <div className="space-y-6">
      {plan.assetGroups.length === 0 && <div className="rounded-surface border border-dashed border-gray-300 bg-white p-8 text-center text-sm text-gray-500">Aucun groupe d’assets.</div>}
      {plan.assetGroups.map((_, i) => <AssetGroupCard key={i} i={i} />)}
      <Button className="w-full border-dashed" onClick={() => update((p) => { p.assetGroups.push(assetGroupVide()); })}>+ Ajouter un groupe d’assets</Button>
    </div>
  );
}

function AssetGroupCard({ i }: { i: number }) {
  const { plan, update, ref } = usePlan();
  const a = plan.assetGroups[i];
  const set = (k: keyof typeof a, v: string) => update((p) => { (p.assetGroups[i] as unknown as Record<string, string>)[k as string] = v; });
  const type = typeCampagneDe(plan, a.campagne);
  return (
    <Card>
      <CardHeader title={a.nom || `Groupe d’assets ${i + 1}`} subtitle={`${a.titres.length} titres · ${a.titresLongs.length} longs · ${a.descriptions.length} desc.`} right={<Button size="sm" variant="danger" onClick={() => update((p) => { p.assetGroups.splice(i, 1); })}>Supprimer</Button>} />
      <CardBody>
        <div className="grid gap-4 md:grid-cols-4">
          <div>
            <Select label="Campagne PMax" required options={optionsCampagne(plan, "pmax")} value={a.campagne} onChange={(e) => set("campagne", e.target.value)} />
            {type && type !== "Performance Max" && <p className="mt-1 text-xs text-red-600">Un groupe d’assets exige une campagne Performance Max.</p>}
          </div>
          <Input label="Nom du groupe" required placeholder="nom_du_groupe_assets" value={a.nom} onChange={(e) => set("nom", e.target.value)} />
          <Input label="URL finale" required placeholder="https://www.exemple.com" value={a.urlFinale} onChange={(e) => set("urlFinale", e.target.value)} />
          <Select label="Statut" options={["Paused", "Enabled"]} value={a.statut} onChange={(e) => set("statut", e.target.value)} />
          <Input label="Nom de l’entreprise" hint="25 car., reporté en checklist" max={25} value={a.nomEntreprise} onChange={(e) => set("nomEntreprise", e.target.value)} />
          <Select label="Incitation à l’action" options={["", ...ref.cta]} value={a.cta} onChange={(e) => set("cta", e.target.value)} />
          <Input label="Chemin 1" max={15} value={a.path1} onChange={(e) => set("path1", e.target.value)} />
          <Input label="Chemin 2" max={15} value={a.path2} onChange={(e) => set("path2", e.target.value)} />
        </div>
        <Zone i={i} cle="titres" titre="Titres" max={30} plafond={15} mini={3} />
        <Zone i={i} cle="titresLongs" titre="Titres longs" max={90} plafond={5} mini={1} />
        <Zone i={i} cle="descriptions" titre="Descriptions" max={90} plafond={5} mini={2} />
        <p className="mt-4 text-xs text-gray-500">Google exige au moins une description de 60 caractères ou moins. Images, logos et vidéos se téléversent dans Editor après l’import.</p>
      </CardBody>
    </Card>
  );
}

function Zone({ i, cle, titre, max, plafond, mini }: { i: number; cle: "titres" | "titresLongs" | "descriptions"; titre: string; max: number; plafond: number; mini: number }) {
  const { plan, update } = usePlan();
  const toast = useToast();
  const arr = plan.assetGroups[i][cle]; const n = arr.length; const mauvais = n < mini || n > plafond;
  const [bulk, setBulk] = useState(false); const [txt, setTxt] = useState("");
  return (
    <div>
      <SectionTitle meta={`${n} / ${plafond}${n < mini ? `  ·  minimum ${mini}` : ""}`} bad={mauvais}>{titre}</SectionTitle>
      <div className="space-y-1.5">
        {arr.map((t, j) => (
          <div key={j} className="flex items-center gap-2">
            <span className="w-5 text-right font-mono text-xs text-gray-400">{j + 1}</span>
            <div className="flex-1"><Input max={max} value={t} onChange={(e) => update((p) => { p.assetGroups[i][cle][j] = e.target.value; })} /></div>
            <button className="rounded-control p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600" onClick={() => update((p) => { p.assetGroups[i][cle].splice(j, 1); })}><X className="h-4 w-4" /></button>
          </div>
        ))}
      </div>
      <div className="mt-2 flex gap-2">
        <Button size="sm" disabled={n >= plafond} onClick={() => update((p) => { p.assetGroups[i][cle].push(""); })}>+ Ajouter</Button>
        <Button size="sm" onClick={() => setBulk(!bulk)}>Coller en lot</Button>
      </div>
      {bulk && (
        <div className="mt-2">
          <Textarea placeholder="Une ligne par élément" value={txt} onChange={(e) => setTxt(e.target.value)} />
          <Button size="sm" variant="primary" className="mt-2" onClick={() => {
            const l = txt.split(/\r?\n/).map((x) => x.trim()).filter(Boolean); let nb = 0;
            update((p) => l.forEach((x) => { if (p.assetGroups[i][cle].length < plafond) { p.assetGroups[i][cle].push(x); nb++; } }));
            setTxt(""); setBulk(false); toast(`${nb} ligne(s) importée(s).`);
          }}>Ajouter ces lignes</Button>
        </div>
      )}
    </div>
  );
}
