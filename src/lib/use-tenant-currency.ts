"use client";

import { useMe } from "@/hooks/useMe";
import { asCurrency, type Currency } from "@/app/(tenant)/modules/crm/types";

/** Tenant base currency from `/me` — used as the default on new documents. */
export function useTenantCurrency(fallback: Currency = "AED"): Currency {
  const { data: me } = useMe();
  return asCurrency(me?.tenant?.currency, fallback);
}
