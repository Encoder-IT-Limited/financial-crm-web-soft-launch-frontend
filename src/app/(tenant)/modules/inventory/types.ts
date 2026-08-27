export type ProductStatus = "active" | "inactive";
export type WarehouseStatus = "active" | "inactive";

export type Product = {
  id: string;
  name: string;
  sku: string;
  category: string;
  subcategory?: string;
  unit: string;
  stock: number;
  price: number;
  costPrice: number;
  minimumStock: number;
  maximumStock: number;
  reorderLevel: number;
  status: ProductStatus;
  barcode?: string;
  description?: string;
  taxRate?: number;
  trackBatch?: boolean;
  categoryId?: string;
  unitId?: string;
};

export type WarehouseProduct = {
  productId: string;
  name: string;
  sku: string;
  barcode?: string | null;
  status: ProductStatus;
  quantity: number;
  damagedQuantity: number;
  reservedQuantity: number;
  averageCost: number;
};

export type Warehouse = {
  id: string;
  name: string;
  /** Maps to backend `code`. */
  code: string;
  address: string;
  status: WarehouseStatus;
  productCount: number;
  totalOnHand: number;
  totalDamaged: number;
  totalReserved: number;
  products?: WarehouseProduct[];
};

export type InventoryCategory = { id: string; name: string; parentId: string | null };
export type InventoryUnit = { id: string; name: string; symbol: string };

export type StockBalance = {
  productId: string;
  warehouseId: string;
  quantity: number;
  damagedQuantity: number;
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
  note?: string | null;
};

export type StockTransferStatus = "PENDING" | "APPROVED" | "DISPATCHED" | "RECEIVED" | "CANCELLED";

export type StockTransferItem = {
  id: string;
  productId: string;
  quantity: number;
  unitCost?: number;
  productName?: string | null;
  productSku?: string | null;
};

export type StockTransfer = {
  id: string;
  fromWarehouseId: string;
  toWarehouseId: string;
  fromWarehouseName?: string | null;
  toWarehouseName?: string | null;
  status: StockTransferStatus;
  items: StockTransferItem[];
  itemCount?: number;
  createdBy?: string;
  createdAt: string;
};

export type TransferListParams = {
  sourceWarehouse?: string;
  destinationWarehouse?: string;
  status?: StockTransferStatus;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
  page?: number;
  pageSize?: number;
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

export type InventoryDashboard = {
  productCount: number;
  warehouseCount: number;
  stockValue: number;
  adjustmentCount: number;
  inboundCount: number;
  stockValueByWarehouse: {
    warehouseId: string;
    name: string;
    value: number;
    onHand: number;
    damagedOnHand: number;
  }[];
  recentMovements: {
    id: string;
    movementDate: string;
    movementType: string;
    quantity: number;
    productId: string;
    productName: string | null;
    warehouseId: string;
  }[];
  lowStock: {
    productId: string;
    name: string;
    sku: string;
    stock: number;
    reorderLevel: number;
    minimumStock: number;
  }[];
};

export type ReorderItem = {
  productId: string;
  name: string;
  sku: string;
  stock: number;
  reorderLevel: number;
  minimumStock: number;
  maximumStock: number;
  suggestedQuantity: number;
  costPrice: number;
};

export type ValuationRow = {
  productId: string;
  sku: string;
  name: string;
  warehouseId: string;
  warehouseName: string;
  quantity: number;
  averageCost: number;
  value: number;
};

export type Valuation = {
  method: "WEIGHTED_AVERAGE";
  totalValue: number;
  rows: ValuationRow[];
};
