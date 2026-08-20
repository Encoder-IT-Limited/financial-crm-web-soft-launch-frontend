"use client";

import { Pencil, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

/** Generic "view details" modal shell — header (title + optional status
 * slot + Edit/Delete actions) and a scrollable content area. Entity-specific
 * pages (Tenants, and later Plans/Payments) supply their own content as
 * `children`; this only owns the chrome so every details modal in the admin
 * portal looks and behaves the same way. */
export function EntityDetailsDialog({
  open,
  onOpenChange,
  title,
  subtitle,
  statusSlot,
  onEdit,
  onDelete,
  children,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  subtitle?: string;
  statusSlot?: React.ReactNode;
  onEdit?: () => void;
  onDelete?: () => void;
  children: React.ReactNode;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader className="-mx-5 -mt-5 border-b border-border/60 px-5 pt-5 pb-4">
          <DialogTitle className="flex items-center gap-2 text-lg">
            {title}
            {statusSlot}
          </DialogTitle>
          {subtitle && <DialogDescription className="mt-0.5">{subtitle}</DialogDescription>}
        </DialogHeader>

        <div className="max-h-[60vh] overflow-y-auto">{children}</div>

        {(onEdit || onDelete) && (
          <DialogFooter className="sm:justify-between">
            {onDelete ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-red hover:bg-red-l hover:text-red"
                onClick={onDelete}
              >
                <Trash2 /> Delete
              </Button>
            ) : (
              <span />
            )}
            {onEdit && (
              <Button type="button" variant="outline" size="sm" onClick={onEdit}>
                <Pencil /> Edit
              </Button>
            )}
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
