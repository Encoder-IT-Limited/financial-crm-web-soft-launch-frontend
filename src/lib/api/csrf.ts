import type { AxiosInstance } from "axios";

const CSRF_COOKIE = "csrf";
const CSRF_HEADER = "x-csrf-token";

function readCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

let bootstrapPromise: Promise<void> | null = null;

/** Lazily fetches the CSRF cookie on first mutation if it isn't set yet. */
async function ensureCsrfCookie(http: AxiosInstance) {
  if (readCookie(CSRF_COOKIE)) return;
  if (!bootstrapPromise) {
    bootstrapPromise = http
      .get("/auth/csrf")
      .then(() => undefined)
      .finally(() => {
        bootstrapPromise = null;
      });
  }
  await bootstrapPromise;
}

const MUTATING_METHODS = new Set(["post", "put", "patch", "delete"]);

export function attachCsrfInterceptor(http: AxiosInstance) {
  http.interceptors.request.use(async (config) => {
    const method = config.method?.toLowerCase();
    if (method && MUTATING_METHODS.has(method)) {
      await ensureCsrfCookie(http);
      const token = readCookie(CSRF_COOKIE);
      if (token) {
        config.headers = config.headers ?? {};
        config.headers[CSRF_HEADER] = token;
      }
    }
    return config;
  });
}

export function refreshCsrfCookie() {
  bootstrapPromise = null;
}
