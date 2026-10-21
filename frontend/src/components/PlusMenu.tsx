import { Pressable, Text, View } from "react-native";
import Animated, { FadeIn, FadeOut, ZoomIn, ZoomOut } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useI18n } from "@/src/i18n";
import { useApp } from "@/src/state/app";
import { useOverlay, type SheetKind } from "@/src/state/overlay";
import { makeStyles } from "@/src/theme";
import { TAB_BAR_HEIGHT, tabBottom } from "./FloatingTabBar";
import { Icon, type IconName } from "./Icon";
import { PressableScale } from "./PressableScale";
import { IconTile } from "./ui";

/** Quick actions popover above the "+" button. Any tap outside closes it. */
export function PlusMenu() {
  const styles = useStyles();
  const { t } = useI18n();
  const insets = useSafeAreaInsets();
  const { setPlusOpen, open } = useOverlay();
  const { activeAccount } = useApp();
  const sub = typeof activeAccount === "number";

  const items: { key: string; icon: IconName; label: string; sheet: SheetKind }[] = [
    { key: "add-account", icon: "layers", label: t("plus.addAccount"), sheet: "createSub" },
    { key: "deposit", icon: "deposit", label: t("plus.deposit"), sheet: sub ? "subDeposit" : "deposit" },
    { key: "withdraw", icon: "withdraw", label: t("plus.withdraw"), sheet: sub ? "subWithdraw" : "withdraw" },
  ];

  return (
    <View style={styles.host}>
      <Animated.View entering={FadeIn.duration(150)} exiting={FadeOut.duration(150)} style={styles.backdrop}>
        <Pressable testID="plus-menu-backdrop" style={styles.fill} onPress={() => setPlusOpen(false)} />
      </Animated.View>
      <View pointerEvents="box-none" style={[styles.anchor, { bottom: tabBottom(insets.bottom) + TAB_BAR_HEIGHT + 12 }]}>
        <View pointerEvents="box-none" style={styles.inner}>
          <Animated.View entering={ZoomIn.springify().damping(16)} exiting={ZoomOut.duration(140)} style={styles.menu} testID="plus-menu">
            {items.map((it, i) => (
              <PressableScale
                key={it.key}
                testID={`plus-menu-${it.key}`}
                onPress={() => open(it.sheet)}
                scaleTo={0.97}
                style={[styles.item, i < items.length - 1 && styles.itemBorder]}
              >
                <IconTile icon={it.icon} size={38} highlight />
                <Text style={styles.label}>{it.label}</Text>
                <View style={styles.chev}>
                  <Icon name="chevronRight" size={16} color={styles.chevColor.color as string} />
                </View>
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
  backdrop: { position: "absolute", top: 0, bottom: 0, start: 0, end: 0, backgroundColor: c.overlayLight },
  fill: { flex: 1 },
  anchor: { position: "absolute", start: 0, end: 0, paddingHorizontal: 16, alignItems: "center" },
  inner: { width: "100%", maxWidth: 480, alignItems: "flex-end" },
  menu: {
    width: 240,
    borderRadius: 22,
    paddingVertical: 6,
    backgroundColor: c.sheet,
    borderWidth: 1,
    borderColor: c.white10,
    shadowColor: c.brandSecondary,
    shadowOpacity: 0.35,
    shadowRadius: 26,
    shadowOffset: { width: 0, height: 8 },
    elevation: 20,
  },
  item: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 12, paddingVertical: 10, minHeight: 56 },
  itemBorder: { borderBottomWidth: 1, borderBottomColor: c.divider },
  label: { flex: 1, color: c.textStrong, fontSize: 14, fontWeight: "600" },
  chev: { opacity: 0.6 },
  chevColor: { color: c.muted },
}));
