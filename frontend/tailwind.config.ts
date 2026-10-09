import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#0a0e1a",
        surface: "#111625",
        surfaceElevated: "#171f33",
        surfaceBorder: "rgba(255, 255, 255, 0.08)",
        // Artistic color palette
        artisticIndigo: "#6366f1",
        artisticCoral: "#f97316",
        artisticAmber: "#f59e0b",
        artisticRose: "#f43f5e",
        artisticViolet: "#8b5cf6",
        artisticEmerald: "#10b981",
        artisticTeal: "#14b8a6",
        // Backward-compatible clean mappings (no harsh neon)
        cyberCyan: "#38bdf8",
        cyberEmerald: "#10b981",
        cyberAmber: "#f59e0b",
        cyberRed: "#f43f5e",
      },
      fontFamily: {
        sans: [
          "Plus Jakarta Sans",
          "Inter",
          "-apple-system",
          "BlinkMacSystemFont",
          "'Segoe UI'",
          "Roboto",
          "sans-serif",
        ],
      },
    },
  },
  plugins: [],
};

export default config;
