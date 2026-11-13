export type ProblemDetails = {
  type?: string;
  title?: string;
  status?: number;
  detail?: string;
  instance?: string;
  code?: string;
};

type ApiErrorOptions = {
  status: number;
  code?: string;
  detail?: string;
  instance?: string;
  isRetryable?: boolean;
};

export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly detail: string;
  readonly instance?: string;
  readonly isRetryable: boolean;

  constructor({ status, code, detail, instance, isRetryable }: ApiErrorOptions) {
    const resolvedDetail = detail ?? `Request failed with status ${status}`;
    super(resolvedDetail);
    this.name = "ApiError";
    this.status = status;
    this.code = code ?? "HTTP_ERROR";
    this.detail = resolvedDetail;
    this.instance = instance;
    this.isRetryable = isRetryable ?? status >= 500;
  }

  static network(detail = "Network request failed"): ApiError {
    return new ApiError({
      status: 0,
      code: "NETWORK_ERROR",
      detail,
      isRetryable: true,
    });
  }
}
