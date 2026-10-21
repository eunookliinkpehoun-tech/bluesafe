import { useEffect, useState } from "react";
import { Text, View } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withSequence, withTiming } from "react-native-reanimated";

import { dirStyle, makeStyles, useTheme, webDir } from "@/src/theme";
import { Icon } from "./Icon";
import { PressableScale } from "./PressableScale";

const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "del"];

/** 6-digit PIN pad. Calls onComplete when full; parent resets via `resetKey`. */
export function PinPad({
  onComplete,
  error,
  resetKey,
  testIDPrefix = "pin",
}: {
  onComplete: (pin: string) => void;
  error?: string;
  resetKey: number;
  testIDPrefix?: string;
}) {
  const styles = useStyles();
  const { colors } = useTheme();
  const [pin, setPin] = useState("");
  const shake = useSharedValue(0);
  const shakeStyle = useAnimatedStyle(() => ({ transform: [{ translateX: shake.value }] }));

  useEffect(() => {
    setPin("");
    if (error) {
      shake.value = withSequence(
        withTiming(-10, { duration: 50 }),
        withTiming(10, { duration: 50 }),
        withTiming(-6, { duration: 50 }),
        withTiming(0, { duration: 50 }),
      );
    }
  }, [resetKey, error, shake]);

  const press = (k: string) => {
    if (k === "del") return setPin((p) => p.slice(0, -1));
    if (!k || pin.length >= 6) return;
    const next = pin + k;
    setPin(next);
    if (next.length === 6) setTimeout(() => onComplete(next), 120);
  };

  return (
    <View style={styles.wrap}>
      <Animated.View style={[styles.dots, dirStyle("ltr"), shakeStyle]} {...webDir("ltr")} testID={`${testIDPrefix}-dots`}>
        {Array.from({ length: 6 }).map((_, i) => (
          <View key={i} style={[styles.dot, i < pin.length && styles.dotFilled, error ? styles.dotError : null]} />
        ))}
      </Animated.View>
      <Text style={styles.error} testID={`${testIDPrefix}-error`}>
        {error ?? " "}
      </Text>
      <View style={[styles.grid, dirStyle("ltr")]} {...webDir("ltr")}>
        {KEYS.map((k, i) =>
          k ? (
            <PressableScale key={i} testID={`${testIDPrefix}-key-${k}`} onPress={() => press(k)} style={styles.key} scaleTo={0.9}>
              {k === "del" ? <Icon name="backspace" size={24} color={colors.textSoft} strokeWidth={1.8} /> : <Text style={styles.keyText}>{k}</Text>}
            </PressableScale>
          ) : (
            <View key={i} style={styles.keyEmpty} />
          ),
        )}
      </View>
    </View>
  );
}

const useStyles = makeStyles((c) => ({
  wrap: { alignItems: "center", width: "100%" },
  dots: { flexDirection: "row", gap: 16 },
  dot: { width: 14, height: 14, borderRadius: 7, borderWidth: 1.5, borderColor: c.white15, backgroundColor: c.glassSubtle },
  dotFilled: {
    backgroundColor: c.brandPrimary,
    borderColor: c.accentBlue,
    shadowColor: c.brandPrimary,
    shadowOpacity: 0.8,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 0 },
  },
  dotError: { borderColor: c.accentRose },
  error: { color: c.accentRose, fontSize: 13, marginTop: 16, minHeight: 18 },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    width: 288,
    justifyContent: "space-between",
    rowGap: 16,
    marginTop: 24,
  },
  key: {
    width: 80,
    height: 64,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: c.glassStrong,
    borderWidth: 1,
    borderColor: c.border,
    borderTopColor: c.glassHighlight,
  },
  keyEmpty: { width: 80, height: 64 },
  keyText: { color: c.textStrong, fontSize: 26, fontWeight: "500" },
}));
