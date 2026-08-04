import { NextFunction, Request, Response } from "express";
import { env } from "../configs/env";
import { auth } from "../configs/firebase";
import { UserModel } from "../models/User";
import { RoleName } from "../types";

export const JWT_SECRET = env.jwtSecret;

export interface AuthenticatedUser {
  id: string;
  name: string;
  email: string;
  username?: string;
  role: RoleName;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

function logAuthEvent(
  message: string,
  req: Request,
  extra: Record<string, unknown> = {},
) {
  console.error("🔐 Auth/RBAC:", {
    message,
    method: req.method,
    path: req.originalUrl,
    hasAuthorizationHeader: Boolean(req.headers.authorization),
    ...extra,
  });
}

function buildUsernameFromEmail(email: string, fallbackUid: string) {
  return (
    email
      .split("@")[0]
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "") || `user_${fallbackUid.slice(-6)}`
  );
}

/**
 * Middleware to authenticate Firebase ID Bearer tokens in Authorization header.
 */
export async function authenticateToken(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    logAuthEvent("Missing bearer token", req);
    return res.status(401).json({ error: "Chưa xác thực: Thiếu token" });
  }

  try {
    const decodedToken = await auth.verifyIdToken(token);
    const email = (decodedToken.email || "").trim().toLowerCase();
    const username = email
      ? buildUsernameFromEmail(email, decodedToken.uid)
      : "";
    let user = await UserModel.findOne({ firebaseUid: decodedToken.uid });

    if (!user && email) {
      user = await UserModel.findOne({
        $or: [{ email }, { username }],
      });

      if (user) {
        console.warn(
          "🔐 Auth/RBAC: Linked existing Mongo user to Firebase UID",
          {
            method: req.method,
            path: req.originalUrl,
            firebaseUid: decodedToken.uid,
            email,
            userId: user._id.toString(),
            username: user.username,
          },
        );
        user.firebaseUid = decodedToken.uid;
        if (!user.email) {
          user.email = email;
        }
        await user.save();
      }
    }

    if (!user) {
      console.warn("🔐 Auth/RBAC: Firebase user missing Mongo profile", {
        method: req.method,
        path: req.originalUrl,
        firebaseUid: decodedToken.uid,
        email,
      });
      // Auto-create user profile in MongoDB if they exist in Firebase Auth but not DB
      const name = decodedToken.name || email || "User";
      // Check custom claims role, default to email-check
      const role =
        (decodedToken.role as RoleName) ||
        (email.toLowerCase().includes("admin") ? "ADMIN" : "FARMER");

      const newUser = await UserModel.create({
        name,
        email,
        username: username || `user_${decodedToken.uid.slice(-6)}`,
        role,
        isRevoked: false,
        firebaseUid: decodedToken.uid,
      });

      req.user = {
        id: newUser._id.toString(),
        name: newUser.name,
        email: newUser.email || "",
        username: newUser.username,
        role: newUser.role as RoleName,
      };
      return next();
    }

    if (user.isRevoked) {
      logAuthEvent("Revoked user attempted request", req, {
        userId: user._id.toString(),
        username: user.username,
        role: user.role,
      });
      return res.status(403).json({ error: "Tài khoản đã bị thu hồi" });
    }

    req.user = {
      id: user._id.toString(),
      name: user.name,
      email: user.email || "",
      username: user.username,
      role: user.role as RoleName,
    };
    return next();
  } catch (fbErr: any) {
    logAuthEvent("Firebase token verification failed", req, {
      error: fbErr?.message || String(fbErr),
    });
    return res
      .status(403)
      .json({ error: "Token không hợp lệ hoặc đã hết hạn" });
  }
}

/**
 * Pure Role-Based Access Control (RBAC) middleware enforcing allowed user roles.
 */
export function requireRole(...allowedRoles: RoleName[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      logAuthEvent("Role check without authenticated user", req, {
        allowedRoles,
      });
      return res.status(401).json({ error: "Chưa xác thực" });
    }

    if (!allowedRoles.includes(req.user.role)) {
      logAuthEvent("Role denied", req, {
        userId: req.user.id,
        username: req.user.username,
        role: req.user.role,
        allowedRoles,
      });
      return res.status(403).json({
        error: `Không có quyền truy cập: chỉ dành cho vai trò [${allowedRoles.join(", ")}]`,
        userRole: req.user.role,
      });
    }

    next();
  };
}
