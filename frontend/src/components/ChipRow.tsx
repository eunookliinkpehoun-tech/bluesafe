import { ScrollView, Text } from "react-native";

import { makeStyles } from "@/src/theme";
import { PressableScale } from "./PressableScale";

export type ChipItem<K extends string | number> = { key: K; label: string };

/** Horizontal filter chips: one scrolling line, fixed 36pt chips inside a 56pt row. */
export function ChipRow<K extends string | number>({
  items,
  value,
  onChange,
  testIDPrefix,
}: {
  items: ChipItem<K>[];
  value: K;
  onChange: (k: K) => void;
  testIDPrefix: string;
}) {
  const styles = useStyles();
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.row}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      {items.map((it) => {
        const active = it.key === value;
        return (
          <PressableScale
            key={String(it.key)}
            testID={`${testIDPrefix}-${it.key}`}
            onPress={() => onChange(it.key)}
            style={[styles.chip, active && styles.chipActive]}
          >
            <Text style={[styles.label, active && styles.labelActive]} numberOfLines={1}>
              {it.label}
            </Text>
          </PressableScale>
        );
      })}
    </ScrollView>
  );
}

const useStyles = makeStyles((c) => ({
  row: { height: 56, flexGrow: 0 },
  content: { alignItems: "center", gap: 8, paddingHorizontal: 20 },
  chip: {
    height: 36,
    flexShrink: 0,
    paddingHorizontal: 16,
    borderRadius: 18,
    justifyContent: "center",
    backgroundColor: c.glassSubtle,
    borderWidth: 1,
    borderColor: c.border,
  },
  chipActive: {
    backgroundColor: c.brandTertiary,
    borderColor: c.borderStrong,
    shadowColor: c.brandPrimary,
    shadowOpacity: 0.3,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 0 },
  },
  label: { color: c.textSoft, fontSize: 12, fontWeight: "600" },
  labelActive: { color: c.textStrong },
}));
