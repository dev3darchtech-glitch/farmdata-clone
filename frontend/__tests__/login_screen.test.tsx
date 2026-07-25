import { useAuth } from "@/hooks/useAuth";
import React from "react";
import { ActivityIndicator, Text, TouchableOpacity } from "react-native";
import renderer, { act } from "react-test-renderer";
import LoginScreen from "../app/(auth)/login";

// Mock external modules
jest.mock("expo-web-browser", () => ({
  maybeCompleteAuthSession: jest.fn(),
  openAuthSessionAsync: jest.fn(),
}));

jest.mock("@/hooks/useAuth", () => ({
  useAuth: jest.fn(),
}));

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

describe("LoginScreen Component & UI Integration Tests", () => {
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
    mockUseAuth.mockReturnValue(createMockAuthContext());
  });

  // Requirement 1: Verify presence of all 4 testIDs
  describe("Requirement 1: TestID Presence Verification", () => {
    it("renders all 4 required testIDs: input-login-email, input-login-password, btn-submit-login, btn-google-login", async () => {
      let component: renderer.ReactTestRenderer;
      await act(async () => {
        component = renderer.create(<LoginScreen />);
      });

      const root = component!.root;

      const emailInput = root.findByProps({ testID: "input-login-email" });
      const passwordInput = root.findByProps({ testID: "input-login-password" });
      const submitButton = root.findByProps({ testID: "btn-submit-login" });
      const googleButton = root.findByProps({ testID: "btn-google-login" });

      expect(emailInput).toBeDefined();
      expect(passwordInput).toBeDefined();
      expect(submitButton).toBeDefined();
      expect(googleButton).toBeDefined();
    });
  });

  // Requirement 2: Verify Zod form validation behavior
  describe("Requirement 2: Zod Form Validation Behavior", () => {
    it("triggers validation errors when submitting empty email and password", async () => {
      let component: renderer.ReactTestRenderer;
      await act(async () => {
        component = renderer.create(<LoginScreen />);
      });

      const root = component!.root;
      const emailInput = root.findByProps({ testID: "input-login-email" });
      const passwordInput = root.findByProps({ testID: "input-login-password" });
      const submitButton = root.findByProps({ testID: "btn-submit-login" });

      // Clear both input fields
      await act(async () => {
        emailInput.props.onChangeText("");
        passwordInput.props.onChangeText("");
      });

      // Submit the form
      await act(async () => {
        submitButton.props.onPress();
      });

      // Extract text content from all Text elements
      const textNodes = root.findAllByType(Text);
      const textContents = textNodes.map((node: any) => {
        if (typeof node.props.children === "string") return node.props.children;
        if (Array.isArray(node.props.children)) return node.props.children.join("");
        return "";
      });

      expect(textContents).toContain("Vui lòng nhập tên đăng nhập hoặc email");
      expect(textContents).toContain("Vui lòng nhập mật khẩu");
      expect(mockLogin).not.toHaveBeenCalled();
    });

    it("displays error message text and warning representation for invalid email format", async () => {
      let component: renderer.ReactTestRenderer;
      await act(async () => {
        component = renderer.create(<LoginScreen />);
      });

      const root = component!.root;
      const emailInput = root.findByProps({ testID: "input-login-email" });
      const submitButton = root.findByProps({ testID: "btn-submit-login" });

      await act(async () => {
        emailInput.props.onChangeText("invalid-email-format");
      });

      await act(async () => {
        submitButton.props.onPress();
      });

      const textNodes = root.findAllByType(Text);
      const textContents = textNodes.map((node: any) => {
        if (typeof node.props.children === "string") return node.props.children;
        if (Array.isArray(node.props.children)) return node.props.children.join("");
        return "";
      });

      expect(textContents).toContain("Email không hợp lệ");
      expect(mockLogin).not.toHaveBeenCalled();

      const errorViews = root.findAll((node: any) => {
        try {
          const texts = node.findAllByType(Text);
          return texts.some((t: any) => t.props.children === "Email không hợp lệ");
        } catch {
          return false;
        }
      });
      expect(errorViews.length).toBeGreaterThan(0);

      // Verify that within the error container, there is an icon component alongside text
      const iconNode = errorViews[0].children.find(
        (child: any) => typeof child !== "string" && child.type !== Text,
      );
      expect(iconNode).toBeDefined();
    });
  });

  // Requirement 3: Verify password visibility toggle button (Eye / EyeOff)
  describe("Requirement 3: Password Visibility Toggle Button", () => {
    it("toggles password visibility and switches between Eye and EyeOff icons", async () => {
      let component: renderer.ReactTestRenderer;
      await act(async () => {
        component = renderer.create(<LoginScreen />);
      });

      const root = component!.root;
      const passwordInput = root.findByProps({ testID: "input-login-password" });

      // Initially secureTextEntry should be true
      expect(passwordInput.props.secureTextEntry).toBe(true);

      // Find the toggle button via its text "Hiện"
      const toggleTexts = root.findAllByType(Text).filter((node: any) => {
        const text =
          typeof node.props.children === "string"
            ? node.props.children
            : Array.isArray(node.props.children)
              ? node.props.children.join("")
              : "";
        return text === "Hiện" || text === "Ẩn";
      });
      expect(toggleTexts.length).toBe(1);
      expect(toggleTexts[0].props.children).toBe("Hiện");

      // Find parent TouchableOpacity for toggle button
      const toggleButton = root.findAllByType(TouchableOpacity).find((btn: any) => {
        try {
          const texts = btn.findAllByType(Text);
          return texts.some((t: any) => t.props.children === "Hiện" || t.props.children === "Ẩn");
        } catch {
          return false;
        }
      });
      expect(toggleButton).toBeDefined();

      // Click to show password
      await act(async () => {
        toggleButton!.props.onPress();
      });

      // Password input secureTextEntry should now be false
      expect(passwordInput.props.secureTextEntry).toBe(false);

      // Toggle text should now be "Ẩn"
      const updatedToggleTexts = root.findAllByType(Text).filter((node: any) => {
        const text =
          typeof node.props.children === "string"
            ? node.props.children
            : Array.isArray(node.props.children)
              ? node.props.children.join("")
              : "";
        return text === "Hiện" || text === "Ẩn";
      });
      expect(updatedToggleTexts[0].props.children).toBe("Ẩn");

      // Click again to hide password
      await act(async () => {
        toggleButton!.props.onPress();
      });

      // Password input secureTextEntry should be back to true
      expect(passwordInput.props.secureTextEntry).toBe(true);
      expect(updatedToggleTexts[0].props.children).toBe("Hiện");
    });
  });

  // Requirement 4: Verify submit actions invoke auth login function when form is valid
  describe("Requirement 4: Submit Actions & Auth Login Invocation", () => {
    it("invokes auth login function when submit button is pressed with valid form values", async () => {
      let component: renderer.ReactTestRenderer;
      await act(async () => {
        component = renderer.create(<LoginScreen />);
      });

      const root = component!.root;
      const submitButton = root.findByProps({ testID: "btn-submit-login" });

      await act(async () => {
        submitButton.props.onPress();
      });

      expect(mockLogin).toHaveBeenCalledTimes(1);
      expect(mockLogin).toHaveBeenCalledWith("an.nguyen@farm.vn", "123456");
    });

    it("invokes auth login function when Google sign-in button is pressed", async () => {
      let component: renderer.ReactTestRenderer;
      await act(async () => {
        component = renderer.create(<LoginScreen />);
      });

      const root = component!.root;
      const googleButton = root.findByProps({ testID: "btn-google-login" });

      await act(async () => {
        googleButton.props.onPress();
      });

      expect(mockLogin).toHaveBeenCalledTimes(1);
    });
  });

  // Requirement 5: Verify loader state when form is submitting / isLoading is true
  describe("Requirement 5: Loader State Verification", () => {
    it("renders ActivityIndicator loader and hides submit buttons when isLoading is true", async () => {
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

      // ActivityIndicator must be present
      const loader = root.findByType(ActivityIndicator);
      expect(loader).toBeDefined();

      // Submit and Google buttons must NOT be rendered when isLoading is true
      const submitButtons = root.findAllByProps({ testID: "btn-submit-login" });
      const googleButtons = root.findAllByProps({ testID: "btn-google-login" });
      expect(submitButtons.length).toBe(0);
      expect(googleButtons.length).toBe(0);
    });

    it("displays error banner when auth error exists", async () => {
      const errorMessage = "Tài khoản hoặc mật khẩu không chính xác";
      mockUseAuth.mockReturnValue(
        createMockAuthContext({
          error: errorMessage,
        }),
      );

      let component: renderer.ReactTestRenderer;
      await act(async () => {
        component = renderer.create(<LoginScreen />);
      });

      const root = component!.root;
      const textNodes = root.findAllByType(Text);
      const textContents = textNodes.map((node: any) => {
        if (typeof node.props.children === "string") return node.props.children;
        if (Array.isArray(node.props.children)) return node.props.children.join("");
        return "";
      });

      expect(textContents).toContain(errorMessage);
    });
  });
});
