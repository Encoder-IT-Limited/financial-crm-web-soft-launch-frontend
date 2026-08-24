"use client";

import { Wallet } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { fmtMoney } from "@/lib/format";
import type { Currency, Retainer } from "../types";

/** The "Pay from Retainer" checkbox card on the New Invoice page — extracted
 * verbatim; behavior unchanged. Only rendered by the caller when there's an
 * active retainer and the invoice isn't being edited. */
export function RetainerPayOption({
  retainer,
  checked,
  canPay,
  onCheckedChange,
  retainerCoversFully,
  total,
  currency,
}: {
  retainer: Retainer;
  checked: boolean;
  canPay: boolean;
  onCheckedChange: (checked: boolean) => void;
  retainerCoversFully: boolean;
  total: number;
  currency: Currency;
}) {
  return (
    <Card className="gap-0 p-0">
      <label className="flex cursor-pointer items-start gap-2.5 px-5 py-4">
        <Checkbox
          checked={checked && canPay}
          onCheckedChange={(value) => onCheckedChange(!!value)}
          disabled={!canPay}
          className="mt-0.5"
        />
        <div>
          <div className="flex items-center gap-1.5 text-[13px] font-semibold text-text">
            <Wallet className="size-3.5 text-blue" /> Pay from {retainer.number}
          </div>
          <p className="mt-0.5 text-[11.5px] text-text-3">
            {retainerCoversFully
              ? `Draws ${fmtMoney(total, currency)} from the ${fmtMoney(retainer.remainingBalance, retainer.currency)} remaining balance and marks this invoice paid on send. Only applies with "Create & Send".`
              : `Only ${fmtMoney(retainer.remainingBalance, retainer.currency)} remains on this retainer — it'll cover part of this invoice as a partial payment; the rest stays owed normally. Only applies with "Create & Send".`}
          </p>
        </div>
      </label>
    </Card>
  );
}
