import Link from "next/link";
import { ArrowLeft } from "lucide-react";
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
import { recentMovements, type MovementType } from "../../inventory/mock-data";
import type { Product } from "../mock-data";
import {
  ProductThumbnail,
  STOCK_TONE_LABEL,
  getStockTone,
} from "./product-thumbnail";
import { ProductDetailActions } from "./product-detail-actions";

const movementTone: Record<MovementType, "green" | "red" | "blue"> = {
  IN: "green",
  OUT: "red",
  ADJ: "blue",
};

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-border py-2.5 last:border-0 last:pb-0">
      <span className="text-[12.5px] text-text-3 min-[1440px]:text-[13.5px]">{label}</span>
      <span className="text-right text-[12.5px] font-medium text-text min-[1440px]:text-[13.5px]">
        {value}
      </span>
    </div>
  );
}

export function ProductDetails({ product }: { product: Product }) {
  const tone = getStockTone(product.stock, product.lowStock);
  const movements = recentMovements.filter((m) => m.product === product.name);

  return (
    <div>
      <Link
        href="/dashboard/products"
        className="mb-3 inline-flex items-center gap-1.5 text-[12.5px] font-medium text-text-3 transition-colors hover:text-blue"
      >
        <ArrowLeft className="size-3.5" />
        Back to Products
      </Link>

      <div className="flex flex-wrap items-center gap-4">
        <ProductThumbnail product={product} className="size-12 rounded-xl text-sm" />
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-xl font-extrabold tracking-tight text-text sm:text-[22px] min-[1440px]:text-[24px]">
            {product.name}
          </h1>
          <p className="mt-0.5 text-[12.5px] text-text-3 min-[1440px]:text-[13.5px]">
            SKU {product.sku}
          </p>
        </div>
        <div className="flex flex-col items-stretch gap-2 max-sm:w-full sm:items-end">
          <div className="flex items-center gap-2">
            <Badge tone={product.status === "active" ? "green" : "neutral"}>
              {product.status === "active" ? "Active" : "Inactive"}
            </Badge>
            <Badge tone={tone}>{STOCK_TONE_LABEL[tone]}</Badge>
          </div>
          <ProductDetailActions productName={product.name} />
        </div>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card className="gap-0 p-4">
          <div className="text-[11.5px] font-medium text-text-3 min-[1440px]:text-xs">Stock on Hand</div>
          <div className={cn(
            "mt-1 flex items-center gap-1.5 text-lg font-extrabold leading-tight min-[1440px]:text-xl",
            tone === "green" && "text-green",
            tone === "amber" && "text-amber",
            tone === "red" && "text-red"
          )}>
            <span className="size-2 rounded-full bg-current" aria-hidden />
            {product.stock.toLocaleString()}{" "}
            <span className="text-sm font-semibold min-[1440px]:text-[15px]">{product.unit}</span>
          </div>
        </Card>
        <Card className="gap-0 p-4">
          <div className="text-[11.5px] font-medium text-text-3 min-[1440px]:text-xs">Low Stock Alert</div>
          <div className="mt-1 text-lg font-extrabold leading-tight text-text min-[1440px]:text-xl">
            {product.lowStock.toLocaleString()}
          </div>
        </Card>
        <Card className="gap-0 p-4">
          <div className="text-[11.5px] font-medium text-text-3 min-[1440px]:text-xs">Reorder Quantity</div>
          <div className="mt-1 text-lg font-extrabold leading-tight text-text min-[1440px]:text-xl">
            {product.reorderQty.toLocaleString()}
          </div>
        </Card>
        <Card className="gap-0 p-4">
          <div className="text-[11.5px] font-medium text-text-3 min-[1440px]:text-xs">Batch Tracking</div>
          <div className="mt-1 text-lg font-extrabold leading-tight text-text min-[1440px]:text-xl">
            {product.batchTracked ? "On" : "Off"}
          </div>
        </Card>
      </div>

      <div className="mt-4 grid grid-cols-1 items-start gap-4 xl:grid-cols-2">
        <Card>
          <h2 className="mb-2 text-sm font-bold text-text min-[1440px]:text-[15px]">Product Details</h2>
          <DetailRow label="Product ID" value={<span className="tabular-nums">{product.id}</span>} />
          <DetailRow label="SKU" value={<span className="tabular-nums">{product.sku}</span>} />
          <DetailRow label="Category" value={product.category} />
          <DetailRow label="Warehouse" value={product.warehouse} />
          <DetailRow label="Unit" value={product.unit} />
          <DetailRow
            label="Status"
            value={
              <Badge tone={product.status === "active" ? "green" : "neutral"}>
                {product.status === "active" ? "Active" : "Inactive"}
              </Badge>
            }
          />
          <DetailRow
            label="Stock on Hand"
            value={<span className={cn(tone === "green" && "text-green", tone === "amber" && "text-amber", tone === "red" && "text-red")}>{product.stock.toLocaleString()} {product.unit}</span>}
          />
          <DetailRow label="Low Stock Alert" value={<span className="tabular-nums">{product.lowStock.toLocaleString()}</span>} />
          <DetailRow label="Reorder Quantity" value={<span className="tabular-nums">{product.reorderQty.toLocaleString()}</span>} />
          <DetailRow
            label="Batch Tracking"
            value={
              <Badge tone={product.batchTracked ? "green" : "neutral"}>
                {product.batchTracked ? "Tracked" : "Not tracked"}
              </Badge>
            }
          />
        </Card>

        <Card>
          <h2 className="mb-3 text-sm font-bold text-text min-[1440px]:text-[15px]">Recent Movements</h2>
          {movements.length === 0 ? (
            <div className="flex min-h-[160px] items-center justify-center rounded-[10px] border border-dashed border-border px-6 text-center text-[12.5px] text-text-4">
              No stock movements recorded for this product yet.
            </div>
          ) : (
            <Table className="text-[12.5px] min-[1440px]:text-[13px]">
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="pl-0 text-[11px] font-semibold uppercase tracking-wide text-text-3">Date</TableHead>
                  <TableHead className="text-[11px] font-semibold uppercase tracking-wide text-text-3">Type</TableHead>
                  <TableHead className="text-[11px] font-semibold uppercase tracking-wide text-text-3">Reference</TableHead>
                  <TableHead className="text-[11px] font-semibold uppercase tracking-wide text-text-3">Warehouse</TableHead>
                  <TableHead className="text-right text-[11px] font-semibold uppercase tracking-wide text-text-3">In</TableHead>
                  <TableHead className="text-right text-[11px] font-semibold uppercase tracking-wide text-text-3">Out</TableHead>
                  <TableHead className="pr-0 text-right text-[11px] font-semibold uppercase tracking-wide text-text-3">Balance</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {movements.map((m) => (
                  <TableRow key={m.id}>
                    <TableCell className="py-2.5 pl-0 whitespace-nowrap text-text-2">{m.date}</TableCell>
                    <TableCell className="py-2.5">
                      <Badge tone={movementTone[m.type]}>{m.type}</Badge>
                    </TableCell>
                    <TableCell className="py-2.5 font-medium text-text">{m.reference}</TableCell>
                    <TableCell className="py-2.5 text-text-2">{m.warehouse}</TableCell>
                    <TableCell className="py-2.5 text-right font-semibold tabular-nums text-green">
                      {m.inQty != null ? `+${m.inQty}` : "—"}
                    </TableCell>
                    <TableCell className="py-2.5 text-right font-semibold tabular-nums text-red">
                      {m.outQty != null ? `-${m.outQty}` : "—"}
                    </TableCell>
                    <TableCell className="py-2.5 pr-0 text-right font-semibold tabular-nums text-text">
                      {m.balance}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </Card>
      </div>
    </div>
  );
}
