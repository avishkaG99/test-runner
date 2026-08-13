# Frontend Feature Specification — Registration wizard

**Purpose:** Collect registration details across four steps, gating progress on each step validating and confirming everything before submission.

**Owner / driver:** Test-target maintainers

**Status:** Approved

**Related:** [Test plan TC-013](../test-plan.md) · [Forms showcase](./forms.md) · [`src/features/forms/wizard.tsx`](../../src/features/forms/wizard.tsx)

**Version / last updated:** 1.0, 2026-08-13

---

## 1. Requirement

### 1.1 Summary
- A multi-step flow rather than a single screen: state must survive navigation between steps and be reviewable before it is sent.
- Tests whether an agent can handle progressive disclosure — filling only part of a form should not advance it.

### 1.2 Scope
- **In scope**
  - Four steps: details, company, address, review
  - Per-step validation blocking **Next**
  - Back preserving entered values
  - A review step listing every collected value
  - Completion screen with restart
- **Out of scope**
  - Saving partial progress across a page reload — state is in memory
  - Skipping ahead by clicking step indicators
  - Server-side duplicate detection
- **Assumptions**
  - Reaching the review step with an empty required field should be impossible

---

## 2. Backend API references (integration only)

| Purpose | Method | Endpoint | Request | Response | Notes |
|---|---|---|---|---|---|
| Submit registration | `POST` | `/api/forms/submit` | Wizard values + `source: 'wizard'` | `{ ok, received }` | Shares the endpoint with [Forms](./forms.md); same `fail` trigger |

---

## 3. Current frontend behavior

### 3.1 Implemented now
- `src/features/forms/wizard.tsx` — steps, validation, review, completion
- Step indicators expose `aria-current="step"`; completed steps show a check icon

### 3.2 Gaps / TODO in current code
- Progress is not persisted; a reload restarts at step 1
- Indicators are not clickable, so steps can only be reached in order
- Postcode validation is a generic pattern, not country-specific

---

## 4. Screen flow and interactions

### 4.1 Load flow
- **Step 1:** Guard resolves; screen mounts from `@/features/forms/wizard`
- **Step 2:** No queries; state initialises from a local constant
- **Step 3:** Step 0 renders; `wizard-step-number` reads `1`
- **Loading state:** None until submission
- **Empty state:** Not applicable

### 4.2 Submit flow
- **Action:** On review, `submitShowcaseForm({ ...values, source: 'wizard' })`
- **Client validation:** `validateStep(step, values)` runs on **Next**, scoped to the current step only
- **Success UX:** The wizard is replaced by `wizard-complete`, greeting the user by first name
- **Failure UX:** Validation errors render per field plus an error toast; server failures render `wizard-error`
- **Retry/idempotency:** Submitting twice creates nothing; the endpoint only echoes

---

## 5. Frontend data model mapping

| UI field | Form path | API field | Type | Required | Rules |
|---|---|---|---|---|---|
| First name | `firstName` | `firstName` | string | Y | Non-empty (step 1) |
| Last name | `lastName` | `lastName` | string | Y | Non-empty (step 1) |
| Email | `email` | `email` | string | Y | Valid format (step 1) |
| Company | `company` | `company` | string | Y | Non-empty (step 2) |
| Team size | `teamSize` | `teamSize` | enum | Y | `1-10` \| `11-50` \| `51-200` \| `200+` |
| Street | `street` | `street` | string | Y | Non-empty (step 3) |
| City | `city` | `city` | string | Y | Non-empty (step 3) |
| Postcode | `postcode` | `postcode` | string | Y | `^[A-Za-z0-9 -]{3,10}$` |

- **State ownership:** A single local `values` object spanning all steps
- **Transformations:** `source: 'wizard'` added on submit
- **Error mapping:** Per-field messages; server message → `wizard-error`

---

## 6. Testing and quality

- **Unit tests:** `validateStep()` per step index; postcode pattern
- **Integration tests:** [`e2e/smoke.spec.ts`](../../e2e/smoke.spec.ts) — blocked Next, all steps, review assertion, completion
- **Manual/agent plan:** [TC-013](../test-plan.md)
- **Not required in this feature:** Cross-browser date/locale handling — no dates are collected

---

## 7. Specs to apply

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

**Testids:** `wizard-page`, `wizard-steps`, `wizard-step-number`, `wizard-step-indicator-0..3`, `wizard-step-0..2`, `wizard-first-name-input`, `wizard-last-name-input`, `wizard-email-input`, `wizard-company-input`, `wizard-team-size-select`, `wizard-street-input`, `wizard-city-input`, `wizard-postcode-input`, `wizard-review`, `wizard-review-<field>`, `wizard-back-button`, `wizard-next-button`, `wizard-submit-button`, `wizard-error`, `wizard-complete`, `wizard-restart-button`, `wizard-back-to-forms-link`

Field errors follow `<fieldId>-error`, e.g. `wizard-first-name-error`. **Back** is disabled on step 1.
