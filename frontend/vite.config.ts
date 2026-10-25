import react, { reactCompilerPreset } from "@vitejs/plugin-react";
import babel from "@rolldown/plugin-babel";
import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    babel({ presets: [reactCompilerPreset()] }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "./src"),
    },
  },
  server: {
    proxy: {
      "/auth": process.env.BACKEND_URL ?? "http://localhost:3000",
      "/users": process.env.BACKEND_URL ?? "http://localhost:3000",
      "/reports": process.env.BACKEND_URL ?? "http://localhost:3000",
      "/products": process.env.BACKEND_URL ?? "http://localhost:3000",
      "/categories": process.env.BACKEND_URL ?? "http://localhost:3000",
      "/addons": process.env.BACKEND_URL ?? "http://localhost:3000",
      "/inventory": process.env.BACKEND_URL ?? "http://localhost:3000",
      "/transactions": process.env.BACKEND_URL ?? "http://localhost:3000",
      "/shifts": process.env.BACKEND_URL ?? "http://localhost:3000",
    },
  },
});
