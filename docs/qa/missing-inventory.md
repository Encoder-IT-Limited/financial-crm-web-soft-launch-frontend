# Inventory — Open Issues

## Dashboard

- No dedicated dashboard/summary endpoint — KPIs, stock-value-by-warehouse,
  recent movements, and low-stock are all computed client-side from four
  separate list queries (`inventory-dashboard-page.tsx`).

## Warehouses

- The warehouse details dialog shows only a product *count* ("Products with
  stock: N"), never the actual product list. There's no API that returns
  this directly — building it needs fetching `GET /inventory/stock` (a
  separate endpoint the Warehouses page doesn't call today) and filtering
  its flat, all-warehouses list down to this one.
- No damaged/reserved breakdown for a warehouse's `totalOnHand` either, for
  the same reason — it would need aggregating `GET /inventory/stock` rows by
  warehouse, which nothing does today.

## Stock Movement / Adjustments

- Adjustments has no reason/note field anywhere — `AdjustStockInput` is just
  `{ productId, warehouseId, quantityDelta }`; the adjustment ledger can
  never record *why* a stock change happened.

## Stock Transfer

- **Backend bug**: the `search` query param on `GET /inventory/transfers`
  crashes the backend — every value tested returns
  `{"success":false,"error":{"code":"INTERNAL_ERROR"}}`. The frontend sends
  the param correctly; this needs a backend fix.

## Reorder / Low Stock

- The entire low-stock list and "suggested reorder quantity" are computed
  client-side with a made-up heuristic (`Math.max(1, reorderLevel*2 -
  stock)`) — no backend endpoint or basis for the suggestion.

## Valuation

- No dedicated valuation/costing endpoint — total and per-row value are
  `quantity × averageCost` computed client-side from raw stock + product
  data (the code's own comment: "Phase 1 valuation is weighted-average cost
  only").
