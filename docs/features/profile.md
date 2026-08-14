# Frontend Feature Specification — Profile

**Purpose:** Let a signed-in user view their account details, edit their profile preferences, and change their password.

**Owner / driver:** Test-target maintainers

**Status:** Draft

**Related:** [Authentication](./authentication.md) · [Settings](./settings.md) · [Mock API](../mock-api.md#endpoints) · [`src/features/profile/`](../../src/features/profile/) · [`e2e/profile.spec.ts`](../../e2e/profile.spec.ts)

**Version / last updated:** 0.1, 2026-08-14

---

## 1. Requirement

### 1.1 Summary
- A self-service screen for the signed-in user: their identity, editable preferences, and a password change.
- Adds two test surfaces the app did not have. First, an endpoint whose **response depends on who is calling** — every other authenticated read returns the same data for admin and user alike. Second, a **dirty-state form** where Save stays disabled until something actually differs from the loaded record.
- Complements [Settings](./settings.md), which holds app-level and harness preferences. This screen is about the person, not the app.

### 1.2 Scope
- **In scope**
  - Read-only identity summary: name, email, role, and initials avatar
  - Editable display name, job title, bio, timezone, language, and marketing-email opt-in
  - Dirty tracking with Save/Discard disabled while clean, and a readable state label
  - Bio character counter that flags the limit before submit
  - Change-password form with client validation and server-side verification of the current password
  - Session user's name following the saved display name, so app chrome stays in step
  - Loading skeleton, error state with retry, and the standard `fail` trigger
- **Out of scope**
  - Avatar image upload — the avatar is derived initials, nothing is stored
  - Editing email, name, or role; those belong to the account, not the profile
  - Password strength meter (sign-up already covers that pattern)
  - Admin editing *another* user's profile — this screen is strictly self-service
  - Persisting password changes; see §3.2
- **Assumptions**
  - One seeded profile per account, keyed by user id
  - The bearer token carries the user id, so no separate session lookup is needed

---

## 2. Backend API references (integration only)

| Purpose | Method | Endpoint | Request | Response | Notes |
|---|---|---|---|---|---|
| Read profile | `GET` | `/api/profile` | — | `{ item: UserProfile }` | Resolved from the token; 404 if unknown |
| Update profile | `PUT` | `/api/profile` | `UserProfileInput` | `{ item: UserProfile }` | 422 field errors, 500 if display name contains `fail` |
| Change password | `POST` | `/api/profile/change-password` | `{ currentPassword, newPassword }` | `{ ok, changedAt }` | 422 on validation or a wrong current password |

All require `Authorization: Bearer …` and return 401 without it.

---

## 3. Current frontend behavior

### 3.1 Implemented now
- `src/features/profile/index.tsx` — the screen, plus the password section
- `src/features/profile/profile-form.ts` — validators, mappers, `isDirty()`, and `initialsFrom()`, kept React-free so they unit-test directly
- `src/hooks/api/profile.ts` — query and mutation hooks
- `src/lib/api/services/profile.ts` — Axios-only service functions
- `src/mocks/handlers.ts` — the three endpoints and `userIdFromRequest()`
- `src/contexts/auth-context.tsx` — gained `updateUser()` so a save can patch the session user

### 3.2 Gaps / TODO in current code
- **Password changes are validated but never persisted.** Persisting one would strand the whole suite: the seeded credentials in `e2e/fixtures.ts` would stop working after the first run, and `?reset=true` does not clear them because they live in `SEED_ACCOUNTS`, not storage. The endpoint therefore verifies the current password and returns success without writing. `e2e/profile.spec.ts` asserts this directly by signing in again afterwards.
- **The unsaved-changes guard covers tab close only** (`beforeunload`), not in-app navigation. Router-level blocking would need `shouldBlock`, and leaving it off means tests can navigate away mid-edit without dismissing a dialog.
- **Language is stored but nothing reads it.** There is no i18n layer; the select persists a value and that is all. Wiring it to actual translations is a separate piece of work.
- **`updatedAt` is server-generated**, so the "Saved" line is the one piece of non-deterministic text on the screen. Assert on the testid's presence rather than its content.
- The role shown in the summary comes from the profile record, which duplicates the session user's role. They cannot disagree today because both derive from the same seed, but nothing enforces it.

---

## 4. Screen flow and interactions

### 4.1 Load flow
- **Step 1:** Guard resolves; the screen mounts from `@/features/profile`
- **Step 2:** `useProfileQuery()` runs, keyed `['profile', 'detail']`
- **Step 3:** A `useEffect` seeds the form from the response, and re-seeds after each save so the dirty baseline follows the persisted record
- **Loading state:** `profile-loading` skeleton card
- **Empty state:** Not applicable — a profile always exists for a signed-in user. Individual fields may be empty, and `u-2` ships that way deliberately

### 4.2 Submit flow
- **Action:** `useUpdateProfileMutation` → `PUT /api/profile`; the password form posts separately
- **Client validation:** Display name required, 2–40 chars; job title ≤ 60; bio ≤ 280. Password: current required, new ≥ 8 chars and different from current, confirm must match
- **Success UX:** `profile-saved` alert, a toast, and `updateUser()` patching the session so the header label follows
- **Failure UX:** `fieldErrors` attach to inputs; a bare `message` renders in `profile-form-error`. Same shape as [Products](./products.md#42-submit-flow)
- **Retry/idempotency:** No retries. Saving unchanged values is a no-op server-side but still bumps `updatedAt`

---

## 5. Frontend data model mapping

| UI field | Form path | API field | Type | Required | Rules |
|---|---|---|---|---|---|
| Display name | `displayName` | `displayName` | string | Y | Trimmed, 2–40 chars |
| Job title | `jobTitle` | `jobTitle` | string | N | Trimmed, ≤ 60 chars |
| Bio | `bio` | `bio` | string | N | Trimmed, ≤ 280 chars |
| Timezone | `timezone` | `timezone` | enum | N | One of `TIMEZONES` |
| Language | `language` | `language` | enum | N | One of `Language` |
| Marketing emails | `marketingEmails` | `marketingEmails` | boolean | N | Defaults false |
| Current password | `currentPassword` | `currentPassword` | string | Y | Verified server-side |
| New password | `newPassword` | `newPassword` | string | Y | ≥ 8 chars, ≠ current |
| Confirm password | `confirmPassword` | — | string | Y | Must equal new; never sent |

- **State ownership:** Form values in local `useState`; the profile itself in the Query cache; the session user in `AuthContext`
- **Transformations:** `toFormValues()` profile → form, `toProfileInput()` form → DTO with trimming. `isDirty()` compares trimmed values so trailing whitespace alone is not a change
- **Error mapping:** `ApiError.fieldErrors` → per-field messages; `ApiError.message` → the form banner

---

## 6. Testing and quality

- **Unit tests:** `validateProfile()` boundaries (1/2/40/41 chars); `validatePassword()` including the reuse rule; `isDirty()` whitespace handling; `initialsFrom()` with one, two, and zero words
- **Integration tests:** [`e2e/profile.spec.ts`](../../e2e/profile.spec.ts) — 11 cases covering load, token-scoped identity, dirty/discard, save with persistence and header sync, validation, the bio counter, the forced 500, and four password paths
- **Manual/agent plan:** Needs new cases. The sheet ends at TC-015; propose TC-016 (view and edit), TC-016b (validation and the counter), TC-016c (password change paths). Add to [test-plan.md](../test-plan.md) and [`test-cases.csv`](../../test-cases.csv) once agreed
- **Not required in this feature:** Avatar rendering fidelity, i18n of the language values

---

## 7. Specs to apply

- `React-Specs/data/data-fetching-api-client-spec.md`
- `React-Specs/ui-ux/forms-validation-spec.md`
- `React-Specs/ui-ux/error-handling-user-feedback-spec.md`
- `React-Specs/quality-ops/testing-strategy-spec.md`
- `React-Specs/quality-ops/definition-of-done-spec.md`

---

## 8. Delivery checklist

- [x] Feature spec linked to work item/PR
- [x] UI behavior implemented according to this spec
- [x] Form validation and messages implemented
- [x] API integration and error handling verified
- [x] Seed profiles added to `src/mocks/seed.ts` and wired into reset
- [x] `test-map.json` updated with the new route and testids
- [x] Integration tests written for this scope
- [ ] Test-plan cases added to `test-plan.md` and `test-cases.csv`
- [ ] `npm run lint`, typecheck, and build pass — **not yet run, see below**
- [x] No secrets committed

> The lint/typecheck/test row is unticked deliberately. Bash was unavailable in the session that wrote this feature, so nothing here has been executed. Run `npm run lint`, `npm run typecheck`, and `npm run test:e2e:chromium` before treating it as done.

---

## Appendix — Test surface

**Seeded profiles**, one per account, restored by `?reset=true` and `POST /api/app/reset`:

| User | Display name | Job title | Bio | Timezone | Language | Marketing |
|---|---|---|---|---|---|---|
| `u-1` admin | `Ada` | Platform Administrator | set | Europe/London | en | on |
| `u-2` user | `Sam` | *(empty)* | *(empty)* | UTC | en | off |
| `u-3` locked | `Lee` | Contractor | set | America/New_York | fr | off |

`u-2` is sparse on purpose — the empty-field path is reachable without editing first. `u-3` is unreachable through the UI, since that account cannot sign in.

**Testids** — summary: `profile-page`, `profile-loading`, `profile-error`, `profile-retry-button`, `profile-summary`, `profile-avatar`, `profile-name`, `profile-email`, `profile-role`

Form: `profile-form`, `profile-form-error`, `profile-saved`, `profile-display-name-input`, `profile-job-title-input`, `profile-bio-input`, `profile-bio-counter`, `profile-timezone-select`, `profile-language-select`, `profile-marketing-checkbox`, `profile-save-button`, `profile-reset-button`, `profile-dirty-state`

Password: `password-form`, `password-form-error`, `password-changed`, `password-current-input`, `password-new-input`, `password-confirm-input`, `password-submit-button`

Field errors follow the app-wide `<fieldId>-error` convention: `profile-display-name-error`, `profile-bio-error`, `password-current-error`, `password-new-error`, `password-confirm-error`.

**Dirty state:** `profile-dirty-state` reads `No changes` or `Unsaved changes` — assert on it rather than probing the Save button's disabled attribute, which is the same signal expressed less legibly.

**Failure triggers:** a display name containing `fail` returns 500, matching the app-wide convention. A wrong current password returns 422 with `fieldErrors.currentPassword`.

**Identity note:** `GET /api/profile` resolves the caller from `mock-token-<userId>`. This is the only endpoint whose response varies by account, which makes it the natural place to test that a suite is authenticated as who it thinks it is. Requesting `authedPage` and `adminPage` in the same test overwrites the first session — see the [testing guide](../testing-guide.md).

**Timing:** the standard 400ms mock latency applies. The Save button exposes `aria-busy` while the mutation is in flight.
