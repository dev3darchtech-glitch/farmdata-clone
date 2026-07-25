import mongoose, { Document, Model, Schema } from "mongoose";
import { RoleName } from "../types";

export interface IUserGoogleTokens {
  accessToken?: string;
  refreshToken?: string;
  expiryDate?: number;
  email?: string;
  isLinked: boolean;
}

export interface IUserDocument extends Document {
  name: string;
  email: string;
  username: string;
  passwordHash: string;
  role: RoleName;
  createdByAdminId?: mongoose.Types.ObjectId;
  googleTokens?: IUserGoogleTokens;
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
      required: true,
      unique: true,
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
        return createUsernameFromEmail(this.email);
      },
    },
    passwordHash: { type: String, required: true, select: false },
    role: {
      type: String,
      enum: ["FARMER", "ADMIN"],
      default: "FARMER",
    },
    createdByAdminId: { type: Schema.Types.ObjectId, ref: "User" },
    googleTokens: {
      accessToken: { type: String },
      refreshToken: { type: String },
      expiryDate: { type: Number },
      email: { type: String },
      isLinked: { type: Boolean, default: false },
    },
  },
  { timestamps: true },
);

UserSchema.pre("validate", function (next) {
  if (!this.username && this.email) {
    this.username = createUsernameFromEmail(this.email);
  } else if (this.username) {
    this.username = this.username.toLowerCase().replace(/[^a-z0-9]/g, "");
  }
  next();
});

export const UserModel: Model<IUserDocument> =
  mongoose.models.User || mongoose.model<IUserDocument>("User", UserSchema);
