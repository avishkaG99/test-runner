# Mock API

Every endpoint is served in the browser by MSW handlers running on fetch/XHR interceptors. No server, no network, fully offline.

**Source:** [`src/mocks/`](../src/mocks/)
**Related:** [Architecture — the mock backend](./architecture.md#the-mock-backend) · [Settings](./features/settings.md) · [Testing guide](./testing-guide.md)

---

## Endpoints

Base path `/api`. Endpoints marked **auth** require an `Authorization: Bearer …` header; without it they return 401.

| Method | Path | Auth | Notes |
|---|---|---|---|
| POST | `/api/auth/login` | — | Returns token, user, expiry |
| POST | `/api/auth/signup` | — | 409 on existing email |
| POST | `/api/auth/forgot-password` | — | Always succeeds unless triggered to fail |
| GET | `/api/dashboard/stats` | auth | Derived from the live product data |
| GET | `/api/products` | auth | Query: `search`, `category`, `sortBy`, `sortDir`, `page`, `pageSize` |
| GET | `/api/products/:id` | auth | 404 if missing |
| POST | `/api/products` | auth | 409 on duplicate SKU |
| PUT | `/api/products/:id` | auth | 404 if missing |
| DELETE | `/api/products/:id` | auth | 204 on success |
| POST | `/api/products/bulk-delete` | auth | Body `{ ids: string[] }`, returns `{ deleted }` |
| GET | `/api/profile` | auth | The caller's profile, resolved from the bearer token |
| PUT | `/api/profile` | auth | 422 field errors; 500 if display name contains `fail` |
| POST | `/api/profile/change-password` | auth | 422 on validation or a wrong current password; never persisted |
| GET | `/api/categories` | — | The five category values |
| POST | `/api/forms/submit` | — | Echoes the payload back |
| POST | `/api/app/reset` | — | Restores seed data |

## Accounts

| Email | Password | Role | Outcome |
|---|---|---|---|
| `admin@test.com` | `Admin123!` | admin | Success |
| `user@test.com` | `User123!` | user | Success |
| `locked@test.com` | `Locked123!` | user | 403, "This account is locked." |

Sessions last one hour. Details in [Authentication](./features/authentication.md).

## Seed data

20 products, fixed ids `p-01` through `p-20`, fixed timestamps so ordering and rendered dates never vary.

| Breakdown | Count |
|---|---|
| Total | 20 |
| Active | 15 |
| Draft | 3 |
| Archived | 2 |
| Low stock (0 < stock < 10) | 6 |

Categories are evenly split — 4 each across electronics, apparel, home, sports, and books.

These numbers are asserted directly in tests, so if you change the seed, update [test-map.json](../test-map.json) and [`e2e/dashboard.spec.ts`](../e2e/dashboard.spec.ts) with it.

## Failure triggers

Deliberate, documented ways to reach an error path:

| Trigger | Result |
|---|---|
| Email containing `fail` — sign-up, forgot-password, or forms submit | 500, "Unexpected server error. Please try again later." |
| Product name containing `fail` — create or update | 500 |
| Duplicate SKU on product create | 409 with `fieldErrors.sku` |
| Signing in as `locked@test.com` | 403 |
| Wrong password | 401 |
| Missing or malformed auth header | 401 |
| Flaky mode enabled | ~30% of authenticated reads fail with 503 |

The `fail` substring is checked case-insensitively and anywhere in the value, so `myfail@test.com` and `Failing Widget` both trigger it.

## Error shape

Every failure normalizes to the same object, so feature code renders `error.message` without narrowing on Axios internals:

```ts
{
  message: string            // always present, user-readable
  code?: string              // e.g. INVALID_CREDENTIALS, ACCOUNT_LOCKED, FORCED_ERROR
  fieldErrors?: Record<string, string>   // when attributable to specific inputs
}
```

Field errors render on the input; a bare `message` renders in a banner. Both are assertable.

## Latency and flaky mode

Default latency is **400ms** on every response, adjustable in [Settings](./features/settings.md) or by writing `tta.latency` to `localStorage`.

The delay is deliberate: instant responses would make loading states unobservable and teach nothing about waiting. Raise it to make skeletons trivially assertable; drop it to 0 to speed up suites that do not care.

Flaky mode is **off by default** and should stay off unless a test is specifically exercising retry or error-recovery UI.

## Resetting state

Product data persists to `localStorage`, so mutations survive reloads — and leak between tests if you let them.

**Preferred:** append `?reset=true` to any URL. It runs before the app boots, restoring seed data *and* clearing the session, so there is no window where stale state is visible.

```ts
await page.goto('/sign-in?reset=true')
```

**Alternative:** `POST /api/app/reset`, or the Reset button in Settings. Both restore products but leave the session intact.
