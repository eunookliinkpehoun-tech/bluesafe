import { router } from "expo-router";
import { useEffect, useState } from "react";
import { ScrollView, Text, View } from "react-native";
import Animated, { FadeIn, FadeInDown, FadeInRight, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { CosmicBackground } from "@/src/components/CosmicBackground";
import { Icon } from "@/src/components/Icon";
import { PressableScale } from "@/src/components/PressableScale";
import { GhostButton, PrimaryButton } from "@/src/components/ui";
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

          <Animated.View entering={FadeIn.duration(700)} style={[styles.hero, floatStyle]}>
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
            <PressableScale
              testID="welcome-demo-button"
              onPress={async () => {
                await enterDemo();
                router.replace("/(tabs)");
              }}
              style={styles.demo}
            >
              <Icon name="eye" size={16} color={colors.accentBlue} />
              <Text style={styles.demoText}>{t("welcome.demo")}</Text>
            </PressableScale>
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
  top: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  brand: { flexDirection: "row", alignItems: "center", gap: 8 },
  brandText: { color: c.textStrong, fontSize: 17, fontWeight: "800", letterSpacing: 0.5 },
  langs: { flexDirection: "row", gap: 4, padding: 4, borderRadius: 14, backgroundColor: c.glassCard, borderWidth: 1, borderColor: c.border },
  lang: { height: 30, minWidth: 38, paddingHorizontal: 8, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  langActive: { backgroundColor: c.brandTertiary },
  langText: { color: c.muted, fontSize: 12, fontWeight: "700" },
  langTextActive: { color: c.textStrong },
  hero: { height: 250, alignItems: "center", justifyContent: "center", marginTop: 12 },
  halo: {
    position: "absolute",
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: c.blueSoft,
    shadowColor: c.brandPrimary,
    shadowOpacity: 0.9,
    shadowRadius: 60,
    shadowOffset: { width: 0, height: 0 },
  },
  ring: {
    width: 176,
    height: 176,
    borderRadius: 88,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: c.glassCard,
    borderWidth: 1,
    borderColor: c.white10,
    borderTopColor: c.glassHighlight,
  },
  coin: {
    position: "absolute",
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: c.emeraldSoft,
    borderWidth: 1,
    borderColor: c.emeraldBorder,
  },
  coinA: { top: 26, end: "18%" },
  coinB: { bottom: 30, start: "16%", width: 30, height: 30, borderRadius: 15 },
  coinText: { color: c.accentEmerald, fontSize: 18, fontWeight: "800" },
  slideBox: { minHeight: 150, marginTop: 20, justifyContent: "center" },
  title: { color: c.textStrong, fontSize: 32, lineHeight: 40, fontWeight: "800", letterSpacing: -0.5, textAlign: "center" },
  body: { color: c.muted, fontSize: 15, lineHeight: 22, textAlign: "center", marginTop: 12, paddingHorizontal: 8 },
  dots: { flexDirection: "row", justifyContent: "center", gap: 4, marginTop: 12 },
  dotHit: { padding: 6 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: c.white15 },
  dotActive: { width: 24, backgroundColor: c.brandPrimary },
  actions: { gap: 12, marginTop: "auto", paddingTop: 24 },
  demo: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, height: 44 },
  demoText: { color: c.accentBlue, fontSize: 14, fontWeight: "600" },
  footer: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, marginTop: 8 },
  footerText: { color: c.textFaint, fontSize: 11 },
}));
