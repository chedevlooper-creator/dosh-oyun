import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";

/** Custom middleware: /editor ve /editor/ → /editor.html rewrite */
function editorRewrite() {
  return {
    name: "editor-rewrite",
    configureServer(server) {
      server.middlewares.use((req, _, next) => {
        if (req.url === "/editor" || req.url === "/editor/") {
          req.url = "/editor.html";
        }
        next();
      });
    },
  };
}

export default defineConfig({
  root: ".",
  base: "/",
  appType: "mpa",
  build: {
    outDir: "dist",
    emptyOutDir: true,
    assetsInlineLimit: 0, // woff2, png dosyalarını inline yapma
    rollupOptions: {
      input: {
        main: "./index.html",
        editor: "./editor.html",
      },
      output: {
        manualChunks(id) {
          if (id.includes("node_modules/three")) return "three";
          if (id.includes("node_modules/@sentry")) return "sentry";
          if (id.includes("node_modules")) return "vendor";
          if (id.includes("/js/data/info.js")) return "data-info";
        },
      },
    },
  },
  server: {
    port: 8765,
    open: false,
  },
  plugins: [
    editorRewrite(),
    VitePWA({
      registerType: 'autoUpdate',
      devOptions: {
        enabled: true
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,png,webp,woff2,webmanifest}'],
      },
      manifest: {
        name: 'Дош — Нохчийн дош',
        short_name: 'Дош',
        description: 'Chechen word puzzle game',
        lang: 'ce',
        dir: 'ltr',
        start_url: '/',
        display: 'standalone',
        orientation: 'portrait',
        theme_color: '#0e2a3f',
        background_color: '#0e2a3f',
        // "any" ve "maskable" ayrı girişler olmalı: maskable kırpması
        // normal ikonu bozmasın (Lighthouse/Play önerisi)
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
        shortcuts: [
          {
            name: 'Денна дош',
            short_name: 'Денна',
            description: 'Daily puzzle',
            url: '/?daily=1',
            icons: [{ src: 'icon-192.png', sizes: '192x192' }],
          },
        ],
      }
    })
  ],
});
