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
import Link from "next/link";
import { ChevronDown, ChevronUp, ChevronsUpDown, Download, Eye, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
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
import type { Product, ProductStatus } from "../types";
import { useProducts, useStock } from "../hooks/use-inventory";
import { ProductsToolbar, type SortPreset } from "./products-toolbar";
import { ProductsEmptyState } from "./products-empty-state";
import { ProductThumbnail, getStockTone } from "./product-thumbnail";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyColumnDef<TData> = ColumnDef<TData, any>;

type Filters = { search: string; category: string; status: ProductStatus | "all" };

const SORT_PRESETS: Record<SortPreset, SortingState> = {
  featured: [],
  "name-asc": [{ id: "name", desc: false }],
  "stock-asc": [{ id: "stock", desc: false }],
  "stock-desc": [{ id: "stock", desc: true }],
  "price-asc": [{ id: "price", desc: false }],
  "price-desc": [{ id: "price", desc: true }],
};

function presetFromSorting(sorting: SortingState): SortPreset {
  const entry = Object.entries(SORT_PRESETS).find(
    ([, preset]) =>
      preset.length === sorting.length &&
      preset.every((col, i) => col.id === sorting[i].id && col.desc === sorting[i].desc)
  );
  return (entry?.[0] as SortPreset) ?? "featured";
}

function exportProductsCsv(rows: Product[]) {
  const header = ["Product", "SKU", "Category", "Stock", "Price", "Status"];
  const body = rows.map((p) => [p.name, p.sku, p.category, p.stock, p.price, p.status]);
  const csv = [header, ...body]
    .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
    .join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `products_${new Date().toISOString().slice(0, 10)}.csv`;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function ProductsPage() {
  const { data: items = [], isLoading } = useProducts();
  const { data: stock = [] } = useStock();
  const damagedByProduct = useMemo(() => {
    const map = new Map<string, number>();
    for (const row of stock) {
      if (row.damagedQuantity > 0) {
        map.set(row.productId, (map.get(row.productId) ?? 0) + row.damagedQuantity);
      }
    }
    return map;
  }, [stock]);
  const [filters, setFilters] = useState<Filters>({ search: "", category: "all", status: "all" });
  const [sorting, setSorting] = useState<SortingState>([]);
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 10 });
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});

  const categories = useMemo(
    () => Array.from(new Set(items.map((p) => p.category))).sort(),
    [items]
  );

  const filtered = useMemo(() => {
    const needle = filters.search.trim().toLowerCase();
    return items.filter((p) => {
      if (filters.category !== "all" && p.category !== filters.category) return false;
      if (filters.status !== "all" && p.status !== filters.status) return false;
      if (needle) {
        const haystack = `${p.name} ${p.sku} ${p.category}`.toLowerCase();
        if (!haystack.includes(needle)) return false;
      }
      return true;
    });
  }, [items, filters]);

  const columns = useMemo<AnyColumnDef<Product>[]>(
    () => [
      {
        id: "select",
        enableSorting: false,
        header: ({ table }) => (
          <Checkbox
            aria-label="Select all"
            checked={table.getIsAllPageRowsSelected()}
            onCheckedChange={(checked) => table.toggleAllPageRowsSelected(checked === true)}
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            aria-label={`Select ${row.original.name}`}
            checked={row.getIsSelected()}
            onCheckedChange={(checked) => row.toggleSelected(checked === true)}
          />
        ),
      },
      {
        accessorKey: "name",
        header: "Product",
        cell: ({ row }) => (
          <span className="flex items-center gap-3">
            <ProductThumbnail product={row.original} />
            <span className="flex min-w-0 flex-col">
              <span className="truncate text-[13px] font-semibold text-text">{row.original.name}</span>
              <span className="text-[11px] tabular-nums text-text-4">{row.original.sku}</span>
            </span>
          </span>
        ),
      },
      {
        accessorKey: "sku",
        header: "SKU",
        cell: ({ row }) => <span className="tabular-nums text-[12.5px] text-text-2">{row.original.sku}</span>,
      },
      {
        accessorKey: "category",
        header: "Category",
        cell: ({ row }) => <Badge tone="neutral">{row.original.category}</Badge>,
      },
      {
        id: "subcategory",
        header: "Subcategory",
        cell: ({ row }) => (
          <span className="text-[12.5px] text-text-3">{row.original.subcategory || "—"}</span>
        ),
      },
      {
        accessorKey: "unit",
        header: "Unit",
        cell: ({ row }) => <span className="text-[12.5px] text-text-2">{row.original.unit}</span>,
      },
      {
        accessorKey: "stock",
        header: "Stock",
        cell: ({ row }) => {
          const tone = getStockTone(row.original.stock, row.original.minimumStock);
          return (
            <span className="flex items-center gap-1.5 text-[12.5px] font-semibold tabular-nums">
              <span
                className={cn(
                  "size-1.5 rounded-full",
                  tone === "green" && "bg-green",
                  tone === "amber" && "bg-amber",
                  tone === "red" && "bg-red"
                )}
              />
              <span className={cn(tone === "green" && "text-green", tone === "amber" && "text-amber", tone === "red" && "text-red")}>
                {row.original.stock}
              </span>
            </span>
          );
        },
      },
      {
        id: "damaged",
        header: "Damaged",
        cell: ({ row }) => {
          const qty = damagedByProduct.get(row.original.id) ?? 0;
          if (qty <= 0) return <span className="text-[12.5px] text-text-4">—</span>;
          return <span className="tabular-nums text-[12.5px] font-semibold text-amber">{qty}</span>;
        },
      },
      {
        accessorKey: "minimumStock",
        header: "Min",
        cell: ({ row }) => <span className="tabular-nums text-[12.5px]">{row.original.minimumStock}</span>,
      },
      {
        accessorKey: "maximumStock",
        header: "Max",
        cell: ({ row }) => <span className="tabular-nums text-[12.5px]">{row.original.maximumStock}</span>,
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => (
          <Badge tone={row.original.status === "active" ? "green" : "neutral"}>
            {row.original.status === "active" ? "Active" : "Inactive"}
          </Badge>
        ),
      },
      {
        id: "actions",
        enableSorting: false,
        cell: ({ row }) => (
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={`View ${row.original.name}`}
            render={<Link href={`/dashboard/products/${row.original.id}`} />}
            nativeButton={false}
          >
            <Eye />
          </Button>
        ),
      },
    ],
    [damagedByProduct]
  );

  const table = useReactTable({
    data: filtered,
    columns,
    state: { sorting, pagination, rowSelection },
    onSortingChange: setSorting,
    onPaginationChange: setPagination,
    onRowSelectionChange: setRowSelection,
    enableRowSelection: true,
    getRowId: (p) => p.id,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  const rows = table.getRowModel().rows;
  const selectedCount = Object.keys(rowSelection).length;

  return (
    <div>
      <PageHeading
        title="Products"
        subtitle="Manage your products catalog"
        actions={
          <>
            <Button
              variant="outline"
              onClick={() => {
                exportProductsCsv(filtered);
                toast.success("Products exported");
              }}
            >
              <Download data-icon="inline-start" />
              Export
            </Button>
            <Button render={<Link href="/dashboard/products/new" />} nativeButton={false}>
              <Plus data-icon="inline-start" />
              Add Product
            </Button>
          </>
        }
      />

      <Card className="flex flex-col gap-4 p-5">
        <ProductsToolbar
          search={filters.search}
          onSearchChange={(search) => setFilters({ ...filters, search })}
          categories={categories}
          category={filters.category}
          onCategoryChange={(category) => setFilters({ ...filters, category })}
          status={filters.status}
          onStatusChange={(status) => setFilters({ ...filters, status })}
          sort={presetFromSorting(sorting)}
          onSortChange={(preset) => setSorting(SORT_PRESETS[preset])}
          selectedCount={selectedCount}
          onClearSelection={() => setRowSelection({})}
          onReset={() => {
            setFilters({ search: "", category: "all", status: "all" });
            setSorting([]);
          }}
        />

        {isLoading ? (
          <div className="flex flex-col gap-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : filtered.length === 0 ? (
          <ProductsEmptyState
            hasFilters={Boolean(filters.search) || filters.category !== "all" || filters.status !== "all"}
            onClearFilters={() => setFilters({ search: "", category: "all", status: "all" })}
          />
        ) : (
          <>
            <div className="overflow-x-auto rounded-[10px] border border-border">
              <Table className="whitespace-nowrap">
                <TableHeader>
                  {table.getHeaderGroups().map((headerGroup) => (
                    <TableRow key={headerGroup.id} className="bg-surface-subtle hover:bg-surface-subtle">
                      {headerGroup.headers.map((header) => {
                        const canSort = header.column.getCanSort();
                        const sorted = header.column.getIsSorted();
                        return (
                          <TableHead key={header.id} className="h-11 px-4 font-semibold text-text-2">
                            {header.isPlaceholder ? null : canSort ? (
                              <button
                                type="button"
                                onClick={header.column.getToggleSortingHandler()}
                                className="inline-flex items-center gap-1 hover:text-text"
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
                        <TableCell key={cell.id} className="px-4 py-3">
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
    </div>
  );
}
