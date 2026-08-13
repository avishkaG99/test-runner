import { expect, test } from './fixtures'

/**
 * Broad smoke coverage: every screen renders, key interactions work, and no
 * console errors appear. The AI agent writes the detailed suites; this exists
 * so regressions in the app itself surface immediately.
 */
test.describe('Smoke', () => {
  test('every protected screen renders for a signed-in user', async ({
    authedPage,
  }) => {
    const screens = [
      { path: '/dashboard', testId: 'dashboard-page' },
      { path: '/products', testId: 'products-page' },
      { path: '/forms', testId: 'forms-page' },
      { path: '/forms/wizard', testId: 'wizard-page' },
      { path: '/ui-playground', testId: 'ui-playground-page' },
      { path: '/reports', testId: 'reports-page' },
      { path: '/settings', testId: 'settings-page' },
    ]

    for (const screen of screens) {
      await authedPage.goto(screen.path)
      // Firefox re-boots the MSW worker on every full page load, so allow more
      // headroom than the default 5s expect timeout.
      await expect(authedPage.getByTestId(screen.testId)).toBeVisible({
        timeout: 15_000,
      })
    }
  })

  test('products table filters, sorts, and paginates', async ({
    authedPage,
  }) => {
    await authedPage.goto('/products')
    await expect(authedPage.getByTestId('products-table')).toBeVisible()
    await expect(authedPage.getByTestId('products-total-count')).toHaveText('20')

    await authedPage.getByTestId('products-search-input').fill('Aurora')
    await expect(authedPage.getByTestId('products-total-count')).toHaveText('1')

    await authedPage.getByTestId('products-search-input').fill('')
    await authedPage.getByTestId('products-category-filter').selectOption('books')
    await expect(authedPage.getByTestId('products-total-count')).toHaveText('4')

    await authedPage.getByTestId('products-category-filter').selectOption('all')
    await authedPage.getByTestId('products-next-page').click()
    await expect(authedPage.getByTestId('products-page-indicator')).toHaveText(
      'Page 2 of 2',
    )
  })

  test('creates, edits, and deletes a product', async ({ authedPage }) => {
    await authedPage.goto('/products')

    await authedPage.getByTestId('products-create-button').click()
    await expect(authedPage.getByTestId('products-create-dialog')).toBeVisible()
    await authedPage.getByTestId('products-create-name-input').fill('Zephyr Test Widget')
    await authedPage.getByTestId('products-create-sku-input').fill('TEST-9001')
    await authedPage.getByTestId('products-create-price-input').fill('19.99')
    await authedPage.getByTestId('products-create-stock-input').fill('7')
    await authedPage.getByTestId('products-create-submit').click()

    await expect(authedPage.getByTestId('products-create-dialog')).toBeHidden()
    await authedPage.getByTestId('products-search-input').fill('Zephyr')
    await expect(authedPage.getByTestId('products-total-count')).toHaveText('1')

    const row = authedPage.locator('[data-testid^="products-row-"]').first()
    const id = await row.getAttribute('data-testid')
    const productId = id!.replace('products-row-', '')

    await authedPage.getByTestId(`products-edit-${productId}`).click()
    await authedPage.getByTestId('products-edit-name-input').fill('Zephyr Renamed')
    await authedPage.getByTestId('products-edit-submit').click()
    await expect(authedPage.getByTestId(`products-name-${productId}`)).toHaveText(
      'Zephyr Renamed',
    )

    await authedPage.getByTestId(`products-delete-${productId}`).click()
    await authedPage.getByTestId('products-delete-confirm').click()
    await expect(authedPage.getByTestId('products-empty')).toBeVisible()
  })

  test('rejects invalid product input and surfaces server errors', async ({
    authedPage,
  }) => {
    await authedPage.goto('/products')
    await authedPage.getByTestId('products-create-button').click()

    await authedPage.getByTestId('products-create-submit').click()
    await expect(authedPage.getByTestId('products-create-name-error')).toBeVisible()
    await expect(authedPage.getByTestId('products-create-sku-error')).toBeVisible()

    await authedPage.getByTestId('products-create-name-input').fill('fail this product')
    await authedPage.getByTestId('products-create-sku-input').fill('TEST-9002')
    await authedPage.getByTestId('products-create-price-input').fill('5')
    await authedPage.getByTestId('products-create-stock-input').fill('1')
    await authedPage.getByTestId('products-create-submit').click()

    await expect(authedPage.getByTestId('products-create-error')).toBeVisible()
  })

  test('forms showcase validates and submits', async ({ authedPage }) => {
    await authedPage.goto('/forms')

    await authedPage.getByTestId('forms-submit-button').click()
    await expect(authedPage.getByTestId('forms-fullname-error')).toBeVisible()

    await authedPage.getByTestId('forms-fullname-input').fill('Test User')
    await authedPage.getByTestId('forms-email-input').fill('tester@test.com')
    await authedPage.getByTestId('forms-plan-select').selectOption('pro')
    await authedPage.getByTestId('forms-country-input').click()
    await authedPage.getByTestId('forms-country-option-lk').click()
    await authedPage.getByTestId('forms-interest-automation').check()
    await authedPage.getByTestId('forms-start-date-input').fill('2026-01-01')
    await authedPage.getByTestId('forms-end-date-input').fill('2026-02-01')
    await authedPage.getByTestId('forms-submit-button').click()

    await expect(authedPage.getByTestId('forms-success')).toBeVisible()
    await expect(authedPage.getByTestId('forms-submitted-json')).toContainText(
      'tester@test.com',
    )
  })

  test('cross-field date validation rejects an end date before the start', async ({
    authedPage,
  }) => {
    await authedPage.goto('/forms')
    await authedPage.getByTestId('forms-start-date-input').fill('2026-05-01')
    await authedPage.getByTestId('forms-end-date-input').fill('2026-04-01')
    await authedPage.getByTestId('forms-end-date-input').blur()

    await expect(authedPage.getByTestId('forms-end-date-error')).toBeVisible()
  })

  test('wizard walks through every step and submits', async ({ authedPage }) => {
    await authedPage.goto('/forms/wizard')

    await authedPage.getByTestId('wizard-next-button').click()
    await expect(authedPage.getByTestId('wizard-first-name-error')).toBeVisible()

    await authedPage.getByTestId('wizard-first-name-input').fill('Ada')
    await authedPage.getByTestId('wizard-last-name-input').fill('Lovelace')
    await authedPage.getByTestId('wizard-email-input').fill('ada@test.com')
    await authedPage.getByTestId('wizard-next-button').click()

    await authedPage.getByTestId('wizard-company-input').fill('Analytical Engines')
    await authedPage.getByTestId('wizard-team-size-select').selectOption('11-50')
    await authedPage.getByTestId('wizard-next-button').click()

    await authedPage.getByTestId('wizard-street-input').fill('1 Ada Way')
    await authedPage.getByTestId('wizard-city-input').fill('London')
    await authedPage.getByTestId('wizard-postcode-input').fill('EC1A 1BB')
    await authedPage.getByTestId('wizard-next-button').click()

    await expect(authedPage.getByTestId('wizard-review')).toBeVisible()
    await expect(authedPage.getByTestId('wizard-review-email')).toHaveText(
      'ada@test.com',
    )

    await authedPage.getByTestId('wizard-submit-button').click()
    await expect(authedPage.getByTestId('wizard-complete')).toBeVisible()
  })

  test('playground tabs, accordion, dialog, and iframe behave', async ({
    authedPage,
  }) => {
    await authedPage.goto('/ui-playground')

    await authedPage.getByTestId('tab-activity').click()
    await expect(authedPage.getByTestId('tabpanel-activity')).toBeVisible()
    await expect(authedPage.getByTestId('tabpanel-overview')).toBeHidden()

    await authedPage.getByTestId('accordion-trigger-how').click()
    await expect(authedPage.getByTestId('accordion-panel-how')).toBeVisible()

    await authedPage.getByTestId('dialog-open-button').click()
    await expect(authedPage.getByTestId('demo-dialog')).toBeVisible()
    await authedPage.keyboard.press('Escape')
    await expect(authedPage.getByTestId('demo-dialog')).toBeHidden()

    const frame = authedPage.frameLocator('[data-testid="demo-iframe"]')
    await frame.getByTestId('iframe-button').click()
    await expect(frame.getByTestId('iframe-output')).toHaveText(
      'clicked inside iframe',
    )
  })

  test('popup link opens a new tab', async ({ authedPage }) => {
    await authedPage.goto('/ui-playground')
    const [popup] = await Promise.all([
      authedPage.waitForEvent('popup'),
      authedPage.getByTestId('popup-link').click(),
    ])
    await expect(popup.getByTestId('popup-heading')).toBeVisible()
    await popup.close()
  })

  test('report generation can complete and be cancelled', async ({
    authedPage,
  }) => {
    await authedPage.goto('/reports')

    await authedPage.getByTestId('reports-generate-button').click()
    await expect(authedPage.getByTestId('reports-cancel-button')).toBeVisible()
    await authedPage.getByTestId('reports-cancel-button').click()
    await expect(authedPage.getByTestId('reports-cancelled')).toBeVisible()

    await authedPage.getByTestId('reports-reset-button').click()
    await authedPage.getByTestId('reports-generate-button').click()
    await expect(authedPage.getByTestId('reports-success')).toBeVisible({
      timeout: 15_000,
    })
  })

  test('settings resets app data and can trigger the error boundary', async ({
    authedPage,
  }) => {
    await authedPage.goto('/settings')
    await authedPage.getByTestId('settings-reset-button').click()
    await expect(authedPage.getByTestId('settings-page')).toBeVisible()

    await authedPage.getByTestId('settings-trigger-error-button').click()
    await expect(authedPage.getByTestId('error-boundary')).toBeVisible()
  })

  test('admin route redirects standard users', async ({ authedPage }) => {
    // The guard redirects client-side, so wait on the destination rendering
    // rather than on goto() resolving.
    await authedPage.goto('/admin')
    await expect(authedPage.getByTestId('dashboard-page')).toBeVisible()
    await expect(authedPage).toHaveURL(/\/dashboard/)
  })

  test('admin route serves admins', async ({ adminPage }) => {
    await adminPage.goto('/admin')
    await expect(adminPage.getByTestId('admin-users-table')).toBeVisible()
  })

  test('no console errors during a full navigation pass', async ({
    authedPage,
  }) => {
    const errors: string[] = []
    authedPage.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text())
    })
    authedPage.on('pageerror', (err) => errors.push(err.message))

    // Wait on each screen rendering rather than networkidle: the MSW service
    // worker keeps a connection open, so Firefox never reports the page idle.
    const screens: Array<[string, string]> = [
      ['/dashboard', 'dashboard-page'],
      ['/products', 'products-page'],
      ['/forms', 'forms-page'],
      ['/forms/wizard', 'wizard-page'],
      ['/ui-playground', 'ui-playground-page'],
      ['/reports', 'reports-page'],
      ['/settings', 'settings-page'],
    ]

    for (const [path, testId] of screens) {
      await authedPage.goto(path)
      await expect(authedPage.getByTestId(testId)).toBeVisible({
        timeout: 15_000,
      })
    }

    expect(errors).toEqual([])
  })
})
