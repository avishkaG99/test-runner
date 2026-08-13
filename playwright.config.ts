import { defineConfig, devices } from '@playwright/test'

// Overridable so the suite can run against a deployed preview:
//   BASE_URL=https://…vercel.app npm run test:e2e
export const BASE_URL = process.env.BASE_URL ?? 'http://localhost:5173'

export default defineConfig({
  // Repo root so both the hand-written suite in e2e/ and generated specs under
  // generated/Tests/ are discovered.
  testDir: '.',
  testMatch: ['e2e/**/*.spec.ts', 'generated/**/*.spec.ts'],
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: [['html', { open: 'never' }], ['list']],

  use: {
    baseURL: BASE_URL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
  ],

  // Only boot a dev server when testing locally. With BASE_URL pointing at a
  // deployed preview there is nothing to start.
  webServer: process.env.BASE_URL
    ? undefined
    : {
        command: 'npm run dev',
        url: BASE_URL,
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
      },
})
