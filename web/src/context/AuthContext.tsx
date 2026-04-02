import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import { isAuthenticated, saveTokens, clearTokens } from "../lib/auth";
import { api } from "../lib/api";

interface AuthContextValue {
  authenticated: boolean;
  login: (adminToken: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [authenticated, setAuthenticated] = useState(isAuthenticated);

  const login = useCallback(async (adminToken: string) => {
    const res = await api.loginWithToken(adminToken);
    saveTokens(res.access_token, res.refresh_token);
    setAuthenticated(true);
  }, []);

  const logout = useCallback(() => {
    clearTokens();
    setAuthenticated(false);
  }, []);

  return (
    <AuthContext.Provider value={{ authenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
