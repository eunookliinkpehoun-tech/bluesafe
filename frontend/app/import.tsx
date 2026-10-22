import * as Clipboard from "expo-clipboard";
import { router } from "expo-router";
import { useState } from "react";
import { Text, View } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { CosmicBackground } from "@/src/components/CosmicBackground";
import { Icon } from "@/src/components/Icon";
import { PressableScale } from "@/src/components/PressableScale";
import { ScreenHeader } from "@/src/components/ScreenHeader";
import { TextField } from "@/src/components/TextField";
import { HeroIcon, PrimaryButton } from "@/src/components/ui";
import { useI18n } from "@/src/i18n";
import { deriveWallet, isValidPhrase, normalizePhrase } from "@/src/lib/wallet";
import { useApp } from "@/src/state/app";
import { makeStyles, useTheme } from "@/src/theme";

export default function ImportWallet() {
  const styles = useStyles();
  const { colors } = useTheme();
  const { t } = useI18n();
  const insets = useSafeAreaInsets();
  const { setDraft } = useApp();
  const [phrase, setPhrase] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const count = normalizePhrase(phrase) ? normalizePhrase(phrase).split(" ").length : 0;

  const submit = async () => {
    if (!isValidPhrase(phrase)) {
      setError(t("import.invalid"));
      return;
    }
    setBusy(true);
    await new Promise((r) => setTimeout(r, 50));
    const normalized = normalizePhrase(phrase);
    const wallet = await deriveWallet(normalized);
    setDraft({ phrase: normalized, ...wallet });
    setBusy(false);
    router.push({ pathname: "/pin", params: { mode: "create" } });
  };

  return (
    <View style={styles.root} testID="import-screen">
      <CosmicBackground variant="welcome" />
      <ScreenHeader testID="import-header" title={t("import.title")} onBack={() => router.back()} />
      <KeyboardAwareScrollView
        bottomOffset={24}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 20 }]}
      >
        <View style={styles.content}>
          <View style={styles.head}>
            <HeroIcon icon="key" />
            <Text style={styles.subtitle}>{t("import.subtitle")}</Text>
          </View>
          <TextField
            testID="import-phrase-input"
            placeholder={t("import.placeholder")}
            value={phrase}
            onChangeText={(v) => {
              setPhrase(v);
              setError("");
            }}
            multiline
            autoCapitalize="none"
            style={styles.input}
            hint={error || undefined}
            hintTone="error"
          />
          <View style={styles.tools}>
            <View style={[styles.count, (count === 12 || count === 24) && styles.countOk]}>
              {count === 12 || count === 24 ? <Icon name="check" size={14} color={colors.accentEmerald} strokeWidth={2.6} /> : null}
              <Text style={[styles.countText, (count === 12 || count === 24) && styles.countTextOk]} testID="import-word-count">
                {t("import.words", { n: count })}
              </Text>
            </View>
            <PressableScale testID="import-paste-button" onPress={async () => setPhrase(await Clipboard.getStringAsync())} style={styles.paste}>
              <Icon name="clipboard" size={16} color={colors.textStrong} />
              <Text style={styles.pasteText}>{t("common.paste")}</Text>
            </PressableScale>
          </View>
          <View style={styles.secure}>
            <Icon name="shield" size={16} color={colors.accentBlue} />
            <Text style={styles.secureText}>{t("import.secure")}</Text>
          </View>
          <View style={styles.footer}>
            <PrimaryButton
              testID="import-continue-button"
              label={busy ? t("import.restoring") : t("common.continue")}
              loading={busy}
              disabled={count !== 12 && count !== 24}
              onPress={submit}
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
  content: { flex: 1, width: "100%", maxWidth: 520, alignSelf: "center", paddingHorizontal: 20, gap: 16 },
  head: { alignItems: "center", gap: 14, marginTop: 8, marginBottom: 8 },
  subtitle: { color: c.textSoft, fontSize: 15, lineHeight: 22, textAlign: "center", paddingHorizontal: 16 },
  input: { minHeight: 150, textAlignVertical: "top", fontSize: 16, lineHeight: 26 },
  tools: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 },
  count: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 12, height: 32, borderRadius: 16, backgroundColor: c.glassSubtle, borderWidth: 1, borderColor: c.border },
  countOk: { backgroundColor: c.emeraldSoft, borderColor: c.emeraldBorder },
  countText: { color: c.muted, fontSize: 12, fontWeight: "600" },
  countTextOk: { color: c.accentEmerald },
  paste: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    height: 40,
    borderRadius: 20,
    backgroundColor: c.glassStrong,
    borderWidth: 1,
    borderColor: c.white10,
  },
  pasteText: { color: c.textStrong, fontSize: 14, fontWeight: "700" },
  secure: { flexDirection: "row", alignItems: "flex-start", gap: 10, padding: 14, borderRadius: 16, backgroundColor: c.blueSoft, borderWidth: 1, borderColor: c.blueBorder },
  secureText: { flex: 1, color: c.onSurfaceSecondary, fontSize: 13, lineHeight: 19 },
  footer: { marginTop: "auto", paddingTop: 16 },
}));
