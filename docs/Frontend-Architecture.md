# Frontend Architecture (Phase 1)

Conventions for the Next.js App Router portals. Follow this when adding or changing features.

## Realms

| Route group | URL prefix | Role |
|-------------|------------|------|
| `(public)` | `/`, `/pricing`, `/login`, … | Marketing + auth |
| `(admin)` | `/admin/*` | Super Admin |
| `(tenant)` | `/dashboard/*` | Tenant ops |

Shared code lives in `src/components/{ui,shared}`, `src/lib`, `src/hooks`, `src/providers`, `src/types`.

## Module layout (per realm)

```text
src/app/(tenant)/modules/<feature>/
  api/<feature>.service.ts   # apiGet / apiSend + DTO → UI mappers only
  hooks/                     # React Query wrappers
  query-keys.ts              # Stable queryKey factory
  types.ts                   # UI domain types
  schemas.ts                 # Zod forms
  components/                # Feature UI (no page.tsx)
  mock/                      # Optional; only when backend is not ready
```

Admin / public use the same pattern under `app/(admin)/modules/` and `app/(public)/modules/`.

## Thin pages

`dashboard/**/page.tsx` (and `admin/**/page.tsx`) only compose module screens:

```tsx
import { ProductsPage } from "@/app/(tenant)/modules/inventory/components/products-page";

export default function Page() {
  return <ProductsPage />;
}
```

Do **not** put `mock-data.ts`, forms, or fetch logic under route folders.

## Data flow

```text
page → module component → module hook → module api service → lib/api (http + envelope) → /api/v1
```

- Query keys: one factory per module (`inventoryKeys.products()`, `billingKeys.invoice(id)`).
- Invalidate via that factory after mutations.
- Never call axios / `http` from components.

## Mock policy

- Phase 1 live modules must use live APIs (see checklist below).
- Features without backend may keep `modules/*/mock/` and must be labeled in the api file comment.
- Do **not** put `mock-data.ts` under `dashboard/**` route folders for Phase 1 screens.

## Phase 1 live / mock checklist

| Area | Status |
|------|--------|
| Products, warehouses, stock receive, movements, transfers, adjustments | Live |
| Inventory dashboard, batches, reorder, valuation (WAC) | Live |
| Vendors (suppliers), purchase orders, goods receipt | Live |
| Customers, invoices (+ payments history, fulfill, reminders, draft edit), credit notes, debit notes, recurring (list/create/update/delete/generate/pause, retainer top-up kind) | Live |
| Delivery / Fulfillment (partial ship, delivery notes, pending-reconciliation + clear/reconcile, POS auto-fulfill) | Live |
| Invoice PDF print/download (jsPDF `.pdf` file + print window) | Live |
| Product create + edit (PATCH) | Live |
| Vendors, purchase orders, goods receipt, vendor bills | Live |
| Tenant settings (editable org profile via `PATCH /tenant/profile`) | Live |
| POS terminal / session open+close / list sessions / cash sale / refund / void | Live |
| Proposals (CRUD, send, reject, convert → invoice) | Live |
| Retainers (CRUD, draw, top-up, status, transfer, roll-over, forfeit, refund) | Live |
| Admin tenants, plans, payments, audit, settings-general | Live |
| Invoice PDF org header (from tenant `/me`) | Live |
| Retainer low-balance / expiry / fulfillment reconciliation alerts (computed from live data) | Live |
| Legal/social settings | Mock / deferred |
| Accounting GL, banking, VAT, leads | Out of Phase 1 (ComingSoon) |

## Reuse

Prefer `components/shared` (`FormField`, `FormDialog`, `PageHeading`, `FilterableTable`, `ConfirmDialog`) over per-feature duplicates.
