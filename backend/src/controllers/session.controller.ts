import { Request, Response } from "express";
import { CaptureSessionModel } from "../models/CaptureSession";
import { PostModel } from "../models/Post";
import { uploadImagesToAdminDrive } from "../services/googleDriveService";

/**
 * POST /api/sessions
 * Creates a CaptureSession and automatically generates linked Post in MongoDB.
 */
export const createSession = async (req: Request, res: Response) => {
  const user = req.user!;
  const {
    images,
    plotId,
    cropType,
    growthStage,
    envMode,
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
  if (!envMode) {
    return res.status(400).json({ error: "envMode is required" });
  }
  if (!symptomDescription || !symptomDescription.trim()) {
    return res.status(400).json({ error: "symptomDescription is required" });
  }
  if (!severity) {
    return res.status(400).json({ error: "severity is required" });
  }

  // Upload session photos to creator Admin's Google Drive storage with label names
  const driveFiles = await uploadImagesToAdminDrive(
    user.email,
    images,
    cropType,
    growthStage,
  );

  const sessionId = `SESS-${Date.now()}`;
  const cleanPlotId =
    plotId && plotId.trim() ? plotId.trim().toUpperCase() : undefined;

  const newSession = await CaptureSessionModel.create({
    sessionId,
    farmerId: user.id,
    farmerName: user.name,
    farmerEmail: user.email,
    images,
    driveFiles,
    plotId: cleanPlotId,
    cropType: cropType.trim(),
    growthStage,
    envMode,
    stationMeasurements: stationMeasurements || {
      temperature: 28.0,
      lightUvIndex: 50,
      windSpeed: 10.0,
      co2Level: 400,
    },
    localMeasurements,
    symptomDescription: symptomDescription.trim(),
    severity,
    status: "COMPLETED",
  });

  const autoPost = await PostModel.create({
    postId: `POST-${Date.now()}`,
    sessionId: newSession.sessionId,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
    cropType: newSession.cropType,
    plotId: newSession.plotId,
    growthStage: newSession.growthStage,
    envMode: newSession.envMode,
    symptomDescription: newSession.symptomDescription,
    severity: newSession.severity,
    images: newSession.images,
    driveFiles: newSession.driveFiles,
    stationMeasurements: newSession.stationMeasurements,
    localMeasurements: newSession.localMeasurements,
    status: "PUBLISHED",
  });

  return res.status(201).json({
    session: newSession,
    post: autoPost,
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
