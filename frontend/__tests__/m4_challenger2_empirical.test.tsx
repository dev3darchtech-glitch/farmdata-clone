import TabLayout from "@/app/(tabs)/_layout";
import { GardenPalette } from "@/constants/theme";
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

describe("Milestone 4 Challenger 2 Empirical Test Suite", () => {
  // ==========================================
  // 1. GardenPalette Token Export & Hex Validation
  // ==========================================
  describe("1. GardenPalette Theme Token Integrity", () => {
    it("exports all 5 required M4 design tokens with exact hex strings", () => {
      expect(GardenPalette.greenPrimary).toBe("#31582b");
      expect(GardenPalette.greenActive).toBe("#2e7d32");
      expect(GardenPalette.greenSoft).toBe("#EEF7E9");
      expect(GardenPalette.neutral50).toBe("#F3F4F6");
      expect(GardenPalette.neutral100).toBe("#E0E0E0");
    });

    it("verifies uppercase/lowercase hex normalization across palette", () => {
      const hexRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
      expect(hexRegex.test(GardenPalette.greenPrimary)).toBe(true);
      expect(hexRegex.test(GardenPalette.greenActive)).toBe(true);
      expect(hexRegex.test(GardenPalette.greenSoft)).toBe(true);
      expect(hexRegex.test(GardenPalette.neutral50)).toBe(true);
      expect(hexRegex.test(GardenPalette.neutral100)).toBe(true);
    });
  });

  // ==========================================
  // 2. TabLayout Header & Role Switcher Integration
  // ==========================================
  describe("2. TabLayout Header & Role Switcher State Behavior", () => {
    it("renders app-header, app-title, and role-selector testIDs correctly", () => {
      let component: renderer.ReactTestRenderer;
      act(() => {
        component = renderer.create(<TabLayout />);
      });

      const root = component!.root;
      expect(root.findByProps({ testID: "app-header" })).toBeDefined();
      expect(root.findByProps({ testID: "app-title" })).toBeDefined();
      expect(root.findByProps({ testID: "role-selector" })).toBeDefined();
    });

    it("defaults to Farmer role with proper accessibility state and tab href routing", () => {
      let component: renderer.ReactTestRenderer;
      act(() => {
        component = renderer.create(<TabLayout />);
      });

      const root = component!.root;
      const farmerBtn = root.findByProps({ testID: "btn-role-farmer" });
      const adminBtn = root.findByProps({ testID: "btn-role-admin" });

      expect(farmerBtn.props.accessibilityState).toEqual({ selected: true });
      expect(adminBtn.props.accessibilityState).toEqual({ selected: false });

      // Inspect Tab screens href routing for Farmer
      const screens = root.findAllByType("div" as any).filter((node: any) =>
        node.props["data-testid"]?.startsWith("tab-screen-")
      );
      
      const captureScreen = screens.find((s: any) => s.props["data-testid"] === "tab-screen-capture");
      const postsScreen = screens.find((s: any) => s.props["data-testid"] === "tab-screen-posts");
      const managementScreen = screens.find((s: any) => s.props["data-testid"] === "tab-screen-management");

      const captureOptions = JSON.parse(captureScreen.props["data-options"]);
      const postsOptions = JSON.parse(postsScreen.props["data-options"]);
      const managementOptions = JSON.parse(managementScreen.props["data-options"]);

      expect(captureOptions.href).toBe("/capture");
      expect(postsOptions.href).toBe("/posts");
      expect(managementOptions.href).toBeNull();
    });

    it("switches to Admin role on press and updates tab href routing accordingly", () => {
      let component: renderer.ReactTestRenderer;
      act(() => {
        component = renderer.create(<TabLayout />);
      });

      const root = component!.root;
      const adminBtn = root.findByProps({ testID: "btn-role-admin" });

      // Click Admin button
      act(() => {
        adminBtn.props.onPress();
      });

      const farmerBtnAfter = root.findByProps({ testID: "btn-role-farmer" });
      const adminBtnAfter = root.findByProps({ testID: "btn-role-admin" });

      expect(farmerBtnAfter.props.accessibilityState).toEqual({ selected: false });
      expect(adminBtnAfter.props.accessibilityState).toEqual({ selected: true });

      // Inspect Tab screens href routing for Admin
      const screens = root.findAllByType("div" as any).filter((node: any) =>
        node.props["data-testid"]?.startsWith("tab-screen-")
      );
      
      const captureScreen = screens.find((s: any) => s.props["data-testid"] === "tab-screen-capture");
      const postsScreen = screens.find((s: any) => s.props["data-testid"] === "tab-screen-posts");
      const managementScreen = screens.find((s: any) => s.props["data-testid"] === "tab-screen-management");

      const captureOptions = JSON.parse(captureScreen.props["data-options"]);
      const postsOptions = JSON.parse(postsScreen.props["data-options"]);
      const managementOptions = JSON.parse(managementScreen.props["data-options"]);

      expect(captureOptions.href).toBeNull();
      expect(postsOptions.href).toBe("/posts");
      expect(managementOptions.href).toBe("/management");
    });
  });
});
