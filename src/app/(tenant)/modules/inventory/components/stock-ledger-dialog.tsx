"use client";

import { useMemo } from "react";
import { ArrowDownLeft, ArrowUpRight, FileSearch } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { fmtDateTime, fmtQty } from "@/lib/format";
import { MOVEMENT_TYPE_LABELS } from "../types";
import { useInventoryStore } from "../store/inventory-store";

/** Per-product + per-warehouse stock ledger (read-only movement history). */
export function StockLedgerDialog({
  productName,
  warehouseName,
  productId,
  warehouseId,
  open,
  onOpenChange,
}: {
  productName: string;
  warehouseName: string;
  productId: string;
  warehouseId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const movements = useInventoryStore((state) => state.movements);

  const rows = useMemo(
    () =>
      movements
        .filter((m) => m.productId === productId && m.warehouseId === warehouseId)
        .sort((a, b) => b.at.localeCompare(a.at)),
    [movements, productId, warehouseId]
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSearch className="size-4 text-blue" />
            Stock Ledger
          </DialogTitle>
          <DialogDescription className="text-[11.5px] text-text-3">
            {productName} · {warehouseName}
          </DialogDescription>
        </DialogHeader>

        {rows.length === 0 ? (
          <div className="py-10 text-center text-[12.5px] text-text-4">No movements recorded for this combination.</div>
        ) : (
          <div className="max-h-96 overflow-y-auto rounded-lg border border-border">
            <table className="w-full text-left">
              <thead className="bg-surface-subtle text-[10.5px] font-bold uppercase tracking-wide text-text-3">
                <tr>
                  <th className="px-4 py-2">Type</th>
                  <th className="px-4 py-2">Reference</th>
                  <th className="px-4 py-2 text-right">Qty</th>
                  <th className="px-4 py-2">When</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {rows.map((m) => (
                  <tr key={m.id} className="hover:bg-surface-subtle">
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-1.5 text-[12.5px] font-semibold text-text">
                        {m.quantity > 0 ? (
                          <ArrowDownLeft className="size-3.5 text-green" />
                        ) : (
                          <ArrowUpRight className="size-3.5 text-red" />
                        )}
                        {MOVEMENT_TYPE_LABELS[m.type]}
                      </div>
                      {m.notes && <div className="mt-0.5 text-[10.5px] text-text-4">{m.notes}</div>}
                    </td>
                    <td className="px-4 py-2.5 text-[11.5px] text-text-2">{m.refNumber}</td>
                    <td className={cn("px-4 py-2.5 text-right text-[12.5px] font-bold tabular-nums", m.quantity > 0 ? "text-green" : "text-red")}>
                      {m.quantity > 0 ? "+" : "−"}
                      {fmtQty(Math.abs(m.quantity))}
                    </td>
                    <td className="px-4 py-2.5 text-[11px] text-text-3">{fmtDateTime(m.at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}