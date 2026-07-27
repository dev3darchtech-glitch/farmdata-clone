import bcrypt from "bcryptjs";
import { Request, Response } from "express";
import { CropModel } from "../models/Crop";
import { PlantDiseaseModel } from "../models/PlantDisease";
import { PlotModel } from "../models/Plot";
import { UserModel } from "../models/User";
import { PLANT_DISEASE_GROUPS, PlantDiseaseGroup } from "../types";

function isCreatedByCurrentAdmin(
  target: { createdByAdminId?: unknown },
  req: Request,
) {
  return String(target.createdByAdminId || "") === req.user!.id;
}

function readRequestedActiveStatus(req: Request, res: Response) {
  if (typeof req.body?.isActive !== "boolean") {
    res.status(400).json({ error: "Trường isActive phải là kiểu boolean" });
    return undefined;
  }

  return req.body.isActive as boolean;
}

function isPlantDiseaseGroup(value: unknown): value is PlantDiseaseGroup {
  return (
    typeof value === "string" &&
    PLANT_DISEASE_GROUPS.includes(value as PlantDiseaseGroup)
  );
}

function normalizeRequiredText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

async function buildMasterDataFilter(req: Request) {
  const user = req.user!;
  if (user.role === "ADMIN") {
    return {
      $or: [
        { createdByAdminId: null },
        { createdByAdminId: { $exists: false } },
        { createdByAdminId: user.id },
      ],
    };
  } else if (user.role === "FARMER") {
    const farmer = await UserModel.findById(user.id);
    const adminId = farmer?.createdByAdminId;
    return {
      $or: [
        { createdByAdminId: null },
        { createdByAdminId: { $exists: false } },
        ...(adminId ? [{ createdByAdminId: adminId }] : []),
      ],
    };
  }
  return {
    $or: [{ createdByAdminId: null }, { createdByAdminId: { $exists: false } }],
  };
}

function checkMasterDataMutationPermission(
  target: { createdByAdminId?: unknown },
  req: Request,
  resourceName: string,
) {
  if (!target.createdByAdminId) {
    return `Dữ liệu mặc định của hệ thống không thể chỉnh sửa hoặc thay đổi.`;
  }
  if (String(target.createdByAdminId) !== req.user!.id) {
    return `Bạn chỉ có quyền thao tác trên ${resourceName} do chính bạn tạo ra.`;
  }
  return null;
}

/**
 * GET /api/admin/plots
 */
export const getPlots = async (req: Request, res: Response) => {
  const filter = await buildMasterDataFilter(req);
  const plots = await PlotModel.find(filter).sort({ code: 1 });
  return res.json(plots);
};

/**
 * POST /api/admin/plots
 */
export const createPlot = async (req: Request, res: Response) => {
  const { code, name, areaSquareMeters } = req.body;
  if (!code || !name) {
    return res.status(400).json({ error: "Mã luống và tên luống là bắt buộc" });
  }

  const cleanCode = code.trim().toUpperCase();
  const adminId = req.user!.id;

  const existing = await PlotModel.findOne({
    code: cleanCode,
    $or: [{ createdByAdminId: null }, { createdByAdminId: adminId }],
  });
  if (existing) {
    return res
      .status(400)
      .json({ error: `Mã luống '${cleanCode}' đã tồn tại.` });
  }

  const newPlot = await PlotModel.create({
    code: cleanCode,
    name: name.trim(),
    areaSquareMeters,
    createdByAdminId: adminId,
  });

  return res.status(201).json(newPlot);
};

/**
 * PATCH /api/admin/plots/:id
 */
export const updatePlot = async (req: Request, res: Response) => {
  const target = await PlotModel.findById(req.params.id);
  if (!target) {
    return res.status(404).json({ error: "Không tìm thấy luống" });
  }

  const permError = checkMasterDataMutationPermission(target, req, "mã luống");
  if (permError) {
    return res.status(403).json({ error: permError });
  }

  const { code, name, areaSquareMeters, isActive } = req.body;
  if (
    code === undefined &&
    name === undefined &&
    areaSquareMeters === undefined &&
    isActive === undefined
  ) {
    return res.status(400).json({
      error: "Cần cung cấp ít nhất một trong: mã, tên, diện tích hoặc trạng thái",
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
        error: `Mã luống '${normalizedCode}' đã tồn tại`,
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
      return res.status(400).json({ error: "Diện tích không hợp lệ" });
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
 * Body: { isActive: boolean }
 */
export const deactivatePlot = async (req: Request, res: Response) => {
  const requestedIsActive = readRequestedActiveStatus(req, res);
  if (requestedIsActive === undefined) {
    return;
  }

  const target = await PlotModel.findById(req.params.id);
  if (!target) {
    return res.status(404).json({ error: "Không tìm thấy luống" });
  }

  const permError = checkMasterDataMutationPermission(target, req, "mã luống");
  if (permError) {
    return res.status(403).json({ error: permError });
  }

  target.isActive = requestedIsActive;
  await target.save();
  return res.json(target);
};

/**
 * GET /api/admin/crops
 */
export const getCrops = async (req: Request, res: Response) => {
  const filter = await buildMasterDataFilter(req);
  const crops = await CropModel.find(filter).sort({ name: 1 });
  return res.json(crops);
};

/**
 * POST /api/admin/crops
 */
export const createCrop = async (req: Request, res: Response) => {
  const { name, category, icon } = req.body;
  if (!name) {
    return res.status(400).json({ error: "Tên loại cây là bắt buộc" });
  }

  const adminId = req.user!.id;
  const cleanName = name.trim();
  const existing = await CropModel.findOne({
    name: cleanName,
    $or: [{ createdByAdminId: null }, { createdByAdminId: adminId }],
  });
  if (existing) {
    return res
      .status(400)
      .json({ error: `Loại cây '${cleanName}' đã tồn tại.` });
  }

  const newCrop = await CropModel.create({
    name: cleanName,
    category: category ? category.trim() : "Rau ăn quả",
    icon: icon || "🌱",
    createdByAdminId: adminId,
  });

  return res.status(201).json(newCrop);
};

/**
 * PATCH /api/admin/crops/:id
 */
export const updateCrop = async (req: Request, res: Response) => {
  const target = await CropModel.findById(req.params.id);
  if (!target) {
    return res.status(404).json({ error: "Không tìm thấy loại cây" });
  }

  const permError = checkMasterDataMutationPermission(target, req, "loại cây");
  if (permError) {
    return res.status(403).json({ error: permError });
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
      .json({ error: "Cần cung cấp ít nhất một trong: tên, danh mục, icon hoặc trạng thái" });
  }

  if (name && String(name).trim()) {
    const normalizedName = String(name).trim();
    const existing = await CropModel.findOne({
      name: normalizedName,
      _id: { $ne: target._id },
    });
    if (existing) {
      return res.status(400).json({
        error: `Tên loại cây '${normalizedName}' đã tồn tại`,
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
 * Body: { isActive: boolean }
 */
export const deactivateCrop = async (req: Request, res: Response) => {
  const requestedIsActive = readRequestedActiveStatus(req, res);
  if (requestedIsActive === undefined) {
    return;
  }

  const target = await CropModel.findById(req.params.id);
  if (!target) {
    return res.status(404).json({ error: "Không tìm thấy loại cây" });
  }

  const permError = checkMasterDataMutationPermission(target, req, "loại cây");
  if (permError) {
    return res.status(403).json({ error: permError });
  }

  target.isActive = requestedIsActive;
  await target.save();
  return res.json(target);
};

/**
 * GET /api/admin/plant-diseases
 */
export const getPlantDiseases = async (req: Request, res: Response) => {
  const page = Number(req.query.page);
  const limit = Number(req.query.limit);
  const query = normalizeRequiredText(req.query.q);
  const shouldPaginate =
    Number.isInteger(page) &&
    Number.isInteger(limit) &&
    page > 0 &&
    limit > 0;

  const baseFilter = await buildMasterDataFilter(req);
  const searchFilter = query
    ? {
        $or: [
          { group: { $regex: query, $options: "i" } },
          { type: { $regex: query, $options: "i" } },
          { name: { $regex: query, $options: "i" } },
        ],
      }
    : {};
  const filter = { $and: [baseFilter, searchFilter] };

  const sort = {
    group: 1,
    type: 1,
    name: 1,
  } as const;

  if (shouldPaginate) {
    const safeLimit = Math.min(limit, 50);
    const skip = (page - 1) * safeLimit;
    const [diseases, total] = await Promise.all([
      PlantDiseaseModel.find(filter).sort(sort).skip(skip).limit(safeLimit),
      PlantDiseaseModel.countDocuments(filter),
    ]);

    return res.json({
      items: diseases,
      total,
      page,
      limit: safeLimit,
      totalPages: Math.max(1, Math.ceil(total / safeLimit)),
    });
  }

  const diseases = await PlantDiseaseModel.find(filter).sort(sort);
  return res.json(diseases);
};

/**
 * POST /api/admin/plant-diseases
 */
export const createPlantDisease = async (req: Request, res: Response) => {
  const group = req.body?.group;
  const type = normalizeRequiredText(req.body?.type);
  const name = normalizeRequiredText(req.body?.name);
  const description = normalizeRequiredText(req.body?.description);
  const adminId = req.user!.id;

  if (!isPlantDiseaseGroup(group)) {
    return res.status(400).json({ error: "Nhóm bệnh không hợp lệ" });
  }
  if (!type || !name) {
    return res.status(400).json({ error: "Phân loại và tên bệnh là bắt buộc" });
  }

  const existing = await PlantDiseaseModel.findOne({
    group,
    type,
    name,
    $or: [{ createdByAdminId: null }, { createdByAdminId: adminId }],
  });
  if (existing) {
    return res.status(400).json({
      error: `Bệnh cây '${name}' đã tồn tại trong '${type}'`,
    });
  }

  const newDisease = await PlantDiseaseModel.create({
    group,
    type,
    name,
    description: description || undefined,
    createdByAdminId: adminId,
  });

  return res.status(201).json(newDisease);
};

/**
 * PATCH /api/admin/plant-diseases/:id
 */
export const updatePlantDisease = async (req: Request, res: Response) => {
  const target = await PlantDiseaseModel.findById(req.params.id);
  if (!target) {
    return res.status(404).json({ error: "Không tìm thấy bệnh cây" });
  }

  const permError = checkMasterDataMutationPermission(target, req, "bệnh cây");
  if (permError) {
    return res.status(403).json({ error: permError });
  }

  const { group, type, name, description, isActive } = req.body;
  if (
    group === undefined &&
    type === undefined &&
    name === undefined &&
    description === undefined &&
    isActive === undefined
  ) {
    return res.status(400).json({
      error: "Cần cung cấp ít nhất một trong: nhóm bệnh, phân loại, tên, mô tả hoặc trạng thái",
    });
  }

  const nextGroup = group === undefined ? target.group : group;
  const nextType =
    type === undefined ? target.type : normalizeRequiredText(type);
  const nextName =
    name === undefined ? target.name : normalizeRequiredText(name);

  if (!isPlantDiseaseGroup(nextGroup)) {
    return res.status(400).json({ error: "Nhóm bệnh không hợp lệ" });
  }
  if (!nextType || !nextName) {
    return res.status(400).json({ error: "Phân loại và tên bệnh là bắt buộc" });
  }

  const existing = await PlantDiseaseModel.findOne({
    group: nextGroup,
    type: nextType,
    name: nextName,
    _id: { $ne: target._id },
  });
  if (existing) {
    return res.status(400).json({
      error: `Bệnh cây '${nextName}' đã tồn tại trong '${nextType}'`,
    });
  }

  target.group = nextGroup;
  target.type = nextType;
  target.name = nextName;
  if (description !== undefined) {
    const cleanDescription = normalizeRequiredText(description);
    target.description = cleanDescription || undefined;
  }
  if (typeof isActive === "boolean") {
    target.isActive = isActive;
  }

  await target.save();
  return res.json(target);
};

/**
 * PATCH /api/admin/plant-diseases/:id/deactivate
 * Body: { isActive: boolean }
 */
export const deactivatePlantDisease = async (req: Request, res: Response) => {
  const requestedIsActive = readRequestedActiveStatus(req, res);
  if (requestedIsActive === undefined) {
    return;
  }

  const target = await PlantDiseaseModel.findById(req.params.id);
  if (!target) {
    return res.status(404).json({ error: "Không tìm thấy bệnh cây" });
  }

  const permError = checkMasterDataMutationPermission(target, req, "bệnh cây");
  if (permError) {
    return res.status(403).json({ error: permError });
  }

  target.isActive = requestedIsActive;
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
      .json({ error: "Tên, tên đăng nhập và mật khẩu là bắt buộc" });
  }
  if (role !== "FARMER") {
    return res
      .status(403)
      .json({ error: "Admin chỉ có thể tạo tài khoản nông dân" });
  }

  const cleanUsername = String(username)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
  if (!cleanUsername) {
    return res.status(400).json({ error: "Tên đăng nhập không hợp lệ" });
  }

  const existing = await UserModel.findOne({ username: cleanUsername });
  if (existing) {
    return res
      .status(400)
      .json({ error: `Tên đăng nhập '${cleanUsername}' đã được sử dụng` });
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
    return res.status(404).json({ error: "Không tìm thấy người dùng" });
  }
  if (target.role !== "FARMER") {
    return res.status(403).json({
      error: "Admin chỉ có thể cập nhật tài khoản nông dân",
    });
  }
  if (!isCreatedByCurrentAdmin(target, req)) {
    return res
      .status(403)
      .json({ error: "Không thể cập nhật tài khoản nông dân do admin khác tạo" });
  }

  const { name, username, password } = req.body;
  if (!name && !username && !password) {
    return res
      .status(400)
      .json({ error: "Cần cung cấp ít nhất một trong: tên, tên đăng nhập hoặc mật khẩu" });
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
      return res.status(400).json({ error: "Tên đăng nhập không hợp lệ" });
    }
    const existing = await UserModel.findOne({
      username: normalizedUsername,
      _id: { $ne: target._id },
    });
    if (existing) {
      return res.status(400).json({
        error: `Tên đăng nhập '${normalizedUsername}' đã được sử dụng`,
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
    return res.status(404).json({ error: "Không tìm thấy người dùng" });
  }
  if (target.role !== "FARMER") {
    return res
      .status(403)
      .json({ error: "Admin chỉ có thể thu hồi tài khoản nông dân" });
  }
  if (target._id.toString() === req.user!.id) {
    return res.status(400).json({ error: "Không thể thu hồi tài khoản của chính mình" });
  }
  if (!isCreatedByCurrentAdmin(target, req)) {
    return res
      .status(403)
      .json({ error: "Không thể thu hồi tài khoản nông dân do admin khác tạo" });
  }

  target.isRevoked = true;
  target.revokedAt = new Date();
  target.revokedByAdminId = req.user!.id as any;
  await target.save();

  return res.json(target);
};

/**
 * PATCH /api/admin/users/:id/restore
 * Admin restores a FARMER account they created.
 */
export const restoreUser = async (req: Request, res: Response) => {
  const target = await UserModel.findById(req.params.id).select(
    "-passwordHash",
  );
  if (!target) {
    return res.status(404).json({ error: "Không tìm thấy người dùng" });
  }
  if (target.role !== "FARMER") {
    return res
      .status(403)
      .json({ error: "Admin chỉ có thể khôi phục tài khoản nông dân" });
  }
  if (!isCreatedByCurrentAdmin(target, req)) {
    return res
      .status(403)
      .json({ error: "Không thể khôi phục tài khoản nông dân do admin khác tạo" });
  }

  target.isRevoked = false;
  target.revokedAt = undefined;
  target.revokedByAdminId = undefined;
  await target.save();

  return res.json(target);
};
