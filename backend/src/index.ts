import cors from "cors";
import express from "express";
import { env } from "./configs/env";
import { connectMongoDB } from "./db/connect";
import adminRoutes from "./routes/admin.routes";
import authRoutes from "./routes/auth.routes";
import masterDataRoutes from "./routes/masterData.routes";
import postRoutes from "./routes/post.routes";
import sessionRoutes from "./routes/session.routes";

export const app = express();

app.use(cors());
app.use(express.json({ limit: "10mb" }));

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    service: "FarmData Backend (MongoDB & Google Drive)",
    timestamp: new Date().toISOString(),
  });
});

// API Route mounts
app.use("/api/auth", authRoutes);
app.use("/api/master-data", masterDataRoutes);
app.use("/api/sessions", sessionRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/admin", adminRoutes);

// 404 Handler
app.use((req, res) => {
  res.status(404).json({ error: "Endpoint not found" });
});

if (env.nodeEnv !== "test") {
  connectMongoDB().then(() => {
    app.listen(env.port, "0.0.0.0", () => {
      console.log(
        `🚀 FarmData Backend API running at http://${"0.0.0.0"}:${env.port}`,
      );
      console.log(
        `📡 Ready for MongoDB, RBAC, and Admin Google Drive uploads.`,
      );
    });
  });
}
