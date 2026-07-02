import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        pine: {
          50: "#eef4f0",
          100: "#d3e3da",
          200: "#a7c7b6",
          300: "#6fa388",
          400: "#3f7a5f",
          500: "#27604a",
          600: "#1c4a39",
          700: "#16352a",
          800: "#102619",
          900: "#0a1a11",
        },
        harvest: {
          100: "#f6ecc8",
          200: "#ecd88f",
          300: "#dcc05a",
          400: "#c9a227",
          500: "#a9871c",
          600: "#866a18",
        },
        soil: "#3d2c1e",
        paper: "#f7f4ec",
        sage: "#e4ebe2",
        clay: "#b5613b",
      },
      fontFamily: {
        display: ["var(--font-fraunces)", "Georgia", "serif"],
        sans: ["var(--font-jakarta)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
      },
      boxShadow: {
        card: "0 1px 2px rgba(16,38,25,.04), 0 8px 24px -12px rgba(16,38,25,.18)",
        lift: "0 8px 40px -16px rgba(16,38,25,.35)",
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "grow-bar": {
          "0%": { transform: "scaleX(0)" },
          "100%": { transform: "scaleX(1)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
      },
      animation: {
        "fade-up": "fade-up .6s cubic-bezier(.22,1,.36,1) both",
        "grow-bar": "grow-bar 1s cubic-bezier(.22,1,.36,1) both",
        shimmer: "shimmer 1.6s linear infinite",
      },
    },
  },
  plugins: [],
};
export default config;
