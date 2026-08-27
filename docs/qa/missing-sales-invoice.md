# Sales & Invoicing — API & Frontend Issues, by Module

Re-verified again against current code and live-tested against the real
backend (`owner@demo.local`, tenant realm, `permissions: ["*"]`).

---

## Invoices

### API — blocked on backend, not a frontend bug

- **The main invoices list can't move to real server-side pagination without
  a backend change first.** `invoiceApi.list()` (used by the Invoices page)
  still fetches the entire invoice list in one request and does search (by
  invoice #, customer name, notes) and status/customer filtering entirely
  client-side, over the full dataset. `listPage()` exists and its
  `page`/`pageSize` params work correctly, but `GET /invoices` has no
  search/filter query params at all — confirmed live: `?search=`, `?status=`,
  and `?customerId=` are each silently ignored, always returning the full
  55-record set. Switching to `listPage()` today would make the search box
  only search whatever page happens to be loaded — a regression, not a fix.
  Needs the backend to accept `?search=&status=&customerId=` on `GET
  /invoices` before this can move to real server-side filtering; "fetch
  everything, filter/paginate client-side" is the correct tradeoff until then.

---

## Retainers

### Needs verification

- **Forfeit/Refund permission enforcement.** Endpoints:
  `POST /retainers/:id/forfeit`, `POST /retainers/:id/refund`. Frontend gates
  these behind `can(me, "retainer.approve")`. Still can't verify whether the
  backend independently enforces this — re-confirmed via live login that
  `owner@demo.local` carries `permissions: ["*"]`, so it can't exercise the
  denied-permission path. Needs a real tenant user account whose role
  excludes `retainer.approve` to test.
