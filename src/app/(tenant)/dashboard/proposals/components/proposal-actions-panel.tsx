"use client";

import Link from "next/link";
import { Save, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Currency, InvoiceTotals } from "../../../modules/billing/types";
import { InvoiceSummaryCard } from "../../../modules/billing/components/invoice-summary-card";

export function ProposalActionsPanel({
  currency,
  totals,
  discountPercent,
  onDiscountPercentChange,
  discountError,
  isEditing,
  saving,
  onSaveDraft,
  onSend,
}: {
  currency: Currency;
  totals: InvoiceTotals;
  discountPercent: string;
  onDiscountPercentChange: (value: string) => void;
  discountError?: string;
  isEditing: boolean;
  saving: "draft" | "send" | null;
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
      />

      <div className="flex flex-col gap-2">
        <Button variant="secondary" onClick={onSaveDraft} disabled={saving !== null}>
          <Save /> {isEditing ? "Save Changes" : "Save Draft"}
        </Button>
        <Button onClick={onSend} disabled={saving !== null}>
          <Send /> {isEditing ? "Send Proposal" : "Create & Send"}
        </Button>
        <Link href="/dashboard/proposals" className="text-center text-[11.5px] text-text-3 underline-offset-2 hover:underline">
          Cancel and go back
        </Link>
      </div>
    </div>
  );
}
