import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Page from "@/app/deck2editor/page";
import GAE from "@/lib/deck2editor/gae";
import { normaliserPlan, planExemple } from "@/lib/deck2editor/plan";

vi.mock("next/font/local", () => ({ default: () => ({ variable: "x", className: "x" }) }));

function monter() { return render(<Page />); }
const clic = (nom: string | RegExp) => fireEvent.click(screen.getAllByRole("button", { name: nom })[0]);
const etape = (n: RegExp) => fireEvent.click(screen.getByRole("button", { name: n }));

describe("Accueil", () => {
  it("explique l'outil et propose quatre facons de commencer", () => {
    monter();
    expect(screen.getByText("Décrire ou importer")).toBeInTheDocument();
    expect(screen.getByText("Vérifier et corriger")).toBeInTheDocument();
    expect(screen.getByText("Générer et présenter")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /À partir d’un brief \(IA\)/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /À la main/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /À partir d’un fichier/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Reprendre un plan/ })).toBeInTheDocument();
    expect(screen.queryByText("Valider et générer")).not.toBeInTheDocument();
  });
  it("« À la main » ouvre l'editeur a l'etape Contexte, et Accueil ramene a l'accueil", () => {
    monter();
    clic(/À la main/);
    expect(screen.getByText("1. Contexte", { selector: "h1" })).toBeInTheDocument();
    expect(screen.getByText("Valider et générer")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Brouillon IA/ })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /^Importer$/ })).not.toBeInTheDocument();
    clic(/^Accueil$/);
    expect(screen.getByText("Décrire ou importer")).toBeInTheDocument();
  });
  it("« À partir d’un fichier » ouvre l'editeur avec le panneau Importer", async () => {
    monter();
    clic(/À partir d’un fichier/);
    expect(await screen.findByText("Importer un plan")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Télécharger le modèle vide" })).toBeInTheDocument();
  });
});

describe("Editeur", () => {
  it("navigation Suivant / Precedent sur les 7 etapes", () => {
    monter(); clic(/À la main/);
    for (let i = 2; i <= 7; i++) { clic("Suivant"); expect(screen.getByText(new RegExp(`^${i}\\. `), { selector: "h1" })).toBeInTheDocument(); }
    expect(screen.queryByRole("button", { name: "Suivant" })).not.toBeInTheDocument();
    clic("Précédent");
    expect(screen.getByText("6. Performance Max", { selector: "h1" })).toBeInTheDocument();
  });

  it("plan vide : erreurs bloquantes, clic sur une erreur ouvre l'etape concernee", async () => {
    monter(); clic(/À la main/); clic(/^7/);
    clic("Valider et générer");
    expect((await screen.findAllByText(/erreur\(s\) bloquante\(s\)/)).length).toBeGreaterThan(0);
    fireEvent.click(screen.getAllByText(/Erreur · Campagnes/)[0].closest("button")!);
    expect(screen.getByText("2. Campagnes", { selector: "h1" })).toBeInTheDocument();
  });

  it("saisie complete puis generation verte avec fichiers a l'etape 7", async () => {
    const user = userEvent.setup();
    monter(); clic(/À la main/); etape(/^2/);
    await user.type(screen.getByPlaceholderText("Client | Offre | Search | FR"), "Camp Test");
    await user.type(screen.getByPlaceholderText("0,00 $"), "25");
    fireEvent.change(screen.getByLabelText(/^Stratégie/), { target: { value: "Maximize clicks" } });
    fireEvent.change(screen.getByLabelText(/annonces politiques UE/), { target: { value: "Non" } });
    clic("Canada");
    etape(/^3/); clic("+ Ajouter un groupe d’annonces");
    expect(screen.getByText("3. Groupes et annonces", { selector: "h1" })).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText(/^Campagne/), { target: { value: "Camp Test" } });
    await user.type(screen.getByPlaceholderText("nom_du_groupe"), "grp_test");
    await user.type(screen.getByPlaceholderText("https://www.exemple.com/page"), "https://www.ex.com/");
    fireEvent.click(screen.getAllByRole("button", { name: "Coller en lot" })[0]);
    await user.type(screen.getAllByPlaceholderText("Une ligne par élément")[0], "Titre un\nTitre deux\nTitre trois");
    clic("Ajouter ces lignes");
    fireEvent.click(screen.getAllByRole("button", { name: "Coller en lot" })[1]);
    await user.type(screen.getAllByPlaceholderText("Une ligne par élément")[0], "Description une.\nDescription deux.");
    clic("Ajouter ces lignes");
    etape(/^4/);
    fireEvent.change(screen.getAllByLabelText(/^Campagne/)[0], { target: { value: "Camp Test" } });
    fireEvent.change(screen.getByLabelText(/^Groupe d’annonces/), { target: { value: "grp_test" } });
    await user.type(screen.getByPlaceholderText(/mot cle exemple/), "mot un\nmot deux");
    fireEvent.click(screen.getAllByRole("button", { name: "Ajouter" })[0]);
    clic("Valider et générer");
    expect(await screen.findByText("Prêt pour l’import")).toBeInTheDocument();
    const stats = screen.getByText("Contenu").parentElement!;
    expect(within(stats).getByText("Mots-clés").previousSibling).toHaveTextContent("2");
    clic("Voir les fichiers et le deck client");
    expect(screen.getByText("7. Génération", { selector: "h1" })).toBeInTheDocument();
    expect(screen.getByText("00_import_google_ads_editor.csv")).toBeInTheDocument();
    expect(screen.getByText("Checklist après import")).toBeInTheDocument();
  });

  it("import deck colle depuis la carte du groupe", async () => {
    const user = userEvent.setup();
    monter(); clic(/À la main/); etape(/^2/);
    await user.type(screen.getByPlaceholderText("Client | Offre | Search | FR"), "C1");
    etape(/^3/); clic("+ Ajouter un groupe d’annonces");
    fireEvent.change(screen.getByLabelText(/^Campagne/), { target: { value: "C1" } });
    await user.type(screen.getByPlaceholderText("nom_du_groupe"), "g1");
    clic("Coller un deck");
    expect(await screen.findByRole("dialog")).toBeInTheDocument();
    const deck = "Headline 1\tNouveau titre A\nHeadline 2\tNouveau titre B\nDescription 1\tDesc A.\nFinal URL\thttps://www.ex.com/x\nKeywords\tType\nkw alpha\tPhrase";
    fireEvent.change(screen.getByLabelText("Contenu collé"), { target: { value: deck } });
    clic("Analyser");
    expect(await screen.findByText("Deck analysé")).toBeInTheDocument();
    expect(screen.queryByLabelText("Campagne de destination")).not.toBeInTheDocument();
    clic("Appliquer");
    expect(await screen.findByDisplayValue("Nouveau titre B")).toBeInTheDocument();
    expect(screen.getByDisplayValue("https://www.ex.com/x")).toBeInTheDocument();
  });

  it("panneau IA : exige le site officiel, puis charge le plan renvoye", async () => {
    const user = userEvent.setup();
    const planIA = { campagnes: [{ nom: "IA | Test | Search | FR", type: "Search", budgetQuotidien: "10", strategieEncheres: "Maximize clicks", politiqueUE: "Non", localisations: [{ id: "20123", nom: "Quebec" }] }], groupes: [{ campagne: "IA | Test | Search | FR", nom: "g_ia" }], rsas: [{ campagne: "IA | Test | Search | FR", groupe: "g_ia", titres: ["T1", "T2", "T3"], descriptions: ["D1", "D2"], urlFinale: "https://www.ex.com/" }] };
    const fetchMock = vi.fn(async () => ({ ok: true, json: async () => ({ plan: planIA, notes: "notes", sources: [], corrections: [], modele: "test" }) }));
    vi.stubGlobal("fetch", fetchMock);
    monter(); clic(/À partir d’un brief \(IA\)/);
    const dlg = within(await screen.findByRole("dialog"));
    await user.type(dlg.getByLabelText("Mandat"), "Mandat test");
    clic("Générer le brouillon");
    expect(fetchMock).not.toHaveBeenCalled();
    await user.type(within(screen.getByRole("dialog")).getByLabelText(/Site officiel du client/), "www.ex.com");
    clic("Générer le brouillon");
    expect(await screen.findByDisplayValue("IA | Test | Search | FR")).toBeInTheDocument();
    expect(screen.getByText("2. Campagnes", { selector: "h1" })).toBeInTheDocument();
    expect(JSON.parse((fetchMock.mock.calls[0] as unknown as [string, { body: string }])[1].body).siteOfficiel).toBe("www.ex.com");
    clic("Valider et générer");
    expect(await screen.findByText("Prêt pour l’import")).toBeInTheDocument();
    vi.unstubAllGlobals();
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
    expect(p.motsCles[0].correspondance).toBe("Phrase");
  });
});
