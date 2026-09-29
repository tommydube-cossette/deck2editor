import JSZip from "jszip";
import type { Fichier } from "./types";

function telecharger(blob: Blob, nom: string) {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob); a.download = nom;
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

export function telechargerFichier(f: Fichier) {
  const mime = f.nom.endsWith(".txt") ? "text/plain" : "text/csv";
  telecharger(new Blob([f.csv], { type: `${mime};charset=utf-8` }), f.nom);
}

export async function telechargerZip(fichiers: Fichier[]) {
  const zip = new JSZip();
  fichiers.forEach((f) => zip.file(f.nom, f.csv));
  const blob = await zip.generateAsync({ type: "blob" });
  telecharger(blob, "import_google_ads_editor.zip");
}

export async function copierTSV(f: Fichier): Promise<boolean> {
  try { await navigator.clipboard.writeText(f.tsv); return true; } catch { return false; }
}
