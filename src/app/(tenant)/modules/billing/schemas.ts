import { z } from "zod";

export const invoiceLineSchema = z.object({
  description: z.string().trim().min(2, "Description is required"),
  quantity: z.coerce.number().positive("Qty must be greater than 0").max(1_000_000, "Qty too large"),
  unitPrice: z.coerce.number().nonnegative("Unit price can't be negative"),
  taxRate: z.coerce.number().min(0).max(100),
});

export const invoiceFormSchema = z
  .object({
    customerId: z.string().min(1, "Select a customer"),
    issueDate: z.string().min(1, "Issue date is required"),
    dueDate: z.string().min(1, "Due date is required"),
    currency: z.enum(["AED", "USD", "EUR", "GBP", "SAR"]).default("AED"),
    discountPercent: z.coerce.number().min(0, "Discount can't be negative").max(100, "Discount max 100%").default(0),
    lines: z.array(invoiceLineSchema).min(1, "Add at least one line item"),
    notes: z.string().max(500, "Notes too long (max 500 chars)").optional(),
  })
  .superRefine((data, ctx) => {
    if (data.dueDate < data.issueDate) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["dueDate"],
        message: "Due date can't be before the issue date",
      });
    }
  });

export type InvoiceFormValues = z.infer<typeof invoiceFormSchema>;

export const recordPaymentSchema = z
  .object({
    amount: z.coerce.number().positive("Amount must be greater than 0"),
    date: z.string().min(1, "Date is required"),
    method: z.string().min(1, "Select a method"),
    reference: z.string().max(60).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.date > new Date().toISOString().slice(0, 10)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["date"], message: "Payment date can't be in the future" });
    }
  });

export type RecordPaymentValues = z.infer<typeof recordPaymentSchema>;

export const recurringTemplateSchema = z
  .object({
    customerId: z.string().min(1, "Select a customer"),
    description: z.string().trim().min(3, "Description is required"),
    currency: z.enum(["AED", "USD", "EUR", "GBP", "SAR"]).default("AED"),
    amount: z.coerce.number().positive("Amount must be greater than 0"),
    frequency: z.enum(["weekly", "monthly", "quarterly", "yearly"]),
    nextInvoiceDate: z.string().min(1, "Next billing date is required"),
  })
  .superRefine((data, ctx) => {
    if (data.nextInvoiceDate < new Date().toISOString().slice(0, 10)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["nextInvoiceDate"],
        message: "Next billing date can't be in the past",
      });
    }
  });

export type RecurringTemplateValues = z.infer<typeof recurringTemplateSchema>;

export const proposalFormSchema = z
  .object({
    customerId: z.string().min(1, "Select a customer"),
    date: z.string().min(1, "Date is required"),
    expiryDate: z.string().min(1, "Expiry date is required"),
    currency: z.enum(["AED", "USD", "EUR", "GBP", "SAR"]).default("AED"),
    discountPercent: z.coerce.number().min(0, "Discount can't be negative").max(100, "Discount max 100%").default(0),
    lines: z.array(invoiceLineSchema).min(1, "Add at least one line item"),
    notes: z.string().max(500, "Notes too long (max 500 chars)").optional(),
  })
  .superRefine((data, ctx) => {
    if (data.expiryDate < data.date) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["expiryDate"],
        message: "Expiry date can't be before the proposal date",
      });
    }
  });

export type ProposalFormValues = z.infer<typeof proposalFormSchema>;

export const adjustmentFormSchema = z.object({
  kind: z.enum(["credit", "debit"]),
  customerId: z.string().min(1, "Select a customer"),
  invoiceId: z.string().optional(),
  amount: z.coerce.number().positive("Amount must be greater than 0"),
  reason: z.string().trim().min(3, "Reason is required"),
});

export type AdjustmentFormValues = z.infer<typeof adjustmentFormSchema>;

export const retainerFormSchema = z
  .object({
    customerId: z.string().min(1, "Select a customer"),
    contractAmount: z.coerce.number().positive("Contract amount must be greater than 0"),
    billingPeriod: z.enum(["monthly", "quarterly", "yearly"]),
    billingModel: z.enum(["one-time", "recurring"]).default("one-time"),
    currency: z.enum(["AED", "USD", "EUR", "GBP", "SAR"]).default("AED"),
    startDate: z.string().min(1, "Start date is required"),
    expiryDate: z.string().optional(),
    notes: z.string().max(500, "Notes too long (max 500 chars)").optional(),
  })
  .superRefine((data, ctx) => {
    if (data.expiryDate && data.expiryDate < data.startDate) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["expiryDate"],
        message: "Expiry date can't be before the start date",
      });
    }
  });

export type RetainerFormValues = z.infer<typeof retainerFormSchema>;

export const retainerTopUpSetupSchema = z
  .object({
    nextInvoiceDate: z.string().min(1, "Next top-up date is required"),
  })
  .superRefine((data, ctx) => {
    if (data.nextInvoiceDate < new Date().toISOString().slice(0, 10)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["nextInvoiceDate"], message: "Can't be in the past" });
    }
  });

export type RetainerTopUpSetupValues = z.infer<typeof retainerTopUpSetupSchema>;

export const retainerRolloverSchema = z.object({
  newExpiryDate: z.string().min(1, "New expiry date is required"),
});

export type RetainerRolloverValues = z.infer<typeof retainerRolloverSchema>;

export const retainerTransferSchema = z.object({
  toRetainerId: z.string().min(1, "Select a destination retainer"),
});

export type RetainerTransferValues = z.infer<typeof retainerTransferSchema>;

export const retainerRefundSchema = z.object({
  reason: z.string().trim().min(3, "A reason is required"),
});

export type RetainerRefundValues = z.infer<typeof retainerRefundSchema>;

export const fulfillmentLineInputSchema = z.object({
  invoiceItemId: z.string().min(1),
  quantity: z.coerce.number().min(0, "Quantity can't be negative"),
});

export const fulfillmentFormSchema = z.object({
  warehouseId: z.string().min(1, "Select a warehouse"),
  generateDeliveryNote: z.boolean().default(false),
  notes: z.string().max(500).optional(),
  lines: z.array(fulfillmentLineInputSchema).min(1, "Add at least one line"),
});

export type FulfillmentFormValues = z.infer<typeof fulfillmentFormSchema>;

/** Pull the first issue message for a field path, e.g. "lines.0.description". */
export function firstError(result: { issues: { path: (string | number)[]; message: string }[] }, path: string): string | undefined {
  return result.issues.find((issue) => issue.path.join(".") === path)?.message;
}