import React, { useMemo, useState } from "react";
import {
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { BarChart, LineChart, PieChart } from "react-native-gifted-charts";
import ExpenseListItem from "../components/ExpenseListItem";
import { useAppContext } from "../context/AppContext";
import { colors, fonts, radii, shadow } from "../utils/theme";

type DateRangeKey = "7d" | "30d" | "all";

const rangeOptions: Array<{ key: DateRangeKey; label: string }> = [
  { key: "7d", label: "7 days" },
  { key: "30d", label: "30 days" },
  { key: "all", label: "All time" },
];

const chartPalette = [
  colors.accent,
  colors.primary,
  "#10b981",
  "#f59e0b",
  "#3b82f6",
  "#ef4444",
];

function parseDate(value: string): Date {
  return new Date(`${value}T00:00:00`);
}

function formatDate(value: Date): string {
  const mm = `${value.getMonth() + 1}`.padStart(2, "0");
  const dd = `${value.getDate()}`.padStart(2, "0");
  return `${mm}/${dd}`;
}

function getMonthKey(value: Date): string {
  const month = `${value.getMonth() + 1}`.padStart(2, "0");
  return `${value.getFullYear()}-${month}`;
}

function getHomeAmount(amount: number, homeAmount?: number): number {
  return homeAmount ?? amount;
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

export default function DashboardScreen() {
  const { expenses, categories, currentUser, currencySettings } =
    useAppContext();
  const [range, setRange] = useState<DateRangeKey>("30d");
  const [categoryFilterId, setCategoryFilterId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const symbol = getCurrencySymbol(currencySettings.homeCurrency);

  const userExpenses = useMemo(
    () => expenses.filter((expense) => expense.userId === currentUser?.id),
    [expenses, currentUser?.id],
  );

  const filtered = useMemo(() => {
    const now = new Date();
    const rangeDays = range === "7d" ? 7 : range === "30d" ? 30 : null;
    const startDate = rangeDays
      ? new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate() - rangeDays + 1,
        )
      : null;

    const query = searchQuery.trim().toLowerCase();

    return userExpenses.filter((expense) => {
      if (categoryFilterId && expense.categoryId !== categoryFilterId)
        return false;
      if (startDate) {
        const date = parseDate(expense.date);
        if (date < startDate) return false;
      }
      if (query) {
        const inMerchant = expense.merchant?.toLowerCase().includes(query);
        const inNotes = expense.notes?.toLowerCase().includes(query);
        const inTags = expense.tags?.some((t) =>
          t.toLowerCase().includes(query),
        );
        if (!inMerchant && !inNotes && !inTags) return false;
      }
      return true;
    });
  }, [userExpenses, range, categoryFilterId, searchQuery]);

  const totalSpend = filtered.reduce(
    (sum, expense) => sum + getHomeAmount(expense.amount, expense.homeAmount),
    0,
  );

  // Today's spend
  const todayKey = new Date().toISOString().slice(0, 10);
  const todaySpend = userExpenses
    .filter((e) => e.date === todayKey)
    .reduce((sum, e) => sum + getHomeAmount(e.amount, e.homeAmount), 0);

  // Top category
  const topCategory = useMemo(() => {
    let topName = "—";
    let topTotal = 0;
    for (const category of categories) {
      const total = filtered
        .filter((e) => e.categoryId === category.id)
        .reduce((sum, e) => sum + getHomeAmount(e.amount, e.homeAmount), 0);
      if (total > topTotal) {
        topTotal = total;
        topName = category.name;
      }
    }
    return { name: topName, total: topTotal };
  }, [filtered, categories]);

  const totalsByCategory = categories.map((category, index) => {
    const total = filtered
      .filter((expense) => expense.categoryId === category.id)
      .reduce(
        (sum, expense) =>
          sum + getHomeAmount(expense.amount, expense.homeAmount),
        0,
      );
    return {
      label: category.name,
      value: total,
      frontColor: chartPalette[index % chartPalette.length],
    };
  });

  const budgetStatus = categories.map((category) => {
    const total = filtered
      .filter((expense) => expense.categoryId === category.id)
      .reduce(
        (sum, expense) =>
          sum + getHomeAmount(expense.amount, expense.homeAmount),
        0,
      );
    const percent = category.limit > 0 ? total / category.limit : 0;
    return { category, total, percent };
  });

  const pieData = totalsByCategory
    .filter((item) => item.value > 0)
    .map((item) => ({
      value: item.value,
      text: item.label,
      color: item.frontColor,
    }));

  const hasCategoryTotals = totalsByCategory.some((item) => item.value > 0);

  const rangeDaysForLine = range === "7d" ? 7 : 30;
  const lineSource = userExpenses.filter((expense) => {
    if (categoryFilterId && expense.categoryId !== categoryFilterId)
      return false;
    return true;
  });

  const lineData = useMemo(() => {
    const now = new Date();
    const points: Array<{ label: string; value: number }> = [];
    for (let i = rangeDaysForLine - 1; i >= 0; i -= 1) {
      const date = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate() - i,
      );
      const key = date.toISOString().slice(0, 10);
      const total = lineSource
        .filter((expense) => expense.date === key)
        .reduce(
          (sum, expense) =>
            sum + getHomeAmount(expense.amount, expense.homeAmount),
          0,
        );
      points.push({ label: formatDate(date), value: total });
    }
    return points;
  }, [lineSource, rangeDaysForLine]);

  const hasLineTotals = lineData.some((point) => point.value > 0);

  const comparison = useMemo(() => {
    const now = new Date();
    const currentKey = getMonthKey(now);
    const previous = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const previousKey = getMonthKey(previous);
    let currentTotal = 0;
    let previousTotal = 0;
    for (const expense of lineSource) {
      const date = parseDate(expense.date);
      const key = getMonthKey(date);
      if (key === currentKey) {
        currentTotal += getHomeAmount(expense.amount, expense.homeAmount);
      } else if (key === previousKey) {
        previousTotal += getHomeAmount(expense.amount, expense.homeAmount);
      }
    }
    return { currentTotal, previousTotal };
  }, [lineSource]);

  const hasComparisonTotals =
    comparison.currentTotal + comparison.previousTotal > 0;

  const getBudgetColor = (percent: number) => {
    if (percent >= 1) return colors.danger;
    if (percent >= 0.8) return "#EF9F27";
    return colors.success;
  };

  const getBudgetPillStyle = (percent: number) => {
    if (percent >= 1) return styles.heroPillDanger;
    if (percent >= 0.8) return styles.heroPillWarn;
    return styles.heroPillGood;
  };

  const getBudgetPillTextStyle = (percent: number) => {
    if (percent >= 1) return styles.heroPillTextDanger;
    if (percent >= 0.8) return styles.heroPillTextWarn;
    return styles.heroPillTextGood;
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <ExpenseListItem
            expense={item}
            category={categories.find((c) => c.id === item.categoryId)}
          />
        )}
        ListEmptyComponent={
          <Text style={styles.empty}>No expenses for this filter.</Text>
        }
        contentContainerStyle={
          filtered.length ? undefined : styles.emptyContainer
        }
        style={styles.list}
        ListHeaderComponent={
          <View>
            {/* Hero */}
            <View style={styles.header}>
              <View style={styles.headerRow}>
                <View>
                  <Text style={styles.headerEyebrow}>Good day,</Text>
                  <Text style={styles.headerTitle}>
                    {currentUser?.name ?? "User"}
                  </Text>
                </View>
                <View style={styles.headerBadge}>
                  <Text style={styles.headerBadgeText}>
                    {filtered.length} txns
                  </Text>
                </View>
              </View>
              <Text style={styles.headerTotal}>
                {symbol}
                {totalSpend.toFixed(2)}
              </Text>
              <Text style={styles.headerSubtitle}>Total spend this period</Text>

              {/* Budget health pills */}
              {budgetStatus.filter((b) => b.total > 0).length > 0 ? (
                <View style={styles.heroPillsRow}>
                  {budgetStatus
                    .filter((b) => b.total > 0)
                    .map(({ category, percent }) => (
                      <View
                        key={category.id}
                        style={[styles.heroPill, getBudgetPillStyle(percent)]}
                      >
                        <Text
                          style={[
                            styles.heroPillText,
                            getBudgetPillTextStyle(percent),
                          ]}
                        >
                          {category.name} {Math.round(percent * 100)}%
                        </Text>
                      </View>
                    ))}
                </View>
              ) : null}
            </View>

            {/* Quick stat cards */}
            <View style={styles.statRow}>
              <View style={styles.statCard}>
                <Text style={styles.statLabel}>Today</Text>
                <Text style={styles.statValue}>
                  {symbol}
                  {todaySpend.toFixed(2)}
                </Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statLabel}>Top category</Text>
                <Text style={styles.statValue} numberOfLines={1}>
                  {topCategory.name}
                </Text>
                {topCategory.total > 0 ? (
                  <Text style={styles.statSub}>
                    {symbol}
                    {topCategory.total.toFixed(2)}
                  </Text>
                ) : null}
              </View>
            </View>

            {/* Filters */}
            <View style={styles.filterCard}>
              <Text style={styles.sectionTitle}>Filters</Text>
              <TextInput
                placeholder="Search by merchant, notes, or tags"
                placeholderTextColor={colors.textMuted}
                value={searchQuery}
                onChangeText={setSearchQuery}
                style={styles.searchInput}
              />
              <View style={styles.filterRow}>
                {rangeOptions.map((option) => (
                  <TouchableOpacity
                    key={option.key}
                    style={[
                      styles.filterPill,
                      range === option.key && styles.filterPillActive,
                    ]}
                    onPress={() => setRange(option.key)}
                  >
                    <Text
                      style={[
                        styles.filterText,
                        range === option.key && styles.filterTextActive,
                      ]}
                    >
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              <View style={styles.filterRow}>
                <TouchableOpacity
                  style={[
                    styles.filterPill,
                    !categoryFilterId && styles.filterPillActive,
                  ]}
                  onPress={() => setCategoryFilterId(null)}
                >
                  <Text
                    style={[
                      styles.filterText,
                      !categoryFilterId && styles.filterTextActive,
                    ]}
                  >
                    All
                  </Text>
                </TouchableOpacity>
                {categories.map((category) => (
                  <TouchableOpacity
                    key={category.id}
                    style={[
                      styles.filterPill,
                      categoryFilterId === category.id &&
                        styles.filterPillActive,
                    ]}
                    onPress={() => setCategoryFilterId(category.id)}
                  >
                    <Text
                      style={[
                        styles.filterText,
                        categoryFilterId === category.id &&
                          styles.filterTextActive,
                      ]}
                    >
                      {category.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Charts */}
            <View style={styles.chartCard}>
              <Text style={styles.sectionTitle}>Spend by category</Text>
              {hasCategoryTotals ? (
                <BarChart
                  data={totalsByCategory}
                  barWidth={26}
                  spacing={22}
                  height={190}
                  yAxisColor={colors.border}
                  xAxisColor={colors.border}
                  noOfSections={4}
                  yAxisTextStyle={styles.axisText}
                  xAxisLabelTextStyle={styles.axisText}
                  barBorderRadius={10}
                />
              ) : (
                <Text style={styles.empty}>No category totals yet.</Text>
              )}
            </View>

            <View style={styles.chartCard}>
              <Text style={styles.sectionTitle}>Category split</Text>
              {pieData.length ? (
                <PieChart
                  data={pieData}
                  donut
                  radius={80}
                  innerRadius={50}
                  centerLabelComponent={() => (
                    <Text style={styles.pieCenter}>
                      {symbol}
                      {totalSpend.toFixed(0)}
                    </Text>
                  )}
                />
              ) : (
                <Text style={styles.empty}>No chart data yet.</Text>
              )}
            </View>

            <View style={styles.chartCard}>
              <Text style={styles.sectionTitle}>Daily spend</Text>
              {hasLineTotals ? (
                <LineChart
                  data={lineData}
                  color={colors.accent}
                  thickness={3}
                  hideRules
                  dataPointsColor={colors.accent}
                  yAxisColor={colors.border}
                  xAxisColor={colors.border}
                  xAxisLabelTextStyle={styles.axisText}
                  yAxisTextStyle={styles.axisText}
                  isAnimated
                />
              ) : (
                <Text style={styles.empty}>No daily spend yet.</Text>
              )}
            </View>

            <View style={styles.chartCard}>
              <Text style={styles.sectionTitle}>Month comparison</Text>
              {hasComparisonTotals ? (
                <BarChart
                  data={[
                    {
                      label: "Prev",
                      value: comparison.previousTotal,
                      frontColor: colors.surfaceMuted,
                    },
                    {
                      label: "This",
                      value: comparison.currentTotal,
                      frontColor: colors.accent,
                    },
                  ]}
                  barWidth={40}
                  spacing={28}
                  height={180}
                  yAxisColor={colors.border}
                  xAxisColor={colors.border}
                  yAxisTextStyle={styles.axisText}
                  xAxisLabelTextStyle={styles.axisText}
                  barBorderRadius={10}
                />
              ) : (
                <Text style={styles.empty}>No comparison data yet.</Text>
              )}
            </View>

            {/* Budgets */}
            <View style={styles.budgetCard}>
              <Text style={styles.sectionTitle}>Budgets</Text>
              {budgetStatus.map(({ category, total, percent }) => (
                <View key={category.id} style={styles.budgetRow}>
                  <View style={styles.budgetHeader}>
                    <Text style={styles.budgetName}>{category.name}</Text>
                    <Text style={styles.budgetAmount}>
                      {symbol}
                      {total.toFixed(2)} / {symbol}
                      {category.limit.toFixed(2)}
                    </Text>
                  </View>
                  <View style={styles.progressTrack}>
                    <View
                      style={[
                        styles.progressFill,
                        {
                          width: `${Math.min(percent, 1) * 100}%`,
                          backgroundColor: getBudgetColor(percent),
                        },
                      ]}
                    />
                  </View>
                  {percent >= 0.8 ? (
                    <Text
                      style={[
                        styles.budgetWarning,
                        { color: percent >= 1 ? colors.danger : "#EF9F27" },
                      ]}
                    >
                      {percent >= 1
                        ? "Limit reached"
                        : `Warning at ${Math.round(percent * 100)}%`}
                    </Text>
                  ) : null}
                </View>
              ))}
            </View>

            <Text style={styles.listHeader}>All expenses</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: colors.background,
  },
  header: {
    backgroundColor: colors.primary,
    borderRadius: radii.xl,
    padding: 24,
    marginBottom: 14,
    ...shadow.lift,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerEyebrow: {
    color: colors.accent,
    fontSize: 11,
    letterSpacing: 1.2,
    fontWeight: "700",
    textTransform: "uppercase",
    fontFamily: fonts.body,
  },
  headerTitle: {
    color: "#fff",
    fontSize: 22,
    fontFamily: fonts.heading,
    fontWeight: "700",
    marginTop: 2,
  },
  headerBadge: {
    backgroundColor: "rgba(255,255,255,0.12)",
    borderRadius: radii.pill,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  headerBadgeText: {
    color: "#fff",
    fontFamily: fonts.body,
    fontWeight: "600",
    fontSize: 12,
  },
  headerTotal: {
    color: "#fff",
    fontSize: 32,
    fontFamily: fonts.heading,
    fontWeight: "700",
    marginTop: 12,
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    color: "rgba(255,255,255,0.5)",
    fontFamily: fonts.body,
    marginTop: 4,
    fontSize: 12,
  },
  heroPillsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 12,
  },
  heroPill: {
    borderRadius: radii.pill,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 0.5,
  },
  heroPillText: {
    fontSize: 11,
    fontWeight: "600",
    fontFamily: fonts.body,
  },
  heroPillGood: {
    backgroundColor: "rgba(0,212,106,0.15)",
    borderColor: "rgba(0,212,106,0.3)",
  },
  heroPillTextGood: { color: colors.accent },
  heroPillWarn: {
    backgroundColor: "rgba(239,159,39,0.15)",
    borderColor: "rgba(239,159,39,0.3)",
  },
  heroPillTextWarn: { color: "#EF9F27" },
  heroPillDanger: {
    backgroundColor: "rgba(226,75,74,0.15)",
    borderColor: "rgba(226,75,74,0.3)",
  },
  heroPillTextDanger: { color: colors.danger },
  statRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 14,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    padding: 14,
    borderWidth: 0.5,
    borderColor: colors.border,
    ...shadow.soft,
  },
  statLabel: {
    fontSize: 11,
    color: colors.textMuted,
    fontFamily: fonts.body,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 18,
    fontWeight: "700",
    fontFamily: fonts.heading,
    color: colors.text,
  },
  statSub: {
    fontSize: 11,
    color: colors.textMuted,
    fontFamily: fonts.body,
    marginTop: 2,
  },
  searchInput: {
    borderWidth: 1,
    borderColor: "transparent",
    borderRadius: radii.md,
    padding: 14,
    marginBottom: 10,
    backgroundColor: colors.surfaceMuted,
    fontFamily: fonts.body,
    color: colors.text,
    fontSize: 14,
  },
  chartCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: 16,
    borderWidth: 0.5,
    borderColor: colors.border,
    marginBottom: 14,
    ...shadow.soft,
  },
  filterCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: 16,
    borderWidth: 0.5,
    borderColor: colors.border,
    marginBottom: 14,
    ...shadow.soft,
  },
  filterRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 8,
    gap: 6,
  },
  filterPill: {
    borderWidth: 0.5,
    borderColor: colors.border,
    borderRadius: radii.pill,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: colors.surfaceMuted,
  },
  filterPillActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterText: {
    color: colors.text,
    fontFamily: fonts.body,
    fontWeight: "600",
    fontSize: 12,
  },
  filterTextActive: { color: "#fff" },
  budgetCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: 16,
    borderWidth: 0.5,
    borderColor: colors.border,
    marginBottom: 20,
    ...shadow.soft,
  },
  sectionTitle: {
    fontSize: 15,
    fontFamily: fonts.heading,
    fontWeight: "700",
    marginBottom: 12,
    color: colors.text,
  },
  listHeader: {
    fontSize: 15,
    fontFamily: fonts.heading,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 10,
  },
  budgetRow: { marginBottom: 12 },
  budgetHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 5,
  },
  budgetName: {
    fontFamily: fonts.body,
    fontWeight: "600",
    color: colors.text,
    fontSize: 13,
  },
  budgetAmount: {
    fontFamily: fonts.mono,
    fontSize: 11,
    color: colors.textMuted,
  },
  progressTrack: {
    height: 4,
    backgroundColor: colors.surfaceMuted,
    borderRadius: radii.pill,
    overflow: "hidden",
  },
  progressFill: {
    height: 4,
    borderRadius: radii.pill,
  },
  budgetWarning: {
    marginTop: 3,
    fontFamily: fonts.body,
    fontSize: 11,
  },
  axisText: {
    color: colors.textMuted,
    fontFamily: fonts.body,
    fontSize: 10,
  },
  pieCenter: {
    fontFamily: fonts.heading,
    fontWeight: "700",
    color: colors.text,
    fontSize: 13,
  },
  list: { marginTop: 0 },
  emptyContainer: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  empty: {
    color: colors.textMuted,
    fontFamily: fonts.body,
    fontSize: 13,
  },
});
