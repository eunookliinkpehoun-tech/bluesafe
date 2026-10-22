import { Text, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";

import { shortStamp, useI18n } from "@/src/i18n";
import type { UiTx } from "@/src/lib/entries";
import { fmtSigned } from "@/src/lib/format";
import { fonts, makeStyles } from "@/src/theme";
import { IconTile } from "./ui";

/** Transaction card from the dashboard / history mockups. */
export function TxRow({ tx, index, colored }: { tx: UiTx; index: number; colored?: boolean }) {
  const styles = useStyles();
  const { dict } = useI18n();
  const incoming = tx.sign === "+";
  return (
    <Animated.View entering={FadeInDown.delay(Math.min(index, 8) * 45).duration(380)} testID={`tx-row-${tx.id}`} style={styles.card}>
      <IconTile icon={tx.icon} highlight={colored && tx.highlight} size={44} />
      <View style={styles.texts}>
        <Text style={[styles.title, colored && styles.titleLarge]} numberOfLines={1}>
          {tx.title}
        </Text>
        <Text style={styles.meta}>{shortStamp(tx.timestamp, dict)}</Text>
      </View>
      <Text style={[styles.amount, colored && styles.amountLarge, colored && incoming && styles.amountIn]} testID={`tx-amount-${tx.id}`}>
        {fmtSigned(tx.amount, tx.sign)}
      </Text>
    </Animated.View>
  );
}

const useStyles = makeStyles((c) => ({
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
    minHeight: 72,
    borderRadius: 20,
    backgroundColor: c.glass,
    borderWidth: 1,
    borderColor: c.border,
    borderTopColor: c.glassHighlight,
  },
  texts: { flex: 1, minWidth: 0 },
  title: { color: c.textStrong, fontSize: 15, fontWeight: "700" },
  titleLarge: { fontSize: 15 },
  meta: { color: c.muted, fontSize: 12, marginTop: 4 },
  amount: { color: c.onSurface, fontSize: 15, fontFamily: fonts.display, fontVariant: ["tabular-nums"] },
  amountLarge: { fontSize: 15 },
  amountIn: { color: c.accentEmerald },
}));
