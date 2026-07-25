import {
  GROWTH_STAGES,
  VALID_GROWTH_STAGE_IDS,
  getGrowthStageById,
  isValidGrowthStage,
  validatePlotId,
} from "@/constants/growthStages";
import { captureImageWithMetadata } from "@/services/cameraService";
import {
  DEFAULT_MOCK_LOCATION,
  formatCoordinates,
  generateIsoTimestamp,
  getCurrentLocation,
  requestLocationPermissions,
  validateCoordinates,
} from "@/services/locationService";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import { Platform } from "react-native";

describe("Milestone 2 Empirical Stress & Boundary Tests", () => {
  // -------------------------------------------------------------
  // 1. Growth Stages Completeness & Edge Cases
  // -------------------------------------------------------------
  describe("1. Growth Stages Completeness & Validation Edge Cases", () => {
    it("contains all 5 standardized growth stages with non-empty fields", () => {
      expect(GROWTH_STAGES).toHaveLength(5);
      expect(VALID_GROWTH_STAGE_IDS).toHaveLength(5);

      const expectedIds = [
        "newly_planted",
        "vegetative",
        "flowering",
        "fruiting",
        "harvest",
      ];
      expect(VALID_GROWTH_STAGE_IDS).toEqual(expectedIds);

      GROWTH_STAGES.forEach((stage) => {
        expect(stage.id).toBeTruthy();
        expect(stage.nameVi).toBeTruthy();
        expect(stage.nameEn).toBeTruthy();
        expect(stage.description).toBeTruthy();
        expect(expectedIds).toContain(stage.id);
      });
    });

    it("isValidGrowthStage boundary checks for invalid IDs and empty/null/undefined inputs", () => {
      // Valid inputs
      expect(isValidGrowthStage("newly_planted")).toBe(true);
      expect(isValidGrowthStage("vegetative")).toBe(true);
      expect(isValidGrowthStage("flowering")).toBe(true);
      expect(isValidGrowthStage("fruiting")).toBe(true);
      expect(isValidGrowthStage("harvest")).toBe(true);

      // Edge cases: case sensitivity
      expect(isValidGrowthStage("NEWLY_PLANTED")).toBe(false);
      expect(isValidGrowthStage("Vegetative")).toBe(false);

      // Edge cases: invalid IDs, spaces, empty string, null, undefined
      expect(isValidGrowthStage("seedling")).toBe(false);
      expect(isValidGrowthStage("harvesting")).toBe(false);
      expect(isValidGrowthStage("  newly_planted  ")).toBe(false);
      expect(isValidGrowthStage("")).toBe(false);
      expect(isValidGrowthStage(null)).toBe(false);
      expect(isValidGrowthStage(undefined)).toBe(false);
      // @ts-ignore
      expect(isValidGrowthStage(123)).toBe(false);
      // @ts-ignore
      expect(isValidGrowthStage({})).toBe(false);
    });

    it("getGrowthStageById handles valid, invalid, empty, and null inputs", () => {
      const stage = getGrowthStageById("harvest");
      expect(stage).toEqual({
        id: "harvest",
        nameVi: "Thu hoạch",
        nameEn: "Harvest",
        description: "Quả chín, đạt độ trưởng thành thu hoạch",
      });

      expect(getGrowthStageById("non_existent")).toBeUndefined();
      expect(getGrowthStageById("")).toBeUndefined();
      expect(getGrowthStageById(null)).toBeUndefined();
      expect(getGrowthStageById(undefined)).toBeUndefined();
    });
  });

  // -------------------------------------------------------------
  // 2. Coordinate Bounds & Boundary Testing (-90/90 lat, -180/180 lon)
  // -------------------------------------------------------------
  describe("2. Coordinate Bounds & Boundary Testing", () => {
    it("validateCoordinates exact boundary testing", () => {
      // Exact boundaries
      expect(validateCoordinates(90, 180)).toBe(true);
      expect(validateCoordinates(-90, -180)).toBe(true);
      expect(validateCoordinates(90, -180)).toBe(true);
      expect(validateCoordinates(-90, 180)).toBe(true);
      expect(validateCoordinates(0, 0)).toBe(true);
      expect(validateCoordinates(10.7769, 106.7009)).toBe(true);
    });

    it("validateCoordinates out-of-range boundary testing", () => {
      // Just past latitude boundaries
      expect(validateCoordinates(90.000001, 0)).toBe(false);
      expect(validateCoordinates(-90.000001, 0)).toBe(false);

      // Just past longitude boundaries
      expect(validateCoordinates(0, 180.000001)).toBe(false);
      expect(validateCoordinates(0, -180.000001)).toBe(false);

      // Significantly out-of-range
      expect(validateCoordinates(180, 90)).toBe(false);
      expect(validateCoordinates(-91, 100)).toBe(false);
      expect(validateCoordinates(10, 181)).toBe(false);
      expect(validateCoordinates(10, -181)).toBe(false);
      expect(validateCoordinates(999, 999)).toBe(false);
    });

    it("validateCoordinates non-numeric & special IEEE 754 float values", () => {
      expect(validateCoordinates(NaN, 106.7)).toBe(false);
      expect(validateCoordinates(10.7, NaN)).toBe(false);
      expect(validateCoordinates(Infinity, 106.7)).toBe(false);
      expect(validateCoordinates(10.7, -Infinity)).toBe(false);
      // @ts-ignore
      expect(validateCoordinates("10.7769", 106.7009)).toBe(false);
      // @ts-ignore
      expect(validateCoordinates(null, 106.7009)).toBe(false);
      // @ts-ignore
      expect(validateCoordinates(undefined, undefined)).toBe(false);
    });

    it("formatCoordinates formatted string and error fallback", () => {
      // Positive lat / lon
      expect(formatCoordinates(10.776889, 106.700806, 4)).toBe(
        "10.7769° N, 106.7008° E",
      );
      // Negative lat / lon
      expect(formatCoordinates(-33.8688, -151.2093, 2)).toBe(
        "33.87° S, 151.21° W",
      );
      // Zero coordinates
      expect(formatCoordinates(0, 0, 4)).toBe("0.0000° N, 0.0000° E");
      // Extreme boundaries
      expect(formatCoordinates(90, 180, 2)).toBe("90.00° N, 180.00° E");
      expect(formatCoordinates(-90, -180, 2)).toBe("90.00° S, 180.00° W");

      // Invalid coordinates fallback
      expect(formatCoordinates(91, 100)).toBe("Invalid coordinates");
      expect(formatCoordinates(0, -181)).toBe("Invalid coordinates");
      expect(formatCoordinates(NaN, 50)).toBe("Invalid coordinates");
    });
  });

  // -------------------------------------------------------------
  // 3. ISO 8601 Timestamp Format Regex Validation
  // -------------------------------------------------------------
  describe("3. ISO 8601 Timestamp Format Regex Validation", () => {
    const iso8601Regex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;

    it("generateIsoTimestamp creates valid ISO 8601 UTC string matching regex", () => {
      const timestamp = generateIsoTimestamp();
      expect(timestamp).toMatch(iso8601Regex);

      const dateObj = new Date(timestamp);
      expect(dateObj.getTime()).not.toBeNaN();
      // Ensure it is UTC (ends with Z)
      expect(timestamp.endsWith("Z")).toBe(true);
    });

    it("generateIsoTimestamp formats custom date objects correctly", () => {
      const fixedDate = new Date(Date.UTC(2026, 6, 23, 10, 30, 45, 123));
      const timestamp = generateIsoTimestamp(fixedDate);
      expect(timestamp).toBe("2026-07-23T10:30:45.123Z");
      expect(timestamp).toMatch(iso8601Regex);
    });
  });

  // -------------------------------------------------------------
  // 4. Plot ID Formatting Rules
  // -------------------------------------------------------------
  describe("4. Plot ID Formatting Rules & Edge Cases", () => {
    it("rejects empty, null, undefined, or whitespace-only Plot IDs", () => {
      expect(validatePlotId("")).toEqual({
        isValid: false,
        error: "Mã số luống không được để trống",
      });
      expect(validatePlotId("   ")).toEqual({
        isValid: false,
        error: "Mã số luống không được để trống",
      });
      expect(validatePlotId(null)).toEqual({
        isValid: false,
        error: "Mã số luống không được để trống",
      });
      expect(validatePlotId(undefined)).toEqual({
        isValid: false,
        error: "Mã số luống không được để trống",
      });
    });

    it("rejects Plot IDs shorter than 2 characters after trimming", () => {
      expect(validatePlotId("A")).toEqual({
        isValid: false,
        error: "Mã số luống phải có ít nhất 2 ký tự",
      });
      expect(validatePlotId(" 1 ")).toEqual({
        isValid: false,
        error: "Mã số luống phải có ít nhất 2 ký tự",
      });
      expect(validatePlotId("-")).toEqual({
        isValid: false,
        error: "Mã số luống phải có ít nhất 2 ký tự",
      });
    });

    it("rejects Plot IDs containing invalid special characters or spaces", () => {
      const invalidCases = [
        "LUONG@01",
        "PLOT#1",
        "ROW 01", // spaces inside
        "PLOT!",
        "PLOT.1",
        "L-01/A",
        "PLOT$",
        "LUONG+01",
      ];

      invalidCases.forEach((code) => {
        const result = validatePlotId(code);
        expect(result.isValid).toBe(false);
        expect(result.error).toBe(
          "Mã số luống chỉ bao gồm chữ cái, chữ số, dấu - hoặc _",
        );
      });
    });

    it("accepts valid Plot IDs (min 2 chars, alphanumeric, hyphens, underscores, with leading/trailing whitespace)", () => {
      const validCases = [
        "L1",
        "LUONG-01",
        "PLOT_A2",
        "ROW123",
        "a-b_c",
        "  LUONG-01  ", // trimmed to LUONG-01
        "12345",
        "A_B-C_123",
      ];

      validCases.forEach((code) => {
        const result = validatePlotId(code);
        expect(result.isValid).toBe(true);
        expect(result.error).toBeUndefined();
      });
    });
  });

  // -------------------------------------------------------------
  // 5. Location Permission Rejection Handling & Fallback
  // -------------------------------------------------------------
  describe("5. Location Permission Rejection Handling & Fallback", () => {
    const originalPlatform = Platform.OS;

    afterEach(() => {
      Platform.OS = originalPlatform;
      jest.clearAllMocks();
    });

    it("requestLocationPermissions returns false when permission is denied or throws error", async () => {
      Platform.OS = "ios";
      (
        Location.requestForegroundPermissionsAsync as jest.Mock
      ).mockResolvedValueOnce({
        status: "denied",
      });

      const granted = await requestLocationPermissions();
      expect(granted).toBe(false);

      (
        Location.requestForegroundPermissionsAsync as jest.Mock
      ).mockRejectedValueOnce(new Error("Permission system crash"));
      const errorResult = await requestLocationPermissions();
      expect(errorResult).toBe(false);
    });

    it("getCurrentLocation falls back to DEFAULT_MOCK_LOCATION when permission is denied", async () => {
      Platform.OS = "android";
      (
        Location.requestForegroundPermissionsAsync as jest.Mock
      ).mockResolvedValueOnce({
        status: "denied",
      });

      const location = await getCurrentLocation();
      expect(location.isMocked).toBe(true);
      expect(location.latitude).toBe(DEFAULT_MOCK_LOCATION.latitude);
      expect(location.longitude).toBe(DEFAULT_MOCK_LOCATION.longitude);
      expect(location.accuracy).toBe(DEFAULT_MOCK_LOCATION.accuracy);
      expect(location.timestamp).toMatch(
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/,
      );
    });

    it("getCurrentLocation falls back to DEFAULT_MOCK_LOCATION when Location API throws an exception", async () => {
      Platform.OS = "ios";
      (
        Location.requestForegroundPermissionsAsync as jest.Mock
      ).mockResolvedValueOnce({
        status: "granted",
      });
      (Location.getCurrentPositionAsync as jest.Mock).mockRejectedValueOnce(
        new Error("Location services disabled by user"),
      );

      const location = await getCurrentLocation();
      expect(location.isMocked).toBe(true);
      expect(location.latitude).toBe(DEFAULT_MOCK_LOCATION.latitude);
      expect(location.longitude).toBe(DEFAULT_MOCK_LOCATION.longitude);
    });

    it("getCurrentLocation returns real location when permission is granted and GPS is available", async () => {
      Platform.OS = "ios";
      (
        Location.requestForegroundPermissionsAsync as jest.Mock
      ).mockResolvedValueOnce({
        status: "granted",
      });

      const mockGpsTimestamp = Date.now();
      (Location.getCurrentPositionAsync as jest.Mock).mockResolvedValueOnce({
        coords: {
          latitude: 10.8231,
          longitude: 106.6297,
          accuracy: 3.2,
        },
        timestamp: mockGpsTimestamp,
      });

      const location = await getCurrentLocation();
      expect(location.isMocked).toBe(false);
      expect(location.latitude).toBe(10.8231);
      expect(location.longitude).toBe(106.6297);
      expect(location.accuracy).toBe(3.2);
    });

    it("captureImageWithMetadata captures image and fetches metadata concurrently with fallback", async () => {
      (ImagePicker.launchCameraAsync as jest.Mock).mockResolvedValueOnce({
        canceled: false,
        assets: [{ uri: "file:///path/to/photo.jpg" }],
      });

      const result = await captureImageWithMetadata();
      expect(result.uri).toBe("file:///path/to/photo.jpg");
      expect(result.location).toBeDefined();
      expect(result.timestamp).toMatch(
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/,
      );
    });

    it("captureImageWithMetadata blocks gallery fallback and rejects if camera fails", async () => {
      // Camera fails or is canceled
      (ImagePicker.launchCameraAsync as jest.Mock).mockResolvedValueOnce({
        canceled: true,
        assets: [],
      });

      await expect(captureImageWithMetadata()).rejects.toThrow(
        "Image capture canceled",
      );
    });
  });
});
