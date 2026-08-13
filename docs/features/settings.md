# Settings

Two jobs: ordinary user preferences, and the control panel for the test harness itself. The latter is what makes several other features testable.

**Route:** `/settings`
**Source:** [`src/features/settings/index.tsx`](../../src/features/settings/index.tsx)
**Related:** [Mock API](../mock-api.md) · [Dashboard — error state](./dashboard.md#error-state) · [Testing guide](../testing-guide.md)

---

## Appearance

Light and dark theme radios. The choice persists to `localStorage` under `tta.theme` and toggles the `dark` class on `<html>`.

The theme is applied *before* React renders (in `main.tsx`), so a reload in dark mode does not flash white first. A test can assert on the root class:

```ts
await expect(page.locator('html')).toHaveClass(/dark/)
```

The same toggle exists in the header (`app-theme-toggle`) on every protected page.

**Testids:** `settings-theme-group`, `settings-theme-light`, `settings-theme-dark`

## Network simulation

Two knobs that change how the [mock API](../mock-api.md) behaves, both persisted to `localStorage` and applied from the next request onward.

### Latency

`settings-latency-input` sets the artificial delay on every mock response, in milliseconds. Default 400.

Raising it is the reliable way to make loading states observable — set it to 3000 and every skeleton and spinner in the app becomes trivially assertable. Lowering it to 0 speeds up test suites that do not care about loading states.

### Flaky mode

`settings-flaky-checkbox` makes roughly 30% of authenticated read requests fail with HTTP 503 and the message "Service temporarily unavailable. Please retry."

**Off by default, and it should stay off for most testing.** It exists so retry and error-recovery UIs can be exercised deliberately, not to add ambient flakiness. Query retries are disabled app-wide, so a 503 surfaces as a visible error rather than being silently retried.

## Test data

`settings-reset-button` calls `POST /api/app/reset`, restoring the product catalogue to its exact seed state and invalidating every cached query. Equivalent to appending `?reset=true` to a URL, except it does not clear the session.

Use `?reset=true` for test isolation — it runs before the app boots, so there is no window where stale data is visible. See [Mock API — resetting state](../mock-api.md#resetting-state).

## Error boundary trigger

`settings-trigger-error-button` throws during render, which the router's error boundary catches and replaces the page with `error-boundary`.

This is the only deliberate way to reach the error boundary. The thrown message appears in `error-boundary-message`, and `error-boundary-reload` navigates back to the dashboard.

Because it is a render-phase throw rather than an event-handler throw, React's error boundary genuinely catches it — a detail that matters, since handler errors would escape to the console instead.

**Testids:** `error-boundary`, `error-boundary-message`, `error-boundary-reload`

## Testids

`settings-page`, `settings-theme-group`, `settings-theme-light`, `settings-theme-dark`, `settings-latency-input`, `settings-flaky-checkbox`, `settings-reset-button`, `settings-trigger-error-button`

## Storage keys

| Key | Contents |
|---|---|
| `tta.theme` | `"light"` or `"dark"` |
| `tta.latency` | Number, milliseconds |
| `tta.flakyMode` | Boolean |
| `tta.products` | The mock product database |
| `tta.token`, `tta.user` | Session — see [Authentication](./authentication.md#session-expiry) |
