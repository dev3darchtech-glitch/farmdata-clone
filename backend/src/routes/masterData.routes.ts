import { Router } from "express";
import { getCrops, getPlots } from "../controllers/admin.controller";
import { authenticateToken, requireRole } from "../middleware/rbac";

const router = Router();

router.use(authenticateToken, requireRole("FARMER", "ADMIN"));

/**
 * GET /api/master-data/plots
 */
router.get("/plots", getPlots);

/**
 * GET /api/master-data/crops
 */
router.get("/crops", getCrops);

export default router;
