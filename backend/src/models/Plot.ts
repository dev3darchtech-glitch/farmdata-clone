import mongoose, { Document, Model, Schema } from "mongoose";

export interface IPlotDocument extends Document {
  code: string;
  name: string;
  areaSquareMeters?: number;
  createdAt: Date;
  updatedAt: Date;
}

const PlotSchema = new Schema<IPlotDocument>(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },
    name: { type: String, required: true, trim: true },
    areaSquareMeters: { type: Number },
  },
  { timestamps: true },
);

export const PlotModel: Model<IPlotDocument> =
  mongoose.models.Plot || mongoose.model<IPlotDocument>("Plot", PlotSchema);
