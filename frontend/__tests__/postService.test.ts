import { submitCaptureSession } from "../services/apiClient";
import {
  completeCaptureSession,
  validateCaptureSession,
} from "../services/postService";
import { CaptureSession } from "../types";

jest.mock("@react-native-async-storage/async-storage", () => ({
  getItem: jest.fn().mockResolvedValue(null),
  setItem: jest.fn().mockResolvedValue(undefined),
}));

jest.mock("../services/apiClient", () => ({
  submitCaptureSession: jest.fn(),
}));

const submitCaptureSessionMock = submitCaptureSession as jest.MockedFunction<
  typeof submitCaptureSession
>;

describe("postService validation and capture session workflow", () => {
  const validSessionDraft: Omit<CaptureSession, "id" | "status" | "createdAt"> =
    {
      farmerId: "FARMER-01",
      farmerName: "Nguyễn Văn An",
      images: ["https://example.com/photo1.jpg"],
      farmId: "FARM-01",
      plotId: "L-001",
      cropType: "Cà chua",
      growthStage: "flowering",
      envMode: "greenhouse",
      diseaseGroup: "Truyền nhiễm",
      diseaseType: "Bệnh hại quả",
      diseaseName: "Héo xanh vi khuẩn",
      stationMeasurements: {
        temperature: 28.0,
        lightUvIndex: 60,
        windSpeed: 10.0,
        co2Level: 420,
      },
      localMeasurements: {
        temperature: 27.0,
        humidity: 72,
        lightUvIndex: 58,
        windSpeed: 8.0,
        co2Level: 430,
      },
      symptomDescription: "Đốm vàng trên lá",
      severity: "Vừa",
      diseasedPart: "Lá",
    };

  it("validates a complete capture session successfully", () => {
    const res = validateCaptureSession(validSessionDraft);
    expect(res.isValid).toBe(true);
    expect(Object.keys(res.errors)).toHaveLength(0);
  });

  it("validates a complete session without plotId successfully (plotId is optional)", () => {
    const sessionWithoutPlot = { ...validSessionDraft, plotId: undefined };
    const res = validateCaptureSession(sessionWithoutPlot);
    expect(res.isValid).toBe(true);
  });

  it("allows optional local measurement fields to be omitted", () => {
    const sessionWithoutOptionalMeasurements = {
      ...validSessionDraft,
      localMeasurements: { temperature: 27 },
      stationMeasurements: { temperature: 28, lightUvIndex: 60 },
    };

    const res = validateCaptureSession(sessionWithoutOptionalMeasurements);

    expect(res.isValid).toBe(true);
    expect(res.errors.localHumidity).toBeUndefined();
  });

  it("fails validation when images array is empty", () => {
    const invalidSession = { ...validSessionDraft, images: [] };
    const res = validateCaptureSession(invalidSession);
    expect(res.isValid).toBe(false);
    expect(res.errors.images).toBeDefined();
  });

  it("fails validation when required fields are missing", () => {
    const invalidSession: Partial<CaptureSession> = {
      images: ["https://example.com/photo1.jpg"],
      // Missing cropType, growthStage, envMode, localMeasurements, severity, diseasedPart
    };
    const res = validateCaptureSession(invalidSession);
    expect(res.isValid).toBe(false);
    expect(res.errors.cropType).toBeDefined();
    expect(res.errors.growthStage).toBeDefined();
    expect(res.errors.envMode).toBeDefined();
    expect(res.errors.localMeasurements).toBeDefined();
    expect(res.errors.severity).toBeDefined();
    expect(res.errors.diseasedPart).toBeDefined();
  });

  it("requires symptom description for all severity levels", () => {
    const invalidSession = {
      ...validSessionDraft,
      symptomDescription: "",
      severity: "Nhẹ" as const,
    };
    const res = validateCaptureSession(invalidSession);
    expect(res.isValid).toBe(false);
    expect(res.errors.symptomDescription).toBeDefined();
  });

  it("rejects unknown severity values", () => {
    const legacySession = {
      ...validSessionDraft,
      symptomDescription: "Không có triệu chứng",
      severity: "Không hợp lệ",
    };
    const res = validateCaptureSession(legacySession as any);
    expect(res.isValid).toBe(false);
    expect(res.errors.severity).toBeDefined();
  });

  it("completes session without automatically generating a post", async () => {
    const progressSpy = jest.fn();
    submitCaptureSessionMock.mockImplementationOnce(
      async (session, onProgress) => {
        onProgress?.("Đang tải ảnh", 1, session.images.length);

        return {
          session: {
            ...session,
            id: "SESS-TEST-001",
            status: "COMPLETED",
            createdAt: new Date().toISOString(),
          } as CaptureSession,
        };
      },
    );

    const result = await completeCaptureSession(validSessionDraft, progressSpy);

    expect(submitCaptureSessionMock).toHaveBeenCalledWith(
      validSessionDraft,
      progressSpy,
    );
    expect(progressSpy).toHaveBeenCalled();
    expect(result.session.status).toBe("COMPLETED");
    expect(result.session.id).toBeDefined();
    expect((result as any).post).toBeUndefined();
  });
});
