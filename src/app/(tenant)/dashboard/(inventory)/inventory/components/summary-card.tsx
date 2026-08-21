import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";

const toneClasses: Record<string, { bg: string; text: string }> = {
  blue: { bg: "bg-blue-l", text: "text-blue" },
  purple: { bg: "bg-purple-l", text: "text-purple" },
  green: { bg: "bg-green-l", text: "text-green" },
  amber: { bg: "bg-amber-l", text: "text-amber" },
  red: { bg: "bg-red-l", text: "text-red" },
};

export interface SummaryCardProps {
  label: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
  tone?: keyof typeof toneClasses;
}

export function SummaryCard({ label, value, icon: Icon, tone = "blue" }: SummaryCardProps) {
  const t = toneClasses[tone];

  return (
    <Card className="flex items-center gap-3 p-4">
      <span className={cn("grid size-10 shrink-0 place-items-center rounded-lg", t.bg, t.text)}>
        <Icon className="size-5" />
      </span>
      <div className="min-w-0">
        <div className="truncate text-[11.5px] font-medium text-text-3 min-[1440px]:text-xs">
          {label}
        </div>
        <div className="text-xl font-extrabold leading-tight text-text min-[1440px]:text-[22px]">
          {value.toLocaleString()}
        </div>
      </div>
    </Card>
  );
}
