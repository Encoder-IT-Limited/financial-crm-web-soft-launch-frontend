import { apiGet, apiSend } from "@/lib/api/envelope";
import { inventoryApi } from "@/app/(tenant)/modules/inventory/api/inventory.service";
import type {
  NewPosSaleInput,
  NewRefundInput,
  PosRefund,
  PosSale,
} from "../types";
import {
  mapReturns,
  mapSale,
  toApiCreateSale,
  toApiRefund,
  type ApiPosSale,
} from "./mappers";
import { posSessionsApi } from "./sessions.service";

async function productMetaMap() {
  const products = await inventoryApi.listProducts();
  return new Map(
    products.map((p) => [
      p.id,
      { name: p.name, sku: p.sku, taxRate: p.taxRate ?? 5 },
    ]),
  );
}

async function hydrateSale(row: ApiPosSale): Promise<PosSale> {
  const meta = await productMetaMap();
  let terminalId = "";
  let createdBy = "Cashier";
  if (row.posSessionId) {
    try {
      const sessions = await posSessionsApi.list();
      const session = sessions.find((s) => s.id === row.posSessionId);
      if (session) {
        terminalId = session.terminalId;
        createdBy = session.openedBy;
      }
    } catch {
      // list may fail on permission — leave defaults
    }
  }
  // Prefer payments from getSale; list may omit them
  let full = row;
  if (!row.payments) {
    full = await apiGet<ApiPosSale>(`/pos/sales/${row.id}`);
  }
  return mapSale(full, { terminalId, productMeta: meta, createdBy });
}

export const posSalesApi = {
  list: async (): Promise<PosSale[]> => {
    const rows = await apiGet<ApiPosSale[]>("/pos/sales");
    const meta = await productMetaMap();
    const sessions = await posSessionsApi.list().catch(() => []);
    const sessionById = new Map(sessions.map((s) => [s.id, s]));
    return rows.map((row) => {
      const session = row.posSessionId
        ? sessionById.get(row.posSessionId)
        : undefined;
      return mapSale(row, {
        terminalId: session?.terminalId,
        productMeta: meta,
        createdBy: session?.openedBy,
      });
    });
  },

  get: async (id: string): Promise<PosSale | undefined> => {
    try {
      const row = await apiGet<ApiPosSale>(`/pos/sales/${id}`);
      return hydrateSale(row);
    } catch {
      return undefined;
    }
  },

  listRefunds: async (saleId?: string): Promise<PosRefund[]> => {
    if (saleId) {
      const row = await apiGet<ApiPosSale>(`/pos/sales/${saleId}`);
      return mapReturns(saleId, row.returns);
    }
    const sales = await apiGet<ApiPosSale[]>("/pos/sales");
    const all: PosRefund[] = [];
    for (const sale of sales) {
      if (sale.returns?.length) {
        all.push(...mapReturns(sale.id, sale.returns));
      } else {
        const full = await apiGet<ApiPosSale>(`/pos/sales/${sale.id}`);
        all.push(...mapReturns(sale.id, full.returns));
      }
    }
    return all;
  },

  getNextNumber: async (): Promise<string> => {
    const row = await apiGet<{ number: string }>("/pos/sales/next-number");
    return row.number;
  },

  create: async (
    input: NewPosSaleInput & { managerPin?: string },
  ): Promise<PosSale> => {
    const payload = toApiCreateSale(input, input.managerPin);
    const row = await apiSend<ApiPosSale>("post", "/pos/sales", payload);
    return hydrateSale(row);
  },

  refund: async (
    input: NewRefundInput & { managerPin: string },
  ): Promise<PosRefund> => {
    const sale = await posSalesApi.get(input.saleId);
    if (!sale) throw new Error("Sale not found");
    const body = toApiRefund(input, sale, input.managerPin);
    const result = await apiSend<{
      sale: ApiPosSale;
      saleReturn?: ApiSaleReturnLike;
    }>("post", `/pos/sales/${input.saleId}/refund`, body);
    const returns = mapReturns(input.saleId, result.sale.returns);
    if (returns[0]) return returns[0];
    // Fallback if returns not included on nested sale
    const refreshed = await apiGet<ApiPosSale>(`/pos/sales/${input.saleId}`);
    return mapReturns(input.saleId, refreshed.returns)[0]!;
  },
};

type ApiSaleReturnLike = {
  id: string;
  refundAmount: number | string;
  reason?: string | null;
  approvedBy?: string | null;
  createdAt: string;
  items: {
    productId: string;
    quantity: number | string;
    unitPrice: number | string;
    condition: string;
  }[];
};
