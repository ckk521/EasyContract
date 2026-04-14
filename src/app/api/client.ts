const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8080";

interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  token?: {
    access_token: string;
    token_type: string;
    expires_in: number;
  };
}

interface FetchOptions {
  method?: "GET" | "POST" | "PUT" | "DELETE";
  body?: unknown;
  headers?: Record<string, string>;
}

class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = "ApiError";
  }
}

async function api<T = unknown>(
  endpoint: string,
  options: FetchOptions = {}
): Promise<T> {
  const { method = "GET", body, headers = {} } = options;

  const token = localStorage.getItem("token");

  const config: RequestInit = {
    method,
  };

  // 设置默认 Content-Type 为 application/json，除非 body 是 FormData
  const isFormData = body instanceof FormData;
  if (!isFormData) {
    config.headers = {
      "Content-Type": "application/json",
    };
  }

  if (token) {
    config.headers = {
      ...config.headers,
      Authorization: `Bearer ${token}`,
      ...headers,
    };
  } else if (headers) {
    config.headers = {
      ...config.headers,
      ...headers,
    };
  }

  if (body) {
    config.body = isFormData ? body : JSON.stringify(body);
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, config);

  const data = await response.json();

  if (!response.ok) {
    throw new ApiError(response.status, data.detail || "请求失败");
  }

  return data as T;
}

export const apiClient = {
  get: <T = unknown>(endpoint: string) => api<T>(endpoint, { method: "GET" }),

  post: <T = unknown>(endpoint: string, body: unknown, headers?: Record<string, string>) =>
    api<T>(endpoint, { method: "POST", body, headers }),

  put: <T = unknown>(endpoint: string, body: unknown, headers?: Record<string, string>) =>
    api<T>(endpoint, { method: "PUT", body, headers }),

  patch: <T = unknown>(endpoint: string, body: unknown, headers?: Record<string, string>) =>
    api<T>(endpoint, { method: "PATCH", body, headers }),

  delete: <T = unknown>(endpoint: string) => api<T>(endpoint, { method: "DELETE" }),
};

export { ApiError };
export type { ApiResponse };
