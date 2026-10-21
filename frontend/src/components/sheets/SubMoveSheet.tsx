import { useState } from "react";
import { Text, View } from "react-native";

import { Icon } from "@/src/components/Icon";
import { PressableScale } from "@/src/components/PressableScale";
import { Sheet } from "@/src/components/Sheet";
import { TextField } from "@/src/components/TextField";
import { useToast } from "@/src/components/Toast";
import { PrimaryButton } from "@/src/components/ui";
import { useActiveSub, useVaultAction, useVaultView } from "@/src/hooks/useVault";
import { dateLabel, useI18n } from "@/src/i18n";
import { fmtUsd, parseAmount, toInput } from "@/src/lib/format";
import { makeStyles, useTheme } from "@/src/theme";

/** Sub-account deposit (main -> sub) and withdraw (sub -> main). */
export function SubMoveSheet({ mode, onClose }: { mode: "allocate" | "release"; onClose: () => void }) {
  const styles = useStyles();
  const { colors } = useTheme();
  const { t, dict } = useI18n();
  const toast = useToast();
  const { view } = useVaultView();
  const sub = useActiveSub(view);
  const { run, busy } = useVaultAction();
  const [amount, setAmount] = useState("");
  if (!view || !sub) return null;

  const max = mode === "allocate" ? view.available : sub.balance;
  const locked = mode === "release" && sub.unlockAt * 1000 > Date.now();
  const wei = parseAmount(amount);
  const over = wei !== null && wei > max;
  const valid = !locked && wei !== null && wei > 0n && !over;
  const testID = mode === "allocate" ? "sub-deposit" : "sub-withdraw";

  return (
    <Sheet
      title={mode === "allocate" ? t("sheets.subDepositTitle", { name: sub.name }) : t("sheets.subWithdrawTitle", { name: sub.name })}
      onClose={onClose}
      testID={`${testID}-sheet`}
    >
      <Text style={styles.info}>
        {mode === "allocate" ? t("sheets.fromMain", { amount: fmtUsd(view.available) }) : t("sheets.toMain", { amount: fmtUsd(sub.balance) })}
      </Text>
      {locked ? (
        <View style={styles.warn} testID={`${testID}-locked`}>
          <Icon name="lock" size={18} color={colors.accentAmber} />
          <Text style={styles.warnText}>{t("sheets.lockedWarn", { date: dateLabel(sub.unlockAt, dict) })}</Text>
        </View>
      ) : null}
      <TextField
        testID={`${testID}-amount-input`}
        label={t("sheets.amount")}
        placeholder="0.00"
        value={amount}
        onChangeText={setAmount}
        keyboardType="decimal-pad"
        big
        editable={!locked}
        hint={over ? t("errors.InsufficientFunds") : undefined}
        hintTone="error"
        left={<Text style={styles.currency}>$</Text>}
        right={
          <PressableScale testID={`${testID}-max-button`} onPress={() => setAmount(toInput(max))} style={styles.inline}>
            <Text style={styles.inlineText}>{t("common.max")}</Text>
          </PressableScale>
        }
      />
      <PrimaryButton
        testID={`${testID}-submit-button`}
        label={busy ? t("sheets.sending") : t("sheets.send")}
        icon="key"
        loading={busy}
        disabled={!valid}
        onPress={async () => {
          if (wei === null) return;
          const hash = await run(view.vault, mode, [BigInt(sub.id), wei]);
          if (hash) {
            toast.show(t("sheets.moved", { amount: fmtUsd(wei) }));
            onClose();
          }
        }}
      />
    </Sheet>
  );
}

const useStyles = makeStyles((c) => ({
  info: { color: c.muted, fontSize: 13 },
  warn: { flexDirection: "row", gap: 10, padding: 14, borderRadius: 16, backgroundColor: c.amberSoft, alignItems: "center" },
  warnText: { flex: 1, color: c.onSurfaceSecondary, fontSize: 13 },
  inline: { paddingHorizontal: 12, height: 32, borderRadius: 10, justifyContent: "center", backgroundColor: c.white10, borderWidth: 1, borderColor: c.border },
  inlineText: { color: c.textStrong, fontSize: 12, fontWeight: "700" },
  currency: { color: c.muted, fontSize: 24, fontWeight: "600" },
}));
