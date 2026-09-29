"use client";
import { useState } from "react";
import { usePlan, optionsCampagne, optionsGroupe } from "./PlanContext";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Input, Select, Textarea } from "@/components/ui/Field";
import Button from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { X } from "lucide-react";

const lignes = (t: string) => t.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);

export default function Extensions() {
  const { plan, update, ref } = usePlan();
  const toast = useToast();
  const [slCamp, setSlCamp] = useState(""); const [slGrp, setSlGrp] = useState(""); const [slBulk, setSlBulk] = useState(""); const [slShow, setSlShow] = useState(false);
  const [coCamp, setCoCamp] = useState(""); const [coBulk, setCoBulk] = useState(""); const [coShow, setCoShow] = useState(false);
  const langue = plan.options.langueSnippets || "fr";
  const entetes = ref.entetesSnippets[langue];
  const [snCamp, setSnCamp] = useState(""); const [snHead, setSnHead] = useState(entetes[0]); const [snTxt, setSnTxt] = useState("");

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader title="Liens annexes" subtitle="Minimum 2 par campagne, 4 recommandés." right={<span className="font-mono text-xs text-gray-500">{plan.sitelinks.length} lien(s)</span>} />
        <CardBody>
          <div className="grid gap-4 md:grid-cols-2">
            <Select label="Campagne" required options={optionsCampagne(plan, "all")} value={slCamp} onChange={(e) => { setSlCamp(e.target.value); setSlGrp(""); }} />
            <Select label="Groupe d’annonces" hint="facultatif" options={optionsGroupe(plan, slCamp === "<Account-level>" ? "" : slCamp, true)} value={slGrp} onChange={(e) => setSlGrp(e.target.value)} />
          </div>
          <div className="mt-4 space-y-3">
            {plan.sitelinks.map((s, i) => (
              <div key={i} className="flex items-start gap-2">
                <span className="w-5 pt-2.5 text-right font-mono text-xs text-gray-400">{i + 1}</span>
                <div className="grid flex-1 gap-2 md:grid-cols-2">
                  <Input placeholder="Texte du lien *" required max={25} value={s.texte} onChange={(e) => update((p) => { p.sitelinks[i].texte = e.target.value; })} />
                  <Input placeholder="URL finale *" required value={s.urlFinale} onChange={(e) => update((p) => { p.sitelinks[i].urlFinale = e.target.value; })} />
                  <Input placeholder="Description 1" max={35} value={s.desc1} onChange={(e) => update((p) => { p.sitelinks[i].desc1 = e.target.value; })} />
                  <Input placeholder="Description 2" max={35} value={s.desc2} onChange={(e) => update((p) => { p.sitelinks[i].desc2 = e.target.value; })} />
                  <span className="text-xs text-gray-500 md:col-span-2">{s.campagne}{s.groupe ? " · " + s.groupe : ""}</span>
                </div>
                <button className="mt-2 rounded-control p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600" onClick={() => update((p) => { p.sitelinks.splice(i, 1); })}><X className="h-4 w-4" /></button>
              </div>
            ))}
          </div>
          <div className="mt-3 flex gap-2">
            <Button size="sm" onClick={() => { if (!slCamp) return toast("Choisissez une campagne."); update((p) => { p.sitelinks.push({ campagne: slCamp, groupe: slGrp, texte: "", desc1: "", desc2: "", urlFinale: "" }); }); }}>+ Lien</Button>
            <Button size="sm" onClick={() => setSlShow(!slShow)}>Coller en lot</Button>
          </div>
          {slShow && (
            <div className="mt-3">
              <Textarea label="Une ligne par lien : Texte ⇥ Description 1 ⇥ Description 2 ⇥ URL" placeholder={"Texte du lien\tDescription 1\tDescription 2\thttps://www.exemple.com/page"} value={slBulk} onChange={(e) => setSlBulk(e.target.value)} />
              <Button size="sm" variant="primary" className="mt-2" onClick={() => {
                if (!slCamp) return toast("Choisissez une campagne.");
                const l = lignes(slBulk); if (!l.length) return toast("Collez au moins une ligne.");
                update((p) => l.forEach((x) => { const t = x.split("\t"); p.sitelinks.push({ campagne: slCamp, groupe: slGrp, texte: t[0] || "", desc1: t[1] || "", desc2: t[2] || "", urlFinale: t[3] || "" }); }));
                setSlBulk(""); setSlShow(false); toast(`${l.length} ligne(s) importée(s).`);
              }}>Importer les lignes</Button>
            </div>
          )}
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Accroches" subtitle="Minimum 2, 4 recommandées." right={<span className="font-mono text-xs text-gray-500">{plan.callouts.length} accroche(s)</span>} />
        <CardBody>
          <Select label="Campagne" required options={optionsCampagne(plan, "all")} value={coCamp} onChange={(e) => setCoCamp(e.target.value)} />
          <div className="mt-4 space-y-1.5">
            {plan.callouts.map((c, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="w-5 text-right font-mono text-xs text-gray-400">{i + 1}</span>
                <div className="flex-1"><Input placeholder="Accroche" max={25} value={c.texte} onChange={(e) => update((p) => { p.callouts[i].texte = e.target.value; })} /></div>
                <span className="w-40 truncate text-xs text-gray-500">{c.campagne}</span>
                <button className="rounded-control p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600" onClick={() => update((p) => { p.callouts.splice(i, 1); })}><X className="h-4 w-4" /></button>
              </div>
            ))}
          </div>
          <div className="mt-3 flex gap-2">
            <Button size="sm" onClick={() => { if (!coCamp) return toast("Choisissez une campagne."); update((p) => { p.callouts.push({ campagne: coCamp, texte: "" }); }); }}>+ Accroche</Button>
            <Button size="sm" onClick={() => setCoShow(!coShow)}>Coller en lot</Button>
          </div>
          {coShow && (
            <div className="mt-3">
              <Textarea label="Une accroche par ligne" value={coBulk} onChange={(e) => setCoBulk(e.target.value)} />
              <Button size="sm" variant="primary" className="mt-2" onClick={() => {
                if (!coCamp) return toast("Choisissez une campagne.");
                const l = lignes(coBulk); if (!l.length) return toast("Collez au moins une ligne.");
                update((p) => l.forEach((t) => p.callouts.push({ campagne: coCamp, texte: t })));
                setCoBulk(""); setCoShow(false); toast(`${l.length} ligne(s) importée(s).`);
              }}>Importer les lignes</Button>
            </div>
          )}
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Extraits de site" subtitle="En-tête imposé par Google, 3 à 10 valeurs de 25 caractères." right={<span className="font-mono text-xs text-gray-500">{plan.snippets.length} extrait(s)</span>} />
        <CardBody>
          <div className="grid gap-4 md:grid-cols-2">
            <Select label="Campagne" required options={optionsCampagne(plan, "all")} value={snCamp} onChange={(e) => setSnCamp(e.target.value)} />
            <Select label="En-tête" required options={entetes} value={snHead} onChange={(e) => setSnHead(e.target.value)} />
          </div>
          <div className="mt-4"><Textarea label="Une valeur par ligne" placeholder={"Valeur 1\nValeur 2\nValeur 3"} value={snTxt} onChange={(e) => setSnTxt(e.target.value)} /></div>
          <Button variant="primary" className="mt-3" onClick={() => {
            if (!snCamp) return toast("Choisissez une campagne.");
            const v = lignes(snTxt); if (!v.length) return toast("Saisissez au moins une valeur.");
            update((p) => { p.snippets.push({ campagne: snCamp, entete: snHead, valeurs: v }); }); setSnTxt(""); toast("Extrait ajouté.");
          }}>Ajouter cet extrait</Button>
          {plan.snippets.length > 0 && (
            <div className="mt-4 divide-y divide-gray-200 rounded-control border border-gray-200">
              {plan.snippets.map((s, i) => (
                <div key={i} className="flex items-center gap-3 px-3 py-2 text-sm">
                  <span className="font-medium">{s.entete}</span><span className="flex-1 truncate text-xs text-gray-500">{s.valeurs.join(", ")} · {s.campagne}</span>
                  <button className="rounded-control p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600" onClick={() => update((p) => { p.snippets.splice(i, 1); })}><X className="h-4 w-4" /></button>
                </div>
              ))}
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
