import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { env } from "../configs/env";
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
    return res.status(401).json({ error: "Unauthorized: Missing token" });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AuthenticatedUser;
    req.user = decoded;
    next();
  } catch (err) {
    return res
      .status(403)
      .json({ error: "Forbidden: Invalid or expired token" });
  }
}

/**
 * Pure Role-Based Access Control (RBAC) middleware enforcing allowed user roles.
 */
export function requireRole(...allowedRoles: RoleName[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: `Forbidden: Access restricted to roles [${allowedRoles.join(", ")}]`,
        userRole: req.user.role,
      });
    }

    next();
  };
}
