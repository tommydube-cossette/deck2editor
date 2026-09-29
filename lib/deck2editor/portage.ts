/* eslint-disable */
// @ts-nocheck
/* Fonctions portees telles quelles depuis Index.html (Apps Script) :
   import d'un export Google Ads Editor, deck / modele Excel (ExcelJS), deck client HTML.
   Le DOM est remplace par un contexte explicite (plan, langue, options). Ne pas retoucher sans re-tester. */
import geoData from "@/data/geo-ca-qc.json";
import { planVide } from "./plan";
var ExcelJS = null; // fourni par setExcelJS() (chargement differe, hors du bundle principal)
export function setExcelJS(mod){ ExcelJS = mod; }

var D = null;          // plan courant, fixe par avecContexte()
var LANG = "fr";
var OPTS = { client: "", demande: "", langueSnippets: "fr" };
function $(id){ // remplace document.getElementById pour les 3 champs de Reglages utilises par le code d'origine
  if (id === "o_client") return { value: OPTS.client || "" };
  if (id === "o_demande") return { value: OPTS.demande || "" };
  if (id === "o_langueSnip") return { value: OPTS.langueSnippets || "fr" };
  return { value: "" };
}
function esc(t){ return String(t==null?'':t).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];}); }
function q(v){ return String(v==null?'':v); }
function vide(){ return planVide(); }
function geoNorm(t){ return String(t||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/^st-/,'saint-').replace(/^ste-/,'sainte-'); }
function geoListe(){ return geoData; }

/* Dictionnaire de libelles (FR/EN), identique a la version Apps Script. */
var EN = {
  'Un seul fichier 00 \u00e0 importer. Keep proposed changes apr\u00e8s l\u2019import.':'One file (00) to import. Keep proposed changes after import.',
  '= champ obligatoire pour l\u2019import':'= field required for import',
  'Nouveau plan':'New plan',
  'R\u00e9glages':'Settings','Campagnes':'Campaigns','Groupes et annonces':'Ad groups & ads','Mots-cl\u00e9s':'Keywords',
  'Extensions':'Assets','Performance Max':'Performance Max','Import deck':'Deck import',
  'Groupes d\u2019assets':'Asset groups','Import direct depuis un deck':'Direct import from a deck',
  'Contexte du plan et options d\u2019export.':'Plan context and export options.',
  'Budget, ench\u00e8res, diffusion, ciblage, AI Max.':'Budget, bidding, delivery, targeting, AI Max.',
  'Une annonce responsive par groupe. 3 \u00e0 15 titres, 2 \u00e0 4 descriptions.':'One responsive search ad per group. 3 to 15 headlines, 2 to 4 descriptions.',
  'Positifs et n\u00e9gatifs, au niveau groupe ou campagne.':'Positive and negative, at ad group or campaign level.',
  'Liens annexes, accroches, extraits de site.':'Sitelinks, callouts, structured snippets.',
  'Titres, titres longs, descriptions, nom de l\u2019entreprise.':'Headlines, long headlines, descriptions, business name.',
  'Collez un onglet Excel, l\u2019outil en extrait le contenu.':'Paste an Excel tab, the tool extracts its content.',
  '\u00c0 quoi sert cet outil':'What this tool does',
  'portee_1':'You build your plan here (campaigns, ad groups, ads, keywords, assets), click \u201cValidate and generate\u201d, and get a CSV file ready to import into Google Ads Editor. Nothing is written directly to Google Ads.',
  'Campagnes prises en charge':'Supported campaigns',
  'portee_2a':'Search: fully covered.',
  'portee_2b':'Performance Max: fully covered for text. Images, logos and videos are added in Editor after the import.',
  'portee_2c':'Demand Gen, Display, Video, Shopping, App: the tool only creates the campaign with its settings (budget, dates, locations, bidding). The content of these campaigns is then built in Editor or the Google Ads interface.',
  'Ce qui ne passe jamais par le fichier':'What never goes through the file',
  'portee_3':'Images, videos, audiences, conversion goals, shared negative keyword lists, EU declaration. After every generation, a checklist tells you exactly what remains to finish in Editor.',
  'Client':'Client','Num\u00e9ro de demande':'Request number','Nom du client':'Client name',
  'Langue des extraits de site':'Structured snippet language','Fran\u00e7ais':'French','Anglais':'English',
  '\u00c9crire la colonne \u00ab Ad type \u00bb':'Write the \u201cAd type\u201d column',
  'adtype_small':'Value \u201cResponsive search ad\u201d in the ads file. Uncheck only if your Editor version flags the column as unrecognized.',
  'Point de d\u00e9part':'Starting point','Charger un exemple complet':'Load a complete example','Repartir de z\u00e9ro':'Start from scratch',
  'Effacer tout le plan ?':'Clear the entire plan?',
  'exemple_p':'The example builds one complete, valid Search campaign. Useful to see the expected shape before entering yours.',
  '+ Ajouter une campagne':'+ Add a campaign','+ Ajouter un groupe d\u2019annonces':'+ Add an ad group','+ Ajouter un groupe d\u2019assets':'+ Add an asset group',
  'Ajouter des mots-cl\u00e9s':'Add keywords','Campagne':'Campaign','Groupe d\u2019annonces':'Ad group','Correspondance':'Match type',
  'Un mot-cl\u00e9 par ligne':'One keyword per line','sans crochets ni guillemets':'no brackets or quotes','Ajouter':'Add',
  'hint_criterion':'Match type is carried by the \u201cCriterion Type\u201d column.',
  'Ajouter des mots-cl\u00e9s n\u00e9gatifs':'Add negative keywords','Niveau':'Level','vide = campagne':'empty = campaign level',
  'Un mot-cl\u00e9 n\u00e9gatif par ligne':'One negative keyword per line',
  'Liens annexes':'Sitelinks','facultatif':'optional','+ Lien':'+ Sitelink','Coller en lot':'Paste in bulk',
  'Minimum 2 par campagne, 4 recommand\u00e9s.':'Minimum 2 per campaign, 4 recommended.',
  'bulk_sl_label':'One line per sitelink: Text \u21e5 Description 1 \u21e5 Description 2 \u21e5 URL',
  'Importer les lignes':'Import lines','Importer':'Import','Accroches':'Callouts','+ Accroche':'+ Callout',
  'Minimum 2, 4 recommand\u00e9es.':'Minimum 2, 4 recommended.','Une accroche par ligne':'One callout per line',
  'Extraits de site':'Structured snippets','En-t\u00eate':'Header','liste impos\u00e9e par Google':'list enforced by Google',
  'Une valeur par ligne':'One value per line','3 \u00e0 10, 25 caract\u00e8res chacune':'3 to 10, 25 characters each',
  'Ajouter cet extrait':'Add this snippet',
  'import_p':'Select the cells in Excel or Sheets, copy, paste here. The tool recognizes Headline / Titre / Titre long / Description / Description courte / Display path / Final URL / Business name / Call to action, plus the Keywords, Negative keywords, Callout extensions, Sitelinks and Structured snippets sections. Character-count columns are ignored.',
  'Contenu coll\u00e9':'Pasted content','Campagne de destination':'Destination campaign','Groupe de destination':'Destination ad group',
  'Analyser':'Analyze','Appliquer':'Apply',
  'Validation':'Validation','Pas encore g\u00e9n\u00e9r\u00e9':'Not generated yet',
  'state_p':'Complete your plan, then run validation.',
  'Valider et g\u00e9n\u00e9rer':'Validate and generate','Tout t\u00e9l\u00e9charger':'Download all','R\u00e9sultat':'Result',
  'Pr\u00eat.':'Ready.','Traitement\u2026':'Processing\u2026','Validation\u2026':'Validating\u2026',
  'Nom de la campagne':'Campaign name','Type':'Type','Budget quotidien':'Daily budget','Statut':'Status',
  'Strat\u00e9gie':'Bid strategy','Portefeuille':'Portfolio strategy','si applicable':'if applicable',
  'CPA cible':'Target CPA','ROAS cible (%)':'Target ROAS (%)','Plafond CPC':'Max CPC bid limit','Rotation':'Ad rotation',
  'Part d\u2019impression':'Impression share','Cible (%)':'Target (%)',
  'R\u00e9seaux':'Networks','Langues':'Languages','codes, s\u00e9par\u00e9s par ;':'codes, separated by ;',
  'Date de d\u00e9but':'Start date','Date de fin':'End date','Calendrier':'Ad schedule',
  'Modif. mobile (%)':'Mobile bid adj. (%)','Modif. ordinateur (%)':'Desktop bid adj. (%)','Modif. tablette (%)':'Tablet bid adj. (%)',
  'D\u00e9claration \u00ab annonces politiques UE \u00bb':'\u201cEU political ads\u201d declaration','obligatoire':'required',
  '\u2014 \u00e0 trancher \u2014':'\u2014 to decide \u2014','\u00c9tiquettes':'Labels',
  'Localisations':'Locations','ID num\u00e9rique recommand\u00e9':'numeric ID recommended','+ Localisation':'+ Location',
  'ID num\u00e9rique Google':'Google numeric ID','Nom (facultatif)':'Name (optional)','Modif. %':'Adj. %','Exclure':'Exclude',
  'Suivi':'Tracking','Mod\u00e8le de suivi':'Tracking template','Suffixe d\u2019URL finale':'Final URL suffix',
  'report\u00e9 dans la checklist':'carried to the checklist','Activer AI Max':'Enable AI Max',
  'Exclusions de marque':'Brand exclusions','URL exclues de l\u2019expansion':'URLs excluded from expansion',
  'Supprimer cette campagne':'Delete this campaign','Aucune campagne. Ajoutez-en une pour commencer.':'No campaigns. Add one to get started.',
  'Nom du groupe':'Ad group name','URL finale de l\u2019annonce':'Ad final URL','Chemin 1':'Path 1','Chemin 2':'Path 2',
  '15 car.':'15 chars','25 car.':'25 chars','Titres':'Headlines','Descriptions':'Descriptions','Titres longs':'Long headlines',
  'minimum':'minimum','titres':'headlines','desc.':'desc.','longs':'long','\u00c9pingler':'Pin',
  'Une ligne par \u00e9l\u00e9ment':'One line per item','Supprimer ce groupe':'Delete this group','Supprimer':'Delete',
  'Aucun groupe d\u2019annonces.':'No ad groups.','Aucun mot-cl\u00e9.':'No keywords.','Positif':'Positive','N\u00e9gatif':'Negative',
  'campagne':'campaign','Aucun lien annexe.':'No sitelinks.','Aucune accroche.':'No callouts.','Accroche':'Callout',
  'Aucun extrait de site.':'No structured snippets.','Aucun groupe d\u2019assets.':'No asset groups.',
  'Campagne PMax':'PMax campaign','URL finale':'Final URL','Nom de l\u2019entreprise':'Business name','Nom affich\u00e9':'Displayed name',
  'Incitation \u00e0 l\u2019action':'Call to action',
  'pmax_note':'Google requires at least one description of 60 characters or fewer. Images, logos and videos are uploaded in Editor after the import.',
  'Texte du lien':'Sitelink text','Description 1':'Description 1','Description 2':'Description 2',
  '\u2014 choisir \u2014':'\u2014 choose \u2014','Niveau campagne':'Campaign level','Niveau compte':'Account level',
  'Choisissez une campagne et un groupe.':'Choose a campaign and an ad group.','Choisissez une campagne.':'Choose a campaign.',
  'Saisissez au moins une valeur.':'Enter at least one value.',
  'Cliquez d\u2019abord sur Analyser.':'Click Analyze first.',
  'Choisissez la campagne et le groupe de destination.':'Choose the destination campaign and ad group.',
  'Groupe introuvable.':'Ad group not found.','Deck analys\u00e9':'Deck analyzed',
  'titre(s)':'headline(s)','long(s)':'long','description(s)':'description(s)','courte(s)':'short',
  'mot(s)-cl\u00e9(s)':'keyword(s)','n\u00e9gatif(s)':'negative(s)','accroche(s)':'callout(s)',
  'Chemins':'Paths','Entreprise':'Business',
  'Deck appliqu\u00e9 au groupe':'Deck applied to ad group',
  'Titres longs ignor\u00e9s : la campagne de destination n\u2019est pas de type Performance Max.':'Long headlines skipped: the destination campaign is not a Performance Max campaign.',
  'Pr\u00eat pour l\u2019import':'Ready for import','Aucune erreur bloquante.':'No blocking errors.',
  'avertissement(s) \u00e0 lire.':'warning(s) to review.','Aucun avertissement.':'No warnings.',
  'erreur(s) bloquante(s)':'blocking error(s)',
  'state_ko_p':'Fix them before importing. Tap a message to jump to the related section.',
  'Contenu':'Content','Groupes':'Ad groups','N\u00e9gatifs':'Negatives','Annonces':'Ads','Liens':'Sitelinks','Extraits':'Snippets',
  'Assets PMax':'PMax assets','Messages':'Messages','Fichiers':'Files','Erreur':'Error','Avertissement':'Warning',
  'G\u00e9n\u00e9r\u00e9. Pr\u00eat pour l\u2019import.':'Generated. Ready for import.','G\u00e9n\u00e9r\u00e9 avec erreurs.':'Generated with errors.',
  'Erreur :':'Error:','copi\u00e9. Editor > Account > Import > Paste text.':'copied. Editor > Account > Import > Paste text.',
  'Copie impossible.':'Copy failed.','Enregistr\u00e9 dans Drive.':'Saved to Drive.','Exemple charg\u00e9.':'Example loaded.',
  'R\u00e9f\u00e9rences indisponibles :':'References unavailable:','Sans nom':'Untitled',
  'lien(s)':'sitelink(s)','extrait(s)':'snippet(s)',
  'note_rapport_fr':'Note: the validation report is written in French.',
  'Budget et ench\u00e8res':'Budget and bidding','Diffusion et ciblage':'Delivery and targeting','+ Ajouter':'+ Add',
  'Calendrier de diffusion':'Ad schedule','vide = en continu':'empty = always on','\u00e0':'to','+ Plage horaire':'+ Time slot',
  'Commentaire':'Comment','URL mobile':'Mobile URL','Cr\u00e9ez d\u2019abord une campagne Performance Max':'Create a Performance Max campaign first',
  'Saisissez au moins un mot-cl\u00e9.':'Enter at least one keyword.','mot(s)-cl\u00e9 ajout\u00e9(s).':'keyword(s) added.',
  'n\u00e9gatif(s) ajout\u00e9(s).':'negative(s) added.','Collez au moins une ligne.':'Paste at least one line.',
  'ligne(s) import\u00e9e(s).':'line(s) imported.','Extrait ajout\u00e9.':'Snippet added.',
  'Tout t\u00e9l\u00e9charger (ZIP)':'Download all (ZIP)',
  'ZIP t\u00e9l\u00e9charg\u00e9 : d\u00e9compressez, puis importez 00 dans Editor (Account > Import > From file).':'ZIP downloaded: unzip, then import 00 in Editor (Account > Import > From file).',
  'G\u00e9n\u00e9rer aussi les fichiers s\u00e9par\u00e9s par type (01 \u00e0 10)':'Also generate the separate per-type files (01 to 10)',
  'Aucun r\u00e9sultat':'No results',
  'groupes d\u2019assets r\u00e9serv\u00e9s aux campagnes Performance Max':'asset groups are for Performance Max campaigns only',
  'pas de groupes d\u2019annonces ni de mots-cl\u00e9s en Performance Max':'no ad groups or keywords in Performance Max',
  'Cette campagne est de type':'This campaign is of type',
  'les groupes d\u2019annonces et les mots-cl\u00e9s ne s\u2019y appliquent pas. Changez son type dans Campagnes ou choisissez une autre campagne.':'ad groups and keywords do not apply to it. Change its type under Campaigns or pick another campaign.',
  'un groupe d\u2019assets exige une campagne Performance Max. Changez son type dans Campagnes ou choisissez une autre campagne.':'an asset group requires a Performance Max campaign. Change its type under Campaigns or pick another campaign.','D\u00e9j\u00e0 dans la liste.':'Already in the list.','ajout\u00e9.':'added.',
  'Qu\u00e9bec (province)':'Quebec (province)',
  'Rechercher une ville, municipalit\u00e9, MRC ou quartier du Qu\u00e9bec, ou une province':'Search a Quebec city, municipality, RCM or neighborhood, or a province',
  'Deck client (PDF)':'Client deck (PDF)','Deck client (Excel)':'Client deck (Excel)',
  'T\u00e9l\u00e9charger le mod\u00e8le Excel':'Download the Excel template',
  'Excel vers Editor en un clic':'Excel to Editor in one click','Choisir un fichier Excel et g\u00e9n\u00e9rer':'Choose an Excel file and generate',
  'xl_direct_p':'Drop the filled Excel template (or an Excel deck generated by the tool): the plan is loaded, validated, and file 00 for Editor is generated immediately. Errors to fix appear on the right.','Importer un plan Excel':'Import an Excel plan',
  'modele_p':'The Excel template has the same structure as the Excel deck generated by the tool: fill it in (or have the client fill it), import it here, validate, fix what the tool flags, then generate file 00.',
  'Excel g\u00e9n\u00e9r\u00e9.':'Excel generated.','Mod\u00e8le de deck SEM':'SEM deck template','Mod\u00e8le Excel t\u00e9l\u00e9charg\u00e9.':'Excel template downloaded.',
  'Biblioth\u00e8que Excel non charg\u00e9e (connexion). R\u00e9essayez.':'Excel library not loaded (connection). Try again.',
  'Fichier Excel illisible :':'Unreadable Excel file:','Aucun onglet reconnu. Utilisez le mod\u00e8le Excel de l\u2019outil.':'No recognized sheet. Use the tool\u2019s Excel template.',
  'Plan Excel import\u00e9 :':'Excel plan imported:','campagne(s)':'campaign(s)','groupe(s)':'group(s)',
  'Le plan actuel sera remplac\u00e9 par le fichier Excel. Continuer ?':'The current plan will be replaced by the Excel file. Continue?',
  'R\u00e9sum\u00e9':'Summary','Instructions':'Instructions',
  'Groupe d\u2019assets':'Asset group','Pin titre':'Headline pin','Pin description':'Description pin','Titre long':'Long headline',
  'Part d\u2019impression (emplacement)':'Impression share (location)','Cible part d\u2019impression (%)':'Impression share target (%)',
  'Localisations (ID s\u00e9par\u00e9s par ;)':'Locations (IDs separated by ;)','Localisations exclues (ID)':'Excluded locations (IDs)',
  'D\u00e9claration UE (Oui/Non)':'EU political ads (Yes/No)','AI Max (Oui/Non)':'AI Max (Yes/No)',
  'Mot-cl\u00e9':'Keyword','Valeurs (s\u00e9par\u00e9es par ;)':'Values (separated by ;)',
  'Groupe (vide = campagne)':'Ad group (empty = campaign level)','Groupe (facultatif)':'Ad group (optional)','Texte':'Text',
  'instr_1':'One sheet per entity type. Row 1 = headers, do not rename them. One entity per row.',
  'instr_2':'Campaign names must match exactly between sheets. Use <Account-level> as the campaign of an account-level sitelink, callout or snippet.',
  'instr_3':'Platform values stay in English exactly as in Google Ads Editor: Paused / Enabled, Search / Performance Max, Broad / Phrase / Exact, Maximize clicks, Target CPA...',
  'instr_4':'Dates: YYYY-MM-DD. Amounts: 50 or 50,00 $. Locations: Google numeric IDs separated by ; (the tool resolves names on import). Ad schedule: (Monday[08:00-17:00]);(Tuesday[08:00-17:00]).',
  'instr_5':'Headlines: 30 characters max, descriptions 90, sitelinks and callouts 25, paths 15. The tool validates everything on import; empty cells are allowed.',
  'instr_6':'In the tool: Settings > Import an Excel plan. Then Validate and generate.','Deck client (HTML)':'Client deck (HTML)','Plan SEM pour approbation':'SEM plan for approval',
  'R\u00e9sum\u00e9 du plan':'Plan summary','PDF g\u00e9n\u00e9r\u00e9.':'PDF generated.',
  'Cible':'Target','Mots-cl\u00e9s (total)':'Keywords (total)','Extensions (total)':'Assets (total)',
  'Aper\u00e7u Google':'Google preview','Mots-cl\u00e9s \u00e0 exclure':'Negative keywords',
  'G\u00e9n\u00e9r\u00e9 le':'Generated on',
  'Deck client t\u00e9l\u00e9charg\u00e9.':'Client deck downloaded.',
  'Ajoutez au moins une campagne.':'Add at least one campaign.',
  'R\u00e9glages de campagne':'Campaign settings','Type de campagne':'Campaign type',
  'P\u00e9riode':'Flight dates','Strat\u00e9gie d\u2019ench\u00e8res':'Bid strategy','en continu':'always on',
  'separes_small':'File 00 holds every entity and imports in one operation; this is the method documented by Google. The separate files are for reviewing one entity type at a time; they import one by one, keeping proposed changes between imports.',
  'Editor vers Excel : documenter un compte existant':'Editor to Excel: document an existing account',
  'ed_p':'Reverse path. In Google Ads Editor: Account > Export > Export whole account (or a selection of campaigns) > CSV. Drop that file here: existing campaigns, locations, ad groups, keywords, responsive search ads, sitelinks, callouts, structured snippets and asset groups fill the plan. Then generate the Excel, PDF or HTML deck of the account. Nothing is written to Google Ads.',
  'Choisir un export Editor et g\u00e9n\u00e9rer le deck Excel':'Choose an Editor export and generate the Excel deck',
  'Charger un export Editor dans le plan':'Load an Editor export into the plan',
  'Le plan actuel sera remplac\u00e9 par l\u2019export Editor. Continuer ?':'The current plan will be replaced by the Editor export. Continue?',
  'Fichier illisible :':'Unreadable file:',
  'Aucune entit\u00e9 reconnue. Utilisez un export CSV de Google Ads Editor (Account > Export).':'No recognized entity. Use a CSV export from Google Ads Editor (Account > Export).',
  'Export Editor charg\u00e9':'Editor export loaded',
  'Export Editor charg\u00e9 :':'Editor export loaded:',
  'localisation(s)':'location(s)','annonce(s)':'ad(s)',
  'ligne(s) ignor\u00e9e(s) : type non pris en charge par l\u2019outil (audiences, autres extensions, annonces non responsives, etc.)':'row(s) skipped: type not supported by the tool (audiences, other assets, non responsive ads, etc.)',
  'ligne(s) supprim\u00e9e(s) dans Google Ads, ignor\u00e9e(s)':'row(s) removed in Google Ads, skipped',
  'annonce(s) responsive(s) suppl\u00e9mentaire(s) ignor\u00e9e(s) : l\u2019outil garde une annonce par groupe':'additional responsive search ad(s) skipped: the tool keeps one ad per ad group',
  'campagne(s) cr\u00e9\u00e9e(s) d\u2019apr\u00e8s leurs \u00e9l\u00e9ments (ligne de campagne absente de l\u2019export)':'campaign(s) created from their child rows (campaign row missing from the export)',
  'localisation(s) par nom ambigu (plusieurs ID possibles) : ID laiss\u00e9 vide, \u00e0 choisir dans Campagnes':'location(s) with an ambiguous name (several possible IDs): ID left blank, pick it under Campaigns',
  'Rappel : la d\u00e9claration UE et le budget sont \u00e0 v\u00e9rifier avant tout r\u00e9import dans Editor.':'Reminder: check the EU declaration and budgets before any reimport into Editor.'
};
function T(k){ return LANG === 'fr' ? (k === 'adtype_small' || k === 'exemple_p' || k === 'import_p' || k === 'state_p' || k === 'hint_criterion' || k === 'bulk_sl_label' || k === 'pmax_note' || k === 'state_ko_p' || k === 'separes_small' || k === 'xl_direct_p' || k === 'modele_p' || k === 'ed_p' || k === 'instr_1' || k === 'instr_2' || k === 'instr_3' || k === 'instr_4' || k === 'instr_5' || k === 'instr_6' || k === 'note_rapport_fr' || k === 'portee_1' || k === 'portee_2a' || k === 'portee_2b' || k === 'portee_2c' || k === 'portee_3' ? FRLONG[k] : k) : (EN[k] || k); }
var FRLONG = {
  adtype_small:'Valeur \u00ab Responsive search ad \u00bb dans le fichier d\u2019annonces. \u00c0 d\u00e9cocher seulement si votre version d\u2019Editor la signale comme non reconnue.',
  exemple_p:'L\u2019exemple monte une campagne Search compl\u00e8te et valide. Utile pour voir la forme attendue avant de saisir la v\u00f4tre.',
  import_p:'S\u00e9lectionnez les cellules dans Excel ou Sheets, copiez, collez ici. L\u2019outil reconna\u00eet Headline / Titre / Titre long / Description / Description courte / Display path / URL finale / Nom de l\u2019entreprise / Incitation \u00e0 l\u2019action, ainsi que les sections Mots-cl\u00e9s, Mots-cl\u00e9s n\u00e9gatifs, Callout extensions, Sitelinks et Structured snippets. Les colonnes de comptage de caract\u00e8res sont ignor\u00e9es.',
  state_p:'Compl\u00e9tez votre plan puis lancez la validation.',
  hint_criterion:'La correspondance est port\u00e9e par la colonne \u00ab Criterion Type \u00bb.',
  bulk_sl_label:'Une ligne par lien : Texte \u21e5 Description 1 \u21e5 Description 2 \u21e5 URL',
  pmax_note:'Google exige au moins une description de 60 caract\u00e8res ou moins. Images, logos et vid\u00e9os se t\u00e9l\u00e9versent dans Editor apr\u00e8s l\u2019import.',
  state_ko_p:'Corrigez-les avant d\u2019importer. Touchez un message pour aller \u00e0 la section concern\u00e9e.',
  xl_direct_p:'D\u00e9posez le mod\u00e8le Excel rempli (ou un deck Excel g\u00e9n\u00e9r\u00e9 par l\u2019outil) : le plan est charg\u00e9, valid\u00e9, et le fichier 00 pour Editor est g\u00e9n\u00e9r\u00e9 imm\u00e9diatement. Les erreurs \u00e0 corriger s\u2019affichent \u00e0 droite.',
  modele_p:'Le mod\u00e8le Excel a la m\u00eame structure que le deck Excel g\u00e9n\u00e9r\u00e9 par l\u2019outil : remplissez-le (ou faites-le remplir par le client), importez-le ici, validez, corrigez ce que l\u2019outil signale, puis g\u00e9n\u00e9rez le fichier 00.',
  ed_p:'Chemin inverse. Dans Google Ads Editor : Account > Export > Export whole account (ou une s\u00e9lection de campagnes) > CSV. D\u00e9posez ce fichier ici : les campagnes, localisations, groupes, mots-cl\u00e9s, annonces responsives, liens annexes, accroches, extraits de site et groupes d\u2019assets existants remplissent le plan. G\u00e9n\u00e9rez ensuite le deck Excel, PDF ou HTML du compte. Aucune \u00e9criture dans Google Ads.',
  instr_1:'Un onglet par type d\u2019entit\u00e9. Ligne 1 = en-t\u00eates, ne pas les renommer. Une entit\u00e9 par ligne.',
  instr_2:'Les noms de campagne doivent \u00eatre identiques d\u2019un onglet \u00e0 l\u2019autre. \u00c9crire <Account-level> comme campagne d\u2019un lien, d\u2019une accroche ou d\u2019un extrait au niveau du compte.',
  instr_3:'Les valeurs de plateforme restent en anglais, exactement comme dans Google Ads Editor : Paused / Enabled, Search / Performance Max, Broad / Phrase / Exact, Maximize clicks, Target CPA...',
  instr_4:'Dates : AAAA-MM-JJ. Montants : 50 ou 50,00 $. Localisations : ID num\u00e9riques Google s\u00e9par\u00e9s par ; (l\u2019outil retrouve les noms \u00e0 l\u2019import). Calendrier : (Monday[08:00-17:00]);(Tuesday[08:00-17:00]).',
  instr_5:'Titres : 30 caract\u00e8res max, descriptions 90, liens annexes et accroches 25, chemins 15. L\u2019outil valide tout \u00e0 l\u2019import ; les cellules vides sont permises.',
  instr_6:'Dans l\u2019outil : R\u00e9glages > Importer un plan Excel. Puis Valider et g\u00e9n\u00e9rer.',
  separes_small:'Le fichier 00 contient toutes les entit\u00e9s et s\u2019importe en une seule op\u00e9ration, c\u2019est la m\u00e9thode document\u00e9e par Google. Les fichiers s\u00e9par\u00e9s servent \u00e0 relire un type d\u2019entit\u00e9 \u00e0 la fois ; ils s\u2019importent un par un, en acceptant les modifications propos\u00e9es entre chaque import.',
  note_rapport_fr:'',
  portee_1:'Vous montez votre plan ici (campagnes, groupes, annonces, mots-cl\u00e9s, extensions), vous cliquez \u00ab Valider et g\u00e9n\u00e9rer \u00bb, et vous obtenez un fichier CSV pr\u00eat \u00e0 importer dans Google Ads Editor. Aucune \u00e9criture directe dans Google Ads.',
  portee_2a:'Search : complet.',
  portee_2b:'Performance Max : complet pour les textes. Images, logos et vid\u00e9os s\u2019ajoutent dans Editor apr\u00e8s l\u2019import.',
  portee_2c:'Demand Gen, Display, Video, Shopping, App : l\u2019outil cr\u00e9e seulement la campagne avec ses r\u00e9glages (budget, dates, localisations, ench\u00e8res). Le contenu de ces campagnes se fait ensuite dans Editor ou l\u2019interface Google Ads.',
  portee_3:'Images, vid\u00e9os, audiences, objectifs de conversion, listes de mots-cl\u00e9s n\u00e9gatifs partag\u00e9es, d\u00e9claration UE. Apr\u00e8s chaque g\u00e9n\u00e9ration, une checklist vous indique exactement quoi terminer dans Editor.'
};

// Decodage : Editor exporte en UTF-8 (avec ou sans BOM) ou en UTF-16 selon la version et le systeme.
function edDecoder(buf){
  var b=new Uint8Array(buf), enc='utf-8', debut=0;
  if(b.length>=2 && b[0]===0xFF && b[1]===0xFE){ enc='utf-16le'; debut=2; }
  else if(b.length>=2 && b[0]===0xFE && b[1]===0xFF){ enc='utf-16be'; debut=2; }
  else if(b.length>=3 && b[0]===0xEF && b[1]===0xBB && b[2]===0xBF){ debut=3; }
  else {
    // UTF-16LE sans BOM : un octet nul sur deux dans le debut du fichier
    var n=Math.min(b.length,400), nuls=0;
    for(var i=1;i<n;i+=2) if(b[i]===0) nuls++;
    if(n>10 && nuls>n/5) enc='utf-16le';
  }
  var vue=b.subarray(debut);
  try { return new TextDecoder(enc,{fatal:true}).decode(vue); }
  catch(e){
    try { return new TextDecoder('windows-1252').decode(vue); }
    catch(e2){ return new TextDecoder('utf-8').decode(vue); }
  }
}

// Analyse CSV / TSV avec guillemets ("" = guillemet litteral), retours a la ligne dans les cellules.
function edParserCSV(txt){
  txt=String(txt||'').replace(/^\uFEFF/,'');
  var l1=txt.split(/\r\n|\n|\r/)[0]||'';
  var sep = l1.indexOf('\t')>-1 ? '\t' : ((l1.indexOf(',')===-1 && l1.indexOf(';')>-1) ? ';' : ',');
  // En TSV (copie depuis Editor, ou fichier 00 colle), les cellules ne sont pas entre guillemets :
  // un guillemet y est un caractere comme un autre (mot-cle en expression, par exemple).
  var guillemets = sep!=='\t';
  var lignes=[], ligne=[], cel='', q=false, i=0, n=txt.length, c;
  while(i<n){
    c=txt.charAt(i);
    if(q){
      if(c==='"'){ if(txt.charAt(i+1)==='"'){ cel+='"'; i+=2; continue; } q=false; i++; continue; }
      cel+=c; i++; continue;
    }
    if(c==='"' && guillemets && cel===''){ q=true; i++; continue; }
    if(c===sep){ ligne.push(cel); cel=''; i++; continue; }
    if(c==='\r'||c==='\n'){ ligne.push(cel); lignes.push(ligne); ligne=[]; cel=''; if(c==='\r'&&txt.charAt(i+1)==='\n') i++; i++; continue; }
    cel+=c; i++;
  }
  if(cel!==''||ligne.length){ ligne.push(cel); lignes.push(ligne); }
  return lignes.filter(function(l){ for(var k=0;k<l.length;k++){ if(String(l[k]).replace(/\s+/g,'')!=='') return true; } return false; });
}

function edNormH(h){ return String(h||'').replace(/^\uFEFF/,'').toLowerCase().replace(/[\u2019']/g,'').replace(/[^a-z0-9%]+/g,' ').replace(/^\s+|\s+$/g,''); }
// Cle d'en-tete : Editor ignore la casse et les espaces ("daily budget" = "dailybudget" = "DAILY_BUDGET")
function edNormK(h){ return edNormH(h).replace(/ /g,''); }
function edVal(v){ v=String(v==null?'':v).replace(/^\s+|\s+$/g,''); return (v==='[]'||v==='[ ]'||/^(none|null)$/i.test(v)) ? '' : v; }
function edPct(v){ v=edVal(v); if(!v) return ''; var m=v.replace(/\s/g,'').replace(',','.').match(/^([+-]?\d+(?:\.\d+)?)%?$/); return m ? String(parseFloat(m[1])) : v.replace(/%/g,''); }
function edP2(n){ n=+n; return (n<10?'0':'')+n; }
function edDate(v){
  v=edVal(v); if(!v) return '';
  var m=v.match(/^(\d{4})[-\/.](\d{1,2})[-\/.](\d{1,2})/); if(m) return m[1]+'-'+edP2(m[2])+'-'+edP2(m[3]);
  m=v.match(/^(\d{1,2})[\/.-](\d{1,2})[\/.-](\d{4})$/);
  if(m){ var a=+m[1], b=+m[2], mo=a, j=b; if(a>12){ mo=b; j=a; } return m[3]+'-'+edP2(mo)+'-'+edP2(j); }
  return v;
}
function edSupprime(v){ return /removed|deleted|supprim/i.test(edVal(v)); }
function edStatut(v, defaut){
  var t=edVal(v).toLowerCase();
  // Synonymes traites comme Enabled par Editor (aide Google) : Active, Inactive, Disapproved, Normal, Pending, Ended
  if(/^(enabled|active|activ|inactive|disapproved|normal|pending|ended|eligible)/.test(t)) return 'Enabled';
  if(/^(paused|pause|en pause)/.test(t)) return 'Paused';
  return defaut;
}
function edMotCle(txt, ct){
  var t=edVal(txt), c=edNormH(ct), mt='';
  if(/exact/.test(c)) mt='Exact'; else if(/phrase/.test(c)) mt='Phrase'; else if(/broad/.test(c)) mt='Broad';
  if(/^\[.*\]$/.test(t)){ t=t.slice(1,-1).replace(/^\s+|\s+$/g,''); if(!mt) mt='Exact'; }
  else if(/^".*"$/.test(t)){ t=t.slice(1,-1).replace(/^\s+|\s+$/g,''); if(!mt) mt='Phrase'; }
  else if(/^\+/.test(t)){ t=t.replace(/(^|\s)\+/g,'$1').replace(/^\s+|\s+$/g,''); if(!mt) mt='Broad'; }
  return { texte:t, correspondance:mt||'Broad', negatif:/negative|n\u00e9gatif|negatif|exclu/.test(c) };
}

// Colonnes reconnues (noms Editor, variantes comprises), par cle interne.
// Source : aide Google Ads Editor, "CSV file columns" (en-tetes et en-tetes de rechange). Premier nom trouve = colonne retenue.
var ED_COLS={
  rowType:['row type'], campaign:['campaign','campaign name'], adGroup:['ad group','ad group name'],
  assetGroup:['asset group','asset group name'],
  campType:['campaign type'], campStatus:['campaign status'],
  budget:['campaign daily budget','daily budget','campaign budget','budget'],
  bidType:['bid strategy type','bidding strategy type','bidding type'],
  bidName:['bid strategy name','bidding strategy name','bid strategy','bidding strategy','bidding name'],
  tCpa:['target cpa','cpa bid','max cpa'], tRoas:['target roas'], maxCpcLimit:['maximum cpc bid limit','max cpc bid limit'],
  tis:['target impression share'], tisLoc:['target impression share location'],
  networks:['networks','network targeting'], languages:['languages','language targeting','language'], startDate:['start date','campaign start date'], endDate:['end date','campaign end date'],
  schedule:['ad schedule','ad schedules','ad schedule intervals'], rotation:['ad rotation'],
  modMobile:['bid modifier','bid adjustment','mobile bid modifier','mobile bid adjustment'], modDesktop:['desktop bid modifier','desktop bid adjustment'], modTablet:['tablet bid modifier','tablet bid adjustment'],
  tracking:['tracking template','tracking url'], suffix:['final url suffix'], custom:['custom parameters','custom parameter'],
  labels:['labels','label','campaign labels','ad group labels'], comment:['comment','comments'],
  location:['location','geo targeting'], locationId:['location id','id','geo id','geo target id'],
  locType:['type','location type','criterion type','targeting type'],
  agStatus:['ad group status'], maxCpc:['max cpc','max cpc bid','default max cpc'],
  keyword:['keyword','keyword text'], critType:['criterion type','match type','keyword type','type'],
  status:['status','keyword status','ad status','creative status'], adType:['ad type'],
  path1:['path 1','display path 1'], path2:['path 2','display path 2'],
  finalUrl:['final url','final urls'], mobileUrl:['final mobile url','final mobile urls','mobile final url','mobile final urls'],
  slText:['sitelink text','sitelink','link text','display text','link text upgraded','upgraded link text'], slD1:['description line 1','sitelink description 1','description 1','desc line 1'],
  slD2:['description line 2','sitelink description 2','description 2','desc line 2'],
  coText:['callout text','callout'],
  snHeader:['header','snippet header','structured snippet header'], snValues:['values','snippet values','structured snippet values'],
  agsStatus:['asset group status'], business:['business name','company name'], cta:['call to action','call to action text'],
  longHeadline:['long headline']
};
function edIndex(entetes){
  var map={}; entetes.forEach(function(h,i){ var k=edNormK(h); if(k && map[k]===undefined) map[k]=i; });
  var idx={};
  for(var cle in ED_COLS){ var noms=ED_COLS[cle]; for(var j=0;j<noms.length;j++){ var nk=edNormK(noms[j]); if(map[nk]!==undefined){ idx[cle]=map[nk]; break; } } }
  idx._map=map;
  return idx;
}
// Colonnes numerotees : Headline 1..15, Headline 1 position, Description 1..5, Description 1 position, Long headline 1..5, Value 1..10
function edNum(map, base, i){ var k=map[edNormK(base+' '+i)]; return k===undefined ? -1 : k; }

function edLireExport(texte){
  var lignes=edParserCSV(texte);
  if(lignes.length<2) return null;
  // Ligne d'en-tetes : la premiere qui contient "Campaign" (Editor ecrit parfois un titre avant)
  var hrow=-1;
  for(var i=0;i<Math.min(6,lignes.length);i++){ var hits=0; lignes[i].forEach(function(h){ var k=edNormK(h); if(k==='campaign'||k==='campaignname'||k==='adgroup'||k==='keyword'||k==='rowtype') hits++; }); if(hits){ hrow=i; break; } }
  if(hrow<0) return null;
  var idx=edIndex(lignes[hrow]), map=idx._map;
  if(idx.campaign===undefined) return null;
  var g=function(l,cle){ return idx[cle]===undefined ? '' : edVal(l[idx[cle]]); };
  var gn=function(l,base,i){ var k=edNum(map,base,i); return k<0 ? '' : edVal(l[k]); };

  var N=vide(), cpt={campagnes:0,localisations:0,groupes:0,motsCles:0,negatifs:0,rsa:0,sitelinks:0,callouts:0,snippets:0,assetGroups:0,ignores:0,supprimes:0,rsaIgnores:0,stubs:0,geoAmbigus:0};
  var campIdx={}, grpIdx={}, stubs={};
  // Noms de lieu en double dans la liste (Saint-Simeon, Stanstead, Hatley...) : on ne devine pas l'ID,
  // on le laisse vide et l'utilisateur le choisit dans Campagnes (la validation le signale).
  var geoNoms={}, geoIds={}, geoDoublons={};
  geoListe().forEach(function(x){ geoNoms[x.id]=x.nom; var k=geoNorm(x.nom); if(geoIds[k]===undefined) geoIds[k]=x.id; else geoDoublons[k]=true; });

  function campagne(nom, typeSiStub){
    var k=nom.toLowerCase();
    if(campIdx[k]!==undefined){ var ex=N.campagnes[campIdx[k]]; if(stubs[k] && typeSiStub && ex.type!==typeSiStub) ex.type=typeSiStub; return ex; }
    var c={ nom:nom, type:typeSiStub||'Search', statut:'Paused', budgetQuotidien:'', periodeBudget:'Daily', diffusion:'Standard',
      strategieEncheres:'', strategiePortefeuille:'', eCPC:'', targetCpa:'', targetRoas:'', plafondCPC:'', partImpressionEmplacement:'', partImpressionPct:'',
      reseaux:'', langues:'', dateDebut:'', dateFin:'', calendrier:'', rotation:'', modifMobile:'', modifOrdinateur:'', modifTablette:'',
      trackingTemplate:'', suffixeURL:'', parametresPerso:'', etiquettes:'', commentaire:'', politiqueUE:'', localisations:[],
      aiMax:{actif:false,searchTermMatching:false,textCustomization:false,finalUrlExpansion:false,exclusionsMarque:'',urlsExclues:''} };
    campIdx[k]=N.campagnes.length; stubs[k]=true; cpt.stubs++;
    N.campagnes.push(c);
    return c;
  }
  function groupe(camp, nom){
    var k=(camp+'\u0000'+nom).toLowerCase();
    if(grpIdx[k]!==undefined) return grpIdx[k];
    campagne(camp);
    N.groupes.push({campagne:camp,nom:nom,statut:'Enabled',maxCPC:'',targetCpa:'',etiquettes:''});
    N.rsas.push({campagne:camp,groupe:nom,titres:[],descriptions:[],path1:'',path2:'',urlFinale:'',urlMobile:'',statut:'Enabled',etiquettes:''});
    grpIdx[k]=N.groupes.length-1; cpt.groupes++;
    return grpIdx[k];
  }
  function typeLigne(l){
    var rt=edNormH(g(l,'rowType'));
    if(rt){
      if(/asset group/.test(rt)) return 'ag';
      if(/sitelink/.test(rt)) return 'sl';
      if(/callout/.test(rt)) return 'co';
      if(/snippet/.test(rt)) return 'sn';
      if(/negative keyword/.test(rt)) return 'neg';
      if(/keyword/.test(rt)) return 'kw';
      if(/responsive search/.test(rt)) return 'rsa';
      if(/location/.test(rt)) return 'loc';
      if(/^ad group$/.test(rt)) return 'grp';
      if(/^campaign$/.test(rt)) return 'camp';
      return ''; // type de ligne explicite mais non pris en charge (audience, autre extension, autre annonce)
    }
    if(g(l,'assetGroup')) return 'ag';
    if(g(l,'slText')) return 'sl';
    if(g(l,'coText')) return 'co';
    if(g(l,'snHeader') && (g(l,'snValues')||gn(l,'Value',1))) return 'sn';
    if(g(l,'keyword')) return /negative/.test(edNormH(g(l,'critType'))) ? 'neg' : 'kw';
    if(g(l,'adGroup') && (gn(l,'Headline',1) || /responsive search/i.test(g(l,'adType')))) return 'rsa';
    if((g(l,'location')||g(l,'locationId')) && !g(l,'adGroup')) return 'loc';
    // Ligne de groupe d'annonces : seulement si elle porte un reglage de groupe. Une ligne avec un
    // nom de groupe mais sans statut ni CPC (audience, asset image, annonce non responsive, cible DSA)
    // est ignoree, sinon elle ecraserait le statut et le Max CPC du groupe deja lu.
    if(g(l,'adGroup')) return (g(l,'agStatus')||g(l,'maxCpc')||g(l,'tCpa')) ? 'grp' : '';
    if(g(l,'campaign') && (g(l,'campType')||g(l,'budget')||g(l,'campStatus')||g(l,'bidType')||g(l,'bidName'))) return 'camp';
    return '';
  }

  for(var r=hrow+1;r<lignes.length;r++){
    var l=lignes[r], camp=g(l,'campaign'), t=typeLigne(l);
    if(!t){ cpt.ignores++; continue; }
    if(t==='camp'){
      if(edSupprime(g(l,'campStatus'))){ cpt.supprimes++; continue; }
      var c=campagne(camp); stubs[camp.toLowerCase()]=false;
      c.type=g(l,'campType')||c.type; c.statut=edStatut(g(l,'campStatus'),'Paused');
      c.budgetQuotidien=g(l,'budget'); c.strategieEncheres=g(l,'bidType'); c.strategiePortefeuille=g(l,'bidName');
      c.targetCpa=g(l,'tCpa'); c.targetRoas=edPct(g(l,'tRoas')); c.plafondCPC=g(l,'maxCpcLimit');
      c.partImpressionPct=edPct(g(l,'tis')); c.partImpressionEmplacement=g(l,'tisLoc');
      c.reseaux=g(l,'networks'); c.langues=g(l,'languages'); c.dateDebut=edDate(g(l,'startDate')); c.dateFin=edDate(g(l,'endDate'));
      c.calendrier=g(l,'schedule'); c.rotation=g(l,'rotation');
      c.modifMobile=edPct(g(l,'modMobile')); c.modifOrdinateur=edPct(g(l,'modDesktop')); c.modifTablette=edPct(g(l,'modTablet'));
      c.trackingTemplate=g(l,'tracking'); c.suffixeURL=g(l,'suffix'); c.parametresPerso=g(l,'custom'); c.etiquettes=g(l,'labels'); c.commentaire=g(l,'comment');
      cpt.campagnes++; continue;
    }
    if(t==='loc'){
      if(!camp){ cpt.ignores++; continue; }
      var cl=campagne(camp), id=g(l,'locationId'), nom=g(l,'location');
      if(!/^\d+$/.test(id)){
        var kn=geoNorm(nom);
        if(nom && geoDoublons[kn]){ id=''; cpt.geoAmbigus++; }
        else id = (nom && geoIds[kn]!==undefined) ? geoIds[kn] : '';
      }
      if(!nom && geoNoms[id]) nom=geoNoms[id];
      if(!id && !nom){ cpt.ignores++; continue; }
      var exclue=/negative|exclu|excluded/i.test(g(l,'locType'));
      var doublon=false; for(var d=0;d<cl.localisations.length;d++){ if(cl.localisations[d].id===id && cl.localisations[d].nom===nom && cl.localisations[d].exclue===exclue) doublon=true; }
      if(doublon) continue;
      cl.localisations.push({id:id,nom:nom,exclue:exclue,modif:edPct(g(l,'modMobile'))});
      cpt.localisations++; continue;
    }
    if(t==='grp'){
      if(!camp){ cpt.ignores++; continue; }
      if(edSupprime(g(l,'agStatus'))){ cpt.supprimes++; continue; }
      var gi=groupe(camp,g(l,'adGroup')), G=N.groupes[gi];
      G.statut=edStatut(g(l,'agStatus'),'Enabled'); G.maxCPC=g(l,'maxCpc'); G.targetCpa=g(l,'tCpa'); G.etiquettes=g(l,'labels');
      continue;
    }
    if(t==='kw'||t==='neg'){
      if(!camp){ cpt.ignores++; continue; }
      if(edSupprime(g(l,'status'))){ cpt.supprimes++; continue; }
      var mk=edMotCle(g(l,'keyword'), g(l,'critType')), grpNom=g(l,'adGroup');
      if(!mk.texte){ cpt.ignores++; continue; }
      if(t==='neg' || mk.negatif){
        campagne(camp);
        if(grpNom) groupe(camp,grpNom);
        N.negatifs.push({campagne:camp,groupe:grpNom,texte:mk.texte,correspondance:mk.correspondance}); cpt.negatifs++;
      } else {
        if(!grpNom){ cpt.ignores++; continue; }
        groupe(camp,grpNom);
        N.motsCles.push({campagne:camp,groupe:grpNom,texte:mk.texte,correspondance:mk.correspondance,maxCPC:g(l,'maxCpc'),urlFinale:g(l,'finalUrl'),statut:edStatut(g(l,'status'),'Enabled'),etiquettes:g(l,'labels')}); cpt.motsCles++;
      }
      continue;
    }
    if(t==='rsa'){
      if(!camp || !g(l,'adGroup')){ cpt.ignores++; continue; }
      if(edSupprime(g(l,'status'))){ cpt.supprimes++; continue; }
      var at=g(l,'adType'); if(at && !/responsive search/i.test(at)){ cpt.ignores++; continue; }
      var gi2=groupe(camp,g(l,'adGroup')), R=N.rsas[gi2];
      if(R.titres.length){ cpt.rsaIgnores++; continue; }
      var titres=[], descs=[];
      for(var h=1;h<=15;h++){ var ht=gn(l,'Headline',h); if(ht) titres.push({texte:ht,pin:edVal(gn(l,'Headline '+h,'position'))}); }
      for(var dd=1;dd<=4;dd++){ var dt=gn(l,'Description',dd); if(dt) descs.push({texte:dt,pin:edVal(gn(l,'Description '+dd,'position'))}); }
      R.titres=titres; R.descriptions=descs; R.path1=g(l,'path1'); R.path2=g(l,'path2');
      R.urlFinale=g(l,'finalUrl'); R.urlMobile=g(l,'mobileUrl'); R.statut=edStatut(g(l,'status'),'Enabled'); R.etiquettes=g(l,'labels');
      R.trackingTemplate=g(l,'tracking'); R.suffixeURL=g(l,'suffix'); R.parametresPerso=g(l,'custom');
      cpt.rsa++; continue;
    }
    if(t==='sl'){
      if(edSupprime(g(l,'status'))){ cpt.supprimes++; continue; }
      var cs=camp||'<Account-level>'; if(cs!=='<Account-level>') campagne(cs);
      N.sitelinks.push({campagne:cs,groupe:g(l,'adGroup'),texte:g(l,'slText'),desc1:g(l,'slD1'),desc2:g(l,'slD2'),urlFinale:g(l,'finalUrl'),urlMobile:g(l,'mobileUrl'),dateDebut:edDate(g(l,'startDate')),dateFin:edDate(g(l,'endDate'))});
      cpt.sitelinks++; continue;
    }
    if(t==='co'){
      if(edSupprime(g(l,'status'))){ cpt.supprimes++; continue; }
      var cc=camp||'<Account-level>'; if(cc!=='<Account-level>') campagne(cc);
      N.callouts.push({campagne:cc,groupe:g(l,'adGroup'),texte:g(l,'coText'),dateDebut:edDate(g(l,'startDate')),dateFin:edDate(g(l,'endDate'))});
      cpt.callouts++; continue;
    }
    if(t==='sn'){
      if(edSupprime(g(l,'status'))){ cpt.supprimes++; continue; }
      var cn=camp||'<Account-level>'; if(cn!=='<Account-level>') campagne(cn);
      var vals=[]; var vs=g(l,'snValues');
      if(vs) vals=vs.split(';').map(function(x){return x.replace(/^\s+|\s+$/g,'');}).filter(Boolean);
      if(!vals.length){ for(var vi=1;vi<=10;vi++){ var vv=gn(l,'Value',vi); if(vv) vals.push(vv); } }
      N.snippets.push({campagne:cn,groupe:g(l,'adGroup'),entete:g(l,'snHeader'),valeurs:vals});
      cpt.snippets++; continue;
    }
    if(t==='ag'){
      if(!camp){ cpt.ignores++; continue; }
      if(edSupprime(g(l,'agsStatus'))){ cpt.supprimes++; continue; }
      campagne(camp,'Performance Max');
      var ta=[], la=[], da=[];
      for(var h2=1;h2<=15;h2++){ var x1=gn(l,'Headline',h2); if(x1) ta.push(x1); }
      for(var h3=1;h3<=5;h3++){ var x2=gn(l,'Long headline',h3); if(x2) la.push(x2); }
      if(!la.length && g(l,'longHeadline')) la.push(g(l,'longHeadline')); // colonne "Long headline" sans numero
      for(var h4=1;h4<=5;h4++){ var x3=gn(l,'Description',h4); if(x3) da.push(x3); }
      N.assetGroups.push({campagne:camp,nom:g(l,'assetGroup'),statut:edStatut(g(l,'agsStatus'),'Paused'),urlFinale:g(l,'finalUrl'),
        titres:ta,titresLongs:la,descriptions:da,nomEntreprise:g(l,'business'),cta:g(l,'cta'),path1:g(l,'path1'),path2:g(l,'path2')});
      cpt.assetGroups++; continue;
    }
    cpt.ignores++;
  }
  // Campagnes creees d'apres leurs elements seulement (ligne de campagne absente de l'export)
  cpt.stubs=0; for(var ks in stubs){ if(stubs[ks]) cpt.stubs++; }
  // Une ligne de localisation vide par campagne sans localisation (comme addCamp)
  N.campagnes.forEach(function(c){ if(!c.localisations.length) c.localisations.push({id:'',nom:'',exclue:false,modif:''}); });
  var total=cpt.campagnes+cpt.groupes+cpt.motsCles+cpt.negatifs+cpt.rsa+cpt.sitelinks+cpt.callouts+cpt.snippets+cpt.assetGroups+cpt.localisations;
  if(!total) return null;
  return { plan:N, cpt:cpt };
}

function edResume(cpt){
  var p=[cpt.campagnes+' '+T('campagne(s)'), cpt.localisations+' '+T('localisation(s)'), cpt.groupes+' '+T('groupe(s)'),
         cpt.motsCles+' '+T('mot(s)-cl\u00e9(s)'), cpt.negatifs+' '+T('n\u00e9gatif(s)'), cpt.rsa+' '+T('annonce(s)'),
         cpt.sitelinks+' '+T('lien(s)'), cpt.callouts+' '+T('accroche(s)'), cpt.snippets+' '+T('extrait(s)'), cpt.assetGroups+' '+T('Groupes d\u2019assets').toLowerCase()];
  var notes=[];
  if(cpt.stubs) notes.push(cpt.stubs+' '+T('campagne(s) cr\u00e9\u00e9e(s) d\u2019apr\u00e8s leurs \u00e9l\u00e9ments (ligne de campagne absente de l\u2019export)'));
  if(cpt.rsaIgnores) notes.push(cpt.rsaIgnores+' '+T('annonce(s) responsive(s) suppl\u00e9mentaire(s) ignor\u00e9e(s) : l\u2019outil garde une annonce par groupe'));
  if(cpt.geoAmbigus) notes.push(cpt.geoAmbigus+' '+T('localisation(s) par nom ambigu (plusieurs ID possibles) : ID laiss\u00e9 vide, \u00e0 choisir dans Campagnes'));
  if(cpt.supprimes) notes.push(cpt.supprimes+' '+T('ligne(s) supprim\u00e9e(s) dans Google Ads, ignor\u00e9e(s)'));
  if(cpt.ignores) notes.push(cpt.ignores+' '+T('ligne(s) ignor\u00e9e(s) : type non pris en charge par l\u2019outil (audiences, autres extensions, annonces non responsives, etc.)'));
  notes.push(T('Rappel : la d\u00e9claration UE et le budget sont \u00e0 v\u00e9rifier avant tout r\u00e9import dans Editor.'));
  return '<div class="state ok"><div class="big">'+esc(T('Export Editor charg\u00e9'))+'</div><p>'+esc(p.join(' \u00b7 '))
       + notes.map(function(x){ return '<br>'+esc(x); }).join('')+'</p></div>';
}


var XL_CAMP=[['nom','Campagne'],['type','Type'],['statut','Statut'],['budgetQuotidien','Budget quotidien'],
  ['strategieEncheres','Strat\u00e9gie d\u2019ench\u00e8res'],['strategiePortefeuille','Portefeuille'],['targetCpa','CPA cible'],['targetRoas','ROAS cible (%)'],
  ['plafondCPC','Plafond CPC'],['partImpressionEmplacement','Part d\u2019impression (emplacement)'],['partImpressionPct','Cible part d\u2019impression (%)'],
  ['reseaux','R\u00e9seaux'],['langues','Langues'],['dateDebut','Date de d\u00e9but'],['dateFin','Date de fin'],['calendrier','Calendrier'],['rotation','Rotation'],
  ['modifMobile','Modif. mobile (%)'],['modifOrdinateur','Modif. ordinateur (%)'],['modifTablette','Modif. tablette (%)'],
  ['locIds','Localisations (ID s\u00e9par\u00e9s par ;)'],['locExcl','Localisations exclues (ID)'],['politiqueUE','D\u00e9claration UE (Oui/Non)'],['aiMaxActif','AI Max (Oui/Non)'],
  ['trackingTemplate','Mod\u00e8le de suivi'],['suffixeURL','Suffixe d\u2019URL finale'],['etiquettes','\u00c9tiquettes'],['commentaire','Commentaire']];
var XL_GRP=[['campagne','Campagne'],['groupe','Groupe d\u2019annonces'],['statut','Statut'],['maxCPC','Max CPC'],['urlFinale','URL finale'],['urlMobile','URL mobile'],['path1','Chemin 1'],['path2','Chemin 2']];
for (var xi=1; xi<=15; xi++) XL_GRP.push(['t'+xi,'Titre '+xi]);
for (var xi2=1; xi2<=15; xi2++) XL_GRP.push(['pt'+xi2,'Pin titre '+xi2]);
for (var xd=1; xd<=4; xd++) XL_GRP.push(['d'+xd,'Description '+xd]);
for (var xd2=1; xd2<=4; xd2++) XL_GRP.push(['pd'+xd2,'Pin description '+xd2]);
var XL_KW=[['campagne','Campagne'],['groupe','Groupe d\u2019annonces'],['texte','Mot-cl\u00e9'],['correspondance','Correspondance']];
var XL_NG=[['campagne','Campagne'],['groupe','Groupe (vide = campagne)'],['texte','Mot-cl\u00e9'],['correspondance','Correspondance']];
var XL_SL=[['campagne','Campagne'],['groupe','Groupe (facultatif)'],['texte','Texte'],['desc1','Description 1'],['desc2','Description 2'],['urlFinale','URL finale']];
var XL_CO=[['campagne','Campagne'],['texte','Texte']];
var XL_SN=[['campagne','Campagne'],['entete','En-t\u00eate'],['valeurs','Valeurs (s\u00e9par\u00e9es par ;)']];
var XL_AG=[['campagne','Campagne'],['nom','Groupe d\u2019assets'],['statut','Statut'],['urlFinale','URL finale'],['nomEntreprise','Nom de l\u2019entreprise'],['cta','Incitation \u00e0 l\u2019action'],['path1','Chemin 1'],['path2','Chemin 2']];
for (var xa=1; xa<=15; xa++) XL_AG.push(['t'+xa,'Titre '+xa]);
for (var xl=1; xl<=5; xl++) XL_AG.push(['l'+xl,'Titre long '+xl]);
for (var xg=1; xg<=5; xg++) XL_AG.push(['d'+xg,'Description '+xg]);
var XL_ONGLETS=[['camp','Campagnes',XL_CAMP],['grp','Groupes et annonces',XL_GRP],['kw','Mots-cl\u00e9s',XL_KW],['ng','N\u00e9gatifs',XL_NG],
  ['sl','Liens annexes',XL_SL],['co','Accroches',XL_CO],['sn','Extraits',XL_SN],['ag','Performance Max',XL_AG]];

function xlNorm(t){ return String(t||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[\u2019']/g,'').replace(/[^a-z0-9]+/g,' ').trim(); }
function xlLib(fr){ // libelle dans la langue courante, en ajoutant l'autre langue au dictionnaire d'import
  return T(fr);
}
function xlLibEN(fr){ return EN[fr]||fr; }
function xlLibDyn(fr){ // 'Titre 3' -> EN 'Headline 3', etc.
  var m=fr.match(/^(Titre long|Pin titre|Pin description|Titre|Description) (\d+)$/);
  if(!m) return null;
  var base={ 'Titre long':'Long headline','Pin titre':'Headline pin','Pin description':'Description pin','Titre':'Headline','Description':'Description' }[m[1]];
  return [fr, base+' '+m[2]];
}
function xlLibelles(fr){ var d=xlLibDyn(fr); if(d) return d; return [fr, xlLibEN(fr)]; }
function xlEntete(cols){ return cols.map(function(c){ var d=xlLibDyn(c[1]); return d ? (LANG==='fr'?d[0]:d[1]) : T(c[1]); }); }

function xlLignesCamp(){
  return D.campagnes.filter(function(c){return c.nom;}).map(function(c){
    var locs=(c.localisations||[]).filter(function(l){return l.id;});
    return XL_CAMP.map(function(col){
      var k=col[0];
      if(k==='locIds') return locs.filter(function(l){return !l.exclue;}).map(function(l){return l.id;}).join(';');
      if(k==='locExcl') return locs.filter(function(l){return l.exclue;}).map(function(l){return l.id;}).join(';');
      if(k==='aiMaxActif') return (c.aiMax&&c.aiMax.actif)?'Oui':'';
      return c[k]==null?'':String(c[k]);
    });
  });
}
function xlLignesGrp(){
  var out=[];
  D.groupes.forEach(function(g,gi){
    if(!g.nom) return; var r=D.rsas[gi]||{titres:[],descriptions:[]};
    var row={campagne:g.campagne,groupe:g.nom,statut:g.statut,maxCPC:g.maxCPC,urlFinale:r.urlFinale,urlMobile:r.urlMobile,path1:r.path1,path2:r.path2};
    r.titres.forEach(function(t,i){ row['t'+(i+1)]=t.texte; row['pt'+(i+1)]=t.pin; });
    r.descriptions.forEach(function(t,i){ row['d'+(i+1)]=t.texte; row['pd'+(i+1)]=t.pin; });
    out.push(XL_GRP.map(function(col){ return row[col[0]]==null?'':String(row[col[0]]); }));
  });
  return out;
}
function xlLignesSimples(cols,arr,transf){
  return arr.map(function(x){ var row=transf?transf(x):x; return cols.map(function(col){ return row[col[0]]==null?'':String(row[col[0]]); }); });
}
function xlLignesAG(){
  return D.assetGroups.filter(function(a){return a.nom;}).map(function(a){
    var row={campagne:a.campagne,nom:a.nom,statut:a.statut,urlFinale:a.urlFinale,nomEntreprise:a.nomEntreprise,cta:a.cta,path1:a.path1,path2:a.path2};
    (a.titres||[]).forEach(function(t,i){ row['t'+(i+1)]=t; });
    (a.titresLongs||[]).forEach(function(t,i){ row['l'+(i+1)]=t; });
    (a.descriptions||[]).forEach(function(t,i){ row['d'+(i+1)]=t; });
    return XL_AG.map(function(col){ return row[col[0]]==null?'':String(row[col[0]]); });
  });
}
function deckAOA(mode){
  // mode 'plan' = donnees courantes ; 'modele' = en-tetes + une ligne d'exemple par onglet
  var ex = mode==='modele';
  var exC='Client | Offre | Search | FR', exG='groupe_exemple';
  var lignes={
    camp: ex ? [XL_CAMP.map(function(col){ return {nom:exC,type:'Search',statut:'Paused',budgetQuotidien:'50,00 $',strategieEncheres:'Maximize clicks',reseaux:'Google Search;Search Partners',langues:'fr',locIds:'2124',politiqueUE:'Non'}[col[0]]||''; }),
                XL_CAMP.map(function(col){ return {nom:'Client | Notoriete | PMax | FR',type:'Performance Max',statut:'Paused',budgetQuotidien:'80,00 $',strategieEncheres:'Maximize conversions',langues:'fr',locIds:'20123',politiqueUE:'Non'}[col[0]]||''; })] : xlLignesCamp(),
    grp: ex ? [XL_GRP.map(function(col){ return {campagne:exC,groupe:exG,statut:'Enabled',urlFinale:'https://www.exemple.com/',path1:'offre',t1:'Titre exemple un',t2:'Titre exemple deux',t3:'Titre exemple trois',pt1:'1',d1:'Description exemple un.',d2:'Description exemple deux.'}[col[0]]||''; })] : xlLignesGrp(),
    kw: ex ? [[exC,exG,'mot cle exemple','Phrase']] : xlLignesSimples(XL_KW,D.motsCles),
    ng: ex ? [[exC,'','terme a exclure','Exact']] : xlLignesSimples(XL_NG,D.negatifs),
    sl: ex ? [[exC,'','Lien exemple un','Description 1','Description 2','https://www.exemple.com/page'],[exC,'','Lien exemple deux','','','https://www.exemple.com/autre']] : xlLignesSimples(XL_SL,D.sitelinks),
    co: ex ? [[exC,'Accroche exemple un'],[exC,'Accroche exemple deux']] : xlLignesSimples(XL_CO,D.callouts),
    sn: ex ? [[exC,($('o_langueSnip').value==='en'?'Brands':'Marques'),'Valeur 1;Valeur 2;Valeur 3']] : xlLignesSimples(XL_SN,D.snippets,function(x){ return {campagne:x.campagne,entete:x.entete,valeurs:(x.valeurs||[]).join(';')}; }),
    ag: ex ? [XL_AG.map(function(col){ return {campagne:'Client | Notoriete | PMax | FR',nom:'groupe_assets_exemple',statut:'Paused',urlFinale:'https://www.exemple.com/',nomEntreprise:'Nom affiche',t1:'Titre un',t2:'Titre deux',t3:'Titre trois',l1:'Un titre long qui presente le produit',d1:'Description courte.',d2:'Une deuxieme description un peu plus longue.'}[col[0]]||''; })] : xlLignesAG()
  };
  var feuilles=[{cle:'instr',nom:T('Instructions'),cols:[],aoa:[]}];
  XL_ONGLETS.forEach(function(o){ feuilles.push({cle:o[0],nom:T(o[1]),cols:o[2],aoa:[xlEntete(o[2])].concat(lignes[o[0]])}); });
  return feuilles;
}
// Limites de caracteres par cle de colonne (surlignage rouge dans le deck Excel)
var XL_LIMITES={ grp:{path1:15,path2:15}, sl:{texte:25,desc1:35,desc2:35}, co:{texte:25}, ag:{nomEntreprise:25} };
for (var li=1; li<=15; li++){ XL_LIMITES.grp['t'+li]=30; XL_LIMITES.ag['t'+li]=30; }
for (var ld=1; ld<=4; ld++) XL_LIMITES.grp['d'+ld]=90;
for (var la=1; la<=5; la++){ XL_LIMITES.ag['l'+la]=90; XL_LIMITES.ag['d'+la]=90; }
var XL_HINT={ camp:'Une campagne par ligne. Valeurs de plateforme en anglais (Search, Paused, Maximize clicks...).',
  grp:'Un groupe d\u2019annonces par ligne, avec son annonce responsive : 3 \u00e0 15 titres (30 car.), 2 \u00e0 4 descriptions (90 car.).',
  kw:'Un mot-cl\u00e9 par ligne. Correspondance : Broad, Phrase ou Exact.',
  ng:'Un mot-cl\u00e9 \u00e0 exclure par ligne. Groupe vide = niveau campagne.',
  sl:'Un lien annexe par ligne (texte 25 car., descriptions 35 car.). Minimum 2 par campagne.',
  co:'Une accroche par ligne (25 car.). Minimum 2 par campagne.',
  sn:'Un extrait de site par ligne : en-t\u00eate de la liste Google, 3 \u00e0 10 valeurs s\u00e9par\u00e9es par ;',
  ag:'Un groupe d\u2019assets par ligne : 3 \u00e0 15 titres, 1 \u00e0 5 titres longs, 2 \u00e0 5 descriptions dont une de 60 car. ou moins.' };
var XL_HINT_EN={ camp:'One campaign per row. Platform values in English (Search, Paused, Maximize clicks...).',
  grp:'One ad group per row, with its responsive search ad: 3 to 15 headlines (30 chars), 2 to 4 descriptions (90 chars).',
  kw:'One keyword per row. Match type: Broad, Phrase or Exact.',
  ng:'One negative keyword per row. Empty ad group = campaign level.',
  sl:'One sitelink per row (text 25 chars, descriptions 35). Minimum 2 per campaign.',
  co:'One callout per row (25 chars). Minimum 2 per campaign.',
  sn:'One structured snippet per row: Google header, 3 to 10 values separated by ;',
  ag:'One asset group per row: 3 to 15 headlines, 1 to 5 long headlines, 2 to 5 descriptions with one of 60 chars or fewer.' };

var XL_INK='FF111114', XL_ACC='FFFFE81A', XL_BG='FFF6F6F8', XL_LINE='FFE4E4EA', XL_RED='FFC9342A', XL_INK3='FF7B7B86';
function xlBordure(){ return { bottom:{style:'thin',color:{argb:XL_LINE}} }; }
function deckExcelWorkbook(mode){
  var wb=new ExcelJS.Workbook(); wb.creator='Deck vers Google Ads Editor'; wb.created=new Date();
  var client=$('o_client').value||'', dem=$('o_demande').value||'', auj=new Date().toISOString().slice(0,10);
  var titrePlan=(mode==='modele'?T('Mod\u00e8le de deck SEM'):T('Plan SEM pour approbation'))+(client&&mode!=='modele'?' : '+client:'');
  var feuilles=deckAOA(mode);
  // Feuille Instructions / Resume
  var ins=wb.addWorksheet(T('Instructions'),{views:[{showGridLines:false}]});
  ins.columns=[{width:4},{width:110}];
  var r1=ins.getRow(2); r1.height=34;
  var c1=ins.getCell('B2'); c1.value=titrePlan; c1.font={name:'Arial',size:16,bold:true,color:{argb:XL_ACC}}; c1.fill={type:'pattern',pattern:'solid',fgColor:{argb:XL_INK}}; c1.alignment={vertical:'middle',indent:1};
  var lig=4;
  if(mode!=='modele'){
    [[T('Client'),client],[T('Num\u00e9ro de demande'),dem],[T('G\u00e9n\u00e9r\u00e9 le'),auj]].forEach(function(kv){
      if(!kv[1]) return; var c=ins.getCell('B'+lig); c.value=kv[0]+' : '+kv[1]; c.font={name:'Arial',size:11,color:{argb:XL_INK}}; lig++;
    });
    lig++;
  }
  var ttl=ins.getCell('B'+lig); ttl.value=T('Instructions').toUpperCase(); ttl.font={name:'Arial',size:10,bold:true,color:{argb:XL_ACC}}; ttl.fill={type:'pattern',pattern:'solid',fgColor:{argb:XL_INK}}; ttl.alignment={indent:1}; lig++;
  ['instr_1','instr_2','instr_3','instr_4','instr_5','instr_6'].forEach(function(k,i){
    var c=ins.getCell('B'+lig); c.value=(i+1)+'. '+T(k); c.font={name:'Arial',size:10.5,color:{argb:XL_INK}}; c.alignment={wrapText:true,vertical:'top',indent:1};
    ins.getRow(lig).height=30; lig++;
  });
  if(mode!=='modele'){
    lig++; var st=ins.getCell('B'+lig); st.value=T('R\u00e9sum\u00e9').toUpperCase(); st.font={name:'Arial',size:10,bold:true,color:{argb:XL_ACC}}; st.fill={type:'pattern',pattern:'solid',fgColor:{argb:XL_INK}}; st.alignment={indent:1}; lig++;
    feuilles.forEach(function(f){ if(f.cle==='instr') return; var c=ins.getCell('B'+lig); c.value=f.nom+' : '+(f.aoa.length-1); c.font={name:'Arial',size:10.5,color:{argb:XL_INK}}; c.alignment={indent:1}; lig++; });
  }
  // Feuilles tabulaires
  feuilles.forEach(function(f){
    if(f.cle==='instr') return;
    var ws=wb.addWorksheet(f.nom.slice(0,31),{views:[{state:'frozen',ySplit:3,xSplit:1,showGridLines:false}]});
    var cols=f.cols, nb=f.aoa[0].length;
    ws.columns=f.aoa[0].map(function(h,i){ var k=cols[i][0]; var w = i===0?36 : (/^(t\d+|d\d+|l\d+|texte|desc1|desc2|calendrier|locIds|urlFinale|urlMobile|trackingTemplate|valeurs|commentaire)$/.test(k)?38 : (/^p[td]\d+$/.test(k)?9:16)); return {width:w}; });
    // Bandeau titre
    ws.mergeCells(1,1,1,nb); var t=ws.getCell(1,1); t.value=f.nom.toUpperCase(); t.font={name:'Arial',size:13,bold:true,color:{argb:XL_ACC}}; t.fill={type:'pattern',pattern:'solid',fgColor:{argb:XL_INK}}; t.alignment={vertical:'middle',indent:1}; ws.getRow(1).height=28;
    ws.mergeCells(2,1,2,nb); var h2=ws.getCell(2,1); h2.value=(LANG==='fr'?XL_HINT:XL_HINT_EN)[f.cle]||''; h2.font={name:'Arial',size:9.5,italic:true,color:{argb:XL_INK3}}; h2.alignment={vertical:'middle',indent:1}; ws.getRow(2).height=18;
    // En-tetes
    var hr=ws.getRow(3); hr.height=22;
    f.aoa[0].forEach(function(h,i){ var c=hr.getCell(i+1); c.value=h; c.font={name:'Arial',size:10,bold:true,color:{argb:XL_INK}}; c.fill={type:'pattern',pattern:'solid',fgColor:{argb:XL_ACC}}; c.alignment={vertical:'middle',wrapText:true}; c.border={bottom:{style:'medium',color:{argb:XL_INK}}}; });
    // Donnees
    var lim=XL_LIMITES[f.cle]||{};
    for(var r=1;r<f.aoa.length;r++){
      var row=ws.getRow(r+3);
      f.aoa[r].forEach(function(v,i){
        var c=row.getCell(i+1); c.value=v===''?null:v;
        var k=cols[i][0], depasse=lim[k]&&String(v||'').length>lim[k];
        c.font={name:'Arial',size:10,color:{argb:depasse?XL_RED:XL_INK},bold:!!depasse};
        c.alignment={vertical:'top',wrapText:false};
        c.border=xlBordure();
        if(r%2===0) c.fill={type:'pattern',pattern:'solid',fgColor:{argb:XL_BG}};
      });
      if(mode==='modele'){ row.eachCell(function(c){ c.font={name:'Arial',size:10,italic:true,color:{argb:XL_INK3}}; }); }
    }
    ws.autoFilter={from:{row:3,column:1},to:{row:Math.max(3,f.aoa.length+2),column:nb}};
  });
  return wb;
}
function deckExcel(mode){
  if(mode!=='modele' && !D.campagnes.filter(function(c){return c.nom;}).length) return toast(T('Ajoutez au moins une campagne.'));
  if(typeof ExcelJS==='undefined') return toast(T('Biblioth\u00e8que Excel non charg\u00e9e (connexion). R\u00e9essayez.'));
  var base=(mode==='modele'?'modele_deck_sem':'deck_client_'+(($('o_client').value||'plan').replace(/[^A-Za-z0-9_-]+/g,'_')))+'_'+LANG.toUpperCase();
  deckExcelWorkbook(mode).xlsx.writeBuffer().then(function(buf){
    var bin='', bytes=new Uint8Array(buf);
    for(var i=0;i<bytes.length;i+=8192) bin+=String.fromCharCode.apply(null,bytes.subarray(i,i+8192));
    telecharger('data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64,'+btoa(bin), base+'.xlsx');
    toast(T(mode==='modele'?'Mod\u00e8le Excel t\u00e9l\u00e9charg\u00e9.':'Excel g\u00e9n\u00e9r\u00e9.'));
  }).catch(function(e){ toast(T('Erreur :')+' '+e.message); });
}

/* ---- Import d'un plan Excel (modele rempli ou deck genere) ---- */
function xlCell(v){
  if(v==null) return '';
  if(Object.prototype.toString.call(v)==='[object Date]'){ var m=v.getUTCMonth()+1, d=v.getUTCDate(); return v.getUTCFullYear()+'-'+(m<10?'0':'')+m+'-'+(d<10?'0':'')+d; }
  if(typeof v==='object'){
    if(v.richText) return v.richText.map(function(x){return x.text;}).join('');
    if(v.text!==undefined) return xlCell(v.text);
    if(v.result!==undefined) return xlCell(v.result);
    if(v.error) return '';
    return '';
  }
  return String(v).replace(/^\s+|\s+$/g,'');
}
function xlIndex(entetes,cols){
  var map={}; entetes.forEach(function(h,i){ var k=xlNorm(h); if(k && map[k]===undefined) map[k]=i; });
  var idx={};
  cols.forEach(function(col){
    var libs=xlLibelles(col[1]);
    for(var i=0;i<libs.length;i++){ var k=xlNorm(libs[i]); if(map[k]!==undefined){ idx[col[0]]=map[k]; break; } }
  });
  return idx;
}
function xlOnglet(wb,nomFR){
  var cibles=[xlNorm(nomFR), xlNorm(EN[nomFR]||nomFR)];
  if(nomFR==='Performance Max') cibles.push('pmax');
  var trouve=null;
  wb.eachSheet(function(ws){ if(!trouve && cibles.indexOf(xlNorm(ws.name))>-1) trouve=ws; });
  return trouve;
}
function xlLire(ws,cols){
  if(!ws) return [];
  var aoa=[];
  ws.eachRow({includeEmpty:true},function(row,num){ var vals=[]; row.eachCell({includeEmpty:true},function(c,ci){ vals[ci-1]=xlCell(c.value); }); aoa[num-1]=vals; });
  // ligne d'en-tetes : la premiere (parmi les 8 premieres) qui contient au moins 2 libelles attendus
  var attendus={}; cols.forEach(function(col){ xlLibelles(col[1]).forEach(function(l){ attendus[xlNorm(l)]=1; }); });
  var hrow=-1;
  for(var i=0;i<Math.min(8,aoa.length);i++){ var hits=0; (aoa[i]||[]).forEach(function(h){ if(attendus[xlNorm(h)]) hits++; }); if(hits>=2){ hrow=i; break; } }
  if(hrow<0) return [];
  var idx=xlIndex(aoa[hrow],cols), out=[];
  for(var r=hrow+1;r<aoa.length;r++){
    var row={}, vide=true, src=aoa[r]||[];
    cols.forEach(function(col){ var v = idx[col[0]]===undefined ? '' : (src[idx[col[0]]]||''); row[col[0]]=v; if(v) vide=false; });
    if(!vide) out.push(row);
  }
  return out;
}
function importExcelWorkbook(wb){
  var N=vide(), trouve=0;
  var geoNoms={}; geoListe().forEach(function(g){ geoNoms[g.id]=g.nom; });
  function ouiNon(v){ v=xlNorm(v); return v==='oui'||v==='yes'||v==='true'||v==='1' ? 'Oui' : (v==='non'||v==='no'||v==='false'||v==='0' ? 'Non' : ''); }
  xlLire(xlOnglet(wb,'Campagnes'),XL_CAMP).forEach(function(r){
    trouve++;
    var c={ nom:r.nom, type:r.type||'Search', statut:r.statut||'Paused', budgetQuotidien:r.budgetQuotidien, periodeBudget:'Daily', diffusion:'Standard',
      strategieEncheres:r.strategieEncheres, strategiePortefeuille:r.strategiePortefeuille, eCPC:'', targetCpa:r.targetCpa, targetRoas:r.targetRoas,
      plafondCPC:r.plafondCPC, partImpressionEmplacement:r.partImpressionEmplacement, partImpressionPct:r.partImpressionPct,
      reseaux:r.reseaux, langues:r.langues, dateDebut:r.dateDebut, dateFin:r.dateFin, calendrier:r.calendrier, rotation:r.rotation,
      modifMobile:r.modifMobile, modifOrdinateur:r.modifOrdinateur, modifTablette:r.modifTablette,
      trackingTemplate:r.trackingTemplate, suffixeURL:r.suffixeURL, parametresPerso:'', etiquettes:r.etiquettes, commentaire:r.commentaire,
      politiqueUE:ouiNon(r.politiqueUE), localisations:[],
      aiMax:{actif:ouiNon(r.aiMaxActif)==='Oui',searchTermMatching:false,textCustomization:false,finalUrlExpansion:false,exclusionsMarque:'',urlsExclues:''} };
    String(r.locIds||'').split(/[;,]/).map(function(x){return x.trim();}).filter(Boolean).forEach(function(id){ c.localisations.push({id:id,nom:geoNoms[id]||'',exclue:false,modif:''}); });
    String(r.locExcl||'').split(/[;,]/).map(function(x){return x.trim();}).filter(Boolean).forEach(function(id){ c.localisations.push({id:id,nom:geoNoms[id]||'',exclue:true,modif:''}); });
    if(!c.localisations.length) c.localisations.push({id:'',nom:'',exclue:false,modif:''});
    N.campagnes.push(c);
  });
  xlLire(xlOnglet(wb,'Groupes et annonces'),XL_GRP).forEach(function(r){
    trouve++;
    N.groupes.push({campagne:r.campagne,nom:r.groupe,statut:r.statut||'Enabled',maxCPC:r.maxCPC,targetCpa:'',etiquettes:''});
    var titres=[], descs=[];
    for(var i=1;i<=15;i++) if(r['t'+i]) titres.push({texte:r['t'+i],pin:r['pt'+i]||''});
    for(var j=1;j<=4;j++) if(r['d'+j]) descs.push({texte:r['d'+j],pin:r['pd'+j]||''});
    N.rsas.push({campagne:r.campagne,groupe:r.groupe,titres:titres,descriptions:descs,path1:r.path1,path2:r.path2,urlFinale:r.urlFinale,urlMobile:r.urlMobile,statut:'Enabled',etiquettes:''});
  });
  xlLire(xlOnglet(wb,'Mots-cl\u00e9s'),XL_KW).forEach(function(r){ trouve++; N.motsCles.push({campagne:r.campagne,groupe:r.groupe,texte:r.texte,correspondance:r.correspondance||'Broad'}); });
  xlLire(xlOnglet(wb,'N\u00e9gatifs'),XL_NG).forEach(function(r){ trouve++; N.negatifs.push({campagne:r.campagne,groupe:r.groupe,texte:r.texte,correspondance:r.correspondance||'Phrase'}); });
  xlLire(xlOnglet(wb,'Liens annexes'),XL_SL).forEach(function(r){ trouve++; N.sitelinks.push({campagne:r.campagne,groupe:r.groupe,texte:r.texte,desc1:r.desc1,desc2:r.desc2,urlFinale:r.urlFinale}); });
  xlLire(xlOnglet(wb,'Accroches'),XL_CO).forEach(function(r){ trouve++; N.callouts.push({campagne:r.campagne,texte:r.texte}); });
  xlLire(xlOnglet(wb,'Extraits'),XL_SN).forEach(function(r){ trouve++; N.snippets.push({campagne:r.campagne,entete:r.entete,valeurs:String(r.valeurs||'').split(';').map(function(x){return x.trim();}).filter(Boolean)}); });
  xlLire(xlOnglet(wb,'Performance Max'),XL_AG).forEach(function(r){
    trouve++;
    var t=[],l=[],d=[];
    for(var i=1;i<=15;i++) if(r['t'+i]) t.push(r['t'+i]);
    for(var j=1;j<=5;j++) if(r['l'+j]) l.push(r['l'+j]);
    for(var k=1;k<=5;k++) if(r['d'+k]) d.push(r['d'+k]);
    N.assetGroups.push({campagne:r.campagne,nom:r.nom,statut:r.statut||'Paused',urlFinale:r.urlFinale,titres:t,titresLongs:l,descriptions:d,nomEntreprise:r.nomEntreprise,cta:r.cta,path1:r.path1,path2:r.path2});
  });
  return trouve ? N : null;
}

function cnt(t,max){
  var n=(t||'').length, over=n>max;
  return '<span class="dc'+(over?' dcbad':'')+'">'+n+'/'+max+'</span>';
}
function deckHTML(){
  var client=$('o_client').value||'', dem=$('o_demande').value||'';
  var auj=new Date().toISOString().slice(0,10);
  var INK='#111114', INK3='#7b7b86', LINE='#e4e4ea', BG='#f6f6f8', ACC='#FFE81A', RED='#c9342a', GRN='#0f7040';
  var H='';
  function kvTable(rows){
    var t='<table class="kv">';
    rows.forEach(function(x){ if(x[1]) t+='<tr><th>'+esc(x[0])+'</th><td>'+esc(x[1])+'</td></tr>'; });
    return t+'</table>';
  }
  function lst(titre, items, max){
    if(!items.length) return '';
    var t='<h4>'+esc(T(titre))+'</h4><table class="lst">';
    items.forEach(function(it,ix){
      t+='<tr><td class="num">'+(ix+1)+'</td><td>'+it.html+'</td><td class="cc">'+(max?cnt(it.txt,max):esc(it.meta||''))+'</td></tr>';
    });
    return t+'</table>';
  }
  var camps=D.campagnes.filter(function(c){return c.nom;});
  // Resume du plan
  var nbG=D.groupes.filter(function(g){return g.nom;}).length;
  var nbA=D.rsas.filter(function(r){return r.titres&&r.titres.some(function(x){return x.texte;});}).length;
  H+='<section class="camp"><h3>'+esc(T('R\u00e9sum\u00e9 du plan'))+'</h3>'
    + kvTable([[T('Campagnes'),String(camps.length)+' : '+camps.map(function(c){return c.type;}).filter(function(v,i,a){return a.indexOf(v)===i;}).join(', ')],
               [T('Groupes'),nbG?String(nbG):''],[T('Annonces'),nbA?String(nbA):''],
               [T('Groupes d\u2019assets'),D.assetGroups.length?String(D.assetGroups.length):''],
               [T('Mots-cl\u00e9s (total)'),D.motsCles.length?D.motsCles.length+' ('+D.negatifs.length+' '+T('n\u00e9gatif(s)')+')':''],
               [T('Extensions (total)'),(D.sitelinks.length+D.callouts.length+D.snippets.length)?(D.sitelinks.length+' '+T('lien(s)')+', '+D.callouts.length+' '+T('accroche(s)')+', '+D.snippets.length+' '+T('extrait(s)')):'']])
    + '</section>';
  camps.forEach(function(c){
    H+='<section class="camp"><h2><span class="hl">'+esc(c.nom)+'</span> <span class="typepill">'+esc(c.type)+'</span></h2>';
    H+='<h3>'+esc(T('R\u00e9glages de campagne'))+'</h3>';
    var strat=c.strategiePortefeuille||c.strategieEncheres||'';
    var cible=[c.targetCpa?'CPA '+c.targetCpa:'',c.targetRoas?'ROAS '+c.targetRoas+' %':'',c.partImpressionPct?(c.partImpressionEmplacement||'IS')+' '+c.partImpressionPct+' %':''].filter(Boolean).join(' / ');
    var ai=(c.aiMax&&c.aiMax.actif)?'AI Max'+(c.aiMax.exclusionsMarque?' ('+T('Exclusions de marque')+' : '+c.aiMax.exclusionsMarque+')':''):'';
    H+=kvTable([[T('Type de campagne'),c.type],[T('Statut'),c.statut],[T('Budget quotidien'),c.budgetQuotidien],
            [T('Strat\u00e9gie d\u2019ench\u00e8res'),strat],[T('Cible'),cible],[T('Plafond CPC'),c.plafondCPC],
            [T('R\u00e9seaux'),c.reseaux],[T('Langues'),c.langues],
            [T('P\u00e9riode'),(c.dateDebut||'')+(c.dateFin?' > '+c.dateFin:'')],
            [T('Calendrier de diffusion'),c.calendrier||T('en continu')],
            [T('Localisations'),(c.localisations||[]).filter(function(l){return l.id||l.nom;}).map(function(l){return (l.nom||l.id)+(l.exclue?' (excl.)':'');}).join(', ')],
            ['AI Max',ai],[T('\u00c9tiquettes'),c.etiquettes],[T('Commentaire'),c.commentaire]]);
    D.groupes.forEach(function(g,gi){
      if(g.campagne!==c.nom||!g.nom) return;
      var r=D.rsas[gi]||{titres:[],descriptions:[]};
      H+='<h3>'+esc(T('Groupe d\u2019annonces'))+' : '+esc(g.nom)+'</h3>';
      var titres=r.titres.filter(function(x){return x.texte;}), descs=r.descriptions.filter(function(x){return x.texte;});
      if(titres.length){
        var t3=titres.slice(0,3).map(function(x){return esc(x.texte);}).join(' | ');
        var d2=descs.slice(0,2).map(function(x){return esc(x.texte);}).join(' ');
        var dom=(r.urlFinale||'').replace(/^https?:\/\//,'').replace(/\/.*/,'');
        H+='<table class="serp"><tr><td><div class="slab">'+esc(T('Aper\u00e7u Google'))+'</div>'
          +'<div class="surl">'+esc(dom)+(r.path1?'/'+esc(r.path1):'')+(r.path2?'/'+esc(r.path2):'')+'</div>'
          +'<div class="stitre">'+t3+'</div><div class="sdesc">'+d2+'</div></td></tr></table>';
        H+=kvTable([[T('URL finale'),r.urlFinale],[T('Chemins'),[r.path1,r.path2].filter(Boolean).join(' / ')],[T('Statut'),g.statut],['Max CPC',g.maxCPC]]);
      }
      H+=lst('Titres', titres.map(function(x){return {html:esc(x.texte)+(x.pin?' <span class="pin">PIN '+esc(x.pin)+'</span>':''),txt:x.texte};}), 30);
      H+=lst('Descriptions', descs.map(function(x){return {html:esc(x.texte)+(x.pin?' <span class="pin">PIN '+esc(x.pin)+'</span>':''),txt:x.texte};}), 90);
      var kws=D.motsCles.filter(function(m){return m.campagne===c.nom&&m.groupe===g.nom;});
      H+=lst('Mots-cl\u00e9s', kws.map(function(m){return {html:esc(m.texte),meta:m.correspondance};}));
    });
    var negs=D.negatifs.filter(function(m){return m.campagne===c.nom;});
    H+=lst('Mots-cl\u00e9s \u00e0 exclure', negs.map(function(m){return {html:esc(m.texte)+(m.groupe?' <span class="pin">'+esc(m.groupe)+'</span>':''),meta:m.correspondance};}));
    var sls=D.sitelinks.filter(function(x){return x.campagne===c.nom||x.campagne==='<Account-level>';});
    H+=lst('Liens annexes', sls.map(function(x){return {html:'<b>'+esc(x.texte)+'</b> '+cnt(x.texte,25)+(x.desc1?'<br>'+esc(x.desc1):'')+(x.desc2?'<br>'+esc(x.desc2):''),meta:x.urlFinale};}));
    var cos=D.callouts.filter(function(x){return x.campagne===c.nom||x.campagne==='<Account-level>';});
    H+=lst('Accroches', cos.map(function(x){return {html:esc(x.texte),txt:x.texte};}), 25);
    var sns=D.snippets.filter(function(x){return x.campagne===c.nom||x.campagne==='<Account-level>';});
    H+=lst('Extraits de site', sns.map(function(x){return {html:'<b>'+esc(x.entete)+'</b> : '+esc((x.valeurs||[]).join(' ; '))};}));
    D.assetGroups.forEach(function(a){
      if(a.campagne!==c.nom||!a.nom) return;
      H+='<h3>'+esc(T('Groupes d\u2019assets'))+' : '+esc(a.nom)+'</h3>';
      H+=kvTable([[T('Nom de l\u2019entreprise'),a.nomEntreprise],[T('URL finale'),a.urlFinale],[T('Chemins'),[a.path1,a.path2].filter(Boolean).join(' / ')],
                  [T('Incitation \u00e0 l\u2019action'),a.cta||'Automated'],[T('Statut'),a.statut]]);
      H+=lst('Titres', (a.titres||[]).filter(Boolean).map(function(t){return {html:esc(t),txt:t};}), 30);
      H+=lst('Titres longs', (a.titresLongs||[]).filter(Boolean).map(function(t){return {html:esc(t),txt:t};}), 90);
      H+=lst('Descriptions', (a.descriptions||[]).filter(Boolean).map(function(t){return {html:esc(t),txt:t};}), 90);
    });
    H+='</section>';
  });
  return '<!DOCTYPE html><html lang="'+LANG+'"><head><meta charset="utf-8"><title>'+esc(client||'Plan SEM')+'</title><style>'
    +'body{font-family:Arial,Helvetica,sans-serif;font-size:13px;line-height:1.5;color:'+INK+';margin:0;padding:28px 24px;background:'+BG+'}'
    +'.page{max-width:900px;margin:0 auto}'
    +'header{background:'+INK+';color:#ffffff;padding:20px 24px;margin-bottom:18px;border-radius:10px}'
    +'header h1{margin:0;font-size:19px;font-weight:bold}'
    +'header .hl{background:'+ACC+';color:'+INK+';padding:2px 8px;border-radius:5px}'
    +'header p{margin:8px 0 0;font-size:12px;color:#c9c9d2}'
    +'section.camp{background:#ffffff;border:1px solid '+LINE+';border-radius:10px;padding:20px 24px;margin-bottom:16px;page-break-inside:avoid}'
    +'h2{font-size:16px;font-weight:bold;margin:0 0 4px}'
    +'h2 .hl{background:'+ACC+';padding:2px 8px;border-radius:5px}'
    +'.typepill{font-size:10px;background:'+INK+';color:#ffffff;padding:3px 9px;border-radius:12px;letter-spacing:.5px;font-weight:bold}'
    +'h3{font-size:11px;background:'+INK+';color:'+ACC+';display:inline-block;padding:5px 12px;letter-spacing:1.3px;text-transform:uppercase;margin:18px 0 8px;border-radius:6px}'
    +'h4{font-size:11px;letter-spacing:1px;text-transform:uppercase;color:'+INK3+';margin:14px 0 4px}'
    +'table{border-collapse:collapse;width:100%}'
    +'.kv th{text-align:left;font-size:11.5px;color:'+INK3+';padding:5px 14px 5px 0;white-space:nowrap;vertical-align:top;width:170px;font-weight:bold}'
    +'.kv td{padding:5px 0;border-bottom:1px solid '+LINE+'}'
    +'.lst td{padding:6px 8px;border-bottom:1px solid '+LINE+';vertical-align:top}'
    +'.lst .num{width:24px;color:'+INK3+';font-size:11px}'
    +'.lst .cc{text-align:right;white-space:nowrap;color:'+INK3+';font-size:11px;width:150px}'
    +'.dc{font-size:11px;color:'+GRN+';font-weight:bold}.dcbad{color:'+RED+';font-weight:bold}'
    +'.pin{font-size:10px;background:'+INK+';color:'+ACC+';padding:1px 6px;border-radius:4px;font-weight:bold}'
    +'.serp{border:1.5px solid '+LINE+';border-radius:10px;margin:8px 0 6px;max-width:620px;background:#ffffff}'
    +'.serp td{padding:14px 16px}'
    +'.slab{font-size:10px;letter-spacing:1.2px;text-transform:uppercase;color:'+INK3+';margin-bottom:6px;font-weight:bold}'
    +'.surl{font-size:12px;color:#202124}.stitre{font-size:17px;color:#1a0dab;margin:2px 0}.sdesc{font-size:12.5px;color:#4d5156}'
    +'.note{font-size:12px;color:'+INK3+';margin:0}'
    +'@media print{body{background:#ffffff;padding:8mm}}'
    +'</style></head><body><div class="page">'
    +'<header><h1><span class="hl">'+esc(T('Plan SEM pour approbation'))+'</span>'+(client?' : '+esc(client):'')+'</h1>'
    +'<p>'+(dem?esc(T('Num\u00e9ro de demande'))+' '+esc(dem)+' | ':'')+esc(T('G\u00e9n\u00e9r\u00e9 le'))+' '+auj+'</p></header>'
    +H+'</div></body></html>';
}



/* ---- API exportee ---- */
export function avecContexte(plan, options, langue){
  D = plan; OPTS = options || {}; LANG = langue || "fr";
}
export function lireExportEditor(texte){ return edLireExport(texte); }
export function decoderExport(buf){ return edDecoder(buf); }
export function resumeExport(cpt){ return edResume(cpt); }
export function classeurExcel(mode){ return deckExcelWorkbook(mode); }
export function lireClasseurExcel(wb){ return importExcelWorkbook(wb); }
export function deckClientHTML(){ return deckHTML(); }
