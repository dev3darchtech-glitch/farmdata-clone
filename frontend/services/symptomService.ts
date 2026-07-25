import { SymptomData, SymptomSeverity, SymptomValidationResult } from "@/types";

/**
 * Classifies disease symptom severity based on leaf area affected percentage.
 * - <= 10%: 'Chớm bệnh'
 * - <= 25%: 'Nhẹ' (10.1% - 25%)
 * - <= 50%: 'Vừa' (25.1% - 50%)
 * - > 50%:  'Rất nặng' (50.1% - 100%)
 */
export function classifySymptomSeverity(percentage: number): SymptomSeverity {
  if (percentage <= 10) {
    return "Chớm bệnh";
  }
  if (percentage <= 25) {
    return "Nhẹ";
  }
  if (percentage <= 50) {
    return "Vừa";
  }
  return "Rất nặng";
}

/**
 * Validates affected percentage area (must be a number between 0 and 100 inclusive).
 */
export function validateSymptomPercentage(percentage: number): {
  isValid: boolean;
  error?: string;
} {
  if (typeof percentage !== "number" || Number.isNaN(percentage)) {
    return { isValid: false, error: "Tỷ lệ diện tích bị bệnh phải là một số" };
  }
  if (percentage < 0 || percentage > 100) {
    return {
      isValid: false,
      error: "Tỷ lệ diện tích bị bệnh phải từ 0% đến 100%",
    };
  }
  return { isValid: true };
}

/**
 * Validates symptom text description (must be non-empty string).
 */
export function validateSymptomDescription(description: string): {
  isValid: boolean;
  error?: string;
} {
  if (
    !description ||
    typeof description !== "string" ||
    description.trim().length === 0
  ) {
    return {
      isValid: false,
      error: "Mô tả triệu chứng bệnh không được để trống",
    };
  }
  return { isValid: true };
}

/**
 * Validates complete SymptomData payload.
 */
export function validateSymptomData(
  data: Partial<SymptomData>,
): SymptomValidationResult {
  const errors: Record<string, string> = {};

  const descValidation = validateSymptomDescription(data?.description ?? "");
  if (!descValidation.isValid && descValidation.error) {
    errors.description = descValidation.error;
  }

  const pctValidation = validateSymptomPercentage(data?.percentageArea ?? NaN);
  if (!pctValidation.isValid && pctValidation.error) {
    errors.percentageArea = pctValidation.error;
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}
