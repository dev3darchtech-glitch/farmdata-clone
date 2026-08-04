import { Request, Response } from "express";
import { auth } from "../configs/firebase";
import { CropModel } from "../models/Crop";
import { FarmModel } from "../models/Farm";
import { PlantDiseaseModel } from "../models/PlantDisease";
import { PlotModel } from "../models/Plot";
import { UserModel } from "../models/User";
import { EnvMode, PLANT_DISEASE_GROUPS, PlantDiseaseGroup } from "../types";

function isCreatedByCurrentAdmin(target: any, req: Request) {
  // All admins can add, update, and revoke any user
  return true;
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

function readPaginationQuery(req: Request) {
  const page = Number(req.query.page);
  const limit = Number(req.query.limit);
  const query = normalizeRequiredText(req.query.q);
  const shouldPaginate =
    Number.isInteger(page) && Number.isInteger(limit) && page > 0 && limit > 0;

  return {
    page,
    query,
    shouldPaginate,
    safeLimit: shouldPaginate ? Math.min(limit, 50) : 0,
  };
}

function isEnvMode(value: unknown): value is EnvMode {
  return value === "outdoor" || value === "greenhouse";
}

async function buildMasterDataFilter(req: Request) {
  // All admins and farmers share the same master data (no filtering by admin)
  return {};
}

function checkMasterDataMutationPermission(
  target: any,
  req: Request,
  resourceName: string,
) {
  // All admins have permission to edit/delete any master data
  return null;
}

/**
 * GET /api/admin/plots
 */
export const getPlots = async (req: Request, res: Response) => {
  const { page, query, shouldPaginate, safeLimit } = readPaginationQuery(req);
  const baseFilter = await buildMasterDataFilter(req);
  const searchFilter = query
    ? {
        $or: [
          { code: { $regex: query, $options: "i" } },
          { name: { $regex: query, $options: "i" } },
          { envMode: { $regex: query, $options: "i" } },
        ],
      }
    : {};
  const filter = { $and: [baseFilter, searchFilter] };
  const sort = { code: 1 } as const;

  if (shouldPaginate) {
    const skip = (page - 1) * safeLimit;
    const [items, total] = await Promise.all([
      PlotModel.find(filter).sort(sort).skip(skip).limit(safeLimit),
      PlotModel.countDocuments(filter),
    ]);
    return res.json({
      items,
      total,
      page,
      limit: safeLimit,
      totalPages: Math.max(1, Math.ceil(total / safeLimit)),
    });
  }

  const plots = await PlotModel.find(filter).sort(sort);
  return res.json(plots);
};

/**
 * POST /api/admin/plots
 */
export const createPlot = async (req: Request, res: Response) => {
  const { code, name, farmId, envMode, areaSquareMeters, isActive } = req.body;
  if (!code || !name || !farmId || !isEnvMode(envMode)) {
    return res.status(400).json({
      error: "Mã luống, tên luống, farmId và loại môi trường là bắt buộc",
    });
  }

  const cleanCode = code.trim().toUpperCase();

  // Validate farm exists
  const farmExists = await FarmModel.exists({ _id: farmId });
  if (!farmExists) {
    return res
      .status(400)
      .json({ error: "farmId không hợp lệ hoặc không tồn tại." });
  }

  const existing = await PlotModel.findOne({
    code: cleanCode,
  });
  if (existing) {
    return res
      .status(400)
      .json({ error: `Mã luống '${cleanCode}' đã tồn tại.` });
  }

  const newPlot = await PlotModel.create({
    code: cleanCode,
    name: name.trim(),
    farmId,
    envMode,
    areaSquareMeters,
    isActive: typeof isActive === "boolean" ? isActive : true,
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

  const { code, name, farmId, envMode, areaSquareMeters, isActive } = req.body;
  if (
    code === undefined &&
    name === undefined &&
    farmId === undefined &&
    envMode === undefined &&
    areaSquareMeters === undefined &&
    isActive === undefined
  ) {
    return res.status(400).json({
      error:
        "Cần cung cấp ít nhất một trong: mã, tên, farmId, môi trường, diện tích hoặc trạng thái",
    });
  }

  if (farmId !== undefined) {
    const farmExists = await FarmModel.exists({ _id: farmId });
    if (!farmExists) {
      return res
        .status(400)
        .json({ error: "farmId không tồn tại hoặc không hợp lệ" });
    }
    target.farmId = farmId;
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

  if (envMode !== undefined) {
    if (!isEnvMode(envMode)) {
      return res.status(400).json({ error: "Loại môi trường không hợp lệ" });
    }
    target.envMode = envMode;
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
  const { page, query, shouldPaginate, safeLimit } = readPaginationQuery(req);
  const baseFilter = await buildMasterDataFilter(req);
  const searchFilter = query
    ? {
        $or: [
          { name: { $regex: query, $options: "i" } },
          { category: { $regex: query, $options: "i" } },
          { icon: { $regex: query, $options: "i" } },
        ],
      }
    : {};
  const filter = { $and: [baseFilter, searchFilter] };
  const sort = { name: 1 } as const;

  if (shouldPaginate) {
    const skip = (page - 1) * safeLimit;
    const [items, total] = await Promise.all([
      CropModel.find(filter).sort(sort).skip(skip).limit(safeLimit),
      CropModel.countDocuments(filter),
    ]);
    return res.json({
      items,
      total,
      page,
      limit: safeLimit,
      totalPages: Math.max(1, Math.ceil(total / safeLimit)),
    });
  }

  const crops = await CropModel.find(filter).sort(sort);
  return res.json(crops);
};

/**
 * POST /api/admin/crops
 */
export const createCrop = async (req: Request, res: Response) => {
  const { name, category, icon, isActive } = req.body;
  if (!name) {
    return res.status(400).json({ error: "Tên loại cây là bắt buộc" });
  }

  const adminId = req.user!.id;
  const cleanName = name.trim();
  const existing = await CropModel.findOne({
    name: cleanName,
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
    isActive: typeof isActive === "boolean" ? isActive : true,
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
    return res.status(400).json({
      error:
        "Cần cung cấp ít nhất một trong: tên, danh mục, icon hoặc trạng thái",
    });
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
  const { page, query, shouldPaginate, safeLimit } = readPaginationQuery(req);

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
  const isActive = req.body?.isActive;
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
    isActive: typeof isActive === "boolean" ? isActive : true,
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
      error:
        "Cần cung cấp ít nhất một trong: nhóm bệnh, phân loại, tên, mô tả hoặc trạng thái",
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
  const { page, query, shouldPaginate, safeLimit } = readPaginationQuery(req);
  const filter: Record<string, unknown> = {
    role: "FARMER",
  };

  if (query) {
    filter.$or = [
      { name: { $regex: query, $options: "i" } },
      { username: { $regex: query, $options: "i" } },
      { email: { $regex: query, $options: "i" } },
    ];
  }

  const userQuery = UserModel.find(filter).sort({ username: 1 });

  if (shouldPaginate) {
    const skip = (page - 1) * safeLimit;
    const [items, total] = await Promise.all([
      userQuery.clone().skip(skip).limit(safeLimit),
      UserModel.countDocuments(filter),
    ]);
    return res.json({
      items,
      total,
      page,
      limit: safeLimit,
      totalPages: Math.max(1, Math.ceil(total / safeLimit)),
    });
  }

  const users = await userQuery;
  return res.json(users);
};

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

  try {
    const existing = await UserModel.findOne({ username: cleanUsername });
    if (existing) {
      return res
        .status(400)
        .json({ error: `Tên đăng nhập '${cleanUsername}' đã được sử dụng` });
    }

    const email = `${cleanUsername}@farmdata.com`;
    // Create user in Firebase Auth for all roles (ADMIN & FARMER)
    const firebaseUser = await auth.createUser({
      email,
      password,
      displayName: name.trim(),
    });

    // Set Custom Claims for Role management
    await auth.setCustomUserClaims(firebaseUser.uid, { role });

    const newUser = await UserModel.create({
      name: name.trim(),
      email,
      username: cleanUsername,
      role,
      isRevoked: false,
      firebaseUid: firebaseUser.uid,
    });

    const safeUser = newUser.toObject();
    return res.status(201).json(safeUser);
  } catch (err: any) {
    console.error("Error creating user:", err);
    return res
      .status(500)
      .json({ error: `Tạo người dùng thất bại: ${err.message}` });
  }
};

/**
 * PATCH /api/admin/users/:id
 * Admin updates FARMER account profile/password only. ADMIN accounts are immutable here.
 */
export const updateUser = async (req: Request, res: Response) => {
  const target = await UserModel.findById(req.params.id);
  if (!target) {
    return res.status(404).json({ error: "Không tìm thấy người dùng" });
  }
  if (target.role !== "FARMER") {
    return res.status(403).json({
      error: "Admin chỉ có thể cập nhật tài khoản nông dân",
    });
  }

  const { name, username, password } = req.body;
  if (!name && !username && !password) {
    return res.status(400).json({
      error: "Cần cung cấp ít nhất một trong: tên, tên đăng nhập hoặc mật khẩu",
    });
  }

  try {
    const fbUid = target.firebaseUid;

    if (name && String(name).trim()) {
      target.name = String(name).trim();
      if (fbUid) {
        await auth.updateUser(fbUid, { displayName: target.name });
      }
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
          error: "Tên đăng nhập đã tồn tại",
        });
      }
      target.username = normalizedUsername;
      target.email = `${normalizedUsername}@farmdata.com`;
      if (fbUid) {
        await auth.updateUser(fbUid, {
          email: target.email,
        });
      }
    }

    if (password && String(password).trim()) {
      const rawPassword = String(password).trim();
      if (rawPassword.length < 6) {
        return res
          .status(400)
          .json({ error: "Mật khẩu phải từ 6 ký tự trở lên" });
      }
      if (fbUid) {
        await auth.updateUser(fbUid, { password: rawPassword });
      }
    }

    await target.save();
    return res.json(target);
  } catch (err: any) {
    console.error("Error updating user:", err);
    return res
      .status(500)
      .json({ error: `Cập nhật người dùng thất bại: ${err.message}` });
  }
};

/**
 * PATCH /api/admin/users/:id/revoke
 * Admin revokes a FARMER account they created. Existing JWTs are rejected by auth middleware.
 */
export const revokeUser = async (req: Request, res: Response) => {
  const target = await UserModel.findById(req.params.id);
  if (!target) {
    return res.status(404).json({ error: "Không tìm thấy người dùng" });
  }
  if (target.role !== "FARMER") {
    return res
      .status(403)
      .json({ error: "Admin chỉ có thể thu hồi tài khoản nông dân" });
  }
  if (target._id.toString() === req.user!.id) {
    return res
      .status(400)
      .json({ error: "Không thể thu hồi tài khoản của chính mình" });
  }

  try {
    const fbUid = target.firebaseUid;
    if (fbUid) {
      await auth.updateUser(fbUid, { disabled: true });
    }

    target.isRevoked = true;
    target.revokedAt = new Date();
    await target.save();

    return res.json(target);
  } catch (err: any) {
    console.error("Error revoking user:", err);
    return res
      .status(500)
      .json({ error: `Thu hồi tài khoản thất bại: ${err.message}` });
  }
};

/**
 * PATCH /api/admin/users/:id/restore
 * Admin restores a FARMER account they created.
 */
export const restoreUser = async (req: Request, res: Response) => {
  const target = await UserModel.findById(req.params.id);
  if (!target) {
    return res.status(404).json({ error: "Không tìm thấy người dùng" });
  }
  if (target.role !== "FARMER") {
    return res
      .status(403)
      .json({ error: "Admin chỉ có thể khôi phục tài khoản nông dân" });
  }

  try {
    const fbUid = target.firebaseUid;
    if (fbUid) {
      await auth.updateUser(fbUid, { disabled: false });
    }

    target.isRevoked = false;
    target.revokedAt = undefined;
    await target.save();

    return res.json(target);
  } catch (err: any) {
    console.error("Error restoring user:", err);
    return res
      .status(500)
      .json({ error: `Khôi phục tài khoản thất bại: ${err.message}` });
  }
};

/**
 * GET /api/admin/farms
 */
export const getFarms = async (req: Request, res: Response) => {
  const { page, query, shouldPaginate, safeLimit } = readPaginationQuery(req);
  const searchFilter = query ? { name: { $regex: query, $options: "i" } } : {};
  const filter = searchFilter;
  const sort = { name: 1 } as const;

  if (shouldPaginate) {
    const skip = (page - 1) * safeLimit;
    const [items, total] = await Promise.all([
      FarmModel.find(filter).sort(sort).skip(skip).limit(safeLimit),
      FarmModel.countDocuments(filter),
    ]);
    return res.json({
      items,
      total,
      page,
      limit: safeLimit,
      totalPages: Math.max(1, Math.ceil(total / safeLimit)),
    });
  }

  const farms = await FarmModel.find(filter).sort(sort);
  return res.json(farms);
};

/**
 * POST /api/admin/farms
 */
export const createFarm = async (req: Request, res: Response) => {
  const { name, isActive } = req.body;
  if (!name || !name.trim()) {
    return res.status(400).json({ error: "Tên farm là bắt buộc" });
  }

  const cleanName = name.trim();
  const existing = await FarmModel.findOne({ name: cleanName });
  if (existing) {
    return res.status(400).json({ error: `Farm '${cleanName}' đã tồn tại.` });
  }

  const newFarm = await FarmModel.create({
    name: cleanName,
    isActive: typeof isActive === "boolean" ? isActive : true,
  });

  return res.status(201).json(newFarm);
};

/**
 * PATCH /api/admin/farms/:id
 */
export const updateFarm = async (req: Request, res: Response) => {
  const target = await FarmModel.findById(req.params.id);
  if (!target) {
    return res.status(404).json({ error: "Không tìm thấy farm" });
  }

  const { name, isActive } = req.body;
  if (name === undefined && isActive === undefined) {
    return res
      .status(400)
      .json({ error: "Cần cung cấp ít nhất một trong: tên hoặc trạng thái" });
  }

  if (name && String(name).trim()) {
    const cleanName = String(name).trim();
    const existing = await FarmModel.findOne({
      name: cleanName,
      _id: { $ne: target._id },
    });
    if (existing) {
      return res.status(400).json({ error: `Farm '${cleanName}' đã tồn tại.` });
    }
    target.name = cleanName;
  }

  if (typeof isActive === "boolean") {
    target.isActive = isActive;
  }

  await target.save();
  return res.json(target);
};

/**
 * PATCH /api/admin/farms/:id/deactivate
 */
export const deactivateFarm = async (req: Request, res: Response) => {
  const requestedIsActive = readRequestedActiveStatus(req, res);
  if (requestedIsActive === undefined) {
    return;
  }

  const target = await FarmModel.findById(req.params.id);
  if (!target) {
    return res.status(404).json({ error: "Không tìm thấy farm" });
  }

  target.isActive = requestedIsActive;
  await target.save();
  return res.json(target);
};
