import { COLORS } from "@/constants/theme";
import React from "react";
import { StyleSheet, Text } from "react-native";

export function FieldLabel({
  children,
  required,
}: {
  children: React.ReactNode;
  required?: boolean;
}) {
  return (
    <Text style={fieldLabelStyles.label}>
      {children}
      {required ? <Text style={fieldLabelStyles.required}> *</Text> : null}
    </Text>
  );
}

const fieldLabelStyles = StyleSheet.create({
  label: {
    color: COLORS.body,
    fontSize: 16,
    fontWeight: "500",
    lineHeight: 20,
  },
  required: {
    color: COLORS.danger,
  },
});
