import * as Clipboard from "expo-clipboard";
import Constants from "expo-constants";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useMemo, useState } from "react";
import { ActivityIndicator, RefreshControl, ScrollView, Share, Text, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";

import { ChipRow } from "@/src/components/ChipRow";
import { CosmicBackground } from "@/src/components/CosmicBackground";
import { useTabSpace } from "@/src/components/FloatingTabBar";
import { Icon } from "@/src/components/Icon";
import { PressableScale } from "@/src/components/PressableScale";
import { ScreenHeader } from "@/src/components/ScreenHeader";
import { useToast } from "@/src/components/Toast";
import { ProgressBar, SectionLabel } from "@/src/components/ui";
import { useConfigQuery, useTeam } from "@/src/hooks/useVault";
import { dateLabel, useI18n } from "@/src/i18n";
import type { Referral } from "@/src/lib/chain";
import { fmtAmount, shortAddr } from "@/src/lib/format";
import { useApp } from "@/src/state/app";
import { useOverlay } from "@/src/state/overlay";
import { fonts, makeStyles, useTheme, type ThemeColors } from "@/src/theme";

type Filter = "all" | "active" | "dormant";
const TIERS = [
  { key: "bronze", min: 0 },
  { key: "silver", min: 5 },
  { key: "gold", min: 15 },
  { key: "diamond", min: 50 },
];
const TILE: [keyof ThemeColors, keyof ThemeColors][] = [
  ["brandSecondary", "accentCyan"],
  ["accentIndigo", "accentPurple"],
  ["glowDeep", "accentBlue"],
  ["glowTeal", "accentEmerald"],
];

const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("") || "?";

function Member({ r, index }: { r: Referral; index: number }) {
  const styles = useStyles();
  const { colors } = useTheme();
  const { t, dict } = useI18n();
  const active = r.balance > 0n;
  const [a, b] = TILE[index % TILE.length];
  return (
    <Animated.View entering={FadeInDown.delay(Math.min(index, 6) * 50).duration(380)} style={styles.member} testID={`team-member-${index}`}>
      <LinearGradient colors={[`${colors[a]}66`, `${colors[b]}4D`]} start={{ x: 0, y: 1 }} end={{ x: 1, y: 0 }} style={styles.initials}>
        <Text style={styles.initialsText}>{initials(r.name)}</Text>
      </LinearGradient>
      <View style={styles.memberText}>
        <View style={styles.memberNameRow}>
          <Text style={styles.memberName} numberOfLines={1}>
            {r.name}
          </Text>
          <View style={[styles.statusDot, { backgroundColor: active ? colors.accentEmerald : colors.accentAmber }]} />
        </View>
        <Text style={styles.memberMeta} numberOfLines={1}>
          {shortAddr(r.vault)} • <Text style={active ? styles.metaFaint : styles.metaAmber}>{active ? t("team.activeChip") : t("team.noBalance")}</Text>
        </Text>
      </View>
      <View style={styles.memberRight}>
        <Text style={[styles.memberEarned, r.earned === 0n && styles.memberEarnedZero]}>{r.earned > 0n ? `+$${fmtAmount(r.earned)}` : "—"}</Text>
        <Text style={styles.memberDate}>{dateLabel(r.joinedAt, dict)}</Text>
      </View>
    </Animated.View>
  );
}

export default function Team() {
  const styles = useStyles();
  const { colors } = useTheme();
  const { t } = useI18n();
  const toast = useToast();
  const tabSpace = useTabSpace();
  const { open } = useOverlay();
  const { status } = useApp();
  const { data: cfg } = useConfigQuery();
  const { team, loading, refreshing, refetch } = useTeam();
  const [filter, setFilter] = useState<Filter>("all");
  const [showAll, setShowAll] = useState(false);

  const refs = useMemo(() => team?.referrals ?? [], [team]);
  const active = refs.filter((r) => r.balance > 0n);
  const filtered = filter === "all" ? refs : filter === "active" ? active : refs.filter((r) => r.balance === 0n);
  const visible = showAll ? filtered : filtered.slice(0, 5);
  const rate = status === "demo" || !cfg ? 60 : cfg.referralBps / 100;
  const code = team?.code || "—";
  const link = `${Constants.expoConfig?.scheme ?? "tirelire"}://ref/${code}`;

  const tierIdx = TIERS.reduce((acc, tr, i) => (refs.length >= tr.min ? i : acc), 0);
  const next = TIERS[tierIdx + 1];
  const progress = next ? ((refs.length - TIERS[tierIdx].min) / (next.min - TIERS[tierIdx].min)) * 100 : 100;

  const monthEarned = useMemo(() => {
    const d = new Date();
    d.setDate(1);
    d.setHours(0, 0, 0, 0);
    return refs.filter((r) => r.joinedAt * 1000 >= d.getTime()).reduce((s, r) => s + r.earned, 0n);
  }, [refs]);

  const copy = async (value: string) => {
    await Clipboard.setStringAsync(value);
    toast.show(t("common.copied"));
  };

  return (
    <View style={styles.root} testID="team-screen">
      <CosmicBackground variant="team" />
      <ScreenHeader
        testID="team-header"
        title={t("team.title")}
        subtitle={t("team.subtitle")}
        subtitleAccent
        onBack={() => router.navigate("/(tabs)")}
        action={{ icon: "help", onPress: () => open("teamHelp"), testID: "team-help-button", label: t("team.helpTitle") }}
      />
      <ScrollView
        stickyHeaderIndices={[3]}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: tabSpace }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => refetch()} tintColor={colors.brandPrimary} />}
      >
        <View style={styles.pad}>
          <Animated.View entering={FadeInDown.duration(450)} style={styles.card} testID="team-commission-card">
            <View style={styles.cardGlow} />
            <View style={styles.cardTop}>
              <View style={styles.flex}>
                <View style={styles.labelRow}>
                  <View style={styles.liveDot} />
                  <Text style={styles.upper}>{t("team.total")}</Text>
                </View>
                <View style={styles.totalRow}>
                  <Text style={styles.total} testID="team-total-commissions">
                    ${fmtAmount(team?.totalEarned ?? 0n)}
                  </Text>
                  {monthEarned > 0n ? (
                    <View style={styles.badge}>
                      <Icon name="trendUp" size={11} color={colors.accentEmerald} />
                      <Text style={styles.badgeText}>{t("team.thisMonth", { amount: `$${fmtAmount(monthEarned)}` })}</Text>
                    </View>
                  ) : null}
                </View>
              </View>
              <View style={styles.cardIcon}>
                <Icon name="dollar" size={20} color={colors.accentBlue} />
              </View>
            </View>
            <View style={styles.grid}>
              <View style={styles.cell}>
                <View style={styles.cellLabelRow}>
                  <Icon name="users" size={12} color={colors.accentBlue} />
                  <Text style={styles.cellLabel}>{t("team.active")}</Text>
                </View>
                <Text style={styles.cellValue} testID="team-active-count">
                  {active.length} <Text style={styles.cellSub}>/ {refs.length}</Text>
                </Text>
              </View>
              <View style={styles.cell}>
                <View style={styles.cellLabelRow}>
                  <Icon name="zap" size={12} color={colors.accentCyan} />
                  <Text style={styles.cellLabel}>{t("team.rate")}</Text>
                </View>
                <Text style={[styles.cellValue, { color: colors.accentCyanSoft }]} testID="team-commission-rate">
                  {rate}% <Text style={styles.cellSub}>{t("team.perActivation")}</Text>
                </Text>
              </View>
            </View>
            <View style={styles.tier}>
              <View style={styles.tierRow}>
                <Text style={styles.tierText}>{t("team.tier", { tier: t(`team.${TIERS[tierIdx].key}`), n: tierIdx + 1 })}</Text>
                <Text style={styles.tierNext}>
                  {next ? t("team.toNext", { n: next.min - refs.length, next: t(`team.${next.key}`) }) : t("team.maxTier")}
                </Text>
              </View>
              <ProgressBar value={progress} colorsFrom={[colors.brandPrimary, colors.accentCyan]} />
            </View>
          </Animated.View>
        </View>

        <View style={styles.pad}>
          <View style={styles.tools}>
            <SectionLabel>{t("team.tools")}</SectionLabel>
            <View style={styles.card}>
              <Text style={styles.fieldLabel}>{t("team.code")}</Text>
              <View style={styles.field}>
                <View style={[styles.fieldLeft, styles.flex]}>
                  <Icon name="ticket" size={16} color={colors.accentBlue} />
                  <Text style={styles.code} numberOfLines={1} testID="team-referral-code">
                    {code}
                  </Text>
                </View>
                <PressableScale testID="team-copy-code-button" accessibilityLabel={t("common.copy")} onPress={() => copy(code)} style={styles.iconBtn}>
                  <Icon name="copy" size={16} color={colors.textStrong} />
                </PressableScale>
              </View>
              <Text style={[styles.fieldLabel, styles.fieldGap]}>{t("team.link")}</Text>
              <View style={styles.field}>
                <View style={[styles.fieldLeft, styles.flex]}>
                  <Icon name="link" size={14} color={colors.muted} />
                  <Text style={styles.link} numberOfLines={1} testID="team-referral-link">
                    {link}
                  </Text>
                </View>
              </View>
              <View style={styles.linkActions}>
                <PressableScale testID="team-copy-link-button" onPress={() => copy(link)} style={styles.copyBtn}>
                  <Icon name="copy" size={16} color={colors.textStrong} />
                  <Text style={styles.copyText} numberOfLines={1}>
                    {t("common.copy")}
                  </Text>
                </PressableScale>
                <PressableScale
                  testID="team-share-button"
                  onPress={() => Share.share({ message: t("team.shareMsg", { code, link }) })}
                  style={styles.shareBtn}
                >
                  <Icon name="share" size={16} color={colors.onBrandPrimary} />
                  <Text style={styles.shareText} numberOfLines={1}>
                    {t("common.share")}
                  </Text>
                </PressableScale>
              </View>
            </View>
          </View>
        </View>

        <View style={[styles.pad, styles.membersHead]}>
          <View style={styles.membersTitleRow}>
            <SectionLabel>{t("team.members")}</SectionLabel>
            <View style={styles.countBadge}>
              <Text style={styles.countText}>{refs.length}</Text>
            </View>
          </View>
          {filtered.length > 5 ? (
            <PressableScale testID="team-see-all-button" onPress={() => setShowAll(!showAll)} style={styles.seeAll}>
              <Text style={styles.seeAllText}>{showAll ? t("common.showLess") : t("common.seeAll")}</Text>
            </PressableScale>
          ) : null}
        </View>
        <View style={styles.sticky}>
          <ChipRow
            items={[
              { key: "all" as Filter, label: `${t("team.all")} (${refs.length})` },
              { key: "active" as Filter, label: `${t("team.activeChip")} (${active.length})` },
              { key: "dormant" as Filter, label: `${t("team.dormant")} (${refs.length - active.length})` },
            ]}
            value={filter}
            onChange={setFilter}
            testIDPrefix="team-chip"
          />
        </View>
        <View style={[styles.pad, styles.members]}>
          {loading ? <ActivityIndicator color={colors.brandPrimary} /> : null}
          {!loading && visible.length === 0 ? (
            <View style={styles.empty} testID="team-empty">
              <Icon name="users" size={28} color={colors.muted} />
              <Text style={styles.emptyText}>{t("team.empty")}</Text>
            </View>
          ) : null}
          {visible.map((r, i) => (
            <Member key={r.owner} r={r} index={i} />
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const useStyles = makeStyles((c) => ({
  root: { flex: 1, backgroundColor: c.canvas },
  pad: { paddingHorizontal: 20, width: "100%", maxWidth: 560, alignSelf: "center", paddingTop: 8 },
  flex: { flex: 1 },
  card: { padding: 18, borderRadius: 24, backgroundColor: c.glassCard, borderWidth: 1, borderColor: c.border, overflow: "hidden" },
  cardGlow: { position: "absolute", top: -40, end: -40, width: 130, height: 130, borderRadius: 65, backgroundColor: c.blueSoft },
  cardTop: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: 12 },
  labelRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: c.accentEmerald },
  upper: { color: c.muted, fontSize: 11, fontWeight: "600", letterSpacing: 1, textTransform: "uppercase" },
  totalRow: { flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: 8, marginTop: 8 },
  total: { color: c.textStrong, fontSize: 34, fontFamily: fonts.display, letterSpacing: -0.5, fontVariant: ["tabular-nums"] },
  badge: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 8, height: 22, borderRadius: 11, backgroundColor: c.emeraldSoft, borderWidth: 1, borderColor: c.emeraldBorder },
  badgeText: { color: c.accentEmerald, fontSize: 11, fontWeight: "700" },
  cardIcon: { width: 44, height: 44, borderRadius: 16, alignItems: "center", justifyContent: "center", backgroundColor: c.brandTertiary, borderWidth: 1, borderColor: c.blueBorder },
  grid: { flexDirection: "row", gap: 12, marginTop: 18, paddingTop: 16, borderTopWidth: 1, borderTopColor: c.divider },
  cell: { flex: 1, padding: 12, borderRadius: 16, backgroundColor: c.glassSubtle, borderWidth: 1, borderColor: c.divider },
  cellLabelRow: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 4 },
  cellLabel: { color: c.muted, fontSize: 11, flexShrink: 1 },
  cellValue: { color: c.textStrong, fontSize: 20, fontFamily: fonts.display },
  cellSub: { color: c.muted, fontSize: 11, fontWeight: "400" },
  tier: { marginTop: 16, gap: 8 },
  tierRow: { flexDirection: "row", justifyContent: "space-between", gap: 8 },
  tierText: { color: c.muted, fontSize: 11, fontWeight: "500", flexShrink: 1 },
  tierNext: { color: c.accentBlue, fontSize: 11, fontWeight: "600", flexShrink: 1 },
  tools: { gap: 10, marginTop: 12 },
  fieldLabel: { color: c.muted, fontSize: 11, fontWeight: "500", marginBottom: 6 },
  fieldGap: { marginTop: 14 },
  field: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    minHeight: 50,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: c.glassInput,
    borderWidth: 1,
    borderColor: c.white10,
  },
  fieldLeft: { flexDirection: "row", alignItems: "center", gap: 10, minWidth: 0 },
  code: { flexShrink: 1, color: c.textStrong, fontSize: 15, letterSpacing: 1.5, fontFamily: fonts.display },
  link: { flexShrink: 1, color: c.textSoft, fontSize: 13, fontFamily: "monospace" },
  iconBtn: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center", backgroundColor: c.white10, borderWidth: 1, borderColor: c.border },
  linkActions: { flexDirection: "row", gap: 10, marginTop: 12 },
  copyBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    height: 46,
    paddingHorizontal: 12,
    borderRadius: 23,
    backgroundColor: c.white10,
    borderWidth: 1,
    borderColor: c.border,
  },
  copyText: { color: c.textStrong, fontSize: 14, fontWeight: "700", flexShrink: 1 },
  shareBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    height: 46,
    paddingHorizontal: 12,
    borderRadius: 23,
    backgroundColor: c.brandSecondary,
    shadowColor: c.brandPrimary,
    shadowOpacity: 0.4,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  shareText: { color: c.onBrandPrimary, fontSize: 14, fontWeight: "700", flexShrink: 1 },
  membersHead: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 16 },
  membersTitleRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  countBadge: { paddingHorizontal: 8, height: 20, borderRadius: 10, justifyContent: "center", backgroundColor: c.brandTertiary },
  countText: { color: c.accentBlue, fontSize: 11, fontWeight: "800" },
  seeAll: { height: 32, justifyContent: "center" },
  seeAllText: { color: c.accentBlue, fontSize: 12, fontWeight: "600" },
  sticky: { backgroundColor: c.stickyBar, width: "100%", maxWidth: 560, alignSelf: "center" },
  members: { gap: 10 },
  member: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14, minHeight: 72, borderRadius: 20, backgroundColor: c.glassCard, borderWidth: 1, borderColor: c.border },
  initials: { width: 40, height: 40, borderRadius: 14, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: c.white15 },
  initialsText: { color: c.textStrong, fontSize: 12, fontWeight: "800" },
  memberText: { flex: 1, minWidth: 0 },
  memberNameRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  memberName: { color: c.textStrong, fontSize: 14, fontWeight: "700", flexShrink: 1 },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  memberMeta: { color: c.muted, fontSize: 11, marginTop: 3, fontFamily: "monospace" },
  metaFaint: { color: c.textFaint },
  metaAmber: { color: c.accentAmber },
  memberRight: { alignItems: "flex-end" },
  memberEarned: { color: c.accentEmerald, fontSize: 14, fontFamily: fonts.display },
  memberEarnedZero: { color: c.muted },
  memberDate: { color: c.muted, fontSize: 10, marginTop: 3 },
  empty: { alignItems: "center", gap: 10, paddingVertical: 36 },
  emptyText: { color: c.muted, fontSize: 14, textAlign: "center" },
}));
