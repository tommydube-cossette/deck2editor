"use client";
import { useEffect, useState } from "react";
import { usePlan } from "./PlanContext";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Input, Select, Check } from "@/components/ui/Field";
import Button from "@/components/ui/Button";
import AboutBox from "@/components/ui/AboutBox";
import { useToast } from "@/components/ui/Toast";
import { planExemple, planVide, campagneVide } from "@/lib/deck2editor/plan";
import { useAuth } from "@/lib/auth";
import { listerPlans, chargerPlan, sauvegarderPlan, supprimerPlan, titreParDefaut, type DeckPlanResume } from "@/lib/deck2editor/firestore";

export default function Reglages() {
  const { plan, update, setPlan, setOnglet, planId, setPlanId } = usePlan();
  const { user, configure } = useAuth();
  const toast = useToast();
  const [plans, setPlans] = useState<DeckPlanResume[]>([]);
  const [busy, setBusy] = useState(false);

  const rafraichir = async () => {
    if (!user || !configure) return;
    try { setPlans(await listerPlans(user.uid)); }
    catch (e) { toast("Lecture des plans impossible : " + (e as Error).message); }
  };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { rafraichir(); }, [user?.uid]);

  const sauvegarder = async () => {
    if (!user) return toast("Connexion requise pour sauvegarder.");
    setBusy(true);
    try {
      const id = await sauvegarderPlan(planId, {
        clientId: "", clientNom: plan.options.client || "", demande: plan.options.demande || "",
        titre: titreParDefaut(plan), ownerUid: user.uid, ownerEmail: user.email || "", statut: "brouillon", plan,
      });
      setPlanId(id); toast("Plan sauvegardé."); await rafraichir();
    } catch (e) { toast("Sauvegarde impossible : " + (e as Error).message); }
    setBusy(false);
  };
  const ouvrir = async (id: string) => {
    const d = await chargerPlan(id); if (!d) return toast("Plan introuvable.");
    setPlan(d.plan); setPlanId(id); toast("Plan chargé."); setOnglet("campagnes");
  };
  const supprimer = async (id: string) => {
    if (!confirm("Supprimer ce plan ?")) return;
    await supprimerPlan(id); if (planId === id) setPlanId(null); await rafraichir();
  };

  return (
    <div className="space-y-6">
      <AboutBox title="À quoi sert cet outil" defaultOpen>
        <p>Vous montez votre plan ici (campagnes, groupes, annonces, mots-clés, extensions), vous cliquez « Valider et générer », et vous obtenez un fichier CSV prêt à importer dans Google Ads Editor. Aucune écriture directe dans Google Ads.</p>
        <p className="mt-3 font-semibold text-gray-900">Campagnes prises en charge</p>
        <ul className="mt-1 list-disc space-y-1 pl-5">
          <li>Search : complet.</li>
          <li>Performance Max : complet pour les textes. Images, logos et vidéos s&apos;ajoutent dans Editor après l&apos;import.</li>
          <li>Demand Gen, Display, Video, Shopping, App : l&apos;outil crée seulement la campagne avec ses réglages (budget, dates, localisations, enchères). Le contenu de ces campagnes se fait ensuite dans Editor ou l&apos;interface Google Ads.</li>
        </ul>
        <p className="mt-3 font-semibold text-gray-900">Ce qui ne passe jamais par le fichier</p>
        <p className="mt-1">Images, vidéos, audiences, objectifs de conversion, listes de mots-clés négatifs partagées, déclaration UE. Après chaque génération, une checklist vous indique exactement quoi terminer dans Editor.</p>
      </AboutBox>

      <Card>
        <CardHeader title="Contexte du plan" />
        <CardBody>
          <div className="grid gap-4 md:grid-cols-3">
            <Input label="Client" placeholder="Nom du client" value={plan.options.client || ""} onChange={(e) => update((p) => { p.options.client = e.target.value; })} />
            <Input label="Numéro de demande" placeholder="00000000" value={plan.options.demande || ""} onChange={(e) => update((p) => { p.options.demande = e.target.value; })} />
            <Select label="Langue des extraits de site" options={[["fr", "Français"], ["en", "Anglais"]]} value={plan.options.langueSnippets || "fr"} onChange={(e) => update((p) => { p.options.langueSnippets = e.target.value as "fr" | "en"; })} />
          </div>
          <div className="mt-4 space-y-2">
            <Check label="Générer aussi les fichiers séparés par type (01 à 10)" sub="Le fichier 00 contient toutes les entités et s’importe en une seule opération. Les fichiers séparés servent à relire un type d’entité à la fois." checked={!!plan.options.fichiersSepares} onChange={(v) => update((p) => { p.options.fichiersSepares = v; })} />
            <Check label="Écrire la colonne « Ad type »" sub="Valeur « Responsive search ad » dans le fichier d’annonces. À décocher seulement si votre version d’Editor la signale comme non reconnue." checked={plan.options.inclureAdType !== false} onChange={(v) => update((p) => { p.options.inclureAdType = v; })} />
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Point de départ" />
        <CardBody>
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => { setPlan(planExemple()); setPlanId(null); toast("Exemple chargé."); setOnglet("campagnes"); }}>Charger un exemple complet</Button>
            <Button onClick={() => { if (confirm("Effacer tout le plan ?")) { const p = planVide(); p.campagnes.push(campagneVide()); setPlan(p); setPlanId(null); } }}>Repartir de zéro</Button>
            <Button variant="primary" onClick={() => setOnglet("ia")}>Générer un brouillon avec l’IA</Button>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Plans sauvegardés" subtitle={configure ? (user ? `Vos plans (${plans.length})` : "Connexion requise") : "Firebase non configuré : sauvegarde désactivée (voir .env.example)"}
          right={<Button variant="primary" size="sm" disabled={!user || busy} onClick={sauvegarder}>{planId ? "Sauvegarder" : "Sauvegarder comme nouveau plan"}</Button>} />
        {plans.length > 0 && (
          <table className="min-w-full">
            <thead><tr className="bg-primary text-left text-white">
              <th className="px-4 py-2 text-[11px] font-semibold uppercase tracking-wide">Titre</th>
              <th className="px-4 py-2 text-[11px] font-semibold uppercase tracking-wide">Demande</th>
              <th className="px-4 py-2 text-[11px] font-semibold uppercase tracking-wide">Statut</th>
              <th className="px-4 py-2 text-[11px] font-semibold uppercase tracking-wide">Modifié</th>
              <th className="w-40 px-4 py-2" /></tr></thead>
            <tbody className="divide-y divide-gray-200">
              {plans.map((p) => (
                <tr key={p.id} className={`transition-colors hover:bg-gray-50 ${p.id === planId ? "bg-primary-50" : ""}`}>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">{p.titre}</td>
                  <td className="px-4 py-3 font-mono text-sm text-gray-700">{p.demande || "—"}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{p.statut}</td>
                  <td className="px-4 py-3 font-mono text-xs text-gray-500">{new Date(p.updatedAt).toLocaleString("fr-CA")}</td>
                  <td className="px-4 py-3 text-right"><Button size="sm" onClick={() => ouvrir(p.id)}>Ouvrir</Button> <Button size="sm" variant="danger" onClick={() => supprimer(p.id)}>Supprimer</Button></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}
