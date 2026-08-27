"use client";

import { useEffect, useState } from "react";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { POS_PAYMENT_METHOD_LABELS, round2, type PosPayment, type PosPaymentMethod } from "../types";
import { useFmtMoney } from "../use-fmt-money";

/** Checkout — one or more payment methods (split tender). Cash overpaid
 * beyond the total shows a change-due figure; the excess is sent as
 * tenderedAmount so the backend can record what was handed over. */
export function PaymentDialog({
  open,
  onOpenChange,
  total,
  onConfirm,
  confirming,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  total: number;
  onConfirm: (payments: PosPayment[]) => void;
  confirming: boolean;
}) {
  const money = useFmtMoney();
  const [rows, setRows] = useState<{ method: PosPaymentMethod; amount: string }[]>([{ method: "cash", amount: String(total) }]);

  useEffect(() => {
    if (open) setRows([{ method: "cash", amount: String(total) }]);
  }, [open, total]);

  const paid = round2(rows.reduce((sum, r) => sum + (Number(r.amount) || 0), 0));
  const remaining = round2(total - paid);
  const hasCash = rows.some((r) => r.method === "cash");
  const canConfirm = paid >= total - 0.005 && rows.every((r) => Number(r.amount) > 0);

  function updateRow(index: number, patch: Partial<{ method: PosPaymentMethod; amount: string }>) {
    setRows(rows.map((r, i) => (i === index ? { ...r, ...patch } : r)));
  }

  function addRow() {
    setRows([...rows, { method: "card", amount: remaining > 0 ? String(remaining) : "" }]);
  }

  function removeRow(index: number) {
    setRows(rows.filter((_, i) => i !== index));
  }

  function toPayments(): PosPayment[] {
    const over = hasCash && paid > total + 0.005 ? round2(paid - total) : 0;
    return rows.map((r) => {
      const typed = round2(Number(r.amount) || 0);
      if (r.method === "cash" && over > 0) {
        return { method: r.method, amount: round2(typed - over), tenderedAmount: typed };
      }
      return { method: r.method, amount: typed };
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Payment</DialogTitle>
          <DialogDescription>Total due {money(total)}</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-2">
          {rows.map((row, i) => (
            <div key={i} className="flex items-center gap-2">
              <Select value={row.method} onValueChange={(v) => updateRow(i, { method: (v ?? row.method) as PosPaymentMethod })}>
                <SelectTrigger size="sm" className="w-36">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(POS_PAYMENT_METHOD_LABELS) as PosPaymentMethod[]).map((method) => (
                    <SelectItem key={method} value={method}>
                      {POS_PAYMENT_METHOD_LABELS[method]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                type="number"
                min={0}
                step="any"
                value={row.amount}
                onChange={(e) => updateRow(i, { amount: e.target.value })}
                className="flex-1"
              />
              {rows.length > 1 && (
                <Button variant="ghost" size="icon-sm" onClick={() => removeRow(i)} aria-label="Remove payment">
                  <X />
                </Button>
              )}
            </div>
          ))}

          <Button variant="outline" size="sm" onClick={addRow}>
            <Plus /> Split payment
          </Button>
        </div>

        <div className={cn("text-[13px] font-semibold", remaining > 0.005 ? "text-amber" : "text-green")}>
          {remaining > 0.005
            ? `Remaining: ${money(remaining)}`
            : hasCash && paid > total + 0.005
              ? `Change due: ${money(paid - total)}`
              : "Fully covered"}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button disabled={!canConfirm || confirming} onClick={() => onConfirm(toPayments())}>
            {confirming ? "Processing..." : "Confirm Payment"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
