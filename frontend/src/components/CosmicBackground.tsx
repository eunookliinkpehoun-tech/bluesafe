import { StyleSheet, useWindowDimensions, View } from "react-native";
import Svg, { Circle, Defs, Pattern, RadialGradient, Rect, Stop } from "react-native-svg";

import { useTheme, type ThemeColors } from "@/src/theme";

export type BgVariant = "dashboard" | "team" | "history" | "vaults" | "welcome";

type Orb = { x: number; y: number; r: number; c: keyof ThemeColors; o: number };

const VARIANTS: Record<BgVariant, Orb[]> = {
  dashboard: [
    { x: 0.8, y: 0.12, r: 0.62, c: "glowBright", o: 0.34 },
    { x: 0.1, y: 0.32, r: 0.5, c: "glowSky", o: 0.2 },
    { x: 0.5, y: 0.92, r: 0.6, c: "glowRoyal", o: 0.18 },
    { x: 0.95, y: 0.85, r: 0.42, c: "glowSky", o: 0.24 },
  ],
  team: [
    { x: 0.15, y: 0.12, r: 0.62, c: "glowDeep", o: 0.55 },
    { x: 0.85, y: 0.3, r: 0.5, c: "glowSky", o: 0.24 },
    { x: 0.4, y: 0.88, r: 0.6, c: "glowTeal", o: 0.24 },
  ],
  history: [
    { x: 0.88, y: 0.1, r: 0.6, c: "glowBright", o: 0.36 },
    { x: 0.08, y: 0.45, r: 0.55, c: "glowRoyal", o: 0.24 },
    { x: 0.8, y: 0.9, r: 0.45, c: "glowSky", o: 0.2 },
  ],
  vaults: [
    { x: 0.82, y: 0.08, r: 0.55, c: "glowBright", o: 0.3 },
    { x: 0.15, y: 0.45, r: 0.6, c: "glowDeep", o: 0.42 },
    { x: 0.65, y: 0.8, r: 0.55, c: "glowTeal", o: 0.24 },
    { x: 0.5, y: 1.02, r: 0.5, c: "glowBright", o: 0.32 },
  ],
  welcome: [
    { x: 0.5, y: 0.28, r: 0.75, c: "glowBright", o: 0.42 },
    { x: 0.05, y: 0.7, r: 0.55, c: "glowIndigo", o: 0.26 },
    { x: 0.95, y: 0.92, r: 0.55, c: "glowSky", o: 0.26 },
  ],
};

// Deterministic star field so the sky looks identical on every render.
const STARS = (() => {
  let seed = 7;
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  return Array.from({ length: 70 }, () => ({ x: rnd(), y: rnd(), r: 0.4 + rnd() * 1.1, o: 0.12 + rnd() * 0.5 }));
})();

export function CosmicBackground({ variant = "dashboard" }: { variant?: BgVariant }) {
  const { colors } = useTheme();
  const { width, height } = useWindowDimensions();
  const orbs = VARIANTS[variant];
  const base = Math.max(width, Math.min(height, width * 1.6));
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Svg width={width} height={height}>
        <Defs>
          {orbs.map((o, i) => (
            <RadialGradient key={i} id={`orb${i}`} cx="50%" cy="50%" r="50%">
              <Stop offset="0" stopColor={colors[o.c] as string} stopOpacity={o.o} />
              <Stop offset="0.55" stopColor={colors[o.c] as string} stopOpacity={o.o * 0.35} />
              <Stop offset="1" stopColor={colors[o.c] as string} stopOpacity={0} />
            </RadialGradient>
          ))}
          <Pattern id="dots" width={24} height={24} patternUnits="userSpaceOnUse">
            <Circle cx={1} cy={1} r={1} fill={colors.dot} fillOpacity={0.035} />
          </Pattern>
        </Defs>
        <Rect x={0} y={0} width={width} height={height} fill={colors.canvas} />
        {orbs.map((o, i) => (
          <Circle key={i} cx={o.x * width} cy={o.y * height} r={o.r * base} fill={`url(#orb${i})`} />
        ))}
        <Rect x={0} y={0} width={width} height={height} fill="url(#dots)" />
        {STARS.map((s, i) => (
          <Circle key={`s${i}`} cx={s.x * width} cy={s.y * height} r={s.r} fill={colors.dot} fillOpacity={s.o} />
        ))}
      </Svg>
    </View>
  );
}
