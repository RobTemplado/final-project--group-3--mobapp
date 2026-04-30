import React, { useMemo, useState } from "react";
import {
  FlatList,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { BarChart, LineChart, PieChart } from "react-native-gifted-charts";
import ExpenseListItem from "../components/ExpenseListItem";
import { useAppContext } from "../context/AppContext";
import { colors } from "../utils/theme";
import styles from "../styles/screens/DashboardScreenStyles";

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
  const [expandedChart, setExpandedChart] = useState<string | null>(null);

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
        contentContainerStyle={[
          styles.contentContainer,
          !filtered.length && styles.emptyContainer,
        ]}
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
                    {filtered.length} Transactions
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

            {/* Search and Filters */}
            <TextInput
              placeholder="Search by merchant, notes, or tags"
              placeholderTextColor={colors.textMuted}
              value={searchQuery}
              onChangeText={setSearchQuery}
              style={styles.searchInput}
            />
            
            {/* Date Range Filters */}
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
            
            {/* Category Filters */}
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

            {/* Charts Container */}
            <View style={styles.chartsContainer}>
              <Text style={[styles.sectionTitle, styles.chartsTitle]}>Analytics</Text>
              
              {expandedChart === null ? (
                <View>
                  {/* Grid of charts */}
                  <View style={styles.chartsGrid}>
                    {/* Spend by category */}
                    <TouchableOpacity
                      style={styles.chartThumbnail}
                      onPress={() => setExpandedChart("category")}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.chartThumbnailTitle}>Spend by category</Text>
                      {hasCategoryTotals ? (
                        <BarChart
                          data={totalsByCategory}
                          barWidth={12}
                          spacing={8}
                          height={100}
                          yAxisColor={colors.border}
                          xAxisColor={colors.border}
                          noOfSections={3}
                          yAxisTextStyle={[styles.axisText, { fontSize: 8 }]}
                          xAxisLabelTextStyle={[styles.axisText, { fontSize: 8 }]}
                          barBorderRadius={5}
                        />
                      ) : (
                        <Text style={styles.empty}>No data</Text>
                      )}
                    </TouchableOpacity>

                    {/* Category split */}
                    <TouchableOpacity
                      style={styles.chartThumbnail}
                      onPress={() => setExpandedChart("pie")}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.chartThumbnailTitle}>Category split</Text>
                      {pieData.length ? (
                        <PieChart
                          data={pieData}
                          donut
                          radius={45}
                          innerRadius={25}
                          centerLabelComponent={() => (
                            <Text style={[styles.pieCenter, { fontSize: 10 }]}>
                              {symbol}
                              {totalSpend.toFixed(0)}
                            </Text>
                          )}
                        />
                      ) : (
                        <Text style={styles.empty}>No data</Text>
                      )}
                    </TouchableOpacity>

                    {/* Daily spend */}
                    <TouchableOpacity
                      style={styles.chartThumbnail}
                      onPress={() => setExpandedChart("line")}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.chartThumbnailTitle}>Daily spend</Text>
                      {hasLineTotals ? (
                        <LineChart
                          data={lineData}
                          color={colors.accent}
                          thickness={2}
                          hideRules
                          dataPointsColor={colors.accent}
                          yAxisColor={colors.border}
                          xAxisColor={colors.border}
                          xAxisLabelTextStyle={[styles.axisText, { fontSize: 8 }]}
                          yAxisTextStyle={[styles.axisText, { fontSize: 8 }]}
                          isAnimated
                          height={100}
                        />
                      ) : (
                        <Text style={styles.empty}>No data</Text>
                      )}
                    </TouchableOpacity>

                    {/* Month comparison */}
                    <TouchableOpacity
                      style={styles.chartThumbnail}
                      onPress={() => setExpandedChart("comparison")}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.chartThumbnailTitle}>Month comparison</Text>
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
                          barWidth={16}
                          spacing={16}
                          height={100}
                          yAxisColor={colors.border}
                          xAxisColor={colors.border}
                          yAxisTextStyle={[styles.axisText, { fontSize: 8 }]}
                          xAxisLabelTextStyle={[styles.axisText, { fontSize: 8 }]}
                          barBorderRadius={5}
                        />
                      ) : (
                        <Text style={styles.empty}>No data</Text>
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <View style={styles.chartExpandedContainer}>
                  <TouchableOpacity
                    onPress={() => setExpandedChart(null)}
                    style={styles.closeChartsButton}
                  >
                    <Text style={styles.closeChartsText}>← Back to charts</Text>
                  </TouchableOpacity>

                  {expandedChart === "category" && (
                    <View>
                      <Text style={styles.chartExpandedTitle}>Spend by category</Text>
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
                  )}

                  {expandedChart === "pie" && (
                    <View>
                      <Text style={styles.chartExpandedTitle}>Category split</Text>
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
                  )}

                  {expandedChart === "line" && (
                    <View>
                      <Text style={styles.chartExpandedTitle}>Daily spend</Text>
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
                          height={240}
                        />
                      ) : (
                        <Text style={styles.empty}>No daily spend yet.</Text>
                      )}
                    </View>
                  )}

                  {expandedChart === "comparison" && (
                    <View>
                      <Text style={styles.chartExpandedTitle}>Month comparison</Text>
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
                  )}
                </View>
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

