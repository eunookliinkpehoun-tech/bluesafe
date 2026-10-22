import { router } from "expo-router";
import { useEffect, useState } from "react";
import { ScrollView, Text, useWindowDimensions, View } from "react-native";
import Animated, { FadeIn, FadeInDown, FadeInRight, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { CosmicBackground } from "@/src/components/CosmicBackground";
import { Icon } from "@/src/components/Icon";
import { PressableScale } from "@/src/components/PressableScale";
import { GhostButton, PrimaryButton, TextButton } from "@/src/components/ui";
import { VaultLogo } from "@/src/components/VaultLogo";
import { LANGS, useI18n } from "@/src/i18n";
import { useApp } from "@/src/state/app";
import { makeStyles, useTheme } from "@/src/theme";

const SLIDES = [1, 2, 3];

export default function Welcome() {
  const styles = useStyles();
  const { colors } = useTheme();
  const { t, lang, setLang } = useI18n();
  const { enterDemo } = useApp();
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const compact = height < 720;
  const [slide, setSlide] = useState(0);
  const float = useSharedValue(0);

  useEffect(() => {
    float.value = withRepeat(withTiming(1, { duration: 2600 }), -1, true);
    const id = setInterval(() => setSlide((s) => (s + 1) % SLIDES.length), 4500);
    return () => clearInterval(id);
  }, [float]);

  const floatStyle = useAnimatedStyle(() => ({ transform: [{ translateY: -8 * float.value }] }));
  const n = SLIDES[slide];

  return (
    <View style={styles.root} testID="welcome-screen">
      <CosmicBackground variant="welcome" />
      <ScrollView contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 20 }]} bounces={false}>
        <View style={styles.content}>
          <View style={styles.top}>
            <View style={styles.brand}>
              <VaultLogo size={28} />
              <Text style={styles.brandText}>{t("appName")}</Text>
            </View>
            <View style={styles.langs}>
              {LANGS.map((l) => (
                <PressableScale key={l.code} testID={`welcome-lang-${l.code}`} onPress={() => setLang(l.code)} style={[styles.lang, lang === l.code && styles.langActive]}>
                  <Text style={[styles.langText, lang === l.code && styles.langTextActive]}>{l.label}</Text>
                </PressableScale>
              ))}
            </View>
          </View>

          <Animated.View entering={FadeIn.duration(700)} style={[styles.hero, compact && styles.heroCompact, floatStyle]}>
            <View style={styles.halo} />
            <View style={styles.ring}>
              <VaultLogo size={124} />
            </View>
            <View style={[styles.coin, styles.coinA]}>
              <Text style={styles.coinText}>₮</Text>
            </View>
            <View style={[styles.coin, styles.coinB]}>
              <Text style={styles.coinText}>₮</Text>
            </View>
          </Animated.View>

          <View style={styles.slideBox}>
            <Animated.View key={slide} entering={FadeInRight.duration(450)} testID={`welcome-slide-${n}`}>
              <Text style={styles.title}>{t(`welcome.s${n}Title`)}</Text>
              <Text style={styles.body}>{t(`welcome.s${n}Body`)}</Text>
            </Animated.View>
          </View>
          <View style={styles.dots}>
            {SLIDES.map((s, i) => (
              <PressableScale key={s} testID={`welcome-dot-${s}`} onPress={() => setSlide(i)} style={styles.dotHit} haptic={false}>
                <View style={[styles.dot, i === slide && styles.dotActive]} />
              </PressableScale>
            ))}
          </View>

          <Animated.View entering={FadeInDown.delay(200).duration(600)} style={styles.actions}>
            <PrimaryButton testID="welcome-create-button" label={t("welcome.create")} icon="sparkles" onPress={() => router.push("/create")} />
            <GhostButton testID="welcome-import-button" label={t("welcome.import")} icon="key" onPress={() => router.push("/import")} />
            <TextButton
              testID="welcome-demo-button"
              icon="eye"
              label={t("welcome.demo")}
              onPress={async () => {
                await enterDemo();
                router.replace("/(tabs)");
              }}
            />
          </Animated.View>
          <View style={styles.footer}>
            <Icon name="lock" size={12} color={colors.textFaint} />
            <Text style={styles.footerText}>{t("welcome.footer")}</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const useStyles = makeStyles((c) => ({
  root: { flex: 1, backgroundColor: c.canvas },
  scroll: { flexGrow: 1 },
  content: { flex: 1, width: "100%", maxWidth: 520, alignSelf: "center", paddingHorizontal: 24 },
  top: { minHeight: 48, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  brand: { flexDirection: "row", alignItems: "center", gap: 10 },
  brandText: { color: c.textStrong, fontSize: 19, fontWeight: "800", letterSpacing: 0.3 },
  langs: { flexDirection: "row", gap: 2, padding: 3, borderRadius: 14, backgroundColor: c.glassStrong, borderWidth: 1, borderColor: c.white10 },
  lang: { height: 32, minWidth: 42, paddingHorizontal: 10, borderRadius: 11, alignItems: "center", justifyContent: "center" },
  langActive: { backgroundColor: c.brandSecondary },
  langText: { color: c.muted, fontSize: 12, fontWeight: "700", textAlign: "center" },
  langTextActive: { color: c.onBrandPrimary },
  hero: { height: 260, alignItems: "center", justifyContent: "center", marginTop: 16 },
  heroCompact: { height: 200, marginTop: 4 },
  halo: {
    position: "absolute",
    width: 210,
    height: 210,
    borderRadius: 105,
    backgroundColor: c.blueSoft,
    shadowColor: c.brandPrimary,
    shadowOpacity: 0.9,
    shadowRadius: 60,
    shadowOffset: { width: 0, height: 0 },
  },
  ring: {
    width: 184,
    height: 184,
    borderRadius: 92,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: c.glassCard,
    borderWidth: 1,
    borderColor: c.white10,
    borderTopColor: c.glassHighlight,
  },
  coin: {
    position: "absolute",
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: c.emeraldSoft,
    borderWidth: 1,
    borderColor: c.emeraldBorder,
  },
  coinA: { top: 22, end: "16%" },
  coinB: { bottom: 28, start: "14%", width: 32, height: 32, borderRadius: 16 },
  coinText: { color: c.accentEmerald, fontSize: 18, fontWeight: "800", textAlign: "center" },
  slideBox: { minHeight: 156, marginTop: 24, justifyContent: "center", alignItems: "center" },
  title: { color: c.textStrong, fontSize: 32, lineHeight: 40, fontWeight: "900", letterSpacing: -0.6, textAlign: "center" },
  body: { color: c.textSoft, fontSize: 16, lineHeight: 24, textAlign: "center", marginTop: 14, paddingHorizontal: 12 },
  dots: { flexDirection: "row", justifyContent: "center", gap: 2, marginTop: 16 },
  dotHit: { padding: 6 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: c.white15 },
  dotActive: { width: 26, backgroundColor: c.accentSky },
  actions: { gap: 12, marginTop: "auto", paddingTop: 28 },
  footer: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, marginTop: 4 },
  footerText: { color: c.textFaint, fontSize: 12, textAlign: "center" },
}));
