"use client";

import { useMemo, useState } from "react";
import {
  type ColumnDef,
  type PaginationState,
  type SortingState,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { format } from "date-fns";
import { ChevronDown, ChevronUp, ChevronsUpDown, Eye, MapPin, PackagePlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";
import { TablePagination } from "@/components/shared/table-pagination";
import { ProductThumbnail } from "../../products/components/product-thumbnail";
import { getItemLevel, suggestedReorderQty, type LowStockItem } from "../mock-data";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyColumnDef<TData> = ColumnDef<TData, any>;

interface LowStockTableProps {
  items: LowStockItem[];
  onQuickReorder: (item: LowStockItem) => void;
}

export function LowStockTable({ items, onQuickReorder }: LowStockTableProps) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 10 });

  const columns = useMemo<AnyColumnDef<LowStockItem>[]>(
    () => [
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
        accessorKey: "currentQty",
        header: "Current Qty",
        cell: ({ row }) => {
          const critical = getItemLevel(row.original) === "critical";
          return (
            <span
              className={cn(
                "text-[13px] font-bold tabular-nums min-[1440px]:text-[13.5px]",
                critical ? "text-red" : "text-amber"
              )}
            >
              {row.original.currentQty}
            </span>
          );
        },
      },
      {
        accessorKey: "reorderPoint",
        header: "Reorder Point",
        cell: ({ row }) => (
          <span className="text-[12.5px] font-semibold tabular-nums text-text min-[1440px]:text-[13.5px]">
            {row.original.reorderPoint}
          </span>
        ),
      },
      {
        id: "suggestedQty",
        accessorFn: (item) => suggestedReorderQty(item),
        header: "Suggested Reorder Qty",
        cell: ({ row }) => (
          <span className="text-[12.5px] font-semibold tabular-nums text-blue min-[1440px]:text-[13.5px]">
            {suggestedReorderQty(row.original)}
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
        accessorKey: "lastRestocked",
        header: "Last Restocked",
        cell: ({ row }) => (
          <span className="text-[12.5px] font-medium tabular-nums text-text-2 min-[1440px]:text-[13.5px]">
            {format(new Date(row.original.lastRestocked), "MMM d, yyyy")}
          </span>
        ),
      },
      {
        id: "actions",
        header: "",
        enableSorting: false,
        cell: ({ row }) => {
          const item = row.original;
          return (
            <span className="flex items-center justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                aria-label={`Quick reorder ${item.productName}`}
                onClick={() => onQuickReorder(item)}
              >
                <PackagePlus data-icon="inline-start" />
                Quick Reorder
              </Button>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label={`View details of ${item.productName}`}
                onClick={() =>
                  toast.info("Product details will be available once the inventory API is connected")
                }
              >
                <Eye />
              </Button>
            </span>
          );
        },
      },
    ],
    [onQuickReorder]
  );

  const table = useReactTable({
    data: items,
    columns,
    state: { sorting, pagination },
    onSortingChange: setSorting,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  const rows = table.getRowModel().rows;

  return (
    <div className="flex flex-col gap-4">
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
              <TableRow key={row.id}>
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
    </div>
  );
}
