# Tags

A tag library for the product catalogue. Tags are named, coloured labels with a usage count; the page lists them, creates new ones, and deletes those not in use.

**Related:** [Products](./products.md) · [Mock API](../mock-api.md) · [Testing guide](../testing-guide.md)

---

## 1. Requirement

### 1.1 Summary

Give the catalogue a managed vocabulary of labels. A tag carries a name, a colour, and a count of how many products use it. Tags in use are protected from deletion so the catalogue cannot end up referencing a tag that no longer exists.

### 1.2 Scope

| In scope | Out of scope |
|---|---|
| List all tags with colour and usage count | Applying a tag to a product |
| Create a tag (name + colour) | Renaming or recolouring an existing tag |
| Delete an unused tag, behind a confirmation | Filtering the products table by tag |

Route: `/tags` · Nav label: **Tags** · Available to every signed-in role.

---

## 2. Backend API references

All handled by MSW in [`src/mocks/handlers.ts`](../../src/mocks/handlers.ts); every route requires auth.

| Method | Path | Behaviour |
|---|---|---|
| `GET` | `/api/tags` | `{ items: Tag[] }` — subject to the latency and flaky-mode knobs |
| `POST` | `/api/tags` | Creates a tag. `400` empty name · `400` name over 24 chars · `409` duplicate name (case-insensitive) |
| `DELETE` | `/api/tags/:id` | Deletes a tag. `404` unknown id · `409` when `productCount > 0` |

New tags are always created with `productCount: 0` — nothing in this feature applies a tag to a product.

---

## 3. Current frontend behavior

### 3.1 Implemented now

- Loads on mount via `useTagsQuery`; a skeleton shows while pending.
- Header counts: total tags, and how many are unused.
- Create form: name (required) and colour (defaults to `slate`).
- Client-side check rejects an empty or whitespace-only name before any request.
- Server errors (duplicate, too long) surface inline under the Name field.
- Delete opens a confirmation dialog. A `409` renders inside the dialog rather than closing it.

### 3.2 Gaps / TODO

- No edit — a tag's name and colour are fixed once created.
- `productCount` comes from seed data; nothing in the UI changes it.

---

## 4. Screen flow and interactions

### 4.1 Load flow

1. Navigate to `/tags` from the sidebar.
2. Skeleton renders while the query is pending.
3. On success the list renders, one row per tag: colour swatch, name, usage line, created date, Delete.
4. With no tags, the empty state reads **No tags yet.**

### 4.2 Create flow

1. Type a name; optionally pick a colour.
2. Click **Create tag**.
3. On success the row appears, the form resets, and a toast confirms.
4. On failure the message appears under the Name field and the form keeps its values.

### 4.3 Delete flow

1. Click **Delete** on a row → the confirmation dialog opens.
2. **Cancel** closes it and changes nothing.
3. **Delete** removes the tag when unused; when in use, the dialog stays open and shows the `409` message.

---

## 5. Frontend data model

```ts
interface Tag {
  id: string          // "t-1"
  name: string
  color: TagColor     // slate | blue | green | amber | rose
  productCount: number
  createdAt: string   // ISO 8601
}
```

Persisted at `localStorage["tta.tags"]`, restored to seed by `?reset=true`.

---

## 6. Testing and quality

Every interactive element carries a `data-testid`. Prefer them over text selectors — the colour swatch has no accessible name, and usage lines are pluralised.

**The `409`-on-delete path is the interesting case.** `Featured` (4 products) and `Clearance` (2) cannot be deleted; `New arrival` (0) can. A test that only deletes the unused tag misses the protection entirely.

---

## Appendix — Test surface

**Seeded values:** 3 tags · 1 unused

| id | name | colour | productCount | deletable |
|---|---|---|---|---|
| `t-1` | Featured | amber | 4 | no — `409` |
| `t-2` | Clearance | rose | 2 | no — `409` |
| `t-3` | New arrival | green | 0 | yes |

**Testids:** `tags-page`, `tags-count`, `tags-unused-count`, `tags-list`, `tags-empty`, `tags-loading`, `tags-error`, `tag-name-input`, `tag-color-select`, `tag-create-button`, `tag-name-error`, `tag-delete-dialog`, `tag-delete-cancel`, `tag-delete-confirm`, `tag-delete-error`, plus per-row `tag-row-<id>`, `tag-name-<id>`, `tag-usage-<id>`, `tag-delete-<id>`.

**Validation messages, verbatim:**

| Trigger | Message |
|---|---|
| Empty name | `Tag name is required.` |
| Name over 24 characters | `Tag name must be 24 characters or fewer.` |
| Duplicate name | `A tag with that name already exists.` |
| Delete a tag in use | `"Featured" is applied to 4 product(s) and cannot be deleted.` |

**Note:** duplicate detection is case-insensitive — creating `featured` collides with the seeded `Featured`.
