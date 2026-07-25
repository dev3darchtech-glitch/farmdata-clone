import {
  completeCaptureSessionAndAutoPost,
  validateCaptureSession,
} from "../services/postService";
import { CaptureSession } from "../types";

jest.mock("@react-native-async-storage/async-storage", () => ({
  getItem: jest.fn().mockResolvedValue(null),
  setItem: jest.fn().mockResolvedValue(undefined),
}));

describe("postService validation and auto post workflow", () => {
  const validSessionDraft: Omit<CaptureSession, "id" | "status" | "createdAt"> =
    {
      farmerId: "FARMER-01",
      farmerName: "Nguyễn Văn An",
      images: ["https://example.com/photo1.jpg"],
      plotId: "L-001",
      cropType: "Cà chua",
      growthStage: "flowering",
      envMode: "greenhouse",
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

  it("fails validation when images array is empty", () => {
    const invalidSession = { ...validSessionDraft, images: [] };
    const res = validateCaptureSession(invalidSession);
    expect(res.isValid).toBe(false);
    expect(res.errors.images).toBeDefined();
  });

  it("fails validation when required fields are missing", () => {
    const invalidSession: Partial<CaptureSession> = {
      images: ["https://example.com/photo1.jpg"],
      // Missing cropType, growthStage, envMode, localMeasurements, severity
    };
    const res = validateCaptureSession(invalidSession);
    expect(res.isValid).toBe(false);
    expect(res.errors.cropType).toBeDefined();
    expect(res.errors.growthStage).toBeDefined();
    expect(res.errors.envMode).toBeDefined();
    expect(res.errors.localMeasurements).toBeDefined();
    expect(res.errors.severity).toBeDefined();
  });

  it("requires symptom description for unhealthy severity levels", () => {
    const invalidSession = {
      ...validSessionDraft,
      symptomDescription: "",
      severity: "Nhẹ" as const,
    };
    const res = validateCaptureSession(invalidSession);
    expect(res.isValid).toBe(false);
    expect(res.errors.symptomDescription).toBeDefined();
  });

  it("allows empty symptom description when severity is healthy", () => {
    const healthySession = {
      ...validSessionDraft,
      symptomDescription: "",
      severity: "Khỏe mạnh" as const,
    };
    const res = validateCaptureSession(healthySession);
    expect(res.isValid).toBe(true);
    expect(res.errors.symptomDescription).toBeUndefined();
  });

  it("completes session and automatically generates a linked post in PUBLISHED status", async () => {
    const progressSpy = jest.fn();
    const result = await completeCaptureSessionAndAutoPost(
      validSessionDraft,
      progressSpy,
    );

    expect(progressSpy).toHaveBeenCalled();
    expect(result.session.status).toBe("COMPLETED");
    expect(result.session.id).toBeDefined();

    expect(result.post.status).toBe("PUBLISHED");
    expect(result.post.sessionId).toBe(result.session.id);
    expect(result.post.cropType).toBe("Cà chua");
    expect(result.post.plotId).toBe("L-001");
    expect(result.post.images).toEqual(["https://example.com/photo1.jpg"]);
  });
});
