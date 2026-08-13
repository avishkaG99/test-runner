# Dashboard

The landing page after sign-in. Small on purpose — its job is to exercise async loading and role-conditional rendering, not to be a rich screen.

**Route:** `/dashboard`
**Source:** [`src/features/dashboard/index.tsx`](../../src/features/dashboard/index.tsx)
**Related:** [Authentication](./authentication.md) · [Admin](./admin.md) · [Mock API — seed data](../mock-api.md#seed-data)

---

## Stat cards

Four cards derived from the product catalogue:

| Card | Testid | Seed value |
|---|---|---|
| Total products | `dashboard-stat-totalProducts-value` | 20 |
| Active products | `dashboard-stat-activeProducts-value` | 15 |
| Low stock | `dashboard-stat-lowStock-value` | 6 |
| Inventory value | `dashboard-stat-totalValue-value` | currency-formatted sum |

"Low stock" counts products with stock greater than 0 but under 10 — deliberately *not* including out-of-stock items, so the number is not trivially derivable.

These values change when [products](./products.md) are created or deleted, because both mutations invalidate the dashboard query. That makes the dashboard a useful assertion target after a CRUD flow.

## The loading state

Stats load asynchronously behind the mock API's simulated latency (~400ms by default). While in flight, four skeleton cards render under `dashboard-stats-loading`; once resolved, they are replaced by `dashboard-stats`.

This is deliberate. A test target where data appears instantly teaches nothing about waiting, so the delay exists to force proper handling.

> **Catching the skeleton reliably:** asserting on `dashboard-stats-loading` right after clicking sign-in races the ~400ms response and is flaky in slower browsers. Hold the response open with `page.route()` instead:
>
> ```ts
> let release = () => {}
> const held = new Promise<void>((r) => { release = r })
> await page.route('**/api/dashboard/stats', async (route) => {
>   await held
>   await route.continue()
> })
> // ... sign in, assert the skeleton is visible ...
> release()
> ```
>
> This is how [`e2e/dashboard.spec.ts`](../../e2e/dashboard.spec.ts) does it.

## Role-conditional UI

An extra panel (`dashboard-admin-panel`) renders only for the admin role, alongside the Admin nav item in the sidebar. For a standard user both are absent from the DOM entirely — not hidden with CSS — so `toBeHidden()` and `toHaveCount(0)` both work.

The signed-in user's email and role are rendered in the header area as `dashboard-user-email` and `dashboard-user-role`, which is the cheapest way for a test to confirm *which* account a fixture actually produced.

## Refresh

`dashboard-refresh-button` refetches the stats query. While fetching it shows a spinner via the shared Button's `loading` prop, which sets `aria-busy`.

## Testids

`dashboard-page`, `dashboard-stats`, `dashboard-stats-loading`, `dashboard-refresh-button`, `dashboard-error`, `dashboard-user-email`, `dashboard-user-role`, `dashboard-admin-panel`, plus `dashboard-stat-<key>` and `dashboard-stat-<key>-value` for each of the four cards.

## Error state

If the stats request fails — reachable by turning on flaky mode in [Settings](./settings.md) — `dashboard-error` renders with the message from the API. Query retries are disabled app-wide precisely so these failures surface instead of being silently retried away.
