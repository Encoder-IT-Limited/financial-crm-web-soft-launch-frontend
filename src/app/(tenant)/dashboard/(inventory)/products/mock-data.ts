export const PRODUCT_CATEGORIES = [
  "Laptops",
  "Accessories",
  "Furniture",
  "Office",
  "Services",
] as const;

export type ProductCategory = (typeof PRODUCT_CATEGORIES)[number];

export type ProductStatus = "active" | "inactive";

/** Stock unit-of-measure options. */
export const PRODUCT_UNITS = [
  "pcs",
  "boxes",
  "kg",
  "litre",
  "metre",
  "set",
  "service",
] as const;

export type ProductUnit = (typeof PRODUCT_UNITS)[number];

/** Mock warehouse list — replace with the warehouses API later. Names match
 * the ones used by stock movement / valuation so seeds stay consistent. */
export const WAREHOUSES = [
  "Main Warehouse",
  "Dubai Warehouse",
  "Jebel Ali Warehouse",
  "Abu Dhabi Warehouse",
  "Sharjah Warehouse",
] as const;

export type Warehouse = (typeof WAREHOUSES)[number];

export interface Product {
  id: string;
  name: string;
  sku: string;
  category: ProductCategory;
  /** Warehouse where this product's stock is held. */
  warehouse: Warehouse;
  /** Unit of measure for stock quantities. */
  unit: ProductUnit;
  /** Units on hand. */
  stock: number;
  /** Alert threshold — at or below this the product counts as low on stock. */
  lowStock: number;
  /** Quantity suggested when reordering. */
  reorderQty: number;
  /** Whether stock is tracked per batch / expiry. */
  batchTracked: boolean;
  /** Selling price in AED — not shown in the catalog UI; kept because
   * transfer / reorder / adjustment value seeds derive from it. */
  price: number;
  status: ProductStatus;
}

/** Mock catalog — replace with the inventory API response later; the page
 * renders entirely from this shape. */
export const products: Product[] = [
  { id: "prd-001", name: "iPhone 15 Pro", sku: "IP15-PRO-256", category: "Accessories", warehouse: "Main Warehouse", unit: "pcs", stock: 120, lowStock: 10, reorderQty: 25, batchTracked: false, price: 4299, status: "active" },
  { id: "prd-002", name: "Samsung Galaxy S24", sku: "SM-S24-256", category: "Accessories", warehouse: "Main Warehouse", unit: "pcs", stock: 64, lowStock: 8, reorderQty: 20, batchTracked: false, price: 3399, status: "active" },
  { id: "prd-003", name: "HP Laptop 15", sku: "HP15-I5-8GB", category: "Laptops", warehouse: "Main Warehouse", unit: "pcs", stock: 42, lowStock: 10, reorderQty: 15, batchTracked: false, price: 2899, status: "active" },
  { id: "prd-004", name: "Dell Monitor 24", sku: "DL-M24-1080", category: "Accessories", warehouse: "Jebel Ali Warehouse", unit: "pcs", stock: 18, lowStock: 6, reorderQty: 12, batchTracked: false, price: 749, status: "active" },
  { id: "prd-005", name: "Logitech Mouse M90", sku: "M90-BLK", category: "Accessories", warehouse: "Dubai Warehouse", unit: "pcs", stock: 8, lowStock: 15, reorderQty: 40, batchTracked: false, price: 45, status: "active" },
  { id: "prd-006", name: "HP Keyboard K1500", sku: "K1500", category: "Accessories", warehouse: "Sharjah Warehouse", unit: "pcs", stock: 12, lowStock: 15, reorderQty: 30, batchTracked: false, price: 95, status: "inactive" },
  { id: "prd-007", name: "Sony WH-1000XM5", sku: "WH1000XM5", category: "Accessories", warehouse: "Main Warehouse", unit: "pcs", stock: 5, lowStock: 8, reorderQty: 16, batchTracked: false, price: 1499, status: "active" },
  { id: "prd-008", name: "Ergonomic Office Chair", sku: "CH-ERGO-BLK", category: "Furniture", warehouse: "Dubai Warehouse", unit: "pcs", stock: 26, lowStock: 8, reorderQty: 12, batchTracked: false, price: 1250, status: "active" },
  { id: "prd-009", name: "Standing Desk 140cm", sku: "SD-140-OAK", category: "Furniture", warehouse: "Jebel Ali Warehouse", unit: "set", stock: 15, lowStock: 5, reorderQty: 10, batchTracked: false, price: 2150, status: "active" },
  { id: "prd-010", name: "Filing Cabinet 3-Drawer", sku: "FC-3D-GREY", category: "Furniture", warehouse: "Abu Dhabi Warehouse", unit: "pcs", stock: 55, lowStock: 12, reorderQty: 20, batchTracked: false, price: 850, status: "inactive" },
  { id: "prd-011", name: "A4 Copy Paper Ream", sku: "PP-A4-80G", category: "Office", warehouse: "Main Warehouse", unit: "boxes", stock: 210, lowStock: 50, reorderQty: 100, batchTracked: true, price: 22, status: "active" },
  { id: "prd-012", name: "Ballpoint Pens Box 50", sku: "PN-BLU-50", category: "Office", warehouse: "Sharjah Warehouse", unit: "boxes", stock: 88, lowStock: 30, reorderQty: 60, batchTracked: true, price: 35, status: "active" },
  { id: "prd-013", name: "Stapler Heavy Duty", sku: "ST-HD-BLK", category: "Office", warehouse: "Dubai Warehouse", unit: "pcs", stock: 34, lowStock: 10, reorderQty: 20, batchTracked: false, price: 65, status: "inactive" },
  { id: "prd-014", name: "Laptop Repair Service", sku: "SRV-LR-01", category: "Services", warehouse: "Main Warehouse", unit: "service", stock: 999, lowStock: 0, reorderQty: 0, batchTracked: false, price: 250, status: "active" },
];
