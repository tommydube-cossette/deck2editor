/* Logique IA testable sans reseau : construction des prompts, controle du domaine,
   correction des URL finales hors du site officiel. */
import type { Plan } from "./types";

export interface ParamsIA { brief: string; siteOfficiel: string; langue: "fr" | "en"; rechercheWeb: boolean; }

/* "exemple.com", "https://www.exemple.com/offre/" -> "exemple.com" ; null si invalide. */
export function domaineDe(entree: string): string | null {
  const t = (entree || "").trim();
  if (!t) return null;
  try {
    const u = new URL(/^https?:\/\//i.test(t) ? t : "https://" + t);
    const h = u.hostname.toLowerCase().replace(/^www\./, "");
    return /^[a-z0-9.-]+\.[a-z]{2,}$/.test(h) ? h : null;
  } catch { return null; }
}
export function urlSite(entree: string): string {
  const t = (entree || "").trim();
  return /^https?:\/\//i.test(t) ? t : "https://" + t.replace(/^www\./, "www.");
}
export function urlSurDomaine(url: string, domaine: string): boolean {
  try { const h = new URL(url).hostname.toLowerCase().replace(/^www\./, ""); return h === domaine || h.endsWith("." + domaine); } catch { return false; }
}

/* Remplace toute URL finale hors domaine par la page d'accueil du site et retourne la liste des corrections. */
export function corrigerUrls(plan: Plan, site: string): string[] {
  const dom = domaineDe(site); if (!dom) return [];
  const accueil = urlSite(site).replace(/\/+$/, "") + "/";
  const corr: string[] = [];
  const fix = (u: string, ref: string) => { if (u && !urlSurDomaine(u, dom)) { corr.push(`${ref} : ${u} remplacée par ${accueil}`); return accueil; } return u || accueil; };
  plan.rsas.forEach((r) => { r.urlFinale = fix(r.urlFinale, `Annonce ${r.campagne} > ${r.groupe}`); });
  plan.sitelinks.forEach((s) => { s.urlFinale = fix(s.urlFinale, `Lien annexe « ${s.texte} »`); });
  plan.assetGroups.forEach((a) => { a.urlFinale = fix(a.urlFinale, `Groupe d’assets ${a.nom}`); });
  return corr;
}

export function promptRecherche(p: ParamsIA): string {
  const site = urlSite(p.siteOfficiel), dom = domaineDe(p.siteOfficiel);
  return `Tu es un specialiste SEM experimente, base au Quebec. Tu prepares des notes de travail pour un plan Google Ads Search.

SOURCE DE VERITE : le site officiel de l'annonceur, ${site} (domaine ${dom}). Lis-le avec l'outil de contexte d'URL.
- Tout fait sur l'annonceur (offres, produits, prix, dates, promotions, services, territoires, pages) vient UNIQUEMENT de ${dom}.
- N'invente aucune offre, aucun prix, aucune date, aucune promesse. Si une information n'est pas sur le site, ecris « non trouve sur le site ».
- La recherche Google sert seulement a comprendre comment les consommateurs formulent leurs recherches (vocabulaire, synonymes, questions, concurrents a exclure). Jamais pour affirmer un fait sur l'annonceur.
- Chaque page de destination proposee doit etre une URL reelle vue sur ${dom}, copiee telle quelle.

Redige en ${p.langue === "en" ? "anglais" : "francais"} des notes structurees avec ces sections, dans cet ordre :
1. Annonceur : positionnement en 3 lignes, tire du site.
2. Offres a mettre de l'avant : liste, chacune avec son URL exacte sur ${dom}.
3. Familles de mots-cles : 4 a 8 familles, chacune avec 5 a 10 mots-cles en langage naturel des consommateurs.
4. Termes a exclure : mots-cles negatifs (emploi, gratuit, occasion, marques concurrentes, sens parasites).
5. Arguments de vente presents sur le site, utilisables en titres et accroches, avec la page source.
6. Points d'attention : contraintes legales ou de ton visibles sur le site.

Brief du mandat :
${p.brief}`;
}

export function promptJson(p: ParamsIA, notes: string): string {
  const dom = domaineDe(p.siteOfficiel), site = urlSite(p.siteOfficiel);
  const lang = p.langue === "en" ? "en" : "fr";
  return `Construis un plan Google Ads Search complet a partir du brief et des notes ci-dessous.

Brief : ${p.brief}
Site officiel : ${site} (domaine ${dom})

Notes de recherche :
${notes || "(aucune recherche)"}

REGLES ABSOLUES, verifiees par un programme apres ta reponse :
- Reponds UNIQUEMENT avec un objet JSON valide, sans texte avant ni apres, sans balises de code.
- Toutes les URL (urlFinale) commencent par https:// et sont sur le domaine ${dom}. Aucune autre URL.
- Textes en ${lang === "en" ? "anglais" : "francais"}. Valeurs de plateforme en anglais exactement : "Search", "Paused", "Enabled", "Phrase", "Exact", "Broad", "Maximize clicks", "Maximize conversions", "Target CPA".
- Noms de campagne au format "Client | Offre | Search | ${lang.toUpperCase()}". Le meme nom de campagne, a l'identique, dans chaque bloc qui s'y rapporte.
- Une campagne par offre principale, 1 a 3 campagnes. 1 a 4 groupes d'annonces par campagne, un theme serre par groupe.
- Par annonce : entre 10 et 15 titres de 30 caracteres maximum, sans point d'exclamation, sans mot tout en majuscules, tous differents ; 4 descriptions de 90 caracteres maximum, toutes differentes ; path1 et path2 de 15 caracteres maximum, sans espace ni caractere special.
- Par groupe : 8 a 20 mots-cles en "Phrase", en minuscules, sans crochets ni guillemets, 10 mots maximum chacun.
- Par campagne : 5 a 15 mots-cles negatifs (groupe vide = niveau campagne), 4 liens annexes (texte 25 max, deux descriptions de 35 max chacune, URL sur ${dom}), 4 a 6 accroches de 25 max, 1 extrait de site avec un en-tete parmi ${lang === "en" ? '"Brands","Services","Types","Destinations","Courses","Models","Styles"' : '"Marques","Types","Destinations","Cours","Modèles","Styles","Catalogue de services"'} et 3 a 6 valeurs de 25 max.
- Campagne : "type":"Search", "statut":"Paused", "strategieEncheres":"Maximize clicks", "reseaux":"Google Search", "langues":"${lang}", "politiqueUE":"Non", budgetQuotidien tire du brief (nombre, ex. "50") sinon "" ; dateDebut et dateFin au format AAAA-MM-JJ si le brief les donne, sinon "".
- Localisations : ID Google numeriques. Canada "2124", Quebec (province) "20123", Montreal "1002604", Quebec City "1002624", Laval "1002579", Gatineau "1002549", Sherbrooke "1002643", Trois-Rivieres "1002708". Par defaut Quebec "20123".
- Compte les caracteres avant d'ecrire chaque titre. Un titre de 31 caracteres sera rejete.

Format exact :
{
 "campagnes":[{"nom":"","type":"Search","statut":"Paused","budgetQuotidien":"","strategieEncheres":"Maximize clicks","reseaux":"Google Search","langues":"${lang}","dateDebut":"","dateFin":"","politiqueUE":"Non","localisations":[{"id":"20123","nom":"Quebec","exclue":false,"modif":""}]}],
 "groupes":[{"campagne":"","nom":"","statut":"Enabled","maxCPC":""}],
 "rsas":[{"campagne":"","groupe":"","titres":[{"texte":"","pin":""}],"descriptions":[{"texte":"","pin":""}],"path1":"","path2":"","urlFinale":""}],
 "motsCles":[{"campagne":"","groupe":"","texte":"","correspondance":"Phrase"}],
 "negatifs":[{"campagne":"","groupe":"","texte":"","correspondance":"Phrase"}],
 "sitelinks":[{"campagne":"","groupe":"","texte":"","desc1":"","desc2":"","urlFinale":""}],
 "callouts":[{"campagne":"","texte":""}],
 "snippets":[{"campagne":"","entete":"","valeurs":[""]}],
 "assetGroups":[]
}`;
}

/* Extrait le JSON d'une reponse modele (tolere les balises de code et du texte autour). */
export function extraireJson(texte: string): unknown {
  const t = (texte || "").replace(/```json|```/g, "").trim();
  try { return JSON.parse(t); } catch { /* suite */ }
  const a = t.indexOf("{"), b = t.lastIndexOf("}");
  if (a > -1 && b > a) return JSON.parse(t.slice(a, b + 1));
  throw new Error("Réponse du modèle non exploitable (pas de JSON).");
}
