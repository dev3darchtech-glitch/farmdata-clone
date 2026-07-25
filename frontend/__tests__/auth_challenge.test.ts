import * as authService from "@/services/authService";
import {
  getSecureItem,
  setSecureItem,
  TOKENS_KEY,
  USER_KEY,
} from "@/services/authService";
import { AuthTokens, User } from "@/types";

const originalFetch = global.fetch;

beforeEach(async () => {
  global.fetch = jest.fn();
  await authService.logout();
});

afterEach(() => {
  global.fetch = originalFetch;
});

describe("Milestone 1 Challenger Empirical Suite", () => {
  const sampleTokens: AuthTokens = {
    accessToken: "valid_access_token",
    refreshToken: "valid_refresh_token",
    idToken: "valid_id_token",
    expiresIn: 3600,
    issuedAt: Date.now(),
    tokenType: "Bearer",
  };

  const sampleUser: User = {
    id: "user_999",
    email: "test@farm.org",
    name: "Test Farmer",
  };

  describe("1. Expiration Calculation Boundary Tests (60s buffer)", () => {
    test("Boundary: Exactly 60.000s remaining before expiry evaluates as EXPIRED", () => {
      const now = 1000000;
      const jestNow = jest.spyOn(Date, "now").mockReturnValue(now);

      // issuedAt = now - (3600 - 60) * 1000 = now - 3540 * 1000 = 1000000 - 3540000 = -2540000
      // expirationTimestamp = issuedAt + (3600 - 60) * 1000 = -2540000 + 3540000 = 1000000 = now
      const tokens: AuthTokens = {
        ...sampleTokens,
        issuedAt: now - 3540 * 1000,
        expiresIn: 3600,
      };

      expect(authService.isTokenExpired(tokens)).toBe(true);
      jestNow.mockRestore();
    });

    test("Boundary: Exactly 60.001s remaining before expiry evaluates as NOT EXPIRED", () => {
      const now = 1000000;
      const jestNow = jest.spyOn(Date, "now").mockReturnValue(now);

      // issued 3539.999s ago -> 60.001s remaining
      const tokens: AuthTokens = {
        ...sampleTokens,
        issuedAt: now - 3539999,
        expiresIn: 3600,
      };

      expect(authService.isTokenExpired(tokens)).toBe(false);
      jestNow.mockRestore();
    });

    test("Boundary: Exactly 59.999s remaining before expiry evaluates as EXPIRED", () => {
      const now = 1000000;
      const jestNow = jest.spyOn(Date, "now").mockReturnValue(now);

      // issued 3540.001s ago -> 59.999s remaining
      const tokens: AuthTokens = {
        ...sampleTokens,
        issuedAt: now - 3540001,
        expiresIn: 3600,
      };

      expect(authService.isTokenExpired(tokens)).toBe(true);
      jestNow.mockRestore();
    });

    test("Malformed/Null token objects evaluate as EXPIRED", () => {
      expect(authService.isTokenExpired(null)).toBe(true);
      expect(authService.isTokenExpired({} as any)).toBe(true);
      expect(
        authService.isTokenExpired({
          ...sampleTokens,
          issuedAt: undefined,
        } as any),
      ).toBe(true);
      expect(
        authService.isTokenExpired({
          ...sampleTokens,
          expiresIn: undefined,
        } as any),
      ).toBe(true);
      expect(
        authService.isTokenExpired({
          ...sampleTokens,
          expiresIn: "invalid" as any,
        }),
      ).toBe(true);
    });
  });

  describe("2. Expired or Invalid Refresh Token Tests", () => {
    test("HTTP 400 Bad Request on token refresh triggers logout and throws error", async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 400,
        statusText: "Bad Request",
        json: async () => ({
          error: "invalid_grant",
          error_description: "Token has been expired or revoked.",
        }),
      });

      await authService.saveAuthData(sampleTokens, sampleUser);

      await expect(
        authService.refreshToken(sampleTokens.refreshToken),
      ).rejects.toThrow("Failed to refresh access token. Session expired.");

      const storedTokens = await getSecureItem(TOKENS_KEY);
      const storedUser = await getSecureItem(USER_KEY);
      expect(storedTokens).toBeNull();
      expect(storedUser).toBeNull();
    });

    test("HTTP 401 Unauthorized on token refresh purges secure storage", async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: "Unauthorized",
      });

      await authService.saveAuthData(sampleTokens, sampleUser);
      await expect(
        authService.refreshToken(sampleTokens.refreshToken),
      ).rejects.toThrow();

      const storedTokens = await getSecureItem(TOKENS_KEY);
      expect(storedTokens).toBeNull();
    });

    test("Empty refresh token string triggers logout and throws error", async () => {
      await authService.saveAuthData(sampleTokens, sampleUser);

      await expect(authService.refreshToken("")).rejects.toThrow(
        "Refresh token is required",
      );

      const storedTokens = await getSecureItem(TOKENS_KEY);
      expect(storedTokens).toBeNull();
    });

    test("getStoredTokens() with expired token and failing refresh returns null and purges storage", async () => {
      const expiredTokens: AuthTokens = {
        ...sampleTokens,
        issuedAt: Date.now() - 4000 * 1000, // Expired
      };
      await authService.saveAuthData(expiredTokens, sampleUser);

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 400,
        statusText: "Bad Request",
      });

      const result = await authService.getStoredTokens();

      expect(result).toBeNull();
      expect(await getSecureItem(TOKENS_KEY)).toBeNull();
      expect(await getSecureItem(USER_KEY)).toBeNull();
    });

    test("Network error during refreshToken() in getStoredTokens() purges storage", async () => {
      const expiredTokens: AuthTokens = {
        ...sampleTokens,
        issuedAt: Date.now() - 4000 * 1000,
      };
      await authService.saveAuthData(expiredTokens, sampleUser);

      (global.fetch as jest.Mock).mockRejectedValueOnce(
        new Error("Network request failed"),
      );

      const result = await authService.getStoredTokens();

      expect(result).toBeNull();
      expect(await getSecureItem(TOKENS_KEY)).toBeNull();
    });
  });

  describe("3. Concurrent Token Refresh Calls", () => {
    test("Concurrent refreshToken calls execute separate HTTP POST requests", async () => {
      let callCount = 0;
      (global.fetch as jest.Mock).mockImplementation(async () => {
        callCount++;
        // Simulate network delay
        await new Promise((resolve) => setTimeout(resolve, 50));
        return {
          ok: true,
          json: async () => ({
            access_token: `token_${callCount}`,
            expires_in: 3600,
            token_type: "Bearer",
          }),
        };
      });

      await authService.saveAuthData(sampleTokens, sampleUser);

      // Trigger 5 concurrent refreshToken calls
      const results = await Promise.all([
        authService.refreshToken(sampleTokens.refreshToken),
        authService.refreshToken(sampleTokens.refreshToken),
        authService.refreshToken(sampleTokens.refreshToken),
        authService.refreshToken(sampleTokens.refreshToken),
        authService.refreshToken(sampleTokens.refreshToken),
      ]);

      // All 5 requests fired independently (no deduplication mutex)
      expect(callCount).toBe(5);
      expect(results).toHaveLength(5);
      results.forEach((res) => {
        expect(res.accessToken).toMatch(/^token_\d+$/);
      });
    });

    test("Concurrent getStoredTokens calls when token is expired trigger multiple refresh requests", async () => {
      let callCount = 0;
      (global.fetch as jest.Mock).mockImplementation(async () => {
        callCount++;
        await new Promise((resolve) => setTimeout(resolve, 50));
        return {
          ok: true,
          json: async () => ({
            access_token: `token_concurrent_${callCount}`,
            expires_in: 3600,
          }),
        };
      });

      const expiredTokens: AuthTokens = {
        ...sampleTokens,
        issuedAt: Date.now() - 4000 * 1000,
      };
      await authService.saveAuthData(expiredTokens, sampleUser);

      const results = await Promise.all([
        authService.getStoredTokens(),
        authService.getStoredTokens(),
        authService.getStoredTokens(),
      ]);

      expect(callCount).toBe(3);
      expect(results[0]?.accessToken).toBeDefined();
    });
  });

  describe("4. Storage Corruption Recovery Tests", () => {
    test("Corrupted non-JSON string in TOKENS_KEY is caught, returns null, and purges storage", async () => {
      await setSecureItem(TOKENS_KEY, "{ invalid_json ::: string ");
      await setSecureItem(USER_KEY, JSON.stringify(sampleUser));

      const tokens = await authService.getStoredTokens();

      expect(tokens).toBeNull();
      // Verify storage was purged cleanly
      expect(await getSecureItem(TOKENS_KEY)).toBeNull();
      expect(await getSecureItem(USER_KEY)).toBeNull();
    });

    test("Non-object JSON (e.g. number or array) in TOKENS_KEY is handled gracefully", async () => {
      await setSecureItem(TOKENS_KEY, "12345");
      const tokensNum = await authService.getStoredTokens();
      expect(tokensNum).toBeNull();

      await setSecureItem(TOKENS_KEY, '["array", "instead", "of", "object"]');
      const tokensArr = await authService.getStoredTokens();
      expect(tokensArr).toBeNull();
    });

    test("Empty JSON object {} in TOKENS_KEY evaluates as expired and purges storage", async () => {
      await setSecureItem(TOKENS_KEY, "{}");
      await setSecureItem(USER_KEY, JSON.stringify(sampleUser));

      const tokens = await authService.getStoredTokens();

      expect(tokens).toBeNull();
      expect(await getSecureItem(TOKENS_KEY)).toBeNull();
      expect(await getSecureItem(USER_KEY)).toBeNull();
    });

    test("Corrupted JSON in USER_KEY is caught by getStoredUser() returning null", async () => {
      await setSecureItem(USER_KEY, "broken json user format");

      const user = await authService.getStoredUser();

      expect(user).toBeNull();
    });
  });
});
