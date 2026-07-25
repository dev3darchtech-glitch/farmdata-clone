import { GardenPalette } from "@/constants/theme";
import { useAuth } from "@/hooks/useAuth";
import React from "react";
import { ActivityIndicator, StyleSheet, Text, TextInput, TouchableOpacity } from "react-native";
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

describe("LoginScreen Empirical Stress & Adversarial Challenge Suite", () => {
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
    mockLogin.mockResolvedValue(undefined);
    mockUseAuth.mockReturnValue(createMockAuthContext());
  });

  describe("Adversarial Test Suite 1: Input Validation & Edge Case Inputs", () => {
    it("handles whitespace-only email input by failing email validation", async () => {
      let component: renderer.ReactTestRenderer;
      await act(async () => {
        component = renderer.create(<LoginScreen />);
      });

      const root = component!.root;
      const emailInput = root.findByProps({ testID: "input-login-email" });
      const submitButton = root.findByProps({ testID: "btn-submit-login" });

      await act(async () => {
        emailInput.props.onChangeText("   ");
      });

      await act(async () => {
        submitButton.props.onPress();
      });

      const textNodes = root.findAllByType(Text);
      const textContents = textNodes.map((node: any) =>
        Array.isArray(node.props.children)
          ? node.props.children.join("")
          : String(node.props.children || "")
      );

      expect(textContents).toContain("Email không hợp lệ");
      expect(mockLogin).not.toHaveBeenCalled();
    });

    it("handles multiple invalid email formats correctly", async () => {
      const invalidEmails = [
        "plainaddress",
        "#@%^%#$@#$@#.com",
        "@example.com",
        "Joe Smith <email@example.com>",
        "email.example.com",
        "email@example@example.com",
      ];

      for (const invalidEmail of invalidEmails) {
        let component: renderer.ReactTestRenderer;
        await act(async () => {
          component = renderer.create(<LoginScreen />);
        });

        const root = component!.root;
        const emailInput = root.findByProps({ testID: "input-login-email" });
        const submitButton = root.findByProps({ testID: "btn-submit-login" });

        await act(async () => {
          emailInput.props.onChangeText(invalidEmail);
        });

        await act(async () => {
          submitButton.props.onPress();
        });

        const textNodes = root.findAllByType(Text);
        const textContents = textNodes.map((node: any) =>
          Array.isArray(node.props.children)
            ? node.props.children.join("")
            : String(node.props.children || "")
        );

        expect(textContents).toContain("Email không hợp lệ");
        expect(mockLogin).not.toHaveBeenCalled();
      }
    });

    it("allows valid email formats to pass validation and invoke login", async () => {
      const validEmails = [
        "farmer.john@agri.com",
        "user+tag@domain.co.uk",
        "test.user@sub.domain.vn",
      ];

      for (const validEmail of validEmails) {
        mockLogin.mockClear();

        let component: renderer.ReactTestRenderer;
        await act(async () => {
          component = renderer.create(<LoginScreen />);
        });

        const root = component!.root;
        const emailInput = root.findByProps({ testID: "input-login-email" });
        const submitButton = root.findByProps({ testID: "btn-submit-login" });

        await act(async () => {
          emailInput.props.onChangeText(validEmail);
        });

        await act(async () => {
          await submitButton.props.onPress();
        });

        expect(mockLogin).toHaveBeenCalledTimes(1);
      }
    });
  });

  describe("Adversarial Test Suite 2: Styling & Error State Visual Distinction", () => {
    it("applies error border style specifically to email field when only email has validation error", async () => {
      let component: renderer.ReactTestRenderer;
      await act(async () => {
        component = renderer.create(<LoginScreen />);
      });

      const root = component!.root;
      const emailInput = root.findByProps({ testID: "input-login-email" });
      const submitButton = root.findByProps({ testID: "btn-submit-login" });

      await act(async () => {
        emailInput.props.onChangeText(""); // Empty email
      });

      await act(async () => {
        await submitButton.props.onPress();
      });

      const emailContainer = root.findByProps({ testID: "input-login-email" }).parent.parent;
      const passwordContainer = root.findByProps({ testID: "input-login-password" }).parent.parent;

      const flatEmailStyle = StyleSheet.flatten(emailContainer.props.style);
      const flatPasswordStyle = StyleSheet.flatten(passwordContainer.props.style);

      expect(flatEmailStyle.borderColor).toBe(GardenPalette.error);
      expect(flatEmailStyle.borderWidth).toBe(1.5);
      expect(flatPasswordStyle.borderColor).toBe(GardenPalette.rule);
      expect(flatPasswordStyle.borderWidth).toBe(1);
    });

    it("applies error border style to BOTH email and password fields when global auth error exists", async () => {
      mockUseAuth.mockReturnValue(
        createMockAuthContext({
          error: "Tài khoản hoặc mật khẩu không chính xác",
        })
      );

      let component: renderer.ReactTestRenderer;
      await act(async () => {
        component = renderer.create(<LoginScreen />);
      });

      const root = component!.root;
      const emailContainer = root.findByProps({ testID: "input-login-email" }).parent.parent;
      const passwordContainer = root.findByProps({ testID: "input-login-password" }).parent.parent;

      const flatEmailStyle = StyleSheet.flatten(emailContainer.props.style);
      const flatPasswordStyle = StyleSheet.flatten(passwordContainer.props.style);

      expect(flatEmailStyle.borderColor).toBe(GardenPalette.error);
      expect(flatEmailStyle.borderWidth).toBe(1.5);
      expect(flatPasswordStyle.borderColor).toBe(GardenPalette.error);
      expect(flatPasswordStyle.borderWidth).toBe(1.5);
    });
  });

  describe("Adversarial Test Suite 3: Password Toggle Rapid Cycles & State Consistency", () => {
    it("handles 10 consecutive toggle clicks maintaining consistent state, text, and secureTextEntry", async () => {
      let component: renderer.ReactTestRenderer;
      await act(async () => {
        component = renderer.create(<LoginScreen />);
      });

      const root = component!.root;
      const passwordInput = root.findByProps({ testID: "input-login-password" });

      const toggleButton = root.findAllByType(TouchableOpacity).find((btn: any) => {
        try {
          const texts = btn.findAllByType(Text);
          return texts.some((t: any) => t.props.children === "Hiện" || t.props.children === "Ẩn");
        } catch {
          return false;
        }
      });
      expect(toggleButton).toBeDefined();

      for (let i = 1; i <= 10; i++) {
        const expectedShow = i % 2 === 1;

        await act(async () => {
          toggleButton!.props.onPress();
        });

        expect(passwordInput.props.secureTextEntry).toBe(!expectedShow);

        const toggleTextNode = root.findAllByType(Text).find((node: any) => {
          const text = typeof node.props.children === "string" ? node.props.children : "";
          return text === "Hiện" || text === "Ẩn";
        });
        expect(toggleTextNode?.props.children).toBe(expectedShow ? "Ẩn" : "Hiện");
      }
    });
  });

  describe("Adversarial Test Suite 4: Async Error Handling Resilience", () => {
    it("gracefully catches rejected auth login promise without throwing unhandled rejection error", async () => {
      mockLogin.mockRejectedValue(new Error("Network Failure"));

      let component: renderer.ReactTestRenderer;
      await act(async () => {
        component = renderer.create(<LoginScreen />);
      });

      const root = component!.root;
      const submitButton = root.findByProps({ testID: "btn-submit-login" });

      await act(async () => {
        await submitButton.props.onPress();
      });

      expect(mockLogin).toHaveBeenCalledTimes(1);
    });

    it("gracefully catches rejected auth Google login promise without throwing unhandled rejection error", async () => {
      mockLogin.mockRejectedValue(new Error("Google OAuth Cancelled"));

      let component: renderer.ReactTestRenderer;
      await act(async () => {
        component = renderer.create(<LoginScreen />);
      });

      const root = component!.root;
      const googleButton = root.findByProps({ testID: "btn-google-login" });

      await act(async () => {
        await googleButton.props.onPress();
      });

      expect(mockLogin).toHaveBeenCalledTimes(1);
    });
  });
});
