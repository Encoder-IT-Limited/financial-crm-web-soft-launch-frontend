"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
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
import { fmtMoney } from "@/lib/format";
import { toast } from "@/lib/toast";
import {
  useCreatePurchaseInvoice,
  usePurchaseInvoices,
  usePurchaseOrders,
  useRecordSupplierPayment,
  useSuppliers,
} from "../hooks/use-procurement";

const statusTone: Record<string, "amber" | "green" | "blue" | "neutral" | "red"> = {
  UNPAID: "amber",
  PARTIALLY_PAID: "blue",
  PAID: "green",
  CANCELLED: "neutral",
};

export function BillsPage() {
  const { data: bills = [], isLoading } = usePurchaseInvoices();
  const { data: suppliers = [] } = useSuppliers();
  const { data: orders = [] } = usePurchaseOrders();
  const createBill = useCreatePurchaseInvoice();
  const payBill = useRecordSupplierPayment();

  const [createOpen, setCreateOpen] = useState(false);
  const [payOpen, setPayOpen] = useState(false);
  const [payId, setPayId] = useState("");
  const [supplierId, setSupplierId] = useState("");
  const [purchaseOrderId, setPurchaseOrderId] = useState("");
  const [dueDate, setDueDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [subtotal, setSubtotal] = useState("");
  const [tax, setTax] = useState("0");
  const [amount, setAmount] = useState("");

  const supplierById = useMemo(() => new Map(suppliers.map((s) => [s.id, s])), [suppliers]);
  const approvedPos = useMemo(
    () => orders.filter((o) => o.status === "APPROVED" || o.status === "CLOSED"),
    [orders],
  );

  function resetCreate() {
    setSupplierId("");
    setPurchaseOrderId("");
    setDueDate(new Date().toISOString().slice(0, 10));
    setSubtotal("");
    setTax("0");
  }

  async function handleCreate() {
    const sub = Number(subtotal);
    const taxAmt = Number(tax);
    if (!supplierId || !(sub >= 0) || Number.isNaN(taxAmt)) {
      toast.error("Supplier and subtotal are required");
      return;
    }
    try {
      await createBill.mutateAsync({
        supplierId,
        purchaseOrderId: purchaseOrderId || undefined,
        dueDate,
        subtotal: sub,
        tax: taxAmt,
        discount: 0,
      });
      toast.success("Bill recorded");
      resetCreate();
      setCreateOpen(false);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not create bill");
    }
  }

  async function handlePay() {
    const payAmt = Number(amount);
    if (!payId || !(payAmt > 0)) {
      toast.error("Enter a payment amount");
      return;
    }
    try {
      await payBill.mutateAsync({ id: payId, amount: payAmt, paymentMethod: "BANK" });
      toast.success("Payment recorded");
      setPayOpen(false);
      setAmount("");
      setPayId("");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Payment failed");
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <PageHeading
        title="Bills"
        subtitle="Vendor purchase invoices and supplier payments"
        actions={
          <div className="flex gap-2">
            <Button variant="outline" render={<Link href="/dashboard/vendors" />} nativeButton={false}>
              Vendors
            </Button>
            <Button onClick={() => setCreateOpen(true)}>
              <Plus data-icon="inline-start" />
              New bill
            </Button>
          </div>
        }
      />

      <Card className="p-5">
        {isLoading ? (
          <Skeleton className="h-40 w-full" />
        ) : bills.length === 0 ? (
          <p className="py-10 text-center text-[13px] text-text-3">No vendor bills yet.</p>
        ) : (
          <div className="overflow-x-auto rounded-[10px] border border-border">
            <Table>
              <TableHeader>
                <TableRow className="bg-surface-subtle hover:bg-surface-subtle">
                  <TableHead>Bill #</TableHead>
                  <TableHead>Vendor</TableHead>
                  <TableHead>Due</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="text-right">Balance</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {bills.map((bill) => (
                  <TableRow key={bill.id}>
                    <TableCell className="font-semibold tabular-nums">{bill.invoiceNumber}</TableCell>
                    <TableCell>{supplierById.get(bill.supplierId)?.name ?? bill.supplierId.slice(0, 8)}</TableCell>
                    <TableCell className="tabular-nums text-text-2">{bill.dueDate}</TableCell>
                    <TableCell>
                      <Badge tone={statusTone[bill.status] ?? "neutral"}>{bill.status}</Badge>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">{fmtMoney(bill.total)}</TableCell>
                    <TableCell className="text-right tabular-nums">{fmtMoney(bill.balanceDue)}</TableCell>
                    <TableCell className="text-right">
                      {bill.balanceDue > 0 && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setPayId(bill.id);
                            setAmount(String(bill.balanceDue));
                            setPayOpen(true);
                          }}
                        >
                          Pay
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>

      <FormDialog
        open={createOpen}
        onOpenChange={(next) => {
          if (!next) resetCreate();
          setCreateOpen(next);
        }}
        title="New vendor bill"
        description="Records a purchase invoice. Optionally link an approved PO."
        onSubmit={handleCreate}
        submitLabel="Create bill"
        submitting={createBill.isPending}
      >
        <FormField label="Vendor">
          <Select value={supplierId} onValueChange={(v) => setSupplierId(v ?? "")}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select vendor" />
            </SelectTrigger>
            <SelectContent>
              {suppliers.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormField>
        <FormField label="Purchase order (optional)">
          <Select value={purchaseOrderId} onValueChange={(v) => setPurchaseOrderId(v ?? "")}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="None" />
            </SelectTrigger>
            <SelectContent>
              {approvedPos.map((po) => (
                <SelectItem key={po.id} value={po.id}>
                  {po.poNumber} · {fmtMoney(po.total)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormField>
        <FormField label="Due date">
          <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="h-9" />
        </FormField>
        <FormField label="Subtotal">
          <Input type="number" min={0} step="any" value={subtotal} onChange={(e) => setSubtotal(e.target.value)} className="h-9" />
        </FormField>
        <FormField label="Tax">
          <Input type="number" min={0} step="any" value={tax} onChange={(e) => setTax(e.target.value)} className="h-9" />
        </FormField>
      </FormDialog>

      <FormDialog
        open={payOpen}
        onOpenChange={setPayOpen}
        title="Record supplier payment"
        onSubmit={handlePay}
        submitLabel="Record payment"
        submitting={payBill.isPending}
      >
        <FormField label="Amount">
          <Input type="number" min={0.01} step="any" value={amount} onChange={(e) => setAmount(e.target.value)} className="h-9" />
        </FormField>
      </FormDialog>
    </div>
  );
}
