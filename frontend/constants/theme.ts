export const COLORS = {
  green: "#31582b",
  activeGreen: "#2e7d32",
  greenSoft: "#eef7e9",
  text: "#111827",
  body: "#565656",
  muted: "#848484",
  border: "#e0e0e0",
  field: "rgba(224,224,224,0.5)",
  danger: "#ba1a1a",
  warning: "#facc15",
  surface: "#ffffff",
  screen: "#ffffff",
};

export const Colors = {
  light: {
    text: COLORS.text,
    background: COLORS.screen,
    tint: COLORS.green,
    icon: COLORS.body,
    tabIconDefault: COLORS.muted,
    tabIconSelected: COLORS.green,
  },
  dark: {
    text: "#ecedee",
    background: "#151718",
    tint: "#9bd38f",
    icon: "#9ba1a6",
    tabIconDefault: "#9ba1a6",
    tabIconSelected: "#9bd38f",
  },
};

export const GardenPalette = {
  ink: COLORS.text,
  paper: COLORS.surface,
  paper2: "#f8faf9",
  leaf: COLORS.green,
  leafSoft: COLORS.greenSoft,
  muted: COLORS.muted,
  border: COLORS.border,
};
