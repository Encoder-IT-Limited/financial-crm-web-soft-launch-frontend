export const usersKeys = {
  all: ["users"] as const,
  list: () => [...usersKeys.all, "list"] as const,
  roles: () => [...usersKeys.all, "roles"] as const,
  permissionCatalog: () => [...usersKeys.all, "permission-catalog"] as const,
  seats: () => [...usersKeys.all, "seats"] as const,
};
