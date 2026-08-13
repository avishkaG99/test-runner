# Reports

A single long-running operation with live progress and a cancel button. Exists so there is something that takes seconds rather than milliseconds, and something that can be interrupted partway.

**Route:** `/reports`
**Source:** [`src/features/reports/index.tsx`](../../src/features/reports/index.tsx)
**Related:** [Forms — slow submit](./forms.md#slow-submit) · [Testing guide](../testing-guide.md)

---

## The operation

Clicking `reports-generate-button` starts a ~4-second run that ticks progress every 100ms from 0 to 100.

Progress is exposed as a proper ARIA progressbar with `aria-valuenow`, `aria-valuemin`, and `aria-valuemax`, plus a text percentage in `reports-progress-value`.

## States

`reports-status` renders the current state as plain text, which makes it the simplest thing to assert on:

| State | Meaning | Visible controls |
|---|---|---|
| `idle` | Not started, or reset | Generate |
| `running` | In progress | Cancel |
| `done` | Completed | Generate, Reset |
| `cancelled` | Interrupted | Generate, Reset |

The Generate and Cancel buttons are mutually exclusive — only one is in the DOM at a time — so a test cannot click Generate while a run is active.

## Completion and cancellation

On completion, `reports-success` renders and a success toast fires. The run reaches 100%.

Cancelling mid-run stops the timer immediately, renders `reports-cancelled`, and leaves progress frozen wherever it stopped. That frozen value is worth asserting: it proves cancellation actually halted the work rather than just changing a label.

`reports-reset-button` returns to idle with progress back at 0.

## Testing notes

The 4-second duration exceeds Playwright's default 5-second expect timeout once other waits are added, so give completion assertions explicit headroom:

```ts
await page.getByTestId('reports-generate-button').click()
await expect(page.getByTestId('reports-success')).toBeVisible({ timeout: 15_000 })
```

To test cancellation without racing, assert the Cancel button is visible first — that confirms the run started — then click it.

The timer is cleared on unmount, so navigating away mid-run does not leave it firing.

## Testids

`reports-page`, `reports-status`, `reports-progressbar`, `reports-progress-value`, `reports-generate-button`, `reports-cancel-button`, `reports-reset-button`, `reports-success`, `reports-cancelled`
