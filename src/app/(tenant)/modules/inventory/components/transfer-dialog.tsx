"use client";

import { useMemo, useState } from "react";
import { ArrowLeftRight, PackageCheck, Send, XCircle } from "lucide-react";
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
import { fmtQty } from "@/lib/format";
import type { Transfer, Warehouse } from "../types";
import { stockLevelFor, warehouseName } from "../lib/stock";
import { inventoryApi } from "../api/inventory.service";
import { useInventoryStore } from "../store/inventory-store";

export const TRANSFER_STATUS_LABELS: Record<Transfer["status"], string> = {
  requested: "Requested",
  approved: "Approved",
  dispatched: "Dispatched",
  received: "Received",
  rejected: "Rejected",
  cancelled: "Cancelled",
};

export const TRANSFER_STATUS_TONES: Record<Transfer["status"], "blue" | "amber" | "green" | "red" | "neutral"> = {
  requested: "blue",
  approved: "blue",
  dispatched: "amber",
  received: "green",
  rejected: "red",
  cancelled: "neutral",
};

export function TransferDialog({
  productId,
  productName,
  fromWarehouseId,
  open,
  onOpenChange,
  warehouses,
}: {
  productId: string;
  productName: string;
  fromWarehouseId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  warehouses: Warehouse[];
}) {
  const stockLevels = useInventoryStore((state) => state.stockLevels);
  const transfers = useInventoryStore((state) => state.transfers);

  const [toWarehouseId, setToWarehouseId] = useState("");
  const [quantity, setQuantity] = useState("10");
  const [notes, setNotes] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<string | null>(null);

  // Single active transfer for this product + source warehouse
  const pending = useMemo(
    () =>
      transfers.find(
        (t) =>
          t.fromWarehouseId === fromWarehouseId &&
          t.items[0]?.productId === productId &&
          (t.status === "requested" || t.status === "dispatched")
      ) ?? null,
    [transfers, fromWarehouseId, productId]
  );

  // Mounted per-open by the parent — initial state is always fresh
  const level = stockLevelFor(productId, fromWarehouseId, stockLevels);
  const available = level?.quantity ?? 0;
  const targets = warehouses.filter((w) => w.id !== fromWarehouseId);
  const qty = Number(quantity) || 0;
  const preview = available - qty;

  async function handleCreate() {
    const errs: Record<string, string> = {};
    if (!toWarehouseId) errs.toWarehouseId = "Select a destination warehouse";
    if (!qty || qty <= 0) errs.quantity = "Quantity must be greater than 0";
    else if (qty > available) errs.quantity = `Only ${fmtQty(available)} available at source`;
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    setBusy("create");
    try {
      const created = await inventoryApi.createTransfer({
        productId,
        fromWarehouseId,
        toWarehouseId,
        quantity: qty,
        notes: notes.trim() || undefined,
      });
      if (!created) {
        toast.error("Not enough stock at the source warehouse");
        return;
      }
      toast.success(`${created.number} requested — ${productName} ${fmtQty(qty)} → ${warehouseName(warehouses, toWarehouseId)}`);
      onOpenChange(false);
    } finally {
      setBusy(null);
    }
  }

  async function handleDispatch() {
    if (!pending) return;
    setBusy("dispatch");
    try {
      await inventoryApi.dispatchTransfer(pending.id);
      toast.success(`${pending.number} dispatched — stock moved available → in-transit`);
    } finally {
      setBusy(null);
    }
  }

  async function handleReceive() {
    if (!pending) return;
    setBusy("receive");
    try {
      await inventoryApi.receiveTransfer(pending.id);
      toast.success(`${pending.number} received — batches moved via FEFO/FIFO`);
    } finally {
      setBusy(null);
    }
  }

  async function handleCancel() {
    if (!pending) return;
    setBusy("cancel");
    try {
      await inventoryApi.cancelTransfer(pending.id);
      toast.success(`${pending.number} cancelled`);
    } finally {
      setBusy(null);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ArrowLeftRight className="size-4 text-blue" />
            Initiate Transfer
          </DialogTitle>
          <DialogDescription className="text-[11.5px] text-text-3">
            {productName} · source: {warehouseName(warehouses, fromWarehouseId)} · available {fmtQty(available)}
          </DialogDescription>
        </DialogHeader>

        {pending ? (
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between rounded-lg border border-border bg-surface-subtle px-3 py-2.5">
              <div className="flex flex-col">
                <span className="text-[12.5px] font-bold text-text">{pending.number}</span>
                <span className="text-[11px] text-text-3">
                  {warehouseName(warehouses, pending.fromWarehouseId)} → {warehouseName(warehouses, pending.toWarehouseId)} ·{" "}
                  {fmtQty(pending.items[0]?.quantity ?? 0)} pcs
                </span>
              </div>
              <Badge tone={TRANSFER_STATUS_TONES[pending.status]}>{TRANSFER_STATUS_LABELS[pending.status]}</Badge>
            </div>

            <div className="rounded-lg border border-blue-t bg-blue-l px-3 py-2.5 text-[11.5px] leading-relaxed text-blue">
              {pending.status === "requested"
                ? "Dispatch to move stock out of Available at the source and into In-Transit at the destination."
                : "Receive to land the stock — batches are moved FEFO/FIFO from the source batch to the destination."}
            </div>

            <div className="flex flex-wrap gap-2">
              {pending.status === "requested" && (
                <Button size="sm" onClick={handleDispatch} disabled={busy !== null} className="flex-1">
                  <Send /> {busy === "dispatch" ? "Dispatching..." : "Dispatch"}
                </Button>
              )}
              {pending.status === "dispatched" && (
                <Button size="sm" onClick={handleReceive} disabled={busy !== null} className="flex-1">
                  <PackageCheck /> {busy === "receive" ? "Receiving..." : "Mark Received"}
                </Button>
              )}
              <Button size="sm" variant="ghost" className="text-red" onClick={handleCancel} disabled={busy !== null}>
                <XCircle /> Cancel transfer
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-3.5">
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <span className="text-[11px] font-semibold text-text-2">To warehouse</span>
                <Select
                  value={toWarehouseId}
                  onValueChange={(v) => {
                    setToWarehouseId(v ?? "");
                    setErrors({ ...errors, toWarehouseId: "" });
                  }}
                >
                  <SelectTrigger className={cn("w-full", errors.toWarehouseId && "border-red")}>
                    <SelectValue placeholder="Destination" />
                  </SelectTrigger>
                  <SelectContent>
                    {targets.map((wh) => (
                      <SelectItem key={wh.id} value={wh.id}>
                        {wh.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.toWarehouseId && <p className="text-[10.5px] text-red">{errors.toWarehouseId}</p>}
              </div>
              <div className="flex flex-col gap-1.5">
                <span className="text-[11px] font-semibold text-text-2">Quantity</span>
                <Input
                  type="number"
                  min={0}
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

            <div className="flex flex-col gap-1.5">
              <span className="text-[11px] font-semibold text-text-2">Notes (optional)</span>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Weekend floor replenishment"
                className="w-full rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              />
            </div>

            <div className="rounded-lg border border-blue-t bg-blue-l px-3 py-2.5 text-[11.5px] text-blue">
              On dispatch: source drops to <strong>{fmtQty(preview)}</strong>, destination gains {fmtQty(qty)} in-transit.
              A Transfer record is created (Requested → Dispatch → Receive).
            </div>
          </div>
        )}

        {!pending && (
          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={busy !== null}>
              <ArrowLeftRight /> {busy === "create" ? "Requesting..." : "Request Transfer"}
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}