export type RoleName = "FARMER" | "ADMIN";

export interface UserAccount {
  id: string;
  name: string;
  email?: string;
  username: string;
  passwordHash: string;
  role: RoleName;
}

export const GROWTH_STAGE_IDS = [
  "newly_planted",
  "vegetative",
  "flowering",
  "fruiting",
  "harvest",
] as const;
export type GrowthStageId = (typeof GROWTH_STAGE_IDS)[number];
export type EnvMode = "outdoor" | "greenhouse";
export const SYMPTOM_SEVERITY_VALUES = [
  "Chớm bệnh",
  "Nhẹ",
  "Vừa",
  "Nặng",
  "Rất nặng",
] as const;
export type SymptomSeverity = (typeof SYMPTOM_SEVERITY_VALUES)[number];
export type SessionStatus = "DRAFT" | "UPLOADING" | "COMPLETED" | "FAILED";
export type PostStatus = "GENERATING" | "PUBLISHED" | "FAILED";
export const PLANT_DISEASE_GROUPS = [
  "Truyền nhiễm",
  "Không truyền nhiễm",
] as const;
export type PlantDiseaseGroup = (typeof PLANT_DISEASE_GROUPS)[number];

export interface WeatherCondition {
  temperature: number;
  lightUvIndex: number;
  windSpeed: number;
  co2Level: number;
  humidity?: number;
  weatherCode?: number;
  soilPh?: string;
  soilEc?: string;
  soilDo?: string;
  soilHumidity?: string;
}

export interface CaptureLocation {
  latitude: number;
  longitude: number;
  accuracy?: number;
  timestamp?: string;
  isMocked?: boolean;
  name?: string;
  city?: string;
  region?: string;
  country?: string;
  formattedAddress?: string;
}

export interface CaptureSessionRecord {
  id: string;
  farmerId: string;
  farmerName: string;
  farmerEmail?: string;
  images: string[];
  plotId?: string;
  cropType: string;
  growthStage: GrowthStageId;
  envMode: EnvMode;
  captureLocation?: CaptureLocation;
  stationMeasurements: WeatherCondition;
  localMeasurements?: WeatherCondition;
  diseaseGroup?: PlantDiseaseGroup;
  diseaseType?: string;
  diseaseName?: string;
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
  stationMeasurements: WeatherCondition;
  localMeasurements?: WeatherCondition;
  diseaseGroup?: PlantDiseaseGroup;
  diseaseType?: string;
  diseaseName?: string;
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
