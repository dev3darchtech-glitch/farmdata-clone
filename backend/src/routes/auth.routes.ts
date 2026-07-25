import { Router } from "express";
import {
  getGoogleAppAuthUrl,
  getGoogleAppCallback,
  getGoogleAuthUrl,
  getMe,
  linkGoogleAccount,
  login,
} from "../controllers/auth.controller";
import { authenticateToken, requireRole } from "../middleware/rbac";

const router = Router();

/**
 * POST /api/auth/login
 */
router.post("/login", login);

/**
 * GET /api/auth/google
 */
router.get("/google", getGoogleAppAuthUrl);

/**
 * GET /api/auth/google/callback
 */
router.get("/google/callback", getGoogleAppCallback);

/**
 * GET /api/auth/me
 */
router.get("/me", authenticateToken, getMe);

/**
 * GET /api/auth/google/url
 */
router.get(
  "/google/url",
  authenticateToken,
  requireRole("ADMIN"),
  getGoogleAuthUrl,
);

/**
 * POST /api/auth/google/link
 */
router.post(
  "/google/link",
  authenticateToken,
  requireRole("ADMIN"),
  linkGoogleAccount,
);

export default router;
