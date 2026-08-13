# Authentication

Sign-in, sign-up, and password reset, plus the route guard that protects everything else. This is the feature most tests depend on, so it is worth understanding before the others.

**Routes:** `/sign-in`, `/sign-up`, `/forgot-password`
**Source:** [`src/features/auth/`](../../src/features/auth/)
**Related:** [Architecture — route guards](../architecture.md#route-guards) · [Testing guide — fixtures](../testing-guide.md#fixtures) · [Admin](./admin.md)

---

## Accounts

Three seeded accounts, each covering a different outcome:

| Email | Password | Outcome |
|---|---|---|
| `admin@test.com` | `Admin123!` | Signs in as admin — sees the [Admin](./admin.md) nav item and the [dashboard](./dashboard.md) admin panel |
| `user@test.com` | `User123!` | Signs in as a standard user — admin surfaces are hidden |
| `locked@test.com` | `Locked123!` | Always rejected with HTTP 403 and a distinct "account is locked" message |

The locked account exists so a test can distinguish *wrong credentials* from *valid credentials, refused*. They produce different messages and different status codes.

## Sign-in

Client-side validation runs on blur and again on submit:

- Email is required and must match a basic address pattern
- Password is required and must be at least 8 characters

Errors render in a `<p role="alert">` wired to the input through `aria-describedby`, so both `getByTestId('sign-in-email-error')` and accessibility-based locators find them. The input also gets `aria-invalid="true"`.

Server-side failures land in a separate banner (`sign-in-error`) rather than on a field, because they are not attributable to one input:

| Cause | Status | Message |
|---|---|---|
| Wrong password | 401 | `Invalid email or password` |
| Locked account | 403 | `This account is locked. Contact your administrator.` |

On success the session is stored and the user is sent to `?redirect=` if present, otherwise `/dashboard`.

### Testids

`sign-in-form`, `sign-in-email-input`, `sign-in-password-input`, `sign-in-remember-checkbox`, `sign-in-submit-button`, `sign-in-error`, `sign-in-email-error`, `sign-in-password-error`, `sign-in-forgot-link`, `sign-in-signup-link`

## Route guards

The guard lives on the `_authenticated` layout's `beforeLoad`, declared once and inherited by every child route. An unauthenticated visitor to a protected URL is redirected to `/sign-in?redirect=<original-url>`, and signing in returns them there.

Visiting `/sign-in` while already authenticated redirects to `/dashboard`, so tests cannot accidentally sit on a login form with a live session.

> **WebKit note:** a cold `page.goto()` straight to a guarded URL races the redirect and can lose the `?redirect=` param. Load a public page first, then navigate. See [Testing guide — pitfalls](../testing-guide.md#pitfalls).

## Session expiry

The header has a **Force session expiry** button (`app-force-expire-button`) that backdates the stored expiry timestamp, so the next guard check treats the session as expired and bounces to sign-in. This makes expiry testable without waiting an hour or manipulating the clock.

Sessions otherwise last one hour and live in `localStorage` under `tta.token` and `tta.user`.

## Sign-up

Validates name, email, password length, and that the confirmation matches. A password-strength meter scores four things — length ≥ 8, an uppercase letter, a digit, a symbol — and renders as an ARIA progressbar with labels *Very weak* through *Strong*.

Two server outcomes are reachable:

- An email that already exists returns 409 with a field-level error
- An email containing `fail` returns 500 (see [mock API — failure triggers](../mock-api.md#failure-triggers))

Success replaces the whole form with `sign-up-success`, so tests assert on a state change rather than a toast that may have auto-dismissed.

### Testids

`sign-up-form`, `sign-up-name-input`, `sign-up-email-input`, `sign-up-password-input`, `sign-up-confirm-input`, `sign-up-submit-button`, `sign-up-error`, `sign-up-success`, `sign-up-strength`, `sign-up-strength-label`

## Forgot password

The simplest flow: validate the email, submit, replace the form with a confirmation. An email containing `fail` returns 500. Nothing is actually sent.

### Testids

`forgot-password-form`, `forgot-password-email-input`, `forgot-password-submit-button`, `forgot-password-error`, `forgot-password-success`

## Testing notes

Use the fixtures in [`e2e/fixtures.ts`](../../e2e/fixtures.ts) rather than signing in by hand in every test:

```ts
test('something', async ({ authedPage }) => { /* already signed in as user */ })
test('admin thing', async ({ adminPage }) => { /* already signed in as admin */ })
```

**Do not request both fixtures in one test.** They share a browser context, so the second sign-in overwrites the first session and the test asserts against the wrong user. Split into two tests instead — this is covered in [Testing guide — pitfalls](../testing-guide.md#pitfalls).
