import React, { useEffect, useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useAppContext } from "../context/AppContext";
import { ensureReminderPermissions } from "../utils/reminders";
import { colors, fonts, radii, shadow } from "../utils/theme";

const supportedCurrencies = ["USD", "EUR", "GBP", "PHP", "JPY", "AUD"];

function normalizeTimeInput(value: string): string {
  const trimmed = value.trim();
  const match = trimmed.match(/^([01]?\d|2[0-3]):([0-5]\d)$/);
  if (!match) return trimmed;
  const hour = match[1].padStart(2, "0");
  return `${hour}:${match[2]}`;
}

function isValidTime(value: string): boolean {
  return /^([01]?\d|2[0-3]):([0-5]\d)$/.test(value.trim());
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

export default function MyProfileScreen() {
  const {
    currentUser,
    expenses,
    reminderSettings,
    updateReminderSettings,
    currencySettings,
    updateCurrencySettings,
  } = useAppContext();
  const [reminderTime, setReminderTime] = useState(reminderSettings.time);
  const [ratesDraft, setRatesDraft] = useState(currencySettings.rates ?? {});

  const totalEntries = expenses.filter(
    (e) => e.userId === currentUser?.id,
  ).length;
  const symbol = getCurrencySymbol(currencySettings.homeCurrency);

  const totalSpend = expenses
    .filter((e) => e.userId === currentUser?.id)
    .reduce((sum, e) => sum + (e.homeAmount ?? e.amount), 0);

  useEffect(() => {
    setReminderTime(reminderSettings.time);
  }, [reminderSettings.time]);
  useEffect(() => {
    setRatesDraft(currencySettings.rates ?? {});
  }, [currencySettings.rates]);

  const handleToggle = async () => {
    if (!reminderSettings.enabled) {
      const granted = await ensureReminderPermissions();
      if (!granted) {
        Alert.alert(
          "Permission required",
          "Enable notifications to receive daily reminders.",
        );
        return;
      }
    }
    await updateReminderSettings({
      ...reminderSettings,
      enabled: !reminderSettings.enabled,
    });
  };

  const handleTimeBlur = async () => {
    const normalized = normalizeTimeInput(reminderTime);
    if (!isValidTime(normalized)) {
      Alert.alert("Invalid time", "Use 24-hour format HH:MM (e.g. 20:00).");
      setReminderTime(reminderSettings.time);
      return;
    }
    await updateReminderSettings({ ...reminderSettings, time: normalized });
  };

  const handleHomeCurrencyChange = async (code: string) => {
    const nextRates = { ...currencySettings.rates, [code]: 1 };
    setRatesDraft(nextRates);
    await updateCurrencySettings({
      ...currencySettings,
      homeCurrency: code,
      rates: nextRates,
      updatedAt: new Date().toISOString(),
    });
  };

  const handleRateChange = (code: string, value: string) => {
    const normalized = value.replace(/,/g, "");
    const numeric = Number(normalized);
    if (Number.isNaN(numeric)) {
      setRatesDraft((prev) => {
        const next = { ...prev };
        delete next[code];
        return next;
      });
      return;
    }
    setRatesDraft((prev) => ({ ...prev, [code]: numeric }));
  };

  const handleRateBlur = async (code: string) => {
    const rate = ratesDraft[code];
    if (!rate || rate <= 0) {
      Alert.alert("Invalid rate", "Enter a positive number.");
      setRatesDraft((prev) => ({
        ...prev,
        [code]: currencySettings.rates[code],
      }));
      return;
    }
    await updateCurrencySettings({
      ...currencySettings,
      rates: { ...currencySettings.rates, [code]: rate },
      updatedAt: new Date().toISOString(),
    });
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Hero */}
      <View style={styles.header}>
        <Text style={styles.headerEyebrow}>My profile</Text>
        <Text style={styles.headerTitle}>{currentUser?.name ?? ""}</Text>
        <Text style={styles.headerSubtitle}>
          {currentUser?.role ?? ""} · {totalEntries} expense
          {totalEntries !== 1 ? "s" : ""} logged
        </Text>
        <View style={styles.headerStatsRow}>
          <View style={styles.headerStat}>
            <Text style={styles.headerStatLabel}>Total spent</Text>
            <Text style={styles.headerStatValue}>
              {symbol}
              {totalSpend.toFixed(2)}
            </Text>
          </View>
          <View style={styles.headerStatDivider} />
          <View style={styles.headerStat}>
            <Text style={styles.headerStatLabel}>Entries</Text>
            <Text style={styles.headerStatValue}>{totalEntries}</Text>
          </View>
        </View>
      </View>

      {/* Account details */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Account</Text>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Name</Text>
          <Text style={styles.detailValue}>{currentUser?.name ?? ""}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Role</Text>
          <View
            style={[
              styles.roleBadge,
              currentUser?.role === "Admin" && styles.roleBadgeAdmin,
            ]}
          >
            <Text
              style={[
                styles.roleBadgeText,
                currentUser?.role === "Admin" && styles.roleBadgeTextAdmin,
              ]}
            >
              {currentUser?.role ?? ""}
            </Text>
          </View>
        </View>
      </View>

      {/* Reminder */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Daily reminder</Text>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Enable reminder</Text>
          <Switch
            value={reminderSettings.enabled}
            onValueChange={handleToggle}
            trackColor={{ false: colors.border, true: colors.accentSoft }}
            thumbColor={
              reminderSettings.enabled ? colors.accent : colors.surfaceMuted
            }
          />
        </View>
        <Text style={styles.fieldLabel}>Reminder time (24h)</Text>
        <TextInput
          value={reminderTime}
          onChangeText={setReminderTime}
          onBlur={handleTimeBlur}
          placeholder="20:00"
          placeholderTextColor={colors.textMuted}
          style={styles.input}
        />
        <Text style={styles.helperText}>
          Skipped automatically if you already logged an expense today.
        </Text>
      </View>

      {/* Currency */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Currency</Text>
        <Text style={styles.fieldLabel}>Home currency</Text>
        <View style={styles.pillsRow}>
          {supportedCurrencies.map((code) => (
            <TouchableOpacity
              key={code}
              style={[
                styles.pill,
                currencySettings.homeCurrency === code && styles.pillActive,
              ]}
              onPress={() => handleHomeCurrencyChange(code)}
            >
              <Text
                style={[
                  styles.pillText,
                  currencySettings.homeCurrency === code &&
                    styles.pillTextActive,
                ]}
              >
                {code}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.fieldLabel}>
          Exchange rates (1 unit → {currencySettings.homeCurrency})
        </Text>
        {supportedCurrencies
          .filter((code) => code !== currencySettings.homeCurrency)
          .map((code) => (
            <View key={code} style={styles.rateRow}>
              <Text style={styles.rateLabel}>{code}</Text>
              <TextInput
                value={
                  ratesDraft[code] !== undefined ? String(ratesDraft[code]) : ""
                }
                onChangeText={(value) => handleRateChange(code, value)}
                onBlur={() => handleRateBlur(code)}
                placeholder="0.00"
                placeholderTextColor={colors.textMuted}
                keyboardType="decimal-pad"
                style={styles.rateInput}
              />
              <Text style={styles.rateUnit}>
                {currencySettings.homeCurrency}
              </Text>
            </View>
          ))}
        <Text style={styles.helperText}>
          Example: If home is PHP, enter 1 USD = 56.20 PHP.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: 16, paddingBottom: 40 },
  header: {
    backgroundColor: colors.primary,
    borderRadius: radii.xl,
    padding: 22,
    marginBottom: 14,
    ...shadow.lift,
  },
  headerEyebrow: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 10,
    letterSpacing: 1.4,
    textTransform: "uppercase",
    fontFamily: fonts.body,
  },
  headerTitle: {
    color: "#fff",
    fontSize: 22,
    fontFamily: fonts.heading,
    fontWeight: "700",
    marginTop: 4,
  },
  headerSubtitle: {
    color: "rgba(255,255,255,0.5)",
    fontFamily: fonts.body,
    marginTop: 4,
    fontSize: 13,
  },
  headerStatsRow: {
    flexDirection: "row",
    marginTop: 16,
    backgroundColor: "rgba(255,255,255,0.07)",
    borderRadius: radii.md,
    padding: 12,
  },
  headerStat: { flex: 1, alignItems: "center" },
  headerStatLabel: {
    color: "rgba(255,255,255,0.5)",
    fontFamily: fonts.body,
    fontSize: 11,
  },
  headerStatValue: {
    color: "#fff",
    fontFamily: fonts.heading,
    fontWeight: "700",
    fontSize: 18,
    marginTop: 3,
  },
  headerStatDivider: { width: 0.5, backgroundColor: "rgba(255,255,255,0.15)" },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: 16,
    borderWidth: 0.5,
    borderColor: colors.border,
    marginBottom: 14,
    ...shadow.soft,
  },
  cardTitle: {
    fontSize: 15,
    fontFamily: fonts.heading,
    fontWeight: "700",
    marginBottom: 12,
    color: colors.text,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.border,
  },
  detailLabel: {
    color: colors.textMuted,
    fontFamily: fonts.body,
    fontSize: 13,
  },
  detailValue: {
    color: colors.text,
    fontFamily: fonts.body,
    fontWeight: "600",
    fontSize: 13,
  },
  roleBadge: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: radii.pill,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderWidth: 0.5,
    borderColor: colors.border,
  },
  roleBadgeAdmin: {
    backgroundColor: colors.accentSoft,
    borderColor: "#9FE1CB",
  },
  roleBadgeText: {
    color: colors.textMuted,
    fontFamily: fonts.body,
    fontWeight: "600",
    fontSize: 12,
  },
  roleBadgeTextAdmin: { color: "#085041" },
  fieldLabel: {
    color: colors.textMuted,
    fontFamily: fonts.body,
    fontSize: 12,
    marginTop: 10,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: "transparent",
    borderRadius: radii.md,
    padding: 14,
    marginBottom: 8,
    backgroundColor: colors.surfaceMuted,
    fontFamily: fonts.mono,
    color: colors.text,
    fontSize: 15,
  },
  helperText: {
    marginTop: 4,
    color: colors.textMuted,
    fontFamily: fonts.body,
    fontSize: 12,
  },
  pillsRow: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginBottom: 4 },
  pill: {
    borderWidth: 0.5,
    borderColor: colors.border,
    borderRadius: radii.pill,
    paddingHorizontal: 13,
    paddingVertical: 7,
    backgroundColor: colors.surfaceMuted,
  },
  pillActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  pillText: {
    color: colors.text,
    fontFamily: fonts.body,
    fontWeight: "600",
    fontSize: 12,
  },
  pillTextActive: { color: "#fff" },
  rateRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    gap: 8,
  },
  rateLabel: {
    width: 40,
    fontFamily: fonts.body,
    fontWeight: "600",
    color: colors.text,
    fontSize: 13,
  },
  rateInput: {
    flex: 1,
    borderWidth: 0.5,
    borderColor: colors.border,
    borderRadius: radii.md,
    padding: 10,
    backgroundColor: colors.surfaceMuted,
    fontFamily: fonts.mono,
    color: colors.text,
    fontSize: 13,
  },
  rateUnit: {
    color: colors.textMuted,
    fontFamily: fonts.body,
    fontSize: 12,
    width: 36,
  },
});
