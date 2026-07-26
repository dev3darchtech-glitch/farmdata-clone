import { type TabTransitionDirection } from "@/utils/captureDisplay";
import { Stack, useGlobalSearchParams } from "expo-router";
import React from "react";
import { StyleSheet, View } from "react-native";

export default function TabsLayout() {
  const { tabDirection } = useGlobalSearchParams<{
    tabDirection?: TabTransitionDirection;
  }>();
  const stackAnimation =
    tabDirection === "backward" ? "slide_from_left" : "slide_from_right";

  return (
    <View style={styles.container}>
      <Stack
        screenOptions={{
          headerShown: false,
          animation: stackAnimation,
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
});
