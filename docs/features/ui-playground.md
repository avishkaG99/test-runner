# UI playground

Seven interaction patterns on one page, each isolated in its own card. These are the things that break naive tests: focus traps, frames, popups, drag-and-drop, lazily-loaded lists.

**Route:** `/ui-playground`
**Source:** [`src/features/ui-playground/index.tsx`](../../src/features/ui-playground/index.tsx)
**Related:** [Products — dialogs](./products.md#dialogs) · [Testing guide](../testing-guide.md)

---

## Tabs

Three tabs following the ARIA tab pattern: `role="tablist"`, `role="tab"` with `aria-selected`, `role="tabpanel"` linked by `aria-controls` / `aria-labelledby`.

Only the active tab is in the tab order (`tabIndex=0`, others `-1`), and `ArrowLeft` / `ArrowRight` cycle between them — the keyboard behavior real tab widgets have and naive ones lack.

Inactive panels use the `hidden` attribute, so `toBeHidden()` works.

**Testids:** `tab-overview`, `tab-activity`, `tab-settings`, `tabpanel-overview`, `tabpanel-activity`, `tabpanel-settings`

## Accordion

Three collapsible items, one open at a time. Triggers expose `aria-expanded` and `aria-controls`; collapsed panels are removed from the DOM rather than hidden, so a test can assert on presence.

Clicking the open item closes it, leaving none open — a state some accordion implementations forbid.

**Testids:** `accordion-trigger-what|how|why`, `accordion-panel-what|how|why`

## Tooltip

Appears on **both** hover and keyboard focus, and disappears on blur — the accessibility requirement most tooltips get wrong. It carries `role="tooltip"` and is linked by `aria-describedby` only while visible.

**Testids:** `tooltip-trigger`, `tooltip-content`

## Toasts

Three buttons firing success, error, and info toasts (via Sonner). Toasts auto-dismiss and can be dismissed manually, so tests must either assert quickly or assert on a more durable signal.

**Testids:** `toast-success-button`, `toast-error-button`, `toast-info-button`

## Dialog

The same primitive used by every [products](./products.md#dialogs) dialog. Behaviors worth testing:

- Focus moves into the dialog on open, to the first focusable element
- `Tab` and `Shift+Tab` are trapped inside — tabbing past the last element wraps to the first
- `Escape` closes it
- Clicking the backdrop (but not the panel) closes it
- Focus returns to the trigger on close

`dialog-result` records whether the last interaction was `confirmed` or `cancelled`, so a test can prove which button ran rather than just that the dialog closed.

**Testids:** `dialog-open-button`, `demo-dialog`, `demo-dialog-confirm`, `demo-dialog-cancel`, `demo-dialog-close-button`, `demo-dialog-backdrop`, `dialog-result`

## Drag and drop

Four reorderable items using the native HTML drag-and-drop API. The current order is mirrored to `dnd-order` as a comma-separated string of ids, which is far easier to assert than reading DOM positions:

```ts
await expect(page.getByTestId('dnd-order')).toHaveText('t-2,t-1,t-3,t-4')
```

Each item also carries `data-position` with its index.

Native drag-and-drop is genuinely awkward to automate — `dragTo()` works in Chromium but can need manual mouse steps elsewhere. That difficulty is the point.

**Testids:** `dnd-list`, `dnd-item-t-1..t-4`, `dnd-order`

## Iframe

An embedded widget containing a heading, a button, and an output paragraph. Clicking the button inside writes text to the output — so a test must cross the frame boundary in both directions:

```ts
const frame = page.frameLocator('[data-testid="demo-iframe"]')
await frame.getByTestId('iframe-button').click()
await expect(frame.getByTestId('iframe-output')).toHaveText('clicked inside iframe')
```

> The frame loads from a **blob URL**, not an HTTP path. Serving it over HTTP routed it through the mock layer, and tearing the frame down during navigation produced `InvalidStateError` storms in Firefox that blanked the next page. See [Architecture — the mock backend](../architecture.md#the-mock-backend).

**Testids:** `demo-iframe`; inside the frame: `iframe-heading`, `iframe-button`, `iframe-output`

## Popup

`popup-link` opens `/popup.html` in a new tab, caught with `waitForEvent('popup')`:

```ts
const [popup] = await Promise.all([
  page.waitForEvent('popup'),
  page.getByTestId('popup-link').click(),
])
await expect(popup.getByTestId('popup-heading')).toBeVisible()
```

The popup has its own close button (`popup-close-button`).

## Infinite scroll

A scrollable list starting at 20 rows, growing by 20 up to 100. New rows load two ways: scrolling the sentinel into view (via `IntersectionObserver`) or clicking `infinite-load-more`. Each load takes ~400ms and shows `infinite-loading`.

`infinite-count` holds the current row count, so growth is assertable without counting elements. The Load more button disappears at 100.

**Testids:** `infinite-list`, `infinite-count`, `infinite-item-<n>`, `infinite-sentinel`, `infinite-loading`, `infinite-load-more`
