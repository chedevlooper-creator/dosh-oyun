import { defineConfig } from "@playwright/test";

/* E2E smoke: vitest birim testlerin göremediği gerçek akışı sürer
 * (çark → kelime → ızgara → seviye sonu). `npm run test:e2e` */
export default defineConfig({
  testDir: "./e2e",
  timeout: 30_000,
  fullyParallel: true,
  retries: process.env.CI ? 1 : 0,
  use: {
    baseURL: "http://localhost:8765",
    trace: "retain-on-failure",
  },
  webServer: {
    command: "npm run dev",
    port: 8765,
    reuseExistingServer: !process.env.CI,
  },
});
