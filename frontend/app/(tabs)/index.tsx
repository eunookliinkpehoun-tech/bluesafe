import { router } from "expo-router";
import { ActivityIndicator, RefreshControl, ScrollView, Text, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AddressPill } from "@/src/components/AddressPill";
import { Avatar } from "@/src/components/Avatar";
import { CosmicBackground } from "@/src/components/CosmicBackground";
import { useTabSpace } from "@/src/components/FloatingTabBar";
import { Icon, type IconName } from "@/src/components/Icon";
import { PressableScale } from "@/src/components/PressableScale";
import { TxRow } from "@/src/components/TxRow";
import { CircleButton, GhostButton, ProgressBar } from "@/src/components/ui";
import { useActiveSub, useAutoSync, useTxs, useVaultView } from "@/src/hooks/useVault";
import { dateLabel, useI18n } from "@/src/i18n";
import { CATEGORY } from "@/src/lib/categories";
import { fmtAmount, fmtUsd, pct } from "@/src/lib/format";
import { useApp } from "@/src/state/app";
import { useOverlay, type SheetKind } from "@/src/state/overlay";
import { dirStyle, makeStyles, useTheme, webDir } from "@/src/theme";

function ActionButton({ icon, label, onPress, testID }: { icon: IconName; label: string; onPress: () => void; testID: string }) {
  const styles = useStyles();
  const { colors } = useTheme();
  return (
    <View style={styles.action}>
      <PressableScale testID={testID} accessibilityLabel={label} onPress={onPress} style={styles.actionBtn}>
        <Icon name={icon} size={28} color={colors.onSurfaceSecondary} />
      </PressableScale>
      <Text style={styles.actionLabel}>{label}</Text>
    </View>
  );
}

export default function Dashboard() {
  const styles = useStyles();
  const { colors } = useTheme();
  const { t, dict } = useI18n();
  const insets = useSafeAreaInsets();
  const tabSpace = useTabSpace();
  const overlay = useOverlay();
  const { setActiveAccount } = useApp();
  const { view, loading, error, refreshing, refetch } = useVaultView();
  const sub = useActiveSub(view);
  const txs = useTxs(sub ? sub.id : "main");
  useAutoSync(view);

  const recent = txs.filter((x) => x.sign === "+" && Date.now() / 1000 - x.timestamp < 172800).length > 0;
  const actions: { key: string; icon: IconName; label: string; sheet: SheetKind }[] = sub
    ? [
        { key: "deposit", icon: "deposit", label: t("home.deposit"), sheet: "subDeposit" },
        { key: "withdraw", icon: "withdraw", label: t("home.withdraw"), sheet: "subWithdraw" },
      ]
    : [
        { key: "deposit", icon: "deposit", label: t("home.deposit"), sheet: "deposit" },
        { key: "transfer", icon: "transfer", label: t("home.transfer"), sheet: "transfer" },
        { key: "withdraw", icon: "withdraw", label: t("home.withdraw"), sheet: "withdraw" },
      ];

  const balance = sub ? sub.balance : (view?.balance ?? 0n);
  const cat = sub ? (CATEGORY[sub.category] ?? CATEGORY[4]) : null;
  const locked = !!sub && sub.unlockAt * 1000 > Date.now();

  return (
    <View style={styles.root} testID="dashboard-screen">
      <CosmicBackground variant="dashboard" />
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <AddressPill address={view?.vault ?? "0x0000000000000000000000000000000000000000"} demo={view?.isDemo} />
        <View style={styles.topRow}>
          <PressableScale testID="profile-avatar-button" onPress={() => overlay.setDrawerOpen(true)} style={styles.profile} scaleTo={0.97}>
            <Avatar seed={view?.owner ?? "tirelire"} size={44} />
            <View style={styles.helloBox}>
              <Text style={styles.hello} numberOfLines={1} testID="dashboard-greeting">
                {t("home.hello", { name: view?.name || "—" })}
              </Text>
              {sub ? (
                <Text style={styles.subTag} numberOfLines={1} testID="dashboard-sub-tag">
                  {t("home.subTag")} · {sub.name}
                </Text>
              ) : null}
            </View>
          </PressableScale>
          <CircleButton testID="notifications-button" icon="bell" label={t("sheets.notifTitle")} onPress={() => overlay.open("notifications")} badge={recent} />
        </View>
      </View>

      {!view ? (
        <View style={styles.state}>
          {loading ? <ActivityIndicator color={colors.brandPrimary} /> : null}
          {error ? (
            <>
              <Text style={styles.stateText}>{t("common.error")}</Text>
              <GhostButton testID="dashboard-retry-button" icon="refresh" label={t("common.retry")} onPress={() => refetch()} />
            </>
          ) : null}
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={[styles.scroll, { paddingBottom: tabSpace }]}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => refetch()} tintColor={colors.brandPrimary} />}
        >
          <View style={styles.content}>
            {sub ? (
              <PressableScale testID="dashboard-back-to-main" onPress={() => setActiveAccount("main")} style={styles.backChip} scaleTo={0.97}>
                <Icon name="vault" size={14} color={colors.accentBlue} />
                <Text style={styles.backChipText}>{t("home.mainVault")}</Text>
              </PressableScale>
            ) : null}
            <Animated.View entering={FadeInDown.duration(500)} style={styles.balance}>
              <View style={[styles.amountRow, dirStyle("ltr")]} {...webDir("ltr")}>
                <Text style={styles.currency}>$</Text>
                <Text style={styles.amount} testID="total-balance" adjustsFontSizeToFit numberOfLines={1}>
                  {fmtAmount(balance)}
                </Text>
              </View>
              <Text style={styles.caption}>{sub ? t("home.subBalance") : t("home.total")}</Text>
              {sub && cat ? (
                <View style={styles.subInfo}>
                  {sub.target > 0n ? (
                    <>
                      <ProgressBar value={pct(sub.balance, sub.target)} colorsFrom={[colors[cat.gradient[0]] as string, colors[cat.gradient[1]] as string]} />
                      <Text style={styles.subInfoText}>
                        {t("home.goal", { pct: Math.round(pct(sub.balance, sub.target)), target: fmtUsd(sub.target) })}
                      </Text>
                    </>
                  ) : null}
                  {locked ? (
                    <View style={styles.lockPill}>
                      <Icon name="lock" size={12} color={colors.accentAmber} />
                      <Text style={styles.lockText}>{t("home.lockedUntil", { date: dateLabel(sub.unlockAt, dict) })}</Text>
                    </View>
                  ) : null}
                </View>
              ) : (
                <View style={styles.pills}>
                  <View style={styles.pill} testID="available-balance">
                    <View style={[styles.pillDot, { backgroundColor: colors.accentEmerald }]} />
                    <Text style={styles.pillText}>
                      {t("home.available")} {fmtUsd(view.available)}
                    </Text>
                  </View>
                  {view.allocated > 0n ? (
                    <View style={styles.pill}>
                      <View style={[styles.pillDot, { backgroundColor: colors.accentIndigoSoft }]} />
                      <Text style={styles.pillText}>
                        {t("home.inSubs")} {fmtUsd(view.allocated)}
                      </Text>
                    </View>
                  ) : null}
                </View>
              )}
            </Animated.View>

            {!view.deployed && !view.isDemo ? (
              <PressableScale testID="dashboard-activate-banner" onPress={() => router.push("/activate")} style={styles.banner} scaleTo={0.98}>
                <Icon name="sparkles" size={18} color={colors.accentAmber} />
                <Text style={styles.bannerText}>{t("home.notActive")}</Text>
                <Text style={styles.bannerCta}>{t("home.activateNow")}</Text>
              </PressableScale>
            ) : null}
            {view.pending > 0n && !sub ? (
              <View style={styles.pending} testID="pending-deposit-banner">
                <ActivityIndicator size="small" color={colors.accentCyan} />
                <Text style={styles.pendingText}>{t("home.pending", { amount: fmtUsd(view.pending) })}</Text>
              </View>
            ) : null}

            <Animated.View entering={FadeInDown.delay(120).duration(500)} style={styles.actions}>
              {actions.map((a) => (
                <ActionButton key={a.key} testID={`action-${a.key}-button`} icon={a.icon} label={a.label} onPress={() => overlay.open(a.sheet)} />
              ))}
            </Animated.View>

            <Animated.View entering={FadeInDown.delay(220).duration(500)} style={styles.section}>
              <View style={styles.sectionHead}>
                <Text style={styles.sectionTitle}>{t("home.latest")}</Text>
                <PressableScale testID="view-all-transactions" onPress={() => router.navigate("/(tabs)/history")} style={styles.viewAll}>
                  <Text style={styles.viewAllText}>{t("common.viewAll")}</Text>
                </PressableScale>
              </View>
              {txs.length === 0 ? (
                <View style={styles.empty} testID="dashboard-empty">
                  <Icon name="vault" size={28} color={colors.accentBlue} strokeWidth={1.6} />
                  <Text style={styles.emptyTitle}>{t("home.empty")}</Text>
                  <Text style={styles.emptySub}>{t("home.emptySub")}</Text>
                </View>
              ) : (
                <View style={styles.list}>
                  {txs.slice(0, 3).map((tx, i) => (
                    <TxRow key={tx.id} tx={tx} index={i} />
                  ))}
                </View>
              )}
            </Animated.View>
          </View>
        </ScrollView>
      )}
    </View>
  );
}

const useStyles = makeStyles((c) => ({
  root: { flex: 1, backgroundColor: c.canvas },
  header: { paddingHorizontal: 24, paddingBottom: 4, width: "100%", maxWidth: 560, alignSelf: "center" },
  topRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  profile: { flexDirection: "row", alignItems: "center", gap: 12, flexShrink: 1 },
  helloBox: { flexShrink: 1 },
  hello: { color: c.onSurface, fontSize: 16, fontWeight: "500", letterSpacing: -0.2 },
  subTag: { color: c.accentBlue, fontSize: 11, fontWeight: "600", marginTop: 2 },
  state: { flex: 1, alignItems: "center", justifyContent: "center", gap: 16, paddingHorizontal: 24 },
  stateText: { color: c.muted, fontSize: 14 },
  scroll: { flexGrow: 1 },
  content: { width: "100%", maxWidth: 560, alignSelf: "center", paddingHorizontal: 20 },
  backChip: {
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 12,
    paddingHorizontal: 12,
    height: 30,
    borderRadius: 15,
    backgroundColor: c.brandTertiary,
    borderWidth: 1,
    borderColor: c.blueBorder,
  },
  backChipText: { color: c.accentBlue, fontSize: 12, fontWeight: "600" },
  balance: { alignItems: "center", paddingTop: 28, paddingBottom: 4 },
  amountRow: { flexDirection: "row", alignItems: "flex-start", gap: 6 },
  currency: { color: c.white70, fontSize: 30, fontWeight: "600", marginTop: 4 },
  amount: { color: c.textStrong, fontSize: 44, fontWeight: "600", letterSpacing: 0.5, fontVariant: ["tabular-nums"] },
  caption: { color: c.muted, fontSize: 12, fontWeight: "500", marginTop: 8, letterSpacing: 0.3 },
  subInfo: { width: "70%", alignItems: "center", gap: 8, marginTop: 14 },
  subInfoText: { color: c.muted, fontSize: 12 },
  lockPill: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 10, height: 26, borderRadius: 13, backgroundColor: c.amberSoft },
  lockText: { color: c.accentAmber, fontSize: 11, fontWeight: "700" },
  pills: { flexDirection: "row", flexWrap: "wrap", justifyContent: "center", gap: 8, marginTop: 14 },
  pill: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 10, height: 26, borderRadius: 13, backgroundColor: c.glassSubtle, borderWidth: 1, borderColor: c.border },
  pillDot: { width: 6, height: 6, borderRadius: 3 },
  pillText: { color: c.textSoft, fontSize: 11, fontWeight: "500", fontVariant: ["tabular-nums"] },
  banner: { flexDirection: "row", alignItems: "center", gap: 10, marginTop: 20, padding: 14, borderRadius: 16, backgroundColor: c.amberSoft, borderWidth: 1, borderColor: c.border },
  bannerText: { flex: 1, color: c.onSurfaceSecondary, fontSize: 13 },
  bannerCta: { color: c.accentAmber, fontSize: 13, fontWeight: "700" },
  pending: { flexDirection: "row", alignItems: "center", gap: 10, marginTop: 20, padding: 12, borderRadius: 16, backgroundColor: c.blueSoft },
  pendingText: { flex: 1, color: c.accentCyanSoft, fontSize: 12, fontWeight: "500" },
  actions: { flexDirection: "row", justifyContent: "space-around", marginTop: 28, paddingHorizontal: 8 },
  action: { alignItems: "center", gap: 8 },
  actionBtn: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: c.glassStrong,
    borderWidth: 1,
    borderColor: c.border,
    borderTopColor: c.glassHighlight,
    shadowColor: c.canvas,
    shadowOpacity: 0.35,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 4 },
  },
  actionLabel: { color: c.textSoft, fontSize: 12, fontWeight: "500" },
  section: { marginTop: 28, gap: 12 },
  sectionHead: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 4 },
  sectionTitle: { color: c.textStrong, fontSize: 14, fontWeight: "600" },
  viewAll: { height: 32, justifyContent: "center", paddingHorizontal: 4 },
  viewAllText: { color: c.muted, fontSize: 12 },
  list: { gap: 10 },
  empty: { alignItems: "center", gap: 6, padding: 24, borderRadius: 16, backgroundColor: c.glass, borderWidth: 1, borderColor: c.border },
  emptyTitle: { color: c.textStrong, fontSize: 14, fontWeight: "600", marginTop: 4 },
  emptySub: { color: c.muted, fontSize: 12, textAlign: "center" },
}));
