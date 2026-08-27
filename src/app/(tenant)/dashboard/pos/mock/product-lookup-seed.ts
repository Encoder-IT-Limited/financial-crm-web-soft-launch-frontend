/** Shared shape for a product as POS's search/register screen displays it —
 * `product-search-panel.tsx` builds these from real `inventoryApi.listProducts()`
 * + `inventoryApi.listStock()` calls. No mock data lives here anymore; this
 * file just keeps the type in one place since `product-tile.tsx` and
 * `register-screen.tsx` also need it. */

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
