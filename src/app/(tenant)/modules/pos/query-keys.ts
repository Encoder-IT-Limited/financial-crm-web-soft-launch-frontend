export const posKeys = {
  all: ["pos"] as const,
  terminals: () => [...posKeys.all, "terminals"] as const,
  sessions: () => [...posKeys.all, "sessions"] as const,
  sales: () => [...posKeys.all, "sales"] as const,
  sale: (id: string) => [...posKeys.sales(), id] as const,
};
