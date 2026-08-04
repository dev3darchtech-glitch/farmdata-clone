import { Request, Response } from "express";
import { env } from "../configs/env";
import { auth } from "../configs/firebase";
import { UserModel } from "../models/User";

const JWT_SECRET = env.jwtSecret;

// Firebase API key from google-services.json
const FIREBASE_API_KEY = "AIzaSyCHUjYREU9JhLVFy01jT6WWp9XrJBUNl-k";

function toAuthUser(user: any) {
  return {
    id: user.id || user._id,
    name: user.name,
    email: user.email || "",
    username: user.username,
    role: user.role,
  };
}

/**
 * POST /api/auth/login
 */
export const login = async (req: Request, res: Response) => {
  const { email: loginInput, password } = req.body;

  if (!loginInput || !password) {
    return res
      .status(400)
      .json({ error: "Vui lòng nhập tên đăng nhập hoặc email" });
  }

  try {
    const loginId = loginInput.trim().toLowerCase();
    const isEmailInput = loginId.includes("@");

    // Find the user in MongoDB
    let user = await UserModel.findOne({
      $or: [{ email: loginId }, { username: loginId }],
    });

    if (user && user.isRevoked) {
      return res.status(403).json({ error: "Tài khoản của bạn đã bị ngừng hoạt động. Vui lòng liên hệ quản trị viên để biết thêm chi tiết." });
    }

    // Verify password via Firebase Auth for all users (both ADMIN and FARMER)
    const firebaseEmail = user
      ? user.email || `${user.username}@farmdata.com`
      : isEmailInput
        ? loginId
        : `${loginId}@farmdata.com`;

    const response = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${FIREBASE_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: firebaseEmail,
          password,
          returnSecureToken: true,
        }),
      },
    );

    if (!response.ok) {
      return res
        .status(401)
        .json({ error: "Tên đăng nhập hoặc mật khẩu không đúng" });
    }

    const data = (await response.json()) as any;

    if (!user) {
      // Auto-create user in MongoDB from Firebase Auth profile
      const fbUser = await auth.getUser(data.localId);
      const role =
        (fbUser.customClaims?.role as any) ||
        (firebaseEmail.toLowerCase().includes("admin") ? "ADMIN" : "FARMER");
      const name = fbUser.displayName || firebaseEmail.split("@")[0] || "User";

      user = await UserModel.create({
        name,
        email: firebaseEmail,
        username:
          firebaseEmail
            .split("@")[0]
            .toLowerCase()
            .replace(/[^a-z0-9]/g, "") || `user_${data.localId.slice(-6)}`,
        role,
        isRevoked: false,
        firebaseUid: data.localId,
      });
    } else if (user.firebaseUid !== data.localId) {
      console.warn("🔐 Auth login: syncing changed Firebase UID to Mongo user", {
        userId: user._id.toString(),
        username: user.username,
        email: user.email,
        previousFirebaseUid: user.firebaseUid,
        nextFirebaseUid: data.localId,
      });
      user.firebaseUid = data.localId;
      await user.save();
    }

    return res.json({
      token: data.idToken,
      refreshToken: data.refreshToken,
      user: toAuthUser(user),
    });
  } catch (err: any) {
    console.error("Login error:", err);
    return res.status(500).json({ error: "Đăng nhập thất bại" });
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
    const response = await fetch(
      `https://securetoken.googleapis.com/v1/token?key=${FIREBASE_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          grant_type: "refresh_token",
          refresh_token: refreshToken,
        }),
      },
    );

    if (!response.ok) {
      return res
        .status(403)
        .json({ error: "Refresh token không hợp lệ hoặc đã hết hạn" });
    }

    const data = (await response.json()) as any;
    const user = await UserModel.findOne({ firebaseUid: data.user_id });

    if (!user) {
      return res.status(403).json({ error: "Không tìm thấy người dùng" });
    }

    if (user.isRevoked) {
      return res.status(403).json({ error: "Tài khoản đã bị thu hồi" });
    }

    return res.json({
      token: data.id_token,
      refreshToken: data.refresh_token,
      expiresIn: Number(data.expires_in),
      user: toAuthUser(user),
    });
  } catch (err: any) {
    console.error("Refresh token error:", err);
    return res
      .status(403)
      .json({ error: "Refresh token không hợp lệ hoặc đã hết hạn" });
  }
};

/**
 * GET /api/auth/me
 */
export const getMe = async (req: Request, res: Response) => {
  const user = await UserModel.findById(req.user!.id);
  if (!user) {
    return res.status(404).json({ error: "Không tìm thấy người dùng" });
  }

  return res.json({
    user: toAuthUser(user),
  });
};
