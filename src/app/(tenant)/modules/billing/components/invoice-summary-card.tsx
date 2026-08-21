import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { fmtMoney } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Currency, InvoiceTotals } from "../types";

/** Shared subtotal/discount/VAT/total summary block for the Invoices and
 *  Proposals create/edit forms — same layout, no per-entity duplication.
 *  `extraRows` lets a caller (e.g. Invoices) tack on Paid/Balance rows
 *  without this component needing to know about payments. */
export function InvoiceSummaryCard({
  currency,
  totals,
  discountPercent,
  onDiscountPercentChange,
  discountError,
  extraRows,
}: {
  currency: Currency;
  totals: InvoiceTotals;
  discountPercent: string;
  onDiscountPercentChange: (value: string) => void;
  discountError?: string;
  extraRows?: React.ReactNode;
}) {
  const discountPct = Math.min(100, Math.max(0, Number(discountPercent) || 0));

  return (
    <Card className="gap-0 p-0">
      <div className="border-b border-border px-5 py-3">
        <div className="text-sm font-bold text-text">Summary</div>
      </div>
      <div className="flex flex-col gap-2.5 px-5 py-4">
        <SummaryRow label="Subtotal" value={fmtMoney(totals.subtotal, currency)} />
        <label className="flex items-center justify-between gap-2 text-[13px] text-text-3">
          <span>Discount (%)</span>
          <Input
            type="number"
            min={0}
            max={100}
            value={discountPercent}
            onChange={(e) => onDiscountPercentChange(e.target.value)}
            aria-invalid={!!discountError}
            className={cn("w-20 text-right", discountError && "border-red")}
          />
        </label>
        {discountError && <p className="text-[10.5px] text-red">{discountError}</p>}
        {discountPct > 0 && (
          <SummaryRow label={`Discount applied (${discountPct}%)`} value={`−${fmtMoney(totals.discount, currency)}`} tone="red" />
        )}
        <SummaryRow label="VAT" value={fmtMoney(totals.tax, currency)} />
        <SummaryRow label="Total" value={fmtMoney(totals.total, currency)} bold />
        {extraRows}
      </div>
    </Card>
  );
}

export function SummaryRow({
  label,
  value,
  bold,
  tone,
}: {
  label: string;
  value: string;
  bold?: boolean;
  tone?: "red";
}) {
  return (
    <div className={cn("flex justify-between text-[13px]", bold && "border-t-2 border-text pt-2 text-[15px] font-bold")}>
      <span className={cn(!bold && "text-text-3")}>{label}</span>
      <span className={cn(tone === "red" && "text-red", !tone && "text-text")}>{value}</span>
    </div>
  );
}
