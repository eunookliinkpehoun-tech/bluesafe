import { Text, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";

import { shortStamp, useI18n } from "@/src/i18n";
import type { UiTx } from "@/src/lib/entries";
import { fmtSigned } from "@/src/lib/format";
import { makeStyles } from "@/src/theme";
import { IconTile } from "./ui";

/** Transaction card from the dashboard / history mockups. */
export function TxRow({ tx, index, colored }: { tx: UiTx; index: number; colored?: boolean }) {
  const styles = useStyles();
  const { dict } = useI18n();
  const incoming = tx.sign === "+";
  return (
    <Animated.View entering={FadeInDown.delay(Math.min(index, 8) * 45).duration(380)} testID={`tx-row-${tx.id}`} style={styles.card}>
      <IconTile icon={tx.icon} highlight={colored && tx.highlight} size={colored ? 44 : 40} />
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
    padding: 14,
    borderRadius: 16,
    backgroundColor: c.glass,
    borderWidth: 1,
    borderColor: c.border,
    borderTopColor: c.glassHighlight,
  },
  texts: { flex: 1, minWidth: 0 },
  title: { color: c.textStrong, fontSize: 13, fontWeight: "600" },
  titleLarge: { fontSize: 14 },
  meta: { color: c.muted, fontSize: 11, marginTop: 3 },
  amount: { color: c.onSurface, fontSize: 13, fontWeight: "600", fontVariant: ["tabular-nums"] },
  amountLarge: { fontSize: 14 },
  amountIn: { color: c.accentEmerald, fontWeight: "700" },
}));
