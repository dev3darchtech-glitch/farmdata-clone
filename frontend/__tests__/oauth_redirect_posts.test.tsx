import AuthCallbackScreen from "@/app/auth-callback";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import * as authService from "@/services/authService";
import React from "react";
import { InteractionManager, Pressable } from "react-native";
import renderer, { act } from "react-test-renderer";

const mockReplace = jest.fn();
let mockParams: Record<string, string | undefined> = {};

jest.mock("expo-router", () => ({
  useRouter: () => ({ replace: mockReplace }),
  useRootNavigationState: () => ({ key: "root-navigation" }),
  useLocalSearchParams: () => mockParams,
}));

jest.mock("@/services/authService", () => ({
  getStoredTokens: jest.fn().mockResolvedValue(null),
  getStoredUser: jest.fn().mockResolvedValue(null),
  loginWithCredentials: jest.fn(),
  loginWithGoogle: jest.fn(),
  loginWithBackendTokens: jest.fn(),
  logout: jest.fn().mockResolvedValue(undefined),
  refreshToken: jest.fn(),
}));

const mockedAuthService = authService as jest.Mocked<typeof authService>;

function LoginReferenceProbe({ refs }: { refs: Array<ReturnType<typeof useAuth>["login"]> }) {
  const { login } = useAuth();
  refs.push(login);

  return (
    <Pressable
      testID="trigger-token-login"
      onPress={() =>
        login({
          accessToken: "backend-access-token",
          refreshToken: "backend-refresh-token",
        })
      }
    />
  );
}

describe("Google OAuth redirect", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockParams = {
      accessToken: "backend-access-token",
      refreshToken: "backend-refresh-token",
    };

    mockedAuthService.getStoredTokens.mockResolvedValue(null);
    mockedAuthService.getStoredUser.mockResolvedValue(null);
    mockedAuthService.loginWithBackendTokens.mockResolvedValue({
      user: {
        id: "farmer-1",
        name: "Nguyễn Văn An",
        email: "an.nguyen@farm.vn",
        role: "farmer",
      },
      tokens: {
        accessToken: "backend-access-token",
        refreshToken: "backend-refresh-token",
        tokenType: "Bearer",
        expiresIn: 86400,
        issuedAt: Date.now(),
      },
    });

    jest
      .spyOn(InteractionManager, "runAfterInteractions")
      .mockImplementation((callback: any) => {
        callback();
        return { cancel: jest.fn() } as any;
      });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("stores backend tokens and redirects directly to the posts tab", async () => {
    let tree: renderer.ReactTestRenderer;

    await act(async () => {
      tree = renderer.create(
        <AuthProvider>
          <AuthCallbackScreen />
        </AuthProvider>,
      );
      await Promise.resolve();
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(mockedAuthService.loginWithBackendTokens).toHaveBeenCalledWith(
      "backend-access-token",
      "backend-refresh-token",
    );
    expect(mockReplace).toHaveBeenCalledWith("/(tabs)/posts");
    expect(mockReplace).not.toHaveBeenCalledWith(
      "/(auth)/login?oauthSuccess=1",
    );

    await act(async () => {
      tree!.unmount();
    });
  });

  it("keeps the login action reference stable after auth state changes", async () => {
    const loginRefs: Array<ReturnType<typeof useAuth>["login"]> = [];
    let tree: renderer.ReactTestRenderer;

    await act(async () => {
      tree = renderer.create(
        <AuthProvider>
          <LoginReferenceProbe refs={loginRefs} />
        </AuthProvider>,
      );
      await Promise.resolve();
    });

    const trigger = tree!.root.findByProps({ testID: "trigger-token-login" });

    await act(async () => {
      await trigger.props.onPress();
      await Promise.resolve();
    });

    expect(loginRefs.length).toBeGreaterThan(1);
    expect(loginRefs.every((loginRef) => loginRef === loginRefs[0])).toBe(true);

    await act(async () => {
      tree!.unmount();
    });
  });
});
