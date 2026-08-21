"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeading } from "@/components/shared/page-heading";
import { FilterableTable } from "@/components/shared/filterable-table";
import { fmtDate, fmtMoney } from "@/lib/format";
import { customersApi } from "../../crm/api/customers.service";
import { invoiceApi } from "../api/invoices.service";
import { adjustmentsApi } from "../api/adjustments.service";
import type { Adjustment, AdjustmentKind } from "../types";
import { AdjustmentStatusBadge } from "./adjustment-status-badge";
import { AdjustmentFormDialog } from "./adjustment-form-dialog";
import { AdjustmentDetailsDialog } from "./adjustment-details-dialog";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyColumnDef<TData> = ColumnDef<TData, any>;

export function AdjustmentsPage() {
  const { data: adjustments = [], isLoading } = useQuery({ queryKey: ["adjustments"], queryFn: adjustmentsApi.list });
  const { data: customers = [] } = useQuery({ queryKey: ["customers"], queryFn: customersApi.list });
  const { data: invoices = [] } = useQuery({ queryKey: ["invoices"], queryFn: invoiceApi.list });

  const [tab, setTab] = useState<AdjustmentKind>("credit");
  const [createOpen, setCreateOpen] = useState(false);
  const [detailsId, setDetailsId] = useState<string | null>(null);

  const customerName = (id: string) => customers.find((c) => c.id === id)?.name ?? "—";
  const invoiceNumber = (id?: string) => (id ? invoices.find((inv) => inv.id === id)?.number ?? "—" : "—");

  const credits = useMemo(() => adjustments.filter((a) => a.kind === "credit"), [adjustments]);
  const debits = useMemo(() => adjustments.filter((a) => a.kind === "debit"), [adjustments]);

  const columns: AnyColumnDef<Adjustment>[] = [
    { accessorKey: "number", header: "Number", cell: ({ row }) => <span className="font-bold text-text">{row.original.number}</span> },
    {
      id: "customer",
      accessorFn: (a: Adjustment) => customerName(a.customerId),
      header: "Customer",
      cell: ({ row }) => customerName(row.original.customerId),
    },
    {
      id: "invoice",
      accessorFn: (a: Adjustment) => invoiceNumber(a.invoiceId),
      header: "Invoice",
      cell: ({ row }) => invoiceNumber(row.original.invoiceId),
    },
    {
      id: "amount",
      accessorFn: (a: Adjustment) => a.amount,
      header: "Amount",
      cell: ({ row }) => <span className="font-semibold text-text">{fmtMoney(row.original.amount, row.original.currency)}</span>,
    },
    { id: "date", accessorFn: (a: Adjustment) => a.createdAt, header: "Date", cell: ({ row }) => fmtDate(row.original.createdAt) },
    {
      id: "status",
      accessorFn: (a: Adjustment) => a.status,
      header: "Status",
      enableSorting: false,
      cell: ({ row }) => <AdjustmentStatusBadge status={row.original.status} />,
    },
  ];

  return (
    <div>
      <PageHeading
        title="Credit & Debit Notes"
        subtitle="Adjust amounts owed to or by customers"
        actions={
          <Button size="sm" onClick={() => setCreateOpen(true)}>
            <Plus /> New {tab === "credit" ? "Credit" : "Debit"} Note
          </Button>
        }
      />

      <Tabs value={tab} onValueChange={(v) => v && setTab(v as AdjustmentKind)}>
        <TabsList variant="line">
          <TabsTrigger value="credit">Credit Notes ({credits.length})</TabsTrigger>
          <TabsTrigger value="debit">Debit Notes ({debits.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="credit" className="mt-4">
          <FilterableTable
            columns={columns}
            data={credits}
            loading={isLoading}
            getRowId={(a) => a.id}
            onRowClick={(a) => setDetailsId(a.id)}
            rowClassName="cursor-pointer"
            emptyState="No credit notes issued yet."
          />
        </TabsContent>

        <TabsContent value="debit" className="mt-4">
          <FilterableTable
            columns={columns}
            data={debits}
            loading={isLoading}
            getRowId={(a) => a.id}
            onRowClick={(a) => setDetailsId(a.id)}
            rowClassName="cursor-pointer"
            emptyState="No debit notes issued yet."
          />
        </TabsContent>
      </Tabs>

      <AdjustmentFormDialog open={createOpen} onOpenChange={setCreateOpen} kind={tab} />

      {detailsId && (
        <AdjustmentDetailsDialog open={!!detailsId} onOpenChange={(open) => !open && setDetailsId(null)} adjustmentId={detailsId} />
      )}
    </div>
  );
}
