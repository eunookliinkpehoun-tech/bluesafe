import Svg, { Circle, Defs, LinearGradient, Path, Stop } from "react-native-svg";

import { useTheme } from "@/src/theme";

/** Tirelire mark: a shield-shaped vault with a USDT coin slot. */
export function VaultLogo({ size = 96 }: { size?: number }) {
  const { colors } = useTheme();
  return (
    <Svg width={size} height={size} viewBox="0 0 64 64">
      <Defs>
        <LinearGradient id="vl" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor={colors.accentSky} />
          <Stop offset="0.5" stopColor={colors.brandPrimary} />
          <Stop offset="1" stopColor={colors.accentIndigo} />
        </LinearGradient>
        <LinearGradient id="vs" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={colors.textStrong} stopOpacity={0.35} />
          <Stop offset="1" stopColor={colors.textStrong} stopOpacity={0} />
        </LinearGradient>
      </Defs>
      <Path d="M32 4L10 13v16c0 14 9.5 26.5 22 31 12.5-4.5 22-17 22-31V13L32 4z" fill="url(#vl)" />
      <Path d="M32 4L10 13v16c0 6 1.8 11.7 4.8 16.4C25 30 40 18 52 14.2L32 4z" fill="url(#vs)" />
      <Path d="M24 16h16" stroke={colors.canvas} strokeOpacity={0.55} strokeWidth={3} strokeLinecap="round" />
      <Circle cx="32" cy="33" r="10.5" fill="none" stroke={colors.textStrong} strokeWidth={2.4} />
      <Path d="M26.5 28.5h11M32 28.5v10.5" stroke={colors.textStrong} strokeWidth={2.6} strokeLinecap="round" />
      <Path d="M27 32.5c1.8.7 3.4 1 5 1s3.2-.3 5-1" stroke={colors.textStrong} strokeWidth={2} strokeLinecap="round" fill="none" />
    </Svg>
  );
}
