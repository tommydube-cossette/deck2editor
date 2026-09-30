import { describe, it, expect } from "vitest";
import ExcelJS from "exceljs";
import { excelBuffer, importerExcel, deckHTML, importerExportEditor } from "@/lib/deck2editor/exports";
import { planExemple } from "@/lib/deck2editor/plan";
import GAE from "@/lib/deck2editor/gae";

describe("Excel", () => {
  it("modele : 9 onglets, en-tetes FR", async () => {
    const buf = await excelBuffer(planExemple(), "modele", "fr");
    const wb = new ExcelJS.Workbook(); await wb.xlsx.load(buf);
    expect(wb.worksheets.map((w) => w.name)).toEqual(["Instructions", "Campagnes", "Groupes et annonces", "Mots-clés", "Négatifs", "Liens annexes", "Accroches", "Extraits", "Performance Max"]);
    expect(wb.getWorksheet("Campagnes")!.getRow(3).getCell(1).value).toBe("Campagne");
  });
  it("aller-retour : deck Excel du plan exemple -> import -> plan identique et valide", async () => {
    const p0 = planExemple();
    const buf = await excelBuffer(p0, "plan", "fr");
    const p1 = await importerExcel(buf, "fr");
    expect(p1).not.toBeNull();
    expect(p1!.campagnes[0].nom).toBe(p0.campagnes[0].nom);
    expect(p1!.campagnes[0].localisations[0].id).toBe("2124");
    expect(p1!.rsas[0].titres.map((t) => t.texte)).toEqual(p0.rsas[0].titres.map((t) => t.texte));
    expect(p1!.rsas[0].titres[0].pin).toBe("1");
    expect(p1!.motsCles.length).toBe(5); expect(p1!.negatifs.length).toBe(4); expect(p1!.sitelinks.length).toBe(4); expect(p1!.callouts.length).toBe(4);
    const r = GAE.generer({ ...p1!, options: { aujourdhui: "2026-09-29" } });
    expect(r.rapport.erreurs).toEqual([]);
  });
  it("import en anglais : en-tetes EN reconnus", async () => {
    const buf = await excelBuffer(planExemple(), "plan", "en");
    const wb = new ExcelJS.Workbook(); await wb.xlsx.load(buf);
    expect(wb.worksheets[1].name).toBe("Campaigns");
    const p1 = await importerExcel(buf, "en");
    expect(p1!.groupes[0].nom).toBe("promotion_printemps_fr");
  });
});

describe("Deck client HTML", () => {
  it("contient l'apercu Google et les compteurs", async () => {
    const h = await deckHTML(planExemple(), "fr");
    expect(h).toContain("Plan SEM pour approbation");
    expect(h).toContain("Aperçu Google");
    expect(h).toContain("promotion_printemps_fr");
    expect(h).toContain("Promotion du printemps");
  });
});

describe("Import d'un export Google Ads Editor", () => {
  const csv = ["Campaign,Campaign Type,Campaign Status,Campaign Daily Budget,Bid Strategy Type,Ad Group,Ad Group Status,Max CPC,Keyword,Criterion Type,Status,Location,Location ID,Type,Ad type,Headline 1,Headline 2,Headline 3,Description 1,Description 2,Final URL,Sitelink text,Description Line 1,Description Line 2,Callout text",
    "Camp A,Search,Enabled,25.00,Maximize clicks,,,,,,,,,,,,,,,,,,,,",
    "Camp A,,,,,G1,Enabled,1.50,,,,,,,,,,,,,,,,,",
    "Camp A,,,,,G1,,,,,,,,,,,,,,,,,,,",
    "Camp A,,,,,G1,,,voyage quebec,Phrase,Enabled,,,,,,,,,,,,,,",
    "Camp A,,,,,G1,,,[voyage exact],Exact,Enabled,,,,,,,,,,,,,,",
    "Camp A,,,,,,,,gratuit,Campaign Negative Phrase,Enabled,,,,,,,,,,,,,,",
    "Camp A,,,,,G1,,,,,Enabled,,,,Responsive search ad,T1,T2,T3,D1,D2,https://www.ex.com/,,,,",
    "Camp A,,,,,,,,,,,Canada,2124,,,,,,,,,,,,",
    "Camp A,,,,,,,,,,,Saint-Simeon,,,,,,,,,,,,,",
    "Camp A,,,,,,,,,,Enabled,,,,,,,,,,https://www.ex.com/a,Lien A,d1,d2,",
    "Camp A,,,,,,,,,,Enabled,,,,,,,,,,,,,,Accroche 1"].join("\r\n");
  it("lit campagnes, groupes, mots-cles, annonce, lieux, liens, accroches", async () => {
    const buf = new TextEncoder().encode("\uFEFF" + csv).buffer;
    const res = await importerExportEditor(buf, "fr");
    expect(res).not.toBeNull();
    const { plan, cpt } = res!;
    expect(cpt.campagnes).toBe(1); expect(cpt.groupes).toBe(1); expect(cpt.motsCles).toBe(2); expect(cpt.negatifs).toBe(1); expect(cpt.rsa).toBe(1);
    expect(cpt.sitelinks).toBe(1); expect(cpt.callouts).toBe(1); expect(cpt.geoAmbigus).toBe(1);
    expect(plan.groupes[0].maxCPC).toBe("1.50");
    expect(plan.motsCles[1]).toMatchObject({ texte: "voyage exact", correspondance: "Exact" });
    expect(plan.campagnes[0].localisations.find((l) => l.nom === "Saint-Simeon")!.id).toBe("");
    expect(plan.rsas[0].titres.length).toBe(3);
    expect(res!.resumeHTML).toContain("Export Editor chargé");
  });
  it("decode un fichier UTF-16LE avec BOM", async () => {
    const u16 = new Uint8Array(2 + csv.length * 2); u16[0] = 0xff; u16[1] = 0xfe;
    for (let i = 0; i < csv.length; i++) { const c = csv.charCodeAt(i); u16[2 + i * 2] = c & 0xff; u16[3 + i * 2] = c >> 8; }
    const res = await importerExportEditor(u16.buffer, "fr");
    expect(res!.cpt.campagnes).toBe(1);
  });
});

describe("Exemples Firestore", () => {
  it("les 3 plans d'exemple sont valides par le moteur", async () => {
    const { exemples } = await import("@/lib/deck2editor/exemples");
    const ex = exemples();
    expect(ex.length).toBe(3);
    ex.forEach((e) => { const r = GAE.generer({ ...e.plan, options: { ...e.plan.options, aujourdhui: "2026-09-30" } }); expect(r.rapport.erreurs, e.titre).toEqual([]); });
  });
});
