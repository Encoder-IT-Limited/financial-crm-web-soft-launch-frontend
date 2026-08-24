# Public Website & Super Admin Portal — Feature Plan

Scope: **only** the `(public)` and `(admin)` route groups — not the tenant portal, which is
already scaffolded per `Project-Structure.md`. This plan folds in the client's Q&A answers
(seat counting, subscription suspension, predefined roles, plan/module gating) and the SRS
(`inv-pos-hr-tenant.md`) wherever they touch these two realms. Planning only — no code yet.

---

## Status check (2026-08-24) — plan vs. actual code

This doc describes the *original* plan. A separate build pass (not tracked in this doc as
it happened) implemented most of §3, but diverged from it in three places, and left part of
§3.5 unbuilt. Recorded here so the plan and reality don't quietly drift apart again —
update this section whenever either side changes.

**Aligned, built as planned:**
- Nav (§3 intro) — exact match: `Dashboard, All Clients, Plans & Pricing, Payments, Audit Log, Settings`.
- Dashboard (§3.0) — KPI row, plan distribution, at-risk/recent-activity/recent-payments cards, all built.
- Payments (§3.3) — transactions-only list, gateway toggles correctly kept out of it.
- Audit Log (§3.4) — platform-wide, filterable, matches spec.
- Reusable components & types (§3.7/§3.8) — `StatusBadge`, `SeatMeter`, `ModuleToggleGrid`, `ConfirmDialog`, `AuditDiffViewer`, `ModuleKey` Phase-2/3 extension — all present.

**Diverged — architecture changed without the doc being updated:**
- §3.1/§3.2 plan `/admin/tenants/[tenantId]` and `/admin/plans/new`/`/admin/plans/[planId]`
  as dedicated page routes. **Those routes no longer exist.** Tenant detail and Plan
  create/edit are now dialogs (`tenant-details-dialog.tsx`, `tenant-edit-dialog.tsx`,
  `plan-form-dialog.tsx`) opened from the list views — matching the pattern Payments
  already used. Not wrong, just undocumented; §3.1/§3.2 below are stale on route shape.

**Diverged — Settings is significantly behind its own spec (§3.5):**
- Planned 5 tabs: Branding, Notifications, Payment gateways, Platform defaults, Site & legal.
- Built: **3 tabs** — General settings, Legal & policies, Social links.
- **Missing entirely**: Notifications (email template editor), Payment gateways
  (Stripe/PayPal/Telr toggles), Platform defaults (retention window, seat-limit-reached copy).
- **Regrouped from plan**: Maintenance mode landed inside General settings, not under
  Site & legal as planned; "Branding" became "General settings" with no primary-color field.

**Diverged — §2.3 states something as true that isn't:**
- §2.3 claims *"Both `/pricing` and `/signup` read plans from the same `plansService.list()`
  ... so Super Admin editing a plan is instantly reflected."* **Not actually true in code**:
  `/pricing` reads the static `plans-data.ts` array directly; admin's `plans.service.ts`
  only shares that array at initial load (`let plans: Plan[] = PLANS`), not live. Editing a
  plan in Super Admin does not currently affect `/pricing`.

**Not yet checked**: whether `/signup`'s plan-selection step has the same stale-data issue
as `/pricing` — likely yes, given it's the same underlying `PLANS` import, but not
independently confirmed.

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
| `/login` | **rework** (§2.5) | Single-form login — the Client/Super Admin role tabs are being removed; realm resolves from the account server-side, not a pre-login choice |
| `/signup` | **new** (§2.5) | Instant self-serve tenant creation (decided over sales-assisted): plan selection → company details → owner account → confirm, creating the tenant immediately. Matches the SRS's onboarding flow (§22.2) up through "Create Tenant Owner"; everything after that (branches, warehouses, tax config, invite users) happens inside the tenant portal post-signup, not here |
| `/forgot-password` | exists (§2.5) | Email entry, triggers an OTP send |
| `/verify-otp` | exists (§2.5) | OTP code only, then hands off to `/reset-password` |
| `/reset-password` | exists (§2.5) | New password + confirm, completes the reset |
| `/privacy` | exists | Minimal Privacy Policy — real structure, generic/placeholder copy, clearly marked as a draft |
| `/terms` | exists | Same treatment as `/privacy`, Terms of Service |
| `/features` | exists | Full module lineup grouped into categories, richer than the home page's teaser grid |
| `/contact` | exists | Working (backend-less) contact form |

`/signup` as **one page with internal step state**, not four separate routes — simpler,
no shareable-URL requirement for a linear wizard, and keeps back/forward within the page
instead of the browser history stack.

### 2.2 New reusable components (`(public)/components/`)

- `PublicNavbar` / `PublicFooter` — currently inline markup in `page.tsx`; extract so
  `/signup` and `/pricing` share the same header/footer instead of duplicating it.
- `PlanCard` — formalize the inline plan-card markup in `pricing/page.tsx` into a real
  component taking a `Plan`, reused on `/pricing` and in `/signup`'s plan-selection step.
- `AuthCard` — extract the `w-[420px] rounded-[20px] ...` shell currently inline in
  `login/page.tsx` so `/signup` reuses the identical visual frame instead of a second copy.
- `SignupStepper` — small step indicator (Plan → Company → Owner → Done).
- `ModuleShowcaseCard` — icon + name + one-line description + optional "Coming soon"
  badge, used by the home page's module grid (§2.4).
- `LegalPage` — shared shell (title + "last updated" line + prose container) for
  `/privacy` and `/terms` so the two pages don't duplicate layout markup.

### 2.3 Data layer

- `types/plan.ts` — `Plan { id, name, priceMonthly, priceYearly, baseSeats, additionalSeatPrice, trialDays, modules: ModuleKey[] }`.
- `(public)/modules/signup/api/`: `plansService.list()` (public GET, no auth) and
  `signupService.create({ planId, company, owner })` → returns `Me` + sets the session
  cookie, same shape as `authService.login`, then the page redirects to `/dashboard`.
- Both `/pricing` and `/signup` read plans from the same `plansService.list()` — never a
  second hardcoded plan array — so Super Admin editing a plan is instantly reflected.
  **⚠️ Not actually true as built — see "Status check" above.** `/pricing` reads the
  static `plans-data.ts` array directly; it and admin's plan store only share data at
  initial load, not live.

### 2.4 Navbar, footer & home page content (decided 2026-08-19)

**Navbar** — stays thin, no new routes added to it:
- Logo/wordmark (existing, links home)
- In-page anchor links: `Features` (scrolls to the home page's module grid), `Pricing`
  (routes to `/pricing`)
- `Log in` (secondary), `Get started` (primary CTA — points at `/signup` once it exists,
  `/login` until then)
- Below `lg:`, the same links collapse into a hamburger menu — no new mechanism needed
  beyond what a handful of links requires

**Footer** — three columns instead of the current single copyright line:
- Brand: logo mark + one-line tagline
- Product: same anchor links as the navbar (Features, Pricing, Log in)
- Legal: `Privacy Policy` (`/privacy`), `Terms of Service` (`/terms`) — both real routes
  now (§2.1), not dead links
- Copyright line (existing, unchanged)

No "Company" column (About/Contact/Careers) and no social icons — nothing in the
proposal or prototype calls for them.

**Home page** (`/`) — sections, in order:
1. **Hero** (existing) — headline, subheadline, primary + secondary CTA. Strengthen the
   subheadline to name the unified-platform pitch (SRS §11.2 item 1: "centralize business
   operations into one platform").
2. **Problem framing** (new) — short section naming the pain of disconnected tools
   (spreadsheets, manual reconciliation, no real-time stock visibility) before the module
   grid below pivots to the solution.
3. **Module showcase grid** (new) — one `ModuleShowcaseCard` per module, covering the
   **full lineup from the proposal**, not just what's built today: Accounting, Invoicing,
   Expenses, Inventory & Procurement, Banking, CRM, Reports & Compliance, AI Assistant,
   plus the Phase 2/3 set — POS, HR & Payroll, Calendar & Booking, Social Media — each of
   those four carrying a "Coming soon" badge. Decided over Phase-1-only: the product will
   eventually ship all of it, so the marketing story should be complete now rather than
   re-plumbed later.
4. **AI Assistant spotlight** (new) — dedicated section for OCR receipt scanning /
   auto-categorization; the proposal calls this out as a specific differentiator, not
   just another grid card.
5. **Compliance section** (new) — UAE VAT + Corporate Tax reporting built in, backed by
   real tenant-portal pages (`/dashboard/reports/vat`, `/dashboard/reports/corp-tax`).
6. **Pricing teaser** (new) — condensed line/strip ("Plans start at AED X/month") linking
   to `/pricing`, not a duplicate of the full `PlanCard` grid.
7. **Final CTA banner** (new) — "Ready to get started?" + Get Started button, with a
   trial-length line sourced from `Plan.trialDays` where set.
8. **Footer**.

> Since this section was written, `/features` and `/contact` shipped as real routes
> (navbar/footer now link to them directly instead of `/#features`), and the navbar/footer
> visual design was reworked (centered nav links, dark footer) — see the actual components
> for current markup; this section's content plan still holds.

### 2.5 Auth pages: login, signup, password reset (built 2026-08-19)

**Decided**: `/login` drops its Client/Super Admin role tabs — a single email+password
form, with realm resolved from the account server-side rather than asked up front. Every
auth page reuses `AuthShell`, a split-screen layout (branded panel left, form right) —
replacing the old plain centered `AuthCard` — and all gain `PublicNavbar` (previously
full-bleed, navbar-less). `/login` and `/signup` stay separate routes rather than merging
into one toggled page, since signup doesn't fit a 2-field login form; a "Don't have an
account? Sign up" / "Already have an account? Log in" cross-link ties them together.

**Routes** (all reuse `AuthShell`; `PublicNavbar`/`PublicFooter` come from `(public)/layout.tsx`, shown on every public route including these):

| Route | Purpose |
|---|---|
| `/login` | Email + password, show/hide toggle, "Forgot password?" link, "Sign up" cross-link. Routes to `/admin` or `/dashboard` off the returned `Me.realm` |
| `/signup` | See below — plan (conditional) → info → payment |
| `/forgot-password` | Email field only, triggers an OTP send, moves to `/verify-otp` |
| `/verify-otp` | 6-digit OTP code only (`OtpInput`), then hands off to `/reset-password?email=&otp=` |
| `/reset-password` | New password + confirm, completes the reset, redirects to `/login` with a success toast |

**`/signup` flow** (reworked from the original 4-step plan→company→owner→confirm wizard):

- **Plan step is conditional** — skipped entirely when arriving via `/signup?plan=<id>`
  (which `/pricing`'s CTAs now use), shown only when landing on `/signup` directly without
  a preselected plan. Plans render as a vertical stack of `PlanCard`s (not a 3-column
  grid) so they fit the split-screen form column.
- **One combined "info" form** — company name, country, full name, email, password,
  confirm — replacing the separate company/owner steps. Matches "one single form with all
  info, not steps" for account details.
- **Payment step** — mock card fields (cardholder name, number, expiry, CVC) + an order
  summary, "Pay & create account" simulates processing then calls `signupService.create`.
  No real payment gateway wired up yet — flagged inline in the code.
- **Step progress moves into the left panel** — `AuthStepsList` (new, vertical: numbered
  circles + connecting line + label/description) replaces a horizontal stepper that would
  have lived in the form column; sits at the bottom of `AuthShell`'s branded panel instead.

**`AuthShell` left panel** was made more deliberately designed rather than a placeholder:
dual radial glow (blue + purple), a fading dot-grid, an eyebrow badge ("Multi-tenant SaaS
platform"), gradient-accented tagline, and a `leftFooter` slot — defaults to three
floating "glass" module chips (login/forgot/OTP/reset pages), or `AuthStepsList` on
signup.

**API contract change**: `authService.login` drops `realm` — the backend infers it from
the account. New: `authService.requestPasswordReset({ email })`,
`authService.resetPassword({ email, otp, newPassword })`, `signupService.create({ planId,
company, owner })`.

**Not changing**: `/privacy` and `/terms` — already built, already use `PublicNavbar` +
`PublicFooter`, and nothing about this pass affects them.

### 2.6 `/pricing` redesign (planned 2026-08-19)

Design reference: `https://comprehensive-hr-and-operations-pla.vercel.app/pricing` (the
HR reference project's deployed pricing page) — used for **structural** ideas only; its
colors, USD currency, per-user-only pricing model, and vertical-specific content
(nursing homes/care types) don't carry over. Cross-checked against
`docs/Client-proposal.md`, the SRS, and the client Q&A so the real product rules aren't
lost under a redesign.

**What's staying**: `PLANS` data shape (`plans-data.ts`), AED currency, the flat-base +
included-seats + per-additional-seat pricing model (confirmed by
`Client-proposal.md`'s "Seat Management... base seat allotment per plan and can purchase
more"), `/signup?plan=<id>` CTAs for Starter/Growth, `/contact` for Enterprise.

**New sections, in order**:

1. **Hero** — "Simple, transparent pricing" + trial/no-hidden-fees trust line, sourced
   from real `Plan.trialDays` (14, not a copied "30 days") — matches the CTA copy
   already used elsewhere ("14-day free trial, no credit card required").
2. **Interactive seat slider** (new) — a single slider driving all three cards' live
   price at once (`basePrice + max(0, seats - baseSeats) × additionalSeatPrice` per
   plan), honestly reflecting our actual base+increment model rather than the
   reference's pure per-seat one. Paired with a Monthly/Annually toggle. **Decided**:
   `priceYearly` in `plans-data.ts` is adjusted to a clean `monthly × 12 × 0.8` so the
   toggle can show a confident "Save 20%" badge (Starter 199×12×0.8 = 1910.4 → 1910,
   Growth 499×12×0.8 = 4790.4 → 4790) instead of the previous arbitrary ~16.6% figures.
3. **Three tier cards** — reuses the existing wide plan-card style (not
   `PlanSelectCard`, which is signup-only per your earlier instruction), enhanced to
   phrase inclusions incrementally ("Everything in Starter, plus…") computed as a set
   diff between each tier's `modules` array, rather than repeating the full module list
   on every card.
4. **Comparison table** (new) — full feature matrix, grouped by category (Accounting &
   Finance / Sales & CRM / Inventory & Procurement / Reports & AI), each module a row
   with check/dash per tier, plus non-module rows for base seats, additional-seat
   price, and trial length.
5. **FAQ** (new) — grounded directly in the decided business rules from the client
   Q&A, not invented copy:
   - *What happens if I go over my included seats?* → every active-login user counts
     (owner/admin/staff/POS cashier); service/API and read-only auditor accounts don't;
     creation is blocked with an upgrade prompt at the limit, never silent overage
     billing.
   - *What happens if my subscription lapses?* → no grace period — immediate read-only
     (view/export, no new transactions); data is retained 30–90 days before deletion.
   - *Can I change plans later?* → upgrade/downgrade anytime.
   - *Is my data secure?* → tenant isolation, audit logs, encrypted credentials (SRS
     §11.22).
   - *Do you offer a free trial?* → yes, per-plan `trialDays`, no credit card required.
6. **Bottom CTA** — "Get started" / "Contact sales", reusing `FinalCtaBanner`.

**Decided**: AI Assistant stays a flat included/excluded item per plan tier (current
`PLANS` data, Enterprise-only) — not broken out as a separate usage-based/metered line,
despite `Client-proposal.md`'s "(Usage-Only)" wording. Simpler, and consistent with how
every other module is priced.

### 2.7 Per-plan seat range limits (built 2026-08-24)

`Plan` gained `minSeats: number` and `maxSeats?: number` (undefined = unlimited).
Seed data (`plans-data.ts`): Starter 3–10, Growth 10–30, Enterprise 30+ (no max).

The `/pricing` calculator's seat control stays a single shared stepper across all three
cards (§2.6's decision), but each `TierCard` now clamps that shared value into its own
`[minSeats, maxSeats ?? ∞]` range via `clampSeatsForPlan()` before pricing itself — so
dragging the shared input to, say, 50 doesn't extrapolate Starter/Growth past what
they're actually sold for; they price at their own maximum (10 / 30) while Enterprise
prices at 50. The stepper's own floor is `Math.min(...plans.map(p => p.minSeats))` (3)
rather than a hardcoded 1. Each card shows its range ("For teams of 3–10 seats") and, when
the shared value falls outside it, a "Priced for X seats (this plan's minimum/maximum)"
note so the displayed price is never a silent mismatch with what's in the stepper.

Same fields are admin-editable in Plans & Pricing (§3.2) — Minimum/Maximum seats inputs
with an "Unlimited" checkbox, validated so max can't be below min.

---

## 3. Super Admin portal (`(admin)`)

**Revised nav**: `Dashboard`, `All Clients`, `Plans & Pricing`, `Payments`, `Audit Log`,
`Settings` — six items. This adds `Dashboard` as the first item, ahead of the five
already scaffolded (which matched the prototype's sidebar as-is); the rest of the work
is fleshing each out with the detail views the Q&A implies, not adding further top-level
nav beyond this.

### 3.0 Dashboard (`/admin`)

A sidebar nav item (first in the list, above `All Clients`) — `/admin` is also the route
group's index/landing page. Existing stub (`admin/page.tsx`) has 4 metric cards including "Open
support tickets," which has no backing data model (no ticket system anywhere in
`Client-proposal.md` or the SRS) — drop it in favor of numbers every other card here is
already grounded in: `TenantSummary`, `Plan`, `AuditLogEntry`, `PaymentTransaction`.

- **KPI row** (`Card` grid, same pattern as the stub): Active tenants (vs. total),
  MRR, Trials ending in 7 days (`Plan.trialDays` vs. tenant created date), At-risk
  tenants (`Read-Only` + `Pending Deletion` count, links to All Clients pre-filtered by
  status).
- **Plan distribution** — small breakdown of tenant count per plan tier (list or bar,
  not a full chart library dependency) — reads the same `TenantSummary[]` the All
  Clients list uses.
- **At-risk tenants** — compact table: tenants in `Read-Only`/`Pending Deletion`,
  showing status (`StatusBadge`), retention countdown where applicable, and seats
  (`SeatMeter`) for tenants near their seat limit. Rows link to `/admin/tenants/[id]`.
  This is the actionable "needs attention" surface — the KPI row is read-only summary.
- **Recent activity** — last ~8 platform-wide audit log entries, reusing the Audit Log
  page's row component (same one the tenant detail Activity tab reuses per §3.1) with
  a "View all" link to `/admin/audit`.
- **Recent payments** — last ~5 transactions (tenant, amount, status), flagging failed
  ones, reusing whatever row/cell pattern the Payments page settles on. Link to
  `/admin/payments`.
- Revenue-over-time chart is explicitly **out of scope for this pass** — no charting
  library is installed yet and nothing in the Q&A calls for it; the KPI row's MRR
  number covers the "how are we doing" question without one. Revisit only if the client
  asks for a trend view.
- Data dependency: this page can't go first — it's the *aggregate* of Tenants, Plans,
  Payments, and Audit data, so build it last in the Super Admin sequence (after §3.1–
  3.4 have real services to read from), not first despite being the landing page.

### 3.1 All Clients (`/admin/tenants`)

**⚠️ Route shape stale — see "Status check" above.** Built as a dialog
(`tenant-details-dialog.tsx` + `tenant-edit-dialog.tsx`), not the page route below.

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

**⚠️ Route shape stale — see "Status check" above.** Built as a dialog
(`plan-form-dialog.tsx`), not the `/new`/`/[planId]` routes below.

- **List** (existing stub → real page): plan cards/table — name, price, billing cycle,
  base seats, additional-seat price, module summary.
- **New: Create/edit plan** `/admin/plans/new`, `/admin/plans/[planId]` — form fields:
  name, monthly/yearly price, trial length, base seats, price per additional seat, and a
  **module-toggle grid** covering every `ModuleKey` (see §3.5) so POS/HR/Calendar/Social
  can be gated per plan even before those modules exist in the tenant portal.
- **✅ Built (2026-08-24), §2.7**: Minimum seats / Maximum seats fields (with an
  "Unlimited" checkbox for no max) — the same range the public pricing calculator clamps
  each card to.
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

**⚠️ Significantly behind this spec — see "Status check" above.** Only 3 of the 5 tabs
below exist (General settings, Legal & policies, Social links); Notifications, Payment
gateways, and Platform defaults are all unbuilt, and Maintenance mode landed in General
settings instead of Site & legal.

Platform-wide defaults only — never a per-tenant setting (those live under the tenant
portal's own Settings, out of scope here). Tabbed layout (shadcn `Tabs`, same primitive
as the tenant detail page §3.1) rather than one long scrolling form:

- **Branding** (existing, from prototype) — platform logo upload, primary color,
  platform/company display name used in emails and the public site footer.
- **Notifications** — list of transactional email templates (welcome, trial-ending,
  suspension notice, payment-failed, seat-limit-reached) with a subject + body editor
  per template. Placeholder tokens (`{{tenantName}}`, `{{trialEndDate}}`, etc.) documented
  inline, not a full WYSIWYG — these are plain-text/simple-HTML transactional emails.
- **Payment gateways** (existing, from prototype) — Stripe/PayPal/Telr **enable/disable
  toggles only**. No API key fields on this page — key/secret management stays wherever
  the actual gateway credentials are configured (env vars / a secrets store, not a
  Settings text input), so this tab only decides which gateways are offered at
  checkout. Transactions themselves stay on the Payments page (§3.3).
- **Platform defaults** (existing plan, kept as its own tab):
  - Retention window — numeric input, 30–90 days, the post-suspension deletion window
    from Q2 (currently would be hardcoded wherever suspension logic lives) — this is
    the single source of truth the tenant detail page's Subscription tab (§3.1) reads
    the countdown from.
  - Seat-limit-reached message copy — textarea, the text shown to a Client Admin when
    they hit their plan's seat cap (Q1: hard block, not silent-allow) — configurable
    here instead of hardcoded in the tenant portal.
- **Site & legal** (new tab):
  - Privacy policy — rich-text/markdown body, rendered at the public `/privacy` page
    (currently, if that page exists, its copy is likely hardcoded — this makes it
    editable without a code change).
  - Social links — URL fields (LinkedIn, X/Twitter, Instagram, etc.) rendered in the
    public site footer.
  - Maintenance mode — toggle + optional message; when on, the public site (and/or
    both portals — needs confirming when built) shows a maintenance page instead of
    normal content. Scope note: this is platform-wide, not per-tenant.
- **No platform staff/role management tab** — per §3.6's decision (one flat Super Admin
  role for Phase 1), don't add a "Platform admins" or role list here; revisit only if
  that decision changes.

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
- `Tabs` (shadcn) — tenant detail page's tab set, and Settings' tab set (§3.5).
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
5. Super Admin: Dashboard (§3.0) — last within the admin portal since it aggregates
   Tenants/Plans/Payments/Audit data that must already exist to read from.
6. Public: rework `/pricing` to read real plans, then build `/signup`.

---

## 5. Decisions (resolved 2026-08-19)

1. **Platform staff roles** — one flat Super Admin role for Phase 1 (§3.6); no separate
   Platform Administrator / Support Staff roles yet.
2. **Signup flow** — instant self-serve; `/signup` creates the tenant immediately rather
   than routing through sales/support first.
3. **Tenant impersonation** — not building a "log in as this tenant" tool for Phase 1.
