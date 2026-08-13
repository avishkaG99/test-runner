# Frontend Feature Specification — Products (CRUD)

**Purpose:** Let a signed-in user browse, search, and manage a product catalogue through a paginated table with create, edit, and delete.

**Owner / driver:** Test-target maintainers

**Status:** Approved

**Related:** [Test plan TC-007–TC-010d](../test-plan.md) · [Dashboard](./dashboard.md) · [Mock API](../mock-api.md#endpoints) · [`src/features/products/`](../../src/features/products/)

**Version / last updated:** 1.0, 2026-08-13

---

## 1. Requirement

### 1.1 Summary
- The densest interaction surface in the app: filtering, sorting, pagination, modal forms, and bulk selection in one screen.
- Exists so the test agent can exercise a realistic data-table workflow end to end.

### 1.2 Scope
- **In scope**
  - Paginated table (10 per page) with sortable columns
  - Debounced text search across name and SKU, plus a category filter
  - Create and edit via modal dialogs with field validation
  - Delete and bulk delete, both behind confirmation dialogs
  - Empty state when filters match nothing
  - Cache invalidation so the table and [dashboard](./dashboard.md) refresh without a reload
- **Out of scope**
  - Server-side search relevance ranking; matching is plain substring
  - Image upload, variants, inventory history
  - Optimistic updates — mutations wait for the response
- **Assumptions**
  - 20 seeded products, ids `p-01`–`p-20`, stable across resets
  - Mutations persist to `localStorage` and leak between tests unless reset

---

## 2. Backend API references (integration only)

| Purpose | Method | Endpoint | Request | Response | Notes |
|---|---|---|---|---|---|
| List | `GET` | `/api/products` | `search`, `category`, `sortBy`, `sortDir`, `page`, `pageSize` | `Paginated<Product>` | Auth required |
| Read one | `GET` | `/api/products/:id` | — | `Product` | 404 if missing |
| Create | `POST` | `/api/products` | `ProductInput` | `Product` | 409 duplicate SKU, 500 if name contains `fail` |
| Update | `PUT` | `/api/products/:id` | `ProductInput` | `Product` | 404, 500 as above |
| Delete | `DELETE` | `/api/products/:id` | — | `204` | 404 if missing |
| Bulk delete | `POST` | `/api/products/bulk-delete` | `{ ids }` | `{ deleted }` | — |

All require `Authorization: Bearer …`; without it they return 401.

---

## 3. Current frontend behavior

### 3.1 Implemented now
- `src/features/products/index.tsx` — table, filters, pagination, four dialogs
- `src/features/products/product-form.tsx` — shared create/edit form, validators, and DTO mapping
- `src/hooks/api/products.ts` — Query and Mutation hooks with invalidation
- `src/lib/api/services/products.ts` — Axios-only service functions

### 3.2 Gaps / TODO in current code
- Selection is kept across pages but not surfaced in the UI beyond the button count
- No column-visibility or density controls
- Sorting is single-column only

---

## 4. Screen flow and interactions

### 4.1 Load flow
- **Step 1:** Route guard resolves; the screen mounts from `@/features/products`
- **Step 2:** `useProductsQuery(params)` runs, keyed on search/category/sort/page
- **Step 3:** Rows render from `data.items`; counts and the page indicator from the envelope
- **Loading state:** Skeleton rows under `products-loading`; `placeholderData` keeps the previous page visible while paging
- **Empty state:** `products-empty` with guidance to clear filters

### 4.2 Submit flow
- **Action:** Create/update/delete/bulk-delete mutations from `hooks/api/products.ts`
- **Client validation:** Name ≥ 3 chars; SKU matches `ABCD-1234`; price > 0; stock a whole number ≥ 0
- **Success UX:** Dialog closes, toast fires, list and dashboard queries invalidate
- **Failure UX:** `fieldErrors` attach to inputs (409 duplicate SKU); `message` renders in the dialog banner (500)
- **Retry/idempotency:** No retries; re-submitting a duplicate SKU fails again by design

---

## 5. Frontend data model mapping

| UI field | Form path | API field | Type | Required | Rules |
|---|---|---|---|---|---|
| Name | `name` | `name` | string | Y | Trimmed, ≥ 3 characters |
| SKU | `sku` | `sku` | string | Y | `^[A-Z]{4}-\d{4}$`, upper-cased as typed, unique |
| Price | `price` | `price` | number | Y | > 0; entered as string, cast on submit |
| Stock | `stock` | `stock` | number | Y | Integer ≥ 0 |
| Category | `category` | `category` | enum | Y | One of five values |
| Status | `status` | `status` | enum | Y | `active` \| `draft` \| `archived` |

- **State ownership:** Filters, paging, and selection in local state; rows come from the Query cache
- **Transformations:** `toFormValues()` Product → form strings; `toProductInput()` form → DTO with numeric casts
- **Error mapping:** 409 → `fieldErrors.sku`; 500 → dialog banner

---

## 6. Testing and quality

- **Unit tests:** `validateProduct()` rules; `toProductInput()` casting; `nextProductId()` sequencing
- **Integration tests:** [`e2e/smoke.spec.ts`](../../e2e/smoke.spec.ts) — filter/sort/paginate, create→edit→delete, and invalid input including the forced 500
- **Manual/agent plan:** [TC-007 to TC-010d](../test-plan.md)
- **Not required in this feature:** Load testing; the dataset is fixed at 20 rows

---

## 7. Specs to apply

- `React-Specs/data/data-fetching-api-client-spec.md`
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

**Seed:** 20 products; 4 per category; 15 active, 3 draft, 2 archived. Page size 10 → exactly 2 pages.

**Static testids:** `products-page`, `products-create-button`, `products-search-input`, `products-category-filter`, `products-bulk-delete-button`, `products-loading`, `products-empty`, `products-error`, `products-table`, `products-select-all-checkbox`, `products-sort-<column>`, `products-pagination`, `products-shown-count`, `products-total-count`, `products-prev-page`, `products-next-page`, `products-page-indicator`

**Per-row:** `products-row-<id>`, `products-name-<id>`, `products-select-<id>`, `products-edit-<id>`, `products-delete-<id>`

**Dialogs:** `products-create-dialog` / `products-edit-dialog` with `-name-input`, `-sku-input`, `-price-input`, `-stock-input`, `-category-select`, `-status-select`, `-submit`, `-cancel`, `-error`; plus `products-delete-dialog` and `products-bulk-delete-dialog` with `-confirm` / `-cancel`

**Timing note:** Search is debounced ~300ms. Wait for the count to change rather than asserting immediately.
