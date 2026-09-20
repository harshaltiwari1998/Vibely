import type { Config } from "tailwindcss";

/**
 * Vibely design tokens. The brand palette is defined here and can be retuned
 * without touching component code. The product name itself is configurable via
 * @vibely/config (env) — see src/brand.ts.
 */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Matches the purple/pink identity established by the Android app
        // (VibelyColors.AccentPurple = #7C3AED lands exactly on brand-600).
        brand: {
          50: "#f5f3ff",
          100: "#ede9fe",
          200: "#ddd6fe",
          300: "#c4b5fd",
          400: "#a78bfa",
          500: "#8b5cf6",
          600: "#7c3aed",
          700: "#6d28d9",
          800: "#5b21b6",
          900: "#4c1d95",
        },
        accent: {
          400: "#fb7fb0",
          500: "#ff5b82",
          600: "#ff1470",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      borderRadius: {
        xl: "1rem",
        "2xl": "1.5rem",
      },
    },
  },
  plugins: [],
} satisfies Config;
