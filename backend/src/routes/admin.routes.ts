import { Router } from "express";
import {
  createCrop,
  createPlantDisease,
  createPlot,
  createUser,
  deactivateCrop,
  deactivatePlantDisease,
  deactivatePlot,
  getCrops,
  getPlantDiseases,
  getPlots,
  getUsers,
  restoreUser,
  revokeUser,
  updateCrop,
  updatePlantDisease,
  updatePlot,
  updateUser,
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
 * PATCH /api/admin/plots/:id
 */
router.patch("/plots/:id", updatePlot);

/**
 * PATCH /api/admin/plots/:id/deactivate
 */
router.patch("/plots/:id/deactivate", deactivatePlot);

/**
 * GET /api/admin/crops
 */
router.get("/crops", getCrops);

/**
 * POST /api/admin/crops
 */
router.post("/crops", createCrop);

/**
 * PATCH /api/admin/crops/:id
 */
router.patch("/crops/:id", updateCrop);

/**
 * PATCH /api/admin/crops/:id/deactivate
 */
router.patch("/crops/:id/deactivate", deactivateCrop);

/**
 * GET /api/admin/plant-diseases
 */
router.get("/plant-diseases", getPlantDiseases);

/**
 * POST /api/admin/plant-diseases
 */
router.post("/plant-diseases", createPlantDisease);

/**
 * PATCH /api/admin/plant-diseases/:id
 */
router.patch("/plant-diseases/:id", updatePlantDisease);

/**
 * PATCH /api/admin/plant-diseases/:id/deactivate
 */
router.patch("/plant-diseases/:id/deactivate", deactivatePlantDisease);

/**
 * GET /api/admin/users
 */
router.get("/users", getUsers);

/**
 * POST /api/admin/users
 */
router.post("/users", createUser);

/**
 * PATCH /api/admin/users/:id
 */
router.patch("/users/:id", updateUser);

/**
 * PATCH /api/admin/users/:id/revoke
 */
router.patch("/users/:id/revoke", revokeUser);

/**
 * PATCH /api/admin/users/:id/restore
 */
router.patch("/users/:id/restore", restoreUser);

export default router;
