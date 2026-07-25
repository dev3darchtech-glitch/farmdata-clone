/**
 * Authentication tokens interface matching OAuth 2.0 specs.
 */
export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number; // Token lifetime in seconds (e.g. 3600)
  issuedAt: number; // Epoch timestamp in milliseconds
  idToken?: string;
  tokenType?: string;
}

/**
 * User metadata retrieved from Google UserInfo endpoint.
 */
export interface User {
  id: string;
  email: string;
  username?: string;
  name: string;
  photo?: string;
  picture?: string;
  role?: UserRole | string;
}


/**
 * Global authentication state contract.
 */
export interface AuthState {
  user: User | null;
  tokens: AuthTokens | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
}

/**
 * Geolocation capture metadata interface.
 */
export interface LocationData {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: string;
  isMocked?: boolean;
  name?: string;
  city?: string;
  region?: string;
  country?: string;
  formattedAddress?: string;
}

/**
 * Standard 5 Growth Stage IDs.
 */
export type GrowthStageId =
  | "newly_planted"
  | "vegetative"
  | "flowering"
  | "fruiting"
  | "harvest";

/**
 * Growth Stage Info metadata interface.
 */
export interface GrowthStageInfo {
  id: GrowthStageId;
  nameVi: string;
  nameEn: string;
  description: string;
}

/**
 * Complete Capture Record data structure for M2.
 */
export interface CaptureRecord {
  id: string;
  plotId: string;
  imageUri: string;
  location: LocationData;
  timestamp: string;
  growthStage: GrowthStageId;
  environmentalData?: EnvironmentalData;
}

/**
 * Environmental mode choice: Outdoor vs. Greenhouse.
 */
export type EnvMode = "outdoor" | "greenhouse";

/**
 * Environmental weather metrics for a specific point in time (T0, T-24, or T-48).
 */
export interface WeatherCondition {
  temperature: number; // °C (-10 .. 60)
  lightUvIndex: number; // UV / Lux (0 .. 100,000)
  windSpeed: number; // km/h (0 .. 150)
  co2Level: number; // ppm (200 .. 5000)
  humidity?: number; // % relative humidity (0 .. 100)
  weatherCode?: number; // Open-Meteo weather code
  soilPh?: string;
  soilEc?: string;
  soilDo?: string;
  soilHumidity?: string;
}

/**
 * Complete Environmental Data payload for M3.
 */
export interface EnvironmentalData {
  mode: EnvMode;
  current: WeatherCondition; // T0
  t24: WeatherCondition; // T-24 (24 hours prior)
  t48: WeatherCondition; // T-48 (48 hours prior)
  latitude?: number;
  longitude?: number;
  isOverridden?: boolean; // True if outdoor auto-fetched data was manually overridden
  isFallback?: boolean; // True if outdoor fetch failed and used mock data
  timestamp?: string; // ISO timestamp of reading
}

/**
 * Validation result contract for environmental data checking.
 */
export interface EnvironmentalValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

/**
 * Disease symptom severity classification.
 * - 'Khỏe mạnh': no visible disease symptom
 * - 'Chớm bệnh': <= 10%
 * - 'Nhẹ': <= 25% (and > 10%)
 * - 'Vừa': <= 50% (and > 25%)
 * - 'Rất nặng': > 50% (including >= 75%)
 */
export type SymptomSeverity =
  | "Khỏe mạnh"
  | "Chớm bệnh"
  | "Nhẹ"
  | "Vừa"
  | "Nặng"
  | "Rất nặng";

/**
 * Symptom assessment data structure for M4.
 */
export interface SymptomData {
  description: string;
  percentageArea: number; // 0 .. 100
  severity: SymptomSeverity;
}

/**
 * Storage destination choice for captured record.
 */
export type StorageDestination = "local" | "gdrive";

/**
 * Complete consolidated Data Record payload combining M1, M2, M3, and M4 data.
 */
export interface DataRecord {
  id: string;
  user: User;
  plotId: string;
  imageUri: string;
  location: LocationData;
  growthStage: GrowthStageId;
  environmentalData: EnvironmentalData;
  symptomData: SymptomData;
  storageDestination: StorageDestination;
  createdAt: string;
  driveFileId?: string;
  localFilePath?: string;
}

/**
 * Validation result contract for SymptomData checking.
 */
export interface SymptomValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

/**
 * Result structure returned by storage operations.
 */
export interface StorageSaveResult {
  success: boolean;
  destination: StorageDestination;
  filePath?: string;
  driveFileId?: string;
  isFallback?: boolean;
  error?: string;
  record?: DataRecord;
}

/**
 * State machine for Capture Session life cycle.
 */
export type CaptureSessionStatus =
  | "DRAFT"
  | "UPLOADING"
  | "COMPLETED"
  | "FAILED";

/**
 * State machine for automatically generated Post life cycle.
 */
export type PostStatus = "GENERATING" | "PUBLISHED" | "FAILED";

/**
 * User roles in the sitemap hierarchy.
 */
export type UserRole = "farmer" | "admin";

/**
 * Metadata for crop types managed by admin.
 */
export interface CropTypeInfo {
  id: string;
  name: string;
  category: string;
  icon?: string;
}

/**
 * Metadata for plot codes / land parcels managed by admin.
 */
export interface PlotInfo {
  id: string;
  code: string; // e.g. "LUONG-001" or "L-001"
  name: string;
  areaSquareMeters?: number;
  description?: string;
}

/**
 * Farmer Photo Capture Session payload representing 1 capture session.
 */
export interface CaptureSession {
  id: string;
  farmerId: string;
  farmerName: string;
  farmerEmail?: string;
  images: string[]; // At least 1 image URI
  plotId?: string; // Optional plot/bed code
  cropType: string; // e.g. "Cà chua" (Required)
  growthStage: GrowthStageId; // Required
  envMode: EnvMode; // 'outdoor' | 'greenhouse' (Required)
  captureLocation?: LocationData; // GPS position captured at photo time
  stationMeasurements: WeatherCondition; // Auto-fetched station data
  localMeasurements?: WeatherCondition; // On-site measurement (Optional)
  symptomDescription: string; // Required when severity is not "Khỏe mạnh"
  severity: SymptomSeverity; // Required
  status: CaptureSessionStatus;
  createdAt: string; // ISO timestamp
  updatedAt?: string;
  errorMessage?: string;
}

/**
 * Automatically generated Post structure generated from a CaptureSession.
 * Post refers directly to session data without duplicate unlinked fields.
 */
export interface Post {
  id: string;
  sessionId: string; // 1-to-1 relation with CaptureSession
  user: {
    id: string;
    name: string;
    email: string;
    avatar?: string;
    role: UserRole;
  };
  cropType: string;
  plotId?: string;
  growthStage: GrowthStageId;
  envMode: EnvMode;
  symptomDescription: string;
  severity: SymptomSeverity;
  images: string[]; // Photos belonging to the session
  stationMeasurements: WeatherCondition;
  localMeasurements?: WeatherCondition;
  status: PostStatus;
  createdAt: string;
}

/**
 * Validation result contract for CaptureSession creation.
 */
export interface CaptureSessionValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}
