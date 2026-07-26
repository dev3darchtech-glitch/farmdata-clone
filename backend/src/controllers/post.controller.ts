import { Request, Response } from "express";
import mongoose, { FilterQuery } from "mongoose";
import { CaptureSessionModel } from "../models/CaptureSession";
import { IPostDocument, PostModel } from "../models/Post";
import {
  buildCaptureImageDescription,
  uploadImagesToAdminDrive,
} from "../services/googleDriveService";
import { notifyPostPublished } from "../services/pushNotificationService";
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
 * GET /api/posts
 * Fetch post feed with optional crop and search filter.
 */
export const getPosts = async (req: Request, res: Response) => {
  const { crop, env, plot, q, severity, sort } = req.query;

  const filter: FilterQuery<IPostDocument> = {};

  if (crop && typeof crop === "string" && !["ALL", "all"].includes(crop)) {
    filter.cropType = new RegExp(`^${crop}$`, "i");
  }

  if (plot && typeof plot === "string" && !["ALL", "all"].includes(plot)) {
    filter.plotId = new RegExp(`^${plot}$`, "i");
  }

  if (env && typeof env === "string" && !["ALL", "all"].includes(env)) {
    filter.envMode = env;
  }

  if (
    severity &&
    typeof severity === "string" &&
    !["ALL", "all"].includes(severity)
  ) {
    filter.severity = severity;
  }

  if (q && typeof q === "string" && q.trim()) {
    const searchRegex = new RegExp(q.trim(), "i");
    filter.$or = [
      { cropType: searchRegex },
      { plotId: searchRegex },
      { symptomDescription: searchRegex },
      { "user.name": searchRegex },
    ];
  }

  const sortOption =
    typeof sort === "string" && sort.trim() ? sort.trim() : "newest";
  const severityOrder = [...SYMPTOM_SEVERITY_VALUES];
  const sortBy: Record<string, 1 | -1> =
    sortOption === "oldest"
      ? { createdAt: 1 }
      : sortOption === "plotAsc"
        ? { plotId: 1, createdAt: -1 }
        : sortOption === "plotDesc"
          ? { plotId: -1, createdAt: -1 }
          : sortOption === "cropAsc"
            ? { cropType: 1, createdAt: -1 }
            : sortOption === "cropDesc"
              ? { cropType: -1, createdAt: -1 }
              : { createdAt: -1 };

  let posts = await PostModel.find(filter).sort(sortBy);
  if (sortOption === "severity") {
    posts = posts.sort(
      (a, b) =>
        severityOrder.indexOf(b.severity) - severityOrder.indexOf(a.severity),
    );
  }

  return res.json(posts);
};

/**
 * GET /api/posts/:id
 */
export const getPostById = async (req: Request, res: Response) => {
  const postQuery = mongoose.isValidObjectId(req.params.id)
    ? { $or: [{ _id: req.params.id }, { postId: req.params.id }] }
    : { postId: req.params.id };
  const post = await PostModel.findOne(postQuery);
  if (!post) {
    return res.status(404).json({ error: "Post not found" });
  }
  return res.json(post);
};

/**
 * POST /api/posts
 * Admin publishes a post from an existing capture session.
 */
export const createPost = async (req: Request, res: Response) => {
  const {
    cropType,
    growthStage,
    images,
    plotId,
    sessionId,
    severity,
    symptomDescription,
    weatherCode,
  } = req.body;

  if (sessionId && typeof sessionId === "string") {
    const sessionQuery = mongoose.isValidObjectId(sessionId)
      ? { $or: [{ _id: sessionId }, { sessionId }] }
      : { sessionId };
    const session = await CaptureSessionModel.findOne(sessionQuery);
    if (!session) {
      return res.status(404).json({ error: "Capture session not found" });
    }

    const existingPost = await PostModel.findOne({
      sessionId: session.sessionId,
    });
    if (existingPost) {
      return res.status(409).json({ error: "Post already exists for session" });
    }

    const post = await PostModel.create({
      postId: `POST-${Date.now()}`,
      sessionId: session.sessionId,
      user: {
        id: session.farmerId,
        name: session.farmerName,
        email: session.farmerEmail,
        role: "FARMER",
      },
      cropType: session.cropType,
      plotId: session.plotId,
      growthStage: session.growthStage,
      envMode: session.envMode,
      captureLocation: session.captureLocation,
      symptomDescription: session.symptomDescription,
      severity: session.severity,
      images: session.images,
      driveFiles: session.driveFiles,
      stationMeasurements: session.stationMeasurements,
      localMeasurements: session.localMeasurements,
      diseaseGroup: session.diseaseGroup,
      diseaseType: session.diseaseType,
      diseaseName: session.diseaseName,
      status: "PUBLISHED",
    });

    return res.status(201).json(post);
  }

  if (!plotId || typeof plotId !== "string" || !plotId.trim()) {
    return res.status(400).json({ error: "plotId is required" });
  }
  if (!cropType || typeof cropType !== "string" || !cropType.trim()) {
    return res.status(400).json({ error: "cropType is required" });
  }
  if (
    !growthStage ||
    !GROWTH_STAGE_IDS.includes(growthStage as GrowthStageId)
  ) {
    return res.status(400).json({ error: "growthStage is invalid" });
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

  const user = req.user!;
  const normalizedWeatherCode =
    typeof weatherCode === "number" && Number.isFinite(weatherCode)
      ? weatherCode
      : 0;
  const sessionIdForPost = `MANUAL-${Date.now()}`;
  const stationMeasurements = {
    temperature: 28,
    lightUvIndex: 50,
    windSpeed: 10,
    co2Level: 400,
    weatherCode: normalizedWeatherCode,
  };
  const cleanPlotId = plotId.trim().toUpperCase();
  const normalizedDisease = normalizeDiseaseFields(req, res);
  if (normalizedDisease === undefined) {
    return;
  }
  let postImages: string[] = [];
  let driveFiles;

  if (Array.isArray(images) && images.length > 0) {
    driveFiles = await uploadImagesToAdminDrive(
      user.id,
      images,
      cropType.trim(),
      growthStage,
      normalizedSeverity,
      (imageIndex) =>
        buildCaptureImageDescription(
          {
            sessionId: sessionIdForPost,
            farmerName: user.name,
            farmerEmail: user.email,
            plotId: cleanPlotId,
            cropType: cropType.trim(),
            growthStage,
            envMode: "outdoor",
            stationMeasurements,
            ...normalizedDisease,
            symptomDescription: cleanSymptomDescription,
            severity: normalizedSeverity,
          },
          imageIndex,
        ),
      "post",
      {
        cropType: cropType.trim(),
        growthStage,
        severity: normalizedSeverity,
        stationMeasurements,
        symptomDescription: cleanSymptomDescription,
      },
    );
    const driveImageLinks = driveFiles
      .map((file) => file.webContentLink || file.webViewLink)
      .filter((link): link is string => Boolean(link));
    postImages =
      driveImageLinks.length === images.length ? driveImageLinks : images;
  }

  const post = await PostModel.create({
    postId: `POST-${Date.now()}`,
    sessionId: sessionIdForPost,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
    cropType: cropType.trim(),
    plotId: cleanPlotId,
    growthStage,
    envMode: "outdoor",
    symptomDescription: cleanSymptomDescription,
    severity: normalizedSeverity,
    images: postImages,
    driveFiles,
    stationMeasurements,
    ...normalizedDisease,
    status: "PUBLISHED",
  });

  void notifyPostPublished(post).catch((error) =>
    console.warn(
      "Post notification failed:",
      error instanceof Error ? error.message : String(error),
    ),
  );

  return res.status(201).json(post);
};
