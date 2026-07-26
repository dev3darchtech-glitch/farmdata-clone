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
  onPress,
  icon,
  testID,
}: {
  containerStyle?: StyleProp<ViewStyle>;
  fieldStyle?: StyleProp<ViewStyle>;
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
        testID={testID}
        style={[
          inputSelectionStyles.selectField,
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
        <ChevronDown size={20} color={COLORS.body} />
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
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 17,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#fff",
  },
  invalidField: {
    borderColor: COLORS.danger,
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
    fontSize: 16,
  },
  placeholderText: {
    color: COLORS.muted,
  },
  fieldErrorText: {
    color: COLORS.danger,
    fontSize: 14,
    lineHeight: 20,
  },
});
