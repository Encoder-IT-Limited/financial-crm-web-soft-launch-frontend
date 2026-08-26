"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  type ColumnDef,
  type PaginationState,
  type RowSelectionState,
  type SortingState,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { Download, Eye, FileText, Plus } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeading } from "@/components/shared/page-heading";
import { TablePagination } from "@/components/shared/table-pagination";
import { toast } from "@/lib/toast";
import { downloadCsv } from "@/lib/csv";
import { fmtDate, fmtMoney } from "@/lib/format";
import { cn } from "@/lib/utils";
import {
  invoiceBalance,
  invoiceDisplayStatus,
  isInvoiceOverdue,
  type Invoice,
} from "../types";
import { invoiceApi } from "../api/invoices.service";
import { downloadInvoicePdf } from "../lib/invoice-print";
import { billingKeys } from "../query-keys";
import { useInvoices } from "../hooks/use-invoices";
import { useCustomers } from "../../crm/hooks/use-customers";
import { InvoiceStatusBadge } from "./invoice-status-badge";
import { StatTiles } from "./stat-tiles";
import { InvoicePreviewDialog } from "./invoice-preview-dialog";
import { RecurringTemplatesPanel } from "./recurring-templates-panel";
import { InvoicesBulkBar, InvoicesToolbar, type InvoiceFilters } from "./invoices-toolbar";
import { InvoicesTable, SortableHeader } from "./invoices-table";
import { InvoicesMobileList } from "./invoices-mobile-list";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyColumnDef<TData> = ColumnDef<TData, any>;

type Filters = InvoiceFilters;

export function InvoicesPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: invoices = [], isLoading: invoicesLoading, isError: invoicesError } = useInvoices();
  const { data: customers = [] } = useCustomers();
  const { data: org } = useQuery({ queryKey: ["org-profile"], queryFn: invoiceApi.getOrgProfile, staleTime: Infinity });
  const [filters, setFilters] = useState<Filters>({ search: "", status: "all", customer: "all" });
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 25 });
  const [sendingReminders, setSendingReminders] = useState(false);

  const customerName = (id: string) => customers.find((c) => c.id === id)?.name ?? "—";

  const filtered = useMemo(() => {
    const needle = filters.search.trim().toLowerCase();
    return invoices.filter((inv) => {
      if (filters.status !== "all" && invoiceDisplayStatus(inv) !== filters.status) return false;
      if (filters.customer !== "all" && inv.customerId !== filters.customer) return false;
      if (needle) {
        const haystack = `${inv.number} ${customerName(inv.customerId)} ${inv.notes ?? ""}`.toLowerCase();
        if (!haystack.includes(needle)) return false;
      }
      return true;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, invoices, customers]);

  const columns = useMemo<AnyColumnDef<Invoice>[]>(
    () => [
      {
        id: "select",
        size: 40,
        enableSorting: false,
        header: ({ table }) => (
          <Checkbox
            checked={table.getIsAllPageRowsSelected()}
            onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
            aria-label="Select all invoices"
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(value) => row.toggleSelected(!!value)}
            aria-label={`Select ${row.original.number}`}
            onClick={(e) => e.stopPropagation()}
          />
        ),
      },
      {
        accessorKey: "number",
        header: ({ column }) => <SortableHeader column={column} label="Invoice #" />,
        cell: ({ row }) => (
          <Link href={`/dashboard/invoices/${row.original.id}`} className="font-bold text-blue hover:underline">
            {row.original.number}
          </Link>
        ),
      },
      {
        id: "customer",
        accessorFn: (inv) => customerName(inv.customerId),
        header: "Customer",
        cell: ({ row }) => <span className="text-[13px] text-text">{customerName(row.original.customerId)}</span>,
      },
      {
        id: "issueDate",
        accessorFn: (inv) => inv.issueDate,
        header: ({ column }) => <SortableHeader column={column} label="Issue Date" />,
        cell: ({ row }) => <span className="text-[12.5px] text-text-2">{fmtDate(row.original.issueDate)}</span>,
      },
      {
        id: "dueDate",
        accessorFn: (inv) => inv.dueDate,
        header: ({ column }) => <SortableHeader column={column} label="Due Date" />,
        cell: ({ row }) => <span className="text-[12.5px] text-text-2">{fmtDate(row.original.dueDate)}</span>,
      },
      {
        id: "amount",
        accessorFn: (inv) => inv.total,
        header: ({ column }) => <SortableHeader column={column} label="Amount" align="right" />,
        cell: ({ row }) => (
          <span className="text-right text-[13px] font-semibold text-text">{fmtMoney(row.original.total, row.original.currency)}</span>
        ),
      },
      {
        id: "paid",
        accessorFn: (inv) => inv.paidAmount,
        header: ({ column }) => <SortableHeader column={column} label="Paid" align="right" />,
        cell: ({ row }) => (
          <span className="text-right text-[13px] font-semibold text-green">{fmtMoney(row.original.paidAmount, row.original.currency)}</span>
        ),
      },
      {
        id: "balance",
        accessorFn: (inv) => invoiceBalance(inv),
        header: ({ column }) => <SortableHeader column={column} label="Balance" align="right" />,
        cell: ({ row }) => {
          const balance = invoiceBalance(row.original);
          return (
            <span className={cn("text-right text-[13px] font-semibold", balance > 0 ? "text-amber" : "text-text-3")}>
              {fmtMoney(balance, row.original.currency)}
            </span>
          );
        },
      },
      {
        id: "status",
        accessorFn: (inv) => invoiceDisplayStatus(inv),
        header: "Status",
        enableSorting: false,
        cell: ({ row }) => <InvoiceStatusBadge status={invoiceDisplayStatus(row.original)} />,
      },
      {
        id: "actions",
        header: "",
        enableSorting: false,
        cell: ({ row }) => (
          <div className="flex items-center justify-end gap-1">
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label={`Preview ${row.original.number}`}
              onClick={(e) => {
                e.stopPropagation();
                setPreviewId(row.original.id);
              }}
            >
              <Eye />
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label={`Download ${row.original.number}`}
              onClick={(e) => {
                e.stopPropagation();
                if (!org) {
                  toast.error("Unable to generate PDF — try again in a moment");
                  return;
                }
                downloadInvoicePdf(row.original, customers.find((c) => c.id === row.original.customerId), org);
                toast.success(`Downloaded ${row.original.number}.pdf`);
              }}
            >
              <Download />
            </Button>
            <Link
              href={`/dashboard/invoices/${row.original.id}`}
              className={buttonVariants({ variant: "ghost", size: "icon-sm" })}
              aria-label={`Open ${row.original.number}`}
            >
              <FileText />
            </Link>
          </div>
        ),
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [customers, org]
  );

  const table = useReactTable({
    data: filtered,
    columns,
    state: { sorting, rowSelection, pagination },
    onSortingChange: setSorting,
    onRowSelectionChange: setRowSelection,
    onPaginationChange: setPagination,
    getRowId: (inv) => inv.id,
    enableRowSelection: true,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  const stats = useMemo(() => {
    const live = invoices.filter((inv) => inv.status !== "cancelled");
    const outstanding = live.reduce((sum, inv) => sum + invoiceBalance(inv), 0);
    const overdue = invoices.filter(isInvoiceOverdue).reduce((sum, inv) => sum + invoiceBalance(inv), 0);
    const drafts = invoices.filter((inv) => inv.status === "draft").length;
    const paidThisMonth = invoices
      .filter((inv) => inv.status === "paid" && inv.paidAmount > 0)
      .reduce((sum, inv) => sum + inv.paidAmount, 0);
    return { outstanding, overdue, drafts, paidThisMonth };
  }, [invoices]);

  const previewInvoice = previewId ? invoices.find((inv) => inv.id === previewId) ?? null : null;

  const selected = table.getFilteredSelectedRowModel().rows.map((row) => row.original);
  const selectedEligibleForReminder = selected.filter(
    (inv) => inv.status === "sent" || inv.status === "partially-paid"
  );

  function exportCsv(rows: Invoice[]) {
    downloadCsv(
      "invoices.csv",
      ["Invoice #", "Customer", "Issue Date", "Due Date", "Amount", "Paid", "Balance", "Status"],
      rows.map((inv) => [
        inv.number,
        customerName(inv.customerId),
        fmtDate(inv.issueDate),
        fmtDate(inv.dueDate),
        inv.total,
        inv.paidAmount,
        invoiceBalance(inv),
        invoiceDisplayStatus(inv),
      ])
    );
    toast.success(`${rows.length} invoice${rows.length === 1 ? "" : "s"} exported to CSV`);
  }

  async function sendRemindersToSelected() {
    if (selectedEligibleForReminder.length === 0) {
      toast.info("None of the selected invoices are sent or partially paid");
      return;
    }
    setSendingReminders(true);
    try {
      await Promise.all(selectedEligibleForReminder.map((inv) => invoiceApi.sendReminder(inv.id)));
      await queryClient.invalidateQueries({ queryKey: billingKeys.invoices() });
      toast.success(`Reminder sent for ${selectedEligibleForReminder.length} invoice(s)`);
      setRowSelection({});
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not send reminders");
    } finally {
      setSendingReminders(false);
    }
  }

  const rows = table.getRowModel().rows;

  return (
    <div>
      <PageHeading
        title="Invoices"
        subtitle="Create, send and track invoices with QR code & PDF"
        actions={
          <>
            <Button variant="outline" size="sm" onClick={() => exportCsv(filtered)}>
              <Download /> Excel
            </Button>
            <Link href="/dashboard/invoices/new">
              <Button size="sm">
                <Plus /> New Invoice
              </Button>
            </Link>
          </>
        }
      />

      <Tabs defaultValue="invoices" className="mt-4">
        <TabsList variant="line">
          <TabsTrigger value="invoices">Invoices</TabsTrigger>
          <TabsTrigger value="recurring">Recurring</TabsTrigger>
        </TabsList>

        <TabsContent value="invoices" className="mt-4">
          <StatTiles
            tiles={[
              { label: "Outstanding", value: fmtMoney(stats.outstanding), tone: "amber" },
              { label: "Overdue", value: fmtMoney(stats.overdue), tone: "red", sub: "past due date" },
              { label: "Collected", value: fmtMoney(stats.paidThisMonth), tone: "green", sub: "all-time paid" },
              { label: "Drafts", value: String(stats.drafts), tone: "neutral", sub: "not yet sent" },
            ]}
          />

          <Card className="mt-4 gap-0 p-0">
            <InvoicesToolbar
              filters={filters}
              onFiltersChange={(next) => {
                setFilters(next);
                setPagination((p) => ({ ...p, pageIndex: 0 }));
              }}
              customers={customers}
              filteredCount={filtered.length}
              totalCount={invoices.length}
            />
            <InvoicesBulkBar
              selectedCount={selected.length}
              sendingReminders={sendingReminders}
              reminderEligibleCount={selectedEligibleForReminder.length}
              onExportSelected={() => exportCsv(selected)}
              onSendReminders={sendRemindersToSelected}
              onClear={() => setRowSelection({})}
            />
            <InvoicesTable
              table={table}
              onRowClick={(inv) => router.push(`/dashboard/invoices/${inv.id}`)}
              loading={invoicesLoading}
              error={invoicesError ? "Couldn't load invoices. Try refreshing the page." : undefined}
            />
            <InvoicesMobileList
              invoices={rows.map((r) => r.original)}
              customerName={customerName}
              loading={invoicesLoading}
              error={invoicesError ? "Couldn't load invoices. Try refreshing the page." : undefined}
            />
            <div className="border-t border-border px-3">
              <TablePagination table={table} totalCount={filtered.length} pageSizeOptions={[10, 25, 50]} />
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="recurring" className="mt-4">
          <RecurringTemplatesPanel />
        </TabsContent>
      </Tabs>

      <InvoicePreviewDialog
        invoice={previewInvoice}
        open={previewId !== null}
        onOpenChange={(open) => {
          if (!open) setPreviewId(null);
        }}
      />
    </div>
  );
}
