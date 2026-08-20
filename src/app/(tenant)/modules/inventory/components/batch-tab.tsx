"use client";

import { useMemo, useState } from "react";
import { CalendarClock, FlaskConical, Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";
import { fmtDate, fmtQty } from "@/lib/format";
import type { Product } from "../types";
import { BATCH_HEALTH_LABELS, BATCH_HEALTH_TONES, batchHealth } from "../lib/stock";
import { inventoryApi } from "../api/inventory.service";
import { useInventoryStore } from "../store/inventory-store";
import { FefoVisualizer, WarehouseCell } from "./fefo-visualizer";

export function BatchTab({ product }: { product: Product }) {
  const batches = useInventoryStore((state) => state.batches);
  const warehouses = useInventoryStore((state) => state.warehouses);
  const [addOpen, setAddOpen] = useState(false);

  const own = useMemo(
    () => batches.filter((b) => b.productId === product.id).sort((a, b) => (a.expiryDate ?? "9999").localeCompare(b.expiryDate ?? "9999")),
    [batches, product.id]
  );

  const warehouseName = (id: string) => warehouses.find((w) => w.id === id)?.name ?? "—";

  return (
    <div className="flex flex-col gap-4">
      <Card className="gap-0 p-0">
        <div className="flex items-center justify-between gap-2 border-b border-border px-5 py-3">
          <div className="flex items-center gap-2">
            <FlaskConical className="size-4 text-blue" />
            <div className="text-sm font-bold text-text">FEFO / FIFO Visualizer</div>
          </div>
          <span className="hidden text-[10.5px] font-bold text-text-4 sm:block">
            Nearest-expiry batch per warehouse — consume first
          </span>
        </div>
        <div className="p-4">
          <FefoVisualizer product={product} />
        </div>
      </Card>

      <Card className="gap-0 p-0">
        <div className="flex items-center justify-between border-b border-border px-5 py-3">
          <div className="text-sm font-bold text-text">Batches &amp; lots</div>
          <Button variant="outline" size="xs" onClick={() => setAddOpen(true)}>
            <Plus /> Add Batch
          </Button>
        </div>

        {own.length === 0 ? (
          <div className="px-5 py-10 text-center text-[12.5px] text-text-4">
            No batches recorded. Enable batch tracking on the product to manage lots by expiry.
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden overflow-x-auto lg:block">
              <table className="w-full text-left">
                <thead className="bg-surface-subtle text-[10.5px] font-bold uppercase tracking-wide text-text-3">
                  <tr>
                    <th className="px-5 py-2.5">Batch #</th>
                    <th className="px-3 py-2.5">Warehouse</th>
                    <th className="px-3 py-2.5">Expiry Date</th>
                    <th className="px-3 py-2.5 text-right">Quantity</th>
                    <th className="px-3 py-2.5">Status</th>
                    <th className="px-5 py-2.5">Receipt Ref</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {own.map((b) => {
                    const health = batchHealth(b);
                    return (
                      <tr key={b.id} className="transition-colors hover:bg-surface-subtle">
                        <td className="px-5 py-3">
                          <span className="text-[12.5px] font-bold text-text">{b.batchNumber}</span>
                        </td>
                        <td className="px-3 py-3">
                          <WarehouseCell wh={warehouses.find((w) => w.id === b.warehouseId)} />
                        </td>
                        <td className="px-3 py-3 text-[12.5px] text-text-2">{fmtDate(b.expiryDate)}</td>
                        <td className="px-3 py-3 text-right text-[12.5px] font-bold tabular-nums text-text">
                          {fmtQty(b.quantity)}
                          {b.quarantineQuantity > 0 && (
                            <span className="ml-1.5 text-[10.5px] font-semibold text-amber">({fmtQty(b.quarantineQuantity)} quarantined)</span>
                          )}
                        </td>
                        <td className="px-3 py-3">
                          <Badge tone={BATCH_HEALTH_TONES[health]}>{BATCH_HEALTH_LABELS[health]}</Badge>
                        </td>
                        <td className="px-5 py-3 text-[11.5px] text-text-3">{b.receiptRef}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile stacked cards */}
            <div className="flex flex-col divide-y divide-border lg:hidden">
              {own.map((b) => {
                const health = batchHealth(b);
                return (
                  <div key={b.id} className="flex flex-col gap-2 p-4">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[13px] font-bold text-text">{b.batchNumber}</span>
                      <Badge tone={BATCH_HEALTH_TONES[health]}>{BATCH_HEALTH_LABELS[health]}</Badge>
                    </div>
                    <div className="text-[12px] text-text-2">{warehouseName(b.warehouseId)}</div>
                    <div className="flex items-center justify-between text-[12.5px]">
                      <span className="text-text-4">
                        <CalendarClock className="mr-1 inline size-3.5" />
                        {fmtDate(b.expiryDate)}
                      </span>
                      <span className="font-bold tabular-nums text-text">{fmtQty(b.quantity)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </Card>

      {addOpen && <AddBatchDialog product={product} open={addOpen} onOpenChange={setAddOpen} />}
    </div>
  );
}

function AddBatchDialog({
  product,
  open,
  onOpenChange,
}: {
  product: Product;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const warehouses = useInventoryStore((state) => state.warehouses);
  const [warehouseId, setWarehouseId] = useState("");
  const [batchNumber, setBatchNumber] = useState("");
  const [quantity, setQuantity] = useState("10");
  const [expiryDate, setExpiryDate] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  // Mounted per-open by the parent — initial state is always fresh

  async function handleSave() {
    const errs: Record<string, string> = {};
    if (!warehouseId) errs.warehouseId = "Select a warehouse";
    if (!batchNumber.trim()) errs.batchNumber = "Batch number is required";
    if (!(Number(quantity) > 0)) errs.quantity = "Quantity must be greater than 0";
    if (product.trackExpiry && !expiryDate) errs.expiryDate = "Expiry is required for FEFO-tracked products";
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    setSaving(true);
    try {
      await inventoryApi.addBatch(product.id, warehouseId, batchNumber, Number(quantity), expiryDate || null);
      toast.success(`Batch ${batchNumber} added to ${warehouses.find((w) => w.id === warehouseId)?.name}`);
      onOpenChange(false);
    } catch {
      toast.error("Failed to add batch");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FlaskConical className="size-4 text-blue" />
            Add Batch / Lot
          </DialogTitle>
          <DialogDescription className="text-[11.5px] text-text-3">
            {product.name}
            {product.trackExpiry ? " — expiry tracked, FEFO applies" : " — expiry not tracked"}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-3.5">
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <span className="text-[11px] font-semibold text-text-2">Warehouse</span>
              <Select
                value={warehouseId}
                onValueChange={(v) => {
                  setWarehouseId(v ?? "");
                  setErrors({ ...errors, warehouseId: "" });
                }}
              >
                <SelectTrigger className={cn("w-full", errors.warehouseId && "border-red")}>
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  {warehouses.map((wh) => (
                    <SelectItem key={wh.id} value={wh.id}>
                      {wh.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.warehouseId && <p className="text-[10.5px] text-red">{errors.warehouseId}</p>}
            </div>
            <div className="flex flex-col gap-1.5">
              <span className="text-[11px] font-semibold text-text-2">Quantity</span>
              <Input
                type="number"
                min={1}
                value={quantity}
                onChange={(e) => {
                  setQuantity(e.target.value);
                  setErrors({ ...errors, quantity: "" });
                }}
                aria-invalid={!!errors.quantity}
                className={cn(errors.quantity && "border-red")}
              />
              {errors.quantity && <p className="text-[10.5px] text-red">{errors.quantity}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <span className="text-[11px] font-semibold text-text-2">Batch number</span>
              <Input
                value={batchNumber}
                onChange={(e) => {
                  setBatchNumber(e.target.value);
                  setErrors({ ...errors, batchNumber: "" });
                }}
                placeholder="e.g. B-2026-0915"
                aria-invalid={!!errors.batchNumber}
                className={cn(errors.batchNumber && "border-red")}
              />
              {errors.batchNumber && <p className="text-[10.5px] text-red">{errors.batchNumber}</p>}
            </div>
            <div className="flex flex-col gap-1.5">
              <span className="text-[11px] font-semibold text-text-2">
                Expiry date {product.trackExpiry ? "(required)" : "(optional)"}
              </span>
              <Input
                type="date"
                value={expiryDate}
                onChange={(e) => {
                  setExpiryDate(e.target.value);
                  setErrors({ ...errors, expiryDate: "" });
                }}
                aria-invalid={!!errors.expiryDate}
                className={cn(errors.expiryDate && "border-red")}
              />
              {errors.expiryDate && <p className="text-[10.5px] text-red">{errors.expiryDate}</p>}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Adding..." : "Add Batch"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}