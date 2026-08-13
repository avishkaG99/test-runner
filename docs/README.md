# Test Target App — Documentation

This app exists to be **tested**, not shipped. Every screen is a deliberate exercise in some UI pattern a Playwright suite needs to handle: async loading, form validation, modal focus traps, drag-and-drop, iframes, popups, role-based access.

If you are an AI agent planning test coverage, read [test-map.json](../test-map.json) first — it is the machine-readable version of these docs. Use these pages when you need the reasoning behind a behavior.

## Feature documentation

| Feature | Routes | What it exercises |
|---|---|---|
| [Authentication](./features/authentication.md) | `/sign-in`, `/sign-up`, `/forgot-password` | Field validation, auth errors, route guards, session expiry |
| [Dashboard](./features/dashboard.md) | `/dashboard` | Async loading skeletons, role-conditional UI, refetching |
| [Products (CRUD)](./features/products.md) | `/products` | Table search/filter/sort/pagination, dialogs, bulk actions |
| [Forms showcase](./features/forms.md) | `/forms` | Every input type, cross-field validation, file upload |
| [Wizard](./features/wizard.md) | `/forms/wizard` | Multi-step flow, per-step validation, review before submit |
| [UI playground](./features/ui-playground.md) | `/ui-playground` | Tabs, accordion, tooltip, dialog, drag-and-drop, iframe, popup, infinite scroll |
| [Reports](./features/reports.md) | `/reports` | Long-running operation with progress and cancellation |
| [Settings](./features/settings.md) | `/settings` | Preferences, network simulation, data reset, error boundary |
| [Admin](./features/admin.md) | `/admin` | Role-based route guard |

## Cross-cutting reference

| Document | Contents |
|---|---|
| [Architecture](./architecture.md) | Stack, folder layering, import rules, why there is no service worker |
| [Mock API](./mock-api.md) | Every endpoint, the seed data, latency and flaky mode |
| [Testing guide](./testing-guide.md) | Fixtures, selector conventions, reset strategy, known pitfalls |
| [web-app-tester](./web-app-tester.md) | PR-triggered browser agent: config, auth storage states, webhook rules |

## The five-second version

```bash
npm run dev        # http://localhost:5173
```

Sign in with `user@test.com` / `User123!`, or `admin@test.com` / `Admin123!` for the admin area. Append `?reset=true` to any URL to restore seed data and clear the session.

Full account list and failure triggers are in the [mock API reference](./mock-api.md).
