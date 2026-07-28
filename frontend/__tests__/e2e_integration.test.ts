import {
  GROWTH_STAGES,
  VALID_GROWTH_STAGE_IDS,
  getGrowthStageById,
  isValidGrowthStage,
  validatePlotId,
} from "@/constants/growthStages";
import * as authService from "@/services/authService";
import { captureImageWithMetadata } from "@/services/cameraService";
import {
  generateIsoTimestamp,
  getCurrentLocation,
} from "@/services/locationService";
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
import {
  PHYSICAL_BOUNDS,
  createDefaultGreenhouseData,
  fetchOutdoorWeather,
  validateEnvironmentalData,
  validateGreenhouseParams,
} from "@/services/weatherService";
import {
  AuthTokens,
  CaptureRecord,
  DataRecord,
  EnvironmentalData,
  StorageSaveResult,
  SymptomData,
  User,
} from "@/types";
import * as FileSystem from "expo-file-system";

// Mock expo-file-system for local file storage testing
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

describe("End-to-End Integration Suite & Complete User Journey (R1 - R5)", () => {
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
  // R1: Google OAuth Authentication & Persistence
  // ==========================================
  describe("R1: Google OAuth Authentication & Token Refresh Persistence", () => {
    const mockUser: User = {
      id: "usr_google_e2e_001",
      email: "farmer.e2e@agri.org",
      name: "Nguyen Van Farmer",
      photo: "https://lh3.googleusercontent.com/a/mock_avatar",
    };

    const mockTokens: AuthTokens = {
      accessToken: "ya29.a0AfH6SMB_mock_access_token",
      refreshToken: "1//0g_mock_refresh_token_xyz",
      idToken: "mock_id_token_jwt",
      expiresIn: 3600,
      issuedAt: Date.now(),
      tokenType: "Bearer",
    };

    test("1.1 Login with Google, store session, and verify persistence", async () => {
      const tokens = await authService.loginWithGoogle(mockTokens, mockUser);
      expect(tokens.accessToken).toBe(mockTokens.accessToken);
      expect(tokens.refreshToken).toBe(mockTokens.refreshToken);

      const storedTokens = await authService.getStoredTokens();
      const storedUser = await authService.getStoredUser();

      expect(storedTokens).not.toBeNull();
      expect(storedTokens?.accessToken).toBe(mockTokens.accessToken);
      expect(storedUser).not.toBeNull();
      expect(storedUser?.id).toBe(mockUser.id);
      expect(storedUser?.email).toBe(mockUser.email);
    });

    test("1.2 Detect token expiration using 60s safety buffer", () => {
      const now = Date.now();
      const validToken: AuthTokens = {
        ...mockTokens,
        issuedAt: now,
        expiresIn: 3600,
      };
      expect(authService.isTokenExpired(validToken)).toBe(false);

      const nearExpiringToken: AuthTokens = {
        ...mockTokens,
        issuedAt: now - 3550 * 1000,
        expiresIn: 3600,
      };
      expect(authService.isTokenExpired(nearExpiringToken)).toBe(true);

      const expiredToken: AuthTokens = {
        ...mockTokens,
        issuedAt: now - 4000 * 1000,
        expiresIn: 3600,
      };
      expect(authService.isTokenExpired(expiredToken)).toBe(true);
    });

    test("1.3 Refresh expired access token via Google OAuth token endpoint", async () => {
      const newAccessToken = "ya29.a0AfH6SMB_refreshed_token_2026";
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          access_token: newAccessToken,
          expires_in: 3600,
          token_type: "Bearer",
        }),
      });

      await authService.saveAuthData(mockTokens, mockUser);
      const updatedTokens = await authService.refreshToken(
        mockTokens.refreshToken,
      );

      expect(updatedTokens.accessToken).toBe(newAccessToken);
      expect(updatedTokens.refreshToken).toBe(mockTokens.refreshToken);

      const storedTokens = await authService.getStoredTokens();
      expect(storedTokens?.accessToken).toBe(newAccessToken);
    });

    test("1.4 Logout clears stored user and session tokens", async () => {
      await authService.saveAuthData(mockTokens, mockUser);
      await authService.logout();

      const storedTokens = await authService.getStoredTokens();
      const storedUser = await authService.getStoredUser();

      expect(storedTokens).toBeNull();
      expect(storedUser).toBeNull();
    });
  });

  // ==========================================
  // R2: Plot ID, Camera, Geolocation, Growth Stage
  // ==========================================
  describe("R2: Field Data Capture, GPS & Growth Stage Selection", () => {
    test("2.1 Plot ID input validation rules", () => {
      expect(validatePlotId("PLOT-A1")).toEqual({ isValid: true });
      expect(validatePlotId("LUONG_05")).toEqual({ isValid: true });
      expect(validatePlotId("ROW10")).toEqual({ isValid: true });

      expect(validatePlotId("").isValid).toBe(false);
      expect(validatePlotId("   ").isValid).toBe(false);
      expect(validatePlotId("A").isValid).toBe(false);
      expect(validatePlotId("PLOT#01").isValid).toBe(false);
    });

    test("2.2 Camera crop image capture & automatic GPS location + ISO timestamp attachment", async () => {
      const captureResult = await captureImageWithMetadata();

      expect(captureResult.uri).toBeTruthy();
      expect(captureResult.uri).toContain("file://");
      expect(captureResult.location).toBeDefined();
      expect(captureResult.location.latitude).toBe(10.7769);
      expect(captureResult.location.longitude).toBe(106.7009);
      expect(captureResult.location.accuracy).toBe(5.0);
      expect(captureResult.timestamp).toMatch(
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/,
      );
    });

    test("2.3 Standard 5 Growth Stage selection validation & retrieval", () => {
      expect(GROWTH_STAGES).toHaveLength(5);
      expect(VALID_GROWTH_STAGE_IDS).toHaveLength(5);

      const stageIds: (
        | "newly_planted"
        | "vegetative"
        | "flowering"
        | "fruiting"
        | "harvest"
      )[] = ["newly_planted", "vegetative", "flowering", "fruiting", "harvest"];

      stageIds.forEach((id) => {
        expect(isValidGrowthStage(id)).toBe(true);
        const stageInfo = getGrowthStageById(id);
        expect(stageInfo).toBeDefined();
        expect(stageInfo?.nameVi).toBeTruthy();
        expect(stageInfo?.nameEn).toBeTruthy();
      });

      expect(isValidGrowthStage("invalid_stage")).toBe(false);
      expect(getGrowthStageById("invalid_stage")).toBeUndefined();
    });

    test("2.4 CaptureRecord structure creation", async () => {
      const location = await getCurrentLocation();
      const record: CaptureRecord = {
        id: "CAP-2026-001",
        plotId: "PLOT-VN-01",
        imageUri: "file:///mock/captured_photo.jpg",
        location,
        timestamp: location.timestamp,
        growthStage: "flowering",
      };

      expect(record.id).toBe("CAP-2026-001");
      expect(record.plotId).toBe("PLOT-VN-01");
      expect(record.growthStage).toBe("flowering");
      expect(record.location.latitude).toBe(10.7769);
    });
  });

  // ==========================================
  // R3: Environmental Parameters Mode Selection
  // ==========================================
  describe("R3: Environmental Parameters Engine (Outdoor vs Greenhouse)", () => {
    test("3.1 Outdoor API auto-fetch T0, T-24, T-48 weather metrics & physical bounds validation", async () => {
      const hourlyTimes = Array.from({ length: 50 }, (_, index) => {
        const hour = String(index % 24).padStart(2, "0");
        return `2026-07-28T${hour}:00`;
      });
      const mockApiResponse = {
        current_weather: {
          temperature: 29.5,
          windspeed: 14.0,
          weathercode: 1,
          time: hourlyTimes[30],
        },
        hourly: {
          temperature_2m: Array(50).fill(28.5),
          relative_humidity_2m: Array(50).fill(68),
          windspeed_10m: Array(50).fill(12.0),
          shortwave_radiation: Array(50).fill(420),
          weather_code: Array(50).fill(1),
          time: hourlyTimes,
        },
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockApiResponse,
      });

      const envData = await fetchOutdoorWeather(10.7769, 106.7009);

      expect(envData.mode).toBe("outdoor");
      expect(envData.isFallback).toBe(false);
      expect(envData.current.temperature).toBe(29.5);
      expect(envData.current.windSpeed).toBe(14.0);
      expect(envData.current.lightUvIndex).toBe(420);
      expect(envData.current.co2Level).toBe(415);
      expect(envData.t24.temperature).toBe(28.5);
      expect(envData.t48.temperature).toBe(28.5);

      const validation = validateEnvironmentalData(envData);
      expect(validation.isValid).toBe(true);
      expect(Object.keys(validation.errors)).toHaveLength(0);
    });

    test("3.2 Outdoor API failure fallback to mock data", async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(
        new Error("Network error"),
      );

      const envData = await fetchOutdoorWeather(10.7769, 106.7009);

      expect(envData.mode).toBe("outdoor");
      expect(envData.isFallback).toBe(true);
      expect(Number.isNaN(envData.current.temperature)).toBe(true);
    });

    test("3.3 Greenhouse mode mandatory manual entry validation for all 12 parameters", () => {
      const defaultGreenhouse = createDefaultGreenhouseData();
      expect(defaultGreenhouse.mode).toBe("greenhouse");

      const invalidResult = validateGreenhouseParams(defaultGreenhouse);
      expect(invalidResult.isValid).toBe(false);
      expect(Object.keys(invalidResult.errors).length).toBeGreaterThanOrEqual(
        12,
      );

      const completeGreenhouse: EnvironmentalData = {
        mode: "greenhouse",
        current: {
          temperature: 25.0,
          lightUvIndex: 1200,
          windSpeed: 2.5,
          co2Level: 650,
        },
        t24: {
          temperature: 24.0,
          lightUvIndex: 1100,
          windSpeed: 2.0,
          co2Level: 620,
        },
        t48: {
          temperature: 26.0,
          lightUvIndex: 1300,
          windSpeed: 3.0,
          co2Level: 680,
        },
      };

      const validResult = validateGreenhouseParams(completeGreenhouse);
      expect(validResult.isValid).toBe(true);
      expect(Object.keys(validResult.errors)).toHaveLength(0);
    });

    test("3.4 Rejection of out-of-bound environmental physical metrics", () => {
      expect(PHYSICAL_BOUNDS.TEMPERATURE).toEqual({ MIN: -10, MAX: 60 });
      expect(PHYSICAL_BOUNDS.WIND_SPEED).toEqual({ MIN: 0, MAX: 150 });
      expect(PHYSICAL_BOUNDS.LIGHT_UV_INDEX).toEqual({ MIN: 0, MAX: 100000 });
      expect(PHYSICAL_BOUNDS.CO2_LEVEL).toEqual({ MIN: 200, MAX: 5000 });

      const invalidTempData: EnvironmentalData = {
        mode: "greenhouse",
        current: {
          temperature: 75.0,
          lightUvIndex: 1000,
          windSpeed: 5,
          co2Level: 500,
        }, // Temp 75°C > 60
        t24: {
          temperature: 25.0,
          lightUvIndex: 1000,
          windSpeed: 5,
          co2Level: 500,
        },
        t48: {
          temperature: 25.0,
          lightUvIndex: 1000,
          windSpeed: 5,
          co2Level: 500,
        },
      };

      const validation = validateGreenhouseParams(invalidTempData);
      expect(validation.isValid).toBe(false);
      expect(validation.errors["current.temperature"]).toBeDefined();
    });
  });

  // ==========================================
  // R4: Disease Symptom Assessment Engine
  // ==========================================
  describe("R4: Disease Symptom Assessment & 4-Tier Severity Classification", () => {
    test("4.1 4-Tier disease severity classification boundary math", () => {
      // Tier 1: <= 10% -> 'Chớm bệnh'
      expect(classifySymptomSeverity(0)).toBe("Chớm bệnh");
      expect(classifySymptomSeverity(5)).toBe("Chớm bệnh");
      expect(classifySymptomSeverity(10)).toBe("Chớm bệnh");

      // Tier 2: 10.1% - 25% -> 'Nhẹ'
      expect(classifySymptomSeverity(10.1)).toBe("Nhẹ");
      expect(classifySymptomSeverity(18)).toBe("Nhẹ");
      expect(classifySymptomSeverity(25)).toBe("Nhẹ");

      // Tier 3: 25.1% - 50% -> 'Vừa'
      expect(classifySymptomSeverity(25.1)).toBe("Vừa");
      expect(classifySymptomSeverity(40)).toBe("Vừa");
      expect(classifySymptomSeverity(50)).toBe("Vừa");

      // Tier 4: > 50% -> 'Rất nặng'
      expect(classifySymptomSeverity(50.1)).toBe("Rất nặng");
      expect(classifySymptomSeverity(75)).toBe("Rất nặng");
      expect(classifySymptomSeverity(100)).toBe("Rất nặng");
    });

    test("4.2 Symptom text description & leaf percentage area input validation", () => {
      expect(
        validateSymptomDescription("Đốm đốm màu sẫm ở mặt sau lá").isValid,
      ).toBe(true);
      expect(validateSymptomDescription("").isValid).toBe(false);
      expect(validateSymptomDescription("   ").isValid).toBe(false);

      expect(validateSymptomPercentage(0).isValid).toBe(true);
      expect(validateSymptomPercentage(50).isValid).toBe(true);
      expect(validateSymptomPercentage(100).isValid).toBe(true);
      expect(validateSymptomPercentage(-5).isValid).toBe(false);
      expect(validateSymptomPercentage(105).isValid).toBe(false);
      expect(validateSymptomPercentage(NaN).isValid).toBe(false);
    });

    test("4.3 Validate complete SymptomData payload", () => {
      const validPayload: SymptomData = {
        description: "Vàng lá gân xanh nhẹ ở lá non",
        percentageArea: 15,
        severity: classifySymptomSeverity(15),
      };

      const result = validateSymptomData(validPayload);
      expect(result.isValid).toBe(true);
      expect(validPayload.severity).toBe("Nhẹ");
    });
  });

  // ==========================================
  // R5: Consolidated DataRecord & Multi-Storage
  // ==========================================
  describe("R5: Consolidated DataRecord & Multi-Storage Destinations", () => {
    const fullDataRecord: DataRecord = {
      id: "REC-E2E-99999",
      user: {
        id: "usr_e2e_123",
        email: "e2e@agri.org",
        name: "Tester Tran",
      },
      plotId: "PLOT-TEST-01",
      imageUri: "file:///mock/field_photo.jpg",
      location: {
        latitude: 10.7769,
        longitude: 106.7009,
        accuracy: 4.5,
        timestamp: "2026-07-23T00:00:00.000Z",
      },
      growthStage: "fruiting",
      environmentalData: {
        mode: "outdoor",
        current: {
          temperature: 30,
          lightUvIndex: 7,
          windSpeed: 10,
          co2Level: 415,
        },
        t24: { temperature: 28, lightUvIndex: 6, windSpeed: 8, co2Level: 412 },
        t48: { temperature: 29, lightUvIndex: 8, windSpeed: 11, co2Level: 418 },
      },
      symptomData: {
        description: "Sương mai rải rác trên tán lá",
        percentageArea: 22,
        severity: "Nhẹ",
      },
      storageDestination: "local",
      createdAt: "2026-07-23T00:00:00.000Z",
    };

    test("5.1 Save DataRecord to local file storage via expo-file-system", async () => {
      const saveResult = await saveToLocalStorage(fullDataRecord);

      expect(saveResult.success).toBe(true);
      expect(saveResult.destination).toBe("local");
      expect(saveResult.filePath).toContain("record_REC-E2E-99999.json");
      expect(saveResult.record?.localFilePath).toBe(saveResult.filePath);

      expect(FileSystem.writeAsStringAsync).toHaveBeenCalledWith(
        expect.stringContaining("record_REC-E2E-99999.json"),
        expect.stringContaining("REC-E2E-99999"),
        expect.objectContaining({ encoding: "utf8" }),
      );
    });

    test("5.2 Upload DataRecord to Google Drive using multipart API endpoint (uploadType=multipart)", async () => {
      const mockDriveFileId = "gdrive_file_id_e2e_777";

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: mockDriveFileId }),
      });

      const accessToken = "ya29.valid_oauth_access_token_e2e";
      const uploadResult = await uploadToGoogleDrive(
        fullDataRecord,
        accessToken,
      );

      expect(uploadResult.success).toBe(true);
      expect(uploadResult.destination).toBe("gdrive");
      expect(uploadResult.driveFileId).toBe(mockDriveFileId);
      expect(uploadResult.isFallback).toBe(false);

      expect(global.fetch).toHaveBeenCalledWith(
        "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart",
        expect.objectContaining({
          method: "POST",
          headers: expect.objectContaining({
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": expect.stringContaining(
              "multipart/related; boundary=",
            ),
          }),
        }),
      );
    });

    test("5.3 Verify Google Drive multipart request body structure", () => {
      const metadata = {
        name: "record_REC-E2E-99999.json",
        mimeType: "application/json",
      };
      const fileContent = JSON.stringify(fullDataRecord);
      const boundary = "e2e_test_boundary_456";

      const body = buildGoogleDriveMultipartBody(
        metadata,
        fileContent,
        boundary,
      );

      expect(body).toContain(
        `--${boundary}\r\nContent-Type: application/json; charset=UTF-8`,
      );
      expect(body).toContain(JSON.stringify(metadata));
      expect(body).toContain(`--${boundary}\r\nContent-Type: application/json`);
      expect(body).toContain(fileContent);
      expect(body).toContain(`--${boundary}--`);
    });

    test("5.4 Google Drive upload offline / unauthenticated fallback mode", async () => {
      const mockFetch = jest.fn();
      global.fetch = mockFetch;

      const fallbackResult = await uploadToGoogleDrive(
        fullDataRecord,
        undefined,
      );

      expect(mockFetch).not.toHaveBeenCalled();
      expect(fallbackResult.success).toBe(true);
      expect(fallbackResult.destination).toBe("gdrive");
      expect(fallbackResult.isFallback).toBe(true);
      expect(fallbackResult.driveFileId).toContain("mock_gdrive_REC-E2E-99999");
    });
  });

  // ==========================================
  // COMPLETE END-TO-END USER JOURNEY LIFECYCLE
  // ==========================================
  describe("Full End-to-End User Journey (M1 -> M2 -> M3 -> M4 -> M5)", () => {
    test("Simulate complete end-to-end data collection & sync workflow", async () => {
      // Step 1: User Login & OAuth Authentication (R1)
      const userProfile: User = {
        id: "usr_field_agent_42",
        email: "agent42@agridept.gov.vn",
        name: "Le Van Chuyen Vien",
        photo: "https://lh3.googleusercontent.com/a/agent42",
      };
      const oauthTokens: AuthTokens = {
        accessToken: "ya29.live_e2e_field_token",
        refreshToken: "1//0g_refresh_field_token",
        expiresIn: 3600,
        issuedAt: Date.now(),
      };
      await authService.saveAuthData(oauthTokens, userProfile);
      const activeUser = await authService.getStoredUser();
      expect(activeUser?.email).toBe("agent42@agridept.gov.vn");

      // Step 2: Plot ID input & Image capture with GPS & timestamp (R2)
      const plotId = "PLOT-BEN-CAT-03";
      const plotValidation = validatePlotId(plotId);
      expect(plotValidation.isValid).toBe(true);

      const captureMeta = await captureImageWithMetadata();
      expect(captureMeta.uri).toBeTruthy();
      expect(captureMeta.location.latitude).toBe(10.7769);
      expect(captureMeta.timestamp).toBeTruthy();

      const growthStage = "fruiting";
      expect(isValidGrowthStage(growthStage)).toBe(true);

      // Step 3: Environmental parameters auto-fetch (R3)
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          current_weather: { temperature: 31.0, windspeed: 8.5 },
          hourly: {
            temperature_2m: Array(50).fill(29.0),
            windspeed_10m: Array(50).fill(7.0),
            uv_index: Array(50).fill(6.0),
          },
        }),
      });

      const envData = await fetchOutdoorWeather(
        captureMeta.location.latitude,
        captureMeta.location.longitude,
      );
      expect(envData.current.temperature).toBe(31.0);
      expect(validateEnvironmentalData(envData).isValid).toBe(true);

      // Step 4: Disease symptom assessment & 4-tier severity classification (R4)
      const symptomDescription = "Đốm vi khuẩn xuất hiện ở tán lá dưới";
      const affectedPercentage = 18.5; // Expected classification: 'Nhẹ' (10.1% - 25%)

      expect(validateSymptomDescription(symptomDescription).isValid).toBe(true);
      expect(validateSymptomPercentage(affectedPercentage).isValid).toBe(true);

      const severity = classifySymptomSeverity(affectedPercentage);
      expect(severity).toBe("Nhẹ");

      const symptomData: SymptomData = {
        description: symptomDescription,
        percentageArea: affectedPercentage,
        severity,
      };
      expect(validateSymptomData(symptomData).isValid).toBe(true);

      // Step 5: Consolidate DataRecord & Save to Local & Cloud Storage (R5)
      const dataRecord: DataRecord = {
        id: `REC-${Date.now()}`,
        user: activeUser!,
        plotId,
        imageUri: captureMeta.uri,
        location: captureMeta.location,
        growthStage: growthStage as any,
        environmentalData: envData,
        symptomData,
        storageDestination: "local",
        createdAt: generateIsoTimestamp(),
      };

      // 5a. Save to Local device storage
      const localResult: StorageSaveResult =
        await saveToLocalStorage(dataRecord);
      expect(localResult.success).toBe(true);
      expect(localResult.filePath).toBeDefined();

      // 5b. Upload to Google Drive Cloud storage
      const mockDriveId = "drive_file_e2e_complete_123";
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: mockDriveId }),
      });

      const activeTokens = await authService.getStoredTokens();
      const driveResult: StorageSaveResult = await uploadToGoogleDrive(
        dataRecord,
        activeTokens?.accessToken,
      );
      expect(driveResult.success).toBe(true);
      expect(driveResult.driveFileId).toBe(mockDriveId);
      expect(driveResult.isFallback).toBe(false);
    });
  });
});
