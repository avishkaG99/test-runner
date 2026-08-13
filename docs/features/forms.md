# Frontend Feature Specification — Forms showcase

**Purpose:** Present every common input type on one screen with real validation, so any form pattern the agent will meet elsewhere is exercised here first.

**Owner / driver:** Test-target maintainers

**Status:** Approved

**Related:** [Test plan TC-011, TC-012, TC-012b](../test-plan.md) · [Wizard](./wizard.md) · [Mock API — failure triggers](../mock-api.md#failure-triggers) · [`src/features/forms/index.tsx`](../../src/features/forms/index.tsx)

**Version / last updated:** 1.0, 2026-08-13

---

## 1. Requirement

### 1.1 Summary
- Coverage, not realism: text, number, textarea, native select, custom combobox, checkbox group, radio group, switch, dates, range slider, and multi-file upload.
- Includes a cross-field rule and a forced server error, both of which single-field validation cannot catch.

### 1.2 Scope
- **In scope**
  - Every input type listed above, each individually addressable
  - Validation on blur and on submit, including a cross-field date rule
  - A slow-submit toggle producing a disabled button and spinner
  - Payload echoed back on success so the round trip is assertable
  - Reset returning the form to its initial state
- **Out of scope**
  - Real file storage — only filenames are submitted
  - Rich-text editing, drag-to-upload, image preview
  - Server-side validation beyond the `fail` trigger
- **Assumptions**
  - The combobox must be driven by keyboard as well as pointer

---

## 2. Backend API references (integration only)

| Purpose | Method | Endpoint | Request | Response | Notes |
|---|---|---|---|---|---|
| Submit | `POST` | `/api/forms/submit` | Arbitrary payload | `{ ok, received }` | 500 if `email` contains `fail`; echoes payload back |

---

## 3. Current frontend behavior

### 3.1 Implemented now
- `src/features/forms/index.tsx` — all inputs, validation, submit, reset
- `src/components/ui/combobox.tsx` — ARIA combobox with filter and keyboard control
- `src/lib/api/services/forms.ts` — submit service

### 3.2 Gaps / TODO in current code
- File contents are never read; only `File.name` is submitted
- Upload progress is a state, not a real byte-level progress bar
- Slow-submit is a client-side delay, not server latency

---

## 4. Screen flow and interactions

### 4.1 Load flow
- **Step 1:** Guard resolves; screen mounts from `@/features/forms`
- **Step 2:** No queries — the form initialises from a local constant
- **Step 3:** Country options come from a static list, not an API
- **Loading state:** None on load
- **Empty state:** Not applicable

### 4.2 Submit flow
- **Action:** `submitShowcaseForm(payload)` → `POST /api/forms/submit`
- **Client validation:** Required fields, email format, quantity 1–99, at least one interest, and end date ≥ start date
- **Success UX:** Success toast, `forms-success` block, and the echoed payload rendered as JSON
- **Failure UX:** Validation failure fires an error toast and blocks submission; a server 500 renders `forms-error`
- **Retry/idempotency:** Re-submitting is allowed; nothing is stored server-side

---

## 5. Frontend data model mapping

| UI field | Form path | API field | Type | Required | Rules |
|---|---|---|---|---|---|
| Full name | `fullName` | `fullName` | string | Y | Non-empty |
| Email | `email` | `email` | string | Y | Valid format; `fail` forces 500 |
| Quantity | `quantity` | `quantity` | number | Y | Integer 1–99; cast on submit |
| Bio | `bio` | `bio` | string | N | Free text |
| Plan | `plan` | `plan` | enum | Y | `free` \| `pro` \| `enterprise` |
| Country | `country` | `country` | string \| null | Y | Combobox; ISO-like code |
| Interests | `interests` | `interests` | string[] | Y | At least one |
| Contact method | `contactMethod` | `contactMethod` | enum | N | Defaults to `email` |
| Notifications | `notifications` | `notifications` | boolean | N | Switch, defaults on |
| Start / End date | `startDate`, `endDate` | same | ISO date | Y | End ≥ start |
| Satisfaction | `satisfaction` | `satisfaction` | number | N | 0–10 slider |
| Attachments | `files` | `files` | string[] | N | Mapped to filenames |

- **State ownership:** Local `useState`; nothing cached
- **Transformations:** Quantity string → number; `File[]` → `name[]`
- **Error mapping:** Field errors render as `<fieldId>-error`; server message → `forms-error`

---

## 6. Testing and quality

- **Unit tests:** `validate()` including the cross-field date rule; combobox filtering
- **Integration tests:** [`e2e/smoke.spec.ts`](../../e2e/smoke.spec.ts) — full submit with echo assertion, and the date rule
- **Manual/agent plan:** [TC-011, TC-012, TC-012b](../test-plan.md)
- **Not required in this feature:** Real upload throughput

---

## 7. Specs to apply

- `React-Specs/ui-ux/forms-validation-spec.md`
- `React-Specs/ui-ux/error-handling-user-feedback-spec.md`
- `React-Specs/data/data-fetching-api-client-spec.md`
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

**Testids:** `forms-page`, `showcase-form`, `forms-error`, `forms-success`, `forms-submitted-json`, `forms-fullname-input`, `forms-email-input`, `forms-quantity-input`, `forms-bio-textarea`, `forms-plan-select`, `forms-country-input`, `forms-country-listbox`, `forms-country-option-<code>`, `forms-country-empty`, `forms-interests-group`, `forms-interest-<name>`, `forms-interests-error`, `forms-contact-group`, `forms-contact-<method>`, `forms-notifications-switch`, `forms-start-date-input`, `forms-end-date-input`, `forms-satisfaction-slider`, `forms-files-input`, `forms-file-list`, `forms-slow-mode-checkbox`, `forms-submit-button`, `forms-reset-button`, `forms-wizard-link`

**Combobox:** `role="combobox"` with `aria-expanded`; options are `role="option"`. Supports typing, ArrowUp/ArrowDown, Enter, Escape, click, and click-outside.
