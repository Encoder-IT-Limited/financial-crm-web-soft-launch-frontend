"use client";

import { useState } from "react";
import { ArrowLeftRight, BookOpen, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { StatTiles } from "../../billing/components/stat-tiles";
import { toast } from "@/lib/toast";
import { fmtMoney, fmtQty } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Product } from "../types";
import { consolidateStock, deriveStatus, reorderLevelFor, reorderQuantityFor, stockLevelFor, warehouseName } from "../lib/stock";
import { inventoryApi } from "../api/inventory.service";
import { useInventoryStore } from "../store/inventory-store";
import { StockStatusBadge } from "./stock-status-badge";
import { TransferDialog } from "./transfer-dialog";
import { AdjustmentDialog } from "./adjustment-dialog";
import { StockLedgerDialog } from "./stock-ledger-dialog";

export function InventoryMatrix({ product }: { product: Product }) {
  const warehouses = useInventoryStore((state) => state.warehouses);
  const stockLevels = useInventoryStore((state) => state.stockLevels);
  const [ledgerFor, setLedgerFor] = useState<string | null>(null);
  const [adjustFor, setAdjustFor] = useState<string | null>(null);
  const [transferFrom, setTransferFrom] = useState<string | null>(null);

  const consolidated = consolidateStock(product, stockLevels);

  const rows = warehouses.map((wh) => {
    const level = stockLevelFor(product.id, wh.id, stockLevels);
    const available = level?.quantity ?? 0;
    const reorder = reorderLevelFor(product, wh.id);
    return {
      wh,
      level,
      available,
      reorder,
      status: deriveStatus(available, reorder),
    };
  });

  const negativeAny = rows.some((r) => r.available < 0);

  return (
    <div className="flex flex-col gap-4">
      <StatTiles
        tiles={[
          { label: "Total Stock", value: fmtQty(consolidated.available), tone: "blue", sub: `across ${rows.filter((r) => r.available !== 0).length} warehouses` },
          { label: "Total Value", value: fmtMoney(consolidated.value), tone: "green", sub: "weighted-average cost" },
          { label: "In-Transit", value: fmtQty(consolidated.inTransit), tone: "neutral", sub: "dispatched transfers" },
          { label: "Damaged", value: fmtQty(consolidated.damaged), tone: "amber", sub: "quarantined units" },
        ]}
      />

      {negativeAny && (
        <div className="flex items-center gap-2 rounded-lg border border-red-t bg-red-l px-4 py-3 text-[12px] font-semibold text-red">
          Negative stock detected in at least one warehouse — reconcile before selling or transferring.
        </div>
      )}

      <Card className="gap-0 p-0">
        <div className="flex items-center justify-between border-b border-border px-5 py-3">
          <div className="text-sm font-bold text-text">Warehouse stock matrix</div>
          <span className="text-[10.5px] font-bold text-text-4">Click reorder values to edit inline</span>
        </div>

        {/* Desktop table */}
        <div className="overflow-x-auto lg:block hidden">
          <table className="w-full text-left">
            <thead className="bg-surface-subtle text-[10.5px] font-bold uppercase tracking-wide text-text-3">
              <tr>
                <th className="px-5 py-2.5">Warehouse</th>
                <th className="px-3 py-2.5 text-right">Available</th>
                <th className="px-3 py-2.5 text-right">Reserved</th>
                <th className="px-3 py-2.5 text-right">In-Transit</th>
                <th className="px-3 py-2.5 text-right">Damaged</th>
                <th className="px-3 py-2.5 text-right">Reorder Level</th>
                <th className="px-3 py-2.5 text-right">Reorder Qty</th>
                <th className="px-3 py-2.5">Status</th>
                <th className="px-5 py-2.5 text-right">Quick Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rows.map(({ wh, level, available, reorder, status }) => (
                <tr
                  key={wh.id}
                  className={cn(
                    "transition-colors hover:bg-surface-subtle",
                    status === "negative" && "bg-red-l/40 hover:bg-red-l/60 dark:bg-red-l/10",
                    status === "out" && "bg-red-l/20 hover:bg-red-l/40 dark:bg-red-l/5"
                  )}
                >
                  <td className="px-5 py-3">
                    <div className="text-[12.5px] font-bold text-text">{wh.name}</div>
                    <div className="text-[10.5px] text-text-4">
                      {wh.code} · {wh.location}
                      {wh.isPOSLinked && " · POS linked"}
                    </div>
                  </td>
                  <td className={cn("px-3 py-3 text-right text-[13px] font-bold tabular-nums", status === "in-stock" && "text-green", status === "low" && "text-amber", (status === "out" || status === "negative") && "text-red")}>
                    {fmtQty(available)}
                  </td>
                  <td className="px-3 py-3 text-right text-[12.5px] tabular-nums text-text-2">{fmtQty(level?.reserved ?? 0)}</td>
                  <td className="px-3 py-3 text-right text-[12.5px] tabular-nums text-text-2">{fmtQty(level?.inTransit ?? 0)}</td>
                  <td className="px-3 py-3 text-right text-[12.5px] tabular-nums text-amber">{fmtQty(level?.damaged ?? 0)}</td>
                  <td className="px-3 py-3 text-right">
                    <EditableNumber
                      value={reorder}
                      label={`Reorder level at ${wh.name}`}
                      onCommit={(v) => commitReorder(product.id, wh.id, v, reorderQuantityFor(product, wh.id))}
                    />
                  </td>
                  <td className="px-3 py-3 text-right">
                    <EditableNumber
                      value={reorderQuantityFor(product, wh.id)}
                      label={`Reorder quantity at ${wh.name}`}
                      onCommit={(v) => commitReorder(product.id, wh.id, reorderLevelFor(product, wh.id), v)}
                    />
                  </td>
                  <td className="px-3 py-3">
                    <StockStatusBadge status={status} />
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="icon-sm" aria-label={`Transfer from ${wh.name}`} onClick={() => setTransferFrom(wh.id)}>
                        <ArrowLeftRight />
                      </Button>
                      <Button variant="ghost" size="icon-sm" aria-label={`Adjust stock at ${wh.name}`} onClick={() => setAdjustFor(wh.id)}>
                        <SlidersHorizontal />
                      </Button>
                      <Button variant="ghost" size="icon-sm" aria-label={`View ledger for ${wh.name}`} onClick={() => setLedgerFor(wh.id)}>
                        <BookOpen />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile stacked cards */}
        <div className="flex flex-col divide-y divide-border lg:hidden">
          {rows.map(({ wh, level, available, reorder, status }) => (
            <div key={wh.id} className="flex flex-col gap-3 p-4">
              <div className="flex items-center justify-between gap-2">
                <div className="flex flex-col">
                  <span className="text-[13px] font-bold text-text">{wh.name}</span>
                  <span className="text-[10.5px] text-text-4">
                    {wh.code} · {wh.location}
                  </span>
                </div>
                <StockStatusBadge status={status} />
              </div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-[12.5px]">
                <Value label="Available" value={fmtQty(available)} tone={status} />
                <Value label="Reserved" value={fmtQty(level?.reserved ?? 0)} />
                <Value label="In-Transit" value={fmtQty(level?.inTransit ?? 0)} />
                <Value label="Damaged" value={fmtQty(level?.damaged ?? 0)} />
                <div className="flex items-center justify-between gap-2">
                  <span className="text-text-4">Reorder level</span>
                  <EditableNumber value={reorder} label={`Reorder level at ${wh.name}`} onCommit={(v) => commitReorder(product.id, wh.id, v, reorderQuantityFor(product, wh.id))} />
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-text-4">Reorder qty</span>
                  <EditableNumber value={reorderQuantityFor(product, wh.id)} label={`Reorder qty at ${wh.name}`} onCommit={(v) => commitReorder(product.id, wh.id, reorderLevelFor(product, wh.id), v)} />
                </div>
              </div>
              <div className="flex gap-2">
                <Button size="xs" variant="outline" onClick={() => setTransferFrom(wh.id)}>
                  <ArrowLeftRight /> Transfer
                </Button>
                <Button size="xs" variant="outline" onClick={() => setAdjustFor(wh.id)}>
                  <SlidersHorizontal /> Adjust
                </Button>
                <Button size="xs" variant="outline" onClick={() => setLedgerFor(wh.id)}>
                  <BookOpen /> Ledger
                </Button>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {transferFrom && (
        <TransferDialog
          productId={product.id}
          productName={product.name}
          fromWarehouseId={transferFrom}
          open={transferFrom !== null}
          onOpenChange={(open) => {
            if (!open) setTransferFrom(null);
          }}
          warehouses={warehouses}
        />
      )}
      {adjustFor && (
        <AdjustmentDialog
          productId={product.id}
          productName={product.name}
          warehouseId={adjustFor}
          warehouseName={warehouseName(warehouses, adjustFor)}
          open={adjustFor !== null}
          onOpenChange={(open) => {
            if (!open) setAdjustFor(null);
          }}
        />
      )}
      {ledgerFor && (
        <StockLedgerDialog
          productId={product.id}
          productName={product.name}
          warehouseId={ledgerFor}
          warehouseName={warehouseName(warehouses, ledgerFor)}
          open={ledgerFor !== null}
          onOpenChange={(open) => {
            if (!open) setLedgerFor(null);
          }}
        />
      )}
    </div>
  );

  async function commitReorder(productId: string, warehouseId: string, reorderLevel: number, reorderQuantity: number) {
    await inventoryApi.setReorderLevels(productId, warehouseId, reorderLevel, reorderQuantity);
    toast.success("Reorder settings updated");
  }
}

function Value({ label, value, tone }: { label: string; value: string; tone?: string }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-text-4">{label}</span>
      <span
        className={cn(
          "font-bold tabular-nums",
          tone === "in-stock" && "text-green",
          tone === "low" && "text-amber",
          (tone === "out" || tone === "negative") && "text-red",
          !tone && "text-text"
        )}
      >
        {value}
      </span>
    </div>
  );
}

/** Click-to-edit numeric cell — commits on blur/Enter. */
function EditableNumber({ value, onCommit, label }: { value: number; onCommit: (next: number) => void; label: string }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(String(value));

  function commit() {
    setEditing(false);
    const next = Number(draft);
    if (!Number.isFinite(next) || next < 0 || next === value) {
      setDraft(String(value));
      return;
    }
    setDraft(String(next));
    onCommit(next);
  }

  if (editing) {
    return (
      <Input
        autoFocus
        type="number"
        min={0}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") commit();
          if (e.key === "Escape") {
            setDraft(String(value));
            setEditing(false);
          }
        }}
        className="ml-auto h-7 w-20 text-right text-[12.5px]"
        aria-label={label}
      />
    );
  }

  return (
    <button
      type="button"
      onClick={() => setEditing(true)}
      title={`Edit ${label}`}
      className="ml-auto rounded px-1.5 py-0.5 text-right text-[12.5px] font-semibold tabular-nums text-text transition-colors hover:bg-blue-l hover:text-blue"
    >
      {value}
    </button>
  );
}