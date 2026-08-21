"use client";

import type { AdjustmentType, Batch, Product, Transfer, Warehouse } from "../types";
import {
  type NewProductInput,
  type TransferDraft,
  type WarehouseInit,
  useInventoryStore,
} from "../store/inventory-store";

/** Simulated network latency for the mock API. */
const delay = (ms = 350) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Mock API service layer for the inventory module. Every function returns a
 * Promise so the UI consumes it exactly like the real REST API — swap the
 * bodies for real calls later without touching any component.
 */
export const inventoryApi = {
  listProducts: async (): Promise<Product[]> => {
    await delay(250);
    return useInventoryStore.getState().products;
  },

  getProduct: async (id: string): Promise<Product | undefined> => {
    await delay(200);
    return useInventoryStore.getState().products.find((p) => p.id === id);
  },

  listWarehouses: async (): Promise<Warehouse[]> => {
    await delay(200);
    return useInventoryStore.getState().warehouses;
  },

  createProduct: async (input: NewProductInput, inits: WarehouseInit[]): Promise<Product> => {
    await delay();
    return useInventoryStore.getState().addProduct(input, inits);
  },

  updateProduct: async (id: string, input: NewProductInput): Promise<void> => {
    await delay();
    useInventoryStore.getState().updateProduct(id, input);
  },

  setReorderLevels: async (productId: string, warehouseId: string, reorderLevel: number, reorderQuantity: number): Promise<void> => {
    await delay(150);
    useInventoryStore.getState().setReorderLevels(productId, warehouseId, reorderLevel, reorderQuantity);
  },

  adjustStock: async (
    productId: string,
    warehouseId: string,
    type: AdjustmentType,
    quantity: number,
    reasonCode: string,
    notes?: string
  ): Promise<void> => {
    await delay();
    useInventoryStore.getState().adjustStock(productId, warehouseId, type, quantity, reasonCode, notes);
  },

  createTransfer: async (draft: TransferDraft): Promise<Transfer | null> => {
    await delay();
    return useInventoryStore.getState().createTransfer(draft);
  },

  dispatchTransfer: async (id: string): Promise<void> => {
    await delay();
    useInventoryStore.getState().dispatchTransfer(id);
  },

  receiveTransfer: async (id: string): Promise<void> => {
    await delay();
    useInventoryStore.getState().receiveTransfer(id);
  },

  cancelTransfer: async (id: string): Promise<void> => {
    await delay();
    useInventoryStore.getState().cancelTransfer(id);
  },

  addBatch: async (
    productId: string,
    warehouseId: string,
    batchNumber: string,
    quantity: number,
    expiryDate: string | null
  ): Promise<Batch> => {
    await delay();
    return useInventoryStore.getState().addBatch(productId, warehouseId, batchNumber, quantity, expiryDate);
  },
};