import { cn } from "@/lib/utils";

type SeatMeterProps = {
  used: number;
  total: number;
  className?: string;
};

function severity(pct: number) {
  if (pct >= 100) return { bar: "bg-red", text: "text-red" };
  if (pct >= 85) return { bar: "bg-amber", text: "text-amber" };
  return { bar: "bg-blue", text: "text-blue" };
}

export function SeatMeter({ used, total, className }: SeatMeterProps) {
  const pct = total > 0 ? Math.min(100, Math.round((used / total) * 100)) : 0;
  const { bar, text } = severity(pct);

  return (
    <div className={cn("flex min-w-[110px] flex-col gap-1", className)}>
      <div className="flex items-baseline justify-between text-[11px] min-[1440px]:text-[12px]">
        <span className="text-text-3">Seats</span>
        <span className={cn("font-semibold", text)}>
          {used} / {total}
        </span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-surface-subtle">
        <div className={cn("h-full rounded-full transition-all", bar)} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
