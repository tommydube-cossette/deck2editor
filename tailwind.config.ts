import type { Config } from "tailwindcss";

// Tokens extraits du CSS compile de MediaBox (v2.3.0.4) : palette primary, rayons, polices.
const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#594a99",
          50: "#f4f3fb",
          100: "#e9e6f6",
          200: "#d5cfec",
          300: "#b6abdd",
          400: "#9282c9",
          500: "#6f5cb0",
          600: "#594a99",
          700: "#493d7e",
          800: "#3a3163",
          900: "#2b2549",
        },
      },
      borderRadius: {
        control: "var(--radius-control)",
        surface: "var(--radius-surface)",
      },
      fontFamily: {
        sans: ["var(--font-urbanist)", "Urbanist", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
      },
    },
  },
  plugins: [],
};
export default config;
