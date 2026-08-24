# Backend Build Guide

## Purpose

Every module in this repo is currently a frontend mock — a `*.service.ts` file
wrapping an in-memory array in `async` functions with a fake delay, called via React
Query exactly like a real API would be. Swapping a mock service's body for a real
`fetch()` is meant to be a one-file change with zero changes in any component that
consumes it.

This doc is the module-by-module contract for that swap: entity shapes (copied from the
actual TypeScript types, not redescribed from memory — paths given so you can diff
against the real thing), the endpoints each mock service implies, and — the part that
actually matters, since it's not visible from types alone — **which business rules only
exist as client-side `zod` checks today and need real server-side enforcement.**

This is **not** a schema doc. `docs/source/inv-pos-hr-tenant-SRS.md` §33 has a proposed
Postgres schema; pair it with this.

**This project is large and still growing** (Phase 2 = Inventory just landed, Phase 3 =
POS/HR/Payroll/Calendar/Social is still ahead — see `docs/architecture/Project-Structure.md`
§5). Treat every shape below as a *starting* contract, not a final spec:

- Prefer additive migrations (nullable columns, new tables) over rigid constraints that
  fight the next phase.
- Where a field is a fixed union today (`InvoiceStatus`, `AdjustmentReason`,
  `TransferStatus`, etc.), consider whether it should be backed by a lookup table
  instead of a hard `CHECK`/`ENUM` — several of these are explicitly expected to gain
  values as the client's Q&A rounds continue (see §9 open questions).
- Every domain below will eventually need pagination, filtering, and bulk-export
  endpoints beyond what's listed — the lists here are what today's UI calls, not a
  ceiling.

Stack, per the signed proposal (`docs/source/MRM_Project_Proposal_v2.pdf` §4): Node.js
(Express) or Laravel, PostgreSQL, SendGrid, Twilio, FCM, Stripe + Telr, server-side PDF
(Puppeteer/PDFKit). Nothing below is prescriptive about framework choice beyond that.

---

## 1. Cross-cutting rules

1. **Multi-tenant on every table, every query.** `tenant_id` filtered server-side from
   the session — never from a client-supplied param.
2. **Fixed predefined RBAC roles** — Owner, Admin, Inventory Manager, Sales/Cashier,
   Accountant, Viewer (no custom role builder in Phase 1). Permissions are
   module/action pairs (`Invoice.Approve`, `Inventory.Adjust`, ...), optionally scoped
   to a branch/warehouse.
3. **No full double-entry accounting yet** — mutating endpoints should emit a
   structured integration event (queue message or `integration_events` row) with
   enough data for a future Accounting module to build a journal entry, not a full
   ledger post.
4. **Every mutation gets audited** — see §3.4's `AuditLogEntry` shape; every
   create/update/delete/suspend/reactivate across every module writes one row.
5. **Single base currency per tenant**, transactions optionally in a foreign currency
   converted at transaction-date rate.
6. **Every money movement needs a document.** No bare balance mutation — always a
   real Invoice/Payment/Adjustment behind it.
7. **Subscription-status gating is not built on the frontend at all** and must be real
   middleware: `Active → Read-Only (expired, no grace period) → Pending Deletion
   (configurable retention, default 30–90 days) → Cancelled`. Every state-changing
   endpoint across every module must reject once a tenant is past `Active`.
8. **Seat enforcement is also not built on the frontend.** Counts: owner/admin/staff/
   POS-cashier logins. Doesn't count: service accounts, read-only auditors. Reject user
   creation past the seat cap with an upgrade-plan error, never silent overage billing.

---

## 2. Identity & Auth

`src/types/identity.ts` — `Me { id, name, email, realm: "admin"|"tenant", permissions:
string[], tenant?: { id, name, subdomain, plan, activeModules } }`.

- `POST /auth/login`, `POST /auth/logout`, `GET /auth/me`
- `POST /auth/password/request-reset`, `POST /auth/password/reset`
- `POST /tenant/signup` — self-serve, creates the tenant immediately (not
  sales-assisted), returns `Me` + session, same shape as login.
- **Realm resolves server-side from the account** — never a pre-login client choice.

---

## 3. Super Admin / Platform

Source: `src/app/(admin)/modules/*`.

### 3.1 Tenants (`modules/tenants/`)

`Tenant { id, name, legalName, email, phone, address, planId, status, billingCycle,
extraSeatsPurchased, createdAt, renewalDate, pendingDeletionAt?, users: TenantUser[] }`.

`GET /admin/tenants[/:id]`, `POST /admin/tenants/:id/suspend`,
`POST /admin/tenants/:id/reactivate`, `POST /admin/tenants/:id/seats { count }`,
`PATCH /admin/tenants/:id`.

Seat usage / MRR: reuse the exact same seat-pricing formula as §5.1 (public pricing) —
don't let admin and public compute this two different ways.

### 3.2 Plans (`modules/plans/`)

`Plan` (`src/types/plan.ts`): `{ id, name, priceMonthly, priceYearly, baseSeats,
additionalSeatPrice, trialDays, modules: ModuleKey[], popular?, minSeats, maxSeats? }`.

`GET /plans[/:id]`, `POST /plans`, `PATCH /plans/:id`, `DELETE /plans/:id`. This must be
the single live source both `/pricing` and `/signup` read from — today they don't
actually share state (`plansService` is a client-side mock with no cross-tab sync); a
real `GET /plans` fixes that automatically.

`ModuleKey` (`src/lib/permissions/index.ts`) already lists every module across all
three phases (`accounting`, `sales`, `purchasing`, `inventory`, `banking`, `crm`,
`reports`, `ai-assistant`, `pos`, `hr-payroll`, `calendar-booking`, `social-media`) —
plans can gate a module ahead of it existing, so don't tie this table to only what's
built today.

### 3.3 Payments (`modules/payments/types.ts`)

`PaymentTransaction { id, tenantId, tenantName, reference, planName, type:
"subscription_charge"|"additional_seat"|"refund", amount, method: "card"|"bank"|
"paypal", status: "paid"|"failed"|"pending"|"refunded", date }`.

Read-only list today (`GET /admin/payments`) — real gateway integration (charge
creation, webhooks, refunds) doesn't exist on the frontend and is genuinely new work.

### 3.4 Audit Log (`modules/audit/types.ts`)

`AuditLogEntry { id, timestamp, userName, userEmail, tenantId: string|null, tenantName:
string|null, module, entity, entityLabel, action: "create"|"update"|"delete"|"suspend"|
"reactivate"|"login"|"export", oldValues, newValues, ipAddress }`.

`GET /admin/audit`, filterable by tenant/module/action/date/user. This is the sink
every other module's mutations write into (§1 rule 4).

### 3.5 Settings (`modules/settings/types.ts`)

Only General/Legal/Social are built on the frontend; Notifications and Payment-gateway
toggles don't exist yet. `RETENTION_DAYS` and retainer alert thresholds (§6.7) are
currently hardcoded constants that should become real fields on this settings object.

---

## 4. Public site

`GET /plans` (public-readable variant of §3.2), `POST /tenant/signup` (§2),
`POST /contact`.

**Seat-pricing formula** — must match everywhere price is computed
(pricing page, signup summary, admin MRR):

```
extraSeats = max(0, seats - plan.baseSeats)
monthly = plan.priceMonthly + extraSeats * plan.additionalSeatPrice
yearly  = plan.priceYearly + extraSeats * round(plan.additionalSeatPrice * 12 * 0.8)
effectiveSeats = min(plan.maxSeats ?? Infinity, max(plan.minSeats, requestedSeats))
```

---

## 5. Sales & Invoicing

Source: `src/app/(tenant)/dashboard/invoices/`. The most fully client-confirmed module
— every rule below traces back to `docs/plans/Sales-Invoicing-Implementation-Plan.md`'s
Key Decisions or `docs/source/client-qa-retainers.md`.

### 5.1 Customers (`../modules/crm/types.ts`)

`Customer { id, customerCode, name, email, phone, address, trn, currency, creditLimit,
openingBalance, status: "active"|"inactive" }`. Plain CRUD.

### 5.2 Invoices

```ts
type InvoiceStatus = "draft" | "sent" | "partially-paid" | "paid" | "cancelled";
type InvoiceSource = "manual" | "estimate" | "recurring" | "pos" | "debit-note" | "credit-note" | "retainer" | "retainer-topup";
type InvoiceLine = { id; description; quantity; unitPrice; taxRate; total; productId?: string; warehouseId?: string };
type Payment = { id; date; amount; method: "bank-transfer"|"card"|"cash"|"cheque"|"mobile-payment"|"retainer"; reference? };
type Invoice = {
  id; number; // INV-0045, own sequence, separate from POS-000001
  customerId; issueDate; dueDate; currency; lines: InvoiceLine[];
  subtotal; discountPercent?; discount; tax; total; paidAmount;
  status: InvoiceStatus; source: InvoiceSource;
  notes?; createdBy; createdAt; sentAt?; lastReminderAt?; cancelledAt?;
  payments: Payment[];
};
```

**`overdue` is never a stored status** — computed as `sent`/`partially-paid` past due
with a balance remaining. Same derive-don't-store pattern applies to Proposals (§5.4)
and Retainers (§5.6).

Rules to enforce server-side (currently `zod`-only): drafts reserve nothing; multiple
partial payments accumulate (`paidAmount`, `fullyPaid = paidAmount >= total - 0.005`);
QR defaults to a payment link, but **swap to the jurisdiction's e-invoicing format
(e.g. ZATCA) if the tenant's market mandates it** — unresolved which markets need this,
confirm before locking format; PDF generation needs to move server-side.

Endpoints: `GET /invoices[/:id]`, `GET /invoices/next-number`, `POST /invoices { input,
mode: "draft"|"send", source? }`, `PATCH /invoices/:id`, `POST /invoices/:id/send`,
`POST /invoices/:id/record-payment`, `POST /invoices/:id/cancel`,
`POST /invoices/:id/send-reminder`.

### 5.3 Recurring Invoices (`recurring/types.ts`)

`RecurringTemplate { id, number, customerId, description, currency, amount, frequency:
"weekly"|"monthly"|"quarterly"|"yearly", nextInvoiceDate, status: "active"|"paused",
kind?: "invoice"|"retainer-topup", retainerId?, lastInvoiceId?, lastGeneratedAt?,
createdAt }`.

**Generation is manual-trigger only ("Generate Now") — never a background scheduler**,
explicit client decision. `"invoice"` templates generate a draft; `"retainer-topup"`
templates generate an already-paid invoice. Worth adding a per-template `autoSend`
opt-in when you build this — flagged as a real gap, not built on the frontend.

### 5.4 Proposals

Merged with "Estimates". `Proposal { id, number, customerId, date, expiryDate,
currency, lines, subtotal, discountPercent?, discount, tax, total, status: "draft"|
"sent"|"accepted"|"rejected", notes?, createdBy, createdAt, sentAt?, respondedAt?,
convertedInvoiceId? }`. `"expired"` is derived (`sent` + past expiry), never stored.

`POST /proposals/:id/convert-to-invoice` → draft Invoice (`source: "estimate"`), sets
`convertedInvoiceId`. **Check that field server-side** — a converted proposal can't
convert twice.

### 5.5 Credit & Debit Notes (one entity, `kind` field — deliberately not two models)

`Adjustment { id, number, kind: "credit"|"debit", customerId, invoiceId?, amount,
reason, currency, status: "issued"|"void", createdBy, createdAt, voidedAt? }`.

Issued immediately, no draft stage. `POST /adjustments/:id/convert-to-invoice` — only
for standalone notes (`!invoiceId`) — positive-value invoice for debit, negative for
credit. **Not built on the frontend but required by the client's own answer here**: a
credit note tied to a physical return should also trigger Inventory's return flow
(sellable → restocked; damaged → quarantine). Add `linkedReturn`/`returnCondition`
fields now if you're building this alongside Inventory.

### 5.6 Retainers — most-specified entity in the codebase

Read `docs/plans/Sales-Invoicing-Implementation-Plan.md` Phase H / Key Decisions #6–14
and `docs/source/client-qa-retainers.md` before implementing — summarized:

```ts
type Retainer = {
  id; number; customerId; contractAmount; billingPeriod: "monthly"|"quarterly"|"yearly";
  billingModel: "one-time"|"recurring"; remainingBalance; currency;
  status: "active"|"paused"|"closed"; startDate; expiryDate?; notes?; createdBy; createdAt;
  usage: { id; date; amount; note? }[];
  fundingInvoiceId?; dispositionReason?: "forfeited"|"refunded"|"transferred"|"rolled-over";
  transferredToRetainerId?; rolledOverFromRetainerId?; rolledOverToRetainerId?; refundAdjustmentId?;
};
```

Server-enforced rules:

1. Creation generates a Paid funding Invoice (`source: "retainer"`) for the full amount.
2. `POST /retainers/:id/draw-for-invoice` deducts `min(invoice.total, remainingBalance)`
   — **hard cap, no override.** Shortfall becomes a normal partial payment
   (`method: "retainer"`) — no separate split-payment mechanism needed.
3. Every draw generates a real Invoice — no invoice-less "record usage" path.
4. Draws auto-pay when covered — no confirm step.
5. Recurring top-up (`kind: "retainer-topup"` template) generates a Paid invoice
   (`source: "retainer-topup"`) and **adds to** `remainingBalance`, never resets it.
6. `POST /retainers/:id/transfer { toRetainerId }` — moves full balance to another
   active retainer, closes source (`dispositionReason: "transferred"`). Self-serve.
7. `POST /retainers/:id/roll-over { newExpiryDate }` — closes this one, creates a new
   one seeded with the leftover, no new funding invoice. Self-serve.
8. `POST /retainers/:id/forfeit` — zeroes balance, no invoice. **Requires
   `retainer.approve` permission.**
9. `POST /retainers/:id/refund { reason }` — standalone credit `Adjustment` for
   `remainingBalance`, converted to a real negative-value invoice. **Requires
   `retainer.approve`.**

Rules 2–9 are inferred defaults reasoned from the client's philosophy elsewhere, not
directly re-confirmed — worth a sanity check with the client before this ships, even
though it's fully built and working. Same for who holds `retainer.approve` — currently
assumed to be the tenant's own Owner/Admin, not platform staff.

### 5.7 Alerts

Computed live on every read from retainer data — no alerts table, no background job.
`GET /alerts` should replicate: expiry within `expiringWithinDays` (14) or balance below
`lowBalancePercentRemaining` (20%). Move both thresholds into real Settings (§3.5)
rather than hardcoding.

### 5.8 Reports

Sales trend, Invoice list, Customer statement — all derive live from
Invoices/Payments/Adjustments/Customers, no separate reporting dataset. All three need
CSV export.

---

## 6. Product-linking on invoice lines (built, but isolated demo data)

`InvoiceLine.productId`/`warehouseId` are populated today by a real UI
(`components/product-picker.tsx`, `components/line-items-editor.tsx`) but from an
isolated 10-item demo catalog (`api/product-lookup.service.ts`,
`mock/product-lookup-seed.ts`, shapes `ProductLookupItem { id, name, sku, price,
stockByWarehouse }` / `WarehouseOption { id, name }`) — deliberately not wired to real
Inventory, to avoid touching that module mid-build.

**When building the real backend, delete this mock service and point the same frontend
component at `GET /inventory/products?warehouseId=`** — the shapes above were designed
to match what a real Inventory products endpoint should return, specifically for this
swap to be low-effort.

---

## 7. POS — not built at all yet, frontend or backend

Nothing exists. Full requirements are in `docs/requirements/Client-Requirements-Phase1.md`
§4 (register↔warehouse binding, offline mode, sync-conflict handling, cash sessions,
split payments, refund/return/exchange, manager PIN, separate POS numbering). Sequenced
last since it depends on Sales & Inventory already being connected.

---

## 8. Inventory & Procurement

Source: `src/app/(tenant)/dashboard/(inventory)/`. UI-complete against mock data, and
every mutating dialog has a `// TODO: replace with …Api…` marker — the most
mechanical swap of all the modules, no business-logic archaeology needed.

**Known gap to fix in the real schema**: stock isn't tracked per-warehouse today
(`Product.stock` is one global number) — the real schema needs a genuine
`(product_id, warehouse_id) → quantity` relationship. Everything else in this section
depends on that existing.

| Entity | Shape (source file) | Key rule |
| :--- | :--- | :--- |
| `Product` | `products/mock-data.ts`: `{ id, name, sku, category, stock, price, status }` | replace `stock` with the per-warehouse relationship above |
| `Warehouse` | `warehouses/mock-data.ts`: `{ id, name, location, manager, totalItems, totalValue, capacity, occupancy, status, address, contactNumber, email, createdAt, stockByCategory[] }` | — |
| `StockMovement` | `stock-movement/mock-data.ts`: `{ id, datetime, kind: "inbound"\|"outbound"\|"adjustment"\|"transfer", productName, sku, category, sourceWarehouse, destinationWarehouse, quantity, reference, status }` | **build this table first** — it's the ledger every other mutation below should write into. Real schema needs real FKs, not names/free-text |
| `GoodsReceipt` / `PurchaseOrder` | `goods-receipt/mock-data.ts` | stock increases **only on GR confirm/post**, never at PO creation or bill entry. Partial receipt supported — PO stays open until fully received or manually closed. Vendor Bill never moves stock independently |
| `StockAdjustment` | `adjustments/mock-data.ts`: `{ id, date, type: "add"\|"deduct", productName, sku, category, warehouse, quantity, reason, reference, status: "approved"\|"pending" }` | requires Owner/Manager approval — no UI trigger for that action exists yet |
| `PurchaseReorder` / `LowStockItem` | `reorder/mock-data.ts` | suggested qty = `max(reorderPoint * 2 - currentQty, 1)`; PO requires Owner/Manager approval |
| `StockTransfer` | `stock-transfer/mock-data.ts`: `{ id, fromWarehouse, toWarehouse, productName, sku, category, quantity, unit, transferDate, expectedDelivery, status }` | full workflow is **Request → Approve → Dispatch → Receive** — stock leaves source at Dispatch (goes in-transit), lands at destination only at Receive |
| `Batch` | `batches/mock-data.ts` | FEFO tracking, display-only today — no real consumption/selection algorithm exists yet, needs design work before it connects to sales |
| Valuation | `valuation/mock-data.ts` | **Weighted Average Cost for Phase 1** (not FIFO) — client-confirmed. FIFO flagged as a possible future per-tenant setting, not built now |

**Negative stock — applies across every mutating endpoint above**: allowed, never
hard-blocked, but must set a real `PENDING — stock confirmation missing` flag on the
affected stock record for reconciliation. The flag/state is client-confirmed; the
reconciliation workflow that clears it is not — raise before finalizing.

**Sequencing**: Products+Warehouses+per-warehouse stock → Stock Movement ledger →
Goods Receipt/PO → Stock Transfer → Adjustments/Reorder/Batches/Valuation → swap
`product-lookup.service.ts` (§6) for the real endpoint.

---

## 9. Open questions — don't silently assume answers here

1. Sub-role structure beyond one flat Super Admin role (SRS names three tiers, Phase 1
   shipped one).
2. Two-vs-three "realm" architecture — open per `Project-Structure.md` §7.
3. Negative-stock reconciliation *workflow* (the state itself is decided, §8).
4. Serial-number tracking scope — which categories need it isn't specified.
5. POS hardware models — left blank by the client.
6. Tax-QR format per jurisdiction — confirm before locking beyond the payment-link default.
7. Delivery/Fulfillment as a real module — requirement is answered (auto-trigger for
   POS, manual/delivery-note for B2B) but nothing exists yet on either side of the stack.
8. Retainer rules 2–9 in §5.6 — inferred defaults, not directly re-confirmed.
9. Who holds `retainer.approve` — assumed tenant Owner/Admin, not platform staff.
10. Branch-level vs. warehouse-level permission interaction — SRS supports both, doesn't
    specify how they combine.
