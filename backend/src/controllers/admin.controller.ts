import bcrypt from "bcryptjs";
import { Request, Response } from "express";
import { CropModel } from "../models/Crop";
import { PlotModel } from "../models/Plot";
import { UserModel } from "../models/User";

function isCreatedByCurrentAdmin(
  target: { createdByAdminId?: unknown },
  req: Request,
) {
  return String(target.createdByAdminId || "") === req.user!.id;
}

/**
 * GET /api/admin/plots
 */
export const getPlots = async (req: Request, res: Response) => {
  const plots = await PlotModel.find().sort({ code: 1 });
  return res.json(plots);
};

/**
 * POST /api/admin/plots
 */
export const createPlot = async (req: Request, res: Response) => {
  const { code, name, areaSquareMeters } = req.body;
  if (!code || !name) {
    return res.status(400).json({ error: "code and name are required" });
  }

  const existing = await PlotModel.findOne({ code: code.trim().toUpperCase() });
  if (existing) {
    return res
      .status(400)
      .json({ error: `Plot code '${code}' already exists` });
  }

  const newPlot = await PlotModel.create({
    code: code.trim().toUpperCase(),
    name: name.trim(),
    areaSquareMeters,
  });

  return res.status(201).json(newPlot);
};

/**
 * PATCH /api/admin/plots/:id
 */
export const updatePlot = async (req: Request, res: Response) => {
  const target = await PlotModel.findById(req.params.id);
  if (!target) {
    return res.status(404).json({ error: "Plot not found" });
  }

  const { code, name, areaSquareMeters, isActive } = req.body;
  if (
    code === undefined &&
    name === undefined &&
    areaSquareMeters === undefined &&
    isActive === undefined
  ) {
    return res.status(400).json({
      error: "code, name, areaSquareMeters, or isActive is required",
    });
  }

  if (code && String(code).trim()) {
    const normalizedCode = String(code).trim().toUpperCase();
    const existing = await PlotModel.findOne({
      code: normalizedCode,
      _id: { $ne: target._id },
    });
    if (existing) {
      return res.status(400).json({
        error: `Plot code '${normalizedCode}' already exists`,
      });
    }
    target.code = normalizedCode;
  }

  if (name && String(name).trim()) {
    target.name = String(name).trim();
  }

  if (areaSquareMeters === null || areaSquareMeters === "") {
    target.areaSquareMeters = undefined;
  } else if (areaSquareMeters !== undefined) {
    const parsedArea = Number(areaSquareMeters);
    if (!Number.isFinite(parsedArea) || parsedArea < 0) {
      return res.status(400).json({ error: "areaSquareMeters is invalid" });
    }
    target.areaSquareMeters = parsedArea;
  }

  if (typeof isActive === "boolean") {
    target.isActive = isActive;
  }

  await target.save();
  return res.json(target);
};

/**
 * PATCH /api/admin/plots/:id/deactivate
 */
export const deactivatePlot = async (req: Request, res: Response) => {
  const target = await PlotModel.findById(req.params.id);
  if (!target) {
    return res.status(404).json({ error: "Plot not found" });
  }

  target.isActive = false;
  await target.save();
  return res.json(target);
};

/**
 * GET /api/admin/crops
 */
export const getCrops = async (req: Request, res: Response) => {
  const crops = await CropModel.find().sort({ name: 1 });
  return res.json(crops);
};

/**
 * POST /api/admin/crops
 */
export const createCrop = async (req: Request, res: Response) => {
  const { name, category, icon } = req.body;
  if (!name) {
    return res.status(400).json({ error: "name is required" });
  }

  const newCrop = await CropModel.create({
    name: name.trim(),
    category: category ? category.trim() : "Rau ăn quả",
    icon: icon || "🌱",
  });

  return res.status(201).json(newCrop);
};

/**
 * PATCH /api/admin/crops/:id
 */
export const updateCrop = async (req: Request, res: Response) => {
  const target = await CropModel.findById(req.params.id);
  if (!target) {
    return res.status(404).json({ error: "Crop not found" });
  }

  const { name, category, icon, isActive } = req.body;
  if (
    name === undefined &&
    category === undefined &&
    icon === undefined &&
    isActive === undefined
  ) {
    return res
      .status(400)
      .json({ error: "name, category, icon, or isActive is required" });
  }

  if (name && String(name).trim()) {
    const normalizedName = String(name).trim();
    const existing = await CropModel.findOne({
      name: normalizedName,
      _id: { $ne: target._id },
    });
    if (existing) {
      return res.status(400).json({
        error: `Crop name '${normalizedName}' already exists`,
      });
    }
    target.name = normalizedName;
  }

  if (category && String(category).trim()) {
    target.category = String(category).trim();
  }

  if (icon !== undefined) {
    target.icon = icon || "🌱";
  }

  if (typeof isActive === "boolean") {
    target.isActive = isActive;
  }

  await target.save();
  return res.json(target);
};

/**
 * PATCH /api/admin/crops/:id/deactivate
 */
export const deactivateCrop = async (req: Request, res: Response) => {
  const target = await CropModel.findById(req.params.id);
  if (!target) {
    return res.status(404).json({ error: "Crop not found" });
  }

  target.isActive = false;
  await target.save();
  return res.json(target);
};

/**
 * GET /api/admin/users
 */
export const getUsers = async (req: Request, res: Response) => {
  const users = await UserModel.find({
    role: "FARMER",
    createdByAdminId: req.user!.id,
  })
    .select("-passwordHash")
    .populate("createdByAdminId", "name email")
    .populate("revokedByAdminId", "name email");
  return res.json(users);
};

/**
 * POST /api/admin/users
 * Admin creates FARMER user accounts only.
 * Stores `createdByAdminId` referencing current Admin user ID.
 */
export const createUser = async (req: Request, res: Response) => {
  const { name, username, password, role = "FARMER" } = req.body;
  if (!name || !username || !password) {
    return res
      .status(400)
      .json({ error: "name, username, and password are required" });
  }
  if (role !== "FARMER") {
    return res
      .status(403)
      .json({ error: "Admins can only create FARMER accounts" });
  }

  const cleanUsername = String(username)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
  if (!cleanUsername) {
    return res.status(400).json({ error: "username is invalid" });
  }

  const existing = await UserModel.findOne({ username: cleanUsername });
  if (existing) {
    return res
      .status(400)
      .json({ error: `User with username '${cleanUsername}' already exists` });
  }

  const newUser = await UserModel.create({
    name: name.trim(),
    username: cleanUsername,
    passwordHash: bcrypt.hashSync(password, 8),
    role,
    createdByAdminId: req.user!.id,
    isRevoked: false,
  });

  const { passwordHash: _passwordHash, ...safeUser } = newUser.toObject();
  return res.status(201).json(safeUser);
};

/**
 * PATCH /api/admin/users/:id
 * Admin updates FARMER account profile/password only. ADMIN accounts are immutable here.
 */
export const updateUser = async (req: Request, res: Response) => {
  const target = await UserModel.findById(req.params.id).select(
    "+passwordHash",
  );
  if (!target) {
    return res.status(404).json({ error: "User not found" });
  }
  if (target.role !== "FARMER") {
    return res.status(403).json({
      error: "Admins can only update FARMER accounts",
    });
  }
  if (!isCreatedByCurrentAdmin(target, req)) {
    return res
      .status(403)
      .json({ error: "Cannot update a farmer created by another admin" });
  }

  const { name, username, password } = req.body;
  if (!name && !username && !password) {
    return res
      .status(400)
      .json({ error: "name, username, or password is required" });
  }

  if (name && String(name).trim()) {
    target.name = String(name).trim();
  }

  if (username && String(username).trim()) {
    const normalizedUsername = String(username)
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "");
    if (!normalizedUsername) {
      return res.status(400).json({ error: "username is invalid" });
    }
    const existing = await UserModel.findOne({
      username: normalizedUsername,
      _id: { $ne: target._id },
    });
    if (existing) {
      return res.status(400).json({
        error: `User with username '${normalizedUsername}' already exists`,
      });
    }
    target.username = normalizedUsername;
  }

  if (password && String(password).trim()) {
    target.passwordHash = bcrypt.hashSync(String(password), 8);
  }

  await target.save();
  const { passwordHash: _passwordHash, ...safeUser } = target.toObject();
  return res.json(safeUser);
};

/**
 * PATCH /api/admin/users/:id/revoke
 * Admin revokes a FARMER account they created. Existing JWTs are rejected by auth middleware.
 */
export const revokeUser = async (req: Request, res: Response) => {
  const target = await UserModel.findById(req.params.id).select(
    "-passwordHash",
  );
  if (!target) {
    return res.status(404).json({ error: "User not found" });
  }
  if (target.role !== "FARMER") {
    return res
      .status(403)
      .json({ error: "Admins can only revoke FARMER accounts" });
  }
  if (target._id.toString() === req.user!.id) {
    return res.status(400).json({ error: "Cannot revoke your own account" });
  }
  if (!isCreatedByCurrentAdmin(target, req)) {
    return res
      .status(403)
      .json({ error: "Cannot revoke a farmer created by another admin" });
  }

  target.isRevoked = true;
  target.revokedAt = new Date();
  target.revokedByAdminId = req.user!.id as any;
  await target.save();

  return res.json(target);
};
