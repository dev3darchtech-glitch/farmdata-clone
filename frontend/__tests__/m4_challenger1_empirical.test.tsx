import TabLayout from "@/app/(tabs)/_layout";
import { GardenPalette, Colors } from "@/constants/theme";
import React from "react";
import renderer, { act } from "react-test-renderer";

// Mock expo-router Tabs and subcomponents
jest.mock("expo-router", () => {
  const React = require("react");
  const MockScreen = ({ name, options }: { name: string; options: any }) => (
    <div data-testid={`tab-screen-${name}`} data-options={JSON.stringify(options)}>
      {options?.title}
    </div>
  );

  const MockTabs = ({ children, screenOptions }: { children: any; screenOptions: any }) => (
    <div data-testid="expo-tabs" data-screen-options={JSON.stringify(screenOptions)}>
      {children}
    </div>
  );

  MockTabs.Screen = MockScreen;
  return { Tabs: MockTabs };
});

// Mock Lucide icons
jest.mock("lucide-react-native", () => ({
  User: ({ size, color }: any) => <div data-testid="user-icon" data-size={size} data-color={color} />,
  Shield: ({ size, color }: any) => <div data-testid="shield-icon" data-size={size} data-color={color} />,
}));

// Mock HapticTab and IconSymbol
jest.mock("@/components/haptic-tab", () => ({
  HapticTab: () => null,
}));
jest.mock("@/components/ui/icon-symbol", () => ({
  IconSymbol: () => null,
}));

describe("Milestone 4 Challenger 1 Empirical Test Suite", () => {
  // ==========================================
  // 1. GardenPalette Theme Token Integrity & Colors Mapping
  // ==========================================
  describe("1. Theme Tokenization & Palette Verification", () => {
    it("exports all required M4 brand color tokens in GardenPalette", () => {
      expect(GardenPalette.greenPrimary).toBe("#31582b");
      expect(GardenPalette.greenActive).toBe("#2e7d32");
      expect(GardenPalette.greenSoft).toBe("#EEF7E9");
      expect(GardenPalette.neutral50).toBe("#F3F4F6");
      expect(GardenPalette.neutral100).toBe("#E0E0E0");
    });

    it("maintains consistent hex color formats and structure in Colors config", () => {
      expect(Colors.light.background).toBe(GardenPalette.paper);
      expect(Colors.light.cardBackground).toBe(GardenPalette.paper2);
      expect(Colors.light.text).toBe(GardenPalette.ink);
      expect(Colors.light.border).toBe(GardenPalette.rule);
      expect(Colors.dark.background).toBe("#18201A");
      expect(Colors.dark.cardBackground).toBe("#222C24");
    });
  });

  // ==========================================
  // 2. TabLayout Header Component Render & Accessibility Checks
  // ==========================================
  describe("2. TabLayout Header & Role Switcher Render & Accessibility", () => {
    it("renders required layout testIDs: app-header, app-title, role-selector", () => {
      let component: renderer.ReactTestRenderer;
      act(() => {
        component = renderer.create(<TabLayout />);
      });

      const root = component!.root;
      const header = root.findByProps({ testID: "app-header" });
      const title = root.findByProps({ testID: "app-title" });
      const roleSelector = root.findByProps({ testID: "role-selector" });

      expect(header).toBeDefined();
      expect(title).toBeDefined();
      expect(roleSelector).toBeDefined();
    });

    it("verifies accessibility roles, labels, and selected states for role buttons", () => {
      let component: renderer.ReactTestRenderer;
      act(() => {
        component = renderer.create(<TabLayout />);
      });

      const root = component!.root;
      const farmerBtn = root.findByProps({ testID: "btn-role-farmer" });
      const adminBtn = root.findByProps({ testID: "btn-role-admin" });

      expect(farmerBtn.props.accessibilityRole).toBe("button");
      expect(farmerBtn.props.accessibilityLabel).toBe("Nông dân");
      expect(farmerBtn.props.accessibilityState).toEqual({ selected: true });

      expect(adminBtn.props.accessibilityRole).toBe("button");
      expect(adminBtn.props.accessibilityLabel).toBe("Admin");
      expect(adminBtn.props.accessibilityState).toEqual({ selected: false });
    });
  });

  // ==========================================
  // 3. Stress-Testing Role Switcher State & Dynamic Tab Href Access Control
  // ==========================================
  describe("3. Role Switching Stress & Tab Routing Href Verification", () => {
    it("handles multiple sequential role toggling without state drift", () => {
      let component: renderer.ReactTestRenderer;
      act(() => {
        component = renderer.create(<TabLayout />);
      });

      const root = component!.root;

      // Iteration 1: Switch to Admin
      act(() => {
        root.findByProps({ testID: "btn-role-admin" }).props.onPress();
      });
      expect(root.findByProps({ testID: "btn-role-farmer" }).props.accessibilityState).toEqual({ selected: false });
      expect(root.findByProps({ testID: "btn-role-admin" }).props.accessibilityState).toEqual({ selected: true });

      // Iteration 2: Switch back to Farmer
      act(() => {
        root.findByProps({ testID: "btn-role-farmer" }).props.onPress();
      });
      expect(root.findByProps({ testID: "btn-role-farmer" }).props.accessibilityState).toEqual({ selected: true });
      expect(root.findByProps({ testID: "btn-role-admin" }).props.accessibilityState).toEqual({ selected: false });

      // Iteration 3: Switch back to Admin
      act(() => {
        root.findByProps({ testID: "btn-role-admin" }).props.onPress();
      });
      expect(root.findByProps({ testID: "btn-role-admin" }).props.accessibilityState).toEqual({ selected: true });

      // Inspect Tab screen options under Admin role
      const screens = root.findAllByType("div" as any).filter((node: any) =>
        node.props["data-testid"]?.startsWith("tab-screen-")
      );
      
      const captureScreen = screens.find((s: any) => s.props["data-testid"] === "tab-screen-capture");
      const postsScreen = screens.find((s: any) => s.props["data-testid"] === "tab-screen-posts");
      const managementScreen = screens.find((s: any) => s.props["data-testid"] === "tab-screen-management");

      expect(JSON.parse(captureScreen.props["data-options"]).href).toBeNull();
      expect(JSON.parse(postsScreen.props["data-options"]).href).toBe("/posts");
      expect(JSON.parse(managementScreen.props["data-options"]).href).toBe("/management");
    });
  });
});
