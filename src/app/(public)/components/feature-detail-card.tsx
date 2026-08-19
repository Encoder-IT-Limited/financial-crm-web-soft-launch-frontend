import { Check } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { ModuleShowcaseItem } from "./module-showcase-card";

export function FeatureDetailCard({
  item,
  className,
}: {
  item: ModuleShowcaseItem;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-4 rounded-2xl border border-border bg-surface p-6 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-blue/40 hover:shadow-lg hover:shadow-blue/[0.06]",
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex size-11 items-center justify-center rounded-xl bg-linear-to-br from-blue to-purple text-white shadow-sm shadow-blue/25">
          <item.icon className="size-5" />
        </div>
        {item.comingSoon && (
          <Badge tone="amber" className="text-[9px]">
            Coming soon
          </Badge>
        )}
      </div>
      <div>
        <div className="text-[14px] font-bold text-text">{item.name}</div>
        <p className="mt-1.5 text-[12.5px] text-text-3">{item.description}</p>
      </div>
      <ul className="flex flex-col gap-2 border-t border-border pt-4">
        {item.highlights.map((highlight) => (
          <li key={highlight} className="flex items-start gap-2 text-[12px] text-text-2">
            <Check className="mt-0.5 size-3.5 shrink-0 text-green" />
            {highlight}
          </li>
        ))}
      </ul>
    </div>
  );
}
