"use client";

import { useQuery } from "@tanstack/react-query";
import { usersApi } from "../api/users.service";
import { usersKeys } from "../query-keys";

export function useUsers(enabled = true) {
  return useQuery({ queryKey: usersKeys.list(), queryFn: usersApi.list, enabled });
}

export function useUserRoles(enabled = true) {
  return useQuery({ queryKey: usersKeys.roles(), queryFn: usersApi.roles, enabled });
}

export function useUserSeats(enabled = true) {
  return useQuery({ queryKey: usersKeys.seats(), queryFn: usersApi.seats, enabled });
}

export function usePermissionCatalog(enabled = true) {
  return useQuery({ queryKey: usersKeys.permissionCatalog(), queryFn: usersApi.permissionCatalog, enabled });
}
