"use client";

import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FormDialog } from "@/components/shared/form-dialog";
import { FormField } from "@/components/shared/form-field";
import { ApiError } from "@/lib/api/errors";
import { toast } from "@/lib/toast";
import type { Product } from "../types";
import {
  useCategories,
  useUnits,
  useUpdateProduct,
} from "../hooks/use-inventory";

export function ProductEditDialog({
  product,
  open,
  onOpenChange,
}: {
  product: Product;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const updateProduct = useUpdateProduct();
  const { data: categories = [] } = useCategories();
  const { data: units = [] } = useUnits();

  const [name, setName] = useState(product.name);
  const [sku, setSku] = useState(product.sku);
  const [barcode, setBarcode] = useState(product.barcode ?? "");
  const [description, setDescription] = useState(product.description ?? "");
  const [categoryId, setCategoryId] = useState(product.categoryId ?? "");
  const [unitId, setUnitId] = useState(product.unitId ?? "");
  const [sellingPrice, setSellingPrice] = useState(String(product.price));
  const [costPrice, setCostPrice] = useState(String(product.costPrice));
  const [taxRate, setTaxRate] = useState(String(product.taxRate ?? 0));
  const [minimumStock, setMinimumStock] = useState(
    String(product.minimumStock),
  );
  const [maximumStock, setMaximumStock] = useState(
    String(product.maximumStock),
  );
  const [reorderLevel, setReorderLevel] = useState(
    String(product.reorderLevel),
  );
  const [trackBatch, setTrackBatch] = useState(
    product.trackBatch ? "yes" : "no",
  );
  const [status, setStatus] = useState(product.status);

  useEffect(() => {
    if (!open) return;
    setName(product.name);
    setSku(product.sku);
    setBarcode(product.barcode ?? "");
    setDescription(product.description ?? "");
    setCategoryId(product.categoryId ?? "");
    setUnitId(product.unitId ?? "");
    setSellingPrice(String(product.price));
    setCostPrice(String(product.costPrice));
    setTaxRate(String(product.taxRate ?? 0));
    setMinimumStock(String(product.minimumStock));
    setMaximumStock(String(product.maximumStock));
    setReorderLevel(String(product.reorderLevel));
    setTrackBatch(product.trackBatch ? "yes" : "no");
    setStatus(product.status);
  }, [open, product]);

  async function handleSubmit() {
    const price = Number(sellingPrice);
    const cost = Number(costPrice);
    const tax = Number(taxRate);
    const min = Number(minimumStock);
    const max = Number(maximumStock);
    const reorder = Number(reorderLevel);
    if (!name.trim() || !sku.trim()) {
      toast.error("Name and SKU are required");
      return;
    }
    if (
      [price, cost, tax, min, max, reorder].some(
        (n) => !Number.isFinite(n) || n < 0,
      )
    ) {
      toast.error("Check numeric fields");
      return;
    }
    try {
      await updateProduct.mutateAsync({
        id: product.id,
        input: {
          name: name.trim(),
          sku: sku.trim(),
          barcode: barcode.trim() || undefined,
          description: description.trim() || undefined,
          categoryId: categoryId || undefined,
          unitId: unitId || undefined,
          sellingPrice: price,
          costPrice: cost,
          taxRate: tax,
          minimumStock: min,
          maximumStock: max,
          reorderLevel: reorder,
          trackBatch: trackBatch === "yes",
          status: status === "inactive" ? "INACTIVE" : "ACTIVE",
        },
      });
      toast.success("Product updated");
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Update failed");
    }
  }

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Edit product"
      onSubmit={handleSubmit}
      submitLabel="Save"
      submitting={updateProduct.isPending}
    >
      <FormField label="Name">
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="h-9"
        />
      </FormField>
      <FormField label="SKU">
        <Input
          value={sku}
          onChange={(e) => setSku(e.target.value)}
          className="h-9"
        />
      </FormField>
      <FormField label="Barcode">
        <Input
          value={barcode}
          onChange={(e) => setBarcode(e.target.value)}
          className="h-9"
        />
      </FormField>
      <FormField label="Category">
        <Select
          value={categoryId || "__none"}
          onValueChange={(v) => setCategoryId(v === "__none" ? "" : (v ?? ""))}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select category">
              {(v: string | null) => (!v || v === "__none" ? "None" : (categories.find((c) => c.id === v)?.name ?? "Select category"))}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__none">None</SelectItem>
            {categories.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FormField>
      <FormField label="Unit">
        <Select
          value={unitId || "__none"}
          onValueChange={(v) => setUnitId(v === "__none" ? "" : (v ?? ""))}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select unit">
              {(v: string | null) => {
                if (!v || v === "__none") return "None";
                const u = units.find((x) => x.id === v);
                return u ? `${u.name} (${u.symbol})` : "Select unit";
              }}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__none">None</SelectItem>
            {units.map((u) => (
              <SelectItem key={u.id} value={u.id}>
                {u.name} ({u.symbol})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FormField>
      <FormField label="Selling price">
        <Input
          type="number"
          min={0}
          step="any"
          value={sellingPrice}
          onChange={(e) => setSellingPrice(e.target.value)}
          className="h-9"
        />
      </FormField>
      <FormField label="Cost price">
        <Input
          type="number"
          min={0}
          step="any"
          value={costPrice}
          onChange={(e) => setCostPrice(e.target.value)}
          className="h-9"
        />
      </FormField>
      <FormField label="Tax rate %">
        <Input
          type="number"
          min={0}
          step="any"
          value={taxRate}
          onChange={(e) => setTaxRate(e.target.value)}
          className="h-9"
        />
      </FormField>
      <FormField label="Minimum stock">
        <Input
          type="number"
          min={0}
          step="any"
          value={minimumStock}
          onChange={(e) => setMinimumStock(e.target.value)}
          className="h-9"
        />
      </FormField>
      <FormField label="Maximum stock">
        <Input
          type="number"
          min={0}
          step="any"
          value={maximumStock}
          onChange={(e) => setMaximumStock(e.target.value)}
          className="h-9"
        />
      </FormField>
      <FormField label="Reorder level">
        <Input
          type="number"
          min={0}
          step="any"
          value={reorderLevel}
          onChange={(e) => setReorderLevel(e.target.value)}
          className="h-9"
        />
      </FormField>
      <FormField label="Batch tracking">
        <Select
          value={trackBatch}
          onValueChange={(v) => setTrackBatch(v ?? "yes")}
        >
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="yes">Yes</SelectItem>
            <SelectItem value="no">No</SelectItem>
          </SelectContent>
        </Select>
      </FormField>
      <FormField label="Status">
        <Select
          value={status}
          onValueChange={(v) =>
            setStatus((v as "active" | "inactive") ?? "active")
          }
        >
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
      </FormField>
      <FormField label="Description">
        <Input
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="h-9"
        />
      </FormField>
    </FormDialog>
  );
}
