import mongoose, { Document, Model, Schema } from "mongoose";
import { PLANT_DISEASE_GROUPS, PlantDiseaseGroup } from "../types";

export interface IPlantDiseaseDocument extends Document {
  group: PlantDiseaseGroup;
  type: string;
  name: string;
  description?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const PlantDiseaseSchema = new Schema<IPlantDiseaseDocument>(
  {
    group: { type: String, required: true, trim: true },
    type: { type: String, required: true, trim: true },
    name: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

PlantDiseaseSchema.index(
  { group: 1, type: 1, name: 1 },
  { unique: true },
);

export const PlantDiseaseModel: Model<IPlantDiseaseDocument> =
  mongoose.models.PlantDisease ||
  mongoose.model<IPlantDiseaseDocument>("PlantDisease", PlantDiseaseSchema);
