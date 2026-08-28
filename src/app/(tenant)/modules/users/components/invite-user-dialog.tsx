"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { FormDialog } from "@/components/shared/form-dialog";
import { FormField } from "@/components/shared/form-field";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/lib/toast";
import { ApiError } from "@/lib/api/errors";
import { usersApi } from "../api/users.service";
import { usersKeys } from "../query-keys";
import { useUserRoles } from "../hooks/use-users";

const schema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  email: z.string().email("Enter a valid email"),
  role: z.string().min(1, "Choose a role"),
});

type InviteUserDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  seatsFull: boolean;
  seatMessage?: string;
};

export function InviteUserDialog({ open, onOpenChange, seatsFull, seatMessage }: InviteUserDialogProps) {
  const queryClient = useQueryClient();
  const { data: roles = [] } = useUserRoles();
  const invitable = roles.filter((role) => role.invitable);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function reset() {
    setName("");
    setEmail("");
    setRole(null);
    setError(null);
  }

  async function onSubmit() {
    if (seatsFull) {
      setError(seatMessage ?? "You've reached your plan's seat limit.");
      return;
    }
    const parsed = schema.safeParse({ name, email, role: role ?? "" });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Invalid input");
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      const created = await usersApi.invite(parsed.data);
      await queryClient.invalidateQueries({ queryKey: usersKeys.all });
      if (created.acceptUrl) {
        try {
          await navigator.clipboard.writeText(created.acceptUrl);
        } catch {
          /* clipboard optional */
        }
        toast.success("Invite created. Accept link copied — share it until email is configured.");
      } else {
        toast.success(`Invite sent to ${created.email}`);
      }
      reset();
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't send invite.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <FormDialog
      open={open}
      onOpenChange={(next) => {
        if (!next) reset();
        onOpenChange(next);
      }}
      title="Invite user"
      description="They'll set their own password from the invite link."
      submitLabel="Send invite"
      submitting={submitting}
      onSubmit={onSubmit}
      size="md"
    >
      <FormField label="Name">
        <Input value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" />
      </FormField>
      <FormField label="Email">
        <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
      </FormField>
      <FormField label="Role">
        <Select value={role} onValueChange={(value) => setRole(value ?? null)}>
          <SelectTrigger>
            <SelectValue placeholder="Select a role" />
          </SelectTrigger>
          <SelectContent>
            {invitable.map((entry) => (
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
