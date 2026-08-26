import { apiGet, apiGetPage, apiSend } from "@/lib/api/envelope";
import type { Adjustment, AdjustmentKind, Invoice, NewAdjustmentInput } from "../types";
import { asCurrency } from "../../crm/types";
import { invoiceApi } from "./invoices.service";

/** Credit notes + debit notes — live `/credit-notes` and `/debit-notes`. */

type ApiCreditNote = {
  id: string;
  customerId: string;
  invoiceId: string | null;
  creditNoteNumber: string;
  amount: number | string;
  reason: string;
  status: string;
  currency?: string | null;
  linkedReturn?: boolean;
  refundAmount?: number | string | null;
  createdAt: string;
};

type ApiDebitNote = {
  id: string;
  customerId: string;
  invoiceId: string | null;
  debitNoteNumber: string;
  amount: number | string;
  reason: string;
  status: string;
  currency?: string | null;
  createdAt: string;
};

function mapCreditNote(row: ApiCreditNote): Adjustment {
  return {
    id: row.id,
    number: row.creditNoteNumber,
    kind: "credit",
    customerId: row.customerId,
    invoiceId: row.invoiceId ?? undefined,
    amount: Number(row.amount),
    reason: row.reason,
    currency: asCurrency(row.currency),
    status: row.status === "VOID" ? "void" : "issued",
    createdBy: "System",
    createdAt: row.createdAt,
    linkedReturn: row.linkedReturn,
    refundAmount: row.refundAmount != null ? Number(row.refundAmount) : undefined,
  };
}

function mapDebitNote(row: ApiDebitNote): Adjustment {
  return {
    id: row.id,
    number: row.debitNoteNumber,
    kind: "debit",
    customerId: row.customerId,
    invoiceId: row.invoiceId ?? undefined,
    amount: Number(row.amount),
    reason: row.reason,
    currency: asCurrency(row.currency),
    status: row.status === "VOID" ? "void" : "issued",
    createdBy: "System",
    createdAt: row.createdAt,
  };
}

export const adjustmentsApi = {
  list: async (): Promise<Adjustment[]> => {
    const [credits, debits] = await Promise.all([
      apiGetPage<ApiCreditNote>("/credit-notes"),
      apiGetPage<ApiDebitNote>("/debit-notes"),
    ]);
    return [...credits.items.map(mapCreditNote), ...debits.items.map(mapDebitNote)].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  },

  get: async (id: string): Promise<Adjustment | undefined> => {
    const all = await adjustmentsApi.list();
    return all.find((a) => a.id === id);
  },

  getNextNumber: async (kind: AdjustmentKind): Promise<string> => {
    const path = kind === "credit" ? "/credit-notes/next-number" : "/debit-notes/next-number";
    const row = await apiGet<{ number: string }>(path);
    return row.number;
  },

  create: async (input: NewAdjustmentInput): Promise<Adjustment> => {
    if (input.kind === "credit") {
      const row = await apiSend<ApiCreditNote>("post", "/credit-notes", {
        customerId: input.customerId,
        invoiceId: input.invoiceId,
        amount: input.amount,
        reason: input.reason,
        currency: input.currency,
        linkedReturn: input.linkedReturn ?? false,
        warehouseId: input.warehouseId,
        returnItems: input.returnItems,
      });
      return mapCreditNote(row);
    }

    const row = await apiSend<ApiDebitNote>("post", "/debit-notes", {
      customerId: input.customerId,
      invoiceId: input.invoiceId,
      amount: input.amount,
      reason: input.reason,
      currency: input.currency,
    });
    return mapDebitNote(row);
  },

  void: async (id: string, kind: AdjustmentKind): Promise<void> => {
    const path = kind === "credit" ? `/credit-notes/${id}/void` : `/debit-notes/${id}/void`;
    await apiSend("post", path);
  },

  convertToInvoice: async (id: string, kind: AdjustmentKind): Promise<Invoice | null> => {
    const path = kind === "credit" ? `/credit-notes/${id}/convert` : `/debit-notes/${id}/convert`;
    try {
      const row = await apiSend<{ id: string }>("post", path);
      return (await invoiceApi.get(row.id)) ?? null;
    } catch {
      return null;
    }
  },
};
