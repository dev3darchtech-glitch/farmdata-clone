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
    return res.status(401).json({ error: "Chưa xác thực: Thiếu token" });
  }

  try {
    const decodedToken = await auth.verifyIdToken(token);
    const user = await UserModel.findOne({ firebaseUid: decodedToken.uid });

    if (!user) {
      // Auto-create user profile in MongoDB if they exist in Firebase Auth but not DB
      const email = decodedToken.email || "";
      const name = decodedToken.name || email || "User";
      // Check custom claims role, default to email-check
      const role =
        (decodedToken.role as RoleName) ||
        (email.toLowerCase().includes("admin") ? "ADMIN" : "FARMER");

      const newUser = await UserModel.create({
        name,
        email,
        username: email.split("@")[0] || `user_${decodedToken.uid.slice(-6)}`,
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
  } catch (fbErr) {
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
      return res.status(401).json({ error: "Chưa xác thực" });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: `Không có quyền truy cập: chỉ dành cho vai trò [${allowedRoles.join(", ")}]`,
        userRole: req.user.role,
      });
    }

    next();
  };
}
