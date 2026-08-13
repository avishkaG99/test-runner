import { expect, test } from './fixtures'

test.describe('Dashboard', () => {
  test('shows a loading state before stats resolve', async ({ page }) => {
    // Hold the stats response open so the skeleton is unambiguously observable
    // rather than racing the mock API's ~400ms delay.
    let release: () => void = () => {}
    const held = new Promise<void>((resolve) => {
      release = resolve
    })
    await page.route('**/api/dashboard/stats', async (route) => {
      await held
      await route.continue()
    })

    await page.goto('/sign-in?reset=true')
    await page.getByTestId('sign-in-email-input').fill('user@test.com')
    await page.getByTestId('sign-in-password-input').fill('User123!')
    await page.getByTestId('sign-in-submit-button').click()

    await expect(page.getByTestId('dashboard-stats-loading')).toBeVisible()

    release()
    await expect(page.getByTestId('dashboard-stats')).toBeVisible()
    await expect(page.getByTestId('dashboard-stats-loading')).toBeHidden()
  })

  test('renders the seeded stat totals', async ({ authedPage }) => {
    await expect(
      authedPage.getByTestId('dashboard-stat-totalProducts-value'),
    ).toHaveText('20')
    await expect(
      authedPage.getByTestId('dashboard-stat-activeProducts-value'),
    ).toHaveText('15')
  })

  test('refetches stats on demand', async ({ authedPage }) => {
    await authedPage.getByTestId('dashboard-refresh-button').click()
    await expect(authedPage.getByTestId('dashboard-stats')).toBeVisible()
  })

  test('force-expiring the session sends the user back to sign-in', async ({
    authedPage,
  }) => {
    await authedPage.getByTestId('app-force-expire-button').click()
    await expect(authedPage).toHaveURL(/\/sign-in/)
  })

  test('serves a 404 page for unknown routes', async ({ authedPage }) => {
    await authedPage.goto('/this-route-does-not-exist')
    await expect(authedPage.getByTestId('not-found-page')).toBeVisible()
  })
})
