import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite-plus";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    tsconfigPaths: true,
  },
  server: {
    host: true,
    port: 5173,
    watch: {
      usePolling: true,
    },
    hmr: {
      host: "localhost",
      port: 5173,
    },
  },
  preview: { port: 4173 },
  test: {
    include: ["src/**/*.test.{ts,tsx}"],
  },
  lint: {
    ignorePatterns: ["dist/**", "coverage/**"],
    options: {
      typeAware: true,
      typeCheck: true,
    },
    plugins: ["typescript", "react"],
  },
  fmt: {
    ignorePatterns: ["dist/**", "coverage/**", "package-lock.json"],
  },
  staged: {
    "*.@(js|ts|tsx|json|md|yaml|yml|css|html)": "vp check --fix",
  },
});
