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

/**
 * Vite önbellek temizleme (Windows fix).
 * Vite, eski transform sonuçlarını cache'te tutar ve dosya değişse bile
 * eski sürümü serve edebilir. Dosya değişikliklerinde ilgili modülü
 * moduleGraph'ten düşürerek Vite'in yeniden derlemesini zorunlu kılar.
 */
function cacheBuster() {
  return {
    name: "cache-buster",
    configureServer(server) {
      // Dosya değişikliklerinde ilgili modülü cache'ten düşür
      server.watcher.on("change", (path) => {
        const mods = server.moduleGraph.getModulesByFile(path);
        if (mods) {
          for (const mod of mods) {
            server.moduleGraph.invalidateModule(mod);
          }
        }
      });
    },
  };
}

export default defineConfig({
  root: ".",
  base: "/",
  appType: "mpa",

  // Önbellek dizini: node_modules/.vite yerine proje kökündeki .vite/
  // (Windows'ta node_modules derin yol sorunlarına yol açabiliyor)
  cacheDir: ".vite",

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
    // Windows: chokidar bazen değişiklik bildirimini geç veya hiç
    // göndermez. Polling fallback'i sadece Windows'ta etkinleştir.
    watch: {
      usePolling: process.platform === "win32",
      interval: 100,
    },
  },

  plugins: [
    editorRewrite(),
    cacheBuster(),
    VitePWA({
      registerType: 'autoUpdate',
      devOptions: {
        enabled: true
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,png,webp,woff2,webmanifest,json}'],
        runtimeCaching: [
          {
            // Pack JSON'ları: önce cache, arkada güncelle (offline-first)
            urlPattern: /\/assets\/pack-\d+/,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'level-packs',
              expiration: { maxEntries: 20, maxAgeSeconds: 30 * 24 * 60 * 60 },
            },
          },
          {
            // Diğer asset'ler (js, css, font, resim): cache-first
            urlPattern: /\/assets\/.*\.(?:js|css|woff2|png|webp)$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'static-assets',
              expiration: { maxEntries: 60, maxAgeSeconds: 90 * 24 * 60 * 60 },
            },
          },
          {
            // HTML sayfaları: network-first, offline'da cache fallback
            urlPattern: ({ request }) => request.destination === 'document',
            handler: 'NetworkFirst',
            options: {
              cacheName: 'pages',
              expiration: { maxEntries: 10, maxAgeSeconds: 7 * 24 * 60 * 60 },
            },
          },
        ],
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
