import { StyleSheet } from "react-native";
import { colors, fonts, radii, shadow } from "../../utils/theme";

export default StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    backgroundColor: colors.primary,
    borderRadius: radii.xl,
    padding: 22,
    marginBottom: 14,
    ...shadow.lift,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerEyebrow: {
    color: "rgba(255,255,255,0.45)",
    fontSize: 10,
    letterSpacing: 1.5,
    textTransform: "uppercase",
    fontFamily: fonts.body,
    fontWeight: "700",
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    fontFamily: fonts.heading,
    color: "#fff",
    marginTop: 4,
  },
  headerSubtext: {
    color: "rgba(255,255,255,0.45)",
    fontFamily: fonts.body,
    marginTop: 8,
    fontSize: 12,
  },
  actions: { flexDirection: "row", gap: 8 },
  exportButton: {
    backgroundColor: colors.accent,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: radii.md,
  },
  exportButtonText: {
    color: colors.primary,
    fontWeight: "700",
    fontFamily: fonts.body,
    fontSize: 12,
    letterSpacing: 0.5,
  },
  filterRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 14,
  },
  filterPill: {
    borderWidth: 0.5,
    borderColor: "rgba(255,255,255,0.18)",
    borderRadius: radii.pill,
    paddingHorizontal: 13,
    paddingVertical: 6,
    backgroundColor: "rgba(255,255,255,0.07)",
  },
  filterPillActive: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  filterPillText: {
    color: "rgba(255,255,255,0.65)",
    fontFamily: fonts.body,
    fontWeight: "600",
    fontSize: 12,
  },
  filterPillTextActive: { color: colors.primary },
  listContent: {
    padding: 16,
    paddingTop: 0,
    paddingBottom: 100,
  },
  emptyContainer: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
  },
  empty: { color: colors.textMuted, fontFamily: fonts.body, fontSize: 13 },
});