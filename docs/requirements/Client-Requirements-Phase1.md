# MRM Portal — Client Requirements (Phase 1)

## Purpose

A single reference for what the client actually needs, scoped to the five modules called
out as the **first two weeks / first phase** of delivery:

1. Super Admin Panel
2. Multi-Tenant Architecture
3. Inventory & Procurement
4. POS Module
5. Sales & Invoicing

**Source priority** — where sources disagree, higher wins:

1. **Client's direct answers** (`docs/source/client-qa-retainers.md`, `docs/source/client-qa-inventory-pos-tenant.md`) — authoritative, overrides everything below.
2. `docs/source/MRM_Project_Proposal_v2.pdf` — the signed-scope document (modules, hours, 14-week plan).
3. `docs/source/inv-pos-hr-tenant-SRS.md` — the detailed SRS the proposal was built from (functional requirements, workflows, DB design).
4. `docs/source/Client-proposal.md` — a cross-reference note comparing an earlier prototype against the proposal; used only to fill gaps.

Every requirement below is tagged **[Client decision]**, **[Proposal]**, or **[SRS]** so it's
traceable back to its source. Anything still genuinely open is listed under each module's
"Open questions" and again in the final section — nothing is silently assumed.

---

## 0. Cross-cutting decisions that apply across all five modules

These came out of the client's answers but aren't specific to one module — they set the
rules everything else in Phase 1 has to follow.

- **[Client decision]** Journal entries: in Phase 1, POS/Invoice/Inventory transactions
  create **structured integration events/records for the Accounting module — not full
  double-entry journal entries**. Full GL posting is a later-phase concern.
- **[Client decision]** RBAC in Phase 1 ships a **fixed set of predefined roles** (Owner,
  Admin, Inventory Manager, Sales/Cashier, Accountant, Viewer) — no custom role builder yet.
- **[Client decision]** Currency: each tenant gets a **single base currency**; individual
  transactions may be recorded in a foreign currency, converted to base at the
  transaction-date rate. True multi-currency ledgers are out of scope for Phase 1.
- **[SRS §11.14]** Permissions are module/action pairs (e.g. `POS.CreateSale`,
  `Invoice.Approve`, `Inventory.Adjust`) — supports branch-level and warehouse-level
  restriction, not just a flat role name.
- **[SRS §11.22–11.24]** Baseline non-functional expectations: HTTPS everywhere, tenant
  data logical isolation, backups, and standard availability/scalability targets — not
  itemized here since they're infrastructure, not a module requirement.

---

## 1. Super Admin Panel

**[Proposal]** Scope: multi-tenant management, plan tiers (Starter/Growth/Pro), Seat
Management (base seats per plan + additional purchase), subscription billing with
auto-disable on expiry, payment gateways (Stripe, Telr, PayPal), audit log.
**[Proposal — hours]** 37 hrs / 7.1% of the 520-hr estimate.

### 1.1 Seats — who counts, what happens at the limit
**[Client decision]** Every user account with an **active login** counts toward the seat
limit — Owner, Admins, Staff, and POS Cashiers alike. **Service/API accounts and
read-only auditors do not count.** When a tenant tries to add a user beyond their plan's
seat count, **block the creation** with a clear "upgrade your plan" message — no silent
allow, no grace overage.

- **[SRS §11.20]** `Available Seats = Base Plan Seats + Purchased Additional Seats`.
- **[SRS §22.20]** Flow: tenant creates a user → check seat availability → if unavailable,
  purchase an additional seat (payment) → seat limit increases → user created.

### 1.2 Subscription expiry — suspension, not deletion
**[Client decision]** **No grace period.** On expiry, the tenant moves to a
**read-only/suspended state immediately**: users can still log in, view, and export data,
but **cannot create new transactions** (sales, invoices, stock movements) until payment is
resolved. **Full data deletion only happens after a much longer retention window
(30–90 days)** — immediate suspension blocks new activity; it does not wipe data.

- Status states implied: **Active → Read-Only (expired) → Pending Deletion → Cancelled**
  (already the model `Public-SuperAdmin-Plan.md` builds against — this doc is the
  requirement source for that design).

### 1.3 Roles at the platform level
**[SRS §11.3]** Two tiers of user exist conceptually: Platform-Level (Super Admin,
Platform Administrator, Support/Admin Staff) and Tenant-Level. **However, per a separate
decision already recorded in `Public-SuperAdmin-Plan.md` §3.6, Phase 1 ships one flat
Super Admin role** — no separate Platform Administrator/Support Staff tiers yet. Flagged
here because the SRS names three; the actual Phase 1 decision narrows that to one.

### 1.4 What Super Admin manages
**[Proposal / SRS §11.26]**
- Tenant management (create, suspend, reactivate, view usage).
- Subscription plans (name, price, base seats, additional-seat price, module access per
  plan, trial length).
- Payment gateway configuration (Stripe, Telr, PayPal) and platform-wide payment
  transaction visibility.
- **Audit log** — platform-wide, every tenant, covering create/update/delete/suspend/
  reactivate actions with old/new values.
- Seat purchases and seat-limit enforcement (see 1.1).

### Open questions (Super Admin)
- Sub-roles beyond the single flat Super Admin role — not needed for Phase 1 per the
  existing decision, but the SRS's three-tier model suggests the client may want this
  revisited later.
- Exact payment gateway credential storage/rotation process — not specified by the client
  or SRS beyond "payment gateways: Stripe, Telr, PayPal."

---

## 2. Multi-Tenant Architecture

**[SRS §11.4]** Foundational, not a user-facing "module" — every other module depends on
this being correct.

### 2.1 What a tenant is
**[SRS §11.4]** Each business is a tenant/company. A tenant may have multiple branches,
warehouses, users, employees, POS terminals, bank accounts, currencies (per-transaction,
not per-ledger — see §0), and tax configurations. **Every business transaction must carry
a tenant/company reference.** Tenant data must be **logically isolated** — one tenant must
never see another's data.

### 2.2 Onboarding flow
**[SRS §22.2]**
```
Platform Admin creates Subscription Plan
  → Customer registers → Create Tenant/Company → Select Subscription
  → Create Tenant Owner → Configure Branches → Configure Warehouses
  → Configure Tax & Accounting → Create Roles → Invite Users
  → Import Products/Customers/Suppliers → System Ready
```

### 2.3 Core tenant data shape
**[SRS §33.4]** `tenants`: id, name, legal_name, email, phone, address, country, currency,
timezone, tax_number, status. `branches`: id, tenant_id, name, code, address, phone,
email, status — one tenant, many branches.

### Open questions (Multi-Tenant)
- **Two vs. three "realms"** (public marketing / Super Admin / tenant) — flagged as
  unresolved in `Project-Structure.md` §7, not answered by either Q&A file.
- Branch-level vs. warehouse-level permission granularity — the SRS mentions both as
  supported restriction types (§11.14) but doesn't specify how they interact for Phase 1.

---

## 3. Inventory & Procurement

**[Proposal]** Scope: Products & SKU catalogue, Multi-Warehouse, Batch Tracking, Purchase
Orders, Goods Receipt, Stock Transfers, Reorder Levels with low-stock alerts, Stock
Valuation, automatic stock movement triggered by invoices, bills and POS sales.
**[Proposal — hours]** 46 hrs / 8.8%.

### 3.1 Approvals
**[Client decision]** Purchase Orders **require approval** — **Owner/Manager**.
**[Client decision]** Inventory Adjustments and Stock Transfers **require approval** —
**Owner/Manager**.

### 3.2 Negative stock
**[Client decision]** **Transactions are allowed to go negative** — but the resulting
stock state is flagged **PENDING** pending **stock confirmation**, rather than being
silently accepted as normal. (This differs from a hard block *or* a silent allow — it's a
third state: allowed, but visibly flagged for reconciliation.)

### 3.3 Batch issuing rule
**[Client decision]** Default to **FEFO (first-expired, first-out)** for anything with an
expiry date — minimizes spoilage/waste. **Items without expiry tracking fall back to
FIFO.** Staff can still **manually override** the batch for a specific transaction (e.g. a
customer requests a specific batch); the system auto-suggests the FEFO/FIFO batch by
default so nobody has to think about it routinely.

### 3.4 Stock valuation method
**[Client decision]** **Weighted Average Cost** for Phase 1 — simpler to build (no
per-batch cost-layer tracking), works across most business types. **FIFO is the
documented alternative** for tenants in price-volatile import/export industries — flagged
as a **future per-tenant setting**, not built now.

### 3.5 Goods Receipt — when stock actually increases
**[Client decision]** Stock increases **only when the Goods Receipt is confirmed/posted**
— not at PO creation, not at vendor-bill entry. This ties "what's on the shelf" to a
physical, verifiable event.
**[Client decision]** **Partial Goods Receipt is supported** — the PO tracks
received-vs-ordered quantity **per line** and stays **"Open"** until fully received or
manually closed. (Vendors routinely ship in multiple batches; this is close to a hard
requirement.)
**[Client decision]** The **Vendor Bill never independently moves stock** — only the
Goods Receipt does. The bill is purely financial (records the payable, matches against
PO/GR). This avoids double-counting when a bill and receipt land at different times.

### 3.6 Stock Transfer workflow
**[Client decision]** Full **Request → Approve → Dispatch → Receive** workflow, not a
direct move. Stock leaves the source warehouse **at Dispatch** into an **"in-transit"**
state, and only lands in the destination warehouse **at Receive** — this gives visibility
into transfers that go missing, arrive short, or are delayed, which a single direct-move
step can't capture.

### 3.7 Reorder & low stock
**[SRS §11.8 / §22.8]** Reorder levels per product; a stock movement checks the reorder
level after updating quantity/valuation, and triggers an alert/task if low.

### 3.8 Stock movement types
**[SRS §11.8]** Purchase Receipt, Sales, Sales Return, Purchase Return, Warehouse
Transfer, Stock Adjustment, Opening Stock, Damage, Expiry, Manual Issue. **Every stock
movement creates an auditable inventory transaction** (no silent quantity edits).

### 3.9 Procurement workflow
**[SRS §11.9 / §22.6]**
```
Purchase Requisition → Manager Approval → Purchase Order → Supplier Confirmation
  → Goods Receipt → Inventory Increased → Purchase Invoice → Accounts Payable Created
  → Payment → Bank/Cash Reduced → Supplier Balance Updated → Accounting Updated
```

### Open questions (Inventory & Procurement)
- Exact "PENDING — stock confirmation missing" UX for negative-stock transactions (3.2) —
  the client confirmed the *state*, not the reconciliation workflow that clears it.
- Serial-number tracking (SRS mentions it "where required") — no client confirmation of
  which product categories need it.

---

## 4. POS Module

**[Proposal]** Scope: Web, Android, iOS apps, barcode scanner support, offline mode with
background sync, cash-drawer integration, real-time accounting/inventory sync.
**Windows is explicitly not a supported POS platform in this scope.**
**[Proposal — hours]** 52 hrs / 10.0% — the single largest line item in the estimate.

### 4.1 Register ↔ warehouse binding
**[Client decision]** Every POS Register is configured with **a single linked
warehouse/location**, and all sales through that register deduct from that warehouse's
stock. Essential for multi-location retail chains to keep per-site stock accurate.

### 4.2 Offline capability — what's allowed offline
**[Client decision]** Offline-allowed: **sales** (core operation), **basic customer
lookup/creation**, and **standard pre-configured discounts** (percentage/fixed rules
already synced to the device). **Reserved for online-only**: **refunds** and
**manager-override discounts** — higher fraud/error risk, safer once the register has live
data to verify against.
**[Client decision]** If live stock can't be verified while offline, **the sale still
proceeds** — blocking a sale over a connectivity issue is worse than an occasional
oversell that gets reconciled afterward.

### 4.3 Offline sync conflicts
**[Client decision]** **"Sync in timestamp order, allow negative stock temporarily"**:
when multiple offline registers sell the same low-stock item, **accept all transactions
as valid sales** (never reject a completed customer sale after the fact) — let stock go
negative if oversold, and **surface an alert to the Inventory Manager** to reconcile/
restock. The system does not try to programmatically "undo" a completed sale.
**[Client decision]** Failed sync: **automatic retry with exponential backoff** first,
escalating to a **manual-resolution queue** only after repeated failures — surfaced to an
admin with the full transaction payload so nothing is silently lost.

- **[SRS §11.5 / §22.4]** Offline transactions are stored locally with: offline
  transaction ID, device ID, terminal ID, timestamp, local sequence number, transaction
  payload, sync status. Server prevents duplicate creation via an **idempotency key** on
  sync.

### 4.4 Session & cash management
**[Client decision]** POS register **opening/closing and end-of-day cash reconciliation
are required.**
**[Client decision]** **Split payments are supported.**
**[Client decision]** **Refund, partial refund, return, and exchange** are all supported
POS operations.
**[Client decision]** **Manager approval/PIN is required** for POS discounts, voids, and
refunds.

### 4.5 Returns — sellable vs. damaged
**[Client decision]** **Sellable-condition returns** automatically go back into available
stock at the original warehouse. **Damaged returns** route to a distinct **"damaged/
quarantine" stock status** — not sellable, not counted in available inventory — rather
than being deleted or silently mixed back into sellable stock. A manager can then write
them off via the standard Inventory Adjustment flow.

### 4.6 Sale → accounting/inventory flow
**[SRS §22.3 / §22.5]**
```
Cashier login → Open session → Enter opening cash → Scan/search product → Add to cart
  → Apply discount/tax → Select customer → Select payment → Payment successful?
  → Create Sale → Update Inventory → Create Accounting Entry (integration event, §0)
  → Generate Receipt/Invoice → Open Cash Drawer → Send Notification/Receipt
```

### 4.7 Numbering
**[Client decision]** POS Sales and standard Invoices stay on **separate numbering
sequences** (e.g. `POS-000001` vs `INV-000001`) — different document types both
functionally and often legally; a shared sequence makes reconciliation harder.

### Open questions (POS)
- **[SRS §11.20 explicitly left blank in the client Q&A]** Exact barcode scanner, receipt
  printer, and cash-drawer hardware/models to support — question 20 in the client Q&A was
  left unanswered.
- Whether Windows should ever be added as a POS platform later — proposal explicitly
  scopes it out now, not addressed as a future item either way.

---

## 5. Sales & Invoicing

**[Proposal]** Scope: Customer Invoices, Recurring Invoices, Estimates, Proposals,
Retainers, Payment Tracking, Credit & Debit Notes, PDF generation with QR code.
**[Proposal — hours]** 39 hrs / 7.5%.

*Retainers have their own much deeper Q&A round and are already built — see
`docs/plans/Sales-Invoicing-Implementation-Plan.md` Phase E/H for the full requirement set and
implementation. Summarized here only at the level the other four modules get.*

### 5.1 Inventory deduction timing (the join point with Inventory)
**[Client decision]** For a **straightforward retail/POS sale**, deduct inventory **at
the point the sale/invoice is posted (issued)** — goods physically leave with the customer
at that moment. For **invoice-first B2B workflows** where delivery happens separately,
deduct at **Delivery/Fulfillment** instead, and treat the Invoice as a **financial
document only**. **Phase 1 must support both**, tying deduction to a "fulfillment"/
"delivery" event — **triggered automatically for POS sales**, **manually or via a delivery
note for B2B invoices**. *(This is the direct requirement source for the
Delivery/Fulfillment module discussed separately — it doesn't exist yet; this answer is
exactly what it would need to implement.)*

### 5.2 Draft invoices don't reserve stock
**[Client decision]** A **Draft Invoice does not reserve stock.** Reserving on a draft
(before commitment) risks phantom reservations blocking real sales. If pre-commitment
reservation is needed, that's a separate **"Sales Order"/"Quote with hold"** concept for a
later phase — not Draft Invoice's job.

### 5.3 Invoice status lifecycle
**[Client decision]** **Draft → Sent → Partially Paid → Paid → Overdue →
Cancelled/Void**, with one refinement: **Overdue is a computed flag based on due date, not
a manually set status** — so it layers on top of Sent or Partially Paid (e.g. "Partially
Paid, Overdue") instead of being mutually exclusive with them. *(Already how this system's
`invoiceDisplayStatus()` works — this answer is its requirement source.)*
**[Client decision]** Invoices support **partial and multiple payments.**

### 5.4 Invoice QR code
**[Client decision]** Default the QR to a **payment link** — takes the customer straight
to an online payment page — since faster collections is the highest-value use case. **If
the tenant operates in a jurisdiction with e-invoicing/tax QR mandates** (e.g. ZATCA in
Saudi Arabia), the QR must instead follow that jurisdiction's required tax-data format —
**needs confirming per target market before the format is locked.**

### 5.5 Recurring Invoices
**[Client decision]** Generate as **drafts first**, with a **per-template opt-in to
"auto-send"** once a tenant trusts a given template. Default draft-then-review avoids
auto-sending an incorrect invoice with no human check.

### 5.6 Credit Notes — balance-only vs. return-triggering
**[Client decision]** A Credit Note can do **either**, driven by what actually happened:
a **pure billing correction** (pricing error, owed discount) only adjusts the invoice
balance. A note tied to a **physical product return** should **also trigger the inventory
return flow** (see 4.5) and, if the customer already paid, **offer a refund** rather than
just a balance credit. **Model it as one Credit Note object with optional "linked return"
and "linked refund" flags** — not three separate document types. *(Matches this system's
existing single-`Adjustment`-type decision, though the "linked return" side isn't built
since Inventory wasn't connected at the time.)*

### 5.7 Numbering
See 4.7 — POS and standard Invoices are separate sequences by client decision.

### Open questions (Sales & Invoicing)
- Retainer open items are tracked separately and already resolved via working decisions —
  see `Sales-Invoicing-Implementation-Plan.md` Key Decisions #6–14.
- Tax-QR format per jurisdiction (5.4) — explicitly flagged by the client as needing
  confirmation before locking, not resolved here.
- Delivery/Fulfillment as its own document/module (5.1) — the requirement is answered,
  the module itself doesn't exist yet (see the separate discussion already had on this).

---

## 6. Summary of genuinely open items (across all five modules)

Collected in one place so nothing gets lost:

1. Sub-role structure beyond one flat Super Admin role (§1.3).
2. Payment gateway credential management process (§1.4).
3. Two-vs-three realm architecture question (§2, pre-existing open item).
4. Branch-level vs. warehouse-level permission interaction (§2.3).
5. Negative-stock reconciliation UX — the state is decided, the resolution flow isn't (§3.2).
6. Serial-number tracking scope — which product categories need it (§3.8).
7. Barcode scanner / receipt printer / cash-drawer exact hardware models — client Q&A
   question left blank (§4, open questions).
8. Tax-QR code format per jurisdiction, if operating somewhere with e-invoicing mandates (§5.4).
9. Delivery/Fulfillment as a real module — requirement is clear, nothing built yet (§5.1).
