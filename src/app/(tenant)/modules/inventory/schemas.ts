import { z } from "zod";

const toNumber = (value: unknown) =>
  typeof value === "string" ? (value.trim() === "" ? undefined : Number(value)) : value;

export const createProductSchema = z.object({
  name: z.string().trim().min(1, "Product name is required"),
  sku: z.string().trim().min(1, "SKU is required"),
  barcode: z.string().trim().optional(),
  description: z.string().trim().optional(),
  categoryId: z.string().trim().optional(),
  unitId: z.string().uuid("Select a unit"),
  costPrice: z.preprocess(toNumber, z.number().nonnegative()),
  sellingPrice: z.preprocess(toNumber, z.number().nonnegative()),
  taxRate: z.preprocess(toNumber, z.number().min(0).max(100)),
  minimumStock: z.preprocess(toNumber, z.number().nonnegative()),
  reorderLevel: z.preprocess(toNumber, z.number().nonnegative()),
  trackBatch: z.boolean(),
  status: z.enum(["active", "inactive"]),
});

export type CreateProductValues = z.infer<typeof createProductSchema>;

export const createWarehouseSchema = z.object({
  name: z.string().trim().min(1, "Warehouse name is required"),
  code: z.string().trim().min(1, "Code is required"),
  address: z.string().trim().optional(),
  status: z.enum(["active", "inactive"]),
});

export type CreateWarehouseValues = z.infer<typeof createWarehouseSchema>;
