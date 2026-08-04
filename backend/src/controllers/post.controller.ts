import { Request, Response } from "express";
import mongoose, { FilterQuery } from "mongoose";
import { CaptureSessionModel } from "../models/CaptureSession";
import { PlotModel } from "../models/Plot";
import { SYMPTOM_SEVERITY_VALUES } from "../types";

const mapSessionToPost = (
  session: any,
  plotFarmMap?: Map<string, { farmId: string; farmName: string }>,
) => {
  const plotCodeUpper = (session.plotId || "").toUpperCase().trim();
  const plotCodeNorm = plotCodeUpper.replace(/[^A-Z0-9]/g, "");
  const resolved =
    plotFarmMap?.get(plotCodeUpper) || plotFarmMap?.get(plotCodeNorm);
  const farmId =
    resolved?.farmId ||
    session.farmId?._id ||
    session.farmId?.id ||
    session.farmId;
  const farmName = resolved?.farmName || session.farmId?.name || "N/A";

  return {
    id: session.sessionId || session._id.toString(),
    postId: session.sessionId,
    sessionId: session.sessionId,
    user: {
      id: session.farmerId,
      name: session.farmerName,
      email: session.farmerEmail,
      role: session.createdByRole || "FARMER",
    },
    cropType: session.cropType,
    plotId: session.plotId,
    farmId,
    farmName,
    growthStage: session.growthStage,
    envMode: session.envMode,
    captureLocation: session.captureLocation,
    symptomDescription: session.symptomDescription,
    severity: session.severity,
    images: (() => {
      if (session.files && Array.isArray(session.files)) {
        const markLinks = session.files
          .map((f: any) => f.watermarkWebContentLink || f.watermarkWebViewLink)
          .filter(Boolean);
        if (markLinks.length > 0) {
          return markLinks;
        }
      }
      return session.images || [];
    })(),
    stationMeasurements: session.stationMeasurements,
    stationMeasurementsT12: session.stationMeasurementsT12,
    stationMeasurementsT24: session.stationMeasurementsT24,
    stationMeasurementsT48: session.stationMeasurementsT48,
    localMeasurements: session.localMeasurements,
    diseaseGroup: session.diseaseGroup,
    diseaseType: session.diseaseType,
    diseaseName: session.diseaseName,
    diseasedPart: session.diseasedPart,
    status: "PUBLISHED",
    createdAt: session.createdAt,
    updatedAt: session.updatedAt,
  };
};

/**
 * GET /api/posts
 * Fetch post feed from completed capture sessions.
 */
export const getPosts = async (req: Request, res: Response) => {
  try {
    const {
      page: pageStr,
      crop,
      env,
      plot,
      q,
      severity,
      sort,
      datePreset,
      startDate,
      endDate,
      mine,
      limit: limitStr,
      offset: offsetStr,
    } = req.query;

    const limit = Math.min(Number(limitStr) || 10, 50);
    const page = Math.max(Number(pageStr) || 1, 1);
    const offset =
      pageStr !== undefined
        ? (page - 1) * limit
        : Math.max(Number(offsetStr) || 0, 0);

    const filter: FilterQuery<any> = {
      status: "COMPLETED",
    };

    if (mine === "true") {
      const reqUser = req.user;
      if (!reqUser?.id) {
        return res.status(401).json({ error: "Chưa xác thực người dùng." });
      }
      filter.farmerId = reqUser.id;
    }

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
        { farmerName: searchRegex },
      ];
    }

    const now = new Date();
    const createdAtFilter: Record<string, Date> = {};
    if (datePreset === "today") {
      const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const end = new Date(start.getTime() + 86400000 - 1);
      createdAtFilter.$gte = start;
      createdAtFilter.$lte = end;
    } else if (datePreset === "7days") {
      createdAtFilter.$gte = new Date(now.getTime() - 7 * 86400000);
    } else if (datePreset === "30days") {
      createdAtFilter.$gte = new Date(now.getTime() - 30 * 86400000);
    } else if (datePreset === "custom") {
      if (typeof startDate === "string" && startDate.trim()) {
        const parsedStart = new Date(`${startDate.trim()}T00:00:00`);
        if (!Number.isNaN(parsedStart.getTime())) {
          createdAtFilter.$gte = parsedStart;
        }
      }
      if (typeof endDate === "string" && endDate.trim()) {
        const parsedEnd = new Date(`${endDate.trim()}T23:59:59.999`);
        if (!Number.isNaN(parsedEnd.getTime())) {
          createdAtFilter.$lte = parsedEnd;
        }
      }
    }

    if (Object.keys(createdAtFilter).length > 0) {
      filter.createdAt = createdAtFilter;
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

    const total = await CaptureSessionModel.countDocuments(filter);

    let sessions = await CaptureSessionModel.find(filter)
      .populate("farmId")
      .sort(sortBy)
      .skip(offset)
      .limit(limit + 1); // fetch one extra to detect hasMore

    // severity sort is client-side only for now; keep existing behaviour
    if (sortOption === "severity") {
      sessions = sessions.sort(
        (a, b) =>
          severityOrder.indexOf(b.severity) - severityOrder.indexOf(a.severity),
      );
    }

    const hasMore = sessions.length > limit;
    const pageSessions = hasMore ? sessions.slice(0, limit) : sessions;

    // Load plot-farm relationships to map legacy sessions
    const plotsList = await PlotModel.find().populate("farmId");
    const plotFarmMap = new Map<string, { farmId: string; farmName: string }>();
    for (const plot of plotsList) {
      if (plot.code) {
        const entry = {
          farmId:
            (plot.farmId as any)?._id?.toString() ||
            (plot.farmId as any)?.id?.toString() ||
            plot.farmId?.toString(),
          farmName: (plot.farmId as any)?.name || "N/A",
        };
        const exactKey = plot.code.toUpperCase().trim();
        const normKey = exactKey.replace(/[^A-Z0-9]/g, "");
        plotFarmMap.set(exactKey, entry);
        if (normKey !== exactKey) plotFarmMap.set(normKey, entry);
      }
    }

    const posts = pageSessions.map((s) => mapSessionToPost(s, plotFarmMap));
    const totalPages = Math.max(1, Math.ceil(total / limit));

    return res.json({
      items: posts,
      posts,
      total,
      page,
      limit,
      totalPages,
      hasMore,
      offset,
    });
  } catch (error: any) {
    return res
      .status(500)
      .json({ error: error?.message || "Không thể tải bài đăng." });
  }
};

/**
 * GET /api/posts/:id
 */
export const getPostById = async (req: Request, res: Response) => {
  try {
    const postQuery = mongoose.isValidObjectId(req.params.id)
      ? { $or: [{ _id: req.params.id }, { sessionId: req.params.id }] }
      : { sessionId: req.params.id };

    const session =
      await CaptureSessionModel.findOne(postQuery).populate("farmId");
    if (!session || session.status !== "COMPLETED") {
      return res.status(404).json({ error: "Không tìm thấy bài đăng" });
    }

    // Load plot-farm relationships to map legacy sessions
    const plotsList = await PlotModel.find().populate("farmId");
    const plotFarmMap = new Map<string, { farmId: string; farmName: string }>();
    for (const plot of plotsList) {
      if (plot.code) {
        const entry = {
          farmId:
            (plot.farmId as any)?._id?.toString() ||
            (plot.farmId as any)?.id?.toString() ||
            plot.farmId?.toString(),
          farmName: (plot.farmId as any)?.name || "N/A",
        };
        const exactKey = plot.code.toUpperCase().trim();
        const normKey = exactKey.replace(/[^A-Z0-9]/g, "");
        plotFarmMap.set(exactKey, entry);
        if (normKey !== exactKey) plotFarmMap.set(normKey, entry);
      }
    }

    return res.json(mapSessionToPost(session, plotFarmMap));
  } catch (error: any) {
    return res
      .status(500)
      .json({ error: error?.message || "Không thể lấy chi tiết bài đăng." });
  }
};

/**
 * POST /api/posts (STUB - DEPRECATED)
 */
export const createPost = async (req: Request, res: Response) => {
  return res.status(410).json({
    error:
      "Tính năng tạo bài đăng thủ công đã bị xóa. Hãy sử dụng API CaptureSession.",
  });
};

/**
 * DELETE /api/posts/:id
 * Delete post. Any admin can delete any post.
 */
export const deletePost = async (req: Request, res: Response) => {
  try {
    const postId = req.params.id;
    const postQuery = mongoose.isValidObjectId(postId)
      ? { $or: [{ _id: postId }, { sessionId: postId }] }
      : { sessionId: postId };

    const session = await CaptureSessionModel.findOne(postQuery);
    if (!session) {
      return res.status(404).json({ error: "Không tìm thấy bài đăng" });
    }

    await CaptureSessionModel.deleteOne({ _id: session._id });
    return res.json({ message: "Đã xóa bài đăng thành công." });
  } catch (error) {
    return res.status(500).json({ error: "Không thể xóa bài đăng." });
  }
};
