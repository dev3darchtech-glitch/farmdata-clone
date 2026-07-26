import { AuthTokens, User } from "@/types";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";
import {
  BACKEND_URL,
  fetchCurrentUserProfile,
  loginBackend,
  setAuthToken,
} from "./apiClient";

export const TOKENS_KEY = "auth_tokens";
export const USER_KEY = "auth_user";
export const GOOGLE_TOKEN_ENDPOINT = "https://oauth2.googleapis.com/token";
export const GOOGLE_USERINFO_ENDPOINT =
  "https://www.googleapis.com/oauth2/v2/userinfo";

export async function setSecureItem(key: string, value: string): Promise<void> {
  if (Platform.OS === "web") {
    if (typeof localStorage !== "undefined") {
      localStorage.setItem(key, value);
    }
  } else {
    await SecureStore.setItemAsync(key, value);
  }
}

export async function getSecureItem(key: string): Promise<string | null> {
  if (Platform.OS === "web") {
    if (typeof localStorage !== "undefined") {
      return localStorage.getItem(key);
    }
    return null;
  }
  return await SecureStore.getItemAsync(key);
}

export async function deleteSecureItem(key: string): Promise<void> {
  if (Platform.OS === "web") {
    if (typeof localStorage !== "undefined") {
      localStorage.removeItem(key);
    }
  } else {
    await SecureStore.deleteItemAsync(key);
  }
}

export function isTokenExpired(
  tokens: AuthTokens | null,
  bufferSeconds = 60,
): boolean {
  if (!tokens || !tokens.issuedAt || typeof tokens.expiresIn !== "number")
    return true;
  const expirationTimestamp =
    tokens.issuedAt + (tokens.expiresIn - bufferSeconds) * 1000;
  return Date.now() >= expirationTimestamp;
}

export async function fetchGoogleUserInfo(accessToken: string): Promise<User> {
  const response = await fetch(GOOGLE_USERINFO_ENDPOINT, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!response.ok) {
    throw new Error(`Failed to fetch user info: ${response.statusText}`);
  }
  const data = await response.json();
  return {
    id: data.id,
    email: data.email,
    name: data.name || data.email,
    photo: data.picture,
    picture: data.picture,
  };
}

export async function refreshToken(
  refreshTokenStr: string,
): Promise<AuthTokens> {
  if (!refreshTokenStr) {
    await logout();
    throw new Error("Refresh token is required");
  }

  const endpoint =
    process.env.EXPO_PUBLIC_AUTH_REFRESH_ENDPOINT ||
    `${BACKEND_URL}/auth/refresh`;

  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken: refreshTokenStr }),
  });

  if (!response.ok) {
    await logout();
    throw new Error("Failed to refresh access token. Session expired.");
  }

  const data = await response.json();
  const accessToken = data.token || data.access_token;
  const nextRefreshToken = data.refreshToken || data.refresh_token;
  if (!accessToken) {
    await logout();
    throw new Error("Failed to refresh access token. Session expired.");
  }

  const updatedTokens: AuthTokens = {
    accessToken,
    refreshToken: nextRefreshToken || refreshTokenStr,
    idToken: data.id_token,
    tokenType: data.token_type || "Bearer",
    expiresIn: data.expiresIn || data.expires_in || 86400,
    issuedAt: Date.now(),
  };

  const storedUser = data.user || (await getStoredUser());
  if (storedUser) {
    await saveAuthData(updatedTokens, storedUser);
  } else {
    await setSecureItem(TOKENS_KEY, JSON.stringify(updatedTokens));
  }

  return updatedTokens;
}

export async function saveAuthData(
  tokens: AuthTokens,
  user: User,
): Promise<void> {
  setAuthToken(tokens.accessToken);
  await setSecureItem(TOKENS_KEY, JSON.stringify(tokens));
  await setSecureItem(USER_KEY, JSON.stringify(user));
}

export async function getStoredTokens(): Promise<AuthTokens | null> {
  const rawTokens = await getSecureItem(TOKENS_KEY);
  if (!rawTokens) return null;
  try {
    const tokens: AuthTokens = JSON.parse(rawTokens);
    if (!tokens || typeof tokens !== "object" || Array.isArray(tokens)) {
      await logout();
      return null;
    }
    if (isTokenExpired(tokens)) {
      if (tokens.refreshToken) {
        return await refreshToken(tokens.refreshToken);
      }
      await logout();
      return null;
    }
    setAuthToken(tokens.accessToken);
    return tokens;
  } catch {
    await logout();
    return null;
  }
}

export async function getStoredUser(): Promise<User | null> {
  const rawUser = await getSecureItem(USER_KEY);
  if (!rawUser) return null;
  try {
    return JSON.parse(rawUser);
  } catch {
    return null;
  }
}

export async function loginWithCredentials(
  email: string,
  password: string,
): Promise<{ user: User; tokens: AuthTokens }> {
  const normalizedEmail = email.trim().toLowerCase();
  if (!normalizedEmail || !password) {
    throw new Error("Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu.");
  }

  const data = await loginBackend(normalizedEmail, password);
  const user: User = {
    id: data.user.id || (data.user as any)._id,
    name: data.user.name || data.user.username || data.user.email || "",
    email: data.user.email,
    username: data.user.username,
    role: data.user.role,
  };
  const tokens: AuthTokens = {
    accessToken: data.token,
    refreshToken: data.refreshToken || data.token,
    tokenType: "Bearer",
    expiresIn: data.expiresIn || 86400,
    issuedAt: Date.now(),
  };

  await saveAuthData(tokens, user);
  return { user, tokens };
}

export async function loginWithGoogle(
  providedTokens?: Partial<AuthTokens>,
  providedUser?: Partial<User>,
): Promise<AuthTokens> {
  if (!providedTokens?.accessToken || !providedUser?.email) {
    throw new Error(
      "Google OAuth phải được khởi tạo từ màn hình đăng nhập trước khi lưu phiên.",
    );
  }

  const user: User = {
    id: providedUser.id || providedUser.username || providedUser.email,
    name: providedUser.name || providedUser.email,
    email: providedUser.email,
    username: providedUser.username,
    role: (providedUser?.role as any) || "farmer",
    photo: providedUser.photo,
    picture: providedUser.picture,
  };

  const tokens: AuthTokens = {
    accessToken: providedTokens.accessToken,
    refreshToken: providedTokens.refreshToken || "",
    idToken: providedTokens?.idToken,
    tokenType: "Bearer",
    expiresIn: providedTokens.expiresIn || 86400,
    issuedAt: providedTokens.issuedAt || Date.now(),
  };

  await saveAuthData(tokens, user);
  return tokens;
}

export async function loginWithBackendTokens(
  accessToken: string,
  refreshToken = "",
): Promise<{ user: User; tokens: AuthTokens }> {
  if (!accessToken) {
    throw new Error("Không nhận được token đăng nhập từ máy chủ.");
  }

  setAuthToken(accessToken);
  const user = await fetchCurrentUserProfile();
  const tokens: AuthTokens = {
    accessToken,
    refreshToken,
    tokenType: "Bearer",
    expiresIn: 86400,
    issuedAt: Date.now(),
  };

  await saveAuthData(tokens, user);
  return { user, tokens };
}

export async function logout(): Promise<void> {
  setAuthToken(null);
  await deleteSecureItem(TOKENS_KEY);
  await deleteSecureItem(USER_KEY);
}
