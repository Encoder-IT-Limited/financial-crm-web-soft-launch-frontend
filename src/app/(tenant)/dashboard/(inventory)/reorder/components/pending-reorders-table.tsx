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
  Ban,
  Check,
  ChevronDown,
  ChevronUp,
  ChevronsUpDown,
  Copy,
  Pencil,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { TablePagination } from "@/components/shared/table-pagination";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";
import { ProductThumbnail } from "../../products/components/product-thumbnail";
import {
  REORDER_STATUS_LABEL,
  type PurchaseReorder,
  type ReorderStatus,
} from "../mock-data";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyColumnDef<TData> = ColumnDef<TData, any>;

const statusTone: Record<ReorderStatus, "neutral" | "amber" | "blue" | "green"> = {
  draft: "neutral",
  "pending-approval": "amber",
  ordered: "blue",
  received: "green",
};

interface PendingReordersTableProps {
  items: PurchaseReorder[];
  onEdit: (reorder: PurchaseReorder) => void;
  onApprove: (reorders: PurchaseReorder[]) => void;
  onCancel: (reorder: PurchaseReorder) => void;
}

export function PendingReordersTable({
  items,
  onEdit,
  onApprove,
  onCancel,
}: PendingReordersTableProps) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 10 });
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [cancelTarget, setCancelTarget] = useState<PurchaseReorder | null>(null);

  const selectedIds = Object.keys(rowSelection);
  const selectedCount = selectedIds.length;
  const selectedRows = items.filter((r) => selectedIds.includes(r.id));
  const approvableSelected = selectedRows.filter((r) => r.status === "pending-approval");

  function handleBulkApprove() {
    onApprove(approvableSelected);
    setRowSelection({});
  }

  const columns = useMemo<AnyColumnDef<PurchaseReorder>[]>(
    () => [
      {
        id: "select",
        enableSorting: false,
        enableHiding: false,
        header: ({ table }) => (
          <Checkbox
            aria-label="Select all reorders on this page"
            checked={table.getIsAllPageRowsSelected()}
            indeterminate={table.getIsSomePageRowsSelected()}
            onCheckedChange={(checked) => table.toggleAllPageRowsSelected(checked === true)}
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            aria-label={`Select reorder ${row.original.id}`}
            checked={row.getIsSelected()}
            onCheckedChange={(checked) => row.toggleSelected(checked === true)}
          />
        ),
      },
      {
        accessorKey: "id",
        header: "Reorder ID",
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
                toast.success("Reorder ID copied");
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
        accessorKey: "supplier",
        header: "Supplier",
        cell: ({ row }) => (
          <span className="max-w-[170px] truncate text-[12.5px] font-semibold text-text min-[1440px]:text-[13.5px]">
            {row.original.supplier}
          </span>
        ),
      },
      {
        accessorKey: "requestedQty",
        header: "Requested Qty",
        cell: ({ row }) => (
          <span className="text-[12.5px] font-semibold tabular-nums text-text min-[1440px]:text-[13.5px]">
            {row.original.requestedQty.toLocaleString()}
          </span>
        ),
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => (
          <Badge tone={statusTone[row.original.status]}>
            {REORDER_STATUS_LABEL[row.original.status]}
          </Badge>
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
        id: "actions",
        header: "",
        enableSorting: false,
        cell: ({ row }) => {
          const reorder = row.original;
          const canApprove = reorder.status === "pending-approval";
          const canCancel = reorder.status === "draft" || reorder.status === "pending-approval";
          return (
            <span className="flex items-center justify-end gap-0.5">
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label={`Edit ${reorder.id}`}
                disabled={reorder.status === "received"}
                onClick={() => onEdit(reorder)}
              >
                <Pencil />
              </Button>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label={`Approve ${reorder.id}`}
                disabled={!canApprove}
                className={cn("text-green hover:text-green")}
                onClick={() => onApprove([reorder])}
              >
                <Check />
              </Button>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label={`Cancel ${reorder.id}`}
                disabled={!canCancel}
                className={cn("text-red hover:text-red")}
                onClick={() => setCancelTarget(reorder)}
              >
                <Ban />
              </Button>
            </span>
          );
        },
      },
    ],
    [onEdit, onApprove]
  );

  const table = useReactTable({
    data: items,
    columns,
    state: { sorting, pagination, rowSelection },
    onSortingChange: setSorting,
    onPaginationChange: setPagination,
    onRowSelectionChange: setRowSelection,
    enableRowSelection: (row) => row.original.status !== "received",
    getRowId: (r) => r.id,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  const rows = table.getRowModel().rows;

  return (
    <div className="flex flex-col gap-4">
      {selectedCount > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-[10px] border border-border bg-surface-subtle px-4 py-2.5">
          <p className="text-[12.5px] font-medium text-text-2">
            {selectedCount} reorder{selectedCount === 1 ? "" : "s"} selected
            {approvableSelected.length > 0 &&
              ` · ${approvableSelected.length} pending approval`}
          </p>
          <Button size="sm" onClick={handleBulkApprove} disabled={approvableSelected.length === 0}>
            <Check data-icon="inline-start" />
            Approve Selected
          </Button>
        </div>
      )}

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

      <ConfirmDialog
        open={!!cancelTarget}
        onOpenChange={(open) => !open && setCancelTarget(null)}
        title="Cancel reorder"
        description={`This will cancel ${cancelTarget?.id ?? ""} (${cancelTarget?.requestedQty ?? 0} × ${cancelTarget?.productName ?? ""}). This action cannot be undone.`}
        confirmLabel="Cancel Reorder"
        destructive
        onConfirm={() => {
          if (cancelTarget) onCancel(cancelTarget);
          setRowSelection({});
        }}
        successMessage={`${cancelTarget?.id ?? "Reorder"} cancelled`}
      />
    </div>
  );
}
