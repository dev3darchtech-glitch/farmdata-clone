import mongoose, { Document, Model, Schema } from "mongoose";
import {
  CaptureLocation,
  EnvMode,
  GROWTH_STAGE_IDS,
  GrowthStageId,
  RoleName,
  SessionStatus,
  SYMPTOM_SEVERITY_VALUES,
  SymptomSeverity,
  WeatherCondition,
} from "../types";

export interface IDriveFile {
  fileId: string;
  webViewLink?: string;
  webContentLink?: string;
  fileName?: string;
  folderPath?: string;
  description?: string;
  watermarkFileId?: string;
  watermarkWebViewLink?: string;
  watermarkWebContentLink?: string;
}

export interface ICaptureSessionDocument extends Document {
  sessionId: string;
  farmerId: string;
  farmerName: string;
  farmerEmail?: string;
  createdByRole: RoleName;
  images: string[];
  driveFiles?: IDriveFile[];
  plotId?: string;
  cropType: string;
  growthStage: GrowthStageId;
  envMode: EnvMode;
  captureLocation?: CaptureLocation;
  stationMeasurements: WeatherCondition;
  stationMeasurementsT24?: WeatherCondition;
  stationMeasurementsT48?: WeatherCondition;
  localMeasurements?: WeatherCondition;
  diseaseGroup?: string;
  diseaseType?: string;
  diseaseName?: string;
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
    farmerEmail: { type: String },
    createdByRole: { type: String, enum: ["FARMER", "ADMIN"], required: true },
    images: [{ type: String, required: true }],
    driveFiles: [
      {
        fileId: { type: String },
        webViewLink: { type: String },
        webContentLink: { type: String },
        fileName: { type: String },
        folderPath: { type: String },
        description: { type: String },
        watermarkFileId: { type: String },
        watermarkWebViewLink: { type: String },
        watermarkWebContentLink: { type: String },
      },
    ],
    plotId: { type: String },
    cropType: { type: String, required: true },
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
    stationMeasurements: {
      temperature: { type: Number, required: true },
      lightUvIndex: { type: Number, required: true },
      windSpeed: { type: Number, required: true },
      co2Level: { type: Number, required: true },
      humidity: { type: Number },
      weatherCode: { type: Number },
      updatedAt: { type: String },
      soilPh: { type: String },
      soilEc: { type: String },
      soilDo: { type: String },
      soilHumidity: { type: String },
    },
    stationMeasurementsT24: {
      temperature: { type: Number },
      lightUvIndex: { type: Number },
      windSpeed: { type: Number },
      co2Level: { type: Number },
      humidity: { type: Number },
      weatherCode: { type: Number },
      updatedAt: { type: String },
    },
    stationMeasurementsT48: {
      temperature: { type: Number },
      lightUvIndex: { type: Number },
      windSpeed: { type: Number },
      co2Level: { type: Number },
      humidity: { type: Number },
      weatherCode: { type: Number },
      updatedAt: { type: String },
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
    symptomDescription: { type: String, required: true },
    severity: { type: String, enum: SYMPTOM_SEVERITY_VALUES, required: true },
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
