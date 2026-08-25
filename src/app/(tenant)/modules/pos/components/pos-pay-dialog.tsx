"use client";

import { useMemo, useState } from "react";
import { Banknote, CreditCard, Smartphone, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { fmtMoney } from "@/lib/format";
import { roundMoney } from "../lib/pos-pricing";
import type { PaymentMethod, SalePaymentInput } from "../api/pos.service";
import { cn } from "@/lib/utils";

const TENDERS: { method: PaymentMethod; label: string; icon: typeof Banknote }[] = [
  { method: "CASH", label: "Cash", icon: Banknote },
  { method: "CARD", label: "Card", icon: CreditCard },
  { method: "MOBILE_PAYMENT", label: "Mobile", icon: Smartphone },
  { method: "BANK", label: "Bank", icon: Building2 },
];

const CASH_QUICK = [5, 10, 20, 50, 100];

export function PosPayDialog({
  open,
  total,
  pending,
  onOpenChange,
  onConfirm,
}: {
  open: boolean;
  total: number;
  pending?: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (payments: SalePaymentInput[], cashTendered: number) => void;
}) {
  const [method, setMethod] = useState<PaymentMethod>("CASH");
  const [tendered, setTendered] = useState("");
  const [splitCard, setSplitCard] = useState("");

  const cashIn = Number(tendered) || 0;
  const cardIn = Number(splitCard) || 0;

  const payments = useMemo(() => {
    if (method !== "CASH") {
      return [{ paymentMethod: method, amount: roundMoney(total) }];
    }
    if (cardIn > 0) {
      const cashPart = roundMoney(Math.max(0, total - cardIn));
      const cardPart = roundMoney(Math.min(cardIn, total));
      const list: SalePaymentInput[] = [];
      if (cashPart > 0.009) list.push({ paymentMethod: "CASH", amount: cashPart });
      if (cardPart > 0.009) list.push({ paymentMethod: "CARD", amount: cardPart });
      return list;
    }
    return [{ paymentMethod: "CASH" as const, amount: roundMoney(total) }];
  }, [method, total, cardIn]);

  const paid = roundMoney(payments.reduce((s, p) => s + p.amount, 0));
  const change = method === "CASH" && cashIn > total ? roundMoney(cashIn - total) : 0;
  const ready = Math.abs(paid - total) < 0.015;

  function applyQuick(n: number) {
    setTendered(String(n >= total ? n : roundMoney(total)));
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[440px]">
        <DialogHeader>
          <DialogTitle>Take payment</DialogTitle>
          <DialogDescription>
            Amount due <span className="font-bold text-text">{fmtMoney(total)}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-4 gap-1.5">
          {TENDERS.map((t) => {
            const Icon = t.icon;
            const active = method === t.method;
            return (
              <button
                key={t.method}
                type="button"
                onClick={() => {
                  setMethod(t.method);
                  setSplitCard("");
                }}
                className={cn(
                  "flex flex-col items-center gap-1 rounded-xl border px-2 py-3 text-[11.5px] font-bold",
                  active ? "border-blue bg-blue-l text-blue" : "border-border bg-surface text-text-2 hover:bg-surface-subtle",
                )}
              >
                <Icon className="size-4" />
                {t.label}
              </button>
            );
          })}
        </div>

        {method === "CASH" && (
          <div className="space-y-3">
            <div>
              <p className="mb-1 text-[11px] font-bold text-text-3">Cash tendered</p>
              <Input
                inputMode="decimal"
                value={tendered}
                onChange={(e) => setTendered(e.target.value)}
                placeholder={String(total)}
                className="h-11 text-[16px] font-bold tabular-nums"
              />
              <div className="mt-2 flex flex-wrap gap-1.5">
                <button
                  type="button"
                  className="rounded-full bg-navy px-3 py-1 text-[11px] font-bold text-white"
                  onClick={() => setTendered(String(total))}
                >
                  Exact
                </button>
                {CASH_QUICK.map((n) => (
                  <button
                    key={n}
                    type="button"
                    className="rounded-full bg-surface-subtle px-3 py-1 text-[11px] font-semibold text-text-2 hover:bg-blue-l hover:text-blue"
                    onClick={() => applyQuick(n)}
                  >
                    {fmtMoney(n)}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="mb-1 text-[11px] font-bold text-text-3">Split onto card (optional)</p>
              <Input
                inputMode="decimal"
                value={splitCard}
                onChange={(e) => setSplitCard(e.target.value)}
                placeholder="0.00"
                className="h-10 tabular-nums"
              />
            </div>
            {change > 0 && (
              <div className="rounded-xl bg-green-l px-3 py-2 text-[13px] font-bold text-green">
                Change due {fmtMoney(change)}
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" disabled={pending} onClick={() => onOpenChange(false)}>
            Back
          </Button>
          <Button
            disabled={pending || !ready}
            onClick={() => onConfirm(payments, cashIn)}
          >
            {pending ? "Posting…" : "Complete sale"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
