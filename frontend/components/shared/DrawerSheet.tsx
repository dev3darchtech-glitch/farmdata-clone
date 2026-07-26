import { X } from "lucide-react-native";
import React from "react";
import {
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TouchableWithoutFeedback,
  View,
  type ViewStyle,
} from "react-native";

const DRAWER_COLORS = {
  text: "#111827",
  body: "#565656",
  border: "#e0e0e0",
};

type DrawerSheetProps = {
  visible: boolean;
  title: string;
  children: React.ReactNode;
  onClose: () => void;
  full?: boolean;
  contentStyle?: ViewStyle;
  showHandle?: boolean;
};

export function DrawerSheet({
  visible,
  title,
  children,
  onClose,
  full,
  contentStyle,
  showHandle = true,
}: DrawerSheetProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={drawerStyles.scrim}>
        <Pressable style={drawerStyles.scrimFill} onPress={onClose} />
        <TouchableWithoutFeedback accessible={false} onPress={Keyboard.dismiss}>
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : undefined}
            style={[
              drawerStyles.sheet,
              full && drawerStyles.fullSheet,
              contentStyle,
            ]}
          >
            {showHandle ? (
              <View style={drawerStyles.handleWrap}>
                <View style={drawerStyles.handle} />
              </View>
            ) : null}
            <View style={drawerStyles.header}>
              <Text style={drawerStyles.title}>{title}</Text>
              <Pressable style={drawerStyles.iconButton} onPress={onClose}>
                <X size={22} color={DRAWER_COLORS.text} />
              </Pressable>
            </View>
            {children}
          </KeyboardAvoidingView>
        </TouchableWithoutFeedback>
      </View>
    </Modal>
  );
}

const drawerStyles = StyleSheet.create({
  scrim: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "transparent",
  },
  scrimFill: {
    flex: 1,
  },
  sheet: {
    maxHeight: "76%",
    backgroundColor: "#fff",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 24,
    paddingBottom: 28,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 40,
    shadowOffset: { width: 0, height: -8 },
  },
  fullSheet: {
    maxHeight: "92%",
    minHeight: "82%",
  },
  handleWrap: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 16,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 999,
    backgroundColor: DRAWER_COLORS.border,
  },
  header: {
    height: 64,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  title: {
    color: DRAWER_COLORS.body,
    fontSize: 20,
    lineHeight: 24,
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
