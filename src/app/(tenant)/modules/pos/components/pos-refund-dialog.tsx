"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { fmtMoney } from "@/lib/format";
import type { PosSale, RefundSaleItem } from "../api/pos.service";

export function PosRefundDialog({
  open,
  sale,
  pending,
  onOpenChange,
  onConfirm,
}: {
  open: boolean;
  sale: PosSale | null;
  pending?: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (items: RefundSaleItem[], reason: string) => void;
}) {
  const [selected, setSelected] = useState<Record<string, boolean>>(() => {
    const next: Record<string, boolean> = {};
    for (const item of sale?.items ?? []) next[item.productId] = true;
    return next;
  });
  const [damaged, setDamaged] = useState<Record<string, boolean>>({});

  const items = useMemo(() => {
    if (!sale?.items) return [];
    return sale.items
      .filter((i) => selected[i.productId])
      .map((i) => ({
        productId: i.productId,
        quantity: Number(i.quantity),
        unitPrice: Number(i.unitPrice),
        condition: (damaged[i.productId] ? "DAMAGED" : "SELLABLE") as RefundSaleItem["condition"],
      }));
  }, [sale, selected, damaged]);

  const amount = items.reduce((s, i) => s + i.quantity * i.unitPrice, 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[460px]">
        <DialogHeader>
          <DialogTitle>Refund {sale?.transactionNumber}</DialogTitle>
          <DialogDescription>
            Damaged items go to quarantine — they will not return to sellable stock.
          </DialogDescription>
        </DialogHeader>
        <div className="max-h-[280px] space-y-2 overflow-y-auto">
          {sale?.items?.map((item) => (
            <label
              key={item.id}
              className="flex items-start gap-3 rounded-xl border border-border p-3 text-[13px]"
            >
              <Checkbox
                checked={Boolean(selected[item.productId])}
                onCheckedChange={(v) => setSelected((s) => ({ ...s, [item.productId]: Boolean(v) }))}
              />
              <span className="min-w-0 flex-1">
                <span className="block font-semibold text-text">
                  {item.quantity} × {fmtMoney(Number(item.unitPrice))}
                </span>
                <span className="text-[11px] text-text-4">{item.productId.slice(0, 8)}</span>
              </span>
              <button
                type="button"
                className={`rounded-full px-2 py-0.5 text-[10.5px] font-bold ${
                  damaged[item.productId] ? "bg-red-l text-red" : "bg-green-l text-green"
                }`}
                onClick={() => setDamaged((d) => ({ ...d, [item.productId]: !d[item.productId] }))}
              >
                {damaged[item.productId] ? "Damaged" : "Sellable"}
              </button>
            </label>
          ))}
        </div>
        <p className="text-[13px] font-bold text-text">Refund {fmtMoney(amount)}</p>
        <DialogFooter>
          <Button variant="outline" disabled={pending} onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            disabled={pending || items.length === 0}
            onClick={() => onConfirm(items, "Customer refund")}
          >
            {pending ? "Refunding…" : "Confirm refund"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
