import type { Plan, Campagne, Groupe, RSA, AssetGroup, Asset } from "./types";

export function planVide(): Plan {
  return { options: {}, campagnes: [], groupes: [], motsCles: [], negatifs: [], rsas: [],
           sitelinks: [], callouts: [], snippets: [], assetGroups: [] };
}

export function campagneVide(): Campagne {
  return { nom: "", type: "Search", statut: "Paused", budgetQuotidien: "", periodeBudget: "Daily",
    diffusion: "Standard", strategieEncheres: "", strategiePortefeuille: "", eCPC: "",
    targetCpa: "", targetRoas: "", plafondCPC: "", partImpressionEmplacement: "", partImpressionPct: "",
    reseaux: "", langues: "", dateDebut: "", dateFin: "", calendrier: "",
    rotation: "", modifMobile: "", modifOrdinateur: "", modifTablette: "", trackingTemplate: "", suffixeURL: "",
    parametresPerso: "", etiquettes: "", commentaire: "", politiqueUE: "",
    localisations: [{ id: "", nom: "", exclue: false, modif: "" }],
    aiMax: { actif: false, searchTermMatching: false, textCustomization: false, finalUrlExpansion: false, exclusionsMarque: "", urlsExclues: "" } };
}

export function groupeVide(): Groupe { return { campagne: "", nom: "", statut: "Enabled", maxCPC: "", targetCpa: "", etiquettes: "" }; }
export function rsaVide(): RSA {
  return { campagne: "", groupe: "", titres: [], descriptions: [], path1: "", path2: "", urlFinale: "", urlMobile: "", statut: "Enabled", etiquettes: "" };
}
export function assetGroupVide(): AssetGroup {
  return { campagne: "", nom: "", statut: "Paused", urlFinale: "", titres: [], titresLongs: [], descriptions: [], nomEntreprise: "", cta: "", path1: "", path2: "" };
}

/* Exemple complet (identique a la version Apps Script). */
export function planExemple(): Plan {
  const an = new Date().getFullYear() + 1;
  const nom = "Client | Promotion printemps | Search | FR", grp = "promotion_printemps_fr";
  const D = planVide();
  const c = campagneVide();
  Object.assign(c, { nom, budgetQuotidien: "50,00 $", strategieEncheres: "Maximize clicks", plafondCPC: "2,50 $",
    reseaux: "Google Search;Search Partners", langues: "fr", dateDebut: `${an}-01-15`, dateFin: `${an}-04-30`, politiqueUE: "Non",
    localisations: [{ id: "2124", nom: "Canada", exclue: false, modif: "" }] });
  D.campagnes.push(c);
  D.groupes.push({ campagne: nom, nom: grp, statut: "Enabled", maxCPC: "2,00 $", targetCpa: "", etiquettes: "" });
  D.rsas.push({ campagne: nom, groupe: grp,
    titres: ["Promotion du printemps", "Offre à durée limitée", "Découvrez nos nouveautés", "Livraison rapide au Québec",
      "Des conseils d’experts", "Commandez en ligne", "Un service reconnu", "Essayez sans risque", "Profitez de l’offre",
      "Visitez notre boutique"].map((t, i) => ({ texte: t, pin: i === 0 ? "1" : "" })),
    descriptions: ["Profitez de la promotion du printemps sur toute la collection. Commandez en ligne.",
      "Un service local, des conseils d’experts et une livraison rapide partout au Québec.",
      "Des produits choisis avec soin pour la nouvelle saison. Voyez la sélection.",
      "Commandez en quelques minutes. Retours faciles pendant 30 jours."].map((t) => ({ texte: t, pin: "" })),
    path1: "promotion", path2: "printemps", urlFinale: "https://www.exemple.com/promotion/", urlMobile: "", statut: "Enabled", etiquettes: "" });
  ["promotion printemps", "offre printemps", "solde printemps", "boutique en ligne quebec", "nouveaute printemps"]
    .forEach((t) => D.motsCles.push({ campagne: nom, groupe: grp, texte: t, correspondance: "Phrase" }));
  ["gratuit", "emploi", "usage", "occasion"].forEach((t) => D.negatifs.push({ campagne: nom, groupe: "", texte: t, correspondance: "Phrase" }));
  ([["Voir la promotion", "Toute la collection", "Prix réduits", "https://www.exemple.com/promotion/"],
    ["Nouveautés", "Les arrivées de la saison", "Mises à jour chaque semaine", "https://www.exemple.com/nouveautes/"],
    ["Livraison", "Rapide partout au Québec", "Détails et délais", "https://www.exemple.com/livraison/"],
    ["Nous joindre", "Réponse en 24 h", "Par courriel ou téléphone", "https://www.exemple.com/contact/"]] as const)
    .forEach((s) => D.sitelinks.push({ campagne: nom, groupe: "", texte: s[0], desc1: s[1], desc2: s[2], urlFinale: s[3] }));
  ["Commande en ligne", "Livraison rapide", "Conseils d’experts", "Retours faciles"].forEach((t) => D.callouts.push({ campagne: nom, texte: t }));
  D.options = { client: "Client Exemple", demande: "" };
  return D;
}

export function typeCampagneDe(plan: Plan, nom: string): string {
  return plan.campagnes.find((c) => c.nom === nom)?.type ?? "";
}

/* Normalise un plan partiel (sortie IA, JSON externe) vers la structure complete attendue par le moteur. */
type Brut = Record<string, unknown>;
const str = (v: unknown, d = "") => (v === undefined || v === null ? d : String(v));
const arr = (v: unknown): Brut[] => (Array.isArray(v) ? (v as Brut[]) : []);
const asset = (t: unknown): Asset => (typeof t === "string" ? { texte: t, pin: "" } : { texte: str((t as Brut)?.texte), pin: str((t as Brut)?.pin) });

export function normaliserPlan(brut: unknown): Plan {
  const b = (brut && typeof brut === "object" ? brut : {}) as Brut;
  const P = planVide();
  P.options = (b.options && typeof b.options === "object" ? b.options : {}) as Plan["options"];
  P.campagnes = arr(b.campagnes).map((c) => {
    const base = campagneVide();
    const locs = arr(c.localisations).map((l) => ({ id: str(l.id), nom: str(l.nom), exclue: !!l.exclue, modif: str(l.modif) }));
    const ai = (c.aiMax && typeof c.aiMax === "object" ? c.aiMax : {}) as Brut;
    Object.keys(base).forEach((k) => { if (k !== "localisations" && k !== "aiMax" && c[k] !== undefined) (base as unknown as Record<string, string>)[k] = str(c[k]); });
    base.localisations = locs.length ? locs : base.localisations;
    base.aiMax = { ...base.aiMax, actif: !!ai.actif, searchTermMatching: !!ai.searchTermMatching, textCustomization: !!ai.textCustomization, finalUrlExpansion: !!ai.finalUrlExpansion, exclusionsMarque: str(ai.exclusionsMarque), urlsExclues: str(ai.urlsExclues) };
    return base;
  });
  P.groupes = arr(b.groupes).map((g) => ({ ...groupeVide(), campagne: str(g.campagne), nom: str(g.nom), statut: str(g.statut, "Enabled"), maxCPC: str(g.maxCPC), targetCpa: str(g.targetCpa), etiquettes: str(g.etiquettes) }));
  P.rsas = arr(b.rsas).map((r) => ({ ...rsaVide(), campagne: str(r.campagne), groupe: str(r.groupe), titres: arr(r.titres).map(asset), descriptions: arr(r.descriptions).map(asset),
    path1: str(r.path1), path2: str(r.path2), urlFinale: str(r.urlFinale), urlMobile: str(r.urlMobile), statut: str(r.statut, "Enabled"), etiquettes: str(r.etiquettes) }));
  // Un RSA par groupe, dans le meme ordre (contrat des tableaux paralleles groupes / rsas).
  P.rsas = P.groupes.map((g) => P.rsas.find((r) => r.campagne === g.campagne && r.groupe === g.nom) || { ...rsaVide(), campagne: g.campagne, groupe: g.nom });
  const kw = (m: Brut, def: string) => ({ campagne: str(m.campagne), groupe: str(m.groupe), texte: str(m.texte), correspondance: str(m.correspondance, def) });
  P.motsCles = arr(b.motsCles).map((m) => kw(m, "Phrase"));
  P.negatifs = arr(b.negatifs).map((m) => kw(m, "Phrase"));
  P.sitelinks = arr(b.sitelinks).map((s) => ({ campagne: str(s.campagne), groupe: str(s.groupe), texte: str(s.texte), desc1: str(s.desc1), desc2: str(s.desc2), urlFinale: str(s.urlFinale) }));
  P.callouts = arr(b.callouts).map((c) => ({ campagne: str(c.campagne), texte: str(c.texte) }));
  P.snippets = arr(b.snippets).map((s) => ({ campagne: str(s.campagne), entete: str(s.entete), valeurs: Array.isArray(s.valeurs) ? (s.valeurs as unknown[]).map((v) => str(v)) : str(s.valeurs).split(";").map((x) => x.trim()).filter(Boolean) }));
  P.assetGroups = arr(b.assetGroups).map((a) => ({ ...assetGroupVide(), campagne: str(a.campagne), nom: str(a.nom), statut: str(a.statut, "Paused"), urlFinale: str(a.urlFinale),
    titres: arr(a.titres).map((t) => str(t)), titresLongs: arr(a.titresLongs).map((t) => str(t)), descriptions: arr(a.descriptions).map((t) => str(t)),
    nomEntreprise: str(a.nomEntreprise), cta: str(a.cta), path1: str(a.path1), path2: str(a.path2) }));
  return P;
}
