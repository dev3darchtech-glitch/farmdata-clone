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
 * Removes diacritics / special characters for clean photo filenames.
 */
function sanitizeForFilename(text: string): string {
  if (!text) return "Unspecified";
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .replace(/[^a-zA-Z0-9]/g, "");
}

/**
 * Generates photo file label name based on: `[Loại cây]_[Giai đoạn]_[Timestamp VN]_[Index].jpg`
 * Example: `CaChua_flowering_20260723_204809_1.jpg`
 */
export function generatePhotoLabelName(
  cropType: string,
  growthStage: string,
  index: number = 1,
  dateInput: Date | string | number = new Date(),
): string {
  const cleanCrop = sanitizeForFilename(cropType) || "Crop";
  const cleanStage = sanitizeForFilename(growthStage) || "Stage";
  const vnTimestamp = formatVietnamFileTimestamp(dateInput);

  return `${cleanCrop}_${cleanStage}_${vnTimestamp}_${index}.jpg`;
}
