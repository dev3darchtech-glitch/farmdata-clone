import { COLORS, LAYOUT } from "@/constants/theme";
import { CircleCheck } from "lucide-react-native";
import React from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
export function DiseaseOptionList({
  emptyText,
  onSelect,
  options,
  selectedValue,
}: {
  emptyText: string;
  onSelect: (value: string) => void;
  options: {
    key: string;
    label: string;
    value: string;
    description?: string;
  }[];
  selectedValue?: string;
}) {
  return (
    <ScrollView
      contentContainerStyle={selectionSheetStyles.diseaseListContent}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      {options.length > 0 ? (
        options.map((option) => {
          const selected = selectedValue === option.value;
          return (
            <Pressable
              key={option.key}
              style={[
                selectionSheetStyles.diseaseOption,
                selected && selectionSheetStyles.diseaseOptionSelected,
              ]}
              onPress={() => onSelect(option.value)}
            >
              <View style={selectionSheetStyles.diseaseOptionBody}>
                <Text
                  style={[
                    selectionSheetStyles.diseaseOptionText,
                    selected && selectionSheetStyles.diseaseOptionTextSelected,
                  ]}
                >
                  {option.label}
                </Text>
                {option.description ? (
                  <Text style={selectionSheetStyles.diseaseOptionMeta}>
                    {option.description}
                  </Text>
                ) : null}
              </View>
              {selected ? <CircleCheck size={20} color={COLORS.green} /> : null}
            </Pressable>
          );
        })
      ) : (
        <View style={selectionSheetStyles.diseaseEmpty}>
          <Text style={selectionSheetStyles.diseaseEmptyText}>{emptyText}</Text>
        </View>
      )}
    </ScrollView>
  );
}

const selectionSheetStyles = StyleSheet.create({
  diseaseListContent: {
    paddingBottom: LAYOUT.sheetBottom,
    gap: 6,
  },
  diseaseOption: {
    minHeight: 38,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 12,
    paddingVertical: 6,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#fff",
  },
  diseaseOptionSelected: {
    borderColor: COLORS.green,
    backgroundColor: "#f0f8ed",
  },
  diseaseOptionBody: {
    flex: 1,
    minWidth: 0,
  },
  diseaseOptionText: {
    color: COLORS.body,
    fontSize: 13,
    fontWeight: "600",
    lineHeight: 17,
  },
  diseaseOptionTextSelected: {
    color: COLORS.green,
  },
  diseaseOptionMeta: {
    color: COLORS.muted,
    fontSize: 11,
    lineHeight: 15,
    marginTop: 1,
  },
  diseaseEmpty: {
    minHeight: 60,
    alignItems: "center",
    justifyContent: "center",
  },
  diseaseEmptyText: {
    color: COLORS.muted,
    fontSize: 12,
    lineHeight: 16,
  },
});
