"use client";

import { useMemo, useState } from "react";
import { SlidersHorizontal } from "lucide-react";
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
import { ADJUSTMENT_TYPE_LABELS, REASON_CODES, type AdjustmentType } from "../types";
import { stockLevelFor } from "../lib/stock";
import { inventoryApi } from "../api/inventory.service";
import { useInventoryStore } from "../store/inventory-store";

const ADJUSTMENT_TYPES: AdjustmentType[] = ["add", "remove", "damaged", "expired"];

export function AdjustmentDialog({
  productId,
  productName,
  warehouseId,
  warehouseName,
  open,
  onOpenChange,
}: {
  productId: string;
  productName: string;
  warehouseId: string;
  warehouseName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const product = useInventoryStore((state) => state.products.find((p) => p.id === productId));
  const stockLevels = useInventoryStore((state) => state.stockLevels);
  const [type, setType] = useState<AdjustmentType>("add");
  const [reasonCode, setReasonCode] = useState(REASON_CODES[0].code);
  const [quantity, setQuantity] = useState("10");
  const [notes, setNotes] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const available = stockLevelFor(productId, warehouseId, stockLevels)?.quantity ?? 0;
  const reasons = useMemo(() => REASON_CODES.filter((r) => r.type === type), [type]);

  if (!product) return null;

  const qty = Number(quantity) || 0;
  const sign = type === "add" ? 1 : -1;
  const preview = available + sign * qty;

  function handleSave() {
    const errs: Record<string, string> = {};
    if (!qty || qty <= 0) errs.quantity = "Quantity must be greater than 0";
    if (!reasonCode) errs.reason = "Select a reason";
    if (type !== "add" && available - qty < 0) errs.quantity = `Only ${fmtQty(available)} available — remove more than on hand pushes stock negative`;
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    setSaving(true);
    inventoryApi
      .adjustStock(productId, warehouseId, type, qty, reasonCode, notes.trim() || undefined)
      .then(() => {
        const label = ADJUSTMENT_TYPE_LABELS[type];
        toast.success(`${label} posted — ${productName} is now ${fmtQty(preview)} at ${warehouseName}`);
        onOpenChange(false);
      })
      .catch(() => toast.error("Adjustment failed"))
      .finally(() => setSaving(false));
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <SlidersHorizontal className="size-4 text-blue" />
            Quick Adjustment
          </DialogTitle>
          <DialogDescription className="text-[11.5px] text-text-3">
            {productName} · {warehouseName} · on hand {fmtQty(available)}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-3.5">
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <span className="text-[11px] font-semibold text-text-2">Type</span>
              <Select
                value={type}
                onValueChange={(v) => {
                  const next = (v ?? "add") as AdjustmentType;
                  setType(next);
                  setReasonCode(REASON_CODES.find((r) => r.type === next)?.code ?? REASON_CODES[0].code);
                  setErrors({});
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ADJUSTMENT_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {ADJUSTMENT_TYPE_LABELS[t]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
            <span className="text-[11px] font-semibold text-text-2">Reason</span>
            <Select
              value={reasonCode}
              onValueChange={(v) => {
                setReasonCode(v ?? REASON_CODES[0].code);
                setErrors({ ...errors, reason: "" });
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {reasons.map((r) => (
                  <SelectItem key={r.code} value={r.code}>
                    {r.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.reason && <p className="text-[10.5px] text-red">{errors.reason}</p>}
          </div>

          <div className="flex flex-col gap-1.5">
            <span className="text-[11px] font-semibold text-text-2">Notes (optional)</span>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Found during Monday cycle count"
              className="w-full rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            />
          </div>

          <div className="rounded-lg border border-blue-t bg-blue-l px-3 py-2.5 text-[11.5px] text-blue">
            After posting: on hand will be{" "}
            <strong className={cn(preview < 0 ? "text-red" : preview === 0 ? "text-red" : "text-green")}>
              {fmtQty(preview)}
            </strong>
            {(type === "damaged" || type === "expired") && " — damaged counter increases, FEFO/FIFO batch gets quarantined."}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Posting..." : "Post Adjustment"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}