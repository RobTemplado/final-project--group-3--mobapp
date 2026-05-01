import React, { useState } from "react";
import { Alert, FlatList, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import styles from "../styles/screens/AdminPanelScreenStyles";
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import * as Print from "expo-print";
import { Ionicons } from "@expo/vector-icons";
import ExpenseListItem from "../components/ExpenseListItem";
import { useAppContext } from "../context/AppContext";

function toCsv(rows: string[][]): string {
  return rows.map((row) => row.map((value) => `"${value.replace(/"/g, '""')}"`).join(",")).join("\n");
}

function getCurrencySymbol(code: string): string {
  const symbols: Record<string, string> = { PHP: "₱", USD: "$", EUR: "€", GBP: "£", JPY: "¥", AUD: "A$" };
  return symbols[code] ?? code + " ";
}

export default function AdminPanelScreen() {
  const { expenses, categories, users, currencySettings } = useAppContext();
  const [filterUserId, setFilterUserId] = useState<string | null>(null);
  const symbol = getCurrencySymbol(currencySettings.homeCurrency);

  const filteredExpenses = filterUserId ? expenses.filter((e) => e.userId === filterUserId) : expenses;
  const totalAmount = filteredExpenses.reduce((sum, e) => sum + (e.homeAmount ?? e.amount), 0);

  const handleExport = async () => {
    const header = ["Expense ID", "User", "Amount", "Currency", "Home Amount", "Exchange Rate", "Category", "Date"];
    const rows = filteredExpenses.map((expense) => {
      const category = categories.find((item) => item.id === expense.categoryId);
      const user = users.find((item) => item.id === expense.userId);
      return [expense.id, user?.name ?? "Unknown", expense.amount.toFixed(2), expense.currency ?? "", (expense.homeAmount ?? expense.amount).toFixed(2), expense.exchangeRate?.toFixed(6) ?? "", category?.name ?? "Unknown", expense.date];
    });
    const csv = toCsv([header, ...rows]);
    const fileUri = `${FileSystem.cacheDirectory}expenses.csv`;
    await FileSystem.writeAsStringAsync(fileUri, csv, { encoding: FileSystem.EncodingType.UTF8 });
    const isAvailable = await Sharing.isAvailableAsync();
    if (!isAvailable) { Alert.alert("Sharing unavailable", "Sharing is not supported on this device."); return; }
    await Sharing.shareAsync(fileUri, { mimeType: "text/csv", dialogTitle: "Share expenses" });
  };

  const handleExportPdf = async () => {
    const tableRows = filteredExpenses.map((expense) => {
      const category = categories.find((item) => item.id === expense.categoryId);
      const user = users.find((item) => item.id === expense.userId);
      const homeAmt = (expense.homeAmount ?? expense.amount).toFixed(2);
      return `<tr><td>${expense.date}</td><td>${user?.name ?? "Unknown"}</td><td>${category?.name ?? "Unknown"}</td><td>${expense.merchant ?? "-"}</td><td>${expense.currency && expense.currency !== currencySettings.homeCurrency ? `${expense.currency} ${expense.amount.toFixed(2)}` : "-"}</td><td>${symbol}${homeAmt}</td></tr>`;
    }).join("");

    const html = `<html><head><meta name="viewport" content="width=device-width, initial-scale=1.0" /><style>body{font-family:-apple-system,Helvetica,Arial,sans-serif;padding:24px;color:#1A1D1C;}h1{font-size:22px;color:#0D1B2A;margin-bottom:4px;}p{color:#7A8899;font-size:13px;margin-bottom:20px;}table{width:100%;border-collapse:collapse;font-size:12px;}th,td{padding:10px 12px;border-bottom:1px solid #E3E8EF;text-align:left;}th{color:#7A8899;font-weight:600;background:#F5F6FA;}</style></head><body><h1>Expense Report</h1><p>Generated ${new Date().toLocaleDateString()} · ${filteredExpenses.length} entries</p><table><thead><tr><th>Date</th><th>User</th><th>Category</th><th>Merchant</th><th>Original</th><th>Total (${currencySettings.homeCurrency})</th></tr></thead><tbody>${tableRows}</tbody></table></body></html>`;

    try {
      const { uri } = await Print.printToFileAsync({ html });
      const isAvailable = await Sharing.isAvailableAsync();
      if (!isAvailable) { Alert.alert("Sharing unavailable", "Sharing is not supported on this device."); return; }
      await Sharing.shareAsync(uri, { mimeType: "application/pdf", dialogTitle: "Share PDF Report" });
    } catch {
      Alert.alert("Export Error", "Failed to generate PDF.");
    }
  };

  return (
    <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: "#F5F6FA" }}>
      <FlatList
        data={filteredExpenses}
        showsVerticalScrollIndicator={false}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
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
          <View style={styles.emptyContainer}>
            <Ionicons name="receipt-outline" size={48} color="#CBD2DA" style={{ marginBottom: 12 }} />
            <Text style={styles.empty}>No expenses logged yet.</Text>
          </View>
        }
        ListHeaderComponent={
          <View>
            <View style={[styles.header, { marginHorizontal: 0, marginTop: 0 }]}>
              <View style={styles.headerRow}>
                <View>
                  <Text style={styles.headerEyebrow}>ADMIN PANEL</Text>
                  <Text style={styles.title}>All Expenses</Text>
                </View>
                <View style={styles.actions}>
                  <TouchableOpacity style={styles.exportButton} onPress={handleExportPdf}>
                    <Text style={styles.exportButtonText}>PDF</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.exportButton} onPress={handleExport}>
                    <Text style={styles.exportButtonText}>CSV</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <Text style={styles.headerSubtext}>
                {symbol}{totalAmount.toFixed(2)} total · {filteredExpenses.length} entries · {users.length} users
              </Text>

              <View style={styles.filterRow}>
                <TouchableOpacity
                  style={[styles.filterPill, !filterUserId && styles.filterPillActive]}
                  onPress={() => setFilterUserId(null)}
                >
                  <Text style={[styles.filterPillText, !filterUserId && styles.filterPillTextActive]}>All</Text>
                </TouchableOpacity>
                {users.map((user) => (
                  <TouchableOpacity
                    key={user.id}
                    style={[styles.filterPill, filterUserId === user.id && styles.filterPillActive]}
                    onPress={() => setFilterUserId(filterUserId === user.id ? null : user.id)}
                  >
                    <Text style={[styles.filterPillText, filterUserId === user.id && styles.filterPillTextActive]}>
                      {user.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        }
      />
    </SafeAreaView>
  );
}