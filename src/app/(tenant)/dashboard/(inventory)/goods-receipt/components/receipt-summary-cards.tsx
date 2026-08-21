import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface ReceiptSummaryCardsProps {
  pending: number;
  receivedToday: number;
  completedThisWeek: number;
  overdue: number;
}

export function ReceiptSummaryCards({
  pending,
  receivedToday,
  completedThisWeek,
  overdue,
}: ReceiptSummaryCardsProps) {
  const cards = [
    { label: "Pending Receipts", value: String(pending), dot: "bg-amber" },
    { label: "Received Today", value: String(receivedToday), dot: "bg-blue" },
    { label: "Completed This Week", value: String(completedThisWeek), dot: "bg-green" },
    { label: "Overdue Deliveries", value: String(overdue), dot: "bg-red" },
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
