import { ACCOUNTS, expect, test } from './fixtures'

test.describe('Authentication', () => {
  // Each test navigates itself; the authedPage/adminPage fixtures sign in on
  // their own, so a shared beforeEach would race against them.

  test('signs in with valid credentials and lands on the dashboard', async ({
    page,
  }) => {
    await page.goto('/sign-in?reset=true')
    await page.getByLabel('Email').fill(ACCOUNTS.user.email)
    await page.getByLabel('Password').fill(ACCOUNTS.user.password)
    await page.getByRole('button', { name: 'Sign in' }).click()

    await expect(page).toHaveURL(/\/dashboard/)
    await expect(page.getByTestId('dashboard-user-email')).toHaveText(
      ACCOUNTS.user.email,
    )
  })

  test('rejects invalid credentials with an error banner', async ({ page }) => {
    await page.goto('/sign-in?reset=true')
    await page.getByTestId('sign-in-email-input').fill('user@test.com')
    await page.getByTestId('sign-in-password-input').fill('WrongPass123!')
    await page.getByTestId('sign-in-submit-button').click()

    await expect(page.getByTestId('sign-in-error')).toHaveText(
      'Invalid email or password',
    )
    await expect(page).toHaveURL(/\/sign-in/)
  })

  test('rejects a locked account with a distinct message', async ({ page }) => {
    await page.goto('/sign-in?reset=true')
    await page.getByTestId('sign-in-email-input').fill(ACCOUNTS.locked.email)
    await page.getByTestId('sign-in-password-input').fill(ACCOUNTS.locked.password)
    await page.getByTestId('sign-in-submit-button').click()

    await expect(page.getByTestId('sign-in-error')).toContainText('locked')
  })

  test('shows inline validation errors for empty fields', async ({ page }) => {
    await page.goto('/sign-in?reset=true')
    await page.getByTestId('sign-in-submit-button').click()

    await expect(page.getByTestId('sign-in-email-error')).toBeVisible()
    await expect(page.getByTestId('sign-in-password-error')).toBeVisible()
    await expect(page.getByTestId('sign-in-email-input')).toHaveAttribute(
      'aria-invalid',
      'true',
    )
  })

  test('redirects unauthenticated visitors and returns them after sign-in', async ({
    page,
  }) => {
    // Boot the app on a public page first: a cold goto straight to a guarded
    // route races the redirect in WebKit and loses the ?redirect= param.
    await page.goto('/sign-in?reset=true')
    await expect(page.getByTestId('sign-in-form')).toBeVisible()

    await page.goto('/products')
    await expect(page).toHaveURL(/\/sign-in\?redirect=/)

    await page.getByTestId('sign-in-email-input').fill(ACCOUNTS.user.email)
    await page.getByTestId('sign-in-password-input').fill(ACCOUNTS.user.password)
    await page.getByTestId('sign-in-submit-button').click()

    await expect(page).toHaveURL(/\/products/)
  })

  test('signs out and blocks protected routes again', async ({ authedPage }) => {
    await authedPage.getByTestId('app-sign-out-button').click()
    await expect(authedPage).toHaveURL(/\/sign-in/)

    await authedPage.goto('/dashboard')
    await expect(authedPage).toHaveURL(/\/sign-in/)
  })

  test('hides the admin panel from standard users', async ({ authedPage }) => {
    await expect(authedPage.getByTestId('dashboard-admin-panel')).toBeHidden()
    await expect(authedPage.getByTestId('nav-link-admin')).toBeHidden()
  })

  test('shows the admin panel to admins', async ({ adminPage }) => {
    await expect(adminPage.getByTestId('dashboard-admin-panel')).toBeVisible()
    await expect(adminPage.getByTestId('nav-link-admin')).toBeVisible()
  })
})
