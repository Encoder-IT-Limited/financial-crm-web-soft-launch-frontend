"use client";

import Link from "next/link";
import { Eye, FileText, Save, Send, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { fmtMoney } from "@/lib/format";
import type { Currency, Retainer } from "../types";
import { InvoiceSummaryCard, SummaryRow } from "./invoice-summary-card";

export function NewInvoiceActions({
  currency,
  totals,
  discountPercent,
  onDiscountPercentChange,
  discountError,
  activeRetainer,
  canPayFromRetainer,
  retainerCoversFully,
  payFromRetainer,
  onPayFromRetainerChange,
  saving,
  onPreview,
  onSaveDraft,
  onSend,
}: {
  currency: Currency;
  totals: { subtotal: number; discount: number; tax: number; total: number };
  discountPercent: string;
  onDiscountPercentChange: (value: string) => void;
  discountError?: string;
  activeRetainer?: Retainer;
  canPayFromRetainer: boolean;
  retainerCoversFully: boolean;
  payFromRetainer: boolean;
  onPayFromRetainerChange: (checked: boolean) => void;
  saving: "draft" | "send" | null;
  onPreview: () => void;
  onSaveDraft: () => void;
  onSend: () => void;
}) {
  return (
    <div className="flex flex-col gap-4">
      <InvoiceSummaryCard
        currency={currency}
        totals={totals}
        discountPercent={discountPercent}
        onDiscountPercentChange={onDiscountPercentChange}
        discountError={discountError}
        extraRows={
          <>
            <SummaryRow label="Paid" value={fmtMoney(0, currency)} />
            <SummaryRow label="Balance due" value={fmtMoney(totals.total, currency)} bold tone="red" />
          </>
        }
      />

      {activeRetainer && (
        <Card className="gap-0 p-0">
          <label className="flex cursor-pointer items-start gap-2.5 px-5 py-4">
            <Checkbox
              checked={payFromRetainer && canPayFromRetainer}
              onCheckedChange={(checked) => onPayFromRetainerChange(!!checked)}
              disabled={!canPayFromRetainer}
              className="mt-0.5"
            />
            <div>
              <div className="flex items-center gap-1.5 text-[13px] font-semibold text-text">
                <Wallet className="size-3.5 text-blue" /> Pay from {activeRetainer.number}
              </div>
              <p className="mt-0.5 text-[11.5px] text-text-3">
                {retainerCoversFully
                  ? `Draws ${fmtMoney(totals.total, currency)} from the ${fmtMoney(activeRetainer.remainingBalance, activeRetainer.currency)} remaining balance and marks this invoice paid on send. Only applies with "Create & Send".`
                  : `Only ${fmtMoney(activeRetainer.remainingBalance, activeRetainer.currency)} remains on this retainer — it'll cover part of this invoice as a partial payment; the rest stays owed normally. Only applies with "Create & Send".`}
              </p>
            </div>
          </label>
        </Card>
      )}

      <Card className="gap-0 border-blue-t bg-blue-l p-0">
        <div className="flex items-start gap-3 px-5 py-4">
          <FileText className="mt-0.5 size-4 shrink-0 text-blue" />
          <div className="text-[11.5px] leading-relaxed text-blue/90">
            Drafts stay private and are clearly labelled. Nothing is emailed until you click
            <strong> Create &amp; Send</strong>.
          </div>
        </div>
      </Card>

      <div className="flex flex-col gap-2">
        <Button variant="outline" onClick={onPreview} disabled={totals.total <= 0}>
          <Eye /> Preview PDF
        </Button>
        <Button variant="secondary" onClick={onSaveDraft} disabled={saving !== null}>
          <Save /> Save Draft
        </Button>
        <Button onClick={onSend} disabled={saving !== null}>
          <Send /> Create & Send
        </Button>
        <Link href="/dashboard/invoices" className="text-center text-[11.5px] text-text-3 underline-offset-2 hover:underline">
          Cancel and go back
        </Link>
      </div>
    </div>
  );
}
