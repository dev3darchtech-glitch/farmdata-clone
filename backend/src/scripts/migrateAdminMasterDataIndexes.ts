import mongoose from "mongoose";
import { env } from "../configs/env";

type IndexAction = {
  collection: string;
  drop?: string[];
  create?: Array<{
    key: Record<string, 1 | -1>;
    options?: Record<string, unknown>;
  }>;
};

const ACTIONS: IndexAction[] = [
  {
    collection: "plots",
    drop: ["code_1"],
    create: [
      {
        key: { code: 1, createdByAdminId: 1 },
        options: { unique: true, name: "code_1_createdByAdminId_1" },
      },
    ],
  },
  {
    collection: "crops",
    create: [
      {
        key: { name: 1, createdByAdminId: 1 },
        options: { unique: true, name: "name_1_createdByAdminId_1" },
      },
    ],
  },
  {
    collection: "plantdiseases",
    drop: ["group_1_type_1_name_1"],
    create: [
      {
        key: { group: 1, type: 1, name: 1, createdByAdminId: 1 },
        options: {
          unique: true,
          name: "group_1_type_1_name_1_createdByAdminId_1",
        },
      },
    ],
  },
];

async function main() {
  const apply = process.argv.includes("--apply");

  if (!env.hasExplicitMongoUri) {
    throw new Error("MONGODB_URI chưa được cấu hình. Dừng để tránh chạy nhầm DB local.");
  }

  await mongoose.connect(env.mongodbUri, { serverSelectionTimeoutMS: 10000 });
  const db = mongoose.connection.db;
  if (!db) {
    throw new Error("Không thể truy cập MongoDB database handle.");
  }
  const report: Record<string, unknown>[] = [];

  for (const action of ACTIONS) {
    const collection = db.collection(action.collection);
    const before = await collection.indexes();
    const entry: Record<string, unknown> = {
      collection: action.collection,
      before: before.map((index) => index.name),
      mode: apply ? "apply" : "dry-run",
    };

    if (apply) {
      for (const indexName of action.drop || []) {
        const exists = before.some((index) => index.name === indexName);
        if (exists) {
          await collection.dropIndex(indexName);
        }
      }

      for (const create of action.create || []) {
        await collection.createIndex(create.key, create.options || {});
      }
    }

    const after = apply ? await collection.indexes() : before;
    entry.after = after.map((index) => index.name);
    report.push(entry);
  }

  console.log(JSON.stringify({ ok: true, report }, null, 2));
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
