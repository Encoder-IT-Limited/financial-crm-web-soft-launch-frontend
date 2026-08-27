"use client";

import { fmtMoney } from "@/lib/format";
import { useTenantCurrency } from "@/lib/use-tenant-currency";

/** Formats money in the tenant base currency (not the AED demo default). */
export function useFmtMoney() {
  const currency = useTenantCurrency();
  return (value: number) => fmtMoney(value, currency);
}
