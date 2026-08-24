// Cliente HTTP usado no browser. Toda chamada passa por /api/*, que é o proxy
// autenticado (ver src/app/api/[...path]/route.ts) — o JWT nunca circula no
// JavaScript do cliente.

export class ApiError extends Error {
  status: number;
  details: unknown;

  constructor(message: string, status: number, details?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.details = details;
  }
}

function buildQueryString(params?: object): string {
  if (!params) return "";
  const search = new URLSearchParams();
  Object.entries(params as Record<string, unknown>).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;
    search.set(key, String(value));
  });
  const qs = search.toString();
  return qs ? `?${qs}` : "";
}

function isFormData(body: unknown): body is FormData {
  return typeof FormData !== "undefined" && body instanceof FormData;
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const isForm = isFormData(init.body);
  const response = await fetch(`/api${path}`, {
    ...init,
    headers: isForm
      ? init.headers
      : { "Content-Type": "application/json", ...init.headers },
  });

  if (response.status === 401 && typeof window !== "undefined") {
    const redirect = encodeURIComponent(window.location.pathname);
    window.location.href = `/login?redirect=${redirect}`;
  }

  if (!response.ok) {
    const contentType = response.headers.get("content-type") ?? "";
    const body = contentType.includes("application/json")
      ? await response.json().catch(() => null)
      : null;
    throw new ApiError(
      body?.mensagem ?? `Erro na requisição (${response.status})`,
      response.status,
      body
    );
  }

  if (response.status === 204) return undefined as T;

  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) return undefined as T;
  return response.json();
}

export const http = {
  get<T>(path: string, params?: object) {
    return request<T>(`${path}${buildQueryString(params)}`);
  },
  post<T>(path: string, body?: unknown) {
    return request<T>(path, {
      method: "POST",
      body: isFormData(body) ? body : JSON.stringify(body ?? {}),
    });
  },
  put<T>(path: string, body?: unknown) {
    return request<T>(path, {
      method: "PUT",
      body: isFormData(body) ? body : JSON.stringify(body ?? {}),
    });
  },
  patch<T>(path: string, body?: unknown) {
    return request<T>(path, {
      method: "PATCH",
      body: isFormData(body) ? body : JSON.stringify(body ?? {}),
    });
  },
  delete<T>(path: string) {
    return request<T>(path, { method: "DELETE" });
  },
};
