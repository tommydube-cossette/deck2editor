"use client";
import { useState } from "react";
import { usePlan, optionsCampagne, optionsGroupe } from "./PlanContext";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Select, Textarea, Chips } from "@/components/ui/Field";
import Button from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { X } from "lucide-react";

const MATCH = ["Phrase", "Exact", "Broad"];

export default function MotsCles() {
  const { plan, update } = usePlan();
  const toast = useToast();
  const [kwCamp, setKwCamp] = useState(""); const [kwGrp, setKwGrp] = useState(""); const [kwMt, setKwMt] = useState("Phrase"); const [kwTxt, setKwTxt] = useState("");
  const [ngCamp, setNgCamp] = useState(""); const [ngGrp, setNgGrp] = useState(""); const [ngMt, setNgMt] = useState("Phrase"); const [ngTxt, setNgTxt] = useState("");
  const lignes = (t: string) => t.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader title="Ajouter des mots-clés" subtitle="La correspondance est portée par la colonne « Criterion Type », sans crochets ni guillemets." />
        <CardBody>
          <div className="grid gap-4 md:grid-cols-3">
            <Select label="Campagne" required options={optionsCampagne(plan, "std")} value={kwCamp} onChange={(e) => { setKwCamp(e.target.value); setKwGrp(""); }} />
            <Select label="Groupe d’annonces" required options={optionsGroupe(plan, kwCamp, false)} value={kwGrp} onChange={(e) => setKwGrp(e.target.value)} />
            <Chips label="Correspondance" options={MATCH} value={kwMt} onChange={setKwMt} />
          </div>
          <div className="mt-4"><Textarea label="Un mot-clé par ligne" placeholder={"mot cle exemple\nautre mot cle"} value={kwTxt} onChange={(e) => setKwTxt(e.target.value)} /></div>
          <Button variant="primary" className="mt-3" onClick={() => {
            if (!kwCamp || !kwGrp) return toast("Choisissez une campagne et un groupe.");
            const l = lignes(kwTxt); if (!l.length) return toast("Saisissez au moins un mot-clé.");
            update((p) => l.forEach((t) => p.motsCles.push({ campagne: kwCamp, groupe: kwGrp, texte: t, correspondance: kwMt })));
            setKwTxt(""); toast(`${l.length} mot(s)-clé ajouté(s).`);
          }}>Ajouter</Button>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Ajouter des mots-clés négatifs" />
        <CardBody>
          <div className="grid gap-4 md:grid-cols-3">
            <Select label="Campagne" required options={optionsCampagne(plan, "std")} value={ngCamp} onChange={(e) => { setNgCamp(e.target.value); setNgGrp(""); }} />
            <Select label="Niveau" hint="vide = campagne" options={optionsGroupe(plan, ngCamp, true)} value={ngGrp} onChange={(e) => setNgGrp(e.target.value)} />
            <Chips label="Correspondance" options={MATCH} value={ngMt} onChange={setNgMt} />
          </div>
          <div className="mt-4"><Textarea label="Un mot-clé négatif par ligne" placeholder={"terme a exclure\nautre terme"} value={ngTxt} onChange={(e) => setNgTxt(e.target.value)} /></div>
          <Button variant="primary" className="mt-3" onClick={() => {
            if (!ngCamp) return toast("Choisissez une campagne.");
            const l = lignes(ngTxt); if (!l.length) return toast("Saisissez au moins un mot-clé.");
            update((p) => l.forEach((t) => p.negatifs.push({ campagne: ngCamp, groupe: ngGrp, texte: t, correspondance: ngMt })));
            setNgTxt(""); toast(`${l.length} négatif(s) ajouté(s).`);
          }}>Ajouter</Button>
        </CardBody>
      </Card>

      {plan.motsCles.length + plan.negatifs.length === 0 ? (
        <div className="rounded-surface border border-dashed border-gray-300 bg-white p-8 text-center text-sm text-gray-500">Aucun mot-clé.</div>
      ) : (
        <Card>
          <table className="min-w-full">
            <thead><tr className="bg-primary text-left text-white">
              <th className="w-24 px-4 py-2 text-[11px] font-semibold uppercase tracking-wide">Type</th>
              <th className="px-4 py-2 text-[11px] font-semibold uppercase tracking-wide">Mot-clé</th>
              <th className="px-4 py-2 text-[11px] font-semibold uppercase tracking-wide">Campagne / groupe</th>
              <th className="w-28 px-4 py-2 text-[11px] font-semibold uppercase tracking-wide">Correspondance</th><th className="w-12" /></tr></thead>
            <tbody className="divide-y divide-gray-200">
              {plan.motsCles.map((m, i) => (
                <tr key={"k" + i} className="hover:bg-gray-50">
                  <td className="px-4 py-2"><span className="rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-semibold text-gray-700">Positif</span></td>
                  <td className="px-4 py-2 text-sm font-medium text-gray-900">{m.texte}</td>
                  <td className="px-4 py-2 text-xs text-gray-500">{m.campagne} · {m.groupe}</td>
                  <td className="px-4 py-2 text-xs text-gray-500">{m.correspondance}</td>
                  <td className="px-2 py-2"><button className="rounded-control p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600" onClick={() => update((p) => { p.motsCles.splice(i, 1); })}><X className="h-4 w-4" /></button></td>
                </tr>
              ))}
              {plan.negatifs.map((m, i) => (
                <tr key={"n" + i} className="hover:bg-gray-50">
                  <td className="px-4 py-2"><span className="rounded-full bg-red-50 px-2 py-0.5 text-[11px] font-semibold text-red-600">Négatif</span></td>
                  <td className="px-4 py-2 text-sm font-medium text-gray-900">{m.texte}</td>
                  <td className="px-4 py-2 text-xs text-gray-500">{m.campagne} · {m.groupe || "campagne"}</td>
                  <td className="px-4 py-2 text-xs text-gray-500">{m.correspondance}</td>
                  <td className="px-2 py-2"><button className="rounded-control p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600" onClick={() => update((p) => { p.negatifs.splice(i, 1); })}><X className="h-4 w-4" /></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
