# Frontend Feature Specification — UI playground

**Purpose:** Collect the interaction patterns that most often break automated tests — focus traps, frames, popups, drag-and-drop, lazy lists — into one screen where each can be exercised in isolation.

**Owner / driver:** Test-target maintainers

**Status:** Approved

**Related:** [Test plan TC-014b, TC-014c](../test-plan.md) · [Products — dialogs](./products.md) · [Testing guide](../testing-guide.md) · [`src/features/ui-playground/index.tsx`](../../src/features/ui-playground/index.tsx)

**Version / last updated:** 1.0, 2026-08-13

---

## 1. Requirement

### 1.1 Summary
- Seven independent components, each in its own card, chosen because naive tests fail on them.
- Nothing here is business functionality; the value is entirely in the interaction surface.

### 1.2 Scope
- **In scope**
  - Tabs with arrow-key navigation, accordion, tooltip on hover *and* focus
  - Dialog with focus trap, Escape, and backdrop dismissal
  - Drag-and-drop reordering with the order mirrored to a readable element
  - An embedded iframe with interactive content
  - A link opening a new tab
  - Infinite scroll via `IntersectionObserver` plus a Load more fallback
  - Success, error, and info toasts
- **Out of scope**
  - Persisting any of this state — everything resets on reload
  - Multi-container drag-and-drop (a kanban board)
  - Virtualised lists
- **Assumptions**
  - The iframe must not be routed through the mock layer; see §3.2

---

## 2. Backend API references (integration only)

None. Every component is client-only, which is deliberate: it isolates interaction behavior from network behavior.

---

## 3. Current frontend behavior

### 3.1 Implemented now
- `src/features/ui-playground/index.tsx` — all seven components
- `src/components/ui/dialog.tsx` — the shared dialog primitive, also used by [Products](./products.md)
- `public/popup.html` — the new-tab target

### 3.2 Gaps / TODO in current code
- The iframe loads from a **blob URL**, not an HTTP path. Serving it over HTTP routed it through the MSW interceptor layer; tearing the frame down during navigation then produced `InvalidStateError` storms in Firefox that left the *next* page blank. The blob URL keeps it off the network entirely.
- The blob URL is intentionally not revoked on unmount — Firefox tears frames down asynchronously, and revoking immediately races that teardown.
- Drag-and-drop uses the native HTML API, which `dragTo()` handles in Chromium but may need manual mouse steps elsewhere.

---

## 4. Screen flow and interactions

### 4.1 Load flow
- **Step 1:** Guard resolves; screen mounts from `@/features/ui-playground`
- **Step 2:** No queries; all state is local
- **Step 3:** Tabs default to Overview, accordion to the first item, list to 20 rows
- **Loading state:** Only within infinite scroll (`infinite-loading`, ~400ms per batch)
- **Empty state:** Not applicable

### 4.2 Submit flow
No mutations. Interactions are local state changes:

- **Dialog:** Confirm/Cancel writes the outcome to `dialog-result` so a test can prove which button ran
- **Drag-and-drop:** Reorders the array; `dnd-order` exposes the result as a comma-separated string
- **Infinite scroll:** Grows 20 → 100 in steps of 20; the Load more button disappears at 100
- **Failure UX:** None — no operation here can fail

---

## 5. Frontend data model mapping

No API mapping. Local state only:

| UI element | State | Type | Notes |
|---|---|---|---|
| Active tab | `active` | string | Tab id |
| Open accordion item | `open` | string \| null | `null` when all collapsed |
| Tooltip visibility | `showTip` | boolean | Hover and focus |
| Dialog open / result | `open`, `confirmed` | boolean, string \| null | Result mirrored to the DOM |
| Task order | `tasks` | array | Mirrored to `dnd-order` |
| Row count | `count` | number | 20 → 100 |

---

## 6. Testing and quality

- **Unit tests:** Focus-trap wrap-around in `dialog.tsx`; the reorder helper
- **Integration tests:** [`e2e/smoke.spec.ts`](../../e2e/smoke.spec.ts) — tabs, accordion, Escape-to-close, iframe interaction, and popup capture
- **Manual/agent plan:** [TC-014b, TC-014c](../test-plan.md)
- **Not required in this feature:** Visual regression or animation timing

---

## 7. Specs to apply

- `React-Specs/ui-ux/error-handling-user-feedback-spec.md`
- `React-Specs/quality-ops/testing-strategy-spec.md`

---

## 8. Delivery checklist

- [x] Feature spec linked to work item/PR
- [x] UI behavior implemented according to this spec
- [x] Keyboard and ARIA behavior verified
- [x] Integration tests cover this scope
- [x] `npm run lint`, typecheck, and build pass
- [x] No secrets committed

---

## Appendix — Test surface

**Tabs:** `tab-overview|activity|settings`, `tabpanel-…`. ARIA tab pattern; ArrowLeft/ArrowRight cycle; inactive panels use `hidden`.

**Accordion:** `accordion-trigger-what|how|why`, `accordion-panel-…`. Collapsed panels are removed from the DOM.

**Tooltip:** `tooltip-trigger`, `tooltip-content`. `role="tooltip"`, appears on hover **and** focus.

**Toasts:** `toast-success-button`, `toast-error-button`, `toast-info-button`. Auto-dismiss.

**Dialog:** `dialog-open-button`, `demo-dialog`, `demo-dialog-confirm|cancel|close-button`, `demo-dialog-backdrop`, `dialog-result`.

**Drag-and-drop:** `dnd-list`, `dnd-item-t-1..t-4`, `dnd-order`. Each item carries `data-position`.

**Iframe:** `demo-iframe`; inside: `iframe-heading`, `iframe-button`, `iframe-output`. Use `frameLocator()`.

**Popup:** `popup-link` → `/popup.html` with `popup-heading`, `popup-message`, `popup-close-button`. Capture with `waitForEvent('popup')`.

**Infinite scroll:** `infinite-list`, `infinite-count`, `infinite-item-<n>`, `infinite-sentinel`, `infinite-loading`, `infinite-load-more`.
