const DEFAULT_TIMEOUT_MS = 10000;

type ApiRequestOptions = Omit<RequestInit, "body" | "signal"> & {
  body?: unknown;
  timeoutMs?: number;
  signal?: AbortSignal;
};

function buildSignal(parentSignal: AbortSignal | undefined, timeoutMs: number | undefined) {
  const controller = new AbortController();

  if (parentSignal) {
    if (parentSignal.aborted) {
      controller.abort(parentSignal.reason);
    } else {
      parentSignal.addEventListener(
        "abort",
        () => controller.abort(parentSignal.reason),
        { once: true }
      );
    }
  }

  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  if (timeoutMs && Number.isFinite(timeoutMs)) {
    timeoutId = setTimeout(() => {
      controller.abort(new DOMException("Request timed out", "TimeoutError"));
    }, timeoutMs);
  }

  return {
    signal: controller.signal,
    cleanup: () => {
      if (timeoutId) clearTimeout(timeoutId);
    },
  };
}

export async function apiFetch(
  input: RequestInfo,
  { body, headers, timeoutMs = DEFAULT_TIMEOUT_MS, signal, method, ...rest }: ApiRequestOptions = {}
): Promise<Response> {
  const { signal: composedSignal, cleanup } = buildSignal(signal, timeoutMs);

  try {
    const finalHeaders = new Headers(headers);
    if (!finalHeaders.has("Accept")) {
      finalHeaders.set("Accept", "application/json");
    }
    let finalBody: BodyInit | undefined;
    if (body !== undefined) {
      if (!finalHeaders.has("Content-Type")) {
        finalHeaders.set("Content-Type", "application/json");
      }
      finalBody = typeof body === "string" ? (body as BodyInit) : JSON.stringify(body);
    }

    return await fetch(input, {
      ...rest,
      method: method ?? (body !== undefined ? "POST" : "GET"),
      headers: finalHeaders,
      body: finalBody,
      signal: composedSignal,
    });
  } finally {
    cleanup();
  }
}

export async function getJson<T>(input: RequestInfo, options?: ApiRequestOptions): Promise<T> {
  const response = await apiFetch(input, { ...options, method: options?.method ?? "GET" });
  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }
  return (await response.json()) as T;
}

export async function postJson<T = void>(
  input: RequestInfo,
  body?: unknown,
  options?: ApiRequestOptions
): Promise<T | undefined> {
  const response = await apiFetch(input, { ...options, method: options?.method ?? "POST", body });
  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }

  if (response.status === 204) {
    return undefined;
  }

  const contentType = response.headers.get("Content-Type") ?? "";
  if (!contentType.includes("application/json")) {
    return undefined;
  }

  return (await response.json()) as T;
}
