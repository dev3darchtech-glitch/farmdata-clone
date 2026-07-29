import { COLORS } from "@/constants/theme";
import { triggerHaptic } from "@/utils/platformHelper";
import React from "react";
import { Platform, StyleSheet } from "react-native";
import { InputText } from "../shared/InputText";

/** Normalize a raw number string:
 *  - replace comma separators with dots  ("5,5" → "5.5")
 *  - allow only digits, one leading minus, one dot
 */
function sanitizeNumericInput(raw: string): string {
  // Replace comma → dot
  let v = raw.replace(/,/g, ".");
  // Strip any character that isn't digit, dot, or leading minus
  v = v.replace(/[^0-9.\-]/g, "");
  // Allow only one dot
  const parts = v.split(".");
  if (parts.length > 2) {
    v = parts[0] + "." + parts.slice(1).join("");
  }
  return v;
}

/** On blur: if the value is a plain integer string, append ".0" */
function normalizeOnBlur(val: string): string {
  const trimmed = val.trim();
  if (trimmed === "" || trimmed === "-") return trimmed;
  // If it already has a dot, leave it
  if (trimmed.includes(".")) return trimmed;
  const num = Number(trimmed);
  if (!Number.isNaN(num)) return trimmed + ".0";
  return trimmed;
}

export function MeasurementInput({
  label,
  value,
  placeholder,
  onChangeText,
  onBlur,
  full,
}: {
  label: string;
  value: string;
  placeholder?: string;
  onChangeText: (value: string) => void;
  onBlur?: (normalizedValue: string) => void;
  full?: boolean;
}) {
  const handleChangeText = (val: string) => {
    const sanitized = sanitizeNumericInput(val);
    onChangeText(sanitized);
    if (Platform.OS === "android") {
      triggerHaptic("light");
    }
  };

  const handleBlur = () => {
    const normalized = normalizeOnBlur(value);
    if (normalized !== value) {
      onChangeText(normalized);
    }
    onBlur?.(normalized);
  };

  return (
    <InputText
      containerStyle={[
        selectionSheetStyles.measurementInputStack,
        full && selectionSheetStyles.measurementInputStackFull,
      ]}
      keyboardType="decimal-pad"
      label={label}
      labelStyle={selectionSheetStyles.measurementInputLabel}
      value={value}
      placeholder={placeholder}
      placeholderTextColor="#94a3b8"
      onChangeText={handleChangeText}
      onBlur={handleBlur}
      style={selectionSheetStyles.measurementInput}
      variant="plain"
    />
  );
}

const selectionSheetStyles = StyleSheet.create({
  measurementInputStack: {
    flexBasis: "47%",
    flexGrow: 1,
    maxWidth: "48%",
    gap: 4,
  },
  measurementInputStackFull: {
    width: "100%",
  },
  measurementInputLabel: {
    color: COLORS.body,
    fontSize: 12,
    lineHeight: 16,
  },
  measurementInput: {
    height: 38,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 12,
    color: COLORS.muted,
    backgroundColor: "#fff",
    fontSize: 13,
  },
});
