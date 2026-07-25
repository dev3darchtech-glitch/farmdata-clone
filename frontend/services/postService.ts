import {
  CaptureSession,
  CaptureSessionValidationResult,
  Post,
  UserRole,
} from "@/types";
import { fetchPostFeed, submitCaptureSession } from "./apiClient";

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
      local.temperature > 40
    ) {
      errors.localTemperature = "Nhiệt độ tại nơi phải từ 0°C đến 40°C";
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
    session.severity !== "Khỏe mạnh" &&
    (!session.symptomDescription || session.symptomDescription.trim() === "")
  ) {
    errors.symptomDescription = "Vui lòng nhập mô tả triệu chứng";
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * Submits capture session directly to backend API.
 */
export async function completeCaptureSessionAndAutoPost(
  sessionData: Omit<CaptureSession, "id" | "status" | "createdAt">,
  onProgress?: (stepMessage: string, current: number, total: number) => void,
): Promise<{ session: CaptureSession; post: Post }> {
  // 1. Validate data
  const validation = validateCaptureSession(sessionData);
  if (!validation.isValid) {
    const firstError = Object.values(validation.errors)[0];
    throw new Error(firstError || "Thông tin phiên chụp chưa đầy đủ");
  }

  // 2. Direct backend API execution
  return await submitCaptureSession(sessionData, onProgress);
}

/**
 * Fetch list of posts directly from backend API with query parameters.
 */
export async function getPosts(
  role: UserRole = "farmer",
  farmerId?: string,
  cropFilter?: string,
  searchQuery?: string,
): Promise<Post[]> {
  return await fetchPostFeed(role, cropFilter, searchQuery);
}

/**
 * Retrieve single post details by ID directly from backend API.
 */
export async function getPostById(postId: string): Promise<Post | null> {
  const posts = await getPosts("admin");
  return posts.find((p) => p.id === postId || (p as any)._id === postId) || null;
}
