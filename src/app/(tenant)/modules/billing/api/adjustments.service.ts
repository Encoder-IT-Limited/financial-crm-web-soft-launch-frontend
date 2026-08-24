import { apiGet, apiSend } from "@/lib/api/envelope";
import type { Adjustment, AdjustmentKind, Invoice, NewAdjustmentInput } from "../types";
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
    currency: "AED",
    status: row.status === "VOID" ? "void" : "issued",
    createdBy: "System",
    createdAt: row.createdAt,
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
    currency: "AED",
    status: row.status === "VOID" ? "void" : "issued",
    createdBy: "System",
    createdAt: row.createdAt,
  };
}

export const adjustmentsApi = {
  list: async (): Promise<Adjustment[]> => {
    const [credits, debits] = await Promise.all([
      apiGet<ApiCreditNote[]>("/credit-notes"),
      apiGet<ApiDebitNote[]>("/debit-notes"),
    ]);
    return [...credits.map(mapCreditNote), ...debits.map(mapDebitNote)].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  },

  get: async (id: string): Promise<Adjustment | undefined> => {
    const all = await adjustmentsApi.list();
    return all.find((a) => a.id === id);
  },

  getNextNumber: async (kind: AdjustmentKind): Promise<string> => {
    if (kind === "credit") {
      const credits = await apiGet<ApiCreditNote[]>("/credit-notes");
      return `CN-${String(credits.length + 1).padStart(4, "0")}`;
    }
    const debits = await apiGet<ApiDebitNote[]>("/debit-notes");
    return `DN-${String(debits.length + 1).padStart(4, "0")}`;
  },

  create: async (input: NewAdjustmentInput): Promise<Adjustment> => {
    if (input.kind === "credit") {
      const row = await apiSend<ApiCreditNote>("post", "/credit-notes", {
        customerId: input.customerId,
        invoiceId: input.invoiceId,
        amount: input.amount,
        reason: input.reason,
        linkedReturn: false,
      });
      return mapCreditNote(row);
    }

    const row = await apiSend<ApiDebitNote>("post", "/debit-notes", {
      customerId: input.customerId,
      invoiceId: input.invoiceId,
      amount: input.amount,
      reason: input.reason,
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
