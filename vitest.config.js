import { defineConfig } from "vitest/config";

/* Vitest: DOM gerektiren testler jsdom ortamında çalışsın, saf birim testler
 * node'da kalsın. Her test dosyası kendi başında ortamını isteyebilir,
 * ancak default olarak jsdom kullanmak paket tutarlılığını artırır. */
export default defineConfig({
  test: {
    environment: "jsdom",
    globals: false,
    include: ["js/__tests__/**/*.test.js"],
    coverage: {
      provider: "v8",
      include: ["js/**/*.js"],
      exclude: ["js/__tests__/**", "js/data/levels/**", "js/data/info.js"],
      reporter: ["text", "text-summary", "html"],
      reportsDirectory: "coverage",
    },
  },
});
