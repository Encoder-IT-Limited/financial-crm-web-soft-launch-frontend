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
import { useUpdateProduct } from "../hooks/use-inventory";

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
  const [name, setName] = useState(product.name);
  const [sellingPrice, setSellingPrice] = useState(String(product.price));
  const [costPrice, setCostPrice] = useState(String(product.costPrice));
  const [minimumStock, setMinimumStock] = useState(String(product.minimumStock));
  const [reorderLevel, setReorderLevel] = useState(String(product.reorderLevel));
  const [status, setStatus] = useState(product.status);

  useEffect(() => {
    if (!open) return;
    setName(product.name);
    setSellingPrice(String(product.price));
    setCostPrice(String(product.costPrice));
    setMinimumStock(String(product.minimumStock));
    setReorderLevel(String(product.reorderLevel));
    setStatus(product.status);
  }, [open, product]);

  async function handleSubmit() {
    const price = Number(sellingPrice);
    const cost = Number(costPrice);
    const min = Number(minimumStock);
    const reorder = Number(reorderLevel);
    if (!name.trim() || !(price >= 0) || !(cost >= 0) || !(min >= 0) || !(reorder >= 0)) {
      toast.error("Check name and numeric fields");
      return;
    }
    try {
      await updateProduct.mutateAsync({
        id: product.id,
        input: {
          name: name.trim(),
          sellingPrice: price,
          costPrice: cost,
          minimumStock: min,
          reorderLevel: reorder,
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
        <Input value={name} onChange={(e) => setName(e.target.value)} className="h-9" />
      </FormField>
      <FormField label="Selling price">
        <Input type="number" min={0} step="any" value={sellingPrice} onChange={(e) => setSellingPrice(e.target.value)} className="h-9" />
      </FormField>
      <FormField label="Cost price">
        <Input type="number" min={0} step="any" value={costPrice} onChange={(e) => setCostPrice(e.target.value)} className="h-9" />
      </FormField>
      <FormField label="Minimum stock">
        <Input type="number" min={0} step="any" value={minimumStock} onChange={(e) => setMinimumStock(e.target.value)} className="h-9" />
      </FormField>
      <FormField label="Reorder level">
        <Input type="number" min={0} step="any" value={reorderLevel} onChange={(e) => setReorderLevel(e.target.value)} className="h-9" />
      </FormField>
      <FormField label="Status">
        <Select value={status} onValueChange={(v) => setStatus((v as "active" | "inactive") ?? "active")}>
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
      </FormField>
    </FormDialog>
  );
}
