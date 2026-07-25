import React from "react";
import renderer, { act } from "react-test-renderer";
import { captureSessionFormSchema } from "@/schemas/formSchemas";
import { MultiPhotoPicker } from "@/components/MultiPhotoPicker";
import { DropdownSelectModal } from "@/components/DropdownSelectModal";
import { GrowthStagePicker } from "@/components/GrowthStagePicker";
import { SeverityRadioGroup } from "@/components/SeverityRadioGroup";
import { GardenPalette } from "@/constants/theme";

// Mocks for camera
jest.mock("expo-image-picker", () => ({
  requestCameraPermissionsAsync: jest.fn().mockResolvedValue({ granted: true }),
  launchCameraAsync: jest.fn().mockResolvedValue({ canceled: true }),
}));

describe("Milestone 3 Challenger — Zod Schema & UI Error Rendering Empirical Verification", () => {
  // ==========================================
  // 1. ZOD SCHEMA VALIDATION RULES CHALLENGES
  // ==========================================
  describe("1. Zod Schema Validation Rules", () => {
    const validBaseData = {
      images: ["file:///data/photo1.jpg"],
      plotId: "L-001",
      cropType: "Cà chua",
      customCrop: "",
      growthStage: "flowering" as const,
      envMode: "outdoor" as const,
      hasLocalMeasurement: false,
      symptomDescription: "Đốm lá màu nâu vàng",
      severity: "Nhẹ" as const,
    };

    it("passes validation when all required fields are validly populated", () => {
      const result = captureSessionFormSchema.safeParse(validBaseData);
      expect(result.success).toBe(true);
    });

    it("triggers error when images array is empty", () => {
      const invalidData = { ...validBaseData, images: [] };
      const result = captureSessionFormSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        const error = result.error.format();
        expect(error.images?._errors).toContain(
          "Vui lòng chụp ít nhất 1 ảnh của cây trồng"
        );
      }
    });

    it("triggers error when cropType is missing or empty string", () => {
      const invalidData = { ...validBaseData, cropType: "" };
      const result = captureSessionFormSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        const error = result.error.format();
        expect(error.cropType?._errors).toContain(
          "Vui lòng chọn loại cây trồng"
        );
      }
    });

    it("triggers error when cropType is 'Khác' and customCrop is undefined", () => {
      const invalidData = { ...validBaseData, cropType: "Khác", customCrop: undefined };
      const result = captureSessionFormSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        const error = result.error.format();
        expect(error.customCrop?._errors).toContain(
          "Vui lòng nhập tên loại cây trồng khác"
        );
      }
    });

    it("triggers error when cropType is 'Khác' and customCrop is empty string", () => {
      const invalidData = { ...validBaseData, cropType: "Khác", customCrop: "" };
      const result = captureSessionFormSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        const error = result.error.format();
        expect(error.customCrop?._errors).toContain(
          "Vui lòng nhập tên loại cây trồng khác"
        );
      }
    });

    it("triggers error when cropType is 'Khác' and customCrop is whitespace only", () => {
      const invalidData = { ...validBaseData, cropType: "Khác", customCrop: "   " };
      const result = captureSessionFormSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        const error = result.error.format();
        expect(error.customCrop?._errors).toContain(
          "Vui lòng nhập tên loại cây trồng khác"
        );
      }
    });

    it("passes validation when cropType is 'Khác' and valid customCrop text is provided", () => {
      const validCustomData = {
        ...validBaseData,
        cropType: "Khác",
        customCrop: "Dưa lưới hữu cơ",
      };
      const result = captureSessionFormSchema.safeParse(validCustomData);
      expect(result.success).toBe(true);
    });

    it("triggers error when growthStage is missing or invalid enum", () => {
      const invalidData = { ...validBaseData, growthStage: undefined as any };
      const result = captureSessionFormSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        const error = result.error.format();
        expect(error.growthStage?._errors).toContain(
          "Vui lòng chọn giai đoạn sinh trưởng"
        );
      }
    });

    it("triggers error when symptomDescription is missing or empty string", () => {
      const invalidData = { ...validBaseData, symptomDescription: "" };
      const result = captureSessionFormSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        const error = result.error.format();
        expect(error.symptomDescription?._errors).toContain(
          "Vui lòng nhập mô tả triệu chứng quan sát được"
        );
      }
    });

    it("triggers error when severity is missing or invalid enum", () => {
      const invalidData = { ...validBaseData, severity: undefined as any };
      const result = captureSessionFormSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        const error = result.error.format();
        expect(error.severity?._errors).toContain(
          "Vui lòng chọn mức độ triệu chứng"
        );
      }
    });
  });

  // ==========================================
  // 2. ERROR UI RENDERING & WARNING ICONS
  // ==========================================
  describe("2. Error UI Rendering & Warning Icons Verification", () => {
    it("renders MultiPhotoPicker with error message and AlertTriangle warning icon", () => {
      let tree: renderer.ReactTestRenderer;
      const errorMessage = "Vui lòng chụp ít nhất 1 ảnh của cây trồng";
      act(() => {
        tree = renderer.create(
          <MultiPhotoPicker
            images={[]}
            onChangeImages={jest.fn()}
            error={errorMessage}
          />
        );
      });
      const root = tree!.root;

      // 1. Verify error message text is present
      const errorTextNode = root.findByProps({ children: errorMessage });
      expect(errorTextNode).toBeDefined();

      // 2. Verify warning icon with GardenPalette.error color exists
      const warningIcons = root.findAll(
        (node: any) => node.props && node.props.color === GardenPalette.error
      );
      expect(warningIcons.length).toBeGreaterThan(0);
    });

    it("renders DropdownSelectModal with error message and AlertTriangle warning icon", () => {
      let tree: renderer.ReactTestRenderer;
      const errorMessage = "Vui lòng chọn loại cây trồng";
      act(() => {
        tree = renderer.create(
          <DropdownSelectModal
            label="Loại cây trồng"
            placeholder="Chọn loại cây"
            options={[{ id: "1", label: "Cà chua" }]}
            onSelect={jest.fn()}
            error={errorMessage}
          />
        );
      });
      const root = tree!.root;

      const errorTextNode = root.findByProps({ children: errorMessage });
      expect(errorTextNode).toBeDefined();

      const warningIcons = root.findAll(
        (node: any) => node.props && node.props.color === GardenPalette.error
      );
      expect(warningIcons.length).toBeGreaterThan(0);
    });

    it("renders GrowthStagePicker with error message and AlertTriangle warning icon", () => {
      let tree: renderer.ReactTestRenderer;
      const errorMessage = "Vui lòng chọn giai đoạn sinh trưởng";
      act(() => {
        tree = renderer.create(
          <GrowthStagePicker
            onSelectStage={jest.fn()}
            error={errorMessage}
          />
        );
      });
      const root = tree!.root;

      const errorRowNode = root.findByProps({ testID: "growth-stage-picker-error" });
      expect(errorRowNode).toBeDefined();

      const errorTextNode = root.findByProps({ children: errorMessage });
      expect(errorTextNode).toBeDefined();

      const warningIcons = root.findAll(
        (node: any) => node.props && node.props.color === GardenPalette.error
      );
      expect(warningIcons.length).toBeGreaterThan(0);
    });

    it("renders SeverityRadioGroup with error message and AlertTriangle warning icon", () => {
      let tree: renderer.ReactTestRenderer;
      const errorMessage = "Vui lòng chọn mức độ triệu chứng";
      act(() => {
        tree = renderer.create(
          <SeverityRadioGroup
            onSelect={jest.fn()}
            error={errorMessage}
          />
        );
      });
      const root = tree!.root;

      const errorTextNode = root.findByProps({ children: errorMessage });
      expect(errorTextNode).toBeDefined();

      const warningIcons = root.findAll(
        (node: any) => node.props && node.props.color === GardenPalette.error
      );
      expect(warningIcons.length).toBeGreaterThan(0);
    });
  });
});
