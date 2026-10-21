import type { BottomTabBarProps } from "expo-router/js-tabs";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect } from "react";
import { View } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useI18n } from "@/src/i18n";
import { useOverlay } from "@/src/state/overlay";
import { makeStyles, useTheme } from "@/src/theme";
import { Icon, type IconName } from "./Icon";
import { PressableScale } from "./PressableScale";

export const TAB_BAR_HEIGHT = 64;
export const tabBottom = (insetBottom: number) => insetBottom + 12;

/** Bottom padding a tab screen needs so content clears the floating nav bar. */
export function useTabSpace() {
  const insets = useSafeAreaInsets();
  return TAB_BAR_HEIGHT + tabBottom(insets.bottom) + 24;
}

const ITEMS: { name: string; icon: IconName; label: string }[] = [
  { name: "index", icon: "shield", label: "nav.home" },
  { name: "history", icon: "clock", label: "nav.history" },
  { name: "team", icon: "user", label: "nav.team" },
];

/** Floating glass nav bar + gradient "+" button, identical on every tab screen. */
export function FloatingTabBar({ state, navigation }: BottomTabBarProps) {
  const styles = useStyles();
  const { colors } = useTheme();
  const { t } = useI18n();
  const insets = useSafeAreaInsets();
  const { plusOpen, setPlusOpen } = useOverlay();
  const current = state.routes[state.index]?.name;
  const active = current === "subaccounts" ? "index" : current;

  const rotate = useSharedValue(0);
  useEffect(() => {
    rotate.value = withTiming(plusOpen ? 45 : 0, { duration: 220 });
  }, [plusOpen, rotate]);
  const plusStyle = useAnimatedStyle(() => ({ transform: [{ rotate: `${rotate.value}deg` }] }));

  return (
    <View pointerEvents="box-none" style={[styles.host, { bottom: tabBottom(insets.bottom) }]}>
      <View style={styles.inner} testID="floating-nav-bar">
        <View style={styles.pill}>
          {ITEMS.map((it) => {
            const isActive = active === it.name;
            return (
              <PressableScale
                key={it.name}
                testID={`nav-${it.name === "index" ? "home" : it.name}`}
                accessibilityLabel={t(it.label)}
                accessibilityState={{ selected: isActive }}
                onPress={() => navigation.navigate(it.name as never)}
                style={styles.item}
              >
                <Icon
                  name={it.icon}
                  size={24}
                  color={isActive ? colors.brandPrimary : colors.muted}
                  filled={it.icon === "shield" ? isActive : undefined}
                  strokeWidth={isActive ? 2.3 : 2}
                />
                {isActive ? <View style={styles.indicator} /> : null}
              </PressableScale>
            );
          })}
        </View>
        <PressableScale testID="nav-plus-button" accessibilityLabel={t("nav.plus")} onPress={() => setPlusOpen(!plusOpen)} style={styles.plusWrap}>
          <LinearGradient colors={[colors.brandSecondary, colors.accentIndigo]} start={{ x: 0, y: 1 }} end={{ x: 1, y: 0 }} style={styles.plus}>
            <Animated.View style={plusStyle}>
              <Icon name="plus" size={24} color={colors.onBrandPrimary} strokeWidth={2.5} />
            </Animated.View>
          </LinearGradient>
        </PressableScale>
      </View>
    </View>
  );
}

const useStyles = makeStyles((c) => ({
  host: { position: "absolute", start: 0, end: 0, paddingHorizontal: 16, alignItems: "center" },
  inner: { width: "100%", maxWidth: 480, flexDirection: "row", alignItems: "center", gap: 12 },
  pill: {
    flex: 1,
    height: TAB_BAR_HEIGHT,
    borderRadius: 32,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    paddingHorizontal: 12,
    backgroundColor: c.navBar,
    borderWidth: 1,
    borderColor: c.white10,
    shadowColor: c.canvas,
    shadowOpacity: 0.8,
    shadowRadius: 28,
    shadowOffset: { width: 0, height: 12 },
    elevation: 16,
  },
  item: { width: 52, height: 48, alignItems: "center", justifyContent: "center" },
  indicator: {
    position: "absolute",
    bottom: 2,
    width: 14,
    height: 2,
    borderRadius: 1,
    backgroundColor: c.brandPrimary,
    shadowColor: c.brandPrimary,
    shadowOpacity: 1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 0 },
  },
  plusWrap: {
    borderRadius: 24,
    shadowColor: c.brandSecondary,
    shadowOpacity: 0.6,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 0 },
    elevation: 14,
  },
  plus: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: c.borderStrong,
  },
}));
