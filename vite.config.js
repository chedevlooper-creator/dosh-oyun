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
        manualChunks: undefined,
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
        // bg-*.jpg'ler yalnızca eski Safari fallback'i — precache'e WebP'ler girsin
        globPatterns: ['**/*.{js,css,html,png,webp,woff2,webmanifest}'],
      },
      manifest: {
        name: 'Дош — Нохчийн дош',
        short_name: 'Дош',
        description: 'Chechen word puzzle game',
        theme_color: '#ffffff',
        icons: [
          {
            src: 'icon-192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'icon-512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    })
  ],
});
