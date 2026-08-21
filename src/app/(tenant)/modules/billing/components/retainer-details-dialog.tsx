"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Pause, Play, Wallet, XCircle } from "lucide-react";
import { EntityDetailsDialog } from "@/components/shared/entity-details-dialog";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { fmtDate, fmtMoney } from "@/lib/format";
import { cn } from "@/lib/utils";
import { retainerPercentUsed, retainerUsedAmount } from "../types";
import { customersApi } from "../../crm/api/customers.service";
import { invoiceApi } from "../api/invoices.service";
import { retainersApi } from "../api/retainers.service";
import { RetainerStatusBadge } from "./retainer-status-badge";
import { RetainerUsageDialog } from "./retainer-usage-dialog";

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
  const { data: retainers = [] } = useQuery({ queryKey: ["retainers"], queryFn: retainersApi.list });
  const { data: customers = [] } = useQuery({ queryKey: ["customers"], queryFn: customersApi.list });
  const { data: invoices = [] } = useQuery({ queryKey: ["invoices"], queryFn: invoiceApi.list });
  const retainer = retainers.find((r) => r.id === retainerId);

  const [usageOpen, setUsageOpen] = useState(false);
  const [closeOpen, setCloseOpen] = useState(false);

  if (!retainer) return null;

  const customer = customers.find((c) => c.id === retainer.customerId);
  const fundingInvoice = retainer.fundingInvoiceId ? invoices.find((inv) => inv.id === retainer.fundingInvoiceId) : undefined;
  const used = retainerUsedAmount(retainer);
  const percentUsed = retainerPercentUsed(retainer);

  async function toggleStatus() {
    await retainersApi.setStatus(retainer!.id, retainer!.status === "active" ? "paused" : "active");
    queryClient.invalidateQueries({ queryKey: ["retainers"] });
  }

  return (
    <>
      <EntityDetailsDialog
        open={open}
        onOpenChange={onOpenChange}
        title={retainer.number}
        subtitle={`${customer?.name ?? "—"} · started ${fmtDate(retainer.startDate)}`}
        statusSlot={<RetainerStatusBadge status={retainer.status} />}
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

          {fundingInvoice && (
            <div>
              <div className="text-[10.5px] font-bold uppercase tracking-wide text-text-4">Funding Invoice</div>
              <Link href={`/dashboard/invoices/${fundingInvoice.id}`} className="mt-0.5 text-[13px] text-blue hover:underline">
                {fundingInvoice.number}
              </Link>
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
              {retainer.remainingBalance > 0 && (
                <Button variant="outline" size="sm" onClick={() => setUsageOpen(true)}>
                  <Wallet /> Record Usage
                </Button>
              )}
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
              <Button variant="ghost" size="sm" className="text-red" onClick={() => setCloseOpen(true)}>
                <XCircle /> Close
              </Button>
            </div>
          )}
        </div>
      </EntityDetailsDialog>

      <RetainerUsageDialog open={usageOpen} onOpenChange={setUsageOpen} retainer={retainer} />

      <ConfirmDialog
        open={closeOpen}
        onOpenChange={setCloseOpen}
        title={`Close ${retainer.number}?`}
        description="This marks the retainer as closed. Any remaining balance stays on record but no further usage can be logged."
        confirmLabel="Close retainer"
        destructive
        onConfirm={async () => {
          await retainersApi.setStatus(retainer.id, "closed");
          queryClient.invalidateQueries({ queryKey: ["retainers"] });
        }}
        successMessage={`${retainer.number} closed`}
      />
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
