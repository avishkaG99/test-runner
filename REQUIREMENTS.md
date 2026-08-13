# Requirements Document — Playwright Test Target App

## 1. Overview

### 1.1 Purpose
Build a React web application that serves as a **test target** for automated end-to-end testing with **Playwright**, where an **AI agent** designs and executes the tests. The app must be rich enough to exercise a wide range of real-world UI patterns (auth, forms, tables, dialogs, async flows) while remaining deterministic and easy to automate.

### 1.2 Goals
- Provide a realistic but self-contained app the AI agent can explore, understand, and test.
- Cover the most common UI/UX patterns found in production apps so generated tests are transferable.
- Be deterministic: same inputs always produce the same outputs (no real external dependencies).
- Be automation-friendly: stable selectors, accessible markup, clear state transitions.

### 1.3 Non-Goals
- Not a production app — no real users, no real data, no payment processing.
- **No real backend.** All API behavior is mocked in the browser (MSW) so tests run fully offline and every run starts from the same seed state.
- No SSR/SEO concerns — this is a client-side SPA by design (see §2.1).

---

## 2. Tech Stack

### 2.1 Why SPA (Vite) and not Next.js
Since there is no backend, Next.js's main strengths (SSR/SSG, SEO, API routes) buy us nothing here, and server components / hydration add complexity and timing subtleties that work *against* a deterministic test target. A Vite SPA keeps all state client-side and inspectable, and MSW gives us a fully deterministic mock API with simulated latency and error injection.

### 2.2 Chosen stack

| Area | Choice | Notes |
|---|---|---|
| Build/dev | **Vite** + React 18+ + **TypeScript (strict)** | Fast dev server, simple Playwright `webServer` config |
| Routing | **TanStack Router** (`@tanstack/react-router`) | **File-based routes** under `src/routes/` with generated route tree |
| Data fetching | **TanStack Query** | Query/mutation hooks in `src/hooks/api/` wrapping service modules |
| Mock API | **MSW (Mock Service Worker)** | Deterministic in-browser API: seeded data, configurable latency, forced errors |
| HTTP client | Axios (shared instance in `lib/`) | Service modules are plain async functions, Axios-only |
| UI components | **shadcn/ui** + Tailwind CSS | Primitives under `components/ui/` |
| State | React state/context; Zustand only if needed | Keep state simple and inspectable |
| Persistence | localStorage / sessionStorage | Auth token, user preferences |
| Testing | **Playwright** (`@playwright/test`) | Chromium, Firefox, WebKit |

---

## 3. Folder Structure & Layering

Follows the team folder-structure/layering spec (Vite + React SPA, TanStack Router file-based routes).

### 3.1 Top-level `src/` layout

| Folder | Role |
|--------|------|
| `routes/` | **TanStack Router file-route tree:** `__root.tsx`, layout segments (`route.tsx`), leaf `index.tsx` files. **Thin:** `createFileRoute`, search validation, loaders, redirects — **not** heavy UI. |
| `features/<area>/` | **Feature modules:** screens, domain UI, forms, tables, local components, optional `data/` (schemas, mocks, feature helpers). |
| `components/` | **Shared UI** used across features: `ui/` (shadcn primitives), `layout/` (e.g. `authenticated-layout.tsx`). |
| `hooks/` | Reusable hooks; `hooks/api/` holds TanStack Query hooks (`useQuery`/`useMutation`) wrapping `lib/api/services/`, grouped by domain (e.g. `products.ts`, `auth.ts`). |
| `contexts/` | App-wide / cross-cutting React context (e.g. auth context). |
| `lib/` | Shared utilities, auth helpers, Axios client setup, config. No feature-specific UI. |
| `lib/api/services/` | **API service modules:** plain async functions per domain calling the shared Axios client. No React hooks here. |
| `mocks/` | **MSW handlers, seed data, and reset logic** (this app's "backend"). |
| `types/` | Shared TypeScript types for DTOs and app models. |
| `enums/` | Shared enums and string unions. |

### 3.2 Route tree layers

| Layer | Location | Responsibility |
|--------|----------|----------------|
| Root | `src/routes/__root.tsx` | Global shell: toaster, error boundary, root `<Outlet />` |
| Layout routes | e.g. `src/routes/_authenticated/route.tsx` | App chrome (sidebar, header), **auth guard** (`beforeLoad`), `<Outlet />` |
| Leaf routes | e.g. `src/routes/_authenticated/products/index.tsx` | One URL → one screen, imported from `@/features/...` |

### 3.3 Route naming conventions

| Under `src/routes/` | Use |
|---------------------|-----|
| `(auth)/` | Public auth screens (sign-in, sign-up, forgot-password) — route group |
| `(errors)/` | Public error pages (404, 500) |
| `_authenticated/` | Protected app: pathless layout segment carrying the auth guard; every child inherits it |
| `__root.tsx` | App root layout |

### 3.4 Rules (contract)

- **One leaf route → one primary feature export.** Route file = address + doorbell; feature file = the actual room.
- Imports point inward: `routes/ → features/ → components/` (+ `hooks`, `lib`, `types`). **`features/` must not import from `routes/`.**
- `types/` and `enums/` import nothing application-specific (no React, no store).
- `lib/` must not import from `components/`, `features/`, or route files.
- Query hooks' `queryFn`/`mutationFn` call service module functions — never raw `fetch`/one-off Axios.
- Use the `@/` path alias instead of deep relative imports.
- Auth checks live on the `/_authenticated` layout's `beforeLoad` — declared once, inherited by all children.
- Keep the generated route tree (`routeTree.gen.ts`) in sync via the TanStack Router Vite plugin.

---

## 4. Functional Requirements

### 4.1 Authentication (FR-AUTH)
- **FR-AUTH-1** Login page (`(auth)/sign-in`) with email + password fields, submit button, "remember me" checkbox.
- **FR-AUTH-2** Seeded test accounts (documented in README):
  - `admin@test.com / Admin123!` — admin role
  - `user@test.com / User123!` — standard role
  - `locked@test.com / Locked123!` — locked account, always rejected with a specific message
- **FR-AUTH-3** Validation: required fields, email format, min password length; inline errors tied to fields via `aria-describedby`.
- **FR-AUTH-4** Wrong credentials show a non-field error banner ("Invalid email or password").
- **FR-AUTH-5** Successful login stores a token and redirects to `/dashboard` (or the originally requested URL).
- **FR-AUTH-6** `_authenticated` guard redirects unauthenticated users to sign-in, preserving the intended destination.
- **FR-AUTH-7** Logout clears session and returns to sign-in.
- **FR-AUTH-8** Session-expiry simulation: a "force session expiry" control so agents can test expiry handling.
- **FR-AUTH-9** Sign-up page with password confirmation and password-strength indicator (mock success).
- **FR-AUTH-10** Forgot-password flow (mocked — success confirmation screen).

### 4.2 Dashboard (FR-DASH)
- **FR-DASH-1** Post-login landing page with summary stat cards.
- **FR-DASH-2** Data loads asynchronously with visible loading state (skeletons) — content must not appear instantly, so the agent must handle waiting.
- **FR-DASH-3** Role-based UI: admin sees an extra "Admin" nav item and panel a standard user does not.

### 4.3 Forms Showcase (FR-FORM)
A `features/forms` area exercising every common input type:
- **FR-FORM-1** Text inputs, textarea, number input with min/max.
- **FR-FORM-2** Native select **and** custom combobox with search/autocomplete.
- **FR-FORM-3** Checkboxes (single + group), radio groups, toggle switch.
- **FR-FORM-4** Date picker and date-range picker.
- **FR-FORM-5** File upload (single + multiple, type validation, upload progress state).
- **FR-FORM-6** Slider/range input.
- **FR-FORM-7** Multi-step wizard (3+ steps): back/next, per-step validation, review step before submit.
- **FR-FORM-8** Client-side validation: required, pattern, cross-field (end date ≥ start date), shown on blur and on submit.
- **FR-FORM-9** Submit shows a success toast **and** the submitted data is rendered somewhere assertable.
- **FR-FORM-10** "Slow submit" variant: disabled button + spinner during submission.
- **FR-FORM-11** Server-error trigger: a magic input value (e.g. email containing `fail`) makes MSW return 500, for error-handling tests.

### 4.4 Data Management / CRUD (FR-CRUD)
- **FR-CRUD-1** A "Products" page with a data table: sortable columns, text search, category filter, pagination.
- **FR-CRUD-2** Create item via modal or dedicated page.
- **FR-CRUD-3** Edit item.
- **FR-CRUD-4** Delete with confirmation dialog (Cancel must actually cancel).
- **FR-CRUD-5** Bulk selection with select-all and bulk delete.
- **FR-CRUD-6** Empty state when no items match filters.
- **FR-CRUD-7** Table reflects mutations without a manual page reload (TanStack Query invalidation).

### 4.5 UI Patterns & Interactions (FR-UI)
- **FR-UI-1** Modal dialogs with focus trap and Escape-to-close.
- **FR-UI-2** Toasts (success/error/info) that auto-dismiss and can be dismissed manually.
- **FR-UI-3** Tabs, accordion, tooltip.
- **FR-UI-4** Drag-and-drop (reorder a list or simple kanban).
- **FR-UI-5** Dropdown/nested navigation menus.
- **FR-UI-6** An iframe-embedded widget on at least one page (frame handling).
- **FR-UI-7** A page opening content in a new tab (popup handling).
- **FR-UI-8** Keyboard navigation works throughout (Tab order, Enter/Space activation).
- **FR-UI-9** Infinite scroll or "load more" list on at least one page.
- **FR-UI-10** Settings page with persisted preferences (theme toggle in localStorage).

### 4.6 Async & Network Behavior (FR-ASYNC)
- **FR-ASYNC-1** MSW applies configurable artificial delay (default ~300–800 ms).
- **FR-ASYNC-2** Optional "flaky mode" toggle (off by default): some requests randomly fail with retry available — for deliberately testing retry/error UIs.
- **FR-ASYNC-3** Explicit loading, success, error, and empty states for every data-driven view.
- **FR-ASYNC-4** A long-running operation ("Generate report", ~3–5 s) with progress and a cancel button.

### 4.7 Error Handling (FR-ERR)
- **FR-ERR-1** Custom 404 page (`(errors)/404`) for unknown routes with a link home.
- **FR-ERR-2** Error boundary state (a hidden "trigger error" control may exist for testing).
- **FR-ERR-3** All error messages are user-readable and rendered in the DOM (not console-only).

---

## 5. Route Map (TanStack Router file tree)

```text
src/routes/
  __root.tsx
  (auth)/
    sign-in.tsx                → /sign-in            public
    sign-up.tsx                → /sign-up            public
    forgot-password.tsx        → /forgot-password    public
  (errors)/
    404.tsx                                          public
  _authenticated/
    route.tsx                  # app shell + auth guard (beforeLoad)
    dashboard/index.tsx        → /dashboard
    products/index.tsx         → /products
    products/new.tsx           → /products/new
    products/$productId/edit.tsx → /products/:id/edit
    forms/index.tsx            → /forms
    forms/wizard.tsx           → /forms/wizard
    ui-playground/index.tsx    → /ui-playground      (modals, DnD, iframe, popups)
    reports/index.tsx          → /reports            (long-running op)
    settings/
      route.tsx                # nested layout (tabs)
      index.tsx                → /settings
      appearance.tsx           → /settings/appearance
    admin/index.tsx            → /admin              admin role only
```

Each leaf route imports its screen from the matching `src/features/<area>/` module.

---

## 6. Testability Requirements (critical for the AI agent)

- **TR-1 Stable selectors:** every interactive element and key content region has a `data-testid` with a consistent convention: `<page>-<element>-<role>` (e.g. `sign-in-email-input`, `products-table-row-3`, `wizard-next-button`).
- **TR-2 Accessible markup:** semantic HTML, labeled inputs, ARIA roles/names on custom widgets — so `getByRole`/`getByLabel` locators work everywhere.
- **TR-3 Deterministic data:** MSW seeds the same dataset on every fresh load; a **"Reset app data"** control and/or `?reset=true` URL param restores seed state so tests are independent.
- **TR-4 No hard waits needed:** every async transition has a DOM-observable signal (loading indicator, disabled button, toast, URL change).
- **TR-5 Deterministic time:** avoid wall-clock-dependent logic, or make it injectable.
- **TR-6 Unique page titles** and stable, deep-linkable URLs per route.
- **TR-7 No CAPTCHA, no rate limiting, no third-party auth** — nothing that blocks automation.
- **TR-8 Console cleanliness:** no uncaught errors/warnings during normal flows.
- **TR-9 State inspectability (optional):** a lightweight `window.__APP_STATE__` hook in dev/test builds for agent debugging.
- **TR-10 Documented test surface:** README lists all routes, test accounts, seed data, testid convention, and special triggers (`fail` email, flaky mode, reset).

---

## 7. Non-Functional Requirements

- **NFR-1** Runs with a single command (`npm run dev`); production build via `npm run build` + `npm run preview`.
- **NFR-2** Fixed, documented port (5173) for Playwright `webServer` config.
- **NFR-3** Works in Chromium, Firefox, and WebKit.
- **NFR-4** Responsive at mobile (375px), tablet (768px), desktop (1280px) — enables viewport testing.
- **NFR-5** Fast locally (< 2 s initial load) apart from intentional simulated delays.
- **NFR-6** **No external network calls at runtime** (fonts/assets bundled) — tests run fully offline.
- **NFR-7** TypeScript strict mode; ESLint + Prettier configured; generated `routeTree.gen.ts` committed or regenerated on dev/build.

---

## 8. Playwright / Agent Integration

- **PW-1** `playwright.config.ts` with `webServer` so `npx playwright test` boots the app automatically.
- **PW-2** Projects for chromium, firefox, webkit; trace + screenshot on failure.
- **PW-3** Baseline example specs (login happy path, one CRUD flow) as reference style for the agent.
- **PW-4** Reusable auth fixture (login via UI or `storageState`) documented for the agent to build on.
- **PW-5** A machine-readable **test map** (`test-map.json` or README section) enumerating pages, key testids, and expected behaviors — the agent's primary planning source.
- **PW-6** CI-ready: non-zero exit on failure; HTML report generated.

---

## 9. Acceptance Criteria (definition of done)

1. All routes in §5 exist and render without console errors.
2. All three seeded accounts behave as specified (admin, user, locked).
3. Every FR item has at least one DOM-observable success and failure path.
4. Every interactive element is reachable via `getByRole`/`getByLabel` or `data-testid`.
5. "Reset app data" returns the app to the exact seed state.
6. Baseline Playwright specs pass on all three browsers.
7. Folder/layering rules in §3 hold (thin routes, features not importing routes, services Axios-only, query hooks in `hooks/api/`).
8. README documents accounts, routes, testid convention, special triggers, and reset mechanism.

---

## 10. Suggested Phasing

| Phase | Scope |
|---|---|
| **1 — Core** | Vite + TS + TanStack Router scaffold, folder structure, MSW setup, auth (sign-in/guard/logout), dashboard, seed data + reset |
| **2 — Forms** | Forms showcase + wizard + validation + slow/error variants |
| **3 — CRUD** | Products table, create/edit/delete, filters, pagination, bulk actions |
| **4 — Advanced** | UI playground (modals, DnD, iframe, popups), async/flaky modes, reports, settings |
| **5 — Test infra** | Playwright config, fixtures, baseline specs, test map, docs |
