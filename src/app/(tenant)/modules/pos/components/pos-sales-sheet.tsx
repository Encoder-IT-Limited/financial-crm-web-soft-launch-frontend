"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { fmtMoney, fmtDateTime } from "@/lib/format";
import type { PosSale } from "../api/pos.service";

function tone(status: string) {
  if (status === "COMPLETED") return "green" as const;
  if (status === "VOIDED" || status === "REFUNDED") return "red" as const;
  if (status === "PARTIALLY_REFUNDED" || status === "EXCHANGED") return "amber" as const;
  return "neutral" as const;
}

export function PosSalesSheet({
  open,
  sales,
  onOpenChange,
  onRefund,
  onVoid,
  canRefund,
}: {
  open: boolean;
  sales: PosSale[];
  onOpenChange: (open: boolean) => void;
  onRefund: (sale: PosSale) => void;
  onVoid: (sale: PosSale) => void;
  canRefund: boolean;
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Today’s tickets</SheetTitle>
        </SheetHeader>
        <div className="flex-1 overflow-y-auto px-4 pb-6">
          {sales.length === 0 ? (
            <p className="py-10 text-center text-[13px] text-text-3">No sales on this session yet.</p>
          ) : (
            <ul className="space-y-2">
              {sales.map((sale) => {
                const refundable = sale.status === "COMPLETED" || sale.status === "PARTIALLY_REFUNDED";
                const voidable = sale.status === "COMPLETED";
                return (
                  <li key={sale.id} className="rounded-xl border border-border p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-mono text-[13px] font-bold">{sale.transactionNumber}</p>
                        <p className="text-[11px] text-text-4">{fmtDateTime(sale.createdAt)}</p>
                      </div>
                      <Badge tone={tone(sale.status)}>{sale.status.replaceAll("_", " ")}</Badge>
                    </div>
                    <p className="mt-1 text-[15px] font-extrabold tabular-nums">{fmtMoney(Number(sale.total))}</p>
                    {canRefund && (refundable || voidable) && (
                      <div className="mt-2 flex gap-1.5">
                        {refundable && (
                          <Button size="sm" variant="outline" onClick={() => onRefund(sale)}>
                            Refund
                          </Button>
                        )}
                        {voidable && (
                          <Button size="sm" variant="ghost" className="text-red" onClick={() => onVoid(sale)}>
                            Void
                          </Button>
                        )}
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
