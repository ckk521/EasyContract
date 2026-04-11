import { apiClient, ApiError } from "./client";

interface User {
  id: number;
  username: string;
  user_type: string;
  is_active: boolean;
  first_login: boolean;
}

interface LoginRequest {
  username: string;
  password: string;
  remember_me: boolean;
}

interface RegisterRequest {
  username: string;
  password: string;
}

interface AuthResponse {
  success: boolean;
  message: string;
  data?: User;
  token?: {
    access_token: string;
    token_type: string;
    expires_in: number;
  };
}

export const authApi = {
  login: async (data: LoginRequest): Promise<AuthResponse> => {
    try {
      const response = await apiClient.post<AuthResponse>("/api/auth/login", data);
      if (response.success && response.token) {
        localStorage.setItem("token", response.token.access_token);
        localStorage.setItem("remember_me", data.remember_me ? "true" : "false");
      }
      return response;
    } catch (error) {
      if (error instanceof ApiError) {
        throw new Error(error.message);
      }
      throw error;
    }
  },

  register: async (data: RegisterRequest): Promise<AuthResponse> => {
    try {
      return await apiClient.post<AuthResponse>("/api/auth/register", data);
    } catch (error) {
      if (error instanceof ApiError) {
        throw new Error(error.message);
      }
      throw error;
    }
  },

  logout: () => {
    localStorage.removeItem("token");
    localStorage.removeItem("remember_me");
  },

  getToken: (): string | null => {
    return localStorage.getItem("token");
  },

  isLoggedIn: (): boolean => {
    return !!localStorage.getItem("token");
  },
};
