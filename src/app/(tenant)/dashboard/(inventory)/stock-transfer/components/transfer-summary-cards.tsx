import { Card } from "@/components/ui/card";
import { fmtMoney } from "@/lib/format";
import { cn } from "@/lib/utils";

interface TransferSummaryCardsProps {
  pending: number;
  inTransit: number;
  completedThisMonth: number;
  valueInTransit: number;
}

export function TransferSummaryCards({
  pending,
  inTransit,
  completedThisMonth,
  valueInTransit,
}: TransferSummaryCardsProps) {
  const cards = [
    { label: "Pending Transfers", value: String(pending), dot: "bg-amber" },
    { label: "In Transit", value: String(inTransit), dot: "bg-blue" },
    { label: "Completed This Month", value: String(completedThisMonth), dot: "bg-green" },
    { label: "Total Value in Transit", value: fmtMoney(valueInTransit), dot: "bg-purple" },
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
