import mongoose, { Document, Model, Schema } from "mongoose";
import {
  EnvMode,
  GrowthStageId,
  SessionStatus,
  SymptomSeverity,
  WeatherCondition,
} from "../types";

export interface IDriveFile {
  fileId: string;
  webViewLink?: string;
  fileName?: string;
}

export interface ICaptureSessionDocument extends Document {
  sessionId: string;
  farmerId: string;
  farmerName: string;
  farmerEmail: string;
  images: string[];
  driveFiles?: IDriveFile[];
  plotId?: string;
  cropType: string;
  growthStage: GrowthStageId;
  envMode: EnvMode;
  stationMeasurements: WeatherCondition;
  localMeasurements?: WeatherCondition;
  symptomDescription: string;
  severity: SymptomSeverity;
  status: SessionStatus;
  createdAt: Date;
  updatedAt: Date;
}

const CaptureSessionSchema = new Schema<ICaptureSessionDocument>(
  {
    sessionId: { type: String, required: true, unique: true },
    farmerId: { type: String, required: true },
    farmerName: { type: String, required: true },
    farmerEmail: { type: String, required: true },
    images: [{ type: String, required: true }],
    driveFiles: [
      {
        fileId: { type: String },
        webViewLink: { type: String },
        fileName: { type: String },
      },
    ],
    plotId: { type: String },
    cropType: { type: String, required: true },
    growthStage: { type: String, required: true },
    envMode: { type: String, required: true },
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
    symptomDescription: { type: String, required: true },
    severity: { type: String, required: true },
    status: {
      type: String,
      enum: ["DRAFT", "UPLOADING", "COMPLETED", "FAILED"],
      default: "COMPLETED",
    },
  },
  { timestamps: true },
);

export const CaptureSessionModel: Model<ICaptureSessionDocument> =
  mongoose.models.CaptureSession ||
  mongoose.model<ICaptureSessionDocument>(
    "CaptureSession",
    CaptureSessionSchema,
  );
