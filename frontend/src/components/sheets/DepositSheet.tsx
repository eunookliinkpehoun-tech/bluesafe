import * as Clipboard from "expo-clipboard";
import { Share, Text, View } from "react-native";
import QRCode from "react-native-qrcode-svg";

import { Icon } from "@/src/components/Icon";
import { Sheet } from "@/src/components/Sheet";
import { useToast } from "@/src/components/Toast";
import { GhostButton } from "@/src/components/ui";
import { useVaultView } from "@/src/hooks/useVault";
import { useI18n } from "@/src/i18n";
import { makeStyles, useTheme } from "@/src/theme";

export function DepositSheet({ onClose }: { onClose: () => void }) {
  const styles = useStyles();
  const { colors } = useTheme();
  const { t } = useI18n();
  const toast = useToast();
  const { view } = useVaultView();
  if (!view) return null;

  return (
    <Sheet title={t("sheets.depositTitle")} onClose={onClose} testID="deposit-sheet">
      <View style={styles.badge}>
        <View style={styles.dot} />
        <Text style={styles.badgeText}>{t("sheets.network")}</Text>
      </View>
      <View style={styles.qrWrap} testID="deposit-qr">
        <QRCode value={view.vault} size={188} backgroundColor={colors.qrBackground} color={colors.qrForeground} />
      </View>
      <View style={styles.addrBox}>
        <Text style={styles.addrLabel}>{t("sheets.yourAddress")}</Text>
        <Text selectable style={styles.addr} testID="deposit-address">
          {view.vault}
        </Text>
      </View>
      <View style={styles.actions}>
        <GhostButton
          testID="deposit-copy-button"
          icon="copy"
          label={t("common.copy")}
          style={styles.flex}
          onPress={async () => {
            await Clipboard.setStringAsync(view.vault);
            toast.show(t("common.copied"));
          }}
        />
        <GhostButton
          testID="deposit-share-button"
          icon="share"
          label={t("common.share")}
          style={styles.flex}
          onPress={() => Share.share({ message: view.vault })}
        />
      </View>
      <View style={styles.warn}>
        <Icon name="alert" size={18} color={colors.accentAmber} />
        <Text style={styles.warnText}>{t("sheets.depositWarn")}</Text>
      </View>
    </Sheet>
  );
}

const useStyles = makeStyles((c) => ({
  badge: {
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    height: 30,
    borderRadius: 15,
    backgroundColor: c.amberSoft,
  },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: c.accentAmber },
  badgeText: { color: c.accentAmber, fontSize: 12, fontWeight: "700" },
  qrWrap: {
    alignSelf: "center",
    padding: 14,
    borderRadius: 24,
    backgroundColor: c.qrBackground,
    shadowColor: c.brandPrimary,
    shadowOpacity: 0.45,
    shadowRadius: 30,
    shadowOffset: { width: 0, height: 0 },
  },
  addrBox: { padding: 14, borderRadius: 16, backgroundColor: c.glassInput, borderWidth: 1, borderColor: c.white10, gap: 6 },
  addrLabel: { color: c.muted, fontSize: 11, fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.8 },
  addr: { color: c.textStrong, fontSize: 13, fontFamily: "monospace", lineHeight: 20 },
  actions: { flexDirection: "row", gap: 12 },
  flex: { flex: 1 },
  warn: { flexDirection: "row", gap: 10, padding: 14, borderRadius: 16, backgroundColor: c.amberSoft },
  warnText: { flex: 1, color: c.onSurfaceSecondary, fontSize: 12, lineHeight: 18 },
}));
