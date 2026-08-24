"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { type RowSelectionState, type SortingState, getCoreRowModel, getSortedRowModel, useReactTable } from "@tanstack/react-table";
import { Download, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeading } from "@/components/shared/page-heading";
import { toast } from "@/lib/toast";
import { downloadCsv } from "@/lib/csv";
import { fmtDate, fmtMoney } from "@/lib/format";
import { invoiceBalance, invoiceDisplayStatus, isInvoiceOverdue, type Invoice } from "../types";
import { invoiceApi } from "../api/invoices.service";
import { customersApi } from "../../../modules/crm/api/customers.service";
import { StatTiles } from "./stat-tiles";
import { InvoicePreviewDialog } from "./invoice-preview-dialog";
import { RecurringTemplatesPanel } from "./recurring-templates-panel";
import { useInvoiceColumns } from "./invoice-columns";
import { InvoicesToolbar, type InvoiceFilters } from "./invoices-toolbar";
import { InvoicesTable } from "./invoices-table";
import { InvoicesMobileList } from "./invoices-mobile-list";

export function InvoicesList() {
  const queryClient = useQueryClient();
  const { data: invoices = [] } = useQuery({ queryKey: ["invoices"], queryFn: invoiceApi.list });
  const { data: customers = [] } = useQuery({ queryKey: ["customers"], queryFn: customersApi.list });
  const [filters, setFilters] = useState<InvoiceFilters>({ search: "", status: "all", customer: "all" });
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
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

  const columns = useInvoiceColumns({ customers, onPreview: setPreviewId });

  const table = useReactTable({
    data: filtered,
    columns,
    state: { sorting, rowSelection },
    onSortingChange: setSorting,
    onRowSelectionChange: setRowSelection,
    getRowId: (inv) => inv.id,
    enableRowSelection: true,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
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
  const selectedEligibleForReminder = selected.filter((inv) => inv.status === "sent" || inv.status === "partially-paid");

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
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      toast.success(`Reminder sent for ${selectedEligibleForReminder.length} invoice(s)`);
      setRowSelection({});
    } finally {
      setSendingReminders(false);
    }
  }

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
              onFiltersChange={setFilters}
              customers={customers}
              filteredCount={filtered.length}
              totalCount={invoices.length}
              selectedCount={selected.length}
              onExportSelected={() => exportCsv(selected)}
              sendingReminders={sendingReminders}
              reminderEligibleCount={selectedEligibleForReminder.length}
              onSendReminders={sendRemindersToSelected}
              onClearSelection={() => setRowSelection({})}
            />

            <InvoicesTable table={table} columnCount={columns.length} />
            <InvoicesMobileList invoices={filtered} customers={customers} />
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
