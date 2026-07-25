import { GrowthStageId, GrowthStageInfo } from "@/types";

/**
 * Standard 5 agricultural growth stages.
 */
export const GROWTH_STAGES: GrowthStageInfo[] = [
  {
    id: "newly_planted",
    nameVi: "Mới trồng",
    nameEn: "Newly planted",
    description: "Cây mới gieo trồng hoặc vừa cấy",
  },
  {
    id: "vegetative",
    nameVi: "Sinh trưởng",
    nameEn: "Vegetative/Leaf development",
    description: "Tăng trưởng thân, cành và phát triển lá",
  },
  {
    id: "flowering",
    nameVi: "Ra hoa",
    nameEn: "Flowering",
    description: "Cây xuất hiện nụ hoa và đang nở hoa",
  },
  {
    id: "fruiting",
    nameVi: "Kết trái",
    nameEn: "Fruiting",
    description: "Hoa đậu quả và phát triển kích thước quả",
  },
  {
    id: "harvest",
    nameVi: "Thu hoạch",
    nameEn: "Harvest",
    description: "Quả chín, đạt độ trưởng thành thu hoạch",
  },
];

export const VALID_GROWTH_STAGE_IDS: GrowthStageId[] = [
  "newly_planted",
  "vegetative",
  "flowering",
  "fruiting",
  "harvest",
];

/**
 * Validates if a stageId string corresponds to a valid GrowthStageId.
 */
export function isValidGrowthStage(
  stageId: string | null | undefined,
): boolean {
  if (!stageId) return false;
  return VALID_GROWTH_STAGE_IDS.includes(stageId as GrowthStageId);
}

/**
 * Retrieves GrowthStageInfo object by stage ID.
 */
export function getGrowthStageById(
  stageId: string | null | undefined,
): GrowthStageInfo | undefined {
  if (!stageId) return undefined;
  return GROWTH_STAGES.find((stage) => stage.id === stageId);
}

/**
 * Validates Plot/Row Identifier: non-empty, min 2 chars, alphanumeric (hyphens and underscores allowed).
 */
export function validatePlotId(plotId: string | null | undefined): {
  isValid: boolean;
  error?: string;
} {
  if (!plotId || !plotId.trim()) {
    return { isValid: false, error: "Mã số luống không được để trống" };
  }
  const trimmed = plotId.trim();
  if (trimmed.length < 2) {
    return { isValid: false, error: "Mã số luống phải có ít nhất 2 ký tự" };
  }
  const regex = /^[a-zA-Z0-9_-]+$/;
  if (!regex.test(trimmed)) {
    return {
      isValid: false,
      error: "Mã số luống chỉ bao gồm chữ cái, chữ số, dấu - hoặc _",
    };
  }
  return { isValid: true };
}
