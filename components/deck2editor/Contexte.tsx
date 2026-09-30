"use client";
import { usePlan } from "./PlanContext";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Input, Select, Check } from "@/components/ui/Field";
import AboutBox from "@/components/ui/AboutBox";

/* Etape 1 : contexte du plan et options d'export. */
export default function Contexte() {
  const { plan, update } = usePlan();
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader title="Contexte du plan" subtitle="Ces informations nomment les fichiers, le deck client et la fiche sauvegardée." />
        <CardBody>
          <div className="grid gap-4 md:grid-cols-2">
            <Input label="Client" placeholder="Nom du client" value={plan.options.client || ""} onChange={(e) => update((p) => { p.options.client = e.target.value; })} />
            <Input label="Numéro de demande" placeholder="00000000" value={plan.options.demande || ""} onChange={(e) => update((p) => { p.options.demande = e.target.value; })} />
            <Input label="Site officiel du client" hint="utilisé par l’IA et pour contrôler les URL" placeholder="https://www.exemple.com" value={plan.options.siteOfficiel || ""} onChange={(e) => update((p) => { p.options.siteOfficiel = e.target.value; })} />
            <Select label="Langue des extraits de site" options={[["fr", "Français"], ["en", "Anglais"]]} value={plan.options.langueSnippets || "fr"} onChange={(e) => update((p) => { p.options.langueSnippets = e.target.value as "fr" | "en"; })} />
          </div>
        </CardBody>
      </Card>
      <Card>
        <CardHeader title="Options d’export" />
        <CardBody className="space-y-2">
          <Check label="Générer aussi les fichiers séparés par type (01 à 10)" sub="Le fichier 00 contient toutes les entités et s’importe en une seule opération. Les fichiers séparés servent à relire un type d’entité à la fois." checked={!!plan.options.fichiersSepares} onChange={(v) => update((p) => { p.options.fichiersSepares = v; })} />
          <Check label="Écrire la colonne « Ad type »" sub="Valeur « Responsive search ad » dans le fichier d’annonces. À décocher seulement si votre version d’Editor la signale comme non reconnue." checked={plan.options.inclureAdType !== false} onChange={(v) => update((p) => { p.options.inclureAdType = v; })} />
        </CardBody>
      </Card>
      <AboutBox title="Ce que l’outil couvre, et ce qui reste à faire dans Editor">
        <p className="font-semibold text-gray-900">Campagnes prises en charge</p>
        <ul className="mt-1 list-disc space-y-1 pl-5">
          <li>Search : complet.</li>
          <li>Performance Max : complet pour les textes. Images, logos et vidéos s&apos;ajoutent dans Editor après l&apos;import.</li>
          <li>Demand Gen, Display, Video, Shopping, App : ligne de campagne seulement (budget, dates, localisations, enchères). Le contenu se fait ensuite dans Editor ou l&apos;interface Google Ads.</li>
        </ul>
        <p className="mt-3 font-semibold text-gray-900">Ce qui ne passe jamais par le fichier</p>
        <p className="mt-1">Images, vidéos, audiences, objectifs de conversion, listes de mots-clés négatifs partagées, déclaration UE. Après chaque génération, une checklist indique exactement quoi terminer dans Editor.</p>
      </AboutBox>
    </div>
  );
}
