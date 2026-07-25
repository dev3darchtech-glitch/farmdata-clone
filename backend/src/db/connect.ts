import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import { env } from "../configs/env";
import { CropModel } from "../models/Crop";
import { PlotModel } from "../models/Plot";
import { PostModel } from "../models/Post";
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
      console.log(`🍃 Connected to MongoDB at ${mongoUri}`);
    } catch (err: any) {
      if (!uri && (!env.hasExplicitMongoUri || isLocalMongoUri(mongoUri))) {
        console.log(
          "⚠️ Local MongoDB server is unavailable. Starting MongoMemoryServer fallback...",
        );
        const { MongoMemoryServer } = await import("mongodb-memory-server");
        const mongoServer = await MongoMemoryServer.create();
        const memUri = mongoServer.getUri();
        await mongoose.connect(memUri);
        console.log(`🍃 Connected to Fallback In-Memory MongoDB at ${memUri}`);
      } else {
        throw err;
      }
    }
    await seedDefaultsIfEmpty();
  }
}

export async function seedDefaultsIfEmpty() {
  const userCount = await UserModel.countDocuments();
  if (userCount === 0) {
    const passwordHash = bcrypt.hashSync("123456", 8);

    const adminUser = await UserModel.create({
      name: "Quản trị viên Lâm",
      email: "admin@farm.vn",
      username: "admin",
      passwordHash,
      role: "ADMIN",
      googleTokens: {
        accessToken: "mock_admin_access_token",
        refreshToken: "mock_admin_refresh_token",
        email: "admin@farm.vn",
        isLinked: true,
      },
    });

    const farmerUser = await UserModel.create({
      name: "Nguyễn Văn An",
      email: "an.nguyen@farm.vn",
      username: "annguyen",
      passwordHash,
      role: "FARMER",
      createdByAdminId: adminUser._id,
    });

    await PlotModel.create([
      { code: "L-001", name: "Luống 01 - Khu A (Nhà kính)" },
      { code: "L-002", name: "Luống 02 - Khu A (Nhà kính)" },
      { code: "L-003", name: "Luống 03 - Khu B (Ngoài trời)" },
    ]);

    await CropModel.create([
      { name: "Cà chua", category: "Rau ăn quả", icon: "🍅" },
      { name: "Dưa leo", category: "Rau ăn quả", icon: "🥒" },
      { name: "Ớt chuông", category: "Rau ăn quả", icon: "🫑" },
      { name: "Bắp cải", category: "Rau ăn lá", icon: "🥬" },
    ]);

    await PostModel.create({
      postId: "POST-1001",
      sessionId: "SESS-1001",
      user: {
        id: farmerUser._id.toString(),
        name: "Nguyễn Văn An",
        email: "an.nguyen@farm.vn",
        role: "FARMER",
      },
      cropType: "Cà chua",
      plotId: "L-001",
      growthStage: "flowering",
      envMode: "greenhouse",
      symptomDescription: "Đốm vàng lá chân và héo nhẹ gân lá",
      severity: "Vừa",
      images: [
        "https://images.unsplash.com/photo-1592841200221-a6898f307baa?w=800&auto=format&fit=crop&q=80",
      ],
      driveFiles: [
        {
          fileId: "GDRIVE-ADMIN-FILE-1001",
          webViewLink: "https://drive.google.com/file/d/mock_file_id/view",
          fileName: "farm_capture_photo_1.jpg",
        },
      ],
      stationMeasurements: {
        temperature: 28.5,
        lightUvIndex: 65,
        windSpeed: 12.0,
        co2Level: 420,
      },
      status: "PUBLISHED",
      createdAt: new Date(),
    });

    console.log("🌱 Default MongoDB database seed completed successfully.");
  } else {
    const usersWithoutUsername = await UserModel.find({
      $or: [
        { username: { $exists: false } },
        { username: "" },
        { username: { $not: /^[a-z0-9]+$/ } },
      ],
    });

    for (const user of usersWithoutUsername) {
      user.username = createUsernameFromEmail(user.email);
      await user.save();
    }

    if (usersWithoutUsername.length > 0) {
      console.log(
        `🌱 Backfilled username for ${usersWithoutUsername.length} existing users.`,
      );
    }
  }
}
