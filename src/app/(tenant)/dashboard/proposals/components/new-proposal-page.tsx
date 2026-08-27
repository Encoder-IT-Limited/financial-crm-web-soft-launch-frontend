"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeading } from "@/components/shared/page-heading";
import { toast } from "@/lib/toast";
import { ApiError } from "@/lib/api/errors";
import { useTenantCurrency } from "@/lib/use-tenant-currency";
import { proposalFormSchema } from "../../../modules/billing/schemas";
import { computeTotals, type Proposal } from "../../../modules/billing/types";
import { proposalsApi } from "../../../modules/billing/api/proposals.service";
import { customersApi } from "../../../modules/crm/api/customers.service";
import { billingKeys } from "../../../modules/billing/query-keys";
import { emptyLines, type LineDraft } from "../../../modules/billing/components/line-items-editor";
import { AddCustomerDialog } from "../../../modules/billing/components/add-customer-dialog";
import { ProposalDetailsCard } from "./proposal-details-card";
import { ProposalActionsPanel } from "./proposal-actions-panel";

export function NewProposalPage() {
  const router = useRouter();
  const params = useSearchParams();
  const queryClient = useQueryClient();
  const editId = params.get("edit");

  const { data: customers = [] } = useQuery({ queryKey: ["customers"], queryFn: customersApi.list });
  const { data: nextNumber = "PRO-····" } = useQuery({
    queryKey: billingKeys.proposalNextNumber(),
    queryFn: proposalsApi.getNextNumber,
  });
  const tenantCurrency = useTenantCurrency();
  const [editing, setEditing] = useState<Proposal | null>(null);

  const [customerId, setCustomerId] = useState("");
  const [currencyOverride, setCurrencyOverride] = useState<Proposal["currency"] | null>(null);
  const currency = currencyOverride ?? tenantCurrency;
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
      setCurrencyOverride(proposal.currency);
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
          productId: l.productId,
          warehouseId: l.warehouseId,
          mode: l.productId ? "product" : "service",
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
        productId: l.productId,
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
        productId: l.mode === "product" ? l.productId : undefined,
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
      .catch((err) => toast.error(err instanceof ApiError ? err.message : "Something went wrong"))
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
        <ProposalDetailsCard
          nextNumber={nextNumber}
          isEditing={!!editing}
          customers={customers}
          customerId={customerId}
          onCustomerIdChange={(id) => {
            setCustomerId(id);
            setErrors({ ...errors, customerId: "" });
          }}
          onAddCustomer={() => setShowAddCustomer(true)}
          currency={currency}
          onCurrencyChange={(v) => {
            setCurrencyOverride(v);
            setErrors({ ...errors, currency: "" });
          }}
          date={date}
          onDateChange={(value) => {
            setDate(value);
            if (expiryDate < value) setExpiryDate(value);
          }}
          expiryDate={expiryDate}
          onExpiryDateChange={setExpiryDate}
          lines={lines}
          onLinesChange={setLines}
          notes={notes}
          onNotesChange={setNotes}
          errors={errors}
        />

        <ProposalActionsPanel
          currency={currency}
          totals={totals}
          discountPercent={discountPercent}
          onDiscountPercentChange={(value) => {
            setDiscountPercent(value);
            setErrors({ ...errors, discountPercent: "" });
          }}
          discountError={errors.discountPercent}
          isEditing={!!editing}
          saving={saving}
          onSaveDraft={() => handleSave("draft")}
          onSend={() => handleSave("send")}
        />
      </div>

      <AddCustomerDialog
        open={showAddCustomer}
        onOpenChange={setShowAddCustomer}
        onCreated={(customer) => setCustomerId(customer.id)}
      />
    </div>
  );
}
