# Registration wizard

A four-step form where each step must validate before the next unlocks, ending in a review of everything collected. Tests a flow rather than a single screen: state has to survive navigation between steps.

**Route:** `/forms/wizard`
**Source:** [`src/features/forms/wizard.tsx`](../../src/features/forms/wizard.tsx)
**Related:** [Forms showcase](./forms.md) · [Mock API — failure triggers](../mock-api.md#failure-triggers)

---

## The steps

| # | Step | Fields | Rules |
|---|---|---|---|
| 1 | Your details | First name, last name, email | All required; email must be well-formed |
| 2 | Company | Company, team size | Both required; team size is a select |
| 3 | Address | Street, city, postcode | All required; postcode is 3–10 chars of letters, digits, spaces, hyphens |
| 4 | Review | — | Read-only summary of steps 1–3 |

## Navigation

`wizard-next-button` validates the **current step only**. If it fails, errors render and the step does not advance, plus an error toast fires. This is the core behavior to test: an agent that fills only some fields and clicks Next should stay put.

`wizard-back-button` is disabled on step 1 and clears validation errors when moving back. Values entered are preserved, so going back and forward again should not lose data — worth an explicit assertion.

Progress is exposed three ways:

- `wizard-step-number` — the current number as text ("1" through "4")
- `wizard-step-indicator-<0..3>` — one chip per step, with `aria-current="step"` on the active one
- Completed steps render a check icon

## Review step

Every collected value is listed as `wizard-review-<field>`, e.g. `wizard-review-email`, `wizard-review-postcode`. Empty values render as an em dash, though reaching review with an empty field should be impossible given per-step validation — if a test manages it, that is a genuine bug.

This step is the natural place to assert that data survived the whole flow:

```ts
await expect(page.getByTestId('wizard-review-email')).toHaveText('ada@test.com')
```

## Submission

`wizard-submit-button` appears only on the review step. On success the entire wizard is replaced by `wizard-complete`, which greets the user by first name — another round-trip assertion.

From there, `wizard-restart-button` resets to an empty step 1, and `wizard-back-to-forms-link` returns to the [forms showcase](./forms.md).

Failures render in `wizard-error`. The submission goes through the same endpoint as the forms showcase, so the `fail` email trigger applies here too.

## Testids

`wizard-page`, `wizard-steps`, `wizard-step-number`, `wizard-step-indicator-0..3`, `wizard-step-0..2`, `wizard-first-name-input`, `wizard-last-name-input`, `wizard-email-input`, `wizard-company-input`, `wizard-team-size-select`, `wizard-street-input`, `wizard-city-input`, `wizard-postcode-input`, `wizard-review`, `wizard-review-<field>`, `wizard-back-button`, `wizard-next-button`, `wizard-submit-button`, `wizard-error`, `wizard-complete`, `wizard-restart-button`, `wizard-back-to-forms-link`

Field errors follow the usual `<fieldId>-error` convention, e.g. `wizard-first-name-error`.
