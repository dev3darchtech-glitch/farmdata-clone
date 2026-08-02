import dotenv from "dotenv";

dotenv.config();

const toNumber = (value: string | undefined, fallback: number) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

export const env = {
  nodeEnv: process.env.NODE_ENV || "development",
  port: toNumber(process.env.PORT, 3000),
  jwtSecret: process.env.JWT_SECRET || "farm-data-secret-key-2026",
  mongodbUri: process.env.MONGODB_URI || "mongodb://localhost:27017/farmdata",
};
