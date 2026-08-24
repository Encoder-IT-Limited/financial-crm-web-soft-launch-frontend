"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import { ArrowLeft, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeading } from "@/components/shared/page-heading";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { SimpleTable } from "@/components/shared/simple-table";
import { fmtDate, fmtMoney } from "@/lib/format";
import { invoiceApi } from "../../../dashboard/invoices/api/invoices.service";
import { proposalsApi } from "../../../dashboard/invoices/api/proposals.service";
import { retainersApi } from "../../../dashboard/invoices/api/retainers.service";
import {
  invoiceBalance,
  invoiceDisplayStatus,
  PAYMENT_METHOD_LABELS,
  proposalDisplayStatus,
  retainerDisplayStatus,
  type Invoice,
  type Proposal,
  type Retainer,
} from "../../../dashboard/invoices/types";
import { InvoiceStatusBadge } from "../../../dashboard/invoices/components/invoice-status-badge";
import { ProposalStatusBadge } from "../../../dashboard/invoices/components/proposal-status-badge";
import { RetainerStatusBadge } from "../../../dashboard/invoices/components/retainer-status-badge";
import { RetainerDetailsDialog } from "../../../dashboard/invoices/components/retainer-details-dialog";
import { RetainerFormDialog } from "../../../dashboard/invoices/components/retainer-form-dialog";
import { StatTiles } from "../../../dashboard/invoices/components/stat-tiles";
import { customersApi } from "../api/customers.service";
import { CustomerStatusBadge } from "./customer-status-badge";
import { CustomerEditDialog } from "./customer-edit-dialog";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyColumnDef<TData> = ColumnDef<TData, any>;

export function CustomerDetail() {
  const params = useParams<{ customerId: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data: customer, isLoading: customerLoading } = useQuery({
    queryKey: ["customer", params.customerId],
    queryFn: () => customersApi.get(params.customerId),
  });
  const { data: invoices = [] } = useQuery({ queryKey: ["invoices"], queryFn: invoiceApi.list });
  const { data: proposals = [] } = useQuery({ queryKey: ["proposals"], queryFn: proposalsApi.list });
  const { data: retainers = [] } = useQuery({ queryKey: ["retainers"], queryFn: retainersApi.list });

  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [retainerDetailsId, setRetainerDetailsId] = useState<string | null>(null);
  const [retainerEditId, setRetainerEditId] = useState<string | null>(null);

  useEffect(() => {
    if (!customerLoading && !customer) {
      const timer = setTimeout(() => router.replace("/dashboard/customers"), 400);
      return () => clearTimeout(timer);
    }
  }, [customerLoading, customer, router]);

  const customerInvoices = useMemo(
    () => invoices.filter((inv) => inv.customerId === params.customerId),
    [invoices, params.customerId]
  );

  const payments = useMemo(
    () =>
      customerInvoices
        .flatMap((inv) => inv.payments.map((payment) => ({ ...payment, invoiceNumber: inv.number, currency: inv.currency })))
        .sort((a, b) => (a.date < b.date ? 1 : -1)),
    [customerInvoices]
  );

  const stats = useMemo(() => {
    const live = customerInvoices.filter((inv) => inv.status !== "cancelled");
    const totalInvoiced = live.reduce((sum, inv) => sum + inv.total, 0);
    const outstanding = live.reduce((sum, inv) => sum + invoiceBalance(inv), 0);
    const totalPaid = live.reduce((sum, inv) => sum + inv.paidAmount, 0);
    return { totalInvoiced, outstanding, totalPaid };
  }, [customerInvoices]);

  const customerRetainers = useMemo(
    () => retainers.filter((r) => r.customerId === params.customerId),
    [retainers, params.customerId]
  );

  const customerProposals = useMemo(
    () => proposals.filter((p) => p.customerId === params.customerId),
    [proposals, params.customerId]
  );

  const invoiceColumns: AnyColumnDef<Invoice>[] = [
    {
      accessorKey: "number",
      header: "Invoice #",
      cell: ({ row }) => (
        <Link href={`/dashboard/invoices/${row.original.id}`} className="font-semibold text-blue hover:underline">
          {row.original.number}
        </Link>
      ),
    },
    { id: "issueDate", header: "Issue Date", cell: ({ row }) => fmtDate(row.original.issueDate) },
    { id: "dueDate", header: "Due Date", cell: ({ row }) => fmtDate(row.original.dueDate) },
    {
      id: "total",
      header: "Total",
      cell: ({ row }) => fmtMoney(row.original.total, row.original.currency),
    },
    {
      id: "status",
      header: "Status",
      cell: ({ row }) => <InvoiceStatusBadge status={invoiceDisplayStatus(row.original)} />,
    },
  ];

  const proposalColumns: AnyColumnDef<Proposal>[] = [
    {
      accessorKey: "number",
      header: "Proposal #",
      cell: ({ row }) => (
        <Link href={`/dashboard/proposals/${row.original.id}`} className="font-semibold text-blue hover:underline">
          {row.original.number}
        </Link>
      ),
    },
    { id: "date", header: "Date", cell: ({ row }) => fmtDate(row.original.date) },
    { id: "expiryDate", header: "Expires", cell: ({ row }) => fmtDate(row.original.expiryDate) },
    { id: "total", header: "Amount", cell: ({ row }) => fmtMoney(row.original.total, row.original.currency) },
    {
      id: "status",
      header: "Status",
      cell: ({ row }) => <ProposalStatusBadge status={proposalDisplayStatus(row.original)} />,
    },
  ];

  const retainerColumns: AnyColumnDef<Retainer>[] = [
    { accessorKey: "number", header: "Retainer #", cell: ({ row }) => <span className="font-semibold text-blue">{row.original.number}</span> },
    { id: "contractAmount", header: "Contract", cell: ({ row }) => fmtMoney(row.original.contractAmount, row.original.currency) },
    { id: "remainingBalance", header: "Remaining", cell: ({ row }) => fmtMoney(row.original.remainingBalance, row.original.currency) },
    { id: "billingModel", header: "Type", cell: ({ row }) => (row.original.billingModel === "recurring" ? "Recurring" : "One-time") },
    {
      id: "status",
      header: "Status",
      cell: ({ row }) => <RetainerStatusBadge status={retainerDisplayStatus(row.original)} />,
    },
  ];

  if (customerLoading || !customer) {
    return (
      <div className="flex h-64 items-center justify-center text-[13px] text-text-4">
        {customerLoading ? "Loading customer…" : "Customer not found — redirecting…"}
      </div>
    );
  }

  return (
    <div>
      <PageHeading
        title={customer.name}
        subtitle={customer.customerCode}
        actions={
          <>
            <Button variant="outline" size="sm" onClick={() => router.push("/dashboard/customers")}>
              <ArrowLeft /> Back
            </Button>
            <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
              <Pencil /> Edit
            </Button>
            <Button variant="ghost" size="sm" className="text-red" onClick={() => setDeleteOpen(true)}>
              <Trash2 /> Delete
            </Button>
          </>
        }
      />

      <div className="mb-4 flex items-center gap-2">
        <CustomerStatusBadge status={customer.status} />
      </div>

      <StatTiles
        tiles={[
          { label: "Total Invoiced", value: fmtMoney(stats.totalInvoiced, customer.currency), tone: "blue" },
          { label: "Outstanding", value: fmtMoney(stats.outstanding, customer.currency), tone: "amber" },
          { label: "Collected", value: fmtMoney(stats.totalPaid, customer.currency), tone: "green" },
          { label: "Credit Limit", value: fmtMoney(customer.creditLimit, customer.currency), tone: "neutral" },
        ]}
      />

      <Tabs defaultValue="overview" className="mt-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="invoices">Invoices ({customerInvoices.length})</TabsTrigger>
          <TabsTrigger value="payments">Payments ({payments.length})</TabsTrigger>
          <TabsTrigger value="proposals">Proposals ({customerProposals.length})</TabsTrigger>
          <TabsTrigger value="retainers">Retainers ({customerRetainers.length})</TabsTrigger>
          <TabsTrigger value="credit-notes">Credit Notes</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-4">
          <Card className="gap-3 p-5">
            <div className="text-sm font-bold text-text">Contact information</div>
            <div className="grid gap-3 sm:grid-cols-2">
              <OverviewField label="Email" value={customer.email} />
              <OverviewField label="Phone" value={customer.phone} />
              <OverviewField label="Address" value={customer.address} />
              <OverviewField label="TRN" value={customer.trn} />
              <OverviewField label="Currency" value={customer.currency} />
              <OverviewField label="Opening Balance" value={fmtMoney(customer.openingBalance, customer.currency)} />
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="invoices" className="mt-4">
          <SimpleTable
            columns={invoiceColumns}
            data={customerInvoices}
            emptyState="No invoices for this customer yet."
          />
        </TabsContent>

        <TabsContent value="payments" className="mt-4">
          <Card className="gap-0 p-0">
            {payments.length === 0 ? (
              <div className="px-5 py-10 text-center text-[12.5px] text-text-4">No payments recorded yet.</div>
            ) : (
              <div className="flex flex-col divide-y divide-border">
                {payments.map((payment) => (
                  <div key={payment.id} className="flex items-start justify-between gap-3 px-5 py-3.5">
                    <div>
                      <div className="text-[13px] font-semibold text-text">{fmtMoney(payment.amount, payment.currency)}</div>
                      <div className="mt-0.5 text-[11px] text-text-3">
                        {payment.invoiceNumber} · {PAYMENT_METHOD_LABELS[payment.method]}
                        {payment.reference ? ` · ${payment.reference}` : ""}
                      </div>
                    </div>
                    <span className="text-[11.5px] text-text-4">{fmtDate(payment.date)}</span>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="proposals" className="mt-4">
          <SimpleTable columns={proposalColumns} data={customerProposals} emptyState="No proposals for this customer yet." />
        </TabsContent>

        <TabsContent value="retainers" className="mt-4">
          <SimpleTable
            columns={retainerColumns}
            data={customerRetainers}
            emptyState="No retainers for this customer yet."
            onRowClick={(retainer) => setRetainerDetailsId(retainer.id)}
          />
        </TabsContent>

        <TabsContent value="credit-notes" className="mt-4">
          <ComingSoonPanel text="Credit and debit notes will appear here once that module is built." />
        </TabsContent>
      </Tabs>

      <CustomerEditDialog open={editOpen} onOpenChange={setEditOpen} customerId={customer.id} />

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title={`Delete ${customer.name}?`}
        description="This permanently removes the customer from your CRM."
        confirmLabel="Delete customer"
        destructive
        onConfirm={async () => {
          await customersApi.remove(customer.id);
          queryClient.invalidateQueries({ queryKey: ["customers"] });
          router.replace("/dashboard/customers");
        }}
        successMessage={`${customer.name} deleted`}
      />

      {retainerDetailsId && (
        <RetainerDetailsDialog
          open={!!retainerDetailsId}
          onOpenChange={(open) => !open && setRetainerDetailsId(null)}
          retainerId={retainerDetailsId}
          onEdit={() => {
            setRetainerEditId(retainerDetailsId);
            setRetainerDetailsId(null);
          }}
        />
      )}
      {retainerEditId && (
        <RetainerFormDialog open={!!retainerEditId} onOpenChange={(open) => !open && setRetainerEditId(null)} retainerId={retainerEditId} />
      )}
    </div>
  );
}

function OverviewField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[10.5px] font-bold uppercase tracking-wide text-text-4">{label}</div>
      <div className="mt-0.5 text-[13px] text-text">{value || "—"}</div>
    </div>
  );
}

function ComingSoonPanel({ text }: { text: string }) {
  return (
    <div className="flex min-h-[160px] flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-border text-center">
      <p className="text-[13px] font-semibold text-text-3">Coming soon</p>
      <p className="max-w-xs text-[12px] text-text-4">{text}</p>
    </div>
  );
}
