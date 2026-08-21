import { Card } from "@/components/ui/card";
import { fmtMoney } from "@/lib/format";
import { cn } from "@/lib/utils";

interface ReorderSummaryCardsProps {
  criticalItems: number;
  lowStockItems: number;
  reordersPending: number;
  totalReorderValue: number;
}

export function ReorderSummaryCards({
  criticalItems,
  lowStockItems,
  reordersPending,
  totalReorderValue,
}: ReorderSummaryCardsProps) {
  const cards = [
    { label: "Critical Items", value: String(criticalItems), dot: "bg-red" },
    { label: "Low Stock Items", value: String(lowStockItems), dot: "bg-amber" },
    { label: "Reorders Pending", value: String(reordersPending), dot: "bg-blue" },
    { label: "Total Reorder Value", value: fmtMoney(totalReorderValue), dot: "bg-purple" },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => (
        <Card key={card.label} className="flex flex-col gap-1.5 p-5">
          <span className="flex items-center gap-2 text-[12px] font-medium text-text-3 min-[1440px]:text-[13px]">
            <span className={cn("size-2 rounded-full", card.dot)} aria-hidden />
            {card.label}
          </span>
          <span className="text-xl font-bold tabular-nums text-text min-[1440px]:text-[22px]">
            {card.value}
          </span>
        </Card>
      ))}
    </div>
  );
}
