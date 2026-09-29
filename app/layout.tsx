import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { AuthProvider } from "@/lib/auth";

/* Memes fichiers de police que MediaBox en production (sous-ensembles latin, poids variables). */
const urbanist = localFont({ src: "./fonts/Urbanist-latin.woff2", weight: "100 900", variable: "--font-urbanist", display: "swap", fallback: ["Arial", "system-ui", "sans-serif"] });
const mono = localFont({ src: "./fonts/JetBrainsMono-latin.woff2", weight: "100 800", variable: "--font-mono", display: "swap", fallback: ["ui-monospace", "monospace"] });

export const metadata: Metadata = {
  title: "Deck2Editor | MediaBox",
  description: "Deck vers Google Ads Editor",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" translate="no" className={`${urbanist.variable} ${mono.variable}`}>
      <body className="min-h-screen bg-gray-50 font-sans">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
