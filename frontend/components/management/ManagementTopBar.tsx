import { COLORS } from "@/constants/theme";
import { Bell, Menu } from "lucide-react-native";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

export function ManagementTopBar({
  title,
  onMenu,
}: {
  title: string;
  onMenu: () => void;
}) {
  return (
    <View style={topBarStyles.container}>
      <View style={topBarStyles.left}>
        <Pressable style={topBarStyles.iconButton} onPress={onMenu}>
          <Menu size={24} color={COLORS.text} />
        </Pressable>
        <Text style={topBarStyles.title}>{title}</Text>
      </View>
      <View style={topBarStyles.actions}>
        <Pressable style={topBarStyles.iconButton}>
          <Bell size={24} color={COLORS.text} />
          <View style={topBarStyles.bellDot} />
        </Pressable>
      </View>
    </View>
  );
}

const topBarStyles = StyleSheet.create({
  container: {
    height: 70,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  left: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  iconButton: {
    width: 34,
    height: 34,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    color: COLORS.text,
    fontSize: 20,
    fontWeight: "700",
  },
  bellDot: {
    position: "absolute",
    top: 5,
    right: 6,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#ef4444",
  },
});
