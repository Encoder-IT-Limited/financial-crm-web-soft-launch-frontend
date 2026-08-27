import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function TrialsEndingCard({
  items,
}: {
  items: { id: string; name: string; planName: string; daysLeft: number }[];
}) {
  return (
    <Card className="flex flex-col gap-3 p-5">
      <h3 className="text-[13px] font-bold text-text min-[1440px]:text-[14px]">Trials ending soon</h3>
      {items.length === 0 ? (
        <p className="py-6 text-center text-[12.5px] text-text-4 min-[1440px]:text-[13.5px]">
          No trials ending in the next 7 days.
        </p>
      ) : (
        <div className="flex flex-col">
          {items.map((item) => (
            <Link
              key={item.id}
              href={`/admin/tenants?tenant=${item.id}`}
              className="flex items-center gap-3 border-b border-border py-3 last:border-b-0 hover:bg-surface-subtle"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-[12.5px] font-semibold text-text min-[1440px]:text-[13.5px]">{item.name}</p>
                <p className="text-[11px] text-text-4 min-[1440px]:text-[12px]">{item.planName}</p>
              </div>
              <Badge tone={item.daysLeft <= 2 ? "red" : "amber"}>
                {item.daysLeft === 0 ? "Ends today" : `${item.daysLeft}d left`}
              </Badge>
            </Link>
          ))}
        </div>
      )}
    </Card>
  );
}
