import mongoose, { Document, Model, Schema } from "mongoose";
import { RoleName } from "../types";

export interface IUserDocument extends Document {
  name: string;
  email?: string;
  username: string;
  firebaseUid?: string;
  role: RoleName;
  isRevoked: boolean;
  revokedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export function createUsernameFromEmail(email: string) {
  const localPart = email.split("@")[0] || "";
  const normalized = localPart
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");

  return normalized || `user${Date.now()}`;
}

const UserSchema = new Schema<IUserDocument>(
  {
    name: { type: String, required: true },
    email: {
      type: String,
      unique: true,
      sparse: true,
      lowercase: true,
      trim: true,
    },
    username: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      match: /^[a-z0-9]+$/,
      default: function (this: IUserDocument) {
        return this.email
          ? createUsernameFromEmail(this.email)
          : `user${Date.now()}`;
      },
    },
    firebaseUid: { type: String, unique: true, sparse: true },
    role: {
      type: String,
      enum: ["FARMER", "ADMIN"],
      default: "FARMER",
    },
    isRevoked: { type: Boolean, default: false },
    revokedAt: { type: Date },
  },
  { timestamps: true },
);

UserSchema.pre("validate", function (next) {
  if (!this.username && this.email) {
    this.username = createUsernameFromEmail(this.email);
  } else if (this.username) {
    this.username = this.username.toLowerCase().replace(/[^a-z0-9]/g, "");
  }
  if (this.email === "") {
    this.email = undefined;
  }
  next();
});

export const UserModel: Model<IUserDocument> =
  mongoose.models.User || mongoose.model<IUserDocument>("User", UserSchema);
