/* ------------------------------------------------------------------ */
/* Delivery / Fulfillment — the join point with Inventory (docs/plans/ */
/* Sales-Invoicing-Implementation-Plan.md Phase I). Deducts stock at   */
/* the moment goods actually leave the warehouse: automatically for   */
/* POS, manually or via a delivery note for B2B invoices — never at   */
/* invoice creation/send. Built against the same isolated demo catalog*/
/* as the Product Picker (product-lookup-seed.ts), not real Inventory.*/
/* ------------------------------------------------------------------ */

import type { Invoice, InvoiceLine } from "../invoices/types";

export type FulfillmentTrigger = "pos-auto" | "manual" | "delivery-note";

/** "pending-reconciliation" is set when a line's deduction took its
 *  warehouse below zero — allowed, never blocked, but flagged for
 *  follow-up (client-confirmed rule, see Backend-Build-Guide.md §8). */
export type FulfillmentLineStatus = "fulfilled" | "pending-reconciliation";

export type FulfillmentLine = {
  invoiceLineId: string;
  productId: string;
  warehouseId: string;
  quantityFulfilled: number;
  status: FulfillmentLineStatus;
};

export type Fulfillment = {
  id: string;
  /** Only set when trigger is "delivery-note" — a printable, numbered
   *  document. Internal-only (no number) for "manual"/"pos-auto". */
  number?: string;
  invoiceId: string;
  trigger: FulfillmentTrigger;
  fulfilledAt: string;
  fulfilledBy: string;
  lines: FulfillmentLine[];
  notes?: string;
};

export type NewFulfillmentLineInput = {
  invoiceLineId: string;
  productId: string;
  warehouseId: string;
  quantityFulfilled: number;
};

export type NewFulfillmentInput = {
  invoiceId: string;
  trigger: FulfillmentTrigger;
  lines: NewFulfillmentLineInput[];
  notes?: string;
};

/** "not-applicable" = every line is free-text (no linked product) —
 *  nothing on this invoice can ever be fulfilled. Derived, never
 *  stored — same pattern as invoiceDisplayStatus(). */
export type InvoiceFulfillmentStatus = "not-applicable" | "unfulfilled" | "partially-fulfilled" | "fulfilled";

/** Invoice lines that carry both a product and a warehouse — the only
 *  lines fulfillment ever applies to. Free-text lines are excluded. */
export function fulfillableLines(invoice: Invoice): (InvoiceLine & { productId: string; warehouseId: string })[] {
  return invoice.lines.filter((l): l is InvoiceLine & { productId: string; warehouseId: string } => !!l.productId && !!l.warehouseId);
}

/** Total quantity already fulfilled for one invoice line, across every
 *  fulfillment record (a line can be fulfilled across several partial
 *  shipments). */
export function fulfilledQuantity(invoiceLineId: string, fulfillments: Fulfillment[]): number {
  return fulfillments.reduce(
    (sum, f) => sum + f.lines.filter((l) => l.invoiceLineId === invoiceLineId).reduce((s, l) => s + l.quantityFulfilled, 0),
    0
  );
}

/** Total ordered quantity across an invoice's product-linked lines — the
 * denominator for a progress display. */
export function totalOrderedQuantity(invoice: Invoice): number {
  return fulfillableLines(invoice).reduce((sum, l) => sum + l.quantity, 0);
}

/** Total quantity fulfilled so far across an invoice's product-linked
 * lines, summed over every fulfillment record for it. */
export function totalFulfilledQuantity(invoice: Invoice, fulfillments: Fulfillment[]): number {
  return fulfillableLines(invoice).reduce((sum, l) => sum + fulfilledQuantity(l.id, fulfillments), 0);
}

export function invoiceFulfillmentStatus(invoice: Invoice, fulfillments: Fulfillment[]): InvoiceFulfillmentStatus {
  const lines = fulfillableLines(invoice);
  if (lines.length === 0) return "not-applicable";

  let anyFulfilled = false;
  let allFulfilled = true;
  for (const line of lines) {
    const fulfilled = fulfilledQuantity(line.id, fulfillments);
    if (fulfilled > 0) anyFulfilled = true;
    if (fulfilled < line.quantity) allFulfilled = false;
  }

  if (allFulfilled) return "fulfilled";
  if (anyFulfilled) return "partially-fulfilled";
  return "unfulfilled";
}

export const FULFILLMENT_STATUS_LABELS: Record<InvoiceFulfillmentStatus, string> = {
  "not-applicable": "Not applicable",
  unfulfilled: "Unfulfilled",
  "partially-fulfilled": "Partially Fulfilled",
  fulfilled: "Fulfilled",
};
