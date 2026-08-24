"use client";

import { useMemo } from "react";
import { Card } from "@/components/ui/card";
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
import { fmtMoney } from "@/lib/format";
import { useProducts, useStock, useWarehouses } from "../hooks/use-inventory";

/** Phase 1 valuation is weighted-average cost only (matches backend stock balances). */
export function ValuationPage() {
  const { data: stock = [], isLoading: stockLoading } = useStock();
  const { data: products = [], isLoading: productsLoading } = useProducts();
  const { data: warehouses = [], isLoading: warehousesLoading } = useWarehouses();

  const productById = useMemo(() => new Map(products.map((p) => [p.id, p])), [products]);
  const warehouseById = useMemo(() => new Map(warehouses.map((w) => [w.id, w])), [warehouses]);

  const rows = useMemo(
    () =>
      stock
        .map((s) => {
          const product = productById.get(s.productId);
          const warehouse = warehouseById.get(s.warehouseId);
          const value = s.quantity * s.averageCost;
          return {
            key: `${s.productId}-${s.warehouseId}`,
            sku: product?.sku ?? s.productId.slice(0, 8),
            name: product?.name ?? "Unknown product",
            warehouse: warehouse?.name ?? s.warehouseId.slice(0, 8),
            quantity: s.quantity,
            averageCost: s.averageCost,
            value,
          };
        })
        .sort((a, b) => b.value - a.value),
    [stock, productById, warehouseById],
  );

  const total = rows.reduce((sum, r) => sum + r.value, 0);
  const loading = stockLoading || productsLoading || warehousesLoading;

  return (
    <div className="flex flex-col gap-5">
      <PageHeading
        title="Inventory Valuation"
        subtitle="Weighted average cost × on-hand quantity (Phase 1)"
      />

      <Card className="p-5">
        <div className="mb-4 text-[13px] text-text-2">
          Total stock value: <span className="font-bold text-text">{fmtMoney(total)}</span>
        </div>
        {loading ? (
          <Skeleton className="h-40 w-full" />
        ) : rows.length === 0 ? (
          <p className="py-10 text-center text-[13px] text-text-3">No stock balances to value.</p>
        ) : (
          <div className="overflow-x-auto rounded-[10px] border border-border">
            <Table>
              <TableHeader>
                <TableRow className="bg-surface-subtle hover:bg-surface-subtle">
                  <TableHead>SKU</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>Warehouse</TableHead>
                  <TableHead className="text-right">Qty</TableHead>
                  <TableHead className="text-right">Avg cost</TableHead>
                  <TableHead className="text-right">Value</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((r) => (
                  <TableRow key={r.key}>
                    <TableCell className="tabular-nums text-text-2">{r.sku}</TableCell>
                    <TableCell className="font-semibold">{r.name}</TableCell>
                    <TableCell>{r.warehouse}</TableCell>
                    <TableCell className="text-right tabular-nums">{r.quantity}</TableCell>
                    <TableCell className="text-right tabular-nums">{fmtMoney(r.averageCost)}</TableCell>
                    <TableCell className="text-right font-semibold tabular-nums">{fmtMoney(r.value)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>
    </div>
  );
}
