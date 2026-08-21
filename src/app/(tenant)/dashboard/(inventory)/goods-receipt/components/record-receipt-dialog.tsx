"use client";

import { useMemo, useState } from "react";
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
import { RECEIPT_WAREHOUSES, type OpenPurchaseOrder, type ReceiptSubmission, type ReceiptSubmissionLine } from "../mock-data";

const headerSchema = z.object({
  poNumber: z.string().min(1, "Select a purchase order"),
  warehouse: z.string().min(1, "Select a destination warehouse"),
});

interface DraftLine {
  sku: string;
  name: string;
  unit: string;
  /** Quantity still outstanding on the PO line. */
  remainingQty: number;
  receiveQty: string;
  batchNumber: string;
  expiryDate: string;
}

type LineErrors = Partial<Record<"receiveQty" | "batchNumber" | "expiryDate", string>>;

interface RecordReceiptDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  purchaseOrders: OpenPurchaseOrder[];
  onRecord: (submission: ReceiptSubmission) => void;
}

export function RecordReceiptDialog({
  open,
  onOpenChange,
  purchaseOrders,
  onRecord,
}: RecordReceiptDialogProps) {
  const [poNumber, setPoNumber] = useState("");
  const [warehouse, setWarehouse] = useState("");
  const [notes, setNotes] = useState("");
  const [lines, setLines] = useState<DraftLine[]>([]);
  const [errors, setErrors] = useState<Partial<Record<"poNumber" | "warehouse" | "lines", string>>>({});
  const [lineErrors, setLineErrors] = useState<Record<string, LineErrors>>({});
  const [submitting, setSubmitting] = useState(false);

  const selectedPo = useMemo(
    () => purchaseOrders.find((po) => po.poNumber === poNumber),
    [purchaseOrders, poNumber]
  );

  function handlePoChange(next: string | null) {
    const poNumber = next ?? "";
    setPoNumber(poNumber);
    setErrors((prev) => ({ ...prev, poNumber: undefined }));
    const po = purchaseOrders.find((p) => p.poNumber === poNumber);
    if (po) {
      setWarehouse(po.warehouse);
      setErrors((prev) => ({ ...prev, warehouse: undefined }));
      setLines(
        po.lines
          .filter((line) => line.orderedQty - line.receivedQty > 0)
          .map((line) => ({
            sku: line.sku,
            name: line.name,
            unit: line.unit,
            remainingQty: line.orderedQty - line.receivedQty,
            receiveQty: "",
            batchNumber: "",
            expiryDate: "",
          }))
      );
      setLineErrors({});
    } else {
      setWarehouse("");
      setLines([]);
    }
  }

  function setLine(sku: string, patch: Partial<DraftLine>) {
    setLines((prev) => prev.map((line) => (line.sku === sku ? { ...line, ...patch } : line)));
  }

  function handleClose(next: boolean) {
    if (!next) {
      setPoNumber("");
      setWarehouse("");
      setNotes("");
      setLines([]);
      setErrors({});
      setLineErrors({});
    }
    onOpenChange(next);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const header = headerSchema.safeParse({ poNumber, warehouse });
    if (!header.success) {
      const fieldErrors: typeof errors = {};
      for (const issue of header.error.issues) {
        fieldErrors[issue.path[0] as "poNumber" | "warehouse"] ??= issue.message;
      }
      setErrors(fieldErrors);
      return;
    }
    if (!selectedPo) return;

    const nextLineErrors: Record<string, LineErrors> = {};
    let anyReceived = false;

    for (const line of lines) {
      const lineError: LineErrors = {};
      const raw = line.receiveQty.trim();
      if (raw === "") {
        lineError.receiveQty = "Enter a quantity (0 if none)";
      } else {
        const qty = Number(raw);
        if (!Number.isInteger(qty) || qty < 0) {
          lineError.receiveQty = "Enter a whole number of 0 or more";
        } else if (qty > line.remainingQty) {
          lineError.receiveQty = `Cannot exceed ${line.remainingQty} outstanding`;
        } else if (qty > 0) {
          anyReceived = true;
        }
      }
      if (line.expiryDate) {
        const expiry = new Date(line.expiryDate);
        if (Number.isNaN(expiry.getTime())) {
          lineError.expiryDate = "Enter a valid date";
        } else if (expiry.getTime() < Date.now()) {
          lineError.expiryDate = "Expiry must be in the future";
        }
      }
      if (Object.keys(lineError).length > 0) nextLineErrors[line.sku] = lineError;
    }

    if (!anyReceived && Object.keys(nextLineErrors).length === 0) {
      setErrors((prev) => ({ ...prev, lines: "Enter at least one received quantity above 0" }));
      return;
    }

    if (Object.keys(nextLineErrors).length > 0) {
      setLineErrors(nextLineErrors);
      return;
    }

    setErrors({});
    setLineErrors({});
    setSubmitting(true);
    try {
      // TODO: replace with receiptsApi.create once the inventory API exists.
      await new Promise((resolve) => setTimeout(resolve, 400));
      const submissionLines: ReceiptSubmissionLine[] = lines.map((line) => {
        const poLine = selectedPo.lines.find((l) => l.sku === line.sku)!;
        return {
          ...poLine,
          receivedNow: Number(line.receiveQty.trim()),
          batchNumber: line.batchNumber.trim(),
          expiryDate: line.expiryDate,
        };
      });
      onRecord({
        poNumber: selectedPo.poNumber,
        supplier: selectedPo.supplier,
        supplierContact: selectedPo.supplierContact,
        warehouse,
        expectedDate: selectedPo.expectedDate,
        lines: submissionLines,
        notes: notes.trim(),
      });
      handleClose(false);
    } catch {
      toast.error("Could not record the receipt. Try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Record Receipt</DialogTitle>
          <DialogDescription>
            Select a purchase order and record the received quantities against it.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Purchase Order" error={errors.poNumber}>
              <Select value={poNumber} onValueChange={handlePoChange}>
                <SelectTrigger aria-label="Purchase order" className="w-full border-border text-[12.5px] min-[1440px]:text-[13.5px]">
                  <SelectValue placeholder="Search and select a PO" />
                </SelectTrigger>
                <SelectContent>
                  {purchaseOrders.map((po) => (
                    <SelectItem key={po.poNumber} value={po.poNumber}>
                      {po.poNumber} — {po.supplier}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>

            <FormField label="Supplier (auto-populated)">
              <Input
                value={selectedPo ? `${selectedPo.supplier} · ${selectedPo.supplierContact}` : ""}
                placeholder="Select a purchase order first"
                readOnly
                className="h-9 border-border bg-surface-subtle text-[12.5px] text-text-2 min-[1440px]:text-[13.5px]"
                aria-readonly="true"
              />
            </FormField>
          </div>

          <FormField label="Warehouse" error={errors.warehouse}>
            <Select value={warehouse} onValueChange={(value) => {
              setWarehouse(value ?? "");
              setErrors((prev) => ({ ...prev, warehouse: undefined }));
            }}>
              <SelectTrigger aria-label="Destination warehouse" className="w-full border-border text-[12.5px] min-[1440px]:text-[13.5px]">
                <SelectValue placeholder="Select destination" />
              </SelectTrigger>
              <SelectContent>
                {RECEIPT_WAREHOUSES.map((wh) => (
                  <SelectItem key={wh} value={wh}>
                    {wh}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>

          {lines.length > 0 && (
            <div className="flex flex-col gap-2">
              <span className="text-[12.5px] font-semibold text-text min-[1440px]:text-[13.5px]">
                Product lines
              </span>
              <div className="overflow-x-auto rounded-[10px] border border-border">
                <table className="w-full min-w-[620px] whitespace-nowrap">
                  <thead>
                    <tr className="bg-surface-subtle text-left text-[11px] font-semibold text-text-2">
                      <th className="px-3 py-2">Product</th>
                      <th className="px-3 py-2 text-right">Expected</th>
                      <th className="w-[100px] px-3 py-2">Receive Qty</th>
                      <th className="w-[130px] px-3 py-2">Batch / Lot</th>
                      <th className="w-[150px] px-3 py-2">Expiry Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lines.map((line) => (
                      <tr key={line.sku} className="border-t border-border align-top">
                        <td className="px-3 py-2.5">
                          <span className="flex flex-col">
                            <span className="truncate text-[12.5px] font-semibold text-text">{line.name}</span>
                            <span className="text-[11px] tabular-nums text-text-4">{line.sku}</span>
                          </span>
                        </td>
                        <td className="px-3 py-2.5 text-right text-[12.5px] font-medium tabular-nums text-text-2">
                          {line.remainingQty}{" "}
                          <span className="font-normal text-text-4">{line.unit}</span>
                        </td>
                        <td className="px-3 py-2.5">
                          <Input
                            type="number"
                            min={0}
                            max={line.remainingQty}
                            step={1}
                            placeholder="0"
                            value={line.receiveQty}
                            onChange={(e) => setLine(line.sku, { receiveQty: e.target.value })}
                            aria-label={`Received quantity for ${line.name}`}
                            aria-invalid={!!lineErrors[line.sku]?.receiveQty}
                            className="h-8 border-border text-[12.5px]"
                          />
                          {lineErrors[line.sku]?.receiveQty && (
                            <p className="mt-1 text-[11px] font-medium whitespace-normal text-red">
                              {lineErrors[line.sku].receiveQty}
                            </p>
                          )}
                        </td>
                        <td className="px-3 py-2.5">
                          <Input
                            type="text"
                            placeholder="e.g. LOT-2419"
                            value={line.batchNumber}
                            onChange={(e) => setLine(line.sku, { batchNumber: e.target.value })}
                            aria-label={`Batch or lot number for ${line.name}`}
                            className="h-8 border-border text-[12.5px]"
                          />
                        </td>
                        <td className="px-3 py-2.5">
                          <Input
                            type="date"
                            value={line.expiryDate}
                            onChange={(e) => setLine(line.sku, { expiryDate: e.target.value })}
                            aria-label={`Expiry date for ${line.name}`}
                            aria-invalid={!!lineErrors[line.sku]?.expiryDate}
                            className="h-8 border-border text-[12.5px]"
                          />
                          {lineErrors[line.sku]?.expiryDate && (
                            <p className="mt-1 text-[11px] font-medium whitespace-normal text-red">
                              {lineErrors[line.sku].expiryDate}
                            </p>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {errors.lines && (
                <p className="text-[11.5px] font-medium text-red">{errors.lines}</p>
              )}
            </div>
          )}

          <FormField label="Notes / Remarks (optional)">
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Two cartons arrived dented; contents verified intact."
              rows={3}
              className="w-full resize-none rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50"
            />
          </FormField>

          <DialogFooter>
            <Button variant="outline" type="button" onClick={() => handleClose(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting || !selectedPo}>
              {submitting ? "Recording..." : "Submit Receipt"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
