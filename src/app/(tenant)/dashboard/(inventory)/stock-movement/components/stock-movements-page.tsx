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
import { ArrowRight, ChevronDown, ChevronUp, ChevronsUpDown, Eye } from "lucide-react";
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
import { TablePagination } from "@/components/shared/table-pagination";import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";
import { ProductThumbnail } from "../../products/components/product-thumbnail";
import {
  MOVEMENT_KIND_LABEL,
  MOVEMENT_STATUS_LABEL,
  NEWEST_MOVEMENT_DATE,
  stockMovements,
  type MovementKind,
  type MovementStatus,
  type StockMovement,
} from "../mock-data";
import { MovementsToolbar, type MovementFilters } from "./movements-toolbar";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyColumnDef<TData> = ColumnDef<TData, any>;

const DAY_MS = 24 * 60 * 60 * 1000;

const kindTone: Record<MovementKind, "green" | "red" | "blue" | "purple"> = {
  inbound: "green",
  outbound: "red",
  adjustment: "blue",
  transfer: "purple",
};

const statusTone: Record<MovementStatus, "green" | "amber" | "red"> = {
  completed: "green",
  pending: "amber",
  cancelled: "red",
};

const WAREHOUSES = [
  ...new Set(
    stockMovements.flatMap((m) => [m.sourceWarehouse, m.destinationWarehouse].filter(Boolean))
  ),
] as string[];

function exportMovementsCsv(rows: StockMovement[]) {
  const header = [
    "Date & Time",
    "Type",
    "Product",
    "SKU",
    "Source Warehouse",
    "Destination Warehouse",
    "Quantity",
    "Reference",
    "Status",
  ];
  const body = rows.map((m) => [
    format(new Date(m.datetime), "MMM d, yyyy - h:mm a"),
    MOVEMENT_KIND_LABEL[m.kind],
    m.productName,
    m.sku,
    m.sourceWarehouse ?? "",
    m.destinationWarehouse ?? "",
    m.quantity,
    m.reference,
    MOVEMENT_STATUS_LABEL[m.status],
  ]);
  const csv = [header, ...body]
    .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
    .join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `stock_movements_${new Date().toISOString().slice(0, 10)}.csv`;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function StockMovementsPage() {
  const [filters, setFilters] = useState<MovementFilters>({
    search: "",
    kind: "all",
    range: "all",
    warehouse: "all",
  });
  const [sorting, setSorting] = useState<SortingState>([]);
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 10 });
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});

  const filtered = useMemo(() => {
    const needle = filters.search.trim().toLowerCase();
    const anchor = new Date(NEWEST_MOVEMENT_DATE).getTime();
    const cutoff = filters.range === "all" ? 0 : anchor - Number(filters.range) * DAY_MS;

    return stockMovements.filter((m) => {
      if (filters.kind !== "all" && m.kind !== filters.kind) return false;
      if (new Date(m.datetime).getTime() < cutoff) return false;
      if (
        filters.warehouse !== "all" &&
        m.sourceWarehouse !== filters.warehouse &&
        m.destinationWarehouse !== filters.warehouse
      )
        return false;
      if (needle) {
        const haystack = `${m.productName} ${m.sku} ${m.reference}`.toLowerCase();
        if (!haystack.includes(needle)) return false;
      }
      return true;
    });
  }, [filters]);

  function clearFilters() {
    setFilters({ search: "", kind: "all", range: "all", warehouse: "all" });
    setSorting([]);
  }

  const columns = useMemo<AnyColumnDef<StockMovement>[]>(
    () => [
      {
        id: "select",
        enableSorting: false,
        enableHiding: false,
        header: ({ table }) => (
          <Checkbox
            aria-label="Select all movements on this page"
            checked={table.getIsAllPageRowsSelected()}
            indeterminate={table.getIsSomePageRowsSelected()}
            onCheckedChange={(checked) => table.toggleAllPageRowsSelected(checked === true)}
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            aria-label={`Select movement ${row.original.reference}`}
            checked={row.getIsSelected()}
            onCheckedChange={(checked) => row.toggleSelected(checked === true)}
          />
        ),
      },
      {
        accessorKey: "datetime",
        header: "Date & Time",
        cell: ({ row }) => (
          <span className="text-[12.5px] font-medium tabular-nums text-text-2 min-[1440px]:text-[13.5px]">
            {format(new Date(row.original.datetime), "MMM d, yyyy - h:mm a")}
          </span>
        ),
      },
      {
        accessorKey: "kind",
        header: "Type",
        cell: ({ row }) => (
          <Badge tone={kindTone[row.original.kind]}>{MOVEMENT_KIND_LABEL[row.original.kind]}</Badge>
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
        id: "warehouse",
        header: "Warehouse",
        enableSorting: false,
        cell: ({ row }) => {
          const { sourceWarehouse, destinationWarehouse } = row.original;
          return (
            <span className="flex items-center gap-1.5 text-[12.5px] font-medium text-text-2 min-[1440px]:text-[13.5px]">
              <span className="max-w-[130px] truncate">{sourceWarehouse ?? "Supplier"}</span>
              <ArrowRight className="size-3.5 shrink-0 text-text-4" aria-hidden />
              <span className="max-w-[130px] truncate">
                {destinationWarehouse ?? "Customer"}
              </span>
            </span>
          );
        },
      },
      {
        accessorKey: "quantity",
        header: "Quantity",
        cell: ({ row }) => {
          const { quantity, kind } = row.original;
          return (
            <span
              className={cn(
                "text-[12.5px] font-semibold tabular-nums min-[1440px]:text-[13.5px]",
                kind === "transfer" && "text-text-2",
                quantity > 0 && "text-green",
                quantity < 0 && "text-red"
              )}
            >
              {kind === "transfer" ? quantity : quantity > 0 ? `+${quantity}` : quantity}
            </span>
          );
        },
      },
      {
        accessorKey: "reference",
        header: "Reference",
        cell: ({ row }) => (
          <span className="text-[12.5px] font-medium tabular-nums text-text-2 min-[1440px]:text-[13.5px]">
            {row.original.reference}
          </span>
        ),
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => (
          <Badge tone={statusTone[row.original.status]}>
            {MOVEMENT_STATUS_LABEL[row.original.status]}
          </Badge>
        ),
      },
      {
        id: "actions",
        header: "",
        enableSorting: false,
        cell: ({ row }) => (
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={`View details of ${row.original.reference}`}
            onClick={() =>
              toast.info("Movement details will be available once the inventory API is connected")
            }
          >
            <Eye />
          </Button>
        ),
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
    getRowId: (m) => m.id,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  const rows = table.getRowModel().rows;

  function handleExport() {
    exportMovementsCsv(filtered);
    toast.success("Stock movements exported", {
      description: `${filtered.length} movement${filtered.length === 1 ? "" : "s"} downloaded as CSV.`,
    });
  }

  return (
    <Card className="flex flex-col gap-4 p-5">
      <MovementsToolbar
        filters={filters}
        onChange={setFilters}
        warehouses={WAREHOUSES}
        onExport={handleExport}
      />

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-14 text-center">
          <p className="text-sm font-semibold text-text">No stock movements found</p>
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
  );
}
