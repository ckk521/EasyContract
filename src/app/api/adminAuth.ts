import { apiClient, ApiError } from "./client";

interface AdminUser {
  id: number;
  username: string;
  first_login: boolean;
}

interface AdminLoginRequest {
  username: string;
  password: string;
}

interface AdminLoginResponse {
  success: boolean;
  message: string;
  data?: AdminUser;
  token?: {
    access_token: string;
    token_type: string;
    expires_in: number;
  };
}

export const adminAuthApi = {
  login: async (data: AdminLoginRequest): Promise<AdminLoginResponse> => {
    try {
      const response = await apiClient.post<AdminLoginResponse>("/api/admin/login", data);
      if (response.success && response.token) {
        localStorage.setItem("b_token", response.token.access_token);
        localStorage.setItem("b_user", JSON.stringify(response.data));
      }
      return response;
    } catch (error) {
      if (error instanceof ApiError) {
        throw new Error(error.message);
      }
      throw error;
    }
  },

  changePassword: async (data: {
    current_password: string;
    new_password: string;
    confirm_password: string;
  }): Promise<{ success: boolean; message: string }> => {
    try {
      const response = await apiClient.post<{ success: boolean; message: string }>(
        "/api/admin/change-password",
        data
      );
      return response;
    } catch (error) {
      if (error instanceof ApiError) {
        throw new Error(error.message);
      }
      throw error;
    }
  },

  logout: () => {
    localStorage.removeItem("b_token");
    localStorage.removeItem("b_user");
  },

  getToken: (): string | null => {
    return localStorage.getItem("b_token");
  },

  isLoggedIn: (): boolean => {
    return !!localStorage.getItem("b_token");
  },

  getCurrentUser: (): AdminUser | null => {
    const userStr = localStorage.getItem("b_user");
    if (userStr) {
      try {
        return JSON.parse(userStr);
      } catch {
        return null;
      }
    }
    return null;
  },
};
