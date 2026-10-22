import { router } from "expo-router";
import { useEffect, useState } from "react";
import { Text, View } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Avatar } from "@/src/components/Avatar";
import { CosmicBackground } from "@/src/components/CosmicBackground";
import { ScreenHeader } from "@/src/components/ScreenHeader";
import { TextField } from "@/src/components/TextField";
import { PrimaryButton } from "@/src/components/ui";
import { useI18n } from "@/src/i18n";
import { resolveCode } from "@/src/lib/chain";
import { generateReferralCode } from "@/src/lib/wallet";
import { useApp } from "@/src/state/app";
import { makeStyles } from "@/src/theme";

type Ref = { owner: `0x${string}`; name: string } | null;

export default function Setup() {
  const styles = useStyles();
  const { t } = useI18n();
  const insets = useSafeAreaInsets();
  const { address, saveProfile, pendingRefCode, signOut } = useApp();
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [ref, setRef] = useState<Ref>(null);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    pendingRefCode().then((c) => c && setCode(c));
  }, [pendingRefCode]);

  useEffect(() => {
    setRef(null);
    const value = code.trim();
    if (!value) return;
    setChecking(true);
    const id = setTimeout(async () => {
      try {
        const r = await resolveCode(value);
        setRef(r && r.owner.toLowerCase() !== address?.toLowerCase() ? { owner: r.owner, name: r.name } : null);
      } catch {
        setRef(null);
      } finally {
        setChecking(false);
      }
    }, 500);
    return () => clearTimeout(id);
  }, [code, address]);

  const trimmed = name.trim();
  const refInvalid = !!code.trim() && !checking && !ref;
  const valid = trimmed.length > 0 && new TextEncoder().encode(trimmed).length <= 32 && !checking && !refInvalid;

  return (
    <View style={styles.root} testID="setup-screen">
      <CosmicBackground variant="welcome" />
      <ScreenHeader
        testID="setup-header"
        title={t("setup.title")}
        onBack={async () => {
          await signOut();
          router.replace("/welcome");
        }}
      />
      <KeyboardAwareScrollView
        bottomOffset={24}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 20 }]}
      >
        <View style={styles.content}>
          <View style={styles.head}>
            <View style={styles.avatarBox}>
              <View style={styles.avatarGlow} />
              <Avatar seed={address ?? "tirelire"} size={96} />
            </View>
            <Text style={styles.subtitle}>{t("setup.subtitle")}</Text>
          </View>
          <View style={styles.card}>
            <TextField
              testID="setup-name-input"
              label={t("setup.nameLabel")}
              placeholder={t("setup.namePlaceholder")}
              value={name}
              onChangeText={setName}
              maxLength={32}
            />
            <TextField
              testID="setup-referral-input"
              label={`${t("setup.refLabel")} · ${t("common.optional")}`}
              placeholder={t("setup.refPlaceholder")}
              value={code}
              onChangeText={(v) => setCode(v.toUpperCase())}
              autoCapitalize="characters"
              mono
              hint={checking ? t("setup.refChecking") : ref ? t("setup.refValid", { name: ref.name }) : refInvalid ? t("setup.refInvalid") : undefined}
              hintTone={checking ? "muted" : ref ? "success" : "error"}
            />
          </View>
          <View style={styles.footer}>
            <PrimaryButton
              testID="setup-continue-button"
              label={t("common.continue")}
              disabled={!valid}
              onPress={async () => {
                await saveProfile({ name: trimmed, code: generateReferralCode(trimmed), referrer: ref?.owner ?? null, referrerName: ref?.name ?? "" });
                router.replace("/activate");
              }}
            />
          </View>
        </View>
      </KeyboardAwareScrollView>
    </View>
  );
}

const useStyles = makeStyles((c) => ({
  root: { flex: 1, backgroundColor: c.canvas },
  scroll: { flexGrow: 1 },
  content: { flex: 1, width: "100%", maxWidth: 520, alignSelf: "center", paddingHorizontal: 20, gap: 20 },
  head: { alignItems: "center", gap: 16, marginTop: 8 },
  avatarBox: { width: 120, height: 120, alignItems: "center", justifyContent: "center" },
  avatarGlow: {
    position: "absolute",
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: c.blueSoft,
    shadowColor: c.brandPrimary,
    shadowOpacity: 0.8,
    shadowRadius: 30,
    shadowOffset: { width: 0, height: 0 },
  },
  subtitle: { color: c.textSoft, fontSize: 15, lineHeight: 22, textAlign: "center", paddingHorizontal: 16 },
  card: { gap: 18, padding: 18, borderRadius: 24, backgroundColor: c.glass, borderWidth: 1, borderColor: c.border, borderTopColor: c.glassHighlight },
  footer: { marginTop: "auto", paddingTop: 12 },
}));
