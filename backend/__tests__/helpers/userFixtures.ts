import bcrypt from "bcryptjs";
import { UserModel } from "../../src/models/User";
import { createAdminUser } from "../../src/services/adminUserService";

export async function createAdminFixture(input?: {
  name?: string;
  email?: string;
  username?: string;
  password?: string;
}) {
  const stamp = Date.now();
  const password = input?.password || "123456";
  const email = input?.email || `admin.${stamp}@farm.vn`;
  const username = input?.username || `admin${stamp}`;

  const admin = await createAdminUser({
    name: input?.name || "Admin Test",
    email,
    username,
    password,
    isRevoked: false,
  });

  return { admin, email, username, password };
}

export async function createFarmerFixture(input: {
  adminId: string;
  name?: string;
  email?: string;
  username?: string;
  password?: string;
}) {
  const stamp = Date.now();
  const password = input.password || "123456";
  const email = input.email || `farmer.${stamp}@farm.vn`;
  const username = input.username || `farmer${stamp}`;

  const farmer = await UserModel.create({
    name: input.name || "Farmer Test",
    email,
    username,
    role: "FARMER",
    createdByAdminId: input.adminId,
    isRevoked: false,
  });

  return { farmer, email, username, password };
}
