"use client";

import { useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Eye, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { FormDialog } from "@/components/shared/form-dialog";
import { FormField } from "@/components/shared/form-field";
import { PageHeading } from "@/components/shared/page-heading";
import { ApiError } from "@/lib/api/errors";
import { toast } from "@/lib/toast";
import {
  useApproveTransfer,
  useCreateTransfer,
  useDispatchTransfer,
  useProducts,
  useReceiveTransfer,
  useTransfer,
  useTransfers,
  useWarehouses,
} from "../hooks/use-inventory";
import type { StockTransfer, StockTransferStatus, TransferListParams } from "../types";

const statusTone: Record<string, "amber" | "blue" | "green" | "neutral"> = {
  PENDING: "amber",
  APPROVED: "blue",
  DISPATCHED: "blue",
  RECEIVED: "green",
  CANCELLED: "neutral",
};

const STATUSES: StockTransferStatus[] = ["PENDING", "APPROVED", "DISPATCHED", "RECEIVED", "CANCELLED"];

function param(sp: URLSearchParams, key: string) {
  return sp.get(key) ?? "";
}

export function StockTransfersPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const filters: TransferListParams = useMemo(() => {
    const page = Number(param(searchParams, "page") || "1");
    const pageSize = Number(param(searchParams, "pageSize") || "20");
    const status = param(searchParams, "status") as StockTransferStatus | "";
    return {
      sourceWarehouse: param(searchParams, "sourceWarehouse") || undefined,
      destinationWarehouse: param(searchParams, "destinationWarehouse") || undefined,
      status: status && STATUSES.includes(status) ? status : undefined,
      dateFrom: param(searchParams, "dateFrom") || undefined,
      dateTo: param(searchParams, "dateTo") || undefined,
      search: param(searchParams, "search") || undefined,
      page: Number.isFinite(page) && page > 0 ? page : 1,
      pageSize: Number.isFinite(pageSize) && pageSize > 0 ? pageSize : 20,
    };
  }, [searchParams]);

  const { data, isLoading, isError } = useTransfers(filters);
  const transfers = data?.items ?? [];
  const total = data?.total ?? 0;
  const page = data?.page ?? filters.page ?? 1;
  const pageSize = data?.pageSize ?? filters.pageSize ?? 20;

  const { data: products = [] } = useProducts();
  const { data: warehouses = [] } = useWarehouses();
  const createTransfer = useCreateTransfer();
  const approveTransfer = useApproveTransfer();
  const dispatchTransfer = useDispatchTransfer();
  const receiveTransfer = useReceiveTransfer();

  const [open, setOpen] = useState(false);
  const [fromWarehouseId, setFromWarehouseId] = useState("");
  const [toWarehouseId, setToWarehouseId] = useState("");
  const [productId, setProductId] = useState("");
  const [quantity, setQuantity] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [detailId, setDetailId] = useState("");

  const { data: detail } = useTransfer(detailId);

  function setParams(patch: Record<string, string | undefined>, resetPage = false) {
    const next = new URLSearchParams(searchParams.toString());
    for (const [k, v] of Object.entries(patch)) {
      if (!v) next.delete(k);
      else next.set(k, v);
    }
    if (resetPage) next.set("page", "1");
    const qs = next.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname);
  }

  function clearFilters() {
    router.replace(pathname);
  }

  function reset() {
    setFromWarehouseId("");
    setToWarehouseId("");
    setProductId("");
    setQuantity("");
    setErrors({});
  }

  async function handleCreate() {
    const qty = Number(quantity);
    const nextErrors: Record<string, string> = {};
    if (!fromWarehouseId) nextErrors.fromWarehouseId = "Required";
    if (!toWarehouseId) nextErrors.toWarehouseId = "Required";
    if (fromWarehouseId && toWarehouseId && fromWarehouseId === toWarehouseId) {
      nextErrors.toWarehouseId = "Must differ from source";
    }
    if (!productId) nextErrors.productId = "Required";
    if (!Number.isFinite(qty) || qty <= 0) nextErrors.quantity = "Enter a positive quantity";
    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors);
      return;
    }

    try {
      await createTransfer.mutateAsync({
        fromWarehouseId,
        toWarehouseId,
        items: [{ productId, quantity: qty }],
      });
      toast.success("Transfer requested");
      reset();
      setOpen(false);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Transfer failed");
    }
  }

  async function runAction(label: string, fn: () => Promise<unknown>) {
    try {
      await fn();
      toast.success(label);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Action failed");
    }
  }

  function actionsFor(t: StockTransfer) {
    if (t.status === "PENDING") {
      return (
        <Button
          size="sm"
          variant="outline"
          disabled={approveTransfer.isPending}
          onClick={() => runAction("Approved", () => approveTransfer.mutateAsync(t.id))}
        >
          Approve
        </Button>
      );
    }
    if (t.status === "APPROVED") {
      return (
        <Button
          size="sm"
          variant="outline"
          disabled={dispatchTransfer.isPending}
          onClick={() => runAction("Dispatched", () => dispatchTransfer.mutateAsync(t.id))}
        >
          Dispatch
        </Button>
      );
    }
    if (t.status === "DISPATCHED") {
      return (
        <Button
          size="sm"
          variant="outline"
          disabled={receiveTransfer.isPending}
          onClick={() => runAction("Received", () => receiveTransfer.mutateAsync(t.id))}
        >
          Receive
        </Button>
      );
    }
    return null;
  }

  const pageCount = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="flex flex-col gap-5">
      <PageHeading
        title="Stock Transfers"
        subtitle="Request → Approve → Dispatch → Receive"
        actions={
          <Button onClick={() => setOpen(true)}>
            <Plus data-icon="inline-start" />
            New Transfer
          </Button>
        }
      />

      <Card className="flex flex-col gap-4 p-5">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          <Input
            value={filters.search ?? ""}
            onChange={(e) => setParams({ search: e.target.value || undefined }, true)}
            placeholder="Search by ID..."
            className="h-9 text-[12.5px]"
          />
          <Select
            value={filters.sourceWarehouse ?? "__all"}
            onValueChange={(v) =>
              setParams({ sourceWarehouse: !v || v === "__all" ? undefined : v }, true)
            }
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Source warehouse" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all">All sources</SelectItem>
              {warehouses.map((w) => (
                <SelectItem key={w.id} value={w.id}>
                  {w.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={filters.destinationWarehouse ?? "__all"}
            onValueChange={(v) =>
              setParams({ destinationWarehouse: !v || v === "__all" ? undefined : v }, true)
            }
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Destination warehouse" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all">All destinations</SelectItem>
              {warehouses.map((w) => (
                <SelectItem key={w.id} value={w.id}>
                  {w.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={filters.status ?? "__all"}
            onValueChange={(v) => setParams({ status: !v || v === "__all" ? undefined : v }, true)}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all">All statuses</SelectItem>
              {STATUSES.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input
            type="date"
            value={filters.dateFrom?.slice(0, 10) ?? ""}
            onChange={(e) => setParams({ dateFrom: e.target.value ? `${e.target.value}T00:00:00.000Z` : undefined }, true)}
            className="h-9 text-[12.5px]"
          />
          <Input
            type="date"
            value={filters.dateTo?.slice(0, 10) ?? ""}
            onChange={(e) => setParams({ dateTo: e.target.value ? `${e.target.value}T23:59:59.999Z` : undefined }, true)}
            className="h-9 text-[12.5px]"
          />
        </div>
        <div className="flex items-center justify-between gap-2">
          <p className="text-[12px] text-text-3">
            {total} transfer{total === 1 ? "" : "s"}
          </p>
          <Button variant="outline" size="sm" onClick={clearFilters}>
            Clear filters
          </Button>
        </div>

        {isLoading ? (
          <Skeleton className="h-40 w-full" />
        ) : isError ? (
          <p className="py-10 text-center text-[13px] text-red">Could not load transfers.</p>
        ) : transfers.length === 0 ? (
          <p className="py-10 text-center text-[13px] text-text-3">No transfers match these filters.</p>
        ) : (
          <>
            <div className="overflow-x-auto rounded-[10px] border border-border">
              <Table>
                <TableHeader>
                  <TableRow className="bg-surface-subtle hover:bg-surface-subtle">
                    <TableHead>Reference</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead>Destination</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Items</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created by</TableHead>
                    <TableHead />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transfers.map((t) => (
                    <TableRow key={t.id}>
                      <TableCell className="font-mono text-[12px]">{t.id.slice(0, 8)}</TableCell>
                      <TableCell>{t.fromWarehouseName ?? t.fromWarehouseId.slice(0, 8)}</TableCell>
                      <TableCell>{t.toWarehouseName ?? t.toWarehouseId.slice(0, 8)}</TableCell>
                      <TableCell className="tabular-nums text-text-2">
                        {new Date(t.createdAt).toLocaleString()}
                      </TableCell>
                      <TableCell className="tabular-nums">{t.itemCount ?? t.items.length}</TableCell>
                      <TableCell>
                        <Badge tone={statusTone[t.status] ?? "neutral"}>{t.status}</Badge>
                      </TableCell>
                      <TableCell className="text-[12.5px] text-text-2">{t.createdBy ?? "—"}</TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon-sm" aria-label="View" onClick={() => setDetailId(t.id)}>
                            <Eye />
                          </Button>
                          {actionsFor(t)}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3 text-[12.5px]">
              <p className="text-text-3">
                Page {page} of {pageCount} · {total} total
              </p>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={page <= 1}
                  onClick={() => setParams({ page: String(page - 1) })}
                >
                  Prev
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={page >= pageCount}
                  onClick={() => setParams({ page: String(page + 1) })}
                >
                  Next
                </Button>
                <Select
                  value={String(pageSize)}
                  onValueChange={(v) => setParams({ pageSize: v ?? "20", page: "1" })}
                >
                  <SelectTrigger className="h-8 w-[100px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[10, 20, 50].map((n) => (
                      <SelectItem key={n} value={String(n)}>
                        {n} / page
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </>
        )}
      </Card>

      <FormDialog
        open={open}
        onOpenChange={(next) => {
          if (!next) reset();
          setOpen(next);
        }}
        title="New stock transfer"
        onSubmit={handleCreate}
        submitLabel="Request"
        submitting={createTransfer.isPending}
      >
        <FormField label="From warehouse" error={errors.fromWarehouseId}>
          <Select value={fromWarehouseId} onValueChange={(v) => setFromWarehouseId(v ?? "")}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Source" />
            </SelectTrigger>
            <SelectContent>
              {warehouses.map((w) => (
                <SelectItem key={w.id} value={w.id}>
                  {w.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormField>
        <FormField label="To warehouse" error={errors.toWarehouseId}>
          <Select value={toWarehouseId} onValueChange={(v) => setToWarehouseId(v ?? "")}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Destination" />
            </SelectTrigger>
            <SelectContent>
              {warehouses.map((w) => (
                <SelectItem key={w.id} value={w.id}>
                  {w.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormField>
        <FormField label="Product" error={errors.productId}>
          <Select value={productId} onValueChange={(v) => setProductId(v ?? "")}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Product" />
            </SelectTrigger>
            <SelectContent>
              {products.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.name} ({p.sku})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormField>
        <FormField label="Quantity" error={errors.quantity}>
          <Input type="number" min={0.01} step="any" value={quantity} onChange={(e) => setQuantity(e.target.value)} className="h-9" />
        </FormField>
      </FormDialog>

      <FormDialog
        open={!!detailId}
        onOpenChange={(next) => {
          if (!next) setDetailId("");
        }}
        title="Transfer details"
        onSubmit={() => setDetailId("")}
        submitLabel="Close"
      >
        {!detail ? (
          <Skeleton className="h-24 w-full" />
        ) : (
          <div className="flex flex-col gap-2 text-[12.5px]">
            <DetailLine label="Reference" value={detail.id} />
            <DetailLine label="Source" value={detail.fromWarehouseName ?? detail.fromWarehouseId} />
            <DetailLine label="Destination" value={detail.toWarehouseName ?? detail.toWarehouseId} />
            <DetailLine label="Status" value={detail.status} />
            <DetailLine label="Created by" value={detail.createdBy ?? "—"} />
            <DetailLine label="Created" value={new Date(detail.createdAt).toLocaleString()} />
            <div className="mt-2 border-t border-border pt-2">
              <p className="mb-1 font-semibold text-text">Items</p>
              {detail.items.map((i) => (
                <p key={i.id} className="text-text-2">
                  {i.productName ?? i.productSku ?? i.productId.slice(0, 8)} × {i.quantity}
                </p>
              ))}
            </div>
          </div>
        )}
      </FormDialog>
    </div>
  );
}

function DetailLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-text-3">{label}</span>
      <span className="text-right font-medium text-text">{value}</span>
    </div>
  );
}
