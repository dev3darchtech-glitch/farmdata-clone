import { COLORS } from "@/constants/theme";
import { ChevronDown } from "lucide-react-native";
import React from "react";
import {
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from "react-native";
import { FieldLabel } from "./FieldLabel";

export function InputSelection({
  label,
  value,
  placeholder,
  required,
  error,
  containerStyle,
  fieldStyle,
  disabled,
  onPress,
  icon,
  testID,
}: {
  containerStyle?: StyleProp<ViewStyle>;
  fieldStyle?: StyleProp<ViewStyle>;
  disabled?: boolean;
  label: string;
  value?: string;
  placeholder: string;
  required?: boolean;
  error?: string;
  onPress: () => void;
  icon?: React.ReactNode;
  testID?: string;
}) {
  return (
    <View style={[inputSelectionStyles.fieldStack, containerStyle]}>
      <FieldLabel required={required}>{label}</FieldLabel>
      <Pressable
        disabled={disabled}
        testID={testID}
        style={[
          inputSelectionStyles.selectField,
          disabled && inputSelectionStyles.disabledField,
          fieldStyle,
          error && inputSelectionStyles.invalidField,
        ]}
        onPress={onPress}
      >
        <View style={inputSelectionStyles.valueRow}>
          {value && icon ? icon : null}
          <Text
            style={[
              inputSelectionStyles.selectText,
              !value && inputSelectionStyles.placeholderText,
            ]}
          >
            {value || placeholder}
          </Text>
        </View>
        <ChevronDown size={20} color={disabled ? COLORS.muted : COLORS.body} />
      </Pressable>
      {error ? (
        <Text style={inputSelectionStyles.fieldErrorText}>{error}</Text>
      ) : null}
    </View>
  );
}

const inputSelectionStyles = StyleSheet.create({
  fieldStack: {
    gap: 10,
  },
  selectField: {
    height: 42,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#fff",
  },
  invalidField: {
    borderColor: COLORS.danger,
  },
  disabledField: {
    backgroundColor: "#f9fafb",
    opacity: 0.65,
  },
  valueRow: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: 8,
  },
  selectText: {
    flex: 1,
    color: COLORS.body,
    fontSize: 13,
  },
  placeholderText: {
    color: COLORS.muted,
  },
  fieldErrorText: {
    color: COLORS.danger,
    fontSize: 11,
    lineHeight: 15,
  },
});
