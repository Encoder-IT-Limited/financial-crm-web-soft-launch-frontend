import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { TrendingDown, TrendingUp } from "lucide-react";
import type { KpiItem } from "../mock-data";

const toneClasses: Record<string, string> = {
  blue: "bg-blue-l text-blue",
  purple: "bg-purple-l text-purple",
  green: "bg-green-l text-green",
  amber: "bg-amber-l text-amber",
  red: "bg-red-l text-red",
};

export function KpiCard({ item }: { item: KpiItem }) {
  const Icon = item.icon;
  const TrendIcon = item.trendDirection === "up" ? TrendingUp : TrendingDown;

  return (
    <Card className="gap-0 p-4">
      <span
        className={cn(
          "grid size-9 place-items-center rounded-lg",
          toneClasses[item.tone]
        )}
      >
        <Icon className="size-[18px]" />
      </span>

      <div className="mt-3 truncate text-[11.5px] font-medium text-text-3 min-[1440px]:text-xs">
        {item.label}
      </div>
      <div className="mt-0.5 text-xl font-extrabold leading-tight tracking-tight text-text min-[1440px]:text-[22px]">
        {item.value}
      </div>

      <div className="mt-1.5 flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-[11.5px] min-[1440px]:text-xs">
        <span
          className={cn(
            "inline-flex items-center gap-0.5 font-semibold",
            item.trendTone === "positive" ? "text-green" : "text-red"
          )}
        >
          <TrendIcon className="size-3" />
          {item.trendText}
        </span>
        {item.note && <span className="text-text-4">· {item.note}</span>}
      </div>
    </Card>
  );
}
