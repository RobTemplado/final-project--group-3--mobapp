import { Platform } from "react-native";

export const colors = {
  background: "#F8F9FA",
  surface: "#FFFFFF",
  surfaceMuted: "#F0F2F5",
  primary: "#141716",
  primarySoft: "#2A302D",
  accent: "#00D46A", // Maya-inspired vibrant green
  accentSoft: "#E0F8EA",
  text: "#1A1D1C",
  textMuted: "#727976",
  border: "#E4E7E6",
  success: "#00D46A",
  danger: "#FF4A4A",
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
  sm: 10,
  md: 18,
  lg: 24,
  xl: 32,
  pill: 999,
};

export const shadow = {
  soft: {
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  lift: {
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
  },
};
