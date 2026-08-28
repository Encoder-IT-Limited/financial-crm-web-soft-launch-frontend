"use client";

import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { FormDialog } from "@/components/shared/form-dialog";
import { FormField } from "@/components/shared/form-field";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/lib/toast";
import { ApiError } from "@/lib/api/errors";
import { usersApi } from "../api/users.service";
import { usersKeys } from "../query-keys";
import { useUserRoles } from "../hooks/use-users";
import type { TenantUser } from "../types";

type EditUserDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: TenantUser;
};

export function EditUserDialog({ open, onOpenChange, user }: EditUserDialogProps) {
  const queryClient = useQueryClient();
  const { data: roles = [] } = useUserRoles();
  const invitable = roles.filter((role) => role.invitable);
  const [name, setName] = useState(user.name);
  const [role, setRole] = useState(user.role);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setName(user.name);
    setRole(user.role);
    setError(null);
  }, [user]);

  const roleLocked = user.role === "OWNER";

  async function onSubmit() {
    if (!name.trim()) {
      setError("Name is required");
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      await usersApi.update(user.id, {
        name: name.trim(),
        ...(roleLocked ? {} : { role }),
      });
      await queryClient.invalidateQueries({ queryKey: usersKeys.all });
      toast.success("User updated");
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't update user.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={`Edit ${user.name}`}
      submitLabel="Save changes"
      submitting={submitting}
      onSubmit={onSubmit}
      size="md"
    >
      <FormField label="Name">
        <Input value={name} onChange={(e) => setName(e.target.value)} />
      </FormField>
      <FormField label="Role" hint={roleLocked ? "The owner role cannot be changed." : undefined}>
        <Select value={role} onValueChange={(value) => { if (value) setRole(value); }} disabled={roleLocked}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {(roleLocked ? roles : invitable).map((entry) => (
              <SelectItem key={entry.key} value={entry.key}>
                {entry.name ?? entry.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FormField>
      {error && <p className="text-[12px] text-red">{error}</p>}
    </FormDialog>
  );
}
