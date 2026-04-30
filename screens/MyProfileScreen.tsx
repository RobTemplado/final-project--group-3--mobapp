import React, { useEffect, useState } from "react";
import {
  Alert,
  ScrollView,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import styles from "../styles/screens/MyProfileScreenStyles";
import { colors } from "../utils/theme";
import { useAppContext } from "../context/AppContext";
import { ensureReminderPermissions } from "../utils/reminders";

const supportedCurrencies = ["PHP", "USD", "EUR", "GBP", "JPY", "AUD"];

function normalizeTimeInput(value: string): string {
  const trimmed = value.trim();
  const match = trimmed.match(/^([01]?\d|2[0-3]):([0-5]\d)$/);
  if (!match) return trimmed;
  return `${match[1].padStart(2, "0")}:${match[2]}`;
}

function isValidTime(value: string): boolean {
  return /^([01]?\d|2[0-3]):([0-5]\d)$/.test(value.trim());
}

function getCurrencySymbol(code: string): string {
  const symbols: Record<string, string> = { PHP: "₱", USD: "$", EUR: "€", GBP: "£", JPY: "¥", AUD: "A$" };
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
    logout,
  } = useAppContext();

  const [reminderTime, setReminderTime] = useState(reminderSettings.time);
  const [ratesDraft, setRatesDraft] = useState(currencySettings.rates ?? {});

  const totalEntries = expenses.filter((e) => e.userId === currentUser?.id).length;
  const symbol = getCurrencySymbol(currencySettings.homeCurrency);
  const totalSpend = expenses
    .filter((e) => e.userId === currentUser?.id)
    .reduce((sum, e) => sum + (e.homeAmount ?? e.amount), 0);

  useEffect(() => { setReminderTime(reminderSettings.time); }, [reminderSettings.time]);
  useEffect(() => { setRatesDraft(currencySettings.rates ?? {}); }, [currencySettings.rates]);

  const handleToggle = async () => {
    if (!reminderSettings.enabled) {
      const granted = await ensureReminderPermissions();
      if (!granted) {
        Alert.alert("Permission required", "Enable notifications to receive daily reminders.");
        return;
      }
    }
    await updateReminderSettings({ ...reminderSettings, enabled: !reminderSettings.enabled });
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
    await updateCurrencySettings({ ...currencySettings, homeCurrency: code, rates: nextRates, updatedAt: new Date().toISOString() });
  };

  const handleRateChange = (code: string, value: string) => {
    const numeric = Number(value.replace(/,/g, ""));
    if (Number.isNaN(numeric)) {
      setRatesDraft((prev) => { const next = { ...prev }; delete next[code]; return next; });
      return;
    }
    setRatesDraft((prev) => ({ ...prev, [code]: numeric }));
  };

  const handleRateBlur = async (code: string) => {
    const rate = ratesDraft[code];
    if (!rate || rate <= 0) {
      Alert.alert("Invalid rate", "Enter a positive number.");
      setRatesDraft((prev) => ({ ...prev, [code]: currencySettings.rates[code] }));
      return;
    }
    await updateCurrencySettings({ ...currencySettings, rates: { ...currencySettings.rates, [code]: rate }, updatedAt: new Date().toISOString() });
  };

  const handleLogout = () => {
    Alert.alert("Log out", "Are you sure you want to log out?", [
      { text: "Cancel", style: "cancel" },
      { text: "Log Out", style: "destructive", onPress: logout },
    ]);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerEyebrow}>MY PROFILE</Text>
        <Text style={styles.headerTitle}>{currentUser?.name ?? ""}</Text>
        <Text style={styles.headerSubtitle}>
          {currentUser?.role ?? ""} account
        </Text>
        <View style={styles.headerStatsRow}>
          <View style={styles.headerStat}>
            <Text style={styles.headerStatLabel}>Total Spent</Text>
            <Text style={styles.headerStatValue}>{symbol}{totalSpend.toFixed(2)}</Text>
          </View>
          <View style={styles.headerStatDivider} />
          <View style={styles.headerStat}>
            <Text style={styles.headerStatLabel}>Entries</Text>
            <Text style={styles.headerStatValue}>{totalEntries}</Text>
          </View>
        </View>
      </View>

      {/* Account */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Account</Text>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Username</Text>
          <Text style={styles.detailValue}>{currentUser?.name ?? ""}</Text>
        </View>
        <View style={[styles.detailRow, { borderBottomWidth: 0 }]}>
          <Text style={styles.detailLabel}>Role</Text>
          <View style={[styles.roleBadge, currentUser?.role === "Admin" && styles.roleBadgeAdmin]}>
            <Text style={[styles.roleBadgeText, currentUser?.role === "Admin" && styles.roleBadgeTextAdmin]}>
              {currentUser?.role ?? ""}
            </Text>
          </View>
        </View>
      </View>

      {/* Reminder */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Daily Reminder</Text>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Enable reminder</Text>
          <Switch
            value={reminderSettings.enabled}
            onValueChange={handleToggle}
            trackColor={{ false: colors.border, true: colors.accentSoft }}
            thumbColor={reminderSettings.enabled ? colors.accent : colors.surfaceMuted}
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
              style={[styles.pill, currencySettings.homeCurrency === code && styles.pillActive]}
              onPress={() => handleHomeCurrencyChange(code)}
            >
              <Text style={[styles.pillText, currencySettings.homeCurrency === code && styles.pillTextActive]}>
                {code}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.fieldLabel}>Exchange rates → {currencySettings.homeCurrency}</Text>
        {supportedCurrencies
          .filter((code) => code !== currencySettings.homeCurrency)
          .map((code) => (
            <View key={code} style={styles.rateRow}>
              <Text style={styles.rateLabel}>{code}</Text>
              <TextInput
                value={ratesDraft[code] !== undefined ? String(ratesDraft[code]) : ""}
                onChangeText={(v) => handleRateChange(code, v)}
                onBlur={() => handleRateBlur(code)}
                placeholder="0.00"
                placeholderTextColor={colors.textMuted}
                keyboardType="decimal-pad"
                style={styles.rateInput}
              />
              <Text style={styles.rateUnit}>{currencySettings.homeCurrency}</Text>
            </View>
          ))}
        <Text style={styles.helperText}>
          Example: If home is PHP, enter 1 USD = 56.20 PHP.
        </Text>
      </View>

      {/* Logout */}
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout} activeOpacity={0.8}>
        <Ionicons name="log-out-outline" size={20} color={colors.danger} />
        <Text style={styles.logoutButtonText}>Log Out</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}