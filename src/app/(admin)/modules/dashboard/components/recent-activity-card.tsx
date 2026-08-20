import Link from "next/link";
import { Card } from "@/components/ui/card";
import { AuditLogRow } from "../../audit/components/audit-log-row";
import type { AuditLogEntry } from "../../audit/types";

export function RecentActivityCard({ entries }: { entries: AuditLogEntry[] }) {
  const recent = entries.slice(0, 8);

  return (
    <Card className="flex flex-col gap-3 overflow-hidden p-0">
      <div className="flex items-center justify-between px-5 pt-5">
        <h3 className="text-[13px] font-bold text-text min-[1440px]:text-[14px]">Recent activity</h3>
        <Link
          href="/admin/audit"
          className="text-[11.5px] font-semibold text-blue hover:underline min-[1440px]:text-[12.5px]"
        >
          View all
        </Link>
      </div>
      {recent.length === 0 ? (
        <p className="px-5 pb-5 text-[12.5px] text-text-4 min-[1440px]:text-[13.5px]">No activity yet.</p>
      ) : (
        <div className="pb-1">
          {recent.map((entry) => (
            <AuditLogRow key={entry.id} entry={entry} />
          ))}
        </div>
      )}
    </Card>
  );
}
