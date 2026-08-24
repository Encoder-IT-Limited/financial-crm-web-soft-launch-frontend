export const procurementKeys = {
  all: ["procurement"] as const,
  suppliers: () => [...procurementKeys.all, "suppliers"] as const,
  purchaseOrders: () => [...procurementKeys.all, "purchase-orders"] as const,
  purchaseOrder: (id: string) => [...procurementKeys.purchaseOrders(), id] as const,
  goodsReceipts: (poId: string) => [...procurementKeys.all, "goods-receipts", poId] as const,
  purchaseInvoices: () => [...procurementKeys.all, "purchase-invoices"] as const,
};
