"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  inventoryApi,
  type AdjustStockInput,
  type CreateProductInput,
  type CreateTransferInput,
  type CreateWarehouseInput,
  type ReceiveStockInput,
  type UpdateProductInput,
  type UpdateWarehouseInput,
} from "../api/inventory.service";
import { inventoryKeys } from "../query-keys";
import type { TransferListParams } from "../types";

export function useProducts() {
  return useQuery({ queryKey: inventoryKeys.products(), queryFn: inventoryApi.listProducts });
}

export function useProduct(id: string) {
  return useQuery({
    queryKey: inventoryKeys.product(id),
    queryFn: () => inventoryApi.getProduct(id),
    enabled: Boolean(id),
  });
}

export function useCategories() {
  return useQuery({ queryKey: inventoryKeys.categories(), queryFn: inventoryApi.listCategories });
}

export function useUnits() {
  return useQuery({ queryKey: inventoryKeys.units(), queryFn: inventoryApi.listUnits });
}

export function useWarehouses() {
  return useQuery({ queryKey: inventoryKeys.warehouses(), queryFn: inventoryApi.listWarehouses });
}

export function useWarehouse(id: string) {
  return useQuery({
    queryKey: inventoryKeys.warehouse(id),
    queryFn: () => inventoryApi.getWarehouse(id),
    enabled: Boolean(id),
  });
}

export function useStock() {
  return useQuery({ queryKey: inventoryKeys.stock(), queryFn: inventoryApi.listStock });
}

export function useMovements() {
  return useQuery({ queryKey: inventoryKeys.movements(), queryFn: inventoryApi.listMovements });
}

export function useBatches() {
  return useQuery({ queryKey: inventoryKeys.batches(), queryFn: inventoryApi.listBatches });
}

export function useCreateProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateProductInput) => inventoryApi.createProduct(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: inventoryKeys.products() }),
  });
}

export function useUpdateProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (args: { id: string; input: UpdateProductInput }) =>
      inventoryApi.updateProduct(args.id, args.input),
    onSuccess: (_d, args) => {
      void qc.invalidateQueries({ queryKey: inventoryKeys.products() });
      void qc.invalidateQueries({ queryKey: inventoryKeys.product(args.id) });
    },
  });
}

export function useDeleteProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => inventoryApi.deleteProduct(id),
    onSuccess: () => void qc.invalidateQueries({ queryKey: inventoryKeys.products() }),
  });
}

export function useCreateWarehouse() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateWarehouseInput) => inventoryApi.createWarehouse(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: inventoryKeys.warehouses() }),
  });
}

export function useUpdateWarehouse() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (args: { id: string; input: UpdateWarehouseInput }) =>
      inventoryApi.updateWarehouse(args.id, args.input),
    onSuccess: (_d, args) => {
      void qc.invalidateQueries({ queryKey: inventoryKeys.warehouses() });
      void qc.invalidateQueries({ queryKey: inventoryKeys.warehouse(args.id) });
    },
  });
}

export function useDeleteWarehouse() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => inventoryApi.deleteWarehouse(id),
    onSuccess: () => void qc.invalidateQueries({ queryKey: inventoryKeys.warehouses() }),
  });
}

export function useReceiveStock() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: ReceiveStockInput) => inventoryApi.receiveStock(input),
    onSuccess: () => invalidateStockViews(qc),
  });
}

function invalidateStockViews(qc: ReturnType<typeof useQueryClient>) {
  void qc.invalidateQueries({ queryKey: inventoryKeys.stock() });
  void qc.invalidateQueries({ queryKey: inventoryKeys.movements() });
  void qc.invalidateQueries({ queryKey: inventoryKeys.products() });
  void qc.invalidateQueries({ queryKey: [...inventoryKeys.all, "transfers"] });
  void qc.invalidateQueries({ queryKey: inventoryKeys.warehouses() });
  void qc.invalidateQueries({ queryKey: inventoryKeys.dashboard() });
  void qc.invalidateQueries({ queryKey: [...inventoryKeys.all, "reorder"] });
  void qc.invalidateQueries({ queryKey: [...inventoryKeys.all, "valuation"] });
}

export function useAdjustStock() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: AdjustStockInput) => inventoryApi.adjustStock(input),
    onSuccess: () => invalidateStockViews(qc),
  });
}

export function useTransfers(params?: TransferListParams) {
  return useQuery({
    queryKey: inventoryKeys.transfers(params as Record<string, unknown> | undefined),
    queryFn: () => inventoryApi.listTransfers(params),
  });
}

export function useTransfer(id: string) {
  return useQuery({
    queryKey: inventoryKeys.transfer(id),
    queryFn: () => inventoryApi.getTransfer(id),
    enabled: Boolean(id),
  });
}

export function useCreateTransfer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateTransferInput) => inventoryApi.createTransfer(input),
    onSuccess: () => void qc.invalidateQueries({ queryKey: [...inventoryKeys.all, "transfers"] }),
  });
}

export function useApproveTransfer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => inventoryApi.approveTransfer(id),
    onSuccess: () => void qc.invalidateQueries({ queryKey: [...inventoryKeys.all, "transfers"] }),
  });
}

export function useDispatchTransfer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => inventoryApi.dispatchTransfer(id),
    onSuccess: () => invalidateStockViews(qc),
  });
}

export function useReceiveTransfer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => inventoryApi.receiveTransfer(id),
    onSuccess: () => invalidateStockViews(qc),
  });
}

export function useInventoryDashboard() {
  return useQuery({ queryKey: inventoryKeys.dashboard(), queryFn: inventoryApi.getDashboard });
}

export function useReorder(warehouseId?: string) {
  return useQuery({
    queryKey: inventoryKeys.reorder(warehouseId),
    queryFn: () => inventoryApi.listReorder(warehouseId),
  });
}

export function useValuation(warehouseId?: string) {
  return useQuery({
    queryKey: inventoryKeys.valuation(warehouseId),
    queryFn: () => inventoryApi.getValuation(warehouseId),
  });
}
