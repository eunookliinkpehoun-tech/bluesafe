import { Text, View } from "react-native";

import { Icon, type IconName } from "@/src/components/Icon";
import { PressableScale } from "@/src/components/PressableScale";
import { Sheet } from "@/src/components/Sheet";
import { useToast } from "@/src/components/Toast";
import { PrimaryButton } from "@/src/components/ui";
import { useVaultAction, useVaultView } from "@/src/hooks/useVault";
import { useI18n } from "@/src/i18n";
import { CATEGORY } from "@/src/lib/categories";
import { fmtUsd } from "@/src/lib/format";
import { useApp } from "@/src/state/app";
import { useOverlay } from "@/src/state/overlay";
import { makeStyles, useTheme } from "@/src/theme";

function useTargetSub() {
  const { target } = useOverlay();
  const { view } = useVaultView();
  return { view, sub: view?.subs.find((s) => s.id === target) };
}

/** "⋮" menu of a sub-account: activate, deposit, withdraw, delete. */
export function SubActionsSheet({ onClose }: { onClose: () => void }) {
  const styles = useStyles();
  const { colors } = useTheme();
  const { t, isRTL } = useI18n();
  const { open } = useOverlay();
  const { activeAccount, setActiveAccount } = useApp();
  const { sub } = useTargetSub();
  if (!sub) return null;
  const cat = CATEGORY[sub.category] ?? CATEGORY[4];
  const tint = colors[cat.color] as string;

  const actions: { key: string; icon: IconName; label: string; danger?: boolean; onPress: () => void }[] = [
    {
      key: "activate",
      icon: "checkCircle",
      label: t("subs.setActive"),
      onPress: () => {
        setActiveAccount(sub.id);
        onClose();
      },
    },
    {
      key: "deposit",
      icon: "deposit",
      label: t("subs.deposit"),
      onPress: () => {
        setActiveAccount(sub.id);
        open("subDeposit");
      },
    },
    {
      key: "withdraw",
      icon: "withdraw",
      label: t("subs.withdraw"),
      onPress: () => {
        setActiveAccount(sub.id);
        open("subWithdraw");
      },
    },
    { key: "delete", icon: "trash", label: t("subs.delete"), danger: true, onPress: () => open("subDelete") },
  ];

  return (
    <Sheet title={sub.name} onClose={onClose} testID="sub-actions-sheet">
      <View style={styles.head}>
        <View style={[styles.headIcon, { backgroundColor: `${tint}1F`, borderColor: `${tint}40` }]}>
          <Icon name={cat.icon} size={20} color={tint} />
        </View>
        <Text style={styles.headText}>{t(`subs.c${sub.category}`)}</Text>
        <Text style={styles.headAmount}>{fmtUsd(sub.balance)}</Text>
      </View>
      <View style={styles.list}>
        {actions
          .filter((a) => !(a.key === "activate" && activeAccount === sub.id))
          .map((a) => (
            <PressableScale key={a.key} testID={`sub-action-${a.key}`} onPress={a.onPress} scaleTo={0.98} style={styles.row}>
              <View style={[styles.rowIcon, a.danger && styles.rowIconDanger]}>
                <Icon name={a.icon} size={18} color={a.danger ? colors.accentRose : colors.accentBlue} />
              </View>
              <Text style={[styles.rowLabel, a.danger && styles.danger]}>{a.label}</Text>
              <Icon name={isRTL ? "chevronLeft" : "chevronRight"} size={16} color={colors.muted} />
            </PressableScale>
          ))}
      </View>
    </Sheet>
  );
}

/** Close a sub-account on-chain (the contract requires an empty balance). */
export function SubDeleteSheet({ onClose }: { onClose: () => void }) {
  const styles = useStyles();
  const { colors } = useTheme();
  const { t } = useI18n();
  const toast = useToast();
  const { activeAccount, setActiveAccount } = useApp();
  const { run, busy } = useVaultAction();
  const { view, sub } = useTargetSub();
  if (!view || !sub) return null;
  const notEmpty = sub.balance > 0n;

  return (
    <Sheet title={t("subs.deleteTitle", { name: sub.name })} onClose={onClose} testID="sub-delete-sheet">
      <View style={styles.warn}>
        <Icon name="alert" size={18} color={colors.accentRose} />
        <Text style={styles.warnText}>{notEmpty ? t("subs.deleteNeedsEmpty") : t("subs.deleteBody")}</Text>
      </View>
      <PrimaryButton
        testID="sub-delete-confirm"
        tone="danger"
        icon="trash"
        label={t("subs.deleteCta")}
        loading={busy}
        disabled={notEmpty}
        onPress={async () => {
          const hash = await run(view.vault, "closeSub", [BigInt(sub.id)]);
          if (hash) {
            if (activeAccount === sub.id) setActiveAccount("main");
            toast.show(t("subs.deleted"));
            onClose();
          }
        }}
      />
    </Sheet>
  );
}

const useStyles = makeStyles((c) => ({
  head: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14, borderRadius: 18, backgroundColor: c.glassSubtle, borderWidth: 1, borderColor: c.border },
  headIcon: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center", borderWidth: 1 },
  headText: { flex: 1, color: c.textSoft, fontSize: 14, fontWeight: "600" },
  headAmount: { color: c.textStrong, fontSize: 16, fontWeight: "700" },
  list: { gap: 8 },
  row: { flexDirection: "row", alignItems: "center", gap: 12, minHeight: 56, paddingHorizontal: 14, borderRadius: 18, backgroundColor: c.glassSubtle, borderWidth: 1, borderColor: c.border },
  rowIcon: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center", backgroundColor: c.blueSoft },
  rowIconDanger: { backgroundColor: c.roseSoft },
  rowLabel: { flex: 1, color: c.textStrong, fontSize: 15, fontWeight: "600" },
  danger: { color: c.accentRose },
  warn: { flexDirection: "row", gap: 12, padding: 16, borderRadius: 18, backgroundColor: c.roseSoft },
  warnText: { flex: 1, color: c.onSurfaceSecondary, fontSize: 14, lineHeight: 20 },
}));
