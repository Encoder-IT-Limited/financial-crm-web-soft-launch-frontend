/* Minimal fulfillment types for the POS demo mock API. */

export type FulfillmentTrigger = "pos-auto" | "manual" | "delivery-note";

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
