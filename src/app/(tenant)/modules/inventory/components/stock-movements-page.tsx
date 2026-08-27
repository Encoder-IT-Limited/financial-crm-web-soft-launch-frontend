"use client";

import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
import { useBatches, useMovements, useProducts, useWarehouses } from "../hooks/use-inventory";

const REFERENCE_LABELS: Record<string, string> = {
  INVOICE: "Invoice",
  PURCHASE_ORDER: "Purchase Order",
  GOODS_RECEIPT: "Goods Receipt",
  TRANSFER: "Transfer",
  POS_SALE: "POS Sale",
};

export function StockMovementsPage() {
  const { data: movements = [], isLoading } = useMovements();
  const { data: products = [] } = useProducts();
  const { data: warehouses = [] } = useWarehouses();
  const { data: batches = [] } = useBatches();
  const [search, setSearch] = useState("");

  const productById = useMemo(() => new Map(products.map((p) => [p.id, p])), [products]);
  const warehouseById = useMemo(() => new Map(warehouses.map((w) => [w.id, w])), [warehouses]);
  const batchById = useMemo(() => new Map(batches.map((b) => [b.id, b])), [batches]);

  const filtered = useMemo(() => {
    const needle = search.trim().toLowerCase();
    if (!needle) return movements;
    return movements.filter((m) => {
      const product = productById.get(m.productId);
      const warehouse = warehouseById.get(m.warehouseId);
      const hay = `${m.movementType} ${product?.name ?? ""} ${product?.sku ?? ""} ${warehouse?.name ?? ""}`.toLowerCase();
      return hay.includes(needle);
    });
  }, [movements, productById, warehouseById, search]);

  return (
    <div className="flex flex-col gap-5">
      <PageHeading title="Stock Movements" subtitle="Live ledger of inventory quantity changes" />

      <Card className="flex flex-col gap-4 p-5">
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by product, SKU, warehouse, or type..."
          className="h-9 max-w-sm border-border text-[12.5px]"
        />

        {isLoading ? (
          <Skeleton className="h-40 w-full" />
        ) : filtered.length === 0 ? (
          <p className="py-10 text-center text-[13px] text-text-3">No stock movements yet.</p>
        ) : (
          <div className="overflow-x-auto rounded-[10px] border border-border">
            <Table>
              <TableHeader>
                <TableRow className="bg-surface-subtle hover:bg-surface-subtle">
                  <TableHead>Date</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>Warehouse</TableHead>
                  <TableHead>Qty</TableHead>
                  <TableHead>Unit Cost</TableHead>
                  <TableHead>Batch</TableHead>
                  <TableHead>Source</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((m) => {
                  const product = productById.get(m.productId);
                  const warehouse = warehouseById.get(m.warehouseId);
                  const batch = m.batchId ? batchById.get(m.batchId) : undefined;
                  return (
                    <TableRow key={m.id}>
                      <TableCell className="tabular-nums text-text-2">
                        {new Date(m.movementDate).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <Badge tone="neutral">{m.movementType}</Badge>
                      </TableCell>
                      <TableCell className="font-semibold">
                        {product ? `${product.name} (${product.sku})` : m.productId.slice(0, 8)}
                      </TableCell>
                      <TableCell>{warehouse?.name ?? m.warehouseId.slice(0, 8)}</TableCell>
                      <TableCell className="tabular-nums">
                        {m.quantity >= 0 ? "+" : ""}
                        {m.quantity}
                      </TableCell>
                      <TableCell className="tabular-nums">{m.unitCost.toFixed(2)}</TableCell>
                      <TableCell className="text-text-2">
                        {batch?.batchNumber ?? (m.batchId ? m.batchId.slice(0, 8) : <span className="text-text-4">—</span>)}
                      </TableCell>
                      <TableCell className="text-text-2">
                        {m.referenceType ? (
                          <span className="whitespace-nowrap">
                            {REFERENCE_LABELS[m.referenceType] ?? m.referenceType}
                            {m.referenceId && <span className="text-text-4"> · {m.referenceId.slice(0, 8)}</span>}
                          </span>
                        ) : (
                          <span className="text-text-4">—</span>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>
    </div>
  );
}
