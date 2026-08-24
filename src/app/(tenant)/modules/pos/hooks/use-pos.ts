"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { posApi } from "../api/pos.service";
import type { RefundSaleItem } from "../api/pos.service";
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

export function usePosSales() {
  return useQuery({ queryKey: posKeys.sales(), queryFn: posApi.listSales });
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

export function useCreateSale() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: posApi.createSale,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: posKeys.sales() });
      void qc.invalidateQueries({ queryKey: inventoryKeys.products() });
      void qc.invalidateQueries({ queryKey: inventoryKeys.stock() });
    },
  });
}

export function useRefundSale() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (args: { id: string; items: RefundSaleItem[]; reason?: string }) =>
      posApi.refundSale(args.id, args.items, args.reason),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: posKeys.sales() });
      void qc.invalidateQueries({ queryKey: inventoryKeys.products() });
      void qc.invalidateQueries({ queryKey: inventoryKeys.stock() });
    },
  });
}

export function useVoidSale() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => posApi.voidSale(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: posKeys.sales() });
      void qc.invalidateQueries({ queryKey: inventoryKeys.products() });
      void qc.invalidateQueries({ queryKey: inventoryKeys.stock() });
    },
  });
}
