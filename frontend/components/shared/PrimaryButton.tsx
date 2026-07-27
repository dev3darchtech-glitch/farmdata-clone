import { COLORS } from "@/constants/theme";
import React from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text } from "react-native";

export function PrimaryButton({
  label,
  onPress,
  disabled,
  inactive,
  loading,
  variant = "filled",
  testID,
  style,
}: {
  label: string;
  onPress?: () => void;
  disabled?: boolean;
  inactive?: boolean;
  loading?: boolean;
  variant?: "filled" | "outline";
  testID?: string;
  style?: any;
}) {
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      disabled={disabled || loading}
      onPress={onPress}
      style={[
        primaryButtonStyles.primaryButton,
        variant === "outline" && primaryButtonStyles.outlineButton,
        (disabled || inactive) && primaryButtonStyles.disabledButton,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === "outline" ? COLORS.green : "#fff"}
          size="small"
        />
      ) : null}
      <Text
        style={[
          primaryButtonStyles.primaryButtonText,
          variant === "outline" && primaryButtonStyles.outlineButtonText,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const primaryButtonStyles = StyleSheet.create({
  primaryButton: {
    minHeight: 36,
    borderRadius: 8,
    backgroundColor: COLORS.green,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12,
    flexDirection: "row",
    gap: 6,
  },
  outlineButton: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: COLORS.green,
  },
  disabledButton: {
    opacity: 0.6,
    backgroundColor: COLORS.border,
    borderColor: COLORS.border,
  },
  primaryButtonText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  outlineButtonText: {
    color: COLORS.green,
  },
});
