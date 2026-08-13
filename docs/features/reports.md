# Frontend Feature Specification — Reports

**Purpose:** Provide one operation that takes seconds rather than milliseconds and can be interrupted partway, so progress and cancellation are testable.

**Owner / driver:** Test-target maintainers

**Status:** Approved

**Related:** [Test plan TC-014](../test-plan.md) · [Forms — slow submit](./forms.md) · [Testing guide](../testing-guide.md) · [`src/features/reports/index.tsx`](../../src/features/reports/index.tsx)

**Version / last updated:** 1.0, 2026-08-13

---

## 1. Requirement

### 1.1 Summary
- A ~4-second generation task with a live progress bar and a working cancel.
- Everything else in the app resolves quickly; this is the only place a test must wait, and the only place it can interrupt.

### 1.2 Scope
- **In scope**
  - Progress advancing 0 → 100 over roughly four seconds
  - Cancel that genuinely halts the run and freezes progress
  - Reset returning to idle
  - A textual status readable by tests
  - Mutually exclusive Generate and Cancel controls
- **Out of scope**
  - Producing a real downloadable file
  - Queuing, concurrency, or resuming a cancelled run
  - Server-side generation — the timer is client-side
- **Assumptions**
  - Four seconds exceeds Playwright's default 5s expect timeout once other waits stack, so tests need explicit headroom

---

## 2. Backend API references (integration only)

None. The operation is simulated with a client-side interval, deliberately: it keeps the timing deterministic and independent of mock latency settings.

---

## 3. Current frontend behavior

### 3.1 Implemented now
- `src/features/reports/index.tsx` — timer, progress bar, four states, cleanup on unmount

### 3.2 Gaps / TODO in current code
- No artifact is produced; "done" is a state, not a file
- Cancel does not abort a network request because there is none
- Duration is fixed at 4s and not configurable from the UI

---

## 4. Screen flow and interactions

### 4.1 Load flow
- **Step 1:** Guard resolves; screen mounts from `@/features/reports`
- **Step 2:** No queries; status starts `idle`, progress `0`
- **Step 3:** Only **Generate report** is shown
- **Loading state:** The run *is* the loading state — progress bar plus Cancel
- **Empty state:** Not applicable

### 4.2 Submit flow
- **Action:** Start a 100ms interval advancing progress by a fixed step
- **Client validation:** None
- **Success UX:** Status `done`, `reports-success` renders, success toast fires, progress reaches 100
- **Failure UX:** Cancelling sets status `cancelled` and renders `reports-cancelled`; progress freezes where it stopped
- **Retry/idempotency:** Reset then Generate starts cleanly from 0; the interval is cleared on unmount so navigating away leaves nothing running

---

## 5. Frontend data model mapping

No API mapping. Local state only:

| UI element | State | Type | Notes |
|---|---|---|---|
| Status text | `status` | enum | `idle` \| `running` \| `done` \| `cancelled` |
| Progress bar | `progress` | number | 0–100; ARIA `aria-valuenow` |
| Interval handle | `timerRef` | ref | Cleared on cancel, completion, and unmount |

---

## 6. Testing and quality

- **Unit tests:** Progress step arithmetic; timer cleared on unmount
- **Integration tests:** [`e2e/smoke.spec.ts`](../../e2e/smoke.spec.ts) — cancel mid-run, then a full run to completion
- **Manual/agent plan:** [TC-014](../test-plan.md)
- **Not required in this feature:** Real report generation or file download

---

## 7. Specs to apply

- `React-Specs/ui-ux/error-handling-user-feedback-spec.md`
- `React-Specs/quality-ops/testing-strategy-spec.md`

---

## 8. Delivery checklist

- [x] Feature spec linked to work item/PR
- [x] UI behavior implemented according to this spec
- [x] Progress and cancellation verified
- [x] Integration tests cover this scope
- [x] `npm run lint`, typecheck, and build pass
- [x] No secrets committed

---

## Appendix — Test surface

**Testids:** `reports-page`, `reports-status`, `reports-progressbar`, `reports-progress-value`, `reports-generate-button`, `reports-cancel-button`, `reports-reset-button`, `reports-success`, `reports-cancelled`

**States and visible controls**

| Status | Controls shown |
|---|---|
| `idle` | Generate |
| `running` | Cancel |
| `done` | Generate, Reset |
| `cancelled` | Generate, Reset |

**Timing:** Allow at least 15 seconds when asserting completion:

```ts
await expect(page.getByTestId('reports-success')).toBeVisible({ timeout: 15_000 })
```
