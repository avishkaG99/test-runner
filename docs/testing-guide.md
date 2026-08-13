# Testing guide

How to write Playwright tests against this app, and the specific things that will trip you up.

**Related:** [Docs index](./README.md) · [Mock API](./mock-api.md) · [Architecture](./architecture.md)

---

## Running

```bash
npm run test:e2e            # all three browsers
npm run test:e2e:chromium   # one browser, ~3x faster
npm run test:e2e:ui         # interactive UI mode
npm run test:e2e:report     # open the last HTML report
```

Playwright starts the dev server itself — you do not need `npm run dev` running first.

## Fixtures

[`e2e/fixtures.ts`](../e2e/fixtures.ts) provides pre-authenticated pages so tests skip the login flow:

```ts
import { expect, test } from './fixtures'

test('products load', async ({ authedPage }) => {     // standard user
  await authedPage.goto('/products')
  await expect(authedPage.getByTestId('products-table')).toBeVisible()
})

test('admin panel shows', async ({ adminPage }) => {  // admin
  await expect(adminPage.getByTestId('dashboard-admin-panel')).toBeVisible()
})
```

Both sign in through the real UI with `?reset=true`, so each test starts from seed data with a clean session.

`ACCOUNTS` and a `signIn(page, account)` helper are exported for cases needing manual control — for instance testing the locked account, which never reaches a dashboard.

## Selectors

Every interactive element has a `data-testid` following `<page>-<element>-<role>`:

```ts
page.getByTestId('sign-in-email-input')
page.getByTestId('products-edit-p-01')
page.getByTestId('wizard-next-button')
```

Field validation errors follow `<fieldId>-error`, e.g. `sign-in-email-error`.

Markup is also semantic and labelled, so role- and label-based locators work throughout — often the better choice, since they assert accessibility at the same time:

```ts
page.getByLabel('Email').fill('user@test.com')
page.getByRole('button', { name: 'Sign in' }).click()
page.getByRole('combobox').press('ArrowDown')
```

The complete testid inventory is in [test-map.json](../test-map.json).

## Test isolation

Product mutations persist to `localStorage`. Always start from a known state:

```ts
await page.goto('/products?reset=true')
```

The fixtures already do this. See [Mock API — resetting state](./mock-api.md#resetting-state).

## Waiting

Every async transition has a DOM-observable signal, so hard waits are never needed:

| Transition | Signal |
|---|---|
| Data loading | Skeleton appears, then the content container |
| Submitting | Button disabled, `aria-busy`, spinner |
| Success | Toast, plus a durable state change |
| Navigation | URL change plus the destination's `-page` testid |

Prefer waiting on the durable signal over the toast — toasts auto-dismiss and will race you.

## Pitfalls

These are real failures encountered while building the app, not hypotheticals.

### One account per test

`authedPage` and `adminPage` share a browser context. Requesting both in a single test means the second sign-in **overwrites the first session**, and assertions silently run against the wrong user.

```ts
// Wrong — adminPage clobbers authedPage's session
test('both roles', async ({ authedPage, adminPage }) => { … })

// Right — separate tests
test('standard user is redirected', async ({ authedPage }) => { … })
test('admin gets through', async ({ adminPage }) => { … })
```

### Client-side redirects resolve after goto

`page.goto()` resolves before a client-side guard redirect finishes. Assert on the destination *rendering*, not just the URL:

```ts
await page.goto('/admin')
await expect(page.getByTestId('dashboard-page')).toBeVisible()
await expect(page).toHaveURL(/\/dashboard/)
```

In WebKit, a cold `goto` straight to a guarded URL can also lose the `?redirect=` param because the redirect interrupts the navigation. Load a public page first, then navigate.

### `isVisible()` does not wait

`locator.isVisible()` snapshots immediately and returns `false` for anything not yet rendered. It is not a substitute for an assertion.

```ts
const ok = await page.getByTestId('products-page').isVisible()  // often false
await expect(page.getByTestId('products-page')).toBeVisible()   // waits properly
```

### Avoid `networkidle`

The app holds connections open, so `waitForLoadState('networkidle')` can hang — particularly in Firefox. Wait on a DOM signal instead:

```ts
await page.goto('/products')
await expect(page.getByTestId('products-page')).toBeVisible()
```

### Catching fast loading states

The default 400ms latency is enough to make a skeleton render but too short to assert on reliably. Hold the response open rather than racing it:

```ts
let release = () => {}
const held = new Promise<void>((r) => { release = r })
await page.route('**/api/dashboard/stats', async (route) => {
  await held
  await route.continue()
})
// sign in, assert the skeleton, then:
release()
```

Alternatively raise the latency in [Settings](./features/settings.md).

### Long operations need explicit timeouts

[Report generation](./features/reports.md) takes ~4 seconds, which exceeds the default 5-second expect timeout once other waits stack up:

```ts
await expect(page.getByTestId('reports-success')).toBeVisible({ timeout: 15_000 })
```

## Existing specs

[`e2e/`](../e2e/) holds three baseline suites — `auth`, `dashboard`, and `smoke` — totalling 81 tests across the three browsers. They exist to catch regressions in the app itself, not to be exhaustive coverage.

They are a reasonable style reference for new tests: fixtures over manual login, testids or roles over CSS, auto-waiting assertions over sleeps.
