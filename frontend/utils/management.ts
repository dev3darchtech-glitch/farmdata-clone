import { PlotInfo, User } from "@/types";
import { type ManagementVariant } from "@/types/ui";

export const PLOT_ZONE_OPTIONS = ["Khu A", "Khu B", "Khu C", "Khu D"];

export function isManagementItemActive(item: any): boolean {
  const status = String(item?.status || item?.state || "").toLowerCase();
  return !(
    item?.isRevoked ||
    item?.revokedAt ||
    item?.isActive === false ||
    status === "inactive" ||
    status === "revoked" ||
    status === "disabled"
  );
}

export function isManagementItemInactive(item: any): boolean {
  return !isManagementItemActive(item);
}

export function formatPlotMeta(item: PlotInfo): string {
  const area = item.areaSquareMeters ? ` - ${item.areaSquareMeters} m²` : "";
  return `${item.name || item.code}${area}`;
}

export function getFarmerDisplayCode(item: User, index: number): string {
  return (
    (item as any).code ||
    (item as any).farmerCode ||
    `F-${String(index + 1).padStart(3, "0")}`
  );
}

export function getManagementItemLabel(
  item: any | null,
  variant: ManagementVariant,
): string {
  if (!item) return "";
  if (variant === "accounts") return item.username || item.name || "";
  return item.code || item.name || "";
}

export function getVisibleManagementPages(
  currentPage: number,
  totalPages: number,
): (number | "…")[] {
  if (totalPages <= 5) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }
  if (currentPage <= 3) {
    return [1, 2, 3, 4, "…", totalPages];
  }
  if (currentPage >= totalPages - 2) {
    return [1, "…", totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
  }
  return [
    1,
    "…",
    currentPage - 1,
    currentPage,
    currentPage + 1,
    "…",
    totalPages,
  ];
}
