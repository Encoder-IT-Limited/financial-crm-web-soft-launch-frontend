import { newId, nextSequence } from "@/lib/format";
import type { Fulfillment, NewFulfillmentInput } from "../types";
import { productLookupApi } from "../../invoices/api/product-lookup.service";

/** Simulated network latency for the mock API. */
const delay = (ms = 300) => new Promise((resolve) => setTimeout(resolve, ms));

// In-memory mock "database" — module-scoped, resets on page reload. Same
// pattern as invoiceApi/adjustmentsApi. Starts empty: no invoice is
// fulfilled until someone (or POS, later) triggers it.
let fulfillments: Fulfillment[] = [];
let deliveryNoteSeq = 1;

export const fulfillmentsApi = {
  list: async (invoiceId?: string): Promise<Fulfillment[]> => {
    await delay(200);
    return invoiceId ? fulfillments.filter((f) => f.invoiceId === invoiceId) : fulfillments;
  },

  /** The next auto-assigned delivery note number, e.g. "DN-0001". Only
   * relevant when the caller intends trigger: "delivery-note". */
  getNextNumber: async (): Promise<string> => {
    await delay(120);
    return `DN-${nextSequence(deliveryNoteSeq)}`;
  },

  /** Deducts stock for every line in one transaction-like pass and
   * records the fulfillment. Never rejects on insufficient stock —
   * each line is flagged "pending-reconciliation" instead of blocking
   * the whole fulfillment (client-confirmed negative-stock rule). */
  create: async (input: NewFulfillmentInput): Promise<Fulfillment> => {
    await delay();
    const lines = [];
    for (const l of input.lines) {
      const { wentNegative } = await productLookupApi.deduct({
        productId: l.productId,
        warehouseId: l.warehouseId,
        quantity: l.quantityFulfilled,
      });
      lines.push({ ...l, status: wentNegative ? ("pending-reconciliation" as const) : ("fulfilled" as const) });
    }

    const fulfillment: Fulfillment = {
      id: newId("ful"),
      number: input.trigger === "delivery-note" ? `DN-${nextSequence(deliveryNoteSeq)}` : undefined,
      invoiceId: input.invoiceId,
      trigger: input.trigger,
      fulfilledAt: new Date().toISOString(),
      fulfilledBy: "Salma H.",
      lines,
      notes: input.notes || undefined,
    };
    if (input.trigger === "delivery-note") deliveryNoteSeq += 1;
    fulfillments = [fulfillment, ...fulfillments];
    return fulfillment;
  },

  /** Fires automatically at POS sale-post — same mutation as a manual
   * fulfillment, just trigger: "pos-auto" and no confirm step, per the
   * client's "triggered automatically for POS" requirement. No caller
   * exists until the POS module (Phase 3, not this module) creates
   * invoices — written now so that half of the requirement isn't
   * silently dropped (Key Decision I4). */
  autoFulfillPos: async (invoiceId: string, lines: NewFulfillmentInput["lines"]): Promise<Fulfillment> => {
    return fulfillmentsApi.create({ invoiceId, trigger: "pos-auto", lines });
  },
};
