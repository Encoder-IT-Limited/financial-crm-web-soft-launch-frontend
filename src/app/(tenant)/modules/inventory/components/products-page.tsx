"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  type Column,
  type SortingState,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  ChevronRight,
  Download,
  Eye,
  Package,
  PencilLine,
  Plus,
  Search,
} from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PageHeading } from "@/components/shared/page-heading";
import { toast } from "@/lib/toast";
import { downloadCsv } from "@/lib/csv";
import { fmtMoney, fmtQty } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Product, ProductStatus, StockStatus } from "../types";
import { PRODUCT_STATUS_LABELS, CATEGORIES } from "../types";
import {
  STOCK_STATUS_LABELS,
  consolidateStock,
  deriveStatus,
  stockLevelFor,
} from "../lib/stock";
import { useInventoryStore } from "../store/inventory-store";
import { ProductThumb, ProductStatusBadge } from "./product-thumb";
import { StockStatusBadge } from "./stock-status-badge";
import { StockViewToggle, type StockViewMode } from "./stock-view-toggle";
import { WarehouseMultiSelect } from "./warehouse-multi-select";
import { WarehouseStockTooltip, type StockBreakdownRow } from "./warehouse-stock-tooltip";

type Filters = {
  search: string;
  category: string;
  status: "all" | ProductStatus;
  stockStatus: "all" | StockStatus;
  warehouses: string[];
};

export function ProductsPage() {
  const router = useRouter();
  const products = useInventoryStore((state) => state.products);
  const warehouses = useInventoryStore((state) => state.warehouses);
  const stockLevels = useInventoryStore((state) => state.stockLevels);

  const [filters, setFilters] = useState<Filters>({
    search: "",
    category: "all",
    status: "all",
    stockStatus: "all",
    warehouses: [],
  });
  const [stockView, setStockView] = useState<StockViewMode>("total");
  const [localWarehouseId, setLocalWarehouseId] = useState("");
  const [sorting, setSorting] = useState<SortingState>([]);

  const warehouseNameMap = useMemo(() => new Map(warehouses.map((w) => [w.id, w.name])), [warehouses]);
  const activeLocalWarehouse = localWarehouseId || warehouses[0]?.id || "";

  const rows = useMemo(() => {
    const needle = filters.search.trim().toLowerCase();
    return products
      .map((product) => {
        const consolidated = consolidateStock(product, stockLevels);
        const localLevel = activeLocalWarehouse ? stockLevelFor(product.id, activeLocalWarehouse, stockLevels) : undefined;
        return {
          product,
          consolidated,
          localAvailable: localLevel?.quantity ?? 0,
          localStatus: localLevel
            ? deriveStatus(localLevel.quantity, product.reorderLevels[activeLocalWarehouse] ?? product.reorderLevel)
            : ("out" as StockStatus),
        };
      })
      .filter(({ product, consolidated }) => {
        if (filters.status !== "all" && product.status !== filters.status) return false;
        if (filters.stockStatus !== "all" && consolidated.status !== filters.stockStatus) return false;
        if (filters.category !== "all" && product.category !== filters.category) return false;
        if (filters.warehouses.length > 0) {
          const has = filters.warehouses.some((wid) => stockLevelFor(product.id, wid, stockLevels));
          if (!has) return false;
        }
        if (needle) {
          const haystack = `${product.sku} ${product.name} ${product.barcode} ${product.category}`.toLowerCase();
          if (!haystack.includes(needle)) return false;
        }
        return true;
      });
  }, [products, stockLevels, filters, activeLocalWarehouse]);

  const breakdownFor = (product: Product): StockBreakdownRow[] =>
    warehouses
      .map((wh) => {
        const level = stockLevelFor(product.id, wh.id, stockLevels);
        return {
          name: wh.name,
          code: wh.code,
          available: level?.quantity ?? 0,
          inTransit: level?.inTransit ?? 0,
          status: level ? deriveStatus(level.quantity, product.reorderLevels[wh.id] ?? product.reorderLevel) : "out",
        };
      })
      .filter((r) => r.available !== 0 || r.inTransit !== 0);

  const viewRows = useMemo(() => {
    type Row = (typeof rows)[number];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const columns: any[] = [
      {
        id: "product",
        accessorFn: (r: Row) => r.product.name,
        header: ({ column }: { column: Column<Row, unknown> }) => <SortableHeader column={column} label="Product" />,
        cell: ({ row }: { row: { original: Row } }) => {
          const p = row.original.product;
          return (
            <div className="flex items-center gap-2.5">
              <ProductThumb product={p} />
              <div className="flex flex-col">
                <Link
                  href={`/dashboard/products/${p.id}`}
                  className="text-[13px] font-bold text-text hover:text-blue hover:underline"
                >
                  {p.name}
                </Link>
                <span className="text-[10.5px] font-semibold text-text-4">SKU {p.sku}</span>
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: "category",
        header: "Category",
        cell: ({ row }: { row: { original: Row } }) => (
          <span className="text-[12.5px] text-text-2">{row.original.product.category}</span>
        ),
      },
      {
        id: "price",
        accessorFn: (r: Row) => r.product.sellingPrice,
        header: ({ column }: { column: Column<Row, unknown> }) => (
          <SortableHeader column={column} label="Base Price" align="right" />
        ),
        cell: ({ row }: { row: { original: Row } }) => (
          <span className="block text-right text-[13px] font-semibold text-text">
            {fmtMoney(row.original.product.sellingPrice)}
          </span>
        ),
      },
      {
        id: "stock",
        accessorFn: (r: Row) => (stockView === "total" ? r.consolidated.available : r.localAvailable),
        header: ({ column }: { column: Column<Row, unknown> }) => (
          <SortableHeader column={column} label={stockView === "total" ? "Total Stock" : warehouseNameMap.get(activeLocalWarehouse) ?? "Stock"} align="right" />
        ),
        cell: ({ row }: { row: { original: Row } }) => {
          const { product, consolidated, localAvailable, localStatus } = row.original;
          const total = stockView === "total";
          const available = total ? consolidated.available : localAvailable;
          const status = total ? consolidated.status : localStatus;
          return (
            <div className="flex items-center justify-end gap-2">
              <span
                className={cn(
                  "text-right text-[13px] font-bold tabular-nums",
                  status === "in-stock" && "text-green",
                  status === "low" && "text-amber",
                  (status === "out" || status === "negative") && "text-red"
                )}
              >
                {fmtQty(available)}
              </span>
              <WarehouseStockTooltip rows={breakdownFor(product)}>
                <span className="cursor-help text-[10px] text-text-4">ⓘ</span>
              </WarehouseStockTooltip>
            </div>
          );
        },
      },
      {
        id: "stockStatus",
        accessorFn: (r: Row) => (stockView === "total" ? r.consolidated.status : r.localStatus),
        header: "Stock State",
        enableSorting: false,
        cell: ({ row }: { row: { original: Row } }) => {
          const { consolidated, localStatus } = row.original;
          return <StockStatusBadge status={stockView === "total" ? consolidated.status : localStatus} />;
        },
      },
      {
        id: "status",
        accessorFn: (r: Row) => r.product.status,
        header: "Status",
        enableSorting: false,
        cell: ({ row }: { row: { original: Row } }) => <ProductStatusBadge status={row.original.product.status} />,
      },
      {
        id: "actions",
        header: "",
        enableSorting: false,
        cell: ({ row }: { row: { original: Row } }) => (
          <div className="flex items-center justify-end gap-1">
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label={`View ${row.original.product.name}`}
              onClick={(e) => {
                e.stopPropagation();
                router.push(`/dashboard/products/${row.original.product.id}`);
              }}
            >
              <Eye />
            </Button>
            <Link
              href={`/dashboard/products/new?edit=${row.original.product.id}`}
              className={buttonVariants({ variant: "ghost", size: "icon-sm" })}
              aria-label={`Edit ${row.original.product.name}`}
              onClick={(e) => e.stopPropagation()}
            >
              <PencilLine />
            </Link>
          </div>
        ),
      },
    ];
    return columns;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stockView, activeLocalWarehouse, warehouseNameMap, stockLevels, warehouses, router]);

  const table = useReactTable({
    data: rows,
    columns: viewRows,
    state: { sorting },
    onSortingChange: setSorting,
    getRowId: (r) => r.product.id,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  function exportCsv() {
    downloadCsv(
      "products.csv",
      ["SKU", "Name", "Category", "Unit", "Cost Price", "Selling Price", "Total Available", "Total Value", "Status", "Stock State"],
      rows.map(({ product, consolidated }) => [
        product.sku,
        product.name,
        product.category,
        product.unit,
        product.costPrice,
        product.sellingPrice,
        consolidated.available,
        Math.round(consolidated.value * 100) / 100,
        PRODUCT_STATUS_LABELS[product.status],
        STOCK_STATUS_LABELS[consolidated.status],
      ])
    );
    toast.success(`${rows.length} product${rows.length === 1 ? "" : "s"} exported to CSV`);
  }

  const hasFilters =
    filters.category !== "all" ||
    filters.status !== "all" ||
    filters.stockStatus !== "all" ||
    filters.warehouses.length > 0 ||
    filters.search.trim() !== "";

  return (
    <div>
      <PageHeading
        title="Products & SKU"
        subtitle="Catalogue with multi-warehouse stock levels, batches and reorder control"
        actions={
          <>
            <Button variant="outline" size="sm" onClick={exportCsv}>
              <Download /> Excel
            </Button>
            <Link href="/dashboard/products/new">
              <Button size="sm">
                <Plus /> New Product
              </Button>
            </Link>
          </>
        }
      />

      <Card className="gap-0 p-0">
        <div className="flex flex-wrap items-center gap-2 border-b border-border p-3">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-text-4" />
            <Input
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              placeholder="Search SKU / name / barcode..."
              className="w-full pl-8 sm:w-60"
            />
          </div>
          <Select
            value={filters.category}
            onValueChange={(category) => setFilters({ ...filters, category: (category ?? "all") as Filters["category"] })}
          >
            <SelectTrigger size="sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All categories</SelectItem>
              {CATEGORIES.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={filters.status}
            onValueChange={(status) => setFilters({ ...filters, status: (status ?? "all") as Filters["status"] })}
          >
            <SelectTrigger size="sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
              <SelectItem value="discontinued">Discontinued</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={filters.stockStatus}
            onValueChange={(status) => setFilters({ ...filters, stockStatus: (status ?? "all") as Filters["stockStatus"] })}
          >
            <SelectTrigger size="sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All stock levels</SelectItem>
              <SelectItem value="in-stock">In Stock</SelectItem>
              <SelectItem value="low">Low Stock</SelectItem>
              <SelectItem value="out">Out of Stock</SelectItem>
              <SelectItem value="negative">Negative</SelectItem>
            </SelectContent>
          </Select>
          <WarehouseMultiSelect
            warehouses={warehouses}
            selected={filters.warehouses}
            onChange={(ids) => setFilters({ ...filters, warehouses: ids })}
          />
          {hasFilters && (
            <Button
              variant="ghost"
              size="xs"
              onClick={() => setFilters({ search: "", category: "all", status: "all", stockStatus: "all", warehouses: [] })}
            >
              Clear
            </Button>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-3 py-2">
          <div className="flex flex-wrap items-center gap-2">
            <Package className="size-4 text-text-3" />
            <StockViewToggle
              mode={stockView}
              onModeChange={setStockView}
              warehouseId={activeLocalWarehouse}
              onWarehouseChange={setLocalWarehouseId}
              warehouses={warehouses}
            />
          </div>
          <span className="text-[11.5px] text-text-4">
            {rows.length} of {products.length} products
          </span>
        </div>

        {/* Desktop table */}
        <Table className="hidden lg:table">
          <TableHeader className="bg-surface-subtle">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="hover:bg-surface-subtle">
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    style={header.column.columnDef.size !== undefined ? { width: header.column.getSize() } : undefined}
                    className={cn(
                      "px-5 py-2.5 text-[10.5px] font-bold uppercase tracking-wide text-text-3",
                      header.column.id === "actions" && "w-24 text-right"
                    )}
                  >
                    {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.map((row) => (
              <TableRow
                key={row.id}
                onClick={() => router.push(`/dashboard/products/${row.original.product.id}`)}
                className="cursor-pointer transition-colors hover:bg-surface-subtle"
              >
                {row.getVisibleCells().map((cell) => (
                  <TableCell
                    key={cell.id}
                    className={cn(
                      "px-5 py-3",
                      cell.column.id === "actions" && "text-right",
                      ["price", "stock"].includes(cell.column.id) && "pr-5"
                    )}
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))}
            {table.getRowModel().rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={viewRows.length} className="h-28 text-center text-[13px] text-text-4">
                  No products match your filters.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>

        {/* Mobile stacked cards */}
        <div className="flex flex-col divide-y divide-border lg:hidden">
          {rows.map(({ product, consolidated, localAvailable, localStatus }) => {
            const status = stockView === "total" ? consolidated.status : localStatus;
            const available = stockView === "total" ? consolidated.available : localAvailable;
            return (
              <Link
                key={product.id}
                href={`/dashboard/products/${product.id}`}
                className="flex flex-col gap-2.5 p-4 transition-colors hover:bg-surface-subtle"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <ProductThumb product={product} />
                    <div className="flex flex-col">
                      <span className="text-[13px] font-bold text-text">{product.name}</span>
                      <span className="text-[10.5px] font-semibold text-text-4">SKU {product.sku}</span>
                    </div>
                  </div>
                  <ChevronRight className="size-4 text-text-4" />
                </div>
                <div className="flex items-center justify-between text-[12.5px]">
                  <span className="text-text-3">
                    {product.category} · {fmtMoney(product.sellingPrice)}
                  </span>
                  <span className="flex items-center gap-2">
                    <span
                      className={cn(
                        "text-[13px] font-bold tabular-nums",
                        status === "in-stock" && "text-green",
                        status === "low" && "text-amber",
                        (status === "out" || status === "negative") && "text-red"
                      )}
                    >
                      {fmtQty(available)}
                    </span>
                    <StockStatusBadge status={status} />
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge tone="neutral">{PRODUCT_STATUS_LABELS[product.status]}</Badge>
                  <span className="text-text-4">{product.unit}</span>
                </div>
              </Link>
            );
          })}
          {rows.length === 0 && (
            <div className="p-8 text-center text-[13px] text-text-4">No products match your filters.</div>
          )}
        </div>
      </Card>
    </div>
  );
}

function SortableHeader<TData>({
  column,
  label,
  align = "left",
}: {
  column: Column<TData, unknown>;
  label: string;
  align?: "left" | "right";
}) {
  const sorted = column.getIsSorted();
  return (
    <button
      onClick={column.getToggleSortingHandler()}
      className={cn(
        "flex items-center gap-1.5 rounded outline-none hover:text-text focus-visible:ring-2 focus-visible:ring-ring/50",
        align === "right" && "ml-auto"
      )}
    >
      {label}
      {sorted === "asc" ? (
        <ArrowUp className="size-3 text-blue" />
      ) : sorted === "desc" ? (
        <ArrowDown className="size-3 text-blue" />
      ) : (
        <ArrowUpDown className="size-3 opacity-40" />
      )}
    </button>
  );
}