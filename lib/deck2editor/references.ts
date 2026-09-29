import GAE from "./gae";
import type { References } from "./types";

/* Listes de reference du moteur (strategies, types, en-tetes, CTA, limites). */
export function references(): References {
  return {
    strategies: GAE.BID_STRATEGIES, typesCampagne: GAE.CAMPAIGN_TYPES,
    entetesSnippets: GAE.SNIPPET_HEADERS, cta: GAE.CTA_PMAX, limites: GAE.LIMITES,
  };
}
