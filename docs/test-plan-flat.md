# Test Plan

Environment: the preview URL configured for this project.
Accounts: user@test.com / User123! (standard) and admin@test.com / Admin123! (administrator).
Each step is tagged with its manual test case id in square brackets.

1. [TC-001] Navigate to `/sign-in?reset=true` — the sign-in form is visible
2. [TC-001] Enter `user@test.com` in the Email field
3. [TC-001] Enter `User123!` in the Password field
4. [TC-001] Click **Sign in** — the browser lands on `/dashboard`
5. [TC-001] Confirm the dashboard shows the signed-in email `user@test.com`
6. [TC-001] Verify the overall outcome: The user reaches the dashboard as `user@test.com`.
7. [TC-002] Navigate to `/sign-in?reset=true`
8. [TC-002] Enter `admin@test.com` and `Admin123!`
9. [TC-002] Click **Sign in** — the browser lands on `/dashboard`
10. [TC-002] Confirm the displayed email is `admin@test.com` and the role reads `admin`
11. [TC-002] Confirm an **Admin panel** section is visible on the dashboard
12. [TC-002] Confirm the sidebar includes an **Admin** link
13. [TC-002] Verify the overall outcome: The admin signs in and sees both admin-only surfaces.
14. [TC-017] Sign in as `user@test.com` / `User123!`
15. [TC-017] Observe placeholder/skeleton cards while data loads
16. [TC-017] Wait for the statistics to render
17. [TC-017] Confirm **Total products** reads `20`
18. [TC-017] Confirm **Active products** reads `15`
19. [TC-017] Confirm **Low stock** reads `6`
20. [TC-017] Verify the overall outcome: Four stat cards showing the seeded figures.
21. [TC-021] Sign in and navigate to `/products?reset=true`
22. [TC-021] Confirm the table is visible and the total count reads `20`
23. [TC-021] Type `Aurora` into the Search box
24. [TC-021] Wait for the list to update — the total count reads `1`
25. [TC-021] Verify the overall outcome: Search filters by name.
26. [TC-026] Sign in and navigate to `/products?reset=true`
27. [TC-026] Click **New product** — a dialog opens
28. [TC-026] Enter name `Zephyr Test Widget`, SKU `TEST-9001`, price `19.99`, stock `7`
29. [TC-026] Click **Create product** — the dialog closes and a success message appears
30. [TC-026] Search for `Zephyr` — exactly one row is listed with that name
31. [TC-026] Verify the overall outcome: The product exists and is findable without reloading.
32. [TC-031] Sign in and navigate to `/products?reset=true`
33. [TC-031] Note the first row's name, click its **Delete** button
34. [TC-031] Click **Cancel** — the dialog closes and the row is **still present**
35. [TC-031] Confirm the total count is still `20`
36. [TC-031] Verify the overall outcome: Cancel preserves the row.
37. [TC-040] Sign in and navigate to `/forms`
38. [TC-040] Set Start date `2026-05-01` and End date `2026-04-01`
39. [TC-040] Click elsewhere to move focus off the End date field
40. [TC-040] Confirm an error under **End date** says it must be on or after the start date
41. [TC-040] Verify the overall outcome: The invalid range is rejected at the End date field.
42. [TC-051] Sign in as `user@test.com` / `User123!`
43. [TC-051] Confirm the sidebar has **no** Admin link
44. [TC-051] Navigate directly to `/admin`
45. [TC-051] Confirm the browser is redirected to the dashboard
46. [TC-051] Verify the overall outcome: The role guard blocks both the link and the URL.
