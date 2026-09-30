"use client";
import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import type { Plan, Resultat, References } from "@/lib/deck2editor/types";
import { planVide, campagneVide } from "@/lib/deck2editor/plan";
import { references } from "@/lib/deck2editor/references";
import GAE from "@/lib/deck2editor/gae";

export type Onglet = "contexte" | "campagnes" | "groupes" | "motscles" | "extensions" | "pmax" | "generation";
export type Vue = "accueil" | "editeur";
export type Panneau = null | "ia" | "importer";

interface State {
  plan: Plan;
  setPlan: (p: Plan) => void;
  update: (fn: (p: Plan) => void) => void;
  ref: References;
  resultat: Resultat | null;
  generer: () => Resultat;
  onglet: Onglet;
  setOnglet: (o: Onglet) => void;
  vue: Vue;
  setVue: (v: Vue) => void;
  panneau: Panneau;
  setPanneau: (p: Panneau) => void;
  planId: string | null;
  setPlanId: (id: string | null) => void;
  /* Ouvre l'editeur sur un plan donne (ou vide) */
  ouvrirPlan: (p: Plan, id: string | null, onglet?: Onglet) => void;
}
const Ctx = createContext<State | null>(null);

export function PlanProvider({ children }: { children: ReactNode }) {
  const [plan, setPlanState] = useState<Plan>(() => { const p = planVide(); p.campagnes.push(campagneVide()); return p; });
  const [resultat, setResultat] = useState<Resultat | null>(null);
  const [onglet, setOnglet] = useState<Onglet>("contexte");
  const [vue, setVue] = useState<Vue>("accueil");
  const [panneau, setPanneau] = useState<Panneau>(null);
  const [planId, setPlanId] = useState<string | null>(null);
  const ref = useMemo(() => references(), []);

  const setPlan = useCallback((p: Plan) => { setPlanState(p); setResultat(null); }, []);
  const update = useCallback((fn: (p: Plan) => void) => {
    setPlanState((prev) => { const next = structuredClone(prev); fn(next); return next; });
  }, []);
  const generer = useCallback((): Resultat => {
    const copie = structuredClone(plan);
    copie.options = { ...copie.options, aujourdhui: new Date().toISOString().slice(0, 10) };
    const r = GAE.generer(copie) as Resultat;
    setResultat(r);
    return r;
  }, [plan]);

  const ouvrirPlan = useCallback((p: Plan, id: string | null, o: Onglet = "campagnes") => { setPlanState(p); setResultat(null); setPlanId(id); setOnglet(o); setPanneau(null); setVue("editeur"); }, []);

  return <Ctx.Provider value={{ plan, setPlan, update, ref, resultat, generer, onglet, setOnglet, vue, setVue, panneau, setPanneau, planId, setPlanId, ouvrirPlan }}>{children}</Ctx.Provider>;
}
export function usePlan() {
  const c = useContext(Ctx);
  if (!c) throw new Error("usePlan hors PlanProvider");
  return c;
}

/* Options de campagne pour les selecteurs, avec grisage explicite comme dans la version Apps Script. */
export function optionsCampagne(plan: Plan, mode: "std" | "all" | "pmax"): [string, string, boolean?][] {
  const out: [string, string, boolean?][] = [["", "— choisir —"]];
  if (mode === "all") out.push(["<Account-level>", "Niveau compte"]);
  plan.campagnes.forEach((c) => {
    if (!c.nom) return;
    const ok = mode === "all" || (mode === "std" && c.type !== "Performance Max") || (mode === "pmax" && c.type === "Performance Max");
    const lib = ok ? c.nom : `${c.nom} — ${c.type} : ${mode === "pmax" ? "groupes d’assets réservés aux campagnes Performance Max" : "pas de groupes d’annonces ni de mots-clés en Performance Max"}`;
    out.push([c.nom, lib, !ok]);
  });
  return out;
}
export function optionsGroupe(plan: Plan, campagne: string, niveauCampagne: boolean): [string, string][] {
  const out: [string, string][] = [["", niveauCampagne ? "Niveau campagne" : "— choisir —"]];
  plan.groupes.forEach((g) => { if (g.nom && (!campagne || g.campagne === campagne)) out.push([g.nom, g.nom]); });
  return out;
}
