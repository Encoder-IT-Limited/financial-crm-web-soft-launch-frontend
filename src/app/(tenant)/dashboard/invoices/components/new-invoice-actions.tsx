"use client";

import Link from "next/link";
import { Eye, FileText, Save, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

/** The static "drafts stay private" info card + Preview/Save/Send/Cancel
 * action buttons on the New/Edit Invoice page — extracted verbatim;
 * behavior unchanged. */
export function NewInvoiceActions({
  editing,
  total,
  saving,
  editingPaidAmount,
  onPreview,
  onSaveDraft,
  onSend,
}: {
  editing: boolean;
  total: number;
  saving: "draft" | "send" | null;
  editingPaidAmount: number | undefined;
  onPreview: () => void;
  onSaveDraft: () => void;
  onSend: () => void;
}) {
  return (
    <>
      <Card className="gap-0 border-blue-t bg-blue-l p-0">
        <div className="flex items-start gap-3 px-5 py-4">
          <FileText className="mt-0.5 size-4 shrink-0 text-blue" />
          <div className="text-[11.5px] leading-relaxed text-blue/90">
            Drafts stay private and are clearly labelled. Nothing is emailed until you click
            <strong> Create &amp; Send</strong>.
          </div>
        </div>
      </Card>

      <div className="flex flex-col gap-2">
        {!editing && (
          <Button variant="outline" onClick={onPreview} disabled={total <= 0}>
            <Eye /> Preview PDF
          </Button>
        )}
        <Button variant="secondary" onClick={onSaveDraft} disabled={saving !== null}>
          <Save /> {editing ? "Save Changes" : "Save Draft"}
        </Button>
        <Button onClick={onSend} disabled={saving !== null || Boolean(editing && (editingPaidAmount ?? 0) > 0)}>
          <Send /> {editing ? "Send Invoice" : "Create & Send"}
        </Button>
        <Link href="/dashboard/invoices" className="text-center text-[11.5px] text-text-3 underline-offset-2 hover:underline">
          Cancel and go back
        </Link>
      </div>
    </>
  );
}
