import { apiGet, apiSend } from "@/lib/api/envelope";
import { http } from "@/lib/api/http";
import type { PaymentStatus, PaymentTransaction } from "../types";

export const paymentsApi = {
  list: (): Promise<PaymentTransaction[]> => apiGet<PaymentTransaction[]>("/admin/payments"),

  get: (id: string): Promise<PaymentTransaction> => apiGet<PaymentTransaction>(`/admin/payments/${id}`),

  updateStatus: async (id: string, status: PaymentStatus): Promise<void> => {
    await apiSend("patch", `/admin/payments/${id}`, { status });
  },

  refund: async (id: string): Promise<PaymentTransaction> =>
    apiSend<PaymentTransaction>("post", `/admin/payments/${id}/refund`),

  downloadInvoice: async (id: string, reference: string): Promise<void> => {
    const res = await http.get(`/admin/payments/${id}/invoice`, { responseType: "blob" });
    const url = URL.createObjectURL(res.data);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${reference}.html`;
    a.click();
    URL.revokeObjectURL(url);
  },
};
