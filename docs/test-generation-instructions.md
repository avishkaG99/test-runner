# Instructions: Generate Production-Ready Playwright TypeScript Tests from Manual Test Cases

> **Project:** `avishkaG99/test-runner` — React 19 SPA test target.
> Sections 1–28 are the standard generator rules. **§29 Input** and **§30 Project Context** are filled in for this repository so nothing has to be guessed.

---

## 1. Role

Act as a **Senior QA Engineer / Test Automation Architect** responsible for converting the supplied manual test cases into clean, maintainable, production-ready **Playwright TypeScript** automation for a React-based web application.

Your primary goals are:

- Preserve the business intent of the supplied manual tests.
- Maintain strict traceability between manual and automated tests.
- Generate resilient Playwright automation rather than brittle UI scripts.
- Reuse the supplied Playwright framework when one exists.
- Avoid inventing application behavior, test data, selectors, navigation, or expected results.
- Produce code that is structurally consistent, type-safe, and suitable for CI execution.

---

## 2. Source-of-Truth Rules

Use the following sources, in this order:

1. **Attached manual test cases** — source of truth for test scope, steps, data, and expected results.
2. **Attached existing Playwright framework/code** — source of truth for existing architecture, fixtures, page objects, utilities, configuration, naming conventions, and reusable components.
3. **Playwright MCP/application inspection** — source of truth only for observing the actual application's UI structure, navigation, accessible names, and locator candidates when application access is available.
4. **These instructions** — engineering rules for generating the automation.

### Important

- Do not invent information that is not supported by the sources above.
- If sources conflict, preserve the manual test's business intent and document the conflict rather than silently changing the test.
- Do not use general assumptions about the application to fill gaps.
- Do not create automation for functionality that is not represented by the supplied manual test cases.
- Do not use MCP findings to add new scenarios or change expected business behavior.

---

## 3. Objective and Scope

Read and understand all supplied manual test cases before generating code.

Generate Playwright TypeScript automation **only for the supplied manual test cases**.

Do not:

- create additional test scenarios;
- improve or expand the manual test coverage;
- add negative cases;
- add boundary cases;
- add accessibility tests;
- add visual tests;
- add API tests;
- add performance tests;
- add security tests;
- add extra validations;
- combine unrelated test cases;
- split one manual test case into multiple automated tests.

Any additional testing idea may be mentioned separately as an observation only; it must **not** be implemented.

---

## 4. Strict 1:1 Test Case Mapping

A strict **1:1 mapping** is mandatory.

For every supplied manual test case:

- Generate exactly **one** Playwright `test(...)`.
- Preserve the manual test case identifier.
- Preserve the manual test case title as closely as possible.
- Preserve the original step order.
- Preserve the original expected-result meaning and intent.
- Map every manual step to the automation.
- Map every automatable expected result to an explicit Playwright assertion.
- Do not create an automated test that does not correspond to a supplied manual test case.

### Mapping rules

| Manual test case | Automated test |
|---|---|
| 1 manual test case | Exactly 1 Playwright `test(...)` |
| 10 manual test cases | Exactly 10 Playwright `test(...)` blocks |
| 0 manual test cases | Generate 0 tests |

If a manual case cannot be completely automated because information is missing, still maintain the 1:1 mapping and document the limitation with `TODO`.

---

## 5. Manual Step and Expected-Result Traceability

Every manual step must be traceable in the generated automation.

Prefer Playwright `test.step()` for meaningful manual steps because it provides structured reporting and debugging visibility.

```typescript
await test.step('Step 3: Enter the customer name', async () => {
  await customerPage.customerNameInput.fill(customerName);
});
```

For each manual expected result:

- Implement an assertion when it is automatable.
- Place the assertion immediately after the relevant action whenever practical.
- Use web-first Playwright assertions.
- Do not replace a required assertion with a comment.
- Do not add assertions that are not supported by the manual expected result.

```typescript
await test.step('Expected: Success message is displayed', async () => {
  await expect(page.getByRole('alert')).toHaveText('Customer created successfully');
});
```

If the manual test contains a step but no explicit expected result, do not invent one.

If the expected result cannot be verified from the supplied information, add a `TODO` rather than guessing.

---

## 6. Playwright MCP Usage

Use **Playwright MCP** when it is available and application access is provided.

MCP should be used to:

- inspect the relevant application pages;
- navigate the exact user flow represented by the manual test;
- understand the rendered UI;
- identify accessible names and roles;
- inspect labels, placeholders, test IDs, and other stable attributes;
- identify reusable page/component boundaries;
- validate locator candidates;
- confirm navigation paths required by the supplied test;
- reduce duplicate locator and navigation implementations.

### MCP restrictions

MCP is an inspection and validation aid. It must not be used to invent requirements.

Do not:

- explore unrelated application functionality and generate tests for it;
- add scenarios discovered during exploration;
- change manual expected results based on what the application happens to do;
- invent missing test data;
- bypass an unclear manual step by guessing.

If MCP is unavailable:

- Continue using the supplied manual cases and existing framework.
- Do not fabricate MCP findings.
- Do not block generation solely because MCP is unavailable.
- Use `TODO` comments for application-specific information that cannot be determined from the supplied sources.

---

## 7. Locator Strategy

Use Playwright's user-facing and resilient locator strategies.

Preferred order:

1. `getByRole()`
2. `getByLabel()`
3. `getByPlaceholder()`
4. `getByTestId()`
5. `getByText()`
6. stable CSS/data attributes when necessary
7. XPath only as a last resort

The exact locator should be based on MCP inspection, existing framework code, supplied application information, or explicit information in the manual test case.

### Locator rules

- Prefer locators that describe how a user identifies the element.
- Prefer accessible roles and names for buttons, links, headings, dialogs, tabs, checkboxes, radio buttons, etc.
- Use `getByLabel()` for form controls when a proper label exists.
- Use `getByTestId()` when the project intentionally provides stable test IDs.
- Use `getByText()` only when text is a reliable identifier.
- Avoid generated CSS classes, React-specific implementation details, deeply nested selectors, and DOM-position selectors.
- Avoid `nth()` when a unique semantic locator can be used.
- Do not invent a selector value.
- If multiple matching elements exist, refine using `filter({ hasText })`, `getByRole()`, or a stable container.
- If no reliable locator can be established from the available sources, add a `TODO`.

### React-specific rule

Do not target React component names, React internal properties, generated framework internals, implementation-specific state, or arbitrary DOM structure — unless an existing framework explicitly relies on such a stable contract and no better locator is available.

---

## 8. Page Object Model

Use the **Page Object Model (POM)**. Page objects belong under `generated/PageObjects/`.

Page objects should encapsulate page-specific locators, expose meaningful user actions, keep selectors out of test files where appropriate, contain only methods required by the supplied tests, and avoid speculative abstractions, duplicate locators, and duplicate methods.

```typescript
export class CustomerPage {
  constructor(private readonly page: Page) {}

  readonly customerNameInput = this.page.getByLabel('Customer name');

  async enterCustomerName(name: string): Promise<void> {
    await this.customerNameInput.fill(name);
  }
}
```

### Assertions in Page Objects

Keep business assertions in the test layer unless the existing framework has an established convention for assertion methods. Page objects may expose locators that the test uses for assertions.

Avoid methods such as `assertCustomerWasCreated()` unless that pattern already exists in the supplied framework.

---

## 9. Required Project Structure

```text
generated/
├── PageObjects/
│   └── <PageName>Page.ts
├── Tests/
│   └── <FeatureName>.spec.ts
├── Fixtures/
│   └── <fixture files only when required>
├── Utils/
│   └── <utility files only when required>
└── Base/
    └── <base files only when required>
```

Only create files that are necessary. Do not create generic base classes without a demonstrated need, generic utility libraries, unused fixtures, speculative page objects, duplicate configuration, placeholder files, or unused helper methods.

When an existing framework is supplied, prefer modifying/reusing it rather than creating duplicate infrastructure under `generated/`. Preserve the `generated/` requirement while clearly identifying dependencies on existing project files.

---

## 10. Existing Framework Reuse

When existing Playwright files are supplied, inspect `playwright.config.ts`, tests, page objects, fixtures, authentication setup, utilities, base classes, TypeScript configuration, package configuration, test data utilities, and project/browser configuration.

Then:

1. Reuse existing page objects.
2. Reuse existing locators.
3. Reuse existing fixtures.
4. Reuse existing authentication.
5. Reuse existing utilities.
6. Follow established naming conventions.
7. Add only missing functionality.
8. Do not rewrite unrelated code.
9. Do not duplicate an existing method.
10. Clearly identify every modified or newly created file.

If an existing method is almost suitable but does not meet the supplied manual step, modify it only when the modification is safe, localized, and required.

---

## 11. Authentication and Credentials

Authentication credentials are supplied at runtime through environment variables (see §30 for this project's names).

Rules:

- Never hardcode credentials.
- Never print credentials.
- Never include credential values in comments.
- Never write credentials into generated source files.
- Never expose environment-variable values in reports.
- Reuse an existing authentication fixture or storage-state mechanism when available.
- If login is explicitly a manual test step, automate the login step as written.
- If authentication is only a precondition, use the existing authenticated mechanism.
- Do not add login steps merely because the application requires authentication.

Authentication state files must never be committed as source code or exposed in generated output.

---

## 12. Test Data Rules

- Use the exact supplied test data where provided.
- Reuse existing framework test-data mechanisms when appropriate.
- Do not invent values.
- Do not silently replace supplied values.
- Do not generate random data unless the manual test explicitly requires unique/dynamic data.
- Do not introduce Faker or other data-generation libraries unless already present and required.
- Do not create new test data files unless required.
- Do not hardcode environment-specific values when the framework provides configuration for them.

If required test data is missing:

```typescript
// TODO: Required test data is not specified in the manual test case.
```

---

## 13. Navigation and URLs

- Use the existing `baseURL` configuration when available.
- Prefer relative application paths such as `page.goto('/products')`.
- Do not hardcode environment-specific hosts.
- Do not invent routes.
- Do not add navigation steps that are not required by the manual case.
- If a route cannot be established from the available sources, add a `TODO`.

Do not use `page.goto()` as a substitute for a user interaction when the manual case explicitly requires navigating through the UI.

---

## 14. Waiting and Synchronization

Do:

- use locators;
- use web-first assertions;
- wait for meaningful UI state;
- wait for a response only when the test genuinely needs to synchronize with a specific network operation;
- use `expect(...).toHaveURL()`, `toBeVisible()`, `toHaveText()`, etc.

Do not:

- use `waitForTimeout()` for normal synchronization;
- add arbitrary sleeps;
- add polling loops to hide application instability;
- use excessive `waitForLoadState()` calls without a demonstrated need;
- use `force: true` unless explicitly required and documented;
- add retry loops around failed actions.

A synchronization problem should be solved with the correct locator, assertion, event, or application state — not with an arbitrary delay.

---

## 15. Assertions

```typescript
await expect(locator).toBeVisible();
await expect(locator).toBeEnabled();
await expect(locator).toHaveText('...');
await expect(locator).toContainText('...');
await expect(locator).toHaveValue('...');
await expect(page).toHaveURL(/.../);
await expect(page).toHaveTitle('...');
```

Rules:

- Use `expect` from `@playwright/test`.
- Prefer locator-based assertions.
- Prefer auto-retrying assertions over manual polling.
- Avoid `expect(await locator.isVisible()).toBe(true)` when `toBeVisible()` is appropriate.
- Avoid assertions on implementation details.
- Do not add assertions simply because they are convenient.
- Every automatable expected result should have a corresponding assertion.
- If an expected result is not directly automatable, document why.

---

## 16. Test Independence and State

Each automated test must be independently executable unless the supplied manual test cases explicitly define a dependency.

Do not depend on another test having run first, use shared mutable state between tests, store a `Page` globally, rely on execution order, use serial execution merely to make tests pass, or create hidden dependencies through global variables.

Use Playwright's test fixtures and isolated browser contexts.

If tests modify shared data, follow the existing framework's strategy rather than creating an ad-hoc solution. Do not add cleanup that changes the business intent of the manual test.

---

## 17. Async and TypeScript Standards

- Use `@playwright/test`.
- Use `.ts` files.
- Await all asynchronous Playwright operations.
- Use explicit return types for reusable page-object methods where helpful.
- Avoid `any`.
- Avoid unnecessary type assertions.
- Use meaningful names.
- Keep methods small and focused.
- Keep test code readable.
- Use valid relative imports.
- Do not leave unused imports, variables, or methods.
- Avoid dead code.
- Avoid duplicated logic where reuse is clearly justified.

The generated project must pass a separate TypeScript check (see §30 for the command). Do not add or modify TypeScript configuration unless the supplied framework requires it.

---

## 18. Test Structure and Readability

```typescript
import { test, expect } from '@playwright/test';
import { CustomerPage } from '../PageObjects/CustomerPage';

test.describe('Customer Management', () => {
  test('TC-001 - Create customer', async ({ page }) => {
    const customerPage = new CustomerPage(page);

    await test.step('Step 1: Navigate to Customers', async () => {
      await page.goto('/customers');
    });

    await test.step('Expected: Customer is created', async () => {
      // ...
    });
  });
});
```

Do not create a `beforeEach` merely to hide manual steps. Use hooks only for genuine setup that is common, independent, and supported by the framework.

If the manual test explicitly includes login, navigation, or setup steps, keep them visible and traceable.

---

## 19. Error Handling

Do not hide failures. Do not add broad `try/catch` blocks that suppress failures, empty `catch` blocks, conditional assertions that silently skip failures, fallback locators that mask incorrect selectors, retry loops, `test.skip()` for inconvenience, `test.fixme()` without a documented reason, or automatic fallback behavior that changes the manual flow.

When information is missing, use `TODO` rather than exception suppression.

---

## 20. Non-Automatable Steps

For steps requiring CAPTCHA, manual MFA, external email, hardware, biometrics, or unavailable third-party systems:

1. Keep the step in the correct location.
2. Add a `TODO`.
3. Explain why it cannot currently be automated.
4. Do not invent a bypass.
5. Do not mock or simulate it unless explicitly required.
6. Continue generating the remainder of the test when possible.

---

## 21. Ambiguous or Missing Information

1. Do not guess.
2. Add a `TODO` at the relevant location.
3. Describe exactly what information is missing.
4. Generate the rest of the test when it can be implemented safely.
5. Do not invent selectors, routes, roles, credentials, data, or expected results.

---

## 22. Network/API Usage

The primary purpose of these tests is UI automation. Do not replace UI interactions with direct API calls merely because an API would be easier.

Use API requests only when the manual test explicitly requires it, or the existing framework already uses an API for legitimate setup/cleanup — and only when doing so does not alter the business behavior being tested.

---

## 23. React Application Considerations

Interact with the rendered UI, use accessible/user-facing locators, rely on Playwright auto-waiting, and use web-first assertions. Do not inspect React internals, depend on component implementation details, or use arbitrary delays to compensate for asynchronous rendering.

If a component is dynamically rendered, wait through its observable UI state rather than a fixed amount of time.

---

## 24. File Generation and Modification Rules

Only generate or modify files required for the supplied manual test cases. Before creating a new file, determine whether the required functionality already exists. Do not overwrite unrelated framework code.

Every generated or modified file must contain complete code, have valid imports, have no intentional omissions, and follow existing project conventions.

Do not output placeholder text such as `// existing code here`.

---

## 25. Token Efficiency and Context Optimization

Optimize both reasoning context and generated output without sacrificing correctness, traceability, reliability, or production quality.

**Context:** Inspect only files and pages relevant to the supplied cases. Do not re-inspect what is already established. Search for reusable components before creating new ones.

**Code:** Generate only what the supplied cases require. Reuse existing methods. Define each locator once. Avoid comments that restate obvious code.

**Output:** Provide each file exactly once. Keep summaries concise. Report only real ambiguities and limitations.

**Priority:** Token efficiency must never override correctness, 1:1 mapping, traceability, expected-result validation, reliability, or code quality.

---

## 26. Production-Readiness Validation

Before returning the result, validate:

**Scope** — every test maps to one supplied case; none added, omitted, combined, or split.

**Traceability** — IDs preserved; titles traceable; step order intact; expected results asserted; `test.step()` used appropriately.

**Locators** — resilient and user-facing; no invented values; no React internals.

**Synchronization** — no arbitrary waits, sleeps, retry loops, or unjustified `force: true`.

**Test design** — independent; no ordering dependencies; no global mutable state; no serial execution added to avoid failures.

**Code quality** — valid imports and paths; no unused code; assertions in the test layer; valid TypeScript; no credentials exposed.

**Framework compatibility** — existing fixtures, authentication, page objects, utilities, and conventions reused.

---

## 27. Required Output

Produce the result in this exact order.

### 27.1 Traceability Summary

Manual test case ID · manual test title · generated Playwright test name · generated test file. Do not list tests that were not present in the input.

### 27.2 Ambiguities and Non-Automatable Items

List only actual issues. If none: `None identified.`

### 27.3 Generated Folder Structure

Show only the files required for the supplied test cases.

### 27.4 Generated or Modified Files

Complete content for every file, labelled with its full relative path. No omissions, no placeholders.

### 27.5 Mapping Validation

Number of manual cases received · number of tests generated · whether the mapping is exactly 1:1 · any reason it could not be achieved.

### 27.6 Automation Quality Notes

Locator approach · authentication approach · reused framework components · any `TODO`s · any limitations. Do not introduce new test scenarios here.

---

## 28. Final Rules

1. **Manual test cases define scope.**
2. **Exactly one Playwright test per manual test case.**
3. **Never invent application behavior.**
4. **Never invent test data.**
5. **Never invent expected results.**
6. **Never invent selectors when the required information is unavailable.**
7. **Use TODOs for genuine missing information.**
8. **Preserve manual step order.**
9. **Convert automatable expected results into explicit assertions.**
10. **Use stable, user-facing Playwright locators.**
11. **Use Playwright auto-waiting instead of arbitrary sleeps.**
12. **Keep tests independent.**
13. **Reuse existing framework components.**
14. **Avoid unnecessary abstraction.**
15. **Do not hide failures with retries, fallback logic, or exception suppression.**
16. **Never expose credentials.**
17. **Do not add tests outside the supplied manual scope.**
18. **Ensure generated TypeScript is complete and structurally valid.**
19. **Validate the final manual-test count against the generated-test count.**
20. **If required information is missing, document it instead of guessing.**

---

## 29. Input — where everything lives

### Manual test cases (source of truth for scope, §2.1)

| File | Cases | Use when |
|---|---|---|
| `docs/test-plan.md` | 52 | Full regression generation |
| `docs/test-plan-smoke.md` | 8 | Quick subset — the same cases, extracted |

Each case is a `## TC-NNN` heading followed by numbered steps and an `**Expected:**` line. The `TC-NNN` identifier is the ID to preserve under §4. Cases are tagged ✅ Happy or ❌ Negative; that tag is descriptive and **not** part of the test name.

The smoke file is a strict subset of the full plan — **never generate from both**, or you will produce duplicate tests for the same IDs.

### Existing Playwright framework (source of truth for architecture, §2.2 and §10)

| Path | Contents |
|---|---|
| `playwright.config.ts` | Projects, `baseURL`, `webServer`, reporters, `testMatch` |
| `e2e/fixtures.ts` | `ACCOUNTS`, `signIn()`, and the `authedPage` / `adminPage` fixtures |
| `e2e/auth.spec.ts` | Reference style for auth flows |
| `e2e/dashboard.spec.ts` | Reference style for async loading |
| `e2e/smoke.spec.ts` | Reference style for CRUD and interaction |
| `tsconfig.e2e.json` | Type-checks `e2e/**` and `generated/**` |

**Reuse these rather than rebuilding them.** In particular, do not write a new login helper — see §30.

### Application reference — read these before writing locators

These describe the application. They are **not** a source of scope: they never add, remove, or change a test case (§3). Use them only to resolve locators, routes, and expected values that the manual case names but does not spell out.

| File | Read it for |
|---|---|
| `test-map.json` | Every route, testid, and behavior in machine-readable form |
| `docs/features/<feature>.md` | Per-feature detail: data flow, validation rules, timing caveats, and a **Appendix — Test surface** section listing that feature's testids |

**Required order of consultation when a locator or expected value is unclear:**

1. The manual test case itself — it may name the element in words
2. `test-map.json` — confirm the testid exists
3. The relevant `docs/features/<feature>.md` appendix — for dynamic testids and caveats
4. MCP inspection, if available (§6)
5. If still unresolved, add a `TODO` (§21) — **never invent a selector**

### Which feature doc covers which cases

Read the doc matching the feature under test. Do not read all nine — that wastes context (§25).

| Cases | Plan section | Feature doc |
|---|---|---|
| TC-001 – TC-007 | Authentication — sign in | `docs/features/authentication.md` |
| TC-008 – TC-010 | Authentication — session | `docs/features/authentication.md` |
| TC-011 – TC-016 | Sign up and password reset | `docs/features/authentication.md` |
| TC-017 – TC-020 | Dashboard | `docs/features/dashboard.md` |
| TC-021 – TC-025 | Products — browsing | `docs/features/products.md` |
| TC-026 – TC-036 | Products — create, edit, delete | `docs/features/products.md` |
| TC-037 – TC-041 | Forms showcase | `docs/features/forms.md` |
| TC-042 – TC-044 | Wizard | `docs/features/wizard.md` |
| TC-045 – TC-047 | UI playground | `docs/features/ui-playground.md` |
| TC-048 – TC-049 | Settings | `docs/features/settings.md` |
| TC-050 – TC-051 | Admin role guard | `docs/features/admin.md` |
| TC-052 | 404 routing | `docs/architecture.md` (route guards) |

`docs/features/reports.md` covers the long-running report operation. No case in the current plan exercises it — do not generate one (§3).

Each feature doc's **Appendix — Test surface** is the authoritative locator list for that feature, including dynamic patterns such as `products-edit-<id>` and `wizard-review-<field>` that `test-map.json` shows only as templates.

### Why this matters

Several manual cases describe an element in user language — "the bulk delete button", "the strength label" — without naming a testid. The feature doc's appendix resolves it. Guessing instead produces a locator that compiles, passes type-checking, and fails at runtime.

If no manual test cases are supplied, generate no tests and clearly report that the required manual-test input is missing.

---

## 30. Project context

### Application under test

React 19 SPA, TanStack Router, no real backend — the API is mocked in-page. Full detail in `docs/architecture.md`.

### Base URL (§13)

`playwright.config.ts` reads `BASE_URL` from the environment, defaulting to `http://localhost:5173`. When `BASE_URL` is set, the `webServer` block is skipped so the suite runs against a deployed preview.

Use relative paths in tests (`page.goto('/products')`), never absolute URLs.

### Accounts and credentials (§11)

`e2e/fixtures.ts` exposes `ACCOUNTS`, which reads from the environment with seeded values as fallback:

```text
TEST_USER_EMAIL / TEST_USER_PASSWORD
TEST_ADMIN_EMAIL / TEST_ADMIN_PASSWORD
TEST_LOCKED_EMAIL / TEST_LOCKED_PASSWORD
```

**Import `ACCOUNTS`; never write an email or password literal into a generated file.**

Three roles exist: a standard user, an administrator, and a locked account that is always refused. Several cases name a specific account — use the one the case names.

### Authentication approach (§11)

- **When signing in is a manual step** (TC-001, TC-002), automate it through the UI as written — keep it visible and traceable.
- **When authentication is only a precondition**, use the `authedPage` or `adminPage` fixture instead of repeating a login.

```typescript
import { expect, test } from '../../e2e/fixtures';

test('TC-021 - Search narrows the table', async ({ authedPage }) => {
  await test.step('Step 1: Navigate to products', async () => {
    await authedPage.goto('/products');
  });
  // ...
});
```

> **One account per test.** `authedPage` and `adminPage` share a browser context, so requesting both in one test overwrites the first session. Cases needing both roles (TC-050 / TC-051) are already split — keep them separate.

### Test isolation (§16)

Product data persists to `localStorage` and leaks between tests. Cases that mutate data start with `?reset=true`, which restores seed data and clears the session before the app boots:

```typescript
await page.goto('/products?reset=true');
```

Preserve that parameter wherever a case specifies it — it is the isolation mechanism, not decoration.

> **Do not add `?reset=true` after using a fixture.** The `authedPage` and `adminPage` fixtures already sign in with `?reset=true`. Navigating again with that parameter clears the session mid-test and every subsequent assertion fails. Use it on the *first* navigation of a test that manages its own login, not after a fixture has run.

### Selectors (§7)

The app provides stable testids following `<page>-<element>-<role>`, with field errors as `<fieldId>-error`. It is also semantically marked up, so role- and label-based locators work.

Preference order for this project: `getByRole()` → `getByLabel()` → `getByTestId()`. Testids are a deliberate contract here, so using them is correct where no accessible name is available.

Verify any locator against `test-map.json` before use.

### Seeded data (§12)

20 products, ids `p-01`–`p-20`, fixed timestamps. Dashboard totals: 20 total, 15 active, 6 low stock. Page size 10, so exactly 2 pages.

These values appear as expected results in several cases. Use them exactly as written; do not recompute them.

### Timing caveats (§14)

Real behaviors that need accommodating without arbitrary sleeps:

- **Search is debounced ~300ms.** Assert on the changed result count, which auto-retries.
- **Report generation takes ~4s.** Allow an explicit longer timeout: `{ timeout: 15_000 }`.
- **Guard redirects are client-side.** `goto()` resolves before the redirect finishes — assert the destination *renders*, not just the URL.
- **The products table is name-sorted.** A renamed product moves, often to another page. TC-027 searches for the new name for this reason.
- **Do not use `networkidle`.** It can hang in Firefox on this app.

### Known non-automatable item (§20)

Drag-and-drop on `/ui-playground` uses the native HTML API, which Playwright's `dragTo()` does not reliably drive. No supplied case asserts a resulting order. If a future case does, add a `TODO` rather than a workaround.

### Output location and imports (§9)

```text
generated/
├── PageObjects/
│   └── <PageName>Page.ts
├── Tests/
│   └── <FeatureName>.spec.ts
└── Fixtures/   (only if e2e/fixtures.ts is genuinely insufficient)
```

`generated/Tests/` files import fixtures from `../../e2e/fixtures`. That cross-boundary dependency is intentional: §10 requires reusing existing framework components, and duplicating the auth fixture would violate it.

`playwright.config.ts` discovers both `e2e/**/*.spec.ts` and `generated/**/*.spec.ts`, so generated specs run with no configuration change.

### Verification (§17)

```bash
npx tsc --noEmit -p tsconfig.e2e.json    # type-check (covers generated/**)
npx playwright test --project=chromium   # run
```

`tsconfig.e2e.json` already includes `generated/**/*.ts`, so no TypeScript configuration changes are needed.
