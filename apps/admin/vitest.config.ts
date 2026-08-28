import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { fileURLToPath, URL } from "node:url";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
      "@vibely/config": fileURLToPath(new URL("../../packages/config/src/index.ts", import.meta.url)),
      "@vibely/types": fileURLToPath(new URL("../../packages/types/src/index.ts", import.meta.url)),
      "@vibely/shared": fileURLToPath(new URL("../../packages/shared/src/index.ts", import.meta.url)),
    },
  },
  test: { globals: true, environment: "jsdom", setupFiles: ["./src/test/setup.ts"] },
});
