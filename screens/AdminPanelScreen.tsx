import React, { useState } from "react";
import {
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import * as Print from "expo-print";
import ExpenseListItem from "../components/ExpenseListItem";
import { useAppContext } from "../context/AppContext";
import { colors, fonts, radii, shadow } from "../utils/theme";

function toCsv(rows: string[][]): string {
  return rows
    .map((row) =>
      row.map((value) => `"${value.replace(/"/g, '""')}"`).join(","),
    )
    .join("\n");
}

function getCurrencySymbol(code: string): string {
  const symbols: Record<string, string> = {
    PHP: "₱",
    USD: "$",
    EUR: "€",
    GBP: "£",
    JPY: "¥",
    AUD: "A$",
  };
  return symbols[code] ?? code + " ";
}

export default function AdminPanelScreen() {
  const { expenses, categories, users, currencySettings } = useAppContext();
  const [filterUserId, setFilterUserId] = useState<string | null>(null);

  const symbol = getCurrencySymbol(currencySettings.homeCurrency);

  const filteredExpenses = filterUserId
    ? expenses.filter((e) => e.userId === filterUserId)
    : expenses;

  const handleExport = async () => {
    const header = [
      "Expense ID",
      "User",
      "Amount",
      "Currency",
      "Home Amount",
      "Exchange Rate",
      "Category",
      "Date",
    ];
    const rows = filteredExpenses.map((expense) => {
      const category = categories.find(
        (item) => item.id === expense.categoryId,
      );
      const user = users.find((item) => item.id === expense.userId);
      return [
        expense.id,
        user?.name ?? "Unknown",
        expense.amount.toFixed(2),
        expense.currency ?? "",
        (expense.homeAmount ?? expense.amount).toFixed(2),
        expense.exchangeRate?.toFixed(6) ?? "",
        category?.name ?? "Unknown",
        expense.date,
      ];
    });
    const csv = toCsv([header, ...rows]);
    const fileUri = `${FileSystem.cacheDirectory}expenses.csv`;
    await FileSystem.writeAsStringAsync(fileUri, csv, {
      encoding: FileSystem.EncodingType.UTF8,
    });
    const isAvailable = await Sharing.isAvailableAsync();
    if (!isAvailable) {
      Alert.alert(
        "Sharing unavailable",
        "Sharing is not supported on this device.",
      );
      return;
    }
    await Sharing.shareAsync(fileUri, {
      mimeType: "text/csv",
      dialogTitle: "Share expenses",
    });
  };

  const handleExportPdf = async () => {
    const tableRows = filteredExpenses
      .map((expense) => {
        const category = categories.find(
          (item) => item.id === expense.categoryId,
        );
        const user = users.find((item) => item.id === expense.userId);
        const homeAmt = (expense.homeAmount ?? expense.amount).toFixed(2);
        return `
        <tr>
          <td>${expense.date}</td>
          <td>${user?.name ?? "Unknown"}</td>
          <td>${category?.name ?? "Unknown"}</td>
          <td>${expense.merchant ?? "-"}</td>
          <td>${expense.currency && expense.currency !== currencySettings.homeCurrency ? `${expense.currency} ${expense.amount.toFixed(2)}` : "-"}</td>
          <td>${symbol}${homeAmt}</td>
        </tr>`;
      })
      .join("");

    const html = `
      <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <style>
            body { font-family: -apple-system, Helvetica, Arial, sans-serif; padding: 20px; color: #333; }
            h1 { font-size: 24px; color: #111; }
            p { color: #666; margin-top: 4px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 13px; }
            th, td { padding: 10px; border-bottom: 1px solid #eee; text-align: left; }
            th { color: #666; font-weight: 600; background: #f9f9f9; }
          </style>
        </head>
        <body>
          <h1>Expense Report</h1>
          <p>Generated ${new Date().toLocaleDateString()} · ${filteredExpenses.length} entries</p>
          <table>
            <thead>
              <tr>
                <th>Date</th><th>User</th><th>Category</th>
                <th>Merchant</th><th>Original</th><th>Total (${currencySettings.homeCurrency})</th>
              </tr>
            </thead>
            <tbody>${tableRows}</tbody>
          </table>
        </body>
      </html>`;

    try {
      const { uri } = await Print.printToFileAsync({ html });
      const isAvailable = await Sharing.isAvailableAsync();
      if (!isAvailable) {
        Alert.alert(
          "Sharing unavailable",
          "Sharing is not supported on this device.",
        );
        return;
      }
      await Sharing.shareAsync(uri, {
        mimeType: "application/pdf",
        dialogTitle: "Share PDF Report",
      });
    } catch {
      Alert.alert("Export Error", "Failed to generate PDF.");
    }
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={filteredExpenses}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => {
          const user = users.find((u) => u.id === item.userId);
          return (
            <ExpenseListItem
              expense={item}
              category={categories.find((c) => c.id === item.categoryId)}
              showUser={user?.name}
            />
          );
        }}
        ListEmptyComponent={
          <Text style={styles.empty}>No expenses logged yet.</Text>
        }
        contentContainerStyle={
          filteredExpenses.length ? undefined : styles.emptyContainer
        }
        ListHeaderComponent={
          <View>
            <View style={styles.header}>
              <View style={styles.headerRow}>
                <View>
                  <Text style={styles.headerEyebrow}>Admin</Text>
                  <Text style={styles.title}>All expenses</Text>
                </View>
                <View style={styles.actions}>
                  <TouchableOpacity
                    style={styles.exportButton}
                    onPress={handleExportPdf}
                  >
                    <Text style={styles.exportButtonText}>PDF</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.exportButton}
                    onPress={handleExport}
                  >
                    <Text style={styles.exportButtonText}>CSV</Text>
                  </TouchableOpacity>
                </View>
              </View>
              <Text style={styles.headerSubtext}>
                {filteredExpenses.length} entries across {users.length} users
              </Text>

              {/* User filter pills */}
              <View style={styles.filterRow}>
                <TouchableOpacity
                  style={[
                    styles.filterPill,
                    !filterUserId && styles.filterPillActive,
                  ]}
                  onPress={() => setFilterUserId(null)}
                >
                  <Text
                    style={[
                      styles.filterPillText,
                      !filterUserId && styles.filterPillTextActive,
                    ]}
                  >
                    All users
                  </Text>
                </TouchableOpacity>
                {users.map((user) => (
                  <TouchableOpacity
                    key={user.id}
                    style={[
                      styles.filterPill,
                      filterUserId === user.id && styles.filterPillActive,
                    ]}
                    onPress={() =>
                      setFilterUserId(filterUserId === user.id ? null : user.id)
                    }
                  >
                    <Text
                      style={[
                        styles.filterPillText,
                        filterUserId === user.id && styles.filterPillTextActive,
                      ]}
                    >
                      {user.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
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
