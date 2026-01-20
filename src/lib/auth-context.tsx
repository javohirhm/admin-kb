"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import {
  isAuthenticated as checkAuth,
  clearStoredCredentials,
  setStoredCredentials,
  getStoredCredentials,
} from "./api";

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  apiUrl: string | null;
  login: (apiUrl: string, adminKey: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [apiUrl, setApiUrl] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const authenticated = checkAuth();
    setIsAuthenticated(authenticated);
    if (authenticated) {
      const creds = getStoredCredentials();
      setApiUrl(creds.apiUrl);
    }
    setIsLoading(false);
  }, []);

  const login = useCallback(
    (url: string, adminKey: string) => {
      setStoredCredentials(url, adminKey);
      setIsAuthenticated(true);
      setApiUrl(url);
      router.push("/admin/articles");
    },
    [router]
  );

  const logout = useCallback(() => {
    clearStoredCredentials();
    setIsAuthenticated(false);
    setApiUrl(null);
    router.push("/admin/login");
  }, [router]);

  return (
    <AuthContext.Provider
      value={{ isAuthenticated, isLoading, apiUrl, login, logout }}
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
