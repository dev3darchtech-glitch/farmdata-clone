import { LAYOUT } from "@/constants/theme";
import { X } from "lucide-react-native";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Easing,
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

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

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

  const [rendered, setRendered] = useState(visible);
  const anim = useRef(new Animated.Value(0)).current;

  const updateSheetHeightRatio = useCallback((ratio: number | null) => {
    sheetHeightRatioRef.current = ratio;
    setSheetHeightRatio(ratio);
  }, []);

  const handleClose = useCallback(() => {
    Animated.timing(anim, {
      toValue: 0,
      duration: 200,
      easing: Easing.in(Easing.cubic),
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished) {
        setRendered(false);
        onClose();
      }
    });
  }, [anim, onClose]);

  useEffect(() => {
    if (visible) {
      setRendered(true);
      updateSheetHeightRatio(full ? FULL_SHEET_RATIO : null);
      Animated.timing(anim, {
        toValue: 1,
        duration: 250,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
    } else if (rendered) {
      Animated.timing(anim, {
        toValue: 0,
        duration: 200,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (finished) {
          setRendered(false);
        }
      });
    }
  }, [anim, full, rendered, updateSheetHeightRatio, visible]);

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
            handleClose();
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
    [handleClose, toggleSheetHeight, updateSheetHeightRatio, windowHeight],
  );

  const sheetSizeStyle = {
    maxHeight: windowHeight * FULL_SHEET_RATIO,
    ...(sheetHeightRatio ? { height: windowHeight * sheetHeightRatio } : {}),
  };

  const translateY = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [windowHeight, 0],
  });

  const scrimOpacity = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  if (!rendered) return null;

  return (
    <Modal
      visible={rendered}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={handleClose}
    >
      <View style={drawerStyles.scrim}>
        <AnimatedPressable
          style={[drawerStyles.scrimFill, { opacity: scrimOpacity }]}
          onPress={handleClose}
        />
        <Animated.View
          style={[
            drawerStyles.sheetWrap,
            { transform: [{ translateY }] },
          ]}
        >
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
              <Pressable style={drawerStyles.iconButton} onPress={handleClose}>
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
        </Animated.View>
      </View>
    </Modal>
  );
}

const drawerStyles = StyleSheet.create({
  scrim: {
    flex: 1,
    justifyContent: "flex-end",
  },
  scrimFill: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
  },
  sheetWrap: {
    width: "100%",
    justifyContent: "flex-end",
  },
  sheet: {
    width: "100%",
    alignSelf: "stretch",
    maxHeight: "76%",
    backgroundColor: "#fff",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderTopWidth: 1.5,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: "#d1d5db",
    paddingHorizontal: LAYOUT.sheetX,
    paddingBottom: LAYOUT.sheetBottom,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 25,
    shadowOffset: { width: 0, height: -8 },
    elevation: 24,
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
    height: 48,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  title: {
    color: DRAWER_COLORS.body,
    fontSize: 16,
    lineHeight: 20,
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
