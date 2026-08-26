import { apiGet, apiSend } from "@/lib/api/envelope";
import type {
  InventoryCategory,
  InventoryUnit,
  Product,
  ProductStatus,
  InventoryBatch,
  StockBalance,
  StockMovement,
  StockTransfer,
  StockTransferStatus,
  Warehouse,
  WarehouseStatus,
} from "../types";

export type ApiProduct = {
  id: string;
  sku: string;
  barcode: string | null;
  name: string;
  description: string | null;
  categoryId: string | null;
  categoryName: string | null;
  unitId: string | null;
  unitName: string | null;
  unitSymbol: string | null;
  costPrice: number;
  sellingPrice: number;
  taxRate: number;
  minimumStock: number;
  reorderLevel: number;
  trackBatch: boolean;
  status: string;
  onHand: number;
  createdAt: string;
};

type ApiWarehouse = {
  id: string;
  name: string;
  code: string;
  address: string | null;
  status: string;
};

export type CreateProductInput = {
  sku: string;
  barcode?: string;
  name: string;
  description?: string;
  categoryId?: string;
  unitId?: string;
  costPrice: number;
  sellingPrice: number;
  taxRate: number;
  minimumStock: number;
  reorderLevel: number;
  trackBatch: boolean;
  status: "ACTIVE" | "INACTIVE";
};

export type UpdateProductInput = Partial<CreateProductInput>;

export type CreateWarehouseInput = {
  name: string;
  code: string;
  address?: string;
  status: "ACTIVE" | "INACTIVE";
};

export type ReceiveStockInput = {
  productId: string;
  warehouseId: string;
  quantity: number;
  unitCost: number;
  batchNumber?: string;
  expiryDate?: string;
  movementType?: "PURCHASE_RECEIPT" | "OPENING" | "SALES_RETURN" | "TRANSFER_IN";
};

export type AdjustStockInput = {
  productId: string;
  warehouseId: string;
  quantityDelta: number;
};

export type CreateTransferInput = {
  fromWarehouseId: string;
  toWarehouseId: string;
  items: { productId: string; quantity: number }[];
};

function mapProductStatus(status: string): ProductStatus {
  return status === "INACTIVE" ? "inactive" : "active";
}

export function mapProduct(row: ApiProduct): Product {
  return {
    id: row.id,
    name: row.name,
    sku: row.sku,
    category: row.categoryName ?? "Uncategorized",
    unit: row.unitSymbol ?? row.unitName ?? "pcs",
    stock: Number(row.onHand ?? 0),
    price: Number(row.sellingPrice ?? 0),
    costPrice: Number(row.costPrice ?? 0),
    minimumStock: Number(row.minimumStock ?? 0),
    reorderLevel: Number(row.reorderLevel ?? 0),
    status: mapProductStatus(row.status),
    barcode: row.barcode ?? undefined,
    description: row.description ?? undefined,
    taxRate: Number(row.taxRate ?? 0),
    trackBatch: row.trackBatch,
    categoryId: row.categoryId ?? undefined,
    unitId: row.unitId ?? undefined,
  };
}

export function mapWarehouse(row: ApiWarehouse): Warehouse {
  const status: WarehouseStatus = row.status === "INACTIVE" ? "inactive" : "active";
  return {
    id: row.id,
    name: row.name,
    code: row.code,
    address: row.address ?? "",
    status,
  };
}

export const inventoryApi = {
  listCategories: () => apiGet<InventoryCategory[]>("/inventory/categories"),
  createCategory: (input: { name: string }) =>
    apiSend<InventoryCategory>("post", "/inventory/categories", input),

  listUnits: () => apiGet<InventoryUnit[]>("/inventory/units"),
  createUnit: (input: { name: string; symbol: string }) =>
    apiSend<InventoryUnit>("post", "/inventory/units", input),

  listProducts: async () => (await apiGet<ApiProduct[]>("/inventory/products")).map(mapProduct),
  getProduct: async (id: string) => mapProduct(await apiGet<ApiProduct>(`/inventory/products/${id}`)),
  createProduct: async (input: CreateProductInput) =>
    mapProduct(await apiSend<ApiProduct>("post", "/inventory/products", input)),
  updateProduct: async (id: string, input: UpdateProductInput) =>
    mapProduct(await apiSend<ApiProduct>("patch", `/inventory/products/${id}`, input)),

  listWarehouses: async () => (await apiGet<ApiWarehouse[]>("/inventory/warehouses")).map(mapWarehouse),
  getWarehouse: async (id: string) => mapWarehouse(await apiGet<ApiWarehouse>(`/inventory/warehouses/${id}`)),
  createWarehouse: (input: CreateWarehouseInput) =>
    apiSend<ApiWarehouse>("post", "/inventory/warehouses", input).then(mapWarehouse),

  listStock: async () => {
    const rows = await apiGet<Array<{ productId: string; warehouseId: string; quantity: unknown; averageCost: unknown }>>(
      "/inventory/stock",
    );
    return rows.map(
      (r): StockBalance => ({
        productId: r.productId,
        warehouseId: r.warehouseId,
        quantity: Number(r.quantity),
        averageCost: Number(r.averageCost),
      }),
    );
  },

  listMovements: async () => {
    const rows = await apiGet<
      Array<{
        id: string;
        productId: string;
        warehouseId: string;
        movementType: string;
        quantity: unknown;
        unitCost: unknown;
        movementDate: string;
      }>
    >("/inventory/movements");
    return rows.map(
      (r): StockMovement => ({
        id: r.id,
        productId: r.productId,
        warehouseId: r.warehouseId,
        movementType: r.movementType,
        quantity: Number(r.quantity),
        unitCost: Number(r.unitCost),
        movementDate: r.movementDate,
      }),
    );
  },

  listBatches: async () => {
    const rows = await apiGet<
      Array<{
        id: string;
        productId: string;
        warehouseId: string;
        batchNumber: string;
        manufactureDate: string | null;
        expiryDate: string | null;
        quantity: unknown;
        createdAt: string;
      }>
    >("/inventory/batches");
    return rows.map(
      (r): InventoryBatch => ({
        id: r.id,
        productId: r.productId,
        warehouseId: r.warehouseId,
        batchNumber: r.batchNumber,
        manufactureDate: r.manufactureDate ? String(r.manufactureDate).slice(0, 10) : null,
        expiryDate: r.expiryDate ? String(r.expiryDate).slice(0, 10) : null,
        quantity: Number(r.quantity),
        createdAt: r.createdAt,
      }),
    );
  },

  receiveStock: (input: ReceiveStockInput) => apiSend("post", "/inventory/stock/receive", input),
  issueStock: (input: {
    productId: string;
    warehouseId: string;
    quantity: number;
    movementType?: string;
    allowNegative?: boolean;
  }) => apiSend("post", "/inventory/stock/issue", input),
  adjustStock: (input: AdjustStockInput) => apiSend("post", "/inventory/stock/adjust", input),

  listTransfers: async () => {
    const rows = await apiGet<
      Array<{
        id: string;
        fromWarehouseId: string;
        toWarehouseId: string;
        status: string;
        createdAt: string;
        items: Array<{ id: string; productId: string; quantity: unknown; unitCost?: unknown }>;
      }>
    >("/inventory/transfers");
    return rows.map(
      (r): StockTransfer => ({
        id: r.id,
        fromWarehouseId: r.fromWarehouseId,
        toWarehouseId: r.toWarehouseId,
        status: r.status as StockTransferStatus,
        createdAt: r.createdAt,
        items: r.items.map((i) => ({
          id: i.id,
          productId: i.productId,
          quantity: Number(i.quantity),
          unitCost: i.unitCost != null ? Number(i.unitCost) : undefined,
        })),
      }),
    );
  },
  createTransfer: (input: CreateTransferInput) => apiSend("post", "/inventory/transfers", input),
  approveTransfer: (id: string) => apiSend("post", `/inventory/transfers/${id}/approve`),
  dispatchTransfer: (id: string) => apiSend("post", `/inventory/transfers/${id}/dispatch`),
  receiveTransfer: (id: string) => apiSend("post", `/inventory/transfers/${id}/receive`),
};
