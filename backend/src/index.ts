import cors from "cors";
import express from "express";
import mongoose from "mongoose";
import { env } from "./configs/env";
import { connectMongoDB } from "./db/connect";
import adminRoutes from "./routes/admin.routes";
import authRoutes from "./routes/auth.routes";
import masterDataRoutes from "./routes/masterData.routes";
import postRoutes from "./routes/post.routes";
import sessionRoutes from "./routes/session.routes";

export const app = express();

app.set("trust proxy", true);
app.use(cors());
app.use(express.json({ limit: "10mb" }));

// Health check endpoint
app.get("/health", (req, res) => {
  const isMongoReady = mongoose.connection.readyState === 1;

  return res.status(isMongoReady ? 200 : 503).json({
    mongo: {
      readyState: mongoose.connection.readyState,
      status: isMongoReady ? "connected" : "disconnected",
    },
    status: isMongoReady ? "ok" : "degraded",
    timestamp: new Date().toISOString(),
  });
});

// API Route mounts
app.use("/api/auth", authRoutes);
app.use("/api/master-data", masterDataRoutes);
app.use("/api/sessions", sessionRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/admin", adminRoutes);

// Global Error Handler
app.use(
  (
    err: any,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction,
  ) => {
    console.error("🔥 Backend Unhandled Error:", {
      message: err.message,
      stack: err.stack,
      path: req.path,
      method: req.method,
      body: req.body,
      query: req.query,
      timestamp: new Date().toISOString(),
    });

    return res.status(err.status || 500).json({
      error: err.message || "Đã xảy ra lỗi hệ thống nội bộ",
      stack: env.nodeEnv === "development" ? err.stack : undefined,
    });
  },
);

// 404 Handler
app.use((req, res) => {
  res.status(404).json({ error: "Endpoint not found" });
});

if (env.nodeEnv !== "test") {
  const startServer = async () => {
    await connectMongoDB();
    console.log("✅ MongoDB connected");

    app.listen(env.port, "0.0.0.0", () => {
      console.log(`🚀 FarmData Backend API listening on port ${env.port}`);
    });
  };

  startServer().catch((error) => {
    console.error("❌ Backend startup failed", error);
    process.exit(1);
  });
}
