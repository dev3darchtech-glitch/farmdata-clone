import { Router } from "express";
import { getPostById, getPosts } from "../controllers/post.controller";
import { authenticateToken, requireRole } from "../middleware/rbac";

const router = Router();

/**
 * GET /api/posts
 * Fetch automatically generated post feed. Enforces role check.
 */
router.get(
  "/",
  authenticateToken,
  requireRole("FARMER", "ADMIN"),
  getPosts,
);

/**
 * GET /api/posts/:id
 */
router.get(
  "/:id",
  authenticateToken,
  requireRole("FARMER", "ADMIN"),
  getPostById,
);

export default router;
