"use client";

import { useQuery } from "@tanstack/react-query";
import { customersApi } from "../api/customers.service";
import { crmKeys } from "../query-keys";

export function useCustomers() {
  return useQuery({ queryKey: crmKeys.customers(), queryFn: customersApi.list });
}

export function useCustomer(id: string) {
  return useQuery({
    queryKey: crmKeys.customer(id),
    queryFn: () => customersApi.get(id),
    enabled: Boolean(id),
  });
}

export function useCustomerStatement(id: string) {
  return useQuery({
    queryKey: crmKeys.customerStatement(id),
    queryFn: () => customersApi.statement(id),
    enabled: Boolean(id),
  });
}
