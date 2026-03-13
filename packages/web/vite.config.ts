import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": "/src",
    },
  },
  server: {
    proxy: {
      "/relay": {
        target: "http://localhost:3400",
        rewrite: (path) => path.replace(/^\/relay/, ""),
      },
    },
  },
});
