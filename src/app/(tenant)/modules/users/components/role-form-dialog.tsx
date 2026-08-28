"use client";

import { useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { FormDialog } from "@/components/shared/form-dialog";
import { FormField } from "@/components/shared/form-field";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { toast } from "@/lib/toast";
import { ApiError } from "@/lib/api/errors";
import { usersApi } from "../api/users.service";
import { usersKeys } from "../query-keys";
import { usePermissionCatalog } from "../hooks/use-users";
import type { PermissionCatalogGroup, RoleCatalogEntry } from "../types";

type RoleFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  role?: RoleCatalogEntry | null;
};

function expandPermissions(stored: string[], catalog: PermissionCatalogGroup[]): Set<string> {
  const selected = new Set<string>();
  const star = stored.includes("*");
  for (const group of catalog) {
    if (star || stored.includes(group.wildcard)) {
      selected.add(group.wildcard);
      for (const perm of group.permissions) selected.add(perm.key);
      continue;
    }
    for (const perm of group.permissions) {
      if (stored.includes(perm.key)) selected.add(perm.key);
    }
  }
  if (star) selected.add("*");
  return selected;
}

function compactPermissions(selected: Set<string>, catalog: PermissionCatalogGroup[]): string[] {
  if (selected.has("*")) return ["*"];
  const out: string[] = [];
  for (const group of catalog) {
    const keys = group.permissions.map((p) => p.key);
    if (selected.has(group.wildcard) || (keys.length > 0 && keys.every((k) => selected.has(k)))) {
      out.push(group.wildcard);
    } else {
      for (const key of keys) {
        if (selected.has(key)) out.push(key);
      }
    }
  }
  return out;
}

export function RoleFormDialog({ open, onOpenChange, role }: RoleFormDialogProps) {
  const queryClient = useQueryClient();
  const { data: catalog = [] } = usePermissionCatalog(open);
  const readOnly = role?.key === "OWNER";
  const [name, setName] = useState(role?.name ?? "");
  const [description, setDescription] = useState(role?.description ?? "");
  const [countsTowardSeats, setCountsTowardSeats] = useState(role?.countsTowardSeats ?? true);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setName(role?.name ?? "");
    setDescription(role?.description ?? "");
    setCountsTowardSeats(role?.countsTowardSeats ?? true);
    setSelected(expandPermissions(role?.permissions ?? [], catalog));
    setError(null);
  }, [role, catalog, open]);

  const title = role ? (readOnly ? `View ${role.name}` : `Edit ${role.name}`) : "Create role";

  const groupChecked = useMemo(() => {
    return (group: PermissionCatalogGroup) => {
      if (selected.has("*") || selected.has(group.wildcard)) return true;
      return group.permissions.length > 0 && group.permissions.every((p) => selected.has(p.key));
    };
  }, [selected]);

  function toggleGroup(group: PermissionCatalogGroup, checked: boolean) {
    if (readOnly) return;
    setSelected((prev) => {
      const next = new Set(prev);
      next.delete("*");
      if (checked) {
        next.add(group.wildcard);
        for (const perm of group.permissions) next.add(perm.key);
      } else {
        next.delete(group.wildcard);
        for (const perm of group.permissions) next.delete(perm.key);
      }
      return next;
    });
  }

  function toggleKey(group: PermissionCatalogGroup, key: string, checked: boolean) {
    if (readOnly) return;
    setSelected((prev) => {
      const next = new Set(prev);
      next.delete("*");
      next.delete(group.wildcard);
      if (checked) next.add(key);
      else next.delete(key);
      const keys = group.permissions.map((p) => p.key);
      if (keys.length > 0 && keys.every((k) => next.has(k))) next.add(group.wildcard);
      return next;
    });
  }

  async function onSubmit() {
    if (readOnly) {
      onOpenChange(false);
      return;
    }
    if (!name.trim()) {
      setError("Name is required");
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      const permissions = compactPermissions(selected, catalog);
      if (role) {
        await usersApi.updateRole(role.id, {
          name: name.trim(),
          description: description.trim() || null,
          countsTowardSeats,
          permissions,
        });
        toast.success("Role updated");
      } else {
        await usersApi.createRole({
          name: name.trim(),
          description: description.trim() || null,
          countsTowardSeats,
          permissions,
        });
        toast.success("Role created");
      }
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: usersKeys.all }),
        queryClient.invalidateQueries({ queryKey: ["me"] }),
      ]);
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't save role.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      description={readOnly ? "The owner role always has full access." : "Tick the permissions this role should have."}
      submitLabel={readOnly ? "Close" : role ? "Save changes" : "Create role"}
      submitting={submitting}
      onSubmit={onSubmit}
      size="xl"
    >
      <FormField label="Name">
        <Input value={name} onChange={(e) => setName(e.target.value)} disabled={readOnly} />
      </FormField>
      <FormField label="Description">
        <Input
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          disabled={readOnly}
          placeholder="Optional"
        />
      </FormField>
      <label className="flex items-center gap-2.5 text-[12.5px] text-text-2">
        <Checkbox
          checked={countsTowardSeats}
          disabled={readOnly}
          onCheckedChange={(checked) => setCountsTowardSeats(checked === true)}
        />
        <span>Counts toward seats</span>
      </label>

      <div className="space-y-4 pt-1">
        {catalog.map((group) => {
          const allChecked = groupChecked(group);
          return (
            <div key={group.key} className="rounded-lg border border-border p-3">
              <div className="mb-2 flex items-center justify-between gap-3">
                <span className="text-[12px] font-semibold text-text">{group.label}</span>
                <label className="flex items-center gap-2 text-[12px] text-text-2">
                  <Checkbox
                    checked={allChecked}
                    disabled={readOnly}
                    onCheckedChange={(checked) => toggleGroup(group, checked === true)}
                  />
                  All
                </label>
              </div>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {group.permissions.map((perm) => (
                  <label key={perm.key} className="flex items-start gap-2 text-[12.5px] text-text-2">
                    <Checkbox
                      checked={allChecked || selected.has(perm.key)}
                      disabled={readOnly}
                      onCheckedChange={(checked) => toggleKey(group, perm.key, checked === true)}
                    />
                    <Label className="cursor-pointer font-normal leading-snug">{perm.label}</Label>
                  </label>
                ))}
              </div>
            </div>
          );
        })}
      </div>
      {error && <p className="text-[12px] text-red">{error}</p>}
    </FormDialog>
  );
}
