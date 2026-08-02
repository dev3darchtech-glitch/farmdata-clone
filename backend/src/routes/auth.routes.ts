import { Router } from "express";
import { getMe, login, refreshAuthToken } from "../controllers/auth.controller";
import { authenticateToken } from "../middleware/rbac";

const router = Router();

/**
 * POST /api/auth/login
 */
router.post("/login", login);

/**
 * POST /api/auth/refresh
 */
router.post("/refresh", refreshAuthToken);

/**
 * GET /api/auth/me
 */
router.get("/me", authenticateToken, getMe);

export default router;
