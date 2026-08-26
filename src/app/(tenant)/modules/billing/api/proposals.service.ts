import { apiGet, apiGetPage, apiSend } from "@/lib/api/envelope";
import type { Invoice, NewProposalInput, Proposal, ProposalStatus } from "../types";
import { round2 } from "../types";
import { asCurrency } from "../../crm/types";
import { invoiceApi } from "./invoices.service";

/** Live proposals API — `/proposals`. */

type ApiProposalItem = {
  id: string;
  productId?: string | null;
  description: string;
  quantity: number | string;
  unitPrice: number | string;
  discount: number | string;
  tax: number | string;
  total: number | string;
};

type ApiProposal = {
  id: string;
  customerId: string;
  proposalNumber: string;
  proposalDate: string;
  expiryDate: string;
  subtotal: number | string;
  discount: number | string;
  tax: number | string;
  total: number | string;
  notes: string | null;
  status: string;
  sentAt: string | null;
  respondedAt: string | null;
  convertedInvoiceId: string | null;
  currency?: string | null;
  createdAt: string;
  items?: ApiProposalItem[];
};

const STATUS_MAP: Record<string, ProposalStatus> = {
  DRAFT: "draft",
  SENT: "sent",
  ACCEPTED: "accepted",
  REJECTED: "rejected",
};

function mapLines(items: ApiProposalItem[] | undefined) {
  if (!items?.length) return [];
  return items.map((item) => {
    const quantity = Number(item.quantity);
    const unitPrice = Number(item.unitPrice);
    const taxAmount = Number(item.tax);
    const lineSub = quantity * unitPrice;
    const taxRate = lineSub > 0 ? round2((taxAmount / lineSub) * 100) : 0;
    return {
      id: item.id,
      description: item.description,
      quantity,
      unitPrice,
      taxRate,
      total: Number(item.total),
      productId: item.productId ?? undefined,
    };
  });
}

function mapProposal(row: ApiProposal): Proposal {
  const status = STATUS_MAP[row.status] ?? "draft";
  const subtotal = Number(row.subtotal);
  const discount = Number(row.discount);
  const discountPercent = subtotal > 0 && discount > 0 ? round2((discount / subtotal) * 100) : undefined;
  return {
    id: row.id,
    number: row.proposalNumber,
    customerId: row.customerId,
    date: String(row.proposalDate).slice(0, 10),
    expiryDate: String(row.expiryDate).slice(0, 10),
    currency: asCurrency(row.currency),
    lines: mapLines(row.items),
    subtotal,
    discountPercent,
    discount: discount,
    tax: Number(row.tax),
    total: Number(row.total),
    status,
    notes: row.notes ?? undefined,
    createdBy: "—",
    createdAt: row.createdAt,
    sentAt: row.sentAt ? String(row.sentAt) : undefined,
    respondedAt: row.respondedAt ? String(row.respondedAt) : undefined,
    convertedInvoiceId: row.convertedInvoiceId ?? undefined,
  };
}

function toApiItems(input: NewProposalInput) {
  return input.lines.map((line) => {
    const lineSub = line.quantity * line.unitPrice;
    const tax = round2(lineSub * (line.taxRate / 100));
    return {
      description: line.description,
      quantity: line.quantity,
      unitPrice: line.unitPrice,
      discount: 0,
      tax,
      productId: line.productId,
    };
  });
}

function toApiBody(input: NewProposalInput) {
  return {
    customerId: input.customerId,
    proposalDate: input.date,
    expiryDate: input.expiryDate,
    notes: input.notes,
    currency: input.currency,
    items: toApiItems(input),
  };
}

export const proposalsApi = {
  list: async (): Promise<Proposal[]> => {
    const page = await apiGetPage<ApiProposal>("/proposals");
    return page.items.map(mapProposal);
  },

  get: async (id: string): Promise<Proposal | undefined> => {
    try {
      return mapProposal(await apiGet<ApiProposal>(`/proposals/${id}`));
    } catch {
      return undefined;
    }
  },

  getNextNumber: async (): Promise<string> => {
    const row = await apiGet<{ number: string }>("/proposals/next-number");
    return row.number;
  },

  create: async (input: NewProposalInput, mode: "draft" | "send"): Promise<Proposal> => {
    const url = mode === "send" ? "/proposals?mode=send" : "/proposals";
    return mapProposal(await apiSend<ApiProposal>("post", url, toApiBody(input)));
  },

  update: async (id: string, input: NewProposalInput): Promise<void> => {
    await apiSend("patch", `/proposals/${id}`, toApiBody(input));
  },

  send: async (id: string): Promise<void> => {
    await apiSend("post", `/proposals/${id}/send`);
  },

  reject: async (id: string): Promise<void> => {
    await apiSend("post", `/proposals/${id}/reject`);
  },

  convertToInvoice: async (id: string): Promise<Invoice | null> => {
    const result = await apiSend<{ proposal: ApiProposal; invoice: { id: string } }>(
      "post",
      `/proposals/${id}/convert`,
    );
    if (!result.invoice?.id) return null;
    return (await invoiceApi.get(result.invoice.id)) ?? null;
  },
};
