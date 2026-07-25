import {
  getGrowthStageById,
  isValidGrowthStage,
  validatePlotId,
} from "@/constants/growthStages";
import * as authService from "@/services/authService";
import {
  buildGoogleDriveMultipartBody,
  saveToLocalStorage,
  uploadToGoogleDrive,
} from "@/services/storageService";
import {
  classifySymptomSeverity,
  validateSymptomDescription,
  validateSymptomPercentage,
} from "@/services/symptomService";
import {
  fetchOutdoorWeather,
  PHYSICAL_BOUNDS,
  validateGreenhouseParams,
} from "@/services/weatherService";
import { AuthTokens, DataRecord, EnvironmentalData } from "@/types";

// Mock expo-file-system
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

describe("M5 Empirical Adversarial Challenge & Stress Test Suite", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    global.fetch = jest.fn();
    jest.clearAllMocks();
  });

  afterEach(() => {
    global.fetch = originalFetch;
    jest.restoreAllMocks();
  });

  // ==========================================
  // SECTION 1: R1 OAuth & Session Persistence Vulnerability Testing
  // ==========================================
  describe("R1 Security & Robustness Challenges", () => {
    test("CHALLENGE-1.1: isTokenExpired behavior with NaN expiresIn", () => {
      const corruptedToken: AuthTokens = {
        accessToken: "mock_token",
        refreshToken: "mock_refresh",
        issuedAt: Date.now() - 100000,
        expiresIn: NaN,
      };

      // Empirically test if NaN expiresIn bypasses token expiration check
      const expired = authService.isTokenExpired(corruptedToken);
      // Because Date.now() >= NaN is false, isTokenExpired returns false!
      // This is a confirmed flaw: corrupted tokens with NaN expiresIn are treated as valid!
      expect(expired).toBe(false);
    });

    test("CHALLENGE-1.2: Refresh token handling on 500 server errors", async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: "Internal Server Error",
      });

      await expect(
        authService.refreshToken("some_refresh_token"),
      ).rejects.toThrow("Failed to refresh access token. Session expired.");
    });
  });

  // ==========================================
  // SECTION 2: R2 Field Data & Plot Validation Challenges
  // ==========================================
  describe("R2 Plot ID & Growth Stage Edge Case Challenges", () => {
    test("CHALLENGE-2.1: Plot ID rejects Vietnamese characters (LUỐNG-01)", () => {
      const resVi = validatePlotId("LUỐNG-01");
      expect(resVi.isValid).toBe(false);
      expect(resVi.error).toContain("Mã số luống chỉ bao gồm");

      const resLo = validatePlotId("LÔ-A1");
      expect(resLo.isValid).toBe(false);
    });

    test("CHALLENGE-2.2: Plot ID length boundary conditions (1 char vs 10,000 chars)", () => {
      const minCharRes = validatePlotId("A");
      expect(minCharRes.isValid).toBe(false);

      const hugePlotId = "PLOT_" + "X".repeat(10000);
      const hugeRes = validatePlotId(hugePlotId);
      expect(hugeRes.isValid).toBe(true); // Passes because no max-length limit exists
    });

    test("CHALLENGE-2.3: Growth stage picker invalid ID handling", () => {
      expect(isValidGrowthStage("")).toBe(false);
      expect(isValidGrowthStage(null as any)).toBe(false);
      expect(isValidGrowthStage("UNKNOWN_STAGE")).toBe(false);
      expect(getGrowthStageById("UNKNOWN_STAGE")).toBeUndefined();
    });
  });

  // ==========================================
  // SECTION 3: R3 Environmental Engine Physical Bounds Stress
  // ==========================================
  describe("R3 Environmental Parameter Stress Tests", () => {
    test("CHALLENGE-3.1: Physical boundary limit testing (Exact boundaries vs Exceeded)", () => {
      const exactBoundData: EnvironmentalData = {
        mode: "greenhouse",
        current: {
          temperature: PHYSICAL_BOUNDS.TEMPERATURE.MIN, // -10
          lightUvIndex: PHYSICAL_BOUNDS.LIGHT_UV_INDEX.MIN, // 0
          windSpeed: PHYSICAL_BOUNDS.WIND_SPEED.MIN, // 0
          co2Level: PHYSICAL_BOUNDS.CO2_LEVEL.MIN, // 200
        },
        t24: {
          temperature: PHYSICAL_BOUNDS.TEMPERATURE.MAX, // 60
          lightUvIndex: PHYSICAL_BOUNDS.LIGHT_UV_INDEX.MAX, // 100000
          windSpeed: PHYSICAL_BOUNDS.WIND_SPEED.MAX, // 150
          co2Level: PHYSICAL_BOUNDS.CO2_LEVEL.MAX, // 5000
        },
        t48: {
          temperature: 25,
          lightUvIndex: 1000,
          windSpeed: 10,
          co2Level: 400,
        },
      };

      const validRes = validateGreenhouseParams(exactBoundData);
      expect(validRes.isValid).toBe(true);

      const exceededData: EnvironmentalData = {
        ...exactBoundData,
        current: {
          ...exactBoundData.current,
          temperature: 60.1, // > 60
          co2Level: 199, // < 200
        },
      };

      const invalidRes = validateGreenhouseParams(exceededData);
      expect(invalidRes.isValid).toBe(false);
      expect(invalidRes.errors["current.temperature"]).toBeDefined();
      expect(invalidRes.errors["current.co2Level"]).toBeDefined();
    });

    test("CHALLENGE-3.2: Weather API timeout / abort controller resilience", async () => {
      (global.fetch as jest.Mock).mockImplementationOnce(
        () =>
          new Promise((_, reject) => {
            const err = new Error("Aborted");
            err.name = "AbortError";
            setTimeout(() => reject(err), 50);
          }),
      );

      const data = await fetchOutdoorWeather(10.7769, 106.7009);
      expect(data.isFallback).toBe(true);
      expect(data.current.temperature).toBe(28.5);
    });
  });

  // ==========================================
  // SECTION 4: R4 Symptom Severity & Percentage Boundary Challenges
  // ==========================================
  describe("R4 Symptom Assessment & Severity Classification Stress", () => {
    test("CHALLENGE-4.1: Severity classification precision boundaries (10.0%, 10.001%, 25.0%, 50.0%)", () => {
      expect(classifySymptomSeverity(10.0)).toBe("Chớm bệnh");
      expect(classifySymptomSeverity(10.001)).toBe("Nhẹ");
      expect(classifySymptomSeverity(25.0)).toBe("Nhẹ");
      expect(classifySymptomSeverity(25.0001)).toBe("Vừa");
      expect(classifySymptomSeverity(50.0)).toBe("Vừa");
      expect(classifySymptomSeverity(50.0001)).toBe("Rất nặng");
    });

    test("CHALLENGE-4.2: Symptom validation with out-of-range percentage (-10% and 120%)", () => {
      const negativeRes = validateSymptomPercentage(-10);
      expect(negativeRes.isValid).toBe(false);
      expect(negativeRes.error).toBe(
        "Tỷ lệ diện tích bị bệnh phải từ 0% đến 100%",
      );

      const overRes = validateSymptomPercentage(120);
      expect(overRes.isValid).toBe(false);

      const nanRes = validateSymptomPercentage(NaN);
      expect(nanRes.isValid).toBe(false);
    });

    test("CHALLENGE-4.3: Symptom description whitespace sanitization", () => {
      const whitespaceRes = validateSymptomDescription("   \n\t  ");
      expect(whitespaceRes.isValid).toBe(false);

      const emptyRes = validateSymptomDescription("");
      expect(emptyRes.isValid).toBe(false);
    });
  });

  // ==========================================
  // SECTION 5: R5 Storage & Drive Multipart Upload Stress Tests
  // ==========================================
  describe("R5 Storage & Multipart Upload Challenges", () => {
    const testRecord: DataRecord = {
      id: "REC-STRESS-001",
      user: { id: "usr_1", email: "test@agri.org", name: "Test User" },
      plotId: "PLOT-01",
      imageUri: "file:///mock/image.jpg",
      location: {
        latitude: 10,
        longitude: 106,
        accuracy: 5,
        timestamp: "2026-07-23T00:00:00Z",
      },
      growthStage: "vegetative",
      environmentalData: {
        mode: "outdoor",
        current: {
          temperature: 28,
          lightUvIndex: 5,
          windSpeed: 10,
          co2Level: 400,
        },
        t24: { temperature: 27, lightUvIndex: 5, windSpeed: 9, co2Level: 400 },
        t48: { temperature: 29, lightUvIndex: 6, windSpeed: 11, co2Level: 400 },
      },
      symptomData: {
        description: "Sâu ăn lá",
        percentageArea: 12,
        severity: "Nhẹ",
      },
      storageDestination: "gdrive",
      createdAt: "2026-07-23T00:00:00Z",
    };

    test("CHALLENGE-5.1: Path traversal protection in local storage filename", async () => {
      const maliciousRecord: DataRecord = {
        ...testRecord,
        id: "../../etc/malicious",
      };

      const result = await saveToLocalStorage(maliciousRecord);
      expect(result.success).toBe(true);
      // Note: filePath contains raw record.id string
      expect(result.filePath).toContain("../../etc/malicious");
    });

    test("CHALLENGE-5.2: Google Drive API 401 failure returns success=true with isFallback=true", async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: "Unauthorized",
        text: async () => "Invalid credentials",
      });

      const res = await uploadToGoogleDrive(testRecord, "expired_access_token");
      // Confirmed design pattern: returns success=true, isFallback=true, error message set
      expect(res.success).toBe(true);
      expect(res.isFallback).toBe(true);
      expect(res.error).toContain("API Upload failed (401)");
      expect(res.driveFileId).toContain("mock_gdrive_REC-STRESS-001");
    });

    test("CHALLENGE-5.3: Multipart body boundary string format validation", () => {
      const boundary = "test_boundary_123";
      const metadata = { name: "test.json" };
      const fileContent = '{"key":"value"}';

      const body = buildGoogleDriveMultipartBody(
        metadata,
        fileContent,
        boundary,
      );

      // Verify MIME parts structure
      expect(body.startsWith("\r\n--test_boundary_123\r\n")).toBe(true);
      expect(body.endsWith("\r\n--test_boundary_123--")).toBe(true);
    });
  });
});
