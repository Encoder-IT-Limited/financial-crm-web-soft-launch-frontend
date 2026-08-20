import type { PaymentStatus, PaymentTransaction } from "../types";
import { seedPayments } from "../mock/seed";
import { auditApi } from "../../audit/api/audit.service";

/** Simulated network latency for the mock API. */
const delay = (ms = 300) => new Promise((resolve) => setTimeout(resolve, ms));

// In-memory mock "database" — module-scoped, resets on page reload. Replaces
// the old Zustand store; React Query (useQuery/invalidateQueries) is now the
// reactivity layer, this is just the data these functions read/write.
let payments: PaymentTransaction[] = seedPayments;

/**
 * Mock API service layer for Payments. Invoice/receipt generation and any
 * real refund processing come from the backend later — `list` and
 * `updateStatus` (a manual correction, e.g. marking a bank transfer as
 * reconciled) are all that's needed on the frontend for now.
 */
export const paymentsApi = {
  list: async (): Promise<PaymentTransaction[]> => {
    await delay(250);
    return payments;
  },

  updateStatus: async (id: string, status: PaymentStatus): Promise<void> => {
    await delay();
    const payment = payments.find((p) => p.id === id);
    if (!payment) return;
    payments = payments.map((p) => (p.id === id ? { ...p, status } : p));
    await auditApi.logEntry({
      tenantId: payment.tenantId,
      tenantName: payment.tenantName,
      module: "Payments",
      entity: "Payment",
      entityLabel: payment.reference,
      action: "update",
      oldValues: { status: payment.status },
      newValues: { status },
    });
  },
};
