import { Router } from "express";
import {
  createCrop,
  createPlot,
  createUser,
  getCrops,
  getPlots,
  getUsers,
} from "../controllers/admin.controller";
import { authenticateToken, requireRole } from "../middleware/rbac";

const router = Router();

// Apply ADMIN role requirement to all routes in this router
router.use(authenticateToken, requireRole("ADMIN"));

/**
 * GET /api/admin/plots
 */
router.get("/plots", getPlots);

/**
 * POST /api/admin/plots
 */
router.post("/plots", createPlot);

/**
 * GET /api/admin/crops
 */
router.get("/crops", getCrops);

/**
 * POST /api/admin/crops
 */
router.post("/crops", createCrop);

/**
 * GET /api/admin/users
 */
router.get("/users", getUsers);

/**
 * POST /api/admin/users
 */
router.post("/users", createUser);

export default router;
