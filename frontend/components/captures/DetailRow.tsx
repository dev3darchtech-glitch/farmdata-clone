import { COLORS } from "@/constants/theme";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

export function DetailRow({ label, value }: { label: string; value?: string }) {
  if (!value) return null;

  return (
    <View style={detailRowStyles.detailRow}>
      <Text style={detailRowStyles.detailLabel}>{label}</Text>
      <Text style={detailRowStyles.detailValue}>{value}</Text>
    </View>
  );
}

const detailRowStyles = StyleSheet.create({
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 16,
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  detailLabel: {
    flex: 1,
    color: COLORS.muted,
    fontSize: 13,
    lineHeight: 18,
  },
  detailValue: {
    flex: 1.4,
    color: COLORS.body,
    fontSize: 13,
    lineHeight: 18,
    textAlign: "right",
  },
});
