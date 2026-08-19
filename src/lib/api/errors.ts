export enum ErrorCode {
  UNAUTHORIZED = "UNAUTHORIZED",
  FORBIDDEN = "FORBIDDEN",
  NOT_FOUND = "NOT_FOUND",
  VALIDATION_ERROR = "VALIDATION_ERROR",
  CSRF_INVALID = "CSRF_INVALID",
  RATE_LIMITED = "RATE_LIMITED",
  SERVER_ERROR = "SERVER_ERROR",
  UNKNOWN = "UNKNOWN",
}

export type ApiErrorPayload = {
  code: ErrorCode | string;
  message: string;
  details?: Record<string, unknown>;
  requestId?: string;
};

export class ApiError extends Error {
  code: ErrorCode | string;
  status: number;
  details?: Record<string, unknown>;
  requestId?: string;

  constructor(status: number, payload: ApiErrorPayload) {
    super(payload.message);
    this.name = "ApiError";
    this.status = status;
    this.code = payload.code;
    this.details = payload.details;
    this.requestId = payload.requestId;
  }
}
