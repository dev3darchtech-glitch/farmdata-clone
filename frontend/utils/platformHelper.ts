import { GardenPalette } from "@/constants/theme";
import * as Haptics from "expo-haptics";
import { KeyboardAvoidingViewProps, Platform, ViewStyle } from "react-native";

export const isIOS = Platform.OS === "ios";
export const isAndroid = Platform.OS === "android";
export const isWeb = Platform.OS === "web";

/**
 * Returns platform-optimized font family name
 */
export function getPlatformFont(
  type: "mono" | "serif" | "sans" = "sans",
): string {
  if (type === "mono") {
    return Platform.select({
      ios: "Courier",
      android: "monospace",
      web: "'Geist Mono', monospace",
      default: "monospace",
    });
  }

  if (type === "serif") {
    return Platform.select({
      ios: "Georgia",
      android: "serif",
      web: "'Young Serif', Georgia, serif",
      default: "serif",
    });
  }

  return Platform.select({
    ios: "System",
    android: "Roboto",
    web: "system-ui, -apple-system, sans-serif",
    default: "System",
  });
}

/**
 * Returns platform-optimized shadow properties
 * (iOS shadowColor/Offset/Opacity/Radius vs Android elevation)
 */
export function getPlatformShadow(
  level: "low" | "medium" | "high" = "medium",
  backgroundColor: string = GardenPalette.paper2,
): ViewStyle {
  if (level === "low") {
    return Platform.select({
      ios: {
        shadowColor: GardenPalette.ink,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
        backgroundColor,
      },
      web: {
        boxShadow: "0 2px 4px rgba(0, 0, 0, 0.05)",
      },
      default: {
        elevation: 2,
        backgroundColor,
      },
    }) as ViewStyle;
  }

  if (level === "high") {
    return Platform.select({
      ios: {
        shadowColor: GardenPalette.ink,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.12,
        shadowRadius: 16,
      },
      android: {
        elevation: 6,
        backgroundColor,
      },
      web: {
        boxShadow: "0 8px 16px rgba(0, 0, 0, 0.12)",
      },
      default: {
        elevation: 6,
        backgroundColor,
      },
    }) as ViewStyle;
  }

  // Medium (default)
  return Platform.select({
    ios: {
      shadowColor: GardenPalette.ink,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.08,
      shadowRadius: 10,
    },
    android: {
      elevation: 4,
      backgroundColor,
    },
    web: {
      boxShadow: "0 4px 10px rgba(0, 0, 0, 0.08)",
    },
    default: {
      elevation: 4,
      backgroundColor,
    },
  }) as ViewStyle;
}

/**
 * Returns platform-appropriate KeyboardAvoidingView behavior
 */
export function getKeyboardAvoidingBehavior(): KeyboardAvoidingViewProps["behavior"] {
  return Platform.OS === "ios" ? "padding" : undefined;
}

/**
 * Cross-platform Haptics trigger with graceful web/unsupported fallback
 */
export async function triggerHaptic(
  type: "light" | "medium" | "heavy" | "success" | "warning" = "light",
) {
  if (Platform.OS === "web") return;

  try {
    if (type === "success") {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else if (type === "warning") {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    } else if (type === "heavy") {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    } else if (type === "medium") {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } else {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  } catch {
    // Ignore on unsupported devices
  }
}
