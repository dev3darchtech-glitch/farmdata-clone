import bcrypt from "bcryptjs";
import { Request, Response } from "express";
import { OAuth2Client } from "google-auth-library";
import jwt from "jsonwebtoken";
import { env } from "../configs/env";
import { JWT_SECRET } from "../middleware/rbac";
import {
  createUsernameFromEmail,
  IUserDocument,
  UserModel,
} from "../models/User";
import {
  getAdminDriveFolderUrl,
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
    email: user.email || "",
    username: user.username,
    role: user.role,
  };
}

function signAuthTokens(user: IUserDocument) {
  const payload = toAuthUser(user);
  const token = jwt.sign(payload, JWT_SECRET, { expiresIn: "24h" });
  const refreshToken = jwt.sign(
    {
      ...payload,
      tokenUse: "refresh",
    },
    JWT_SECRET,
    { expiresIn: "30d" },
  );

  return { payload, token, refreshToken };
}

const googleSignInAudiences = [env.googleClientId].filter(Boolean);

function getGoogleAppCallbackUrl(req: Request) {
  if (env.googleRedirectUri) {
    return env.googleRedirectUri;
  }
  const protocol = req.get("x-forwarded-proto") || req.protocol || "https";
  return `${protocol}://${req.get("host")}/api/auth/google/callback`;
}

function hasLinkedGoogleDrive(
  user?: Pick<IUserDocument, "googleTokens"> | null,
) {
  return Boolean(user?.googleTokens?.refreshToken);
}

function isAllowedAppRedirectUri(value: string) {
  return (
    value.startsWith("capturedata:") ||
    value.startsWith("exp:") ||
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

async function buildUniqueUsername(email: string) {
  const baseUsername = createUsernameFromEmail(email);
  let username = baseUsername;
  let suffix = 1;

  while (await UserModel.exists({ username })) {
    suffix += 1;
    username = `${baseUsername}${suffix}`;
  }

  return username;
}

async function findOrCreateGoogleUser(payload: {
  email?: string;
  email_verified?: boolean;
  name?: string;
  sub?: string;
}) {
  const email = payload.email?.trim().toLowerCase();
  if (!email || !payload.email_verified) {
    throw new Error(
      "Email tài khoản Google không khả dụng hoặc chưa được xác minh.",
    );
  }

  const existingUser = await ensureUsername(
    await UserModel.findOne({ email }).select("-passwordHash"),
  );
  if (existingUser) {
    if (existingUser.isRevoked) {
      throw new Error("Tài khoản đã bị thu hồi.");
    }
    return existingUser;
  }

  return await UserModel.create({
    name: payload.name?.trim() || email,
    email,
    username: await buildUniqueUsername(email),
    passwordHash: bcrypt.hashSync(`${payload.sub || email}:${Date.now()}`, 8),
    role: "ADMIN",
    isRevoked: false,
  });
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
  const nextRefreshToken =
    tokens.refresh_token || user.googleTokens?.refreshToken;

  user.googleTokens = {
    accessToken: tokens.access_token || user.googleTokens?.accessToken,
    refreshToken: nextRefreshToken,
    expiryDate:
      tokens.expiry_date || user.googleTokens?.expiryDate || undefined,
    email: email || user.googleTokens?.email,
    isLinked: Boolean(nextRefreshToken),
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
  if (user.isRevoked) {
    return res.status(403).json({ error: "Tài khoản đã bị thu hồi" });
  }

  const isMatch = bcrypt.compareSync(password, user.passwordHash);
  if (!isMatch) {
    return res
      .status(401)
      .json({ error: "Tên đăng nhập hoặc mật khẩu không đúng" });
  }

  const { payload, token, refreshToken } = signAuthTokens(user);

  return res.json({
    token,
    refreshToken,
    user: {
      ...payload,
      isGoogleDriveLinked: hasLinkedGoogleDrive(user),
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
      error: "Thiếu tham số redirect_uri",
    });
  }

  if (!isAllowedAppRedirectUri(redirectUri)) {
    return res.status(400).json({
      error: "redirect_uri không được hỗ trợ",
    });
  }

  if (!env.googleClientId || !env.googleClientSecret) {
    return res.status(500).json({
      error: "Google OAuth chưa được cấu hình trên máy chủ.",
    });
  }

  const callbackUrl = getGoogleAppCallbackUrl(req);
  console.log({ callbackUrl });
  const authorizeUrl =
    `https://accounts.google.com/o/oauth2/v2/auth` +
    `?client_id=${encodeURIComponent(env.googleClientId)}` +
    `&redirect_uri=${encodeURIComponent(callbackUrl)}` +
    `&response_type=code` +
    `&scope=${encodeURIComponent("openid email profile")}` +
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
      return res.status(400).send("Không nhận được id_token từ Google");
    }

    const payload = await verifyGoogleIdToken(tokenData.id_token);
    if (!payload) {
      return res.status(401).send("Token Google ID không hợp lệ");
    }

    const user = await findOrCreateGoogleUser({
      email: payload.email || undefined,
      email_verified: payload.email_verified || false,
      name: payload.name || undefined,
      sub: payload.sub || undefined,
    });
    if (!user) {
      return res.status(500).send("Không thể tạo tài khoản Google.");
    }
    if (user.role === "ADMIN") {
      await updateUserGoogleTokens(user, tokenData, payload.email || undefined);
    }

    const { token, refreshToken } = signAuthTokens(user);
    const separator = state.includes("?") ? "&" : "?";
    const finalRedirectUrl = `${state}${separator}accessToken=${encodeURIComponent(token)}&refreshToken=${encodeURIComponent(refreshToken)}`;

    if (state.startsWith("http://") || state.startsWith("https://")) {
      return res.redirect(finalRedirectUrl);
    }

    return res.status(302).setHeader("Location", finalRedirectUrl).send(`
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Đang chuyển hướng về ứng dụng FarmData...</title>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; text-align: center; padding: 40px 20px; background-color: #f4f6f8; color: #1f2937; }
    .card { background: #ffffff; padding: 32px 24px; border-radius: 16px; box-shadow: 0 4px 12px rgba(0,0,0,0.08); max-width: 380px; margin: 0 auto; }
    .title { font-size: 20px; font-weight: 700; color: #1b4d2e; margin-bottom: 8px; }
    .text { font-size: 14px; color: #6b7280; margin-bottom: 24px; }
    .btn { display: inline-block; padding: 14px 28px; background-color: #1b4d2e; color: #ffffff; text-decoration: none; border-radius: 10px; font-weight: 600; font-size: 15px; }
  </style>
</head>
<body>
  <div class="card">
    <div class="title">Đăng nhập thành công!</div>
    <div class="text">Đang tự động chuyển hướng về ứng dụng FarmData...</div>
    <a href="${finalRedirectUrl}" class="btn">Mở ứng dụng FarmData</a>
  </div>
  <script>
    window.location.href = "${finalRedirectUrl}";
  </script>
</body>
</html>
    `);
  } catch (err: any) {
    return res.status(401).send(err?.message || "Google sign-in failed.");
  }
};

/**
 * POST /api/auth/refresh
 */
export const refreshAuthToken = async (req: Request, res: Response) => {
  const { refreshToken } = req.body;

  if (!refreshToken || typeof refreshToken !== "string") {
    return res.status(400).json({ error: "Refresh token là bắt buộc" });
  }

  try {
    const decoded = jwt.verify(refreshToken, JWT_SECRET) as {
      id?: string;
      tokenUse?: string;
    };

    if (!decoded.id || decoded.tokenUse !== "refresh") {
      return res.status(403).json({ error: "Refresh token không hợp lệ" });
    }

    const user = await ensureUsername(
      await UserModel.findById(decoded.id).select("-passwordHash"),
    );
    if (!user) {
      return res.status(403).json({ error: "Không tìm thấy người dùng" });
    }
    if (user.isRevoked) {
      return res.status(403).json({ error: "Tài khoản đã bị thu hồi" });
    }

    const tokens = signAuthTokens(user);
    return res.json({
      token: tokens.token,
      refreshToken: tokens.refreshToken,
      expiresIn: 86400,
      user: {
        ...tokens.payload,
        isGoogleDriveLinked: hasLinkedGoogleDrive(user),
      },
    });
  } catch {
    return res
      .status(403)
      .json({ error: "Refresh token không hợp lệ hoặc đã hết hạn" });
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
    return res.status(404).json({ error: "Không tìm thấy người dùng" });
  }

  return res.json({
    user: {
      ...toAuthUser(user),
      isGoogleDriveLinked: hasLinkedGoogleDrive(user),
      googleDriveEmail: user.googleTokens?.email,
    },
  });
};

function isExpoPushToken(token: string) {
  return /^Expo(nent)?PushToken\[[A-Za-z0-9_-]+\]$/.test(token);
}

export const registerPushToken = async (req: Request, res: Response) => {
  const userId = req.user?.id;
  const { platform, token } = req.body;

  if (!userId) {
    return res.status(401).json({ error: "Chưa xác thực" });
  }
  if (platform !== "android" && platform !== "ios") {
    return res.status(400).json({ error: "Nền tảng không hợp lệ" });
  }
  if (!token || typeof token !== "string" || !isExpoPushToken(token)) {
    return res.status(400).json({ error: "Push token không hợp lệ" });
  }

  const user = await UserModel.findById(userId);
  if (!user) {
    return res.status(404).json({ error: "Không tìm thấy người dùng" });
  }

  const now = new Date();
  user.pushTokens = user.pushTokens || [];
  const existingToken = user.pushTokens.find((item) => item.token === token);
  if (existingToken) {
    existingToken.platform = platform;
    existingToken.updatedAt = now;
  } else {
    user.pushTokens.push({
      token,
      platform,
      provider: "expo",
      createdAt: now,
      updatedAt: now,
    });
  }

  await user.save();
  return res.json({ ok: true });
};

export const unregisterPushToken = async (req: Request, res: Response) => {
  const userId = req.user?.id;
  const { token } = req.body;

  if (!userId) {
    return res.status(401).json({ error: "Chưa xác thực" });
  }
  if (!token || typeof token !== "string") {
    return res.status(400).json({ error: "Push token là bắt buộc" });
  }

  await UserModel.updateOne(
    { _id: userId },
    { $pull: { pushTokens: { token } } },
  );

  return res.json({ ok: true });
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
    return res.status(400).json({ error: "Thiếu mã xác thực" });
  }

  try {
    const updatedAdmin = await linkAdminGoogleAccount(req.user!.id, code);
    return res.json({
      success: true,
      message: "Liên kết Google Drive thành công",
      googleEmail: updatedAdmin?.googleTokens?.email,
    });
  } catch (err: any) {
    return res
      .status(500)
      .json({ error: `Liên kết Google Drive thất bại: ${err.message}` });
  }
};

export const getGoogleDriveFolderUrl = async (req: Request, res: Response) => {
  try {
    const url = await getAdminDriveFolderUrl(req.user!.id);
    return res.json({ url });
  } catch (err: any) {
    return res
      .status(500)
      .json({ error: err.message || "Không lấy được đường dẫn thư mục Drive" });
  }
};
