import { LinearGradient } from "expo-linear-gradient";
import { View } from "react-native";
import Svg, { Circle, Ellipse, Line, Path, Rect } from "react-native-svg";

import { makeStyles, useTheme } from "@/src/theme";

// Illustrated avatar from the dashboard mockup; colors derive from the wallet address.
const BGS = ["#93C5FD", "#A5B4FC", "#99F6E4", "#FDE68A", "#FBCFE8", "#C4B5FD"];
const HAIR = ["#EF4444", "#1E293B", "#F59E0B", "#7C3AED", "#0EA5E9", "#78350F"];
const SHIRT = ["#22C55E", "#3B82F6", "#F97316", "#E11D48", "#14B8A6", "#6366F1"];
const SKIN = ["#FCA5A5", "#FDBA74", "#D6A77A", "#A16207", "#FED7AA", "#E7B08A"];

function hash(seed: string) {
  let h = 5381;
  for (let i = 0; i < seed.length; i++) h = ((h << 5) + h + seed.charCodeAt(i)) >>> 0;
  return h;
}

export function Avatar({ seed, size = 44 }: { seed: string; size?: number }) {
  const styles = useStyles();
  const { colors } = useTheme();
  const h = hash(seed.toLowerCase());
  const pick = (arr: string[], shift: number) => arr[(h >>> shift) % arr.length];
  const glasses = (h >>> 12) % 3 !== 0;
  return (
    <LinearGradient
      colors={[colors.accentCyan, colors.brandPrimary, colors.accentIndigo]}
      start={{ x: 0, y: 1 }}
      end={{ x: 1, y: 0 }}
      style={[styles.ring, { width: size, height: size, borderRadius: size / 2 }]}
    >
      <View style={[styles.inner, { borderRadius: size / 2 }]}>
        <Svg width="100%" height="100%" viewBox="0 0 100 100">
          <Circle cx="50" cy="50" r="50" fill={pick(BGS, 0)} />
          <Path d="M26,92 C32,74 44,70 50,70 C56,70 68,74 74,92 Z" fill={pick(SHIRT, 4)} />
          <Path d="M42,66 L58,66 L55,77 L45,77 Z" fill={pick(SKIN, 8)} />
          <Ellipse cx="50" cy="52" rx="19" ry="21" fill={pick(SKIN, 8)} />
          <Path d="M31,44 C30,30 40,20 50,20 C60,20 68,28 68,40 C68,42 67,46 65,47 C63,38 58,35 48,35 C38,35 34,40 31,44 Z" fill={pick(HAIR, 16)} />
          <Path d="M36,25 C39,18 48,16 54,17 C51,19 46,23 44,27 Z" fill={pick(HAIR, 16)} opacity={0.85} />
          {glasses ? (
            <>
              <Rect x="36" y="46" width="11" height="9" rx="3" fill="none" stroke="#1E293B" strokeWidth="2.2" />
              <Rect x="53" y="46" width="11" height="9" rx="3" fill="none" stroke="#1E293B" strokeWidth="2.2" />
              <Line x1="47" y1="50" x2="53" y2="50" stroke="#1E293B" strokeWidth="2.2" />
            </>
          ) : (
            <>
              <Circle cx="42" cy="51" r="2.2" fill="#1E293B" />
              <Circle cx="58" cy="51" r="2.2" fill="#1E293B" />
            </>
          )}
          <Path d="M47,60 Q50,63 53,60" fill="none" stroke="#B91C1C" strokeLinecap="round" strokeWidth="1.8" />
        </Svg>
      </View>
    </LinearGradient>
  );
}

const useStyles = makeStyles((c) => ({
  ring: { padding: 1.5 },
  inner: { flex: 1, overflow: "hidden", backgroundColor: c.canvas },
}));
