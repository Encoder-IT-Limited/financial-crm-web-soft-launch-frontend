import { z } from "zod";

export const terminalFormSchema = z.object({
  name: z.string().trim().min(2, "Name is required"),
  code: z.string().trim().min(2, "Code is required").max(12, "Code too long"),
  warehouseId: z.string().min(1, "Select a warehouse"),
  accessCode: z.string().trim().min(4, "Access code must be at least 4 characters"),
});

export type TerminalFormValues = z.infer<typeof terminalFormSchema>;

export const openSessionSchema = z.object({
  terminalId: z.string().min(1, "Select a terminal"),
  cashierName: z.string().trim().min(2, "Enter your name"),
  accessCode: z.string().trim().min(1, "Enter the terminal's access code"),
  openingCash: z.coerce.number().nonnegative("Opening cash can't be negative"),
});

export type OpenSessionValues = z.infer<typeof openSessionSchema>;

export const closeSessionSchema = z.object({
  closingCashCounted: z.coerce.number().nonnegative("Counted cash can't be negative"),
});

export type CloseSessionValues = z.infer<typeof closeSessionSchema>;

export const cartDiscountSchema = z.object({
  amount: z.coerce.number().nonnegative("Discount can't be negative"),
  isOverride: z.boolean(),
  managerPin: z.string().optional(),
});

export type CartDiscountValues = z.infer<typeof cartDiscountSchema>;

export const paymentLineSchema = z.object({
  method: z.enum(["cash", "card", "mobile-payment"]),
  amount: z.coerce.number().positive("Amount must be greater than 0"),
});

export const checkoutSchema = z.object({
  payments: z.array(paymentLineSchema).min(1, "Add at least one payment"),
});

export type CheckoutValues = z.infer<typeof checkoutSchema>;

export const refundFormSchema = z.object({
  lines: z
    .array(
      z.object({
        productId: z.string().min(1),
        quantity: z.coerce.number().nonnegative(),
        condition: z.enum(["sellable", "damaged"]),
      })
    )
    .min(1),
  reason: z.string().trim().min(3, "A reason is required"),
  managerPin: z.string().min(1, "Manager PIN is required"),
});

export type RefundFormValues = z.infer<typeof refundFormSchema>;

/** Demo-only gate, not real auth — any 4-digit PIN passes. Flagged
 * explicitly per POS-Implementation-Plan.md Key Decision #5. */
export function isValidManagerPin(pin: string): boolean {
  return /^\d{4}$/.test(pin);
}
