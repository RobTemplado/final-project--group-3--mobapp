import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
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
    categories,
    updateCategoryLimit,
    reminderSettings,
    updateReminderSettings,
    currencySettings,
    updateCurrencySettings,
    logout,
  } = useAppContext();

  const [reminderTime, setReminderTime] = useState(reminderSettings.time);
  const [ratesDraft, setRatesDraft] = useState(currencySettings.rates ?? {});
  const [isFetchingRates, setIsFetchingRates] = useState(false);
  const [budgetDraft, setBudgetDraft] = useState<Record<string, string>>({});

  const totalEntries = expenses.filter((e) => e.userId === currentUser?.id).length;
  const symbol = getCurrencySymbol(currencySettings.homeCurrency);
  const totalSpend = expenses
    .filter((e) => e.userId === currentUser?.id)
    .reduce((sum, e) => sum + (e.homeAmount ?? e.amount), 0);

  useEffect(() => { setReminderTime(reminderSettings.time); }, [reminderSettings.time]);
  useEffect(() => { setRatesDraft(currencySettings.rates ?? {}); }, [currencySettings.rates]);
  useEffect(() => {
    const draft: Record<string, string> = {};
    categories.forEach(c => { draft[c.id] = String(c.limit); });
    setBudgetDraft(draft);
  }, [categories]);

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

  const fetchLatestRates = async () => {
    setIsFetchingRates(true);
    try {
      const base = currencySettings.homeCurrency;
      const response = await fetch(`https://open.er-api.com/v6/latest/${base}`);
      const data = await response.json();
      
      if (data.result === "success") {
        const nextRates: Record<string, number> = { [base]: 1 };
        supportedCurrencies.forEach(code => {
          if (data.rates[code]) {
            // API returns 1 base = X foreign. 
            // Our app logic: input amount * rate = home amount.
            // If home is PHP, USD rate should be ~56.
            // data.rates[USD] is 1 PHP = ~0.017 USD.
            // So rate should be 1 / data.rates[code].
            nextRates[code] = 1 / data.rates[code];
          }
        });
        await updateCurrencySettings({ 
          ...currencySettings, 
          rates: nextRates, 
          updatedAt: new Date().toISOString() 
        });
        Alert.alert("Success", "Exchange rates updated successfully.");
      } else {
        throw new Error("API error");
      }
    } catch (err) {
      Alert.alert("Error", "Could not fetch exchange rates. Please check your internet connection.");
    } finally {
      setIsFetchingRates(false);
    }
  };

  const handleBudgetChange = (id: string, value: string) => {
    setBudgetDraft(prev => ({ ...prev, [id]: value }));
  };

  const handleBudgetBlur = async (id: string) => {
    const numeric = parseFloat(budgetDraft[id] || "0");
    if (isNaN(numeric) || numeric < 0) {
      Alert.alert("Invalid budget", "Please enter a valid positive number.");
      const cat = categories.find(c => c.id === id);
      setBudgetDraft(prev => ({ ...prev, [id]: String(cat?.limit || 0) }));
      return;
    }
    await updateCategoryLimit(id, numeric);
  };

  const handleLogout = () => {
    Alert.alert("Log out", "Are you sure you want to log out?", [
      { text: "Cancel", style: "cancel" },
      { text: "Log Out", style: "destructive", onPress: logout },
    ]);
  };

  return (
    <SafeAreaView edges={["top"]} style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
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
        
        {currentUser?.role === 'Guest' ? (
          <View style={[styles.detailRow, { backgroundColor: 'rgba(255, 204, 0, 0.1)', paddingVertical: 12, paddingHorizontal: 16, borderRadius: 8, marginBottom: 12 }]}>
            <Ionicons name="warning" size={16} color="#ffcc00" style={{ marginRight: 8 }} />
            <Text style={{ color: '#ffcc00', fontSize: 13, flex: 1, lineHeight: 18 }}>
              You are signed in as a Guest. Your preferences and expenses will not be saved!
            </Text>
          </View>
        ) : null}

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
        <Text style={styles.cardDescription}>
          Stay on top of your finances with a friendly nudge to log your daily spending.
        </Text>
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

      {/* Budgets */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Expense Budgets</Text>
        <Text style={styles.cardDescription}>
          Set monthly spending limits for each category to keep your financial goals in check.
        </Text>
        {categories.map((cat) => (
          <View key={cat.id} style={styles.budgetRow}>
            <Text style={styles.budgetLabel}>{cat.name}</Text>
            <TextInput
              value={budgetDraft[cat.id]}
              onChangeText={(v) => handleBudgetChange(cat.id, v)}
              onBlur={() => handleBudgetBlur(cat.id)}
              keyboardType="decimal-pad"
              style={styles.budgetInput}
              placeholder="0.00"
              placeholderTextColor={colors.textMuted}
            />
          </View>
        ))}
      </View>

      {/* Currency */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Currency</Text>
        <Text style={styles.cardDescription}>
          Choose your primary currency and manage exchange rates for international expenses.
        </Text>
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
        
        <TouchableOpacity 
          style={styles.fetchRatesButton} 
          onPress={fetchLatestRates}
          disabled={isFetchingRates}
        >
          {isFetchingRates ? (
            <ActivityIndicator size="small" color="#085041" />
          ) : (
            <>
              <Ionicons name="refresh" size={16} color="#085041" />
              <Text style={styles.fetchRatesButtonText}>Fetch Current Rates</Text>
            </>
          )}
        </TouchableOpacity>

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
    </SafeAreaView>
  );
}