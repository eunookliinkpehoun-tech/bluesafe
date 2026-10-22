import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { CosmicBackground } from "@/src/components/CosmicBackground";
import { Icon } from "@/src/components/Icon";
import { PinPad } from "@/src/components/PinPad";
import { PressableScale } from "@/src/components/PressableScale";
import { TextButton } from "@/src/components/ui";
import { VaultLogo } from "@/src/components/VaultLogo";
import { useI18n } from "@/src/i18n";
import { useApp } from "@/src/state/app";
import { makeStyles, useTheme } from "@/src/theme";

export default function Pin() {
  const styles = useStyles();
  const { colors } = useTheme();
  const { t, isRTL } = useI18n();
  const insets = useSafeAreaInsets();
  const { mode } = useLocalSearchParams<{ mode: "create" | "unlock" }>();
  const { draft, commitWallet, unlock, address, nextRoute, signOut } = useApp();
  const [first, setFirst] = useState<string | null>(null);
  const [error, setError] = useState<string | undefined>();
  const [resetKey, setResetKey] = useState(0);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (mode === "create" && !draft && !busy) router.replace("/welcome");
  }, [mode, draft, busy]);

  const fail = (msg: string) => {
    setError(msg);
    setResetKey((k) => k + 1);
  };

  const onComplete = async (pin: string) => {
    setError(undefined);
    if (mode === "unlock") {
      if (!(await unlock(pin))) return fail(t("pin.wrong"));
      setBusy(true);
      router.replace(await nextRoute(address!));
      return;
    }
    if (!first) {
      setFirst(pin);
      setResetKey((k) => k + 1);
      return;
    }
    if (pin !== first) {
      setFirst(null);
      return fail(t("pin.mismatch"));
    }
    setBusy(true);
    const addr = await commitWallet(pin);
    router.replace(await nextRoute(addr));
  };

  const title = mode === "unlock" ? t("pin.unlock") : first ? t("pin.confirm") : t("pin.create");
  const sub = mode === "unlock" ? t("pin.unlockSub") : first ? t("pin.confirmSub") : t("pin.createSub");

  return (
    <View style={[styles.root, { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 16 }]} testID={`pin-screen-${mode}`}>
      <CosmicBackground variant="welcome" />
      {mode === "create" && !busy ? (
        <PressableScale
          testID="pin-back-button"
          accessibilityLabel={t("common.back")}
          onPress={() => router.back()}
          style={[styles.back, { top: insets.top + 8 }]}
        >
          <Icon name={isRTL ? "chevronRight" : "chevronLeft"} size={20} color={colors.textStrong} strokeWidth={2.2} />
        </PressableScale>
      ) : null}
      <View style={styles.head}>
        <View style={styles.logoBox}>
          <View style={styles.logoGlow} />
          <VaultLogo size={60} />
        </View>
        <Text style={styles.title} testID="pin-title">
          {title}
        </Text>
        <Text style={styles.sub}>{sub}</Text>
      </View>
      <View style={styles.pad}>
        {busy ? <ActivityIndicator color={colors.accentSky} size="large" /> : <PinPad onComplete={onComplete} error={error} resetKey={resetKey} />}
      </View>
      <View style={styles.bottom}>
        {mode === "unlock" && !busy ? (
          <TextButton
            testID="pin-forgot-button"
            label={t("pin.forgot")}
            onPress={async () => {
              await signOut();
              router.replace("/import");
            }}
          />
        ) : null}
      </View>
    </View>
  );
}

const useStyles = makeStyles((c) => ({
  root: { flex: 1, backgroundColor: c.canvas, alignItems: "center", paddingHorizontal: 24 },
  back: {
    position: "absolute",
    start: 20,
    zIndex: 2,
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: c.glassStrong,
    borderWidth: 1,
    borderColor: c.white10,
    borderTopColor: c.glassHighlight,
  },
  head: { alignItems: "center", gap: 8, width: "100%", maxWidth: 420 },
  logoBox: { width: 88, height: 88, alignItems: "center", justifyContent: "center", marginBottom: 8 },
  logoGlow: {
    position: "absolute",
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: c.blueSoft,
    shadowColor: c.brandPrimary,
    shadowOpacity: 0.9,
    shadowRadius: 30,
    shadowOffset: { width: 0, height: 0 },
  },
  title: { color: c.textStrong, fontSize: 26, fontWeight: "800", textAlign: "center" },
  sub: { color: c.textSoft, fontSize: 15, lineHeight: 22, textAlign: "center", paddingHorizontal: 12 },
  pad: { flex: 1, width: "100%", alignItems: "center", justifyContent: "center" },
  bottom: { minHeight: 48, justifyContent: "center" },
}));
