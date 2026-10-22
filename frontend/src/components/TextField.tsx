import { useState, type ReactNode } from "react";
import { Text, TextInput, View, type TextInputProps } from "react-native";

import { fonts, makeStyles, useTheme } from "@/src/theme";

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

export function TextField({ label, hint, hintTone = "muted", right, left, mono, big, style, testID, onFocus, onBlur, ...input }: Props) {
  const styles = useStyles();
  const { colors } = useTheme();
  const [focused, setFocused] = useState(false);
  return (
    <View style={styles.wrap}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <View style={[styles.box, big && styles.boxBig, focused && styles.boxFocused, hintTone === "error" && !!hint && styles.boxError]}>
        {left}
        <TextInput
          testID={testID}
          placeholderTextColor={colors.textFaint}
          selectionColor={colors.brandPrimary}
          autoCorrect={false}
          onFocus={(e) => {
            setFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            onBlur?.(e);
          }}
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
  label: { color: c.textSoft, fontSize: 13, fontWeight: "500", paddingHorizontal: 4 },
  box: {
    minHeight: 56,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 16,
    borderRadius: 18,
    backgroundColor: c.glassInput,
    borderWidth: 1,
    borderColor: c.white10,
  },
  boxBig: { minHeight: 68 },
  boxFocused: { borderColor: c.borderStrong, backgroundColor: c.surfaceSecondary },
  boxError: { borderColor: c.roseSoft },
  input: { flex: 1, color: c.textStrong, fontSize: 16, paddingVertical: 14, outlineStyle: "none" } as any,
  mono: { fontFamily: fonts.mono, fontSize: 14, letterSpacing: 0.3 },
  big: { fontFamily: fonts.display, fontSize: 28, fontVariant: ["tabular-nums"] },
  hint: { color: c.muted, fontSize: 12, paddingHorizontal: 4 },
  success: { color: c.accentEmerald, fontWeight: "500" },
  error: { color: c.accentRose, fontWeight: "500" },
}));
