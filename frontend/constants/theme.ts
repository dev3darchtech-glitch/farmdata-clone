import { Platform } from "react-native";

/**
 * Garden / Hollowback Apiary Theme Palette Tokens
 */
export const GardenPalette = {
  paper: "#FBF8EF", // Warm Cream / Linen
  paper2: "#F3EDE0", // Soft Sand Card Background
  paper3: "#EAE2D0", // Input Background
  ink: "#1E2920", // Deep Forest Charcoal
  inkMuted: "#4A574D", // Olive / Sage Gray
  rule: "#D8CFBC", // Hairline Border
  accent: "#B8621B", // Warm Terracotta / Amber
  accentSoft: "#F4E8D8", // Soft Honey Fill
  success: "#2D6A4F", // Deep Botanical Green
  successSoft: "#E8F5E9", // Light Green Tint
  error: "#9A3412", // Earthy Rust Red
  errorSoft: "#FBE9E7", // Soft Red Tint
  white: "#FFFFFF",
  greenPrimary: "#31582b",
  greenActive: "#2e7d32",
  greenSoft: "#EEF7E9",
  neutral50: "#F3F4F6",
  neutral100: "#E0E0E0",
};

const tintColorLight = GardenPalette.accent;
const tintColorDark = GardenPalette.accentSoft;

export const Colors = {
  light: {
    text: GardenPalette.ink,
    background: GardenPalette.paper,
    cardBackground: GardenPalette.paper2,
    border: GardenPalette.rule,
    tint: tintColorLight,
    icon: GardenPalette.inkMuted,
    tabIconDefault: GardenPalette.inkMuted,
    tabIconSelected: GardenPalette.accent,
  },
  dark: {
    text: "#F5F0E6",
    background: "#18201A",
    cardBackground: "#222C24",
    border: "#344238",
    tint: tintColorDark,
    icon: "#8A9B8F",
    tabIconDefault: "#8A9B8F",
    tabIconSelected: GardenPalette.accentSoft,
  },
};

export const Fonts = Platform.select({
  ios: {
    sans: "system-ui",
    serif: "ui-serif",
    rounded: "ui-rounded",
    mono: "ui-monospace",
  },
  default: {
    sans: "normal",
    serif: "serif",
    rounded: "normal",
    mono: "monospace",
  },
  web: {
    sans: "'Hanken Grotesk', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    serif: "'Young Serif', Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', sans-serif",
    mono: "'Geist Mono', SFMono-Regular, Menlo, Monaco, Consolas, monospace",
  },
});
