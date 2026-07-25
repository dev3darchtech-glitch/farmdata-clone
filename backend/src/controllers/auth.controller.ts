import bcrypt from "bcryptjs";
import { Request, Response } from "express";
import { OAuth2Client } from "google-auth-library";
import jwt from "jsonwebtoken";
import { env } from "../configs/env";
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

const googleSignInAudiences = [env.googleClientId].filter(Boolean);

function getGoogleAppCallbackUrl(req: Request) {
  return (
    env.googleRedirectUri ||
    `${req.protocol}://${req.get("host")}/api/auth/google/callback`
  );
}

function isAllowedAppRedirectUri(value: string) {
  return (
    value.startsWith("capturedata://") ||
    value.startsWith("exp://") ||
    value.startsWith("http://localhost") ||
    value.startsWith("http://127.0.0.1") ||
    value.startsWith("https://localhost")
  );
}

async function verifyGoogleIdToken(idToken: string) {
  const client = new OAuth2Client();
  const ticket = await client.verifyIdToken({
    idToken,
    audience: googleSignInAudiences,
  });

  return ticket.getPayload();
}

async function findOrCreateGoogleUser(payload: {
  email?: string;
  email_verified?: boolean;
  name?: string;
  sub?: string;
}) {
  const email = payload.email?.trim().toLowerCase();
  if (!email || !payload.email_verified) {
    throw new Error("Google account email is unavailable or not verified.");
  }

  const existingUser = await ensureUsername(
    await UserModel.findOne({ email }).select("-passwordHash"),
  );
  if (existingUser) {
    return existingUser;
  }

  const passwordHash = bcrypt.hashSync(
    `google:${payload.sub || email}:${Date.now()}`,
    10,
  );

  const createdUser = await UserModel.create({
    name: payload.name?.trim() || email,
    email,
    passwordHash,
    role: "FARMER",
  });

  return ensureUsername(createdUser);
}

async function updateUserGoogleTokens(
  user: IUserDocument,
  tokens: {
    access_token?: string | null;
    refresh_token?: string | null;
    expiry_date?: number | null;
  },
  email?: string,
) {
  user.googleTokens = {
    accessToken: tokens.access_token || user.googleTokens?.accessToken,
    refreshToken: tokens.refresh_token || user.googleTokens?.refreshToken,
    expiryDate:
      tokens.expiry_date || user.googleTokens?.expiryDate || undefined,
    email: email || user.googleTokens?.email,
    isLinked: Boolean(
      tokens.refresh_token ||
      user.googleTokens?.refreshToken ||
      tokens.access_token ||
      user.googleTokens?.accessToken,
    ),
  };

  await user.save();
  return user;
}

/**
 * POST /api/auth/login
 */
export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res
      .status(400)
      .json({ error: "Vui lòng nhập tên đăng nhập hoặc email" });
  }

  const loginId = email.trim().toLowerCase();
  const user = await ensureUsername(
    await UserModel.findOne({
      $or: [{ email: loginId }, { username: loginId }],
    }).select("+passwordHash"),
  );
  if (!user) {
    return res
      .status(401)
      .json({ error: "Tên đăng nhập hoặc mật khẩu không đúng" });
  }

  const isMatch = bcrypt.compareSync(password, user.passwordHash);
  if (!isMatch) {
    return res
      .status(401)
      .json({ error: "Tên đăng nhập hoặc mật khẩu không đúng" });
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
 * GET /api/auth/google
 */
export const getGoogleAppAuthUrl = async (req: Request, res: Response) => {
  const redirectUri = req.query.redirect_uri;

  if (!redirectUri || typeof redirectUri !== "string") {
    return res.status(400).json({
      error: "Missing redirect_uri query parameter",
    });
  }

  if (!isAllowedAppRedirectUri(redirectUri)) {
    return res.status(400).json({
      error: "Unsupported redirect_uri",
    });
  }

  if (!env.googleClientId || !env.googleClientSecret) {
    return res.status(500).json({
      error: "Google OAuth is not configured on the server.",
    });
  }

  const callbackUrl = getGoogleAppCallbackUrl(req);
  console.log({ callbackUrl });
  const authorizeUrl =
    `https://accounts.google.com/o/oauth2/v2/auth` +
    `?client_id=${encodeURIComponent(env.googleClientId)}` +
    `&redirect_uri=${encodeURIComponent(callbackUrl)}` +
    `&response_type=code` +
    `&scope=${encodeURIComponent(
      "openid email profile https://www.googleapis.com/auth/drive.file",
    )}` +
    `&access_type=offline` +
    `&prompt=select_account` +
    `&state=${encodeURIComponent(redirectUri)}`;

  return res.redirect(authorizeUrl);
};

/**
 * GET /api/auth/google/callback
 */
export const getGoogleAppCallback = async (req: Request, res: Response) => {
  const { code, state } = req.query;

  if (
    !code ||
    typeof code !== "string" ||
    !state ||
    typeof state !== "string"
  ) {
    return res.status(400).send("Missing code or redirect_uri");
  }

  if (!isAllowedAppRedirectUri(state)) {
    return res.status(400).send("Unsupported redirect_uri");
  }

  try {
    const callbackUrl = getGoogleAppCallbackUrl(req);
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        code,
        client_id: env.googleClientId,
        client_secret: env.googleClientSecret,
        redirect_uri: callbackUrl,
        grant_type: "authorization_code",
      }),
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      return res
        .status(400)
        .send(errorText || "Failed to exchange Google code.");
    }

    const tokenData = (await tokenResponse.json()) as {
      access_token?: string;
      refresh_token?: string;
      expiry_date?: number;
      id_token?: string;
    };

    if (!tokenData.id_token) {
      return res.status(400).send("No id_token received from Google");
    }

    const payload = await verifyGoogleIdToken(tokenData.id_token);
    if (!payload) {
      return res.status(401).send("Invalid Google ID token");
    }

    const user = await findOrCreateGoogleUser({
      email: payload.email || undefined,
      email_verified: payload.email_verified || false,
      name: payload.name || undefined,
      sub: payload.sub || undefined,
    });
    if (!user) {
      return res.status(500).send("Unable to create Google user.");
    }
    await updateUserGoogleTokens(user, tokenData, payload.email || undefined);

    const authPayload = toAuthUser(user);
    const token = jwt.sign(authPayload, JWT_SECRET, { expiresIn: "24h" });
    const separator = state.includes("?") ? "&" : "?";

    return res.redirect(
      `${state}${separator}accessToken=${encodeURIComponent(token)}&refreshToken=${encodeURIComponent(token)}`,
    );
  } catch (err: any) {
    return res.status(401).send(err?.message || "Google sign-in failed.");
  }
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
