"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";
import { fmtDateTime } from "@/lib/format";
import { POS_PAYMENT_METHOD_LABELS, paymentChange, type PosSale } from "../types";
import { useFmtMoney } from "../use-fmt-money";

/** Post-sale receipt preview — mirrors invoice-pdf.tsx's rendering
 * approach (a styled preview, "print" simulated via window.print()),
 * POS-styled (narrow, monospace-ish) instead of A4. */
export function ReceiptDialog({
  sale,
  open,
  onOpenChange,
  onNewSale,
}: {
  sale: PosSale | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onNewSale: () => void;
}) {
  const money = useFmtMoney();
  if (!sale) return null;
  const changeDue = sale.payments.reduce((sum, p) => sum + paymentChange(p), 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xs">
        <DialogHeader>
          <DialogTitle>Sale Complete</DialogTitle>
        </DialogHeader>

        <div className="rounded-lg border border-dashed border-border bg-surface-subtle p-4 font-mono text-[11.5px] text-text-2">
          <div className="text-center text-[12.5px] font-bold text-text">{sale.number}</div>
          <div className="text-center text-text-3">{fmtDateTime(sale.createdAt)}</div>
          <div className="my-2 border-t border-dashed border-border" />
          {sale.lines.map((line) => (
            <div key={line.productId} className="flex justify-between">
              <span>
                {line.quantity}× {line.name}
              </span>
              <span>{money(line.quantity * line.unitPrice - (line.discountAmount ?? 0))}</span>
            </div>
          ))}
          <div className="my-2 border-t border-dashed border-border" />
          <div className="flex justify-between">
            <span>Subtotal</span>
            <span>{money(sale.subtotal)}</span>
          </div>
          {sale.discount > 0 && (
            <div className="flex justify-between">
              <span>Discount</span>
              <span>−{money(sale.discount)}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span>VAT</span>
            <span>{money(sale.tax)}</span>
          </div>
          <div className="flex justify-between text-[13px] font-bold text-text">
            <span>Total</span>
            <span>{money(sale.total)}</span>
          </div>
          <div className="my-2 border-t border-dashed border-border" />
          {sale.payments.map((p, i) => (
            <div key={i} className="flex justify-between">
              <span>{POS_PAYMENT_METHOD_LABELS[p.method]}{paymentChange(p) > 0 ? " tendered" : ""}</span>
              <span>{money(p.tenderedAmount ?? p.amount)}</span>
            </div>
          ))}
          {changeDue > 0 && (
            <div className="flex justify-between font-bold text-text">
              <span>Change</span>
              <span>{money(changeDue)}</span>
            </div>
          )}
        </div>

        <div className="flex gap-2">
          <Button variant="outline" className="flex-1" onClick={() => window.print()}>
            <Printer /> Print
          </Button>
          <Button className="flex-1" onClick={onNewSale}>
            New Sale
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
