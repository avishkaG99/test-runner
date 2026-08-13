# Products (CRUD)

The richest screen in the app: a data table with search, filtering, sorting, and pagination, plus create, edit, delete, and bulk delete through modal dialogs. If you only test one feature, test this one.

**Route:** `/products`
**Source:** [`src/features/products/`](../../src/features/products/)
**Related:** [Dashboard](./dashboard.md) · [Mock API — endpoints](../mock-api.md#endpoints) · [UI playground — dialogs](./ui-playground.md#dialog)

---

## The table

20 seeded products across five categories, 10 rows per page — so the seed data gives exactly two pages, which makes pagination assertions concrete.

Rows are identified by product id: `products-row-p-01`, `products-name-p-01`, `products-edit-p-01`, `products-delete-p-01`, `products-select-p-01`. Ids are stable across resets because the seed is fixed.

### Search

`products-search-input` filters on name **or** SKU, case-insensitively. It is debounced by 300ms and resets to page 1 on change.

The debounce is intentional — it means a test that types and immediately asserts will see stale results, which is exactly the sort of timing the agent should learn to handle. Wait for the result count to change rather than adding a fixed sleep.

### Category filter

`products-category-filter` is a native `<select>` with an "All categories" option plus the five categories. Also resets to page 1.

Seed distribution: electronics 4, apparel 4, home 4, sports 4, books 4.

### Sorting

Every column header is a button (`products-sort-name`, `products-sort-sku`, `products-sort-category`, `products-sort-price`, `products-sort-stock`, `products-sort-status`). Clicking sorts ascending; clicking the same column again flips to descending.

The active header exposes `aria-sort="ascending"` or `"descending"`, and inactive ones `"none"`, so sort state is assertable without reading the icon.

Numeric columns (price, stock) sort numerically; the rest sort as strings.

### Pagination

`products-prev-page` and `products-next-page` are disabled at the boundaries and while a fetch is in flight. `products-page-indicator` reads "Page 1 of 2". Counts render as `products-shown-count` and `products-total-count`.

Previous-page data stays on screen while the next page loads (TanStack Query's `placeholderData`), so the table never flashes empty mid-navigation.

### Empty state

When filters match nothing, the table is replaced by `products-empty`. Searching for a nonsense string is the quickest way to reach it.

## Create

`products-create-button` opens a dialog. Validation:

| Field | Rule |
|---|---|
| Name | Required, at least 3 characters |
| SKU | Required, must match `ABCD-1234` (four uppercase letters, hyphen, four digits) |
| Price | Required, greater than 0 |
| Stock | Required, whole number, 0 or more |
| Category / Status | Selects, always valid |

The SKU input upper-cases as you type, so a test can send lowercase and still pass the pattern.

Two server-side failures are reachable:

- **Duplicate SKU** → 409, with the error attached to the SKU field
- **Name containing `fail`** → 500, rendered in the dialog's `products-create-error` banner

This distinction matters: field errors and banner errors are different assertions, and the app produces both from the same form.

## Edit

`products-edit-<id>` opens the same form pre-filled. Same validation, same `fail` trigger. On success the row updates in place without a page reload, because the mutation invalidates the list query.

## Delete and bulk delete

Single delete (`products-delete-<id>`) opens a confirmation dialog. **Cancel genuinely cancels** — the row survives, which is worth an explicit test since a broken confirm dialog is a classic bug.

Bulk delete appears once any row is selected. `products-select-all-checkbox` selects every row on the current page; individual rows use `products-select-<id>`. The bulk button label includes the count ("Delete 3 selected"), and confirming removes them in one request.

Selection is tracked across pages, so selecting on page 1, moving to page 2, and selecting more accumulates.

## Dialogs

All four dialogs share the primitive documented in [UI playground — dialog](./ui-playground.md#dialog): focus trap, Escape to close, backdrop click to close, focus restored to the trigger on close.

## Testids

Listed in full in [test-map.json](../../test-map.json) under the `/products` route. The dynamic ones follow `products-<action>-<productId>`.

## Testing notes

Start from a known state — `await page.goto('/products?reset=true')` — because product mutations persist to `localStorage` and will otherwise leak between tests. See [Mock API — resetting](../mock-api.md#resetting-state).

After creating a product, the fastest way to find its row is to search for its name and read the single remaining row's `data-testid`, since the generated id is not known in advance.
