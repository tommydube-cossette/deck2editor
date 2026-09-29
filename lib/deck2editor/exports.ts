import type { Plan } from "./types";

/* ExcelJS et le module de portage sont charges a la demande : ils restent hors du bundle principal de la page. */
async function charger() {
  const [xl, portage] = await Promise.all([import("exceljs"), import("./portage")]);
  portage.setExcelJS(xl.default || xl);
  return { ExcelJS: xl.default || xl, ...portage };
}

function telecharger(blob: Blob, nom: string) {
  const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = nom;
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}
const base = (plan: Plan, prefixe: string, langue: string) => `${prefixe}_${(plan.options.client || "plan").replace(/[^A-Za-z0-9_-]+/g, "_")}_${langue.toUpperCase()}`;

/* Deck client Excel ("plan") ou modele vide a remplir ("modele"). */
export async function excelBuffer(plan: Plan, mode: "plan" | "modele", langue = "fr"): Promise<ArrayBuffer> {
  const { avecContexte, classeurExcel } = await charger();
  avecContexte(plan, plan.options, langue);
  const wb = classeurExcel(mode);
  return wb.xlsx.writeBuffer() as Promise<ArrayBuffer>;
}
export async function telechargerExcel(plan: Plan, mode: "plan" | "modele", langue = "fr") {
  const buf = await excelBuffer(plan, mode, langue);
  const nom = mode === "modele" ? `modele_deck_sem_${langue.toUpperCase()}.xlsx` : `${base(plan, "deck_client", langue)}.xlsx`;
  telecharger(new Blob([buf], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }), nom);
}

/* Import d'un plan Excel (modele rempli ou deck genere). Retourne null si aucun onglet reconnu. */
export async function importerExcel(buf: ArrayBuffer, langue = "fr"): Promise<Plan | null> {
  const { ExcelJS, avecContexte, lireClasseurExcel } = await charger();
  avecContexte(null, {}, langue);
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(buf);
  return lireClasseurExcel(wb) as Plan | null;
}

/* Deck client HTML (telechargement) et PDF (impression navigateur). */
export async function deckHTML(plan: Plan, langue = "fr"): Promise<string> {
  const { avecContexte, deckClientHTML } = await charger();
  avecContexte(plan, plan.options, langue);
  return deckClientHTML() as string;
}
export async function telechargerDeckHTML(plan: Plan, langue = "fr") {
  telecharger(new Blob([await deckHTML(plan, langue)], { type: "text/html;charset=utf-8" }), `${base(plan, "deck_client", langue)}.html`);
}
export async function imprimerDeckPDF(plan: Plan, langue = "fr") {
  const w = window.open("", "_blank");
  if (!w) return false;
  const html = await deckHTML(plan, langue);
  w.document.open(); w.document.write(html); w.document.close();
  w.onload = () => { w.focus(); w.print(); };
  setTimeout(() => { try { w.focus(); w.print(); } catch { /* deja imprime */ } }, 600);
  return true;
}

/* Import d'un export Google Ads Editor (CSV / TSV). */
export interface ResultatEditor { plan: Plan; cpt: Record<string, number>; resumeHTML: string; }
export async function importerExportEditor(buf: ArrayBuffer, langue = "fr"): Promise<ResultatEditor | null> {
  const { avecContexte, decoderExport, lireExportEditor, resumeExport } = await charger();
  avecContexte(null, {}, langue);
  const texte = decoderExport(buf) as string;
  const res = lireExportEditor(texte) as { plan: Plan; cpt: Record<string, number> } | null;
  if (!res) return null;
  return { ...res, resumeHTML: resumeExport(res.cpt) as string };
}
