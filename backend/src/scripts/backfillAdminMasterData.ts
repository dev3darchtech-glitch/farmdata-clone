import mongoose from "mongoose";
import { env } from "../configs/env";
import { UserModel } from "../models/User";
import { seedDefaultMasterDataForAdmin } from "../services/masterDataSeedService";

async function main() {
  const apply = process.argv.includes("--apply");
  const mongoUri = env.mongodbUri;

  if (!env.hasExplicitMongoUri) {
    throw new Error("MONGODB_URI chưa được cấu hình. Dừng để tránh chạy nhầm DB local.");
  }

  await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 10000 });

  const admins = await UserModel.find({ role: "ADMIN" })
    .select("_id email username")
    .sort({ createdAt: 1 });

  console.log(
    JSON.stringify(
      {
        mode: apply ? "apply" : "dry-run",
        adminCount: admins.length,
        admins: admins.map((admin) => ({
          id: admin._id.toString(),
          email: admin.email || null,
          username: admin.username,
        })),
      },
      null,
      2,
    ),
  );

  if (!apply) {
    console.log(
      "Dry run hoàn tất. Chạy lại với --apply để seed master data cho toàn bộ admin hiện tại.",
    );
    return;
  }

  for (const admin of admins) {
    await seedDefaultMasterDataForAdmin(admin._id);
  }

  console.log(
    JSON.stringify(
      {
        ok: true,
        seededAdminCount: admins.length,
      },
      null,
      2,
    ),
  );
}

main()
  .catch((error) => {
    console.error(
      JSON.stringify(
        {
          ok: false,
          message: error instanceof Error ? error.message : String(error),
        },
        null,
        2,
      ),
    );
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect().catch(() => undefined);
  });
