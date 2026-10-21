import { LinearGradient } from "expo-linear-gradient";
import type { ReactNode } from "react";
import { ActivityIndicator, Text, View, type StyleProp, type ViewStyle } from "react-native";

import { makeStyles, useTheme } from "@/src/theme";
import { Icon, type IconName } from "./Icon";
import { PressableScale } from "./PressableScale";

export function GlassCard({ style, children, testID }: { style?: StyleProp<ViewStyle>; children: ReactNode; testID?: string }) {
  const styles = useStyles();
  return (
    <View testID={testID} style={[styles.glass, style]}>
      {children}
    </View>
  );
}

export function IconTile({ icon, tint, size = 40, highlight }: { icon: IconName; tint?: string; size?: number; highlight?: boolean }) {
  const styles = useStyles();
  const { colors } = useTheme();
  const color = tint ?? (highlight ? colors.accentBlue : colors.textSoft);
  return (
    <View
      style={[
        styles.tile,
        { width: size, height: size, borderRadius: size * 0.3 },
        highlight && styles.tileHighlight,
        tint ? { backgroundColor: `${tint}1A`, borderColor: `${tint}4D` } : null,
      ]}
    >
      <Icon name={icon} size={size * 0.5} color={color} strokeWidth={1.8} />
    </View>
  );
}

type BtnProps = {
  label: string;
  onPress: () => void;
  testID: string;
  loading?: boolean;
  disabled?: boolean;
  icon?: IconName;
  style?: StyleProp<ViewStyle>;
};

export function PrimaryButton({ label, onPress, testID, loading, disabled, icon, style }: BtnProps) {
  const styles = useStyles();
  const { colors } = useTheme();
  return (
    <PressableScale testID={testID} onPress={onPress} disabled={disabled || loading} scaleTo={0.98} style={[styles.primaryWrap, style]}>
      <LinearGradient
        colors={[colors.brandSecondary, colors.brandPrimary, colors.accentSky]}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={styles.primary}
      >
        {loading ? (
          <ActivityIndicator color={colors.onBrandPrimary} />
        ) : (
          <>
            {icon ? <Icon name={icon} size={20} color={colors.onBrandPrimary} /> : null}
            <Text style={styles.primaryLabel}>{label}</Text>
          </>
        )}
      </LinearGradient>
    </PressableScale>
  );
}

export function GhostButton({ label, onPress, testID, icon, style, disabled }: BtnProps) {
  const styles = useStyles();
  const { colors } = useTheme();
  return (
    <PressableScale testID={testID} onPress={onPress} disabled={disabled} scaleTo={0.98} style={[styles.ghost, style]}>
      {icon ? <Icon name={icon} size={18} color={colors.textSoft} /> : null}
      <Text style={styles.ghostLabel}>{label}</Text>
    </PressableScale>
  );
}

export function CircleButton({
  icon,
  onPress,
  testID,
  size = 40,
  tint,
  label,
  badge,
}: {
  icon: IconName;
  onPress: () => void;
  testID: string;
  size?: number;
  tint?: string;
  label?: string;
  badge?: boolean;
}) {
  const styles = useStyles();
  const { colors } = useTheme();
  return (
    <PressableScale
      testID={testID}
      accessibilityLabel={label}
      onPress={onPress}
      style={[styles.circle, { width: size, height: size, borderRadius: size / 2 }]}
    >
      <Icon name={icon} size={size * 0.42} color={tint ?? colors.textSoft} />
      {badge ? <View style={styles.badge} /> : null}
    </PressableScale>
  );
}

export function ProgressBar({ value, colorsFrom, height = 6 }: { value: number; colorsFrom: [string, string]; height?: number }) {
  const styles = useStyles();
  return (
    <View style={[styles.track, { height, borderRadius: height }]}>
      <LinearGradient
        colors={colorsFrom}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={{ width: `${Math.max(0, Math.min(100, value))}%`, height: "100%", borderRadius: height }}
      />
    </View>
  );
}

export function SectionLabel({ children }: { children: string }) {
  const styles = useStyles();
  return <Text style={styles.section}>{children}</Text>;
}

const useStyles = makeStyles((c) => ({
  glass: {
    backgroundColor: c.glass,
    borderWidth: 1,
    borderColor: c.border,
    borderTopColor: c.glassHighlight,
    borderRadius: 16,
    shadowColor: c.canvas,
    shadowOpacity: 0.4,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
  },
  tile: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: c.iconTile,
    borderWidth: 1,
    borderColor: c.white10,
  },
  tileHighlight: { backgroundColor: c.blueSoft, borderColor: c.blueBorder },
  primaryWrap: {
    borderRadius: 16,
    shadowColor: c.brandPrimary,
    shadowOpacity: 0.45,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 6 },
  },
  primary: {
    height: 54,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: c.borderStrong,
  },
  primaryLabel: { color: c.onBrandPrimary, fontSize: 15, fontWeight: "600", letterSpacing: 0.2 },
  ghost: {
    height: 52,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingHorizontal: 20,
    backgroundColor: c.glassStrong,
    borderWidth: 1,
    borderColor: c.border,
    borderTopColor: c.glassHighlight,
  },
  ghostLabel: { color: c.onSurfaceSecondary, fontSize: 15, fontWeight: "500" },
  circle: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: c.glassCard,
    borderWidth: 1,
    borderColor: c.white10,
  },
  badge: {
    position: "absolute",
    top: 9,
    end: 10,
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: c.accentEmerald,
    borderWidth: 1,
    borderColor: c.canvas,
  },
  track: { width: "100%", backgroundColor: c.track, overflow: "hidden", borderWidth: 1, borderColor: c.divider },
  section: {
    color: c.muted,
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 1,
    textTransform: "uppercase",
    paddingHorizontal: 4,
  },
}));
