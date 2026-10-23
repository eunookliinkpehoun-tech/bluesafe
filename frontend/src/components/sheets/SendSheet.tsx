import * as Clipboard from "expo-clipboard";
import { useEffect, useState } from "react";
import { Linking, Text, View } from "react-native";
import Animated, { Easing, ZoomIn } from "react-native-reanimated";
import { getAddress, isAddress, type Address } from "viem";

import { Icon } from "@/src/components/Icon";
import { PressableScale } from "@/src/components/PressableScale";
import { Sheet } from "@/src/components/Sheet";
import { TextField } from "@/src/components/TextField";
import { GhostButton, PrimaryButton } from "@/src/components/ui";
import { useConfigQuery, useVaultAction, useVaultView } from "@/src/hooks/useVault";
import { useI18n } from "@/src/i18n";
import { resolveRecipient } from "@/src/lib/chain";
import { fmtUsd, parseAmount, toInput } from "@/src/lib/format";
import { makeStyles, useTheme } from "@/src/theme";

type Resolved = { address: Address; name?: string } | null;

export function SendSheet({ mode, onClose }: { mode: "transfer" | "withdraw"; onClose: () => void }) {
  const styles = useStyles();
  const { colors } = useTheme();
  const { t } = useI18n();
  const { view } = useVaultView();
  const { data: cfg } = useConfigQuery();
  const { run, busy } = useVaultAction();
  const [to, setTo] = useState("");
  const [amount, setAmount] = useState("");
  const [resolved, setResolved] = useState<Resolved>(null);
  const [checking, setChecking] = useState(false);
  const [done, setDone] = useState<string | null>(null);

  useEffect(() => {
    const value = to.trim();
    setResolved(null);
    if (!value) return;
    setChecking(true);
    const id = setTimeout(async () => {
      try {
        setResolved(view?.isDemo ? (isAddress(value) ? { address: getAddress(value) } : null) : await resolveRecipient(value));
      } catch {
        setResolved(null);
      } finally {
        setChecking(false);
      }
    }, 450);
    return () => clearTimeout(id);
  }, [to, view?.isDemo]);

  if (!view) return null;
  const wei = parseAmount(amount);
  const self = resolved?.address.toLowerCase() === view.vault.toLowerCase();
  const over = wei !== null && wei > view.available;
  const valid = !!resolved && !self && wei !== null && wei > 0n && !over;
  const title = mode === "transfer" ? t("sheets.transferTitle") : t("sheets.withdrawTitle");

  if (done) {
    return (
      <Sheet title={title} onClose={onClose} testID={`${mode}-sheet`}>
        <View style={styles.success} testID={`${mode}-success`}>
          <Animated.View entering={ZoomIn.duration(260).easing(Easing.out(Easing.cubic))} style={styles.successIcon}>
            <Icon name="check" size={36} color={colors.accentEmerald} strokeWidth={3} />
          </Animated.View>
          <Text style={styles.successTitle}>{t("sheets.success")}</Text>
          <Text style={styles.successBody}>{t("sheets.successBody", { amount: fmtUsd(wei ?? 0n) })}</Text>
        </View>
        {cfg ? (
          <GhostButton testID={`${mode}-explorer-button`} icon="external" label={t("common.viewOnExplorer")} onPress={() => Linking.openURL(`${cfg.explorer}/tx/${done}`)} />
        ) : null}
        <PrimaryButton testID={`${mode}-done-button`} label={t("common.done")} onPress={onClose} />
      </Sheet>
    );
  }

  const hint = checking
    ? t("common.loading")
    : to.trim() && !resolved
      ? t("sheets.invalidRecipient")
      : self
        ? t("errors.InvalidRecipient")
        : resolved?.name
          ? t("sheets.toVault", { name: resolved.name })
          : resolved
            ? t("sheets.externalWallet")
            : undefined;
  const hintTone = checking ? "muted" : !resolved || self ? "error" : "success";

  return (
    <Sheet title={title} onClose={onClose} testID={`${mode}-sheet`}>
      <TextField
        testID={`${mode}-recipient-input`}
        label={mode === "transfer" ? t("sheets.recipient") : t("sheets.withdrawTo")}
        placeholder={mode === "transfer" ? t("sheets.recipientPh") : t("sheets.withdrawPh")}
        value={to}
        onChangeText={setTo}
        autoCapitalize="none"
        mono
        hint={hint}
        hintTone={hintTone}
        right={
          <PressableScale testID={`${mode}-paste-button`} onPress={async () => setTo((await Clipboard.getStringAsync()).trim())} style={styles.inline}>
            <Text style={styles.inlineText}>{t("common.paste")}</Text>
          </PressableScale>
        }
      />
      <TextField
        testID={`${mode}-amount-input`}
        label={t("sheets.amount")}
        placeholder="0.00"
        value={amount}
        onChangeText={setAmount}
        keyboardType="decimal-pad"
        big
        hint={over ? t("errors.InsufficientFunds") : `${t("common.available")}: ${fmtUsd(view.available)}`}
        hintTone={over ? "error" : "muted"}
        left={<Text style={styles.currency}>$</Text>}
        right={
          <PressableScale testID={`${mode}-max-button`} onPress={() => setAmount(toInput(view.available))} style={styles.inline}>
            <Text style={styles.inlineText}>{t("common.max")}</Text>
          </PressableScale>
        }
      />
      <View style={styles.note}>
        <Icon name="zap" size={16} color={colors.accentCyan} />
        <Text style={styles.noteText}>{t("sheets.noFees")}</Text>
      </View>
      <PrimaryButton
        testID={`${mode}-submit-button`}
        label={busy ? t("sheets.sending") : t("sheets.send")}
        icon="key"
        loading={busy}
        disabled={!valid}
        onPress={async () => {
          if (!resolved || wei === null) return;
          const hash = await run(view.vault, mode, [resolved.address, wei]);
          if (hash) setDone(hash);
        }}
      />
    </Sheet>
  );
}

const useStyles = makeStyles((c) => ({
  inline: { paddingHorizontal: 12, height: 32, borderRadius: 10, justifyContent: "center", backgroundColor: c.white10, borderWidth: 1, borderColor: c.border },
  inlineText: { color: c.textStrong, fontSize: 12, fontWeight: "700" },
  currency: { color: c.muted, fontSize: 24, fontWeight: "600" },
  note: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 4 },
  noteText: { color: c.accentCyanSoft, fontSize: 12, fontWeight: "500" },
  success: { alignItems: "center", gap: 10, paddingVertical: 12 },
  successIcon: {
    width: 76,
    height: 76,
    borderRadius: 38,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: c.emeraldSoft,
    borderWidth: 1,
    borderColor: c.emeraldBorder,
  },
  successTitle: { color: c.textStrong, fontSize: 22, fontWeight: "700" },
  successBody: { color: c.muted, fontSize: 14, textAlign: "center" },
}));
