import { X } from "lucide-react-native";
import { LAYOUT } from "@/constants/theme";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  KeyboardAvoidingView,
  Modal,
  PanResponder,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
  type ViewStyle,
} from "react-native";

const DRAWER_COLORS = {
  text: "#111827",
  body: "#565656",
  border: "#e0e0e0",
};

const MIN_SHEET_RATIO = 0.36;
const DEFAULT_SHEET_RATIO = 0.76;
const FULL_SHEET_RATIO = 0.92;

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
  const { height: windowHeight } = useWindowDimensions();
  const measuredHeightRef = useRef(0);
  const dragStartHeightRef = useRef(0);
  const sheetHeightRatioRef = useRef<number | null>(
    full ? FULL_SHEET_RATIO : null,
  );
  const [sheetHeightRatio, setSheetHeightRatio] = useState<number | null>(
    full ? FULL_SHEET_RATIO : null,
  );

  const updateSheetHeightRatio = useCallback((ratio: number | null) => {
    sheetHeightRatioRef.current = ratio;
    setSheetHeightRatio(ratio);
  }, []);

  useEffect(() => {
    if (visible) {
      updateSheetHeightRatio(full ? FULL_SHEET_RATIO : null);
    }
  }, [full, updateSheetHeightRatio, visible]);

  const clampSheetRatio = (ratio: number) =>
    Math.min(FULL_SHEET_RATIO, Math.max(MIN_SHEET_RATIO, ratio));

  const snapSheetRatio = (ratio: number) => {
    if (ratio < 0.5) return MIN_SHEET_RATIO;
    if (ratio > 0.84) return FULL_SHEET_RATIO;
    return DEFAULT_SHEET_RATIO;
  };

  const toggleSheetHeight = useCallback(() => {
    const currentRatio = sheetHeightRatioRef.current;
    updateSheetHeightRatio(
      currentRatio && currentRatio > DEFAULT_SHEET_RATIO
        ? DEFAULT_SHEET_RATIO
        : FULL_SHEET_RATIO,
    );
  }, [updateSheetHeightRatio]);

  const handlePanResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: (_, gestureState) =>
          Math.abs(gestureState.dy) > 4,
        onPanResponderTerminationRequest: () => false,
        onPanResponderGrant: () => {
          dragStartHeightRef.current =
            (sheetHeightRatioRef.current ||
              measuredHeightRef.current / windowHeight) *
            windowHeight;
        },
        onPanResponderMove: (_, gestureState) => {
          const nextHeight = dragStartHeightRef.current - gestureState.dy;
          updateSheetHeightRatio(clampSheetRatio(nextHeight / windowHeight));
        },
        onPanResponderRelease: (_, gestureState) => {
          if (
            Math.abs(gestureState.dy) < 6 &&
            Math.abs(gestureState.dx) < 6
          ) {
            toggleSheetHeight();
            return;
          }

          const nextRatio = clampSheetRatio(
            (dragStartHeightRef.current - gestureState.dy) / windowHeight,
          );

          if (gestureState.dy > 140 && nextRatio <= MIN_SHEET_RATIO + 0.04) {
            onClose();
            return;
          }

          updateSheetHeightRatio(snapSheetRatio(nextRatio));
        },
        onPanResponderTerminate: (_, gestureState) => {
          const nextRatio = clampSheetRatio(
            (dragStartHeightRef.current - gestureState.dy) / windowHeight,
          );
          updateSheetHeightRatio(snapSheetRatio(nextRatio));
        },
      }),
    [onClose, toggleSheetHeight, updateSheetHeightRatio, windowHeight],
  );

  const sheetSizeStyle = {
    maxHeight: windowHeight * FULL_SHEET_RATIO,
    ...(sheetHeightRatio ? { height: windowHeight * sheetHeightRatio } : {}),
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={drawerStyles.scrim}>
        <Pressable style={drawerStyles.scrimFill} onPress={onClose} />
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={Platform.OS === "ios" ? 12 : 0}
          style={[drawerStyles.sheet, sheetSizeStyle, contentStyle]}
          onLayout={(event) => {
            measuredHeightRef.current = event.nativeEvent.layout.height;
          }}
        >
          {showHandle ? (
            <View
              accessibilityRole="adjustable"
              style={drawerStyles.handleWrap}
              {...handlePanResponder.panHandlers}
            >
              <View style={drawerStyles.handle} />
            </View>
          ) : null}
          <View style={drawerStyles.header}>
            <Text style={drawerStyles.title}>{title}</Text>
            <Pressable style={drawerStyles.iconButton} onPress={onClose}>
              <X size={22} color={DRAWER_COLORS.text} />
            </Pressable>
          </View>
          <View
            style={[
              drawerStyles.content,
              sheetHeightRatio ? drawerStyles.contentFlex : null,
            ]}
          >
            {children}
          </View>
        </KeyboardAvoidingView>
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
    paddingHorizontal: LAYOUT.sheetX,
    paddingBottom: LAYOUT.sheetBottom,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 40,
    shadowOffset: { width: 0, height: -8 },
  },
  handleWrap: {
    height: 36,
    alignItems: "center",
    justifyContent: "center",
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
  content: {
    flexShrink: 1,
  },
  contentFlex: {
    flex: 1,
  },
});
