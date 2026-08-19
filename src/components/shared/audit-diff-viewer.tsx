import { cn } from "@/lib/utils";

type AuditDiffViewerProps = {
  oldValues: Record<string, unknown> | null;
  newValues: Record<string, unknown> | null;
  className?: string;
};

function formatValue(value: unknown): string {
  if (value === null || value === undefined) return "—";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

/** Renders an audit log entry's old/new JSONB values as a readable field-by-field
 * diff. Fields present on either side are unioned; unchanged fields are dimmed. */
export function AuditDiffViewer({ oldValues, newValues, className }: AuditDiffViewerProps) {
  const fields = Array.from(
    new Set([...Object.keys(oldValues ?? {}), ...Object.keys(newValues ?? {})])
  ).sort();

  if (fields.length === 0) {
    return <p className="text-[12px] text-text-4">No field-level changes recorded.</p>;
  }

  return (
    <div className={cn("flex flex-col divide-y divide-border overflow-hidden rounded-lg border border-border", className)}>
      {fields.map((field) => {
        const before = formatValue(oldValues?.[field]);
        const after = formatValue(newValues?.[field]);
        const changed = before !== after;
        return (
          <div key={field} className="grid grid-cols-[120px_1fr_auto_1fr] items-center gap-3 px-3 py-2 text-[12px]">
            <span className="truncate font-semibold text-text-2">{field}</span>
            <span className={cn("truncate", changed ? "text-red line-through" : "text-text-4")}>{before}</span>
            <span className="text-text-4">→</span>
            <span className={cn("truncate", changed ? "font-medium text-green" : "text-text-4")}>{after}</span>
          </div>
        );
      })}
    </div>
  );
}
