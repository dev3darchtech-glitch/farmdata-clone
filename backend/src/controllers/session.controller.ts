import { Request, Response } from "express";
import { CaptureSessionModel } from "../models/CaptureSession";
import {
  buildCaptureImageDescription,
  uploadImagesToAdminDrive,
} from "../services/googleDriveService";
import { notifyCaptureSessionCompleted } from "../services/pushNotificationService";
import {
  GROWTH_STAGE_IDS,
  GrowthStageId,
  PLANT_DISEASE_GROUPS,
  PlantDiseaseGroup,
  SYMPTOM_SEVERITY_VALUES,
  SymptomSeverity,
} from "../types";

function normalizeDiseaseFields(req: Request, res: Response) {
  const diseaseGroup =
    typeof req.body?.diseaseGroup === "string"
      ? req.body.diseaseGroup.trim()
      : "";
  const diseaseType =
    typeof req.body?.diseaseType === "string"
      ? req.body.diseaseType.trim()
      : "";
  const diseaseName =
    typeof req.body?.diseaseName === "string"
      ? req.body.diseaseName.trim()
      : "";

  if (!diseaseGroup && !diseaseType && !diseaseName) {
    return {};
  }

  if (
    !PLANT_DISEASE_GROUPS.includes(diseaseGroup as PlantDiseaseGroup) ||
    !diseaseType ||
    !diseaseName
  ) {
    res.status(400).json({
      error: "diseaseGroup, diseaseType, and diseaseName are required",
    });
    return undefined;
  }

  return { diseaseGroup, diseaseType, diseaseName };
}

/**
 * POST /api/sessions
 * Creates a CaptureSession in MongoDB.
 */
export const createSession = async (req: Request, res: Response) => {
  const user = req.user!;
  const {
    images,
    plotId,
    cropType,
    growthStage,
    envMode,
    captureLocation,
    stationMeasurements,
    localMeasurements,
    symptomDescription,
    severity,
  } = req.body;

  if (!images || !Array.isArray(images) || images.length === 0) {
    return res.status(400).json({ error: "At least 1 image URI is required" });
  }
  if (!cropType || !cropType.trim()) {
    return res.status(400).json({ error: "cropType is required" });
  }
  if (!growthStage) {
    return res.status(400).json({ error: "growthStage is required" });
  }
  if (!GROWTH_STAGE_IDS.includes(growthStage as GrowthStageId)) {
    return res.status(400).json({ error: "growthStage is invalid" });
  }
  if (!envMode) {
    return res.status(400).json({ error: "envMode is required" });
  }
  if (!severity || typeof severity !== "string") {
    return res.status(400).json({ error: "severity is required" });
  }
  const normalizedSeverity = severity.trim();
  if (
    !SYMPTOM_SEVERITY_VALUES.includes(normalizedSeverity as SymptomSeverity)
  ) {
    return res.status(400).json({ error: "severity is invalid" });
  }
  const cleanSymptomDescription =
    typeof symptomDescription === "string" ? symptomDescription.trim() : "";
  if (!cleanSymptomDescription) {
    return res.status(400).json({ error: "symptomDescription is required" });
  }
  const normalizedSymptomDescription = cleanSymptomDescription;
  const normalizedStationMeasurements = stationMeasurements || {
    temperature: 28.0,
    lightUvIndex: 50,
    windSpeed: 10.0,
    co2Level: 400,
  };
  const normalizedDisease = normalizeDiseaseFields(req, res);
  if (normalizedDisease === undefined) {
    return;
  }

  const sessionId = `SESS-${Date.now()}`;
  const cleanPlotId =
    plotId && plotId.trim() ? plotId.trim().toUpperCase() : undefined;
  const imageDescription = (imageIndex: number) =>
    buildCaptureImageDescription(
      {
        sessionId,
        farmerName: user.name,
        farmerEmail: user.email,
        plotId: cleanPlotId,
        cropType: cropType.trim(),
        growthStage,
        envMode,
        captureLocation,
        stationMeasurements: normalizedStationMeasurements,
        localMeasurements,
        ...normalizedDisease,
        symptomDescription: normalizedSymptomDescription,
        severity: normalizedSeverity,
      },
      imageIndex,
    );

  // Upload session photos to creator Admin's Google Drive storage with label names
  const driveFiles = await uploadImagesToAdminDrive(
    user.id,
    images,
    cropType,
    growthStage,
    normalizedSeverity,
    imageDescription,
  );
  const driveImageLinks = driveFiles
    .map((file) => file.webContentLink || file.webViewLink)
    .filter((link): link is string => Boolean(link));
  const postImages =
    driveImageLinks.length === images.length ? driveImageLinks : images;

  const newSession = await CaptureSessionModel.create({
    sessionId,
    farmerId: user.id,
    farmerName: user.name,
    farmerEmail: user.email,
    images: postImages,
    driveFiles,
    plotId: cleanPlotId,
    cropType: cropType.trim(),
    growthStage,
    envMode,
    captureLocation,
    stationMeasurements: normalizedStationMeasurements,
    localMeasurements,
    ...normalizedDisease,
    symptomDescription: normalizedSymptomDescription,
    severity: normalizedSeverity,
    status: "COMPLETED",
  });

  void notifyCaptureSessionCompleted(newSession).catch((error) =>
    console.warn(
      "Capture session notification failed:",
      error instanceof Error ? error.message : String(error),
    ),
  );

  return res.status(201).json({
    session: newSession,
  });
};

/**
 * GET /api/sessions
 */
export const getSessions = async (req: Request, res: Response) => {
  const user = req.user!;

  if (user.role === "ADMIN") {
    const sessions = await CaptureSessionModel.find().sort({ createdAt: -1 });
    return res.json(sessions);
  }

  const ownSessions = await CaptureSessionModel.find({
    farmerId: user.id,
  }).sort({ createdAt: -1 });
  return res.json(ownSessions);
};
