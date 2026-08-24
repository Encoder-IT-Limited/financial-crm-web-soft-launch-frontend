"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeftRight, CalendarSync, Pause, Play, RefreshCw, Undo2, XCircle } from "lucide-react";
import { EntityDetailsDialog } from "@/components/shared/entity-details-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { useMe } from "@/hooks/useMe";
import { can } from "@/lib/permissions";
import { fmtDate, fmtMoney } from "@/lib/format";
import { cn } from "@/lib/utils";
import { toast } from "@/lib/toast";
import { retainerDisplayStatus, retainerPercentUsed, retainerUsedAmount } from "../types";
import { useCustomers } from "../../crm/hooks/use-customers";
import { useInvoices } from "../hooks/use-invoices";
import { useRetainers } from "../hooks/use-retainers";
import { invoiceApi } from "../api/invoices.service";
import { retainersApi } from "../api/retainers.service";
import { recurringApi } from "../api/recurring.service";
import { billingKeys } from "../query-keys";
import { RetainerStatusBadge } from "./retainer-status-badge";
import { RetainerTransferDialog } from "./retainer-transfer-dialog";
import { RetainerRolloverDialog } from "./retainer-rollover-dialog";
import { RetainerRefundDialog } from "./retainer-refund-dialog";
import { RetainerTopUpSetupDialog } from "./retainer-topup-setup-dialog";

export function RetainerDetailsDialog({
  open,
  onOpenChange,
  retainerId,
  onEdit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  retainerId: string;
  onEdit: () => void;
}) {
  const queryClient = useQueryClient();
  const { data: me } = useMe();
  const { data: retainers = [] } = useRetainers();
  const { data: customers = [] } = useCustomers();
  const { data: invoices = [] } = useInvoices();
  const { data: templates = [] } = useQuery({ queryKey: billingKeys.recurring(), queryFn: recurringApi.list });
  const retainer = retainers.find((r) => r.id === retainerId);

  const [closeOpen, setCloseOpen] = useState(false);
  const [transferOpen, setTransferOpen] = useState(false);
  const [rolloverOpen, setRolloverOpen] = useState(false);
  const [forfeitOpen, setForfeitOpen] = useState(false);
  const [refundOpen, setRefundOpen] = useState(false);
  const [topUpSetupOpen, setTopUpSetupOpen] = useState(false);
  const [generatingTopUp, setGeneratingTopUp] = useState(false);

  if (!retainer) return null;

  const customer = customers.find((c) => c.id === retainer.customerId);
  const fundingInvoice = retainer.fundingInvoiceId ? invoices.find((inv) => inv.id === retainer.fundingInvoiceId) : undefined;
  const used = retainerUsedAmount(retainer);
  const percentUsed = retainerPercentUsed(retainer);
  const displayStatus = retainerDisplayStatus(retainer);
  const canDispose = displayStatus === "active" || displayStatus === "expired";
  const canApprove = can(me, "retainer.approve");
  const transferCandidates = retainers.filter(
    (r) => r.id !== retainer.id && r.customerId === retainer.customerId && retainerDisplayStatus(r) !== "closed"
  );
  const topUpTemplate = templates.find((t) => t.kind === "retainer-topup" && t.retainerId === retainer.id);

  async function toggleStatus() {
    await retainersApi.setStatus(retainer!.id, retainer!.status === "active" ? "paused" : "active");
    queryClient.invalidateQueries({ queryKey: billingKeys.retainers() });
  }

  async function generateTopUpNow() {
    if (!topUpTemplate) return;
    setGeneratingTopUp(true);
    try {
      const invoice = await recurringApi.generate(topUpTemplate.id);
      if (invoice) {
        toast.success(`${invoice.number} generated and applied — balance topped up`);
        queryClient.invalidateQueries({ queryKey: billingKeys.retainers() });
        queryClient.invalidateQueries({ queryKey: ["recurring-templates"] });
        queryClient.invalidateQueries({ queryKey: ["invoices"] });
      } else {
        toast.info(`${topUpTemplate.number} is paused — resume it first`);
      }
    } finally {
      setGeneratingTopUp(false);
    }
  }

  return (
    <>
      <EntityDetailsDialog
        open={open}
        onOpenChange={onOpenChange}
        title={retainer.number}
        subtitle={`${customer?.name ?? "—"} · started ${fmtDate(retainer.startDate)}`}
        statusSlot={<RetainerStatusBadge status={displayStatus} />}
        onEdit={onEdit}
      >
        <div className="flex flex-col gap-4 px-1 py-1">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <Field label="Contract Amount" value={fmtMoney(retainer.contractAmount, retainer.currency)} />
            <Field label="Used" value={fmtMoney(used, retainer.currency)} />
            <Field label="Remaining" value={fmtMoney(retainer.remainingBalance, retainer.currency)} />
          </div>

          <div>
            <div className="mb-1 flex items-center justify-between text-[11px] text-text-3">
              <span>{percentUsed}% used</span>
              <span className="capitalize">{retainer.billingPeriod}</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-surface-subtle">
              <div className={cn("h-full rounded-full", percentUsed >= 100 ? "bg-red" : "bg-blue")} style={{ width: `${percentUsed}%` }} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <Field label="Contract Type" value={retainer.billingModel === "recurring" ? "Recurring" : "One-time"} />
            {retainer.expiryDate && <Field label="Contract Ends" value={fmtDate(retainer.expiryDate)} />}
            {fundingInvoice && (
              <div>
                <div className="text-[10.5px] font-bold uppercase tracking-wide text-text-4">Funding Invoice</div>
                <Link href={`/dashboard/invoices/${fundingInvoice.id}`} className="mt-0.5 text-[13px] text-blue hover:underline">
                  {fundingInvoice.number}
                </Link>
              </div>
            )}
          </div>

          {retainer.status === "closed" && retainer.dispositionReason && (
            <div className="rounded-lg border border-border bg-surface-subtle p-3 text-[12px] text-text-2">
              {retainer.dispositionReason === "transferred" && "Balance transferred to another retainer."}
              {retainer.dispositionReason === "rolled-over" && "Rolled over into a new contract."}
              {retainer.dispositionReason === "forfeited" && "Remaining balance forfeited."}
              {retainer.dispositionReason === "refunded" && "Remaining balance refunded to the customer."}
              {retainer.dispositionReason === "refunded" && retainer.refundAdjustmentId && (
                <span> Reference: {retainer.refundAdjustmentId}</span>
              )}
            </div>
          )}

          {retainer.billingModel === "recurring" && displayStatus !== "closed" && (
            <div className="rounded-lg border border-border p-3">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-[11px] font-semibold text-text-2">Recurring top-up</span>
                {topUpTemplate && (
                  <Badge tone={topUpTemplate.status === "active" ? "green" : "neutral"}>
                    {topUpTemplate.status === "active" ? "Active" : "Paused"}
                  </Badge>
                )}
              </div>
              {topUpTemplate ? (
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-[11.5px] text-text-3">Next: {fmtDate(topUpTemplate.nextInvoiceDate)}</span>
                  <Button
                    variant="outline"
                    size="xs"
                    disabled={topUpTemplate.status !== "active" || generatingTopUp}
                    onClick={generateTopUpNow}
                  >
                    <RefreshCw /> {generatingTopUp ? "Generating..." : "Generate Top-Up Now"}
                  </Button>
                </div>
              ) : (
                <Button variant="outline" size="xs" onClick={() => setTopUpSetupOpen(true)}>
                  <CalendarSync /> Set up recurring top-up
                </Button>
              )}
            </div>
          )}

          {retainer.notes && <Field label="Notes" value={retainer.notes} />}

          <div>
            <div className="mb-1.5 text-[11px] font-semibold text-text-2">Usage history</div>
            {retainer.usage.length === 0 ? (
              <div className="rounded-lg border border-dashed border-border py-6 text-center text-[12px] text-text-4">
                No usage recorded yet.
              </div>
            ) : (
              <div className="flex flex-col divide-y divide-border rounded-lg border border-border">
                {[...retainer.usage].reverse().map((entry) => (
                  <div key={entry.id} className="flex items-start justify-between gap-3 px-3 py-2.5">
                    <div>
                      <div className="text-[12.5px] font-semibold text-text">{fmtMoney(entry.amount, retainer.currency)}</div>
                      {entry.note && <div className="text-[11px] text-text-3">{entry.note}</div>}
                    </div>
                    <span className="shrink-0 text-[11px] text-text-4">{fmtDate(entry.date)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {retainer.status !== "closed" && (
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" onClick={toggleStatus}>
                {retainer.status === "active" ? (
                  <>
                    <Pause /> Pause
                  </>
                ) : (
                  <>
                    <Play /> Resume
                  </>
                )}
              </Button>
              {canDispose && retainer.remainingBalance > 0 && (
                <>
                  <Button variant="outline" size="sm" onClick={() => setTransferOpen(true)}>
                    <ArrowLeftRight /> Transfer
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setRolloverOpen(true)}>
                    <Undo2 /> Roll Over
                  </Button>
                  {canApprove && (
                    <>
                      <Button variant="outline" size="sm" className="text-red" onClick={() => setForfeitOpen(true)}>
                        Forfeit
                      </Button>
                      <Button variant="outline" size="sm" className="text-red" onClick={() => setRefundOpen(true)}>
                        Refund
                      </Button>
                    </>
                  )}
                </>
              )}
              <Button variant="ghost" size="sm" className="text-red" onClick={() => setCloseOpen(true)}>
                <XCircle /> Close
              </Button>
            </div>
          )}
          {canDispose && retainer.remainingBalance > 0 && !canApprove && (
            <p className="text-[10.5px] text-text-4">Forfeit and Refund require approval — contact an account Owner/Admin.</p>
          )}
        </div>
      </EntityDetailsDialog>

      <ConfirmDialog
        open={closeOpen}
        onOpenChange={setCloseOpen}
        title={`Close ${retainer.number}?`}
        description="This marks the retainer as closed. Any remaining balance stays on record but no further usage can be logged."
        confirmLabel="Close retainer"
        destructive
        onConfirm={async () => {
          await retainersApi.setStatus(retainer.id, "closed");
          queryClient.invalidateQueries({ queryKey: billingKeys.retainers() });
        }}
        successMessage={`${retainer.number} closed`}
      />

      <RetainerTransferDialog open={transferOpen} onOpenChange={setTransferOpen} retainer={retainer} candidates={transferCandidates} />
      <RetainerRolloverDialog open={rolloverOpen} onOpenChange={setRolloverOpen} retainer={retainer} />
      <RetainerTopUpSetupDialog open={topUpSetupOpen} onOpenChange={setTopUpSetupOpen} retainer={retainer} />

      {canApprove && (
        <>
          <ConfirmDialog
            open={forfeitOpen}
            onOpenChange={setForfeitOpen}
            title={`Forfeit ${retainer.number}?`}
            description={`The remaining balance (${fmtMoney(retainer.remainingBalance, retainer.currency)}) is lost — no invoice or refund is generated. This can't be undone.`}
            confirmLabel="Forfeit balance"
            destructive
            onConfirm={async () => {
              await retainersApi.forfeit(retainer.id);
              queryClient.invalidateQueries({ queryKey: billingKeys.retainers() });
            }}
            successMessage={`${retainer.number} forfeited`}
          />
          <RetainerRefundDialog open={refundOpen} onOpenChange={setRefundOpen} retainer={retainer} />
        </>
      )}
    </>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[10.5px] font-bold uppercase tracking-wide text-text-4">{label}</div>
      <div className="mt-0.5 text-[13px] text-text">{value}</div>
    </div>
  );
}
