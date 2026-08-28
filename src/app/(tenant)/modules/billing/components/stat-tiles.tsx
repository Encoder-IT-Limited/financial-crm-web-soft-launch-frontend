import { fmtMoney } from "@/lib/format";
import { cn } from "@/lib/utils";

export type StatTile = {
  label: string;
  value: string;
  tone: "green" | "amber" | "red" | "blue" | "neutral";
  sub?: string;
  /** Escalates this tile's color dosage (a stronger tint border + a small
   * pulse dot) instead of every tile competing at equal visual weight.
   * Reserve for the one number that genuinely needs attention right now
   * (e.g. an overdue balance > 0) — not a generic "highlight" prop. */
  urgent?: boolean;
};

const toneClasses: Record<StatTile["tone"], { bg: string; text: string; border: string; dot: string }> = {
  green: { bg: "bg-green-l", text: "text-green", border: "border-green-t", dot: "bg-green" },
  amber: { bg: "bg-amber-l", text: "text-amber", border: "border-amber-t", dot: "bg-amber" },
  red: { bg: "bg-red-l", text: "text-red", border: "border-red-t", dot: "bg-red" },
  blue: { bg: "bg-blue-l", text: "text-blue", border: "border-blue-t", dot: "bg-blue" },
  neutral: { bg: "bg-surface-subtle", text: "text-text-2", border: "border-border", dot: "bg-text-4" },
};

/** Solid (non-tinted) fill per tone — shared with any bar/progress element
 * that needs the same tone vocabulary as the tiles above, so the mapping
 * exists in exactly one place. */
export const TONE_SOLID_BG: Record<StatTile["tone"], string> = {
  green: "bg-green",
  amber: "bg-amber",
  red: "bg-red",
  blue: "bg-blue",
  neutral: "bg-border",
};

export function StatTiles({ tiles }: { tiles: StatTile[] }) {
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {tiles.map((tile, i) => {
        const tone = toneClasses[tile.tone];
        return (
          <div
            key={tile.label}
            style={{ animationDelay: `${Math.min(i, 3) * 60}ms` }}
            className={cn(
              // One authored entrance: tiles settle in with a short rise +
              // fade, staggered slightly by position. motion-safe: only —
              // reduced-motion users get the final state immediately.
              "motion-safe:fill-mode-both motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-1 motion-safe:duration-500",
              "relative rounded-[10px] p-3.5 text-center",
              tone.bg,
              tile.urgent && cn("border", tone.border)
            )}
          >
            {tile.urgent && (
              <span
                aria-hidden
                className={cn("absolute top-2.5 right-2.5 size-1.5 rounded-full motion-safe:animate-pulse", tone.dot)}
              />
            )}
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
