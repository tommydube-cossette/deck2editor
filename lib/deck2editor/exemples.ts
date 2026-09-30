import type { Plan } from "./types";
import { planExemple, planVide, campagneVide } from "./plan";

/* Exemples de plans, prets a etre sauvegardes dans Firestore pour montrer de vraies donnees. */
export interface Exemple { titre: string; client: string; demande: string; plan: Plan; }

function pleinAir(): Plan {
  const D = planVide();
  const nom = "Parcs Exemple | Camping automne 2026 | Search | FR";
  const c = campagneVide();
  Object.assign(c, { nom, budgetQuotidien: "165,00 $", strategieEncheres: "Maximize conversions", reseaux: "Google Search", langues: "fr",
    dateDebut: "2026-10-01", dateFin: "2026-10-31", politiqueUE: "Non", modifMobile: "10",
    localisations: [{ id: "20123", nom: "Quebec", exclue: false, modif: "" }, { id: "1002549", nom: "Gatineau", exclue: false, modif: "" }] });
  D.campagnes.push(c);
  const grp = (g: string, url: string, titres: string[], descs: string[], p1: string, p2: string, kws: string[]) => {
    D.groupes.push({ campagne: nom, nom: g, statut: "Enabled", maxCPC: "", targetCpa: "", etiquettes: "" });
    D.rsas.push({ campagne: nom, groupe: g, titres: titres.map((t, i) => ({ texte: t, pin: i === 0 ? "1" : "" })), descriptions: descs.map((t) => ({ texte: t, pin: "" })),
      path1: p1, path2: p2, urlFinale: url, urlMobile: "", statut: "Enabled", etiquettes: "" });
    kws.forEach((k) => D.motsCles.push({ campagne: nom, groupe: g, texte: k, correspondance: "Phrase" }));
  };
  grp("camping_automne", "https://www.parcs-exemple.com/camping/",
    ["Camping d’automne au Québec", "Parcs et réserves du Québec", "Réservez votre emplacement", "Les couleurs de l’automne", "Camping en famille", "Emplacements avec services", "Nature à moins d’une heure", "Réservation en ligne facile", "Séjour en plein air", "Terrains de camping"],
    ["Réservez un emplacement de camping dans un parc national du Québec pour l’automne.", "Profitez des couleurs d’automne. Réservation en ligne simple et rapide.", "Emplacements avec ou sans services, près de chez vous. Voyez les disponibilités.", "Camping d’automne en famille ou entre amis dans les parcs nationaux."],
    "camping", "automne", ["camping automne", "camping octobre quebec", "camping parc national", "reserver camping quebec", "camping couleurs automne", "terrain de camping quebec", "camping en famille"]);
  grp("pret_a_camper", "https://www.parcs-exemple.com/pret-a-camper/",
    ["Prêt-à-camper au Québec", "Camper sans matériel", "Tentes et chalets équipés", "Confort en pleine nature", "Réservez en ligne", "Idéal pour les familles", "Parcs nationaux du Québec", "Séjour clé en main", "Automne en plein air", "Découvrez le prêt-à-camper"],
    ["Camping sans matériel : tentes et chalets équipés dans les parcs nationaux du Québec.", "Un séjour clé en main en pleine nature. Réservez votre prêt-à-camper en ligne.", "Idéal pour un premier séjour en camping, en famille ou entre amis.", "Confort et nature réunis. Voyez les unités disponibles cet automne."],
    "pret-a-camper", "automne", ["pret a camper", "camping tout equipe", "tente equipee quebec", "chalet camping quebec", "glamping quebec", "camping sans materiel", "pret a camper automne"]);
  ["emploi", "gratuit", "terrain a vendre", "camping sauvage", "vr a vendre", "roulotte a vendre"].forEach((t) => D.negatifs.push({ campagne: nom, groupe: "", texte: t, correspondance: "Phrase" }));
  ([["Camping", "Tous les parcs", "Voir les disponibilités", "https://www.parcs-exemple.com/camping/"], ["Prêt-à-camper", "Sans matériel", "Tentes et chalets", "https://www.parcs-exemple.com/pret-a-camper/"], ["Parcs nationaux", "Trouver un parc", "Près de chez vous", "https://www.parcs-exemple.com/pq/"], ["Carte annuelle", "Accès illimité", "Aux parcs nationaux", "https://www.parcs-exemple.com/carte-annuelle/"]] as const)
    .forEach((s) => D.sitelinks.push({ campagne: nom, groupe: "", texte: s[0], desc1: s[1], desc2: s[2], urlFinale: s[3] }));
  ["Réservation en ligne", "Parcs nationaux", "Emplacements équipés", "Séjour en famille"].forEach((t) => D.callouts.push({ campagne: nom, texte: t }));
  D.snippets.push({ campagne: nom, entete: "Destinations", valeurs: ["Laurentides", "Charlevoix", "Mauricie", "Estrie", "Bas-Saint-Laurent"] });
  D.options = { client: "Parcs Exemple", demande: "00042310", langueSnippets: "fr", siteOfficiel: "https://www.parcs-exemple.com" };
  return D;
}

function pmax(): Plan {
  const D = planVide();
  const nom = "Client Exemple | Boutique en ligne | PMax | FR";
  const c = campagneVide();
  Object.assign(c, { nom, type: "Performance Max", budgetQuotidien: "80,00 $", strategieEncheres: "Maximize conversion value", langues: "fr", politiqueUE: "Non",
    localisations: [{ id: "2124", nom: "Canada", exclue: false, modif: "" }] });
  D.campagnes.push(c);
  D.assetGroups.push({ campagne: nom, nom: "collection_automne", statut: "Paused", urlFinale: "https://www.exemple.com/automne/",
    titres: ["Collection automne", "Nouveautés de saison", "Livraison rapide au Canada", "Retours faciles 30 jours", "Commandez en ligne"],
    titresLongs: ["Découvrez la collection automne : des pièces choisies pour la nouvelle saison.", "Livraison rapide partout au Canada et retours faciles pendant 30 jours."],
    descriptions: ["Toute la collection automne en ligne. Livraison rapide.", "Des produits choisis avec soin pour la saison. Voyez la sélection.", "Commandez en quelques minutes, retours faciles pendant 30 jours."],
    nomEntreprise: "Client Exemple", cta: "Shop now", path1: "automne", path2: "" });
  D.options = { client: "Client Exemple", demande: "00042311", langueSnippets: "fr" };
  return D;
}

export function exemples(): Exemple[] {
  const p = planExemple();
  return [
    { titre: "Parcs Exemple · 00042310 · Camping automne 2026", client: "Parcs Exemple", demande: "00042310", plan: pleinAir() },
    { titre: "Client Exemple · 00042309 · Promotion printemps", client: "Client Exemple", demande: "00042309", plan: { ...p, options: { ...p.options, demande: "00042309" } } },
    { titre: "Client Exemple · 00042311 · Boutique PMax", client: "Client Exemple", demande: "00042311", plan: pmax() },
  ];
}
