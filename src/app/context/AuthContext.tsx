import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { authApi } from "~/api/auth";

interface User {
  id: number;
  username: string;
  user_type: string;
  is_active: boolean;
  first_login: boolean;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string, rememberMe: boolean) => Promise<void>;
  register: (username: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user is already logged in
    const token = authApi.getToken();
    if (token) {
      // TODO: Validate token with backend
      setUser({ id: 1, username: "user", user_type: "C", is_active: true, first_login: false });
    }
    setIsLoading(false);
  }, []);

  const login = async (username: string, password: string, rememberMe: boolean) => {
    const response = await authApi.login({ username, password, remember_me: rememberMe });
    if (response.data) {
      setUser(response.data);
    }
  };

  const register = async (username: string, password: string) => {
    await authApi.register({ username, password });
  };

  const logout = () => {
    authApi.logout();
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
