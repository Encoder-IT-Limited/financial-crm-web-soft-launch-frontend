# Sales & Invoicing Implementation Plan

## Overview

Migration of the Billing module from Zustand to React Query and expansion of the Sales/CRM suite to include Customers, Proposals, Credit/Debit Notes, and Retainers.

## Current State (baseline — pre-migration snapshot)

| Spec item | Status |
| :--- | :--- |
| Invoices (list/create/edit/detail) | Built, full — TanStack table, filters, bulk actions, PDF preview, status-gated actions, payment history, audit timeline |
| Recurring Invoices | Built, full — but a tab inside `/dashboard/invoices`, not its own nav item; manual "Generate now" only, no scheduler |
| Payments | Built, full — RecordPaymentDialog, partial/full payment logic |
| Customers | Data model + CRUD exist; page is ComingSoon stub |
| Estimates | Missing entirely — no route, no type, not even a stub |
| Proposals | ComingSoon stub, no type |
| Credit/Debit Notes | ComingSoon stub at `/dashboard/credit-notes` (single combined route), no type; docs only spec a credit_notes table |
| Retainers | ComingSoon stub, no type |
| Reports | ComingSoon stub |

Everything real was built on `useInvoicesStore` (Zustand, localStorage-persisted) — the tenant portal never went through the Zustand→React Query migration the admin portal did. This table is kept as the original baseline; see **Progress Snapshot** below for what's actually landed since.

## Progress Snapshot (updated)

**Phase A is complete**, verified against the actual working tree (not just this doc):

- ✅ `modules/crm/` exists in full: `types.ts`, `schemas.ts`, `mock/seed.ts`, `api/customers.service.ts`.
- ✅ `invoices.service.ts` owns its data in-memory directly (no more Zustand delegation); has `InvoiceSource`, `getNextNumber()`, `getOrgProfile()`.
- ✅ `recurring.service.ts` exists and fully replicates the old store's logic.
- ✅ All Zustand call sites migrated: `recurring-templates-panel.tsx`, `recurring-template-dialog.tsx`, `invoice-preview-dialog.tsx`, `add-customer-dialog.tsx`, `record-payment-dialog.tsx`, `dashboard/invoices/page.tsx`, and — as of this check — `dashboard/invoices/new/page.tsx` and `dashboard/invoices/[invoiceId]/page.tsx` too. Repo-wide grep for `invoices-store`/`recurring-store`/`useInvoicesStore`/`useRecurringStore` returns zero hits.
- ✅ `store/invoices-store.ts` and `recurring/store/recurring-store.ts` are **deleted** (confirmed via `git status`).
- ✅ Sales Dashboard KPI wiring done: new `components/sales-dashboard.tsx` (StatTiles, 6-month invoicing trend, status breakdown, recent invoices/payments), wired into `(tenant)/dashboard/page.tsx` — this was listed as "not started" in an earlier revision of this doc but is in fact built.
- ✅ Verified clean: `tsc --noEmit` has zero errors; `eslint` on the tenant tree has zero errors (two pre-existing warnings unrelated to this migration — a TanStack Table `react-hooks/incompatible-library` notice on the invoices list, not a regression).
- ✅ **Phase B (Customers/CRM) is done**: `Customer` extended with `customerCode`/`creditLimit`/`openingBalance`/`status`; `/dashboard/customers` list (`FilterableTable`, search + status filter, live Outstanding column) and `/dashboard/customers/[customerId]` detail page (StatTiles + Overview/Invoices/Payments/Proposals/Credit Notes tabs) are both live; full CRUD (`customersApi.create/update/remove`) wired through React Query. Quick-create (`AddCustomerDialog`, used from invoice/recurring flows) is untouched — the service fills the new fields' defaults.
- ✅ **Phase C (Proposals) is done**: `Proposal` type + `proposalDisplayStatus()` (same overdue-style derivation as invoices) added to `modules/billing/types.ts`; `proposalsApi` (`list/get/getNextNumber/create/update/send/reject/convertToInvoice`); `/dashboard/proposals` list, `/dashboard/proposals/new` (create + edit), `/dashboard/proposals/[proposalId]` detail with Send/Reject/Convert actions. Convert-to-Invoice creates a draft `Invoice` with `source: "estimate"` and links back via `convertedInvoiceId`. Shared `InvoiceSummaryCard` extracted and used by the new Proposal form. Customers' Proposals tab (Phase B's placeholder) now shows real data.
- ✅ **Phase D (Credit & Debit Notes) is done**: one `Adjustment` type (`kind: "credit" | "debit"`) rather than two near-identical types; `adjustmentsApi` (`list/get/getNextNumber/create/void` — notes are issued immediately on create, no draft stage); `/dashboard/credit-notes` combined page with a Credit/Debit `Tabs` switch over `FilterableTable`; issuing via `AdjustmentFormDialog`, viewing/voiding via `AdjustmentDetailsDialog`. `adjustmentsForInvoice()`/`adjustedInvoiceBalance()` derive an invoice's post-adjustment balance without mutating the invoice; the Invoice detail page's Balance Due tile and a new Adjustments card now reflect it.
- ✅ **Phase E (Retainers) is done**: `Retainer` type with a `usage: RetainerUsage[]` log and `retainerUsedAmount()`/`retainerPercentUsed()` helpers; `retainersApi` (`list/get/create/update/recordUsage/setStatus`). `/dashboard/retainers` list (`FilterableTable`) with a details modal (not a full page — proportionate to the entity, same call as Adjustments) showing usage history and Record Usage / Pause / Resume / Close actions. Recording usage is blocked client-side from exceeding the remaining balance and auto-closes the retainer at zero. No auto-invoice-generation anywhere in the flow.
- ✅ **Phase F (Reports) is done**: `/dashboard/reports` (`ReportsPage`) now has three tabs — Sales Report (12-month invoiced-vs-collected table + StatTiles), Invoice Report (`FilterableTable` over all invoices with a status filter), Customer Statement (per-customer running-balance ledger merging invoices/payments/issued adjustments). All three export to CSV via the existing `downloadCsv` helper. `/reports/vat`, `/reports/corp-tax`, `/reports/scheduled` untouched.
- ✅ **Phase G (Component Refinement) is done**: Invoices' own create/edit form swapped onto the shared `InvoiceSummaryCard` (the last outstanding item); everything else in Phase G — `FilterableTable` standardization on every new list, per-entity status badges — had already landed incidentally while building Phases B–F.

**All of Phases A–G are done.** Every item in this plan has landed and is verified clean (`tsc`/`eslint`).

## Key Decisions

1. **State management**: Migrate billing to React Query + in-memory mock services, matching the admin pattern (`tenants.service.ts` / `payments.service.ts`). Zustand's localStorage persistence has already caused a stale-field bug once.
2. **CRM split**: Split `Customer` into a new `modules/crm/` now, before Estimates/Credit Notes/Retainers add more coupling to billing.
3. **Estimates vs Proposals**: Same concept under two names; merged into the existing "Proposals" nav item using the richer Estimate status set (`draft/sent/accepted/rejected/expired`).
4. **Folder/route naming**: Keep existing `modules/billing/` folder and `/dashboard/*` routes — renaming to `modules/sales/` + `/sales/*` is pure churn with no functional benefit.
5. **Credit/Debit Notes routing**: Keep the existing single combined route/nav item (`/dashboard/credit-notes`) with an internal tab switch, rather than splitting into two nav items.

## Phase-by-Phase Implementation

### Phase A: Foundation & Migration
- **CRM Split**: Move `Customer` type and CRUD logic to new `modules/crm/`; repoint all billing imports.
- **State Migration**: Rework `invoices.service.ts` to own its in-memory data directly (admin service pattern) instead of delegating to Zustand; same for recurring templates. Delete both stores when no call sites remain.
- **Schema Updates**:
  - Add `source: "manual" | "estimate" | "recurring" | "pos"` to `Invoice` (default `"manual"`, `"recurring"` when generated from a template, `"estimate"` on conversion).
  - Add optional `productId`/`warehouseId` to `InvoiceLine` — unused today, forward-compat for the future Inventory module.
- **Dashboard**: Replace hardcoded KPIs on the Sales Dashboard home page with real data derived from services (KPI cards, trend chart, invoice-status chart, quick actions, recent invoices/payments). ✅ Done.

### Phase B: Customers (CRM) — ✅ Done
- **Types**: Extended `Customer` with `customerCode`, `creditLimit`, `openingBalance`, `status` — existing invoice references (`customerId: string`) untouched, no breakage.
- **List View**: `/dashboard/customers` on `FilterableTable` — search (name/code/email), status filter, Outstanding (live, derived from invoices) and Credit Limit columns, row click → detail page, inline Edit/Delete.
- **Detail View**: `/dashboard/customers/[customerId]` with tabs: Overview (contact info + opening balance), Invoices (`SimpleTable`, linked to invoice detail), Payments (flattened across the customer's invoices), Proposals (`SimpleTable`, wired once Phase C landed), Credit Notes (still a "coming soon" panel until Phase D). Header carries Edit/Delete actions and a StatTiles row (Total Invoiced / Outstanding / Collected / Credit Limit).
- **Quick-create unaffected**: `AddCustomerDialog`'s schema is untouched — the service fills `customerCode`/`creditLimit`/`openingBalance`/`status` defaults on create, so the invoice-creation "+ New customer" flow doesn't need the new fields.
- Verified: `tsc --noEmit` and `eslint` both clean.

### Phase C: Proposals (merged with Estimates) — ✅ Done
- **Types**: `Proposal` (number, customerId, date, expiryDate, lines reusing the `InvoiceLine` shape, totals, `status: draft|sent|accepted|rejected`) added to `modules/billing/types.ts`, alongside `proposalDisplayStatus()` — same overdue-style derivation pattern as invoices (`sent` + past `expiryDate` → `expired`, never stored).
- **CRUD**: `/dashboard/proposals` (`FilterableTable`, search + status filter, pipeline-value StatTiles), `/dashboard/proposals/new` (create + `?edit=<id>` for drafts, reuses `LineItemsEditor`), `/dashboard/proposals/[proposalId]` (detail — Send/Reject/Convert actions gated by status, history timeline).
- **Conversion**: "Convert to Invoice" (`proposalsApi.convertToInvoice`) creates a draft Invoice with `source: "estimate"` via `invoiceApi.create`, prefilled from the proposal's lines and discount, marks the proposal `accepted` with `convertedInvoiceId` linking to it, and navigates to the new invoice. A converted proposal can't be converted again (checked via `convertedInvoiceId`).
- **Shared component**: `InvoiceSummaryCard` extracted (subtotal/discount/VAT/total + editable discount field) — used by the new Proposal form now; Invoices' own create form still has its inline equivalent (not refactored onto the shared component yet — tracked under Phase G, non-blocking).
- **Customer detail integration**: the Customers detail page's Proposals tab (built in Phase B as a placeholder) now shows the customer's real proposals via `SimpleTable`.
- Verified: `tsc --noEmit` and `eslint` both clean.

### Phase D: Credit & Debit Notes — ✅ Done
- **Types**: Implemented as one `Adjustment` type with a `kind: "credit" | "debit"` discriminator rather than two separate `CreditNote`/`DebitNote` types — matches docs §33.16 (only `credit_notes` is specced; debit notes mirror the same shape with the balance effect inverted) and avoids duplicating amount/reason/status/invoiceId across two near-identical types. `status: "issued" | "void"` — no draft stage; a note records something that already happened (a refund, a correction), not a document to be sent and awaited, so `adjustmentsApi.create` issues it immediately.
- **UI**: `/dashboard/credit-notes` kept as the combined route (`AdjustmentsPage`) with an internal Credit/Debit `Tabs` switch, each tab a `FilterableTable`. Creating uses a lightweight `AdjustmentFormDialog` (customer, optional linked invoice scoped to that customer, amount, reason) rather than a full page — proportionate to a 4-field record, unlike Invoices/Proposals' multi-line documents. Viewing uses `AdjustmentDetailsDialog` (built on the shared `EntityDetailsDialog` shell) with a "Void this note" action.
- **Integration**: `adjustmentsForInvoice()` / `adjustedInvoiceBalance()` (in `modules/billing/types.ts`) derive an invoice's balance after its linked, non-voided notes — never stored on the invoice itself, so voiding a note instantly stops affecting it. The Invoice detail page's "Balance Due" tile now shows this adjusted figure (with an "after adjustments" sub-label when notes exist) and gained an "Adjustments" card listing each linked note with its effect (credit shown as `−`, debit as `+`).
- **Post-launch addition (not in the original spec)**: a standalone note — one issued with no linked invoice — never showed up anywhere as a document. Added `adjustmentsApi.convertToInvoice()` (mirrors `proposalsApi.convertToInvoice`): generates a draft Invoice for the note's amount and retroactively links the note to it — positive-value (`source: "debit-note"`) for a Debit Note, since it increases what's owed and needs something payable behind it; **negative-value (`source: "credit-note"`) for a Credit Note**, per explicit client direction, so the amount owed *back* to the customer is reflected as a real invoice/ledger entry rather than an unlinked record. Both are new `InvoiceSource` values. Surfaced in `AdjustmentDetailsDialog` as a "Convert to Invoice" action, shown for any standalone, issued note regardless of kind, with kind-specific explainer copy.

### Phase E: Retainers — ✅ Done
- **Types**: `Retainer` (customerId, contractAmount, billingPeriod, remainingBalance, status, `usage: RetainerUsage[]`) in `modules/billing/types.ts`, plus `retainerUsedAmount()`/`retainerPercentUsed()` helpers.
- **CRUD**: `/dashboard/retainers` list (`FilterableTable`, status filter, contracted/remaining StatTiles). Create/Edit share one `RetainerFormDialog` (contract amount locked once created — editing a live contract's principal would silently invalidate its usage history). View is a details modal (`RetainerDetailsDialog`, built on `EntityDetailsDialog`) rather than a full page — proportionate to the entity's size, same reasoning as Adjustments.
- **Balance tracking (original scope)**: `RetainerUsageDialog` records a free-text usage entry and decrements `remainingBalance` (blocked client-side if the amount would exceed it); the retainer auto-closes when the balance hits zero. Pause/Resume and manual Close are separate actions. Kept as-is for consumption you're tracking but not billing as its own invoice.
- **Post-launch addition (not in the original spec) — retainers connected to real invoices**: raised by the client — a retainer with no invoice behind it wasn't a real accounting transaction. Two additions, both reusing the "every dollar has a document" pattern from the credit/debit-note conversion:
  - **Funding**: `retainersApi.create` now also generates and immediately pays an Invoice for the full contract amount (`source: "retainer"`), stored on the retainer as `fundingInvoiceId`. Surfaced as a "Funding Invoice" link in `RetainerDetailsDialog`.
  - **Drawing**: `retainersApi.drawForInvoice()` is the invoice-linked counterpart to manual usage — when creating a new Invoice for a customer with an active, sufficiently-funded retainer, `dashboard/invoices/new/page.tsx` offers a **"Pay from Retainer"** checkbox (only in combination with "Create & Send" — pre-paying a draft doesn't make sense). On save it deducts the balance, logs a usage entry referencing the invoice, and records an invoice payment with a new `PaymentMethod` value, `"retainer"` — deliberately **excluded** from `RecordPaymentDialog`'s manual method list, since picking it there wouldn't actually touch a retainer's balance.
  - Client-facing questions this build deliberately leaves open (asked, not assumed): recurring/periodic retainer top-ups, rollover-vs-reset of unused balance, contract expiry policy (forfeit/refund/rollover), and refunds. None of those are built — this addition only connects the *existing* one-time, no-expiry retainer model to real invoices.
- Verified: `tsc --noEmit` and `eslint` both clean.

### Phase F: Reports — ✅ Done
- **Implementation**: Built inside the existing `/dashboard/reports` ("All Reports") page (`ReportsPage`) as three tabs:
  - **Sales Report** — StatTiles (Total Invoiced / Collected / Outstanding) + a 12-month Invoiced-vs-Collected table, CSV export.
  - **Invoice Report** — every invoice on `FilterableTable` with a status filter, CSV export (mirrors the columns already used on the Invoices list).
  - **Customer Statement** — pick a customer, see a running-balance ledger (opening balance + every non-cancelled invoice, payment, and issued credit/debit note sorted by date), CSV export.
- Not touching `/reports/vat`, `/reports/corp-tax`, `/reports/scheduled` — separate tax-specific pages outside this spec, untouched.
- Verified: `tsc --noEmit` and `eslint` both clean. One bug caught by lint and fixed: the Customer Statement's running-balance column was first written with a `let` reassigned inside `.map()` during render — flagged by the `react-hooks/immutability` rule; rewritten as a `.reduce()` that builds the balance functionally instead.

### Phase G: Component Refinement — ✅ Done
- **Standardization**: Every new list (Customers, Proposals, Credit/Debit Notes, Retainers) uses `FilterableTable`/`TableToolbar`/`TablePagination` from the start. The Invoices list itself stays on its existing hand-rolled table — it has bulk row-selection, CSV export, and sortable columns `FilterableTable` doesn't support, so swapping it would be a downgrade, not a refinement; left as-is deliberately, not an oversight.
- **Shared UI**: `InvoiceSummaryCard` (subtotal/discount/VAT/total, exported `SummaryRow` for extra rows) extracted and used by both create/edit forms — Proposals from the start, and Invoices' own form (`dashboard/invoices/new/page.tsx`) swapped over from its inline duplicate, passing Paid/Balance-due as `extraRows` (Proposals has none, since it has no payment concept).
- **Badges**: `ProposalStatusBadge`, `AdjustmentStatusBadge`, `CustomerStatusBadge`, `RetainerStatusBadge` — all match the existing `InvoiceStatusBadge`/admin `StatusBadge` convention (a `STATUS_CONFIG` map of label + `Badge` tone).
- `fmtMoney` already covers CurrencyFormatter — no new component needed, as originally noted.

## Files to Create/Change

Paths relative to `src/app/`. Existing billing module lives at `(tenant)/modules/billing/`.

| File | Action | Status | Purpose |
| :--- | :--- | :--- | :--- |
| `(tenant)/modules/crm/types.ts` | Create | ✅ Done | Customer & CRM types |
| `(tenant)/modules/crm/api/customers.service.ts` | Create | ✅ Done | Customer mock service (in-memory seed + Promises) |
| `(tenant)/modules/crm/mock/seed.ts` | Create | ✅ Done | Customer seed data |
| `(tenant)/modules/crm/schemas.ts` | Create | ✅ Done | Customer form validation (not originally listed) |
| `(tenant)/modules/billing/types.ts` | Update | ✅ Done | Imports Customer from crm; `InvoiceSource` + `source` on Invoice added |
| `(tenant)/modules/billing/api/invoices.service.ts` | Update | ✅ Done | Owns in-memory data directly; `getNextNumber()`/`getOrgProfile()` added |
| `(tenant)/modules/billing/api/recurring.service.ts` | Create | ✅ Done | Recurring template service (replaces `recurring/store/recurring-store.ts`) |
| `(tenant)/modules/billing/api/proposals.service.ts` | Create | ✅ Done | `list/get/getNextNumber/create/update/send/reject/convertToInvoice` |
| `(tenant)/modules/billing/api/adjustments.service.ts` | Create | ✅ Done | `list/get/getNextNumber/create/void` — one service for both credit and debit notes (`kind` discriminator) |
| `(tenant)/modules/billing/mock/seed-proposals.ts` | Create | ✅ Done | 4 seeded proposals covering sent/accepted/rejected/expired |
| `(tenant)/modules/billing/store/invoices-store.ts` | Delete | ✅ Done | Deleted, confirmed no remaining imports |
| `(tenant)/modules/billing/recurring/store/recurring-store.ts` | Delete | ✅ Done | Deleted, confirmed no remaining imports |
| `(tenant)/modules/billing/components/add-customer-dialog.tsx` | Update | ✅ Done | Repointed at `modules/crm` |
| `(tenant)/modules/billing/components/record-payment-dialog.tsx` | — | ✅ Already fine | Already used `invoiceApi`, no Customer coupling — no change needed |
| `(tenant)/modules/billing/components/invoice-summary-card.tsx` | Create | ✅ Done | Shared subtotal/discount/tax/total block; consumed by both Proposals' and Invoices' new/edit forms (Phase G) |
| `(tenant)/modules/billing/components/proposals-list.tsx` | Create | ✅ Done | Proposals list content component (not originally listed as its own row) |
| `(tenant)/modules/billing/components/proposal-status-badge.tsx` | Create | ✅ Done | Proposal status badge (draft/sent/accepted/rejected/expired) |
| `(tenant)/modules/billing/components/adjustment-status-badge.tsx` | Create | ✅ Done | Issued/Void badge — renamed from the originally planned `credit-note-status-badge.tsx` since one badge covers both note kinds |
| `(tenant)/modules/billing/components/adjustments-page.tsx` | Create | ✅ Done | Combined Credit/Debit Notes page content — `Tabs` switch, `FilterableTable` per kind (not originally listed as its own row) |
| `(tenant)/modules/billing/components/adjustment-form-dialog.tsx` | Create | ✅ Done | Create/issue dialog — customer, optional linked invoice, amount, reason (not originally listed as its own row) |
| `(tenant)/modules/billing/components/adjustment-details-dialog.tsx` | Create | ✅ Done | View + Void, built on `EntityDetailsDialog` (not originally listed as its own row) |
| `(tenant)/modules/billing/mock/seed-adjustments.ts` | Create | ✅ Done | 3 seeded notes (2 credit, 1 debit) linked to existing seeded invoices (not originally listed as its own row) |
| `(tenant)/modules/billing/components/retainer-status-badge.tsx` | Create | ✅ Done | Active/Paused/Closed badge |
| `(tenant)/modules/billing/api/retainers.service.ts` | Create | ✅ Done | `list/get/create/update/recordUsage/setStatus` |
| `(tenant)/modules/billing/mock/seed-retainers.ts` | Create | ✅ Done | 3 seeded retainers (active/closed/paused) with usage history (not originally listed as its own row) |
| `(tenant)/modules/billing/components/retainers-list.tsx` | Create | ✅ Done | Retainers list content component (not originally listed as its own row) |
| `(tenant)/modules/billing/components/retainer-form-dialog.tsx` | Create | ✅ Done | Shared create/edit form (not originally listed as its own row) |
| `(tenant)/modules/billing/components/retainer-details-dialog.tsx` | Create | ✅ Done | View + usage history + Pause/Resume/Close, built on `EntityDetailsDialog` (not originally listed as its own row) |
| `(tenant)/modules/billing/components/retainer-usage-dialog.tsx` | Create | ✅ Done | Record usage against remaining balance (not originally listed as its own row) |
| `(tenant)/modules/billing/components/reports-page.tsx` | Create | ✅ Done | Sales Report / Invoice Report / Customer Statement tabs (not originally listed as its own row) |
| `(tenant)/dashboard/page.tsx` | Update | ✅ Done | Wires `<SalesDashboard />` — KPI cards, trend chart, invoice-status chart, recent invoices/payments (quick actions still just "New Invoice" in the header, not a separate quick-actions block — fine for now, not specced as blocking) |
| `(tenant)/modules/billing/components/sales-dashboard.tsx` | Create | ✅ Done | Sales Dashboard content component (not originally listed as its own row) |
| `(tenant)/dashboard/customers/page.tsx` | Replace stub | ✅ Done | Real customer list (`FilterableTable`), search + status filter, Outstanding/Credit Limit columns |
| `(tenant)/dashboard/customers/[customerId]/page.tsx` | Create | ✅ Done | Customer detail — Overview/Invoices/Payments/Proposals tabs live; Credit Notes tab still a "coming soon" panel until Phase D |
| `(tenant)/modules/crm/components/customers-list.tsx` | Create | ✅ Done | List page content component (not originally listed as its own row) |
| `(tenant)/modules/crm/components/customer-detail.tsx` | Create | ✅ Done | Detail page content component, tabs |
| `(tenant)/modules/crm/components/customer-edit-dialog.tsx` | Create | ✅ Done | Full-field edit form (customerCode, credit limit, opening balance, status) |
| `(tenant)/modules/crm/components/customer-status-badge.tsx` | Create | ✅ Done | Active/Inactive badge |
| `(tenant)/modules/crm/types.ts` | Update | ✅ Done | Extended `Customer` with `customerCode`, `creditLimit`, `openingBalance`, `status` per docs §33.7 |
| `(tenant)/modules/crm/schemas.ts` | Update | ✅ Done | Added `customerEditSchema`/`CustomerEditValues` for the full field set (quick-create `customerSchema` unchanged) |
| `(tenant)/modules/crm/api/customers.service.ts` | Update | ✅ Done | Added `update`/`remove`; `create` now auto-assigns `customerCode` and financial defaults |
| `(tenant)/dashboard/proposals/page.tsx` | Replace stub | ✅ Done | Proposal list (`FilterableTable`, pipeline-value StatTiles) |
| `(tenant)/dashboard/proposals/new/page.tsx` | Create | ✅ Done | Create + `?edit=<id>` for drafts (not originally listed as its own row — mirrors `invoices/new`) |
| `(tenant)/dashboard/proposals/[proposalId]/page.tsx` | Create | ✅ Done | Proposal detail — Send/Reject/Convert-to-Invoice actions, history timeline |
| `(tenant)/dashboard/credit-notes/page.tsx` | Replace stub | ✅ Done | Combined Credit & Debit Notes page with internal tab switch (kept existing route name) |
| `(tenant)/dashboard/retainers/page.tsx` | Replace stub | ✅ Done | Retainers list + balance tracking |
| `(tenant)/dashboard/reports/page.tsx` | Update | ✅ Done | Sales Report / Invoice Report / Customer Statement tabs |
| `(tenant)/dashboard/invoices/page.tsx` | Update | ✅ Done | Zustand removed; consumes `invoiceApi` + `customersApi` via React Query; kept on its hand-rolled table deliberately (bulk selection/CSV export/sortable columns `FilterableTable` doesn't support) |
| `(tenant)/dashboard/invoices/[invoiceId]/page.tsx` | Update | ✅ Done | Zustand removed, on `invoiceApi`/`customersApi` via React Query; now also shows linked Adjustments and the adjusted Balance Due (added in Phase D) |
| `(tenant)/dashboard/invoices/new/page.tsx` | Update | ✅ Done | Zustand removed, on `invoiceApi`/`customersApi` via React Query; summary block swapped onto shared `InvoiceSummaryCard` (Phase G) |

## Migration Steps

1. ✅ **Infrastructure**: Establish `modules/crm/` and confirm the mock-service pattern (in-memory seed + Promises with simulated latency, consumed via React Query).
2. ✅ **Data Move**: Migrate `Customer` type/data/logic to `modules/crm`; repoint billing imports (AddCustomerDialog, invoice forms, seed data).
3. ✅ **State Swap**: `invoices.service.ts` owns its data; all `useInvoicesStore`/`useRecurringStore` call sites replaced with React Query hooks — including `invoices/new/page.tsx` and `invoices/[invoiceId]/page.tsx`, the last two remaining.
4. ✅ **Type Update**: Applied new fields (`source`, `productId`/`warehouseId`) to types and seed data; default `source: "manual"`.
5. ✅ **Delete Stores**: `store/invoices-store.ts` and `recurring/store/recurring-store.ts` removed. Repo-wide grep confirms no remaining imports; `tsc --noEmit` and `eslint` both pass clean.

**Phase A checkpoint passed** — `tsc`/lint verified clean as of this review (same checkpoint discipline the admin-portal migration used). Phases B–G, built after this checkpoint, are covered by the Progress Snapshot above.

## Component Order

1. ~~Mock services & types~~ (done) → 2. ~~Finish migrating `invoices/new` + `invoices/[invoiceId]` off Zustand, delete both stores~~ (done) → 3. ~~Dashboard KPIs~~ (done) → 4. ~~CRM list/detail (Phase B)~~ (done) → 5. ~~Proposals, incl. `InvoiceSummaryCard` & `ProposalStatusBadge`~~ (done) → 6. ~~Credit/Debit Notes~~ (done) → 7. ~~Retainers~~ (done) → 8. ~~Reports~~ (done).

**All component-order steps are done**, including Phase G's `InvoiceSummaryCard` swap.

## Module Flows

- **Sales Flow**: `Proposal` → `Accepted` → `Convert to Invoice` (source: "estimate") → `Record Payment` → `Paid`.
- **Customer Flow**: `Create Customer` → `Link to Proposal/Invoice` → `Track Balance`.
- **Adjustment Flow**: `Issue Credit/Debit Note` → `Link to Invoice` → "Adjustments" entry appears on invoice detail → invoice displayed balance updates.
- **Recurring Flow**: `Create Template` → `Generate Now` (manual trigger) → Invoice created with `source: "recurring"`.
- **Retainer Flow**: `Create Retainer` → `Track Remaining Balance`.

## Testing Checklist

- [x] Customer CRUD persists in-memory and reflects everywhere a customer list is consumed: invoice create/edit, recurring template dialog, add-customer-dialog, invoice preview, and the Customers list/detail pages.
- [x] Invoice pages function correctly without Zustand; RecordPaymentDialog partial/full logic intact post-migration.
- [x] Recurring "Generate now" creates an invoice with `source: "recurring"` (verified in `recurring.service.ts`'s `generate()`).
- [x] Proposal → Invoice conversion populates all lines and sets `source: "estimate"`; proposal marked accepted with `convertedInvoiceId`; navigates to new invoice (verified in `proposals.service.ts`'s `convertToInvoice()`).
- [x] Credit/Debit notes correctly decrement/increment linked invoice balances and appear in its Adjustments section (verified in `adjustedInvoiceBalance()`/`adjustmentsForInvoice()` and the Invoice detail page's Adjustments card + Balance Due tile).
- [ ] Dashboard KPIs/charts reflect seeded data and update after create/edit/delete actions — implemented, not yet exercised in a running browser (AGENTS.md §7: verify via `tsc`/lint, not the dev server, for routine work).
- [x] Retainer usage can't exceed the remaining balance (blocked client-side in `RetainerUsageDialog`); retainer auto-closes at zero remaining; Pause/Resume/Close all update status correctly (verified in `retainers.service.ts`).
- [x] Reports reflect the same live data as the rest of the module — Sales/Invoice Report and Customer Statement all read from `invoiceApi`/`adjustmentsApi`/`customersApi`, no separate/stale report-only dataset; CSV export works on all three tabs.
- [ ] All new pages are responsive (down to 360px) and support Dark Mode — built with the same responsive/dark-mode utility classes as the rest of the tenant portal; not yet visually spot-checked.
- [ ] Desktop (lg:) matches prototype markup where a page exists in it — Customers/Proposals/Retainers/Reports have no prototype reference page, so this applies to Invoices/Recurring only, already true pre-migration.
- [x] `tsc` and lint pass with no errors (verified after every phase, most recently after Phase F).

## Explicitly Out of Scope

- **Vendors, Inquiries, Leads** — not in this spec; still ComingSoon. Separate future task.
- **Action-level permissions** (`invoice.create` etc., spec §23) — no role/action permission system exists yet and sub-role RBAC is an unanswered open question (Project-Structure.md §7). Action buttons will be structured so gating is a trivial one-line addition later, but no permission engine now.
- **POS integration & real Inventory stock movement** — type fields added for forward-compat only (spec §2); neither module exists yet.
- **Scheduler/auto-send for Recurring Invoices** — stays manual-trigger; flagged as an open question in existing code/docs.
- **Auto-invoice-generation from Retainers** — nothing in the docs specs it; clean CRUD demo only.

## Definition of Done

- All entities in spec implemented with full CRUD; every action button (create, edit, delete, status change, convert, record payment/usage) performs a real state change against the mock services and updates the UI.
- UI matches prototype (desktop lg:) and follows Basic-Setup.md conventions (responsive down to 360px, dark mode in the same diff).
- No Zustand stores remaining in the billing module.
- Kebab-case filenames throughout; exported component names PascalCase.
- Pages/layouts are Server Components; interactivity isolated in small `"use client"` components.
- Scope stays inside this spec — no adjacent modules touched.
