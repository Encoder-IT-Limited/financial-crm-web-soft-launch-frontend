# Public Website & Super Admin Portal — Feature Plan

Scope: **only** the `(public)` and `(admin)` route groups — not the tenant portal, which is
already scaffolded per `Project-Structure.md`. This plan folds in the client's Q&A answers
(seat counting, subscription suspension, predefined roles, plan/module gating) and the SRS
(`inv-pos-hr-tenant.md`) wherever they touch these two realms. Planning only — no code yet.

---

## 1. What the new answers change here

Most of the Q&A (batch issuing, GR/PO workflow, offline POS sync, invoice-to-inventory
timing, etc.) is tenant-portal/backend logic and doesn't reshape Public or Super Admin
structure. Four answers do, directly:

- **Seats** — every active-login user (owner/admin/staff/POS cashier) counts; service/API
  accounts and read-only auditors don't. Creation is **blocked** at the limit with an
  upgrade prompt, not silently allowed. → Super Admin needs a seat-usage view per tenant;
  the block/upgrade-prompt itself is tenant-portal UI (out of scope here), but Super Admin
  is where an operator manually adjusts seats.
- **Subscription expiry** — immediate read-only suspension, **no grace period**, but data
  retention runs 30–90 days before deletion. → Super Admin needs tenant status states
  beyond just "active/inactive": Active, Read-Only (expired), Pending Deletion, with a
  visible retention countdown, plus a way to configure the retention window.
- **Predefined roles only in Phase 1** (Owner, Admin, Inventory Manager, Sales/Cashier,
  Accountant, Viewer) — no custom role builder. → Nothing to build in Super Admin for this
  (it's a tenant-portal constraint), but it confirms Plans & Pricing doesn't need a
  "custom roles" plan-tier flag.
- **Modules are plan-gated** (POS, HR/Payroll, Calendar/Booking, Social Media are add-ons
  per the original proposal) — confirmed by the SRS's module list. → Plans & Pricing needs
  a module-toggle grid per plan, and the public Pricing/Signup pages need to render
  "what's included" from that same source of truth, not a hardcoded list.

---

## 2. Public website (`(public)`)

### 2.1 Routes

| Route | Status | Purpose |
|---|---|---|
| `/` | exists | Landing |
| `/pricing` | exists, needs rework | Plan cards — currently hardcoded; should render real `Plan` records (name, price, base seats, price/additional seat, module checklist) from the same data Super Admin's Plans & Pricing manages |
| `/login` | exists | Role-tabbed login (unchanged) |
| `/signup` | **new** | Instant self-serve tenant creation (decided over sales-assisted): plan selection → company details → owner account → confirm, creating the tenant immediately. Matches the SRS's onboarding flow (§22.2) up through "Create Tenant Owner"; everything after that (branches, warehouses, tax config, invite users) happens inside the tenant portal post-signup, not here |
| `/features` | optional, not building yet | Not in the mock's nav, not required by any answer — flag as a later add if the client asks for it |
| `/contact` | optional, not building yet | Same — no signal it's needed for Phase 1 |

`/signup` as **one page with internal step state** (mirrors the existing `/login` role-tab
pattern), not four separate routes — simpler, no shareable-URL requirement for a linear
wizard, and keeps back/forward within the page instead of the browser history stack.

### 2.2 New reusable components (`(public)/components/`)

- `PublicNavbar` / `PublicFooter` — currently inline markup in `page.tsx`; extract so
  `/signup` and `/pricing` share the same header/footer instead of duplicating it.
- `PlanCard` — formalize the inline plan-card markup in `pricing/page.tsx` into a real
  component taking a `Plan`, reused on `/pricing` and in `/signup`'s plan-selection step.
- `AuthCard` — extract the `w-[420px] rounded-[20px] ...` shell currently inline in
  `login/page.tsx` so `/signup` reuses the identical visual frame instead of a second copy.
- `SignupStepper` — small step indicator (Plan → Company → Owner → Done).

### 2.3 Data layer

- `types/plan.ts` — `Plan { id, name, priceMonthly, priceYearly, baseSeats, additionalSeatPrice, trialDays, modules: ModuleKey[] }`.
- `(public)/modules/signup/api/`: `plansService.list()` (public GET, no auth) and
  `signupService.create({ planId, company, owner })` → returns `Me` + sets the session
  cookie, same shape as `authService.login`, then the page redirects to `/dashboard`.
- Both `/pricing` and `/signup` read plans from the same `plansService.list()` — never a
  second hardcoded plan array — so Super Admin editing a plan is instantly reflected.

---

## 3. Super Admin portal (`(admin)`)

Keep the five nav items already scaffolded (`All Clients`, `Plans & Pricing`, `Payments`,
`Audit Log`, `Settings` — matches the prototype's sidebar); the work is fleshing each out
with the detail views the Q&A implies, not adding new top-level nav.

### 3.1 All Clients (`/admin/tenants`)

- **List** (existing stub → real page): table with name, plan, seats (`used/total`
  via a `SeatMeter`), status badge, MRR, created date. Filters: status, plan, search.
- **New: Tenant detail** `/admin/tenants/[tenantId]`, tabbed:
  - *Overview* — company info, subscription summary.
  - *Seats* — used vs. base vs. purchased, per-user breakdown showing which accounts
    count toward the seat (owner/admin/staff/POS cashier) vs. which don't (service/API,
    read-only auditor), manual "add seats" action.
  - *Subscription* — plan, billing cycle, renewal date, **status** (`Active` /
    `Read-Only` / `Pending Deletion` / `Cancelled`), manual suspend/reactivate, and — when
    in `Pending Deletion` — the retention countdown before permanent deletion.
  - *Modules* — read-only view of which modules are active (inherited from plan).
  - *Activity* — tenant-scoped slice of the audit log (reuses the Audit Log page's row
    component).

### 3.2 Plans & Pricing (`/admin/plans`)

- **List** (existing stub → real page): plan cards/table — name, price, billing cycle,
  base seats, additional-seat price, module summary.
- **New: Create/edit plan** `/admin/plans/new`, `/admin/plans/[planId]` — form fields:
  name, monthly/yearly price, trial length, base seats, price per additional seat, and a
  **module-toggle grid** covering every `ModuleKey` (see §3.5) so POS/HR/Calendar/Social
  can be gated per plan even before those modules exist in the tenant portal.
- This is the single source of truth `/pricing` and `/signup` read from (§2.3).

### 3.3 Payments (`/admin/payments`)

- Transaction list: tenant, type (subscription charge / additional-seat purchase /
  refund), amount, method, status, date. Filters: tenant, date range, status.
- Payment gateway toggles (Stripe/PayPal/Telr — already sketched in the prototype) stay
  under Settings (§3.4), not duplicated here; this page is transactions only.

### 3.4 Audit Log (`/admin/audit`)

- Platform-wide table per the SRS's `audit_logs` schema: user, tenant, module, entity,
  action, old/new values (expandable diff), IP, timestamp. Filters: tenant, module,
  action, date range, user.
- `AuditDiffViewer` component renders the JSONB old/new-value diff — shared with the
  tenant detail page's Activity tab (§3.1).

### 3.5 Settings (`/admin/settings`)

- Existing: branding, notification templates, payment gateways (from the prototype).
- **New**: retention-window config (the 30–90 day post-suspension deletion window from
  Q2 — make it configurable, not hardcoded), seat-limit-reached message copy.

### 3.6 Platform staff roles — decided

The SRS lists three distinct platform-level user types (Super Admin, Platform
Administrator, Support/Admin Staff). **Decided: one flat Super Admin role for Phase 1**,
matching the prototype — no platform-side role management to build now. Revisit if real
usage shows separate platform staff permission levels are actually needed.

### 3.7 New reusable components (`src/components/shared/` or `(admin)/components/`)

- `StatusBadge` — Active/Read-Only/Pending Deletion/Cancelled, consistent color mapping.
- `SeatMeter` — "7 / 10 seats used" bar + label, reused in tenant list rows and detail.
- `DataTable` — generic sortable/filterable table (pairs `@tanstack/react-table` with the
  already-installed `@tanstack/react-query`), reused across All Clients, Payments, and
  Audit Log. **New dependency** to add: `@tanstack/react-table`.
- `ModuleToggleGrid` — checkbox grid over `ModuleKey`, used in Plans & Pricing.
- `ConfirmDialog` (shadcn `alert-dialog`) — for suspend/reactivate/delete-plan actions.
- `Tabs` (shadcn) — tenant detail page's tab set.
- `AuditDiffViewer` — shared between Audit Log and tenant detail's Activity tab.

### 3.8 Type & service additions

- Types: `TenantSummary`, `TenantDetail`, `Plan` (shared with public), `Subscription`,
  `SeatUsage`, `PaymentTransaction`, `AuditLogEntry`.
- Extend `ModuleKey` (`src/lib/permissions/index.ts`) with the Phase 2/3 modules so plans
  can be configured ahead of the modules themselves: `"pos" | "hr-payroll" |
  "calendar-booking" | "social-media"` alongside the existing set.
- Services: `(admin)/modules/tenants/api/tenants.service.ts` (list, detail,
  suspend/reactivate, addSeats), `.../plans/api/plans.service.ts` (CRUD),
  `.../payments/api/payments.service.ts` (list, refund), `.../audit/api/audit.service.ts`
  (list with filters).

---

## 4. Sequencing

1. Shared groundwork: `ModuleKey` extension, `StatusBadge`/`SeatMeter`/`DataTable`
   primitives, `Plan` type (used by both realms).
2. Super Admin: Plans & Pricing (list + create/edit) first — it's the data source
   everything else (tenant detail's Modules tab, public pricing/signup) reads from.
3. Super Admin: All Clients list + tenant detail.
4. Super Admin: Payments, Audit Log, Settings additions.
5. Public: rework `/pricing` to read real plans, then build `/signup`.

---

## 5. Decisions (resolved 2026-08-19)

1. **Platform staff roles** — one flat Super Admin role for Phase 1 (§3.6); no separate
   Platform Administrator / Support Staff roles yet.
2. **Signup flow** — instant self-serve; `/signup` creates the tenant immediately rather
   than routing through sales/support first.
3. **Tenant impersonation** — not building a "log in as this tenant" tool for Phase 1.
