/* Types du plan Deck2Editor. Meme structure que l'objet D de la version Apps Script,
   pour que le moteur (gae.ts) le lise sans conversion. */

export interface Localisation { id: string; nom: string; exclue: boolean; modif: string; }

export interface AiMax {
  actif: boolean; searchTermMatching: boolean; textCustomization: boolean; finalUrlExpansion: boolean;
  exclusionsMarque: string; urlsExclues: string;
}

export interface Campagne {
  nom: string; type: string; statut: string; budgetQuotidien: string; periodeBudget: string;
  diffusion: string; strategieEncheres: string; strategiePortefeuille: string; eCPC: string;
  targetCpa: string; targetRoas: string; plafondCPC: string; partImpressionEmplacement: string; partImpressionPct: string;
  reseaux: string; langues: string; dateDebut: string; dateFin: string; calendrier: string;
  rotation: string; modifMobile: string; modifOrdinateur: string; modifTablette: string;
  trackingTemplate: string; suffixeURL: string; parametresPerso: string; etiquettes: string; commentaire: string;
  politiqueUE: string; localisations: Localisation[]; aiMax: AiMax;
}

export interface Groupe { campagne: string; nom: string; statut: string; maxCPC: string; targetCpa: string; etiquettes: string; }
export interface Asset { texte: string; pin: string; }
export interface RSA {
  campagne: string; groupe: string; titres: Asset[]; descriptions: Asset[]; path1: string; path2: string;
  urlFinale: string; urlMobile: string; statut: string; etiquettes: string;
}
export interface MotCle { campagne: string; groupe: string; texte: string; correspondance: string; }
export interface Sitelink { campagne: string; groupe: string; texte: string; desc1: string; desc2: string; urlFinale: string; }
export interface Callout { campagne: string; texte: string; }
export interface Snippet { campagne: string; entete: string; valeurs: string[]; }
export interface AssetGroup {
  campagne: string; nom: string; statut: string; urlFinale: string; titres: string[]; titresLongs: string[];
  descriptions: string[]; nomEntreprise: string; cta: string; path1: string; path2: string;
}

export interface Options {
  client?: string; demande?: string; langueSnippets?: "fr" | "en"; inclureAdType?: boolean;
  fichiersSepares?: boolean; aujourdhui?: string; siteOfficiel?: string;
}

export interface Plan {
  options: Options; campagnes: Campagne[]; groupes: Groupe[]; motsCles: MotCle[]; negatifs: MotCle[];
  rsas: RSA[]; sitelinks: Sitelink[]; callouts: Callout[]; snippets: Snippet[]; assetGroups: AssetGroup[];
}

export interface Message { bloc: string; message: string; ref: string; }
export interface Fichier { id: string; nom: string; nbLignes: number; csv: string; tsv: string; }
export interface Resultat {
  fichiers: Fichier[];
  rapport: { erreurs: Message[]; avertissements: Message[]; infos: { bloc: string; message: string }[]; pret: boolean };
  stats: Record<string, number>;
}

export interface References {
  strategies: string[]; typesCampagne: string[]; entetesSnippets: { fr: string[]; en: string[] };
  cta: string[]; limites: Record<string, number>;
}

export interface GeoItem { id: string; nom: string; type: string; parent: string; }

/* Document Firestore : collection deckPlans */
export interface DeckPlanDoc {
  clientId: string; clientNom: string; demande: string; titre: string;
  ownerUid: string; ownerEmail: string; statut: "brouillon" | "valide" | "importe";
  createdAt: number; updatedAt: number; plan: Plan;
}
