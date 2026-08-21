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
import { Ban, ChevronDown, ChevronUp, ChevronsUpDown, Copy, Download, Eye, MapPin, Pencil, Plus } from "lucide-react";
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
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { PageHeading } from "@/components/shared/page-heading";
import { TablePagination } from "@/components/shared/table-pagination";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";
import { ProductThumbnail } from "../../products/components/product-thumbnail";
import {
  NEWEST_TRANSFER_DATE,
  TRANSFER_STATUS_LABEL,
  TRANSFER_WAREHOUSES,
  getUnitPrice,
  nextTransferId,
  stockTransfers,
  type StockTransfer,
  type TransferStatus,
} from "../mock-data";
import { TransferSummaryCards } from "./transfer-summary-cards";
import { TransfersToolbar, type TransferFilters } from "./transfers-toolbar";
import { NewTransferDialog } from "./new-transfer-dialog";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyColumnDef<TData> = ColumnDef<TData, any>;

const DAY_MS = 24 * 60 * 60 * 1000;

const statusTone: Record<TransferStatus, "amber" | "blue" | "green" | "red"> = {
  pending: "amber",
  "in-transit": "blue",
  completed: "green",
  cancelled: "red",
};

function exportTransfersCsv(rows: StockTransfer[]) {
  const header = [
    "Transfer ID",
    "From Warehouse",
    "To Warehouse",
    "Product",
    "SKU",
    "Quantity",
    "Transfer Date",
    "Expected Delivery",
    "Status",
  ];
  const body = rows.map((t) => [
    t.id,
    t.fromWarehouse,
    t.toWarehouse,
    t.productName,
    t.sku,
    `${t.quantity} ${t.unit}`,
    format(new Date(t.transferDate), "MMM d, yyyy - h:mm a"),
    format(new Date(t.expectedDelivery), "MMM d, yyyy"),
    TRANSFER_STATUS_LABEL[t.status],
  ]);
  const csv = [header, ...body]
    .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
    .join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `stock_transfers_${new Date().toISOString().slice(0, 10)}.csv`;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function StockTransfersPage() {
  const [items, setItems] = useState<StockTransfer[]>(stockTransfers);
  const [filters, setFilters] = useState<TransferFilters>({
    search: "",
    status: "all",
    from: "all",
    to: "all",
    range: "all",
  });
  const [sorting, setSorting] = useState<SortingState>([]);
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 10 });
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [cancelTarget, setCancelTarget] = useState<StockTransfer | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const summary = useMemo(() => {
    const now = new Date();
    return {
      pending: items.filter((t) => t.status === "pending").length,
      inTransit: items.filter((t) => t.status === "in-transit").length,
      completedThisMonth: items.filter(
        (t) =>
          t.status === "completed" &&
          new Date(t.transferDate).getMonth() === now.getMonth() &&
          new Date(t.transferDate).getFullYear() === now.getFullYear()
      ).length,
      valueInTransit: items
        .filter((t) => t.status === "in-transit")
        .reduce((sum, t) => sum + t.quantity * getUnitPrice(t.sku), 0),
    };
  }, [items]);

  const filtered = useMemo(() => {
    const needle = filters.search.trim().toLowerCase();
    const anchor = new Date(NEWEST_TRANSFER_DATE).getTime();
    const cutoff = filters.range === "all" ? 0 : anchor - Number(filters.range) * DAY_MS;

    return items.filter((t) => {
      if (filters.status !== "all" && t.status !== filters.status) return false;
      if (filters.from !== "all" && t.fromWarehouse !== filters.from) return false;
      if (filters.to !== "all" && t.toWarehouse !== filters.to) return false;
      if (new Date(t.transferDate).getTime() < cutoff) return false;
      if (needle) {
        const haystack = `${t.id} ${t.productName} ${t.sku} ${t.fromWarehouse} ${t.toWarehouse}`.toLowerCase();
        if (!haystack.includes(needle)) return false;
      }
      return true;
    });
  }, [items, filters]);

  function clearFilters() {
    setFilters({ search: "", status: "all", from: "all", to: "all", range: "all" });
    setSorting([]);
  }

  function handleCreate(transfer: StockTransfer) {
    setItems((prev) => [{ ...transfer, id: nextTransferId(prev) }, ...prev]);
    setDialogOpen(false);
    toast.success("Transfer created", {
      description: `${transfer.quantity} × ${transfer.productName}: ${transfer.fromWarehouse} → ${transfer.toWarehouse}.`,
    });
  }

  function handleCancelTransfer() {
    if (!cancelTarget) return;
    setItems((prev) =>
      prev.map((t) => (t.id === cancelTarget.id ? { ...t, status: "cancelled" as const } : t))
    );
  }

  const columns = useMemo<AnyColumnDef<StockTransfer>[]>(
    () => [
      {
        id: "select",
        enableSorting: false,
        enableHiding: false,
        header: ({ table }) => (
          <Checkbox
            aria-label="Select all transfers on this page"
            checked={table.getIsAllPageRowsSelected()}
            indeterminate={table.getIsSomePageRowsSelected()}
            onCheckedChange={(checked) => table.toggleAllPageRowsSelected(checked === true)}
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            aria-label={`Select transfer ${row.original.id}`}
            checked={row.getIsSelected()}
            onCheckedChange={(checked) => row.toggleSelected(checked === true)}
          />
        ),
      },
      {
        accessorKey: "id",
        header: "Transfer ID",
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
                toast.success("Transfer ID copied");
              }}
            >
              <Copy />
            </Button>
          </span>
        ),
      },
      {
        accessorKey: "fromWarehouse",
        header: "From Warehouse",
        cell: ({ row }) => (
          <span className="flex items-center gap-1.5 text-[12.5px] font-semibold text-text min-[1440px]:text-[13.5px]">
            <MapPin className="size-3.5 shrink-0 text-text-4" aria-hidden />
            <span className="max-w-[150px] truncate">{row.original.fromWarehouse}</span>
          </span>
        ),
      },
      {
        accessorKey: "toWarehouse",
        header: "To Warehouse",
        cell: ({ row }) => (
          <span className="flex items-center gap-1.5 text-[12.5px] font-semibold text-text min-[1440px]:text-[13.5px]">
            <MapPin className="size-3.5 shrink-0 text-text-4" aria-hidden />
            <span className="max-w-[150px] truncate">{row.original.toWarehouse}</span>
          </span>
        ),
      },
      {
        accessorKey: "productName",
        header: "Product",
        cell: ({ row }) => (
          <span className="flex items-center gap-3">
            <ProductThumbnail
              product={{ name: row.original.productName, category: row.original.category }}
            />
            <span className="flex min-w-0 flex-col">
              <span className="truncate text-[13px] font-semibold text-text min-[1440px]:text-[13.5px]">
                {row.original.productName}
              </span>
              <span className="text-[11px] tabular-nums text-text-4">{row.original.sku}</span>
            </span>
          </span>
        ),
      },
      {
        accessorKey: "quantity",
        header: "Quantity",
        cell: ({ row }) => (
          <span className="text-[12.5px] font-semibold tabular-nums text-text min-[1440px]:text-[13.5px]">
            {row.original.quantity}{" "}
            <span className="font-medium text-text-3">{row.original.unit}</span>
          </span>
        ),
      },
      {
        accessorKey: "transferDate",
        header: "Transfer Date",
        cell: ({ row }) => (
          <span className="text-[12.5px] font-medium tabular-nums text-text-2 min-[1440px]:text-[13.5px]">
            {format(new Date(row.original.transferDate), "MMM d, yyyy - h:mm a")}
          </span>
        ),
      },
      {
        accessorKey: "expectedDelivery",
        header: "Expected Delivery",
        cell: ({ row }) => (
          <span className="text-[12.5px] font-medium tabular-nums text-text-2 min-[1440px]:text-[13.5px]">
            {format(new Date(row.original.expectedDelivery), "MMM d, yyyy")}
          </span>
        ),
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => (
          <Badge tone={statusTone[row.original.status]}>
            {TRANSFER_STATUS_LABEL[row.original.status]}
          </Badge>
        ),
      },
      {
        id: "actions",
        header: "",
        enableSorting: false,
        cell: ({ row }) => {
          const transfer = row.original;
          const canCancel = transfer.status === "pending" || transfer.status === "in-transit";
          return (
            <span className="flex items-center justify-end gap-0.5">
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label={`View details of ${transfer.id}`}
                onClick={() =>
                  toast.info("Transfer details will be available once the inventory API is connected")
                }
              >
                <Eye />
              </Button>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label={`Edit ${transfer.id}`}
                onClick={() =>
                  toast.info("Editing will be available once the inventory API is connected")
                }
              >
                <Pencil />
              </Button>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label={`Cancel ${transfer.id}`}
                disabled={!canCancel}
                className={cn("text-red hover:text-red")}
                onClick={() => setCancelTarget(transfer)}
              >
                <Ban />
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
    getRowId: (t) => t.id,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  const rows = table.getRowModel().rows;

  function handleExport() {
    exportTransfersCsv(filtered);
    toast.success("Stock transfers exported", {
      description: `${filtered.length} transfer${filtered.length === 1 ? "" : "s"} downloaded as CSV.`,
    });
  }

  return (
    <div className="flex flex-col gap-5">
      <PageHeading
        title="Stock Transfers"
        subtitle="Manage inter-warehouse stock transfers"
        actions={
          <>
            <Button variant="outline" onClick={handleExport}>
              <Download data-icon="inline-start" />
              Export
            </Button>
            <Button onClick={() => setDialogOpen(true)}>
              <Plus data-icon="inline-start" />
              New Transfer
            </Button>
          </>
        }
      />

      <TransferSummaryCards {...summary} />

      <Card className="flex flex-col gap-4 p-5">
        <TransfersToolbar filters={filters} onChange={setFilters} warehouses={TRANSFER_WAREHOUSES} />

        {filtered.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-14 text-center">
            <p className="text-sm font-semibold text-text">No transfers found</p>
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

      <NewTransferDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        warehouses={TRANSFER_WAREHOUSES}
        onCreate={handleCreate}
      />

      <ConfirmDialog
        open={!!cancelTarget}
        onOpenChange={(open) => !open && setCancelTarget(null)}
        title="Cancel transfer"
        description={`This will cancel ${cancelTarget?.id ?? ""} (${cancelTarget?.quantity ?? 0} × ${cancelTarget?.productName ?? ""}). This action cannot be undone.`}
        confirmLabel="Cancel Transfer"
        destructive
        onConfirm={handleCancelTransfer}
        successMessage={`${cancelTarget?.id ?? "Transfer"} cancelled`}
      />
    </div>
  );
}
