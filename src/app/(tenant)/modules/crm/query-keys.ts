export const crmKeys = {
  all: ["crm"] as const,
  customers: () => [...crmKeys.all, "customers"] as const,
  customer: (id: string) => [...crmKeys.customers(), id] as const,
};
