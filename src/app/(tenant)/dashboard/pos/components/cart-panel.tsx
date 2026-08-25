"use client";

import { ShoppingCart, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { fmtMoney } from "@/lib/format";
import type { CartLine, CartTotals } from "../types";
import { CartLineRow } from "./cart-line-row";

export function CartPanel({
  lines,
  totals,
  onQuantityChange,
  onRemove,
  onDiscount,
  onCheckout,
  canCheckout,
}: {
  lines: CartLine[];
  totals: CartTotals;
  onQuantityChange: (productId: string, quantity: number) => void;
  onRemove: (productId: string) => void;
  onDiscount: () => void;
  onCheckout: () => void;
  canCheckout: boolean;
}) {
  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 overflow-y-auto">
        {lines.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-2 py-10 text-text-4">
            <ShoppingCart className="size-8" />
            <span className="text-[12.5px]">Cart is empty</span>
          </div>
        ) : (
          lines.map((line) => (
            <CartLineRow
              key={line.productId}
              line={line}
              onQuantityChange={(q) => onQuantityChange(line.productId, q)}
              onRemove={() => onRemove(line.productId)}
            />
          ))
        )}
      </div>

      <div className="border-t border-border pt-3">
        <Button variant="outline" size="sm" className="mb-3 w-full" onClick={onDiscount} disabled={lines.length === 0}>
          <Tag /> Apply Discount
        </Button>

        <div className="flex flex-col gap-1 text-[12.5px] text-text-2">
          <div className="flex justify-between">
            <span>Subtotal</span>
            <span>{fmtMoney(totals.subtotal)}</span>
          </div>
          {totals.discount > 0 && (
            <div className="flex justify-between text-green">
              <span>Discount</span>
              <span>−{fmtMoney(totals.discount)}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span>VAT</span>
            <span>{fmtMoney(totals.tax)}</span>
          </div>
          <div className="mt-1 flex justify-between border-t border-border pt-1.5 text-[15px] font-extrabold text-text">
            <span>Total</span>
            <span>{fmtMoney(totals.total)}</span>
          </div>
        </div>

        <Button size="lg" className="mt-3 w-full" onClick={onCheckout} disabled={!canCheckout}>
          Checkout — {fmtMoney(totals.total)}
        </Button>
      </div>
    </div>
  );
}
