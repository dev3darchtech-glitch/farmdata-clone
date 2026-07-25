import mongoose, { Document, Model, Schema } from "mongoose";
import {
  EnvMode,
  GrowthStageId,
  PostStatus,
  RoleName,
  SymptomSeverity,
  WeatherCondition,
} from "../types";
import { IDriveFile } from "./CaptureSession";

export interface IPostDocument extends Document {
  postId: string;
  sessionId: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: RoleName;
  };
  cropType: string;
  plotId?: string;
  growthStage: GrowthStageId;
  envMode: EnvMode;
  symptomDescription: string;
  severity: SymptomSeverity;
  images: string[];
  driveFiles?: IDriveFile[];
  stationMeasurements: WeatherCondition;
  localMeasurements?: WeatherCondition;
  status: PostStatus;
  createdAt: Date;
  updatedAt: Date;
}

const PostSchema = new Schema<IPostDocument>(
  {
    postId: { type: String, required: true, unique: true },
    sessionId: { type: String, required: true },
    user: {
      id: { type: String, required: true },
      name: { type: String, required: true },
      email: { type: String, required: true },
      role: { type: String, required: true },
    },
    cropType: { type: String, required: true },
    plotId: { type: String },
    growthStage: { type: String, required: true },
    envMode: { type: String, required: true },
    symptomDescription: { type: String, required: true },
    severity: { type: String, required: true },
    images: [{ type: String, required: true }],
    driveFiles: [
      {
        fileId: { type: String },
        webViewLink: { type: String },
        fileName: { type: String },
      },
    ],
    stationMeasurements: {
      temperature: { type: Number, required: true },
      lightUvIndex: { type: Number, required: true },
      windSpeed: { type: Number, required: true },
      co2Level: { type: Number, required: true },
    },
    localMeasurements: {
      temperature: { type: Number },
      lightUvIndex: { type: Number },
      windSpeed: { type: Number },
      co2Level: { type: Number },
    },
    status: {
      type: String,
      enum: ["GENERATING", "PUBLISHED", "FAILED"],
      default: "PUBLISHED",
    },
  },
  { timestamps: true },
);

export const PostModel: Model<IPostDocument> =
  mongoose.models.Post || mongoose.model<IPostDocument>("Post", PostSchema);
