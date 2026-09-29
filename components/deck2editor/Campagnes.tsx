"use client";
import { useMemo, useState } from "react";
import { usePlan } from "./PlanContext";
import { Card, CardBody, CardHeader, SectionTitle } from "@/components/ui/Card";
import { Input, Select, Check, Chips, Label } from "@/components/ui/Field";
import Button from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { campagneVide, groupeVide, rsaVide } from "@/lib/deck2editor/plan";
import geoData from "@/data/geo-ca-qc.json";
import type { Campagne, GeoItem } from "@/lib/deck2editor/types";
import { X } from "lucide-react";

const GEO = geoData as GeoItem[];
const GEO_TYPES: Record<string, string> = { Country: "Pays", Province: "Province", Territory: "Territoire", City: "Ville", Municipality: "Municipalité", County: "MRC", Neighborhood: "Quartier", Borough: "Arrondissement", "Colloquial Area": "Zone" };
const GEO_ORDRE = ["Country", "Province", "Territory", "City", "Municipality", "County", "Borough", "Colloquial Area", "Neighborhood"];
const JOURS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const geoNorm = (t: string) => t.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/^st-/, "saint-").replace(/^ste-/, "sainte-");

function calParse(s: string) {
  const out: { j: string; de: string; a: string }[] = [];
  (s || "").split(";").forEach((px) => { const m = px.match(/\((\w+)(?:@\d+%)?\[(\d{2}:\d{2})-(\d{2}:\d{2})\]\)/); if (m && JOURS.includes(m[1])) out.push({ j: m[1], de: m[2], a: m[3] }); });
  return out;
}
const calSer = (a: { j: string; de: string; a: string }[]) => a.map((x) => `(${x.j}[${x.de}-${x.a}])`).join(";");

export default function Campagnes() {
  const { plan, update, ref } = usePlan();
  const toast = useToast();

  const renommer = (i: number, v: string) => update((p) => {
    const old = p.campagnes[i].nom; p.campagnes[i].nom = v;
    if (old && old !== v) {
      p.groupes.forEach((g) => { if (g.campagne === old) g.campagne = v; });
      p.rsas.forEach((r) => { if (r.campagne === old) r.campagne = v; });
      (["motsCles", "negatifs", "sitelinks", "callouts", "snippets", "assetGroups"] as const).forEach((k) => (p[k] as { campagne: string }[]).forEach((x) => { if (x.campagne === old) x.campagne = v; }));
    }
  });
  const supprimer = (i: number) => {
    const nom = plan.campagnes[i].nom;
    const dep = nom ? plan.groupes.filter((g) => g.campagne === nom).length + [plan.motsCles, plan.negatifs, plan.sitelinks, plan.callouts, plan.snippets, plan.assetGroups].reduce((n, a) => n + a.filter((x) => x.campagne === nom).length, 0) : 0;
    if (dep && !confirm(`Supprimer cette campagne ? ${dep} élément(s) lié(s) seront aussi supprimés.`)) return;
    update((p) => {
      if (nom) {
        for (let g = p.groupes.length - 1; g >= 0; g--) if (p.groupes[g].campagne === nom) { p.groupes.splice(g, 1); p.rsas.splice(g, 1); }
        (["motsCles", "negatifs", "sitelinks", "callouts", "snippets", "assetGroups"] as const).forEach((k) => { (p[k] as { campagne: string }[]).splice(0, p[k].length, ...(p[k] as { campagne: string }[]).filter((x) => x.campagne !== nom) as never[]); });
      }
      p.campagnes.splice(i, 1);
    });
  };

  return (
    <div className="space-y-6">
      {plan.campagnes.length === 0 && <div className="rounded-surface border border-dashed border-gray-300 bg-white p-8 text-center text-sm text-gray-500">Aucune campagne. Ajoutez-en une pour commencer.</div>}
      {plan.campagnes.map((c, i) => (
        <CampagneCard key={i} c={c} i={i} onRenommer={renommer} onSupprimer={supprimer} strategies={ref.strategies} types={ref.typesCampagne} />
      ))}
      <Button className="w-full border-dashed" onClick={() => update((p) => { p.campagnes.push(campagneVide()); })}>+ Ajouter une campagne</Button>
      {plan.campagnes.some((c) => c.nom && c.type === "Search") && plan.groupes.length === 0 && (
        <p className="text-xs text-gray-500">Astuce : <button className="text-primary-700 underline" onClick={() => { update((p) => { const c0 = p.campagnes.find((x) => x.nom && x.type === "Search")!; const g = groupeVide(); g.campagne = c0.nom; const r = rsaVide(); r.campagne = c0.nom; p.groupes.push(g); p.rsas.push(r); }); toast("Groupe ajouté dans Groupes et annonces."); }}>créer le premier groupe d’annonces</button>.</p>
      )}
    </div>
  );
}

function CampagneCard({ c, i, onRenommer, onSupprimer, strategies, types }: { c: Campagne; i: number; onRenommer: (i: number, v: string) => void; onSupprimer: (i: number) => void; strategies: string[]; types: string[] }) {
  const { update } = usePlan();
  const toast = useToast();
  const set = (k: keyof Campagne, v: string) => update((p) => { (p.campagnes[i] as unknown as Record<string, string>)[k as string] = v; });
  const setAi = (k: keyof Campagne["aiMax"], v: boolean | string) => update((p) => { (p.campagnes[i].aiMax as unknown as Record<string, boolean | string>)[k as string] = v; });
  const [geoQ, setGeoQ] = useState("");
  const geoRes = useMemo(() => {
    const n = geoNorm(geoQ.trim()); if (n.length < 2) return [];
    return GEO.filter((g) => geoNorm(g.nom).includes(n)).sort((a, b) => {
      const pa = geoNorm(a.nom).startsWith(n) ? 0 : 1, pb = geoNorm(b.nom).startsWith(n) ? 0 : 1;
      if (pa !== pb) return pa - pb;
      const ta = GEO_ORDRE.indexOf(a.type), tb = GEO_ORDRE.indexOf(b.type);
      return ta !== tb ? ta - tb : a.nom.localeCompare(b.nom);
    }).slice(0, 40);
  }, [geoQ]);
  const geoAdd = (id: string, nom: string) => update((p) => {
    const L = p.campagnes[i].localisations;
    if (L.some((l) => l.id === id)) { toast("Déjà dans la liste."); return; }
    const vide = L.findIndex((l) => !l.id && !l.nom);
    if (vide > -1) { L[vide].id = id; L[vide].nom = nom; } else L.push({ id, nom, exclue: false, modif: "" });
  });
  const nets = (c.reseaux || "").split(";").filter(Boolean);
  const setNet = (nom: string, on: boolean) => update((p) => {
    const sel = (p.campagnes[i].reseaux || "").split(";").filter(Boolean).filter((x) => x !== nom);
    if (on) sel.push(nom);
    p.campagnes[i].reseaux = ["Google Search", "Search Partners", "Display"].filter((n) => sel.includes(n)).join(";");
  });
  const cal = calParse(c.calendrier);
  const setCal = (segs: typeof cal) => set("calendrier", calSer(segs));

  return (
    <Card>
      <CardHeader title={c.nom || `Campagne ${i + 1}`} subtitle={`${c.type}${c.budgetQuotidien ? " · " + c.budgetQuotidien : ""}`} right={<Button size="sm" variant="danger" onClick={() => onSupprimer(i)}>Supprimer</Button>} />
      <CardBody>
        <div className="grid gap-4 md:grid-cols-2">
          <Input label="Nom de la campagne" required placeholder="Client | Offre | Search | FR" value={c.nom} onChange={(e) => onRenommer(i, e.target.value)} />
          <Chips label="Type" required options={types} value={c.type} onChange={(v) => set("type", v)} />
        </div>

        <SectionTitle>Budget et enchères</SectionTitle>
        <div className="grid gap-4 md:grid-cols-4">
          <Input label="Budget quotidien" required placeholder="0,00 $" value={c.budgetQuotidien} onChange={(e) => set("budgetQuotidien", e.target.value)} />
          <Select label="Statut" options={["Paused", "Enabled"]} value={c.statut} onChange={(e) => set("statut", e.target.value)} />
          <Select label="Stratégie" required options={[["", ""], ...strategies.map((s) => [s, s] as [string, string])]} value={c.strategieEncheres} onChange={(e) => set("strategieEncheres", e.target.value)} />
          <Input label="Portefeuille" hint="si applicable" value={c.strategiePortefeuille} onChange={(e) => set("strategiePortefeuille", e.target.value)} />
          <Input label="CPA cible" value={c.targetCpa} onChange={(e) => set("targetCpa", e.target.value)} />
          <Input label="ROAS cible (%)" value={c.targetRoas} onChange={(e) => set("targetRoas", e.target.value)} />
          <Input label="Plafond CPC" value={c.plafondCPC} onChange={(e) => set("plafondCPC", e.target.value)} />
          <Select label="Rotation" options={["", "Optimize", "Rotate forever"]} value={c.rotation} onChange={(e) => set("rotation", e.target.value)} />
          <Select label="Part d’impression" options={["", "Anywhere on results page", "Top of results page", "Absolute Top of results page"]} value={c.partImpressionEmplacement} onChange={(e) => set("partImpressionEmplacement", e.target.value)} />
          <Input label="Cible (%)" value={c.partImpressionPct} onChange={(e) => set("partImpressionPct", e.target.value)} />
        </div>

        <SectionTitle>Diffusion et ciblage</SectionTitle>
        <Label>Réseaux</Label>
        <div className="grid gap-2 md:grid-cols-3">
          {["Google Search", "Search Partners", "Display"].map((n) => <Check key={n} label={n} checked={nets.includes(n)} onChange={(v) => setNet(n, v)} />)}
        </div>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <Input label="Langues" hint="codes, séparés par ;" placeholder="fr" value={c.langues} onChange={(e) => set("langues", e.target.value)} />
          <Input type="date" label="Date de début" value={c.dateDebut} onChange={(e) => set("dateDebut", e.target.value)} />
          <Input type="date" label="Date de fin" value={c.dateFin} onChange={(e) => set("dateFin", e.target.value)} />
          <Input label="Modif. mobile (%)" value={c.modifMobile} onChange={(e) => set("modifMobile", e.target.value)} />
          <Input label="Modif. ordinateur (%)" value={c.modifOrdinateur} onChange={(e) => set("modifOrdinateur", e.target.value)} />
          <Input label="Modif. tablette (%)" value={c.modifTablette} onChange={(e) => set("modifTablette", e.target.value)} />
        </div>

        <div className="mt-4">
          <Label hint="vide = en continu">Calendrier de diffusion</Label>
          {cal.map((s, j) => (
            <div key={j} className="mb-2 flex flex-wrap items-center gap-2">
              <select className="rounded-control border border-gray-300 px-2 py-1.5 text-sm" value={s.j} onChange={(e) => { const n = [...cal]; n[j] = { ...s, j: e.target.value }; setCal(n); }}>{JOURS.map((d) => <option key={d}>{d}</option>)}</select>
              <input type="time" className="rounded-control border border-gray-300 px-2 py-1.5 text-sm" value={s.de} onChange={(e) => { const n = [...cal]; n[j] = { ...s, de: e.target.value }; setCal(n); }} />
              <span className="text-xs text-gray-500">à</span>
              <input type="time" className="rounded-control border border-gray-300 px-2 py-1.5 text-sm" value={s.a} onChange={(e) => { const n = [...cal]; n[j] = { ...s, a: e.target.value }; setCal(n); }} />
              <button className="rounded-control p-1 text-gray-400 hover:bg-red-50 hover:text-red-600" onClick={() => setCal(cal.filter((_, k) => k !== j))}><X className="h-4 w-4" /></button>
            </div>
          ))}
          <Button size="sm" onClick={() => setCal([...cal, { j: "Monday", de: "08:00", a: "17:00" }])}>+ Plage horaire</Button>
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <Select label="Déclaration « annonces politiques UE »" required hint="obligatoire" options={[["", "— à trancher —"], ["Non", "Non"], ["Oui", "Oui"]]} value={c.politiqueUE} onChange={(e) => set("politiqueUE", e.target.value)} />
          <Input label="Étiquettes" value={c.etiquettes} onChange={(e) => set("etiquettes", e.target.value)} />
          <Input label="Commentaire" value={c.commentaire} onChange={(e) => set("commentaire", e.target.value)} />
        </div>

        <SectionTitle meta="ID numérique recommandé">Localisations</SectionTitle>
        <div className="mb-2 flex flex-wrap gap-2">
          <button type="button" onClick={() => geoAdd("2124", "Canada")} className="rounded-full bg-primary px-3 py-1 text-xs font-semibold text-white hover:bg-primary-700">Canada</button>
          <button type="button" onClick={() => geoAdd("20123", "Quebec")} className="rounded-full bg-primary px-3 py-1 text-xs font-semibold text-white hover:bg-primary-700">Québec (province)</button>
        </div>
        <Input placeholder="Rechercher une ville, municipalité, MRC ou quartier du Québec, ou une province" value={geoQ} onChange={(e) => setGeoQ(e.target.value)} />
        {geoQ.trim().length >= 2 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {geoRes.length === 0 && <span className="text-xs text-gray-500">Aucun résultat</span>}
            {geoRes.map((g) => (
              <button key={g.id} type="button" onClick={() => { geoAdd(g.id, g.nom); setGeoQ(""); }} className="rounded-full border border-gray-300 bg-white px-2.5 py-1 text-xs hover:border-primary hover:bg-primary-50">
                {g.nom}<span className="ml-1.5 text-gray-400">{GEO_TYPES[g.type] || g.type}{g.parent && g.parent !== "Quebec" && g.parent !== "Canada" ? " · " + g.parent : ""} · {g.id}</span>
              </button>
            ))}
          </div>
        )}
        <div className="mt-3 space-y-2">
          {c.localisations.map((l, j) => (
            <div key={j} className="grid grid-cols-[1fr_1fr_100px_auto_auto] items-center gap-2">
              <Input placeholder="ID numérique Google" value={l.id} onChange={(e) => update((p) => { p.campagnes[i].localisations[j].id = e.target.value; })} />
              <Input placeholder="Nom (facultatif)" value={l.nom} onChange={(e) => update((p) => { p.campagnes[i].localisations[j].nom = e.target.value; })} />
              <Input placeholder="Modif. %" value={l.modif} onChange={(e) => update((p) => { p.campagnes[i].localisations[j].modif = e.target.value; })} />
              <Check label="Exclure" checked={l.exclue} onChange={(v) => update((p) => { p.campagnes[i].localisations[j].exclue = v; })} />
              <button className="rounded-control p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600" onClick={() => update((p) => { p.campagnes[i].localisations.splice(j, 1); })}><X className="h-4 w-4" /></button>
            </div>
          ))}
        </div>
        <Button size="sm" className="mt-2" onClick={() => update((p) => { p.campagnes[i].localisations.push({ id: "", nom: "", exclue: false, modif: "" }); })}>+ Localisation</Button>

        <SectionTitle>Suivi</SectionTitle>
        <div className="grid gap-4 md:grid-cols-2">
          <Input label="Modèle de suivi" placeholder="{lpurl}?utm_source=google" value={c.trackingTemplate} onChange={(e) => set("trackingTemplate", e.target.value)} />
          <Input label="Suffixe d’URL finale" value={c.suffixeURL} onChange={(e) => set("suffixeURL", e.target.value)} />
        </div>

        <SectionTitle meta="reporté dans la checklist">AI Max</SectionTitle>
        <div className="grid gap-2 md:grid-cols-2">
          <Check label="Activer AI Max" checked={c.aiMax.actif} onChange={(v) => setAi("actif", v)} />
          <Check label="Search term matching" checked={c.aiMax.searchTermMatching} onChange={(v) => setAi("searchTermMatching", v)} />
          <Check label="Text customization" checked={c.aiMax.textCustomization} onChange={(v) => setAi("textCustomization", v)} />
          <Check label="Final URL expansion" checked={c.aiMax.finalUrlExpansion} onChange={(v) => setAi("finalUrlExpansion", v)} />
        </div>
        <div className="mt-3 grid gap-4 md:grid-cols-2">
          <Input label="Exclusions de marque" value={c.aiMax.exclusionsMarque} onChange={(e) => setAi("exclusionsMarque", e.target.value)} />
          <Input label="URL exclues de l’expansion" value={c.aiMax.urlsExclues} onChange={(e) => setAi("urlsExclues", e.target.value)} />
        </div>
      </CardBody>
    </Card>
  );
}
