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
  transfers: () => [...inventoryKeys.all, "transfers"] as const,
  batches: () => [...inventoryKeys.all, "batches"] as const,
};
