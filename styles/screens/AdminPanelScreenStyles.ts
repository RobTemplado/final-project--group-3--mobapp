import { StyleSheet } from "react-native";
import { colors, fonts, radii, shadow } from "../../utils/theme";

export default StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: colors.background },
  header: {
    backgroundColor: colors.primary,
    borderRadius: radii.xl,
    padding: 22,
    marginBottom: 16,
    ...shadow.lift,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerEyebrow: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 10,
    letterSpacing: 1.3,
    textTransform: "uppercase",
    fontFamily: fonts.body,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    fontFamily: fonts.heading,
    color: "#fff",
    marginTop: 3,
  },
  headerSubtext: {
    color: "rgba(255,255,255,0.5)",
    fontFamily: fonts.body,
    marginTop: 8,
    fontSize: 12,
  },
  actions: { flexDirection: "row", gap: 8 },
  exportButton: {
    backgroundColor: colors.accent,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radii.md,
  },
  exportButtonText: {
    color: colors.primary,
    fontWeight: "700",
    fontFamily: fonts.body,
    fontSize: 13,
  },
  filterRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 12,
  },
  filterPill: {
    borderWidth: 0.5,
    borderColor: "rgba(255,255,255,0.2)",
    borderRadius: radii.pill,
    paddingHorizontal: 12,
    paddingVertical: 5,
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  filterPillActive: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  filterPillText: {
    color: "rgba(255,255,255,0.7)",
    fontFamily: fonts.body,
    fontWeight: "600",
    fontSize: 11,
  },
  filterPillTextActive: { color: colors.primary },
  emptyContainer: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  empty: { color: colors.textMuted, fontFamily: fonts.body },
});
