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
import {
  suggestedReorderQty,
  type LowStockItem,
  type PurchaseReorder,
  type ReorderSaveData,
} from "../mock-data";

const toNumber = (value: unknown) =>
  typeof value === "string" ? (value.trim() === "" ? undefined : Number(value)) : value;

function localDateIso(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** Default expected delivery, a week out. Reads the clock — call from event
 * handlers only, never during render. */
export function defaultDeliveryDate(daysAhead = 7): string {
  return localDateIso(new Date(Date.now() + daysAhead * 24 * 60 * 60 * 1000));
}

const reorderSchema = z
  .object({
    sku: z.string().min(1, "Select a product"),
    requestedQty: z.preprocess(
      toNumber,
      z
        .number({ error: "Enter a valid quantity" })
        .int("Quantity must be a whole number")
        .min(1, "Quantity must be at least 1")
    ),
    expectedDelivery: z.string().min(1, "Select an expected delivery date"),
    notes: z.string().trim().optional(),
  })
  .refine((data) => data.expectedDelivery >= localDateIso(new Date()), {
    message: "Expected delivery must be today or later",
    path: ["expectedDelivery"],
  });

type FormValues = {
  sku: string;
  requestedQty: string;
  expectedDelivery: string;
  notes: string;
};

type FormErrors = Partial<Record<keyof FormValues, string>>;

interface CreateReorderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  items: LowStockItem[];
  /** Prefills the form when opened via a row's Quick Reorder button. */
  quickItem: LowStockItem | null;
  /** When set the dialog edits this reorder instead of creating one. */
  editReorder: PurchaseReorder | null;
  /** Precomputed by the parent at open time (event handlers may read the clock). */
  defaultDelivery: string;
  onSave: (data: ReorderSaveData) => void;
}

export function CreateReorderDialog({
  open,
  onOpenChange,
  items,
  quickItem,
  editReorder,
  defaultDelivery,
  onSave,
}: CreateReorderDialogProps) {
  const [values, setValues] = useState<FormValues>({
    sku: "",
    requestedQty: "",
    expectedDelivery: "",
    notes: "",
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);

  // Re-seed the form each time the dialog opens so create/quick/edit targets stay fresh.
  const [prevOpen, setPrevOpen] = useState(open);
  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) {
      const item = quickItem;
      setValues(
        editReorder
          ? {
              sku: editReorder.sku,
              requestedQty: String(editReorder.requestedQty),
              expectedDelivery: editReorder.expectedDelivery,
              notes: editReorder.notes,
            }
          : {
              sku: item?.sku ?? "",
              requestedQty: item ? String(suggestedReorderQty(item)) : "",
              expectedDelivery: defaultDelivery,
              notes: "",
            }
      );
      setErrors({});
    }
  }

  function setField<K extends keyof FormValues>(key: K, value: FormValues[K]) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  function handleClose(next: boolean) {
    if (!next) {
      setValues({ sku: "", requestedQty: "", expectedDelivery: "", notes: "" });
      setErrors({});
    }
    onOpenChange(next);
  }

  const supplier =
    editReorder?.supplier ?? items.find((item) => item.sku === values.sku)?.supplier ?? "";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const result = reorderSchema.safeParse(values);
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
      // TODO: replace with reordersApi.save once the purchasing API exists.
      await new Promise((resolve) => setTimeout(resolve, 400));
      onSave({ ...result.data, notes: result.data.notes ?? "" });
      setValues({ sku: "", requestedQty: "", expectedDelivery: "", notes: "" });
    } catch {
      toast.error("Could not save the reorder. Try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {editReorder ? `Edit ${editReorder.id}` : "Create Reorder"}
          </DialogTitle>
          <DialogDescription>
            {editReorder
              ? "Adjust the quantity or expected delivery. The product and supplier cannot be changed."
              : "Raise a purchase reorder. It is submitted as Pending Approval."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
          <FormField label="Product" error={errors.sku}>
            <Select
              value={values.sku}
              onValueChange={(value) => setField("sku", value ?? "")}
              disabled={!!editReorder}
            >
              <SelectTrigger aria-label="Product" className="w-full border-border text-[12.5px] min-[1440px]:text-[13.5px]">
                <SelectValue placeholder="Search and select a product" />
              </SelectTrigger>
              <SelectContent>
                {items.map((item) => (
                  <SelectItem key={item.sku} value={item.sku}>
                    {item.productName} ({item.sku})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>

          <FormField label="Supplier (auto-populated)">
            <Input
              value={supplier}
              placeholder="Select a product first"
              readOnly
              className="h-9 border-border bg-surface-subtle text-[12.5px] text-text-2 min-[1440px]:text-[13.5px]"
              aria-readonly="true"
            />
          </FormField>

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Requested Qty" error={errors.requestedQty}>
              <Input
                type="number"
                min={1}
                step={1}
                placeholder="e.g. 50"
                value={values.requestedQty}
                onChange={(e) => setField("requestedQty", e.target.value)}
                aria-invalid={!!errors.requestedQty}
                className="h-9 border-border text-[12.5px] min-[1440px]:text-[13.5px]"
              />
            </FormField>

            <FormField label="Expected Delivery" error={errors.expectedDelivery}>
              <Input
                type="date"
                value={values.expectedDelivery}
                onChange={(e) => setField("expectedDelivery", e.target.value)}
                aria-invalid={!!errors.expectedDelivery}
                className="h-9 border-border text-[12.5px] min-[1440px]:text-[13.5px]"
              />
            </FormField>
          </div>

          <FormField label="Notes / Remarks (optional)">
            <textarea
              value={values.notes}
              onChange={(e) => setField("notes", e.target.value)}
              placeholder="e.g. Urgent — stockout risk this week"
              rows={3}
              className="w-full resize-none rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50"
            />
          </FormField>

          <DialogFooter>
            <Button variant="outline" type="button" onClick={() => handleClose(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Saving..." : editReorder ? "Save Changes" : "Create Reorder"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
