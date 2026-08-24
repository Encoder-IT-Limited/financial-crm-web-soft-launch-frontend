export type ProductStatus = "active" | "inactive";
export type WarehouseStatus = "active" | "inactive";

export type Product = {
  id: string;
  name: string;
  sku: string;
  category: string;
  unit: string;
  stock: number;
  price: number;
  costPrice: number;
  minimumStock: number;
  reorderLevel: number;
  status: ProductStatus;
  barcode?: string;
  description?: string;
  taxRate?: number;
  trackBatch?: boolean;
  categoryId?: string;
  unitId?: string;
};

export type Warehouse = {
  id: string;
  name: string;
  /** Maps to backend `code`. */
  code: string;
  address: string;
  status: WarehouseStatus;
};

export type InventoryCategory = { id: string; name: string; parentId: string | null };
export type InventoryUnit = { id: string; name: string; symbol: string };

export type StockBalance = {
  productId: string;
  warehouseId: string;
  quantity: number;
  averageCost: number;
};

export type StockMovement = {
  id: string;
  productId: string;
  warehouseId: string;
  movementType: string;
  quantity: number;
  unitCost: number;
  movementDate: string;
};

export type StockTransferStatus = "PENDING" | "APPROVED" | "DISPATCHED" | "RECEIVED" | "CANCELLED";

export type StockTransferItem = {
  id: string;
  productId: string;
  quantity: number;
  unitCost?: number;
};

export type StockTransfer = {
  id: string;
  fromWarehouseId: string;
  toWarehouseId: string;
  status: StockTransferStatus;
  items: StockTransferItem[];
  createdAt: string;
};

export type InventoryBatch = {
  id: string;
  productId: string;
  warehouseId: string;
  batchNumber: string;
  manufactureDate: string | null;
  expiryDate: string | null;
  quantity: number;
  createdAt: string;
};
