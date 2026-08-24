import axios from "axios";
import { attachCsrfInterceptor, refreshCsrfCookie } from "./csrf";
import { notifyUnauthorized } from "./session";
import { readDevTenantSubdomain } from "./tenant-context";

export const http = axios.create({
  baseURL: "/api/v1",
  withCredentials: true,
});

if (process.env.NODE_ENV !== "production" && typeof window !== "undefined") {
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
    if (host === "localhost" || host === "127.0.0.1") {
      subdomain = readDevTenantSubdomain();
    } else {
      const fromHost = host.split(".")[0];
      if (fromHost && fromHost !== "www" && fromHost !== "admin") subdomain = fromHost;
    }

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
