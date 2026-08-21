import { fmtMoney } from "@/lib/format";
import { cn } from "@/lib/utils";

export type StatTile = {
  label: string;
  value: string;
  tone: "green" | "amber" | "red" | "blue" | "neutral";
  sub?: string;
};

const toneClasses: Record<StatTile["tone"], { bg: string; text: string }> = {
  green: { bg: "bg-green-l", text: "text-green" },
  amber: { bg: "bg-amber-l", text: "text-amber" },
  red: { bg: "bg-red-l", text: "text-red" },
  blue: { bg: "bg-blue-l", text: "text-blue" },
  neutral: { bg: "bg-surface-subtle", text: "text-text-2" },
};

export function StatTiles({ tiles }: { tiles: StatTile[] }) {
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {tiles.map((tile) => {
        const tone = toneClasses[tile.tone];
        return (
          <div key={tile.label} className={cn("rounded-[10px] p-3.5 text-center", tone.bg)}>
            <div className={cn("mb-1.5 text-[11px] font-bold uppercase tracking-wide", tone.text)}>
              {tile.label}
            </div>
            <div className={cn("text-lg font-extrabold lg:text-[22px]", tone.text)}>{tile.value}</div>
            {tile.sub && <div className="mt-1 text-[11px] text-text-3">{tile.sub}</div>}
          </div>
        );
      })}
    </div>
  );
}

export function moneyValue(amount: number): string {
  return fmtMoney(amount);
}