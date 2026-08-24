"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";
import type { Invoice } from "../../invoices/types";
import { fulfillableLines, fulfilledQuantity, type Fulfillment } from "../types";
import { fulfillmentFormSchema } from "../schemas";
import { fulfillmentsApi } from "../api/fulfillments.service";
import { PRODUCT_LOOKUP_WAREHOUSES } from "../../invoices/mock/product-lookup-seed";
import { FormField } from "../../invoices/components/form-field";

/** "Mark Fulfilled" dialog — the B2B path from Delivery/Fulfillment
 * Phase I-B: pick how much of each product-linked line actually
 * shipped (defaults to the full remaining amount, editable down for a
 * partial shipment), optionally as a numbered delivery note. */
export function FulfillmentDialog({
  invoice,
  open,
  onOpenChange,
}: {
  invoice: Invoice | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const queryClient = useQueryClient();

  const { data: fulfillments = [] } = useQuery({
    queryKey: ["fulfillments", invoice?.id],
    queryFn: () => fulfillmentsApi.list(invoice!.id),
    enabled: !!invoice,
  });

  const lines = invoice ? fulfillableLines(invoice) : [];
  const remaining = (lineId: string) => {
    const line = lines.find((l) => l.id === lineId);
    if (!line) return 0;
    return Math.max(0, line.quantity - fulfilledQuantity(lineId, fulfillments));
  };

  // Untouched by the user until they edit a field — falls back to the full
  // remaining quantity at render time, so it stays correct once the
  // fulfillments query resolves without needing an effect to re-seed it.
  const [quantities, setQuantities] = useState<Record<string, string>>({});
  const [asDeliveryNote, setAsDeliveryNote] = useState(false);
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | undefined>();
  const [saving, setSaving] = useState(false);

  function reset() {
    setQuantities({});
    setAsDeliveryNote(false);
    setNotes("");
    setError(undefined);
  }

  function quantityValue(lineId: string): string {
    return quantities[lineId] ?? String(remaining(lineId) || "");
  }

  function handleSubmit() {
    if (!invoice) return;

    const inputLines = lines
      .map((l) => ({
        invoiceLineId: l.id,
        productId: l.productId,
        warehouseId: l.warehouseId,
        quantityFulfilled: Number(quantityValue(l.id)) || 0,
      }))
      .filter((l) => l.quantityFulfilled > 0);

    const result = fulfillmentFormSchema.safeParse({
      trigger: asDeliveryNote ? "delivery-note" : "manual",
      lines: inputLines,
      notes: notes || undefined,
    });
    if (!result.success) {
      setError(result.error.issues[0]?.message);
      return;
    }

    for (const l of inputLines) {
      const cap = remaining(l.invoiceLineId);
      if (l.quantityFulfilled > cap + 0.0001) {
        setError(`Quantity exceeds the remaining ${cap} unit(s) for that line`);
        return;
      }
    }

    setSaving(true);
    fulfillmentsApi
      .create({ ...result.data, invoiceId: invoice.id })
      .then((created: Fulfillment) => {
        toast.success(
          created.number ? `Delivery note ${created.number} created for ${invoice.number}` : `${invoice.number} marked fulfilled`
        );
        queryClient.invalidateQueries({ queryKey: ["fulfillments", invoice.id] });
        queryClient.invalidateQueries({ queryKey: ["invoice", invoice.id] });
        onOpenChange(false);
      })
      .finally(() => setSaving(false));
  }

  const warehouseName = (id: string) => PRODUCT_LOOKUP_WAREHOUSES.find((w) => w.id === id)?.name ?? id;
  const totalToFulfill = lines.reduce((sum, l) => sum + (Number(quantityValue(l.id)) || 0), 0);

  return (
    <Dialog open={open} onOpenChange={(next) => { onOpenChange(next); if (next) reset(); }}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Mark Fulfilled</DialogTitle>
          <DialogDescription>
            {invoice?.number} · goods leaving the warehouse deduct stock now, independent of payment status
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-3">
          {lines.map((l) => {
            const cap = remaining(l.id);
            return (
              <FormField key={l.id} label={`${l.description} — ${warehouseName(l.warehouseId)}`}>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min={0}
                    max={cap}
                    step="any"
                    value={quantityValue(l.id)}
                    onChange={(e) => setQuantities({ ...quantities, [l.id]: e.target.value })}
                    disabled={cap <= 0}
                  />
                  <span className="shrink-0 text-[11.5px] text-text-3">of {cap} remaining</span>
                </div>
              </FormField>
            );
          })}

          <label className="flex items-center gap-2 text-[13px] text-text-2">
            <Checkbox checked={asDeliveryNote} onCheckedChange={(v) => setAsDeliveryNote(v === true)} />
            Generate a numbered delivery note (DN-####) for this shipment
          </label>

          <FormField label="Notes (optional)">
            <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="e.g. Partial shipment — remainder next week" />
          </FormField>

          {error && <p className={cn("text-[11.5px] text-red")}>{error}</p>}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={saving || totalToFulfill <= 0}>
            {saving ? "Fulfilling..." : `Fulfill ${totalToFulfill} unit(s)`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
