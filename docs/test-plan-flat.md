# Test Plan

Test account (standard user): `user@test.com` / `User123!`
Test account (administrator): `admin@test.com` / `Admin123!`

Every case signs in through the UI, so no stored session is required.

`?reset=true` appears only on the sign-in navigation that begins each case: it
restores the seeded data and clears any prior session before the app loads.
Do not append it to later navigations - doing so signs the user out mid-case.

Steps are tagged `[TC-NNN]` with their manual test case id.

1. [TC-001] Navigate to `/sign-in?reset=true`
2. [TC-001] Enter `user@test.com` in the Email field
3. [TC-001] Enter `User123!` in the Password field
4. [TC-001] Click the **Sign in** button
5. [TC-001] Verify the browser is on the `/dashboard` page
6. [TC-001] Verify the dashboard shows the signed-in email `user@test.com`
7. [TC-002] Navigate to `/sign-in?reset=true`
8. [TC-002] Enter `admin@test.com` in the Email field
9. [TC-002] Enter `Admin123!` in the Password field
10. [TC-002] Click the **Sign in** button
11. [TC-002] Verify the browser is on the `/dashboard` page
12. [TC-002] Verify the dashboard shows the signed-in email `admin@test.com`
13. [TC-002] Verify an **Admin panel** section is visible on the dashboard
14. [TC-002] Verify the sidebar contains an **Admin** link
15. [TC-017] Navigate to `/sign-in?reset=true`
16. [TC-017] Enter `user@test.com` in the Email field
17. [TC-017] Enter `User123!` in the Password field
18. [TC-017] Click the **Sign in** button
19. [TC-017] Verify the **Total products** figure reads `20`
20. [TC-017] Verify the **Active products** figure reads `15`
21. [TC-017] Verify the **Low stock** figure reads `6`
22. [TC-021] Navigate to `/sign-in?reset=true`
23. [TC-021] Enter `user@test.com` in the Email field
24. [TC-021] Enter `User123!` in the Password field
25. [TC-021] Click the **Sign in** button
26. [TC-021] Navigate to `/products`
27. [TC-021] Verify the products table is visible
28. [TC-021] Verify the total product count reads `20`
29. [TC-021] Type `Aurora` into the Search field
30. [TC-021] Verify the total product count reads `1`
31. [TC-026] Navigate to `/sign-in?reset=true`
32. [TC-026] Enter `user@test.com` in the Email field
33. [TC-026] Enter `User123!` in the Password field
34. [TC-026] Click the **Sign in** button
35. [TC-026] Navigate to `/products`
36. [TC-026] Click the **New product** button
37. [TC-026] Verify a dialog is open
38. [TC-026] Enter `Zephyr Test Widget` in the Name field
39. [TC-026] Enter `TEST-9001` in the SKU field
40. [TC-026] Enter `19.99` in the Price field
41. [TC-026] Enter `7` in the Stock field
42. [TC-026] Click the **Create product** button
43. [TC-026] Verify the dialog has closed
44. [TC-026] Type `Zephyr` into the Search field
45. [TC-026] Verify exactly one product row named `Zephyr Test Widget` is listed
46. [TC-031] Navigate to `/sign-in?reset=true`
47. [TC-031] Enter `user@test.com` in the Email field
48. [TC-031] Enter `User123!` in the Password field
49. [TC-031] Click the **Sign in** button
50. [TC-031] Navigate to `/products`
51. [TC-031] Verify the total product count reads `20`
52. [TC-031] Click the **Delete** button on the first product row
53. [TC-031] Verify a confirmation dialog is open
54. [TC-031] Click the **Cancel** button
55. [TC-031] Verify the confirmation dialog has closed
56. [TC-031] Verify the total product count still reads `20`
57. [TC-040] Navigate to `/sign-in?reset=true`
58. [TC-040] Enter `user@test.com` in the Email field
59. [TC-040] Enter `User123!` in the Password field
60. [TC-040] Click the **Sign in** button
61. [TC-040] Navigate to `/forms`
62. [TC-040] Enter `2026-05-01` in the Start date field
63. [TC-040] Enter `2026-04-01` in the End date field
64. [TC-040] Click elsewhere on the page to move focus off the End date field
65. [TC-040] Verify an error message appears below the End date field
66. [TC-051] Navigate to `/sign-in?reset=true`
67. [TC-051] Enter `user@test.com` in the Email field
68. [TC-051] Enter `User123!` in the Password field
69. [TC-051] Click the **Sign in** button
70. [TC-051] Verify the sidebar does NOT contain an **Admin** link
71. [TC-051] Navigate to `/admin`
72. [TC-051] Verify the browser is redirected to the `/dashboard` page
