"use client";

import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const SIZE_CLASSES = {
  md: "sm:max-w-md",
  lg: "sm:max-w-lg",
  xl: "sm:max-w-xl",
};

/** Generic "edit" modal shell — header, a Cancel/Save footer with a
 * submitting state, and a `children` slot for entity-specific form fields.
 * Pairs with EntityDetailsDialog: every edit modal in the admin portal gets
 * the same chrome, only the fields differ per entity. */
export function FormDialog({
  open,
  onOpenChange,
  title,
  description,
  onSubmit,
  submitLabel = "Save changes",
  submitting = false,
  size = "lg",
  children,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  onSubmit: () => void;
  submitLabel?: string;
  submitting?: boolean;
  size?: "md" | "lg" | "xl";
  children: React.ReactNode;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={cn(SIZE_CLASSES[size])}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>

        <div className="flex flex-col gap-4">{children}</div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="button" onClick={onSubmit} disabled={submitting}>
            {submitting ? "Saving..." : submitLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
