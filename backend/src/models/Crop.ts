import mongoose, { Document, Model, Schema } from "mongoose";

export interface ICropDocument extends Document {
  name: string;
  category: string;
  icon?: string;
  createdAt: Date;
  updatedAt: Date;
}

const CropSchema = new Schema<ICropDocument>(
  {
    name: { type: String, required: true, trim: true },
    category: { type: String, required: true, trim: true },
    icon: { type: String, default: "🌱" },
  },
  { timestamps: true },
);

export const CropModel: Model<ICropDocument> =
  mongoose.models.Crop || mongoose.model<ICropDocument>("Crop", CropSchema);
