import mongoose, { Document, Model, Schema } from "mongoose";
import { EnvMode } from "../types";

export interface IPlotDocument extends Document {
  code: string;
  name: string;
  farmId: mongoose.Types.ObjectId;
  envMode: EnvMode;
  areaSquareMeters?: number;
  isActive: boolean;
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
    farmId: {
      type: Schema.Types.ObjectId,
      ref: "Farm",
      required: true,
    },
    envMode: {
      type: String,
      enum: ["outdoor", "greenhouse"],
      required: true,
      default: "outdoor",
    },
    areaSquareMeters: { type: Number },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

PlotSchema.index({ code: 1 }, { unique: true });

export const PlotModel: Model<IPlotDocument> =
  mongoose.models.Plot || mongoose.model<IPlotDocument>("Plot", PlotSchema);
