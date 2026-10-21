import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { CosmicBackground } from "@/src/components/CosmicBackground";
import { PinPad } from "@/src/components/PinPad";
import { PressableScale } from "@/src/components/PressableScale";
import { VaultLogo } from "@/src/components/VaultLogo";
import { useI18n } from "@/src/i18n";
import { useApp } from "@/src/state/app";
import { makeStyles, useTheme } from "@/src/theme";

export default function Pin() {
  const styles = useStyles();
  const { colors } = useTheme();
  const { t } = useI18n();
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
    <View style={[styles.root, { paddingTop: insets.top + 32, paddingBottom: insets.bottom + 24 }]} testID={`pin-screen-${mode}`}>
      <CosmicBackground variant="welcome" />
      <View style={styles.head}>
        <VaultLogo size={64} />
        <Text style={styles.title} testID="pin-title">
          {title}
        </Text>
        <Text style={styles.sub}>{sub}</Text>
      </View>
      {busy ? (
        <ActivityIndicator color={colors.brandPrimary} size="large" style={styles.loader} />
      ) : (
        <PinPad onComplete={onComplete} error={error} resetKey={resetKey} />
      )}
      {mode === "unlock" && !busy ? (
        <PressableScale
          testID="pin-forgot-button"
          onPress={async () => {
            await signOut();
            router.replace("/import");
          }}
          style={styles.forgot}
        >
          <Text style={styles.forgotText}>{t("pin.forgot")}</Text>
        </PressableScale>
      ) : null}
    </View>
  );
}

const useStyles = makeStyles((c) => ({
  root: { flex: 1, backgroundColor: c.canvas, alignItems: "center", paddingHorizontal: 24 },
  head: { alignItems: "center", gap: 10, marginBottom: 36 },
  title: { color: c.textStrong, fontSize: 24, fontWeight: "800", marginTop: 8 },
  sub: { color: c.muted, fontSize: 14, textAlign: "center" },
  loader: { marginTop: 60 },
  forgot: { marginTop: "auto", height: 44, justifyContent: "center", paddingHorizontal: 16 },
  forgotText: { color: c.accentBlue, fontSize: 14, fontWeight: "600" },
}));
