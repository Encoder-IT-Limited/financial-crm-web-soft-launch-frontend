# Bug Fixes Required

Admin portal and public site issues (including the original client QA bug list,
BUG_01–BUG_09) have moved to `docs/missing-admin-public.md`. This file now
covers the tenant portal and app-wide (cross-portal) issues only.

## UI Polish Findings (`/impeccable polish`)

A whole-app polish pass (evidence gathered by reading the actual code, not a live browser
— per this project's own tsc/lint-only verification rule). Documentation only, nothing
fixed yet — each finding below includes exactly what to change so it can be solved
directly from this file. Ordered by Impeccable's own triage priority (states/broken
paths first, then design-system drift, then cosmetic/code cleanup).

### [P1] Every data list is missing an error state — the capability already exists, it's just never wired up

**Evidence**: `src/components/shared/filterable-table.tsx` already supports an `error`
prop and renders it as a distinct state from "loading" and "no results" (line 65
`error?: ReactNode`, line 152 `isEmpty = !loading && !error && rows.length === 0`, line
231 renders it). Checked every consumer: **13 components use `FilterableTable` across
the app (tenant, admin, and public alike), and zero of them pass `error`** — e.g.
`plans-list.tsx` and `payments-list.tsx` both destructure only `{ data: plans = [],
isLoading: loading }` from `useQuery`, discarding `isError`/`error` entirely.

**Why it matters now, specifically**: this used to be low-risk when every service was
an in-memory mock that could never actually fail. That's no longer true —
`plans.service.ts` now calls `apiGet`/`apiSend` against a real backend
(`http://147.93.108.61:4001` per `.env`). A real network/API failure during `list()`
now silently renders the **same empty state as "no plans exist"** — a user (or you,
debugging) can't tell "nothing here" from "the request failed" from looking at the UI.

**How to fix**: in each list component, destructure `isError` (and optionally `error`)
from `useQuery`, and pass it through:

```tsx
const { data: plans = [], isLoading: loading, isError, error } = useQuery({ queryKey: ["plans"], queryFn: planApi.list });
// ...
<FilterableTable
  ...
  loading={loading}
  error={isError ? "Couldn't load plans. Try refreshing the page." : undefined}
/>
```

Do this for all 13 `FilterableTable` consumers — search
`grep -rl "FilterableTable" src --include="*.tsx"` to find every file that needs it.

### [P2] Icon buttons are below the accessible touch-target size everywhere

**Evidence**: `src/components/ui/button.tsx`'s size scale — `icon-xs` (24px), `icon-sm`
(28px), `icon` (32px), `icon-lg` (36px) — none reach the 44×44px WCAG/touch-target
guideline (`audit.md`'s own Responsive Design dimension flags exactly this: "Touch
targets: Interactive elements < 44x44px"). Since this is the shared `Button` primitive,
every icon-only action across the entire app inherits it — e.g. the Edit/Delete buttons
in `plans-list.tsx` (`size="icon-sm"`, 28px) and the Download button in
`payments-list.tsx` (same).

**Why it matters**: this is mostly a mouse-driven admin/desktop context today, so it's
not urgent, but it becomes a real usability problem the moment any of these screens are
used on a touch device (including the tablet-width breakpoints this project's own
responsive rules require supporting down to 360px).

**How to fix**: this is a token-level decision, not a per-component patch — either (a)
bump `icon-sm`/`icon` to at least `size-11` (44px) globally in `button.tsx`, accepting
the visual size increase everywhere, or (b) keep the visual size but wrap the touch
target with invisible padding (a common pattern: `relative` button with an absolutely
positioned `::before` or wrapper extending the hit area to 44px without growing the
visible icon). Pick one and apply it once at the `button.tsx` level — don't fix this
button-by-button.

### [P2] Raw database IDs shown instead of names in the tenant portal

**Evidence**:

- `src/app/(tenant)/modules/pos/components/pos-refund-dialog.tsx:74` — every
  refundable line shows `{item.productId.slice(0, 8)}` instead of a product name/SKU.
  Root cause: `PosSaleItem` (`src/app/(tenant)/modules/pos/api/pos.service.ts:29-38`)
  has no `productName`/`sku` field at all, so the component has nothing else to render.
  A `products` lookup already exists at the only call site
  (`pos-register-page.tsx:82`, `useProducts()`) but is never passed into the dialog.
- Four Inventory pages build a correct `productById`/`warehouseById` lookup `Map` for
  the happy path, but fall back to a raw truncated id when the id isn't found in the
  map (list not loaded yet, paginated, or stale relative to the record) instead of a
  "Unknown product" label or a loading state:
  - `src/app/(tenant)/modules/inventory/components/stock-movements-page.tsx:81,83`
  - `src/app/(tenant)/modules/inventory/components/batches-page.tsx:80,82`
  - `src/app/(tenant)/modules/inventory/components/reorder-page.tsx:36,38`
  - `src/app/(tenant)/modules/inventory/components/stock-adjustments-page.tsx:135,137`

**Why it matters**: a cashier or inventory clerk sees a meaningless UUID fragment
instead of a product/warehouse name — directly blocks the task the screen exists for
(identifying which product a refund/movement/batch is about).

**How to fix**: for `pos-refund-dialog.tsx`, either add `productName`/`sku` to
`PosSaleItem` at the mapper layer, or pass the already-fetched `products` list down as
a prop and build a lookup map the same way the four Inventory pages already do. For the
four Inventory pages, change the fallback from `x.slice(0, 8)` to a clear placeholder
(e.g. "Unknown product" / an em dash) rather than a raw id fragment.

### [P1] POS "New Terminal" and "Start Shift" forms don't reset between opens — stale access code, name, and cash carry over

**Evidence**: both `dashboard/pos/components/open-session-dialog.tsx` and the
create-mode instance of `terminal-form-dialog.tsx`
(`terminals-list.tsx`: `<TerminalFormDialog terminal={null} open={createOpen}
onOpenChange={setCreateOpen} />`) are mounted permanently — the dialog is opened by an
external button (`SessionRequiredGate`'s "Start Shift" / `TerminalsList`'s "New
Terminal") setting a boolean state, not by the dialog's own internal trigger. Both
dialogs only call their `reset()` function from inside `onOpenChange`, gated by `if
(next) reset()`. For a controlled Base UI `Dialog`, `onOpenChange` only fires in
response to the dialog's own internal open/dismiss events (Escape, overlay click, close
button) — never because the parent changed the `open` prop from outside. Since these
two dialogs are always opened externally, `reset()` never actually runs, on the first
open or any later one.

Concretely, verified live against the real backend:

- Changing a terminal's access code via `PATCH /pos/terminals/:id` and opening a session
  via `POST /pos/sessions` both work correctly at the API level (old code rejected, new
  code accepted; closing and reopening a session on the same terminal works
  repeatedly) — this is a frontend state bug, not a backend one.
- In the actual UI flow: type an access code into "Start Shift" once (successfully or
  not), close the dialog, open it again (same terminal or a different one) — the
  previous `accessCode`/`cashierName`/`openingCash`/validation-error state is still
  sitting in the form, because the component was never unmounted and `reset()` never
  ran. The same happens for "New Terminal": create one terminal, then immediately try
  to create a second one — the access code (and name/code/warehouse) fields still hold
  the first terminal's values.
- `cashierName` is supposed to pre-fill from the logged-in user (`me?.name`) via
  `reset()` — since `reset()` never runs, this pre-fill never happens either, even on
  the very first open.

**Why it matters**: matches the two symptoms reported — "terminal access code can't be
set twice" (the New Terminal dialog reuses the previous terminal's access code instead
of a clean field) and "problem with session starting a second time" (Start Shift reuses
stale cashier name/access code/cash from the previous attempt instead of a fresh form).

**How to fix**: don't gate `reset()` behind `onOpenChange`'s `next` value for
externally-opened dialogs — either call `reset()` directly in the same handler that
sets `openSessionOpen(true)`/`createOpen(true)` (before opening), or mount these two
dialogs conditionally the same way the edit-terminal dialog already does
(`{editing && <TerminalFormDialog .../>}`), which naturally remounts fresh state on
every open via unmount/remount instead of relying on `onOpenChange`.

---

## Application-Wide Technical Audit

Run via the `impeccable` design skill against the whole app, not one specific reported
bug. **Tooling note first**: Impeccable's mechanical detector (`detect.mjs`) is not
functioning in this environment — it reports `DEGRADED - HTML parser modules
unavailable (htmlparser2, css-select, css-tree, domutils)` and returns zero findings
even against a deliberately bad test file (hardcoded red, Comic Sans, a 5s transition).
The global `npx impeccable install` didn't pull its own runtime dependencies. Everything
below is a manual review following Impeccable's own 5-dimension audit framework
(Accessibility, Performance, Theming, Responsive, Implementation Integrity), not
detector-verified — treat it as a first pass, not exhaustive coverage.

### [P0] ~~BLOCKING — the application does not currently compile~~ — RESOLVED

`npx tsc --noEmit` now passes with **zero errors** — both causes below are fixed.
Left the write-up in place since it explains _why_ the app broke, useful context if
another merge from the integration branch reintroduces the same pattern.

**How it was resolved**:

- The `nav-items.ts` duplicate `Truck` import / missing `MonitorSmartphone` / duplicate
  POS nav entry (cause #1 below) — resolved by commenting out the stale "POS" entry
  under the Sales section (the working full "POS" section stays).
- The stale `dashboard/pos/` imports into `../../invoices/` and `../../fulfillment/`
  (cause #2 below) — resolved by re-pointing POS at the integration branch's real
  module locations: `FormField`/`AddCustomerDialog` now come from
  `modules/billing/components/`, and the product-lookup demo catalog (which no longer
  exists anywhere after the rename — neither `modules/billing/` nor Inventory has a
  product-linking API yet, per `docs/missing-sales-invoice.md` §0) was recreated
  locally inside `dashboard/pos/` (`mock/product-lookup-seed.ts`,
  `api/product-lookup.service.ts`) so POS stays self-contained rather than depending on
  a Fulfillment system that no longer exists in this shape.
  `sales.service.ts`'s `create()` now deducts stock by calling
  `productLookupApi.deduct()` directly per line instead of going through the old
  `fulfillmentsApi.autoFulfillPos()` wrapper.

**Original write-up, for context**:

`npx tsc --noEmit` failed with **21 errors**. This was the highest-priority item in
this whole document — nothing else mattered until it was fixed, since it meant the app
couldn't build for any environment, not just fail one feature.

**Root cause**: a merge (`2e1334a "Merge branch 'dev-integration' into
dev-nafis-integration-v-1.0"`) combined the POS demo work with a separate integration
branch that renamed/restructured the Sales & Invoicing module (`dashboard/invoices/` →
`modules/billing/`) and doesn't include the `dashboard/fulfillment/` module the POS
demo depends on. The merge wasn't reconciled — it's a mechanical combination of two
branches that each assumed a different module layout, not a resolved conflict.

**Errors, grouped by cause**:

1. **Merge artifact in `src/app/(tenant)/components/nav-items.ts`**: `Truck` is
   imported twice (`TS2300: Duplicate identifier 'Truck'`, lines 28 and 36) — both
   branches' import blocks got concatenated instead of merged. `MonitorSmartphone` is
   used (line 126, a "POS" nav item under Sales) but never imported at all
   (`TS2304: Cannot find name 'MonitorSmartphone'`). There are now **two separate POS
   nav entries** from the two branches — one under "Sales" (`MonitorSmartphone` icon,
   broken) and a full "POS" section with Terminals/Register/Sales/Sessions (`Monitor`
   icon, working) — these need to be reconciled into one, not both kept.
2. **Stale POS imports** (`dashboard/pos/**`): every file that imports from
   `../../invoices/...` or `../../fulfillment/...` fails with
   `TS2307: Cannot find module`, because the integration branch renamed
   `dashboard/invoices/` to `modules/billing/` and has no `dashboard/fulfillment/` at
   all. Affected: `api/sales.service.ts`, `components/close-session-dialog.tsx`,
   `components/customer-picker-inline.tsx`, `components/open-session-dialog.tsx`,
   `components/product-search-panel.tsx`, `components/product-tile.tsx`,
   `components/register-screen.tsx`, `components/terminal-form-dialog.tsx`,
   `components/terminals-list.tsx`. **This needs a decision, not just a path fix**: does
   the integration branch's `modules/billing/` now own what `dashboard/invoices/` used
   to (customers, product lookup, `FormField`), and does Delivery/Fulfillment exist
   anywhere in that branch under a different name, or does it need to be re-added?
   Fixing the import paths blindly risks pointing POS at code that no longer has the
   same shape.
3. **Missing dependency**: `modules/billing/lib/invoice-print.ts` imports `jspdf`,
   which is listed in `package.json` (`^4.2.1`) but isn't installed
   (`node_modules/jspdf` doesn't exist) — `npm install` was never re-run after it was
   added. One command fixes this specific error, but it's worth running after the
   module-path reconciliation above, not before, so you're not chasing errors that
   change shape mid-fix.
4. **A handful of `implicit any` errors** (`TS7006`/`TS18046` in
   `customer-picker-inline.tsx`, `product-search-panel.tsx`, `terminal-form-dialog.tsx`,
   `terminals-list.tsx`) are downstream of #2 — once the real module imports resolve,
   TypeScript will infer these types correctly on its own; don't hand-annotate them
   while the underlying imports are still broken.

**Status**: all done — (1)–(5) are resolved as described above; `tsc --noEmit` confirmed
clean. The module-rename reconciliation (was step 1) ended up being: POS now imports
`FormField`/`AddCustomerDialog` from `modules/billing/components/` and owns its own
local product-lookup demo catalog rather than sharing one with Sales & Invoicing, since
that module dropped product-linking entirely in the rename (see
`docs/missing-sales-invoice.md` §0) — there was nothing of the old shape left to point
at instead.

### [P2] Design/technical findings (manual pass, pending a working detector)

- **Font-family conflict** — see BUG_09 in `docs/missing-admin-public.md`; same
  root-cause class as this section (two sources of truth disagreeing), just in the
  design system instead of the module graph. Worth resolving with the same "confirm
  intent before picking a side" approach.
- **No app-wide mobile navigation menu** — confirmed in BUG_01 (`docs/missing-admin-public.md`)
  for the public navbar specifically; worth checking whether the tenant/admin sidebars
  have an equivalent gap below their own breakpoints, since this pass didn't have time
  to check every surface (Dashboard, Invoices, POS register screen, Inventory)
  individually.
- **Re-run this audit once the detector is fixed.** Reinstalling
  `npx impeccable install --scope=global` in an environment where its `npm install`
  step can actually complete (this one appears to have failed silently) would restore
  the mechanical checks (contrast ratios, touch-target sizes, hard-coded-color
  detection) this pass could only approximate by hand.
