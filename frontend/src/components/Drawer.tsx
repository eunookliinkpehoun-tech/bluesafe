import * as Clipboard from "expo-clipboard";
import { router } from "expo-router";
import { Linking, Pressable, ScrollView, Text, useWindowDimensions, View } from "react-native";
import Animated, { FadeIn, FadeOut, SlideInLeft, SlideInRight, SlideOutLeft, SlideOutRight } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useConfigQuery, useVaultView } from "@/src/hooks/useVault";
import { LANGS, useI18n } from "@/src/i18n";
import { fmtUsd, pct, shortAddr } from "@/src/lib/format";
import { CATEGORY } from "@/src/lib/categories";
import { useApp } from "@/src/state/app";
import { useOverlay } from "@/src/state/overlay";
import { makeStyles, useTheme } from "@/src/theme";
import { Avatar } from "./Avatar";
import { Icon, type IconName } from "./Icon";
import { PressableScale } from "./PressableScale";
import { IconTile, SectionLabel } from "./ui";

function Row({ icon, label, onPress, testID, danger }: { icon: IconName; label: string; onPress: () => void; testID: string; danger?: boolean }) {
  const styles = useStyles();
  const { colors } = useTheme();
  return (
    <PressableScale testID={testID} onPress={onPress} scaleTo={0.98} style={styles.row}>
      <Icon name={icon} size={20} color={danger ? colors.accentRose : colors.textSoft} strokeWidth={1.8} />
      <Text style={[styles.rowLabel, danger && styles.danger]}>{label}</Text>
    </PressableScale>
  );
}

/** Side panel opened from the avatar: switch between main vault and sub-accounts, settings. */
export function Drawer() {
  const styles = useStyles();
  const { colors } = useTheme();
  const { t, lang, setLang, isRTL } = useI18n();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { setDrawerOpen, open } = useOverlay();
  const { activeAccount, setActiveAccount, status, lock, exitDemo } = useApp();
  const { view } = useVaultView();
  const { data: cfg } = useConfigQuery();
  const demo = status === "demo";
  const panelWidth = Math.min(340, width * 0.86);
  const closeDrawer = () => setDrawerOpen(false);

  const pick = (a: "main" | number) => {
    setActiveAccount(a);
    closeDrawer();
    router.navigate("/(tabs)");
  };

  return (
    <View style={styles.host}>
      <Animated.View entering={FadeIn.duration(200)} exiting={FadeOut.duration(200)} style={styles.backdrop}>
        <Pressable testID="drawer-backdrop" style={styles.fill} onPress={closeDrawer} />
      </Animated.View>
      <Animated.View
        entering={(isRTL ? SlideInRight : SlideInLeft).springify().damping(22).stiffness(200)}
        exiting={(isRTL ? SlideOutRight : SlideOutLeft).duration(220)}
        testID="accounts-drawer"
        style={[styles.panel, { width: panelWidth, paddingTop: insets.top + 16 }]}
      >
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}>
          <View style={styles.head}>
            <Avatar seed={view?.owner ?? "tirelire"} size={56} />
            <View style={styles.headText}>
              <Text style={styles.name} numberOfLines={1} testID="drawer-name">
                {view?.name || "—"}
              </Text>
              <PressableScale testID="drawer-copy-address" onPress={() => view && Clipboard.setStringAsync(view.vault)} style={styles.addr}>
                <Text style={styles.addrText}>{shortAddr(view?.vault)}</Text>
                <Icon name="copy" size={12} color={colors.muted} />
              </PressableScale>
            </View>
          </View>

          <SectionLabel>{t("drawer.accounts")}</SectionLabel>
          <PressableScale testID="drawer-account-main" onPress={() => pick("main")} scaleTo={0.98} style={[styles.account, activeAccount === "main" && styles.accountActive]}>
            <IconTile icon="vault" highlight size={40} />
            <View style={styles.accText}>
              <Text style={styles.accName}>{t("drawer.main")}</Text>
              <Text style={styles.accMeta}>{shortAddr(view?.vault)}</Text>
            </View>
            <Text style={styles.accAmount}>{fmtUsd(view?.balance ?? 0n)}</Text>
          </PressableScale>
          {view?.subs.map((s) => {
            const cat = CATEGORY[s.category] ?? CATEGORY[4];
            return (
              <PressableScale
                key={s.id}
                testID={`drawer-account-${s.id}`}
                onPress={() => pick(s.id)}
                scaleTo={0.98}
                style={[styles.account, activeAccount === s.id && styles.accountActive]}
              >
                <IconTile icon={cat.icon} tint={colors[cat.color] as string} size={40} />
                <View style={styles.accText}>
                  <Text style={styles.accName} numberOfLines={1}>
                    {s.name}
                  </Text>
                  <Text style={styles.accMeta}>
                    {s.target > 0n ? `${Math.round(pct(s.balance, s.target))}%` : t(`subs.c${s.category}`)}
                  </Text>
                </View>
                <Text style={styles.accAmount}>{fmtUsd(s.balance)}</Text>
              </PressableScale>
            );
          })}
          <View style={styles.group}>
            <Row icon="plus" label={t("drawer.newSub")} testID="drawer-new-sub" onPress={() => open("createSub")} />
            <Row
              icon="layers"
              label={t("drawer.manage")}
              testID="drawer-manage-subs"
              onPress={() => {
                closeDrawer();
                router.navigate("/(tabs)/subaccounts");
              }}
            />
          </View>

          <SectionLabel>{t("drawer.settings")}</SectionLabel>
          <View style={styles.langRow}>
            <Icon name="globe" size={20} color={colors.textSoft} strokeWidth={1.8} />
            <Text style={styles.rowLabel}>{t("drawer.language")}</Text>
            <View style={styles.langs}>
              {LANGS.map((l) => (
                <PressableScale
                  key={l.code}
                  testID={`lang-${l.code}`}
                  onPress={() => setLang(l.code)}
                  style={[styles.lang, lang === l.code && styles.langActive]}
                >
                  <Text style={[styles.langText, lang === l.code && styles.langTextActive]}>{l.label}</Text>
                </PressableScale>
              ))}
            </View>
          </View>
          <View style={styles.group}>
            {!demo ? <Row icon="key" label={t("drawer.backup")} testID="drawer-backup" onPress={() => open("backup")} /> : null}
            {cfg && view ? (
              <Row icon="external" label={t("drawer.explorer")} testID="drawer-explorer" onPress={() => Linking.openURL(`${cfg.explorer}/address/${view.vault}`)} />
            ) : null}
            {!demo ? <Row icon="lock" label={t("drawer.lock")} testID="drawer-lock" onPress={lock} /> : null}
            {demo ? (
              <Row icon="logout" label={t("drawer.exitDemo")} testID="drawer-exit-demo" danger onPress={exitDemo} />
            ) : (
              <Row icon="logout" label={t("drawer.signOut")} testID="drawer-signout" danger onPress={() => open("signOut")} />
            )}
          </View>
          <Text style={styles.footer}>{t("drawer.footer")}</Text>
        </ScrollView>
      </Animated.View>
    </View>
  );
}

const useStyles = makeStyles((c) => ({
  host: { position: "absolute", top: 0, bottom: 0, start: 0, end: 0 },
  backdrop: { position: "absolute", top: 0, bottom: 0, start: 0, end: 0, backgroundColor: c.overlay },
  fill: { flex: 1 },
  panel: {
    position: "absolute",
    top: 0,
    bottom: 0,
    start: 0,
    backgroundColor: c.drawer,
    borderEndWidth: 1,
    borderColor: c.white10,
    shadowColor: c.brandSecondary,
    shadowOpacity: 0.25,
    shadowRadius: 30,
    shadowOffset: { width: 0, height: 0 },
    elevation: 24,
  },
  content: { paddingHorizontal: 16, gap: 10 },
  head: { flexDirection: "row", alignItems: "center", gap: 12, paddingBottom: 16, marginBottom: 4, borderBottomWidth: 1, borderBottomColor: c.divider },
  headText: { flex: 1, gap: 4 },
  name: { color: c.textStrong, fontSize: 18, fontWeight: "700" },
  addr: { flexDirection: "row", alignItems: "center", gap: 6, alignSelf: "flex-start", paddingVertical: 4 },
  addrText: { color: c.muted, fontSize: 12, fontVariant: ["tabular-nums"] },
  account: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 10,
    borderRadius: 16,
    backgroundColor: c.glassSubtle,
    borderWidth: 1,
    borderColor: c.border,
  },
  accountActive: { backgroundColor: c.brandTertiary, borderColor: c.borderStrong },
  accText: { flex: 1, minWidth: 0 },
  accName: { color: c.textStrong, fontSize: 14, fontWeight: "600" },
  accMeta: { color: c.muted, fontSize: 11, marginTop: 2 },
  accAmount: { color: c.onSurface, fontSize: 13, fontWeight: "700", fontVariant: ["tabular-nums"] },
  group: { borderRadius: 16, backgroundColor: c.glassSubtle, borderWidth: 1, borderColor: c.border, paddingVertical: 4, marginBottom: 8 },
  row: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 14, minHeight: 48 },
  rowLabel: { flex: 1, color: c.onSurfaceSecondary, fontSize: 14, fontWeight: "500" },
  danger: { color: c.accentRose },
  langRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 14,
    minHeight: 56,
    borderRadius: 16,
    backgroundColor: c.glassSubtle,
    borderWidth: 1,
    borderColor: c.border,
  },
  langs: { flexDirection: "row", gap: 4 },
  lang: { height: 32, minWidth: 40, paddingHorizontal: 8, borderRadius: 10, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: c.border },
  langActive: { backgroundColor: c.brandTertiary, borderColor: c.borderStrong },
  langText: { color: c.muted, fontSize: 12, fontWeight: "700" },
  langTextActive: { color: c.textStrong },
  footer: { color: c.textFaint, fontSize: 11, textAlign: "center", marginTop: 8 },
}));
