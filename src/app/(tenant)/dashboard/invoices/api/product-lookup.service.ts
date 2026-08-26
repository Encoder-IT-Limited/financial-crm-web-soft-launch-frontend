import { inventoryApi } from "@/app/(tenant)/modules/inventory/api/inventory.service";
import type { ProductLookupItem, WarehouseOption } from "../mock/product-lookup-seed";

export function stockAt(item: ProductLookupItem, warehouseId: string | undefined): number {
  if (!warehouseId) return 0;
  return item.stockByWarehouse[warehouseId] ?? 0;
}

/** Live inventory catalog for invoice/proposal line pickers and POS. */
export const productLookupApi = {
  listWarehouses: async (): Promise<WarehouseOption[]> => {
    const rows = await inventoryApi.listWarehouses();
    return rows.filter((w) => w.status === "active").map((w) => ({ id: w.id, name: w.name }));
  },

  listProducts: async (): Promise<ProductLookupItem[]> => {
    const [products, stock] = await Promise.all([inventoryApi.listProducts(), inventoryApi.listStock()]);
    return products
      .filter((p) => p.status === "active")
      .map((p) => {
        const stockByWarehouse: Record<string, number> = {};
        for (const row of stock) {
          if (row.productId === p.id) stockByWarehouse[row.warehouseId] = row.quantity;
        }
        return {
          id: p.id,
          name: p.name,
          sku: p.sku,
          price: p.price,
          taxRate: p.taxRate,
          stockByWarehouse,
        };
      });
  },

  /** Read-only stock check used by the leftover mock fulfillment helper.
   * Live fulfillment goes through `POST /invoices/:id/fulfill`. */
  deduct: async ({
    productId,
    warehouseId,
    quantity,
  }: {
    productId: string;
    warehouseId: string;
    quantity: number;
  }): Promise<{ wentNegative: boolean }> => {
    const stock = await inventoryApi.listStock();
    const onHand = stock.find((s) => s.productId === productId && s.warehouseId === warehouseId)?.quantity ?? 0;
    return { wentNegative: onHand - quantity < 0 };
  },
};

export type { ProductLookupItem, WarehouseOption };
