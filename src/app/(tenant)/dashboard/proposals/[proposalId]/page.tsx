"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Ban, FileCheck2, PencilLine, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { PageHeading } from "@/components/shared/page-heading";
import { toast } from "@/lib/toast";
import { fmtDate, fmtDateTime, fmtMoney, fmtQty } from "@/lib/format";
import { proposalDisplayStatus } from "../../../modules/billing/types";
import { proposalsApi } from "../../../modules/billing/api/proposals.service";
import { customersApi } from "../../../modules/crm/api/customers.service";
import { billingKeys } from "../../../modules/billing/query-keys";
import { ProposalStatusBadge } from "../../../modules/billing/components/proposal-status-badge";
import { StatTiles } from "../../../modules/billing/components/stat-tiles";

export default function ProposalDetailPage() {
  const params = useParams<{ proposalId: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data: proposal, isLoading: proposalLoading } = useQuery({
    queryKey: billingKeys.proposal(params.proposalId),
    queryFn: () => proposalsApi.get(params.proposalId),
  });
  const { data: customers = [] } = useQuery({ queryKey: ["customers"], queryFn: customersApi.list });

  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    if (!proposalLoading && !proposal) {
      const timer = setTimeout(() => router.replace("/dashboard/proposals"), 400);
      return () => clearTimeout(timer);
    }
  }, [proposalLoading, proposal, router]);

  if (proposalLoading || !proposal) {
    return (
      <div className="flex h-64 items-center justify-center text-[13px] text-text-4">
        {proposalLoading ? "Loading proposal…" : "Proposal not found — redirecting…"}
      </div>
    );
  }

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: billingKeys.proposal(proposal!.id) });
    queryClient.invalidateQueries({ queryKey: billingKeys.proposals() });
  }

  const status = proposalDisplayStatus(proposal);
  const customer = customers.find((c) => c.id === proposal.customerId);

  const sendProposal = async () => {
    setBusy("send");
    await proposalsApi.send(proposal.id);
    invalidate();
    toast.success(`${proposal.number} sent to ${customer?.name ?? "customer"}`);
    setBusy(null);
  };

  const rejectProposal = async () => {
    setBusy("reject");
    await proposalsApi.reject(proposal.id);
    invalidate();
    toast.success(`${proposal.number} marked rejected`);
    setBusy(null);
    setRejectDialogOpen(false);
  };

  const convertToInvoice = async () => {
    setBusy("convert");
    const invoice = await proposalsApi.convertToInvoice(proposal.id);
    invalidate();
    queryClient.invalidateQueries({ queryKey: billingKeys.invoices() });
    setBusy(null);
    if (invoice) {
      toast.success(`${proposal.number} converted to ${invoice.number}`);
      router.push(`/dashboard/invoices/${invoice.id}`);
    }
  };

  const canEdit = proposal.status === "draft";
  const canSend = proposal.status === "draft";
  const canReject = status === "sent";
  const canConvert = status === "sent" && !proposal.convertedInvoiceId;

  return (
    <div>
      <PageHeading
        title={proposal.number}
        subtitle={`Issued ${fmtDate(proposal.date)} · Expires ${fmtDate(proposal.expiryDate)}`}
        actions={
          <>
            <Button variant="outline" size="sm" onClick={() => router.push("/dashboard/proposals")}>
              <ArrowLeft /> Back
            </Button>
            {canEdit && (
              <Link href={`/dashboard/proposals/new?edit=${proposal.id}`}>
                <Button variant="outline" size="sm">
                  <PencilLine /> Edit
                </Button>
              </Link>
            )}
            {canSend && (
              <Button size="sm" onClick={sendProposal} disabled={busy !== null}>
                <Send /> {busy === "send" ? "Sending..." : "Send Proposal"}
              </Button>
            )}
            {canConvert && (
              <Button size="sm" onClick={convertToInvoice} disabled={busy !== null}>
                <FileCheck2 /> {busy === "convert" ? "Converting..." : "Convert to Invoice"}
              </Button>
            )}
            {canReject && (
              <Button variant="ghost" size="sm" className="text-red" onClick={() => setRejectDialogOpen(true)} disabled={busy !== null}>
                <Ban /> Reject
              </Button>
            )}
          </>
        }
      />

      <div className="mb-4 flex items-center gap-2">
        <ProposalStatusBadge status={status} />
        {proposal.convertedInvoiceId && (
          <Link href={`/dashboard/invoices/${proposal.convertedInvoiceId}`} className="text-[11.5px] text-blue hover:underline">
            View converted invoice →
          </Link>
        )}
      </div>

      <StatTiles
        tiles={[
          { label: "Total", value: fmtMoney(proposal.total, proposal.currency), tone: "blue" },
          { label: "Subtotal", value: fmtMoney(proposal.subtotal, proposal.currency), tone: "neutral" },
          { label: "VAT", value: fmtMoney(proposal.tax, proposal.currency), tone: "neutral" },
          {
            label: "Expires",
            value: fmtDate(proposal.expiryDate),
            tone: status === "expired" ? "red" : "amber",
          },
        ]}
      />

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card className="gap-0 p-0">
            <div className="border-b border-border px-5 py-3 text-sm font-bold text-text">Bill To</div>
            <div className="px-5 py-4">
              <div className="font-semibold text-text">{customer?.name ?? "—"}</div>
              <div className="text-[12px] text-text-3">{customer?.email}</div>
              <div className="text-[12px] text-text-3">{customer?.address}</div>
            </div>

            <div className="overflow-x-auto border-t border-border">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-surface-subtle text-[10px] font-bold text-text-4">
                    <th className="px-5 py-2 text-left">Description</th>
                    <th className="px-3 py-2 text-center">Qty</th>
                    <th className="px-3 py-2 text-right">Unit Price</th>
                    <th className="px-5 py-2 text-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {proposal.lines.map((line) => (
                    <tr key={line.id} className="border-b border-border">
                      <td className="px-5 py-2.5 text-text">{line.description}</td>
                      <td className="px-3 py-2.5 text-center text-text-2">{fmtQty(line.quantity)}</td>
                      <td className="px-3 py-2.5 text-right text-text-2">{fmtMoney(line.unitPrice, proposal.currency)}</td>
                      <td className="px-5 py-2.5 text-right font-semibold text-text">{fmtMoney(line.total, proposal.currency)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {proposal.notes && (
              <div className="border-t border-border px-5 py-3 text-[12px] text-text-3">{proposal.notes}</div>
            )}
          </Card>
        </div>

        <Card className="gap-0 p-0">
          <div className="border-b border-border px-5 py-3 text-sm font-bold text-text">History</div>
          <div className="flex flex-col divide-y divide-border">
            <HistoryRow label="Proposal created" when={proposal.createdAt} />
            {proposal.sentAt && <HistoryRow label={`Sent to ${customer?.email ?? "customer"}`} when={proposal.sentAt} />}
            {proposal.respondedAt && (
              <HistoryRow
                label={proposal.status === "rejected" ? "Marked rejected" : "Marked accepted"}
                when={proposal.respondedAt}
              />
            )}
          </div>
        </Card>
      </div>

      <ConfirmDialog
        open={rejectDialogOpen}
        onOpenChange={setRejectDialogOpen}
        title={`Reject ${proposal.number}?`}
        description="This marks the proposal as rejected. It can no longer be sent or converted to an invoice."
        confirmLabel="Reject Proposal"
        destructive
        onConfirm={rejectProposal}
        successMessage={`${proposal.number} rejected`}
      />
    </div>
  );
}

function HistoryRow({ label, when }: { label: string; when: string }) {
  return (
    <div className="flex items-center justify-between gap-3 px-5 py-3">
      <span className="text-[12.5px] text-text-2">{label}</span>
      <span className="text-[11px] text-text-4">{fmtDateTime(when)}</span>
    </div>
  );
}
