"use client";

import { useEffect, useMemo, useState } from "react";
import { MonitorSmartphone, RotateCcw, Ban } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { FormField } from "@/components/shared/form-field";
import { PageHeading } from "@/components/shared/page-heading";
import { fmtMoney } from "@/lib/format";
import { toast } from "@/lib/toast";
import { ApiError } from "@/lib/api/errors";
import { useProducts, useWarehouses } from "@/app/(tenant)/modules/inventory/hooks/use-inventory";
import { posApi } from "../api/pos.service";
import {
  useCloseSession,
  useCreateSale,
  useCreateTerminal,
  useOpenSession,
  usePosSales,
  usePosSessions,
  usePosTerminals,
  useRefundSale,
  useVoidSale,
} from "../hooks/use-pos";

export function PosRegisterPage() {
  const { data: terminals = [], isLoading: terminalsLoading } = usePosTerminals();
  const { data: openSessions = [] } = usePosSessions("OPEN");
  const { data: sales = [], isLoading: salesLoading } = usePosSales();
  const { data: warehouses = [] } = useWarehouses();
  const { data: products = [] } = useProducts();
  const createTerminal = useCreateTerminal();
  const openSession = useOpenSession();
  const closeSession = useCloseSession();
  const createSale = useCreateSale();
  const refundSale = useRefundSale();
  const voidSale = useVoidSale();

  const [terminalName, setTerminalName] = useState("Front Counter");
  const [terminalCode, setTerminalCode] = useState("POS-01");
  const [warehouseId, setWarehouseId] = useState("");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [selectedTerminalId, setSelectedTerminalId] = useState("");
  const [productId, setProductId] = useState("");
  const [qty, setQty] = useState("1");
  const [closingCash, setClosingCash] = useState("0");
  const [saleBusy, setSaleBusy] = useState<string | null>(null);

  const activeProducts = useMemo(() => products.filter((p) => p.status === "active"), [products]);
  const selectedProduct = activeProducts.find((p) => p.id === productId);

  useEffect(() => {
    if (!selectedTerminalId || sessionId) return;
    const active = openSessions.find((s) => s.terminalId === selectedTerminalId && s.status === "OPEN");
    if (active) setSessionId(active.id);
  }, [openSessions, selectedTerminalId, sessionId]);

  async function handleCreateTerminal() {
    if (!warehouseId) {
      toast.error("Select a warehouse");
      return;
    }
    try {
      await createTerminal.mutateAsync({
        name: terminalName.trim() || "Terminal",
        code: terminalCode.trim() || `POS-${Date.now().toString(36).toUpperCase()}`,
        warehouseId,
      });
      toast.success("Terminal created");
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Could not create terminal");
    }
  }

  async function handleOpenSession() {
    if (!selectedTerminalId) {
      toast.error("Select a terminal");
      return;
    }
    try {
      const session = await openSession.mutateAsync({
        terminalId: selectedTerminalId,
        openingCash: 0,
      });
      setSessionId(session.id);
      toast.success("Session opened");
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Could not open session");
    }
  }

  async function handleCloseSession() {
    if (!sessionId) return;
    const cash = Number(closingCash);
    if (!Number.isFinite(cash) || cash < 0) {
      toast.error("Enter closing cash");
      return;
    }
    try {
      await closeSession.mutateAsync({ id: sessionId, closingCash: cash });
      setSessionId(null);
      toast.success("Session closed");
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Could not close session");
    }
  }

  async function handleSale() {
    if (!sessionId || !selectedProduct) {
      toast.error("Open a session and select a product");
      return;
    }
    const quantity = Number(qty);
    if (!Number.isFinite(quantity) || quantity <= 0) {
      toast.error("Enter a valid quantity");
      return;
    }
    const amount = quantity * selectedProduct.price;
    try {
      await createSale.mutateAsync({
        posSessionId: sessionId,
        items: [
          {
            productId: selectedProduct.id,
            quantity,
            unitPrice: selectedProduct.price,
            tax: 0,
            discount: 0,
          },
        ],
        payments: [{ paymentMethod: "CASH", amount }],
      });
      toast.success("Sale recorded", { description: fmtMoney(amount) });
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Sale failed");
    }
  }

  async function handleRefund(saleId: string) {
    setSaleBusy(saleId);
    try {
      const sale = await posApi.getSale(saleId);
      if (!sale.items?.length) {
        toast.error("Sale has no line items to refund");
        return;
      }
      const items = sale.items.map((item) => ({
        productId: item.productId,
        quantity: Number(item.quantity),
        unitPrice: Number(item.unitPrice),
        condition: "SELLABLE" as const,
      }));
      await refundSale.mutateAsync({ id: saleId, items, reason: "Customer refund" });
      toast.success("Sale refunded");
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Refund failed");
    } finally {
      setSaleBusy(null);
    }
  }

  async function handleVoid(saleId: string) {
    setSaleBusy(saleId);
    try {
      await voidSale.mutateAsync(saleId);
      toast.success("Sale voided");
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Void failed");
    } finally {
      setSaleBusy(null);
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <PageHeading
        title="POS"
        subtitle="Minimal register — terminal, session, and cash sale against live inventory"
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="flex flex-col gap-4 p-5">
          <div className="flex items-center gap-2 text-[13px] font-bold text-text">
            <MonitorSmartphone className="size-4 text-blue" />
            Setup
          </div>
          <FormField label="New terminal name">
            <Input value={terminalName} onChange={(e) => setTerminalName(e.target.value)} className="h-9" />
          </FormField>
          <FormField label="Code">
            <Input value={terminalCode} onChange={(e) => setTerminalCode(e.target.value)} className="h-9" />
          </FormField>
          <FormField label="Warehouse">
            <Select value={warehouseId} onValueChange={(v) => setWarehouseId(v ?? "")}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select warehouse" />
              </SelectTrigger>
              <SelectContent>
                {warehouses.map((w) => (
                  <SelectItem key={w.id} value={w.id}>
                    {w.name} ({w.code})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>
          <Button onClick={handleCreateTerminal} disabled={createTerminal.isPending}>
            {createTerminal.isPending ? "Creating..." : "Create terminal"}
          </Button>

          <FormField label="Open session on">
            <Select value={selectedTerminalId} onValueChange={(v) => setSelectedTerminalId(v ?? "")}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select terminal" />
              </SelectTrigger>
              <SelectContent>
                {terminals.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.name} · {t.code}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>
          <Button variant="outline" onClick={handleOpenSession} disabled={openSession.isPending}>
            {openSession.isPending ? "Opening..." : "Open cashier session"}
          </Button>
          {sessionId && (
            <div className="flex flex-col gap-2 rounded-[10px] border border-border bg-surface-subtle p-3">
              <p className="text-[12px] text-green">
                Active session: <span className="font-mono">{sessionId.slice(0, 8)}…</span>
              </p>
              <FormField label="Closing cash">
                <Input
                  type="number"
                  min={0}
                  step="any"
                  value={closingCash}
                  onChange={(e) => setClosingCash(e.target.value)}
                  className="h-9"
                />
              </FormField>
              <Button variant="outline" onClick={handleCloseSession} disabled={closeSession.isPending}>
                {closeSession.isPending ? "Closing..." : "Close session"}
              </Button>
            </div>
          )}
          {openSessions.length > 0 && (
            <div className="rounded-[10px] border border-border bg-surface-subtle p-3 text-[11.5px] text-text-3">
              {openSessions.length} open session{openSessions.length === 1 ? "" : "s"} across terminals
            </div>
          )}
        </Card>

        <Card className="flex flex-col gap-4 p-5">
          <div className="text-[13px] font-bold text-text">Quick cash sale</div>
          <FormField label="Product">
            <Select value={productId} onValueChange={(v) => setProductId(v ?? "")}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select product" />
              </SelectTrigger>
              <SelectContent>
                {activeProducts.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name} · {fmtMoney(p.price)} · stock {p.stock}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>
          <FormField label="Quantity">
            <Input type="number" min={1} step={1} value={qty} onChange={(e) => setQty(e.target.value)} className="h-9" />
          </FormField>
          <Button onClick={handleSale} disabled={createSale.isPending || !sessionId}>
            {createSale.isPending ? "Posting..." : "Post cash sale"}
          </Button>
        </Card>
      </div>

      <Card className="flex flex-col gap-4 p-5">
        <div className="text-[13px] font-bold text-text">Recent sales</div>
        {terminalsLoading || salesLoading ? (
          <Skeleton className="h-32 w-full" />
        ) : sales.length === 0 ? (
          <p className="py-6 text-center text-[12.5px] text-text-3">No sales yet.</p>
        ) : (
          <div className="overflow-x-auto rounded-[10px] border border-border">
            <Table>
              <TableHeader>
                <TableRow className="bg-surface-subtle hover:bg-surface-subtle">
                  <TableHead>Receipt</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sales.slice(0, 20).map((sale) => {
                  const canRefund = sale.status === "COMPLETED" || sale.status === "PARTIALLY_REFUNDED";
                  const canVoid = sale.status === "COMPLETED";
                  const busy = saleBusy === sale.id;
                  return (
                    <TableRow key={sale.id}>
                      <TableCell className="font-semibold tabular-nums">
                        {sale.transactionNumber ?? sale.id.slice(0, 8)}
                      </TableCell>
                      <TableCell>
                        <Badge tone="neutral">{sale.status}</Badge>
                      </TableCell>
                      <TableCell className="text-right font-semibold tabular-nums">
                        {fmtMoney(Number(sale.total))}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          {canRefund && (
                            <Button
                              variant="outline"
                              size="sm"
                              disabled={busy}
                              onClick={() => handleRefund(sale.id)}
                            >
                              <RotateCcw /> Refund
                            </Button>
                          )}
                          {canVoid && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-red"
                              disabled={busy}
                              onClick={() => handleVoid(sale.id)}
                            >
                              <Ban /> Void
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>
    </div>
  );
}
