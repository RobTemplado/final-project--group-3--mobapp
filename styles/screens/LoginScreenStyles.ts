import { StyleSheet } from "react-native";
import { colors, fonts, radii, shadow } from "../../utils/theme";

export default StyleSheet.create({
  background: {
    flex: 1,
    backgroundColor: colors.primary,
  },
  topSection: {
    paddingHorizontal: 28,
    paddingTop: 72,
    paddingBottom: 24,
  },
  glow: {
    position: "absolute",
    top: -60,
    right: -40,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: "rgba(0, 212, 106, 0.12)",
  },
  appName: {
    fontFamily: fonts.body,
    color: colors.accent,
    letterSpacing: 1.5,
    textTransform: "uppercase",
    fontSize: 11,
    fontWeight: "700",
    marginBottom: 10,
  },
  heroTitle: {
    fontSize: 30,
    fontFamily: fonts.heading,
    fontWeight: "700",
    color: "#fff",
  },
  heroSub: {
    color: "rgba(255,255,255,0.5)",
    fontFamily: fonts.body,
    marginTop: 6,
    fontSize: 14,
  },
  cardWrapper: {
    flex: 1,
    justifyContent: "flex-start",
    paddingHorizontal: 20,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    padding: 22,
    borderWidth: 0.5,
    borderColor: "rgba(255,255,255,0.15)",
    ...shadow.lift,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    padding: 14,
    marginBottom: 12,
    backgroundColor: colors.surfaceMuted,
    fontFamily: fonts.body,
    color: colors.text,
    fontSize: 15,
  },
  roleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
    gap: 8,
  },
  roleButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    paddingVertical: 10,
    alignItems: "center",
    backgroundColor: colors.surfaceMuted,
  },
  roleButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  roleText: {
    color: colors.text,
    fontFamily: fonts.body,
    fontWeight: "600",
  },
  roleTextActive: {
    color: "#fff",
  },
  primaryButton: {
    backgroundColor: colors.accent,
    paddingVertical: 14,
    borderRadius: radii.md,
    alignItems: "center",
    marginTop: 4,
    ...shadow.soft,
  },
  primaryButtonText: {
    color: colors.primary,
    fontWeight: "700",
    fontFamily: fonts.body,
    fontSize: 15,
  },
  link: {
    alignItems: "center",
    marginTop: 14,
  },
  linkText: {
    color: colors.textMuted,
    fontFamily: fonts.body,
    fontSize: 13,
  },
  linkAction: {
    color: colors.accent,
    fontWeight: "700",
    textDecorationLine: "underline",
  },
});
