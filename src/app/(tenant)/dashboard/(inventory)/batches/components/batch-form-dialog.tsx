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
import { BATCH_WAREHOUSES, type Batch } from "../mock-data";

const toNumber = (value: unknown) =>
  typeof value === "string" ? (value.trim() === "" ? undefined : Number(value)) : value;

const batchSchema = z
  .object({
    id: z.string().trim().min(1, "Enter a batch number"),
    sku: z.string().min(1, "Select a product"),
    warehouse: z.string().min(1, "Select a warehouse"),
    quantity: z.preprocess(
      toNumber,
      z
        .number({ error: "Enter a valid quantity" })
        .int("Quantity must be a whole number")
        .min(1, "Quantity must be at least 1")
    ),
    mfgDate: z.string().min(1, "Select the manufacturing date"),
    expDate: z.string().min(1, "Select the expiry date"),
    notes: z.string().trim().optional(),
  })
  .refine((data) => data.expDate > data.mfgDate, {
    message: "Expiry must be after the manufacturing date",
    path: ["expDate"],
  });

export interface BatchSaveData {
  id: string;
  sku: string;
  warehouse: string;
  quantity: number;
  mfgDate: string;
  expDate: string;
  notes: string;
}

type FormValues = Omit<BatchSaveData, "quantity"> & { quantity: string };

type FormErrors = Partial<Record<keyof FormValues, string>>;

function toFormValues(batch: Batch | null, suggestedId: string): FormValues {
  return batch
    ? {
        id: batch.id,
        sku: batch.sku,
        warehouse: batch.warehouse,
        quantity: String(batch.quantity),
        mfgDate: batch.mfgDate,
        expDate: batch.expDate,
        notes: batch.notes,
      }
    : { id: suggestedId, sku: "", warehouse: "", quantity: "", mfgDate: "", expDate: "", notes: "" };
}

interface BatchFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** When set the dialog edits this batch instead of creating one. */
  editBatch: Batch | null;
  suggestedId: string;
  existingIds: string[];
  onSave: (data: BatchSaveData) => void;
}

export function BatchFormDialog({
  open,
  onOpenChange,
  editBatch,
  suggestedId,
  existingIds,
  onSave,
}: BatchFormDialogProps) {
  const [values, setValues] = useState<FormValues>(() => toFormValues(editBatch, suggestedId));
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);

  // Re-seed the form each time the dialog opens so add/edit targets stay fresh.
  const [prevOpen, setPrevOpen] = useState(open);
  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) {
      setValues(toFormValues(editBatch, suggestedId));
      setErrors({});
    }
  }

  function setField<K extends keyof FormValues>(key: K, value: FormValues[K]) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  function handleClose(next: boolean) {
    if (!next) {
      setValues(toFormValues(null, ""));
      setErrors({});
    }
    onOpenChange(next);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const result = batchSchema.safeParse(values);
    if (!result.success) {
      const fieldErrors: FormErrors = {};
      for (const issue of result.error.issues) {
        fieldErrors[issue.path[0] as keyof FormValues] ??= issue.message;
      }
      setErrors(fieldErrors);
      return;
    }
    if (!editBatch && existingIds.includes(result.data.id)) {
      setErrors((prev) => ({ ...prev, id: "This batch number already exists" }));
      return;
    }

    setErrors({});
    setSubmitting(true);
    try {
      // TODO: replace with batchesApi.save once the inventory API exists.
      await new Promise((resolve) => setTimeout(resolve, 400));
      onSave({ ...result.data, notes: result.data.notes ?? "" });
      setValues(toFormValues(null, ""));
    } catch {
      toast.error("Could not save the batch. Try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{editBatch ? `Edit ${editBatch.id}` : "Add Batch"}</DialogTitle>
          <DialogDescription>
            {editBatch
              ? "Update the batch details. The batch number cannot be changed."
              : "Register a new product batch. The batch number is auto-generated but can be edited."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
          <div className="grid gap-4 sm:grid-cols-2">
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

            <FormField label="Batch Number" error={errors.id}>
              <Input
                type="text"
                placeholder="e.g. BATCH-2026-027"
                value={values.id}
                onChange={(e) => setField("id", e.target.value)}
                aria-invalid={!!errors.id}
                disabled={!!editBatch}
                className="h-9 border-border text-[12.5px] min-[1440px]:text-[13.5px]"
              />
            </FormField>
          </div>

          <FormField label="Warehouse" error={errors.warehouse}>
            <Select value={values.warehouse} onValueChange={(value) => setField("warehouse", value ?? "")}>
              <SelectTrigger aria-label="Warehouse" className="w-full border-border text-[12.5px] min-[1440px]:text-[13.5px]">
                <SelectValue placeholder="Select warehouse" />
              </SelectTrigger>
              <SelectContent>
                {BATCH_WAREHOUSES.map((warehouse) => (
                  <SelectItem key={warehouse} value={warehouse}>
                    {warehouse}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>

          <div className="grid gap-4 sm:grid-cols-3">
            <FormField label="Quantity" error={errors.quantity}>
              <Input
                type="number"
                min={1}
                step={1}
                placeholder="e.g. 40"
                value={values.quantity}
                onChange={(e) => setField("quantity", e.target.value)}
                aria-invalid={!!errors.quantity}
                className="h-9 border-border text-[12.5px] min-[1440px]:text-[13.5px]"
              />
            </FormField>

            <FormField label="Mfg Date" error={errors.mfgDate}>
              <Input
                type="date"
                value={values.mfgDate}
                onChange={(e) => setField("mfgDate", e.target.value)}
                aria-invalid={!!errors.mfgDate}
                className="h-9 border-border text-[12.5px] min-[1440px]:text-[13.5px]"
              />
            </FormField>

            <FormField label="Exp Date" error={errors.expDate}>
              <Input
                type="date"
                value={values.expDate}
                onChange={(e) => setField("expDate", e.target.value)}
                aria-invalid={!!errors.expDate}
                className="h-9 border-border text-[12.5px] min-[1440px]:text-[13.5px]"
              />
            </FormField>
          </div>

          <FormField label="Notes / Remarks (optional)">
            <textarea
              value={values.notes}
              onChange={(e) => setField("notes", e.target.value)}
              placeholder="e.g. Supplier lot #A117 — rotate first"
              rows={3}
              className="w-full resize-none rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50"
            />
          </FormField>

          <DialogFooter>
            <Button variant="outline" type="button" onClick={() => handleClose(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Saving..." : editBatch ? "Save Changes" : "Add Batch"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
