"use client";

import { useState } from "react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { products } from "../../products/mock-data";
import type { StockTransfer } from "../mock-data";

const toNumber = (value: unknown) =>
  typeof value === "string" ? (value.trim() === "" ? undefined : Number(value)) : value;

const transferSchema = z
  .object({
    from: z.string().min(1, "Select a source warehouse"),
    to: z.string().min(1, "Select a destination warehouse"),
    sku: z.string().min(1, "Select a product"),
    quantity: z.preprocess(
      toNumber,
      z
        .number({ error: "Enter a valid quantity" })
        .int("Quantity must be a whole number")
        .min(1, "Quantity must be at least 1")
    ),
    notes: z.string().trim().optional(),
  })
  .refine((data) => data.from !== data.to, {
    message: "Source and destination must be different warehouses",
    path: ["to"],
  });

type FormValues = {
  from: string;
  to: string;
  sku: string;
  quantity: string;
  notes: string;
};

type FormErrors = Partial<Record<keyof FormValues, string>>;

const initialValues: FormValues = { from: "", to: "", sku: "", quantity: "", notes: "" };

interface NewTransferDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  warehouses: string[];
  onCreate: (transfer: StockTransfer) => void;
}

export function NewTransferDialog({ open, onOpenChange, warehouses, onCreate }: NewTransferDialogProps) {
  const [values, setValues] = useState<FormValues>(initialValues);
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);

  function setField<K extends keyof FormValues>(key: K, value: string) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  function handleClose(next: boolean) {
    if (!next) {
      setValues(initialValues);
      setErrors({});
    }
    onOpenChange(next);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const result = transferSchema.safeParse(values);
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
      // TODO: replace with transfersApi.create once the inventory API exists.
      await new Promise((resolve) => setTimeout(resolve, 400));
      const product = products.find((p) => p.sku === result.data.sku)!;
      const expected = new Date();
      expected.setDate(expected.getDate() + 3);
      onCreate({
        id: "",
        fromWarehouse: result.data.from,
        toWarehouse: result.data.to,
        productName: product.name,
        sku: product.sku,
        category: product.category,
        quantity: result.data.quantity,
        unit: "pcs",
        transferDate: new Date().toISOString(),
        expectedDelivery: expected.toISOString().slice(0, 10),
        status: "pending",
      });
      setValues(initialValues);
    } catch {
      toast.error("Could not create the transfer. Try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>New Stock Transfer</DialogTitle>
          <DialogDescription>
            Move stock between warehouses. The transfer is created as Pending.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="From Warehouse" error={errors.from}>
              <Select value={values.from} onValueChange={(value) => setField("from", value ?? "")}>
                <SelectTrigger aria-label="From warehouse" className="w-full border-border text-[12.5px] min-[1440px]:text-[13.5px]">
                  <SelectValue placeholder="Select source" />
                </SelectTrigger>
                <SelectContent>
                  {warehouses.map((warehouse) => (
                    <SelectItem key={warehouse} value={warehouse}>
                      {warehouse}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>

            <FormField label="To Warehouse" error={errors.to}>
              <Select value={values.to} onValueChange={(value) => setField("to", value ?? "")}>
                <SelectTrigger aria-label="To warehouse" className="w-full border-border text-[12.5px] min-[1440px]:text-[13.5px]">
                  <SelectValue placeholder="Select destination" />
                </SelectTrigger>
                <SelectContent>
                  {warehouses.map((warehouse) => (
                    <SelectItem key={warehouse} value={warehouse}>
                      {warehouse}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
          </div>

          <FormField label="Product" error={errors.sku}>
            <Select value={values.sku} onValueChange={(value) => setField("sku", value ?? "")}>
              <SelectTrigger aria-label="Product" className="w-full border-border text-[12.5px] min-[1440px]:text-[13.5px]">
                <SelectValue placeholder="Search and select a product" />
              </SelectTrigger>
              <SelectContent>
                {products.map((product) => (
                  <SelectItem key={product.sku} value={product.sku}>
                    {product.name} ({product.sku})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>

          <FormField label="Quantity" error={errors.quantity}>
            <Input
              type="number"
              min={1}
              step={1}
              placeholder="e.g. 25"
              value={values.quantity}
              onChange={(e) => setField("quantity", e.target.value)}
              aria-invalid={!!errors.quantity}
              className="h-9 border-border text-[12.5px] min-[1440px]:text-[13.5px]"
            />
          </FormField>

          <FormField label="Notes / Reason (optional)">
            <textarea
              value={values.notes}
              onChange={(e) => setField("notes", e.target.value)}
              placeholder="e.g. Restock ahead of weekend demand"
              rows={3}
              className="w-full resize-none rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50"
            />
          </FormField>

          <DialogFooter>
            <Button variant="outline" type="button" onClick={() => handleClose(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Creating..." : "Create Transfer"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
