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
  Trash2,
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
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { PageHeading } from "@/components/shared/page-heading";
import { TablePagination } from "@/components/shared/table-pagination";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";
import { ProductThumbnail } from "../../products/components/product-thumbnail";
import {
  ADJUSTMENT_REASON_LABEL,
  ADJUSTMENT_STATUS_LABEL,
  ADJUSTMENT_TYPE_LABEL,
  ADJUSTMENT_WAREHOUSES,
  NEWEST_ADJUSTMENT_DATE,
  getUnitPrice,
  nextAdjustmentId,
  stockAdjustments,
  type StockAdjustment,
} from "../mock-data";
import { AdjustmentSummaryCards } from "./adjustment-summary-cards";
import { AdjustmentsToolbar, type AdjustmentFilters } from "./adjustments-toolbar";
import { NewAdjustmentDialog } from "./new-adjustment-dialog";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyColumnDef<TData> = ColumnDef<TData, any>;

const DAY_MS = 24 * 60 * 60 * 1000;

const typeTone: Record<StockAdjustment["type"], "green" | "red"> = {
  add: "green",
  deduct: "red",
};

const statusTone: Record<StockAdjustment["status"], "amber" | "green"> = {
  pending: "amber",
  approved: "green",
};

function exportAdjustmentsCsv(rows: StockAdjustment[]) {
  const header = [
    "Adjustment ID",
    "Date",
    "Type",
    "Product",
    "SKU",
    "Warehouse",
    "Quantity",
    "Reason",
    "Reference / Notes",
    "Status",
  ];
  const body = rows.map((a) => [
    a.id,
    format(new Date(a.date), "MMM d, yyyy - h:mm a"),
    ADJUSTMENT_TYPE_LABEL[a.type],
    a.productName,
    a.sku,
    a.warehouse,
    `${a.type === "add" ? "+" : "-"}${a.quantity}`,
    ADJUSTMENT_REASON_LABEL[a.reason],
    a.reference,
    ADJUSTMENT_STATUS_LABEL[a.status],
  ]);
  const csv = [header, ...body]
    .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
    .join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `stock_adjustments_${new Date().toISOString().slice(0, 10)}.csv`;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function AdjustmentsPage() {
  const [items, setItems] = useState<StockAdjustment[]>(stockAdjustments);
  const [filters, setFilters] = useState<AdjustmentFilters>({
    search: "",
    type: "all",
    reason: "all",
    range: "all",
    warehouse: "all",
  });
  const [sorting, setSorting] = useState<SortingState>([]);
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 10 });
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [deleteTarget, setDeleteTarget] = useState<StockAdjustment | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const summary = useMemo(() => {
    return {
      total: items.length,
      stockAdded: items
        .filter((a) => a.type === "add")
        .reduce((sum, a) => sum + a.quantity, 0),
      stockDeducted: items
        .filter((a) => a.type === "deduct")
        .reduce((sum, a) => sum + a.quantity, 0),
      netValue: items.reduce(
        (sum, a) => sum + (a.type === "add" ? 1 : -1) * a.quantity * getUnitPrice(a.sku),
        0
      ),
    };
  }, [items]);

  const filtered = useMemo(() => {
    const needle = filters.search.trim().toLowerCase();
    const anchor = new Date(NEWEST_ADJUSTMENT_DATE).getTime();
    const cutoff = filters.range === "all" ? 0 : anchor - Number(filters.range) * DAY_MS;

    return items.filter((a) => {
      if (filters.type !== "all" && a.type !== filters.type) return false;
      if (filters.reason !== "all" && a.reason !== filters.reason) return false;
      if (filters.warehouse !== "all" && a.warehouse !== filters.warehouse) return false;
      if (new Date(a.date).getTime() < cutoff) return false;
      if (needle) {
        const haystack =
          `${a.id} ${a.productName} ${a.sku} ${ADJUSTMENT_REASON_LABEL[a.reason]} ${a.reference} ${a.warehouse}`.toLowerCase();
        if (!haystack.includes(needle)) return false;
      }
      return true;
    });
  }, [items, filters]);

  function clearFilters() {
    setFilters({ search: "", type: "all", reason: "all", range: "all", warehouse: "all" });
    setSorting([]);
  }

  function handleCreate(adjustment: StockAdjustment) {
    setItems((prev) => [{ ...adjustment, id: nextAdjustmentId(prev) }, ...prev]);
    setDialogOpen(false);
    toast.success("Adjustment created", {
      description: `${adjustment.type === "add" ? "+" : "-"}${adjustment.quantity} × ${adjustment.productName} at ${adjustment.warehouse}.`,
    });
  }

  function handleDeleteAdjustment() {
    if (!deleteTarget) return;
    setItems((prev) => prev.filter((a) => a.id !== deleteTarget.id));
  }

  const columns = useMemo<AnyColumnDef<StockAdjustment>[]>(
    () => [
      {
        id: "select",
        enableSorting: false,
        enableHiding: false,
        header: ({ table }) => (
          <Checkbox
            aria-label="Select all adjustments on this page"
            checked={table.getIsAllPageRowsSelected()}
            indeterminate={table.getIsSomePageRowsSelected()}
            onCheckedChange={(checked) => table.toggleAllPageRowsSelected(checked === true)}
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            aria-label={`Select adjustment ${row.original.id}`}
            checked={row.getIsSelected()}
            onCheckedChange={(checked) => row.toggleSelected(checked === true)}
          />
        ),
      },
      {
        accessorKey: "id",
        header: "Adjustment ID",
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
                toast.success("Adjustment ID copied");
              }}
            >
              <Copy />
            </Button>
          </span>
        ),
      },
      {
        accessorKey: "date",
        header: "Date & Time",
        cell: ({ row }) => (
          <span className="text-[12.5px] font-medium tabular-nums text-text-2 min-[1440px]:text-[13.5px]">
            {format(new Date(row.original.date), "MMM d, yyyy - h:mm a")}
          </span>
        ),
      },
      {
        accessorKey: "type",
        header: "Type",
        cell: ({ row }) => (
          <Badge tone={typeTone[row.original.type]}>
            {ADJUSTMENT_TYPE_LABEL[row.original.type]}
          </Badge>
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
        accessorKey: "quantity",
        header: "Quantity",
        cell: ({ row }) => (
          <span
            className={cn(
              "text-[12.5px] font-bold tabular-nums min-[1440px]:text-[13.5px]",
              row.original.type === "add" ? "text-green" : "text-red"
            )}
          >
            {row.original.type === "add" ? "+" : "-"}
            {row.original.quantity}
          </span>
        ),
      },
      {
        accessorKey: "reason",
        header: "Reason",
        cell: ({ row }) => (
          <span className="text-[12.5px] font-medium text-text-2 min-[1440px]:text-[13.5px]">
            {ADJUSTMENT_REASON_LABEL[row.original.reason]}
          </span>
        ),
      },
      {
        accessorKey: "reference",
        header: "Reference / Notes",
        cell: ({ row }) => (
          <span
            className="block max-w-[220px] truncate text-[12px] text-text-3 min-[1440px]:text-[12.5px]"
            title={row.original.reference}
          >
            {row.original.reference}
          </span>
        ),
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => (
          <Badge tone={statusTone[row.original.status]}>
            {ADJUSTMENT_STATUS_LABEL[row.original.status]}
          </Badge>
        ),
      },
      {
        id: "actions",
        header: "",
        enableSorting: false,
        cell: ({ row }) => {
          const adjustment = row.original;
          return (
            <span className="flex items-center justify-end gap-0.5">
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label={`View details of ${adjustment.id}`}
                onClick={() =>
                  toast.info("Adjustment details will be available once the inventory API is connected")
                }
              >
                <Eye />
              </Button>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label={`Edit ${adjustment.id}`}
                onClick={() =>
                  toast.info("Editing will be available once the inventory API is connected")
                }
              >
                <Pencil />
              </Button>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label={`Delete ${adjustment.id}`}
                className={cn("text-red hover:text-red")}
                onClick={() => setDeleteTarget(adjustment)}
              >
                <Trash2 />
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
    getRowId: (a) => a.id,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  const rows = table.getRowModel().rows;

  function handleExport() {
    exportAdjustmentsCsv(filtered);
    toast.success("Stock adjustments exported", {
      description: `${filtered.length} adjustment${filtered.length === 1 ? "" : "s"} downloaded as CSV.`,
    });
  }

  return (
    <div className="flex flex-col gap-5">
      <PageHeading
        title="Adjustments"
        subtitle="Correct inventory discrepancies and manage stock corrections"
        actions={
          <>
            <Button variant="outline" onClick={handleExport}>
              <Download data-icon="inline-start" />
              Export
            </Button>
            <Button onClick={() => setDialogOpen(true)}>
              <Plus data-icon="inline-start" />
              New Adjustment
            </Button>
          </>
        }
      />

      <AdjustmentSummaryCards {...summary} />

      <Card className="flex flex-col gap-4 p-5">
        <AdjustmentsToolbar filters={filters} onChange={setFilters} warehouses={ADJUSTMENT_WAREHOUSES} />

        {filtered.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-14 text-center">
            <p className="text-sm font-semibold text-text">No adjustments found</p>
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

      <NewAdjustmentDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onCreate={handleCreate}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Delete adjustment"
        description={`This will permanently delete ${deleteTarget?.id ?? ""} (${deleteTarget?.type === "add" ? "+" : "-"}${deleteTarget?.quantity ?? 0} × ${deleteTarget?.productName ?? ""}). This action cannot be undone.`}
        confirmLabel="Delete Adjustment"
        destructive
        onConfirm={handleDeleteAdjustment}
        successMessage={`${deleteTarget?.id ?? "Adjustment"} deleted`}
      />
    </div>
  );
}
