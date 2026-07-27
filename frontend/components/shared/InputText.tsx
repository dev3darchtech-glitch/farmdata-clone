import { COLORS } from "@/constants/theme";
import React from "react";
import {
  Platform,
  StyleProp,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  TextStyle,
  View,
  ViewStyle,
} from "react-native";
import { FieldLabel } from "./FieldLabel";
import { IOS_KEYBOARD_ACCESSORY_ID } from "./KeyboardAccessory";

type InputTextProps = TextInputProps & {
  containerStyle?: StyleProp<ViewStyle>;
  error?: string;
  label?: string;
  labelStyle?: StyleProp<TextStyle>;
  required?: boolean;
  variant?: "field" | "plain";
};

export function InputText({
  containerStyle,
  error,
  label,
  labelStyle,
  required,
  style,
  variant = "field",
  ...props
}: InputTextProps) {
  const isPlain = variant === "plain";

  return (
    <View style={[inputTextStyles.fieldStack, containerStyle]}>
      {label ? (
        labelStyle ? (
          <Text style={labelStyle}>
            {label}
            {required ? <Text style={inputTextStyles.required}> *</Text> : null}
          </Text>
        ) : (
          <FieldLabel required={required}>{label}</FieldLabel>
        )
      ) : null}
      <TextInput
        inputAccessoryViewID={
          Platform.OS === "ios"
            ? props.inputAccessoryViewID ?? IOS_KEYBOARD_ACCESSORY_ID
            : props.inputAccessoryViewID
        }
        placeholderTextColor={props.placeholderTextColor ?? COLORS.muted}
        style={[
          !isPlain && inputTextStyles.input,
          !isPlain && props.multiline && inputTextStyles.multilineInput,
          error && inputTextStyles.invalidField,
          style,
        ]}
        {...props}
      />
      {error ? <Text style={inputTextStyles.errorText}>{error}</Text> : null}
    </View>
  );
}

const inputTextStyles = StyleSheet.create({
  fieldStack: {
    gap: 10,
  },
  input: {
    height: 42,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 14,
    color: COLORS.body,
    backgroundColor: "#fff",
    fontSize: 13,
  },
  multilineInput: {
    height: undefined,
    minHeight: 80,
    paddingTop: 10,
    paddingBottom: 10,
    textAlignVertical: "top",
  },
  invalidField: {
    borderColor: COLORS.danger,
  },
  errorText: {
    color: COLORS.danger,
    fontSize: 11,
    lineHeight: 15,
  },
  required: {
    color: COLORS.danger,
  },
});
