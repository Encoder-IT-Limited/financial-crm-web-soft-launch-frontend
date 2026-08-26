"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
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
import { ApiError } from "@/lib/api/errors";
import { createProductSchema } from "../schemas";
import { useCategories, useCreateProduct, useUnits } from "../hooks/use-inventory";

type FormValues = {
  name: string;
  sku: string;
  barcode: string;
  description: string;
  categoryId: string;
  unitId: string;
  costPrice: string;
  sellingPrice: string;
  taxRate: string;
  minimumStock: string;
  maximumStock: string;
  reorderLevel: string;
  trackBatch: boolean;
  status: string;
};

type FormErrors = Partial<Record<keyof FormValues, string>>;

const initialValues: FormValues = {
  name: "",
  sku: "",
  barcode: "",
  description: "",
  categoryId: "",
  unitId: "",
  costPrice: "0",
  sellingPrice: "",
  taxRate: "5",
  minimumStock: "0",
  maximumStock: "0",
  reorderLevel: "0",
  trackBatch: true,
  status: "active",
};

const inputClass = "h-9 border-border text-[12.5px]";

export function ProductForm() {
  const [values, setValues] = useState<FormValues>(initialValues);
  const [errors, setErrors] = useState<FormErrors>({});
  const router = useRouter();
  const { data: categories = [] } = useCategories();
  const { data: units = [] } = useUnits();
  const createProduct = useCreateProduct();

  function setField<K extends keyof FormValues>(key: K, value: FormValues[K]) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const result = createProductSchema.safeParse(values);
    if (!result.success) {
      const fieldErrors: FormErrors = {};
      for (const issue of result.error.issues) {
        fieldErrors[issue.path[0] as keyof FormValues] ??= issue.message;
      }
      setErrors(fieldErrors);
      return;
    }

    setErrors({});
    try {
      const data = result.data;
      await createProduct.mutateAsync({
        name: data.name,
        sku: data.sku,
        barcode: data.barcode || undefined,
        description: data.description || undefined,
        categoryId: data.categoryId || undefined,
        unitId: data.unitId,
        costPrice: data.costPrice as number,
        sellingPrice: data.sellingPrice as number,
        taxRate: data.taxRate as number,
        minimumStock: data.minimumStock as number,
        maximumStock: data.maximumStock as number,
        reorderLevel: data.reorderLevel as number,
        trackBatch: data.trackBatch,
        status: data.status === "inactive" ? "INACTIVE" : "ACTIVE",
      });
      toast.success("Product created", { description: `${data.name} was added to your catalog.` });
      router.push("/dashboard/products");
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Could not create the product.");
    }
  }

  return (
    <Card className="max-w-3xl p-5">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
        <FormField label="Product Name" error={errors.name}>
          <Input className={inputClass} value={values.name} onChange={(e) => setField("name", e.target.value)} />
        </FormField>

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="SKU" error={errors.sku}>
            <Input className={inputClass} value={values.sku} onChange={(e) => setField("sku", e.target.value)} />
          </FormField>
          <FormField label="Barcode (optional)">
            <Input className={inputClass} value={values.barcode} onChange={(e) => setField("barcode", e.target.value)} />
          </FormField>
        </div>

        <FormField label="Description (optional)">
          <textarea
            value={values.description}
            onChange={(e) => setField("description", e.target.value)}
            rows={3}
            className="w-full resize-none rounded-lg border border-input px-2.5 py-2 text-sm"
          />
        </FormField>

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Category" hint="Optional — create categories via API if empty.">
            <Select value={values.categoryId} onValueChange={(v) => setField("categoryId", v ?? "")}>
              <SelectTrigger className={`w-full ${inputClass}`}>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>
          <FormField label="Unit" error={errors.unitId}>
            <Select value={values.unitId} onValueChange={(v) => setField("unitId", v ?? "")}>
              <SelectTrigger className={`w-full ${inputClass}`} aria-invalid={!!errors.unitId}>
                <SelectValue placeholder="Select unit" />
              </SelectTrigger>
              <SelectContent>
                {units.map((u) => (
                  <SelectItem key={u.id} value={u.id}>
                    {u.name} ({u.symbol})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <FormField label="Cost Price (AED)" error={errors.costPrice}>
            <Input type="number" min={0} step="0.01" className={inputClass} value={values.costPrice} onChange={(e) => setField("costPrice", e.target.value)} />
          </FormField>
          <FormField label="Selling Price (AED)" error={errors.sellingPrice}>
            <Input type="number" min={0} step="0.01" className={inputClass} value={values.sellingPrice} onChange={(e) => setField("sellingPrice", e.target.value)} />
          </FormField>
          <FormField label="Tax Rate (%)" error={errors.taxRate}>
            <Input type="number" min={0} max={100} step="0.01" className={inputClass} value={values.taxRate} onChange={(e) => setField("taxRate", e.target.value)} />
          </FormField>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <FormField label="Minimum Stock" error={errors.minimumStock}>
            <Input type="number" min={0} className={inputClass} value={values.minimumStock} onChange={(e) => setField("minimumStock", e.target.value)} />
          </FormField>
          <FormField label="Maximum Stock" error={errors.maximumStock}>
            <Input type="number" min={0} className={inputClass} value={values.maximumStock} onChange={(e) => setField("maximumStock", e.target.value)} />
          </FormField>
          <FormField label="Reorder Level" error={errors.reorderLevel}>
            <Input type="number" min={0} className={inputClass} value={values.reorderLevel} onChange={(e) => setField("reorderLevel", e.target.value)} />
          </FormField>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Status">
            <Select value={values.status} onValueChange={(v) => setField("status", v ?? "active")}>
              <SelectTrigger className={`w-full ${inputClass}`}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </FormField>
          <FormField label="Batch tracking" hint="Goods receipts auto-create a batch when blank.">
            <label className="flex h-9 items-center gap-2 rounded-lg border border-border px-3 text-[12.5px]">
              <Checkbox checked={values.trackBatch} onCheckedChange={(c) => setField("trackBatch", c === true)} />
              Track batches
            </label>
          </FormField>
        </div>

        <div className="mt-2 flex justify-end gap-2 border-t border-border pt-4">
          <Button variant="outline" render={<Link href="/dashboard/products" />} nativeButton={false}>
            Cancel
          </Button>
          <Button type="submit" disabled={createProduct.isPending}>
            {createProduct.isPending ? "Creating..." : "Create Product"}
          </Button>
        </div>
      </form>
    </Card>
  );
}
