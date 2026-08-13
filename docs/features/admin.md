# Admin

A small screen behind a role check. Its purpose is the guard, not the content.

**Route:** `/admin` (admin role only)
**Source:** [`src/features/admin/index.tsx`](../../src/features/admin/index.tsx)
**Related:** [Authentication — route guards](./authentication.md#route-guards) · [Dashboard — role-conditional UI](./dashboard.md#role-conditional-ui)

---

## The guard

Two layers apply:

1. The `_authenticated` layout's guard, which requires *any* signed-in user
2. This route's own `beforeLoad`, which additionally requires the admin role

A signed-in standard user visiting `/admin` is redirected to `/dashboard`. An unauthenticated visitor is redirected to `/sign-in` by the outer guard first — the two cases produce different destinations, which is worth testing separately.

The Admin nav item is also absent from the sidebar for standard users, so there are two independent things to assert: the link is not rendered, and the URL is not reachable by typing it.

> **Timing:** the redirect happens client-side, so `page.goto('/admin')` resolves before it completes. Assert on the destination rendering rather than the URL alone:
>
> ```ts
> await page.goto('/admin')
> await expect(page.getByTestId('dashboard-page')).toBeVisible()
> await expect(page).toHaveURL(/\/dashboard/)
> ```

## Content

The signed-in administrator is shown in `admin-current-user`, and a table lists the three [seeded accounts](./authentication.md#accounts) with their role and locked status.

Rows are `admin-user-row-u-1` through `u-3`, with status in `admin-user-status-<id>` reading "Active" or "Locked".

The table renders from a password-free projection of the seed data, so credentials are never shipped into the UI bundle even though the accounts themselves are public knowledge in this app.

## Testing notes

Use the `adminPage` fixture rather than signing in manually:

```ts
test('admin sees the user table', async ({ adminPage }) => {
  await adminPage.goto('/admin')
  await expect(adminPage.getByTestId('admin-users-table')).toBeVisible()
})
```

Test the allowed and denied cases in **separate tests**. Requesting `authedPage` and `adminPage` in one test overwrites the first session, because they share a browser context — see [Testing guide — pitfalls](../testing-guide.md#pitfalls).

## Testids

`admin-page`, `admin-current-user`, `admin-users-table`, `admin-user-row-<id>`, `admin-user-status-<id>`
