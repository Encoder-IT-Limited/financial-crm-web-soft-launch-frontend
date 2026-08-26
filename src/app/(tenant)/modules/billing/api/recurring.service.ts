import { apiGet, apiGetPage, apiSend } from "@/lib/api/envelope";
import type { Invoice } from "../types";
import { asCurrency } from "../../crm/types";
import {
  type NewRecurringTemplateInput,
  type RecurrenceFrequency,
  type RecurringTemplate,
  type RecurringTemplateKind,
  type RecurringTemplateStatus,
} from "../recurring/types";
import { invoiceApi } from "./invoices.service";

/** Live `/recurring-templates` list/create/update/delete/generate/pause. */

type ApiTemplate = {
  id: string;
  customerId: string;
  frequency: string;
  startDate: string;
  nextInvoiceDate: string;
  endDate: string | null;
  amount: number | string;
  description: string;
  autoSend: boolean;
  status: string;
  kind?: string;
  retainerId?: string | null;
  currency?: string | null;
  createdAt: string;
};

const FREQ_TO_API: Record<RecurrenceFrequency, "WEEKLY" | "MONTHLY" | "YEARLY"> = {
  weekly: "WEEKLY",
  monthly: "MONTHLY",
  quarterly: "MONTHLY",
  yearly: "YEARLY",
};

const FREQ_FROM_API: Record<string, RecurrenceFrequency> = {
  WEEKLY: "weekly",
  MONTHLY: "monthly",
  YEARLY: "yearly",
};

const KIND_FROM_API: Record<string, RecurringTemplateKind> = {
  INVOICE: "invoice",
  RETAINER_TOPUP: "retainer-topup",
};

function mapKind(value: string | undefined): RecurringTemplateKind {
  if (!value) return "invoice";
  return KIND_FROM_API[value] ?? "invoice";
}

function mapTemplate(row: ApiTemplate): RecurringTemplate {
  return {
    id: row.id,
    number: `REC-${row.id.slice(0, 6).toUpperCase()}`,
    customerId: row.customerId,
    description: row.description,
    currency: asCurrency(row.currency),
    amount: Number(row.amount),
    frequency: FREQ_FROM_API[row.frequency] ?? "monthly",
    nextInvoiceDate: String(row.nextInvoiceDate).slice(0, 10),
    status: row.status === "PAUSED" || row.status === "ENDED" ? "paused" : "active",
    kind: mapKind(row.kind),
    retainerId: row.retainerId ?? undefined,
    autoSend: row.autoSend,
    createdAt: row.createdAt,
  };
}

function toApiBody(input: NewRecurringTemplateInput) {
  const kind = input.kind === "retainer-topup" ? "RETAINER_TOPUP" : "INVOICE";
  return {
    customerId: input.customerId,
    frequency: FREQ_TO_API[input.frequency],
    startDate: input.nextInvoiceDate,
    nextInvoiceDate: input.nextInvoiceDate,
    amount: input.amount,
    description: input.description,
    autoSend: input.autoSend ?? false,
    currency: input.currency,
    kind,
    retainerId: input.kind === "retainer-topup" ? input.retainerId : undefined,
  };
}

export const recurringApi = {
  list: async (): Promise<RecurringTemplate[]> => {
    const page = await apiGetPage<ApiTemplate>("/recurring-templates");
    return page.items.map(mapTemplate);
  },

  create: async (input: NewRecurringTemplateInput): Promise<RecurringTemplate> => {
    const row = await apiSend<ApiTemplate>("post", "/recurring-templates", toApiBody(input));
    return mapTemplate(row);
  },

  update: async (id: string, input: NewRecurringTemplateInput): Promise<void> => {
    await apiSend("patch", `/recurring-templates/${id}`, toApiBody(input));
  },

  setStatus: async (id: string, status: RecurringTemplateStatus): Promise<void> => {
    await apiSend("patch", `/recurring-templates/${id}/status`, {
      status: status === "paused" ? "PAUSED" : "ACTIVE",
    });
  },

  remove: async (id: string): Promise<void> => {
    await apiSend("delete", `/recurring-templates/${id}`);
  },

  generate: async (id: string): Promise<Invoice | null> => {
    const created = await apiSend<{ id: string }>("post", `/recurring-templates/${id}/generate`);
    if (!created?.id) return null;
    return (await invoiceApi.get(created.id)) ?? null;
  },
};
