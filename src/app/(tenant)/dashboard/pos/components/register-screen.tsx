"use client";

import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeading } from "@/components/shared/page-heading";
import { toast } from "@/lib/toast";
import type { ProductLookupItem } from "../../invoices/mock/product-lookup-seed";
import { computeCartTotals, type CartLine, type PosPayment, type PosSale } from "../types";
import { posTerminalsApi } from "../api/terminals.service";
import { posSessionsApi } from "../api/sessions.service";
import { posSalesApi } from "../api/sales.service";
import { SessionRequiredGate } from "./session-required-gate";
import { OpenSessionDialog } from "./open-session-dialog";
import { CloseSessionDialog } from "./close-session-dialog";
import { ProductSearchPanel } from "./product-search-panel";
import { CartPanel } from "./cart-panel";
import { DiscountDialog } from "./discount-dialog";
import { CustomerPickerInline } from "./customer-picker-inline";
import { PaymentDialog } from "./payment-dialog";
import { ReceiptDialog } from "./receipt-dialog";

/** Remembers which terminal this browser/device belongs to — mirrors how
 * real POS hardware works (the physical station is wired to one
 * terminal; the cashier who's currently on it is a separate, per-shift
 * concern handled by OpenSessionDialog's login step). See
 * POS-Implementation-Plan.md's device-remembered decision. */
const DEVICE_TERMINAL_KEY = "mrm-pos-terminal-id";

const DEMO_VAT_RATE = 5;

/** Orchestrator only — holds cart/session state and wires the pieces
 * below together. No business logic lives here beyond composition. */
export function RegisterScreen() {
  const queryClient = useQueryClient();

  const [terminalId, setTerminalId] = useState<string | undefined>();
  // Read the remembered device→terminal binding in an effect, not during
  // render — localStorage doesn't exist on the server, so reading it during
  // render would cause an SSR/CSR markup mismatch (same pattern as ThemeProvider).
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTerminalId(localStorage.getItem(DEVICE_TERMINAL_KEY) ?? undefined);
  }, []);

  const { data: terminals = [] } = useQuery({ queryKey: ["pos-terminals"], queryFn: () => posTerminalsApi.list() });
  const terminal = terminals.find((t) => t.id === terminalId);

  const { data: session } = useQuery({
    queryKey: ["pos-open-session", terminalId],
    // React Query rejects `undefined` from a queryFn — "no open session" is
    // a real, cacheable result, so it's normalized to `null` here.
    queryFn: () => posSessionsApi.getOpenForTerminal(terminalId!).then((s) => s ?? null),
    enabled: !!terminalId,
  });

  const [cart, setCart] = useState<CartLine[]>([]);
  const [cartDiscount, setCartDiscount] = useState(0);
  const [checkoutManagerPin, setCheckoutManagerPin] = useState<string | undefined>();
  const [customerId, setCustomerId] = useState<string | undefined>();

  const [openSessionOpen, setOpenSessionOpen] = useState(false);
  const [closeSessionOpen, setCloseSessionOpen] = useState(false);
  const [discountOpen, setDiscountOpen] = useState(false);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [checkingOut, setCheckingOut] = useState(false);
  const [completedSale, setCompletedSale] = useState<PosSale | null>(null);

  const totals = computeCartTotals(cart, cartDiscount);

  function addToCart(product: ProductLookupItem) {
    setCart((prev) => {
      const existing = prev.find((l) => l.productId === product.id);
      if (existing) {
        return prev.map((l) => (l.productId === product.id ? { ...l, quantity: l.quantity + 1 } : l));
      }
      return [
        ...prev,
        {
          productId: product.id,
          name: product.name,
          sku: product.sku,
          unitPrice: product.price,
          quantity: 1,
          taxRate: product.taxRate ?? DEMO_VAT_RATE,
        },
      ];
    });
  }

  function resetCart() {
    setCart([]);
    setCartDiscount(0);
    setCheckoutManagerPin(undefined);
    setCustomerId(undefined);
  }

  function handleCheckout(payments: PosPayment[]) {
    if (!terminal || !session) return;
    setCheckingOut(true);
    posSalesApi
      .create({
        terminalId: terminal.id,
        warehouseId: terminal.warehouseId,
        sessionId: session.id,
        createdBy: session.openedBy,
        customerId,
        lines: cart,
        cartDiscount,
        payments,
        managerPin: checkoutManagerPin,
      })
      .then((sale) => {
        toast.success(`${sale.number} completed`);
        queryClient.invalidateQueries({ queryKey: ["pos-products"] });
        queryClient.invalidateQueries({ queryKey: ["pos-sales"] });
        queryClient.invalidateQueries({ queryKey: ["inventory"] });
        resetCart();
        setPaymentOpen(false);
        setCompletedSale(sale);
      })
      .catch((err: unknown) => {
        toast.error(err instanceof Error ? err.message : "Checkout failed");
      })
      .finally(() => setCheckingOut(false));
  }

  return (
    <div className="flex h-[calc(100vh-8rem)] flex-col">
      <PageHeading
        title="Register"
        subtitle={
          terminal && session
            ? `${terminal.name} · ${session.openedBy} · shift started ${new Date(session.openedAt).toLocaleTimeString()}`
            : "Point of Sale"
        }
        actions={
          session && (
            <Button variant="outline" size="sm" onClick={() => setCloseSessionOpen(true)}>
              <LogOut /> End Shift
            </Button>
          )
        }
      />

      {!session ? (
        <SessionRequiredGate onOpenSession={() => setOpenSessionOpen(true)} />
      ) : (
        <div className="grid min-h-0 flex-1 gap-4 lg:grid-cols-[1fr_320px]">
          <ProductSearchPanel warehouseId={terminal!.warehouseId} onAdd={addToCart} />

          <div className="flex min-h-0 flex-col gap-3 rounded-xl border border-border bg-surface p-3">
            <CustomerPickerInline customerId={customerId} onChange={setCustomerId} />
            <CartPanel
              lines={cart}
              totals={totals}
              onQuantityChange={(productId, quantity) => setCart(cart.map((l) => (l.productId === productId ? { ...l, quantity } : l)))}
              onRemove={(productId) => setCart(cart.filter((l) => l.productId !== productId))}
              onDiscount={() => setDiscountOpen(true)}
              onCheckout={() => setPaymentOpen(true)}
              canCheckout={cart.length > 0}
            />
          </div>
        </div>
      )}

      <OpenSessionDialog
        open={openSessionOpen}
        onOpenChange={setOpenSessionOpen}
        defaultTerminalId={terminalId}
        onOpened={(openedTerminalId) => {
          localStorage.setItem(DEVICE_TERMINAL_KEY, openedTerminalId);
          setTerminalId(openedTerminalId);
        }}
      />

      <CloseSessionDialog session={session ?? null} open={closeSessionOpen} onOpenChange={setCloseSessionOpen} onClosed={() => {}} />

      <DiscountDialog
        open={discountOpen}
        onOpenChange={setDiscountOpen}
        subtotal={totals.subtotal}
        onApply={(amount, managerPin) => {
          setCartDiscount(amount);
          setCheckoutManagerPin(managerPin);
        }}
      />

      <PaymentDialog open={paymentOpen} onOpenChange={setPaymentOpen} total={totals.total} onConfirm={handleCheckout} confirming={checkingOut} />

      <ReceiptDialog sale={completedSale} open={!!completedSale} onOpenChange={(open) => !open && setCompletedSale(null)} onNewSale={() => setCompletedSale(null)} />
    </div>
  );
}
