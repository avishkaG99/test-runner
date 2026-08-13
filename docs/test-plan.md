# TEST_PLAN
# Test Plan — Test Target App

Paste this as a **PR comment** to give web-app-tester an explicit plan. Without one it generates its own from the PR diff, which is fine for small changes but tends to miss the deliberate error paths this app is built around.

**Environment:** `preview` (see [`.web-app-tester.json`](../.web-app-tester.json))
**Related:** [web-app-tester integration](./web-app-tester.md) · [Testing guide](./testing-guide.md) · [Feature specs](./README.md#feature-specifications)

**52 cases across 9 features. Every feature has both happy-path and negative coverage.**

---

## How the plugin reads a plan

It looks for **numbered or bulleted verification steps** written with clear action verbs, anywhere in the PR or issue comments.

Two rules matter more than formatting:

- **Every step needs an observable expected result.** "Click sign in" is not verifiable; "Click sign in — the dashboard appears" is. The plugin decides PASSED/FAILED by comparing what it sees against what you wrote.
- **Describe what a user sees, not implementation.** Say "an error message appears below the email field", not "`sign-in-email-error` renders".

Scope a run to what the PR changed — `max-budget-usd: 5` per run. Use the [smoke subset](#smoke-subset) for routine checks.

Every expected value below was verified against the live deployment.

---

## Preconditions

- App reachable at the preview URL, all routes returning 200
- Append `?reset=true` to the first URL of any scenario to restore seed data
- Accounts: `user@test.com` / `User123!` · `admin@test.com` / `Admin123!` · `locked@test.com` / `Locked123!`

---

# 1. Authentication — sign in

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

## TC-003 ❌ Negative — wrong password is rejected

1. Navigate to `/sign-in?reset=true`
2. Enter `user@test.com` and `WrongPass123!`
3. Click **Sign in** — an error banner reads "Invalid email or password"
4. Confirm the browser is still on `/sign-in`

**Expected:** Access refused with a visible message and no navigation.
**If this fails:** Reaching the dashboard here is a critical security defect.

---

## TC-004 ❌ Negative — locked account gets its own message

1. Navigate to `/sign-in?reset=true`
2. Enter `locked@test.com` and `Locked123!`
3. Click **Sign in** — an error banner mentions the account being locked
4. Confirm the wording differs from the wrong-password message in TC-003

**Expected:** A distinct "locked" message; the user does not sign in.

---

## TC-005 ❌ Negative — empty submit shows per-field errors

1. Navigate to `/sign-in?reset=true`
2. Click **Sign in** without entering anything
3. Confirm an error appears **below the Email field**
4. Confirm an error appears **below the Password field**
5. Confirm the browser has not navigated

**Expected:** Two field-level messages; no submission.

---

## TC-006 ❌ Negative — malformed email is rejected

1. Navigate to `/sign-in?reset=true`
2. Enter `notanemail` as the Email and `User123!` as the Password
3. Click **Sign in**
4. Confirm an error under the Email field asks for a valid address
5. Confirm no request was submitted — the page does not navigate

**Expected:** Client-side format validation blocks submission.

---

## TC-007 ❌ Negative — password under 8 characters is rejected

1. Navigate to `/sign-in?reset=true`
2. Enter `user@test.com` and the password `short`
3. Click **Sign in**
4. Confirm an error under the Password field states the minimum length

**Expected:** Length validation blocks submission.

---

# 2. Authentication — session

## TC-008 ✅ Happy — sign out ends the session

1. Sign in as `user@test.com` / `User123!`
2. Click **Sign out** in the header — the browser returns to sign-in
3. Navigate directly to `/dashboard`
4. Confirm the browser is redirected back to sign-in

**Expected:** The session is cleared and protected routes are unreachable.

---

## TC-009 ✅ Happy — the intended destination is restored after signing in

1. Navigate to `/sign-in?reset=true` and wait for the form
2. Navigate directly to `/products`
3. Confirm the browser is redirected to the sign-in page
4. Sign in as `user@test.com` / `User123!`
5. Confirm the browser arrives at `/products`, **not** the dashboard

**Expected:** Access is blocked, then the original destination is restored.

---

## TC-010 ❌ Negative — an expired session is refused

1. Sign in as `user@test.com` / `User123!`
2. Click the **Force session expiry** control in the header
3. Confirm the browser returns to the sign-in page
4. Navigate directly to `/dashboard`
5. Confirm the browser is redirected to sign-in rather than showing the dashboard

**Expected:** The expired session is treated as signed out.

---

# 3. Authentication — sign up and password reset

## TC-011 ✅ Happy — create an account

1. Navigate to `/sign-up?reset=true`
2. Enter name `Brand New`, email `brandnew@test.com`
3. Enter password `Password1!` and the same value in Confirm password
4. Click **Create account**
5. Confirm a success confirmation replaces the form

**Expected:** The account is created and the form is replaced by a confirmation.

---

## TC-012 ✅ Happy — password strength reflects complexity

1. Navigate to `/sign-up?reset=true`
2. Type `abc` into the Password field — the strength label reads a weak value
3. Replace it with `Str0ng!Pass` — the strength label reads **Strong**

**Expected:** The strength indicator responds to length, case, digits, and symbols.

---

## TC-013 ❌ Negative — mismatched confirmation is rejected

1. Navigate to `/sign-up?reset=true`
2. Enter name `X` and email `new@test.com`
3. Enter password `Password1!` and confirm password `Different1!`
4. Click **Create account**
5. Confirm an error under Confirm password states the passwords do not match

**Expected:** Submission is blocked at the confirmation field.

---

## TC-014 ❌ Negative — an already-registered email is refused

1. Navigate to `/sign-up?reset=true`
2. Enter name `Dup User` and email `user@test.com` (an existing account)
3. Enter password `Str0ng!Pass` in both password fields
4. Click **Create account**
5. Confirm an error states the email is already registered

**Expected:** The duplicate is refused with a clear message.

---

## TC-015 ✅ Happy — request a password reset

1. Navigate to `/forgot-password?reset=true`
2. Enter `user@test.com`
3. Click **Send reset link**
4. Confirm a confirmation message replaces the form

**Expected:** The request is accepted and confirmed.

---

## TC-016 ❌ Negative — reset request hits a server error

1. Navigate to `/forgot-password?reset=true`
2. Enter `fail@test.com`
3. Click **Send reset link**
4. Confirm an error message appears and **no** success confirmation is shown

**Expected:** The server error surfaces visibly.
**Note:** An email containing `fail` deliberately returns HTTP 500.

---

# 4. Dashboard

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

## TC-018 ✅ Happy — refresh refetches the statistics

1. Sign in and remain on the dashboard
2. Click **Refresh**
3. Confirm the statistics remain visible and the values are unchanged

**Expected:** Refetching succeeds without disrupting the page.

---

## TC-019 ✅ Happy — statistics reflect catalogue changes

> **Why this matters:** proves the dashboard and products share one source of truth.

1. Sign in and navigate to `/products?reset=true`
2. Delete any one product — the total count reads `19`
3. Navigate to `/dashboard`
4. Confirm **Total products** now reads `19`

**Expected:** The dashboard reflects the deletion without a manual reload.

---

## TC-020 ❌ Negative — admin panel is hidden from standard users

1. Sign in as `user@test.com` / `User123!`
2. Confirm **no** Admin panel section appears on the dashboard
3. Confirm the sidebar has **no** Admin link

**Expected:** Admin-only surfaces are absent for a standard user.

---

# 5. Products — browsing

## TC-021 ✅ Happy — search narrows the table

1. Sign in and navigate to `/products?reset=true`
2. Confirm the table is visible and the total count reads `20`
3. Type `Aurora` into the Search box
4. Wait for the list to update — the total count reads `1`

**Expected:** Search filters by name.
**Note:** Search is debounced ~300ms; wait for the count to change rather than asserting immediately.

---

## TC-022 ✅ Happy — category filter narrows the table

1. Sign in and navigate to `/products?reset=true`
2. Select **books** in the Category filter
3. Confirm the total count reads `4`
4. Reset the filter to **All categories** — the count returns to `20`

**Expected:** Filtering and clearing both work.

---

## TC-023 ✅ Happy — sorting reorders and reverses

1. Sign in and navigate to `/products?reset=true`
2. Click the **Price** column header — rows reorder by price, cheapest first
3. Click **Price** again — the order reverses, most expensive first

**Expected:** One click sorts ascending; a second reverses it.

---

## TC-024 ✅ Happy — pagination moves between pages

1. Sign in and navigate to `/products?reset=true`
2. Confirm the page indicator reads `Page 1 of 2`
3. Click **Next** — the indicator reads `Page 2 of 2` and different products are listed
4. Click **Previous** — the indicator returns to `Page 1 of 2`

**Expected:** Both directions work; 20 products at 10 per page give exactly 2 pages.

---

## TC-025 ❌ Negative — a filter matching nothing shows an empty state

1. Sign in and navigate to `/products?reset=true`
2. Type `zzzznotarealproduct` into the Search box
3. Confirm a message states that no products match
4. Clear the Search box — the full table of 20 returns

**Expected:** A clear empty-state message, and recovery when cleared.

---

# 6. Products — create, edit, delete

## TC-026 ✅ Happy — create a product

1. Sign in and navigate to `/products?reset=true`
2. Click **New product** — a dialog opens
3. Enter name `Zephyr Test Widget`, SKU `TEST-9001`, price `19.99`, stock `7`
4. Click **Create product** — the dialog closes and a success message appears
5. Search for `Zephyr` — exactly one row is listed with that name

**Expected:** The product exists and is findable without reloading.

---

## TC-027 ✅ Happy — edit a product

1. Sign in and navigate to `/products?reset=true`
2. Click **Edit** on the first row — a dialog opens with existing values pre-filled
3. Change the Name to `Renamed Product`
4. Click **Save changes** — the dialog closes with a success message
5. Type `Renamed` into the Search box
6. Confirm exactly one row is listed, named `Renamed Product`

**Expected:** Values pre-fill and the change persists.
**Note:** The table is sorted by name, so a renamed product usually moves — often to another page. Search for the new name rather than expecting it to stay in place.

---

## TC-028 ✅ Happy — delete a product

1. Sign in and navigate to `/products?reset=true`
2. Note the name of the first row, click its **Delete** button
3. Confirm in the dialog — the row disappears and the count drops to `19`

**Expected:** The product is removed and the count updates.

---

## TC-029 ✅ Happy — bulk delete several products

1. Sign in and navigate to `/products?reset=true`
2. Tick the checkboxes on the first three rows
3. Confirm a bulk delete button appears showing **3 selected**
4. Click it and confirm in the dialog
5. Confirm the total count now reads `17`

**Expected:** Exactly the three selected products are removed.
**If this fails:** A count other than 17 means the wrong rows were targeted.

---

## TC-030 ✅ Happy — select-all covers the current page

1. Sign in and navigate to `/products?reset=true`
2. Tick the select-all checkbox in the table header
3. Confirm the bulk delete button reports **10 selected** (the page size)

**Expected:** Select-all selects the visible page, not the entire catalogue.

---

## TC-031 ❌ Negative — Cancel on the delete dialog does not delete

> **Why this matters:** a confirmation whose Cancel still deletes is a classic destructive bug.

1. Sign in and navigate to `/products?reset=true`
2. Note the first row's name, click its **Delete** button
3. Click **Cancel** — the dialog closes and the row is **still present**
4. Confirm the total count is still `20`

**Expected:** Cancel preserves the row.

---

## TC-032 ❌ Negative — empty required fields are rejected

1. Sign in and navigate to `/products?reset=true`
2. Click **New product**, then **Create product** with all fields empty
3. Confirm errors appear beneath Name and SKU
4. Confirm the dialog stays open

**Expected:** Field-level errors; nothing created.

---

## TC-033 ❌ Negative — a malformed SKU is rejected

1. Sign in and navigate to `/products?reset=true`
2. Click **New product**
3. Enter name `Bad Sku Product`, SKU `BADSKU`, price `10`, stock `1`
4. Click **Create product**
5. Confirm an error under SKU describes the required format

**Expected:** The SKU pattern (four letters, hyphen, four digits) is enforced.

---

## TC-034 ❌ Negative — a negative price is rejected

1. Sign in and navigate to `/products?reset=true`
2. Click **New product**
3. Enter name `Neg Price`, SKU `TEST-7777`, price `-5`, stock `1`
4. Click **Create product**
5. Confirm an error under Price states it must be greater than zero

**Expected:** Negative prices are blocked.

---

## TC-035 ❌ Negative — a duplicate SKU is refused by the server

1. Sign in and navigate to `/products?reset=true`
2. Click **New product**
3. Enter name `Duplicate SKU Test`, SKU `ELEC-1001` (already used), price `10`, stock `1`
4. Click **Create product**
5. Confirm an error appears **under the SKU field** saying it must be unique

**Expected:** A server-side uniqueness error attached to the right field.

---

## TC-036 ❌ Negative — a forced server error surfaces in the dialog

1. Sign in and navigate to `/products?reset=true`
2. Click **New product**
3. Enter name `fail this product`, SKU `TEST-9002`, price `5`, stock `1`
4. Click **Create product**
5. Confirm an error banner appears **inside the dialog** and it stays open

**Expected:** A banner-level error, distinct from the field errors above.
**Note:** A name containing `fail` deliberately returns HTTP 500.

---

# 7. Forms and wizard

## TC-037 ✅ Happy — submit the forms showcase

1. Sign in and navigate to `/forms`
2. Enter `Test User` as Full name and `tester@test.com` as Email
3. Select the **Pro** plan
4. Choose **Sri Lanka** in the Country field
5. Tick the **Automation** interest
6. Set Start date `2026-01-01` and End date `2026-02-01`
7. Click **Submit form** — a success message appears and the submitted values are displayed
8. Confirm the displayed values include `tester@test.com`

**Expected:** A complete form submits and echoes back what was sent.

---

## TC-038 ✅ Happy — the country combobox filters and selects

1. Sign in and navigate to `/forms`
2. Click the Country field and type `Sri`
3. Confirm the option list narrows to matching countries
4. Press the Down arrow, then Enter
5. Confirm the field shows the selected country

**Expected:** The combobox is usable by typing and by keyboard.

---

## TC-039 ❌ Negative — empty submit is blocked

1. Sign in and navigate to `/forms`
2. Click **Submit form** with the form empty
3. Confirm a validation error appears under Full name
4. Confirm no success message or submitted-values block appears

**Expected:** Validation blocks submission.

---

## TC-040 ❌ Negative — end date before start date is rejected

> **Why this matters:** a rule spanning two fields, which single-field checks cannot catch.

1. Sign in and navigate to `/forms`
2. Set Start date `2026-05-01` and End date `2026-04-01`
3. Click elsewhere to move focus off the End date field
4. Confirm an error under **End date** says it must be on or after the start date

**Expected:** The invalid range is rejected at the End date field.

---

## TC-041 ❌ Negative — a rejected submission shows a server error

1. Sign in and navigate to `/forms`
2. Fill the form as in TC-037, but enter the email as `fail@test.com`
3. Click **Submit form**
4. Confirm an error message appears and **no** success block is shown

**Expected:** The server error surfaces and is not mistaken for success.

---

## TC-042 ✅ Happy — the wizard completes

1. Sign in and navigate to `/forms/wizard`
2. Enter first name `Ada`, last name `Lovelace`, email `ada@test.com`, click **Next**
3. Enter company `Analytical Engines`, select team size `11-50`, click **Next**
4. Enter street `1 Ada Way`, city `London`, postcode `EC1A 1BB`, click **Next**
5. On the review step, confirm the email shown is `ada@test.com`
6. Click **Submit registration** — a completion message appears

**Expected:** Each step accepts valid input; the review reflects everything entered.

---

## TC-043 ✅ Happy — going back preserves entered values

1. Sign in and navigate to `/forms/wizard`
2. Complete step 1 with first name `Ada`, last name `Lovelace`, email `ada@test.com`, click **Next**
3. Click **Back**
4. Confirm all three step-1 values are still filled in

**Expected:** Navigating backwards does not lose data.

---

## TC-044 ❌ Negative — an incomplete step blocks Next

1. Sign in and navigate to `/forms/wizard`
2. Click **Next** with step 1 empty
3. Confirm validation errors appear and the wizard stays on step 1
4. Confirm the step indicator still reads step 1

**Expected:** Progress is gated on the current step validating.

---

# 8. UI playground

## TC-045 ✅ Happy — tabs, accordion, and dialog respond

1. Sign in and navigate to `/ui-playground`
2. Click the **Activity** tab — its panel becomes visible and Overview is hidden
3. Focus the tab list and press the **Right arrow** — the next tab activates
4. Click an accordion heading — its answer expands
5. Click **Open dialog**, then press **Escape** — the dialog closes
6. Click **Open dialog** again, then **Cancel** — the page records the action as cancelled

**Expected:** Each component shows and hides content; Escape and Cancel both close the dialog.

---

## TC-046 ✅ Happy — the embedded frame is interactive

1. Sign in and navigate to `/ui-playground`
2. Locate the embedded widget frame showing "Inside the iframe"
3. Click **Click me** **inside** the frame
4. Confirm `clicked inside iframe` appears inside the frame

**Expected:** Content inside the frame responds and updates within the frame.

---

## TC-047 ✅ Happy — a link opens a new tab, and the list loads more

1. Sign in and navigate to `/ui-playground`
2. Click **Open a new tab** — a new browser tab opens showing a popup heading
3. Close it and return
4. Confirm the scrollable list reports 20 rows
5. Click **Load more** — the count rises to 40

**Expected:** The popup is capturable and the list grows in batches of 20.

---

# 9. Settings and admin

## TC-048 ✅ Happy — theme persists across a reload

1. Sign in and navigate to `/settings`
2. Select the **Dark** theme — the page switches to dark colours
3. Reload the page
4. Confirm the page is **still** dark and Dark remains selected
5. Select **Light** to restore the default

**Expected:** The preference survives a reload.

---

## TC-049 ✅ Happy — reset restores seeded data

> **Why this matters:** every other scenario relies on this for a clean starting point.

1. Sign in and navigate to `/products?reset=true`
2. Delete any one product — the count drops to `19`
3. Navigate to `/settings` and click **Reset app data**
4. Navigate back to `/products`
5. Confirm the total count is `20` again

**Expected:** The deleted product returns and the catalogue is back to seed state.

---

## TC-050 ✅ Happy — an administrator reaches the admin page

1. Sign in as `admin@test.com` / `Admin123!`
2. Confirm the sidebar shows an **Admin** link
3. Navigate to `/admin`
4. Confirm a table of user accounts is visible

**Expected:** Admins reach the page and see the account list.

---

## TC-051 ❌ Negative — a standard user is redirected away from `/admin`

**Run as a separate session from TC-050 — do not reuse one browser session for both.**

1. Sign in as `user@test.com` / `User123!`
2. Confirm the sidebar has **no** Admin link
3. Navigate directly to `/admin`
4. Confirm the browser is redirected to the dashboard

**Expected:** The role guard blocks both the link and the URL.
**Note:** The redirect is client-side — wait for the dashboard to render rather than checking the URL immediately.

---

## TC-052 ❌ Negative — an unknown route shows the 404 page

1. Sign in as `user@test.com` / `User123!`
2. Navigate to `/no-such-route`
3. Confirm a "not found" page appears with a link back to the dashboard

**Expected:** Unknown routes render the 404 page rather than a blank screen.

---

# Coverage summary

| Feature | Happy path | Negative path |
|---|---|---|
| Sign in — standard user | TC-001 | TC-003, TC-005, TC-006, TC-007 |
| Sign in — administrator | TC-002 | TC-051 |
| Locked account | — | TC-004 |
| Session lifecycle | TC-008, TC-009 | TC-010 |
| Sign up | TC-011, TC-012 | TC-013, TC-014 |
| Password reset | TC-015 | TC-016 |
| Dashboard | TC-017, TC-018, TC-019 | TC-020 |
| Products — browsing | TC-021, TC-022, TC-023, TC-024 | TC-025 |
| Products — create | TC-026 | TC-032, TC-033, TC-034, TC-035, TC-036 |
| Products — edit | TC-027 | — |
| Products — delete | TC-028, TC-029, TC-030 | TC-031 |
| Forms showcase | TC-037, TC-038 | TC-039, TC-040, TC-041 |
| Wizard | TC-042, TC-043 | TC-044 |
| UI playground | TC-045, TC-046, TC-047 | — |
| Settings | TC-048, TC-049 | — |
| Admin | TC-050 | TC-051 |
| Routing | — | TC-052 |

**29 happy-path · 23 negative.** The negative cases carry more weight: an app that never rejects bad input looks identical to a working one until it reaches production.

---

# Smoke subset

For routine PR checks, run these eight — both logins, loading, the table, a destructive path, validation, and role control:

**TC-001, TC-002, TC-017, TC-021, TC-026, TC-031, TC-040, TC-051**

---

# Known caveats

- **Drag-and-drop** on `/ui-playground` uses the native HTML API. Playwright's `dragTo()` does not reliably reorder it in every browser, so no case asserts a specific resulting order. Treat reordering as manual-only.
- **Toasts auto-dismiss.** Prefer asserting on a durable state change over catching a toast.
- **Report generation** takes about 4 seconds. Allow at least 15 seconds before judging it failed.
- **Search is debounced** ~300ms. Wait for the count to change rather than asserting immediately after typing.
