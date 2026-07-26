import { Router } from "express";
import {
  createPost,
  getPostById,
  getPosts,
} from "../controllers/post.controller";
import { authenticateToken, requireRole } from "../middleware/rbac";

const router = Router();

/**
 * GET /api/posts
 * Fetch post feed. Enforces role check.
 */
router.get(
  "/",
  authenticateToken,
  requireRole("FARMER", "ADMIN"),
  getPosts,
);

/**
 * POST /api/posts
 * Admin publishes a post from a completed capture session.
 */
router.post(
  "/",
  authenticateToken,
  requireRole("ADMIN"),
  createPost,
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
