"use client";

import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { fmtMoney, fmtDateTime } from "@/lib/format";
import type { PosReceipt } from "../api/pos.service";

export function PosReceiptDialog({
  open,
  receipt,
  changeDue,
  onOpenChange,
  onNewSale,
}: {
  open: boolean;
  receipt: PosReceipt | null;
  changeDue?: number;
  onOpenChange: (open: boolean) => void;
  onNewSale: () => void;
}) {
  if (!receipt) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[380px]">
        <DialogHeader>
          <DialogTitle>Sale complete</DialogTitle>
        </DialogHeader>
        <div id="pos-receipt" className="rounded-xl border border-border bg-surface-subtle p-4 font-mono text-[12px] text-text">
          <p className="text-center text-[13px] font-bold">{receipt.terminal?.name ?? "POS"}</p>
          <p className="text-center text-text-3">{receipt.transactionNumber}</p>
          <p className="mb-3 text-center text-text-4">{fmtDateTime(receipt.transactionDate)}</p>
          {receipt.items.map((item) => (
            <div key={item.id} className="flex justify-between gap-2 py-0.5">
              <span className="truncate">
                {Number(item.quantity)} × {fmtMoney(Number(item.unitPrice))}
              </span>
              <span>{fmtMoney(Number(item.total ?? 0))}</span>
            </div>
          ))}
          <div className="my-2 border-t border-dashed border-border" />
          <div className="flex justify-between">
            <span>Tax</span>
            <span>{fmtMoney(Number(receipt.tax))}</span>
          </div>
          <div className="flex justify-between text-[14px] font-bold">
            <span>Total</span>
            <span>{fmtMoney(Number(receipt.total))}</span>
          </div>
          {receipt.payments.map((p) => (
            <div key={p.id} className="flex justify-between text-text-3">
              <span>{p.paymentMethod}</span>
              <span>{fmtMoney(Number(p.amount))}</span>
            </div>
          ))}
          {changeDue && changeDue > 0 ? (
            <div className="mt-2 flex justify-between font-bold text-green">
              <span>Change</span>
              <span>{fmtMoney(changeDue)}</span>
            </div>
          ) : null}
          {receipt.openCashDrawer && (
            <p className="mt-2 text-center text-[10.5px] font-semibold tracking-wide text-amber uppercase">
              Open cash drawer
            </p>
          )}
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => {
              const node = document.getElementById("pos-receipt");
              if (!node) return;
              const w = window.open("", "_blank", "width=360,height=640");
              if (!w) return;
              w.document.write(
                `<html><head><title>Receipt</title><style>body{font-family:ui-monospace,monospace;padding:16px;font-size:12px}</style></head><body>${node.innerHTML}</body></html>`,
              );
              w.document.close();
              w.focus();
              w.print();
            }}
          >
            <Printer className="size-3.5" /> Print
          </Button>
          <Button onClick={onNewSale}>New sale</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
