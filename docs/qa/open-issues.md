# Open Issues — All Modules

## POS

- **Payment `currency` is `null`.** Endpoint: `GET /pos/sales/:id`. Every
  entry in `payments[]` (including a refund's negative reversal row) comes
  back with `"currency": null` instead of a real currency code. Same shape
  of gap as invoices/credit notes/retainers elsewhere.

## Reports

- **`GET /invoices?overdue=` is non-deterministic (backend).** `?overdue=true`
  and `?overdue=false` sometimes both return the full unfiltered list instead
  of filtering.

## Admin Portal & Public Site

- **No create-tenant endpoint/action (Admin — Tenants).** No
  `tenantsApi.create()` exists, and no "New tenant" button anywhere in the
  module.
- **Legal page content is still literal placeholder text (Public — Legal).**
  `/privacy` and `/terms` correctly fetch from a real backend, but the
  content itself is still "This is a placeholder Privacy Policy... final
  text will be reviewed and provided by legal before launch."
