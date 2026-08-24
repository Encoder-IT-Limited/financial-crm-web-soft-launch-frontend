import { z } from "zod";

export const fulfillmentLineInputSchema = z.object({
  invoiceLineId: z.string().min(1),
  productId: z.string().min(1),
  warehouseId: z.string().min(1),
  quantityFulfilled: z.coerce.number().positive("Quantity must be greater than 0"),
});

export const fulfillmentFormSchema = z.object({
  trigger: z.enum(["manual", "delivery-note"]),
  lines: z.array(fulfillmentLineInputSchema).min(1, "Select at least one line to fulfill"),
  notes: z.string().max(300, "Notes too long (max 300 chars)").optional(),
});

export type FulfillmentFormValues = z.infer<typeof fulfillmentFormSchema>;
