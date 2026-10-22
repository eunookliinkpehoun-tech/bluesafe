import { useEffect, useState } from "react";
import { Text, useWindowDimensions, View } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withSequence, withTiming } from "react-native-reanimated";

import { dirStyle, fonts, makeStyles, useTheme, webDir } from "@/src/theme";
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
  const { width, height } = useWindowDimensions();
  // Keypad shrinks on narrow or short phones and stays at 80pt keys elsewhere.
  const gridW = Math.min(300, width - 48);
  const keySize = Math.min(80, Math.floor((gridW - 32) / 3), Math.max(56, Math.floor((height - 330) / 4.4)));
  const keyBox = { width: keySize, height: keySize, borderRadius: keySize / 2 };
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
      <View style={[styles.grid, { width: gridW, rowGap: keySize < 72 ? 12 : 18 }, dirStyle("ltr")]} {...webDir("ltr")}>
        {KEYS.map((k, i) =>
          k ? (
            <PressableScale key={i} testID={`${testIDPrefix}-key-${k}`} onPress={() => press(k)} style={[styles.key, keyBox]} scaleTo={0.9}>
              {k === "del" ? <Icon name="backspace" size={26} color={colors.textSoft} strokeWidth={1.8} /> : <Text style={styles.keyText}>{k}</Text>}
            </PressableScale>
          ) : (
            <View key={i} style={keyBox} />
          ),
        )}
      </View>
    </View>
  );
}

const useStyles = makeStyles((c) => ({
  wrap: { alignItems: "center", width: "100%" },
  dots: { flexDirection: "row", gap: 18, height: 20, alignItems: "center" },
  dot: { width: 14, height: 14, borderRadius: 7, borderWidth: 1.5, borderColor: c.white15, backgroundColor: c.glassSubtle },
  dotFilled: {
    backgroundColor: c.accentSky,
    borderColor: c.accentSky,
    shadowColor: c.accentSky,
    shadowOpacity: 0.9,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 0 },
  },
  dotError: { borderColor: c.accentRose },
  error: { color: c.accentRose, fontSize: 13, fontWeight: "500", marginTop: 14, minHeight: 18, textAlign: "center" },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginTop: 20,
  },
  key: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: c.glassSubtle,
    borderWidth: 1,
    borderColor: c.border,
    borderTopColor: c.glassHighlight,
  },
  keyText: { color: c.textStrong, fontSize: 30, fontFamily: fonts.mono },
}));
