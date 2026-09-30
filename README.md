# Deck2Editor

Module MediaBox : montage d'un plan Google Ads (Search, Performance Max) et generation du fichier CSV a importer dans Google Ads Editor. Aucune ecriture directe dans Google Ads.

Portage Next.js 14 (App Router, TypeScript, Tailwind) de l'outil Apps Script « Deck vers Google Ads Editor » v7.1. Le moteur de validation et de generation (`lib/deck2editor/gae.ts`) est repris tel quel, sans modification.

## Demarrage local

```bash
npm install
cp .env.example .env.local   # remplir les valeurs (voir ci-dessous)
npm run dev                  # http://localhost:3000/deck2editor
```

Sans `.env.local`, l'outil fonctionne en mode local : saisie, validation, generation et telechargement des fichiers, sans connexion ni sauvegarde. Le bouton IA repond « Gemini non configure ».

## Configuration

| Variable | Role |
|---|---|
| `NEXT_PUBLIC_FIREBASE_*` | Valeurs publiques du SDK client Firebase (projet MediaBox `mediabox-1cd44` ou un projet de test). Console Firebase > Project settings > Your apps > SDK setup. |
| `NEXT_PUBLIC_ALLOWED_EMAIL_DOMAIN` | Domaine Google Workspace autorise a la connexion (ex. `entreprise.com`). Vide = tous. |
| `GEMINI_API_KEY` | Cle Google AI Studio. Cote serveur seulement. |
| `GOOGLE_GENAI_USE_VERTEXAI`, `GOOGLE_CLOUD_PROJECT`, `GOOGLE_CLOUD_LOCATION` | Alternative Vertex AI (compte de service via `GOOGLE_APPLICATION_CREDENTIALS`). |
| `GEMINI_MODEL`, `GEMINI_MODEL_FALLBACK` | Modele principal et modele de secours. La route fait 3 tentatives espacees sur erreur 429 / 503 puis bascule sur le secours. |

Firestore : collection `deckPlans`, un document par plan (client, demande, proprietaire, statut, plan complet). Regles de securite dans `firestore.rules`. Le bouton « Creer 3 plans d'exemple » de l'accueil ecrit trois plans realistes et fictifs (Search FR plein air, Search FR promotion, Performance Max) pour voir de vraies donnees dans la console Firestore.

## Parcours utilisateur

1. Accueil : explication en trois etapes et quatre facons de commencer (brief IA, a la main, fichier, plan sauvegarde), liste des plans Firestore.
2. Editeur : sequence numerotee de 7 etapes (Contexte, Campagnes, Groupes et annonces, Mots-cles, Extensions, Performance Max, Generation), navigation Precedent / Suivant, rail de validation a droite.
3. La source se choisit a l'accueil seulement (brief IA, fichier Excel ou export Editor, a la main) et s'ouvre en panneau lateral ; l'editeur ne propose plus de changer de source en cours de route. Le seul raccourci est « Coller un deck » dans la carte de chaque groupe d'annonces (onglet Excel copie-colle).

## Structure

```
app/deck2editor/page.tsx              page principale (onglets + rail de validation)
lib/deck2editor/portage.ts            import export Editor, Excel, deck HTML (code Apps Script porte tel quel)
lib/deck2editor/exports.ts            API des echanges, chargement differe
app/api/deck2editor/generate/route.ts validation + CSV cote serveur (le moteur tourne aussi cote client)
app/api/deck2editor/ai/route.ts       Gemini : recherche web (grounding) puis plan JSON
components/shell/                     coquille MediaBox (barre laterale 210 px, barre superieure)
components/ui/                        boutons, cartes, champs, pastilles, bloc « ? », toasts
components/deck2editor/               un composant par onglet + PlanContext (etat du plan)
lib/deck2editor/gae.ts                moteur, inchange depuis Apps Script
lib/deck2editor/plan.ts               plan vide, exemple, normalisation d'un plan externe
lib/deck2editor/firestore.ts          lecture / ecriture des plans
lib/firebase.ts, lib/auth.tsx         Firebase client (Auth Google) avec initialisation paresseuse
data/geo-ca-qc.json                   localisations Canada / Quebec (ID Google)
```

## Esthetique

Tokens extraits du CSS compile de MediaBox v2.3.0.4 : palette `primary` (violet MediaBox), rayons `--radius-control` et `--radius-surface`, variables `--plus-*`, effets `btn-pop` et `btn-pop-mono`, bande `plus-pattern`. Polices Urbanist et JetBrains Mono, memes fichiers woff2 que la production (`app/fonts/`).

## IA (Gemini)

Entrees : site officiel du client (obligatoire), mandat, langue, recherche web oui/non.

Deux appels : 1) lecture du site officiel avec l'outil URL context, et recherche web (grounding Google Search) limitee au vocabulaire de recherche, en prose, avec sources ; 2) mise en forme JSON stricte au format du plan (temperature 0,4). Regles du prompt : le site officiel est la seule source de verite sur l'annonceur, aucune offre ou prix invente, toutes les URL finales sur le domaine du site. Apres coup, la route remplace toute URL hors domaine par la page d'accueil et le signale a l'ecran. Le plan passe ensuite par le meme moteur de validation que n'importe quel plan saisi a la main.

Le grounding est facture par Google a la requete de recherche (14 USD / 1 000 au moment de l'ecriture) : la case « Recherche web » permet de le desactiver. Prompts dans `lib/deck2editor/ai.ts`, a ajuster sur des briefs reels une fois la cle disponible.

## Echanges (panneau « Importer » et etape « Generation »)

Portes tels quels depuis la version Apps Script (`lib/deck2editor/portage.ts`, charge a la demande avec ExcelJS) :
- Modele Excel a remplir, deck client Excel, import d'un plan Excel (avec ou sans generation immediate du fichier 00).
- Import d'un export Google Ads Editor (CSV / TSV, UTF-8 ou UTF-16) : chemin inverse pour documenter un compte existant.
- Deck client HTML (telechargement) et PDF (impression navigateur, « Enregistrer au format PDF »).

## Non porte depuis la version Apps Script (a faire en v8.1)

- Bascule EN de l'interface (le bouton est present, le dictionnaire n'est pas encore branche). Les exports Excel et le deck client existent deja en EN via le parametre `langue`.

## Tests

`npm test` : 25 tests (interface avec React Testing Library, moteur, normalisation, logique IA et route IA avec Gemini simule, aller-retour Excel, deck HTML, import d'un export Editor).

## Verifications a faire avant deploiement equipe

1. Importer le fichier 00 genere dans Google Ads Editor sur un compte test, campagnes en pause.
2. Tester la connexion Google avec un compte du domaine et une sauvegarde Firestore.
3. Tester la route IA avec la cle fournie par Tristan et verifier le cout du grounding sur un brief reel.
