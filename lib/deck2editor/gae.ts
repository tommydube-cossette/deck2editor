/* eslint-disable */
// @ts-nocheck
/* Moteur Deck2Editor, porte tel quel depuis Code.gs (Apps Script). Ne pas modifier sans re-tester. */
/* ============================================================================
   DECK -> GOOGLE ADS EDITOR  |  MOTEUR DE GENERATION
   Coeur pur JavaScript (ES5 compatible Apps Script V8). Aucune dependance.
   ========================================================================== */

const GAE = (function () {

  /* ---------------------------------------------------------------- CONSTANTES */

  var LIMITES = {
    rsaTitre: 30, rsaDescription: 90, path: 15,
    rsaTitresMin: 3, rsaTitresMax: 15, rsaDescMin: 2, rsaDescMax: 4,
    sitelinkTexte: 25, sitelinkDesc: 35,
    calloutTexte: 25,
    snippetValeur: 25, snippetValMin: 3, snippetValMax: 10,
    pmaxTitre: 30, pmaxTitreLong: 90, pmaxDescription: 90, pmaxDescCourte: 60,
    pmaxTitresMin: 3, pmaxTitresMax: 15,
    pmaxTitresLongsMin: 1, pmaxTitresLongsMax: 5,
    pmaxDescMin: 2, pmaxDescMax: 5,
    nomEntreprise: 25,
    motCle: 80, motCleMots: 10,
    nomCampagne: 255, nomGroupe: 255
  };

  // En-tetes d'extraits de site acceptes par Google (EN + FR).
  var SNIPPET_HEADERS = {
    en: ['Amenities','Brands','Courses','Degree programs','Destinations','Featured hotels',
         'Insurance coverage','Models','Neighborhoods','Service catalog','Shows','Styles','Types'],
    fr: ['Aménagements','Marques','Cours','Programmes d\'études','Destinations','Hôtels vedettes',
         'Couverture d\'assurance','Modèles','Quartiers','Catalogue de services','Spectacles','Styles','Types']
  };

  var CTA_PMAX = ['Learn more','Get quote','Apply now','Sign up','Contact us','Subscribe',
                  'Download','Book now','Order now','Shop now','Play now','See more',
                  'Start now','Visit site','Watch now','Automated'];

  var BID_STRATEGIES = ['Manual CPC','Manual CPM','Manual CPV','Maximize clicks',
                        'Maximize conversions','Maximize conversion value',
                        'Target CPA','Target ROAS','Target impression share'];

  var CAMPAIGN_TYPES = ['Search','Display','Shopping','Video','Performance Max',
                        'Demand Gen','Display - Smart','Search - Mobile app installs'];

  // Types dont le contenu (annonces, mots-cles, assets) est entierement couvert par l'outil.
  // Les autres types passent par le CSV pour la ligne de campagne seulement.
  var TYPES_COUVERTS = ['Search','Performance Max'];

  var MATCH_TYPES = ['Broad','Phrase','Exact'];
  var NEG_MATCH_TYPES = ['Negative Broad','Negative Phrase','Negative Exact'];
  var CAMP_NEG_MATCH_TYPES = ['Campaign Negative Broad','Campaign Negative Phrase','Campaign Negative Exact'];

  /* ---------------------------------------------------------------- UTILITAIRES */

  function s(v) { return (v === null || v === undefined) ? '' : String(v); }
  function trim(v) { return s(v).replace(/^[\s\u00A0]+|[\s\u00A0]+$/g, ''); }
  function isBlank(v) { return trim(v) === ''; }

  // Normalise les caracteres invisibles / typographiques qui font planter les imports.
  function nettoyer(v) {
    var t = s(v);
    t = t.replace(/\uFEFF/g, '');                 // BOM
    t = t.replace(/[\u00A0\u2007\u202F]/g, ' ');  // espaces insecables
    t = t.replace(/[\u200B-\u200D\u2060]/g, '');  // largeur nulle
    t = t.replace(/[\r\n\t]+/g, ' ');             // sauts de ligne / tabs dans une cellule
    t = t.replace(/ {2,}/g, ' ');
    return trim(t);
  }

  // Google compte 2 caracteres pour les langues double largeur (CJK).
  function longueurGoogle(v) {
    var t = s(v), n = 0;
    for (var i = 0; i < t.length; i++) {
      var c = t.charCodeAt(i);
      n += (c >= 0x1100 && (c <= 0x115F || (c >= 0x2E80 && c <= 0xA4CF) ||
            (c >= 0xAC00 && c <= 0xD7A3) || (c >= 0xF900 && c <= 0xFAFF) ||
            (c >= 0xFE30 && c <= 0xFE6F) || (c >= 0xFF00 && c <= 0xFF60) ||
            (c >= 0xFFE0 && c <= 0xFFE6))) ? 2 : 1;
    }
    return n;
  }

  function estDateISO(v) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(s(v))) return false;
    var p = s(v).split('-'), d = new Date(Date.UTC(+p[0], +p[1] - 1, +p[2]));
    return d.getUTCFullYear() === +p[0] && (d.getUTCMonth() + 1) === +p[1] && d.getUTCDate() === +p[2];
  }

  function estURL(v) { return /^https?:\/\/[^\s"'<>]+$/i.test(trim(v)); }

  // Nombre "44,64 $" / "1 234,56" / "$44.64" -> 44.64
  function nombre(v) {
    if (typeof v === 'number') return v;
    var t = s(v).replace(/[^\d,.\-]/g, '');
    if (t.indexOf(',') > -1 && t.indexOf('.') > -1) {
      t = (t.lastIndexOf(',') > t.lastIndexOf('.')) ? t.replace(/\./g, '').replace(',', '.') : t.replace(/,/g, '');
    } else if (t.indexOf(',') > -1) {
      t = t.replace(',', '.');
    }
    var n = parseFloat(t);
    return isNaN(n) ? null : n;
  }

  function money(v) { var n = nombre(v); return n === null ? '' : (Math.round(n * 100) / 100).toFixed(2); }

  function uniq(arr) {
    var vu = {}, out = [];
    for (var i = 0; i < arr.length; i++) { var k = arr[i]; if (!vu[k]) { vu[k] = 1; out.push(k); } }
    return out;
  }

  /* ---------------------------------------------------------------- CSV / TSV */

  function champCSV(v) {
    var t = s(v);
    if (t === '') return '';
    if (/[",\r\n]/.test(t)) return '"' + t.replace(/"/g, '""') + '"';
    return t;
  }

  function versCSV(entetes, lignes) {
    var out = [entetes.map(champCSV).join(',')];
    for (var i = 0; i < lignes.length; i++) {
      var l = lignes[i], r = [];
      for (var j = 0; j < entetes.length; j++) r.push(champCSV(l[entetes[j]]));
      out.push(r.join(','));
    }
    return out.join('\r\n') + '\r\n';
  }

  // Version "Coller le texte" de Google Ads Editor : separateur tabulation.
  function versTSV(entetes, lignes) {
    var nett = function (v) { return s(v).replace(/[\t\r\n]+/g, ' '); };
    var out = [entetes.join('\t')];
    for (var i = 0; i < lignes.length; i++) {
      var l = lignes[i], r = [];
      for (var j = 0; j < entetes.length; j++) r.push(nett(l[entetes[j]]));
      out.push(r.join('\t'));
    }
    return out.join('\r\n') + '\r\n';
  }

  // Retire les colonnes entierement vides (Editor n'aime pas les colonnes fantomes),
  // en conservant l'ordre d'origine et les colonnes d'identification.
  var COLONNES_ID = ['Campaign','Ad Group','Asset Group'];
  function colonnesUtiles(entetes, lignes) {
    var g = [];
    for (var j = 0; j < entetes.length; j++) {
      var h = entetes[j], plein = (COLONNES_ID.indexOf(h) > -1);
      if (!plein) {
        for (var i = 0; i < lignes.length; i++) { if (!isBlank(lignes[i][h])) { plein = true; break; } }
      }
      if (plein) g.push(h);
    }
    return g;
  }

  /* ---------------------------------------------------------------- RAPPORT */

  function Rapport() {
    this.erreurs = []; this.avertissements = []; this.infos = [];
  }
  Rapport.prototype.err = function (bloc, msg, ref) {
    this.erreurs.push({ bloc: bloc, message: msg, ref: s(ref) });
  };
  Rapport.prototype.avert = function (bloc, msg, ref) {
    this.avertissements.push({ bloc: bloc, message: msg, ref: s(ref) });
  };
  Rapport.prototype.info = function (bloc, msg) { this.infos.push({ bloc: bloc, message: msg }); };

  /* ---------------------------------------------------------------- VALIDATION TEXTE */

  // Regles editoriales Google Ads sur les textes d'annonce.
  function validerTexteAnnonce(rap, bloc, ref, txt, limite, opts) {
    opts = opts || {};
    var t = nettoyer(txt);
    if (t === '') return t;

    var n = longueurGoogle(t);
    if (n > limite) rap.err(bloc, 'Depasse ' + limite + ' caracteres (' + n + ') : "' + t + '"', ref);

    // Ponctuation excessive
    var bangs = (t.match(/!/g) || []).length;
    if (opts.aucunPointExclamation && bangs > 0) {
      rap.err(bloc, 'Point d\'exclamation interdit dans un titre : "' + t + '"', ref);
    } else if (bangs > 1) {
      rap.err(bloc, 'Plus d\'un point d\'exclamation : "' + t + '"', ref);
    }
    if (/[.!?]{2,}/.test(t)) rap.err(bloc, 'Ponctuation repetee : "' + t + '"', ref);

    // MAJUSCULES abusives (mot de 3+ lettres tout en majuscules, hors sigles connus)
    var mots = t.split(/\s+/);
    for (var i = 0; i < mots.length; i++) {
      var m = mots[i].replace(/[^A-Za-zÀ-ÖØ-Þ]/g, '');
      if (m.length >= 4 && m === m.toUpperCase() && m !== m.toLowerCase()) {
        rap.avert(bloc, 'Mot en majuscules (risque de refus) : "' + mots[i] + '"', ref);
      }
    }

    // Emojis / symboles non supportes
    if (/[\u2190-\u21FF\u2300-\u23FF\u25A0-\u27BF\u2B00-\u2BFF\uFE0F]|[\uD800-\uDBFF][\uDC00-\uDFFF]/.test(t)) {
      rap.err(bloc, 'Emoji ou symbole non supporte : "' + t + '"', ref);
    }

    // Accolades non fermees (ad customizers / IF functions)
    var ouv = (t.match(/\{/g) || []).length, fer = (t.match(/\}/g) || []).length;
    if (ouv !== fer) rap.err(bloc, 'Accolades desequilibrees (personnalisateur) : "' + t + '"', ref);

    if (/^[-–—•,;:]/.test(t)) rap.avert(bloc, 'Commence par un signe de ponctuation : "' + t + '"', ref);
    return t;
  }

  /* ---------------------------------------------------------------- BLOCS CSV */

  var H_CAMP = ['Campaign','Campaign Type','Campaign Status','Campaign Daily Budget','Budget period',
    'Delivery method','Bid Strategy Type','Bid Strategy Name','Target CPA','Target ROAS',
    'Maximum CPC bid limit','Target impression share','Target impression share location','Networks',
    'Languages','Start Date','End Date','Ad Schedule','Ad rotation','Bid Modifier','Desktop Bid Modifier',
    'Tablet Bid Modifier','Tracking template','Final URL suffix','Custom parameters','Labels','Comment'];

  var H_LOC = ['Campaign','Location','Location ID','Type','Bid Modifier'];

  var H_AG = ['Campaign','Ad Group','Ad Group Status','Max CPC','Target CPA','Ad rotation','Labels','Comment'];

  var H_KW = ['Campaign','Ad Group','Keyword','Criterion Type','Max CPC','Final URL','Status','Labels'];

  var H_NEG = ['Campaign','Ad Group','Keyword','Criterion Type'];

  var H_RSA = (function () {
    var h = ['Campaign','Ad Group','Ad type'];
    for (var i = 1; i <= 15; i++) { h.push('Headline ' + i); h.push('Headline ' + i + ' position'); }
    for (var j = 1; j <= 4; j++) { h.push('Description ' + j); h.push('Description ' + j + ' position'); }
    return h.concat(['Path 1','Path 2','Final URL','Final mobile URL','Tracking template',
                     'Final URL suffix','Custom parameters','Status','Labels']);
  })();

  var H_SL = ['Campaign','Ad Group','Sitelink text','Description Line 1','Description Line 2',
              'Final URL','Final mobile URL','Start Date','End Date','Ad Schedule','Device Preference','Status'];

  var H_CO = ['Campaign','Ad Group','Callout text','Start Date','End Date','Ad Schedule','Device Preference','Status'];

  var H_SNIP = ['Campaign','Ad Group','Header','Values','Value 1','Value 2','Value 3','Value 4','Value 5','Value 6','Value 7','Value 8','Value 9','Value 10','Status'];

  var H_AGRP = (function () {
    var h = ['Campaign','Asset Group','Asset group status','Final URL'];
    for (var i = 1; i <= 15; i++) h.push('Headline ' + i);
    for (var j = 1; j <= 5; j++) h.push('Long headline ' + j);
    for (var k = 1; k <= 5; k++) h.push('Description ' + k);
    return h.concat(['Business name','Call to action','Path 1','Path 2']);
  })();

  /* ---------------------------------------------------------------- GENERATEUR */

  function generer(deck) {
    var rap = new Rapport();
    deck = deck || {};
    var opt = deck.options || {};
    var langueSnippets = opt.langueSnippets || 'fr';
    var inclureAdType = (opt.inclureAdType !== false);

    var campagnes = deck.campagnes || [];
    var groupes   = deck.groupes || [];
    var motsCles  = deck.motsCles || [];
    var negatifs  = deck.negatifs || [];
    var rsas      = deck.rsas || [];
    var sitelinks = deck.sitelinks || [];
    var callouts  = deck.callouts || [];
    var snippets  = deck.snippets || [];
    var assetGrps = deck.assetGroups || [];

    // BOM UTF-8 : indispensable pour que Google Ads Editor (Windows, locale FR) lise
    // les accents correctement. Sans lui, "Sepaq" devenait "SÃ©paq" a l'import.
    var BOM = '\uFEFF';
    var nomsCampagnes = {}, cleGroupes = {}, typeCampagne = {}, budgetsProvisoires = [], nomsEntreprisePMax = [], typesNonCouverts = [];

    /* ---------- CAMPAGNES ---------- */
    var lCamp = [], lLoc = [];
    for (var i = 0; i < campagnes.length; i++) {
      var c = campagnes[i], ref = 'Campagne #' + (i + 1);
      var nom = nettoyer(c.nom);
      if (isBlank(nom)) { rap.err('Campagnes', 'Nom de campagne manquant.', ref); continue; }
      if (longueurGoogle(nom) > LIMITES.nomCampagne) rap.err('Campagnes', 'Nom > 255 caracteres.', nom);
      if (nomsCampagnes[nom.toLowerCase()]) rap.err('Campagnes', 'Nom de campagne en double.', nom);
      nomsCampagnes[nom.toLowerCase()] = true;
      ref = nom;

      var type = nettoyer(c.type) || 'Search';
      if (CAMPAIGN_TYPES.indexOf(type) === -1) {
        rap.avert('Campagnes', 'Type de campagne inhabituel : "' + type + '".', ref);
      }
      if (TYPES_COUVERTS.indexOf(type) === -1) {
        // Le CSV cree la campagne et ses reglages, mais l'outil ne genere ni annonces,
        // ni assets, ni ciblages propres a ce type : la campagne arrive vide dans Editor.
        rap.avert('Campagnes', 'Type "' + type + '" : seule la ligne de campagne (reglages, budget, ciblage) est exportee. Annonces, assets et ciblages propres a ce type sont a creer dans Editor apres l\'import (rappel dans la checklist).', ref);
        typesNonCouverts.push(nom + ' (' + type + ')'); rap.typesNonCouverts = typesNonCouverts;
      }
      typeCampagne[nom.toLowerCase()] = type;

      var budget = money(c.budgetQuotidien);
      if (budget === '' || nombre(budget) <= 0) {
        // Editor exige un budget > 0 pour creer une campagne. Plutot que de bloquer,
        // on ecrit un budget provisoire de 1.00 (campagne en pause) et on le signale :
        // a ajuster dans Editor ou l'interface avant activation.
        budget = '1.00';
        rap.avert('Campagnes', 'Budget quotidien absent : 1.00 ecrit provisoirement pour que l\'import passe. A ajuster dans Editor avant activation (rappel dans la checklist).', ref);
        budgetsProvisoires.push(nom); rap.budgetsProvisoires = budgetsProvisoires;
      }

      var strat = nettoyer(c.strategieEncheres);
      var stratNom = nettoyer(c.strategiePortefeuille);
      if (isBlank(stratNom)) {
        if (isBlank(strat)) rap.err('Campagnes', 'Strategie d\'encheres manquante.', ref);
        else if (BID_STRATEGIES.indexOf(strat) === -1) rap.err('Campagnes', 'Strategie non reconnue par Editor : "' + strat + '". Valeurs valides : ' + BID_STRATEGIES.join(', ') + '.', ref);
      } else if (!isBlank(strat)) {
        rap.avert('Campagnes', 'Strategie de portefeuille fournie : la colonne "Bid Strategy Type" sera ignoree par Editor.', ref);
      }

      // Coherence cible / strategie
      var tcpa = money(c.targetCpa), troas = c.targetRoas ? (nombre(c.targetRoas)) : null;
      if (strat === 'Target CPA' && tcpa === '') rap.err('Campagnes', 'Target CPA choisi mais aucune valeur de CPA cible.', ref);
      if (strat === 'Target ROAS' && (troas === null)) rap.err('Campagnes', 'Target ROAS choisi mais aucune valeur de ROAS cible.', ref);
      if (strat !== 'Target CPA' && tcpa !== '') rap.avert('Campagnes', 'CPA cible renseigne mais strategie = ' + strat + '.', ref);
      if (strat === 'Target impression share') {
        var tisLoc = nettoyer(c.partImpressionEmplacement);
        var tisPct = nombre(c.partImpressionPct);
        if (['Anywhere on results page','Top of results page','Absolute Top of results page'].indexOf(tisLoc) === -1) {
          rap.err('Campagnes', 'Emplacement de part d\'impression invalide. Valeurs : Anywhere on results page / Top of results page / Absolute Top of results page.', ref);
        }
        if (tisPct === null || tisPct <= 0 || tisPct > 100) rap.err('Campagnes', 'Pourcentage de part d\'impression cible invalide (1-100).', ref);
      }
      if (!isBlank(c.eCPC)) {
        rap.avert('Campagnes', 'Enhanced CPC a ete retire par Google (migration vers Manual CPC terminee en mars 2025). La valeur est ignoree.', ref);
      }
      var diffu = nettoyer(c.diffusion) || 'Standard';
      if (diffu === 'Accelerated') {
        rap.avert('Campagnes', 'La diffusion "Accelerated" n\'existe plus chez Google (retiree en 2020). "Standard" sera ecrit a la place.', ref);
        diffu = 'Standard';
      }

      // Dates
      var d1 = trim(c.dateDebut), d2 = trim(c.dateFin);
      if (!isBlank(d1) && !estDateISO(d1)) rap.err('Campagnes', 'Date de debut non conforme (AAAA-MM-JJ) : "' + d1 + '".', ref);
      if (!isBlank(d2) && !estDateISO(d2)) rap.err('Campagnes', 'Date de fin non conforme (AAAA-MM-JJ) : "' + d2 + '".', ref);
      if (estDateISO(d1) && estDateISO(d2) && d2 < d1) rap.err('Campagnes', 'Date de fin anterieure a la date de debut.', ref);
      if (estDateISO(d1) && opt.aujourdhui && d1 < opt.aujourdhui) {
        rap.err('Campagnes', 'Date de debut dans le passe (' + d1 + '). Editor refuse une date anterieure a aujourd\'hui pour une nouvelle campagne.', ref);
      }

      // Calendrier
      var sched = trim(c.calendrier);
      if (!isBlank(sched) && !validerCalendrier(sched)) {
        rap.err('Campagnes', 'Format de calendrier invalide. Attendu : (Monday[08:00-17:30]);(Friday@80%[08:00-17:30]).', ref);
      }

      // Reseaux
      var nets = trim(c.reseaux);
      if (!isBlank(nets)) {
        var okNets = ['Google Search','Search Partners','Search','Display','Select','YouTube Search','YouTube Videos','Video Partners'];
        var parts = nets.split(';');
        for (var n = 0; n < parts.length; n++) {
          if (okNets.indexOf(trim(parts[n])) === -1) rap.err('Campagnes', 'Reseau non reconnu : "' + trim(parts[n]) + '".', ref);
        }
      }

      // Langues
      var langues = trim(c.langues);
      if (!isBlank(langues) && !/^[a-z]{2}(-[A-Za-z]{2})?(;[a-z]{2}(-[A-Za-z]{2})?)*$/.test(langues)) {
        rap.err('Campagnes', 'Codes de langue attendus separes par ";" (ex. fr ou fr;en).', ref);
      }

      // Modificateurs d'encheres
      ['modifMobile','modifOrdinateur','modifTablette'].forEach(function (k) {
        if (!isBlank(c[k])) {
          var v = nombre(c[k]);
          if (v === null || v < -90 || v > 900) rap.err('Campagnes', 'Modificateur d\'encheres hors plage (-90 a +900) : ' + c[k], nom);
        }
      });

      // Suivi
      if (!isBlank(c.trackingTemplate) && !/\{lpurl\}/i.test(c.trackingTemplate)) {
        rap.avert('Campagnes', 'Modele de suivi sans {lpurl}.', ref);
      }

      // Declaration UE (bloc obligatoire depuis 2025-2026)
      var ue = nettoyer(c.politiqueUE);
      if (['Oui','Non','Yes','No'].indexOf(ue) === -1) {
        rap.err('Campagnes', 'Declaration "Annonces politiques UE" manquante. Sans elle, la campagne ne peut pas etre publiee (UI, Editor et API la refusent).', ref);
      }

      lCamp.push({
        'Campaign': nom,
        'Campaign Type': type,
        'Campaign Status': nettoyer(c.statut) || 'Paused',
        'Campaign Daily Budget': budget,
        'Budget period': nettoyer(c.periodeBudget) || 'Daily',
        'Delivery method': diffu,
        'Bid Strategy Type': isBlank(stratNom) ? strat : '',
        'Bid Strategy Name': stratNom,
        'Target CPA': tcpa,
        'Target ROAS': (troas === null ? '' : troas + '%'),
        'Maximum CPC bid limit': money(c.plafondCPC),
        'Target impression share': (nombre(c.partImpressionPct) === null ? '' : nombre(c.partImpressionPct) + '%'),
        'Target impression share location': nettoyer(c.partImpressionEmplacement),
        'Networks': nets,
        'Languages': langues,
        'Start Date': d1,
        'End Date': d2,
        'Ad Schedule': sched,
        'Ad rotation': nettoyer(c.rotation),
        'Bid Modifier': isBlank(c.modifMobile) ? '' : nombre(c.modifMobile) + '%',
        'Desktop Bid Modifier': isBlank(c.modifOrdinateur) ? '' : nombre(c.modifOrdinateur) + '%',
        'Tablet Bid Modifier': isBlank(c.modifTablette) ? '' : nombre(c.modifTablette) + '%',
        'Tracking template': nettoyer(c.trackingTemplate),
        'Final URL suffix': nettoyer(c.suffixeURL),
        'Custom parameters': nettoyer(c.parametresPerso),
        'Labels': nettoyer(c.etiquettes),
        'Comment': nettoyer(c.commentaire)
      });

      // Localisations : une par ligne, fichier separe.
      var locs = c.localisations || [];
      if (!locs.length) rap.avert('Localisations', 'Aucune localisation : la campagne diffusera partout dans le monde.', ref);
      for (var L = 0; L < locs.length; L++) {
        var lo = locs[L];
        var idLoc = trim(lo.id), nomLoc = nettoyer(lo.nom);
        if (isBlank(idLoc) && isBlank(nomLoc)) { rap.err('Localisations', 'Ligne de localisation vide.', ref); continue; }
        if (!isBlank(idLoc) && !/^\d+$/.test(idLoc)) rap.err('Localisations', 'ID de localisation non numerique : "' + idLoc + '".', ref);
        if (isBlank(idLoc)) rap.avert('Localisations', 'Localisation par nom ("' + nomLoc + '") : a resoudre manuellement dans Editor. Un ID numerique est plus sur.', ref);
        if (!isBlank(lo.modif)) {
          var mv = nombre(lo.modif);
          if (mv === null || mv < -90 || mv > 900) rap.err('Localisations', 'Modificateur hors plage (-90 a +900).', ref);
        }
        lLoc.push({
          'Campaign': nom,
          'Location': nomLoc,
          'Location ID': idLoc,
          'Type': lo.exclue ? 'Negative' : '',
          'Bid Modifier': isBlank(lo.modif) ? '' : nombre(lo.modif) + '%'
        });
      }
    }

    /* ---------- GROUPES D'ANNONCES ---------- */
    var lAG = [];
    for (var g = 0; g < groupes.length; g++) {
      var a = groupes[g], camp = nettoyer(a.campagne), gn = nettoyer(a.nom);
      var refG = camp + ' > ' + gn;
      if (isBlank(camp)) { rap.err('Groupes d\'annonces', 'Campagne manquante.', gn); continue; }
      if (isBlank(gn)) { rap.err('Groupes d\'annonces', 'Nom de groupe manquant.', camp); continue; }
      if (!nomsCampagnes[camp.toLowerCase()]) rap.err('Groupes d\'annonces', 'Campagne "' + camp + '" absente du bloc Campagnes.', refG);
      if (typeCampagne[camp.toLowerCase()] === 'Performance Max') {
        rap.err('Groupes d\'annonces', 'Une campagne Performance Max ne contient pas de groupes d\'annonces : utiliser un groupe d\'assets.', refG);
      }
      var cleG = (camp + '\u0000' + gn).toLowerCase();
      if (cleGroupes[cleG]) rap.err('Groupes d\'annonces', 'Groupe en double.', refG);
      cleGroupes[cleG] = true;
      var cpcG = money(a.maxCPC);
      if (cpcG === '' && typeCampagne[camp.toLowerCase()] !== 'Performance Max') {
        // Editor exige un CPC max par defaut au niveau du groupe, meme en encheres
        // automatiques (ou il est ignore). 1.00 evite l'avertissement bloquant.
        cpcG = '1.00';
        rap.avert('Groupes d\'annonces', 'Max CPC absent : 1.00 ecrit par defaut (Editor l\'exige, les encheres automatiques l\'ignorent).', refG);
      }
      lAG.push({
        'Campaign': camp, 'Ad Group': gn,
        'Ad Group Status': nettoyer(a.statut) || 'Enabled',
        'Max CPC': cpcG, 'Target CPA': money(a.targetCpa),
        'Ad rotation': nettoyer(a.rotation),
        'Labels': nettoyer(a.etiquettes), 'Comment': nettoyer(a.commentaire)
      });
    }

    /* ---------- MOTS-CLES ---------- */
    var lKW = [], vusKW = {};
    for (var k = 0; k < motsCles.length; k++) {
      var m = motsCles[k];
      var camp2 = nettoyer(m.campagne), gr2 = nettoyer(m.groupe), txt = nettoyer(m.texte);
      var mt = nettoyer(m.correspondance) || 'Broad';
      var refK = camp2 + ' > ' + gr2 + ' > ' + txt;
      if (isBlank(txt)) continue;
      if (isBlank(camp2) || isBlank(gr2)) { rap.err('Mots-cles', 'Campagne ou groupe manquant pour "' + txt + '".', refK); continue; }
      if (!cleGroupes[(camp2 + '\u0000' + gr2).toLowerCase()]) rap.err('Mots-cles', 'Groupe "' + gr2 + '" absent du bloc Groupes d\'annonces.', refK);
      if (typeCampagne[camp2.toLowerCase()] === 'Performance Max') {
        rap.err('Mots-cles', 'Les mots-cles ne s\'appliquent pas a une campagne Performance Max.', refK);
      }
      if (MATCH_TYPES.indexOf(mt) === -1) rap.err('Mots-cles', 'Type de correspondance invalide : "' + mt + '" (Broad / Phrase / Exact).', refK);
      if (/^[\[\]"+\-]/.test(txt) || /[\[\]"]/.test(txt)) {
        rap.err('Mots-cles', 'Ne pas mettre de crochets ni de guillemets dans le texte : la colonne "Criterion Type" gere la correspondance. "' + txt + '"', refK);
      }
      if (longueurGoogle(txt) > LIMITES.motCle) rap.err('Mots-cles', 'Depasse 80 caracteres.', refK);
      if (txt.split(/\s+/).length > LIMITES.motCleMots) rap.err('Mots-cles', 'Depasse 10 mots.', refK);
      if (/[!@%*~^()={}|\\<>]/.test(txt)) rap.err('Mots-cles', 'Caractere non autorise dans un mot-cle : "' + txt + '"', refK);
      var cleK = (camp2 + '|' + gr2 + '|' + txt.toLowerCase() + '|' + mt).toLowerCase();
      if (vusKW[cleK]) rap.avert('Mots-cles', 'Doublon exact (meme groupe, meme correspondance) : "' + txt + '".', refK);
      vusKW[cleK] = true;
      if (!isBlank(m.urlFinale) && !estURL(m.urlFinale)) rap.err('Mots-cles', 'URL finale invalide.', refK);
      lKW.push({
        'Campaign': camp2, 'Ad Group': gr2, 'Keyword': txt, 'Criterion Type': mt,
        'Max CPC': money(m.maxCPC), 'Final URL': trim(m.urlFinale),
        'Status': nettoyer(m.statut) || 'Enabled', 'Labels': nettoyer(m.etiquettes)
      });
    }

    /* ---------- MOTS-CLES NEGATIFS ---------- */
    var lNEG = [], vusNEG = {};
    for (var q = 0; q < negatifs.length; q++) {
      var ng = negatifs[q];
      var camp3 = nettoyer(ng.campagne), gr3 = nettoyer(ng.groupe), t3 = nettoyer(ng.texte);
      if (isBlank(t3)) continue;
      if (isBlank(camp3)) { rap.err('Mots-cles negatifs', 'Campagne manquante pour "' + t3 + '".', t3); continue; }
      var base = nettoyer(ng.correspondance) || 'Broad';
      if (['Broad','Phrase','Exact'].indexOf(base) === -1) {
        rap.err('Mots-cles negatifs', 'Correspondance invalide : "' + base + '" (Broad / Phrase / Exact).', t3);
        base = 'Broad';
      }
      var ct = isBlank(gr3) ? ('Campaign Negative ' + base) : ('Negative ' + base);
      if (/[\[\]"]/.test(t3)) rap.err('Mots-cles negatifs', 'Retirer crochets/guillemets du texte : la colonne "Criterion Type" suffit. "' + t3 + '"', t3);
      var cleN = (camp3 + '|' + gr3 + '|' + t3.toLowerCase() + '|' + ct).toLowerCase();
      if (vusNEG[cleN]) { rap.avert('Mots-cles negatifs', 'Doublon : "' + t3 + '".', t3); continue; }
      vusNEG[cleN] = true;
      lNEG.push({ 'Campaign': camp3, 'Ad Group': gr3, 'Keyword': t3, 'Criterion Type': ct });
    }

    // Conflit negatif vs mot-cle actif
    for (var z = 0; z < lNEG.length; z++) {
      if (lNEG[z]['Criterion Type'].indexOf('Exact') === -1) continue;
      for (var y = 0; y < lKW.length; y++) {
        if (lKW[y]['Campaign'] === lNEG[z]['Campaign'] &&
            lKW[y]['Keyword'].toLowerCase() === lNEG[z]['Keyword'].toLowerCase()) {
          rap.err('Mots-cles negatifs', 'Le negatif exact "' + lNEG[z]['Keyword'] + '" bloque un mot-cle actif de la meme campagne.', lNEG[z]['Campaign']);
        }
      }
    }

    /* ---------- ANNONCES RSA ---------- */
    var lRSA = [];
    for (var r = 0; r < rsas.length; r++) {
      var ad = rsas[r];
      var camp4 = nettoyer(ad.campagne), gr4 = nettoyer(ad.groupe);
      var refA = camp4 + ' > ' + gr4;
      if (isBlank(camp4) || isBlank(gr4)) { rap.err('Annonces RSA', 'Campagne ou groupe manquant.', refA); continue; }
      if (!cleGroupes[(camp4 + '\u0000' + gr4).toLowerCase()]) rap.err('Annonces RSA', 'Groupe "' + gr4 + '" absent du bloc Groupes d\'annonces.', refA);
      var tC4 = typeCampagne[camp4.toLowerCase()];
      if (tC4 && tC4 !== 'Search') {
        rap.err('Annonces RSA', 'Une annonce responsive sur le Reseau de Recherche ne peut exister que dans une campagne Search (type actuel : ' + tC4 + ').', refA);
      }

      var titres = (ad.titres || []).filter(function (h) { return !isBlank(h && h.texte); });
      var descs  = (ad.descriptions || []).filter(function (d) { return !isBlank(d && d.texte); });

      if (titres.length < LIMITES.rsaTitresMin) rap.err('Annonces RSA', 'Minimum ' + LIMITES.rsaTitresMin + ' titres (recu ' + titres.length + ').', refA);
      if (titres.length > LIMITES.rsaTitresMax) rap.err('Annonces RSA', 'Maximum ' + LIMITES.rsaTitresMax + ' titres (recu ' + titres.length + ').', refA);
      if (descs.length < LIMITES.rsaDescMin) rap.err('Annonces RSA', 'Minimum ' + LIMITES.rsaDescMin + ' descriptions (recu ' + descs.length + ').', refA);
      if (descs.length > LIMITES.rsaDescMax) rap.err('Annonces RSA', 'Maximum ' + LIMITES.rsaDescMax + ' descriptions (recu ' + descs.length + ').', refA);
      if (titres.length < 8) rap.avert('Annonces RSA', 'Moins de 8 titres : efficacite publicitaire faible.', refA);
      if (titres.length < 15) rap.info('Annonces RSA', refA + ' : ' + titres.length + '/15 titres.');

      var vusT = {}, vusD = {};
      var ligne = { 'Campaign': camp4, 'Ad Group': gr4, 'Ad type': inclureAdType ? 'Responsive search ad' : '' };

      var pins1 = 0, pins2 = 0, pins3 = 0, sansPin = 0;
      for (var t = 0; t < titres.length && t < 15; t++) {
        var tx = validerTexteAnnonce(rap, 'Annonces RSA', refA, titres[t].texte, LIMITES.rsaTitre, { aucunPointExclamation: true });
        var kt = tx.toLowerCase();
        if (vusT[kt]) rap.err('Annonces RSA', 'Titre en double dans la meme annonce : "' + tx + '".', refA);
        vusT[kt] = true;
        ligne['Headline ' + (t + 1)] = tx;
        var pin = trim(titres[t].pin);
        if (!isBlank(pin)) {
          if (['1','2','3'].indexOf(pin) === -1) rap.err('Annonces RSA', 'Position d\'epinglage invalide (1, 2 ou 3) : "' + pin + '".', refA);
          ligne['Headline ' + (t + 1) + ' position'] = pin;
          if (pin === '1') pins1++; if (pin === '2') pins2++; if (pin === '3') pins3++;
        } else { sansPin++; }
      }
      if ((pins1 + pins2 + pins3) > 0 && sansPin === 0) {
        rap.err('Annonces RSA', 'Tous les titres sont epingles : Google ne pourra composer aucune combinaison.', refA);
      }
      if (pins1 > 0 && pins2 === 0 && sansPin < 2) {
        rap.avert('Annonces RSA', 'Titre epingle en position 1 sans reserve suffisante pour les positions 2 et 3.', refA);
      }

      var pd1 = 0, pd2 = 0, dSansPin = 0;
      for (var d = 0; d < descs.length && d < 4; d++) {
        var dx = validerTexteAnnonce(rap, 'Annonces RSA', refA, descs[d].texte, LIMITES.rsaDescription, {});
        var kd = dx.toLowerCase();
        if (vusD[kd]) rap.err('Annonces RSA', 'Description en double dans la meme annonce : "' + dx + '".', refA);
        vusD[kd] = true;
        ligne['Description ' + (d + 1)] = dx;
        var pn = trim(descs[d].pin);
        if (!isBlank(pn)) {
          if (['1','2'].indexOf(pn) === -1) rap.err('Annonces RSA', 'Position d\'epinglage de description invalide (1 ou 2).', refA);
          ligne['Description ' + (d + 1) + ' position'] = pn;
          if (pn === '1') pd1++; if (pn === '2') pd2++;
        } else { dSansPin++; }
      }
      if ((pd1 + pd2) > 0 && dSansPin === 0) {
        rap.err('Annonces RSA', 'Toutes les descriptions sont epinglees.', refA);
      }

      var p1 = nettoyer(ad.path1), p2 = nettoyer(ad.path2);
      [['Path 1', p1], ['Path 2', p2]].forEach(function (pp) {
        if (isBlank(pp[1])) return;
        if (longueurGoogle(pp[1]) > LIMITES.path) rap.err('Annonces RSA', pp[0] + ' depasse 15 caracteres : "' + pp[1] + '".', refA);
        if (/[\/\\?&=#]/.test(pp[1])) rap.err('Annonces RSA', pp[0] + ' contient un caractere interdit (/ \\ ? & = #).', refA);
      });
      if (isBlank(p1) && !isBlank(p2)) rap.err('Annonces RSA', 'Path 2 renseigne sans Path 1.', refA);
      ligne['Path 1'] = p1; ligne['Path 2'] = p2;

      var url = trim(ad.urlFinale);
      if (isBlank(url)) rap.err('Annonces RSA', 'URL finale manquante.', refA);
      else if (!estURL(url)) rap.err('Annonces RSA', 'URL finale invalide : "' + url + '".', refA);
      else if (/^http:\/\//i.test(url)) rap.avert('Annonces RSA', 'URL en http (non securise).', refA);
      ligne['Final URL'] = url;
      ligne['Final mobile URL'] = trim(ad.urlMobile);
      ligne['Tracking template'] = nettoyer(ad.trackingTemplate);
      ligne['Final URL suffix'] = nettoyer(ad.suffixeURL);
      ligne['Custom parameters'] = nettoyer(ad.parametresPerso);
      ligne['Status'] = nettoyer(ad.statut) || 'Enabled';
      ligne['Labels'] = nettoyer(ad.etiquettes);
      lRSA.push(ligne);
    }

    /* ---------- SITELINKS ---------- */
    var lSL = [], parCampSL = {};
    for (var sl = 0; sl < sitelinks.length; sl++) {
      var S = sitelinks[sl];
      var cS = nettoyer(S.campagne), gS = nettoyer(S.groupe), tS = nettoyer(S.texte);
      var refS = (cS || '<Compte>') + ' > ' + tS;
      if (isBlank(tS)) continue;
      if (isBlank(cS)) { rap.err('Sitelinks', 'Campagne manquante (utiliser <Account-level> pour le niveau compte).', tS); continue; }
      if (cS !== '<Account-level>' && !nomsCampagnes[cS.toLowerCase()]) {
        rap.err('Sitelinks', 'Campagne "' + cS + '" absente du bloc Campagnes.', refS);
      }
      validerTexteAnnonce(rap, 'Sitelinks', refS, tS, LIMITES.sitelinkTexte, { aucunPointExclamation: true });

      var dS1 = nettoyer(S.desc1), dS2 = nettoyer(S.desc2);
      if ((isBlank(dS1)) !== (isBlank(dS2))) {
        rap.err('Sitelinks', 'Les deux lignes de description doivent etre remplies, ou aucune des deux.', refS);
      }
      [dS1, dS2].forEach(function (dd) {
        if (isBlank(dd)) return;
        if (longueurGoogle(dd) > LIMITES.sitelinkDesc) rap.err('Sitelinks', 'Description > 35 caracteres (' + longueurGoogle(dd) + ') : "' + dd + '".', refS);
      });

      var uS = trim(S.urlFinale);
      if (isBlank(uS)) rap.err('Sitelinks', 'URL finale manquante.', refS);
      else if (!estURL(uS)) rap.err('Sitelinks', 'URL finale invalide : "' + uS + '".', refS);

      if (!isBlank(S.dateDebut) && !estDateISO(S.dateDebut)) rap.err('Sitelinks', 'Date de debut non conforme.', refS);
      if (!isBlank(S.dateFin) && !estDateISO(S.dateFin)) rap.err('Sitelinks', 'Date de fin non conforme.', refS);
      if (!isBlank(S.calendrier) && !validerCalendrier(S.calendrier)) rap.err('Sitelinks', 'Calendrier invalide.', refS);

      parCampSL[cS] = (parCampSL[cS] || 0) + 1;
      lSL.push({
        'Campaign': cS, 'Ad Group': gS, 'Sitelink text': tS,
        'Description Line 1': dS1, 'Description Line 2': dS2,
        'Final URL': uS, 'Final mobile URL': trim(S.urlMobile),
        'Start Date': trim(S.dateDebut), 'End Date': trim(S.dateFin),
        'Ad Schedule': trim(S.calendrier),
        'Device Preference': nettoyer(S.appareil), 'Status': nettoyer(S.statut) || 'Enabled'
      });
    }
    for (var cc in parCampSL) {
      if (parCampSL[cc] < 2) rap.err('Sitelinks', 'Moins de 2 liens annexes : Google n\'affichera aucun sitelink pour cette campagne.', cc);
      else if (parCampSL[cc] < 4) rap.avert('Sitelinks', 'Moins de 4 liens annexes (' + parCampSL[cc] + ') : couverture reduite.', cc);
    }

    /* ---------- CALLOUTS ---------- */
    var lCO = [], parCampCO = {}, vusCO = {};
    for (var co = 0; co < callouts.length; co++) {
      var C = callouts[co];
      var cC = nettoyer(C.campagne), tC = nettoyer(C.texte);
      if (isBlank(tC)) continue;
      var refC = (cC || '<Compte>') + ' > ' + tC;
      if (isBlank(cC)) { rap.err('Accroches', 'Campagne manquante (utiliser <Account-level> pour le niveau compte).', tC); continue; }
      if (cC !== '<Account-level>' && !nomsCampagnes[cC.toLowerCase()]) rap.err('Accroches', 'Campagne "' + cC + '" absente du bloc Campagnes.', refC);
      validerTexteAnnonce(rap, 'Accroches', refC, tC, LIMITES.calloutTexte, { aucunPointExclamation: true });
      var kC = (cC + '|' + tC).toLowerCase();
      if (vusCO[kC]) { rap.avert('Accroches', 'Doublon : "' + tC + '".', refC); continue; }
      vusCO[kC] = true;
      parCampCO[cC] = (parCampCO[cC] || 0) + 1;
      lCO.push({
        'Campaign': cC, 'Ad Group': nettoyer(C.groupe), 'Callout text': tC,
        'Start Date': trim(C.dateDebut), 'End Date': trim(C.dateFin),
        'Ad Schedule': trim(C.calendrier), 'Device Preference': nettoyer(C.appareil),
        'Status': nettoyer(C.statut) || 'Enabled'
      });
    }
    for (var c2 in parCampCO) {
      if (parCampCO[c2] < 2) rap.err('Accroches', 'Moins de 2 accroches : Google n\'en affichera aucune.', c2);
      else if (parCampCO[c2] < 4) rap.avert('Accroches', 'Moins de 4 accroches (' + parCampCO[c2] + ').', c2);
    }

    /* ---------- EXTRAITS DE SITE ---------- */
    var lSN = [];
    var listeHeaders = SNIPPET_HEADERS[langueSnippets] || SNIPPET_HEADERS.fr;
    for (var sn = 0; sn < snippets.length; sn++) {
      var N = snippets[sn];
      var cN = nettoyer(N.campagne), hN = nettoyer(N.entete);
      var vals = (N.valeurs || []).map(nettoyer).filter(function (v) { return v !== ''; });
      var refN = (cN || '<Compte>') + ' > ' + hN;
      if (isBlank(hN) && !vals.length) continue;
      if (isBlank(cN)) { rap.err('Extraits de site', 'Campagne manquante (utiliser <Account-level> pour le niveau compte).', hN); continue; }
      if (cN !== '<Account-level>' && !nomsCampagnes[cN.toLowerCase()]) rap.err('Extraits de site', 'Campagne "' + cN + '" absente du bloc Campagnes.', refN);
      if (listeHeaders.indexOf(hN) === -1) {
        rap.err('Extraits de site', 'En-tete "' + hN + '" hors de la liste imposee par Google. Valeurs acceptees (' + langueSnippets + ') : ' + listeHeaders.join(', ') + '.', refN);
      }
      vals = uniq(vals);
      if (vals.length < LIMITES.snippetValMin) rap.err('Extraits de site', 'Minimum 3 valeurs (recu ' + vals.length + ').', refN);
      if (vals.length > LIMITES.snippetValMax) { rap.err('Extraits de site', 'Maximum 10 valeurs (recu ' + vals.length + ').', refN); vals = vals.slice(0, 10); }
      for (var v2 = 0; v2 < vals.length; v2++) {
        if (longueurGoogle(vals[v2]) > LIMITES.snippetValeur) rap.err('Extraits de site', 'Valeur > 25 caracteres : "' + vals[v2] + '".', refN);
        if (/[;]/.test(vals[v2])) rap.err('Extraits de site', 'Le point-virgule est le separateur de valeurs : interdit dans une valeur. "' + vals[v2] + '"', refN);
      }
      var ligneSN = {
        'Campaign': cN, 'Ad Group': nettoyer(N.groupe), 'Header': hN,
        'Values': vals.join(';'), 'Status': nettoyer(N.statut) || 'Enabled'
      };
      // Les valeurs sont aussi ecrites une par colonne (Value 1..10) : selon la version
      // d'Editor, c'est l'une ou l'autre forme qui est reconnue au mappage.
      for (var vi = 0; vi < 10; vi++) ligneSN['Value ' + (vi + 1)] = vals[vi] || '';
      lSN.push(ligneSN);
    }

    /* ---------- GROUPES D'ASSETS (PERFORMANCE MAX) ---------- */
    var lAGR = [];
    for (var ag = 0; ag < assetGrps.length; ag++) {
      var A = assetGrps[ag];
      var cA = nettoyer(A.campagne), nA = nettoyer(A.nom);
      var refAG = cA + ' > ' + nA;
      if (isBlank(cA) || isBlank(nA)) { rap.err('Groupes d\'assets', 'Campagne ou nom de groupe d\'assets manquant.', refAG); continue; }
      if (!nomsCampagnes[cA.toLowerCase()]) rap.err('Groupes d\'assets', 'Campagne "' + cA + '" absente du bloc Campagnes.', refAG);
      else if (typeCampagne[cA.toLowerCase()] !== 'Performance Max') {
        rap.err('Groupes d\'assets', 'Un groupe d\'assets exige une campagne de type Performance Max (type actuel : ' + typeCampagne[cA.toLowerCase()] + ').', refAG);
      }

      var tA = (A.titres || []).map(nettoyer).filter(function (x) { return x !== ''; });
      var lA = (A.titresLongs || []).map(nettoyer).filter(function (x) { return x !== ''; });
      var dA = (A.descriptions || []).map(nettoyer).filter(function (x) { return x !== ''; });

      if (tA.length < LIMITES.pmaxTitresMin) rap.err('Groupes d\'assets', 'Minimum 3 titres (recu ' + tA.length + ').', refAG);
      if (tA.length > LIMITES.pmaxTitresMax) rap.err('Groupes d\'assets', 'Maximum 15 titres.', refAG);
      if (lA.length < LIMITES.pmaxTitresLongsMin) rap.err('Groupes d\'assets', 'Minimum 1 titre long.', refAG);
      if (lA.length > LIMITES.pmaxTitresLongsMax) rap.err('Groupes d\'assets', 'Maximum 5 titres longs.', refAG);
      if (dA.length < LIMITES.pmaxDescMin) rap.err('Groupes d\'assets', 'Minimum 2 descriptions.', refAG);
      if (dA.length > LIMITES.pmaxDescMax) rap.err('Groupes d\'assets', 'Maximum 5 descriptions.', refAG);

      // Description courte obligatoire (<= 60) : Google exige au moins une description courte.
      var aUneCourte = false;
      for (var dz = 0; dz < dA.length; dz++) if (longueurGoogle(dA[dz]) <= LIMITES.pmaxDescCourte) aUneCourte = true;
      if (!aUneCourte) rap.err('Groupes d\'assets', 'Aucune description de 60 caracteres ou moins. Google en exige au moins une (description courte).', refAG);

      var uAG = trim(A.urlFinale);
      if (isBlank(uAG)) rap.err('Groupes d\'assets', 'URL finale manquante.', refAG);
      else if (!estURL(uAG)) rap.err('Groupes d\'assets', 'URL finale invalide.', refAG);

      var bn = nettoyer(A.nomEntreprise);
      if (isBlank(bn)) rap.avert('Groupes d\'assets', 'Nom de l\'entreprise absent : a saisir dans Editor au niveau de la campagne (Consignes relatives a la marque), avec le logo.', refAG);
      else if (longueurGoogle(bn) > LIMITES.nomEntreprise) rap.err('Groupes d\'assets', 'Nom de l\'entreprise > 25 caracteres.', refAG);
      // Depuis janvier 2025, les nouvelles campagnes PMax ont les brand guidelines activees :
      // nom d'entreprise et logo se rattachent a la CAMPAGNE, pas au groupe d'assets.
      // Ecrit dans le groupe, Editor le refuse. On le retire du CSV et on le met en checklist.
      if (!isBlank(bn)) { nomsEntreprisePMax.push(cA + ' : ' + bn); rap.nomsEntreprisePMax = nomsEntreprisePMax; }

      var cta = nettoyer(A.cta);
      if (!isBlank(cta) && CTA_PMAX.indexOf(cta) === -1) {
        rap.err('Groupes d\'assets', 'Incitation a l\'action hors liste Google : "' + cta + '". Valeurs : ' + CTA_PMAX.join(', ') + '.', refAG);
      }

      var rowA = {
        'Campaign': cA, 'Asset Group': nA,
        'Asset group status': nettoyer(A.statut) || 'Paused',
        'Final URL': uAG, 'Business name': '', 'Call to action': cta,
        'Path 1': nettoyer(A.path1), 'Path 2': nettoyer(A.path2)
      };
      var vuAG = {};
      for (var i1 = 0; i1 < tA.length && i1 < 15; i1++) {
        var vv = validerTexteAnnonce(rap, 'Groupes d\'assets', refAG, tA[i1], LIMITES.pmaxTitre, { aucunPointExclamation: true });
        if (vuAG['t' + vv.toLowerCase()]) rap.err('Groupes d\'assets', 'Titre en double : "' + vv + '".', refAG);
        vuAG['t' + vv.toLowerCase()] = 1;
        rowA['Headline ' + (i1 + 1)] = vv;
      }
      for (var i2 = 0; i2 < lA.length && i2 < 5; i2++) {
        rowA['Long headline ' + (i2 + 1)] = validerTexteAnnonce(rap, 'Groupes d\'assets', refAG, lA[i2], LIMITES.pmaxTitreLong, {});
      }
      for (var i3 = 0; i3 < dA.length && i3 < 5; i3++) {
        var dv = validerTexteAnnonce(rap, 'Groupes d\'assets', refAG, dA[i3], LIMITES.pmaxDescription, {});
        if (vuAG['d' + dv.toLowerCase()]) rap.err('Groupes d\'assets', 'Description en double : "' + dv + '".', refAG);
        vuAG['d' + dv.toLowerCase()] = 1;
        rowA['Description ' + (i3 + 1)] = dv;
      }
      lAGR.push(rowA);

      rap.avert('Groupes d\'assets', 'Images, logos et videos ne passent pas par le CSV : les televerser dans Editor apres l\'import (min. 1 logo 1:1, 1 image 1.91:1, 1 image 1:1).', refAG);
    }

    /* ---------- ASSEMBLAGE DES FICHIERS ---------- */
    var blocs = [
      { id: 'campagnes',   nom: '01_campagnes.csv',            entetes: H_CAMP, lignes: lCamp },
      { id: 'localisations', nom: '02_localisations.csv',      entetes: H_LOC,  lignes: lLoc },
      { id: 'groupes',     nom: '03_groupes_annonces.csv',     entetes: H_AG,   lignes: lAG },
      { id: 'motscles',    nom: '04_mots_cles.csv',            entetes: H_KW,   lignes: lKW },
      { id: 'negatifs',    nom: '05_mots_cles_negatifs.csv',   entetes: H_NEG,  lignes: lNEG },
      { id: 'rsa',         nom: '06_annonces_rsa.csv',         entetes: H_RSA,  lignes: lRSA },
      { id: 'sitelinks',   nom: '07_liens_annexes.csv',        entetes: H_SL,   lignes: lSL },
      { id: 'callouts',    nom: '08_accroches.csv',            entetes: H_CO,   lignes: lCO },
      { id: 'snippets',    nom: '09_extraits_de_site.csv',     entetes: H_SNIP, lignes: lSN },
      { id: 'assetgroups', nom: '10_groupes_assets_pmax.csv',  entetes: H_AGRP, lignes: lAGR }
    ];

    // Fichier principal : 00, toutes les entites dans un seul CSV.
    // C'est la methode documentee par Google Ads Editor : chaque ligne est
    // reconnue par les colonnes remplies (campagne, groupe, mot-cle, annonce,
    // asset...). Un seul import, une seule revision, un seul "Keep".
    var fichiers = [];
    var entU = [], lignesU = [];
    for (var bu = 0; bu < blocs.length; bu++) {
      var BU = blocs[bu];
      if (!BU.lignes.length) continue;
      var hu = colonnesUtiles(BU.entetes, BU.lignes);
      for (var hi = 0; hi < hu.length; hi++) { if (entU.indexOf(hu[hi]) === -1) entU.push(hu[hi]); }
      for (var li = 0; li < BU.lignes.length; li++) lignesU.push(BU.lignes[li]);
    }
    ['Asset Group', 'Ad Group', 'Campaign'].forEach(function (idc) {
      var ix = entU.indexOf(idc);
      if (ix > -1) { entU.splice(ix, 1); entU.unshift(idc); }
    });
    if (lignesU.length) {
      fichiers.push({ id: 'unique', nom: '00_import_google_ads_editor.csv', nbLignes: lignesU.length,
                      csv: BOM + versCSV(entU, lignesU), tsv: versTSV(entU, lignesU) });
    }

    // Option : fichiers separes par type (01 a 10). Utile pour relire une
    // entite a la fois ; l'import doit alors se faire fichier par fichier,
    // en acceptant les modifications proposees entre chaque import.
    if (opt.fichiersSepares) {
      for (var b = 0; b < blocs.length; b++) {
        var B = blocs[b];
        if (!B.lignes.length) continue;
        var h = colonnesUtiles(B.entetes, B.lignes);
        fichiers.push({
          id: B.id, nom: B.nom, nbLignes: B.lignes.length,
          csv: BOM + versCSV(h, B.lignes), tsv: versTSV(h, B.lignes)
        });
      }
    }

    fichiers.push({ id: 'checklist', nom: '11_CHECKLIST_post_import.txt', nbLignes: 0,
                    csv: checklist(deck, rap), tsv: '' });

    return {
      fichiers: fichiers,
      rapport: {
        erreurs: rap.erreurs, avertissements: rap.avertissements, infos: rap.infos,
        pret: rap.erreurs.length === 0
      },
      stats: {
        campagnes: lCamp.length, localisations: lLoc.length, groupes: lAG.length,
        motsCles: lKW.length, negatifs: lNEG.length, rsa: lRSA.length,
        sitelinks: lSL.length, callouts: lCO.length, snippets: lSN.length, assetGroups: lAGR.length
      }
    };
  }

  /* ---------------------------------------------------------------- CALENDRIER */

  function validerCalendrier(v) {
    var jours = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];
    var parts = trim(v).split(';');
    for (var i = 0; i < parts.length; i++) {
      var p = trim(parts[i]);
      var m = p.match(/^\((Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)(@(\d{1,3})%)?\[(\d{2}):(\d{2})-(\d{2}):(\d{2})\]\)$/);
      if (!m) return false;
      if (jours.indexOf(m[1]) === -1) return false;
      var h1 = +m[4], mn1 = +m[5], h2 = +m[6], mn2 = +m[7];
      if (h1 > 24 || h2 > 24 || mn1 > 59 || mn2 > 59) return false;
      if ((h1 * 60 + mn1) >= (h2 * 60 + mn2)) return false;
    }
    return true;
  }

  /* ---------------------------------------------------------------- CHECKLIST */

  function checklist(deck, rap) {
    var L = [];
    var camps = deck.campagnes || [];
    L.push('CHECKLIST POST-IMPORT - GOOGLE ADS EDITOR');
    L.push('Genere le ' + (deck.options && deck.options.aujourdhui ? deck.options.aujourdhui : ''));
    L.push('');
    L.push('PROCEDURE D\'IMPORT :');
    L.push('  1. Editor > telecharger le compte a jour (Get recent changes).');
    L.push('  2. Account > Import > From file > 00_import_google_ads_editor.csv > Import.');
    L.push('     Toutes les entites sont dans ce seul fichier ; Editor reconnait chaque ligne');
    L.push('     par ses colonnes remplies. Verifier le mappage des colonnes propose.');
    L.push('  3. Review imported changes : verifier les compteurs par type, zero erreur attendue.');
    L.push('  4. Keep proposed changes (sinon Account > Import reste grise).');
    L.push('  5. Regler les points ci-dessous, puis Tools > Check changes, puis Post en pause.');
    L.push('  Fichiers separes 01 a 10 (option) : meme procedure, un fichier a la fois,');
    L.push('  Keep proposed changes entre chaque import, dans l\'ordre numerique.');
    L.push('');
    L.push('A REGLER MANUELLEMENT DANS EDITOR (non transportable par CSV) :');
    L.push('');
    if (rap.typesNonCouverts && rap.typesNonCouverts.length) {
      L.push('[ ] 0a. CAMPAGNES D\'UN TYPE NON COUVERT PAR L\'OUTIL (importees sans contenu) :');
      rap.typesNonCouverts.forEach(function (x) { L.push('       ' + x); });
      L.push('       Le CSV cree la campagne avec ses reglages, budget, dates et localisations.');
      L.push('       Annonces (image, video, carrousel), assets, audiences, produits ou groupes');
      L.push('       propres a ce type : a creer dans Editor ou l\'interface AVANT d\'activer.');
      L.push('');
    }
    if (rap.nomsEntreprisePMax && rap.nomsEntreprisePMax.length) {
      L.push('[ ] 0b. PERFORMANCE MAX - CONSIGNES RELATIVES A LA MARQUE (niveau campagne) :');
      rap.nomsEntreprisePMax.forEach(function (x) { L.push('       ' + x + ' : saisir le nom d\'entreprise + televerser un logo 1:1 (1200x1200) dans la campagne.'); });
      L.push('       Ne pas mettre de logo ni de nom d\'entreprise dans le groupe d\'assets : Editor le refuse.');
      L.push('');
    }
    if (rap.budgetsProvisoires && rap.budgetsProvisoires.length) {
      L.push('[ ] 0. BUDGETS PROVISOIRES - 1.00 ecrit pour : ' + rap.budgetsProvisoires.join(' ; '));
      L.push('       Mettre le vrai budget quotidien dans Editor (ou l\'interface) AVANT d\'activer.');
      L.push('');
    }
    L.push('[ ] 1. ANNONCES POLITIQUES UE - declaration obligatoire');
    L.push('       Editor demande la confirmation a la creation de chaque campagne.');
    L.push('       Sans declaration, la campagne ne peut pas etre publiee.');
    for (var i = 0; i < camps.length; i++) {
      var ue = trim(camps[i].politiqueUE);
      L.push('       - ' + trim(camps[i].nom) + ' : declarer "' + (ue || 'A DEFINIR') + '"');
    }
    L.push('');
    L.push('[ ] 2. AI MAX (Search) - Campaigns > selectionner la campagne > volet d\'edition');
    var aucunAiMax = true;
    for (var j = 0; j < camps.length; j++) {
      var a = camps[j].aiMax || {};
      if (!a.actif) continue;
      aucunAiMax = false;
      L.push('       - ' + trim(camps[j].nom) + ' : AI Max ACTIF');
      L.push('           Search term matching : ' + (a.searchTermMatching ? 'ON' : 'OFF'));
      L.push('           Text customization   : ' + (a.textCustomization ? 'ON' : 'OFF'));
      L.push('           Final URL expansion  : ' + (a.finalUrlExpansion ? 'ON' : 'OFF'));
      if (a.exclusionsMarque) L.push('           Exclusions de marque : ' + a.exclusionsMarque);
      if (a.urlsExclues) L.push('           URL a exclure de l\'expansion : ' + a.urlsExclues);
    }
    if (aucunAiMax) L.push('       - Aucune campagne marquee AI Max dans le deck.');
    L.push('       Rappel : depuis le 3 aout 2026, le Broad match au niveau campagne et les');
    L.push('       Automatically Created Assets ne peuvent plus etre crees ; la migration');
    L.push('       automatique vers AI Max s\'effectue du 1er au 30 septembre 2026.');
    L.push('       Les Dynamic Search Ads migrent en fevrier 2027.');
    L.push('');
    L.push('[ ] 3. OBJECTIFS DE CONVERSION par campagne (volet d\'edition > Conversion goals).');
    L.push('[ ] 4. AUDIENCES / SEGMENTS (observation ou ciblage) : a ajouter dans l\'onglet Audiences.');
    L.push('[ ] 5. IMAGES, LOGOS, VIDEOS (Performance Max et assets images Search) : televerser dans Editor.');
    L.push('[ ] 6. FLUX DE PAGES (page feeds) et regles d\'exclusion d\'URL.');
    L.push('[ ] 7. LISTES DE MOTS-CLES NEGATIFS PARTAGEES (Shared library) : a associer aux campagnes.');
    L.push('[ ] 8. AUTRES EXTENSIONS non couvertes par le CSV de cet outil : appel, prix, promotion,');
    L.push('       image, localisation, formulaire pour prospects, application. A creer dans Editor ou l\'interface.');
    L.push('[ ] 9. SUIVI : verifier le modele de suivi, le suffixe d\'URL finale et les parametres personnalises.');
    L.push('[ ] 10. Tools > Check changes AVANT de publier. Corriger toutes les erreurs rouges.');
    L.push('[ ] 11. Publier avec les campagnes en PAUSE, verifier dans l\'interface, puis activer.');
    L.push('');
    L.push('RESULTAT DE LA VALIDATION AUTOMATIQUE :');
    L.push('  Erreurs bloquantes : ' + rap.erreurs.length);
    L.push('  Avertissements     : ' + rap.avertissements.length);
    if (rap.erreurs.length) {
      L.push('');
      L.push('ERREURS A CORRIGER AVANT L\'IMPORT :');
      for (var e = 0; e < rap.erreurs.length; e++) {
        L.push('  [' + rap.erreurs[e].bloc + '] ' + rap.erreurs[e].ref + ' : ' + rap.erreurs[e].message);
      }
    }
    if (rap.avertissements.length) {
      L.push('');
      L.push('AVERTISSEMENTS :');
      for (var w = 0; w < rap.avertissements.length; w++) {
        L.push('  [' + rap.avertissements[w].bloc + '] ' + rap.avertissements[w].ref + ' : ' + rap.avertissements[w].message);
      }
    }
    return L.join('\r\n') + '\r\n';
  }

  /* ---------------------------------------------------------------- PARSEUR DE DECK */

  // Transforme un bloc colle depuis Excel (tabulations) en tableau de lignes.
  function parserTable(txt) {
    var lignes = s(txt).split(/\r\n|\n|\r/), out = [];
    for (var i = 0; i < lignes.length; i++) {
      if (trim(lignes[i]) === '') continue;
      out.push(lignes[i].split('\t').map(nettoyer));
    }
    return out;
  }

  // Detecte automatiquement les blocs d'un deck colle en entier.
  // Reconnait les libelles FR et EN utilises dans les decks SEM.
  function parserDeck(txt) {
    var res = {
      titres: [], descriptions: [], titresLongs: [], descriptionsCourtes: [],
      motsCles: [], negatifs: [], callouts: [], sitelinks: [], snippets: [],
      path1: '', path2: '', urlFinale: '', nomEntreprise: '', cta: '',
      champs: {}
    };
    var lignes = parserTable(txt);
    var section = '';

    // "Headline 3", "Titre 3", "Titre long 1", "Long headline 1"
    var reTitre  = /^(?:(long)\s+)?(headline|titre)\s*(long)?\s*(\d+)?$/i;
    // "Description 2", "Description courte 1", "Short description 1", "Description line 1"
    var reDesc   = /^(?:(short|courte)\s+)?(description|desc)\s*(courte|short)?\s*(line)?\s*(\d+)?$/i;

    // Une ligne de section ne contient qu'un libelle (la premiere cellule) ; les
    // cellules suivantes, si presentes, sont des entetes de colonnes (ex. "Mot-cle / Type / Volume").
    function estSection(c0) {
      return /^mots[- ]cl[ée]s?\s*n[ée]gatifs?$/i.test(c0) || /^negative keywords?$/i.test(c0) ||
             /^mots[- ]cl[ée]s?$/i.test(c0) || /^keywords?$/i.test(c0) ||
             /^(callout|accroche)s?( extensions?)?$/i.test(c0) ||
             /^(sitelinks?|liens annexes)/i.test(c0) ||
             /^(extraits de site|structured snippets?)/i.test(c0) ||
             /^notes?$/i.test(c0) || /^(text ads?|annonces?)$/i.test(c0);
    }

    for (var i = 0; i < lignes.length; i++) {
      var cel = lignes[i].filter(function (x) { return x !== ''; });
      if (!cel.length) continue;
      var c0 = cel[0], c1 = cel[1] || '', c2 = cel[2] || '';

      // Changement de section
      if (estSection(c0)) {
        if (/^mots[- ]cl[ée]s?\s*n[ée]gatifs?$/i.test(c0) || /^negative keywords?$/i.test(c0)) section = 'neg';
        else if (/^mots[- ]cl[ée]s?$/i.test(c0) || /^keywords?$/i.test(c0)) section = 'kw';
        else if (/^(callout|accroche)s?( extensions?)?$/i.test(c0)) section = 'callout';
        else if (/^(sitelinks?|liens annexes)/i.test(c0)) section = 'sitelink';
        else if (/^(extraits de site|structured snippets?)/i.test(c0)) section = 'snippet';
        else if (/^notes?$/i.test(c0)) section = 'notes';
        else section = 'ad';
        continue;
      }

      // Lignes des sections en liste : traitees AVANT les paires libelle/valeur,
      // sinon "mot cle <tab> Phrase <tab> 1200" tombe dans res.champs et le mot-cle est perdu.
      // Les colonnes supplementaires (correspondance, volume) sont ignorees : l'outil applique
      // la correspondance choisie a l'application. Un libelle de deck (Headline, Final URL...)
      // rencontre dans une section en liste reste traite comme libelle.
      var estLibelle = (cel.length >= 2) && (reTitre.test(c0) || reDesc.test(c0) ||
                       /^(display )?path ?[12]$/i.test(c0) || /^chemin ?[12]$/i.test(c0) ||
                       /^(final url|url finale?|url de destination)/i.test(c0) ||
                       /^(nom de l'entreprise|business name)$/i.test(c0) ||
                       /^(incitation [àa] l'action|call to action)$/i.test(c0));
      if (!estLibelle && section === 'kw')      { res.motsCles.push(c0); continue; }
      if (!estLibelle && section === 'neg')     { res.negatifs.push(c0); continue; }
      if (!estLibelle && section === 'callout') { res.callouts.push(c0); continue; }
      if (!estLibelle && section === 'sitelink') {
        // Texte <tab> Description 1 <tab> Description 2 <tab> URL  (ou Texte <tab> URL)
        var urlS = '', d1S = '', d2S = '';
        for (var u = 1; u < cel.length; u++) { if (estURL(cel[u])) { urlS = cel[u]; break; } }
        var restes = cel.slice(1).filter(function (x) { return x !== urlS; });
        d1S = restes[0] || ''; d2S = restes[1] || '';
        res.sitelinks.push({ texte: c0, desc1: d1S, desc2: d2S, urlFinale: urlS });
        continue;
      }
      if (!estLibelle && section === 'snippet') {
        // En-tete <tab> valeur 1 <tab> valeur 2 ...  (ou En-tete <tab> "v1;v2;v3")
        var valsS = [];
        for (var w2 = 1; w2 < cel.length; w2++) {
          cel[w2].split(';').forEach(function (x) { x = trim(x); if (x) valsS.push(x); });
        }
        if (valsS.length) res.snippets.push({ entete: c0, valeurs: valsS });
        continue;
      }
      if (!estLibelle && section === 'notes') continue;

      // Paires libelle / valeur (entetes de deck)
      if (cel.length >= 2) {
        // "Titre <tab> 3 <tab> texte" (format Sepaq) ou "Headline 3 <tab> texte" (format ARTM)
        var mT = reTitre.exec(c0);
        if (mT) {
          var estLong = !!(mT[1] || mT[3]);
          var texte = mT[4] ? c1 : (/^\d+$/.test(c1) ? c2 : c1);
          if (!/^\d+$/.test(texte) && texte) {
            (estLong ? res.titresLongs : res.titres).push(texte);
          }
          continue;
        }
        var mD = reDesc.exec(c0);
        if (mD) {
          var courte = !!(mD[1] || mD[3]);
          var td = mD[5] ? c1 : (/^\d+$/.test(c1) ? c2 : c1);
          if (!/^\d+$/.test(td) && td) {
            (courte ? res.descriptionsCourtes : res.descriptions).push(td);
          }
          continue;
        }
        if (/^(display )?path ?1$/i.test(c0) || /^chemin ?1$/i.test(c0)) { res.path1 = c1; continue; }
        if (/^(display )?path ?2$/i.test(c0) || /^chemin ?2$/i.test(c0)) { res.path2 = c1; continue; }
        if (/^(final url|url finale?|url de destination)/i.test(c0)) { res.urlFinale = c1; continue; }
        if (/^(nom de l'entreprise|business name)$/i.test(c0)) { res.nomEntreprise = c1; continue; }
        if (/^(incitation [àa] l'action|call to action)$/i.test(c0)) { res.cta = c1; continue; }
        res.champs[c0] = c1;
        continue;
      }
    }

    // Nettoyage : retire les valeurs qui sont juste des compteurs de caracteres
    ['titres','titresLongs','descriptions','descriptionsCourtes','motsCles','negatifs','callouts'].forEach(function (k) {
      res[k] = res[k].filter(function (v) { return v && !/^\d+$/.test(v); });
    });
    // Idem pour les listes d'objets : un lien annexe ou un extrait dont le libelle est un nombre est un compteur.
    res.sitelinks = res.sitelinks.filter(function (x) { return x.texte && !/^\d+$/.test(x.texte); });
    res.snippets  = res.snippets.filter(function (x) { return x.entete && !/^\d+$/.test(x.entete); });
    return res;
  }

  /* ---------------------------------------------------------------- EXPORT */

  return {
    generer: generer,
    parserDeck: parserDeck,
    parserTable: parserTable,
    validerCalendrier: validerCalendrier,
    longueurGoogle: longueurGoogle,
    nettoyer: nettoyer,
    nombre: nombre,
    versCSV: versCSV,
    versTSV: versTSV,
    LIMITES: LIMITES,
    SNIPPET_HEADERS: SNIPPET_HEADERS,
    CTA_PMAX: CTA_PMAX,
    BID_STRATEGIES: BID_STRATEGIES,
    CAMPAIGN_TYPES: CAMPAIGN_TYPES
  };
})();

export default GAE;
export { GAE };
