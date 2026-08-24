# Client Q&A — Retainers

> Recreated from the client's pasted answers (originally shared in chat as
> "Questions for MRM.md", never previously saved to the repo). Verbatim
> content, light formatting cleanup only. Cited throughout
> `docs/plans/Sales-Invoicing-Implementation-Plan.md` (Phase E/H) and
> `docs/requirements/Client-Requirements-Phase1.md`.

## A. Initial funding (the "customer already gave us money" part)

- When a customer pays the retainer lump sum upfront, should the system generate a formal Invoice for that amount at the moment the retainer is created? Or is that payment handled entirely outside the system, and the retainer is just an internal balance tracker?

**Answer**: Yes, it should have an Invoice if they paid a Retainer amount — but customer will use the initial funding, e.g. for their subscription/upgrades etc. System should generate another invoice if it collected from Funding, as due balance will be 0.00 and mark as paid if funding can cover all.

- If yes to an invoice — should it be marked Paid immediately (since the money's already in hand), or does it need to go through the normal Send → Pay flow?

**Answer**: (see above — mark as paid if funding can cover all.)

## B. Drawing down the balance (the core question)

- When you use retainer money to deliver a service or sell a product, should the system create a real Invoice for that specific piece of work, with its amount automatically deducted from the retainer? Or should usage stay as a simple internal log entry (amount + description, no invoice) like it works today?
- If an invoice is generated per use — should it be auto-marked Paid, or left unpaid until someone confirms the draw?
- Can a single use draw from more than one source — e.g., invoice is AED 1,000, only AED 700 left on the retainer: does the system split it (AED 700 from retainer + AED 300 as a normal payment), or is that not allowed?

**Answer**: *(Not answered — left blank in the client's response. This is the one section with no direct answer; resolved only by inference — see Sales-Invoicing-Implementation-Plan.md Key Decisions #11–13.)*

## C. Is this a one-time pot or a recurring subscription?

**Answer**: Both one time payment & subscription.

- Is a Retainer always a single lump sum the customer pays once and draws down until it's gone? Or can it be a recurring thing — the customer is billed the same amount every month/quarter, and each new invoice tops the balance back up?
- If recurring — does unused balance roll over to the next period, or does it reset to zero each cycle ("use it or lose it")?
- If recurring — should that periodic invoice be generated automatically on schedule, or manually triggered (same as how Recurring Invoices work today — nothing fires by itself)?

*(Sub-questions not directly answered — resolved by inference, see Key Decision #14.)*

## D. Contract end / expiry

- Does a retainer contract have an end date? If the contract period ends with money still left on it — is that balance forfeited, refunded, or rolled into a new contract?

**Answer**: Yes.

- Should the system alert anyone (you or the customer) when a retainer is about to expire, or when the balance is running low?

**Answer**: Yes.

## E. Refunds and overdraw

**Answer**: For now we will only give Transfer or Roll over new contract. Forfeit and Refunds need admin approve.

- Can a customer ever get refunded unused retainer balance (e.g., they cancel early)? If yes, does that need to produce a real accounting record (similar to how we now generate a negative-value invoice for standalone credit notes)?
- Should overdrawing ever be allowed with manual approval, or should it always be a hard cap like it is now (can't log usage bigger than what's remaining)?

*(The overdraw sub-question specifically was not directly answered — resolved by inference, see Key Decision #10.)*

## F. Visibility

**Answer**: Yes.

- Should retainer activity (funding, draws, balance changes) show up in the Customer Statement report alongside their invoices and payments, so you get one full financial picture per customer?
