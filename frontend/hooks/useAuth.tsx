import * as authService from "@/services/authService";
import { AuthState, AuthTokens, User } from "@/types";
import React, {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";

export interface AuthContextType extends AuthState {
  login: (
    emailOrTokens?: string | Partial<AuthTokens>,
    passwordOrUser?: string | Partial<User>,
  ) => Promise<void>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<AuthTokens | null>;
}

const initialAuthState: AuthState = {
  user: null,
  tokens: null,
  isLoading: true,
  isAuthenticated: false,
  error: null,
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>(initialAuthState);

  const initAuth = async () => {
    try {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));
      const tokens = await authService.getStoredTokens();
      if (tokens) {
        const user = await authService.getStoredUser();
        if (user) {
          setState({
            user,
            tokens,
            isLoading: false,
            isAuthenticated: true,
            error: null,
          });
          return;
        }
      }
      setState({
        user: null,
        tokens: null,
        isLoading: false,
        isAuthenticated: false,
        error: null,
      });
    } catch (err: any) {
      setState({
        user: null,
        tokens: null,
        isLoading: false,
        isAuthenticated: false,
        error: err.message || "Failed to restore authentication session",
      });
    }
  };

  useEffect(() => {
    initAuth();
  }, []);

  const login = async (
    emailOrTokens?: string | Partial<AuthTokens>,
    passwordOrUser?: string | Partial<User>,
  ) => {
    try {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));
      if (typeof emailOrTokens === "string") {
        const password =
          typeof passwordOrUser === "string" ? passwordOrUser : "";
        const { tokens, user } = await authService.loginWithCredentials(
          emailOrTokens,
          password,
        );
        setState({
          user,
          tokens,
          isLoading: false,
          isAuthenticated: true,
          error: null,
        });
      } else {
        let user: User | null;
        let tokens: AuthTokens;

        if (emailOrTokens?.accessToken) {
          const result = await authService.loginWithBackendTokens(
            emailOrTokens.accessToken,
            emailOrTokens.refreshToken || "",
          );
          user = result.user;
          tokens = result.tokens;
        } else {
          tokens = await authService.loginWithGoogle(
            emailOrTokens,
            passwordOrUser as Partial<User>,
          );
          user = await authService.getStoredUser();
        }

        setState({
          user,
          tokens,
          isLoading: false,
          isAuthenticated: true,
          error: null,
        });
      }
    } catch (err: any) {
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: err.message || "Login failed",
      }));
      throw err;
    }
  };

  const handleLogout = async () => {
    try {
      setState((prev) => ({ ...prev, isLoading: true }));
      await authService.logout();
      setState({
        user: null,
        tokens: null,
        isLoading: false,
        isAuthenticated: false,
        error: null,
      });
    } catch (err: any) {
      setState({
        user: null,
        tokens: null,
        isLoading: false,
        isAuthenticated: false,
        error: err.message || "Logout failed",
      });
    }
  };

  const handleRefreshToken = async (): Promise<AuthTokens | null> => {
    if (!state.tokens?.refreshToken) {
      await handleLogout();
      return null;
    }
    try {
      const newTokens = await authService.refreshToken(
        state.tokens.refreshToken,
      );
      setState((prev) => ({
        ...prev,
        tokens: newTokens,
        isAuthenticated: true,
      }));
      return newTokens;
    } catch (err: any) {
      await handleLogout();
      return null;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        ...state,
        login,
        logout: handleLogout,
        refreshToken: handleRefreshToken,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    // Return a safe fallback when used outside AuthProvider (e.g. in tests)
    return {
      user: null,
      isLoading: false,
      isAuthenticated: false,
      tokens: null,
      error: null,
      login: async () => {},
      logout: async () => {},
      refreshToken: async () => null,
    };
  }
  return context;
}
