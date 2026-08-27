import type { AxiosRequestConfig } from "axios";
import { http } from "./http";
import { ApiError, ErrorCode } from "./errors";

type SuccessEnvelope<T> = { success: true; data: T; meta?: Record<string, unknown> };
type ErrorEnvelope = {
  success: false;
  error: { code: string; message: string; details?: Record<string, unknown>; requestId?: string };
};
type Envelope<T> = SuccessEnvelope<T> | ErrorEnvelope;

export type Page<T> = {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  meta: Record<string, unknown>;
};

function unwrap<T>(envelope: Envelope<T>): T {
  if (envelope.success) return envelope.data;
  throw new ApiError(200, envelope.error);
}

function toApiError(error: unknown): ApiError {
  if (error instanceof ApiError) return error;
  const err = error as { response?: { status: number; data?: Envelope<unknown> } };
  if (err.response?.data && !err.response.data.success) {
    return new ApiError(err.response.status, err.response.data.error);
  }
  return new ApiError(err.response?.status ?? 0, {
    code: ErrorCode.UNKNOWN,
    message: "Something went wrong. Please try again.",
  });
}

export async function apiGet<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
  try {
    const res = await http.get<Envelope<T>>(url, config);
    return unwrap(res.data);
  } catch (error) {
    throw toApiError(error);
  }
}

export async function apiGetPage<T>(
  url: string,
  params?: Record<string, unknown>
): Promise<Page<T>> {
  try {
    const res = await http.get<Envelope<T[]>>(url, { params });
    if (!res.data.success) throw new ApiError(200, res.data.error);
    const meta = res.data.meta ?? {};
    return {
      items: res.data.data,
      total: Number(meta.total ?? res.data.data.length),
      page: Number(meta.page ?? 1),
      pageSize: Number(meta.pageSize ?? res.data.data.length),
      meta,
    };
  } catch (error) {
    throw toApiError(error);
  }
}

export async function apiSend<T>(
  method: "post" | "put" | "patch" | "delete",
  url: string,
  body?: unknown,
  config?: AxiosRequestConfig
): Promise<T> {
  try {
    const res = await http.request<Envelope<T>>({ ...config, method, url, data: body });
    return unwrap(res.data);
  } catch (error) {
    throw toApiError(error);
  }
}

export async function apiUpload<T>(url: string, formData: FormData): Promise<T> {
  return apiSend<T>("post", url, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
}
