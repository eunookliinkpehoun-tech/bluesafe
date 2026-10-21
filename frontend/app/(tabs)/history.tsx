import { router } from "expo-router";
import { useMemo, useState } from "react";
import { RefreshControl, ScrollView, Text, TextInput, View } from "react-native";

import { ChipRow } from "@/src/components/ChipRow";
import { CosmicBackground } from "@/src/components/CosmicBackground";
import { useTabSpace } from "@/src/components/FloatingTabBar";
import { Icon } from "@/src/components/Icon";
import { ScreenHeader } from "@/src/components/ScreenHeader";
import { TxRow } from "@/src/components/TxRow";
import { useActiveSub, useTxs, useVaultView } from "@/src/hooks/useVault";
import { dayLabel, useI18n } from "@/src/i18n";
import type { UiTx } from "@/src/lib/entries";
import { fmtAmount } from "@/src/lib/format";
import { useOverlay } from "@/src/state/overlay";
import { makeStyles, useTheme } from "@/src/theme";

type Filter = "all" | "income" | "expense" | "transfer";

export default function History() {
  const styles = useStyles();
  const { colors } = useTheme();
  const { t, dict } = useI18n();
  const tabSpace = useTabSpace();
  const { period, open } = useOverlay();
  const { view, refreshing, refetch } = useVaultView();
  const sub = useActiveSub(view);
  const txs = useTxs(sub ? sub.id : "main");
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");

  const monthStart = useMemo(() => {
    const d = new Date();
    d.setDate(1);
    d.setHours(0, 0, 0, 0);
    return d.getTime() / 1000;
  }, []);

  const month = useMemo(() => {
    let inc = 0n;
    let out = 0n;
    for (const x of txs) {
      if (x.timestamp < monthStart || x.internal) continue;
      if (x.sign === "+") inc += x.amount;
      else out += x.amount;
    }
    return { inc, out };
  }, [txs, monthStart]);

  const groups = useMemo(() => {
    const now = Date.now() / 1000;
    const minTs = period === "month" ? monthStart : period === "week" ? now - 7 * 86400 : 0;
    const q = query.trim().toLowerCase();
    const list = txs.filter(
      (x) =>
        x.timestamp >= minTs &&
        (filter === "all" || x.category === filter) &&
        (!q || x.title.toLowerCase().includes(q) || fmtAmount(x.amount).includes(q) || (x.counterparty ?? "").toLowerCase().includes(q)),
    );
    const map = new Map<string, UiTx[]>();
    for (const x of list) {
      const label = dayLabel(x.timestamp, dict);
      map.set(label, [...(map.get(label) ?? []), x]);
    }
    return Array.from(map.entries());
  }, [txs, filter, query, period, monthStart, dict]);

  const chips: { key: Filter; label: string }[] = [
    { key: "all", label: t("history.all") },
    { key: "income", label: t("history.revenue") },
    { key: "expense", label: t("history.spending") },
    { key: "transfer", label: t("history.transfers") },
  ];

  let rowIndex = 0;
  return (
    <View style={styles.root} testID="history-screen">
      <CosmicBackground variant="history" />
      <ScreenHeader
        testID="history-header"
        title={t("history.title")}
        subtitle={sub ? sub.name : undefined}
        subtitleAccent
        onBack={() => router.navigate("/(tabs)")}
        action={{ icon: "sliders", onPress: () => open("period"), testID: "history-filter-button", label: t("history.periodTitle") }}
      />
      <ScrollView
        stickyHeaderIndices={[2]}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: tabSpace }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => refetch()} tintColor={colors.brandPrimary} />}
      >
        <View style={styles.pad}>
          <View style={styles.summary} testID="history-month-summary">
            <View style={styles.summaryHead}>
              <Text style={styles.summaryTitle}>{t("history.month", { month: dict.monthsLong[new Date().getMonth()] })}</Text>
            </View>
            <View style={styles.summaryGrid}>
              <View style={styles.summaryBox}>
                <View style={styles.summaryLabelRow}>
                  <Icon name="arrowIn" size={14} color={colors.accentEmerald} strokeWidth={2.5} />
                  <Text style={[styles.summaryLabel, { color: colors.accentEmerald }]}>{t("history.income")}</Text>
                </View>
                <Text style={styles.summaryValue} testID="history-month-in">
                  +${fmtAmount(month.inc)}
                </Text>
              </View>
              <View style={styles.summaryBox}>
                <View style={styles.summaryLabelRow}>
                  <Icon name="arrowOut" size={14} color={colors.accentRose} strokeWidth={2.5} />
                  <Text style={[styles.summaryLabel, { color: colors.accentRose }]}>{t("history.expenses")}</Text>
                </View>
                <Text style={styles.summaryValue} testID="history-month-out">
                  -${fmtAmount(month.out)}
                </Text>
              </View>
            </View>
          </View>
        </View>
        <View style={styles.pad}>
          <View style={styles.search}>
            <Icon name="search" size={16} color={colors.muted} />
            <TextInput
              testID="history-search-input"
              value={query}
              onChangeText={setQuery}
              placeholder={t("history.search")}
              placeholderTextColor={colors.muted}
              style={styles.searchInput}
              autoCorrect={false}
            />
          </View>
        </View>
        <View style={styles.sticky}>
          <ChipRow items={chips} value={filter} onChange={setFilter} testIDPrefix="history-chip" />
        </View>
        {groups.length === 0 ? (
          <View style={styles.empty} testID="history-empty">
            <Icon name="clock" size={28} color={colors.muted} />
            <Text style={styles.emptyText}>{t("history.empty")}</Text>
          </View>
        ) : (
          groups.map(([label, items]) => (
            <View key={label} style={styles.group}>
              <Text style={styles.groupLabel}>{label}</Text>
              {items.map((tx) => (
                <TxRow key={tx.id} tx={tx} index={rowIndex++} colored />
              ))}
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const useStyles = makeStyles((c) => ({
  root: { flex: 1, backgroundColor: c.canvas },
  pad: { paddingHorizontal: 20, width: "100%", maxWidth: 560, alignSelf: "center", paddingTop: 8 },
  summary: { padding: 16, borderRadius: 16, backgroundColor: c.glass, borderWidth: 1, borderColor: c.border, borderTopColor: c.glassHighlight },
  summaryHead: { marginBottom: 12 },
  summaryTitle: { color: c.muted, fontSize: 11, fontWeight: "600", letterSpacing: 0.8, textTransform: "uppercase" },
  summaryGrid: { flexDirection: "row", gap: 12 },
  summaryBox: { flex: 1, padding: 10, borderRadius: 12, backgroundColor: c.track, borderWidth: 1, borderColor: c.divider },
  summaryLabelRow: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 4 },
  summaryLabel: { fontSize: 11, fontWeight: "500" },
  summaryValue: { color: c.textStrong, fontSize: 16, fontWeight: "700", fontVariant: ["tabular-nums"] },
  search: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    height: 48,
    paddingHorizontal: 14,
    borderRadius: 14,
    backgroundColor: c.glass,
    borderWidth: 1,
    borderColor: c.white10,
  },
  searchInput: { flex: 1, color: c.textStrong, fontSize: 14, height: "100%", outlineStyle: "none" } as any,
  sticky: { backgroundColor: c.canvas, width: "100%", maxWidth: 560, alignSelf: "center" },
  group: { paddingHorizontal: 20, gap: 10, marginTop: 8, marginBottom: 8, width: "100%", maxWidth: 560, alignSelf: "center" },
  groupLabel: { color: c.muted, fontSize: 12, fontWeight: "600", letterSpacing: 1, textTransform: "uppercase", paddingHorizontal: 4 },
  empty: { alignItems: "center", gap: 10, paddingVertical: 48 },
  emptyText: { color: c.muted, fontSize: 14 },
}));
