export const PRODUCT_CATEGORIES = [
  "Laptops",
  "Accessories",
  "Furniture",
  "Office",
  "Services",
] as const;

export type ProductCategory = (typeof PRODUCT_CATEGORIES)[number];

export type ProductStatus = "active" | "inactive";

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
  /** Units on hand. */
  stock: number;
  /** Selling price in AED. */
  price: number;
  status: ProductStatus;
}

/** Mock catalog — replace with the inventory API response later; the page
 * renders entirely from this shape. */
export const products: Product[] = [
  { id: "prd-001", name: "iPhone 15 Pro", sku: "IP15-PRO-256", category: "Accessories", warehouse: "Main Warehouse", stock: 120, price: 4299, status: "active" },
  { id: "prd-002", name: "Samsung Galaxy S24", sku: "SM-S24-256", category: "Accessories", warehouse: "Main Warehouse", stock: 64, price: 3399, status: "active" },
  { id: "prd-003", name: "HP Laptop 15", sku: "HP15-I5-8GB", category: "Laptops", warehouse: "Main Warehouse", stock: 42, price: 2899, status: "active" },
  { id: "prd-004", name: "Dell Monitor 24", sku: "DL-M24-1080", category: "Accessories", warehouse: "Jebel Ali Warehouse", stock: 18, price: 749, status: "active" },
  { id: "prd-005", name: "Logitech Mouse M90", sku: "M90-BLK", category: "Accessories", warehouse: "Dubai Warehouse", stock: 8, price: 45, status: "active" },
  { id: "prd-006", name: "HP Keyboard K1500", sku: "K1500", category: "Accessories", warehouse: "Sharjah Warehouse", stock: 12, price: 95, status: "inactive" },
  { id: "prd-007", name: "Sony WH-1000XM5", sku: "WH1000XM5", category: "Accessories", warehouse: "Main Warehouse", stock: 5, price: 1499, status: "active" },
  { id: "prd-008", name: "Ergonomic Office Chair", sku: "CH-ERGO-BLK", category: "Furniture", warehouse: "Dubai Warehouse", stock: 26, price: 1250, status: "active" },
  { id: "prd-009", name: "Standing Desk 140cm", sku: "SD-140-OAK", category: "Furniture", warehouse: "Jebel Ali Warehouse", stock: 15, price: 2150, status: "active" },
  { id: "prd-010", name: "Filing Cabinet 3-Drawer", sku: "FC-3D-GREY", category: "Furniture", warehouse: "Abu Dhabi Warehouse", stock: 55, price: 850, status: "inactive" },
  { id: "prd-011", name: "A4 Copy Paper Ream", sku: "PP-A4-80G", category: "Office", warehouse: "Main Warehouse", stock: 210, price: 22, status: "active" },
  { id: "prd-012", name: "Ballpoint Pens Box 50", sku: "PN-BLU-50", category: "Office", warehouse: "Sharjah Warehouse", stock: 88, price: 35, status: "active" },
  { id: "prd-013", name: "Stapler Heavy Duty", sku: "ST-HD-BLK", category: "Office", warehouse: "Dubai Warehouse", stock: 34, price: 65, status: "inactive" },
  { id: "prd-014", name: "Laptop Repair Service", sku: "SRV-LR-01", category: "Services", warehouse: "Main Warehouse", stock: 999, price: 250, status: "active" },
];
