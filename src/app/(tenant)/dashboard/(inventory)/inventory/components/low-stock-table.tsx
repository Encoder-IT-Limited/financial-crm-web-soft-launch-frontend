import Link from "next/link";
import { Package } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { lowStockItems } from "../mock-data";

const headClass = "text-[11px] font-semibold uppercase tracking-wide text-text-3";

export function LowStockTable() {
  return (
    <Card>
      <div className="mb-4 flex items-center justify-between gap-2">
        <h2 className="text-sm font-bold text-text min-[1440px]:text-[15px]">Low Stock Items</h2>
        <Button variant="outline" size="sm" render={<Link href="/dashboard/reorder" />}>
          View All
        </Button>
      </div>

      <Table className="text-[12.5px] min-[1440px]:text-[13px]">
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className={`pl-0 ${headClass}`}>Product</TableHead>
            <TableHead className={headClass}>SKU</TableHead>
            <TableHead className={headClass}>Warehouse</TableHead>
            <TableHead className={`text-right ${headClass}`}>Available</TableHead>
            <TableHead className={`text-right ${headClass}`}>Reorder Level</TableHead>
            <TableHead className={`pr-0 text-right ${headClass}`}>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {lowStockItems.map((item) => (
            <TableRow key={item.id}>
              <TableCell className="py-2.5 pl-0">
                <span className="flex items-center gap-2.5">
                  <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-surface-subtle text-text-3">
                    <Package className="size-4" />
                  </span>
                  <span className="font-medium text-text">{item.product}</span>
                </span>
              </TableCell>
              <TableCell className="py-2.5 tabular-nums text-text-3">{item.sku}</TableCell>
              <TableCell className="py-2.5 text-text-2">{item.warehouse}</TableCell>
              <TableCell className="py-2.5 text-right font-semibold tabular-nums text-red">
                {item.available}
              </TableCell>
              <TableCell className="py-2.5 text-right tabular-nums text-text-2">
                {item.reorderLevel}
              </TableCell>
              <TableCell className="py-2.5 pr-0 text-right">
                <Badge tone="red">Low Stock</Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <div className="mt-3 flex justify-end border-t border-border pt-3">
        <Button
          variant="ghost"
          size="sm"
          className="text-blue hover:text-blue"
          render={<Link href="/dashboard/reorder" />}
        >
          View All Low Stock Items
          <span aria-hidden>→</span>
        </Button>
      </div>
    </Card>
  );
}
