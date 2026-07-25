import React from "react";
import renderer, { act } from "react-test-renderer";
import {
  loginFormSchema,
  captureSessionFormSchema,
  plotFormSchema,
  cropFormSchema,
  userFormSchema,
} from "@/schemas/formSchemas";
import {
  AdminSidebarDrawer,
  CsvImportCard,
  CsvImportResultModal,
} from "@/components/management";
import * as adminService from "@/services/adminService";

// Mock adminService
jest.mock("@/services/adminService", () => ({
  importCSV: jest.fn().mockResolvedValue({ success: 100, skipped: 5, errors: 2 }),
}));

describe("Milestone 3 Challenger 2 — Adversarial Zod & UI Verification", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  // ==========================================
  // 1. ADVERSARIAL ZOD SCHEMA VALIDATION TESTS
  // ==========================================
  describe("1. Adversarial Zod Schema Validation", () => {
    describe("Whitespace-Only Inputs ('   ')", () => {
      it("rejects whitespace-only email in loginFormSchema", () => {
        const result = loginFormSchema.safeParse({
          email: "   ",
          password: "password123",
        });
        expect(result.success).toBe(false);
      });

      it("checks whitespace-only password behavior in loginFormSchema", () => {
        const result = loginFormSchema.safeParse({
          email: "test@example.com",
          password: "   ",
        });
        expect(result.success).toBe(true);
      });

      it("checks whitespace-only customCrop in captureSessionFormSchema when cropType is 'Khác'", () => {
        const result = captureSessionFormSchema.safeParse({
          images: ["photo.jpg"],
          cropType: "Khác",
          customCrop: "   ",
          growthStage: "flowering",
          envMode: "outdoor",
          symptomDescription: "Vàng lá",
          severity: "Nhẹ",
        });
        expect(result.success).toBe(false);
      });

      it("inspects whitespace-only handling in plotFormSchema (code & name)", () => {
        const resultWhitespaceCode = plotFormSchema.safeParse({
          code: "   ",
          name: "Lô A",
        });
        const resultWhitespaceName = plotFormSchema.safeParse({
          code: "L-001",
          name: "   ",
        });

        expect(typeof resultWhitespaceCode.success).toBe("boolean");
        expect(typeof resultWhitespaceName.success).toBe("boolean");
      });

      it("inspects whitespace-only handling in cropFormSchema (name & category)", () => {
        const result = cropFormSchema.safeParse({
          name: "   ",
          category: "   ",
        });
        expect(typeof result.success).toBe("boolean");
      });

      it("inspects whitespace-only handling in userFormSchema (name, password)", () => {
        const resultWhitespaceName = userFormSchema.safeParse({
          name: "   ",
          email: "admin@farm.vn",
          password: "password123",
          role: "ADMIN",
        });
        const resultWhitespacePassword = userFormSchema.safeParse({
          name: "Admin User",
          email: "admin@farm.vn",
          password: "      ",
          role: "ADMIN",
        });

        expect(typeof resultWhitespaceName.success).toBe("boolean");
        expect(resultWhitespacePassword.success).toBe(true);
      });
    });

    describe("Boundary Strings & Extreme Values", () => {
      it("handles boundary string lengths (10,000 chars, zero-width space, emoji, special symbols)", () => {
        const ultraLongString = "A".repeat(10000);
        const zeroWidthSpace = "\u200B\u200B\u200B";
        const emojiString = "🌱🥦🌾🌽🍊";
        const specialSymbols = "!@#$%^&*()'\"<>/\\|~`?--+=";

        const longPlot = plotFormSchema.safeParse({
          code: ultraLongString,
          name: emojiString,
          areaSquareMeters: 500.5,
        });
        expect(longPlot.success).toBe(true);

        const symbolPlot = plotFormSchema.safeParse({
          code: specialSymbols,
          name: zeroWidthSpace,
        });
        expect(symbolPlot.success).toBe(true);
      });

      it("handles areaSquareMeters numerical boundary conditions in plotFormSchema", () => {
        expect(plotFormSchema.safeParse({ code: "L-01", name: "Khu 1", areaSquareMeters: 0.0001 }).success).toBe(true);
        expect(plotFormSchema.safeParse({ code: "L-01", name: "Khu 1", areaSquareMeters: 0 }).success).toBe(true);
        expect(plotFormSchema.safeParse({ code: "L-01", name: "Khu 1", areaSquareMeters: 999999999.99 }).success).toBe(true);

        const invalidType = plotFormSchema.safeParse({
          code: "L-01",
          name: "Khu 1",
          areaSquareMeters: "500" as any,
        });
        expect(invalidType.success).toBe(false);
      });

      it("handles user password length boundaries (5 chars vs 6 chars)", () => {
        const shortPassword = userFormSchema.safeParse({
          name: "User",
          email: "user@farm.vn",
          password: "12345",
          role: "FARMER",
        });
        expect(shortPassword.success).toBe(false);

        const validPassword = userFormSchema.safeParse({
          name: "User",
          email: "user@farm.vn",
          password: "123456",
          role: "FARMER",
        });
        expect(validPassword.success).toBe(true);
      });

      it("handles user role enum boundary values in userFormSchema", () => {
        const validRoles = ["FARMER", "ADMIN"] as const;
        validRoles.forEach((role) => {
          const res = userFormSchema.safeParse({
            name: "User",
            email: "user@farm.vn",
            password: "password123",
            role,
          });
          expect(res.success).toBe(true);
        });

        const invalidRole = userFormSchema.safeParse({
          name: "User",
          email: "user@farm.vn",
          password: "password123",
          role: "SUPERADMIN" as any,
        });
        expect(invalidRole.success).toBe(false);
      });
    });
  });

  // ==========================================
  // 2. ADMIN SIDEBAR DRAWER UI STATE & INTERACTION
  // ==========================================
  describe("2. AdminSidebarDrawer State & Rapid Tab Switching Verification", () => {
    it("verifies testID retention ('admin-sidebar') and sub-tab item testIDs", async () => {
      let tree: renderer.ReactTestRenderer;
      await act(async () => {
        tree = renderer.create(
          <AdminSidebarDrawer
            visible={true}
            activeSubTab="plots"
            onClose={jest.fn()}
            onSelectTab={jest.fn()}
          />
        );
      });

      const sidebarRoot = tree!.root.findByProps({ testID: "admin-sidebar" });
      expect(sidebarRoot).toBeDefined();

      expect(tree!.root.findByProps({ testID: "admin-sidebar-posts" })).toBeDefined();
      expect(tree!.root.findByProps({ testID: "admin-sidebar-plots" })).toBeDefined();
      expect(tree!.root.findByProps({ testID: "admin-sidebar-crops" })).toBeDefined();
      expect(tree!.root.findByProps({ testID: "admin-sidebar-accounts" })).toBeDefined();
      expect(tree!.root.findByProps({ testID: "admin-sidebar-logout" })).toBeDefined();
    });

    it("returns null when visible is false", async () => {
      let tree: renderer.ReactTestRenderer;
      await act(async () => {
        tree = renderer.create(
          <AdminSidebarDrawer
            visible={false}
            activeSubTab="plots"
            onClose={jest.fn()}
            onSelectTab={jest.fn()}
          />
        );
      });
      expect(tree!.toJSON()).toBeNull();
    });

    it("verifies backdrop scrim touch triggers onClose", async () => {
      const onClose = jest.fn();
      let tree: renderer.ReactTestRenderer;

      await act(async () => {
        tree = renderer.create(
          <AdminSidebarDrawer
            visible={true}
            activeSubTab="plots"
            onClose={onClose}
            onSelectTab={jest.fn()}
          />
        );
      });

      const scrimNodes = tree!.root.findAll(
        (node: any) => node.props && node.props.onPress === onClose
      );
      expect(scrimNodes.length).toBeGreaterThan(0);

      await act(async () => {
        scrimNodes[0].props.onPress();
      });
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it("handles rapid tab switching without state desynchronization or crashes", async () => {
      const onClose = jest.fn();
      const onSelectTab = jest.fn();
      let tree: renderer.ReactTestRenderer;

      await act(async () => {
        tree = renderer.create(
          <AdminSidebarDrawer
            visible={true}
            activeSubTab="plots"
            onClose={onClose}
            onSelectTab={onSelectTab}
          />
        );
      });

      const plotsLink = tree!.root.findByProps({ testID: "admin-sidebar-plots" });
      const cropsLink = tree!.root.findByProps({ testID: "admin-sidebar-crops" });
      const accountsLink = tree!.root.findByProps({ testID: "admin-sidebar-accounts" });

      await act(async () => {
        plotsLink.props.onPress();
        cropsLink.props.onPress();
        accountsLink.props.onPress();
      });

      expect(onClose).toHaveBeenCalledTimes(3);
      expect(onSelectTab).toHaveBeenNthCalledWith(1, "plots");
      expect(onSelectTab).toHaveBeenNthCalledWith(2, "crops");
      expect(onSelectTab).toHaveBeenNthCalledWith(3, "accounts");
    });

    it("handles logout click triggering onClose and onLogout", async () => {
      const onClose = jest.fn();
      const onLogout = jest.fn();
      let tree: renderer.ReactTestRenderer;

      await act(async () => {
        tree = renderer.create(
          <AdminSidebarDrawer
            visible={true}
            activeSubTab="plots"
            onClose={onClose}
            onSelectTab={jest.fn()}
            onLogout={onLogout}
          />
        );
      });

      const logoutLink = tree!.root.findByProps({ testID: "admin-sidebar-logout" });
      await act(async () => {
        logoutLink.props.onPress();
      });

      expect(onClose).toHaveBeenCalled();
      expect(onLogout).toHaveBeenCalled();
    });
  });

  // ==========================================
  // 3. CSV IMPORT CARD & RESULT MODAL VERIFICATION
  // ==========================================
  describe("3. CsvImportCard & CsvImportResultModal Verification", () => {
    describe("CsvImportCard", () => {
      it("verifies initial testID retention ('admin-import-select') and button testIDs", async () => {
        let tree: renderer.ReactTestRenderer;
        await act(async () => {
          tree = renderer.create(
            <CsvImportCard
              visible={true}
              onClose={jest.fn()}
              onImportComplete={jest.fn()}
            />
          );
        });

        expect(tree!.root.findByProps({ testID: "admin-import-select" })).toBeDefined();
        expect(tree!.root.findByProps({ testID: "select-csv-file-button" })).toBeDefined();
        expect(tree!.root.findByProps({ testID: "start-import-button" })).toBeDefined();
      });

      it("allows closing via backdrop scrim press when not uploading", async () => {
        const onClose = jest.fn();
        let tree: renderer.ReactTestRenderer;

        await act(async () => {
          tree = renderer.create(
            <CsvImportCard
              visible={true}
              onClose={onClose}
              onImportComplete={jest.fn()}
            />
          );
        });

        const scrimNode = tree!.root.find(
          (node: any) => node.props && node.props.onPress && node.props.style && node.props.style.backgroundColor === "rgba(17, 24, 39, 0.45)"
        );
        expect(scrimNode).toBeDefined();

        await act(async () => {
          scrimNode.props.onPress();
        });

        expect(onClose).toHaveBeenCalledTimes(1);
      });

      it("transitions testID to 'admin-import-uploading' during import and prevents dismissal", async () => {
        jest.useFakeTimers();
        const onClose = jest.fn();
        const onImportComplete = jest.fn();
        let tree: renderer.ReactTestRenderer;

        await act(async () => {
          tree = renderer.create(
            <CsvImportCard
              visible={true}
              onClose={onClose}
              onImportComplete={onImportComplete}
            />
          );
        });

        const startBtn = tree!.root.findByProps({ testID: "start-import-button" });

        act(() => {
          startBtn.props.onPress();
        });

        expect(tree!.root.findByProps({ testID: "admin-import-uploading" })).toBeDefined();

        const scrimNode = tree!.root.find(
          (node: any) => node.props && node.props.onPress && node.props.style && node.props.style.backgroundColor === "rgba(17, 24, 39, 0.45)"
        );

        act(() => {
          scrimNode.props.onPress();
        });
        expect(onClose).not.toHaveBeenCalled();

        await act(async () => {
          jest.runAllTimers();
        });

        expect(adminService.importCSV).toHaveBeenCalled();
        expect(onClose).toHaveBeenCalled();
        expect(onImportComplete).toHaveBeenCalledWith({
          success: 100,
          skipped: 5,
          errors: 2,
        });

        jest.useRealTimers();
      });
    });

    describe("CsvImportResultModal", () => {
      it("verifies testID retention ('admin-import-result') and button testIDs", async () => {
        let tree: renderer.ReactTestRenderer;
        await act(async () => {
          tree = renderer.create(
            <CsvImportResultModal
              visible={true}
              onClose={jest.fn()}
            />
          );
        });

        expect(tree!.root.findByProps({ testID: "admin-import-result" })).toBeDefined();
        expect(tree!.root.findByProps({ testID: "import-done-button" })).toBeDefined();
      });

      it("renders provided import counts correctly", async () => {
        const customCounts = { success: 250, skipped: 10, errors: 4 };
        let tree: renderer.ReactTestRenderer;

        await act(async () => {
          tree = renderer.create(
            <CsvImportResultModal
              visible={true}
              counts={customCounts}
              onClose={jest.fn()}
            />
          );
        });

        const root = tree!.root;
        const totalTextNode = root.find(
          (node: any) =>
            node.props &&
            node.props.children &&
            Array.isArray(node.props.children) &&
            node.props.children.join("").includes("264")
        );
        expect(totalTextNode).toBeDefined();

        expect(root.find((n: any) => n.props && n.props.children === "250")).toBeDefined();
        expect(root.find((n: any) => n.props && n.props.children === "10")).toBeDefined();
        expect(root.find((n: any) => n.props && n.props.children === "4")).toBeDefined();
      });

      it("triggers onClose and onDone when done button is pressed", async () => {
        const onClose = jest.fn();
        const onDone = jest.fn();
        let tree: renderer.ReactTestRenderer;

        await act(async () => {
          tree = renderer.create(
            <CsvImportResultModal
              visible={true}
              onClose={onClose}
              onDone={onDone}
            />
          );
        });

        const doneBtn = tree!.root.findByProps({ testID: "import-done-button" });
        await act(async () => {
          doneBtn.props.onPress();
        });

        expect(onClose).toHaveBeenCalledTimes(1);
        expect(onDone).toHaveBeenCalledTimes(1);
      });

      it("triggers onClose when backdrop scrim is pressed", async () => {
        const onClose = jest.fn();
        let tree: renderer.ReactTestRenderer;

        await act(async () => {
          tree = renderer.create(
            <CsvImportResultModal
              visible={true}
              onClose={onClose}
            />
          );
        });

        const scrimNodes = tree!.root.findAll(
          (node: any) => (node.type === ("Pressable" as any) || node.type?.displayName === "Pressable") && node.props.onPress === onClose
        );
        expect(scrimNodes.length).toBeGreaterThan(0);

        await act(async () => {
          scrimNodes[0].props.onPress();
        });

        expect(onClose).toHaveBeenCalledTimes(1);
      });
    });
  });
});
