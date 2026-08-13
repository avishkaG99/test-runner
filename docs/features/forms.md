# Forms showcase

Every common input type on one page, wired to real validation. The point is coverage: if the agent can drive this screen, it can drive most forms it will meet elsewhere.

**Route:** `/forms`
**Source:** [`src/features/forms/index.tsx`](../../src/features/forms/index.tsx)
**Related:** [Wizard](./wizard.md) · [Mock API — failure triggers](../mock-api.md#failure-triggers) · [Products — create form](./products.md#create)

---

## Inputs covered

| Group | Controls | Testids |
|---|---|---|
| Text | text, email, number (min 1 / max 99), textarea | `forms-fullname-input`, `forms-email-input`, `forms-quantity-input`, `forms-bio-textarea` |
| Selection | native select, custom combobox, checkbox group, radio group, switch | `forms-plan-select`, `forms-country-input`, `forms-interest-*`, `forms-contact-*`, `forms-notifications-switch` |
| Dates, range, files | two date inputs, range slider, multi-file upload | `forms-start-date-input`, `forms-end-date-input`, `forms-satisfaction-slider`, `forms-files-input` |

## The custom combobox

The country field is not a `<select>` — it is a custom widget built on the ARIA combobox pattern, because that is what real design systems ship and what naive tests fall over on.

It supports:

- Typing to filter options
- `ArrowDown` / `ArrowUp` to move the active option
- `Enter` to commit, `Escape` to close
- Clicking an option
- Clicking outside to dismiss

The input carries `role="combobox"`, `aria-expanded`, and `aria-controls`; the list is `role="listbox"` with `role="option"` children. So `getByRole('combobox')` works, and so does `getByTestId('forms-country-option-lk')`.

An empty result renders `forms-country-empty` rather than an empty list.

## Validation

Runs on blur and again on submit. Required: full name, email, quantity, plan, country, at least one interest, both dates.

The interesting rule is **cross-field**: the end date must be on or after the start date. A single-field validator cannot express this, so it is a good test of whether the agent understands the form as a whole rather than field by field.

```ts
await page.getByTestId('forms-start-date-input').fill('2026-05-01')
await page.getByTestId('forms-end-date-input').fill('2026-04-01')
await page.getByTestId('forms-end-date-input').blur()
await expect(page.getByTestId('forms-end-date-error')).toBeVisible()
```

Failing submit also fires an error toast, so there are two independent signals.

## Submission

On success the payload is echoed back and rendered as JSON in `forms-submitted-json`, alongside a success toast and the `forms-success` container. Asserting on the echoed JSON proves the round trip carried the right values — stronger than just checking a toast appeared.

Uploaded files appear in the payload as filenames, and in the UI as `forms-file-list` with one `forms-file-<name>` entry each.

### Slow submit

`forms-slow-mode-checkbox` adds a 2.5-second delay before the request. During it the submit button is disabled with a spinner and `aria-busy`. Use this to test that the agent waits for completion rather than asserting immediately.

### Forced server error

An email containing `fail` returns HTTP 500 and renders `forms-error`. See [failure triggers](../mock-api.md#failure-triggers) for the full list.

## Reset

`forms-reset-button` clears every field, all errors, and any previous submission back to initial state — without a page reload. Useful for running several scenarios in one test.

## Testids

Full list in [test-map.json](../../test-map.json) under `/forms`. Field errors follow `<fieldId>-error`, e.g. `forms-email-error`.
