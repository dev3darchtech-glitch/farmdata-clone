import { COLORS } from "@/constants/theme";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

export function EmptyState({ title }: { title: string }) {
  return (
    <View style={emptyStateStyles.emptyState}>
      <Text style={emptyStateStyles.emptyTitle}>{title}</Text>
      <Text style={emptyStateStyles.helpText}>
        Kéo xuống để tải lại dữ liệu.
      </Text>
    </View>
  );
}

const emptyStateStyles = StyleSheet.create({
  emptyState: {
    minHeight: 240,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  emptyTitle: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: "700",
  },
  helpText: {
    color: COLORS.muted,
    fontSize: 12,
    lineHeight: 18,
  },
});
