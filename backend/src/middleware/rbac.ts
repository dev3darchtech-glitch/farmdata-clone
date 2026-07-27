import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { env } from "../configs/env";
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
 * Middleware to authenticate JWT Bearer tokens in Authorization header.
 */
export function authenticateToken(
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
    const decoded = jwt.verify(token, JWT_SECRET) as AuthenticatedUser;
    UserModel.findById(decoded.id)
      .select("name email username role isRevoked")
      .then((user) => {
        if (!user) {
          return res.status(403).json({ error: "Không tìm thấy người dùng" });
        }
        if (user.isRevoked) {
          return res.status(403).json({ error: "Tài khoản đã bị thu hồi" });
        }
        req.user = {
          id: user._id.toString(),
          name: user.name,
          email: user.email || "",
          username: user.username,
          role: user.role,
        };
        next();
      })
      .catch(() =>
        res.status(403).json({ error: "Token không hợp lệ" }),
      );
  } catch (err) {
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
