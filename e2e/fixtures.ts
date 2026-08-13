import { test as base, expect, type Page } from '@playwright/test'

export const ACCOUNTS = {
  admin: { email: 'admin@test.com', password: 'Admin123!', name: 'Ada Admin' },
  user: { email: 'user@test.com', password: 'User123!', name: 'Sam Standard' },
  locked: { email: 'locked@test.com', password: 'Locked123!', name: 'Lee Locked' },
} as const

export type AccountKey = keyof typeof ACCOUNTS

/**
 * Signs in through the real UI and waits for the dashboard to be reachable.
 * `?reset=true` restores seed data first so each test starts from a known state.
 */
export async function signIn(page: Page, account: AccountKey = 'user') {
  const { email, password } = ACCOUNTS[account]

  await page.goto('/sign-in?reset=true')
  await page.getByTestId('sign-in-email-input').fill(email)
  await page.getByTestId('sign-in-password-input').fill(password)
  await page.getByTestId('sign-in-submit-button').click()
  await expect(page.getByTestId('dashboard-page')).toBeVisible()
}

interface Fixtures {
  /** Page already signed in as the standard user, sitting on the dashboard. */
  authedPage: Page
  /** Page already signed in as an admin. */
  adminPage: Page
}

export const test = base.extend<Fixtures>({
  authedPage: async ({ page }, use) => {
    await signIn(page, 'user')
    await use(page)
  },
  adminPage: async ({ page }, use) => {
    await signIn(page, 'admin')
    await use(page)
  },
})

export { expect } from '@playwright/test'
