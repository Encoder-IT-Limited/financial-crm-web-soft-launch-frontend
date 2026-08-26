# Bug Fixes Required

## 1. BUG_01: Navbar Items Are Hidden on Smaller Screen Sizes ✅

- **Module:** Navbar
- **Feature:** Responsive Navigation
- **URL:** https://erupt-wired-compacter.ngrok-free.dev/login
- **Description:** Three navbar items are not visible on smaller mobile screen sizes. The items gradually become visible when the screen width is increased.
- **Steps to Reproduce:**
  1. Open the website.
  2. Navigate to the Features page.
  3. Open Chrome DevTools and enable Responsive/Device Mode.
  4. Set the viewport to a small mobile width, such as 360px.
  5. Observe the navbar.
  6. Gradually increase the viewport width.
  7. Observe the navbar items.
- **Expected Result:** All navbar navigation options should remain accessible and should properly adjust according to the screen size. If items are intentionally hidden on mobile, they should be available through a responsive menu.
- **Actual Result:** Three navbar items are hidden at smaller screen widths and gradually become visible as the viewport width increases.

---

## 2. BUG_02: Compare Plans Table Does Not Display All Plans on Mobile View

- **Module:** Pricing
- **Feature:** Compare Plans / Pricing Table
- **URL:** https://erupt-wired-compacter.ngrok-free.dev/admin/plans
- **Description:** The Compare Plans section contains three plans — Starter, Growth, and Enterprise. On smaller mobile screen sizes, the Growth and Enterprise plans are not visible, and at narrower widths the Enterprise plan is also not displayed.
- **Steps to Reproduce:**
  1. Open the website.
  2. Navigate to the Pricing page.
  3. Scroll to the Compare Plans section.
  4. Enable Chrome DevTools Responsive/Device Mode.
  5. Test different mobile screen widths.
  6. Observe the Starter, Growth, and Enterprise columns.
- **Expected Result:** All three plans (Starter, Growth, and Enterprise) should remain accessible on mobile devices. The table should properly adapt using responsive layout, horizontal scrolling, stacking, or another suitable responsive solution.
- **Actual Result:** Growth and Enterprise plans are not visible at certain mobile widths. At narrower screen widths, the Enterprise plan is also not visible.

---

## 3. BUG_03: Default Value Is Not Replaced When Entering a New Quantity

- **Module:** Quantity / Counter
- **Feature:** Increase/Decrease Quantity
- **URL:** https://erupt-wired-compacter.ngrok-free.dev/pricing
- **Description:** The quantity input field has a default value of 1. When the user enters 29, the existing 1 remains and the entered value is appended, resulting in 129.
- **Steps to Reproduce:**
  1. Open the website.
  2. Navigate to the section containing the increase/decrease quantity option.
  3. Observe that the quantity field contains 1 by default.
  4. Click inside the quantity field.
  5. Enter 29.
  6. Observe the displayed value.
- **Expected Result:** The existing default value 1 should be replaced when the user enters a new quantity, or the user should be able to easily clear the existing value before entering a new quantity. The field should display 29.
- **Actual Result:** The existing 1 remains in the field and the entered 29 is appended, resulting in 129.

---

## 4. BUG_04: Inconsistent Horizontal Scrolling in Recent Payments Table on Mobile Devices

- **Module:** Admin Dashboard
- **Feature:** Recent Payments → View All
- **URL:** https://erupt-wired-compacter.ngrok-free.dev/admin/payments
- **Description:** The Recent Payments table accessed through the View All option shows inconsistent horizontal scrolling behavior across different mobile screen sizes. On some mobile devices, a horizontal scrollbar is available, while on others it is not.
- **Steps to Reproduce:**
  1. Log in to the Admin Dashboard.
  2. Locate the Recent Payments section.
  3. Click View All.
  4. Observe the payment table and its columns.
  5. Test the page on different mobile screen sizes/devices.
  6. Compare the horizontal scrolling behavior.
- **Expected Result:** The table should have consistent responsive behavior across all supported mobile screen sizes. If the table exceeds the viewport width, users should be able to horizontally scroll and access all columns.
- **Actual Result:** On some mobile screen sizes, a horizontal scrollbar is available, while on other mobile screen sizes, no scrollbar is available, making the table's responsive behavior inconsistent.

---

## 5. BUG_05: Clear Filter Option Is Not Visible on Mobile View

- **Module:** Admin Dashboard → All Clients
- **Feature:** Client Filter
- **URL:** https://erupt-wired-compacter.ngrok-free.dev/admin/tenants
- **Description:** The All Clients page contains Filter and Clear Filter options. However, the Clear Filter option is not visible on mobile screen sizes.
- **Steps to Reproduce:**
  1. Log in to the Admin Dashboard.
  2. Navigate to All Clients.
  3. Open the Filter option.
  4. Apply any available filter.
  5. Observe the filter controls on a mobile screen.
- **Expected Result:** Clear Filter options should be properly visible and accessible on all supported mobile screen sizes.
- **Actual Result:** The Clear Filter option is not visible on mobile screen sizes.

---

## 6. BUG_06: Plan and Status Fields Overlap in Edit Client Tab on Mobile and Web View

- **Module:** Admin Dashboard → All Clients
- **Feature:** Edit Client
- **URL:** https://erupt-wired-compacter.ngrok-free.dev/admin/tenants
- **Description:** When editing a client from the mobile and web responsive view, the Plan and Status fields overlap with each other in the Edit Client tab.
- **Steps to Reproduce:**
  1. Log in to the Admin Dashboard.
  2. Navigate to All Clients.
  3. Select a client.
  4. Click Edit.
  5. Open the Edit Client tab on a mobile screen size.
  6. Observe the Plan and Status fields.
- **Expected Result:** All fields in the Edit Client tab should be properly aligned and spaced without overlapping on web & mobile screen and sizes.
- **Actual Result:** The Plan and Status fields overlap each other in the mobile responsive view.

---

## 7. BUG_07: User Is Automatically Logged Out After 5–10 Minutes

- **Module:** Authentication / Session Management
- **Feature:** User Login Session
- **URL:** https://erupt-wired-compacter.ngrok-free.dev/login
- **Description:** The logged-in user is automatically logged out after approximately 5–10 minutes, even without manually logging out or performing any logout action.
- **Steps to Reproduce:**
  1. Open the website.
  2. Log in with valid credentials.
  3. Navigate to any dashboard/page.
  4. Continue using the application or leave the session idle for approximately 5–10 minutes.
  5. Observe the user's session.
- **Expected Result:** The user should remain logged in according to the application's configured session timeout policy. If automatic logout is intended, an appropriate warning should be provided before the session expires.
- **Actual Result:** The user is automatically logged out after approximately 5–10 minutes without any manual logout action.

---

## 8. BUG_08: Page Scrolling Stops After Selecting a Plan in Plans and Pricing Section

- **Module:** Pricing
- **Feature:** Plans and Pricing
- **URL:** https://erupt-wired-compacter.ngrok-free.dev/pricing
- **Description:** After clicking/selecting any plan from the Plans and Pricing section, the page becomes unscrollable. The user cannot scroll upward or downward.
- **Steps to Reproduce:**
  1. Open the website on a mobile device/responsive view.
  2. Navigate to the Plans and Pricing section.
  3. Click/select any available plan.
  4. Try to scroll upward and downward.
  5. Observe the page behavior.
- **Expected Result:** After selecting a plan, the page should remain scrollable so the user can navigate freely between different sections.
- **Actual Result:** After selecting a plan, the page cannot be scrolled upward or downward.

---

## 9. BUG_09: Global Font Family Is Not Set to 'Outfit'

- **Module:** Global / UI
- **Feature:** Typography / Global Styles
- **URL:** ALL
- **Description:** The entire website's font family is not set to 'Outfit'. It needs to be updated globally to use the 'Outfit' font across all pages, components, and text elements.
- **Steps to Reproduce:**
  1. Open the website in any browser.
  2. Navigate through different pages (e.g., Home, Pricing, Admin Dashboard).
  3. Inspect any text element using browser DevTools.
  4. Check the computed `font-family` property for the body or root elements.
- **Expected Result:** The global `font-family` for the entire website should be set to 'Outfit' (e.g., `font-family: 'Outfit', sans-serif;` applied globally). All text across the application should consistently render in the 'Outfit' font.
- **Actual Result:** The website is currently using a different default or fallback font instead of 'Outfit' across the application.
