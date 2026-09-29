import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { normaliserPlan } from "@/lib/deck2editor/plan";
import { domaineDe, urlSite, corrigerUrls, promptRecherche, promptJson, extraireJson, type ParamsIA } from "@/lib/deck2editor/ai";

/* Generation d'un plan par Gemini en deux appels :
   1. lecture du site officiel (URL context) + recherche web (grounding Google Search) en prose, avec sources ;
   2. mise en forme JSON stricte au format Plan, relue ensuite par le moteur de validation.
   Deux appels parce qu'un rapport de bug (juin 2026) signale que le grounding est desactive
   silencieusement quand une sortie JSON est demandee dans le meme appel.
   Apres coup, toute URL finale hors du site officiel est remplacee par la page d'accueil et signalee. */

const MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";

function client(): GoogleGenAI | null {
  if (process.env.GOOGLE_GENAI_USE_VERTEXAI === "true" && process.env.GOOGLE_CLOUD_PROJECT) {
    return new GoogleGenAI({ vertexai: true, project: process.env.GOOGLE_CLOUD_PROJECT, location: process.env.GOOGLE_CLOUD_LOCATION || "us-central1" });
  }
  if (process.env.GEMINI_API_KEY) return new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  return null;
}

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as Partial<ParamsIA>;
  const p: ParamsIA = { brief: (body.brief || "").trim(), siteOfficiel: (body.siteOfficiel || "").trim(), langue: body.langue === "en" ? "en" : "fr", rechercheWeb: body.rechercheWeb !== false };
  if (!p.brief) return NextResponse.json({ erreur: "Brief vide." }, { status: 400 });
  if (!domaineDe(p.siteOfficiel)) return NextResponse.json({ erreur: "Site officiel invalide. Exemple : https://www.sepaq.com" }, { status: 400 });
  const ai = client();
  if (!ai) return NextResponse.json({ erreur: "Gemini non configuré : ajouter GEMINI_API_KEY (ou Vertex AI) dans .env.local." }, { status: 503 });

  try {
    const tools: Record<string, object>[] = [{ urlContext: {} }];
    if (p.rechercheWeb) tools.push({ googleSearch: {} });
    const r1 = await ai.models.generateContent({ model: MODEL, contents: `${promptRecherche(p)}\n\nPages a lire en priorite : ${urlSite(p.siteOfficiel)}`, config: { tools } });
    const notes = r1.text || "";
    const chunks = r1.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    const sources = chunks.map((c) => ({ titre: c.web?.title || "", url: c.web?.uri || "" })).filter((s) => s.url);

    const r2 = await ai.models.generateContent({ model: MODEL, contents: promptJson(p, notes), config: { responseMimeType: "application/json", temperature: 0.4 } });
    const plan = normaliserPlan(extraireJson(r2.text || ""));
    plan.options = { ...plan.options, siteOfficiel: urlSite(p.siteOfficiel) };
    const corrections = corrigerUrls(plan, p.siteOfficiel);
    return NextResponse.json({ plan, notes, sources, corrections, modele: MODEL });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ erreur: msg }, { status: 500 });
  }
}
