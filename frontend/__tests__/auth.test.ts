import * as authService from "@/services/authService";
import { AuthTokens, User } from "@/types";

// Mock global fetch
const originalFetch = global.fetch;

beforeEach(() => {
  global.fetch = jest.fn();
});

afterEach(() => {
  global.fetch = originalFetch;
});

describe("Auth Service - Milestone 1 Unit Tests", () => {
  const sampleTokens: AuthTokens = {
    accessToken: "test_access_token_123",
    refreshToken: "test_refresh_token_456",
    idToken: "test_id_token_789",
    expiresIn: 3600,
    issuedAt: Date.now(),
    tokenType: "Bearer",
  };

  const sampleUser: User = {
    id: "user_123",
    email: "farmer@example.com",
    name: "Farmer John",
    photo: "https://example.com/photo.jpg",
  };

  test("1. saveAuthData and getStoredTokens/getStoredUser retrieve persisted data", async () => {
    await authService.saveAuthData(sampleTokens, sampleUser);

    const storedTokens = await authService.getStoredTokens();
    const storedUser = await authService.getStoredUser();

    expect(storedTokens).not.toBeNull();
    expect(storedTokens?.accessToken).toBe(sampleTokens.accessToken);
    expect(storedTokens?.refreshToken).toBe(sampleTokens.refreshToken);

    expect(storedUser).not.toBeNull();
    expect(storedUser?.id).toBe(sampleUser.id);
    expect(storedUser?.email).toBe(sampleUser.email);
  });

  test("2. isTokenExpired evaluates expiration with 60s safety buffer", () => {
    const now = Date.now();

    // Token issued just now, valid for 3600 seconds -> Should NOT be expired
    const freshToken: AuthTokens = {
      ...sampleTokens,
      issuedAt: now,
      expiresIn: 3600,
    };
    expect(authService.isTokenExpired(freshToken)).toBe(false);

    // Token issued 3550s ago with 3600s lifetime -> Expiration is now + 50s, but safety buffer is 60s -> Should be expired
    const nearExpiryToken: AuthTokens = {
      ...sampleTokens,
      issuedAt: now - 3550 * 1000,
      expiresIn: 3600,
    };
    expect(authService.isTokenExpired(nearExpiryToken)).toBe(true);

    // Token issued 4000s ago -> Definitely expired
    const expiredToken: AuthTokens = {
      ...sampleTokens,
      issuedAt: now - 4000 * 1000,
      expiresIn: 3600,
    };
    expect(authService.isTokenExpired(expiredToken)).toBe(true);
  });

  test("3. refreshToken exchanges refresh token for fresh access token and updates storage", async () => {
    const newAccessToken = "fresh_access_token_999";
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        access_token: newAccessToken,
        expires_in: 3600,
        token_type: "Bearer",
      }),
    });

    await authService.saveAuthData(sampleTokens, sampleUser);
    const refreshedTokens = await authService.refreshToken(
      sampleTokens.refreshToken,
    );

    expect(refreshedTokens.accessToken).toBe(newAccessToken);
    expect(refreshedTokens.refreshToken).toBe(sampleTokens.refreshToken);
    expect(refreshedTokens.issuedAt).toBeGreaterThan(0);

    const storedTokens = await authService.getStoredTokens();
    expect(storedTokens?.accessToken).toBe(newAccessToken);
  });

  test("4. logout purges secure storage", async () => {
    await authService.saveAuthData(sampleTokens, sampleUser);

    let storedTokens = await authService.getStoredTokens();
    expect(storedTokens).not.toBeNull();

    await authService.logout();

    storedTokens = await authService.getStoredTokens();
    const storedUser = await authService.getStoredUser();

    expect(storedTokens).toBeNull();
    expect(storedUser).toBeNull();
  });
});
