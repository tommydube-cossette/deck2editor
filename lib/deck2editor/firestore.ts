import { collection, doc, getDoc, getDocs, orderBy, query, setDoc, where, deleteDoc } from "firebase/firestore";
import { fbDb } from "@/lib/firebase";
import type { DeckPlanDoc, Plan } from "./types";

const COL = "deckPlans";

export interface DeckPlanResume { id: string; titre: string; clientNom: string; demande: string; statut: string; updatedAt: number; }

export async function listerPlans(ownerUid: string): Promise<DeckPlanResume[]> {
  const q = query(collection(fbDb(), COL), where("ownerUid", "==", ownerUid), orderBy("updatedAt", "desc"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => {
    const x = d.data() as DeckPlanDoc;
    return { id: d.id, titre: x.titre, clientNom: x.clientNom, demande: x.demande, statut: x.statut, updatedAt: x.updatedAt };
  });
}

export async function chargerPlan(id: string): Promise<DeckPlanDoc | null> {
  const s = await getDoc(doc(fbDb(), COL, id));
  return s.exists() ? (s.data() as DeckPlanDoc) : null;
}

export async function sauvegarderPlan(id: string | null, data: Omit<DeckPlanDoc, "createdAt" | "updatedAt"> & { createdAt?: number }): Promise<string> {
  const ref = id ? doc(fbDb(), COL, id) : doc(collection(fbDb(), COL));
  const now = Date.now();
  await setDoc(ref, { ...data, createdAt: data.createdAt ?? now, updatedAt: now }, { merge: true });
  return ref.id;
}

export async function supprimerPlan(id: string) { await deleteDoc(doc(fbDb(), COL, id)); }

export function titreParDefaut(plan: Plan): string {
  const c = plan.campagnes.find((x) => x.nom)?.nom;
  return plan.options.client ? `${plan.options.client}${plan.options.demande ? " · " + plan.options.demande : ""}` : (c || "Plan sans titre");
}
