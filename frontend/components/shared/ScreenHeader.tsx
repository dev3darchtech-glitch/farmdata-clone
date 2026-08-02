import { COLORS } from "@/constants/theme";
import { Menu } from "lucide-react-native";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

export function ScreenHeader({
  title = "FarmData",
  onMenu,
}: {
  title?: string;
  onMenu?: () => void;
}) {
  return (
    <View style={screenHeaderStyles.header}>
      <View style={screenHeaderStyles.headerLeft}>
        <Pressable
          accessibilityRole="button"
          style={screenHeaderStyles.iconButton}
          onPress={onMenu}
        >
          <Menu size={24} color={COLORS.text} />
        </Pressable>
        <Text style={screenHeaderStyles.headerTitle}>{title}</Text>
      </View>
      {/* <View style={screenHeaderStyles.headerRight}>
        <Pressable
          accessibilityRole="button"
          style={screenHeaderStyles.iconButton}
        >
          <Bell size={23} color={COLORS.text} />
        </Pressable>
      </View> */}
    </View>
  );
}

const screenHeaderStyles = StyleSheet.create({
  header: {
    height: 48,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 0,
    backgroundColor: "#fff",
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  headerTitle: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: "700",
  },
  iconButton: {
    width: 34,
    height: 34,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
  },
});
