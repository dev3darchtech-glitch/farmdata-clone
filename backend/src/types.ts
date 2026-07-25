export type RoleName = "FARMER" | "ADMIN";

export interface UserAccount {
  id: string;
  name: string;
  email: string;
  username: string;
  passwordHash: string;
  role: RoleName;
}

export type GrowthStageId =
  | "newly_planted"
  | "vegetative"
  | "flowering"
  | "fruiting"
  | "harvest";
export type EnvMode = "outdoor" | "greenhouse";
export type SymptomSeverity = "Chớm bệnh" | "Nhẹ" | "Vừa" | "Rất nặng";
export type SessionStatus = "DRAFT" | "UPLOADING" | "COMPLETED" | "FAILED";
export type PostStatus = "GENERATING" | "PUBLISHED" | "FAILED";

export interface WeatherCondition {
  temperature: number;
  lightUvIndex: number;
  windSpeed: number;
  co2Level: number;
}

export interface CaptureSessionRecord {
  id: string;
  farmerId: string;
  farmerName: string;
  farmerEmail: string;
  images: string[];
  plotId?: string;
  cropType: string;
  growthStage: GrowthStageId;
  envMode: EnvMode;
  stationMeasurements: WeatherCondition;
  localMeasurements?: WeatherCondition;
  symptomDescription: string;
  severity: SymptomSeverity;
  status: SessionStatus;
  createdAt: string;
}

export interface PostRecord {
  id: string;
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
  stationMeasurements: WeatherCondition;
  localMeasurements?: WeatherCondition;
  status: PostStatus;
  createdAt: string;
}

export interface PlotRecord {
  id: string;
  code: string;
  name: string;
  areaSquareMeters?: number;
}

export interface CropRecord {
  id: string;
  name: string;
  category: string;
  icon?: string;
}
