# Client Q&A — Multi-Tenant, Inventory, POS, Sales Invoicing (33 Questions)

> Recreated from the client's pasted answers (originally shared in chat as
> "Copy of question for MRM.md", never previously saved to the repo).
> Verbatim content, light formatting cleanup only. Cited throughout
> `docs/requirements/Client-Requirements-Phase1.md` and
> `docs/plans/Public-SuperAdmin-Plan.md`.

1. **Exactly which users will be counted as subscription seats, and what will the system do when the seat limit is exceeded?**
   Count every user account with an active login under the tenant — owner, admins, staff, and POS cashiers alike — toward the seat limit; service/API accounts and read-only auditors should not count. When a tenant tries to add a user beyond their plan's seat count, block the creation with a clear "upgrade your plan" message.

2. **When a subscription expires, will the tenant be immediately suspended, or will there be a grace period?**
   No grace period — the tenant moves to a read-only/suspended state immediately on expiry: users can still log in and view/export data, but cannot create new transactions (sales, invoices, stock movements) until payment is resolved. Full data deletion should still only happen after a much longer retention window (e.g., 30–90 days) — immediate suspension is about blocking new activity, not wiping data.

3. **Can tenants create custom roles and permissions, or will only predefined roles be available?**
   Ship a fixed set of predefined roles in Phase 1 (e.g., Owner, Admin, Inventory Manager, Sales/Cashier, Accountant, Viewer).

4. **Will Purchase Orders require approval? If yes, who will be responsible for approval?**
   Yes, Owner / Manager.

5. **Will Inventory Adjustments and Stock Transfers require approval?**
   Yes, Owner/Manager.

6. **Will negative stock be allowed, or will the transaction be blocked when there is insufficient stock?**
   Allowed transaction. But should be on state PENDING — stock confirmation missing.

7. **What will be the batch stock issuing rule — FIFO, FEFO, or manual batch selection?**
   Default to FEFO (first-expired, first-out) for anything with an expiry date, since that's what actually cuts down on spoilage and waste. For items without expiry tracking, it falls back to plain FIFO. Staff can still manually pick a different batch when they need to (say, a customer asks for a specific one), but the system will auto-suggest the right batch by default.

8. **What will be the stock valuation method — FIFO, Weighted Average, or another method?**
   Go with Weighted Average Cost for Phase 1 — it's the more common choice and simpler to build, since you're not tracking separate cost layers per batch, and it works fine across most types of businesses. FIFO is the go-to alternative if your tenants are in industries where pricing swings a lot (import/export businesses, for instance) — can always add that as a per-tenant setting down the line.

9. **At which stage will a Goods Receipt increase stock — when the receipt is confirmed/posted, or at another stage?**
   Stock should increase when the Goods Receipt is confirmed/posted — not when the PO is created, and not when the vendor bill is entered. This keeps "what's on the shelf" tied to a physical, verifiable event.

10. **Should Partial Goods Receipt be supported?**
    Yes — this is close to a hard requirement for any real procurement flow, since vendors routinely ship in multiple batches. The PO should track received-vs-ordered quantity per line and stay "Open" until fully received or manually closed.

11. **Will Stock Transfer be direct, or will it follow a Request → Approve → Dispatch → Receive workflow?**
    Use the full Request → Approve → Dispatch → Receive workflow rather than a direct transfer. Stock should leave the source warehouse at Dispatch (moved to an "in-transit" state) and only land in the destination warehouse at Receive — this gives visibility into transfers that are lost, short, or delayed in transit.

12. **At which stage will an Invoice deduct inventory — when the invoice is issued/posted, when payment is received, or when the goods are delivered?**
    For a straightforward retail/POS sale, deduct inventory at the point the sale/invoice is posted (issued), since the goods physically leave with the customer at that moment. For invoice-first B2B workflows where delivery happens separately from invoicing, deduct at Delivery/Fulfillment instead and treat the Invoice as a financial document only — Phase 1 should support both, tying deduction to a "fulfillment"/"delivery" event that's triggered automatically for POS sales and manually/via a delivery note for B2B invoices.

13. **Will a Vendor Bill affect inventory, or will only the Goods Receipt increase inventory while the Vendor Bill is used for accounting purposes?**
    Only the Goods Receipt should increase inventory. The Vendor Bill is a purely financial document (recording the payable and matching it against the PO/GR) and should never independently move stock — otherwise you risk double-counting when a bill and receipt are entered for the same delivery at different times.

14. **Will a Draft Invoice reserve stock?**
    No — a Draft Invoice should not reserve stock. Reserving stock on a draft risks tenants accumulating phantom reservations that block real sales. If reservation is needed pre-commitment, use a separate explicit "Sales Order" or "Quote with hold" concept in a later phase.

15. **Will each POS Register be linked to a specific warehouse/location, with stock deducted from that warehouse?**
    Yes — every POS Register should be configured with a single linked warehouse/location, and all sales through that register deduct from that warehouse's stock. Essential for multi-location retail chains.

16. **If the POS is offline, which operations will be allowed — only sales, or also customer creation, discounts, refunds, etc.?**
    Support sales as the core offline operation, plus basic customer lookup/creation and standard discounts configured ahead of time (percentage/fixed rules already synced to the device). Reserve refunds and manager-override discounts for online-only in Phase 1 — higher fraud/error risk.

17. **If multiple offline POS registers sell the same stock, how will stock conflicts be handled during synchronization?**
    Apply a "sync in timestamp order, allow negative stock temporarily" rule: when multiple offline registers sync sales for the same low-stock item, accept all transactions as valid sales (don't reject a completed customer sale after the fact), let the resulting stock go negative if oversold, and surface an alert to the Inventory Manager to reconcile/restock.

18. **If available stock cannot be verified while offline, will the system still allow the sale?**
    Yes, allow the sale to proceed offline even though live stock can't be verified — blocking sales at the register because of a connectivity issue is worse than an occasional oversell that gets flagged and reconciled afterward.

19. **If an offline POS transaction fails to sync, will there be an automatic retry, or will manual resolution be required?**
    Use automatic retry with exponential backoff as the first line of defense, and escalate to a manual-resolution queue only after repeated automatic failures — surfaced to an admin with the full transaction payload so nothing is silently lost.

20. **Which exact barcode scanner, receipt printer, and cash drawer hardware/models need to be supported?**
    *(Left unanswered by the client.)*

21. **Will POS register opening/closing and end-of-day cash reconciliation be required?**
    Yes.

22. **Will the POS support split payments?**
    Yes.

23. **Which POS operations should be supported: refund, partial refund, return, and exchange?**
    Yes.

24. **Will returned products automatically be added back to inventory? How should damaged returns be handled?**
    Sellable-condition returns should automatically go back into available stock at the original warehouse. Damaged returns need a distinct disposition path — route them to a "damaged/quarantine" stock status (not sellable, not counted in available inventory) rather than deleting them or silently mixing them back into sellable stock; a manager can then write them off via the Inventory Adjustment flow.

25. **Will manager approval/PIN be required for POS discounts, voids, and refunds?**
    Yes.

26. **Should invoices support partial and multiple payments?**
    Yes.

27. **What should the final invoice status workflow be? For example: Draft → Sent → Partially Paid → Paid → Overdue → Cancelled/Void.**
    That is the right lifecycle, with one addition: Overdue should be a computed flag/state based on due date rather than a manually set status, so it can apply on top of "Sent" or "Partially Paid" (e.g., "Partially Paid, Overdue") rather than being mutually exclusive with them.

28. **What is the exact purpose/content of the Invoice QR Code — invoice verification, payment link, tax information, or something else?**
    Default it to a payment link — a QR that takes the customer straight to an online payment page for that invoice, since that's the highest-value use case. If your tenants operate in a jurisdiction with e-invoicing/tax QR mandates (e.g., ZATCA in Saudi Arabia), the QR content needs to follow that jurisdiction's required tax-data format instead — worth confirming per target market before locking the format.

29. **Should Recurring Invoices be automatically generated and sent, or should they be generated as drafts and sent only after approval?**
    Generate them as drafts first, with an option per tenant to switch a given recurring template to "auto-send" once they trust it. Auto-generating and auto-sending everything by default risks sending incorrect invoices to customers with no human check.

30. **When a Credit Note is issued, should it only adjust the invoice balance, or should it also be able to trigger a refund and inventory return?**
    A Credit Note should be able to do both, driven by what the customer actually returned: if it's a pure billing correction it should only adjust the invoice balance; if it's tied to a physical product return, it should also trigger the inventory return flow and, if the customer already paid, offer a refund rather than just a balance credit. Model it as one Credit Note object with optional "linked return" and "linked refund" flags rather than three separate document types.

31. **Should each tenant have a single base currency, or is multi-currency support required at the transaction/invoice level?**
    Give each tenant a single base currency for Phase 1, with the option to record individual transactions (invoices, POS sales) in a foreign currency converted to base at the transaction-date rate for accounting purposes. True multi-currency ledgers are better scoped for a later phase.

32. **From Phase 1, should POS, Invoice, and Inventory transactions create actual accounting journal entries, or should they only create integration events/store records for the Accounting module?**
    In Phase 1, POS, Invoice, and Inventory transactions should create structured integration events/records — not full double-entry journal entries.

33. **Should POS Sales and normal Invoices have separate numbering sequences?**
    Yes, keep POS Sales and standard Invoices on separate numbering sequences (e.g., `POS-000001` vs `INV-000001`). They're different document types functionally and often legally, and a shared sequence makes reconciliation harder.
