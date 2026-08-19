"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { CalendarClock, Pause, PencilLine, Play, Plus, RefreshCw, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { toast } from "@/lib/toast";
import { fmtDate, fmtMoney } from "@/lib/format";
import { useRecurringStore } from "../recurring/store/recurring-store";
import { FREQUENCY_LABELS, type RecurringTemplate } from "../recurring/types";
import { useInvoicesStore } from "../store/invoices-store";
import { RecurringTemplateDialog } from "./recurring-template-dialog";

export function RecurringTemplatesPanel() {
  const templates = useRecurringStore((state) => state.templates);
  const addTemplate = useRecurringStore((state) => state.addTemplate);
  const updateTemplate = useRecurringStore((state) => state.updateTemplate);
  const setTemplateStatus = useRecurringStore((state) => state.setTemplateStatus);
  const removeTemplate = useRecurringStore((state) => state.removeTemplate);
  const generateInvoice = useRecurringStore((state) => state.generateInvoice);
  const customers = useInvoicesStore((state) => state.customers);
  const invoices = useInvoicesStore((state) => state.invoices);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<RecurringTemplate | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<RecurringTemplate | null>(null);

  const customerName = (id: string) => customers.find((c) => c.id === id)?.name ?? "—";
  const lastInvoice = (template: RecurringTemplate) =>
    template.lastInvoiceId ? invoices.find((inv) => inv.id === template.lastInvoiceId) : undefined;

  const next = useMemo(() => {
    return templates.find((t) => t.status === "active")?.nextInvoiceDate;
  }, [templates]);

  function handleGenerate(template: RecurringTemplate) {
    const invoice = generateInvoice(template.id);
    if (invoice) {
      toast.success(`${invoice.number} generated as a draft for review`);
    } else {
      toast.info(`${template.number} is paused — resume it to generate invoices`);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <Card className="gap-0 p-0">
        <div className="flex flex-wrap items-center gap-2 border-b border-border px-5 py-3">
          <div>
            <div className="text-sm font-bold text-text">Recurring templates</div>
            <div className="text-[11px] text-text-4">
              {templates.filter((t) => t.status === "active").length} active
              {next ? ` · next billing ${fmtDate(next)}` : ""}
            </div>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <Button size="sm" onClick={() => { setEditing(null); setDialogOpen(true); }}>
              <Plus /> New Template
            </Button>
          </div>
        </div>

        <div className="flex items-start gap-2.5 border-b border-border bg-surface-subtle px-5 py-2.5 text-[11.5px] text-text-3">
          <CalendarClock className="mt-0.5 size-3.5 shrink-0 text-text-4" />
          <span>
            Each cycle generates an invoice as a <strong>draft for review</strong>{" "}
            <Link href="/dashboard/invoices" className="underline decoration-dotted underline-offset-2">
              in your Invoices tab
            </Link>
            . Send it when ready — auto-sending isn&apos;t enabled yet.
          </span>
        </div>

        {/* Desktop table */}
        <div className="hidden overflow-x-auto lg:block">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-surface-subtle text-left text-[10.5px] font-bold uppercase tracking-wide text-text-3">
                <th className="px-5 py-2.5">Template</th>
                <th className="px-5 py-2.5">Customer</th>
                <th className="px-5 py-2.5">Description</th>
                <th className="px-5 py-2.5 text-right">Amount / Cycle</th>
                <th className="px-5 py-2.5">Frequency</th>
                <th className="px-5 py-2.5">Next billing</th>
                <th className="px-5 py-2.5">Last invoice</th>
                <th className="px-5 py-2.5">Status</th>
                <th className="px-5 py-2.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {templates.map((template) => {
                const last = lastInvoice(template);
                return (
                  <tr key={template.id} className="border-b border-border transition-colors hover:bg-surface-subtle">
                    <td className="px-5 py-3 font-bold text-text">{template.number}</td>
                    <td className="px-5 py-3 text-[13px] text-text">{customerName(template.customerId)}</td>
                    <td className="px-5 py-3 text-[13px] text-text-2">{template.description}</td>
                    <td className="px-5 py-3 text-right text-[13px] font-semibold text-text">
                      {fmtMoney(template.amount, template.currency)}
                    </td>
                    <td className="px-5 py-3 text-[12.5px] text-text-2">{FREQUENCY_LABELS[template.frequency]}</td>
                    <td className="px-5 py-3 text-[12.5px] text-text-2">{fmtDate(template.nextInvoiceDate)}</td>
                    <td className="px-5 py-3 text-[12.5px]">
                      {last ? (
                        <Link href={`/dashboard/invoices/${last.id}`} className="font-semibold text-blue hover:underline">
                          {last.number}
                        </Link>
                      ) : (
                        <span className="text-text-4">—</span>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      <Badge tone={template.status === "active" ? "green" : "neutral"}>
                        {template.status === "active" ? "Active" : "Paused"}
                      </Badge>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          aria-label={`Generate next invoice for ${template.number}`}
                          disabled={template.status !== "active"}
                          onClick={() => handleGenerate(template)}
                        >
                          <RefreshCw />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          aria-label={template.status === "active" ? "Pause" : "Resume"}
                          onClick={() => setTemplateStatus(template.id, template.status === "active" ? "paused" : "active")}
                        >
                          {template.status === "active" ? <Pause /> : <Play />}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          aria-label={`Edit ${template.number}`}
                          onClick={() => { setEditing(template); setDialogOpen(true); }}
                        >
                          <PencilLine />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          aria-label={`Delete ${template.number}`}
                          className="text-red hover:text-red"
                          onClick={() => setDeleteTarget(template)}
                        >
                          <Trash2 />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {templates.length === 0 && (
                <tr>
                  <td colSpan={9} className="h-24 text-center text-[13px] text-text-4">
                    No recurring templates yet — create one to start billing on a schedule.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile stacked cards */}
        <div className="flex flex-col divide-y divide-border lg:hidden">
          {templates.map((template) => {
            const last = lastInvoice(template);
            return (
              <div key={template.id} className="flex flex-col gap-2 p-4">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[13px] font-bold text-text">{template.number}</span>
                  <Badge tone={template.status === "active" ? "green" : "neutral"}>
                    {template.status === "active" ? "Active" : "Paused"}
                  </Badge>
                </div>
                <div className="text-[12.5px] text-text-2">
                  {customerName(template.customerId)} · {template.description}
                </div>
                <div className="flex items-center justify-between text-[12.5px] text-text-4">
                  <span>
                    {FREQUENCY_LABELS[template.frequency]} · next {fmtDate(template.nextInvoiceDate)}
                  </span>
                  <span className="font-bold text-text">{fmtMoney(template.amount, template.currency)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="xs" disabled={template.status !== "active"} onClick={() => handleGenerate(template)}>
                    <RefreshCw /> Generate now
                  </Button>
                  {last && (
                    <Link
                      href={`/dashboard/invoices/${last.id}`}
                      className="text-[11.5px] font-semibold text-blue underline-offset-2 hover:underline"
                    >
                      Last: {last.number}
                    </Link>
                  )}
                  <div className="ml-auto flex gap-1">
                    <Button variant="ghost" size="icon-sm" aria-label="Pause or resume" onClick={() => setTemplateStatus(template.id, template.status === "active" ? "paused" : "active")}>
                      {template.status === "active" ? <Pause /> : <Play />}
                    </Button>
                    <Button variant="ghost" size="icon-sm" aria-label="Delete" className="text-red" onClick={() => setDeleteTarget(template)}>
                      <Trash2 />
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
          {templates.length === 0 && (
            <div className="p-8 text-center text-[13px] text-text-4">
              No recurring templates yet — create one to start billing on a schedule.
            </div>
          )}
        </div>
      </Card>

      {dialogOpen && (
        <RecurringTemplateDialog
          open
          onOpenChange={setDialogOpen}
          editing={editing}
          onSave={(values) => {
            if (editing) updateTemplate(editing.id, values);
            else addTemplate(values);
          }}
        />
      )}
      <ConfirmDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}
        title={`Delete ${deleteTarget?.number}?`}
        description="Future cycles will stop. Existing invoices generated from this template are kept."
        confirmLabel="Delete Template"
        destructive
        onConfirm={() => {
          if (deleteTarget) removeTemplate(deleteTarget.id);
        }}
        successMessage={`${deleteTarget?.number} deleted`}
      />
    </div>
  );
}