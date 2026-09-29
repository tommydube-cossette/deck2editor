import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Page from "@/app/deck2editor/page";
import GAE from "@/lib/deck2editor/gae";
import { normaliserPlan, planExemple } from "@/lib/deck2editor/plan";

vi.mock("next/font/local", () => ({ default: () => ({ variable: "x", className: "x" }) }));

function monter() { return render(<Page />); }
const clic = (nom: string | RegExp) => fireEvent.click(screen.getByRole("button", { name: nom }));

describe("Deck2Editor UI", () => {
  it("charge l'exemple, valide et genere un fichier 00 pret", async () => {
    monter();
    expect(screen.getByText("À quoi sert cet outil")).toBeInTheDocument();
    clic("Charger un exemple complet");
    expect(screen.getByText("Campagnes", { selector: "h1" })).toBeInTheDocument();
    expect(screen.getByDisplayValue("Client | Promotion printemps | Search | FR")).toBeInTheDocument();
    clic("Valider et générer");
    expect(await screen.findByText("Prêt pour l’import")).toBeInTheDocument();
    expect(screen.getByText("00_import_google_ads_editor.csv")).toBeInTheDocument();
    expect(screen.getByText("11_CHECKLIST_post_import.txt")).toBeInTheDocument();
  });

  it("signale les erreurs bloquantes et navigue vers l'onglet concerne", async () => {
    monter();
    clic("Valider et générer");
    expect(await screen.findByText(/erreur\(s\) bloquante\(s\)/)).toBeInTheDocument();
    const msgs = screen.getAllByText(/Erreur · Campagnes/);
    fireEvent.click(msgs[0].closest("button")!);
    expect(screen.getByText("Campagnes", { selector: "h1" })).toBeInTheDocument();
  });

  it("ajoute une campagne, un groupe, des titres et des mots-cles, puis genere", async () => {
    const user = userEvent.setup();
    monter();
    clic(/^Campagnes/);
    // Une campagne vide existe deja au demarrage, comme dans la version Apps Script.
    await user.type(screen.getByPlaceholderText("Client | Offre | Search | FR"), "Camp Test");
    await user.type(screen.getByPlaceholderText("0,00 $"), "25");
    fireEvent.change(screen.getByLabelText(/^Stratégie/), { target: { value: "Maximize clicks" } });
    fireEvent.change(screen.getByLabelText(/annonces politiques UE/), { target: { value: "Non" } });
    clic("Canada");
    clic(/^Groupes et annonces/);
    clic("+ Ajouter un groupe d’annonces");
    fireEvent.change(screen.getByLabelText(/^Campagne/), { target: { value: "Camp Test" } });
    await user.type(screen.getByPlaceholderText("nom_du_groupe"), "grp_test");
    await user.type(screen.getByPlaceholderText("https://www.exemple.com/page"), "https://www.ex.com/");
    // Coller en lot 3 titres
    const [collerTitres] = screen.getAllByRole("button", { name: "Coller en lot" });
    fireEvent.click(collerTitres);
    await user.type(screen.getAllByPlaceholderText("Une ligne par élément")[0], "Titre un\nTitre deux\nTitre trois");
    clic("Importer");
    expect(screen.getByDisplayValue("Titre trois")).toBeInTheDocument();
    const [, collerDesc] = screen.getAllByRole("button", { name: "Coller en lot" });
    fireEvent.click(collerDesc);
    await user.type(screen.getAllByPlaceholderText("Une ligne par élément")[0], "Description une.\nDescription deux.");
    clic("Importer");
    clic(/^Mots-clés/);
    fireEvent.change(screen.getAllByLabelText(/^Campagne/)[0], { target: { value: "Camp Test" } });
    fireEvent.change(screen.getByLabelText(/^Groupe d’annonces/), { target: { value: "grp_test" } });
    await user.type(screen.getByPlaceholderText(/mot cle exemple/), "mot un\nmot deux");
    fireEvent.click(screen.getAllByRole("button", { name: "Ajouter" })[0]);
    expect(screen.getByText("mot deux")).toBeInTheDocument();
    clic("Valider et générer");
    expect(await screen.findByText("Prêt pour l’import")).toBeInTheDocument();
    const stats = screen.getByText("Contenu").parentElement!;
    expect(within(stats).getByText("Mots-clés").previousSibling).toHaveTextContent("2");
  });

  it("import deck : colle un deck et l'applique au groupe", async () => {
    const user = userEvent.setup();
    monter();
    clic("Charger un exemple complet");
    clic("Import deck");
    const deck = "Headline 1\tNouveau titre A\nHeadline 2\tNouveau titre B\nHeadline 3\tNouveau titre C\nDescription 1\tDesc A.\nDescription 2\tDesc B.\nFinal URL\thttps://www.ex.com/x\nKeywords\tType\nkw alpha\tPhrase\nSitelinks\nLien X\thttps://www.ex.com/l";
    fireEvent.change(screen.getByLabelText("Contenu collé"), { target: { value: deck } });
    clic("Analyser");
    expect(await screen.findByText("Deck analysé")).toBeInTheDocument();
    expect(screen.getByText(/1 mot\(s\)-clé\(s\)/)).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Campagne de destination"), { target: { value: "Client | Promotion printemps | Search | FR" } });
    fireEvent.change(screen.getByLabelText("Groupe de destination"), { target: { value: "promotion_printemps_fr" } });
    clic("Appliquer");
    expect(screen.getByDisplayValue("Nouveau titre C")).toBeInTheDocument();
    expect(screen.getByDisplayValue("https://www.ex.com/x")).toBeInTheDocument();
  });

  it("supprimer une campagne retire ses elements lies", () => {
    monter();
    clic("Charger un exemple complet");
    clic("Supprimer");
    clic(/^Mots-clés/);
    expect(screen.getByText("Aucun mot-clé.")).toBeInTheDocument();
  });
});

describe("Moteur et normalisation", () => {
  it("le moteur valide l'exemple sans erreur", () => {
    const r = GAE.generer({ ...planExemple(), options: { aujourdhui: "2026-09-29" } });
    expect(r.rapport.pret).toBe(true);
    expect(r.fichiers[0].csv.startsWith("\uFEFFCampaign,")).toBe(true);
  });
  it("normaliserPlan aligne rsas sur groupes et convertit les titres en chaines", () => {
    const p = normaliserPlan({ campagnes: [{ nom: "C" }], groupes: [{ campagne: "C", nom: "G" }], rsas: [{ campagne: "C", groupe: "G", titres: ["A", "B"], descriptions: ["d"] }], motsCles: [{ campagne: "C", groupe: "G", texte: "k" }] });
    expect(p.rsas.length).toBe(1);
    expect(p.rsas[0].titres[1]).toEqual({ texte: "B", pin: "" });
    expect(p.campagnes[0].localisations.length).toBe(1);
    expect(p.motsCles[0].correspondance).toBe("Phrase");
  });
});
