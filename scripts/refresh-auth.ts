import { chromium } from '@playwright/test'
import { readFileSync } from 'node:fs'
import { mkdir } from 'node:fs/promises'
import path from 'node:path'

/**
 * Generates Playwright storage-state files so web-app-tester can start already
 * signed in. Referenced by `authSetupCommand` in .web-app-tester.json, which
 * the plugin runs when a session has expired.
 */
/**
 * Falls back to the configured default environment rather than assuming
 * localhost, so storage states are generated against the same origin the
 * plugin will test - localStorage sessions are origin-scoped and would be
 * ignored if written for the wrong host.
 */
function resolveBaseUrl(): string {
  if (process.env.BASE_URL) return process.env.BASE_URL

  try {
    const config = JSON.parse(
      readFileSync(path.resolve('.web-app-tester.json'), 'utf8'),
    ) as {
      defaultEnvironment?: string
      environments?: Record<string, { baseUrl?: string }>
    }
    const name = process.env.WAT_ENV ?? config.defaultEnvironment
    const url = name ? config.environments?.[name]?.baseUrl : undefined
    if (url) return url
  } catch {
    /* fall through to the local default */
  }
  return 'http://localhost:5173'
}

const BASE_URL = resolveBaseUrl()
const OUT_DIR = path.resolve('tests/e2e/.auth')

const ROLES = [
  { role: 'user', email: 'user@test.com', password: 'User123!' },
  { role: 'admin', email: 'admin@test.com', password: 'Admin123!' },
]

async function main() {
  await mkdir(OUT_DIR, { recursive: true })
  const browser = await chromium.launch()

  try {
    for (const { role, email, password } of ROLES) {
      const context = await browser.newContext()
      const page = await context.newPage()

      // ?reset=true clears any prior session and restores seed data first.
      await page.goto(`${BASE_URL}/sign-in?reset=true`)
      await page.getByTestId('sign-in-email-input').fill(email)
      await page.getByTestId('sign-in-password-input').fill(password)
      await page.getByTestId('sign-in-submit-button').click()
      await page.getByTestId('dashboard-page').waitFor({ timeout: 15_000 })

      const file = path.join(OUT_DIR, `${role}.json`)
      await context.storageState({ path: file })
      console.log(`wrote ${role} storage state -> ${file}`)
      await context.close()
    }
  } finally {
    await browser.close()
  }
}

main().catch((error) => {
  console.error('Failed to refresh auth storage states:', error)
  process.exit(1)
})
