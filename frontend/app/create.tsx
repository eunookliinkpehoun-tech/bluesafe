import * as Clipboard from "expo-clipboard";
import { router } from "expo-router";
import { useMemo, useState } from "react";
import { ScrollView, Text, View } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { CosmicBackground } from "@/src/components/CosmicBackground";
import { Icon } from "@/src/components/Icon";
import { PressableScale } from "@/src/components/PressableScale";
import { ScreenHeader } from "@/src/components/ScreenHeader";
import { useToast } from "@/src/components/Toast";
import { PrimaryButton, StepBar, TextButton } from "@/src/components/ui";
import { useI18n } from "@/src/i18n";
import { createPhrase, deriveWallet, randomWords } from "@/src/lib/wallet";
import { useApp } from "@/src/state/app";
import { fonts, makeStyles, useTheme } from "@/src/theme";

function shuffle<T>(arr: T[]) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function CreateWallet() {
  const styles = useStyles();
  const { colors } = useTheme();
  const { t } = useI18n();
  const toast = useToast();
  const insets = useSafeAreaInsets();
  const { setDraft } = useApp();
  const [phrase] = useState(createPhrase);
  const words = useMemo(() => phrase.split(" "), [phrase]);
  const [step, setStep] = useState<"show" | "verify">("show");
  const [revealed, setRevealed] = useState(false);
  const [checked, setChecked] = useState(false);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [busy, setBusy] = useState(false);

  const quiz = useMemo(() => {
    const positions = shuffle(words.map((_, i) => i)).slice(0, 3).sort((a, b) => a - b);
    return positions.map((p) => ({ p, options: shuffle([words[p], ...randomWords(3, words)]) }));
  }, [words]);
  const allAnswered = quiz.every((q) => answers[q.p]);
  const allCorrect = quiz.every((q) => answers[q.p] === words[q.p]);

  const finish = async () => {
    setBusy(true);
    await new Promise((r) => setTimeout(r, 50));
    const wallet = await deriveWallet(phrase);
    setDraft({ phrase, ...wallet });
    setBusy(false);
    router.push({ pathname: "/pin", params: { mode: "create" } });
  };

  return (
    <View style={styles.root} testID="create-screen">
      <CosmicBackground variant="welcome" />
      <ScreenHeader
        testID="create-header"
        title={step === "show" ? t("create.title") : t("create.verifyTitle")}
        onBack={() => (step === "verify" ? setStep("show") : router.back())}
      />
      <ScrollView contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 20 }]} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          <StepBar step={step === "show" ? 1 : 2} total={2} label={t("create.step", { n: step === "show" ? 1 : 2, total: 2 })} />
          {step === "show" ? (
            <>
              <Text style={styles.subtitle}>{t("create.subtitle")}</Text>
              <PressableScale testID="create-reveal-button" onPress={() => setRevealed(true)} scaleTo={0.99} style={styles.grid} haptic={!revealed}>
                {words.map((w, i) => (
                  <View key={i} style={styles.word}>
                    <View style={styles.idxBadge}>
                      <Text style={styles.idx}>{i + 1}</Text>
                    </View>
                    <Text style={[styles.wordText, !revealed && styles.hidden]} testID={`create-word-${i + 1}`} numberOfLines={1}>
                      {revealed ? w : "••••••"}
                    </Text>
                  </View>
                ))}
                {!revealed ? (
                  <View style={styles.revealOverlay}>
                    <View style={styles.revealIcon}>
                      <Icon name="eye" size={22} color={colors.textStrong} />
                    </View>
                    <Text style={styles.revealText}>{t("create.reveal")}</Text>
                  </View>
                ) : null}
              </PressableScale>
              {revealed ? (
                <TextButton
                  testID="create-copy-button"
                  icon="copy"
                  label={t("common.copy")}
                  onPress={async () => {
                    await Clipboard.setStringAsync(phrase);
                    toast.show(t("create.copyWarn"), "info");
                  }}
                />
              ) : null}
              <View style={styles.warn}>
                <Icon name="alert" size={18} color={colors.accentAmber} />
                <View style={styles.warnTexts}>
                  <Text style={styles.warnText}>{t("create.warning1")}</Text>
                  <Text style={styles.warnText}>{t("create.warning2")}</Text>
                </View>
              </View>
              <View style={styles.footer}>
                <PressableScale testID="create-confirm-checkbox" onPress={() => setChecked(!checked)} style={styles.check} scaleTo={0.98}>
                  <View style={[styles.box, checked && styles.boxOn]}>{checked ? <Icon name="check" size={14} color={colors.onBrandPrimary} strokeWidth={3} /> : null}</View>
                  <Text style={styles.checkText}>{t("create.confirmCheck")}</Text>
                </PressableScale>
                <PrimaryButton testID="create-continue-button" label={t("common.continue")} disabled={!revealed || !checked} onPress={() => setStep("verify")} />
              </View>
            </>
          ) : (
            <Animated.View entering={FadeIn.duration(300)} style={styles.verify}>
              <Text style={styles.subtitle}>{t("create.verifySubtitle")}</Text>
              {quiz.map((q) => (
                <View key={q.p} style={styles.quiz}>
                  <Text style={styles.quizLabel}>{t("create.word", { n: q.p + 1 })}</Text>
                  <View style={styles.options}>
                    {q.options.map((o) => {
                      const selected = answers[q.p] === o;
                      const wrong = selected && o !== words[q.p];
                      return (
                        <PressableScale
                          key={o}
                          testID={`verify-${q.p + 1}-${o}`}
                          onPress={() => setAnswers((a) => ({ ...a, [q.p]: o }))}
                          style={[styles.option, selected && styles.optionOn, wrong && styles.optionWrong]}
                        >
                          <Text style={[styles.optionText, selected && styles.optionTextOn]}>{o}</Text>
                        </PressableScale>
                      );
                    })}
                  </View>
                </View>
              ))}
              {allAnswered && !allCorrect ? (
                <Text style={styles.error} testID="verify-error">
                  {t("create.wrong")}
                </Text>
              ) : null}
              <View style={styles.footer}>
                <PrimaryButton
                  testID="verify-continue-button"
                  label={busy ? t("create.securing") : t("common.continue")}
                  loading={busy}
                  disabled={!allCorrect}
                  onPress={finish}
                />
              </View>
            </Animated.View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const useStyles = makeStyles((c) => ({
  root: { flex: 1, backgroundColor: c.canvas },
  scroll: { flexGrow: 1 },
  content: { flex: 1, width: "100%", maxWidth: 520, alignSelf: "center", paddingHorizontal: 20, gap: 18 },
  subtitle: { color: c.textSoft, fontSize: 15, lineHeight: 22, textAlign: "center", paddingHorizontal: 8 },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    padding: 14,
    borderRadius: 24,
    backgroundColor: c.glass,
    borderWidth: 1,
    borderColor: c.border,
    borderTopColor: c.glassHighlight,
    overflow: "hidden",
  },
  word: {
    width: "47%",
    flexGrow: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    height: 48,
    paddingHorizontal: 8,
    borderRadius: 14,
    backgroundColor: c.glassInput,
    borderWidth: 1,
    borderColor: c.white10,
  },
  idxBadge: { width: 28, height: 28, borderRadius: 9, alignItems: "center", justifyContent: "center", backgroundColor: c.brandTertiary },
  idx: { color: c.accentBlue, fontSize: 12, fontFamily: fonts.mono, textAlign: "center" },
  wordText: { flex: 1, color: c.textStrong, fontSize: 16, fontWeight: "700" },
  hidden: { color: c.textFaint, letterSpacing: 2 },
  revealOverlay: {
    position: "absolute",
    top: 0,
    bottom: 0,
    start: 0,
    end: 0,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    backgroundColor: c.overlay,
  },
  revealIcon: { width: 52, height: 52, borderRadius: 26, alignItems: "center", justifyContent: "center", backgroundColor: c.white10, borderWidth: 1, borderColor: c.white15 },
  revealText: { color: c.textStrong, fontSize: 15, fontWeight: "700", textAlign: "center" },
  warn: { flexDirection: "row", gap: 12, padding: 16, borderRadius: 18, backgroundColor: c.amberSoft, borderWidth: 1, borderColor: c.amberSoft },
  warnTexts: { flex: 1, gap: 4 },
  warnText: { color: c.onSurfaceSecondary, fontSize: 13, lineHeight: 19 },
  footer: { marginTop: "auto", gap: 14, paddingTop: 8 },
  check: { flexDirection: "row", alignItems: "center", gap: 12, minHeight: 48, paddingHorizontal: 4 },
  box: { width: 26, height: 26, borderRadius: 8, borderWidth: 1.5, borderColor: c.white15, alignItems: "center", justifyContent: "center", backgroundColor: c.glassSubtle },
  boxOn: { backgroundColor: c.brandSecondary, borderColor: c.accentBlue },
  checkText: { flex: 1, color: c.onSurfaceSecondary, fontSize: 14, fontWeight: "500" },
  verify: { flex: 1, gap: 20 },
  quiz: { gap: 10, padding: 16, borderRadius: 20, backgroundColor: c.glass, borderWidth: 1, borderColor: c.border },
  quizLabel: { color: c.textStrong, fontSize: 15, fontWeight: "700" },
  options: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  option: {
    width: "47%",
    flexGrow: 1,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: c.glassSubtle,
    borderWidth: 1,
    borderColor: c.border,
  },
  optionOn: { backgroundColor: c.brandTertiary, borderColor: c.accentBlue },
  optionWrong: { borderColor: c.accentRose, backgroundColor: c.roseSoft },
  optionText: { color: c.textSoft, fontSize: 15, fontWeight: "600", textAlign: "center" },
  optionTextOn: { color: c.textStrong },
  error: { color: c.accentRose, fontSize: 13, fontWeight: "500", textAlign: "center" },
}));
