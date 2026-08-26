import { apiGet, apiSend } from "@/lib/api/envelope";
import type { PaymentStatus, PaymentTransaction } from "../types";

export const paymentsApi = {
  list: (): Promise<PaymentTransaction[]> => apiGet<PaymentTransaction[]>("/admin/payments"),

  updateStatus: async (id: string, status: PaymentStatus): Promise<void> => {
    await apiSend("patch", `/admin/payments/${id}`, { status });
  },
};
