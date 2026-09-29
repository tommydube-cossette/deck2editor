import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { normaliserPlan } from "@/lib/deck2editor/plan";

/* Generation d'un plan par Gemini en deux appels :
   1. recherche web (grounding Google Search) en prose, avec sources ;
   2. mise en forme JSON stricte au format Plan, relue ensuite par le moteur de validation.
   Deux appels parce qu'un rapport de bug (juin 2026) signale que le grounding est
   desactive silencieusement quand une sortie JSON est demandee dans le meme appel. */

const MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";

function client(): GoogleGenAI | null {
  if (process.env.GOOGLE_GENAI_USE_VERTEXAI === "true" && process.env.GOOGLE_CLOUD_PROJECT) {
    return new GoogleGenAI({ vertexai: true, project: process.env.GOOGLE_CLOUD_PROJECT, location: process.env.GOOGLE_CLOUD_LOCATION || "us-central1" });
  }
  if (process.env.GEMINI_API_KEY) return new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  return null;
}

const SCHEMA_TEXTE = `
Reponds UNIQUEMENT avec un objet JSON valide, sans texte autour, de cette forme exacte :
{
 "campagnes":[{"nom":"","type":"Search","statut":"Paused","budgetQuotidien":"","strategieEncheres":"Maximize clicks","reseaux":"Google Search","langues":"fr","dateDebut":"","dateFin":"","politiqueUE":"Non","localisations":[{"id":"20123","nom":"Quebec","exclue":false,"modif":""}]}],
 "groupes":[{"campagne":"","nom":"","statut":"Enabled","maxCPC":""}],
 "rsas":[{"campagne":"","groupe":"","titres":[{"texte":"","pin":""}],"descriptions":[{"texte":"","pin":""}],"path1":"","path2":"","urlFinale":""}],
 "motsCles":[{"campagne":"","groupe":"","texte":"","correspondance":"Phrase"}],
 "negatifs":[{"campagne":"","groupe":"","texte":"","correspondance":"Phrase"}],
 "sitelinks":[{"campagne":"","groupe":"","texte":"","desc1":"","desc2":"","urlFinale":""}],
 "callouts":[{"campagne":"","texte":""}],
 "snippets":[{"campagne":"","entete":"","valeurs":[""]}],
 "assetGroups":[]
}
Regles Google Ads a respecter strictement : titres 30 caracteres max, descriptions 90 max, chemins 15 max,
liens annexes 25 max avec descriptions 35 max, accroches 25 max. 8 a 15 titres et 3 a 4 descriptions par annonce.
Pas de point d'exclamation dans les titres. Pas de mot tout en majuscules. Les noms de campagne doivent etre
identiques entre les blocs. Valeurs de plateforme en anglais (Search, Paused, Phrase, Maximize clicks).
Localisations : ID Google numeriques (Canada 2124, Quebec 20123, Montreal 1002604, Quebec City 1002624).
Langue des textes : celle demandee par l'utilisateur.`;

export async function POST(req: Request) {
  const { brief, langue = "fr", rechercheWeb = true } = (await req.json()) as { brief: string; langue?: string; rechercheWeb?: boolean };
  if (!brief || !brief.trim()) return NextResponse.json({ erreur: "Brief vide." }, { status: 400 });
  const ai = client();
  if (!ai) return NextResponse.json({ erreur: "Gemini non configure : ajouter GEMINI_API_KEY (ou Vertex AI) dans .env.local." }, { status: 503 });

  try {
    let notes = "";
    let sources: { titre: string; url: string }[] = [];
    if (rechercheWeb) {
      const r1 = await ai.models.generateContent({
        model: MODEL,
        contents: `Tu es un specialiste SEM. Fais une recherche web sur l'annonceur, ses produits, ses concurrents et le vocabulaire
de recherche des consommateurs au Quebec, puis redige des notes de travail (en ${langue}) pour construire un plan Google Ads Search :
positionnement, offres a mettre de l'avant, familles de mots-cles avec exemples, termes a exclure, pages de destination probables.
Brief : ${brief}`,
        config: { tools: [{ googleSearch: {} }] },
      });
      notes = r1.text || "";
      const chunks = r1.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
      sources = chunks.map((c) => ({ titre: c.web?.title || "", url: c.web?.uri || "" })).filter((s) => s.url);
    }
    const r2 = await ai.models.generateContent({
      model: MODEL,
      contents: `Brief : ${brief}\n\nNotes de recherche :\n${notes || "(aucune recherche web)"}\n\n${SCHEMA_TEXTE}`,
      config: { responseMimeType: "application/json" },
    });
    const texte = (r2.text || "").replace(/```json|```/g, "").trim();
    const brut = JSON.parse(texte);
    const plan = normaliserPlan(brut);
    return NextResponse.json({ plan, notes, sources, modele: MODEL });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ erreur: msg }, { status: 500 });
  }
}
