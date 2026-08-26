const STORAGE_KEY = "mrm_tenant_subdomain";

export function readDevTenantSubdomain(): string | null {
  if (typeof window === "undefined") return null;
  const stored = sessionStorage.getItem(STORAGE_KEY);
  if (stored) return stored;
  return process.env.NEXT_PUBLIC_DEV_TENANT_SUBDOMAIN ?? null;
}

export function rememberTenantSubdomain(subdomain?: string) {
  if (typeof window === "undefined") return;
  if (subdomain) sessionStorage.setItem(STORAGE_KEY, subdomain);
  else sessionStorage.removeItem(STORAGE_KEY);
}
