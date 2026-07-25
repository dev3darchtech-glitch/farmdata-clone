import bcrypt from "bcryptjs";
import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import { JWT_SECRET } from "../middleware/rbac";
import { IUserDocument, UserModel } from "../models/User";
import {
  getAdminGoogleAuthUrl,
  linkAdminGoogleAccount,
} from "../services/googleDriveService";

async function ensureUsername(user: IUserDocument | null) {
  if (!user || user.username) return user;
  await user.validate();
  await user.save();
  return user;
}

function toAuthUser(user: IUserDocument) {
  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    username: user.username,
    role: user.role,
  };
}

/**
 * POST /api/auth/login
 */
export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Missing email or password" });
  }

  const loginId = email.trim().toLowerCase();
  const user = await ensureUsername(
    await UserModel.findOne({
      $or: [{ email: loginId }, { username: loginId }],
    }).select("+passwordHash"),
  );
  if (!user) {
    return res.status(401).json({ error: "Invalid email or password" });
  }

  const isMatch = bcrypt.compareSync(password, user.passwordHash);
  if (!isMatch) {
    return res.status(401).json({ error: "Invalid email or password" });
  }

  const payload = toAuthUser(user);

  const token = jwt.sign(payload, JWT_SECRET, { expiresIn: "24h" });

  return res.json({
    token,
    user: {
      ...payload,
      isGoogleDriveLinked: Boolean(user.googleTokens?.isLinked),
    },
  });
};

/**
 * GET /api/auth/me
 */
export const getMe = async (req: Request, res: Response) => {
  const user = await ensureUsername(
    await UserModel.findById(req.user!.id).select("-passwordHash"),
  );
  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  return res.json({
    user: {
      ...toAuthUser(user),
      isGoogleDriveLinked: Boolean(user.googleTokens?.isLinked),
      googleDriveEmail: user.googleTokens?.email,
    },
  });
};

/**
 * GET /api/auth/google/url
 */
export const getGoogleAuthUrl = (req: Request, res: Response) => {
  const authUrl = getAdminGoogleAuthUrl();
  return res.json({ url: authUrl });
};

/**
 * POST /api/auth/google/link
 */
export const linkGoogleAccount = async (req: Request, res: Response) => {
  const { code } = req.body;
  if (!code) {
    return res.status(400).json({ error: "Missing auth code" });
  }

  try {
    const updatedAdmin = await linkAdminGoogleAccount(req.user!.id, code);
    return res.json({
      success: true,
      message: "Google Drive successfully linked to Admin account",
      googleEmail: updatedAdmin?.googleTokens?.email,
    });
  } catch (err: any) {
    return res
      .status(500)
      .json({ error: `Failed to link Google Drive: ${err.message}` });
  }
};
