# Test Target App — Documentation

This app exists to be **tested**, not shipped. Every screen is a deliberate exercise in some UI pattern a Playwright suite needs to handle: async loading, form validation, modal focus traps, drag-and-drop, iframes, popups, role-based access.

If you are an AI agent planning test coverage, start with the [test plan](./test-plan.md) and [test-map.json](../test-map.json). Use the feature specs below when you need the reasoning behind a behavior.

## Feature specifications

Each follows the [frontend feature specification template](./feature-spec-template.md): requirement, API references, current behavior, screen flow, data mapping, testing, and delivery checklist.

| Feature | Routes | Test plan cases |
|---|---|---|
| [Authentication](./features/authentication.md) | `/sign-in`, `/sign-up`, `/forgot-password` | TC-001–TC-005 |
| [Dashboard](./features/dashboard.md) | `/dashboard` | TC-006 |
| [Products (CRUD)](./features/products.md) | `/products` | TC-007–TC-010d |
| [Forms showcase](./features/forms.md) | `/forms` | TC-011, TC-012, TC-012b |
| [Wizard](./features/wizard.md) | `/forms/wizard` | TC-013 |
| [UI playground](./features/ui-playground.md) | `/ui-playground` | TC-014b, TC-014c |
| [Reports](./features/reports.md) | `/reports` | TC-014 |
| [Profile](./features/profile.md) | `/profile` | *pending — see spec §6* |
| [Settings](./features/settings.md) | `/settings` | TC-014d, TC-014e |
| [Admin](./features/admin.md) | `/admin` | TC-015, TC-004b |

## Testing

| Document | Contents |
|---|---|
| [Test plan](./test-plan.md) | 52 cases, happy and negative paths — the manual-test source of truth |
| [Test plan — smoke](./test-plan-smoke.md) | 8-case subset sized for one PR comment and the per-run budget |
| [Testing guide](./testing-guide.md) | Fixtures, selector conventions, reset strategy, known pitfalls |
| [web-app-tester](./web-app-tester.md) | PR-triggered browser agent: config, auth storage states, webhook rules |
| [Test generation instructions](./test-generation-instructions.md) | Rules for generating Playwright specs from the manual test cases |
| [PR test agent prompt](./pr-test-agent-prompt.md) | Generic prompt: run the case sheet on each PR and propose new cases |
| [`test-cases.csv`](../test-cases.csv) | The 52-case sheet the PR agent reads and proposes against |

## Reference

| Document | Contents |
|---|---|
| [Architecture](./architecture.md) | Stack, folder layering, import rules, why there is no service worker |
| [Mock API](./mock-api.md) | Every endpoint, the seed data, latency and flaky mode |
| [Feature spec template](./feature-spec-template.md) | Blank template for documenting a new feature |

## The five-second version

```bash
npm run dev        # http://localhost:5173
```

Sign in with `user@test.com` / `User123!`, or `admin@test.com` / `Admin123!` for the admin area. Append `?reset=true` to any URL to restore seed data and clear the session.

Full account list and failure triggers are in the [mock API reference](./mock-api.md).
