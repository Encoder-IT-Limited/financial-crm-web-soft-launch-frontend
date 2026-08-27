import { apiGet, apiSend } from "@/lib/api/envelope";

export type Supplier = {
  id: string;
  supplierCode: string;
  name: string;
  email: string | null;
  phone: string | null;
};

export type PurchaseOrderItem = {
  id: string;
  productId: string;
  quantity: number;
  /** How much of `quantity` has been received so far across one or more
   * goods receipts — partial-receipt tracking the backend already does. */
  receivedQuantity: number;
  unitCost: number;
  tax: number;
  discount: number;
  total: number;
};

export type PurchaseOrder = {
  id: string;
  poNumber: string;
  supplierId: string;
  warehouseId: string;
  status: string;
  expectedDate: string | null;
  total: number;
  items: PurchaseOrderItem[];
};

export type GoodsReceipt = {
  id: string;
  receiptNumber: string;
  purchaseOrderId: string;
  warehouseId: string;
  receiptDate: string;
  status: string;
  createdAt: string;
};

export type PurchaseInvoice = {
  id: string;
  invoiceNumber: string;
  supplierId: string;
  purchaseOrderId: string | null;
  dueDate: string;
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  paidAmount: number;
  balanceDue: number;
  status: string;
  createdAt: string;
};

function mapPo(row: {
  id: string;
  poNumber: string;
  supplierId: string;
  warehouseId: string;
  status: string;
  expectedDate: string | Date | null;
  total: unknown;
  items?: Array<{
    id: string;
    productId: string;
    quantity: unknown;
    receivedQuantity?: unknown;
    unitCost: unknown;
    tax: unknown;
    discount: unknown;
    total: unknown;
  }>;
}): PurchaseOrder {
  return {
    id: row.id,
    poNumber: row.poNumber,
    supplierId: row.supplierId,
    warehouseId: row.warehouseId,
    status: row.status,
    expectedDate: row.expectedDate ? String(row.expectedDate).slice(0, 10) : null,
    total: Number(row.total),
    items: (row.items ?? []).map((i) => ({
      id: i.id,
      productId: i.productId,
      quantity: Number(i.quantity),
      receivedQuantity: Number(i.receivedQuantity ?? 0),
      unitCost: Number(i.unitCost),
      tax: Number(i.tax),
      discount: Number(i.discount),
      total: Number(i.total),
    })),
  };
}

function mapGoodsReceipt(row: {
  id: string;
  receiptNumber: string;
  purchaseOrderId: string;
  warehouseId: string;
  receiptDate?: string | Date | null;
  status?: string | null;
  createdAt: string;
}): GoodsReceipt {
  return {
    id: row.id,
    receiptNumber: row.receiptNumber,
    purchaseOrderId: row.purchaseOrderId,
    warehouseId: row.warehouseId,
    receiptDate: row.receiptDate ? String(row.receiptDate).slice(0, 10) : row.createdAt.slice(0, 10),
    status: row.status ?? "COMPLETED",
    createdAt: row.createdAt,
  };
}

export const procurementApi = {
  listSuppliers: () => apiGet<Supplier[]>("/procurement/suppliers"),
  createSupplier: (input: {
    supplierCode: string;
    name: string;
    email?: string;
    phone?: string;
    address?: string;
    taxNumber?: string;
    openingBalance?: number;
  }) =>
    apiSend<Supplier>("post", "/procurement/suppliers", {
      openingBalance: 0,
      ...input,
    }),

  listPurchaseOrders: async () =>
    (await apiGet<Parameters<typeof mapPo>[0][]>("/procurement/purchase-orders")).map(mapPo),

  getPurchaseOrder: async (id: string) =>
    mapPo(await apiGet<Parameters<typeof mapPo>[0]>(`/procurement/purchase-orders/${id}`)),

  createPurchaseOrder: (input: {
    supplierId: string;
    warehouseId: string;
    expectedDate?: string;
    items: { productId: string; quantity: number; unitCost: number; tax?: number; discount?: number }[];
  }) =>
    apiSend("post", "/procurement/purchase-orders", {
      ...input,
      items: input.items.map((i) => ({
        ...i,
        tax: i.tax ?? 0,
        discount: i.discount ?? 0,
      })),
    }),

  submitPurchaseOrder: (id: string) => apiSend("post", `/procurement/purchase-orders/${id}/submit`),
  approvePurchaseOrder: (id: string) => apiSend("post", `/procurement/purchase-orders/${id}/approve`),

  listGoodsReceipts: async (purchaseOrderId: string) =>
    (
      await apiGet<Parameters<typeof mapGoodsReceipt>[0][]>(
        `/procurement/purchase-orders/${purchaseOrderId}/goods-receipts`,
      )
    ).map(mapGoodsReceipt),

  createGoodsReceipt: (
    purchaseOrderId: string,
    items: { productId: string; quantity: number; batchNumber?: string; expiryDate?: string }[],
  ) =>
    apiSend("post", `/procurement/purchase-orders/${purchaseOrderId}/goods-receipts`, { items }),

  listPurchaseInvoices: async () => {
    const rows = await apiGet<
      Array<{
        id: string;
        invoiceNumber: string;
        supplierId: string;
        purchaseOrderId: string | null;
        dueDate: string | Date;
        subtotal: unknown;
        tax: unknown;
        discount: unknown;
        total: unknown;
        paidAmount: unknown;
        balanceDue: unknown;
        status: string;
        createdAt: string;
      }>
    >("/procurement/purchase-invoices");
    return rows.map(
      (r): PurchaseInvoice => ({
        id: r.id,
        invoiceNumber: r.invoiceNumber,
        supplierId: r.supplierId,
        purchaseOrderId: r.purchaseOrderId,
        dueDate: String(r.dueDate).slice(0, 10),
        subtotal: Number(r.subtotal),
        tax: Number(r.tax),
        discount: Number(r.discount),
        total: Number(r.total),
        paidAmount: Number(r.paidAmount),
        balanceDue: Number(r.balanceDue),
        status: r.status,
        createdAt: r.createdAt,
      }),
    );
  },

  createPurchaseInvoice: (input: {
    supplierId: string;
    purchaseOrderId?: string;
    dueDate: string;
    subtotal: number;
    tax?: number;
    discount?: number;
  }) =>
    apiSend("post", "/procurement/purchase-invoices", {
      ...input,
      tax: input.tax ?? 0,
      discount: input.discount ?? 0,
    }),

  recordSupplierPayment: (
    id: string,
    input: { amount: number; paymentMethod: "CASH" | "CARD" | "BANK" | "MOBILE_PAYMENT" | "CHEQUE" | "OTHER"; transactionReference?: string },
  ) => apiSend("post", `/procurement/purchase-invoices/${id}/payments`, input),
};
