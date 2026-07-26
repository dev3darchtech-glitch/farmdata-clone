import {
  tabDirectionForTarget,
  tabHrefWithDirection,
  tabItemsForRole,
  type TabRouteId,
} from "@/utils/captureDisplay";
import { router } from "expo-router";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

export function BottomNav({
  active,
  admin = false,
}: {
  active: TabRouteId;
  admin?: boolean;
}) {
  const items = tabItemsForRole(admin ? "admin" : "farmer");

  return (
    <View style={bottomNavStyles.bottomNav}>
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
            <Icon size={24} color={color} />
            <Text
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
    height: 64,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#f3f4f6",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 1,
    paddingHorizontal: 44.97,
  },
  navItem: {
    width: "auto",
    height: 48,
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  navLabel: {
    color: "#848484",
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "400",
  },
  navLabelActive: {
    color: "#4f7730",
  },
});
