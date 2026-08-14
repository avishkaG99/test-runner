# Frontend Feature Specification — Tags

**Purpose:** Let a signed-in user label products with any number of free-form tags, then filter the catalogue down to products carrying a combination of them.

**Owner / driver:** Test-target maintainers

**Status:** Draft

**Related:** [Products](./products.md) · [Mock API](../mock-api.md#endpoints) · [Dashboard](./dashboard.md) · [Test plan](../test-plan.md) · [Forms showcase — combobox](./forms.md)

**Version / last updated:** 0.1, 2026-08-14

---

## 1. Requirement

### 1.1 Summary
- Products today carry exactly one `category` from a fixed list of five. Tags add the missing shape: **many per product, user-created, and filterable in combination**.
- That difference is the whole point. A single-value enum select is already covered by the category filter; a multi-value relation is not covered anywhere in the app, and it is one of the most common data patterns in real catalogues.
- Used by the AI test agent to exercise a workflow the current app cannot reach: creating a value inline while filling a form, applying two filters that must combine with AND rather than replace each other, and deleting an entity that is still referenced by others.

### 1.2 Scope
- **In scope**
  - A tag input on the product create/edit dialogs: type-ahead over existing tags, Enter to attach, Backspace to detach the last, click × to remove a specific one
  - Creating a new tag inline from the product dialog when no existing tag matches
  - Tag chips rendered in a new column on the products table
  - Multi-select tag filter on `/products`, combining with **AND** (a product must carry every selected tag) and combining with the existing search and category filters
  - A `/tags` management screen: list with usage counts, rename, delete
  - Delete confirmation naming how many products will be affected, and detaching the tag from all of them
  - Tag filter state reflected in the URL so a filtered view is deep-linkable
- **Out of scope**
  - Tag colours, icons, grouping, or hierarchy — tags are flat strings
  - Bulk tag assignment from the products table's existing selection
  - Renaming a tag by merging it into another existing tag
  - Tag-based metrics on the [dashboard](./dashboard.md)
  - Server-side relevance ranking in the type-ahead; matching is plain case-insensitive substring, as product search already is
- **Assumptions**
  - Tags are seeded alongside products and restored by the same reset mechanisms
  - A product may carry zero tags; that is the normal state for most of the seed
  - Tag names are unique case-insensitively — adding `Sale` when `sale` exists attaches the existing one rather than creating a duplicate

---

## 2. Backend API references (integration only)

New MSW handlers under the existing `/api` base. All require `Authorization: Bearer …` and return 401 without it, matching every other authenticated endpoint.

| Purpose | Method | Endpoint | Request | Response | Notes |
|---|---|---|---|---|---|
| List tags | `GET` | `/api/tags` | `search?` | `Tag[]` | Includes `productCount` per tag |
| Create tag | `POST` | `/api/tags` | `{ name }` | `Tag` | 409 duplicate name (case-insensitive), 422 empty or too long, 500 if name contains `fail` |
| Rename tag | `PUT` | `/api/tags/:id` | `{ name }` | `Tag` | 404, 409, 422, 500 as above |
| Delete tag | `DELETE` | `/api/tags/:id` | — | `204` | 404 if missing; detaches from every product |

**Changes to existing product endpoints:**

| Endpoint | Change |
|---|---|
| `GET /api/products` | Accepts repeatable `tag` query param; multiple values AND together |
| `GET /api/products/:id` | Response gains `tags: Tag[]` |
| `POST` / `PUT /api/products` | `ProductInput` gains `tagIds: string[]`; unknown id → 422 |

---

## 3. Current frontend behavior

### 3.1 Implemented now
- Nothing. This spec covers a feature that does not yet exist.
- Prior art to follow rather than reinvent: `src/features/products/product-form.tsx` (validation and DTO mapping), `src/hooks/api/products.ts` (query keys and invalidation), `src/lib/api/services/products.ts` (Axios-only service functions), and the custom combobox in `src/features/forms/` for the type-ahead behavior.

### 3.2 Gaps / TODO in current code
- **`ProductInput` is currently flat**, and `toProductInput()` casts strings to numbers field by field. Adding `tagIds` makes it the first array field — the mapper needs to handle the empty-array case explicitly so a product with no tags sends `[]` and not `undefined`.
- **The products query key must include tags**, or filtering by tag will serve a cached unfiltered page. The key is built in `hooks/api/products.ts`; extend it alongside `search`/`category`/`sort`/`page`.
- **Deleting a referenced tag mutates products that are not in the current page's cache.** Invalidate the whole products list, not just the visible page.
- **Undecided:** whether the products table column shows all tags or truncates past three with a `+N` overflow chip. Twenty seeded products at up to four tags each is small enough that showing all of them is probably fine, but a product carrying eight would break the row height. Decide during implementation and record the reasoning here.

---

## 4. Screen flow and interactions

### 4.1 Load flow
- **Step 1:** Guard resolves; `/products` mounts as today, or `/tags` mounts from `@/features/tags`
- **Step 2:** `useTagsQuery()` runs alongside `useProductsQuery(params)`; the tag filter needs the full tag list before it can render options
- **Step 3:** Selected tag ids read from the URL search params; chips render per row from each product's `tags`
- **Loading state:** `tags-loading` skeleton on `/tags`; on `/products` the tag filter renders disabled until the tag list resolves, so a test can never select an option that is about to be replaced
- **Empty state:** `tags-empty` on `/tags` when none exist; the existing `products-empty` covers a tag filter matching nothing

### 4.2 Submit flow
- **Action:** `useCreateTagMutation`, `useRenameTagMutation`, `useDeleteTagMutation`; product mutations carry `tagIds` through the existing create/update calls
- **Client validation:** Name trimmed, 1–24 characters, letters/numbers/spaces/hyphens only. Duplicates are caught client-side against the loaded tag list before the request, and again server-side by the 409
- **Success UX:** Dialog closes, toast fires, tag and product queries both invalidate so counts and chips update without a reload
- **Failure UX:** 409 → `fieldErrors.name` on the input ("A tag with this name already exists"); 500 → dialog banner, matching the products pattern exactly
- **Retry/idempotency:** No retries, consistent with the app-wide setting. Re-submitting a duplicate name fails again by design. Attaching a tag already attached is a no-op rather than an error

---

## 5. Frontend data model mapping

| UI field | Form path | API field | Type | Required | Rules |
|---|---|---|---|---|---|
| Tag name | `name` | `name` | string | Y | Trimmed, 1–24 chars, `^[A-Za-z0-9 -]+$`, unique case-insensitively |
| Product tags | `tagIds` | `tagIds` | string[] | N | Empty array when none; ids must exist |
| Tag filter | *(URL)* | `tag` (repeatable) | string[] | N | AND semantics; unknown ids ignored rather than erroring |

- **State ownership:** Tag list lives in the Query cache keyed `['tags']`. Filter selection lives in the URL via TanStack Router `validateSearch`, not local state — that is what makes a filtered view deep-linkable and back-button correct. The product dialog holds `tagIds` in local form state until submit.
- **Transformations:** `toProductInput()` maps chips → `tagIds`; `toFormValues()` maps `tags: Tag[]` → chip state. Names are trimmed and collapsed on whitespace before comparison, so `"  sale  "` and `"sale"` are the same tag.
- **Error mapping:** `fieldErrors.name` → the tag name input; bare `message` → dialog banner. Identical to [Products](./products.md#42-submit-flow).

---

## 6. Testing and quality

- **Unit tests:** Name normalisation and the case-insensitive uniqueness check; `toProductInput()` with zero, one, and many tags; the AND filter predicate; URL search-param round-trip for repeated `tag` values
- **Integration tests:** New `e2e/tags.spec.ts` — attach on create, attach and detach on edit, inline create from the product dialog, single-tag filter, two-tag AND filter, tag filter combined with category, rename reflected in table chips, delete detaching from products, and the duplicate-name 409
- **Manual/agent plan:** Needs new cases. The sheet currently ends at TC-015; propose TC-016 (attach and detach on a product), TC-016b (filter by one tag then two, asserting AND), TC-016c (rename and delete including the reference warning), TC-016d (duplicate name rejected). Add to [`test-plan.md`](../test-plan.md) and [`test-cases.csv`](../../test-cases.csv) once agreed.
- **Not required in this feature:** Performance with large tag counts; the seed is deliberately small

---

## 7. Specs to apply

- `React-Specs/data/data-fetching-api-client-spec.md`
- `React-Specs/ui-ux/forms-validation-spec.md`
- `React-Specs/ui-ux/error-handling-user-feedback-spec.md`
- `React-Specs/quality-ops/testing-strategy-spec.md`
- `React-Specs/quality-ops/definition-of-done-spec.md`

---

## 8. Delivery checklist

- [ ] Feature spec linked to work item/PR
- [ ] UI behavior implemented according to this spec
- [ ] Form validation and messages implemented
- [ ] API integration and error handling verified
- [ ] Seed tags added to `src/mocks/` and documented in [Mock API](../mock-api.md#seed-data)
- [ ] Tag filter state round-trips through the URL
- [ ] Test-plan cases added to `test-plan.md` and `test-cases.csv`
- [ ] Integration tests cover this scope
- [ ] `test-map.json` updated with the new route and testids
- [ ] Entry added to the feature table in [`docs/README.md`](../README.md)
- [ ] `npm run lint`, typecheck, and build pass
- [ ] No secrets committed

---

## Appendix — Test surface

**Proposed seed** — 6 tags with fixed ids `t-01`–`t-06`, chosen so every filter case has a deterministic expected count:

| Id | Name | Attached to | Count |
|---|---|---|---|
| `t-01` | `sale` | `p-01`–`p-06` | 6 |
| `t-02` | `new-arrival` | `p-04`–`p-09` | 6 |
| `t-03` | `clearance` | `p-18`, `p-19`, `p-20` | 3 |
| `t-04` | `featured` | `p-01`, `p-05` | 2 |
| `t-05` | `bulk` | `p-11`, `p-12` | 2 |
| `t-06` | `discontinued` | *(none)* | 0 |

The overlaps are deliberate: `sale` ∩ `new-arrival` = `p-04`, `p-05`, `p-06` (3 products) gives the AND filter a non-obvious expected result, and `t-06` with zero uses covers both the unused-tag display and a delete that warns about nothing. Products `p-10`, `p-13`–`p-17` carry no tags at all.

**Testids** — products page additions: `products-tag-filter`, `products-tag-filter-option-<id>`, `products-tag-filter-clear`, `products-tags-<productId>` (the cell), `products-tag-chip-<productId>-<tagId>`

Product dialog: `product-tags-input`, `product-tags-suggestion-<id>`, `product-tags-chip-<id>`, `product-tags-chip-remove-<id>`, `product-tags-create-option`

Tags page: `tags-page`, `tags-loading`, `tags-empty`, `tags-error`, `tags-create-button`, `tags-table`, `tags-row-<id>`, `tags-name-<id>`, `tags-count-<id>`, `tags-rename-<id>`, `tags-delete-<id>`

Tag dialogs: `tags-create-dialog` / `tags-rename-dialog` with `-name-input`, `-submit`, `-cancel`, `-error`, `-name-error`; `tags-delete-dialog` with `-confirm`, `-cancel`, `-usage-warning`

**URL contract:** `/products?tag=t-01&tag=t-02` filters to products carrying **both**. Repeated params, not comma-separated — TanStack Router's `validateSearch` should parse a single `tag` value into a one-element array so `?tag=t-01` and the two-tag form take the same code path.

**Failure triggers:** a tag name containing `fail` returns 500 on create or rename, consistent with the [existing `fail` convention](../mock-api.md#failure-triggers). Duplicate names return 409 with `fieldErrors.name`.

**Timing note:** the type-ahead should reuse the ~300ms debounce the product search already uses. Wait for the suggestion list to settle rather than asserting immediately after typing.

**Reset:** seed tags and their attachments restore with `?reset=true` and `POST /api/app/reset`, alongside products. A tag created mid-test persists to `localStorage` and **will** leak into the next test — reset between tests that create tags.
