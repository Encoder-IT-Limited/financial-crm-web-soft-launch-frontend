# Sales & Invoicing — API & Frontend Issues, by Module

Re-verified against current code and live-tested again. Everything previously
listed as "needs verification" has now been resolved (all confirmed correct
live: proposal-to-invoice conversion, recurring-template generation for both
invoice and retainer-topup kinds, CSV export, and delivery-note generation —
none were bugs, all working as intended). What's below is what's still open.

---

## Invoices

### API — could be better

- **The main invoices list can't move to real server-side pagination without
  a backend change first.** `GET /invoices` itself supports `page`/`pageSize`
  correctly (live-tested: `?page=1&pageSize=5` returns exactly 5 records with
  a correct `meta` envelope). But the Invoices page also does client-side
  search (by invoice #, customer name, notes) and filtering (by status, by
  customer) across the *entire* invoice list — and the backend has no
  search/filter query params, only pagination ones. Switching
  `invoiceApi.list()` to `listPage()` with real page state would fetch one
  page at a time, but the search/filter box would then only search within
  whatever page happens to be loaded, not the full dataset — a real
  regression, not a fix. Properly solving this needs the backend to accept
  filter/search params on `GET /invoices` (e.g. `?search=&status=&customerId=`)
  so filtering can happen server-side alongside pagination; the current
  "fetch everything, filter and paginate client-side" approach is the correct
  tradeoff until that exists, not a bug to patch on the frontend alone.

---

## Recurring Templates

### API — could be better

- **Pagination controls exist in the UI, but they're not real.**
  `recurring-templates-panel.tsx` has working page/prev/next controls, but
  `recurringApi.list()` calls `apiGetPage("/recurring-templates")` with no
  `page`/`pageSize` params — it fetches every template in one request and
  paginates client-side over that. There's no `listPage()` method on
  `recurringApi` at all (unlike `invoiceApi`, which has both `list()` and
  `listPage()`). Same underlying issue as the Invoices list below, but
  simpler to actually fix here — this panel has no search/filter feature
  that would conflict with switching to true server-side pagination, so once
  `recurringApi` gets a `listPage()` method (mirroring `invoiceApi`'s), the
  panel can switch to it directly.

---

## Retainers

### Needs verification

- **Forfeit/Refund permission enforcement.** Endpoints:
  `POST /retainers/:id/forfeit`, `POST /retainers/:id/refund`. Frontend gates
  these behind `can(me, "retainer.approve")`. Couldn't verify whether the
  backend independently enforces this — testing it requires a real user
  account without the `retainer.approve` permission, which isn't available
  with the current owner-level test credentials.
