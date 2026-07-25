import { Router } from "express";
import { createSession, getSessions } from "../controllers/session.controller";
import { authenticateToken, requireRole } from "../middleware/rbac";

const router = Router();

/**
 * POST /api/sessions
 * Creates a CaptureSession and automatically generates linked Post in MongoDB.
 * Enforces role check (FARMER or ADMIN).
 */
router.post(
  "/",
  authenticateToken,
  requireRole("FARMER", "ADMIN"),
  createSession,
);

/**
 * GET /api/sessions
 */
router.get("/", authenticateToken, getSessions);

export default router;
