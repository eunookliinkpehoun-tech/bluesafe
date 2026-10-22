import { Pressable, Text, View } from "react-native";
import Animated, { FadeIn, FadeOut, ZoomIn, ZoomOut } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useI18n } from "@/src/i18n";
import { useApp } from "@/src/state/app";
import { useOverlay, type SheetKind } from "@/src/state/overlay";
import { makeStyles, useTheme } from "@/src/theme";
import { TAB_BAR_HEIGHT, tabBottom } from "./FloatingTabBar";
import { Icon, type IconName } from "./Icon";
import { PressableScale } from "./PressableScale";
import { IconTile } from "./ui";

/** Quick actions popover above the "+" button. Any tap outside closes it. */
export function PlusMenu() {
  const styles = useStyles();
  const { colors } = useTheme();
  const { t, isRTL } = useI18n();
  const insets = useSafeAreaInsets();
  const { setPlusOpen, open } = useOverlay();
  const { activeAccount } = useApp();
  const sub = typeof activeAccount === "number";

  const items: { key: string; icon: IconName; label: string; sub: string; tint: string; sheet: SheetKind }[] = [
    { key: "add-account", icon: "layers", label: t("plus.addAccount"), sub: t("plus.addAccountSub"), tint: colors.accentPurple, sheet: "createSub" },
    { key: "deposit", icon: "deposit", label: t("plus.deposit"), sub: t("plus.depositSub"), tint: colors.accentEmerald, sheet: sub ? "subDeposit" : "deposit" },
    { key: "withdraw", icon: "withdraw", label: t("plus.withdraw"), sub: t("plus.withdrawSub"), tint: colors.accentSky, sheet: sub ? "subWithdraw" : "withdraw" },
  ];

  return (
    <View style={styles.host}>
      <Animated.View entering={FadeIn.duration(150)} exiting={FadeOut.duration(150)} style={styles.backdrop}>
        <Pressable testID="plus-menu-backdrop" style={styles.fill} onPress={() => setPlusOpen(false)} />
      </Animated.View>
      <View pointerEvents="box-none" style={[styles.anchor, { bottom: tabBottom(insets.bottom) + TAB_BAR_HEIGHT + 14 }]}>
        <View pointerEvents="box-none" style={styles.inner}>
          <Animated.View entering={ZoomIn.springify().damping(16)} exiting={ZoomOut.duration(140)} style={styles.menu} testID="plus-menu">
            <Text style={styles.heading}>{t("nav.plus")}</Text>
            {items.map((it) => (
              <PressableScale key={it.key} testID={`plus-menu-${it.key}`} onPress={() => open(it.sheet)} scaleTo={0.97} style={styles.item}>
                <IconTile icon={it.icon} size={44} tint={it.tint} />
                <View style={styles.texts}>
                  <Text style={styles.label} numberOfLines={1}>
                    {it.label}
                  </Text>
                  <Text style={styles.sub} numberOfLines={1}>
                    {it.sub}
                  </Text>
                </View>
                <Icon name={isRTL ? "chevronLeft" : "chevronRight"} size={16} color={colors.muted} />
              </PressableScale>
            ))}
          </Animated.View>
        </View>
      </View>
    </View>
  );
}

const useStyles = makeStyles((c) => ({
  host: { position: "absolute", top: 0, bottom: 0, start: 0, end: 0 },
  backdrop: { position: "absolute", top: 0, bottom: 0, start: 0, end: 0, backgroundColor: c.overlay },
  fill: { flex: 1 },
  anchor: { position: "absolute", start: 0, end: 0, paddingHorizontal: 16, alignItems: "center" },
  inner: { width: "100%", maxWidth: 480, alignItems: "flex-end" },
  menu: {
    width: 300,
    maxWidth: "100%",
    borderRadius: 26,
    padding: 8,
    gap: 4,
    backgroundColor: c.sheet,
    borderWidth: 1,
    borderColor: c.white10,
    borderTopColor: c.glassHighlight,
    shadowColor: c.brandSecondary,
    shadowOpacity: 0.35,
    shadowRadius: 26,
    shadowOffset: { width: 0, height: 8 },
    elevation: 20,
  },
  heading: { color: c.muted, fontSize: 11, fontWeight: "700", letterSpacing: 1, textTransform: "uppercase", paddingHorizontal: 12, paddingTop: 8, paddingBottom: 4 },
  item: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 10, paddingVertical: 10, minHeight: 64, borderRadius: 18, backgroundColor: c.glassSubtle },
  texts: { flex: 1, minWidth: 0 },
  label: { color: c.textStrong, fontSize: 15, fontWeight: "700" },
  sub: { color: c.muted, fontSize: 12, marginTop: 2 },
}));
