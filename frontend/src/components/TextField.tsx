import type { ReactNode } from "react";
import { Text, TextInput, View, type TextInputProps } from "react-native";

import { makeStyles, useTheme } from "@/src/theme";

type Props = TextInputProps & {
  label?: string;
  hint?: string;
  hintTone?: "muted" | "success" | "error";
  right?: ReactNode;
  left?: ReactNode;
  mono?: boolean;
  big?: boolean;
  testID: string;
};

export function TextField({ label, hint, hintTone = "muted", right, left, mono, big, style, testID, ...input }: Props) {
  const styles = useStyles();
  const { colors } = useTheme();
  return (
    <View style={styles.wrap}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <View style={[styles.box, big && styles.boxBig]}>
        {left}
        <TextInput
          testID={testID}
          placeholderTextColor={colors.textFaint}
          selectionColor={colors.brandPrimary}
          autoCorrect={false}
          style={[styles.input, mono && styles.mono, big && styles.big, style]}
          {...input}
        />
        {right}
      </View>
      {hint ? (
        <Text
          testID={`${testID}-hint`}
          style={[styles.hint, hintTone === "success" && styles.success, hintTone === "error" && styles.error]}
        >
          {hint}
        </Text>
      ) : null}
    </View>
  );
}

const useStyles = makeStyles((c) => ({
  wrap: { gap: 8 },
  label: { color: c.muted, fontSize: 12, fontWeight: "500", paddingHorizontal: 2 },
  box: {
    minHeight: 52,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 14,
    borderRadius: 16,
    backgroundColor: c.glassInput,
    borderWidth: 1,
    borderColor: c.white10,
  },
  boxBig: { minHeight: 64 },
  input: { flex: 1, color: c.textStrong, fontSize: 15, paddingVertical: 12, outlineStyle: "none" } as any,
  mono: { fontFamily: "monospace", fontSize: 13, letterSpacing: 0.3 },
  big: { fontSize: 26, fontWeight: "700", fontVariant: ["tabular-nums"] },
  hint: { color: c.muted, fontSize: 12, paddingHorizontal: 2 },
  success: { color: c.accentEmerald },
  error: { color: c.accentRose },
}));
