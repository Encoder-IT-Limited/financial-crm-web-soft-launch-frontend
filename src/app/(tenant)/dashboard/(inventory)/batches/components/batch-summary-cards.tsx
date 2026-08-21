import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface BatchSummaryCardsProps {
  total: number;
  active: number;
  expiringSoon: number;
  expired: number;
}

export function BatchSummaryCards({ total, active, expiringSoon, expired }: BatchSummaryCardsProps) {
  const cards = [
    { label: "Total Batches", value: String(total), dot: "bg-blue" },
    { label: "Active Batches", value: String(active), dot: "bg-green" },
    { label: "Expiring Soon (30 days)", value: String(expiringSoon), dot: "bg-amber" },
    { label: "Expired Batches", value: String(expired), dot: "bg-red" },
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
