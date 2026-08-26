"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { posApi } from "../api/pos.service";
import type { RefundSaleItem, SaleItemInput, SalePaymentInput } from "../api/pos.service";
import { posKeys } from "../query-keys";
import { inventoryKeys } from "@/app/(tenant)/modules/inventory/query-keys";

export function usePosTerminals() {
  return useQuery({ queryKey: posKeys.terminals(), queryFn: posApi.listTerminals });
}

export function usePosSessions(status?: "OPEN" | "CLOSED") {
  return useQuery({
    queryKey: [...posKeys.sessions(), status ?? "all"],
    queryFn: () => posApi.listSessions(status),
  });
}

export function usePosSales(posSessionId?: string, enabled = true) {
  return useQuery({
    queryKey: [...posKeys.sales(), posSessionId ?? "all"],
    queryFn: () => posApi.listSales(posSessionId),
    enabled,
  });
}

export function useDiscountRules() {
  return useQuery({ queryKey: posKeys.discountRules(), queryFn: posApi.listDiscountRules });
}

export function useCreateTerminal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: posApi.createTerminal,
    onSuccess: () => qc.invalidateQueries({ queryKey: posKeys.terminals() }),
  });
}

export function useOpenSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: posApi.openSession,
    onSuccess: () => void qc.invalidateQueries({ queryKey: posKeys.sessions() }),
  });
}

export function useCloseSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (args: { id: string; closingCash: number }) => posApi.closeSession(args.id, args.closingCash),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: posKeys.sessions() });
      void qc.invalidateQueries({ queryKey: posKeys.sales() });
    },
  });
}

function invalidateStock(qc: ReturnType<typeof useQueryClient>) {
  void qc.invalidateQueries({ queryKey: posKeys.sales() });
  void qc.invalidateQueries({ queryKey: inventoryKeys.products() });
  void qc.invalidateQueries({ queryKey: inventoryKeys.stock() });
}

export function useCreateSale() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: posApi.createSale,
    onSuccess: () => invalidateStock(qc),
  });
}

export function useRefundSale() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (args: { id: string; items: RefundSaleItem[]; reason?: string; managerPin?: string }) =>
      posApi.refundSale(args.id, args.items, args.reason, args.managerPin),
    onSuccess: () => invalidateStock(qc),
  });
}

export function useVoidSale() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (args: { id: string; managerPin?: string }) => posApi.voidSale(args.id, args.managerPin),
    onSuccess: () => invalidateStock(qc),
  });
}

export function useExchangeSale() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (args: {
      id: string;
      returns: RefundSaleItem[];
      replacements: SaleItemInput[];
      payments?: SalePaymentInput[];
      reason?: string;
      managerPin?: string;
    }) => posApi.exchangeSale(args.id, args),
    onSuccess: () => invalidateStock(qc),
  });
}

export function useSetManagerPin() {
  return useMutation({
    mutationFn: (args: { pin: string; currentPin?: string }) => posApi.setManagerPin(args.pin, args.currentPin),
  });
}

export function useCreateDiscountRule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: posApi.createDiscountRule,
    onSuccess: () => qc.invalidateQueries({ queryKey: posKeys.discountRules() }),
  });
}
