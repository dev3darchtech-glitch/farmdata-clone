import { Request, Response } from "express";
import { FilterQuery } from "mongoose";
import { IPostDocument, PostModel } from "../models/Post";

/**
 * GET /api/posts
 * Fetch automatically generated post feed with optional crop and search filter.
 */
export const getPosts = async (req: Request, res: Response) => {
  const { crop, q } = req.query;

  const filter: FilterQuery<IPostDocument> = {};

  if (crop && typeof crop === "string" && crop !== "ALL") {
    filter.cropType = new RegExp(`^${crop}$`, "i");
  }

  if (q && typeof q === "string" && q.trim()) {
    const searchRegex = new RegExp(q.trim(), "i");
    filter.$or = [
      { cropType: searchRegex },
      { plotId: searchRegex },
      { symptomDescription: searchRegex },
      { "user.name": searchRegex },
    ];
  }

  const posts = await PostModel.find(filter).sort({ createdAt: -1 });
  return res.json(posts);
};

/**
 * GET /api/posts/:id
 */
export const getPostById = async (req: Request, res: Response) => {
  const post = await PostModel.findOne({
    $or: [{ _id: req.params.id }, { postId: req.params.id }],
  });
  if (!post) {
    return res.status(404).json({ error: "Post not found" });
  }
  return res.json(post);
};
