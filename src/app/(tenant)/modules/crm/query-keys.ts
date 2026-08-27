export const crmKeys = {
  all: ["crm"] as const,
  customers: () => [...crmKeys.all, "customers"] as const,
  customer: (id: string) => [...crmKeys.customers(), id] as const,
  customerStatement: (id: string) => [...crmKeys.customer(id), "statement"] as const,
};
