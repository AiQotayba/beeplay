import { toast } from "sonner";
import { createApi, type ApiOptions, type HttpMethod, type ToastType } from "./api-client";
import type { PaginatedResponse } from "@beeplay/types";
import { useAuthStore } from "@/store/auth";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api/v1";

function showToast(message: string, type: ToastType) {
  if (type === "success") toast.success(message);
  else if (type === "error") toast.error(message);
  else if (type === "warning") toast.warning(message);
  else toast.info(message);
}

export const apiClient = createApi({
  baseUrl: API_URL,
  credentials: "include",
  getLang: () => "ar",
  getToken: () => {
    if (typeof window === "undefined") return null;
    return useAuthStore.getState().token;
  },
  showToast,
  onUnauthorized: () => {
    if (typeof window === "undefined") return;
    useAuthStore.getState().logout();
    window.location.href = "/login";
  },
  defaultTimeout: 20000,
});

export type ApiResult<T> = {
  success: boolean;
  message: string;
  data?: T;
  errors?: Record<string, string[]>;
  meta?: PaginatedResponse<T>["meta"];
};

type FetchApiOptions = RequestInit & {
  token?: string;
};

function toFetchResult<T>(response: Record<string, unknown>): ApiResult<T> {
  if (typeof response.success === "boolean") {
    return response as ApiResult<T>;
  }

  return {
    success: !response.isError,
    message: (response.message as string) ?? "",
    data: response.data as T | undefined,
    errors: response.errors as ApiResult<T>["errors"],
    meta: response.meta as ApiResult<T>["meta"],
  };
}

function parseRequestBody(options?: FetchApiOptions): unknown {
  if (!options?.body) return undefined;
  if (typeof options.body === "string") {
    try {
      return JSON.parse(options.body) as unknown;
    } catch {
      return options.body;
    }
  }
  return options.body;
}

async function request<T>(
  path: string,
  options?: FetchApiOptions
): Promise<ApiResult<T>> {
  const method = (options?.method ?? "GET").toUpperCase() as HttpMethod;
  const { token, body: _body, method: _method, headers, ...fetchRest } = options ?? {};

  const requestOptions: ApiOptions = {
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(headers as Record<string, string> | undefined),
    },
    fetchOptions: fetchRest,
    showErrorToast: false,
  };

  const data = method === "GET" ? undefined : parseRequestBody(options);
  const response = await apiClient.request<T>(method, path, data, requestOptions);
  return toFetchResult<T>(response as unknown as Record<string, unknown>);
}

export const api = request;

export async function apiUpload<T>(
  path: string,
  formData: FormData,
  options?: { token?: string }
): Promise<ApiResult<T>> {
  const response = await apiClient.request<T>("POST", path, formData, {
    headers: options?.token ? { Authorization: `Bearer ${options.token}` } : {},
    showErrorToast: false,
  });
  return toFetchResult<T>(response as unknown as Record<string, unknown>);
}
