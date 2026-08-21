import { cn } from "@/lib/utils";

export function CapacityBar({ occupancy, capacity }: { occupancy: number; capacity: number }) {
  const pct = Math.min(100, Math.round((occupancy / capacity) * 100));
  const tone = pct < 70 ? "bg-green" : pct < 90 ? "bg-amber" : "bg-red";

  return (
    <div className="flex min-w-[140px] flex-col gap-1">
      <div className="flex items-center justify-between gap-2 text-[11.5px] font-semibold tabular-nums min-[1440px]:text-[12.5px]">
        <span className="text-text">{pct}%</span>
        <span className="font-normal text-text-4">
          {occupancy.toLocaleString()} / {capacity.toLocaleString()}
        </span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-surface-subtle">
        <div className={cn("h-full rounded-full", tone)} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
