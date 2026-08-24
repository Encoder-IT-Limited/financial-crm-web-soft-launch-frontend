"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FormField } from "@/components/shared/form-field";
import { toast } from "@/lib/toast";
import { PRODUCT_CATEGORIES } from "../mock-data";

const toNumber = (value: unknown) =>
  typeof value === "string" ? (value.trim() === "" ? undefined : Number(value)) : value;

const productSchema = z.object({
  name: z.string().trim().min(1, "Product name is required"),
  sku: z.string().trim().min(1, "SKU is required"),
  category: z.enum(PRODUCT_CATEGORIES, { error: "Category is required" }),
  stock: z
    .preprocess(
      toNumber,
      z
        .number({ error: "Enter a valid stock quantity" })
        .int("Stock must be a whole number")
        .min(0, "Stock cannot be negative")
    ),
  price: z.preprocess(
    toNumber,
    z.number({ error: "Enter a valid price" }).positive("Price must be greater than zero")
  ),
  status: z.enum(["active", "inactive"], { error: "Status is required" }),
});

type FormValues = {
  name: string;
  sku: string;
  category: string;
  stock: string;
  price: string;
  status: string;
};

type FormErrors = Partial<Record<keyof FormValues, string>>;

const initialValues: FormValues = {
  name: "",
  sku: "",
  category: "",
  stock: "",
  price: "",
  status: "active",
};

export function ProductForm() {
  const [values, setValues] = useState<FormValues>(initialValues);
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();

  function setField<K extends keyof FormValues>(key: K, value: string) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const result = productSchema.safeParse(values);
    if (!result.success) {
      const fieldErrors: FormErrors = {};
      for (const issue of result.error.issues) {
        fieldErrors[issue.path[0] as keyof FormValues] ??= issue.message;
      }
      setErrors(fieldErrors);
      return;
    }

    setErrors({});
    setSubmitting(true);
    try {
      // TODO: replace with productsApi.create once the inventory API exists.
      await new Promise((resolve) => setTimeout(resolve, 400));
      toast.success("Product created", {
        description: `${result.data.name} was added to your catalog.`,
      });
      router.push("/dashboard/products");
    } catch {
      toast.error("Could not create the product. Try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card className="max-w-2xl p-5 min-[1440px]:p-6">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
        <FormField label="Product Name" error={errors.name}>
          <Input
            type="text"
            placeholder="e.g. iPhone 15 Pro"
            value={values.name}
            onChange={(e) => setField("name", e.target.value)}
            aria-invalid={!!errors.name}
            className="h-9 border-border text-[12.5px] min-[1440px]:text-[13.5px]"
          />
        </FormField>

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="SKU" error={errors.sku}>
            <Input
              type="text"
              placeholder="e.g. IP15-PRO-256"
              value={values.sku}
              onChange={(e) => setField("sku", e.target.value)}
              aria-invalid={!!errors.sku}
              className="h-9 border-border text-[12.5px] min-[1440px]:text-[13.5px]"
            />
          </FormField>

          <FormField label="Category" error={errors.category}>
            <Select value={values.category} onValueChange={(value) => setField("category", value ?? "")}>
              <SelectTrigger
                aria-label="Category"
                aria-invalid={!!errors.category}
                className="h-9 w-full border-border text-[12.5px] min-[1440px]:text-[13.5px]"
              >
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {PRODUCT_CATEGORIES.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Stock Quantity" error={errors.stock}>
            <Input
              type="number"
              min={0}
              step={1}
              placeholder="e.g. 120"
              value={values.stock}
              onChange={(e) => setField("stock", e.target.value)}
              aria-invalid={!!errors.stock}
              className="h-9 border-border text-[12.5px] min-[1440px]:text-[13.5px]"
            />
          </FormField>

          <FormField label="Price (AED)" error={errors.price}>
            <Input
              type="number"
              min={0}
              step="0.01"
              placeholder="e.g. 4299.00"
              value={values.price}
              onChange={(e) => setField("price", e.target.value)}
              aria-invalid={!!errors.price}
              className="h-9 border-border text-[12.5px] min-[1440px]:text-[13.5px]"
            />
          </FormField>
        </div>

        <FormField label="Status" error={errors.status} className="max-w-[calc(50%-0.5rem)] max-sm:max-w-none">
          <Select value={values.status} onValueChange={(value) => setField("status", value ?? "")}>
            <SelectTrigger
              aria-label="Status"
              className="h-9 w-full border-border text-[12.5px] min-[1440px]:text-[13.5px]"
            >
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </FormField>

        <div className="mt-2 flex items-center justify-end gap-2 border-t border-border pt-4">
          <Button variant="outline" render={<Link href="/dashboard/products" />} nativeButton={false}>
            Cancel
          </Button>
          <Button type="submit" disabled={submitting}>
            {submitting ? "Creating..." : "Create Product"}
          </Button>
        </div>
      </form>
    </Card>
  );
}
