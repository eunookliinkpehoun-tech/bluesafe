import { router } from "expo-router";
import { useMemo, useState } from "react";
import { RefreshControl, ScrollView, Text, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ChipRow } from "@/src/components/ChipRow";
import { CosmicBackground } from "@/src/components/CosmicBackground";
import { TAB_BAR_HEIGHT, tabBottom, useTabSpace } from "@/src/components/FloatingTabBar";
import { Icon } from "@/src/components/Icon";
import { PressableScale } from "@/src/components/PressableScale";
import { ScreenHeader } from "@/src/components/ScreenHeader";
import { PrimaryButton } from "@/src/components/ui";
import { useVaultView } from "@/src/hooks/useVault";
import { dateLabel, useI18n } from "@/src/i18n";
import { CATEGORY, CATEGORY_IDS } from "@/src/lib/categories";
import type { SubAccount } from "@/src/lib/chain";
import { fmtAmount, fmtUsd } from "@/src/lib/format";
import { useApp } from "@/src/state/app";
import { useOverlay } from "@/src/state/overlay";
import { fonts, makeStyles, useTheme } from "@/src/theme";

function SubRow({ s, index, active, onPress, onMenu }: { s: SubAccount; index: number; active: boolean; onPress: () => void; onMenu: () => void }) {
  const styles = useStyles();
  const { colors } = useTheme();
  const { t, dict } = useI18n();
  const cat = CATEGORY[s.category] ?? CATEGORY[4];
  const tint = colors[cat.color] as string;
  const locked = s.unlockAt * 1000 > Date.now();
  return (
    <Animated.View entering={FadeInDown.delay(Math.min(index, 6) * 40).duration(260)}>
      <PressableScale testID={`sub-card-${s.id}`} onPress={onPress} scaleTo={0.985} style={[styles.row, active && styles.rowActive]}>
        <View style={[styles.rowIcon, { backgroundColor: `${tint}1F`, borderColor: `${tint}40` }]}>
          <Icon name={cat.icon} size={20} color={tint} />
        </View>
        <View style={styles.rowText}>
          <Text style={styles.rowName} numberOfLines={1}>
            {s.name}
          </Text>
          <View style={styles.badges}>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{t(`subs.c${s.category}`)}</Text>
            </View>
            <View style={[styles.badge, locked ? styles.badgeLocked : styles.badgeFree]}>
              {locked ? <Icon name="lock" size={10} color={colors.accentAmber} /> : null}
              <Text style={[styles.badgeText, locked ? styles.badgeTextLocked : styles.badgeTextFree]}>
                {locked ? t("subs.locked", { date: dateLabel(s.unlockAt, dict) }) : t("subs.noLock")}
              </Text>
            </View>
            <View style={styles.badge}>
              <Text style={[styles.badgeText, styles.badgeAmount]} testID={`sub-card-balance-${s.id}`}>
                {t("subs.balanceApprox", { amount: fmtUsd(s.balance) })}
              </Text>
            </View>
          </View>
        </View>
        <View style={styles.rowRight}>
          {active ? (
            <View style={styles.activeDot} testID={`sub-active-${s.id}`}>
              <Icon name="check" size={12} color={colors.onBrandPrimary} strokeWidth={3} />
            </View>
          ) : null}
          <PressableScale testID={`sub-menu-${s.id}`} accessibilityLabel={t("subs.actionsTitle")} onPress={onMenu} style={styles.menuBtn} hitSlop={6}>
            <Icon name="more" size={20} color={colors.textSoft} />
          </PressableScale>
        </View>
      </PressableScale>
    </Animated.View>
  );
}

export default function SubAccounts() {
  const styles = useStyles();
  const { colors } = useTheme();
  const { t } = useI18n();
  const insets = useSafeAreaInsets();
  const tabSpace = useTabSpace();
  const { open, setTarget } = useOverlay();
  const { activeAccount, setActiveAccount } = useApp();
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
        contentContainerStyle={{ paddingBottom: tabSpace + 80 }}
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
          <View style={styles.listHead}>
            <Text style={styles.listTitle}>{t("subs.listTitle")}</Text>
            <View style={styles.countBadge}>
              <Text style={styles.countText}>{shown.length}</Text>
            </View>
          </View>
          {shown.length === 0 ? (
            <View style={styles.empty} testID="subaccounts-empty">
              <Icon name="layers" size={30} color={colors.accentBlue} strokeWidth={1.6} />
              <Text style={styles.emptyTitle}>{t("subs.empty")}</Text>
              <Text style={styles.emptySub}>{t("subs.emptySub")}</Text>
            </View>
          ) : (
            shown.map((s, i) => (
              <SubRow
                key={s.id}
                s={s}
                index={i}
                active={activeAccount === s.id}
                onPress={() => {
                  setActiveAccount(s.id);
                  router.navigate("/(tabs)");
                }}
                onMenu={() => {
                  setTarget(s.id);
                  open("subActions");
                }}
              />
            ))
          )}
        </View>
      </ScrollView>
      <View pointerEvents="box-none" style={[styles.ctaBar, { bottom: tabBottom(insets.bottom) + TAB_BAR_HEIGHT + 12 }]}>
        <PrimaryButton testID="subaccounts-create-button" icon="plus" label={t("subs.create")} onPress={() => open("createSub")} style={styles.cta} />
      </View>
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
  totalValue: { color: c.textStrong, fontSize: 34, fontFamily: fonts.display, letterSpacing: -0.5, fontVariant: ["tabular-nums"] },
  totalUnit: { color: c.muted, fontSize: 12 },
  bar: { height: 8, flexDirection: "row", gap: 2, padding: 1, borderRadius: 4, backgroundColor: c.track, overflow: "hidden" },
  barEmpty: { flex: 1 },
  segment: { height: "100%", borderRadius: 3 },
  legend: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", gap: 8, marginTop: 12 },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { color: c.muted, fontSize: 11 },
  sticky: { backgroundColor: c.stickyBar, width: "100%", maxWidth: 560, alignSelf: "center" },
  list: { gap: 10 },
  listHead: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 4, marginTop: 4, marginBottom: 2 },
  listTitle: { color: c.textStrong, fontSize: 17, fontWeight: "700" },
  countBadge: { minWidth: 24, paddingHorizontal: 8, height: 22, borderRadius: 11, alignItems: "center", justifyContent: "center", backgroundColor: c.brandTertiary },
  countText: { color: c.accentBlue, fontSize: 12, fontWeight: "800", textAlign: "center" },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    minHeight: 76,
    paddingVertical: 12,
    paddingStart: 14,
    paddingEnd: 6,
    borderRadius: 20,
    backgroundColor: c.surfaceSecondary,
    borderWidth: 1,
    borderColor: c.border,
  },
  rowActive: { borderColor: c.emeraldBorder },
  rowIcon: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center", borderWidth: 1 },
  rowText: { flex: 1, minWidth: 0, gap: 6 },
  rowName: { color: c.textStrong, fontSize: 16, fontWeight: "700" },
  badges: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  badge: { flexDirection: "row", alignItems: "center", gap: 4, height: 22, paddingHorizontal: 8, borderRadius: 7, borderWidth: 1, borderColor: c.white15 },
  badgeLocked: { borderColor: c.amberSoft, backgroundColor: c.amberSoft },
  badgeFree: { borderColor: c.emeraldBorder },
  badgeText: { color: c.textSoft, fontSize: 11, fontWeight: "600" },
  badgeTextLocked: { color: c.accentAmber },
  badgeTextFree: { color: c.accentEmerald },
  badgeAmount: { color: c.textStrong, fontFamily: fonts.display },
  rowRight: { flexDirection: "row", alignItems: "center", gap: 2 },
  activeDot: { width: 22, height: 22, borderRadius: 11, alignItems: "center", justifyContent: "center", backgroundColor: c.accentEmerald },
  menuBtn: { width: 40, height: 44, alignItems: "center", justifyContent: "center", borderRadius: 14 },
  empty: { alignItems: "center", gap: 8, padding: 28, borderRadius: 18, backgroundColor: c.glass, borderWidth: 1, borderColor: c.border },
  emptyTitle: { color: c.textStrong, fontSize: 15, fontWeight: "700" },
  emptySub: { color: c.muted, fontSize: 13, textAlign: "center", lineHeight: 19 },
  ctaBar: { position: "absolute", start: 0, end: 0, paddingHorizontal: 20, alignItems: "center" },
  cta: { width: "100%", maxWidth: 520 },
}));
