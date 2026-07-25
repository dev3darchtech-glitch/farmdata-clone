import React from "react";
import ReactTestRenderer, { act } from "react-test-renderer";
import {
  loginFormSchema,
  captureSessionFormSchema,
  plotFormSchema,
  cropFormSchema,
  userFormSchema,
} from "../schemas/formSchemas";
import { importCSV, csvRowSchema } from "../services/adminService";
import CsvImportCard from "../components/management/CsvImportCard";
import CsvImportResultModal from "../components/management/CsvImportResultModal";
import AdminSidebarDrawer from "../components/management/AdminSidebarDrawer";
import ManagementScreen from "../app/(tabs)/management";

describe("Milestone 3 Iteration 2 - Empirical Adversarial Test Suite", () => {
  describe("1. Zod Schema Verification", () => {
    it("validates loginFormSchema correct and edge inputs", () => {
      const valid = loginFormSchema.safeParse({
        email: "test@example.com",
        password: "secretpassword",
      });
      expect(valid.success).toBe(true);

      const invalidEmail = loginFormSchema.safeParse({
        email: "not-an-email",
        password: "123",
      });
      expect(invalidEmail.success).toBe(false);

      const emptyEmail = loginFormSchema.safeParse({
        email: "",
        password: "123",
      });
      expect(emptyEmail.success).toBe(false);
    });

    it("validates captureSessionFormSchema conditional customCrop", () => {
      const validNormal = captureSessionFormSchema.safeParse({
        images: ["img1.jpg"],
        cropType: "Lúa",
        growthStage: "vegetative",
        envMode: "outdoor",
        symptomDescription: "Vàng lá",
        severity: "Nhẹ",
      });
      expect(validNormal.success).toBe(true);

      const invalidKhacWithoutCustom = captureSessionFormSchema.safeParse({
        images: ["img1.jpg"],
        cropType: "Khác",
        customCrop: "   ",
        growthStage: "vegetative",
        envMode: "outdoor",
        symptomDescription: "Vàng lá",
        severity: "Nhẹ",
      });
      expect(invalidKhacWithoutCustom.success).toBe(false);

      const validKhacWithCustom = captureSessionFormSchema.safeParse({
        images: ["img1.jpg"],
        cropType: "Khác",
        customCrop: "Cây dưa lưới",
        growthStage: "vegetative",
        envMode: "outdoor",
        symptomDescription: "Vàng lá",
        severity: "Nhẹ",
      });
      expect(validKhacWithCustom.success).toBe(true);
    });

    it("validates plotFormSchema, cropFormSchema, userFormSchema constraints", () => {
      expect(plotFormSchema.safeParse({ code: "P-100", name: "  Luống 1  " }).success).toBe(true);
      expect(plotFormSchema.safeParse({ code: "", name: "Luống 1" }).success).toBe(false);

      expect(cropFormSchema.safeParse({ name: "Cà chua", category: "Rau củ" }).success).toBe(true);
      expect(cropFormSchema.safeParse({ name: "", category: "Rau củ" }).success).toBe(false);

      expect(userFormSchema.safeParse({ name: "Admin", email: "admin@test.com", password: "123456", role: "ADMIN" }).success).toBe(true);
      expect(userFormSchema.safeParse({ name: "Admin", email: "admin@test.com", password: "123", role: "ADMIN" }).success).toBe(false);
    });

    it("validates csvRowSchema for plot import", () => {
      expect(csvRowSchema.safeParse({ plot_code: "P-01", name: "Luống 1", area: 100 }).success).toBe(true);
      expect(csvRowSchema.safeParse({ plot_code: "", name: "Luống 1" }).success).toBe(false);
      expect(csvRowSchema.safeParse({ plot_code: "P-01", name: "" }).success).toBe(false);
      expect(csvRowSchema.safeParse({ plot_code: "P-01", name: "Luống 1", area: "not-a-number" as any }).success).toBe(false);
    });
  });

  describe("2. Adversarial CSV Parsing & Whitespace & Duplicate Row Counting", () => {
    it("handles null, undefined, empty string content gracefully", async () => {
      expect(await importCSV()).toEqual({ success: 0, skipped: 0, errors: 0 });
      expect(await importCSV(null)).toEqual({ success: 0, skipped: 0, errors: 0 });
      expect(await importCSV("   \n\n  ")).toEqual({ success: 0, skipped: 0, errors: 0 });
    });

    it("handles object with text() method or toString() method", async () => {
      const mockFile = {
        text: async () => "plot_code,name,area\nP-10,Luống 10,500",
      };
      expect(await importCSV(mockFile)).toEqual({ success: 1, skipped: 0, errors: 0 });

      const mockObj = {
        toString: () => "plot_code,name,area\nP-11,Luống 11,200",
      };
      expect(await importCSV(mockObj)).toEqual({ success: 1, skipped: 0, errors: 0 });
    });

    it("handles Windows CRLF and Unix LF line endings", async () => {
      const crlfContent = "plot_code,name,area\r\nP-01,Luống 1,100\r\nP-02,Luống 2,200\r\n";
      const result = await importCSV(crlfContent);
      // Row 1: P-01 (success), Row 2: P-02 (success), trailing empty line is trimmed & skipped (skipped: 1)
      expect(result).toEqual({ success: 2, skipped: 1, errors: 0 });
    });

    it("handles quotes around values and extra whitespace in headers and cells", async () => {
      const csv = ` "plot_code" , "name" , "area" 
                     "P-101"   ,   "Luống 101"   ,   "150"   
                     'P-102'   ,   'Luống 102'   ,   '250'   `;
      const result = await importCSV(csv);
      expect(result).toEqual({ success: 2, skipped: 0, errors: 0 });
    });

    it("handles case-insensitive header column mapping variations", async () => {
      const csv1 = "CODE,PLOT_NAME,AREASQUAREMETERS\nP-01,Luống A,100";
      expect(await importCSV(csv1)).toEqual({ success: 1, skipped: 0, errors: 0 });

      const csv2 = "plotcode,plotname,area\nP-02,Luống B,120";
      expect(await importCSV(csv2)).toEqual({ success: 1, skipped: 0, errors: 0 });
    });

    it("handles case-insensitive deduplication of plot codes", async () => {
      const csv = `plot_code,name,area
P-001,Luống 1,100
p-001,Luống 1 Duplicate,100
P-002,Luống 2,150
P-001,Luống 1 Again,100`;
      const result = await importCSV(csv);
      // P-001 success, p-001 skipped (case-insensitive dup), P-002 success, P-001 skipped
      expect(result).toEqual({ success: 2, skipped: 2, errors: 0 });
    });

    it("handles invalid numeric areas as errors", async () => {
      const csv = `plot_code,name,area
P-001,Luống 1,invalid_number
P-002,Luống 2,100`;
      const result = await importCSV(csv);
      expect(result).toEqual({ success: 1, skipped: 0, errors: 1 });
    });

    it("handles empty lines between rows as skipped", async () => {
      const csv = `plot_code,name,area
P-001,Luống 1,100

P-002,Luống 2,200

`;
      const result = await importCSV(csv);
      // Row 1: P-001 (success), Row 2: empty (skipped: 1), Row 3: P-002 (success), Row 4: empty (skipped: 1)
      expect(result.success).toBe(2);
      expect(result.skipped).toBe(2);
      expect(result.errors).toBe(0);
    });

    it("handles missing mandatory fields (plot_code or name) as errors", async () => {
      const csv = `plot_code,name,area
,Luống 1,100
P-002,,150`;
      const result = await importCSV(csv);
      expect(result.errors).toBe(2);
    });
  });

  describe("3. UI TestIDs Retention & Component Verification", () => {
    it("retains 'admin-sidebar' testID and menu item testIDs in AdminSidebarDrawer", () => {
      let tree: ReactTestRenderer.ReactTestRenderer | null = null;
      act(() => {
        tree = ReactTestRenderer.create(
          <AdminSidebarDrawer
            visible={true}
            activeSubTab="plots"
            onClose={() => {}}
            onSelectTab={() => {}}
          />
        );
      });

      const sidebarNode = tree!.root.findByProps({ testID: "admin-sidebar" });
      expect(sidebarNode).toBeDefined();

      const plotsMenuItem = tree!.root.findByProps({ testID: "admin-sidebar-plots" });
      expect(plotsMenuItem).toBeDefined();

      const cropsMenuItem = tree!.root.findByProps({ testID: "admin-sidebar-crops" });
      expect(cropsMenuItem).toBeDefined();

      const accountsMenuItem = tree!.root.findByProps({ testID: "admin-sidebar-accounts" });
      expect(accountsMenuItem).toBeDefined();

      act(() => {
        tree!.unmount();
      });
    });

    it("retains 'admin-import-select' and 'admin-import-uploading' testIDs in CsvImportCard", async () => {
      let tree: ReactTestRenderer.ReactTestRenderer | null = null;
      act(() => {
        tree = ReactTestRenderer.create(
          <CsvImportCard
            visible={true}
            onClose={() => {}}
            onImportComplete={() => {}}
          />
        );
      });

      // Initially importUploading is false -> testID should be admin-import-select
      const selectNode = tree!.root.findByProps({ testID: "admin-import-select" });
      expect(selectNode).toBeDefined();

      // Trigger start import button
      const startBtn = tree!.root.findByProps({ testID: "start-import-button" });
      await act(async () => {
        startBtn.props.onPress();
      });

      // While uploading -> testID should transition to admin-import-uploading
      const uploadingNode = tree!.root.findByProps({ testID: "admin-import-uploading" });
      expect(uploadingNode).toBeDefined();

      act(() => {
        tree!.unmount();
      });
    });

    it("retains 'admin-import-result' testID in CsvImportResultModal", () => {
      let tree: ReactTestRenderer.ReactTestRenderer | null = null;
      act(() => {
        tree = ReactTestRenderer.create(
          <CsvImportResultModal
            visible={true}
            onClose={() => {}}
            counts={{ success: 10, skipped: 2, errors: 1 }}
          />
        );
      });

      const resultNode = tree!.root.findByProps({ testID: "admin-import-result" });
      expect(resultNode).toBeDefined();

      const doneBtn = tree!.root.findByProps({ testID: "import-done-button" });
      expect(doneBtn).toBeDefined();

      act(() => {
        tree!.unmount();
      });
    });

    it("retains 'management-screen' testID in ManagementScreen", () => {
      let tree: ReactTestRenderer.ReactTestRenderer | null = null;
      act(() => {
        tree = ReactTestRenderer.create(<ManagementScreen />);
      });

      const screenNode = tree!.root.findByProps({ testID: "management-screen" });
      expect(screenNode).toBeDefined();

      act(() => {
        tree!.unmount();
      });
    });
  });
});
