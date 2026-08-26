"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { retainersApi } from "../api/retainers.service";
import type { NewRetainerInput, RetainerStatus } from "../types";
import { billingKeys } from "../query-keys";

export function useRetainers() {
  return useQuery({ queryKey: billingKeys.retainers(), queryFn: retainersApi.list });
}

export function useRetainer(id: string) {
  return useQuery({
    queryKey: billingKeys.retainer(id),
    queryFn: () => retainersApi.get(id),
    enabled: Boolean(id),
  });
}

export function useCreateRetainer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: NewRetainerInput) => retainersApi.create(input),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: billingKeys.retainers() });
      void qc.invalidateQueries({ queryKey: billingKeys.invoices() });
    },
  });
}

export function useUpdateRetainer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (args: { id: string; input: NewRetainerInput }) => retainersApi.update(args.id, args.input),
    onSuccess: (_d, args) => {
      void qc.invalidateQueries({ queryKey: billingKeys.retainers() });
      void qc.invalidateQueries({ queryKey: billingKeys.retainer(args.id) });
    },
  });
}

export function useDrawRetainer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (args: {
      retainerId: string;
      invoice: { id: string; number: string; total: number; issueDate: string };
    }) => retainersApi.drawForInvoice(args.retainerId, args.invoice),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: billingKeys.retainers() });
      void qc.invalidateQueries({ queryKey: billingKeys.invoices() });
    },
  });
}

export function useSetRetainerStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (args: { id: string; status: RetainerStatus }) => retainersApi.setStatus(args.id, args.status),
    onSuccess: () => void qc.invalidateQueries({ queryKey: billingKeys.retainers() }),
  });
}

export function useTransferRetainer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (args: { fromId: string; toId: string }) => retainersApi.transfer(args.fromId, args.toId),
    onSuccess: () => void qc.invalidateQueries({ queryKey: billingKeys.retainers() }),
  });
}

export function useRollOverRetainer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (args: { id: string; newExpiryDate?: string }) => retainersApi.rollOver(args.id, args.newExpiryDate),
    onSuccess: () => void qc.invalidateQueries({ queryKey: billingKeys.retainers() }),
  });
}

export function useForfeitRetainer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => retainersApi.forfeit(id),
    onSuccess: () => void qc.invalidateQueries({ queryKey: billingKeys.retainers() }),
  });
}

export function useRefundRetainer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (args: { id: string; reason: string; amount?: number }) =>
      retainersApi.requestRefund(args.id, args.reason, args.amount),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: billingKeys.retainers() });
      void qc.invalidateQueries({ queryKey: billingKeys.adjustments() });
      void qc.invalidateQueries({ queryKey: billingKeys.invoices() });
    },
  });
}
