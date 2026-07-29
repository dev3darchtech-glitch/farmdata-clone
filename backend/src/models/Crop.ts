import mongoose, { Document, Model, Schema } from "mongoose";

export interface ICropDocument extends Document {
  name: string;
  category: string;
  icon?: string;
  isActive: boolean;
  createdByAdminId?: mongoose.Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
}

const CropSchema = new Schema<ICropDocument>(
  {
    name: { type: String, required: true, trim: true },
    category: { type: String, required: true, trim: true },
    icon: { type: String, default: "🌱" },
    isActive: { type: Boolean, default: true },
    createdByAdminId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  { timestamps: true },
);

CropSchema.index({ name: 1, createdByAdminId: 1 }, { unique: true });

export const CropModel: Model<ICropDocument> =
  mongoose.models.Crop || mongoose.model<ICropDocument>("Crop", CropSchema);
