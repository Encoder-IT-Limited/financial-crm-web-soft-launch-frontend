import type { LucideIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export type ModuleShowcaseItem = {
  key: string;
  name: string;
  description: string;
  icon: LucideIcon;
  comingSoon?: boolean;
};

export function ModuleShowcaseCard({
  item,
  className,
}: {
  item: ModuleShowcaseItem;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "group relative flex flex-col gap-4 overflow-hidden rounded-2xl border border-border bg-surface p-5 text-left shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-blue/40 hover:shadow-lg hover:shadow-blue/[0.06]",
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex size-10 items-center justify-center rounded-xl bg-linear-to-br from-blue to-purple text-white shadow-sm shadow-blue/25 transition-transform duration-200 group-hover:scale-105">
          <item.icon className="size-4.5" />
        </div>
        {item.comingSoon && (
          <Badge tone="amber" className="text-[9px]">
            Coming soon
          </Badge>
        )}
      </div>
      <div>
        <div className="text-[13.5px] font-bold text-text">{item.name}</div>
        <p className="mt-1.5 text-[12px] leading-relaxed text-text-3">{item.description}</p>
      </div>
    </div>
  );
}
