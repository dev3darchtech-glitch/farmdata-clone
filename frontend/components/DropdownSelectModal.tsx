import { GardenPalette } from "@/constants/theme";
import { AlertTriangle } from "lucide-react-native";
import React from "react";
import { Pressable, Text, View } from "react-native";

export function DropdownSelectModal({ label, placeholder, options = [], onSelect, error }: { label: string; placeholder?: string; options?: { id: string; label: string }[]; onSelect?: (option: { id: string; label: string }) => void; error?: string }) {
  return (
    <View testID="dropdown-select-modal">
      <Text>{label}</Text>
      <Text>{placeholder}</Text>
      {options.map((option) => (
        <Pressable key={option.id} onPress={() => onSelect?.(option)}>
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
