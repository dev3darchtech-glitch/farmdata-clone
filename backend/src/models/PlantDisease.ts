import mongoose, { Document, Model, Schema } from "mongoose";
import { PLANT_DISEASE_GROUPS, PlantDiseaseGroup } from "../types";

export interface IPlantDiseaseDocument extends Document {
  group: PlantDiseaseGroup;
  type: string;
  name: string;
  description?: string;
  isActive: boolean;
  createdByAdminId?: mongoose.Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
}

const PlantDiseaseSchema = new Schema<IPlantDiseaseDocument>(
  {
    group: { type: String, enum: PLANT_DISEASE_GROUPS, required: true },
    type: { type: String, required: true, trim: true },
    name: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    isActive: { type: Boolean, default: true },
    createdByAdminId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  { timestamps: true },
);

PlantDiseaseSchema.index(
  { group: 1, type: 1, name: 1, createdByAdminId: 1 },
  { unique: true },
);

export const PlantDiseaseModel: Model<IPlantDiseaseDocument> =
  mongoose.models.PlantDisease ||
  mongoose.model<IPlantDiseaseDocument>("PlantDisease", PlantDiseaseSchema);
