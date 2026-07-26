import mongoose, { Document, Model, Schema } from "mongoose";
import {
  EnvMode,
  CaptureLocation,
  GROWTH_STAGE_IDS,
  GrowthStageId,
  PostStatus,
  RoleName,
  SYMPTOM_SEVERITY_VALUES,
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
    email?: string;
    role: RoleName;
  };
  cropType: string;
  plotId?: string;
  growthStage: GrowthStageId;
  envMode: EnvMode;
  captureLocation?: CaptureLocation;
  symptomDescription: string;
  severity: SymptomSeverity;
  images: string[];
  driveFiles?: IDriveFile[];
  stationMeasurements: WeatherCondition;
  localMeasurements?: WeatherCondition;
  diseaseGroup?: string;
  diseaseType?: string;
  diseaseName?: string;
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
      email: { type: String },
      role: { type: String, required: true },
    },
    cropType: { type: String, required: true },
    plotId: { type: String },
    growthStage: { type: String, enum: GROWTH_STAGE_IDS, required: true },
    envMode: { type: String, required: true },
    captureLocation: {
      latitude: { type: Number },
      longitude: { type: Number },
      accuracy: { type: Number },
      timestamp: { type: String },
      isMocked: { type: Boolean },
      name: { type: String },
      city: { type: String },
      region: { type: String },
      country: { type: String },
      formattedAddress: { type: String },
    },
    symptomDescription: { type: String, required: true },
    severity: { type: String, enum: SYMPTOM_SEVERITY_VALUES, required: true },
    images: [{ type: String, required: true }],
    driveFiles: [
      {
        fileId: { type: String },
        webViewLink: { type: String },
        webContentLink: { type: String },
        fileName: { type: String },
        folderPath: { type: String },
        description: { type: String },
      },
    ],
    stationMeasurements: {
      temperature: { type: Number, required: true },
      lightUvIndex: { type: Number, required: true },
      windSpeed: { type: Number, required: true },
      co2Level: { type: Number, required: true },
      humidity: { type: Number },
      weatherCode: { type: Number },
      soilPh: { type: String },
      soilEc: { type: String },
      soilDo: { type: String },
      soilHumidity: { type: String },
    },
    localMeasurements: {
      temperature: { type: Number },
      lightUvIndex: { type: Number },
      windSpeed: { type: Number },
      co2Level: { type: Number },
      humidity: { type: Number },
      weatherCode: { type: Number },
      soilPh: { type: String },
      soilEc: { type: String },
      soilDo: { type: String },
      soilHumidity: { type: String },
    },
    diseaseGroup: { type: String },
    diseaseType: { type: String },
    diseaseName: { type: String },
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
