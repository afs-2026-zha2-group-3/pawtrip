import { ApiError, type ProblemDetails } from "./api-error";

type RequestOptions = {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  headers?: Record<string, string>;
  signal?: AbortSignal;
  timeoutMs?: number;
};

const CSRF_COOKIE = "XSRF-TOKEN";
const CSRF_HEADER = "X-XSRF-TOKEN";
const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

export async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = "GET", body, headers, signal, timeoutMs = 10_000 } = options;
  const formBody = body instanceof URLSearchParams;
  const csrfToken = SAFE_METHODS.has(method) ? undefined : await ensureCsrfToken();

  if (!SAFE_METHODS.has(method) && !csrfToken) {
    throw new ApiError({
      status: 403,
      code: "ACCESS_DENIED",
      detail: "CSRF token unavailable",
      isRetryable: false,
    });
  }

  const controller = new AbortController();
  let timedOut = false;

  const timeoutId = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, timeoutMs);

  const onAbort = () => controller.abort(signal?.reason);
  signal?.addEventListener("abort", onAbort, { once: true });

  try {
    const response = await fetch(path, {
      method,
      credentials: "same-origin",
      headers: {
        Accept: "application/json",
        ...(body === undefined
          ? {}
          : {
              "Content-Type": formBody ? "application/x-www-form-urlencoded" : "application/json",
            }),
        ...(csrfToken ? { [CSRF_HEADER]: csrfToken } : {}),
        ...headers,
      },
      body: body === undefined ? undefined : formBody ? body.toString() : JSON.stringify(body),
      signal: controller.signal,
    });

    if (!response.ok) {
      const problem = await readProblem(response);
      throw new ApiError({
        status: response.status,
        code: problem?.code,
        detail: problem?.detail,
        instance: problem?.instance,
      });
    }

    if (response.status === 204) {
      return undefined as T;
    }

    return (await response.json()) as T;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    if (signal?.aborted && !timedOut) {
      throw error;
    }
    throw ApiError.network(error instanceof Error ? error.message : undefined);
  } finally {
    clearTimeout(timeoutId);
    signal?.removeEventListener("abort", onAbort);
  }
}

async function ensureCsrfToken(): Promise<string | undefined> {
  let token = readCookie(CSRF_COOKIE);
  if (token || typeof window === "undefined") {
    return token;
  }

  try {
    await fetch("/api/auth/me", {
      credentials: "same-origin",
      headers: { Accept: "application/json" },
    });
  } catch {
    return undefined;
  }

  token = readCookie(CSRF_COOKIE);
  return token;
}

function readCookie(name: string): string | undefined {
  if (typeof document === "undefined") {
    return undefined;
  }
  const prefix = `${name}=`;
  const entry = document.cookie.split("; ").find((cookie) => cookie.startsWith(prefix));
  return entry ? decodeURIComponent(entry.slice(prefix.length)) : undefined;
}

async function readProblem(response: Response): Promise<ProblemDetails | null> {
  const text = await response.text();
  if (!text) {
    return null;
  }
  try {
    return JSON.parse(text) as ProblemDetails;
  } catch {
    return null;
  }
}
