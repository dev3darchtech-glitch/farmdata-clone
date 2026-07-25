import {
  buildGoogleDriveMultipartBody,
  saveToLocalStorage,
  uploadToGoogleDrive,
} from "@/services/storageService";
import { DataRecord } from "@/types";
import * as FileSystem from "expo-file-system";

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

describe("Storage Destination Engine Tests (M4)", () => {
  const originalFetch = global.fetch;

  const sampleRecord: DataRecord = {
    id: "REC-TEST-123",
    user: {
      id: "usr_1",
      email: "test@agri.org",
      name: "Nguyen Van A",
    },
    plotId: "PLOT-A1",
    imageUri: "file:///mock/photo.jpg",
    location: {
      latitude: 10.7769,
      longitude: 106.7009,
      accuracy: 5.0,
      timestamp: "2026-07-23T00:00:00Z",
    },
    growthStage: "vegetative",
    environmentalData: {
      mode: "outdoor",
      current: {
        temperature: 28,
        lightUvIndex: 10,
        windSpeed: 5,
        co2Level: 400,
      },
      t24: { temperature: 27, lightUvIndex: 9, windSpeed: 4, co2Level: 400 },
      t48: { temperature: 26, lightUvIndex: 8, windSpeed: 3, co2Level: 400 },
    },
    symptomData: {
      description: "Cháy mép lá",
      percentageArea: 20,
      severity: "Nhẹ",
    },
    storageDestination: "local",
    createdAt: "2026-07-23T00:00:00Z",
  };

  afterEach(() => {
    global.fetch = originalFetch;
    jest.clearAllMocks();
  });

  describe("buildGoogleDriveMultipartBody", () => {
    it("constructs standard multipart/related body formatted with boundary delimiters", () => {
      const metadata = { name: "test.json", mimeType: "application/json" };
      const fileContent = '{"key":"value"}';
      const boundary = "test_boundary_123";

      const body = buildGoogleDriveMultipartBody(
        metadata,
        fileContent,
        boundary,
      );

      expect(body).toContain(`--${boundary}`);
      expect(body).toContain("Content-Type: application/json; charset=UTF-8");
      expect(body).toContain(JSON.stringify(metadata));
      expect(body).toContain(fileContent);
      expect(body).toContain(`--${boundary}--`);
    });
  });

  describe("saveToLocalStorage", () => {
    it("writes formatted DataRecord JSON payload to local document directory", async () => {
      const result = await saveToLocalStorage(sampleRecord);

      expect(result.success).toBe(true);
      expect(result.destination).toBe("local");
      expect(result.filePath).toContain(
        "/mock/documents/data_records/record_REC-TEST-123.json",
      );
      expect(result.record?.localFilePath).toBe(result.filePath);

      expect(FileSystem.writeAsStringAsync).toHaveBeenCalledWith(
        expect.stringContaining("record_REC-TEST-123.json"),
        expect.stringContaining("REC-TEST-123"),
        expect.objectContaining({ encoding: "utf8" }),
      );
    });

    it("creates missing target directory if it does not exist", async () => {
      (FileSystem.getInfoAsync as jest.Mock).mockResolvedValueOnce({
        exists: false,
      });

      await saveToLocalStorage(sampleRecord);

      expect(FileSystem.makeDirectoryAsync).toHaveBeenCalledWith(
        expect.stringContaining("/data_records/"),
        { intermediates: true },
      );
    });

    it("handles file system write error gracefully", async () => {
      (FileSystem.writeAsStringAsync as jest.Mock).mockRejectedValueOnce(
        new Error("Disk full"),
      );

      const result = await saveToLocalStorage(sampleRecord);

      expect(result.success).toBe(false);
      expect(result.destination).toBe("local");
      expect(result.error).toContain("Disk full");
    });
  });

  describe("uploadToGoogleDrive", () => {
    it("uploads record to Google Drive multipart endpoint when valid accessToken is provided", async () => {
      const mockDriveFileId = "gdrive_file_abc123";

      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValueOnce({ id: mockDriveFileId }),
      } as any);

      const result = await uploadToGoogleDrive(
        sampleRecord,
        "valid_bearer_token_xyz",
      );

      expect(result.success).toBe(true);
      expect(result.destination).toBe("gdrive");
      expect(result.driveFileId).toBe(mockDriveFileId);
      expect(result.isFallback).toBe(false);

      expect(global.fetch).toHaveBeenCalledWith(
        "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart",
        expect.objectContaining({
          method: "POST",
          headers: expect.objectContaining({
            Authorization: "Bearer valid_bearer_token_xyz",
            "Content-Type": expect.stringContaining(
              "multipart/related; boundary=",
            ),
          }),
        }),
      );
    });

    it("returns fallback mock response when accessToken is missing or mock", async () => {
      const mockFetch = jest.fn();
      global.fetch = mockFetch;

      const noTokenResult = await uploadToGoogleDrive(sampleRecord, undefined);

      expect(mockFetch).not.toHaveBeenCalled();
      expect(noTokenResult.success).toBe(true);
      expect(noTokenResult.isFallback).toBe(true);
      expect(noTokenResult.driveFileId).toContain("mock_gdrive_REC-TEST-123");

      const mockTokenResult = await uploadToGoogleDrive(
        sampleRecord,
        "mock_token_123",
      );
      expect(mockFetch).not.toHaveBeenCalled();
      expect(mockTokenResult.isFallback).toBe(true);
    });

    it("falls back gracefully on network or HTTP API errors", async () => {
      global.fetch = jest
        .fn()
        .mockRejectedValueOnce(new Error("Network error"));

      const result = await uploadToGoogleDrive(sampleRecord, "real_token");

      expect(result.success).toBe(true);
      expect(result.destination).toBe("gdrive");
      expect(result.isFallback).toBe(true);
      expect(result.driveFileId).toContain("mock_gdrive_REC-TEST-123");
    });
  });
});
