import { router } from "expo-router";
import { useEffect } from "react";
import { Text, View } from "react-native";
import Animated, {
  Easing,
  FadeIn,
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { CosmicBackground } from "@/src/components/CosmicBackground";
import { Icon } from "@/src/components/Icon";
import { VaultLogo } from "@/src/components/VaultLogo";
import { useI18n } from "@/src/i18n";
import { useApp } from "@/src/state/app";
import { makeStyles, useTheme } from "@/src/theme";

/** Animated splash + routing gate. */
export default function Splash() {
  const styles = useStyles();
  const { colors } = useTheme();
  const { t, ready } = useI18n();
  const { status } = useApp();
  const insets = useSafeAreaInsets();
  const scale = useSharedValue(0.5);
  const glow = useSharedValue(0);

  useEffect(() => {
    scale.value = withTiming(1, { duration: 520, easing: Easing.out(Easing.cubic) });
    glow.value = withRepeat(withTiming(1, { duration: 1400 }), -1, true);
  }, [scale, glow]);

  useEffect(() => {
    if (status === "loading" || !ready) return;
    const id = setTimeout(() => {
      if (status === "none") router.replace("/welcome");
      else if (status === "locked") router.replace({ pathname: "/pin", params: { mode: "unlock" } });
      else router.replace("/(tabs)");
    }, 1700);
    return () => clearTimeout(id);
  }, [status, ready]);

  const logoStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const glowStyle = useAnimatedStyle(() => ({ opacity: 0.35 + glow.value * 0.45, transform: [{ scale: 0.9 + glow.value * 0.2 }] }));

  return (
    <View style={styles.root} testID="splash-screen">
      <CosmicBackground variant="welcome" />
      <View style={styles.center}>
        <View style={styles.logoBox}>
          <Animated.View style={[styles.glow, glowStyle]} />
          <Animated.View style={logoStyle}>
            <VaultLogo size={108} />
          </Animated.View>
        </View>
        <Animated.Text entering={FadeInDown.delay(250).duration(600)} style={styles.name}>
          {t("appName")}
        </Animated.Text>
        <Animated.Text entering={FadeInDown.delay(450).duration(600)} style={styles.tagline}>
          {t("tagline")}
        </Animated.Text>
      </View>
      <Animated.View entering={FadeIn.delay(700).duration(600)} style={[styles.footer, { paddingBottom: insets.bottom + 24 }]}>
        <Icon name="shield" size={14} color={colors.accentBlue} />
        <Text style={styles.footerText}>{t("splash.secured")}</Text>
      </Animated.View>
    </View>
  );
}

const useStyles = makeStyles((c) => ({
  root: { flex: 1, backgroundColor: c.canvas },
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 10 },
  logoBox: { width: 180, height: 180, alignItems: "center", justifyContent: "center", marginBottom: 8 },
  glow: {
    position: "absolute",
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: c.brandTertiary,
    shadowColor: c.brandPrimary,
    shadowOpacity: 1,
    shadowRadius: 50,
    shadowOffset: { width: 0, height: 0 },
  },
  name: { color: c.textStrong, fontSize: 40, fontWeight: "800", letterSpacing: 1 },
  tagline: { color: c.muted, fontSize: 15, fontWeight: "500" },
  footer: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6 },
  footerText: { color: c.textFaint, fontSize: 12, fontWeight: "500" },
}));
