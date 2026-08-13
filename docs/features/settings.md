# Frontend Feature Specification — Settings

**Purpose:** Hold user preferences and the controls that make the rest of the app testable — network simulation, data reset, and a deliberate error trigger.

**Owner / driver:** Test-target maintainers

**Status:** Approved

**Related:** [Test plan TC-014d, TC-014e](../test-plan.md) · [Mock API](../mock-api.md) · [Dashboard — error state](./dashboard.md) · [`src/features/settings/index.tsx`](../../src/features/settings/index.tsx)

**Version / last updated:** 1.0, 2026-08-13

---

## 1. Requirement

### 1.1 Summary
- Two jobs in one screen: ordinary preferences (theme), and the control panel for the test harness itself.
- The harness controls are what let other features be tested deliberately rather than by luck — raising latency makes loading states observable, and reset guarantees a clean starting point.

### 1.2 Scope
- **In scope**
  - Light/dark theme persisted across reloads
  - Adjustable mock API latency
  - Flaky mode injecting HTTP 503 into reads
  - Reset restoring the seeded catalogue
  - A button that throws during render to exercise the error boundary
- **Out of scope**
  - Per-user server-side preferences — everything is `localStorage`
  - Notification, locale, or accessibility preferences
- **Assumptions**
  - Flaky mode stays **off** by default; it exists for deliberate use, not ambient noise

---

## 2. Backend API references (integration only)

| Purpose | Method | Endpoint | Request | Response | Notes |
|---|---|---|---|---|---|
| Reset seed data | `POST` | `/api/app/reset` | — | `{ ok }` | Restores products; leaves the session intact |

Latency and flaky mode are read from `localStorage` by the mock handlers themselves; they are not API calls.

---

## 3. Current frontend behavior

### 3.1 Implemented now
- `src/features/settings/index.tsx` — theme, latency, flaky mode, reset, error trigger
- `src/hooks/use-theme.ts` — theme state, `localStorage`, `dark` class on `<html>`
- `src/mocks/db.ts` — latency and flaky-mode getters/setters

### 3.2 Gaps / TODO in current code
- Latency applies from the *next* request; in-flight requests keep the old value
- Flaky mode's 30% failure rate is fixed and not adjustable
- Reset does not clear the session — use `?reset=true` for that

---

## 4. Screen flow and interactions

### 4.1 Load flow
- **Step 1:** Guard resolves; screen mounts from `@/features/settings`
- **Step 2:** No queries; current values read from `localStorage`
- **Step 3:** Theme applied before React renders (in `main.tsx`), so a dark reload never flashes white
- **Loading state:** Only on the Reset button while its mutation runs
- **Empty state:** Not applicable

### 4.2 Submit flow
- **Action:** `useResetAppDataMutation` → `POST /api/app/reset`, then invalidate every query
- **Client validation:** Latency must be a finite number ≥ 0; invalid input is ignored rather than stored
- **Success UX:** Toast confirming the restore; other screens show seeded data again
- **Failure UX:** Error toast on failure
- **Retry/idempotency:** Reset is fully idempotent — running it twice is the same as once

---

## 5. Frontend data model mapping

| UI field | Form path | Storage key | Type | Required | Rules |
|---|---|---|---|---|---|
| Theme | `theme` | `tta.theme` | enum | Y | `light` \| `dark`; toggles the `dark` class |
| Latency | `latency` | `tta.latency` | number | N | ≥ 0 ms; default 400 |
| Flaky mode | `flaky` | `tta.flakyMode` | boolean | N | Default `false` |

- **State ownership:** Local state mirrored to `localStorage`; the mock layer reads the same keys
- **Transformations:** Latency parsed from string; written only when finite and non-negative
- **Error mapping:** Reset failure → error toast

---

## 6. Testing and quality

- **Unit tests:** Theme persistence; latency parsing rejecting invalid input
- **Integration tests:** [`e2e/smoke.spec.ts`](../../e2e/smoke.spec.ts) — reset, and the error-boundary trigger
- **Manual/agent plan:** [TC-014d, TC-014e](../test-plan.md)
- **Not required in this feature:** Cross-device preference sync

---

## 7. Specs to apply

- `React-Specs/ui-ux/error-handling-user-feedback-spec.md`
- `React-Specs/data/data-fetching-api-client-spec.md`
- `React-Specs/quality-ops/testing-strategy-spec.md`

---

## 8. Delivery checklist

- [x] Feature spec linked to work item/PR
- [x] UI behavior implemented according to this spec
- [x] Persistence verified across reloads
- [x] Integration tests cover this scope
- [x] `npm run lint`, typecheck, and build pass
- [x] No secrets committed

---

## Appendix — Test surface

**Testids:** `settings-page`, `settings-theme-group`, `settings-theme-light`, `settings-theme-dark`, `settings-latency-input`, `settings-flaky-checkbox`, `settings-reset-button`, `settings-trigger-error-button`

**Error boundary:** `error-boundary`, `error-boundary-message`, `error-boundary-reload`. The trigger throws during **render**, so React's boundary genuinely catches it — a handler-thrown error would escape to the console instead.

**Storage keys:** `tta.theme`, `tta.latency`, `tta.flakyMode`, `tta.products`, plus `tta.token` / `tta.user` from [Authentication](./authentication.md).

**Reset vs `?reset=true`:** The button restores products only. The URL parameter also clears the session and runs before the app boots, which is why it is the preferred isolation mechanism for tests.
