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
| `NEXT_PUBLIC_ALLOWED_EMAIL_DOMAIN` | Domaine Google Workspace autorise a la connexion (ex. `pluscompany.com`). Vide = tous. |
| `GEMINI_API_KEY` | Cle Google AI Studio. Cote serveur seulement. |
| `GOOGLE_GENAI_USE_VERTEXAI`, `GOOGLE_CLOUD_PROJECT`, `GOOGLE_CLOUD_LOCATION` | Alternative Vertex AI (compte de service via `GOOGLE_APPLICATION_CREDENTIALS`). |
| `GEMINI_MODEL` | Modele autorise sur le projet (par defaut `gemini-2.5-flash`). |

Firestore : collection `deckPlans`, un document par plan (client, demande, proprietaire, statut, plan complet). Regles de securite dans `firestore.rules`.

## Structure

```
app/deck2editor/page.tsx              page principale (onglets + rail de validation)
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

Tokens extraits du CSS compile de MediaBox v2.3.0.4 : palette `primary` (violet Plus Company), rayons `--radius-control` et `--radius-surface`, variables `--plus-*`, effets `btn-pop` et `btn-pop-mono`, bande `plus-pattern`. Polices Urbanist et JetBrains Mono, memes fichiers woff2 que la production (`app/fonts/`).

## IA (Gemini)

Deux appels : 1) recherche web avec grounding Google Search, en prose, avec sources ; 2) mise en forme JSON stricte au format du plan. Le resultat passe ensuite par le meme moteur de validation que n'importe quel plan saisi a la main. Le grounding est facture par Google a la requete de recherche (14 USD / 1 000 au moment de l'ecriture) : la case « Recherche web » permet de le desactiver.

## Non porte depuis la version Apps Script (a faire en v8.1)

- Deck client PDF / HTML et deck Excel (ExcelJS).
- Import d'un plan Excel et import d'un export Google Ads Editor (chemin inverse).
- Bascule EN de l'interface (le bouton est present, le dictionnaire n'est pas encore branche).

## Verifications a faire avant deploiement equipe

1. Importer le fichier 00 genere dans Google Ads Editor sur un compte test, campagnes en pause.
2. Tester la connexion Google avec un compte du domaine et une sauvegarde Firestore.
3. Tester la route IA avec la cle fournie par Tristan et verifier le cout du grounding sur un brief reel.
