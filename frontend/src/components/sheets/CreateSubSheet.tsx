import { useState } from "react";
import { ScrollView, Text, View } from "react-native";

import { Icon } from "@/src/components/Icon";
import { PressableScale } from "@/src/components/PressableScale";
import { Sheet } from "@/src/components/Sheet";
import { TextField } from "@/src/components/TextField";
import { useToast } from "@/src/components/Toast";
import { PrimaryButton } from "@/src/components/ui";
import { useVaultAction, useVaultView } from "@/src/hooks/useVault";
import { useI18n } from "@/src/i18n";
import { CATEGORY, CATEGORY_IDS } from "@/src/lib/categories";
import { parseAmount } from "@/src/lib/format";
import { makeStyles, useTheme } from "@/src/theme";

const LOCKS = [
  { key: "none", days: 0, label: "sheets.lockNone" },
  { key: "1m", days: 30, label: "sheets.lock1m" },
  { key: "3m", days: 91, label: "sheets.lock3m" },
  { key: "6m", days: 182, label: "sheets.lock6m" },
  { key: "1y", days: 365, label: "sheets.lock1y" },
];

export function CreateSubSheet({ onClose }: { onClose: () => void }) {
  const styles = useStyles();
  const { colors } = useTheme();
  const { t } = useI18n();
  const toast = useToast();
  const { view } = useVaultView();
  const { run, busy } = useVaultAction();
  const [name, setName] = useState("");
  const [category, setCategory] = useState(0);
  const [target, setTarget] = useState("");
  const [lock, setLock] = useState("none");
  if (!view) return null;

  const targetWei = target.trim() ? parseAmount(target) : 0n;
  const valid = name.trim().length > 0 && name.trim().length <= 48 && targetWei !== null;

  return (
    <Sheet title={t("sheets.createTitle")} onClose={onClose} testID="create-sub-sheet">
      <TextField
        testID="create-sub-name-input"
        label={t("sheets.nameLabel")}
        placeholder={t("sheets.namePh")}
        value={name}
        onChangeText={setName}
        maxLength={48}
      />
      <View style={styles.group}>
        <Text style={styles.label}>{t("sheets.category")}</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
          {CATEGORY_IDS.map((id) => {
            const cat = CATEGORY[id];
            const active = category === id;
            const tint = colors[cat.color] as string;
            return (
              <PressableScale
                key={id}
                testID={`create-sub-category-${id}`}
                onPress={() => setCategory(id)}
                style={[styles.cat, active && { borderColor: tint, backgroundColor: `${tint}1F` }]}
              >
                <Icon name={cat.icon} size={16} color={active ? tint : colors.muted} />
                <Text style={[styles.catText, active && { color: colors.textStrong }]}>{t(`subs.c${id}`)}</Text>
              </PressableScale>
            );
          })}
        </ScrollView>
      </View>
      <TextField
        testID="create-sub-target-input"
        label={`${t("sheets.target")} · ${t("common.optional")}`}
        placeholder="0.00"
        value={target}
        onChangeText={setTarget}
        keyboardType="decimal-pad"
      />
      <View style={styles.group}>
        <Text style={styles.label}>{t("sheets.lock")}</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
          {LOCKS.map((l) => (
            <PressableScale
              key={l.key}
              testID={`create-sub-lock-${l.key}`}
              onPress={() => setLock(l.key)}
              style={[styles.cat, lock === l.key && styles.lockActive]}
            >
              {l.days ? <Icon name="lock" size={14} color={lock === l.key ? colors.accentBlue : colors.muted} /> : null}
              <Text style={[styles.catText, lock === l.key && { color: colors.textStrong }]}>{t(l.label)}</Text>
            </PressableScale>
          ))}
        </ScrollView>
      </View>
      <PrimaryButton
        testID="create-sub-submit-button"
        label={busy ? t("sheets.sending") : t("sheets.createCta")}
        icon="plus"
        loading={busy}
        disabled={!valid}
        onPress={async () => {
          const days = LOCKS.find((l) => l.key === lock)?.days ?? 0;
          const unlockAt = days ? BigInt(Math.floor(Date.now() / 1000) + days * 86400) : 0n;
          const hash = await run(view.vault, "createSub", [name.trim(), category, targetWei ?? 0n, unlockAt]);
          if (hash) {
            toast.show(t("sheets.created"));
            onClose();
          }
        }}
      />
    </Sheet>
  );
}

const useStyles = makeStyles((c) => ({
  group: { gap: 8 },
  label: { color: c.muted, fontSize: 12, fontWeight: "500", paddingHorizontal: 2 },
  chips: { gap: 8, paddingVertical: 2 },
  cat: {
    height: 36,
    flexShrink: 0,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    borderRadius: 18,
    backgroundColor: c.glassSubtle,
    borderWidth: 1,
    borderColor: c.border,
  },
  catText: { color: c.textSoft, fontSize: 12, fontWeight: "600" },
  lockActive: { borderColor: c.borderStrong, backgroundColor: c.brandTertiary },
}));
