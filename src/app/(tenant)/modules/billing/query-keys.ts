export const billingKeys = {
  all: ["billing"] as const,
  invoices: () => [...billingKeys.all, "invoices"] as const,
  invoicesPage: (params: Record<string, unknown>) => [...billingKeys.invoices(), "page", params] as const,
  invoiceStats: () => [...billingKeys.invoices(), "stats"] as const,
  invoice: (id: string) => [...billingKeys.invoices(), id] as const,
  nextNumber: () => [...billingKeys.all, "invoice-next-number"] as const,
  recurring: () => [...billingKeys.all, "recurring"] as const,
  recurringPage: (page: number, pageSize: number) => [...billingKeys.recurring(), "page", page, pageSize] as const,
  adjustments: () => [...billingKeys.all, "adjustments"] as const,
  /** Alias — same cache as adjustments() */
  creditNotes: () => [...billingKeys.adjustments()] as const,
  proposals: () => [...billingKeys.all, "proposals"] as const,
  proposal: (id: string) => [...billingKeys.proposals(), id] as const,
  proposalNextNumber: () => [...billingKeys.all, "proposal-next-number"] as const,
  retainers: () => [...billingKeys.all, "retainers"] as const,
  retainer: (id: string) => [...billingKeys.retainers(), id] as const,
  fulfillments: (invoiceId?: string) =>
    [...billingKeys.all, "fulfillments", invoiceId ?? "all"] as const,
  pendingReconciliation: () => [...billingKeys.all, "fulfillments", "pending-reconciliation"] as const,
};
