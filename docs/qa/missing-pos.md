# POS — API & Frontend Issues, by Module

Re-verified live against the backend (`owner@demo.local` / tenant realm) on
2026-08-27. What's left:

## Critical — blocks the module right now

- **`GET /pos/sales/:id` and `GET /pos/sales/:id/receipt` both return HTTP
  500** (`{"code":"INTERNAL_ERROR","message":"Something went wrong"}`) —
  confirmed live. This is the same backend regression documented in
  `docs/qa/missing-reports.md` for `GET /invoices`/`GET /invoices/:id` (POS
  sales auto-create a real invoice, so the two are almost certainly the same
  underlying bug). List endpoints (`GET /pos/sales`, `GET /pos/sessions`,
  `GET /pos/terminals`) are unaffected — only single-record fetches 500.
  Cascading breakage while this stays broken:
  - **Sale detail page** (`dashboard/pos/sales/[saleId]/page.tsx` →
    `sale-detail.tsx`) — calls `posSalesApi.get(id)`, which always hits the
    broken endpoint. The page cannot load for any sale.
  - **Receipt** — same endpoint, same failure.
  - **Close Shift dialog** (`close-session-dialog.tsx:38`) — calls
    `posSalesApi.listRefunds()` with no `saleId` to compute cash
    reconciliation. `sales.service.ts`'s `listRefunds()` only trusts the
    list response's inline `returns` array when it's non-empty; for any sale
    with zero returns it falls back to `GET /pos/sales/${sale.id}` to
    double-check — which throws. In practice almost every session has at
    least one zero-return sale, so **closing a shift is broken right now**,
    not just the sale-detail page.
  - `posSalesApi.create()` also routes through `hydrateSale()`, which
    re-fetches `/pos/sales/${row.id}` whenever the create response doesn't
    already include `payments` — so a new sale may fail to resolve
    client-side (stock is still deducted server-side; only the UI's
    post-checkout response is at risk) depending on what the create
    response shape actually includes.
  - Can't verify the previously-flagged **payment `currency: null`** issue
    while this endpoint is down — it needs a single-sale fetch to check.

## API — could be better

- **No field to record cash tendered vs. change given** — the frontend
  (`payment-dialog.tsx`) sends the excess as `payments[].tenderedAmount` on
  overpayment; whether the backend actually persists/echoes it back
  correctly can't be confirmed live since `GET /pos/sales/:id` is down (see
  above).

## Cross-module — still needs verification

- **Fulfillment/delivery overlap.** `POST /pos/sales` still auto-creates and
  auto-fulfills a real invoice server-side (`source: "POS"`). Whether that
  runs through the same backend code path as `POST /invoices/:id/fulfill`
  (manual fulfillment elsewhere in Sales & Invoicing) or a separate parallel
  implementation is still unconfirmed — worth checking so the two don't
  drift into inconsistent behavior. Unchanged from last pass.
