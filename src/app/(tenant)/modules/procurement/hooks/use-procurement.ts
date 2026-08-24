"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { procurementApi } from "../api/procurement.service";
import { procurementKeys } from "../query-keys";

export function usePurchaseOrders() {
  return useQuery({
    queryKey: procurementKeys.purchaseOrders(),
    queryFn: procurementApi.listPurchaseOrders,
  });
}

export function usePurchaseOrder(id: string) {
  return useQuery({
    queryKey: procurementKeys.purchaseOrder(id),
    queryFn: () => procurementApi.getPurchaseOrder(id),
    enabled: Boolean(id),
  });
}

export function useSuppliers() {
  return useQuery({
    queryKey: procurementKeys.suppliers(),
    queryFn: procurementApi.listSuppliers,
  });
}

export function useCreateGoodsReceipt() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (args: {
      purchaseOrderId: string;
      items: { productId: string; quantity: number; batchNumber?: string; expiryDate?: string }[];
    }) => procurementApi.createGoodsReceipt(args.purchaseOrderId, args.items),
    onSuccess: (_d, args) => {
      void qc.invalidateQueries({ queryKey: procurementKeys.goodsReceipts(args.purchaseOrderId) });
      void qc.invalidateQueries({ queryKey: procurementKeys.purchaseOrders() });
      void qc.invalidateQueries({ queryKey: ["inventory"] });
    },
  });
}

export function useCreateSupplier() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: procurementApi.createSupplier,
    onSuccess: () => void qc.invalidateQueries({ queryKey: procurementKeys.suppliers() }),
  });
}

export function useCreatePurchaseOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: procurementApi.createPurchaseOrder,
    onSuccess: () => void qc.invalidateQueries({ queryKey: procurementKeys.purchaseOrders() }),
  });
}

export function useSubmitPurchaseOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => procurementApi.submitPurchaseOrder(id),
    onSuccess: () => void qc.invalidateQueries({ queryKey: procurementKeys.purchaseOrders() }),
  });
}

export function useApprovePurchaseOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => procurementApi.approvePurchaseOrder(id),
    onSuccess: () => void qc.invalidateQueries({ queryKey: procurementKeys.purchaseOrders() }),
  });
}

export function usePurchaseInvoices() {
  return useQuery({
    queryKey: procurementKeys.purchaseInvoices(),
    queryFn: procurementApi.listPurchaseInvoices,
  });
}

export function useCreatePurchaseInvoice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: procurementApi.createPurchaseInvoice,
    onSuccess: () => void qc.invalidateQueries({ queryKey: procurementKeys.purchaseInvoices() }),
  });
}

export function useRecordSupplierPayment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (args: {
      id: string;
      amount: number;
      paymentMethod: "CASH" | "CARD" | "BANK" | "MOBILE_PAYMENT" | "CHEQUE" | "OTHER";
      transactionReference?: string;
    }) =>
      procurementApi.recordSupplierPayment(args.id, {
        amount: args.amount,
        paymentMethod: args.paymentMethod,
        transactionReference: args.transactionReference,
      }),
    onSuccess: () => void qc.invalidateQueries({ queryKey: procurementKeys.purchaseInvoices() }),
  });
}
