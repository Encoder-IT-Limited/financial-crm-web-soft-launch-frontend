import axios from "axios";
import { attachCsrfInterceptor, refreshCsrfCookie } from "./csrf";
import { notifyUnauthorized } from "./session";
import { readDevTenantSubdomain } from "./tenant-context";

export const http = axios.create({
  baseURL: "/api/v1",
  withCredentials: true,
});

function isDevStyleHost(host: string): boolean {
  if (
    host === "localhost" ||
    host === "127.0.0.1" ||
    host === "0.0.0.0" ||
    host === "[::1]"
  ) {
    return true;
  }
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(host)) return true;
  // Cloudflare / ngrok / localtunnel share hosts
  if (
    host.endsWith(".trycloudflare.com") ||
    host.endsWith(".loca.lt") ||
    host.endsWith(".ngrok-free.dev") ||
    host.endsWith(".ngrok-free.app") ||
    host.endsWith(".ngrok.app") ||
    host.endsWith(".ngrok.io")
  ) {
    return true;
  }
  return false;
}

if (typeof window !== "undefined") {
  http.interceptors.request.use((config) => {
    const host = window.location.hostname;
    const url = config.url ?? "";
    const skipTenantHeader =
      url.startsWith("/admin") ||
      url.startsWith("/auth/signup") ||
      url === "/plans" ||
      url.startsWith("/plans?");

    if (skipTenantHeader) return config;

    let subdomain: string | null = null;
    const devTenant = readDevTenantSubdomain() ?? process.env.NEXT_PUBLIC_DEV_TENANT_SUBDOMAIN ?? "demo";

    if (isDevStyleHost(host)) {
      subdomain = devTenant;
    } else {
      const fromHost = host.split(".")[0];
      if (fromHost && fromHost !== "www" && fromHost !== "admin") subdomain = fromHost;
    }

    if (!subdomain) subdomain = devTenant;

    if (subdomain) {
      config.headers = config.headers ?? {};
      config.headers["x-tenant-subdomain"] = subdomain;
    }
    return config;
  });
}

attachCsrfInterceptor(http);

let retriedOnce = false;

http.interceptors.response.use(
  (response) => response,
  async (error) => {
    const status = error?.response?.status;
    const code = error?.response?.data?.error?.code;

    if (status === 401) {
      notifyUnauthorized();
      return Promise.reject(error);
    }

    if (code === "CSRF_INVALID" && !retriedOnce) {
      retriedOnce = true;
      refreshCsrfCookie();
      try {
        return await http.request(error.config);
      } finally {
        retriedOnce = false;
      }
    }

    return Promise.reject(error);
  }
);
