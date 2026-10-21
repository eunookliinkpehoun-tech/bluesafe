import { router } from "expo-router";
import { useMemo, useState } from "react";
import { RefreshControl, ScrollView, Text, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";

import { ChipRow } from "@/src/components/ChipRow";
import { CosmicBackground } from "@/src/components/CosmicBackground";
import { useTabSpace } from "@/src/components/FloatingTabBar";
import { Icon } from "@/src/components/Icon";
import { PressableScale } from "@/src/components/PressableScale";
import { ScreenHeader } from "@/src/components/ScreenHeader";
import { IconTile, PrimaryButton, ProgressBar } from "@/src/components/ui";
import { useVaultView } from "@/src/hooks/useVault";
import { dateLabel, useI18n } from "@/src/i18n";
import { CATEGORY, CATEGORY_IDS } from "@/src/lib/categories";
import type { SubAccount } from "@/src/lib/chain";
import { fmtAmount, fmtUsd, pct } from "@/src/lib/format";
import { useApp } from "@/src/state/app";
import { useOverlay } from "@/src/state/overlay";
import { makeStyles, useTheme } from "@/src/theme";

function SubCard({ s, index, onPress }: { s: SubAccount; index: number; onPress: () => void }) {
  const styles = useStyles();
  const { colors } = useTheme();
  const { t, dict } = useI18n();
  const cat = CATEGORY[s.category] ?? CATEGORY[4];
  const tint = colors[cat.color] as string;
  const locked = s.unlockAt * 1000 > Date.now();
  const progress = pct(s.balance, s.target);
  return (
    <Animated.View entering={FadeInDown.delay(Math.min(index, 6) * 60).duration(400)}>
      <PressableScale testID={`sub-card-${s.id}`} onPress={onPress} scaleTo={0.985} style={styles.card}>
        <View style={styles.cardTop}>
          <View style={styles.cardLeft}>
            <IconTile icon={cat.icon} tint={tint} size={44} />
            <View style={styles.cardText}>
              <Text style={styles.cardName} numberOfLines={1}>
                {s.name}
              </Text>
              <Text style={[styles.cardSub, { color: tint }]} numberOfLines={1}>
                {locked ? t("subs.locked", { date: dateLabel(s.unlockAt, dict) }) : t("subs.flexible")}
              </Text>
            </View>
          </View>
          <View style={styles.cardRight}>
            <Text style={styles.cardAmount} testID={`sub-card-balance-${s.id}`}>
              {fmtUsd(s.balance)}
            </Text>
            {s.target > 0n ? (
              <Text style={styles.cardOf}>/ {fmtUsd(s.target)}</Text>
            ) : (
              <View style={[styles.status, locked && styles.statusLocked]}>
                {locked ? <Icon name="lock" size={10} color={colors.accentAmber} /> : null}
                <Text style={[styles.statusText, locked && styles.statusTextLocked]}>{t("subs.protected")}</Text>
              </View>
            )}
          </View>
        </View>
        {s.target > 0n ? (
          <View style={styles.progress}>
            <View style={styles.progressRow}>
              <Text style={styles.progressLabel}>{progress >= 100 ? t("subs.goalReached") : t("subs.progress")}</Text>
              <Text style={[styles.progressValue, { color: tint }]}>
                {Math.round(progress)}% · {t("subs.remaining", { amount: `$${fmtAmount(s.target > s.balance ? s.target - s.balance : 0n)}` })}
              </Text>
            </View>
            <ProgressBar value={progress} colorsFrom={[colors[cat.gradient[0]] as string, colors[cat.gradient[1]] as string]} />
          </View>
        ) : (
          <View style={styles.footerRow}>
            <Text style={styles.footerText}>{t(`subs.c${s.category}`)}</Text>
            <Text style={styles.footerValue}>{dateLabel(s.createdAt, dict)}</Text>
          </View>
        )}
      </PressableScale>
    </Animated.View>
  );
}

export default function SubAccounts() {
  const styles = useStyles();
  const { colors } = useTheme();
  const { t } = useI18n();
  const tabSpace = useTabSpace();
  const { open } = useOverlay();
  const { setActiveAccount } = useApp();
  const { view, refreshing, refetch } = useVaultView();
  const [cat, setCat] = useState<number | "all">("all");
  const subs = useMemo(() => view?.subs ?? [], [view]);
  const allocated = subs.reduce((s, x) => s + x.balance, 0n);
  const shown = cat === "all" ? subs : subs.filter((s) => s.category === cat);

  const segments = CATEGORY_IDS.map((id) => ({
    id,
    value: subs.filter((s) => s.category === id).reduce((a, s) => a + s.balance, 0n),
  })).filter((x) => x.value > 0n);

  return (
    <View style={styles.root} testID="subaccounts-screen">
      <CosmicBackground variant="vaults" />
      <ScreenHeader
        testID="subaccounts-header"
        title={t("subs.title")}
        subtitle={t("subs.subtitle")}
        onBack={() => router.navigate("/(tabs)")}
        action={{ icon: "plus", accent: true, onPress: () => open("createSub"), testID: "subaccounts-add-button", label: t("subs.create") }}
      />
      <ScrollView
        stickyHeaderIndices={[1]}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: tabSpace }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => refetch()} tintColor={colors.brandPrimary} />}
      >
        <View style={styles.pad}>
          <Animated.View entering={FadeInDown.duration(450)} style={styles.total} testID="subaccounts-total-card">
            <View style={styles.totalGlow} />
            <Text style={styles.upper}>{t("subs.allocated")}</Text>
            <View style={styles.totalRow}>
              <Text style={styles.totalValue} testID="subaccounts-total">
                ${fmtAmount(allocated)}
              </Text>
              <Text style={styles.totalUnit}>USDT</Text>
            </View>
            <View style={styles.bar}>
              {segments.length === 0 ? <View style={styles.barEmpty} /> : null}
              {segments.map((sg) => (
                <View
                  key={sg.id}
                  style={[styles.segment, { flex: Number((sg.value * 1000n) / (allocated || 1n)) || 1, backgroundColor: colors[CATEGORY[sg.id].color] as string }]}
                />
              ))}
            </View>
            <View style={styles.legend}>
              {CATEGORY_IDS.slice(0, 4).map((id) => (
                <View key={id} style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: colors[CATEGORY[id].color] as string }]} />
                  <Text style={styles.legendText}>{t(`subs.c${id}`)}</Text>
                </View>
              ))}
            </View>
          </Animated.View>
        </View>
        <View style={styles.sticky}>
          <ChipRow
            items={[
              { key: "all" as const, label: `${t("subs.all")} (${subs.length})` },
              ...CATEGORY_IDS.map((id) => ({ key: id, label: t(`subs.c${id}`) })),
            ]}
            value={cat}
            onChange={setCat}
            testIDPrefix="subaccounts-chip"
          />
        </View>
        <View style={[styles.pad, styles.list]}>
          {shown.length === 0 ? (
            <View style={styles.empty} testID="subaccounts-empty">
              <Icon name="layers" size={30} color={colors.accentBlue} strokeWidth={1.6} />
              <Text style={styles.emptyTitle}>{t("subs.empty")}</Text>
              <Text style={styles.emptySub}>{t("subs.emptySub")}</Text>
            </View>
          ) : (
            shown.map((s, i) => (
              <SubCard
                key={s.id}
                s={s}
                index={i}
                onPress={() => {
                  setActiveAccount(s.id);
                  router.navigate("/(tabs)");
                }}
              />
            ))
          )}
          <PrimaryButton testID="subaccounts-create-button" icon="plus" label={t("subs.create")} onPress={() => open("createSub")} style={styles.cta} />
        </View>
      </ScrollView>
    </View>
  );
}

const useStyles = makeStyles((c) => ({
  root: { flex: 1, backgroundColor: c.canvas },
  pad: { paddingHorizontal: 20, width: "100%", maxWidth: 560, alignSelf: "center", paddingTop: 8 },
  total: { padding: 20, borderRadius: 24, backgroundColor: c.glass, borderWidth: 1, borderColor: c.border, borderTopColor: c.glassHighlight, overflow: "hidden" },
  totalGlow: { position: "absolute", top: -48, end: -48, width: 130, height: 130, borderRadius: 65, backgroundColor: c.blueSoft },
  upper: { color: c.muted, fontSize: 11, fontWeight: "600", letterSpacing: 1, textTransform: "uppercase" },
  totalRow: { flexDirection: "row", alignItems: "baseline", gap: 6, marginTop: 8, marginBottom: 16 },
  totalValue: { color: c.textStrong, fontSize: 30, fontWeight: "800", letterSpacing: -0.5, fontVariant: ["tabular-nums"] },
  totalUnit: { color: c.muted, fontSize: 12 },
  bar: { height: 8, flexDirection: "row", gap: 2, padding: 1, borderRadius: 4, backgroundColor: c.track, overflow: "hidden" },
  barEmpty: { flex: 1 },
  segment: { height: "100%", borderRadius: 3 },
  legend: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", gap: 8, marginTop: 12 },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { color: c.muted, fontSize: 11 },
  sticky: { backgroundColor: c.canvas, width: "100%", maxWidth: 560, alignSelf: "center" },
  list: { gap: 14 },
  card: { padding: 16, borderRadius: 18, backgroundColor: c.glass, borderWidth: 1, borderColor: c.border, borderTopColor: c.glassHighlight },
  cardTop: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: 12 },
  cardLeft: { flexDirection: "row", alignItems: "center", gap: 12, flex: 1, minWidth: 0 },
  cardText: { flex: 1, minWidth: 0 },
  cardName: { color: c.textStrong, fontSize: 14, fontWeight: "600" },
  cardSub: { fontSize: 11, fontWeight: "500", marginTop: 3, opacity: 0.85 },
  cardRight: { alignItems: "flex-end", gap: 3 },
  cardAmount: { color: c.textStrong, fontSize: 14, fontWeight: "800", fontVariant: ["tabular-nums"] },
  cardOf: { color: c.muted, fontSize: 11 },
  status: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 6, height: 20, borderRadius: 6, backgroundColor: c.emeraldSoft },
  statusLocked: { backgroundColor: c.amberSoft },
  statusText: { color: c.accentEmerald, fontSize: 10, fontWeight: "700" },
  statusTextLocked: { color: c.accentAmber },
  progress: { marginTop: 14, gap: 6 },
  progressRow: { flexDirection: "row", justifyContent: "space-between", gap: 8 },
  progressLabel: { color: c.muted, fontSize: 10 },
  progressValue: { fontSize: 10, fontWeight: "700" },
  footerRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 12, paddingTop: 10, borderTopWidth: 1, borderTopColor: c.divider },
  footerText: { color: c.muted, fontSize: 11 },
  footerValue: { color: c.textSoft, fontSize: 11, fontWeight: "500" },
  empty: { alignItems: "center", gap: 8, padding: 28, borderRadius: 18, backgroundColor: c.glass, borderWidth: 1, borderColor: c.border },
  emptyTitle: { color: c.textStrong, fontSize: 15, fontWeight: "700" },
  emptySub: { color: c.muted, fontSize: 13, textAlign: "center", lineHeight: 19 },
  cta: { marginTop: 4 },
}));
