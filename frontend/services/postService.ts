import {
  CaptureSession,
  CaptureSessionValidationResult,
  PaginatedListResult,
  Post,
  SYMPTOM_SEVERITY_VALUES,
  UserRole,
} from "@/types";
import {
  createManualPostAPI,
  deletePostAPI,
  fetchPostById,
  fetchPostFeed,
  submitCaptureSession,
  updateCaptureSessionAPI,
} from "./apiClient";

export async function deletePost(postId: string): Promise<void> {
  return await deletePostAPI(postId);
}

/**
 * Validates whether a capture session has all mandatory fields filled
 * per requirements.
 */
export function validateCaptureSession(
  session: Partial<CaptureSession>,
): CaptureSessionValidationResult {
  const errors: Record<string, string> = {};

  if (!session.images || session.images.length === 0) {
    errors.images = "Cần ít nhất một ảnh cây trồng";
  }

  if (!session.cropType || session.cropType.trim() === "") {
    errors.cropType = "Vui lòng chọn hoặc nhập loại cây";
  }

  if (!session.growthStage) {
    errors.growthStage = "Vui lòng chọn giai đoạn sinh trưởng";
  }

  if (!session.envMode) {
    errors.envMode = "Vui lòng chọn môi trường (Ngoài trời hoặc Nhà kính)";
  }

  if (!session.localMeasurements) {
    errors.localMeasurements = "Vui lòng nhập số đo tại nơi";
  } else {
    const local = session.localMeasurements;
    if (
      typeof local.temperature !== "number" ||
      Number.isNaN(local.temperature) ||
      local.temperature < 0 ||
      local.temperature > 50
    ) {
      errors.localTemperature = "Nhiệt độ tại nơi phải từ 0°C đến 50°C";
    }
    if (
      typeof local.humidity !== "number" ||
      Number.isNaN(local.humidity) ||
      local.humidity < 0 ||
      local.humidity > 100
    ) {
      errors.localHumidity = "Vui lòng nhập độ ẩm tại nơi";
    }
  }

  if (!session.severity) {
    errors.severity = "Vui lòng chọn mức độ triệu chứng";
  } else if (
    !SYMPTOM_SEVERITY_VALUES.some((value) => value === session.severity)
  ) {
    errors.severity = "Mức độ triệu chứng không hợp lệ";
  } else if (
    !session.symptomDescription ||
    session.symptomDescription.trim() === ""
  ) {
    errors.symptomDescription = "Vui lòng nhập mô tả triệu chứng";
  }

  if (!session.diseaseGroup) {
    errors.diseaseGroup = "Vui lòng chọn nhóm bệnh cây";
  }

  if (!session.diseaseType || session.diseaseType.trim() === "") {
    errors.diseaseType = "Vui lòng chọn loại bệnh cây";
  }

  if (!session.diseaseName || session.diseaseName.trim() === "") {
    errors.diseaseName = "Vui lòng chọn tên bệnh cây";
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * Submits capture session directly to backend API.
 */
export async function completeCaptureSession(
  sessionData: Omit<CaptureSession, "id" | "status" | "createdAt">,
  onProgress?: (stepMessage: string, current: number, total: number) => void,
): Promise<{ session: CaptureSession }> {
  // 1. Validate data
  const validation = validateCaptureSession(sessionData);
  if (!validation.isValid) {
    const firstError = Object.values(validation.errors)[0];
    throw new Error(firstError || "Thông tin phiên chụp chưa đầy đủ");
  }

  // 2. Direct backend API execution
  return await submitCaptureSession(sessionData, onProgress);
}

export async function editCaptureSession(
  sessionId: string,
  sessionData: Omit<CaptureSession, "id" | "status" | "createdAt">,
  onProgress?: (stepMessage: string, current: number, total: number) => void,
): Promise<{ session: CaptureSession }> {
  const validation = validateCaptureSession(sessionData);
  if (!validation.isValid) {
    const firstError = Object.values(validation.errors)[0];
    throw new Error(firstError || "Thông tin phiên chụp chưa đầy đủ");
  }

  return await updateCaptureSessionAPI(sessionId, sessionData, onProgress);
}

/**
 * Fetch list of posts directly from backend API with query parameters.
 */
export async function getPosts(
  role: UserRole = "farmer",
  farmerId?: string,
  filters: {
    page?: number;
    crop?: string;
    env?: string;
    plot?: string;
    q?: string;
    severity?: string;
    sort?: string;
    datePreset?: string;
    startDate?: string;
    endDate?: string;
    mine?: boolean;
    limit?: number;
    offset?: number;
  } = {},
): Promise<PaginatedListResult<Post>> {
  return await fetchPostFeed(role, filters);
}

/**
 * Retrieve single post details by ID directly from backend API.
 */
export async function getPostById(postId: string): Promise<Post | null> {
  return await fetchPostById(postId);
}

export async function createManualPost(postData: {
  cropType: string;
  growthStage: CaptureSession["growthStage"];
  images?: string[];
  plotId: string;
  diseaseGroup?: CaptureSession["diseaseGroup"];
  diseaseType?: string;
  diseaseName?: string;
  severity: CaptureSession["severity"];
  symptomDescription: string;
  weatherCode: number;
}): Promise<Post> {
  return await createManualPostAPI(postData);
}
