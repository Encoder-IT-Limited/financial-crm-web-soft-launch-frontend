"use client";

import { useMemo, useState } from "react";
import {
  type ColumnDef,
  type PaginationState,
  type RowSelectionState,
  type SortingState,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { format } from "date-fns";
import {
  ChevronDown,
  ChevronUp,
  ChevronsUpDown,
  Copy,
  Download,
  Eye,
  MapPin,
  Pencil,
  Plus,
  Printer,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PageHeading } from "@/components/shared/page-heading";
import { TablePagination } from "@/components/shared/table-pagination";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";
import {
  NEWEST_RECEIPT_DATE,
  RECEIPT_STATUS_LABEL,
  RECEIPT_SUPPLIERS,
  RECEIPT_WAREHOUSES,
  goodsReceipts,
  nextReceiptId,
  openPurchaseOrders,
  type GoodsReceipt,
  type ReceiptStatus,
  type ReceiptSubmission,
} from "../mock-data";
import { ReceiptSummaryCards } from "./receipt-summary-cards";
import { ReceiptsToolbar, type ReceiptFilters } from "./receipts-toolbar";
import { RecordReceiptDialog } from "./record-receipt-dialog";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyColumnDef<TData> = ColumnDef<TData, any>;

const DAY_MS = 24 * 60 * 60 * 1000;

/** The design system ships five semantic tones and no dedicated orange, so
 * Partially Received uses purple to stay distinct from Pending (amber). */
const statusTone: Record<ReceiptStatus, "amber" | "purple" | "green" | "red"> = {
  pending: "amber",
  "partially-received": "purple",
  completed: "green",
  overdue: "red",
};

function exportReceiptsCsv(rows: GoodsReceipt[]) {
  const header = [
    "Receipt ID",
    "Purchase Order",
    "Supplier",
    "Warehouse",
    "Expected Items",
    "Received Items",
    "Receipt Date",
    "Expected Date",
    "Status",
  ];
  const body = rows.map((r) => [
    r.id,
    r.poNumber,
    r.supplier,
    r.warehouse,
    String(r.expectedItems),
    String(r.receivedItems),
    r.receiptDate ? format(new Date(r.receiptDate), "MMM d, yyyy - h:mm a") : "",
    format(new Date(r.expectedDate), "MMM d, yyyy"),
    RECEIPT_STATUS_LABEL[r.status],
  ]);
  const csv = [header, ...body]
    .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
    .join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `goods_receipts_${new Date().toISOString().slice(0, 10)}.csv`;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function GoodsReceiptsPage() {
  const [items, setItems] = useState<GoodsReceipt[]>(goodsReceipts);
  const [purchaseOrders, setPurchaseOrders] = useState(openPurchaseOrders);
  const [filters, setFilters] = useState<ReceiptFilters>({
    search: "",
    status: "all",
    supplier: "all",
    warehouse: "all",
    range: "all",
  });
  const [sorting, setSorting] = useState<SortingState>([]);
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 10 });
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [dialogOpen, setDialogOpen] = useState(false);

  const summary = useMemo(() => {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const weekAgo = now.getTime() - 7 * DAY_MS;

    return {
      pending: items.filter((r) => r.status === "pending").length,
      receivedToday: items.filter(
        (r) => r.receiptDate && new Date(r.receiptDate).getTime() >= todayStart
      ).length,
      completedThisWeek: items.filter(
        (r) =>
          r.status === "completed" &&
          r.receiptDate &&
          new Date(r.receiptDate).getTime() >= weekAgo
      ).length,
      overdue: items.filter((r) => r.status === "overdue").length,
    };
  }, [items]);

  const filtered = useMemo(() => {
    const needle = filters.search.trim().toLowerCase();
    const anchor = new Date(NEWEST_RECEIPT_DATE).getTime();
    const cutoff = filters.range === "all" ? 0 : anchor - Number(filters.range) * DAY_MS;

    return items.filter((r) => {
      if (filters.status !== "all" && r.status !== filters.status) return false;
      if (filters.supplier !== "all" && r.supplier !== filters.supplier) return false;
      if (filters.warehouse !== "all" && r.warehouse !== filters.warehouse) return false;
      if ((new Date(r.receiptDate ?? r.expectedDate)).getTime() < cutoff) return false;
      if (needle) {
        const haystack = [
          r.id,
          r.poNumber,
          r.supplier,
          r.warehouse,
          ...r.lines.flatMap((line) => [line.name, line.sku]),
        ]
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(needle)) return false;
      }
      return true;
    });
  }, [items, filters]);

  function clearFilters() {
    setFilters({ search: "", status: "all", supplier: "all", warehouse: "all", range: "all" });
    setSorting([]);
  }

  function handleRecord(submission: ReceiptSubmission) {
    const receipt: GoodsReceipt = {
      id: nextReceiptId(items),
      poNumber: submission.poNumber,
      supplier: submission.supplier,
      supplierContact: submission.supplierContact,
      warehouse: submission.warehouse,
      expectedItems: submission.lines.reduce((sum, l) => sum + (l.orderedQty - l.receivedQty), 0),
      receivedItems: submission.lines.reduce((sum, l) => sum + l.receivedNow, 0),
      receiptDate: new Date().toISOString(),
      expectedDate: submission.expectedDate,
      status: submission.lines.every((l) => l.receivedNow >= l.orderedQty - l.receivedQty)
        ? "completed"
        : "partially-received",
      lines: submission.lines.map((l) => ({
        productId: l.productId,
        sku: l.sku,
        name: l.name,
        unit: l.unit,
        expectedQty: l.orderedQty - l.receivedQty,
        receivedQty: l.receivedNow,
      })),
    };

    setItems((prev) => [receipt, ...prev]);
    setPurchaseOrders((prev) =>
      prev
        .map((po) =>
          po.poNumber === submission.poNumber
            ? {
                ...po,
                lines: po.lines.map((line) => {
                  const match = submission.lines.find((l) => l.sku === line.sku);
                  return match ? { ...line, receivedQty: line.receivedQty + match.receivedNow } : line;
                }),
              }
            : po
        )
        .filter((po) => po.lines.some((line) => line.receivedQty < line.orderedQty))
    );
    toast.success("Receipt recorded", {
      description: `${receipt.receivedItems} of ${receipt.expectedItems} items received against ${submission.poNumber}.`,
    });
  }

  const columns = useMemo<AnyColumnDef<GoodsReceipt>[]>(
    () => [
      {
        id: "select",
        enableSorting: false,
        enableHiding: false,
        header: ({ table }) => (
          <Checkbox
            aria-label="Select all receipts on this page"
            checked={table.getIsAllPageRowsSelected()}
            indeterminate={table.getIsSomePageRowsSelected()}
            onCheckedChange={(checked) => table.toggleAllPageRowsSelected(checked === true)}
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            aria-label={`Select receipt ${row.original.id}`}
            checked={row.getIsSelected()}
            onCheckedChange={(checked) => row.toggleSelected(checked === true)}
          />
        ),
      },
      {
        accessorKey: "id",
        header: "Receipt ID",
        cell: ({ row }) => (
          <span className="flex items-center gap-1.5">
            <span className="text-[12.5px] font-semibold tabular-nums text-text min-[1440px]:text-[13.5px]">
              {row.original.id}
            </span>
            <Button
              variant="ghost"
              size="icon-sm"
              className="size-6"
              aria-label={`Copy ${row.original.id}`}
              onClick={() => {
                navigator.clipboard.writeText(row.original.id);
                toast.success("Receipt ID copied");
              }}
            >
              <Copy />
            </Button>
          </span>
        ),
      },
      {
        accessorKey: "poNumber",
        header: "Purchase Order",
        cell: ({ row }) => (
          <button
            type="button"
            onClick={() =>
              toast.info(`${row.original.poNumber} will open once the purchasing module is connected`)
            }
            className="text-[12.5px] font-semibold text-blue underline-offset-2 hover:underline min-[1440px]:text-[13.5px]"
          >
            {row.original.poNumber}
          </button>
        ),
      },
      {
        accessorKey: "supplier",
        header: "Supplier",
        cell: ({ row }) => (
          <span className="flex min-w-0 flex-col">
            <span className="max-w-[170px] truncate text-[13px] font-semibold text-text min-[1440px]:text-[13.5px]">
              {row.original.supplier}
            </span>
            <span className="max-w-[170px] truncate text-[11px] text-text-4">
              {row.original.supplierContact}
            </span>
          </span>
        ),
      },
      {
        accessorKey: "warehouse",
        header: "Warehouse",
        cell: ({ row }) => (
          <span className="flex items-center gap-1.5 text-[12.5px] font-semibold text-text min-[1440px]:text-[13.5px]">
            <MapPin className="size-3.5 shrink-0 text-text-4" aria-hidden />
            <span className="max-w-[150px] truncate">{row.original.warehouse}</span>
          </span>
        ),
      },
      {
        accessorKey: "expectedItems",
        header: "Expected Items",
        cell: ({ row }) => (
          <span className="text-[12.5px] font-semibold tabular-nums text-text min-[1440px]:text-[13.5px]">
            {row.original.expectedItems}
          </span>
        ),
      },
      {
        accessorKey: "receivedItems",
        header: "Received Items",
        cell: ({ row }) => {
          const { expectedItems, receivedItems, status } = row.original;
          const pct =
            expectedItems === 0 ? 0 : Math.min(100, Math.round((receivedItems / expectedItems) * 100));
          const tone =
            status === "overdue" && pct < 100 ? "bg-red" : pct >= 100 ? "bg-green" : "bg-blue";
          return (
            <div className="flex min-w-[120px] flex-col gap-1">
              <span className="text-[12.5px] font-semibold tabular-nums text-text min-[1440px]:text-[13.5px]">
                {receivedItems} <span className="font-medium text-text-3">/ {expectedItems}</span>
              </span>
              <div className="h-1.5 overflow-hidden rounded-full bg-surface-subtle">
                <div className={cn("h-full rounded-full", tone)} style={{ width: `${pct}%` }} />
              </div>
            </div>
          );
        },
      },
      {
        id: "receiptDate",
        accessorFn: (receipt) => receipt.receiptDate ?? "",
        header: "Receipt Date",
        cell: ({ row }) => (
          <span className="text-[12.5px] font-medium tabular-nums text-text-2 min-[1440px]:text-[13.5px]">
            {row.original.receiptDate
              ? format(new Date(row.original.receiptDate), "MMM d, yyyy - h:mm a")
              : "—"}
          </span>
        ),
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => (
          <Badge tone={statusTone[row.original.status]}>
            {RECEIPT_STATUS_LABEL[row.original.status]}
          </Badge>
        ),
      },
      {
        id: "actions",
        header: "",
        enableSorting: false,
        cell: ({ row }) => {
          const receipt = row.original;
          return (
            <span className="flex items-center justify-end gap-0.5">
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label={`View details of ${receipt.id}`}
                onClick={() =>
                  toast.info("Receipt details will be available once the inventory API is connected")
                }
              >
                <Eye />
              </Button>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label={`Edit ${receipt.id}`}
                onClick={() =>
                  toast.info("Editing will be available once the inventory API is connected")
                }
              >
                <Pencil />
              </Button>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label={`Print ${receipt.id}`}
                onClick={() =>
                  toast.info(`Printing ${receipt.id} will be available once the inventory API is connected`)
                }
              >
                <Printer />
              </Button>
            </span>
          );
        },
      },
    ],
    []
  );

  const table = useReactTable({
    data: filtered,
    columns,
    state: { sorting, pagination, rowSelection },
    onSortingChange: setSorting,
    onPaginationChange: setPagination,
    onRowSelectionChange: setRowSelection,
    enableRowSelection: true,
    getRowId: (r) => r.id,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  const rows = table.getRowModel().rows;

  function handleExport() {
    exportReceiptsCsv(filtered);
    toast.success("Goods receipts exported", {
      description: `${filtered.length} receipt${filtered.length === 1 ? "" : "s"} downloaded as CSV.`,
    });
  }

  return (
    <div className="flex flex-col gap-5">
      <PageHeading
        title="Goods Receipt"
        subtitle="Manage incoming stock from suppliers"
        actions={
          <>
            <Button variant="outline" onClick={handleExport}>
              <Download data-icon="inline-start" />
              Export
            </Button>
            <Button onClick={() => setDialogOpen(true)}>
              <Plus data-icon="inline-start" />
              Record Receipt
            </Button>
          </>
        }
      />

      <ReceiptSummaryCards {...summary} />

      <Card className="flex flex-col gap-4 p-5">
        <ReceiptsToolbar
          filters={filters}
          onChange={setFilters}
          suppliers={RECEIPT_SUPPLIERS}
          warehouses={RECEIPT_WAREHOUSES}
        />

        {filtered.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-14 text-center">
            <p className="text-sm font-semibold text-text">No receipts found</p>
            <p className="max-w-xs text-[12.5px] text-text-3">
              Nothing matches the current search or filters.
            </p>
            <Button variant="outline" size="sm" onClick={clearFilters}>
              Clear filters
            </Button>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto overflow-y-hidden rounded-[10px] border border-border">
              <Table className="whitespace-nowrap">
                <TableHeader>
                  {table.getHeaderGroups().map((headerGroup) => (
                    <TableRow key={headerGroup.id} className="bg-surface-subtle hover:bg-surface-subtle">
                      {headerGroup.headers.map((header) => {
                        const canSort = header.column.getCanSort();
                        const sorted = header.column.getIsSorted();
                        return (
                          <TableHead key={header.id} className="h-11 px-4 font-semibold text-text-2 first:pl-5 last:pr-5">
                            {header.isPlaceholder ? null : canSort ? (
                              <button
                                type="button"
                                onClick={header.column.getToggleSortingHandler()}
                                className="inline-flex items-center gap-1 transition-colors hover:text-text"
                              >
                                {flexRender(header.column.columnDef.header, header.getContext())}
                                {sorted === "asc" ? (
                                  <ChevronUp className="size-3.5 text-blue" />
                                ) : sorted === "desc" ? (
                                  <ChevronDown className="size-3.5 text-blue" />
                                ) : (
                                  <ChevronsUpDown className="size-3.5 text-text-4" />
                                )}
                              </button>
                            ) : (
                              flexRender(header.column.columnDef.header, header.getContext())
                            )}
                          </TableHead>
                        );
                      })}
                    </TableRow>
                  ))}
                </TableHeader>

                <TableBody>
                  {rows.map((row) => (
                    <TableRow key={row.id} data-selected={row.getIsSelected()}>
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id} className="px-4 py-3 first:pl-5 last:pr-5">
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <TablePagination table={table} pageSizeOptions={[10, 25, 50]} />
          </>
        )}
      </Card>

      <RecordReceiptDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        purchaseOrders={purchaseOrders}
        onRecord={handleRecord}
      />
    </div>
  );
}
