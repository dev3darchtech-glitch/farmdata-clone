import { GardenPalette } from "@/constants/theme";
import { SymptomSeverity } from "@/types";
import { AlertTriangle } from "lucide-react-native";
import React from "react";
import { Pressable, Text, View } from "react-native";

export const SEVERITY_RADIO_OPTIONS: { value: SymptomSeverity; label: string; zodValue: SymptomSeverity; displayLabel: string }[] = [
  { value: "Chớm bệnh", label: "Chớm bệnh", zodValue: "Chớm bệnh", displayLabel: "Chớm bệnh" },
  { value: "Nhẹ", label: "Nhẹ", zodValue: "Nhẹ", displayLabel: "Nhẹ" },
  { value: "Vừa", label: "Vừa", zodValue: "Vừa", displayLabel: "Vừa" },
  { value: "Nặng", label: "Nặng", zodValue: "Nặng", displayLabel: "Nặng" },
  { value: "Rất nặng", label: "Rất nặng", zodValue: "Rất nặng", displayLabel: "Rất nặng" },
];

export function SeverityRadioGroup({ value, onSelect, error }: { value?: SymptomSeverity; onSelect?: (value: SymptomSeverity) => void; error?: string }) {
  return (
    <View testID="severity-radio-group">
      {SEVERITY_RADIO_OPTIONS.map((option) => (
        <Pressable 
          key={option.value} 
          onPress={() => onSelect?.(option.value)}
          accessibilityLabel={option.displayLabel}
        >
          <Text>{option.label}</Text>
        </Pressable>
      ))}
      {error ? (
        <View>
          <AlertTriangle color={GardenPalette.error} size={16} />
          <Text>{error}</Text>
        </View>
      ) : null}
    </View>
  );
}
