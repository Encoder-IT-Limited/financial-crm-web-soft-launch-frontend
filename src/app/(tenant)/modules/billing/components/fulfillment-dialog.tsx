"use client";

import { useEffect, useMemo, useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
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
import { toast } from "@/lib/toast";
import { ApiError } from "@/lib/api/errors";
import { fmtQty } from "@/lib/format";
import {
  fulfillableLines,
  remainingFulfillQuantity,
  type FulfillInvoiceInput,
  type Invoice,
} from "../types";
import { useWarehouses } from "../../inventory/hooks/use-inventory";

type LineQty = { invoiceItemId: string; description: string; remaining: number; quantity: number };

export function FulfillmentDialog({
  invoice,
  open,
  onOpenChange,
  onSubmit,
  submitting,
}: {
  invoice: Invoice | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (input: FulfillInvoiceInput) => Promise<void>;
  submitting?: boolean;
}) {
  const { data: warehouses = [] } = useWarehouses();
  const [warehouseId, setWarehouseId] = useState("");
  const [generateDeliveryNote, setGenerateDeliveryNote] = useState(false);
  const [notes, setNotes] = useState("");
  const [lineQtys, setLineQtys] = useState<LineQty[]>([]);

  useEffect(() => {
    if (!invoice || !open) return;
    const rows = fulfillableLines(invoice)
      .map((line) => {
        const remaining = remainingFulfillQuantity(invoice, line);
        return {
          invoiceItemId: line.id,
          description: line.description,
          remaining,
          quantity: remaining,
        };
      })
      .filter((row) => row.remaining > 0);
    setLineQtys(rows);
    setWarehouseId("");
    setGenerateDeliveryNote(false);
    setNotes("");
  }, [invoice, open]);

  const hasLines = lineQtys.some((l) => l.quantity > 0);

  const canSubmit = useMemo(
    () => Boolean(warehouseId && hasLines && lineQtys.every((l) => l.quantity <= l.remaining + 1e-9)),
    [warehouseId, hasLines, lineQtys],
  );

  async function handleSubmit() {
    if (!invoice || !canSubmit) return;
    const over = lineQtys.find((l) => l.quantity > l.remaining + 1e-9);
    if (over) {
      toast.error(`Quantity for "${over.description}" exceeds remaining (${fmtQty(over.remaining)})`);
      return;
    }
    const lines = lineQtys.filter((l) => l.quantity > 0).map((l) => ({ invoiceItemId: l.invoiceItemId, quantity: l.quantity }));
    if (lines.length === 0) {
      toast.error("Enter at least one quantity to fulfill");
      return;
    }
    try {
      await onSubmit({ warehouseId, lines, generateDeliveryNote, notes: notes || undefined });
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Fulfillment failed");
    }
  }

  if (!invoice) return null;

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={`Fulfill — ${invoice.number}`}
      description="Deduct stock for product lines. Partial shipments are allowed."
      onSubmit={handleSubmit}
      submitLabel={submitting ? "Fulfilling…" : "Fulfill"}
      submitting={submitting}
    >
      <FormField label="Warehouse">
        <Select value={warehouseId} onValueChange={(v) => setWarehouseId(v ?? "")}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select warehouse" />
          </SelectTrigger>
          <SelectContent>
            {warehouses.map((w) => (
              <SelectItem key={w.id} value={w.id}>
                {w.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FormField>

      {lineQtys.length === 0 ? (
        <p className="text-[12.5px] text-text-4">All product lines are fully fulfilled.</p>
      ) : (
        <div className="flex flex-col gap-2">
          <div className="text-[11px] font-bold uppercase tracking-wide text-text-4">Quantities to ship</div>
          {lineQtys.map((line, idx) => (
            <div key={line.invoiceItemId} className="flex items-center justify-between gap-3 rounded-lg border border-border px-3 py-2">
              <div className="min-w-0 flex-1">
                <div className="truncate text-[13px] font-medium text-text">{line.description}</div>
                <div className="text-[11px] text-text-4">{fmtQty(line.remaining)} remaining</div>
              </div>
              <Input
                type="number"
                min={0}
                max={line.remaining}
                step="any"
                className="w-24"
                value={line.quantity}
                onChange={(e) => {
                  const quantity = Number(e.target.value);
                  setLineQtys((prev) => prev.map((row, i) => (i === idx ? { ...row, quantity } : row)));
                }}
              />
            </div>
          ))}
        </div>
      )}

      <label className="flex items-center gap-2 text-[13px] text-text-2">
        <Checkbox checked={generateDeliveryNote} onCheckedChange={(v) => setGenerateDeliveryNote(v === true)} />
        Generate delivery note
      </label>

      <FormField label="Notes (optional)">
        <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Shipment notes" />
      </FormField>
    </FormDialog>
  );
}
