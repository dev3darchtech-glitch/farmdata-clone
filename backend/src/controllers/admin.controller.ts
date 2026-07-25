import bcrypt from "bcryptjs";
import { Request, Response } from "express";
import { CropModel } from "../models/Crop";
import { PlotModel } from "../models/Plot";
import { UserModel } from "../models/User";

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
 * GET /api/admin/users
 */
export const getUsers = async (req: Request, res: Response) => {
  const users = await UserModel.find()
    .select("-passwordHash")
    .populate("createdByAdminId", "name email");
  return res.json(users);
};

/**
 * POST /api/admin/users
 * Admin creates user account (Farmer/Admin).
 * Stores `createdByAdminId` referencing current Admin user ID.
 */
export const createUser = async (req: Request, res: Response) => {
  const { name, email, password, role } = req.body;
  if (!name || !email || !password || !role) {
    return res
      .status(400)
      .json({ error: "name, email, password, and role are required" });
  }

  const existing = await UserModel.findOne({
    email: email.trim().toLowerCase(),
  });
  if (existing) {
    return res
      .status(400)
      .json({ error: `User with email '${email}' already exists` });
  }

  const newUser = await UserModel.create({
    name: name.trim(),
    email: email.trim().toLowerCase(),
    passwordHash: bcrypt.hashSync(password, 8),
    role,
    createdByAdminId: req.user!.id,
  });

  const { passwordHash: _passwordHash, ...safeUser } = newUser.toObject();
  return res.status(201).json(safeUser);
};
