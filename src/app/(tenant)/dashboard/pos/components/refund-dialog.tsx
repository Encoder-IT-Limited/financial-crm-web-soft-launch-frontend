"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
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
import { toast } from "@/lib/toast";
import { fmtMoney } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { PosSale, RefundLineCondition, RefundLineInput } from "../types";
import { saleRefundedAmount, type PosRefund } from "../types";
import { posSalesApi } from "../api/sales.service";
import { ManagerPinDialog } from "./manager-pin-dialog";

/** Refund/return — always manager-PIN-gated (client-confirmed rule).
 * Per line: how many units are coming back, and whether they're
 * sellable (restocked) or damaged (flagged only, per Key Decision #6). */
export function RefundDialog({
  sale,
  refunds,
  open,
  onOpenChange,
}: {
  sale: PosSale;
  refunds: PosRefund[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const queryClient = useQueryClient();
  const alreadyRefunded = saleRefundedAmount(sale.id, refunds);
  const [quantities, setQuantities] = useState<Record<string, string>>({});
  const [conditions, setConditions] = useState<Record<string, RefundLineCondition>>({});
  const [reason, setReason] = useState("");
  const [pinOpen, setPinOpen] = useState(false);

  function reset() {
    setQuantities({});
    setConditions({});
    setReason("");
  }

  const selectedLines: RefundLineInput[] = sale.lines
    .map((l) => ({
      productId: l.productId,
      quantity: Math.min(Number(quantities[l.productId]) || 0, l.quantity),
      condition: conditions[l.productId] ?? "sellable",
    }))
    .filter((l) => l.quantity > 0);

  const amount = selectedLines.reduce((sum, l) => {
    const saleLine = sale.lines.find((sl) => sl.productId === l.productId)!;
    return sum + saleLine.unitPrice * l.quantity * (1 + saleLine.taxRate / 100);
  }, 0);

  function submit(managerPin: string) {
    posSalesApi
      .refund({ saleId: sale.id, lines: selectedLines, reason, approvedBy: "Manager", managerPin })
      .then(() => {
        toast.success(`Refund of ${fmtMoney(amount)} recorded`);
        queryClient.invalidateQueries({ queryKey: ["pos-sale", sale.id] });
        queryClient.invalidateQueries({ queryKey: ["pos-refunds", sale.id] });
        queryClient.invalidateQueries({ queryKey: ["pos-sales"] });
        queryClient.invalidateQueries({ queryKey: ["pos-products"] });
        onOpenChange(false);
      })
      .catch((err: unknown) => {
        toast.error(err instanceof Error ? err.message : "Refund failed");
      });
  }

  return (
    <>
      <Dialog open={open} onOpenChange={(next) => { onOpenChange(next); if (next) reset(); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Refund / Return</DialogTitle>
            <DialogDescription>
              {sale.number} · {alreadyRefunded > 0 && `${fmtMoney(alreadyRefunded)} already refunded · `}select what&rsquo;s coming back
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-3">
            {sale.lines.map((line) => (
              <div key={line.productId} className="flex flex-col gap-1.5 rounded-lg border border-border p-3">
                <div className="flex items-center justify-between text-[12.5px] font-semibold text-text">
                  <span>{line.name}</span>
                  <span className="text-text-3">of {line.quantity}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min={0}
                    max={line.quantity}
                    value={quantities[line.productId] ?? ""}
                    onChange={(e) => setQuantities({ ...quantities, [line.productId]: e.target.value })}
                    className="w-24"
                  />
                  <div className="flex gap-1.5">
                    {(["sellable", "damaged"] as RefundLineCondition[]).map((c) => (
                      <Button
                        key={c}
                        type="button"
                        size="sm"
                        variant={(conditions[line.productId] ?? "sellable") === c ? "default" : "outline"}
                        onClick={() => setConditions({ ...conditions, [line.productId]: c })}
                      >
                        {c === "sellable" ? "Sellable" : "Damaged"}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            ))}

            <Input
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Reason for refund/return"
              className={cn()}
            />

            <div className="text-right text-[14px] font-extrabold text-text">Refund total: {fmtMoney(amount)}</div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button disabled={selectedLines.length === 0 || reason.trim().length < 3} onClick={() => setPinOpen(true)}>
              Request Approval
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ManagerPinDialog
        open={pinOpen}
        onOpenChange={setPinOpen}
        title="Approve refund"
        description={`Refunding ${fmtMoney(amount)} on ${sale.number} needs manager approval.`}
        onApproved={submit}
      />
    </>
  );
}
