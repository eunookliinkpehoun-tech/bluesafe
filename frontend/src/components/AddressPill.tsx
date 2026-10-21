import * as Clipboard from "expo-clipboard";
import { useState } from "react";
import { Text, View } from "react-native";

import { useI18n } from "@/src/i18n";
import { shortAddr } from "@/src/lib/format";
import { makeStyles, useTheme } from "@/src/theme";
import { Icon } from "./Icon";
import { PressableScale } from "./PressableScale";

/** Dynamic-island style vault address pill with copy feedback (dashboard mockup). */
export function AddressPill({ address, demo }: { address: string; demo?: boolean }) {
  const styles = useStyles();
  const { colors } = useTheme();
  const { t } = useI18n();
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    await Clipboard.setStringAsync(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <View style={styles.wrap}>
      <PressableScale testID="wallet-address-pill" onPress={copy} style={styles.pill}>
        <View style={styles.dot} />
        <Text style={styles.text} testID="wallet-address-text">
          {copied ? t("common.copied") : shortAddr(address)}
        </Text>
        <Icon name={copied ? "check" : "copy"} size={14} color={copied ? colors.accentEmerald : colors.muted} strokeWidth={copied ? 2.5 : 2} />
        {demo ? (
          <View style={styles.demo}>
            <Text style={styles.demoText}>{t("common.demo")}</Text>
          </View>
        ) : null}
      </PressableScale>
    </View>
  );
}

const useStyles = makeStyles((c) => ({
  wrap: { alignItems: "center", paddingBottom: 12 },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 14,
    height: 32,
    borderRadius: 16,
    backgroundColor: c.glassCard,
    borderWidth: 1,
    borderColor: c.white10,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: c.accentEmerald,
    shadowColor: c.accentEmerald,
    shadowOpacity: 0.9,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 0 },
  },
  text: { color: c.onSurfaceSecondary, fontSize: 12, fontWeight: "500", letterSpacing: 0.4, fontVariant: ["tabular-nums"] },
  demo: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, backgroundColor: c.amberSoft },
  demoText: { color: c.accentAmber, fontSize: 9, fontWeight: "800", letterSpacing: 0.8 },
}));
