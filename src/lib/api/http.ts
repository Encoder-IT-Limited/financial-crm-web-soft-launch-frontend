import axios from "axios";
import { attachCsrfInterceptor, refreshCsrfCookie } from "./csrf";
import { notifyUnauthorized } from "./session";

export const http = axios.create({
  baseURL: "/api/v1",
  withCredentials: true,
});

if (
  process.env.NODE_ENV !== "production" &&
  typeof window !== "undefined"
) {
  const tenantSubdomain = window.location.hostname.split(".")[0];
  http.interceptors.request.use((config) => {
    const isAdminPath = config.url?.startsWith("/admin");
    if (!isAdminPath) {
      config.headers = config.headers ?? {};
      config.headers["x-tenant-subdomain"] = tenantSubdomain;
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
