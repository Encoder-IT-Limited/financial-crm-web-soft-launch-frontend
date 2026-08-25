"use client";

import { useCallback, useMemo, useState, useSyncExternalStore } from "react";
import { useMe } from "@/hooks/useMe";
import { can } from "@/lib/permissions";
import { toast } from "@/lib/toast";
import { ApiError } from "@/lib/api/errors";
import { useProducts, useWarehouses } from "@/app/(tenant)/modules/inventory/hooks/use-inventory";
import type { Product } from "@/app/(tenant)/modules/inventory/types";
import { posApi } from "../api/pos.service";
import type { PosReceipt, PosSale, RefundSaleItem, SalePaymentInput } from "../api/pos.service";
import {
  useCloseSession,
  useCreateSale,
  useDiscountRules,
  useOpenSession,
  usePosSales,
  usePosSessions,
  usePosTerminals,
  useRefundSale,
  useVoidSale,
} from "../hooks/use-pos";
import type { CartLine } from "../lib/pos-pricing";
import { cartTotals, priceLine } from "../lib/pos-pricing";
import { PosCatalog } from "./pos-catalog";
import { PosCart } from "./pos-cart";
import { PosPayDialog } from "./pos-pay-dialog";
import { PosPinDialog } from "./pos-pin-dialog";
import { PosReceiptDialog } from "./pos-receipt-dialog";
import { PosRefundDialog } from "./pos-refund-dialog";
import { PosCloseSessionDialog } from "./pos-close-session-dialog";
import { PosSetupSheet } from "./pos-setup-sheet";
import { PosSessionBar } from "./pos-session-bar";
import { PosSalesSheet } from "./pos-sales-sheet";
import { PosSessionGate } from "./pos-session-gate";
import { PosDiscountPicker } from "./pos-discount-picker";

const TERMINAL_KEY = "mrm_pos_terminal_id";

function subscribeTerminal() {
  return () => undefined;
}

function readTerminal() {
  return localStorage.getItem(TERMINAL_KEY) ?? "";
}

const PIN_CODES = new Set([
  "MANAGER_PIN_REQUIRED",
  "INVALID_MANAGER_PIN",
  "DISCOUNT_REQUIRES_MANAGER",
  "MANAGER_PIN_NOT_CONFIGURED",
]);

type PinJob =
  | { kind: "pay"; payments: SalePaymentInput[]; cashTendered: number }
  | { kind: "refund"; saleId: string; items: RefundSaleItem[]; reason: string }
  | { kind: "void"; saleId: string };

function asCartLine(product: Product, quantity = 1): CartLine {
  return {
    productId: product.id,
    name: product.name,
    sku: product.sku,
    barcode: product.barcode,
    quantity,
    unitPrice: product.price,
    taxRate: product.taxRate ?? 0,
    stock: product.stock,
  };
}

export function PosRegisterPage() {
  const { data: me } = useMe();
  const { data: terminals = [], isLoading: terminalsLoading } = usePosTerminals();
  const { data: openSessions = [] } = usePosSessions("OPEN");
  const { data: warehouses = [] } = useWarehouses();
  const { data: products = [], isLoading: productsLoading } = useProducts();
  const { data: rules = [] } = useDiscountRules();
  const openSession = useOpenSession();
  const closeSession = useCloseSession();
  const createSale = useCreateSale();
  const refundSale = useRefundSale();
  const voidSale = useVoidSale();

  const storedTerminal = useSyncExternalStore(subscribeTerminal, readTerminal, () => "");
  const [pickedTerminal, setPickedTerminal] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [lines, setLines] = useState<CartLine[]>([]);
  const [payOpen, setPayOpen] = useState(false);
  const [setupOpen, setSetupOpen] = useState(false);
  const [salesOpen, setSalesOpen] = useState(false);
  const [closeOpen, setCloseOpen] = useState(false);
  const [discountFor, setDiscountFor] = useState<string | null>(null);
  const [refundSaleRow, setRefundSaleRow] = useState<PosSale | null>(null);
  const [receipt, setReceipt] = useState<PosReceipt | null>(null);
  const [changeDue, setChangeDue] = useState(0);
  const [pinJob, setPinJob] = useState<PinJob | null>(null);
  const [pinError, setPinError] = useState<string | null>(null);

  const canSell = can(me, "pos.createSale");
  const canRefund = can(me, "pos.refund");
  const canManage = can(me, "pos.manage");

  const terminalId =
    pickedTerminal ??
    (terminals.some((t) => t.id === storedTerminal) ? storedTerminal : terminals[0]?.id ?? "");

  function selectTerminal(id: string) {
    setPickedTerminal(id);
    localStorage.setItem(TERMINAL_KEY, id);
  }

  const session = openSessions.find((s) => s.terminalId === terminalId && s.status === "OPEN");
  const terminal = terminals.find((t) => t.id === (session?.terminalId ?? terminalId));
  const { data: sessionSales = [] } = usePosSales(session?.id, Boolean(session?.id));

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return products.filter((p) => {
      if (p.status !== "active") return false;
      if (!q) return true;
      return (
        p.name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        (p.barcode ?? "").toLowerCase().includes(q) ||
        p.category.toLowerCase() === q
      );
    });
  }, [products, query]);

  const addProduct = useCallback((product: Product) => {
    setLines((prev) => {
      const existing = prev.find((l) => l.productId === product.id);
      if (existing) {
        if (existing.quantity >= product.stock) {
          toast.error("Not enough stock");
          return prev;
        }
        return prev.map((l) =>
          l.productId === product.id ? { ...l, quantity: l.quantity + 1, stock: product.stock } : l,
        );
      }
      if (product.stock <= 0) {
        toast.error("Out of stock");
        return prev;
      }
      return [...prev, asCartLine(product)];
    });
  }, []);

  async function submitQuery() {
    const raw = query.trim();
    if (!raw) return;
    const looksLikeBarcode = /^[A-Za-z0-9-]{6,}$/.test(raw) && !raw.includes(" ");
    if (looksLikeBarcode) {
      try {
        const product = await posApi.lookupBarcode(raw);
        addProduct(product);
        setQuery("");
        return;
      } catch {
        /* fall through to name match */
      }
    }
    if (filtered.length === 1) {
      addProduct(filtered[0]);
      setQuery("");
    }
  }

  async function handleOpen(id: string, openingCash: number) {
    try {
      await openSession.mutateAsync({ terminalId: id, openingCash });
      selectTerminal(id);
      toast.success("Register is live");
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Could not open session");
    }
  }

  const priced = lines.map((line) => {
    const rule = rules.find((r) => r.id === line.discountRuleId && r.active);
    return priceLine(line, rule ? { type: rule.type, value: Number(rule.value) } : null);
  });
  const totals = cartTotals(priced);

  async function postSale(payments: SalePaymentInput[], cashTendered: number, managerPin?: string) {
    if (!session) return;
    const items = lines.map((line) => ({
      productId: line.productId,
      quantity: line.quantity,
      unitPrice: line.unitPrice,
      ...(line.discountRuleId ? { discountRuleId: line.discountRuleId } : {}),
      ...(line.overrideDiscount ? { discount: line.overrideDiscount } : {}),
    }));
    try {
      const sale = await createSale.mutateAsync({
        posSessionId: session.id,
        items,
        payments,
        managerPin,
      });
      const printed = await posApi.getReceipt(sale.id);
      setChangeDue(cashTendered > totals.total ? cashTendered - totals.total : 0);
      setReceipt(printed);
      setLines([]);
      setPayOpen(false);
      setPinJob(null);
      setPinError(null);
    } catch (error) {
      if (error instanceof ApiError && PIN_CODES.has(String(error.code))) {
        setPinJob({ kind: "pay", payments, cashTendered });
        setPinError(error.code === "INVALID_MANAGER_PIN" ? "Incorrect PIN" : error.message);
        return;
      }
      toast.error(error instanceof ApiError ? error.message : "Sale failed");
    }
  }

  async function runPin(pin: string) {
    if (!pinJob) return;
    setPinError(null);
    if (pinJob.kind === "pay") {
      await postSale(pinJob.payments, pinJob.cashTendered, pin);
      return;
    }
    try {
      if (pinJob.kind === "refund") {
        await refundSale.mutateAsync({
          id: pinJob.saleId,
          items: pinJob.items,
          reason: pinJob.reason,
          managerPin: pin,
        });
        toast.success("Refund posted");
        setRefundSaleRow(null);
      } else {
        await voidSale.mutateAsync({ id: pinJob.saleId, managerPin: pin });
        toast.success("Sale voided");
      }
      setPinJob(null);
    } catch (error) {
      if (error instanceof ApiError && PIN_CODES.has(String(error.code))) {
        setPinError(error.code === "INVALID_MANAGER_PIN" ? "Incorrect PIN" : error.message);
        return;
      }
      toast.error(error instanceof ApiError ? error.message : "Action failed");
      setPinJob(null);
    }
  }

  async function confirmRefund(items: RefundSaleItem[], reason: string) {
    if (!refundSaleRow) return;
    try {
      await refundSale.mutateAsync({ id: refundSaleRow.id, items, reason });
      toast.success("Refund posted");
      setRefundSaleRow(null);
    } catch (error) {
      if (error instanceof ApiError && PIN_CODES.has(String(error.code))) {
        setPinJob({ kind: "refund", saleId: refundSaleRow.id, items, reason });
        setPinError(error.message);
        return;
      }
      toast.error(error instanceof ApiError ? error.message : "Refund failed");
    }
  }

  async function confirmVoid(sale: PosSale) {
    try {
      await voidSale.mutateAsync({ id: sale.id });
      toast.success("Sale voided");
    } catch (error) {
      if (error instanceof ApiError && PIN_CODES.has(String(error.code))) {
        setPinJob({ kind: "void", saleId: sale.id });
        setPinError(error.message);
        return;
      }
      toast.error(error instanceof ApiError ? error.message : "Void failed");
    }
  }

  if (!session) {
    return (
      <div className="h-full">
        <PosSessionGate
          terminals={terminals}
          pending={openSession.isPending || terminalsLoading}
          onOpen={handleOpen}
          onSetup={() => setSetupOpen(true)}
        />
        <PosSetupSheet
          open={setupOpen}
          onOpenChange={setSetupOpen}
          terminals={terminals}
          warehouses={warehouses}
          rules={rules}
          canManage={canManage}
        />
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col bg-background">
      <PosSessionBar
        terminal={terminal}
        session={session}
        cashierName={me?.name}
        onSales={() => setSalesOpen(true)}
        onSetup={() => setSetupOpen(true)}
        onClose={() => setCloseOpen(true)}
      />
      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        <PosCatalog
          products={filtered}
          loading={productsLoading}
          query={query}
          onQueryChange={setQuery}
          onSubmitQuery={() => void submitQuery()}
          onAdd={addProduct}
          disabled={!canSell}
        />
        <PosCart
          lines={lines}
          rules={rules}
          onQty={(id, qty) => setLines((prev) => prev.map((l) => (l.productId === id ? { ...l, quantity: qty } : l)).filter((l) => l.quantity > 0))}
          onRemove={(id) => setLines((prev) => prev.filter((l) => l.productId !== id))}
          onPickRule={(id) => setDiscountFor(id)}
          onClear={() => setLines([])}
          onCharge={() => setPayOpen(true)}
          charging={createSale.isPending}
          disabled={!canSell}
        />
      </div>

      <PosPayDialog
        open={payOpen}
        total={totals.total}
        pending={createSale.isPending}
        onOpenChange={setPayOpen}
        onConfirm={(payments, cashTendered) => void postSale(payments, cashTendered)}
      />
      <PosPinDialog
        key={pinJob ? `${pinJob.kind}-open` : "pin-idle"}
        open={Boolean(pinJob)}
        error={pinError}
        pending={createSale.isPending || refundSale.isPending || voidSale.isPending}
        onOpenChange={(open) => {
          if (!open) {
            setPinJob(null);
            setPinError(null);
          }
        }}
        onConfirm={(pin) => void runPin(pin)}
      />
      <PosReceiptDialog
        open={Boolean(receipt)}
        receipt={receipt}
        changeDue={changeDue}
        onOpenChange={(open) => {
          if (!open) setReceipt(null);
        }}
        onNewSale={() => setReceipt(null)}
      />
      <PosRefundDialog
        key={refundSaleRow?.id ?? "refund-idle"}
        open={Boolean(refundSaleRow)}
        sale={refundSaleRow}
        pending={refundSale.isPending}
        onOpenChange={(open) => {
          if (!open) setRefundSaleRow(null);
        }}
        onConfirm={(items, reason) => void confirmRefund(items, reason)}
      />
      <PosCloseSessionDialog
        open={closeOpen}
        session={session}
        pending={closeSession.isPending}
        onOpenChange={setCloseOpen}
        onConfirm={async (closingCash) => {
          try {
            const closed = await closeSession.mutateAsync({ id: session.id, closingCash });
            setCloseOpen(false);
            setLines([]);
            const variance = Number(closed.variance ?? 0);
            toast.success("Session closed", {
              description: `Variance ${variance >= 0 ? "+" : ""}${variance.toFixed(2)}`,
            });
          } catch (error) {
            toast.error(error instanceof ApiError ? error.message : "Could not close");
          }
        }}
      />
      <PosSetupSheet
        open={setupOpen}
        onOpenChange={setSetupOpen}
        terminals={terminals}
        warehouses={warehouses}
        rules={rules}
        canManage={canManage}
      />
      <PosSalesSheet
        open={salesOpen}
        sales={sessionSales}
        onOpenChange={setSalesOpen}
        canRefund={canRefund}
        onRefund={async (sale) => {
          const full = await posApi.getSale(sale.id);
          setSalesOpen(false);
          setRefundSaleRow(full);
        }}
        onVoid={(sale) => void confirmVoid(sale)}
      />
      <PosDiscountPicker
        open={Boolean(discountFor)}
        rules={rules}
        onOpenChange={(open) => {
          if (!open) setDiscountFor(null);
        }}
        onSelect={(ruleId) => {
          if (!discountFor) return;
          setLines((prev) =>
            prev.map((l) => (l.productId === discountFor ? { ...l, discountRuleId: ruleId, overrideDiscount: undefined } : l)),
          );
        }}
        onClear={() => {
          if (!discountFor) return;
          setLines((prev) =>
            prev.map((l) => (l.productId === discountFor ? { ...l, discountRuleId: undefined, overrideDiscount: undefined } : l)),
          );
          setDiscountFor(null);
        }}
      />
    </div>
  );
}
