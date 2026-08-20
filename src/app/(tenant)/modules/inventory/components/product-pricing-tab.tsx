"use client";

import { Card } from "@/components/ui/card";
import { fmtMoney, fmtQty } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Product } from "../types";
import { consolidateStock } from "../lib/stock";
import { useInventoryStore } from "../store/inventory-store";

export function ProductPricingTab({ product }: { product: Product }) {
  const stockLevels = useInventoryStore((state) => state.stockLevels);
  const consolidated = consolidateStock(product, stockLevels);
  const margin = product.sellingPrice - product.costPrice;
  const marginPct = product.costPrice > 0 ? Math.round((margin / product.costPrice) * 100) : 0;
  const landedValue = consolidated.available * consolidated.averageCost;

  return (
    <div className="flex flex-col gap-4">
      <Card className="gap-0 p-0">
        <div className="border-b border-border px-5 py-3 text-sm font-bold text-text">Global pricing</div>
        <div className="grid gap-x-8 gap-y-3 p-5 sm:grid-cols-2 lg:grid-cols-4">
          <div className="flex flex-col gap-0.5">
            <span className="text-[10.5px] font-bold uppercase tracking-wide text-text-4">Base cost</span>
            <span className="text-[13px] font-semibold text-text">{fmtMoney(product.costPrice)}</span>
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-[10.5px] font-bold uppercase tracking-wide text-text-4">Base selling price</span>
            <span className="text-[13px] font-semibold text-text">{fmtMoney(product.sellingPrice)}</span>
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-[10.5px] font-bold uppercase tracking-wide text-text-4">Tax rate</span>
            <span className="text-[13px] font-semibold text-text">{product.taxRate}%</span>
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-[10.5px] font-bold uppercase tracking-wide text-text-4">Margin per unit</span>
            <span className={cn("text-[13px] font-semibold", margin >= 0 ? "text-green" : "text-red")}>
              {fmtMoney(margin)} ({marginPct >= 0 ? "+" : ""}
              {marginPct}%)
            </span>
          </div>
        </div>
      </Card>

      <Card className="gap-0 p-0">
        <div className="border-b border-border px-5 py-3 text-sm font-bold text-text">
          Valuation at weighted-average cost
        </div>
        <div className="grid gap-x-8 gap-y-3 p-5 sm:grid-cols-2 lg:grid-cols-4">
          <div className="flex flex-col gap-0.5">
            <span className="text-[10.5px] font-bold uppercase tracking-wide text-text-4">Total units on hand</span>
            <span className="text-[13px] font-semibold text-text">{fmtQty(consolidated.available)}</span>
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-[10.5px] font-bold uppercase tracking-wide text-text-4">Blended avg cost</span>
            <span className="text-[13px] font-semibold text-text">{fmtMoney(consolidated.averageCost)}</span>
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-[10.5px] font-bold uppercase tracking-wide text-text-4">Landed value</span>
            <span className="text-[13px] font-semibold text-green">{fmtMoney(landedValue)}</span>
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-[10.5px] font-bold uppercase tracking-wide text-text-4">Warehouses stocked</span>
            <span className="text-[13px] font-semibold text-text">{consolidated.warehousesWithStock}</span>
          </div>
        </div>
        <div className="border-t border-border px-5 py-3">
          <p className="text-[11px] leading-relaxed text-text-4">
            Per-warehouse average costs come from goods receipts. The value above uses each warehouse&apos;s weighted-average
            cost — real recalculation happens on receipts (backend, out of scope for the frontend mock).
          </p>
        </div>
      </Card>
    </div>
  );
}