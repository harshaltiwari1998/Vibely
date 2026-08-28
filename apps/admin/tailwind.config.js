import type { Config } from "tailwindcss";
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          500: "#4f46e5",
          600: "#4338ca",
          700: "#3730a3",
        },
        ink: { 800: "#1e293b", 900: "#0f172a" },
      },
    },
  },
  plugins: [],
} satisfies Config;
