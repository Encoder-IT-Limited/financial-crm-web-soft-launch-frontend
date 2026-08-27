# Reports (Sales & Invoicing) — No Dedicated API

`/dashboard/reports` (`reports-page.tsx`) has three tabs — Sales Report,
Invoice Report, Customer Statement — and **none of them call a report API**.
All three fetch the same full lists other pages already use and compute
everything client-side, the same pattern as Inventory's Dashboard/Valuation
(see `docs/qa/unused-apis.md`).

| Tab | What it actually does | API used |
|---|---|---|
| Sales Report | Fetches *every* invoice, buckets into 12 months by hand in JS | `invoiceApi.list()` only |
| Invoice Report | Fetches *every* invoice + every customer, filters by status client-side | `invoiceApi.list()` + `customersApi.list()` |
| Customer Statement | Fetches *every* invoice + *every* adjustment tenant-wide (not scoped to the chosen customer), filters down to one customer, computes a running balance in JS | `invoiceApi.list()` + `customersApi.list()` + `adjustmentsApi.list()` |

## What a real backend would need

1. **`GET /invoices/summary?months=12`** (or similar) — server-side monthly
   invoiced/collected aggregates for the Sales Report, instead of
   downloading every invoice ever created to bucket them in the browser.
2. **`GET /invoices?status=&search=&customerId=`** — already flagged in
   `docs/qa/missing-sales-invoice.md`; fixing it also fixes the Invoice
   Report tab for free, no separate work needed.
3. **`GET /customers/:id/statement`** (or `GET /reports/customer-statement
   ?customerId=`) — a single endpoint returning one customer's invoices,
   payments, and adjustments already merged, sorted, and with running
   balance computed server-side. Today the frontend downloads the *entire
   tenant's* invoices and adjustments just to throw away everyone except the
   one customer selected — this gets worse every time the tenant issues more
   invoices, regardless of which customer is being looked up.
