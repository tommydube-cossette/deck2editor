"use client";
import { useEffect, useState } from "react";
import { usePlan } from "./PlanContext";
import { Card, CardHeader } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { planVide, campagneVide } from "@/lib/deck2editor/plan";
import { exemples } from "@/lib/deck2editor/exemples";
import { useAuth } from "@/lib/auth";
import { listerPlans, chargerPlan, sauvegarderPlan, supprimerPlan, type DeckPlanResume } from "@/lib/deck2editor/firestore";
import { Sparkles, PenLine, Upload, FolderOpen, ArrowRight } from "lucide-react";

/* Page d'arrivee : explique l'outil en trois etapes, propose quatre facons de commencer, liste les plans. */
export default function Accueil() {
  const { ouvrirPlan, setPanneau, setVue, setPlan, setPlanId } = usePlan();
  const { user, configure } = useAuth();
  const toast = useToast();
  const [plans, setPlans] = useState<DeckPlanResume[]>([]);
  const [busy, setBusy] = useState(false);

  const rafraichir = async () => { if (!user || !configure) return; try { setPlans(await listerPlans(user.uid)); } catch (e) { toast("Lecture des plans impossible : " + (e as Error).message); } };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { rafraichir(); }, [user?.uid]);

  const nouveau = () => { const p = planVide(); p.campagnes.push(campagneVide()); ouvrirPlan(p, null, "contexte"); };
  const ouvrir = async (id: string) => { const d = await chargerPlan(id); if (!d) return toast("Plan introuvable."); ouvrirPlan(d.plan, id); };
  const supprimer = async (id: string) => { if (!confirm("Supprimer ce plan ?")) return; await supprimerPlan(id); await rafraichir(); };
  const creerExemples = async () => {
    if (!user) return; setBusy(true);
    try {
      for (const ex of exemples()) await sauvegarderPlan(null, { clientId: "", clientNom: ex.client, demande: ex.demande, titre: ex.titre, ownerUid: user.uid, ownerEmail: user.email || "", statut: "brouillon", plan: ex.plan });
      await rafraichir(); toast("3 plans d’exemple créés dans Firestore.");
    } catch (e) { toast("Création impossible : " + (e as Error).message); }
    setBusy(false);
  };
  const ouvrirAvecPanneau = (p: "ia" | "importer") => { const pl = planVide(); pl.campagnes.push(campagneVide()); setPlan(pl); setPlanId(null); setVue("editeur"); setPanneau(p); };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-gray-900">Deck2Editor</h1>
        <p className="mt-1 max-w-3xl text-sm text-gray-600">Transforme un plan de campagne Google Ads en fichier prêt à importer dans Google Ads Editor. Vous décrivez ou importez le plan, l’outil vérifie chaque règle de Google, et vous obtenez le fichier d’import plus un deck client pour approbation. Rien n’est écrit dans Google Ads : l’import final reste un geste humain dans Editor.</p>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        {[["1", "Décrire ou importer", "Un brief pour l’IA, un deck Excel du client, un export d’un compte existant, ou une saisie à la main."],
          ["2", "Vérifier et corriger", "L’outil applique les règles Google Ads (longueurs, quantités, URL, dates) et pointe chaque correction à faire."],
          ["3", "Générer et présenter", "Fichier CSV pour Google Ads Editor, checklist des réglages à finir dans Editor, deck client PDF, HTML ou Excel."]].map(([n, t, d]) => (
          <div key={n} className="rounded-surface border border-gray-300 bg-white p-4">
            <div className="flex items-center gap-3"><span className="flex h-7 w-7 items-center justify-center rounded-control bg-primary-100 font-mono text-sm font-bold text-primary-700">{n}</span><span className="text-sm font-semibold text-gray-900">{t}</span></div>
            <p className="mt-2 text-sm text-gray-600">{d}</p>
          </div>
        ))}
      </div>

      <div>
        <h2 className="text-[11px] font-semibold uppercase tracking-wide text-gray-600">Commencer</h2>
        <div className="mt-2 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {[
            { Icon: Sparkles, t: "À partir d’un brief (IA)", d: "Décrivez le mandat et donnez le site du client. Gemini propose un plan complet que vous corrigez.", a: () => ouvrirAvecPanneau("ia"), primaire: true },
            { Icon: PenLine, t: "À la main", d: "Saisissez campagnes, groupes, annonces, mots-clés et extensions dans l’éditeur.", a: nouveau },
            { Icon: Upload, t: "À partir d’un fichier", d: "Deck Excel (modèle de l’outil), export Google Ads Editor, ou onglet Excel collé.", a: () => ouvrirAvecPanneau("importer") },
            { Icon: FolderOpen, t: "Reprendre un plan", d: plans.length ? `${plans.length} plan(s) sauvegardé(s) ci-dessous.` : configure ? "Aucun plan sauvegardé pour l’instant." : "Sauvegarde désactivée (Firebase non configuré).", a: () => document.getElementById("plans")?.scrollIntoView({ behavior: "smooth" }) },
          ].map(({ Icon, t, d, a, primaire }) => (
            <button key={t} type="button" onClick={a} className={`group rounded-surface border bg-white p-4 text-left transition-colors hover:border-primary ${primaire ? "border-primary-300" : "border-gray-300"}`}>
              <Icon className={`h-6 w-6 ${primaire ? "text-primary" : "text-gray-400 group-hover:text-primary"}`} />
              <div className="mt-3 flex items-center gap-2 text-sm font-semibold text-gray-900">{t}<ArrowRight className="h-4 w-4 text-gray-300 transition-transform group-hover:translate-x-0.5 group-hover:text-primary" /></div>
              <p className="mt-1 text-sm text-gray-600">{d}</p>
            </button>
          ))}
        </div>
      </div>

      <Card className="scroll-mt-6">
        <div id="plans" />
        <CardHeader title="Vos plans" subtitle={configure ? (user ? `${plans.length} plan(s)` : "Connexion requise") : "Firebase non configuré : voir .env.example"}
          right={user && plans.length === 0 ? <Button size="sm" disabled={busy} onClick={creerExemples}>Créer 3 plans d’exemple</Button> : undefined} />
        {plans.length > 0 ? (
          <table className="min-w-full">
            <thead><tr className="bg-primary text-left text-white">
              <th className="px-4 py-2 text-[11px] font-semibold uppercase tracking-wide">Titre</th>
              <th className="px-4 py-2 text-[11px] font-semibold uppercase tracking-wide">Client</th>
              <th className="px-4 py-2 text-[11px] font-semibold uppercase tracking-wide">Demande</th>
              <th className="px-4 py-2 text-[11px] font-semibold uppercase tracking-wide">Statut</th>
              <th className="px-4 py-2 text-[11px] font-semibold uppercase tracking-wide">Modifié</th>
              <th className="w-44 px-4 py-2" /></tr></thead>
            <tbody className="divide-y divide-gray-200">
              {plans.map((p) => (
                <tr key={p.id} className="transition-colors hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">{p.titre}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{p.clientNom || "—"}</td>
                  <td className="px-4 py-3 font-mono text-sm tabular-nums text-gray-700">{p.demande || "—"}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{p.statut}</td>
                  <td className="px-4 py-3 font-mono text-xs text-gray-500">{new Date(p.updatedAt).toLocaleString("fr-CA")}</td>
                  <td className="px-4 py-3 text-right"><Button size="sm" variant="primary" onClick={() => ouvrir(p.id)}>Ouvrir</Button> <Button size="sm" variant="danger" onClick={() => supprimer(p.id)}>Supprimer</Button></td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="p-6 text-center text-sm text-gray-500">{user ? "Aucun plan. Commencez ci-dessus, ou créez trois plans d’exemple pour voir des données réelles dans Firestore." : "Connectez-vous pour retrouver vos plans."}</div>
        )}
      </Card>
    </div>
  );
}
