# Frontend Feature Specification — Admin

**Purpose:** Restrict a page to the admin role, and prove that standard users are turned away both from the link and from the URL.

**Owner / driver:** Test-target maintainers

**Status:** Approved

**Related:** [Test plan TC-015, TC-004b](../test-plan.md) · [Authentication — route guards](./authentication.md) · [Dashboard](./dashboard.md) · [`src/features/admin/index.tsx`](../../src/features/admin/index.tsx)

**Version / last updated:** 1.0, 2026-08-13

---

## 1. Requirement

### 1.1 Summary
- The app's only role-based access control. The content is incidental; the guard is the feature.
- Two independent things must hold: the nav link is absent for standard users, and the URL is unreachable by typing it.

### 1.2 Scope
- **In scope**
  - Route-level role check redirecting non-admins to `/dashboard`
  - Conditional nav item, rendered only for admins
  - A table of seeded accounts with role and locked status
- **Out of scope**
  - Editing users, roles, or permissions — the table is read-only
  - Finer-grained permissions; there are exactly two roles
  - Audit logging
- **Assumptions**
  - Role comes from the session established at sign-in and is not re-verified per request

---

## 2. Backend API references (integration only)

None. The account list renders from a password-free projection of the seed data, so no request is made and no credentials reach the UI bundle.

---

## 3. Current frontend behavior

### 3.1 Implemented now
- `src/routes/_authenticated/admin/index.tsx` — role check in `beforeLoad`, layered on the inherited sign-in guard
- `src/features/admin/index.tsx` — current admin, plus the accounts table
- `src/mocks/seed.ts` — `SEED_ACCOUNT_SUMMARIES`, the password-free projection
- Nav item filtered by `isAdmin` in `authenticated-layout.tsx`

### 3.2 Gaps / TODO in current code
- The guard trusts the client-held session; there is no server-side authorization because there is no server
- Locked status is displayed but not editable

---

## 4. Screen flow and interactions

### 4.1 Load flow
- **Step 1:** `_authenticated.beforeLoad` requires any signed-in user
- **Step 2:** This route's own `beforeLoad` requires `role === 'admin'`, else redirects to `/dashboard`
- **Step 3:** Screen mounts and renders the current admin plus the accounts table
- **Loading state:** None — data is a static import
- **Empty state:** Not applicable; three accounts always exist

### 4.2 Submit flow
No mutations. The page is read-only.

- **Failure UX:** A non-admin never reaches the page; the redirect is the entire failure path

---

## 5. Frontend data model mapping

| UI field | Source | Type | Notes |
|---|---|---|---|
| Current admin | `useAuth().user` | `User` | Name and email of the signed-in admin |
| Name / Email / Role | `SEED_ACCOUNT_SUMMARIES` | `User[]` | Password-free projection |
| Status | `account.locked` | boolean | Rendered as `Locked` or `Active` |

- **State ownership:** Session from `AuthContext`; the table from a static import
- **Transformations:** Passwords stripped at the seed boundary, never in the component

---

## 6. Testing and quality

- **Unit tests:** `SEED_ACCOUNT_SUMMARIES` contains no `password` key
- **Integration tests:** [`e2e/smoke.spec.ts`](../../e2e/smoke.spec.ts) and [`e2e/auth.spec.ts`](../../e2e/auth.spec.ts) — redirect for standard users, access for admins, nav visibility for both
- **Manual/agent plan:** [TC-015 (both parts), TC-004b](../test-plan.md)
- **Not required in this feature:** Server-side authorization testing — there is no server

---

## 7. Specs to apply

- `React-Specs/quality-ops/testing-strategy-spec.md`
- `React-Specs/ui-ux/error-handling-user-feedback-spec.md`

---

## 8. Delivery checklist

- [x] Feature spec linked to work item/PR
- [x] Role guard implemented according to this spec
- [x] Nav visibility verified for both roles
- [x] Integration tests cover this scope
- [x] `npm run lint`, typecheck, and build pass
- [x] No secrets committed — credentials never reach the UI bundle

---

## Appendix — Test surface

**Testids:** `admin-page`, `admin-current-user`, `admin-users-table`, `admin-user-row-u-1..u-3`, `admin-user-status-<id>`

**Two independent assertions for a standard user**

1. `nav-link-admin` is absent from the sidebar
2. Navigating to `/admin` lands on `/dashboard`

**Timing:** The redirect is client-side, so `goto()` resolves before it completes. Wait for the destination to render:

```ts
await page.goto('/admin')
await expect(page.getByTestId('dashboard-page')).toBeVisible()
await expect(page).toHaveURL(/\/dashboard/)
```

**Session isolation:** Test the allowed and denied cases in **separate tests**. `authedPage` and `adminPage` share a browser context, so requesting both overwrites the first session.
