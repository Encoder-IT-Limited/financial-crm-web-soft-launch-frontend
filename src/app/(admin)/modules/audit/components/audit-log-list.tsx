"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PageHeading } from "@/components/shared/page-heading";
import { auditApi } from "../api/audit.service";
import { AuditLogRow } from "./audit-log-row";
import type { AuditAction } from "../types";
import { AUDIT_ACTION_LABELS } from "../types";

type Filters = {
  search: string;
  tenant: string;
  module: string;
  action: "all" | AuditAction;
  from: string;
  to: string;
};

const EMPTY_FILTERS: Filters = { search: "", tenant: "all", module: "all", action: "all", from: "", to: "" };

export function AuditLogList() {
  const { data: entries = [], isLoading: loading } = useQuery({ queryKey: ["audit"], queryFn: auditApi.list });
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);

  const tenants = useMemo(
    () => Array.from(new Set(entries.filter((e) => e.tenantName).map((e) => e.tenantName!))).sort(),
    [entries]
  );
  const modules = useMemo(() => Array.from(new Set(entries.map((e) => e.module))).sort(), [entries]);

  const filtered = useMemo(() => {
    const needle = filters.search.trim().toLowerCase();
    return entries.filter((entry) => {
      if (filters.tenant !== "all" && entry.tenantName !== filters.tenant) return false;
      if (filters.module !== "all" && entry.module !== filters.module) return false;
      if (filters.action !== "all" && entry.action !== filters.action) return false;
      if (filters.from && entry.timestamp.slice(0, 10) < filters.from) return false;
      if (filters.to && entry.timestamp.slice(0, 10) > filters.to) return false;
      if (needle) {
        const haystack = `${entry.entityLabel} ${entry.userName} ${entry.tenantName ?? ""}`.toLowerCase();
        if (!haystack.includes(needle)) return false;
      }
      return true;
    });
  }, [entries, filters]);

  return (
    <div>
      <PageHeading title="Audit Log" subtitle="Review platform activity across all tenants" />

      <Card className="gap-0 p-0">
        <div className="flex flex-wrap items-center gap-2 border-b border-border p-3">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-text-4" />
            <Input
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              placeholder="Search entity, user, tenant..."
              className="w-full pl-8 sm:w-56"
            />
          </div>
          <Select value={filters.tenant} onValueChange={(v) => setFilters({ ...filters, tenant: v ?? "all" })}>
            <SelectTrigger size="sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All tenants</SelectItem>
              {tenants.map((name) => (
                <SelectItem key={name} value={name}>
                  {name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filters.module} onValueChange={(v) => setFilters({ ...filters, module: v ?? "all" })}>
            <SelectTrigger size="sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All modules</SelectItem>
              {modules.map((m) => (
                <SelectItem key={m} value={m}>
                  {m}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={filters.action}
            onValueChange={(v) => setFilters({ ...filters, action: (v ?? "all") as Filters["action"] })}
          >
            <SelectTrigger size="sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All actions</SelectItem>
              {(Object.keys(AUDIT_ACTION_LABELS) as AuditAction[]).map((action) => (
                <SelectItem key={action} value={action}>
                  {AUDIT_ACTION_LABELS[action]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input
            type="date"
            value={filters.from}
            onChange={(e) => setFilters({ ...filters, from: e.target.value })}
            className="w-[140px]"
            aria-label="From date"
          />
          <Input
            type="date"
            value={filters.to}
            onChange={(e) => setFilters({ ...filters, to: e.target.value })}
            className="w-[140px]"
            aria-label="To date"
          />
          <div className="ml-auto text-[11.5px] text-text-4">
            {filtered.length} of {entries.length} events
          </div>
        </div>

        <div className="flex flex-col">
          {loading && <div className="p-8 text-center text-[13px] text-text-4">Loading activity...</div>}
          {!loading && filtered.length === 0 && (
            <div className="p-8 text-center text-[13px] text-text-4">No activity matches your filters.</div>
          )}
          {!loading && filtered.map((entry) => <AuditLogRow key={entry.id} entry={entry} />)}
        </div>
      </Card>
    </div>
  );
}
