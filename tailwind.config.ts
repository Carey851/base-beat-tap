import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{js,ts,jsx,tsx,mdx}", "./components/**/*.{js,ts,jsx,tsx,mdx}", "./lib/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        base: {
          blue: "#0052ff",
          cyan: "#4cc9ff",
        },
        console: {
          black: "#05070b",
          panel: "#0b1018",
          rail: "#151c27",
          line: "#263241",
        },
        acid: {
          lime: "#b7ff4a",
          green: "#41f08d",
          magenta: "#ff4dd8",
        },
      },
      boxShadow: {
        "panel-glow": "0 0 0 1px rgba(76, 201, 255, 0.18), 0 24px 80px rgba(0, 82, 255, 0.18)",
        "lime-soft": "0 0 18px rgba(183, 255, 74, 0.36)",
      },
      fontFamily: {
        mono: ["var(--font-geist-mono)", "ui-monospace", "SFMono-Regular", "Consolas", "monospace"],
        sans: ["var(--font-geist-sans)", "Inter", "ui-sans-serif", "system-ui"],
      },
    },
  },
  plugins: [],
};

export default config;
