import { Platform } from "react-native";

export const colors = {
  background: "#F5F6FA",
  surface: "#FFFFFF",
  surfaceMuted: "#F0F2F7",
  primary: "#0D1B2A",
  primarySoft: "#1A2E42",
  accent: "#00C96B",
  accentSoft: "#DFF7EC",
  accentSecondary: "#0099FF",
  accentSecondaryS: "#D6EEFF",
  text: "#0D1B2A",
  textMuted: "#7A8899",
  border: "#E3E8EF",
  success: "#00C96B",
  danger: "#FF3B3B",
  warning: "#FF9F0A",
};

export const fonts = {
  heading: Platform.select({
    ios: "-apple-system",
    android: "sans-serif-medium",
    default: "sans-serif",
  }),
  body: Platform.select({
    ios: "-apple-system",
    android: "sans-serif",
    default: "sans-serif",
  }),
  mono: Platform.select({
    ios: "Menlo",
    android: "monospace",
    default: "monospace",
  }),
};

export const radii = {
  sm: 8,
  md: 14,
  lg: 20,
  xl: 28,
  pill: 999,
};

export const shadow = {
  soft: {
    shadowColor: "#0D1B2A",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  lift: {
    shadowColor: "#0D1B2A",
    shadowOpacity: 0.12,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 5,
  },
  card: {
    shadowColor: "#0D1B2A",
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
};