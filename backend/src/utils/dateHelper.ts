/**
 * Helper utilities for Vietnam Timezone (UTC+7 / Asia/Ho_Chi_Minh)
 * and Photo File Label Naming.
 */

/**
 * Returns Vietnam local Date object (UTC+7).
 */
export function getVietnamDate(
  dateInput: Date | string | number = new Date(),
): Date {
  const d = new Date(dateInput);
  // Add 7 hours offset to UTC time
  const utcMs = d.getTime() + d.getTimezoneOffset() * 60000;
  const vnOffsetMs = 7 * 60 * 60000;
  return new Date(utcMs + vnOffsetMs);
}

/**
 * Formats a UTC date into Vietnam standard display format: `DD/MM/YYYY HH:mm:ss`
 * Example: `23/07/2026 20:48:09`
 */
export function formatVietnamDateTime(
  dateInput: Date | string | number = new Date(),
): string {
  const vnDate = getVietnamDate(dateInput);
  const day = String(vnDate.getDate()).padStart(2, "0");
  const month = String(vnDate.getMonth() + 1).padStart(2, "0");
  const year = vnDate.getFullYear();
  const hours = String(vnDate.getHours()).padStart(2, "0");
  const minutes = String(vnDate.getMinutes()).padStart(2, "0");
  const seconds = String(vnDate.getSeconds()).padStart(2, "0");

  return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
}

/**
 * Formats a UTC date into Vietnam timestamp string for safe file naming: `YYYYMMDD_HHmmss`
 * Example: `20260723_204809`
 */
export function formatVietnamFileTimestamp(
  dateInput: Date | string | number = new Date(),
): string {
  const vnDate = getVietnamDate(dateInput);
  const day = String(vnDate.getDate()).padStart(2, "0");
  const month = String(vnDate.getMonth() + 1).padStart(2, "0");
  const year = vnDate.getFullYear();
  const hours = String(vnDate.getHours()).padStart(2, "0");
  const minutes = String(vnDate.getMinutes()).padStart(2, "0");
  const seconds = String(vnDate.getSeconds()).padStart(2, "0");

  return `${year}${month}${day}_${hours}${minutes}${seconds}`;
}

/**
 * Removes diacritics / special characters for clean photo filenames and folder names (Vietnamese).
 */
export function sanitizeVietnamese(text?: string, fallback: string = "Chua-Co-Thong-Tin"): string {
  if (!text || !text.trim()) return fallback;
  const clean = text
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .replace(/[^a-zA-Z0-9\s-]/g, "")
    .replace(/\s+/g, "-");
  return clean || fallback;
}

export function toVietnamesePlot(plotId?: string): string {
  if (!plotId || !plotId.trim()) return "Chua-Co-Luong";
  return sanitizeVietnamese(plotId.toUpperCase(), "Chua-Co-Luong");
}

export function toVietnameseCrop(cropType?: string): string {
  if (!cropType || !cropType.trim()) return "Loai-Cay";
  return sanitizeVietnamese(cropType, "Loai-Cay");
}

export function toVietnameseEnv(envMode?: string): string {
  if (!envMode || !envMode.trim()) return "Ngoai-Troi";
  const lower = envMode.trim().toLowerCase();
  if (lower.includes("greenhouse") || lower.includes("kinh")) return "Nha-Kinh";
  return "Ngoai-Troi";
}

const STAGE_VIETNAMESE_MAP: Record<string, string> = {
  newly_planted: "Moi-Trong",
  "mới trồng": "Moi-Trong",
  vegetative: "Sinh-Truong",
  "sinh trưởng": "Sinh-Truong",
  "sinh trưởng thân lá": "Sinh-Truong",
  flowering: "Ra-Hoa",
  "ra hoa": "Ra-Hoa",
  fruiting: "Ket-Trai",
  "kết trái": "Ket-Trai",
  harvest: "Thu-Hoach",
  harvesting: "Thu-Hoach",
  "thu hoạch": "Thu-Hoach",
};

export function toVietnameseStage(growthStage?: string): string {
  if (!growthStage || !growthStage.trim()) return "Giai-Doan";
  const key = growthStage.trim().toLowerCase();
  if (STAGE_VIETNAMESE_MAP[key]) return STAGE_VIETNAMESE_MAP[key];
  return sanitizeVietnamese(growthStage, "Giai-Doan");
}

export function toVietnameseDisease(diseaseName?: string): string {
  if (!diseaseName || !diseaseName.trim()) return "Khong-Benh";
  return sanitizeVietnamese(diseaseName, "Khong-Benh");
}

/**
 * Generates photo file label name based on rule: `Mã luống+Loại cây+Môi trường+Giai đoạn+Tên bệnh+Timestamp`
 * All components in Vietnamese (cleaned of accents/special characters for file system safety).
 * Example: `L-001+Ca-Chua+Nha-Kinh+Ra-Hoa+Suong-Mai+20260723_204809_1.jpg`
 */
export function generatePhotoLabelName(
  plotId?: string,
  cropType?: string,
  envMode?: string,
  growthStage?: string,
  diseaseName?: string,
  index: number = 1,
  dateInput: Date | string | number = new Date(),
): string {
  const plotPart = toVietnamesePlot(plotId);
  const cropPart = toVietnameseCrop(cropType);
  const envPart = toVietnameseEnv(envMode);
  const stagePart = toVietnameseStage(growthStage);
  const diseasePart = toVietnameseDisease(diseaseName);
  const vnTimestamp = formatVietnamFileTimestamp(dateInput);

  return `${plotPart}+${cropPart}+${envPart}+${stagePart}+${diseasePart}+${vnTimestamp}_${index}.jpg`;
}
