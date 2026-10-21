import { useQueryClient } from "@tanstack/react-query";
import * as Clipboard from "expo-clipboard";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { RefreshControl, ScrollView, Text, View } from "react-native";
import QRCode from "react-native-qrcode-svg";
import Animated, { FadeInDown, ZoomIn } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { CosmicBackground } from "@/src/components/CosmicBackground";
import { Icon, type IconName } from "@/src/components/Icon";
import { PressableScale } from "@/src/components/PressableScale";
import { useToast } from "@/src/components/Toast";
import { PrimaryButton, ProgressBar } from "@/src/components/ui";
import { VaultLogo } from "@/src/components/VaultLogo";
import { errorMessage, useConfigQuery, useVaultQuery } from "@/src/hooks/useVault";
import { useI18n } from "@/src/i18n";
import { activateGasless, isCodeTaken } from "@/src/lib/chain";
import { fmtAmount, pct } from "@/src/lib/format";
import { generateReferralCode } from "@/src/lib/wallet";
import { useApp, type Profile } from "@/src/state/app";
import { makeStyles, useTheme } from "@/src/theme";

/** Lifetime activation payment page: deposit 50 USDT to the predicted vault address, then deploy. */
export default function Activate() {
  const styles = useStyles();
  const { colors } = useTheme();
  const { t } = useI18n();
  const toast = useToast();
  const qc = useQueryClient();
  const insets = useSafeAreaInsets();
  const { status, getProfile, saveProfile, getPrivateKey, signOut } = useApp();
  const { data: cfg } = useConfigQuery();
  const vq = useVaultQuery();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [stage, setStage] = useState<"idle" | "activating" | "done">("idle");

  useEffect(() => {
    getProfile().then((p) => (p.name ? setProfile(p) : router.replace("/setup")));
  }, [getProfile]);

  useEffect(() => {
    if (status === "none") router.replace("/welcome");
  }, [status]);

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
        <Animated.View entering={ZoomIn.springify().damping(10)} style={styles.doneIcon}>
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
            <VaultLogo size={56} />
            <Text style={styles.title}>{t("activate.title")}</Text>
            <Text style={styles.subtitle}>{t("activate.subtitle")}</Text>
          </View>

          <LinearGradient colors={[colors.brandSecondary, colors.accentIndigo, colors.accentSky]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.priceBorder}>
            <View style={styles.priceCard}>
              <View style={styles.priceRow}>
                <Text style={styles.price} testID="activate-price">
                  {priceLabel}
                </Text>
                <Text style={styles.priceUnit}>USDT</Text>
              </View>
              <Text style={styles.once}>{t("activate.once")}</Text>
              <View style={styles.features}>
                {features.map((f) => (
                  <View key={f.icon} style={styles.feature}>
                    <Icon name={f.icon} size={18} color={colors.accentCyan} />
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
                  <QRCode value={vq.data.vault} size={156} backgroundColor={colors.qrBackground} color={colors.qrForeground} />
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
                  <Icon name="copy" size={16} color={colors.accentBlue} />
                </PressableScale>
              </>
            ) : (
              <Text style={styles.waiting}>{t("common.loading")}</Text>
            )}
            <View style={styles.progressHead}>
              <Text style={styles.received}>{t("activate.received")}</Text>
              <Text style={styles.receivedValue} testID="activate-received">
                {fmtAmount(balance)} / {priceLabel} USDT
              </Text>
            </View>
            <ProgressBar value={pct(balance, price)} colorsFrom={[colors.brandPrimary, colors.accentEmerald]} />
            <Text style={[styles.waiting, funded && styles.funded]} testID="activate-status">
              {funded ? t("activate.funded") : t("activate.waiting")}
            </Text>
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
          <PressableScale testID="activate-signout-button" onPress={signOut} style={styles.signout}>
            <Text style={styles.signoutText}>{t("activate.signOut")}</Text>
          </PressableScale>
        </View>
      </ScrollView>
    </View>
  );
}

const useStyles = makeStyles((c) => ({
  root: { flex: 1, backgroundColor: c.canvas },
  scroll: { flexGrow: 1 },
  content: { width: "100%", maxWidth: 520, alignSelf: "center", paddingHorizontal: 20, gap: 16 },
  head: { alignItems: "center", gap: 6 },
  title: { color: c.textStrong, fontSize: 26, fontWeight: "800", marginTop: 6, textAlign: "center" },
  subtitle: { color: c.muted, fontSize: 14 },
  priceBorder: { borderRadius: 26, padding: 1.5 },
  priceCard: { borderRadius: 25, padding: 20, backgroundColor: c.sheet, gap: 6 },
  priceRow: { flexDirection: "row", alignItems: "flex-end", gap: 8 },
  price: { color: c.textStrong, fontSize: 48, fontWeight: "800", letterSpacing: -1 },
  priceUnit: { color: c.accentEmerald, fontSize: 18, fontWeight: "800", marginBottom: 10 },
  once: { color: c.muted, fontSize: 13, fontWeight: "500" },
  features: { gap: 10, marginTop: 12 },
  feature: { flexDirection: "row", alignItems: "center", gap: 10 },
  featureText: { flex: 1, color: c.onSurfaceSecondary, fontSize: 14 },
  sponsor: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 12, alignSelf: "flex-start", paddingHorizontal: 10, height: 28, borderRadius: 14, backgroundColor: c.emeraldSoft },
  sponsorText: { color: c.accentEmerald, fontSize: 12, fontWeight: "700" },
  card: { padding: 18, borderRadius: 24, backgroundColor: c.glass, borderWidth: 1, borderColor: c.border, borderTopColor: c.glassHighlight, gap: 14 },
  step: { color: c.textStrong, fontSize: 14, fontWeight: "600", lineHeight: 20, textAlign: "center" },
  qr: { alignSelf: "center", padding: 12, borderRadius: 20, backgroundColor: c.qrBackground },
  addr: { flexDirection: "row", alignItems: "center", gap: 10, padding: 12, borderRadius: 14, backgroundColor: c.glassInput, borderWidth: 1, borderColor: c.white10 },
  addrText: { flex: 1, color: c.textStrong, fontSize: 12, fontFamily: "monospace" },
  progressHead: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  received: { color: c.muted, fontSize: 12, fontWeight: "600" },
  receivedValue: { color: c.textStrong, fontSize: 13, fontWeight: "700", fontVariant: ["tabular-nums"] },
  waiting: { color: c.muted, fontSize: 13, textAlign: "center" },
  funded: { color: c.accentEmerald, fontWeight: "700" },
  extra: { color: c.textFaint, fontSize: 11, textAlign: "center" },
  signout: { alignSelf: "center", height: 44, justifyContent: "center", paddingHorizontal: 16 },
  signoutText: { color: c.muted, fontSize: 13, fontWeight: "500" },
  doneBox: { alignItems: "center", justifyContent: "center", gap: 18 },
  doneIcon: { width: 110, height: 110, borderRadius: 55, alignItems: "center", justifyContent: "center", backgroundColor: c.emeraldSoft, borderWidth: 1, borderColor: c.emeraldBorder },
  doneText: { color: c.textStrong, fontSize: 26, fontWeight: "800" },
}));
