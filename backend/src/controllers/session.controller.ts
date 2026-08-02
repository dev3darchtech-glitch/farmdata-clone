import { Request, Response } from "express";
import mongoose from "mongoose";
import {
  CaptureSessionModel,
  ICaptureSessionDocument,
} from "../models/CaptureSession";
import {
  buildCaptureImageDescription,
  deleteFilesFromFirebaseStorage,
  uploadImagesToFirebaseStorage,
} from "../services/firebaseStorageService";
import {
  GROWTH_STAGE_IDS,
  GrowthStageId,
  PLANT_DISEASE_GROUPS,
  PlantDiseaseGroup,
  SYMPTOM_SEVERITY_VALUES,
  SymptomSeverity,
} from "../types";

type NormalizedDisease =
  | {
      diseaseGroup: string;
      diseaseType: string;
      diseaseName: string;
    }
  | undefined;

function normalizeDiseaseFields(
  req: Request,
  res: Response,
): NormalizedDisease {
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
    return undefined;
  }

  if (
    !PLANT_DISEASE_GROUPS.includes(diseaseGroup as PlantDiseaseGroup) ||
    !diseaseType ||
    !diseaseName
  ) {
    res.status(400).json({
      error: "Nhóm bệnh, phân loại bệnh và tên bệnh là bắt buộc",
    });
    return undefined;
  }

  return { diseaseGroup, diseaseType, diseaseName };
}

function buildSessionQuery(sessionIdOrMongoId: string) {
  return mongoose.isValidObjectId(sessionIdOrMongoId)
    ? { $or: [{ _id: sessionIdOrMongoId }, { sessionId: sessionIdOrMongoId }] }
    : { sessionId: sessionIdOrMongoId };
}

async function persistCompletedSession(
  input: {
    captureLocation: any;
    cropType: string;
    envMode: string;
    growthStage: GrowthStageId;
    images: string[];
    localMeasurements: any;
    normalizedDisease?: NormalizedDisease;
    normalizedSeverity: SymptomSeverity;
    normalizedStationMeasurements: any;
    normalizedSymptomDescription: string;
    plotId?: string;
    reqUser: NonNullable<Request["user"]>;
    sessionId: string;
    stationMeasurementsT12?: any;
    stationMeasurementsT24?: any;
    stationMeasurementsT48?: any;
  },
  existingSessionId?: string,
  existingDriveFiles?: any[],
): Promise<ICaptureSessionDocument | null> {
  const {
    captureLocation,
    cropType,
    envMode,
    growthStage,
    images,
    localMeasurements,
    normalizedDisease,
    normalizedSeverity,
    normalizedStationMeasurements,
    normalizedSymptomDescription,
    plotId,
    reqUser,
    sessionId,
    stationMeasurementsT12,
    stationMeasurementsT24,
    stationMeasurementsT48,
  } = input;
  const cleanPlotId =
    plotId && plotId.trim() ? plotId.trim().toUpperCase() : undefined;
  const imageDescription = (imageIndex: number) =>
    buildCaptureImageDescription(
      {
        sessionId,
        farmerName: reqUser.name,
        farmerEmail: reqUser.email,
        plotId: cleanPlotId,
        cropType: cropType.trim(),
        growthStage,
        envMode,
        captureLocation,
        stationMeasurements: normalizedStationMeasurements,
        stationMeasurementsT24,
        stationMeasurementsT48,
        localMeasurements,
        ...normalizedDisease,
        symptomDescription: normalizedSymptomDescription,
        severity: normalizedSeverity,
      },
      imageIndex,
    );

  const driveFiles = await uploadImagesToFirebaseStorage({
    farmerEmailOrId: reqUser.id,
    imageUris: images,
    plotId: cleanPlotId,
    cropType: cropType.trim(),
    envMode,
    growthStage,
    diseaseName: normalizedDisease?.diseaseName,
    severity: normalizedSeverity,
    description: imageDescription,
    destination: "capture",
    captureLocation,
    weatherCode: normalizedStationMeasurements.weatherCode,
    temperature: normalizedStationMeasurements.temperature,
  });
  const watermarkLinks = driveFiles
    .map((file) => file.watermarkWebContentLink || file.watermarkWebViewLink)
    .filter((link): link is string => Boolean(link));
  const originalFiles = driveFiles.filter(
    (f) => !f.fileName || !f.fileName.includes("_MARK"),
  );
  const originalLinks = originalFiles
    .map((file) => file.webContentLink || file.webViewLink)
    .filter((link): link is string => Boolean(link));
  const postImages =
    watermarkLinks.length === images.length
      ? watermarkLinks
      : originalLinks.length === images.length
        ? originalLinks
        : images;

  const payload = {
    sessionId,
    farmerId: reqUser.id,
    farmerName: reqUser.name,
    farmerEmail: reqUser.email,
    createdByRole: reqUser.role,
    images: postImages,
    files: driveFiles,
    plotId: cleanPlotId,
    cropType: cropType.trim(),
    growthStage,
    envMode,
    captureLocation,
    stationMeasurements: normalizedStationMeasurements,
    stationMeasurementsT12,
    stationMeasurementsT24,
    stationMeasurementsT48,
    localMeasurements,
    ...normalizedDisease,
    symptomDescription: normalizedSymptomDescription,
    severity: normalizedSeverity,
    status: "COMPLETED" as const,
  };

  if (!existingSessionId) {
    return await CaptureSessionModel.create(payload);
  }

  await deleteFilesFromFirebaseStorage(existingDriveFiles);

  return await CaptureSessionModel.findOneAndUpdate(
    buildSessionQuery(existingSessionId),
    { $set: payload },
    { new: true, runValidators: true },
  );
}

/**
 * POST /api/sessions
 * Creates a CaptureSession in MongoDB.
 */
export const createSession = async (req: Request, res: Response) => {
  try {
    const user = req.user!;
    const {
      images,
      plotId,
      cropType,
      growthStage,
      envMode,
      captureLocation,
      stationMeasurements,
      stationMeasurementsT12,
      stationMeasurementsT24,
      stationMeasurementsT48,
      localMeasurements,
      symptomDescription,
      severity,
    } = req.body;

    if (!images || !Array.isArray(images) || images.length === 0) {
      return res.status(400).json({ error: "Yêu cầu ít nhất 1 ảnh chụp" });
    }
    if (!cropType || !cropType.trim()) {
      return res.status(400).json({ error: "Loại cây trồng là bắt buộc" });
    }
    if (!growthStage) {
      return res
        .status(400)
        .json({ error: "Giai đoạn sinh trưởng là bắt buộc" });
    }
    if (!GROWTH_STAGE_IDS.includes(growthStage as GrowthStageId)) {
      return res
        .status(400)
        .json({ error: "Giai đoạn sinh trưởng không hợp lệ" });
    }
    if (!envMode) {
      return res.status(400).json({ error: "Môi trường là bắt buộc" });
    }
    if (!severity || typeof severity !== "string") {
      return res.status(400).json({ error: "Mức độ nghiêm trọng là bắt buộc" });
    }
    const normalizedSeverity = severity.trim() as SymptomSeverity;
    if (
      !SYMPTOM_SEVERITY_VALUES.includes(normalizedSeverity as SymptomSeverity)
    ) {
      return res
        .status(400)
        .json({ error: "Mức độ nghiêm trọng không hợp lệ" });
    }
    const cleanSymptomDescription =
      typeof symptomDescription === "string" ? symptomDescription.trim() : "";
    if (!cleanSymptomDescription) {
      return res.status(400).json({ error: "Mô tả triệu chứng là bắt buộc" });
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
    const newSession = await persistCompletedSession({
      captureLocation,
      cropType,
      envMode,
      growthStage,
      images,
      localMeasurements,
      normalizedDisease,
      normalizedSeverity,
      normalizedStationMeasurements,
      normalizedSymptomDescription,
      plotId,
      reqUser: user,
      sessionId,
      stationMeasurementsT12,
      stationMeasurementsT24,
      stationMeasurementsT48,
    });

    return res.status(201).json({
      session: newSession,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("Create session failed:", message);
    return res.status(502).json({
      error: message || "Khong the tai anh len Firebase Storage",
    });
  }
};

/**
 * PATCH /api/sessions/:id
 * Updates an existing completed CaptureSession instead of creating a new one.
 */
export const updateSession = async (req: Request, res: Response) => {
  try {
    const reqUser = req.user!;
    const existingSession = await CaptureSessionModel.findOne(
      buildSessionQuery(req.params.id),
    );

    if (!existingSession) {
      return res.status(404).json({ error: "Không tìm thấy phiên chụp" });
    }

    const isAuthor =
      existingSession.farmerId === reqUser.id ||
      (existingSession.farmerEmail &&
        existingSession.farmerEmail === reqUser.email);
    if (!isAuthor) {
      return res.status(403).json({
        error: "Chỉ admin tác giả của phiên chụp này mới có quyền chỉnh sửa.",
      });
    }

    const {
      images,
      plotId,
      cropType,
      growthStage,
      envMode,
      captureLocation,
      stationMeasurements,
      stationMeasurementsT12,
      stationMeasurementsT24,
      stationMeasurementsT48,
      localMeasurements,
      symptomDescription,
      severity,
    } = req.body;

    if (!images || !Array.isArray(images) || images.length === 0) {
      return res.status(400).json({ error: "Yêu cầu ít nhất 1 ảnh chụp" });
    }
    if (!cropType || !cropType.trim()) {
      return res.status(400).json({ error: "Loại cây trồng là bắt buộc" });
    }
    if (!growthStage) {
      return res
        .status(400)
        .json({ error: "Giai đoạn sinh trưởng là bắt buộc" });
    }
    if (!GROWTH_STAGE_IDS.includes(growthStage as GrowthStageId)) {
      return res
        .status(400)
        .json({ error: "Giai đoạn sinh trưởng không hợp lệ" });
    }
    if (!envMode) {
      return res.status(400).json({ error: "Môi trường là bắt buộc" });
    }
    if (!severity || typeof severity !== "string") {
      return res.status(400).json({ error: "Mức độ nghiêm trọng là bắt buộc" });
    }
    const normalizedSeverity = severity.trim() as SymptomSeverity;
    if (
      !SYMPTOM_SEVERITY_VALUES.includes(normalizedSeverity as SymptomSeverity)
    ) {
      return res
        .status(400)
        .json({ error: "Mức độ nghiêm trọng không hợp lệ" });
    }
    const cleanSymptomDescription =
      typeof symptomDescription === "string" ? symptomDescription.trim() : "";
    if (!cleanSymptomDescription) {
      return res.status(400).json({ error: "Mô tả triệu chứng là bắt buộc" });
    }

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

    const updatedSession = await persistCompletedSession(
      {
        captureLocation,
        cropType,
        envMode,
        growthStage,
        images,
        localMeasurements,
        normalizedDisease,
        normalizedSeverity,
        normalizedStationMeasurements,
        normalizedSymptomDescription: cleanSymptomDescription,
        plotId,
        reqUser,
        sessionId: existingSession.sessionId,
        stationMeasurementsT12,
        stationMeasurementsT24,
        stationMeasurementsT48,
      },
      req.params.id,
      existingSession.files,
    );

    if (!updatedSession) {
      return res.status(404).json({ error: "Không tìm thấy phiên chụp" });
    }

    return res.json({ session: updatedSession });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("Update session failed:", message);
    return res.status(502).json({
      error: message || "Khong the cap nhat phien chup",
    });
  }
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
