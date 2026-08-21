import { z } from "zod";

export const productFormSchema = z
  .object({
    name: z.string().trim().min(2, "Product name is required"),
    sku: z.string().trim().max(40, "SKU too long").optional(),
    barcode: z.string().trim().max(40, "Barcode too long").optional(),
    category: z.string().min(1, "Select a category"),
    unit: z.string().min(1, "Select a unit"),
    status: z.enum(["active", "inactive", "discontinued"]),
    trackBatch: z.boolean(),
    trackExpiry: z.boolean(),
    description: z.string().max(500, "Description too long (max 500 chars)").optional(),
    costPrice: z.coerce.number().nonnegative("Cost can't be negative"),
    sellingPrice: z.coerce.number().positive("Selling price must be greater than 0"),
    taxRate: z.coerce.number().min(0, "Tax rate min 0%").max(100, "Tax rate max 100%"),
    warehouseInit: z.array(
      z.object({
        warehouseId: z.string(),
        available: z.coerce.number().min(-1_000_000, "Stock too large"),
        reorderLevel: z.coerce.number().nonnegative("Reorder level can't be negative"),
        reorderQuantity: z.coerce.number().nonnegative("Reorder qty can't be negative"),
        averageCost: z.coerce.number().nonnegative("Cost can't be negative"),
      })
    ),
  })
  .superRefine((data, ctx) => {
    if (data.sellingPrice < data.costPrice) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["sellingPrice"],
        message: "Selling price is below cost — this product sells at a loss",
      });
    }
  });

export type ProductFormValues = z.infer<typeof productFormSchema>;