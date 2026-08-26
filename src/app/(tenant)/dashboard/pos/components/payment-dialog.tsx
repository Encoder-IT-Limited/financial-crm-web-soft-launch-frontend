"use client";

import { useState } from "react";
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
import { fmtMoney } from "@/lib/format";
import { cn } from "@/lib/utils";
import { POS_PAYMENT_METHOD_LABELS, round2, type PosPayment, type PosPaymentMethod } from "../types";

/** Checkout — one or more payment methods (split tender). Cash overpaid
 * beyond the total shows a change-due figure, same as a real register
 * telling the cashier what to hand back. */
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
  const [rows, setRows] = useState<{ method: PosPaymentMethod; amount: string }[]>([{ method: "cash", amount: String(total) }]);

  function reset() {
    setRows([{ method: "cash", amount: String(total) }]);
  }

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

  return (
    <Dialog open={open} onOpenChange={(next) => { onOpenChange(next); if (next) reset(); }}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Payment</DialogTitle>
          <DialogDescription>Total due {fmtMoney(total)}</DialogDescription>
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
            ? `Remaining: ${fmtMoney(remaining)}`
            : hasCash && paid > total + 0.005
              ? `Change due: ${fmtMoney(paid - total)}`
              : "Fully covered"}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            disabled={!canConfirm || confirming}
            onClick={() =>
              onConfirm(
                rows.map((r) => ({
                  method: r.method,
                  // A cash overpayment is recorded as exactly the amount owed —
                  // the excess is change handed back, not part of the sale.
                  amount: r.method === "cash" && hasCash && paid > total ? round2(Number(r.amount) - (paid - total)) : round2(Number(r.amount) || 0),
                }))
              )
            }
          >
            {confirming ? "Processing..." : "Confirm Payment"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
