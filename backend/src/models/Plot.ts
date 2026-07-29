import mongoose, { Document, Model, Schema } from "mongoose";
import { EnvMode } from "../types";

export interface IPlotDocument extends Document {
  code: string;
  name: string;
  envMode: EnvMode;
  areaSquareMeters?: number;
  isActive: boolean;
  createdByAdminId?: mongoose.Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
}

const PlotSchema = new Schema<IPlotDocument>(
  {
    code: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
    },
    name: { type: String, required: true, trim: true },
    envMode: {
      type: String,
      enum: ["outdoor", "greenhouse"],
      required: true,
      default: "outdoor",
    },
    areaSquareMeters: { type: Number },
    isActive: { type: Boolean, default: true },
    createdByAdminId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  { timestamps: true },
);

PlotSchema.index({ code: 1, createdByAdminId: 1 }, { unique: true });

export const PlotModel: Model<IPlotDocument> =
  mongoose.models.Plot || mongoose.model<IPlotDocument>("Plot", PlotSchema);
