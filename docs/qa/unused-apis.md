# APIs Available But Not Used in Frontend

These aren't bugs — the backend already returns or supports this data/
capability, but the frontend doesn't read/call it. Opportunities to enrich
existing pages without any backend work, not things blocking anything today.

---

## Sales & Invoicing

### Recurring Templates

- `GET /recurring-templates` already supports real server-side
  `page`/`pageSize` pagination (live-verified: `?page=1&pageSize=3` returns
  exactly 3 records with correct `meta.total`), but `recurringApi.list()`
  never sends these params — it fetches everything and paginates
  client-side instead. Adding a `listPage()` method (mirroring
  `invoiceApi`'s) and wiring `recurring-templates-panel.tsx` to it is a pure
  frontend change with no backend blocker.

---

## Inventory

### Products

- `GET /inventory/products` returns `damagedOnHand` on every record, but
  `mapProduct` (`inventory.service.ts`) never reads it — no product page
  can show damaged-stock counts.

### Dashboard & Valuation

- Both compute stock value as `quantity × averageCost`, ignoring the
  `damagedQuantity`/`reservedQuantity` fields `GET /inventory/stock` already
  returns on every row — damaged/reserved units get valued as fully
  sellable stock in both places.

### Stock Movement / Adjustments

- `GET /inventory/movements` returns `batchId`, `referenceType`, and
  `referenceId` on every row, but the frontend mapper drops all three —
  neither page can show which batch or source document (invoice, PO, etc.)
  caused a given movement, even though the data is already there.

### Stock Transfer

- `GET /inventory/transfers` (list and detail) returns
  `fromWarehouseCode`/`toWarehouseCode`/`requestedBy`/`approvedBy`/
  `dispatchedAt`/`receivedAt` on every record, but the frontend mapper drops
  all of them — the transfer detail dialog can't show who approved a
  transfer or when it was dispatched/received.

### Goods Receipt

- Purchase order items from `GET /procurement/purchase-orders` include
  `receivedQuantity` per line (partial-receipt tracking), but the frontend
  drops it — no "3 of 5 received" progress is shown anywhere despite the
  backend tracking it.
- `GoodsReceipt` type is missing `receiptDate` and `status`, both present on
  the live `GET /procurement/purchase-orders/:id/goods-receipts` response.
- `procurementApi.listGoodsReceipts` exists and works live, but nothing
  calls it — there's no receipt-history view; past receipts are fully
  invisible in the UI despite the backend having complete data for them.
