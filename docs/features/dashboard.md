# Frontend Feature Specification — Dashboard

**Purpose:** Give a signed-in user an at-a-glance summary of the catalogue, and show admins one section standard users cannot see.

**Owner / driver:** Test-target maintainers

**Status:** Approved

**Related:** [Test plan TC-006](../test-plan.md) · [Authentication](./authentication.md) · [Products](./products.md) · [Admin](./admin.md) · [`src/features/dashboard/index.tsx`](../../src/features/dashboard/index.tsx)

**Version / last updated:** 1.0, 2026-08-13

---

## 1. Requirement

### 1.1 Summary
- The landing page after sign-in. Small by design: its job is to exercise async loading and role-conditional rendering.
- Doubles as the confirmation that authentication produced the *right* account, since it renders the signed-in email and role.

### 1.2 Scope
- **In scope**
  - Four statistic cards derived from live product data
  - A visible skeleton state while stats load
  - Manual refresh
  - Admin-only panel, rendered by role
  - Error state when the stats request fails
- **Out of scope**
  - Charts, trends, or historical comparison
  - Configurable or reorderable widgets
- **Assumptions**
  - Stats derive from the same store [Products](./products.md) mutates, so creating or deleting changes these numbers

---

## 2. Backend API references (integration only)

| Purpose | Method | Endpoint | Request | Response | Notes |
|---|---|---|---|---|---|
| Summary stats | `GET` | `/api/dashboard/stats` | — | `{ totalProducts, activeProducts, lowStock, totalValue }` | Auth required; 503 in flaky mode |

---

## 3. Current frontend behavior

### 3.1 Implemented now
- `src/features/dashboard/index.tsx` — cards, skeletons, refresh, admin panel
- `src/hooks/api/dashboard.ts` — `useDashboardStatsQuery`, invalidated by product mutations

### 3.2 Gaps / TODO in current code
- Cards are static; none link through to a filtered products view
- "Low stock" uses a hard-coded threshold of 10

---

## 4. Screen flow and interactions

### 4.1 Load flow
- **Step 1:** Guard resolves; screen mounts from `@/features/dashboard`
- **Step 2:** `useDashboardStatsQuery` fires against the ~400ms mock latency
- **Step 3:** Values render into four cards; currency formatted via `Intl.NumberFormat`
- **Loading state:** Four skeleton cards under `dashboard-stats-loading`
- **Empty state:** Not applicable — stats always return numbers, possibly zero

### 4.2 Submit flow
No mutations. The only action is **Refresh**, which refetches and shows a spinner on the button.

- **Failure UX:** `dashboard-error` renders the API message
- **Retry/idempotency:** Retries disabled app-wide, so failures surface immediately

---

## 5. Frontend data model mapping

| UI field | Form path | API field | Type | Required | Rules |
|---|---|---|---|---|---|
| Total products | — | `totalProducts` | number | Y | Read-only |
| Active products | — | `activeProducts` | number | Y | Status `active` only |
| Low stock | — | `lowStock` | number | Y | `0 < stock < 10`; excludes out-of-stock |
| Inventory value | — | `totalValue` | number | Y | Σ price × stock, currency formatted |

- **State ownership:** Entirely TanStack Query cache; no local form state
- **Transformations:** `formatCurrency()` on `totalValue` only
- **Error mapping:** `ApiError.message` → `dashboard-error` banner

---

## 6. Testing and quality

- **Unit tests:** `formatCurrency()` output
- **Integration tests:** [`e2e/dashboard.spec.ts`](../../e2e/dashboard.spec.ts) — skeleton→content, seeded totals, refresh, expiry, 404
- **Manual/agent plan:** [TC-006](../test-plan.md)
- **Not required in this feature:** Visual regression on card layout

---

## 7. Specs to apply

- `React-Specs/data/data-fetching-api-client-spec.md`
- `React-Specs/ui-ux/error-handling-user-feedback-spec.md`
- `React-Specs/quality-ops/testing-strategy-spec.md`

---

## 8. Delivery checklist

- [x] Feature spec linked to work item/PR
- [x] UI behavior implemented according to this spec
- [x] API integration and error handling verified
- [x] Integration tests cover this scope
- [x] `npm run lint`, typecheck, and build pass
- [x] No secrets committed

---

## Appendix — Test surface

**Seeded values:** Total 20 · Active 15 · Low stock 6 · Inventory value = Σ price × stock

**Testids:** `dashboard-page`, `dashboard-stats`, `dashboard-stats-loading`, `dashboard-refresh-button`, `dashboard-error`, `dashboard-user-email`, `dashboard-user-role`, `dashboard-admin-panel`, plus `dashboard-stat-<key>` and `dashboard-stat-<key>-value` for `totalProducts`, `activeProducts`, `lowStock`, `totalValue`

**Catching the skeleton:** 400ms is enough to render but too short to assert reliably. Hold the response with `page.route()`, or raise latency in [Settings](./settings.md).
