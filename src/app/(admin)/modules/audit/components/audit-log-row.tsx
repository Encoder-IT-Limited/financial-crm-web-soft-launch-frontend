"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { AuditDiffViewer } from "@/components/shared/audit-diff-viewer";
import { fmtDateTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import { AUDIT_ACTION_LABELS, type AuditAction, type AuditLogEntry } from "../types";
import { describeAuditEntry } from "../lib/describe";

const ACTION_TONE: Record<AuditAction, "blue" | "green" | "red" | "amber" | "neutral" | "purple"> = {
  create: "green",
  update: "blue",
  delete: "red",
  suspend: "amber",
  reactivate: "green",
  login: "neutral",
  export: "purple",
};

/** One audit log entry, expandable to its old/new-value diff. Shared between
 * the Audit Log page (§3.4) and a tenant detail page's Activity tab (§3.1) —
 * pass `hideTenant` when embedding it in a tenant-scoped list. */
export function AuditLogRow({ entry, hideTenant = false }: { entry: AuditLogEntry; hideTenant?: boolean }) {
  const [open, setOpen] = useState(false);
  const hasDiff = entry.oldValues !== null || entry.newValues !== null;

  return (
    <div className="border-b border-border last:border-b-0">
      <button
        type="button"
        onClick={() => hasDiff && setOpen((v) => !v)}
        className={cn(
          "flex w-full flex-wrap items-center gap-x-3 gap-y-1 px-4 py-3 text-left",
          hasDiff && "hover:bg-surface-subtle"
        )}
      >
        <Badge tone={ACTION_TONE[entry.action]}>{AUDIT_ACTION_LABELS[entry.action]}</Badge>
        <span className="text-[12.5px] font-semibold text-text min-[1440px]:text-[13.5px]">
          {describeAuditEntry(entry)}
        </span>
        {!hideTenant && entry.tenantName && (
          <span className="text-[11.5px] text-text-3 min-[1440px]:text-[12.5px]">{entry.tenantName}</span>
        )}
        <span className="text-[11px] text-text-4 min-[1440px]:text-[12px]">{entry.module}</span>
        <span className="ml-auto text-[11px] text-text-4 min-[1440px]:text-[12px]">{fmtDateTime(entry.timestamp)}</span>
        <span className="text-[11px] text-text-4 min-[1440px]:text-[12px]">{entry.userName}</span>
        {hasDiff && (
          <ChevronDown className={cn("size-3.5 text-text-4 transition-transform", open && "rotate-180")} />
        )}
      </button>
      {open && hasDiff && (
        <div className="flex flex-col gap-2 px-4 pt-2 pb-3">
          <AuditDiffViewer oldValues={entry.oldValues} newValues={entry.newValues} />
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-text-4">
            <span>{entry.userEmail}</span>
            <span>IP {entry.ipAddress}</span>
          </div>
        </div>
      )}
    </div>
  );
}
