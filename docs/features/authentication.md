# Frontend Feature Specification — Authentication

**Purpose:** Let a user sign in, stay signed in across reloads, and be kept out of pages they should not reach.

**Owner / driver:** Test-target maintainers

**Status:** Approved

**Related:** [Test plan TC-001–TC-005](../test-plan.md) · [Architecture — route guards](../architecture.md#route-guards) · [Mock API](../mock-api.md) · [Admin](./admin.md) · [`src/features/auth/`](../../src/features/auth/)

**Version / last updated:** 1.0, 2026-08-13

---

## 1. Requirement

### 1.1 Summary
- Provides sign-in, sign-up, and password reset, plus the route guard every protected page depends on.
- Used by anyone driving the app — and by the AI test agent, which must authenticate before reaching any other feature.
- Deliberately exposes three distinct auth outcomes (success, wrong credentials, locked account) so error handling is testable.

### 1.2 Scope
- **In scope**
  - Sign-in form with per-field and form-level validation
  - Sign-up with password confirmation and a strength meter
  - Forgot-password flow (mocked confirmation, nothing sent)
  - Session persistence in `localStorage`, one-hour expiry
  - Route guard on `_authenticated`, redirect preserving the intended destination
  - A "force session expiry" control so expiry is testable without waiting
- **Out of scope**
  - Real identity provider, OAuth, SSO, MFA
  - Password reset actually delivering mail
  - Account lockout policy — `locked@test.com` is statically locked
- **Assumptions**
  - Three seeded accounts always exist; see [Mock API](../mock-api.md#accounts)
  - No CAPTCHA or rate limiting, so automation is never blocked

---

## 2. Backend API references (integration only)

Served in-page by MSW; there is no server. See [Architecture — the mock backend](../architecture.md#the-mock-backend).

| Purpose | Method | Endpoint | Request | Response | Notes |
|---|---|---|---|---|---|
| Sign in | `POST` | `/api/auth/login` | `{ email, password, rememberMe? }` | `{ token, user, expiresAt }` | 401 wrong credentials, 403 locked, 422 missing fields |
| Register | `POST` | `/api/auth/signup` | `{ name, email, password }` | `{ ok, email }` | 409 existing email, 500 if email contains `fail` |
| Request reset | `POST` | `/api/auth/forgot-password` | `{ email }` | `{ ok }` | 500 if email contains `fail` |

---

## 3. Current frontend behavior

### 3.1 Implemented now
- `src/features/auth/sign-in.tsx`, `sign-up.tsx`, `forgot-password.tsx` — the three screens
- `src/routes/(auth)/` — public route group; signing in while authenticated redirects to `/dashboard`
- `src/routes/_authenticated/route.tsx` — the guard, declared once and inherited by every child
- `src/contexts/auth-context.tsx` + `src/hooks/use-auth.ts` — session state
- `src/lib/auth.ts` — read/write/clear/expire against `localStorage`

### 3.2 Gaps / TODO in current code
- "Remember me" is captured and sent but does not change expiry — sessions are always one hour
- No refresh-token flow; an expired session simply bounces to sign-in

---

## 4. Screen flow and interactions

### 4.1 Load flow
- **Step 1:** Router context is seeded from `localStorage` at creation, so the first `beforeLoad` sees the real session on a cold load
- **Step 2:** `_authenticated.beforeLoad` runs; unauthenticated users are redirected to `/sign-in?redirect=<url>`
- **Step 3:** `/sign-in` reads `?redirect` via `validateSearch` and stores it for post-login navigation
- **Loading state:** Submit button disables and shows a spinner with `aria-busy`
- **Empty state:** Not applicable — the form is always rendered

### 4.2 Submit flow
- **Action:** `useLoginMutation` → `login()` service → `POST /api/auth/login`
- **Client validation:** Email required and well-formed; password required, minimum 8 characters. Runs on blur and on submit
- **Success UX:** Session written to `localStorage`, navigate to `?redirect` or `/dashboard`
- **Failure UX:** `fieldErrors` attach beneath the relevant input; a bare `message` renders in the `sign-in-error` banner
- **Retry/idempotency:** Query retries are disabled app-wide so deliberate failures surface rather than being retried away

---

## 5. Frontend data model mapping

| UI field | Form path | API field | Type | Required | Rules |
|---|---|---|---|---|---|
| Email | `email` | `email` | string | Y | Non-empty, matches `x@y.z` |
| Password | `password` | `password` | string | Y | Non-empty, ≥ 8 characters |
| Remember me | `rememberMe` | `rememberMe` | boolean | N | Sent but currently ignored |
| Full name (sign-up) | `name` | `name` | string | Y | Non-empty |
| Confirm password | `confirmPassword` | — | string | Y | Must equal `password`; never sent |

- **State ownership:** Local `useState` per form; the session lives in `AuthContext` and mirrors to `localStorage`
- **Transformations:** Email trimmed and lower-cased server-side; `confirmPassword` dropped before sending
- **Error mapping:** `ApiError.fieldErrors` → per-field messages; `ApiError.message` → banner

---

## 6. Testing and quality

- **Unit tests:** `passwordStrength()` scoring; `validate()` for each form
- **Integration tests:** [`e2e/auth.spec.ts`](../../e2e/auth.spec.ts) — 8 cases covering success, wrong password, locked account, empty submit, guard redirect, sign-out, and role visibility
- **Manual/agent plan:** [TC-001 to TC-005 and TC-004b/c](../test-plan.md)
- **Not required in this feature:** Real credential storage or password hashing — accounts are seeded fixtures

---

## 7. Specs to apply

- `React-Specs/data/data-fetching-api-client-spec.md`
- `React-Specs/ui-ux/forms-validation-spec.md`
- `React-Specs/ui-ux/error-handling-user-feedback-spec.md`
- `React-Specs/quality-ops/testing-strategy-spec.md`

---

## 8. Delivery checklist

- [x] Feature spec linked to work item/PR
- [x] UI behavior implemented according to this spec
- [x] Form validation and messages implemented
- [x] API integration and error handling verified
- [x] Integration tests cover this scope
- [x] `npm run lint`, typecheck, and build pass
- [x] No secrets committed

---

## Appendix — Test surface

**Accounts:** `admin@test.com` / `Admin123!` (admin) · `user@test.com` / `User123!` (standard) · `locked@test.com` / `Locked123!` (always 403)

**Testids** — sign-in: `sign-in-form`, `sign-in-email-input`, `sign-in-password-input`, `sign-in-remember-checkbox`, `sign-in-submit-button`, `sign-in-error`, `sign-in-email-error`, `sign-in-password-error`, `sign-in-forgot-link`, `sign-in-signup-link`

Sign-up: `sign-up-form`, `sign-up-name-input`, `sign-up-email-input`, `sign-up-password-input`, `sign-up-confirm-input`, `sign-up-submit-button`, `sign-up-error`, `sign-up-success`, `sign-up-strength`, `sign-up-strength-label`

Forgot password: `forgot-password-form`, `forgot-password-email-input`, `forgot-password-submit-button`, `forgot-password-error`, `forgot-password-success`

Session controls: `app-force-expire-button`, `app-sign-out-button`

**Known browser quirk:** In WebKit a cold `goto()` straight to a guarded URL races the redirect and can lose `?redirect=`. Load a public page first. See [Testing guide](../testing-guide.md#pitfalls).
