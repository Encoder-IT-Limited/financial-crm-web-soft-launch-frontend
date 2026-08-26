"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Save, Send, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PageHeading } from "@/components/shared/page-heading";
import { FormField } from "@/components/shared/form-field";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";
import { proposalFormSchema } from "../../../modules/billing/schemas";
import { computeTotals, type Currency, type Proposal } from "../../../modules/billing/types";
import { proposalsApi } from "../../../modules/billing/api/proposals.service";
import { customersApi } from "../../../modules/crm/api/customers.service";
import { billingKeys } from "../../../modules/billing/query-keys";
import { LineItemsEditor, emptyLines, type LineDraft } from "../../../modules/billing/components/line-items-editor";
import { AddCustomerDialog } from "../../../modules/billing/components/add-customer-dialog";
import { InvoiceSummaryCard } from "../../../modules/billing/components/invoice-summary-card";

export default function NewProposalPage() {
  return (
    <Suspense fallback={<div className="h-40 animate-pulse rounded-xl border border-border bg-surface" />}>
      <NewProposalForm />
    </Suspense>
  );
}

function NewProposalForm() {
  const router = useRouter();
  const params = useSearchParams();
  const queryClient = useQueryClient();
  const editId = params.get("edit");

  const { data: customers = [] } = useQuery({ queryKey: ["customers"], queryFn: customersApi.list });
  const { data: nextNumber = "PRO-····" } = useQuery({
    queryKey: billingKeys.proposalNextNumber(),
    queryFn: proposalsApi.getNextNumber,
  });
  const [editing, setEditing] = useState<Proposal | null>(null);

  const [customerId, setCustomerId] = useState("");
  const [currency, setCurrency] = useState<Currency>("AED");
  const [discountPercent, setDiscountPercent] = useState("0");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [expiryDate, setExpiryDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 14);
    return d.toISOString().slice(0, 10);
  });
  const [lines, setLines] = useState<LineDraft[]>(emptyLines);
  const [notes, setNotes] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<"draft" | "send" | null>(null);
  const [showAddCustomer, setShowAddCustomer] = useState(false);

  // Load the proposal being edited (draft only) — /proposals/new?edit=<id>
  useEffect(() => {
    if (!editId) return;
    proposalsApi.get(editId).then((proposal) => {
      if (!proposal || proposal.status !== "draft") {
        toast.error("Only draft proposals can be edited");
        router.replace("/dashboard/proposals");
        return;
      }
      setEditing(proposal);
      setCustomerId(proposal.customerId);
      setCurrency(proposal.currency ?? "AED");
      setDiscountPercent(String(proposal.discountPercent ?? 0));
      setDate(proposal.date);
      setExpiryDate(proposal.expiryDate);
      setLines(
        proposal.lines.map((l) => ({
          id: l.id,
          description: l.description,
          quantity: String(l.quantity),
          unitPrice: String(l.unitPrice),
          taxRate: String(l.taxRate),
        }))
      );
      setNotes(proposal.notes ?? "");
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editId]);

  const discountPct = Math.min(100, Math.max(0, Number(discountPercent) || 0));
  const totals = useMemo(
    () =>
      computeTotals(
        lines.map((l) => ({
          quantity: Number(l.quantity) || 0,
          unitPrice: Number(l.unitPrice) || 0,
          taxRate: Number(l.taxRate) || 0,
        })),
        discountPct
      ),
    [lines, discountPct]
  );

  function validate(): boolean {
    const result = proposalFormSchema.safeParse({
      customerId,
      date,
      expiryDate,
      currency,
      discountPercent,
      lines: lines.map((l) => ({
        description: l.description,
        quantity: l.quantity,
        unitPrice: l.unitPrice,
        taxRate: l.taxRate,
      })),
      notes,
    });
    if (result.success) {
      setErrors({});
      return true;
    }

    const mapped: Record<string, string> = {};
    for (const issue of result.error.issues) {
      const [first, second, field] = issue.path;
      if (first === "lines" && typeof second === "number" && typeof field === "string") {
        const line = lines[second];
        if (line) mapped[`${line.id}-${field}`] = issue.message;
      } else if (first === "lines" && !second) {
        mapped.lines = issue.message;
      } else if (typeof first === "string") {
        mapped[first] = issue.message;
      }
    }
    setErrors(mapped);
    return false;
  }

  function handleSave(mode: "draft" | "send") {
    if (!validate()) {
      toast.error("Please fix the highlighted fields");
      return;
    }
    setSaving(mode);
    const input = {
      customerId,
      date,
      expiryDate,
      currency,
      discountPercent: discountPct,
      lines: lines.map((l) => ({
        description: l.description.trim(),
        quantity: Number(l.quantity),
        unitPrice: Number(l.unitPrice),
        taxRate: Number(l.taxRate),
      })),
      notes: notes.trim() || undefined,
    };

    const action = editing
      ? proposalsApi.update(editing.id, input).then(() => {
          if (mode === "send") return proposalsApi.send(editing.id);
        })
      : proposalsApi.create(input, mode).then((created) => {
          if (mode === "send") router.replace(`/dashboard/proposals/${created.id}`);
        });

    action
      .then(() => {
        queryClient.invalidateQueries({ queryKey: billingKeys.proposals() });
        queryClient.invalidateQueries({ queryKey: billingKeys.proposalNextNumber() });
        toast.success(
          mode === "draft"
            ? editing
              ? "Draft updated"
              : `Draft saved — ${nextNumber}`
            : editing
              ? `${editing.number} sent to customer`
              : "Proposal created and sent"
        );
        if (mode === "draft") router.replace("/dashboard/proposals");
      })
      .catch(() => toast.error("Something went wrong"))
      .finally(() => setSaving(null));
  }

  return (
    <div>
      <PageHeading
        title={editing ? `Edit ${editing.number}` : "New Proposal"}
        subtitle={editing ? "Edits are only possible while the proposal is a draft" : `Next number in sequence: ${nextNumber}`}
        actions={
          <Button variant="outline" size="sm" onClick={() => router.back()}>
            <ArrowLeft /> Back
          </Button>
        }
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="gap-0 p-0 lg:col-span-2">
          <div className="flex items-center justify-between border-b border-border px-5 py-3">
            <div className="text-sm font-bold text-text">Proposal details</div>
            {!editing && <span className="rounded-full bg-surface-subtle px-2.5 py-0.5 text-[10.5px] font-bold text-text-3">{nextNumber}</span>}
          </div>

          <div className="flex flex-col gap-4 p-5">
            <div className="grid gap-3 sm:grid-cols-2">
              <FormField label="Customer" error={errors.customerId}>
                <div className="flex gap-1.5">
                  <Select value={customerId} onValueChange={(v) => { setCustomerId(v ?? ""); setErrors({ ...errors, customerId: "" }); }}>
                    <SelectTrigger className={cn("w-full flex-1", errors.customerId && "border-red")}>
                      <SelectValue placeholder="Select customer" />
                    </SelectTrigger>
                    <SelectContent>
                      {customers.map((customer) => (
                        <SelectItem key={customer.id} value={customer.id}>
                          {customer.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button type="button" variant="outline" size="icon" onClick={() => setShowAddCustomer(true)} aria-label="Add customer">
                    <UserPlus />
                  </Button>
                </div>
              </FormField>

              <FormField label="Currency" error={errors.currency}>
                <Select value={currency} onValueChange={(v) => { setCurrency((v ?? "AED") as Currency); setErrors({ ...errors, currency: "" }); }}>
                  <SelectTrigger className={cn("w-full")}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(["AED", "USD", "EUR", "GBP", "SAR"] as Currency[]).map((code) => (
                      <SelectItem key={code} value={code}>
                        {code}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormField>

              <FormField label="Date" error={errors.date}>
                <Input
                  type="date"
                  value={date}
                  onChange={(e) => {
                    setDate(e.target.value);
                    if (expiryDate < e.target.value) setExpiryDate(e.target.value);
                  }}
                  aria-invalid={!!errors.date}
                  className={cn(errors.date && "border-red")}
                />
              </FormField>

              <FormField label="Expiry date" error={errors.expiryDate}>
                <Input
                  type="date"
                  value={expiryDate}
                  min={date}
                  onChange={(e) => setExpiryDate(e.target.value)}
                  aria-invalid={!!errors.expiryDate}
                  className={cn(errors.expiryDate && "border-red")}
                />
              </FormField>
            </div>

            <div>
              <div className="mb-1.5 text-[11px] font-semibold text-text-2">Line items</div>
              {errors.lines && <p className="mb-1.5 text-[10.5px] text-red">{errors.lines}</p>}
              <LineItemsEditor lines={lines} onChange={setLines} errors={errors} />
            </div>

            <FormField label="Notes (printed on the proposal)" error={errors.notes}>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Terms, validity period, or scope notes for the customer."
                className="w-full rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              />
            </FormField>
          </div>
        </Card>

        <div className="flex flex-col gap-4">
          <InvoiceSummaryCard
            currency={currency}
            totals={totals}
            discountPercent={discountPercent}
            onDiscountPercentChange={(value) => {
              setDiscountPercent(value);
              setErrors({ ...errors, discountPercent: "" });
            }}
            discountError={errors.discountPercent}
          />

          <div className="flex flex-col gap-2">
            <Button variant="secondary" onClick={() => handleSave("draft")} disabled={saving !== null}>
              <Save /> {editing ? "Save Changes" : "Save Draft"}
            </Button>
            <Button onClick={() => handleSave("send")} disabled={saving !== null}>
              <Send /> {editing ? "Send Proposal" : "Create & Send"}
            </Button>
            <Link href="/dashboard/proposals" className="text-center text-[11.5px] text-text-3 underline-offset-2 hover:underline">
              Cancel and go back
            </Link>
          </div>
        </div>
      </div>

      <AddCustomerDialog
        open={showAddCustomer}
        onOpenChange={setShowAddCustomer}
        onCreated={(customer) => setCustomerId(customer.id)}
      />
    </div>
  );
}
