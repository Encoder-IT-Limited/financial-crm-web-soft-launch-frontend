"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { newId, nextSequence } from "@/lib/format";
import { suggestedBatchId } from "../lib/batch";
import type {
  AdjustmentType,
  Batch,
  MovementType,
  Product,
  ProductStatus,
  StockLevel,
  StockMovement,
  Transfer,
  Warehouse,
} from "../types";
import {
  seedAdjustmentSeq,
  seedBatches,
  seedMovements,
  seedProductSeq,
  seedProducts,
  seedStockLevels,
  seedTransferSeq,
  seedTransfers,
  seedWarehouses,
} from "../lib/seed";

export type NewProductInput = {
  sku: string;
  barcode: string;
  name: string;
  category: string;
  unit: string;
  costPrice: number;
  sellingPrice: number;
  taxRate: number;
  trackBatch: boolean;
  trackExpiry: boolean;
  status: ProductStatus;
  description?: string;
};

/** Per-warehouse opening stock entered on the create form. */
export type WarehouseInit = {
  warehouseId: string;
  available: number;
  reorderLevel: number;
  reorderQuantity: number;
  averageCost: number;
};

export type TransferDraft = {
  productId: string;
  fromWarehouseId: string;
  toWarehouseId: string;
  quantity: number;
  notes?: string;
};

type InventoryStore = {
  products: Product[];
  productSeq: number;
  warehouses: Warehouse[];
  stockLevels: StockLevel[];
  batches: Batch[];
  transfers: Transfer[];
  movements: StockMovement[];
  transferSeq: number;
  adjustmentSeq: number;

  addProduct: (input: NewProductInput, inits: WarehouseInit[]) => Product;
  updateProduct: (id: string, input: NewProductInput) => void;
  setReorderLevels: (productId: string, warehouseId: string, reorderLevel: number, reorderQuantity: number) => void;
  adjustStock: (productId: string, warehouseId: string, type: AdjustmentType, quantity: number, reasonCode: string, notes?: string) => void;
  createTransfer: (draft: TransferDraft) => Transfer | null;
  dispatchTransfer: (id: string) => void;
  receiveTransfer: (id: string) => void;
  cancelTransfer: (id: string) => void;
  addBatch: (productId: string, warehouseId: string, batchNumber: string, quantity: number, expiryDate: string | null) => Batch;
};

/** Safety wrapper so we never mutate a seeded/loaded level object. */
function levelOf(levels: StockLevel[], productId: string, warehouseId: string): StockLevel | null {
  return levels.find((l) => l.productId === productId && l.warehouseId === warehouseId) ?? null;
}

export const useInventoryStore = create<InventoryStore>()(
  persist(
    (set, get) => ({
      products: seedProducts,
      productSeq: seedProductSeq,
      warehouses: seedWarehouses,
      stockLevels: seedStockLevels,
      batches: seedBatches,
      transfers: seedTransfers,
      movements: seedMovements,
      transferSeq: seedTransferSeq,
      adjustmentSeq: seedAdjustmentSeq,

      addProduct: (input, inits) => {
        const state = get();
        const sku = input.sku.trim() || `SKU-${nextSequence(state.productSeq)}`;
        const product: Product = {
          id: newId("prd"),
          sku,
          barcode: input.barcode.trim(),
          name: input.name.trim(),
          category: input.category,
          unit: input.unit,
          costPrice: input.costPrice,
          sellingPrice: input.sellingPrice,
          taxRate: input.taxRate,
          reorderLevel: inits[0]?.reorderLevel ?? 10,
          reorderLevels: Object.fromEntries(inits.map((i) => [i.warehouseId, i.reorderLevel])),
          reorderQuantities: Object.fromEntries(inits.map((i) => [i.warehouseId, i.reorderQuantity])),
          trackBatch: input.trackBatch,
          trackExpiry: input.trackExpiry,
          status: input.status,
          description: input.description?.trim() || undefined,
          images: [],
          createdAt: new Date().toISOString(),
        };
        const levels: StockLevel[] = inits
          .filter((i) => i.available !== 0 || i.reorderLevel > 0)
          .map((i) => ({
            productId: product.id,
            warehouseId: i.warehouseId,
            quantity: i.available,
            reserved: 0,
            inTransit: 0,
            damaged: 0,
            averageCost: i.averageCost || input.costPrice,
          }));
        const openings: StockMovement[] = levels.map((l) => ({
          id: newId("mv"),
          at: new Date().toISOString(),
          type: "opening",
          productId: product.id,
          warehouseId: l.warehouseId,
          batchId: null,
          quantity: l.quantity,
          refType: "adjustment",
          refNumber: "OPENING",
          createdBy: "Salma H.",
        }));
        set((s) => ({
          products: [product, ...s.products],
          stockLevels: [...s.stockLevels, ...levels],
          movements: [...openings, ...s.movements],
          productSeq: s.productSeq + 1,
        }));
        return product;
      },

      updateProduct: (id, input) => {
        set((s) => ({
          products: s.products.map((p) =>
            p.id === id
              ? {
                  ...p,
                  sku: input.sku.trim() || p.sku,
                  barcode: input.barcode.trim(),
                  name: input.name.trim(),
                  category: input.category,
                  unit: input.unit,
                  costPrice: input.costPrice,
                  sellingPrice: input.sellingPrice,
                  taxRate: input.taxRate,
                  trackBatch: input.trackBatch,
                  trackExpiry: input.trackExpiry,
                  status: input.status,
                  description: input.description?.trim() || undefined,
                }
              : p
          ),
        }));
      },

      setReorderLevels: (productId, warehouseId, reorderLevel, reorderQuantity) => {
        set((s) => ({
          products: s.products.map((p) =>
            p.id === productId
              ? {
                  ...p,
                  reorderLevels: { ...p.reorderLevels, [warehouseId]: reorderLevel },
                  reorderQuantities: { ...p.reorderQuantities, [warehouseId]: reorderQuantity },
                }
              : p
          ),
        }));
      },

      adjustStock: (productId, warehouseId, type, quantity, reasonCode, notes) => {
        const qty = Math.abs(quantity);
        if (qty === 0) return;
        const isDamage = type === "damaged" || type === "expired";
        const sign = type === "add" ? 1 : -1;

        set((s) => {
          const levels = s.stockLevels.map((l) => {
            if (l.productId !== productId || l.warehouseId !== warehouseId) return l;
            return {
              ...l,
              quantity: l.quantity + sign * qty,
              damaged: isDamage ? l.damaged + qty : l.damaged,
            };
          });

          let batches = s.batches;
          if (isDamage && (type === "expired" || type === "damaged")) {
            const targetId = suggestedBatchId(s.batches, productId, warehouseId);
            if (targetId) {
              batches = s.batches.map((b) => {
                if (b.id !== targetId) return b;
                const take = Math.min(qty, Math.max(0, b.quantity - b.quarantineQuantity));
                return { ...b, quarantineQuantity: b.quarantineQuantity + take };
              });
            }
          }

          const movementType: MovementType = type === "add" || type === "remove" ? "adjustment" : type;
          const movement: StockMovement = {
            id: newId("mv"),
            at: new Date().toISOString(),
            type: movementType,
            productId,
            warehouseId,
            batchId: null,
            quantity: sign * qty,
            refType: "adjustment",
            refNumber: `ADJ-${nextSequence(s.adjustmentSeq)}`,
            createdBy: "Salma H.",
            notes,
          };
          return { stockLevels: levels, batches, movements: [movement, ...s.movements], adjustmentSeq: s.adjustmentSeq + 1 };
        });
      },

      createTransfer: (draft) => {
        const state = get();
        const source = levelOf(state.stockLevels, draft.productId, draft.fromWarehouseId);
        const available = source?.quantity ?? 0;
        if (available < draft.quantity) return null;
        const transfer: Transfer = {
          id: newId("trf"),
          number: `TRF-${nextSequence(state.transferSeq)}`,
          fromWarehouseId: draft.fromWarehouseId,
          toWarehouseId: draft.toWarehouseId,
          requestedBy: "Salma H.",
          requestedAt: new Date().toISOString(),
          status: "requested",
          items: [{ id: newId("trfi"), productId: draft.productId, quantity: draft.quantity, batchId: null }],
          notes: draft.notes || undefined,
        };
        set((s) => ({ transfers: [transfer, ...s.transfers], transferSeq: s.transferSeq + 1 }));
        return transfer;
      },

      dispatchTransfer: (id) => {
        const state = get();
        const transfer = state.transfers.find((t) => t.id === id);
        if (!transfer || transfer.status !== "requested") return;
        const movements: StockMovement[] = [];
        const stockLevels = state.stockLevels.map((l) => {
          for (const item of transfer.items) {
            if (l.productId === item.productId && l.warehouseId === transfer.fromWarehouseId) {
              movements.push({
                id: newId("mv"),
                at: new Date().toISOString(),
                type: "transfer-out",
                productId: item.productId,
                warehouseId: transfer.fromWarehouseId,
                batchId: item.batchId,
                quantity: -item.quantity,
                refType: "transfer",
                refNumber: transfer.number,
                createdBy: "Salma H.",
              });
              return { ...l, quantity: l.quantity - item.quantity };
            }
            if (l.productId === item.productId && l.warehouseId === transfer.toWarehouseId) {
              movements.push({
                id: newId("mv"),
                at: new Date().toISOString(),
                type: "transfer-dispatch",
                productId: item.productId,
                warehouseId: transfer.toWarehouseId,
                batchId: item.batchId,
                quantity: item.quantity,
                refType: "transfer",
                refNumber: transfer.number,
                createdBy: "Salma H.",
              });
              return { ...l, inTransit: l.inTransit + item.quantity };
            }
          }
          return l;
        });
        set((s) => ({
          stockLevels,
          movements: [...movements, ...s.movements],
          transfers: s.transfers.map((t) =>
            t.id === id
              ? {
                  ...t,
                  status: "dispatched",
                  dispatchedAt: new Date().toISOString(),
                  items: t.items.map((item) =>
                    item.batchId
                      ? item
                      : { ...item, batchId: suggestedBatchId(state.batches, item.productId, transfer.fromWarehouseId) }
                  ),
                }
              : t
          ),
        }));
      },

      receiveTransfer: (id) => {
        const state = get();
        const transfer = state.transfers.find((t) => t.id === id);
        if (!transfer || transfer.status !== "dispatched") return;
        const movements: StockMovement[] = [];
        const stockLevels = state.stockLevels.map((l) => {
          for (const item of transfer.items) {
            if (l.productId === item.productId && l.warehouseId === transfer.toWarehouseId) {
              movements.push({
                id: newId("mv"),
                at: new Date().toISOString(),
                type: "transfer-in",
                productId: item.productId,
                warehouseId: transfer.toWarehouseId,
                batchId: item.batchId,
                quantity: item.quantity,
                refType: "transfer",
                refNumber: transfer.number,
                createdBy: "Salma H.",
              });
              return { ...l, inTransit: l.inTransit - item.quantity, quantity: l.quantity + item.quantity };
            }
          }
          return l;
        });
        set((s) => ({
          stockLevels,
          movements: [...movements, ...s.movements],
          transfers: s.transfers.map((t) => (t.id === id ? { ...t, status: "received", receivedAt: new Date().toISOString(), receivedBy: "Salma H." } : t)),
          batches: moveBatches(state.batches, transfer),
        }));
      },

      cancelTransfer: (id) => {
        const state = get();
        const transfer = state.transfers.find((t) => t.id === id);
        if (!transfer || transfer.status === "received" || transfer.status === "cancelled" || transfer.status === "rejected") return;
        const wasDispatched = transfer.status === "dispatched";
        set((s) => ({
          transfers: s.transfers.map((t) => (t.id === id ? { ...t, status: "cancelled" } : t)),
          stockLevels: wasDispatched
            ? s.stockLevels.map((l) => {
                for (const item of transfer.items) {
                  if (l.productId === item.productId && l.warehouseId === transfer.fromWarehouseId) {
                    return { ...l, quantity: l.quantity + item.quantity };
                  }
                  if (l.productId === item.productId && l.warehouseId === transfer.toWarehouseId) {
                    return { ...l, inTransit: l.inTransit - item.quantity };
                  }
                }
                return l;
              })
            : s.stockLevels,
        }));
      },

      addBatch: (productId, warehouseId, batchNumber, quantity, expiryDate) => {
        const batch: Batch = {
          id: newId("b"),
          productId,
          warehouseId,
          batchNumber: batchNumber.trim(),
          manufactureDate: null,
          expiryDate,
          quantity,
          quarantineQuantity: 0,
          receiptRef: "MANUAL",
          createdAt: new Date().toISOString(),
        };
        set((s) => ({ batches: [batch, ...s.batches] }));
        return batch;
      },
    }),
    {
      name: "mrm-inventory-v1",
      version: 1,
      merge: (_persisted, current) => {
        const stored = _persisted as Partial<InventoryStore>;
        return {
          ...current,
          ...stored,
          products: (stored.products ?? []).map((p) => ({
            ...p,
            reorderQuantities: p.reorderQuantities ?? {},
            images: p.images ?? [],
          })),
          stockLevels: (stored.stockLevels ?? []).map((l) => ({
            ...l,
            inTransit: l.inTransit ?? 0,
            damaged: l.damaged ?? 0,
            averageCost: l.averageCost ?? 0,
          })),
          warehouses: (stored.warehouses ?? []).map((w) => ({
            ...w,
            isPOSLinked: w.isPOSLinked ?? false,
          })),
        };
      },
    }
  )
);

/** Move batch quantity to the destination warehouse on receipt, keeping the
 * batch number/expiry. Creates a destination batch when none exists yet. */
function moveBatches(batches: Batch[], transfer: Transfer): Batch[] {
  let next = batches;
  for (const item of transfer.items) {
    const sourceBatchId = suggestedBatchId(batches, item.productId, transfer.fromWarehouseId);
    if (!sourceBatchId) continue;
    const source = batches.find((b) => b.id === sourceBatchId);
    if (!source) continue;
    const take = Math.min(item.quantity, Math.max(0, source.quantity - source.quarantineQuantity));
    if (take <= 0) continue;

    next = next.map((b) => (b.id === sourceBatchId ? { ...b, quantity: b.quantity - take } : b));
    const dest = next.find(
      (b) =>
        b.warehouseId === transfer.toWarehouseId &&
        b.productId === item.productId &&
        b.batchNumber === source.batchNumber &&
        b.expiryDate === source.expiryDate
    );
    if (dest) {
      next = next.map((b) => (b.id === dest.id ? { ...b, quantity: b.quantity + take } : b));
    } else {
      next = [
        ...next,
        {
          id: newId("b"),
          productId: item.productId,
          warehouseId: transfer.toWarehouseId,
          batchNumber: source.batchNumber,
          manufactureDate: source.manufactureDate,
          expiryDate: source.expiryDate,
          quantity: take,
          quarantineQuantity: 0,
          receiptRef: transfer.number,
          createdAt: new Date().toISOString(),
        },
      ];
    }
  }
  return next;
}