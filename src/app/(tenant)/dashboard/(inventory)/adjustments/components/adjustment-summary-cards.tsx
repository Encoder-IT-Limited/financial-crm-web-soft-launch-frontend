import { TrendingDown, TrendingUp } from "lucide-react";
import { Card } from "@/components/ui/card";
import { fmtMoney } from "@/lib/format";
import { cn } from "@/lib/utils";

interface AdjustmentSummaryCardsProps {
  total: number;
  stockAdded: number;
  stockDeducted: number;
  netValue: number;
}

export function AdjustmentSummaryCards({
  total,
  stockAdded,
  stockDeducted,
  netValue,
}: AdjustmentSummaryCardsProps) {
  const netPositive = netValue >= 0;
  const cards = [
    { label: "Total Adjustments", value: String(total), dot: "bg-blue" },
    { label: "Stock Added", value: `+${stockAdded.toLocaleString()}`, dot: "bg-green" },
    { label: "Stock Deducted", value: `-${stockDeducted.toLocaleString()}`, dot: "bg-red" },
    {
      label: "Net Value Impact",
      value: `${netPositive ? "+" : "-"}${fmtMoney(Math.abs(netValue))}`,
      icon: netPositive ? (
        <TrendingUp className="size-4 text-green" aria-hidden />
      ) : (
        <TrendingDown className="size-4 text-red" aria-hidden />
      ),
      dot: netPositive ? "bg-green" : "bg-red",
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => (
        <Card key={card.label} className="flex flex-col gap-1.5 p-5">
          <span className="flex items-center gap-2 text-[12px] font-medium text-text-3 min-[1440px]:text-[13px]">
            <span className={cn("size-2 rounded-full", card.dot)} aria-hidden />
            {card.label}
          </span>
          <span className="flex items-center gap-1.5 text-xl font-bold tabular-nums text-text min-[1440px]:text-[22px]">
            {card.value}
            {card.icon}
          </span>
        </Card>
      ))}
    </div>
  );
}
