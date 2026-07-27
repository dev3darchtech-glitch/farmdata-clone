import {
  tabDirectionForTarget,
  tabHrefWithDirection,
  tabItemsForRole,
  type TabRouteId,
} from "@/utils/captureDisplay";
import { router } from "expo-router";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export function BottomNav({
  active,
  admin = false,
}: {
  active: TabRouteId;
  admin?: boolean;
}) {
  const insets = useSafeAreaInsets();
  const items = tabItemsForRole(admin ? "admin" : "farmer");

  return (
    <View
      style={[
        bottomNavStyles.bottomNav,
        {
          paddingBottom: insets.bottom,
          height: 54 + insets.bottom,
        },
      ]}
    >
      {items.map((item) => {
        const Icon = item.icon;
        const selected = active === item.id;
        const color = selected ? "#4f7730" : "#848484";

        return (
          <Pressable
            key={item.id}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            style={bottomNavStyles.navItem}
            onPress={() => {
              const direction = tabDirectionForTarget(items, active, item.id);
              router.navigate(
                tabHrefWithDirection(item.route, direction) as any,
              );
            }}
          >
            <Icon size={19} color={color} />
            <Text
              numberOfLines={1}
              style={[
                bottomNavStyles.navLabel,
                selected && bottomNavStyles.navLabelActive,
              ]}
            >
              {item.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const bottomNavStyles = StyleSheet.create({
  bottomNav: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#f3f4f6",
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 4,
    paddingHorizontal: 8,
  },
  navItem: {
    flex: 1,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    gap: 3,
  },
  navLabel: {
    color: "#848484",
    fontSize: 11,
    lineHeight: 14,
    fontWeight: "500",
    textAlign: "center",
  },
  navLabelActive: {
    color: "#4f7730",
    fontWeight: "700",
  },
});
