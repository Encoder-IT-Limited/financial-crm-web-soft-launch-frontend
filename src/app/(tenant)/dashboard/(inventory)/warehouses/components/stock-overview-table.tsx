import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import {
  getStockStatus,
  totalQty,
  type StockOverviewRow,
  type Warehouse,
} from "../mock-data";

const statusBadge = {
  "in-stock": { label: "In Stock", tone: "green" as const },
  "low-stock": { label: "Low Stock", tone: "amber" as const },
  "out-of-stock": { label: "Out of Stock", tone: "red" as const },
};

export function StockOverviewTable({
  rows,
  warehouses,
}: {
  rows: StockOverviewRow[];
  warehouses: Warehouse[];
}) {
  return (
    <Card>
      <div className="mb-4">
        <h2 className="text-sm font-bold text-text min-[1440px]:text-[15px]">Stock Overview</h2>
        <p className="mt-0.5 text-[12px] text-text-3 min-[1440px]:text-[12.5px]">
          Real-time stock levels across all warehouses
        </p>
      </div>

      <Table className="text-[12.5px] min-[1440px]:text-[13px]">
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="pl-0 text-[11px] font-semibold uppercase tracking-wide text-text-3">
              Product Name
            </TableHead>
            <TableHead className="text-[11px] font-semibold uppercase tracking-wide text-text-3">
              SKU
            </TableHead>
            {warehouses.map((w) => (
              <TableHead
                key={w.id}
                className="text-right text-[11px] font-semibold uppercase tracking-wide text-text-3"
              >
                {w.name}
              </TableHead>
            ))}
            <TableHead className="text-right text-[11px] font-semibold uppercase tracking-wide text-text-3">
              Total Stock
            </TableHead>
            <TableHead className="text-right text-[11px] font-semibold uppercase tracking-wide text-text-3">
              Reorder Level
            </TableHead>
            <TableHead className="pr-0 text-right text-[11px] font-semibold uppercase tracking-wide text-text-3">
              Status
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => {
            const status = getStockStatus(row);
            const badge = statusBadge[status];
            return (
              <TableRow key={row.id}>
                <TableCell className="py-2.5 pl-0 font-medium whitespace-nowrap text-text">
                  {row.product}
                </TableCell>
                <TableCell className="py-2.5 tabular-nums text-text-3">{row.sku}</TableCell>
                {warehouses.map((w) => {
                  const qty = row.qtyByWarehouse[w.id] ?? 0;
                  return (
                    <TableCell
                      key={w.id}
                      className={cn(
                        "py-2.5 text-right tabular-nums",
                        qty === 0 ? "text-text-4" : "text-text-2"
                      )}
                    >
                      {qty}
                    </TableCell>
                  );
                })}
                <TableCell className="py-2.5 text-right font-semibold tabular-nums text-text">
                  {totalQty(row)}
                </TableCell>
                <TableCell className="py-2.5 text-right tabular-nums text-text-2">
                  {row.reorderLevel}
                </TableCell>
                <TableCell className="py-2.5 pr-0 text-right">
                  <Badge tone={badge.tone}>{badge.label}</Badge>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </Card>
  );
}
