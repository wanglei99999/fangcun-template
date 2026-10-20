import { defineConfig } from '@playwright/test';

const PORT = 4322;

/**
 * End-to-end tests run against `astro preview` of a finished build, because full-text search
 * needs the Pagefind index that `pnpm build` generates. Run `pnpm test` to build and test in one go.
 * Set PW_CHANNEL=msedge (or chrome) to use an installed browser instead of Playwright's Chromium.
 */
export default defineConfig({
  testDir: 'tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: `http://127.0.0.1:${PORT}`,
    channel: process.env.PW_CHANNEL,
    viewport: { width: 1440, height: 1000 },
    colorScheme: 'light',
    trace: 'retain-on-failure',
  },
  webServer: {
    // Calls Astro directly so the tests don't depend on how pnpm is installed.
    command: `node node_modules/astro/bin/astro.mjs preview --host 127.0.0.1 --port ${PORT}`,
    url: `http://127.0.0.1:${PORT}`,
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
});
