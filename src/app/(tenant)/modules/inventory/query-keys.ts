export const inventoryKeys = {
  all: ["inventory"] as const,
  categories: () => [...inventoryKeys.all, "categories"] as const,
  units: () => [...inventoryKeys.all, "units"] as const,
  products: () => [...inventoryKeys.all, "products"] as const,
  product: (id: string) => [...inventoryKeys.products(), id] as const,
  warehouses: () => [...inventoryKeys.all, "warehouses"] as const,
  warehouse: (id: string) => [...inventoryKeys.warehouses(), id] as const,
  stock: () => [...inventoryKeys.all, "stock"] as const,
  movements: () => [...inventoryKeys.all, "movements"] as const,
  transfers: (params?: Record<string, unknown>) =>
    [...inventoryKeys.all, "transfers", params ?? {}] as const,
  transfer: (id: string) => [...inventoryKeys.all, "transfer", id] as const,
  batches: () => [...inventoryKeys.all, "batches"] as const,
  dashboard: () => [...inventoryKeys.all, "dashboard"] as const,
  reorder: (warehouseId?: string) => [...inventoryKeys.all, "reorder", warehouseId ?? "all"] as const,
  valuation: (warehouseId?: string) => [...inventoryKeys.all, "valuation", warehouseId ?? "all"] as const,
};
