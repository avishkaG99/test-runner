import { ACCOUNTS, expect, test } from './fixtures'

test.describe('Profile', () => {
  test('loads the signed-in user profile', async ({ authedPage: page }) => {
    await page.goto('/profile')

    await expect(page.getByTestId('profile-page')).toBeVisible()
    await expect(page.getByTestId('profile-email')).toHaveText(
      ACCOUNTS.user.email,
    )
    await expect(page.getByTestId('profile-role')).toContainText('user')
    // Seeded sparse on purpose, so the empty-field path is reachable unedited.
    await expect(page.getByTestId('profile-job-title-input')).toHaveValue('')
    await expect(page.getByTestId('profile-dirty-state')).toHaveText(
      'No changes',
    )
    await expect(page.getByTestId('profile-save-button')).toBeDisabled()
  })

  test('resolves the profile from the bearer token, not a fixed user', async ({
    adminPage: page,
  }) => {
    await page.goto('/profile')

    await expect(page.getByTestId('profile-email')).toHaveText(
      ACCOUNTS.admin.email,
    )
    await expect(page.getByTestId('profile-role')).toContainText('admin')
    await expect(page.getByTestId('profile-job-title-input')).toHaveValue(
      'Platform Administrator',
    )
  })

  test('tracks dirty state and discards edits', async ({
    authedPage: page,
  }) => {
    await page.goto('/profile')
    await expect(page.getByTestId('profile-page')).toBeVisible()

    await page.getByTestId('profile-display-name-input').fill('Samantha')
    await expect(page.getByTestId('profile-dirty-state')).toHaveText(
      'Unsaved changes',
    )
    await expect(page.getByTestId('profile-save-button')).toBeEnabled()

    await page.getByTestId('profile-reset-button').click()
    await expect(page.getByTestId('profile-display-name-input')).toHaveValue(
      'Sam',
    )
    await expect(page.getByTestId('profile-dirty-state')).toHaveText(
      'No changes',
    )
  })

  test('saves changes and updates the header label', async ({
    authedPage: page,
  }) => {
    await page.goto('/profile')
    await expect(page.getByTestId('profile-page')).toBeVisible()

    await page.getByTestId('profile-display-name-input').fill('Sam Standard II')
    await page.getByTestId('profile-job-title-input').fill('QA Lead')
    await page.getByTestId('profile-timezone-select').selectOption('Asia/Tokyo')
    await page.getByTestId('profile-marketing-checkbox').check()
    await page.getByTestId('profile-save-button').click()

    await expect(page.getByTestId('profile-saved')).toBeVisible()
    await expect(page.getByTestId('profile-dirty-state')).toHaveText(
      'No changes',
    )
    // The session user follows the display name, so the header must agree.
    await expect(page.getByTestId('app-current-user')).toHaveText(
      'Sam Standard II',
    )

    await page.reload()
    await expect(page.getByTestId('profile-job-title-input')).toHaveValue(
      'QA Lead',
    )
    await expect(page.getByTestId('profile-timezone-select')).toHaveValue(
      'Asia/Tokyo',
    )
    await expect(page.getByTestId('profile-marketing-checkbox')).toBeChecked()
  })

  test('rejects a display name that is too short', async ({
    authedPage: page,
  }) => {
    await page.goto('/profile')
    await expect(page.getByTestId('profile-page')).toBeVisible()

    await page.getByTestId('profile-display-name-input').fill('S')
    await page.getByTestId('profile-save-button').click()

    await expect(
      page.getByTestId('profile-display-name-error'),
    ).toContainText('at least 2 characters')
    await expect(page.getByTestId('profile-saved')).toBeHidden()
  })

  test('counts bio characters and flags the limit', async ({
    authedPage: page,
  }) => {
    await page.goto('/profile')
    await expect(page.getByTestId('profile-page')).toBeVisible()

    await page.getByTestId('profile-bio-input').fill('a'.repeat(281))
    await expect(page.getByTestId('profile-bio-counter')).toHaveText(
      '281 / 280',
    )

    await page.getByTestId('profile-save-button').click()
    await expect(page.getByTestId('profile-bio-error')).toContainText(
      '280 characters or fewer',
    )
  })

  test('surfaces a forced server error', async ({ authedPage: page }) => {
    await page.goto('/profile')
    await expect(page.getByTestId('profile-page')).toBeVisible()

    await page.getByTestId('profile-display-name-input').fill('fail user')
    await page.getByTestId('profile-save-button').click()

    await expect(page.getByTestId('profile-form-error')).toContainText(
      'Unexpected server error',
    )
  })
})

test.describe('Change password', () => {
  test('rejects a mismatched confirmation', async ({ authedPage: page }) => {
    await page.goto('/profile')
    await expect(page.getByTestId('password-form')).toBeVisible()

    await page.getByTestId('password-current-input').fill(ACCOUNTS.user.password)
    await page.getByTestId('password-new-input').fill('NewPassword1!')
    await page.getByTestId('password-confirm-input').fill('Different1!')
    await page.getByTestId('password-submit-button').click()

    await expect(page.getByTestId('password-confirm-error')).toContainText(
      'do not match',
    )
  })

  test('rejects a wrong current password server-side', async ({
    authedPage: page,
  }) => {
    await page.goto('/profile')
    await expect(page.getByTestId('password-form')).toBeVisible()

    await page.getByTestId('password-current-input').fill('WrongPassword1!')
    await page.getByTestId('password-new-input').fill('NewPassword1!')
    await page.getByTestId('password-confirm-input').fill('NewPassword1!')
    await page.getByTestId('password-submit-button').click()

    await expect(page.getByTestId('password-current-error')).toContainText(
      'incorrect',
    )
  })

  test('rejects reusing the current password', async ({
    authedPage: page,
  }) => {
    await page.goto('/profile')
    await expect(page.getByTestId('password-form')).toBeVisible()

    await page.getByTestId('password-current-input').fill(ACCOUNTS.user.password)
    await page.getByTestId('password-new-input').fill(ACCOUNTS.user.password)
    await page.getByTestId('password-confirm-input').fill(ACCOUNTS.user.password)
    await page.getByTestId('password-submit-button').click()

    await expect(page.getByTestId('password-new-error')).toContainText(
      'different from the current one',
    )
  })

  test('accepts a valid change and clears the form', async ({
    authedPage: page,
  }) => {
    await page.goto('/profile')
    await expect(page.getByTestId('password-form')).toBeVisible()

    await page.getByTestId('password-current-input').fill(ACCOUNTS.user.password)
    await page.getByTestId('password-new-input').fill('NewPassword1!')
    await page.getByTestId('password-confirm-input').fill('NewPassword1!')
    await page.getByTestId('password-submit-button').click()

    await expect(page.getByTestId('password-changed')).toBeVisible()
    await expect(page.getByTestId('password-current-input')).toHaveValue('')

    // The change is deliberately not persisted, so the seeded password still
    // works — proven by signing in again with it.
    await page.goto('/sign-in?reset=true')
    await page.getByTestId('sign-in-email-input').fill(ACCOUNTS.user.email)
    await page.getByTestId('sign-in-password-input').fill(ACCOUNTS.user.password)
    await page.getByTestId('sign-in-submit-button').click()
    await expect(page.getByTestId('dashboard-page')).toBeVisible()
  })
})
