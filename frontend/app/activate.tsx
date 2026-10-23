import { useQueryClient } from "@tanstack/react-query";
import * as Clipboard from "expo-clipboard";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, RefreshControl, ScrollView, Text, View } from "react-native";
import QRCode from "react-native-qrcode-svg";
import Animated, { Easing, FadeInDown, ZoomIn } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { CosmicBackground } from "@/src/components/CosmicBackground";
import { Icon, type IconName } from "@/src/components/Icon";
import { PressableScale } from "@/src/components/PressableScale";
import { useToast } from "@/src/components/Toast";
import { PrimaryButton, ProgressBar, TextButton } from "@/src/components/ui";
import { VaultLogo } from "@/src/components/VaultLogo";
import { errorMessage, useConfigQuery, useVaultQuery } from "@/src/hooks/useVault";
import { useI18n } from "@/src/i18n";
import { activateGasless, isCodeTaken } from "@/src/lib/chain";
import { fmtAmount, pct } from "@/src/lib/format";
import { generateReferralCode } from "@/src/lib/wallet";
import { useApp, type Profile } from "@/src/state/app";
import { dirStyle, fonts, makeStyles, useTheme, webDir } from "@/src/theme";

/** Lifetime activation payment page: deposit 50 USDT to the predicted vault address, then deploy. */
export default function Activate() {
  const styles = useStyles();
  const { colors } = useTheme();
  const { t } = useI18n();
  const toast = useToast();
  const qc = useQueryClient();
  const insets = useSafeAreaInsets();
  const { getProfile, saveProfile, getPrivateKey, signOut } = useApp();
  const { data: cfg } = useConfigQuery();
  const vq = useVaultQuery();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [stage, setStage] = useState<"idle" | "activating" | "done">("idle");

  useEffect(() => {
    getProfile().then((p) => (p.name ? setProfile(p) : router.replace("/setup")));
  }, [getProfile]);

  useEffect(() => {
    if (vq.data?.deployed && stage === "idle") router.replace("/(tabs)");
  }, [vq.data?.deployed, stage]);

  const price = cfg ? BigInt(cfg.price) : 0n;
  const priceLabel = fmtAmount(price).replace(".00", "");
  const balance = vq.data?.balance ?? 0n;
  const funded = !!cfg && balance >= price;

  const activate = async () => {
    if (!profile) return;
    setStage("activating");
    try {
      let p = profile;
      if (await isCodeTaken(p.code)) {
        p = { ...p, code: generateReferralCode(p.name) };
        await saveProfile(p);
        setProfile(p);
      }
      await activateGasless(await getPrivateKey(), { name: p.name, code: p.code, referrer: p.referrer });
      setStage("done");
      await qc.invalidateQueries({ queryKey: ["vault"] });
      setTimeout(() => router.replace("/(tabs)"), 1800);
    } catch (e) {
      toast.show(errorMessage(e, t), "error");
      setStage("idle");
    }
  };

  const features: { icon: IconName; label: string }[] = [
    { icon: "safe", label: t("activate.f1") },
    { icon: "layers", label: t("activate.f2") },
    { icon: "zap", label: t("activate.f3") },
  ];

  if (stage === "done") {
    return (
      <View style={[styles.root, styles.doneBox]} testID="activate-success">
        <CosmicBackground variant="welcome" />
        <Animated.View entering={ZoomIn.duration(300).easing(Easing.out(Easing.cubic))} style={styles.doneIcon}>
          <Icon name="check" size={48} color={colors.accentEmerald} strokeWidth={3} />
        </Animated.View>
        <Animated.Text entering={FadeInDown.delay(200)} style={styles.doneText}>
          {t("activate.success")}
        </Animated.Text>
      </View>
    );
  }

  return (
    <View style={styles.root} testID="activate-screen">
      <CosmicBackground variant="welcome" />
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 24 }]}
        refreshControl={<RefreshControl refreshing={vq.isRefetching} onRefresh={() => vq.refetch()} tintColor={colors.brandPrimary} />}
      >
        <View style={styles.content}>
          <View style={styles.head}>
            <View style={styles.logoBox}>
              <View style={styles.logoGlow} />
              <VaultLogo size={60} />
            </View>
            <Text style={styles.title}>{t("activate.title")}</Text>
            <Text style={styles.subtitle}>{t("activate.subtitle")}</Text>
          </View>

          <LinearGradient colors={[colors.brandSecondary, colors.accentIndigo, colors.accentSky]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.priceBorder}>
            <View style={styles.priceCard}>
              <View style={[styles.priceRow, dirStyle("ltr")]} {...webDir("ltr")}>
                <Text style={styles.price} testID="activate-price">
                  {priceLabel}
                </Text>
                <Text style={styles.priceUnit}>USDT</Text>
              </View>
              <Text style={styles.once}>{t("activate.once")}</Text>
              <View style={styles.features}>
                {features.map((f) => (
                  <View key={f.icon} style={styles.feature}>
                    <View style={styles.featureIcon}>
                      <Icon name={f.icon} size={16} color={colors.accentCyan} />
                    </View>
                    <Text style={styles.featureText}>{f.label}</Text>
                  </View>
                ))}
              </View>
              {profile?.referrerName ? (
                <View style={styles.sponsor} testID="activate-sponsor">
                  <Icon name="users" size={14} color={colors.accentEmerald} />
                  <Text style={styles.sponsorText}>{t("activate.sponsor", { name: profile.referrerName })}</Text>
                </View>
              ) : null}
            </View>
          </LinearGradient>

          <View style={styles.card}>
            <Text style={styles.step}>{t("activate.step", { price: priceLabel })}</Text>
            {vq.data ? (
              <>
                <View style={styles.qr} testID="activate-qr">
                  <QRCode value={vq.data.vault} size={168} backgroundColor={colors.qrBackground} color={colors.qrForeground} />
                </View>
                <PressableScale
                  testID="activate-copy-address"
                  onPress={async () => {
                    await Clipboard.setStringAsync(vq.data!.vault);
                    toast.show(t("common.copied"));
                  }}
                  style={styles.addr}
                  scaleTo={0.98}
                >
                  <Text selectable style={styles.addrText} testID="activate-address">
                    {vq.data.vault}
                  </Text>
                  <View style={styles.copyBtn}>
                    <Icon name="copy" size={16} color={colors.accentBlue} />
                  </View>
                </PressableScale>
              </>
            ) : (
              <ActivityIndicator color={colors.accentSky} style={styles.loader} />
            )}
            <View style={styles.progressHead}>
              <Text style={styles.received}>{t("activate.received")}</Text>
              <Text style={styles.receivedValue} testID="activate-received">
                {fmtAmount(balance)} / {priceLabel} USDT
              </Text>
            </View>
            <ProgressBar value={pct(balance, price)} colorsFrom={[colors.brandPrimary, colors.accentEmerald]} height={8} />
            <View style={[styles.statusPill, funded && styles.statusPillOk]}>
              {funded ? <Icon name="checkCircle" size={14} color={colors.accentEmerald} /> : <ActivityIndicator size="small" color={colors.accentAmber} />}
              <Text style={[styles.statusText, funded && styles.funded]} testID="activate-status">
                {funded ? t("activate.funded") : t("activate.waiting")}
              </Text>
            </View>
            <Text style={styles.extra}>{t("activate.extra", { price: priceLabel })}</Text>
          </View>

          <PrimaryButton
            testID="activate-submit-button"
            label={stage === "activating" ? t("activate.activating") : t("activate.cta")}
            icon="sparkles"
            loading={stage === "activating"}
            disabled={!funded || !profile}
            onPress={activate}
          />
          <TextButton testID="activate-signout-button" tone="muted" icon="logout" label={t("activate.signOut")} onPress={signOut} />
        </View>
      </ScrollView>
    </View>
  );
}

const useStyles = makeStyles((c) => ({
  root: { flex: 1, backgroundColor: c.canvas },
  scroll: { flexGrow: 1 },
  content: { width: "100%", maxWidth: 520, alignSelf: "center", paddingHorizontal: 20, gap: 18 },
  head: { alignItems: "center", gap: 6 },
  logoBox: { width: 84, height: 84, alignItems: "center", justifyContent: "center" },
  logoGlow: {
    position: "absolute",
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: c.blueSoft,
    shadowColor: c.brandPrimary,
    shadowOpacity: 0.9,
    shadowRadius: 28,
    shadowOffset: { width: 0, height: 0 },
  },
  title: { color: c.textStrong, fontSize: 28, fontWeight: "900", marginTop: 4, textAlign: "center" },
  subtitle: { color: c.textSoft, fontSize: 15, textAlign: "center" },
  priceBorder: { borderRadius: 28, padding: 1.5 },
  priceCard: { borderRadius: 27, padding: 22, backgroundColor: c.sheet, gap: 6, alignItems: "center" },
  priceRow: { flexDirection: "row", alignItems: "flex-end", gap: 8 },
  price: { color: c.textStrong, fontSize: 56, lineHeight: 62, fontFamily: fonts.display, letterSpacing: -1 },
  priceUnit: { color: c.accentEmerald, fontSize: 20, fontFamily: fonts.display, marginBottom: 10 },
  once: { color: c.muted, fontSize: 13, fontWeight: "600", textAlign: "center" },
  features: { gap: 12, marginTop: 16, alignSelf: "stretch" },
  feature: { flexDirection: "row", alignItems: "center", gap: 12 },
  featureIcon: { width: 32, height: 32, borderRadius: 10, alignItems: "center", justifyContent: "center", backgroundColor: c.blueSoft },
  featureText: { flex: 1, color: c.onSurfaceSecondary, fontSize: 14, fontWeight: "500" },
  sponsor: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 14, paddingHorizontal: 12, height: 30, borderRadius: 15, backgroundColor: c.emeraldSoft },
  sponsorText: { color: c.accentEmerald, fontSize: 12, fontWeight: "700" },
  card: { padding: 20, borderRadius: 28, backgroundColor: c.glass, borderWidth: 1, borderColor: c.border, borderTopColor: c.glassHighlight, gap: 16 },
  step: { color: c.textStrong, fontSize: 15, fontWeight: "700", lineHeight: 22, textAlign: "center" },
  qr: {
    alignSelf: "center",
    padding: 14,
    borderRadius: 24,
    backgroundColor: c.qrBackground,
    shadowColor: c.brandPrimary,
    shadowOpacity: 0.4,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 0 },
  },
  loader: { marginVertical: 40 },
  addr: { flexDirection: "row", alignItems: "center", gap: 10, paddingStart: 14, paddingEnd: 6, paddingVertical: 6, borderRadius: 16, backgroundColor: c.glassInput, borderWidth: 1, borderColor: c.white10 },
  addrText: { flex: 1, color: c.textStrong, fontSize: 12, lineHeight: 18, fontFamily: "monospace", wordBreak: "break-all" } as any,
  copyBtn: { width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center", backgroundColor: c.brandTertiary },
  progressHead: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  received: { color: c.muted, fontSize: 13, fontWeight: "600" },
  receivedValue: { color: c.textStrong, fontSize: 14, fontFamily: fonts.display, fontVariant: ["tabular-nums"] },
  statusPill: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, alignSelf: "center", paddingHorizontal: 14, height: 34, borderRadius: 17, backgroundColor: c.amberSoft },
  statusPillOk: { backgroundColor: c.emeraldSoft },
  statusText: { color: c.accentAmber, fontSize: 13, fontWeight: "600", textAlign: "center" },
  funded: { color: c.accentEmerald, fontWeight: "700" },
  extra: { color: c.textFaint, fontSize: 12, lineHeight: 17, textAlign: "center" },
  doneBox: { alignItems: "center", justifyContent: "center", gap: 18 },
  doneIcon: { width: 112, height: 112, borderRadius: 56, alignItems: "center", justifyContent: "center", backgroundColor: c.emeraldSoft, borderWidth: 1, borderColor: c.emeraldBorder },
  doneText: { color: c.textStrong, fontSize: 26, fontWeight: "800", textAlign: "center" },
}));
