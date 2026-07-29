import mongoose from "mongoose";
import { env } from "../configs/env";
import { createUsernameFromEmail, UserModel } from "../models/User";

function isLocalMongoUri(uri: string) {
  return (
    uri.includes("localhost") ||
    uri.includes("127.0.0.1") ||
    uri.includes("[::1]") ||
    uri.includes("::1")
  );
}

export async function connectMongoDB(uri?: string) {
  const mongoUri = uri || env.mongodbUri;

  if (mongoose.connection.readyState === 0) {
    try {
      await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 3000 });
    } catch (err: any) {
      if (!uri && (!env.hasExplicitMongoUri || isLocalMongoUri(mongoUri))) {
        const { MongoMemoryServer } = await import("mongodb-memory-server");
        const mongoServer = await MongoMemoryServer.create();
        const memUri = mongoServer.getUri();
        await mongoose.connect(memUri);
      } else {
        throw err;
      }
    }
    await seedDefaultsIfEmpty();
  }
}

export async function seedDefaultsIfEmpty() {
  const usersWithoutUsername = await UserModel.find({
    $or: [
      { username: { $exists: false } },
      { username: "" },
      { username: { $not: /^[a-z0-9]+$/ } },
    ],
  });

  for (const user of usersWithoutUsername) {
    user.username = user.email
      ? createUsernameFromEmail(user.email)
      : `user${user._id.toString().slice(-6)}`;
    await user.save();
  }

  if (usersWithoutUsername.length > 0) {
    console.log(
      `🌱 Backfilled username for ${usersWithoutUsername.length} existing users.`,
    );
  }
}
