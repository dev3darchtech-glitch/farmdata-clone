/**
 * Frontend Vietnam Date Formatting Utilities (UTC+7 / Asia/Ho_Chi_Minh)
 */

export function getVietnamDate(dateInput: Date | string | number = new Date()): Date {
  const d = new Date(dateInput);
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
  if (!dateInput) return "";
  try {
    const vnDate = getVietnamDate(dateInput);
    const day = String(vnDate.getDate()).padStart(2, "0");
    const month = String(vnDate.getMonth() + 1).padStart(2, "0");
    const year = vnDate.getFullYear();
    const hours = String(vnDate.getHours()).padStart(2, "0");
    const minutes = String(vnDate.getMinutes()).padStart(2, "0");
    const seconds = String(vnDate.getSeconds()).padStart(2, "0");

    return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
  } catch {
    return String(dateInput);
  }
}
