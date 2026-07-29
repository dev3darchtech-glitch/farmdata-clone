import bcrypt from "bcryptjs";
import { IUserDocument, IUserGoogleTokens, UserModel } from "../models/User";
import { seedDefaultMasterDataForAdmin } from "./masterDataSeedService";

type CreateAdminUserInput = {
  name: string;
  email: string;
  username?: string;
  password?: string;
  passwordHash?: string;
  googleTokens?: IUserGoogleTokens;
  isRevoked?: boolean;
};

function normalizeUsername(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

async function buildUniqueUsername(email: string) {
  const baseUsername = normalizeUsername(email.split("@")[0] || "") || "admin";
  let username = baseUsername;
  let suffix = 1;

  while (await UserModel.exists({ username })) {
    suffix += 1;
    username = `${baseUsername}${suffix}`;
  }

  return username;
}

export async function createAdminUser(
  input: CreateAdminUserInput,
): Promise<IUserDocument> {
  const email = input.email.trim().toLowerCase();
  const username = input.username
    ? normalizeUsername(input.username)
    : await buildUniqueUsername(email);

  if (!username) {
    throw new Error("Tên đăng nhập admin không hợp lệ.");
  }

  const passwordHash =
    input.passwordHash ||
    bcrypt.hashSync(input.password || `${email}:${Date.now()}`, 8);

  const user = await UserModel.create({
    name: input.name.trim(),
    email,
    username,
    passwordHash,
    role: "ADMIN",
    googleTokens: input.googleTokens,
    isRevoked: input.isRevoked ?? false,
  });

  await seedDefaultMasterDataForAdmin(user._id);
  return user;
}
