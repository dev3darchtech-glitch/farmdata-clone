import dotenv from "dotenv";

dotenv.config();

const toNumber = (value: string | undefined, fallback: number) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

export const env = {
  nodeEnv: process.env.NODE_ENV || "development",
  isProduction: process.env.NODE_ENV === "production",
  port: toNumber(process.env.PORT, 3000),
  jwtSecret: process.env.JWT_SECRET || "farm-data-secret-key-2026",
  mongodbUri: process.env.MONGODB_URI || "mongodb://localhost:27017/farmdata",
  hasExplicitMongoUri: Boolean(process.env.MONGODB_URI),
  googleClientId: process.env.GOOGLE_CLIENT_ID || "mock_client_id",
  googleClientSecret: process.env.GOOGLE_CLIENT_SECRET || "mock_client_secret",
  googleRedirectUri:
    process.env.GOOGLE_REDIRECT_URI ||
    "http://localhost:3000/api/auth/google/callback",
};
