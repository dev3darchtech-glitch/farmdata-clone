import { useAuth } from "@/hooks/useAuth";
import React from "react";
import * as WebBrowser from "expo-web-browser";
import { StyleSheet, Text } from "react-native";
import renderer, { act } from "react-test-renderer";
import LoginScreen from "../app/(auth)/login";

jest.mock("expo-web-browser", () => ({
  maybeCompleteAuthSession: jest.fn(),
  openAuthSessionAsync: jest.fn(),
}));

jest.mock("@/hooks/useAuth", () => ({
  useAuth: jest.fn(),
}));

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;
const mockOpenAuthSessionAsync = WebBrowser.openAuthSessionAsync as jest.Mock;

describe("LoginScreen stress cases", () => {
  const mockLogin = jest.fn();
  const mockLogout = jest.fn().mockResolvedValue(undefined);
  const mockRefreshToken = jest.fn().mockResolvedValue(null);

  const createMockAuthContext = (overrides = {}) => ({
    user: null,
    tokens: null,
    isLoading: false,
    isAuthenticated: false,
    error: null,
    login: mockLogin,
    logout: mockLogout,
    refreshToken: mockRefreshToken,
    ...overrides,
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockOpenAuthSessionAsync.mockResolvedValue({
      type: "success",
      url: "capturedata://auth-callback?accessToken=mock_google_access_token&refreshToken=mock_google_refresh_token",
    });
    mockLogin.mockResolvedValue(undefined);
    mockUseAuth.mockReturnValue(createMockAuthContext());
  });

  it("rejects whitespace-only username", async () => {
    let component: renderer.ReactTestRenderer;
    await act(async () => {
      component = renderer.create(<LoginScreen />);
    });

    const root = component!.root;
    await act(async () => {
      root.findByProps({ testID: "input-login-email" }).props.onChangeText("   ");
      root.findByProps({ testID: "input-login-password" }).props.onChangeText("123456");
      root.findByProps({ testID: "btn-submit-login" }).props.onPress();
    });

    const textContents = root.findAllByType(Text).map((node: any) =>
      Array.isArray(node.props.children)
        ? node.props.children.join("")
        : String(node.props.children || ""),
    );

    expect(textContents).toContain("Vui lòng nhập tên đăng nhập hoặc email");
    expect(mockLogin).not.toHaveBeenCalled();
  });

  it("accepts valid usernames and emails", async () => {
    const validValues = ["farmer01", "farmer.john@agri.com"];

    for (const loginValue of validValues) {
      mockLogin.mockClear();
      let component: renderer.ReactTestRenderer;
      await act(async () => {
        component = renderer.create(<LoginScreen />);
      });

      const root = component!.root;
      await act(async () => {
        root.findByProps({ testID: "input-login-email" }).props.onChangeText(loginValue);
        root.findByProps({ testID: "input-login-password" }).props.onChangeText("123456");
        root.findByProps({ testID: "btn-submit-login" }).props.onPress();
      });

      expect(mockLogin).toHaveBeenCalledTimes(1);
    }
  });

  it("marks both input shells invalid when global auth error exists", async () => {
    mockUseAuth.mockReturnValue(
      createMockAuthContext({
        error: "Tài khoản hoặc mật khẩu không chính xác",
      }),
    );

    let component: renderer.ReactTestRenderer;
    await act(async () => {
      component = renderer.create(<LoginScreen />);
    });

    const root = component!.root;
    const emailShell = root.findByProps({ testID: "input-login-email" }).parent.parent;
    const passwordShell = root.findByProps({ testID: "input-login-password" }).parent.parent;

    const emailStyle = StyleSheet.flatten(emailShell.props.style);
    const passwordStyle = StyleSheet.flatten(passwordShell.props.style);

    expect(emailStyle.borderColor).toBe("#ba1a1a");
    expect(passwordStyle.borderColor).toBe("#ba1a1a");
  });

  it("maintains password toggle state across repeated presses", async () => {
    let component: renderer.ReactTestRenderer;
    await act(async () => {
      component = renderer.create(<LoginScreen />);
    });

    const root = component!.root;
    const passwordInput = root.findByProps({ testID: "input-login-password" });

    for (let index = 0; index < 10; index += 1) {
      await act(async () => {
        root.findByProps({ testID: "btn-toggle-password" }).props.onPress();
      });
      expect(passwordInput.props.secureTextEntry).toBe(index % 2 === 0 ? false : true);
    }
  });

  it("surfaces rejected Google login without crashing", async () => {
    mockLogin.mockRejectedValueOnce(new Error("Google OAuth Cancelled"));

    let component: renderer.ReactTestRenderer;
    await act(async () => {
      component = renderer.create(<LoginScreen />);
    });

    const root = component!.root;
    await act(async () => {
      await root.findByProps({ testID: "btn-google-login" }).props.onPress();
    });

    expect(mockLogin).toHaveBeenCalledTimes(1);
  });
});
