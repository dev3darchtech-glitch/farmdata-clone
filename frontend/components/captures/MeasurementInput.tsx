import { COLORS } from "@/constants/theme";
import { triggerHaptic } from "@/utils/platformHelper";
import React from "react";
import { Platform, StyleSheet } from "react-native";
import { InputText } from "../shared/InputText";
export function MeasurementInput({
  label,
  value,
  placeholder,
  onChangeText,
  full,
}: {
  label: string;
  value: string;
  placeholder?: string;
  onChangeText: (value: string) => void;
  full?: boolean;
}) {
  const handleChangeText = (val: string) => {
    onChangeText(val);
    if (Platform.OS === "android") {
      triggerHaptic("light");
    }
  };

  return (
    <InputText
      containerStyle={[
        selectionSheetStyles.measurementInputStack,
        full && selectionSheetStyles.measurementInputStackFull,
      ]}
      keyboardType="numeric"
      label={label}
      labelStyle={selectionSheetStyles.measurementInputLabel}
      value={value}
      placeholder={placeholder}
      placeholderTextColor="#94a3b8"
      onChangeText={handleChangeText}
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
