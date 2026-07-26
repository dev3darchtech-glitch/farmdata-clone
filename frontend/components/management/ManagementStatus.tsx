import { COLORS } from "@/constants/theme";
import { isManagementItemActive } from "@/utils/management";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

export function ManagementStatus({ item }: { item: any }) {
  const active = isManagementItemActive(item);
  return (
    <View style={statusStyles.group}>
      <View
        style={[
          statusStyles.dot,
          { backgroundColor: active ? "#2ecc71" : "#e74c3c" },
        ]}
      />
      <Text style={statusStyles.text}>
        {active ? "Đang hoạt động" : "Ngừng hoạt động"}
      </Text>
    </View>
  );
}

const statusStyles = StyleSheet.create({
  group: {
    width: 122,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  text: {
    color: COLORS.body,
    fontSize: 14,
    lineHeight: 20,
  },
});
