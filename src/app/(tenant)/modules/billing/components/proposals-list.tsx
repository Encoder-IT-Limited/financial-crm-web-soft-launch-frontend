"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import { Plus } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { PageHeading } from "@/components/shared/page-heading";
import { FilterableTable } from "@/components/shared/filterable-table";
import { StatTiles } from "./stat-tiles";
import { fmtDate, fmtMoney } from "@/lib/format";
import { customersApi } from "../../crm/api/customers.service";
import { proposalDisplayStatus, type Proposal, type ProposalDisplayStatus } from "../types";
import { proposalsApi } from "../api/proposals.service";
import { PROPOSAL_STATUS_CONFIG, ProposalStatusBadge } from "./proposal-status-badge";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyColumnDef<TData> = ColumnDef<TData, any>;

type Filters = { search: string; status: "all" | ProposalDisplayStatus };

const STATUS_OPTIONS = Object.keys(PROPOSAL_STATUS_CONFIG) as ProposalDisplayStatus[];

export function ProposalsList() {
  const router = useRouter();
  const { data: proposals = [], isLoading: loading } = useQuery({ queryKey: ["proposals"], queryFn: proposalsApi.list });
  const { data: customers = [] } = useQuery({ queryKey: ["customers"], queryFn: customersApi.list });
  const [filters, setFilters] = useState<Filters>({ search: "", status: "all" });

  const customerName = (id: string) => customers.find((c) => c.id === id)?.name ?? "—";

  const filtered = useMemo(() => {
    const needle = filters.search.trim().toLowerCase();
    return proposals.filter((p) => {
      if (filters.status !== "all" && proposalDisplayStatus(p) !== filters.status) return false;
      if (needle) {
        const haystack = `${p.number} ${customerName(p.customerId)}`.toLowerCase();
        if (!haystack.includes(needle)) return false;
      }
      return true;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [proposals, filters, customers]);

  const stats = useMemo(() => {
    const sent = proposals.filter((p) => proposalDisplayStatus(p) === "sent");
    const accepted = proposals.filter((p) => p.status === "accepted");
    const acceptedValue = accepted.reduce((sum, p) => sum + p.total, 0);
    const pipelineValue = sent.reduce((sum, p) => sum + p.total, 0);
    return { sentCount: sent.length, acceptedCount: accepted.length, acceptedValue, pipelineValue };
  }, [proposals]);

  const columns = useMemo<AnyColumnDef<Proposal>[]>(
    () => [
      {
        accessorKey: "number",
        header: "Proposal #",
        cell: ({ row }) => <span className="font-bold text-text">{row.original.number}</span>,
      },
      {
        id: "customer",
        accessorFn: (p: Proposal) => customerName(p.customerId),
        header: "Customer",
        cell: ({ row }) => <span className="text-[13px] text-text">{customerName(row.original.customerId)}</span>,
      },
      {
        id: "date",
        accessorFn: (p: Proposal) => p.date,
        header: "Date",
        cell: ({ row }) => <span className="text-[12.5px] text-text-2">{fmtDate(row.original.date)}</span>,
      },
      {
        id: "expiryDate",
        accessorFn: (p: Proposal) => p.expiryDate,
        header: "Expires",
        cell: ({ row }) => <span className="text-[12.5px] text-text-2">{fmtDate(row.original.expiryDate)}</span>,
      },
      {
        id: "total",
        accessorFn: (p: Proposal) => p.total,
        header: "Amount",
        cell: ({ row }) => (
          <span className="text-[13px] font-semibold text-text">{fmtMoney(row.original.total, row.original.currency)}</span>
        ),
      },
      {
        id: "status",
        accessorFn: (p: Proposal) => proposalDisplayStatus(p),
        header: "Status",
        enableSorting: false,
        cell: ({ row }) => <ProposalStatusBadge status={proposalDisplayStatus(row.original)} />,
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [customers]
  );

  return (
    <div>
      <PageHeading
        title="Proposals"
        subtitle="Send quotes and convert accepted ones to invoices"
        actions={
          <Button size="sm" onClick={() => router.push("/dashboard/proposals/new")}>
            <Plus /> New Proposal
          </Button>
        }
      />

      <div className="mb-4">
        <StatTiles
          tiles={[
            { label: "Awaiting Response", value: String(stats.sentCount), tone: "blue", sub: "sent, not expired" },
            { label: "Pipeline Value", value: fmtMoney(stats.pipelineValue), tone: "amber", sub: "awaiting response" },
            { label: "Accepted", value: String(stats.acceptedCount), tone: "green" },
            { label: "Accepted Value", value: fmtMoney(stats.acceptedValue), tone: "green" },
          ]}
        />
      </div>

      <FilterableTable
        columns={columns}
        data={filtered}
        loading={loading}
        getRowId={(p) => p.id}
        onRowClick={(p) => router.push(`/dashboard/proposals/${p.id}`)}
        rowClassName="cursor-pointer"
        emptyState="No proposals match your filters."
        search={{ value: filters.search, onChange: (search) => setFilters({ ...filters, search }), placeholder: "Search proposals..." }}
        filters={
          <Select value={filters.status} onValueChange={(v) => setFilters({ ...filters, status: (v ?? "all") as Filters["status"] })}>
            <SelectTrigger size="sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All status</SelectItem>
              {STATUS_OPTIONS.map((status) => (
                <SelectItem key={status} value={status}>
                  <ProposalStatusBadge status={status} />
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        }
        onClearFilters={() => setFilters({ search: "", status: "all" })}
      />
    </div>
  );
}
