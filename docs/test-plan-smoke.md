# Test Plan — smoke subset

Eight cases covering both logins, dashboard loading, the products table,
creating a product, a destructive path, cross-field validation, and the
admin role guard.

Accounts: `user@test.com` / `User123!` · `admin@test.com` / `Admin123!`

---

## TC-001 ✅ Happy — sign in as a standard user

> **Why this matters:** every other scenario depends on this. If it fails, the rest of the run is meaningless.

1. Navigate to `/sign-in?reset=true` — the sign-in form is visible
2. Enter `user@test.com` in the Email field
3. Enter `User123!` in the Password field
4. Click **Sign in** — the browser lands on `/dashboard`
5. Confirm the dashboard shows the signed-in email `user@test.com`

**Expected:** The user reaches the dashboard as `user@test.com`.

---

## TC-002 ✅ Happy — sign in as an administrator

> **Why this matters:** the admin account must authenticate *and* be granted elevated surfaces. Testing only the standard user leaves role assignment unverified.

1. Navigate to `/sign-in?reset=true`
2. Enter `admin@test.com` and `Admin123!`
3. Click **Sign in** — the browser lands on `/dashboard`
4. Confirm the displayed email is `admin@test.com` and the role reads `admin`
5. Confirm an **Admin panel** section is visible on the dashboard
6. Confirm the sidebar includes an **Admin** link

**Expected:** The admin signs in and sees both admin-only surfaces.
**If this fails:** If sign-in succeeds but the panel is absent, the role was not applied — a different defect from an auth failure.

---

## TC-017 ✅ Happy — seeded totals render after loading

1. Sign in as `user@test.com` / `User123!`
2. Observe placeholder/skeleton cards while data loads
3. Wait for the statistics to render
4. Confirm **Total products** reads `20`
5. Confirm **Active products** reads `15`
6. Confirm **Low stock** reads `6`

**Expected:** Four stat cards showing the seeded figures.
**If this fails:** Wrong numbers mean seed data was mutated — re-run with `?reset=true`.

---

## TC-021 ✅ Happy — search narrows the table

1. Sign in and navigate to `/products?reset=true`
2. Confirm the table is visible and the total count reads `20`
3. Type `Aurora` into the Search box
4. Wait for the list to update — the total count reads `1`

**Expected:** Search filters by name.
**Note:** Search is debounced ~300ms; wait for the count to change rather than asserting immediately.

---

## TC-026 ✅ Happy — create a product

1. Sign in and navigate to `/products?reset=true`
2. Click **New product** — a dialog opens
3. Enter name `Zephyr Test Widget`, SKU `TEST-9001`, price `19.99`, stock `7`
4. Click **Create product** — the dialog closes and a success message appears
5. Search for `Zephyr` — exactly one row is listed with that name

**Expected:** The product exists and is findable without reloading.

---

## TC-031 ❌ Negative — Cancel on the delete dialog does not delete

> **Why this matters:** a confirmation whose Cancel still deletes is a classic destructive bug.

1. Sign in and navigate to `/products?reset=true`
2. Note the first row's name, click its **Delete** button
3. Click **Cancel** — the dialog closes and the row is **still present**
4. Confirm the total count is still `20`

**Expected:** Cancel preserves the row.

---

## TC-040 ❌ Negative — end date before start date is rejected

> **Why this matters:** a rule spanning two fields, which single-field checks cannot catch.

1. Sign in and navigate to `/forms`
2. Set Start date `2026-05-01` and End date `2026-04-01`
3. Click elsewhere to move focus off the End date field
4. Confirm an error under **End date** says it must be on or after the start date

**Expected:** The invalid range is rejected at the End date field.

---

## TC-051 ❌ Negative — a standard user is redirected away from `/admin`

**Run as a separate session from TC-050 — do not reuse one browser session for both.**

1. Sign in as `user@test.com` / `User123!`
2. Confirm the sidebar has **no** Admin link
3. Navigate directly to `/admin`
4. Confirm the browser is redirected to the dashboard

**Expected:** The role guard blocks both the link and the URL.
**Note:** The redirect is client-side — wait for the dashboard to render rather than checking the URL immediately.
