"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { invoiceApi } from "../api/invoices.service";
import type { NewInvoiceInput, RecordPaymentInput } from "../types";
import { billingKeys } from "../query-keys";

export function useInvoices() {
  return useQuery({ queryKey: billingKeys.invoices(), queryFn: invoiceApi.list });
}

export function useInvoice(id: string) {
  return useQuery({
    queryKey: billingKeys.invoice(id),
    queryFn: () => invoiceApi.get(id),
    enabled: Boolean(id),
  });
}

export function useCreateInvoice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (args: { input: NewInvoiceInput; mode: "draft" | "send" }) =>
      invoiceApi.create(args.input, args.mode),
    onSuccess: () => qc.invalidateQueries({ queryKey: billingKeys.invoices() }),
  });
}

export function useUpdateInvoice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (args: { id: string; input: NewInvoiceInput }) => invoiceApi.update(args.id, args.input),
    onSuccess: (_d, args) => {
      void qc.invalidateQueries({ queryKey: billingKeys.invoices() });
      void qc.invalidateQueries({ queryKey: billingKeys.invoice(args.id) });
    },
  });
}

export function useSendInvoice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => invoiceApi.send(id),
    onSuccess: (_d, id) => {
      void qc.invalidateQueries({ queryKey: billingKeys.invoices() });
      void qc.invalidateQueries({ queryKey: billingKeys.invoice(id) });
    },
  });
}

export function useRecordInvoicePayment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (args: { id: string; input: RecordPaymentInput }) =>
      invoiceApi.recordPayment(args.id, args.input),
    onSuccess: (_d, args) => {
      void qc.invalidateQueries({ queryKey: billingKeys.invoices() });
      void qc.invalidateQueries({ queryKey: billingKeys.invoice(args.id) });
    },
  });
}

export function useCancelInvoice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => invoiceApi.cancel(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: billingKeys.invoices() }),
  });
}
