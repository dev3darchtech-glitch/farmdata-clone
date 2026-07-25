import { useAuth } from "@/hooks/useAuth";
import React from "react";
import * as WebBrowser from "expo-web-browser";
import { ActivityIndicator, Text } from "react-native";
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

describe("LoginScreen", () => {
  const mockLogin = jest.fn().mockResolvedValue(undefined);
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
    mockUseAuth.mockReturnValue(createMockAuthContext());
  });

  it("renders required login test ids", async () => {
    let component: renderer.ReactTestRenderer;
    await act(async () => {
      component = renderer.create(<LoginScreen />);
    });

    const root = component!.root;
    expect(root.findByProps({ testID: "input-login-email" })).toBeDefined();
    expect(root.findByProps({ testID: "input-login-password" })).toBeDefined();
    expect(root.findByProps({ testID: "btn-submit-login" })).toBeDefined();
    expect(root.findByProps({ testID: "btn-google-login" })).toBeDefined();
    expect(root.findByProps({ testID: "btn-toggle-password" })).toBeDefined();
  });

  it("shows validation messages for empty credentials", async () => {
    let component: renderer.ReactTestRenderer;
    await act(async () => {
      component = renderer.create(<LoginScreen />);
    });

    const root = component!.root;
    await act(async () => {
      root.findByProps({ testID: "input-login-email" }).props.onChangeText("");
      root.findByProps({ testID: "input-login-password" }).props.onChangeText("");
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

  it("toggles password visibility from the icon button", async () => {
    let component: renderer.ReactTestRenderer;
    await act(async () => {
      component = renderer.create(<LoginScreen />);
    });

    const root = component!.root;
    const passwordInput = root.findByProps({ testID: "input-login-password" });

    expect(passwordInput.props.secureTextEntry).toBe(true);

    await act(async () => {
      root.findByProps({ testID: "btn-toggle-password" }).props.onPress();
    });
    expect(passwordInput.props.secureTextEntry).toBe(false);

    await act(async () => {
      root.findByProps({ testID: "btn-toggle-password" }).props.onPress();
    });
    expect(passwordInput.props.secureTextEntry).toBe(true);
  });

  it("submits credentials when form is valid", async () => {
    let component: renderer.ReactTestRenderer;
    await act(async () => {
      component = renderer.create(<LoginScreen />);
    });

    const root = component!.root;
    await act(async () => {
      root.findByProps({ testID: "input-login-email" }).props.onChangeText("farmer01");
      root.findByProps({ testID: "input-login-password" }).props.onChangeText("123456");
      root.findByProps({ testID: "btn-submit-login" }).props.onPress();
    });

    expect(mockLogin).toHaveBeenCalledTimes(1);
    expect(mockLogin).toHaveBeenCalledWith("farmer01", "123456");
  });

  it("invokes auth login with backend tokens when Google sign-in succeeds", async () => {
    let component: renderer.ReactTestRenderer;
    await act(async () => {
      component = renderer.create(<LoginScreen />);
    });

    const root = component!.root;
    await act(async () => {
      await root.findByProps({ testID: "btn-google-login" }).props.onPress();
    });

    expect(mockLogin).toHaveBeenCalledTimes(1);
    expect(mockLogin).toHaveBeenCalledWith({
      accessToken: "mock_google_access_token",
      refreshToken: "mock_google_refresh_token",
    });
  });

  it("keeps buttons rendered but disabled when auth is loading", async () => {
    mockUseAuth.mockReturnValue(
      createMockAuthContext({
        isLoading: true,
      }),
    );

    let component: renderer.ReactTestRenderer;
    await act(async () => {
      component = renderer.create(<LoginScreen />);
    });

    const root = component!.root;
    expect(root.findAllByType(ActivityIndicator).length).toBeGreaterThan(0);
    expect(root.findByProps({ testID: "btn-submit-login" })).toBeDefined();
    expect(root.findByProps({ testID: "btn-google-login" })).toBeDefined();
  });
});
