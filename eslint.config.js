/* ================= ESLINT FLAT CONFIG =================
 * Proje genelinde minimum-eslint kuralları. Hedef: 2026 kalite çıtası
 * için lint-gate'li PR süreci; aşırı kısıtlayıcı olmayan ama yeniden
 * gözden geçirilmesi gereken kalıpları yakalayan bir baseline. */

import js from "@eslint/js";
import globals from "globals";

export default [
  js.configs.recommended,
  {
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
      globals: {
        ...globals.browser,
        ...globals.node,
        // vite-plugin-pwa
        registerSW: "readonly",
      },
    },
    rules: {
      // Bug yakalama
      "no-unused-vars": ["warn", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }],
      "no-undef": "error",
      "no-redeclare": "error",
      "no-shadow": ["warn", { allow: ["i", "j", "k", "n", "e", "err", "el", "p", "b", "r", "c", "S", "G"] }],
      "no-cond-assign": "error",
      "no-dupe-else-if": "error",
      "no-implicit-globals": "off",
      "no-empty": ["error", { allowEmptyCatch: true }],
      // Stil
      "no-var": "warn",
      "prefer-const": "warn",
      "eqeqeq": ["error", "smart"],
      "curly": ["error", "multi-line"],
      // Console kullanımı (debug=1 modu için izin)
      "no-console": ["warn", { allow: ["warn", "error", "info"] }],
    },
  },
  {
    // Test dosyaları: describe/it/expect globals + console serbest
    files: ["js/__tests__/**/*.js", "vitest.config.js", "eslint.config.js"],
    languageOptions: { globals: { ...globals.node, describe: "readonly", it: "readonly", expect: "readonly", beforeEach: "readonly", vi: "readonly" } },
    rules: { "no-console": "off" },
  },
  {
    // Üretim: ignore
    ignores: ["dist/**", "dev-dist/**", "node_modules/**", "coverage/**"],
  },
];
