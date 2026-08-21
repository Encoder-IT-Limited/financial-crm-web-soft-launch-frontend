"use client";

import { useRef, useState } from "react";
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
import { cn } from "@/lib/utils";
import { products } from "../../products/mock-data";
import {
  ADJUSTMENT_REASON_LABEL,
  ADJUSTMENT_WAREHOUSES,
  type AdjustmentReason,
  type AdjustmentType,
  type StockAdjustment,
} from "../mock-data";

const toNumber = (value: unknown) =>
  typeof value === "string" ? (value.trim() === "" ? undefined : Number(value)) : value;

const adjustmentSchema = z
  .object({
    sku: z.string().min(1, "Select a product"),
    warehouse: z.string().min(1, "Select a warehouse"),
    type: z.enum(["add", "deduct"], { error: "Choose Add or Deduct" }),
    quantity: z.preprocess(
      toNumber,
      z
        .number({ error: "Enter a valid quantity" })
        .int("Quantity must be a whole number")
        .min(1, "Quantity must be at least 1")
    ),
    reason: z.enum(["damage", "theft", "audit", "expiry", "other"], {
      error: "Select a reason",
    }),
    customReason: z.string().trim().optional(),
    notes: z.string().trim().optional(),
  })
  .refine((data) => data.reason !== "other" || (data.customReason ?? "").length > 0, {
    message: "Describe the custom reason",
    path: ["customReason"],
  });

type FormValues = {
  sku: string;
  warehouse: string;
  type: AdjustmentType | "";
  quantity: string;
  reason: AdjustmentReason | "";
  customReason: string;
  notes: string;
};

type FormErrors = Partial<Record<keyof FormValues, string>>;

const initialValues: FormValues = {
  sku: "",
  warehouse: "",
  type: "",
  quantity: "",
  reason: "",
  customReason: "",
  notes: "",
};

interface NewAdjustmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate: (adjustment: StockAdjustment) => void;
}

export function NewAdjustmentDialog({ open, onOpenChange, onCreate }: NewAdjustmentDialogProps) {
  const [values, setValues] = useState<FormValues>(initialValues);
  const [errors, setErrors] = useState<FormErrors>({});
  const [attachments, setAttachments] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function setField<K extends keyof FormValues>(key: K, value: FormValues[K]) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  function handleClose(next: boolean) {
    if (!next) {
      setValues(initialValues);
      setErrors({});
      setAttachments([]);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
    onOpenChange(next);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const result = adjustmentSchema.safeParse(values);
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
      // TODO: replace with adjustmentsApi.create once the inventory API exists.
      await new Promise((resolve) => setTimeout(resolve, 400));
      const product = products.find((p) => p.sku === result.data.sku)!;
      const reference =
        result.data.reason === "other"
          ? (result.data.customReason ?? "")
          : (result.data.notes || ADJUSTMENT_REASON_LABEL[result.data.reason]);
      onCreate({
        id: "",
        date: new Date().toISOString(),
        type: result.data.type,
        productName: product.name,
        sku: product.sku,
        category: product.category,
        warehouse: result.data.warehouse,
        quantity: result.data.quantity,
        reason: result.data.reason,
        reference,
        status: "pending",
      });
      setValues(initialValues);
      setAttachments([]);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch {
      toast.error("Could not create the adjustment. Try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>New Stock Adjustment</DialogTitle>
          <DialogDescription>
            Correct stock quantities or values. The adjustment is created as Pending.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
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

          <FormField label="Warehouse" error={errors.warehouse}>
            <Select value={values.warehouse} onValueChange={(value) => setField("warehouse", value ?? "")}>
              <SelectTrigger aria-label="Warehouse" className="w-full border-border text-[12.5px] min-[1440px]:text-[13.5px]">
                <SelectValue placeholder="Select warehouse" />
              </SelectTrigger>
              <SelectContent>
                {ADJUSTMENT_WAREHOUSES.map((warehouse) => (
                  <SelectItem key={warehouse} value={warehouse}>
                    {warehouse}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Adjustment Type" error={errors.type}>
              <div className="grid grid-cols-2 gap-2" role="group" aria-label="Adjustment type">
                <Button
                  type="button"
                  variant="outline"
                  aria-pressed={values.type === "add"}
                  className={cn(
                    values.type === "add" && "border-green bg-green text-white hover:bg-green/90 hover:text-white"
                  )}
                  onClick={() => setField("type", "add")}
                >
                  Add
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  aria-pressed={values.type === "deduct"}
                  className={cn(
                    values.type === "deduct" && "border-red bg-red text-white hover:bg-red/90 hover:text-white"
                  )}
                  onClick={() => setField("type", "deduct")}
                >
                  Deduct
                </Button>
              </div>
            </FormField>

            <FormField label="Quantity" error={errors.quantity}>
              <Input
                type="number"
                min={1}
                step={1}
                placeholder="e.g. 5"
                value={values.quantity}
                onChange={(e) => setField("quantity", e.target.value)}
                aria-invalid={!!errors.quantity}
                className="h-9 border-border text-[12.5px] min-[1440px]:text-[13.5px]"
              />
            </FormField>
          </div>

          <FormField label="Reason" error={errors.reason}>
            <Select value={values.reason} onValueChange={(value) => setField("reason", (value ?? "") as FormValues["reason"])}>
              <SelectTrigger aria-label="Reason" className="w-full border-border text-[12.5px] min-[1440px]:text-[13.5px]">
                <SelectValue placeholder="Select a reason" />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(ADJUSTMENT_REASON_LABEL) as AdjustmentReason[]).map((reason) => (
                  <SelectItem key={reason} value={reason}>
                    {ADJUSTMENT_REASON_LABEL[reason]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>

          {values.reason === "other" && (
            <FormField label="Custom Reason" error={errors.customReason}>
              <Input
                type="text"
                placeholder="e.g. Prepaid service credits reconciled"
                value={values.customReason}
                onChange={(e) => setField("customReason", e.target.value)}
                aria-invalid={!!errors.customReason}
                className="h-9 border-border text-[12.5px] min-[1440px]:text-[13.5px]"
              />
            </FormField>
          )}

          <FormField label="Notes / Remarks (optional)">
            <textarea
              value={values.notes}
              onChange={(e) => setField("notes", e.target.value)}
              placeholder="e.g. Cycle count variance traced to mis-scanned receiving batch"
              rows={3}
              className="w-full resize-none rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50"
            />
          </FormField>

          <FormField label="Attachments (optional — proof of damage / audit)">
            <Input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*,.pdf"
              onChange={(e) => setAttachments(Array.from(e.target.files ?? []).map((f) => f.name))}
              className="border-border py-1.5 text-[12.5px] file:mr-3 file:rounded-md file:border-0 file:bg-surface-subtle file:px-3 file:py-1 file:text-[11.5px] file:font-semibold file:text-text-2 min-[1440px]:text-[13.5px]"
            />
            {attachments.length > 0 && (
              <p className="text-[11px] text-text-3">{attachments.length} file(s) attached</p>
            )}
          </FormField>

          <DialogFooter>
            <Button variant="outline" type="button" onClick={() => handleClose(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Creating..." : "Create Adjustment"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
