import { defineConfig } from "vite";
import path from "path";
import react from "@vitejs/plugin-react-swc";
import tailwindcss from "@tailwindcss/vite";
import { cloudflare } from "@cloudflare/vite-plugin";
import { ViteWebfontDownload } from "vite-plugin-webfont-dl";

// https://vite.dev/config/
export default defineConfig(() => ({
  plugins: [
    react(),
    cloudflare(),
    tailwindcss(),
    ViteWebfontDownload([
      "https://fonts.googleapis.com/css2?family=Almendra+SC&family=Zilla+Slab:wght@400;500;600&family=Work+Sans:wght@400;600&display=swap",
    ]),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
  server: { allowedHosts: ["admin-local.quest-lock.com"] },  // TODO
}));
