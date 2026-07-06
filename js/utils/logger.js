// @ts-check
/* ================= LOGGER =================
 * Production'da console.warn/error silent
 * DEV'de normal console output (tree-shake devlet)
 * ============================================ */

/**
 * Development log'ları (production'da silent)
 * @param {any[]} args
 */
export function warn(...args) {
  if (!import.meta.env.PROD) console.warn(...args);
}

/**
 * Error log'ları (production'da silent, ama Sentry'ye gider)
 * @param {any[]} args
 */
export function error(...args) {
  if (!import.meta.env.PROD) console.error(...args);
}

/**
 * Info log'ları (production'da silent)
 * @param {any[]} args
 */
export function info(...args) {
  if (!import.meta.env.PROD) console.info(...args);
}

/**
 * Production'da da göster (kritik mesajlar)
 * @param {any[]} args
 */
export function persistent(...args) {
  console.warn(...args);
}
