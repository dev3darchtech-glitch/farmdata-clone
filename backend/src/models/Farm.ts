import mongoose, { Document, Model, Schema } from "mongoose";

export interface IFarmDocument extends Document {
  name: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const FarmSchema = new Schema<IFarmDocument>(
  {
    name: { type: String, required: true, trim: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

FarmSchema.index({ name: 1 }, { unique: true });

export const FarmModel: Model<IFarmDocument> =
  mongoose.models.Farm || mongoose.model<IFarmDocument>("Farm", FarmSchema);
