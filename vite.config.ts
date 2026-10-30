import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { blogPrerender } from "./src/lib/blog-prerender";

// https://vitejs.dev/config/
export default defineConfig({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [react(), blogPrerender(__dirname)],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
