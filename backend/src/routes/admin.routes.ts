import { Router } from "express";
import {
  createCrop,
  createFarm,
  createPlantDisease,
  createPlot,
  createUser,
  deactivateCrop,
  deactivateFarm,
  deactivatePlantDisease,
  deactivatePlot,
  getCrops,
  getFarms,
  getPlantDiseases,
  getPlots,
  getUsers,
  restoreUser,
  revokeUser,
  updateCrop,
  updateFarm,
  updatePlantDisease,
  updatePlot,
  updateUser,
  deleteCrop,
  deleteFarm,
  deletePlantDisease,
  deletePlot,
  deleteUser,
  renamePlantDiseaseGroup,
  deletePlantDiseaseGroup,
  renamePlantDiseaseType,
  deletePlantDiseaseType,
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

/**
 * GET /api/admin/farms
 */
router.get("/farms", getFarms);

/**
 * POST /api/admin/farms
 */
router.post("/farms", createFarm);

/**
 * PATCH /api/admin/farms/:id
 */
router.patch("/farms/:id", updateFarm);

/**
 * PATCH /api/admin/farms/:id/deactivate
 */
router.patch("/farms/:id/deactivate", deactivateFarm);

/**
 * DELETE endpoints
 */
router.delete("/plots/:id", deletePlot);
router.delete("/farms/:id", deleteFarm);
router.delete("/crops/:id", deleteCrop);
router.delete("/plant-diseases/:id", deletePlantDisease);
router.delete("/users/:id", deleteUser);

// Group/Type management
router.put("/plant-disease-groups/rename", renamePlantDiseaseGroup);
router.delete("/plant-disease-groups", deletePlantDiseaseGroup);
router.put("/plant-disease-types/rename", renamePlantDiseaseType);
router.delete("/plant-disease-types", deletePlantDiseaseType);

export default router;
