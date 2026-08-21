import Link from "next/link";
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
import { recentMovements, type MovementType } from "../mock-data";

const typeTone: Record<MovementType, "green" | "red" | "blue"> = {
  IN: "green",
  OUT: "red",
  ADJ: "blue",
};

const headClass = "text-[11px] font-semibold uppercase tracking-wide text-text-3";

export function RecentMovementsTable() {
  return (
    <Card>
      <div className="mb-4 flex items-center justify-between gap-2">
        <h2 className="text-sm font-bold text-text min-[1440px]:text-[15px]">
          Recent Stock Movements
        </h2>
        <Button variant="outline" size="sm" render={<Link href="/dashboard/stock-movement" />}>
          View All
        </Button>
      </div>

      <Table className="text-[12.5px] min-[1440px]:text-[13px]">
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className={`pl-0 ${headClass}`}>Date</TableHead>
            <TableHead className={headClass}>Type</TableHead>
            <TableHead className={headClass}>Reference</TableHead>
            <TableHead className={headClass}>Product</TableHead>
            <TableHead className={headClass}>Warehouse</TableHead>
            <TableHead className={`text-right ${headClass}`}>In</TableHead>
            <TableHead className={`text-right ${headClass}`}>Out</TableHead>
            <TableHead className={`pr-0 text-right ${headClass}`}>Balance</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {recentMovements.map((m) => (
            <TableRow key={m.id}>
              <TableCell className="py-2.5 pl-0 whitespace-nowrap text-text-2">{m.date}</TableCell>
              <TableCell className="py-2.5">
                <Badge tone={typeTone[m.type]}>{m.type}</Badge>
              </TableCell>
              <TableCell className="py-2.5 font-medium text-text">{m.reference}</TableCell>
              <TableCell className="py-2.5 text-text-2">{m.product}</TableCell>
              <TableCell className="py-2.5 text-text-2">{m.warehouse}</TableCell>
              <TableCell className="py-2.5 text-right font-semibold tabular-nums">
                {m.inQty != null ? (
                  <span className="text-green">+{m.inQty}</span>
                ) : (
                  <span className="text-text-4">—</span>
                )}
              </TableCell>
              <TableCell className="py-2.5 text-right font-semibold tabular-nums">
                {m.outQty != null ? (
                  <span className="text-red">-{m.outQty}</span>
                ) : (
                  <span className="text-text-4">—</span>
                )}
              </TableCell>
              <TableCell className="py-2.5 pr-0 text-right font-semibold tabular-nums text-text">
                {m.balance}
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
          render={<Link href="/dashboard/stock-movement" />}
        >
          View All Movements
          <span aria-hidden>→</span>
        </Button>
      </div>
    </Card>
  );
}
