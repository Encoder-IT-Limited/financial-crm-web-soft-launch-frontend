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
  Archive,
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
import { products } from "../../products/mock-data";
import {
  BATCH_STATUS_LABEL,
  BATCH_WAREHOUSES,
  batches as batchSeed,
  getBatchStatus,
  getDaysRemaining,
  nextBatchId,
  type Batch,
  type BatchStatus,
} from "../mock-data";
import { BatchFormDialog, type BatchSaveData } from "./batch-form-dialog";
import { BatchSummaryCards } from "./batch-summary-cards";
import { BatchesToolbar, type BatchFilters } from "./batches-toolbar";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyColumnDef<TData> = ColumnDef<TData, any>;

const DAY_MS = 24 * 60 * 60 * 1000;

const statusTone: Record<BatchStatus, "green" | "amber" | "red"> = {
  active: "green",
  "expiring-soon": "amber",
  expired: "red",
};

function exportBatchesCsv(rows: Batch[]) {
  const header = [
    "Batch Number",
    "Product",
    "SKU",
    "Warehouse",
    "Quantity",
    "Mfg Date",
    "Exp Date",
    "Days Remaining",
    "Status",
    "Notes",
  ];
  const body = rows.map((b) => [
    b.id,
    b.productName,
    b.sku,
    b.warehouse,
    String(b.quantity),
    format(new Date(b.mfgDate), "MMM d, yyyy"),
    format(new Date(b.expDate), "MMM d, yyyy"),
    String(getDaysRemaining(b.expDate)),
    BATCH_STATUS_LABEL[getBatchStatus(b.expDate)],
    b.notes,
  ]);
  const csv = [header, ...body]
    .map((row) =>
      row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","),
    )
    .join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `batches_${new Date().toISOString().slice(0, 10)}.csv`;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function BatchesPage() {
  const [items, setItems] = useState<Batch[]>(
    batchSeed.filter((b) => !b.archived),
  );
  const [filters, setFilters] = useState<BatchFilters>({
    search: "",
    product: "all",
    warehouse: "all",
    status: "all",
    range: "all",
  });
  const [sorting, setSorting] = useState<SortingState>([]);
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Batch | null>(null);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);

  const selectedIds = Object.keys(rowSelection);
  const selectedCount = selectedIds.length;

  const summary = useMemo(() => {
    const counts = { active: 0, "expiring-soon": 0, expired: 0 };
    for (const b of items) counts[getBatchStatus(b.expDate)] += 1;
    return {
      total: items.length,
      active: counts.active,
      expiringSoon: counts["expiring-soon"],
      expired: counts.expired,
    };
  }, [items]);

  const productOptions = useMemo(
    () => [...new Set(items.map((b) => b.productName))].sort(),
    [items],
  );

  const filtered = useMemo(() => {
    const needle = filters.search.trim().toLowerCase();
    const cutoff =
      filters.range === "all"
        ? null
        : Date.now() + Number(filters.range) * DAY_MS;

    return items.filter((b) => {
      if (filters.product !== "all" && b.productName !== filters.product)
        return false;
      if (filters.warehouse !== "all" && b.warehouse !== filters.warehouse)
        return false;
      if (
        filters.status !== "all" &&
        getBatchStatus(b.expDate) !== filters.status
      )
        return false;
      if (cutoff !== null && new Date(b.expDate).getTime() > cutoff)
        return false;
      if (needle) {
        const haystack = `${b.id} ${b.productName} ${b.sku}`.toLowerCase();
        if (!haystack.includes(needle)) return false;
      }
      return true;
    });
  }, [items, filters]);

  function clearFilters() {
    setFilters({
      search: "",
      product: "all",
      warehouse: "all",
      status: "all",
      range: "all",
    });
    setSorting([]);
  }

  function openAddDialog() {
    setEditTarget(null);
    setDialogOpen(true);
  }

  function openEditDialog(batch: Batch) {
    setEditTarget(batch);
    setDialogOpen(true);
  }

  function handleSave(data: BatchSaveData) {
    const product = products.find((p) => p.sku === data.sku);
    if (editTarget) {
      setItems((prev) =>
        prev.map((b) =>
          b.id === editTarget.id
            ? {
                ...b,
                sku: data.sku,
                productName: product?.name ?? b.productName,
                category: product?.category ?? b.category,
                warehouse: data.warehouse,
                quantity: data.quantity,
                mfgDate: data.mfgDate,
                expDate: data.expDate,
                notes: data.notes ?? "",
              }
            : b,
        ),
      );
      toast.success("Batch updated", {
        description: `${data.id} — ${data.quantity} units at ${data.warehouse}.`,
      });
    } else {
      setItems((prev) => [
        {
          id: data.id,
          productName: product?.name ?? "",
          sku: data.sku,
          category: product?.category ?? "Accessories",
          warehouse: data.warehouse,
          quantity: data.quantity,
          mfgDate: data.mfgDate,
          expDate: data.expDate,
          notes: data.notes ?? "",
          archived: false,
        },
        ...prev,
      ]);
      toast.success("Batch added", {
        description: `${data.id} — ${data.quantity} units at ${data.warehouse}.`,
      });
    }
    setDialogOpen(false);
    setEditTarget(null);
  }

  function handleArchive(batch: Batch) {
    setItems((prev) => prev.filter((b) => b.id !== batch.id));
    toast.success("Batch archived", {
      description: `${batch.id} is no longer tracked.`,
    });
  }

  function handleBulkArchive() {
    setItems((prev) => prev.filter((b) => !selectedIds.includes(b.id)));
    toast.success("Batches archived", {
      description: `${selectedCount} batch${selectedCount === 1 ? "" : "es"} no longer tracked.`,
    });
    setRowSelection({});
  }

  function handleBulkDelete() {
    setItems((prev) => prev.filter((b) => !selectedIds.includes(b.id)));
    setRowSelection({});
  }

  const columns = useMemo<AnyColumnDef<Batch>[]>(
    () => [
      {
        id: "select",
        enableSorting: false,
        enableHiding: false,
        header: ({ table }) => (
          <Checkbox
            aria-label="Select all batches on this page"
            checked={table.getIsAllPageRowsSelected()}
            indeterminate={table.getIsSomePageRowsSelected()}
            onCheckedChange={(checked) =>
              table.toggleAllPageRowsSelected(checked === true)
            }
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            aria-label={`Select batch ${row.original.id}`}
            checked={row.getIsSelected()}
            onCheckedChange={(checked) => row.toggleSelected(checked === true)}
          />
        ),
      },
      {
        accessorKey: "id",
        header: "Batch Number",
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
                toast.success("Batch number copied");
              }}
            >
              <Copy />
            </Button>
          </span>
        ),
      },
      {
        accessorKey: "productName",
        header: "Product",
        cell: ({ row }) => (
          <span className="flex items-center gap-3">
            <ProductThumbnail
              product={{
                name: row.original.productName,
                category: row.original.category,
              }}
            />
            <span className="flex min-w-0 flex-col">
              <span className="truncate text-[13px] font-semibold text-text min-[1440px]:text-[13.5px]">
                {row.original.productName}
              </span>
              <span className="text-[11px] tabular-nums text-text-4">
                {row.original.sku}
              </span>
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
            <span className="max-w-[150px] truncate">
              {row.original.warehouse}
            </span>
          </span>
        ),
      },
      {
        accessorKey: "quantity",
        header: "Quantity",
        cell: ({ row }) => (
          <span className="text-[12.5px] font-semibold tabular-nums text-text min-[1440px]:text-[13.5px]">
            {row.original.quantity.toLocaleString()}
          </span>
        ),
      },
      {
        accessorKey: "mfgDate",
        header: "Mfg Date",
        cell: ({ row }) => (
          <span className="text-[12.5px] font-medium tabular-nums text-text-2 min-[1440px]:text-[13.5px]">
            {format(new Date(row.original.mfgDate), "MMM d, yyyy")}
          </span>
        ),
      },
      {
        accessorKey: "expDate",
        header: "Exp Date",
        cell: ({ row }) => (
          <span className="text-[12.5px] font-medium tabular-nums text-text-2 min-[1440px]:text-[13.5px]">
            {format(new Date(row.original.expDate), "MMM d, yyyy")}
          </span>
        ),
      },
      {
        id: "daysRemaining",
        accessorFn: (batch) => getDaysRemaining(batch.expDate),
        header: "Days Remaining",
        cell: ({ row }) => {
          const days = getDaysRemaining(row.original.expDate);
          return (
            <span
              className={cn(
                "text-[12.5px] font-bold tabular-nums min-[1440px]:text-[13.5px]",
                days < 0
                  ? "text-red"
                  : days <= 30
                    ? "text-amber"
                    : "text-green",
              )}
            >
              {days} <span className="font-medium">days</span>
            </span>
          );
        },
      },
      {
        id: "status",
        accessorFn: (batch) => getDaysRemaining(batch.expDate),
        header: "Status",
        cell: ({ row }) => (
          <Badge tone={statusTone[getBatchStatus(row.original.expDate)]}>
            {BATCH_STATUS_LABEL[getBatchStatus(row.original.expDate)]}
          </Badge>
        ),
      },
      {
        id: "actions",
        header: "",
        enableSorting: false,
        cell: ({ row }) => {
          const batch = row.original;
          return (
            <span className="flex items-center justify-end gap-0.5">
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label={`View details of ${batch.id}`}
                onClick={() =>
                  toast.info(
                    "Batch details will be available once the inventory API is connected",
                  )
                }
              >
                <Eye />
              </Button>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label={`Edit ${batch.id}`}
                onClick={() => openEditDialog(batch)}
              >
                <Pencil />
              </Button>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label={`Archive ${batch.id}`}
                onClick={() => handleArchive(batch)}
              >
                <Archive />
              </Button>
            </span>
          );
        },
      },
    ],
    [],
  );

  const table = useReactTable({
    data: filtered,
    columns,
    state: { sorting, pagination, rowSelection },
    onSortingChange: setSorting,
    onPaginationChange: setPagination,
    onRowSelectionChange: setRowSelection,
    enableRowSelection: true,
    getRowId: (b) => b.id,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  const rows = table.getRowModel().rows;

  function handleExport() {
    exportBatchesCsv(filtered);
    toast.success("Batches exported", {
      description: `${filtered.length} batch${filtered.length === 1 ? "" : "es"} downloaded as CSV.`,
    });
  }

  return (
    <div className="flex flex-col gap-5">
      <PageHeading
        title="Batches"
        subtitle="Track product batches and expiry dates"
        actions={
          <>
            <Button variant="outline" onClick={handleExport}>
              <Download data-icon="inline-start" />
              Export
            </Button>
            {/* <Button onClick={openAddDialog}>
              <Plus data-icon="inline-start" />
              Add Batch
            </Button> */}
          </>
        }
      />

      <BatchSummaryCards {...summary} />

      <Card className="flex flex-col gap-4 p-5">
        <BatchesToolbar
          filters={filters}
          onChange={setFilters}
          products={productOptions}
          warehouses={BATCH_WAREHOUSES}
        />

        {selectedCount > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-[10px] border border-border bg-surface-subtle px-4 py-2.5">
            <p className="text-[12.5px] font-medium text-text-2">
              {selectedCount} batch{selectedCount === 1 ? "" : "es"} selected
            </p>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleBulkArchive}>
                <Archive data-icon="inline-start" />
                Archive
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="text-red hover:text-red"
                onClick={() => setBulkDeleteOpen(true)}
              >
                <Trash2 data-icon="inline-start" />
                Delete
              </Button>
            </div>
          </div>
        )}

        {filtered.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-14 text-center">
            <p className="text-sm font-semibold text-text">No batches found</p>
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
                    <TableRow
                      key={headerGroup.id}
                      className="bg-surface-subtle hover:bg-surface-subtle"
                    >
                      {headerGroup.headers.map((header) => {
                        const canSort = header.column.getCanSort();
                        const sorted = header.column.getIsSorted();
                        return (
                          <TableHead
                            key={header.id}
                            className="h-11 px-4 font-semibold text-text-2 first:pl-5 last:pr-5"
                          >
                            {header.isPlaceholder ? null : canSort ? (
                              <button
                                type="button"
                                onClick={header.column.getToggleSortingHandler()}
                                className="inline-flex items-center gap-1 transition-colors hover:text-text"
                              >
                                {flexRender(
                                  header.column.columnDef.header,
                                  header.getContext(),
                                )}
                                {sorted === "asc" ? (
                                  <ChevronUp className="size-3.5 text-blue" />
                                ) : sorted === "desc" ? (
                                  <ChevronDown className="size-3.5 text-blue" />
                                ) : (
                                  <ChevronsUpDown className="size-3.5 text-text-4" />
                                )}
                              </button>
                            ) : (
                              flexRender(
                                header.column.columnDef.header,
                                header.getContext(),
                              )
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
                        <TableCell
                          key={cell.id}
                          className="px-4 py-3 first:pl-5 last:pr-5"
                        >
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext(),
                          )}
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

      <BatchFormDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) setEditTarget(null);
        }}
        editBatch={editTarget}
        suggestedId={nextBatchId(items)}
        existingIds={items.map((b) => b.id)}
        onSave={handleSave}
      />

      <ConfirmDialog
        open={bulkDeleteOpen}
        onOpenChange={setBulkDeleteOpen}
        title="Delete batches"
        description={`This will permanently delete ${selectedCount} selected batch${selectedCount === 1 ? "" : "es"}. This action cannot be undone.`}
        confirmLabel="Delete Batches"
        destructive
        onConfirm={handleBulkDelete}
        successMessage={`${selectedCount} batch${selectedCount === 1 ? "" : "es"} deleted`}
      />
    </div>
  );
}
