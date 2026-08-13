# Playwright Test Target App

A React application built to be **tested**, not shipped. It exists so an AI agent (or a person) can write and run Playwright suites against a realistic app with stable selectors, deterministic data, and deliberately reachable error states.

See [REQUIREMENTS.md](./REQUIREMENTS.md) for the full spec and [test-map.json](./test-map.json) for the machine-readable map of every route, testid, and behavior.

## Quick start

```bash
npm install
npm run dev            # http://localhost:5173

npx playwright install # first run only
npm run test:e2e       # chromium + firefox + webkit
```

## Test accounts

| Email | Password | Behavior |
|---|---|---|
| `admin@test.com` | `Admin123!` | Admin role — sees the Admin nav item and dashboard admin panel |
| `user@test.com` | `User123!` | Standard role — `/admin` redirects to `/dashboard` |
| `locked@test.com` | `Locked123!` | Always rejected with HTTP 403 ("This account is locked") |

## Resetting state

Append **`?reset=true`** to any URL to restore the seeded catalogue and clear the session *before* the app boots. This is the recommended way to make each test independent:

```ts
await page.goto('/sign-in?reset=true')
```

The Settings page has an equivalent **Reset app data** button, backed by `POST /api/app/reset`.

## Deliberate failure triggers

These exist so error handling is testable without breaking anything:

| Trigger | Result |
|---|---|
| Email containing `fail` (sign-up, forgot-password, forms) | HTTP 500 |
| Product name containing `fail` (create/update) | HTTP 500 |
| Duplicate SKU on product create | HTTP 409 with a field error |
| Flaky mode (Settings) | ~30% of authenticated reads fail with HTTP 503 |
| Latency slider (Settings) | Changes simulated API delay (default 400ms) |
| "Trigger render error" (Settings) | Throws during render, surfacing the error boundary |

## Routes

| Route | Access | What it exercises |
|---|---|---|
| `/sign-in`, `/sign-up`, `/forgot-password` | public | Validation, auth errors, password strength |
| `/dashboard` | protected | Async loading skeletons, role-based UI |
| `/products` | protected | Table with search, filter, sort, pagination, CRUD dialogs, bulk delete |
| `/forms` | protected | Every input type, cross-field validation, slow submit, file upload |
| `/forms/wizard` | protected | 4-step wizard with per-step validation and a review step |
| `/ui-playground` | protected | Tabs, accordion, tooltip, dialog, drag-and-drop, iframe, popup, infinite scroll |
| `/reports` | protected | Long-running operation with progress and cancel |
| `/settings` | protected | Theme, network simulation, data reset, error trigger |
| `/admin` | admin only | Role guard |
| anything else | public | 404 page |

## Selectors

Every interactive element carries a `data-testid` following `<page>-<element>-<role>`:

```ts
page.getByTestId('sign-in-email-input')
page.getByTestId('products-edit-p-01')
page.getByTestId('wizard-next-button')
```

Field validation errors use `<fieldId>-error` (e.g. `sign-in-email-error`). Markup is also semantic and labelled, so `getByRole` and `getByLabel` work throughout:

```ts
page.getByLabel('Email').fill('user@test.com')
page.getByRole('button', { name: 'Sign in' }).click()
```

## Writing tests

`e2e/fixtures.ts` provides pre-authenticated pages:

```ts
import { expect, test } from './fixtures'

test('products table loads', async ({ authedPage }) => {   // signed in as user
  await authedPage.goto('/products')
  await expect(authedPage.getByTestId('products-table')).toBeVisible()
})

test('admin panel is visible', async ({ adminPage }) => {   // signed in as admin
  await expect(adminPage.getByTestId('dashboard-admin-panel')).toBeVisible()
})
```

**Use one account per test.** `authedPage` and `adminPage` share a browser context, so requesting both in the same test overwrites the first session.

The existing specs (`auth`, `dashboard`, `smoke`) are a baseline to keep the app honest — they are not meant to be exhaustive. Detailed suites are the agent's job.

## Architecture

Vite + React 19 + TypeScript, TanStack Router (file-based routes), TanStack Query, Tailwind v4.

```
src/
  routes/       TanStack file routes — thin wiring only (guards, search params)
  features/     One folder per product area; the actual screens live here
  components/   Shared UI (ui/ primitives, layout/ chrome)
  hooks/api/    TanStack Query hooks wrapping the service modules
  lib/api/      Axios client + service modules (plain async functions)
  mocks/        The mock backend: handlers, seed data, in-memory db
  types/ enums/ Shared types and constants
```

Imports point inward: `routes → features → components`, and `features` never imports from `routes`.

### The mock backend

There is no server. MSW handlers run **in-page via fetch/XHR interceptors**, not a service worker.

That distinction matters: MSW's service worker calls `location.reload()` whenever a registration exists but `navigator.serviceWorker.controller` is null. Firefox reports a null controller on every fresh document load, which turned each full-page navigation into an infinite reload loop. Intercepting in-page removes the worker entirely — requests are mocked from the first tick, and there is no registration to go stale.

Product data persists to `localStorage` so mutations survive a reload, and `resetDb()` restores the exact seed.

## Scripts

| Command | Purpose |
|---|---|
| `npm run dev` | Dev server on port 5173 |
| `npm run build` | Typecheck and production build |
| `npm run typecheck` | Types only |
| `npm run test:e2e` | Playwright across all three browsers |
| `npm run test:e2e:chromium` | Chromium only (fastest feedback) |
| `npm run test:e2e:ui` | Playwright UI mode |
| `npm run test:e2e:report` | Open the last HTML report |
