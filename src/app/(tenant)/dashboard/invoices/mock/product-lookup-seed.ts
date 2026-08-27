/** Read-only demo catalog for the invoice line-item product picker.
 *
 * Deliberately NOT imported from the Inventory module — Inventory stays
 * untouched. Names/SKUs/warehouses here are modeled after what's already
 * visible in Inventory's own UI purely for visual consistency, but this is
 * an independent dataset living entirely on the Sales side, with its own
 * per-warehouse stock breakdown (Inventory's own `Product.stock` is a
 * single global number today, not tracked per warehouse).
 *
 * Swap for a real `GET /inventory/products?warehouseId=` call once a
 * backend exists — nothing downstream of `productLookupApi` needs to
 * change shape for that swap. */

export type WarehouseOption = { id: string; name: string };

export type ProductLookupItem = {
  id: string;
  name: string;
  sku: string;
  price: number;
  stockByWarehouse: Record<string, number>;
  damagedByWarehouse?: Record<string, number>;
  taxRate?: number;
};

export const PRODUCT_LOOKUP_WAREHOUSES: WarehouseOption[] = [
  { id: "wh-main", name: "Main Warehouse" },
  { id: "wh-dxb", name: "Dubai Warehouse" },
  { id: "wh-auh", name: "Abu Dhabi Warehouse" },
  { id: "wh-shj", name: "Sharjah Warehouse" },
  { id: "wh-jeb", name: "Jebel Ali Warehouse" },
];

export const PRODUCT_LOOKUP_ITEMS: ProductLookupItem[] = [
  { id: "plu-1", name: "iPhone 15 Pro", sku: "IP15-PRO-256", price: 4299, stockByWarehouse: { "wh-main": 42, "wh-dxb": 18, "wh-auh": 0, "wh-shj": 6, "wh-jeb": 3 } },
  { id: "plu-2", name: "Samsung Galaxy S24", sku: "SM-S24-256", price: 3399, stockByWarehouse: { "wh-main": 20, "wh-dxb": 34, "wh-auh": 5, "wh-shj": 0, "wh-jeb": 9 } },
  { id: "plu-3", name: "HP Laptop 15", sku: "HP15-I5-8GB", price: 2899, stockByWarehouse: { "wh-main": 15, "wh-dxb": 4, "wh-auh": 8, "wh-shj": 2, "wh-jeb": 0 } },
  { id: "plu-4", name: "Dell Monitor 24", sku: "DL-M24-1080", price: 749, stockByWarehouse: { "wh-main": 10, "wh-dxb": 6, "wh-auh": 3, "wh-shj": 1, "wh-jeb": 4 } },
  { id: "plu-5", name: "Logitech Mouse M90", sku: "M90-BLK", price: 45, stockByWarehouse: { "wh-main": 3, "wh-dxb": 5, "wh-auh": 0, "wh-shj": 2, "wh-jeb": 1 } },
  { id: "plu-6", name: "Sony WH-1000XM5", sku: "WH1000XM5", price: 1499, stockByWarehouse: { "wh-main": 2, "wh-dxb": 1, "wh-auh": 0, "wh-shj": 0, "wh-jeb": 2 } },
  { id: "plu-7", name: "Ergonomic Office Chair", sku: "CH-ERGO-BLK", price: 1250, stockByWarehouse: { "wh-main": 12, "wh-dxb": 8, "wh-auh": 5, "wh-shj": 3, "wh-jeb": 0 } },
  { id: "plu-8", name: "Standing Desk 140cm", sku: "SD-140-OAK", price: 2150, stockByWarehouse: { "wh-main": 6, "wh-dxb": 2, "wh-auh": 4, "wh-shj": 0, "wh-jeb": 1 } },
  { id: "plu-9", name: "A4 Copy Paper Ream", sku: "PP-A4-80G", price: 22, stockByWarehouse: { "wh-main": 120, "wh-dxb": 60, "wh-auh": 45, "wh-shj": 30, "wh-jeb": 15 } },
  { id: "plu-10", name: "Ballpoint Pens Box 50", sku: "PN-BLU-50", price: 35, stockByWarehouse: { "wh-main": 40, "wh-dxb": 20, "wh-auh": 10, "wh-shj": 8, "wh-jeb": 5 } },
];
