"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarClock, Pause, Pencil, Play, Plus, RefreshCw, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { toast } from "@/lib/toast";
import { fmtDate, fmtMoney } from "@/lib/format";
import { recurringApi } from "../api/recurring.service";
import { FREQUENCY_LABELS, type RecurringTemplate } from "../recurring/types";
import { useCustomers } from "../../crm/hooks/use-customers";
import { billingKeys } from "../query-keys";
import { RecurringTemplateDialog } from "./recurring-template-dialog";

export function RecurringTemplatesPanel() {
  const queryClient = useQueryClient();
  const { data: customers = [] } = useCustomers();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<RecurringTemplate | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<RecurringTemplate | null>(null);
  const [pageIndex, setPageIndex] = useState(0);
  const pageSize = 10;

  const { data: page, isLoading: templatesLoading } = useQuery({
    queryKey: billingKeys.recurringPage(pageIndex + 1, pageSize),
    queryFn: () => recurringApi.listPage({ page: pageIndex + 1, pageSize }),
    placeholderData: (previous) => previous,
  });
  const templates = page?.items ?? [];
  const total = page?.total ?? 0;
  const activeCount = page?.activeCount ?? 0;
  const next = page?.nextInvoiceDate ?? null;
  const pageCount = Math.max(1, Math.ceil(total / pageSize));

  useEffect(() => {
    if (pageIndex > 0 && pageIndex >= pageCount) setPageIndex(pageCount - 1);
  }, [pageIndex, pageCount]);

  const customerName = (id: string) => customers.find((c) => c.id === id)?.name ?? "—";

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: billingKeys.recurring() });
    queryClient.invalidateQueries({ queryKey: billingKeys.invoices() });
    queryClient.invalidateQueries({ queryKey: billingKeys.nextNumber() });
  }

  async function handleGenerate(template: RecurringTemplate) {
    try {
      const invoice = await recurringApi.generate(template.id);
      if (invoice) {
        invalidate();
        toast.success(`${invoice.number} generated as a draft for review`);
      } else {
        toast.message(`${template.number} is paused — resume it to generate invoices`);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Generate failed");
    }
  }

  async function handleToggleStatus(template: RecurringTemplate) {
    try {
      await recurringApi.setStatus(template.id, template.status === "active" ? "paused" : "active");
      invalidate();
      toast.success(template.status === "active" ? "Template paused" : "Template resumed");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not update status");
    }
  }

  async function handleSave(values: Parameters<typeof recurringApi.create>[0]) {
    try {
      if (editing) {
        await recurringApi.update(editing.id, values);
      } else {
        await recurringApi.create(values);
      }
      invalidate();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save template");
      throw err;
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <Card className="gap-0 p-0">
        <div className="flex flex-wrap items-center gap-2 border-b border-border px-5 py-3">
          <div>
            <div className="text-sm font-bold text-text">Recurring templates</div>
            <div className="text-[11px] text-text-4">
              {activeCount} active
              {next ? ` · next billing ${fmtDate(next)}` : ""}
            </div>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <Button
              size="sm"
              onClick={() => {
                setEditing(null);
                setDialogOpen(true);
              }}
            >
              <Plus /> New Template
            </Button>
          </div>
        </div>

        <div className="flex items-start gap-2.5 border-b border-border bg-surface-subtle px-5 py-2.5 text-[11.5px] text-text-3">
          <CalendarClock className="mt-0.5 size-3.5 shrink-0 text-text-4" />
          <span>
            Each cycle generates an invoice
            {templates.some((t) => t.autoSend)
              ? ". Templates with auto-send on email the customer immediately."
              : " as a draft for review"}{" "}
            <Link href="/dashboard/invoices" className="underline decoration-dotted underline-offset-2">
              in your Invoices tab
            </Link>
            .
          </span>
        </div>

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
                <th className="px-5 py-2.5">Auto-send</th>
                <th className="px-5 py-2.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {templates.map((template) => {
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
                      {template.lastInvoiceId ? (
                        <Link href={`/dashboard/invoices/${template.lastInvoiceId}`} className="font-semibold text-blue hover:underline">
                          View
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
                    <td className="px-5 py-3 text-[12.5px] text-text-2">
                      {template.autoSend ? "On" : "Off"}
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
                          onClick={() => handleToggleStatus(template)}
                        >
                          {template.status === "active" ? <Pause /> : <Play />}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          aria-label={`Edit ${template.number}`}
                          onClick={() => {
                            setEditing(template);
                            setDialogOpen(true);
                          }}
                        >
                          <Pencil />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          aria-label={`Delete ${template.number}`}
                          className="text-red"
                          onClick={() => setDeleteTarget(template)}
                        >
                          <Trash2 />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {total === 0 && (
                <tr>
                  <td colSpan={10} className="h-24 text-center text-[13px] text-text-4">
                    {templatesLoading ? "Loading templates…" : "No recurring templates yet — create one to start billing on a schedule."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col divide-y divide-border lg:hidden">
          {templates.map((template) => {
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
                {template.autoSend && <div className="text-[11px] text-text-3">Auto-send on</div>}
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="xs" disabled={template.status !== "active"} onClick={() => handleGenerate(template)}>
                    <RefreshCw /> Generate now
                  </Button>
                  {template.lastInvoiceId && (
                    <Link
                      href={`/dashboard/invoices/${template.lastInvoiceId}`}
                      className="text-[11.5px] font-semibold text-blue underline-offset-2 hover:underline"
                    >
                      Last invoice
                    </Link>
                  )}
                  <div className="ml-auto flex gap-1">
                    <Button variant="ghost" size="icon-sm" aria-label="Pause or resume" onClick={() => handleToggleStatus(template)}>
                      {template.status === "active" ? <Pause /> : <Play />}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label="Edit"
                      onClick={() => {
                        setEditing(template);
                        setDialogOpen(true);
                      }}
                    >
                      <Pencil />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label="Delete"
                      className="text-red"
                      onClick={() => setDeleteTarget(template)}
                    >
                      <Trash2 />
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
          {total === 0 && (
            <div className="p-8 text-center text-[13px] text-text-4">
              {templatesLoading ? "Loading templates…" : "No recurring templates yet — create one to start billing on a schedule."}
            </div>
          )}
        </div>

        {total > pageSize && (
          <div className="flex items-center justify-between border-t border-border px-5 py-2.5 text-[12.5px] text-text-3">
            <span>
              Page {pageIndex + 1} of {pageCount}
            </span>
            <div className="flex gap-2">
              <Button variant="outline" size="xs" disabled={pageIndex === 0} onClick={() => setPageIndex((p) => p - 1)}>
                Prev
              </Button>
              <Button
                variant="outline"
                size="xs"
                disabled={pageIndex + 1 >= pageCount}
                onClick={() => setPageIndex((p) => p + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </Card>

      {dialogOpen && (
        <RecurringTemplateDialog
          open
          onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) setEditing(null);
          }}
          editing={editing}
          onSave={handleSave}
        />
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title={deleteTarget ? `Delete ${deleteTarget.number}?` : "Delete template?"}
        description="This removes the recurring schedule. Past invoices stay in place."
        confirmLabel="Delete"
        destructive
        onConfirm={async () => {
          if (!deleteTarget) return;
          await recurringApi.remove(deleteTarget.id);
          invalidate();
          setDeleteTarget(null);
        }}
        successMessage={deleteTarget ? `${deleteTarget.number} deleted` : "Template deleted"}
      />
    </div>
  );
}
