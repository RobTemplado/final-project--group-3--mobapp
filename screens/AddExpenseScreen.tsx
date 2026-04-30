import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import styles from "../styles/screens/AddExpenseScreenStyles";
import { CameraView, CameraViewRef, useCameraPermissions } from "expo-camera";
import * as FileSystem from "expo-file-system/legacy";
import { useAppContext } from "../context/AppContext";
import { runOcrOnImage } from "../utils/ocr";
import { MerchantCategoryMap, ReceiptLineItem } from "../utils/types";
import {
  loadMerchantCategoryMap,
  saveMerchantCategoryMap,
} from "../utils/storage";
import { colors, fonts, radii, shadow } from "../utils/theme";

const supportedCurrencies = ["USD", "EUR", "GBP", "PHP", "JPY", "AUD"];

type LineItemInput = { id: string; name: string; amount: string };

function createLineItem(): LineItemInput {
  return {
    id: `line-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    name: "",
    amount: "",
  };
}

function parseMoney(value: string): number | undefined {
  if (!value.trim()) return undefined;
  const normalized = value.replace(/,/g, "");
  const parsed = Number(normalized);
  return Number.isNaN(parsed) ? undefined : parsed;
}

function normalizeMerchant(value: string): string {
  return value.trim().toLowerCase();
}

type Suggestion = { categoryId: string; source: "learned" | "keyword" };

function getKeywordSuggestion(
  merchantValue: string,
  categories: { id: string; name: string }[],
): Suggestion | null {
  const merchantLower = normalizeMerchant(merchantValue);
  if (!merchantLower) return null;

  const rules: Array<{ keywords: string[]; categoryName: string }> = [
    {
      keywords: [
        "jollibee",
        "mcdonald",
        "mcdo",
        "kfc",
        "starbucks",
        "restaurant",
        "cafe",
        "coffee",
        "food",
      ],
      categoryName: "Food",
    },
    {
      keywords: ["grab", "uber", "lyft", "taxi", "transport"],
      categoryName: "Transport",
    },
    {
      keywords: [
        "utility",
        "water",
        "electric",
        "power",
        "internet",
        "meralco",
      ],
      categoryName: "Utilities",
    },
  ];

  for (const rule of rules) {
    if (rule.keywords.some((keyword) => merchantLower.includes(keyword))) {
      const match = categories.find(
        (category) =>
          category.name.toLowerCase() === rule.categoryName.toLowerCase(),
      );
      if (match) return { categoryId: match.id, source: "keyword" };
    }
  }
  return null;
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

export default function AddExpenseScreen() {
  const {
    categories,
    addCategory,
    addExpense,
    currentUser,
    expenses,
    currencySettings,
  } = useAppContext();
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [merchant, setMerchant] = useState("");
  const [subtotal, setSubtotal] = useState("");
  const [tax, setTax] = useState("");
  const [total, setTotal] = useState("");
  const [notes, setNotes] = useState("");
  const [tagsInput, setTagsInput] = useState("");
  const [currency, setCurrency] = useState(currencySettings.homeCurrency);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(
    null,
  );
  const [merchantCategoryMap, setMerchantCategoryMap] =
    useState<MerchantCategoryMap>({});
  const [suggestion, setSuggestion] = useState<Suggestion | null>(null);
  const [isCategoryManual, setIsCategoryManual] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryLimit, setNewCategoryLimit] = useState("");
  const [error, setError] = useState("");
  const [scanMessage, setScanMessage] = useState("");
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [receiptImageUri, setReceiptImageUri] = useState<string | null>(null);
  const [lineItems, setLineItems] = useState<LineItemInput[]>([]);
  const cameraRef = useRef<CameraView | null>(null);
  const [permission, requestPermission] = useCameraPermissions();

  useEffect(() => {
    if (!permission?.granted) requestPermission();
  }, [permission, requestPermission]);

  useEffect(() => {
    setCurrency(currencySettings.homeCurrency);
  }, [currencySettings.homeCurrency]);

  useEffect(() => {
    let isMounted = true;
    loadMerchantCategoryMap().then((map) => {
      if (isMounted) setMerchantCategoryMap(map);
    });
    return () => {
      isMounted = false;
    };
  }, []);

  const selectedCategory = useMemo(
    () => categories.find((c) => c.id === selectedCategoryId) ?? null,
    [categories, selectedCategoryId],
  );

  const suggestedCategory = useMemo(() => {
    if (!suggestion) return null;
    return categories.find((c) => c.id === suggestion.categoryId);
  }, [categories, suggestion]);

  const currentCategoryTotal = useMemo(() => {
    if (!selectedCategoryId) return 0;
    return expenses
      .filter(
        (e) =>
          e.userId === currentUser?.id && e.categoryId === selectedCategoryId,
      )
      .reduce((sum, e) => sum + e.amount, 0);
  }, [expenses, currentUser, selectedCategoryId]);

  useEffect(() => {
    const normalized = normalizeMerchant(merchant);
    if (!normalized) {
      setSuggestion(null);
      return;
    }

    const learnedCategoryId = merchantCategoryMap[normalized];
    if (learnedCategoryId) {
      setSuggestion({ categoryId: learnedCategoryId, source: "learned" });
      if (!isCategoryManual || !selectedCategoryId) {
        setSelectedCategoryId(learnedCategoryId);
        setIsCategoryManual(false);
      }
      return;
    }

    const keywordSuggestion = getKeywordSuggestion(merchant, categories);
    setSuggestion(keywordSuggestion);
    if (keywordSuggestion && (!isCategoryManual || !selectedCategoryId)) {
      setSelectedCategoryId(keywordSuggestion.categoryId);
      setIsCategoryManual(false);
    }
  }, [
    merchant,
    merchantCategoryMap,
    categories,
    isCategoryManual,
    selectedCategoryId,
  ]);

  const handleAddCategory = async () => {
    setError("");
    const limit = Number(newCategoryLimit);
    if (!newCategoryName.trim() || Number.isNaN(limit) || limit <= 0) {
      setError("Provide a name and a positive limit.");
      return;
    }
    const category = await addCategory(newCategoryName, limit);
    setSelectedCategoryId(category.id);
    setNewCategoryName("");
    setNewCategoryLimit("");
  };

  const handleSave = async () => {
    setError("");
    const amountValue = parseMoney(total) ?? parseMoney(amount);
    if (!selectedCategoryId) {
      setError("Select a category.");
      return;
    }
    if (amountValue === undefined || amountValue <= 0) {
      setError("Enter a valid amount.");
      return;
    }

    const rate =
      currency === currencySettings.homeCurrency
        ? 1
        : currencySettings.rates[currency];
    if (!rate || rate <= 0) {
      setError("Add an exchange rate for this currency in My Profile.");
      return;
    }

    const category = categories.find((item) => item.id === selectedCategoryId);
    if (!category) {
      setError("Select a valid category.");
      return;
    }

    const currentTotal = expenses
      .filter(
        (e) =>
          e.userId === currentUser?.id && e.categoryId === selectedCategoryId,
      )
      .reduce((sum, e) => sum + e.amount, 0);
    const nextTotal = currentTotal + amountValue;
    const nextPercent = nextTotal / category.limit;

    const lineItemsToSave: ReceiptLineItem[] = [];
    for (const item of lineItems) {
      const name = item.name.trim();
      const lineAmount = parseMoney(item.amount);
      if (!name && !item.amount.trim()) continue;
      if (!name || lineAmount === undefined) {
        setError("Complete all line items or remove them.");
        return;
      }
      lineItemsToSave.push({ id: item.id, name, amount: lineAmount });
    }

    const parsedTags = tagsInput
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    const result = await addExpense({
      amount: amountValue,
      categoryId: selectedCategoryId,
      date,
      currency,
      merchant: merchant.trim() || undefined,
      receiptImageUri: receiptImageUri ?? undefined,
      lineItems: lineItemsToSave.length ? lineItemsToSave : undefined,
      subtotal: parseMoney(subtotal),
      tax: parseMoney(tax),
      total: parseMoney(total),
      notes: notes.trim() || undefined,
      tags: parsedTags.length > 0 ? parsedTags : undefined,
    });

    if (!result.ok) {
      setError(result.error);
      return;
    }

    if (nextPercent >= 1) {
      Alert.alert(
        "Budget limit reached",
        `You have reached the ${category.name} limit.`,
      );
    } else if (nextPercent >= 0.8) {
      Alert.alert(
        "Budget warning",
        `You are at ${Math.round(nextPercent * 100)}% of the ${category.name} limit.`,
      );
    }

    if (merchant.trim()) {
      const normalized = normalizeMerchant(merchant);
      const nextMap = {
        ...merchantCategoryMap,
        [normalized]: selectedCategoryId,
      };
      setMerchantCategoryMap(nextMap);
      await saveMerchantCategoryMap(nextMap);
    }

    setAmount("");
    setMerchant("");
    setSubtotal("");
    setTax("");
    setTotal("");
    setCurrency(currencySettings.homeCurrency);
    setReceiptImageUri(null);
    setLineItems([]);
    setScanMessage("");
    setSuggestion(null);
    setIsCategoryManual(false);
    setNotes("");
    setTagsInput("");
    Alert.alert("Saved", "Expense added.");
  };

  const handleCapture = async () => {
    if (!cameraRef.current) return;
    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.6 });
      setIsCameraOpen(false);
      const destination = FileSystem.documentDirectory
        ? `${FileSystem.documentDirectory}receipt-${Date.now()}.jpg`
        : photo.uri;
      if (destination !== photo.uri) {
        await FileSystem.copyAsync({ from: photo.uri, to: destination });
      }
      setReceiptImageUri(destination);
      const ocrResult = await runOcrOnImage(destination);
      if (ocrResult.amount) {
        setAmount(String(ocrResult.amount));
        setTotal(String(ocrResult.amount));
      }
      if (ocrResult.date) setDate(ocrResult.date);
      if (ocrResult.merchant) setMerchant(ocrResult.merchant);
      if (ocrResult.categoryName) {
        const match = categories.find(
          (c) => c.name.toLowerCase() === ocrResult.categoryName?.toLowerCase(),
        );
        if (match) setSelectedCategoryId(match.id);
      }
      setScanMessage(
        ocrResult.amount || ocrResult.date || ocrResult.merchant
          ? "Review the detected details below."
          : "Receipt attached. Fill in the details below.",
      );
    } catch (captureError) {
      const message =
        captureError instanceof Error ? captureError.message : "OCR failed.";
      Alert.alert("Scan failed", message);
    }
  };

  if (isCameraOpen && permission && !permission.granted) {
    return (
      <View style={styles.permissionContainer}>
        <Text style={styles.permissionText}>
          Camera permission is required to scan receipts.
        </Text>
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={requestPermission}
        >
          <Text style={styles.primaryButtonText}>Grant permission</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() => setIsCameraOpen(false)}
        >
          <Text style={styles.secondaryButtonText}>Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (isCameraOpen) {
    return (
      <View style={styles.cameraContainer}>
        <CameraView ref={cameraRef} style={styles.camera} facing="back" />
        <View style={styles.cameraActions}>
          <TouchableOpacity style={styles.cameraButton} onPress={handleCapture}>
            <Text style={styles.cameraButtonText}>Capture</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.cameraButtonSecondary}
            onPress={() => setIsCameraOpen(false)}
          >
            <Text style={styles.cameraButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const symbol = getCurrencySymbol(currency);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerEyebrow}>New entry</Text>
          <Text style={styles.headerTitle}>Add expense</Text>
          <Text style={styles.headerSubtitle}>
            Snap a receipt or enter details manually.
          </Text>
        </View>

        {/* Scan button — prominent, first thing user sees */}
        <TouchableOpacity
          style={styles.scanButton}
          onPress={() => setIsCameraOpen(true)}
        >
          <Text style={styles.scanButtonText}>
            {receiptImageUri ? "Rescan receipt" : "Scan receipt"}
          </Text>
          <Text style={styles.scanButtonSub}>
            Auto-fills merchant, date &amp; amount
          </Text>
        </TouchableOpacity>

        {scanMessage ? (
          <Text style={styles.scanMessage}>{scanMessage}</Text>
        ) : null}

        {receiptImageUri ? (
          <Image source={{ uri: receiptImageUri }} style={styles.receipt} />
        ) : null}

        {/* Amount & date card */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Amount &amp; date</Text>
          <TextInput
            placeholder={`${symbol} 0.00`}
            placeholderTextColor={colors.textMuted}
            value={amount}
            onChangeText={setAmount}
            keyboardType="decimal-pad"
            style={styles.input}
          />
          <Text style={styles.fieldLabel}>Currency</Text>
          <View style={styles.pillsRow}>
            {supportedCurrencies.map((code) => (
              <TouchableOpacity
                key={code}
                style={[styles.pill, currency === code && styles.pillActive]}
                onPress={() => setCurrency(code)}
              >
                <Text
                  style={[
                    styles.pillText,
                    currency === code && styles.pillTextActive,
                  ]}
                >
                  {code}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          {currency !== currencySettings.homeCurrency ? (
            <Text style={styles.helperText}>
              Rate: 1 {currency} = {currencySettings.rates[currency] ?? "?"}{" "}
              {currencySettings.homeCurrency}
            </Text>
          ) : null}
          <TextInput
            placeholder="YYYY-MM-DD"
            placeholderTextColor={colors.textMuted}
            value={date}
            onChangeText={setDate}
            style={styles.input}
          />
        </View>

        {/* Receipt details card */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Receipt details</Text>
          <TextInput
            placeholder="Merchant"
            placeholderTextColor={colors.textMuted}
            value={merchant}
            onChangeText={setMerchant}
            style={styles.input}
          />
          <TextInput
            placeholder="Subtotal"
            placeholderTextColor={colors.textMuted}
            value={subtotal}
            onChangeText={setSubtotal}
            keyboardType="decimal-pad"
            style={styles.input}
          />
          <TextInput
            placeholder="Tax"
            placeholderTextColor={colors.textMuted}
            value={tax}
            onChangeText={setTax}
            keyboardType="decimal-pad"
            style={styles.input}
          />
          <TextInput
            placeholder="Total"
            placeholderTextColor={colors.textMuted}
            value={total}
            onChangeText={setTotal}
            keyboardType="decimal-pad"
            style={styles.input}
          />
          <TextInput
            placeholder="Notes (optional)"
            placeholderTextColor={colors.textMuted}
            value={notes}
            onChangeText={setNotes}
            style={styles.input}
          />
          <TextInput
            placeholder="Tags (comma separated, e.g. lunch, reimbursable)"
            placeholderTextColor={colors.textMuted}
            value={tagsInput}
            onChangeText={setTagsInput}
            style={styles.input}
          />

          <Text style={styles.sectionTitle}>Line items</Text>
          {lineItems.map((item) => (
            <View key={item.id} style={styles.lineItemRow}>
              <TextInput
                placeholder="Item"
                placeholderTextColor={colors.textMuted}
                value={item.name}
                onChangeText={(value) =>
                  setLineItems((prev) =>
                    prev.map((l) =>
                      l.id === item.id ? { ...l, name: value } : l,
                    ),
                  )
                }
                style={[styles.input, styles.lineItemName]}
              />
              <TextInput
                placeholder="0.00"
                placeholderTextColor={colors.textMuted}
                value={item.amount}
                onChangeText={(value) =>
                  setLineItems((prev) =>
                    prev.map((l) =>
                      l.id === item.id ? { ...l, amount: value } : l,
                    ),
                  )
                }
                keyboardType="decimal-pad"
                style={[styles.input, styles.lineItemAmount]}
              />
              <TouchableOpacity
                style={styles.lineItemRemove}
                onPress={() =>
                  setLineItems((prev) => prev.filter((l) => l.id !== item.id))
                }
              >
                <Text style={styles.lineItemRemoveText}>✕</Text>
              </TouchableOpacity>
            </View>
          ))}
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => setLineItems((prev) => [...prev, createLineItem()])}
          >
            <Text style={styles.secondaryButtonText}>+ Add line item</Text>
          </TouchableOpacity>
        </View>

        {/* Category card */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Category</Text>
          <View style={styles.pillsRow}>
            {categories.map((category) => (
              <TouchableOpacity
                key={category.id}
                style={[
                  styles.pill,
                  selectedCategoryId === category.id && styles.pillActive,
                ]}
                onPress={() => {
                  setSelectedCategoryId(category.id);
                  setIsCategoryManual(true);
                }}
              >
                <Text
                  style={[
                    styles.pillText,
                    selectedCategoryId === category.id && styles.pillTextActive,
                  ]}
                >
                  {category.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {selectedCategory ? (
            <Text style={styles.limitText}>
              Limit: {getCurrencySymbol(currencySettings.homeCurrency)}
              {selectedCategory.limit.toFixed(2)}
              {"  ·  "}Used: {getCurrencySymbol(currencySettings.homeCurrency)}
              {currentCategoryTotal.toFixed(2)}
            </Text>
          ) : null}

          {suggestedCategory ? (
            <View style={styles.suggestionBar}>
              <Text style={styles.suggestionText}>
                Suggested: {suggestedCategory.name}
                {suggestion?.source === "learned" ? " (learned)" : ""}
              </Text>
              {suggestedCategory.id !== selectedCategoryId ? (
                <TouchableOpacity
                  style={styles.suggestionButton}
                  onPress={() => {
                    setSelectedCategoryId(suggestedCategory.id);
                    setIsCategoryManual(false);
                  }}
                >
                  <Text style={styles.suggestionButtonText}>Use</Text>
                </TouchableOpacity>
              ) : null}
            </View>
          ) : null}
        </View>

        {/* Add new category card */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Add new category</Text>
          <TextInput
            placeholder="Category name"
            placeholderTextColor={colors.textMuted}
            value={newCategoryName}
            onChangeText={setNewCategoryName}
            style={styles.input}
          />
          <TextInput
            placeholder="Spending limit"
            placeholderTextColor={colors.textMuted}
            value={newCategoryLimit}
            onChangeText={setNewCategoryLimit}
            keyboardType="decimal-pad"
            style={styles.input}
          />
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={handleAddCategory}
          >
            <Text style={styles.secondaryButtonText}>Add category</Text>
          </TouchableOpacity>
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <TouchableOpacity style={styles.primaryButton} onPress={handleSave}>
          <Text style={styles.primaryButtonText}>Save expense</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

