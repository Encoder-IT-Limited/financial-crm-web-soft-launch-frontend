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

export const customerSchema = z.object({
  name: z.string().trim().min(2, "Company name is required"),
  email: z.string().trim().email("Enter a valid email"),
  phone: z.string().trim().min(5, "Enter a valid phone number"),
  address: z.string().trim().min(3, "Address is required"),
  trn: z.string().trim().min(5, "Enter a valid TRN"),
});

export type CustomerValues = z.infer<typeof customerSchema>;

/** Pull the first issue message for a field path, e.g. "lines.0.description". */
export function firstError(result: { issues: { path: (string | number)[]; message: string }[] }, path: string): string | undefined {
  return result.issues.find((issue) => issue.path.join(".") === path)?.message;
}