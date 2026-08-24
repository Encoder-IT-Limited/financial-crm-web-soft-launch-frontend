# Backend Build Guide

## Purpose & how to use this document

Everything in this codebase today is a **frontend-only mock**: every `*.service.ts`
file is an in-memory array wrapped in `async` functions with a fake `setTimeout` delay,
consumed via React Query exactly like a real REST API would be. This was deliberate (see
`docs/architecture/Basic-Setup.md` §6's `apiGet`/`apiSend` pattern) — the goal is that
swapping a mock service's *body* for a real `fetch()` call is a one-file change, with
zero changes needed in any component that consumes it.

This document is the reverse-engineered contract for that swap: **for every mock
service method that exists today, what real endpoint should replace it, what should it
accept/return, and what business rule does it need to enforce that today only lives in
client-side `zod` validation** (which a real backend cannot trust — every rule below
needs server-side enforcement too, not just the existing client-side check).

**How to read each section**: entity field tables are copied directly from the actual
TypeScript types in the codebase (not redescribed from memory), so they're a reliable
source — file paths are given so you can diff against the real thing if it's changed
since this was written. Endpoint lists map 1:1 to existing mock-service method names,
so the backend team can build against identical names and the frontend swap requires no
renaming.

**What this is not**: a database schema. `docs/source/inv-pos-hr-tenant-SRS.md` §33
already has a full proposed Postgres schema (tables, columns, relationships) — use that
alongside this document; this document is about API *behavior*, the SRS is about
*storage*.

---

## 1. Recommended stack (per the signed proposal)

From `docs/source/MRM_Project_Proposal_v2.pdf` §4:

| Layer | Technology |
| :--- | :--- |
| Backend | Node.js + Express, or Laravel |
| Database | PostgreSQL |
| Transactional Email | SendGrid (or equivalent) |
| SMS | Twilio (or equivalent) |
| Push Notifications | Firebase Cloud Messaging |
| Payment Gateways | Stripe + Telr (PayPal also referenced in Super Admin scope) |
| PDF Generation | Puppeteer or PDFKit (server-side) |
| Hosting | AWS or Vercel + Railway |

---

## 2. Cross-cutting rules (apply everywhere, not per-module)

These came directly out of the client's Q&A (`docs/source/client-qa-inventory-pos-tenant.md`)
and shape every endpoint below, not just one module's.

1. **No full double-entry accounting in Phase 1.** POS/Invoice/Inventory transactions
   should emit **structured integration events**, not full journal entries (Q32). Design
   every mutating endpoint to emit an event (webhook, message queue, or an
   `integration_events` table row — implementation detail, but the *shape* matters: it
   needs enough data for a later Accounting module to construct a journal entry without
   re-deriving business logic).
2. **Multi-tenancy is mandatory on every table and every request.** Every business
   transaction carries a tenant reference; tenant data is logically isolated — one
   tenant must never be able to query another's data, even via IDOR. See
   `docs/requirements/Client-Requirements-Phase1.md` §2.1.
3. **Single base currency per tenant**, with individual transactions optionally recorded
   in a foreign currency converted at the transaction-date rate. No multi-currency
   ledgers in Phase 1.
4. **RBAC is fixed predefined roles only** — Owner, Admin, Inventory Manager,
   Sales/Cashier, Accountant, Viewer (Q3). No custom role builder. Permissions are
   module/action pairs (`POS.CreateSale`, `Invoice.Approve`, `Inventory.Adjust`, etc. —
   SRS §11.14), with optional branch/warehouse-level restriction.
5. **Every state-changing mutation must be audit-logged** — the actual `AuditLogEntry`
   shape already exists (see §4 below); every domain service's create/update/delete/
   suspend/reactivate action should produce one of these, mirroring how the current mock
   `auditApi.logEntry()` calls are threaded through `retainers.service.ts`,
   `plans.service.ts`, `tenants.service.ts` etc.
6. **Nothing generates a real accounting effect without a document.** This is the single
   most-repeated principle throughout the actual client answers and the resulting build
   (see `docs/plans/Sales-Invoicing-Implementation-Plan.md` Key Decisions #6/#11): money
   moving in any direction should always produce a real Invoice, Payment, or Adjustment
   record — never a bare balance mutation with no linked document. Enforce this at the
   service layer, not just trust callers.

---

## 3. Identity, Auth & Multi-Tenant Architecture

Source: `docs/architecture/Basic-Setup.md`, `src/types/identity.ts`,
`src/lib/dev/mock-identity.ts` (the current dev bypass — remove entirely once real auth
exists), `docs/requirements/Client-Requirements-Phase1.md` §2.

### `Me` (current shape, `src/types/identity.ts`)

```ts
type Realm = "admin" | "tenant";
type Me = {
  id: string;
  name: string;
  email: string;
  realm: Realm;
  permissions: string[]; // module/action pairs, e.g. "Invoice.Approve"
  tenant?: {
    id: string;
    name: string;
    subdomain: string;
    plan: string;
    activeModules: string[];
  };
};
```

### Endpoints needed

- `POST /auth/login` — `{ email, password }` → `Me` + session cookie. **Realm resolves
  server-side from the account, not a pre-login choice** — the old Client/Super Admin
  role-tab UI was deliberately removed for this reason (`Public-SuperAdmin-Plan.md`
  §2.5).
- `POST /auth/logout`
- `GET /auth/me` — the query every protected page's `AuthGate` calls on mount.
- `POST /auth/password/request-reset` — `{ email }`, triggers OTP send.
- `POST /auth/password/reset` — `{ email, otp, newPassword }`.
- `POST /tenant/signup` — `{ planId, company, owner }` → creates the tenant **immediately**
  (self-serve, not sales-assisted — `Public-SuperAdmin-Plan.md` §5 decision #2), returns
  `Me` + session cookie, same shape as login.

### Tenant isolation

Every table needs a `tenant_id` column; every query must filter by it from the
authenticated session, never from a client-supplied parameter. SRS §33.4 has the
proposed `tenants`/`branches` table shape.

### Subscription-status enforcement — currently missing entirely, must be server-side

**This is not built on the frontend at all today** — flagged explicitly in
`Public-SuperAdmin-Plan.md`'s "Status check": `AuthGate` only checks realm, never
subscription status. This has to be real backend middleware, not a frontend concern:

- Tenant status: `Active → Read-Only (expired) → Pending Deletion → Cancelled`.
- On expiry: **no grace period** — immediately read-only. Users can still authenticate,
  view, and export, but every state-changing endpoint (sales, invoices, stock
  movements — everything in §5–§8 below) must reject with a clear error once a tenant
  is `Read-Only` or later.
- Data deletion only after the tenant's **configurable retention window (default
  30–90 days)** post-suspension — a scheduled job, not immediate.

### Seat enforcement — also not built on the frontend, must be server-side

- Counts toward the seat limit: **owner, admin, staff, POS cashier** roles with an
  active login.
- **Does not count**: service/API accounts, read-only auditor accounts.
- `POST /tenant/users` (user invite/creation) must check
  `used_seats < base_seats + purchased_additional_seats` and **reject with a clear
  "upgrade your plan" error** — never silently allow overage billing.

---

## 4. Super Admin / Platform (`(admin)` realm)

Source: `src/app/(admin)/modules/*`, `docs/plans/Public-SuperAdmin-Plan.md` §3.

### 4.1 Tenants (`src/app/(admin)/modules/tenants/`)

**`Tenant`** (`types.ts`):

```ts
type TenantUserRole = "owner" | "admin" | "staff" | "pos-cashier" | "service-api" | "read-only-auditor";
type BillingCycle = "monthly" | "yearly";
type Tenant = {
  id: string; name: string; legalName: string; email: string; phone: string; address: string;
  planId: string;
  status: TenantStatus; // "active" | "read-only" | "pending-deletion" | "cancelled" — src/components/shared/status-badge.tsx
  billingCycle: BillingCycle;
  extraSeatsPurchased: number; // seats bought beyond the plan's baseSeats
  createdAt: string; renewalDate: string;
  pendingDeletionAt?: string; // set once status becomes "pending-deletion"
  users: TenantUser[]; // { id, name, email, role }
};
```

Endpoints (mirroring `api/tenants.service.ts`):

- `GET /admin/tenants` — list, with status/plan/search filters.
- `GET /admin/tenants/:id` — detail.
- `POST /admin/tenants/:id/suspend` — `status → "read-only"`. Audit-logged.
- `POST /admin/tenants/:id/reactivate` — `status → "active"`, clears `pendingDeletionAt`.
- `POST /admin/tenants/:id/seats` — `{ count }`, adds to `extraSeatsPurchased`.
- `PATCH /admin/tenants/:id` — general edit (name/contact/plan/billing cycle).

Seat usage: `used = users.filter(role in [owner,admin,staff,pos-cashier]).length`;
`total = plan.baseSeats + extraSeatsPurchased`.

MRR: reuse the exact same seat-pricing formula the public pricing page uses (see §5.1
below) — don't let these drift into two different calculations.

### 4.2 Plans & Pricing (`src/app/(admin)/modules/plans/`)

**`Plan`** (`src/types/plan.ts`) — shared between admin and public:

```ts
type Plan = {
  id: string; name: string;
  priceMonthly: number; priceYearly: number;
  baseSeats: number; additionalSeatPrice: number;
  trialDays: number;
  modules: ModuleKey[]; // src/lib/permissions/index.ts
  popular?: boolean;
  minSeats: number;
  maxSeats?: number; // undefined = unlimited
};
```

`ModuleKey` (`src/lib/permissions/index.ts`) — the full module-gating vocabulary, so
plans can gate modules ahead of those modules existing:
`"accounting" | "sales" | "purchasing" | "inventory" | "banking" | "crm" | "reports" |
"ai-assistant" | "pos" | "hr-payroll" | "calendar-booking" | "social-media"`.

Endpoints (`api/plans.service.ts`): `GET /plans`, `GET /plans/:id`, `POST /plans`,
`PATCH /plans/:id`, `DELETE /plans/:id`. **This is the single source of truth** both
`/pricing` and `/signup` must read from live — the current mock build does *not*
actually achieve this (flagged in `Public-SuperAdmin-Plan.md`'s Status check: `/pricing`
reads a static array, only synced with the admin store at initial load). A real backend
fixes this automatically once both sides call the same `GET /plans` endpoint.

### 4.3 Payments (`src/app/(admin)/modules/payments/types.ts`)

```ts
type PaymentTransactionType = "subscription_charge" | "additional_seat" | "refund";
type PaymentMethod = "card" | "bank" | "paypal";
type PaymentStatus = "paid" | "failed" | "pending" | "refunded";
type PaymentTransaction = {
  id: string; tenantId: string; tenantName: string; reference: string; planName: string;
  type: PaymentTransactionType; amount: number; method: PaymentMethod; status: PaymentStatus;
  date: string;
};
```

Read-only list today (`GET /admin/payments`, filterable by tenant/date/status) — actual
gateway integration (Stripe/Telr charge creation, webhooks for status updates, refund
issuance) doesn't exist on the frontend and needs to be built for real here.

### 4.4 Audit Log (`src/app/(admin)/modules/audit/types.ts`)

```ts
type AuditAction = "create" | "update" | "delete" | "suspend" | "reactivate" | "login" | "export";
type AuditLogEntry = {
  id: string; timestamp: string;
  userName: string; userEmail: string;
  tenantId: string | null; tenantName: string | null; // null = platform-level action
  module: string; entity: string; entityLabel: string;
  action: AuditAction;
  oldValues: Record<string, unknown> | null; newValues: Record<string, unknown> | null;
  ipAddress: string;
};
```

`GET /admin/audit` — platform-wide, filterable by tenant/module/action/date/user. Every
other module's mutations should insert here (see §2 rule 5) — this is the append-only
sink the whole platform writes to.

### 4.5 Settings (`src/app/(admin)/modules/settings/types.ts`)

Only 3 of 5 planned tabs are built on the frontend (General, Legal, Social links —
Notifications and Payment gateway toggles are **not built yet**, per
`Public-SuperAdmin-Plan.md`'s Status check). Build the backend for what exists now, and
be aware Platform Defaults (retention window, seat-limit-reached copy) doesn't have a
frontend home yet either — currently `RETENTION_DAYS` is a hardcoded constant in
`tenants.service.ts` and `RETAINER_ALERT_THRESHOLDS` similarly hardcoded in the tenant
Alerts module (§5.7) — both should become real configurable Settings fields backed by
one `GET/PATCH /admin/settings` endpoint once that tab exists.

```ts
type GeneralSettings = { platformName; logoUrl; tagline; contactEmail; maintenanceEnabled; maintenanceMessage };
type LegalSettings = { privacyBody; termsBody; privacyLastUpdated; termsLastUpdated }; // HTML, rendered on /privacy /terms
type SocialLinks = { linkedin; twitter; instagram };
```

---

## 5. Public site (`(public)` realm)

- `GET /plans` — reused from §4.2, public/no-auth variant (or the same endpoint, just
  unauthenticated-readable).
- `POST /tenant/signup` — reused from §3.
- `POST /contact` — the public contact form; currently backend-less on the frontend.

### 5.1 Seat-pricing formula (must match the admin MRM calculation exactly)

From `src/app/(public)/pricing/components/pricing-utils.ts` — this is the one piece of
business logic that must be replicated identically wherever price is computed
(pricing page, signup order summary, admin MRR figure):

```
extraSeats = max(0, seats - plan.baseSeats)
monthly total = plan.priceMonthly + extraSeats * plan.additionalSeatPrice
yearly total  = plan.priceYearly + extraSeats * round(plan.additionalSeatPrice * 12 * 0.8)
```

Per-plan seat range clamp (`clampSeatsForPlan`): a plan's effective seat count for
pricing is `min(plan.maxSeats ?? ∞, max(plan.minSeats, requestedSeats))` — never price a
plan outside its own configured range.

---

## 6. Sales & Invoicing (tenant realm)

Source: `src/app/(tenant)/dashboard/invoices/` (relocated from `modules/billing/` — see
`docs/plans/Sales-Invoicing-Implementation-Plan.md` for the full history). This is the
most fully-specified module — every business rule below is a **client-confirmed
decision**, not a guess.

### 6.1 Customers (`modules/crm/types.ts`)

```ts
type Customer = {
  id: string; customerCode: string; // CUST-0001
  name: string; email: string; phone: string; address: string; trn: string; // UAE VAT number
  currency: Currency; creditLimit: number; openingBalance: number;
  status: "active" | "inactive";
};
```

`GET/POST/PATCH/DELETE /customers` — straightforward CRUD.

### 6.2 Invoices (`types.ts`, `api/invoices.service.ts`)

```ts
type InvoiceStatus = "draft" | "sent" | "partially-paid" | "paid" | "overdue" | "cancelled";
type InvoiceSource = "manual" | "estimate" | "recurring" | "pos" | "debit-note" | "credit-note" | "retainer" | "retainer-topup";
type InvoiceLine = {
  id: string; description: string; quantity: number; unitPrice: number; taxRate: number; total: number;
  productId?: string; warehouseId?: string; // links to Inventory — see §9
};
type Payment = { id: string; date: string; amount: number; method: PaymentMethod; reference?: string };
type PaymentMethod = "bank-transfer" | "card" | "cash" | "cheque" | "mobile-payment" | "retainer";
type Invoice = {
  id: string; number: string; // INV-0045 — own sequence, separate from POS-000001 (client decision, Q33)
  customerId: string; issueDate: string; dueDate: string; currency: Currency;
  lines: InvoiceLine[];
  subtotal: number; discountPercent?: number; discount: number; tax: number; total: number;
  paidAmount: number; status: InvoiceStatus; source: InvoiceSource;
  notes?: string; createdBy: string; createdAt: string; sentAt?: string; lastReminderAt?: string; cancelledAt?: string;
  payments: Payment[];
};
```

**Business rules to enforce server-side** (currently only client-side `zod`):

- **`overdue` is always computed, never stored** — `sent`/`partially-paid` + past
  `dueDate` with a balance remaining. Same for the `Proposal` and `Retainer` display
  statuses below — this "derived, never stored" pattern is used consistently throughout
  and should carry into the API layer as a computed field, not a cron job that writes
  the status.
- **Draft invoices reserve nothing** — no stock, no numbering commitment beyond a
  preview number. Client decision (`Client-Requirements-Phase1.md` §5.2).
- **Partial and multiple payments are supported** — `paidAmount` accumulates across
  `payments[]`; `fullyPaid = paidAmount >= total - 0.005` (float-safe threshold, copy
  this exact tolerance).
- **QR code**: default to a payment-link URL. **If the tenant's jurisdiction has
  e-invoicing/tax-QR mandates (e.g. ZATCA), the format must follow that instead** —
  unresolved which markets need this; confirm with the client before locking format
  (§5.4 in Client-Requirements-Phase1.md).
- **PDF generation**: currently just a client-side preview with a fake "Download PDF"
  toast — needs real server-side generation (Puppeteer/PDFKit per §1).

Endpoints: `GET /invoices`, `GET /invoices/:id`, `GET /invoices/next-number`,
`POST /invoices` (`{ input, mode: "draft"|"send", source? }`), `PATCH /invoices/:id`,
`POST /invoices/:id/send`, `POST /invoices/:id/record-payment`,
`POST /invoices/:id/cancel`, `POST /invoices/:id/send-reminder`.

### 6.3 Recurring Invoices (`recurring/types.ts`, `api/recurring.service.ts`)

```ts
type RecurrenceFrequency = "weekly" | "monthly" | "quarterly" | "yearly";
type RecurringTemplateKind = "invoice" | "retainer-topup"; // absent = "invoice"
type RecurringTemplate = {
  id: string; number: string; // REC-001
  customerId: string; description: string; currency: Currency; amount: number;
  frequency: RecurrenceFrequency; nextInvoiceDate: string;
  status: "active" | "paused";
  kind?: RecurringTemplateKind; retainerId?: string; // set when kind is "retainer-topup"
  lastInvoiceId?: string; lastGeneratedAt?: string; createdAt: string;
};
```

**Generation stays manual-trigger** ("Generate Now"), never a background scheduler —
explicit client decision (Q29). A normal `"invoice"` template generates a **draft** for
review; a `"retainer-topup"` template (§6.6) generates an **already-Paid** invoice
immediately, since that money has already arrived. **Recommended addition not yet
built**: a per-template `autoSend` opt-in (client answer to Q29 — draft-first by
default, with an option to switch a trusted template to auto-send) — flagged as a real
gap in `Client-Requirements-Phase1.md` §5.5, worth building alongside this endpoint.

### 6.4 Proposals (in `types.ts`, `api/proposals.service.ts`) — merged with "Estimates"

```ts
type ProposalStatus = "draft" | "sent" | "accepted" | "rejected"; // "expired" is derived, not stored
type Proposal = {
  id: string; number: string; // PRO-0001
  customerId: string; date: string; expiryDate: string; currency: Currency;
  lines: InvoiceLine[]; subtotal; discountPercent?; discount; tax; total: number;
  status: ProposalStatus; notes?: string; createdBy: string; createdAt: string;
  sentAt?: string; respondedAt?: string;
  convertedInvoiceId?: string; // set once "Convert to Invoice" has run
};
```

`POST /proposals/:id/convert-to-invoice` — creates a draft `Invoice` (`source:
"estimate"`) prefilled from the proposal, marks the proposal `accepted` with
`convertedInvoiceId`. **A converted proposal can never be converted again** — check
`convertedInvoiceId` server-side, don't trust the client to only call this once.

### 6.5 Credit & Debit Notes (`Adjustment` in `types.ts`, `api/adjustments.service.ts`)

One entity for both — not two separate types, matches the client's own "one Credit Note
object with optional linked-return/linked-refund flags" instruction (Q30):

```ts
type AdjustmentKind = "credit" | "debit";
type AdjustmentStatus = "issued" | "void";
type Adjustment = {
  id: string; number: string; // CN-0001 / DN-0001
  kind: AdjustmentKind; customerId: string; invoiceId?: string;
  amount: number; reason: string; currency: Currency;
  status: AdjustmentStatus; createdBy: string; createdAt: string; voidedAt?: string;
};
```

- **Issued immediately on create — no draft stage.** It's a record of something that
  already happened, not a document awaiting a response.
- `POST /adjustments/:id/convert-to-invoice` — **only for standalone notes** (no
  `invoiceId`) — generates a real Invoice for the amount: **positive** for a debit note
  (`source: "debit-note"`), **negative** for a credit note (`source: "credit-note"`),
  per explicit client direction so a refund leaves a real invoice/ledger entry.
- **Not yet built on the frontend, but required by the client's Q30 answer**: the
  "linked return" flag — a credit note tied to a physical product return should also
  trigger Inventory's return flow (sellable → back to stock; damaged → quarantine
  status, see §9). This wasn't built because Inventory wasn't connected to Sales at
  build time — build both sides together, or add `linkedReturn`/`returnCondition`
  fields to `Adjustment` now and wire the trigger once Inventory's real API exists.

### 6.6 Retainers (`Retainer` in `types.ts`, `api/retainers.service.ts`) — the most-specified entity in this codebase

This has its own extensive client Q&A round (`docs/source/client-qa-retainers.md`) and
14 recorded Key Decisions in `Sales-Invoicing-Implementation-Plan.md` — read that file's
Phase E/H sections in full before implementing this; summarized here.

```ts
type RetainerBillingPeriod = "monthly" | "quarterly" | "yearly";
type RetainerStatus = "active" | "paused" | "closed"; // "expired" is derived, never stored
type RetainerDispositionReason = "forfeited" | "refunded" | "transferred" | "rolled-over";
type RetainerUsage = { id: string; date: string; amount: number; note?: string };
type Retainer = {
  id: string; number: string; // RET-0001
  customerId: string; contractAmount: number; billingPeriod: RetainerBillingPeriod;
  billingModel: "one-time" | "recurring";
  remainingBalance: number; currency: Currency; status: RetainerStatus;
  startDate: string; expiryDate?: string;
  notes?: string; createdBy: string; createdAt: string;
  usage: RetainerUsage[];
  fundingInvoiceId?: string;
  dispositionReason?: RetainerDispositionReason;
  transferredToRetainerId?: string; rolledOverFromRetainerId?: string; rolledOverToRetainerId?: string;
  refundAdjustmentId?: string;
};
```

**Server-enforced business rules** (all client-confirmed or client-philosophy-inferred —
see Key Decisions #6–14 for the full reasoning on each):

1. **Funding**: creating a retainer generates and immediately marks Paid a funding
   Invoice (`source: "retainer"`, `method: "bank-transfer"`) for the full
   `contractAmount`.
2. **Drawing**: `POST /retainers/:id/draw-for-invoice` deducts
   `min(invoice.total, remainingBalance)` — **never more than what's left, no override,
   ever** (Key Decision #10, hard cap is permanent). If that's less than the invoice
   total, record it as a **partial payment** (`method: "retainer"`) — the invoice
   becomes `"partially-paid"` the normal way; **no separate split-payment mechanism
   needed**, this reuses the existing partial-payment status (Key Decision #13).
3. **Every draw must generate a real Invoice** — there is deliberately no invoice-less
   "record usage" endpoint; that path existed once and was retired (Key Decision #11).
4. **Draws are always auto-paid when the retainer covers them** — no confirm-first step
   (Key Decision #12, directly from the client's wording).
5. **Recurring top-up**: `POST /recurring-templates/:id/generate` on a
   `kind: "retainer-topup"` template creates an already-Paid invoice
   (`source: "retainer-topup"`) and **adds** to `remainingBalance` — **never resets it**
   (Key Decision #14).
6. `POST /retainers/:id/transfer` `{ toRetainerId }` — moves the *entire*
   `remainingBalance` to another active retainer for the same customer; zeroes and
   closes the source (`dispositionReason: "transferred"`). Self-serve, no approval.
7. `POST /retainers/:id/roll-over` `{ newExpiryDate }` — closes this retainer, creates a
   new one seeded with the leftover balance, linked both ways
   (`rolledOverFromRetainerId`/`rolledOverToRetainerId`). **No new funding invoice** —
   the money's already documented on the original contract. Self-serve, no approval.
8. `POST /retainers/:id/forfeit` — balance zeroed, **no invoice generated** (money's
   already recognized as revenue at funding time — see the reasoning in
   `Sales-Invoicing-Implementation-Plan.md` if this decision is revisited).
   **Approval-gated.**
9. `POST /retainers/:id/refund` `{ reason }` — issues a **standalone** credit
   `Adjustment` (no `invoiceId` — the funding invoice reference goes in the reason text
   instead, since `convertToInvoice` only accepts unlinked notes) for `remainingBalance`,
   then converts it to a real negative-value invoice. **Approval-gated.**
10. **Approval gate for #8/#9**: `retainer.approve` permission, checked the same way
    every other permission is (§2 rule 4) — held by the **tenant's own Owner/Admin**,
    not platform staff (this specific detail was inferred, not client-confirmed — flag
    for sanity-check per the note below).

**Explicitly unresolved by the client** (Key Decisions #10–14 in the plan doc are
*inferred* defaults, not re-confirmed answers) — worth a sanity check with the client
before this ships to production, even though it's already built and functioning:
overdraw-with-approval was decided against, every draw requiring an invoice, no
confirm-step on draws, split draws via partial-payment, and rollover-not-reset — all
five are reasoned inferences from the client's philosophy elsewhere, not direct answers.

### 6.7 Alerts (`src/app/(tenant)/modules/alerts/`)

Deliberately **computed live from retainer data on every read, never stored** — no
background job, no alerts table. `GET /alerts` should replicate this: scan active/paused
retainers for `expiryDate` within `RETAINER_ALERT_THRESHOLDS.expiringWithinDays` (14) or
`remainingBalance` percentage below `lowBalancePercentRemaining` (20%) and return
computed alert objects. Both thresholds should become real configurable Settings values
(see §4.5) rather than hardcoded constants once that Settings tab exists.

### 6.8 Reports

Three tabs, all deriving from the primary entities above — **no separate reporting
dataset**, everything reads live from Invoices/Payments/Adjustments/Customers:

- Sales Report — 12-month invoiced-vs-collected trend.
- Invoice Report — every invoice, status-filterable.
- Customer Statement — one customer's running-balance ledger (opening balance + every
  non-cancelled invoice/payment/issued adjustment, chronological). This is also where
  retainer activity surfaces, since retainer funding/draws are just regular
  invoices/payments underneath.

All three need CSV export.

---

## 7. Product-linking on invoice lines (built, isolated demo data — not connected to Inventory yet)

`InvoiceLine.productId`/`warehouseId` exist and are now actually populated by the
frontend (`src/app/(tenant)/dashboard/invoices/components/line-items-editor.tsx`,
`product-picker.tsx`), **but they're populated from an isolated demo dataset**
(`api/product-lookup.service.ts`, `mock/product-lookup-seed.ts`) — 10 products across 5
named warehouses with a made-up per-warehouse stock breakdown, deliberately **not**
imported from the real Inventory module (see §9). This was a deliberate choice to avoid
touching Inventory's code while still delivering a working line-item UI.

**When building the real backend, this demo service should be deleted outright** and
`GET /inventory/products?warehouseId=` (§9) substituted in its place — the frontend
component contract (`ProductLookupItem { id, name, sku, price, stockByWarehouse }`,
`WarehouseOption { id, name }`) is designed to be a drop-in match for what a real
Inventory products endpoint should return, specifically so this swap requires minimal
frontend rework.

---

## 8. POS Module — not built at all yet (frontend or backend)

Nothing exists for POS anywhere in the codebase — correctly sequenced last, since it
depends on both Sales & Invoicing and Inventory being connected first (see §9's closing
note). When scoping this, the full requirement set is already captured in
`docs/requirements/Client-Requirements-Phase1.md` §4 — register↔warehouse binding,
offline capability rules, sync-conflict handling, session/cash management, split
payments, refund/return/exchange, manager PIN gating, and separate POS-vs-Invoice
numbering sequences. All of it is client-confirmed, none of it is built.

---

## 9. Inventory & Procurement

Source: `src/app/(tenant)/dashboard/(inventory)/`,
`docs/plans/Inventory-Implementation-Plan.md`. **UI-complete against mock data** — every
mutating dialog has an explicit `// TODO: replace with …Api.… once the inventory API
exists` marker, making this module the most mechanically straightforward swap of all of
them: build the endpoint, delete the TODO, done. No business-logic archaeology required
the way Retainers needed.

### 9.1 Known architecture gap to fix in the real schema (not present in the mock data)

**Stock is not tracked per warehouse today** — `Product.stock` is a single global
number; `Warehouse` only holds aggregate stats. The real schema needs a genuine
`(product_id, warehouse_id) → quantity` relationship — this is a prerequisite for
correctly implementing §9.2 onward, not an optional nice-to-have; it's what "register
bound to one warehouse" (POS) and "which warehouse does this invoice ship from" (§7)
both depend on.

### 9.2 Entities (fields pulled from the actual mock-data files)

**Product** (`products/mock-data.ts`):
```ts
type ProductStatus = "active" | "inactive";
interface Product { id; name; sku; category: ProductCategory; stock: number; price: number; status: ProductStatus }
```
*(Real schema: replace `stock: number` with the per-warehouse relationship above.)*

**Warehouse** (`warehouses/mock-data.ts`):
```ts
type WarehouseStatus = "active" | "inactive";
interface Warehouse { id; name; location; manager; totalItems; totalValue; capacity; occupancy; status; address; contactNumber; email; createdAt; stockByCategory: { category, items }[] }
```

**StockMovement** (`stock-movement/mock-data.ts`):
```ts
type MovementKind = "inbound" | "outbound" | "adjustment" | "transfer";
type MovementStatus = "completed" | "pending" | "cancelled";
interface StockMovement { id; datetime; kind: MovementKind; productName; sku; category; sourceWarehouse: string | null; destinationWarehouse: string | null; quantity: number; reference: string; status: MovementStatus }
```
Real schema: `sourceWarehouse`/`destinationWarehouse` need to be real FKs, not names;
`reference` should be a real FK to whatever created the movement (invoice, PO, transfer,
adjustment) not a free-text string. **This is the ledger everything else writes into —
build it first.**

**Batch** (`batches/mock-data.ts`) — FEFO tracking:
```ts
type BatchStatus = "active" | "expiring-soon" | "expired"; // derived from expDate, never stored
interface Batch { id; productName; sku; category; warehouse; quantity; mfgDate; expDate; notes; archived }
```
Status derivation: `expired` if `expDate < today`; `expiring-soon` if within 30 days.
**Not built yet on the frontend**: any real consumption mechanism (which batch a sale
actually draws from) — today this is a display-only tracking list, no FEFO
selection algorithm exists. Needs real design work before it can connect to sales.

**GoodsReceipt / PurchaseOrder** (`goods-receipt/mock-data.ts`):
```ts
type ReceiptStatus = "pending" | "partially-received" | "completed" | "overdue";
interface ReceiptLine { productId; sku; name; unit; expectedQty; receivedQty }
interface GoodsReceipt { id; poNumber; supplier; supplierContact; warehouse; expectedItems; receivedItems; receiptDate: string | null; expectedDate; status; lines: ReceiptLine[] }
interface PurchaseOrderLine { productId; sku; name; unit; orderedQty; receivedQty }
interface OpenPurchaseOrder { poNumber; supplier; supplierContact; warehouse; expectedDate; /* + lines */ }
```
**Client-confirmed rules**: stock increases **only on GR confirm/post**, never at PO
creation or vendor-bill entry (Q9). **Partial receipt supported** — PO tracks
received-vs-ordered per line, stays "Open" until fully received or manually closed
(Q10). **Vendor Bill never moves stock independently** — Goods Receipt is the only
inventory-affecting event; the bill is purely financial (Q13).

**StockAdjustment** (`adjustments/mock-data.ts`) — inventory count corrections, **not**
the same concept as Sales' `Adjustment` (credit/debit notes) despite the shared name:
```ts
type AdjustmentType = "add" | "deduct";
type AdjustmentReason = "damage" | "theft" | "audit" | "expiry" | "other";
type AdjustmentStatus = "approved" | "pending";
interface StockAdjustment { id; date; type; productName; sku; category; warehouse; quantity; reason; reference; status }
```
**Client-confirmed**: requires Owner/Manager approval (Q5) — the "approve" action has no
UI trigger built yet (flagged as an open question in `Inventory-Implementation-Plan.md`).

**PurchaseReorder / LowStockItem** (`reorder/mock-data.ts`):
```ts
type ReorderStatus = "draft" | "pending-approval" | "ordered" | "received";
interface LowStockItem { sku; productName; category; warehouse; currentQty; minStock; reorderPoint; lastRestocked; supplier }
interface PurchaseReorder { id; sku; productName; category; supplier; requestedQty; status; expectedDelivery; notes }
```
Suggested reorder quantity formula (already implemented client-side, replicate
server-side too): `max(reorderPoint * 2 - currentQty, 1)`. **Client-confirmed**: PO
requires Owner/Manager approval (Q4).

**StockTransfer** (`stock-transfer/mock-data.ts`):
```ts
type TransferStatus = "pending" | "in-transit" | "completed" | "cancelled";
interface StockTransfer { id; fromWarehouse; toWarehouse; productName; sku; category; quantity; unit; transferDate; expectedDelivery; status }
```
**Client-confirmed full workflow** (Q11) — not a direct move: **Request → Approve →
Dispatch → Receive**. Stock leaves the source warehouse *at Dispatch* (moves to an
"in-transit" state) and only lands at the destination *at Receive* — this is what gives
visibility into transfers that go missing or arrive short. Requires Owner/Manager
approval (Q5, same as adjustments).

**ValuationRow** (`valuation/mock-data.ts`) — read-only analytics, FIFO/WAC. **Client
decision (Q8)**: **Weighted Average Cost for Phase 1** (not FIFO) — simpler, no
per-batch cost-layer tracking needed. FIFO flagged as a future per-tenant setting for
price-volatile (import/export) tenants, not built now.

### 9.3 Negative stock — the one rule that applies across every mutating endpoint above

**Client-confirmed (Q6, and again for POS specifically in Q17/Q18)**: negative stock is
**allowed**, never hard-blocked — but the resulting state must be flagged **PENDING —
stock confirmation missing** for reconciliation, not silently treated as normal. This
needs to be a real state on the stock record (or the movement), not just a UI toast.
**Exact reconciliation UX is not specified by the client** — build the flag/state
faithfully, but the workflow that clears it is an open question worth raising before
finalizing.

### 9.4 Sequencing (mirrors `Inventory-Implementation-Plan.md`'s dependency order)

1. Products + Warehouses + the real per-warehouse stock relationship (§9.1) — nothing
   else works without this.
2. Stock Movement ledger (§9.2) — the central sink every other mutation writes into.
3. Goods Receipt / Purchase Orders.
4. Stock Transfer (Request→Approve→Dispatch→Receive).
5. Adjustments, Reorder, Batches, Valuation.
6. Swap `product-lookup.service.ts` (§7) for the real Inventory endpoint — this is the
   join point with Sales & Invoicing.

---

## 10. Open questions to resolve before/while building

Collected from every module — nothing here should be silently assumed by whoever builds
the backend:

1. **Sub-role structure beyond one flat Super Admin role** — SRS names three platform
   tiers, Phase 1 decided one; revisit only if real usage demands it.
2. **Payment gateway credential storage/rotation process** — not specified beyond
   "Stripe, Telr, PayPal."
3. **Two-vs-three "realm" architecture** — still open per `Project-Structure.md` §7.
4. **Branch-level vs. warehouse-level permission interaction** — SRS mentions both as
   supported restriction types, doesn't specify how they combine.
5. **Negative-stock reconciliation workflow** — the *state* is decided (§9.3), the
   *resolution UX* isn't.
6. **Serial-number tracking scope** — SRS says "where required," no client confirmation
   of which categories need it.
7. **Exact POS hardware models** (barcode scanner, receipt printer, cash drawer) — this
   question was left blank by the client (Q20).
8. **Tax-QR code format per jurisdiction** — payment-link is the default; e-invoicing
   mandates (ZATCA etc.) need confirming per target market before locking format.
9. **Delivery/Fulfillment as a real module** — the requirement is fully answered (Q12:
   auto-trigger for POS, manual/delivery-note for B2B), but no document/endpoint exists
   for it yet on either side of the stack.
10. **Retainer Key Decisions #10–14** — five working defaults inferred from the client's
    philosophy, never directly re-confirmed. Listed in full in §6.6 above.
11. **Who approves retainer Forfeit/Refund** — defaulted to tenant Owner/Admin, not
    platform staff; an inference, not a direct answer (§6.6, rule 10).
