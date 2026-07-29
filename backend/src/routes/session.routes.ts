import { Router } from "express";
import {
  createSession,
  getSessions,
  updateSession,
} from "../controllers/session.controller";
import { authenticateToken, requireRole } from "../middleware/rbac";

const router = Router();

/**
 * POST /api/sessions
 * Creates a CaptureSession in MongoDB.
 * Enforces role check (FARMER or ADMIN).
 */
router.post(
  "/",
  authenticateToken,
  requireRole("FARMER", "ADMIN"),
  createSession,
);

router.patch(
  "/:id",
  authenticateToken,
  requireRole("ADMIN"),
  updateSession,
);

/**
 * GET /api/sessions
 */
router.get("/", authenticateToken, getSessions);

export default router;
