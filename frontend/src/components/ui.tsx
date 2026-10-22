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

/** Main call to action: blue to cyan gradient pill. Disabled is a calm solid surface, never a dimmed gradient. */
export function PrimaryButton({ label, onPress, testID, loading, disabled, icon, style, tone = "brand" }: BtnProps & { tone?: "brand" | "danger" }) {
  const styles = useStyles();
  const { colors } = useTheme();
  const off = disabled && !loading;
  const gradient: [string, string] = tone === "danger" ? [colors.accentRose, colors.error] : [colors.brandSecondary, colors.accentSky];
  return (
    <PressableScale
      testID={testID}
      onPress={onPress}
      disabled={disabled || loading}
      dimWhenDisabled={false}
      scaleTo={0.97}
      accessibilityRole="button"
      accessibilityState={{ disabled: !!(disabled || loading), busy: !!loading }}
      style={[styles.primaryWrap, !off && (tone === "danger" ? styles.dangerGlow : styles.primaryGlow), style]}
    >
      {off ? (
        <View style={[styles.primary, styles.primaryOff]}>
          {icon ? <Icon name={icon} size={20} color={colors.onDisabled} /> : null}
          <Text style={[styles.primaryLabel, styles.primaryLabelOff]} numberOfLines={1}>
            {label}
          </Text>
        </View>
      ) : (
        <LinearGradient colors={gradient} start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }} style={styles.primary}>
          <View style={styles.primarySheen} pointerEvents="none" />
          {loading ? <ActivityIndicator color={colors.onBrandPrimary} size="small" /> : icon ? <Icon name={icon} size={20} color={colors.onBrandPrimary} /> : null}
          <Text style={styles.primaryLabel} numberOfLines={1}>
            {label}
          </Text>
        </LinearGradient>
      )}
    </PressableScale>
  );
}

/** Secondary action: frosted glass pill with a hairline border. */
export function GhostButton({ label, onPress, testID, icon, style, disabled }: BtnProps) {
  const styles = useStyles();
  const { colors } = useTheme();
  return (
    <PressableScale testID={testID} onPress={onPress} disabled={disabled} scaleTo={0.97} accessibilityRole="button" style={[styles.ghost, style]}>
      {icon ? <Icon name={icon} size={18} color={colors.textStrong} /> : null}
      <Text style={styles.ghostLabel} numberOfLines={1}>
        {label}
      </Text>
    </PressableScale>
  );
}

/** Low emphasis text action (links like "Explore the demo", "Forgot PIN"). */
export function TextButton({
  label,
  onPress,
  testID,
  icon,
  tone = "accent",
  style,
}: {
  label: string;
  onPress: () => void;
  testID: string;
  icon?: IconName;
  tone?: "accent" | "muted" | "danger";
  style?: StyleProp<ViewStyle>;
}) {
  const styles = useStyles();
  const { colors } = useTheme();
  const color = tone === "danger" ? colors.accentRose : tone === "muted" ? colors.muted : colors.accentBlue;
  return (
    <PressableScale testID={testID} onPress={onPress} scaleTo={0.96} accessibilityRole="button" style={[styles.textBtn, style]}>
      {icon ? <Icon name={icon} size={16} color={color} /> : null}
      <Text style={[styles.textBtnLabel, { color }]}>{label}</Text>
    </PressableScale>
  );
}

/** Large glowing icon used at the top of onboarding screens. */
export function HeroIcon({ icon, tint }: { icon: IconName; tint?: string }) {
  const styles = useStyles();
  const { colors } = useTheme();
  const color = tint ?? colors.accentBlue;
  return (
    <View style={styles.heroWrap}>
      <View style={[styles.heroHalo, { backgroundColor: `${color}22`, shadowColor: color }]} />
      <View style={[styles.hero, { borderColor: `${color}55` }]}>
        <Icon name={icon} size={30} color={color} strokeWidth={1.8} />
      </View>
    </View>
  );
}

/** Segmented progress for multi-step flows (onboarding). */
export function StepBar({ step, total, label }: { step: number; total: number; label?: string }) {
  const styles = useStyles();
  return (
    <View style={styles.stepWrap} testID="step-bar">
      <View style={styles.stepRow}>
        {Array.from({ length: total }).map((_, i) => (
          <View key={i} style={[styles.stepSeg, i < step && styles.stepSegOn]} />
        ))}
      </View>
      {label ? <Text style={styles.stepLabel}>{label}</Text> : null}
    </View>
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
      <Icon name={icon} size={size * 0.45} color={tint ?? colors.textStrong} />
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
  primaryWrap: { borderRadius: 28 },
  primaryGlow: {
    shadowColor: c.brandPrimary,
    shadowOpacity: 0.45,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  dangerGlow: {
    shadowColor: c.accentRose,
    shadowOpacity: 0.35,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  primary: {
    height: 56,
    borderRadius: 28,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingHorizontal: 24,
    overflow: "hidden",
  },
  primarySheen: { position: "absolute", top: 0, start: 0, end: 0, height: "50%", backgroundColor: c.white10, opacity: 0.6 },
  primaryOff: { backgroundColor: c.disabled, borderWidth: 1, borderColor: c.border },
  primaryLabel: { color: c.onBrandPrimary, fontSize: 16, fontWeight: "700", letterSpacing: 0.2, textAlign: "center", flexShrink: 1 },
  primaryLabelOff: { color: c.onDisabled },
  ghost: {
    height: 56,
    borderRadius: 28,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingHorizontal: 24,
    backgroundColor: c.glassSubtle,
    borderWidth: 1,
    borderColor: c.white10,
    borderTopColor: c.glassHighlight,
  },
  ghostLabel: { color: c.textStrong, fontSize: 15, fontWeight: "700", textAlign: "center", flexShrink: 1 },
  textBtn: { minHeight: 44, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingHorizontal: 16, alignSelf: "center" },
  textBtnLabel: { fontSize: 14, fontWeight: "700", textAlign: "center" },
  heroWrap: { width: 96, height: 96, alignItems: "center", justifyContent: "center", alignSelf: "center" },
  heroHalo: {
    position: "absolute",
    width: 96,
    height: 96,
    borderRadius: 48,
    shadowOpacity: 0.8,
    shadowRadius: 30,
    shadowOffset: { width: 0, height: 0 },
  },
  hero: {
    width: 72,
    height: 72,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: c.glassStrong,
    borderWidth: 1,
  },
  stepWrap: { gap: 8 },
  stepRow: { flexDirection: "row", gap: 6 },
  stepSeg: { flex: 1, height: 4, borderRadius: 2, backgroundColor: c.white10 },
  stepSegOn: { backgroundColor: c.brandPrimary },
  stepLabel: { color: c.muted, fontSize: 12, fontWeight: "600", textAlign: "center" },
  circle: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: c.glassStrong,
    borderWidth: 1,
    borderColor: c.white10,
    borderTopColor: c.glassHighlight,
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
