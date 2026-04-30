import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Category, Expense } from "../utils/types";
import { colors, fonts, radii, shadow } from "../utils/theme";

type Props = {
  expense: Expense;
  category?: Category;
  showUser?: string;
};

export default function ExpenseListItem({
  expense,
  category,
  showUser,
}: Props) {
  const homeAmount = expense.homeAmount ?? expense.amount;
  const hasConversion =
    expense.currency && expense.currency !== "" && expense.homeAmount;
  const displayName = expense.merchant
    ? expense.merchant
    : (category?.name ?? "Unknown");
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <View style={styles.card}>
      <View style={styles.topRow}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initial}</Text>
        </View>
        <View style={styles.details}>
          <Text style={styles.merchant} numberOfLines={1}>
            {displayName}
          </Text>
          <View style={styles.subDetailRow}>
            {showUser ? (
              <Text style={styles.userText}>{showUser} · </Text>
            ) : null}
            <Text style={styles.categoryText}>
              {category?.name ?? "Unknown"}
            </Text>
            {expense.receiptImageUri ? (
              <Text style={styles.receiptTag}> · receipt</Text>
            ) : null}
          </View>
          {expense.notes ? (
            <Text style={styles.notes} numberOfLines={1}>
              {expense.notes}
            </Text>
          ) : null}
          {expense.tags && expense.tags.length > 0 ? (
            <View style={styles.tagsContainer}>
              {expense.tags.map((tag, index) => (
                <View key={index} style={styles.tagBadge}>
                  <Text style={styles.tagText}>#{tag}</Text>
                </View>
              ))}
            </View>
          ) : null}
        </View>
        <View style={styles.amountContainer}>
          <Text style={styles.amount}>-${homeAmount.toFixed(2)}</Text>
          <Text style={styles.date}>{expense.date}</Text>
          {hasConversion ? (
            <Text style={styles.conversionText}>
              {expense.currency} {expense.amount.toFixed(2)}
            </Text>
          ) : null}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    padding: 14,
    marginBottom: 8,
    borderWidth: 0.5,
    borderColor: colors.border,
    ...shadow.soft,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: colors.accentSoft,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  avatarText: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: "700",
    fontFamily: fonts.heading,
  },
  details: {
    flex: 1,
    paddingRight: 10,
  },
  merchant: {
    fontSize: 14,
    fontFamily: fonts.heading,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 2,
  },
  subDetailRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
  },
  userText: {
    color: colors.textMuted,
    fontFamily: fonts.body,
    fontSize: 12,
    fontWeight: "600",
  },
  categoryText: {
    color: colors.textMuted,
    fontFamily: fonts.body,
    fontSize: 12,
  },
  amountContainer: {
    alignItems: "flex-end",
  },
  amount: {
    fontSize: 14,
    fontFamily: fonts.heading,
    fontWeight: "700",
    color: colors.text,
  },
  date: {
    color: colors.textMuted,
    fontFamily: fonts.mono,
    fontSize: 10,
    marginTop: 3,
  },
  receiptTag: {
    color: colors.textMuted,
    fontFamily: fonts.body,
    fontSize: 12,
  },
  conversionText: {
    marginTop: 3,
    color: colors.textMuted,
    fontFamily: fonts.mono,
    fontSize: 10,
  },
  notes: {
    marginTop: 5,
    color: colors.text,
    fontFamily: fonts.body,
    fontSize: 12,
  },
  tagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 5,
  },
  tagBadge: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: radii.pill,
    paddingHorizontal: 7,
    paddingVertical: 2,
    marginRight: 5,
    marginBottom: 3,
    borderWidth: 0.5,
    borderColor: colors.border,
  },
  tagText: {
    color: colors.textMuted,
    fontFamily: fonts.mono,
    fontSize: 10,
  },
});
