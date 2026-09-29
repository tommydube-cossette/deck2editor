import { NextResponse } from "next/server";
import GAE from "@/lib/deck2editor/gae";
import type { Plan } from "@/lib/deck2editor/types";

/* Validation + generation des fichiers Editor. Le moteur est pur JS et tourne aussi
   cote client ; la route sert si on veut garder la logique sur le serveur. */
export async function POST(req: Request) {
  const plan = (await req.json()) as Plan;
  plan.options = plan.options || {};
  if (!plan.options.aujourdhui) plan.options.aujourdhui = new Date().toISOString().slice(0, 10);
  return NextResponse.json(GAE.generer(plan));
}
