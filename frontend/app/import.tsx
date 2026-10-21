import * as Clipboard from "expo-clipboard";
import { router } from "expo-router";
import { useState } from "react";
import { Text, View } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { CosmicBackground } from "@/src/components/CosmicBackground";
import { PressableScale } from "@/src/components/PressableScale";
import { ScreenHeader } from "@/src/components/ScreenHeader";
import { TextField } from "@/src/components/TextField";
import { PrimaryButton } from "@/src/components/ui";
import { useI18n } from "@/src/i18n";
import { deriveWallet, isValidPhrase, normalizePhrase } from "@/src/lib/wallet";
import { useApp } from "@/src/state/app";
import { makeStyles } from "@/src/theme";

export default function ImportWallet() {
  const styles = useStyles();
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
      <KeyboardAwareScrollView bottomOffset={24} keyboardShouldPersistTaps="handled" contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 24 }]}>
        <View style={styles.content}>
          <Text style={styles.subtitle}>{t("import.subtitle")}</Text>
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
            hint={error || t("import.words", { n: count })}
            hintTone={error ? "error" : "muted"}
          />
          <PressableScale testID="import-paste-button" onPress={async () => setPhrase(await Clipboard.getStringAsync())} style={styles.paste}>
            <Text style={styles.pasteText}>{t("common.paste")}</Text>
          </PressableScale>
          <PrimaryButton
            testID="import-continue-button"
            label={busy ? t("import.restoring") : t("common.continue")}
            loading={busy}
            disabled={count !== 12 && count !== 24}
            onPress={submit}
          />
        </View>
      </KeyboardAwareScrollView>
    </View>
  );
}

const useStyles = makeStyles((c) => ({
  root: { flex: 1, backgroundColor: c.canvas },
  scroll: { flexGrow: 1 },
  content: { width: "100%", maxWidth: 520, alignSelf: "center", paddingHorizontal: 20, gap: 16 },
  subtitle: { color: c.muted, fontSize: 14, lineHeight: 21 },
  input: { minHeight: 140, textAlignVertical: "top", fontSize: 16, lineHeight: 24 },
  paste: { alignSelf: "flex-end", paddingHorizontal: 16, height: 36, borderRadius: 12, justifyContent: "center", backgroundColor: c.white10 },
  pasteText: { color: c.textStrong, fontSize: 13, fontWeight: "700" },
}));
