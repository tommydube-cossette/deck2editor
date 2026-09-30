import { describe, it, expect, vi, beforeEach } from "vitest";
import { domaineDe, urlSite, urlSurDomaine, corrigerUrls, promptJson, promptRecherche, extraireJson } from "@/lib/deck2editor/ai";
import { normaliserPlan } from "@/lib/deck2editor/plan";
import GAE from "@/lib/deck2editor/gae";

describe("controle du domaine", () => {
  it("normalise le site officiel", () => {
    expect(domaineDe("exemple-parcs.com")).toBe("exemple-parcs.com");
    expect(domaineDe("https://www.exemple-parcs.com/camping/")).toBe("exemple-parcs.com");
    expect(domaineDe("WWW.Exemple-Parcs.COM")).toBe("exemple-parcs.com");
    expect(domaineDe("")).toBeNull();
    expect(domaineDe("pas un site")).toBeNull();
    expect(urlSite("exemple-parcs.com")).toBe("https://exemple-parcs.com");
  });
  it("accepte sous-domaines, refuse les autres domaines", () => {
    expect(urlSurDomaine("https://www.exemple-parcs.com/x", "exemple-parcs.com")).toBe(true);
    expect(urlSurDomaine("https://boutique.exemple-parcs.com/x", "exemple-parcs.com")).toBe(true);
    expect(urlSurDomaine("https://exemple-parcs.com.evil.io/x", "exemple-parcs.com")).toBe(false);
    expect(urlSurDomaine("https://google.com", "exemple-parcs.com")).toBe(false);
  });
  it("remplace les URL hors domaine et le signale", () => {
    const plan = normaliserPlan({ rsas: [{ campagne: "C", groupe: "G", urlFinale: "https://www.google.com/" }], groupes: [{ campagne: "C", nom: "G" }],
      sitelinks: [{ campagne: "C", texte: "Ok", urlFinale: "https://www.exemple-parcs.com/camping" }, { campagne: "C", texte: "Mauvais", urlFinale: "https://autre.ca" }] });
    const corr = corrigerUrls(plan, "https://www.exemple-parcs.com");
    expect(corr.length).toBe(2);
    expect(plan.rsas[0].urlFinale).toBe("https://www.exemple-parcs.com/");
    expect(plan.sitelinks[0].urlFinale).toBe("https://www.exemple-parcs.com/camping");
    expect(plan.sitelinks[1].urlFinale).toBe("https://www.exemple-parcs.com/");
  });
});

describe("prompts", () => {
  const p = { brief: "Camping automne", siteOfficiel: "https://www.exemple-parcs.com", langue: "fr" as const, rechercheWeb: true };
  it("le prompt de recherche impose le site officiel comme seule source", () => {
    const t = promptRecherche(p);
    expect(t).toContain("exemple-parcs.com");
    expect(t).toContain("UNIQUEMENT");
    expect(t).toContain("N'invente aucune offre");
  });
  it("le prompt JSON contient le format, le domaine et les limites", () => {
    const t = promptJson(p, "notes");
    expect(t).toContain('"campagnes":[');
    expect(t).toContain("domaine exemple-parcs.com");
    expect(t).toContain("30 caracteres maximum");
    expect(t).toContain("Search | FR");
  });
  it("extraireJson tolere les balises et le texte autour", () => {
    expect(extraireJson('```json\n{"a":1}\n```')).toEqual({ a: 1 });
    expect(extraireJson('Voici :\n{"a":[1,2]} merci')).toEqual({ a: [1, 2] });
    expect(() => extraireJson("rien")).toThrow();
  });
});

// vi.mock est hisse : les reponses simulees passent par vi.hoisted.
const etat = vi.hoisted(() => ({ reponses: [] as string[] }));
vi.mock("@google/genai", () => ({
  GoogleGenAI: class { models = { generateContent: async () => ({ text: etat.reponses.shift() || "", candidates: [{ groundingMetadata: { groundingChunks: [{ web: { title: "Src", uri: "https://ex.com" } }] } }] }) }; },
}));

describe("route /api/deck2editor/ai (Gemini simule)", () => {
  beforeEach(() => { etat.reponses.length = 0; });

  it("refuse un site officiel absent ou invalide", async () => {
    process.env.GEMINI_API_KEY = "test";
    const { POST } = await import("@/app/api/deck2editor/ai/route");
    const r = await POST(new Request("http://x", { method: "POST", body: JSON.stringify({ brief: "b", siteOfficiel: "" }) }));
    expect(r.status).toBe(400);
  });

  it("produit un plan valide par le moteur, avec URL corrigees", async () => {
    process.env.GEMINI_API_KEY = "test";
    const planIA = {
      campagnes: [{ nom: "Parcs Exemple | Camping | Search | FR", type: "Search", statut: "Paused", budgetQuotidien: "50", strategieEncheres: "Maximize clicks", reseaux: "Google Search", langues: "fr", politiqueUE: "Non", localisations: [{ id: "20123", nom: "Quebec" }] }],
      groupes: [{ campagne: "Parcs Exemple | Camping | Search | FR", nom: "camping_automne", statut: "Enabled", maxCPC: "1" }],
      rsas: [{ campagne: "Parcs Exemple | Camping | Search | FR", groupe: "camping_automne", titres: ["Camping en automne", "Réservez votre séjour", "Parcs nationaux du Québec", "Nature et couleurs", "Emplacements disponibles", "Prêt-à-camper", "Séjour en famille", "Réservation en ligne"].map((t) => ({ texte: t, pin: "" })), descriptions: [{ texte: "Réservez un emplacement de camping dans un parc national du Québec.", pin: "" }, { texte: "Profitez des couleurs d’automne. Réservation en ligne simple et rapide.", pin: "" }], path1: "camping", path2: "automne", urlFinale: "https://www.autresite.com/" }],
      motsCles: [{ campagne: "Parcs Exemple | Camping | Search | FR", groupe: "camping_automne", texte: "camping automne quebec", correspondance: "Phrase" }],
      negatifs: [{ campagne: "Parcs Exemple | Camping | Search | FR", groupe: "", texte: "emploi", correspondance: "Phrase" }],
      sitelinks: [{ campagne: "Parcs Exemple | Camping | Search | FR", texte: "Prêt-à-camper", desc1: "Tout inclus", desc2: "Sans matériel", urlFinale: "https://www.exemple-parcs.com/pret-a-camper" }, { campagne: "Parcs Exemple | Camping | Search | FR", texte: "Tarifs", desc1: "Voir les prix", desc2: "Par nuit", urlFinale: "https://www.exemple-parcs.com/tarifs" }],
      callouts: [{ campagne: "Parcs Exemple | Camping | Search | FR", texte: "Réservation en ligne" }, { campagne: "Parcs Exemple | Camping | Search | FR", texte: "Parcs nationaux" }],
      snippets: [], assetGroups: [],
    };
    etat.reponses.push("notes de recherche", JSON.stringify(planIA));
    const { POST } = await import("@/app/api/deck2editor/ai/route");
    const r = await POST(new Request("http://x", { method: "POST", body: JSON.stringify({ brief: "Camping automne", siteOfficiel: "www.exemple-parcs.com", langue: "fr" }) }));
    const j = await r.json();
    if (r.status !== 200) console.log("ERREUR ROUTE:", j);
    expect(r.status).toBe(200);
    expect(j.corrections.length).toBe(1);
    expect(j.plan.rsas[0].urlFinale).toBe("https://www.exemple-parcs.com/");
    expect(j.sources[0].url).toBe("https://ex.com");
    const res = GAE.generer({ ...j.plan, options: { aujourdhui: "2026-09-29" } });
    expect(res.rapport.erreurs).toEqual([]);
  });
});
