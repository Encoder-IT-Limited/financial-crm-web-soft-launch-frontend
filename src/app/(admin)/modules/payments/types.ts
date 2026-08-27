/* Platform billing transactions returned by GET /admin/payments. */

export type PaymentTransactionType = "subscription_charge" | "additional_seat" | "refund";
export type PaymentMethod = "card" | "bank" | "paypal";
export type PaymentStatus = "paid" | "failed" | "pending" | "refunded";

export const PAYMENT_TYPE_LABELS: Record<PaymentTransactionType, string> = {
  subscription_charge: "Subscription charge",
  additional_seat: "Additional seat purchase",
  refund: "Refund",
};

export type PaymentTransaction = {
  id: string;
  tenantId: string;
  tenantName: string;
  /** Receipt/invoice reference — the actual document comes from the
   * backend later, this is just the identifier shown in the list/details. */
  reference: string;
  /** Plan the tenant was on at the time of this transaction — snapshotted,
   * not looked up live, since a tenant's plan can change after the fact. */
  planName: string;
  type: PaymentTransactionType;
  amount: number;
  method: PaymentMethod;
  status: PaymentStatus;
  date: string; // ISO
};
