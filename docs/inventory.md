# Inventory Module Implementation Plan

## Overview

The tenant-portal **Inventory suite** lives at
`src/app/(tenant)/dashboard/(inventory)/` and covers ten sub-modules behind the
tenant sidebar's "Inventory" section:

| Route | Sub-module |
| :--- | :--- |
| `/dashboard/inventory` | Inventory Dashboard |
| `/dashboard/products`, `/dashboard/products/new`, `/dashboard/products/[productId]` | Products catalog |
| `/dashboard/warehouses`, `/dashboard/warehouses/new` | Warehouses & Stock |
| `/dashboard/stock` | Stock (tabs: Stock Movement, Stock Transfer) |
| `/dashboard/goods-receipt` | Goods Receipt |
| `/dashboard/adjustments` | Adjustments |
| `/dashboard/batches` | Batches |
| `/dashboard/reorder` | Reorder / Low Stock |
| `/dashboard/valuation` | Valuation |
| `/dashboard/inv-reports` | Inventory Reports |

The entire suite is currently **UI-complete against mock data** (`mock-data.ts`
per folder) and renders fully client-side. No inventory API exists yet — every
mutating dialog carries a `// TODO: replace with …Api.… once the inventory API
exists.` marker and a 400 ms fake delay, and every unbuildable deep action shows
an info toast ("…will be available once the inventory API is connected").

This document records the current implementation, the decisions taken, and the
remaining work (primarily swapping mocks for a real API layer).

## Current State

| Spec item | Status |
| :--- | :--- |
| Inventory Dashboard (`/dashboard/inventory`) | Built (static demo numbers) |
| Products list / add / detail | Built (edit = placeholder toast) |
| Warehouses list / add / inline detail panel | Built (edit = placeholder toast; new warehouse not persisted into list) |
| Stock Movement (tab of `/dashboard/stock`) | Built (view + export only) |
| Stock Transfer (tab of `/dashboard/stock`) | Built (create / update / accept / cancel) |
| Old routes `/dashboard/stock-movement`, `/dashboard/stock-transfer` | Built (redirect to `/dashboard/stock`) |
| Goods Receipt + Record Receipt dialog | Built (PO link, view/edit/print = placeholder toasts) |
| Adjustments + New Adjustment dialog | Built (view/edit = placeholder toasts; delete works locally) |
| Batches + Batch form dialog | Built (top-level Add Batch button disabled/commented) |
| Reorder / Low Stock + Create Reorder dialog | Built (create / quick-reorder / edit / approve / bulk-approve / cancel) |
| Valuation (FIFO/WAC, charts, table) | Built (read-only) |
| Inventory Reports (`/dashboard/inv-reports`) | ComingSoon (shared `<ComingSoon />`; route not linked in sidebar) |
| Real API layer (`*Api.*` services) | Missing |
| Auth/RBAC on inventory actions | Missing (TBD) |

## Progress Snapshot

### Cross-cutting
- ✅ All entry `page.tsx` files are server components rendering one named client component from `./components/`
- ✅ Tables use `@tanstack/react-table` v8 (core/sort/pagination row models)
- ✅ Forms use plain `useState` + `zod.safeParse()` (no react-hook-form)
- ✅ Toasts via `@/lib/toast` (exception noted below)
- ✅ CSV export on all main list pages except Warehouses and Stock Overview
- ✅ Responsive down to 360 px + dark mode via design tokens
- ⚠️ `inventory/components/dashboard-header.tsx` imports `toast` directly from `"sonner"` instead of `@/lib/toast`

### Products (`products/`)
- ✅ List table: select, Product (thumbnail + SKU), Category badge, Warehouse, Stock (`{stock} {unit}`, color dot from per-product threshold), Low Stock, Reorder Qty, Batch (Tracked/No), Status, actions
- ✅ Toolbar: search, category, status, sort presets (Featured / Name A–Z / Stock low-high / high-low), Reset, selection count chip
- ✅ CSV export → `products_YYYY-MM-DD.csv` (all columns incl. warehouse/unit/thresholds)
- ✅ Delete row via `ConfirmDialog`
- ✅ Add Product form (`product-form.tsx`): Name; SKU + Category; Unit + Status; Stock Quantity + Low Stock Alert; Reorder Quantity + Warehouse; Batch Tracking switch — zod validated
- ✅ Detail page `[productId]`: stat cards (Stock on Hand + unit, Low Stock Alert, Reorder Quantity, Batch Tracking On/Off), detail rows (incl. Warehouse, Unit), Recent Movements filtered by product name
- ⚠️ Row Edit button and detail-page Edit button show placeholder toast
- ⚠️ Created products are not inserted into the list state (submit is mocked)

### Stock (`stock/` + `stock-movement/` + `stock-transfer/`)
- ✅ Single `/dashboard/stock` page: PageHeading "Stock" + line-style tabs "Stock Movement" / "Stock Transfer" (`components/stock-tabs.tsx`)
- ✅ Movements tab: filters (search, Type, date range anchored to newest seed, warehouse), Export in toolbar, sortable/paginated table, signed quantity colors
- ✅ Transfers tab: summary cards (Pending / In Transit / Completed This Month / Total Value in Transit), toolbar with Export + New Transfer
- ✅ `transfer-dialog.tsx`: dual-mode create/update dialog (pre-filled when editing, mounted only while open)
- ✅ Row actions: View (placeholder), Edit (disabled for cancelled/completed), Accept (pending → In Transit), Cancel via `ConfirmDialog` (pending/in-transit → Cancelled)
- ⚠️ Movement View action is a placeholder toast

### Warehouses (`warehouses/`)
- ✅ Table: name/location/manager/items/value/capacity bar/status/actions; row-select drives inline `WarehouseDetail` panel (stat tiles + category donut)
- ✅ `StockOverviewTable`: one dynamic column per active warehouse
- ✅ Add Warehouse form at `/dashboard/warehouses/new` (zod validated, navigates back on success)
- ⚠️ Edit action is a placeholder toast; created warehouses are not added to local state
- ⚠️ No CSV export on this page

### Goods Receipt (`goods-receipt/`)
- ✅ Summary cards (Pending / Received Today / Completed This Week / Overdue)
- ✅ Filters: search, status, supplier, warehouse, date range
- ✅ Progress-bar "x / y received" cell with overdue-aware coloring
- ✅ `record-receipt-dialog.tsx`: PO select pre-fills supplier + warehouse + outstanding lines; per-line Receive Qty + Expiry Date validation; global "at least one qty > 0"
- ✅ Recording updates local receipts, increments matched PO lines' `receivedQty`, drops fully-received POs
- ⚠️ PO link, View, Edit, Print are placeholder toasts

### Adjustments (`adjustments/`)
- ✅ Summary cards (Total / Stock Added / Stock Deducted / Net Value Impact)
- ✅ Filters: search, type, reason, date range, warehouse
- ✅ `new-adjustment-dialog.tsx`: product, warehouse, Add/Deduct toggle, quantity, reason (+conditional custom reason), notes, attachments input
- ✅ Create prepends a Pending adjustment; delete via `ConfirmDialog`; copy ID
- ⚠️ View/Edit row actions are placeholder toasts

### Batches (`batches/`)
- ✅ Summary cards (Total / Active / Expiring Soon 30 d / Expired); live-derived status & days-remaining colors
- ✅ Forward-looking date-range filter (next 7/14/30 days)
- ✅ `batch-form-dialog.tsx` edit mode (duplicate batch-number guard, exp > mfg refine)
- ✅ Archive / bulk archive / bulk delete
- ⚠️ Top-level "Add Batch" button is commented out; View is a placeholder toast

### Reorder (`reorder/`)
- ✅ Two stacked tables: Low Stock alerts + Pending Reorders
- ✅ Suggested reorder formula `max(reorderPoint*2 − currentQty, 1)`
- ✅ Quick Reorder pre-fills the create dialog; edit locks product/supplier
- ✅ Approve (single + bulk, pending-approval → ordered), cancel via confirm, copy ID
- ⚠️ Summary cards compute from unfiltered seeds while tables render filtered lists

### Valuation (`valuation/`)
- ✅ FIFO / WAC method switch, warehouse filter, date range
- ✅ Summary cards, category donut, warehouse donut, trend area chart, full valuation table
- ✅ Read-only by design

### Inventory Reports (`inv-reports/`)
- ❌ Content missing — renders shared `<ComingSoon title="Reports" />`; route is also not referenced by `nav-items.ts` (sidebar "Reports" points to `/dashboard/reports`)

## Key Decisions

1. **Single `/dashboard/stock` page with client-side tabs.**
   Stock Movement and Stock Transfer were separate sidebar entries; they are now two tabs inside one "Stock" module (`stock/components/stock-tabs.tsx` reusing both feature components). Old URLs redirect (`redirect("/dashboard/stock")`). Alternative avoided: nested routes per tab (more churn, loses instant tab switching).
2. **Mock-data-first architecture.**
   Each folder has a `mock-data.ts` explicitly commented as the swap point for the future API; pages render entirely from those shapes so the API migration is a service-layer change only.
3. **`products/mock-data.ts` is the cross-module hub.**
   Adjustments, batches, goods-receipt and reorder import `products` / `ProductCategory` / prices from it, plus reuse `ProductThumbnail`. Keeps SKU/category consistency across seeds; alternative (per-module copies) rejected to avoid drift.
4. **`price` stays in the data model but is hidden from product UI.**
   Form/table/detail dropped Price per product decision, yet the field remains because stock-transfer, reorder and adjustments derive value figures via their local `getUnitPrice(sku) => product(sku).price`. Full removal requires touching three modules — flagged as an open question.
5. **Low-stock tone derives from each product's threshold.**
   `getStockTone(stock, lowStock)` replaces absolute cutoffs (red ≤ threshold, amber ≤ 2×, else green).
6. **Dialogs mount only while open.**
   `TransferDialog` (and dialogs following its pattern) are conditionally rendered so `useState` initializers seed forms (create = blank, edit = pre-filled) without `useEffect` setState — required by the React Compiler lint rules in this repo.
7. **TanStack Table pinned to v8.**
   All tables use `getCoreRowModel` / `getSortedRowModel` / `getPaginationRowModel`; v9's breaking API would break every list page.
8. **Forms: plain `useState` + zod `.safeParse()`**, per project convention (AGENTS.md rule 10).
9. **Consistent placeholder contract.**
   Every future-API mutation has a `// TODO: replace with <resource>Api.<method> once the … API exists.` comment + 400 ms fake delay; unbuilt deep actions show `toast.info("… will be available once the inventory API is connected")`. This makes API-phase work grep-able.
10. **kebab-case component filenames** (`stock-tabs.tsx`, `record-receipt-dialog.tsx`), PascalCase exports — matches shadcn conventions.

## Phase-by-Phase Implementation

### Phase A: Mock-driven UI (current milestone)

- Types: `mock-data.ts` per sub-module (self-contained or importing from `products`)
- API / services: none (400 ms fake delays behind `TODO` markers)
- State management: local `useState` per page (items, filters, sorting, pagination, row selection, dialog targets)
- Components: toolbars, summary cards, tables, dialogs, charts, thumbnail, capacity bar
- Pages / routes: all listed above, including redirects and `[productId]`
- Validation: zod schemas inside each dialog/form
- Integration: cross-module reads only (products feed; inventory dashboard reads own seeds; product detail reads `recentMovements`)
- Testing: tsc + eslint green; manual flows verified

### Phase B: API integration (planned)

- Types: move shared shapes to a services/domain layer; keep mock seeds for storybook/dev fallback
- API / services: create `productsApi`, `warehousesApi`, `transfersApi`, `movementsApi`, `receiptsApi`, `adjustmentsApi`, `batchesApi`, `reordersApi`, `valuationApi` (names TBD — endpoints/shapes TBD); replace every fake delay + TODO marker
- State management: introduce server-state (react-query is already installed) for lists/mutations; keep URL-free local UI state
- Components: wire Edit/View/Print placeholders to real detail routes or drawers; enable Batches "Add Batch"; persist newly created products/warehouses into refreshed lists
- Pages / routes: build `/dashboard/inv-reports` content (TBD scope) and decide sidebar linkage
- Validation: mirror zod schemas server-side; keep client messages identical
- Integration: goods receipt ↔ purchasing POs (currently seeded locally); transfers ↔ movement ledger
- Testing: contract tests/service mocks; regression pass over all checklists below

### Phase C: Analytics & polish (proposed)

- Replace static dashboard KPI values with computed/aggregated data
- Unify `dashboard-header.tsx` toast import onto `@/lib/toast`
- Decide summary-card source-of-truth (filtered vs seed totals) for reorder page
- RBAC gating on mutating actions (TBD — see Project-Structure.md §7 open questions)

## Files to Create / Change

Legend: Status reflects today's tree. "Planned" rows belong to Phase B/C.

| File | Action | Status | Purpose |
| :--- | :--- | :--- | :--- |
| `(inventory)/products/mock-data.ts` | Already exists | Done | `Product`, `PRODUCT_CATEGORIES`, `PRODUCT_UNITS`, `WAREHOUSES`, seed catalog; hub import for other modules |
| `(inventory)/products/page.tsx` | Already fine | Done | List route → `ProductsPage` |
| `(inventory)/products/components/products-page.tsx` | Already exists | Done | Table, filters, sort presets, CSV, delete |
| `(inventory)/products/components/products-toolbar.tsx` | Already fine | Done | Search/filter/sort/reset controls |
| `(inventory)/products/components/product-form.tsx` | Update | Planned | Wire submit to `productsApi.create`; insert created product into list state |
| `(inventory)/products/new/page.tsx` | Already fine | Done | Add-product route |
| `(inventory)/products/[productId]/page.tsx` | Already exists | Done | Detail route |
| `(inventory)/products/components/product-details.tsx` | Already exists | Done | Stat cards, detail rows, recent movements |
| `(inventory)/products/components/product-detail-actions.tsx` | Update | Planned | Real edit action |
| `(inventory)/products/components/product-thumbnail.tsx` | Already exists | Done | Category tile + `getStockTone(stock, lowStock)` |
| `(inventory)/products/components/products-empty-state.tsx` | Already fine | Done | Empty/no-filter states |
| `(inventory)/warehouses/mock-data.ts` | Already exists | Done | `Warehouse`, `StockOverviewRow`, seeds |
| `(inventory)/warehouses/page.tsx` / `new/page.tsx` | Already fine | Done | List + add routes |
| `(inventory)/warehouses/components/warehouses-page.tsx` | Update | Planned | Persist creates/deletes via API; real edit |
| `(inventory)/warehouses/components/warehouse-detail.tsx` / `capacity-bar.tsx` / `stock-overview-table.tsx` / `warehouse-form.tsx` / `warehouses-toolbar.tsx` | Already exists | Done | Detail panel, capacity viz, overview grid, add form, toolbar |
| `(inventory)/stock/page.tsx` | Already exists | Done | "Stock" heading page |
| `(inventory)/stock/components/stock-tabs.tsx` | Already exists | Done | Movement/Transfer tabs composing sibling modules |
| `(inventory)/stock-movement/page.tsx` | Already exists | Done | Redirects to `/dashboard/stock` |
| `(inventory)/stock-movement/mock-data.ts` | Already exists | Done | `StockMovement`, kind/status labels, seed mv-101…120 |
| `(inventory)/stock-movement/components/stock-movements-page.tsx` | Update | Planned | Server-backed list; real view action |
| `(inventory)/stock-movement/components/movements-toolbar.tsx` | Already fine | Done | Search/type/range/warehouse/export |
| `(inventory)/stock-transfer/page.tsx` | Already exists | Done | Redirects to `/dashboard/stock` |
| `(inventory)/stock-transfer/mock-data.ts` | Already exists | Done | `StockTransfer`, `TRANSFER_WAREHOUSES`, `getUnitPrice`, seeds |
| `(inventory)/stock-transfer/components/stock-transfers-page.tsx` | Update | Planned | Mutations via `transfersApi`; keep accept/cancel/update flows |
| `(inventory)/stock-transfer/components/transfer-dialog.tsx` | Update | Planned | Dual-mode create/update against API |
| `(inventory)/stock-transfer/components/transfer-summary-cards.tsx` / `transfers-toolbar.tsx` | Already exists | Done | Cards + toolbar |
| `(inventory)/goods-receipt/mock-data.ts` | Update | Planned | Source POs from purchasing module/API |
| `(inventory)/goods-receipt/page.tsx` | Already fine | Done | Route |
| `(inventory)/goods-receipt/components/goods-receipts-page.tsx` | Update | Planned | Real PO link, print; server mutations |
| `(inventory)/goods-receipt/components/record-receipt-dialog.tsx` | Update | Planned | `receiptsApi.create`; keep line/expiry validation |
| `(inventory)/goods-receipt/components/receipt-summary-cards.tsx` / `receipts-toolbar.tsx` | Already exists | Done | Cards + toolbar |
| `(inventory)/adjustments/mock-data.ts` | Already exists | Done | `StockAdjustment`, reasons/status labels, seeds ADJ-2026-001…024 |
| `(inventory)/adjustments/page.tsx` | Already fine | Done | Route |
| `(inventory)/adjustments/components/new-adjustment-dialog.tsx` | Update | Planned | `adjustmentsApi.create` |
| `(inventory)/adjustments/components/adjustments-page.tsx` | Update | Planned | Real view/edit; delete via API |
| `(inventory)/adjustments/components/adjustment-summary-cards.tsx` / `adjustments-toolbar.tsx` | Already exists | Done | Cards + toolbar |
| `(inventory)/batches/mock-data.ts` | Already exists | Done | `Batch`, status helpers, seeds BATCH-2026-001…026 |
| `(inventory)/batches/page.tsx` | Already fine | Done | Route |
| `(inventory)/batches/components/batches-page.tsx` | Update | Planned | Re-enable top-level Add Batch; real view |
| `(inventory)/batches/components/batch-form-dialog.tsx` | Update | Planned | `batchesApi.save` |
| `(inventory)/batches/components/batch-summary-cards.tsx` / `batches-toolbar.tsx` | Already exists | Done | Cards + toolbar |
| `(inventory)/reorder/mock-data.ts` | Already exists | Done | `LowStockItem`, `PurchaseReorder`, suggestion helpers, seeds RO-2026-001…014 |
| `(inventory)/reorder/page.tsx` | Already fine | Done | Route |
| `(inventory)/reorder/components/create-reorder-dialog.tsx` | Update | Planned | `reordersApi.save` |
| `(inventory)/reorder/components/reorder-page.tsx` | Update | Planned | Approve/bulk-approve/cancel via API; align summary-card totals |
| `(inventory)/reorder/components/low-stock-table.tsx` / `pending-reorders-table.tsx` / `reorder-summary-cards.tsx` / `reorder-toolbar.tsx` | Already exists | Done | Tables/cards/toolbar |
| `(inventory)/valuation/mock-data.ts` | Already exists | Done | `ValuationRow`, FIFO/WAC costs, trend series |
| `(inventory)/valuation/page.tsx` | Already fine | Done | Route |
| `(inventory)/valuation/components/*.tsx` (page, table, toolbar, 3 charts, summary cards) | Already exists | Done | Read-only analytics |
| `(inventory)/inventory/mock-data.ts` | Update | Planned | Compute KPIs from real aggregates |
| `(inventory)/inventory/page.tsx` | Already fine | Done | Dashboard route |
| `(inventory)/inventory/components/*` | Already exists | Done | Header/date-range export, KPI + summary cards, donut & area charts, recent movements + low-stock tables |
| `(inventory)/inv-reports/page.tsx` | Update | Pending | Replace `<ComingSoon />` with real reports (scope TBD) |
| `src/app/(tenant)/components/nav-items.ts` | Review | Open Question | Inventory "Reports" item targets `/dashboard/reports`; `/dashboard/inv-reports` currently unreachable from sidebar |
| `src/services/*Api.ts` (proposed location) | Create | Planned | Service layer replacing mock delays (paths/names TBD) |

Deleted during consolidation: `(inventory)/stock-transfer/components/new-transfer-dialog.tsx` (superseded by dual-mode `transfer-dialog.tsx`).

## Migration Steps

1. **Infrastructure** — agree API base/client (existing `src/lib` api client per Basic-Setup.md), error envelope, auth header handling (TBD).
2. **Types** — lift shared domain types out of `mock-data.ts` into the service/domain layer; mocks keep importing them.
3. **Services / API** — implement one `*Api` per resource; keep method names matching the existing TODO markers (`productsApi.create`, `receiptsApi.create`, `adjustmentsApi.create`, `batchesApi.save`, `reordersApi.save`, `transfersApi.create/update`, `warehousesApi.create`).
4. **State management** — swap page-local `items` seeds for react-query queries; convert dialogs to mutations (invalidation replaces manual prepend/update).
5. **UI** — replace placeholder toasts (View/Edit/Print/PO-link) with real destinations; enable Batches Add button; persist created products/warehouses.
6. **Integration** — goods receipt ↔ purchasing POs; transfers writing movement ledger; dashboard aggregates.
7. **Cleanup** — remove fake delays, unused seeds, duplicate label maps where superseded.
8. **Verification** — run through Module Flows + Testing Checklist on every sub-module; tsc + eslint.

## Component Order

Implementation/dependency order (mock phase already satisfied):

1. `products/mock-data.ts` (hub types) → `product-thumbnail.tsx`
2. Shared primitives already present: `PageHeading`, `TablePagination`, `ConfirmDialog`, `FormField`, ui `Table/Select/Dialog/Switch/Tabs`
3. Products: `product-form` → `products-toolbar` → `products-page` → `product-details` (+`[productId]` route)
4. Warehouses: `warehouse-form` → `warehouses-toolbar`/`capacity-bar` → `warehouses-page` → `warehouse-detail` → `stock-overview-table`
5. Stock: `movements-toolbar` → `stock-movements-page`; `transfer-dialog` → `transfers-toolbar` → `stock-transfers-page`; then `stock-tabs` + `stock/page.tsx`; redirects
6. Goods receipt: `record-receipt-dialog` → `receipts-toolbar` → `goods-receipts-page`
7. Adjustments: `new-adjustment-dialog` → `adjustments-toolbar` → `adjustments-page`
8. Batches: `batch-form-dialog` → `batches-toolbar` → `batches-page`
9. Reorder: `create-reorder-dialog` → `low-stock-table` / `pending-reorders-table` → `reorder-page`
10. Valuation: `valuation-toolbar` → `valuation-table` → charts → `valuation-page`
11. Dashboard last (consumes everything conceptually): charts + tables + header
12. `inv-reports` when scoped

## Module Flows

- **Product create:** Add Product → fill form (unit/thresholds/warehouse/batch switch) → validate → create → back to list *(list refresh is part of Phase B)*
- **Goods receipt:** Select PO → lines pre-fill (supplier/warehouse/outstanding) → enter receive quantities (+expiry) → Submit Receipt → receipt row created (Completed if all lines filled, else Partially Received) → PO `receivedQty` incremented → fully-received POs drop from open list
- **Stock transfer:** New Transfer → create (Pending) → Accept (→ In Transit) or Edit while pending/in-transit → Cancel (confirm) any time before completion
- **Reorder:** Low-stock alert → Quick Reorder (pre-filled suggested qty) → Draft/Pending Approval → Approve (single/bulk → Ordered) → (received externally) Received; Cancel removes after confirm
- **Adjustment:** New Adjustment (Add/Deduct + reason; custom reason when "Other") → created Pending → Approved later (approve action TBD — not built)
- **Batch lifecycle:** Batch recorded (via row edit today) → Active → Expiring Soon (≤30 d) → Expired; archived batches leave the list
- **Movement visibility:** inbound/outbound/adjustment/transfer events accumulate in the movement ledger surfaced on the Stock Movement tab and the dashboard chart

## Testing Checklist

Per sub-module (Products, Warehouses, Stock tabs, Goods Receipt, Adjustments, Batches, Reorder, Valuation, Dashboard):

- [ ] Feature works correctly (list renders from seed, CRUD flow completes)
- [ ] Validation works (zod errors render under fields; edge rules like exp > mfg, qty ≤ outstanding, unique batch number)
- [ ] Loading state works (dialog submit disabled + label swap; API phase: query loading skeletons)
- [ ] Error state works (failure toast path on fake-delay catch; API phase: refetch/error surfaces)
- [ ] Empty state works (filtered-empty vs true-empty variants where built)
- [ ] Responsive behavior verified down to 360 px (tables scroll horizontally, dialogs fit, grids stack)
- [ ] Dark mode verified
- [ ] TypeScript passes (`npx tsc --noEmit`)
- [ ] ESLint passes (`npx eslint`)

Module-specific additions:

- [ ] Stock tab switching preserves correct heading; old URLs `/dashboard/stock-movement` & `/dashboard/stock-transfer` redirect
- [ ] Transfer accept only enabled on Pending; edit disabled on Cancelled/Completed
- [ ] Record Receipt blocks submissions with zero total received quantity
- [ ] Batch days-remaining colors and status derivation match dates
- [ ] CSV exports download with correct filename pattern `*_YYYY-MM-DD.csv`

## Explicitly Out of Scope

- Purchasing/Bills module screens (goods receipt only *reads* seeded open POs until purchasing connects)
- Accounting, Sales/Invoicing, CRM, Banking, HR/Payroll, Calendar, Social, POS, mobile app (later phases per `docs/Project-Structure.md` §5)
- Super Admin portal concerns (tenants, plans, platform audit log)
- Barcode/QR/serial-number tracking (not requested anywhere in current context)
- Multi-currency pricing (AED only throughout)
- Real-time/websocket stock sync

## Definition of Done

For the module overall (Phase A — met today):

- [x] Every sidebar Inventory item resolves to a working page (no 404s); legacy stock routes redirect
- [x] All tables support search/filter/sort/pagination per spec above
- [x] All create/edit/delete flows either work locally or fail loudly with the agreed placeholder toast — never silently broken
- [x] Forms validate with zod and show inline errors; no `react-hook-form`
- [x] `npx tsc --noEmit` and `npx eslint` exit clean (only the known pre-existing `useReactTable` React Compiler warning remains)

For Phase B (API integration) additionally:

- [ ] Every `// TODO: replace with …Api.…` marker resolved; no fake delays left
- [ ] All placeholder "once the inventory API is connected" toasts replaced by real behavior
- [ ] Created records survive navigation (server persistence, cache invalidation)
- [ ] Goods receipt reflects real POs; transfers write to the movement ledger
- [ ] Full Testing Checklist passes against the live API

Open Questions:

- Remove `price` from `Product` entirely (requires updating transfer/reorder/adjustment value seeds)?
- Sidebar target for inventory reports: `/dashboard/reports` vs building out `/dashboard/inv-reports`?
- Adjustment approval flow (Pending → Approved) has no UI trigger yet — needed?
- RBAC rules per inventory action (blocked on Project-Structure.md §7 sub-roles decision)
