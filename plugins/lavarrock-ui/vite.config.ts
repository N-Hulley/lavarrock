import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "node:path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": resolve(__dirname, "src"),
    },
  },
  build: {
    lib: {
      entry: "src/manifest.ts",
      formats: ["es"],
      fileName: "manifest",
    },
    rollupOptions: {
      external: [
        "react",
        "react-dom",
        "react/jsx-runtime",
        "@lavarrock/plugin-sdk",
        "zod",
      ],
      output: {
        manualChunks: undefined,
      },
    },
  },
});
