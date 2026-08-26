import { apiGet, apiSend } from "@/lib/api/envelope";
import { ApiError } from "@/lib/api/errors";
import type { NewRetainerInput, Retainer, RetainerBillingPeriod, RetainerDispositionReason, RetainerStatus } from "../types";
import { invoiceApi } from "./invoices.service";

/** Live retainers API — `/retainers`. */

type ApiRetainerUsage = {
  id: string;
  date: string;
  amount: number | string;
  note: string | null;
};

type ApiRetainer = {
  id: string;
  customerId: string;
  retainerNumber: string;
  contractAmount: number | string;
  remainingBalance: number | string;
  billingPeriod: string;
  billingModel: string;
  currency: string;
  status: string;
  startDate: string;
  expiryDate: string | null;
  notes: string | null;
  fundingInvoiceId: string | null;
  dispositionReason: string | null;
  transferredToRetainerId: string | null;
  rolledOverFromRetainerId: string | null;
  rolledOverToRetainerId: string | null;
  createdAt: string;
  usage?: ApiRetainerUsage[];
};

const STATUS_MAP: Record<string, RetainerStatus> = {
  ACTIVE: "active",
  PAUSED: "paused",
  CLOSED: "closed",
};

const BILLING_MODEL_FROM_API: Record<string, "one-time" | "recurring"> = {
  ONE_TIME: "one-time",
  RECURRING: "recurring",
};

const DISPOSITION_MAP: Record<string, RetainerDispositionReason> = {
  TRANSFER: "transferred",
  FORFEIT: "forfeited",
  REFUND: "refunded",
  ROLL_OVER: "rolled-over",
};

function normalizeBillingPeriod(value: string): RetainerBillingPeriod {
  const lower = value.toLowerCase();
  if (lower === "monthly" || lower === "quarterly" || lower === "yearly") return lower;
  return "monthly";
}

function mapUsage(rows: ApiRetainerUsage[] | undefined) {
  if (!rows?.length) return [];
  return rows.map((u) => ({
    id: u.id,
    date: String(u.date).slice(0, 10),
    amount: Number(u.amount),
    note: u.note ?? undefined,
  }));
}

function mapRetainer(row: ApiRetainer): Retainer {
  const status = STATUS_MAP[row.status] ?? "active";
  return {
    id: row.id,
    number: row.retainerNumber,
    customerId: row.customerId,
    contractAmount: Number(row.contractAmount),
    billingPeriod: normalizeBillingPeriod(row.billingPeriod),
    billingModel: BILLING_MODEL_FROM_API[row.billingModel] ?? "one-time",
    remainingBalance: Number(row.remainingBalance),
    currency: row.currency as Retainer["currency"],
    status,
    startDate: String(row.startDate).slice(0, 10),
    expiryDate: row.expiryDate ? String(row.expiryDate).slice(0, 10) : undefined,
    notes: row.notes ?? undefined,
    createdBy: "—",
    createdAt: row.createdAt,
    usage: mapUsage(row.usage),
    fundingInvoiceId: row.fundingInvoiceId ?? undefined,
    dispositionReason: row.dispositionReason ? DISPOSITION_MAP[row.dispositionReason] : undefined,
    transferredToRetainerId: row.transferredToRetainerId ?? undefined,
    rolledOverFromRetainerId: row.rolledOverFromRetainerId ?? undefined,
    rolledOverToRetainerId: row.rolledOverToRetainerId ?? undefined,
  };
}

function toCreateBody(input: NewRetainerInput, fundingInvoiceId?: string) {
  return {
    customerId: input.customerId,
    contractAmount: input.contractAmount,
    billingPeriod: input.billingPeriod,
    billingModel: input.billingModel === "recurring" ? "RECURRING" : "ONE_TIME",
    currency: input.currency ?? "AED",
    startDate: input.startDate,
    expiryDate: input.expiryDate || undefined,
    notes: input.notes,
    fundingInvoiceId,
  };
}

function toUpdateBody(input: NewRetainerInput) {
  return {
    billingPeriod: input.billingPeriod,
    billingModel: input.billingModel === "recurring" ? "RECURRING" : "ONE_TIME",
    currency: input.currency ?? "AED",
    startDate: input.startDate,
    expiryDate: input.expiryDate || null,
    notes: input.notes ?? null,
  };
}

export const retainersApi = {
  list: async (): Promise<Retainer[]> => (await apiGet<ApiRetainer[]>("/retainers")).map(mapRetainer),

  get: async (id: string): Promise<Retainer | undefined> => {
    try {
      return mapRetainer(await apiGet<ApiRetainer>(`/retainers/${id}`));
    } catch {
      return undefined;
    }
  },

  create: async (input: NewRetainerInput): Promise<Retainer> => {
    const today = new Date().toISOString().slice(0, 10);
    const fundingInvoice = await invoiceApi.create(
      {
        customerId: input.customerId,
        issueDate: today,
        dueDate: today,
        currency: input.currency ?? "AED",
        lines: [
          {
            description: `Retainer contract — ${input.billingPeriod} retainer funding`,
            quantity: 1,
            unitPrice: input.contractAmount,
            taxRate: 0,
          },
        ],
        notes: "Upfront funding for retainer contract",
      },
      "send",
      "retainer",
    );
    await invoiceApi.recordPayment(fundingInvoice.id, {
      date: today,
      amount: input.contractAmount,
      method: "bank-transfer",
      reference: fundingInvoice.number,
    });

    const row = await apiSend<ApiRetainer>("post", "/retainers", toCreateBody(input, fundingInvoice.id));
    return mapRetainer(row);
  },

  update: async (id: string, input: NewRetainerInput): Promise<void> => {
    await apiSend("patch", `/retainers/${id}`, toUpdateBody(input));
  },

  drawForInvoice: async (
    retainerId: string,
    invoice: { id: string; number: string; total: number; issueDate: string },
  ): Promise<boolean> => {
    try {
      await apiSend("post", `/retainers/${retainerId}/draw`, { invoiceId: invoice.id });
      return true;
    } catch (err) {
      if (err instanceof ApiError) return false;
      throw err;
    }
  },

  topUp: async (id: string, amount: number, note?: string): Promise<void> => {
    await apiSend("post", `/retainers/${id}/top-up`, { amount, note, increaseContractAmount: true });
  },

  setStatus: async (id: string, status: RetainerStatus): Promise<void> => {
    const apiStatus = status === "active" ? "ACTIVE" : status === "paused" ? "PAUSED" : "CLOSED";
    await apiSend("post", `/retainers/${id}/status`, { status: apiStatus });
  },

  transfer: async (fromId: string, toId: string): Promise<boolean> => {
    try {
      await apiSend("post", `/retainers/${fromId}/transfer`, { toRetainerId: toId });
      return true;
    } catch (err) {
      if (err instanceof ApiError) return false;
      throw err;
    }
  },

  rollOver: async (id: string, newExpiryDate?: string): Promise<Retainer | null> => {
    try {
      const result = await apiSend<{ source: ApiRetainer; retainer: ApiRetainer }>("post", `/retainers/${id}/roll-over`, {
        expiryDate: newExpiryDate || undefined,
      });
      return mapRetainer(result.retainer);
    } catch {
      return null;
    }
  },

  forfeit: async (id: string): Promise<void> => {
    await apiSend("post", `/retainers/${id}/forfeit`);
  },

  requestRefund: async (id: string, reason: string): Promise<boolean> => {
    try {
      await apiSend("post", `/retainers/${id}/refund`, { reason });
      return true;
    } catch (err) {
      if (err instanceof ApiError) return false;
      throw err;
    }
  },
};
