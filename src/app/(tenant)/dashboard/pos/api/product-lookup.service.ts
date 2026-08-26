import {
  PRODUCT_LOOKUP_ITEMS,
  PRODUCT_LOOKUP_WAREHOUSES,
  type ProductLookupItem,
  type WarehouseOption,
} from "../mock/product-lookup-seed";

/** Simulated network latency for the mock API. */
const delay = (ms = 200) => new Promise((resolve) => setTimeout(resolve, ms));

/** Mock API for POS's product search — see mock/product-lookup-seed.ts
 * for why this is a standalone dataset rather than reading Inventory's
 * own (still-mock) data. */
export const productLookupApi = {
  listWarehouses: async (): Promise<WarehouseOption[]> => {
    await delay(150);
    return PRODUCT_LOOKUP_WAREHOUSES;
  },

  listProducts: async (): Promise<ProductLookupItem[]> => {
    await delay(200);
    return PRODUCT_LOOKUP_ITEMS;
  },

  /** Deducts stock at one warehouse for one product. Never blocks on
   * going negative (client-confirmed rule); the caller flags the line
   * pending-reconciliation instead. */
  deduct: async ({
    productId,
    warehouseId,
    quantity,
  }: {
    productId: string;
    warehouseId: string;
    quantity: number;
  }): Promise<{ wentNegative: boolean }> => {
    await delay(150);
    const item = PRODUCT_LOOKUP_ITEMS.find((p) => p.id === productId);
    if (!item) return { wentNegative: false };
    const next = (item.stockByWarehouse[warehouseId] ?? 0) - quantity;
    item.stockByWarehouse[warehouseId] = next;
    return { wentNegative: next < 0 };
  },
};

/** Stock for one product at one warehouse — 0 for an unselected warehouse or
 * an unlisted combination, never undefined, so callers can compare directly. */
export function stockAt(item: ProductLookupItem, warehouseId: string | undefined): number {
  if (!warehouseId) return 0;
  return item.stockByWarehouse[warehouseId] ?? 0;
}

export type { ProductLookupItem, WarehouseOption };
