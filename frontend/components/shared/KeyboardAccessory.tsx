import { COLORS } from "@/constants/theme";
import React from "react";
import {
  InputAccessoryView,
  Keyboard,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

export const IOS_KEYBOARD_ACCESSORY_ID = "appKeyboardAccessory";

export function KeyboardAccessory() {
  if (Platform.OS !== "ios") {
    return null;
  }

  return (
    <InputAccessoryView nativeID={IOS_KEYBOARD_ACCESSORY_ID}>
      <View style={styles.bar}>
        <Pressable onPress={Keyboard.dismiss} style={styles.button}>
          <Text style={styles.buttonText}>Hoàn thành</Text>
        </Pressable>
      </View>
    </InputAccessoryView>
  );
}

const styles = StyleSheet.create({
  bar: {
    height: 44,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
    backgroundColor: "#f8fafc",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
  },
  button: {
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  buttonText: {
    color: COLORS.green,
    fontSize: 15,
    fontWeight: "600",
  },
});
