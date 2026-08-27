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
import { useStock, useValuation } from "../hooks/use-inventory";

/** Phase 1 valuation is weighted-average cost only (matches backend stock balances). */
export function ValuationPage() {
  const { data, isLoading: loading } = useValuation();
  const { data: stock = [] } = useStock();
  const total = data?.totalValue ?? 0;

  const tableRows = useMemo(
    () => (data?.rows ?? []).map((r) => ({ ...r, key: `${r.productId}-${r.warehouseId}` })),
    [data],
  );

  // Valuation's own rows don't carry damaged/reserved units — cross-reference
  // the separately-fetched stock balances (same productId+warehouseId join
  // key) to break out how much of the total value above is damaged or
  // reserved stock, valued at that row's own average cost.
  const { damagedValue, reservedValue } = useMemo(() => {
    let damaged = 0;
    let reserved = 0;
    for (const s of stock) {
      if (s.damagedQuantity > 0) damaged += s.damagedQuantity * s.averageCost;
      if (s.reservedQuantity > 0) reserved += s.reservedQuantity * s.averageCost;
    }
    return { damagedValue: damaged, reservedValue: reserved };
  }, [stock]);

  return (
    <div className="flex flex-col gap-5">
      <PageHeading
        title="Inventory Valuation"
        subtitle="Weighted average cost × on-hand quantity (Phase 1)"
      />

      <Card className="p-5">
        <div className="mb-4 text-[13px] text-text-2">
          Total stock value: <span className="font-bold text-text">{fmtMoney(total)}</span>
          {(damagedValue > 0 || reservedValue > 0) && (
            <div className="mt-1 text-[11.5px] text-text-4">
              of which
              {damagedValue > 0 && <span className="text-amber"> {fmtMoney(damagedValue)} damaged</span>}
              {damagedValue > 0 && reservedValue > 0 && ","}
              {reservedValue > 0 && <span className="text-blue"> {fmtMoney(reservedValue)} reserved</span>}
            </div>
          )}
        </div>
        {loading ? (
          <Skeleton className="h-40 w-full" />
        ) : tableRows.length === 0 ? (
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
                {tableRows.map((r) => (
                  <TableRow key={r.key}>
                    <TableCell className="tabular-nums text-text-2">{r.sku}</TableCell>
                    <TableCell className="font-semibold">{r.name}</TableCell>
                    <TableCell>{r.warehouseName}</TableCell>
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
