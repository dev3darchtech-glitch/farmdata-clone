import { StorageDestinationPicker } from "@/components/StorageDestinationPicker";
import { SymptomEvaluator } from "@/components/SymptomEvaluator";
import {
  buildGoogleDriveMultipartBody,
  saveToLocalStorage,
  uploadToGoogleDrive,
} from "@/services/storageService";
import {
  classifySymptomSeverity,
  validateSymptomData,
  validateSymptomDescription,
  validateSymptomPercentage,
} from "@/services/symptomService";
import { DataRecord } from "@/types";
import * as FileSystem from "expo-file-system";
import React from "react";
import renderer, { act } from "react-test-renderer";

jest.mock(
  "expo-file-system",
  () => ({
    documentDirectory: "/mock/documents/",
    EncodingType: { UTF8: "utf8" },
    getInfoAsync: jest.fn().mockResolvedValue({ exists: true }),
    makeDirectoryAsync: jest.fn().mockResolvedValue(true),
    writeAsStringAsync: jest.fn().mockResolvedValue(true),
  }),
  { virtual: true },
);

describe("Milestone 4 Challenger Stress Test Suite", () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
    jest.clearAllMocks();
  });

  // ==========================================
  // 1. Symptom Severity Classification & Boundary Matrix
  // ==========================================
  describe("1. Symptom Severity Boundary & Input Matrix (symptomService.ts)", () => {
    describe("classifySymptomSeverity boundary checks", () => {
      it("classifies exact specified values (0, 10, 10.0001, 25, 25.0001, 50, 50.0001, 75, 100)", () => {
        expect(classifySymptomSeverity(0)).toBe("Chớm bệnh");
        expect(classifySymptomSeverity(10)).toBe("Chớm bệnh");
        expect(classifySymptomSeverity(10.0001)).toBe("Nhẹ");
        expect(classifySymptomSeverity(25)).toBe("Nhẹ");
        expect(classifySymptomSeverity(25.0001)).toBe("Vừa");
        expect(classifySymptomSeverity(50)).toBe("Vừa");
        expect(classifySymptomSeverity(50.0001)).toBe("Rất nặng");
        expect(classifySymptomSeverity(75)).toBe("Rất nặng");
        expect(classifySymptomSeverity(100)).toBe("Rất nặng");
      });

      it("analyzes out-of-range & edge values (-1, 101, NaN)", () => {
        // -1 <= 10 is true -> returns 'Chớm bệnh'
        expect(classifySymptomSeverity(-1)).toBe("Chớm bệnh");

        // 101 > 50 -> returns 'Rất nặng'
        expect(classifySymptomSeverity(101)).toBe("Rất nặng");

        // NaN <= 10 is false, NaN <= 25 is false, NaN <= 50 is false -> falls back to 'Rất nặng'
        expect(classifySymptomSeverity(NaN)).toBe("Rất nặng");
      });
    });

    describe("validateSymptomPercentage", () => {
      it("validates 0 to 100 inclusive as valid", () => {
        [0, 0.0001, 10, 10.0001, 25, 25.0001, 50, 50.0001, 99.99, 100].forEach(
          (val) => {
            const res = validateSymptomPercentage(val);
            expect(res.isValid).toBe(true);
            expect(res.error).toBeUndefined();
          },
        );
      });

      it("invalidates negative numbers, overflow (> 100), NaN, and non-numbers", () => {
        expect(validateSymptomPercentage(-0.0001).isValid).toBe(false);
        expect(validateSymptomPercentage(-1).isValid).toBe(false);
        expect(validateSymptomPercentage(100.0001).isValid).toBe(false);
        expect(validateSymptomPercentage(101).isValid).toBe(false);
        expect(validateSymptomPercentage(NaN).isValid).toBe(false);
        expect(validateSymptomPercentage(null as any).isValid).toBe(false);
        expect(validateSymptomPercentage(undefined as any).isValid).toBe(false);
        expect(validateSymptomPercentage("50" as any).isValid).toBe(false);
      });
    });

    describe("validateSymptomDescription", () => {
      it("validates non-empty string", () => {
        expect(validateSymptomDescription("Đốm vàng lá").isValid).toBe(true);
        expect(validateSymptomDescription("🌱 Rệp sáp 🐛").isValid).toBe(true);
      });

      it("invalidates empty, whitespace, null, or non-string description", () => {
        expect(validateSymptomDescription("").isValid).toBe(false);
        expect(validateSymptomDescription("   \n\t ").isValid).toBe(false);
        expect(validateSymptomDescription(null as any).isValid).toBe(false);
        expect(validateSymptomDescription(undefined as any).isValid).toBe(
          false,
        );
        expect(validateSymptomDescription(123 as any).isValid).toBe(false);
      });
    });

    describe("validateSymptomData", () => {
      it("validates a complete valid symptom payload", () => {
        const result = validateSymptomData({
          description: "Héo ruội lá",
          percentageArea: 30,
        });
        expect(result.isValid).toBe(true);
        expect(result.errors).toEqual({});
      });

      it("collects multiple validation errors on empty or invalid payload", () => {
        const result = validateSymptomData({});
        expect(result.isValid).toBe(false);
        expect(result.errors.description).toBeDefined();
        expect(result.errors.percentageArea).toBeDefined();
      });

      it("collects errors for out-of-range percentageArea", () => {
        const result = validateSymptomData({
          description: "Valid desc",
          percentageArea: 150,
        });
        expect(result.isValid).toBe(false);
        expect(result.errors.percentageArea).toBeDefined();
        expect(result.errors.description).toBeUndefined();
      });
    });
  });

  // ==========================================
  // 2. Storage Service & Google Drive Multipart Builder Stress
  // ==========================================
  describe("2. Storage Service & Multipart Protocol Verification (storageService.ts)", () => {
    const sampleRecord: DataRecord = {
      id: "REC-M4-001",
      user: { id: "usr_m4", email: "m4@agri.org", name: "Tester M4" },
      plotId: "PLOT-M4",
      imageUri: "file:///storage/m4.jpg",
      location: {
        latitude: 10.5,
        longitude: 106.5,
        accuracy: 2.0,
        timestamp: "2026-07-23T00:00:00Z",
      },
      growthStage: "flowering",
      environmentalData: {
        mode: "outdoor",
        current: {
          temperature: 30,
          lightUvIndex: 11,
          windSpeed: 10,
          co2Level: 410,
        },
        t24: { temperature: 29, lightUvIndex: 10, windSpeed: 9, co2Level: 410 },
        t48: { temperature: 28, lightUvIndex: 9, windSpeed: 8, co2Level: 410 },
      },
      symptomData: {
        description: "Đốm đen",
        percentageArea: 18,
        severity: "Nhẹ",
      },
      storageDestination: "gdrive",
      createdAt: "2026-07-23T00:00:00Z",
    };

    describe("buildGoogleDriveMultipartBody structure and delimiters", () => {
      it("inspects boundary formatting, headers, JSON payload, and closing delimiter", () => {
        const metadata = {
          name: "record_REC-M4-001.json",
          mimeType: "application/json",
        };
        const fileContent = JSON.stringify(sampleRecord, null, 2);
        const boundary = "test_boundary_abc";

        const body = buildGoogleDriveMultipartBody(
          metadata,
          fileContent,
          boundary,
        );

        // Verify boundary delimiters
        expect(body).toContain(`--${boundary}\r\n`);
        expect(body).toContain(`\r\n--${boundary}--`);
        expect(body).toContain("Content-Type: application/json; charset=UTF-8");
        expect(body).toContain("Content-Type: application/json");
        expect(body).toContain(JSON.stringify(metadata));
        expect(body).toContain(fileContent);

        // Check preamble format: note body begins with '\r\n--boundary'
        expect(body.startsWith(`\r\n--${boundary}\r\n`)).toBe(true);
      });
    });

    describe("saveToLocalStorage", () => {
      it("saves record locally and formats path correctly", async () => {
        const res = await saveToLocalStorage(sampleRecord);
        expect(res.success).toBe(true);
        expect(res.destination).toBe("local");
        expect(res.filePath).toBe(
          "/mock/documents/data_records/record_REC-M4-001.json",
        );
        expect(res.record?.localFilePath).toBe(res.filePath);
      });

      it("creates missing directories when needed", async () => {
        (FileSystem.getInfoAsync as jest.Mock).mockResolvedValueOnce({
          exists: false,
        });
        await saveToLocalStorage(sampleRecord);
        expect(FileSystem.makeDirectoryAsync).toHaveBeenCalledWith(
          "/mock/documents/data_records/",
          { intermediates: true },
        );
      });

      it("returns failure object on file write error", async () => {
        (FileSystem.writeAsStringAsync as jest.Mock).mockRejectedValueOnce(
          new Error("Permission denied"),
        );
        const res = await saveToLocalStorage(sampleRecord);
        expect(res.success).toBe(false);
        expect(res.destination).toBe("local");
        expect(res.error).toBe("Permission denied");
      });
    });

    describe("uploadToGoogleDrive online and fallback behavior", () => {
      it("executes online upload when token is valid and server responds 200", async () => {
        global.fetch = jest.fn().mockResolvedValueOnce({
          ok: true,
          json: jest.fn().mockResolvedValueOnce({ id: "real_gdrive_id_999" }),
        } as any);

        const res = await uploadToGoogleDrive(
          sampleRecord,
          "valid_oauth_token",
        );
        expect(res.success).toBe(true);
        expect(res.destination).toBe("gdrive");
        expect(res.driveFileId).toBe("real_gdrive_id_999");
        expect(res.isFallback).toBe(false);
      });

      it("falls back to mock drive file ID when accessToken is missing", async () => {
        const mockFetch = jest.fn();
        global.fetch = mockFetch;

        const res = await uploadToGoogleDrive(sampleRecord, undefined);
        expect(mockFetch).not.toHaveBeenCalled();
        expect(res.success).toBe(true);
        expect(res.destination).toBe("gdrive");
        expect(res.isFallback).toBe(true);
        expect(res.driveFileId).toContain("mock_gdrive_REC-M4-001_");
      });

      it("falls back to mock drive file ID when accessToken starts with mock_", async () => {
        const mockFetch = jest.fn();
        global.fetch = mockFetch;

        const res = await uploadToGoogleDrive(
          sampleRecord,
          "mock_access_token",
        );
        expect(mockFetch).not.toHaveBeenCalled();
        expect(res.success).toBe(true);
        expect(res.isFallback).toBe(true);
      });

      it("falls back gracefully when fetch network call rejects", async () => {
        global.fetch = jest
          .fn()
          .mockRejectedValueOnce(new Error("Network request failed"));

        const res = await uploadToGoogleDrive(sampleRecord, "valid_token");
        expect(res.success).toBe(true);
        expect(res.isFallback).toBe(true);
        expect(res.error).toBe("Network request failed");
        expect(res.driveFileId).toContain("mock_gdrive_REC-M4-001_");
      });

      it("falls back gracefully when HTTP API returns error status code (e.g., 401)", async () => {
        global.fetch = jest.fn().mockResolvedValueOnce({
          ok: false,
          status: 401,
          text: jest.fn().mockResolvedValueOnce("Unauthorized token"),
        } as any);

        const res = await uploadToGoogleDrive(sampleRecord, "expired_token");
        expect(res.success).toBe(true);
        expect(res.isFallback).toBe(true);
        expect(res.error).toContain("API Upload failed (401)");
      });
    });
  });

  // ==========================================
  // 3. SymptomEvaluator Component Props & State Tests
  // ==========================================
  describe("3. SymptomEvaluator Component Props & Interaction Tests", () => {
    it("renders component tree and displays severity badge according to percentageArea", () => {
      const mockOnChangeDesc = jest.fn();
      const mockOnChangePct = jest.fn();

      let component: renderer.ReactTestRenderer;
      act(() => {
        component = renderer.create(
          <SymptomEvaluator
            description="Bệnh thán thư"
            onChangeDescription={mockOnChangeDesc}
            percentageArea={15}
            onChangePercentageArea={mockOnChangePct}
          />,
        );
      });

      const root = component!.root;
      const severityBadge = root.findByProps({
        testID: "symptom-severity-badge",
      });
      expect(severityBadge).toBeDefined();

      const badgeText = severityBadge.findByType("Text");
      expect(badgeText.props.children.join("")).toContain("Nhẹ");
    });

    it("triggers onChangeDescription when TextInput text changes", () => {
      const mockOnChangeDesc = jest.fn();
      const mockOnChangePct = jest.fn();

      let component: renderer.ReactTestRenderer;
      act(() => {
        component = renderer.create(
          <SymptomEvaluator
            description=""
            onChangeDescription={mockOnChangeDesc}
            percentageArea={5}
            onChangePercentageArea={mockOnChangePct}
          />,
        );
      });

      const descInput = component!.root.findByProps({
        testID: "symptom-description-input",
      });
      act(() => {
        descInput.props.onChangeText("Cháy lá cào cào");
      });

      expect(mockOnChangeDesc).toHaveBeenCalledWith("Cháy lá cào cào");
    });

    it("triggers preset buttons (5, 15, 35, 75) with exact percentage values", () => {
      const mockOnChangeDesc = jest.fn();
      const mockOnChangePct = jest.fn();

      let component: renderer.ReactTestRenderer;
      act(() => {
        component = renderer.create(
          <SymptomEvaluator
            description="Test"
            onChangeDescription={mockOnChangeDesc}
            percentageArea={0}
            onChangePercentageArea={mockOnChangePct}
          />,
        );
      });

      [5, 15, 35, 75].forEach((preset) => {
        const chip = component!.root.findByProps({
          testID: `symptom-preset-${preset}`,
        });
        act(() => {
          chip.props.onPress();
        });
        expect(mockOnChangePct).toHaveBeenCalledWith(preset);
      });
    });

    it("handles stepper buttons (+5%, +1%, -1%, -5%) with boundary clamping [0, 100]", () => {
      const mockOnChangeDesc = jest.fn();
      const mockOnChangePct = jest.fn();

      // Test stepper from 10%
      let component: renderer.ReactTestRenderer;
      act(() => {
        component = renderer.create(
          <SymptomEvaluator
            description="Test"
            onChangeDescription={mockOnChangeDesc}
            percentageArea={10}
            onChangePercentageArea={mockOnChangePct}
          />,
        );
      });

      const root = component!.root;

      // +5% button -> 15
      act(() => {
        root.findByProps({ testID: "symptom-step-plus" }).props.onPress();
      });
      expect(mockOnChangePct).toHaveBeenCalledWith(15);

      // +1% button -> 11
      act(() => {
        root.findByProps({ testID: "symptom-step-plus-one" }).props.onPress();
      });
      expect(mockOnChangePct).toHaveBeenCalledWith(11);

      // -1% button -> 9
      act(() => {
        root.findByProps({ testID: "symptom-step-minus-one" }).props.onPress();
      });
      expect(mockOnChangePct).toHaveBeenCalledWith(9);

      // -5% button -> 5
      act(() => {
        root.findByProps({ testID: "symptom-step-minus" }).props.onPress();
      });
      expect(mockOnChangePct).toHaveBeenCalledWith(5);
    });

    it("clamps stepper calculations at lower (0%) and upper (100%) limits", () => {
      const mockOnChangePct = jest.fn();

      // At 2%: pressing -5% should clamp to 0%
      let compAt2: renderer.ReactTestRenderer;
      act(() => {
        compAt2 = renderer.create(
          <SymptomEvaluator
            description="Test"
            onChangeDescription={() => {}}
            percentageArea={2}
            onChangePercentageArea={mockOnChangePct}
          />,
        );
      });
      act(() => {
        compAt2.root
          .findByProps({ testID: "symptom-step-minus" })
          .props.onPress();
      });
      expect(mockOnChangePct).toHaveBeenCalledWith(0);

      // At 98%: pressing +5% should clamp to 100%
      let compAt98: renderer.ReactTestRenderer;
      act(() => {
        compAt98 = renderer.create(
          <SymptomEvaluator
            description="Test"
            onChangeDescription={() => {}}
            percentageArea={98}
            onChangePercentageArea={mockOnChangePct}
          />,
        );
      });
      act(() => {
        compAt98.root
          .findByProps({ testID: "symptom-step-plus" })
          .props.onPress();
      });
      expect(mockOnChangePct).toHaveBeenCalledWith(100);
    });

    it("renders error messages when errors prop is populated", () => {
      let component: renderer.ReactTestRenderer;
      act(() => {
        component = renderer.create(
          <SymptomEvaluator
            description=""
            onChangeDescription={() => {}}
            percentageArea={150}
            onChangePercentageArea={() => {}}
            errors={{
              description: "Mô tả triệu chứng bệnh không được để trống",
              percentageArea: "Tỷ lệ diện tích bị bệnh phải từ 0% đến 100%",
            }}
          />,
        );
      });

      const root = component!.root;
      const descError = root.findByProps({
        testID: "symptom-description-error",
      });
      const pctError = root.findByProps({ testID: "symptom-percentage-error" });

      expect(descError).toBeDefined();
      expect(pctError).toBeDefined();
    });
  });

  // ==========================================
  // 4. StorageDestinationPicker Component Tests
  // ==========================================
  describe("4. StorageDestinationPicker Component Tests", () => {
    it("renders local and gdrive options with active selection state for local", () => {
      const mockSelect = jest.fn();
      let component: renderer.ReactTestRenderer;

      act(() => {
        component = renderer.create(
          <StorageDestinationPicker
            destination="local"
            onSelectDestination={mockSelect}
          />,
        );
      });

      const root = component!.root;
      const localBtn = root.findByProps({ testID: "destination-local-btn" });
      const gdriveBtn = root.findByProps({ testID: "destination-gdrive-btn" });

      expect(localBtn.props.accessibilityState).toEqual({ selected: true });
      expect(gdriveBtn.props.accessibilityState).toEqual({ selected: false });

      // Click gdrive button
      act(() => {
        gdriveBtn.props.onPress();
      });
      expect(mockSelect).toHaveBeenCalledWith("gdrive");
    });

    it('renders gdrive active selection state when destination="gdrive"', () => {
      const mockSelect = jest.fn();
      let component: renderer.ReactTestRenderer;

      act(() => {
        component = renderer.create(
          <StorageDestinationPicker
            destination="gdrive"
            onSelectDestination={mockSelect}
          />,
        );
      });

      const root = component!.root;
      const localBtn = root.findByProps({ testID: "destination-local-btn" });
      const gdriveBtn = root.findByProps({ testID: "destination-gdrive-btn" });

      expect(localBtn.props.accessibilityState).toEqual({ selected: false });
      expect(gdriveBtn.props.accessibilityState).toEqual({ selected: true });

      // Click local button
      act(() => {
        localBtn.props.onPress();
      });
      expect(mockSelect).toHaveBeenCalledWith("local");
    });
  });
});
