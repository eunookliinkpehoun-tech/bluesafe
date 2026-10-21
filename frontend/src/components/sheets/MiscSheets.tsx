import * as Clipboard from "expo-clipboard";
import { useState } from "react";
import { Text, View } from "react-native";

import { Icon } from "@/src/components/Icon";
import { PinPad } from "@/src/components/PinPad";
import { PressableScale } from "@/src/components/PressableScale";
import { Sheet } from "@/src/components/Sheet";
import { useToast } from "@/src/components/Toast";
import { GhostButton, PrimaryButton } from "@/src/components/ui";
import { useConfigQuery, useTxs } from "@/src/hooks/useVault";
import { TxRow } from "@/src/components/TxRow";
import { useI18n } from "@/src/i18n";
import { useApp } from "@/src/state/app";
import { useOverlay, type Period } from "@/src/state/overlay";
import { makeStyles, useTheme } from "@/src/theme";
import { fmtAmount } from "@/src/lib/format";

export function NotificationsSheet({ onClose }: { onClose: () => void }) {
  const styles = useStyles();
  const { colors } = useTheme();
  const { t } = useI18n();
  const txs = useTxs("main").filter((x) => x.sign === "+").slice(0, 8);
  return (
    <Sheet title={t("sheets.notifTitle")} onClose={onClose} testID="notifications-sheet">
      {txs.length === 0 ? (
        <View style={styles.empty}>
          <Icon name="bell" size={28} color={colors.muted} />
          <Text style={styles.emptyText}>{t("sheets.notifEmpty")}</Text>
        </View>
      ) : (
        <View style={styles.list}>
          {txs.map((tx, i) => (
            <TxRow key={tx.id} tx={tx} index={i} colored />
          ))}
        </View>
      )}
    </Sheet>
  );
}

export function BackupSheet({ onClose }: { onClose: () => void }) {
  const styles = useStyles();
  const { t } = useI18n();
  const toast = useToast();
  const { verifyPin, getPhrase } = useApp();
  const [words, setWords] = useState<string[] | null>(null);
  const [error, setError] = useState<string | undefined>();
  const [resetKey, setResetKey] = useState(0);

  return (
    <Sheet title={t("sheets.backupTitle")} onClose={onClose} testID="backup-sheet">
      {words ? (
        <>
          <View style={styles.words} testID="backup-words">
            {words.map((w, i) => (
              <View key={i} style={styles.word}>
                <Text style={styles.wordIdx}>{i + 1}</Text>
                <Text style={styles.wordText}>{w}</Text>
              </View>
            ))}
          </View>
          <GhostButton
            testID="backup-copy-button"
            icon="copy"
            label={t("common.copy")}
            onPress={async () => {
              await Clipboard.setStringAsync(words.join(" "));
              toast.show(t("create.copyWarn"), "info");
            }}
          />
          <Text style={styles.note}>{t("create.warning1")}</Text>
        </>
      ) : (
        <>
          <Text style={styles.note}>{t("sheets.backupPin")}</Text>
          <PinPad
            testIDPrefix="backup-pin"
            resetKey={resetKey}
            error={error}
            onComplete={async (pin) => {
              if (await verifyPin(pin)) setWords((await getPhrase()).split(" "));
              else {
                setError(t("pin.wrong"));
                setResetKey((k) => k + 1);
              }
            }}
          />
        </>
      )}
    </Sheet>
  );
}

export function SignOutSheet({ onClose }: { onClose: () => void }) {
  const styles = useStyles();
  const { colors } = useTheme();
  const { t } = useI18n();
  const { signOut } = useApp();
  return (
    <Sheet title={t("sheets.signOutTitle")} onClose={onClose} testID="signout-sheet">
      <View style={styles.dangerBox}>
        <Icon name="alert" size={20} color={colors.accentRose} />
        <Text style={styles.dangerText}>{t("sheets.signOutBody")}</Text>
      </View>
      <PressableScale testID="signout-confirm-button" onPress={signOut} style={styles.dangerBtn} scaleTo={0.98}>
        <Icon name="logout" size={18} color={colors.accentRose} />
        <Text style={styles.dangerBtnText}>{t("sheets.signOutCta")}</Text>
      </PressableScale>
      <GhostButton testID="signout-cancel-button" label={t("common.cancel")} onPress={onClose} />
    </Sheet>
  );
}

export function TeamHelpSheet({ onClose }: { onClose: () => void }) {
  const styles = useStyles();
  const { t } = useI18n();
  const { data: cfg } = useConfigQuery();
  const price = cfg ? fmtAmount(BigInt(cfg.price)).replace(".00", "") : "50";
  const pctValue = cfg ? cfg.referralBps / 100 : 60;
  const steps = [t("team.help1"), t("team.help2", { price, pct: pctValue }), t("team.help3")];
  return (
    <Sheet title={t("team.helpTitle")} onClose={onClose} testID="team-help-sheet">
      {steps.map((s, i) => (
        <View key={i} style={styles.step}>
          <View style={styles.stepNum}>
            <Text style={styles.stepNumText}>{i + 1}</Text>
          </View>
          <Text style={styles.stepText}>{s}</Text>
        </View>
      ))}
      <PrimaryButton testID="team-help-close-button" label={t("common.done")} onPress={onClose} />
    </Sheet>
  );
}

export function PeriodSheet({ onClose }: { onClose: () => void }) {
  const styles = useStyles();
  const { colors } = useTheme();
  const { t } = useI18n();
  const { period, setPeriod } = useOverlay();
  const options: { key: Period; label: string }[] = [
    { key: "all", label: t("history.periodAll") },
    { key: "month", label: t("history.periodMonth") },
    { key: "week", label: t("history.periodWeek") },
  ];
  return (
    <Sheet title={t("history.periodTitle")} onClose={onClose} testID="period-sheet">
      {options.map((o) => (
        <PressableScale
          key={o.key}
          testID={`period-${o.key}`}
          onPress={() => {
            setPeriod(o.key);
            onClose();
          }}
          style={[styles.option, period === o.key && styles.optionActive]}
          scaleTo={0.98}
        >
          <Text style={styles.optionText}>{o.label}</Text>
          {period === o.key ? <Icon name="check" size={18} color={colors.accentBlue} strokeWidth={2.5} /> : null}
        </PressableScale>
      ))}
    </Sheet>
  );
}

const useStyles = makeStyles((c) => ({
  empty: { alignItems: "center", gap: 10, paddingVertical: 28 },
  emptyText: { color: c.muted, fontSize: 14 },
  list: { gap: 10 },
  words: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  word: {
    width: "31%",
    flexGrow: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    height: 40,
    paddingHorizontal: 10,
    borderRadius: 12,
    backgroundColor: c.glassInput,
    borderWidth: 1,
    borderColor: c.white10,
  },
  wordIdx: { color: c.textFaint, fontSize: 11, fontWeight: "700", width: 16 },
  wordText: { color: c.textStrong, fontSize: 13, fontWeight: "600" },
  note: { color: c.muted, fontSize: 13, textAlign: "center", lineHeight: 19 },
  dangerBox: { flexDirection: "row", gap: 10, padding: 14, borderRadius: 16, backgroundColor: c.roseSoft },
  dangerText: { flex: 1, color: c.onSurfaceSecondary, fontSize: 13, lineHeight: 19 },
  dangerBtn: {
    height: 52,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: c.roseSoft,
    borderWidth: 1,
    borderColor: c.accentRose,
  },
  dangerBtnText: { color: c.accentRose, fontSize: 15, fontWeight: "700" },
  step: { flexDirection: "row", gap: 12, alignItems: "flex-start" },
  stepNum: { width: 28, height: 28, borderRadius: 14, alignItems: "center", justifyContent: "center", backgroundColor: c.brandTertiary },
  stepNumText: { color: c.accentBlue, fontSize: 13, fontWeight: "800" },
  stepText: { flex: 1, color: c.onSurfaceSecondary, fontSize: 14, lineHeight: 21 },
  option: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    minHeight: 52,
    paddingHorizontal: 16,
    borderRadius: 16,
    backgroundColor: c.glassSubtle,
    borderWidth: 1,
    borderColor: c.border,
  },
  optionActive: { borderColor: c.borderStrong, backgroundColor: c.brandTertiary },
  optionText: { color: c.textStrong, fontSize: 15, fontWeight: "500" },
}));
