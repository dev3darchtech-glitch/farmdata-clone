import mongoose from "mongoose";
import { env } from "../configs/env";

export async function connectMongoDB(uri?: string) {
  const mongoUri = uri || env.mongodbUri;

  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 3000 });
  }
}
