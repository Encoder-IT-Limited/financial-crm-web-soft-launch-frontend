import { TrendingUp } from "lucide-react";
import { Card } from "@/components/ui/card";
import { fmtMoney } from "@/lib/format";
import { cn } from "@/lib/utils";

interface ValuationSummaryCardsProps {
  inventoryValue: number;
  totalCost: number;
  totalRetail: number;
  profitMargin: number;
  costBasisLabel: string;
}

export function ValuationSummaryCards({
  inventoryValue,
  totalCost,
  totalRetail,
  profitMargin,
  costBasisLabel,
}: ValuationSummaryCardsProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <Card className="flex flex-col gap-1.5 p-5">
        <span className="flex items-center gap-2 text-[12px] font-medium text-text-3 min-[1440px]:text-[13px]">
          <span className="size-2 rounded-full bg-blue" aria-hidden />
          Total Inventory Value
        </span>
        <span className="text-[22px] font-extrabold tabular-nums tracking-tight text-text min-[1440px]:text-2xl">
          {fmtMoney(inventoryValue)}
        </span>
        <span className="inline-flex items-center gap-1 text-[11.5px] font-semibold text-green min-[1440px]:text-xs">
          <TrendingUp className="size-3" />
          +12.5% vs last month
        </span>
      </Card>

      <Card className="flex flex-col gap-1.5 p-5">
        <span className="flex items-center gap-2 text-[12px] font-medium text-text-3 min-[1440px]:text-[13px]">
          <span className="size-2 rounded-full bg-amber" aria-hidden />
          Total Cost Value
        </span>
        <span className="text-xl font-bold tabular-nums text-text min-[1440px]:text-[22px]">
          {fmtMoney(totalCost)}
        </span>
        <span className="text-[11.5px] font-medium text-text-4 min-[1440px]:text-xs">
          {costBasisLabel} cost basis
        </span>
      </Card>

      <Card className="flex flex-col gap-1.5 p-5">
        <span className="flex items-center gap-2 text-[12px] font-medium text-text-3 min-[1440px]:text-[13px]">
          <span className="size-2 rounded-full bg-purple" aria-hidden />
          Total Retail Value
        </span>
        <span className="text-xl font-bold tabular-nums text-text min-[1440px]:text-[22px]">
          {fmtMoney(totalRetail)}
        </span>
        <span className="text-[11.5px] font-medium text-text-4 min-[1440px]:text-xs">
          At current retail prices
        </span>
      </Card>

      <Card className="flex flex-col gap-1.5 p-5">
        <span className="flex items-center gap-2 text-[12px] font-medium text-text-3 min-[1440px]:text-[13px]">
          <span className="size-2 rounded-full bg-green" aria-hidden />
          Estimated Profit Margin
        </span>
        <span
          className={cn(
            "text-xl font-extrabold tabular-nums text-green min-[1440px]:text-[22px]"
          )}
        >
          {profitMargin.toFixed(1)}%
        </span>
        <span className="mt-1 block h-1.5 w-full overflow-hidden rounded-full bg-surface-subtle">
          <span
            className="block h-full rounded-full bg-green transition-[width] duration-300"
            style={{ width: `${Math.min(100, Math.max(0, profitMargin))}%` }}
            role="progressbar"
            aria-label="Estimated profit margin"
            aria-valuenow={profitMargin}
            aria-valuemin={0}
            aria-valuemax={100}
          />
        </span>
        <span className="mt-0.5 text-[11.5px] font-medium text-text-4 min-[1440px]:text-xs">
          (Retail − Cost) ÷ Retail
        </span>
      </Card>
    </div>
  );
}
