const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

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
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
  };

  if (token) {
    config.headers = {
      ...config.headers,
      Authorization: `Bearer ${token}`,
    };
  }

  if (body) {
    config.body = JSON.stringify(body);
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

  post: <T = unknown>(endpoint: string, body: unknown) =>
    api<T>(endpoint, { method: "POST", body }),

  put: <T = unknown>(endpoint: string, body: unknown) =>
    api<T>(endpoint, { method: "PUT", body }),

  delete: <T = unknown>(endpoint: string) => api<T>(endpoint, { method: "DELETE" }),
};

export { ApiError };
export type { ApiResponse };
